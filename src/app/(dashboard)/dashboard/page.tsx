import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Award,
  Clock,
  FileCheck,
  Plus,
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
  getDiagnosticCompletion,
  todayCard,
  type TodayCard as TodayCardData,
  weekInReview,
  listActivityFeed,
  todaysMasteries,
  getFeedbackPromptContext,
} from "@/lib/db/repo";
import { masteryHighlightLine } from "@/lib/engine/parent-events";
import { shouldShowFeedbackPrompt } from "@/lib/engine/feedback-eligibility";
import { avgLessonTimeHint } from "@/lib/engine/dashboard-stats";
import { buildWeeklyRecapNarration } from "@/lib/engine/weekly-summary";
import { FeedbackPrompt, FeedbackButton } from "@/components/dashboard/feedback-widget";
import { readActiveChildId } from "@/lib/active-child";
import type { ChildDoc, ParentDoc } from "@/lib/db/types";
import { isOnboardingDismissed } from "@/lib/onboarding-dismiss";
import { birthdayAge } from "@/lib/child/birthday";
import { Cake, PartyPopper } from "lucide-react";
import { GettingStarted, type ChecklistStep } from "@/components/dashboard/getting-started";
import { TodayCard } from "@/components/dashboard/today-card";
import { TodayBriefingHeader } from "@/components/dashboard/today-briefing-header";
import { WeekInReview } from "@/components/dashboard/week-in-review";
import { ActivityFeed, type ActivityFeedRow } from "@/components/dashboard/activity-feed";
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

function gradeNumber(grade: string | null): number | null {
  if (!grade) return null;
  const nums = grade.match(/\d+/g);
  if (!nums?.length) return null;
  const parsed = Math.max(...nums.map(Number));
  return Number.isFinite(parsed) ? parsed : null;
}

/** One-line family summary for the Today briefing, from real data only. */
function buildTodaySummary(card: TodayCardData): string {
  const first = card.childName.split(" ")[0];
  if (card.allDone) {
    return `${first} finished today's quests${card.streak > 0 ? ` · ${card.streak}-day streak` : ""}. Lovely work.`;
  }
  const remaining = card.quests.filter((q) => !q.done).length;
  const parts: string[] = [];
  if (card.quests.length > 0) {
    parts.push(`${remaining} quest${remaining === 1 ? "" : "s"} left today`);
  } else {
    parts.push("no quests planned today");
  }
  if (card.streak > 0) parts.push(`${card.streak}-day streak`);
  if (card.reviewsDue > 0)
    parts.push(`${card.reviewsDue} review${card.reviewsDue === 1 ? "" : "s"} due`);
  return `${first}: ${parts.join(" · ")}.`;
}

/**
 * Per-child cards with real certified counts + predicted grade. The two reads
 * per child are independent, so they run concurrently (B1).
 */
