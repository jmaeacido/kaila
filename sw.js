const CACHE_NAME = "kaila-pwa-v251-app-icon-jobs-post";
const IS_ANDROID_WEBVIEW = /\bwv\b/i.test(navigator.userAgent || "");
const IS_NATIVE_WEBVIEW = IS_ANDROID_WEBVIEW
  && (self.location.protocol === "capacitor:"
    || self.location.hostname === "kaila-app.com"
    || ["localhost", "127.0.0.1", "::1"].includes(self.location.hostname));
const APP_PATH = new URL("./", self.location.href).pathname;
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./marketing-experience.html",
  "./marketing-experience.css",
  "./manifest.webmanifest",
  "./robots.txt",
  "./sitemap.xml",
  "./assets/Gingoog City PSGC.xlsx",
  "./assets/Butuan City PSGC.xlsx",
  "./assets/android-chrome-192x192.png",
  "./assets/android-chrome-512x512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon.ico",
  "./assets/favicon-16x16.png",
  "./assets/favicon-32x32.png",
  "./assets/kaila-icon.svg",
  "./assets/kaila-logo.svg",
  "./assets/kaila-icon.png",
  "./assets/kaila-logo.png",
  "./assets/kaila-customer-service-avatar.png",
  "./assets/kaila-preview.png"
];

self.addEventListener("install", (event) => {
  if (IS_NATIVE_WEBVIEW) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  if (IS_NATIVE_WEBVIEW) {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
    return;
  }
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (IS_NATIVE_WEBVIEW) return;
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
  const data = event.notification?.data || {};
  const action = event.action || data.action || "open-notifications";
  event.notification.close();
  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const appClient = clientList.find((client) => new URL(client.url).pathname.startsWith(APP_PATH));
    if (appClient) {
      await appClient.focus();
      appClient.postMessage({ ...data, action });
      return;
    }
    const opened = await self.clients.openWindow(APP_PATH || "./");
    opened?.postMessage?.({ ...data, action });
  })());
});
