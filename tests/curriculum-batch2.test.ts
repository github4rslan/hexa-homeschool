import { describe, expect, it } from "vitest";
import { SEED_TOPICS, SEED_QUESTIONS } from "@/lib/data/curriculum.seed";
import { SEED_QUESTIONS_EXTRA } from "@/lib/data/curriculum.seed.extra";
import {
  gcseTopicCount,
  mockUnlockCount,
  MOCK_UNLOCK_FLOOR,
} from "@/lib/engine/mock-gate";

const ALL = [...SEED_QUESTIONS, ...SEED_QUESTIONS_EXTRA];

describe("B3 — sci_body water-absorption item is retired and reworded", () => {
  it("no longer carries the ambiguous 'most water absorbed' prompt", () => {
    const stale = SEED_QUESTIONS_EXTRA.find(
      (q) =>
        q.topic_tag === "sci_body" &&
        q.prompt === "Where is most water absorbed in digestion?",
    );
    expect(stale).toBeUndefined();
  });

  it("has the reworded large-intestine item, well-formed with the intended answer", () => {
    const q = SEED_QUESTIONS_EXTRA.find(
      (item) =>
        item.topic_tag === "sci_body" &&
        item.prompt ===
          "Which organ's main job is to reabsorb water from the material left after digestion?",
    );
    expect(q, "reworded item present").toBeDefined();
    if (!q) return;
    // Exactly one correct index, in range.
    expect(q.correct_index).toBeGreaterThanOrEqual(0);
    expect(q.correct_index).toBeLessThan(q.options.length);
    expect(q.options.length).toBe(4);
    // The intended (owner-approved) answer is the large intestine.
    expect(q.options[q.correct_index]).toBe("large intestine");
    // No competing "small intestine" option, so the answer is unambiguous.
    expect(q.options).not.toContain("small intestine");
    expect(q.explanation.trim().length).toBeGreaterThan(0);
  });
});

describe("F7 — exam-style command-word question pack", () => {
  const prompts = [
    "In a sale, a coat is reduced by 20% to £60. Work out the original price before the sale.",
    "A recipe for 4 people needs 240 g of rice. Work out how much rice is needed for 10 people.",
    "Work out (3 × 10⁴) × (2 × 10³). Give your answer in standard form.",
    "A car travels 150 m in 10 s at a steady speed. Calculate its speed.",
    "Hydrochloric acid reacts with sodium hydroxide solution. Name the TWO products of this neutralisation.",
    "'The waves clawed hungrily at the shore.' Which technique does the writer use, and what is its main effect?",
  ];

  it("adds exactly one of each authored exam-style item", () => {
    for (const p of prompts) {
      const found = ALL.filter((q) => q.prompt === p);
      expect(found.length, `exactly one item for: ${p}`).toBe(1);
    }
  });

  it("keeps every new item well-formed (one correct index, aligned misconceptions/hints)", () => {
    for (const p of prompts) {
      const q = ALL.find((item) => item.prompt === p);
      expect(q).toBeDefined();
      if (!q) continue;
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      if (q.misconceptions) {
        // Index-aligned with options; the correct slot is intentionally blank.
        expect(q.misconceptions.length).toBeLessThanOrEqual(q.options.length);
        expect((q.misconceptions[q.correct_index] ?? "").trim()).toBe("");
      }
      if (q.hints) {
        expect(q.hints.length).toBeGreaterThan(0);
        for (const h of q.hints) expect(h.trim().length).toBeGreaterThan(0);
      }
      const topic = SEED_TOPICS.find((t) => t.topic_tag === q.topic_tag);
      expect(topic, `topic exists for ${q.topic_tag}`).toBeDefined();
    }
  });

  it("computes to the keyed answer for each quantitative item", () => {
    const answerOf = (p: string) => {
      const q = ALL.find((item) => item.prompt === p)!;
      return q.options[q.correct_index];
    };
    // Reverse percentage: £60 is 80% of the original, so original = 60 / 0.8 = £75.
    expect(60 / 0.8).toBe(75);
    expect(answerOf(prompts[0])).toBe("£75");
    // Recipe proportion: 240 / 4 * 10 = 600 g.
    expect((240 / 4) * 10).toBe(600);
    expect(answerOf(prompts[1])).toBe("600 g");
    // Standard form: 3*2 = 6, indices 4+3 = 7 → 6 × 10⁷.
    expect(3 * 2).toBe(6);
    expect(4 + 3).toBe(7);
    expect(answerOf(prompts[2])).toBe("6 × 10⁷");
    // Speed: 150 / 10 = 15 m/s.
    expect(150 / 10).toBe(15);
    expect(answerOf(prompts[3])).toBe("15 m/s");
  });
});

