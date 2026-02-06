// src/hooks/useSportsQueries.ts
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';

export const useSecretPhrases = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/secret/phrases`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.message || 'Failed to fetch secret phrases');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Secret phrases error:', err);
      
      // Mock fallback
      setData({
        success: true,
        scraped: false,
        timestamp: new Date().toISOString(),
        phrases: [
          {
            id: '1',
            text: 'Team A has a 65% win probability against Team B due to strong home record',
            category: 'expert_prediction',
            source: 'mock',
            confidence: 85,
            scraped_at: new Date().toISOString()
          }
        ],
        sources: ['mock']
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    return fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching: isLoading
  };
};

export const usePredictionOutcomes = (sport: string = 'nba') => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/predictions/outcomes?sport=${sport}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.message || 'Failed to fetch prediction outcomes');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Prediction outcomes error:', err);
      
      // Mock fallback
      setData({
        success: true,
        scraped: false,
        timestamp: new Date().toISOString(),
        outcomes: [
          {
            id: '1',
            sport: sport,
            game: `${sport.toUpperCase()} Game 1`,
            prediction: 'Team A wins by 5+ points',
            confidence_pre_game: 75,
            outcome: 'correct',
            actual_result: 'Win by 8 points',
            accuracy: 85,
            timestamp: new Date().toISOString(),
            source: 'mock'
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    return fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching: isLoading
  };
};
