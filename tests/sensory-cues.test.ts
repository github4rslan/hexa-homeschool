import { describe, expect, it } from "vitest";
import { CUE_DEBOUNCE_MS, shouldFireCue } from "@/lib/child/sensory-cues";

describe("shouldFireCue (rapid taps never stack into noise)", () => {
  it("fires when enough time has passed", () => {
    expect(shouldFireCue(1000, 0)).toBe(true);
    expect(shouldFireCue(1000, 1000 - CUE_DEBOUNCE_MS)).toBe(true);
  });

  it("suppresses a tap inside the debounce window", () => {
    expect(shouldFireCue(1000, 1000)).toBe(false);
    expect(shouldFireCue(1000, 1000 - CUE_DEBOUNCE_MS + 1)).toBe(false);
  });

  it("honours a custom debounce", () => {
    expect(shouldFireCue(500, 0, 500)).toBe(true);
    expect(shouldFireCue(499, 0, 500)).toBe(false);
  });
});
