import { describe, expect, it } from "vitest";
import {
  MOCK_PERIOD_DAYS,
  periodWindowFromWeekStart,
} from "@/lib/engine/assessment-period";

describe("mock assessment period", () => {
  it("defaults to a weekly cadence", () => {
    expect(MOCK_PERIOD_DAYS).toBe(7);
  });

  it("builds a [start, next) window from a Monday week-start", () => {
    const { start, next } = periodWindowFromWeekStart("2026-06-22");
    expect(start.toISOString()).toBe("2026-06-22T00:00:00.000Z");
    expect(next.toISOString()).toBe("2026-06-29T00:00:00.000Z");
  });

  it("spans exactly the period length", () => {
    const { start, next } = periodWindowFromWeekStart("2026-01-05");
    const days = (next.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBe(MOCK_PERIOD_DAYS);
  });

  it("classifies a result inside vs. outside the window", () => {
    const { start, next } = periodWindowFromWeekStart("2026-06-22");
    const inside = new Date("2026-06-24T10:00:00.000Z");
    const before = new Date("2026-06-21T23:59:59.000Z");
    const after = new Date("2026-06-29T00:00:00.000Z");
    expect(inside >= start && inside < next).toBe(true);
    expect(before >= start).toBe(false);
    expect(after < next).toBe(false); // next period — unlocked
  });
});
