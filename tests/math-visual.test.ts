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
});
