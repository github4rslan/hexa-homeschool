"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  getActiveChild,
  recordCheckin,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { verifyParentPin } from "@/lib/auth/parent-pin";

export interface CheckinResult {
  ok: boolean;
  difficultyDelta: number;
}

/** Record the child's daily mood check-in (drives a small difficulty nudge). */
export async function submitCheckin(mood: number): Promise<CheckinResult> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false, difficultyDelta: 0 };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { ok: false, difficultyDelta: 0 };

  const safeMood = Math.max(1, Math.min(5, Math.round(mood)));
  const res = await recordCheckin(parentId, child._id, safeMood);
  revalidatePath("/learn");
  return { ok: res.ok, difficultyDelta: res.difficultyDelta };
}

export interface ParentGateResult {
  ok: boolean;
  error?: string;
  setupRequired?: boolean;
}

export async function verifyParentGatePin(
  _prevState: ParentGateResult,
  formData: FormData,
): Promise<ParentGateResult> {
  const parentId = await currentParentId();
  if (!parentId) {
    return { ok: false, error: "Please sign in again." };
  }

  return verifyParentPin(parentId, formData.get("parent_pin"));
}
