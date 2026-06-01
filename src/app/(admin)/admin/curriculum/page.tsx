import type { Metadata } from "next";
import { BookOpen, Plus } from "lucide-react";
import { AdminTopbar } from "@/components/admin/sidebar";
import { MetricCard } from "@/components/admin/metric-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin - Curriculum CMS" };

/**
 * Static curriculum reference (formerly seeded in Supabase 0003_seed_data).
 * Curriculum is public reference content, not user data, so it lives here as a
 * constant after the MongoDB migration. Topic/lesson counts are representative
 * Phase-1 figures until the full spec is authored.
 */
const SUBJECTS = [
  {
    id: "mathematics",
    name: "Mathematics",
    national_spec_reference: "Pearson Edexcel 1MA1",
    topics: 4,
    lessons: 12,
  },
  {
    id: "english",
    name: "English",
    national_spec_reference: "AQA 8700 / 8702",
    topics: 3,
    lessons: 9,
  },
  {
    id: "science",
    name: "Science",
    national_spec_reference: "AQA Combined Science Trilogy 8464",
    topics: 3,
    lessons: 9,
  },
];

export default function CurriculumPage() {
  const totalTopics = SUBJECTS.reduce((sum, s) => sum + s.topics, 0);
  const totalLessons = SUBJECTS.reduce((sum, s) => sum + s.lessons, 0);

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
            value={SUBJECTS.length.toLocaleString()}
            hint="core GCSE subjects"
            accent="violet"
          />
          <MetricCard
            label="Total topics"
            value={totalTopics.toLocaleString()}
            accent="cyan"
          />
          <MetricCard
            label="Lessons published"
            value={totalLessons.toLocaleString()}
            accent="neon"
          />
          <MetricCard
            label="Pending review"
            value="0"
            hint="workflow not connected"
            accent="amber"
          />
        </section>

        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fog-50">Subjects</h2>
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4" />
              New subject
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBJECTS.map((s) => (
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
                    <div className="text-fog-100 font-semibold font-mono">
                      {s.topics}
                    </div>
                  </div>
                  <div>
                    <div className="text-fog-500">Lessons</div>
                    <div className="text-fog-100 font-semibold font-mono">
                      {s.lessons}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
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
