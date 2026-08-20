import { buildCourseJsonLd } from "@/lib/seo/course-jsonld";

/**
 * F6 — Course JSON-LD for the curriculum-facing marketing pages. Mirrors
 * `StructuredData`'s pattern (a single script tag) so Google's rich-result
 * parsers recognise Edway's GCSE Maths/English/Science offering as a `Course`,
 * not just a generic `Product`.
 */
export function CourseJsonLd() {
  const data = buildCourseJsonLd();

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
