"use client";

import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck,
  GraduationCap,
  Map,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DemoStep {
  id: string;
  title: string;
  time: string;
  agent: string;
  icon: React.ComponentType<{ className?: string }>;
  body: string;
  metric?: { label: string; value: string };
  log?: string[];
}

const DEMO: DemoStep[] = [
  {
    id: "diagnostic",
    title: "Day 1 — Diagnostic Assessment",
    time: "60 min",
    agent: "Diagnostic Agent",
    icon: Activity,
    body: "Aisha sits a 60-minute adaptive diagnostic. The Diagnostic Agent injects an initial test vector at Year 11 baseline, then mutates question difficulty using Item Response Theory based on her response pattern.",
    metric: { label: "Baseline confidence", value: "94%" },
    log: [
      "[09:00] Diagnostic Agent initiated · child_id=aisha-m",
      "[09:00] Test vector loaded · baseline=year-11",
      "[09:42] Branch mutation #8 · domain=algebra",
      "[10:00] Diagnostic Guard validated · confidence=94%",
      "[10:00] Output: Predicted grade 7 · Gap: quadratic factoring",
    ],
  },
  {
    id: "planning",
    title: "Week 1 — Curriculum Plan Generated",
    time: "instant",
    agent: "Planning Agent",
    icon: Map,
    body: "The Planning Agent runs constraint-satisfaction over the AQA Mathematics specification (92 topics), Aisha's diagnostic results, and the target exam window (Summer 2028). Output: a 24-month weekly milestone matrix.",
    metric: { label: "Topics scheduled", value: "92 / 92" },
    log: [
      "[10:05] Planning Agent · constraint solver started",
      "[10:05] Inputs · 92 topics · 24-month window · gap-weighted",
      "[10:05] Schedule generated · 96 weekly milestones",
      "[10:05] Planning Guard · 100% specification coverage validated",
      "[10:05] Parent dashboard updated · plan ready for review",
    ],
  },
  {
    id: "lesson",
    title: "Day 12 — Daily Learning Session",
    time: "47 min",
    agent: "Teaching Agent",
    icon: Sparkles,
    body: "Aisha starts her daily session on linear equations. The Teaching Agent generates a personalised explanation via RAG, narrated by ElevenLabs. Mid-session, the Agent detects two consecutive errors and switches to visual modality.",
    metric: { label: "Mastery score", value: "87%" },
    log: [
      "[14:30] Teaching Agent · topic=linear-equations",
      "[14:38] Step error detected · pivoting to visual aid",
      "[14:39] Teaching Guard validated explanation · 96% syntax",
      "[14:42] Mastery check passed · score=87%",
      "[15:17] Competence matrix updated · linear-equations: certified",
    ],
  },
  {
    id: "evaluation",
    title: "Month 3 — Simulated Mock Exam",
    time: "90 min",
    agent: "Assessment Agent",
    icon: ClipboardCheck,
    body: "Aisha sits a full-paper mock under exam conditions. The Assessment Agent grades both multiple-choice and long-form responses, validating against historical paper distributions. Predicted grade updated.",
    metric: { label: "Predicted grade", value: "Grade 8" },
    log: [
      "[10:00] Mock paper · AQA 8300 · sampled 2024 distribution",
      "[11:30] Submission · 47 / 80 raw marks",
      "[11:31] Assessment Guard · rubric alignment verified",
      "[11:32] Regression analysis · trajectory: on-track",
      "[11:32] Predicted grade updated · 7 → 8",
    ],
  },
  {
    id: "compliance",
    title: "Quarter 2 — LA Portfolio Generated",
    time: "auto",
    agent: "Compliance Agent",
    icon: FileCheck,
    body: "The Compliance Agent assembles a statutory dossier covering Breadth, Balance and Progression. Linguistic smoothing produces formal educational language. Every claim references an immutable log entry.",
    metric: { label: "Dossier hash", value: "0x4a9c…ff21" },
    log: [
      "[00:00] Compliance Agent · quarterly cycle initiated",
      "[00:00] Records grouped · Breadth=24 · Balance=18 · Progression=8",
      "[00:01] Linguistic smoothing applied",
      "[00:01] Compliance Guard · 100% references validated",
      "[00:01] SHA-256 signature generated · dossier ready",
    ],
  },
  {
    id: "exam",
    title: "Age 14 — Standardised GCSE Entry",
    time: "exam day",
    agent: "Planning Agent",
    icon: GraduationCap,
    body: "Aisha sits her real GCSE Mathematics paper as a private candidate at her local assessment centre. Edway guided the registration process; the centre confirms entry without issue.",
    metric: { label: "Final result", value: "Grade 8" },
    log: [
      "[08:30] Private candidate entry · Pearson Edexcel 1MA1",
      "[08:30] Centre: AQA-approved private candidate hub · Bristol",
      "[12:00] Exam submitted",
      "[+8 weeks] Results day · Grade 8 · prediction held",
    ],
  },
];

export function DemoWalkthrough() {
  const [step, setStep] = useState(0);
  const current = DEMO[step];
  const Icon = current.icon;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-10">
        {DEMO.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={cn(
              "flex flex-col gap-2 rounded-xl border px-3 py-2 transition-all text-left",
              i === step
                ? "border-violet-400/50 bg-violet-500/10"
                : "border-white/5 hover:border-white/15 bg-white/[0.02]",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-fog-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              {i === step && (
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium leading-tight",
                i === step ? "text-fog-50" : "text-fog-400",
              )}
            >
              {s.id}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card variant="glass-strong" padding="xl" className="overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-10">
              {/* Left — narrative */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/30">
                    <Icon className="h-5 w-5 text-violet-300" />
                  </div>
                  <div>
                    <Badge variant="violet" size="sm">
                      {current.agent}
                    </Badge>
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-fog-500">
                      {current.time}
                    </span>
                  </div>
                </div>

                <h3 className="text-3xl font-semibold tracking-tight text-fog-50 mb-4">
                  {current.title}
                </h3>
                <p className="text-base text-fog-300 leading-relaxed mb-6">
                  {current.body}
                </p>

                {current.metric && (
                  <div className="inline-flex flex-col gap-1 px-5 py-4 rounded-xl border border-neon-400/30 bg-neon-500/5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neon-400">
                      {current.metric.label}
                    </span>
                    <span className="text-3xl font-semibold text-fog-50 font-mono">
                      {current.metric.value}
                    </span>
                  </div>
                )}
              </div>

              {/* Right — terminal log */}
              <div className="rounded-xl bg-black/50 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-crimson-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neon-500/60" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-fog-500 ml-2">
                    edway-system.log
                  </span>
                </div>
                <div className="p-4 font-mono text-xs leading-loose text-fog-300 space-y-1">
                  {current.log?.map((line, i) => (
                    <m.div
                      key={`${current.id}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                      className="flex gap-2"
                    >
                      <span className="text-violet-400 shrink-0">$</span>
                      <span className="text-fog-300">{line}</span>
                    </m.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer controls */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
              <Button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                variant="ghost"
                size="sm"
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-xs text-fog-500 font-mono">
                {step + 1} of {DEMO.length}
              </span>
              <Button
                onClick={() => setStep((s) => Math.min(DEMO.length - 1, s + 1))}
                variant="primary"
                size="sm"
                disabled={step === DEMO.length - 1}
              >
                Next step
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </m.div>
      </AnimatePresence>
    </div>
  );
}
