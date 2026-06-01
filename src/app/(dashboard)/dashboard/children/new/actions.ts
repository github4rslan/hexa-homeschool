"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ChildInsert = Database["public"]["Tables"]["children"]["Insert"];
type ParentLookup = {
  id: string;
};

export async function createChild(formData: FormData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") || "");
  const targetExamWindow = String(formData.get("target_exam_window") || "").trim();
  const sendIndicatorsRaw = String(formData.get("send_indicators") || "").trim();

  if (!fullName || !dateOfBirth) {
    redirect(
      `/dashboard/children/new?error=${encodeURIComponent("Name and date of birth are required.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/children/new");
  }

  const { data } = await supabase
    .from("parents")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const parent = data as ParentLookup | null;

  if (!parent) {
    redirect(
      `/dashboard/children/new?error=${encodeURIComponent("Your parent profile was not found. Try signing out and back in.")}`,
    );
  }

  const child: ChildInsert = {
    parent_id: parent.id,
    full_name: fullName,
    date_of_birth: dateOfBirth,
    target_exam_window: targetExamWindow || null,
    send_indicators: sendIndicatorsRaw
      ? sendIndicatorsRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  };

  const { error } = await supabase.from("children").insert(child as never);

  if (error) {
    redirect(`/dashboard/children/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  // Flow straight into the diagnostic — the natural next step after adding a child.
  redirect("/onboarding/diagnostic");
}
