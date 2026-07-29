/**
 * Deterministic science question-figure visuals (F2 — extends the maths
 * `deriveMathVisual` chain into science, closing B1).
 *
 * Science practice questions used to fall straight to the generic AI PNG (a
 * decorative image with no honest, per-concept description). For the common KS2
 * / KS3 science shapes we can derive a clearer, free, always-present diagram
 * from the topic + prompt — a plant-parts sketch, a life-cycle ring, a simple
 * food-chain arrow strip, a states-of-matter particle grid, or a labelled cell —
 * each with a real, honest descriptive `alt`. When the prompt isn't a shape we
 * are confident about, this returns `null` and the caller falls back to the
 * existing (decorative) AI image — never a wrong or misleading diagram.
 *
 * Human-derived + deterministic: no AI, no Checker path, no DB, no network, no
 * "server-only". The figures are *illustrative context* (they never pre-answer
 * the question — e.g. the cell diagram omits the cell wall so it can't give away
 * the "which part do plant cells have?" answer). Pure, so it is unit-tested like
 * the maths derivers.
 */

export type ScienceVisualSpec =
  | {
      kind: "plant_parts";
      alt: string;
    }
  | {
      kind: "life_cycle";
      /** Ordered stage labels drawn around the ring. */
      stages: string[];
      alt: string;
    }
  | {
      kind: "food_chain";
      /** Ordered links, joined by arrows. */
      links: string[];
      alt: string;
    }
  | {
      kind: "states_of_matter";
      alt: string;
    }
  | {
      kind: "cell";
      alt: string;
    };

function has(text: string, ...needles: string[]): boolean {
  return needles.some((n) => text.includes(n));
}

/**
 * Derive a deterministic science figure from a topic + prompt, or `null` when
 * the prompt isn't a shape we can confidently draw. Ordered most-specific first:
 * food chain (eating relationships) → life cycle (growth stages) → cell parts →
 * states of matter (solid/liquid/gas) → plant parts. Only science topics
 * (`sci_*`) are considered.
 */
export function deriveScienceVisual(
  topicTag: string,
  prompt: string,
): ScienceVisualSpec | null {
  if (!/^sci/i.test(topicTag)) return null;
  const text = prompt.toLowerCase();

  // ── food chain: who eats whom (herbivore/carnivore/food chain) ──
  if (
    has(
      text,
      "food chain",
      "herbivore",
      "carnivore",
      "omnivore",
      "predator",
      "prey",
      "eat only plants",
      "eats only plants",
      "eat plants",
    )
  ) {
    const links = ["Grass", "Rabbit", "Fox"];
    return {
      kind: "food_chain",
      links,
      alt: "A food chain: grass, an arrow to a rabbit, an arrow to a fox — showing energy passing from a plant to a plant-eater to a meat-eater.",
    };
  }

  // ── life cycle: growth stages (frog / tadpole) ──
  if (has(text, "tadpole", "life cycle", "life-cycle", "baby frog", "froglet")) {
    const stages = ["Egg", "Tadpole", "Froglet", "Frog"];
    return {
      kind: "life_cycle",
      stages,
      alt: "A frog life-cycle ring: egg, then tadpole, then froglet, then adult frog, then back to egg.",
    };
  }

  // ── cell parts (KS3 cells topic) ──
  if (
    topicTag.includes("cell") &&
    has(
      text,
      "cell",
      "cells",
      "nucleus",
      "cytoplasm",
      "membrane",
      "chloroplast",
      "tissue",
      "building block",
    )
  ) {
    return {
      kind: "cell",
      alt: "A cell diagram: an outer membrane, jelly-like cytoplasm inside, and a nucleus in the centre.",
    };
  }

  // ── states of matter: particle arrangements ──
  if (
    has(
      text,
      "solid",
      "liquid",
      " gas",
      "gas ",
      "ice",
      "freeze",
      "frozen",
      "melt",
      "steam",
      "state of matter",
      "states of matter",
      "evaporat",
      "condens",
    )
  ) {
    return {
      kind: "states_of_matter",
      alt: "Particle diagrams for the three states of matter: a solid with particles packed in a fixed grid, a liquid with particles close but able to move, and a gas with particles spread far apart.",
    };
  }

  // ── plant parts: a labelled plant (roots / stem / leaves / flower) ──
  if (topicTag.includes("living") && has(text, "plant")) {
    return {
      kind: "plant_parts",
      alt: "A plant diagram with labelled parts: roots below the soil, a stem, leaves and a flower at the top.",
    };
  }

  return null;
}
