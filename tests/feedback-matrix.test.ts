import { describe, expect, it } from "vitest";
import {
  ATTENTION_PAUSE_MS,
  CARELESS_MAX_MS,
  CONCEPT_GAP_HINTS,
  LATE_SESSION_MS,
  decideFeedback,
  type FeedbackSignals,
} from "@/lib/engine/feedback-matrix";

/** A neutral baseline: a calm first miss with no special signals. */
function base(overrides: Partial<FeedbackSignals> = {}): FeedbackSignals {
  return {
    attempts: 1,
    maxAttempts: 3,
    priorCorrectStreak: 0,
    msOnQuestion: 10_000,
    hintsUsed: 0,
    sessionElapsedMs: 60_000,
    hasMisconceptionHint: false,
    ...overrides,
  };
}

describe("decideFeedback (adaptive matrix)", () => {
  it("defaults to an encouraging nudge on an ordinary first miss", () => {
    const r = decideFeedback(base());
    expect(r.category).toBe("encourage");
    expect(r.escalateReteach).toBe(false);
    expect(r.suggestBreak).toBe(false);
    expect(r.simplify).toBe(false);
    expect(r.message).toMatch(/another go/i);
  });

  it("flags a careless slip: fast wrong answer after a correct run", () => {
    const r = decideFeedback(
      base({ msOnQuestion: CARELESS_MAX_MS - 1, priorCorrectStreak: 2 }),
    );
    expect(r.category).toBe("careless");
    expect(r.message).toMatch(/slow/i);
  });

  it("does NOT call it careless without a prior correct streak", () => {
    const r = decideFeedback(
      base({ msOnQuestion: CARELESS_MAX_MS - 1, priorCorrectStreak: 0 }),
    );
    expect(r.category).not.toBe("careless");
  });

  it("escalates to a re-teach on a concept gap (tries exhausted)", () => {
    const r = decideFeedback(base({ attempts: 3, maxAttempts: 3 }));
    expect(r.category).toBe("concept_gap");
    expect(r.escalateReteach).toBe(true);
  });

  it("escalates to a re-teach when hints are leaned on", () => {
    const r = decideFeedback(base({ attempts: 1, hintsUsed: CONCEPT_GAP_HINTS }));
    expect(r.category).toBe("concept_gap");
    expect(r.escalateReteach).toBe(true);
  });

  it("suggests a movement break after a long pause on one item", () => {
    const r = decideFeedback(base({ msOnQuestion: ATTENTION_PAUSE_MS }));
    expect(r.category).toBe("attention");
    expect(r.suggestBreak).toBe(true);
  });

  it("suggests a movement break late in a long session", () => {
    const r = decideFeedback(base({ sessionElapsedMs: LATE_SESSION_MS + 1 }));
    expect(r.category).toBe("attention");
    expect(r.suggestBreak).toBe(true);
  });

  it("offers language support (simpler + visual) on a slower second go", () => {
    const r = decideFeedback(base({ attempts: 2, hintsUsed: 1 }));
    expect(r.category).toBe("language");
    expect(r.simplify).toBe(true);
  });

  it("offers language support when a known misconception fired", () => {
    const r = decideFeedback(base({ hasMisconceptionHint: true }));
    expect(r.category).toBe("language");
    expect(r.simplify).toBe(true);
  });

  it("prioritises a real concept gap over fatigue and carelessness", () => {
    // Tries exhausted AND a long pause AND a fast-looking history: the gap wins.
    const r = decideFeedback(
      base({
        attempts: 3,
        msOnQuestion: ATTENTION_PAUSE_MS + 10_000,
        priorCorrectStreak: 3,
      }),
    );
    expect(r.category).toBe("concept_gap");
  });

  it("never returns punitive copy", () => {
    const categories: FeedbackSignals[] = [
      base(),
      base({ attempts: 3 }),
      base({ msOnQuestion: ATTENTION_PAUSE_MS }),
      base({ msOnQuestion: 1_000, priorCorrectStreak: 1 }),
      base({ attempts: 2 }),
    ];
    for (const s of categories) {
      const r = decideFeedback(s);
      expect(r.message).not.toMatch(/wrong|fail|bad|stupid/i);
      expect(r.message.length).toBeGreaterThan(0);
    }
  });
});
