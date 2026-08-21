import { describe, expect, it } from "vitest";
import {
  areaModelSpec,
  buildYourTurn,
  checkYourTurnOrder,
  checkYourTurnTap,
  classifyOptions,
  equationBeat,
  equationBeatKind,
  extractRoots,
  MAX_STEP_MS,
  MIN_STEP_MS,
  numberLineSpec,
  parabolaGraphSpec,
  sentenceWords,
  splitExpression,
  squareDotsSpec,
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
  it("root beats land on the number line; the answer beat gets the graph", () => {
    const roots = equationBeat({
      label: "Roots",
      expression: "x = 3 or x = -3",
      note: "",
    });
    expect(roots.numberLine?.marks).toEqual([3, -3]);
    expect(roots.graph).toBeNull();

    const answer = equationBeat({
      label: "Answer",
      expression: "x = +/- 3",
      note: "",
    });
    expect(answer.kind).toBe("answer");
    expect(answer.graph?.intercepts.map((i) => i.label)).toEqual([-3, 3]);

    const start = equationBeat({
      label: "Start",
      expression: "x^2 - 9 = 0",
      note: "",
    });
    expect(start.numberLine).toBeNull();
    expect(start.graph).toBeNull();
  });

  it("factor beats carry the area model; square beats carry the dot grid", () => {
    const factor = equationBeat({
      label: "Factor",
      expression: "(x - 3)(x + 3) = 0",
      note: "",
    });
    expect(factor.areaModel?.root).toBe(3);

    const square = equationBeat({
      label: "Spot the square",
      expression: "9 = 3^2",
      note: "",
    });
    expect(square.squareDots).toHaveLength(9);
  });
});

describe("parabolaGraphSpec (algebra ↔ picture)", () => {
  it("crosses the x-axis at −r and +r, symmetric about the y-axis", () => {
    const spec = parabolaGraphSpec(3, 320, 170)!;
    expect(spec.intercepts.map((i) => i.label)).toEqual([-3, 3]);
    const [left, right] = spec.intercepts;
    expect(left.x + right.x).toBeCloseTo(320, 0); // mirrored about centre
    expect(spec.yAxisX).toBeCloseTo(160, 0);
    expect(spec.vertex.x).toBeCloseTo(160, 0);
  });

  it("puts the vertex below the x-axis (SVG y grows downward)", () => {
    const spec = parabolaGraphSpec(3)!;
    expect(spec.vertex.y).toBeGreaterThan(spec.xAxisY);
    expect(spec.label).toBe("y = x² − 9");
  });

  it("returns null for non-integer or non-positive roots — never a fake picture", () => {
    expect(parabolaGraphSpec(0)).toBeNull();
    expect(parabolaGraphSpec(-3)).toBeNull();
    expect(parabolaGraphSpec(Math.sqrt(10))).toBeNull();
  });
});

describe("areaModelSpec (difference of squares you can see)", () => {
  it("conserves area: x² − r² = pieces = (x+r)(x−r)", () => {
    for (const root of [2, 3, 4, 5]) {
      const spec = areaModelSpec(root)!;
      const { x } = spec;
      const removed = x * x - root * root;
      const pieces =
        spec.bottom.w * spec.bottom.h + spec.topStrip.w * spec.topStrip.h;
      const final = spec.final.w * spec.final.h;
      expect(pieces).toBe(removed);
      expect(final).toBe(removed);
    }
  });

  it("rejects invalid roots", () => {
    expect(areaModelSpec(0)).toBeNull();
    expect(areaModelSpec(2.5)).toBeNull();
  });
});

