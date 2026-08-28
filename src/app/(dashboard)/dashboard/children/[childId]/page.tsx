import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, GraduationCap, Activity, BookOpen, TrendingUp, MessageSquare, Award, Printer, Heart } from "lucide-react";
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
  certifiedBySubject,
  listMedia,
  getWeeklySchedule,
  evaluationHistory,
  childInsights,
  childCurrentBands,
  childSubjectRoadmap,
  listChildTutorNotes,
  listTopicCertificates,
  CHILD_NOTE_MAX,
  KEY_STAGE_LABEL,
} from "@/lib/db/repo";
import { buildAssessmentNarrative, type SubjectLessonProgress } from "@/lib/engine/assessment-narrative";
import { WorkEvidenceUploader } from "@/components/media/work-evidence-uploader";
import { ExamDecisionCard } from "@/components/dashboard/exam-decision-card";
import { TrajectoryChart } from "@/components/dashboard/trajectory-chart";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { RoadmapCard } from "@/components/dashboard/roadmap-card";
import { computeExamDecision } from "@/lib/engine/exam-decision";
import { cloudinaryThumb } from "@/lib/media/cloudinary";
import { saveChildProfile, saveChildNote } from "./actions";

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
  const history = await evaluationHistory(child._id);
  const certified = await countCertified(child._id);
  const certifiedCounts = await certifiedBySubject(child._id);
  const bands = await childCurrentBands(parentId, child._id);
  // Per-subject working band, so a subject with no diagnostic/mock evaluation
  // but real lesson-based progress still shows an honest standing (B1).
  const bandBySubject = new Map(bands.map((b) => [b.subject, b.keyStage]));
  // F4: parent-facing forward view — ordered band topics with certified/current/
  // upcoming state, so a homeschooling parent sees what's coming next.
  const roadmap = await childSubjectRoadmap(parentId, child._id);
  const insights = await childInsights(parentId, child._id);
  const work = await listMedia({ useCase: "child_work", childId, limit: 12 });
  const tutorNotes = await listChildTutorNotes(parentId, childId);
  const certificates = await listTopicCertificates(parentId, child);
  // Map a work photo's stored topic tag → human title (F5), for the chip below.
  const workTopicTitleByTag = new Map(
    certificates.map((c) => [c.topicTag, c.topicTitle]),
  );
  const decision = computeExamDecision(
    child.date_of_birth,
    standings.map((s) => ({
      subject: s.subject,
      readiness: s.readiness,
      grade: s.grade,
    })),
  );
  const save = saveChildProfile.bind(null, childId);
  const saveNote = saveChildNote.bind(null, childId);
  const firstName = child.full_name.split(" ")[0];

  // Plain-English narrative grounded in the same standings + this week's plan
  // (read-only — visiting the profile never generates a schedule).
  const schedule = await getWeeklySchedule(parentId, child._id);
  const planCounts = schedule
    ? schedule.items.reduce<Partial<Record<typeof standings[number]["subject"], number>>>(
        (acc, item) => ({ ...acc, [item.subject]: (acc[item.subject] ?? 0) + 1 }),
        {},
      )
    : null;
  // B3: thread lesson-based progress (certified count + working band) into the
  // narrative so a subject with no diagnostic/mock evaluation, but real
  // certified topics, doesn't contradict the "Current standing" card above.
  const lessonProgress: Partial<Record<typeof standings[number]["subject"], SubjectLessonProgress>> =
    Object.fromEntries(
      (Object.keys(certifiedCounts) as (keyof typeof certifiedCounts)[]).map((subject) => [
        subject,
        {
          certifiedCount: certifiedCounts[subject],
          bandLabel: bandBySubject.has(subject)
            ? KEY_STAGE_LABEL[bandBySubject.get(subject) ?? 4]
            : null,
        },
      ]),
    );
  const narrative = buildAssessmentNarrative(standings, planCounts, lessonProgress);
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
            <Check className="h-4 w-4" />{" "}
            {sp.saved === "note"
              ? `Note saved — it'll greet ${firstName} on the hub.`
              : "Profile saved."}
          </div>
        )}
        {sp.error && (
          <div className="mb-6 rounded-xl border border-crimson-400/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
            {sp.error}
          </div>
        )}

        {/* Current standing — one place for each subject's level: readiness/mock
            score where assessed, otherwise the lesson-based working band (B1: the
            standalone "Working level" block was merged in here so the same band
            isn't shown twice). */}
        <Card variant="glass-strong" padding="xl" className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-violet-300" />
            <h2 className="text-lg font-semibold text-fog-50">Current standing</h2>
          </div>
          <p className="text-sm text-fog-400 mb-5">
            {firstName}&apos;s lessons are pitched at the right level for each
            subject — this moves up automatically as topics are mastered.
          </p>
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
                      {s.grade ? ` · ${s.grade}` : ""}
                    </div>
                    {s.fromMock && s.mockBoundaryGrade && (
                      <div className="mt-1 text-xs text-amber-200/90">
                        Exam-style grade {s.mockBoundaryGrade} (approximate
                        boundaries)
                      </div>
                    )}
                    {bandBySubject.has(s.subject) && (
                      <div className="mt-1 text-xs text-cyan-200">
                        Working at {KEY_STAGE_LABEL[bandBySubject.get(s.subject) ?? 4]}
                      </div>
                    )}
                  </>
                ) : certifiedCounts[s.subject] > 0 ? (
                  <>
                    <div className="mt-2 text-sm text-cyan-200">
                      Working at{" "}
                      {KEY_STAGE_LABEL[bandBySubject.get(s.subject) ?? 4]}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                      {certifiedCounts[s.subject]} topic
                      {certifiedCounts[s.subject] === 1 ? "" : "s"} certified
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

        {/* Curriculum roadmap (F4) — forward view of the current band's topics,
            certified / current / upcoming, per subject. Parent-only planning. */}
        <RoadmapCard subjects={roadmap} childFirstName={firstName} />

        {/* Note to child (F1) — a short human encouragement that appears gently
            at the top of {firstName}'s hub. No AI, private to your family. */}
        <Card variant="glass" padding="xl" className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-rose-300" />
            <h2 className="text-lg font-semibold text-fog-50">
              A note for {firstName}
            </h2>
          </div>
          <p className="text-sm text-fog-400 mb-5">
            Leave a short message of encouragement — it shows up warmly at the top
            of {firstName}&apos;s learning hub. Just for them.
          </p>
          <form action={saveNote} className="grid gap-3">
            <textarea
              name="parent_note"
              rows={2}
              maxLength={CHILD_NOTE_MAX}
              defaultValue={child.parent_note ?? ""}
              placeholder={`e.g. Proud of you, ${firstName} — one quest at a time 💛`}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-fog-50 placeholder:text-fog-500 transition-all focus:border-rose-400/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-rose-400/20"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fog-500">
                Up to {CHILD_NOTE_MAX} characters. Leave empty to remove it.
              </p>
              <Button type="submit" variant="primary" size="md" className="shrink-0">
                Save note
              </Button>
            </div>
          </form>
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

        {/* GCSE readiness trajectory */}
        <Card variant="glass-strong" padding="xl" className="mb-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-300" />
              <h2 className="text-lg font-semibold text-fog-50">
                Readiness trajectory
              </h2>
            </div>
            <Button
              href={`/dashboard/children/${childId}/report`}
              variant="outline"
              size="sm"
            >
              Monthly report
            </Button>
          </div>
          <TrajectoryChart
            history={history}
            targetWindow={child.target_exam_window}
            certifiedAt={certificates.map((c) => c.achievedAt)}
          />
        </Card>

        {/* Learning insights (deterministic, no AI) */}
        <InsightsPanel
          insights={insights.insights}
          learning={insights.learning}
          childFirstName={child.full_name.split(" ")[0]}
        />

        {/* Exam decision (age 13+) */}
        {decision.eligible && (
          <div className="mb-6">
            <ExamDecisionCard decision={decision} childName={child.full_name} />
          </div>
        )}

        {/* Tutor notes (F9) — human-authored notes from logged tutor sessions,
            surfaced to the owning parent. Safeguarding-relevant; React-escaped. */}
        {tutorNotes.length > 0 && (
          <Card variant="glass" padding="xl" className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-neon-300" />
              <h2 className="text-lg font-semibold text-fog-50">Tutor notes</h2>
            </div>
            <p className="text-sm text-fog-400 mb-5">
              What {child.full_name.split(" ")[0]}&apos;s tutor noted after a
              session, by topic.
            </p>
            <div className="flex flex-col gap-3">
              {tutorNotes.map((n) => (
                <div
                  key={n.topicTag}
                  className="rounded-xl bg-white/[0.03] border border-white/5 p-4"
                >
                  <div className="text-sm font-semibold text-fog-50 mb-1">
                    {n.topicTitle}
                  </div>
                  <p className="text-sm leading-relaxed text-fog-300">{n.note}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Mastery certificates (F3) — tamper-evident per-topic evidence that
            folds into the Local Authority portfolio. Each row links to a
            printable/downloadable certificate carrying the same SHA-256 hash as
            the child-side one, so an LA can independently verify it. */}
        {certificates.length > 0 && (
          <Card variant="glass" padding="xl" className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-amber-300" />
              <h2 className="text-lg font-semibold text-fog-50">
                Mastery certificates
              </h2>
            </div>
            <p className="text-sm text-fog-400 mb-5">
              {certificates.length} topic{certificates.length === 1 ? "" : "s"}{" "}
              certified. Each certificate is tamper-evident and counts as Local
              Authority evidence — download any to print or attach.
            </p>
            <div className="flex flex-col gap-3">
              {certificates.map((c) => (
                <div
                  key={c.topicTag}
                  className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] border border-white/5 p-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-fog-50 truncate">
                      {c.topicTitle}
                    </div>
                    <div className="text-xs text-fog-500 mt-0.5">
                      {c.subjectLabel} · Awarded{" "}
                      {c.achievedAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <Button
                    href={`/dashboard/children/${childId}/certificate?topic=${encodeURIComponent(c.topicTag)}`}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Printer className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </Card>
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
            <WorkEvidenceUploader
              childId={childId}
              topics={certificates.map((c) => ({ tag: c.topicTag, title: c.topicTitle }))}
            />
          </div>
          {work.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {work.map((m) => (
                <a
                  key={m._id?.toHexString()}
                  href={m.secure_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                >
                  {/* Thumbnail via Cloudinary f_auto,q_auto,w_400 (bandwidth).
                      Signed-asset delivery doesn't go through next/image; the
                      transform is the win. Full-res opens via the parent <a>. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cloudinaryThumb(m.secure_url, 400)}
                    alt="Uploaded work"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {/* Topic tag chip (F5) — names which mastered topic this
                      working evidences, mirroring the LA portfolio entry. */}
                  {m.meta?.topic_tag && workTopicTitleByTag.get(m.meta.topic_tag) && (
                    <span className="absolute inset-x-1 bottom-1 truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-fog-100">
                      {workTopicTitleByTag.get(m.meta.topic_tag)}
                    </span>
                  )}
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
