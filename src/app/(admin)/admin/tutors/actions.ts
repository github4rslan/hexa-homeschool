"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { requireAdminActor } from "@/lib/admin/actor";
import {
  createTutorAccountAsAdmin,
  findParentById,
  logTutorSessionAsStaff,
  recordStaffAction,
  scheduleTutorBookingAsStaff,
} from "@/lib/db/repo";
import { resolveRole, can } from "@/lib/auth/rbac";

export interface TutorActionResult {
  ok: boolean;
  error?: string;
  message?: string;
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

export async function createTutorAccount(
  formData: FormData,
): Promise<TutorActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const email = String(formData.get("email") || "");
  const fullName = String(formData.get("fullName") || "");
  const temporaryPassword = String(formData.get("temporaryPassword") || "");
  const reason = String(formData.get("reason") || "");

  const res = await createTutorAccountAsAdmin({
    actorId: actor.id,
    actorEmail: actor.email,
    email,
    fullName,
    temporaryPassword,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/tutors");
  revalidatePath("/admin/staff");
  return { ok: true, message: "Tutor account created." };
}

export async function scheduleTutorSession(
  formData: FormData,
): Promise<TutorActionResult> {
  const actor = await requireAdminActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const bookingId = String(formData.get("bookingId") || "");
  const tutorId = String(formData.get("tutorId") || "");
  const scheduledAtRaw = String(formData.get("scheduledAt") || "");
  const durationMinutes = Number(formData.get("durationMinutes") || 30);
  const reason = String(formData.get("reason") || "");
  const scheduledAt = new Date(scheduledAtRaw);

  const res = await scheduleTutorBookingAsStaff({
    staffId: actor.id,
    staffEmail: actor.email,
    bookingId,
    tutorId,
    scheduledAt,
    durationMinutes,
    reason,
    ip: actor.ip,
  });
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/admin/tutors");
  revalidatePath("/tutor");
  revalidatePath("/tutoring");
  return { ok: true, message: "Session scheduled and room created." };
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
  revalidatePath("/tutor");
  revalidatePath("/tutoring");
  return { ok: true };
}
