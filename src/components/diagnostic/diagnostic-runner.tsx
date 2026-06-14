"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowRight, Check, CloudUpload, Target, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DIAGNOSTIC_SUBJECTS,
  pickNextItem,
  tierToGrade,
  updateTier,
  type DiagnosticItem,
  type DiagnosticSubject,
  type SubjectResult,
} from "@/lib/data/diagnostic";
import { buildAssessmentNarrative } from "@/lib/engine/assessment-narrative";
import { saveDiagnosticResults } from "@/app/(dashboard)/onboarding/diagnostic/actions";

/** How many adaptive items to ask per subject in this Phase-1 diagnostic. */
const ITEMS_PER_SUBJECT = 4;

interface SubjectProgress {
  tier: number;
  correct: number;
  answered: number;
  seen: Set<string>;
}

type Phase = "intro" | "running" | "results";

export function DiagnosticRunner({ pool }: { pool: DiagnosticItem[] }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [current, setCurrent] = useState<DiagnosticItem | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "local">("idle");
  const [progress, setProgress] = useState<Record<DiagnosticSubject, SubjectProgress>>(
    () =>
      Object.fromEntries(
        DIAGNOSTIC_SUBJECTS.map((s) => [
          s.id,
          { tier: 3, correct: 0, answered: 0, seen: new Set<string>() },
        ]),
      ) as Record<DiagnosticSubject, SubjectProgress>,
  );

  const totalItems = DIAGNOSTIC_SUBJECTS.length * ITEMS_PER_SUBJECT;
  const answeredTotal = useMemo(
    () => Object.values(progress).reduce((sum, p) => sum + p.answered, 0),
    [progress],
  );

  function startDiagnostic() {
    const first = DIAGNOSTIC_SUBJECTS[0].id;
    const item = pickNextItem(pool, first, progress[first].tier, progress[first].seen);
    setCurrent(item);
    setSubjectIndex(0);
    setSelected(null);
    setPhase("running");
  }

  function advance() {
    if (current === null || selected === null) return;

    const subject = DIAGNOSTIC_SUBJECTS[subjectIndex].id;
    const wasCorrect = selected === current.correctIndex;

    const updated: SubjectProgress = {
      tier: updateTier(progress[subject].tier, wasCorrect),
      correct: progress[subject].correct + (wasCorrect ? 1 : 0),
      answered: progress[subject].answered + 1,
      seen: new Set(progress[subject].seen).add(current.id),
    };
    const nextProgress = { ...progress, [subject]: updated };
    setProgress(nextProgress);
    setSelected(null);

    if (updated.answered < ITEMS_PER_SUBJECT) {
      const next = pickNextItem(pool, subject, updated.tier, updated.seen);
      if (next) {
        setCurrent(next);
        return;
      }
    }

    const nextSubjectIndex = subjectIndex + 1;
    if (nextSubjectIndex < DIAGNOSTIC_SUBJECTS.length) {
      const ns = DIAGNOSTIC_SUBJECTS[nextSubjectIndex].id;
      const next = pickNextItem(pool, ns, nextProgress[ns].tier, nextProgress[ns].seen);
      setSubjectIndex(nextSubjectIndex);
      setCurrent(next);
      return;
    }

    setCurrent(null);
    setPhase("results");

    // Persist to evaluation_records for the parent's active child.
    // No-ops gracefully if not signed in or no child yet — the UI still
    // shows results regardless.
    const outcomes = DIAGNOSTIC_SUBJECTS.map((s) => {
      const p = nextProgress[s.id];
      const accuracy = p.answered ? p.correct / p.answered : 0;
      return {
        subject: s.id,
        readiness: Math.round(((p.tier / 5) * 0.6 + accuracy * 0.4) * 100),
        workingGrade: tierToGrade(p.tier),
      };
    });
    void saveDiagnosticResults(outcomes)
      .then((r) => setSaveState(r.persisted ? "saved" : "local"))
      .catch(() => setSaveState("local"));
  }

  const results: SubjectResult[] = useMemo(
    () =>
      DIAGNOSTIC_SUBJECTS.map((s) => {
        const p = progress[s.id];
        const accuracy = p.answered ? p.correct / p.answered : 0;
        const readiness = Math.round(((p.tier / 5) * 0.6 + accuracy * 0.4) * 100);
        return {
          subject: s.id,
          label: s.label,
          estimatedTier: p.tier,
          workingGrade: tierToGrade(p.tier),
          correct: p.correct,
          answered: p.answered,
          readiness,
        };
      }),
    [progress],
  );

  // Deterministic plain-English explanation of the results (no AI involved).
  const narrative = useMemo(
    () =>
      buildAssessmentNarrative(
        results.map((r) => ({
          subject: r.subject,
          readiness: r.readiness,
          grade: r.workingGrade,
        })),
      ),
    [results],
  );

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card variant="glass-strong" padding="xl" className="text-center">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-400/30 mb-6">
                <Activity className="h-7 w-7 text-violet-300" />
              </div>
              <h1 className="text-3xl font-semibold text-fog-50 mb-3">
                The HEXA diagnostic
              </h1>
              <p className="text-fog-300 leading-relaxed mb-2">
                An adaptive assessment that maps your child&apos;s current level
                against GCSE standards across Maths, English and Science.
              </p>
              <p className="text-sm text-fog-500 mb-8">
                Questions adapt to each answer — getting harder when your child is
                doing well, easier when they need support. No guesswork. Just facts.
              </p>
              <Button onClick={startDiagnostic} variant="primary" size="lg">
                Begin diagnostic
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-4 text-xs text-fog-500">
                {totalItems} adaptive questions · about 5 minutes
              </p>
            </Card>
          </motion.div>
        )}

        {phase === "running" && current && (
          <motion.div
            key={`item-${current.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <Badge variant="violet" size="sm">
                  {DIAGNOSTIC_SUBJECTS[subjectIndex].label}
                </Badge>
                <span className="text-fog-500 font-mono">
                  {answeredTotal + 1} / {totalItems}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-neon-400 rounded-full"
                  animate={{ width: `${(answeredTotal / totalItems) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <Card variant="glass-strong" padding="xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                {current.topic}
              </span>
              <h2 className="text-2xl font-semibold text-fog-50 mt-2 mb-8 leading-snug">
                {current.prompt}
              </h2>

              <div className="grid gap-3 mb-8">
                {current.options.map((option, i) => {
                  const isSelected = selected === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-violet-400/60 bg-violet-500/10"
                          : "border-white/10 hover:border-white/30 hover:bg-white/5",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md text-xs font-mono font-medium border",
                          isSelected
                            ? "border-violet-400 text-violet-300 bg-violet-500/20"
                            : "border-white/15 text-fog-400",
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-base text-fog-100">{option}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={advance}
                  variant="primary"
                  size="md"
                  disabled={selected === null}
                >
                  {answeredTotal + 1 >= totalItems ? "See results" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <p className="mt-4 text-center text-xs text-fog-500">
              Honesty over hype — we report real readiness, never an inflated score.
            </p>
          </motion.div>
        )}

        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card variant="glass-strong" padding="xl">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-neon-500/10 border border-neon-400/40 glow-neon mb-6">
                <Check className="h-7 w-7 text-neon-400" />
              </div>
              <h1 className="text-3xl font-semibold text-fog-50 text-center mb-2">
                Diagnostic complete
              </h1>
              <p className="text-fog-400 text-center mb-8">
                Here&apos;s an honest baseline of where your child stands today.
              </p>

              <div className="flex flex-col gap-3 mb-8">
                {results.map((r) => (
                  <div
                    key={r.subject}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <div>
                      <div className="text-sm font-semibold text-fog-50">
                        {r.label}
                      </div>
                      <div className="text-xs text-fog-500">
                        {r.correct} of {r.answered} correct · working at{" "}
                        {r.workingGrade}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gradient-violet">
                        {r.readiness}%
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                        Readiness
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Understanding these results — deterministic, parent-facing */}
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5 mb-8">
                <h2 className="text-sm font-semibold text-fog-50 mb-2">
                  Understanding these results
                </h2>
                <p className="text-xs leading-relaxed text-fog-400 mb-4">
                  {narrative.intro}
                </p>
                <div className="flex flex-col gap-3">
                  {narrative.subjects.map((s) => (
                    <div key={s.subject}>
                      <div className="text-xs font-semibold text-fog-200 mb-0.5">
                        {s.label}
                      </div>
                      <p className="text-xs leading-relaxed text-fog-400">
                        {s.text}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-fog-400">
                  {narrative.planNote}
                </p>
              </div>

              <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4 mb-8">
                <div className="flex items-start gap-3">
                  <Target className="h-4 w-4 text-violet-300 mt-0.5 shrink-0" />
                  <p className="text-sm text-fog-200 leading-relaxed">
                    Next, the Planning Agent has turned this baseline into a
                    personalised weekly plan — every lesson chosen for a reason
                    you can see. Review and approve it before any lessons begin.
                    Sit the exam when ready, not before.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button href="/schedule" variant="primary" size="lg">
                  See this week&apos;s plan
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/dashboard" variant="secondary" size="lg">
                  Go to dashboard
                </Button>
              </div>

              {saveState !== "idle" && (
                <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-fog-500">
                  <CloudUpload className="h-3.5 w-3.5" />
                  {saveState === "saved"
                    ? "Results saved to your child's record."
                    : "Results shown locally — sign in and add a child to save them."}
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "running" && (
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-fog-500 hover:text-fog-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Exit diagnostic
          </Link>
        </div>
      )}
    </div>
  );
}
