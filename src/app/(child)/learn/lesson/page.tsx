import type { Metadata } from "next";
import { DailyFlow } from "@/components/child/daily-flow";
import { FocusFrame } from "@/components/child/focus-frame";
import { HandoffPause } from "@/components/child/handoff-pause";
import { QuestNotReady } from "@/components/child/quest-not-ready";
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
import { normaliseGlossary } from "@/lib/child/glossary";
import { readingSupportsFromChild, NO_READING_SUPPORTS } from "@/lib/child/reading-supports";
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

  const firstName = child?.full_name.split(" ")[0] ?? "";
  // SEND-aware reading supports (F3) — dyslexia font, text zoom, reading ruler.
  const reading = child ? readingSupportsFromChild(child) : NO_READING_SUPPORTS;

  // A planned/linked topic that doesn't resolve is never a silent bounce — the
  // child sees a calm "not ready yet" screen with a clear way back (no dead end).
  if (!topicDoc) {
    return (
      <FocusFrame reading={reading}>
        <QuestNotReady firstName={firstName} accent={accent} />
      </FocusFrame>
    );
  }

  // Five-attempt handoff (Wave 7, Phase 4): if this topic is resting awaiting a
  // tutor, never re-serve the lesson — show the calm pause instead. A logged
  // tutor session lifts the pause and leaves a note surfaced in the explainer.
  const handoff = child?._id
    ? await getTutorHandoffState(child._id, topicDoc.topic_tag)
    : { paused: false, note: null };
  if (handoff.paused) {
    return (
      <FocusFrame reading={reading}>
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
  // F6 — an optional human-authored post-mastery "brain stretch" (harder bonus
  // question, offered only after certification, never scored). Absent for most
  // topics ⇒ the offer simply never appears.
  const stretch: Question | null =
    docs.filter((q) => q.kind === "stretch").map(toQuestion)[0] ?? null;

  // Build the explainer "points" from real practice-question explanations —
  // these are human-authored, so they're genuine teaching content, not mock.
  const points = docs
    .filter((q) => q.kind === "practice")
    .slice(0, 3)
    .map((q) => q.explanation);

  // The topic exists but has no playable questions yet (e.g. a planned tag with
  // no seeded question bank): show the same calm "not ready" screen rather than
  // silently bouncing the child home.
  if (questions.length === 0 && masteryQuestions.length === 0) {
    return (
      <FocusFrame reading={reading}>
        <QuestNotReady
          topicTitle={topicDoc.title}
          firstName={firstName}
          accent={accent}
        />
      </FocusFrame>
    );
  }

  // Server-synced mid-lesson progress (MongoDB) for a warm cross-device resume.
  // The client also reconciles a localStorage copy for instant same-device resume.
  const savedProgress =
    parentId && child?._id
      ? await getLessonProgress(parentId, child._id, topicDoc.topic_tag)
      : null;
  const resumeKey = child?._id?.toHexString() ?? "anon";

  return (
    <FocusFrame reading={reading}>
      <DailyFlow
        title={topicDoc.title}
        summary={topicDoc.summary}
        points={points.length ? points : [topicDoc.summary]}
        glossary={normaliseGlossary(topicDoc.glossary)}
        workedExample={normalizeWorkedExample(topicDoc.worked_example)}
        questions={questions}
        masteryQuestions={masteryQuestions}
        stretch={stretch}
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
