"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";
import type { MathFraction, MathVisualSpec } from "@/lib/child/math-visual";

/**
 * F2 — the deterministic, animated question figure. Draws a shaded fraction bar
 * or a 10×10 percent grid derived from the prompt (see `deriveMathVisual`),
 * always present and free (no per-question AI PNG). Transform/opacity entrance
 * only; reduced motion shows the finished figure instantly.
 */

const SPRING = { type: "spring" as const, stiffness: 260, damping: 22 };

function FractionBar({
  frac,
  accent,
  reduced,
  emphasis = false,
}: {
  frac: MathFraction;
  accent: AccentPreset;
  reduced: boolean;
  emphasis?: boolean;
}) {
  const segments = Array.from({ length: frac.den });
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-lg border",
          emphasis ? accent.border : "border-white/15",
        )}
        style={{ height: 34 }}
      >
        {segments.map((_, i) => (
          <motion.div
            key={i}
            initial={reduced ? false : { opacity: 0, scaleY: 0.3 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={
              reduced ? { duration: 0 } : { ...SPRING, delay: 0.1 + i * 0.05 }
            }
            className="h-full flex-1 origin-bottom border-r border-void/40 last:border-r-0"
            style={{
              backgroundColor:
                i < frac.num ? accent.swatch : "rgba(255,255,255,0.05)",
            }}
          />
        ))}
      </div>
      <span className={cn("text-sm font-bold", emphasis ? accent.text : "text-fog-200")}>
        {frac.num}/{frac.den}
      </span>
    </div>
  );
}

function PercentGrid({
  value,
  accent,
  reduced,
}: {
  value: number;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const cells = Array.from({ length: 100 });
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-10 gap-[2px]">
        {cells.map((_, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.25, delay: 0.002 * i }
            }
            className="aspect-square w-full rounded-[2px]"
            style={{
              backgroundColor:
                i < value ? accent.swatch : "rgba(255,255,255,0.06)",
            }}
          />
        ))}
      </div>
      <span className={cn("text-sm font-bold", accent.text)}>{value}%</span>
    </div>
  );
}

function NumberLine({
  spec,
  accent,
  reduced,
}: {
  spec: Extract<MathVisualSpec, { kind: "number_line" }>;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const { a, result, min, max } = spec;
  const span = max - min;
  const ticks = Array.from({ length: span + 1 }, (_, i) => min + i);
  // Viewbox in abstract units; padding keeps end labels inside.
  const W = 100;
  const padX = 4;
  const usable = W - padX * 2;
  const x = (v: number) => padX + ((v - min) / span) * usable;
  const axisY = 30;

  return (
    <svg viewBox="0 0 100 48" className="w-full" style={{ maxHeight: 150 }}>
      {/* axis */}
      <line x1={x(min)} y1={axisY} x2={x(max)} y2={axisY} stroke="rgba(255,255,255,0.3)" strokeWidth={0.6} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={axisY - 2} x2={x(t)} y2={axisY + 2} stroke="rgba(255,255,255,0.35)" strokeWidth={0.5} />
          <text x={x(t)} y={axisY + 8} textAnchor="middle" fontSize={3.2} fill={t === 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.5)"}>
            {t}
          </text>
        </g>
      ))}
      {/* jump arc from a to result */}
      <motion.path
        d={`M ${x(a)} ${axisY} Q ${(x(a) + x(result)) / 2} ${axisY - 14} ${x(result)} ${axisY}`}
        fill="none"
        stroke={accent.swatch}
        strokeWidth={1.1}
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.7, ease: "easeInOut" }}
      />
      {/* start + end markers */}
      <circle cx={x(a)} cy={axisY} r={1.6} fill="rgba(255,255,255,0.7)" />
      <motion.circle
        cx={x(result)}
        cy={axisY}
        r={2.1}
        fill={accent.swatch}
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={reduced ? { duration: 0 } : { delay: 0.7, type: "spring", stiffness: 300, damping: 18 }}
        style={{ transformOrigin: `${x(result)}px ${axisY}px` }}
      />
      <text x={x(a)} y={axisY - 4} textAnchor="middle" fontSize={3.4} fill="rgba(255,255,255,0.7)">
        {a}
      </text>
      <text x={x(result)} y={axisY - 16.5} textAnchor="middle" fontSize={4} fontWeight="bold" fill={accent.swatch}>
        {result}
      </text>
    </svg>
  );
}

function DotArray({
  rows,
  cols,
  accent,
  reduced,
}: {
  rows: number;
  cols: number;
  accent: AccentPreset;
  reduced: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid gap-[5px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.22, delay: 0.02 * i }}
            className="aspect-square rounded-full"
            style={{ width: rows * cols > 64 ? 10 : 14, backgroundColor: accent.swatch }}
          />
        ))}
      </div>
      <span className={cn("text-sm font-bold", accent.text)}>
        {rows} × {cols} = {rows * cols}
      </span>
    </div>
  );
}

