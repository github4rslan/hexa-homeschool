"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { SAFETY_TRIGGERS } from "@/lib/data/safety";
import { cn } from "@/lib/utils";

const severityStyles = {
  immediate: {
    badge: "bg-crimson-500/20 text-crimson-400 border-crimson-400/40",
    dot: "bg-crimson-400",
    label: "IMMEDIATE",
  },
  critical: {
    badge: "bg-crimson-500/15 text-crimson-400 border-crimson-400/30",
    dot: "bg-crimson-400",
    label: "5 MIN",
  },
  high: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-400/30",
    dot: "bg-amber-400",
    label: "15 MIN",
  },
  medium: {
    badge: "bg-violet-500/15 text-violet-300 border-violet-400/30",
    dot: "bg-violet-400",
    label: "1–4 HOURS",
  },
  low: {
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-400/30",
    dot: "bg-cyan-400",
    label: "24 HOURS",
  },
};

export function SafetyPreview() {
  return (
    <Section>
      <SectionHeader
        eyebrow="The Safety Net"
        title={
          <>
            When AI hits its limit,
            <br />
            <span className="text-gradient-aurora">humans take over.</span>
          </>
        }
        description="Seven structurally enforced escalation gateways with explicit SLAs. The system halts and transfers to humans the moment defined behavioural criteria are met."
      />

      <div className="mt-20 max-w-4xl mx-auto">
        <Card variant="glass-strong" padding="none" className="overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-[10px] uppercase tracking-widest text-fog-500 font-mono">
            <div className="col-span-1">SLA</div>
            <div className="col-span-4">Trigger</div>
            <div className="col-span-7">Action</div>
          </div>

          {SAFETY_TRIGGERS.map((trigger, i) => {
            const style = severityStyles[trigger.severity];
            return (
              <motion.div
                key={trigger.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <div className="col-span-1 flex items-start">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold border whitespace-nowrap",
                    style.badge,
                  )}>
                    <span className={cn("h-1 w-1 rounded-full animate-pulse", style.dot)} />
                    {style.label}
                  </span>
                </div>
                <div className="col-span-4 flex flex-col gap-1">
                  <span className="text-sm font-semibold text-fog-100 flex items-center gap-2">
                    {trigger.severity === "immediate" && (
                      <ShieldAlert className="h-3.5 w-3.5 text-crimson-400 shrink-0" />
                    )}
                    {trigger.name}
                  </span>
                  <span className="text-xs text-fog-400 leading-relaxed">
                    {trigger.condition}
                  </span>
                </div>
                <div className="col-span-7">
                  <span className="text-xs text-fog-300 leading-relaxed">
                    {trigger.action}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </Card>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-fog-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            Automation never overrides safeguarding. Statutory bodies are
            contacted directly on risk vectors.
          </span>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/safety"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors group"
        >
          Full safety architecture
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  );
}
