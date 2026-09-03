import { describe, it, expect } from "vitest";
import { formatDailyStatsMessage } from "@/lib/monitoring/daily-stats-message";
import type {
  DailyAccountDetail,
  DailyBusinessStats,
  PlatformTotals,
} from "@/lib/db/repo";
import type { DailyTraffic } from "@/lib/monitoring/posthog-traffic";

const stats = (overrides: Partial<DailyBusinessStats> = {}): DailyBusinessStats => ({
  signupsToday: 0,
  subscriptionsActivatedToday: 0,
  lessonsCompletedToday: 0,
  activeFamiliesToday: 0,
  signups: [],
  subscriptions: [],
  ...overrides,
});

const traffic = (overrides: Partial<DailyTraffic> = {}): DailyTraffic => ({
  pageviews: 0,
  visitors: 0,
  topPages: [],
  topSources: [],
  previous: null,
  ...overrides,
});

const totals = (overrides: Partial<PlatformTotals> = {}): PlatformTotals => ({
  parents: 0,
  children: 0,
  newsletterSubscribers: 0,
  openEscalations: 0,
  payingStandard: 0,
  payingFamily: 0,
  trialing: 0,
  ...overrides,
});

const account = (n: number): DailyAccountDetail => ({
  fullName: `Parent ${n}`,
  email: `parent${n}@example.com`,
  tier: "diagnostic",
  at: new Date("2026-09-03T09:14:00.000Z"),
});

