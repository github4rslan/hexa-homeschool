"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  getActiveChild,
  approveWeeklySchedule,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";

export async function approveSchedule(): Promise<void> {
  const parentId = await currentParentId();
  if (!parentId) return;
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return;
  await approveWeeklySchedule(parentId, child._id);
  revalidatePath("/schedule");
}