function GroupsVisual({
  spec,
  accent,
  reduced,
}: {
  spec: Extract<MathVisualSpec, { kind: "groups" }>;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const { groups, shadedGroups, perGroup, total, result } = spec;
  let dot = 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-start justify-center gap-2">
        {Array.from({ length: groups }).map((g, gi) => {
          const shaded = gi < shadedGroups;
          return (
            <div
              key={gi}
              className={cn(
                "flex flex-wrap content-start justify-center gap-[3px] rounded-lg border p-1.5",
                shaded ? accent.border : "border-white/15",
              )}
              style={{ maxWidth: perGroup > 6 ? 72 : 999 }}
            >
              {Array.from({ length: perGroup }).map((_, i) => {
                const delay = 0.03 * dot++;
                return (
                  <motion.span
                    key={i}
                    initial={reduced ? false : { opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.2, delay }}
                    className="aspect-square rounded-full"
                    style={{
                      width: 11,
                      backgroundColor: shaded ? accent.swatch : "rgba(255,255,255,0.14)",
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <span className={cn("text-sm font-bold", accent.text)}>
        {shadedGroups}/{groups} of {total} = {result}
      </span>
    </div>
  );
}

/** A single accent-filled variable tile (e.g. an "x" tile). */
function VarTile({
  label,
  accent,
  reduced,
  delay,
}: {
  label: string;
  accent: AccentPreset;
  reduced: boolean;
  delay: number;
}) {
  return (
    <motion.span
      initial={reduced ? false : { opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : { ...SPRING, delay }}
      className={cn(
        "flex h-9 min-w-[28px] items-center justify-center rounded-md border px-2 text-sm font-bold text-white",
        accent.border,
      )}
      style={{ backgroundColor: accent.swatch }}
    >
      {label}
    </motion.span>
  );
}

/** A small neutral unit tile (the "+ b" ones in an expand). */
function UnitTile({ reduced, delay }: { reduced: boolean; delay: number }) {
  return (
    <motion.span
      initial={reduced ? false : { opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : { ...SPRING, delay }}
      className="h-7 w-7 rounded-md border border-white/20 bg-white/10"
    />
  );
}

function AlgebraTiles({
  spec,
  accent,
  reduced,
}: {
  spec: Extract<MathVisualSpec, { kind: "algebra_tiles" }>;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const { mode, a, b, op, variable, resultCoeff, resultLabel } = spec;
  let i = 0;

  if (mode === "collect") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: a }).map((_, k) => (
              <VarTile key={`a${k}`} label={variable} accent={accent} reduced={reduced} delay={0.04 * i++} />
            ))}
          </div>
          <span className={cn("px-1 text-2xl font-bold", accent.text)} aria-hidden>
            {op === "+" ? "+" : "−"}
          </span>
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: b }).map((_, k) => (
              <VarTile
                key={`b${k}`}
                label={variable}
                accent={accent}
                reduced={reduced}
                delay={0.04 * i++}
              />
            ))}
          </div>
        </div>
        <span className={cn("text-sm font-bold", accent.text)}>= {resultLabel}</span>
      </div>
    );
  }

  if (mode === "expand") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: a }).map((_, row) => (
            <div key={row} className="flex items-center gap-1">
              <VarTile label={variable} accent={accent} reduced={reduced} delay={0.05 * i++} />
              {op === "-" && (
                <span className="px-0.5 text-sm font-bold text-fog-300" aria-hidden>
                  −
                </span>
              )}
              <div className="flex gap-1">
                {Array.from({ length: b }).map((_, k) => (
                  <UnitTile key={k} reduced={reduced} delay={0.05 * i++} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <span className={cn("text-sm font-bold", accent.text)}>= {resultLabel}</span>
      </div>
    );
  }

  // scale — a copies of the variable tile
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-1">
        {Array.from({ length: resultCoeff }).map((_, k) => (
          <VarTile key={k} label={variable} accent={accent} reduced={reduced} delay={0.04 * i++} />
        ))}
      </div>
      <span className={cn("text-sm font-bold", accent.text)}>= {resultLabel}</span>
    </div>
  );
}

function RoundingLine({
  spec,
  accent,
  reduced,
}: {
  spec: Extract<MathVisualSpec, { kind: "rounding" }>;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const { value, lower, upper, rounded, place } = spec;
  const span = upper - lower;
  const mid = lower + span / 2;
  const W = 100;
  const padX = 8;
  const usable = W - padX * 2;
  const x = (v: number) => padX + ((v - lower) / span) * usable;
  const axisY = 30;
  const roundsUp = rounded === upper;

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <svg viewBox="0 0 100 44" className="w-full" style={{ maxHeight: 150 }}>
        {/* axis */}
        <line x1={x(lower)} y1={axisY} x2={x(upper)} y2={axisY} stroke="rgba(255,255,255,0.3)" strokeWidth={0.6} />
        {/* midpoint tick (the tipping point) */}
        <line x1={x(mid)} y1={axisY - 3} x2={x(mid)} y2={axisY + 3} stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} strokeDasharray="1 1" />
        {/* endpoints */}
        {[lower, upper].map((t) => {
          const isTarget = t === rounded;
          return (
            <g key={t}>
              <circle cx={x(t)} cy={axisY} r={isTarget ? 2.1 : 1.5} fill={isTarget ? accent.swatch : "rgba(255,255,255,0.4)"} />
              <text x={x(t)} y={axisY + 8} textAnchor="middle" fontSize={3.4} fontWeight={isTarget ? "bold" : "normal"} fill={isTarget ? accent.swatch : "rgba(255,255,255,0.55)"}>
                {t}
              </text>
            </g>
          );
        })}
        {/* the value being rounded, with a drop line + snap arc to its target */}
        <line x1={x(value)} y1={axisY - 10} x2={x(value)} y2={axisY} stroke="rgba(255,255,255,0.55)" strokeWidth={0.5} />
        <text x={x(value)} y={axisY - 12} textAnchor="middle" fontSize={4} fontWeight="bold" fill="rgba(255,255,255,0.85)">
          {value}
        </text>
        <motion.path
          d={`M ${x(value)} ${axisY - 6} Q ${(x(value) + x(rounded)) / 2} ${axisY - 15} ${x(rounded)} ${axisY - 2}`}
          fill="none"
          stroke={accent.swatch}
          strokeWidth={1}
          strokeLinecap="round"
          markerEnd=""
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, ease: "easeInOut" }}
        />
      </svg>
      <span className={cn("text-sm font-bold", accent.text)}>
        {value} rounds {roundsUp ? "up" : "down"} to {rounded}
        <span className="text-fog-400 font-normal"> (nearest {place})</span>
      </span>
    </div>
  );
}

function PlaceValueColumns({
  spec,
  accent,
  reduced,
}: {
  spec: Extract<MathVisualSpec, { kind: "place_value" }>;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const { digits, labels, highlightIndex, digit, placeValue } = spec;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-1">
        {digits.map((d, i) => {
          const on = i === highlightIndex;
          return (
            <motion.div
              key={i}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.05 * i }}
              className="flex flex-col items-center gap-1"
            >
              <span className={cn("text-[10px] font-mono uppercase tracking-wide", on ? accent.text : "text-fog-500")}>
                {labels[i]}
              </span>
              <span
                className={cn(
                  "flex h-10 w-8 items-center justify-center rounded-md border text-lg font-bold",
                  on ? accent.border : "border-white/15",
                  on ? "text-white" : "text-fog-300",
                )}
                style={on ? { backgroundColor: accent.swatch } : undefined}
              >
                {d}
              </span>
            </motion.div>
          );
        })}
      </div>
      <span className={cn("text-sm font-bold", accent.text)}>
        {digit} is worth {placeValue}
      </span>
    </div>
  );
}

