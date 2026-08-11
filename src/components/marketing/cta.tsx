"use client";

import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-warm-hero pointer-events-none" />

      <Container size="md">
        <m.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative flex flex-col items-center text-center gap-7"
        >
          <h2 className="font-editorial text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-forest-900 leading-[1.05]">
            Teach with confidence.
            <br />
            Prove with evidence.{" "}
            <span className="text-gradient-forest">Sit when ready.</span>
          </h2>

          <p className="max-w-xl text-lg text-ink-700 leading-relaxed">
            Start with a free assessment. See exactly where your child stands
            against GCSE standards — then learn at their pace and sit when ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button href="/signup" variant="forest" size="xl">
              Start your free assessment
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button href="/contact" variant="warm-outline" size="xl">
              Talk to the team
            </Button>
          </div>

          <p className="text-xs text-ink-500 mt-1">
            14-day trial. No card required. Cancel anytime.
          </p>
        </m.div>
      </Container>
    </section>
  );
}
