import "server-only";
import Stripe from "stripe";
import type { ParentDoc } from "@/lib/db/types";

/**
 * Stripe billing configuration.
 *
 * Paid tiers map to Stripe Prices (recurring, GBP):
 *   subscription_tier "standard" → HEXA Complete (£49/mo) → STRIPE_PRICE_STANDARD
 *   subscription_tier "family"   → HEXA Partner  (£99/mo) → STRIPE_PRICE_FAMILY
 * "diagnostic" is the free tier and never goes through Stripe.
 *
 * Missing env vars throw BillingConfigError so routes degrade to a clean
 * redirect/503 rather than crashing (same pattern as AiConfigError).
 */

export type PaidTier = Extract<ParentDoc["subscription_tier"], "standard" | "family">;

/** 14-day free trial, as advertised on /pricing. */
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

/** The Stripe Price id a paid tier checks out with. */
export function priceIdForTier(tier: PaidTier): string {
  const envVar = tier === "standard" ? "STRIPE_PRICE_STANDARD" : "STRIPE_PRICE_FAMILY";
  const priceId = process.env[envVar];
  if (!priceId) {
    throw new BillingConfigError(
      `${envVar} is not set. Create the recurring price in Stripe and add its id.`,
    );
  }
  return priceId;
}

/** Reverse lookup: which tier does a Stripe Price id belong to (null = unknown). */
export function tierForPriceId(priceId: string): PaidTier | null {
  if (priceId && priceId === process.env.STRIPE_PRICE_STANDARD) return "standard";
  if (priceId && priceId === process.env.STRIPE_PRICE_FAMILY) return "family";
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
