// P2 Prep service worker — makes the installed app work offline permanently.
// Strategy: network-first for page loads (so updates arrive whenever the local
// server happens to be running), cache fallback when offline/server closed.
const CACHE = 'p2prep-cache-v1.5.0';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    fetch(req)
      .then((resp) => {
        // Server reachable: refresh the cache with the latest copy.
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() =>
        // Offline / server app closed: serve from cache.
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
