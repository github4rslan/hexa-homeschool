import { describe, expect, it } from "vitest";
import {
  deriveFractionSum,
  normaliseFractions,
  normalizeTeachingAnimation,
  parseFractionProblem,
  speakableFractionExpression,
  stepNarration,
} from "@/lib/child/teaching-animations";
import { fractionBarsSpec } from "@/lib/child/animation-timeline";

describe("normaliseFractions", () => {
  it("maps vulgar-fraction glyphs to n/d", () => {
    expect(normaliseFractions("¾ + ⅛")).toBe("3/4 + 1/8");
    expect(normaliseFractions("½")).toBe("1/2");
  });

  it("keeps a whole number and its fraction apart (2½ → 2 1/2)", () => {
    expect(normaliseFractions("2½")).toBe("2 1/2");
  });
});

describe("parseFractionProblem", () => {
  it("parses the owner's ¾ + ⅛ screen", () => {
    expect(parseFractionProblem("What is ¾ + ⅛?")).toEqual({
      a: { num: 3, den: 4 },
      b: { num: 1, den: 8 },
      op: "+",
    });
  });

  it("parses multiplication with an × glyph", () => {
    expect(parseFractionProblem("2/3 × 3/4")).toEqual({
      a: { num: 2, den: 3 },
      b: { num: 3, den: 4 },
      op: "×",
    });
  });

  it("returns null when there is no two-fraction problem", () => {
    expect(parseFractionProblem("x^2 - 9 = 0")).toBeNull();
  });
});

describe("deriveFractionSum", () => {
  it("builds a fraction_bars animation ending at 7/8 for ¾ + ⅛", () => {
    const anim = deriveFractionSum("What is ¾ + ⅛?", "");
    expect(anim).not.toBeNull();
    expect(anim!.type).toBe("fraction_bars");
    const labels = anim!.steps.map((s) => s.label);
    expect(labels).toEqual(["Start", "Same size", "Combine", "Answer"]);
    expect(anim!.steps.at(-1)!.expression).toBe("7/8");
    // The common-denominator beat re-slices 3/4 into 6/8.
    expect(anim!.steps[1].expression).toBe("6/8 + 1/8");
  });

  it("simplifies when the sum reduces (1/4 + 1/4 = 1/2)", () => {
    const anim = deriveFractionSum("1/4 + 1/4", "");
    expect(anim!.steps.at(-1)!.expression).toBe("1/2");
    expect(anim!.steps.some((s) => s.label === "Simplify")).toBe(true);
  });

  it("multiplies straight across (2/3 × 3/4 = 1/2)", () => {
    const anim = deriveFractionSum("2/3 × 3/4", "");
    expect(anim!.steps.at(-1)!.expression).toBe("1/2");
  });

  it("returns null for a non-fraction prompt", () => {
    expect(deriveFractionSum("Which word is a noun?", "")).toBeNull();
  });
});

describe("normalizeTeachingAnimation routes fractions to fraction_bars", () => {
  it("chooses fraction_bars over the generic choice fallback", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "What is ¾ + ⅛?",
      explanation: "Add the pieces.",
    });
    expect(anim.type).toBe("fraction_bars");
  });
});

describe("fractionBarsSpec", () => {
  it("reads two operands and an operator", () => {
    const spec = fractionBarsSpec("3/4 + 1/8");
    expect(spec).not.toBeNull();
    expect(spec!.bars.map((b) => b.label)).toEqual(["3/4", "1/8"]);
    expect(spec!.op).toBe("+");
    expect(spec!.result).toBeNull();
    expect(spec!.sameSize).toBe(false);
  });

  it("flags matching denominators as same-size and reads the result", () => {
    const spec = fractionBarsSpec("6/8 + 1/8 = 7/8");
    expect(spec!.sameSize).toBe(true);
    expect(spec!.result?.label).toBe("7/8");
  });

  it("treats a lone answer fraction as the result bar", () => {
    const spec = fractionBarsSpec("7/8");
    expect(spec!.bars).toHaveLength(0);
    expect(spec!.result?.label).toBe("7/8");
  });

  it("returns null when nothing is bar-shaped", () => {
    expect(fractionBarsSpec("read the question")).toBeNull();
  });
});

describe("fraction narration reads as fractions", () => {
  it("speaks n/d as fraction words, not divisions", () => {
    expect(speakableFractionExpression("6/8 + 1/8 = 7/8")).toBe(
      "6 eighths plus 1 eighth equals 7 eighths",
    );
  });

  it("stepNarration uses fraction speech for fraction steps", () => {
    const narration = stepNarration({
      label: "Combine",
      expression: "6/8 + 1/8 = 7/8",
      note: "Add the tops.",
    });
    expect(narration).toContain("6 eighths plus 1 eighth equals 7 eighths");
  });
});
