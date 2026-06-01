import { LessonPlayer, type Question } from "@/components/lesson/lesson-player";
import { getQuestions, getTopic, firstTopic } from "@/lib/db/repo";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;

  // Resolve the topic: explicit ?topic=, else the first maths topic.
  const topicDoc = topic ? await getTopic(topic) : await firstTopic("mathematics");
  const topicTag = topicDoc?.topic_tag ?? "maths_algebra_linear";

  // Pull practice + mastery questions for this topic from the real bank.
  const docs = await getQuestions(
    { topicTag, kind: undefined },
    50,
  );
  const questions: Question[] = docs
    .filter((q) => q.kind === "practice" || q.kind === "mastery")
    .map((q) => ({
      id: q._id!.toHexString(),
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correct_index,
      explanation: q.explanation,
    }));

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-violet opacity-20 -z-10 pointer-events-none" />
      <div className="px-6 py-10 lg:px-10 lg:py-16">
        <LessonPlayer
          questions={questions}
          curriculumTopic={topicTag}
          lessonTitle={topicDoc?.title ?? "Lesson"}
          topicTag={topicDoc ? `${subjectLabel(topicDoc.subject)} · ${topicDoc.title}` : "Lesson"}
        />
      </div>
    </div>
  );
}

function subjectLabel(s: string): string {
  return s === "mathematics" ? "Mathematics" : s === "english" ? "English" : "Science";
}
