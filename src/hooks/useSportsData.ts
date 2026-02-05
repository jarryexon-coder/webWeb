// src/hooks/useSportsData.ts - UPDATED VERSION
import { useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../config/api';

// Generic fetch hook
const useApiData = <T,>(endpoint: string, initialData: T, params?: Record<string, string>) => {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = `${API_BASE_URL}${endpoint}`;
        
        // Add query parameters if provided
        if (params) {
          const queryString = new URLSearchParams(params).toString();
          url += `?${queryString}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        
        // Handle different API response structures
        if (result.data !== undefined) {
          setData(result.data);
        } else if (Array.isArray(result)) {
          setData(result as T);
        } else {
          setData(result as T);
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error(`Error fetching ${endpoint}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(params)]); // Re-run when params change

  return { data, loading, error, refetch: () => {
    // Trigger re-fetch by updating the params slightly
    const newParams = params ? { ...params, _t: Date.now().toString() } : { _t: Date.now().toString() };
    return fetch(`${API_BASE_URL}${endpoint}?${new URLSearchParams(newParams).toString()}`)
      .then(res => res.json())
      .then(result => {
        if (result.data !== undefined) setData(result.data);
        else setData(result as T);
        return result;
      });
  } };
};

// 🎯 PRIZEPICKS SCREEN HOOK - THIS IS NEW AND CRITICAL
export const usePrizePicks = (sport: 'nba' | 'nfl' | 'mlb' = 'nba') => 
  useApiData(API_ENDPOINTS.prizePicksSelections, [], { sport });

// SPORTS WIRE SCREEN (uses same data as PrizePicks)
export const useSportsWire = (sport: 'nba' | 'nfl' | 'mlb' = 'nba') => 
  useApiData(API_ENDPOINTS.sportsWire, [], { sport });

// DAILY PICKS SCREEN
export const useDailyPicks = () => 
  useApiData(API_ENDPOINTS.dailyPicks, []);

// ADVANCED ANALYTICS SCREEN
export const useAdvancedAnalytics = () => 
  useApiData(API_ENDPOINTS.advancedAnalytics, {});

// PARLAY ARCHITECT SCREEN
export const useParlaySuggestions = () => 
  useApiData(API_ENDPOINTS.parlaySuggestions, []);

// KALSHI PREDICTIONS SCREEN
export const useKalshiPredictions = () => 
  useApiData(API_ENDPOINTS.kalshiPredictions, []);

// PREDICTIONS OUTCOME SCREEN
export const usePredictionsHistory = () => 
  useApiData(API_ENDPOINTS.predictionsHistory, []);

// FANTASYHUB PLAYERS
export const useFantasyPlayers = () => 
  useApiData(API_ENDPOINTS.fantasyPlayers, []);

// PLAYER STATS TRENDS
export const usePlayerTrends = (playerName?: string) => {
  const params = playerName ? { player: playerName } : undefined;
  return useApiData(API_ENDPOINTS.playerTrends, [], params);
};

// SYSTEM STATUS
export const useSystemStatus = () => 
  useApiData(API_ENDPOINTS.systemStatus, {});
