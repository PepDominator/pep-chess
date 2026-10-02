// Service worker: кэширует приложение, чтобы после первого открытия игра работала
// полностью офлайн — но при этом, пока есть интернет, ВСЕГДА предпочитает свежую версию
// с сервера, а не кэш. Кэш используется только как резерв на случай отсутствия сети.
// Благодаря этому новую версию index.html не нужно вручную "продавливать" через
// очистку кэша браузера — она подхватывается сама при следующем открытии с интернетом.
const CACHE_NAME = 'pep-chess-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Запросы к сторонним сервисам (Firebase и т.п.) не трогаем — пусть идут как обычно,
  // без офлайн-кэширования; это актуально только для файлов самого приложения.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Сеть доступна — отдаём свежий ответ и заодно обновляем кэш для будущего офлайна.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => {
        // Сети нет — используем то, что успели закэшировать раньше.
        return caches.match(event.request);
      })
  );
});