function StandardFormVisual({
  spec,
  accent,
  reduced,
}: {
  spec: Extract<MathVisualSpec, { kind: "standard_form" }>;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const { original, a, exponent, shiftPlaces, shiftDir } = spec;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { ...SPRING }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <span className="text-lg font-bold text-fog-200">{original}</span>
      <span className="text-xs text-fog-400">
        move the point {shiftPlaces} {shiftPlaces === 1 ? "place" : "places"} {shiftDir}
      </span>
      <span className={cn("text-2xl font-bold", accent.text)}>
        {a} × 10<sup className="text-base align-super">{exponent}</sup>
      </span>
    </motion.div>
  );
}

export function MathVisual({
  spec,
  accent,
}: {
  spec: MathVisualSpec;
  accent: AccentPreset;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex aspect-[3/2] w-full items-center justify-center rounded-2xl p-3"
      role="img"
      aria-label={spec.alt}
    >
      {spec.kind === "percent" ? (
        <PercentGrid value={spec.value} accent={accent} reduced={reduced} />
      ) : spec.kind === "number_line" ? (
        <NumberLine spec={spec} accent={accent} reduced={reduced} />
      ) : spec.kind === "array" ? (
        <DotArray rows={spec.rows} cols={spec.cols} accent={accent} reduced={reduced} />
      ) : spec.kind === "groups" ? (
        <GroupsVisual spec={spec} accent={accent} reduced={reduced} />
      ) : spec.kind === "algebra_tiles" ? (
        <AlgebraTiles spec={spec} accent={accent} reduced={reduced} />
      ) : spec.kind === "rounding" ? (
        <RoundingLine spec={spec} accent={accent} reduced={reduced} />
      ) : spec.kind === "place_value" ? (
        <PlaceValueColumns spec={spec} accent={accent} reduced={reduced} />
      ) : spec.kind === "standard_form" ? (
        <StandardFormVisual spec={spec} accent={accent} reduced={reduced} />
      ) : (
        <div className="flex w-full items-center justify-center gap-2">
          <div className="min-w-0 flex-1">
            <FractionBar frac={spec.a} accent={accent} reduced={reduced} />
          </div>
          {spec.b && spec.op && (
            <>
              <span className={cn("text-2xl font-bold", accent.text)} aria-hidden>
                {spec.op === "×" ? "×" : spec.op === "-" ? "−" : "+"}
              </span>
              <div className="min-w-0 flex-1">
                <FractionBar
                  frac={spec.b}
                  accent={accent}
                  reduced={reduced}
                  emphasis
                />
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
