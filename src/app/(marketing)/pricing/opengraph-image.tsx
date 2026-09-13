import {
  buildMarketingOgImage,
  OG_IMAGE_SIZE,
  OG_IMAGE_CONTENT_TYPE,
} from "@/components/seo/marketing-og-image";

export const runtime = "edge";
export const alt = "Edway — Honest pricing. No surprises.";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpengraphImage() {
  return buildMarketingOgImage({
    eyebrow: "Pricing",
    headline: "Honest pricing.",
    highlight: "No surprises.",
    sub: "Maths, English & Science, one AI assistant, from £49/month.",
  });
}
