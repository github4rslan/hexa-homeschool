import { describe, expect, it } from "vitest";
import { buildAssessmentNarrative } from "@/lib/engine/assessment-narrative";

describe("buildAssessmentNarrative", () => {
  it("says 'not been assessed yet' when a subject has no evaluation and no certified topics", () => {
    const narrative = buildAssessmentNarrative([
      { subject: "english", readiness: null, grade: null },
    ]);
    expect(narrative.subjects[0].text).toMatch(/has not been assessed yet/);
  });

  it("still says 'not been assessed yet' when lessonProgress is passed but the count is zero", () => {
    const narrative = buildAssessmentNarrative(
      [{ subject: "english", readiness: null, grade: null }],
      null,
      { english: { certifiedCount: 0, bandLabel: "GCSE level" } },
    );
    expect(narrative.subjects[0].text).toMatch(/has not been assessed yet/);
  });

  // B3 (2026-08-27): a subject with real lesson-based certified progress must
  // never say "not been assessed yet" — that flatly contradicts the "Current
  // standing" card on the same page, which shows the same certified count.
  it("acknowledges lesson-based progress instead of a flat 'not assessed' line", () => {
    const narrative = buildAssessmentNarrative(
      [{ subject: "science", readiness: null, grade: null }],
      null,
      { science: { certifiedCount: 7, bandLabel: "GCSE level" } },
    );
    const text = narrative.subjects[0].text;
    expect(text).not.toMatch(/has not been assessed yet/);
    expect(text).toMatch(/7 topics are already certified/);
    expect(text).toMatch(/GCSE level/);
  });

  it("uses singular grammar for exactly one certified topic", () => {
    const narrative = buildAssessmentNarrative(
      [{ subject: "science", readiness: null, grade: null }],
      null,
      { science: { certifiedCount: 1, bandLabel: null } },
    );
    const text = narrative.subjects[0].text;
    expect(text).toMatch(/1 topic is already certified/);
    expect(text).not.toMatch(/at\s*—/); // no dangling "at" when bandLabel is null
  });

  it("does not change the narrative for a subject that already has a real evaluation", () => {
    const narrative = buildAssessmentNarrative(
      [{ subject: "mathematics", readiness: 72, grade: "5" }],
      null,
      { mathematics: { certifiedCount: 4, bandLabel: "GCSE level" } },
    );
    const text = narrative.subjects[0].text;
    expect(text).toMatch(/working at grade 5 today/i);
    expect(text).not.toMatch(/already certified through lessons/);
  });
});
