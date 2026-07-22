/**
 * Deterministic question-figure visuals (F2).
 *
 * The practice question's figure was a static, eager-loaded AI PNG with a
 * generic alt ("Helpful visual for this mathematics question"). For arithmetic
 * shapes we can derive a clearer, free, always-present picture from the prompt
 * itself — a shaded fraction bar or a 10×10 percent grid — with a real
 * descriptive alt. Non-derivable prompts return null and the caller falls back
 * to the AI image.
 *
 * Pure + framework-free (reuses the F1 fraction parser); the component only
 * draws what this returns. No React, no DB, no "server-only".
 */

import { parseFractionProblem } from "@/lib/child/teaching-animations";

export interface MathFraction {
  num: number;
  den: number;
}

export type MathVisualSpec =
  | {
      kind: "percent";
      /** Cells shaded out of 100 (clamped 1–100). */
      value: number;
      alt: string;
    }
  | {
      kind: "fraction";
      a: MathFraction;
      b: MathFraction | null;
      op: "+" | "-" | "×" | null;
      alt: string;
    };

/** The largest denominator a fraction bar renders before it becomes noise. */
const MAX_DEN = 24;

function fractionAlt(a: MathFraction, b: MathFraction | null, op: string | null): string {
  const one = (f: MathFraction) => `${f.num} of ${f.den} parts shaded`;
  if (b && op) {
    const word = op === "+" ? "added to" : op === "-" ? "minus" : "times";
    return `Two fraction bars: ${one(a)}, ${word} a bar with ${one(b)}.`;
  }
  return `A fraction bar with ${one(a)}.`;
}

/**
 * Derive a deterministic figure from a question prompt, or null when the prompt
 * isn't an arithmetic shape we can draw. Percentages win first (a hundred-square
 * reads instantly), then fraction problems / lone fractions.
 */
export function deriveMathVisual(prompt: string): MathVisualSpec | null {
  const percentMatch = prompt.match(/(\d{1,3})\s*%/);
  if (percentMatch) {
    const value = Number(percentMatch[1]);
    if (Number.isFinite(value) && value >= 1 && value <= 100) {
      return {
        kind: "percent",
        value,
        alt: `A hundred-square with ${value} of 100 cells shaded to show ${value} percent.`,
      };
    }
  }

  const problem = parseFractionProblem(prompt);
  if (problem && problem.a.den <= MAX_DEN && problem.b.den <= MAX_DEN) {
    return {
      kind: "fraction",
      a: problem.a,
      b: problem.b,
      op: problem.op,
      alt: fractionAlt(problem.a, problem.b, problem.op),
    };
  }

  // A lone fraction ("What fraction is 3/4?") still draws a single bar.
  const single = prompt.match(/(\d+)\s*\/\s*(\d+)/);
  if (single) {
    const a: MathFraction = { num: Number(single[1]), den: Number(single[2]) };
    if (a.den > 0 && a.den <= MAX_DEN && a.num <= a.den) {
      return {
        kind: "fraction",
        a,
        b: null,
        op: null,
        alt: fractionAlt(a, null, null),
      };
    }
  }

  return null;
}
