import { describe, expect, it } from "vitest";
import {
  derivePlaceValueLesson,
  normalizeTeachingAnimation,
  parsePlaceValueLesson,
  parseRoundingLesson,
} from "@/lib/child/teaching-animations";
import {
  buildYourTurn,
  placeValueStageSpec,
} from "@/lib/child/animation-timeline";

describe("parseRoundingLesson", () => {
  it("parses 'Round 486 to the nearest 100' and rounds up", () => {
    expect(parseRoundingLesson("Round 486 to the nearest 100")).toEqual({
      value: 486,
      place: 100,
      lower: 400,
      upper: 500,
      mid: 450,
      rounded: 500,
    });
  });

  it("handles the word place and a comma ('nearest thousand')", () => {
    expect(parseRoundingLesson("Round 7,482 to the nearest thousand")).toEqual({
      value: 7482,
      place: 1000,
      lower: 7000,
      upper: 8000,
      mid: 7500,
      rounded: 7000,
    });
  });

  it("rounds a halfway value up (450 → 500)", () => {
    expect(parseRoundingLesson("round 450 to the nearest 100")?.rounded).toBe(500);
  });

  it("returns null when the prompt isn't a rounding question", () => {
    expect(parseRoundingLesson("What is 3/4 + 1/8?")).toBeNull();
  });
});

describe("parsePlaceValueLesson", () => {
  it("parses 'value of 6 in 3,652' into columns", () => {
    const l = parsePlaceValueLesson("What is the value of 6 in 3,652?");
    expect(l).not.toBeNull();
    expect(l).toMatchObject({
      number: "3652",
      digit: 6,
      highlightIndex: 1,
      multiplier: 100,
      placeValue: 600,
      columnName: "hundreds",
    });
    expect(l?.labels).toEqual(["Th", "H", "T", "O"]);
  });

  it("returns null when the named digit is absent", () => {
    expect(parsePlaceValueLesson("value of 9 in 3652")).toBeNull();
  });
});

describe("derivePlaceValueLesson", () => {
  it("builds a place_value rounding animation with a canonical first step", () => {
    const anim = derivePlaceValueLesson("Round 486 to the nearest 100");
    expect(anim?.type).toBe("place_value");
    expect(anim?.steps[0].expression).toBe("round 486 to the nearest 100");
    expect(anim?.steps.at(-1)?.note).toContain("rounds up to 500");
  });

  it("builds a place_value columns animation", () => {
    const anim = derivePlaceValueLesson("value of 6 in 3652");
    expect(anim?.type).toBe("place_value");
    expect(anim?.steps[0].expression).toBe("value of 6 in 3652");
    expect(anim?.steps.at(-1)?.expression).toBe("6 × 100 = 600");
  });

  it("returns null for an unrelated prompt", () => {
    expect(derivePlaceValueLesson("Solve x^2 - 9 = 0")).toBeNull();
  });
});

describe("normalizeTeachingAnimation routing", () => {
  it("routes a rounding prompt to the place_value type", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "Round 7,482 to the nearest thousand",
      explanation: "",
    });
    expect(anim.type).toBe("place_value");
  });

  it("still routes a fraction prompt to fraction_bars (no regression)", () => {
    const anim = normalizeTeachingAnimation({
      prompt: "What is 3/4 + 1/8?",
      explanation: "",
    });
    expect(anim.type).toBe("fraction_bars");
  });
});

describe("placeValueStageSpec", () => {
  it("re-parses the canonical rounding step into stage geometry", () => {
    const anim = derivePlaceValueLesson("Round 486 to the nearest 100")!;
    const spec = placeValueStageSpec(anim.steps);
    expect(spec).toMatchObject({ kind: "rounding", value: 486, rounded: 500 });
  });

  it("re-parses the canonical columns step into stage geometry", () => {
    const anim = derivePlaceValueLesson("value of 6 in 3652")!;
    const spec = placeValueStageSpec(anim.steps);
    expect(spec).toMatchObject({ kind: "columns", digit: 6, placeValue: 600 });
  });
});

describe("buildYourTurn for place_value", () => {
  it("asks a neutral 'which is the answer?' recall from the real options", () => {
    const task = buildYourTurn({
      type: "place_value",
      steps: [{ label: "Answer", expression: "6 × 100 = 600" }],
      options: ["60", "600", "6000"],
      correctIndex: 1,
    });
    expect(task).toEqual({
      kind: "tap_choice",
      prompt: "Your turn — which is the answer?",
      choices: ["60", "600", "6000"],
      correct: 1,
    });
  });

  it("returns null when there are no options to recall against", () => {
    expect(
      buildYourTurn({
        type: "place_value",
        steps: [{ label: "Answer", expression: "6 × 100 = 600" }],
      }),
    ).toBeNull();
  });
});
