/* 離線快取：首次連線載入後，之後完全不需網路。
 * 更新程式後請把 VERSION 數字加 1，手機才會換成新版。 */
const VERSION = "bazi-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "css/style.css", "css/mobile.css", "js/astro.js", "js/data.js", "js/calendar.js", "js/bazi.js", "js/ziwei.js", "js/bone_data.js", "js/analysis.js", "js/places.js", "js/summary.js", "js/flow.js", "js/ui.js", "js/main.js", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
    if (e.request.method !== "GET") return;
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).catch(() => caches.match("index.html"))));
});
