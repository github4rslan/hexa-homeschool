import { describe, expect, it } from "vitest";
import {
  scheduleFirstReview,
  nextReview,
  isReviewDue,
  dueReviewTopics,
  FIRST_REVIEW_DAYS,
  MIN_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
} from "@/lib/engine/spaced-repetition";

const NOW = Date.UTC(2026, 5, 13, 0, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

describe("spaced repetition scheduling", () => {
  it("schedules the first review at +7 days on certification", () => {
    const s = scheduleFirstReview(NOW);
    expect(s.intervalDays).toBe(FIRST_REVIEW_DAYS);
    expect(s.nextReviewAt.getTime()).toBe(NOW + 7 * DAY);
  });

  it("doubles the interval on a correct review", () => {
    const s = nextReview(7, true, NOW);
    expect(s.intervalDays).toBe(14);
    expect(s.nextReviewAt.getTime()).toBe(NOW + 14 * DAY);
  });

  it("keeps doubling on consecutive correct reviews", () => {
    let interval = 7;
    for (const expected of [14, 28, 56, 90 /* capped */]) {
      interval = nextReview(interval, true, NOW).intervalDays;
      expect(interval).toBe(expected);
    }
  });

  it("caps the interval at 90 days", () => {
    expect(nextReview(80, true, NOW).intervalDays).toBe(MAX_INTERVAL_DAYS);
    expect(nextReview(90, true, NOW).intervalDays).toBe(MAX_INTERVAL_DAYS);
  });

  it("resets to 7 days on an incorrect review", () => {
    expect(nextReview(56, false, NOW).intervalDays).toBe(MIN_INTERVAL_DAYS);
    expect(nextReview(7, false, NOW).intervalDays).toBe(MIN_INTERVAL_DAYS);
  });

  it("treats a missing/zero interval as the minimum", () => {
    expect(nextReview(null, true, NOW).intervalDays).toBe(14); // 7 → ×2
    expect(nextReview(undefined, false, NOW).intervalDays).toBe(7);
    expect(nextReview(0, true, NOW).intervalDays).toBe(14);
  });

  it("is due when next_review_at has passed or is unset", () => {
    expect(isReviewDue(null, NOW)).toBe(true);
    expect(isReviewDue(undefined, NOW)).toBe(true);
    expect(isReviewDue(new Date(NOW - 1), NOW)).toBe(true);
    expect(isReviewDue(new Date(NOW), NOW)).toBe(true);
    expect(isReviewDue(new Date(NOW + DAY), NOW)).toBe(false);
  });
});

describe("dueReviewTopics (spaced-repetition daily review selection)", () => {
  const cand = (tag: string, offsetDays: number | null) => ({
    tag,
    nextReviewAt: offsetDays === null ? null : new Date(NOW + offsetDays * DAY),
  });

  it("returns only due topics, ordered most-overdue first", () => {
    const items = [
      cand("a", -1), // 1 day overdue
      cand("b", 5), // not due yet
      cand("c", -10), // 10 days overdue (most)
      cand("d", -3), // 3 days overdue
    ];
    const out = dueReviewTopics(items, NOW);
    expect(out.map((x) => x.tag)).toEqual(["c", "d", "a"]);
  });

  it("puts legacy (no-schedule) certified rows at the front", () => {
    const items = [cand("old", -2), cand("legacy", null)];
    const out = dueReviewTopics(items, NOW);
    expect(out[0].tag).toBe("legacy");
    expect(out.map((x) => x.tag)).toEqual(["legacy", "old"]);
  });

  it("caps to `max` when provided", () => {
    const items = [cand("a", -1), cand("b", -2), cand("c", -3)];
    expect(dueReviewTopics(items, NOW, 2).map((x) => x.tag)).toEqual(["c", "b"]);
  });

  it("returns nothing when no topic is due", () => {
    expect(dueReviewTopics([cand("a", 3), cand("b", 10)], NOW)).toEqual([]);
  });
});
