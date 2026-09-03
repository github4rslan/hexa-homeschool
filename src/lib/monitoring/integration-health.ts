import "server-only";
import Stripe from "stripe";
import { ELEVENLABS_API_BASE } from "@/lib/ai/config";
import { getStripe } from "@/lib/billing/stripe";

/**
 * Consolidated read-only health check for every external integration Edway
 * depends on besides email (email already has its own, more detailed monitor
 * at `lib/email/delivery-health.ts`, deliberately not duplicated here).
 *
 * Why this exists: a past incident had one integration break silently for
 * days while every existing check stayed green. This closes the same gap for
 * OpenAI, Cloudinary, Stripe, ElevenLabs and Twilio: one cheap, read-only,
 * credentials-proving call per service, never anything that creates, charges,
 * sends or generates anything real.
 *
 * Each service has its own small pure `evaluateXHealth` verdict function
 * (unit-tested with a mocked probe, no network) and a paired async `checkX`
 * that performs the actual fetch and degrades a missing key to "unconfigured"
 * rather than a crash or a false alarm, exactly like `checkEmailDeliveryHealth`.
 */

export type IntegrationStatus = "ok" | "problem" | "unconfigured";

export interface IntegrationHealth {
  service: string;
  status: IntegrationStatus;
  /** Plain, non-PII description. Always present so a 200 payload is legible. */
  detail: string;
}

function ok(service: string, detail: string): IntegrationHealth {
  return { service, status: "ok", detail };
}
function problem(service: string, detail: string): IntegrationHealth {
  return { service, status: "problem", detail };
}
function unconfigured(service: string): IntegrationHealth {
  return { service, status: "unconfigured", detail: `${service} is not configured.` };
}

// ───────────────────────── OpenAI ─────────────────────────

export interface OpenAIProbe {
  ok: boolean;
  status: number;
  /** Number of models the list returned, or null if the body was unreadable. */
  modelCount: number | null;
  error?: string;
}

export function evaluateOpenAIHealth(probe: OpenAIProbe): IntegrationHealth {
  if (!probe.ok) {
    return problem(
      "openai",
      `Models list returned ${probe.status}${probe.error ? `: ${probe.error}` : ""}.`,
    );
  }
  if (probe.modelCount === null || probe.modelCount === 0) {
    return problem("openai", "Models list responded 200 but returned no readable models.");
  }
  return ok("openai", `Reachable, ${probe.modelCount} models visible.`);
}

export async function checkOpenAIHealth(): Promise<IntegrationHealth> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return unconfigured("openai");

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    let modelCount: number | null = null;
    let errorMessage: string | undefined;
    try {
      const body = (await res.json()) as { data?: unknown[]; error?: { message?: string } };
      modelCount = Array.isArray(body.data) ? body.data.length : null;
      errorMessage = body.error?.message;
    } catch {
      /* unreadable body; modelCount stays null */
    }
    return evaluateOpenAIHealth({ ok: res.ok, status: res.status, modelCount, error: errorMessage });
  } catch (err) {
    return evaluateOpenAIHealth({
      ok: false,
      status: 0,
      modelCount: null,
      error: err instanceof Error ? err.message : "request failed",
    });
  }
}

// ───────────────────────── Cloudinary ─────────────────────────

export interface CloudinaryProbe {
  ok: boolean;
  status: number;
  /** Whether the usage payload included a recognisable plan/credit field. */
  hasUsageData: boolean;
  error?: string;
}

export function evaluateCloudinaryHealth(probe: CloudinaryProbe): IntegrationHealth {
  if (!probe.ok) {
    return problem(
      "cloudinary",
      `Usage check returned ${probe.status}${probe.error ? `: ${probe.error}` : ""}.`,
    );
  }
  if (!probe.hasUsageData) {
    return problem("cloudinary", "Usage check responded 200 but the payload was unreadable.");
  }
  return ok("cloudinary", "Admin API reachable, usage payload readable.");
}

export async function checkCloudinaryHealth(): Promise<IntegrationHealth> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return unconfigured("cloudinary");

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
      cache: "no-store",
    });
    let hasUsageData = false;
    let errorMessage: string | undefined;
    try {
      const body = (await res.json()) as { plan?: unknown; credits?: unknown; error?: { message?: string } };
      hasUsageData = body.plan !== undefined || body.credits !== undefined;
      errorMessage = body.error?.message;
    } catch {
      /* unreadable body; hasUsageData stays false */
    }
    return evaluateCloudinaryHealth({ ok: res.ok, status: res.status, hasUsageData, error: errorMessage });
  } catch (err) {
    return evaluateCloudinaryHealth({
      ok: false,
      status: 0,
      hasUsageData: false,
      error: err instanceof Error ? err.message : "request failed",
    });
  }
}

// ───────────────────────── Stripe ─────────────────────────

