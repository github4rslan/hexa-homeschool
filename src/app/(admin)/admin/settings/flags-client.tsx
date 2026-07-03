"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FEATURE_FLAGS } from "@/lib/admin/feature-flags";
import { toggleFeatureFlagAction, type ActionResult } from "./actions";

/**
 * Real, persisted feature-flag controls. `effective` is the resolved runtime
 * value (env default combined with any persisted override); toggling writes an
 * audited override. Only admins can change these.
 */
export function FlagsPanel({
  effective,
  isAdmin,
}: {
  effective: Record<string, boolean>;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {FEATURE_FLAGS.map((f) => (
        <FlagRow
          key={f.key}
          def={f}
          on={effective[f.key] === true}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

function FlagRow({
  def,
  on,
  isAdmin,
}: {
  def: (typeof FEATURE_FLAGS)[number];
  on: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const next = !on;

  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/10">
          <Sparkles className="h-4 w-4 text-violet-300" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-fog-50">{def.label}</h3>
            <Badge variant="outline" size="sm">{def.category}</Badge>
            <code className="text-[10px] font-mono text-fog-500 bg-white/[0.03] rounded px-1.5 py-0.5">
              {def.key}
            </code>
            <Badge variant={on ? "neon" : "default"} size="sm">
              {on ? "On" : "Off"}
            </Badge>
          </div>
          <p className="text-xs text-fog-400 mt-1.5">{def.description}</p>

          {isAdmin ? (
            <>
              <button
                onClick={() => setOpen((v) => !v)}
                className="mt-3 inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-fog-200 hover:bg-white/[0.06]"
              >
                {open ? "Cancel" : `Turn ${next ? "on" : "off"}`}
              </button>
              {open && (
                <form
                  action={(fd) =>
                    start(async () => {
                      const r = await toggleFeatureFlagAction(fd);
                      setResult(r);
                      if (r.ok) setOpen(false);
                    })
                  }
                  className="mt-3 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-end"
                >
                  <input type="hidden" name="key" value={def.key} />
                  <input type="hidden" name="enabled" value={String(next)} />
                  <label className="flex flex-1 flex-col gap-1 text-xs text-fog-400">
                    Reason (required)
                    <input
                      name="reason"
                      required
                      placeholder={`Why turn this ${next ? "on" : "off"}?`}
                      className="h-10 rounded-lg bg-white/[0.03] border border-white/10 px-3 text-sm text-fog-50 placeholder:text-fog-600 focus:outline-none focus:border-violet-400/60"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-500/20 border border-violet-400/30 px-4 text-sm font-medium text-fog-50 hover:bg-violet-500/30 disabled:opacity-50"
                  >
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm
                  </button>
                </form>
              )}
              {result && (
                <p className={`text-xs mt-2 ${result.ok ? "text-neon-300" : "text-crimson-300"}`}>
                  {result.ok ? result.message : result.error}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-[11px] text-fog-600">Admin only.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
