"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  currentParentId,
  getActiveChild,
  createTutorBooking,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { Subject } from "@/lib/db/types";

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
  revalidatePath("/tutoring");
  redirect("/tutoring?booked=1");
}
