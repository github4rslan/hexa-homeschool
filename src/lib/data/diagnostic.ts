/**
 * Diagnostic Agent — adaptive engine (rule-based, Phase-1).
 *
 * Per Edway Technical Brief v2.0 (Agent 1): the Diagnostic Agent is a
 * RULE-BASED Item Response Theory (IRT) engine — NOT generative AI. It starts
 * at age-expected GCSE benchmarks and adapts difficulty based on responses:
 * consistent correct answers step difficulty up; errors step it down.
 *
 * Items are NO LONGER hardcoded here — they come from the `questions`
 * collection (kind=diagnostic), passed in as a pool. This module holds only
 * the pure adaptive helpers so it stays usable on both server and client.
 */

export type DiagnosticSubject = "mathematics" | "english" | "science";

export interface DiagnosticItem {
  id: string;
  subject: DiagnosticSubject;
  /** 1 (easiest) … 5 (hardest), maps loosely to working grade. */
  tier: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  topic: string;
}

export const DIAGNOSTIC_SUBJECTS: { id: DiagnosticSubject; label: string }[] = [
  { id: "mathematics", label: "Mathematics" },
  { id: "english", label: "English" },
  { id: "science", label: "Science" },
];

/** Tier (1–5) → approximate GCSE working-grade band shown to parents. */
export function tierToGrade(tier: number): string {
  const map: Record<number, string> = {
    1: "Grade 1–2",
    2: "Grade 3",
    3: "Grade 4–5",
    4: "Grade 6–7",
    5: "Grade 8–9",
  };
  return map[Math.max(1, Math.min(5, Math.round(tier)))] ?? "Grade 4–5";
}

export interface SubjectResult {
  subject: DiagnosticSubject;
  label: string;
  /** Estimated working tier (1–5), the IRT-style ability estimate. */
  estimatedTier: number;
  workingGrade: string;
  correct: number;
  answered: number;
  /** 0–100: readiness estimate. */
  readiness: number;
}

/**
 * Adaptive item picker. Operates on a PASSED-IN pool (the DB question bank),
 * returning the next unseen item at (or nearest to) the target tier for a
 * subject. Pure — no data source coupling.
 */
export function pickNextItem(
  pool: DiagnosticItem[],
  subject: DiagnosticSubject,
  targetTier: number,
  seenIds: Set<string>,
): DiagnosticItem | null {
  const available = pool.filter(
    (it) => it.subject === subject && !seenIds.has(it.id),
  );
  if (available.length === 0) return null;

  available.sort(
    (a, b) =>
      Math.abs(a.tier - targetTier) - Math.abs(b.tier - targetTier) ||
      a.tier - b.tier,
  );
  return available[0];
}

/** Size of a single difficulty step in the ability estimate. */
const TIER_STEP = 0.8;

export interface TierUpdate {
  /** The new ability estimate, clamped to [1, 5]. */
  tier: number;
  /** Running count of consecutive wrong answers (resets to 0 on a correct one). */
  downStreak: number;
}

/**
 * Update the ability estimate after a response (Brief: Agent 1 IRT rule).
 *
 * Difficulty steps DOWN only once TWO consecutive wrong answers have manifested
 * — a single slip never lowers the tier. Sustained correct answers step UP and
 * reset the down-streak. Clamped to the band-aware [1, 5] range.
 *
 * The caller threads `downStreak` back in on the next response (the runner
 * tracks it per subject).
 */
export function updateTier(
  currentTier: number,
  wasCorrect: boolean,
  downStreak = 0,
): TierUpdate {
  const clamp = (t: number) => Math.max(1, Math.min(5, t));

  if (wasCorrect) {
    return { tier: clamp(currentTier + TIER_STEP), downStreak: 0 };
  }

  // Wrong: only step down once this is the 2nd (or later) consecutive miss.
  const nextStreak = downStreak + 1;
  const tier = nextStreak >= 2 ? clamp(currentTier - TIER_STEP) : currentTier;
  return { tier, downStreak: nextStreak };
}
