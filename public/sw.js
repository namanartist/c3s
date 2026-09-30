// public/sw.js — Robust C3S Service Worker
const CACHE_NAME = 'c3s-shell-v2';
const SHELL_ASSETS = ['/', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('SW: Pre-cache warning (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept non-GET requests or cross-origin requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never intercept Vite development endpoints or API routes
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Only return navigation HTML fallback for HTML document requests
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          const fallbackHtml = await caches.match('/');
          if (fallbackHtml) return fallbackHtml;
        }

        // Return a clean offline error response rather than crashing with corrupted MIME
        return new Response('Offline resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});