import dynamic from "next/dynamic";
import { Hero } from "@/components/marketing/hero";
import { TrustBar } from "@/components/marketing/trust-bar";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { Problem } from "@/components/marketing/problem";

// Above / near the fold: shipped eagerly with the first paint.
// Below the fold: split into separate client chunks (server-rendered, ssr on),
// so their JS defers out of the main homepage bundle without hiding content or
// shifting layout. Trims the initial ~1.78MB / 32-chunk homepage payload (F2).
const Solution = dynamic(() =>
  import("@/components/marketing/solution").then((m) => m.Solution),
);
const JourneyPreview = dynamic(() =>
  import("@/components/marketing/journey-preview").then((m) => m.JourneyPreview),
);
const AgentsPreview = dynamic(() =>
  import("@/components/marketing/agents-preview").then((m) => m.AgentsPreview),
);
const FeatureGrid = dynamic(() =>
  import("@/components/marketing/feature-grid").then((m) => m.FeatureGrid),
);
const SafetyPreview = dynamic(() =>
  import("@/components/marketing/safety-preview").then((m) => m.SafetyPreview),
);
const Testimonials = dynamic(() =>
  import("@/components/marketing/testimonials").then((m) => m.Testimonials),
);
const CompliancePreview = dynamic(() =>
  import("@/components/marketing/compliance-preview").then(
    (m) => m.CompliancePreview,
  ),
);
const CTA = dynamic(() =>
  import("@/components/marketing/cta").then((m) => m.CTA),
);

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
