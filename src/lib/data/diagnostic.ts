/**
 * Diagnostic Agent — adaptive engine (rule-based, Phase-1).
 *
 * Per HEXA Technical Brief v2.0 (Agent 1): the Diagnostic Agent is a
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

/**
 * Update the ability estimate after a response.
 * Correct → nudge up; incorrect → nudge down. Clamped to [1, 5].
 */
export function updateTier(currentTier: number, wasCorrect: boolean): number {
  const delta = wasCorrect ? 0.8 : -0.8;
  return Math.max(1, Math.min(5, currentTier + delta));
}
