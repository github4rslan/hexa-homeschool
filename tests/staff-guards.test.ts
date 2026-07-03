import { describe, it, expect } from "vitest";
import {
  evaluateRoleChange,
  evaluateAccountAction,
  requireReason,
  confirmationMatches,
  type RoleChangeRequest,
  type AccountActionRequest,
} from "@/lib/auth/staff-guards";

function roleReq(overrides: Partial<RoleChangeRequest> = {}): RoleChangeRequest {
  return {
    actorRole: "admin",
    actorId: "actor",
    targetId: "target",
    targetCurrentRole: null,
    nextRole: "support",
    reason: "Onboarding a new support agent",
    adminCount: 2,
    ...overrides,
  };
}

function acctReq(overrides: Partial<AccountActionRequest> = {}): AccountActionRequest {
  return {
    actorRole: "admin",
    actorId: "actor",
    targetId: "target",
    targetIsAdmin: false,
    reason: "GDPR erasure request from the parent",
    adminCount: 2,
    ...overrides,
  };
}

describe("requireReason", () => {
  it("rejects empty / whitespace-only reasons", () => {
    expect(requireReason("").ok).toBe(false);
    expect(requireReason("   ").ok).toBe(false);
    expect(requireReason(null).ok).toBe(false);
    expect(requireReason(undefined).ok).toBe(false);
  });
  it("rejects overly long reasons", () => {
    expect(requireReason("x".repeat(501)).ok).toBe(false);
  });
  it("accepts a normal reason", () => {
    expect(requireReason("Parent requested downgrade").ok).toBe(true);
  });
});

describe("evaluateRoleChange — permission + reason", () => {
  it("only an admin can change roles", () => {
    expect(evaluateRoleChange(roleReq({ actorRole: "support" })).ok).toBe(false);
    expect(evaluateRoleChange(roleReq({ actorRole: null })).ok).toBe(false);
  });
  it("requires a reason", () => {
    expect(evaluateRoleChange(roleReq({ reason: "  " })).ok).toBe(false);
  });
  it("grants support to a normal parent with a reason", () => {
    expect(evaluateRoleChange(roleReq()).ok).toBe(true);
  });
  it("promotes support → admin", () => {
    const r = evaluateRoleChange(
      roleReq({ targetCurrentRole: "support", nextRole: "admin" }),
    );
    expect(r.ok).toBe(true);
  });
  it("rejects a no-op change", () => {
    const r = evaluateRoleChange(
      roleReq({ targetCurrentRole: "support", nextRole: "support" }),
    );
    expect(r.ok).toBe(false);
  });
});

describe("evaluateRoleChange — self-lockout", () => {
  it("an admin cannot revoke their own admin role", () => {
    const r = evaluateRoleChange(
      roleReq({
        actorId: "same",
        targetId: "same",
        targetCurrentRole: "admin",
        nextRole: null,
        adminCount: 5,
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/your own admin/i);
  });
  it("an admin cannot demote themselves to support", () => {
    const r = evaluateRoleChange(
      roleReq({
        actorId: "same",
        targetId: "same",
        targetCurrentRole: "admin",
        nextRole: "support",
        adminCount: 5,
      }),
    );
    expect(r.ok).toBe(false);
  });
});

describe("evaluateRoleChange — last-admin", () => {
  it("refuses to remove the last remaining admin", () => {
    const r = evaluateRoleChange(
      roleReq({
        targetId: "other",
        targetCurrentRole: "admin",
        nextRole: "support",
        adminCount: 1,
      }),
    );
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/last remaining admin/i);
  });
  it("allows demoting one admin when others remain", () => {
    const r = evaluateRoleChange(
      roleReq({
        targetId: "other",
        targetCurrentRole: "admin",
        nextRole: "support",
        adminCount: 2,
      }),
    );
    expect(r.ok).toBe(true);
  });
});

describe("evaluateAccountAction — suspend / delete", () => {
  it("only an admin can act", () => {
    expect(evaluateAccountAction(acctReq({ actorRole: "support" })).ok).toBe(false);
  });
  it("requires a reason", () => {
    expect(evaluateAccountAction(acctReq({ reason: "" })).ok).toBe(false);
  });
  it("cannot act on your own account", () => {
    const r = evaluateAccountAction(acctReq({ actorId: "me", targetId: "me" }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/your own account/i);
  });
  it("cannot delete/suspend the last admin", () => {
    const r = evaluateAccountAction(
      acctReq({ targetIsAdmin: true, adminCount: 1 }),
    );
    expect(r.ok).toBe(false);
  });
  it("allows deleting a normal family with a reason", () => {
    expect(evaluateAccountAction(acctReq()).ok).toBe(true);
  });
});

describe("confirmationMatches", () => {
  it("matches case-insensitively, trimmed", () => {
    expect(confirmationMatches("  Sam Rivera ", "sam rivera")).toBe(true);
    expect(confirmationMatches("parent@example.com", "Parent@Example.com")).toBe(true);
  });
  it("rejects a mismatch or blank", () => {
    expect(confirmationMatches("wrong", "sam rivera")).toBe(false);
    expect(confirmationMatches("", "sam")).toBe(false);
    expect(confirmationMatches(null, "sam")).toBe(false);
  });
});
