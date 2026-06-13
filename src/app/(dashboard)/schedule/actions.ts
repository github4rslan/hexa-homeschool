"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  findParentById,
  getActiveChild,
  approveWeeklySchedule,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { sendLifecycleEmail } from "@/lib/email/lifecycle";
import { firstPlanTemplate } from "@/lib/email/templates";
import { appUrl } from "@/lib/email/verification";

export async function approveSchedule(): Promise<void> {
  const parentId = await currentParentId();
  if (!parentId) return;
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return;
  const ok = await approveWeeklySchedule(parentId, child._id);
  revalidatePath("/schedule");

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
