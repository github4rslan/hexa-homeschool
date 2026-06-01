"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Magnetic } from "@/components/fx/magnetic";
import { AgentConstellation } from "./agent-constellation";

const HEADLINE_PARTS = [
  { text: "Teach with confidence.", className: "" },
  { text: "Prove with evidence.", className: "text-gradient-aurora" },
];

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 60, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const constellationScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center pt-10 pb-20 overflow-hidden"
    >
      {/* Ambient meshes */}
      <div className="absolute inset-0 bg-mesh-hero opacity-90 pointer-events-none" />
      <motion.div
        className="absolute top-1/4 -left-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <Container>
        <motion.div
          style={{ opacity, y }}
          className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center"
        >
          {/* Left — copy */}
          <div className="flex flex-col gap-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 self-start rounded-full border border-violet-400/30 bg-violet-500/5 px-4 py-1.5 text-xs font-medium tracking-wide text-violet-300 backdrop-blur-sm"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
              </span>
              <Sparkles className="h-3.5 w-3.5" />
              <span>The AI assistant built for UK homeschooling families</span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
              className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-fog-50 leading-[0.95]"
            >
              {HEADLINE_PARTS.map((part, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className={`block ${part.className}`}
                >
                  {part.text}
                </motion.span>
              ))}
              <motion.span
                variants={wordVariants}
                className="block text-fog-300 text-3xl md:text-4xl lg:text-5xl font-normal mt-2 tracking-tight"
              >
                Sit when ready.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="text-lg md:text-xl text-fog-300 max-w-xl leading-relaxed"
            >
              HEXA plans your child's learning, teaches daily lessons in Maths,
              English and Science, tracks every step, and generates the
              <span className="text-fog-100"> evidence Local Authorities need </span>
              — all in one place. Not rushed. Not forced. Built in the UK.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Magnetic>
                <Button href="/signup" variant="primary" size="lg">
                  Start free diagnostic
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Magnetic>
              <Button href="/how-it-works" variant="secondary" size="lg">
                See how it works
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-wrap items-center gap-5 pt-4 text-xs text-fog-400"
            >
              {[
                "UK GDPR compliant",
                "AES-256 encrypted",
                "Children's Code certified",
              ].map((badge, i) => (
                <div key={badge} className="flex items-center gap-3">
                  {i > 0 && <span className="text-fog-700">·</span>}
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-neon-400" />
                    <span>{badge}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — constellation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ scale: constellationScale }}
            className="hidden lg:flex justify-center items-center relative"
          >
            <AgentConstellation size={560} />
          </motion.div>

          {/* Mobile constellation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="lg:hidden flex justify-center items-center relative"
          >
            <AgentConstellation size={340} />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <Link
            href="#stats"
            className="group flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-fog-500 hover:text-fog-200 transition-colors"
          >
            <span>Scroll to explore</span>
            <motion.span
              className="block w-px h-12 bg-gradient-to-b from-violet-400 to-transparent"
              animate={{ scaleY: [1, 0.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "top" }}
            />
          </Link>
        </motion.div>
      </Container>
    </section>
  );
}
