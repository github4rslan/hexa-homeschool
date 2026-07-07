import { describe, expect, it } from "vitest";
import {
  animationCheckerText,
  validateTeachingAnimation,
} from "@/lib/child/teaching-animations";

/**
 * The shape gate of the agentic "Explain it my way" path (Wave 8, Phase 2):
 * an AI payload only reaches the Checker if it validates as a real
 * TeachingAnimation, and the Checker sees EVERY word of it. Anything
 * malformed → null → the deterministic animation is kept.
 */

const valid = {
  type: "equation_steps",
  title: "Let's split the squares",
  intro: "You found one answer — let's find both.",
  coachLine: "Watch the two brackets appear.",
  steps: [
    {
      label: "Start",
      expression: "x^2 - 9 = 0",
      note: "We want every x that makes this zero.",
      focus: "x^2",
    },
    {
      label: "Answer",
      expression: "x = +/- 3",
      note: "Both 3 and minus 3 work.",
      focus: "+/- 3",
    },
  ],
};

describe("validateTeachingAnimation (agentic shape gate)", () => {
  it("accepts a well-formed payload", () => {
    const animation = validateTeachingAnimation(valid);
    expect(animation).not.toBeNull();
    expect(animation?.type).toBe("equation_steps");
    expect(animation?.steps).toHaveLength(2);
  });

  it("normalises unicode maths to the renderer's ascii mini-syntax", () => {
    const animation = validateTeachingAnimation({
      ...valid,
      steps: [
        {
          label: "Answer",
          expression: "x = ±3",
          note: "Both work.",
          focus: "±3",
        },
      ],
    });
    expect(animation?.steps[0].expression).toBe("x = +/-3");
    expect(animation?.steps[0].focus).toBe("+/-3");
  });

  it("rejects malformed payloads — null means keep the deterministic version", () => {
    expect(validateTeachingAnimation(null)).toBeNull();
    expect(validateTeachingAnimation("x = 3")).toBeNull();
    expect(validateTeachingAnimation({ ...valid, type: "freeform_chat" })).toBeNull();
    expect(validateTeachingAnimation({ ...valid, steps: [] })).toBeNull();
    expect(
      validateTeachingAnimation({
        ...valid,
        steps: [{ label: "Start" }], // missing expression/note
      }),
    ).toBeNull();
  });

  it("non-equation types pass through without math normalisation", () => {
    const animation = validateTeachingAnimation({
      ...valid,
      type: "grammar_highlight",
      steps: [
        {
          label: "Read",
          expression: "Re-read the sentence",
          note: "Hyphens stay hyphens.",
        },
      ],
    });
    expect(animation?.steps[0].expression).toBe("Re-read the sentence");
  });
});

describe("animationCheckerText (the Checker sees every word)", () => {
  it("flattens title, intro, coach line and every step", () => {
    const animation = validateTeachingAnimation(valid)!;
    const text = animationCheckerText(animation);
    expect(text).toContain(valid.title);
    expect(text).toContain(valid.intro);
    expect(text).toContain(valid.coachLine);
    for (const step of valid.steps) {
      expect(text).toContain(step.label);
      expect(text).toContain(step.note);
    }
  });
});
