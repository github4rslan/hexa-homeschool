"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Explainer } from "./explainer";
import { PracticePlayer } from "./practice-player";
import type { Question } from "@/components/lesson/lesson-player";

/**
 * Sequences the child's lesson: Explainer → Practice/Mastery.
 * (Check-in happens on the /learn hub before this.)
 * Phases slide/fade into each other so the day feels like a journey; the
 * screen stays quiet while the child works — motion only at transitions.
 */
export function DailyFlow({
  title,
  summary,
  points,
  questions,
  curriculumTopic,
  voiceId,
}: {
  title: string;
  summary: string;
  points: string[];
  questions: Question[];
  curriculumTopic: string;
  /** Child-chosen narration voice, threaded to both phases' TTS. */
  voiceId?: string | null;
}) {
  const [phase, setPhase] = useState<"explainer" | "practice">("explainer");

  const PHASES = [
    { key: "explainer", label: "Learn" },
    { key: "practice", label: "Practise" },
  ] as const;
  const phaseIndex = phase === "explainer" ? 0 : 1;

  return (
    <div>
      {/* Phase progress — the fill animates as the journey advances. */}
      <div className="mx-auto mb-8 flex max-w-2xl items-center gap-3">
        {PHASES.map((p, i) => (
          <div key={p.key} className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                initial={false}
                animate={{ width: i <= phaseIndex ? "100%" : "0%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span
              className={
                i <= phaseIndex
                  ? "mt-1.5 block text-center text-sm font-medium text-fog-200"
                  : "mt-1.5 block text-center text-sm text-fog-500"
              }
            >
              {p.label}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {phase === "explainer" ? (
            <Explainer
              title={title}
              summary={summary}
              points={points}
              onContinue={() => setPhase("practice")}
              voiceId={voiceId}
            />
          ) : (
            <PracticePlayer
              questions={questions}
              curriculumTopic={curriculumTopic}
              lessonTitle={title}
              voiceId={voiceId}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
