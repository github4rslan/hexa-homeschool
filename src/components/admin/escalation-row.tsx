"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { slaState, formatDuration } from "@/lib/engine/escalation-sla";
import type { AdminEscalation } from "@/lib/db/repo";
import {
  acknowledgeEscalation,
  resolveEscalation,
} from "@/app/(admin)/admin/escalations/actions";

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

/**
 * One escalation row with a live SLA timer and acknowledge/resolve controls.
 * The timer re-renders every 30s from the pure slaState math. Actions are
 * server-side, RBAC-gated and audit-logged.
 */
export function EscalationRow({ esc }: { esc: AdminEscalation }) {
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const sla = slaState(
    { severity: esc.severity, status: esc.status, created_at: esc.createdAt },
    now,
  );

  async function run(
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
  ) {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("escalationId", esc.id);
    const res = await action(fd);
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Could not update.");
  }

  return (
    <div
      className={[
        "px-6 py-4 transition-colors flex items-start gap-4",
        sla.alarm ? "bg-crimson-500/[0.06]" : "hover:bg-white/[0.02]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
          sla.alarm
            ? "border-crimson-400/60 bg-crimson-500/20 text-crimson-300 animate-pulse"
            : "border-crimson-400/30 bg-crimson-500/10 text-crimson-400",
        ].join(" ")}
      >
        <ShieldAlert className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-fog-50">{esc.childName}</span>
          <Badge variant={severityVariant[esc.severity] ?? "violet"} size="sm">
            {esc.severity}
          </Badge>
          <Badge
            variant={esc.status === "resolved" ? "neon" : esc.status === "acknowledged" ? "cyan" : "amber"}
            size="sm"
          >
            {esc.status}
          </Badge>
          {esc.status === "open" && (
            <span
              className={
                sla.breached
                  ? "text-xs font-medium text-crimson-300"
                  : "text-xs text-fog-500"
              }
            >
              {sla.breached
                ? `SLA breached by ${formatDuration(sla.minutesToBreach ?? 0)}`
                : `${formatDuration(sla.minutesToBreach ?? 0)} to SLA`}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-fog-400">
          {esc.trigger} · open {formatDuration(sla.ageMinutes)}
        </div>
        {error && <div className="mt-1 text-xs text-crimson-400">{error}</div>}
      </div>

      <div className="flex shrink-0 gap-2">
        {esc.status === "open" && (
          <button
            onClick={() => run(acknowledgeEscalation)}
            disabled={busy}
            className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            Acknowledge
          </button>
        )}
        {esc.status !== "resolved" && (
          <button
            onClick={() => run(resolveEscalation)}
            disabled={busy}
            className="rounded-lg border border-neon-400/30 bg-neon-500/10 px-3 py-1.5 text-xs font-medium text-neon-300 hover:bg-neon-500/20 disabled:opacity-50"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  );
}
