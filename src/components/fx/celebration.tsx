"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Child-mode celebration burst (correct answers, mastery).
 *
 * Safety/comfort constraints (see ui-enterprise-polish.md — non-negotiable):
 * - fires only AFTER an answer; never while a child reads or thinks
 * - finishes in ≤1.5s and never blocks input (pointer-events-none overlay)
 * - smooth fades only — nothing flashes (WCAG 2.3.1, ≤3 flashes/sec)
 * - prefers-reduced-motion → a single static star, no movement
 * - warm palette tones, rewarding but not babyish
 */

const VARIANTS: { glyph: string; colors: string[] }[] = [
  { glyph: "★", colors: ["#A78BFA", "#FBBF24", "#67E8F9"] },
  { glyph: "✦", colors: ["#FBBF24", "#A78BFA", "#6EFFC6"] },
  { glyph: "●", colors: ["#67E8F9", "#A78BFA", "#FBBF24"] },
  { glyph: "✶", colors: ["#6EFFC6", "#FBBF24", "#A78BFA"] },
];

export function Celebration({
  variant = 0,
  big = false,
}: {
  /** Pick 0–3 (e.g. question index % 4) so it doesn't feel mechanical. */
  variant?: number;
  /** Mastery moment: more particles, wider burst. */
  big?: boolean;
}) {
  const reduced = useReducedMotion();
  const v = VARIANTS[((variant % 4) + 4) % 4];

  if (reduced) {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute -top-2 right-2 text-2xl"
        style={{ color: v.colors[0] }}
      >
        ★
      </span>
    );
  }

  const count = big ? 14 : 9;
  const radius = big ? 120 : 64;
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius * (i % 2 === 0 ? 1 : 0.7),
      y: Math.sin(angle) * radius * (i % 2 === 0 ? 1 : 0.7),
      color: v.colors[i % v.colors.length],
      size: big ? (i % 2 === 0 ? 26 : 18) : i % 2 === 0 ? 18 : 13,
    };
  });

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible"
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute leading-none"
          style={{ color: p.color, fontSize: p.size }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0.4, 1, 0.7] }}
          transition={{ duration: big ? 1.4 : 1.0, ease: "easeOut" }}
        >
          {v.glyph}
        </motion.span>
      ))}
    </span>
  );
}
