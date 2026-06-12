import "server-only";
import { findParentById } from "@/lib/db/repo";
import { sendEmail, emailConfigured } from "./send";
import { escalationAlertTemplate } from "./templates";
import { appUrl } from "./verification";

/**
 * Notify the parent by email when the safety gate freezes a session.
 *
 * Privacy: the email NEVER contains what the child wrote — only that a pause
 * happened and the severity. Details stay in the dashboard. Best-effort by
 * design: a Brevo failure or opt-out must never affect the freeze response.
 */
export async function sendEscalationAlert(
  parentId: string,
  childName: string,
  severity: string,
): Promise<void> {
  try {
    if (!emailConfigured()) return;
    const parent = await findParentById(parentId);
    if (!parent || parent.escalation_alert_opt_out) return;
    if (parent.email_verified === false) return;

    const tmpl = escalationAlertTemplate({
      parentName: parent.full_name,
      childFirstName: childName.split(" ")[0],
      severity,
      dashboardUrl: `${appUrl()}/dashboard`,
      settingsUrl: `${appUrl()}/settings`,
    });
    await sendEmail({ to: parent.email, subject: tmpl.subject, html: tmpl.html });
  } catch (err) {
    console.error("[escalation alert] failed (non-fatal):", err);
  }
}
