"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

/**
 * PostHog product analytics — parents only.
 *
 * HARD PRIVACY BOUNDARY (Children's Code): this provider is mounted in the
 * (marketing), (auth) and (dashboard) layouts ONLY. It must never be imported
 * from (child) routes — children are never tracked, profiled or
 * session-recorded.
 *
 * Further constraints, all enforced here:
 * - No-op when NEXT_PUBLIC_POSTHOG_KEY is unset (graceful degradation).
 * - Init only after cookie consent ("accepted" in the existing banner).
 * - Autocapture off (no input values), session recording off.
 * - Parents identified by Mongo id only — never email or name.
 */

const CONSENT_KEY = "hexa-cookie-consent-v1";
/** Dispatched by the cookie banner so a same-page consent enables analytics. */
export const CONSENT_EVENT = "hexa-consent-change";

let initialized = false;

function consentGranted(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function initIfAllowed(): boolean {
  if (initialized) return true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || !consentGranted()) return false;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    autocapture: false,
    capture_pageview: false, // captured manually on route change below
    disable_session_recording: true,
    person_profiles: "identified_only",
  });
  initialized = true;
  return true;
}

/** Fire a named product event. Safe no-op before init/consent. */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!initialized) return;
  posthog.capture(event, props);
}

export function AnalyticsProvider({
  identifyAs,
}: {
  /** Parent Mongo id (hex string). Never pass email or a name. */
  identifyAs?: string | null;
}) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (initIfAllowed()) setReady(true);
    const onConsent = () => {
      if (initIfAllowed()) setReady(true);
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!ready) return;
    posthog.capture("$pageview");
  }, [ready, pathname]);

  useEffect(() => {
    if (!ready || !identifyAs) return;
    posthog.identify(identifyAs);
  }, [ready, identifyAs]);

  return null;
}

/** Fires a named event once on mount (e.g. pricing_viewed). */
export function TrackOnMount({ event }: { event: string }) {
  useEffect(() => {
    track(event);
  }, [event]);
  return null;
}
