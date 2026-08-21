import { NextResponse } from "next/server";
import { currentParentId, findParentById } from "@/lib/db/repo";
import { captureServer } from "@/lib/analytics/server";
import {
  getStripe,
  priceIdForTier,
  isPaidTier,
  isBillingInterval,
  TRIAL_PERIOD_DAYS,
  BillingConfigError,
} from "@/lib/billing/stripe";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/billing/checkout?tier=standard|family[&interval=monthly|annual]
 *
 * Linked directly from the /pricing tier buttons. Signed-in parents are
 * redirected to a Stripe Checkout session; visitors are sent to /signup first.
 * `interval` defaults to monthly; annual uses the tier's annual price id when
 * provisioned (falls through to a friendly config banner otherwise).
 * Billing state is NOT written here — the webhook is the single writer, so a
 * completed payment always wins over an abandoned tab.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.redirect(new URL("/signup", url));
  }

  const tier = url.searchParams.get("tier") ?? "";
  if (!isPaidTier(tier)) {
    return NextResponse.redirect(new URL("/pricing", url));
  }

  const intervalParam = url.searchParams.get("interval") ?? "monthly";
  const interval = isBillingInterval(intervalParam) ? intervalParam : "monthly";

  const parent = await findParentById(parentId);
  if (!parent) {
    return NextResponse.redirect(new URL("/login?redirect=/pricing", url));
  }

  // F4 (2026-08-22) — defence-in-depth: creates a real Stripe Checkout session
  // on every hit. Same friendly-redirect pattern as the config-error branch
  // below, so a trip never surfaces a raw error to a parent.
  const limited = await rateLimit(`billing-checkout:${parentId}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent("Too many attempts. Please wait a moment and try again.")}`,
        url,
      ),
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Reuse the Stripe customer once one exists so the subscription history
      // stays on a single customer record.
      ...(parent.stripe_customer_id
        ? { customer: parent.stripe_customer_id }
        : { customer_email: parent.email }),
      line_items: [{ price: priceIdForTier(tier, interval), quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata: { parentId, interval },
      },
      metadata: { parentId, tier, interval },
      allow_promotion_codes: true,
      success_url: new URL("/settings?checkout=success", url).toString(),
      cancel_url: new URL("/pricing", url).toString(),
    });

    if (!session.url) {
      throw new Error("Stripe returned a checkout session without a URL.");
    }
    captureServer(parentId, "checkout_started", { tier, interval });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    if (err instanceof BillingConfigError) {
      // Settings renders ?error= as a banner — friendlier than a JSON 503 on
      // a user-facing redirect flow.
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent("Billing is not configured yet. Please try again later.")}`,
          url,
        ),
      );
    }
    console.error("[/api/billing/checkout] failed:", err);
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent("We couldn't start checkout. Please try again.")}`,
        url,
      ),
    );
  }
}
