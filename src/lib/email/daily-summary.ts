import "server-only";
import {
  findParentById,
  dailySummaryData,
  claimDailySummary,
  releaseDailySummary,
} from "@/lib/db/repo";
import type { ChildDoc } from "@/lib/db/types";
import { buildDailySummary } from "@/lib/engine/daily-summary";
import { sendEmail, emailConfigured } from "./send";
import { dailySummaryTemplate } from "./templates";
import { appUrl } from "./verification";

/** UTC day-key ("YYYY-MM-DD") — the once-per-child-per-day idempotency bucket. */
function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Email the parent a warm, deterministic summary of today's learning — sent
 * once per child per day, when the child has finished today's quests.
 *
 * Best-effort by design: every failure path (Brevo unset, parent opted out,
 * unverified, smoke account, already sent today, send error) is a silent no-op
 * and never throws — the child's lesson flow must never be blocked or slowed.
 *
 * Idempotency: the day-key is CLAIMED in Mongo before sending (so concurrent
 * completions can't both send); a failed send releases the claim so a later
 * completion the same day can retry.
 */
export async function sendDailySummaryEmail(
  parentId: string,
  child: ChildDoc,
): Promise<void> {
  try {
    if (!emailConfigured()) return;
    if (!child._id) return;

    const parent = await findParentById(parentId);
    if (!parent) return;
    if (parent.daily_summary_opt_out) return;
    if (parent.email_verified === false) return;
    // CI smoke account never sends real mail.
    if (parent.is_smoke_account) return;

    const dayKey = utcDayKey();
    const claimed = await claimDailySummary(child._id, dayKey);
    if (!claimed) return; // already sent for this child today

    try {
      const data = await dailySummaryData(parentId, child);
      if (!data || data.today.lessonsCompleted === 0) {
        await releaseDailySummary(child._id, dayKey);
        return;
      }

      const content = buildDailySummary({
        childFirstName: data.childFirstName,
        today: data.today,
        progress: {
          subjects: data.subjects,
          streak: data.streak,
          stageLabel: data.stageLabel,
        },
      });

      const tmpl = dailySummaryTemplate({
        parentName: parent.full_name,
        content,
        childDetailUrl: `${appUrl()}/dashboard/children/${child._id.toHexString()}`,
        settingsUrl: `${appUrl()}/settings`,
      });

      const res = await sendEmail({
        to: parent.email,
        subject: tmpl.subject,
        html: tmpl.html,
        text: tmpl.text,
      });
      if (!res.ok) await releaseDailySummary(child._id, dayKey);
    } catch (inner) {
      // Roll the claim back so a later completion today can retry.
      await releaseDailySummary(child._id, dayKey).catch(() => {});
      throw inner;
    }
  } catch (err) {
    console.error("[daily-summary email] failed (non-fatal):", err);
  }
}
