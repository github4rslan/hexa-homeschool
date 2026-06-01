"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />

      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative flex flex-col items-center text-center gap-8"
        >
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-fog-50 leading-[1.05]">
            Don't wait
            <br />
            for the letter.
            <br />
            <span className="text-gradient-aurora">Be ready now.</span>
          </h2>

          <p className="max-w-xl text-lg text-fog-300 leading-relaxed">
            Start with a free 60-minute diagnostic. See exactly where your child
            stands against GCSE standards — then learn at their pace and sit when ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button href="/signup" variant="primary" size="xl">
              Start free diagnostic
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button href="/contact" variant="secondary" size="xl">
              Talk to the team
            </Button>
          </div>

          <p className="text-xs text-fog-500 mt-2">
            No card required · 14-day trial · Cancel anytime
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
