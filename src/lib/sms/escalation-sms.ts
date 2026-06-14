import "server-only";
import { findParentById } from "@/lib/db/repo";
import { sendSms, smsConfigured } from "./twilio";

/**
 * Immediate-severity safety SMS to the parent.
 *
 * Fires ONLY for severity "immediate". Calm and actionable, with NO alarming
 * detail over SMS — the dashboard holds the context. Best-effort: unset Twilio,
 * no parent phone, or any send failure is a silent skip/log and must NEVER
 * block or delay the freeze/escalation path.
 */
export async function sendImmediateEscalationSms(
  parentId: string,
  childName: string,
  severity: string,
): Promise<void> {
  try {
    if (severity !== "immediate") return;
    if (!smsConfigured()) return;
    const parent = await findParentById(parentId);
    if (!parent?.phone) return;

    const firstName = childName.split(" ")[0];
    const body = `HEXA: ${firstName} may need you — please check on them and see your dashboard.`;
    await sendSms(parent.phone, body);
  } catch (err) {
    console.error("[escalation sms] failed (non-fatal):", err);
  }
}
