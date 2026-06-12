/**
 * Shared Sentry setup for the client / server / edge configs.
 *
 * Privacy hard requirement (children's platform): events must carry stack
 * traces and route names ONLY. No user identity, no request bodies, no
 * cookies, no headers, no session replay. `scrubAndTag` enforces that as the
 * single beforeSend used by every runtime — keep all three configs on it.
 */

export function sentryDsn(): string | undefined {
  // NEXT_PUBLIC_ so the same value reaches the browser bundle; the plain
  // server-side var also works. Unset = Sentry never initialises (no-op).
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined;
}

export type RouteGroup =
  | "marketing"
  | "auth"
  | "dashboard"
  | "child"
  | "admin"
  | "api";

/**
 * Map a pathname back to its App Router route group so child-facing errors
 * can be prioritized. Mirrors the groups under src/app/ (groups are stripped
 * from URLs, so this is by prefix). /api/tutor|tts|stt serve the child lesson
 * flow and count as "child".
 */
export function routeGroupFromPath(pathname: string): RouteGroup {
  const p = pathname.toLowerCase();
  if (p.startsWith("/admin")) return "admin";
  if (p.startsWith("/learn")) return "child";
  if (/^\/api\/(tutor|tts|stt)\b/.test(p)) return "child";
  if (p.startsWith("/api/")) return "api";
  if (/^\/(login|signup|verify|logout|forgot-password)\b/.test(p)) return "auth";
  if (
    /^\/(dashboard|settings|schedule|tutoring|portfolio|onboarding|lesson)\b/.test(p) ||
    p.startsWith("/compliance/cnis")
  ) {
    return "dashboard";
  }
  return "marketing";
}

interface ScrubbableEvent {
  user?: unknown;
  transaction?: string;
  tags?: { [key: string]: unknown };
  request?: {
    url?: string;
    cookies?: unknown;
    headers?: unknown;
    data?: unknown;
    query_string?: unknown;
  };
  breadcrumbs?: { data?: unknown }[];
}

/** beforeSend for every runtime: strip PII, tag the route group. */
export function scrubAndTag<T extends ScrubbableEvent>(
  event: T,
): T & { tags: { [key: string]: unknown } } {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
  }
  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) delete crumb.data;
  }

  let pathname = "";
  try {
    if (event.request?.url) pathname = new URL(event.request.url).pathname;
  } catch {
    /* relative or malformed URL — fall through to transaction */
  }
  if (!pathname && event.transaction?.startsWith("/")) {
    pathname = event.transaction;
  }
  event.tags = { ...event.tags, route_group: routeGroupFromPath(pathname) };
  return event as T & { tags: { [key: string]: unknown } };
}
