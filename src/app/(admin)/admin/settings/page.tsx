import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CreditCard, Shield, UserCog } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/session";
import { findParentById, getFeatureFlags } from "@/lib/db/repo";
import { resolveRole } from "@/lib/auth/rbac";
import { getDb } from "@/lib/mongodb";
import {
  FEATURE_FLAGS,
  effectiveFlag,
} from "@/lib/admin/feature-flags";
import { aiVisualsEnabled } from "@/lib/ai/visual-flags";
import { TEACHING_CONFIDENCE_THRESHOLD } from "@/lib/ai/config";
import { FlagsPanel } from "./flags-client";

export const metadata: Metadata = { title: "Admin · Settings" };
export const dynamic = "force-dynamic";

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-neon-400" : "bg-crimson-400"}`}
      aria-hidden
    />
  );
}

function Health({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Dot ok={ok} />
        <span className="text-sm text-fog-100 truncate">{label}</span>
      </div>
      <span className="text-xs text-fog-500 font-mono shrink-0">{detail}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await getSession();
  const parent = session ? await findParentById(session.id) : null;
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;
  const isAdmin = role === "admin";

  // Persisted flags → resolved effective runtime values.
  const persisted = await getFeatureFlags();
  const envDefaults: Record<string, boolean> = {
    ai_visuals: aiVisualsEnabled(),
  };
  const effective: Record<string, boolean> = {};
  for (const f of FEATURE_FLAGS) {
    effective[f.key] = effectiveFlag(f.key, persisted, envDefaults[f.key] ?? false);
  }

  // System health — DB is pinged; integrations are reported by key presence
  // (we never expose the secrets themselves).
  let dbUp = false;
  try {
    await (await getDb()).command({ ping: 1 });
    dbUp = true;
  } catch {
    dbUp = false;
  }
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const emailConfiguredFlag = Boolean(process.env.BREVO_API_KEY);
  const sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);
  const commit = (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "local";

  const priceStandard = Boolean(process.env.STRIPE_PRICE_STANDARD);
  const priceFamily = Boolean(process.env.STRIPE_PRICE_FAMILY);

  return (
    <>
      <AdminTopbar
        title="Settings"
        subtitle="Feature flags, system health, billing config, safety controls"
      />

      <div className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1100px] flex flex-col gap-6">
        {/* Feature flags — real + persisted */}
        <section>
          <h2 className="text-sm font-semibold text-fog-50 mb-3">Feature flags</h2>
          <FlagsPanel effective={effective} isAdmin={isAdmin} />
        </section>

        {/* System health */}
        <section>
          <h2 className="text-sm font-semibold text-fog-50 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-neon-400" /> System health
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Health label="MongoDB" ok={dbUp} detail={dbUp ? "up" : "down"} />
            <Health label="Stripe" ok={stripeConfigured} detail={stripeConfigured ? "configured" : "unset"} />
            <Health label="Email (Brevo)" ok={emailConfiguredFlag} detail={emailConfiguredFlag ? "configured" : "unset"} />
            <Health label="Sentry" ok={sentryConfigured} detail={sentryConfigured ? "configured" : "disabled"} />
          </div>
          <p className="mt-2 text-[11px] text-fog-600 font-mono">version · {commit}</p>
        </section>

        {/* Billing config (read-only) */}
        <section>
          <Card variant="glass" padding="lg">
            <h2 className="text-sm font-semibold text-fog-50 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-300" /> Billing plans (read-only)
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-fog-200">Complete · Standard — £49/mo</span>
                <Badge variant={priceStandard ? "neon" : "amber"} size="sm">
                  {priceStandard ? "price id set" : "STRIPE_PRICE_STANDARD unset"}
                </Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-fog-200">Partner · Family — £99/mo</span>
                <Badge variant={priceFamily ? "neon" : "amber"} size="sm">
                  {priceFamily ? "price id set" : "STRIPE_PRICE_FAMILY unset"}
                </Badge>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-fog-600">
              The Stripe webhook is the source of truth for Stripe-driven billing;
              admin plan changes apply a local override labelled &ldquo;manual — not
              Stripe-synced&rdquo;.
            </p>
          </Card>
        </section>

        {/* Safety / compliance (visibility only) */}
        <section>
          <Card variant="glass" padding="lg">
            <h2 className="text-sm font-semibold text-fog-50 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-crimson-300" /> Safety &amp; compliance
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="text-fog-200">Distress gate (pre-AI)</span>
                <Badge variant="neon" size="sm">Active</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-fog-200">Teaching Checker threshold</span>
                <span className="font-mono text-fog-100">
                  {Math.round(TEACHING_CONFIDENCE_THRESHOLD * 100)}%
                </span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="text-fog-200">Children&apos;s analytics</span>
                <Badge variant="neon" size="sm">Never tracked</Badge>
              </li>
            </ul>
            <p className="mt-3 text-[11px] text-fog-600">
              These are visibility-only — safety invariants are not weakened from
              this screen. UK data residency depends on the Atlas cluster region.
            </p>
          </Card>
        </section>

        {/* Staff link */}
        <section>
          <Link
            href="/admin/staff"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-fog-100 hover:bg-white/[0.06]"
          >
            <UserCog className="h-4 w-4 text-violet-300" />
            Manage staff &amp; access →
          </Link>
        </section>
      </div>
    </>
  );
}
