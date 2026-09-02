import "server-only";

/**
 * Synthetic check that Edway's transactional email is ACTUALLY delivered, not
 * merely accepted (F4).
 *
 * Why this exists: `sendEmail()` reports success from Brevo's synchronous 2xx
 * on `/smtp/email`, which only means "queued". Brevo can then reject the send
 * asynchronously (for example when the sender domain is not authenticated), and
 * that rejection appears ONLY in the account's own logs. That is exactly how a
 * real 5-day signup-verification outage stayed silent: `res.ok` was true, every
 * health check was green, Sentry was quiet, and new parents never got a code.
 *
 * So the check reads delivery OUTCOME from Brevo instead of trusting the accept:
 *   1. `/v3/senders` + `/v3/senders/domains`: can the configured EMAIL_FROM
 *      address actually send, either as an active individual sender or from an
 *      authenticated, verified domain? (Exactly the root cause last time.)
 *   2. `/v3/smtp/statistics/events`: in the recent window, were sends accepted
 *      and then never delivered? (The outage's fingerprint.)
 *
 * No test signups, no disposable-inbox service and no child data are involved.
 * The verdict carries counts and the sender address only, never a recipient, so
 * it is safe to log to Sentry. Missing BREVO_API_KEY degrades to an honest
 * "unconfigured" result, never a crash.
 */

const SENDERS_ENDPOINT = "https://api.brevo.com/v3/senders";
const DOMAINS_ENDPOINT = "https://api.brevo.com/v3/senders/domains";
const EVENTS_ENDPOINT = "https://api.brevo.com/v3/smtp/statistics/events";

/**
 * Brevo event names meaning the message definitively did not land. Brevo mixes
 * singular and plural spellings across its APIs, so both are listed.
 */
const FAILURE_EVENTS = new Set([
  "blocked",
  "bounces",
  "hardBounce",
  "hardBounces",
  "softBounce",
  "softBounces",
  "invalid",
  "error",
  "spam",
]);

/** Brevo event names meaning the message did land. */
const SUCCESS_EVENTS = new Set([
  "delivered",
  "opened",
  "uniqueOpened",
  "click",
  "clicks",
  "uniqueClicked",
  "loadedByProxy",
]);

/** Brevo event names meaning "accepted for sending" (queued, outcome unknown). */
const REQUEST_EVENTS = new Set(["request", "requests"]);

export type DeliveryHealthStatus =
  | "ok"
  | "problem"
  /** BREVO_API_KEY unset: email is deliberately off, so nothing to check. */
  | "unconfigured"
  /** Brevo's own API could not be read, so health is genuinely unknown. */
  | "unknown";

export interface DeliveryHealth {
  status: DeliveryHealthStatus;
  /** The address Edway sends from, parsed out of EMAIL_FROM. */
  senderEmail: string;
  /** Can that address send at all? null when Brevo could not be read. */
  senderCanSend: boolean | null;
  /** How the sender is authorised, for the operator reading the payload. */
  senderVia: "sender" | "domain" | "none" | "unknown";
  eventsInspected: number;
  succeeded: number;
  failed: number;
  /** Sends Brevo accepted in the window (the "queued" count). */
  requested: number;
  /** Plain, non-PII descriptions of everything wrong. Empty when healthy. */
  problems: string[];
}

export interface BrevoSender {
  email?: string;
  active?: boolean;
}

export interface BrevoDomain {
  domain_name?: string;
  authenticated?: boolean;
  verified?: boolean;
}

export interface BrevoEvent {
  event?: string;
  /** The sending address. This Brevo account also sends for another brand. */
  from?: string;
}

/**
 * Turn raw Brevo API data into a verdict. Pure: no network, no env, no clock,
 * so the whole decision is unit-testable.
 *
 * A null list means that call could not be read; nulls make the result honest
 * ("unknown") rather than falsely healthy or falsely alarming.
 */
