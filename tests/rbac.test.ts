import { describe, expect, it } from "vitest";
import {
  resolveRole,
  isStaff,
  can,
  parentCan,
  type Permission,
} from "@/lib/auth/rbac";

describe("resolveRole", () => {
  it("prefers an explicit role", () => {
    expect(resolveRole({ role: "support" })).toBe("support");
    expect(resolveRole({ role: "admin" })).toBe("admin");
    expect(resolveRole({ role: "tutor" })).toBe("tutor");
  });

  it("treats legacy is_admin as admin", () => {
    expect(resolveRole({ is_admin: true })).toBe("admin");
  });

  it("role wins over is_admin when both present", () => {
    expect(resolveRole({ role: "support", is_admin: true })).toBe("support");
  });

  it("returns null for non-staff", () => {
    expect(resolveRole({})).toBeNull();
    expect(resolveRole({ is_admin: false })).toBeNull();
  });
});

describe("can (default-deny matrix)", () => {
  const writePerms: Permission[] = [
    "curriculum.write",
    "finance.write",
    "settings.write",
  ];

  it("admin has every permission", () => {
    for (const p of [
      "admin.read",
      "messaging.reply",
      "escalation.manage",
      ...writePerms,
    ] as Permission[]) {
      expect(can("admin", p)).toBe(true);
    }
  });

  it("support can read + reply + manage escalations", () => {
    expect(can("support", "admin.read")).toBe(true);
    expect(can("support", "messaging.reply")).toBe(true);
    expect(can("support", "escalation.manage")).toBe(true);
  });

  it("support cannot perform any write", () => {
    for (const p of writePerms) {
      expect(can("support", p)).toBe(false);
    }
  });

  it("tutor can only use assigned tutoring capabilities", () => {
    expect(can("tutor", "tutor.session.read")).toBe(true);
    expect(can("tutor", "tutor.session.complete")).toBe(true);
    expect(can("tutor", "messaging.reply")).toBe(true);
    expect(can("tutor", "admin.read")).toBe(false);
    expect(can("tutor", "escalation.manage")).toBe(false);
    expect(can("tutor", "finance.write")).toBe(false);
  });

  it("a null (non-staff) role is denied everything", () => {
    expect(can(null, "admin.read")).toBe(false);
    expect(can(null, "finance.write")).toBe(false);
  });
});

describe("isStaff / parentCan", () => {
  it("isStaff reflects resolveRole", () => {
    expect(isStaff({ role: "support" })).toBe(true);
    expect(isStaff({ role: "tutor" })).toBe(true);
    expect(isStaff({ is_admin: true })).toBe(true);
    expect(isStaff({})).toBe(false);
  });

  it("parentCan composes resolve + can", () => {
    expect(parentCan({ is_admin: true }, "finance.write")).toBe(true);
    expect(parentCan({ role: "support" }, "finance.write")).toBe(false);
    expect(parentCan({}, "admin.read")).toBe(false);
  });
});
