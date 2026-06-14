"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Lock, Sparkles, RefreshCw } from "lucide-react";
import type { TopicMapNode } from "@/lib/db/repo";

/**
 * One subject's visual learning path. Certified nodes glow, the current topic
 * (first non-certified, non-locked — or the first locked one if none are in
 * training) pulses gently, locked nodes are muted but visible so the child can
 * see the journey ahead. Tapping a node reveals a one-line status; locked nodes
 * never navigate anywhere. Respects prefers-reduced-motion.
 */

const ACCENT: Record<string, { glow: string; ring: string; text: string; bar: string }> = {
  violet: {
    glow: "shadow-[0_0_24px_-6px_rgba(139,92,246,0.7)]",
    ring: "border-violet-400/60 bg-violet-500/15",
    text: "text-violet-200",
    bar: "from-violet-500 to-violet-400",
  },
  cyan: {
    glow: "shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)]",
    ring: "border-cyan-400/60 bg-cyan-500/15",
    text: "text-cyan-200",
    bar: "from-cyan-500 to-cyan-400",
  },
  neon: {
    glow: "shadow-[0_0_24px_-6px_rgba(132,204,22,0.7)]",
    ring: "border-neon-400/60 bg-neon-500/15",
    text: "text-neon-200",
    bar: "from-neon-500 to-neon-400",
  },
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Whole days from now until `d`; null when `d` is past or missing. */
function daysUntil(d: Date | null): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function SubjectPath({
  label,
  accent,
  nodes,
  highlightTag,
}: {
  label: string;
  accent: string;
  nodes: TopicMapNode[];
  /** A topic to open + glow on load (deep-linked from a lesson celebration). */
  highlightTag?: string;
}) {
  const reduce = useReducedMotion();
  const palette = ACCENT[accent] ?? ACCENT.violet;
  const [openTag, setOpenTag] = useState<string | null>(highlightTag ?? null);

  // Scroll the deep-linked node into view (client nav doesn't honour the hash).
  useEffect(() => {
    if (!highlightTag) return;
    const el = document.getElementById(`topic-${highlightTag}`);
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [highlightTag, reduce]);

  const certifiedCount = nodes.filter((n) => n.state === "certified").length;
  // The "current" node: first one in training, else first locked one.
  const currentIndex = (() => {
    const t = nodes.findIndex((n) => n.state === "training");
    if (t !== -1) return t;
    return nodes.findIndex((n) => n.state === "locked");
  })();

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold text-fog-50">{label}</h2>
        <span className={`text-sm font-semibold ${palette.text}`}>
          {certifiedCount} of {nodes.length} mastered
        </span>
      </div>

      <ol className="relative flex flex-col gap-3 pl-2">
        {nodes.map((node, i) => {
          const isCurrent = i === currentIndex;
          const open = openTag === node.topicTag;
          const highlighted = highlightTag === node.topicTag;
          const reviewInDays = node.needsRefresh
            ? null
            : daysUntil(node.nextReviewAt);
          const status =
            node.state === "certified"
              ? node.needsRefresh
                ? `Mastered ${formatDate(node.certifiedAt)} · ready for a quick refresh`
                : reviewInDays !== null
                  ? `You mastered this${node.certifiedAt ? ` on ${formatDate(node.certifiedAt)}` : ""} · review comes up in ${reviewInDays} ${reviewInDays === 1 ? "day" : "days"}`
                  : `You mastered this${node.certifiedAt ? ` on ${formatDate(node.certifiedAt)}` : ""}`
              : node.state === "training"
                ? "You're here — keep going!"
                : "Coming up on your path";

          const icon =
            node.state === "certified" ? (
              node.needsRefresh ? (
                <RefreshCw className="h-6 w-6" />
              ) : (
                <Check className="h-6 w-6" />
              )
            ) : node.state === "training" ? (
              <Sparkles className="h-6 w-6" />
            ) : (
              <Lock className="h-5 w-5" />
            );

          return (
            <li
              key={node.topicTag}
              id={`topic-${node.topicTag}`}
              className="flex items-start gap-4 scroll-mt-24"
            >
              <motion.button
                type="button"
                onClick={() => setOpenTag(open ? null : node.topicTag)}
                aria-expanded={open}
                className={[
                  "child-touch relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                  node.state === "certified"
                    ? `${palette.ring} ${palette.text} ${node.needsRefresh ? "" : palette.glow}`
                    : node.state === "training"
                      ? `${palette.ring} ${palette.text}`
                      : "border-white/10 bg-white/[0.03] text-fog-600",
                  highlighted ? `${palette.glow} ring-2 ring-offset-2 ring-offset-void` : "",
                ].join(" ")}
                animate={
                  isCurrent && node.state === "training" && !reduce
                    ? { scale: [1, 1.06, 1] }
                    : {}
                }
                transition={
                  isCurrent && !reduce
                    ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
              >
                {icon}
              </motion.button>

              <div className="flex-1 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenTag(open ? null : node.topicTag)}
                  className="child-touch text-left"
                >
                  <div
                    className={
                      node.state === "locked"
                        ? "text-lg font-medium text-fog-500"
                        : "text-lg font-semibold text-fog-100"
                    }
                  >
                    {node.title}
                  </div>
                  <div className="text-sm text-fog-500">{node.workingGradeBand}</div>
                </button>
                {open && (
                  <motion.p
                    initial={reduce ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-1.5 text-sm ${node.state === "locked" ? "text-fog-500" : palette.text}`}
                  >
                    {status}
                  </motion.p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
