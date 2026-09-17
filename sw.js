/* Offline shell. Cache-first for the app, never for the sync endpoint. */
const CACHE = 'ecd-survey-v1.0.0';
const ASSETS = [
  './', './index.html', './css/styles.css', './manifest.json',
  './js/reference.js', './js/schema-ecd.js', './js/schema-daycare.js',
  './js/store.js', './js/engine.js', './js/render.js',
  './js/export.js', './js/sync.js', './js/app.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;                 // never cache the sync POST
  if (url.hostname.includes('script.google.com')) return; // always hit the network
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
