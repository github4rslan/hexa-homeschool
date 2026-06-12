import { NextResponse } from "next/server";
import {
  ELEVENLABS_API_BASE,
  ELEVENLABS_STT_MODEL,
  getElevenLabsKey,
  AiConfigError,
} from "@/lib/ai/config";
import { checkDistress } from "@/lib/safety/escalation";
import {
  currentParentId,
  getActiveChild,
  recordEscalation,
  logInvocation,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { rateLimit } from "@/lib/rate-limit";
import { parentCanUseAi, AI_ENTITLEMENT_ERROR } from "@/lib/billing/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stt — transcribe a child's spoken answer (ElevenLabs Scribe).
 *
 * PRIVACY (Children's Code): the audio is processed transiently — it is held
 * in memory, forwarded to ElevenLabs once, and never written to disk,
 * Cloudinary, or the database. Only the resulting text leaves this handler,
 * and it flows into the existing answer pipeline where /api/tutor's distress
 * gate scans it again.
 *
 * Defence in depth: the distress matcher also runs on the transcript HERE,
 * because /api/tutor is only called on wrong answers — a spoken "I give up"
 * followed by a correct tap must still freeze and escalate. Over-triggering
 * is acceptable; missing real distress is not.
 */

/** Spoken answers are seconds long; 2 MB ≈ a minute of compressed audio. */
const MAX_AUDIO_BYTES = 2 * 1024 * 1024;

/** Per-user budget on the paid ElevenLabs call. */
const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let audio: Blob;
  try {
    const form = await request.formData();
    const entry = form.get("audio");
    if (!(entry instanceof Blob) || entry.size === 0) {
      return NextResponse.json(
        { error: "'audio' file is required." },
        { status: 400 },
      );
    }
    audio = entry;
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with an 'audio' file." },
      { status: 400 },
    );
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio exceeds maximum size." },
      { status: 413 },
    );
  }

  // Tier gate on the paid ElevenLabs call (no-op while billing is unconfigured).
  // Note: the spoken-distress scan happens on the transcript, which only
  // exists after this paid call — an unentitled account loses that scan, but
  // its typed answers still pass /api/tutor's free distress gate.
  if (!(await parentCanUseAi(parentId))) {
    return NextResponse.json({ error: AI_ENTITLEMENT_ERROR }, { status: 403 });
  }

  const limited = rateLimit(
    `stt:${parentId}`,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let key: string;
  try {
    key = getElevenLabsKey();
  } catch (err) {
    if (err instanceof AiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }

  let text: string;
  let latencyMs: number;
  try {
    const upstream = new FormData();
    upstream.append("file", audio, "answer.webm");
    upstream.append("model_id", ELEVENLABS_STT_MODEL);

    const started = Date.now();
    const res = await fetch(`${ELEVENLABS_API_BASE}/speech-to-text`, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: upstream,
    });
    latencyMs = Date.now() - started;

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[/api/stt] ElevenLabs error:", res.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: "Speech recognition is temporarily unavailable." },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { text?: unknown };
    text = typeof data.text === "string" ? data.text.trim() : "";
  } catch (err) {
    console.error("[/api/stt] request failed:", err);
    return NextResponse.json(
      { error: "Speech recognition is temporarily unavailable." },
      { status: 502 },
    );
  }

  const distress = checkDistress(text);

  // Telemetry mirrors the other agents (best-effort, never blocks the response).
  // Transcript content is never logged — only timing and the freeze outcome.
  void logInvocation({
    agent: "STT",
    model: ELEVENLABS_STT_MODEL,
    tokens: 0,
    latencyMs,
    blocked: distress.matched,
    reason: distress.matched ? "distress freeze" : undefined,
  });

  if (distress.matched) {
    try {
      const child = await getActiveChild(parentId, await readActiveChildId());
      if (child?._id) {
        await recordEscalation(child._id, {
          trigger: distress.trigger,
          severity: distress.severity,
          matchedText: text,
        });
      }
    } catch (err) {
      console.error("[/api/stt] escalation log failed (still freezing):", err);
    }
    return NextResponse.json(
      {
        frozen: true,
        message:
          "Let's take a pause. It's completely okay to feel stuck — a grown-up has been let know, and they can help you carry on whenever you're ready.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { text },
    { headers: { "Cache-Control": "no-store" } },
  );
}
