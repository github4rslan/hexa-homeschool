import { describe, expect, it } from "vitest";
import {
  buildHintLadder,
  checkDragDrop,
  checkFillBlank,
  checkMcq,
  checkTapReveal,
  clampResumeScore,
  normalizeInteraction,
  resolveResumeStep,
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

describe("buildHintLadder (nudge → specific → full)", () => {
  it("always returns exactly three escalating rungs", () => {
    const ladder = buildHintLadder({
      hints: ["Gentle nudge", "Be specific"],
      explanation: "First sentence. Second sentence with the full working.",
    });
    expect(ladder).toHaveLength(3);
    expect(ladder[0]).toBe("Gentle nudge");
    expect(ladder[1]).toBe("Be specific");
    // Final rung is the full human-authored explanation.
    expect(ladder[2]).toContain("full working");
  });

  it("falls back deterministically when no hints are authored", () => {
    const ladder = buildHintLadder({
      hints: [],
      explanation: "Subtract 3. Then divide by 2.",
    });
    expect(ladder).toHaveLength(3);
    expect(ladder[0]).toBeTruthy(); // generic nudge
    expect(ladder[1]).toBe("Subtract 3."); // first sentence as the specific rung
    expect(ladder[2]).toBe("Subtract 3. Then divide by 2."); // full explanation
  });

  it("handles a single-sentence explanation without crashing", () => {
    const ladder = buildHintLadder({ explanation: "Just one sentence" });
    expect(ladder).toHaveLength(3);
    expect(ladder[2]).toBe("Just one sentence");
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