export interface StripeProbe {
  ok: boolean;
  status: number | null;
  hasBalance: boolean;
  error?: string;
}

export function evaluateStripeHealth(probe: StripeProbe): IntegrationHealth {
  if (!probe.ok) {
    return problem(
      "stripe",
      `Balance retrieve failed${probe.status ? ` (${probe.status})` : ""}${probe.error ? `: ${probe.error}` : ""}.`,
    );
  }
  if (!probe.hasBalance) {
    return problem("stripe", "Balance retrieve succeeded but the response was unreadable.");
  }
  return ok("stripe", "Balance API reachable.");
}

export async function checkStripeHealth(): Promise<IntegrationHealth> {
  if (!process.env.STRIPE_SECRET_KEY) return unconfigured("stripe");

  try {
    const balance = await getStripe().balance.retrieve();
    const hasBalance = Array.isArray(balance?.available);
    return evaluateStripeHealth({ ok: true, status: 200, hasBalance });
  } catch (err) {
    const status = err instanceof Stripe.errors.StripeError ? (err.statusCode ?? null) : null;
    return evaluateStripeHealth({
      ok: false,
      status,
      hasBalance: false,
      error: err instanceof Error ? err.message : "request failed",
    });
  }
}

// ───────────────────────── ElevenLabs ─────────────────────────

export interface ElevenLabsProbe {
  ok: boolean;
  status: number;
  voiceCount: number | null;
  error?: string;
}

export function evaluateElevenLabsHealth(probe: ElevenLabsProbe): IntegrationHealth {
  if (!probe.ok) {
    return problem(
      "elevenlabs",
      `Voices list returned ${probe.status}${probe.error ? `: ${probe.error}` : ""}.`,
    );
  }
  if (probe.voiceCount === null || probe.voiceCount === 0) {
    return problem("elevenlabs", "Voices list responded 200 but returned no readable voices.");
  }
  return ok("elevenlabs", `Reachable, ${probe.voiceCount} voices visible.`);
}

export async function checkElevenLabsHealth(): Promise<IntegrationHealth> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return unconfigured("elevenlabs");

  try {
    const res = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      headers: { "xi-api-key": key },
      cache: "no-store",
    });
    let voiceCount: number | null = null;
    let errorMessage: string | undefined;
    try {
      const body = (await res.json()) as { voices?: unknown[]; detail?: { message?: string } };
      voiceCount = Array.isArray(body.voices) ? body.voices.length : null;
      errorMessage = body.detail?.message;
    } catch {
      /* unreadable body; voiceCount stays null */
    }
    return evaluateElevenLabsHealth({ ok: res.ok, status: res.status, voiceCount, error: errorMessage });
  } catch (err) {
    return evaluateElevenLabsHealth({
      ok: false,
      status: 0,
      voiceCount: null,
      error: err instanceof Error ? err.message : "request failed",
    });
  }
}

// ───────────────────────── Twilio ─────────────────────────

export interface TwilioProbe {
  ok: boolean;
  status: number;
  /** Twilio account "status" field ("active" | "suspended" | "closed"), or null if unreadable. */
  accountStatus: string | null;
  error?: string;
}

export function evaluateTwilioHealth(probe: TwilioProbe): IntegrationHealth {
  if (!probe.ok) {
    return problem(
      "twilio",
      `Account read returned ${probe.status}${probe.error ? `: ${probe.error}` : ""}.`,
    );
  }
  if (!probe.accountStatus) {
    return problem("twilio", "Account read responded 200 but the account status was unreadable.");
  }
  if (probe.accountStatus !== "active") {
    return problem("twilio", `Account status is "${probe.accountStatus}", not active.`);
  }
  return ok("twilio", "Account reachable and active.");
}

export async function checkTwilioHealth(): Promise<IntegrationHealth> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return unconfigured("twilio");

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
      cache: "no-store",
    });
    let accountStatus: string | null = null;
    let errorMessage: string | undefined;
    try {
      const body = (await res.json()) as { status?: string; message?: string };
      accountStatus = body.status ?? null;
      errorMessage = body.message;
    } catch {
      /* unreadable body; accountStatus stays null */
    }
    return evaluateTwilioHealth({ ok: res.ok, status: res.status, accountStatus, error: errorMessage });
  } catch (err) {
    return evaluateTwilioHealth({
      ok: false,
      status: 0,
      accountStatus: null,
      error: err instanceof Error ? err.message : "request failed",
    });
  }
}

// ───────────────────────── Combined ─────────────────────────

/** Runs every configured service's check in parallel. Never throws. */
export async function checkAllIntegrationsHealth(): Promise<IntegrationHealth[]> {
  return Promise.all([
    checkOpenAIHealth(),
    checkCloudinaryHealth(),
    checkStripeHealth(),
    checkElevenLabsHealth(),
    checkTwilioHealth(),
  ]);
}
