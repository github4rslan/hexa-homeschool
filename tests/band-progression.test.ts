import { describe, expect, it } from "vitest";
import { currentBandFrom } from "@/lib/engine/band-progression";
import type { KeyStage } from "@/lib/engine/diagnostic-placement";

describe("currentBandFrom (cross-band progression)", () => {
  it("stays in the floor band when it has uncertified topics", () => {
    expect(currentBandFrom(2, () => false)).toBe(2);
    expect(currentBandFrom(3, () => false)).toBe(3);
    expect(currentBandFrom(4, () => false)).toBe(4);
  });

  it("advances one band when the floor band is fully certified", () => {
    const exhausted = (b: KeyStage) => b === 2; // KS2 done, KS3 has work
    expect(currentBandFrom(2, exhausted)).toBe(3);
  });

  it("advances multiple bands when several are exhausted", () => {
    const exhausted = (b: KeyStage) => b === 2 || b === 3; // KS2 and KS3 done
    expect(currentBandFrom(2, exhausted)).toBe(4);
  });

  it("never advances past KS4", () => {
    expect(currentBandFrom(2, () => true)).toBe(4);
    expect(currentBandFrom(4, () => true)).toBe(4);
  });

  it("never drops below the floor (age band)", () => {
    // A 15-year-old (floor 4) is never sent to KS2/KS3 even if those are empty.
    expect(currentBandFrom(4, () => false)).toBe(4);
  });

  it("skips an empty band (no authored topics) treated as exhausted", () => {
    const exhausted = (b: KeyStage) => b === 2; // KS2 empty/done → skip to KS3
    expect(currentBandFrom(2, exhausted)).toBe(3);
  });
});
