"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Celebration } from "@/components/fx/celebration";
import { submitReviewResult } from "@/app/(child)/learn/warmup/actions";
import type { WarmupQuestion } from "@/lib/db/repo";

/**
 * Spaced-repetition warm-up: up to 3 questions from topics due for review,
 * framed as an easy win ("Quick warm-up — you've got this"). Skippable and
 * never blocking: a Skip button jumps straight to today's quests. Grading is
 * deterministic against the human-authored canonical answer; the result updates
 * the review schedule (correct → longer interval, wrong → refresh sooner) but
 * never removes certification. Calm: no timers, no red flashes.
 */
export function WarmupPlayer({ questions }: { questions: WarmupQuestion[] }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const correct = picked === q.correctIndex;

  function choose(i: number) {
    if (picked !== null) return; // lock after first pick
    setPicked(i);
    void submitReviewResult(q.topicTag, i === q.correctIndex);
  }

  function next() {
    if (isLast) {
      setDone(true);
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  }

  if (done) {
    return (
      <div className="relative py-10 text-center">
        {!reduce && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <Celebration big variant={1} />
          </div>
        )}
        <h1 className="text-3xl font-semibold text-fog-50">Warm-up done! 🌟</h1>
        <p className="mt-3 text-xl text-fog-300">
          Nice — your memory&apos;s warmed up. On to today&apos;s quests.
        </p>
        <button
          onClick={() => router.push("/learn")}
          className="child-touch mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-8 py-4 text-lg font-semibold text-white"
        >
          Today&apos;s quests <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-amber-200">
          <Sparkles className="h-5 w-5" />
          <span className="text-base font-semibold">Quick warm-up</span>
        </div>
        <button
          onClick={() => router.push("/learn")}
          className="child-touch text-base text-fog-400 hover:text-fog-200"
        >
          Skip for now
        </button>
      </div>

      <p className="mb-2 text-base text-fog-400">
        {index + 1} of {questions.length} · {q.topicTitle}
      </p>
      <p className="mb-2 text-lg text-fog-300">You&apos;ve got this. 💪</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.questionId}
          initial={reduce ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="mb-6 text-2xl font-semibold text-fog-50">{q.prompt}</h2>

          <div className="relative grid gap-3">
            {picked !== null && correct && !reduce && (
              <div className="pointer-events-none absolute -top-6 right-0">
                <Celebration variant={index} />
              </div>
            )}
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              const isAnswer = i === q.correctIndex;
              const state =
                picked === null
                  ? "idle"
                  : isAnswer
                    ? "answer"
                    : isPicked
                      ? "wrong"
                      : "muted";
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={[
                    "child-touch flex items-center justify-between gap-3 rounded-2xl border p-5 text-left text-lg transition-colors",
                    state === "idle" &&
                      "border-white/10 bg-white/[0.03] text-fog-100 hover:border-white/25 hover:bg-white/[0.06]",
                    state === "answer" &&
                      "border-neon-400/60 bg-neon-500/15 text-neon-100",
                    state === "wrong" &&
                      "border-amber-400/50 bg-amber-500/10 text-amber-100",
                    state === "muted" && "border-white/5 bg-white/[0.02] text-fog-500",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {opt}
                  {state === "answer" && <Check className="h-5 w-5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-base text-fog-200">
                {correct
                  ? "Spot on! "
                  : "Good try — here's the idea again: "}
                {q.explanation}
              </p>
              <button
                onClick={next}
                className="child-touch mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 px-8 py-4 text-lg font-semibold text-white"
              >
                {isLast ? "Finish warm-up" : "Next"} <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
