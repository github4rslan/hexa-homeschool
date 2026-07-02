import { NextResponse } from "next/server";
import { findDiagnosticNudgeCandidates } from "@/lib/db/repo";
import { emailConfigured } from "@/lib/email/send";
import { sendLifecycleEmail } from "@/lib/email/lifecycle";
import { diagnosticNudgeTemplate } from "@/lib/email/templates";
import { appUrl } from "@/lib/email/verification";
import { cronAuthorized } from "@/lib/auth/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Account must be at least this old before the day-2 nudge fires. */
const NUDGE_MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Daily lifecycle email cron. Triggered by Vercel Cron (see vercel.json) with
 * `Authorization: Bearer ${CRON_SECRET}`. Currently sends the day-2 diagnostic
 * nudge to parents who added a child but never ran a diagnostic. Each lifecycle
 * email is idempotent (claimed in Mongo before sending), so re-runs and overlaps
 * never double-send. The welcome and first-plan emails are transactional and
 * fire from their own flows — not here.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Lifecycle emails not configured. Set CRON_SECRET to enable." },
      { status: 503 },
    );
  }
  if (!cronAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!emailConfigured()) {
    return NextResponse.json(
      { error: "Email not configured. Set BREVO_API_KEY to enable." },
      { status: 503 },
    );
  }

  let nudgeSent = 0;
  let nudgeSkipped = 0;
  let nudgeFailed = 0;

  const candidates = await findDiagnosticNudgeCandidates(NUDGE_MIN_AGE_MS);
  for (const { parent, firstChildName } of candidates) {
    if (!parent._id) continue;
    const parentId = parent._id.toHexString();
    try {
      const res = await sendLifecycleEmail(parentId, "diagnostic_nudge", () => {
        const tmpl = diagnosticNudgeTemplate({
          name: parent.full_name,
          childName: firstChildName,
          diagnosticUrl: `${appUrl()}/onboarding/diagnostic`,
          settingsUrl: `${appUrl()}/settings`,
        });
        return { to: parent.email, subject: tmpl.subject, html: tmpl.html };
      });
      if (res.sent) nudgeSent++;
      else if (res.reason === "send-failed") nudgeFailed++;
      else nudgeSkipped++;
    } catch (err) {
      nudgeFailed++;
      console.error("[lifecycle] nudge failed for parent", parentId, err);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      diagnostic_nudge: {
        candidates: candidates.length,
        sent: nudgeSent,
        skipped: nudgeSkipped,
        failed: nudgeFailed,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
