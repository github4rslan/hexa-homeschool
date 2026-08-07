export type TeachingAnimationType =
  | "equation_steps"
  | "fraction_bars"
  | "choice_strategy"
  | "grammar_highlight"
  | "science_sequence"
  | "place_value";

export interface TeachingAnimationStep {
  label: string;
  expression: string;
  note: string;
  focus?: string;
}

export interface TeachingAnimation {
  type: TeachingAnimationType;
  title: string;
  intro: string;
  coachLine: string;
  steps: TeachingAnimationStep[];
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[.?!]+$/, "")
    .trim();
}

function normaliseMath(text: string): string {
  return cleanText(text)
    .replace(/\u00b2/g, "^2")
    .replace(/\u2212/g, "-")
    .replace(/\u00b1/g, "+/-")
    .replace(/\u221a/g, "sqrt")
    .replace(/\+-/g, "-");
}

// ── Fractions (F1 — the fraction / area-model "See it") ──────

/** Common vulgar-fraction glyphs → their `n/d` ascii form. */
const VULGAR_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅐": "1/7",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
  "⅑": "1/9",
  "⅒": "1/10",
};

/** Denominator → [singular, plural] spoken names (calm, child-readable). */
const DENOMINATOR_NAMES: Record<number, [string, string]> = {
  2: ["half", "halves"],
  3: ["third", "thirds"],
  4: ["quarter", "quarters"],
  5: ["fifth", "fifths"],
  6: ["sixth", "sixths"],
  7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"],
  9: ["ninth", "ninths"],
  10: ["tenth", "tenths"],
  12: ["twelfth", "twelfths"],
};

/** Replace vulgar-fraction glyphs (¾, ⅛…) with their `3/4`, `1/8` ascii forms. */
export function normaliseFractions(text: string): string {
  let out = "";
  for (const ch of text) {
    const mapped = VULGAR_FRACTIONS[ch];
    // A digit immediately before a mapped glyph ("2½") keeps a space so it reads
    // as a whole-plus-fraction, never "21/2".
    if (mapped) {
      if (out && /\d$/.test(out)) out += " ";
      out += mapped;
    } else {
      out += ch;
    }
  }
  return out;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs((a / gcd(a, b)) * b);
}

interface Fraction {
  num: number;
  den: number;
}

