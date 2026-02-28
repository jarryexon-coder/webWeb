// src/utils/usePhraseCache.ts
import { useRef } from 'react';
import { SecretPhrase } from '../pages/SecretPhrasesScreen';

export function usePhraseCache() {
  const cache = useRef<Map<string, { data: SecretPhrase[]; timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCached = (key: string): SecretPhrase[] | null => {
    const entry = cache.current.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  };

  const setCached = (key: string, data: SecretPhrase[]) => {
    cache.current.set(key, { data, timestamp: Date.now() });
  };

  return { getCached, setCached };
}
