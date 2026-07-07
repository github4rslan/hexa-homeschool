"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  CloudUpload,
  Lightbulb,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalmPause } from "@/components/child/calm-pause";
import { logLessonCompletion } from "@/app/(dashboard)/lesson/actions";
import { fetchJsonWithRetry } from "@/lib/fetch-with-retry";
import { Interaction as InteractionRenderer, type InteractionHandle } from "@/components/child/interaction";
import type { Interaction } from "@/lib/child/interactions";
import { accentPreset } from "@/lib/child/accents";
import type { WorkedExample } from "@/lib/child/worked-examples";
import type { TeachingAnimation } from "@/lib/child/teaching-animations";

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  /** Human-authored canonical explanation — ground truth + offline fallback. */
  explanation: string;
  /**
   * Optional interactive step (Feature 1). Absent ⇒ plain mcq. Validated via
   * `normalizeInteraction` before it reaches a renderer.
   */
  interaction?: Interaction;
  /** Optional human-authored progressive hints (nudge → specific). */
  hints?: string[];
  /**
   * Optional per-option misconception lines, index-aligned with `options`
   * (Wave 7, Phase 3). Shown when the child picks that specific wrong option.
   */
  misconceptions?: string[];
  workedSolution?: WorkedExample;
  teachingAnimation?: TeachingAnimation;
}

/** Result shape returned by /api/tutor (Teaching Agent + Checker). */
interface TutorResponse {
  explanation: string;
  aiVerified: boolean;
  usedFallback: boolean;
  checker: { confidence: number };
  /** Set when the safety gate froze the session instead of answering. */
  frozen?: boolean;
  message?: string;
}

