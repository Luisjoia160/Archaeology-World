// Nome da versão do cache (mude para forçar atualizar tudo)
const CACHE_VERSION = 'v2';
const CACHE_NAME = `archaeologyworld-${CACHE_VERSION}`;

// Arquivos básicos para funcionar offline
const URLS_TO_CACHE = [
  '/',
  '/project.css',
  '/server.js',
  '/manifest.json',
  '/service-worker.js',
  '/fotos/b920f10b-c8ff-4e69-aeaf-515171ddf4ec.jpg'
];

// INSTALAÇÃO: pré‑cache dos arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// ATIVAÇÃO: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name.startsWith('archaeologyworld-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// FETCH: network‑first para navegação, cache‑first para estáticos
self.addEventListener('fetch', event => {
  const req = event.request;

  // Para navegação (HTML / rotas): tenta rede primeiro
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          // Atualiza cache com a versão nova da página
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return response;
        })
        .catch(() =>
          // Offline: devolve index.html do cache
          caches.match('/index.html')
        )
    );
    return;
  }

  // Para arquivos estáticos (CSS, JS, imagens): cache‑first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        // Opcional: colocar no cache quando for baixado pela primeira vez
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      });
    })
  );
});
