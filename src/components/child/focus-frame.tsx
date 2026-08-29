"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { ReadingRuler } from "@/components/child/reading-ruler";
import {
  NO_READING_SUPPORTS,
  type ReadingSupports,
} from "@/lib/child/reading-supports";

/**
 * Distraction-free lesson frame (Feature 4). While an active lesson is mounted
 * it flags `lesson-focus` on <html>, which calmly fades the surrounding branding
 * chrome (see globals.css). Content centres in a comfortable column filling ≥85%
 * of the mobile viewport over the layout's bg-void + bg-mesh-hero backdrop.
 *
 * Never traps a child: a small "Exit lesson" affordance stays visible (it sits
 * where the faded logo was), and the layout's parent-gate exit stays reachable
 * top-right. The faded branding re-reveals on hover/focus of the top edge. The
 * fade is opacity-only (no flashing) and reduced-motion-safe.
 */
export function FocusFrame({
  children,
  reading = NO_READING_SUPPORTS,
}: {
  children: React.ReactNode;
  /** SEND-aware reading supports (F3) — dyslexia font, text zoom, ruler. */
  reading?: ReadingSupports;
}) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("lesson-focus");
    return () => root.classList.remove("lesson-focus");
  }, []);

  return (
    <>
      {/* Always-visible calm exit, in the space the branding logo vacated. */}
      <Link
        href="/learn"
        className="child-touch fixed left-4 top-3.5 z-50 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-base text-fog-200 backdrop-blur transition-colors hover:border-white/30 hover:text-fog-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:left-8"
      >
        <ArrowLeft className="h-5 w-5" />
        Exit lesson
      </Link>

      <div
        className={[
          // B2 fix: reserve top clearance matching the fixed "Exit lesson"
          // pill's footprint (64px tall + its 14px offset) so tall content
          // centred by `justify-center` never renders under it, even after an
          // in-page interaction auto-scrolls the viewport.
          "mx-auto flex min-h-[85svh] w-full max-w-2xl flex-col justify-center pt-20 sm:pt-24",
          reading.font ? "reading-dyslexic" : "",
        ].join(" ")}
        // Whole-lesson text zoom (accessibility). `zoom` scales content and its
        // touch targets proportionally; unsupported browsers simply ignore it.
        style={reading.scale !== 1 ? { zoom: reading.scale } : undefined}
      >
        {children}
      </div>

      {reading.ruler && <ReadingRuler />}
    </>
  );
}
