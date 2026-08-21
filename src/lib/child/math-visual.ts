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
    }
  | {
      kind: "algebra_tiles";
      /**
       * collect — `ax ± bx` → combine like terms into `resultCoeff` tiles.
       * expand — `a(x ± b)` → `a` rows of one x-tile + `b` unit-tiles.
       * scale  — `a × v` → `a` variable-tiles (write a product "as simply as possible").
       */
      mode: "collect" | "expand" | "scale";
      /** First coefficient (collect), the multiplier/rows (expand), or the factor (scale). */
      a: number;
      /** Second coefficient (collect) or the bracket constant (expand); 0 for scale. */
      b: number;
      /** Sign between the terms (collect) or inside the bracket (expand). */
      op: "+" | "-";
      /** The single-letter variable, e.g. "x" or "n". */
      variable: string;
      /** Resulting coefficient of the variable (collect/scale) or per-row x count (expand = a). */
      resultCoeff: number;
      /** The simplified answer, e.g. "6x", "2x + 10", "3n". */
      resultLabel: string;
      alt: string;
    }
  | {
      kind: "rounding";
      /** The number being rounded. */
      value: number;
      /** The rounding place: 10, 100 or 1000. */
      place: number;
      /** Nearest multiple below (or equal). */
      lower: number;
      /** Nearest multiple above. */
      upper: number;
      /** Which multiple `value` snaps to. */
      rounded: number;
      alt: string;
    }
  | {
      kind: "place_value";
      /** Digits of the number, left → right. */
      digits: number[];
      /** Column abbreviation aligned to each digit (O/T/H/Th/…). */
      labels: string[];
      /** Index (into `digits`) of the highlighted digit. */
      highlightIndex: number;
      /** The digit whose place value is asked for. */
      digit: number;
      /** digit × 10^k for its column. */
      placeValue: number;
      alt: string;
    }
  | {
      kind: "standard_form";
      /** The number as originally written (commas stripped). */
      original: string;
      /** Mantissa 1 ≤ |a| < 10, formatted. */
      a: string;
      /** Power of ten. */
      exponent: number;
      /** How many places the decimal point moves. */
      shiftPlaces: number;
      /** Direction the point moves to reach the mantissa. */
      shiftDir: "left" | "right";
      alt: string;
    };

/** The largest denominator a fraction bar renders before it becomes noise. */
const MAX_DEN = 24;
/** Cap algebra-tile coefficients so a big value can't explode the tile grid. */
const MAX_ALG_COEFF = 12;
/** Cap the number of expand rows (a big multiplier stacks too tall). */
const MAX_ALG_ROWS = 6;
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
  // Boundary guard: a digit immediately preceded or followed by a letter (or
  // preceded by another digit) belongs to a variable term (e.g. the "3" in
  // "3x") or a longer number, not a standalone integer — never match it as
  // one side of a plain arithmetic sum/difference.
  const m = text.match(
    /(?<![a-zA-Z0-9])\(?\s*(-?\d+)\s*\)?\s*([+-])\s*\(?\s*(-?\d+)\s*\)?(?![a-zA-Z0-9])/,
  );
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
 * Parse a KS3 algebra prompt → an algebra-tiles spec, or null. Handles the exact
 * band the child is working in: collecting like terms (`4x + 2x`), expanding a
 * single bracket (`2(x + 5)`), and simplifying a product (`3 × n`). Each tile
 * picture is concrete, free, always present, and carries an honest descriptive
 * alt (this is what resolves B1 for the algebra prompts that used to fall to a
 * generic AI PNG). Non-algebra prompts return null and fall through the chain.
 */
