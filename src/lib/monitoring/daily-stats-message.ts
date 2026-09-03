import type { DailyAccountDetail, DailyBusinessStats } from "@/lib/db/repo";
import type { DailyTraffic } from "@/lib/monitoring/posthog-traffic";
import { formatUtcMinute } from "@/lib/utils";

/**
 * Pure formatter for the daily business-stats Slack digest.
 *
 * Privacy position (owner-approved, deliberate): the digest names the ADULT
 * account holders who signed up or subscribed in the window (name, email,
 * tier, timestamp), because a bare count isn't actionable. The UK GDPR
 * tradeoff (the Slack workspace holds adult customer data) was accepted by the
 * owner. Child-derived figures stay aggregate and non-identifying: "Lessons
 * completed" and "Active families" are counts and must never be broken down
 * per child, and no child name, age, topic, score or escalation detail belongs
 * in this message (Children's Code, see .claude/rules/child-safety.md).
 */

/** Named rows rendered per section before the message collapses to a summary line. */
const MAX_LISTED = 25;

export function formatDailyStatsMessage(
  mongoStats: DailyBusinessStats,
  traffic: DailyTraffic | null,
): string {
  const lines = [
    "Edway daily stats (last 24h)",
    `Signups: ${mongoStats.signupsToday}`,
    ...detailLines(mongoStats.signups ?? [], mongoStats.signupsToday),
    `Subscriptions activated: ${mongoStats.subscriptionsActivatedToday}`,
    ...detailLines(mongoStats.subscriptions ?? [], mongoStats.subscriptionsActivatedToday),
    ...trafficLines(traffic),
    `Lessons completed: ${mongoStats.lessonsCompletedToday}`,
    `Active families: ${mongoStats.activeFamiliesToday}`,
  ];
  return lines.join("\n");
}

/**
 * One indented line per named account, capped at MAX_LISTED with an
 * "and N more" tail so a signup spike can't produce an absurd Slack post.
 * `total` is the true count from Mongo, which can exceed the listed rows
 * because the query itself is capped.
 */
function detailLines(details: DailyAccountDetail[], total: number): string[] {
  if (details.length === 0) return [];
  const listed = details.slice(0, MAX_LISTED);
  const lines = listed.map(
    (d) =>
      `  ${d.fullName?.trim() || "(no name)"} <${d.email}>, tier ${d.tier ?? "unknown"}, ${formatUtcMinute(d.at)}`,
  );
  const remaining = Math.max(total, details.length) - listed.length;
  if (remaining > 0) lines.push(`  and ${remaining} more`);
  return lines;
}

function trafficLines(traffic: DailyTraffic | null): string[] {
  if (traffic === null) {
    return [
      "Traffic: not configured yet (set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID)",
    ];
  }
  const lines = [`Traffic: ${traffic.pageviews} pageviews, ${traffic.visitors} visitors`];
  const pages = traffic.topPages ?? [];
  if (pages.length > 0) {
    lines.push(`Top pages: ${pages.map((p) => `${p.path} (${p.views})`).join(", ")}`);
  }
  return lines;
}
