/**
 * Pure helpers for the parent dashboard "This week" stat cards.
 *
 * Kept deterministic + IO-free so the copy stays honest and unit-testable — a
 * stat caption must never reassure the parent with a claim the number
 * contradicts (e.g. "within 45–60 min target" under a 3-minute average).
 */

/**
 * The healthy duration band for one Edway lesson, in seconds (8–20 minutes).
 *
 * An Edway lesson is a focused interactive **quest** (Explainer → a few
 * practice questions → a 3-question mastery check), designed to take roughly
 * 8–20 minutes — not a 45–60 minute sit-down. The band is calibrated to that
 * short-quest reality so the caption reflects genuine engagement instead of
 * telling every real family they are perpetually "below target".
 */
export const LESSON_TIME_TARGET_MIN_SEC = 8 * 60;
export const LESSON_TIME_TARGET_MAX_SEC = 20 * 60;

/**
 * Honest caption for the "Avg lesson time" card given the average lesson
 * duration in seconds. Zero/negative = no lessons yet; otherwise the caption
 * states the real relation to the 8–20 minute quest band rather than always
 * claiming it is met.
 */
export function avgLessonTimeHint(avgSec: number): string {
  if (!avgSec || avgSec <= 0) return "no lessons yet";
  if (avgSec < LESSON_TIME_TARGET_MIN_SEC) return "below the 8–20 min target";
  if (avgSec > LESSON_TIME_TARGET_MAX_SEC) return "above the 8–20 min target";
  return "within 8–20 min target";
}

/**
 * Curriculum-mastery progress bar width, clamped to [0, 100]. `certified` is
 * the GCSE-only certified count (B2/F5: matching the compliance portfolio's
 * own convention) and `total` is the curriculum-size-aware GCSE topic count,
 * so in the normal case `certified` never exceeds `total`; the clamp stays as
 * a defensive floor/ceiling rather than a routinely-hit case. Pure.
 */
export function masteryProgressPercent(certified: number, total: number): number {
  if (!total || total <= 0) return 0;
  const raw = (certified / total) * 100;
  return Math.min(100, Math.max(0, raw));
}

/**
 * F5: the "Foundations" figure, pre-GCSE (KS2/KS3) topics certified, derived
 * as all-band certified minus GCSE-only certified. Kept as its own pure
 * helper (rather than inline subtraction at each call site) so the "never
 * negative" floor is asserted once and unit-tested, and so this figure is
 * always computed the same way everywhere it's shown, never re-blended into
 * the GCSE-only count it's deliberately kept separate from.
 */
export function foundationsCertifiedCount(
  allBandCertified: number,
  gcseCertified: number,
): number {
  return Math.max(0, allBandCertified - gcseCertified);
}
