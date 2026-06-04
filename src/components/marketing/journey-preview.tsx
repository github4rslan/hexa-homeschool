"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { JOURNEY } from "@/lib/data/journey";

const STEP_WORDS = ["One", "Two", "Three", "Four", "Five", "Six"];

export function JourneyPreview() {
  return (
    <Section>
      <SectionHeader
        eyebrow="How it works"
        title={
          <>
            Understand. Plan. Learn. Assess. Prove.{" "}
            <span className="text-gradient-forest">Decide.</span>
          </>
        }
        description="Six clear steps — from the Day One diagnostic to sitting the exam when your child is genuinely ready. Organised, achievable, and completely under control."
      />

      <div className="mt-16 max-w-3xl mx-auto flex flex-col">
        {JOURNEY.map((step, i) => {
          const Icon =
            (Icons as unknown as Record<
              string,
              React.ComponentType<{ className?: string }>
            >)[step.icon] ?? Icons.Circle;
          const isLast = i === JOURNEY.length - 1;

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="relative flex gap-6 pb-10"
            >
              {/* Timeline rail */}
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-forest-700 text-linen-50 ring-forest">
                  <Icon className="h-6 w-6" />
                </div>
                {!isLast && (
                  <span className="mt-2 w-px flex-1 bg-forest-900/15" />
                )}
              </div>

              <div className="pt-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs uppercase tracking-wider text-clay-600">
                    Step {STEP_WORDS[i]}
                  </span>
                  <span className="rounded-full bg-clay-50 border border-clay-200 px-2.5 py-0.5 text-[11px] font-medium text-clay-700">
                    {step.timing}
                  </span>
                </div>
                <h3 className="mt-2 font-editorial text-2xl font-semibold tracking-tight text-forest-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-ink-600">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/how-it-works"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors group"
        >
          Walk through the full journey
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  );
}
