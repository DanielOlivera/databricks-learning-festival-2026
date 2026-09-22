const CACHE = "study-lab-v3";
const ASSETS = [
  "/app/index.html", "/app/js/app.js", "/app/data/seed.js", "/app/manifest.webmanifest",
  "/ui/tokens.css", "/ui/base.css", "/ui/components.css", "/ui/icons.svg",
  "/ui/fonts/fonts.css",
  "/ui/fonts/barlow-400-latin.woff2", "/ui/fonts/barlow-400-latin-ext.woff2",
  "/ui/fonts/barlow-500-latin.woff2", "/ui/fonts/barlow-500-latin-ext.woff2",
  "/ui/fonts/barlow-600-latin.woff2", "/ui/fonts/barlow-600-latin-ext.woff2",
  "/ui/fonts/barlow-700-latin.woff2", "/ui/fonts/barlow-700-latin-ext.woff2",
  "/ui/fonts/barlow-condensed-600-latin.woff2", "/ui/fonts/barlow-condensed-600-latin-ext.woff2",
  "/ui/fonts/barlow-condensed-700-latin.woff2", "/ui/fonts/barlow-condensed-700-latin-ext.woff2",
  "/ui/fonts/jetbrains-mono-400-latin.woff2", "/ui/fonts/jetbrains-mono-400-latin-ext.woff2",
  "/ui/icons/icon-192.png", "/ui/icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) =>
    Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("/app/index.html")))
  );
});
