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

/**
 * Stable identifier for the current mock-attempt period: the period start's ISO
 * date ("YYYY-MM-DD"). Stored on mock EvaluationDocs so a unique index can
 * enforce "one attempt per subject per period" atomically, rather than relying
 * on a read-then-write check that two concurrent submits can both pass. Derived
 * from the period window so it stays correct if the cadence changes.
 */
export function mockPeriodKey(weekStartIso: string): string {
  return periodWindowFromWeekStart(weekStartIso).start.toISOString().slice(0, 10);
}
