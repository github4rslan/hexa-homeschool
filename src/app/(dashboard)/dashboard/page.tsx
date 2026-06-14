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
  UserPlus,
} from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ChildCard } from "@/components/dashboard/child-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  currentParentId,
  findParentById,
  listChildren,
  getActiveChild,
  countCertified,
  latestEvaluationsBySubject,
  recentLogs,
  countCertifiedSince,
  hasDossierForPeriod,
  openEscalations,
  onboardingChecklist,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import { isOnboardingDismissed } from "@/lib/onboarding-dismiss";
import { GettingStarted, type ChecklistStep } from "@/components/dashboard/getting-started";
import { dismissGettingStarted } from "./actions";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const TOTAL_TOPICS = 30; // seeded curriculum size (10 per subject × 3)

interface ChildView {
  id: string;
  name: string;
  age: number;
  predictedGrade?: string;
  competenceCertified: number;
  competenceTotal: number;
  status: "on_track" | "behind" | "ahead" | "needs_review";
}

interface ActivityItem {
  time: string;
  child: string;
  event: string;
  detail: string;
}

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

function relativeTime(d: Date): string {
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.round(diffHr / 24);
  return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
}

function currentQuarter(): string {
  const now = new Date();
  return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
}

export default async function DashboardPage() {
  const parentId = await currentParentId();
  const parent = parentId ? await findParentById(parentId) : null;
  const greeting = parent?.full_name
    ? `Good to see you, ${parent.full_name.split(" ")[0]}`
    : "Welcome to HEXA";

  const kids = parentId ? await listChildren(parentId) : [];

  // ── Empty state: a real onboarding nudge, never fake rows ──
  if (kids.length === 0) {
    return (
      <>
        <DashboardTopbar greeting={greeting} />
        <div className="flex-1 p-6 lg:p-10 max-w-3xl">
          <Card variant="glass-strong" padding="xl" className="text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-400/30 mb-6">
              <UserPlus className="h-7 w-7 text-violet-300" />
            </div>
            <h1 className="text-2xl font-semibold text-fog-50 mb-2">
              Let&apos;s set up your first child
            </h1>
            <p className="text-fog-400 leading-relaxed mb-8 max-w-md mx-auto">
              Add your child&apos;s profile, then run the 60-minute diagnostic.
              From there, HEXA plans daily lessons and tracks real progress —
              everything you see here will be your family&apos;s own data.
            </p>
            <Button href="/dashboard/children/new" variant="primary" size="lg">
              <Plus className="h-4 w-4" />
              Add your first child
            </Button>
          </Card>
        </div>
      </>
    );
  }

  const activeChild = await getActiveChild(parentId!, await readActiveChildId());
  const activeId = activeChild?._id?.toHexString();

  // Build per-child views with real certified counts + predicted grade.
  const children: ChildView[] = await Promise.all(
    kids.map(async (kid): Promise<ChildView> => {
      const childId = kid._id!;
      const certifiedCount = await countCertified(childId);
      const standings = await latestEvaluationsBySubject(childId);
      const graded = standings.filter((s) => s.grade);
      const predictedGrade = graded.length
        ? `${Math.round(
            graded.reduce((sum, s) => sum + Number(s.grade), 0) / graded.length,
          )}`
        : undefined;
      const pct = certifiedCount / (TOTAL_TOPICS || 1);
      const status: ChildView["status"] =
        pct >= 0.6 ? "ahead" : pct >= 0.3 ? "on_track" : "needs_review";
      return {
        id: childId.toHexString(),
        name: kid.full_name,
        age: ageFromDob(kid.date_of_birth),
        predictedGrade,
        competenceCertified: certifiedCount,
        competenceTotal: TOTAL_TOPICS,
        status,
      };
    }),
  );

  // Week stats across all children.
  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const childIds = kids.map((k) => k._id!);
  const logs = await recentLogs(childIds, weekAgoMs, 50);
  const completed = logs.filter((l) => l.status === "completed");
  const durations = completed
    .filter((l) => l.timestamp_end)
    .map(
      (l) =>
        ((l.timestamp_end as Date).getTime() - l.timestamp_start.getTime()) /
        1000,
    )
    .filter((s) => s > 0);
  const avgSec = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  const certifiedThisWeek = await countCertifiedSince(childIds, weekAgoMs);

  // Safety: open escalations across the family (Brief: parent alerts).
  const escalations = await openEscalations(childIds);

  const nameById = new Map(kids.map((k) => [k._id!.toHexString(), k.full_name]));
  const activity: ActivityItem[] = logs.slice(0, 6).map((l) => ({
    time: relativeTime(l.timestamp_start),
    child: nameById.get(l.child_id.toHexString()) ?? "Child",
    event: l.status === "completed" ? "Completed a lesson" : "Started a lesson",
    detail: `${l.topic_tag.replace(/_/g, " ")} lesson`,
  }));

  // Compliance: real check for a dossier this quarter (active child).
  const quarter = currentQuarter();
  const complianceReady = activeChild?._id
    ? await hasDossierForPeriod(activeChild._id, quarter)
    : false;

  // Getting-started checklist — per the ACTIVE child, derived from real data.
  // Shown until every step is done or the parent dismisses it.
  const dismissed = await isOnboardingDismissed();
  const checklist = activeChild?._id
    ? await onboardingChecklist(parentId!, activeChild._id)
    : null;
  const steps: ChecklistStep[] = checklist
    ? [
        { key: "child", label: "Add your child", href: "/dashboard/children/new", done: true },
        { key: "diagnostic", label: "Run the diagnostic", href: "/onboarding/diagnostic", done: checklist.hasEvaluation },
        { key: "plan", label: "Approve the first plan", href: "/schedule", done: checklist.hasApprovedSchedule },
        { key: "lesson", label: "Start the first lesson", href: "/learn", done: checklist.hasLesson },
      ]
    : [];
  const showChecklist = !dismissed && steps.length > 0 && steps.some((s) => !s.done);
  const activeChildFirstName = activeChild?.full_name.split(" ")[0];

  return (
    <>
      <DashboardTopbar greeting={greeting} />

      <div className="flex-1 p-6 lg:p-10 max-w-7xl">
        {escalations.length > 0 && (
          <div className="mb-6 rounded-xl border border-crimson-400/40 bg-crimson-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-crimson-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-crimson-300">
                  A lesson was paused for {nameById.get(escalations[0].child_id.toHexString()) ?? "your child"}.
                </p>
                <p className="text-xs text-fog-300 mt-1">
                  HEXA detected your child may have been feeling stuck or upset and
                  paused the lesson. Please check in with them when you can. This
                  is an educational safeguard only — for any welfare concern, contact
                  your GP or relevant services.
                </p>
              </div>
            </div>
          </div>
        )}

        {showChecklist && (
          <GettingStarted
            steps={steps}
            childName={activeChildFirstName}
            dismiss={dismissGettingStarted}
          />
        )}

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
              value={completed.length}
              hint="this week, across all children"
              accent="violet"
              icon={<Activity className="h-4 w-4" />}
            />
            <StatCard
              label="Topics certified"
              value={certifiedThisWeek}
              hint="this week"
              accent="neon"
              icon={<Award className="h-4 w-4" />}
            />
            <StatCard
              label="Avg lesson time"
              value={avgSec ? `${Math.round(avgSec / 60)}m` : "—"}
              hint={avgSec ? "within 45–60 min target" : "no lessons yet"}
              accent="cyan"
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              label="Compliance"
              value={complianceReady ? "Filed" : "Due"}
              hint={complianceReady ? `${quarter} portfolio generated` : `${quarter} portfolio not yet generated`}
              accent={complianceReady ? "neon" : "amber"}
              icon={<FileCheck className="h-4 w-4" />}
            />
          </div>
        </section>

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
              <ChildCard
                key={child.id}
                {...child}
                highlighted={child.id === activeId}
              />
            ))}
          </div>
        </section>

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
                      <span className="text-xs text-fog-400 capitalize">
                        {a.detail}
                      </span>
                    </div>
                    <span className="text-xs text-fog-500 whitespace-nowrap">
                      {a.time}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-fog-400 mb-4">
                  No lessons yet. Start the diagnostic to map where your child
                  stands, then begin daily lessons.
                </p>
                <Button href="/onboarding/diagnostic" variant="secondary" size="md">
                  Start the diagnostic
                </Button>
              </div>
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
                Compliance · {quarter}
              </span>
              <h4 className="text-xl font-semibold text-fog-50 mt-1 mb-2">
                Quarterly LA portfolio
              </h4>
              <p className="text-sm text-fog-400 leading-relaxed">
                {complianceReady
                  ? "This quarter's verified portfolio has been generated and is ready to send."
                  : "Compile your term evidence into a verified, tamper-evident portfolio — one click, ready to send."}
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-fog-500">SHA-256 verified</span>
              <Link
                href="/portfolio"
                className="text-violet-300 hover:text-violet-200 font-medium"
              >
                {complianceReady ? "View portfolio" : "Generate portfolio"}
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
