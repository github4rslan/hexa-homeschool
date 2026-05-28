import type { Metadata } from "next";
import { FlaskConical, Play, Plus } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin · Experiments" };

const EXPERIMENTS = [
  {
    name: "Teaching Agent · explanation tone",
    hypothesis: "Casual tone improves comprehension for ages 10-12",
    status: "running",
    variants: [
      { key: "control", weight: 50, conversions: 412, exposures: 2_140 },
      { key: "casual_tone", weight: 50, conversions: 487, exposures: 2_180 },
    ],
    metric: "lesson_mastery_pass",
    days: 12,
    significance: 0.92,
  },
  {
    name: "Pricing page · Family tier highlight",
    hypothesis: "Highlighting Family tier increases multi-child conversion",
    status: "running",
    variants: [
      { key: "control", weight: 50, conversions: 38, exposures: 1_204 },
      { key: "family_highlighted", weight: 50, conversions: 52, exposures: 1_198 },
    ],
    metric: "trial_signup",
    days: 7,
    significance: 0.78,
  },
  {
    name: "Onboarding · diagnostic order",
    hypothesis: "Maths first reduces drop-off vs. English first",
    status: "completed",
    variants: [
      { key: "english_first", weight: 50, conversions: 287, exposures: 480 },
      { key: "maths_first", weight: 50, conversions: 324, exposures: 478 },
    ],
    metric: "diagnostic_complete",
    days: 21,
    significance: 0.97,
    winner: "maths_first",
  },
];

const statusBadge = {
  draft: { label: "Draft", variant: "default" as const },
  running: { label: "Running", variant: "violet" as const },
  paused: { label: "Paused", variant: "amber" as const },
  completed: { label: "Completed", variant: "neon" as const },
};

export default function ExperimentsPage() {
  return (
    <>
      <AdminTopbar
        title="A/B Experiments"
        subtitle="Live tests and hypotheses across the platform"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Running" value="2" accent="violet" />
          <MetricCard label="Completed (30d)" value="4" accent="neon" />
          <MetricCard label="Avg lift" value="+12.3%" accent="cyan" />
          <MetricCard label="Currently flagged" value="78%" hint="of traffic in some test" accent="amber" />
        </section>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-fog-50">All experiments</h2>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            New experiment
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {EXPERIMENTS.map((e, i) => {
            const totalExp = e.variants.reduce((s, v) => s + v.exposures, 0);
            const status = statusBadge[e.status as keyof typeof statusBadge];
            return (
              <Card key={i} variant="glass" padding="lg">
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-400/30">
                      <FlaskConical className="h-4 w-4 text-violet-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-fog-50">{e.name}</h3>
                      <p className="text-xs text-fog-400 mt-1">{e.hypothesis}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} size="sm" pulse={e.status === "running"}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-3">
                    {e.variants.map((v) => {
                      const rate = v.exposures > 0 ? (v.conversions / v.exposures) * 100 : 0;
                      const isWinner = e.winner === v.key;
                      return (
                        <div key={v.key} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-fog-300">{v.key}</span>
                              {isWinner && <Badge variant="neon" size="sm">Winner</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono">
                              <span className="text-fog-500">{v.exposures.toLocaleString()} exposures</span>
                              <span className="text-fog-100 font-semibold tabular-nums">{rate.toFixed(2)}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isWinner ? "bg-gradient-to-r from-neon-500 to-cyan-500" : "bg-gradient-to-r from-violet-500 to-cyan-500"}`}
                              style={{ width: `${(v.exposures / totalExp) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <Stat label="Primary metric" value={e.metric} mono />
                    <Stat label="Days running" value={`${e.days}d`} />
                    <Stat label="Significance" value={`${(e.significance * 100).toFixed(1)}%`} accent={e.significance > 0.95 ? "neon" : "amber"} />
                    {e.status === "running" && (
                      <Button variant="secondary" size="sm" className="w-full mt-2">
                        <Play className="h-3 w-3" />
                        Analyse
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "neon" | "amber";
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-fog-500">{label}</span>
      <span
        className={`${mono ? "font-mono" : ""} font-semibold ${
          accent === "neon" ? "text-neon-400" : accent === "amber" ? "text-amber-400" : "text-fog-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
