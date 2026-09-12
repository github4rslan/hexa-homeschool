import { Fraunces } from "next/font/google";
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
import { LazyMotionProvider } from "@/components/fx/lazy-motion-provider";

// Editorial serif for the warm marketing theme, heritage, high-trust,
// "clean editorial typography" per the web brief. B5 (2026-09-08) moved this
// declaration here (out of the root layout) on the theory that route-group
// layout nesting alone would scope the preload to marketing routes; B4
// (2026-09-12) re-verified live (`browser_evaluate` + the response's own
// `Link:` preload header on `/login`) that the preload STILL fires on
// non-marketing routes despite that move, confirmed by inspecting a clean
// `next build`'s own manifests (`entryCSSFiles`), which show this route
// correctly getting NO Fraunces CSS, so the leak is in Next's font-preload
// hinting, not in which routes load the stylesheet. `preload: false` is the
// one option that removes the hint at the source regardless of that
// mechanism, so non-marketing routes never fetch a font they never render.
// Marketing pages still load Fraunces via the CSS `@font-face` rule (no
// preload hint), and `display: "swap"` already avoids an invisible-text flash.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
  preload: false,
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReducedMotionProvider>
    <LazyMotionProvider>
    <div className={`theme-warm ${fraunces.variable} relative min-h-screen overflow-x-clip bg-linen-100 text-ink-800`}>
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
    </LazyMotionProvider>
    </ReducedMotionProvider>
  );
}
