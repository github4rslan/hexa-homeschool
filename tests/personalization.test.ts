import { describe, expect, it } from "vitest";
import { CHILD_VOICES, isCuratedVoice, ELEVENLABS_DEFAULT_VOICE_ID } from "@/lib/ai/config";
import { ACCENTS, DEFAULT_ACCENT, isAccent, accentPreset } from "@/lib/child/accents";

describe("child personalization validation", () => {
  it("accepts only curated voice ids", () => {
    for (const v of CHILD_VOICES) expect(isCuratedVoice(v.id)).toBe(true);
    expect(isCuratedVoice("arbitrary-id")).toBe(false);
    expect(isCuratedVoice("")).toBe(false);
  });

  it("includes the server default among the curated voices", () => {
    expect(isCuratedVoice(ELEVENLABS_DEFAULT_VOICE_ID)).toBe(true);
  });

  it("accepts only known accents", () => {
    for (const a of ACCENTS) expect(isAccent(a.id)).toBe(true);
    expect(isAccent("rainbow")).toBe(false);
    expect(isAccent("")).toBe(false);
  });

  it("falls back to the default accent for unknown ids", () => {
    expect(accentPreset("rainbow").id).toBe(DEFAULT_ACCENT);
    expect(accentPreset(null).id).toBe(DEFAULT_ACCENT);
    expect(accentPreset(undefined).id).toBe(DEFAULT_ACCENT);
    expect(accentPreset("cyan").id).toBe("cyan");
  });

  it("offers a curated, non-overwhelming set of choices", () => {
    // Wave 8 Phase 2 widened the voice set to 6–8 (still hand-picked, never
    // an open list); accents stay at four.
    expect(CHILD_VOICES.length).toBeGreaterThanOrEqual(6);
    expect(CHILD_VOICES.length).toBeLessThanOrEqual(8);
    expect(ACCENTS.length).toBe(4);
  });
});
