import "server-only";
import { findParentById } from "@/lib/db/repo";
import type { WeeklyScheduleDoc } from "@/lib/db/types";
import { sendEmail, emailConfigured } from "./send";
import { weeklyPlanTemplate } from "./templates";
import { appUrl } from "./verification";

/**
 * Email the freshly generated weekly plan to the parent.
 *
 * Trigger (Phase 1): called from the /schedule page when lazy generation
 * creates this week's schedule — i.e. the first visit each week. A Monday
 * cron (like /api/digest/weekly) would email parents who never open the page,
 * but plans only exist after generation, so that needs eager generation first.
 *
 * Best-effort by design: every failure path (Brevo down, key unset, parent
 * opted out) is a silent no-op — schedule generation must never break.
 */
export async function sendWeeklyPlanEmail(
  parentId: string,
  childName: string,
  schedule: WeeklyScheduleDoc,
): Promise<void> {
  try {
    if (!emailConfigured()) return;
    if (schedule.items.length === 0) return;

    const parent = await findParentById(parentId);
    if (!parent || parent.weekly_plan_email_opt_out) return;
    if (parent.email_verified === false) return;

    const tmpl = weeklyPlanTemplate({
      parentName: parent.full_name,
      childFirstName: childName.split(" ")[0],
      weekStart: schedule.week_start,
      items: schedule.items,
      scheduleUrl: `${appUrl()}/schedule`,
      settingsUrl: `${appUrl()}/settings`,
    });
    await sendEmail({ to: parent.email, subject: tmpl.subject, html: tmpl.html });
  } catch (err) {
    console.error("[weekly-plan email] failed (non-fatal):", err);
  }
}
