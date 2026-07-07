import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DailyFlow } from "@/components/child/daily-flow";
import { FocusFrame } from "@/components/child/focus-frame";
import { HandoffPause } from "@/components/child/handoff-pause";
import {
  getTopic,
  firstTopic,
  firstTopicInBandForChild,
  childFloorBand,
  getQuestions,
  currentParentId,
  getActiveChild,
  getLessonProgress,
  getTutorHandoffState,
  todaysCheckin,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { normalizeInteraction } from "@/lib/child/interactions";
import { normalizeWorkedExample } from "@/lib/child/worked-examples";
import { normalizeTeachingAnimation } from "@/lib/child/teaching-animations";
import type { Question } from "@/components/lesson/lesson-player";

export const metadata: Metadata = { title: "Lesson" };
export const dynamic = "force-dynamic";

export default async function ChildLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;

  // The active child (drives voice, accent, and the age band).
  const parentId = await currentParentId();
  const child = parentId
    ? await getActiveChild(parentId, await readActiveChildId())
    : null;
  const voiceId = child?.voice_id ?? null;
  const accent = child?.accent ?? null;
  // Auto-narration preference — default ON (legacy-safe: undefined ⇒ on).
  const narrationAutoplay = child?.narration_autoplay !== false;
  // Gentle sound/haptic cues — default ON, opt-out in "My stuff".
  const soundCues = child?.sound_cues !== false;
  // Picture-first / low-text mode — fewer words, icon-first (default off).
  const lowText = child?.low_text === true;
  // Today's emoji check-in (1–5, null = none) — tunes Eddie's tone only.
  const mood = child?._id ? (await todaysCheckin(child._id))?.mood ?? null : null;

  // Resolve the topic: explicit ?topic= wins; otherwise the child's first
  // in-band maths topic (band-aware), falling back to the global first topic.
  const topicDoc = topic
    ? await getTopic(topic)
    : child?._id
      ? await firstTopicInBandForChild(
          child._id,
          "mathematics",
          childFloorBand(child.date_of_birth),
        )
      : await firstTopic("mathematics");
  if (!topicDoc) redirect("/learn");

  const firstName = child?.full_name.split(" ")[0] ?? "";

  // Five-attempt handoff (Wave 7, Phase 4): if this topic is resting awaiting a
  // tutor, never re-serve the lesson — show the calm pause instead. A logged
  // tutor session lifts the pause and leaves a note surfaced in the explainer.
  const handoff = child?._id
    ? await getTutorHandoffState(child._id, topicDoc.topic_tag)
    : { paused: false, note: null };
  if (handoff.paused) {
    return (
      <FocusFrame>
        <HandoffPause
          variant="resting"
          topicTitle={topicDoc.title}
          firstName={firstName}
          accent={accent}
        />
      </FocusFrame>
    );
  }

  // Daily lessons stay in the topic's band (legacy topics treated as GCSE).
  const docs = await getQuestions(
    { topicTag: topicDoc.topic_tag, keyStage: topicDoc.key_stage ?? 4 },
    50,
  );
  const toQuestion = (q: (typeof docs)[number]): Question => ({
    id: q._id!.toHexString(),
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correct_index,
    explanation: q.explanation,
    interaction: normalizeInteraction(q.interaction),
    hints: q.hints,
    misconceptions: q.misconceptions,
    workedSolution: normalizeWorkedExample(q.worked_solution),
    teachingAnimation: normalizeTeachingAnimation({
      raw: q.teaching_animation,
      prompt: q.prompt,
      explanation: q.explanation,
    }),
  });

  const questions: Question[] = docs
    .filter((q) => q.kind === "practice")
    .map(toQuestion);
  const masteryQuestions: Question[] = docs
    .filter((q) => q.kind === "mastery")
    .map(toQuestion);

  // Build the explainer "points" from real practice-question explanations —
  // these are human-authored, so they're genuine teaching content, not mock.
  const points = docs
    .filter((q) => q.kind === "practice")
    .slice(0, 3)
    .map((q) => q.explanation);

  if (questions.length === 0 && masteryQuestions.length === 0) {
    redirect("/learn");
  }

  // Server-synced mid-lesson progress (MongoDB) for a warm cross-device resume.
  // The client also reconciles a localStorage copy for instant same-device resume.
  const savedProgress =
    parentId && child?._id
      ? await getLessonProgress(parentId, child._id, topicDoc.topic_tag)
      : null;
  const resumeKey = child?._id?.toHexString() ?? "anon";

  return (
    <FocusFrame>
      <DailyFlow
        title={topicDoc.title}
        summary={topicDoc.summary}
        points={points.length ? points : [topicDoc.summary]}
        workedExample={normalizeWorkedExample(topicDoc.worked_example)}
        questions={questions}
        masteryQuestions={masteryQuestions}
        curriculumTopic={topicDoc.topic_tag}
        voiceId={voiceId}
        keyStage={topicDoc.key_stage ?? 4}
        accent={accent}
        narrationAutoplay={narrationAutoplay}
        soundCues={soundCues}
        lowText={lowText}
        mood={mood}
        savedProgress={savedProgress}
        firstName={firstName}
        resumeKey={resumeKey}
        tutorNote={handoff.note}
      />
    </FocusFrame>
  );
}
