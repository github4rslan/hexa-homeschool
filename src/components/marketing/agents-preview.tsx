"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { AGENTS } from "@/lib/data/agents";

export function AgentsPreview() {
  return (
    <Section id="agents" className="relative bg-forest-50/40 border-y border-forest-900/5">
      <SectionHeader
        eyebrow="The AI system"
        title={
          <>
            Six experts. One purpose.{" "}
            <span className="text-gradient-forest">Your child&apos;s success.</span>
          </>
        }
        description="Each agent handles a specific task. Diagnosis. Teaching. Assessment. Planning. Compliance. Quality control. Every output is checked before it reaches your child. Humans step in only when needed."
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        transition={{ staggerChildren: 0.07 }}
        className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
      >
        {AGENTS.map((agent) => (
          <motion.div
            key={agent.id}
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="card-warm rounded-2xl p-6 h-full"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xs uppercase tracking-widest text-clay-600">
                {agent.number}
              </span>
              <span className="h-px flex-1 bg-forest-900/10" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-forest-900">
              {agent.name}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              {agent.plainSummary}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-12 text-center">
        <Link
          href="/safety"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors group"
        >
          Learn more about our safety architecture
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  );
}
