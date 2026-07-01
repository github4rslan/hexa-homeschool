import { NextResponse } from "next/server";
import {
  listEventNotificationRecipients,
  inactivityNudgeChildren,
} from "@/lib/db/repo";
import { emitInactivityEvent } from "@/lib/notify/parent-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Gentle inactivity reminder (Wave 7, Phase 5). Triggered by Vercel Cron once
 * each evening (see vercel.json) — Vercel sends `Authorization: Bearer
 * ${CRON_SECRET}` automatically. Can also be invoked manually with the header.
 *
 * For each opted-in parent, find children who were active in the last 14 days
 * but haven't completed a lesson TODAY, and send the parent a warm, low-key
 * reminder (email + SMS where enabled), deduped once per child per day via the
 * parent_events feed. A child who has never started, or who already learned
 * today, is never nudged. This is a PARENT reminder — no child is tracked,
 * profiled, or targeted with an engagement loop (Children's Code).
 *
 * Fully best-effort: unset Brevo/Twilio, opt-outs, and send failures are silent
 * no-ops handled downstream — this route just orchestrates and reports counts.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Not configured. Set CRON_SECRET to enable inactivity nudges." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let parents = 0;
  let nudged = 0;

  const recipients = await listEventNotificationRecipients();
  for (const parent of recipients) {
    if (!parent._id) continue;
    parents++;
    try {
      const parentId = parent._id.toHexString();
      const idleChildren = await inactivityNudgeChildren(parentId);
      for (const child of idleChildren) {
        await emitInactivityEvent({ parentId, child });
        nudged++;
      }
    } catch (err) {
      console.error(
        "[inactivity nudge] failed for parent",
        parent._id.toHexString(),
        err,
      );
    }
  }

  return NextResponse.json(
    { ok: true, recipients: parents, nudged },
    { headers: { "Cache-Control": "no-store" } },
  );
}
