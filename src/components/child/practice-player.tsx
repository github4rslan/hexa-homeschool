"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Wind,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalmPause } from "@/components/child/calm-pause";
import { HandoffPause } from "@/components/child/handoff-pause";
import { Celebration } from "@/components/fx/celebration";
import { Interaction, type InteractionHandle } from "@/components/child/interaction";
import {
  logLessonCompletion,
  saveLessonProgressAction,
  clearLessonProgressAction,
  setNarrationAutoplayAction,
  triggerRemediationHandoffAction,
} from "@/app/(dashboard)/lesson/actions";
import {
  buildHintLadder,
  decideHelpSpine,
  distractorExplanation,
  pickMisconception,
  resolveResumeStep,
  clampResumeScore,
  type Interaction as InteractionDef,
  type SavedProgress,
} from "@/lib/child/interactions";
import {
  interpretSafetyResponse,
  type GuardOutcome,
} from "@/lib/safety/free-text-gate";
import { accentPreset, type AccentPreset } from "@/lib/child/accents";
import { classifyOptions } from "@/lib/child/animation-timeline";
import {
  applyTone,
  eddieCorrectLine,
  eddieWrongAnswerLine,
  pickTone,
  safeFirstName,
  shouldOfferBreak,
} from "@/lib/child/eddie-copy";
import { setCuesEnabled, tapCue } from "@/lib/child/sensory-cues";
import { useNarration } from "@/lib/child/use-narration";
import { useQuestionVisual } from "@/lib/child/use-question-visual";
import { MathVisual } from "@/components/child/math-visual";
import { deriveMathVisual } from "@/lib/child/math-visual";
import { ScienceVisual } from "@/components/child/science-visual";
import { deriveScienceVisual } from "@/lib/child/science-visual";
import { buildQuestionNarration } from "@/lib/child/narration-copy";
import dynamic from "next/dynamic";

// Lazy-mount the choreographed See-it player: its motion tree only downloads
// and mounts when a child actually opens it (60fps on low-end devices starts
// with not shipping unused animation code).
const TeachingAnimation = dynamic(
  () =>
    import("@/components/child/teaching-animation").then(
      (m) => m.TeachingAnimation,
    ),
  { ssr: false },
);
import {
  teachingAnimationNarration,
  validateTeachingAnimation,
  type TeachingAnimation as TeachingAnimationData,
} from "@/lib/child/teaching-animations";
import {
  decideRemediation,
  selectMasteryAttempt,
} from "@/lib/engine/remediation";
import {
  decideFeedback,
  type FeedbackResponse,
} from "@/lib/engine/feedback-matrix";
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
 * A real (but skippable) calm break — breathing circle + three slow breaths —
 * offered when the deterministic signals say the child needs one (Wave 8,
 * Phase 3, Feature 7). Never blocks the lesson: "I'm ready" carries straight
 * on. Reduced motion holds a still circle; nothing flashes.
 */
