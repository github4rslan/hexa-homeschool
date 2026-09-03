import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureServer } from "@/lib/analytics/server";
import { getParentContactForAlert } from "@/lib/db/repo";

// The growth ping looks the parent up through the repo. Mocked here so the
// suite stays pure logic: no Mongo client, no connection attempt.
vi.mock("@/lib/db/repo", () => ({
  getParentContactForAlert: vi.fn(),
}));

const lookup = vi.mocked(getParentContactForAlert);

const GROWTH_WEBHOOK = "https://hooks.slack.test/growth";

const CONTACT = {
  fullName: "Jane Smith",
  email: "jane@example.com",
  tier: "diagnostic" as const,
  billingStatus: "trialing" as const,
  createdAt: new Date("2026-09-03T14:22:31.000Z"),
};

function stubFetch() {
  const fetchMock = vi.fn<(url: unknown, init?: unknown) => Promise<{ ok: boolean }>>(
    () => Promise.resolve({ ok: true }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The request body of the first call to `url`, or null if there was none. */
function bodyFor(fetchMock: ReturnType<typeof stubFetch>, url: string): string | null {
  const call = fetchMock.mock.calls.find((c) => c[0] === url);
  if (!call) return null;
  return (call[1] as { body: string }).body;
}

/** The Slack text of the first growth-webhook call, or null if none happened. */
function slackText(fetchMock: ReturnType<typeof stubFetch>): string | null {
  const body = bodyFor(fetchMock, GROWTH_WEBHOOK);
  if (body === null) return null;
  return (JSON.parse(body) as { text: string }).text;
}

beforeEach(() => {
  vi.stubEnv("SLACK_GROWTH_WEBHOOK_URL", GROWTH_WEBHOOK);
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
  lookup.mockReset();
  lookup.mockResolvedValue(CONTACT);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("captureServer growth ping dispatch", () => {
  it("posts the parent's own name, email, tier and signup time on signup_completed", async () => {
    const fetchMock = stubFetch();

    captureServer("parent-123", "signup_completed", { verification: "link" });

    await vi.waitFor(() => expect(slackText(fetchMock)).not.toBeNull());
    expect(slackText(fetchMock)).toBe(
      [
        "New signup on Edway",
        "Name: Jane Smith",
        "Email: jane@example.com",
        "Tier: diagnostic",
        "Signed up: 2026-09-03 14:22 UTC",
        "Verification: link",
      ].join("\n"),
    );
    expect(lookup).toHaveBeenCalledWith("parent-123");
  });

  it("surfaces a bounced verification email in the signup ping", async () => {
    const fetchMock = stubFetch();

    captureServer("parent-123", "signup_completed", { verification: "send-failed" });

    await vi.waitFor(() => expect(slackText(fetchMock)).not.toBeNull());
    expect(slackText(fetchMock)).toContain("Verification: send-failed");
  });

  it("posts name, email, tier and billing status on subscription_active", async () => {
    lookup.mockResolvedValue({ ...CONTACT, tier: "family", billingStatus: "active" });
    const fetchMock = stubFetch();

    captureServer("parent-123", "subscription_active", { tier: "family" });

    await vi.waitFor(() => expect(slackText(fetchMock)).not.toBeNull());
    expect(slackText(fetchMock)).toBe(
      [
        "New subscription on Edway",
        "Name: Jane Smith",
        "Email: jane@example.com",
        "Tier: family",
        "Status: active",
      ].join("\n"),
    );
  });

  it("falls back to the generic message when the parent lookup returns nothing", async () => {
    lookup.mockResolvedValue(null);
    const fetchMock = stubFetch();

    captureServer("parent-123", "signup_completed", { verification: "auto" });

    await vi.waitFor(() => expect(slackText(fetchMock)).not.toBeNull());
    expect(slackText(fetchMock)).toBe("New signup on Edway.");
  });

  it("falls back to the generic message, and never throws, when the lookup rejects", async () => {
    lookup.mockRejectedValue(new Error("mongo down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = stubFetch();

    expect(() =>
      captureServer("parent-123", "subscription_active", { tier: "standard" }),
    ).not.toThrow();

    await vi.waitFor(() => expect(slackText(fetchMock)).not.toBeNull());
    expect(slackText(fetchMock)).toBe("New subscription on Edway (tier: standard).");
  });

  it("does not ping Slack, or look the parent up, for an unrelated event", async () => {
    const fetchMock = stubFetch();

    captureServer("parent-123", "checkout_started", { tier: "standard" });

    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("never throws when SLACK_GROWTH_WEBHOOK_URL is unset", async () => {
    vi.stubEnv("SLACK_GROWTH_WEBHOOK_URL", "");
    const fetchMock = stubFetch();

    expect(() => captureServer("parent-123", "signup_completed")).not.toThrow();

    await new Promise((r) => setTimeout(r, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("also fires the PostHog capture call for signup_completed when a key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.test");
    const fetchMock = stubFetch();

    captureServer("parent-123", "signup_completed");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://us.i.posthog.test/capture/",
      expect.anything(),
    );
    await vi.waitFor(() => expect(slackText(fetchMock)).not.toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the PostHog event itself identity-free (PII goes to Slack only)", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.test");
    const fetchMock = stubFetch();

    captureServer("parent-123", "signup_completed", { verification: "link" });

    const body = bodyFor(fetchMock, "https://us.i.posthog.test/capture/");
    expect(body).not.toBeNull();
    expect(body).not.toContain("jane@example.com");
    expect(body).not.toContain("Jane Smith");
  });
});
