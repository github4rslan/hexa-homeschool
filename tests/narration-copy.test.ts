import { describe, expect, it } from "vitest";
import {
  buildExplainerNarration,
  buildQuestionNarration,
} from "@/lib/child/narration-copy";

describe("child narration copy", () => {
  it("gives KS2 a simple lead and a clear beat before choices", () => {
    const text = buildQuestionNarration({
      prompt: "What is 100 − 64?",
      options: ["36", "46", "34", "44"],
      keyStage: 2,
    });

    expect(text).toContain(
      "Let's work it out together. What is 100 minus 64?",
    );
    expect(text).toContain("Take a moment to think. Here are your choices.");
    expect(text).toContain("Option A: 36. Option B: 46.");
  });

  it("keeps older-band narration concise while speaking maths symbols", () => {
    expect(
      buildQuestionNarration({
        prompt: "What is 6 × 7?",
        options: ["42", "36"],
        keyStage: 4,
      }),
    ).toMatch(/^What is 6 times 7\?/);
  });

  it("keeps human-authored explainer content primary", () => {
    const text = buildExplainerNarration({
      title: "Subtraction",
      summary: "Take away in small steps.",
      points: ["100 − 60 = 40", "40 − 4 = 36"],
      keyStage: 2,
    });

    expect(text).toContain("Let's learn this together.");
    expect(text).toContain("Take away in small steps.");
    expect(text).toContain("100 minus 60 equals 40");
  });
});
