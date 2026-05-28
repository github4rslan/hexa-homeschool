import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Award,
  Clock,
  FileCheck,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChildCard } from "@/components/dashboard/child-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Mock data for Phase 1 prototype — replaced with Supabase queries in Phase 2
const MOCK_CHILDREN = [
  {
    id: "1",
    name: "Aisha",
    age: 12,
    predictedGrade: "8",
    competenceCertified: 47,
    competenceTotal: 92,
    nextLesson: "Quadratic equations",
    status: "ahead" as const,
  },
  {
    id: "2",
    name: "Theo",
    age: 11,
    predictedGrade: "6",
    competenceCertified: 28,
    competenceTotal: 92,
    nextLesson: "Cell division",
    status: "on_track" as const,
  },
];

const RECENT_ACTIVITY = [
  { time: "12 min ago", child: "Aisha", event: "Completed Mathematics lesson", detail: "Linear equations · 94% accuracy" },
  { time: "1 hr ago", child: "Theo", event: "Started English session", detail: "Reading comprehension drill" },
  { time: "Yesterday", child: "Aisha", event: "Monthly mock exam complete", detail: "Predicted grade updated to 8" },
  { time: "Yesterday", child: "Theo", event: "Concept block escalated", detail: "Atomic structure · tutor dispatched" },
];

export default function DashboardPage() {
  return (
    <>
      <DashboardTopbar greeting="Good morning, Jane" />

      <div className="flex-1 p-6 lg:p-10 max-w-7xl">
        {/* Top stats */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-fog-50">
                This week
              </h2>
              <p className="text-sm text-fog-400 mt-1">
                Snapshot of household activity and compliance status
              </p>
            </div>
            <Button href="/dashboard/children/new" variant="primary" size="md">
              <Plus className="h-4 w-4" />
              Add child
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Lessons completed"
              value="34"
              hint="across all children"
              trend={{ value: "+12%", direction: "up" }}
              accent="violet"
              icon={<Activity className="h-4 w-4" />}
            />
            <StatCard
              label="Topics certified"
              value="9"
              hint="this week"
              trend={{ value: "+3", direction: "up" }}
              accent="neon"
              icon={<Award className="h-4 w-4" />}
            />
            <StatCard
              label="Avg session time"
              value="52m"
              hint="within 45–60 min target"
              accent="cyan"
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              label="Compliance"
              value="Current"
              hint="Q2 2026 dossier ready"
              accent="neon"
              icon={<FileCheck className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* Children grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-fog-50">Children</h2>
            <Link
              href="/dashboard/children"
              className="text-sm text-violet-300 hover:text-violet-200"
            >
              View all
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {MOCK_CHILDREN.map((child) => (
              <ChildCard key={child.id} {...child} />
            ))}
          </div>
        </section>

        {/* Two-column: Activity feed + Compliance + Next exam */}
        <section className="grid lg:grid-cols-3 gap-5">
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-fog-50">
                Recent activity
              </h3>
              <Badge variant="outline" size="sm">
                Live feed
              </Badge>
            </div>
            <ul className="flex flex-col gap-4">
              {RECENT_ACTIVITY.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-400/20">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fog-100">
                        {a.event}
                      </span>
                      <span className="text-xs text-fog-500">· {a.child}</span>
                    </div>
                    <span className="text-xs text-fog-400">{a.detail}</span>
                  </div>
                  <span className="text-xs text-fog-500 whitespace-nowrap">
                    {a.time}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="glass-strong" padding="lg" className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-neon-400" />
              <h3 className="text-base font-semibold text-fog-50">
                Next milestone
              </h3>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                Aisha · Mathematics
              </span>
              <h4 className="text-xl font-semibold text-fog-50 mt-1 mb-2">
                Monthly mock exam
              </h4>
              <p className="text-sm text-fog-400 leading-relaxed">
                Scheduled for 4 June 2026. Topics under assessment: linear equations, quadratic equations, sequences.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-fog-500">In 9 days</span>
              <Link
                href="/dashboard/assessments"
                className="text-violet-300 hover:text-violet-200 font-medium"
              >
                View schedule
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
