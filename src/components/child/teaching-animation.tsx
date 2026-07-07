"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  StepForward,
  Turtle,
  WandSparkles,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";
import {
  buildYourTurn,
  checkYourTurnOrder,
  checkYourTurnTap,
  classifyOptions,
  equationBeat,
  sentenceWords,
  splitExpression,
  stepDurationMs,
  type AreaModelSpec,
  type GraphSpec,
  type NumberLineSpec,
  type YourTurnTask,
} from "@/lib/child/animation-timeline";
import { Celebration } from "@/components/fx/celebration";
import {
  stepNarration,
  type TeachingAnimation as TeachingAnimationData,
  type TeachingAnimationStep,
} from "@/lib/child/teaching-animations";
import { currentWordIndex } from "@/lib/child/caption-timing";
import { personalizeYourTurnPrompt } from "@/lib/child/eddie-copy";
import { landCue, successCue, tapCue } from "@/lib/child/sensory-cues";
import type { NarrationCaption } from "@/lib/child/use-narration";

/**
 * "See it" — Coach Eddie's choreographed mini-lesson (Wave 8, Phase 1).
 *
 * Every animation is MEANINGFUL motion that maps to the maths/concept:
 * difference-of-squares factors into brackets and lands both roots on a number
 * line; choice strategy eliminates options and names the near-miss "half
 * answer"; grammar sweeps an underline through the sentence; science walks a
 * cause→effect chain. Content is human-authored/deterministic
 * (teaching-animations.ts) — the pure step-timeline helpers in
 * animation-timeline.ts decide the choreography, this component only renders
 * it. Transform/opacity only; reduced motion gets the same beats, calmly.
 */

const SPRING = { type: "spring" as const, stiffness: 260, damping: 20 };

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

/** Calm three-bar "Eddie is speaking" pulse — transform-only, never flashing. */
function SpeakingBars({ accent }: { accent: AccentPreset }) {
  return (
    <div className="flex h-5 items-end gap-0.5" aria-hidden>
      {[0, 1, 2].map((bar) => (
        <motion.span
          key={bar}
          animate={{ scaleY: [0.4, 1, 0.55, 0.9, 0.4] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: bar * 0.18,
          }}
          className="w-1 origin-bottom rounded-full"
          style={{ height: "100%", backgroundColor: accent.swatch }}
        />
      ))}
    </div>
  );
}

/**
 * Coach Eddie — an expressive, accent-driven presence (Wave 8, Feature 2):
 * gentle breathing at idle, livelier bobbing synced to the TTS narration, a
 * quick warm nod when the step advances, and a points-at gesture toward the
 * current step's focus token. Settles to calm idle the moment narration stops
 * (e.g. the child starts answering). Professional, never cutesy; every beat is
 * transform/opacity only and collapses under reduced motion.
 */
