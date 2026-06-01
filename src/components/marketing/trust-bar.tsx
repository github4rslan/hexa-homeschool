"use client";

import { Container } from "@/components/ui/container";

/**
 * A marquee of UK exam board / accreditation / compliance badges.
 * Builds credibility without leaning on partner logos we don't have.
 */
const BADGES = [
  "Pearson Edexcel",
  "AQA",
  "OCR",
  "UK GDPR",
  "Children's Code",
  "AWS London",
  "ICO Registered",
];

export function TrustBar() {
  return (
    <section className="relative py-12 border-y border-white/5 bg-abyss/30 backdrop-blur-sm overflow-hidden">
      <Container>
        <div className="text-center mb-8">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-fog-500">
            Aligned with UK education and data standards
          </span>
        </div>
      </Container>

      <div className="relative w-full overflow-hidden">
        <div className="flex w-max gap-12 animate-marquee">
          {[...BADGES, ...BADGES].map((badge, i) => (
            <div
              key={`${badge}-${i}`}
              className="flex items-center gap-2 text-sm text-fog-400 whitespace-nowrap shrink-0"
            >
              <span className="h-1 w-1 rounded-full bg-violet-400/50" />
              <span className="font-mono uppercase tracking-wider text-xs">
                {badge}
              </span>
            </div>
          ))}
        </div>

        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-void to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-void to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
