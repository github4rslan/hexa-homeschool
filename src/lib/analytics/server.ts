import "server-only";
import { postGrowthPing } from "./growth-alert";
import { formatGrowthPing, isGrowthPingEvent } from "./growth-message";

/**
 * Server-side PostHog capture for funnel moments that happen in server
 * actions / route handlers (signup completed, checkout started, subscription
 * active, …). Fire-and-forget: analytics must never slow down or break the
 * request. No-op when NEXT_PUBLIC_POSTHOG_KEY is unset.
 *
 * Children's Code: distinct_id is always the PARENT's Mongo id; never pass a
 * child id, child name, or any per-child behavioural detail in properties.
 *
 * The PostHog project is shared with another, unrelated site, so every event
 * carries `app: "edway"` (below) — filter on it in any insight/dashboard or
 * the two products' stats mix together.
 *
 * A real signup or subscription also fires a real-time Slack ping
 * (growth-alert.ts), independent of whether PostHog itself is configured. That
 * ping deliberately names the PARENT (name, email, tier, signup time), an
 * owner-approved decision: only the private growth channel receives it, and it
 * is adult/account data only, never anything about a child. PostHog properties
 * are unaffected and stay identity-free; the parent detail is looked up
 * separately for Slack.
 */
export function captureServer(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (isGrowthPingEvent(event)) void dispatchGrowthPing(distinctId, event, properties);

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ||
    "https://eu.i.posthog.com";
  void fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      event,
      distinct_id: distinctId,
      properties: { ...properties, app: "edway", $lib: "hexa-server" },
      timestamp: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(3000),
  }).catch((err) => {
    console.error(`[analytics] server capture "${event}" failed:`, err);
  });
}

/**
 * Look the parent up (best-effort) and post the detailed growth ping. The repo
 * import is dynamic so the Mongo client is only loaded on the two events that
 * actually need it, and every failure path (bad id, missing row, DB down)
 * degrades to the generic message instead of throwing: this runs detached from
 * a signup request and must never break it.
 */
async function dispatchGrowthPing(
  parentId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    let contact = null;
    try {
      const { getParentContactForAlert } = await import("@/lib/db/repo");
      contact = await getParentContactForAlert(parentId);
    } catch (err) {
      console.error("[analytics] growth ping parent lookup failed:", err);
    }
    const text = formatGrowthPing(event, contact, properties);
    if (text) await postGrowthPing(text);
  } catch (err) {
    console.error("[analytics] growth ping dispatch failed:", err);
  }
}
