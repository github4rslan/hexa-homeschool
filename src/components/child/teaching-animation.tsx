"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  StepForward,
  WandSparkles,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";
import {
  stepNarration,
  type TeachingAnimation as TeachingAnimationData,
  type TeachingAnimationStep,
} from "@/lib/child/teaching-animations";

const STEP_MS = 4600;

function splitExpression(expression: string): string[] {
  const tokens: string[] = [];
  const pattern = /sqrt\([^)]+\)|\+\/-|[A-Za-z0-9]+\^2|[A-Za-z0-9]+|=|[()+\-*/]/g;
  for (const match of expression.matchAll(pattern)) {
    tokens.push(match[0]);
  }
  return tokens;
}

function MathToken({ token }: { token: string }) {
  if (token === "+/-") {
    return <>{String.fromCharCode(177)}</>;
  }

  const square = token.match(/^([a-zA-Z0-9]+)\^2$/);
  if (square) {
    return (
      <>
        {square[1]}
        <sup className="ml-0.5 align-super text-[0.55em]">2</sup>
      </>
    );
  }

  const root = token.match(/^sqrt\((.+)\)$/);
  if (root) {
    return (
      <>
        {String.fromCharCode(8730)}
        <span className="border-t-2 border-current pl-1">{root[1]}</span>
      </>
    );
  }

  if (token === "sqrt") return <>{String.fromCharCode(8730)}</>;
  return <>{token}</>;
}

function CoachBadge({
  line,
  accent,
}: {
  line: string;
  accent: AccentPreset;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <motion.div
        animate={{ y: [0, -4, 0], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          accent.bg,
          accent.border,
        )}
      >
        <WandSparkles className={cn("h-5 w-5", accent.text)} aria-hidden />
      </motion.div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-fog-500">
          Eddie, your Edway coach
        </div>
        <p className="mt-1 text-base leading-relaxed text-fog-100">{line}</p>
      </div>
    </div>
  );
}

function EquationStage({
  step,
  index,
  accent,
}: {
  step: TeachingAnimationStep;
  index: number;
  accent: AccentPreset;
}) {
  const tokens = splitExpression(step.expression);
  const isBalance = step.label.toLowerCase().includes("balance");
  const isRoot = step.label.toLowerCase().includes("root");
  const isAnswer = step.label.toLowerCase().includes("answer");

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-void/35 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-fog-500">
          Step {index + 1}
        </span>
        <span className={cn("text-sm font-semibold", accent.text)}>
          {step.label}
        </span>
      </div>

      <div className="relative min-h-[11rem] rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        <div className="absolute inset-x-6 top-1/2 h-px bg-white/10" />
        {isBalance && (
          <>
            {["left", "right"].map((side, sideIndex) => (
              <motion.div
                key={side}
                initial={{ y: -58, opacity: 0, scale: 0.85 }}
                animate={{ y: -28, opacity: [0, 1, 1, 0.85], scale: 1 }}
                transition={{
                  duration: 1.2,
                  delay: sideIndex * 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "absolute top-1/2 rounded-2xl border px-3 py-1 text-lg font-bold",
                  side === "left" ? "left-[24%]" : "right-[24%]",
                  accent.bg,
                  accent.border,
                  accent.text,
                )}
              >
                {step.focus}
              </motion.div>
            ))}
          </>
        )}
        {isRoot && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55 }}
            className="absolute inset-x-0 top-4 text-center text-base font-semibold uppercase tracking-wider text-cyan-200"
          >
            square root both sides
          </motion.div>
        )}

        <motion.div
          key={step.expression}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex min-h-[7.5rem] flex-wrap items-center justify-center gap-2 text-center"
        >
          {tokens.map((token, tokenIndex) => {
            const focus =
              step.focus &&
              token.toLowerCase().includes(step.focus.toLowerCase());
            return (
              <motion.span
                key={`${token}-${tokenIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: tokenIndex * 0.05, duration: 0.25 }}
                className={cn(
                  "rounded-2xl px-2 py-1 text-4xl font-bold leading-none sm:text-5xl",
                  focus
                    ? cn(accent.bg, accent.text, "shadow-lg")
                    : "text-fog-50",
                  token === "=" && "text-cyan-200",
                )}
              >
                <MathToken token={token} />
              </motion.span>
            );
          })}
        </motion.div>

        {isAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
            className="mt-3 flex justify-center gap-3"
          >
            <span className="rounded-2xl border border-neon-400/30 bg-neon-500/10 px-4 py-2 text-xl font-semibold text-neon-200">
              positive
            </span>
            <span className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xl font-semibold text-cyan-200">
              negative
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StrategyStage({
  step,
  index,
  accent,
  type,
}: {
  step: TeachingAnimationStep;
  index: number;
  accent: AccentPreset;
  type: TeachingAnimationData["type"];
}) {
  const isScience = type === "science_sequence";
  const isGrammar = type === "grammar_highlight";
  const items = useMemo(
    () =>
      cleanStageWords(step.expression)
        .slice(0, 10)
        .map((word, i) => ({ word, active: i === index || word === step.focus })),
    [step.expression, step.focus, index],
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-fog-500">
          {step.label}
        </span>
        <span className={cn("text-sm font-semibold", accent.text)}>
          Step {index + 1}
        </span>
      </div>

      {isScience ? (
        <div className="relative mb-5 h-28 rounded-3xl border border-white/10 bg-void/35">
          {[0, 1, 2, 3, 4].map((dot) => (
            <motion.span
              key={dot}
              animate={{
                x: [20, 120, 220, 320],
                y: [34 + dot * 9, 18 + dot * 6, 52 - dot * 3, 34 + dot * 5],
                opacity: [0.3, 1, 0.75, 0.3],
              }}
              transition={{
                duration: 2.8,
                delay: dot * 0.18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={cn(
                "absolute left-0 top-0 h-3 w-3 rounded-full",
                dot % 2 ? "bg-cyan-300" : "bg-neon-300",
              )}
            />
          ))}
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap gap-2">
          {items.map((item, itemIndex) => (
            <motion.span
              key={`${item.word}-${itemIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: itemIndex * 0.06 }}
              className={cn(
                "rounded-2xl border px-3 py-2 text-xl font-semibold",
                item.active || isGrammar
                  ? cn(accent.bg, accent.border, "text-fog-50")
                  : "border-white/10 bg-white/[0.03] text-fog-300",
              )}
            >
              {item.word}
            </motion.span>
          ))}
        </div>
      )}

      <motion.div
        key={step.note}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-void/30 p-4"
      >
        <div className="text-2xl font-semibold text-fog-50">
          {step.expression}
        </div>
        <p className="mt-2 text-lg leading-relaxed text-fog-200">{step.note}</p>
      </motion.div>
    </div>
  );
}

