import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { CursorGlow } from "@/components/fx/cursor-glow";
import { ScrollProgress } from "@/components/fx/scroll-progress";
import { PageTransition } from "@/components/fx/page-transition";
import { SkipLink } from "@/components/ui/skip-link";
import { CookieBanner } from "@/components/fx/cookie-banner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* Ambient background layers */}
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-50 -z-10 pointer-events-none" />
      <div className="fixed inset-0 noise -z-10" />

      <SkipLink />
      <ScrollProgress />
      <CursorGlow />

      <MarketingNav />
      <main id="main-content" className="pt-24">
        <PageTransition>{children}</PageTransition>
      </main>
      <MarketingFooter />
      <CookieBanner />
    </div>
  );
}
