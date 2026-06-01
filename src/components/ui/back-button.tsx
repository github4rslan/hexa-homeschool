"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Back button used across dashboard sub-pages.
 * Uses browser history when available, falling back to an explicit href so it
 * never strands the user (e.g. on a fresh tab with no in-app history).
 */
export function BackButton({
  fallback = "/dashboard",
  label = "Back",
  className,
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function handleClick() {
    // If there's in-app history, go back; otherwise use the fallback route.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
        "text-fog-300 hover:text-fog-50 hover:bg-white/5 transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
