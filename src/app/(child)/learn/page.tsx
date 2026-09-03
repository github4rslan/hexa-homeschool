import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Map as MapIcon, Sparkles, GraduationCap, Settings2 } from "lucide-react";
import { EmojiCheckin } from "@/components/child/emoji-checkin";
import { ParentNoteCard } from "@/components/child/parent-note-card";
import { StreakFlame } from "@/components/child/streak-flame";
import { WeekStrip } from "@/components/child/week-strip";
import { QuestCards, type Quest } from "@/components/child/quest-cards";
import { ResumeCards } from "@/components/child/resume-card";
import { TodayReflection } from "@/components/child/today-reflection";
import { buildResumeCards } from "@/lib/child/resume";
import {
  currentParentId,
  listChildren,
  resolveActiveChild,
  getInProgressLessons,
  resolveDailyQuestTopic,
  childFloorBand,
  certifiedBySubject,
  todaysCheckin,
  childStreak,
  childWeekStrip,
  todaysCompletedTopicTags,
  listTopics,
  dueReviewWarmup,
  getWeeklySchedule,
  weekInReview,
  tutorPausedTags,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { accentPreset } from "@/lib/child/accents";
import { isBirthdayToday } from "@/lib/child/birthday";
import { WeekInReview } from "@/components/dashboard/week-in-review";
import { mockUnlockCount } from "@/lib/engine/mock-gate";
import type { Subject } from "@/lib/db/types";

export const metadata: Metadata = { title: "Learn" };
export const dynamic = "force-dynamic";

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
  // B2 (perf): resolve the active child locally from the already-owned sibling
  // list instead of a second, fully redundant Mongo round-trip.
  const [siblings, activeChildId] = await Promise.all([
    listChildren(parentId),
    readActiveChildId(),
  ]);
  const child = resolveActiveChild(siblings, activeChildId);
  if (!child?._id) redirect("/dashboard");

  // B1 (perf): every read for the hub is independent of the others, so they are
  // issued as one concurrent batch rather than a serial await-waterfall. The
  // child waits on the slowest read, not on the sum of them all.
  const [
    certified,
    checkin,
    streak,
    weekDays,
    doneTags,
    warmups,
    review,
    pausedTags,
    allTopics,
    inProgress,
    schedule,
  ] = await Promise.all([
    certifiedBySubject(child._id),
    todaysCheckin(child._id),
    childStreak(child._id),
    childWeekStrip(child._id),
    todaysCompletedTopicTags(child._id),
    dueReviewWarmup(child._id, 3),
    weekInReview(parentId, child),
    tutorPausedTags(child._id),
    listTopics(),
    // F1: "Continue where you left off" surfaces any genuinely in-progress
    // lesson (a lesson_progress row exists only while unfinished).
    getInProgressLessons(parentId, child._id),
    getWeeklySchedule(parentId, child._id),
  ]);

  const checkedIn = !!checkin;
  // F4: a low mood (≤2) already nudges difficulty silently — also acknowledge it
  // warmly so the calm ethos is visible. Encouraging framing, never diagnostic.
  const lowMood = !!checkin && checkin.mood <= 2;
  const warmupCount = warmups.length;

  // Map each completed-today tag to its subject so a subject's quest reads as
  // "done today" once any lesson in it is completed.
  const subjectOfTag = new Map(allTopics.map((t) => [t.topic_tag, t.subject]));
  const doneSubjects = new Set<Subject>();
  for (const tag of doneTags) {
    const subj = subjectOfTag.get(tag);
    if (subj) doneSubjects.add(subj);
  }

  const topicMeta = new Map(
    allTopics.map((t) => [t.topic_tag, { title: t.title, subject: t.subject }]),
  );
  const resumeCards = buildResumeCards(inProgress, topicMeta);

  const floor = childFloorBand(child.date_of_birth);

  // Today's quests correspond 1:1 to the parent's approved weekly plan: for
  // each subject, prefer the topic the plan assigned to today (same topic,
  // same day as the parent's /schedule). Fall back to the next uncertified
  // topic when there's no plan item for that subject today.
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Monday
  const plannedTagBySubject = new Map<Subject, string>();
  for (const item of schedule?.items ?? []) {
    if (item.day === todayIndex && !plannedTagBySubject.has(item.subject)) {
      plannedTagBySubject.set(item.subject, item.topic_tag);
    }
  }

  // Resolve each subject to a topic that ACTUALLY has a lesson in-band (B2):
  // the planned topic when it's ready, else the next playable in-band topic,
  // else null → the card shows "coming soon" instead of a dead-wall link.
  const resolvedBySubject = new Map<
    Subject,
    { topicTag: string; title: string } | null
  >();
  await Promise.all(
    SUBJECTS.map(async (s) => {
      resolvedBySubject.set(
        s.id,
        await resolveDailyQuestTopic(
          child._id!,
          s.id,
          floor,
          plannedTagBySubject.get(s.id) ?? null,
        ),
      );
    }),
  );

  const quests: Quest[] = SUBJECTS.map((s) => {
    const done = certified[s.id] ?? 0;
    const needed = mockUnlockCount(s.id);
    const courseDone = Math.min(done, needed);
    const courseCertified = done >= needed;
    const topicTag = resolvedBySubject.get(s.id)?.topicTag;
    // A topic resting for a tutor handoff shows as a calm "resting" card rather
    // than a normal quest — the child isn't pushed back into it (no advancement
    // past an unmastered topic), other subjects stay open.
    const resting = !!topicTag && pausedTags.has(topicTag);
    // No in-band topic has a lesson yet → a calm "coming soon" card, never a tap
    // that dead-walls into "this quest isn't ready yet".
    const comingSoon = !courseCertified && !resting && !topicTag;
    // F6: the parent's planned focus for today — a gentle "start here" nudge on
    // an active, not-yet-done quest. Advisory only (no forced ordering lock).
    const todaysPlan =
      plannedTagBySubject.has(s.id) &&
      !!topicTag &&
      !resting &&
      !comingSoon &&
      !courseCertified &&
      !doneSubjects.has(s.id);
    return {
      id: s.id,
      label: s.label,
      accent: s.accent,
      ring: s.ring,
      href:
        courseCertified
          ? `/learn/mock/${s.id}`
          : topicTag
            ? `/learn/lesson?topic=${topicTag}`
            : "/learn",
      practiceHref: topicTag ? `/learn/lesson?topic=${topicTag}` : "/learn",
      done: doneSubjects.has(s.id),
      resting,
      comingSoon,
      certified: courseCertified,
      todaysPlan,
      progressLabel: `${courseDone}/${needed}`,
      progressPct: Math.round((courseDone / needed) * 100),
    };
  });

  // Lead-position: gently float today's planned subject to the top so the
  // parent's "Tuesday: English" plan connects to the child's day. Stable sort
  // preserves the Maths→English→Science order for everything else.
  quests.sort((a, b) => Number(b.todaysPlan) - Number(a.todaysPlan));

  // F5: once the child has finished today (at least one lesson done AND nothing
  // actionable left — every quest done/certified/resting/coming-soon), offer the
  // calm, optional "Today I learned" reflection.
  const finishedToday =
    doneSubjects.size > 0 &&
    quests.every((q) => q.done || q.certified || q.resting || q.comingSoon);

  const firstName = child.full_name.split(" ")[0];
  const accent = accentPreset(child.accent);
  const isBirthday = isBirthdayToday(child.date_of_birth);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center mb-8">
        <div className="mb-3 flex justify-center">
          <StreakFlame count={streak.current} completedToday={streak.completedToday} />
        </div>
        <div className="mb-4">
          <WeekStrip days={weekDays} accentText={accent.text} />
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-fog-50">
          {isBirthday ? `Happy birthday, ${firstName}! 🎂` : `Hi ${firstName}! 👋`}
        </h1>
        <p className="mt-3 text-xl text-fog-300">
          {isBirthday
            ? "Hope your day is wonderful — here are today's quests when you're ready."
            : lowMood
              ? "Let's take it gentle today — one quest is plenty. 💛"
              : streak.current > 1
                ? `${streak.current} days in a row — lovely work.`
                : "Here are today's quests."}
        </p>
      </div>

      {child.parent_note && child._id && (
        <ParentNoteCard
          note={child.parent_note}
          childId={child._id.toHexString()}
          accentText={accent.text}
          voiceId={child.voice_id ?? undefined}
        />
      )}

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

      <ResumeCards cards={resumeCards} accentText={accent.text} />

      <QuestCards quests={quests} />

      {finishedToday && <TodayReflection accentText={accent.text} />}

      {review && !review.quiet && (
        <div className="mt-5">
          <WeekInReview review={review} variant="child" />
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          href="/learn/map"
          className="child-touch child-panel flex items-center justify-center gap-3 p-5 text-lg font-semibold text-fog-100 transition-all hover:scale-[1.01]"
        >
          <MapIcon className={`h-6 w-6 ${accent.text}`} />
          My journey
        </Link>
        <Link
          href="/learn/mock"
          className="child-touch child-panel flex items-center justify-center gap-3 p-5 text-lg font-semibold text-fog-100 transition-all hover:scale-[1.01]"
        >
          <GraduationCap className={`h-6 w-6 ${accent.text}`} />
          Mock exam
        </Link>
        <Link
          href="/learn/my-stuff"
          className="child-touch child-panel flex items-center justify-center gap-3 p-5 text-lg font-semibold text-fog-100 transition-all hover:scale-[1.01]"
        >
          <Settings2 className={`h-6 w-6 ${accent.text}`} />
          My stuff
        </Link>
      </div>

      <p className="mt-8 text-center text-fog-500">
        Pick a quest to begin. You&apos;ve got this! 💪
      </p>
    </div>
  );
}
