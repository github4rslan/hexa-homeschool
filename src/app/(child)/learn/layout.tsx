import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { BackButton } from "@/components/ui/back-button";

/**
 * Child-mode layout. Applies the `.theme-child` scope (bigger type, 64px touch
 * targets) and a calm, minimal chrome — no parent sidebar, one clear exit.
 * Children's Code: simple, accessible, no engagement loops.
 */
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-child relative min-h-screen text-fog-50">
      <div className="fixed inset-0 bg-void -z-20" />
      <div className="fixed inset-0 bg-mesh-hero opacity-40 -z-10 pointer-events-none" />

      <header className="flex items-center justify-between p-5 lg:p-8">
        <Link href="/learn" className="inline-flex items-center gap-2.5">
          <HexaLogo size={32} withText />
        </Link>
        <BackButton fallback="/dashboard" label="Exit" className="child-touch text-base" />
      </header>

      <main className="px-5 pb-16 lg:px-8">{children}</main>
    </div>
  );
}
