import { describe, expect, it } from "vitest";
import { deriveScienceVisual } from "@/lib/child/science-visual";

describe("deriveScienceVisual", () => {
  it("ignores non-science topics", () => {
    expect(deriveScienceVisual("maths_ks2_arith", "Which of these do plants need to grow?")).toBeNull();
    expect(deriveScienceVisual("eng_ks3_reading", "The room was an oven.")).toBeNull();
  });

  it("draws a plant diagram for a plant-parts prompt (living topic)", () => {
    const spec = deriveScienceVisual("sci_ks2_living", "Which part of a plant takes in water?");
    expect(spec?.kind).toBe("plant_parts");
    expect(spec?.alt).toMatch(/roots/i);
  });

  it("draws a plant diagram for 'what do plants need to grow'", () => {
    const spec = deriveScienceVisual("sci_ks2_living", "Which of these do plants need to grow?");
    expect(spec?.kind).toBe("plant_parts");
  });

  it("prefers a food chain over the plant diagram when eating is described", () => {
    const spec = deriveScienceVisual("sci_ks2_living", "Animals that eat only plants are called:");
    expect(spec?.kind).toBe("food_chain");
    if (spec?.kind !== "food_chain") throw new Error("expected food_chain");
    expect(spec.links).toEqual(["Grass", "Rabbit", "Fox"]);
  });

  it("draws a life-cycle ring for a tadpole prompt", () => {
    const spec = deriveScienceVisual("sci_ks2_living", "A baby frog is called a:");
    expect(spec?.kind).toBe("life_cycle");
    if (spec?.kind !== "life_cycle") throw new Error("expected life_cycle");
    expect(spec.stages).toEqual(["Egg", "Tadpole", "Froglet", "Frog"]);
  });

  it("draws a states-of-matter grid for a freezing prompt", () => {
    const spec = deriveScienceVisual("sci_ks2_materials", "When water freezes it becomes:");
    expect(spec?.kind).toBe("states_of_matter");
  });

  it("draws a states-of-matter grid for a melting prompt", () => {
    const spec = deriveScienceVisual("sci_ks2_materials", "Heating ice makes it:");
    expect(spec?.kind).toBe("states_of_matter");
  });

  it("draws a cell diagram only on the cells topic", () => {
    const spec = deriveScienceVisual("sci_ks3_cells", "Which part controls the cell?");
    expect(spec?.kind).toBe("cell");
    // The same 'cell' word on a non-cell topic should not force a cell diagram.
    const living = deriveScienceVisual("sci_ks2_living", "Which living things make their own food using sunlight?");
    expect(living?.kind).not.toBe("cell");
  });

  it("draws a material-property test for a 'which material is waterproof' prompt", () => {
    const spec = deriveScienceVisual("sci_ks2_materials", "Which material is waterproof?");
    expect(spec?.kind).toBe("material_property");
    if (spec?.kind !== "material_property") throw new Error("expected material_property");
    expect(spec.property).toBe("waterproof");
    // Must NOT pre-answer: the figure never names a candidate material.
    expect(spec.alt.toLowerCase()).not.toMatch(/plastic|paper|cotton|cardboard/);
  });

  it("draws a transparent test for 'lets light through'", () => {
    const spec = deriveScienceVisual("sci_ks2_materials", "Which material lets light through?");
    expect(spec?.kind).toBe("material_property");
    if (spec?.kind !== "material_property") throw new Error("expected material_property");
    expect(spec.property).toBe("transparent");
  });

  it("prefers states-of-matter over material-property when both could match", () => {
    // "When water freezes it becomes: ice" is a state change, not a property test.
    const spec = deriveScienceVisual("sci_ks2_materials", "When water freezes it becomes:");
    expect(spec?.kind).toBe("states_of_matter");
  });

  it("returns null for a science prompt with no confident shape", () => {
    // "Which of these is a metal?" is a category, not an illustrable property test.
    expect(deriveScienceVisual("sci_ks2_materials", "Which of these is a metal?")).toBeNull();
    expect(deriveScienceVisual("sci_ks2_living", "Which animal is a mammal?")).toBeNull();
  });

  it("never pre-answers: the cell diagram alt omits the cell wall", () => {
    const spec = deriveScienceVisual("sci_ks3_cells", "Which structure do plant cells have that animal cells do not?");
    expect(spec?.kind).toBe("cell");
    expect(spec?.alt).not.toMatch(/wall/i);
  });

  // B1 (2026-08-27): the states-of-matter branch used to match the bare word
  // "gas" anywhere in the prompt with no topic gate, so it wrongly rendered a
  // Solid/Liquid/Gas particle diagram on unrelated real questions. F5 (same
  // run) then gave sci_body its own correct figure, so this prompt now draws
  // an honest respiratory diagram instead of the wrong one (see the F5 test
  // below) — the key assertion here is simply that it is NOT states_of_matter.
  it("does not draw a states-of-matter diagram on a Human Body Systems 'gas exchange' question", () => {
    expect(
      deriveScienceVisual("sci_body", "Where does gas exchange happen in the lungs?")?.kind,
    ).not.toBe("states_of_matter");
  });

  it("does not draw a states-of-matter diagram on a Chemical Reactions 'what gas is produced' question", () => {
    expect(
      deriveScienceVisual("sci_reactions", "What gas is produced when an acid reacts with a metal?"),
    ).toBeNull();
  });

  it("does not draw a states-of-matter diagram on an Ecology 'which gas do plants remove' question", () => {
    expect(
      deriveScienceVisual("sci_ecology", "Which gas do plants remove from the air during photosynthesis?"),
    ).toBeNull();
  });

  it("does not draw a states-of-matter diagram on a Chemical Reactions limewater question", () => {
    expect(deriveScienceVisual("sci_reactions", "What gas turns limewater cloudy?")).toBeNull();
  });

  it("still draws a states-of-matter diagram for genuine sci_states prompts", () => {
    expect(deriveScienceVisual("sci_states", "When water freezes it becomes:")?.kind).toBe("states_of_matter");
    expect(deriveScienceVisual("sci_states", "Which of these is a gas at room temperature?")?.kind).toBe(
      "states_of_matter",
    );
  });

  // F5 (2026-08-27): sci_body's own honest figure, the companion fix to B1.
  it("draws a respiratory figure for a lungs/gas-exchange prompt, strictly on sci_body", () => {
    const spec = deriveScienceVisual("sci_body", "Where does gas exchange happen in the lungs?");
    expect(spec?.kind).toBe("human_body");
    if (spec?.kind !== "human_body") throw new Error("expected human_body");
    expect(spec.system).toBe("respiratory");
    expect(spec.alt).toMatch(/lungs/i);
  });

  it("draws a circulatory figure for a heart/blood-vessel prompt on sci_body", () => {
    const spec = deriveScienceVisual(
      "sci_body",
      "Which blood vessel carries blood away from the heart?",
    );
    expect(spec?.kind).toBe("human_body");
    if (spec?.kind !== "human_body") throw new Error("expected human_body");
    expect(spec.system).toBe("circulatory");
  });

  it("never fires the human_body branch outside sci_body, even with the same keywords", () => {
    // Same collision class as B1: "gas"/"blood"-adjacent wording on an
    // unrelated topic must never draw a body diagram.
    expect(deriveScienceVisual("sci_reactions", "What gas is produced when an acid reacts with a metal?")).toBeNull();
    expect(deriveScienceVisual("sci_ecology", "Which gas do plants remove from the air during photosynthesis?")).toBeNull();
  });

  // F7 (2026-08-30): a curated negative-case pass over every branch, closing
  // the recurring EPIC 1 risk class systematically rather than one instance
  // at a time. Found and fixed a genuine SEVENTH instance while authoring
  // these (see "does NOT derive material_property..." below).
  describe("does NOT derive a visual for a surface-similar prompt on the wrong topic", () => {
    it("does not draw material_property for a genuine electromagnetism question (7th EPIC 1 instance, fixed here)", () => {
      // "magnetic" is a material_property needle, but a wire's current
      // creating a magnetic field is physics (electromagnetism), not "does a
      // magnet stick to this material?". Before this fix, the property-test
      // branch had no topic gate and fired here anyway.
      expect(
        deriveScienceVisual(
          "sci_electricity",
          "A wire carrying a current creates a magnetic field around it. This effect is called:",
        ),
      ).toBeNull();
      expect(
        deriveScienceVisual("sci_forces", "Which force keeps a magnet attracted to a magnetic field?"),
      ).toBeNull();
    });

    it("still draws material_property for the genuine KS2 materials topic (regression guard)", () => {
      expect(
        deriveScienceVisual("sci_ks2_materials", "Which material is magnetic?")?.kind,
      ).toBe("material_property");
    });

    it("does not draw life_cycle for an unrelated 'cell cycle' question (surface-similar phrase, different concept)", () => {
      expect(
        deriveScienceVisual("sci_genetics", "Which stage of the cell cycle involves DNA replication?"),
      ).toBeNull();
    });

    it("does not draw plant_parts for a non-living-topic prompt that merely mentions a plant", () => {
      // topicTag.includes("living") is the real gate; a non-living topic
      // mentioning "plant" (e.g. a power plant, in a different subject) must
      // never draw the labelled-plant diagram.
      expect(deriveScienceVisual("sci_energy", "A power plant converts fuel into electricity.")).toBeNull();
    });
  });
});
