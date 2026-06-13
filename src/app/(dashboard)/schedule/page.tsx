import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  currentParentId,
  getActiveChild,
  getOrCreateWeeklySchedule,
  swappableTopicsForSubject,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { sendWeeklyPlanEmail } from "@/lib/email/weekly-plan";
import { approveSchedule, regenerateWeek } from "./actions";
import { EditableSchedule, type SwapOption } from "@/components/dashboard/editable-schedule";
import type { Subject } from "@/lib/db/types";

export const metadata: Metadata = { title: "Weekly schedule" };
export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/schedule");
  const child = await getActiveChild(parentId, await readActiveChildId());

  if (!child?._id) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-void -z-20" />
        <main className="mx-auto max-w-3xl px-6 py-10 lg:py-16">
          <PageHeader
            title="Weekly schedule"
            breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Schedule" }]}
          />
          <Card variant="glass-strong" padding="xl" className="text-center">
            <p className="text-fog-300 mb-6">
              Add a child first to generate a weekly plan.
            </p>
            <Button href="/dashboard/children/new" variant="primary" size="md">
              Add a child
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const result = await getOrCreateWeeklySchedule(parentId, child._id);
  const schedule = result?.schedule ?? null;
  // First visit of the week just generated the plan — send the parent a copy
  // (best-effort; opt-out and missing Brevo key are silent no-ops).
  if (result?.created) {
    await sendWeeklyPlanEmail(parentId, child.full_name, result.schedule);
  }
  const firstName = child.full_name.split(" ")[0];

  // Valid swap targets per subject (uncertified topics, in order) for the editor.
  const subjects: Subject[] = ["mathematics", "english", "science"];
  const swapEntries = await Promise.all(
    subjects.map(
      async (s) =>
        [s, await swappableTopicsForSubject(child._id!, s)] as [Subject, SwapOption[]],
    ),
  );
  const swapOptionsBySubject = Object.fromEntries(swapEntries) as Record<
    Subject,
    SwapOption[]
  >;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <main className="mx-auto max-w-3xl px-6 py-10 lg:py-16">
        <PageHeader
          title="This week's plan"
          description={`The Planning Agent proposed this week for ${firstName}, based on topics not yet mastered. Review and approve — nothing is forced.`}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Schedule" },
          ]}
          backFallback="/dashboard"
          action={
            schedule?.approved_by_parent ? (
              <Badge variant="neon" size="lg">
                <Check className="h-4 w-4" /> Approved
              </Badge>
            ) : (
              <form action={approveSchedule}>
                <SubmitButton variant="primary" size="md" pendingLabel="Approving…">
                  Approve this week
                </SubmitButton>
              </form>
            )
          }
        />

        <Card variant="glass-strong" padding="lg">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-violet-300" />
              <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
                Week of {schedule?.week_start}
              </span>
            </div>
            <form action={regenerateWeek}>
              <SubmitButton variant="ghost" size="sm" pendingLabel="Regenerating…">
                <Sparkles className="h-3.5 w-3.5" /> Regenerate week
              </SubmitButton>
            </form>
          </div>

          {schedule ? (
            <EditableSchedule
              items={schedule.items}
              swapOptionsBySubject={swapOptionsBySubject}
            />
          ) : (
            <p className="text-sm text-fog-400 py-6 text-center">
              No plan items yet — run the diagnostic so the Planning Agent can
              build a tailored week.
            </p>
          )}

          <p className="mt-5 text-xs text-fog-500">
            Approving confirms the week for {firstName}. Editing an item — swap a
            topic, move a day, or clear a day you&apos;re away — counts as your
            approval, so there&apos;s no second step for your own change.
          </p>
        </Card>
      </main>
    </div>
  );
}
