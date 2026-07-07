import { describe, expect, it } from "vitest";
import {
  charAlignmentToWords,
  currentWordIndex,
  normalizeWordTimings,
  type CharAlignment,
} from "@/lib/child/caption-timing";

/** Build a char alignment for a string with 0.1s per character. */
function align(text: string): CharAlignment {
  const characters = [...text];
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => i * 0.1),
    character_end_times_seconds: characters.map((_, i) => (i + 1) * 0.1),
  };
}

describe("charAlignmentToWords", () => {
  it("collapses characters into word timings", () => {
    const words = charAlignmentToWords(align("x equals 3"));
    expect(words.map((w) => w.word)).toEqual(["x", "equals", "3"]);
    expect(words[0].start).toBeCloseTo(0);
    expect(words[0].end).toBeCloseTo(0.1);
    expect(words[1].start).toBeCloseTo(0.2); // after the space
    expect(words[2].end).toBeCloseTo(1.0);
  });

  it("handles leading/trailing/multiple spaces", () => {
    const words = charAlignmentToWords(align("  two   words "));
    expect(words.map((w) => w.word)).toEqual(["two", "words"]);
  });

  it("returns [] for an empty alignment", () => {
    expect(charAlignmentToWords(align(""))).toEqual([]);
  });
});

describe("currentWordIndex (the karaoke cursor)", () => {
  const words = charAlignmentToWords(align("one two three"));

  it("is -1 before the first word starts", () => {
    expect(currentWordIndex(words, -0.5)).toBe(-1);
  });

  it("advances monotonically with time — never flickers back", () => {
    let last = -1;
    for (let t = 0; t <= 1.4; t += 0.05) {
      const index = currentWordIndex(words, t);
      expect(index).toBeGreaterThanOrEqual(last);
      last = index;
    }
    expect(last).toBe(2);
  });

  it("holds the final word after the clip ends", () => {
    expect(currentWordIndex(words, 99)).toBe(2);
  });
});

describe("normalizeWordTimings (boundary guard)", () => {
  it("accepts a clean payload", () => {
    const raw = [{ word: "hi", start: 0, end: 0.4 }];
    expect(normalizeWordTimings(raw)).toEqual(raw);
  });

  it("rejects malformed payloads so captions degrade, never break", () => {
    expect(normalizeWordTimings(null)).toBeNull();
    expect(normalizeWordTimings([])).toBeNull();
    expect(normalizeWordTimings([{ word: "hi" }])).toBeNull();
    expect(normalizeWordTimings([{ word: "hi", start: NaN, end: 1 }])).toBeNull();
    expect(normalizeWordTimings("words")).toBeNull();
  });
});
