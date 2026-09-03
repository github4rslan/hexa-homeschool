import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/auth/cron-auth";
import { getDailyBusinessStats } from "@/lib/db/repo";
import { getDailyTraffic } from "@/lib/monitoring/posthog-traffic";
import { formatDailyStatsMessage } from "@/lib/monitoring/daily-stats-message";
import { postGrowthPing } from "@/lib/analytics/growth-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/digest/daily-stats: a periodic Slack summary of real
 * business/product numbers, distinct from the two event-triggered Slack
 * integrations that already exist: `/api/monitor/integrations` (outage
 * alerts, SLACK_ALERTS_WEBHOOK_URL) and the real-time growth pings on
 * signup/subscription (lib/analytics/growth-alert.ts). This one is a
 * scheduled roll-up, posted to the same SLACK_GROWTH_WEBHOOK_URL channel so
 * business signal stays in one place. Triggered by Vercel Cron (see
 * vercel.json), which sends `Authorization: Bearer ${CRON_SECRET}`
 * automatically; can also be invoked by hand with the same header.
 *
 * Counts only, no PII: no parent/child name, email, or id ever appears in
 * the message.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Digest not configured. Set CRON_SECRET to enable it." },
      { status: 503 },
    );
  }
  if (!cronAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!process.env.SLACK_GROWTH_WEBHOOK_URL) {
    return NextResponse.json(
      {
        error:
          "Digest not configured. Set SLACK_GROWTH_WEBHOOK_URL to enable it.",
      },
      { status: 503 },
    );
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [mongoStats, traffic] = await Promise.all([
    getDailyBusinessStats(since),
    getDailyTraffic(),
  ]);

  const message = formatDailyStatsMessage(mongoStats, traffic);
  await postGrowthPing(message);

  return NextResponse.json(
    { ok: true, ...mongoStats, traffic },
    { headers: { "Cache-Control": "no-store" } },
  );
}
