import type { Metadata } from "next";
import { MailWarning } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { reengagementStats } from "@/lib/db/repo";
import { REACTIVATION_WINDOW_DAYS } from "@/lib/engine/reengagement";

export const metadata: Metadata = { title: "Admin · Re-engagement" };
export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<number, string> = {
  1: "Gentle (day 3)",
  2: "Value (day 10)",
  3: "Win-back (day 21+)",
};

const TRACK_LABEL: Record<string, string> = {
  upsell: "Upsell",
  reengage: "Re-engage",
};

function pct(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

function relativeDate(d: Date): string {
  const diffDay = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDay <= 0) return "Today";
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toISOString().slice(0, 10);
}

export default async function AdminReengagementPage() {
  const stats = await reengagementStats();

  return (
    <>
      <AdminTopbar
        title="Lifecycle re-engagement"
        subtitle="Win-back + upsell email performance (real data)"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Emails sent"
            value={stats.totalSent.toLocaleString()}
            accent="violet"
            hint={
              stats.distinctParents
                ? `to ${stats.distinctParents.toLocaleString()} parents`
                : "no sends yet"
            }
          />
          <MetricCard
            label="Re-activation rate"
            value={pct(stats.reactivationRate)}
            accent="neon"
            hint={`came back within ${REACTIVATION_WINDOW_DAYS}d of a send`}
          />
          <MetricCard
            label="Unsubscribe rate"
            value={pct(stats.unsubscribeRate)}
            accent="crimson"
            hint={
              stats.distinctParents
                ? `${stats.optedOutParents} of ${stats.distinctParents} opted out`
                : "watch this — high = too aggressive"
            }
          />
          <MetricCard
            label="Upsell vs re-engage"
            value={`${stats.byTrack.upsell} / ${stats.byTrack.reengage}`}
            accent="amber"
            hint="free win-back / paid check-in"
          />
        </section>

        <section className="grid lg:grid-cols-5 gap-5 mb-8">
          {/* Per-stage breakdown */}
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-fog-50 mb-5">
              Sends by stage
            </h2>
            <ul className="flex flex-col gap-3">
              {stats.byStage.map((s) => {
                const rate = s.sent > 0 ? s.reactivated / s.sent : null;
                return (
                  <li
                    key={s.stage}
                    className="flex items-center justify-between gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-fog-100">
                        {STAGE_LABEL[s.stage]}
                      </div>
                      <div className="text-xs text-fog-500">
                        {s.reactivated.toLocaleString()} re-activated ·{" "}
                        {pct(rate)}
                      </div>
                    </div>
                    <span className="font-mono text-lg font-semibold text-fog-50 tabular-nums shrink-0">
                      {s.sent.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Recent sends */}
          <Card variant="glass" padding="none" className="lg:col-span-3 overflow-hidden">
            <div className="border-b border-white/5 px-6 py-4">
              <h2 className="text-lg font-semibold text-fog-50">Recent sends</h2>
              <p className="mt-0.5 text-xs text-fog-500">
                Newest first. No parent contact details or child data shown.
              </p>
            </div>
            {stats.recent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      {["Stage", "Track", "Tier", "Re-activated", "When"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.15em] text-fog-500"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-4 py-3 text-sm text-fog-200 whitespace-nowrap">
                          {STAGE_LABEL[r.stage]}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-fog-300">
                            {TRACK_LABEL[r.track] ?? r.track}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-fog-400 whitespace-nowrap capitalize">
                          {r.tier}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.reactivated ? (
                            <span className="text-xs font-semibold text-neon-400">
                              ✓ Yes
                            </span>
                          ) : (
                            <span className="text-xs text-fog-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-fog-400">
                          {relativeDate(r.sentAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10">
                  <MailWarning className="h-5 w-5 text-violet-300" />
                </div>
                <h3 className="text-base font-semibold text-fog-50">
                  No re-engagement emails sent yet
                </h3>
                <p className="mt-1 text-sm text-fog-500">
                  Sends appear here once the daily cron finds idle parents past
                  the day-3 threshold.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section>
          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/5 p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
              <MailWarning className="h-5 w-5 text-violet-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-fog-50">
                All figures are live from real sends
              </h3>
              <p className="text-xs text-fog-400">
                Re-activation credits a send when a parent&rsquo;s activity
                advanced within {REACTIVATION_WINDOW_DAYS} days of it. Watch the
                unsubscribe rate — a rising number means the cadence is too
                aggressive. No child is ever emailed or profiled.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
