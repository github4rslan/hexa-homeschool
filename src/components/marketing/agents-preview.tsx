"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/fx/spotlight";
import { AGENTS } from "@/lib/data/agents";
import { cn } from "@/lib/utils";

const colorClasses = {
  violet: {
    dot: "bg-violet-400",
    text: "text-violet-300",
    border: "border-violet-400/30",
    spotlight: "rgba(167, 139, 250, 0.18)",
  },
  neon: {
    dot: "bg-neon-400",
    text: "text-neon-400",
    border: "border-neon-400/30",
    spotlight: "rgba(6, 255, 165, 0.18)",
  },
  cyan: {
    dot: "bg-cyan-400",
    text: "text-cyan-400",
    border: "border-cyan-400/30",
    spotlight: "rgba(0, 212, 255, 0.18)",
  },
  amber: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    border: "border-amber-400/30",
    spotlight: "rgba(251, 191, 36, 0.18)",
  },
  crimson: {
    dot: "bg-crimson-400",
    text: "text-crimson-400",
    border: "border-crimson-400/30",
    spotlight: "rgba(248, 113, 113, 0.18)",
  },
  fog: {
    dot: "bg-fog-300",
    text: "text-fog-200",
    border: "border-fog-400/30",
    spotlight: "rgba(184, 186, 208, 0.18)",
  },
};

export function AgentsPreview() {
  return (
    <Section id="agents" className="relative">
      <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />

      <SectionHeader
        eyebrow="The AI Architecture"
        title={
          <>
            Six specialised agents.
            <br />
            <span className="text-gradient-violet">One coherent system.</span>
          </>
        }
        description="Each agent runs with its own checker validator. A Meta Checker audits 5% of all transactions. Human operators intervene only when SLA-bound triggers fire."
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ staggerChildren: 0.08 }}
        className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {AGENTS.map((agent) => {
          const colors = colorClasses[agent.color];
          return (
            <motion.div
              key={agent.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              <Spotlight color={colors.spotlight} className="rounded-2xl">
                <Card
                  variant="glass"
                  padding="lg"
                  interactive
                  className="h-full"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={cn(
                        "font-mono text-xs uppercase tracking-widest px-3 py-1 rounded-full border",
                        colors.text,
                        colors.border,
                      )}
                    >
                      Agent {agent.number}
                    </span>
                    <span
                      className={cn("h-2 w-2 rounded-full animate-pulse", colors.dot)}
                    />
                  </div>

                  <h3 className="text-xl font-semibold tracking-tight text-fog-50 mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-fog-300 mb-6">
                    {agent.tagline}.
                  </p>

                  <div className="border-t border-white/5 pt-4 mt-auto">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-fog-400 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-fog-200">
                          {agent.checker.name}
                        </span>
                        <span className="text-xs text-fog-500 leading-relaxed line-clamp-2">
                          {agent.checker.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Spotlight>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-12 text-center">
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors group"
        >
          Explore each agent in depth
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  );
}
