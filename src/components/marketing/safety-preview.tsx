"use client";

import Link from "next/link";
import { m } from "motion/react";
import { ArrowRight, MessageSquareWarning, RefreshCw, Scale } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";

const SCENARIOS = [
  {
    icon: MessageSquareWarning,
    n: "Scenario 1",
    quote: "Your child types “I give up.”",
    action:
      "The lesson pauses. You are notified. A tutor is available within fifteen minutes.",
  },
  {
    icon: RefreshCw,
    n: "Scenario 2",
    quote: "Three wrong answers in a row.",
    action: "The system adjusts. A human teacher reviews.",
  },
  {
    icon: Scale,
    n: "Scenario 3",
    quote: "The Local Authority initiates an investigation.",
    action: "An education solicitor is engaged within four hours.",
  },
];

export function SafetyPreview() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Safety net"
        title={
          <>
            When AI reaches its limit,{" "}
            <span className="text-gradient-forest">humans take over.</span>
          </>
        }
      />

      <div className="mt-14 max-w-4xl mx-auto rounded-3xl border-2 border-forest-600/20 bg-linen-50 p-6 md:p-10 ring-forest">
        <div className="grid md:grid-cols-3 gap-5">
          {SCENARIOS.map((s, i) => (
            <m.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col gap-3"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-forest-700 text-linen-50">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-clay-600">
                {s.n}
              </span>
              <p className="font-editorial text-lg italic text-forest-900 leading-snug">
                {s.quote}
              </p>
              <p className="text-sm leading-relaxed text-ink-600">{s.action}</p>
            </m.div>
          ))}
        </div>

        <p className="mt-8 pt-6 border-t border-forest-900/10 text-center font-editorial text-lg md:text-xl text-forest-900">
          Your child&apos;s safety and your family&apos;s protection are
          non-negotiable.
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/safety"
          className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900 transition-colors group"
        >
          Read our full safety policy
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  );
}
