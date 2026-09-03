import { NextResponse, after } from "next/server";
import { getDailyBusinessStats, getPlatformTotals } from "@/lib/db/repo";
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
 * Slack hangs up at 3 seconds ("operation_timeout"), and the full roll-up is
 * too slow for that, so this acks instantly and posts the real answer to the
 * request's `response_url` from `after()`. Both messages are `ephemeral`
 * (visible only to whoever typed the command), so unlike the cron this never
 * posts through the channel webhook — otherwise every manual check would spam
 * the channel.
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

  // Slack hangs up at 3s with "operation_timeout". The full roll-up is four
  // PostHog round trips plus two Mongo passes, which does not reliably fit, so
  // acknowledge immediately and deliver the real answer to `response_url`
  // (Slack keeps it open for 30 minutes). `after()` runs the work once the
  // response is already on the wire, so the function is not killed first.
  const responseUrl = new URLSearchParams(rawBody).get("response_url");
  if (!responseUrl) {
    return NextResponse.json({ error: "Missing response_url." }, { status: 400 });
  }

  after(async () => {
    try {
      const now = Date.now();
      const since = new Date(now - 24 * 60 * 60 * 1000);
      const prevSince = new Date(now - 48 * 60 * 60 * 1000);
      const [mongoStats, previous, traffic, totals] = await Promise.all([
        getDailyBusinessStats(since),
        getDailyBusinessStats(prevSince, since),
        getDailyTraffic(),
        getPlatformTotals(),
      ]);
      await postToResponseUrl(
        responseUrl,
        formatDailyStatsMessage(mongoStats, traffic, previous, totals),
      );
    } catch (err) {
      console.error("[slack-command] stats lookup failed:", err);
      // Tell the user something went wrong rather than leaving "Fetching…"
      // as the last word.
      await postToResponseUrl(
        responseUrl,
        "Couldn't fetch the stats just now. Check Vercel logs for /api/slack/command.",
      ).catch(() => {});
    }
  });

  return NextResponse.json(
    { response_type: "ephemeral", text: "Fetching your stats…" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Deliver the real answer to the caller, privately, after the 3s ack. */
async function postToResponseUrl(responseUrl: string, text: string): Promise<void> {
  const res = await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response_type: "ephemeral", text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    console.error("[slack-command] response_url post failed:", res.status);
  }
}
