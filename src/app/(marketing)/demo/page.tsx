import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/section";
import { DemoWalkthrough } from "@/components/marketing/demo-walkthrough";
import { CTA } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: "Live demo · Aisha's path to a Grade 8",
  description:
    "Walk through 24 months of Edway in 60 seconds. From Day 1 diagnostic to GCSE results day.",
};

export default function DemoPage() {
  return (
    <>
      <Section padded className="pt-16">
        <SectionHeader
          eyebrow="Live walkthrough"
          title={
            <>
              Aisha's path to a
              <br />
              <span className="text-gradient-aurora">Grade 8 at 14.</span>
            </>
          }
          description="A scripted walkthrough of one student's 24-month journey through the Edway system — every agent invocation, every decision, every log line."
        />
      </Section>
      <Section padded={false} className="pb-32">
        <DemoWalkthrough />
      </Section>
      <CTA />
    </>
  );
}
