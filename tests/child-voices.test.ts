import { describe, expect, it } from "vitest";
import {
  CHILD_VOICES,
  ELEVENLABS_DEFAULT_VOICE_ID,
  isCuratedVoice,
} from "@/lib/ai/config";

describe("CHILD_VOICES (curated Eddie voices, Wave 8 Phase 2)", () => {
  it("offers 6–8 voices — choice without overwhelm", () => {
    expect(CHILD_VOICES.length).toBeGreaterThanOrEqual(6);
    expect(CHILD_VOICES.length).toBeLessThanOrEqual(8);
  });

  it("every entry is complete and ids are unique", () => {
    const ids = new Set<string>();
    for (const v of CHILD_VOICES) {
      expect(v.id).toBeTruthy();
      expect(v.label).toBeTruthy();
      expect(v.blurb).toBeTruthy();
      expect(ids.has(v.id)).toBe(false);
      ids.add(v.id);
    }
  });

  it("the default voice is the first entry (coherent as Eddie's voice)", () => {
    expect(CHILD_VOICES[0].id).toBe(ELEVENLABS_DEFAULT_VOICE_ID);
  });

  it("isCuratedVoice accepts every curated id and rejects everything else", () => {
    for (const v of CHILD_VOICES) {
      expect(isCuratedVoice(v.id)).toBe(true);
    }
    expect(isCuratedVoice("")).toBe(false);
    expect(isCuratedVoice("not-a-voice")).toBe(false);
    // A real ElevenLabs id that is NOT curated must still be rejected.
    expect(isCuratedVoice("21m00Tcm4TlvDq8ikWAM")).toBe(false);
  });
});
