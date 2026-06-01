"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { HexaLogo } from "@/components/ui/hexa-logo";
import { ChildSwitcher, type SwitcherChild } from "./child-switcher";
import { DASHBOARD_NAV, isNavActive } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Mobile-only navigation: a hamburger trigger that opens a slide-in drawer.
 * Hidden on lg+ where the persistent sidebar takes over. Closes on route
 * change and locks body scroll while open.
 */
export function MobileNav({
  childList = [],
  activeChildId = null,
}: {
  childList?: SwitcherChild[];
  activeChildId?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close whenever the route changes (e.g. user taps a link).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll + allow Esc to close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-fog-200 transition-all"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-void/80 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 w-[82%] max-w-xs flex flex-col border-r border-white/10 bg-abyss"
              role="dialog"
              aria-label="Navigation"
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2.5"
                >
                  <HexaLogo size={26} withText />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-fog-300 transition-all"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {childList.length > 1 && (
                <div className="pt-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500 px-5 mb-2 block">
                    Active child
                  </span>
                  <ChildSwitcher items={childList} activeId={activeChildId} />
                </div>
              )}

              <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-fog-500 px-3 mb-2 mt-2">
                  Workspace
                </span>
                {DASHBOARD_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-base transition-all",
                        active
                          ? "bg-violet-500/10 border border-violet-400/30 text-fog-50"
                          : "text-fog-300 hover:bg-white/5 hover:text-fog-50 border border-transparent",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/5">
                <form action="/logout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base text-fog-400 hover:bg-white/5 hover:text-fog-100 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </form>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
