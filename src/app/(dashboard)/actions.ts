"use server";

import { revalidatePath } from "next/cache";
import { currentParentId, getChildById } from "@/lib/db/repo";
import { writeActiveChildId } from "@/lib/active-child";

/** Switch the active child (ownership-checked), then refresh dashboard data. */
export async function setActiveChild(childId: string): Promise<void> {
  const parentId = await currentParentId();
  if (!parentId) return;
  // Only allow switching to a child this parent owns.
  const child = await getChildById(parentId, childId);
  if (!child?._id) return;
  await writeActiveChildId(child._id.toHexString());
  revalidatePath("/dashboard");
}
