"use client";

import { motion } from "framer-motion";
import { CalendarX, FileWarning, HelpCircle } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";

const PAINS = [
  {
    icon: CalendarX,
    title: "Hours lost to planning",
    body: "Parents spend hours every week planning lessons, finding resources, and building a syllabus from scratch.",
  },
  {
    icon: HelpCircle,
    title: "Constant second-guessing",
    body: "Are we covering the right things? Is my child falling behind? There's never a clear answer.",
  },
  {
    icon: FileWarning,
    title: "Fear when the council writes",
    body: "Spreadsheets and photo folders feel thin. You need proof that your education is suitable.",
  },
];

export function Problem() {
  return (
    <Section>
      <SectionHeader
        eyebrow="The problem"
        title={
          <>
            Homeschooling is harder
            <br />
            <span className="text-gradient-aurora">than it should be.</span>
          </>
        }
        description="When the council asks questions, anxiety spikes. You shouldn't have to choose between freedom and proof."
      />

      <div className="mt-20 grid md:grid-cols-3 gap-5">
        {PAINS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Card variant="glass" padding="lg" className="h-full">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-crimson-400/30 bg-crimson-500/10 mb-5">
                <p.icon className="h-5 w-5 text-crimson-400" />
              </div>
              <h3 className="text-base font-semibold tracking-tight text-fog-50 mb-2">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-fog-400">{p.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="mt-12 text-center text-lg font-medium text-fog-100">
        HEXA solves this.
      </p>
    </Section>
  );
}
