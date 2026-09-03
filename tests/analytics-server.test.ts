import { afterEach, describe, expect, it, vi } from "vitest";
import { captureServer } from "@/lib/analytics/server";

const GROWTH_WEBHOOK = "https://hooks.slack.test/growth";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("captureServer growth ping dispatch", () => {
  it("posts to the growth Slack webhook on signup_completed", () => {
    vi.stubEnv("SLACK_GROWTH_WEBHOOK_URL", GROWTH_WEBHOOK);
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    captureServer("parent-123", "signup_completed");

    expect(fetchMock).toHaveBeenCalledWith(
      GROWTH_WEBHOOK,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "New signup on Edway." }),
      }),
    );
  });

  it("posts to the growth Slack webhook on subscription_active, including the tier", () => {
    vi.stubEnv("SLACK_GROWTH_WEBHOOK_URL", GROWTH_WEBHOOK);
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    captureServer("parent-123", "subscription_active", { tier: "family" });

    expect(fetchMock).toHaveBeenCalledWith(
      GROWTH_WEBHOOK,
      expect.objectContaining({
        body: JSON.stringify({ text: "New subscription on Edway (tier: family)." }),
      }),
    );
  });

  it("does not ping Slack for an unrelated event", () => {
    vi.stubEnv("SLACK_GROWTH_WEBHOOK_URL", GROWTH_WEBHOOK);
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    captureServer("parent-123", "checkout_started", { tier: "standard" });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when SLACK_GROWTH_WEBHOOK_URL is unset", () => {
    vi.stubEnv("SLACK_GROWTH_WEBHOOK_URL", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(() => captureServer("parent-123", "signup_completed")).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("also fires the PostHog capture call for signup_completed when a key is set", () => {
    vi.stubEnv("SLACK_GROWTH_WEBHOOK_URL", GROWTH_WEBHOOK);
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.test");
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    captureServer("parent-123", "signup_completed");

    expect(fetchMock).toHaveBeenCalledWith(GROWTH_WEBHOOK, expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(
      "https://us.i.posthog.test/capture/",
      expect.anything(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
