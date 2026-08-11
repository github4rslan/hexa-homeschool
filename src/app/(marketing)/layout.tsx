import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { ScrollProgress } from "@/components/fx/scroll-progress";
import { PageTransition } from "@/components/fx/page-transition";
import { SkipLink } from "@/components/ui/skip-link";
import { CookieBanner } from "@/components/fx/cookie-banner";
import { NextStepFunnel } from "@/components/marketing/next-step-funnel";
import { StructuredData } from "@/components/seo/structured-data";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { ReducedMotionProvider } from "@/components/fx/reduced-motion-provider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReducedMotionProvider>
    <div className="theme-warm relative min-h-screen overflow-x-clip bg-linen-100 text-ink-800">
      {/* Organization/WebSite/Product JSON-LD on every marketing page. */}
      <StructuredData />
      {/* Warm, editorial ambient backdrop — soft linen paper, no neon. */}
      <div className="fixed inset-0 bg-linen-paper -z-20" />

      <SkipLink />
      <ScrollProgress />

      <MarketingNav />
      <main id="main-content" className="pt-24">
        <PageTransition>{children}</PageTransition>
      </main>
      <NextStepFunnel />
      <MarketingFooter />
      <CookieBanner />
      {/* Parents-only analytics; never mounted in (child) routes. */}
      <AnalyticsProvider />
    </div>
    </ReducedMotionProvider>
  );
}
