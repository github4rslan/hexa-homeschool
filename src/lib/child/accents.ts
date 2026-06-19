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
  // ── Interactive-surface tints (Feature 1/2). Full literal class strings so
  //    Tailwind keeps them; threaded through every interactive surface so a
  //    child who picked "Ocean" sees cyan everywhere, never hardcoded violet. ──
  /** Selected/active surface border. */
  border: string;
  /** Selected/active surface fill. */
  bg: string;
  /** Muted tint for hint cards (visually distinct from the answer). */
  softBg: string;
  /** Muted border for hint cards. */
  softBorder: string;
  /** Focus ring tint for inputs / focusable chips. */
  ring: string;
  /** Caret colour for fill-in-the-blank inputs. */
  caret: string;
  /** Progress-bar gradient (left → right). */
  bar: string;
}

export const ACCENTS: AccentPreset[] = [
  {
    id: "violet",
    label: "Violet",
    gradient: "from-violet-500 to-violet-700",
    text: "text-violet-300",
    swatch: "#8b5cf6",
    border: "border-violet-400/70",
    bg: "bg-violet-500/15",
    softBg: "bg-violet-500/[0.06]",
    softBorder: "border-violet-400/25",
    ring: "focus-visible:ring-violet-400/50",
    caret: "caret-violet-400",
    bar: "from-violet-500 to-cyan-400",
  },
  {
    id: "cyan",
    label: "Ocean",
    gradient: "from-cyan-500 to-cyan-700",
    text: "text-cyan-300",
    swatch: "#06b6d4",
    border: "border-cyan-400/70",
    bg: "bg-cyan-500/15",
    softBg: "bg-cyan-500/[0.06]",
    softBorder: "border-cyan-400/25",
    ring: "focus-visible:ring-cyan-400/50",
    caret: "caret-cyan-400",
    bar: "from-cyan-500 to-violet-400",
  },
  {
    id: "neon",
    label: "Lime",
    gradient: "from-neon-500 to-neon-600",
    text: "text-neon-300",
    swatch: "#84cc16",
    border: "border-neon-400/70",
    bg: "bg-neon-500/15",
    softBg: "bg-neon-500/[0.06]",
    softBorder: "border-neon-400/25",
    ring: "focus-visible:ring-neon-400/50",
    caret: "caret-neon-400",
    bar: "from-neon-500 to-cyan-400",
  },
  {
    id: "amber",
    label: "Sunset",
    gradient: "from-amber-500 to-amber-600",
    text: "text-amber-300",
    swatch: "#f59e0b",
    border: "border-amber-400/70",
    bg: "bg-amber-500/15",
    softBg: "bg-amber-500/[0.06]",
    softBorder: "border-amber-400/25",
    ring: "focus-visible:ring-amber-400/50",
    caret: "caret-amber-400",
    bar: "from-amber-500 to-neon-400",
  },
];

export const DEFAULT_ACCENT: AccentId = "violet";

export function isAccent(id: string): id is AccentId {
  return ACCENTS.some((a) => a.id === id);
}

export function accentPreset(id: string | null | undefined): AccentPreset {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}
