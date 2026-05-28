"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  Brain,
  ClipboardCheck,
  Eye,
  FileCheck,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/fx/spotlight";

const FEATURES = [
  {
    icon: Activity,
    title: "60-min adaptive diagnostic",
    description:
      "Item Response Theory entry model establishes baseline competencies in a single sitting.",
    accent: "violet",
  },
  {
    icon: Brain,
    title: "Per-child cognitive typology",
    description:
      "Persistent learner profile guides every subsequent lesson, drill and assessment.",
    accent: "cyan",
  },
  {
    icon: BookOpen,
    title: "Daily 45–60 min sessions",
    description:
      "Multi-modal video, drilling and mastery enforcement. Calibrated to attention spans.",
    accent: "neon",
  },
  {
    icon: ClipboardCheck,
    title: "Monthly simulated mocks",
    description:
      "Full GCSE paper conditions. Auto-graded with grade prediction and confidence intervals.",
    accent: "violet",
  },
  {
    icon: FileCheck,
    title: "Auto-compiled LA portfolios",
    description:
      "SHA-256 signed dossiers in statutory Breadth/Balance/Progression format.",
    accent: "cyan",
  },
  {
    icon: Users,
    title: "Marketplace tutor fallback",
    description:
      "Verified human tutors dispatched within 15 minutes on persistent concept blocks.",
    accent: "neon",
  },
  {
    icon: Eye,
    title: "Parent monitoring dashboard",
    description:
      "Live activity feed, predicted grades, compliance status, lesson velocity.",
    accent: "violet",
  },
  {
    icon: Lock,
    title: "AES-256 · UK data residency",
    description:
      "Storage localised to AWS London. TLS 1.3 everywhere. Children's Code by default.",
    accent: "cyan",
  },
  {
    icon: Sparkles,
    title: "ElevenLabs voice synthesis",
    description:
      "Lesson narration in natural, age-appropriate voices. Multi-modal by design.",
    accent: "neon",
  },
];

const accentClasses = {
  violet: { bg: "bg-violet-500/10", border: "border-violet-400/30", text: "text-violet-300", spot: "rgba(167,139,250,0.15)" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-400/30", text: "text-cyan-400", spot: "rgba(0,212,255,0.15)" },
  neon: { bg: "bg-neon-500/10", border: "border-neon-400/30", text: "text-neon-400", spot: "rgba(6,255,165,0.15)" },
};

export function FeatureGrid() {
  return (
    <Section>
      <SectionHeader
        eyebrow="What's inside"
        title={
          <>
            Every primitive you need.
            <br />
            <span className="text-gradient-violet">Nothing you don't.</span>
          </>
        }
        description="HEXA is purpose-built for one outcome — GCSEs at 14 — and shipped with the exact toolkit to get there."
      />

      <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => {
          const c = accentClasses[f.accent as keyof typeof accentClasses];
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
            >
              <Spotlight color={c.spot} className="rounded-2xl h-full">
                <Card variant="glass" padding="lg" interactive className="h-full">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${c.bg} ${c.border} mb-5`}
                  >
                    <f.icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-fog-50 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-fog-400">
                    {f.description}
                  </p>
                </Card>
              </Spotlight>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
