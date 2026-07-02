import { describe, expect, it } from "vitest";
import { currentWeekStart, londonParts, londonDayStart } from "@/lib/db/repo";

// Day/week math is pinned to Europe/London (audit MEDIUM #2). Tests pass an
// explicit instant so they are deterministic regardless of the CI runner's TZ.
// June 2026: Monday 8th … Sunday 14th. BST (UTC+1) is in effect in June.

describe("londonParts", () => {
  it("reads the London calendar day, not UTC", () => {
    // 23:30Z on Sunday 14 June is 00:30 BST on Monday 15 June in London.
    const p = londonParts(new Date("2026-06-14T23:30:00Z"));
    expect(p.day).toBe(15);
    expect(p.weekday).toBe(0); // Monday
  });
});

describe("londonDayStart", () => {
  it("returns London midnight (23:00Z prev day) during BST", () => {
    // 00:30 BST on Mon 15 June → the day started at 23:00Z on Sun 14 June.
    const start = londonDayStart(new Date("2026-06-14T23:30:00Z"));
    expect(start.toISOString()).toBe("2026-06-14T23:00:00.000Z");
  });

  it("returns London midnight (00:00Z) during GMT/winter", () => {
    const start = londonDayStart(new Date("2026-01-15T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-01-15T00:00:00.000Z");
  });

  it("buckets a late-BST-evening instant into the correct local day", () => {
    // 22:30 BST Sunday 14 June is still Sunday in London → day start is Sun 00:00 BST.
    const start = londonDayStart(new Date("2026-06-14T21:30:00Z"));
    expect(start.toISOString()).toBe("2026-06-13T23:00:00.000Z");
  });
});

describe("currentWeekStart", () => {
  it("returns this week's Monday from midweek", () => {
    expect(currentWeekStart(new Date("2026-06-10T15:30:00Z"))).toBe("2026-06-08");
  });

  it("returns today on a Monday morning (London)", () => {
    expect(currentWeekStart(new Date("2026-06-08T07:30:00Z"))).toBe("2026-06-08");
  });

  it("rolls to the new week at London midnight, not 01:00 BST", () => {
    // 23:30Z Sunday = 00:30 BST Monday in London → already the NEW week.
    expect(currentWeekStart(new Date("2026-06-14T23:30:00Z"))).toBe("2026-06-15");
  });

  it("still the previous Monday late Sunday evening in London", () => {
    // 21:30Z Sunday = 22:30 BST Sunday in London → previous Monday.
    expect(currentWeekStart(new Date("2026-06-14T21:30:00Z"))).toBe("2026-06-08");
  });

  it("crosses a month boundary correctly", () => {
    // Wednesday 1 July (London) → Monday 29 June.
    expect(currentWeekStart(new Date("2026-07-01T12:00:00Z"))).toBe("2026-06-29");
  });
});
