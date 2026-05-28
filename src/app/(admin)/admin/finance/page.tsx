import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Finance" };

const TIER_BREAKDOWN = [
  { tier: "Diagnostic", count: 142, mrr: 0, percent: 11 },
  { tier: "Standard", count: 687, mrr: 61_143, percent: 53 },
  { tier: "Family", count: 298, mrr: 44_402, percent: 23 },
  { tier: "Trial", count: 157, mrr: 0, percent: 13 },
];

const RECENT_PAYMENTS = [
  { time: "2m ago", parent: "Priya M.", amount: 149, type: "subscription", status: "success" },
  { time: "8m ago", parent: "James K.", amount: 89, type: "subscription", status: "success" },
  { time: "21m ago", parent: "Olivia R.", amount: 89, type: "first charge", status: "success" },
  { time: "34m ago", parent: "David L.", amount: 89, type: "retry", status: "failed" },
  { time: "1h ago", parent: "Sarah T.", amount: 149, type: "subscription", status: "success" },
  { time: "2h ago", parent: "Aisha N.", amount: 149, type: "subscription", status: "success" },
];

export default function FinancePage() {
  return (
    <>
      <AdminTopbar
        title="Financial Overview"
        subtitle="MRR, ARR, churn, and Stripe webhook health"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="MRR"
            value="£113,476"
            delta={{ value: "+8.2%", direction: "up" }}
            hint="vs. last month"
            accent="neon"
            sparkline={[98_000, 102_000, 105_000, 108_000, 110_000, 112_000, 113_476]}
          />
          <MetricCard
            label="ARR"
            value="£1.36M"
            delta={{ value: "+£104k", direction: "up" }}
            hint="annualised"
            accent="violet"
          />
          <MetricCard
            label="Churn (30d)"
            value="2.1%"
            delta={{ value: "−0.4pp", direction: "down", positive: true }}
            accent="cyan"
          />
          <MetricCard
            label="LTV : CAC"
            value="4.8 : 1"
            hint="healthy > 3:1"
            accent="amber"
          />
        </section>

        <section className="grid lg:grid-cols-3 gap-5 mb-8">
          {/* Tier breakdown */}
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Subscription mix</h2>
              <span className="text-xs text-fog-500 font-mono">1,284 total</span>
            </div>
            <div className="flex flex-col gap-4">
              {TIER_BREAKDOWN.map((t) => (
                <div key={t.tier}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-medium text-fog-100">{t.tier}</span>
                    <div className="flex items-center gap-4 font-mono text-xs text-fog-400">
                      <span>{t.count} accounts</span>
                      <span className="text-fog-200 font-semibold">£{t.mrr.toLocaleString()}</span>
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
          </Card>

          {/* Stripe health */}
          <Card variant="glass-strong" padding="lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Stripe health</h2>
              <Badge variant="neon" size="sm" pulse>
                Healthy
              </Badge>
            </div>
            <div className="flex flex-col gap-4">
              <Row label="Webhook success" value="100%" color="neon" />
              <Row label="Failed payments (24h)" value="3" color="amber" />
              <Row label="Refunds (30d)" value="£238" color="fog" />
              <Row label="Disputes open" value="0" color="neon" />
              <Row label="Connect ready" value="—" color="fog" />
            </div>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fog-50">Recent payments</h2>
          </div>
          <Card variant="glass" padding="none" className="overflow-hidden">
            <div className="divide-y divide-white/5">
              {RECENT_PAYMENTS.map((p, i) => (
                <div
                  key={i}
                  className="px-6 py-3 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-2">
                    <span className="text-xs text-fog-500 font-mono">{p.time}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-400/30">
                      <CreditCard className="h-3.5 w-3.5 text-violet-300" />
                    </div>
                    <span className="text-sm text-fog-100">{p.parent}</span>
                  </div>
                  <div className="col-span-3">
                    <Badge variant="outline" size="sm">{p.type}</Badge>
                  </div>
                  <div className="col-span-2 text-right text-sm font-mono font-semibold text-fog-100">
                    £{p.amount}
                  </div>
                  <div className="col-span-2 text-right">
                    {p.status === "success" ? (
                      <Badge variant="neon" size="sm">Success</Badge>
                    ) : (
                      <Badge variant="crimson" size="sm">Failed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "neon" | "amber" | "fog";
}) {
  const colorClass = {
    neon: "text-neon-400",
    amber: "text-amber-400",
    fog: "text-fog-200",
  }[color];
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-fog-400">{label}</span>
      <span className={`font-mono font-semibold tabular-nums ${colorClass}`}>{value}</span>
    </div>
  );
}
