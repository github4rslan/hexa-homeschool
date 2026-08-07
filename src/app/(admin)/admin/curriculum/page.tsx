import type { Metadata } from "next";
import { BookOpen, CheckCircle2, HelpCircle, Layers3 } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getQuestions, listTopics } from "@/lib/db/repo";
import type { QuestionDoc, Subject } from "@/lib/db/types";
import { QuestionForm } from "./question-form";

export const metadata: Metadata = { title: "Admin - Curriculum CMS" };
export const dynamic = "force-dynamic";

const SUBJECT_LABEL: Record<Subject, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};

const SPEC_REFERENCE: Record<Subject, string> = {
  mathematics: "Pearson Edexcel 1MA1",
  english: "AQA 8700 / 8702",
  science: "AQA Combined Science Trilogy 8464",
};

const KIND_VARIANT: Record<QuestionDoc["kind"], "violet" | "cyan" | "neon" | "amber"> = {
  diagnostic: "violet",
  practice: "cyan",
  mastery: "neon",
  stretch: "amber",
};

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string }>;
}) {
  const { added } = await searchParams;
  const [topics, questions] = await Promise.all([
    listTopics(),
    getQuestions({}, 1000),
  ]);

  const topicsBySubject = new Map<Subject, typeof topics>();
  for (const subject of Object.keys(SUBJECT_LABEL) as Subject[]) {
    topicsBySubject.set(
      subject,
      topics.filter((topic) => topic.subject === subject),
    );
  }

  const questionsByTopic = new Map<string, QuestionDoc[]>();
  for (const question of questions) {
    const bucket = questionsByTopic.get(question.topic_tag) ?? [];
    bucket.push(question);
    questionsByTopic.set(question.topic_tag, bucket);
  }
  for (const bucket of questionsByTopic.values()) {
    bucket.sort((a, b) => {
      const kindOrder = { diagnostic: 0, practice: 1, mastery: 2, stretch: 3 };
      return (
        kindOrder[a.kind] - kindOrder[b.kind] ||
        a.tier - b.tier ||
        a.prompt.localeCompare(b.prompt)
      );
    });
  }

  const subjectStats = (Object.keys(SUBJECT_LABEL) as Subject[]).map((subject) => {
    const subjectTopics = topicsBySubject.get(subject) ?? [];
    const subjectQuestions = questions.filter((q) => q.subject === subject);
    return { subject, topics: subjectTopics.length, questions: subjectQuestions.length };
  });

  return (
    <>
      <AdminTopbar
        title="Curriculum CMS"
        subtitle="Live topics and human-authored questions from the production bank"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Active subjects"
            value={subjectStats.filter((s) => s.topics > 0).length.toLocaleString()}
            hint="core GCSE subjects"
            accent="violet"
          />
          <MetricCard
            label="Total topics"
            value={topics.length.toLocaleString()}
            accent="cyan"
          />
          <MetricCard
            label="Question bank"
            value={questions.length.toLocaleString()}
            hint="diagnostic, practice, mastery"
            accent="neon"
          />
          <MetricCard
            label="Pending review"
            value="0"
            hint="workflow not connected"
            accent="amber"
          />
        </section>

        {added && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-300">
            <CheckCircle2 className="h-4 w-4" />
            Question added to the live question bank.
          </div>
        )}

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fog-50">Subjects</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectStats.map((stat) => (
              <Card key={stat.subject} variant="glass" padding="lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-400/30">
                    <BookOpen className="h-4 w-4 text-violet-300" />
                  </div>
                  <Badge variant="outline" size="sm">
                    Live
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-fog-50">
                  {SUBJECT_LABEL[stat.subject]}
                </h3>
                <p className="mt-1 mb-4 text-[10px] font-mono uppercase tracking-widest text-fog-500">
                  {SPEC_REFERENCE[stat.subject]}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <div className="text-fog-500">Topics</div>
                    <div className="font-mono font-semibold text-fog-100">
                      {stat.topics}
                    </div>
                  </div>
                  <div>
                    <div className="text-fog-500">Questions</div>
                    <div className="font-mono font-semibold text-fog-100">
                      {stat.questions}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-fog-50">Topics and questions</h2>
            <p className="mt-0.5 text-xs text-fog-500">
              These are the same questions served in child lessons and parent previews.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {(Object.keys(SUBJECT_LABEL) as Subject[]).map((subject) => (
              <Card key={subject} variant="glass" padding="lg">
                <div className="mb-5 flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-violet-300" />
                  <h3 className="text-base font-semibold text-fog-50">
                    {SUBJECT_LABEL[subject]}
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {(topicsBySubject.get(subject) ?? []).map((topic) => {
                    const topicQuestions = questionsByTopic.get(topic.topic_tag) ?? [];
                    return (
                      <article
                        id={topic.topic_tag}
                        key={topic.topic_tag}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-4 scroll-mt-24"
                      >
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-fog-50">
                                {topic.title}
                              </h4>
                              <Badge variant="outline" size="sm">
                                KS{topic.key_stage ?? 4}
                              </Badge>
                              <Badge variant="outline" size="sm">
                                {topic.working_grade_band}
                              </Badge>
                            </div>
                            <p className="mt-1 max-w-3xl text-sm text-fog-400">
                              {topic.summary}
                            </p>
                            <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-fog-600">
                              {topic.topic_tag}
                            </p>
                          </div>
                          <Badge variant="cyan" size="sm">
                            {topicQuestions.length} questions
                          </Badge>
                        </div>

                        {topicQuestions.length > 0 ? (
                          <div className="mb-4 overflow-hidden rounded-xl border border-white/5">
                            <div className="grid grid-cols-[110px_70px_1fr_90px] gap-3 border-b border-white/5 bg-white/[0.03] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-fog-500">
                              <span>Type</span>
                              <span>Tier</span>
                              <span>Prompt</span>
                              <span>Answer</span>
                            </div>
                            <div className="divide-y divide-white/5">
                              {topicQuestions.map((question) => (
                                <div
                                  key={question._id?.toHexString() ?? question.prompt}
                                  className={[
                                    "grid grid-cols-[110px_70px_1fr_90px] gap-3 px-3 py-3 text-sm",
                                    added === question._id?.toHexString()
                                      ? "bg-neon-500/10"
                                      : "bg-transparent",
                                  ].join(" ")}
                                >
                                  <Badge
                                    variant={KIND_VARIANT[question.kind]}
                                    size="sm"
                                  >
                                    {question.kind}
                                  </Badge>
                                  <span className="font-mono text-fog-300">
                                    {question.tier}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="break-words text-fog-100">
                                      {question.prompt}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs text-fog-500">
                                      {question.explanation}
                                    </p>
                                  </div>
                                  <span className="truncate text-xs text-fog-300">
                                    {question.options[question.correct_index] ?? "-"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
                            <HelpCircle className="h-4 w-4" />
                            No questions authored for this topic yet.
                          </div>
                        )}

                        <QuestionForm
                          topicTag={topic.topic_tag}
                          subject={topic.subject}
                          keyStage={topic.key_stage ?? 4}
                        />
                      </article>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
