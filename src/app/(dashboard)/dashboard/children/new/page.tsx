import type { Metadata } from "next";
import { Calendar, GraduationCap, User } from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createChild } from "./actions";

export const metadata: Metadata = {
  title: "Add child",
};

export default async function NewChildPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <DashboardTopbar greeting="Add a child" />

      <main className="flex-1 p-6 lg:p-10 max-w-3xl">
        <PageHeader
          title="Add a child"
          description="Create your child's profile to begin. Next, you'll run the diagnostic."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Add child" },
          ]}
          backFallback="/dashboard"
        />

        <Card variant="glass-strong" padding="xl">

          {params.error && (
            <div className="mb-6 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-300">
              {params.error}
            </div>
          )}

          <form action={createChild} className="grid gap-5">
            <Input
              name="full_name"
              required
              label="Child name"
              placeholder="Aisha Faisal"
              leftIcon={<User className="h-4 w-4" />}
              autoComplete="off"
            />

            <Input
              name="date_of_birth"
              required
              type="date"
              label="Date of birth"
              leftIcon={<Calendar className="h-4 w-4" />}
            />

            <Input
              name="target_exam_window"
              label="Target exam window"
              placeholder="Summer 2028"
              leftIcon={<GraduationCap className="h-4 w-4" />}
              hint="Optional. You can refine this later."
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="send_indicators"
                className="text-xs font-medium uppercase tracking-wider text-fog-300"
              >
                SEND indicators
              </label>
              <textarea
                id="send_indicators"
                name="send_indicators"
                rows={4}
                placeholder="Optional, comma separated"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-fog-50 placeholder:text-fog-500 transition-all focus:border-violet-400/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              />
              <p className="text-xs text-fog-500">
                Example: dyslexia, ADHD, visual processing.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <SubmitButton variant="primary" size="md" pendingLabel="Saving…">
                Save child
              </SubmitButton>
              <Button href="/dashboard" variant="ghost" size="md">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </>
  );
}
