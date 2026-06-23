import { createHash } from "node:crypto";
import { VISUAL_IMAGE_MODEL } from "@/lib/ai/config";
import { VISUAL_PROMPT_VERSION } from "@/lib/ai/visual-prompt";

export function questionVisualHash(input: {
  questionId: string;
  prompt: string;
  correctAnswer: string;
  keyStage: number;
}): string {
  return createHash("sha256")
    .update(
      [
        "question_visual",
        VISUAL_IMAGE_MODEL,
        VISUAL_PROMPT_VERSION,
        input.questionId,
        input.keyStage,
        input.prompt,
        input.correctAnswer,
      ].join(":"),
    )
    .digest("hex");
}

export function cachedVisualIsServeable(media: {
  is_public: boolean;
  meta?: Record<string, string>;
} | null): boolean {
  return (
    media?.is_public === true &&
    media.meta?.checked === "true" &&
    media.meta?.flagged !== "true"
  );
}
