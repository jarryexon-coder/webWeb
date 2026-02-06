// src/hooks/useBackendAPI.ts
import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';

// Generic fetch function
const fetchFromBackend = async (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(`${API_BASE}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
  }
  
  return response.json();
};

// Fantasy endpoints
export const useFantasyPlayers = (sport?: string) => {
  return useQuery({
    queryKey: ['fantasy', 'players', sport],
    queryFn: () => fetchFromBackend('/api/fantasy/players', { sport: sport || 'nba' }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

export const useFantasyTeams = (sport?: string) => {
  return useQuery({
    queryKey: ['fantasy', 'teams', sport],
    queryFn: () => fetchFromBackend('/api/fantasy/teams', { sport: sport || 'nba' }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// PrizePicks endpoint
export const usePrizePicksSelections = (sport?: string) => {
  return useQuery({
    queryKey: ['prizepicks', 'selections', sport],
    queryFn: () => fetchFromBackend('/api/prizepicks/selections', { sport: sport || 'nba' }),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

// Analytics endpoint
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: () => fetchFromBackend('/api/analytics'),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

// Sports wire endpoint
export const useSportsWire = (sport?: string) => {
  return useQuery({
    queryKey: ['sports-wire', sport],
    queryFn: () => fetchFromBackend('/api/sports-wire', { sport: sport || 'nba' }),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

// Daily picks endpoint
export const useDailyPicks = () => {
  return useQuery({
    queryKey: ['picks'],
    queryFn: () => fetchFromBackend('/api/picks'),
    staleTime: 10 * 60 * 1000, // 10 minutes for picks
    cacheTime: 30 * 60 * 1000,
  });
};

// Predictions endpoint
export const usePredictions = (analyze?: boolean, prompt?: string) => {
  const params: Record<string, string> = {};
  if (analyze) params.analyze = 'true';
  if (prompt) params.prompt = prompt;
  
  return useQuery({
    queryKey: ['predictions', analyze, prompt],
    queryFn: () => fetchFromBackend('/api/predictions', params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    enabled: !analyze || !!prompt, // Only enable if we have a prompt when analyze is true
  });
};

// Trends endpoint
export const useTrends = (player?: string) => {
  return useQuery({
    queryKey: ['trends', player],
    queryFn: () => fetchFromBackend('/api/trends', { player: player || '' }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// History endpoint
export const usePredictionHistory = () => {
  return useQuery({
    queryKey: ['history'],
    queryFn: () => fetchFromBackend('/api/history'),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
};

// Player props endpoint
export const usePlayerProps = (sport?: string) => {
  return useQuery({
    queryKey: ['player-props', sport],
    queryFn: () => fetchFromBackend('/api/player-props', { sport: sport || 'nba' }),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

// Add this anywhere in the exports (around line 60):
export const usePrizePicksAnalytics = () => {
  return useQuery({
    queryKey: ['prizepicks', 'analytics'],
    queryFn: () => fetchFromBackend('/api/prizepicks/analytics'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// NFL games endpoint
export const useNFLGames = (week?: string) => {
  return useQuery({
    queryKey: ['nfl', 'games', week],
    queryFn: () => fetchFromBackend('/api/nfl/games', { week: week || '' }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// NHL games endpoint
export const useNHLGames = (date?: string) => {
  return useQuery({
    queryKey: ['nhl', 'games', date],
    queryFn: () => fetchFromBackend('/api/nhl/games', { date: date || '' }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });
};

// DeepSeek AI endpoint
export const useDeepSeekAnalysis = (prompt: string) => {
  return useQuery({
    queryKey: ['deepseek', 'analysis', prompt],
    queryFn: () => fetchFromBackend('/api/deepseek/analyze', { prompt }),
    staleTime: 60 * 60 * 1000, // 1 hour for AI analysis
    cacheTime: 2 * 60 * 60 * 1000,
    enabled: !!prompt?.trim(),
  });
};

// Existing odds endpoints (wrap your existing ones)
export const useOddsGames = (sport?: string, region?: string, markets?: string) => {
  const params: Record<string, string> = {};
  if (sport) params.sport = sport;
  if (region) params.region = region;
  if (markets) params.markets = markets;
  
  return useQuery({
    queryKey: ['odds', 'games', sport, region, markets],
    queryFn: () => fetchFromBackend('/api/odds/games', params),
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

export const useParlaySuggestions = (sport?: string, limit?: number) => {
  const params: Record<string, string> = {};
  if (sport) params.sport = sport;
  if (limit) params.limit = limit.toString();
  
  return useQuery({
    queryKey: ['parlay', 'suggestions', sport, limit],
    queryFn: () => fetchFromBackend('/api/parlay/suggestions', params),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};