function deriveAlgebraTiles(prompt: string): MathVisualSpec | null {
  const text = prompt.replace(/−/g, "-");

  // ── collect like terms: ax ± bx (same variable) ──
  const collect = text.match(/(-?\d*)\s*([a-z])\s*([+-])\s*(\d*)\s*\2/i);
  if (collect) {
    const a = collect[1] === "" ? 1 : Number(collect[1]);
    const b = collect[4] === "" ? 1 : Number(collect[4]);
    const op = collect[3] === "+" ? "+" : "-";
    const variable = collect[2].toLowerCase();
    const resultCoeff = op === "+" ? a + b : a - b;
    if (
      Number.isInteger(a) &&
      Number.isInteger(b) &&
      a >= 1 &&
      b >= 1 &&
      a <= MAX_ALG_COEFF &&
      b <= MAX_ALG_COEFF &&
      resultCoeff >= 1
    ) {
      const resultLabel = `${resultCoeff}${variable}`;
      const alt =
        op === "+"
          ? `Algebra tiles: ${a} ${variable}-tiles combined with ${b} more make ${resultCoeff} ${variable}-tiles, so ${a}${variable} + ${b}${variable} = ${resultLabel}.`
          : `Algebra tiles: start with ${a} ${variable}-tiles and take away ${b}, leaving ${resultCoeff} ${variable}-tiles, so ${a}${variable} − ${b}${variable} = ${resultLabel}.`;
      return {
        kind: "algebra_tiles",
        mode: "collect",
        a,
        b,
        op,
        variable,
        resultCoeff,
        resultLabel,
        alt,
      };
    }
  }

  // ── expand a single bracket: a(x ± b) ──
  const expand = text.match(/(-?\d+)\s*\(\s*([a-z])\s*([+-])\s*(\d+)\s*\)/i);
  if (expand) {
    const a = Number(expand[1]);
    const b = Number(expand[4]);
    const op = expand[3] === "+" ? "+" : "-";
    const variable = expand[2].toLowerCase();
    if (
      Number.isInteger(a) &&
      Number.isInteger(b) &&
      a >= 2 &&
      a <= MAX_ALG_ROWS &&
      b >= 1 &&
      b <= MAX_ALG_COEFF
    ) {
      const constant = a * b;
      const resultLabel = `${a}${variable} ${op === "+" ? "+" : "−"} ${constant}`;
      return {
        kind: "algebra_tiles",
        mode: "expand",
        a,
        b,
        op,
        variable,
        resultCoeff: a,
        resultLabel,
        alt: `Algebra tiles: ${a} rows of an ${variable}-tile and ${b} unit-tiles show ${a}(${variable} ${op === "+" ? "+" : "−"} ${b}) = ${resultLabel}.`,
      };
    }
  }

  // ── simplify a product: a × v (× · * only — never the letter x, to avoid
  //    colliding with an "x" variable) ──
  const scale = text.match(/(-?\d+)\s*[×*·]\s*([a-z])(?![a-z])/i);
  if (scale) {
    const a = Number(scale[1]);
    const variable = scale[2].toLowerCase();
    if (Number.isInteger(a) && a >= 2 && a <= MAX_ALG_COEFF) {
      const resultLabel = `${a}${variable}`;
      return {
        kind: "algebra_tiles",
        mode: "scale",
        a,
        b: 0,
        op: "+",
        variable,
        resultCoeff: a,
        resultLabel,
        alt: `Algebra tiles: ${a} ${variable}-tiles show ${a} × ${variable} = ${resultLabel}.`,
      };
    }
  }

  return null;
}

/** Place names → power of ten, for both digit and word forms. */
const PLACE_WORDS: Record<string, number> = {
  ten: 10,
  hundred: 100,
  thousand: 1000,
  "10": 10,
  "100": 100,
  "1000": 1000,
};

/** Column abbreviations by position-from-right (ones = index 0). */
const PLACE_ABBR = ["O", "T", "H", "Th", "TTh", "HTh", "M"];
/** Full column names by position-from-right, for the honest alt text. */
const PLACE_FULL = [
  "ones",
  "tens",
  "hundreds",
  "thousands",
  "ten thousands",
  "hundred thousands",
  "millions",
];

/**
 * Parse "round N to the nearest 10/100/1000" (digit or word place) → a rounding
 * number-line spec. Marks N between the two neighbouring multiples and shows
 * which it snaps to. Integers only, so the line stays clean.
 */
function deriveRounding(prompt: string): MathVisualSpec | null {
  const text = prompt.toLowerCase().replace(/,/g, "");
  const m = text.match(
    /round\s+(-?\d+)\s+to\s+the\s+nearest\s+(ten|hundred|thousand|10|100|1000)\b/,
  );
  if (!m) return null;
  const value = Number(m[1]);
  const place = PLACE_WORDS[m[2]];
  if (!Number.isInteger(value) || !place) return null;

  const lower = Math.floor(value / place) * place;
  const upper = lower + place;
  const rounded = Math.round(value / place) * place;
  return {
    kind: "rounding",
    value,
    place,
    lower,
    upper,
    rounded,
    alt: `A number line from ${lower} to ${upper} with ${value} marked; it rounds to ${rounded}, the nearer multiple of ${place}.`,
  };
}

