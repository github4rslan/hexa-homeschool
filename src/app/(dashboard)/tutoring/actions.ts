"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  currentParentId,
  findParentById,
  getActiveChild,
  createTutorBooking,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { Subject } from "@/lib/db/types";
import { appUrl } from "@/lib/email/verification";
import { notifyTutorBookingRequested } from "@/lib/email/tutoring";

export async function requestTutor(formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/tutoring");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) {
    redirect(`/tutoring?error=${encodeURIComponent("Add a child first.")}`);
  }

  const subjectRaw = String(formData.get("subject") || "");
  const subject: Subject | null =
    subjectRaw === "mathematics" || subjectRaw === "english" || subjectRaw === "science"
      ? subjectRaw
      : null;
  const note = String(formData.get("note") || "").trim().slice(0, 500);
  const requestedSlot = String(formData.get("requested_slot") || "").trim().slice(0, 120);

  const res = await createTutorBooking(parentId, child._id, {
    subject,
    note,
    requestedSlot,
  });

  if (!res.ok) {
    redirect(`/tutoring?error=${encodeURIComponent(res.reason ?? "Could not book.")}`);
  }
  const parent = await findParentById(parentId);
  if (parent) {
    await notifyTutorBookingRequested({
      parentEmail: parent.email,
      parentName: parent.full_name,
      childName: child.full_name,
      requestedSlot,
      detailUrl: `${appUrl()}/tutoring`,
    });
  }
  revalidatePath("/tutoring");
  redirect("/tutoring?booked=1");
}
