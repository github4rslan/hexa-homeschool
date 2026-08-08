import { describe, expect, it } from "vitest";
import { SEED_QUESTIONS_EXTRA } from "@/lib/data/curriculum.seed.extra";

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
