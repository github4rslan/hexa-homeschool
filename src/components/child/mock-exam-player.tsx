"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { Timer, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { MockGradeReveal } from "@/components/child/mock-result-view";
import { submitMock, type MockSubmitResult } from "@/app/(child)/learn/mock/actions";
import type { MockQuestion } from "@/lib/db/repo";
import type { Subject } from "@/lib/db/types";

/**
 * Timed mock-exam paper. Deterministically scored on submit; the timer is
 * visible but calm (no red flash, no alarm) and when it runs out the paper
 * submits gracefully mid-question. After results, AI explanations for WRONG
 * answers are fetched through /api/tutor (Teaching Agent + Checker pipeline) —
 * never for scoring. Reduced-motion respected throughout.
 */

interface AiExplanation {
  loading: boolean;
  text: string | null;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MockExamPlayer({
  subject,
  subjectLabel,
  questions,
  durationSeconds,
  keyStage,
  paperLabel,
  conditionLine,
  tierLabel,
}: {
  subject: Subject;
  subjectLabel: string;
  questions: MockQuestion[];
  durationSeconds: number;
  /** Child's current band — tone guidance for post-exam AI explanations only. */
  keyStage?: number;
  /** Exam-day framing (F9): calc/non-calc badge + calm condition line + tier. */
  paperLabel?: string;
  conditionLine?: string;
  tierLabel?: "Foundation" | "Higher";
}) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<MockSubmitResult | null>(null);
  const [remaining, setRemaining] = useState(durationSeconds);
  const [explanations, setExplanations] = useState<Record<number, AiExplanation>>({});
  const submittingRef = useRef(false);

