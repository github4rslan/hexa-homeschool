import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentParentId, getActiveChild } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { CHILD_VOICES, ELEVENLABS_DEFAULT_VOICE_ID } from "@/lib/ai/config";
import { ACCENTS, DEFAULT_ACCENT } from "@/lib/child/accents";
import { MyStuffPanel } from "@/components/child/my-stuff-panel";

export const metadata: Metadata = { title: "My stuff" };
export const dynamic = "force-dynamic";

export default async function MyStuffPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn/my-stuff");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl">
      <MyStuffPanel
        voices={CHILD_VOICES}
        accents={ACCENTS}
        currentVoiceId={child.voice_id ?? ELEVENLABS_DEFAULT_VOICE_ID}
        currentAccent={child.accent ?? DEFAULT_ACCENT}
        currentNarrationAutoplay={child.narration_autoplay !== false}
        currentSoundCues={child.sound_cues !== false}
        currentLowText={child.low_text === true}
      />
    </div>
  );
}
