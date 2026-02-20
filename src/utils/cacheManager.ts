class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultTTL = 60000; // 1 minute

  async getOrFetch<T>(
    key: string,
    ttl: number = this.defaultTTL,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      return cached.data as T;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
