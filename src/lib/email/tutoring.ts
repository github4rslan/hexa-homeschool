import "server-only";
import { emailConfigured, sendEmail } from "@/lib/email/send";

function esc(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(title: string, body: string, ctaUrl: string, ctaLabel: string): string {
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6;color:#17201b">
      <h1 style="font-size:22px;margin:0 0 12px;">${esc(title)}</h1>
      ${body}
      <p style="margin:24px 0 0;">
        <a href="${esc(ctaUrl)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">${esc(ctaLabel)}</a>
      </p>
      <p style="margin:18px 0 0;color:#667085;font-size:12px;">This is a transactional tutoring update from Edway.</p>
    </div>
  `;
}

async function sendTransactional(input: {
  to: string | null | undefined;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!emailConfigured() || !input.to) return;
  await sendEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  }).catch((err) => {
    console.error("[tutoring email] send failed (non-fatal):", err);
  });
}

export async function notifyTutorBookingRequested(input: {
  parentEmail: string;
  parentName: string | null;
  childName: string;
  requestedSlot: string;
  detailUrl: string;
}): Promise<void> {
  const firstName = input.parentName?.split(" ")[0] || "there";
  const body = `
    <p>Hi ${esc(firstName)},</p>
    <p>Your tutor request for <strong>${esc(input.childName)}</strong> has been received.</p>
    <p>Preferred time: <strong>${esc(input.requestedSlot || "Any time")}</strong></p>
    <p>We will email you again when the session is scheduled.</p>
  `;
  await sendTransactional({
    to: input.parentEmail,
    subject: "Your Edway tutor request was received",
    html: wrap("Tutor request received", body, input.detailUrl, "View tutoring"),
    text: `Your tutor request for ${input.childName} was received. View it: ${input.detailUrl}`,
  });
}

export async function notifyTutorSessionScheduled(input: {
  parentEmail: string;
  parentName: string | null;
  tutorEmail: string | null;
  tutorName: string | null;
  childName: string;
  scheduledAt: Date | null | undefined;
  durationMinutes: number | null | undefined;
  parentUrl: string;
  tutorUrl: string;
}): Promise<void> {
  const when = input.scheduledAt
    ? input.scheduledAt.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/London",
      })
    : "Scheduled";
  const duration = input.durationMinutes ? ` (${input.durationMinutes} minutes)` : "";

  await sendTransactional({
    to: input.parentEmail,
    subject: `Tutor session scheduled for ${input.childName}`,
    html: wrap(
      "Tutor session scheduled",
      `<p>Your session for <strong>${esc(input.childName)}</strong> is scheduled for <strong>${esc(when)}${esc(duration)}</strong>.</p><p>Tutor: <strong>${esc(input.tutorName ?? "Tutor")}</strong></p>`,
      input.parentUrl,
      "Join session",
    ),
    text: `Tutor session scheduled for ${input.childName}: ${when}${duration}. Join: ${input.parentUrl}`,
  });

  await sendTransactional({
    to: input.tutorEmail,
    subject: `New Edway tutoring session: ${input.childName}`,
    html: wrap(
      "You have a tutoring session",
      `<p>You have been assigned a session for <strong>${esc(input.childName)}</strong>.</p><p>Time: <strong>${esc(when)}${esc(duration)}</strong></p>`,
      input.tutorUrl,
      "Open session",
    ),
    text: `You have an Edway tutoring session for ${input.childName}: ${when}${duration}. Open: ${input.tutorUrl}`,
  });
}

export async function notifyTutorMessage(input: {
  to: string | null | undefined;
  recipientName: string | null;
  senderLabel: string;
  sessionUrl: string;
}): Promise<void> {
  const firstName = input.recipientName?.split(" ")[0] || "there";
  await sendTransactional({
    to: input.to,
    subject: `New tutoring message from ${input.senderLabel}`,
    html: wrap(
      "New tutoring message",
      `<p>Hi ${esc(firstName)},</p><p>${esc(input.senderLabel)} sent a message in your Edway tutoring thread.</p>`,
      input.sessionUrl,
      "Open message",
    ),
    text: `${input.senderLabel} sent a tutoring message. Open it: ${input.sessionUrl}`,
  });
}

export async function notifyTutorSessionCompleted(input: {
  parentEmail: string | null | undefined;
  parentName: string | null;
  childName: string;
  tutorName: string | null;
  sessionUrl: string;
}): Promise<void> {
  const firstName = input.parentName?.split(" ")[0] || "there";
  await sendTransactional({
    to: input.parentEmail,
    subject: `Tutor session completed for ${input.childName}`,
    html: wrap(
      "Tutor session completed",
      `<p>Hi ${esc(firstName)},</p><p>${esc(input.tutorName ?? "Your tutor")} has completed the session for <strong>${esc(input.childName)}</strong> and added notes.</p>`,
      input.sessionUrl,
      "View notes",
    ),
    text: `Tutor session completed for ${input.childName}. View notes: ${input.sessionUrl}`,
  });
}
