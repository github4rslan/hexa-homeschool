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
