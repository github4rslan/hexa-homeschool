import "server-only";

/**
 * 24h traffic reader for the daily business-stats Slack digest. Reads
 * PostHog directly via the HogQL Query API (a personal API key, not the
 * public write-only project key), scoped to `properties.app = 'edway'`
 * (the shared project also carries an unrelated site's events, see
 * lib/analytics/server.ts).
 *
 * Degrades gracefully like every other optional integration in this repo:
 * missing POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID, or any fetch/parse
 * error, returns null rather than throwing so the rest of the digest still
 * sends.
 */
export interface TrafficPage {
  path: string;
  views: number;
}

export interface TrafficSource {
  /** Referring domain; PostHog's "$direct" is normalised to "direct". */
  source: string;
  views: number;
}

export interface DailyTraffic {
  pageviews: number;
  visitors: number;
  /** Busiest paths in the window, most-viewed first. Empty if unavailable. */
  topPages: TrafficPage[];
  /** Where the traffic came from, most-viewed first. Empty if unavailable. */
  topSources: TrafficSource[];
  /**
   * The SAME window one day earlier, so the digest can show whether today is
   * up or down. Null when that half of the query failed — the headline
   * numbers still render without it.
   */
  previous: { pageviews: number; visitors: number } | null;
}

/** How many busiest paths the digest lists. */
const TOP_PAGES_LIMIT = 5;

export async function getDailyTraffic(): Promise<DailyTraffic | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) return null;

  // Two small queries rather than one clever join: a single CROSS JOIN would
  // return zero rows on a day with no pageviews, losing the (legitimately 0)
  // totals. Run in parallel and let the top-pages half fail independently, so
  // a breakdown problem never costs us the headline numbers.
  const [totals, topPages, topSources, prevTotals] = await Promise.all([
    queryRows(apiKey, projectId, TOTALS_QUERY, "daily_digest_traffic"),
    queryRows(apiKey, projectId, TOP_PAGES_QUERY, "daily_digest_top_pages"),
    queryRows(apiKey, projectId, TOP_SOURCES_QUERY, "daily_digest_top_sources"),
    queryRows(apiKey, projectId, PREVIOUS_TOTALS_QUERY, "daily_digest_prev_traffic"),
  ]);

  const row = totals?.[0];
  if (!row || row.length < 2) return null;
  const [pageviews, visitors] = row;
  if (typeof pageviews !== "number" || typeof visitors !== "number") return null;

  return {
    pageviews,
    visitors,
    topPages: parseTopPages(topPages),
    topSources: parseTopSources(topSources),
    previous: parsePreviousTotals(prevTotals),
  };
}

const TOTALS_QUERY = `
  SELECT count() AS pageviews, uniq(person_id) AS visitors
  FROM events
  WHERE event = '$pageview'
    AND properties.app = 'edway'
    AND timestamp >= now() - INTERVAL 24 HOUR
`;

const TOP_PAGES_QUERY = `
  SELECT properties.$pathname AS path, count() AS views
  FROM events
  WHERE event = '$pageview'
    AND properties.app = 'edway'
    AND timestamp >= now() - INTERVAL 24 HOUR
  GROUP BY path
  ORDER BY views DESC
  LIMIT ${TOP_PAGES_LIMIT}
`;

const TOP_SOURCES_QUERY = `
  SELECT properties.$referring_domain AS src, count() AS views
  FROM events
  WHERE event = '$pageview'
    AND properties.app = 'edway'
    AND timestamp >= now() - INTERVAL 24 HOUR
  GROUP BY src
  ORDER BY views DESC
  LIMIT ${TOP_PAGES_LIMIT}
`;

/** The same 24h window, one day earlier — the "vs yesterday" baseline. */
const PREVIOUS_TOTALS_QUERY = `
  SELECT count() AS pageviews, uniq(person_id) AS visitors
  FROM events
  WHERE event = '$pageview'
    AND properties.app = 'edway'
    AND timestamp >= now() - INTERVAL 48 HOUR
    AND timestamp < now() - INTERVAL 24 HOUR
`;

async function queryRows(
  apiKey: string,
  projectId: string,
  query: string,
  name: string,
): Promise<unknown[][] | null> {
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ||
    "https://eu.i.posthog.com";

  try {
    const res = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query }, name }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: unknown[][] };
    return Array.isArray(data.results) ? data.results : null;
  } catch (err) {
    console.error(`[posthog-traffic] query "${name}" failed:`, err);
    return null;
  }
}

/** `$pathname` can come back null (unset on some events), so guard every row. */
function parseTopPages(rows: unknown[][] | null): TrafficPage[] {
  if (!rows) return [];
  const pages: TrafficPage[] = [];
  for (const row of rows) {
    const [path, views] = row;
    if (typeof views !== "number") continue;
    pages.push({ path: typeof path === "string" && path ? path : "(unknown)", views });
  }
  return pages;
}

function parseTopSources(rows: unknown[][] | null): TrafficSource[] {
  if (!rows) return [];
  const sources: TrafficSource[] = [];
  for (const row of rows) {
    const [src, views] = row;
    if (typeof views !== "number") continue;
    // PostHog reports untracked/typed-in traffic as the literal "$direct".
    const raw = typeof src === "string" && src ? src : "(unknown)";
    sources.push({ source: raw === "$direct" ? "direct" : raw, views });
  }
  return sources;
}

function parsePreviousTotals(
  rows: unknown[][] | null,
): { pageviews: number; visitors: number } | null {
  const row = rows?.[0];
  if (!row || row.length < 2) return null;
  const [pageviews, visitors] = row;
  if (typeof pageviews !== "number" || typeof visitors !== "number") return null;
  return { pageviews, visitors };
}
