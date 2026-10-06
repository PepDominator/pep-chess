// Общее меню. Обрабатывает только собственные файлы; страницы игр живут в своих подпапках
// со своими service worker'ами и сюда не попадают. Чистит только свои кэши (префикс pep-hub-).
const CACHE = 'pep-hub-v2';
const OWN = ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const base = self.registration.scope;
const isOwn = (url) => { const u = new URL(url); if (!url.startsWith(base)) return false; const rest = u.pathname.slice(new URL(base).pathname.length); return rest === '' || OWN.includes(rest); };
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./index.html', './manifest.json', './icon-192.png', './icon-512.png'])).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('pep-hub-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !isOwn(e.request.url)) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html'))));
});
