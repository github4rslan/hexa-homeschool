import { describe, expect, it } from "vitest";
import {
  projectGrade,
  parseTargetWindow,
  certificationSeries,
} from "@/lib/engine/trajectory";

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 0, 1);

describe("projectGrade", () => {
  it("reports no trend with fewer than 2 points", () => {
    expect(projectGrade([], T0).hasTrend).toBe(false);
    expect(projectGrade([{ t: T0, grade: 4, mock: false }], T0).hasTrend).toBe(false);
  });

  it("projects a rising trend forward", () => {
    const points = [
      { t: T0, grade: 3, mock: false },
      { t: T0 + 30 * DAY, grade: 4, mock: true },
      { t: T0 + 60 * DAY, grade: 5, mock: true },
    ];
    const p = projectGrade(points, T0 + 120 * DAY);
    expect(p.hasTrend).toBe(true);
    // ~1 grade/month rising → at +120 days ≈ grade 7.
    expect(p.projectedGrade).toBeGreaterThanOrEqual(6.5);
    expect(p.projectedGrade).toBeLessThanOrEqual(7.5);
    expect(p.gradesPerMonth).toBeGreaterThan(0.5);
  });

  it("clamps projections into the 1–9 GCSE range", () => {
    const points = [
      { t: T0, grade: 8, mock: false },
      { t: T0 + 30 * DAY, grade: 9, mock: true },
    ];
    const p = projectGrade(points, T0 + 365 * DAY);
    expect(p.projectedGrade).toBeLessThanOrEqual(9);
  });

  it("handles a flat trend", () => {
    const points = [
      { t: T0, grade: 5, mock: false },
      { t: T0 + 30 * DAY, grade: 5, mock: true },
    ];
    const p = projectGrade(points, T0 + 90 * DAY);
    expect(p.projectedGrade).toBe(5);
    expect(p.gradesPerMonth).toBe(0);
  });

  it("does not divide by zero when all points share a timestamp", () => {
    const points = [
      { t: T0, grade: 4, mock: false },
      { t: T0, grade: 6, mock: true },
    ];
    const p = projectGrade(points, T0 + 90 * DAY);
    expect(p.hasTrend).toBe(true);
    expect(p.projectedGrade).toBe(5); // mean, flat
  });
});

describe("certificationSeries (F5)", () => {
  it("returns an empty series for no dates", () => {
    expect(certificationSeries([])).toEqual([]);
  });

  it("builds a cumulative, time-sorted series", () => {
    const series = certificationSeries([
      new Date(T0 + 2 * DAY),
      new Date(T0),
      new Date(T0 + 1 * DAY),
    ]);
    expect(series).toEqual([
      { t: T0, count: 1 },
      { t: T0 + DAY, count: 2 },
      { t: T0 + 2 * DAY, count: 3 },
    ]);
  });

  it("drops invalid dates", () => {
    const series = certificationSeries([new Date(T0), new Date("not a date")]);
    expect(series).toEqual([{ t: T0, count: 1 }]);
  });
});

describe("parseTargetWindow", () => {
  it("returns null for unparseable input", () => {
    expect(parseTargetWindow(null)).toBeNull();
    expect(parseTargetWindow("someday")).toBeNull();
  });

  it("parses a year", () => {
    const t = parseTargetWindow("2028");
    expect(t).not.toBeNull();
    expect(new Date(t!).getUTCFullYear()).toBe(2028);
  });

  it("maps season words to months", () => {
    expect(new Date(parseTargetWindow("Summer 2028")!).getUTCMonth()).toBe(5);
    expect(new Date(parseTargetWindow("Autumn 2027")!).getUTCMonth()).toBe(10);
  });
});
