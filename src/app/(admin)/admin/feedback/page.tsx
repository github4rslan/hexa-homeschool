import type { Metadata } from "next";
import Link from "next/link";
import { Star, MessageSquareHeart } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { recentFeedback, feedbackStats } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Admin · Parent feedback" };
export const dynamic = "force-dynamic";

const TRIGGER_LABEL: Record<string, string> = {
  first_week: "First week",
  mastery: "Mastery",
  manual: "Manual",
};

function relativeDate(d: Date): string {
  const diffDay = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDay <= 0) return "Today";
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toISOString().slice(0, 10);
}

/** Server-rendered star row (read-only). Amber = earned, faint = remainder. */
function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= n ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 text-fog-700"
          }
        />
      ))}
    </span>
  );
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const lowOnly = sp.filter === "low";

  const [stats, rows] = await Promise.all([
    feedbackStats(),
    recentFeedback(100, lowOnly ? { maxStars: 3 } : undefined),
  ]);

  // Weekly trend → a sparkline of averages (null weeks fall back to the overall
  // mean so the line stays continuous without inventing data points).
  const fallback = stats.average ?? 0;
  const trendPoints = stats.weeklyTrend.map((w) => w.average ?? fallback);
  const thisWeekAvg = stats.weeklyTrend[stats.weeklyTrend.length - 1]?.average ?? null;

  return (
    <>
      <AdminTopbar
        title="Parent sentiment"
        subtitle="Voluntary star ratings + comments from parents (real data)"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Average rating"
            value={stats.average !== null ? `${stats.average.toFixed(1)}★` : "—"}
            accent="amber"
            hint={stats.total ? "across all responses" : "no responses yet"}
            sparkline={stats.total ? trendPoints : undefined}
          />
          <MetricCard
            label="Total responses"
            value={stats.total.toLocaleString()}
            accent="violet"
            hint="all-time"
          />
          <MetricCard
            label="This week"
            value={thisWeekAvg !== null ? `${thisWeekAvg.toFixed(1)}★` : "—"}
            accent="cyan"
            hint="weekly average"
          />
          <MetricCard
            label="Needs attention"
            value={stats.lowCount.toLocaleString()}
            accent="crimson"
            hint="≤ 3★ — outreach opportunity"
          />
        </section>

        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-fog-50">Recent feedback</h2>
              <p className="mt-0.5 text-xs text-fog-500">
                {lowOnly
                  ? "Showing ratings of 3★ or below — a low rating is a follow-up opportunity."
                  : "Newest first. Contact details are shown for staff follow-up only."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/feedback"
                className={
                  !lowOnly
                    ? "rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-fog-50"
                    : "rounded-lg border border-white/5 px-3 py-1.5 text-xs text-fog-400 hover:bg-white/5"
                }
              >
                All
              </Link>
              <Link
                href="/admin/feedback?filter=low"
                className={
                  lowOnly
                    ? "rounded-lg border border-crimson-400/30 bg-crimson-500/10 px-3 py-1.5 text-xs font-medium text-crimson-200"
                    : "rounded-lg border border-white/5 px-3 py-1.5 text-xs text-fog-400 hover:bg-white/5"
                }
              >
                ≤ 3★
              </Link>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    {["Rating", "Comment", "Trigger", "Parent", "When"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-[0.15em] text-fog-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 align-top">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Stars n={r.stars} />
                      </td>
                      <td className="px-4 py-3 text-sm text-fog-200 max-w-md">
                        {/* XSS-safe: React escapes; never dangerouslySetInnerHTML. */}
                        {r.comment ? (
                          <span className="whitespace-pre-wrap break-words">{r.comment}</span>
                        ) : (
                          <span className="text-fog-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-fog-300">
                          {TRIGGER_LABEL[r.trigger] ?? r.trigger}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/admin/users/${r.parentId}`}
                          className="font-medium text-fog-100 hover:text-violet-300"
                        >
                          {r.parentName ?? "—"}
                        </Link>
                        <div className="text-xs text-fog-500">{r.parentEmail}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-fog-400">
                        {relativeDate(r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/10">
                <MessageSquareHeart className="h-5 w-5 text-violet-300" />
              </div>
              <h3 className="text-base font-semibold text-fog-50">
                {lowOnly ? "No low ratings" : "No feedback yet"}
              </h3>
              <p className="mt-1 text-sm text-fog-500">
                {lowOnly
                  ? "Nothing at 3★ or below — nice."
                  : "Parent ratings will appear here as they come in."}
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
