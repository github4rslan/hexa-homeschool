import { describe, it, expect } from "vitest";
import {
  avgLessonTimeHint,
  LESSON_TIME_TARGET_MIN_SEC,
  LESSON_TIME_TARGET_MAX_SEC,
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
