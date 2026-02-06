// src/config/api.ts - UPDATED VERSION
export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';

export const API_ENDPOINTS = {
  // Fantasy Hub endpoints
  fantasyPlayers: '/api/fantasy/players',
  fantasyTeams: '/api/fantasy/teams',
  
  // PrizePicks endpoints
  prizePicksSelections: '/api/prizepicks/selections',
  prizePicksAnalytics: '/api/prizepicks/analytics',
  
  // Sports Wire
  sportsWire: '/api/sports-wire',
  
  // Daily Picks
  dailyPicks: '/api/picks',
  
  // Advanced Analytics
  advancedAnalytics: '/api/analytics',
  
  // Parlay Architect
  parlaySuggestions: '/api/parlay/suggestions',
  
  // Kalshi Predictions
  kalshiPredictions: '/api/kalshi/predictions',
  
  // Predictions History
  predictions: '/api/predictions',
  predictionsHistory: '/api/history',
  
  // Player Trends
  trends: '/api/trends',
  playerTrends: '/api/players/trends',
  
  // Player Props
  playerProps: '/api/player-props',
  
  // Odds Games
  oddsGames: '/api/odds/games',
  
  // System Status
  systemStatus: '/api/system/status',
  
  // Alerts
  alerts: '/api/alerts',
  
  // Injuries
  injuries: '/api/injuries',
  
  // Weather impacts
  weather: '/api/weather/impacts',
};

export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }
  
  return url;
};
