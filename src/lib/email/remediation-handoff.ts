import "server-only";
import { findParentById } from "@/lib/db/repo";
import { sendEmail, emailConfigured } from "./send";
import { appUrl } from "./verification";
import { sendSms, smsConfigured } from "@/lib/sms/twilio";

export async function notifyRemediationHandoff(input: {
  parentId: string;
  childName: string;
  topicTitle: string;
}): Promise<void> {
  const firstName = input.childName.split(" ")[0];
  const detailUrl = `${appUrl()}/tutoring`;

  try {
    const parent = await findParentById(input.parentId);
    if (!parent) return;

    if (
      emailConfigured() &&
      parent.email_verified !== false &&
      !parent.escalation_alert_opt_out
    ) {
      await sendEmail({
        to: parent.email,
        subject: `${firstName} could use extra help with ${input.topicTitle}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#17201b">
            <h1 style="font-size:22px;margin:0 0 12px;">Extra help is lined up</h1>
            <p>${firstName} found <strong>${input.topicTitle}</strong> tricky today, so Edway gently paused that topic and queued a tutor request.</p>
            <p>Nothing is marked against them. Other lessons stay available, and this topic can continue with human support.</p>
            <p><a href="${detailUrl}" style="color:#2563eb;">View the tutoring request</a></p>
          </div>
        `,
        text: `${firstName} found ${input.topicTitle} tricky today, so Edway paused that topic and queued a tutor request. View it: ${detailUrl}`,
      });
    }

    if (smsConfigured() && parent.phone) {
      await sendSms(
        parent.phone,
        `Edway: ${firstName} is finding ${input.topicTitle} tricky. We've paused it and queued extra tutor help.`,
      );
    }
  } catch (err) {
    console.error("[remediation handoff] notify failed (non-fatal):", err);
  }
}
