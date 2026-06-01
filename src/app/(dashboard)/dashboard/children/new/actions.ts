"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentParentId, createChild } from "@/lib/db/repo";

export async function createChild_action(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") || "");
  const targetExamWindow = String(formData.get("target_exam_window") || "").trim();
  const sendIndicatorsRaw = String(formData.get("send_indicators") || "").trim();

  if (!fullName || !dateOfBirth) {
    redirect(
      `/dashboard/children/new?error=${encodeURIComponent("Name and date of birth are required.")}`,
    );
  }

  const parentId = await currentParentId();
  if (!parentId) {
    redirect("/login?redirect=/dashboard/children/new");
  }

  const childId = await createChild({
    parentId,
    fullName,
    dateOfBirth,
    targetExamWindow: targetExamWindow || null,
    sendIndicators: sendIndicatorsRaw
      ? sendIndicatorsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  });

  if (!childId) {
    redirect(
      `/dashboard/children/new?error=${encodeURIComponent("Could not save the child profile. Please try again.")}`,
    );
  }

  revalidatePath("/dashboard");
  redirect("/onboarding/diagnostic");
}

// Backwards-compatible export name used by the page form.
export { createChild_action as createChild };
