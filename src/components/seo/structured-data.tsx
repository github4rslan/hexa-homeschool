import { SITE_URL, CONTACT_EMAIL } from "@/lib/site";

/**
 * JSON-LD structured data for Edway.
 * Renders Organization + WebSite + Product schema for richer SERP appearance.
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Edway Education Ltd",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        description:
          "The AI assistant built for UK homeschooling families — daily lessons, transparent progress tracking, and Local Authority-compliant portfolios for Maths, English and Science.",
        foundingDate: "2026",
        address: { "@type": "PostalAddress", addressCountry: "GB" },
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: CONTACT_EMAIL,
            contactType: "customer service",
            availableLanguage: "English",
            areaServed: "GB",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Edway",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-GB",
      },
      {
        "@type": "Product",
        name: "Edway Platform",
        description:
          "Six specialised AI agents that plan, teach, track and protect — preparing UK students for GCSE Maths, English and Science at their own pace.",
        brand: { "@id": `${SITE_URL}/#organization` },
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
