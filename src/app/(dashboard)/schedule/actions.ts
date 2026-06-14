"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  findParentById,
  getActiveChild,
  approveWeeklySchedule,
  swapScheduleItemTopic,
  moveScheduleItemDay,
  clearScheduleDay,
  regenerateWeeklySchedule,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { sendLifecycleEmail } from "@/lib/email/lifecycle";
import { firstPlanTemplate } from "@/lib/email/templates";
import { appUrl } from "@/lib/email/verification";

async function activeChildId(): Promise<{ parentId: string; childId: import("mongodb").ObjectId } | null> {
  const parentId = await currentParentId();
  if (!parentId) return null;
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return null;
  return { parentId, childId: child._id };
}

/**
 * Pages whose data depends on the weekly plan: the plan itself, the dashboard
 * (getting-started checklist + "next milestone"), and the child hub (today's
 * quests mirror the plan). Revalidate all three after any plan mutation so none
 * shows a stale week.
 */
function revalidatePlanPages(): void {
  revalidatePath("/schedule");
  revalidatePath("/dashboard");
  revalidatePath("/learn");
}

export async function swapTopic(formData: FormData): Promise<void> {
  const ctx = await activeChildId();
  if (!ctx) return;
  const itemIndex = Number(formData.get("itemIndex"));
  const topicTag = String(formData.get("topicTag") || "");
  if (Number.isNaN(itemIndex) || !topicTag) return;
  await swapScheduleItemTopic(ctx.parentId, ctx.childId, itemIndex, topicTag);
  revalidatePlanPages();
}

export async function moveDay(formData: FormData): Promise<void> {
  const ctx = await activeChildId();
  if (!ctx) return;
  const itemIndex = Number(formData.get("itemIndex"));
  const newDay = Number(formData.get("newDay"));
  if (Number.isNaN(itemIndex) || Number.isNaN(newDay)) return;
  await moveScheduleItemDay(ctx.parentId, ctx.childId, itemIndex, newDay);
  revalidatePlanPages();
}

export async function clearDay(formData: FormData): Promise<void> {
  const ctx = await activeChildId();
  if (!ctx) return;
  const day = Number(formData.get("day"));
  if (Number.isNaN(day)) return;
  await clearScheduleDay(ctx.parentId, ctx.childId, day);
  revalidatePlanPages();
}

export async function regenerateWeek(): Promise<void> {
  const ctx = await activeChildId();
  if (!ctx) return;
  await regenerateWeeklySchedule(ctx.parentId, ctx.childId);
  revalidatePlanPages();
}

export async function approveSchedule(): Promise<void> {
  const parentId = await currentParentId();
  if (!parentId) return;
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return;
  const ok = await approveWeeklySchedule(parentId, child._id);
  revalidatePlanPages();

  // First-plan celebration — sent at most once per family (the lifecycle key
  // dedupes, so re-approving or approving a second child won't resend). Respects
  // the marketing opt-out and no-ops when Brevo is unset.
  if (ok) {
    const parent = await findParentById(parentId);
    if (parent && parent.marketing_emails_opt_out !== true) {
      await sendLifecycleEmail(parentId, "first_plan", () => {
        const tmpl = firstPlanTemplate({
          name: parent.full_name,
          childName: child.full_name,
          learnUrl: `${appUrl()}/learn`,
          settingsUrl: `${appUrl()}/settings`,
        });
        return { to: parent.email, subject: tmpl.subject, html: tmpl.html };
      });
    }
  }
}
