import { describe, it, expect } from "vitest";
import { formatGrowthPing, isGrowthPingEvent } from "@/lib/analytics/growth-message";
import type { ParentAlertContact } from "@/lib/db/repo";

const contact = (overrides: Partial<ParentAlertContact> = {}): ParentAlertContact => ({
  fullName: "Jane Smith",
  email: "jane@example.com",
  tier: "diagnostic",
  billingStatus: "trialing",
  createdAt: new Date("2026-09-03T14:22:31.000Z"),
  ...overrides,
});

describe("isGrowthPingEvent", () => {
  it("matches only the two real growth moments", () => {
    expect(isGrowthPingEvent("signup_completed")).toBe(true);
    expect(isGrowthPingEvent("subscription_active")).toBe(true);
    expect(isGrowthPingEvent("checkout_started")).toBe(false);
    expect(isGrowthPingEvent("first_lesson_run")).toBe(false);
  });
});

describe("formatGrowthPing", () => {
  it("returns null for a non-growth event", () => {
    expect(formatGrowthPing("diagnostic_completed", contact())).toBeNull();
  });

  it("falls back to the generic signup line without a contact", () => {
    expect(formatGrowthPing("signup_completed", null)).toBe("New signup on Edway.");
  });

  it("falls back to the generic subscription line, keeping the event's tier", () => {
    expect(formatGrowthPing("subscription_active", null, { tier: "family" })).toBe(
      "New subscription on Edway (tier: family).",
    );
    expect(formatGrowthPing("subscription_active", null)).toBe(
      "New subscription on Edway (tier: unknown).",
    );
  });

  it("omits the verification line when the event carried no verification property", () => {
    const msg = formatGrowthPing("signup_completed", contact());
    expect(msg).not.toContain("Verification:");
    expect(msg).toContain("Signed up: 2026-09-03 14:22 UTC");
  });

  it("handles a parent with no name and no recorded signup time", () => {
    const msg = formatGrowthPing("signup_completed", contact({ fullName: "  ", createdAt: null }));
    expect(msg).toContain("Name: (not given)");
    expect(msg).toContain("Signed up: unknown");
  });

  it("prefers the event's tier over the stored one on a subscription", () => {
    const msg = formatGrowthPing(
      "subscription_active",
      contact({ tier: "diagnostic", billingStatus: "active" }),
      { tier: "family" },
    );
    expect(msg).toContain("Tier: family");
    expect(msg).toContain("Status: active");
  });

  it("never mentions a child: parent/account fields only", () => {
    const msg = formatGrowthPing("signup_completed", contact(), { verification: "link" })!;
    expect(msg.toLowerCase()).not.toContain("child");
    expect(msg.split("\n").map((l) => l.split(":")[0])).toEqual([
      "New signup on Edway",
      "Name",
      "Email",
      "Tier",
      "Signed up",
      "Verification",
    ]);
  });
});
