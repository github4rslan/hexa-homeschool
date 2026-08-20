import "server-only";

/**
 * Tracks ElevenLabs TTS quota exhaustion so `/api/tts` can skip the network
 * round-trip (ElevenLabs call, then a Cloudinary cache-store attempt) once a
 * `quota_exceeded` 401 has confirmed the account has no credits left, instead
 * of retrying the same doomed call on every single narration request.
 *
 * Per-instance in-memory is fine here: this is a latency/cost optimisation,
 * not a correctness gate — worst case a fresh serverless instance pays one
 * more failed call before it learns the cooldown, and the client already
 * degrades gracefully to native speech synthesis either way.
 */

const COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes

let quotaExhaustedUntil = 0;

/** True while we're still confident ElevenLabs has no credits left. */
export function ttsQuotaExhausted(now = Date.now()): boolean {
  return now < quotaExhaustedUntil;
}

/** Call after a 401 `quota_exceeded` response to start (or extend) the cooldown. */
export function markTtsQuotaExhausted(now = Date.now()): void {
  quotaExhaustedUntil = now + COOLDOWN_MS;
}

/** Call after any successful ElevenLabs call to clear an active cooldown. */
export function clearTtsQuotaExhausted(): void {
  quotaExhaustedUntil = 0;
}

/** Detects the specific ElevenLabs "no credits left" response, not a generic 401. */
export function isQuotaExceeded(status: number, detail: string): boolean {
  return status === 401 && detail.includes("quota_exceeded");
}
