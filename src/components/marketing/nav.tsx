"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { Button } from "@/components/ui/button";
import { MARKETING_NAV_GROUPS, type NavItem } from "@/lib/data/navigation";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useFocusTrap(drawerRef, mobileOpen, closeMobile);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

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
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <HexaLogo size={32} />
            <span className="font-editorial text-xl font-semibold tracking-tight text-forest-900">
              HEXA
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-clay-300 bg-clay-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-clay-700 ml-1">
              Home Education Expert Assistant
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {MARKETING_NAV_GROUPS.map((group) => {
              const groupActive = group.items.some((item) => isActive(pathname, item.href));
              return (
                <div key={group.label} className="relative group">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      groupActive
                        ? "bg-forest-100 text-forest-900"
                        : "text-ink-700 hover:bg-forest-50 hover:text-forest-800",
                    )}
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {group.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full z-20 w-[22rem] -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="rounded-2xl border border-forest-900/10 bg-linen-50/95 p-2 shadow-[0_24px_70px_-30px_rgba(35,66,49,0.45)] backdrop-blur-xl">
                      {group.items.map((item) => (
                        <MarketingNavLink
                          key={item.href}
                          item={item}
                          active={isActive(pathname, item.href)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
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
            aria-expanded={mobileOpen}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-forest-950/40 backdrop-blur-sm"
            onClick={closeMobile}
            aria-label="Close menu"
          />
          <div
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-linen-50 border-l border-forest-900/10 p-6 flex flex-col outline-none"
          >
            <div className="flex items-center justify-between mb-8">
              <HexaLogo size={28} withText />
              <button
                onClick={closeMobile}
                className="text-ink-600 hover:text-forest-800"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-6" aria-label="Primary">
              {MARKETING_NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <h2 className="px-4 text-[10px] font-mono uppercase tracking-widest text-clay-700">
                    {group.label}
                  </h2>
                  <div className="mt-2 flex flex-col gap-1">
                    {group.items.map((item) => (
                      <MarketingNavLink
                        key={item.href}
                        item={item}
                        active={isActive(pathname, item.href)}
                        onClick={closeMobile}
                      />
                    ))}
                  </div>
                </div>
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

function MarketingNavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col gap-1 rounded-xl px-4 py-3 transition-colors",
        active
          ? "bg-forest-100 text-forest-950"
          : "text-forest-900 hover:bg-forest-50",
      )}
    >
      <span className="text-sm font-semibold">{item.label}</span>
      {item.description && (
        <span className="text-xs leading-relaxed text-ink-600">
          {item.description}
        </span>
      )}
    </Link>
  );
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
