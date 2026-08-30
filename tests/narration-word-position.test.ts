import { afterEach, describe, expect, it } from "vitest";
import {
  getNarratedWordY,
  reportNarratedWordY,
  subscribeNarratedWordY,
} from "@/lib/child/narration-word-position";

/**
 * F4 (2026-08-30): the narrated-word-position store that lets the Reading
 * Ruler follow the karaoke caption's currently lit word instead of only the
 * pointer. Pure pub-sub, no DOM, no timers.
 */
describe("narration-word-position store", () => {
  afterEach(() => {
    // Leave the module singleton clean between tests.
    reportNarratedWordY(null);
  });

  it("starts at null (pure pointer-follow) before anything reports a position", () => {
    expect(getNarratedWordY()).toBeNull();
  });

  it("returns the last reported Y", () => {
    reportNarratedWordY(120);
    expect(getNarratedWordY()).toBe(120);
  });

  it("notifies subscribers only when the value actually changes", () => {
    let calls = 0;
    const unsubscribe = subscribeNarratedWordY(() => {
      calls += 1;
    });
    reportNarratedWordY(50);
    expect(calls).toBe(1);
    reportNarratedWordY(50); // same value, no-op
    expect(calls).toBe(1);
    reportNarratedWordY(75);
    expect(calls).toBe(2);
    unsubscribe();
    reportNarratedWordY(90);
    expect(calls).toBe(2); // unsubscribed, no further notifications
  });

  it("degrades back to null when narration stops (caption clears)", () => {
    reportNarratedWordY(200);
    expect(getNarratedWordY()).toBe(200);
    reportNarratedWordY(null);
    expect(getNarratedWordY()).toBeNull();
  });

  it("supports multiple independent subscribers", () => {
    const seenA: (number | null)[] = [];
    const seenB: (number | null)[] = [];
    const unsubA = subscribeNarratedWordY(() => seenA.push(getNarratedWordY()));
    const unsubB = subscribeNarratedWordY(() => seenB.push(getNarratedWordY()));
    reportNarratedWordY(10);
    reportNarratedWordY(20);
    expect(seenA).toEqual([10, 20]);
    expect(seenB).toEqual([10, 20]);
    unsubA();
    unsubB();
  });
});
