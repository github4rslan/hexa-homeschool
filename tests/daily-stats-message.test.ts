import { describe, it, expect } from "vitest";
import { formatDailyStatsMessage } from "@/lib/monitoring/daily-stats-message";
import type { DailyBusinessStats } from "@/lib/db/repo";

const stats = (overrides: Partial<DailyBusinessStats> = {}): DailyBusinessStats => ({
  signupsToday: 0,
  subscriptionsActivatedToday: 0,
  lessonsCompletedToday: 0,
  activeFamiliesToday: 0,
  ...overrides,
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
      { pageviews: 320, visitors: 90 },
    );
    expect(msg).toContain("Signups: 5");
    expect(msg).toContain("Subscriptions activated: 2");
    expect(msg).toContain("Traffic: 320 pageviews, 90 visitors");
    expect(msg).toContain("Lessons completed: 41");
    expect(msg).toContain("Active families: 17");
  });

  it("reports zeroes plainly on a quiet day", () => {
    const msg = formatDailyStatsMessage(stats(), { pageviews: 0, visitors: 0 });
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

  it("carries no PII: never a name or email substring", () => {
    const msg = formatDailyStatsMessage(
      stats({ signupsToday: 3 }),
      { pageviews: 10, visitors: 4 },
    );
    expect(msg).not.toMatch(/@/);
  });
});
