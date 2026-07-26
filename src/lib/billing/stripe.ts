import "server-only";
import Stripe from "stripe";
import type { ParentDoc } from "@/lib/db/types";

/**
 * Stripe billing configuration.
 *
 * Paid tiers map to Stripe Prices (recurring, GBP):
 *   subscription_tier "standard" → Edway Complete (£49/mo) → STRIPE_PRICE_STANDARD
 *   subscription_tier "family"   → Edway Partner  (£99/mo) → STRIPE_PRICE_FAMILY
 * "diagnostic" is the free tier and never goes through Stripe.
 *
 * Each tier also has an OPTIONAL annual price (2 months free, ~17% saving) that
 * the /pricing toggle offers only when both are provisioned:
 *   "standard" annual → STRIPE_PRICE_STANDARD_ANNUAL
 *   "family"   annual → STRIPE_PRICE_FAMILY_ANNUAL
 * Unset = the annual option is hidden (pilot mode) and only monthly is offered.
 *
 * Missing env vars throw BillingConfigError so routes degrade to a clean
 * redirect/503 rather than crashing (same pattern as AiConfigError).
 */

export type PaidTier = Extract<ParentDoc["subscription_tier"], "standard" | "family">;

/** Billing cadence a paid tier can check out with. */
export type BillingInterval = "monthly" | "annual";

/** 14-day free trial, as advertised on /pricing. Applies to both intervals. */
export const TRIAL_PERIOD_DAYS = 14;

/** Thrown when a required Stripe env var is missing. */
export class BillingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingConfigError";
  }
}

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new BillingConfigError(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local (and Vercel) to enable billing.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new BillingConfigError(
      "STRIPE_WEBHOOK_SECRET is not set. Add the webhook signing secret to enable billing sync.",
    );
  }
  return secret;
}

export function isPaidTier(value: string): value is PaidTier {
  return value === "standard" || value === "family";
}

export function isBillingInterval(value: string): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

/** The env var holding a tier's price id for the given interval. */
function priceEnvVar(tier: PaidTier, interval: BillingInterval): string {
  if (interval === "annual") {
    return tier === "standard"
      ? "STRIPE_PRICE_STANDARD_ANNUAL"
      : "STRIPE_PRICE_FAMILY_ANNUAL";
  }
  return tier === "standard" ? "STRIPE_PRICE_STANDARD" : "STRIPE_PRICE_FAMILY";
}

/** The Stripe Price id a paid tier checks out with, monthly by default. */
export function priceIdForTier(
  tier: PaidTier,
  interval: BillingInterval = "monthly",
): string {
  const envVar = priceEnvVar(tier, interval);
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new BillingConfigError(
      `${envVar} is not set. Create the recurring price in Stripe and add its id.`,
    );
  }
  return priceId;
}

/**
 * True only when BOTH annual price ids are configured. Gates the /pricing
 * monthly/annual toggle so an unreachable discount is never advertised.
 */
export function annualBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_PRICE_STANDARD_ANNUAL &&
      process.env.STRIPE_PRICE_FAMILY_ANNUAL,
  );
}

/**
 * Reverse lookup: which tier does a Stripe Price id belong to (null = unknown).
 * Matches both the monthly and annual price ids so the webhook derives the same
 * tier regardless of the cadence a parent chose.
 */
export function tierForPriceId(priceId: string): PaidTier | null {
  if (!priceId) return null;
  if (
    priceId === process.env.STRIPE_PRICE_STANDARD ||
    priceId === process.env.STRIPE_PRICE_STANDARD_ANNUAL
  ) {
    return "standard";
  }
  if (
    priceId === process.env.STRIPE_PRICE_FAMILY ||
    priceId === process.env.STRIPE_PRICE_FAMILY_ANNUAL
  ) {
    return "family";
  }
  return null;
}

/** Map a Stripe subscription status onto ParentDoc.billing_status. */
export function billingStatusForStripe(
  status: Stripe.Subscription.Status,
): ParentDoc["billing_status"] {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
  }
}
