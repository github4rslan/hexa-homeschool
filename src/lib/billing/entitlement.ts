import type { ParentDoc } from "@/lib/db/types";
import { findParentById } from "@/lib/db/repo";

/**
 * Entitlement gate for the paid AI features (/api/tutor, /api/tts, /api/stt).
 *
 * Pilot mode: while Stripe is not configured (no STRIPE_SECRET_KEY) there is
 * no upgrade path, so every signed-in account stays entitled — blocking would
 * brick the product for the pilot cohort. The moment billing goes live, the
 * free "diagnostic" tier is excluded and lapsed subscriptions lose access
 * (past_due keeps a dunning grace window; canceled/paused do not).
 */

export interface EntitlementInput {
  tier: ParentDoc["subscription_tier"];
  status: ParentDoc["billing_status"];
  billingConfigured: boolean;
}

/** Pure decision — unit-tested in tests/entitlement.test.ts. */
export function canUseAiFeatures(input: EntitlementInput): boolean {
  if (!input.billingConfigured) return true;
  if (input.tier === "diagnostic") return false;
  return (
    input.status === "trialing" ||
    input.status === "active" ||
    input.status === "past_due"
  );
}

export function billingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Route-side check: load the parent and apply the entitlement rule. */
export async function parentCanUseAi(parentId: string): Promise<boolean> {
  const parent = await findParentById(parentId);
  if (!parent) return false;
  return canUseAiFeatures({
    tier: parent.subscription_tier,
    status: parent.billing_status,
    billingConfigured: billingConfigured(),
  });
}

/** Shared 403 copy so all three routes say the same thing. */
export const AI_ENTITLEMENT_ERROR =
  "AI lessons aren't included in your current plan. Visit /pricing to upgrade.";
