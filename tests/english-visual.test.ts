import { describe, expect, it } from "vitest";
import { deriveEnglishVisual, pluralRuleFor } from "@/lib/child/english-visual";

describe("deriveEnglishVisual", () => {
  it("ignores non-English topics", () => {
    expect(deriveEnglishVisual("maths_ks2_arith", "What is the plural of 'box'?")).toBeNull();
    expect(deriveEnglishVisual("sci_ks2_living", "Which animal is a mammal?")).toBeNull();
  });

  it("builds a plural spelling-rule figure for 'plural of box' (add es)", () => {
    const spec = deriveEnglishVisual("eng_ks2_reading", "What is the plural of 'box'?");
    expect(spec?.kind).toBe("plural_rule");
    if (spec?.kind !== "plural_rule") throw new Error("expected plural_rule");
    expect(spec.base).toBe("box");
    expect(spec.ending).toBe("es");
    expect(spec.rule).toMatch(/x/);
  });

  it("uses the 'ch' rule for 'plural of church'", () => {
    const spec = deriveEnglishVisual("eng_ks2_reading", "What is the plural of 'church'?");
    expect(spec?.kind).toBe("plural_rule");
    if (spec?.kind !== "plural_rule") throw new Error("expected plural_rule");
    expect(spec.base).toBe("church");
    expect(spec.ending).toBe("es");
    expect(spec.rule).toMatch(/ch/);
  });

  it("never spells out the finished plural in the alt or rule (no pre-answer)", () => {
    const spec = deriveEnglishVisual("eng_ks2_reading", "What is the plural of 'box'?");
    expect(spec?.alt.toLowerCase()).not.toContain("boxes");
    if (spec?.kind === "plural_rule") expect(spec.rule.toLowerCase()).not.toContain("boxes");
  });

  it("shows letter tiles for a single quoted word (opposite of 'begin')", () => {
    const spec = deriveEnglishVisual("eng_ks2_reading", "What is the opposite of 'begin'?");
    expect(spec?.kind).toBe("letter_tiles");
    if (spec?.kind !== "letter_tiles") throw new Error("expected letter_tiles");
    expect(spec.word).toBe("begin");
  });

  it("does not trigger on a quoted sentence (no misleading single-word figure)", () => {
    expect(
      deriveEnglishVisual("eng_ks3_grammar", "Which word is the verb? 'The athlete sprinted quickly.'"),
    ).toBeNull();
    expect(
      deriveEnglishVisual("eng_ks3_reading", "'The room was an oven.' This is a:"),
    ).toBeNull();
  });

  it("returns null for a spelling prompt with no quoted word", () => {
    expect(deriveEnglishVisual("eng_ks2_reading", "Which word is spelled correctly?")).toBeNull();
  });

  it("returns null (never a wrong figure) for the irregular plural of 'child' (B1)", () => {
    expect(
      deriveEnglishVisual("eng_grammar", "Pick the correct plural of 'child'."),
    ).toBeNull();
  });

  it("returns null (never a wrong figure) for the irregular plural of 'leaf' (B1)", () => {
    expect(deriveEnglishVisual("eng_ks2_reading", "The plural of 'leaf' is:")).toBeNull();
  });

  it("returns null for other known irregular plural bases (B1)", () => {
    for (const base of ["man", "woman", "mouse", "foot", "tooth", "person", "goose", "ox", "knife", "wife", "life", "wolf", "half", "shelf", "thief"]) {
      expect(deriveEnglishVisual("eng_ks2_reading", `What is the plural of '${base}'?`)).toBeNull();
    }
  });

  it("still derives the correct rule for genuinely regular words (B1 regression guard)", () => {
    expect(deriveEnglishVisual("eng_ks2_reading", "What is the plural of 'box'?")?.kind).toBe("plural_rule");
    expect(deriveEnglishVisual("eng_ks2_reading", "What is the plural of 'church'?")?.kind).toBe("plural_rule");
    expect(deriveEnglishVisual("eng_ks2_reading", "What is the plural of 'baby'?")?.kind).toBe("plural_rule");
  });

  it("does not trigger letter_tiles on a multi-word onomatopoeia list question (B2)", () => {
    expect(
      deriveEnglishVisual("eng_devices", "'Buzz', 'crash' and 'splash' are examples of:"),
    ).toBeNull();
  });

  it("still fires letter_tiles when exactly one quoted word is present", () => {
    const spec = deriveEnglishVisual("eng_devices", "'Buzz' is an example of onomatopoeia because:");
    expect(spec?.kind).toBe("letter_tiles");
    if (spec?.kind !== "letter_tiles") throw new Error("expected letter_tiles");
    expect(spec.word).toBe("buzz");
  });

  it("does NOT fire letter_tiles on the live-reproduced 'stabbed' effect/connotation question (B4)", () => {
    expect(
      deriveEnglishVisual(
        "eng_analysis",
        "A writer's choice of a harsh word like 'stabbed' affects the:",
      ),
    ).toBeNull();
  });

  it("does NOT fire letter_tiles on other effect/analysis-language prompts with a single quoted word (B4)", () => {
    expect(
      deriveEnglishVisual("eng_analysis", "What effect does the word 'sagged' create?"),
    ).toBeNull();
    expect(
      deriveEnglishVisual("eng_analysis", "What mood does the word 'gloomy' suggest?"),
    ).toBeNull();
    expect(
      deriveEnglishVisual("eng_analysis", "The connotation of 'prison' in this context is:"),
    ).toBeNull();
  });
});

describe("pluralRuleFor", () => {
  it("adds -es for words ending in s/x/z/ch/sh", () => {
    expect(pluralRuleFor("box").ending).toBe("es");
    expect(pluralRuleFor("bus").ending).toBe("es");
    expect(pluralRuleFor("church").ending).toBe("es");
    expect(pluralRuleFor("dish").ending).toBe("es");
  });

  it("turns consonant + y into -ies", () => {
    expect(pluralRuleFor("baby").ending).toBe("ies");
    expect(pluralRuleFor("party").ending).toBe("ies");
  });

  it("just adds -s otherwise (incl. vowel + y)", () => {
    expect(pluralRuleFor("cat").ending).toBe("s");
    expect(pluralRuleFor("day").ending).toBe("s");
  });
});

describe("deriveEnglishVisual B1 live repro (exact seeded prompts)", () => {
  it("matches the exact seeded 'child' mastery prompt", () => {
    expect(
      deriveEnglishVisual("eng_grammar", "Pick the correct plural of 'child'."),
    ).toBeNull();
  });
});
