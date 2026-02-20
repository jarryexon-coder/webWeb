import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // TTL in minutes
}

export const useCache = <T>(key: string, ttlMinutes: number = 15) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  const get = async (): Promise<T | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const item: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      const ageMinutes = (now - item.timestamp) / (1000 * 60);

      setIsStale(ageMinutes > ttlMinutes);
      
      if (ageMinutes < ttlMinutes * 2) { // Return if within 2x TTL
        return item.data;
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  };

  const set = async (newData: T, customTTL?: number) => {
    try {
      const item: CacheItem<T> = {
        data: newData,
        timestamp: Date.now(),
        expiry: customTTL || ttlMinutes
      };
      await AsyncStorage.setItem(key, JSON.stringify(item));
      setData(newData);
      setIsStale(false);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  };

  const clear = async () => {
    try {
      await AsyncStorage.removeItem(key);
      setData(null);
      setIsStale(false);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  };

  const refresh = async (fetchFn: () => Promise<T>) => {
    setIsLoading(true);
    try {
      const freshData = await fetchFn();
      await set(freshData);
      return freshData;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    get().then(cached => {
      if (cached) {
        setData(cached);
      }
      setIsLoading(false);
    });
  }, [key]);

  return {
    data,
    isLoading,
    isStale,
    set,
    get,
    clear,
    refresh
  };
};
