/**
 * Central AI configuration for HEXA's bounded Phase-1 agents.
 *
 * Design constraints from HEXA Technical Brief v2.0:
 *  - "Safety over Pacing Velocity": every generative payload faces automated
 *    validation before it can reach a child's interface.
 *  - The Teaching Agent enforces a 95% factual-confidence threshold; the
 *    Diagnostic Agent enforces 90%. Output below threshold is rejected and
 *    replaced with human-authored fallback content.
 *  - OpenAI is used for explanation + telemetry parsing only, never to invent
 *    the curriculum itself (questions come from vetted human-authored matrices).
 */

export const OPENAI_API_BASE = "https://api.openai.com/v1";

/** Default model for tutoring + checking. Fast, low-cost, more than capable. */
export const TEACHING_MODEL = "gpt-4o-mini";

/** Factual-confidence threshold the Teaching Checker must clear (brief: 95%). */
export const TEACHING_CONFIDENCE_THRESHOLD = 0.95;

/** ElevenLabs configuration for lesson narration. */
export const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
export const ELEVENLABS_MODEL = "eleven_multilingual_v2";
/** ElevenLabs Scribe — speech-to-text for spoken answers. */
export const ELEVENLABS_STT_MODEL = "scribe_v1";
/** "Sarah — Mature, Reassuring, Confident": an age-appropriate teaching voice. */
export const ELEVENLABS_DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new AiConfigError(
      "OPENAI_API_KEY is not set. Add it to .env.local (and Vercel) to enable the Teaching Agent.",
    );
  }
  return key;
}

export function getElevenLabsKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new AiConfigError(
      "ELEVENLABS_API_KEY is not set. Add it to .env.local (and Vercel) to enable lesson narration.",
    );
  }
  return key;
}

/** Thrown when a required AI key is missing — surfaced as a clean 503, not a crash. */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}