function cleanStageWords(value: string): string[] {
  return value
    .replace(/[^\w\s+-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function TeachingAnimation({
  animation,
  accent,
  autoPlay = false,
  onSpeak,
  onStop,
}: {
  animation: TeachingAnimationData;
  accent: AccentPreset;
  autoPlay?: boolean;
  onSpeak?: (text: string) => void;
  onStop?: () => void;
}) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const speakRef = useRef(onSpeak);
  const stopRef = useRef(onStop);
  const step = animation.steps[current] ?? animation.steps[0];
  const total = animation.steps.length;

  useEffect(() => {
    speakRef.current = onSpeak;
    stopRef.current = onStop;
  }, [onSpeak, onStop]);

  useEffect(() => {
    setCurrent(0);
    setPlaying(false);
  }, [animation, autoPlay, reduced]);

  const speak = useCallback(
    (index = current) => {
      const target = animation.steps[index];
      if (target) speakRef.current?.(stepNarration(target));
    },
    [animation.steps, current],
  );

  useEffect(() => {
    if (!playing || reduced) return;
    const timer = window.setTimeout(() => {
      if (current >= total - 1) {
        setPlaying(false);
        return;
      }
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      speak(nextIndex);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, current, total, reduced, speak]);

  function play() {
    const nextIndex = current >= total - 1 ? 0 : current;
    if (nextIndex !== current) setCurrent(nextIndex);
    setPlaying(true);
    speak(nextIndex);
  }

  function pause() {
    setPlaying(false);
    stopRef.current?.();
  }

  function replay() {
    setCurrent(0);
    setPlaying(true);
    speak(0);
  }

  function next() {
    const nextIndex = Math.min(total - 1, current + 1);
    setPlaying(false);
    setCurrent(nextIndex);
    speak(nextIndex);
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mt-6 overflow-hidden rounded-3xl border p-5",
        accent.softBg,
        accent.softBorder,
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
            accent.bg,
            accent.border,
          )}
        >
          <Sparkles className={cn("h-5 w-5", accent.text)} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-fog-50">
            {animation.title}
          </h2>
          <p className="mt-1 max-w-xl text-base leading-relaxed text-fog-300">
            {animation.intro}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playing ? pause : play}
          className={cn(
            "inline-flex min-h-12 items-center gap-2 rounded-2xl border px-4 text-base font-semibold transition-all hover:brightness-110",
            accent.bg,
            accent.border,
            accent.text,
          )}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => speak()}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.06]"
        >
          <Volume2 className="h-5 w-5" />
          Hear step
        </button>
        <button
          type="button"
          onClick={next}
          disabled={current >= total - 1}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-40"
        >
          <StepForward className="h-5 w-5" />
          Next
        </button>
        <button
          type="button"
          onClick={replay}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.06]"
        >
          <RotateCcw className="h-5 w-5" />
          Replay
        </button>
        <span className="ml-auto whitespace-nowrap text-sm font-semibold text-fog-400">
          Step {current + 1} of {total}
        </span>
      </div>

      <div className="mb-4">
        <CoachBadge line={animation.coachLine} accent={accent} />
      </div>

      <div className="mb-4 flex gap-2">
        {animation.steps.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              setPlaying(false);
              stopRef.current?.();
              setCurrent(index);
              speak(index);
            }}
            aria-label={`Show animation step ${index + 1}`}
            aria-current={index === current ? "step" : undefined}
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"
          >
            <motion.span
              className={cn("block h-full rounded-full bg-gradient-to-r", accent.bar)}
              initial={false}
              animate={{ width: index <= current ? "100%" : "0%" }}
              transition={{ duration: 0.25 }}
            />
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${current}-${step.expression}`}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {animation.type === "equation_steps" ? (
            <EquationStage step={step} index={current} accent={accent} />
          ) : (
            <StrategyStage
              step={step}
              index={current}
              accent={accent}
              type={animation.type}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-4 flex items-start gap-2 text-base leading-relaxed text-fog-300">
        <Volume2 className={cn("mt-0.5 h-5 w-5 shrink-0", accent.text)} />
        {step.note}
      </p>
    </motion.div>
  );
}
