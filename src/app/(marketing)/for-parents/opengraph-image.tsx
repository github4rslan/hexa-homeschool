import {
  buildMarketingOgImage,
  OG_IMAGE_SIZE,
  OG_IMAGE_CONTENT_TYPE,
} from "@/components/seo/marketing-og-image";

export const runtime = "edge";
export const alt = "Edway — Built around the parents we couldn't ignore.";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpengraphImage() {
  return buildMarketingOgImage({
    eyebrow: "For UK Parents",
    headline: "Built around the parents",
    highlight: "we couldn't ignore.",
    sub: "Proof. Pacing. Someone in your corner with the LA.",
  });
}
