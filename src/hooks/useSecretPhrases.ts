// hooks/useSecretPhrases.ts
import { useState, useEffect, useCallback } from 'react';

interface UseSecretPhrasesOptions {
  sport?: string;
  category?: string;
  minConfidence?: number;
  autoRefresh?: boolean;
}

export const useSecretPhrases = (options: UseSecretPhrasesOptions = {}) => {
  const {
    sport = 'nba',
    category = 'all',
    minConfidence = 65,
    autoRefresh = true
  } = options;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhrases = useCallback(async () => {
    try {
      const url = `/api/secret-phrases?sport=${sport}&category=${category}&min_confidence=${minConfidence}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch phrases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sport, category, minConfidence]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchPhrases();
  }, [fetchPhrases]);

  useEffect(() => {
    fetchPhrases();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPhrases, 5 * 60 * 1000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [fetchPhrases, autoRefresh]);

  return {
    data,
    loading,
    error,
    refreshing,
    refresh,
    phrases: data?.phrases || [],
    aggregatedInsights: data?.aggregated_insights,
    sources: data?.sources || [],
    count: data?.count || 0
  };
};
