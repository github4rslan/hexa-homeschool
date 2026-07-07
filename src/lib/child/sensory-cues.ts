"use client";

/**
 * Gentle multi-sensory cues (Wave 8, Feature 8).
 *
 * One shared helper for the whole child experience: a soft, satisfying tap
 * sound on control presses (<150ms, synthesized with WebAudio — no asset to
 * download, no network), a low "landing" cue when a root settles on the number
 * line, a warm two-note confirm on a "your turn" success, and a tiny
 * `navigator.vibrate` buzz on mobile.
 *
 * Guardrails (all hard requirements):
 *  - OPT-OUT: `setCuesEnabled(false)` (the child's "Sounds & buzz" preference)
 *    silences everything.
 *  - FEATURE-DETECTED: no AudioContext ⇒ no sound; no `navigator.vibrate` ⇒ no
 *    buzz. Silent no-ops, never errors.
 *  - REDUCED MOTION: haptics are skipped entirely (a buzz IS motion).
 *  - DEBOUNCED: rapid taps never stack into noise.
 *
 * No analytics, no persistence here — the preference is read from the child's
 * record by the caller and pushed in via `setCuesEnabled`.
 */

/** Rapid presses within this window share one cue — never a clatter. */
export const CUE_DEBOUNCE_MS = 90;

/** Pure debounce decision, unit-testable without a browser. */
export function shouldFireCue(
  nowMs: number,
  lastCueMs: number,
  debounceMs: number = CUE_DEBOUNCE_MS,
): boolean {
  return nowMs - lastCueMs >= debounceMs;
}

let enabled = true;
let lastCueAt = 0;
let ctx: AudioContext | null = null;

/** The child's "Sounds & buzz" preference (default on; opt-out). */
export function setCuesEnabled(on: boolean): void {
  enabled = on;
}

export function cuesEnabled(): boolean {
  return enabled;
}

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  try {
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** One short, soft blip — the building block for every cue. */
function blip(input: {
  from: number;
  to: number;
  ms: number;
  gain?: number;
  type?: OscillatorType;
  delayMs?: number;
}): void {
  const audio = audioContext();
  if (!audio) return;
  try {
    const t0 = audio.currentTime + (input.delayMs ?? 0) / 1000;
    const seconds = input.ms / 1000;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = input.type ?? "sine";
    osc.frequency.setValueAtTime(input.from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(input.to, 1), t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(input.gain ?? 0.06, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  } catch {
    /* audio is a nicety — never let it throw into the lesson */
  }
}

function buzz(pattern: number | number[]): void {
  if (reducedMotion()) return; // a buzz IS motion
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

function fire(cue: () => void): void {
  if (!enabled) return;
  const now = Date.now();
  if (!shouldFireCue(now, lastCueAt)) return;
  lastCueAt = now;
  cue();
}

/** Control press (See it, Play, Step, Replay, "your turn" submit): one clean, soft pop. */
export function tapCue(): void {
  fire(() => {
    blip({ from: 1050, to: 660, ms: 70, gain: 0.055, type: "triangle" });
    buzz(10);
  });
}

/** A key beat lands (a root settles on the number line, a factor snaps in). */
export function landCue(): void {
  fire(() => {
    blip({ from: 520, to: 300, ms: 110, gain: 0.05 });
    buzz(14);
  });
}

/** "Your turn" success: a warm two-note confirm — celebratory, never loud. */
export function successCue(): void {
  fire(() => {
    blip({ from: 660, to: 660, ms: 90, gain: 0.05 });
    blip({ from: 880, to: 880, ms: 130, gain: 0.05, delayMs: 95 });
    buzz([12, 40, 12]);
  });
}
