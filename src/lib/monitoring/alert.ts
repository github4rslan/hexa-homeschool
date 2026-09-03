import "server-only";
import * as Sentry from "@sentry/nextjs";

/**
 * Shared out-of-band alert helper for Edway's monitors (email delivery,
 * integration health, and any future one).
 *
 * Two independent channels, both best-effort:
 *   1. Sentry (`captureMessage`) — already routed through `scrubAndTag`
 *      (`sentry.server.config.ts`'s `beforeSend`), so the same PII scrubbing
 *      applies here with no extra work. Unset SENTRY DSN = Sentry is already
 *      fully disabled, so this becomes a no-op automatically.
 *   2. Slack, via `SLACK_ALERTS_WEBHOOK_URL` — a channel independent of
 *      Sentry/email, requested after an outage where every existing check
 *      stayed green. Optional: unset = silently skipped, same
 *      graceful-degradation pattern as every other integration in this repo
 *      (see `sendSms` in `lib/sms/twilio.ts`). Never throws, never blocks the
 *      caller: a broken Slack webhook must not take down a monitor route.
 *
 * Callers must keep messages short and free of PII: service name + a plain
 * reason only, exactly like `checkEmailDeliveryHealth`'s `problems` strings.
 */

export type AlertSeverity = "warning" | "error";

export interface AlertInput {
  /** Short machine-friendly service id, e.g. "openai", "stripe". */
  service: string;
  /** Plain-English reason, no PII, no recipient/user data. */
  message: string;
  severity?: AlertSeverity;
}

export async function sendAlert(input: AlertInput): Promise<void> {
  const { service, message, severity = "error" } = input;

  Sentry.captureMessage(`[${service}] ${message}`, {
    level: severity,
    tags: { monitor: service },
  });

  await postToSlack(service, message, severity);
}

async function postToSlack(
  service: string,
  message: string,
  severity: AlertSeverity,
): Promise<void> {
  const url = process.env.SLACK_ALERTS_WEBHOOK_URL;
  if (!url) return;

  const prefix = severity === "error" ? "Alert" : "Warning";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `${prefix}: [${service}] ${message}` }),
    });
    if (!res.ok) {
      console.error("[alert] Slack webhook post failed:", res.status);
    }
  } catch (err) {
    console.error("[alert] Slack webhook post threw:", err);
  }
}
