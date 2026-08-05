/*
 * Edway service worker — installable, offline-resilient PWA.
 *
 * Children's Code / data-silo invariant: this SW NEVER caches HTML navigation
 * responses (they can carry parent or child PII) and NEVER touches `/api/*`
 * (AI, TTS, STT, safety). Only immutable, PII-free static assets are cached
 * (Next build output, images, fonts, manifest, icons). Navigations are
 * network-only; when the network is unavailable a calm offline fallback page
 * is shown instead of the browser error. This means the distress gate + the
 * Teaching Checker always run server-side — no AI is ever served from cache.
 *
 * Cache is versioned; bump CACHE_VERSION on any SW logic change so old caches
 * are dropped on activate (deploy-safe invalidation).
 */
const CACHE_VERSION = "edway-static-v2";
const OFFLINE_URL = "/offline.html";

// Precache only the offline fallback — everything else is cached at runtime.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

// Drop any cache that isn't the current version.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Static asset = safe to cache (no PII, content-hashed / immutable).
function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  return /\.(?:css|js|woff2?|ttf|otf|png|jpg|jpeg|gif|svg|webp|avif|ico|webmanifest)$/i.test(
    url.pathname
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET; never intercept API, auth, or non-GET (writes must hit the server).
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigations (page loads): network-only, never cached (may contain PII),
  // with a calm offline fallback when the network is unavailable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL, { cacheName: CACHE_VERSION }).then(
          (cached) =>
            cached ||
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
        )
      )
    );
    return;
  }

  // Static assets: cache-first (fast repeat loads + offline shell), then network.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

/*
 * Web Push (F4) — parent-only milestone notifications. The push payload is a
 * small JSON blob ({ title, body, url }) built server-side; no PII beyond the
 * child's first name + topic the parent already sees on the dashboard. These
 * subscriptions are only ever created from the parent dashboard, never in child
 * mode. When VAPID is unconfigured no push can arrive, so these handlers are
 * simply dormant.
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Edway";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/favicon-32.png",
    data: { url: data.url || "/dashboard" },
    tag: data.url || "edway-milestone",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an existing Edway tab if one is open, else open a new one.
      for (const client of clients) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      for (const client of clients) {
        if ("focus" in client && "navigate" in client) {
          client.focus();
          return client.navigate(target);
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
