import { describe, expect, it } from "vitest";
import {
  classifyOptions,
  equationBeat,
  equationBeatKind,
  extractRoots,
  MAX_STEP_MS,
  MIN_STEP_MS,
  numberLineSpec,
  sentenceWords,
  splitExpression,
  stepDurationMs,
  wordIsLit,
} from "@/lib/child/animation-timeline";
import {
  normalizeTeachingAnimation,
  speakableExpression,
  stepNarration,
} from "@/lib/child/teaching-animations";

describe("splitExpression (math tokens)", () => {
  it("keeps squares, roots, ± and bracket groups whole", () => {
    expect(splitExpression("x^2 - 9 = 0")).toEqual(["x^2", "-", "9", "=", "0"]);
    expect(splitExpression("x = +/- sqrt(9)")).toEqual([
      "x",
      "=",
      "+/-",
      "sqrt(9)",
    ]);
    expect(splitExpression("(x - 3)(x + 3) = 0")).toEqual([
      "(x - 3)",
      "(x + 3)",
      "=",
      "0",
    ]);
  });
});

describe("equationBeatKind (label → choreography)", () => {
  it("classifies every beat deterministically", () => {
    expect(equationBeatKind("Start")).toBe("start");
    expect(equationBeatKind("Balance")).toBe("balance");
    expect(equationBeatKind("Spot the square")).toBe("square");
    expect(equationBeatKind("Factor")).toBe("factor");
    expect(equationBeatKind("Split")).toBe("factor");
    expect(equationBeatKind("Square root")).toBe("root");
    expect(equationBeatKind("Roots")).toBe("root");
    expect(equationBeatKind("Answer")).toBe("answer");
  });
});

describe("extractRoots (the values that land on the line)", () => {
  it("reads ± roots", () => {
    expect(extractRoots("x = +/- 3")).toEqual([-3, 3]);
  });

  it("reads listed roots", () => {
    expect(extractRoots("x = 3 or x = -3")).toEqual([3, -3]);
  });

  it("returns no roots for irrational answers — never a fake position", () => {
    expect(extractRoots("x = +/- sqrt(10)")).toEqual([]);
  });
});

describe("numberLineSpec (calm, uncrowded line)", () => {
  it("pads one unit beyond the largest root, minimum ±3", () => {
    expect(numberLineSpec([-3, 3])).toEqual({
      min: -4,
      max: 4,
      tickStep: 1,
      marks: [-3, 3],
    });
    expect(numberLineSpec([-1, 1])?.min).toBe(-3);
  });

  it("caps the domain and widens the tick step for big roots", () => {
    const spec = numberLineSpec([-20, 20]);
    expect(spec?.min).toBe(-12);
    expect(spec?.max).toBe(12);
    expect((spec!.max - spec!.min) / spec!.tickStep).toBeLessThanOrEqual(12);
  });

  it("returns null when there are no marks", () => {
    expect(numberLineSpec([])).toBeNull();
  });
});

describe("equationBeat (the full render plan)", () => {
  it("only root/answer beats get a number line", () => {
    const answer = equationBeat({
      label: "Answer",
      expression: "x = +/- 3",
      note: "",
    });
    expect(answer.kind).toBe("answer");
    expect(answer.numberLine?.marks).toEqual([-3, 3]);

    const start = equationBeat({
      label: "Start",
      expression: "x^2 - 9 = 0",
      note: "",
    });
    expect(start.numberLine).toBeNull();
  });
});

