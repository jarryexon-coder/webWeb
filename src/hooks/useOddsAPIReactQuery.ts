// src/hooks/useOddsAPIReactQuery.ts
import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';

interface UseOddsAPIOptions {
  sport?: string;
  region?: string;
  markets?: string;
  enabled?: boolean;
}

const fetchOddsGames = async (options: UseOddsAPIOptions = {}) => {
  const { sport = 'upcoming', region = 'us', markets = 'h2h,spreads,totals' } = options;
  
  const params = new URLSearchParams({
    sport,
    region,
    markets,
  });

  const url = `${API_BASE}/api/odds/games?${params.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch odds: ${response.status}`);
  }
  
  return response.json();
};

const fetchParlaySuggestions = async (sport = 'all', limit = 4) => {
  const url = `${API_BASE}/api/parlay/suggestions?sport=${sport}&limit=${limit}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch parlays: ${response.status}`);
  }
  
  return response.json();
};

export const useOddsGames = (options: UseOddsAPIOptions = {}) => {
  const { sport = 'upcoming', region = 'us', markets = 'h2h,spreads,totals', enabled = true } = options;
  
  return useQuery({
    queryKey: ['odds', 'games', sport, region, markets],
    queryFn: () => fetchOddsGames(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled,
    retry: 1,
  });
};

export const useParlaySuggestions = (sport = 'all', limit = 4) => {
  return useQuery({
    queryKey: ['parlays', 'suggestions', sport, limit],
    queryFn: () => fetchParlaySuggestions(sport, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};
