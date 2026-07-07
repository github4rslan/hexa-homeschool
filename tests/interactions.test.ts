import { describe, expect, it } from "vitest";
import {
  buildHintLadder,
  decideHelpSpine,
  checkDragDrop,
  checkFillBlank,
  checkMcq,
  checkTapReveal,
  clampResumeScore,
  normalizeInteraction,
  pickMisconception,
  resolveResumeStep,
  spokenBlankValue,
  type DragDropInteraction,
  type FillBlankInteraction,
  type TapRevealInteraction,
} from "@/lib/child/interactions";

describe("normalizeInteraction (legacy-safe)", () => {
  it("returns mcq for undefined / null / non-object", () => {
    expect(normalizeInteraction(undefined)).toEqual({ type: "mcq" });
    expect(normalizeInteraction(null)).toEqual({ type: "mcq" });
    expect(normalizeInteraction("nope")).toEqual({ type: "mcq" });
    expect(normalizeInteraction({ type: "mcq" })).toEqual({ type: "mcq" });
  });

  it("accepts a valid fill_blank and rejects a malformed one", () => {
    const good = {
      type: "fill_blank",
      parts: ["2x = ", ""],
      blanks: [{ answers: ["4"], numeric: true }],
    };
    expect(normalizeInteraction(good).type).toBe("fill_blank");

    // parts/blanks length mismatch → falls back to mcq
    const bad = {
      type: "fill_blank",
      parts: ["only one part"],
      blanks: [{ answers: ["x"] }],
    };
    expect(normalizeInteraction(bad)).toEqual({ type: "mcq" });
  });

  it("accepts a valid drag_drop and rejects out-of-range correctChip", () => {
    const good = {
      type: "drag_drop",
      chips: ["a", "b"],
      slots: [{ label: "one", correctChip: 0 }],
    };
    expect(normalizeInteraction(good).type).toBe("drag_drop");

    const bad = {
      type: "drag_drop",
      chips: ["a", "b"],
      slots: [{ label: "one", correctChip: 9 }],
    };
    expect(normalizeInteraction(bad)).toEqual({ type: "mcq" });
  });

  it("accepts a valid tap_reveal and supplies a default instruction", () => {
    const good = normalizeInteraction({
      type: "tap_reveal",
      cards: [
        { label: "A", reveal: "x" },
        { label: "B", reveal: "y" },
      ],
      correctCard: 1,
    });
    expect(good.type).toBe("tap_reveal");
    if (good.type === "tap_reveal") expect(good.instruction).toBeTruthy();
  });
});

describe("answer checking (pure, deterministic)", () => {
  it("checkMcq matches only the correct index", () => {
    expect(checkMcq(2, 2)).toBe(true);
    expect(checkMcq(1, 2)).toBe(false);
    expect(checkMcq(null, 2)).toBe(false);
  });

  it("checkTapReveal matches the correct card", () => {
    const it: TapRevealInteraction = {
      type: "tap_reveal",
      instruction: "pick",
      cards: [
        { label: "A", reveal: "x" },
        { label: "B", reveal: "y" },
      ],
      correctCard: 0,
    };
    expect(checkTapReveal(it, 0)).toBe(true);
    expect(checkTapReveal(it, 1)).toBe(false);
    expect(checkTapReveal(it, null)).toBe(false);
  });

  it("checkFillBlank is case- and whitespace-insensitive and rejects blanks", () => {
    const it: FillBlankInteraction = {
      type: "fill_blank",
      parts: ["", " before E except after ", "."],
      blanks: [{ answers: ["I", "i"] }, { answers: ["C"] }],
    };
    expect(checkFillBlank(it, ["i", "c"])).toBe(true);
    expect(checkFillBlank(it, ["  I  ", "  C  "])).toBe(true);
    expect(checkFillBlank(it, ["i", "z"])).toBe(false);
    expect(checkFillBlank(it, ["i", ""])).toBe(false); // empty blank never passes
    expect(checkFillBlank(it, ["i"])).toBe(false); // wrong count
  });

  it("checkDragDrop requires every slot to hold its correct chip", () => {
    const it: DragDropInteraction = {
      type: "drag_drop",
      chips: ["3", "4", "5"],
      slots: [
        { label: "Triangle", correctChip: 0 },
        { label: "Square", correctChip: 1 },
      ],
    };
    expect(checkDragDrop(it, [0, 1])).toBe(true);
    expect(checkDragDrop(it, [1, 0])).toBe(false);
    expect(checkDragDrop(it, [0, null])).toBe(false);
    expect(checkDragDrop(it, [0])).toBe(false); // wrong count
  });
});

