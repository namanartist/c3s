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
  if (typeof window === 'undefined' && typeof globalThis === 'undefined') return;

  const targetGlobal: any = typeof globalThis !== 'undefined' ? globalThis : window;

  // 1. Prototype of window.crypto instance
  try {
    if (targetGlobal.crypto) {
      const proto = Object.getPrototypeOf(targetGlobal.crypto);
      if (proto && typeof proto.randomUUID !== 'function') {
        try {
          Object.defineProperty(proto, 'randomUUID', {
            value: safeRandomUUID,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch {
          proto.randomUUID = safeRandomUUID;
        }
      }
    }
  } catch {
    // non-fatal
  }

  // 2. WebIDL Crypto interface prototype
  try {
    if (typeof targetGlobal.Crypto !== 'undefined' && targetGlobal.Crypto.prototype) {
      if (typeof targetGlobal.Crypto.prototype.randomUUID !== 'function') {
        try {
          Object.defineProperty(targetGlobal.Crypto.prototype, 'randomUUID', {
            value: safeRandomUUID,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch {
          targetGlobal.Crypto.prototype.randomUUID = safeRandomUUID;
        }
      }
    }
  } catch {
    // non-fatal
  }

  // 3. Instance level property definition
  try {
    if (targetGlobal.crypto && typeof targetGlobal.crypto.randomUUID !== 'function') {
      try {
        Object.defineProperty(targetGlobal.crypto, 'randomUUID', {
          value: safeRandomUUID,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch {
        targetGlobal.crypto.randomUUID = safeRandomUUID;
      }
    }
  } catch {
    // non-fatal
  }

  // 4. Missing crypto object fallback
  try {
    if (!targetGlobal.crypto) {
      targetGlobal.crypto = {
        randomUUID: safeRandomUUID,
        getRandomValues: (arr: any) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }
      };
    }
  } catch {
    // non-fatal
  }
}

// Auto-execute immediately upon module load
installCryptoPolyfill();
