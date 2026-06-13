/**
 * Child-mode accent presets — four palette-safe colour choices a child can set
 * in "My stuff" to personalise their learning space. Each maps to a gradient
 * (icon tiles, primary buttons) and a soft ring tint. Kept within the existing
 * brand palette so contrast/AA is preserved in either case. The first entry is
 * the default.
 */

export type AccentId = "violet" | "cyan" | "neon" | "amber";

export interface AccentPreset {
  id: AccentId;
  label: string;
  /** Tailwind gradient for tiles / primary buttons. */
  gradient: string;
  /** Tailwind text tint for accents. */
  text: string;
  /** A representative swatch colour for the picker dot. */
  swatch: string;
}

export const ACCENTS: AccentPreset[] = [
  {
    id: "violet",
    label: "Violet",
    gradient: "from-violet-500 to-violet-700",
    text: "text-violet-300",
    swatch: "#8b5cf6",
  },
  {
    id: "cyan",
    label: "Ocean",
    gradient: "from-cyan-500 to-cyan-700",
    text: "text-cyan-300",
    swatch: "#06b6d4",
  },
  {
    id: "neon",
    label: "Lime",
    gradient: "from-neon-500 to-neon-600",
    text: "text-neon-300",
    swatch: "#84cc16",
  },
  {
    id: "amber",
    label: "Sunset",
    gradient: "from-amber-500 to-amber-600",
    text: "text-amber-300",
    swatch: "#f59e0b",
  },
];

export const DEFAULT_ACCENT: AccentId = "violet";

export function isAccent(id: string): id is AccentId {
  return ACCENTS.some((a) => a.id === id);
}

export function accentPreset(id: string | null | undefined): AccentPreset {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}
