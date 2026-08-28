import { describe, expect, it } from "vitest";
import { detectCommandWord } from "@/lib/child/command-words";

describe("detectCommandWord", () => {
  it("matches a prompt that opens with a known command word (case-insensitive)", () => {
    expect(detectCommandWord("Calculate the exterior angle of a regular pentagon.")?.word).toBe(
      "Calculate",
    );
    expect(detectCommandWord("explain why arteries have thick walls.")?.word).toBe("Explain");
  });

  it("matches every authored command word", () => {
    const words = [
      "Calculate",
      "Explain",
      "Describe",
      "Evaluate",
      "Compare",
      "Estimate",
    ];
    for (const word of words) {
      expect(detectCommandWord(`${word} the thing.`)?.word).toBe(word);
    }
    expect(detectCommandWord("Show that the result holds.")?.word).toBe("Show that");
  });

  it("returns null when no command word opens the prompt", () => {
    expect(detectCommandWord("Where does gas exchange happen in the lungs?")).toBeNull();
    expect(detectCommandWord("What is ½ of 18?")).toBeNull();
  });

  it("only matches the OPENING word, never a mid-sentence use of the same word", () => {
    // "Compare" appears, but the prompt doesn't open with it.
    expect(detectCommandWord("Which of these is used to compare two things?")).toBeNull();
  });

  it("requires a whole-word match, not a prefix of a longer word", () => {
    // "Estimated" starts with "Estimate" but is a different word.
    expect(detectCommandWord("Estimated 39 x 21.")).toBeNull();
  });

  it("prefers the longer 'Show that' phrase over any shorter overlapping entry", () => {
    const match = detectCommandWord("Show that 2x + 3 = 11 gives x = 4.");
    expect(match?.word).toBe("Show that");
  });
});
