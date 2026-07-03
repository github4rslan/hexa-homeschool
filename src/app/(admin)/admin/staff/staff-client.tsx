"use client";

import { useState, useTransition } from "react";
import { UserCog, ShieldCheck, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StaffMember } from "@/lib/db/repo";
import {
  grantStaffRoleByEmail,
  setStaffRoleById,
  type ActionResult,
} from "./actions";

const roleBadge = {
  admin: { label: "Admin", variant: "violet" as const },
  support: { label: "Support", variant: "cyan" as const },
};

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p
      className={`text-xs mt-2 ${result.ok ? "text-neon-300" : "text-crimson-300"}`}
      role="status"
    >
      {result.ok ? result.message : result.error}
    </p>
  );
}

export function StaffConsole({
  staff,
  currentUserId,
}: {
  staff: StaffMember[];
  currentUserId: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <GrantForm />
      <Card variant="glass" padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-fog-50">
            Staff accounts ({staff.length})
          </h2>
          <p className="text-xs text-fog-500 mt-0.5">
            Every change is written to the audit log with your reason.
          </p>
        </div>
        {staff.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-fog-500">
            No staff accounts yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {staff.map((m) => (
              <StaffRow
                key={m.id}
                member={m}
                isSelf={m.id === currentUserId}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function GrantForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <UserCog className="h-4 w-4 text-violet-300" />
        <h2 className="text-base font-semibold text-fog-50">Grant staff access</h2>
      </div>
      <form
        action={(fd) => start(async () => setResult(await grantStaffRoleByEmail(fd)))}
        className="flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-xs text-fog-400">
          Account email
          <input
            name="email"
            type="email"
            required
            placeholder="parent@example.com"
            className="h-11 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:outline-none focus:border-violet-400/60"
          />
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex flex-1 flex-col gap-1 text-xs text-fog-400">
            Role
            <select
              name="role"
              defaultValue="support"
              className="h-11 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 focus:outline-none focus:border-violet-400/60"
            >
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="flex flex-[2] flex-col gap-1 text-xs text-fog-400">
            Reason (required)
            <input
              name="reason"
              required
              placeholder="e.g. New support hire — ticket #123"
              className="h-11 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:outline-none focus:border-violet-400/60"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-500/20 border border-violet-400/30 px-4 text-sm font-medium text-fog-50 hover:bg-violet-500/30 disabled:opacity-50 self-start"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Grant role
        </button>
      </form>
      <Feedback result={result} />
    </Card>
  );
}

function StaffRow({ member, isSelf }: { member: StaffMember; isSelf: boolean }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const badge = roleBadge[member.role];

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-sm font-semibold shrink-0">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-fog-50 truncate">
              {member.name}
            </span>
            <Badge variant={badge.variant} size="sm">
              {badge.label}
            </Badge>
            {isSelf && (
              <Badge variant="outline" size="sm">
                You
              </Badge>
            )}
          </div>
          <div className="text-xs text-fog-500 font-mono truncate">
            {member.email}
          </div>
          {member.grantedByEmail && (
            <div className="text-[10px] text-fog-600 mt-0.5">
              Granted by {member.grantedByEmail}
              {member.grantedAt
                ? ` · ${new Date(member.grantedAt).toLocaleDateString("en-GB")}`
                : ""}
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="h-9 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-fog-200 hover:bg-white/[0.06]"
        >
          {open ? "Cancel" : "Change role"}
        </button>
      </div>

      {open && (
        <form
          action={(fd) =>
            start(async () => {
              const r = await setStaffRoleById(fd);
              setResult(r);
              if (r.ok) setOpen(false);
            })
          }
          className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="targetId" value={member.id} />
          <label className="flex flex-col gap-1 text-xs text-fog-400 sm:w-40">
            New role
            <select
              name="role"
              defaultValue={member.role}
              className="h-10 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 focus:outline-none focus:border-violet-400/60"
            >
              <option value="support">Support</option>
              <option value="admin">Admin</option>
              <option value="none">Revoke (normal parent)</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-fog-400">
            Reason (required)
            <input
              name="reason"
              required
              placeholder="Why is this changing?"
              className="h-10 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:outline-none focus:border-violet-400/60"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500/20 border border-violet-400/30 px-4 text-sm font-medium text-fog-50 hover:bg-violet-500/30 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Apply
          </button>
        </form>
      )}
      <Feedback result={result} />
    </li>
  );
}
