import "server-only";
import { postGrowthPing } from "./growth-alert";

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
 * (growth-alert.ts), independent of whether PostHog itself is configured.
 */
const GROWTH_PING_EVENTS: Record<string, (p?: Record<string, unknown>) => string> = {
  signup_completed: () => "New signup on Edway.",
  subscription_active: (p) => `New subscription on Edway (tier: ${p?.tier ?? "unknown"}).`,
};

export function captureServer(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): void {
  const pingText = GROWTH_PING_EVENTS[event]?.(properties);
  if (pingText) void postGrowthPing(pingText);

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
