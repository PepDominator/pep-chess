// Офлайн-кэш шахмат. Сеть в приоритете — обновления index.html подхватываются сами.
// Чистим только СВОИ старые кэши (префикс pep-chess-), чтобы не задеть шашки и общее меню.
const CACHE = 'pep-chess-v7';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
// общие модули страницы (site/shared/) — сохраняем сразу при установке, иначе после первого открытия без интернета их может не оказаться
const SHARED = ['../shared/pg-settings.js', '../shared/pg-chat.js', '../shared/pg-sync.js', '../shared/pg-friends.js', '../shared/pg-ach.js', '../shared/pg-rules.js', '../shared/pg-tutor.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.concat(SHARED))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const ks = (await caches.keys()).filter((k) => k.startsWith('pep-chess-') && k !== CACHE), cur = await caches.open(CACHE);
    for (const k of ks) { const c = await caches.open(k); const hit = await c.match('./stockfish.wasm'); if (hit && !(await cur.match('./stockfish.wasm'))) await cur.put('./stockfish.wasm', hit); await caches.delete(k); }   // уже скачанный движок переносим
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  // движок Stockfish (stockfish.wasm, ~1,7 МБ): из кэша сразу, в сеть — только если его ещё нет
  if (e.request.method === 'GET' && /\/stockfish\.wasm$/.test(new URL(e.request.url).pathname)) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); } return r; })));
    return;
  }
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
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
