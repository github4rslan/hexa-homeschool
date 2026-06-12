import { afterEach, describe, expect, it, vi } from "vitest";
import { ageFromDob, computeExamDecision } from "@/lib/engine/exam-decision";
import type { SubjectInput } from "@/lib/engine/exam-decision";

afterEach(() => {
  vi.useRealTimers();
});

function freezeAt(year: number, monthIndex: number, day: number): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, monthIndex, day, 12, 0, 0));
}

const allAssessed: SubjectInput[] = [
  { subject: "mathematics", readiness: 80, grade: "5" },
  { subject: "english", readiness: 55, grade: "4" },
  { subject: "science", readiness: 30, grade: "3" },
];

describe("ageFromDob", () => {
  it("turns the new age on the birthday itself", () => {
    freezeAt(2026, 5, 15); // 15 June 2026
    expect(ageFromDob("2013-06-15")).toBe(13);
  });

  it("is still the old age the day before the birthday", () => {
    freezeAt(2026, 5, 14);
    expect(ageFromDob("2013-06-15")).toBe(12);
  });

  it("never returns a negative age", () => {
    freezeAt(2026, 5, 15);
    expect(ageFromDob("2030-01-01")).toBe(0);
  });
});

describe("computeExamDecision eligibility", () => {
  it("is ineligible at 12 even with assessed subjects", () => {
    freezeAt(2026, 5, 15);
    const d = computeExamDecision("2014-01-01", allAssessed); // age 12
    expect(d.eligible).toBe(false);
    expect(d.age).toBe(12);
    expect(d.paths).toHaveLength(0);
    expect(d.summary).toMatch(/age 13/);
  });

  it("is eligible at exactly 13 with an assessed subject", () => {
    freezeAt(2026, 5, 15);
    const d = computeExamDecision("2013-06-15", allAssessed); // 13 today
    expect(d.eligible).toBe(true);
    expect(d.age).toBe(13);
  });

  it("is ineligible at 13+ when nothing is assessed", () => {
    freezeAt(2026, 5, 15);
    const d = computeExamDecision("2012-01-01", [
      { subject: "mathematics", readiness: null, grade: null },
      { subject: "english", readiness: null, grade: null },
      { subject: "science", readiness: null, grade: null },
    ]);
    expect(d.eligible).toBe(false);
    expect(d.summary).toMatch(/diagnostic/i);
  });
});

describe("computeExamDecision focus + paths", () => {
  it("anchors on the highest-readiness assessed subject", () => {
    // The function frames "ready to sit" around the strongest subject
    // (see the in-function comment) — maths at 80 here.
    freezeAt(2026, 5, 15);
    const d = computeExamDecision("2012-01-01", allAssessed);
    expect(d.focusSubject).toBe("mathematics");
    expect(d.readiness).toBe(80);
    expect(d.grade).toBe("5");
  });

  it("ignores unassessed subjects when picking the focus", () => {
    freezeAt(2026, 5, 15);
    const d = computeExamDecision("2012-01-01", [
      { subject: "mathematics", readiness: null, grade: null },
      { subject: "english", readiness: 45, grade: "4" },
    ]);
    expect(d.focusSubject).toBe("english");
  });

  function recommendedKeys(readiness: number): string[] {
    const d = computeExamDecision("2012-01-01", [
      { subject: "mathematics", readiness, grade: "4" },
    ]);
    return d.paths.filter((p) => p.recommended).map((p) => p.key);
  }

  it("recommends D (strengthen foundations) below 50%", () => {
    freezeAt(2026, 5, 15);
    expect(recommendedKeys(40)).toEqual(["D"]);
  });

  it("recommends A (advance curriculum) from 50% to below 75%", () => {
    freezeAt(2026, 5, 15);
    expect(recommendedKeys(50)).toEqual(["A"]);
    expect(recommendedKeys(74)).toEqual(["A"]);
  });

  it("recommends B (sit Foundation) from 75%", () => {
    freezeAt(2026, 5, 15);
    expect(recommendedKeys(75)).toEqual(["B"]);
  });

  it("recommends B and C (push Higher) from 85%", () => {
    freezeAt(2026, 5, 15);
    expect(recommendedKeys(90)).toEqual(["B", "C"]);
  });

  it("always returns all four paths for an eligible child", () => {
    freezeAt(2026, 5, 15);
    const d = computeExamDecision("2012-01-01", allAssessed);
    expect(d.paths.map((p) => p.key)).toEqual(["A", "B", "C", "D"]);
  });
});
