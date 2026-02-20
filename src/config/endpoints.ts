// Centralized API endpoint configuration
export const API_ENDPOINTS = {
  predictions: '/api/predictions',
  odds: '/api/odds',
  playerProps: '/api/player-props',
  kalshiMarkets: '/api/kalshi/markets',
  nba: '/api/sports/nba',
  nfl: '/api/sports/nfl',
  mlb: '/api/sports/mlb',
  nhl: '/api/sports/nhl',
  worldcup: '/api/sports/worldcup',
  olympics: '/api/sports/olympics'
} as const;
