import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cronAuthorized } from "@/lib/auth/cron-auth";
import { checkEmailDeliveryHealth } from "@/lib/email/delivery-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/monitor/email-delivery (F4): the recurring signup-email delivery
 * check. Triggered by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically; it can also be invoked
 * by hand with the same header.
 *
 * This closes a real detection gap: a provider that accepts a send with a 2xx
 * and rejects it asynchronously produced a five-day silent outage of signup
 * verification codes. So this reads the DELIVERY OUTCOME from Brevo (can the
 * sender send at all, and did recent sends actually get delivered) rather than
 * trusting the original response. A problem raises a Sentry warning and returns
 * 503, so the failure shows up both in Sentry and in the Vercel cron log.
 *
 * Privacy: the payload holds counts and the sending address only. No recipient,
 * no parent or child data, ever leaves this route.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Monitor not configured. Set CRON_SECRET to enable it." },
      { status: 503 },
    );
  }
  if (!cronAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const health = await checkEmailDeliveryHealth();

  if (health.status === "problem") {
    Sentry.captureMessage("Email delivery check failed", {
      level: "error",
      tags: { monitor: "email-delivery", sender_can_send: String(health.senderCanSend) },
      extra: {
        problems: health.problems,
        sender: health.senderEmail,
        events_inspected: health.eventsInspected,
        succeeded: health.succeeded,
        failed: health.failed,
        requested: health.requested,
      },
    });
  }

  return NextResponse.json(
    { ok: health.status !== "problem", ...health },
    {
      status: health.status === "problem" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
