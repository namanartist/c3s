// api/_unimap.ts
/**
 * Helper to communicate with the internal 'unimap' service via Vercel service bindings.
 * The bound internal URL is injected at runtime via process.env.UNIMAP_SERVICE_URL.
 */
export async function fetchFromUniMapService<T>(endpoint: string): Promise<T | null> {
  const serviceUrl = process.env.UNIMAP_SERVICE_URL;
  if (!serviceUrl) {
    return null;
  }

  try {
    const targetUrl = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, serviceUrl);
    const res = await fetch(targetUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const json = (await res.json()) as { data?: T } | T;
      if (json && typeof json === 'object' && 'data' in json && (json as { data?: T }).data !== undefined) {
        return (json as { data: T }).data;
      }
      return json as T;
    }

    console.warn(`[UniMap Binding]: Request to ${targetUrl.toString()} returned HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[UniMap Binding]: Could not reach internal service at ${serviceUrl}:`, err);
  }

  return null;
}

