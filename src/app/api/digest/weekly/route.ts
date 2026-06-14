import { NextResponse } from "next/server";
import { listDigestRecipients, weeklyDigestForParent } from "@/lib/db/repo";
import { sendEmail, emailConfigured } from "@/lib/email/send";
import { weeklyDigestTemplate } from "@/lib/email/templates";
import { appUrl } from "@/lib/email/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Weekly parent progress digest. Triggered by Vercel Cron (see vercel.json) —
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when the
 * CRON_SECRET env var is set. Can also be invoked manually with the same header.
 *
 * For each opted-in parent with at least one child: summarise the last 7 days
 * per child (lessons completed, topics certified, escalation count) and send
 * one email. Fully-quiet families (zero activity across all children) are
 * skipped to avoid noise. Escalation details never leave the dashboard — the
 * email carries a count only.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Digest not configured. Set CRON_SECRET to enable it." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Email not configured. Set BREVO_API_KEY to enable the digest." },
      { status: 503 },
    );
  }

  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekLabel = `${formatDay(since)} – ${formatDay(now)}`;

  let sent = 0;
  let quiet = 0;
  let failed = 0;

  const recipients = await listDigestRecipients();
  for (const parent of recipients) {
    if (!parent._id) continue;
    try {
      const children = await weeklyDigestForParent(
        parent._id.toHexString(),
        since,
      );
      const hasActivity = children.some(
        (c) =>
          c.lessonsCompleted > 0 ||
          c.topicsCertified.length > 0 ||
          c.escalations > 0,
      );
      if (children.length === 0 || !hasActivity) {
        quiet++;
        continue;
      }
      const tmpl = weeklyDigestTemplate({
        parentName: parent.full_name,
        weekLabel,
        children,
        dashboardUrl: `${appUrl()}/dashboard`,
        escalationsUrl: `${appUrl()}/tutoring#escalations`,
        settingsUrl: `${appUrl()}/settings`,
      });
      const res = await sendEmail({
        to: parent.email,
        subject: tmpl.subject,
        html: tmpl.html,
      });
      if (res.ok) sent++;
      else failed++;
    } catch (err) {
      failed++;
      console.error("[digest] failed for parent", parent._id.toHexString(), err);
    }
  }

  return NextResponse.json(
    { ok: true, recipients: recipients.length, sent, quiet, failed },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** "8 June" — UK day-month, for the subject/body week label. */
function formatDay(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}
