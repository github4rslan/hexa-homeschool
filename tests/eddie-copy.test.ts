import { describe, expect, it } from "vitest";
import {
  applyTone,
  eddieCorrectLine,
  eddieWrongAnswerLine,
  personalizeYourTurnPrompt,
  pickTone,
  safeFirstName,
} from "@/lib/child/eddie-copy";

describe("safeFirstName (child-safety: first name only, or nothing)", () => {
  it("takes only the first name and capitalises it", () => {
    expect(safeFirstName("aisha khan")).toBe("Aisha");
    expect(safeFirstName("  Tom ")).toBe("Tom");
    expect(safeFirstName("Anne-Marie Smith")).toBe("Anne-Marie");
    expect(safeFirstName("O'Brien")).toBe("O'Brien");
  });

  it("degrades to null for anything unusable — never echoes junk", () => {
    expect(safeFirstName(undefined)).toBeNull();
    expect(safeFirstName(null)).toBeNull();
    expect(safeFirstName("")).toBeNull();
    expect(safeFirstName("X")).toBeNull(); // too short
    expect(safeFirstName("a".repeat(25))).toBeNull(); // too long
    expect(safeFirstName("<script>")).toBeNull();
    expect(safeFirstName("1234")).toBeNull();
  });
});

describe("eddieWrongAnswerLine (answer-reactive, on-rails)", () => {
  it("affirms the ± near-miss as half right and asks for the other half", () => {
    const line = eddieWrongAnswerLine({
      name: "Aisha",
      chosenOption: "x = 3",
      fate: "half",
      misconception: null,
      baseMessage: "Not quite yet — have another go.",
    });
    expect(line).toBe(
      "You picked x = 3 — good thinking, that's one of the two answers. Can you spot the other one, Aisha?",
    );
  });

  it("folds the authored misconception into one warm thought", () => {
    const line = eddieWrongAnswerLine({
      name: "Tom",
      chosenOption: "x = 9",
      fate: "eliminate",
      misconception: "That's 3 squared, not the value of x.",
      baseMessage: "Not quite yet.",
    });
    expect(line).toContain("You picked x = 9, Tom.");
    expect(line).toContain("That's 3 squared, not the value of x.");
    expect(line).toContain("what would you try now?");
  });

  it("personalises the matrix message when nothing more specific exists", () => {
    const line = eddieWrongAnswerLine({
      name: "Aisha",
      chosenOption: null,
      fate: null,
      misconception: null,
      baseMessage: "Not quite yet — have another go. You're closer than you think!",
    });
    expect(line).toBe(
      "Aisha, not quite yet — have another go. You're closer than you think!",
    );
  });

  it("degrades cleanly with no name", () => {
    const half = eddieWrongAnswerLine({
      name: null,
      chosenOption: "x = 3",
      fate: "half",
      misconception: null,
      baseMessage: "base",
    });
    expect(half).toContain("Can you spot the other one?");
    expect(half).not.toContain(", ?");

    const plain = eddieWrongAnswerLine({
      name: null,
      chosenOption: null,
      fate: null,
      misconception: null,
      baseMessage: "Not quite yet.",
    });
    expect(plain).toBe("Not quite yet.");
  });

  it('never says "Wrong" — calm, never punitive', () => {
    for (const fate of ["half", "eliminate", null] as const) {
      const line = eddieWrongAnswerLine({
        name: "Aisha",
        chosenOption: "x = 9",
        fate,
        misconception: null,
        baseMessage: "Not quite yet — have another go.",
      });
      expect(line.toLowerCase()).not.toContain("wrong");
    }
  });
});

describe("pickTone + applyTone (deterministic, emotion-aware)", () => {
  it("is gentler on a tough-day check-in", () => {
    expect(pickTone({ mood: 1 })).toBe("calm");
    expect(pickTone({ mood: 2, category: "encourage" })).toBe("calm");
  });

  it("is calm on a real struggle, encouraging otherwise", () => {
    expect(pickTone({ category: "concept_gap", mood: 4 })).toBe("calm");
    expect(pickTone({ category: "attention", mood: null })).toBe("calm");
    expect(pickTone({ category: "encourage", mood: 4 })).toBe("encouraging");
    expect(pickTone({ category: "careless" })).toBe("encouraging");
  });

  it("is brighter on a win — but keeps a tough day gentle", () => {
    expect(pickTone({ wasCorrect: true, mood: 4 })).toBe("celebratory");
    expect(pickTone({ wasCorrect: true, mood: 1 })).toBe("calm");
  });

  it("applyTone adds a calm lead worded for the band, else passes through", () => {
    expect(applyTone("Have another go.", "calm")).toBe(
      "No rush. Have another go.",
    );
    expect(applyTone("Have another go.", "calm", 2)).toBe(
      "Take a slow breath. Have another go.",
    );
    expect(applyTone("Have another go.", "encouraging")).toBe(
      "Have another go.",
    );
  });

  it("calm correct line stays proud, never flat", () => {
    expect(eddieCorrectLine("Aisha", "calm")).toBe(
      "That's it, Aisha. Well done for sticking with it.",
    );
  });
});

describe("eddieCorrectLine + personalizeYourTurnPrompt (ask, then wait)", () => {
  it("confirms by name, or warmly without one", () => {
    expect(eddieCorrectLine("Aisha")).toBe(
      "Yes, Aisha — that's exactly it. Lovely thinking.",
    );
    expect(eddieCorrectLine(null)).toBe(
      "Yes — that's exactly it. Lovely thinking.",
    );
  });

  it("addresses the Your-turn ask to the child", () => {
    expect(
      personalizeYourTurnPrompt(
        "Your turn — where does x land on the number line?",
        "Aisha",
      ),
    ).toBe("Your turn, Aisha — where does x land on the number line?");
    // No name / unusual prompt → unchanged, never mangled.
    expect(personalizeYourTurnPrompt("Your turn — tap it.", null)).toBe(
      "Your turn — tap it.",
    );
    expect(personalizeYourTurnPrompt("Tap the clue word.", "Aisha")).toBe(
      "Tap the clue word.",
    );
  });
});