function EddieCoach({
  line,
  accent,
  speaking,
  stepIndex,
  focus,
  reduced,
  celebrating = false,
}: {
  line: string;
  accent: AccentPreset;
  speaking: boolean;
  stepIndex: number;
  focus?: string;
  reduced: boolean;
  /** A warm one-shot celebration pose (e.g. the child nailed "Your turn"). */
  celebrating?: boolean;
}) {
  const [reacting, setReacting] = useState(false);
  const lastStepRef = useRef(stepIndex);

  // A warm micro-reaction (a quick nod) each time the step advances.
  useEffect(() => {
    if (stepIndex === lastStepRef.current) return;
    lastStepRef.current = stepIndex;
    if (reduced) return;
    setReacting(true);
    const timer = window.setTimeout(() => setReacting(false), 700);
    return () => window.clearTimeout(timer);
  }, [stepIndex, reduced]);

  const focusTokens = focus ? splitExpression(focus) : [];

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <motion.div
        animate={
          reduced
            ? undefined
            : celebrating
              ? { rotate: [0, 9, -9, 5, 0], scale: [1, 1.16, 1], y: [0, -7, 0] }
              : reacting
                ? { rotate: [0, -7, 7, 0], scale: [1, 1.08, 1], y: 0 }
                : speaking
                  ? { y: [0, -3, 0], rotate: [0, 1.5, -1.5, 0], scale: 1 }
                  : { scale: [1, 1.04, 1], y: 0, rotate: 0 }
        }
        transition={
          reduced
            ? undefined
            : celebrating
              ? { duration: 1.1, ease: "easeInOut" }
              : reacting
                ? { duration: 0.65, ease: "easeInOut" }
                : speaking
                  ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          accent.bg,
          accent.border,
        )}
      >
        <WandSparkles className={cn("h-5 w-5", accent.text)} aria-hidden />
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fog-500">
          Eddie, your Edway coach
          {speaking && !reduced && <SpeakingBars accent={accent} />}
        </div>
        <p className="mt-1 text-base leading-relaxed text-fog-100">{line}</p>
        {focusTokens.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5" aria-hidden>
            <motion.span
              animate={reduced ? undefined : { x: [0, 5, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="flex"
            >
              <ArrowRight className={cn("h-4 w-4", accent.text)} />
            </motion.span>
            <span
              className={cn(
                "rounded-lg border px-2 py-0.5 text-sm font-bold",
                accent.bg,
                accent.border,
                accent.text,
              )}
            >
              {focusTokens.map((token, i) => (
                <span key={`${token}-${i}`} className="mx-0.5">
                  <MathToken token={token} />
                </span>
              ))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Karaoke caption (Wave 8, Feature 5 — reuses the Read-Along alignment path):
 * the step's narration line sits under Eddie, and while he speaks, each word
 * lights up exactly as it's said — a calm accent tint moving with the voice,
 * never flashing. Without word timings (uncached clip, speech fallback, TTS
 * off) it degrades to a plain per-step caption; never a stuck highlight.
 */
function KaraokeCaption({
  narration,
  caption,
  getTime,
  accent,
  reduced,
}: {
  narration: string;
  caption: NarrationCaption | null;
  getTime?: () => number;
  accent: AccentPreset;
  reduced: boolean;
}) {
  // Timings only apply when the playing clip IS this step's narration.
  const timed =
    caption && caption.text === narration && caption.words?.length
      ? caption.words
      : null;
  const [litIndex, setLitIndex] = useState(-1);

  useEffect(() => {
    setLitIndex(-1);
    if (!timed || !getTime) return;
    let raf = 0;
    const tick = () => {
      const index = currentWordIndex(timed, getTime());
      setLitIndex((prev) => (prev === index ? prev : index));
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [timed, getTime, narration]);

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-void/30 px-4 py-3 text-lg leading-relaxed">
      {timed ? (
        timed.map((w, i) => (
          <span
            key={`${w.word}-${i}`}
            className={cn(
              "rounded px-0.5",
              // Reduced motion keeps a static current-word tint, no transition.
              !reduced && "transition-colors duration-150",
              i === litIndex
                ? cn(accent.bg, "text-fog-50")
                : i < litIndex
                  ? "text-fog-200"
                  : "text-fog-400",
            )}
          >
            {w.word}{" "}
          </span>
        ))
      ) : (
        <span className="text-fog-300">{narration}</span>
      )}
    </div>
  );
}

/**
 * A calm number line the roots physically LAND on — the motion is the maths:
 * two markers drop onto −r and +r so the child sees both answers exist.
 */
function NumberLine({
  spec,
  accent,
  reduced,
}: {
  spec: NumberLineSpec;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const { min, max, tickStep, marks } = spec;
  const pos = (v: number) => ((v - min) / (max - min)) * 100;
  const ticks: number[] = [];
  for (let t = min; t <= max; t += tickStep) ticks.push(t);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: reduced ? 0 : 0.2 }}
      className="relative mt-5 h-24"
      aria-label={`Number line showing ${marks.join(" and ")}`}
    >
      <div className="absolute inset-x-4 top-1/2 h-px bg-white/25">
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${pos(t)}%` }}
          >
            <div className="mx-auto h-2 w-px -translate-y-1/2 bg-white/25" />
            {(t === min || t === max || t === 0) && !marks.includes(t) && (
              <div className="mt-1.5 text-center text-xs font-semibold text-fog-500">
                {t}
              </div>
            )}
          </div>
        ))}
        {marks.map((mark, i) => (
          <motion.div
            key={mark}
            initial={reduced ? false : { y: -42, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { ...SPRING, delay: 0.55 + i * 0.45 }
            }
            onAnimationComplete={() => {
              // A root physically lands → one soft low cue (skipped when
              // the landing was instant under reduced motion).
              if (!reduced) landCue();
            }}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${pos(mark)}%` }}
          >
            <div
              className={cn(
                "h-4 w-4 -translate-y-1/2 rounded-full border-2 shadow-lg",
                accent.bg,
                accent.border,
              )}
            />
            <div
              className={cn(
                "mt-1 text-center text-base font-bold",
                accent.text,
              )}
            >
              {mark}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Graph reveal (Phase 2): the parabola y = x² − r² draws itself and visibly
 * crosses the x-axis at −r and +r — the algebra and the picture become one
 * idea. Stroke-draw + pop-in dots only; reduced motion shows the finished
 * graph instantly.
 */
function GraphReveal({
  spec,
  accent,
  reduced,
}: {
  spec: GraphSpec;
  accent: AccentPreset;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mt-5"
    >
      <svg
        viewBox={`0 0 ${spec.width} ${spec.height}`}
        className="h-auto w-full max-w-md mx-auto block"
        role="img"
        aria-label={`Graph of ${spec.label} crossing the x axis at ${spec.intercepts
          .map((i) => i.label)
          .join(" and ")}`}
      >
        {/* Axes */}
        <line
          x1={0}
          y1={spec.xAxisY}
          x2={spec.width}
          y2={spec.xAxisY}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1}
        />
        <line
          x1={spec.yAxisX}
          y1={6}
          x2={spec.yAxisX}
          y2={spec.height - 6}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        {/* The parabola draws itself */}
        <motion.path
          d={spec.path}
          fill="none"
          stroke={accent.swatch}
          strokeWidth={3}
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 1.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }
          }
        />
        {/* The crossings ARE the answers */}
        {spec.intercepts.map((intercept, i) => (
          <motion.g
            key={intercept.label}
            initial={reduced ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { ...SPRING, delay: 1.7 + i * 0.25 }
            }
            onAnimationComplete={() => {
              if (!reduced && i === 0) landCue();
            }}
            style={{
              transformOrigin: `${intercept.x}px ${spec.xAxisY}px`,
            }}
          >
            <circle
              cx={intercept.x}
              cy={spec.xAxisY}
              r={6}
              fill={accent.swatch}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
            />
            <text
              x={intercept.x}
              y={spec.xAxisY - 12}
              textAnchor="middle"
              fill="currentColor"
              className="text-fog-100"
              fontSize={15}
              fontWeight={700}
            >
              {intercept.label}
            </text>
          </motion.g>
        ))}
        {/* Curve label */}
        <text
          x={8}
          y={18}
          fill="rgba(255,255,255,0.65)"
          fontSize={13}
          fontWeight={600}
        >
          {spec.label}
        </text>
      </svg>
    </motion.div>
  );
}

/**
 * Area-model proof (Phase 2): an x·x square loses an r·r corner, and the
 * leftover pieces line up as the (x+r)(x−r) rectangle — difference of squares
 * you can SEE. Three labelled panels beat in sequence (transform/opacity
 * only); reduced motion shows all three at once.
 */
function AreaModel({
  spec,
  accent,
  reduced,
}: {
  spec: AreaModelSpec;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const unit = 14; // px per abstract unit — biggest panel stays under 90px tall
  const r = spec.root;
  const beat = (i: number) =>
    reduced
      ? { duration: 0 }
      : { duration: 0.45, delay: 0.5 + i * 1.1, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
      {/* 1 — the x·x square with the r·r corner marked */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={beat(0)}
        className="flex flex-col items-center gap-1"
      >
        <div
          className="relative rounded-md border-2"
          style={{
            width: spec.bigSquare.w * unit,
            height: spec.bigSquare.h * unit,
            borderColor: accent.swatch,
            backgroundColor: `${accent.swatch}14`,
          }}
        >
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={beat(1)}
            className="absolute right-0 top-0 rounded-bl-md border-b-2 border-l-2 border-dashed border-amber-300/80 bg-amber-400/20"
            style={{ width: spec.cut.w * unit, height: spec.cut.h * unit }}
          />
        </div>
        <span className="text-sm font-semibold text-fog-300">
          x·x take away {r}·{r}
        </span>
      </motion.div>

      <motion.span
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={beat(2)}
        aria-hidden
      >
        <ArrowRight className={cn("h-5 w-5", accent.text)} />
      </motion.span>

      {/* 2 — the pieces rearranged into (x+r)(x−r) */}
      <motion.div
        initial={reduced ? false : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={beat(2)}
        className="flex flex-col items-center gap-1"
      >
        <div className="flex">
          <div
            className="rounded-l-md border-2"
            style={{
              width: spec.bottom.w * unit,
              height: spec.final.h * unit,
              borderColor: accent.swatch,
              backgroundColor: `${accent.swatch}14`,
            }}
          />
          <div
            className="rounded-r-md border-2 border-l-0 border-dashed"
            style={{
              width: spec.topStrip.h * unit,
              height: spec.final.h * unit,
              borderColor: accent.swatch,
              backgroundColor: `${accent.swatch}0d`,
            }}
          />
        </div>
        <span className="text-sm font-semibold text-fog-300">
          (x − {r})(x + {r})
        </span>
      </motion.div>
    </div>
  );
}

/** r² dots assemble into an r×r square — a square number IS a square. */
function SquareDots({
  dots,
  root,
  accent,
  reduced,
}: {
  dots: { row: number; col: number }[];
  root: number;
  accent: AccentPreset;
  reduced: boolean;
}) {
  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${root}, minmax(0, 1fr))` }}
        aria-label={`${dots.length} dots arranged as a ${root} by ${root} square`}
      >
        {dots.map((dot, i) => (
          <motion.span
            key={`${dot.row}-${dot.col}`}
            initial={reduced ? false : { opacity: 0, scale: 0.3, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={
              reduced ? { duration: 0 } : { ...SPRING, delay: 0.5 + i * 0.07 }
            }
            className="h-3.5 w-3.5 rounded-full"
            style={{ backgroundColor: accent.swatch }}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-fog-300">
        {dots.length} dots make a {root} × {root} square
      </span>
    </div>
  );
}

function EquationStage({
  step,
  index,
  accent,
  reduced,
}: {
  step: TeachingAnimationStep;
  index: number;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const beat = useMemo(() => equationBeat(step), [step]);
  const isBalance = beat.kind === "balance";
  const isRoot = beat.kind === "root";
  const isAnswer = beat.kind === "answer";
  const isFactor = beat.kind === "factor";
  const isSquare = beat.kind === "square";

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

      <div className="relative rounded-3xl border border-white/10 bg-white/[0.035] p-5">
        {isBalance && (
          <>
            {["left", "right"].map((side, sideIndex) => (
              <motion.div
                key={side}
                initial={reduced ? false : { y: -58, opacity: 0, scale: 0.85 }}
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
            initial={reduced ? false : { opacity: 0, y: -18, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55 }}
            className="mb-3 text-center text-base font-semibold uppercase tracking-wider text-cyan-200"
          >
            square root both sides
          </motion.div>
        )}
        {isFactor && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-3 text-center text-base font-semibold uppercase tracking-wider text-cyan-200"
          >
            one minus bracket, one plus bracket
          </motion.div>
        )}

        <motion.div
          key={step.expression}
          initial={reduced ? false : { opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex min-h-[6rem] flex-wrap items-center justify-center gap-2 text-center"
        >
          {beat.tokens.map((token, tokenIndex) => {
            const focus =
              step.focus &&
              token.toLowerCase().includes(step.focus.toLowerCase());
            const isBracket = token.startsWith("(");
            return (
              <motion.span
                key={`${token}-${tokenIndex}`}
                initial={
                  reduced
                    ? false
                    : isFactor && isBracket
                      ? { opacity: 0, x: tokenIndex % 2 === 0 ? 44 : -44 }
                      : { opacity: 0, y: 10 }
                }
                animate={
                  isSquare && focus && !reduced
                    ? { opacity: 1, x: 0, y: 0, scale: [1, 1.14, 1] }
                    : { opacity: 1, x: 0, y: 0, scale: 1 }
                }
                transition={
                  reduced
                    ? { duration: 0 }
                    : isFactor && isBracket
                      ? { ...SPRING, delay: 0.25 + tokenIndex * 0.16 }
                      : isSquare && focus
                        ? { delay: 0.5, duration: 0.9, times: [0, 0.5, 1] }
                        : { delay: tokenIndex * 0.05, duration: 0.25 }
                }
                className={cn(
                  "rounded-2xl px-2 py-1 font-bold leading-none",
                  isBracket ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
                  focus
                    ? cn(accent.bg, accent.text, "shadow-lg")
                    : "text-fog-50",
                  token === "=" && "text-cyan-200",
                )}
              >
                {focus && !reduced ? (
                  // Subtle parallax float on the focused token — the eye's anchor.
                  <motion.span
                    className="inline-block"
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.9,
                    }}
                  >
                    <MathToken token={token} />
                  </motion.span>
                ) : (
                  <MathToken token={token} />
                )}
              </motion.span>
            );
          })}
        </motion.div>

        {beat.numberLine && (
          <NumberLine spec={beat.numberLine} accent={accent} reduced={reduced} />
        )}

        {beat.graph && (
          <GraphReveal spec={beat.graph} accent={accent} reduced={reduced} />
        )}

        {beat.areaModel && (
          <AreaModel spec={beat.areaModel} accent={accent} reduced={reduced} />
        )}

        {beat.squareDots && (
          <SquareDots
            dots={beat.squareDots}
            root={Math.round(Math.sqrt(beat.squareDots.length))}
            accent={accent}
            reduced={reduced}
          />
        )}

        {isAnswer && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 1.4, duration: 0.35 }}
            className="mt-4 flex justify-center gap-3"
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

/**
 * Choice strategy over the REAL answer options: eliminate vs keep, with the
 * near-miss "±" distractor named as only half the answer — the child sees WHY
 * it tempts, not just that it's wrong.
 */
function ChoiceStage({
  step,
  index,
  accent,
  reduced,
  options,
  correctIndex,
}: {
  step: TeachingAnimationStep;
  index: number;
  accent: AccentPreset;
  reduced: boolean;
  options?: string[];
  correctIndex?: number;
}) {
  const fates = useMemo(
    () =>
      options && options.length > 1 && typeof correctIndex === "number"
        ? classifyOptions(options, correctIndex)
        : null,
    [options, correctIndex],
  );
  // Beat phases follow the authored steps: read → test/eliminate → check.
  const phase = Math.min(index, 2);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-fog-500">
          Step {index + 1}
        </span>
        <span className={cn("text-sm font-semibold", accent.text)}>
          {step.label}
        </span>
      </div>

      {fates && options ? (
        <div className="mb-5 grid gap-2 sm:grid-cols-2">
          {options.map((option, i) => {
            const fate = fates[i];
            const eliminated = phase >= 1 && fate === "eliminate";
            const kept = phase >= 2 && fate === "keep";
            const half = phase >= 1 && fate === "half";
            return (
              <motion.div
                key={`${option}-${i}`}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{
                  opacity: eliminated ? 0.35 : 1,
                  y: 0,
                  scale: kept && !reduced ? 1.02 : 1,
                }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { ...SPRING, delay: 0.15 + i * 0.1 }
                }
                className={cn(
                  "flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-lg font-semibold",
                  kept
                    ? cn(accent.bg, accent.border, "text-fog-50")
                    : half
                      ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
                      : "border-white/10 bg-white/[0.03] text-fog-200",
                  eliminated && "line-through decoration-2",
                )}
              >
                <span className="min-w-0">{option}</span>
                {kept && (
                  <Check className={cn("h-5 w-5 shrink-0", accent.text)} aria-hidden />
                )}
                {half && (
                  <span className="shrink-0 rounded-full border border-amber-400/40 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                    only half the answer
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap gap-2">
          {sentenceWords(step.expression, 10).map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduced ? 0 : i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xl font-semibold text-fog-200"
            >
              {word}
            </motion.span>
          ))}
        </div>
      )}

      <motion.div
        key={step.note}
        initial={reduced ? false : { opacity: 0, y: 8 }}
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

/** Grammar: an underline sweeps word by word to reveal the sentence structure. */
function GrammarStage({
  step,
  index,
  accent,
  reduced,
}: {
  step: TeachingAnimationStep;
  index: number;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const words = useMemo(() => sentenceWords(step.expression), [step.expression]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-fog-500">
          Step {index + 1}
        </span>
        <span className={cn("text-sm font-semibold", accent.text)}>
          {step.label}
        </span>
      </div>

      <div className="mb-5 flex flex-wrap gap-x-2 gap-y-3 rounded-3xl border border-white/10 bg-void/35 p-5">
        {words.map((word, i) => {
          const focused =
            step.focus &&
            word.toLowerCase().includes(step.focus.toLowerCase());
          return (
            <span
              key={`${word}-${i}`}
              className={cn(
                "relative px-1 text-2xl font-semibold",
                focused
                  ? cn("rounded-lg", accent.bg, accent.text)
                  : "text-fog-100",
              )}
            >
              {word}
              <motion.span
                aria-hidden
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { delay: 0.3 + i * 0.16, duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                }
                className={cn(
                  "absolute inset-x-1 -bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r",
                  accent.bar,
                )}
              />
            </span>
          );
        })}
      </div>

      <motion.div
        key={step.note}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-void/30 p-4"
      >
        <p className="text-lg leading-relaxed text-fog-200">{step.note}</p>
      </motion.div>
    </div>
  );
}

/** Science: a labelled cause→effect chain the child watches advance. */
function ScienceStage({
  steps,
  step,
  index,
  accent,
  reduced,
}: {
  steps: TeachingAnimationStep[];
  step: TeachingAnimationStep;
  index: number;
  accent: AccentPreset;
  reduced: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-fog-500">
          Step {index + 1}
        </span>
        <span className={cn("text-sm font-semibold", accent.text)}>
          {step.label}
        </span>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-3xl border border-white/10 bg-void/35 p-4">
        {steps.map((s, i) => (
          <div key={`${s.label}-${i}`} className="flex items-center gap-2">
            <motion.div
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{
                opacity: i <= index ? 1 : 0.4,
                scale: 1,
              }}
              transition={reduced ? { duration: 0 } : { ...SPRING, delay: i * 0.12 }}
              className={cn(
                "rounded-2xl border px-4 py-2 text-base font-semibold",
                i === index
                  ? cn(accent.bg, accent.border, "text-fog-50")
                  : "border-white/10 bg-white/[0.03] text-fog-300",
              )}
            >
              {s.label}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.span
                initial={reduced ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: i < index ? 1 : 0.35, x: 0 }}
                transition={reduced ? { duration: 0 } : { delay: 0.2 + i * 0.12 }}
              >
                <ArrowRight
                  className={cn(
                    "h-5 w-5",
                    i < index ? accent.text : "text-fog-600",
                  )}
                  aria-hidden
                />
              </motion.span>
            )}
          </div>
        ))}
      </div>

      <motion.div
        key={step.note}
        initial={reduced ? false : { opacity: 0, y: 8 }}
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

/**
 * "Your turn" — ONE short active-recall beat after the reveal (Feature 6).
 * Deterministic (built from the animation's own steps + the real options), no
 * AI, no analytics. Optional and skippable; calm confirm on success, a
 * supportive nudge on a miss — never punitive. Tap targets are .child-touch
 * and fully keyboardable.
 */
function YourTurnPanel({
  task,
  accent,
  reduced,
  onSpeak,
  onSuccess,
  childName = null,
}: {
  task: YourTurnTask;
  accent: AccentPreset;
  reduced: boolean;
  onSpeak?: (text: string) => void;
  /** Lets Eddie strike his celebration pose when the child nails it. */
  onSuccess?: () => void;
  /** Sanitised first name — the ask is addressed to THIS child. */
  childName?: string | null;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<"correct" | "miss" | null>(null);
  const [tapped, setTapped] = useState<number[]>([]);

  useEffect(() => {
    setDismissed(false);
    setResult(null);
    setTapped([]);
  }, [task]);

  if (dismissed) return null;

  const confirmLine = "That's exactly it — you saw it for yourself.";
  const nudgeLine = "Not quite — have another look at the last step. You're close.";

  function finish(correct: boolean) {
    setResult(correct ? "correct" : "miss");
    onSpeak?.(correct ? confirmLine : nudgeLine);
    if (correct) onSuccess?.();
  }

  function tapChoice(index: number) {
    if (result === "correct") return;
    setResult(null);
    const correct = checkYourTurnTap(task, index);
    if (correct) successCue();
    else tapCue();
    finish(correct);
  }

  function tapOrderItem(index: number) {
    if (result === "correct" || task.kind !== "order_steps") return;
    if (tapped.includes(index)) return;
    tapCue();
    const next = [...tapped, index];
    setTapped(next);
    if (next.length === task.items.length) {
      const correct = checkYourTurnOrder(task, next);
      if (correct) successCue();
      finish(correct);
    } else {
      setResult(null);
    }
  }

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn("mt-4 rounded-3xl border p-4", accent.softBg, accent.softBorder)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-lg font-semibold text-fog-50">
          {personalizeYourTurnPrompt(task.prompt, childName)}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-sm text-fog-500 transition-colors hover:text-fog-200 focus-visible:outline-none focus-visible:ring-2"
        >
          Skip
        </button>
      </div>

      {task.kind === "tap_choice" ? (
        <div className="flex flex-wrap gap-2">
          {task.choices.map((choice, i) => {
            const isCorrectPick = result === "correct" && i === task.correct;
            return (
              <button
                key={`${choice}-${i}`}
                type="button"
                onClick={() => tapChoice(i)}
                disabled={result === "correct"}
                className={cn(
                  "child-touch inline-flex items-center gap-2 rounded-2xl border px-4 text-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2",
                  accent.ring,
                  isCorrectPick
                    ? cn(accent.bg, accent.border, accent.text)
                    : "border-white/10 bg-white/[0.03] text-fog-100 hover:border-white/30 hover:bg-white/[0.06]",
                )}
              >
                {choice}
                {isCorrectPick && <Check className="h-5 w-5" aria-hidden />}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2">
            {task.items.map((item, i) => {
              const order = tapped.indexOf(i);
              return (
                <button
                  key={`${item}-${i}`}
                  type="button"
                  onClick={() => tapOrderItem(i)}
                  disabled={result === "correct" || order >= 0}
                  className={cn(
                    "child-touch inline-flex items-center gap-2 rounded-2xl border px-4 text-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2",
                    accent.ring,
                    order >= 0
                      ? cn(accent.bg, accent.border, accent.text)
                      : "border-white/10 bg-white/[0.03] text-fog-100 hover:border-white/30 hover:bg-white/[0.06]",
                  )}
                >
                  {order >= 0 && (
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                        accent.bg,
                      )}
                    >
                      {order + 1}
                    </span>
                  )}
                  {item}
                </button>
              );
            })}
          </div>
          {tapped.length > 0 && result !== "correct" && (
            <button
              type="button"
              onClick={() => {
                setTapped([]);
                setResult(null);
              }}
              className="mt-2 text-sm text-fog-400 transition-colors hover:text-fog-200 focus-visible:outline-none focus-visible:ring-2"
            >
              Start again
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.p
            key={result}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "relative mt-3 text-base leading-relaxed",
              result === "correct" ? "text-neon-200" : "text-fog-200",
            )}
            role="status"
          >
            {result === "correct" && (
              // Tasteful, reduced-motion-aware burst — fires once, after the
              // answer, never blocks input (existing Celebration contract).
              <Celebration variant={2} />
            )}
            {result === "correct" ? confirmLine : nudgeLine}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function TeachingAnimation({
  animation,
  accent,
  autoPlay = false,
  onSpeak,
  onStop,
  options,
  correctIndex,
  speaking = false,
  keyStage,
  caption = null,
  getTime,
  childName = null,
}: {
  animation: TeachingAnimationData;
  accent: AccentPreset;
  autoPlay?: boolean;
  onSpeak?: (text: string) => void;
  onStop?: () => void;
  /** The question's real answer options — powers eliminate-vs-keep beats. */
  options?: string[];
  correctIndex?: number;
  /** Whether TTS narration is audibly playing — drives Eddie's speaking beats. */
  speaking?: boolean;
  /** Child's UK key stage — autoplay pacing is calmer for younger readers. */
  keyStage?: number;
  /** Current narration clip's caption data — powers the karaoke highlight. */
  caption?: NarrationCaption | null;
  /** Playback position poller for the karaoke highlight. */
  getTime?: () => number;
  /** Sanitised first name — Eddie asks THIS child by name in "Your turn". */
  childName?: string | null;
}) {
  const reduced = useReducedMotion() ?? false;
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  // One-shot Eddie celebration pose (fires on a "Your turn" success).
  const [eddieCelebrating, setEddieCelebrating] = useState(false);
  // The one active-recall micro-task that follows the reveal (deterministic).
  const yourTurn = useMemo(
    () =>
      buildYourTurn({
        type: animation.type,
        steps: animation.steps,
        options,
        correctIndex,
      }),
    [animation, options, correctIndex],
  );
  /** "Again, slower" — a calmer second pass at ~1.4× the hold per beat. */
  const [slowMode, setSlowMode] = useState(false);
  const speakRef = useRef(onSpeak);
  const stopRef = useRef(onStop);
  const step = animation.steps[current] ?? animation.steps[0];
  const total = animation.steps.length;

  useEffect(() => {
    speakRef.current = onSpeak;
    stopRef.current = onStop;
  }, [onSpeak, onStop]);

  // Opening "See it" starts the show: the animation is the reveal, so it plays
  // (and narrates step one) as soon as it appears. Under reduced motion the
  // SAME teaching beats still autoplay and narrate — springs and parallax
  // collapse to instant reveals, the pedagogy doesn't.
  useEffect(() => {
    setCurrent(0);
    setSlowMode(false);
    if (autoPlay) {
      setPlaying(true);
      const first = animation.steps[0];
      if (first) speakRef.current?.(stepNarration(first));
    } else {
      setPlaying(false);
    }
  }, [animation, autoPlay]);

  const speak = useCallback(
    (index = current) => {
      const target = animation.steps[index];
      if (target) speakRef.current?.(stepNarration(target));
    },
    [animation.steps, current],
  );

  // Ask, then wait (Phase 3): once the reveal's final beat has finished
  // holding, Eddie voices the "Your turn" question ONCE and goes quiet — a
  // back-and-forth, not a lecture. The visible panel is the fallback when
  // narration is muted/unavailable.
  const promptSpokenRef = useRef(false);
  useEffect(() => {
    promptSpokenRef.current = false;
  }, [animation]);
  useEffect(() => {
    if (!yourTurn || playing || current < total - 1) return;
    if (promptSpokenRef.current) return;
    promptSpokenRef.current = true;
    const timer = window.setTimeout(() => {
      speakRef.current?.(personalizeYourTurnPrompt(yourTurn.prompt, childName));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [yourTurn, playing, current, total, childName]);

  useEffect(() => {
    if (!playing) return;
    // Band-aware hold per beat: derived from how much there is to take in
    // (the narration length) and the child's key stage; "Again, slower"
    // stretches every beat for a calmer second pass.
    const holdMs = stepDurationMs({
      narration: step ? stepNarration(step) : "",
      keyStage,
      slower: slowMode,
    });
    const timer = window.setTimeout(() => {
      if (current >= total - 1) {
        setPlaying(false);
        return;
      }
      const nextIndex = current + 1;
      setCurrent(nextIndex);
      speak(nextIndex);
    }, holdMs);
    return () => window.clearTimeout(timer);
  }, [playing, current, total, reduced, speak, step, keyStage, slowMode]);

  function play() {
    tapCue();
    const nextIndex = current >= total - 1 ? 0 : current;
    if (nextIndex !== current) setCurrent(nextIndex);
    setPlaying(true);
    speak(nextIndex);
  }

  function pause() {
    tapCue();
    setPlaying(false);
    stopRef.current?.();
  }

  function replay() {
    tapCue();
    setSlowMode(false);
    setCurrent(0);
    setPlaying(true);
    speak(0);
  }

  /** A calmer second pass — same beats, ~1.4× the hold on each. */
  function replaySlower() {
    tapCue();
    setSlowMode(true);
    setCurrent(0);
    setPlaying(true);
    speak(0);
  }

  function next() {
    tapCue();
    const nextIndex = Math.min(total - 1, current + 1);
    setPlaying(false);
    setCurrent(nextIndex);
    speak(nextIndex);
  }

  /** Scrub debounce — narrate the landed-on step, not every step dragged past. */
  const scrubSpeakRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (scrubSpeakRef.current) window.clearTimeout(scrubSpeakRef.current);
    },
    [],
  );

  function scrubTo(index: number) {
    setPlaying(false);
    stopRef.current?.();
    setCurrent(index);
    if (scrubSpeakRef.current) window.clearTimeout(scrubSpeakRef.current);
    scrubSpeakRef.current = window.setTimeout(() => speak(index), 350);
  }

  const scrubPct = total > 1 ? (current / (total - 1)) * 100 : 100;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative mt-6 overflow-hidden rounded-3xl border p-5",
        accent.softBg,
        accent.softBorder,
      )}
    >
      {/* Ambient depth — a soft accent gradient field, pure CSS, no animation
          cost. Tasteful, never noisy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(560px 280px at 22% 12%, ${accent.swatch}12, transparent 70%), radial-gradient(480px 260px at 85% 95%, ${accent.swatch}0a, transparent 70%)`,
        }}
      />
      <div className="relative mb-4 flex items-start gap-3">
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
            "inline-flex min-h-12 items-center gap-2 rounded-2xl border focus-visible:outline-none focus-visible:ring-2 px-4 text-base font-semibold transition-all hover:brightness-110",
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
          onClick={() => {
            tapCue();
            speak();
          }}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border focus-visible:outline-none focus-visible:ring-2 border-white/10 bg-white/[0.03] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.06]"
        >
          <Volume2 className="h-5 w-5" />
          Hear step
        </button>
        <button
          type="button"
          onClick={next}
          disabled={current >= total - 1}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border focus-visible:outline-none focus-visible:ring-2 border-white/10 bg-white/[0.03] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-40"
        >
          <StepForward className="h-5 w-5" />
          Next
        </button>
        <button
          type="button"
          onClick={replay}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border focus-visible:outline-none focus-visible:ring-2 border-white/10 bg-white/[0.03] px-4 text-base font-semibold text-fog-200 transition-all hover:border-white/30 hover:bg-white/[0.06]"
        >
          <RotateCcw className="h-5 w-5" />
          Replay
        </button>
        <button
          type="button"
          onClick={replaySlower}
          aria-pressed={slowMode}
          className={cn(
            "inline-flex min-h-12 items-center gap-2 rounded-2xl border focus-visible:outline-none focus-visible:ring-2 px-4 text-base font-semibold transition-all",
            slowMode
              ? cn(accent.bg, accent.border, accent.text)
              : "border-white/10 bg-white/[0.03] text-fog-200 hover:border-white/30 hover:bg-white/[0.06]",
          )}
        >
          <Turtle className="h-5 w-5" />
          Again, slower
        </button>
        <span className="ml-auto whitespace-nowrap text-sm font-semibold text-fog-400">
          Step {current + 1} of {total}
        </span>
      </div>

      <div className="mb-4">
        <EddieCoach
          line={animation.coachLine}
          accent={accent}
          speaking={speaking}
          stepIndex={current}
          focus={step.focus}
          reduced={reduced}
          celebrating={eddieCelebrating}
        />
        <KaraokeCaption
          narration={stepNarration(step)}
          caption={caption}
          getTime={getTime}
          accent={accent}
          reduced={reduced}
        />
      </div>

      {/* Scrubbable step timeline — the CHILD sets the pace. Dragging (or
          arrow keys) moves between beats; narration follows after a beat's
          pause so scrubbing never machine-guns clips. */}
      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          step={1}
          value={current}
          aria-label="Animation step"
          aria-valuetext={`Step ${current + 1} of ${total}`}
          onChange={(e) => scrubTo(Number(e.target.value))}
          className="seeit-scrub"
          style={
            {
              "--seeit-accent": accent.swatch,
              background: `linear-gradient(to right, ${accent.swatch} ${scrubPct}%, rgba(255,255,255,0.1) ${scrubPct}%)`,
            } as React.CSSProperties
          }
        />
      </div>

      {/* Tap anywhere on the picture to pause/resume — the child, not a
          timer, owns the pace. Keyboardable (Enter/Space) with visible focus. */}
      <div
        role="button"
        tabIndex={0}
        aria-label={playing ? "Pause the animation" : "Play the animation"}
        onClick={() => (playing ? pause() : play())}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (playing) pause();
            else play();
          }
        }}
        className={cn(
          "relative cursor-pointer select-none rounded-3xl focus-visible:outline-none focus-visible:ring-2",
          accent.ring,
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current}-${step.expression}`}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {animation.type === "equation_steps" ? (
              <EquationStage
                step={step}
                index={current}
                accent={accent}
                reduced={reduced}
              />
            ) : animation.type === "grammar_highlight" ? (
              <GrammarStage
                step={step}
                index={current}
                accent={accent}
                reduced={reduced}
              />
            ) : animation.type === "science_sequence" ? (
              <ScienceStage
                steps={animation.steps}
                step={step}
                index={current}
                accent={accent}
                reduced={reduced}
              />
            ) : (
              <ChoiceStage
                step={step}
                index={current}
                accent={accent}
                reduced={reduced}
                options={options}
                correctIndex={correctIndex}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {!playing && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-3 right-3 z-10"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-void/70 px-3 py-1.5 text-sm font-semibold text-fog-200 backdrop-blur-sm">
              <Play className="h-4 w-4" /> Tap to play
            </span>
          </div>
        )}
      </div>

      {/* After the reveal's final beat: one short recall task, skippable. */}
      <AnimatePresence>
        {yourTurn && current >= total - 1 && (
          <YourTurnPanel
            task={yourTurn}
            accent={accent}
            reduced={reduced}
            onSpeak={onSpeak}
            onSuccess={() => {
              setEddieCelebrating(true);
              window.setTimeout(() => setEddieCelebrating(false), 1300);
            }}
            childName={childName}
          />
        )}
      </AnimatePresence>

      <p className="mt-4 flex items-start gap-2 text-base leading-relaxed text-fog-300">
        <Volume2 className={cn("mt-0.5 h-5 w-5 shrink-0", accent.text)} />
        {step.note}
      </p>
    </motion.div>
  );
}
