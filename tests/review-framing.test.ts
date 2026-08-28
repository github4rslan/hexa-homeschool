import { describe, expect, it } from "vitest";
import { completionCopy, REVIEW_CHIP_TEXT } from "@/lib/child/review-framing";

describe("completionCopy (F3)", () => {
  it("shows a first-time mastery heading when mastered and NOT a review", () => {
    const copy = completionCopy({ mastered: true, isReview: false });
    expect(copy.heading).toBe("Topic mastered!");
    expect(copy.subtitle).toMatch(/certified/i);
  });

  it("shows a distinct review heading when mastered AND already certified before", () => {
    const copy = completionCopy({ mastered: true, isReview: true });
    expect(copy.heading).not.toBe("Topic mastered!");
    expect(copy.heading).toMatch(/still mastered/i);
    expect(copy.subtitle).toMatch(/review/i);
  });

  it("never claims a first mastery moment on a review pass", () => {
    const copy = completionCopy({ mastered: true, isReview: true });
    expect(copy.subtitle.toLowerCase()).not.toContain("this topic is certified!");
  });

  it("acknowledges the topic stays certified when a review attempt falls short", () => {
    const copy = completionCopy({ mastered: false, isReview: true });
    expect(copy.subtitle).toMatch(/already certified/i);
  });

  it("uses the plain not-yet-certified copy for a genuine first attempt that falls short", () => {
    const copy = completionCopy({ mastered: false, isReview: false });
    expect(copy.subtitle).toMatch(/master this topic next time/i);
  });
});

describe("REVIEW_CHIP_TEXT (F3)", () => {
  it("acknowledges prior mastery without claiming a new one", () => {
    expect(REVIEW_CHIP_TEXT.toLowerCase()).toContain("already mastered");
  });

  it("contains no dash punctuation (child-facing copy stays comma/colon style)", () => {
    expect(REVIEW_CHIP_TEXT).not.toMatch(/[–—]/);
  });
});