export function LessonPlayer({
  questions,
  lessonTitle = "Lesson",
  topicTag = "Lesson",
  /** Curriculum topic_tag used to persist progress (matches seeded topics). */
  curriculumTopic = "maths_algebra_linear",
  /** Where "Continue" goes after completion — the next topic, or dashboard. */
  nextHref = "/dashboard",
}: {
  /** Real questions for this topic (practice + mastery) from the DB. */
  questions: Question[];
  lessonTitle?: string;
  topicTag?: string;
  curriculumTopic?: string;
  nextHref?: string;
}) {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const interactionRef = useRef<InteractionHandle>(null);
  const accent = accentPreset(null);

  // Teaching Agent state
  const [tutor, setTutor] = useState<TutorResponse | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);

  /** Safety freeze (child-safety rule 2) — terminal; replaces the lesson UI. */
  const [frozen, setFrozen] = useState<string | null>(null);

  // TTS state
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Progress persistence
  const startedAtRef = useRef<number>(Date.now());
  const loggedRef = useRef(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "local"
  >("idle");

  const question = questions[step];
  const isLast = step === questions.length - 1;
  const isCorrect = submitted && wasCorrect;
  const interaction: Interaction = question?.interaction ?? { type: "mcq" };
  const progress = Math.min(
    100,
    ((Math.min(step, questions.length) + (submitted ? 1 : 0)) /
      questions.length) *
      100,
  );

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Revoke any object URL on unmount to avoid memory leaks.
  useEffect(() => cleanupAudio, [cleanupAudio]);

  const complete = step >= questions.length;

  // On completion, persist the lesson to instructional_logs + competence_matrix.
  // Runs exactly once per lesson; no-ops gracefully if unauthenticated.
  useEffect(() => {
    if (!complete || loggedRef.current) return;
    loggedRef.current = true;
    setSaveState("saving");
    const timeSpentSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000),
    );
    void logLessonCompletion({
      topicTag: curriculumTopic,
      score: Math.min(score, questions.length),
      total: questions.length,
      timeSpentSeconds,
      hintsUsed: 0,
    })
      .then((r) => setSaveState(r.persisted ? "saved" : "local"))
      .catch(() => setSaveState("local"));
  }, [complete, curriculumTopic, score, questions.length]);

  async function handleSubmit() {
    // Guard against double-submission (rapid double-click, re-entry): a second
    // call before `submitted` flips would otherwise score the same question
    // twice and push the total above the number of questions (e.g. 8/7).
    if (!ready || question === undefined || submitted) return;
    setSubmitted(true);
    const correct = interactionRef.current?.isCorrect() ?? false;
    setWasCorrect(correct);
    if (correct) setScore((s) => Math.min(questions.length, s + 1));

    // Fire the Teaching Agent. Tolerate serverless cold starts (timeout+retry)
    // so a slow first call doesn't look like a failure. The human-authored
    // explanation remains a guaranteed fallback if the agent is truly down.
    setTutorLoading(true);
    setTutor(null);
    try {
      const data = await fetchJsonWithRetry<TutorResponse>(
        "/api/tutor",
        {
          prompt: question.prompt,
          correctAnswer: question.explanation,
          topic: topicTag,
          studentAnswer:
            interactionRef.current?.answerText() || question.options[0],
          wasCorrect: correct,
        },
        { timeoutMs: 25000, retries: 1 },
      );
      if (data.frozen) {
        cleanupAudio();
        setFrozen(data.message ?? "");
        return;
      }
      setTutor(data);
    } catch {
      setTutor(offlineTutor(question.explanation));
    } finally {
      setTutorLoading(false);
    }
  }

  function handleNext() {
    cleanupAudio();
    setAudioError(null);
    setTutor(null);
    if (isLast) {
      setStep(questions.length);
      return;
    }
    setStep((s) => s + 1);
    setReady(false);
    setSubmitted(false);
    setWasCorrect(false);
  }

  async function handleListen() {
    if (question === undefined) return;
    setAudioError(null);

    // Toggle: if already playing, stop.
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      return;
    }
    // Replay if we already have audio.
    if (audioRef.current) {
      void audioRef.current.play();
      return;
    }

    setAudioLoading(true);
    try {
      const narration = tutor?.explanation ?? question.prompt;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narration }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Narration unavailable.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        // keep the element so a second click replays without re-fetching
      };
      await audio.play();
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : "Narration unavailable.");
    } finally {
      setAudioLoading(false);
    }
  }

  // Clamp defensively so the summary can never read >100% or score > total.
  const cappedScore = Math.min(score, questions.length);
  const mastery = questions.length
    ? Math.min(100, (cappedScore / questions.length) * 100)
    : 0;

  // Safety freeze: replaces the entire lesson UI, checked before anything.
  if (frozen !== null) {
    return (
      <CalmPause
        message={frozen}
        exitHref="/dashboard"
        exitLabel="Back to dashboard"
      />
    );
  }

  // Empty state: a topic with no authored questions yet.
  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card variant="glass-strong" padding="xl" className="text-center">
          <h1 className="text-2xl font-semibold text-fog-50 mb-2">
            Lesson coming soon
          </h1>
          <p className="text-fog-400 mb-6">
            Questions for this topic are being prepared. Try the diagnostic or
            another subject in the meantime.
          </p>
          <Button href="/dashboard" variant="primary" size="md">
            Back to dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Topbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
            {topicTag}
          </span>
          <h1 className="text-2xl font-semibold text-fog-50">{lessonTitle}</h1>
        </div>
        <a
          href="/dashboard"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-fog-300 transition-all"
          aria-label="Close lesson and return to dashboard"
        >
          <X className="h-5 w-5" />
        </a>
      </div>

      {/* Progress rail */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-fog-400">
            {complete
              ? "Complete"
              : `Question ${step + 1} of ${questions.length}`}
          </span>
          <span className="text-fog-500 font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-neon-400 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {complete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card variant="glass-strong" padding="xl" className="text-center">
              <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-neon-500/10 border-2 border-neon-400/40 glow-neon mb-6">
                <Check className="h-10 w-10 text-neon-400" />
              </div>
              <h2 className="text-3xl font-semibold text-fog-50 mb-2">
                Mastery check complete
              </h2>
              <p className="text-fog-400 mb-8">
                You scored {cappedScore} of {questions.length} —{" "}
                {mastery.toFixed(0)}% accuracy
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-semibold text-gradient-aurora">
                    {mastery >= 80
                      ? "Certified"
                      : mastery >= 50
                        ? "Training"
                        : "Locked"}
                  </div>
                  <div className="text-xs text-fog-500 mt-1">Topic state</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-semibold text-fog-100">
                    {cappedScore}/{questions.length}
                  </div>
                  <div className="text-xs text-fog-500 mt-1">Score</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-2xl font-semibold text-fog-100">+18 XP</div>
                  <div className="text-xs text-fog-500 mt-1">Earned</div>
                </div>
              </div>

              <Button href={nextHref} variant="primary" size="lg">
                {nextHref === "/dashboard"
                  ? "Back to dashboard"
                  : "Continue to next lesson"}
                <ChevronRight className="h-4 w-4" />
              </Button>

              {saveState !== "idle" && (
                <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-fog-500">
                  {saveState === "saving" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="h-3.5 w-3.5" />
                  )}
                  {saveState === "saving"
                    ? "Saving progress…"
                    : saveState === "saved"
                      ? "Progress saved to your child's record."
                      : "Progress shown locally — sign in and add a child to save it."}
                </p>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={`q-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="glass-strong" padding="xl">
              <div className="flex items-start justify-between mb-6">
                <Badge variant="violet" size="md">
                  Question {step + 1}
                </Badge>
                <button
                  onClick={handleListen}
                  disabled={audioLoading}
                  className="flex items-center gap-1.5 text-xs text-fog-400 hover:text-fog-100 transition-colors disabled:opacity-50"
                  aria-label="Listen to this question"
                >
                  {audioLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  Listen
                </button>
              </div>

              <h2 className="text-2xl font-semibold text-fog-50 mb-8 leading-snug">
                {question.prompt}
              </h2>

              {audioError && (
                <p className="-mt-4 mb-6 text-xs text-amber-400">{audioError}</p>
              )}

              <div className="mb-6">
                <InteractionRenderer
                  key={step}
                  ref={interactionRef}
                  options={question.options}
                  correctIndex={question.correctIndex}
                  interaction={interaction}
                  accent={accent}
                  reveal={submitted}
                  wasCorrect={wasCorrect}
                  onReadyChange={setReady}
                />
              </div>

              {/* Teaching Agent explanation with visible checker status */}
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-xl border mb-6",
                    isCorrect
                      ? "border-neon-400/30 bg-neon-500/5"
                      : "border-amber-400/30 bg-amber-500/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        isCorrect ? "text-neon-400" : "text-amber-400",
                      )}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-fog-300">
                          {isCorrect
                            ? "Correct"
                            : "Not quite — Teaching Agent says:"}
                        </p>
                        <CheckerBadge loading={tutorLoading} tutor={tutor} />
                      </div>
                      <p className="text-sm text-fog-200 leading-relaxed min-h-[1.25rem]">
                        {tutorLoading ? (
                          <span className="inline-flex items-center gap-2 text-fog-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            The Teaching Agent is preparing your explanation…
                          </span>
                        ) : (
                          (tutor?.explanation ?? question.explanation)
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-end gap-3">
                {!submitted ? (
                  <Button
                    onClick={handleSubmit}
                    variant="primary"
                    size="md"
                    disabled={!ready}
                  >
                    Submit answer
                  </Button>
                ) : (
                  <Button onClick={handleNext} variant="primary" size="md">
                    {isLast ? "Finish mastery check" : "Next question"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small status chip showing whether the explanation is AI-verified or human fallback. */
function CheckerBadge({
  loading,
  tutor,
}: {
  loading: boolean;
  tutor: TutorResponse | null;
}) {
  if (loading || !tutor) return null;

  if (tutor.aiVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-neon-400">
        <ShieldCheck className="h-3 w-3" />
        Checker verified · {Math.round(tutor.checker.confidence * 100)}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-400">
      <ShieldAlert className="h-3 w-3" />
      Human-authored fallback
    </span>
  );
}

/** Used when the network/agent is unavailable — guarantees a serveable result. */
function offlineTutor(explanation: string): TutorResponse {
  return {
    explanation,
    aiVerified: false,
    usedFallback: true,
    checker: { confidence: 0 },
  };
}
