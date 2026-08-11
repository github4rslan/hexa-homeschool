"use client";

import { m, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { CountUp } from "@/components/fx/count-up";

interface Stat {
  prefix?: string;
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
}

const STATS: Stat[] = [
  { value: 3, label: "Core subjects — Maths, English & Science" },
  { value: 6, label: "Specialised AI agents working in concert" },
  { value: 100, suffix: "%", label: "Continuous Meta Checker audit coverage" },
  { value: 24, suffix: "/7", label: "Automated Local Authority compliance" },
];

export function StatsStrip() {
  const reduceMotion = useReducedMotion();
  return (
    <section
      id="stats"
      className="relative py-16 border-y border-forest-900/10 bg-linen-50/60"
    >
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat, i) => (
            <m.div
              key={stat.label}
              // Reduced-motion: no translate/fade-in, render in place (WCAG 2.3.3).
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col gap-2"
            >
              <span className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient-violet">
                <CountUp
                  end={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </span>
              <span className="text-sm text-fog-400 leading-snug">
                {stat.label}
              </span>
            </m.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
