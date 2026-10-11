const CACHE = 'smb-sunday-v10';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './w_E_202608.pdf',
  './sjjsm_E.pdf',
  './brutus.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './wt-pages/p11.jpg',
  './wt-pages/p14.jpg',
  './games/engine.js',
  './games/w-01.html',
  './games/w-02.html',
  './games/w-03.html',
  './games/w-04.html',
  './games/w-05.html',
  './games/w-06.html',
  './games/w-07.html',
  './games/w-08.html',
  './games/w-09.html',
  './games/w-10.html',
  './games/w-11.html',
  './games/w-12.html',
  './games/w-13.html',
  './games/w-14.html',
  './games/w-15.html',
  './games/w-16.html',
  './games/w-17.html',
  './games/w-18.html'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res && res.ok && res.type !== 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || fetched;
    })
  );
});