describe("squareDotsSpec (a square number IS a square)", () => {
  it("builds r² dots in an r×r grid within the calm cap", () => {
    expect(squareDotsSpec(3)).toHaveLength(9);
    expect(squareDotsSpec(4)).toHaveLength(16);
  });

  it("skips the delight when it would become noise", () => {
    expect(squareDotsSpec(1)).toBeNull();
    expect(squareDotsSpec(5)).toBeNull();
    expect(squareDotsSpec(2.5)).toBeNull();
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

describe("buildYourTurn (active recall, deterministic, no AI)", () => {
  it("equation with integer roots → tap where x lands", () => {
    const task = buildYourTurn({
      type: "equation_steps",
      steps: [
        { label: "Start", expression: "x^2 - 9 = 0" },
        { label: "Answer", expression: "x = +/- 3" },
      ],
    });
    expect(task?.kind).toBe("tap_choice");
    if (task?.kind !== "tap_choice") return;
    expect(task.choices).toContain("-3 and 3");
    expect(task.choices[task.correct]).toBe("-3 and 3");
    expect(checkYourTurnTap(task, task.correct)).toBe(true);
    expect(checkYourTurnTap(task, (task.correct + 1) % 3)).toBe(false);
  });

  it("irrational equation → recall the ± idea, never fake positions", () => {
    const task = buildYourTurn({
      type: "equation_steps",
      steps: [{ label: "Answer", expression: "x = +/- sqrt(10)" }],
    });
    expect(task?.kind).toBe("tap_choice");
    if (task?.kind !== "tap_choice") return;
    expect(task.choices[task.correct]).toBe("x = +/- sqrt(10)");
  });

  it("choice strategy → tap the half-answer distractor when one exists", () => {
    const task = buildYourTurn({
      type: "choice_strategy",
      steps: [],
      options: ["x = ±3", "x = 9", "x = 3"],
      correctIndex: 0,
    });
    expect(task?.kind).toBe("tap_choice");
    if (task?.kind !== "tap_choice") return;
    expect(task.correct).toBe(2); // "x = 3" is only half the answer
  });

  it("grammar → tap the keyword only when the focus is a real word", () => {
    const withKeyword = buildYourTurn({
      type: "grammar_highlight",
      steps: [
        { label: "Read", expression: "The dog ran quickly", focus: "quickly" },
      ],
    });
    expect(withKeyword?.kind).toBe("tap_choice");

    const metaFocus = buildYourTurn({
      type: "grammar_highlight",
      steps: [{ label: "Find", expression: "Look for the answer", focus: "zzz" }],
    });
    expect(metaFocus).toBeNull();
  });

  it("science → order the steps, checked as a sequence", () => {
    const task = buildYourTurn({
      type: "science_sequence",
      steps: [
        { label: "Start", expression: "" },
        { label: "Change", expression: "" },
        { label: "Result", expression: "" },
      ],
    });
    expect(task?.kind).toBe("order_steps");
    if (task?.kind !== "order_steps") return;
    // Items are rotated: display = [Change, Result, Start]
    expect(task.items).toEqual(["Change", "Result", "Start"]);
    // Correct tap sequence must visit Start, Change, Result in true order:
    const startAt = task.items.indexOf("Start");
    const changeAt = task.items.indexOf("Change");
    const resultAt = task.items.indexOf("Result");
    expect(checkYourTurnOrder(task, [startAt, changeAt, resultAt])).toBe(true);
    expect(checkYourTurnOrder(task, [changeAt, startAt, resultAt])).toBe(false);
    expect(checkYourTurnOrder(task, [startAt])).toBe(false); // incomplete
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

describe("B2: subject-gated grammar/science derivation (no false-subject match)", () => {
  it("never renders the Science walkthrough for an English question that merely contains the word 'sound'", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "'Silently, slowly, secretly she crept.' The repeated 's' sound is:",
      explanation: "Repeating the same starting sound is alliteration.",
      subject: "english",
    });
    expect(anim.type).not.toBe("science_sequence");
    // The broadened literary-device keyword list should still route this to a
    // real grammar/reading-devices walkthrough, not the generic fallback.
    expect(anim.type).toBe("grammar_highlight");
  });

  it("still falls through to the generic strategy when the subject is known and no deriver matches", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "What is the main idea of the passage?",
      explanation: "Look at what the writer keeps coming back to.",
      subject: "english",
    });
    expect(anim.type).toBe("choice_strategy");
  });

  it("a genuine Science 'sound' question still resolves to the Science walkthrough", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "Sound waves travel fastest through which medium?",
      explanation: "Sound needs particles to travel, so it moves fastest through solids.",
      subject: "science",
    });
    expect(anim.type).toBe("science_sequence");
  });

  it("without a known subject, the broadened grammar keyword list still wins over the Science deriver", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "'Silently, slowly, secretly she crept.' The repeated 's' sound is:",
      explanation: "Repeating the same starting sound is alliteration.",
    });
    expect(anim.type).toBe("grammar_highlight");
  });
});
