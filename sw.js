const CACHE = 'cheekmes-v7-2-stable';
const CORE = ['./', './index.html', './styles.css', './app.js', './icon.png', './manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || url.pathname.endsWith('/config.js')) return;
  event.respondWith(fetch(event.request).then(res => {
    const clone = res.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, clone));
    return res;
  }).catch(() => caches.match(event.request)));
});