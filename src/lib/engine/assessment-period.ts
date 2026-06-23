/**
 * Assessment-period cadence (Assessment lock).
 *
 * A mock exam is ONE honest attempt per subject per period. The cadence lives
 * here as a single source of truth so it can change later (the brief says
 * "monthly"; the owner wants weekly — default weekly, aligned with the weekly
 * schedule's Monday anchor via `currentWeekStart()`).
 *
 * Pure + deterministic (no IO) so it's unit-testable; the repo supplies the
 * week-start ISO date.
 */

/** Length of one mock-attempt period, in days. Weekly by default. */
export const MOCK_PERIOD_DAYS = 7;

/**
 * The current period window [start, next) derived from a week-start ISO date
 * ("YYYY-MM-DD", a Monday). `start` is when this period's attempt counts from;
 * `next` is when the next attempt unlocks.
 */
export function periodWindowFromWeekStart(weekStartIso: string): {
  start: Date;
  next: Date;
} {
  const start = new Date(`${weekStartIso}T00:00:00.000Z`);
  const next = new Date(start.getTime() + MOCK_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  return { start, next };
}