describe("F1 (2026-08-09) — 5 command-word items for previously-uncovered topics", () => {
  const items = [
    { tag: "maths_algebra_linear", prompt: "Solve 4x + 5 = 29.", answer: "x = 6" },
    {
      tag: "maths_pythagoras",
      prompt:
        "A right-angled triangle has its two shorter sides 6 cm and 8 cm. Calculate the length of the hypotenuse.",
      answer: "10 cm",
    },
    {
      tag: "maths_statistics",
      prompt:
        "A bag has 3 red, 5 blue and 2 green counters. One counter is taken at random. Work out the probability that it is blue.",
      answer: "1/2",
    },
    {
      tag: "sci_electricity",
      prompt:
        "A current of 2 A flows through a resistor of 5 Ω. Calculate the potential difference across the resistor.",
      answer: "10 V",
    },
    {
      tag: "eng_analysis",
      prompt:
        "'The old house sagged, its windows like tired eyes.' Explain the main effect of the simile 'like tired eyes'.",
      answer: "It makes the house feel weary and neglected",
    },
  ];

  it("adds exactly one well-formed item per topic, keyed to the intended answer", () => {
    for (const { tag, prompt, answer } of items) {
      const found = ALL.filter((q) => q.prompt === prompt);
      expect(found.length, `exactly one item for: ${prompt}`).toBe(1);
      const q = found[0];
      expect(q.topic_tag).toBe(tag);
      expect(q.key_stage).toBe(4);
      expect(q.options.length).toBe(4);
      // Exactly one correct index, in range, matching the keyed answer.
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(q.options[q.correct_index]).toBe(answer);
      // Distractors are all distinct (no equal-value trap).
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      // Misconceptions index-aligned; the correct slot is blank.
      expect(q.misconceptions).toBeDefined();
      expect(q.misconceptions!.length).toBeLessThanOrEqual(q.options.length);
      expect((q.misconceptions![q.correct_index] ?? "").trim()).toBe("");
      expect(q.hints && q.hints.length).toBeGreaterThan(0);
      const topic = SEED_TOPICS.find((t) => t.topic_tag === tag);
      expect(topic, `topic exists for ${tag}`).toBeDefined();
    }
  });

  it("computes to the keyed answer for each quantitative item", () => {
    // Solve 4x + 5 = 29 → 4x = 24 → x = 6.
    expect((29 - 5) / 4).toBe(6);
    // Pythagoras: hypotenuse = sqrt(6² + 8²) = sqrt(100) = 10.
    expect(Math.sqrt(6 ** 2 + 8 ** 2)).toBe(10);
    // Probability blue = 5 / (3 + 5 + 2) = 5/10 = 1/2.
    expect(5 / (3 + 5 + 2)).toBe(0.5);
    // Ohm's law: V = I × R = 2 × 5 = 10.
    expect(2 * 5).toBe(10);
  });
});

describe("F8 — GCSE Maths mensuration strand", () => {
  it("adds the maths_mensuration topic in the maths GCSE band", () => {
    const topic = SEED_TOPICS.find((t) => t.topic_tag === "maths_mensuration");
    expect(topic, "mensuration topic present").toBeDefined();
    if (!topic) return;
    expect(topic.subject).toBe("mathematics");
    expect(topic.key_stage).toBe(4);
    expect(topic.title).toBe("Area, Perimeter & Volume");
    expect(topic.prerequisite_tags).toContain("maths_geometry");
  });

  it("ships the three authored starters, well-formed and computing correctly", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_mensuration");
    expect(qs.length).toBe(3);
    for (const q of qs) {
      expect(q.subject).toBe("mathematics");
      expect(q.key_stage).toBe(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
    const answerOf = (needle: string) => {
      const q = qs.find((item) => item.prompt.includes(needle))!;
      return q.options[q.correct_index];
    };
    // Rectangle area 8 * 5 = 40.
    expect(8 * 5).toBe(40);
    expect(answerOf("area of a rectangle")).toBe("40 cm²");
    // Circumference 2 * 3.14 * 5 = 31.4.
    expect(2 * 3.14 * 5).toBeCloseTo(31.4, 5);
    expect(answerOf("circumference")).toBe("31.4 cm");
    // Cube volume 3^3 = 27.
    expect(3 * 3 * 3).toBe(27);
    expect(answerOf("volume of a cube")).toBe("27 cm³");
  });

  it("stays certifiable: at least one practice and two mastery items", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_mensuration");
    expect(qs.filter((q) => q.kind === "practice").length).toBeGreaterThanOrEqual(1);
    expect(qs.filter((q) => q.kind === "mastery").length).toBeGreaterThanOrEqual(2);
  });
});

describe("F2 (2026-08-09) — GCSE Maths inequalities strand", () => {
  it("adds the maths_inequalities topic in the maths GCSE band with a worked example and glossary", () => {
    const topic = SEED_TOPICS.find((t) => t.topic_tag === "maths_inequalities");
    expect(topic, "inequalities topic present").toBeDefined();
    if (!topic) return;
    expect(topic.subject).toBe("mathematics");
    expect(topic.key_stage).toBe(4);
    expect(topic.title).toBe("Inequalities");
    expect(topic.prerequisite_tags).toContain("maths_algebra_linear");
    expect(topic.worked_example).toBeDefined();
    // Glossary terms must appear in the shown worked-example prose to render as chips.
    const prose = JSON.stringify(topic.worked_example);
    for (const g of topic.glossary ?? []) {
      expect(prose.toLowerCase()).toContain(g.term.toLowerCase());
    }
    expect((topic.glossary ?? []).map((g) => g.term)).toEqual([
      "inequality",
      "number line",
    ]);
  });

  it("ships the three authored starters, well-formed and correctly keyed", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_inequalities");
    expect(qs.length).toBe(3);
    for (const q of qs) {
      expect(q.subject).toBe("mathematics");
      expect(q.key_stage).toBe(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
    const answerOf = (needle: string) => {
      const q = qs.find((item) => item.prompt.includes(needle))!;
      return q.options[q.correct_index];
    };
    // x + 3 < 7 → x < 4.
    expect(answerOf("x + 3 < 7")).toBe("x < 4");
    // 2x ≥ 10 → x ≥ 5 (dividing by a positive does not flip the sign).
    expect(answerOf("2x ≥ 10")).toBe("x ≥ 5");
    // Integers with −2 < x ≤ 1 are −1, 0, 1.
    expect(answerOf("satisfy")).toBe("−1, 0, 1");
  });

  it("stays certifiable: at least one practice and two mastery items", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_inequalities");
    expect(qs.filter((q) => q.kind === "practice").length).toBeGreaterThanOrEqual(1);
    expect(qs.filter((q) => q.kind === "mastery").length).toBeGreaterThanOrEqual(2);
  });
});

