"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AccentPreset } from "@/lib/child/accents";
import type { ScienceVisualSpec } from "@/lib/child/science-visual";

/**
 * F2 — deterministic, honestly-described science question figures. Draws a
 * plant-parts sketch, a life-cycle ring, a food-chain arrow strip, a
 * states-of-matter particle grid, or a labelled cell (see `deriveScienceVisual`).
 * Always present and free (no per-question AI PNG). Transform/opacity entrance
 * only; reduced motion shows the finished figure instantly. The container
 * carries the honest `alt` as an aria-label so assistive tech + auto-narration
 * describe it exactly.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

function Dot({
  cx,
  cy,
  r,
  fill,
  reduced,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  reduced: boolean;
  delay: number;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      initial={reduced ? false : { opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : { duration: 0.25, delay }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    />
  );
}

function StatesOfMatter({
  accent,
  reduced,
}: {
  accent: AccentPreset;
  reduced: boolean;
}) {
  const fill = accent.swatch;
  // Solid: fixed 3×3 grid. Liquid: close but offset. Gas: sparse + spread.
  const solid: [number, number][] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) solid.push([8 + c * 8, 8 + r * 8]);
  const liquid: [number, number][] = [
    [7, 9],
    [15, 12],
    [23, 8],
    [10, 18],
    [19, 20],
    [25, 16],
    [8, 24],
    [17, 25],
  ];
  const gas: [number, number][] = [
    [7, 8],
    [24, 6],
    [14, 14],
    [26, 20],
    [6, 24],
    [18, 25],
  ];
  const groups: { label: string; pts: [number, number][] }[] = [
    { label: "Solid", pts: solid },
    { label: "Liquid", pts: liquid },
    { label: "Gas", pts: gas },
  ];
  return (
    <div className="flex w-full items-end justify-center gap-3">
      {groups.map((g, gi) => (
        <div key={g.label} className="flex flex-1 flex-col items-center gap-1.5">
          <svg viewBox="0 0 32 32" className="w-full" style={{ maxWidth: 92 }}>
            <rect
              x={1}
              y={1}
              width={30}
              height={30}
              rx={3}
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={0.8}
            />
            {g.pts.map(([cx, cy], i) => (
              <Dot
                key={i}
                cx={cx}
                cy={cy}
                r={2.4}
                fill={fill}
                reduced={reduced}
                delay={0.05 * gi + 0.03 * i}
              />
            ))}
          </svg>
          <span className={cn("text-xs font-bold", accent.text)}>{g.label}</span>
        </div>
      ))}
    </div>
  );
}

function PlantParts({
  accent,
  reduced,
}: {
  accent: AccentPreset;
  reduced: boolean;
}) {
  const stem = accent.swatch;
  return (
    <svg viewBox="0 0 100 90" className="w-full" style={{ maxHeight: 190 }}>
      {/* soil line */}
      <line x1={10} y1={62} x2={90} y2={62} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} strokeDasharray="2 2" />
      {/* roots */}
      <motion.path
        d="M50 62 L44 78 M50 62 L56 80 M50 62 L50 82 M50 62 L38 72 M50 62 L62 73"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.6 }}
      />
      {/* stem */}
      <motion.line
        x1={50}
        y1={62}
        x2={50}
        y2={22}
        stroke={stem}
        strokeWidth={2.4}
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.2 }}
      />
      {/* leaves */}
      <motion.path
        d="M50 44 q-14 -4 -20 -12 q12 -2 20 6 Z"
        fill={stem}
        opacity={0.85}
        initial={reduced ? false : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.3, delay: 0.5 }}
        style={{ transformOrigin: "50px 44px" }}
      />
      <motion.path
        d="M50 40 q14 -4 20 -12 q-12 -2 -20 6 Z"
        fill={stem}
        opacity={0.85}
        initial={reduced ? false : { opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.3, delay: 0.6 }}
        style={{ transformOrigin: "50px 40px" }}
      />
      {/* flower */}
      <motion.g
        initial={reduced ? false : { opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 18, delay: 0.7 }}
        style={{ transformOrigin: "50px 18px" }}
      >
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx={50}
            cy={12}
            rx={3.4}
            ry={6}
            fill={stem}
            transform={`rotate(${deg} 50 18)`}
          />
        ))}
        <circle cx={50} cy={18} r={3.4} fill="rgba(255,255,255,0.85)" />
      </motion.g>
      {/* labels */}
      <text x={92} y={20} fontSize={5} fill="rgba(255,255,255,0.65)">Flower</text>
      <text x={72} y={30} fontSize={5} fill="rgba(255,255,255,0.65)">Leaves</text>
      <text x={54} y={52} fontSize={5} fill="rgba(255,255,255,0.65)">Stem</text>
      <text x={54} y={78} fontSize={5} fill="rgba(255,255,255,0.65)">Roots</text>
    </svg>
  );
}

