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

export interface ReviewCandidate {
  nextReviewAt: Date | null | undefined;
}

/** How far ahead the parent digest looks when counting "due this week". */
export const REVIEW_WINDOW_DAYS = 7;

export interface ReviewDueCounts {
  /** Certified topics already due (past next_review_at, or legacy unscheduled). */
  overdue: number;
  /** Certified topics coming due within the next REVIEW_WINDOW_DAYS (not yet due). */
  upcoming: number;
}

/**
 * Count how many certified topics are due / coming due for review, from their
 * `next_review_at` dates. Pure + deterministic; feeds the parent weekly digest's
 * "topics due for review" line (F8) — counts only, never a per-child profile.
 */
export function reviewDueCounts(
  nextReviewDates: (Date | null | undefined)[],
  nowMs: number = Date.now(),
): ReviewDueCounts {
  const windowEnd = nowMs + REVIEW_WINDOW_DAYS * DAY_MS;
  let overdue = 0;
  let upcoming = 0;
  for (const d of nextReviewDates) {
    if (isReviewDue(d, nowMs)) overdue += 1;
    else if (d && d.getTime() <= windowEnd) upcoming += 1;
  }
  return { overdue, upcoming };
}

/**
 * From a set of certified topics, select those due for review, ordered
 * **most-overdue first** so the child refreshes the shakiest memory soonest.
 * Legacy certified rows (no schedule) are treated as maximally overdue.
 * Optionally capped to `max`. Pure + deterministic — the daily review quest
 * and the warm-up both order through this.
 */
export function dueReviewTopics<T extends ReviewCandidate>(
  candidates: T[],
  nowMs: number = Date.now(),
  max?: number,
): T[] {
  const due = candidates
    .filter((c) => isReviewDue(c.nextReviewAt, nowMs))
    .map((c) => ({
      c,
      // How long past due (ms). No schedule ⇒ maximally overdue (front of queue).
      overdue: c.nextReviewAt
        ? nowMs - c.nextReviewAt.getTime()
        : Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => b.overdue - a.overdue)
    .map((x) => x.c);
  return max != null ? due.slice(0, max) : due;
}

export interface InterleaveCandidate extends ReviewCandidate {
  /** Grouping key for interleaving (subject, or a topic tag). */
  subject?: string;
}

/**
 * Order due reviews for INTERLEAVED practice (F10). Learning-science evidence
 * favours mixing subjects/topics in one short session over blocking a single
 * topic. This takes the most-overdue-first list from `dueReviewTopics` and
 * round-robins across distinct subject buckets, so consecutive warm-up items
 * vary. The global most-overdue item is always FIRST (spacing is never lost to
 * variety). Pure + deterministic: same inputs, same order — a refresh never
 * reshuffles mid-session. Candidates without a `subject` fall into one bucket
 * and keep the plain most-overdue order.
 */
export function interleaveDueReviews<T extends InterleaveCandidate>(
  candidates: T[],
  nowMs: number = Date.now(),
  max?: number,
): T[] {
  const ordered = dueReviewTopics(candidates, nowMs); // most-overdue first, all due
  if (ordered.length <= 1) {
    return max != null ? ordered.slice(0, max) : ordered;
  }

  // Bucket by subject, preserving most-overdue-first WITHIN each bucket. The
  // bucket insertion order follows `ordered`, so the first bucket holds the
  // global most-overdue item and therefore leads the round-robin.
  const buckets: T[][] = [];
  const byKey = new Map<string, T[]>();
  for (const c of ordered) {
    const key = c.subject ?? "__nosub__";
    let bucket = byKey.get(key);
    if (!bucket) {
      bucket = [];
      byKey.set(key, bucket);
      buckets.push(bucket);
    }
    bucket.push(c);
  }

  const result: T[] = [];
  const cursors = buckets.map(() => 0);
  let remaining = ordered.length;
  let b = 0;
  while (remaining > 0) {
    const idx = b % buckets.length;
    const cur = cursors[idx];
    if (cur < buckets[idx].length) {
      result.push(buckets[idx][cur]);
      cursors[idx] = cur + 1;
      remaining--;
    }
    b++;
  }
  return max != null ? result.slice(0, max) : result;
}
