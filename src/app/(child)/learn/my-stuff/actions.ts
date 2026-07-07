"use server";

import { revalidatePath } from "next/cache";
import { currentParentId, getActiveChild, setChildPreferences } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { isCuratedVoice } from "@/lib/ai/config";
import { isAccent } from "@/lib/child/accents";

export interface SavePrefsResult {
  ok: boolean;
}

/**
 * Save the child's voice + accent + "read questions to me" choices. Validates
 * voice/accent against the curated allow-lists (never trust a raw id), then
 * persists via the ownership-checked repo setter. No-ops gracefully without a
 * session/child.
 */
export async function saveChildPreferences(
  voiceId: string,
  accent: string,
  narrationAutoplay?: boolean,
  soundCues?: boolean,
): Promise<SavePrefsResult> {
  const parentId = await currentParentId();
  if (!parentId) return { ok: false };
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) return { ok: false };

  const ok = await setChildPreferences(parentId, child._id, {
    voiceId: isCuratedVoice(voiceId) ? voiceId : undefined,
    accent: isAccent(accent) ? accent : undefined,
    narrationAutoplay:
      typeof narrationAutoplay === "boolean" ? narrationAutoplay : undefined,
    soundCues: typeof soundCues === "boolean" ? soundCues : undefined,
  });
  revalidatePath("/learn");
  return { ok };
}
