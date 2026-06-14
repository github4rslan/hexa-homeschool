import { describe, expect, it } from "vitest";
import { isBirthdayToday, birthdayAge } from "@/lib/child/birthday";

describe("isBirthdayToday", () => {
  const now = new Date(2026, 5, 14); // 14 June 2026

  it("matches on month + day regardless of year", () => {
    expect(isBirthdayToday("2014-06-14", now)).toBe(true);
  });

  it("does not match a different day", () => {
    expect(isBirthdayToday("2014-06-13", now)).toBe(false);
  });

  it("does not match a different month", () => {
    expect(isBirthdayToday("2014-07-14", now)).toBe(false);
  });

  it("is false for empty or invalid input", () => {
    expect(isBirthdayToday("", now)).toBe(false);
    expect(isBirthdayToday("not-a-date", now)).toBe(false);
  });
});

describe("birthdayAge", () => {
  const now = new Date(2026, 5, 14);

  it("returns the age turned today", () => {
    expect(birthdayAge("2014-06-14", now)).toBe(12);
  });

  it("returns null when it is not the birthday", () => {
    expect(birthdayAge("2014-06-13", now)).toBeNull();
  });
});
