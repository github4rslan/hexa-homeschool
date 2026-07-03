import "server-only";

import { getSession } from "@/lib/auth/session";
import { findParentById } from "@/lib/db/repo";
import { resolveRole, type StaffRole } from "@/lib/auth/rbac";
import { clientIp } from "@/lib/auth/client-ip";

/**
 * The authenticated staff actor performing an admin mutation, with their
 * best-effort request IP for the audit trail. Every privileged admin server
 * action funnels through here so the "admin-only" gate and IP capture live in
 * one place.
 */
export interface AdminActor {
  id: string;
  email: string;
  role: StaffRole;
  ip: string | null;
}

/** Resolve the current session as an ADMIN actor, or return a typed error. */
export async function requireAdminActor(): Promise<
  AdminActor | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  const parent = await findParentById(session.id);
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;
  if (role !== "admin") return { error: "Admin access required." };
  let ip: string | null = null;
  try {
    ip = await clientIp();
  } catch {
    ip = null;
  }
  return { id: session.id, email: session.email ?? "admin", role, ip };
}
