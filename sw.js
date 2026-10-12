// Кэш для работы без интернета: после первого открытия всё берётся из кэша, а обновляется в фоне.
const CACHE = 'naryady-offline-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      if (hit) return hit;
      const res = await net;
      return res || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
    })
  );
});
