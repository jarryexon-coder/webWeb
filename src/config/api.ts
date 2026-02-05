// src/config/api.ts - UPDATED VERSION
export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5001';
export const API_ENDPOINTS = {
  // Fantasy Hub endpoints
  fantasyPlayers: '/api/players',
  fantasyTeams: '/api/fantasy/teams',
  
  // PrizePicks endpoints
  prizePicksSelections: '/api/prizepicks/selections',
  prizePicksAnalytics: '/api/prizepicks/analytics',
  
  // Sports Wire
  sportsWire: '/api/sportswire',
  
  // Daily Picks
  dailyPicks: '/api/picks/daily',
  
  // Advanced Analytics
  advancedAnalytics: '/api/analytics/advanced',
  
  // Parlay Architect
  parlaySuggestions: '/api/parlay/suggestions',
  
  // Kalshi Predictions
  kalshiPredictions: '/api/kalshi/predictions',
  
  // Predictions History
  predictionsHistory: '/api/predictions/history',
  
  // Player Trends
  playerTrends: '/api/players/trends',
  
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
