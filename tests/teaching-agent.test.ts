import { describe, expect, it } from "vitest";
import {
  explanationSystemPrompt,
  fallbackExplanation,
  type TutorRequest,
} from "@/lib/ai/teaching-agent";

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

describe("fallbackExplanation (B3 — no correctness-praise on a fresh explanation)", () => {
  const base: TutorRequest = {
    prompt: "Solve 3x + 7 = 22",
    correctAnswer: "x = 5",
  };

  it("omits any right/wrong framing when wasCorrect is undefined (first exposure)", () => {
    const text = fallbackExplanation(base);
    expect(text).toContain("Here's another way to look at it.");
    expect(text).not.toMatch(/correct\.|not quite/i);
  });

  it("still leads with 'Correct.' when wasCorrect is explicitly true", () => {
    const text = fallbackExplanation({ ...base, wasCorrect: true });
    expect(text.startsWith("Correct.")).toBe(true);
  });

  it("still leads with 'Not quite' when wasCorrect is explicitly false", () => {
    const text = fallbackExplanation({ ...base, wasCorrect: false });
    expect(text.startsWith("Not quite")).toBe(true);
  });

  it("always states the canonical correct answer regardless of framing", () => {
    for (const wasCorrect of [undefined, true, false] as const) {
      expect(fallbackExplanation({ ...base, wasCorrect })).toContain(
        "x = 5",
      );
    }
  });
});
