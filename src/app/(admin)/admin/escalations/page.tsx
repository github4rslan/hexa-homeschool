import type { Metadata } from "next";
import { ShieldAlert, Activity } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminOpenEscalations } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Admin · Escalations" };
export const dynamic = "force-dynamic";

const severityVariant: Record<
  string,
  "crimson" | "amber" | "violet" | "neon" | "cyan"
> = {
  immediate: "crimson",
  critical: "crimson",
  high: "amber",
  medium: "violet",
  low: "cyan",
};

function relativeTime(d: Date): string {
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}

export default async function EscalationsPage() {
  const escalations = await adminOpenEscalations(50);
  const immediate = escalations.filter(
    (e) => e.severity === "immediate" || e.severity === "critical",
  ).length;

  return (
    <>
      <AdminTopbar
        title="Safety Net · Escalations"
        subtitle="Real distress escalations logged by the safety system"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            label="Open escalations"
            value={escalations.length.toString()}
            accent="crimson"
            hint="awaiting review"
          />
          <MetricCard
            label="High severity"
            value={immediate.toString()}
            accent="amber"
            hint="immediate or critical"
          />
          <MetricCard
            label="Source"
            value="Live"
            accent="neon"
            hint="from the safety matcher"
          />
        </section>

        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-fog-50">Open queue</h2>
            <p className="text-xs text-fog-500 mt-0.5">
              Triggered when a child&apos;s text matches a distress pattern. The
              session is frozen and the parent is alerted.
            </p>
          </div>

          {escalations.length > 0 ? (
            <div className="divide-y divide-white/5">
              {escalations.map((e) => (
                <div
                  key={e._id?.toHexString()}
                  className="px-6 py-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-crimson-400/30 bg-crimson-500/10 text-crimson-400">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fog-50">
                        {e.trigger}
                      </span>
                      <Badge variant={severityVariant[e.severity] ?? "violet"} size="sm">
                        {e.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-fog-400 mt-1">
                      Matched: &ldquo;{e.matched_text}&rdquo;
                    </div>
                  </div>
                  <span className="text-xs text-fog-500 whitespace-nowrap">
                    {relativeTime(e.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neon-500/10 border border-neon-400/30">
                <Activity className="h-5 w-5 text-neon-400" />
              </div>
              <h3 className="text-base font-semibold text-fog-50">All clear</h3>
              <p className="text-sm text-fog-500 mt-1">
                No open escalations. New distress events will appear here in real time.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
