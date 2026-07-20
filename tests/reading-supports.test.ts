import { describe, it, expect } from "vitest";
import {
  normalizeTextScale,
  textScaleLabel,
  readingSupportsFromChild,
  DEFAULT_TEXT_SCALE,
  NO_READING_SUPPORTS,
} from "@/lib/child/reading-supports";

describe("normalizeTextScale", () => {
  it("accepts the allowed scales", () => {
    expect(normalizeTextScale(1)).toBe(1);
    expect(normalizeTextScale(1.15)).toBe(1.15);
    expect(normalizeTextScale(1.3)).toBe(1.3);
  });

  it("coerces numeric strings", () => {
    expect(normalizeTextScale("1.15")).toBe(1.15);
  });

  it("falls back to normal for anything invalid", () => {
    expect(normalizeTextScale(2)).toBe(DEFAULT_TEXT_SCALE);
    expect(normalizeTextScale(0)).toBe(DEFAULT_TEXT_SCALE);
    expect(normalizeTextScale("huge")).toBe(DEFAULT_TEXT_SCALE);
    expect(normalizeTextScale(undefined)).toBe(DEFAULT_TEXT_SCALE);
    expect(normalizeTextScale(null)).toBe(DEFAULT_TEXT_SCALE);
  });
});

describe("textScaleLabel", () => {
  it("labels each scale", () => {
    expect(textScaleLabel(1)).toBe("Normal");
    expect(textScaleLabel(1.15)).toBe("Large");
    expect(textScaleLabel(1.3)).toBe("Larger");
  });
});

describe("readingSupportsFromChild", () => {
  it("is all-off for an empty/legacy child doc", () => {
    expect(readingSupportsFromChild({})).toEqual(NO_READING_SUPPORTS);
  });

  it("reads explicit preferences", () => {
    expect(
      readingSupportsFromChild({
        reading_font: true,
        text_scale: 1.3,
        reading_ruler: true,
      }),
    ).toEqual({ font: true, scale: 1.3, ruler: true });
  });

  it("only turns on when explicitly true (legacy-safe)", () => {
    expect(readingSupportsFromChild({ reading_font: false }).font).toBe(false);
    expect(readingSupportsFromChild({ text_scale: 99 }).scale).toBe(1);
  });
});
