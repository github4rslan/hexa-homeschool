import "server-only";
import webpush from "web-push";
import type { PushSubscriptionDoc } from "@/lib/db/types";

/**
 * Web Push sender for parent milestone notifications (F4).
 *
 * Env-gated exactly like the other integrations (Brevo/Twilio): unset VAPID env
 * (`WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT`) ⇒ the whole
 * feature is OFF — `webPushConfigured()` is false, the subscribe control hides,
 * no subscriptions are ever stored, and `sendWebPush` is a silent no-op. Sends
 * are best-effort: failures are logged, never thrown. An expired subscription
 * (404/410) is reported back so the caller can prune it.
 *
 * Parents-only, by construction: subscriptions are created only from the parent
 * dashboard and stored on the parent doc — never registered in `(child)` routes.
 */

let configuredVapid = false;

function ensureVapid(): boolean {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;
  if (!publicKey || !privateKey || !subject) return false;
  if (!configuredVapid) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configuredVapid = true;
  }
  return true;
}

/** Is Web Push fully configured (all three VAPID env vars present)? */
export function webPushConfigured(): boolean {
  return !!(
    process.env.WEB_PUSH_PUBLIC_KEY &&
    process.env.WEB_PUSH_PRIVATE_KEY &&
    process.env.WEB_PUSH_SUBJECT
  );
}

/** The public VAPID key the browser needs to subscribe, or null if unconfigured. */
export function getVapidPublicKey(): string | null {
  return webPushConfigured() ? process.env.WEB_PUSH_PUBLIC_KEY! : null;
}

export interface WebPushPayload {
  title: string;
  body: string;
  /** Deep-link opened on notification click (relative path). */
  url: string;
}

export interface WebPushResult {
  ok: boolean;
  skipped?: boolean;
  /** The subscription is gone (404/410) — the caller should prune it. */
  expired?: boolean;
}

/** Deliver one push to one subscription. Never throws. */
export async function sendWebPush(
  sub: PushSubscriptionDoc,
  payload: WebPushPayload,
): Promise<WebPushResult> {
  if (!ensureVapid()) return { ok: false, skipped: true };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, expired: true };
    }
    console.error("[web-push] send failed:", statusCode ?? err);
    return { ok: false };
  }
}
