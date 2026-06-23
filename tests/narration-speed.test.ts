import { describe, expect, it } from "vitest";
import {
  ELEVENLABS_NARRATION_SPEED,
  narrationSpeedForKeyStage,
} from "@/lib/ai/config";

describe("narrationSpeedForKeyStage", () => {
  it("uses the calm baseline when no band is supplied", () => {
    expect(narrationSpeedForKeyStage()).toBe(ELEVENLABS_NARRATION_SPEED);
  });

  it("reads KS2 a little slower and KS4 a little faster", () => {
    expect(narrationSpeedForKeyStage(2)).toBeLessThan(
      ELEVENLABS_NARRATION_SPEED,
    );
    expect(narrationSpeedForKeyStage(3)).toBe(ELEVENLABS_NARRATION_SPEED);
    expect(narrationSpeedForKeyStage(4)).toBeGreaterThan(
      ELEVENLABS_NARRATION_SPEED,
    );
  });
});
