import { describe, expect, it } from "vitest";
import { SEED_TOPICS, SEED_QUESTIONS } from "@/lib/data/curriculum.seed";
import { SEED_QUESTIONS_EXTRA } from "@/lib/data/curriculum.seed.extra";

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