function LifeCycle({
  stages,
  accent,
  reduced,
}: {
  stages: string[];
  accent: AccentPreset;
  reduced: boolean;
}) {
  const cx = 50;
  const cy = 50;
  const R = 34;
  const positions = stages.map((_, i) => {
    const angle = (-90 + (360 / stages.length) * i) * (Math.PI / 180);
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  return (
    <svg viewBox="0 0 100 100" className="w-full" style={{ maxHeight: 190 }}>
      {/* ring arrows */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={accent.swatch}
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.5}
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.8 }}
      />
      {positions.map((p, i) => (
        <motion.g
          key={i}
          initial={reduced ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduced ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 18, delay: 0.15 * i }
          }
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        >
          <circle cx={p.x} cy={p.y} r={11} fill="rgba(255,255,255,0.05)" stroke={accent.swatch} strokeWidth={1} />
          <text x={p.x} y={p.y + 1.6} textAnchor="middle" fontSize={4.4} fontWeight="bold" fill="rgba(255,255,255,0.85)">
            {stages[i]}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

function FoodChain({
  links,
  accent,
  reduced,
}: {
  links: string[];
  accent: AccentPreset;
  reduced: boolean;
}) {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
      {links.map((link, i) => (
        <div key={link} className="flex items-center gap-1.5">
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.3, delay: 0.2 * i }}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-xl border text-center text-xs font-bold text-fog-100",
              accent.border,
            )}
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            {link}
          </motion.span>
          {i < links.length - 1 && (
            <motion.span
              initial={reduced ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.25, delay: 0.2 * i + 0.12 }}
              className={cn("text-xl font-bold", accent.text)}
              aria-hidden
            >
              →
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

function CellDiagram({
  accent,
  reduced,
}: {
  accent: AccentPreset;
  reduced: boolean;
}) {
  return (
    <svg viewBox="0 0 100 80" className="w-full" style={{ maxHeight: 180 }}>
      {/* membrane + cytoplasm */}
      <motion.ellipse
        cx={50}
        cy={40}
        rx={40}
        ry={30}
        fill={accent.swatch}
        fillOpacity={0.12}
        stroke={accent.swatch}
        strokeWidth={1.6}
        initial={reduced ? false : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE }}
        style={{ transformOrigin: "50px 40px" }}
      />
      {/* nucleus */}
      <motion.circle
        cx={50}
        cy={40}
        r={9}
        fill={accent.swatch}
        fillOpacity={0.85}
        initial={reduced ? false : { opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 18, delay: 0.3 }}
        style={{ transformOrigin: "50px 40px" }}
      />
      <text x={50} y={41.5} textAnchor="middle" fontSize={4.2} fontWeight="bold" fill="rgba(255,255,255,0.9)">
        Nucleus
      </text>
      <text x={50} y={9} textAnchor="middle" fontSize={4.6} fill="rgba(255,255,255,0.65)">
        Membrane
      </text>
      <text x={22} y={58} fontSize={4.6} fill="rgba(255,255,255,0.65)">
        Cytoplasm
      </text>
    </svg>
  );
}

function MaterialProperty({
  property,
  test,
  passLabel,
  failLabel,
  accent,
  reduced,
}: {
  property: string;
  test: string;
  passLabel: string;
  failLabel: string;
  accent: AccentPreset;
  reduced: boolean;
}) {
  const tiles: { symbol: string; label: string; pass: boolean; delay: number }[] = [
    { symbol: "✔", label: passLabel, pass: true, delay: 0.1 },
    { symbol: "✘", label: failLabel, pass: false, delay: 0.25 },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className={cn("text-sm font-bold capitalize", accent.text)}>
        {property}?
      </span>
      <span className="text-center text-xs text-fog-300">{test}</span>
      <div className="flex w-full items-stretch justify-center gap-3">
        {tiles.map((t) => (
          <motion.div
            key={t.label}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.3, delay: t.delay }}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 text-center",
              t.pass ? accent.border : "border-white/10",
            )}
            style={{ backgroundColor: "rgba(255,255,255,0.04)", maxWidth: 140 }}
          >
            <span
              className={cn(
                "text-2xl font-bold",
                t.pass ? accent.text : "text-fog-400",
              )}
              aria-hidden
            >
              {t.symbol}
            </span>
            <span className="text-xs font-semibold text-fog-100">{t.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ScienceVisual({
  spec,
  accent,
}: {
  spec: ScienceVisualSpec;
  accent: AccentPreset;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="flex aspect-[3/2] w-full items-center justify-center rounded-2xl p-3"
      role="img"
      aria-label={spec.alt}
    >
      {spec.kind === "states_of_matter" ? (
        <StatesOfMatter accent={accent} reduced={reduced} />
      ) : spec.kind === "plant_parts" ? (
        <PlantParts accent={accent} reduced={reduced} />
      ) : spec.kind === "life_cycle" ? (
        <LifeCycle stages={spec.stages} accent={accent} reduced={reduced} />
      ) : spec.kind === "food_chain" ? (
        <FoodChain links={spec.links} accent={accent} reduced={reduced} />
      ) : spec.kind === "material_property" ? (
        <MaterialProperty
          property={spec.property}
          test={spec.test}
          passLabel={spec.passLabel}
          failLabel={spec.failLabel}
          accent={accent}
          reduced={reduced}
        />
      ) : (
        <CellDiagram accent={accent} reduced={reduced} />
      )}
    </motion.div>
  );
}
