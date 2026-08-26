import { describe, expect, it } from "vitest";
import { explanationSystemPrompt } from "@/lib/ai/teaching-agent";

describe("explanationSystemPrompt (B2 — no raw LaTeX to a child)", () => {
  const prompt = explanationSystemPrompt();

  it("instructs the model to avoid LaTeX/markup delimiters", () => {
    expect(prompt).toContain("Never use LaTeX or markup delimiters");
    expect(prompt).toContain("\\times");
    expect(prompt).toContain("\\frac");
  });

  it("tells the model to use plain ASCII/UTF-8 maths symbols instead", () => {
    expect(prompt).toContain("×, ÷, ², √, ±");
  });

  it("keeps the existing tone and grounding instructions intact", () => {
    expect(prompt).toContain("Never condescend. Never shame.");
    expect(prompt).toContain(
      "Ground every statement in the provided correct answer.",
    );
  });
});
