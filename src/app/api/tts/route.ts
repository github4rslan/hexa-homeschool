import { NextResponse } from "next/server";
import {
  ELEVENLABS_API_BASE,
  ELEVENLABS_MODEL,
  ELEVENLABS_DEFAULT_VOICE_ID,
  getElevenLabsKey,
  AiConfigError,
} from "@/lib/ai/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ElevenLabs charges per character; keep narration bounded to lesson-sized text. */
const MAX_TTS_CHARS = 1200;

export async function POST(request: Request) {
  let body: { text?: unknown; voiceId?: unknown };
  try {
    body = (await request.json()) as { text?: unknown; voiceId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

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

  const voiceId =
    typeof body.voiceId === "string" && body.voiceId.trim()
      ? body.voiceId.trim()
      : ELEVENLABS_DEFAULT_VOICE_ID;

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
    const res = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[/api/tts] ElevenLabs error:", res.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: "Narration is temporarily unavailable." },
        { status: 502 },
      );
    }

    const audio = await res.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        // Identical text+voice yields identical audio — safe to cache briefly.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[/api/tts] request failed:", err);
    return NextResponse.json(
      { error: "Narration is temporarily unavailable." },
      { status: 502 },
    );
  }
}
