import { afterEach, describe, expect, it, vi } from "vitest";
import { currentWeekStart } from "@/lib/db/repo";

// June 2026: Monday 8th, Sunday 14th (local-time fixtures).

afterEach(() => {
  vi.useRealTimers();
});

function freezeAt(year: number, monthIndex: number, day: number, hour: number): void {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, monthIndex, day, hour, 30, 0));
}

describe("currentWeekStart", () => {
  it("returns this week's Monday from midweek", () => {
    freezeAt(2026, 5, 10, 15); // Wednesday 10 June
    expect(currentWeekStart()).toBe("2026-06-08");
  });

  it("returns today on a Monday, even just after local midnight", () => {
    freezeAt(2026, 5, 8, 0); // Monday 8 June, 00:30 local
    expect(currentWeekStart()).toBe("2026-06-08");
  });

  it("still returns the PREVIOUS Monday late on a Sunday", () => {
    freezeAt(2026, 5, 14, 23); // Sunday 14 June, 23:30 local
    expect(currentWeekStart()).toBe("2026-06-08");
  });

  it("crosses a month boundary correctly", () => {
    freezeAt(2026, 6, 1, 12); // Wednesday 1 July → Monday 29 June
    expect(currentWeekStart()).toBe("2026-06-29");
  });
});
