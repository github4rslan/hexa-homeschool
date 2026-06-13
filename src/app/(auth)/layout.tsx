import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-hero opacity-70 -z-10 pointer-events-none" />
      <div className="fixed inset-0 bg-grid bg-grid-fade opacity-30 -z-10 pointer-events-none" />

      <header className="absolute top-0 left-0 right-0 z-10 p-6 md:p-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <HexaLogo size={28} withText />
        </Link>
      </header>

      <main className="flex min-h-screen items-center justify-center px-6 py-20">
        {children}
      </main>
      {/* Parents-only analytics; never mounted in (child) routes. */}
      <AnalyticsProvider />
    </div>
  );
}
