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

  it("returns null for a science prompt with no confident shape", () => {
    expect(deriveScienceVisual("sci_ks2_materials", "Which material is waterproof?")).toBeNull();
    expect(deriveScienceVisual("sci_ks2_living", "Which animal is a mammal?")).toBeNull();
  });

  it("never pre-answers: the cell diagram alt omits the cell wall", () => {
    const spec = deriveScienceVisual("sci_ks3_cells", "Which structure do plant cells have that animal cells do not?");
    expect(spec?.kind).toBe("cell");
    expect(spec?.alt).not.toMatch(/wall/i);
  });
});
