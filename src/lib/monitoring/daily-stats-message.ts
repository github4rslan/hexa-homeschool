import type {
  DailyAccountDetail,
  DailyBusinessStats,
  PlatformTotals,
} from "@/lib/db/repo";
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

/**
 * Monthly list prices (GBP) per paid tier, from lib/billing/stripe.ts's
 * documented mapping. MRR built from these is an ESTIMATE and labelled as one:
 * annual subscribers pay a discounted yearly amount and the billing interval
 * isn't stored per parent, so an annual account is counted here at its monthly
 * rate. Good enough for a daily pulse; never quote it as revenue truth.
 */
const MONTHLY_PRICE_GBP = { standard: 49, family: 99 } as const;

export function formatDailyStatsMessage(
  mongoStats: DailyBusinessStats,
  traffic: DailyTraffic | null,
  previous?: DailyBusinessStats | null,
  totals?: PlatformTotals | null,
): string {
  const lines = [
    "Edway daily stats (last 24h)",
    `Signups: ${mongoStats.signupsToday}${delta(mongoStats.signupsToday, previous?.signupsToday)}`,
    ...detailLines(mongoStats.signups ?? [], mongoStats.signupsToday),
    `Subscriptions activated: ${mongoStats.subscriptionsActivatedToday}${delta(
      mongoStats.subscriptionsActivatedToday,
      previous?.subscriptionsActivatedToday,
    )}`,
    ...detailLines(mongoStats.subscriptions ?? [], mongoStats.subscriptionsActivatedToday),
    ...trafficLines(traffic, mongoStats.signupsToday),
    `Lessons completed: ${mongoStats.lessonsCompletedToday}${delta(
      mongoStats.lessonsCompletedToday,
      previous?.lessonsCompletedToday,
    )}`,
    `Active families: ${mongoStats.activeFamiliesToday}${delta(
      mongoStats.activeFamiliesToday,
      previous?.activeFamiliesToday,
    )}`,
    ...totalsLines(totals),
  ];
  return lines.join("\n");
}

/**
 * " (prev 3) up" / " (prev 5) down" / " (prev 4) same", or "" when there's no
 * baseline. Words, not arrows: Slack renders these in a plain-text block and
 * an arrow glyph reads as noise next to the numbers.
 */
function delta(current: number, prev: number | undefined): string {
  if (prev === undefined || prev === null) return "";
  const direction = current > prev ? "up" : current < prev ? "down" : "same";
  return ` (prev ${prev}, ${direction})`;
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

function trafficLines(traffic: DailyTraffic | null, signups: number): string[] {
  if (traffic === null) {
    return [
      "Traffic: not configured yet (set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID)",
    ];
  }

  const lines = [
    `Traffic: ${traffic.pageviews} pageviews, ${traffic.visitors} visitors${delta(
      traffic.visitors,
      traffic.previous?.visitors,
    )}`,
  ];

  const pages = traffic.topPages ?? [];
  if (pages.length > 0) {
    lines.push(`Top pages: ${pages.map((p) => `${p.path} (${p.views})`).join(", ")}`);
  }

  const sources = traffic.topSources ?? [];
  if (sources.length > 0) {
    lines.push(`Top sources: ${sources.map((s) => `${s.source} (${s.views})`).join(", ")}`);
  }

  // Only meaningful with visitors to divide by; 0 visitors is not a 0% funnel.
  if (traffic.visitors > 0) {
    const rate = ((signups / traffic.visitors) * 100).toFixed(1);
    lines.push(`Visitor to signup: ${rate}%`);
  }

  return lines;
}

function totalsLines(totals: PlatformTotals | null | undefined): string[] {
  if (!totals) return [];
  const paying = totals.payingStandard + totals.payingFamily;
  const mrr =
    totals.payingStandard * MONTHLY_PRICE_GBP.standard +
    totals.payingFamily * MONTHLY_PRICE_GBP.family;

  return [
    "",
    "Running totals",
    `Parents: ${totals.parents}, children: ${totals.children}, newsletter: ${totals.newsletterSubscribers}`,
    `Paying: ${paying} (${totals.payingStandard} standard, ${totals.payingFamily} family), trialing: ${totals.trialing}`,
    `Est. MRR: £${mrr} (at monthly list prices)`,
    `Open escalations: ${totals.openEscalations}`,
  ];
}
