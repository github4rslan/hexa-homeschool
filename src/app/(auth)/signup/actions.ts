"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ParentInsert = Database["public"]["Tables"]["parents"]["Insert"];

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Provision parent row
  if (data.user) {
    const parentRow: ParentInsert = {
      auth_user_id: data.user.id,
      email,
      full_name: fullName,
    };
    // Cast required: @supabase/ssr generics don't always propagate Database type.
    await supabase.from("parents").insert(parentRow as never);
  }

  revalidatePath("/", "layout");

  if (data.user && !data.session) {
    redirect(
      `/signup?success=${encodeURIComponent("Check your email to confirm your account.")}`,
    );
  }

  redirect("/onboarding");
}
