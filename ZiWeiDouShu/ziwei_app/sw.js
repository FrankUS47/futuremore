/* Service Worker:第一次連線時把全部檔案存進手機,之後完全離線可用。
   快取名稱含版本號(js/version.js);更新時整組檔案一起換,不會新舊檔案混用。 */
importScripts("js/version.js");

const CACHE = "ziwei-" + self.ZW.VERSION;
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/version.js",
  "js/data.js",
  "js/brightness_minor.js",
  "js/lunar_table.js",
  "js/lunar.js",
  "js/engine.js",
  "js/reading_data.js",
  "js/scoring.js",
  "js/reading.js",
  "js/render.js",
  "js/render_reading.js",
  "js/export.js",
  "js/pwa.js",
  "js/app.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("ziwei-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() =>
        req.mode === "navigate" ? caches.match("index.html") : Response.error()
      );
    })
  );
});