describe("F3 (2026-08-11) — 3 command-word Maths items for uncovered topics", () => {
  const items = [
    {
      tag: "maths_sequences",
      prompt:
        "Work out an expression for the nth term of the sequence 5, 8, 11, 14, …",
      answer: "3n + 2",
    },
    {
      tag: "maths_geometry",
      prompt: "Calculate the size of each interior angle of a regular hexagon.",
      answer: "120°",
    },
    {
      tag: "maths_graphs",
      prompt:
        "A straight line passes through the points (0, 1) and (2, 7). Work out the gradient of the line.",
      answer: "3",
    },
  ];

  it("adds exactly one well-formed item per topic, keyed to the intended answer", () => {
    for (const { tag, prompt, answer } of items) {
      const found = ALL.filter((q) => q.prompt === prompt);
      expect(found.length, `exactly one item for: ${prompt}`).toBe(1);
      const q = found[0];
      expect(q.topic_tag).toBe(tag);
      expect(q.subject).toBe("mathematics");
      expect(q.key_stage).toBe(4);
      expect(q.options.length).toBe(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(q.options[q.correct_index]).toBe(answer);
      // Distractors all distinct (no equal-value trap).
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      // Misconceptions index-aligned; the correct slot is blank.
      expect(q.misconceptions).toBeDefined();
      expect(q.misconceptions!.length).toBeLessThanOrEqual(q.options.length);
      expect((q.misconceptions![q.correct_index] ?? "").trim()).toBe("");
      expect(q.hints && q.hints.length).toBeGreaterThan(0);
      const topic = SEED_TOPICS.find((t) => t.topic_tag === tag);
      expect(topic, `topic exists for ${tag}`).toBeDefined();
    }
  });

  it("computes to the keyed answer for each quantitative item", () => {
    // Sequence 5, 8, 11, 14 → common difference 3, constant 5 − 3 = 2 → 3n + 2.
    const first = 5;
    const diff = 8 - 5;
    expect(diff).toBe(3);
    expect(first - diff).toBe(2); // constant term
    // Regular hexagon interior angle = (6 − 2) × 180 / 6 = 120°.
    expect(((6 - 2) * 180) / 6).toBe(120);
    // Gradient through (0, 1) and (2, 7) = (7 − 1) / (2 − 0) = 3.
    expect((7 - 1) / (2 - 0)).toBe(3);
  });
});

describe("F4 (2026-08-11) — 3 command-word Science + English items", () => {
  const items = [
    {
      tag: "sci_forces",
      subject: "science",
      prompt: "A car speeds up from 0 to 20 m/s in 4 seconds. Calculate its acceleration.",
      answer: "5 m/s²",
    },
    {
      tag: "sci_reactions",
      subject: "science",
      prompt:
        "Calculate the relative formula mass (Mr) of water, H₂O. (Relative atomic masses: H = 1, O = 16.)",
      answer: "18",
    },
    {
      tag: "eng_analysis",
      subject: "english",
      prompt:
        "A writer describes a schoolroom with the metaphor: 'The classroom was a prison.' What does this most strongly suggest about how the narrator feels?",
      answer: "Trapped and unhappy in the room",
    },
  ];

  it("adds exactly one well-formed item per topic, keyed to the intended answer", () => {
    for (const { tag, subject, prompt, answer } of items) {
      const found = ALL.filter((q) => q.prompt === prompt);
      expect(found.length, `exactly one item for: ${prompt}`).toBe(1);
      const q = found[0];
      expect(q.topic_tag).toBe(tag);
      expect(q.subject).toBe(subject);
      expect(q.key_stage).toBe(4);
      expect(q.options.length).toBe(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(q.options[q.correct_index]).toBe(answer);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.misconceptions).toBeDefined();
      expect(q.misconceptions!.length).toBeLessThanOrEqual(q.options.length);
      expect((q.misconceptions![q.correct_index] ?? "").trim()).toBe("");
      expect(q.hints && q.hints.length).toBeGreaterThan(0);
      const topic = SEED_TOPICS.find((t) => t.topic_tag === tag);
      expect(topic, `topic exists for ${tag}`).toBeDefined();
    }
  });

  it("computes to the keyed answer for each quantitative item", () => {
    // Acceleration = (20 − 0) / 4 = 5 m/s².
    expect((20 - 0) / 4).toBe(5);
    // Relative formula mass of H₂O = (2 × 1) + 16 = 18.
    expect(2 * 1 + 16).toBe(18);
  });
});

// Shared well-formedness assertion for a single authored exam-style item.
function expectWellFormedItem(
  tag: string,
  subject: string,
  prompt: string,
  answer: string,
) {
  const found = ALL.filter((q) => q.prompt === prompt);
  expect(found.length, `exactly one item for: ${prompt}`).toBe(1);
  const q = found[0];
  expect(q.topic_tag).toBe(tag);
  expect(q.subject).toBe(subject);
  expect(q.key_stage).toBe(4);
  expect(q.options.length).toBe(4);
  expect(q.correct_index).toBeGreaterThanOrEqual(0);
  expect(q.correct_index).toBeLessThan(q.options.length);
  expect(q.options[q.correct_index]).toBe(answer);
  // Distractors all distinct (no equal-value trap).
  expect(new Set(q.options).size).toBe(q.options.length);
  expect(q.explanation.trim().length).toBeGreaterThan(0);
  // Misconceptions index-aligned; the correct slot is blank.
  expect(q.misconceptions).toBeDefined();
  expect(q.misconceptions!.length).toBeLessThanOrEqual(q.options.length);
  expect((q.misconceptions![q.correct_index] ?? "").trim()).toBe("");
  expect(q.hints && q.hints.length).toBeGreaterThan(0);
  const topic = SEED_TOPICS.find((t) => t.topic_tag === tag);
  expect(topic, `topic exists for ${tag}`).toBeDefined();
}

describe("F1 (2026-08-14) — sci_cells magnification calculation item", () => {
  const prompt =
    "A cell has a real width of 0.05 mm. Under a microscope its image measures 10 mm across. Calculate the magnification.";

  it("adds exactly one well-formed item keyed to ×200", () => {
    expectWellFormedItem("sci_cells", "science", prompt, "×200");
  });

  it("computes: magnification = image / real = 10 mm / 0.05 mm = 200", () => {
    expect(10 / 0.05).toBe(200);
  });
});

describe("F2 (2026-08-14) — sci_body 'Explain arteries' command-word item", () => {
  const prompt = "Explain why arteries have thick, muscular and elastic walls.";

  it("adds exactly one well-formed item keyed to the high-pressure answer", () => {
    expectWellFormedItem(
      "sci_body",
      "science",
      prompt,
      "To withstand the high pressure of blood pumped from the heart",
    );
  });
});

describe("F3 (2026-08-14) — maths_quadratics mixed-sign 'Solve' item", () => {
  const prompt = "Solve x² + 2x − 15 = 0.";

  it("adds exactly one well-formed item keyed to x = −5 or x = 3", () => {
    expectWellFormedItem("maths_quadratics", "mathematics", prompt, "x = −5 or x = 3");
  });

  it("computes: (x + 5)(x − 3) factorisation gives roots that satisfy the equation", () => {
    // Factor pair multiplies to −15 and adds to +2.
    expect(5 * -3).toBe(-15);
    expect(5 + -3).toBe(2);
    // Each keyed root satisfies x² + 2x − 15 = 0.
    const f = (x: number) => x ** 2 + 2 * x - 15;
    expect(f(-5)).toBe(0);
    expect(f(3)).toBe(0);
  });
});

describe("F1 (2026-08-18) — sci_atoms neutrons calculation item", () => {
  const prompt =
    "A fluorine atom has an atomic number of 9 and a mass number of 19. Calculate the number of neutrons in this atom.";

  it("adds exactly one well-formed item keyed to 10", () => {
    expectWellFormedItem("sci_atoms", "science", prompt, "10");
  });

  it("computes: neutrons = mass number − atomic number = 19 − 9 = 10", () => {
    expect(19 - 9).toBe(10);
  });
});

describe("F2 (2026-08-18) — sci_energy kinetic energy calculation item", () => {
  const prompt =
    "A ball of mass 2 kg moves at a speed of 3 m/s. Using kinetic energy = a half times mass times speed squared, calculate its kinetic energy.";

  it("adds exactly one well-formed item keyed to 9 J", () => {
    expectWellFormedItem("sci_energy", "science", prompt, "9 J");
  });

  it("computes: Ek = 0.5 * mass * speed^2 = 0.5 * 2 * 3^2 = 9 J", () => {
    expect(0.5 * 2 * 3 ** 2).toBe(9);
  });
});

describe("F3 (2026-08-18) — eng_comprehension retrieval item", () => {
  const prompt =
    "Read this sentence from a story: 'The old lighthouse stood alone on the rocky cliff, its white paint peeling in the salty wind.' Which detail about the lighthouse is actually stated in the text?";

  it("adds exactly one well-formed item keyed to the stated detail", () => {
    expectWellFormedItem(
      "eng_comprehension",
      "english",
      prompt,
      "Its white paint was peeling",
    );
  });
});

describe("F4 (2026-08-18) — eng_persuasive 'identify the technique' item", () => {
  const prompt =
    "'Imagine a town where every child walks safely to school.' Which persuasive technique does the writer use to draw the reader in?";

  it("adds exactly one well-formed item keyed to the direct appeal to imagination", () => {
    expectWellFormedItem(
      "eng_persuasive",
      "english",
      prompt,
      "A direct appeal to the reader's imagination",
    );
  });
});

describe("F9 (2026-08-18, second pass) — sci_states density calculation item", () => {
  const prompt =
    "A block of metal has a mass of 54 g and a volume of 20 cm3. Calculate its density using density = mass divided by volume.";

  it("adds exactly one well-formed item keyed to 2.7 g/cm3", () => {
    expectWellFormedItem("sci_states", "science", prompt, "2.7 g/cm3");
  });

  it("computes: density = mass / volume = 54 / 20 = 2.7", () => {
    expect(54 / 20).toBe(2.7);
  });
});

describe("F10 (2026-08-18, second pass) — eng_grammar subject-verb agreement item", () => {
  const prompt = "Identify the sentence that uses correct subject-verb agreement.";

  it("adds exactly one well-formed item keyed to the singular 'has' agreement", () => {
    expectWellFormedItem(
      "eng_grammar",
      "english",
      prompt,
      "Neither of the students has finished their essay.",
    );
  });
});

describe("F1 (2026-08-19) — sci_genetics Punnett-square probability item", () => {
  const prompt =
    "In pea plants, tall (T) is dominant over short (t). Two heterozygous tall plants (Tt) are crossed. Calculate the probability that an offspring will be short.";

  it("adds exactly one well-formed item keyed to 1/4", () => {
    expectWellFormedItem("sci_genetics", "science", prompt, "1/4");
  });

  it("computes: Tt x Tt gives TT, Tt, Tt, tt — 1 of 4 combinations is short (tt)", () => {
    const combinations = ["TT", "Tt", "Tt", "tt"];
    const shortCount = combinations.filter((g) => g === "tt").length;
    expect(shortCount / combinations.length).toBe(0.25);
  });
});

describe("F2 (2026-08-19) — sci_ecology percentage energy transfer item", () => {
  const prompt =
    "In a food chain, producers store 2000 kJ of energy. The primary consumers that eat them store 200 kJ. Calculate the percentage of energy transferred from producers to primary consumers.";

  it("adds exactly one well-formed item keyed to 10%", () => {
    expectWellFormedItem("sci_ecology", "science", prompt, "10%");
  });

  it("computes: (200 / 2000) * 100 = 10%", () => {
    expect((200 / 2000) * 100).toBe(10);
  });
});

describe("F3 (2026-08-19) — eng_punctuation apostrophe (it's vs its) item", () => {
  const prompt = "Identify the sentence that uses the apostrophe correctly.";

  it("adds exactly one well-formed item keyed to the it's contraction", () => {
    expectWellFormedItem(
      "eng_punctuation",
      "english",
      prompt,
      "It's a lovely day today.",
    );
  });
});

describe("F4 (2026-08-19) — eng_spelling homophone (their/there/they're) item", () => {
  const prompt = "Identify the sentence that uses the correct word.";

  it("adds exactly one well-formed item keyed to the they're contraction", () => {
    expectWellFormedItem(
      "eng_spelling",
      "english",
      prompt,
      "They're going to the shop later.",
    );
  });
});

describe("F2 (2026-08-20) — eng_poetry caesura item", () => {
  const prompt =
    "A line of poetry is broken by a comma or full stop halfway through, for example: 'She waited. The room stayed silent.' This kind of mid-line pause is called a caesura. Explain its main effect here.";

  it("adds exactly one well-formed item keyed to the pause-draws-attention answer", () => {
    expectWellFormedItem(
      "eng_poetry",
      "english",
      prompt,
      "It creates a sudden pause that draws attention to what follows",
    );
  });
});

describe("F3 (2026-08-20) — eng_shakespeare soliloquy item", () => {
  const prompt =
    "In a play, a character sometimes speaks alone on stage, sharing their private thoughts directly with the audience. This is called a soliloquy. Explain why a playwright like Shakespeare uses one instead of dialogue.";

  it("adds exactly one well-formed item keyed to the private-thoughts answer", () => {
    expectWellFormedItem(
      "eng_shakespeare",
      "english",
      prompt,
      "To let a character share private thoughts directly with the audience",
    );
  });
});

describe("F4 (2026-08-20) — eng_creative narrative viewpoint item", () => {
  const prompt =
    "A story opens: 'I walked into the empty house and felt my chest tighten.' Identify the narrative viewpoint being used.";

  it("adds exactly one well-formed item keyed to first person", () => {
    expectWellFormedItem("eng_creative", "english", prompt, "First person");
  });
});

describe("F1 (2026-08-22) — second maths_ratio command-word item (direct proportion)", () => {
  const prompt =
    "A recipe uses flour and sugar in the ratio 5:2. A baker uses 350 g of flour. Calculate how much sugar is needed.";

  it("adds exactly one well-formed item keyed to 140 g", () => {
    expectWellFormedItem("maths_ratio", "mathematics", prompt, "140 g");
  });

  it("computes: 1 part = 350 / 5 = 70 g; sugar = 2 parts = 70 * 2 = 140 g", () => {
    expect(350 / 5).toBe(70);
    expect((350 / 5) * 2).toBe(140);
  });
});

describe("F2 (2026-08-22) — second sci_body command-word item (heart-rate calculation)", () => {
  const prompt =
    "A person's resting heart rate is 72 beats per minute. Calculate how many times their heart beats in 10 minutes.";

  it("adds exactly one well-formed item keyed to 720", () => {
    expectWellFormedItem("sci_body", "science", prompt, "720");
  });

  it("computes: beats = 72 * 10 = 720", () => {
    expect(72 * 10).toBe(720);
  });
});

describe("F1 (2026-08-23) — second maths_quadratics command-word item (factorising)", () => {
  const prompt = "Solve x² − 5x + 6 = 0 by factorising.";

  it("adds exactly one well-formed item keyed to x = 2 or x = 3", () => {
    expectWellFormedItem("maths_quadratics", "mathematics", prompt, "x = 2 or x = 3");
  });

  it("computes: (x − 2)(x − 3) factorisation gives roots that satisfy the equation", () => {
    // Factor pair multiplies to +6 and adds to −5.
    expect(-2 * -3).toBe(6);
    expect(-2 + -3).toBe(-5);
    // Each keyed root satisfies x² − 5x + 6 = 0.
    const f = (x: number) => x ** 2 - 5 * x + 6;
    expect(f(2)).toBe(0);
    expect(f(3)).toBe(0);
    // Every distractor's roots do NOT satisfy the equation (none is secretly correct).
    expect(f(-2)).not.toBe(0);
    expect(f(-3)).not.toBe(0);
    expect(f(5)).not.toBe(0);
    expect(f(6)).not.toBe(0);
  });
});

describe("F1 (2026-08-26) — 3 maths_geometry mastery items (angle facts)", () => {
  const items = [
    {
      prompt: "Calculate the exterior angle of a regular pentagon.",
      answer: "72°",
    },
    {
      prompt:
        "Two angles lie on a straight line. One is 118°. Calculate the other angle.",
      answer: "62°",
    },
    {
      prompt:
        "In a parallelogram, one angle is 65°. Calculate the angle next to it (the adjacent angle).",
      answer: "115°",
    },
  ];

  it("adds exactly one well-formed item per question, keyed to the intended answer", () => {
    for (const { prompt, answer } of items) {
      expectWellFormedItem("maths_geometry", "mathematics", prompt, answer);
    }
  });

  it("computes to the keyed answer for each item", () => {
    // Exterior angles of any polygon sum to 360°; pentagon has 5 sides.
    expect(360 / 5).toBe(72);
    // Angles on a straight line sum to 180°.
    expect(180 - 118).toBe(62);
    // Adjacent (co-interior) parallelogram angles sum to 180°.
    expect(180 - 65).toBe(115);
  });

  it("does not collide with the existing hexagon mastery item (real variety, not a duplicate)", () => {
    const geometryPrompts = ALL.filter(
      (q) => q.topic_tag === "maths_geometry" && q.kind === "mastery",
    ).map((q) => q.prompt);
    expect(geometryPrompts).toContain(
      "Calculate the size of each interior angle of a regular hexagon.",
    );
    expect(new Set(geometryPrompts).size).toBe(geometryPrompts.length);
  });
});

describe("F2 (2026-08-26) — second maths_fractions command-word item (VAT)", () => {
  const prompt =
    "A jacket costs £84 before VAT at 20% is added. Calculate the price including VAT.";

  it("adds exactly one well-formed item keyed to £100.80", () => {
    expectWellFormedItem("maths_fractions", "mathematics", prompt, "£100.80");
  });

  it("computes: 20% of £84 is £16.80; £84 + £16.80 = £100.80", () => {
    expect(84 * 0.2).toBeCloseTo(16.8, 5);
    expect(84 + 84 * 0.2).toBeCloseTo(100.8, 5);
  });

  it("is a distinct forward-percentage item, not a duplicate of the existing reverse-percentage question", () => {
    const fractionsPrompts = ALL.filter(
      (q) => q.topic_tag === "maths_fractions" && q.kind === "mastery",
    ).map((q) => q.prompt);
    expect(fractionsPrompts).toContain(
      "In a sale, a coat is reduced by 20% to £60. Work out the original price before the sale.",
    );
    expect(new Set(fractionsPrompts).size).toBe(fractionsPrompts.length);
  });
});

describe("F3 (2026-08-26) — second maths_number command-word item (small-decimal standard form)", () => {
  const prompt = "Write 0.00034 in standard form.";

  it("adds exactly one well-formed item keyed to 3.4 × 10⁻⁴", () => {
    expectWellFormedItem("maths_number", "mathematics", prompt, "3.4 × 10⁻⁴");
  });

  it("computes: 0.00034 = 3.4 × 10⁻⁴ (decimal point moves 4 places)", () => {
    expect(0.00034).toBeCloseTo(3.4 * 10 ** -4, 10);
  });

  it("is a distinct negative-power item, not a duplicate of the existing multiplication question", () => {
    const numberPrompts = ALL.filter(
      (q) => q.topic_tag === "maths_number" && q.kind === "mastery",
    ).map((q) => q.prompt);
    expect(numberPrompts).toContain(
      "Work out (3 × 10⁴) × (2 × 10³). Give your answer in standard form.",
    );
    expect(new Set(numberPrompts).size).toBe(numberPrompts.length);
  });
});

describe("F3 (2026-08-27) — second maths_pythagoras command-word item (trig angle)", () => {
  const prompt =
    "A right-angled triangle has an opposite side of 6 cm and an adjacent side of 8 cm. Calculate the size of angle θ, to 1 decimal place.";

  it("adds exactly one well-formed item keyed to 36.9°", () => {
    expectWellFormedItem("maths_pythagoras", "mathematics", prompt, "36.9°");
  });

  it("computes: tan θ = 6/8 = 0.75, so θ = arctan(0.75) ≈ 36.9°", () => {
    const thetaDeg = (Math.atan(6 / 8) * 180) / Math.PI;
    expect(thetaDeg).toBeCloseTo(36.9, 1);
    // The swapped-ratio distractor (arctan(8/6)) is the complementary angle,
    // so both correctly sum to 90° — a sanity check the pair is consistent.
    const swappedDeg = (Math.atan(8 / 6) * 180) / Math.PI;
    expect(swappedDeg).toBeCloseTo(53.1, 1);
    expect(thetaDeg + swappedDeg).toBeCloseTo(90, 5);
  });

  it("is a distinct trig item, not a duplicate of the existing Pythagoras hypotenuse question", () => {
    const pythagorasPrompts = ALL.filter(
      (q) => q.topic_tag === "maths_pythagoras" && q.kind === "mastery",
    ).map((q) => q.prompt);
    expect(pythagorasPrompts).toContain(
      "A right-angled triangle has its two shorter sides 6 cm and 8 cm. Calculate the length of the hypotenuse.",
    );
    expect(new Set(pythagorasPrompts).size).toBe(pythagorasPrompts.length);
  });
});

describe("F4 (2026-08-27) — second sci_electricity command-word item (P = VI)", () => {
  const prompt =
    "A 12 V battery drives a current of 3 A through a lamp. Calculate the power delivered to the lamp.";

  it("adds exactly one well-formed item keyed to 36 W", () => {
    expectWellFormedItem("sci_electricity", "science", prompt, "36 W");
  });

  it("computes: P = V × I = 12 × 3 = 36", () => {
    expect(12 * 3).toBe(36);
  });

  it("is a distinct P = VI item, not a duplicate of the existing V = IR question", () => {
    const electricityPrompts = ALL.filter(
      (q) => q.topic_tag === "sci_electricity" && q.kind === "mastery",
    ).map((q) => q.prompt);
    expect(electricityPrompts).toContain(
      "A current of 2 A flows through a resistor of 5 Ω. Calculate the potential difference across the resistor.",
    );
    expect(new Set(electricityPrompts).size).toBe(electricityPrompts.length);
  });
});

describe("F1 (2026-08-27) — GCSE Maths transformations strand", () => {
  it("adds the maths_transformations topic in the maths GCSE band with a worked example", () => {
    const topic = SEED_TOPICS.find((t) => t.topic_tag === "maths_transformations");
    expect(topic, "transformations topic present").toBeDefined();
    if (!topic) return;
    expect(topic.subject).toBe("mathematics");
    expect(topic.key_stage).toBe(4);
    expect(topic.title).toBe("Transformations");
    expect(topic.prerequisite_tags).toContain("maths_geometry");
    expect(topic.worked_example).toBeDefined();
  });

  it("ships the three authored starters, well-formed and correctly keyed", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_transformations");
    expect(qs.length).toBe(3);
    for (const q of qs) {
      expect(q.subject).toBe("mathematics");
      expect(q.key_stage).toBe(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
    const answerOf = (needle: string) => {
      const q = qs.find((item) => item.prompt.includes(needle))!;
      return q.options[q.correct_index];
    };
    // Enlarge 4 cm by scale factor 3 → 12 cm.
    expect(4 * 3).toBe(12);
    expect(answerOf("enlarged by scale factor 3")).toBe("12 cm");
    // Translate (1, 4) by vector (3, −2) → (4, 2).
    expect([1 + 3, 4 + -2]).toEqual([4, 2]);
    expect(answerOf("translated by the vector")).toBe("(4, 2)");
    // A reflection is the only one of the four transformations that flips
    // orientation to produce a mirror image.
    expect(answerOf("mirror image")).toBe("Reflection");
  });

  it("stays certifiable: at least one practice and one mastery item", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_transformations");
    expect(qs.filter((q) => q.kind === "practice").length).toBeGreaterThanOrEqual(1);
    expect(qs.filter((q) => q.kind === "mastery").length).toBeGreaterThanOrEqual(1);
  });
});

describe("B3 (2026-08-28): misplaced quadratic-expansion item removed from maths_algebra_linear", () => {
  it("no longer carries the double-bracket expansion question (that's maths_quadratics' subject matter)", () => {
    const stale = SEED_QUESTIONS.find(
      (q) => q.topic_tag === "maths_algebra_linear" && q.prompt === "Expand (x + 2)(x + 3).",
    );
    expect(stale).toBeUndefined();
  });

  it("maths_quadratics keeps testing the identical skill with its own worked example", () => {
    const q = ALL.find(
      (item) => item.topic_tag === "maths_quadratics" && item.prompt === "Expand (x + 5)(x − 2).",
    );
    expect(q, "maths_quadratics still has its own expand-brackets item").toBeDefined();
    if (!q) return;
    expect(q.options[q.correct_index]).toBe("x² + 3x − 10");
  });

  it("maths_algebra_linear keeps only single-bracket (linear) expansion, one grade band below quadratics", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_algebra_linear");
    for (const q of qs) {
      expect(q.prompt).not.toMatch(/\)\s*\(/); // no "(...)(" double-bracket shape
    }
  });
});

