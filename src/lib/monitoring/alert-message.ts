import { formatUtcMinute } from "@/lib/utils";

/**
 * Pure formatter for the Slack text of an outage alert. Split out of
 * `alert.ts` so the exact wording is unit-testable with no network and no
 * `server-only` bundle.
 *
 * The goal is that the alert alone is enough to triage: which service broke,
 * the exact failure detail the monitor computed (HTTP status, provider error
 * text), when, and crucially what else was checked in the same run, so "one
 * integration is down" reads differently from "everything is down".
 *
 * Never put credentials, key material or user data in here. Alerts carry
 * service/infrastructure detail only: unlike the growth channel, there is no
 * reason for an outage alert to name a customer, and never a child.
 */

export type AlertSeverity = "warning" | "error";

/** What else the same monitor run saw, so the blast radius is obvious. */
export interface AlertRunContext {
  /** Other services that also failed in this run (excluding the alerted one). */
  alsoFailing?: string[];
  /** Services that were checked and passed. */
  healthy?: string[];
  /** Services skipped because they have no credentials configured. */
  unconfigured?: string[];
}

export interface AlertMessageInput {
  service: string;
  message: string;
  severity: AlertSeverity;
  context?: AlertRunContext;
  /** Injectable for tests; defaults to now. */
  at?: Date;
}

export function formatAlertMessage(input: AlertMessageInput): string {
  const { service, message, severity, context, at } = input;
  const prefix = severity === "error" ? "Alert" : "Warning";

  const lines = [
    `${prefix}: [${service}] ${message}`,
    `Time: ${formatUtcMinute(at ?? new Date())}`,
  ];

  const alsoFailing = context?.alsoFailing ?? [];
  const healthy = context?.healthy ?? [];
  const unconfigured = context?.unconfigured ?? [];

  if (alsoFailing.length > 0) {
    lines.push(`Also failing in this run: ${alsoFailing.join(", ")}`);
  }
  if (healthy.length > 0) {
    lines.push(`Checked and healthy: ${healthy.join(", ")}`);
  } else if (alsoFailing.length > 0) {
    lines.push("Checked and healthy: none, every checked service is failing");
  }
  if (unconfigured.length > 0) {
    lines.push(`Not configured, so not checked: ${unconfigured.join(", ")}`);
  }

  return lines.join("\n");
}
