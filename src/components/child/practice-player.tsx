"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Mic,
  Square,
  Loader2,
  Sparkles,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmPause } from "@/components/child/calm-pause";
import { Celebration } from "@/components/fx/celebration";
import { Interaction, type InteractionHandle } from "@/components/child/interaction";
import {
  logLessonCompletion,
  saveLessonProgressAction,
  clearLessonProgressAction,
  setNarrationAutoplayAction,
} from "@/app/(dashboard)/lesson/actions";
import {
  buildHintLadder,
  resolveResumeStep,
  clampResumeScore,
  type Interaction as InteractionDef,
  type SavedProgress,
} from "@/lib/child/interactions";
import { accentPreset, type AccentPreset } from "@/lib/child/accents";
import { useNarration } from "@/lib/child/use-narration";
import { cn } from "@/lib/utils";
import type { Question } from "@/components/lesson/lesson-player";

/**
 * Child-mode interactive practice + mastery (Features 1–2).
 *
 * Renders each step through the reusable <Interaction> (mcq / tap_reveal /
 * fill_blank / drag_drop), checks answers locally and instantly (<200ms), and
 * choreographs CALM feedback: correct = accent settle + rotating Celebration +
 * an encouraging line; incorrect = soft dim + a progressive hint ladder
 * (nudge → specific → full), up to 3 attempts then the worked solution. Never a
 * red flash, shake or buzzer. The child's accent drives every surface.
 *
 * Pedagogical state (attempts, hints) is persisted on the lesson log via the
 * repo layer — never analytics. Free-text answers are scanned by the distress
 * gate (/api/safety-check) before the child moves on.
 */

const MAX_ATTEMPTS = 3;
const PRAISE = ["Brilliant! 🎉", "You nailed it! ⭐", "Amazing work! 🚀", "Yes! 💪"];

/** Hard stop for spoken answers — they are sentences, not speeches. */
const MAX_RECORDING_MS = 15_000;

/**
 * Match a transcript to one of the options: "option b"/"b" picks by letter,
 * otherwise the longest option whose normalized text overlaps the transcript
 * wins. Null = let the child tap instead.
 */
