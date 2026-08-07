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
