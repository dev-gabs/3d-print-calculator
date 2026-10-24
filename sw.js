// Service worker da 3D Price: permite instalar o app e abrir sem internet.
// Páginas: rede primeiro (pega atualização), cache se estiver offline.
// Arquivos de /assets/ (com hash no nome): cache primeiro, porque nunca mudam.
// Ao publicar mudanças grandes, aumente CACHE_VERSION para limpar o cache antigo.
const CACHE_VERSION = 'v1';
const CACHE = `3dprice-${CACHE_VERSION}`;
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(APP_SHELL);
      // Já guarda o JS e o CSS do build atual, para o app abrir offline desde a primeira visita.
      const html = await (await cache.match('./index.html')).text();
      const assets = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map((m) => m[1]);
      await cache.addAll(assets);
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('3dprice-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Fontes do Google: cache primeiro, para a tipografia funcionar offline.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html', { ignoreVary: true }).then((r) => r || caches.match('./', { ignoreVary: true })))
    );
    return;
  }

  event.respondWith(url.pathname.includes('/assets/') ? cacheFirst(request) : staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}