function matchSpokenOption(transcript: string, options: string[]): number | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
  voiceId,
  keyStage,
  accent: accentId,
  narrationAutoplay = true,
  savedProgress,
  firstName,
  resumeKey,
}: {
  questions: Question[];
  curriculumTopic: string;
  /** Child-chosen narration voice; falls back to the server default when unset. */
  voiceId?: string | null;
  /** Child's UK key stage, used only as a narration pace hint. */
  keyStage?: number;
  /** Child-chosen accent preset id (threads colour through every surface). */
  accent?: string | null;
  /** Child's "read questions to me" preference (auto-narration default-on). */
  narrationAutoplay?: boolean;
  /** Server-synced mid-lesson progress (MongoDB) for a warm resume. */
  savedProgress?: SavedProgress | null;
  /** Child's first name, for the warm re-entry card. */
  firstName?: string;
  /** Per-child localStorage namespace for instant same-device resume. */
  resumeKey?: string;
}) {
  const accent: AccentPreset = accentPreset(accentId);
  const storageKey = `hexa_progress_${resumeKey ?? "anon"}_${curriculumTopic}`;

  const [step, setStep] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false); // worked solution shown
  const [outcome, setOutcome] = useState<"correct" | "incorrect" | null>(null);
  const [score, setScore] = useState(0);
  const [scoredThis, setScoredThis] = useState(false);

  // Progressive hint ladder (local, human-authored).
  const [hintRung, setHintRung] = useState(0); // 0 = none shown yet

  // Pedagogical counters for the lesson log (NOT analytics).
  const attemptsTotalRef = useRef(0);
  const hintsTotalRef = useRef(0);

  const interactionRef = useRef<InteractionHandle>(null);

  /** Safety freeze (child-safety rule 2): terminal — replaces the lesson UI. */
  const [frozen, setFrozen] = useState<string | null>(null);

  // Narration engine (auto-play + replay) over the existing /api/tts contract.
  const narration = useNarration(voiceId, keyStage);
  /** Live "read questions to me" preference; the in-lesson toggle updates it. */
  const [autoplayOn, setAutoplayOn] = useState(narrationAutoplay);
  /** Which step we've already auto-narrated, so re-renders don't replay it. */
  const narratedStepRef = useRef<number | null>(null);
  /** First answering gesture per step silences narration ("go quiet to think"). */
  const silencedStepRef = useRef<number | null>(null);

  // ── Speak-your-answer (STT) — mcq only ──
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [spoken, setSpoken] = useState<string | null>(null);
  const [sttNotice, setSttNotice] = useState<string | null>(null);
  const [spokenSelect, setSpokenSelect] = useState<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startedAtRef = useRef<number>(Date.now());
  const loggedRef = useRef(false);
  const [saved, setSaved] = useState(false);

  // ── Resume (Feature 3) ──
  const [resumed, setResumed] = useState(false);
  const resumeAppliedRef = useRef(false);

  const question = questions[step];
  const complete = step >= questions.length;

  const interaction: InteractionDef = question
    ? question.interaction ?? { type: "mcq" }
    : { type: "mcq" };
  const isMcq = interaction.type === "mcq";

  const hintLadder = question
    ? buildHintLadder({ hints: question.hints, explanation: question.explanation })
    : [];

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

  useEffect(() => {
    setSpeechSupported(
      typeof MediaRecorder !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia,
    );
  }, []);

  // Auto-narrate the prompt when a new step appears — read the question TO the
  // child, then go quiet. Once per step (a re-render won't replay it); skipped
  // while a step is revealed/answered. Sticky activation from the tap that
  // opened the lesson satisfies the browser autoplay policy; if the very first
  // clip is still blocked it fails silently and the "Listen" control remains.
  useEffect(() => {
    if (!autoplayOn || !question || complete || revealed) return;
    if (narratedStepRef.current === step) return;
    if (silencedStepRef.current === step) return;
    narratedStepRef.current = step;
    void narration.playText(question.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, question?.prompt, complete, revealed, autoplayOn]);

  // Warm the NEXT step's narration while the child works on this one, so the
  // first play after "Keep going" is instant (cached repeats are already free).
  // At most one prefetch; respects the preference and the route's rate-limit.
  useEffect(() => {
    if (!autoplayOn) return;
    const upcoming = questions[step + 1];
    if (upcoming) narration.prefetch(upcoming.prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoplayOn]);

  // Resume once on mount: reconcile the server copy (props) with a same-device
  // localStorage copy (which may be a step ahead if a server write lagged), then
  // land at the exact saved step. Pure math via resolveResumeStep keeps this
  // honest: a content change, a fresh start, or a finished lesson all → no resume.
  useEffect(() => {
    if (resumeAppliedRef.current || questions.length === 0) return;
    resumeAppliedRef.current = true;

    let local: SavedProgress | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const p = JSON.parse(raw) as Partial<SavedProgress>;
        if (
          typeof p.step === "number" &&
          typeof p.score === "number" &&
          typeof p.total === "number"
        ) {
          local = { step: p.step, score: p.score, total: p.total };
        }
      }
    } catch {
      /* corrupt localStorage is non-fatal */
    }

    // Choose whichever valid candidate is further along.
    const candidates = [savedProgress ?? null, local].filter(
      (c): c is SavedProgress =>
        resolveResumeStep(c, questions.length) !== null,
    );
    if (candidates.length === 0) {
      // Clear any stale (content-changed) local copy so it can't mislead later.
      if (local) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
      }
      return;
    }
    const best = candidates.reduce((a, b) => (b.step > a.step ? b : a));
    const resumeStep = resolveResumeStep(best, questions.length);
    if (resumeStep === null) return;

    setStep(resumeStep);
    setScore(clampResumeScore(best, resumeStep));
    setResumed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Persist the current position (localStorage instantly + MongoDB best-effort). */
  const persist = useCallback(
    (atStep: number, atScore: number) => {
      const payload: SavedProgress = {
        step: atStep,
        score: atScore,
        total: questions.length,
      };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        /* private mode / quota — server copy still saves */
      }
      void saveLessonProgressAction({
        topicTag: curriculumTopic,
        step: atStep,
        score: atScore,
        total: questions.length,
      }).catch(() => {});
    },
    [storageKey, curriculumTopic, questions.length],
  );

  const clearProgress = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    void clearLessonProgressAction(curriculumTopic).catch(() => {});
  }, [storageKey, curriculumTopic]);

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
      };
      if (data.frozen) {
        stopRecorder();
        narration.stop();
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
        setSpokenSelect(match);
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

  // Persist once on completion (attempts + hints come from the live counters).
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
      hintsUsed: hintsTotalRef.current,
    })
      .then((r) => setSaved(r.persisted))
      .catch(() => setSaved(false));
  }, [complete, curriculumTopic, score, questions.length]);

  /** Scan free-text answers for distress (fill_blank only). */
  async function guardFreeText(): Promise<boolean> {
    if (interaction.type !== "fill_blank") return false;
    const text = interactionRef.current?.answerText() ?? "";
    if (!text) return false;
    try {
      const res = await fetch("/api/safety-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { frozen?: boolean; message?: string };
      if (data.frozen) {
        stopRecorder();
        narration.stop();
        setFrozen(data.message ?? "");
        return true;
      }
    } catch {
      /* safety-check is best-effort; never block on a network error */
    }
    return false;
  }

  function check() {
    if (!ready || !question || revealed || outcome === "correct") return;

    const correct = interactionRef.current?.isCorrect() ?? false;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    attemptsTotalRef.current += 1;

    // Free-text gets a distress scan in the background — feedback stays instant.
    void guardFreeText();

    if (correct) {
      setOutcome("correct");
      if (!scoredThis) {
        setScore((s) => s + 1);
        setScoredThis(true);
      }
      setRevealed(true);
      return;
    }

    setOutcome("incorrect");
    // Surface the next hint rung automatically on a wrong try.
    setHintRung((r) => {
      const next = Math.min(r + 1, hintLadder.length);
      if (next > r) hintsTotalRef.current += 1;
      return next;
    });

    // After the final attempt, unfold the full worked solution.
    if (nextAttempts >= MAX_ATTEMPTS) {
      setHintRung(hintLadder.length);
      setRevealed(true);
    }
  }

  function showHint() {
    setHintRung((r) => {
      const next = Math.min(r + 1, hintLadder.length);
      if (next > r) hintsTotalRef.current += 1;
      return next;
    });
  }

  function next() {
    narration.stop();
    stopRecorder();
    const nextStep = step + 1;
    // Autosave the new position (or clear once the lesson is finished).
    if (nextStep >= questions.length) clearProgress();
    else persist(nextStep, score);

    setStep(nextStep);
    setResumed(false);
    setAttempts(0);
    setReady(false);
    setRevealed(false);
    setOutcome(null);
    setScoredThis(false);
    setHintRung(0);
    setSpoken(null);
    setSpokenSelect(null);
    setSttNotice(null);
  }

  /** Replay (or pause) the current question — the manual "Listen" control. */
  function listen() {
    if (!question) return;
    void narration.toggle(question.prompt);
  }

  /** First answering gesture on a step → go quiet so the child can think. */
  function onAnswerStart() {
    if (silencedStepRef.current === step) return;
    silencedStepRef.current = step;
    narration.stop();
  }

  /**
   * One-tap mute/unmute: flips "read questions to me", silences any current clip
   * when turning off, reads the current prompt when turning on, and persists the
   * preference (fire-and-forget). A child is never trapped in audio.
   */
  function toggleAutoplay() {
    const next = !autoplayOn;
    setAutoplayOn(next);
    if (next) {
      silencedStepRef.current = null;
      narratedStepRef.current = step;
      if (question) void narration.playText(question.prompt);
    } else {
      narration.stop();
    }
    void setNarrationAutoplayAction(next).catch(() => {});
  }

  // ── Safety freeze: replaces the entire lesson UI ──
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
                : cn(accent.bg, accent.border),
            )}
          >
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
            {mastered && (
              <Button
                href={`/learn/map?highlight=${encodeURIComponent(curriculumTopic)}`}
                variant="child"
                size="child"
              >
                See it on my journey
              </Button>
            )}
            <Button
              href="/learn"
              variant={mastered ? "secondary" : "child"}
              size="child"
            >
              Back to subjects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const isCorrect = outcome === "correct";
  // Hints not yet exhausted, still has tries, and not solved → can ask for more.
  const canHint =
    !revealed && !isCorrect && hintRung < hintLadder.length;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Warm re-entry — intentional, never a jarring flash back to the start. */}
      <AnimatePresence>
        {resumed && outcome === null && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "mb-5 flex items-center gap-3 rounded-3xl border p-4 text-lg text-fog-100",
              accent.softBg,
              accent.softBorder,
            )}
          >
            <Sparkles className={cn("h-5 w-5 shrink-0", accent.text)} />
            <span>
              {firstName ? `Welcome back, ${firstName}` : "Welcome back"} — let&apos;s
              pick up where you left off.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress — slim accent-gradient bar, "N of M". */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-semibold text-fog-300">
            {step + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-3">
            {speechSupported && isMcq && (
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
            {/* Always-reachable one-tap mute/unmute for auto-narration. */}
            <button
              onClick={toggleAutoplay}
              aria-pressed={!autoplayOn}
              aria-label={
                autoplayOn ? "Mute reading aloud" : "Unmute reading aloud"
              }
              className={cn(
                "child-touch inline-flex items-center justify-center rounded-2xl border px-4 text-base",
                autoplayOn
                  ? "border-white/10 bg-white/[0.03] text-fog-200 hover:border-white/30"
                  : "border-amber-400/40 bg-amber-500/10 text-amber-200",
              )}
            >
              {autoplayOn ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={listen}
              disabled={narration.loading}
              className="child-touch inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base text-fog-200 hover:border-white/30 disabled:opacity-50"
            >
              {narration.loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
              Listen
            </button>
          </div>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r", accent.bar)}
            initial={false}
            animate={{ width: `${(step / questions.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="child-panel p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-semibold text-fog-50 mb-8 leading-snug">
          {question.prompt}
        </h1>

        {/* The first answering gesture silences narration so it never plays
            over a child who is actively working. */}
        <div onPointerDownCapture={onAnswerStart} onKeyDownCapture={onAnswerStart}>
          <Interaction
            key={step}
            ref={interactionRef}
            options={question.options}
            correctIndex={question.correctIndex}
            interaction={interaction}
            accent={accent}
            reveal={revealed}
            wasCorrect={isCorrect}
            onReadyChange={setReady}
            forceMcqSelect={spokenSelect}
          />
        </div>

        {/* Spoken-answer feedback (mcq) */}
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

        {/* Progressive hints (muted accent tint, distinct from the answer) */}
        <AnimatePresence>
          {hintRung > 0 && !isCorrect && (
            <motion.div
              key="hints"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "mt-6 flex flex-col gap-3 rounded-3xl border p-5",
                accent.softBg,
                accent.softBorder,
              )}
            >
              {hintLadder.slice(0, hintRung).map((rung, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 text-lg text-fog-100"
                >
                  <Lightbulb className={cn("mt-1 h-5 w-5 shrink-0", accent.text)} />
                  <span>
                    {i === hintLadder.length - 1 && revealed ? (
                      <>
                        <span className="mr-1 font-semibold text-fog-50">
                          Here&apos;s how it works:
                        </span>
                        {rung}
                      </>
                    ) : (
                      rung
                    )}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Correct moment — encouraging line; the burst is non-blocking. */}
        <AnimatePresence>
          {isCorrect && (
            <motion.div
              key="correct"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 rounded-3xl border border-neon-400/30 bg-neon-500/5 p-5 text-lg text-fog-100"
            >
              <span className="relative inline-block font-semibold">
                <Celebration variant={step} />
                {PRAISE[step % PRAISE.length]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {canHint ? (
            <button
              onClick={showHint}
              className="inline-flex items-center gap-2 text-base text-fog-400 transition-colors hover:text-fog-200"
            >
              <Lightbulb className="h-5 w-5" />
              {hintRung === 0 ? "Show a hint" : "Another hint"}
            </button>
          ) : !revealed && !isCorrect && attempts > 0 ? (
            <span className="text-base text-fog-400">
              {attemptsLeft} {attemptsLeft === 1 ? "try" : "tries"} left
            </span>
          ) : (
            <span />
          )}

          <div className="ml-auto">
            {revealed || isCorrect ? (
              <Button onClick={next} variant="child" size="child">
                {step === questions.length - 1 ? "Finish" : "Keep going"}
                <ArrowRight className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={check}
                variant="child"
                size="child"
                disabled={!ready}
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
