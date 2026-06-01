"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Volume2, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logLessonCompletion } from "@/app/(dashboard)/lesson/actions";
import { cn } from "@/lib/utils";
import type { Question } from "@/components/lesson/lesson-player";

/**
 * Child-mode practice + mastery in one flow (Brief: Daily Flow steps 3–4).
 * Big options, max 3 attempts per question, encouraging copy, Teaching-Agent
 * hints, optional "Listen", and a celebratory mastery screen. 100% = certified
 * (persisted via logLessonCompletion). Children's Code: large, calm, no streaks.
 */

const MAX_ATTEMPTS = 3;
const PRAISE = ["Brilliant! 🎉", "You nailed it! ⭐", "Amazing work! 🚀", "Yes! 💪"];

export function PracticePlayer({
  questions,
  curriculumTopic,
  lessonTitle,
}: {
  questions: Question[];
  curriculumTopic: string;
  lessonTitle: string;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false); // show answer after 3 tries
  const [score, setScore] = useState(0);
  const [scoredThis, setScoredThis] = useState(false);

  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const startedAtRef = useRef<number>(Date.now());
  const loggedRef = useRef(false);
  const [saved, setSaved] = useState(false);

  const question = questions[step];
  const complete = step >= questions.length;
  const isCorrect = selected !== null && selected === question?.correctIndex;

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
  useEffect(() => cleanupAudio, [cleanupAudio]);

  // Persist once on completion.
  useEffect(() => {
    if (!complete || loggedRef.current || questions.length === 0) return;
    loggedRef.current = true;
    const timeSpentSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000),
    );
    void logLessonCompletion({
      topicTag: curriculumTopic,
      score,
      total: questions.length,
      timeSpentSeconds,
      hintsUsed: 0,
    })
      .then((r) => setSaved(r.persisted))
      .catch(() => setSaved(false));
  }, [complete, curriculumTopic, score, questions.length]);

  async function check() {
    if (selected === null || !question) return;
    const correct = selected === question.correctIndex;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);

    if (correct) {
      if (!scoredThis) {
        setScore((s) => s + 1);
        setScoredThis(true);
      }
      setRevealed(true);
      return;
    }

    // Wrong: fetch an encouraging hint from the Teaching Agent.
    setHintLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question.prompt,
          correctAnswer: question.explanation,
          topic: lessonTitle,
          studentAnswer: question.options[selected],
          wasCorrect: false,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { explanation: string };
        setHint(data.explanation);
      } else {
        setHint(question.explanation);
      }
    } catch {
      setHint(question.explanation);
    } finally {
      setHintLoading(false);
    }

    // After 3 attempts, reveal the answer and move on (no punitive tracking).
    if (nextAttempts >= MAX_ATTEMPTS) setRevealed(true);
  }

  function next() {
    cleanupAudio();
    setStep((s) => s + 1);
    setSelected(null);
    setAttempts(0);
    setRevealed(false);
    setHint(null);
    setScoredThis(false);
  }

  async function listen() {
    if (!question) return;
    if (audioRef.current) {
      void audioRef.current.play();
      return;
    }
    setAudioLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.prompt }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      audioRef.current = new Audio(url);
      await audioRef.current.play();
    } catch {
      /* narration is optional — silent fail */
    } finally {
      setAudioLoading(false);
    }
  }

  // ── Completion / mastery ──
  if (complete) {
    const pct = Math.round((score / questions.length) * 100);
    const mastered = pct >= 100;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="child-panel p-8 sm:p-12 text-center animate-child-pop">
          <div
            className={cn(
              "mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2",
              mastered
                ? "bg-neon-500/10 border-neon-400/50 glow-neon"
                : "bg-violet-500/10 border-violet-400/40",
            )}
          >
            <span className="text-6xl" aria-hidden>
              {mastered ? "🏆" : "🌟"}
            </span>
          </div>
          <h1 className="text-4xl font-semibold text-fog-50 mb-3">
            {mastered ? "Topic mastered!" : "Great effort!"}
          </h1>
          <p className="text-xl text-fog-300 mb-2">
            You got {score} out of {questions.length} right.
          </p>
          <p className="text-fog-400 mb-8">
            {mastered
              ? "You answered everything correctly — this topic is certified! 🎉"
              : "Keep going — you can master this topic next time."}
          </p>
          {saved && (
            <p className="mb-6 text-sm text-fog-500 inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Progress saved.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/learn" variant="child" size="child">
              Back to subjects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const attemptsLeft = MAX_ATTEMPTS - attempts;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-lg font-semibold text-fog-300">
          Question {step + 1} of {questions.length}
        </span>
        <button
          onClick={listen}
          disabled={audioLoading}
          className="child-touch inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-fog-200 hover:border-white/30 disabled:opacity-50"
        >
          {audioLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
          Listen
        </button>
      </div>

      <div className="child-panel p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-semibold text-fog-50 mb-8 leading-snug">
          {question.prompt}
        </h1>

        <div className="grid gap-4">
          {question.options.map((option, i) => {
            const chosen = selected === i;
            const showCorrect = revealed && i === question.correctIndex;
            const showWrong = revealed && chosen && i !== question.correctIndex;
            return (
              <motion.button
                key={i}
                onClick={() => !revealed && setSelected(i)}
                disabled={revealed}
                whileTap={{ scale: revealed ? 1 : 0.98 }}
                className={cn(
                  "child-touch flex items-center justify-between rounded-3xl border-2 px-6 text-left text-xl transition-all",
                  !revealed && chosen && "border-violet-400/70 bg-violet-500/15",
                  !revealed && !chosen && "border-white/10 bg-white/[0.03] hover:border-white/30",
                  showCorrect && "border-neon-400/70 bg-neon-500/15",
                  showWrong && "border-crimson-400/60 bg-crimson-500/10",
                  revealed && !showCorrect && !showWrong && "border-white/5 opacity-50",
                )}
              >
                <span className="text-fog-50">{option}</span>
                {showCorrect && <Check className="h-7 w-7 text-neon-400" />}
                {showWrong && <X className="h-7 w-7 text-crimson-400" />}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {(hint || hintLoading || revealed) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-6 rounded-3xl border p-5 text-lg",
                isCorrect
                  ? "border-neon-400/30 bg-neon-500/5 text-fog-100"
                  : "border-amber-400/30 bg-amber-500/5 text-fog-200",
              )}
            >
              {hintLoading ? (
                <span className="inline-flex items-center gap-2 text-fog-300">
                  <Loader2 className="h-5 w-5 animate-spin" /> Thinking of a hint…
                </span>
              ) : isCorrect ? (
                <span className="font-semibold">
                  {PRAISE[step % PRAISE.length]}
                </span>
              ) : (
                <span>{hint ?? question.explanation}</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {!revealed && !isCorrect && attempts > 0 && (
            <span className="text-base text-fog-400">
              {attemptsLeft} {attemptsLeft === 1 ? "try" : "tries"} left
            </span>
          )}
          <div className="ml-auto">
            {revealed ? (
              <Button onClick={next} variant="child" size="child">
                {step === questions.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={check}
                variant="child"
                size="child"
                disabled={selected === null || hintLoading}
              >
                Check answer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
