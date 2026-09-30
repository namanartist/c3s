// src/hooks/useSvgMap.ts
import { useState, useEffect } from 'react';

// Module-level global cache mapping url -> SVG text content to persist across unmounts/remounts
const svgCache: { [url: string]: string } = {};

/** Hook that fetches the SVG content from a Cloudinary URL and returns it as a raw HTML string. */
export function useSvgMap(svgUrl: string | null): {
  svgContent: string | null;
  isLoading: boolean;
  error: string | null;
} {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (svgUrl === null) {
      setSvgContent(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    const url: string = svgUrl;

    // Return cached content immediately if it exists
    if (svgCache[url]) {
      setSvgContent(svgCache[url]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchSvg() {
      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            Accept: 'image/svg+xml',
          },
          // Set fetch priority high to load map images faster
          ...({ priority: 'high' } as any),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();

        if (!isCancelled) {
          svgCache[url] = text;
          setSvgContent(text);
        }
      } catch (err: unknown) {
        console.error(`CORS or Network error fetching SVG from URL: ${url}`, err);
        if (!isCancelled) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setError(message);
          setSvgContent(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSvg();

    return () => {
      isCancelled = true;
    };
  }, [svgUrl]);

  return { svgContent, isLoading, error };
}

