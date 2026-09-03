import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/auth/cron-auth";
import { checkAllIntegrationsHealth } from "@/lib/monitoring/integration-health";
import { sendAlert } from "@/lib/monitoring/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/monitor/integrations: the recurring read-only health check for
 * every external integration besides email (email has its own, more detailed
 * monitor at /api/monitor/email-delivery). Triggered by Vercel Cron (see
 * vercel.json), which sends `Authorization: Bearer ${CRON_SECRET}`
 * automatically; it can also be invoked by hand with the same header.
 *
 * Checks OpenAI, Cloudinary, Stripe, ElevenLabs and Twilio with one cheap,
 * read-only, credentials-proving call each (never a real charge, SMS, email
 * or generation). A service with no credentials configured is reported
 * "unconfigured" and never causes a 503 by itself. Any configured-but-
 * unhealthy service raises an alert on two independent channels (Sentry +,
 * if SLACK_ALERTS_WEBHOOK_URL is set, Slack) and the route returns 503.
 *
 * Privacy: the payload and the alerts hold service name, status and a plain
 * failure reason only, mirroring the email delivery monitor. No credentials
 * and no user data: unlike the growth channel, an outage alert never names a
 * customer.
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

  const services = await checkAllIntegrationsHealth();
  const unhealthy = services.filter((s) => s.status === "problem");

  // Every alert carries the whole run's picture, so "one integration broke"
  // is instantly distinguishable from "everything is down".
  const healthy = services.filter((s) => s.status === "ok").map((s) => s.service);
  const unconfigured = services
    .filter((s) => s.status === "unconfigured")
    .map((s) => s.service);

  await Promise.all(
    unhealthy.map((s) =>
      sendAlert({
        service: s.service,
        message: s.detail,
        severity: "error",
        context: {
          alsoFailing: unhealthy.filter((o) => o.service !== s.service).map((o) => o.service),
          healthy,
          unconfigured,
        },
      }),
    ),
  );

  return NextResponse.json(
    { ok: unhealthy.length === 0, services },
    {
      status: unhealthy.length === 0 ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
