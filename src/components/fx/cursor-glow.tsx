"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * A soft violet aura that follows the cursor across the page.
 * Disabled on touch / coarse pointer devices for performance.
 */
export function CursorGlow() {
  const [enabled, setEnabled] = useState(false);
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);

  const springX = useSpring(cursorX, { stiffness: 120, damping: 20, mass: 0.5 });
  const springY = useSpring(cursorY, { stiffness: 120, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    setEnabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener("change", onChange);

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      mq.removeEventListener("change", onChange);
    };
  }, [cursorX, cursorY]);

  if (!enabled) return null;

  return (
    <>
      {/* Large violet aura */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[1] h-[500px] w-[500px] rounded-full"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          background:
            "radial-gradient(circle at center, rgba(124,58,237,0.12), transparent 60%)",
        }}
      />
      {/* Sharp inner dot follows immediately */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[2] h-3 w-3 rounded-full bg-violet-300/60 mix-blend-screen"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
