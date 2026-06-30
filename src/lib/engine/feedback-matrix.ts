/**
 * Adaptive feedback matrix (Wave 7, Phase 3 — EDWAY brief §3).
 *
 * A single pure, deterministic helper that decides HOW to respond to a wrong
 * answer from cheap, locally-available signals (attempts, time, hints, streak,
 * session length) — no AI, no network. It chooses one of four pedagogical
 * responses from the brief, plus a default first-miss nudge:
 *
 *  - careless   : a fast slip right after a correct run → "slow down, re-read".
 *  - concept_gap: repeated misses / hints leaned on → escalate to a fuller
 *                 re-teach (worked example, then the optional cached AI layer).
 *  - language   : a slower struggle / wording trips them up → simpler wording
 *                 and more visual support.
 *  - attention  : a long pause on the item, or a long session → suggest a
 *                 gentle movement break, then re-engage with less text.
 *  - encourage  : the default warm nudge for an ordinary first miss.
 *
 * HARD INVARIANTS (mirrors .claude/rules/child-safety.md):
 *  - Pure + deterministic so it's identical on every device and unit-testable.
 *  - Copy here is human-authored, warm and never punitive — no "Wrong", no
 *    shame. This is educational support only; it builds NO psychological profile
 *    of the child (no clinical/behavioural scoring).
 *
 * Framework-free and import-safe from both client components and Vitest — keep
 * it that way (no "server-only", no React).
 */

export type FeedbackCategory =
  | "careless"
  | "concept_gap"
  | "language"
  | "attention"
  | "encourage";

export interface FeedbackSignals {
  /** Attempts made on THIS question so far (>= 1 after the first wrong try). */
  attempts: number;
  /** The attempt cap for this question (the worked answer shows at the cap). */
  maxAttempts: number;
  /** Consecutive correct answers immediately before this question (this phase). */
  priorCorrectStreak: number;
  /** Milliseconds the child spent on this question before answering. */
  msOnQuestion: number;
  /** Hints revealed on this question so far. */
  hintsUsed: number;
  /** Milliseconds since the lesson/session started (attention/fatigue cue). */
  sessionElapsedMs: number;
  /** Whether a targeted human-authored misconception line matched the choice. */
  hasMisconceptionHint: boolean;
}

export interface FeedbackResponse {
  category: FeedbackCategory;
  /** Warm, child-appropriate line — shown AND narrated (multi-modal). */
  message: string;
  /** Open the fuller re-teach (worked example + optional cached AI layer). */
  escalateReteach: boolean;
  /** Suggest a gentle movement break before re-engaging. */
  suggestBreak: boolean;
  /** Prefer simpler wording + more visual support for the next nudge. */
  simplify: boolean;
}

// ── Thresholds (named so the rules read clearly + stay tunable) ──

/** Under this, an answer came back so fast it reads as a careless slip. */
export const CARELESS_MAX_MS = 4_000;
/** A pause this long on one item suggests attention has drifted. */
export const ATTENTION_PAUSE_MS = 45_000;
/** A session this long suggests fatigue — offer a movement break. */
export const LATE_SESSION_MS = 20 * 60_000;
/** Hints leaned on this many times points to a genuine concept gap. */
export const CONCEPT_GAP_HINTS = 2;

/** Human-authored response copy per category (warm, never punitive). */
const COPY: Record<FeedbackCategory, string> = {
  careless:
    "So close! Let's slow right down and read it once more — what might you have missed?",
  concept_gap:
    "Let's look at this a different way together — we'll walk through it step by step.",
  language:
    "Let's make this simpler and take it one small piece at a time. You've got this.",
  attention:
    "Great effort. Let's take a quick stretch, then come back and try with fresh eyes.",
  encourage:
    "Not quite yet — have another go. You're closer than you think!",
};

function response(
  category: FeedbackCategory,
  opts: { escalateReteach?: boolean; suggestBreak?: boolean; simplify?: boolean } = {},
): FeedbackResponse {
  return {
    category,
    message: COPY[category],
    escalateReteach: opts.escalateReteach ?? false,
    suggestBreak: opts.suggestBreak ?? false,
    simplify: opts.simplify ?? false,
  };
}

/**
 * Decide the adaptive response for a wrong answer. First match wins, so the
 * order encodes priority: a true concept gap (tries/hints exhausted) is handled
 * before fatigue, fatigue before a one-off careless slip, and a slower struggle
 * maps to language support before falling back to the default nudge.
 */
export function decideFeedback(signals: FeedbackSignals): FeedbackResponse {
  const {
    attempts,
    maxAttempts,
    priorCorrectStreak,
    msOnQuestion,
    hintsUsed,
    sessionElapsedMs,
    hasMisconceptionHint,
  } = signals;

  // 1) Concept gap — they've used up their tries or leaned on the hints.
  //    This is the strongest signal of a real gap, so it wins outright and
  //    escalates to the fuller re-teach.
  if (attempts >= maxAttempts || hintsUsed >= CONCEPT_GAP_HINTS) {
    return response("concept_gap", { escalateReteach: true });
  }

  // 2) Attention / fatigue — a long stare at this item or a long session.
  //    Offer a movement break and keep the re-engagement short.
  if (msOnQuestion >= ATTENTION_PAUSE_MS || sessionElapsedMs >= LATE_SESSION_MS) {
    return response("attention", { suggestBreak: true });
  }

  // 3) Careless slip — a fast wrong answer right after a correct run.
  if (
    attempts === 1 &&
    msOnQuestion < CARELESS_MAX_MS &&
    priorCorrectStreak >= 1
  ) {
    return response("careless");
  }

  // 4) Language / vocabulary — a slower second-go struggle, or wording the
  //    child mis-read (a known misconception fired). Simplify + lean visual.
  if (attempts >= 2 || hasMisconceptionHint) {
    return response("language", { simplify: true });
  }

  // 5) Default — an ordinary first miss: a warm, encouraging nudge.
  return response("encourage");
}
