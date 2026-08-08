import { describe, expect, it } from "vitest";
import {
  mockPaperFraming,
  mockTierWindow,
  selectMockPaper,
} from "@/lib/engine/mock-paper";

describe("mockPaperFraming (F9 exam-day conditions)", () => {
  it("frames maths as a non-calculator paper", () => {
    const f = mockPaperFraming("mathematics");
    expect(f.calculatorAllowed).toBe(false);
    expect(f.paperLabel).toBe("Non-calculator");
    expect(f.conditionLine).toMatch(/no calculator/i);
  });

  it("frames science as a calculator paper", () => {
    const f = mockPaperFraming("science");
    expect(f.calculatorAllowed).toBe(true);
    expect(f.paperLabel).toBe("Calculator allowed");
  });

  it("frames english as a reading and writing paper", () => {
    const f = mockPaperFraming("english");
    expect(f.calculatorAllowed).toBe(false);
    expect(f.conditionLine).toMatch(/no calculator needed/i);
  });
});

describe("mockTierWindow (F9 readiness-driven tier)", () => {
  it("defaults to Foundation when unassessed or building", () => {
    expect(mockTierWindow(null)).toEqual({ min: 1, max: 3, label: "Foundation" });
    expect(mockTierWindow(40).label).toBe("Foundation");
    expect(mockTierWindow(84).label).toBe("Foundation");
  });

  it("moves to Higher once readiness is strong (>= 85)", () => {
    expect(mockTierWindow(85)).toEqual({ min: 3, max: 5, label: "Higher" });
    expect(mockTierWindow(97).label).toBe("Higher");
  });
});

describe("selectMockPaper (F9 tier-targeted, always fills)", () => {
  const q = (id: string, tier: number) => ({ id, tier });

  it("spreads across all tiers when no window is given", () => {
    const pool = [q("a", 1), q("b", 2), q("c", 3), q("d", 4), q("e", 5)];
    const out = selectMockPaper(pool, 3);
    expect(out.length).toBe(3);
    // Even sample across the sorted pool of 5 (indices 0, 1, 3).
    expect(out.map((x) => x.tier)).toEqual([1, 2, 4]);
  });

  it("clusters inside the target window when it has enough questions", () => {
    const pool = [
      q("a", 1),
      q("b", 1),
      q("c", 4),
      q("d", 4),
      q("e", 5),
      q("f", 5),
    ];
    const out = selectMockPaper(pool, 3, { min: 3, max: 5 });
    expect(out.length).toBe(3);
    expect(out.every((x) => x.tier >= 3 && x.tier <= 5)).toBe(true);
  });

  it("tops up with the nearest tiers when the window is thin, never under-fills", () => {
    const pool = [q("a", 1), q("b", 1), q("c", 2), q("d", 5)];
    const out = selectMockPaper(pool, 3, { min: 4, max: 5 });
    expect(out.length).toBe(3);
    // The single in-window item (tier 5) leads; then nearest tiers fill.
    expect(out[0].tier).toBe(5);
    expect(out.map((x) => x.tier).sort()).toEqual([1, 2, 5]);
  });

  it("returns the whole pool when it is smaller than the count", () => {
    const pool = [q("a", 2), q("b", 3)];
    expect(selectMockPaper(pool, 10, { min: 1, max: 3 }).length).toBe(2);
  });
});
