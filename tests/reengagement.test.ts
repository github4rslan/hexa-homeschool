import { describe, expect, it } from "vitest";
import {
  decideReengagement,
  trackFor,
  highestSentStage,
  cycleKey,
  STAGE_THRESHOLD_DAYS,
  MIN_GAP_DAYS,
  type ReengInput,
} from "@/lib/engine/reengagement";
import { reengagementTemplate } from "@/lib/email/templates";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-03T09:00:00.000Z");

/** Build an input with sensible defaults; override per test. */
function input(over: Partial<ReengInput> = {}): ReengInput {
  return {
    now: NOW,
    lastActive: new Date(NOW.getTime() - 30 * DAY),
    tier: "diagnostic",
    billingStatus: "trialing",
    optedOut: false,
    state: { sentKeys: [], lastSentAt: null },
    ...over,
  };
}

/** last_active `d` days before NOW. */
function idle(d: number): Date {
  return new Date(NOW.getTime() - d * DAY);
}

describe("trackFor — segment → upsell vs re-engage-only", () => {
  it("free/diagnostic → upsell", () => {
    expect(trackFor("diagnostic", "trialing")).toBe("upsell");
    expect(trackFor("diagnostic", "active")).toBe("upsell");
  });
  it("paid + active/trialing → reengage (NO upsell)", () => {
    expect(trackFor("standard", "active")).toBe("reengage");
    expect(trackFor("family", "trialing")).toBe("reengage");
  });
  it("lapsed paid (canceled/paused) → upsell win-back", () => {
    expect(trackFor("standard", "canceled")).toBe("upsell");
    expect(trackFor("family", "paused")).toBe("upsell");
  });
});

describe("highestSentStage — only counts the current cycle", () => {
  const active = idle(20);
  it("0 when nothing sent", () => {
    expect(highestSentStage({ sentKeys: [], lastSentAt: null }, active)).toBe(0);
  });
  it("counts keys matching this cycle's anchor", () => {
    const keys = [cycleKey(active, 1), cycleKey(active, 2)];
    expect(highestSentStage({ sentKeys: keys, lastSentAt: null }, active)).toBe(2);
  });
  it("ignores keys from a prior cycle (different last_active)", () => {
    const prior = idle(200);
    const keys = [cycleKey(prior, 1), cycleKey(prior, 2), cycleKey(prior, 3)];
    // A fresh cycle (active) sees none of the prior-cycle claims → 0.
    expect(highestSentStage({ sentKeys: keys, lastSentAt: null }, active)).toBe(0);
  });
});

describe("decideReengagement — exclusions", () => {
  it("opted-out parents are always excluded", () => {
    const d = decideReengagement(input({ optedOut: true, lastActive: idle(30) }));
    expect(d).toEqual({ action: "none", reason: "opted-out" });
  });

  it("never-active parents are not our segment", () => {
    const d = decideReengagement(input({ lastActive: null }));
    expect(d).toEqual({ action: "none", reason: "no-activity" });
  });

  it("past_due is dunning, not win-back", () => {
    const d = decideReengagement(
      input({ billingStatus: "past_due", tier: "standard", lastActive: idle(30) }),
    );
    expect(d).toEqual({ action: "none", reason: "dunning-excluded" });
  });
});

describe("decideReengagement — escalating cadence", () => {
  it("not idle long enough → none", () => {
    const d = decideReengagement(input({ lastActive: idle(2) }));
    expect(d).toEqual({ action: "none", reason: "not-idle-yet" });
  });

  it("day 3 → stage 1 gentle", () => {
    const d = decideReengagement(input({ lastActive: idle(3) }));
    expect(d).toMatchObject({ action: "send", stage: 1 });
  });

  it("day 10 with stage 1 already sent → stage 2 value", () => {
    const active = idle(10);
    const d = decideReengagement(
      input({
        lastActive: active,
        state: {
          sentKeys: [cycleKey(active, 1)],
          lastSentAt: idle(6), // 6 days ago > MIN_GAP
        },
      }),
    );
    expect(d).toMatchObject({ action: "send", stage: 2 });
  });

  it("day 21 with stages 1+2 sent → stage 3 win-back", () => {
    const active = idle(21);
    const d = decideReengagement(
      input({
        lastActive: active,
        state: {
          sentKeys: [cycleKey(active, 1), cycleKey(active, 2)],
          lastSentAt: idle(11),
        },
      }),
    );
    expect(d).toMatchObject({ action: "send", stage: 3 });
  });

  it("after stage 3 the series is capped → none", () => {
    const active = idle(40);
    const d = decideReengagement(
      input({
        lastActive: active,
        state: {
          sentKeys: [
            cycleKey(active, 1),
            cycleKey(active, 2),
            cycleKey(active, 3),
          ],
          lastSentAt: idle(2),
        },
      }),
    );
    expect(d).toEqual({ action: "none", reason: "series-capped" });
  });

  it("never sends the same stage twice in a cycle (idempotent per stage)", () => {
    const active = idle(5);
    // Stage 1 already claimed; still only 5 days idle (stage 2 not due) → none.
    const d = decideReengagement(
      input({
        lastActive: active,
        state: { sentKeys: [cycleKey(active, 1)], lastSentAt: idle(1) },
      }),
    );
    expect(d.action).toBe("none");
  });
});

