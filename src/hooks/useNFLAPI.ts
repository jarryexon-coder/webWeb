// src/hooks/useNFLAPI.ts
import { useQuery } from '@tanstack/react-query';

const NFL_API_KEY = import.meta.env.VITE_NFL_API_KEY;

export interface NFLGame {
  id: string;
  week: number;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
  };
  date: string;
  time: string;
  stadium: string;
}

export interface NFLTeamStats {
  team: {
    id: string;
    name: string;
    abbreviation: string;
  };
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

const fetchNFLGames = async (week?: number): Promise<NFLGame[]> => {
  if (!NFL_API_KEY) {
    throw new Error('NFL API key not configured');
  }

  const weekParam = week ? `week=${week}&` : '';
  const url = `https://api.sportsdata.io/v3/nfl/scores/json/Games/2024?${weekParam}key=${NFL_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NFL API error: ${response.status}`);
  }
  
  return response.json();
};

const fetchNFLTeamStats = async (): Promise<NFLTeamStats[]> => {
  if (!NFL_API_KEY) {
    throw new Error('NFL API key not configured');
  }

  const url = `https://api.sportsdata.io/v3/nfl/scores/json/TeamSeasonStats/2024?key=${NFL_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NFL API error: ${response.status}`);
  }
  
  return response.json();
};

export const useNFLGames = (week?: number, options = {}) => {
  return useQuery({
    queryKey: ['nfl', 'games', week],
    queryFn: () => fetchNFLGames(week),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!NFL_API_KEY,
    ...options,
  });
};

export const useNFLTeamStats = (options = {}) => {
  return useQuery({
    queryKey: ['nfl', 'team-stats'],
    queryFn: fetchNFLTeamStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!NFL_API_KEY,
    ...options,
  });
};
