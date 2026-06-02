import type { Metadata } from "next";
import { Cpu, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAgentTelemetry } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Admin · Agent Telemetry" };
export const dynamic = "force-dynamic";

// Cost estimate for the model in use (gpt-4o-mini). Blended £/1M tokens — a
// rough planning figure, clearly labelled as an estimate (we don't store the
// prompt/completion split, so we can't bill to the penny).
const EST_GBP_PER_MILLION_TOKENS = 0.4;

// Stable colours per known agent; anything else falls back to violet.
const colorMap: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  Teaching: { bg: "bg-violet-500/10", border: "border-violet-400/30", text: "text-violet-300" },
  "Meta Checker": { bg: "bg-cyan-500/10", border: "border-cyan-400/30", text: "text-cyan-400" },
  Diagnostic: { bg: "bg-neon-500/10", border: "border-neon-400/30", text: "text-neon-400" },
  Assessment: { bg: "bg-amber-500/10", border: "border-amber-400/30", text: "text-amber-400" },
  Planning: { bg: "bg-amber-500/10", border: "border-amber-400/30", text: "text-amber-400" },
  Compliance: { bg: "bg-crimson-500/10", border: "border-crimson-400/30", text: "text-crimson-400" },
};

function relativeTime(d: Date): string {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function AgentsAdminPage() {
  const t = await getAgentTelemetry(24);
  const estCost = (t.totalTokens / 1_000_000) * EST_GBP_PER_MILLION_TOKENS;
  const hasData = t.totalCalls > 0;

  return (
    <>
      <AdminTopbar
        title="Agent Telemetry"
        subtitle="Real per-agent metrics from logged invocations · last 24h"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total invocations · 24h"
            value={t.totalCalls.toLocaleString()}
            accent="violet"
          />
          <MetricCard
            label="Est. API cost · 24h"
            value={`£${estCost.toFixed(2)}`}
            hint="estimate · gpt-4o-mini"
            accent="amber"
          />
          <MetricCard
            label="Checker block rate"
            value={`${t.avgBlockRate.toFixed(1)}%`}
            hint="acceptable < 5%"
            accent="neon"
          />
          <MetricCard
            label="Tokens · 24h"
            value={
              t.totalTokens >= 1_000_000
                ? `${(t.totalTokens / 1_000_000).toFixed(2)}M`
                : t.totalTokens.toLocaleString()
            }
            accent="cyan"
          />
        </section>

        {!hasData ? (
          <Card variant="glass-strong" padding="xl" className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
              <Activity className="h-5 w-5 text-fog-400" />
            </div>
            <h2 className="text-lg font-semibold text-fog-50 mb-2">
              No agent activity in the last 24 hours
            </h2>
            <p className="text-sm text-fog-400 max-w-md mx-auto">
              Metrics here are recorded from real invocations of the Teaching
              Agent and Meta Checker (via the tutor endpoint). Once a lesson runs
              an explanation, genuine counts, latency, block rate and token usage
              will appear automatically — nothing on this page is simulated.
            </p>
          </Card>
        ) : (
          <>
            {/* Per-agent grid (real data) */}
            <section className="grid lg:grid-cols-3 gap-4 mb-8">
              {t.agents.map((a) => {
                const c = colorMap[a.agent] ?? colorMap.Teaching;
                return (
                  <Card
                    key={a.agent}
                    variant="glass"
                    padding="lg"
                    className="relative overflow-hidden"
                  >
                    <div
                      className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl opacity-30 ${c.bg}`}
                    />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg border ${c.bg} ${c.border}`}
                          >
                            <Cpu className={`h-4 w-4 ${c.text}`} />
                          </div>
                          <h3 className="text-base font-semibold text-fog-50">
                            {a.agent}
                          </h3>
                        </div>
                        <Badge variant="neon" size="sm">
                          Live
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <Stat label="Calls 24h" value={a.calls.toLocaleString()} />
                        <Stat
                          label="Block rate"
                          value={`${a.blockRate.toFixed(1)}%`}
                          accent={a.blockRate > 5 ? "amber" : undefined}
                        />
                        <Stat label="Avg latency" value={`${a.avgLatency}ms`} />
                        <Stat label="Blocked" value={a.blocked.toLocaleString()} />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-fog-500 pt-3 border-t border-white/5">
                        <span>
                          {a.tokens >= 1_000_000
                            ? `${(a.tokens / 1_000_000).toFixed(2)}M tokens`
                            : `${a.tokens.toLocaleString()} tokens`}
                        </span>
                        <span>
                          ~£
                          {(
                            (a.tokens / 1_000_000) *
                            EST_GBP_PER_MILLION_TOKENS
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </section>

            {/* Recent checker blocks (real) */}
            <section className="grid lg:grid-cols-2 gap-5">
              <Card variant="glass" padding="lg">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-fog-50">
                    Recent checker blocks
                  </h2>
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                </div>
                {t.recentBlocks.length === 0 ? (
                  <p className="text-sm text-fog-400 py-4">
                    No blocked outputs in the last 24 hours — every explanation
                    served passed the 95% confidence checker.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3 font-mono text-xs">
                    {t.recentBlocks.map((e, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0 bg-crimson-400" />
                        <span className="text-fog-500 w-16 shrink-0">
                          {relativeTime(e.created_at)}
                        </span>
                        <span className="text-violet-300 font-semibold w-24 shrink-0">
                          {e.agent}
                        </span>
                        <span className="text-fog-300 flex-1">{e.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card variant="glass-strong" padding="lg">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-fog-50">
                    Safety gate
                  </h2>
                  <ShieldCheck className="h-4 w-4 text-violet-300" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-fog-400">
                        Confidence threshold
                      </span>
                      <span className="text-sm font-mono text-fog-100">
                        95% (brief)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full w-[95%] bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-fog-400">
                        Observed block rate · 24h
                      </span>
                      <span className="text-sm font-mono text-neon-400">
                        {t.avgBlockRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-500 to-cyan-500 rounded-full"
                        style={{
                          width: `${Math.min(100, t.avgBlockRate)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center gap-3 text-xs text-fog-400">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      Every explanation is validated by the Meta Checker before it
                      reaches a child; rejected output is replaced with
                      human-authored content.
                    </span>
                  </div>
                </div>
              </Card>
            </section>
          </>
        )}
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
