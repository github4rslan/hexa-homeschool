import {
  buildMarketingOgImage,
  OG_IMAGE_SIZE,
  OG_IMAGE_CONTENT_TYPE,
} from "@/components/seo/marketing-og-image";

export const runtime = "edge";
export const alt = "Edway — Automation, with structural humility.";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function OpengraphImage() {
  return buildMarketingOgImage({
    eyebrow: "The Safety Net",
    headline: "Automation, with",
    highlight: "structural humility.",
    sub: "Checker-gated AI. Human escalation. A published SLA.",
  });
}
