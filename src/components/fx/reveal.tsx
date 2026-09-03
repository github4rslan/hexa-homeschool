"use client";

import { motion, type Variants } from "motion/react";
import { type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale" | "blur";
  duration?: number;
  className?: string;
  once?: boolean;
}

/**
 * Smooth scroll-triggered reveal animation.
 * Default: subtle 24px upward translate + fade with expo easing.
 */
export function Reveal({
  children,
  delay = 0,
  direction = "up",
  duration = 0.7,
  className,
  once = true,
}: RevealProps) {
  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(direction === "up" && { y: 24 }),
      ...(direction === "down" && { y: -24 }),
      ...(direction === "left" && { x: 24 }),
      ...(direction === "right" && { x: -24 }),
      ...(direction === "scale" && { scale: 0.96 }),
      ...(direction === "blur" && { filter: "blur(8px)" }),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-50px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
}

/**
 * Stagger children — pair with <RevealItem> children.
 */
export function StaggerContainer({
  children,
  delay = 0,
  stagger = 0.08,
  className,
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
