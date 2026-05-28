"use client";

import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JOURNEY } from "@/lib/data/journey";

export function JourneyPreview() {
  return (
    <Section>
      <SectionHeader
        eyebrow="The Journey"
        title={
          <>
            From Day 1 diagnostic
            <br />
            to <span className="text-gradient-aurora">GCSE entry at 14</span>
          </>
        }
        description="A precisely sequenced six-stage path that compresses the traditional GCSE journey into 24 months — without skipping a single specification point."
      />

      <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {JOURNEY.map((step, i) => {
          const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[step.icon] ?? Icons.Circle;

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            >
              <Card
                variant="glass"
                padding="lg"
                interactive
                glow="violet"
                className="h-full"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl glass-violet">
                      <Icon className="h-5 w-5 text-violet-300" />
                    </div>
                    <span className="font-mono text-xs uppercase tracking-wider text-fog-500">
                      Step {step.step.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <Badge variant="violet" size="sm">
                    {step.timing}
                  </Badge>
                </div>

                <h3 className="text-xl font-semibold tracking-tight text-fog-50 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-fog-300">
                  {step.description}
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/how-it-works"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors group"
        >
          Walk through the full journey
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </Section>
  );
}
