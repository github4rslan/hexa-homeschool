"use client";

import { m } from "motion/react";
import { Section } from "@/components/ui/section";

/**
 * Section C (Problem half). Brief: the problem should feel intimate and real —
 * isolated text blocks — before breaking into the organised solution space.
 */
const QUESTIONS = [
  "Are we covering the right things?",
  "Is my child falling behind?",
  "Will the Local Authority accept our evidence?",
];

export function Problem() {
  return (
    <Section containerSize="lg">
      <div className="mx-auto max-w-3xl">
        <m.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="font-editorial text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-forest-900 leading-tight"
        >
          Homeschooling is harder than it should be.
        </m.h2>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 text-lg md:text-xl leading-relaxed text-ink-700"
        >
          You spend hours every week planning lessons, finding resources,
          wondering.
        </m.p>

        <div className="mt-6 flex flex-col gap-3">
          {QUESTIONS.map((q, i) => (
            <m.p
              key={q}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="border-l-2 border-clay-400 pl-5 font-editorial text-xl md:text-2xl italic text-forest-800"
            >
              {q}
            </m.p>
          ))}
        </div>

        <m.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 text-lg md:text-xl leading-relaxed text-ink-700"
        >
          When that letter arrives, anxiety spikes. Spreadsheets feel thin. Photo
          folders feel weaker. You need proof that your education is suitable.{" "}
          <span className="font-semibold text-forest-900">You need sleep.</span>
        </m.p>

        <m.p
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 font-editorial text-2xl md:text-3xl font-semibold text-gradient-forest"
        >
          Edway solves this.
        </m.p>
      </div>
    </Section>
  );
}
