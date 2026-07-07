import { describe, expect, it } from "vitest";
import {
  ELEVENLABS_MIN_NARRATION_SPEED,
  ELEVENLABS_NARRATION_SPEED,
  ELEVENLABS_VOICE_SETTINGS,
  narrationSpeedForKeyStage,
} from "@/lib/ai/config";

describe("narrationSpeedForKeyStage (younger = slower)", () => {
  it("uses the calm baseline when no band is supplied", () => {
    expect(narrationSpeedForKeyStage()).toBe(ELEVENLABS_NARRATION_SPEED);
  });

  it("scales by key stage: KS2 slowest, KS3 baseline, KS4 quickest", () => {
    const ks2 = narrationSpeedForKeyStage(2);
    const ks3 = narrationSpeedForKeyStage(3);
    const ks4 = narrationSpeedForKeyStage(4);
    expect(ks2).toBeLessThan(ks3);
    expect(ks3).toBe(ELEVENLABS_NARRATION_SPEED);
    expect(ks4).toBeGreaterThan(ks3);
    expect(ks2).toBeCloseTo(0.76, 5);
    expect(ks4).toBeCloseTo(0.84, 5);
  });

  it("never drops below the floor or outside ElevenLabs' range", () => {
    for (const ks of [undefined, 2, 3, 4]) {
      const speed = narrationSpeedForKeyStage(ks);
      expect(speed).toBeGreaterThanOrEqual(ELEVENLABS_MIN_NARRATION_SPEED);
      expect(speed).toBeGreaterThanOrEqual(0.7);
      expect(speed).toBeLessThanOrEqual(1.2);
    }
  });
});

describe("voice settings stay within ElevenLabs bounds", () => {
  it("stability/style/similarity are all within 0–1", () => {
    const { stability, similarity_boost, style } = ELEVENLABS_VOICE_SETTINGS;
    for (const v of [stability, similarity_boost, style]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(ELEVENLABS_VOICE_SETTINGS.use_speaker_boost).toBe(true);
  });
});
