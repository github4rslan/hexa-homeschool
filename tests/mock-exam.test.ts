import { describe, expect, it } from "vitest";
import { scoreMock } from "@/lib/engine/mock-exam";
import { marksForTier, gradeForMarks } from "@/lib/engine/mock-paper";

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

describe("F7 — mark weighting (scoreMock)", () => {
  it("defaults every item to 1 mark, so marksPct equals accuracy", () => {
    const answers = Array.from({ length: 10 }, (_, i) => ({
      tier: 3,
      correct: i < 7,
    }));
    const r = scoreMock(answers);
    expect(r.marksTotal).toBe(10);
    expect(r.marksEarned).toBe(7);
    expect(r.marksPct).toBe(70);
    // With uniform 1-mark items the mark score matches the raw accuracy.
    expect(r.marksPct).toBe(r.scorePct);
  });

  it("weights harder items more, so marksPct can diverge from accuracy", () => {
    // Two 1-mark items right, one 4-mark item wrong: 2 of 3 correct (67%) but
    // only 2 of 6 marks (33%).
    const answers = [
      { tier: 1, marks: 1, correct: true },
      { tier: 1, marks: 1, correct: true },
      { tier: 5, marks: 4, correct: false },
    ];
    const r = scoreMock(answers);
    expect(r.correct).toBe(2);
    expect(r.total).toBe(3);
    expect(r.scorePct).toBe(67);
    expect(r.marksTotal).toBe(6);
    expect(r.marksEarned).toBe(2);
    expect(r.marksPct).toBe(33);
  });

  it("rewards getting the heavy items right", () => {
    // One 1-mark item wrong, one 4-mark item right: 1 of 2 correct (50%) but
    // 4 of 5 marks (80%).
    const answers = [
      { tier: 1, marks: 1, correct: false },
      { tier: 5, marks: 4, correct: true },
    ];
    const r = scoreMock(answers);
    expect(r.scorePct).toBe(50);
    expect(r.marksPct).toBe(80);
  });

  it("returns zeroed mark fields for an empty paper", () => {
    const r = scoreMock([]);
    expect(r.marksTotal).toBe(0);
    expect(r.marksEarned).toBe(0);
    expect(r.marksPct).toBe(0);
  });
});

describe("F7 — marksForTier", () => {
  it("weights harder tiers more, capped and whole", () => {
    expect(marksForTier(1)).toBe(1);
    expect(marksForTier(2)).toBe(1);
    expect(marksForTier(3)).toBe(2);
    expect(marksForTier(4)).toBe(3);
    expect(marksForTier(5)).toBe(4);
  });

  it("clamps out-of-range tiers", () => {
    expect(marksForTier(0)).toBe(1);
    expect(marksForTier(9)).toBe(4);
  });
});

describe("F7 — gradeForMarks (approximate boundaries)", () => {
  it("always flags the grade as approximate", () => {
    expect(gradeForMarks("mathematics", "Higher", 85).approximate).toBe(true);
  });

  it("maps maths Higher marks to a plausible grade band", () => {
    expect(gradeForMarks("mathematics", "Higher", 85).grade).toBe("9");
    expect(gradeForMarks("mathematics", "Higher", 72).grade).toBe("8");
    expect(gradeForMarks("mathematics", "Higher", 50).grade).toBe("6");
    expect(gradeForMarks("mathematics", "Higher", 24).grade).toBe("4");
    expect(gradeForMarks("mathematics", "Higher", 10).grade).toBe("U");
  });

  it("caps Foundation maths at grade 5", () => {
    // Even a near-perfect Foundation paper cannot exceed grade 5.
    expect(gradeForMarks("mathematics", "Foundation", 100).grade).toBe("5");
    expect(gradeForMarks("mathematics", "Foundation", 55).grade).toBe("4");
    expect(gradeForMarks("mathematics", "Foundation", 5).grade).toBe("U");
  });

  it("treats English as single tier (same table both windows)", () => {
    expect(gradeForMarks("english", "Foundation", 62).grade).toBe(
      gradeForMarks("english", "Higher", 62).grade,
    );
    expect(gradeForMarks("english", "Higher", 82).grade).toBe("9");
  });

  it("grades are monotonic in the mark percentage", () => {
    let prev = -1;
    for (let pct = 0; pct <= 100; pct += 5) {
      const g = gradeForMarks("science", "Higher", pct).grade;
      const num = g === "U" ? 0 : Number(g);
      expect(num).toBeGreaterThanOrEqual(prev);
      prev = num;
    }
  });

  it("clamps out-of-range percentages", () => {
    expect(gradeForMarks("science", "Higher", 150).grade).toBe("9");
    expect(gradeForMarks("science", "Higher", -20).grade).toBe("U");
  });
});
