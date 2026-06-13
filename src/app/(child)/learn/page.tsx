import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Map as MapIcon, Sparkles } from "lucide-react";
import { EmojiCheckin } from "@/components/child/emoji-checkin";
import { StreakFlame } from "@/components/child/streak-flame";
import { QuestCards, type Quest } from "@/components/child/quest-cards";
import {
  currentParentId,
  getActiveChild,
  firstTopic,
  certifiedBySubject,
  todaysCheckin,
  childStreak,
  todaysCompletedTopicTags,
  listTopics,
  dueReviewWarmup,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { Subject } from "@/lib/db/types";

export const metadata: Metadata = { title: "Learn" };
export const dynamic = "force-dynamic";

const TOPICS_PER_SUBJECT = 10;

const SUBJECTS: {
  id: Subject;
  label: string;
  accent: string;
  ring: string;
}[] = [
  { id: "mathematics", label: "Maths", accent: "from-violet-500 to-violet-700", ring: "text-violet-300" },
  { id: "english", label: "English", accent: "from-cyan-500 to-cyan-700", ring: "text-cyan-300" },
  { id: "science", label: "Science", accent: "from-neon-500 to-neon-600", ring: "text-neon-300" },
];

export default async function LearnHubPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  const certified = await certifiedBySubject(child._id);
  const checkedIn = !!(await todaysCheckin(child._id));
  const streak = await childStreak(child._id);
  const doneTags = await todaysCompletedTopicTags(child._id);
  const warmupCount = (await dueReviewWarmup(child._id, 3)).length;

  // Map each completed-today tag to its subject so a subject's quest reads as
  // "done today" once any lesson in it is completed.
  const allTopics = await listTopics();
  const subjectOfTag = new Map(allTopics.map((t) => [t.topic_tag, t.subject]));
  const doneSubjects = new Set<Subject>();
  for (const tag of doneTags) {
    const subj = subjectOfTag.get(tag);
    if (subj) doneSubjects.add(subj);
  }

  const firstTopics = await Promise.all(SUBJECTS.map((s) => firstTopic(s.id)));

  const quests: Quest[] = SUBJECTS.map((s, i) => {
    const done = certified[s.id] ?? 0;
    const topic = firstTopics[i];
    return {
      id: s.id,
      label: s.label,
      accent: s.accent,
      ring: s.ring,
      href: topic ? `/learn/lesson?topic=${topic.topic_tag}` : "/learn/lesson",
      done: doneSubjects.has(s.id),
      progressLabel: `${done}/${TOPICS_PER_SUBJECT}`,
      progressPct: Math.round((done / TOPICS_PER_SUBJECT) * 100),
    };
  });

  const firstName = child.full_name.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center mb-8">
        <div className="mb-3 flex justify-center">
          <StreakFlame count={streak.current} completedToday={streak.completedToday} />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-fog-50">
          Hi {firstName}! 👋
        </h1>
        <p className="mt-3 text-xl text-fog-300">
          {streak.current > 1
            ? `${streak.current} days in a row — lovely work.`
            : "Here are today's quests."}
        </p>
      </div>

      {!checkedIn && (
        <div className="mb-8">
          <EmojiCheckin />
        </div>
      )}

      {warmupCount > 0 && (
        <Link
          href="/learn/warmup"
          className="child-touch child-panel mb-5 flex items-center gap-4 p-5 transition-all hover:scale-[1.01]"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-200">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="text-xl font-semibold text-fog-50">
              Quick warm-up
            </div>
            <div className="text-base text-fog-400">
              {warmupCount === 1
                ? "1 quick question to keep something fresh — you've got this."
                : `${warmupCount} quick questions to keep things fresh — you've got this.`}
            </div>
          </div>
        </Link>
      )}

      <QuestCards quests={quests} />

      <Link
        href="/learn/map"
        className="child-touch child-panel mt-5 flex items-center justify-center gap-3 p-5 text-lg font-semibold text-fog-100 transition-all hover:scale-[1.01]"
      >
        <MapIcon className="h-6 w-6 text-fog-300" />
        See my journey
      </Link>

      <p className="mt-8 text-center text-fog-500">
        Pick a quest to begin. You&apos;ve got this! 💪
      </p>
    </div>
  );
}
