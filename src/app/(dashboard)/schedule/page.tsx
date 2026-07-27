import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Check, KeyRound, Printer, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  currentParentId,
  findParentById,
  getActiveChild,
  getOrCreateWeeklySchedule,
  listChildren,
  swappableTopicsForSubject,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { sendWeeklyPlanEmail } from "@/lib/email/weekly-plan";
import { approveSchedule, regenerateWeek } from "./actions";
import { EditableSchedule, type SwapOption } from "@/components/dashboard/editable-schedule";
import { InlineChildSwitcher } from "@/components/dashboard/inline-child-switcher";
import type { Subject } from "@/lib/db/types";
import { formatUkDate } from "@/lib/utils";

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

  const parent = await findParentById(parentId);
  const hasPin = Boolean(parent?.parent_pin_hash);
  // All the parent's children, for the inline active-child switcher.
  const siblings = await listChildren(parentId);
  const childItems = siblings.map((c) => ({
    id: c._id!.toHexString(),
    name: c.full_name,
  }));

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
            <div className="flex flex-wrap items-center gap-3">
              <InlineChildSwitcher
                items={childItems}
                activeId={child._id.toHexString()}
              />
              {schedule?.approved_by_parent ? (
                <Badge variant="neon" size="lg">
                  <Check className="h-4 w-4" /> Approved
                </Badge>
              ) : (
                <form action={approveSchedule}>
                  <SubmitButton variant="primary" size="md" pendingLabel="Approving…">
                    Approve this week
                  </SubmitButton>
                </form>
              )}
            </div>
          }
        />

        <Card variant="glass-strong" padding="lg">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-violet-300" />
              <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
                Week of {schedule?.week_start ? formatUkDate(schedule.week_start) : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {schedule && schedule.items.length > 0 && (
                <Button href="/schedule/print" variant="ghost" size="sm">
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </Button>
              )}
              <form action={regenerateWeek}>
                <SubmitButton variant="ghost" size="sm" pendingLabel="Regenerating…">
                  <Sparkles className="h-3.5 w-3.5" /> Regenerate week
                </SubmitButton>
              </form>
            </div>
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

        {schedule?.approved_by_parent && (
          <Card variant="glass-strong" padding="lg" className="mt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neon-500/10 border border-neon-400/30">
                <Sparkles className="h-5 w-5 text-neon-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-fog-50">
                  How {firstName} starts
                </h3>
                <p className="mt-1 text-sm text-fog-400 leading-relaxed">
                  The plan is approved. Hand the device to {firstName} and open
                  child mode — they&apos;ll see this week&apos;s lessons as quests,
                  matched day-for-day to the plan above.
                  {!hasPin && (
                    <>
                      {" "}
                      Set a 4-digit parent PIN first so you can step back into the
                      dashboard whenever you like.
                    </>
                  )}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  {hasPin ? (
                    <>
                      <Button href="/learn" variant="primary" size="md">
                        Open child mode
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button href="/settings#parent-pin" variant="ghost" size="md">
                        <KeyRound className="h-4 w-4" />
                        Change parent PIN
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button href="/settings#parent-pin" variant="primary" size="md">
                        <KeyRound className="h-4 w-4" />
                        Set parent PIN
                      </Button>
                      <Button href="/learn" variant="ghost" size="md">
                        Skip and open child mode
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
