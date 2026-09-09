"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { findParentById, setFeedbackFeatured } from "@/lib/db/repo";
import { resolveRole, can } from "@/lib/auth/rbac";

export interface FeedbackActionResult {
  ok: boolean;
  error?: string;
}

async function requireCurate(): Promise<
  { staffId: string; staffEmail: string } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  const parent = await findParentById(session.id);
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;
  if (!can(role, "feedback.curate")) {
    return { error: "You don't have permission to curate testimonials." };
  }
  return { staffId: session.id, staffEmail: session.email ?? "staff" };
}

/**
 * Toggle a feedback row's public "featured" status (F5). Staff-gated (admin
 * only) and further refused server-side unless the parent gave submission-time
 * consent, see `setFeedbackFeatured` in repo.ts for the enforcement.
 */
export async function toggleFeedbackFeatured(
  formData: FormData,
): Promise<FeedbackActionResult> {
  const auth = await requireCurate();
  if ("error" in auth) return { ok: false, error: auth.error };

  const id = String(formData.get("feedbackId") || "");
  if (!id) return { ok: false, error: "Missing feedback." };
  const featured = formData.get("featured") === "true";

  const result = await setFeedbackFeatured(id, featured, auth);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/admin/feedback");
  return { ok: true };
}
