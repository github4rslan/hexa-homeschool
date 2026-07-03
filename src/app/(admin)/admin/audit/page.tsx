import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listStaffAudit, staffAuditFacets } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Admin · Audit Log" };
export const dynamic = "force-dynamic";

function sinceFromRange(range: string | undefined): Date | undefined {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 60 * 60 * 1000);
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return undefined;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ staff?: string; action?: string; range?: string }>;
}) {
  const sp = await searchParams;
  const since = sinceFromRange(sp.range);

  const [entries, facets] = await Promise.all([
    listStaffAudit({
      staffEmail: sp.staff || undefined,
      action: sp.action || undefined,
      since,
    }),
    staffAuditFacets(),
  ]);

  return (
    <>
      <AdminTopbar
        title="Audit Log"
        subtitle="Append-only record of staff write actions and escalation views"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <Card variant="glass" padding="none" className="overflow-hidden">
          {/* Filters — plain GET form, no client JS needed. */}
          <form className="px-6 py-4 border-b border-white/5 flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-xs text-fog-400">
              Staff
              <select
                name="staff"
                defaultValue={sp.staff ?? ""}
                className="h-9 min-w-[200px] rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 focus:outline-none focus:border-violet-400/60"
              >
                <option value="">All staff</option>
                {facets.staff.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-fog-400">
              Action
              <select
                name="action"
                defaultValue={sp.action ?? ""}
                className="h-9 min-w-[180px] rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 focus:outline-none focus:border-violet-400/60"
              >
                <option value="">All actions</option>
                {facets.actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-fog-400">
              Range
              <select
                name="range"
                defaultValue={sp.range ?? ""}
                className="h-9 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 focus:outline-none focus:border-violet-400/60"
              >
                <option value="">All time</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </label>
            <button
              type="submit"
              className="h-9 rounded-lg bg-violet-500/20 border border-violet-400/30 px-4 text-sm font-medium text-fog-50 hover:bg-violet-500/30"
            >
              Apply
            </button>
          </form>

          {entries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="mx-auto mb-3 h-6 w-6 text-fog-600" />
              <p className="text-sm text-fog-400">
                No staff actions recorded for this filter yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="violet" size="sm">
                      {e.action}
                    </Badge>
                    <span className="text-xs text-fog-100 font-mono truncate max-w-full">
                      {e.staffEmail}
                    </span>
                    <span className="ml-auto text-[11px] text-fog-500 font-mono tabular-nums">
                      {e.createdAt.toLocaleString("en-GB")}
                    </span>
                  </div>
                  {(e.before || e.after) && (
                    <div className="mt-1.5 text-xs text-fog-400 font-mono break-words">
                      <span className="text-fog-600">{e.before ?? "—"}</span>
                      <span className="mx-1.5 text-fog-600">→</span>
                      <span className="text-fog-200">{e.after ?? "—"}</span>
                    </div>
                  )}
                  {e.reason && (
                    <div className="mt-1 text-xs text-fog-300 break-words">
                      <span className="text-fog-600">Reason: </span>
                      {e.reason}
                    </div>
                  )}
                  {e.targetId && (
                    <div className="mt-1 text-[10px] text-fog-600 font-mono truncate">
                      target: {e.targetCollection ?? "—"} / {e.targetId}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <p className="mt-3 text-xs text-fog-500">
          Append-only: entries are never edited or deleted. Escalation-detail
          views are logged because viewing a child&apos;s distress data is itself
          sensitive.
        </p>
      </div>
    </>
  );
}
