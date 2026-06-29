import { cn } from "@/lib/utils";

interface HexaLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

/**
 * The Edway mark — a six-faceted hexagonal sigil.
 * Each facet represents one of the six AI agents.
 *
 * NOTE: the hexagon shape is the inherited "HEXA" visual identity (hexa = six).
 * Whether Edway keeps it is a brand decision for the owner — only the wordmark
 * text has been rebranded here; the mark itself is intentionally unchanged.
 */
export function HexaLogo({ className, size = 32, withText = false }: HexaLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Edway"
      >
        <defs>
          <linearGradient id="hexa-outer" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
          <linearGradient id="hexa-inner" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#06FFA5" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.9" />
          </linearGradient>
          <filter id="hexa-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer hexagon */}
        <path
          d="M24 3L42.4 13.5V34.5L24 45L5.6 34.5V13.5L24 3Z"
          stroke="url(#hexa-outer)"
          strokeWidth="2"
          fill="none"
          filter="url(#hexa-glow)"
        />

        {/* Six internal facets — one per agent */}
        <g stroke="url(#hexa-outer)" strokeWidth="1" opacity="0.4">
          <line x1="24" y1="3" x2="24" y2="24" />
          <line x1="42.4" y1="13.5" x2="24" y2="24" />
          <line x1="42.4" y1="34.5" x2="24" y2="24" />
          <line x1="24" y1="45" x2="24" y2="24" />
          <line x1="5.6" y1="34.5" x2="24" y2="24" />
          <line x1="5.6" y1="13.5" x2="24" y2="24" />
        </g>

        {/* Inner pulse hexagon */}
        <path
          d="M24 14L33.5 19.5V30.5L24 36L14.5 30.5V19.5L24 14Z"
          fill="url(#hexa-inner)"
          opacity="0.15"
        />
        <path
          d="M24 14L33.5 19.5V30.5L24 36L14.5 30.5V19.5L24 14Z"
          stroke="url(#hexa-inner)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Centre node */}
        <circle cx="24" cy="24" r="2.5" fill="#06FFA5" filter="url(#hexa-glow)" />
      </svg>

      {withText && (
        <span className="font-display text-lg font-semibold tracking-tight text-fog-50">
          Edway
        </span>
      )}
    </div>
  );
}
