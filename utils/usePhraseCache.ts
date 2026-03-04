// utils/usePhraseCache.ts
// Simple in-memory cache hook for storing arbitrary data by key.

type CacheValue = any;

export const usePhraseCache = () => {
  // Use a Map to store cached values. Each instance of the hook gets its own cache.
  // If you need a shared cache across components, you could move this Map outside the function.
  const cache = new Map<string, CacheValue>();

  /**
   * Retrieve a cached value by key.
   * @param key - The cache key.
   * @returns The cached value, or undefined if not found.
   */
  const getCached = (key: string): CacheValue | undefined => {
    return cache.get(key);
  };

  /**
   * Store a value in the cache.
   * @param key - The cache key.
   * @param value - The value to store.
   */
  const setCached = (key: string, value: CacheValue): void => {
    cache.set(key, value);
  };

  return { getCached, setCached };
};
