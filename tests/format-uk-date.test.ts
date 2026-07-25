import { describe, it, expect } from "vitest";
import { formatUkDate } from "@/lib/utils";

describe("formatUkDate", () => {
  it("formats a week_start ISO date as a friendly UK long date (the B3 bug)", () => {
    expect(formatUkDate("2026-07-20")).toBe("20 July 2026");
  });

  it("does not shift the calendar day across timezones (UTC-anchored)", () => {
    expect(formatUkDate("2026-01-01")).toBe("1 January 2026");
    expect(formatUkDate("2026-12-31")).toBe("31 December 2026");
  });

  it("tolerates a full ISO datetime by using the date portion", () => {
    expect(formatUkDate("2026-07-20T00:00:00.000Z")).toBe("20 July 2026");
  });

  it("returns the input unchanged when it isn't a parseable ISO date", () => {
    expect(formatUkDate("")).toBe("");
    expect(formatUkDate("not-a-date")).toBe("not-a-date");
  });
});
