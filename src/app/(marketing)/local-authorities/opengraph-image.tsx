import {
  buildMarketingOgImage,
  OG_IMAGE_SIZE,
  OG_IMAGE_CONTENT_TYPE,
} from "@/components/seo/marketing-og-image";

export const runtime = "edge";
export const alt = "Edway for Local Authorities — Evidence that speaks for itself.";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpengraphImage() {
  return buildMarketingOgImage({
    eyebrow: "For Local Authorities",
    headline: "Evidence that",
    highlight: "speaks for itself.",
    sub: "Cryptographically signed, statutorily defensible portfolios.",
  });
}