describe("F1 (2026-08-28): GCSE Maths simultaneous equations strand", () => {
  it("adds the maths_simultaneous topic in the maths GCSE band with a worked example", () => {
    const topic = SEED_TOPICS.find((t) => t.topic_tag === "maths_simultaneous");
    expect(topic, "simultaneous equations topic present").toBeDefined();
    if (!topic) return;
    expect(topic.subject).toBe("mathematics");
    expect(topic.key_stage).toBe(4);
    expect(topic.title).toBe("Simultaneous Equations");
    expect(topic.prerequisite_tags).toContain("maths_algebra_linear");
    expect(topic.prerequisite_tags).toContain("maths_graphs");
    expect(topic.worked_example).toBeDefined();
  });

  it("ships the three authored starters, well-formed and correctly keyed", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_simultaneous");
    expect(qs.length).toBe(3);
    for (const q of qs) {
      expect(q.subject).toBe("mathematics");
      expect(q.key_stage).toBe(4);
      expect(q.correct_index).toBeGreaterThanOrEqual(0);
      expect(q.correct_index).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
    const answerOf = (needle: string) => {
      const q = qs.find((item) => item.prompt.includes(needle))!;
      return q.options[q.correct_index];
    };
    // x + y = 9, x − y = 3 → 2x = 12 → x = 6.
    expect((9 + 3) / 2).toBe(6);
    expect(answerOf("x + y = 9 and x − y = 3")).toBe("x = 6");
    // y = x + 2, 2x + y = 11 → 2x + x + 2 = 11 → 3x = 9 → x = 3.
    expect((11 - 2) / 3).toBe(3);
    expect(answerOf("y = x + 2 and 2x + y = 11")).toBe("x = 3");
    // Verify x = 2, y = 3 satisfies both 3x + y = 9 and x + 2y = 8.
    expect(3 * 2 + 3).toBe(9);
    expect(2 + 2 * 3).toBe(8);
    expect(answerOf("3x + y = 9 and x + 2y = 8")).toBe("x = 2, y = 3");
  });

  it("stays certifiable: at least one practice and one mastery item", () => {
    const qs = SEED_QUESTIONS.filter((q) => q.topic_tag === "maths_simultaneous");
    expect(qs.filter((q) => q.kind === "practice").length).toBeGreaterThanOrEqual(1);
    expect(qs.filter((q) => q.kind === "mastery").length).toBeGreaterThanOrEqual(1);
  });
});

