import { describe, expect, it } from "vitest";
import { updateTier } from "@/lib/data/diagnostic";

describe("updateTier — IRT step rule (down only after 2 consecutive wrong)", () => {
  it("a single wrong answer does NOT drop the tier", () => {
    const r = updateTier(3, false, 0);
    expect(r.tier).toBe(3); // held, not lowered
    expect(r.downStreak).toBe(1);
  });

  it("two consecutive wrong answers DO drop the tier", () => {
    const first = updateTier(3, false, 0); // hold, streak 1
    const second = updateTier(first.tier, false, first.downStreak); // drop, streak 2
    expect(second.tier).toBeLessThan(3);
    expect(second.tier).toBeCloseTo(2.2, 5);
    expect(second.downStreak).toBe(2);
  });

  it("a correct answer steps up and resets the down-streak", () => {
    const wrong = updateTier(3, false, 0); // streak 1
    const right = updateTier(wrong.tier, true, wrong.downStreak);
    expect(right.tier).toBeCloseTo(3.8, 5);
    expect(right.downStreak).toBe(0);

    // After the reset, a lone wrong answer must NOT drop the tier again.
    const loneWrong = updateTier(right.tier, false, right.downStreak);
    expect(loneWrong.tier).toBe(right.tier);
    expect(loneWrong.downStreak).toBe(1);
  });

  it("a right answer between two wrongs prevents the drop", () => {
    const w1 = updateTier(3, false, 0); // streak 1
    const r = updateTier(w1.tier, true, w1.downStreak); // reset
    const w2 = updateTier(r.tier, false, r.downStreak); // streak 1 again, no drop
    expect(w2.tier).toBe(r.tier);
    expect(w2.downStreak).toBe(1);
  });

  it("sustained wrong answers keep tracking downward after the first drop", () => {
    let s = { tier: 4, downStreak: 0 };
    s = updateTier(s.tier, false, s.downStreak); // 1: hold
    expect(s.tier).toBe(4);
    s = updateTier(s.tier, false, s.downStreak); // 2: drop
    expect(s.tier).toBeCloseTo(3.2, 5);
    s = updateTier(s.tier, false, s.downStreak); // 3: keep dropping
    expect(s.tier).toBeCloseTo(2.4, 5);
  });

  it("never escapes the [1, 5] clamp", () => {
    // Floor: many drops can't go below 1.
    let s = { tier: 1.2, downStreak: 1 };
    for (let i = 0; i < 10; i++) s = updateTier(s.tier, false, s.downStreak);
    expect(s.tier).toBeGreaterThanOrEqual(1);

    // Ceiling: many correct answers can't exceed 5.
    let up = { tier: 4.8, downStreak: 0 };
    for (let i = 0; i < 10; i++) up = updateTier(up.tier, true, up.downStreak);
    expect(up.tier).toBeLessThanOrEqual(5);
  });
});
