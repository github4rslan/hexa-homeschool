import { describe, it, expect } from "vitest";
import {
  REFLECTIONS,
  isReflectionKey,
  reflectionChip,
  reflectionFeedLine,
} from "@/lib/child/reflection";

describe("child reflection (F5)", () => {
  it("has a non-empty, unique set of options", () => {
    expect(REFLECTIONS.length).toBeGreaterThan(0);
    const keys = REFLECTIONS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of REFLECTIONS) {
      expect(r.chip.length).toBeGreaterThan(0);
      expect(r.feed.length).toBeGreaterThan(0);
    }
  });

  it("validates only known keys", () => {
    expect(isReflectionKey("faster")).toBe(true);
    expect(isReflectionKey("proud")).toBe(true);
    expect(isReflectionKey("nope")).toBe(false);
    expect(isReflectionKey(42)).toBe(false);
    expect(isReflectionKey(null)).toBe(false);
  });

  it("maps a key to its child chip", () => {
    expect(reflectionChip("faster")).toBe("I got faster");
    expect(reflectionChip("nope")).toBeNull();
  });

  it("builds a warm first-name parent-feed line", () => {
    expect(reflectionFeedLine("Ada", "faster")).toBe("Ada felt faster today");
    expect(reflectionFeedLine("Sam", "proud")).toContain("Sam");
  });

  it("falls back gently for an unknown key (legacy-safe, never blank)", () => {
    const line = reflectionFeedLine("Ivy", "unknown_key");
    expect(line.startsWith("Ivy ")).toBe(true);
    expect(line.length).toBeGreaterThan("Ivy ".length);
  });
});
