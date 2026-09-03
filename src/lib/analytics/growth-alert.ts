import "server-only";

/**
 * Real-time Slack ping for genuine growth moments (a real signup, a real
 * subscription) — a separate channel from the integration-health monitor's
 * outage-alerts webhook, so business signal never gets buried in, or
 * dilutes, incident noise.
 *
 * Best-effort: never throws, never blocks the caller. Unset
 * SLACK_GROWTH_WEBHOOK_URL = silently skipped, same graceful-degradation
 * pattern as every other integration in this repo.
 *
 * Privacy: messages posted here intentionally include PARENT/account detail
 * (name, email, tier, timestamps). That is a deliberate, owner-approved
 * decision made with the UK GDPR tradeoff understood: the destination Slack
 * workspace becomes a processor of adult customer data. It applies to adult
 * account holders ONLY. Never put a child's name, age, lesson, topic, score,
 * SEND status or escalation content in these messages: the Children's Code
 * invariant in CLAUDE.md and .claude/rules/child-safety.md is unchanged, and
 * child-derived numbers stay aggregate and non-identifying.
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
