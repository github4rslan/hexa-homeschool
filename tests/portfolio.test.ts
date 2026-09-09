import { describe, expect, it } from "vitest";
import {
  buildPortfolioRecord,
  canonicalise,
  summarisePortfolioTopics,
} from "@/lib/compliance/portfolio";

describe("buildPortfolioRecord — work evidence (F2)", () => {
  it("omits the workEvidence field entirely when there is none", () => {
    const record = buildPortfolioRecord({ childName: "Ivy", term: "Q3 2026" });
    expect("workEvidence" in record).toBe(false);
    expect(canonicalise(record)).not.toContain("workEvidence");
  });

  it("preserves the prior Implementation evidence lines byte-for-byte with no work", () => {
    const record = buildPortfolioRecord({ childName: "Ivy", term: "Q3 2026" });
    const impl = record.sections.find((s) => s.key === "implementation");
    expect(impl?.evidence).toEqual([
      "Lesson completion logs",
      "Time-on-task telemetry",
      "Mastery-check records",
    ]);
  });

  it("attaches viewable work-evidence URLs and a named text line per topic", () => {
    const record = buildPortfolioRecord({
      childName: "Ivy",
      term: "Q3 2026",
      workEvidence: [
        { title: "Number & Place Value", url: "https://res.cloudinary.com/x/a.jpg" },
        { title: "Number & Place Value", url: "https://res.cloudinary.com/x/b.jpg" },
        { title: "Fractions", url: "https://res.cloudinary.com/x/c.jpg" },
      ],
    });
    // Structured, viewable artefacts are carried through.
    expect(record.workEvidence).toEqual([
      { title: "Number & Place Value", url: "https://res.cloudinary.com/x/a.jpg" },
      { title: "Number & Place Value", url: "https://res.cloudinary.com/x/b.jpg" },
      { title: "Fractions", url: "https://res.cloudinary.com/x/c.jpg" },
    ]);
    // The named text line is deduped per distinct topic (two photos, one line).
    const impl = record.sections.find((s) => s.key === "implementation");
    expect(impl?.evidence).toContain("Photo of written working — Number & Place Value");
    expect(impl?.evidence).toContain("Photo of written working — Fractions");
    expect(
      impl?.evidence.filter((e) =>
        e.startsWith("Photo of written working — Number & Place Value"),
      ),
    ).toHaveLength(1);
  });

  it("drops malformed work-evidence items (missing url or title)", () => {
    const record = buildPortfolioRecord({
      childName: "Ivy",
      term: "Q3 2026",
      workEvidence: [
        { title: "Good", url: "https://res.cloudinary.com/x/a.jpg" },
        { title: "", url: "" },
        // @ts-expect-error — intentionally malformed (missing url)
        { title: "No url" },
      ],
    });
    expect(record.workEvidence).toEqual([
      { title: "Good", url: "https://res.cloudinary.com/x/a.jpg" },
    ]);
  });

  it("canonicalise is deterministic for the same logical record", () => {
    const input = {
      childName: "Ivy",
      term: "Q3 2026",
      workEvidence: [
        { title: "Fractions", url: "https://res.cloudinary.com/x/c.jpg" },
      ],
    };
    const a = buildPortfolioRecord(input);
    const b = buildPortfolioRecord(input);
    // Same generatedAt (frozen structurally by overwriting) → identical string.
    b.generatedAt = a.generatedAt;
    expect(canonicalise(a)).toBe(canonicalise(b));
  });
});

describe("summarisePortfolioTopics (B2, curriculum-size-aware totals)", () => {
  it("never reports complete while any real GCSE topic remains uncertified", () => {
    // Maths has 14 real GCSE topics; the child has certified 6 GCSE + 4
    // pre-GCSE band topics under the old bug's flat count of 10, the fixed
    // GCSE-only count must still show 6/14, not a false "10/10 complete".
    const summary = summarisePortfolioTopics(
      { mathematics: 6, english: 10, science: 10 },
      { mathematics: 14, english: 10, science: 10 },
    );
    expect(summary.bySubject.mathematics).toEqual({ certified: 6, total: 14 });
    expect(summary.complete).toBe(false);
    expect(summary.certifiedTopics).toBe(26);
    expect(summary.totalTopics).toBe(34);
  });

  it("reports complete only when every subject is genuinely fully certified", () => {
    const summary = summarisePortfolioTopics(
      { mathematics: 14, english: 10, science: 10 },
      { mathematics: 14, english: 10, science: 10 },
    );
    expect(summary.complete).toBe(true);
    expect(summary.certifiedTopics).toBe(34);
  });

  it("clamps a subject's certified count to its own total so it can never exceed 100%", () => {
    // A child who has ALSO certified pre-GCSE band topics in the same
    // subject must never push the GCSE-subject count above that subject's
    // real total (the exact "31/30" overflow class of bug).
    const summary = summarisePortfolioTopics(
      { mathematics: 20, english: 5, science: 3 },
      { mathematics: 14, english: 10, science: 10 },
    );
    expect(summary.bySubject.mathematics).toEqual({ certified: 14, total: 14 });
    expect(summary.certifiedTopics).toBeLessThanOrEqual(summary.totalTopics);
  });
});
