/**
 * Simple inline-SVG empty-state scenes in the brand palette (violet/neon/cyan
 * on the dark app; remapped on .theme-light). No stock art, no external images,
 * no animation by default — calm and lightweight. Pick a scene by `name`.
 */

type Scene = "map" | "chart" | "messages" | "quests" | "portfolio";

export function EmptyIllustration({
  name,
  className,
}: {
  name: Scene;
  className?: string;
}) {
  const common = {
    width: 120,
    height: 120,
    viewBox: "0 0 120 120",
    fill: "none",
    "aria-hidden": true as const,
    className,
  };
  const stroke = "currentColor";

  switch (name) {
    case "chart":
      return (
        <svg {...common}>
          <rect x="18" y="18" width="84" height="84" rx="10" stroke={stroke} strokeOpacity="0.25" strokeWidth="2" />
          <path d="M28 82 L48 60 L66 70 L92 38" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="48" cy="60" r="3.5" fill="#06FFA5" />
          <circle cx="92" cy="38" r="3.5" fill="#22D3EE" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="M30 90 Q45 60 60 75 Q75 90 90 50" stroke={stroke} strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 6" />
          <circle cx="30" cy="90" r="6" stroke="#A78BFA" strokeWidth="2.5" />
          <circle cx="60" cy="75" r="6" stroke="#06FFA5" strokeWidth="2.5" />
          <circle cx="90" cy="50" r="6" stroke={stroke} strokeOpacity="0.3" strokeWidth="2.5" />
        </svg>
      );
    case "messages":
      return (
        <svg {...common}>
          <rect x="22" y="34" width="60" height="40" rx="10" stroke="#22D3EE" strokeWidth="2.5" />
          <path d="M40 74 L40 86 L54 74" stroke="#22D3EE" strokeWidth="2.5" strokeLinejoin="round" />
          <rect x="50" y="56" width="48" height="32" rx="9" stroke={stroke} strokeOpacity="0.25" strokeWidth="2" fill="var(--color-void, #050614)" />
        </svg>
      );
    case "quests":
      return (
        <svg {...common}>
          <circle cx="60" cy="60" r="40" stroke={stroke} strokeOpacity="0.2" strokeWidth="2" />
          <path d="M60 34 l7 16 17 2 -13 12 4 17 -15 -9 -15 9 4 -17 -13 -12 17 -2 z" stroke="#A78BFA" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    case "portfolio":
    default:
      return (
        <svg {...common}>
          <rect x="30" y="24" width="60" height="76" rx="8" stroke={stroke} strokeOpacity="0.25" strokeWidth="2" />
          <path d="M44 44 H76 M44 58 H76 M44 72 H64" stroke={stroke} strokeOpacity="0.35" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="78" cy="86" r="12" stroke="#06FFA5" strokeWidth="2.5" />
          <path d="M73 86 l3.5 3.5 6 -7" stroke="#06FFA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
