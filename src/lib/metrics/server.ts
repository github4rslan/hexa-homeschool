import "server-only";
import { unstable_cache } from "next/cache";
import {
  adminBillingBreakdown,
  adminListDossiers,
  adminListParents,
  type AdminDossierRow,
  type AdminParentRow,
} from "@/lib/db/repo";
import { getStripe } from "@/lib/billing/stripe";
import { summarizeBilling, type BillingSummary } from "./finance";

/**
 * Cached server-side metric reads for the (admin) dashboards. Every heavy
 * aggregate is wrapped in `unstable_cache` (5-minute revalidate) so repeated
 * admin views never re-hit Mongo/Stripe on the hot path. Staff-only surfaces,
 * aggregate/minimal-PII by construction (see repo.ts). Missing Stripe keys
 * degrade to a clearly-labelled "not live" state rather than throwing.
 */

const REVALIDATE_SECONDS = 300;

/** Real MRR / ARR / subscription-mix, cached. */
export const getBillingSummary = unstable_cache(
  async (): Promise<BillingSummary> => summarizeBilling(await adminBillingBreakdown()),
  ["admin-billing-summary"],
  { revalidate: REVALIDATE_SECONDS },
);

/** Real parent accounts (newest first) with per-parent child counts, cached. */
export const getAdminParents = unstable_cache(
  async (limit = 100): Promise<AdminParentRow[]> => adminListParents(limit),
  ["admin-parents"],
  { revalidate: REVALIDATE_SECONDS },
);

/** Real compliance dossiers (newest first), cached. */
export const getAdminDossiers = unstable_cache(
  async (limit = 20): Promise<AdminDossierRow[]> => adminListDossiers(limit),
  ["admin-dossiers"],
  { revalidate: REVALIDATE_SECONDS },
);

export interface RecentPayment {
  id: string;
  /** Major-currency-unit amount (e.g. pounds), already divided by 100. */
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed";
  /** Unix ms, for relative-time rendering client/server side. */
  createdMs: number;
  description: string;
}

export interface RecentPaymentsResult {
  /** True only when a real Stripe read succeeded. False = show "not live". */
  live: boolean;
  payments: RecentPayment[];
}

async function fetchRecentPayments(limit: number): Promise<RecentPaymentsResult> {
  try {
    const stripe = getStripe();
    const charges = await stripe.charges.list({ limit });
    const payments: RecentPayment[] = charges.data.map((c) => ({
      id: c.id,
      amount: (c.amount ?? 0) / 100,
      currency: (c.currency ?? "gbp").toUpperCase(),
      status:
        c.status === "succeeded"
          ? "succeeded"
          : c.status === "pending"
            ? "pending"
            : "failed",
      createdMs: (c.created ?? 0) * 1000,
      // No customer names/emails on this cross-family surface — a neutral label only.
      description: c.description || (c.paid ? "Subscription payment" : "Payment attempt"),
    }));
    return { live: true, payments };
  } catch {
    // BillingConfigError (unset key) or any Stripe/network failure → not live.
    return { live: false, payments: [] };
  }
}

/**
 * Recent Stripe payments, cached. When Stripe is unconfigured or unreachable
 * the result is `{ live: false }` and the UI shows an explicit not-live state
 * instead of any fabricated payment.
 */
export const getRecentPayments = unstable_cache(
  async (limit = 6): Promise<RecentPaymentsResult> => fetchRecentPayments(limit),
  ["admin-recent-payments"],
  { revalidate: REVALIDATE_SECONDS },
);
