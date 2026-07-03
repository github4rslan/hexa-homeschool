"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/lib/admin/actor";
import { findParentByEmail, setStaffRole } from "@/lib/db/repo";
import type { NextRole } from "@/lib/auth/staff-guards";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function parseRole(raw: string): NextRole | undefined {
  if (raw === "admin" || raw === "support") return raw;
  if (raw === "none" || raw === "") return null;
  return undefined;
}

/** Grant a staff role to an existing account by email (admin-only, audited). */
export async function grantStaffRoleByEmail(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const reason = String(formData.get("reason") || "");
  const nextRole = parseRole(String(formData.get("role") || ""));
  if (!email) return { ok: false, error: "An account email is required." };
  if (nextRole === undefined || nextRole === null) {
    return { ok: false, error: "Choose a role to grant (support or admin)." };
  }

  const target = await findParentByEmail(email);
  if (!target?._id) {
    return { ok: false, error: "No account found with that email." };
  }

  const res = await setStaffRole({
    actorId: actor.id,
    actorEmail: actor.email,
    targetId: target._id.toHexString(),
    nextRole,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/staff");
  return { ok: true, message: `${email} is now ${nextRole}.` };
}

/** Change or revoke an existing staff member's role by id (admin-only, audited). */
export async function setStaffRoleById(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const targetId = String(formData.get("targetId") || "");
  const reason = String(formData.get("reason") || "");
  const nextRole = parseRole(String(formData.get("role") || ""));
  if (!targetId) return { ok: false, error: "Missing target account." };
  if (nextRole === undefined) return { ok: false, error: "Invalid role." };

  const res = await setStaffRole({
    actorId: actor.id,
    actorEmail: actor.email,
    targetId,
    nextRole,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/staff");
  return {
    ok: true,
    message: nextRole === null ? "Role revoked." : `Role set to ${nextRole}.`,
  };
}