describe("buildHintLadder (nudge → method; the answer is NEVER a text rung)", () => {
  it("returns exactly two escalating rungs", () => {
    const ladder = buildHintLadder({
      hints: ["Gentle nudge", "Be specific"],
      explanation: "First sentence. Second sentence with the full working.",
    });
    expect(ladder).toHaveLength(2);
    expect(ladder[0]).toBe("Gentle nudge");
    expect(ladder[1]).toBe("Be specific");
    // The full-answer rung is gone — the See-it reveal delivers the answer.
    expect(ladder).not.toContain(
      "First sentence. Second sentence with the full working.",
    );
  });

  it("falls back deterministically when no hints are authored", () => {
    const ladder = buildHintLadder({
      hints: [],
      explanation: "Subtract 3. Then divide by 2.",
    });
    expect(ladder).toHaveLength(2);
    expect(ladder[0]).toBeTruthy(); // generic nudge
    expect(ladder[1]).toBe("Subtract 3."); // first sentence as the method rung
  });

  it("never leaks a single-sentence explanation (it usually states the answer)", () => {
    const ladder = buildHintLadder({ explanation: "x = 3 or x = -3" });
    expect(ladder).toHaveLength(2);
    expect(ladder[0]).not.toContain("x = 3");
    expect(ladder[1]).not.toContain("x = 3");
  });
});

describe("spokenBlankValue (voice answers for fill-blank, forgiving)", () => {
  it("pulls the number out of natural speech for numeric blanks", () => {
    expect(spokenBlankValue("it's 12", true)).toBe("12");
    expect(spokenBlankValue("minus 3", true)).toBe("-3");
    expect(spokenBlankValue("negative 3!", true)).toBe("-3");
    expect(spokenBlankValue("I think it's 3.5", true)).toBe("3.5");
    expect(spokenBlankValue("1,000", true)).toBe("1000");
  });

  it("understands small number words", () => {
    expect(spokenBlankValue("three", true)).toBe("3");
    expect(spokenBlankValue("it's twelve", true)).toBe("12");
    expect(spokenBlankValue("minus three", true)).toBe("-3");
  });

  it("passes text blanks through cleaned", () => {
    expect(spokenBlankValue("photosynthesis.", false)).toBe("photosynthesis");
    expect(spokenBlankValue("  a noun ", false)).toBe("a noun");
  });

  it("returns null when there is nothing usable — calm retry, no hard fail", () => {
    expect(spokenBlankValue("", true)).toBeNull();
    expect(spokenBlankValue("um I don't know", true)).toBeNull();
    expect(spokenBlankValue("   ", false)).toBeNull();
  });
});

