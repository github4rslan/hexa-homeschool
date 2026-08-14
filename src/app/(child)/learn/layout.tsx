import Link from "next/link";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { ParentGateExit } from "@/components/child/parent-gate-exit";
import { ReducedMotionProvider } from "@/components/fx/reduced-motion-provider";

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
    // The child learn surface is by far the most animation-heavy AND the most
    // SEND-critical route group, so it gets the same global reduced-motion safety
    // net as the marketing and dashboard layouts. framer-motion's JS transitions
    // are not neutralised by the globals.css 0.01ms rule, so this MotionConfig
    // wrapper is what honours prefers-reduced-motion for any child component that
    // does not self-guard. Client wrapper inside a server layout (proven pattern).
    <ReducedMotionProvider>
      <div className="theme-child relative min-h-screen text-fog-50">
        <div className="fixed inset-0 bg-void -z-20" />
        <div className="fixed inset-0 bg-mesh-hero opacity-40 -z-10 pointer-events-none" />

        <header className="flex items-center justify-between p-5 lg:p-8">
          {/* Branding fades in focus mode (re-reveals on hover/focus); the
              parent-gate exit on the right always stays reachable. */}
          <Link
            href="/learn"
            data-focus-logo
            className="inline-flex min-h-11 items-center gap-2.5 rounded-lg py-1 focus-visible:opacity-100"
          >
            <HexaLogo size={32} withText />
          </Link>
          <ParentGateExit className="child-touch text-base" />
        </header>

        <main className="px-5 pb-16 lg:px-8">{children}</main>
      </div>
    </ReducedMotionProvider>
  );
}