function simplifyFraction({ num, den }: Fraction): Fraction {
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

interface FractionProblem {
  a: Fraction;
  b: Fraction;
  op: "+" | "-" | "×";
}

/** Parse a simple two-fraction problem (`a/b + c/d`, `-`, `×`). Null if none. */
export function parseFractionProblem(prompt: string): FractionProblem | null {
  const text = normaliseFractions(cleanText(prompt));
  const match = text.match(
    /(\d+)\s*\/\s*(\d+)\s*([+\-−×x*])\s*(\d+)\s*\/\s*(\d+)/,
  );
  if (!match) return null;
  const a: Fraction = { num: Number(match[1]), den: Number(match[2]) };
  const b: Fraction = { num: Number(match[4]), den: Number(match[5]) };
  if (a.den <= 0 || b.den <= 0) return null;
  const raw = match[3];
  const op: FractionProblem["op"] =
    raw === "+" ? "+" : raw === "×" || raw === "x" || raw === "*" ? "×" : "-";
  return { a, b, op };
}

/** "3/4" → "3 quarters", "1/2" → "1 half", "6/8" → "6 eighths". */
function spokenFraction(num: number, den: number): string {
  const names = DENOMINATOR_NAMES[den];
  if (!names) return `${num} over ${den}`;
  return `${num} ${num === 1 ? names[0] : names[1]}`;
}

/** Speak a fraction expression naturally: "3 quarters plus 1 eighth". */
export function speakableFractionExpression(expression: string): string {
  return expression
    .replace(/\s+/g, " ")
    .replace(/(\d+)\s*\/\s*(\d+)/g, (_, n: string, d: string) =>
      spokenFraction(Number(n), Number(d)),
    )
    .replace(/=/g, " equals ")
    .replace(/\+/g, " plus ")
    .replace(/[-−]/g, " minus ")
    .replace(/[×x*]/g, " times ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Derive the fraction / area-model "See it" from a fraction-arithmetic prompt
 * (the owner's `¾ + ⅛` screen). Deterministic + human-derived — the model never
 * authors the maths (child-safety rule 5). Emits: make the pieces the same size
 * (common denominator) → combine the tops → simplify → answer. Returns null when
 * the prompt isn't a two-fraction sum/difference/product.
 */
export function deriveFractionSum(
  prompt: string,
  _explanation: string,
): TeachingAnimation | null {
  void _explanation;
  const parsed = parseFractionProblem(prompt);
  if (!parsed) return null;
  const { a, b, op } = parsed;

  const start = `${a.num}/${a.den} ${op} ${b.num}/${b.den}`;
  const steps: TeachingAnimationStep[] = [];

  if (op === "×") {
    const raw: Fraction = { num: a.num * b.num, den: a.den * b.den };
    const simp = simplifyFraction(raw);
    steps.push({
      label: "Start",
      expression: start,
      note: "Multiplying fractions — no common size needed, just multiply straight across.",
      focus: `${a.num}/${a.den}`,
    });
    steps.push({
      label: "Multiply",
      expression: `${start} = ${raw.num}/${raw.den}`,
      note: `Multiply the tops (${a.num} × ${b.num} = ${raw.num}) and the bottoms (${a.den} × ${b.den} = ${raw.den}).`,
      focus: `${raw.num}/${raw.den}`,
    });
    if (simp.num !== raw.num || simp.den !== raw.den) {
      steps.push({
        label: "Simplify",
        expression: `${raw.num}/${raw.den} = ${simp.num}/${simp.den}`,
        note: `Both parts divide by ${gcd(raw.num, raw.den)}, so it tidies to ${simp.num}/${simp.den}.`,
        focus: `${simp.num}/${simp.den}`,
      });
    }
    steps.push({
      label: "Answer",
      expression: `${simp.num}/${simp.den}`,
      note: fractionAnswerNote(simp),
      focus: `${simp.num}/${simp.den}`,
    });
    return fractionAnimation(steps, true);
  }

  // Addition / subtraction: make the pieces the same size first.
  const common = lcm(a.den, b.den);
  const a2: Fraction = { num: a.num * (common / a.den), den: common };
  const b2: Fraction = { num: b.num * (common / b.den), den: common };
  const rawNum = op === "+" ? a2.num + b2.num : a2.num - b2.num;
  const raw: Fraction = { num: rawNum, den: common };
  const simp = simplifyFraction(raw);

  steps.push({
    label: "Start",
    expression: start,
    note:
      op === "+"
        ? "We're adding two fractions. First the pieces need to be the same size."
        : "We're taking one fraction from another. First the pieces need to be the same size.",
    focus: `${a.num}/${a.den}`,
  });

  if (a.den !== b.den) {
    steps.push({
      label: "Same size",
      expression: `${a2.num}/${common} ${op} ${b2.num}/${common}`,
      note: `Cut both into ${common}ths so every piece matches: ${a.num}/${a.den} = ${a2.num}/${common}.`,
      focus: `${a2.num}/${common}`,
    });
  }

  steps.push({
    label: "Combine",
    expression: `${a2.num}/${common} ${op} ${b2.num}/${common} = ${rawNum}/${common}`,
    note:
      op === "+"
        ? `Now add the tops: ${a2.num} + ${b2.num} = ${rawNum} pieces out of ${common}.`
        : `Now take away the tops: ${a2.num} − ${b2.num} = ${rawNum} pieces out of ${common}.`,
    focus: `${rawNum}/${common}`,
  });

  if (simp.num !== raw.num || simp.den !== raw.den) {
    steps.push({
      label: "Simplify",
      expression: `${rawNum}/${common} = ${simp.num}/${simp.den}`,
      note: `Divide top and bottom by ${gcd(rawNum, common)} to tidy it to ${simp.num}/${simp.den}.`,
      focus: `${simp.num}/${simp.den}`,
    });
  }

  steps.push({
    label: "Answer",
    expression: `${simp.num}/${simp.den}`,
    note: fractionAnswerNote(simp),
    focus: `${simp.num}/${simp.den}`,
  });

  return fractionAnimation(steps, op !== "-");
}

function fractionAnswerNote(simp: Fraction): string {
  if (simp.den === 1) return `That makes ${simp.num} whole — nicely done.`;
  return `So the answer is ${simp.num}/${simp.den}, already in its simplest form.`;
}

function fractionAnimation(
  steps: TeachingAnimationStep[],
  adding: boolean,
): TeachingAnimation {
  return {
    type: "fraction_bars",
    title: "See the fraction pieces",
    intro: adding
      ? "We'll line the fractions up as bars, make the pieces the same size, then join them."
      : "We'll line the fractions up as bars, make the pieces the same size, then take some away.",
    coachLine: "Watch the shaded pieces — the picture is the maths.",
    steps,
  };
}

function validStep(step: unknown): step is TeachingAnimationStep {
  if (!step || typeof step !== "object") return false;
  const value = step as Partial<TeachingAnimationStep>;
  return (
    typeof value.label === "string" &&
    typeof value.expression === "string" &&
    typeof value.note === "string" &&
    (value.focus === undefined || typeof value.focus === "string")
  );
}

function fromRaw(raw: unknown): TeachingAnimation | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<TeachingAnimation>;
  const allowed: TeachingAnimationType[] = [
    "equation_steps",
    "fraction_bars",
    "choice_strategy",
    "grammar_highlight",
    "science_sequence",
    "place_value",
  ];
  if (
    value.type &&
    allowed.includes(value.type) &&
    typeof value.title === "string" &&
    typeof value.intro === "string" &&
    Array.isArray(value.steps) &&
    value.steps.length > 0 &&
    value.steps.every(validStep)
  ) {
    return {
      type: value.type,
      title: value.title,
      intro: value.intro,
      coachLine:
        typeof value.coachLine === "string" && value.coachLine.trim()
          ? value.coachLine
          : "I'll show you one small step at a time.",
      steps: value.steps.map((step) => ({
        label: step.label,
        expression: step.expression,
        note: step.note,
        focus: step.focus,
      })),
    };
  }
  return null;
}

function deriveSquareEquation(prompt: string): TeachingAnimation | null {
  const text = normaliseMath(prompt);
  const match = text.match(/x\^2\s*-\s*(\d+)\s*=\s*0/i);
  if (!match) return null;

  const value = Number(match[1]);
  const root = Math.sqrt(value);

  // Perfect square → the full difference-of-squares story: spot the square,
  // factor into two brackets, land both roots on the number line, reveal ±.
  if (Number.isInteger(root)) {
    return {
      type: "equation_steps",
      title: "Watch the equation come apart",
      intro:
        "We'll spot the square pattern, split it into two brackets, and find both answers.",
      coachLine: "Two square pieces can split into two brackets — watch.",
      steps: [
        {
          label: "Start",
          expression: `x^2 - ${value} = 0`,
          note: "We want every x that makes this zero.",
          focus: "x^2",
        },
        {
          label: "Spot the square",
          expression: `${value} = ${root}^2`,
          note: `${value} is ${root} squared — so both parts are square numbers.`,
          focus: `${root}^2`,
        },
        {
          label: "Factor",
          expression: `(x - ${root})(x + ${root}) = 0`,
          note: "A difference of squares splits into one minus bracket and one plus bracket.",
          focus: `${root}`,
        },
        {
          label: "Roots",
          expression: `x = ${root} or x = -${root}`,
          note: "Each bracket can be zero on its own — so there are two answers.",
          focus: `${root}`,
        },
        {
          label: "Answer",
          expression: `x = +/- ${root}`,
          note: `${root} squared is ${value}, and minus ${root} squared is also ${value} — both land on the line.`,
          focus: `+/- ${root}`,
        },
      ],
    };
  }

  // Not a perfect square → the calm balance-then-root story (no fake positions).
  return {
    type: "equation_steps",
    title: "Watch the equation balance",
    intro: "First move the number, then take the square root of both sides.",
    coachLine: "Let's make x squared stand by itself.",
    steps: [
      {
        label: "Start",
        expression: `x^2 - ${value} = 0`,
        note: `The minus ${value} is keeping x squared from being alone.`,
        focus: `-${value}`,
      },
      {
        label: "Balance",
        expression: `x^2 = ${value}`,
        note: `Add ${value} to both sides so the equation stays balanced.`,
        focus: `+${value}`,
      },
      {
        label: "Square root",
        expression: `x = +/- sqrt(${value})`,
        note: "Taking the square root gives two possible directions.",
        focus: "sqrt",
      },
      {
        label: "Answer",
        expression: `x = +/- sqrt(${value})`,
        note: `${value} isn't a square number, so the answer stays as a square root.`,
        focus: `sqrt(${value})`,
      },
    ],
  };
}

function deriveFactorisedDifference(prompt: string): TeachingAnimation | null {
  const text = normaliseMath(prompt);
  const match = text.match(/x\^2\s*-\s*(\d+)/i);
  if (!match) return null;
  const value = Number(match[1]);
  const root = Math.sqrt(value);
  if (!Number.isInteger(root)) return null;

  return {
    type: "equation_steps",
    title: "Spot the square pattern",
    intro: "This is a difference of two squares.",
    coachLine: "Two square pieces can split into two brackets.",
    steps: [
      {
        label: "Pattern",
        expression: `x^2 - ${value}`,
        note: `${value} is ${root}^2, so both parts are squares.`,
        focus: `${value}`,
      },
      {
        label: "Split",
        expression: `(x - ${root})(x + ${root})`,
        note: "Use one minus bracket and one plus bracket.",
        focus: `${root}`,
      },
    ],
  };
}

function deriveGrammar(prompt: string, explanation: string): TeachingAnimation | null {
  const lower = `${prompt} ${explanation}`.toLowerCase();
  if (!/(verb|noun|adjective|sentence|comma|apostrophe|grammar)/.test(lower)) {
    return null;
  }
  return {
    type: "grammar_highlight",
    title: "Highlight the clue words",
    intro: "Good readers look for the job each word is doing.",
    coachLine: "I'll light up the important words.",
    steps: [
      {
        label: "Read",
        expression: cleanText(prompt),
        note: "Read the whole sentence before choosing.",
        focus: "sentence",
      },
      {
        label: "Find",
        expression: "Look for the grammar clue",
        note: cleanText(explanation).slice(0, 140),
        focus: "clue",
      },
      {
        label: "Choose",
        expression: "Pick the word doing that job",
        note: "The right answer should fit the rule and still make sense.",
        focus: "rule",
      },
    ],
  };
}

function deriveScience(prompt: string, explanation: string): TeachingAnimation | null {
  const lower = `${prompt} ${explanation}`.toLowerCase();
  if (
    !/(particle|energy|force|circuit|current|voltage|cell|atom|reaction|light|sound)/.test(
      lower,
    )
  ) {
    return null;
  }
  return {
    type: "science_sequence",
    title: "See the process",
    intro: "Science questions often become easier when you watch the change.",
    coachLine: "Let's follow what moves or changes.",
    steps: [
      {
        label: "Start",
        expression: cleanText(prompt),
        note: "Find the object, energy, force, or material in the question.",
        focus: "start",
      },
      {
        label: "Change",
        expression: "What happens next?",
        note: cleanText(explanation).slice(0, 140),
        focus: "change",
      },
      {
        label: "Result",
        expression: "Match the result",
        note: "Choose the answer that matches the process.",
        focus: "result",
      },
    ],
  };
}

// ── Number & place value (F6 — rounding number-line + place-value columns) ──

/** Column abbreviations by position-from-right (ones = index 0). */
const PLACE_ABBR = ["O", "T", "H", "Th", "TTh", "HTh", "M"];
/** Full column names by position-from-right, for calm spoken notes. */
const PLACE_FULL = [
  "ones",
  "tens",
  "hundreds",
  "thousands",
  "ten thousands",
  "hundred thousands",
  "millions",
];
/** Rounding place words / digits → their power of ten. */
const ROUND_PLACES: Record<string, number> = {
  ten: 10,
  hundred: 100,
  thousand: 1000,
  "10": 10,
  "100": 100,
  "1000": 1000,
};

export interface RoundingLesson {
  value: number;
  place: number;
  /** Nearest multiple at or below `value`. */
  lower: number;
  /** Nearest multiple above `value`. */
  upper: number;
  /** The halfway point between lower and upper. */
  mid: number;
  /** Which multiple `value` snaps to (round half up). */
  rounded: number;
}

/**
 * Parse "round N to the nearest 10/100/1000" (digit or word place), integers
 * only so the number line stays clean. Pure — shared by the deriver (for the
 * spoken notes) and the renderer's stage-spec builder (for the geometry).
 */
export function parseRoundingLesson(prompt: string): RoundingLesson | null {
  const text = normaliseMath(prompt).toLowerCase().replace(/,/g, "");
  const m = text.match(
    /round\s+(-?\d+)\s+to\s+the\s+nearest\s+(ten|hundred|thousand|10|100|1000)\b/,
  );
  if (!m) return null;
  const value = Number(m[1]);
  const place = ROUND_PLACES[m[2]];
  if (!Number.isInteger(value) || !place) return null;
  const lower = Math.floor(value / place) * place;
  const upper = lower + place;
  const mid = lower + place / 2;
  const rounded = Math.round(value / place) * place;
  return { value, place, lower, upper, mid, rounded };
}

export interface PlaceValueLesson {
  /** The whole number with any commas stripped. */
  number: string;
  /** Digits left → right. */
  digits: number[];
  /** Column abbreviation aligned to each digit (Th/H/T/O). */
  labels: string[];
  /** Index (into `digits`) of the highlighted digit. */
  highlightIndex: number;
  /** The digit whose value is asked for. */
  digit: number;
  /** 10^k for the digit's column. */
  multiplier: number;
  /** digit × multiplier. */
  placeValue: number;
  /** Full column name, e.g. "hundreds". */
  columnName: string;
}

/**
 * Parse "value of D in N" (optionally "the digit D") → the place-value columns.
 * First occurrence of D wins. Pure — shared by deriver and renderer.
 */
export function parsePlaceValueLesson(prompt: string): PlaceValueLesson | null {
  const text = cleanText(prompt).toLowerCase();
  const m = text.match(/value of (?:the digit )?(\d)\s+in\s+([\d,]+)/);
  if (!m) return null;
  const digit = Number(m[1]);
  const number = m[2].replace(/,/g, "");
  if (!/^\d+$/.test(number) || number.length > PLACE_ABBR.length) return null;
  const digits = number.split("").map(Number);
  const idx = digits.indexOf(digit);
  if (idx === -1) return null;
  const posFromRight = digits.length - 1 - idx;
  const multiplier = Math.pow(10, posFromRight);
  const placeValue = digit * multiplier;
  const labels = digits.map((_, i) => PLACE_ABBR[digits.length - 1 - i]);
  return {
    number,
    digits,
    labels,
    highlightIndex: idx,
    digit,
    multiplier,
    placeValue,
    columnName: PLACE_FULL[posFromRight],
  };
}

function roundingAnimation(l: RoundingLesson): TeachingAnimation {
  const snapsUp = l.rounded === l.upper;
  const nearer =
    l.value === l.mid
      ? `${l.value} is exactly halfway, so we round up`
      : `${l.value} is nearer to ${l.rounded}`;
  return {
    type: "place_value",
    title: "Land it on the number line",
    intro: `We'll place ${l.value} between the two nearest ${l.place}s and see which it's closer to.`,
    coachLine: "Watch where the number lands — the nearer end wins.",
    steps: [
      {
        label: "Start",
        expression: `round ${l.value} to the nearest ${l.place}`,
        note: `Which multiple of ${l.place} is ${l.value} closest to?`,
        focus: `${l.value}`,
      },
      {
        label: "Neighbours",
        expression: `${l.lower} … ${l.value} … ${l.upper}`,
        note: `${l.value} sits between ${l.lower} and ${l.upper}.`,
        focus: `${l.value}`,
      },
      {
        label: "Halfway",
        expression: `halfway is ${l.mid}`,
        note: `The halfway point is ${l.mid}. ${nearer}.`,
        focus: `${l.mid}`,
      },
      {
        label: "Answer",
        expression: `${l.value} rounds to ${l.rounded}`,
        note: `So ${l.value} rounds ${snapsUp ? "up" : "down"} to ${l.rounded}.`,
        focus: `${l.rounded}`,
      },
    ],
  };
}

function placeValueColumnsAnimation(l: PlaceValueLesson): TeachingAnimation {
  return {
    type: "place_value",
    title: "See it in the columns",
    intro: `We'll line ${l.number} up in place-value columns and read what the ${l.digit} is worth.`,
    coachLine: "Each column is ten times the one to its right.",
    steps: [
      {
        label: "Start",
        expression: `value of ${l.digit} in ${l.number}`,
        note: `What is the digit ${l.digit} worth inside ${l.number}?`,
        focus: `${l.digit}`,
      },
      {
        label: "Columns",
        expression: `${l.number} in place-value columns`,
        note: `Line ${l.number} up so every digit has its own column.`,
        focus: `${l.digit}`,
      },
      {
        label: "Its column",
        expression: `${l.digit} is in the ${l.columnName}`,
        note: `The ${l.digit} sits in the ${l.columnName} column.`,
        focus: `${l.digit}`,
      },
      {
        label: "Answer",
        expression: `${l.digit} × ${l.multiplier} = ${l.placeValue}`,
        note: `So the ${l.digit} is worth ${l.placeValue}.`,
        focus: `${l.placeValue}`,
      },
    ],
  };
}

/**
 * The "See it" walkthrough for Ivy's active band: rounding on a number line and
 * digit place value in columns. Deterministic + human-derived (child-safety rule
 * 5 — the model never authors the maths). Rounding wins first; null when the
 * prompt is neither shape, so the chain falls through to the generic strategy.
 */
export function derivePlaceValueLesson(prompt: string): TeachingAnimation | null {
  const rounding = parseRoundingLesson(prompt);
  if (rounding) return roundingAnimation(rounding);
  const columns = parsePlaceValueLesson(prompt);
  if (columns) return placeValueColumnsAnimation(columns);
  return null;
}

function deriveChoiceStrategy(prompt: string, explanation: string): TeachingAnimation {
  return {
    type: "choice_strategy",
    title: "Think it through",
    intro: "Use the clue in the question, then test the answer before you choose.",
    coachLine: "I'll help you slow the question down.",
    steps: [
      {
        label: "Read",
        expression: cleanText(prompt),
        note: "Underline what the question is asking for.",
        focus: "question",
      },
      {
        label: "Try",
        expression: "Use the key rule",
        note: cleanText(explanation).slice(0, 140),
        focus: "rule",
      },
      {
        label: "Check",
        expression: "Does it fit?",
        note: "Put the answer back into the question and see if it works.",
        focus: "answer",
      },
    ],
  };
}

/**
 * Validate a raw (AI-generated or authored) animation payload WITHOUT the
 * deterministic fallback — the Checker-gated agentic path needs to know
 * whether the payload itself stood up. Math expressions are normalised to the
 * renderer's ascii mini-syntax (^2 · sqrt(n) · +/-) so `MathToken` and the
 * timeline helpers read them exactly like derived content. Null = rejected.
 */
export function validateTeachingAnimation(raw: unknown): TeachingAnimation | null {
  const animation = fromRaw(raw);
  if (!animation) return null;
  if (animation.type === "fraction_bars") {
    // Fraction glyphs (¾, ⅛) → the renderer's `3/4`, `1/8` bar syntax.
    return {
      ...animation,
      steps: animation.steps.map((step) => ({
        ...step,
        expression: normaliseFractions(step.expression),
        focus: step.focus ? normaliseFractions(step.focus) : step.focus,
      })),
    };
  }
  if (animation.type !== "equation_steps") return animation;
  return {
    ...animation,
    steps: animation.steps.map((step) => ({
      ...step,
      expression: normaliseMath(step.expression),
      focus: step.focus ? normaliseMath(step.focus) : step.focus,
    })),
  };
}

/**
 * Flatten an animation into one prose block for the Teaching Checker, so the
 * SAME factual-accuracy + tone gate that guards text explanations guards
 * every word of an agentic animation (title, intro, coach line, every step).
 */
export function animationCheckerText(animation: TeachingAnimation): string {
  const steps = animation.steps
    .map((step) => `${step.label}: ${step.expression}. ${step.note}`)
    .join(" ");
  return `${animation.title}. ${animation.intro} ${animation.coachLine} ${steps}`;
}

export function normalizeTeachingAnimation(input: {
  raw?: unknown;
  prompt: string;
  explanation: string;
}): TeachingAnimation {
  return (
    fromRaw(input.raw) ??
    deriveSquareEquation(input.prompt) ??
    deriveFactorisedDifference(input.prompt) ??
    deriveFractionSum(input.prompt, input.explanation) ??
    derivePlaceValueLesson(input.prompt) ??
    deriveGrammar(input.prompt, input.explanation) ??
    deriveScience(input.prompt, input.explanation) ??
    deriveChoiceStrategy(input.prompt, input.explanation)
  );
}

/**
 * Turn a normalised math expression into natural spoken words so TTS reads
 * "x squared minus 9 equals 0", never "x caret 2". Pure + testable; order
 * matters (± and sqrt before the bare +/- characters).
 */
export function speakableExpression(expression: string): string {
  return expression
    .replace(/\s+/g, " ")
    .replace(/sqrt\(([^)]+)\)/g, "the square root of $1")
    .replace(/\+\/-/g, "plus or minus")
    .replace(/([A-Za-z0-9]+)\^2/g, "$1 squared")
    .replace(/\)\s*\(/g, ", times ")
    .replace(/[()]/g, " ")
    .replace(/=/g, " equals ")
    .replace(/\*/g, " times ")
    .replace(/\//g, " divided by ")
    .replace(/-/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stepNarration(step: TeachingAnimationStep): string {
  // Fraction bars read as fractions ("3 quarters plus 1 eighth"), never as
  // "3 divided by 4". A bare `n/d` with no equation/root syntax is the tell.
  const hasFraction = /\d+\s*\/\s*\d+/.test(step.expression);
  const hasEquationSyntax = /\^|sqrt\(|\+\/-/.test(step.expression);
  if (hasFraction && !hasEquationSyntax) {
    return `${step.label}. ${speakableFractionExpression(step.expression)}. ${step.note}`;
  }
  // Only math-shaped expressions get the spoken-math treatment — prose keeps
  // its hyphens ("re-read" must never become "re minus read").
  const mathy = /[=^]|sqrt\(|\+\/-/.test(step.expression);
  const spoken = mathy ? speakableExpression(step.expression) : step.expression;
  return `${step.label}. ${spoken}. ${step.note}`;
}

export function teachingAnimationNarration(animation: TeachingAnimation): string {
  const steps = animation.steps.map(stepNarration).join(" ");
  return `${animation.title}. ${animation.intro} ${steps}`;
}
