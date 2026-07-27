import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  currentParentId,
  getActiveChild,
  getWeeklySchedule,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { formatUkDate } from "@/lib/utils";
import {
  SchedulePrintView,
  type PrintDay,
} from "@/components/dashboard/schedule-print-view";
import type { Subject } from "@/lib/db/types";

export const metadata: Metadata = { title: "Print weekly plan" };
export const dynamic = "force-dynamic";

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SUBJECT_LABEL: Record<Subject, string> = {
  mathematics: "Maths",
  english: "English",
  science: "Science",
};

export default async function SchedulePrintPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/schedule");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/schedule");

  // Ownership-checked read of this week's plan; no plan → back to /schedule.
  const schedule = await getWeeklySchedule(parentId, child._id);
  if (!schedule) redirect("/schedule");

  const firstName = child.full_name.split(" ")[0];
  const weekLabel = schedule.week_start ? formatUkDate(schedule.week_start) : "—";

  // Group items into days (Mon→Sun), keeping only days with planned lessons.
  const days: PrintDay[] = [];
  for (let d = 0; d < 7; d++) {
    const items = schedule.items
      .filter((it) => it.day === d)
      .map((it) => ({
        subject: SUBJECT_LABEL[it.subject] ?? it.subject,
        topicTitle: it.topic_title,
        reason: it.reason,
      }));
    if (items.length > 0) {
      days.push({ label: DAY_LABELS[d], items });
    }
  }

  return (
    <SchedulePrintView
      firstName={firstName}
      weekLabel={weekLabel}
      days={days}
      approved={schedule.approved_by_parent}
    />
  );
}
