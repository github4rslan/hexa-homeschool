/**
 * Deterministic question-figure visuals (F2 + F3).
 *
 * The practice question's figure was a static, eager-loaded AI PNG with a
 * generic alt ("Helpful visual for this mathematics question"). For arithmetic
 * shapes we can derive a clearer, free, always-present picture from the prompt
 * itself — a shaded fraction bar, a 10×10 percent grid, a **number line** for
 * ± / negatives, a **dot array** for a × b, or a **grouping** picture for
 * "½ of N" — each with a real descriptive alt. Non-derivable prompts return
 * null and the caller falls back to the AI image.
 *
 * Pure + framework-free (reuses the F1 fraction parser); the component only
 * draws what this returns. No React, no DB, no "server-only".
 */

import {
  normaliseFractions,
  parseFractionProblem,
} from "@/lib/child/teaching-animations";

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
    }
  | {
      kind: "number_line";
      /** Starting value. */
      a: number;
      /** The amount added / subtracted (may be negative). */
      b: number;
      op: "+" | "-";
      /** Landing value = a ± b. */
      result: number;
      /** Inclusive axis range that comfortably contains a, result and 0. */
      min: number;
      max: number;
      alt: string;
    }
  | {
      kind: "array";
      rows: number;
      cols: number;
      alt: string;
    }
  | {
      kind: "groups";
      /** Total items being shared. */
      total: number;
      /** How many equal groups (the denominator). */
      groups: number;
      /** How many groups are taken (the numerator). */
      shadedGroups: number;
      /** Items in each group = total / groups. */
      perGroup: number;
      /** Answer = perGroup × shadedGroups. */
      result: number;
      alt: string;
    };

/** The largest denominator a fraction bar renders before it becomes noise. */
const MAX_DEN = 24;
/** Cap rendered dots so a big product can't explode the SVG. */
const MAX_DOTS = 144;
/** Cap the number-line span so a wide range stays legible. */
const MAX_LINE_SPAN = 20;

function fractionAlt(a: MathFraction, b: MathFraction | null, op: string | null): string {
  const one = (f: MathFraction) => `${f.num} of ${f.den} parts shaded`;
  if (b && op) {
    const word = op === "+" ? "added to" : op === "-" ? "minus" : "times";
    return `Two fraction bars: ${one(a)}, ${word} a bar with ${one(b)}.`;
  }
  return `A fraction bar with ${one(a)}.`;
}

/** Word forms of small unit/simple fractions for "half of 12" style prompts. */
const WORD_FRACTIONS: Record<string, [number, number]> = {
  half: [1, 2],
  third: [1, 3],
  quarter: [1, 4],
  fifth: [1, 5],
  tenth: [1, 10],
};

/**
 * Parse a "fraction of an amount" prompt → grouping spec, or null.
 * Handles "½ of 16", "1/4 of 20", "a third of 12".
 */
function deriveGroups(prompt: string): MathVisualSpec | null {
  const text = normaliseFractions(prompt).toLowerCase();

  let num: number | null = null;
  let den: number | null = null;

  const digit = text.match(/(\d+)\s*\/\s*(\d+)\s*of\s*(\d+)/);
  let total: number | null = null;
  if (digit) {
    num = Number(digit[1]);
    den = Number(digit[2]);
    total = Number(digit[3]);
  } else {
    const word = text.match(/\b(half|third|quarter|fifth|tenth)\s*of\s*(\d+)/);
    if (word) {
      [num, den] = WORD_FRACTIONS[word[1]];
      total = Number(word[2]);
    }
  }

  if (num == null || den == null || total == null) return null;
  if (den <= 1 || num < 1 || num > den) return null;
  if (total < den || total > MAX_DOTS) return null;
  if (total % den !== 0) return null; // only draw clean, equal groups

  const perGroup = total / den;
  const result = perGroup * num;
  return {
    kind: "groups",
    total,
    groups: den,
    shadedGroups: num,
    perGroup,
    result,
    alt: `${total} dots shared into ${den} equal groups of ${perGroup}; ${num} ${
      num === 1 ? "group" : "groups"
    } shaded to show ${num}/${den} of ${total} = ${result}.`,
  };
}

/** Parse `a ± b` (integers, incl. negatives) → a number-line spec, or null. */
function deriveNumberLine(prompt: string): MathVisualSpec | null {
  const text = prompt.replace(/−/g, "-");
  const m = text.match(/\(?\s*(-?\d+)\s*\)?\s*([+-])\s*\(?\s*(-?\d+)\s*\)?/);
  if (!m) return null;
  const a = Number(m[1]);
  const op = m[2] === "+" ? "+" : "-";
  const b = Number(m[3]);
  if (!Number.isInteger(a) || !Number.isInteger(b)) return null;
  const result = op === "+" ? a + b : a - b;

  const lo = Math.min(0, a, result);
  const hi = Math.max(0, a, result);
  const min = lo - 1;
  const max = hi + 1;
  if (max - min > MAX_LINE_SPAN) return null;

  const signB = op === "+" ? b : -b;
  const dir = signB >= 0 ? "right" : "left";
  return {
    kind: "number_line",
    a,
    b,
    op,
    result,
    min,
    max,
    alt: `A number line: start at ${a}, move ${Math.abs(signB)} ${dir} to land on ${result}.`,
  };
}

/** Parse `a × b` or `a²` (positive) → a dot-array spec, or null. */
function deriveArray(prompt: string): MathVisualSpec | null {
  const text = prompt.replace(/−/g, "-");

  const square = text.match(/(\d+)\s*(?:²|\^\s*2)(?!\d)/);
  if (square) {
    const n = Number(square[1]);
    if (n >= 1 && n <= 12 && n * n <= MAX_DOTS) {
      return {
        kind: "array",
        rows: n,
        cols: n,
        alt: `A ${n} by ${n} array of dots showing ${n} squared = ${n * n}.`,
      };
    }
    return null;
  }

  const mult = text.match(/(\d+)\s*[×x*]\s*(\d+)/);
  if (mult) {
    const rows = Number(mult[1]);
    const cols = Number(mult[2]);
    if (rows >= 1 && cols >= 1 && rows <= 12 && cols <= 12 && rows * cols <= MAX_DOTS) {
      return {
        kind: "array",
        rows,
        cols,
        alt: `A ${rows} by ${cols} array of dots showing ${rows} × ${cols} = ${rows * cols}.`,
      };
    }
  }
  return null;
}

/**
 * Derive a deterministic figure from a question prompt, or null when the prompt
 * isn't an arithmetic shape we can draw. Percentages win first (a hundred-square
 * reads instantly), then "fraction of an amount" groupings, then fraction
 * problems / lone fractions, then a number line (± / negatives), then a
 * multiplication dot-array.
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

  const groups = deriveGroups(prompt);
  if (groups) return groups;

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

  const numberLine = deriveNumberLine(prompt);
  if (numberLine) return numberLine;

  const array = deriveArray(prompt);
  if (array) return array;

  return null;
}
