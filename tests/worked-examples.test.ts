import { describe, expect, it } from "vitest";
import {
  normalizeWorkedExample,
  visibleWorkedStepCount,
  workedSolutionFromExplanation,
} from "../src/lib/child/worked-examples";

describe("worked examples", () => {
  it("normalizes authored topic examples and drops empty steps", () => {
    const example = normalizeWorkedExample({
      title: "Add with tens",
      scenario: "You have 45 stickers.",
      steps: [
        { line: "Split 38 into 30 and 8.", visual: { label: "Break", value: "38 = 30 + 8" } },
        { line: "   " },
      ],
      yourTurn: "Try 52 + 27.",
    });

    expect(example).toEqual({
      title: "Add with tens",
      scenario: "You have 45 stickers.",
      steps: [
        {
          line: "Split 38 into 30 and 8.",
          visual: { label: "Break", value: "38 = 30 + 8" },
        },
      ],
      yourTurn: "Try 52 + 27.",
    });
  });

  it("rejects malformed examples so legacy topics fall back cleanly", () => {
    expect(normalizeWorkedExample({ title: "Empty", steps: [] })).toBeUndefined();
    expect(normalizeWorkedExample(null)).toBeUndefined();
  });

  it("reveals one more step at a time unless reduced motion is enabled", () => {
    expect(
      visibleWorkedStepCount({ currentStep: 0, totalSteps: 3, reducedMotion: false }),
    ).toBe(1);
    expect(
      visibleWorkedStepCount({ currentStep: 2, totalSteps: 3, reducedMotion: false }),
    ).toBe(3);
    expect(
      visibleWorkedStepCount({ currentStep: 0, totalSteps: 3, reducedMotion: true }),
    ).toBe(3);
  });

  it("builds a step walkthrough from the human-authored explanation fallback", () => {
    const solution = workedSolutionFromExplanation({
      prompt: "What is 45 + 38?",
      explanation: "Add 30 to 45 to get 75. Then add 8 more to get 83.",
    });

    expect(solution.scenario).toBe("What is 45 + 38?");
    expect(solution.steps.map((s) => s.line)).toEqual([
      "Add 30 to 45 to get 75.",
      "Then add 8 more to get 83.",
    ]);
  });
});
