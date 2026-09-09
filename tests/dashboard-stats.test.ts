import { describe, it, expect } from "vitest";
import {
  avgLessonTimeHint,
  LESSON_TIME_TARGET_MIN_SEC,
  LESSON_TIME_TARGET_MAX_SEC,
  masteryProgressPercent,
} from "@/lib/engine/dashboard-stats";

describe("avgLessonTimeHint", () => {
  it("reports no lessons for a zero/negative average", () => {
    expect(avgLessonTimeHint(0)).toBe("no lessons yet");
    expect(avgLessonTimeHint(-10)).toBe("no lessons yet");
  });

  it("reports below-target only for a genuinely tiny average", () => {
    // 3 minutes — genuinely short of a focused quest.
    expect(avgLessonTimeHint(3 * 60)).toBe("below the 8–20 min target");
  });

  it("reports within-target for a realistic short-quest duration (the B1 fix)", () => {
    // A ~2–15 min interactive quest is healthy, not "below target".
    expect(avgLessonTimeHint(LESSON_TIME_TARGET_MIN_SEC)).toBe(
      "within 8–20 min target",
    );
    expect(avgLessonTimeHint(12 * 60)).toBe("within 8–20 min target");
    expect(avgLessonTimeHint(LESSON_TIME_TARGET_MAX_SEC)).toBe(
      "within 8–20 min target",
    );
  });

  it("reports above-target when a lesson runs long", () => {
    expect(avgLessonTimeHint(35 * 60)).toBe("above the 8–20 min target");
  });
});

describe("masteryProgressPercent (B2, progress bar can never overflow)", () => {
  it("computes a plain percentage within range", () => {
    expect(masteryProgressPercent(5, 10)).toBe(50);
  });

  it("clamps to 100 when certified exceeds the total (the '31/30' bug)", () => {
    expect(masteryProgressPercent(31, 30)).toBe(100);
  });

  it("never goes negative and treats a zero/invalid total as 0%", () => {
    expect(masteryProgressPercent(5, 0)).toBe(0);
    expect(masteryProgressPercent(0, 10)).toBe(0);
  });

  it("competenceCertified <= competenceTotal always holds for the rendered percent", () => {
    for (const [certified, total] of [
      [0, 34],
      [34, 34],
      [46, 34],
      [1, 1],
    ]) {
      const pct = masteryProgressPercent(certified, total);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});
