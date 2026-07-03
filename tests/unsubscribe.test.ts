import { describe, expect, it, beforeAll } from "vitest";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe";
import { decideReengagement } from "@/lib/engine/reengagement";
import {
  unsubscribePageHtml,
  UNSUBSCRIBE_DONE,
} from "@/lib/email/unsubscribe-page";

const DAY = 24 * 60 * 60 * 1000;

describe("unsubscribe token round-trip", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long-000";
  });

  it("mints a token that verifies back to the same parentId", async () => {
    const token = await createUnsubscribeToken("parent-123");
    expect(await verifyUnsubscribeToken(token)).toBe("parent-123");
  });

  it("rejects a garbage token", async () => {
    expect(await verifyUnsubscribeToken("not-a-jwt")).toBeNull();
  });

  it("rejects a token signed with a different purpose/secret", async () => {
    process.env.AUTH_SECRET = "another-secret-16-chars-minimum-xyz";
    const token = await createUnsubscribeToken("p");
    process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long-000";
    expect(await verifyUnsubscribeToken(token)).toBeNull();
  });
});

describe("unsubscribe → no more re-engagement (the behavioural chain)", () => {
  it("an opted-out parent yields no email even when deeply idle", () => {
    // Setting marketing_emails_opt_out=true is exactly what the /unsubscribe
    // route does; the decision engine must then always return none.
    const d = decideReengagement({
      now: new Date("2026-07-03T09:00:00Z"),
      lastActive: new Date(Date.now() - 60 * DAY),
      tier: "diagnostic",
      billingStatus: "trialing",
      optedOut: true, // ← what unsubscribe sets
      state: { sentKeys: [], lastSentAt: null },
    });
    expect(d).toEqual({ action: "none", reason: "opted-out" });
  });
});

describe("unsubscribe confirmation page", () => {
  it("renders an on-brand success page", () => {
    const html = unsubscribePageHtml(UNSUBSCRIBE_DONE);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("You're unsubscribed");
    expect(html).toContain("Edway");
    expect(html).toContain("Account and safety emails will still reach you");
  });
});
