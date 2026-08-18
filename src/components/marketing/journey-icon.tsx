import {
  Activity,
  Map,
  Sparkles,
  ClipboardCheck,
  FileCheck,
  GraduationCap,
  Circle,
  type LucideIcon,
} from "lucide-react";
import type { JourneyStep } from "@/lib/data/journey";

/**
 * F6 (2026-08-18) — named per-icon imports instead of `import * as Icons from
 * "lucide-react"`. The barrel import defeats Next's `optimizePackageImports`
 * tree-shaking and pulled the ENTIRE lucide-react icon set (~500 KB parsed)
 * into an eager shared chunk on every page that renders the journey timeline.
 * `JOURNEY.icon` is a closed set of six known strings (see lib/data/journey.ts)
 * so a small static map covers every case; `Circle` is the fallback for
 * forward-compat if a future step names an icon not yet in the map.
 */
const JOURNEY_ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Map,
  Sparkles,
  ClipboardCheck,
  FileCheck,
  GraduationCap,
};

export function journeyIcon(name: JourneyStep["icon"]): LucideIcon {
  return JOURNEY_ICON_MAP[name] ?? Circle;
}
