import { formatUtcMinute } from "@/lib/utils";
import type { ParentAlertContact } from "@/lib/db/repo";

/**
 * Pure formatter for the real-time growth Slack pings (a real signup, a real
 * subscription). Kept separate from `growth-alert.ts` so the exact message
 * text is unit-testable with no network and no `server-only` bundle.
 *
 * Privacy position (owner-approved, deliberate): the private growth channel
 * carries the PARENT's own name, email, tier and signup time, because a ping
 * that can't tell you who signed up isn't actionable. That makes Slack a
 * processor of adult customer data under UK GDPR, which the owner accepted.
 * It is adult/account data ONLY: never a child's name, age, lesson, topic,
 * score, SEND status or any escalation detail (Children's Code). If a lookup
 * fails, the message degrades to the generic, detail-free line rather than
 * blocking or throwing.
 */

export const GROWTH_PING_EVENTS = ["signup_completed", "subscription_active"] as const;

export type GrowthPingEvent = (typeof GROWTH_PING_EVENTS)[number];

export function isGrowthPingEvent(event: string): event is GrowthPingEvent {
  return (GROWTH_PING_EVENTS as readonly string[]).includes(event);
}

function line(label: string, value: string): string {
  return `${label}: ${value}`;
}

/** Generic fallback: exactly what shipped before the parent lookup existed. */
function genericPing(event: GrowthPingEvent, properties?: Record<string, unknown>): string {
  return event === "signup_completed"
    ? "New signup on Edway."
    : `New subscription on Edway (tier: ${properties?.tier ?? "unknown"}).`;
}

/**
 * Build the Slack text for a growth event. Returns null for events that are
 * not growth moments. A null `contact` (lookup failed, or the parent row went
 * away) degrades to the generic message.
 */
export function formatGrowthPing(
  event: string,
  contact: ParentAlertContact | null,
  properties?: Record<string, unknown>,
): string | null {
  if (!isGrowthPingEvent(event)) return null;
  if (!contact) return genericPing(event, properties);

  const name = contact.fullName?.trim() || "(not given)";
  const verification =
    typeof properties?.verification === "string" ? properties.verification : null;

  if (event === "signup_completed") {
    const lines = [
      "New signup on Edway",
      line("Name", name),
      line("Email", contact.email),
      line("Tier", String(contact.tier ?? "unknown")),
      line("Signed up", formatUtcMinute(contact.createdAt)),
    ];
    if (verification) lines.push(line("Verification", verification));
    return lines.join("\n");
  }

  const tier = properties?.tier ?? contact.tier ?? "unknown";
  return [
    "New subscription on Edway",
    line("Name", name),
    line("Email", contact.email),
    line("Tier", String(tier)),
    line("Status", String(contact.billingStatus ?? "unknown")),
  ].join("\n");
}
