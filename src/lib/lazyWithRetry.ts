// src/lib/lazyWithRetry.ts
import React from 'react';

/**
 * Enhanced React.lazy wrapper with automatic chunk recovery.
 * When Vercel deploys a new build, chunk hashes change. If a client is running
 * an older session, accessing a new route can throw:
 * "Failed to fetch dynamically imported module: ..."
 * 
 * This wrapper catches that specific deployment mismatch error, purges stale caches,
 * and executes a single clean cache-busting reload so the user seamlessly receives
 * the latest app bundle without crashing or getting stuck.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  componentName: string = 'Component'
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const storageKey = `c3s_chunk_reload_${componentName}`;
    const alreadyReloaded = typeof window !== 'undefined' ? window.sessionStorage.getItem(storageKey) : null;

    try {
      const module = await factory();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey);
      }
      return module;
    } catch (error: any) {
      const message = error?.message || String(error);
      const isChunkLoadError =
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('error loading dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      if (isChunkLoadError && typeof window !== 'undefined' && !alreadyReloaded) {
        console.warn(`[C3S Recovery]: Chunk hash mismatch detected for ${componentName}. Auto-refreshing to load latest deployment assets...`);
        window.sessionStorage.setItem(storageKey, 'true');

        // Evict any stale service worker or cache storage entries
        if ('caches' in window) {
          try {
            const cacheNames = await window.caches.keys();
            await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
          } catch {
            // non-fatal
          }
        }

        // Force cache-busting reload
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }

      console.error(`[C3S Dynamic Import Error]: Could not load ${componentName}:`, error);
      throw error;
    }
  });
}
