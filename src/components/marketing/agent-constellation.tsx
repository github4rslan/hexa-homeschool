"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AGENTS } from "@/lib/data/agents";
import { cn } from "@/lib/utils";

const colorMap = {
  violet: { bg: "rgb(124, 58, 237)", glow: "rgba(124, 58, 237, 0.6)" },
  neon: { bg: "rgb(6, 255, 165)", glow: "rgba(6, 255, 165, 0.6)" },
  cyan: { bg: "rgb(0, 212, 255)", glow: "rgba(0, 212, 255, 0.6)" },
  amber: { bg: "rgb(251, 191, 36)", glow: "rgba(251, 191, 36, 0.6)" },
  crimson: { bg: "rgb(239, 68, 68)", glow: "rgba(239, 68, 68, 0.6)" },
  fog: { bg: "rgb(167, 170, 200)", glow: "rgba(167, 170, 200, 0.6)" },
};

interface ConstellationProps {
  size?: number;
  className?: string;
}

/**
 * Round to 2dp so server and client render byte-identical coordinate strings,
 * avoiding React hydration mismatches from floating-point trig.
 */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Animated constellation of the six Edway agents orbiting a central node.
 * Self-contained, no external state.
 */
export function AgentConstellation({ size = 560, className }: ConstellationProps) {
  const radius = size / 2.6;
  const center = size / 2;

  // Render the animated layers only after mount so the server-rendered HTML
  // (an empty sized box) always matches the first client paint. This removes
  // Framer Motion initial-state hydration mismatches on a purely decorative element.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn("relative", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Ambient glow */}
      <div
        className="absolute rounded-full blur-3xl opacity-50"
        style={{
          left: center - size / 3,
          top: center - size / 3,
          width: (size * 2) / 3,
          height: (size * 2) / 3,
          background: "radial-gradient(circle, rgba(124,58,237,0.4), transparent 70%)",
        }}
      />

      {/* SVG orbit rings & connections */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        fill="none"
      >
        <defs>
          <radialGradient id="ring-fade">
            <stop offset="50%" stopColor="rgba(167, 139, 250, 0)" />
            <stop offset="100%" stopColor="rgba(167, 139, 250, 0.15)" />
          </radialGradient>
          <linearGradient id="orbit-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(167, 139, 250, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 212, 255, 0.3)" />
          </linearGradient>
        </defs>

        {/* Outer orbit ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#orbit-stroke)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.6"
        />
        <circle
          cx={center}
          cy={center}
          r={radius * 0.55}
          stroke="rgba(167, 139, 250, 0.15)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />

        {/* Spokes from centre to each agent */}
        {AGENTS.map((agent) => {
          const rad = (agent.angle * Math.PI) / 180;
          const x = r2(center + radius * Math.cos(rad));
          const y = r2(center + radius * Math.sin(rad));
          return (
            <motion.line
              key={`spoke-${agent.id}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(167, 139, 250, 0.18)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.2,
                delay: 0.4 + AGENTS.indexOf(agent) * 0.1,
                ease: "easeOut",
              }}
            />
          );
        })}

        {/* Pulse circles travelling along spokes */}
        {AGENTS.map((agent, i) => {
          const rad = (agent.angle * Math.PI) / 180;
          const color = colorMap[agent.color].bg;
          return (
            <motion.circle
              key={`pulse-${agent.id}`}
              r="2"
              fill={color}
              initial={{ cx: center, cy: center, opacity: 0 }}
              animate={{
                cx: [center, r2(center + radius * Math.cos(rad))],
                cy: [center, r2(center + radius * Math.sin(rad))],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2.5,
                delay: 1.5 + i * 0.3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>

      {/* Centre node (Edway core) */}
      <motion.div
        className="absolute flex items-center justify-center"
        style={{
          left: center - 48,
          top: center - 48,
          width: 96,
          height: 96,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 opacity-30 blur-2xl animate-pulse" />
        <div className="relative h-full w-full rounded-full glass-strong border-2 border-violet-400/40 flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 6L40 15V33L24 42L8 33V15L24 6Z"
              stroke="url(#hexa-grad)"
              strokeWidth="2"
              fill="none"
            />
            <defs>
              <linearGradient id="hexa-grad" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#00D4FF" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="3" fill="#06FFA5" />
          </svg>
        </div>
      </motion.div>

      {/* Agent nodes */}
      {AGENTS.map((agent, i) => {
        const rad = (agent.angle * Math.PI) / 180;
        const x = r2(center + radius * Math.cos(rad));
        const y = r2(center + radius * Math.sin(rad));
        const color = colorMap[agent.color];

        return (
          <motion.div
            key={agent.id}
            className="absolute"
            style={{
              left: r2(x - 36),
              top: r2(y - 36),
              width: 72,
              height: 72,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.8 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <motion.div
              className="relative h-full w-full rounded-2xl glass-strong border flex flex-col items-center justify-center"
              style={{
                borderColor: color.bg,
                boxShadow: `0 0 30px -10px ${color.glow}`,
              }}
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              <span
                className="text-[10px] font-mono uppercase tracking-wider opacity-70"
                style={{ color: color.bg }}
              >
                {agent.number}
              </span>
              <span className="text-xs font-semibold text-fog-100 leading-tight text-center px-1">
                {agent.shortName}
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
