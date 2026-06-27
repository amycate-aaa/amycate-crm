const CACHE = 'wedding-crm-v92';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => caches.match(e.request)));
});
