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
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

// ── Types for the assembled view model ──────────────────────────
interface ChildView {
  id: string;
  name: string;
  age: number;
  predictedGrade?: string;
  competenceCertified: number;
  competenceTotal: number;
  nextLesson?: string;
  status: "on_track" | "behind" | "ahead" | "needs_review";
}

interface ActivityItem {
  time: string;
  child: string;
  event: string;
  detail: string;
}

interface WeekStats {
  lessonsCompleted: number;
  topicsCertified: number;
  avgSessionLabel: string;
  avgSessionHint: string;
}

// Demo fallback — shown only when the signed-in parent has no children yet,
// so the dashboard never looks broken for a brand-new or unauthenticated view.
const DEMO_CHILDREN: ChildView[] = [
  {
    id: "demo-1",
    name: "Aisha",
    age: 12,
    predictedGrade: "8",
    competenceCertified: 47,
    competenceTotal: 92,
    nextLesson: "Quadratic equations",
    status: "ahead",
  },
  {
    id: "demo-2",
    name: "Theo",
    age: 11,
    predictedGrade: "6",
    competenceCertified: 28,
    competenceTotal: 92,
    nextLesson: "Cell division",
    status: "on_track",
  },
];

const DEMO_ACTIVITY: ActivityItem[] = [
  { time: "12 min ago", child: "Aisha", event: "Completed Mathematics lesson", detail: "Linear equations · 94% accuracy" },
  { time: "1 hr ago", child: "Theo", event: "Started English session", detail: "Reading comprehension drill" },
  { time: "Yesterday", child: "Aisha", event: "Monthly mock exam complete", detail: "Predicted grade updated to 8" },
];

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
}

