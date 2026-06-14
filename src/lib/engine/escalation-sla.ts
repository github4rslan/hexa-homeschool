/**
 * Escalation SLA math — pure, unit-tested. Maps a severity to an acknowledge
 * deadline and computes whether an open escalation has breached it. No DB, no
 * `server-only`, so the admin queue can render timers from this directly.
 */

import type { EscalationDoc } from "@/lib/db/types";

type Severity = EscalationDoc["severity"];

/** Minutes within which each severity should be acknowledged. */
export const ACK_SLA_MINUTES: Record<Severity, number> = {
  immediate: 15,
  critical: 30,
  high: 120,
  medium: 480, // 8h
  low: 1440, // 24h
};

export interface SlaState {
  /** Minutes since the escalation was created. */
  ageMinutes: number;
  /** Minutes left until breach (negative once breached); null if acknowledged. */
  minutesToBreach: number | null;
  /** True when open + past the acknowledge deadline. */
  breached: boolean;
  /** True for the loud case: an unacknowledged "immediate" past its 15-min SLA. */
  alarm: boolean;
}

/**
 * Compute the SLA state for an escalation. Acknowledged/resolved escalations
 * are never "breached" (the clock stops at acknowledgement).
 */
export function slaState(
  e: Pick<EscalationDoc, "severity" | "status" | "created_at">,
  now: number = Date.now(),
): SlaState {
  const created = new Date(e.created_at).getTime();
  const ageMinutes = Math.max(0, Math.floor((now - created) / 60000));
  const acknowledged = e.status === "acknowledged" || e.status === "resolved";

  if (acknowledged) {
    return { ageMinutes, minutesToBreach: null, breached: false, alarm: false };
  }

  const deadline = ACK_SLA_MINUTES[e.severity];
  const minutesToBreach = deadline - ageMinutes;
  const breached = minutesToBreach < 0;
  const alarm = breached && e.severity === "immediate";
  return { ageMinutes, minutesToBreach, breached, alarm };
}

/** Format minutes as a compact "Xm" / "Xh Ym" / "Xd" label. */
export function formatDuration(mins: number): string {
  const m = Math.abs(Math.round(mins));
  if (m < 60) return `${m}m`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${Math.floor(m / 1440)}d`;
}
