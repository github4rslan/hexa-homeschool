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
          "The AI assistant built for UK homeschooling families — daily lessons, transparent progress tracking, and Local Authority-compliant portfolios for Maths, English and Science.",
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
          "Six specialised AI agents that plan, teach, track and protect — preparing UK students for GCSE Maths, English and Science at their own pace.",
        brand: { "@id": "https://hexa.education/#organization" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "GBP",
          lowPrice: "49",
          highPrice: "99",
          offerCount: "2",
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
