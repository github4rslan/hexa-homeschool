"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  findParentById,
  logTutorSessionAsStaff,
  recordStaffAction,
} from "@/lib/db/repo";
import { resolveRole, can } from "@/lib/auth/rbac";

export interface TutorActionResult {
  ok: boolean;
  error?: string;
}

async function requireStaff(): Promise<
  { staffId: string; staffEmail: string } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Not signed in." };
  const parent = await findParentById(session.id);
  const role = parent
    ? resolveRole({ role: parent.role, is_admin: parent.is_admin })
    : null;
  // Logging a tutor session is family-support work — held by admin + support.
  if (!can(role, "messaging.reply")) {
    return { error: "You don't have permission to action tutor requests." };
  }
  return { staffId: session.id, staffEmail: session.email ?? "staff" };
}

/**
 * Staff logs a (manually-run, deferred) tutor session against a queued request.
 * Completes the booking and — for a remediation handoff — feeds the tutor's
 * note back to the child's record and lifts the syllabus pause. Audited.
 */
export async function logTutorSession(
  formData: FormData,
): Promise<TutorActionResult> {
  const auth = await requireStaff();
  if ("error" in auth) return { ok: false, error: auth.error };

  const bookingId = String(formData.get("bookingId") || "");
  const note = String(formData.get("note") || "");
  if (!bookingId) return { ok: false, error: "Missing request." };
  if (!note.trim()) return { ok: false, error: "Add a short note first." };

  const res = await logTutorSessionAsStaff({
    staffId: auth.staffId,
    staffEmail: auth.staffEmail,
    bookingId,
    note,
  });
  if (!res.ok) {
    await recordStaffAction({
      staffId: auth.staffId,
      staffEmail: auth.staffEmail,
      action: "tutor.session_log_failed",
      targetCollection: "tutor_bookings",
      targetId: bookingId,
    });
    return { ok: false, error: res.reason ?? "Could not log the session." };
  }

  revalidatePath("/admin/tutors");
  return { ok: true };
}
