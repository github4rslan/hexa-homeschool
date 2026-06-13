import { describe, expect, it } from "vitest";
import { scoreMock } from "@/lib/engine/mock-exam";

describe("scoreMock", () => {
  it("returns a floor grade for an empty paper", () => {
    const r = scoreMock([]);
    expect(r.total).toBe(0);
    expect(r.correct).toBe(0);
    expect(r.scorePct).toBe(0);
    expect(r.indicativeGrade).toContain("Grade");
  });

  it("computes accuracy as a percentage", () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
      tier: 3,
      correct: i < 7, // 7/10
    }));
    expect(scoreMock(answers).scorePct).toBe(70);
    expect(scoreMock(answers).correct).toBe(7);
  });

  it("grades a perfect hard paper near the top", () => {
    const answers = Array.from({ length: 10 }, () => ({ tier: 5, correct: true }));
    const r = scoreMock(answers);
    expect(r.estimatedTier).toBeGreaterThanOrEqual(4.5);
    expect(r.indicativeGrade).toBe("Grade 8–9");
  });

  it("does not over-state from easy questions alone", () => {
    const answers = Array.from({ length: 10 }, () => ({ tier: 1, correct: true }));
    const r = scoreMock(answers);
    // All correct but all tier-1 → low estimated tier.
    expect(r.estimatedTier).toBeLessThanOrEqual(2);
  });

  it("grades a total miss at the floor", () => {
    const answers = Array.from({ length: 10 }, () => ({ tier: 4, correct: false }));
    const r = scoreMock(answers);
    expect(r.correct).toBe(0);
    expect(r.estimatedTier).toBeGreaterThanOrEqual(1);
    // No correct answers → estimate leans on the paper-difficulty floor term only.
    expect(r.estimatedTier).toBeLessThanOrEqual(3);
  });

  it("is deterministic for the same input", () => {
    const answers = [
      { tier: 2, correct: true },
      { tier: 4, correct: true },
      { tier: 5, correct: false },
      { tier: 3, correct: true },
    ];
    const a = scoreMock(answers);
    const b = scoreMock(answers);
    expect(a).toEqual(b);
  });

  it("clamps the estimated tier into [1, 5]", () => {
    const answers = Array.from({ length: 5 }, () => ({ tier: 5, correct: true }));
    const r = scoreMock(answers);
    expect(r.estimatedTier).toBeLessThanOrEqual(5);
    expect(r.estimatedTier).toBeGreaterThanOrEqual(1);
  });
});
