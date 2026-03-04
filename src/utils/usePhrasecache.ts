// src/utils/usePhraseCache.ts
import { useRef } from 'react';

export function usePhraseCache<T = any>() {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCached = (key: string): T | null => {
    const entry = cache.current.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  };

  const setCached = (key: string, data: T) => {
    cache.current.set(key, { data, timestamp: Date.now() });
  };

  return { getCached, setCached };
}
