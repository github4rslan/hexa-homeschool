import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  annualBillingConfigured,
  billingStatusForStripe,
  isBillingInterval,
  isPaidTier,
  priceIdForTier,
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

  it("maps annual price ids to the same tier as their monthly counterpart", () => {
    vi.stubEnv("STRIPE_PRICE_STANDARD", "price_std_123");
    vi.stubEnv("STRIPE_PRICE_FAMILY", "price_fam_456");
    vi.stubEnv("STRIPE_PRICE_STANDARD_ANNUAL", "price_std_annual");
    vi.stubEnv("STRIPE_PRICE_FAMILY_ANNUAL", "price_fam_annual");
    expect(tierForPriceId("price_std_annual")).toBe("standard");
    expect(tierForPriceId("price_fam_annual")).toBe("family");
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

describe("priceIdForTier", () => {
  it("returns the monthly price id by default", () => {
    vi.stubEnv("STRIPE_PRICE_STANDARD", "price_std_m");
    vi.stubEnv("STRIPE_PRICE_FAMILY", "price_fam_m");
    expect(priceIdForTier("standard")).toBe("price_std_m");
    expect(priceIdForTier("family", "monthly")).toBe("price_fam_m");
  });

  it("returns the annual price id when interval is annual", () => {
    vi.stubEnv("STRIPE_PRICE_STANDARD_ANNUAL", "price_std_a");
    vi.stubEnv("STRIPE_PRICE_FAMILY_ANNUAL", "price_fam_a");
    expect(priceIdForTier("standard", "annual")).toBe("price_std_a");
    expect(priceIdForTier("family", "annual")).toBe("price_fam_a");
  });

  it("throws a config error when the requested price id is unset", () => {
    expect(() => priceIdForTier("standard", "annual")).toThrow(
      /STRIPE_PRICE_STANDARD_ANNUAL is not set/,
    );
  });
});

describe("annualBillingConfigured", () => {
  it("is true only when BOTH annual price ids are set", () => {
    expect(annualBillingConfigured()).toBe(false);
    vi.stubEnv("STRIPE_PRICE_STANDARD_ANNUAL", "price_std_a");
    expect(annualBillingConfigured()).toBe(false);
    vi.stubEnv("STRIPE_PRICE_FAMILY_ANNUAL", "price_fam_a");
    expect(annualBillingConfigured()).toBe(true);
  });
});

describe("isBillingInterval", () => {
  it("accepts the two intervals and rejects junk", () => {
    expect(isBillingInterval("monthly")).toBe(true);
    expect(isBillingInterval("annual")).toBe(true);
    expect(isBillingInterval("weekly")).toBe(false);
    expect(isBillingInterval("")).toBe(false);
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