/**
 * Parse "value of D in N" (optionally "the digit D") → a place-value-columns
 * spec, highlighting D's column. First occurrence of D wins.
 */
function derivePlaceValue(prompt: string): MathVisualSpec | null {
  const text = prompt.toLowerCase();
  const m = text.match(/value of (?:the digit )?(\d)\s+in\s+([\d,]+)/);
  if (!m) return null;
  const digit = Number(m[1]);
  const nStr = m[2].replace(/,/g, "");
  if (!/^\d+$/.test(nStr) || nStr.length < 1 || nStr.length > PLACE_ABBR.length) {
    return null;
  }
  const digits = nStr.split("").map(Number);
  const idx = digits.indexOf(digit);
  if (idx === -1) return null;
  const posFromRight = digits.length - 1 - idx;
  const placeValue = digit * Math.pow(10, posFromRight);
  const labels = digits.map((_, i) => PLACE_ABBR[digits.length - 1 - i]);
  return {
    kind: "place_value",
    digits,
    labels,
    highlightIndex: idx,
    digit,
    placeValue,
    alt: `Place-value columns for ${nStr}: the digit ${digit} sits in the ${PLACE_FULL[posFromRight]} column, so its value is ${placeValue}.`,
  };
}

/** Clean float noise from a mantissa and trim trailing zeros. */
function formatMantissa(a: number): string {
  return Number(a.toPrecision(12)).toString();
}

/**
 * Parse "write X in standard form" → a standard-form spec (a × 10ⁿ with the
 * decimal-point shift). Handles both large (4500) and small (0.0045) numbers.
 */
function deriveStandardForm(prompt: string): MathVisualSpec | null {
  const text = prompt.toLowerCase().replace(/,/g, "");
  const m = text.match(/write\s+(-?\d+(?:\.\d+)?)\s+in\s+standard\s+form/);
  if (!m) return null;
  const original = m[1];
  const x = Number(original);
  if (!Number.isFinite(x) || x === 0) return null;

  let exponent = Math.floor(Math.log10(Math.abs(x)));
  let a = x / Math.pow(10, exponent);
  // Correct for floating-point error at exact powers of ten.
  if (Math.abs(a) >= 10) {
    exponent += 1;
    a = x / Math.pow(10, exponent);
  } else if (Math.abs(a) < 1) {
    exponent -= 1;
    a = x / Math.pow(10, exponent);
  }
  a = Number(a.toPrecision(12));
  if (!(Math.abs(a) >= 1 && Math.abs(a) < 10)) return null;

  const shiftPlaces = Math.abs(exponent);
  const shiftDir = exponent < 0 ? "right" : "left";
  const aStr = formatMantissa(a);
  return {
    kind: "standard_form",
    original,
    a: aStr,
    exponent,
    shiftPlaces,
    shiftDir,
    alt: `${original} in standard form: move the decimal point ${shiftPlaces} ${
      shiftPlaces === 1 ? "place" : "places"
    } ${shiftDir} to get ${aStr} × 10 to the power ${exponent}.`,
  };
}

/**
 * Derive a deterministic figure from a question prompt, or null when the prompt
 * isn't an arithmetic shape we can draw. Percentages win first (a hundred-square
 * reads instantly), then "fraction of an amount" groupings, then fraction
 * problems / lone fractions, then a number line (± / negatives), then a
 * multiplication dot-array, then KS3 algebra tiles, then the place-and-rounding
 * shapes (rounding number-line, place-value columns, standard form).
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

  const algebra = deriveAlgebraTiles(prompt);
  if (algebra) return algebra;

  const rounding = deriveRounding(prompt);
  if (rounding) return rounding;

  const placeValue = derivePlaceValue(prompt);
  if (placeValue) return placeValue;

  const standardForm = deriveStandardForm(prompt);
  if (standardForm) return standardForm;

  return null;
}
