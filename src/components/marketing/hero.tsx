"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Magnetic } from "@/components/fx/magnetic";

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

const TRUST = [
  "UK GDPR compliant",
  "AES-256 encrypted",
  "Children's Code certified",
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center pt-14 pb-24 overflow-hidden"
    >
      {/* Warm peace-of-mind wash + soft geometry */}
      <div className="absolute inset-0 bg-warm-hero pointer-events-none" />
      <div
        aria-hidden
        className="absolute -top-32 -right-24 h-[460px] w-[460px] rounded-full bg-clay-200/40 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-24 h-[460px] w-[460px] rounded-full bg-forest-200/40 blur-[130px] pointer-events-none"
      />

      <Container>
        <motion.div
          style={{ opacity, y }}
          className="mx-auto max-w-4xl flex flex-col items-center text-center gap-8 relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-clay-300 bg-clay-50 px-4 py-1.5 text-xs font-medium tracking-wide text-clay-700"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>The AI assistant built for UK homeschooling families</span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.12, delayChildren: 0.15 }}
            className="font-editorial text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-forest-900 leading-[1.04] text-balance"
          >
            <motion.span variants={wordVariants} className="block">
              The AI assistant built for UK homeschooling
            </motion.span>
            <motion.span variants={wordVariants} className="block">
              families who want{" "}
              <span className="text-gradient-forest italic">freedom</span>{" "}
              without fear.
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-lg md:text-xl text-ink-700 max-w-2xl leading-relaxed"
          >
            Edway plans your child&apos;s learning, teaches daily lessons, tracks
            every step, and generates the evidence Local Authorities need. All in
            one place.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="text-base md:text-lg text-forest-700 font-editorial italic max-w-2xl"
          >
            No more Sunday-night planning. No more guessing if you are doing
            enough. No more dread when the council writes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-3 items-center"
          >
            <Magnetic>
              <Button href="/signup" variant="forest" size="lg">
                Start your free assessment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Magnetic>
            <Button href="/how-it-works" variant="warm-outline" size="lg">
              See how it works
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-sm text-ink-500"
          >
            14-day trial. No card required. Cancel anytime.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.15 }}
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-xs text-ink-600"
          >
            {TRUST.map((badge) => (
              <div key={badge} className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-forest-500" />
                <span>{badge}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
