"use client";

import { motion, useReducedMotion } from "framer-motion";
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
