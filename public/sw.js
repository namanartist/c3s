// public/sw.js — Robust C3S Service Worker with Stale-Chunk Protection
const CACHE_NAME = 'c3s-shell-v4';
const SHELL_ASSETS = ['/favicon.svg'];

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

  // Never intercept Vite endpoints, API routes, or hashed build assets
  // Hashed build assets are served directly by Vercel Edge with immutable cache headers
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // HTML Navigation requests: ALWAYS fetch directly from network without caching
  // This guarantees users never receive outdated HTML referencing purged deployment chunks
  const isHtml =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match('/');
        if (cached) return cached;
        return new Response('Network offline. Please check your internet connection.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // Fallback for static assets (icons, manifest)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
