/**
 * Streak computation — pure, deterministic, timezone-explicit.
 *
 * A streak is the run of consecutive days (ending today or yesterday) on which
 * the child completed at least one lesson. Days are bucketed in UTC.
 *
 * GRACE RULE: one missed day per rolling 7-day window does not break the
 * streak. Walking back from the most recent active day, a single one-day gap is
 * "spanned" using that week's grace allowance so the run continues; a second
 * gap within seven days of the first ends the streak. The streak LENGTH counts
 * active days only — a spanned (missed) day keeps the streak alive but is not
 * itself counted. This means a skipped Sunday won't reset a child's streak, but
 * two misses close together will. Streaks reward presence; they never punish
 * absence, so there is no "losing" a streak in the UI — this only computes the
 * current length.
 *
 * The streak is considered "live" if its most recent active day is today or
 * yesterday (UTC); otherwise the current streak is 0 (a fresh start awaits).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC midnight epoch-day index for a timestamp. */
export function utcDayIndex(ms: number): number {
  return Math.floor(ms / DAY_MS);
}

export interface StreakResult {
  /** Current streak length in days (0 when not live). */
  current: number;
  /** Whether the streak counts today (a lesson was completed today, UTC). */
  completedToday: boolean;
}

/**
 * @param completionMs  timestamps (ms) of completed lessons, any order
 * @param nowMs         current time (ms); defaults to Date.now()
 */
export function computeStreak(
  completionMs: number[],
  nowMs: number = Date.now(),
): StreakResult {
  const today = utcDayIndex(nowMs);
  if (completionMs.length === 0) return { current: 0, completedToday: false };

  // Distinct active UTC days, descending.
  const days = Array.from(new Set(completionMs.map(utcDayIndex))).sort(
    (a, b) => b - a,
  );

  const completedToday = days[0] === today;

  // The streak must be "live": its latest active day is today or yesterday.
  const latest = days[0];
  if (latest < today - 1) return { current: 0, completedToday: false };

  let streak = 1;
  let prev = latest;
  // Grace tokens refill to 1 whenever we move more than 7 days past the last
  // time grace was spent — i.e. at most one spanned gap per rolling 7 days.
  let graceAvailable = true;
  let lastGraceDay = Infinity;

  for (let i = 1; i < days.length; i++) {
    const day = days[i];
    const gap = prev - day;

    // Refill grace if we've moved more than a week past the last grace use.
    if (lastGraceDay - day > 7) graceAvailable = true;

    if (gap === 1) {
      streak++; // adjacent active day
      prev = day;
      continue;
    }
    if (gap === 2 && graceAvailable) {
      // Span a single missing day using grace: the streak continues and we
      // count this active day, but the spanned (missed) day is NOT counted.
      streak++;
      graceAvailable = false;
      lastGraceDay = prev - 1; // the missed day
      prev = day;
      continue;
    }
    // Gap too large (or grace already spent) — streak ends here.
    break;
  }

  return { current: streak, completedToday };
}
