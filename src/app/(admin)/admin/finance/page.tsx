import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { IllustrativeBadge, IllustrativeNote } from "@/components/admin/illustrative";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBillingSummary, getRecentPayments } from "@/lib/metrics/server";
import {
  formatGbp,
  formatGbpCompact,
  TIER_MONTHLY_GBP,
  type SubscriptionTier,
} from "@/lib/metrics/finance";

export const metadata: Metadata = { title: "Admin · Finance" };
export const dynamic = "force-dynamic";

const TIER_LABEL: Record<SubscriptionTier, string> = {
  standard: "Complete (£49)",
  family: "Partner (£99)",
  diagnostic: "Diagnostic (free)",
};

function relativeTime(ms: number): string {
  const diffSec = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export default async function FinancePage() {
  const [summary, recent] = await Promise.all([
    getBillingSummary(),
    getRecentPayments(6),
  ]);

  return (
    <>
      <AdminTopbar
        title="Financial Overview"
        subtitle="MRR, ARR, and subscription mix — computed from live billing state"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="MRR"
            value={formatGbpCompact(summary.mrr)}
            hint="active subscriptions × list price"
            accent="neon"
          />
          <MetricCard
            label="ARR"
            value={formatGbpCompact(summary.arr)}
            hint="MRR × 12"
            accent="violet"
          />
          <MetricCard
            label="Active subscribers"
            value={summary.counts.active.toLocaleString()}
            hint="billing status = active"
            accent="cyan"
          />
          <MetricCard
            label="In trial"
            value={summary.counts.trialing.toLocaleString()}
            hint="not yet paying"
            accent="amber"
          />
        </section>

        <section className="grid lg:grid-cols-3 gap-5 mb-8">
          {/* Tier breakdown — real */}
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Subscription mix</h2>
              <span className="text-xs text-fog-500 font-mono">
                {summary.totalAccounts.toLocaleString()} accounts
              </span>
            </div>
            {summary.totalAccounts === 0 ? (
              <p className="text-sm text-fog-500 py-6 text-center">
                No accounts yet — figures populate as parents sign up.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {summary.tiers.map((t) => (
                  <div key={t.tier}>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="font-medium text-fog-100">{TIER_LABEL[t.tier]}</span>
                      <div className="flex items-center gap-4 font-mono text-xs text-fog-400">
                        <span>{t.accounts} accounts</span>
                        <span className="text-fog-200 font-semibold">{formatGbp(t.mrr)}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${t.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Retention & unit economics — not computable yet */}
          <Card variant="glass-strong" padding="lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Retention & economics</h2>
              <IllustrativeBadge />
            </div>
            <div className="flex flex-col gap-4">
              <Row label="Churn (30d)" value="—" />
              <Row label="Trial → paid" value="—" />
              <Row label="LTV : CAC" value="—" />
              <Row label="Revenue churn" value="—" />
            </div>
            <p className="text-[11px] text-fog-500 mt-4 leading-relaxed">
              Needs billing-state history (cancellation timestamps) and an owner
              CAC input — not tracked yet. See docs/METRICS.md.
            </p>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fog-50">Recent payments</h2>
            {!recent.live && <IllustrativeBadge />}
          </div>
          {recent.live && recent.payments.length > 0 ? (
            <Card variant="glass" padding="none" className="overflow-hidden">
              <div className="divide-y divide-white/5">
                {recent.payments.map((p) => (
                  <div
                    key={p.id}
                    className="px-6 py-3 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-4 items-center"
                  >
                    <div className="col-span-2">
                      <span className="text-xs text-fog-500 font-mono">
                        {relativeTime(p.createdMs)}
                      </span>
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-400/30">
                        <CreditCard className="h-3.5 w-3.5 text-violet-300" />
                      </div>
                      <span className="text-sm text-fog-100 truncate">{p.description}</span>
                    </div>
                    <div className="col-span-3 text-right text-sm font-mono font-semibold text-fog-100">
                      {p.currency === "GBP" ? "£" : ""}
                      {p.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      {p.currency !== "GBP" ? ` ${p.currency}` : ""}
                    </div>
                    <div className="col-span-2 text-right">
                      {p.status === "succeeded" ? (
                        <Badge variant="neon" size="sm">Succeeded</Badge>
                      ) : p.status === "pending" ? (
                        <Badge variant="amber" size="sm">Pending</Badge>
                      ) : (
                        <Badge variant="crimson" size="sm">Failed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : recent.live ? (
            <Card variant="glass" padding="lg">
              <p className="text-sm text-fog-500 text-center py-4">
                No payments recorded in Stripe yet.
              </p>
            </Card>
          ) : (
            <IllustrativeNote>
              Live payments are pulled from Stripe. Stripe is not configured for
              this environment (missing <code className="font-mono">STRIPE_SECRET_KEY</code>),
              so no payment feed is shown rather than a fabricated one.
            </IllustrativeNote>
          )}
        </section>

        <p className="mt-8 text-[11px] text-fog-600 leading-relaxed max-w-2xl">
          MRR/ARR are computed from each account&apos;s billing status × the tier
          list price ({formatGbp(TIER_MONTHLY_GBP.standard)}/
          {formatGbp(TIER_MONTHLY_GBP.family)} per month). Per-customer discounts,
          annual plans and proration are not reflected — see docs/METRICS.md.
        </p>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-fog-400">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-fog-300">{value}</span>
    </div>
  );
}
