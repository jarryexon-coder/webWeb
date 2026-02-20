import axios from 'axios';

const BASE_URL = 'python-api-fresh-production.up.railway.app'; // Replace with your actual API

export const twentyTwentySixApi = {
  // World Cup 2026
  getWorldCupMarkets: async (stage?: string) => {
    const params = new URLSearchParams({
      season: '2025-26',
      tournament: 'world-cup-2026'
    });
    if (stage) params.append('stage', stage);
    
    const response = await axios.get(`${BASE_URL}/api/predictions`, { params });
    return response.data;
  },

  // All-Star 2026
  getAllStarMarkets: async (event?: string) => {
    const params = new URLSearchParams({
      season: '2025-26',
      category: 'nba-all-star'
    });
    if (event) params.append('event', event);
    
    const response = await axios.get(`${BASE_URL}/api/predictions`, { params });
    return response.data;
  },

  // Futures 2026
  getFuturesMarkets: async (sport: string, market: string) => {
    const response = await axios.get(`${BASE_URL}/api/futures/2026`, {
      params: { sport, market, season: '2025-26' }
    });
    return response.data;
  },

  // Alt Lines
  getAltLines: async (sport: string, player?: string) => {
    const response = await axios.get(`${BASE_URL}/api/prizepicks/selections`, {
      params: { 
        sport, 
        bet_type: 'alt_line',
        season: '2025-26'
      }
    });
    return response.data;
  },

  // Season Stats
  getSeasonStats: async (sport: string) => {
    const response = await axios.get(`${BASE_URL}/api/stats/season`, {
      params: { sport, season: '2025-26' }
    });
    return response.data;
  },

  // Prediction Outcomes - Feb 2026
  getFebruaryOutcomes: async (sport: string) => {
    const response = await axios.get(`${BASE_URL}/api/predictions/outcome`, {
      params: { 
        sport, 
        season: '2025-26',
        as_of: '2026-02-11'
      }
    });
    return response.data;
  }
};
