import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  currentParentId,
  getActiveChild,
  getOrCreateWeeklySchedule,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { approveSchedule } from "./actions";

export const metadata: Metadata = { title: "Weekly schedule" };
export const dynamic = "force-dynamic";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

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

  const schedule = await getOrCreateWeeklySchedule(parentId, child._id);
  const firstName = child.full_name.split(" ")[0];

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
                <Button type="submit" variant="primary" size="md">
                  Approve this week
                </Button>
              </form>
            )
          }
        />

        <Card variant="glass-strong" padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="h-4 w-4 text-violet-300" />
            <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
              Week of {schedule?.week_start}
            </span>
          </div>

          {schedule && schedule.items.length > 0 ? (
            <div className="flex flex-col gap-3">
              {schedule.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-white/[0.03] border border-white/5 p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-24 shrink-0 text-sm font-medium text-fog-300">
                      {DAYS[item.day]}
                    </span>
                    <Badge variant="violet" size="sm">
                      {SUBJECT_LABEL[item.subject]}
                    </Badge>
                    <span className="flex-1 text-sm text-fog-100">
                      {item.topic_title}
                    </span>
                    <Link
                      href={`/learn/lesson?topic=${item.topic_tag}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Start
                    </Link>
                  </div>
                  {item.reason && (
                    <p className="mt-2 pl-[7rem] text-xs leading-relaxed text-fog-500">
                      Why: {item.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fog-400 py-6 text-center">
              No plan items yet — run the diagnostic so the Planning Agent can
              build a tailored week.
            </p>
          )}

          <p className="mt-5 text-xs text-fog-500">
            Approving confirms the week for {firstName}. You can re-open the plan
            any time; the schedule regenerates each week from real progress.
          </p>
        </Card>
      </main>
    </div>
  );
}
