"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  findParentById,
  updateEscalationStatus,
  recordStaffAction,
} from "@/lib/db/repo";
import { resolveRole, can } from "@/lib/auth/rbac";

export interface EscalationActionResult {
  ok: boolean;
  error?: string;
}

async function requireManage(): Promise<
  { staffId: string; staffEmail: string } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  const parent = await findParentById(session.id);
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;
  if (!can(role, "escalation.manage")) {
    return { error: "You don't have permission to manage escalations." };
  }
  return { staffId: session.id, staffEmail: session.email ?? "staff" };
}

export async function acknowledgeEscalation(
  formData: FormData,
): Promise<EscalationActionResult> {
  const auth = await requireManage();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = String(formData.get("escalationId") || "");
  if (!id) return { ok: false, error: "Missing escalation." };

  const ok = await updateEscalationStatus({
    staffId: auth.staffId,
    staffEmail: auth.staffEmail,
    escalationId: id,
    status: "acknowledged",
    note: String(formData.get("note") || "") || undefined,
  });
  if (!ok) return { ok: false, error: "Could not update." };
  revalidatePath("/admin/escalations");
  return { ok: true };
}

export async function resolveEscalation(
  formData: FormData,
): Promise<EscalationActionResult> {
  const auth = await requireManage();
  if ("error" in auth) return { ok: false, error: auth.error };
  const id = String(formData.get("escalationId") || "");
  if (!id) return { ok: false, error: "Missing escalation." };

  const ok = await updateEscalationStatus({
    staffId: auth.staffId,
    staffEmail: auth.staffEmail,
    escalationId: id,
    status: "resolved",
    note: String(formData.get("note") || "") || undefined,
  });
  if (!ok) return { ok: false, error: "Could not update." };
  revalidatePath("/admin/escalations");
  return { ok: true };
}

/**
 * Log that a staff member viewed an escalation's detail. Viewing a child's
 * distress data is itself sensitive, so it goes in the append-only trail.
 */
export async function logEscalationView(escalationId: string): Promise<void> {
  const auth = await requireManage();
  if ("error" in auth) return;
  await recordStaffAction({
    staffId: auth.staffId,
    staffEmail: auth.staffEmail,
    action: "escalation.view",
    targetCollection: "escalations",
    targetId: escalationId,
  });
}
