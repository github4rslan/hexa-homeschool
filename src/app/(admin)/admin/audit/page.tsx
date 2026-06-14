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

          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-fog-500">
            <div className="col-span-3">Timestamp</div>
            <div className="col-span-4">Staff</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-2">Target</div>
          </div>

          {entries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="mx-auto mb-3 h-6 w-6 text-fog-600" />
              <p className="text-sm text-fog-400">
                No staff actions recorded for this filter yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 font-mono text-xs">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="px-6 py-3 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-4 items-center"
                >
                  <div className="col-span-3 text-fog-500 tabular-nums">
                    {e.createdAt.toLocaleString("en-GB")}
                  </div>
                  <div className="col-span-4 text-fog-100 truncate">{e.staffEmail}</div>
                  <div className="col-span-3">
                    <Badge variant="violet" size="sm">
                      {e.action}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-fog-500 truncate">
                    {e.targetId ?? "—"}
                  </div>
                </div>
              ))}
            </div>
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
