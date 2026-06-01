"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentParentId, updateChild } from "@/lib/db/repo";

export async function saveChildProfile(childId: string, formData: FormData) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login");

  const fullName = String(formData.get("full_name") || "").trim();
  const dob = String(formData.get("date_of_birth") || "");
  const targetWindow = String(formData.get("target_exam_window") || "").trim();
  const sendRaw = String(formData.get("send_indicators") || "").trim();

  if (!fullName || !dob) {
    redirect(
      `/dashboard/children/${childId}?error=${encodeURIComponent("Name and date of birth are required.")}`,
    );
  }

  const ok = await updateChild(parentId, childId, {
    full_name: fullName,
    date_of_birth: dob,
    target_exam_window: targetWindow || null,
    send_indicators: sendRaw
      ? sendRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  });

  if (!ok) {
    redirect(
      `/dashboard/children/${childId}?error=${encodeURIComponent("Could not save. Please try again.")}`,
    );
  }

  revalidatePath(`/dashboard/children/${childId}`);
  revalidatePath("/dashboard");
  redirect(`/dashboard/children/${childId}?saved=1`);
}
