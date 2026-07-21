"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "edway-install-dismissed";

/**
 * Parent-app install prompt for the installable PWA. Listens for the browser's
 * `beforeinstallprompt`, and offers a small dismissible banner. Mounted in the
 * parent (dashboard) group only — never in (child). Purely UI: no tracking, no
 * analytics, no child data. Silently absent where the browser doesn't fire the
 * event (iOS Safari, already-installed, unsupported).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // localStorage unavailable — just proceed without the dismissal memory.
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Non-fatal — the banner just reappears next visit.
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    setVisible(false);
  };

  if (!visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Edway"
      className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-void/90 p-4 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white">
          <Download className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fog-50">Install Edway</p>
          <p className="mt-0.5 text-xs leading-snug text-fog-300">
            Add Edway to your home screen for one-tap daily lessons and offline
            resilience.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-110"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-fog-300 hover:text-fog-50"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 rounded-md p-1 text-fog-400 hover:text-fog-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
