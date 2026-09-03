import "server-only";
import * as Sentry from "@sentry/nextjs";
import {
  formatAlertMessage,
  type AlertRunContext,
  type AlertSeverity,
} from "@/lib/monitoring/alert-message";

/**
 * Shared out-of-band alert helper for Edway's monitors (email delivery,
 * integration health, and any future one).
 *
 * Two independent channels, both best-effort:
 *   1. Sentry (`captureMessage`) — already routed through `scrubAndTag`
 *      (`sentry.server.config.ts`'s `beforeSend`), so the same PII scrubbing
 *      applies here with no extra work. Unset SENTRY DSN = Sentry is already
 *      fully disabled, so this becomes a no-op automatically. Sentry gets the
 *      short one-line form on purpose: it is the grouping key, so the varying
 *      run context stays out of it.
 *   2. Slack, via `SLACK_ALERTS_WEBHOOK_URL` — a channel independent of
 *      Sentry/email, requested after an outage where every existing check
 *      stayed green. Optional: unset = silently skipped, same
 *      graceful-degradation pattern as every other integration in this repo
 *      (see `sendSms` in `lib/sms/twilio.ts`). Never throws, never blocks the
 *      caller: a broken Slack webhook must not take down a monitor route.
 *      Slack gets the full diagnostic form (`alert-message.ts`): failure
 *      detail, timestamp, and what else passed or failed in the same run.
 *
 * Alerts carry service/infrastructure detail only. The growth channel now
 * deliberately includes parent/account PII (owner-approved), but an outage
 * alert has no reason to name a customer, and never a child: keep credentials,
 * key material and user data out of `message`.
 */

export type { AlertSeverity } from "@/lib/monitoring/alert-message";

export interface AlertInput {
  /** Short machine-friendly service id, e.g. "openai", "stripe". */
  service: string;
  /** Plain-English failure detail: HTTP status, provider error text, no credentials. */
  message: string;
  severity?: AlertSeverity;
  /** What else the same monitor run saw, so the blast radius is obvious. */
  context?: AlertRunContext;
}

export async function sendAlert(input: AlertInput): Promise<void> {
  const { service, message, severity = "error", context } = input;

  Sentry.captureMessage(`[${service}] ${message}`, {
    level: severity,
    tags: { monitor: service },
  });

  await postToSlack(formatAlertMessage({ service, message, severity, context }));
}

async function postToSlack(text: string): Promise<void> {
  const url = process.env.SLACK_ALERTS_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error("[alert] Slack webhook post failed:", res.status);
    }
  } catch (err) {
    console.error("[alert] Slack webhook post threw:", err);
  }
}
