/**
 * Pure helpers for the parent dashboard "This week" stat cards.
 *
 * Kept deterministic + IO-free so the copy stays honest and unit-testable — a
 * stat caption must never reassure the parent with a claim the number
 * contradicts (e.g. "within 45–60 min target" under a 3-minute average).
 */

/** The healthy per-lesson duration band, in seconds (45–60 minutes). */
export const LESSON_TIME_TARGET_MIN_SEC = 45 * 60;
export const LESSON_TIME_TARGET_MAX_SEC = 60 * 60;

/**
 * Honest caption for the "Avg lesson time" card given the average lesson
 * duration in seconds. Zero/negative = no lessons yet; otherwise the caption
 * states the real relation to the 45–60 minute target rather than always
 * claiming it is met.
 */
export function avgLessonTimeHint(avgSec: number): string {
  if (!avgSec || avgSec <= 0) return "no lessons yet";
  if (avgSec < LESSON_TIME_TARGET_MIN_SEC) return "below the 45–60 min target";
  if (avgSec > LESSON_TIME_TARGET_MAX_SEC) return "above the 45–60 min target";
  return "within 45–60 min target";
}
