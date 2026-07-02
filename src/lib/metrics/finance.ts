/**
 * Finance metrics — pure, deterministic aggregation of subscription billing
 * state into MRR / ARR / subscription mix. No DB, no network: callers hand it
 * pre-aggregated `BillingRow[]` (from a Mongo `$group` in `repo.ts`) so this
 * layer stays unit-testable.
 *
 * MRR is computed from the tier LIST price (mirrors `/pricing` and the Stripe
 * recurring prices), NOT per-customer Stripe amounts — so discounts, annual
 * plans, and proration are not reflected. This is an intentional, documented
 * approximation (see docs/METRICS.md). Only `active` subscriptions count toward
 * MRR: trialing accounts are not yet paying, `past_due` is uncollected, and
 * `paused`/`canceled` are not billing.
 */

export type SubscriptionTier = "diagnostic" | "standard" | "family";
export type BillingStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused";

/** One pre-aggregated cell: how many parents sit at (tier, status). */
export interface BillingRow {
  tier: SubscriptionTier;
  status: BillingStatus;
  count: number;
}

/**
 * Canonical monthly list price per tier, GBP. Mirrors `/pricing`
 * (Edway Complete £49/mo, Edway Partner £99/mo) and the Stripe recurring
 * prices mapped in `lib/billing/stripe.ts`. `diagnostic` is the free tier.
 */
export const TIER_MONTHLY_GBP: Record<SubscriptionTier, number> = {
  diagnostic: 0,
  standard: 49,
  family: 99,
};

/** Display order for the subscription-mix breakdown. */
export const TIER_ORDER: SubscriptionTier[] = ["standard", "family", "diagnostic"];

const ALL_STATUSES: BillingStatus[] = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "paused",
];

/** A parent is "billing-active revenue" only when their status is `active`. */
export function isRevenueStatus(status: BillingStatus): boolean {
  return status === "active";
}

/** Monthly revenue (GBP) attributable to a single (tier, status) cell. */
export function rowMrr(
  row: BillingRow,
  prices: Record<SubscriptionTier, number> = TIER_MONTHLY_GBP,
): number {
  return isRevenueStatus(row.status) ? row.count * prices[row.tier] : 0;
}

export interface TierMix {
  tier: SubscriptionTier;
  /** All non-cancelled accounts on this tier (active + trialing + past_due + paused). */
  accounts: number;
  /** Accounts currently billing (status = active). */
  activeAccounts: number;
  /** Monthly revenue from this tier's active accounts, GBP. */
  mrr: number;
  /** Share of total accounts (all statuses), 0–100, rounded to 1dp. */
  percent: number;
}

export interface BillingSummary {
  /** Every account, all statuses. */
  totalAccounts: number;
  /** Count per billing status (zero-filled). */
  counts: Record<BillingStatus, number>;
  /** Monthly recurring revenue, GBP (active accounts only). */
  mrr: number;
  /** Annual recurring revenue, GBP (mrr × 12). */
  arr: number;
  /** Per-tier mix, in TIER_ORDER. */
  tiers: TierMix[];
}

function emptyStatusCounts(): Record<BillingStatus, number> {
  return {
    trialing: 0,
    active: 0,
    past_due: 0,
    canceled: 0,
    paused: 0,
  };
}

/**
 * Fold pre-aggregated billing rows into a full summary. Unknown/legacy tiers
 * or statuses are ignored (never counted as revenue) so a malformed row can
 * never inflate a headline figure.
 */
export function summarizeBilling(
  rows: BillingRow[],
  prices: Record<SubscriptionTier, number> = TIER_MONTHLY_GBP,
): BillingSummary {
  const counts = emptyStatusCounts();
  // tier -> { accounts (non-cancelled), active }
  const perTier = new Map<SubscriptionTier, { accounts: number; active: number }>();
  for (const tier of TIER_ORDER) perTier.set(tier, { accounts: 0, active: 0 });

  let totalAccounts = 0;
  let mrr = 0;

  for (const row of rows) {
    if (!ALL_STATUSES.includes(row.status)) continue;
    if (!(row.tier in TIER_MONTHLY_GBP)) continue;
    const n = Number.isFinite(row.count) && row.count > 0 ? Math.floor(row.count) : 0;
    if (n === 0) continue;

    counts[row.status] += n;
    totalAccounts += n;
    mrr += rowMrr({ ...row, count: n }, prices);

    const bucket = perTier.get(row.tier)!;
    if (row.status !== "canceled") bucket.accounts += n;
    if (row.status === "active") bucket.active += n;
  }

  const tiers: TierMix[] = TIER_ORDER.map((tier) => {
    const b = perTier.get(tier)!;
    return {
      tier,
      accounts: b.accounts,
      activeAccounts: b.active,
      mrr: b.active * prices[tier],
      percent: totalAccounts > 0 ? round1((b.accounts / totalAccounts) * 100) : 0,
    };
  });

  return { totalAccounts, counts, mrr, arr: mrr * 12, tiers };
}

/**
 * Monthly revenue (GBP) a single parent contributes, for per-row display.
 * Only active parents contribute; everyone else is £0.
 */
export function parentMonthlyMrr(
  tier: SubscriptionTier,
  status: BillingStatus,
  prices: Record<SubscriptionTier, number> = TIER_MONTHLY_GBP,
): number {
  return status === "active" ? prices[tier] ?? 0 : 0;
}

/** Format a whole-pound GBP figure with thousands separators (e.g. £1,284). */
export function formatGbp(amount: number): string {
  return `£${Math.round(amount).toLocaleString("en-GB")}`;
}

/**
 * Compact GBP for large headline figures: £1.36M, £113k, £850.
 * ARR crosses into millions quickly, so the Finance headline needs this.
 */
export function formatGbpCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `£${round2(amount / 1_000_000)}M`;
  if (abs >= 10_000) return `£${Math.round(amount / 1000)}k`;
  return formatGbp(amount);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
