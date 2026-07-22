"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { can, resolveRole } from "@/lib/auth/rbac";
import {
  findParentById,
  getTutorSessionForTutor,
  logTutorSessionAsStaff,
  postMessageAsStaff,
  setTutorAvailability,
} from "@/lib/db/repo";
import { validateMessageBody } from "@/lib/messaging/validate";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl } from "@/lib/email/verification";
import {
  notifyTutorMessage,
  notifyTutorSessionCompleted,
} from "@/lib/email/tutoring";

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
  await notifyTutorMessage({
    to: detail.parentEmail,
    recipientName: detail.parentName,
    senderLabel: detail.tutorName ?? "Your tutor",
    sessionUrl: `${appUrl()}/tutoring/session/${bookingId}`,
  });

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
  const detail = await getTutorSessionForTutor(auth.tutorId, bookingId);

  const res = await logTutorSessionAsStaff({
    staffId: auth.tutorId,
    staffEmail: auth.tutorEmail,
    bookingId,
    note,
    tutorScoped: true,
  });
  if (!res.ok) return { ok: false, error: res.reason ?? "Could not complete session." };
  if (detail) {
    await notifyTutorSessionCompleted({
      parentEmail: detail.parentEmail,
      parentName: detail.parentName,
      childName: detail.childName,
      tutorName: detail.tutorName,
      sessionUrl: `${appUrl()}/tutoring`,
    });
  }

  revalidatePath("/tutor");
  revalidatePath(`/tutor/sessions/${bookingId}`);
  revalidatePath("/tutoring");
  return { ok: true, message: "Session completed." };
}

/**
 * A tutor toggles their own "accepting new sessions" status (F9). Role-gated via
 * requireTutor and self-scoped — only ever writes the signed-in tutor's account.
 * Advisory only; live matching/scheduling stays deferred.
 */
export async function updateTutorAvailability(formData: FormData) {
  const auth = await requireTutor();
  if ("error" in auth) redirect("/login?redirect=/tutor");

  const available = formData.get("tutor_available") === "on";
  await setTutorAvailability(auth.tutorId, available);
  revalidatePath("/tutor");
  redirect("/tutor?saved=1");
}
