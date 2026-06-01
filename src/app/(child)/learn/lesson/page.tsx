import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DailyFlow } from "@/components/child/daily-flow";
import { getTopic, firstTopic, getQuestions } from "@/lib/db/repo";
import type { Question } from "@/components/lesson/lesson-player";

export const metadata: Metadata = { title: "Lesson" };
export const dynamic = "force-dynamic";

export default async function ChildLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const topicDoc = topic ? await getTopic(topic) : await firstTopic("mathematics");
  if (!topicDoc) redirect("/learn");

  const docs = await getQuestions({ topicTag: topicDoc.topic_tag }, 50);
  const questions: Question[] = docs
    .filter((q) => q.kind === "practice" || q.kind === "mastery")
    .map((q) => ({
      id: q._id!.toHexString(),
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correct_index,
      explanation: q.explanation,
    }));

  // Build the explainer "points" from real practice-question explanations —
  // these are human-authored, so they're genuine teaching content, not mock.
  const points = docs
    .filter((q) => q.kind === "practice")
    .slice(0, 3)
    .map((q) => q.explanation);

  if (questions.length === 0) {
    redirect("/learn");
  }

  return (
    <DailyFlow
      title={topicDoc.title}
      summary={topicDoc.summary}
      points={points.length ? points : [topicDoc.summary]}
      questions={questions}
      curriculumTopic={topicDoc.topic_tag}
    />
  );
}
