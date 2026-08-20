import { describe, expect, it } from "vitest";
import { buildCourseJsonLd } from "@/lib/seo/course-jsonld";
import { SITE_URL } from "@/lib/site";

describe("buildCourseJsonLd (F6)", () => {
  const data = buildCourseJsonLd();

  it("is a well-formed Course entry referencing the shared Organization node", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("Course");
    expect(data.name.trim().length).toBeGreaterThan(0);
    expect(data.description.trim().length).toBeGreaterThan(0);
    expect(data.provider).toEqual({ "@id": `${SITE_URL}/#organization` });
  });

  it("lists a course instance for each subject Edway teaches", () => {
    expect(data.hasCourseInstance.map((c) => c.name)).toEqual([
      "GCSE Mathematics",
      "GCSE English",
      "GCSE Science",
    ]);
    for (const instance of data.hasCourseInstance) {
      expect(instance["@type"]).toBe("CourseInstance");
      expect(instance.courseMode).toBe("online");
    }
  });

  it("serialises to valid JSON", () => {
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
  });
});
