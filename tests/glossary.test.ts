import { describe, expect, it } from "vitest";
import { normaliseGlossary, splitByGlossary } from "@/lib/child/glossary";

const TERMS = [
  { term: "denominator", definition: "The number on the bottom of a fraction." },
  { term: "number line", definition: "A line with numbers in order." },
];

describe("normaliseGlossary", () => {
  it("keeps valid entries and trims them", () => {
    expect(
      normaliseGlossary([{ term: "  Sum ", definition: " add up " }]),
    ).toEqual([{ term: "Sum", definition: "add up" }]);
  });

  it("drops malformed / empty / duplicate entries", () => {
    expect(
      normaliseGlossary([
        { term: "", definition: "x" },
        { term: "x", definition: "" },
        { term: "Quotient", definition: "answer to a division" },
        { term: "quotient", definition: "dup" },
        null,
        "nope",
        { term: 5, definition: 6 },
      ]),
    ).toEqual([{ term: "Quotient", definition: "answer to a division" }]);
  });

  it("returns [] for non-arrays", () => {
    expect(normaliseGlossary(undefined)).toEqual([]);
    expect(normaliseGlossary("x")).toEqual([]);
  });
});

describe("splitByGlossary", () => {
  it("returns a single text segment when there are no terms", () => {
    expect(splitByGlossary("hello world", [])).toEqual([
      { kind: "text", text: "hello world" },
    ]);
  });

  it("marks a matched term as a defined segment (case-insensitive)", () => {
    const segs = splitByGlossary("Find the Denominator of the fraction.", TERMS);
    expect(segs).toEqual([
      { kind: "text", text: "Find the " },
      {
        kind: "term",
        text: "Denominator",
        definition: "The number on the bottom of a fraction.",
      },
      { kind: "text", text: " of the fraction." },
    ]);
  });

  it("matches multi-word terms and whole words only", () => {
    const segs = splitByGlossary("Move along the number line now.", TERMS);
    const term = segs.find((s) => s.kind === "term");
    expect(term).toEqual({
      kind: "term",
      text: "number line",
      definition: "A line with numbers in order.",
    });
  });

  it("does not match a substring inside another word", () => {
    // "numbers" should not match the "number line" term at a word boundary.
    const segs = splitByGlossary("There are numbers here.", TERMS);
    expect(segs).toEqual([{ kind: "text", text: "There are numbers here." }]);
  });

  it("highlights only the first occurrence of a term", () => {
    const segs = splitByGlossary("denominator then denominator again", TERMS);
    const terms = segs.filter((s) => s.kind === "term");
    expect(terms).toHaveLength(1);
    // The second occurrence stays in a text segment.
    expect(segs[segs.length - 1]).toEqual({
      kind: "text",
      text: " then denominator again",
    });
  });

  it("reconstructs the original text exactly from the segments", () => {
    const text = "The denominator sits on a number line, sort of.";
    const segs = splitByGlossary(text, TERMS);
    expect(segs.map((s) => s.text).join("")).toBe(text);
  });
});
