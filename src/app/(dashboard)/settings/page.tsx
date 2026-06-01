import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, ShieldCheck, Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { currentParentId, findParentById } from "@/lib/db/repo";
import { updateAccount, changePassword } from "./actions";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = {
  diagnostic: "Diagnostic (free)",
  standard: "HEXA Complete",
  family: "HEXA Partner",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/settings");
  const parent = await findParentById(parentId);
  if (!parent) redirect("/login?redirect=/settings");

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <main className="mx-auto max-w-3xl px-6 py-10 lg:py-16">
        <PageHeader
          title="Settings"
          description="Manage your account, security and subscription."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
          backFallback="/dashboard"
        />

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
          {/* Account */}
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-lg font-semibold text-fog-50 mb-1">Account</h2>
            <p className="text-sm text-fog-400 mb-6">
              Your name and sign-in email.
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
                defaultValue={parent.email}
                disabled
                hint="Contact support to change your sign-in email."
              />
              <Button type="submit" variant="primary" size="md" className="self-start">
                Save changes
              </Button>
            </form>
          </Card>

          {/* Security */}
          <Card variant="glass-strong" padding="xl">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-violet-300" />
              <h2 className="text-lg font-semibold text-fog-50">Security</h2>
            </div>
            <p className="text-sm text-fog-400 mb-6">Change your password.</p>
            <form action={changePassword} className="flex flex-col gap-4">
              <Input
                name="current_password"
                type="password"
                label="Current password"
                required
              />
              <Input
                name="new_password"
                type="password"
                label="New password"
                hint="At least 8 characters."
                required
              />
              <Button type="submit" variant="secondary" size="md" className="self-start">
                Update password
              </Button>
            </form>
          </Card>

          {/* Subscription */}
          <Card variant="glass" padding="xl">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              <h2 className="text-lg font-semibold text-fog-50">Subscription</h2>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-fog-200 font-medium">
                  {TIER_LABEL[parent.subscription_tier] ?? parent.subscription_tier}
                </div>
                <div className="text-xs text-fog-500 mt-0.5">
                  Status: {parent.billing_status}
                </div>
              </div>
              <Badge
                variant={parent.billing_status === "active" ? "neon" : "amber"}
                size="md"
              >
                {parent.billing_status === "trialing" ? "Free trial" : parent.billing_status}
              </Badge>
            </div>
            <p className="mt-4 text-xs text-fog-500">
              Billing management is handled by our team during the pilot. Email
              hello@hexa.education to change your plan.
            </p>
          </Card>

          {/* Data rights */}
          <Card variant="outline" padding="xl">
            <h2 className="text-lg font-semibold text-fog-50 mb-1">
              Your data
            </h2>
            <p className="text-sm text-fog-400 mb-4">
              Under UK GDPR you can request a copy of your family&apos;s data or
              ask us to delete it. We action requests within statutory timeframes.
            </p>
            <Button
              href="mailto:privacy@hexa.education?subject=Data%20request"
              variant="ghost"
              size="sm"
            >
              Request data export or deletion
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}
