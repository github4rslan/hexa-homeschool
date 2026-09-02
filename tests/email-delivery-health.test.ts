import { describe, expect, it } from "vitest";
import {
  evaluateDeliveryHealth,
  type BrevoDomain,
  type BrevoEvent,
  type BrevoSender,
} from "@/lib/email/delivery-health";

const SENDER = "info@edway.uk";

/** The real production shape: the address sends via an authenticated domain. */
const HEALTHY_DOMAINS: BrevoDomain[] = [
  { domain_name: "edway.uk", authenticated: true, verified: true },
  { domain_name: "thekingdomedit.com", authenticated: true, verified: true },
];
const OTHER_SENDERS: BrevoSender[] = [
  { email: "info@thekingdomedit.com", active: true },
];

function health(input: {
  senders?: BrevoSender[] | null;
  domains?: BrevoDomain[] | null;
  events?: BrevoEvent[] | null;
}) {
  return evaluateDeliveryHealth({
    senderEmail: SENDER,
    senders: input.senders === undefined ? OTHER_SENDERS : input.senders,
    domains: input.domains === undefined ? HEALTHY_DOMAINS : input.domains,
    events: input.events === undefined ? [] : input.events,
  });
}

describe("F4 — email delivery health verdict", () => {
  it("is healthy when the sender's domain is authenticated and mail is delivering", () => {
    const result = health({
      events: [
        { event: "requests", from: SENDER },
        { event: "requests", from: SENDER },
        { event: "delivered", from: SENDER },
        { event: "opened", from: SENDER },
      ],
    });
    expect(result.status).toBe("ok");
    expect(result.problems).toEqual([]);
    expect(result.senderCanSend).toBe(true);
    expect(result.senderVia).toBe("domain");
    expect(result.succeeded).toBe(2);
    expect(result.requested).toBe(2);
  });

  it("accepts an active individual sender when no domain is authenticated", () => {
    const result = health({
      senders: [{ email: SENDER, active: true }],
      domains: [],
    });
    expect(result.status).toBe("ok");
    expect(result.senderVia).toBe("sender");
  });

  // The exact 2026-08/09 outage: the domain existed but was never authenticated,
  // so Brevo accepted every send with a 2xx and rejected it afterwards.
  it("flags an unauthenticated sender domain, the real silent-outage root cause", () => {
    const result = health({
      domains: [{ domain_name: "edway.uk", authenticated: false, verified: false }],
      events: [],
    });
    expect(result.status).toBe("problem");
    expect(result.senderCanSend).toBe(false);
    expect(result.senderVia).toBe("none");
    expect(result.problems[0]).toContain(SENDER);
  });

  it("flags a sender that is registered nowhere at all", () => {
    const result = health({ senders: [], domains: [] });
    expect(result.status).toBe("problem");
    expect(result.senderVia).toBe("none");
  });

  it("treats an inactive individual sender as unable to send", () => {
    const result = health({
      senders: [{ email: SENDER, active: false }],
      domains: [],
    });
    expect(result.status).toBe("problem");
  });

  // The outage's fingerprint: sends accepted (res.ok was true), none delivered.
  it("flags accepted-but-never-delivered sends even when the sender looks fine", () => {
    const result = health({
      events: [
        { event: "requests", from: SENDER },
        { event: "requests", from: SENDER },
        { event: "error", from: SENDER },
        { event: "error", from: SENDER },
      ],
    });
    expect(result.status).toBe("problem");
    expect(result.failed).toBe(2);
    expect(result.succeeded).toBe(0);
    expect(result.problems.join(" ")).toContain("not one is recorded as delivered");
  });

  it("does not cry wolf over routine bounces while other mail is delivering", () => {
    const result = health({
      events: [
        { event: "requests", from: SENDER },
        { event: "delivered", from: SENDER },
        { event: "softBounces", from: SENDER },
        { event: "blocked", from: SENDER },
      ],
    });
    expect(result.status).toBe("ok");
    // The failures are still reported in the payload for a human to eyeball.
    expect(result.failed).toBe(2);
    expect(result.succeeded).toBe(1);
  });

  it("stays quiet when nothing was sent in the window", () => {
    const result = health({ events: [] });
    expect(result.status).toBe("ok");
    expect(result.problems).toEqual([]);
  });

  // The Brevo account is shared with another brand: its traffic must neither
  // mask an Edway outage nor trigger a false Edway alert.
  it("ignores another sender's events entirely", () => {
    const masked = health({
      events: [
        { event: "requests", from: SENDER },
        { event: "error", from: SENDER },
        { event: "delivered", from: "info@thekingdomedit.com" },
        { event: "opened", from: "info@thekingdomedit.com" },
      ],
    });
    expect(masked.status).toBe("problem"); // the other brand's success cannot hide this
    expect(masked.eventsInspected).toBe(2);

    const noisy = health({
      events: [
        { event: "error", from: "info@thekingdomedit.com" },
        { event: "blocked", from: "info@thekingdomedit.com" },
      ],
    });
    expect(noisy.status).toBe("ok"); // the other brand's failures cannot page us
    expect(noisy.eventsInspected).toBe(0);
  });

  it("reports 'unknown' rather than a false all-clear when Brevo cannot be read", () => {
    const result = health({ senders: null, domains: null, events: null });
    expect(result.status).toBe("unknown");
    expect(result.problems).toEqual([]);
    expect(result.senderCanSend).toBeNull();
  });

  it("never concludes 'not registered' from a single readable list", () => {
    // Senders readable and non-matching, domains unreadable: not enough to judge.
    const result = health({ senders: [], domains: null });
    expect(result.status).toBe("ok");
    expect(result.senderCanSend).toBeNull();
    expect(result.senderVia).toBe("unknown");
  });

  it("matches the sender case-insensitively", () => {
    const result = evaluateDeliveryHealth({
      senderEmail: "INFO@Edway.UK",
      senders: OTHER_SENDERS,
      domains: HEALTHY_DOMAINS,
      events: [{ event: "delivered", from: "Info@Edway.uk" }],
    });
    expect(result.status).toBe("ok");
    expect(result.senderEmail).toBe(SENDER);
    expect(result.succeeded).toBe(1);
  });

  it("carries no recipient address in the verdict (safe to log)", () => {
    const result = health({
      events: [
        { event: "requests", from: SENDER },
        { event: "error", from: SENDER },
      ],
    });
    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain("@gmail.com");
    expect(serialised).not.toContain("@hotmail.com");
  });
});
