import type { Metadata } from "next";
import { BookOpen, Plus } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin - Curriculum CMS" };

type SubjectRow = {
  id: string;
  academic_domain: "mathematics" | "english" | "science";
  national_spec_reference: string;
};

type TopicRow = {
  id: string;
  subject_id: string;
};

type LessonRow = {
  id: string;
  topic_id: string;
};

const domainLabel = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};

export default async function CurriculumPage() {
  const supabase = await createClient();
  const [
    { data: subjectsData, error: subjectsError },
    { data: topicsData, error: topicsError },
    { data: lessonsData, error: lessonsError },
  ] = await Promise.all([
    supabase
      .from("subject_domains")
      .select("id, academic_domain, national_spec_reference")
      .order("academic_domain"),
    supabase.from("topics").select("id, subject_id"),
    supabase.from("academic_lessons").select("id, topic_id"),
  ]);

  const subjects = (subjectsData || []) as SubjectRow[];
  const topics = (topicsData || []) as TopicRow[];
  const lessons = (lessonsData || []) as LessonRow[];
  const topicSubjectById = new Map(topics.map((topic) => [topic.id, topic.subject_id]));
  const topicCounts = new Map<string, number>();
  const lessonCounts = new Map<string, number>();

  for (const topic of topics) {
    topicCounts.set(topic.subject_id, (topicCounts.get(topic.subject_id) || 0) + 1);
  }

  for (const lesson of lessons) {
    const subjectId = topicSubjectById.get(lesson.topic_id);
    if (subjectId) {
      lessonCounts.set(subjectId, (lessonCounts.get(subjectId) || 0) + 1);
    }
  }

  const subjectCards = subjects.map((subject) => ({
    ...subject,
    name: domainLabel[subject.academic_domain],
    topics: topicCounts.get(subject.id) || 0,
    lessons: lessonCounts.get(subject.id) || 0,
  }));
  const hasQueryError = subjectsError || topicsError || lessonsError;

  return (
    <>
      <AdminTopbar
        title="Curriculum CMS"
        subtitle="Topics, lessons, and content versioning across all GCSE subjects"
      />

      <div className="flex-1 p-6 lg:p-10 max-w-[1600px]">
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Active subjects"
            value={subjectCards.length.toLocaleString()}
            hint={subjectCards.length ? "from Supabase" : "no rows yet"}
            accent="violet"
          />
          <MetricCard
            label="Total topics"
            value={topics.length.toLocaleString()}
            accent="cyan"
          />
          <MetricCard
            label="Lessons published"
            value={lessons.length.toLocaleString()}
            accent="neon"
          />
          <MetricCard
            label="Pending review"
            value="0"
            hint="workflow not connected"
            accent="amber"
          />
        </section>

        {hasQueryError && (
          <div className="mb-8 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-300">
            Curriculum data could not be loaded from Supabase. Check the
            migrations and RLS policies for subject_domains, topics, and
            academic_lessons.
          </div>
        )}

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fog-50">Subjects</h2>
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              New subject
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectCards.map((s) => (
              <Card key={s.id} variant="glass" padding="lg" interactive>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-400/30">
                    <BookOpen className="h-4 w-4 text-violet-300" />
                  </div>
                  <Badge variant="outline" size="sm">
                    Live
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-fog-50">{s.name}</h3>
                <p className="text-[10px] font-mono text-fog-500 uppercase tracking-widest mt-1 mb-4">
                  {s.national_spec_reference}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <div className="text-fog-500">Topics</div>
                    <div className="text-fog-100 font-semibold font-mono">{s.topics}</div>
                  </div>
                  <div>
                    <div className="text-fog-500">Lessons</div>
                    <div className="text-fog-100 font-semibold font-mono">{s.lessons}</div>
                  </div>
                </div>
              </Card>
            ))}

            {subjectCards.length === 0 && (
              <Card variant="glass" padding="lg" className="md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-fog-50">
                  No curriculum subjects found
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-fog-400">
                  Run the seed migration or add subjects in Supabase to populate
                  this CMS. This page is now reading live database rows.
                </p>
              </Card>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-fog-50">Pending review</h2>
              <p className="text-xs text-fog-500 mt-0.5">
                Content review workflow is not populated yet
              </p>
            </div>
          </div>
          <Card variant="glass" padding="lg">
            <p className="text-sm text-fog-400">
              No review items yet. When lesson versioning is connected, pending
              changes will appear here.
            </p>
          </Card>
        </section>
      </div>
    </>
  );
}
