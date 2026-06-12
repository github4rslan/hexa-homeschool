import { describe, expect, it } from "vitest";
import { canUseAiFeatures } from "@/lib/billing/entitlement";
import type { EntitlementInput } from "@/lib/billing/entitlement";

type Tier = EntitlementInput["tier"];
type Status = EntitlementInput["status"];

const ALL_STATUSES: Status[] = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "paused",
];

describe("canUseAiFeatures — pilot mode (billing not configured)", () => {
  it("allows every tier and status when Stripe is not configured", () => {
    const tiers: Tier[] = ["diagnostic", "standard", "family"];
    for (const tier of tiers) {
      for (const status of ALL_STATUSES) {
        expect(
          canUseAiFeatures({ tier, status, billingConfigured: false }),
        ).toBe(true);
      }
    }
  });
});

describe("canUseAiFeatures — billing live", () => {
  it("blocks the free diagnostic tier regardless of status", () => {
    for (const status of ALL_STATUSES) {
      expect(
        canUseAiFeatures({ tier: "diagnostic", status, billingConfigured: true }),
      ).toBe(false);
    }
  });

  it.each<[Status, boolean]>([
    ["trialing", true],
    ["active", true],
    ["past_due", true], // dunning grace window
    ["canceled", false],
    ["paused", false],
  ])("paid tier with status '%s' → %s", (status, expected) => {
    expect(
      canUseAiFeatures({ tier: "standard", status, billingConfigured: true }),
    ).toBe(expected);
    expect(
      canUseAiFeatures({ tier: "family", status, billingConfigured: true }),
    ).toBe(expected);
  });
});