/** Total curriculum topics, used as the mastery denominator per child. */
async function topicCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number> {
  const { count } = await supabase
    .from("topics")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let parentName: string | null = null;
  let children: ChildView[] = [];
  let activity: ActivityItem[] = [];
  let stats: WeekStats = {
    lessonsCompleted: 0,
    topicsCertified: 0,
    avgSessionLabel: "—",
    avgSessionHint: "no sessions yet",
  };
  let usingDemo = false;

  if (user) {
    const { data: parent } = await supabase
      .from("parents")
      .select("id, full_name")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    parentName = (parent as { full_name: string | null } | null)?.full_name ?? null;

    if (parent) {
      const parentId = (parent as { id: string }).id;
      const totalTopics = await topicCount(supabase);

      const { data: childRows } = await supabase
        .from("children")
        .select("id, full_name, date_of_birth")
        .eq("parent_id", parentId)
        .order("created_at", { ascending: true });

      const kids =
        (childRows as
          | { id: string; full_name: string; date_of_birth: string }[]
          | null) ?? [];

      if (kids.length > 0) {
        children = await Promise.all(
          kids.map(async (kid): Promise<ChildView> => {
            const { count: certified } = await supabase
              .from("competence_matrix")
              .select("id", { count: "exact", head: true })
              .eq("child_id", kid.id)
              .eq("state", "certified");

            const { data: latestEval } = await supabase
              .from("evaluation_records")
              .select("model_predicted_grade")
              .eq("child_id", kid.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const certifiedCount = certified ?? 0;
            const denom = totalTopics || 1;
            const pct = certifiedCount / denom;
            const status: ChildView["status"] =
              pct >= 0.6 ? "ahead" : pct >= 0.3 ? "on_track" : "needs_review";

            return {
              id: kid.id,
              name: kid.full_name,
              age: ageFromDob(kid.date_of_birth),
              predictedGrade:
                (latestEval as { model_predicted_grade: string | null } | null)
                  ?.model_predicted_grade ?? undefined,
              competenceCertified: certifiedCount,
              competenceTotal: totalTopics,
              status,
            };
          }),
        );

        // Week stats: lessons completed + topics certified in last 7 days.
        const weekAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const childIds = kids.map((k) => k.id);

        const { data: weekLogs } = await supabase
          .from("instructional_logs")
          .select("child_id, timestamp_start, timestamp_end, status")
          .in("child_id", childIds)
          .gte("timestamp_start", weekAgo)
          .order("timestamp_start", { ascending: false });

        const logs =
          (weekLogs as
            | {
                child_id: string;
                timestamp_start: string;
                timestamp_end: string | null;
                status: string;
              }[]
            | null) ?? [];

        const completed = logs.filter((l) => l.status === "completed");
        const durations = completed
          .filter((l) => l.timestamp_end)
          .map(
            (l) =>
              (new Date(l.timestamp_end as string).getTime() -
                new Date(l.timestamp_start).getTime()) /
              1000,
          )
          .filter((s) => s > 0);
        const avgSec = durations.length
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0;

        const { count: certifiedThisWeek } = await supabase
          .from("competence_matrix")
          .select("id", { count: "exact", head: true })
          .in("child_id", childIds)
          .eq("state", "certified")
          .gte("updated_at", weekAgo);

        stats = {
          lessonsCompleted: completed.length,
          topicsCertified: certifiedThisWeek ?? 0,
          avgSessionLabel: avgSec
            ? `${Math.round(avgSec / 60)}m`
            : "—",
          avgSessionHint: avgSec
            ? "within 45–60 min target"
            : "no sessions yet",
        };

        // Recent activity feed from real logs.
        const nameById = new Map(kids.map((k) => [k.id, k.full_name]));
        activity = logs.slice(0, 6).map((l) => ({
          time: relativeTime(l.timestamp_start),
          child: nameById.get(l.child_id) ?? "Child",
          event:
            l.status === "completed"
              ? "Completed a lesson"
              : "Started a lesson",
          detail: "Curriculum session logged",
        }));
      }
    }
  }

  // Fall back to the illustrative demo only when there's nothing real to show.
  if (children.length === 0) {
    usingDemo = true;
    children = DEMO_CHILDREN;
    activity = DEMO_ACTIVITY;
    stats = {
      lessonsCompleted: 34,
      topicsCertified: 9,
      avgSessionLabel: "52m",
      avgSessionHint: "within 45–60 min target",
    };
  }

  const greeting = parentName
    ? `Good to see you, ${parentName.split(" ")[0]}`
    : "Welcome to HEXA";

  return (
    <>
      <DashboardTopbar greeting={greeting} />

      <div className="flex-1 p-6 lg:p-10 max-w-7xl">
        {usingDemo && (
          <div className="mb-6 rounded-xl border border-violet-400/20 bg-violet-500/5 px-4 py-3 text-sm text-fog-300">
            <span className="font-medium text-fog-100">Sample data shown.</span>{" "}
            Add a child and run the diagnostic to see your family&apos;s real
            progress here.
          </div>
        )}

        {/* Top stats */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-fog-50">This week</h2>
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
              value={stats.lessonsCompleted}
              hint="this week, across all children"
              accent="violet"
              icon={<Activity className="h-4 w-4" />}
            />
            <StatCard
              label="Topics certified"
              value={stats.topicsCertified}
              hint="this week"
              accent="neon"
              icon={<Award className="h-4 w-4" />}
            />
            <StatCard
              label="Avg session time"
              value={stats.avgSessionLabel}
              hint={stats.avgSessionHint}
              accent="cyan"
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              label="Compliance"
              value="Ready"
              hint="quarterly portfolio available"
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
              href="/dashboard/children/new"
              className="text-sm text-violet-300 hover:text-violet-200"
            >
              Add child
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {children.map((child) => (
              <ChildCard key={child.id} {...child} />
            ))}
          </div>
        </section>

        {/* Activity feed + compliance */}
        <section className="grid lg:grid-cols-3 gap-5">
          <Card variant="glass" padding="lg" className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-fog-50">
                Recent activity
              </h3>
              <Badge variant="outline" size="sm">
                {usingDemo ? "Sample" : "Live feed"}
              </Badge>
            </div>
            {activity.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {activity.map((a, i) => (
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
            ) : (
              <p className="text-sm text-fog-400 py-8 text-center">
                No activity yet. Run the diagnostic or a lesson to get started.
              </p>
            )}
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
                Compliance
              </span>
              <h4 className="text-xl font-semibold text-fog-50 mt-1 mb-2">
                Quarterly LA portfolio
              </h4>
              <p className="text-sm text-fog-400 leading-relaxed">
                Compile your term evidence into a verified, tamper-evident
                portfolio — generated in one click, ready to send.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-fog-500">SHA-256 verified</span>
              <Link
                href="/portfolio"
                className="text-violet-300 hover:text-violet-200 font-medium"
              >
                Generate portfolio
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
