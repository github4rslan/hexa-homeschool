import { describe, expect, it } from "vitest";
import { normaliseParentPin } from "@/lib/auth/parent-pin-input";

describe("parent PIN input", () => {
  it("accepts exactly four digits", () => {
    expect(normaliseParentPin(" 0427 ")).toBe("0427");
  });

  it("rejects empty, short, long, and non-numeric values", () => {
    expect(normaliseParentPin("")).toBeNull();
    expect(normaliseParentPin("123")).toBeNull();
    expect(normaliseParentPin("12345")).toBeNull();
    expect(normaliseParentPin("12a4")).toBeNull();
    expect(normaliseParentPin(undefined)).toBeNull();
  });
});
