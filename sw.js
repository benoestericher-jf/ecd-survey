/* Service worker — offline app shell caching */
const CACHE = "jf-ecd-survey-v1";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./centres.js",
  "./schema.js",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // never cache submissions
  const url = new URL(req.url);

  // Google Fonts: cache-first at runtime
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        try { const res = await fetch(req); c.put(req, res.clone()); return res; } catch { return hit; }
      })
    );
    return;
  }

  // App shell & same-origin: cache-first, fall back to network, then index for navigations
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (url.origin === location.origin) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => req.mode === "navigate" ? caches.match("./index.html") : undefined))
  );
});
