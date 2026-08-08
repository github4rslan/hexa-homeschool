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

describe("F8 coupling — mock unlock stays reachable after adding a topic", () => {
  it("maths now has 11 GCSE topics (mensuration lifted it past 10)", () => {
    expect(gcseTopicCount("mathematics")).toBe(11);
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
