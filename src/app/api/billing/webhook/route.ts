import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  getWebhookSecret,
  tierForPriceId,
  billingStatusForStripe,
  BillingConfigError,
} from "@/lib/billing/stripe";
import {
  updateParentBillingById,
  updateParentBillingByCustomerId,
  type BillingUpdate,
} from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/webhook — Stripe event sink, the ONLY writer of
 * subscription_tier / billing_status / stripe ids on ParentDoc.
 *
 * Auth is the Stripe signature (no session — Stripe calls this). Point a
 * webhook endpoint at this route with events:
 *   checkout.session.completed
 *   customer.subscription.created / updated / deleted
 *
 * Handlers are idempotent (plain $set), so Stripe retries are harmless.
 * Unhandled processing errors return 500 so Stripe retries them.
 */

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/** Tier + status + ids derived from a subscription object. */
function updateFromSubscription(sub: Stripe.Subscription): BillingUpdate {
  const update: BillingUpdate = {
    status: billingStatusForStripe(sub.status),
    stripeSubscriptionId: sub.id,
  };
  const customerId = customerIdOf(sub.customer);
  if (customerId) update.stripeCustomerId = customerId;
  // Derive the tier from the price actually subscribed to — never from
  // anything the browser could have influenced.
  const tier = tierForPriceId(sub.items.data[0]?.price?.id ?? "");
  if (tier) update.tier = tier;
  return update;
}

/** Apply a subscription-derived update, preferring the parentId in metadata. */
async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const update = updateFromSubscription(sub);
  const parentId = sub.metadata?.parentId;
  const synced = parentId
    ? await updateParentBillingById(parentId, update)
    : update.stripeCustomerId
      ? await updateParentBillingByCustomerId(update.stripeCustomerId, update)
      : false;
  if (!synced) {
    console.error(
      `[/api/billing/webhook] no parent matched subscription ${sub.id} (customer ${update.stripeCustomerId ?? "?"})`,
    );
  }
}

export async function POST(request: Request) {
  let stripe: Stripe;
  let secret: string;
  try {
    stripe = getStripe();
    secret = getWebhookSecret();
  } catch (err) {
    if (err instanceof BillingConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    throw err;
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      secret,
    );
  } catch (err) {
    console.error("[/api/billing/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const parentId = session.metadata?.parentId;
        if (!parentId) {
          console.error(
            `[/api/billing/webhook] checkout session ${session.id} has no parentId metadata`,
          );
          break;
        }
        // The subscription is the authority on status + tier; the session
        // links it to the parent and pins the customer id.
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const sub = subId
          ? await stripe.subscriptions.retrieve(subId)
          : null;
        const update: BillingUpdate = sub
          ? updateFromSubscription(sub)
          : { status: "active" };
        const customerId = customerIdOf(session.customer);
        if (customerId) update.stripeCustomerId = customerId;
        await updateParentBillingById(parentId, update);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const update: BillingUpdate = {
          tier: "diagnostic",
          status: "canceled",
          stripeSubscriptionId: null,
        };
        const parentId = sub.metadata?.parentId;
        const customerId = customerIdOf(sub.customer);
        if (parentId) {
          await updateParentBillingById(parentId, update);
        } else if (customerId) {
          await updateParentBillingByCustomerId(customerId, update);
        }
        break;
      }

      default:
        // Not subscribed to anything else; acknowledge and ignore.
        break;
    }
  } catch (err) {
    console.error(`[/api/billing/webhook] ${event.type} failed:`, err);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
