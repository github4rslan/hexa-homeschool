import type { DailyBusinessStats } from "@/lib/db/repo";
import type { DailyTraffic } from "@/lib/monitoring/posthog-traffic";

/**
 * Pure formatter for the daily business-stats Slack digest. Counts only, no
 * PII (no parent/child name, email, or id) — matches the growth-alert
 * messages this posts alongside.
 */
export function formatDailyStatsMessage(
  mongoStats: DailyBusinessStats,
  traffic: DailyTraffic | null,
): string {
  const trafficLine =
    traffic === null
      ? "Traffic: not configured yet (set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID)"
      : `Traffic: ${traffic.pageviews} pageviews, ${traffic.visitors} visitors`;

  return [
    "Edway daily stats (last 24h)",
    `Signups: ${mongoStats.signupsToday}`,
    `Subscriptions activated: ${mongoStats.subscriptionsActivatedToday}`,
    trafficLine,
    `Lessons completed: ${mongoStats.lessonsCompletedToday}`,
    `Active families: ${mongoStats.activeFamiliesToday}`,
  ].join("\n");
}
