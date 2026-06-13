"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import Link from "next/link";
import { CONSENT_EVENT } from "@/components/analytics/analytics-provider";

const KEY = "hexa-cookie-consent-v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(KEY);
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(KEY, "accepted");
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(KEY, "declined");
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 z-[80] md:max-w-md"
        >
          <div className="glass-strong rounded-2xl p-5 shadow-2xl border border-violet-400/20">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-400/30">
                <Cookie className="h-4 w-4 text-violet-300" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-fog-50 mb-1">
                  We use minimal cookies
                </h4>
                <p className="text-xs text-fog-400 leading-relaxed">
                  Cookies that keep you signed in, plus — only if you accept —
                  privacy-respecting product analytics to improve HEXA for
                  parents. No advertising, and children are never tracked.{" "}
                  <Link href="/cookies" className="text-violet-300 hover:text-violet-200 underline underline-offset-2">
                    Read more
                  </Link>
                  .
                </p>
              </div>
              <button
                onClick={decline}
                className="text-fog-500 hover:text-fog-200 transition-colors"
                aria-label="Decline"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 px-4 py-2 text-xs font-medium text-white hover:shadow-[0_0_30px_-10px_rgba(124,58,237,0.6)] transition-shadow"
              >
                Accept all
              </button>
              <button
                onClick={decline}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-fog-200 hover:bg-white/10 transition-colors"
              >
                Necessary only
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
