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

// ── Autoplay pacing (band-aware, replaces the fixed STEP_MS) ─

/** Reading-pace per word by UK key stage — KS2 is the calmest. */
const MS_PER_WORD: Record<number, number> = { 2: 400, 3: 330, 4: 300 };
const DEFAULT_MS_PER_WORD = 330;
/** A beat never rushes below this, nor overstays past this. */
export const MIN_STEP_MS = 3_600;
export const MAX_STEP_MS = 14_000;
/** "Again, slower" multiplier for a calmer second pass. */
export const SLOW_PACE_FACTOR = 1.4;

/**
 * How long an autoplaying step holds, derived from how much there is to take
 * in (the narration word count) and the child's key stage — younger readers
 * get calmer pacing. `slower` applies the "Again, slower" pass. Pure.
 */
export function stepDurationMs(input: {
  /** The step's narration text (label + spoken expression + note). */
  narration: string;
  keyStage?: number;
  slower?: boolean;
}): number {
  const words = input.narration.trim().split(/\s+/).filter(Boolean).length;
  const perWord = MS_PER_WORD[input.keyStage ?? -1] ?? DEFAULT_MS_PER_WORD;
  // A settle-in beat before + after the words carry the reading.
  const raw = 1_600 + words * perWord;
  const clamped = Math.min(Math.max(raw, MIN_STEP_MS), MAX_STEP_MS);
  return Math.round(input.slower ? clamped * SLOW_PACE_FACTOR : clamped);
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

// ── "Your turn" active-recall beat (Feature 6 — no AI) ───────

export type YourTurnTask =
  | {
      kind: "tap_choice";
      prompt: string;
      choices: string[];
      correct: number;
    }
  | {
      kind: "order_steps";
      prompt: string;
      /** Items in DISPLAY order (deterministically rotated). */
      items: string[];
      /** For each display item, its true position in the process. */
      correctOrder: number[];
    };

/** Deterministic rotation so the correct choice isn't always listed first. */
function rotate<T>(items: T[], by: number): T[] {
  const n = items.length;
  if (n === 0) return items;
  const shift = ((by % n) + n) % n;
  return items.map((_, i) => items[(i + shift) % n]);
}

/**
 * Build the single active-recall micro-task that follows the reveal — turning
 * passive watching into recall. Entirely deterministic (derived from the
 * animation's own human-authored steps and the question's real options); when
 * no meaningful task can be built it returns null and the beat simply doesn't
 * appear. Never AI, never analytics.
 */
export function buildYourTurn(input: {
  type: "equation_steps" | "choice_strategy" | "grammar_highlight" | "science_sequence";
  steps: { label: string; expression: string; focus?: string }[];
  options?: string[];
  correctIndex?: number;
}): YourTurnTask | null {
  const { type, steps, options, correctIndex } = input;

  if (type === "equation_steps") {
    const last = steps[steps.length - 1];
    if (!last) return null;
    const roots = extractRoots(last.expression);
    if (roots.length === 2) {
      const r = Math.max(...roots.map((v) => Math.abs(v)));
      const v = r * r;
      const base = [`${-r} and ${r}`, `only ${r}`, `${v} and ${-v}`];
      const shift = r % base.length;
      const choices = rotate(base, shift);
      return {
        kind: "tap_choice",
        prompt: "Your turn — where does x land on the number line?",
        choices,
        correct: choices.indexOf(base[0]),
      };
    }
    // Irrational answer — recall the ± idea instead of fake positions.
    const sqrtMatch = last.expression.match(/sqrt\((\d+)\)/);
    if (sqrtMatch) {
      const v = Number(sqrtMatch[1]);
      const base = [
        `x = +/- sqrt(${v})`,
        `x = sqrt(${v}) only`,
        `x = ${v}`,
      ];
      const shift = v % base.length;
      const choices = rotate(base, shift);
      return {
        kind: "tap_choice",
        prompt: "Your turn — which shows BOTH possible answers?",
        choices,
        correct: choices.indexOf(base[0]),
      };
    }
    return null;
  }

  if (type === "choice_strategy") {
    if (!options || options.length < 2 || typeof correctIndex !== "number") {
      return null;
    }
    const fates = classifyOptions(options, correctIndex);
    const halfIndex = fates.indexOf("half");
    if (halfIndex >= 0) {
      return {
        kind: "tap_choice",
        prompt: "Your turn — which answer is tempting but only HALF right?",
        choices: [...options],
        correct: halfIndex,
      };
    }
    return {
      kind: "tap_choice",
      prompt: "Your turn — which answer would you keep?",
      choices: [...options],
      correct: correctIndex,
    };
  }

  if (type === "grammar_highlight") {
    // Tap the keyword — only when a step's focus is an actual word in its
    // sentence (derived content often uses meta-focuses; then no task).
    for (const step of steps) {
      if (!step.focus) continue;
      const words = sentenceWords(step.expression, 8);
      const hit = words.findIndex((w) =>
        w.toLowerCase().includes(step.focus!.toLowerCase()),
      );
      if (hit >= 0 && words.length >= 2) {
        return {
          kind: "tap_choice",
          prompt: "Your turn — tap the clue word.",
          choices: words,
          correct: hit,
        };
      }
    }
    return null;
  }

  // science_sequence — put the process back in order.
  const labels = steps.map((s) => s.label);
  if (labels.length < 3) return null;
  const items = rotate(labels, 1);
  return {
    kind: "order_steps",
    prompt: "Your turn — tap the steps in the order they happen.",
    items,
    correctOrder: items.map((item) => labels.indexOf(item)),
  };
}

/** Check a tap answer (pure, instant). */
export function checkYourTurnTap(task: YourTurnTask, selected: number): boolean {
  return task.kind === "tap_choice" && selected === task.correct;
}

/**
 * Check an order answer: `tapped` is the display-index sequence the child
 * tapped; correct when it visits the true positions 0,1,2,… in order.
 */
export function checkYourTurnOrder(
  task: YourTurnTask,
  tapped: number[],
): boolean {
  if (task.kind !== "order_steps") return false;
  if (tapped.length !== task.items.length) return false;
  return tapped.every(
    (displayIndex, i) => task.correctOrder[displayIndex] === i,
  );
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
