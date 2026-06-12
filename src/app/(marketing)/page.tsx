import { Hero } from "@/components/marketing/hero";
import { TrustBar } from "@/components/marketing/trust-bar";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { Problem } from "@/components/marketing/problem";
import { Solution } from "@/components/marketing/solution";
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
      <Hero />
      <TrustBar />
      <StatsStrip />
      <Problem />
      <Solution />
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
