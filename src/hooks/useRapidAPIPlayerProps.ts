// src/hooks/useRapidAPIPlayerProps.ts
import { useQuery } from '@tanstack/react-query';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY_PLAYER_PROPS;

export interface PlayerProp {
  player_id: string;
  player_name: string;
  team: string;
  opponent: string;
  game_date: string;
  market: string;
  line: number;
  over_odds: number;
  under_odds: number;
  implied_probability: number;
}

const fetchPlayerProps = async (sport: 'nba' | 'nfl' | 'mlb' | 'nhl' = 'nba'): Promise<PlayerProp[]> => {
  if (!RAPIDAPI_KEY) {
    throw new Error('RapidAPI key not configured');
  }

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'odds.p.rapidapi.com'
    }
  };

  const url = `https://odds.p.rapidapi.com/v4/sports/${sport}/odds?regions=us&oddsFormat=american&markets=player_props`;
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`RapidAPI error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Transform RapidAPI response to our format
  return data.map((game: any) => ({
    player_id: game.id,
    player_name: game.sport_title,
    team: game.home_team,
    opponent: game.away_team,
    game_date: game.commence_time,
    market: 'player_props',
    line: 0,
    over_odds: -110,
    under_odds: -110,
    implied_probability: 0.5
  }));
};

export const usePlayerPropsAPI = (sport: 'nba' | 'nfl' | 'mlb' | 'nhl' = 'nba', options = {}) => {
  return useQuery({
    queryKey: ['rapidapi', 'player-props', sport],
    queryFn: () => fetchPlayerProps(sport),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!RAPIDAPI_KEY,
    ...options,
  });
};
