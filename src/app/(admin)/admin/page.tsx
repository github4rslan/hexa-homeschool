import type { Metadata } from "next";
import {
  AlertOctagon,
  ArrowUpRight,
  Cpu,
  PoundSterling,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin · Overview" };

const AGENT_HEALTH = [
  { name: "Diagnostic", calls: 142, blockRate: 1.2, latency: 1840, status: "nominal" },
  { name: "Teaching", calls: 2_847, blockRate: 3.4, latency: 920, status: "nominal" },
  { name: "Assessment", calls: 481, blockRate: 2.1, latency: 1240, status: "nominal" },
  { name: "Planning", calls: 89, blockRate: 0.0, latency: 4_120, status: "nominal" },
  { name: "Compliance", calls: 23, blockRate: 0.0, latency: 6_300, status: "nominal" },
  { name: "Meta Checker", calls: 184, blockRate: 0.5, latency: 540, status: "nominal" },
];

const RECENT_EVENTS = [
  { time: "12s ago", kind: "checker", text: "Teaching Checker validated explanation · 97% syntax", color: "neon" as const },
  { time: "43s ago", kind: "escalation", text: "Distress vector intercepted · child=t-892 · tutor assigned", color: "crimson" as const },
  { time: "1m ago", kind: "meta", text: "Meta Checker 5% audit · sample passed", color: "violet" as const },
  { time: "2m ago", kind: "compliance", text: "Q2 dossier generated · 12 children · SHA-256 signed", color: "cyan" as const },
  { time: "3m ago", kind: "signup", text: "New parent · Manchester · trial started", color: "neon" as const },
  { time: "5m ago", kind: "lesson", text: "Aisha M. completed quadratic equations · 94% mastery", color: "violet" as const },
  { time: "6m ago", kind: "checker", text: "Assessment Checker · anomalous click pattern flagged · child=k-441", color: "amber" as const },
];

const colorClasses = {
  neon: "bg-neon-400",
  crimson: "bg-crimson-400",
  violet: "bg-violet-400",
  cyan: "bg-cyan-400",
  amber: "bg-amber-400",
};

export default function AdminOverviewPage() {
  return (
    <>
      <AdminTopbar
        title="System Overview"
        subtitle="Real-time view of the HEXA operational stack"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        {/* Top metrics */}
        <section className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Active learners"
              value="1,284"
              delta={{ value: "+47", direction: "up" }}
              hint="this week"
              accent="violet"
              sparkline={[1230, 1238, 1245, 1252, 1261, 1270, 1284]}
            />
            <MetricCard
              label="Open escalations"
              value="7"
              delta={{ value: "−2", direction: "down", positive: true }}
              hint="2 within SLA breach risk"
              accent="crimson"
              sparkline={[12, 11, 10, 9, 9, 8, 7]}
            />
            <MetricCard
              label="MRR"
              value="£113,476"
              delta={{ value: "+8.2%", direction: "up" }}
              hint="vs. last month"
              accent="neon"
              sparkline={[98, 102, 105, 108, 110, 112, 113]}
            />
            <MetricCard
              label="System health"
              value="99.97%"
              delta={{ value: "stable", direction: "up" }}
              hint="30-day uptime"
              accent="cyan"
              sparkline={[99.9, 99.95, 99.97, 99.97, 99.97, 99.97, 99.97]}
            />
          </div>
        </section>

        {/* Two column: Live events + Agent health */}
        <section className="grid lg:grid-cols-5 gap-5 mb-8">
          {/* Live event stream */}
          <Card variant="glass" padding="lg" className="lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-fog-50">
                  Live event stream
                </h2>
                <p className="text-xs text-fog-500 mt-0.5">
                  Auto-refreshing · sampled 1-in-1
                </p>
              </div>
              <Badge variant="violet" size="sm" pulse>
                Streaming
              </Badge>
            </div>
            <ul className="flex flex-col gap-3 font-mono text-xs">
              {RECENT_EVENTS.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${colorClasses[e.color]}`}
                  />
                  <span className="text-fog-500 w-16 shrink-0">{e.time}</span>
                  <span className="font-semibold uppercase text-[10px] text-fog-400 tracking-wider w-20 shrink-0">
                    {e.kind}
                  </span>
                  <span className="text-fog-200 flex-1">{e.text}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Agent health snapshot */}
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-fog-50">Agent health</h2>
              <Link
                href="/admin/agents"
                className="text-xs text-violet-300 hover:text-violet-200 inline-flex items-center gap-1"
              >
                Full telemetry <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="flex flex-col gap-3">
              {AGENT_HEALTH.map((a) => (
                <li
                  key={a.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-400 animate-pulse" />
                  <span className="flex-1 text-sm font-medium text-fog-100">
                    {a.name}
                  </span>
                  <span className="font-mono text-xs text-fog-400 tabular-nums">
                    {a.calls.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs text-fog-500 tabular-nums w-12 text-right">
                    {a.latency}ms
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Bottom quick actions */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            icon={ShieldAlert}
            label="Triage escalations"
            href="/admin/escalations"
            badge="7 open"
            accent="crimson"
          />
          <QuickAction
            icon={Users}
            label="User management"
            href="/admin/users"
            badge="1,284 active"
            accent="violet"
          />
          <QuickAction
            icon={AlertOctagon}
            label="Compliance queue"
            href="/admin/compliance"
            badge="2 DSARs due"
            accent="amber"
          />
          <QuickAction
            icon={PoundSterling}
            label="Financial overview"
            href="/admin/finance"
            badge="£113k MRR"
            accent="neon"
          />
        </section>

        {/* System banner */}
        <section className="mt-8">
          <div className="rounded-2xl border border-neon-400/20 bg-neon-500/5 p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-500/10 border border-neon-400/30">
              <Sparkles className="h-5 w-5 text-neon-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-fog-50">
                All systems nominal
              </h3>
              <p className="text-xs text-fog-400">
                No drift detected · Meta Checker confidence 98.4% · 0 checker
                cascades in last 24h
              </p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-neon-400">
              Status: green
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  badge,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge: string;
  accent: "violet" | "neon" | "cyan" | "amber" | "crimson";
}) {
  const colors = {
    violet: "border-violet-400/30 bg-violet-500/5 text-violet-300",
    neon: "border-neon-400/30 bg-neon-500/5 text-neon-400",
    cyan: "border-cyan-400/30 bg-cyan-500/5 text-cyan-400",
    amber: "border-amber-400/30 bg-amber-500/5 text-amber-400",
    crimson: "border-crimson-400/30 bg-crimson-500/5 text-crimson-400",
  };
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/15 hover:bg-white/[0.04] transition-all flex items-center gap-4"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colors[accent]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-fog-50">{label}</div>
        <div className="text-xs text-fog-500 font-mono">{badge}</div>
      </div>
      <Cpu className="h-4 w-4 text-fog-600 group-hover:text-fog-300 transition-colors" />
    </Link>
  );
}
