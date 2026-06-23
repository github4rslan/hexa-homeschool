import { describe, expect, it } from "vitest";
import {
  VISUAL_PROMPT_VERSION,
  buildVisualPrompt,
} from "@/lib/ai/visual-prompt";

describe("visual generation prompt", () => {
  it("is versioned and grounded in canonical curriculum content", () => {
    expect(VISUAL_PROMPT_VERSION).toMatch(/^v\d+$/);
    const prompt = buildVisualPrompt({
      prompt: "What is one half of 16?",
      correctAnswer: "8",
      topic: "Fractions",
      keyStage: 2,
    });
    expect(prompt).toContain("What is one half of 16?");
    expect(prompt).toContain("Canonical correct answer: 8");
    expect(prompt).toContain("aged 7 to 10");
  });

  it("forbids common misleading and child-safety risks", () => {
    const prompt = buildVisualPrompt({
      prompt: "Which material is waterproof?",
      correctAnswer: "Plastic",
      topic: "Materials",
      keyStage: 2,
    });
    expect(prompt).toContain("no embedded text");
    expect(prompt).toContain("numerals");
    expect(prompt).toContain("people");
    expect(prompt).toContain("faces");
    expect(prompt).toContain("frightening content");
  });
});
