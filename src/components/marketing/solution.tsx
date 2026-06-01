"use client";

import { motion } from "framer-motion";
import { Building2, Users } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SUBJECTS = ["Maths", "English", "Science"];

const AUDIENCES = [
  {
    icon: Users,
    label: "For parents",
    title: "Daily lessons planned for you.",
    body: "Progress tracked automatically. Council paperwork generated in one click. You focus on your child, not the admin.",
    color: "violet" as const,
  },
  {
    icon: Building2,
    label: "For Local Authorities",
    title: "Professional, verified portfolios.",
    body: "Cryptographic integrity. Clear evidence of intent, implementation, and impact. No ambiguity. No disputes.",
    color: "cyan" as const,
  },
];

const audienceClasses = {
  violet: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-400",
};

export function Solution() {
  return (
    <Section className="relative">
      <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />

      <SectionHeader
        eyebrow="The solution"
        title={
          <>
            Three core subjects.
            <br />
            One clear path. <span className="text-gradient-violet">Full protection.</span>
          </>
        }
        description="Mapped to GCSE specifications from day one. Not rushed. Not forced. Your child progresses at their pace, with full visibility on where they stand."
      />

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {SUBJECTS.map((s) => (
          <Badge key={s} variant="violet" size="md">
            {s}
          </Badge>
        ))}
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-5">
        {AUDIENCES.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <Card variant="glass-strong" padding="xl" className="h-full">
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${audienceClasses[a.color]} mb-5`}
              >
                <a.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500">
                {a.label}
              </span>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-fog-50">
                {a.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fog-300">
                {a.body}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
