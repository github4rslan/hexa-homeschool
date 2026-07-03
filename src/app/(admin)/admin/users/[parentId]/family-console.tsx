"use client";

import { useState, useTransition } from "react";
import {
  Loader2,
  Mail,
  Pause,
  Play,
  CreditCard,
  UserPlus,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminParentDetail, AdminChildSummary } from "@/lib/db/repo";
import {
  resendVerificationAction,
  toggleSuspendAction,
  setPlanAction,
  deleteFamilyAction,
  addChildAction,
  editChildAction,
  deleteChildAction,
  type ActionResult,
} from "./actions";

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

const input =
  "h-11 w-full rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:outline-none focus:border-violet-400/60";
const label = "flex flex-col gap-1 text-xs text-fog-400";
const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-500/20 border border-violet-400/30 px-4 text-sm font-medium text-fog-50 hover:bg-violet-500/30 disabled:opacity-50";
const dangerBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-crimson-500/15 border border-crimson-400/30 px-4 text-sm font-medium text-crimson-100 hover:bg-crimson-500/25 disabled:opacity-50";

export function FamilyConsole({ detail }: { detail: AdminParentDetail }) {
  return (
    <div className="flex flex-col gap-5">
      <AccountCard detail={detail} />
      <PlanCard detail={detail} />
      <ChildrenCard detail={detail} />
      <DangerCard detail={detail} />
    </div>
  );
}

function AccountCard({ detail }: { detail: AdminParentDetail }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card variant="glass" padding="lg">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="text-base font-semibold text-fog-50">{detail.name}</h2>
        {detail.role && <Badge variant="violet" size="sm">{detail.role}</Badge>}
        {detail.suspended && <Badge variant="crimson" size="sm">Suspended</Badge>}
        {!detail.verified && <Badge variant="outline" size="sm">Unverified</Badge>}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-fog-600 text-xs">Email</dt><dd className="text-fog-100 font-mono truncate">{detail.email}</dd></div>
        <div><dt className="text-fog-600 text-xs">Joined</dt><dd className="text-fog-100">{detail.joinedAt}</dd></div>
        <div><dt className="text-fog-600 text-xs">Tier</dt><dd className="text-fog-100">{detail.tier}</dd></div>
        <div><dt className="text-fog-600 text-xs">Billing</dt><dd className="text-fog-100">{detail.status}{detail.manualOverride ? " (manual)" : ""}</dd></div>
        <div><dt className="text-fog-600 text-xs">Stripe</dt><dd className="text-fog-100">{detail.hasStripe ? "linked" : "none"}</dd></div>
        <div><dt className="text-fog-600 text-xs">Children</dt><dd className="text-fog-100">{detail.children.length}</dd></div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {!detail.verified && (
          <form action={(fd) => start(async () => setResult(await resendVerificationAction(fd)))}>
            <input type="hidden" name="parentId" value={detail.id} />
            <button className={primaryBtn} disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Resend verification
            </button>
          </form>
        )}
        <SuspendControl detail={detail} />
      </div>
      <Feedback result={result} />
    </Card>
  );
}

function SuspendControl({ detail }: { detail: AdminParentDetail }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const suspend = !detail.suspended;

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-fog-200 hover:bg-white/[0.06]"
      >
        {suspend ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {suspend ? "Suspend account" : "Restore account"}
      </button>
      {open && (
        <form
          action={(fd) => start(async () => { const r = await toggleSuspendAction(fd); setResult(r); if (r.ok) setOpen(false); })}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
        >
          <input type="hidden" name="parentId" value={detail.id} />
          <input type="hidden" name="suspend" value={String(suspend)} />
          <label className={label}>
            Reason (required)
            <input name="reason" required className={input} placeholder="Why?" />
          </label>
          <button className={primaryBtn} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm {suspend ? "suspend" : "restore"}
          </button>
        </form>
      )}
      <Feedback result={result} />
    </div>
  );
}

function PlanCard({ detail }: { detail: AdminParentDetail }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="h-4 w-4 text-cyan-300" />
        <h2 className="text-base font-semibold text-fog-50">Plan control</h2>
      </div>
      <p className="text-xs text-fog-500 mb-4">
        Applies a <span className="text-amber-300">manual override</span> (comp / downgrade /
        cancel). Does not change Stripe — the webhook stays the source of truth for
        Stripe-driven billing.
      </p>
      <form
        action={(fd) => start(async () => setResult(await setPlanAction(fd)))}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="parentId" value={detail.id} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={label}>
            Tier
            <select name="tier" defaultValue={detail.tier} className={input}>
              <option value="diagnostic">Diagnostic</option>
              <option value="standard">Standard</option>
              <option value="family">Family</option>
            </select>
          </label>
          <label className={label}>
            Billing status
            <select name="status" defaultValue={detail.status} className={input}>
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
              <option value="paused">Paused</option>
            </select>
          </label>
        </div>
        <label className={label}>
          Reason (required)
          <input name="reason" required className={input} placeholder="e.g. Goodwill comp — ticket #456" />
        </label>
        <button className={primaryBtn} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Apply manual plan
        </button>
      </form>
      <Feedback result={result} />
    </Card>
  );
}

