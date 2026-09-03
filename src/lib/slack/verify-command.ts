import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Slack slash-command request verification.
 *
 * The command endpoint (`/api/slack/command`) is a PUBLIC URL — Slack has to
 * be able to reach it, so anyone else can too. The only thing separating a
 * genuine Slack request from a stranger's is this signature check, exactly as
 * CRON_SECRET is the only thing protecting the cron routes.
 *
 * Slack signs every request with the app's signing secret:
 *   base = `v0:${timestamp}:${rawBody}`
 *   X-Slack-Signature = `v0=` + HMAC_SHA256(signingSecret, base)
 *
 * Two independent checks, both required:
 *  1. the HMAC matches (proves it came from Slack), compared in constant time
 *     so a timing side-channel can't be used to forge a signature byte by byte;
 *  2. the timestamp is recent, so a captured request can't be replayed later.
 *
 * Pure and dependency-free (no `Request`, no env reads) so it is directly
 * unit-testable; the route supplies the raw body, headers and secret.
 */

/** Slack's own recommendation: reject anything older than five minutes. */
const MAX_SKEW_SECONDS = 60 * 5;

export interface SlackVerifyInput {
  /** The EXACT raw request body, before any parsing — re-encoding breaks the HMAC. */
  rawBody: string;
  /** `X-Slack-Signature` header, e.g. "v0=a2114d57b48eac39b9ad189…". */
  signature: string | null;
  /** `X-Slack-Request-Timestamp` header: unix seconds, as a string. */
  timestamp: string | null;
  signingSecret: string;
  /** Injectable for tests; defaults to now. */
  nowSeconds?: number;
}

export type SlackVerifyResult =
  | { ok: true }
  | { ok: false; reason: "missing-headers" | "stale-timestamp" | "bad-signature" };

export function verifySlackCommand(input: SlackVerifyInput): SlackVerifyResult {
  const { rawBody, signature, timestamp, signingSecret } = input;
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (!signature || !timestamp) return { ok: false, reason: "missing-headers" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "missing-headers" };
  if (Math.abs(now - ts) > MAX_SKEW_SECONDS) {
    return { ok: false, reason: "stale-timestamp" };
  }

  const expected =
    "v0=" +
    createHmac("sha256", signingSecret)
      .update(`v0:${timestamp}:${rawBody}`)
      .digest("hex");

  // timingSafeEqual throws on a length mismatch, so guard before comparing.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return { ok: false, reason: "bad-signature" };
  if (!timingSafeEqual(a, b)) return { ok: false, reason: "bad-signature" };

  return { ok: true };
}
