// Офлайн-кэш «Кроссвычерк». Сеть в приоритете; словарь кэшируется при первом открытии. Чистим только свои кэши (префикс pep-code-).
const CACHE = 'pep-code-v1';
const ASSETS = ['./index.html', './words.json', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('pep-code-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(networkFirst(e.request));
});
async function networkFirst(req) {
  const cache = await caches.open(CACHE); let bad = null;
  try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok || r.type === 'opaque') { cache.put(req, r.clone()); return r; } bad = r; } catch (err) {}
  const hit = await cache.match(req, { ignoreSearch: true }); if (hit) return hit;
  if (req.mode === 'navigate') { const idx = await cache.match('./index.html'); if (idx) return idx; }
  return bad || Response.error();
}
