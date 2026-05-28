import type { Metadata } from "next";
import { Cpu, Zap, ShieldCheck, AlertTriangle } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Agent Telemetry" };

const AGENTS = [
  { name: "Diagnostic", color: "cyan", calls24h: 142, blockRate: 1.2, avgLatency: 1840, p99: 3120, cost: 4.21, tokens: 2_481_000 },
  { name: "Teaching", color: "violet", calls24h: 2_847, blockRate: 3.4, avgLatency: 920, p99: 1840, cost: 81.42, tokens: 48_220_000 },
  { name: "Assessment", color: "neon", calls24h: 481, blockRate: 2.1, avgLatency: 1240, p99: 2680, cost: 12.81, tokens: 7_650_000 },
  { name: "Planning", color: "amber", calls24h: 89, blockRate: 0.0, avgLatency: 4120, p99: 7240, cost: 8.40, tokens: 4_120_000 },
  { name: "Compliance", color: "crimson", calls24h: 23, blockRate: 0.0, avgLatency: 6300, p99: 9180, cost: 4.18, tokens: 2_080_000 },
  { name: "Meta Checker", color: "violet", calls24h: 184, blockRate: 0.5, avgLatency: 540, p99: 920, cost: 1.84, tokens: 920_000 },
];

const colorMap = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-400/30", text: "text-cyan-400" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-400/30", text: "text-violet-300" },
  neon: { bg: "bg-neon-500/10", border: "border-neon-400/30", text: "text-neon-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-400/30", text: "text-amber-400" },
  crimson: { bg: "bg-crimson-500/10", border: "border-crimson-400/30", text: "text-crimson-400" },
};

const CHECKER_EVENTS = [
  { time: "1m ago", agent: "Teaching", reason: "Explanation syntax below 95% threshold", severity: "block" },
  { time: "4m ago", agent: "Assessment", reason: "Anomalous click pattern detected", severity: "warn" },
  { time: "12m ago", agent: "Teaching", reason: "Factual deviation from curriculum record", severity: "block" },
  { time: "18m ago", agent: "Diagnostic", reason: "Context mismatch on item selection", severity: "block" },
  { time: "23m ago", agent: "Meta Checker", reason: "Semantic drift sample · within tolerance", severity: "info" },
];

export default function AgentsAdminPage() {
  const totalCalls = AGENTS.reduce((sum, a) => sum + a.calls24h, 0);
  const totalCost = AGENTS.reduce((sum, a) => sum + a.cost, 0);
  const avgBlockRate = AGENTS.reduce((sum, a) => sum + a.blockRate, 0) / AGENTS.length;

  return (
    <>
      <AdminTopbar
        title="Agent Telemetry"
        subtitle="Per-agent metrics, checker block rates, Meta Checker activity"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total invocations · 24h"
            value={totalCalls.toLocaleString()}
            accent="violet"
            sparkline={[3100, 3250, 3400, 3520, 3680, 3720, 3766]}
          />
          <MetricCard
            label="API cost · 24h"
            value={`£${totalCost.toFixed(2)}`}
            delta={{ value: "+£2.40", direction: "up", positive: false }}
            accent="amber"
          />
          <MetricCard
            label="Avg checker block rate"
            value={`${avgBlockRate.toFixed(2)}%`}
            hint="acceptable < 5%"
            accent="neon"
          />
          <MetricCard
            label="Meta Checker confidence"
            value="98.4%"
            hint="rolling 5% audit"
            accent="cyan"
          />
        </section>

        {/* Per-agent grid */}
        <section className="grid lg:grid-cols-3 gap-4 mb-8">
          {AGENTS.map((a) => {
            const c = colorMap[a.color as keyof typeof colorMap];
            return (
              <Card key={a.name} variant="glass" padding="lg" className="relative overflow-hidden">
                <div className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl opacity-30 ${c.bg}`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${c.bg} ${c.border}`}>
                        <Cpu className={`h-4 w-4 ${c.text}`} />
                      </div>
                      <h3 className="text-base font-semibold text-fog-50">{a.name}</h3>
                    </div>
                    <Badge variant="neon" size="sm" pulse>
                      Live
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Stat label="Calls 24h" value={a.calls24h.toLocaleString()} />
                    <Stat label="Block rate" value={`${a.blockRate}%`} accent={a.blockRate > 5 ? "amber" : undefined} />
                    <Stat label="Avg latency" value={`${a.avgLatency}ms`} />
                    <Stat label="P99 latency" value={`${a.p99}ms`} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-fog-500 pt-3 border-t border-white/5">
                    <span>{(a.tokens / 1_000_000).toFixed(1)}M tokens</span>
                    <span>£{a.cost.toFixed(2)} · 24h</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        {/* Two column: checker events + meta checker activity */}
        <section className="grid lg:grid-cols-2 gap-5">
          <Card variant="glass" padding="lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">
                Recent checker events
              </h2>
              <ShieldCheck className="h-4 w-4 text-amber-400" />
            </div>
            <ul className="flex flex-col gap-3 font-mono text-xs">
              {CHECKER_EVENTS.map((e, i) => (
                <li key={i} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                    e.severity === "block" ? "bg-crimson-400" :
                    e.severity === "warn" ? "bg-amber-400" : "bg-cyan-400"
                  }`} />
                  <span className="text-fog-500 w-16 shrink-0">{e.time}</span>
                  <span className="text-violet-300 font-semibold w-24 shrink-0">{e.agent}</span>
                  <span className="text-fog-300 flex-1">{e.reason}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="glass-strong" padding="lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Meta Checker</h2>
              <Zap className="h-4 w-4 text-violet-300" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-fog-400">Audit sampling</span>
                  <span className="text-sm font-mono text-fog-100">5.0% of all transactions</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[5%] bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-fog-400">Confidence rolling</span>
                  <span className="text-sm font-mono text-neon-400">98.4%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[98.4%] bg-gradient-to-r from-neon-500 to-cyan-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-fog-400">Drift threshold</span>
                  <span className="text-sm font-mono text-amber-400">below 1.6%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full w-[1.6%] bg-gradient-to-r from-amber-500 to-crimson-500 rounded-full" />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-3 text-xs text-fog-400">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>No drift alerts in last 24h · last review 9h ago</span>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber";
}) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-fog-500 mb-1">
        {label}
      </div>
      <div
        className={`text-lg font-semibold font-mono tabular-nums ${
          accent === "amber" ? "text-amber-400" : "text-fog-50"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
