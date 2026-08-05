"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  getActiveChild,
  recordCheckin,
  recordChildReflection,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { verifyParentPin } from "@/lib/auth/parent-pin";
import { isReflectionKey, reflectionFeedLine } from "@/lib/child/reflection";

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

/**
 * Record the child's optional one-tap "Today I learned" reflection (F5).
 * Selection-only (a fixed enum) ⇒ no free-text, no distress-gate surface. Stored
 * as a warm line on the parent activity feed, one per child per day. A bad/unknown
 * key is silently ignored (never throws — the child flow must never break).
 */
export async function submitReflection(
  key: string,
): Promise<{ ok: boolean }> {
  if (!isReflectionKey(key)) return { ok: false };
  const parentId = await currentParentId();
  if (!parentId) return { ok: false };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { ok: false };

  const firstName = child.full_name.split(" ")[0];
  const res = await recordChildReflection(
    parentId,
    child,
    reflectionFeedLine(firstName, key),
  );
  revalidatePath("/learn");
  return { ok: res.ok };
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
