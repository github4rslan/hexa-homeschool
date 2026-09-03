"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  Loader2,
  ArrowRight,
  Lightbulb,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { accentPreset } from "@/lib/child/accents";
import { useNarration } from "@/lib/child/use-narration";
import { buildExplainerNarration } from "@/lib/child/narration-copy";
import { cn } from "@/lib/utils";
import { StepReveal } from "./step-reveal";
import { GlossaryText } from "./glossary-text";
import { ExplainAnotherWay } from "./explain-another-way";
import {
  reexplainFromWorkedExample,
  reexplainFromSummary,
} from "@/lib/child/reexplain";
import type { WorkedExample } from "@/lib/child/worked-examples";
import type { GlossaryTerm } from "@/lib/child/glossary";
import { REVIEW_CHIP_TEXT } from "@/lib/child/review-framing";

/**
 * Explainer step (Brief: Daily Flow step 2). Phase-1 uses a clear written
 * explainer with natural-voice narration that auto-plays on appearance (Wave 4)
 * and a Play/Pause control to replay it. Big, calm, fully controllable.
 */
export function Explainer({
  title,
  summary,
  points,
  glossary,
  workedExample,
  onContinue,
  topic,
  voiceId,
  keyStage,
  accent: accentId,
  autoplay = true,
  tutorNote,
  isReview = false,
}: {
  title: string;
  summary: string;
  points: string[];
  /** Human-authored tap-to-define glossary for the explainer prose (F9). */
  glossary?: GlossaryTerm[];
  workedExample?: WorkedExample;
  onContinue: () => void;
  /** Curriculum topic tag — context for the checker-gated re-teach (F4). */
  topic?: string;
  /** Child-chosen narration voice; falls back to the server default when unset. */
  voiceId?: string | null;
  /** Child's UK key stage, used only as a narration pace hint. */
  keyStage?: number;
  /** Child-chosen accent preset id (drives the icon tile + play button). */
  accent?: string | null;
  /** Whether to auto-read the explainer on appearance (child preference). */
  autoplay?: boolean;
  /** A human tutor's note from a handoff session — shown warmly up top. */
  tutorNote?: string | null;
  /**
   * F3: true when this topic is already certified, so re-entering it is a
   * review, not a first-time lesson. Shows a small acknowledging chip instead
   * of implying this is new ground.
   */
  isReview?: boolean;
}) {
  if (workedExample) {
    return (
      <div className="mx-auto max-w-2xl">
        <TutorNote note={tutorNote} accent={accentId} />
        <ReviewChip show={isReview} />
        <StepReveal
          example={workedExample}
          onDone={onContinue}
          doneLabel="I'm ready - let's practise"
          voiceId={voiceId}
          keyStage={keyStage}
          accent={accentId}
          autoplay={autoplay}
          glossary={glossary}
        />
        {/* Calm, opt-in re-teach of the same worked example in fresh words,
            via the checker-gated /api/tutor pipeline (F4). */}
        <ExplainAnotherWay
          context={reexplainFromWorkedExample(workedExample)}
          topic={topic}
          keyStage={keyStage}
          voiceId={voiceId}
          accent={accentId}
        />
      </div>
    );
  }

  return (
    <LegacyExplainer
      title={title}
      summary={summary}
      points={points}
      glossary={glossary}
      onContinue={onContinue}
      topic={topic}
      voiceId={voiceId}
      keyStage={keyStage}
      accent={accentId}
      autoplay={autoplay}
      tutorNote={tutorNote}
      isReview={isReview}
    />
  );
}

/**
 * F3: a small, calm chip acknowledging a re-entered, already-certified
 * topic so a review never looks identical to earning it for the first time.
 * Purely presentational: no scoring/mastery logic reads this.
 */
function ReviewChip({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-fog-700 bg-fog-900/60 px-4 py-2 text-sm font-medium text-fog-300"
    >
      <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
      {REVIEW_CHIP_TEXT}
    </motion.p>
  );
}

