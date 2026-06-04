"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { Button } from "@/components/ui/button";
import { PRIMARY_NAV } from "@/lib/data/navigation";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "py-3 backdrop-blur-xl bg-linen-50/85 border-b border-forest-900/10 shadow-[0_4px_24px_-16px_rgba(35,66,49,0.4)]"
            : "py-5",
        )}
      >
        <div className="mx-auto max-w-7xl px-6 md:px-10 flex items-center justify-between gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02]"
            aria-label="HEXA home"
          >
            <HexaLogo size={32} />
            <span className="font-editorial text-xl font-semibold tracking-tight text-forest-900">
              HEXA
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-clay-300 bg-clay-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-clay-700 ml-1">
              Home Education Expert Assistant
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:text-forest-800 rounded-lg hover:bg-forest-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button href="/login" variant="warm-ghost" size="sm">
              Sign in
            </Button>
            <Button href="/signup" variant="forest" size="sm">
              Start free assessment
            </Button>
          </div>

          <button
            type="button"
            className="lg:hidden text-forest-800"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-linen-50 border-l border-forest-900/10 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <HexaLogo size={28} withText />
              <button
                onClick={() => setMobileOpen(false)}
                className="text-ink-600 hover:text-forest-800"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col gap-1 rounded-xl px-4 py-3 text-forest-900 hover:bg-forest-50"
                >
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-ink-500">
                      {item.description}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-forest-900/10">
              <Button href="/login" variant="warm-outline" size="md">
                Sign in
              </Button>
              <Button href="/signup" variant="forest" size="md">
                Start free assessment
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
