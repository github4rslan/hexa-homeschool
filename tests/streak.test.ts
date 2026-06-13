import { describe, expect, it } from "vitest";
import { computeStreak, utcDayIndex } from "@/lib/engine/streak";

const DAY = 24 * 60 * 60 * 1000;
// A fixed "now": 2026-06-13T12:00:00Z (mid-day so day bucketing is stable).
const NOW = Date.UTC(2026, 5, 13, 12, 0, 0);
const today = utcDayIndex(NOW);

/** Helper: ms timestamp for `daysAgo` whole UTC days before NOW. */
function daysAgo(n: number): number {
  return NOW - n * DAY;
}

describe("computeStreak", () => {
  it("is zero with no completions", () => {
    expect(computeStreak([], NOW)).toEqual({ current: 0, completedToday: false });
  });

  it("counts a single completion today as a streak of 1", () => {
    const r = computeStreak([daysAgo(0)], NOW);
    expect(r.current).toBe(1);
    expect(r.completedToday).toBe(true);
  });

  it("counts consecutive days", () => {
    const r = computeStreak([daysAgo(0), daysAgo(1), daysAgo(2)], NOW);
    expect(r.current).toBe(3);
    expect(r.completedToday).toBe(true);
  });

  it("stays live if the last completion was yesterday (not today)", () => {
    const r = computeStreak([daysAgo(1), daysAgo(2)], NOW);
    expect(r.current).toBe(2);
    expect(r.completedToday).toBe(false);
  });

  it("resets to zero if the last completion was 2+ days ago", () => {
    const r = computeStreak([daysAgo(2), daysAgo(3)], NOW);
    expect(r.current).toBe(0);
  });

  it("spans one missed day with the weekly grace allowance", () => {
    // active: today, yesterday, then a gap (day -2 missing), then day -3.
    const r = computeStreak([daysAgo(0), daysAgo(1), daysAgo(3)], NOW);
    // 3 active days counted (today, -1, -3); the missed -2 is spanned, not counted.
    expect(r.current).toBe(3);
  });

  it("breaks on a second gap within the same week", () => {
    // today, -1, [gap -2], -3, [gap -4], -5 — second gap exhausts grace.
    const r = computeStreak(
      [daysAgo(0), daysAgo(1), daysAgo(3), daysAgo(5)],
      NOW,
    );
    // today,-1 (2) + grace spans -2 → count -3 (3); then gap to -5 with no grace → stop
    expect(r.current).toBe(3);
  });

  it("does not break on a single big gap (more than 2 days) — that ends it", () => {
    const r = computeStreak([daysAgo(0), daysAgo(1), daysAgo(4)], NOW);
    // today,-1 then gap of 3 days to -4 → grace only spans a 1-day gap → stop
    expect(r.current).toBe(2);
  });

  it("dedupes multiple completions on the same day", () => {
    const r = computeStreak(
      [daysAgo(0), daysAgo(0) + 1000, daysAgo(1)],
      NOW,
    );
    expect(r.current).toBe(2);
  });

  it("handles unordered input", () => {
    const r = computeStreak([daysAgo(2), daysAgo(0), daysAgo(1)], NOW);
    expect(r.current).toBe(3);
  });

  it("refills grace after more than 7 days so a later single gap is spanned too", () => {
    // Active days at these offsets; missed days are -2 and -10 (>7 days apart).
    const ms = [0, 1, 3, 4, 5, 6, 7, 8, 9, 11].map((n) => daysAgo(n));
    const r = computeStreak(ms, NOW);
    // 10 active days, both single gaps spanned (grace refills after a week).
    expect(r.current).toBe(10);
  });

  it("buckets by UTC day regardless of intra-day time", () => {
    const earlyToday = Date.UTC(2026, 5, 13, 0, 30, 0);
    const lateToday = Date.UTC(2026, 5, 13, 23, 30, 0);
    const r = computeStreak([earlyToday, lateToday], NOW);
    expect(r.current).toBe(1);
  });
});