/**
 * Warm "your tutor's tip" banner shown when a logged handoff session left a note
 * for this topic (Wave 7, Phase 4). Calm, accent-tinted, never clinical — it
 * frames the human help as encouragement, not a flag. Renders nothing when no
 * note exists, so every normal lesson is untouched.
 */
function TutorNote({ note, accent: accentId }: { note?: string | null; accent?: string | null }) {
  const trimmed = note?.trim();
  if (!trimmed) return null;
  const accent = accentPreset(accentId);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mb-5 flex items-start gap-3 rounded-3xl border p-5 text-lg leading-relaxed text-fog-100",
        accent.softBg,
        accent.softBorder,
      )}
      role="note"
    >
      <HeartHandshake className={cn("mt-0.5 h-6 w-6 shrink-0", accent.text)} aria-hidden />
      <span>
        <span className="mr-1 font-semibold text-fog-50">A tip from your tutor:</span>
        {trimmed}
      </span>
    </motion.div>
  );
}

function LegacyExplainer({
  title,
  summary,
  points,
  glossary,
  onContinue,
  topic,
  voiceId,
  keyStage,
  accent: accentId,
  autoplay,
  tutorNote,
  isReview = false,
}: {
  title: string;
  summary: string;
  points: string[];
  glossary?: GlossaryTerm[];
  onContinue: () => void;
  topic?: string;
  voiceId?: string | null;
  keyStage?: number;
  accent?: string | null;
  autoplay: boolean;
  tutorNote?: string | null;
  isReview?: boolean;
}) {
  const accent = accentPreset(accentId);
  const narration = useNarration(voiceId, keyStage);
  const narrationText = buildExplainerNarration({
    title,
    summary,
    points,
    keyStage,
  });
  const autoplayedRef = useRef(false);

  // Auto-read the explainer when it appears (once), if the child wants it.
  useEffect(() => {
    if (!autoplay || autoplayedRef.current) return;
    autoplayedRef.current = true;
    void narration.playText(narrationText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay]);

  function toggle() {
    void narration.toggle(narrationText);
  }
  const playing = narration.playing;
  const loading = narration.loading;

  return (
    <div className="mx-auto max-w-2xl">
      <TutorNote note={tutorNote} accent={accentId} />
      <ReviewChip show={isReview} />
      <div className="child-panel p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-3xl border",
                accent.bg,
                accent.border,
              )}
            >
              <Lightbulb className={cn("h-7 w-7", accent.text)} />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
                Today&apos;s lesson
              </span>
              <h1 className="text-3xl font-semibold text-fog-50 break-words">{title}</h1>
            </div>
          </div>
          <button
            onClick={toggle}
            disabled={loading}
            aria-label={playing ? "Pause narration" : "Play narration"}
            className={cn(
              "child-touch flex w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br text-white disabled:opacity-60",
              accent.gradient,
            )}
          >
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : playing ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7" />
            )}
          </button>
        </div>

        <p className="text-xl text-fog-200 leading-relaxed mb-6">
          <GlossaryText
            text={summary}
            glossary={glossary}
            voiceId={voiceId}
            keyStage={keyStage}
            accent={accentId}
          />
        </p>

        <ul className="flex flex-col gap-3 mb-8">
          {points.map((p, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 text-lg text-fog-100"
            >
              <span
                className={cn(
                  "mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  accent.bg,
                  accent.text,
                )}
              >
                {i + 1}
              </span>
              <GlossaryText
                text={p}
                glossary={glossary}
                voiceId={voiceId}
                keyStage={keyStage}
                accent={accentId}
              />
            </motion.li>
          ))}
        </ul>

        {/* Opt-in re-teach of the same summary in fresh words (F4). */}
        <ExplainAnotherWay
          context={reexplainFromSummary(title, summary, points)}
          topic={topic}
          keyStage={keyStage}
          voiceId={voiceId}
          accent={accentId}
        />

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => {
              narration.stop();
              onContinue();
            }}
            variant="child"
            size="child"
          >
            I&apos;m ready — let&apos;s practise
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
