import { describe, expect, it } from "vitest";
import {
  buildPortfolioRecord,
  canonicalise,
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
