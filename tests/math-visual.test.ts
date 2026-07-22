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
});
