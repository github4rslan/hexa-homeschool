export type TeachingAnimationType = "equation_steps" | "choice_strategy";

export interface TeachingAnimationStep {
  label: string;
  expression: string;
  note: string;
}

export interface TeachingAnimation {
  type: TeachingAnimationType;
  title: string;
  intro: string;
  steps: TeachingAnimationStep[];
}

function cleanMath(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[.?!]+$/, "")
    .trim();
}

function normaliseSymbols(text: string): string {
  return text
    .replace(/\^2/g, "²")
    .replace(/\+-/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function fromRaw(raw: unknown): TeachingAnimation | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<TeachingAnimation>;
  if (
    value.type === "equation_steps" &&
    typeof value.title === "string" &&
    typeof value.intro === "string" &&
    Array.isArray(value.steps) &&
    value.steps.length > 0 &&
    value.steps.every(
      (s) =>
        s &&
        typeof s.label === "string" &&
        typeof s.expression === "string" &&
        typeof s.note === "string",
    )
  ) {
    return {
      type: "equation_steps",
      title: value.title,
      intro: value.intro,
      steps: value.steps.map((s) => ({
        label: s.label,
        expression: s.expression,
        note: s.note,
      })),
    };
  }
  return null;
}

function deriveSquareEquation(prompt: string): TeachingAnimation | null {
  const text = normaliseSymbols(cleanMath(prompt));
  const match = text.match(/x²\s*-\s*(\d+)\s*=\s*0/i);
  if (!match) return null;

  const value = Number(match[1]);
  const root = Math.sqrt(value);
  const rootText = Number.isInteger(root) ? String(root) : `√${value}`;

  return {
    type: "equation_steps",
    title: "Watch the balance",
    intro: "Move the number first, then take the square root of both sides.",
    steps: [
      {
        label: "Start",
        expression: `x² - ${value} = 0`,
        note: "We want x² on its own.",
      },
      {
        label: "Balance",
        expression: `x² = ${value}`,
        note: `Add ${value} to both sides.`,
      },
      {
        label: "Root",
        expression: `x = ±√${value}`,
        note: "A square root has a positive and a negative answer.",
      },
      {
        label: "Answer",
        expression: `x = ±${rootText}`,
        note: `${rootText}² gives ${value}, and (-${rootText})² gives ${value}.`,
      },
    ],
  };
}

function deriveFactorisedDifference(prompt: string): TeachingAnimation | null {
  const text = normaliseSymbols(cleanMath(prompt));
  const match = text.match(/x²\s*-\s*(\d+)/i);
  if (!match) return null;
  const value = Number(match[1]);
  const root = Math.sqrt(value);
  if (!Number.isInteger(root)) return null;

  return {
    type: "equation_steps",
    title: "Spot the square pattern",
    intro: "This is a difference of two squares.",
    steps: [
      {
        label: "Pattern",
        expression: `x² - ${value}`,
        note: `${value} is ${root}², so both parts are squares.`,
      },
      {
        label: "Split",
        expression: `(x - ${root})(x + ${root})`,
        note: "Use one minus bracket and one plus bracket.",
      },
    ],
  };
}

function deriveChoiceStrategy(prompt: string, explanation: string): TeachingAnimation {
  return {
    type: "choice_strategy",
    title: "Think it through",
    intro: "Use the clue in the question, then test the answer before you choose.",
    steps: [
      {
        label: "Read",
        expression: cleanMath(prompt),
        note: "Underline what the question is asking for.",
      },
      {
        label: "Try",
        expression: "Use the key rule",
        note: cleanMath(explanation).slice(0, 120),
      },
      {
        label: "Check",
        expression: "Does it fit?",
        note: "Put the answer back into the question and see if it works.",
      },
    ],
  };
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
    deriveChoiceStrategy(input.prompt, input.explanation)
  );
}

export function teachingAnimationNarration(animation: TeachingAnimation): string {
  const steps = animation.steps
    .map((step) => `${step.label}. ${step.expression}. ${step.note}`)
    .join(" ");
  return `${animation.title}. ${animation.intro} ${steps}`;
}
