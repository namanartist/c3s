// src/lib/uuid.ts
/**
 * Generates a standard RFC4122 v4 UUID with full support for non-secure contexts
 * (e.g. accessing via local LAN IP: http://192.168.x.x:5173 where window.crypto.randomUUID is undefined).
 */
export function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to software entropy
    }
  }

  // Fallback RFC4122 v4 generator using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
