export type TeachingAnimationType =
  | "equation_steps"
  | "choice_strategy"
  | "grammar_highlight"
  | "science_sequence";

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
    "choice_strategy",
    "grammar_highlight",
    "science_sequence",
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
  const rootText = Number.isInteger(root) ? String(root) : `sqrt(${value})`;

  return {
    type: "equation_steps",
    title: "Watch the equation balance",
    intro: "First move the number, then take the square root of both sides.",
    coachLine: "Let's make x squared stand by itself.",
    steps: [
      {
        label: "Start",
        expression: `x^2 - ${value} = 0`,
        note: `The -${value} is keeping x^2 from being alone.`,
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
        expression: `x = +/- ${rootText}`,
        note: `${rootText} squared is ${value}, and -${rootText} squared is also ${value}.`,
        focus: `+/- ${rootText}`,
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

export function normalizeTeachingAnimation(input: {
  raw?: unknown;
  prompt: string;
  explanation: string;
}): TeachingAnimation {
  return (
    fromRaw(input.raw) ??
    deriveSquareEquation(input.prompt) ??
    deriveFactorisedDifference(input.prompt) ??
    deriveGrammar(input.prompt, input.explanation) ??
    deriveScience(input.prompt, input.explanation) ??
    deriveChoiceStrategy(input.prompt, input.explanation)
  );
}

export function stepNarration(step: TeachingAnimationStep): string {
  return `${step.label}. ${step.expression}. ${step.note}`;
}

export function teachingAnimationNarration(animation: TeachingAnimation): string {
  const steps = animation.steps.map(stepNarration).join(" ");
  return `${animation.title}. ${animation.intro} ${steps}`;
}
