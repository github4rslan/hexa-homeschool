/**
 * Deterministic, human-authored narration wrappers. These make lesson copy
 * easier to follow aloud without changing the visible curriculum or creating
 * a new AI surface.
 */

function speakMathsSymbols(text: string): string {
  return text
    .replaceAll("−", " minus ")
    .replaceAll("×", " times ")
    .replaceAll("÷", " divided by ")
    .replaceAll("=", " equals ")
    .replace(/\s+/g, " ")
    .trim();
}

function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function buildQuestionNarration(input: {
  prompt: string;
  options?: string[];
  keyStage?: number;
}): string {
  const prompt = speakMathsSymbols(input.prompt);
  const lead =
    input.keyStage === 2
      ? `Let's work it out together. ${prompt}`
      : prompt;

  if (!input.options?.length) return `${lead}. Take your time.`;

  const options = input.options
    .map(
      (option, index) =>
        `Option ${optionLabel(index)}: ${speakMathsSymbols(option)}`,
    )
    .join(". ");

  return `${lead}. Take a moment to think. Here are your choices. ${options}.`;
}

export function buildExplainerNarration(input: {
  title: string;
  summary: string;
  points: string[];
  keyStage?: number;
}): string {
  const lead =
    input.keyStage === 2 ? "Let's learn this together." : "Today's lesson.";
  const points = input.points.map(speakMathsSymbols).join(". ");
  return `${lead} ${speakMathsSymbols(input.title)}. ${speakMathsSymbols(input.summary)}. ${points}`;
}
