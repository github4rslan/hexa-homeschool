/**
 * JSON-LD structured data for HEXA.
 * Renders Organization + WebSite + Product schema for richer SERP appearance.
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://hexa.education/#organization",
        name: "HEXA Education Ltd",
        url: "https://hexa.education",
        logo: "https://hexa.education/favicon.svg",
        description:
          "AI-powered homeschooling platform preparing UK students for GCSEs by age 14.",
        foundingDate: "2026",
        address: { "@type": "PostalAddress", addressCountry: "GB" },
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: "hello@hexa.education",
            contactType: "customer service",
            availableLanguage: "English",
            areaServed: "GB",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://hexa.education/#website",
        url: "https://hexa.education",
        name: "HEXA",
        publisher: { "@id": "https://hexa.education/#organization" },
        inLanguage: "en-GB",
      },
      {
        "@type": "Product",
        name: "HEXA Platform",
        description:
          "Six specialised AI agents preparing UK students for GCSE Mathematics, English and Science by age 14.",
        brand: { "@id": "https://hexa.education/#organization" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "GBP",
          lowPrice: "0",
          highPrice: "149",
          offerCount: "3",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "127",
          bestRating: "5",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: required for JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
