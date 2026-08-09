import { describe, expect, it } from "vitest";
import {
  scheduleFirstReview,
  nextReview,
  isReviewDue,
  dueReviewTopics,
  interleaveDueReviews,
  reviewDueCounts,
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

describe("interleaveDueReviews (F10 interleaved warm-up)", () => {
  const cand = (
    tag: string,
    subject: string,
    offsetDays: number | null,
  ) => ({
    tag,
    subject,
    nextReviewAt: offsetDays === null ? null : new Date(NOW + offsetDays * DAY),
  });

  it("round-robins across subjects instead of blocking one subject", () => {
    // Maths is most-overdue overall, but three maths topics shouldn't all run
    // back-to-back — science and english should be interleaved between them.
    const items = [
      cand("m1", "mathematics", -20),
      cand("m2", "mathematics", -18),
      cand("m3", "mathematics", -16),
      cand("s1", "science", -10),
      cand("e1", "english", -8),
    ];
    const out = interleaveDueReviews(items, NOW).map((x) => x.tag);
    // Most-overdue (m1) still leads (spacing preserved).
    expect(out[0]).toBe("m1");
    // The next two are NOT both maths — variety kicks in.
    expect(out.slice(1, 3).sort()).toEqual(["e1", "s1"]);
    // Every due topic still appears exactly once.
    expect(out.sort()).toEqual(["e1", "m1", "m2", "m3", "s1"]);
  });

  it("keeps the most-overdue item first even after interleaving", () => {
    const items = [
      cand("s1", "science", -3),
      cand("m1", "mathematics", -30), // clearly most overdue
      cand("m2", "mathematics", -25),
    ];
    expect(interleaveDueReviews(items, NOW)[0].tag).toBe("m1");
  });

  it("is deterministic and respects max", () => {
    const items = [
      cand("m1", "mathematics", -20),
      cand("s1", "science", -18),
      cand("m2", "mathematics", -16),
      cand("e1", "english", -14),
    ];
    const first = interleaveDueReviews(items, NOW, 3).map((x) => x.tag);
    const second = interleaveDueReviews(items, NOW, 3).map((x) => x.tag);
    expect(first).toEqual(second);
    expect(first.length).toBe(3);
    expect(first[0]).toBe("m1");
  });

  it("falls back to most-overdue order when only one subject is due", () => {
    const items = [
      cand("m2", "mathematics", -5),
      cand("m1", "mathematics", -12),
    ];
    expect(interleaveDueReviews(items, NOW).map((x) => x.tag)).toEqual([
      "m1",
      "m2",
    ]);
  });
});

describe("reviewDueCounts (F8) — parent digest review debt", () => {
  it("splits certified topics into overdue vs coming-due-this-week", () => {
    const dates = [
      new Date(NOW - 3 * DAY), // overdue (past)
      new Date(NOW - 1 * DAY), // overdue (past)
      null, // legacy unscheduled -> due now (overdue)
      new Date(NOW + 2 * DAY), // upcoming within the 7-day window
      new Date(NOW + 6 * DAY), // upcoming within the window
      new Date(NOW + 30 * DAY), // outside the window -> neither
    ];
    expect(reviewDueCounts(dates, NOW)).toEqual({ overdue: 3, upcoming: 2 });
  });

  it("returns zeros when nothing is due", () => {
    expect(reviewDueCounts([], NOW)).toEqual({ overdue: 0, upcoming: 0 });
    expect(
      reviewDueCounts([new Date(NOW + 45 * DAY)], NOW),
    ).toEqual({ overdue: 0, upcoming: 0 });
  });

  it("treats a topic due exactly now as overdue, not upcoming", () => {
    expect(reviewDueCounts([new Date(NOW)], NOW)).toEqual({
      overdue: 1,
      upcoming: 0,
    });
  });
});
