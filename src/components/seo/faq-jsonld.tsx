import { buildFaqJsonLd, type FaqItem } from "@/lib/seo/faq-jsonld";

/**
 * F7: FAQPage JSON-LD for a marketing page with a genuine, substantive FAQ
 * section. Mirrors `CourseJsonLd`'s pattern (a single script tag) so Google's
 * rich-result parsers can render an expandable FAQ dropdown in search results.
 */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = buildFaqJsonLd(items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
