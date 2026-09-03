"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, LogOut } from "lucide-react";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { Badge } from "@/components/ui/badge";
import { NAV, isAdminNavActive } from "@/components/admin/nav-items";
import { useAdminIdentity } from "@/components/admin/admin-identity";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

/**
 * Admin mobile navigation: a hamburger trigger (shown only below lg, where the
 * persistent sidebar is hidden) that opens a slide-in drawer reusing the exact
 * same NAV as the desktop sidebar. Focus-trapped, Esc-to-close, scroll-locked,
 * and closes on route change — so staff can navigate the admin surface on a
 * phone. The layout's role gate still governs access; this is chrome only.
 */
export function AdminMobileNav() {
  const pathname = usePathname();
  const identity = useAdminIdentity();
  const [open, setOpen] = useState(false);
  // Portal target only exists after mount (avoids SSR/hydration mismatch).
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => setMounted(true), []);

  useFocusTrap(drawerRef, open, close);

  // Close whenever the route changes (e.g. user taps a link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-fog-200 transition-all"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Portal to <body>: the AdminTopbar header has backdrop-blur, which makes
          it the containing block for fixed descendants — a nested drawer would be
          clipped to the 64px header. Rendering under <body> lets `fixed inset-0`
          resolve against the viewport (full-height drawer). */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div className="lg:hidden fixed inset-0 z-[60]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            />
            <motion.aside
              ref={drawerRef}
              tabIndex={-1}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col border-r border-white/10 bg-abyss outline-none [padding-top:env(safe-area-inset-top)]"
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
            >
              <div className="flex items-center justify-between border-b border-white/5 p-5">
                <Link href="/admin" className="inline-flex items-center gap-2.5">
                  <HexaLogo size={26} withText />
                  <Badge variant="violet" size="sm">
                    Admin
                  </Badge>
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-fog-300 transition-all"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                {NAV.map((group) => (
                  <div key={group.label} className="flex flex-col gap-1">
                    <span className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-fog-600">
                      {group.label}
                    </span>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isAdminNavActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl px-3 py-3 text-base transition-all",
                            active
                              ? "border border-violet-400/30 bg-violet-500/10 text-fog-50"
                              : "border border-transparent text-fog-300 hover:bg-white/5 hover:text-fog-50",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant={item.badge.variant} size="sm">
                              {item.badge.value}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="border-t border-white/5 p-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
                {identity && (
                  <div className="mb-2 flex items-center gap-3 px-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white text-xs font-semibold shrink-0">
                      {identity.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-fog-100 truncate">
                        {identity.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-fog-500 truncate">
                        {identity.role}
                      </div>
                    </div>
                  </div>
                )}
                <form action="/logout" method="post">
                  <button
                    type="submit"
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-3 text-base text-fog-400 transition-all hover:bg-white/5 hover:text-fog-100"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </form>
              </div>
            </motion.aside>
          </div>
        )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
