// src/hooks/useSportsData.ts - UPDATED VERSION
import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../config/api';

// Generic response structure based on your API
interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  timestamp?: string;
  data?: T;
  analytics?: T;
  players?: T;
  trends?: T;
  predictions?: T;
  picks?: T;
  suggestions?: T;
  history?: T;
  [key: string]: any; // Allow other properties
}

// Generic fetch hook with proper response handling
const useApiData = <T,>(endpoint: string, initialData: T, params?: Record<string, string>) => {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to extract data from API response
  const extractDataFromResponse = (response: any): T => {
    // Handle different API response structures
    if (!response) return initialData;
    
    // If response is already the expected type
    if (Array.isArray(response) || typeof response === typeof initialData) {
      return response as T;
    }
    
    // Extract from common property names
    const propertyPriority = ['data', 'analytics', 'players', 'trends', 'predictions', 'picks', 'suggestions', 'history', 'results', 'items'];
    
    for (const prop of propertyPriority) {
      if (response[prop] !== undefined) {
        return response[prop] as T;
      }
    }
    
    // If no matching property found, return the entire response
    return response as T;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}${endpoint}`;
      
      // Add query parameters if provided
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }
      
      console.log(`📡 [useApiData] Fetching from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ApiResponse<T> = await response.json();
      console.log(`📦 [useApiData] Raw API response for ${endpoint}:`, result);
      
      // Extract data from response
      const extractedData = extractDataFromResponse(result);
      console.log(`✅ [useApiData] Extracted data for ${endpoint}:`, extractedData);
      
      setData(extractedData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ [useApiData] Error fetching ${endpoint}:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch function
  const refetch = useCallback(async () => {
    console.log(`🔄 [useApiData] Refetching ${endpoint}`);
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Type-safe hooks with proper return types

// 🎯 PRIZEPICKS SCREEN HOOK
export const usePrizePicks = (sport: 'nba' | 'nfl' | 'mlb' = 'nba') => 
  useApiData<any[]>(API_ENDPOINTS.prizePicksSelections, [], { sport });

// SPORTS WIRE SCREEN
export const useSportsWire = (sport: 'nba' | 'nfl' | 'mlb' = 'nba') => 
  useApiData<any[]>(API_ENDPOINTS.sportsWire, [], { sport });

// DAILY PICKS SCREEN
export const useDailyPicks = () => 
  useApiData<any[]>(API_ENDPOINTS.dailyPicks, []);

// ADVANCED ANALYTICS SCREEN
export const useAdvancedAnalytics = () => 
  useApiData<any[]>(API_ENDPOINTS.advancedAnalytics, []);

// PARLAY ARCHITECT SCREEN
export const useParlaySuggestions = () => 
  useApiData<any[]>(API_ENDPOINTS.parlaySuggestions, []);

// KALSHI PREDICTIONS SCREEN
export const useKalshiPredictions = () => 
  useApiData<any[]>(API_ENDPOINTS.kalshiPredictions, []);

// PREDICTIONS OUTCOME SCREEN
export const usePredictionsHistory = () => 
  useApiData<any[]>(API_ENDPOINTS.predictionsHistory, []);

// FANTASYHUB PLAYERS
export const useFantasyPlayers = () => 
  useApiData<any[]>(API_ENDPOINTS.fantasyPlayers, []);

// PLAYER STATS TRENDS
export const usePlayerTrends = (playerName?: string) => {
  const params = playerName ? { player: playerName } : undefined;
  return useApiData<any[]>(API_ENDPOINTS.playerTrends, [], params);
};

// SYSTEM STATUS
export const useSystemStatus = () => 
  useApiData<any>(API_ENDPOINTS.systemStatus, {});

// Export helper function for other components to use
export const extractArrayFromResponse = (response: any): any[] => {
  if (!response) return [];
  
  // If response is already an array
  if (Array.isArray(response)) return response;
  
  // If response is an object, look for array properties
  if (typeof response === 'object') {
    const arrayProps = ['data', 'analytics', 'players', 'trends', 'predictions', 'picks', 'suggestions', 'history', 'results', 'items'];
    
    for (const prop of arrayProps) {
      if (response[prop] && Array.isArray(response[prop])) {
        return response[prop];
      }
    }
    
    // If it's a single object, wrap it in array
    return [response];
  }
  
  // Fallback to empty array
  return [];
};
