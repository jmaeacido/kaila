const CACHE_NAME = "kaila-pwa-v123";
const APP_PATH = new URL("./", self.location.href).pathname;
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./robots.txt",
  "./sitemap.xml",
  "./assets/Gingoog City PSGC.xlsx",
  "./assets/android-chrome-192x192.png",
  "./assets/android-chrome-512x512.png",
  "./assets/apple-touch-icon.png",
  "./assets/kaila-icon.svg",
  "./assets/kaila-logo.svg",
  "./assets/kaila-customer-service-avatar.png",
  "./assets/kaila-preview.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith("/kaila-api/") || requestUrl.pathname.startsWith(`${APP_PATH}kaila-api/`) || requestUrl.pathname.includes("/socket.io/")) {
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }))
    );
    return;
  }

  if (!requestUrl.pathname.startsWith(APP_PATH)) return;
  const isFreshAsset = ["script", "style", "manifest"].includes(event.request.destination)
    || /\.(?:js|css|webmanifest)$/i.test(requestUrl.pathname);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (isFreshAsset) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});

self.addEventListener("notificationclick", (event) => {
  const action = event.action || event.notification?.data?.action || "open-notifications";
  event.notification.close();
  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const appClient = clientList.find((client) => new URL(client.url).pathname.startsWith(APP_PATH));
    if (appClient) {
      await appClient.focus();
      appClient.postMessage({ action });
      return;
    }
    const opened = await self.clients.openWindow(APP_PATH || "./");
    opened?.postMessage?.({ action });
  })());
});
