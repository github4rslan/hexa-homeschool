"use client";

import { useMotionValue, motion, useMotionTemplate } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Card wrapper that paints a subtle radial light at the cursor position on hover.
 * Adds depth to glass cards.
 */
export function Spotlight({
  children,
  className,
  color = "rgba(167, 139, 250, 0.15)",
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, ${color}, transparent 70%)`;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mouseX.set(-100);
        mouseY.set(-100);
      }}
      className={cn("group relative overflow-hidden", className)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background }}
      />
      {children}
    </div>
  );
}
