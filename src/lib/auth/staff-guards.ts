/**
 * Pure decision logic for privileged staff/account mutations. No DB, no
 * `server-only` — every guard is unit-tested in tests/ so the invariants that
 * protect a public, children's platform are provable, not just asserted in a UI.
 *
 * The repo/server-action layer gathers the live facts (who the actor is, the
 * target's current role, how many admins exist) and asks these functions for a
 * yes/no. Default-deny: anything not explicitly allowed is refused.
 */

import type { StaffRole } from "./rbac";

/** The role a target account will have after a change. `null` = normal parent. */
export type NextRole = StaffRole | null;

export interface GuardResult {
  ok: boolean;
  /** Present when ok === false — a short, operator-facing reason. */
  error?: string;
}

const OK: GuardResult = { ok: true };
function deny(error: string): GuardResult {
  return { ok: false, error };
}

/** A non-empty, trimmed justification is mandatory for every privileged write. */
export function requireReason(reason: string | null | undefined): GuardResult {
  if (!reason || reason.trim().length === 0) {
    return deny("A reason is required for this action.");
  }
  if (reason.trim().length > 500) {
    return deny("Reason is too long (max 500 characters).");
  }
  return OK;
}

export interface RoleChangeRequest {
  /** Effective role of the staff member performing the change. */
  actorRole: StaffRole | null;
  /** Account id of the actor and of the target (hex strings). */
  actorId: string;
  targetId: string;
  /** The target's current effective role (null = not staff). */
  targetCurrentRole: StaffRole | null;
  /** The role to move the target to (null = revoke to normal parent). */
  nextRole: NextRole;
  reason: string;
  /** How many accounts currently resolve to admin, BEFORE this change. */
  adminCount: number;
}

/**
 * Decide whether a staff role grant/revoke/change may proceed. Enforces, in
 * order: admin-only, reason required, no-op rejected, no self-lockout (an admin
 * can't strip their own admin), and no last-admin removal. All server-side —
 * the UI mirrors these but never substitutes for them.
 */
export function evaluateRoleChange(req: RoleChangeRequest): GuardResult {
  if (req.actorRole !== "admin") {
    return deny("Only an admin can change staff roles.");
  }

  const reasonCheck = requireReason(req.reason);
  if (!reasonCheck.ok) return reasonCheck;

  if (req.nextRole === req.targetCurrentRole) {
    return deny("No change — the account already has that role.");
  }

  const removesAdminFromTarget =
    req.targetCurrentRole === "admin" && req.nextRole !== "admin";

  // Self-lockout: an admin may never remove their own admin role (they can ask
  // another admin to do it). Blocked regardless of how many admins exist.
  if (req.actorId === req.targetId && removesAdminFromTarget) {
    return deny("You cannot remove your own admin role.");
  }

  // Last-admin: the system must always retain at least one admin.
  if (removesAdminFromTarget && req.adminCount <= 1) {
    return deny("Cannot remove the last remaining admin.");
  }

  return OK;
}

export interface AccountActionRequest {
  actorRole: StaffRole | null;
  actorId: string;
  targetId: string;
  /** True when the target account currently resolves to admin. */
  targetIsAdmin: boolean;
  reason: string;
  adminCount: number;
}

/**
 * Decide whether a destructive account action (suspend / delete) may proceed.
 * Admin-only, reason required, never against yourself, and never against the
 * last admin (deleting/suspending the final admin would lock the platform).
 */
export function evaluateAccountAction(req: AccountActionRequest): GuardResult {
  if (req.actorRole !== "admin") {
    return deny("Only an admin can perform this action.");
  }
  const reasonCheck = requireReason(req.reason);
  if (!reasonCheck.ok) return reasonCheck;

  if (req.actorId === req.targetId) {
    return deny("You cannot perform this action on your own account.");
  }
  if (req.targetIsAdmin && req.adminCount <= 1) {
    return deny("Cannot suspend or delete the last remaining admin.");
  }
  return OK;
}

/**
 * Typed-confirmation guard for the highest-risk deletes. The operator must type
 * the exact target identifier (child name / family email) to proceed — a
 * case-insensitive, whitespace-trimmed match.
 */
export function confirmationMatches(
  typed: string | null | undefined,
  expected: string,
): boolean {
  if (!typed) return false;
  return typed.trim().toLowerCase() === expected.trim().toLowerCase();
}
