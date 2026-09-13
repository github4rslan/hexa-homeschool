import { describe, expect, it } from "vitest";
import { formatWorkingGrade, gradeBand, tierToGrade } from "@/lib/data/diagnostic";
import { scoreMock } from "@/lib/engine/mock-exam";

// B3 (2026-09-13): a Local Authority compliance document rendered "Grade
// Grade 4-5" for a child whose latest evaluation came from a mock exam,
// because the mock path stored `model_predicted_grade` as a full "Grade X-Y"
// string while every display site (which also unconditionally prepends the
// word "Grade") assumed the bare-band shape the diagnostic path already
// used. The fix normalizes at the source: `gradeBand()` (and therefore
// `scoreMock().indicativeGrade`, which is written verbatim into
// `model_predicted_grade`) must never contain the word "Grade".
describe("gradeBand — bare GCSE working-grade band (no 'Grade' word)", () => {
  it("never contains the word 'Grade' for any valid tier", () => {
    for (let tier = 1; tier <= 5; tier++) {
      expect(gradeBand(tier)).not.toContain("Grade");
    }
  });

  it("clamps out-of-range tiers into the same bare bands", () => {
    expect(gradeBand(0)).toBe(gradeBand(1));
    expect(gradeBand(9)).toBe(gradeBand(5));
  });

  it("rounds fractional tiers to the nearest band", () => {
    expect(gradeBand(2.6)).toBe(gradeBand(3));
  });
});

describe("tierToGrade — full display string built from gradeBand", () => {
  it("prefixes the bare band with the word 'Grade' exactly once", () => {
    for (let tier = 1; tier <= 5; tier++) {
      expect(tierToGrade(tier)).toBe(`Grade ${gradeBand(tier)}`);
      // Never a doubled prefix.
      expect(tierToGrade(tier).match(/Grade/g)?.length).toBe(1);
    }
  });
});

describe("scoreMock().indicativeGrade — the field written to model_predicted_grade", () => {
  it("never contains the word 'Grade', for an empty paper", () => {
    expect(scoreMock([]).indicativeGrade).not.toContain("Grade");
  });

  it("never contains the word 'Grade', across a range of results", () => {
    const papers = [
      Array.from({ length: 10 }, () => ({ tier: 5, correct: true })),
      Array.from({ length: 10 }, () => ({ tier: 1, correct: true })),
      Array.from({ length: 10 }, () => ({ tier: 4, correct: false })),
      Array.from({ length: 10 }, (_, i) => ({ tier: 3, correct: i < 7 })),
    ];
    for (const paper of papers) {
      expect(scoreMock(paper).indicativeGrade).not.toContain("Grade");
    }
  });
});

// Live regression (2026-09-13): the source-level fix above does not
// retroactively rewrite evaluation records written BEFORE it shipped, so a
// stored value could still legitimately carry the old "Grade X-Y" shape.
// formatWorkingGrade() is the defensive, idempotent display-time guard that
// makes every consumer safe regardless of which shape it is handed.
describe("formatWorkingGrade — idempotent display formatting, never doubles the word", () => {
  it("prefixes a bare band with the word 'Grade'", () => {
    expect(formatWorkingGrade("4–5")).toBe("Grade 4–5");
    expect(formatWorkingGrade("5")).toBe("Grade 5");
  });

  it("does not double the word when the stored value already has it (pre-fix legacy data)", () => {
    expect(formatWorkingGrade("Grade 4–5")).toBe("Grade 4–5");
    expect(formatWorkingGrade("grade 5")).toBe("Grade 5");
  });

  it("returns null for a null, undefined or empty grade", () => {
    expect(formatWorkingGrade(null)).toBeNull();
    expect(formatWorkingGrade(undefined)).toBeNull();
    expect(formatWorkingGrade("")).toBeNull();
  });

  it("never produces a string containing the word 'Grade' twice, for any input", () => {
    for (const input of ["4–5", "Grade 4–5", "grade 8–9", "5", "Grade 5", null, ""]) {
      const out = formatWorkingGrade(input);
      if (out) {
        expect(out.match(/Grade/gi)?.length).toBe(1);
      }
    }
  });
});
