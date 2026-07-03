"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { can, resolveRole } from "@/lib/auth/rbac";
import {
  findParentById,
  getTutorSessionForTutor,
  logTutorSessionAsStaff,
  postMessageAsStaff,
} from "@/lib/db/repo";
import { validateMessageBody } from "@/lib/messaging/validate";
import { rateLimit } from "@/lib/rate-limit";

export interface TutorPortalActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

async function requireTutor(): Promise<
  { tutorId: string; tutorEmail: string } | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Please sign in again." };
  const account = await findParentById(session.id);
  const role = account
    ? resolveRole({ role: account.role, is_admin: account.is_admin })
    : null;
  if (!can(role, "tutor.session.read")) {
    return { error: "Tutor access required." };
  }
  return { tutorId: session.id, tutorEmail: session.email ?? "tutor" };
}

export async function sendTutorMessage(
  formData: FormData,
): Promise<TutorPortalActionResult> {
  const auth = await requireTutor();
  if ("error" in auth) return { ok: false, error: auth.error };

  const bookingId = String(formData.get("bookingId") || "");
  const detail = await getTutorSessionForTutor(auth.tutorId, bookingId);
  if (!detail) return { ok: false, error: "Session not found." };

  const valid = validateMessageBody(formData.get("body"));
  if (!valid.ok) return { ok: false, error: valid.error };

  const limited = await rateLimit(`tutor-msg:${auth.tutorId}`, 30, 60_000);
  if (!limited.ok) return { ok: false, error: "You're sending messages quickly." };

  const posted = await postMessageAsStaff("booking", bookingId, valid.body);
  if (!posted) return { ok: false, error: "Could not send message." };

  revalidatePath("/tutor");
  revalidatePath(`/tutor/sessions/${bookingId}`);
  revalidatePath("/tutoring");
  return { ok: true, message: "Message sent." };
}

export async function completeTutorSession(
  formData: FormData,
): Promise<TutorPortalActionResult> {
  const auth = await requireTutor();
  if ("error" in auth) return { ok: false, error: auth.error };

  const bookingId = String(formData.get("bookingId") || "");
  const note = String(formData.get("note") || "");
  if (!bookingId) return { ok: false, error: "Missing session." };
  if (!note.trim()) return { ok: false, error: "Add a short session note." };

  const res = await logTutorSessionAsStaff({
    staffId: auth.tutorId,
    staffEmail: auth.tutorEmail,
    bookingId,
    note,
    tutorScoped: true,
  });
  if (!res.ok) return { ok: false, error: res.reason ?? "Could not complete session." };

  revalidatePath("/tutor");
  revalidatePath(`/tutor/sessions/${bookingId}`);
  revalidatePath("/tutoring");
  return { ok: true, message: "Session completed." };
}
