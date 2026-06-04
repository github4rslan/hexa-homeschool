import { Container } from "@/components/ui/container";

/**
 * Section B — Trust Bar. Brief: a single-line horizontal band with minimal,
 * desaturated badges. Establishes institutional alignment and compliance
 * without cluttering the emotional entry point.
 */
const BADGES = [
  "Pearson Edexcel",
  "AQA",
  "OCR",
  "UK GDPR",
  "Children's Code",
  "AWS London",
];

export function TrustBar() {
  return (
    <section className="relative py-10 border-y border-forest-900/10 bg-linen-50/60">
      <Container>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {BADGES.map((badge, i) => (
            <div key={badge} className="flex items-center gap-8">
              {i > 0 && (
                <span className="hidden sm:block h-1 w-1 rounded-full bg-forest-300" />
              )}
              <span className="font-mono uppercase tracking-[0.15em] text-xs text-ink-500">
                {badge}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
