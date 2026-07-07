/**
 * Central AI configuration for Edway's bounded Phase-1 agents.
 *
 * Design constraints from Edway Technical Brief v2.0:
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

/** Fully automated per-question educational visuals. */
export const VISUAL_IMAGE_MODEL = "gpt-image-1";
export const VISUAL_CHECKER_MODEL = "gpt-4o-mini";
export const VISUAL_CHECKER_CONFIDENCE_THRESHOLD = 0.95;

/** ElevenLabs configuration for lesson narration. */
export const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
/**
 * Turbo v2.5 — a high-quality, low-latency model. Naturalness AND speed matter
 * now that narration auto-plays on every step. The cache key includes the model
 * id, so this change simply warms a fresh cache.
 */
export const ELEVENLABS_MODEL = "eleven_turbo_v2_5";
/**
 * Baseline narration pace for child lessons (Wave 8, Phase 2: friendlier +
 * slower). ElevenLabs accepts 0.7–1.2; 0.80 is warm and unhurried without
 * droning. Keep this as the single by-ear tuning point for the whole lesson
 * experience. The cache key includes speed, so tuning never serves stale audio.
 */
export const ELEVENLABS_NARRATION_SPEED = 0.8;

/** Hard floor — narration must never drag below this (and never below 0.7). */
export const ELEVENLABS_MIN_NARRATION_SPEED = 0.72;

/**
 * Younger = slower: KS2 ≈ 0.76, KS3 = baseline 0.80, KS4 ≈ 0.84. A delivery
 * hint only; it never changes the lesson content or selected voice. Clamped
 * so no band can ever fall below the floor.
 */
export function narrationSpeedForKeyStage(keyStage?: number): number {
  const speed =
    keyStage === 2
      ? ELEVENLABS_NARRATION_SPEED - 0.04
      : keyStage === 4
        ? ELEVENLABS_NARRATION_SPEED + 0.04
        : ELEVENLABS_NARRATION_SPEED;
  return Math.max(ELEVENLABS_MIN_NARRATION_SPEED, speed);
}
/**
 * Warm, natural read settings (shared by /api/tts). Stability nudged down and
 * style up (Phase 2) for gentle expressiveness — friendly, never theatrical;
 * similarity kept high for the chosen voice, speaker boost for clarity. All
 * within ElevenLabs' accepted 0–1 ranges.
 */
export const ELEVENLABS_VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.8,
  style: 0.3,
  use_speaker_boost: true,
} as const;
/** ElevenLabs Scribe — speech-to-text for spoken answers. */
export const ELEVENLABS_STT_MODEL = "scribe_v1";
/** "Sarah — Mature, Reassuring, Confident": an age-appropriate teaching voice. */
export const ELEVENLABS_DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

/**
 * Curated, age-appropriate teaching voices a child may pick in "My stuff".
 * Kept short on purpose — choice without overwhelm. All are calm, clear and
 * warm; none are babyish. The first entry is the default.
 */
export const CHILD_VOICES: { id: string; label: string; blurb: string }[] = [
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah", blurb: "Calm and reassuring" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam", blurb: "Warm and steady" },
  { id: "ThT5KcBeYPX3keUQqHPh", label: "Dorothy", blurb: "Bright and friendly" },
];

/** Whether a voice id is one of the curated child voices (validation guard). */
export function isCuratedVoice(id: string): boolean {
  return CHILD_VOICES.some((v) => v.id === id);
}

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