export function evaluateDeliveryHealth(input: {
  senderEmail: string;
  senders: BrevoSender[] | null;
  domains: BrevoDomain[] | null;
  events: BrevoEvent[] | null;
}): DeliveryHealth {
  const problems: string[] = [];
  const senderEmail = input.senderEmail.trim().toLowerCase();
  const senderDomain = senderEmail.split("@")[1] ?? "";

  // ── 1. Can this address send at all? ──
  const activeSender =
    input.senders?.some(
      (s) =>
        (s.email ?? "").trim().toLowerCase() === senderEmail &&
        s.active !== false,
    ) ?? false;
  const authedDomain =
    input.domains?.some(
      (d) =>
        (d.domain_name ?? "").trim().toLowerCase() === senderDomain &&
        d.authenticated !== false &&
        d.verified !== false,
    ) ?? false;

  let senderCanSend: boolean | null = null;
  let senderVia: DeliveryHealth["senderVia"] = "unknown";
  if (activeSender) {
    senderCanSend = true;
    senderVia = "sender";
  } else if (authedDomain) {
    senderCanSend = true;
    senderVia = "domain";
  } else if (input.senders && input.domains) {
    // Both lists readable and neither authorises the address: this is the
    // failure that silently broke every send for five days.
    senderCanSend = false;
    senderVia = "none";
    problems.push(
      `The configured sender (${senderEmail}) is neither an active Brevo sender nor inside an authenticated, verified domain, so Brevo will accept sends and then reject them.`,
    );
  }

  // ── 2. Did recent sends actually get delivered? ──
  // Only this brand's traffic counts: the Brevo account is shared, so another
  // sender's healthy delivery must never mask an Edway outage (or vice versa).
  let succeeded = 0;
  let failed = 0;
  let requested = 0;
  let eventsInspected = 0;
  if (input.events) {
    for (const e of input.events) {
      const from = (e.from ?? "").trim().toLowerCase();
      if (from && from !== senderEmail) continue;
      eventsInspected++;
      const name = e.event ?? "";
      if (SUCCESS_EVENTS.has(name)) succeeded++;
      else if (FAILURE_EVENTS.has(name)) failed++;
      else if (REQUEST_EVENTS.has(name)) requested++;
    }
    // The outage signature: mail went out and NOTHING came back as delivered.
    // A quiet window (no sends at all) is not a problem, and a window with any
    // successful delivery is not either, which keeps this alert from crying
    // wolf over the routine bounce to a stale or fake test address.
    if (succeeded === 0 && (requested > 0 || failed > 0)) {
      problems.push(
        `${requested} recent ${requested === 1 ? "send was" : "sends were"} accepted by Brevo and ${failed} failed, but not one is recorded as delivered.`,
      );
    }
  }

  const unreadable =
    input.senders === null && input.domains === null && input.events === null;
  const status: DeliveryHealthStatus = problems.length
    ? "problem"
    : unreadable
      ? "unknown"
      : "ok";

  return {
    status,
    senderEmail,
    senderCanSend,
    senderVia,
    eventsInspected,
    succeeded,
    failed,
    requested,
    problems,
  };
}

/** The address in EMAIL_FROM ("Edway <info@edway.uk>" or "info@edway.uk"). */
export function configuredSenderEmail(): string {
  const raw = process.env.EMAIL_FROM || "Edway <hello@edway.uk>";
  const m = raw.match(/^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/);
  return (m ? m[2] : raw).trim();
}

async function readJson(url: string, key: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "api-key": key, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[email-health] Brevo read failed:", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[email-health] Brevo read threw:", err);
    return null;
  }
}

/** Pull an array out of a Brevo envelope, or null when it is unreadable. */
function listFrom<T>(payload: unknown, key: string): T[] | null {
  const value = (payload as Record<string, unknown> | null)?.[key];
  return Array.isArray(value) ? (value as T[]) : null;
}

/**
 * Read the live delivery outcome from Brevo and return a verdict. `days` is how
 * far back the event window reaches (Brevo's own parameter).
 */
export async function checkEmailDeliveryHealth(
  days = 1,
  limit = 100,
): Promise<DeliveryHealth> {
  const key = process.env.BREVO_API_KEY;
  const senderEmail = configuredSenderEmail();
  if (!key) {
    return {
      status: "unconfigured",
      senderEmail,
      senderCanSend: null,
      senderVia: "unknown",
      eventsInspected: 0,
      succeeded: 0,
      failed: 0,
      requested: 0,
      problems: [],
    };
  }

  const [sendersRaw, domainsRaw, eventsRaw] = await Promise.all([
    readJson(SENDERS_ENDPOINT, key),
    readJson(DOMAINS_ENDPOINT, key),
    readJson(`${EVENTS_ENDPOINT}?limit=${limit}&days=${days}`, key),
  ]);

  return evaluateDeliveryHealth({
    senderEmail,
    senders: listFrom<BrevoSender>(sendersRaw, "senders"),
    domains: listFrom<BrevoDomain>(domainsRaw, "domains"),
    events: listFrom<BrevoEvent>(eventsRaw, "events"),
  });
}
