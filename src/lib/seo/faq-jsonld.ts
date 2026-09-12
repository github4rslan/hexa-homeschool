/**
 * F7: FAQPage JSON-LD data. Kept as a pure builder (no JSX) so it's
 * unit-testable without a React render, mirroring `lib/seo/course-jsonld.ts`.
 * Consumed by `components/seo/faq-jsonld.tsx`'s `<script>` output.
 */
export interface FaqItem {
  q: string;
  a: string;
}

export function buildFaqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
