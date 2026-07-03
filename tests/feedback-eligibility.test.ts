import { describe, it, expect } from "vitest";
import {
  shouldShowFeedbackPrompt,
  feedbackTriggerFor,
  validateStars,
  sanitizeComment,
  isValidTrigger,
  FEEDBACK_MIN_LESSONS,
  FEEDBACK_SUBMIT_COOLDOWN_DAYS,
  FEEDBACK_DISMISS_COOLDOWN_DAYS,
  FEEDBACK_COMMENT_MAX,
  type FeedbackPromptState,
  type FeedbackMilestoneSignal,
} from "@/lib/engine/feedback-eligibility";

const NOW = new Date("2026-07-03T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

const freshState: FeedbackPromptState = {
  lastShownAt: null,
  lastSubmittedAt: null,
  lastDismissedAt: null,
  optedOut: false,
};
const noMilestone: FeedbackMilestoneSignal = {
  completedLessons: 0,
  certifiedTopics: 0,
};

describe("feedbackTriggerFor", () => {
  it("returns null before any milestone (never on first load)", () => {
    expect(feedbackTriggerFor(noMilestone)).toBeNull();
    expect(
      feedbackTriggerFor({ completedLessons: FEEDBACK_MIN_LESSONS - 1, certifiedTopics: 0 }),
    ).toBeNull();
  });

  it("fires first_week at the lesson threshold", () => {
    expect(
      feedbackTriggerFor({ completedLessons: FEEDBACK_MIN_LESSONS, certifiedTopics: 0 }),
    ).toBe("first_week");
  });

  it("prefers mastery — a certified topic is the strongest moment", () => {
    expect(
      feedbackTriggerFor({ completedLessons: FEEDBACK_MIN_LESSONS, certifiedTopics: 2 }),
    ).toBe("mastery");
    expect(feedbackTriggerFor({ completedLessons: 0, certifiedTopics: 1 })).toBe("mastery");
  });
});

describe("shouldShowFeedbackPrompt", () => {
  const eligible: FeedbackMilestoneSignal = { completedLessons: 8, certifiedTopics: 1 };

  it("shows after a milestone with fresh state", () => {
    const d = shouldShowFeedbackPrompt(freshState, eligible, NOW);
    expect(d.show).toBe(true);
    expect(d.trigger).toBe("mastery");
  });

  it("does NOT show without a milestone", () => {
    expect(shouldShowFeedbackPrompt(freshState, noMilestone, NOW).show).toBe(false);
  });

  it("respects opt-out ('don't ask again') even with a milestone", () => {
    expect(
      shouldShowFeedbackPrompt({ ...freshState, optedOut: true }, eligible, NOW).show,
    ).toBe(false);
  });

  it("stays quiet during the long post-submit cooldown, then re-opens after", () => {
    const recent = { ...freshState, lastSubmittedAt: daysAgo(FEEDBACK_SUBMIT_COOLDOWN_DAYS - 1) };
    expect(shouldShowFeedbackPrompt(recent, eligible, NOW).show).toBe(false);

    const expired = { ...freshState, lastSubmittedAt: daysAgo(FEEDBACK_SUBMIT_COOLDOWN_DAYS + 1) };
    expect(shouldShowFeedbackPrompt(expired, eligible, NOW).show).toBe(true);
  });

  it("stays quiet during the shorter post-dismiss cooldown, then re-opens after", () => {
    const recent = { ...freshState, lastDismissedAt: daysAgo(FEEDBACK_DISMISS_COOLDOWN_DAYS - 1) };
    expect(shouldShowFeedbackPrompt(recent, eligible, NOW).show).toBe(false);

    const expired = { ...freshState, lastDismissedAt: daysAgo(FEEDBACK_DISMISS_COOLDOWN_DAYS + 1) };
    expect(shouldShowFeedbackPrompt(expired, eligible, NOW).show).toBe(true);
  });

  it("submit cooldown is longer than dismiss cooldown (submit rests harder)", () => {
    expect(FEEDBACK_SUBMIT_COOLDOWN_DAYS).toBeGreaterThan(FEEDBACK_DISMISS_COOLDOWN_DAYS);
  });
});

describe("validateStars", () => {
  it("accepts integers 1..5 (numbers and numeric strings)", () => {
    for (const n of [1, 2, 3, 4, 5]) expect(validateStars(n)).toBe(n);
    expect(validateStars("4")).toBe(4);
  });

  it("rejects out-of-range, non-integers, and junk", () => {
    for (const bad of [0, 6, -1, 2.5, "3.5", "", "five", null, undefined, NaN, {}]) {
      expect(validateStars(bad)).toBeNull();
    }
  });
});

describe("sanitizeComment", () => {
  it("returns null for empty / whitespace / non-string", () => {
    expect(sanitizeComment("")).toBeNull();
    expect(sanitizeComment("   \n\t ")).toBeNull();
    expect(sanitizeComment(null)).toBeNull();
    expect(sanitizeComment(42)).toBeNull();
  });

  it("trims and preserves ordinary text (incl. the e2e marker)", () => {
    expect(sanitizeComment("  Love it  ")).toBe("Love it");
    expect(sanitizeComment("Great [[e2e-123]]")).toBe("Great [[e2e-123]]");
  });

  it("does NOT strip angle brackets (React escapes on render)", () => {
    expect(sanitizeComment("<script>alert(1)</script>")).toBe("<script>alert(1)</script>");
  });

  it("strips null bytes and control characters but keeps newlines/tabs", () => {
    expect(sanitizeComment("a\x00\x07b")).toBe("ab");
    expect(sanitizeComment("line1\nline2")).toBe("line1\nline2");
    expect(sanitizeComment("keep\ttab")).toBe("keep\ttab");
  });

  it("hard-caps length at FEEDBACK_COMMENT_MAX", () => {
    const long = "x".repeat(FEEDBACK_COMMENT_MAX + 500);
    expect(sanitizeComment(long)!.length).toBe(FEEDBACK_COMMENT_MAX);
  });
});

describe("isValidTrigger", () => {
  it("accepts the known triggers only", () => {
    expect(isValidTrigger("first_week")).toBe(true);
    expect(isValidTrigger("mastery")).toBe(true);
    expect(isValidTrigger("manual")).toBe(true);
    expect(isValidTrigger("other")).toBe(false);
    expect(isValidTrigger(null)).toBe(false);
  });
});
