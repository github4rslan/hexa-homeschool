/**
 * Increment whenever the generation contract changes. The cache key includes
 * this version, so a prompt change warms a fresh set of checked visuals.
 */
export const VISUAL_PROMPT_VERSION = "v1";

export interface VisualPromptInput {
  prompt: string;
  correctAnswer: string;
  topic: string;
  keyStage: number;
}

export function buildVisualPrompt(input: VisualPromptInput): string {
  const ageGuidance =
    input.keyStage === 2
      ? "primary-school learner aged 7 to 10"
      : input.keyStage === 3
        ? "lower-secondary learner aged 11 to 13"
        : "GCSE learner aged 14 to 16";

  return [
    "Create one clean educational diagram that helps a child understand the concept in this curriculum question.",
    `Learner: ${ageGuidance}.`,
    `Topic: ${input.topic}.`,
    `Question: ${input.prompt}.`,
    `Canonical correct answer: ${input.correctAnswer}.`,
    "Style: friendly flat vector illustration, simple geometric forms, generous whitespace, calm premium classroom feel.",
    "Palette: deep violet, soft cyan, warm amber, off-white and charcoal; high contrast and colour-blind-friendly.",
    "Show one clear concept only. Make the visual useful without revealing a written answer.",
    "Strictly no embedded text, letters, numerals, equations, labels, logos, watermarks, people, faces, hands, mascots, weapons, medical imagery, frightening content, or photorealism.",
    "Do not include decorative clutter or any element unrelated to the exact concept.",
    "Landscape composition with safe margins, suitable beside a lesson question.",
  ].join(" ");
}
