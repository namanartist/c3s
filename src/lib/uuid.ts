// src/lib/uuid.ts
/**
 * Generates a standard RFC4122 v4 UUID with full support for non-secure contexts
 * (e.g. accessing via local LAN IP: http://192.168.x.x:5173 where window.crypto.randomUUID is undefined).
 */
export function safeRandomUUID(): string {
  // Use crypto.getRandomValues if available (works in both HTTP and HTTPS across all modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC4122
      const hex: string[] = [];
      for (let i = 0; i < 16; i++) {
        hex.push((bytes[i] < 16 ? '0' : '') + bytes[i].toString(16));
      }
      return (
        hex.slice(0, 4).join('') + '-' +
        hex.slice(4, 6).join('') + '-' +
        hex.slice(6, 8).join('') + '-' +
        hex.slice(8, 10).join('') + '-' +
        hex.slice(10, 16).join('')
      );
    } catch {
      // Fall through to Math.random
    }
  }

  // Fallback RFC4122 v4 generator using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Installs prototype and proxy hooks so that any module or library calling
 * window.crypto.randomUUID() or crypto.randomUUID() works seamlessly in insecure contexts.
 */
export function installCryptoPolyfill(): void {
  if (typeof window === 'undefined') return;

  // 1. Prototype level definition (WebIDL Crypto interface prototype)
  try {
    if (typeof (window as any).Crypto !== 'undefined' && (window as any).Crypto.prototype) {
      if (typeof (window as any).Crypto.prototype.randomUUID !== 'function') {
        Object.defineProperty((window as any).Crypto.prototype, 'randomUUID', {
          value: safeRandomUUID,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
    }
  } catch {
    // non-fatal
  }

  // 2. Instance level property definition
  try {
    if (window.crypto && typeof window.crypto.randomUUID !== 'function') {
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: safeRandomUUID,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch {
        (window.crypto as any).randomUUID = safeRandomUUID;
      }
    }
  } catch {
    // non-fatal
  }

  // 3. Fallback: Proxy wrapper if window.crypto.randomUUID is STILL not a function
  try {
    if (!window.crypto || typeof window.crypto.randomUUID !== 'function') {
      const realCrypto = window.crypto || {};
      const proxyCrypto = new Proxy(realCrypto, {
        get(target, prop, receiver) {
          if (prop === 'randomUUID') return safeRandomUUID;
          const val = Reflect.get(target, prop, receiver);
          return typeof val === 'function' ? val.bind(target) : val;
        }
      });
      try {
        Object.defineProperty(window, 'crypto', {
          value: proxyCrypto,
          writable: true,
          configurable: true
        });
      } catch {
        try {
          (window as any).crypto = proxyCrypto;
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // non-fatal
  }
}

// Auto-execute immediately upon module load
installCryptoPolyfill();
