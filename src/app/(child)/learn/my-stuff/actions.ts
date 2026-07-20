"use server";

import { revalidatePath } from "next/cache";
import { currentParentId, getActiveChild, setChildPreferences } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { isCuratedVoice } from "@/lib/ai/config";
import { isAccent } from "@/lib/child/accents";
import { normalizeTextScale } from "@/lib/child/reading-supports";

export interface SavePrefsResult {
  ok: boolean;
}

/** SEND-aware reading supports (F3), all optional + child-controlled. */
export interface ReadingSupportInput {
  readingFont?: boolean;
  textScale?: number;
  readingRuler?: boolean;
}

/**
 * Save the child's voice + accent + "read questions to me" choices and the
 * SEND-aware reading supports. Validates voice/accent against the curated
 * allow-lists and coerces the text scale to an allowed value (never trust a raw
 * value), then persists via the ownership-checked repo setter. No-ops gracefully
 * without a session/child.
 */
export async function saveChildPreferences(
  voiceId: string,
  accent: string,
  narrationAutoplay?: boolean,
  soundCues?: boolean,
  lowText?: boolean,
  reading?: ReadingSupportInput,
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
    lowText: typeof lowText === "boolean" ? lowText : undefined,
    readingFont:
      typeof reading?.readingFont === "boolean" ? reading.readingFont : undefined,
    textScale:
      reading?.textScale !== undefined
        ? normalizeTextScale(reading.textScale)
        : undefined,
    readingRuler:
      typeof reading?.readingRuler === "boolean"
        ? reading.readingRuler
        : undefined,
  });
  revalidatePath("/learn");
  return { ok };
}
