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
            ? "py-3 backdrop-blur-2xl bg-void/70 border-b border-white/5"
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
            <span className="font-display text-lg font-semibold tracking-tight text-fog-50">
              HEXA
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300 ml-1">
              v1.0
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-fog-300 transition-colors hover:text-fog-50 rounded-lg hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button href="/login" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button href="/signup" variant="primary" size="sm">
              Start free trial
            </Button>
          </div>

          <button
            type="button"
            className="lg:hidden text-fog-100"
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
            className="absolute inset-0 bg-void/90 backdrop-blur-xl"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-abyss border-l border-white/5 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <HexaLogo size={28} withText />
              <button
                onClick={() => setMobileOpen(false)}
                className="text-fog-300 hover:text-fog-50"
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
                  className="flex flex-col gap-1 rounded-xl px-4 py-3 text-fog-100 hover:bg-white/5"
                >
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-fog-400">
                      {item.description}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-white/5">
              <Button href="/login" variant="secondary" size="md">
                Sign in
              </Button>
              <Button href="/signup" variant="primary" size="md">
                Start free trial
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
