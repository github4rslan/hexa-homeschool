"use server";

import { revalidatePath } from "next/cache";
import { dismissOnboarding } from "@/lib/onboarding-dismiss";

/** Hide the getting-started checklist for this parent (cookie-backed). */
export async function dismissGettingStarted(): Promise<void> {
  await dismissOnboarding();
  revalidatePath("/dashboard");
}
