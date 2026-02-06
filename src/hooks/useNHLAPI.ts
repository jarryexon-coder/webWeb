// src/hooks/useNHLAPI.ts
import { useQuery } from '@tanstack/react-query';

const NHL_API_KEY = import.meta.env.VITE_NHL_API_KEY;

export interface NHLGame {
  id: number;
  season: number;
  gameType: number;
  gameDate: string;
  venue: {
    name: string;
  };
  teams: {
    away: {
      team: {
        id: number;
        name: string;
        abbreviation: string;
      };
      score: number;
    };
    home: {
      team: {
        id: number;
        name: string;
        abbreviation: string;
      };
      score: number;
    };
  };
}

export interface NHLStandings {
  team: {
    id: number;
    name: string;
    abbreviation: string;
  };
  points: number;
  wins: number;
  losses: number;
  ot: number;
  goalsFor: number;
  goalsAgainst: number;
}

const fetchNHLGames = async (date?: string): Promise<NHLGame[]> => {
  if (!NHL_API_KEY) {
    throw new Error('NHL API key not configured');
  }

  const dateParam = date || new Date().toISOString().split('T')[0];
  const url = `https://api.sportsdata.io/v3/nhl/scores/json/GamesByDate/${dateParam}?key=${NHL_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NHL API error: ${response.status}`);
  }
  
  return response.json();
};

const fetchNHLStandings = async (): Promise<NHLStandings[]> => {
  if (!NHL_API_KEY) {
    throw new Error('NHL API key not configured');
  }

  const url = `https://api.sportsdata.io/v3/nhl/scores/json/Standings/2024?key=${NHL_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NHL API error: ${response.status}`);
  }
  
  return response.json();
};

export const useNHLGames = (date?: string, options = {}) => {
  const queryDate = date || new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['nhl', 'games', queryDate],
    queryFn: () => fetchNHLGames(queryDate),
    staleTime: 2 * 60 * 1000, // 2 minutes (games change frequently)
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!NHL_API_KEY,
    ...options,
  });
};

export const useNHLStandings = (options = {}) => {
  return useQuery({
    queryKey: ['nhl', 'standings'],
    queryFn: fetchNHLStandings,
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    enabled: !!NHL_API_KEY,
    ...options,
  });
};
