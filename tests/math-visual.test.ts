import { describe, expect, it } from "vitest";
import { deriveMathVisual } from "@/lib/child/math-visual";

describe("deriveMathVisual", () => {
  it("draws a percent grid for a percentage prompt", () => {
    const spec = deriveMathVisual("What is 50% of 80?");
    expect(spec).toEqual({
      kind: "percent",
      value: 50,
      alt: "A hundred-square with 50 of 100 cells shaded to show 50 percent.",
    });
  });

  it("ignores out-of-range percentages", () => {
    expect(deriveMathVisual("Sales grew 250% last year")).toBeNull();
    expect(deriveMathVisual("0% chance")).toBeNull();
  });

  it("draws two fraction bars for a fraction sum (¾ + ⅛)", () => {
    const spec = deriveMathVisual("What is ¾ + ⅛?");
    expect(spec?.kind).toBe("fraction");
    if (spec?.kind !== "fraction") throw new Error("expected fraction");
    expect(spec.a).toEqual({ num: 3, den: 4 });
    expect(spec.b).toEqual({ num: 1, den: 8 });
    expect(spec.op).toBe("+");
  });

  it("draws a single bar for a lone proper fraction", () => {
    const spec = deriveMathVisual("What fraction is 3/4?");
    expect(spec?.kind).toBe("fraction");
    if (spec?.kind !== "fraction") throw new Error("expected fraction");
    expect(spec.a).toEqual({ num: 3, den: 4 });
    expect(spec.b).toBeNull();
    expect(spec.op).toBeNull();
  });

  it("skips a lone improper fraction (a bar can't over-shade)", () => {
    expect(deriveMathVisual("Simplify 5/4")).toBeNull();
  });

  it("returns null for non-arithmetic prompts (AI image fallback)", () => {
    expect(deriveMathVisual("Which word is a noun?")).toBeNull();
  });

  it("prefers the percent grid when both a percent and a fraction appear", () => {
    const spec = deriveMathVisual("Express 3/4 as 75%");
    expect(spec?.kind).toBe("percent");
  });

  it("draws a number line for a negative addition (−3 + 7)", () => {
    const spec = deriveMathVisual("What is −3 + 7?");
    expect(spec?.kind).toBe("number_line");
    if (spec?.kind !== "number_line") throw new Error("expected number_line");
    expect(spec.a).toBe(-3);
    expect(spec.b).toBe(7);
    expect(spec.op).toBe("+");
    expect(spec.result).toBe(4);
    expect(spec.min).toBeLessThanOrEqual(-3);
    expect(spec.max).toBeGreaterThanOrEqual(4);
  });

  it("draws a number line for a subtraction that goes negative (5 − 8)", () => {
    const spec = deriveMathVisual("Work out 5 − 8");
    if (spec?.kind !== "number_line") throw new Error("expected number_line");
    expect(spec.result).toBe(-3);
    expect(spec.op).toBe("-");
  });

  it("handles a bracketed negative addend (−6 + (−4))", () => {
    const spec = deriveMathVisual("−6 + (−4)");
    if (spec?.kind !== "number_line") throw new Error("expected number_line");
    expect(spec.a).toBe(-6);
    expect(spec.b).toBe(-4);
    expect(spec.result).toBe(-10);
  });

  it("skips a number line whose span is too wide to read", () => {
    expect(deriveMathVisual("100 + 5")).toBeNull();
  });

  // ── B1: a digit belonging to a variable term must never be read as a
  // standalone integer for the number-line deriver ──
  it("never derives a wrong number line from a collect-like-terms prompt with a constant between (5x + 2 − 3x)", () => {
    expect(deriveMathVisual("Simplify 5x + 2 − 3x.")).toBeNull();
  });

  it("never derives a wrong number line when the second number is a coefficient (2 − 3x)", () => {
    expect(deriveMathVisual("2 − 3x")).toBeNull();
  });

  it("draws a dot array for a multiplication (4 × 3)", () => {
    const spec = deriveMathVisual("What is 4 × 3?");
    if (spec?.kind !== "array") throw new Error("expected array");
    expect(spec.rows).toBe(4);
    expect(spec.cols).toBe(3);
  });

  it("draws a square array for a power (4²)", () => {
    const spec = deriveMathVisual("Work out 4²");
    if (spec?.kind !== "array") throw new Error("expected array");
    expect(spec.rows).toBe(4);
    expect(spec.cols).toBe(4);
  });

  it("skips a cube it can't lay out flat (2³)", () => {
    expect(deriveMathVisual("Work out 2³")).toBeNull();
  });

  it("caps an oversized product (13 × 13 → fallback)", () => {
    expect(deriveMathVisual("13 × 13")).toBeNull();
  });

  // B3: the live KS3 negatives question. A dot array cannot picture a negative
  // product, so the deriver must bail rather than assert "2 × 3 = 6" next to a
  // question whose answer is -6.
  it("never draws a dot array for a negative product (−2 × 3)", () => {
    expect(deriveMathVisual("What is −2 × 3?")).toBeNull();
  });

  it("never draws a dot array for a negative product with a hyphen minus (-5 x 4)", () => {
    expect(deriveMathVisual("What is -5 x 4?")).toBeNull();
  });

  it("never draws a dot array when the second operand is negative (6 × −3)", () => {
    expect(deriveMathVisual("Work out 6 × −3")).toBeNull();
  });

  it("never draws a square array for a negative base (−3²)", () => {
    expect(deriveMathVisual("Work out −3²")).toBeNull();
  });

  it("still draws the positive product after the negative guard (7 × 2)", () => {
    const spec = deriveMathVisual("What is 7 × 2?");
    if (spec?.kind !== "array") throw new Error("expected array");
    expect(spec.rows).toBe(7);
    expect(spec.cols).toBe(2);
  });

  it("draws grouped dots for a fraction of an amount (½ of 16)", () => {
    const spec = deriveMathVisual("What is ½ of 16?");
    if (spec?.kind !== "groups") throw new Error("expected groups");
    expect(spec.total).toBe(16);
    expect(spec.groups).toBe(2);
    expect(spec.shadedGroups).toBe(1);
    expect(spec.perGroup).toBe(8);
    expect(spec.result).toBe(8);
  });

  it("handles a non-unit fraction of an amount (3/4 of 20)", () => {
    const spec = deriveMathVisual("Find 3/4 of 20");
    if (spec?.kind !== "groups") throw new Error("expected groups");
    expect(spec.groups).toBe(4);
    expect(spec.shadedGroups).toBe(3);
    expect(spec.result).toBe(15);
  });

  it("handles the word form (a third of 12)", () => {
    const spec = deriveMathVisual("What is a third of 12?");
    if (spec?.kind !== "groups") throw new Error("expected groups");
    expect(spec.perGroup).toBe(4);
    expect(spec.result).toBe(4);
  });

  it("skips a fraction of an amount that won't divide evenly (1/3 of 16)", () => {
    // 16 not divisible by 3 → no clean grouping picture.
    const spec = deriveMathVisual("What is 1/3 of 16?");
    expect(spec?.kind).not.toBe("groups");
  });

  // ── F1: algebra tiles ──
  it("collects like terms into algebra tiles (4x + 2x)", () => {
    const spec = deriveMathVisual("Simplify 4x + 2x");
    if (spec?.kind !== "algebra_tiles") throw new Error("expected algebra_tiles");
    expect(spec.mode).toBe("collect");
    expect(spec.a).toBe(4);
    expect(spec.b).toBe(2);
    expect(spec.op).toBe("+");
    expect(spec.variable).toBe("x");
    expect(spec.resultCoeff).toBe(6);
    expect(spec.resultLabel).toBe("6x");
  });

  it("collects a subtraction of like terms (5x − 2x)", () => {
    const spec = deriveMathVisual("Simplify 5x − 2x");
    if (spec?.kind !== "algebra_tiles") throw new Error("expected algebra_tiles");
    expect(spec.mode).toBe("collect");
    expect(spec.op).toBe("-");
    expect(spec.resultCoeff).toBe(3);
    expect(spec.resultLabel).toBe("3x");
  });

  it("treats a bare like term as coefficient 1 (x + x)", () => {
    const spec = deriveMathVisual("Simplify x + x");
    if (spec?.kind !== "algebra_tiles") throw new Error("expected algebra_tiles");
    expect(spec.a).toBe(1);
    expect(spec.b).toBe(1);
    expect(spec.resultCoeff).toBe(2);
  });

  it("skips a subtraction that would leave zero or negative tiles (2x − 2x)", () => {
    expect(deriveMathVisual("Simplify 2x − 2x")).toBeNull();
  });

  it("expands a single bracket into rows of tiles (2(x + 5))", () => {
    const spec = deriveMathVisual("Expand 2(x + 5)");
    if (spec?.kind !== "algebra_tiles") throw new Error("expected algebra_tiles");
    expect(spec.mode).toBe("expand");
    expect(spec.a).toBe(2);
    expect(spec.b).toBe(5);
    expect(spec.op).toBe("+");
    expect(spec.resultLabel).toBe("2x + 10");
  });

  it("expands a subtraction bracket (3(x − 2))", () => {
    const spec = deriveMathVisual("Expand 3(x − 2)");
    if (spec?.kind !== "algebra_tiles") throw new Error("expected algebra_tiles");
    expect(spec.mode).toBe("expand");
    expect(spec.resultLabel).toBe("3x − 6");
  });

  it("simplifies a product to tiles (3 × n)", () => {
    const spec = deriveMathVisual("Write 3 × n as simply as possible");
    if (spec?.kind !== "algebra_tiles") throw new Error("expected algebra_tiles");
    expect(spec.mode).toBe("scale");
    expect(spec.a).toBe(3);
    expect(spec.variable).toBe("n");
    expect(spec.resultLabel).toBe("3n");
  });

  it("caps an oversized expand multiplier (8(x + 1) → fallback)", () => {
    expect(deriveMathVisual("Expand 8(x + 1)")).toBeNull();
  });

  it("does not treat a plain multiplication as algebra (4 × 3 stays an array)", () => {
    expect(deriveMathVisual("What is 4 × 3?")?.kind).toBe("array");
  });

  it("returns null for a non-algebra text prompt", () => {
    expect(deriveMathVisual("Which word is an adjective?")).toBeNull();
  });

  // ── F1: rounding, place value, standard form ──
  it("rounds up to the nearest hundred (486 → 500)", () => {
    const spec = deriveMathVisual("Round 486 to the nearest 100");
    if (spec?.kind !== "rounding") throw new Error("expected rounding");
    expect(spec.value).toBe(486);
    expect(spec.place).toBe(100);
    expect(spec.lower).toBe(400);
    expect(spec.upper).toBe(500);
    expect(spec.rounded).toBe(500);
  });

  it("rounds down to the nearest thousand, word form (7,482 → 7000)", () => {
    const spec = deriveMathVisual("Round 7,482 to the nearest thousand");
    if (spec?.kind !== "rounding") throw new Error("expected rounding");
    expect(spec.value).toBe(7482);
    expect(spec.place).toBe(1000);
    expect(spec.lower).toBe(7000);
    expect(spec.upper).toBe(8000);
    expect(spec.rounded).toBe(7000);
  });

  it("does not treat a rounding prompt as a number line", () => {
    // "486 to the nearest 100" has no ± operator; must reach the rounding deriver.
    expect(deriveMathVisual("Round 486 to the nearest 100")?.kind).toBe("rounding");
  });

  it("reads place value of a digit (6 in 3,652 → 600)", () => {
    const spec = deriveMathVisual("What is the value of 6 in 3,652?");
    if (spec?.kind !== "place_value") throw new Error("expected place_value");
    expect(spec.digits).toEqual([3, 6, 5, 2]);
    expect(spec.digit).toBe(6);
    expect(spec.highlightIndex).toBe(1);
    expect(spec.placeValue).toBe(600);
    expect(spec.labels).toEqual(["Th", "H", "T", "O"]);
  });

  it("skips place value when the digit isn't in the number", () => {
    expect(deriveMathVisual("What is the value of 9 in 3,652?")).toBeNull();
  });

  it("writes a small number in standard form (0.0045 → 4.5 × 10⁻³)", () => {
    const spec = deriveMathVisual("Write 0.0045 in standard form");
    if (spec?.kind !== "standard_form") throw new Error("expected standard_form");
    expect(spec.a).toBe("4.5");
    expect(spec.exponent).toBe(-3);
    expect(spec.shiftPlaces).toBe(3);
    expect(spec.shiftDir).toBe("right");
  });

  it("writes a large number in standard form (4500 → 4.5 × 10³)", () => {
    const spec = deriveMathVisual("Write 4500 in standard form");
    if (spec?.kind !== "standard_form") throw new Error("expected standard_form");
    expect(spec.a).toBe("4.5");
    expect(spec.exponent).toBe(3);
    expect(spec.shiftDir).toBe("left");
  });

  it("handles an exact power of ten in standard form (1000 → 1 × 10³)", () => {
    const spec = deriveMathVisual("Write 1000 in standard form");
    if (spec?.kind !== "standard_form") throw new Error("expected standard_form");
    expect(spec.a).toBe("1");
    expect(spec.exponent).toBe(3);
  });

  // F7 (2026-08-30): a curated negative-case pass confirming natural English/
  // Science phrasing that merely contains a number doesn't accidentally read
  // as an arithmetic shape. deriveMathVisual carries no topic gate (it is
  // tried first, before science/English), so this is the residual risk the
  // whole EPIC 1 bug class is watching for.
  describe("does NOT derive a visual for a surface-similar non-arithmetic prompt", () => {
    it("does not draw a number line for a plain count in a sentence", () => {
      expect(deriveMathVisual("Identify the two commas that are missing from this sentence.")).toBeNull();
    });
    it("does not draw a percent grid for a non-numeric quotation mark", () => {
      expect(deriveMathVisual("Which word is spelled correctly?")).toBeNull();
    });
    it("does not draw a place-value figure for a non-place-value 'value of' phrase", () => {
      expect(deriveMathVisual("Explain the value of teamwork in this story.")).toBeNull();
    });
    it("does not draw a rounding figure for a non-rounding 'round' word", () => {
      expect(deriveMathVisual("The debate went another round before a decision was reached.")).toBeNull();
    });
  });
});
