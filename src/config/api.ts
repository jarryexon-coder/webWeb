// src/config/api.ts - UPDATED VERSION
export const API_BASE_URL = process.env.REACT_APP_API_URL || 
  'https://pleasing-determination-production.up.railway.app';

export const API_ENDPOINTS = {
  // PrizePicks Screen - THIS IS NEW
  prizePicksSelections: '/api/prizepicks/selections',
  
  // Existing endpoints from before
  sportsWire: '/api/prizepicks/selections', // Same as prizePicks, but keep for compatibility
  dailyPicks: '/api/picks/daily',
  advancedAnalytics: '/api/advanced/analytics',
  parlaySuggestions: '/api/parlay/suggestions',
  kalshiPredictions: '/api/kalshi/predictions',
  predictionsHistory: '/api/predictions/history',
  fantasyPlayers: '/api/fantasyhub/players',
  playerTrends: '/api/player/stats/trends',
  systemStatus: '/api/system/status',
  
  // Optional: Add more endpoints as they exist
  nbaGames: '/api/nba/games',
  nflGames: '/api/nfl/games',
  sportsNews: '/api/news'
} as const;

// Helper function to build full URLs
export const buildApiUrl = (endpoint: keyof typeof API_ENDPOINTS, params?: Record<string, string>) => {
  let url = `${API_BASE_URL}${API_ENDPOINTS[endpoint]}`;
  
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }
  
  return url;
};
