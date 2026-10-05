// Офлайн-кэш: тяжёлые файлы движка (8.5 МБ) берём из кэша сразу, остальное — сеть в приоритете,
// чтобы обновления index.html подхватывались без ручной очистки кэша.
const CACHE = 'pep-draughts-v3';
const ASSETS = ['./index.html', './manifest.json', './scan_normal.js', './scan_normal.data',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('pep-draughts-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  const heavy = /scan_normal\.(js|data)$/.test(e.request.url);
  if (heavy) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })));
    return;
  }
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
