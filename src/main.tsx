// src/main.tsx
import { installCryptoPolyfill } from './lib/uuid';

// Immediate global polyfill for crypto.randomUUID on non-secure contexts (e.g. LAN IP hosting: http://192.168.x.x)
installCryptoPolyfill();

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Handle dynamic chunk load errors triggered by redeployments or temporary network drops
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', async (event) => {
    console.warn('[C3S]: Detected Vite preload chunk mismatch from new deployment. Synchronizing...');
    event.preventDefault();
    const lastReload = Number(sessionStorage.getItem('c3s_preload_reload') || 0);
    const now = Date.now();
    if (now - lastReload > 8000) {
      sessionStorage.setItem('c3s_preload_reload', String(now));
      try {
        if ('caches' in window) {
          const keys = await window.caches.keys();
          await Promise.all(keys.map((k) => window.caches.delete(k)));
        }
      } catch {
        // non-fatal
      }
      window.location.href = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_sync=' + now;
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[C3S SW]: Service worker registration note:', err);
    });
  });
}
