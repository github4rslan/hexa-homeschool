"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Explainer } from "./explainer";
import { PracticePlayer } from "./practice-player";
import { accentPreset } from "@/lib/child/accents";
import { pulseTargetOnCrossing } from "@/lib/child/phase-bar";
import { resolveResumeStep, type SavedProgress } from "@/lib/child/interactions";
import { cn } from "@/lib/utils";
import type { Question } from "@/components/lesson/lesson-player";
import type { WorkedExample } from "@/lib/child/worked-examples";
import type { GlossaryTerm } from "@/lib/child/glossary";

/**
 * Sequences the child's lesson: Explainer → Practice/Mastery.
 * (Check-in happens on the /learn hub before this.)
 * Phases slide/fade into each other so the day feels like a journey; the
 * screen stays quiet while the child works — motion only at transitions. The
 * child's accent threads through the phase bar and both phases.
 */
export function DailyFlow({
  title,
  summary,
  points,
  glossary,
  workedExample,
  questions,
  masteryQuestions,
  stretch = null,
  curriculumTopic,
  voiceId,
  keyStage,
  accent: accentId,
  narrationAutoplay = true,
  soundCues = true,
  lowText = false,
  mood = null,
  savedProgress,
  firstName,
  resumeKey,
  tutorNote,
}: {
  title: string;
  summary: string;
  points: string[];
  /** Human-authored tap-to-define glossary for the explainer prose (F9). */
  glossary?: GlossaryTerm[];
  workedExample?: WorkedExample;
  questions: Question[];
  masteryQuestions?: Question[];
  /** F6 — optional human-authored post-mastery bonus question (null = none). */
  stretch?: Question | null;
  curriculumTopic: string;
  /**
   * A human tutor's note from a logged handoff session (Wave 7, Phase 4). When
   * present it's surfaced warmly at the top of the explainer so the next lesson
   * picks up where the tutor left off. Absent on every normal lesson.
   */
  tutorNote?: string | null;
  /** Child-chosen narration voice, threaded to both phases' TTS. */
  voiceId?: string | null;
  /** Child's UK key stage, used only as a narration pace hint. */
  keyStage?: number;
  /** Child-chosen accent preset id (drives colour throughout). */
  accent?: string | null;
  /** Child's "read questions to me" preference (auto-narration). */
  narrationAutoplay?: boolean;
  /** Child's "sounds & buzz" preference (gentle lesson cues; opt-out). */
  soundCues?: boolean;
  /** Picture-first / low-text mode — fewer words, icon-first controls. */
  lowText?: boolean;
  /** Today's emoji check-in (1-5; null = none) — tunes Eddie's tone only. */
  mood?: number | null;
  /** Server-synced mid-lesson progress for a warm resume (MongoDB). */
  savedProgress?: SavedProgress | null;
  /** Child's first name, for the warm re-entry card. */
  firstName?: string;
  /** Per-child localStorage namespace for instant same-device resume. */
  resumeKey?: string;
}) {
  const accent = accentPreset(accentId);
  // If there's resumable progress, drop straight into practice at the saved step
  // rather than replaying the explainer.
  const canResume =
    resolveResumeStep(savedProgress ?? null, questions.length) !== null;
  const [phase, setPhase] = useState<"explainer" | "practice">(
    canResume ? "practice" : "explainer",
  );
  // The practice player's internal sub-phase, lifted so the bar can cross into
  // a real third "Mastery" stage instead of silently reusing "Practise".
  const [subPhase, setSubPhase] = useState<
    "practice" | "mastery" | "reteach" | "handoff" | "complete"
  >("practice");

  const PHASES = [
    { key: "explainer", label: "Learn" },
    { key: "practice", label: "Practise" },
    { key: "mastery", label: "Mastery" },
  ] as const;
  // Mastery, reteach, handoff and complete all live in the "prove it" stage.
  const inMastery = subPhase !== "practice";
  const phaseIndex = phase === "explainer" ? 0 : inMastery ? 2 : 1;

  // F7 — one-shot "settle pulse" the moment a segment becomes active (forward
  // progress only; never on a wrong answer). Tracks the previous phaseIndex so
  // the pulse fires exactly once per crossing, not on every re-render, and is
  // fully neutralised under prefers-reduced-motion (no scale/glow at all).
  const reduceMotion = useReducedMotion();
  const prevPhaseIndexRef = useRef(phaseIndex);
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);
  useEffect(() => {
    const target = pulseTargetOnCrossing(prevPhaseIndexRef.current, phaseIndex);
    if (!reduceMotion && target !== null) {
      setPulseIndex(target);
    }
    prevPhaseIndexRef.current = phaseIndex;
  }, [phaseIndex, reduceMotion]);

  return (
    <div>
      {/* Phase progress — the accent fill animates as the journey advances. */}
      <div className="mx-auto mb-8 flex max-w-2xl items-center gap-3">
        {PHASES.map((p, i) => (
          <div key={p.key} className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={cn("h-full rounded-full bg-gradient-to-r", accent.bar)}
                initial={false}
                animate={{ width: i <= phaseIndex ? "100%" : "0%" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <motion.span
              className={cn(
                "mt-1.5 block rounded-md text-center text-sm",
                i <= phaseIndex
                  ? "font-medium text-fog-200"
                  : "text-fog-500",
              )}
              animate={
                pulseIndex === i
                  ? {
                      scale: [1, 1.04, 1],
                      boxShadow: [
                        `0 0 0 ${accent.swatch}00`,
                        `0 0 14px ${accent.swatch}80`,
                        `0 0 0 ${accent.swatch}00`,
                      ],
                    }
                  : { scale: 1, boxShadow: `0 0 0 ${accent.swatch}00` }
              }
              transition={{ duration: 0.7, ease: "easeOut" }}
              onAnimationComplete={() => {
                if (pulseIndex === i) setPulseIndex(null);
              }}
            >
              {p.label}
            </motion.span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -28 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {phase === "explainer" ? (
            <Explainer
              title={title}
              summary={summary}
              points={points}
              glossary={glossary}
              workedExample={workedExample}
              onContinue={() => setPhase("practice")}
              topic={curriculumTopic}
              voiceId={voiceId}
              keyStage={keyStage}
              accent={accentId}
              autoplay={narrationAutoplay}
              tutorNote={tutorNote}
            />
          ) : (
            <PracticePlayer
              questions={questions}
              masteryQuestions={masteryQuestions}
              stretch={stretch}
              curriculumTopic={curriculumTopic}
              topicTitle={title}
              voiceId={voiceId}
              keyStage={keyStage}
              accent={accentId}
              narrationAutoplay={narrationAutoplay}
              soundCues={soundCues}
              lowText={lowText}
              mood={mood}
              savedProgress={savedProgress}
              firstName={firstName}
              resumeKey={resumeKey}
              onPhaseChange={setSubPhase}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
