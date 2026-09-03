import { NextResponse } from "next/server";
import { getDailyBusinessStats } from "@/lib/db/repo";
import { getDailyTraffic } from "@/lib/monitoring/posthog-traffic";
import { formatDailyStatsMessage } from "@/lib/monitoring/daily-stats-message";
import { verifySlackCommand } from "@/lib/slack/verify-command";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/slack/command — the `/edway-stats` slash command.
 *
 * Runs the same 24h roll-up as the daily cron (`/api/digest/daily-stats`) but
 * on demand from either Slack channel, so the owner never has to wait for the
 * 08:00 UTC firing or reach for curl.
 *
 * SECURITY: this URL is public (Slack must reach it), so the signature check in
 * `lib/slack/verify-command.ts` is the entire gate — see that file. Missing
 * SLACK_SIGNING_SECRET = 503 rather than an open endpoint; a request that
 * fails verification gets 401 and does no work.
 *
 * Slack expects a reply within 3s. The reply is `ephemeral` (visible only to
 * whoever typed the command) and carries the stats directly, so unlike the
 * cron this does NOT post through the webhook — otherwise every manual check
 * would also spam the channel.
 *
 * The response names adult account holders, same owner-approved decision as the
 * daily digest (`daily-stats-message.ts`); child-derived figures stay aggregate.
 */
export async function POST(request: Request) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { error: "Slack commands not configured. Set SLACK_SIGNING_SECRET." },
      { status: 503 },
    );
  }

  // The signature is over the RAW body, so read it as text and never re-encode.
  const rawBody = await request.text();
  const verdict = verifySlackCommand({
    rawBody,
    signature: request.headers.get("x-slack-signature"),
    timestamp: request.headers.get("x-slack-request-timestamp"),
    signingSecret,
  });
  if (!verdict.ok) {
    console.warn(`[slack-command] rejected: ${verdict.reason}`);
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [mongoStats, traffic] = await Promise.all([
    getDailyBusinessStats(since),
    getDailyTraffic(),
  ]);

  return NextResponse.json(
    {
      response_type: "ephemeral",
      text: formatDailyStatsMessage(mongoStats, traffic),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
