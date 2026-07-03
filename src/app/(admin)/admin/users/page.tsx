import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, Users as UsersIcon } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBillingSummary } from "@/lib/metrics/server";
import { adminSearchParents } from "@/lib/db/repo";
import type { BillingStatus, SubscriptionTier } from "@/lib/metrics/finance";

export const metadata: Metadata = { title: "Admin · Users" };
export const dynamic = "force-dynamic";

const tierBadge: Record<SubscriptionTier, { label: string; variant: "outline" | "cyan" | "violet" }> = {
  diagnostic: { label: "Diagnostic", variant: "outline" },
  standard: { label: "Standard", variant: "cyan" },
  family: { label: "Family", variant: "violet" },
};
const statusBadge: Record<BillingStatus, { label: string; variant: "violet" | "neon" | "amber" | "crimson" | "default" }> = {
  trialing: { label: "Trialing", variant: "violet" },
  active: { label: "Active", variant: "neon" },
  past_due: { label: "Past due", variant: "amber" },
  canceled: { label: "Canceled", variant: "crimson" },
  paused: { label: "Paused", variant: "default" },
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tier?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [summary, result] = await Promise.all([
    getBillingSummary(),
    adminSearchParents({
      query: sp.q,
      status: (sp.status as BillingStatus | "all") || "all",
      tier: (sp.tier as SubscriptionTier | "all") || "all",
      page,
      pageSize: 20,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const buildHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.status && sp.status !== "all") params.set("status", sp.status);
    if (sp.tier && sp.tier !== "all") params.set("tier", sp.tier);
    params.set("page", String(nextPage));
    return `/admin/users?${params.toString()}`;
  };

  return (
    <>
      <AdminTopbar
        title="Parents & Children"
        subtitle="Full account control — audited, admin-only"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MetricCard label="Total accounts" value={summary.totalAccounts.toLocaleString()} hint="all parents" accent="violet" />
          <MetricCard label="Active subscribers" value={summary.counts.active.toLocaleString()} hint="billing = active" accent="neon" />
          <MetricCard label="In trial" value={summary.counts.trialing.toLocaleString()} hint="14-day free trial" accent="cyan" />
          <MetricCard label="Past due" value={summary.counts.past_due.toLocaleString()} hint="needs dunning" accent="amber" />
        </section>

        <Card variant="glass" padding="none" className="overflow-hidden">
          {/* Server-side search / filter — plain GET form, resets to page 1. */}
          <form className="px-4 sm:px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fog-500" />
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Search name or email…"
                className="w-full h-11 rounded-lg bg-white/[0.03] border border-white/10 pl-10 pr-4 text-sm text-fog-50 placeholder:text-fog-500 focus:outline-none focus:border-violet-400/60"
              />
            </div>
            <select name="status" defaultValue={sp.status ?? "all"} className="h-11 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 focus:outline-none focus:border-violet-400/60">
              <option value="all">All statuses</option>
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
              <option value="paused">Paused</option>
            </select>
            <select name="tier" defaultValue={sp.tier ?? "all"} className="h-11 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 focus:outline-none focus:border-violet-400/60">
              <option value="all">All tiers</option>
              <option value="diagnostic">Diagnostic</option>
              <option value="standard">Standard</option>
              <option value="family">Family</option>
            </select>
            <button type="submit" className="h-11 rounded-lg bg-violet-500/20 border border-violet-400/30 px-4 text-sm font-medium text-fog-50 hover:bg-violet-500/30">
              Apply
            </button>
          </form>

          {result.rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-fog-500">
              No accounts match your filters.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {result.rows.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/users/${p.id}`}
                    className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-sm font-semibold shrink-0">
                      {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-fog-50 truncate">{p.name}</div>
                      <div className="text-xs text-fog-500 font-mono truncate">{p.email}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={tierBadge[p.tier].variant} size="sm">{tierBadge[p.tier].label}</Badge>
                        <Badge variant={statusBadge[p.status].variant} size="sm">{statusBadge[p.status].label}</Badge>
                        {p.suspended && <Badge variant="crimson" size="sm">Suspended</Badge>}
                        {p.manualOverride && <Badge variant="amber" size="sm">Manual plan</Badge>}
                        {!p.verified && <Badge variant="outline" size="sm">Unverified</Badge>}
                        <span className="inline-flex items-center gap-1 text-xs text-fog-500">
                          <UsersIcon className="h-3.5 w-3.5" />
                          {p.childCount}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-fog-600 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 sm:px-6 py-3 border-t border-white/5 flex items-center justify-between gap-3 text-xs text-fog-500">
            <span>
              Page {result.page} of {totalPages} · {result.total} total
            </span>
            <div className="flex gap-2">
              {result.page > 1 && (
                <Link href={buildHref(result.page - 1)} className="h-9 inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 hover:bg-white/[0.06]">
                  Previous
                </Link>
              )}
              {result.page < totalPages && (
                <Link href={buildHref(result.page + 1)} className="h-9 inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 hover:bg-white/[0.06]">
                  Next
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
