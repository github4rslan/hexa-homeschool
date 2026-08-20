import { SITE_URL } from "@/lib/site";

/**
 * F6 — Course JSON-LD data for the curriculum-facing marketing pages. Kept as
 * a pure builder (no JSX) so it's unit-testable without a React render, and
 * consumed by `components/seo/course-jsonld.tsx`'s `<script>` output.
 */
export function buildCourseJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Edway GCSE Homeschooling Curriculum",
    description:
      "Daily AI-guided lessons preparing UK homeschooled students for GCSE Maths, English and Science, from the Day 1 diagnostic to sitting the exam when ready.",
    provider: { "@id": `${SITE_URL}/#organization` },
    hasCourseInstance: [
      {
        "@type": "CourseInstance",
        courseMode: "online",
        name: "GCSE Mathematics",
        courseWorkload: "P0DT30M/day",
      },
      {
        "@type": "CourseInstance",
        courseMode: "online",
        name: "GCSE English",
        courseWorkload: "P0DT30M/day",
      },
      {
        "@type": "CourseInstance",
        courseMode: "online",
        name: "GCSE Science",
        courseWorkload: "P0DT30M/day",
      },
    ],
  };
}
