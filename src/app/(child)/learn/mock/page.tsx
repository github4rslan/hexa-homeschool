import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calculator, BookText, FlaskConical, ArrowLeft, Timer, Check, ArrowRight, Lock } from "lucide-react";
import {
  currentParentId,
  getActiveChild,
  getMockState,
  certifiedBySubject,
} from "@/lib/db/repo";
import { readActiveChildId } from "@/lib/active-child";
import type { Subject } from "@/lib/db/types";
import { mockUnlockCount } from "@/lib/engine/mock-gate";

export const metadata: Metadata = { title: "Mock exam" };
export const dynamic = "force-dynamic";

const SUBJECTS = [
  { id: "mathematics", label: "Maths", icon: Calculator, accent: "from-violet-500 to-violet-700" },
  { id: "english", label: "English", icon: BookText, accent: "from-cyan-500 to-cyan-700" },
  { id: "science", label: "Science", icon: FlaskConical, accent: "from-neon-500 to-neon-600" },
] as const;

export default async function MockHubPage() {
  const parentId = await currentParentId();
  if (!parentId) redirect("/login?redirect=/learn/mock");
  const child = await getActiveChild(parentId, await readActiveChildId());
  if (!child?._id) redirect("/dashboard");

  // Per-subject attempt state this period (one honest attempt each).
  const states = await getMockState(parentId, child._id);
  const certified = await certifiedBySubject(child._id);
  const stateBySubject = new Map(states.map((s) => [s.subject, s]));
  const dateLabel = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/learn"
        className="child-touch mb-6 inline-flex items-center gap-2 text-base text-fog-300 hover:text-fog-100"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Link>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-semibold text-fog-50">Mock exam</h1>
        <p className="mt-3 text-xl text-fog-300">
          A short, calm practice paper. No pressure — it just shows where
          you&apos;re at today.
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-base text-fog-400">
          <Timer className="h-5 w-5" /> About 15 minutes · 10 questions
        </p>
      </div>

      <div className="grid gap-5">
        {SUBJECTS.map((s) => {
          const Icon = s.icon;
          const state = stateBySubject.get(s.id as Subject);
          const needed = mockUnlockCount(s.id as Subject);
          const certifiedCount = Math.min(certified[s.id as Subject] ?? 0, needed);
          const unlocked = certifiedCount >= needed;

          if (!unlocked) {
            return (
              <div
                key={s.id}
                className="child-panel flex items-center gap-5 p-6 opacity-80"
                aria-label={`${s.label} mock locked until ${needed} topics are certified`}
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-2 border-white/10 bg-white/[0.04]">
                  <Lock className="h-9 w-9 text-fog-400" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-semibold text-fog-50">
                    {s.label} mock locked
                  </div>
                  <p className="mt-1 text-base text-fog-400">
                    Certify {needed} topics to unlock it. You have {certifiedCount}/{needed}.
                  </p>
                </div>
              </div>
            );
          }

          // Completed this period — a calm "done" panel (no retake), with the
          // result and when the next mock unlocks. Effort-framed, encouraging.
          if (state?.taken) {
            const grade = state.result?.indicativeGrade?.toLowerCase() ?? "";
            return (
              <Link
                key={s.id}
                href={`/learn/mock/${s.id}`}
                className="child-touch child-panel group flex items-center gap-5 p-6 transition-all hover:scale-[1.01]"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-2 border-neon-400/40 bg-neon-500/10">
                  <Check className="h-9 w-9 text-neon-400" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-semibold text-fog-50">
                    {s.label} mock complete this week
                  </div>
                  <p className="mt-1 text-base text-fog-400">
                    {grade
                      ? `You're at a ${grade} level today. `
                      : "Your result is saved. "}
                    Next mock {dateLabel(state.nextAvailable)}.
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-base font-medium text-neon-300">
                    See your result <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          }

          // Available — start this period's attempt.
          return (
            <Link
              key={s.id}
              href={`/learn/mock/${s.id}`}
              className="child-touch child-panel group flex items-center gap-5 p-6 transition-all hover:scale-[1.01]"
            >
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${s.accent} text-white`}
              >
                <Icon className="h-9 w-9" />
              </div>
              <div className="flex-1 text-2xl font-semibold text-fog-50">
                {s.label} mock
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
