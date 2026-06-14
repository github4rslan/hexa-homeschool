"use server";

import { revalidatePath } from "next/cache";
import { currentParentId, getChildById } from "@/lib/db/repo";
import { writeActiveChildId } from "@/lib/active-child";

/**
 * Switch the active child (ownership-checked), then refresh EVERY child-scoped
 * page so none shows stale data for the previously-active child. The selector
 * appears across the whole parent workspace (dashboard, schedule, portfolio,
 * trajectory/child detail, tutoring), so we revalidate the full tree rather
 * than a single path.
 */
export async function setActiveChild(childId: string): Promise<void> {
  const parentId = await currentParentId();
  if (!parentId) return;
  // Only allow switching to a child this parent owns.
  const child = await getChildById(parentId, childId);
  if (!child?._id) return;
  await writeActiveChildId(child._id.toHexString());
  revalidatePath("/", "layout");
}
