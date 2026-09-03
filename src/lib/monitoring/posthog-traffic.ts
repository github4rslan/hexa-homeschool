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
export interface DailyTraffic {
  pageviews: number;
  visitors: number;
}

export async function getDailyTraffic(): Promise<DailyTraffic | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) return null;

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
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: `
            SELECT count() AS pageviews, uniq(person_id) AS visitors
            FROM events
            WHERE event = '$pageview'
              AND properties.app = 'edway'
              AND timestamp >= now() - INTERVAL 24 HOUR
          `,
        },
        name: "daily_digest_traffic",
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { results?: unknown[][] };
    const row = data.results?.[0];
    if (!row || row.length < 2) return null;
    const [pageviews, visitors] = row;
    if (typeof pageviews !== "number" || typeof visitors !== "number") return null;

    return { pageviews, visitors };
  } catch (err) {
    console.error("[posthog-traffic] query failed:", err);
    return null;
  }
}
