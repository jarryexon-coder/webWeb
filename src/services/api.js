// src/services/api.js - UPDATED WITH ALL ENDPOINTS
import { 
  getNBAGames, 
  getNBAStandings, 
  getNBAPlayerStats,
  getNFLGames,
  getNFLStats,
  getNFLStandings,
  getNHLGames,
  getNHLStandings,
  getNHLPlayerStats,
  getKalshiMarkets,
  getSportsPredictions,
  getMatchAnalytics,
  getAdvancedAnalytics,
  getAllGames,
  getNews,
  getPlayersData,
  getPrizePicksSelections,
  getKalshiPredictions
} from './developmentData';

import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';

// ====================
// UPDATED URLS FOR PRODUCTION
// ====================
const BASE_URL = process.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';
const AUTH_BASE_URL = `${BASE_URL}/api/auth`;

console.log('🌐 API Service initialized with URL:', BASE_URL);

// Auth token storage
let authToken = null;

// ====================
// API ENDPOINTS CONFIGURATION
// ====================

// Enhanced API endpoints from File 1
export const apiEndpoints = {
  // SportsWire Screen
  sportsWire: `${BASE_URL}/api/prizepicks/selections`,
  
  // Daily Picks Screen
  dailyPicks: `${BASE_URL}/api/picks/daily`,
  
  // Advanced Analytics Screen
  advancedAnalytics: `${BASE_URL}/api/advanced/analytics`,
  playerTrends: `${BASE_URL}/api/player/stats/trends`,
  
  // Parlay Architect Screen
  parlaySuggestions: `${BASE_URL}/api/parlay/suggestions`,
  
  // Kalshi Predictions Screen
  kalshiPredictions: `${BASE_URL}/api/kalshi/predictions`,
  
  // Predictions Outcome Screen
  predictionsHistory: `${BASE_URL}/api/predictions/history`,
  
  // FantasyHub
  fantasyPlayers: `${BASE_URL}/api/fantasyhub/players`,
  
  // System
  systemStatus: `${BASE_URL}/api/system/status`
};

// Generic fetch function from File 1
export const fetchFromAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};

// Enhanced fetch with timeout and error handling
const enhancedFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Fetch error:', error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server is not responding');
    }
    
    throw error;
  }
};

// ====================
// AUTHENTICATION API
// ====================

