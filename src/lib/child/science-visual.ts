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
    }
  | {
      kind: "human_body";
      /** Which body system the figure illustrates. */
      system: "respiratory" | "circulatory";
      alt: string;
    }
  | {
      kind: "material_property";
      /** The property being tested, e.g. "waterproof". */
      property: string;
      /** The simple test a child can picture, e.g. "Does water soak through?". */
      test: string;
      /** What passing the test means (has the property). */
      passLabel: string;
      /** What failing the test means (doesn't have the property). */
      failLabel: string;
      alt: string;
    };

/**
 * Material-property tests we can illustrate. Each entry is the *concept of the
 * test* — never the candidate materials from the question — so the figure
 * teaches "what does waterproof mean / how would you check it?" without ever
 * pre-answering which option is correct.
 */
const MATERIAL_PROPERTIES: {
  property: string;
  needles: string[];
  test: string;
  passLabel: string;
  failLabel: string;
}[] = [
  {
    property: "waterproof",
    needles: ["waterproof", "keeps water out", "keep water out"],
    test: "Does water soak through it?",
    passLabel: "Keeps water out",
    failLabel: "Water soaks through",
  },
  {
    property: "transparent",
    needles: [
      "transparent",
      "lets light through",
      "let light through",
      "light pass",
      "see through",
      "see-through",
    ],
    test: "Can light pass through it?",
    passLabel: "You can see through it",
    failLabel: "Light is blocked",
  },
  {
    property: "magnetic",
    needles: ["magnetic", "magnet"],
    test: "Does a magnet pull it?",
    passLabel: "Sticks to a magnet",
    failLabel: "A magnet ignores it",
  },
  {
    property: "flexible",
    needles: ["flexible", "bendy", "bends without", "bend without", "can bend"],
    test: "Does it bend without breaking?",
    passLabel: "Bends easily",
    failLabel: "Stays stiff",
  },
  {
    property: "absorbent",
    needles: ["absorbent", "soaks up", "soak up", "soaks water", "absorb water"],
    test: "Does it soak up water?",
    passLabel: "Soaks water up",
    failLabel: "Water runs off",
  },
];

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

  // ── human body: respiratory / circulatory systems (F5 — the companion fix
  //    to B1: sci_body previously had no dedicated branch at all, so it fell
  //    through to the WRONG states-of-matter figure whenever a prompt
  //    mentioned "gas". Strictly gated to sci_body (never a keyword-only
  //    match), so it can never collide with sci_reactions/sci_ecology, the
  //    exact class of bug B1 fixed. ──
  if (topicTag === "sci_body") {
    if (has(text, "lungs", "alveoli", "breath")) {
      return {
        kind: "human_body",
        system: "respiratory",
        alt: "A simple lungs diagram: the airway branches into two lungs, each ending in tiny alveoli air sacs where gas exchange happens.",
      };
    }
    if (has(text, "heart", "blood", "artery", "vein", "capillary")) {
      return {
        kind: "human_body",
        system: "circulatory",
        alt: "A simple circulatory diagram: the heart pumps blood out through arteries and receives it back through veins.",
      };
    }
  }

  // ── states of matter: particle arrangements. Gated on the actual
  //    states-of-matter topics (sci_states / sci_ks2_materials), mirroring the
  //    `cell` branch's topicTag gate above — otherwise the bare word "gas"
  //    (or "solid"/"melt"/etc used in a non-phase-of-matter sense) collides
  //    with unrelated topics like sci_body ("gas exchange in the lungs"),
  //    sci_reactions ("what gas is produced") and sci_ecology ("which gas do
  //    plants remove"). ──
  if (
    (topicTag === "sci_states" || topicTag === "sci_ks2_materials") &&
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

  // ── material property test: what does "waterproof/transparent/magnetic/…"
  //    mean, and how would you check it? Runs at the tail so states-of-matter
  //    (freeze/melt/ice) wins first; only fires on a named property keyword and
  //    never names the candidate materials, so it can't give the answer away. ──
  for (const p of MATERIAL_PROPERTIES) {
    if (has(text, ...p.needles)) {
      return {
        kind: "material_property",
        property: p.property,
        test: p.test,
        passLabel: p.passLabel,
        failLabel: p.failLabel,
        alt: `A property test for "${p.property}": ${p.test} If yes, the material ${p.passLabel.toLowerCase()}; if no, ${p.failLabel.toLowerCase()}.`,
      };
    }
  }

  return null;
}