describe("stepDurationMs (band-aware pacing)", () => {
  const narration = "Answer. x equals plus or minus 3. Both answers land on the line.";

  it("KS2 holds longer than KS4 on the same beat", () => {
    const ks2 = stepDurationMs({ narration, keyStage: 2 });
    const ks4 = stepDurationMs({ narration, keyStage: 4 });
    expect(ks2).toBeGreaterThan(ks4);
  });

  it("longer narration holds longer, within calm bounds", () => {
    const short = stepDurationMs({ narration: "Start. x squared.", keyStage: 3 });
    const long = stepDurationMs({
      narration: narration + " " + narration + " " + narration,
      keyStage: 3,
    });
    expect(long).toBeGreaterThan(short);
    expect(short).toBeGreaterThanOrEqual(MIN_STEP_MS);
    expect(long).toBeLessThanOrEqual(MAX_STEP_MS);
  });

  it("'Again, slower' stretches every beat", () => {
    const normal = stepDurationMs({ narration, keyStage: 3 });
    const slower = stepDurationMs({ narration, keyStage: 3, slower: true });
    expect(slower).toBeGreaterThan(normal);
  });
});

describe("classifyOptions (eliminate vs keep vs half)", () => {
  it("names the ± near-miss as half the answer", () => {
    const fates = classifyOptions(["x = ±3", "x = 9", "x = ±9", "x = 3"], 0);
    expect(fates).toEqual(["keep", "eliminate", "eliminate", "half"]);
  });

  it("catches the negative half too", () => {
    const fates = classifyOptions(["x = -3", "x = ±3"], 1);
    expect(fates).toEqual(["half", "keep"]);
  });

  it("plain questions just keep/eliminate", () => {
    expect(classifyOptions(["7", "8", "9"], 1)).toEqual([
      "eliminate",
      "keep",
      "eliminate",
    ]);
  });
});

describe("sentence helpers", () => {
  it("splits and caps sentence words", () => {
    expect(sentenceWords("The  cat sat")).toEqual(["The", "cat", "sat"]);
    expect(sentenceWords("a b c d", 2)).toEqual(["a", "b"]);
  });

  it("wordIsLit lights the focus word and the sweep position", () => {
    expect(
      wordIsLit({ word: "Verb", index: 3, focus: "verb", sweepIndex: 0 }),
    ).toBe(true);
    expect(wordIsLit({ word: "cat", index: 1, sweepIndex: 1 })).toBe(true);
    expect(wordIsLit({ word: "cat", index: 1, sweepIndex: 0 })).toBe(false);
  });
});

describe("speakableExpression (TTS reads maths as words)", () => {
  it("speaks squares, ± and roots naturally", () => {
    expect(speakableExpression("x^2 - 9 = 0")).toBe(
      "x squared minus 9 equals 0",
    );
    expect(speakableExpression("x = +/- sqrt(9)")).toBe(
      "x equals plus or minus the square root of 9",
    );
    expect(speakableExpression("(x - 3)(x + 3) = 0")).toBe(
      "x minus 3, times x plus 3 equals 0",
    );
  });

  it("stepNarration leaves prose expressions untouched", () => {
    const narration = stepNarration({
      label: "Read",
      expression: "Re-read the whole sentence",
      note: "Take your time.",
    });
    expect(narration).toContain("Re-read the whole sentence");
    expect(narration).not.toContain("minus");
  });
});

describe("difference-of-squares derivation (the choreographed reveal)", () => {
  it("derives the factor → roots → ± story for perfect squares", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "Solve x² − 9 = 0.",
      explanation: "x = ±3",
    });
    expect(anim.type).toBe("equation_steps");
    const labels = anim.steps.map((s) => s.label);
    expect(labels).toEqual([
      "Start",
      "Spot the square",
      "Factor",
      "Roots",
      "Answer",
    ]);
    expect(anim.steps[2].expression).toBe("(x - 3)(x + 3) = 0");
    expect(anim.steps[4].expression).toBe("x = +/- 3");
  });

  it("keeps the balance story for non-perfect squares (no fake roots)", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "Solve x² − 10 = 0.",
      explanation: "x = ±√10",
    });
    const labels = anim.steps.map((s) => s.label);
    expect(labels).toContain("Balance");
    expect(labels).not.toContain("Factor");
  });
});
