import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentParentId, getActiveChild, dueReviewWarmup } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { WarmupPlayer } from "@/components/child/warmup-player";

export const metadata: Metadata = { title: "Warm-up" };
export const dynamic = "force-dynamic";

export default async function WarmupPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn/warmup");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  const questions = await dueReviewWarmup(child._id, 3);
  // Nothing due — go straight to today's quests.
  if (questions.length === 0) redirect("/learn");

  return (
    <div className="mx-auto max-w-2xl">
      <WarmupPlayer questions={questions} />
    </div>
  );
}
