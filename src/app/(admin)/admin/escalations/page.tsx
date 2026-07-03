import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import {
  adminEscalationQueue,
  escalationStats,
  listThreadMessagesAsStaff,
} from "@/lib/db/repo";
import {
  EscalationRow,
  type AdminThreadMessage,
} from "@/components/admin/escalation-row";
import { slaState } from "@/lib/engine/escalation-sla";

export const metadata: Metadata = { title: "Admin · Escalations" };
export const dynamic = "force-dynamic";

const SEVERITY_ORDER: Record<string, number> = {
  immediate: 0,
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

export default async function EscalationsPage() {
  const [queue, stats] = await Promise.all([
    adminEscalationQueue(100),
    escalationStats(),
  ]);

  // Open first, then by severity, then oldest first (most urgent at the top).
  const sorted = [...queue].sort((a, b) => {
    const openA = a.status === "open" ? 0 : 1;
    const openB = b.status === "open" ? 0 : 1;
    if (openA !== openB) return openA - openB;
    const sevA = SEVERITY_ORDER[a.severity] ?? 9;
    const sevB = SEVERITY_ORDER[b.severity] ?? 9;
    if (sevA !== sevB) return sevA - sevB;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const alarmed = queue.filter(
    (e) =>
      slaState({ severity: e.severity, status: e.status, created_at: e.createdAt })
        .alarm,
  ).length;

  const messagesByEscalation = new Map<string, AdminThreadMessage[]>();
  await Promise.all(
    sorted.map(async (e) => {
      const messages = await listThreadMessagesAsStaff("escalation", e.id);
      messagesByEscalation.set(
        e.id,
        messages.map((m) => ({
          id: m._id!.toHexString(),
          sender: m.sender,
          body: m.body,
          createdAt: m.created_at.toISOString(),
        })),
      );
    }),
  );

  return (
    <>
      <AdminTopbar
        title="Safety Net · Escalations"
        subtitle="Acknowledge and resolve real distress escalations against SLA"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            label="Open escalations"
            value={stats.open.toString()}
            accent="crimson"
            hint="awaiting acknowledgement"
          />
          <MetricCard
            label="SLA alarms"
            value={alarmed.toString()}
            accent="amber"
            hint="immediate, unacked > 15 min"
          />
          <MetricCard
            label="Median time to ack"
            value={
              stats.medianAckMinutes === null
                ? "—"
                : `${stats.medianAckMinutes}m`
            }
            accent="neon"
            hint="this week"
          />
        </section>

        <Card variant="glass" padding="none" className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-fog-50">Queue</h2>
            <p className="text-xs text-fog-500 mt-0.5">
              Most urgent first. Acknowledging stops the SLA clock; both actions
              are written to the audit trail.
            </p>
          </div>

          {sorted.length > 0 ? (
            <div className="divide-y divide-white/5">
              {sorted.map((e) => (
                <EscalationRow
                  key={e.id}
                  esc={e}
                  initialMessages={messagesByEscalation.get(e.id) ?? []}
                />
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neon-500/10 border border-neon-400/30">
                <Activity className="h-5 w-5 text-neon-400" />
              </div>
              <h3 className="text-base font-semibold text-fog-50">All clear</h3>
              <p className="text-sm text-fog-500 mt-1">
                No escalations. New distress events will appear here in real time.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
