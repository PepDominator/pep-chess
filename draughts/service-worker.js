// Офлайн-кэш: тяжёлые файлы движка (8.5 МБ) берём из кэша сразу, остальное — сеть в приоритете,
// чтобы обновления index.html подхватывались без ручной очистки кэша.
const CACHE = 'pep-draughts-v5';
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
  if (/scan_normal\.(js|data)$/.test(e.request.url)) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request, { cache: 'no-cache' }).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); } return r; })));
    return;
  }
  e.respondWith(networkFirst(e.request));
});
// Сеть в приоритете, но только исправный ответ (2xx) годится: при ошибке сервера (например, 503, когда хостинг «лежит») отдаём сохранённую копию.
async function networkFirst(req) {
  const cache = await caches.open(CACHE); let bad = null;
  try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok || r.type === 'opaque') { cache.put(req, r.clone()); return r; } bad = r; } catch (err) {}
  const hit = await cache.match(req, { ignoreSearch: true }); if (hit) return hit;
  if (req.mode === 'navigate') { const idx = await cache.match('./index.html'); if (idx) return idx; }
  return bad || Response.error();
}
