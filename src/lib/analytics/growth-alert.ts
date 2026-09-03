import "server-only";

/**
 * Real-time Slack ping for genuine growth moments (a real signup, a real
 * subscription) — a separate channel from the integration-health monitor's
 * outage-alerts webhook, so business signal never gets buried in, or
 * dilutes, incident noise.
 *
 * Best-effort: never throws, never blocks the caller. Unset
 * SLACK_GROWTH_WEBHOOK_URL = silently skipped, same graceful-degradation
 * pattern as every other integration in this repo. Messages carry no PII —
 * no parent email/name/id, plain business-event text only.
 */
export async function postGrowthPing(message: string): Promise<void> {
  const url = process.env.SLACK_GROWTH_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.error("[growth-alert] Slack webhook post failed:", res.status);
    }
  } catch (err) {
    console.error("[growth-alert] Slack webhook post threw:", err);
  }
}
