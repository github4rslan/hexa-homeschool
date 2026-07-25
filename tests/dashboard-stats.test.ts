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

  it("does not claim the target is met for a tiny average (the B1 bug)", () => {
    // 3 minutes — the reported false-reassurance case.
    expect(avgLessonTimeHint(3 * 60)).toBe("below the 45–60 min target");
  });

  it("reports within-target for a duration in the 45–60 min band", () => {
    expect(avgLessonTimeHint(LESSON_TIME_TARGET_MIN_SEC)).toBe(
      "within 45–60 min target",
    );
    expect(avgLessonTimeHint(50 * 60)).toBe("within 45–60 min target");
    expect(avgLessonTimeHint(LESSON_TIME_TARGET_MAX_SEC)).toBe(
      "within 45–60 min target",
    );
  });

  it("reports above-target when a lesson runs long", () => {
    expect(avgLessonTimeHint(75 * 60)).toBe("above the 45–60 min target");
  });
});
