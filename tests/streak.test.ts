import { describe, expect, it } from "vitest";
import { computeStreak, weekStrip } from "@/lib/engine/streak";

const DAY = 24 * 60 * 60 * 1000;
// A fixed "now": 2026-06-13T12:00:00Z (mid-day so day bucketing is stable).
const NOW = Date.UTC(2026, 5, 13, 12, 0, 0);

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

describe("weekStrip — child hub 7-day dots (F6)", () => {
  it("returns 7 days with exactly one 'today'", () => {
    const s = weekStrip([daysAgo(0)], NOW);
    expect(s).toHaveLength(7);
    expect(s.filter((d) => d.isToday)).toHaveLength(1);
  });

  it("fills today when a lesson was completed today", () => {
    const today = weekStrip([daysAgo(0)], NOW).find((d) => d.isToday)!;
    expect(today.active).toBe(true);
  });

  it("leaves today unfilled with no completion today", () => {
    const today = weekStrip([daysAgo(30)], NOW).find((d) => d.isToday)!;
    expect(today.active).toBe(false);
  });

  it("flags days after today this week as future and never active", () => {
    const s = weekStrip([daysAgo(0)], NOW);
    const todayIdx = s.findIndex((d) => d.isToday);
    for (let i = 0; i <= todayIdx; i++) expect(s[i].future).toBe(false);
    for (let i = todayIdx + 1; i < 7; i++) {
      expect(s[i].future).toBe(true);
      expect(s[i].active).toBe(false);
    }
  });

  it("fills an earlier active weekday within the same week", () => {
    const s = weekStrip([daysAgo(0), daysAgo(1)], NOW);
    const todayIdx = s.findIndex((d) => d.isToday);
    // A completion yesterday is in this week unless today is Monday (idx 0).
    if (todayIdx > 0) expect(s[todayIdx - 1].active).toBe(true);
  });
});
