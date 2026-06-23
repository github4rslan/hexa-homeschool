import { describe, expect, it } from "vitest";
import {
  cachedVisualIsServeable,
  questionVisualHash,
} from "@/lib/ai/visual-cache";

describe("question visual cache policy", () => {
  it("keys visuals by question content and band", () => {
    const base = {
      questionId: "q1",
      prompt: "What is 100 − 64?",
      correctAnswer: "36",
      keyStage: 2,
    };
    expect(questionVisualHash(base)).toBe(questionVisualHash(base));
    expect(questionVisualHash({ ...base, keyStage: 3 })).not.toBe(
      questionVisualHash(base),
    );
  });

  it("serves only checked, public, unflagged visuals", () => {
    expect(
      cachedVisualIsServeable({
        is_public: true,
        meta: { checked: "true", flagged: "false" },
      }),
    ).toBe(true);
    expect(
      cachedVisualIsServeable({
        is_public: true,
        meta: { checked: "false", flagged: "false" },
      }),
    ).toBe(false);
    expect(
      cachedVisualIsServeable({
        is_public: false,
        meta: { checked: "true", flagged: "false" },
      }),
    ).toBe(false);
    expect(
      cachedVisualIsServeable({
        is_public: true,
        meta: { checked: "true", flagged: "true" },
      }),
    ).toBe(false);
  });
});