const apiService = {
  // Register user
  async register(userData) {
    console.log('📝 Registering user:', userData.email);
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/register`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      if (response.success && response.data?.tokens?.accessToken) {
        authToken = response.data.tokens.accessToken;
        console.log('✅ Registration successful, token saved');
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error.message,
        fallback: true
      };
    }
  },

  // Login user
  async login(credentials) {
    console.log('🔑 Logging in user:', credentials.email);
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.success && response.data?.tokens?.accessToken) {
        authToken = response.data.tokens.accessToken;
        console.log('✅ Login successful, token saved');
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed',
        error: error.message,
        fallback: true
      };
    }
  },

  // Get current user
  async getCurrentUser() {
    console.log('👤 Getting current user');
    
    if (!authToken) {
      return { 
        success: false, 
        error: 'No authentication token available',
        fallback: true
      };
    }
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/profile`);
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  },

  // Logout
  async logout() {
    console.log('🚪 Logging out');
    
    try {
      if (authToken) {
        await enhancedFetch(`${AUTH_BASE_URL}/logout`, {
          method: 'POST',
          body: JSON.stringify({ refreshToken: 'placeholder' }),
        });
      }
    } catch (error) {
      console.error('Logout error (ignored):', error.message);
    } finally {
      authToken = null;
    }
    
    return { success: true };
  },

  // Refresh token
  async refreshToken(refreshToken) {
    console.log('🔄 Refreshing token');
    
    try {
      const response = await enhancedFetch(`${AUTH_BASE_URL}/refresh-token`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.success && response.data?.accessToken) {
        authToken = response.data.accessToken;
      }
      
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  },

  getAuthToken: () => authToken,
  setAuthToken: (token) => { authToken = token; },

  // ====================
  // SPORTS DATA API - ALL ENDPOINTS
  // ====================

  // NBA Endpoints
  async getNBAGames() {
    console.log('🏀 Fetching NBA games');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nba/games`);
      return response;
    } catch (error) {
      console.error('NBA games error:', error);
      return getNBAGames();
    }
  },

  async getNBAStandings() {
    console.log('🏀 Fetching NBA standings');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nba`);
      return response;
    } catch (error) {
      console.error('NBA standings error:', error);
      return getNBAStandings();
    }
  },

  // NFL Endpoints
  async getNFLGames() {
    console.log('🏈 Fetching NFL games');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nfl/games`);
      return response;
    } catch (error) {
      console.error('NFL games error:', error);
      return getNFLGames();
    }
  },

  async getNFLStats() {
    console.log('🏈 Fetching NFL stats');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nfl/stats`);
      return response;
    } catch (error) {
      console.error('NFL stats error:', error);
      return getNFLStats();
    }
  },

  async getNFLStandings() {
    console.log('🏈 Fetching NFL standings');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nfl/standings`);
      return response;
    } catch (error) {
      console.error('NFL standings error:', error);
      return getNFLStandings();
    }
  },

  // NHL Endpoints
  async getNHLGames() {
    console.log('🏒 Fetching NHL games');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nhl/games`);
      return response;
    } catch (error) {
      console.error('NHL games error:', error);
      return getNHLGames();
    }
  },

  async getNHLPlayers() {
    console.log('🏒 Fetching NHL players');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nhl/players`);
      return response;
    } catch (error) {
      console.error('NHL players error:', error);
      return getNHLPlayerStats('all');
    }
  },

  async getNHLStandings() {
    console.log('🏒 Fetching NHL standings');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/nhl/standings`);
      return response;
    } catch (error) {
      console.error('NHL standings error:', error);
      return getNHLStandings();
    }
  },

  // Cross-sport endpoints
  async getAllGames() {
    console.log('🎮 Fetching all games');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/games`);
      return response;
    } catch (error) {
      console.error('All games error:', error);
      return getAllGames();
    }
  },

  async getNews() {
    console.log('📰 Fetching news');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/news`);
      return response;
    } catch (error) {
      console.error('News error:', error);
      return getNews();
    }
  },

  async getPlayers() {
    console.log('👥 Fetching players');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/players`);
      return response;
    } catch (error) {
      console.error('Players error:', error);
      return getPlayersData();
    }
  },

  // Fantasy/Sportsbook endpoints
  async getPrizePicksSelections() {
    console.log('🎯 Fetching PrizePicks selections');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/prizepicks/selections`);
      return response;
    } catch (error) {
      console.error('PrizePicks error:', error);
      return getPrizePicksSelections();
    }
  },

  async getKalshiPredictions() {
    console.log('📊 Fetching Kalshi predictions');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/kalshi/predictions`);
      return response;
    } catch (error) {
      console.error('Kalshi predictions error:', error);
      return getKalshiPredictions();
    }
  },

  // Analytics endpoints
  async getMatchAnalytics() {
    console.log('📈 Fetching match analytics');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/match/analytics`);
      return response;
    } catch (error) {
      console.error('Match analytics error:', error);
      return getMatchAnalytics();
    }
  },

  async getAdvancedAnalytics() {
    console.log('📊 Fetching advanced analytics');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/advanced/analytics`);
      return response;
    } catch (error) {
      console.error('Advanced analytics error:', error);
      return getAdvancedAnalytics();
    }
  },

  // ====================
  // NEW ENDPOINTS FROM FILE 1
  // ====================

  async getDailyPicks() {
    console.log('📅 Fetching daily picks');
    
    try {
      const response = await fetchFromAPI(apiEndpoints.dailyPicks);
      return response;
    } catch (error) {
      console.error('Daily picks error:', error);
      return {
        success: false,
        message: 'Failed to fetch daily picks',
        error: error.message,
        fallback: true
      };
    }
  },

  async getPlayerTrends() {
    console.log('📈 Fetching player trends');
    
    try {
      const response = await fetchFromAPI(apiEndpoints.playerTrends);
      return response;
    } catch (error) {
      console.error('Player trends error:', error);
      return {
        success: false,
        message: 'Failed to fetch player trends',
        error: error.message,
        fallback: true
      };
    }
  },

  async getParlaySuggestions() {
    console.log('🎯 Fetching parlay suggestions');
    
    try {
      const response = await fetchFromAPI(apiEndpoints.parlaySuggestions);
      return response;
    } catch (error) {
      console.error('Parlay suggestions error:', error);
      return {
        success: false,
        message: 'Failed to fetch parlay suggestions',
        error: error.message,
        fallback: true
      };
    }
  },

  async getPredictionsHistory() {
    console.log('📊 Fetching predictions history');
    
    try {
      const response = await fetchFromAPI(apiEndpoints.predictionsHistory);
      return response;
    } catch (error) {
      console.error('Predictions history error:', error);
      return {
        success: false,
        message: 'Failed to fetch predictions history',
        error: error.message,
        fallback: true
      };
    }
  },

  async getFantasyPlayers() {
    console.log('🎮 Fetching fantasy players');
    
    try {
      const response = await fetchFromAPI(apiEndpoints.fantasyPlayers);
      return response;
    } catch (error) {
      console.error('Fantasy players error:', error);
      return {
        success: false,
        message: 'Failed to fetch fantasy players',
        error: error.message,
        fallback: true
      };
    }
  },

  async getSystemStatus() {
    console.log('⚙️ Fetching system status');
    
    try {
      const response = await fetchFromAPI(apiEndpoints.systemStatus);
      return response;
    } catch (error) {
      console.error('System status error:', error);
      return {
        success: false,
        message: 'Failed to fetch system status',
        error: error.message,
        fallback: true
      };
    }
  },

  // ====================
  // LEGACY ENDPOINTS (for backward compatibility)
  // ====================

  async getPlayersBySport(sport = 'NBA', filters = {}) {
    console.log(`👥 Getting ${sport} players`);
    
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await enhancedFetch(`${BASE_URL}/api/players?${params}`);
      return response;
    } catch (error) {
      console.error('Players error:', error);
      
      // Development fallback
      const sportPlayers = samplePlayers[sport] || [];
      return {
        success: true,
        players: sportPlayers,
        count: sportPlayers.length,
        source: 'mock',
        fallback: true
      };
    }
  },

  async getTeams(sport = 'NBA') {
    console.log(`🏟️ Getting ${sport} teams`);
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/teams/${sport}`);
      return response;
    } catch (error) {
      console.error('Teams error:', error);
      
      return {
        success: true,
        teams: teams[sport] || [],
        count: (teams[sport] || []).length,
        source: 'mock',
        fallback: true
      };
    }
  },

  async getGames(sport = 'NBA') {
    console.log(`🎮 Getting ${sport} games`);
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/games`);
      return response;
    } catch (error) {
      console.error('Games error:', error);
      
      if (sport === 'NBA') {
        return getNBAGames();
      } else if (sport === 'NFL') {
        return getNFLGames();
      } else if (sport === 'NHL') {
        return getNHLGames();
      }
      
      return {
        success: true,
        games: [],
        count: 0,
        source: 'mock',
        fallback: true
      };
    }
  },

  // ====================
  // HEALTH & TESTING ENDPOINTS
  // ====================

  async checkHealth() {
    console.log('🏥 Checking health');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/health`);
      return {
        ...response,
        backend: 'connected',
        url: BASE_URL
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'offline',
        backend: 'disconnected',
        url: BASE_URL,
        error: error.message,
        fallback: true
      };
    }
  },

  async testBackendConnection() {
    console.log('🔗 Testing backend connectivity...');
    console.log('🌐 Backend URL:', BASE_URL);
    
    const tests = [
      { name: 'Server Root', url: BASE_URL },
      { name: 'Health Check', url: `${BASE_URL}/health` },
      { name: 'API Health', url: `${BASE_URL}/api/health` },
      { name: 'Auth Health', url: `${BASE_URL}/api/auth/health` },
      { name: 'Admin Health', url: `${BASE_URL}/api/admin/health` },
      { name: 'NBA API', url: `${BASE_URL}/api/nba` },
      { name: 'NFL API', url: `${BASE_URL}/api/nfl` },
      { name: 'NHL API', url: `${BASE_URL}/api/nhl` },
      { name: 'Players API', url: `${BASE_URL}/api/players` },
      { name: 'Games API', url: `${BASE_URL}/api/games` },
      { name: 'User API', url: `${BASE_URL}/api/user` },
      { name: 'News API', url: `${BASE_URL}/api/news` },
      { name: 'Sportsbooks API', url: `${BASE_URL}/api/sportsbooks` },
      { name: 'PrizePicks API', url: `${BASE_URL}/api/prizepicks` },
      { name: 'FantasyHub API', url: `${BASE_URL}/api/fantasyhub/players` },
      { name: 'System Status API', url: `${BASE_URL}/api/system/status` },
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const startTime = Date.now();
        const response = await enhancedFetch(test.url);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        results.push({
          name: test.name,
          status: '✅',
          statusCode: 200,
          duration: `${duration}ms`,
          success: true
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: '❌',
          error: error.message,
          success: false
        });
      }
    }
    
    return {
      success: true,
      backendUrl: BASE_URL,
      timestamp: new Date().toISOString(),
      results
    };
  },

  // ====================
  // OTHER ENDPOINTS
  // ====================

  async getBettingOdds() {
    console.log('💰 Fetching betting odds');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/betting/odds`);
      return response;
    } catch (error) {
      console.error('Betting odds error:', error);
      return {
        success: true,
        odds: [],
        count: 0,
        source: 'mock',
        fallback: true
      };
    }
  },

  async getPredictions() {
    console.log('🔮 Fetching predictions');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/predictions/today`);
      return response;
    } catch (error) {
      console.error('Predictions error:', error);
      return getSportsPredictions('NBA');
    }
  },

  async getAnalytics() {
    console.log('📊 Fetching analytics');
    
    try {
      const response = await enhancedFetch(`${BASE_URL}/api/analytics/overview`);
      return response;
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        success: true,
        analytics: {
          users: 1500,
          predictions: 4200,
          accuracy: '68.3%',
          revenue: '$12,450'
        },
        source: 'mock',
        fallback: true
      };
    }
  },

  // ====================
  // MOCK DATA FALLBACKS
  // ====================
  
  getNBAPlayerStats: async (playerId) => {
    const playerName = this.getPlayerNameById(playerId);
    return getNBAPlayerStats(playerName);
  },

  getNHLPlayerStats: async () => getNHLPlayerStats('all'),
  getKalshiMarkets: async () => getKalshiMarkets(),
  getSportsPredictions: async (sport) => getSportsPredictions(sport),

  // Helper functions
  getPlayerNameById: (playerId) => {
    const playerMap = {
      'lebron-james': 'LeBron James',
      'stephen-curry': 'Stephen Curry',
      'nikola-jokic': 'Nikola Jokic',
    };
    return playerMap[playerId] || 'LeBron James';
  },

  getNBATeamNameById: (teamId) => {
    const teamMap = {
      'lakers': 'Lakers',
      'warriors': 'Warriors',
      'celtics': 'Celtics',
    };
    return teamMap[teamId] || 'Lakers';
  },

  enhancedFetch,
  
  // ====================
  // EXPORT API ENDPOINTS
  // ====================
  apiEndpoints,
  fetchFromAPI,
};

export default apiService;
