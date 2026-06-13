import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
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
