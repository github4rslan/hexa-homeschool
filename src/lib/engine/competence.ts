/**
 * Pure competence-write logic (B2, 2026-08-27).
 *
 * `certified_at` is the LA compliance portfolio's "Awarded {date}" evidence
 * and feeds the parent-facing "topics certified this week" counts. It must be
 * set ONLY the first time a topic is certified — a child re-entering an
 * already-certified topic (e.g. via "Practice more") and re-reaching mastery
 * must never silently move the certification date to today, or it corrupts
 * both the portfolio and the weekly stats. Mirrors the existing guard that
 * already protects the spaced-repetition schedule from the same re-run.
 */

export interface ExistingCompetence {
  state?: string;
  certified_at?: Date | null;
}

/**
 * Resolve the `certified_at` value to persist on a competence write.
 * - Not moving into "certified" → `null` (matches the existing non-certified shape).
 * - Freshly certified (no existing row, or existing row not yet certified) → now.
 * - Re-certifying an already-certified topic → the ORIGINAL `certified_at`
 *   (falling back to now only if a legacy row somehow has none).
 */
export function resolveCertifiedAt(
  state: string,
  existing: ExistingCompetence | null | undefined,
  nowMs: number = Date.now(),
): Date | null {
  if (state !== "certified") return null;
  if (existing?.state === "certified") {
    return existing.certified_at ?? new Date(nowMs);
  }
  return new Date(nowMs);
}

/** Whether a fresh review schedule should be (re)seeded on this write. */
export function isFreshCertification(
  state: string,
  existing: ExistingCompetence | null | undefined,
): boolean {
  return state === "certified" && existing?.state !== "certified";
}
