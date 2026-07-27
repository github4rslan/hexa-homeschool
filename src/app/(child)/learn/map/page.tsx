import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentParentId, getActiveChild, competenceMapForChild } from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { Subject } from "@/lib/db/types";
import { SubjectPath } from "@/components/child/subject-path";
import { AchievementShelf } from "@/components/child/achievement-shelf";
import { buildAchievementShelf } from "@/lib/engine/achievements";

export const metadata: Metadata = { title: "My journey" };
export const dynamic = "force-dynamic";

const SUBJECT_META: { id: Subject; label: string; accent: string }[] = [
  { id: "mathematics", label: "Maths", accent: "violet" },
  { id: "english", label: "English", accent: "cyan" },
  { id: "science", label: "Science", accent: "neon" },
];

export default async function ProgressMapPage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn/map");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  const map = await competenceMapForChild(child._id);
  const shelf = buildAchievementShelf(
    SUBJECT_META.map((s) => ({
      subject: s.id,
      accent: s.accent,
      nodes: map[s.id].map((n) => ({
        topicTag: n.topicTag,
        title: n.title,
        state: n.state,
        certifiedAt: n.certifiedAt,
      })),
    })),
  );
  const firstName = child.full_name.split(" ")[0];
  const { highlight } = await searchParams;
  // Which subject contains the highlighted topic (deep-linked from a lesson).
  const highlightSubject = highlight
    ? (Object.keys(map) as Subject[]).find((s) =>
        map[s].some((n) => n.topicTag === highlight),
      )
    : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/learn"
        className="child-touch mb-6 inline-flex items-center gap-2 text-base text-fog-300 hover:text-fog-100"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-semibold text-fog-50 sm:text-5xl">
          {firstName}&apos;s journey
        </h1>
        <p className="mt-3 text-xl text-fog-300">
          Every topic you&apos;ll master — and how far you&apos;ve come.
        </p>
      </div>

      {shelf.totalCount > 0 && (
        <AchievementShelf
          badges={shelf.badges}
          earnedCount={shelf.earnedCount}
          totalCount={shelf.totalCount}
        />
      )}

      <div className="flex flex-col gap-12">
        {SUBJECT_META.map((s) => (
          <SubjectPath
            key={s.id}
            label={s.label}
            accent={s.accent}
            nodes={map[s.id]}
            highlightTag={highlightSubject === s.id ? highlight : undefined}
          />
        ))}
      </div>
    </div>
  );
}