function ChildrenCard({ detail }: { detail: AdminParentDetail }) {
  return (
    <Card variant="glass" padding="lg">
      <h2 className="text-base font-semibold text-fog-50 mb-3">
        Children ({detail.children.length})
      </h2>
      <ul className="flex flex-col gap-3">
        {detail.children.map((c) => (
          <ChildRow key={c.id} parentId={detail.id} child={c} />
        ))}
        {detail.children.length === 0 && (
          <li className="text-sm text-fog-500">No children on this account.</li>
        )}
      </ul>
      <AddChildForm parentId={detail.id} />
    </Card>
  );
}

function ChildRow({ parentId, child }: { parentId: string; child: AdminChildSummary }) {
  const [mode, setMode] = useState<"none" | "edit" | "delete">("none");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-fog-50 truncate">{child.name}</div>
          <div className="text-xs text-fog-500 font-mono">DOB {child.dateOfBirth}</div>
        </div>
        <button onClick={() => setMode(mode === "edit" ? "none" : "edit")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-fog-200 hover:bg-white/[0.06]">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button onClick={() => setMode(mode === "delete" ? "none" : "delete")} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-crimson-400/30 bg-crimson-500/10 px-3 text-xs text-crimson-100 hover:bg-crimson-500/20">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      {mode === "edit" && (
        <form
          action={(fd) => start(async () => { const r = await editChildAction(fd); setResult(r); if (r.ok) setMode("none"); })}
          className="mt-3 flex flex-col gap-3"
        >
          <input type="hidden" name="parentId" value={parentId} />
          <input type="hidden" name="childId" value={child.id} />
          <label className={label}>Full name<input name="fullName" defaultValue={child.name} className={input} /></label>
          <label className={label}>Date of birth<input name="dateOfBirth" type="date" defaultValue={child.dateOfBirth} className={input} /></label>
          <label className={label}>Reason (required)<input name="reason" required className={input} placeholder="Why?" /></label>
          <button className={primaryBtn} disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Save child</button>
        </form>
      )}

      {mode === "delete" && (
        <form
          action={(fd) => start(async () => { const r = await deleteChildAction(fd); setResult(r); if (r.ok) setMode("none"); })}
          className="mt-3 flex flex-col gap-3 rounded-lg border border-crimson-400/30 bg-crimson-500/5 p-3"
        >
          <div className="flex items-start gap-2 text-xs text-crimson-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>This permanently erases {child.name}&apos;s learning record (GDPR). Irreversible.</span>
          </div>
          <input type="hidden" name="parentId" value={parentId} />
          <input type="hidden" name="childId" value={child.id} />
          <label className={label}>Type the child&apos;s name to confirm<input name="confirmName" required className={input} placeholder={child.name} /></label>
          <label className={label}>Reason (required)<input name="reason" required className={input} placeholder="Why?" /></label>
          <button className={dangerBtn} disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Erase child</button>
        </form>
      )}
      <Feedback result={result} />
    </li>
  );
}

function AddChildForm({ parentId }: { parentId: string }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-4">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-fog-200 hover:bg-white/[0.06]">
        <UserPlus className="h-4 w-4" /> {open ? "Cancel" : "Add a child"}
      </button>
      {open && (
        <form
          action={(fd) => start(async () => { const r = await addChildAction(fd); setResult(r); if (r.ok) setOpen(false); })}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
        >
          <input type="hidden" name="parentId" value={parentId} />
          <label className={label}>Full name<input name="fullName" required className={input} placeholder="Child's name" /></label>
          <label className={label}>Date of birth<input name="dateOfBirth" type="date" required className={input} /></label>
          <label className={label}>Target exam window (optional)<input name="targetExamWindow" className={input} placeholder="e.g. Summer 2030" /></label>
          <label className={label}>Reason (required)<input name="reason" required className={input} placeholder="Why is an admin adding this child?" /></label>
          <button className={primaryBtn} disabled={pending}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}Add child</button>
        </form>
      )}
      <Feedback result={result} />
    </div>
  );
}

function DangerCard({ detail }: { detail: AdminParentDetail }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <Card variant="glass" padding="lg" className="border-crimson-400/20">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-4 w-4 text-crimson-300" />
        <h2 className="text-base font-semibold text-fog-50">Danger zone</h2>
      </div>
      <p className="text-xs text-fog-500 mb-4">
        Deleting a family runs a full GDPR erasure of the parent and every child&apos;s
        learning record. Irreversible. Prefer suspend where possible.
      </p>
      <button onClick={() => setOpen((v) => !v)} className={dangerBtn}>
        <Trash2 className="h-4 w-4" /> Delete family (GDPR erasure)
      </button>
      {open && (
        <form
          action={(fd) => start(async () => setResult(await deleteFamilyAction(fd)))}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-crimson-400/30 bg-crimson-500/5 p-3"
        >
          <input type="hidden" name="parentId" value={detail.id} />
          <label className={label}>
            Type the account email to confirm
            <input name="confirmEmail" required className={input} placeholder={detail.email} />
          </label>
          <label className={label}>Reason (required)<input name="reason" required className={input} placeholder="Why?" /></label>
          <button className={dangerBtn} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Permanently erase this family
          </button>
        </form>
      )}
      <Feedback result={result} />
    </Card>
  );
}
