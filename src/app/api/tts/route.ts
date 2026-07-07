import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ELEVENLABS_API_BASE,
  ELEVENLABS_MODEL,
  ELEVENLABS_DEFAULT_VOICE_ID,
  ELEVENLABS_VOICE_SETTINGS,
  narrationSpeedForKeyStage,
  getElevenLabsKey,
  AiConfigError,
} from "@/lib/ai/config";
import { currentParentId, findMediaByHash, recordMedia } from "@/lib/db/repo";
import {
  charAlignmentToWords,
  normalizeWordTimings,
  type CharAlignment,
  type WordTiming,
} from "@/lib/child/caption-timing";
import { rateLimit } from "@/lib/rate-limit";
import { parentCanUseAi, AI_ENTITLEMENT_ERROR } from "@/lib/billing/entitlement";
import {
  uploadBytes,
  getCloudinaryConfig,
  MediaConfigError,
} from "@/lib/media/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ElevenLabs charges per character; keep narration bounded to lesson-sized text. */
const MAX_TTS_CHARS = 1200;

/** Per-user budget — generous enough to narrate a lesson block by block. */
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Is Cloudinary configured? If not, we just stream bytes (no caching). */
function cloudinaryAvailable(): boolean {
  try {
    getCloudinaryConfig();
    return true;
  } catch (err) {
    if (err instanceof MediaConfigError) return false;
    throw err;
  }
}

async function audioResponse(bytes: ArrayBuffer): Promise<NextResponse> {
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

/**
 * Aligned response (Read-Along/karaoke path): audio as base64 plus per-word
 * timings. `words: null` means "audio yes, karaoke no" — the client degrades
 * to a per-step caption, never a broken highlight.
 */
function alignedResponse(
  bytes: ArrayBuffer,
  words: WordTiming[] | null,
): NextResponse {
  return NextResponse.json(
    { audio: Buffer.from(bytes).toString("base64"), words },
    { status: 200, headers: { "Cache-Control": "private, max-age=3600" } },
  );
}

/** Parse word timings cached on a media record; malformed → null (degrade). */
function storedWords(meta: Record<string, string> | undefined): WordTiming[] | null {
  const raw = meta?.words;
  if (!raw) return null;
  try {
    return normalizeWordTimings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: {
    text?: unknown;
    voiceId?: unknown;
    keyStage?: unknown;
    withAlignment?: unknown;
  };
  try {
    body = (await request.json()) as {
      text?: unknown;
      voiceId?: unknown;
      keyStage?: unknown;
      withAlignment?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  /** Karaoke-caption mode: return JSON (audio + word timings) instead of bytes. */
  const withAlignment = body.withAlignment === true;

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "'text' is required." }, { status: 400 });
  }
  if (text.length > MAX_TTS_CHARS) {
    return NextResponse.json(
      { error: `Text exceeds ${MAX_TTS_CHARS} characters.` },
      { status: 413 },
    );
  }

  // Tier gate on the paid ElevenLabs call (no-op while billing is unconfigured).
  if (!(await parentCanUseAi(parentId))) {
    return NextResponse.json({ error: AI_ENTITLEMENT_ERROR }, { status: 403 });
  }

  const limited = await rateLimit(
    `tts:${parentId}`,
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

  const voiceId =
    typeof body.voiceId === "string" && body.voiceId.trim()
      ? body.voiceId.trim()
      : ELEVENLABS_DEFAULT_VOICE_ID;
  const keyStage =
    typeof body.keyStage === "number" && [2, 3, 4].includes(body.keyStage)
      ? body.keyStage
      : undefined;
  const speed = narrationSpeedForKeyStage(keyStage);

  // Cache key includes every input that changes the generated audio.
  const contentHash = createHash("sha256")
    .update(
      `${ELEVENLABS_MODEL}:${voiceId}:${speed}:${JSON.stringify(ELEVENLABS_VOICE_SETTINGS)}:${text}`,
    )
    .digest("hex");

  const useCloud = cloudinaryAvailable();

  // 1) Cache hit → fetch the stored Cloudinary MP3 and return its bytes
  //    (aligned mode returns JSON with any word timings stored alongside;
  //    a cache entry generated without timings degrades to `words: null`
  //    rather than paying for a regeneration).
  if (useCloud) {
    try {
      const cached = await findMediaByHash("lesson_audio", contentHash);
      if (cached) {
        const hit = await fetch(cached.secure_url);
        if (hit.ok) {
          const bytes = await hit.arrayBuffer();
          return withAlignment
            ? alignedResponse(bytes, storedWords(cached.meta))
            : audioResponse(bytes);
        }
        // stale URL — fall through and regenerate
      }
    } catch (err) {
      console.error("[/api/tts] cache lookup failed (continuing):", err);
    }
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

  try {
    // Aligned mode calls the with-timestamps endpoint (same voice, model and
    // billing per character) so the SAME audio arrives with char-level timing.
    const endpoint = withAlignment
      ? `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/with-timestamps`
      : `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: withAlignment ? "application/json" : "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          ...ELEVENLABS_VOICE_SETTINGS,
          speed,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[/api/tts] ElevenLabs error:", res.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: "Narration is temporarily unavailable." },
        { status: 502 },
      );
    }

    let audio: ArrayBuffer;
    let words: WordTiming[] | null = null;
    if (withAlignment) {
      const data = (await res.json()) as {
        audio_base64?: string;
        alignment?: CharAlignment | null;
      };
      if (typeof data.audio_base64 !== "string" || !data.audio_base64) {
        return NextResponse.json(
          { error: "Narration is temporarily unavailable." },
          { status: 502 },
        );
      }
      const buf = Buffer.from(data.audio_base64, "base64");
      audio = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      words = data.alignment ? charAlignmentToWords(data.alignment) : null;
      if (words && words.length === 0) words = null;
    } else {
      audio = await res.arrayBuffer();
    }

    // 2) Cache miss → store to Cloudinary for reuse (best-effort, non-blocking
    //    on the response path). Word timings ride along on the media record so
    //    the next aligned request is a pure cache hit. Never fail the request
    //    if upload fails.
    if (useCloud) {
      const wordsJson = words ? JSON.stringify(words) : null;
      void uploadBytes({
        bytes: audio.slice(0),
        useCase: "lesson_audio",
        resourceType: "video", // audio is delivered as a video resource type
        authenticated: true,
        publicIdHint: contentHash.slice(0, 32),
        contentType: "audio/mpeg",
        filename: "audio.mp3",
      })
        .then((up) =>
          recordMedia({
            owner_id: null,
            use_case: "lesson_audio",
            folder: "hexa/audio",
            public_id: up.publicId,
            secure_url: up.secureUrl,
            resource_type: "video",
            is_public: false,
            content_hash: contentHash,
            ...(wordsJson ? { meta: { words: wordsJson } } : {}),
          }),
        )
        .catch((err) =>
          console.error("[/api/tts] cache store failed (ignored):", err),
        );
    }

    return withAlignment ? alignedResponse(audio, words) : audioResponse(audio);
  } catch (err) {
    console.error("[/api/tts] request failed:", err);
    return NextResponse.json(
      { error: "Narration is temporarily unavailable." },
      { status: 502 },
    );
  }
}