  const q = questions[index];

  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitted(true);
    const key = questions.map((qq, i) => ({
      tier: qq.tier,
      marks: qq.marks,
      correct: answers[i] === qq.correctIndex,
    }));
    const res = await submitMock(subject, key, tierLabel);
    setResult(res);
  }, [answers, questions, subject, tierLabel]);

  // Gentle countdown; auto-submits at zero.
  useEffect(() => {
    if (submitted) return;
    if (remaining <= 0) {
      void doSubmit();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, submitted, doSubmit]);

  function pick(i: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = i;
      return next;
    });
  }

  const answeredCount = answers.filter((a) => a !== null).length;
  const lowTime = remaining <= 60;

  // ── Results screen ───────────────────────────────────────
  if (submitted) {
    if (!result) {
      return (
        <div className="py-16 text-center text-xl text-fog-300">
          Marking your paper…
        </div>
      );
    }
    return (
      <MockResults
        subjectLabel={subjectLabel}
        result={result}
        questions={questions}
        answers={answers}
        explanations={explanations}
        setExplanations={setExplanations}
        onDone={() => router.push("/learn")}
        onSeeJourney={() => router.push("/learn/map")}
        reduce={!!reduce}
        keyStage={keyStage}
      />
    );
  }

  // ── Exam screen ──────────────────────────────────────────
  return (
    <div>
      {(paperLabel || conditionLine) && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {paperLabel && (
              <span className="inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-200">
                {paperLabel}
              </span>
            )}
            {tierLabel && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm font-medium text-fog-300">
                {tierLabel} tier
              </span>
            )}
          </div>
          {conditionLine && (
            <p className="text-base text-fog-300">{conditionLine}</p>
          )}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <span className="text-base font-medium text-fog-300">
          {subjectLabel} mock · {index + 1} of {questions.length}
        </span>
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-base font-semibold tabular-nums transition-colors",
            lowTime
              ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
              : "border-white/10 bg-white/[0.04] text-fog-300",
          ].join(" ")}
          aria-live="off"
        >
          <Timer className="h-4 w-4" /> {fmt(remaining)}
        </span>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.questionId}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="mb-6 text-2xl font-semibold text-fog-50">{q.prompt}</h2>
          <div className="grid gap-3">
            {q.options.map((opt, i) => {
              const chosen = answers[index] === i;
              return (
                <MockOption
                  key={i}
                  chosen={chosen}
                  reduce={!!reduce}
                  onPick={() => pick(i)}
                >
                  {opt}
                </MockOption>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setIndex((n) => Math.max(0, n - 1))}
          disabled={index === 0}
          className="child-touch inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-base text-fog-200 disabled:opacity-40"
        >
          <ArrowLeft className="h-5 w-5" /> Back
        </button>

        {index < questions.length - 1 ? (
          <button
            onClick={() => setIndex((n) => Math.min(questions.length - 1, n + 1))}
            className="child-touch inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-base font-semibold text-fog-50"
          >
            Next <ArrowRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => void doSubmit()}
            className="child-touch inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-7 py-3 text-base font-semibold text-white"
          >
            Finish paper <Check className="h-5 w-5" />
          </button>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-fog-500">
        You can go back and change answers any time before you finish.
      </p>
    </div>
  );
}

/**
 * F4 — a correctness-blind "pick" acknowledgment for the mock's answer
 * options. Unlike the practice/mastery mcq (which settles green on a CORRECT
 * pick), a mock never reveals right/wrong per-question — this is purely a
 * "your tap registered" flourish, identical whichever option is chosen.
 * State updates instantly (onPick fires synchronously first); the settle is
 * fire-and-forget so it never gates the click. Reduced motion fully
 * neutralises to the existing instant colour swap.
 */
function MockOption({
  chosen,
  reduce,
  onPick,
  children,
}: {
  chosen: boolean;
  reduce: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  const controls = useAnimationControls();

  function handleClick() {
    onPick();
    if (reduce) return;
    // A fresh .start() call cancels any in-flight pulse and restarts, so
    // rapid re-picking (changing an answer) never stacks or desyncs.
    void controls.start({
      scale: [1, 1.03, 1],
      boxShadow: [
        "0 0 0 0 rgba(139,92,246,0)",
        "0 0 22px 3px rgba(139,92,246,0.35)",
        "0 0 0 0 rgba(139,92,246,0)",
      ],
      transition: { duration: 0.22, ease: "easeOut" },
    });
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      animate={controls}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      className={[
        "child-touch rounded-2xl border p-5 text-left text-lg transition-colors",
        chosen
          ? "border-violet-400/60 bg-violet-500/15 text-violet-100"
          : "border-white/10 bg-white/[0.03] text-fog-100 hover:border-white/25 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

function MockResults({
  subjectLabel,
  result,
  questions,
  answers,
  explanations,
  setExplanations,
  onDone,
  onSeeJourney,
  reduce,
  keyStage,
}: {
  subjectLabel: string;
  result: MockSubmitResult;
  questions: MockQuestion[];
  answers: (number | null)[];
  explanations: Record<number, AiExplanation>;
  setExplanations: React.Dispatch<React.SetStateAction<Record<number, AiExplanation>>>;
  onDone: () => void;
  onSeeJourney: () => void;
  reduce: boolean;
  /** Child's band — tone guidance for AI explanations only (Checker still gates). */
  keyStage?: number;
}) {
  const wrong = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => answers[i] !== q.correctIndex);

  async function explain(i: number) {
    const q = questions[i];
    setExplanations((prev) => ({ ...prev, [i]: { loading: true, text: null } }));
    try {
      const chosen = answers[i];
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: q.prompt,
          correctAnswer: q.options[q.correctIndex],
          topic: q.topicTag,
          studentAnswer: chosen !== null ? q.options[chosen] : "",
          wasCorrect: false,
          ...(keyStage ? { keyStage } : {}),
        }),
      });
      // Any non-OK (rate limit, tier gate, config) → fall back to the canonical
      // human-authored explanation. A child never sees a raw error.
      const data = res.ok ? await res.json() : null;
      setExplanations((prev) => ({
        ...prev,
        [i]: {
          loading: false,
          text: (data?.explanation as string) || q.explanation,
        },
      }));
    } catch {
      setExplanations((prev) => ({
        ...prev,
        [i]: { loading: false, text: q.explanation },
      }));
    }
  }

  return (
    <div>
      <MockGradeReveal
        subjectLabel={subjectLabel}
        indicativeGrade={result.indicativeGrade}
        detail={`You got ${result.correct} of ${result.total} right.`}
        reduce={reduce}
      />

      {wrong.length > 0 ? (
        <div className="mt-4">
          <h2 className="mb-4 text-xl font-semibold text-fog-100">
            Let&apos;s look at the tricky ones
          </h2>
          <div className="flex flex-col gap-4">
            {wrong.map(({ q, i }) => {
              const ex = explanations[i];
              return (
                <div
                  key={q.questionId}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <p className="mb-2 text-lg text-fog-100">{q.prompt}</p>
                  <p className="mb-3 text-base text-neon-300">
                    Answer: {q.options[q.correctIndex]}
                  </p>
                  {ex?.text ? (
                    <p className="text-base text-fog-300">{ex.text}</p>
                  ) : (
                    <button
                      onClick={() => void explain(i)}
                      disabled={ex?.loading}
                      className="child-touch inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-base text-violet-200 disabled:opacity-60"
                    >
                      <Sparkles className="h-4 w-4" />
                      {ex?.loading ? "Thinking…" : "Explain this one"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-lg text-neon-300">
          A clean sweep — every answer correct. Wonderful.
        </p>
      )}

      <p className="mt-8 text-center text-base text-fog-400">
        {wrong.length > 0
          ? `Next focus: a few more ${subjectLabel} lessons will lift this even higher.`
          : `Next focus: keep your ${subjectLabel} streak going on your journey.`}
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onSeeJourney}
          className="child-touch inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-lg font-semibold text-fog-100 hover:border-white/30"
        >
          See my journey
        </button>
        <button
          onClick={onDone}
          className="child-touch inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-8 py-4 text-lg font-semibold text-white"
        >
          Back to learning <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
