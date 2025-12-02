// Nome da versão do cache (mude para forçar atualizar tudo)
const CACHE_VERSION = 'v3';
const CACHE_NAME = `archaeologyworld-${CACHE_VERSION}`;

// Arquivos básicos para funcionar offline
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/project.css',
  '/manifest.json',
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
  // deixa requisições não‑GET passarem direto
  if (event.request.method !== 'GET') return;

  const req = event.request;

  if (req.mode === 'navigate') {
    // Navegação (HTML / rotas): network‑first com fallback seguro
    event.respondWith(handleNavigateRequest(req));
  } else {
    // CSS, JS, imagens etc.: cache‑first com fallback simples
    event.respondWith(handleStaticRequest(req));
  }
});

async function handleNavigateRequest(req) {
  try {
    const networkResponse = await fetch(req);

    // Atualiza cache com a versão nova da página
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, networkResponse.clone());

    return networkResponse;
  } catch (err) {
    // Offline ou erro: tenta index.html, depois /
    const cachedIndex = await caches.match('/index.html');
    if (cachedIndex) return cachedIndex;

    const cachedRoot = await caches.match('/');
    if (cachedRoot) return cachedRoot;

    // Fallback final: sempre devolver um Response
    return new Response(
      '<h1>Offline</h1><p>Você está sem conexão e esta página ainda não foi salva para uso offline.</p>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

async function handleStaticRequest(req) {
  // 1. Tenta o cache
  const cached = await caches.match(req);
  if (cached) return cached;

  // 2. Tenta a rede
  try {
    const networkResponse = await fetch(req);

    // Opcional: coloca no cache quando for baixado pela primeira vez
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, networkResponse.clone());

    return networkResponse;
  } catch (err) {
    // 3. Fallback: ainda assim devolver um Response válido
    return new Response('', { status: 504 });
  }
}
