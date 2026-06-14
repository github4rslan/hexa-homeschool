/**
 * Staff role-based access control. Pure functions (no DB, no `server-only`) so
 * the permission matrix is unit-tested in tests/. Default-deny: anything not
 * explicitly granted is denied, and a non-staff account has no permissions.
 *
 * Legacy migration in CODE (not by editing the db): a `role` is authoritative;
 * absent `role` with `is_admin === true` is treated as "admin".
 */

export type StaffRole = "admin" | "support";

/** A capability a staff member may or may not have. */
export type Permission =
  // Read the admin surface (any staff member).
  | "admin.read"
  // Reply to parents in booking/escalation messaging.
  | "messaging.reply"
  // Acknowledge / resolve escalations.
  | "escalation.manage"
  // Write curriculum, finance, experiments, admin settings.
  | "curriculum.write"
  | "finance.write"
  | "settings.write";

const ADMIN_PERMS: ReadonlySet<Permission> = new Set<Permission>([
  "admin.read",
  "messaging.reply",
  "escalation.manage",
  "curriculum.write",
  "finance.write",
  "settings.write",
]);

const SUPPORT_PERMS: ReadonlySet<Permission> = new Set<Permission>([
  "admin.read",
  "messaging.reply",
  "escalation.manage",
]);

/** Resolve the effective role from a parent doc's fields. Null = not staff. */
export function resolveRole(input: {
  role?: StaffRole;
  is_admin?: boolean;
}): StaffRole | null {
  if (input.role === "admin" || input.role === "support") return input.role;
  if (input.is_admin === true) return "admin"; // legacy
  return null;
}

/** Is this account staff (admin or support)? */
export function isStaff(input: { role?: StaffRole; is_admin?: boolean }): boolean {
  return resolveRole(input) !== null;
}

/** Does the given role grant the permission? Null role = denied. */
export function can(role: StaffRole | null, permission: Permission): boolean {
  if (role === "admin") return ADMIN_PERMS.has(permission);
  if (role === "support") return SUPPORT_PERMS.has(permission);
  return false;
}

/** Convenience: resolve a parent doc's role then check a permission. */
export function parentCan(
  input: { role?: StaffRole; is_admin?: boolean },
  permission: Permission,
): boolean {
  return can(resolveRole(input), permission);
}
