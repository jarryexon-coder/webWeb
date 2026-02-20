// frontend/hooks/useParlaySuggestions.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';

interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  icon: string;
  legs: any[];
  total_odds: number;
  confidence: number;
  confidence_level: 'high' | 'medium' | 'low';
  analysis?: string;
  expected_value?: string;
  correlation_score?: number;
}

export const useParlaySuggestions = (sport: string = 'all', limit: number = 6) => {
  const [suggestions, setSuggestions] = useState<ParlaySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getParlaySuggestions(sport, limit);
      
      if (response.success) {
        setSuggestions(response.suggestions || []);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load suggestions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sport, limit]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const refresh = useCallback(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const getSuggestionById = useCallback((id: string) => {
    return suggestions.find(s => s.id === id);
  }, [suggestions]);

  return {
    suggestions,
    loading,
    error,
    lastUpdated,
    refresh,
    getSuggestionById,
    isEmpty: suggestions.length === 0
  };
};
