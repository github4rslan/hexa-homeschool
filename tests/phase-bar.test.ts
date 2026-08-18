import { describe, expect, it } from "vitest";
import { pulseTargetOnCrossing } from "@/lib/child/phase-bar";

describe("F7 (2026-08-18) — phase-bar settle-pulse crossing decision", () => {
  it("pulses the newly-entered segment on forward progress", () => {
    expect(pulseTargetOnCrossing(0, 1)).toBe(1);
    expect(pulseTargetOnCrossing(1, 2)).toBe(2);
    expect(pulseTargetOnCrossing(0, 2)).toBe(2);
  });

  it("never pulses when the phase is unchanged (no re-fire on re-render)", () => {
    expect(pulseTargetOnCrossing(0, 0)).toBeNull();
    expect(pulseTargetOnCrossing(1, 1)).toBeNull();
    expect(pulseTargetOnCrossing(2, 2)).toBeNull();
  });

  it("never pulses on backward movement", () => {
    expect(pulseTargetOnCrossing(2, 1)).toBeNull();
    expect(pulseTargetOnCrossing(1, 0)).toBeNull();
  });
});
