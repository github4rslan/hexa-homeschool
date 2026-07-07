/**
 * Step-timeline helpers for the "See it" teaching animations (Wave 8).
 *
 * Small, PURE functions that turn a human-authored/deterministic
 * `TeachingAnimationStep` into a render plan — which choreography a step gets
 * (`beat kind`), which roots land on the number line, which answer options are
 * kept vs eliminated. The data model in `teaching-animations.ts` stays the
 * single source of truth; these helpers only interpret it, so the motion always
 * maps to the maths and is unit-testable without a DOM.
 *
 * Framework-free and import-safe from client components and Vitest — keep it
 * that way (no React, no "server-only").
 */

import type { TeachingAnimationStep } from "@/lib/child/teaching-animations";

// ── Equation beats ───────────────────────────────────────────

export type EquationBeatKind =
  | "start"
  | "balance"
  | "square"
  | "factor"
  | "root"
  | "answer";

export interface NumberLineSpec {
  /** Inclusive integer domain of the line. */
  min: number;
  max: number;
  /** Tick step so the line never crowds (≤ 13 ticks). */
  tickStep: number;
  /** The values whose markers land on the line. */
  marks: number[];
}

export interface EquationBeat {
  kind: EquationBeatKind;
  /** Expression split into renderable math tokens. */
  tokens: string[];
  /** Number line to land roots on (root/answer beats with integer roots). */
  numberLine: NumberLineSpec | null;
}

/** Split a normalised expression into math tokens (`x^2`, `sqrt(9)`, `+/-` …). */
export function splitExpression(expression: string): string[] {
  const tokens: string[] = [];
  const pattern =
    /sqrt\([^)]+\)|\+\/-|[A-Za-z0-9]+\^2|\([^)]+\)|[A-Za-z0-9]+|=|[()+\-*/]/g;
  for (const match of expression.matchAll(pattern)) {
    tokens.push(match[0]);
  }
  return tokens;
}

/** Classify which choreography an equation step gets, from its label. */
export function equationBeatKind(label: string): EquationBeatKind {
  const l = label.toLowerCase();
  if (l.includes("balance")) return "balance";
  if (l.includes("factor") || l.includes("split")) return "factor";
  if (l.includes("root")) return "root";
  if (l.includes("answer")) return "answer";
  if (l.includes("pattern") || l.includes("square")) return "square";
  return "start";
}

/**
 * Extract the integer roots stated by an expression, so they can land on the
 * number line: `x = +/- 3` → [-3, 3] · `x = 3 or x = -3` → [3, -3] ·
 * `x = +/- sqrt(10)` (irrational) → [] (no line — never fake a position).
 */
export function extractRoots(expression: string): number[] {
  const text = expression.replace(/\s+/g, " ").trim();

  const plusMinus = text.match(/\+\/-\s*(\d+)(?!\S)/);
  if (plusMinus) {
    const value = Number(plusMinus[1]);
    return [-value, value];
  }

  const listed = [...text.matchAll(/=\s*(-?\d+)|or\s+(-?\d+)/g)]
    .map((m) => Number(m[1] ?? m[2]))
    .filter((n) => Number.isFinite(n));
  return [...new Set(listed)];
}

/** Build a calm, uncrowded number line around the marks (or null when none). */
export function numberLineSpec(marks: number[]): NumberLineSpec | null {
  if (marks.length === 0) return null;
  const largest = Math.max(...marks.map((m) => Math.abs(m)), 1);
  const bound = Math.min(Math.max(largest + 1, 3), 12);
  const span = bound * 2;
  const tickStep = span > 12 ? Math.ceil(span / 12) : 1;
  return { min: -bound, max: bound, tickStep, marks };
}

/** The full render plan for one equation step. */
export function equationBeat(step: TeachingAnimationStep): EquationBeat {
  const kind = equationBeatKind(step.label);
  const showsLine = kind === "root" || kind === "answer";
  return {
    kind,
    tokens: splitExpression(step.expression),
    numberLine: showsLine ? numberLineSpec(extractRoots(step.expression)) : null,
  };
}

// ── Choice-strategy beats (eliminate vs keep) ────────────────

export type OptionFate = "keep" | "eliminate" | "half";

/**
 * Decide each option's fate for the eliminate-vs-keep choreography. The
 * near-miss "±" distractor (e.g. `x = 3` when the answer is `x = ±3`) is
 * classed as `"half"` so the child sees WHY it tempts — it is only half the
 * answer — not just THAT it is wrong. Pure + deterministic.
 */
export function classifyOptions(
  options: string[],
  correctIndex: number,
): OptionFate[] {
  const correct = options[correctIndex] ?? "";
  const correctRoots = signedValues(correct);
  const isPlusMinus = /±|\+\/-/.test(correct) || correctRoots.length === 2;

  return options.map((option, index) => {
    if (index === correctIndex) return "keep";
    if (isPlusMinus && correctRoots.length > 0) {
      const optionRoots = signedValues(option);
      const halfAnswer =
        optionRoots.length === 1 && correctRoots.includes(optionRoots[0]);
      if (halfAnswer) return "half";
    }
    return "eliminate";
  });
}

/** The signed numeric values an option states (`x = ±3` → [-3, 3]). */
function signedValues(option: string): number[] {
  const text = option.replace(/±/g, "+/-");
  const pm = text.match(/\+\/-\s*(\d+(?:\.\d+)?)/);
  if (pm) {
    const v = Number(pm[1]);
    return [-v, v];
  }
  const values = [...text.matchAll(/(-?\d+(?:\.\d+)?)/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n));
  return [...new Set(values)];
}

// ── Grammar / science beats ──────────────────────────────────

/** Words of a sentence for the sequential highlight sweep (cap keeps it calm). */
export function sentenceWords(expression: string, cap = 14): string[] {
  return expression
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, cap);
}

/**
 * Whether a word should light up for this step — either it is the step's
 * `focus`, or (during the sweep) its turn has come around.
 */
export function wordIsLit(input: {
  word: string;
  index: number;
  focus?: string;
  sweepIndex: number;
}): boolean {
  const { word, index, focus, sweepIndex } = input;
  if (focus && word.toLowerCase().includes(focus.toLowerCase())) return true;
  return index === sweepIndex;
}
