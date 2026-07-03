"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { slaState, formatDuration } from "@/lib/engine/escalation-sla";
import type { AdminEscalation } from "@/lib/db/repo";
import {
  acknowledgeEscalation,
  resolveEscalation,
  sendStaffEscalationMessage,
} from "@/app/(admin)/admin/escalations/actions";
import { MAX_MESSAGE_CHARS } from "@/lib/messaging/validate";

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

export interface AdminThreadMessage {
  id: string;
  sender: "parent" | "staff";
  body: string;
  createdAt: string;
}

/**
 * One escalation row with a live SLA timer, acknowledge/resolve controls and
 * the parent-facing message thread. Actions are server-side, RBAC-gated and
 * audit-logged.
 */
export function EscalationRow({
  esc,
  initialMessages,
}: {
  esc: AdminEscalation;
  initialMessages: AdminThreadMessage[];
}) {
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [replying, setReplying] = useState(false);
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

  async function sendReply(formData: FormData) {
    setReplying(true);
    setError(null);
    const res = await sendStaffEscalationMessage(formData);
    setReplying(false);
    if (!res.ok) setError(res.error ?? "Could not send.");
  }

  return (
    <div
      className={[
        "px-6 py-4 transition-colors",
        sla.alarm ? "bg-crimson-500/[0.06]" : "hover:bg-white/[0.02]",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
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
            <span className="text-sm font-semibold text-fog-50">
              {esc.childName}
            </span>
            <Badge variant={severityVariant[esc.severity] ?? "violet"} size="sm">
              {esc.severity}
            </Badge>
            <Badge
              variant={
                esc.status === "resolved"
                  ? "neon"
                  : esc.status === "acknowledged"
                    ? "cyan"
                    : "amber"
              }
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
            {esc.trigger} - open {formatDuration(sla.ageMinutes)}
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

      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 md:ml-[52px]">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-fog-100">Parent thread</h3>
        </div>

        {initialMessages.length > 0 ? (
          <ul className="mb-4 flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
            {initialMessages.map((message) => (
              <li
                key={message.id}
                className={
                  message.sender === "staff" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={[
                    "max-w-[82%] rounded-2xl px-4 py-2.5 text-sm",
                    message.sender === "staff"
                      ? "bg-cyan-500/15 text-cyan-50"
                      : "bg-white/[0.05] text-fog-100",
                  ].join(" ")}
                >
                  <div className="mb-0.5 text-[10px] uppercase text-fog-500">
                    {message.sender === "staff" ? "Edway team" : "Parent"} -{" "}
                    {new Date(message.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-fog-500">
            No parent messages yet. Replies sent here will appear in the parent
            tutoring thread for this paused lesson.
          </p>
        )}

        <form action={sendReply} className="flex flex-col gap-2">
          <input type="hidden" name="escalationId" value={esc.id} />
          <textarea
            name="body"
            rows={2}
            maxLength={MAX_MESSAGE_CHARS}
            required
            placeholder="Reply to the parent..."
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-fog-50 placeholder:text-fog-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            type="submit"
            disabled={replying || esc.status === "resolved"}
            className="inline-flex min-h-10 items-center gap-1.5 self-end rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {replying ? "Sending..." : "Send reply"}
          </button>
        </form>
      </div>
    </div>
  );
}