function BreathBreak({
  accent,
  name,
  onDone,
}: {
  accent: AccentPreset;
  name: string | null;
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mt-6 flex flex-col items-center gap-4 rounded-3xl border p-6 text-center",
        accent.softBg,
        accent.softBorder,
      )}
      role="status"
    >
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full border-2 motion-reduce:animate-none",
          accent.bg,
          accent.border,
        )}
      >
        <Wind className={cn("h-9 w-9", accent.text)} aria-hidden />
      </motion.div>
      <p className="max-w-md text-lg leading-relaxed text-fog-100">
        {name ? `${name}, your` : "Your"} brain is working hard. Stand up,
        stretch, and take three slow breaths with the circle.
      </p>
      <Button onClick={onDone} variant="child" size="child">
        I&apos;m ready
      </Button>
    </motion.div>
  );
}

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
  masteryQuestions,
  curriculumTopic,
  topicTitle,
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
  onPhaseChange,
}: {
  questions: Question[];
  /** Human-authored mastery bank for deterministic certification attempts. */
  masteryQuestions?: Question[];
  curriculumTopic: string;
  /** Human-readable topic title, for the warm handoff pause copy. */
  topicTitle?: string;
  /** Child-chosen narration voice; falls back to the server default when unset. */
  voiceId?: string | null;
  /** Child's UK key stage, used only as a narration pace hint. */
  keyStage?: number;
  /** Child-chosen accent preset id (threads colour through every surface). */
  accent?: string | null;
  /** Child's "read questions to me" preference (auto-narration default-on). */
  narrationAutoplay?: boolean;
  /** Child's "sounds & buzz" preference (gentle lesson cues; opt-out). */
  soundCues?: boolean;
  /** Picture-first / low-text mode — fewer words, icon-first controls. */
  lowText?: boolean;
  /** Today's emoji check-in (1-5; null = none) — tunes Eddie's tone only. */
  mood?: number | null;
  /** Server-synced mid-lesson progress (MongoDB) for a warm resume. */
  savedProgress?: SavedProgress | null;
  /** Child's first name, for the warm re-entry card. */
  firstName?: string;
  /** Per-child localStorage namespace for instant same-device resume. */
  resumeKey?: string;
  /**
   * Lifts the internal lesson sub-phase so the parent DailyFlow phase bar can
   * light a real "Mastery" segment (practice → mastery/reteach/handoff/complete).
   */
  onPhaseChange?: (
    phase: "practice" | "mastery" | "reteach" | "handoff" | "complete",
  ) => void;
}) {
  const accent: AccentPreset = accentPreset(accentId);
  // Eddie only ever uses a sanitised FIRST name — anything unusable degrades
  // to warm no-name phrasing (child-safety: no other personal data, ever).
  const childName = safeFirstName(firstName);
  const storageKey = `hexa_progress_${resumeKey ?? "anon"}_${curriculumTopic}`;
  const masteryBank = masteryQuestions?.length ? masteryQuestions : questions;

  const [step, setStep] = useState(0);
  const [lessonPhase, setLessonPhase] = useState<
    "practice" | "mastery" | "reteach" | "handoff" | "complete"
  >(questions.length ? "practice" : "mastery");
  const [masteryAttempt, setMasteryAttempt] = useState(1);
  // Surface the sub-phase so DailyFlow's phase bar can cross into "Mastery".
  useEffect(() => {
    onPhaseChange?.(lessonPhase);
  }, [lessonPhase, onPhaseChange]);
  const [usedMasteryIds, setUsedMasteryIds] = useState<string[]>([]);
  const [masterySet, setMasterySet] = useState<Question[]>(() =>
    selectMasteryAttempt(masteryBank, 1),
  );
  const [attempts, setAttempts] = useState(0);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false); // worked solution shown
  const [visualOpen, setVisualOpen] = useState(false);
  const [stepByStepOpen, setStepByStepOpen] = useState(false);
  const [outcome, setOutcome] = useState<"correct" | "incorrect" | null>(null);
  const [score, setScore] = useState(0);
  const [scoredThis, setScoredThis] = useState(false);
  const [lastMasteryScore, setLastMasteryScore] = useState(0);
  const missedThisAttemptRef = useRef<Question[]>([]);
  const reteachCacheRef = useRef<Map<string, string>>(new Map());
  const [reteachText, setReteachText] = useState<string | null>(null);
  const [reteachLoading, setReteachLoading] = useState(false);

  // Graduated help spine (Wave 8): misconception → method hint → the See-it
  // reveal. `hintRung` is the highest text rung shown (exclusive end);
  // `hintFloor` skips the generic nudge when the misconception carries rung 1.
  const [hintRung, setHintRung] = useState(0); // 0 = none shown yet
  const [hintFloor, setHintFloor] = useState(0);

  // Eddie's composed, answer-reactive line (Wave 8, Phase 3): second person,
  // first name, reacting to the exact option picked. Deterministic templates
  // only — on-rails per .claude/rules/child-safety.md.
  const [eddieLine, setEddieLine] = useState<string | null>(null);
  // The adaptive-matrix decision (careless / concept gap / language / attention).
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  // Optional richer reteach (concept gap) — Checker-gated `gpt-4o-mini`, cached
  // per question+band, degrading to the human-authored explanation.
  const [reteachInline, setReteachInline] = useState<string | null>(null);
  const [reteachInlineLoading, setReteachInlineLoading] = useState(false);
  // Distractor-aware "Why isn't that right?" (F2): a Checker-gated explanation
  // targeted at the EXACT wrong option the child chose, degrading to the
  // human-authored misconception / worked answer. Opt-in — never blocks the flow.
  const [whyNotText, setWhyNotText] = useState<string | null>(null);
  const [whyNotLoading, setWhyNotLoading] = useState(false);
  const [chosenWrongIndex, setChosenWrongIndex] = useState<number | null>(null);
  // Agentic "Explain it my way" (Wave 8, Phase 2): a Checker-PASSED tailored
  // animation that swaps into the See-it panel. Deterministic always shows
  // first; null = keep deterministic. Cached per question+band for the lesson.
  const [tailoredAnimation, setTailoredAnimation] =
    useState<TeachingAnimationData | null>(null);
  const [tailoredLoading, setTailoredLoading] = useState(false);
  const tailoredCacheRef = useRef<Map<string, TeachingAnimationData | null>>(
    new Map(),
  );
  // When this question first appeared — drives the matrix's time signals.
  const questionShownAtRef = useRef<number>(Date.now());
  // Clean first-try correct answers in a row (careless-slip signal).
  const correctStreakRef = useRef(0);

  // Pedagogical counters for the lesson log (NOT analytics).
  const attemptsTotalRef = useRef(0);
  const hintsTotalRef = useRef(0);
  // Calm-break signals (Feature 7): consecutive prior questions that needed
  // more than one try, and whether this question already offered a break.
  const missedQuestionStreakRef = useRef(0);
  const breakShownRef = useRef(false);
  const [breakOpen, setBreakOpen] = useState(false);

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

  const activeQuestions = lessonPhase === "practice" ? questions : masterySet;
  const question = activeQuestions[step];
  const complete = lessonPhase === "complete";
  const teachingAnimation = question?.teachingAnimation ?? null;
  // The animation the See-it panel actually plays: a Checker-passed tailored
  // one when available, else the deterministic/authored one — never neither.
  const activeAnimation = tailoredAnimation ?? teachingAnimation;
  const teachingNarration = activeAnimation
    ? teachingAnimationNarration(activeAnimation)
    : "";
  const narrationText = question
    ? buildQuestionNarration({
        prompt: question.prompt,
        options: question.options,
        keyStage,
      })
    : "";

  const interaction: InteractionDef = question
    ? question.interaction ?? { type: "mcq" }
    : { type: "mcq" };
  const isMcq = interaction.type === "mcq";
  const { visual: questionVisual, prefetch: prefetchQuestionVisual } =
    useQuestionVisual(question?.id, keyStage);
  // F2 — a deterministic, animated figure derived from the prompt shape
  // (fraction bar / percent grid). When present it replaces the AI PNG: clearer,
  // free, always present, with a real descriptive alt. Non-derivable ⇒ null ⇒
  // the AI image is used as the fallback.
  const mathVisual = useMemo(
    () => (question ? deriveMathVisual(question.prompt) : null),
    [question],
  );
  // B1 — a deterministic, honestly-described science figure (plant parts,
  // life-cycle ring, food chain, states of matter, cell). Derived from the topic
  // + prompt, it replaces the generic AI PNG for science questions so a sighted
  // child sees a concept-tied diagram and a screen-reader/narration child gets a
  // real description — closing the maths↔science consistency/a11y gap. Only used
  // when maths didn't derive; non-derivable ⇒ null ⇒ the AI image fallback.
  const scienceVisual = useMemo(
    () =>
      question && !mathVisual
        ? deriveScienceVisual(curriculumTopic, question.prompt)
        : null,
    [question, mathVisual, curriculumTopic],
  );

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

  // Push the child's "sounds & buzz" preference into the shared cue helper.
  useEffect(() => {
    setCuesEnabled(soundCues);
  }, [soundCues]);

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
    void narration.playText(narrationText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, narrationText, complete, revealed, autoplayOn]);

  // Warm the NEXT step's narration while the child works on this one, so the
  // first play after "Keep going" is instant (cached repeats are already free).
  // At most one prefetch; respects the preference and the route's rate-limit.
  useEffect(() => {
    if (!autoplayOn) return;
    const upcoming = activeQuestions[step + 1];
    if (upcoming) {
      narration.prefetch(
        buildQuestionNarration({
          prompt: upcoming.prompt,
          options: upcoming.options,
          keyStage,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, autoplayOn, activeQuestions]);

  // Generate/check the next visual while the child works on this question. The
  // hook caches results and keeps one in-flight request per next question.
  useEffect(() => {
    prefetchQuestionVisual(activeQuestions[step + 1]?.id);
  }, [prefetchQuestionVisual, activeQuestions, step]);

  useEffect(() => {
    if (teachingNarration) narration.prefetch(teachingNarration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachingNarration]);

  // Stamp when each question appears, so the adaptive matrix can read time-on-
  // question (a fast slip vs. a long, drifting pause). Pedagogical signal only.
  useEffect(() => {
    questionShownAtRef.current = Date.now();
  }, [step, lessonPhase]);

  // Multi-modal delivery: speak the adaptive feedback (matrix line + the
  // specific misconception) the moment it appears, so the support is voice +
  // visual + motion — never a silent wall of text. Respects the mute toggle and
  // degrades silently when TTS is unavailable. `feedback` changes identity per
  // miss, so this fires once per wrong answer.
  useEffect(() => {
    if (!feedback || !autoplayOn) return;
    // When a miss opens the reveal (See-it animation and/or the worked
    // walkthrough), let the reveal own the voice — don't speak the feedback
    // line over it. (With the single shared audio controller there is no
    // overlap either way; this just picks the more useful clip.)
    if (stepByStepOpen || visualOpen) return;
    // Eddie's composed line already folds in the misconception + the child's
    // name — one voice, one thought.
    void narration.playText(eddieLine ?? feedback.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback]);

  useEffect(() => {
    if (!outcome || outcome !== "correct" || !autoplayOn) return;
    void narration.playText(
      eddieCorrectLine(childName, pickTone({ wasCorrect: true, mood })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, autoplayOn]);

  // Resume once on mount: reconcile the server copy (props) with a same-device
  // localStorage copy (which may be a step ahead if a server write lagged), then
  // land at the exact saved step. Pure math via resolveResumeStep keeps this
  // honest: a content change, a fresh start, or a finished lesson all → no resume.
  useEffect(() => {
    if (resumeAppliedRef.current || questions.length === 0 || lessonPhase !== "practice") return;
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
      if (isMcq) {
        const match = matchSpokenOption(data.text, question?.options ?? []);
        if (match !== null) {
          setSpokenSelect(match);
          setSttNotice(null);
        } else {
          setSttNotice("Tap the answer that matches what you said.");
        }
      } else {
        // Fill-blank dictation (Phase 3): the processed transcript lands in
        // the first empty blank; a miss is a calm retry, never a hard fail.
        const applied =
          interactionRef.current?.applySpokenAnswer(data.text) ?? false;
        setSttNotice(
          applied ? null : "I couldn't quite catch it — say it again, or type it.",
        );
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
    if (!complete || loggedRef.current || masterySet.length === 0) return;
    loggedRef.current = true;
    const timeSpentSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000),
    );
    void logLessonCompletion({
      topicTag: curriculumTopic,
      score,
      total: masterySet.length,
      timeSpentSeconds,
      hintsUsed: hintsTotalRef.current,
    })
      .then((r) => setSaved(r.persisted))
      .catch(() => setSaved(false));
  }, [complete, curriculumTopic, score, masterySet.length]);

  /**
   * Scan free-text answers for distress (fill_blank only). Returns a gate
   * outcome: "frozen" (session frozen, calm pause shown), "clear" (safe to
   * score), or "unavailable" (could not confirm — the caller MUST NOT advance).
   * Child-safety rule 2: we fail SAFE, never open. One retry absorbs a transient
   * blip; a persistent failure blocks the submit rather than letting unverified
   * free text through.
   */
  async function guardFreeText(): Promise<GuardOutcome> {
    if (interaction.type !== "fill_blank") return "clear";
    const text = interactionRef.current?.answerText() ?? "";
    if (!text) return "clear";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/safety-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const body = (await res.json().catch(() => null)) as
          | { frozen?: boolean; message?: string }
          | null;
        const outcome = interpretSafetyResponse(res.ok, body);
        if (outcome === "frozen") {
          stopRecorder();
          narration.stop();
          setFrozen(body?.message ?? "");
          return "frozen";
        }
        if (outcome === "clear") return "clear";
        // "unavailable" — fall through to a single retry, then give up as blocked.
      } catch {
        /* network error — retry once, then fail safe below */
      }
    }
    return "unavailable";
  }

  /** Re-entry guard so a double-tap during the async distress gate can't score twice. */
  const checkingRef = useRef(false);

  async function check() {
    if (!ready || !question || revealed || outcome === "correct") return;
    if (checkingRef.current) return;
    tapCue();
    checkingRef.current = true;
    try {
      // Child-safety rule 2: on the only free-text surface (fill_blank), the
      // distress gate must resolve BEFORE any feedback is shown or the child can
      // advance — a match freezes the lesson first, not a beat later. Selection-
      // only types have no free text to scan, so they stay instant.
      if (interaction.type === "fill_blank") {
        const outcome = await guardFreeText();
        if (outcome === "frozen") return; // UI is now the calm pause
        if (outcome === "unavailable") {
          // Fail safe: we could not confirm the answer is clear, so we do NOT
          // score or advance. A gentle inline nudge, not a scary freeze.
          setSttNotice(
            "I couldn't check that just now — let's pause a moment and try again.",
          );
          return;
        }
      }
      runCheckCore();
    } finally {
      checkingRef.current = false;
    }
  }

  function runCheckCore() {
    if (!ready || !question || revealed || outcome === "correct") return;

    const correct = interactionRef.current?.isCorrect() ?? false;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    attemptsTotalRef.current += 1;

    if (correct) {
      setOutcome("correct");
      if (!scoredThis) {
        setScore((s) => s + 1);
        setScoredThis(true);
      }
      // A clean first-try correct extends the streak; needing retries breaks it.
      correctStreakRef.current = attempts === 0 ? correctStreakRef.current + 1 : 0;
      setRevealed(true);
      return;
    }

    setOutcome("incorrect");

    // Specific feedback: the human-authored line for the EXACT wrong option the
    // child picked (mcq only; deterministic, no API). Null ⇒ no targeted line.
    const selectedIndex = interactionRef.current?.selectedIndex() ?? null;
    // Remember the exact wrong option so "Why isn't that right?" (F2) can target it.
    setChosenWrongIndex(
      selectedIndex !== null && selectedIndex !== question.correctIndex
        ? selectedIndex
        : null,
    );
    const misconception = pickMisconception({
      misconceptions: question.misconceptions,
      selectedIndex,
      correctIndex: question.correctIndex,
    });

    // Adaptive matrix: pick the RESPONSE from deterministic signals (no AI).
    // Read the prior correct run, then break it — this question was missed.
    const priorCorrectStreak = correctStreakRef.current;
    correctStreakRef.current = 0;
    const decision = decideFeedback({
      attempts: nextAttempts,
      maxAttempts: MAX_ATTEMPTS,
      priorCorrectStreak,
      msOnQuestion: Date.now() - questionShownAtRef.current,
      hintsUsed: hintRung,
      sessionElapsedMs: Date.now() - startedAtRef.current,
      hasMisconceptionHint: misconception !== null,
    });
    setFeedback(decision);

    // Eddie reacts to the exact answer (Wave 8, Phase 3): the child's name,
    // second person, and what their specific pick tells us — e.g. the ± near
    // miss is "one of the two, can you spot the other?" — never generic,
    // never punitive. Deterministic templates only.
    const fate =
      selectedIndex !== null
        ? classifyOptions(question.options, question.correctIndex)[selectedIndex]
        : null;
    // Tone (Phase 3, F2): gentler on a tough-day check-in or a real struggle;
    // deterministic — today's self-reported mood only, no profiling.
    const tone = pickTone({ category: decision.category, mood });
    setEddieLine(
      applyTone(
        eddieWrongAnswerLine({
          name: childName,
          chosenOption:
            selectedIndex !== null ? question.options[selectedIndex] : null,
          fate: fate ?? null,
          misconception,
          baseMessage: decision.message,
        }),
        tone,
        keyStage,
      ),
    );

    // One graduated help spine: misconception (rung 1) → method hint (rung 2)
    // → the See-it reveal. Whether the misconception carries rung 1 is decided
    // on the FIRST miss and held, so the spine never flip-flops mid-question.
    const misconceptionCarriesRungOne =
      nextAttempts === 1 ? misconception !== null : hintFloor > 0;
    const spine = decideHelpSpine({
      attempts: nextAttempts,
      maxAttempts: MAX_ATTEMPTS,
      hasMisconception: misconceptionCarriesRungOne,
      ladderLength: hintLadder.length,
    });
    if (nextAttempts === 1) setHintFloor(spine.showFrom);
    setHintRung((r) => {
      const next = Math.max(r, spine.showTo);
      if (next > r) hintsTotalRef.current += next - r;
      return next;
    });

    // Endpoint of the ladder. Only the attempt cap reveals the answer + See-it
    // and moves on. A concept gap after 2 misses just surfaces the See-it
    // animation as extra help — the child still has a try, so we don't end it.
    if (spine.reveal) {
      openReveal();
    } else if (decision.escalateReteach && teachingAnimation && nextAttempts >= 2) {
      setVisualOpen(true);
    }

    // A real calm break when frustration or repeated misses are detected —
    // once per question, always skippable (Feature 7).
    if (
      !breakShownRef.current &&
      shouldOfferBreak({
        mood,
        category: decision.category,
        priorMissedQuestions: missedQuestionStreakRef.current,
        attemptsThisQuestion: nextAttempts,
      })
    ) {
      breakShownRef.current = true;
      setBreakOpen(true);
    }
  }

  /**
   * The reveal at the attempt cap — the child has used all their tries. Show the
   * correct answer (so they're never stranded) and open the See-it animation as
   * the resolution, then let them move on. (The old worked-solution walkthrough
   * was removed — the animation is now the payoff.)
   */
  function openReveal() {
    if (teachingAnimation) setVisualOpen(true);
    setRevealed(true);
  }

  function toggleTeachingVisual() {
    tapCue();
    const next = !visualOpen;
    setVisualOpen(next);
    if (!next) {
      narration.stop();
    }
  }

  // Eddie's steps fetch word timings with the audio (karaoke captions);
  // the same clip cache and /api/tts limits apply.
  const speakTeachingStep = useCallback(
    (text: string) => {
      if (autoplayOn) void narration.playCaptioned(text);
    },
    [autoplayOn, narration],
  );

  function resetStepState() {
    setAttempts(0);
    setReady(false);
    setRevealed(false);
    setVisualOpen(false);
    setOutcome(null);
    setScoredThis(false);
    setHintRung(0);
    setHintFloor(0);
    setEddieLine(null);
    setFeedback(null);
    setReteachInline(null);
    setReteachInlineLoading(false);
    setWhyNotText(null);
    setWhyNotLoading(false);
    setChosenWrongIndex(null);
    setTailoredAnimation(null);
    setTailoredLoading(false);
    setBreakOpen(false);
    setStepByStepOpen(false);
    setSpoken(null);
    setSpokenSelect(null);
    setSttNotice(null);
    narratedStepRef.current = null;
    silencedStepRef.current = null;
  }

  function startMasteryAttempt(attempt: number, priorUsedIds = usedMasteryIds) {
    const nextSet = selectMasteryAttempt(masteryBank, attempt, priorUsedIds);
    setMasteryAttempt(attempt);
    setMasterySet(nextSet);
    setLessonPhase("mastery");
    setStep(0);
    setScore(0);
    setReteachText(null);
    setReteachLoading(false);
    missedThisAttemptRef.current = [];
    resetStepState();
  }

  async function runReteach(missed: Question[]) {
    const target = missed[0];
    if (!target) {
      setReteachText(
        "Let's look at this another way. Read the worked answer, then try a fresh check.",
      );
      return;
    }

    const key = `${target.id}:${keyStage ?? "na"}`;
    const cached = reteachCacheRef.current.get(key);
    if (cached) {
      setReteachText(cached);
      return;
    }

    setReteachLoading(true);
    const fallback = `Let's look at this another way. ${target.explanation}`;
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: target.prompt,
          correctAnswer: target.options[target.correctIndex],
          topic: curriculumTopic,
          wasCorrect: false,
          keyStage,
        }),
      });
      const data = (await res.json()) as {
        explanation?: string;
        aiVerified?: boolean;
        frozen?: boolean;
        message?: string;
      };
      if (data.frozen) {
        // Match the other freeze paths: the calm pause must be silent.
        narration.stop();
        stopRecorder();
        setFrozen(data.message ?? "");
        return;
      }
      const text =
        res.ok && data.aiVerified && data.explanation
          ? data.explanation
          : fallback;
      reteachCacheRef.current.set(key, text);
      setReteachText(text);
    } catch {
      reteachCacheRef.current.set(key, fallback);
      setReteachText(fallback);
    } finally {
      setReteachLoading(false);
    }
  }

  /**
   * Distractor-aware "Why isn't that right?" (F2). Calls the existing
   * Checker-gated `/api/tutor` with the child's EXACT wrong option as
   * `studentAnswer`, so a passing explanation targets the specific mistake.
   * Child-safety: AI text is rendered ONLY when the Teaching Checker verified it
   * (`aiVerified`); otherwise `distractorExplanation` degrades to the
   * human-authored misconception line, then the worked explanation. A distress
   * match on any path freezes the lesson first. Opt-in + cached per option.
   */
  async function fetchWhyNot() {
    if (!question || whyNotLoading || chosenWrongIndex === null) return;
    tapCue();
    const chosen = question.options[chosenWrongIndex];
    const misconception = pickMisconception({
      misconceptions: question.misconceptions,
      selectedIndex: chosenWrongIndex,
      correctIndex: question.correctIndex,
    });
    const key = `whynot:${question.id}:${chosenWrongIndex}:${keyStage ?? "na"}`;
    const cached = reteachCacheRef.current.get(key);
    if (cached) {
      setWhyNotText(cached);
      return;
    }
    setWhyNotLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question.prompt,
          correctAnswer: question.options[question.correctIndex],
          topic: curriculumTopic,
          studentAnswer: chosen,
          wasCorrect: false,
          keyStage,
        }),
      });
      const data = (await res.json()) as {
        explanation?: string;
        aiVerified?: boolean;
        frozen?: boolean;
        message?: string;
      };
      if (data.frozen) {
        narration.stop();
        stopRecorder();
        setFrozen(data.message ?? "");
        return;
      }
      const text = distractorExplanation({
        aiExplanation: data.explanation,
        aiVerified: res.ok && data.aiVerified === true,
        misconception,
        workedExplanation: question.explanation,
      });
      reteachCacheRef.current.set(key, text);
      setWhyNotText(text);
    } catch {
      const text = distractorExplanation({
        aiVerified: false,
        misconception,
        workedExplanation: question.explanation,
      });
      reteachCacheRef.current.set(key, text);
      setWhyNotText(text);
    } finally {
      setWhyNotLoading(false);
    }
  }

  /**
   * Optional richer reteach for a concept gap, in-practice. Calls the existing
   * Checker-gated `/api/tutor` (AI text is served ONLY when `aiVerified`), caches
   * per question+band so a re-ask is free, and degrades to the human-authored
   * explanation when AI is unavailable or the Checker rejects it. Opt-in — the
   * child taps for it; it never auto-fires or streams raw model output.
   */
  async function fetchInlineReteach() {
    if (!question || reteachInlineLoading) return;
    const key = `${question.id}:${keyStage ?? "na"}`;
    const fallback = `Let's look at this another way. ${question.explanation}`;
    const cached = reteachCacheRef.current.get(key);
    if (cached) {
      setReteachInline(cached);
      return;
    }
    setReteachInlineLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question.prompt,
          correctAnswer: question.options[question.correctIndex],
          topic: curriculumTopic,
          wasCorrect: false,
          keyStage,
        }),
      });
      const data = (await res.json()) as {
        explanation?: string;
        aiVerified?: boolean;
        frozen?: boolean;
        message?: string;
      };
      if (data.frozen) {
        narration.stop();
        setFrozen(data.message ?? "");
        return;
      }
      const text =
        res.ok && data.aiVerified && data.explanation
          ? data.explanation
          : fallback;
      reteachCacheRef.current.set(key, text);
      setReteachInline(text);
    } catch {
      reteachCacheRef.current.set(key, fallback);
      setReteachInline(fallback);
    } finally {
      setReteachInlineLoading(false);
    }
  }

  /**
   * Agentic "Explain it my way" (Wave 8, Phase 2). The deterministic See-it
   * animation opens INSTANTLY; the Teaching Agent then generates a tailored
   * animation in the background and it swaps in only after passing the
   * Checker. On reject/error/rate-limit we quietly fall back to the
   * Checker-gated TEXT reteach — the child always gets help, never a wait,
   * never raw model output.
   */
  async function explainMyWay() {
    if (!question || tailoredLoading) return;
    tapCue();
    if (!teachingAnimation) {
      // No animation surface for this question — the text reteach is the help.
      await fetchInlineReteach();
      return;
    }
    setVisualOpen(true); // deterministic first, no wait

    const key = `${question.id}:${keyStage ?? "na"}`;
    const cached = tailoredCacheRef.current.get(key);
    if (cached !== undefined) {
      if (cached) setTailoredAnimation(cached);
      else await fetchInlineReteach();
      return;
    }

    setTailoredLoading(true);
    try {
      const selected = interactionRef.current?.selectedIndex() ?? null;
      const res = await fetch("/api/explain-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: question.prompt,
          correctAnswer: question.options[question.correctIndex],
          topic: curriculumTopic,
          keyStage,
          animationType: teachingAnimation.type,
          ...(selected !== null && question.options[selected]
            ? { studentAnswer: question.options[selected] }
            : {}),
        }),
      });
      const data = (await res.json()) as {
        animation?: unknown;
        aiVerified?: boolean;
        frozen?: boolean;
        message?: string;
      };
      if (data.frozen) {
        narration.stop();
        stopRecorder();
        setFrozen(data.message ?? "");
        return;
      }
      const animation =
        res.ok && data.aiVerified
          ? validateTeachingAnimation(data.animation)
          : null;
      tailoredCacheRef.current.set(key, animation);
      if (animation) {
        setTailoredAnimation(animation);
      } else {
        await fetchInlineReteach();
      }
    } catch {
      tailoredCacheRef.current.set(key, null);
      await fetchInlineReteach();
    } finally {
      setTailoredLoading(false);
    }
  }

  async function finishMasteryAttempt(missed: Question[]) {
    const finalScore = score;
    setLastMasteryScore(finalScore);
    const decision = decideRemediation({
      score: finalScore,
      total: masterySet.length,
      attempt: masteryAttempt,
    });

    if (decision === "certified") {
      setLessonPhase("complete");
      return;
    }

    const missedList = missed.length ? missed : masterySet;
    const nextUsed = [...usedMasteryIds, ...masterySet.map((q) => q.id)];
    setUsedMasteryIds(nextUsed);

    if (decision === "handoff") {
      await triggerRemediationHandoffAction({
        topicTag: curriculumTopic,
        attempts: masteryAttempt,
        missedPrompts: missedList.map((q) => q.prompt),
      });
      setLessonPhase("handoff");
      return;
    }

    setLessonPhase("reteach");
    setStep(0);
    resetStepState();
    await runReteach(missedList);
  }

  function next() {
    narration.stop();
    stopRecorder();
    // Track consecutive questions that needed more than one try (calm-break
    // signal only — the lesson log keeps the real pedagogical counters).
    missedQuestionStreakRef.current =
      scoredThis && attempts === 1 ? 0 : missedQuestionStreakRef.current + 1;
    breakShownRef.current = false;
    const nextStep = step + 1;
    const missed =
      lessonPhase === "mastery" && question && !scoredThis
        ? [...missedThisAttemptRef.current, question]
        : missedThisAttemptRef.current;
    missedThisAttemptRef.current = missed;

    if (nextStep >= activeQuestions.length) {
      if (lessonPhase === "practice") {
        clearProgress();
        startMasteryAttempt(1, []);
        return;
      }
      if (lessonPhase === "mastery") {
        void finishMasteryAttempt(missed);
        return;
      }
    } else if (lessonPhase === "practice") {
      persist(nextStep, score);
    }

    setStep(nextStep);
    setResumed(false);
    resetStepState();
  }

  /** Replay (or pause) the current question — the manual "Listen" control. */
  function listen() {
    if (!question) return;
    void narration.toggle(narrationText);
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
      if (question) void narration.playText(narrationText);
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

  if (lessonPhase === "handoff") {
    return (
      <HandoffPause
        variant="queued"
        topicTitle={topicTitle}
        firstName={firstName}
        accent={accentId}
      />
    );
  }

  if (lessonPhase === "reteach") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="child-panel p-8 sm:p-12 text-center animate-child-pop">
          <div
            className={cn(
              "mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2",
              accent.bg,
              accent.border,
            )}
          >
            <Lightbulb className={cn("h-11 w-11", accent.text)} aria-hidden />
          </div>
          <h1 className="mb-4 text-4xl font-semibold text-fog-50">
            Let&apos;s look at this another way
          </h1>
          <p className="mb-3 text-xl leading-relaxed text-fog-200">
            You got {lastMasteryScore} out of {masterySet.length}. That shows
            us exactly what to practise next.
          </p>
          <div
            className={cn(
              "my-6 rounded-3xl border p-5 text-left text-lg leading-relaxed text-fog-100",
              accent.softBg,
              accent.softBorder,
            )}
          >
            {reteachLoading
              ? "Getting a clearer explanation ready..."
              : reteachText}
          </div>
          <Button
            onClick={() => startMasteryAttempt(masteryAttempt + 1, usedMasteryIds)}
            variant="child"
            size="child"
            disabled={reteachLoading}
          >
            Try a fresh check
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Completion / mastery ──
  if (complete) {
    const pct = Math.round((score / masterySet.length) * 100);
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
            You got {score} out of {masterySet.length} right.
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
              <>
                <Button
                  href={`/learn/certificate?topic=${encodeURIComponent(curriculumTopic)}`}
                  variant="child"
                  size="child"
                >
                  Save my certificate
                </Button>
                <Button
                  href={`/learn/map?highlight=${encodeURIComponent(curriculumTopic)}`}
                  variant="secondary"
                  size="child"
                >
                  See it on my journey
                </Button>
              </>
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

      {/* Progress — slim accent-gradient bar, "N of M". Controls wrap under the
          label on narrow phones so nothing is clipped at 360px. */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-lg font-semibold text-fog-300">
            {lessonPhase === "mastery" ? `Mastery check ${masteryAttempt}: ` : ""}
            {step + 1} of {activeQuestions.length}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {speechSupported && (isMcq || interaction.type === "fill_blank") && (
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
                "child-touch inline-flex min-w-[64px] items-center justify-center rounded-2xl border px-4 text-base",
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
            animate={{ width: `${(step / activeQuestions.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <div className="child-panel p-6 sm:p-8">
        <div
          className={cn(
            "mb-8 grid gap-5",
            (mathVisual || scienceVisual || questionVisual) &&
              "lg:grid-cols-[1fr_220px] lg:items-start",
          )}
        >
          <h1 className="text-3xl sm:text-4xl font-semibold text-fog-50 leading-snug">
            {question.prompt}
          </h1>
          {(mathVisual || scienceVisual || questionVisual) && (
            <figure
              className={cn(
                "order-first overflow-hidden rounded-3xl border bg-white/[0.03] p-2 lg:order-none",
                accent.softBorder,
              )}
            >
              {mathVisual ? (
                // Deterministic, animated, always-present figure (F2).
                <MathVisual spec={mathVisual} accent={accent} />
              ) : scienceVisual ? (
                // Deterministic science figure (B1) — precise + honestly
                // described, replacing the generic AI PNG for science prompts.
                <ScienceVisual spec={scienceVisual} accent={accent} />
              ) : (
                // AI-generated only after automated Checker approval; no spinner
                // or fallback is shown when unavailable. B1: this generic
                // fallback carries no honest per-image description (its alt is a
                // fixed template), so it's rendered DECORATIVELY — assistive tech
                // and auto-narration skip it instead of reading meaningless
                // filler. (Derived figures above keep their real, honest alt.)
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={questionVisual!.url}
                  alt=""
                  role="presentation"
                  className="aspect-[3/2] w-full rounded-2xl object-contain"
                  loading="eager"
                  decoding="async"
                />
              )}
            </figure>
          )}
        </div>

        {/* "See it" unlocks only after 2 wrong answers (or once the answer has
            been revealed at the attempt cap) — the visual is a considered help,
            not a shortcut past thinking. */}
        {teachingAnimation && (attempts >= 2 || revealed) && (
          <div className="mb-6">
            <button
              type="button"
              onClick={toggleTeachingVisual}
              className={cn(
                "child-touch inline-flex items-center gap-2 rounded-2xl border px-4 text-base font-semibold transition-all",
                visualOpen
                  ? cn(accent.bg, accent.border, accent.text)
                  : "border-white/10 bg-white/[0.03] text-fog-200 hover:border-white/30 hover:bg-white/[0.06]",
              )}
            >
              <Eye className="h-5 w-5" />
              {visualOpen ? "Hide animation" : "See it"}
            </button>
            <AnimatePresence>
              {visualOpen && activeAnimation && (
                <TeachingAnimation
                  animation={activeAnimation}
                  accent={accent}
                  autoPlay
                  onSpeak={speakTeachingStep}
                  onStop={narration.stop}
                  options={question.options}
                  correctIndex={question.correctIndex}
                  speaking={narration.playing}
                  keyStage={keyStage}
                  caption={narration.caption}
                  getTime={narration.getTime}
                  childName={childName}
                  lowText={lowText}
                />
              )}
            </AnimatePresence>
          </div>
        )}

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

        {/* Specific & adaptive feedback (Wave 7, Phase 3) — the adaptive-matrix
            line (careless / concept gap / language / attention) plus the
            human-authored misconception for the exact wrong option, with an
            optional gentle movement break. Calm supportive slide-in (no red, no
            shake); accent-tinted and distinct from the hint ladder below. */}
        <AnimatePresence>
          {feedback && !isCorrect && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "mt-6 flex items-start gap-3 rounded-3xl border p-5 leading-relaxed",
                accent.bg,
                accent.border,
              )}
              role="status"
              aria-live="polite"
            >
              <Sparkles className={cn("mt-0.5 h-6 w-6 shrink-0", accent.text)} aria-hidden />
              <div className="min-w-0 text-lg text-fog-100">
                {/* Eddie's one composed, answer-reactive line — the name, the
                    exact pick and the misconception folded into a single warm
                    thought (never a stack of system messages). */}
                <p className="font-medium text-fog-50">
                  {eddieLine ?? feedback.message}
                </p>
                {feedback.suggestBreak && !breakOpen && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-base text-fog-200">
                    <Wind className={cn("h-5 w-5 shrink-0", accent.text)} aria-hidden />
                    Stand up, stretch, and take three slow breaths.
                  </p>
                )}

                {/* Distractor-aware "Why isn't that right?" (F2) — a
                    Checker-gated explanation aimed at the EXACT wrong option the
                    child picked, turning the error into a teachable moment.
                    Shown for mcq misses when the concept-gap reteach below isn't
                    already offered, so there's a single, calm AI-help affordance.
                    Opt-in (a tap), cached, degrades to the human-authored line. */}
                {isMcq &&
                  chosenWrongIndex !== null &&
                  !feedback.escalateReteach &&
                  (whyNotText ? (
                    <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-fog-100">
                      {whyNotText}
                    </p>
                  ) : (
                    <button
                      onClick={() => void fetchWhyNot()}
                      disabled={whyNotLoading}
                      className="child-touch mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
                    >
                      {whyNotLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      {whyNotLoading
                        ? "Looking at your answer…"
                        : "Why isn't that right?"}
                    </button>
                  ))}

                {/* Optional richer reteach (concept gap) — the agentic
                    "Explain it my way" path: deterministic See-it opens
                    instantly, a Checker-passed tailored animation swaps in,
                    and everything degrades to the Checker-gated text reteach
                    then the human-authored explanation. Opt-in, cached. */}
                {feedback.escalateReteach &&
                  (reteachInline ? (
                    <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-fog-100">
                      {reteachInline}
                    </p>
                  ) : (
                    <button
                      onClick={() => void explainMyWay()}
                      disabled={reteachInlineLoading || tailoredLoading}
                      className="child-touch mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60"
                    >
                      {reteachInlineLoading || tailoredLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      {reteachInlineLoading || tailoredLoading
                        ? "Making it just for you…"
                        : "Explain it my way"}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* A real calm break when the signals say so — skippable, never a
            dead end; the lesson waits exactly where the child left it. */}
        <AnimatePresence>
          {breakOpen && !isCorrect && (
            <BreathBreak
              key="breath-break"
              accent={accent}
              name={childName}
              onDone={() => {
                tapCue();
                setBreakOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Text rungs of the help spine (nudge → method) — muted accent tint,
            distinct from the answer. The answer itself is never a text rung;
            the See-it reveal delivers it. */}
        <AnimatePresence>
          {hintRung > hintFloor && !isCorrect && (
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
              {hintLadder.slice(hintFloor, hintRung).map((rung, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 text-lg text-fog-100"
                >
                  <Lightbulb className={cn("mt-1 h-5 w-5 shrink-0", accent.text)} />
                  <span>{rung}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {/* No "I'm stuck" button: the gentle text nudges surface on their own
              after a wrong answer, and "See it" unlocks after 2 misses. We just
              show how many tries remain. */}
          {!revealed && !isCorrect && attempts > 0 ? (
            <span className="text-base text-fog-400">
              {attemptsLeft} {attemptsLeft === 1 ? "try" : "tries"} left
            </span>
          ) : (
            <span />
          )}

          <div className="ml-auto">
            {revealed || isCorrect ? (
              <Button onClick={next} variant="child" size="child">
                {step === activeQuestions.length - 1
                  ? lessonPhase === "practice"
                    ? "Start mastery"
                    : "Finish"
                  : "Keep going"}
                <ArrowRight className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={check}
                variant="child"
                size="child"
                disabled={!ready || stepByStepOpen}
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
