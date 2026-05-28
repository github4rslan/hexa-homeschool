import type { Metadata } from "next";
import { JourneyTimeline } from "@/components/marketing/journey-timeline";
import { Section, SectionHeader } from "@/components/ui/section";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "How HEXA works",
  description:
    "From the Day 1 diagnostic to GCSE entry at 14 — the six-stage end-to-end student journey.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="The Journey"
          title={
            <>
              Six stages. <span className="text-gradient-aurora">Twenty-four months.</span>
              <br />
              One GCSE result that compounds.
            </>
          }
          description="A precisely sequenced path that compresses the traditional GCSE journey by two academic years — without skipping a single specification point."
        />
      </Section>
      <JourneyTimeline />
      <CTA />
    </>
  );
}
