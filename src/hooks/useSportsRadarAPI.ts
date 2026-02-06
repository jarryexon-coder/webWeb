// src/hooks/useSportsRadarAPI.ts
import { useQuery } from '@tanstack/react-query';

const SPORTS_RADAR_API_KEY = import.meta.env.VITE_SPORTS_RADAR_API_KEY;

export interface Team {
  id: string;
  name: string;
  market: string;
  alias: string;
  conference: string;
  division: string;
}

export interface Game {
  id: string;
  status: string;
  scheduled: string;
  home: Team;
  away: Team;
  home_points: number;
  away_points: number;
}

const fetchNBAGames = async (date?: string): Promise<Game[]> => {
  if (!SPORTS_RADAR_API_KEY) {
    throw new Error('Sports Radar API key not configured');
  }

  const dateParam = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
  const url = `https://api.sportradar.us/nba/trial/v8/en/games/${dateParam}/schedule.json?api_key=${SPORTS_RADAR_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Sports Radar API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.games || [];
};

const fetchNBATeams = async (): Promise<Team[]> => {
  if (!SPORTS_RADAR_API_KEY) {
    throw new Error('Sports Radar API key not configured');
  }

  const url = `https://api.sportradar.us/nba/trial/v8/en/league/hierarchy.json?api_key=${SPORTS_RADAR_API_KEY}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Sports Radar API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.conferences?.flatMap((conference: any) => 
    conference.divisions?.flatMap((division: any) => 
      division.teams || []
    ) || []
  ) || [];
};

export const useNBAGames = (date?: string, options = {}) => {
  const queryDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  return useQuery({
    queryKey: ['sportsradar', 'nba', 'games', queryDate],
    queryFn: () => fetchNBAGames(queryDate),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!SPORTS_RADAR_API_KEY,
    ...options,
  });
};

export const useNBATeams = (options = {}) => {
  return useQuery({
    queryKey: ['sportsradar', 'nba', 'teams'],
    queryFn: fetchNBATeams,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 48 * 60 * 60 * 1000, // 48 hours
    enabled: !!SPORTS_RADAR_API_KEY,
    ...options,
  });
};
