// src/components/ui/hooks/useDebouncedValue.ts
import { useEffect, useState } from 'react';

/**
 * Simple debounce hook for UI inputs.
 */
export default function useDebouncedValue<T>(value: T, delayMs: number = 120): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debouncedValue;
}
