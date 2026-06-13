import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, GraduationCap, Activity, BookOpen } from "lucide-react";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  currentParentId,
  getChildById,
  latestEvaluationsBySubject,
  countCertified,
  listMedia,
  getWeeklySchedule,
} from "@/lib/db/repo";
import { buildAssessmentNarrative } from "@/lib/engine/assessment-narrative";
import { UploadButton } from "@/components/media/upload-button";
import { ExamDecisionCard } from "@/components/dashboard/exam-decision-card";
import { computeExamDecision } from "@/lib/engine/exam-decision";
import { saveChildProfile } from "./actions";

export const metadata: Metadata = { title: "Child profile" };
export const dynamic = "force-dynamic";

const SUBJECT_LABEL: Record<string, string> = {
  mathematics: "Mathematics",
  english: "English",
  science: "Science",
};

export default async function ChildProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { childId } = await params;
  const sp = await searchParams;

  const parentId = await currentParentId();
  if (!parentId) redirect("/login");
  const child = await getChildById(parentId, childId);
  if (!child?._id) redirect("/dashboard");

  const standings = await latestEvaluationsBySubject(child._id);
  const certified = await countCertified(child._id);
  const work = await listMedia({ useCase: "child_work", childId, limit: 12 });
  const decision = computeExamDecision(
    child.date_of_birth,
    standings.map((s) => ({
      subject: s.subject,
      readiness: s.readiness,
      grade: s.grade,
    })),
  );
  const save = saveChildProfile.bind(null, childId);

  // Plain-English narrative grounded in the same standings + this week's plan
  // (read-only — visiting the profile never generates a schedule).
  const schedule = await getWeeklySchedule(parentId, child._id);
  const planCounts = schedule
    ? schedule.items.reduce<Partial<Record<typeof standings[number]["subject"], number>>>(
        (acc, item) => ({ ...acc, [item.subject]: (acc[item.subject] ?? 0) + 1 }),
        {},
      )
    : null;
  const narrative = buildAssessmentNarrative(standings, planCounts);
  const assessed = standings.some((s) => s.readiness !== null || s.grade !== null);

  return (
    <>
      <DashboardTopbar greeting={child.full_name} />
      <main className="flex-1 p-6 lg:p-10 max-w-4xl">
        <PageHeader
          title={child.full_name}
          description="Learning profile and current standing."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: child.full_name },
          ]}
          backFallback="/dashboard"
          action={
            <Button href="/lesson" variant="primary" size="md">
              <GraduationCap className="h-4 w-4" />
              Start a lesson
            </Button>
          }
        />

        {sp.saved && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-neon-400/30 bg-neon-500/10 px-4 py-3 text-sm text-neon-400">
            <Check className="h-4 w-4" /> Profile saved.
          </div>
        )}
        {sp.error && (
          <div className="mb-6 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
            {sp.error}
          </div>
        )}

        {/* Current standing */}
        <Card variant="glass-strong" padding="xl" className="mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-4 w-4 text-violet-300" />
            <h2 className="text-lg font-semibold text-fog-50">Current standing</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {standings.map((s) => (
              <div
                key={s.subject}
                className="rounded-xl bg-white/[0.03] border border-white/5 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-fog-50">
                    {SUBJECT_LABEL[s.subject]}
                  </div>
                  {s.fromMock && (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-300">
                      Mock
                    </span>
                  )}
                </div>
                {s.readiness !== null ? (
                  <>
                    <div className="mt-2 text-2xl font-semibold text-gradient-violet">
                      {Math.round(s.readiness)}%
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                      {s.fromMock ? "Mock score" : "Readiness"}
                      {s.grade ? ` · Grade ${s.grade}` : ""}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-xs text-fog-500">
                    Not yet assessed — run the diagnostic.
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-fog-500">
            {certified} topic{certified === 1 ? "" : "s"} certified so far.
          </p>
        </Card>

        {/* Understanding these results — deterministic plain-English narrative */}
        {assessed && (
          <Card variant="glass" padding="xl" className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-amber-300" />
              <h2 className="text-lg font-semibold text-fog-50">
                Understanding these results
              </h2>
            </div>
            <p className="text-sm text-fog-400 mb-5">{narrative.intro}</p>
            <div className="flex flex-col gap-3">
              {narrative.subjects.map((s) => (
                <div
                  key={s.subject}
                  className="rounded-xl bg-white/[0.03] border border-white/5 p-4"
                >
                  <div className="text-sm font-semibold text-fog-50 mb-1">
                    {s.label}
                  </div>
                  <p className="text-sm leading-relaxed text-fog-300">{s.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-fog-400">
              {narrative.planNote}
            </p>
          </Card>
        )}

        {/* Exam decision (age 13+) */}
        {decision.eligible && (
          <div className="mb-6">
            <ExamDecisionCard decision={decision} childName={child.full_name} />
          </div>
        )}

        {/* Work evidence (Cloudinary, private) */}
        <Card variant="glass" padding="xl" className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-fog-50">Work evidence</h2>
              <p className="text-sm text-fog-400 mt-1">
                Upload photos of {child.full_name.split(" ")[0]}&apos;s written
                work. These attach to your Local Authority portfolio as evidence
                and stay private to your family.
              </p>
            </div>
            <UploadButton useCase="child_work" childId={childId} label="Add work" />
          </div>
          {work.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {work.map((m) => (
                <a
                  key={m._id?.toHexString()}
                  href={m.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.secure_url}
                    alt="Uploaded work"
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fog-500">
              No work uploaded yet.
            </p>
          )}
        </Card>

        {/* Edit profile */}
        <Card variant="glass" padding="xl">
          <h2 className="text-lg font-semibold text-fog-50 mb-1">
            Learning profile
          </h2>
          <p className="text-sm text-fog-400 mb-6">
            Keep this up to date — it shapes pacing and the exam-readiness view.
          </p>
          <form action={save} className="grid gap-5">
            <Input
              name="full_name"
              label="Child name"
              defaultValue={child.full_name}
              required
            />
            <Input
              name="date_of_birth"
              type="date"
              label="Date of birth"
              defaultValue={child.date_of_birth}
              required
            />
            <Input
              name="target_exam_window"
              label="Target exam window"
              defaultValue={child.target_exam_window ?? ""}
              placeholder="e.g. Summer 2028"
              hint="Optional. The exam decision is always data-driven, never forced."
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="send_indicators"
                className="text-xs font-medium uppercase tracking-wider text-fog-300"
              >
                SEND indicators
              </label>
              <textarea
                id="send_indicators"
                name="send_indicators"
                rows={3}
                defaultValue={(child.send_indicators ?? []).join(", ")}
                placeholder="Optional, comma separated (e.g. dyslexia, ADHD)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-fog-50 placeholder:text-fog-500 transition-all focus:border-violet-400/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              />
              <p className="text-xs text-fog-500">
                Kept private in your data silo — never shared without your
                explicit action.
              </p>
            </div>
            {child.send_indicators && child.send_indicators.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {child.send_indicators.map((s) => (
                  <Badge key={s} variant="outline" size="sm">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            <Button type="submit" variant="primary" size="md" className="self-start">
              Save profile
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
