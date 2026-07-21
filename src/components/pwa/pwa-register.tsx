"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) once, after load, in production.
 * The SW only caches PII-free static assets and provides an offline fallback —
 * it never caches HTML/API responses (see public/sw.js). Registration is a
 * no-op where service workers are unsupported, so it degrades silently.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration is best-effort; a failure must never break the app.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
