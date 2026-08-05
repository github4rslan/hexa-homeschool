"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

/**
 * Web Push opt-in control (F4) — parents-only, on the settings page.
 *
 * Consent-gated (an explicit tap requests the browser permission) and additive
 * to the existing email/SMS/feed milestone channels. It self-hides when Web Push
 * is unavailable: unsupported browser, or `WEB_PUSH_*` unset on the server
 * (`/api/push/public-key` → 503) — so an unconfigured production shows nothing at
 * all (graceful degradation), never a dead button. Never rendered in child mode.
 */

type Status = "checking" | "unavailable" | "off" | "on" | "working" | "denied";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supported) {
        setStatus("unavailable");
        return;
      }
      try {
        const res = await fetch("/api/push/public-key");
        if (!res.ok) {
          if (!cancelled) setStatus("unavailable");
          return;
        }
        const { key } = (await res.json()) as { key: string };
        if (cancelled) return;
        setVapidKey(key);
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (cancelled) return;
        if (Notification.permission === "denied") {
          setStatus("denied");
        } else {
          setStatus(existing ? "on" : "off");
        }
      } catch {
        if (!cancelled) setStatus("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    if (!vapidKey) return;
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      setStatus(res.ok ? "on" : "off");
    } catch {
      setStatus("off");
    }
  }, [vapidKey]);

  const disable = useCallback(async () => {
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe().catch(() => {});
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        }).catch(() => {});
      }
      setStatus("off");
    } catch {
      setStatus("off");
    }
  }, []);

  // Silent no-op when unavailable/unconfigured — render nothing at all.
  if (status === "checking" || status === "unavailable") return null;

  return (
    <div className="mt-5 flex items-start gap-3 border-t border-white/5 pt-5">
      <div className="mt-0.5 text-violet-300">
        {status === "on" ? (
          <Bell className="h-4 w-4" aria-hidden="true" />
        ) : (
          <BellOff className="h-4 w-4" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-fog-100">
          On-device push notifications
        </div>
        <p className="mt-0.5 text-xs text-fog-500">
          {status === "denied"
            ? "Notifications are blocked for this site in your browser settings — allow them there to turn this on."
            : status === "on"
              ? "This device gets an instant alert the moment your child masters a topic. Turn off any time."
              : "Get an instant alert on this device when your child hits a milestone — no email needed."}
        </p>
        {status !== "denied" && (
          <button
            type="button"
            onClick={status === "on" ? disable : enable}
            disabled={status === "working"}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-60"
          >
            {status === "working" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            {status === "on" ? "Turn off on this device" : "Turn on for this device"}
          </button>
        )}
      </div>
    </div>
  );
}
