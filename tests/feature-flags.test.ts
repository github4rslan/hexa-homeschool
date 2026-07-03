import { describe, it, expect } from "vitest";
import {
  effectiveFlag,
  isKnownFlag,
  FEATURE_FLAGS,
} from "@/lib/admin/feature-flags";

describe("effectiveFlag", () => {
  it("falls back to the env default when no override is set", () => {
    expect(effectiveFlag("ai_visuals", {}, true)).toBe(true);
    expect(effectiveFlag("ai_visuals", {}, false)).toBe(false);
  });
  it("an explicit override wins over the env default", () => {
    expect(effectiveFlag("ai_visuals", { ai_visuals: false }, true)).toBe(false);
    expect(effectiveFlag("ai_visuals", { ai_visuals: true }, false)).toBe(true);
  });
  it("treats a non-true override value as off", () => {
    expect(
      effectiveFlag("ai_visuals", { ai_visuals: undefined as unknown as boolean }, true),
    ).toBe(false);
  });
});

describe("isKnownFlag", () => {
  it("accepts registered flags and rejects arbitrary keys", () => {
    expect(isKnownFlag("ai_visuals")).toBe(true);
    expect(isKnownFlag("__evil__")).toBe(false);
  });
  it("every registered flag has the required metadata", () => {
    for (const f of FEATURE_FLAGS) {
      expect(f.key).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(["ai", "safety", "ui"]).toContain(f.category);
    }
  });
});
