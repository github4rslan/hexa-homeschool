"use server";

import { revalidatePath } from "next/cache";
import {
  currentParentId,
  findParentById,
  getActiveChild,
  recordCheckin,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { verifyPassword } from "@/lib/auth/password";

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

  const parent = await findParentById(parentId);
  if (!parent) {
    return { ok: false, error: "Please sign in again." };
  }

  if (!parent.parent_pin_hash) {
    return {
      ok: false,
      setupRequired: true,
      error: "Set a parent PIN in Settings before leaving child mode.",
    };
  }

  const pin = String(formData.get("parent_pin") || "").trim();
  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, error: "Enter the 4-digit parent PIN." };
  }

  const ok = await verifyPassword(pin, parent.parent_pin_hash);
  if (!ok) {
    return { ok: false, error: "That PIN was not recognised." };
  }

  return { ok: true };
}
