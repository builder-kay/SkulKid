const CACHE_VERSION = "skulkid-static-v3";
const OFFLINE_PAGE = "/offline.html";
const PRECACHE = [
  OFFLINE_PAGE,
  "/brand/skulkid-mark.png",
  "/pwa/icon-192.png",
  "/pwa/icon-512.png",
  "/pwa/maskable-192.png",
  "/pwa/maskable-512.png",
  "/pwa/apple-touch-icon.png"
];
const OPTIONAL_PRECACHE = [
  "/audio/student-celebration.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => caches.open(CACHE_VERSION))
      .then((cache) => Promise.allSettled(OPTIONAL_PRECACHE.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("skulkid-static-") && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        return cache.match(OFFLINE_PAGE);
      })
    );
    return;
  }

  if (
    url.pathname.startsWith("/api/")
    || url.pathname.startsWith("/auth/")
    || request.headers.has("authorization")
  ) {
    return;
  }

  const cacheableStaticAsset = url.pathname.startsWith("/_next/static/")
    || url.pathname.startsWith("/brand/")
    || url.pathname.startsWith("/pwa/")
    || url.pathname.startsWith("/placeholders/")
    || url.pathname.startsWith("/audio/")
    || ["style", "script", "font", "image", "audio"].includes(request.destination);

  if (!cacheableStaticAsset) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "SkulKid update", body: "Open SkulKid to view your latest class update.", url: "/classes" };
  }
  const title = payload.title || "SkulKid class update";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.some((client) => client.visibilityState === "visible")) return undefined;
      return self.registration.showNotification(title, {
        body: payload.body || "Open SkulKid to view the update.",
        icon: "/pwa/icon-192.png",
        badge: "/pwa/icon-192.png",
        tag: payload.tag || "skulkid-class-update",
        renotify: true,
        data: { url: payload.url || "/classes" },
        vibrate: [120, 70, 120]
      });
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/classes", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          if ("navigate" in client) await client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});
