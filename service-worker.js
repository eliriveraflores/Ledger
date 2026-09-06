const CACHE_NAME = 'ledger-cache-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version first, so a new
// deploy is picked up immediately on the next load. Only fall back to the
// cached copy if the network request genuinely fails (offline). The cache
// is refreshed with whatever was last successfully fetched, so offline use
// still works, it's just never preferred over a live version.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (req.method === 'GET' && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
