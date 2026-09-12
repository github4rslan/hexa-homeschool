import { describe, expect, it } from "vitest";
import { buildFaqJsonLd } from "@/lib/seo/faq-jsonld";

describe("buildFaqJsonLd (F7)", () => {
  const items = [
    { q: "Is Edway accepted by Local Authorities?", a: "Yes, structured portfolios." },
    { q: "Can my child really be ready for GCSEs at 14?", a: "Specifications are content-based." },
  ];
  const data = buildFaqJsonLd(items);

  it("is a well-formed FAQPage entry", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity.length).toBe(items.length);
  });

  it("maps each FAQ item to a Question/Answer pair, verbatim", () => {
    for (const [i, item] of items.entries()) {
      const entry = data.mainEntity[i];
      expect(entry["@type"]).toBe("Question");
      expect(entry.name).toBe(item.q);
      expect(entry.acceptedAnswer["@type"]).toBe("Answer");
      expect(entry.acceptedAnswer.text).toBe(item.a);
    }
  });

  it("returns an empty mainEntity for no items, never throwing", () => {
    const empty = buildFaqJsonLd([]);
    expect(empty.mainEntity).toEqual([]);
  });

  it("serialises to valid JSON", () => {
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
  });
});
