// src/hooks/useSearch.ts
import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import { SearchResult } from '../types/sports-wire.types';
import { SearchResponse } from '../types/api.types';

export const useSearch = (sport: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(searchQuery);

    try {
      const data = await apiClient.searchAllTeams(searchQuery, sport);
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setQuery('');
    setError(null);
  }, []);

  const getResultsByType = useCallback((type: SearchResult['type']) => {
    return results.filter(result => result.type === type);
  }, [results]);

  return {
    query,
    results,
    loading,
    error,
    search,
    clearSearch,
    getResultsByType,
    hasResults: results.length > 0,
    beatWriterResults: getResultsByType('beat_writer'),
    playerResults: getResultsByType('player'),
    injuryResults: getResultsByType('injury')
  };
};
