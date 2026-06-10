import { NextResponse } from "next/server";
import { currentParentId, findParentById } from "@/lib/db/repo";
import { getStripe, BillingConfigError } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/billing/portal — redirect the signed-in parent to the Stripe
 * customer portal (plan changes, payment method, cancellation, invoices).
 * Parents without a Stripe customer yet are sent to /pricing to subscribe.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  const parentId = await currentParentId();
  if (!parentId) {
    return NextResponse.redirect(new URL("/login?redirect=/settings", url));
  }

  const parent = await findParentById(parentId);
  if (!parent?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/pricing", url));
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: parent.stripe_customer_id,
      return_url: new URL("/settings", url).toString(),
    });
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    if (err instanceof BillingConfigError) {
      return NextResponse.redirect(
        new URL(
          `/settings?error=${encodeURIComponent("Billing is not configured yet. Please try again later.")}`,
          url,
        ),
      );
    }
    console.error("[/api/billing/portal] failed:", err);
    return NextResponse.redirect(
      new URL(
        `/settings?error=${encodeURIComponent("We couldn't open the billing portal. Please try again.")}`,
        url,
      ),
    );
  }
}
