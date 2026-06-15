import { describe, expect, it } from "vitest";
import {
  placeChild,
  START_TIER,
  type KeyStage,
} from "@/lib/engine/diagnostic-placement";

describe("placeChild — age → key-stage band", () => {
  it("places age 7–10 in KS2", () => {
    for (const age of [7, 8, 9, 10]) {
      expect(placeChild(age).keyStage).toBe(2);
    }
  });

  it("places age 11–13 in KS3", () => {
    for (const age of [11, 12, 13]) {
      expect(placeChild(age).keyStage).toBe(3);
    }
  });

  it("places age 14+ in KS4 (GCSE)", () => {
    for (const age of [14, 15, 16]) {
      expect(placeChild(age).keyStage).toBe(4);
    }
  });

  describe("band boundaries", () => {
    it("10 is KS2 but 11 crosses to KS3", () => {
      expect(placeChild(10).keyStage).toBe(2);
      expect(placeChild(11).keyStage).toBe(3);
    });

    it("13 is KS3 but 14 crosses to KS4", () => {
      expect(placeChild(13).keyStage).toBe(3);
      expect(placeChild(14).keyStage).toBe(4);
    });
  });

  describe("out-of-range ages clamp instead of throwing", () => {
    it("below 7 clamps down to KS2", () => {
      for (const age of [6, 4, 0]) {
        expect(() => placeChild(age)).not.toThrow();
        expect(placeChild(age).keyStage).toBe(2);
      }
    });

    it("above 16 clamps up to KS4", () => {
      for (const age of [17, 20, 99]) {
        expect(() => placeChild(age)).not.toThrow();
        expect(placeChild(age).keyStage).toBe(4);
      }
    });
  });

  it("every band is reachable", () => {
    const reached = new Set<KeyStage>();
    for (let age = 0; age <= 25; age++) reached.add(placeChild(age).keyStage);
    expect([...reached].sort()).toEqual([2, 3, 4]);
  });

  it("starts at the modest in-band entry tier, not the middle", () => {
    expect(START_TIER).toBe(2);
    for (const age of [8, 12, 15]) {
      expect(placeChild(age).startTier).toBe(START_TIER);
      expect(placeChild(age).startTier).toBeLessThan(3); // below mid (tier 3)
    }
  });
});
