import { describe, expect, it } from "vitest";
import { validatePhone, normalizePhone } from "@/lib/sms/phone";

describe("validatePhone (E.164)", () => {
  it("accepts a valid UK mobile in international format", () => {
    expect(validatePhone("+447700900123")).toEqual({
      ok: true,
      value: "+447700900123",
    });
  });

  it("normalises spaces, hyphens and parentheses", () => {
    expect(validatePhone("+44 7700 900-123")).toEqual({
      ok: true,
      value: "+447700900123",
    });
    expect(validatePhone("+1 (415) 555 2671").value).toBe("+14155552671");
  });

  it("rejects numbers without a leading +", () => {
    expect(validatePhone("447700900123").ok).toBe(false);
    expect(validatePhone("07700900123").ok).toBe(false);
  });

  it("rejects a country code starting with 0", () => {
    expect(validatePhone("+0447700900").ok).toBe(false);
  });

  it("rejects too-short and too-long numbers", () => {
    expect(validatePhone("+44770").ok).toBe(false); // too short
    expect(validatePhone("+1234567890123456").ok).toBe(false); // 16 digits
  });

  it("rejects non-strings and empties", () => {
    expect(validatePhone(null).ok).toBe(false);
    expect(validatePhone(undefined).ok).toBe(false);
    expect(validatePhone(123).ok).toBe(false);
    expect(validatePhone("   ").ok).toBe(false);
  });

  it("normalizePhone strips formatting characters", () => {
    expect(normalizePhone(" +44 (770) 090-0123 ".trim())).toBe("+447700900123");
  });
});