describe("formatDailyStatsMessage", () => {
  it("reports real numbers on a normal day", () => {
    const msg = formatDailyStatsMessage(
      stats({
        signupsToday: 5,
        subscriptionsActivatedToday: 2,
        lessonsCompletedToday: 41,
        activeFamiliesToday: 17,
      }),
      traffic({ pageviews: 320, visitors: 90 }),
    );
    expect(msg).toContain("Signups: 5");
    expect(msg).toContain("Subscriptions activated: 2");
    expect(msg).toContain("Traffic: 320 pageviews, 90 visitors");
    expect(msg).toContain("Lessons completed: 41");
    expect(msg).toContain("Active families: 17");
  });

  it("names each signup with email, tier and time under the count", () => {
    const msg = formatDailyStatsMessage(
      stats({ signupsToday: 2, signups: [account(1), account(2)] }),
      traffic(),
    );
    expect(msg).toContain(
      "  Parent 1 <parent1@example.com>, tier diagnostic, 2026-09-03 09:14 UTC",
    );
    expect(msg).toContain("  Parent 2 <parent2@example.com>, tier diagnostic");
    // The named rows sit directly beneath their count, not at the end.
    const lines = msg.split("\n");
    expect(lines[1]).toBe("Signups: 2");
    expect(lines[2]).toContain("Parent 1");
  });

  it("names each activated subscription too", () => {
    const msg = formatDailyStatsMessage(
      stats({
        subscriptionsActivatedToday: 1,
        subscriptions: [{ ...account(9), tier: "family" }],
      }),
      traffic(),
    );
    expect(msg).toContain("Subscriptions activated: 1");
    expect(msg).toContain("  Parent 9 <parent9@example.com>, tier family");
  });

  it("handles a parent with no name on file", () => {
    const msg = formatDailyStatsMessage(
      stats({ signupsToday: 1, signups: [{ ...account(3), fullName: null }] }),
      traffic(),
    );
    expect(msg).toContain("  (no name) <parent3@example.com>");
  });

  it("caps the list and says how many more there were", () => {
    const listed = Array.from({ length: 25 }, (_, i) => account(i + 1));
    const msg = formatDailyStatsMessage(
      stats({ signupsToday: 60, signups: listed }),
      traffic(),
    );
    expect(msg).toContain("Signups: 60");
    expect(msg).toContain("  Parent 25 <parent25@example.com>");
    expect(msg).toContain("  and 35 more");
    // 1 header + 1 count + 25 rows + 1 "and more" + traffic + 2 count lines
    expect(msg.split("\n").filter((l) => l.startsWith("  Parent "))).toHaveLength(25);
  });

  it("omits the list entirely when nobody signed up", () => {
    const msg = formatDailyStatsMessage(stats(), traffic());
    expect(msg).toContain("Signups: 0");
    expect(msg).not.toContain("and 0 more");
    expect(msg).not.toMatch(/@/);
  });

  it("lists the busiest pages when PostHog returned them", () => {
    const msg = formatDailyStatsMessage(
      stats(),
      traffic({
        pageviews: 300,
        visitors: 80,
        topPages: [
          { path: "/", views: 120 },
          { path: "/pricing", views: 60 },
        ],
      }),
    );
    expect(msg).toContain("Top pages: / (120), /pricing (60)");
  });

  it("omits the top-pages line when that half of the traffic query failed", () => {
    const msg = formatDailyStatsMessage(stats(), traffic({ pageviews: 5, visitors: 2 }));
    expect(msg).toContain("Traffic: 5 pageviews, 2 visitors");
    expect(msg).not.toContain("Top pages:");
  });

  it("reports zeroes plainly on a quiet day", () => {
    const msg = formatDailyStatsMessage(stats(), traffic());
    expect(msg).toContain("Signups: 0");
    expect(msg).toContain("Subscriptions activated: 0");
    expect(msg).toContain("Lessons completed: 0");
    expect(msg).toContain("Active families: 0");
    expect(msg).toContain("Traffic: 0 pageviews, 0 visitors");
  });

  it("says traffic is not configured when PostHog is null, instead of omitting the line", () => {
    const msg = formatDailyStatsMessage(stats(), null);
    expect(msg).toContain("Traffic: not configured yet");
    expect(msg).toContain("POSTHOG_PERSONAL_API_KEY");
    expect(msg).toContain("POSTHOG_PROJECT_ID");
  });

  it("keeps child-derived figures aggregate: counts only, never a per-child row", () => {
    const msg = formatDailyStatsMessage(
      stats({
        lessonsCompletedToday: 41,
        activeFamiliesToday: 17,
        signupsToday: 1,
        signups: [account(1)],
      }),
      traffic({ pageviews: 10, visitors: 4 }),
    );
    const lessonLines = msg.split("\n").filter((l) => l.includes("Lessons completed"));
    expect(lessonLines).toEqual(["Lessons completed: 41"]);
    const familyLines = msg.split("\n").filter((l) => l.includes("Active families"));
    expect(familyLines).toEqual(["Active families: 17"]);
  });
  it("shows the previous period alongside each count so a number means something", () => {
    const msg = formatDailyStatsMessage(
      stats({ signupsToday: 5, lessonsCompletedToday: 2, activeFamiliesToday: 3 }),
      traffic({ pageviews: 320, visitors: 90, previous: { pageviews: 100, visitors: 40 } }),
      stats({ signupsToday: 2, lessonsCompletedToday: 9, activeFamiliesToday: 3 }),
    );
    expect(msg).toContain("Signups: 5 (prev 2, up)");
    expect(msg).toContain("Lessons completed: 2 (prev 9, down)");
    expect(msg).toContain("Active families: 3 (prev 3, same)");
    expect(msg).toContain("90 visitors (prev 40, up)");
  });

  it("omits the comparison entirely when there is no baseline", () => {
    const msg = formatDailyStatsMessage(stats({ signupsToday: 5 }), traffic());
    expect(msg).toContain("Signups: 5");
    expect(msg).not.toContain("prev");
  });

  it("lists traffic sources and the visitor-to-signup rate", () => {
    const msg = formatDailyStatsMessage(
      stats({ signupsToday: 3 }),
      traffic({
        pageviews: 200,
        visitors: 60,
        topSources: [
          { source: "google", views: 30 },
          { source: "direct", views: 20 },
        ],
      }),
    );
    expect(msg).toContain("Top sources: google (30), direct (20)");
    expect(msg).toContain("Visitor to signup: 5.0%");
  });

  it("does not divide by zero visitors", () => {
    const msg = formatDailyStatsMessage(stats({ signupsToday: 0 }), traffic({ visitors: 0 }));
    expect(msg).not.toContain("Visitor to signup");
  });

  it("renders running totals with an estimated MRR from the paid tiers", () => {
    const msg = formatDailyStatsMessage(
      stats(),
      traffic(),
      null,
      totals({
        parents: 27,
        children: 41,
        newsletterSubscribers: 112,
        payingStandard: 4,
        payingFamily: 2,
        trialing: 3,
        openEscalations: 1,
      }),
    );
    expect(msg).toContain("Parents: 27, children: 41, newsletter: 112");
    expect(msg).toContain("Paying: 6 (4 standard, 2 family), trialing: 3");
    // 4 x 49 + 2 x 99 = 394
    expect(msg).toContain("Est. MRR: £394 (at monthly list prices)");
    expect(msg).toContain("Open escalations: 1");
  });

  it("omits the totals block when totals are unavailable", () => {
    const msg = formatDailyStatsMessage(stats(), traffic());
    expect(msg).not.toContain("Running totals");
  });
});
