import { Hero } from "@/components/marketing/hero";
import { TrustBar } from "@/components/marketing/trust-bar";
import { StructuredData } from "@/components/seo/structured-data";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { JourneyPreview } from "@/components/marketing/journey-preview";
import { AgentsPreview } from "@/components/marketing/agents-preview";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { SafetyPreview } from "@/components/marketing/safety-preview";
import { Testimonials } from "@/components/marketing/testimonials";
import { CompliancePreview } from "@/components/marketing/compliance-preview";
import { CTA } from "@/components/marketing/cta";

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <Hero />
      <TrustBar />
      <StatsStrip />
      <JourneyPreview />
      <AgentsPreview />
      <FeatureGrid />
      <SafetyPreview />
      <Testimonials />
      <CompliancePreview />
      <CTA />
    </>
  );
}
