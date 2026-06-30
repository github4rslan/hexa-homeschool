"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Loader2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { accentPreset } from "@/lib/child/accents";
import { useNarration } from "@/lib/child/use-narration";
import {
  visibleWorkedStepCount,
  workedExampleNarration,
  type WorkedExample,
} from "@/lib/child/worked-examples";
import { cn } from "@/lib/utils";

export function StepReveal({
  example,
  onDone,
  doneLabel = "I'm ready",
  voiceId,
  keyStage,
  accent: accentId,
  autoplay = true,
  className,
}: {
  example: WorkedExample;
  onDone?: () => void;
  doneLabel?: string;
  voiceId?: string | null;
  keyStage?: number;
  accent?: string | null;
  autoplay?: boolean;
  className?: string;
}) {
  const accent = accentPreset(accentId);
  const reducedMotion = useReducedMotion();
  const narration = useNarration(voiceId, keyStage);
  const narrationSteps = useMemo(() => workedExampleNarration(example), [example]);
  const [currentStep, setCurrentStep] = useState(0);
  const autoplayedRef = useRef<string | null>(null);
  const totalSteps = example.steps.length;
  const visibleCount = visibleWorkedStepCount({
    currentStep,
    totalSteps,
    reducedMotion: reducedMotion ?? false,
  });
  const finished = currentStep >= totalSteps - 1 || !!reducedMotion;
  const currentNarration = narrationSteps[Math.min(currentStep, totalSteps - 1)] ?? "";

  useEffect(() => {
    if (!autoplay || reducedMotion || !currentNarration) return;
    if (autoplayedRef.current === currentNarration) return;
    autoplayedRef.current = currentNarration;
    void narration.playText(currentNarration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, currentNarration, reducedMotion]);

  function back() {
    narration.stop();
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function next() {
    narration.stop();
    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1));
  }

  function replay() {
    if (!currentNarration) return;
    void narration.playText(currentNarration);
  }

  function toggle() {
    if (!currentNarration) return;
    void narration.toggle(currentNarration);
  }

  return (
    <div className={cn("child-panel p-6 sm:p-8", className)}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-sm font-mono uppercase tracking-widest text-fog-500">
            Worked example
          </span>
          <h2 className="mt-1 text-2xl font-semibold leading-tight text-fog-50">
            {example.title}
          </h2>
          {example.scenario && (
            <p className="mt-3 text-lg leading-relaxed text-fog-200">
              {example.scenario}
            </p>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={narration.loading || !!reducedMotion}
          aria-label={narration.playing ? "Pause step narration" : "Play step narration"}
          className={cn(
            "child-touch flex w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br text-white disabled:opacity-50",
            accent.gradient,
          )}
        >
          {narration.loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : narration.playing ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </button>
      </div>

      <ol className="mb-6 flex flex-col gap-3">
        {example.steps.slice(0, visibleCount).map((step, index) => (
          <motion.li
            key={`${index}-${step.line}`}
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "rounded-3xl border p-4",
              index === currentStep || reducedMotion
                ? cn(accent.softBg, accent.softBorder)
                : "border-white/10 bg-white/[0.03]",
            )}
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  accent.bg,
                  accent.text,
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-relaxed text-fog-100">{step.line}</p>
                {step.visual && (
                  <div className="mt-3 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <Lightbulb className={cn("h-5 w-5 shrink-0", accent.text)} />
                    <span className="text-sm text-fog-400">{step.visual.label}</span>
                    <span className="text-base font-semibold text-fog-100">
                      {step.visual.value}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.li>
        ))}
      </ol>

      {finished && example.yourTurn && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          className={cn(
            "mb-6 rounded-3xl border p-5 text-lg leading-relaxed text-fog-100",
            accent.bg,
            accent.border,
          )}
        >
          <span className="mr-2 font-semibold text-fog-50">Your turn:</span>
          {example.yourTurn}
        </motion.div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={back}
            disabled={currentStep === 0 || !!reducedMotion}
            aria-label="Back one step"
            className="child-touch inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-fog-200 disabled:opacity-40"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={replay}
            disabled={narration.loading || !!reducedMotion}
            aria-label="Replay this step"
            className="child-touch inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-fog-200 disabled:opacity-40"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {finished ? (
          <Button
            onClick={() => {
              narration.stop();
              onDone?.();
            }}
            variant="child"
            size="child"
          >
            {doneLabel}
            <ArrowRight className="h-6 w-6" />
          </Button>
        ) : (
          <Button onClick={next} variant="child" size="child">
            Next step
            <ArrowRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
