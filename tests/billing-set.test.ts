import { describe, it, expect } from "vitest";
import { billingSet } from "@/lib/db/repo";

describe("billingSet", () => {
  it("sets billing_activated_at when status transitions to active", () => {
    const set = billingSet({ status: "active" });
    expect(set.billing_status).toBe("active");
    expect(set.billing_activated_at).toBeInstanceOf(Date);
  });

  it("does not set billing_activated_at for a non-active status", () => {
    const pastDue = billingSet({ status: "past_due" });
    expect(pastDue.billing_status).toBe("past_due");
    expect(pastDue.billing_activated_at).toBeUndefined();

    const canceled = billingSet({ status: "canceled" });
    expect(canceled.billing_activated_at).toBeUndefined();
  });

  it("does not set billing_activated_at when status is omitted (tier/stripe-only update)", () => {
    const set = billingSet({ tier: "family", stripeCustomerId: "cus_123" });
    expect(set.subscription_tier).toBe("family");
    expect(set.stripe_customer_id).toBe("cus_123");
    expect(set.billing_activated_at).toBeUndefined();
  });

  it("always bumps updated_at", () => {
    const set = billingSet({});
    expect(set.updated_at).toBeInstanceOf(Date);
  });
});
