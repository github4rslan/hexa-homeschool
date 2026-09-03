"use client";

import { m } from "motion/react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { JOURNEY } from "@/lib/data/journey";
import { AGENTS } from "@/lib/data/agents";
import { journeyIcon } from "./journey-icon";

export function JourneyTimeline() {
  return (
    <section className="relative py-20">
      <Container size="lg">
        <div className="relative">
          {/* Vertical timeline rail */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-violet-400/30 to-transparent md:-translate-x-px" />

          <div className="flex flex-col gap-24">
            {JOURNEY.map((step, i) => {
              const Icon = journeyIcon(step.icon);
              const agentNames = step.agentIds
                .map((id) => AGENTS.find((a) => a.id === id)?.shortName)
                .filter(Boolean);

              return (
                <m.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="relative grid md:grid-cols-2 gap-10 items-center"
                >
                  {/* Node on the rail */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-xl scale-150" />
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-full glass-strong border-2 border-violet-400/50">
                        <Icon className="h-6 w-6 text-violet-300" />
                      </div>
                    </div>
                  </div>

                  {/* Content (alternates left / right on desktop) */}
                  <div
                    className={`pl-24 md:pl-0 ${
                      i % 2 === 0 ? "md:pr-20 md:text-right" : "md:col-start-2 md:pl-20"
                    }`}
                  >
                    <div className={`flex items-center gap-3 mb-4 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                      <span className="font-mono text-xs uppercase tracking-widest text-fog-500">
                        Step {step.step.toString().padStart(2, "0")}
                      </span>
                      <Badge variant="violet" size="sm">
                        {step.timing}
                      </Badge>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-fog-50 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-base text-fog-300 leading-relaxed mb-3">
                      {step.description}
                    </p>
                    <p className="text-sm text-fog-400 leading-relaxed italic">
                      {step.detail}
                    </p>

                    {agentNames.length > 0 && (
                      <div className={`mt-5 flex flex-wrap gap-2 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                        {agentNames.map((name) => (
                          <Badge key={name} variant="outline" size="sm">
                            {name} Agent
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Spacer for the other side */}
                  <div className="hidden md:block" />
                </m.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
