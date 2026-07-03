"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActor } from "@/lib/admin/actor";
import { setFeatureFlag } from "@/lib/db/repo";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/** Toggle a persisted feature flag (admin-only, reason required, audited). */
export async function toggleFeatureFlagAction(
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const key = String(formData.get("key") || "");
  const enabled = String(formData.get("enabled") || "") === "true";
  const reason = String(formData.get("reason") || "");

  const res = await setFeatureFlag({
    actorId: actor.id,
    actorEmail: actor.email,
    key,
    enabled,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/settings");
  return { ok: true, message: `${key} set to ${enabled ? "on" : "off"}.` };
}
