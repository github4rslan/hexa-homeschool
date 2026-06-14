import { describe, expect, it } from "vitest";
import {
  validateMessageBody,
  isThreadType,
  MAX_MESSAGE_CHARS,
} from "@/lib/messaging/validate";

describe("validateMessageBody", () => {
  it("accepts a normal message and trims it", () => {
    const r = validateMessageBody("  hello tutor  ");
    expect(r).toEqual({ ok: true, body: "hello tutor" });
  });

  it("rejects non-strings", () => {
    expect(validateMessageBody(42).ok).toBe(false);
    expect(validateMessageBody(null).ok).toBe(false);
    expect(validateMessageBody(undefined).ok).toBe(false);
  });

  it("rejects empty or whitespace-only", () => {
    expect(validateMessageBody("").ok).toBe(false);
    expect(validateMessageBody("   ").ok).toBe(false);
  });

  it("rejects over-length messages", () => {
    expect(validateMessageBody("a".repeat(MAX_MESSAGE_CHARS + 1)).ok).toBe(false);
  });

  it("accepts a message exactly at the limit", () => {
    const r = validateMessageBody("a".repeat(MAX_MESSAGE_CHARS));
    expect(r.ok).toBe(true);
  });

  it("validates thread types", () => {
    expect(isThreadType("booking")).toBe(true);
    expect(isThreadType("escalation")).toBe(true);
    expect(isThreadType("other")).toBe(false);
    expect(isThreadType(null)).toBe(false);
  });
});
