import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  billingStatusForStripe,
  isPaidTier,
  tierForPriceId,
} from "@/lib/billing/stripe";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("tierForPriceId", () => {
  it("maps each configured price id to its tier", () => {
    vi.stubEnv("STRIPE_PRICE_STANDARD", "price_std_123");
    vi.stubEnv("STRIPE_PRICE_FAMILY", "price_fam_456");
    expect(tierForPriceId("price_std_123")).toBe("standard");
    expect(tierForPriceId("price_fam_456")).toBe("family");
  });

  it("returns null for an unknown price id", () => {
    vi.stubEnv("STRIPE_PRICE_STANDARD", "price_std_123");
    vi.stubEnv("STRIPE_PRICE_FAMILY", "price_fam_456");
    expect(tierForPriceId("price_other")).toBeNull();
  });

  it("returns null for an empty price id even when env vars are unset", () => {
    // Guards the "both undefined" trap: "" must never equal an unset env var.
    expect(tierForPriceId("")).toBeNull();
  });
});

describe("billingStatusForStripe", () => {
  const cases: [Stripe.Subscription.Status, string][] = [
    ["trialing", "trialing"],
    ["active", "active"],
    ["past_due", "past_due"],
    ["unpaid", "past_due"],
    ["incomplete", "past_due"],
    ["paused", "paused"],
    ["canceled", "canceled"],
    ["incomplete_expired", "canceled"],
  ];

  it.each(cases)("maps Stripe '%s' to '%s'", (stripeStatus, expected) => {
    expect(billingStatusForStripe(stripeStatus)).toBe(expected);
  });
});

describe("isPaidTier", () => {
  it("accepts the two paid tiers", () => {
    expect(isPaidTier("standard")).toBe(true);
    expect(isPaidTier("family")).toBe(true);
  });

  it("rejects the free tier and junk", () => {
    expect(isPaidTier("diagnostic")).toBe(false);
    expect(isPaidTier("")).toBe(false);
    expect(isPaidTier("premium")).toBe(false);
  });
});
