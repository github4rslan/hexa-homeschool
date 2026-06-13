/**
 * Spaced-repetition scheduling — pure interval logic.
 *
 * On certification a topic's first review is scheduled at +7 days. A correct
 * review doubles the interval (capped at 90 days); an incorrect review resets
 * the interval to 7 days and flags the topic as needing a refresh. An incorrect
 * review NEVER demotes certification — certification is permanent; only the
 * review cadence changes. Legacy certified rows (no schedule) are treated as
 * due now with a 7-day interval.
 */

export const FIRST_REVIEW_DAYS = 7;
export const MIN_INTERVAL_DAYS = 7;
export const MAX_INTERVAL_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReviewSchedule {
  intervalDays: number;
  nextReviewAt: Date;
}

/** Schedule the first review when a topic is freshly certified. */
export function scheduleFirstReview(nowMs: number = Date.now()): ReviewSchedule {
  return {
    intervalDays: FIRST_REVIEW_DAYS,
    nextReviewAt: new Date(nowMs + FIRST_REVIEW_DAYS * DAY_MS),
  };
}

/**
 * Next schedule after a review attempt.
 * @param currentIntervalDays  the interval that was due (legacy/undefined → 7)
 * @param correct              whether the child got the review question right
 */
export function nextReview(
  currentIntervalDays: number | null | undefined,
  correct: boolean,
  nowMs: number = Date.now(),
): ReviewSchedule {
  const base =
    currentIntervalDays && currentIntervalDays > 0
      ? currentIntervalDays
      : MIN_INTERVAL_DAYS;

  const intervalDays = correct
    ? Math.min(MAX_INTERVAL_DAYS, base * 2)
    : MIN_INTERVAL_DAYS;

  return {
    intervalDays,
    nextReviewAt: new Date(nowMs + intervalDays * DAY_MS),
  };
}

/** A certified topic is due for review when next_review_at has passed (or is unset). */
export function isReviewDue(
  nextReviewAt: Date | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!nextReviewAt) return true; // legacy certified rows are due now
  return nextReviewAt.getTime() <= nowMs;
}