describe("decideReengagement — min-gap spacing for late-found parents", () => {
  it("a parent found at day 30 with nothing sent gets stage 1 first, not stage 3", () => {
    const active = idle(30);
    const d = decideReengagement(input({ lastActive: active }));
    expect(d).toMatchObject({ action: "send", stage: 1 });
  });

  it("stage 2 is withheld if stage 1 was sent under MIN_GAP days ago", () => {
    const active = idle(30);
    const d = decideReengagement(
      input({
        lastActive: active,
        state: {
          sentKeys: [cycleKey(active, 1)],
          lastSentAt: new Date(NOW.getTime() - (MIN_GAP_DAYS - 1) * DAY),
        },
      }),
    );
    expect(d).toEqual({ action: "none", reason: "spacing" });
  });

  it("stage 2 proceeds once MIN_GAP has elapsed", () => {
    const active = idle(30);
    const d = decideReengagement(
      input({
        lastActive: active,
        state: {
          sentKeys: [cycleKey(active, 1)],
          lastSentAt: new Date(NOW.getTime() - (MIN_GAP_DAYS + 1) * DAY),
        },
      }),
    );
    expect(d).toMatchObject({ action: "send", stage: 2 });
  });
});

describe("decideReengagement — cycle resets on return", () => {
  it("a returned-then-lapsed parent re-enters at stage 1 despite a completed prior cycle", () => {
    const priorCycle = idle(200);
    const freshCycle = idle(4); // came back, then went quiet again 4 days ago
    const d = decideReengagement(
      input({
        lastActive: freshCycle,
        state: {
          // Full prior series — all anchored to the OLD last_active.
          sentKeys: [
            cycleKey(priorCycle, 1),
            cycleKey(priorCycle, 2),
            cycleKey(priorCycle, 3),
          ],
          lastSentAt: idle(180),
        },
      }),
    );
    expect(d).toMatchObject({ action: "send", stage: 1 });
    // Claim key is anchored to the FRESH cycle, so it can't collide.
    expect(d).toMatchObject({ claimKey: cycleKey(freshCycle, 1) });
  });
});

describe("decideReengagement — track carried on the send", () => {
  it("free tier gets the upsell track", () => {
    const d = decideReengagement(input({ tier: "diagnostic", lastActive: idle(3) }));
    expect(d).toMatchObject({ action: "send", track: "upsell" });
  });
  it("paid active tier gets the re-engage-only track", () => {
    const d = decideReengagement(
      input({ tier: "family", billingStatus: "active", lastActive: idle(3) }),
    );
    expect(d).toMatchObject({ action: "send", track: "reengage" });
  });
});

describe("thresholds are the documented cadence", () => {
  it("3 / 10 / 21 days", () => {
    expect(STAGE_THRESHOLD_DAYS).toEqual({ 1: 3, 2: 10, 3: 21 });
  });
});

describe("reengagementTemplate — personalisation, CTA, compliance", () => {
  const base = {
    name: "Jane Smith",
    childFirstName: "Ada",
    loginUrl: "https://edway.test/login?redirect=/dashboard",
    subscribeUrl: "https://edway.test/pricing",
    settingsUrl: "https://edway.test/settings",
    unsubscribeUrl: "https://edway.test/unsubscribe?token=TOK",
  };

  it("greets by first name only and names the child", () => {
    const t = reengagementTemplate({ ...base, stage: 1, track: "upsell" });
    expect(t.html).toContain("Jane");
    expect(t.html).not.toContain("Smith");
    expect(t.html).toContain("Ada");
    expect(t.subject).toContain("Ada");
  });

  it("every stage carries a working one-click unsubscribe link (html + text)", () => {
    for (const stage of [1, 2, 3] as const) {
      for (const track of ["upsell", "reengage"] as const) {
        const t = reengagementTemplate({ ...base, stage, track });
        expect(t.html).toContain(base.unsubscribeUrl);
        expect(t.text).toContain(base.unsubscribeUrl);
        expect(t.html).toContain("<!DOCTYPE html>");
      }
    }
  });

  it("free-tier win-back (upsell, stage 3) shows a subscribe CTA + incentive", () => {
    const t = reengagementTemplate({ ...base, stage: 3, track: "upsell" });
    expect(t.html).toContain(base.subscribeUrl);
    expect(t.html).toMatch(/20%/);
    expect(t.subject.toLowerCase()).toMatch(/off|come back/);
  });

  it("paid win-back (reengage, stage 3) is a warm check-in with NO upsell", () => {
    const t = reengagementTemplate({ ...base, stage: 3, track: "reengage" });
    expect(t.html).not.toContain(base.subscribeUrl);
    expect(t.html).not.toMatch(/20%/);
    expect(t.subject.toLowerCase()).toContain("checking in");
  });

  it("stage 2 upsell lists what a plan unlocks; reengage does not", () => {
    const up = reengagementTemplate({ ...base, stage: 2, track: "upsell" });
    const re = reengagementTemplate({ ...base, stage: 2, track: "reengage" });
    expect(up.html).toMatch(/unlock/i);
    expect(re.html).not.toMatch(/plan would also unlock/i);
  });

  it("falls back gracefully with no parent name", () => {
    const t = reengagementTemplate({ ...base, name: null, stage: 1, track: "upsell" });
    expect(t.html).toContain("Hi there,");
  });
});
