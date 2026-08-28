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
  // Solid/Liquid/Gas particle diagram on unrelated real questions.
  it("does not draw a states-of-matter diagram on a Human Body Systems 'gas exchange' question", () => {
    expect(
      deriveScienceVisual("sci_body", "Where does gas exchange happen in the lungs?"),
    ).toBeNull();
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
});
