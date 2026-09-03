import { afterEach, describe, expect, it, vi } from "vitest";
import {
  evaluateOpenAIHealth,
  evaluateCloudinaryHealth,
  evaluateStripeHealth,
  evaluateElevenLabsHealth,
  evaluateTwilioHealth,
  checkOpenAIHealth,
  checkCloudinaryHealth,
  checkStripeHealth,
  checkElevenLabsHealth,
  checkTwilioHealth,
} from "@/lib/monitoring/integration-health";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("evaluateOpenAIHealth", () => {
  it("is ok when the models list is readable and non-empty", () => {
    const result = evaluateOpenAIHealth({ ok: true, status: 200, modelCount: 12 });
    expect(result.status).toBe("ok");
  });

  it("flags a non-2xx response", () => {
    const result = evaluateOpenAIHealth({
      ok: false,
      status: 401,
      modelCount: null,
      error: "Incorrect API key",
    });
    expect(result.status).toBe("problem");
    expect(result.detail).toContain("401");
    expect(result.detail).toContain("Incorrect API key");
  });

  it("flags a 200 with an unreadable or empty body", () => {
    expect(evaluateOpenAIHealth({ ok: true, status: 200, modelCount: null }).status).toBe(
      "problem",
    );
    expect(evaluateOpenAIHealth({ ok: true, status: 200, modelCount: 0 }).status).toBe(
      "problem",
    );
  });
});

describe("evaluateCloudinaryHealth", () => {
  it("is ok when the usage payload is readable", () => {
    const result = evaluateCloudinaryHealth({ ok: true, status: 200, hasUsageData: true });
    expect(result.status).toBe("ok");
  });

  it("flags a non-2xx response", () => {
    const result = evaluateCloudinaryHealth({
      ok: false,
      status: 401,
      hasUsageData: false,
      error: "Invalid signature",
    });
    expect(result.status).toBe("problem");
    expect(result.detail).toContain("401");
  });

  it("flags a 200 with an unreadable payload", () => {
    const result = evaluateCloudinaryHealth({ ok: true, status: 200, hasUsageData: false });
    expect(result.status).toBe("problem");
  });
});

describe("evaluateStripeHealth", () => {
  it("is ok when the balance response is readable", () => {
    const result = evaluateStripeHealth({ ok: true, status: 200, hasBalance: true });
    expect(result.status).toBe("ok");
  });

  it("flags a failed retrieve with the Stripe status code", () => {
    const result = evaluateStripeHealth({
      ok: false,
      status: 401,
      hasBalance: false,
      error: "Invalid API Key provided",
    });
    expect(result.status).toBe("problem");
    expect(result.detail).toContain("401");
    expect(result.detail).toContain("Invalid API Key provided");
  });

  it("flags a success with an unreadable balance shape", () => {
    const result = evaluateStripeHealth({ ok: true, status: 200, hasBalance: false });
    expect(result.status).toBe("problem");
  });
});

describe("evaluateElevenLabsHealth", () => {
  it("is ok when the voices list is readable and non-empty", () => {
    const result = evaluateElevenLabsHealth({ ok: true, status: 200, voiceCount: 7 });
    expect(result.status).toBe("ok");
  });

  it("flags a non-2xx response", () => {
    const result = evaluateElevenLabsHealth({
      ok: false,
      status: 401,
      voiceCount: null,
      error: "Invalid API key",
    });
    expect(result.status).toBe("problem");
    expect(result.detail).toContain("401");
  });

  it("flags a 200 with no readable voices", () => {
    expect(evaluateElevenLabsHealth({ ok: true, status: 200, voiceCount: null }).status).toBe(
      "problem",
    );
    expect(evaluateElevenLabsHealth({ ok: true, status: 200, voiceCount: 0 }).status).toBe(
      "problem",
    );
  });
});

describe("evaluateTwilioHealth", () => {
  it("is ok when the account is active", () => {
    const result = evaluateTwilioHealth({ ok: true, status: 200, accountStatus: "active" });
    expect(result.status).toBe("ok");
  });

  it("flags a non-2xx response", () => {
    const result = evaluateTwilioHealth({
      ok: false,
      status: 401,
      accountStatus: null,
      error: "Authenticate",
    });
    expect(result.status).toBe("problem");
    expect(result.detail).toContain("401");
  });

  it("flags an unreadable account status", () => {
    const result = evaluateTwilioHealth({ ok: true, status: 200, accountStatus: null });
    expect(result.status).toBe("problem");
  });

  it("flags a suspended or closed account even on a 200", () => {
    expect(
      evaluateTwilioHealth({ ok: true, status: 200, accountStatus: "suspended" }).status,
    ).toBe("problem");
    expect(
      evaluateTwilioHealth({ ok: true, status: 200, accountStatus: "closed" }).status,
    ).toBe("problem");
  });
});

describe("checkXHealth: unconfigured degrades gracefully, no network call", () => {
  it("openai: unconfigured when OPENAI_API_KEY is unset", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await checkOpenAIHealth();
    expect(result.status).toBe("unconfigured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("cloudinary: unconfigured when any of the three vars is unset", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await checkCloudinaryHealth();
    expect(result.status).toBe("unconfigured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("stripe: unconfigured when STRIPE_SECRET_KEY is unset", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const result = await checkStripeHealth();
    expect(result.status).toBe("unconfigured");
  });

  it("elevenlabs: unconfigured when ELEVENLABS_API_KEY is unset", async () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await checkElevenLabsHealth();
    expect(result.status).toBe("unconfigured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("twilio: unconfigured when TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is unset", async () => {
    vi.stubEnv("TWILIO_ACCOUNT_SID", "");
    vi.stubEnv("TWILIO_AUTH_TOKEN", "token");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await checkTwilioHealth();
    expect(result.status).toBe("unconfigured");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
