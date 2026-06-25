import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Check,
  Mail,
  Users,
  Download,
  Trash2,
  UserRound,
  LogOut,
  Sun,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { currentParentId, findParentById, listChildren } from "@/lib/db/repo";
import {
  updateAccount,
  changePassword,
  updateEmailPreferences,
  updateParentPin,
  updateTwoFactor,
  updatePhone,
  signOutEverywhere,
  deleteAccount,
} from "./actions";
import { emailConfigured } from "@/lib/email/send";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = {
  diagnostic: "Diagnostic (free)",
  standard: "HEXA Complete",
  family: "HEXA Partner",
};

const STATUS_CONTEXT: Record<string, string> = {
  trialing: "You're on the 14-day free trial — billing starts when it ends.",
  active: "Your subscription is active and renews monthly.",
  past_due: "Your last payment didn't go through — update your card to keep access.",
  canceled: "Your subscription has ended. You can re-subscribe any time.",
  paused: "Your subscription is paused.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; checkout?: string }>;
}) {
  const params = await searchParams;
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");
  const parent = await findParentById(parentId);
  if (!parent) redirect("/login?redirect=/settings");
  const children = await listChildren(parentId);

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <main className="mx-auto max-w-3xl px-6 py-10 lg:py-16">
        <PageHeader
          title="Settings"
          description="Your account, family, security, billing and data — all in one place."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
          backFallback="/dashboard"
        />

        {params.checkout === "success" && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-400">
            <Check className="h-4 w-4" /> Subscription started — your plan will
            appear below once payment is confirmed.
          </div>
        )}
        {params.saved && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-400">
            <Check className="h-4 w-4" /> Changes saved.
          </div>
        )}
        {params.error && (
          <div className="mb-6 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
            {params.error}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* 0 — Appearance */}
          <Card variant="glass-strong" padding="xl">
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-4 w-4 text-amber-300" />
              <h2 className="text-lg font-semibold text-fog-50">Appearance</h2>
            </div>
            <p className="text-sm text-fog-400 mb-5">
              Choose how the dashboard looks. &ldquo;System&rdquo; follows your
              device. Child mode always stays light for readability.
            </p>
            <ThemeToggle />
          </Card>

          {/* 1 — Profile */}
          <Card variant="glass-strong" padding="xl">
            <div className="flex items-center gap-2 mb-1">
              <UserRound className="h-4 w-4 text-violet-300" />
              <h2 className="text-lg font-semibold text-fog-50">Profile</h2>
            </div>
            <p className="text-sm text-fog-400 mb-6">
              Your name, sign-in email and password.
            </p>
            <form action={updateAccount} className="flex flex-col gap-4">
              <Input
                name="full_name"
                label="Full name"
                defaultValue={parent.full_name ?? ""}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                defaultValue={parent.email}
                disabled
                hint="Contact support to change your sign-in email."
              />
              <SubmitButton variant="primary" size="md" className="self-start" pendingLabel="Saving…">
                Save changes
              </SubmitButton>
            </form>

            <div className="my-6 border-t border-white/5" />

            <form action={changePassword} className="flex flex-col gap-4">
              <Input
                name="current_password"
                type="password"
                label="Current password"
                autoComplete="current-password"
                required
              />
              <Input
                name="new_password"
                type="password"
                label="New password"
                autoComplete="new-password"
                hint="At least 8 characters. Changing it signs you out everywhere else."
                required
                minLength={8}
              />
              <SubmitButton variant="secondary" size="md" className="self-start" pendingLabel="Updating…">
                Update password
              </SubmitButton>
            </form>
          </Card>

          {/* 2 — Notifications */}
          <Card variant="glass-strong" padding="xl">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-amber-300" />
              <h2 className="text-lg font-semibold text-fog-50">Notifications</h2>
            </div>
            <p className="text-sm text-fog-400 mb-6">
              Choose which emails we send you. Alerts always appear on your
              dashboard regardless.
            </p>
            <form action={updateEmailPreferences} className="flex flex-col gap-4">
              <label className="flex items-start gap-3 text-sm text-fog-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="weekly_digest"
                  defaultChecked={!parent.weekly_digest_opt_out}
                  className="mt-0.5 rounded border-white/10 bg-white/5"
                />
                <span>
                  Weekly progress digest
                  <span className="block text-xs text-fog-500 mt-0.5">
                    A summary every week of each child&apos;s lessons completed,
                    topics certified and anything that needs your attention.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-fog-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="weekly_plan_email"
                  defaultChecked={!parent.weekly_plan_email_opt_out}
                  className="mt-0.5 rounded border-white/10 bg-white/5"
                />
                <span>
                  Weekly plan email
                  <span className="block text-xs text-fog-500 mt-0.5">
                    A copy of each week&apos;s proposed plan with the reason every
                    topic was picked, so you can review before approving.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-fog-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="daily_summary"
                  defaultChecked={!parent.daily_summary_opt_out}
                  className="mt-0.5 rounded border-white/10 bg-white/5"
                />
                <span>
                  Daily progress summary
                  <span className="block text-xs text-fog-500 mt-0.5">
                    A warm note on the days your child finishes their quests —
                    today&apos;s results, progress so far and an encouraging word.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-fog-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="escalation_alerts"
                  defaultChecked={!parent.escalation_alert_opt_out}
                  className="mt-0.5 rounded border-white/10 bg-white/5"
                />
                <span>
                  Wellbeing alerts
                  <span className="block text-xs text-fog-500 mt-0.5">
                    An email when a lesson is paused because your child seemed to
                    be struggling. Details stay in your dashboard, never in email.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-fog-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="onboarding_emails"
                  defaultChecked={!parent.marketing_emails_opt_out}
                  className="mt-0.5 rounded border-white/10 bg-white/5"
                />
                <span>
                  Onboarding tips
                  <span className="block text-xs text-fog-500 mt-0.5">
                    A few helpful emails as you get started — a nudge to run the
                    diagnostic, and a note when your first weekly plan is
                    approved. Account and safety emails always come through.
                  </span>
                </span>
              </label>
              <SubmitButton variant="secondary" size="md" className="self-start" pendingLabel="Saving…">
                Save preferences
              </SubmitButton>
            </form>
          </Card>

          {/* 3 — Children */}
          <Card variant="glass-strong" padding="xl">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-cyan-400" />
              <h2 className="text-lg font-semibold text-fog-50">Children</h2>
            </div>
            <p className="text-sm text-fog-400 mb-6">
              Profiles, SEND indicators and target exam windows are managed on
              each child&apos;s page.
            </p>
            {children.length > 0 ? (
              <ul className="flex flex-col gap-3 mb-5">
                {children.map((child) => (
                  <li key={child._id?.toHexString()}>
                    <Link
                      href={`/dashboard/children/${child._id?.toHexString()}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fog-100">
                          {child.full_name}
                        </span>
                        <span className="block text-xs text-fog-500">
                          {child.target_exam_window
                            ? `Target: ${child.target_exam_window}`
                            : "No exam window set"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-violet-300">
                        Edit profile
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-5 text-sm text-fog-500">
                No children added yet — add your first child to begin the
                diagnostic.
              </p>
            )}
            <Button href="/dashboard/children/new" variant="outline" size="sm">
              Add a child
            </Button>
          </Card>

          {/* 4 — Security */}
          <Card id="parent-pin" variant="glass-strong" padding="xl" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-neon-300" />
              <h2 className="text-lg font-semibold text-fog-50">Security</h2>
            </div>
            <p className="text-sm text-fog-400 mb-6">
              Two-factor sign-in, parent gate PIN and session control.
            </p>

            <form action={updateTwoFactor} className="flex flex-col gap-4">
              <label className="flex items-start gap-3 text-sm text-fog-200 cursor-pointer">
                <input
                  type="checkbox"
                  name="two_factor"
                  defaultChecked={parent.two_factor_enabled === true}
                  disabled={!emailConfigured()}
                  className="mt-0.5 rounded border-white/10 bg-white/5"
                />
                <span>
                  Two-factor sign-in
                  <span className="block text-xs text-fog-500 mt-0.5">
                    {emailConfigured()
                      ? "After your password, we email you a 6-digit code to finish signing in. Recommended."
                      : "Unavailable right now — email delivery isn't set up on this deployment, and two-factor codes arrive by email."}
                  </span>
                </span>
              </label>
              {emailConfigured() && (
                <SubmitButton variant="secondary" size="md" className="self-start" pendingLabel="Saving…">
                  Save two-factor setting
                </SubmitButton>
              )}
            </form>

            <div className="my-6 border-t border-white/5" />

            <form action={updatePhone} className="flex flex-col gap-4">
              <Input
                name="phone"
                type="tel"
                label="Mobile for urgent safety alerts"
                defaultValue={parent.phone ?? ""}
                placeholder="+447700900123"
                inputMode="tel"
                hint="Optional. If your child shows signs of serious distress, we'll text this number so you can check on them right away. International format. Leave blank to turn off."
              />
              <SubmitButton variant="secondary" size="md" className="self-start" pendingLabel="Saving…">
                {parent.phone ? "Update mobile number" : "Add mobile number"}
              </SubmitButton>
            </form>

            <div className="my-6 border-t border-white/5" />

            <form action={updateParentPin} className="flex flex-col gap-4">
              <Input
                name="current_password"
                type="password"
                label="Current password"
                autoComplete="current-password"
                required
              />
              <Input
                name="parent_pin"
                type="password"
                label="4-digit PIN"
                inputMode="numeric"
                pattern="[0-9]{4}"
                minLength={4}
                maxLength={4}
                hint={
                  parent.parent_pin_hash
                    ? "A parent PIN is set. Enter a new PIN to replace it."
                    : "Required before exiting child-mode lessons back to the dashboard."
                }
                required
              />
              <Input
                name="confirm_parent_pin"
                type="password"
                label="Confirm PIN"
                inputMode="numeric"
                pattern="[0-9]{4}"
                minLength={4}
                maxLength={4}
                required
              />
              <SubmitButton variant="secondary" size="md" className="self-start" pendingLabel="Saving…">
                {parent.parent_pin_hash ? "Update parent PIN" : "Set parent PIN"}
              </SubmitButton>
            </form>

            <div className="my-6 border-t border-white/5" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-fog-200">Sessions</div>
                <p className="text-xs text-fog-500 mt-0.5 max-w-sm">
                  You&apos;re signed in on this device. Signing out everywhere
                  ends every other session (other browsers, devices) — this one
                  stays signed in.
                </p>
              </div>
              <form action={signOutEverywhere}>
                <SubmitButton variant="outline" size="sm" pendingLabel="Signing out…">
                  <LogOut className="h-4 w-4" /> Sign out everywhere
                </SubmitButton>
              </form>
            </div>
          </Card>

          {/* 5 — Billing */}
          <Card variant="glass" padding="xl">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              <h2 className="text-lg font-semibold text-fog-50">Billing</h2>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm text-fog-200 font-medium">
                  {TIER_LABEL[parent.subscription_tier] ?? parent.subscription_tier}
                </div>
                <div className="text-xs text-fog-500 mt-0.5">
                  {STATUS_CONTEXT[parent.billing_status] ?? `Status: ${parent.billing_status}`}
                </div>
              </div>
              <Badge
                variant={parent.billing_status === "active" ? "neon" : "amber"}
                size="md"
              >
                {parent.billing_status === "trialing" ? "Free trial" : parent.billing_status}
              </Badge>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {parent.stripe_customer_id ? (
                <>
                  <Button href="/api/billing/portal" variant="secondary" size="md">
                    Manage billing
                  </Button>
                  <span className="text-xs text-fog-500">
                    Change plan, update card, view invoices or cancel — via our
                    secure Stripe portal.
                  </span>
                </>
              ) : (
                <>
                  <Button href="/pricing" variant="primary" size="md">
                    Choose a plan
                  </Button>
                  <span className="text-xs text-fog-500">
                    14-day free trial. Cancel anytime.
                  </span>
                </>
              )}
            </div>
          </Card>

          {/* 6 — Data & privacy */}
          <Card variant="outline" padding="xl">
            <h2 className="text-lg font-semibold text-fog-50 mb-1">
              Data &amp; privacy
            </h2>
            <p className="text-sm text-fog-400 mb-5">
              Under UK GDPR your family&apos;s data is yours: download a full
              copy any time, or delete the account entirely.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-fog-200">Export my data</div>
                <p className="text-xs text-fog-500 mt-0.5 max-w-sm">
                  A JSON file with your account, children, lesson history,
                  progress, schedules and evidence records.
                </p>
              </div>
              <Button href="/api/account/export" variant="secondary" size="sm" external>
                <Download className="h-4 w-4" /> Download export
              </Button>
            </div>

            <div className="my-6 border-t border-crimson-400/15" />

            <div className="rounded-xl border border-crimson-400/20 bg-crimson-500/5 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="h-4 w-4 text-crimson-400" />
                <h3 className="text-sm font-semibold text-fog-100">Delete account</h3>
              </div>
              <p className="text-xs text-fog-400 mb-4 leading-relaxed">
                Permanently removes your account, every child profile, all
                lesson history, progress, schedules, portfolios and uploaded
                evidence, and cancels any active subscription. This cannot be
                undone — consider downloading your export first.
              </p>
              <form action={deleteAccount} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <Input
                  name="confirm_delete"
                  label='Type DELETE to confirm'
                  placeholder="DELETE"
                  autoComplete="off"
                  required
                  className="sm:w-48"
                />
                <SubmitButton
                  variant="ghost"
                  size="md"
                  pendingLabel="Deleting…"
                  className="self-start border border-crimson-400/40 text-crimson-400 hover:bg-crimson-500/10 hover:text-crimson-300"
                >
                  Delete my account
                </SubmitButton>
              </form>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
