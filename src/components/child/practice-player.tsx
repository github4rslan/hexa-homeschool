"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Volume2, Mic, Square, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmPause } from "@/components/child/calm-pause";
import { Celebration } from "@/components/fx/celebration";
import { logLessonCompletion } from "@/app/(dashboard)/lesson/actions";
import { fetchJsonWithRetry } from "@/lib/fetch-with-retry";
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

/** Hard stop for spoken answers — they are sentences, not speeches. */
const MAX_RECORDING_MS = 15_000;

/**
 * Match a transcript to one of the options: "option b"/"b" picks by letter,
 * otherwise the longest option whose normalized text contains (or is
 * contained by) the transcript wins. Null = let the child tap instead.
 */
function matchSpokenOption(transcript: string, options: string[]): number | null {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const t = norm(transcript);
  if (!t) return null;

  const letter = t.match(/^(?:option\s+)?([a-d])$/);
  if (letter) {
    const i = letter[1].charCodeAt(0) - 97;
    return i < options.length ? i : null;
  }

  let best: number | null = null;
  let bestLen = 0;
  options.forEach((option, i) => {
    const o = norm(option);
    if (o.length < 2) return;
    if ((t.includes(o) || o.includes(t)) && o.length > bestLen) {
      best = i;
      bestLen = o.length;
    }
  });
  return best;
}

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

  /**
   * Safety freeze (child-safety rule 2): once /api/tutor or /api/stt returns
   * frozen, the session is over — the calm-pause screen replaces the lesson
   * and nothing below can un-set this.
   */
  const [frozen, setFrozen] = useState<string | null>(null);

  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // ── Speak-your-answer (STT) ──
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  /** What the child said, shown back and sent to /api/tutor as studentAnswer. */
  const [spoken, setSpoken] = useState<string | null>(null);
  const [sttNotice, setSttNotice] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const stopRecorder = useCallback(() => {
    if (recordTimerRef.current) {
      clearTimeout(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);
  useEffect(() => stopRecorder, [stopRecorder]);

  // Mic support is browser-only; decide after mount to avoid hydration drift.
  useEffect(() => {
    setSpeechSupported(
      typeof MediaRecorder !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  async function transcribe(blob: Blob) {
    setSttLoading(true);
    setSttNotice(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = (await res.json()) as {
        text?: string;
        frozen?: boolean;
        message?: string;
        error?: string;
      };
      if (data.frozen) {
        stopRecorder();
        cleanupAudio();
        setFrozen(data.message ?? "");
        return;
      }
      if (!res.ok || typeof data.text !== "string" || !data.text) {
        setSttNotice("I couldn't hear that — have another go, or tap your answer.");
        return;
      }
      setSpoken(data.text);
      const match = matchSpokenOption(data.text, question?.options ?? []);
      if (match !== null) {
        setSelected(match);
        setSttNotice(null);
      } else {
        setSttNotice("Tap the answer that matches what you said.");
      }
    } catch {
      setSttNotice("I couldn't hear that — have another go, or tap your answer.");
    } finally {
      setSttLoading(false);
    }
  }

  async function toggleSpeak() {
    if (recording) {
      stopRecorder();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        // The mic is released the moment recording ends; audio only ever
        // lives in this blob until /api/stt has answered.
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 0) void transcribe(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      setSttNotice(null);
      recordTimerRef.current = setTimeout(stopRecorder, MAX_RECORDING_MS);
    } catch {
      setSttNotice("I couldn't reach your microphone — tap your answer instead.");
    }
  }

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

    // Wrong: fetch an encouraging hint from the Teaching Agent (cold-start tolerant).
    setHintLoading(true);
    try {
      const data = await fetchJsonWithRetry<{
        explanation: string;
        frozen?: boolean;
        message?: string;
      }>(
        "/api/tutor",
        {
          prompt: question.prompt,
          correctAnswer: question.explanation,
          topic: lessonTitle,
          // Prefer the child's own words: the distress gate in /api/tutor
          // must scan what they actually said, not the option label.
          studentAnswer: spoken ?? question.options[selected],
          wasCorrect: false,
        },
        { timeoutMs: 25000, retries: 1 },
      );
      if (data.frozen) {
        stopRecorder();
        cleanupAudio();
        setFrozen(data.message ?? "");
        return;
      }
      setHint(data.explanation);
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
    stopRecorder();
    setStep((s) => s + 1);
    setSelected(null);
    setAttempts(0);
    setRevealed(false);
    setHint(null);
    setScoredThis(false);
    setSpoken(null);
    setSttNotice(null);
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

  // ── Safety freeze: replaces the entire lesson UI, checked before anything ──
  if (frozen !== null) {
    return (
      <CalmPause
        message={frozen}
        exitHref="/learn"
        exitLabel="Back to my subjects"
      />
    );
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
              "relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2",
              mastered
                ? "bg-neon-500/10 border-neon-400/50 glow-neon"
                : "bg-violet-500/10 border-violet-400/40",
            )}
          >
            {/* The one BIG moment — certification earns the full burst. */}
            {mastered && <Celebration variant={1} big />}
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
        <div className="flex items-center gap-3">
          {speechSupported && (
            <button
              onClick={toggleSpeak}
              disabled={sttLoading || revealed}
              className={cn(
                "child-touch inline-flex items-center gap-2 rounded-2xl border px-4 text-base disabled:opacity-50",
                recording
                  ? "border-crimson-400/60 bg-crimson-500/10 text-crimson-300 animate-pulse"
                  : "border-white/10 bg-white/[0.03] text-fog-200 hover:border-white/30",
              )}
            >
              {sttLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : recording ? (
                <Square className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              {recording ? "Done" : "Speak"}
            </button>
          )}
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
                  // A wrong pick gently dims — never a red flash or shake.
                  showWrong && "border-white/10 bg-white/[0.02] opacity-60",
                  revealed && !showCorrect && !showWrong && "border-white/5 opacity-50",
                )}
              >
                <span className="text-fog-50">{option}</span>
                {showCorrect && <Check className="h-7 w-7 text-neon-400" />}
                {showWrong && <X className="h-7 w-7 text-fog-400" />}
              </motion.button>
            );
          })}
        </div>

        {/* Spoken-answer feedback */}
        {(spoken || sttNotice) && !revealed && (
          <p className="mt-5 text-base text-fog-400">
            {spoken && (
              <>
                I heard: <span className="text-fog-200">&ldquo;{spoken}&rdquo;</span>
                {sttNotice && " — "}
              </>
            )}
            {sttNotice}
          </p>
        )}

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
                <span className="relative inline-block font-semibold">
                  {/* Fires only after the answer; varies so it never feels mechanical. */}
                  <Celebration variant={step} />
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