async function buildChildViews(kids: ChildDoc[]): Promise<ChildView[]> {
  return Promise.all(
    kids.map(async (kid): Promise<ChildView> => {
      const childId = kid._id!;
      const [certifiedCount, standings] = await Promise.all([
        countCertified(childId),
        latestEvaluationsBySubject(childId),
      ]);
      const grades = standings
        .map((s) => gradeNumber(s.grade))
        .filter((grade): grade is number => grade !== null);
      const predictedGrade = grades.length
        ? `${Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)}`
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
}

export default async function DashboardPage() {
  const parentId = await currentParentId();
  // B2: `currentParentId()` returns null for a deleted account or a session
  // invalidated by "sign out everywhere" (token_version bump), not just for a
  // missing cookie. Bounce to /login the same way /schedule and /settings do,
  // instead of silently rendering the zero-children onboarding empty state.
  if (!parentId) redirect("/login?redirect=/dashboard");
  // B1 (perf): every read below is independent of the others, so they are
  // issued concurrently instead of as a serial await-waterfall. This page was
  // spending several seconds of server think-time on round-trips that have no
  // ordering relationship at all.
  const [parent, kids, activeChildId]: [
    ParentDoc | null,
    ChildDoc[],
    string | undefined,
  ] = await Promise.all([
    findParentById(parentId),
    listChildren(parentId),
    readActiveChildId(),
  ]);
  const greeting = parent?.full_name
    ? `Good to see you, ${parent.full_name.split(" ")[0]}`
    : "Welcome to Edway";

  // ── Empty state: a real onboarding nudge, never fake rows ──
  if (kids.length === 0) {
    return (
      <>
        <DashboardTopbar greeting={greeting} />
        <main className="flex-1 p-6 lg:p-10 max-w-3xl">
          <Card variant="glass-strong" padding="xl" className="text-center">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-400/30 mb-6">
              <UserPlus className="h-7 w-7 text-violet-300" />
            </div>
            <h1 className="text-2xl font-semibold text-fog-50 mb-2">
              Let&apos;s set up your first child
            </h1>
            <p className="text-fog-400 leading-relaxed mb-8 max-w-md mx-auto">
              Add your child&apos;s profile, then run the 60-minute diagnostic.
              From there, Edway plans daily lessons and tracks real progress —
              everything you see here will be your family&apos;s own data.
            </p>
            <Button href="/dashboard/children/new" variant="primary" size="lg">
              <Plus className="h-4 w-4" />
              Add your first child
            </Button>
          </Card>
        </main>
      </>
    );
  }

  const activeChild = await getActiveChild(parentId, activeChildId);
  const activeId = activeChild?._id?.toHexString();

  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const childIds = kids.map((k) => k._id!);
  const quarter = currentQuarter();

  // B1 (perf): one concurrent batch for every remaining independent read.
  // They share the pooled Mongo client and none of them depends on another's
  // result, so awaiting them in sequence only added latency.
  const [
    children,
    logs,
    certifiedThisWeek,
    escalations,
    feedItems,
    complianceReady,
    dismissed,
    checklist,
    diagnostic,
    todayCards,
    review,
    fbContext,
    masteredToday,
  ] = await Promise.all([
    buildChildViews(kids),
    recentLogs(childIds, weekAgoMs, 50),
    countCertifiedSince(childIds, weekAgoMs),
    // Safety: open escalations across the family (Brief: parent alerts).
    openEscalations(childIds),
    // Unified activity feed (Wave 7, Phase 5): milestone events (mastery /
    // handoff / inactivity) merged with recent lesson activity, newest first.
    listActivityFeed(parentId, 8),
    // Compliance: real check for a dossier this quarter (active child).
    activeChild?._id
      ? hasDossierForPeriod(activeChild._id, quarter)
      : Promise.resolve(false),
    isOnboardingDismissed(),
    // Getting-started checklist — per the ACTIVE child, derived from real data.
    activeChild?._id
      ? onboardingChecklist(parentId, activeChild._id)
      : Promise.resolve(null),
    // One-time diagnostic completion for the active child (drives empty-state CTA).
    activeChild?._id
      ? getDiagnosticCompletion(parentId, activeChild._id)
      : Promise.resolve(null),
    // Today command center: one card per child, derived from real data.
    Promise.all(kids.map((kid) => todayCard(parentId, kid))),
    // Week in Review ("Edway Wrapped") for the active child.
    activeChild ? weekInReview(parentId, activeChild) : Promise.resolve(null),
    // Voluntary sentiment prompt context (decision itself is pure + unit-tested).
    getFeedbackPromptContext(parentId),
    // Same-day mastery highlight (F3): topics certified TODAY.
    todaysMasteries(parentId),
  ]);

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

  const nameById = new Map(kids.map((k) => [k._id!.toHexString(), k.full_name]));

  const feedRows: ActivityFeedRow[] = feedItems.map((f) => ({
    kind: f.kind,
    childName: f.childName,
    topicTitle: f.topicTitle,
    attempts: f.attempts,
    time: relativeTime(f.at),
  }));

  const diagnosticDone = diagnostic?.completed ?? false;
  const steps: ChecklistStep[] = checklist
    ? [
        { key: "child", label: "Add your child", href: "/dashboard/children/new", done: true },
        { key: "diagnostic", label: "Run the diagnostic", href: "/onboarding/diagnostic", done: checklist.hasEvaluation },
        { key: "plan", label: "Approve the first plan", href: "/schedule", done: checklist.hasApprovedSchedule },
        { key: "lesson", label: "Start the first lesson", href: "/learn", done: checklist.hasLesson },
      ]
    : [];
  // Shown until every step is done or the parent dismisses it.
  const showChecklist = !dismissed && steps.length > 0 && steps.some((s) => !s.done);
  const activeChildFirstName = activeChild?.full_name.split(" ")[0];

  // The summary line speaks to the active child (or the only child).
  const activeCard =
    todayCards.find((c) => c.childId === activeId) ?? todayCards[0];
  const todaySummary = activeCard ? buildTodaySummary(activeCard) : "";

  // Spoken ~60s recap script (F6) — deterministic, from the same real data.
  // Synthesized on demand + cached by the existing TTS path; degrades silently
  // when ElevenLabs is unconfigured.
  const recapNarration = review
    ? buildWeeklyRecapNarration({
        childFirstName: review.childName.split(" ")[0],
        weekLabel: review.weekLabel,
        lessonsCompleted: review.lessonsCompleted,
        topicsCertified: review.topicsCertified,
        streak: review.streak,
        bestSubject: review.bestSubject,
        activeDays: review.activeDays,
        quiet: review.quiet,
      })
    : null;

  // Shown ONLY after a real milestone, at most once per cooldown, always
  // dismissible. Parent-side only; never mounted in any (child) route.
  const feedbackDecision = shouldShowFeedbackPrompt(fbContext.state, fbContext.signal);

  // Surfaced the day it happens (not just in the Monday digest). Reads the live
  // mastery events, so it never double-counts with the weekly digest.
  const masteryLine = masteryHighlightLine(
    masteredToday.map((m) => ({
      childFirstName: m.childName.split(" ")[0],
      topicTitle: m.topicTitle,
      attempts: m.attempts,
    })),
  );

  // Birthday: one tasteful banner if any child has a birthday today.
  const birthdayChild = kids
    .map((k) => ({ name: k.full_name.split(" ")[0], age: birthdayAge(k.date_of_birth) }))
    .find((b) => b.age !== null);

  return (
    <>
      <DashboardTopbar greeting={greeting} />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl">
        {birthdayChild && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
            <Cake className="h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm text-fog-200">
              Happy birthday, {birthdayChild.name}! 🎂 Turning {birthdayChild.age}{" "}
              today — a lovely day to celebrate.
            </p>
          </div>
        )}

        {escalations.length > 0 && (
          <div className="mb-6 rounded-xl border border-crimson-400/40 bg-crimson-500/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-crimson-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-crimson-300">
                  A lesson was paused for {nameById.get(escalations[0].child_id.toHexString()) ?? "your child"}.
                </p>
                <p className="text-xs text-fog-300 mt-1">
                  Edway detected your child may have been feeling stuck or upset and
                  paused the lesson. Please check in with them when you can. This
                  is an educational safeguard only — for any welfare concern, contact
                  your GP or relevant services.
                </p>
                <Link
                  href="/tutoring#escalations"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-crimson-300 hover:text-crimson-200"
                >
                  View details &amp; message the team
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {masteryLine && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3">
            <PartyPopper className="h-5 w-5 shrink-0 text-neon-300" />
            <p className="text-sm font-medium text-fog-100">{masteryLine}</p>
          </div>
        )}

        {showChecklist && (
          <GettingStarted
            steps={steps}
            childName={activeChildFirstName}
            dismiss={dismissGettingStarted}
          />
        )}

        {todayCards.length > 0 && (
          <section className="mb-10">
            <div className="mb-6">
              {/* Name-personalised greeting lives in the topbar only — the
                  briefing leads with the time-of-day + child summary so the
                  parent isn't greeted by name twice (B2). */}
              <TodayBriefingHeader firstName={null} summary={todaySummary} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {todayCards.map((card, i) => (
                <TodayCard key={card.childId} card={card} index={i} />
              ))}
            </div>
          </section>
        )}

        {review && (
          <WeekInReview
            review={review}
            variant="parent"
            recapNarration={recapNarration}
          />
        )}

        <section className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-fog-50">This week</h2>
              <p className="text-sm text-fog-400 mt-1">
                Snapshot of household activity and compliance status
              </p>
            </div>
            <div className="flex items-center gap-3">
              <FeedbackButton />
              <Button href="/dashboard/children/new" variant="primary" size="md">
                <Plus className="h-4 w-4" />
                Add child
              </Button>
            </div>
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
              hint={avgLessonTimeHint(avgSec)}
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
            {feedRows.length > 0 ? (
              <ActivityFeed rows={feedRows} />
            ) : (
              <div className="py-8 text-center">
                {diagnosticDone ? (
                  <>
                    <p className="text-sm text-fog-400 mb-4">
                      Learning check complete. Review this week&apos;s plan to
                      begin daily lessons.
                    </p>
                    <Button href="/schedule" variant="secondary" size="md">
                      See this week&apos;s plan
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-fog-400 mb-4">
                      No lessons yet. Start the diagnostic to map where your child
                      stands, then begin daily lessons.
                    </p>
                    <Button href="/onboarding/diagnostic" variant="secondary" size="md">
                      Start the diagnostic
                    </Button>
                  </>
                )}
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
      </main>

      {feedbackDecision.show && feedbackDecision.trigger && (
        <FeedbackPrompt trigger={feedbackDecision.trigger} />
      )}
    </>
  );
}
