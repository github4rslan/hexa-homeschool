import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { getAdminParents, getBillingSummary } from "@/lib/metrics/server";
import { UsersTable } from "./users-client";

export const metadata: Metadata = { title: "Admin · Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [summary, parents] = await Promise.all([
    getBillingSummary(),
    getAdminParents(200),
  ]);

  return (
    <>
      <AdminTopbar
        title="Parents & Children"
        subtitle="All Edway accounts with subscription state"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total accounts"
            value={summary.totalAccounts.toLocaleString()}
            hint="all parents"
            accent="violet"
          />
          <MetricCard
            label="Active subscribers"
            value={summary.counts.active.toLocaleString()}
            hint="billing = active"
            accent="neon"
          />
          <MetricCard
            label="In trial"
            value={summary.counts.trialing.toLocaleString()}
            hint="14-day free trial"
            accent="cyan"
          />
          <MetricCard
            label="Past due"
            value={summary.counts.past_due.toLocaleString()}
            hint="needs dunning"
            accent="amber"
          />
        </section>

        <UsersTable parents={parents} />
      </div>
    </>
  );
}