describe("decideHelpSpine (one graduated ladder: misconception → method → reveal)", () => {
  const base = { maxAttempts: 3, ladderLength: 2 };

  it("attempt 1 with a misconception: the targeted line IS the help — no text rung", () => {
    const d = decideHelpSpine({ ...base, attempts: 1, hasMisconception: true });
    expect(d).toEqual({ showFrom: 0, showTo: 0, reveal: false });
  });

  it("attempt 1 without a misconception: the nudge substitutes as rung 1", () => {
    const d = decideHelpSpine({ ...base, attempts: 1, hasMisconception: false });
    expect(d).toEqual({ showFrom: 0, showTo: 1, reveal: false });
  });

  it("attempt 2: the method appears — and skips the nudge when the misconception carried rung 1", () => {
    const withMisconception = decideHelpSpine({
      ...base,
      attempts: 2,
      hasMisconception: true,
    });
    expect(withMisconception).toEqual({ showFrom: 1, showTo: 2, reveal: false });

    const withoutMisconception = decideHelpSpine({
      ...base,
      attempts: 2,
      hasMisconception: false,
    });
    // The nudge stays visible; the method is the one NEW rung.
    expect(withoutMisconception).toEqual({ showFrom: 0, showTo: 2, reveal: false });
  });

  it("the attempt cap ends the ladder in the reveal", () => {
    expect(
      decideHelpSpine({ ...base, attempts: 3, hasMisconception: true }).reveal,
    ).toBe(true);
    expect(
      decideHelpSpine({ ...base, attempts: 3, hasMisconception: false }).reveal,
    ).toBe(true);
  });

  it("never reveals before the cap", () => {
    for (const attempts of [1, 2]) {
      for (const hasMisconception of [true, false]) {
        expect(
          decideHelpSpine({ ...base, attempts, hasMisconception }).reveal,
        ).toBe(false);
      }
    }
  });
});

describe("pickMisconception (specific, targeted feedback)", () => {
  const misconceptions = [
    "You rounded down — it rounds up.",
    "", // correct slot, ignored
    "That's the nearest ten.",
  ];

  it("returns the authored line for the exact wrong option chosen", () => {
    expect(
      pickMisconception({ misconceptions, selectedIndex: 0, correctIndex: 1 }),
    ).toBe("You rounded down — it rounds up.");
    expect(
      pickMisconception({ misconceptions, selectedIndex: 2, correctIndex: 1 }),
    ).toBe("That's the nearest ten.");
  });

  it("never returns a line for the correct option or a null selection", () => {
    expect(
      pickMisconception({ misconceptions, selectedIndex: 1, correctIndex: 1 }),
    ).toBeNull();
    expect(
      pickMisconception({ misconceptions, selectedIndex: null, correctIndex: 1 }),
    ).toBeNull();
  });

  it("falls back to null for missing, blank, or absent entries", () => {
    // Blank slot (no authored line for that distractor).
    expect(
      pickMisconception({
        misconceptions: ["", "", "  "],
        selectedIndex: 2,
        correctIndex: 0,
      }),
    ).toBeNull();
    // Index past the end of a sparse array.
    expect(
      pickMisconception({ misconceptions, selectedIndex: 9, correctIndex: 1 }),
    ).toBeNull();
    // No misconceptions authored at all (legacy question).
    expect(
      pickMisconception({ selectedIndex: 0, correctIndex: 1 }),
    ).toBeNull();
    expect(
      pickMisconception({
        misconceptions: null,
        selectedIndex: 0,
        correctIndex: 1,
      }),
    ).toBeNull();
  });
});

describe("resume math", () => {
  it("returns null when there is nothing to resume", () => {
    expect(resolveResumeStep(null, 5)).toBeNull();
    expect(resolveResumeStep({ step: 0, score: 0, total: 5 }, 5)).toBeNull();
    expect(resolveResumeStep({ step: 5, score: 5, total: 5 }, 5)).toBeNull(); // finished
  });

  it("returns null when the question count changed (content edit)", () => {
    expect(resolveResumeStep({ step: 2, score: 1, total: 5 }, 7)).toBeNull();
  });

  it("resumes at the saved step mid-lesson", () => {
    expect(resolveResumeStep({ step: 3, score: 2, total: 7 }, 7)).toBe(3);
  });

  it("clamps a resumed score so it never exceeds steps passed", () => {
    expect(clampResumeScore({ step: 3, score: 99, total: 7 }, 3)).toBe(3);
    expect(clampResumeScore({ step: 3, score: -2, total: 7 }, 3)).toBe(0);
    expect(clampResumeScore({ step: 3, score: 2, total: 7 }, 3)).toBe(2);
  });
});
