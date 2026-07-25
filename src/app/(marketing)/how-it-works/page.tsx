import type { Metadata } from "next";
import { JourneyTimeline } from "@/components/marketing/journey-timeline";
import { Section, SectionHeader } from "@/components/ui/section";
import { CTA } from "@/components/marketing/cta";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";

export const metadata: Metadata = {
  title: "How Edway works",
  description:
    "From the Day 1 diagnostic to sitting the exam when ready — the six-step end-to-end student journey.",
};

export default function HowItWorksPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "How it works", path: "/how-it-works" }]} />
      <Section padded className="pt-16">
        <SectionHeader
          as="h1"
          eyebrow="How it works"
          title={
            <>
              Six steps. <span className="text-gradient-aurora">One clear path.</span>
              <br />
              Sit when ready.
            </>
          }
          description="A precisely sequenced journey from the Day 1 diagnostic to a verified GCSE result — at your child's pace, with full visibility on where they stand at every step."
        />
      </Section>
      <JourneyTimeline />
      <CTA />
    </>
  );
}
