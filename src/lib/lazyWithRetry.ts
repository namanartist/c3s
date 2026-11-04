// src/lib/lazyWithRetry.ts
import React from 'react';

/**
 * Enhanced React.lazy wrapper with automatic chunk recovery.
 * When Vercel deploys a new build, chunk hashes change. If a client is running
 * an older session, accessing a new route can throw:
 * "Failed to fetch dynamically imported module: ..."
 * 
 * This wrapper catches that specific deployment mismatch error, purges stale caches,
 * unregisters any outdated service worker, and executes a clean cache-busting reload
 * so the user seamlessly receives the latest app bundle without crashing or getting stuck.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  componentName: string = 'Component'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const storageKey = `c3s_chunk_reload_${componentName}`;

    try {
      const rawModule = (await factory()) as any;
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey);
      }

      // Safely resolve default export or fallback named component export
      const resolved =
        rawModule?.default ||
        rawModule?.[componentName] ||
        (rawModule && typeof rawModule === 'object'
          ? Object.values(rawModule).find(
              (v) => typeof v === 'function' || (typeof v === 'object' && v !== null && '$$typeof' in (v as any))
            )
          : null) ||
        rawModule;

      return {
        default: (resolved || (() => React.createElement('div', { className: 'hidden' }))) as T
      };
    } catch (error: any) {
      const message = error?.message || String(error);
      const isChunkLoadError =
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('error loading dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes("Cannot read properties of undefined (reading 'default')") ||
        message.includes("reading 'default'") ||
        error?.name === 'ChunkLoadError';

      if (isChunkLoadError && typeof window !== 'undefined') {
        const lastReload = Number(window.sessionStorage.getItem(storageKey) || 0);
        const now = Date.now();

        // Auto-refresh if not already reloaded in the last 10 seconds
        if (now - lastReload > 10000) {
          console.warn(`[C3S Recovery]: Chunk hash mismatch detected for ${componentName}. Auto-refreshing to load latest deployment assets...`);
          window.sessionStorage.setItem(storageKey, String(now));

          // Evict stale service workers and caches
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              await Promise.all(registrations.map((r) => r.unregister()));
            } catch {
              // non-fatal
            }
          }

          if ('caches' in window) {
            try {
              const cacheNames = await window.caches.keys();
              await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
            } catch {
              // non-fatal
            }
          }

          // Force clean reload with cache-busting sync query
          window.location.href = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_sync=' + now;
          return new Promise<{ default: T }>(() => {});
        }
      }

      console.error(`[C3S Dynamic Import Error]: Could not load ${componentName}:`, error);
      // Return a safe inline fallback component rather than crashing the entire screen
      return {
        default: (() =>
          React.createElement(
            'div',
            { className: 'min-h-[50vh] flex flex-col items-center justify-center p-6 text-center text-slate-300' },
            React.createElement(
              'p',
              { className: 'text-sm font-bold text-amber-400 mb-2' },
              `Module sync in progress (${componentName})`
            ),
            React.createElement(
              'button',
              {
                onClick: () => window.location.reload(),
                className: 'px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg cursor-pointer'
              },
              'Reload Interface'
            )
          )) as any
      };
    }
  });
}