describe("F2 (2026-08-28): maths_statistics combined/dependent-event probability", () => {
  const prompt =
    "A bag contains 4 red counters and 6 blue counters. A counter is picked at random and NOT replaced. A second counter is then picked. Work out the probability that both counters are blue.";

  it("adds exactly one well-formed item keyed to 1/3", () => {
    expectWellFormedItem("maths_statistics", "mathematics", prompt, "1/3");
  });

  it("computes: 6/10 × 5/9 = 30/90 = 1/3 (not replaced, so the second denominator drops)", () => {
    expect((6 / 10) * (5 / 9)).toBeCloseTo(1 / 3, 10);
    // The with-replacement trap distractor: 6/10 × 6/10 = 9/25.
    expect((6 / 10) * (6 / 10)).toBeCloseTo(9 / 25, 10);
  });

  it("is a distinct combined-event item, not a duplicate of the existing single-die probability question", () => {
    const statsPrompts = ALL.filter(
      (q) => q.topic_tag === "maths_statistics" && q.kind === "mastery",
    ).map((q) => q.prompt);
    expect(statsPrompts).toContain("A fair die is rolled. P(even number) = ?");
    expect(new Set(statsPrompts).size).toBe(statsPrompts.length);
  });
});

describe("F8 coupling — mock unlock stays reachable after adding a topic", () => {
  it("maths now has 14 GCSE topics (simultaneous equations lifted it past 13)", () => {
    expect(gcseTopicCount("mathematics")).toBe(14);
    expect(gcseTopicCount("english")).toBe(10);
    expect(gcseTopicCount("science")).toBe(10);
  });

  it("keeps the unlock at the reachable floor, never above the topic count", () => {
    for (const subject of ["mathematics", "english", "science"] as const) {
      const needed = mockUnlockCount(subject);
      // Never asks for more topics than exist (would be unreachable).
      expect(needed).toBeLessThanOrEqual(gcseTopicCount(subject));
      // Never exceeds the floor (adding topics does not raise the bar).
      expect(needed).toBeLessThanOrEqual(MOCK_UNLOCK_FLOOR);
      expect(needed).toBe(10);
    }
  });
});
