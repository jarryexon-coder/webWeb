// src/services/NBAService.js - NBA-specific API calls with real API integration and backend fallback
import { apiService } from './ApiService';
import { fetchFromBackend } from '../config/api';

// API Configuration from your provided keys
const BALLDONTLIE_API_KEY = '110e9686-5e16-4b69-991f-2744c42a9e9d';
const THE_ODDS_API_KEY = '14befba45463dc61bb71eb3da6428e9e';
const RAPIDAPI_KEY_PLAYER_PROPS = 'a0e5e0f406mshe0e4ba9f4f4daeap19859djsnfd92d0da5884';
const RAPIDAPI_KEY_PREDICTIONS = 'cdd1cfc95bmsh3dea79dcd1be496p167ea1jsnb355ed1075ec';

// Base URLs for different APIs
const BALLDONTLIE_API_BASE = 'https://api.balldontlie.io/v1';
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';

export const NBAService = {
  // ========== PRIMARY BACKEND API METHODS ==========
  
  async fetchGames() {
    try {
      console.log('📡 Fetching NBA games from backend...');
      
      // Use fetchFromBackend with 'NBA' category and 'games' endpoint
      const response = await fetchFromBackend('NBA', 'games');
      
      // Handle your backend's response format
      if (response && response.success) {
        console.log(`✅ NBA: ${response.games?.length || 0} games loaded from backend`);
        return response.games || [];
      } else {
        console.warn('⚠️ NBA: No data from backend, trying external APIs');
        return this.getMockGames();
      }
    } catch (error) {
      console.error('❌ NBA Service Error:', error.message);
      // Fallback to external API
      try {
        const result = await this.getGames();
        return result.games || [];
      } catch (apiError) {
        return this.getMockGames();
      }
    }
  },
  
  async fetchStandings() {
    try {
      console.log('📡 Fetching NBA standings from backend...');
      const response = await fetchFromBackend('NBA', 'standings');
      if (response && response.success) {
        console.log(`✅ NBA: Standings loaded from backend`);
        return response.standings || [];
      }
    } catch (error) {
      console.error('❌ NBA Standings Error:', error.message);
    }
    
    // Fallback to external API
    try {
      const result = await this.getStandings();
      return result || [];
    } catch (apiError) {
      return this.getMockStandings();
    }
  },

  // ========== GAME SUMMARY METHOD ==========
  
  async getGameSummary(gameId) {
    try {
      const response = await fetchFromBackend('NBA', 'gameSummary', { gameId });
      
      // Check if it's a stub response
      if (response && response.message && response.message.includes('Stub')) {
        console.log('⚠️ Using stub game summary - backend not fully implemented');
      }
      
      return response?.summary || {};
      
    } catch (error) {
      console.error('Game summary error:', error);
      return this.getMockGameSummary(gameId);
    }
  },

  // ========== EXTERNAL API METHODS ==========
  
  // Get all games - Using BALLDONTLIE API
  async getGames(dates = [], seasons = [], team_ids = []) {
    const params = {};
    
    if (dates.length > 0) params.dates = dates.join(',');
    if (seasons.length > 0) params.seasons = seasons.join(',');
    if (team_ids.length > 0) params.team_ids = team_ids.join(',');
    
    try {
      const response = await fetch(`${BALLDONTLIE_API_BASE}/games`, {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      // Transform to consistent format
      if (!data || !data.data) return { games: [] };
      
      return {
        source: 'BALLDONTLIE',
        count: data.data.length,
        games: data.data.map(game => ({
          id: game.id,
          date: game.date,
          status: game.status,
          period: game.period,
          time: game.time,
          postseason: game.postseason,
          home_team: game.home_team,
          visitor_team: game.visitor_team,
          home_team_score: game.home_team_score,
          visitor_team_score: game.visitor_team_score
        }))
      };
    } catch (error) {
      console.error('Error fetching games:', error);
      return { games: [] };
    }
  },

  // Get today's games
  async getTodaysGames() {
    const today = new Date().toISOString().split('T')[0];
    
    // Try BALLDONTLIE first
    try {
      const games = await this.getGames([today]);
      if (games.games && games.games.length > 0) {
        console.log(`✅ Found ${games.games.length} games for today from BALLDONTLIE`);
        return games;
      }
    } catch (error) {
      console.warn('⚠️ BALLDONTLIE API failed, trying ESPN as fallback');
    }
    
    // Fallback to ESPN
    try {
      const response = await fetch(`${ESPN_API_BASE}/scoreboard`);
      const data = await response.json();
      
      if (!data || !data.events) return { games: [], source: 'ESPN' };
      
      return {
        source: 'ESPN',
        count: data.events.length,
        games: data.events.map(event => ({
          id: event.id,
          name: event.name,
          shortName: event.shortName,
          status: event.status,
          competitions: event.competitions
        }))
      };
    } catch (error) {
      console.error('Error fetching today\'s games:', error);
      return { games: [], source: 'ERROR' };
    }
  },

  // Get live games with real-time data
  async getLiveGames() {
    try {
      const response = await fetch(`${ESPN_API_BASE}/scoreboard`);
      const data = await response.json();
      
      if (data && data.events) {
        const liveGames = data.events.filter(event => 
          event.status && event.status.type && 
          (event.status.type.state === 'in' || 
           event.status.type.state === 'inprogress' ||
           event.status.type.state === 'halftime')
        );
        
        return {
          source: 'ESPN',
          timestamp: new Date().toISOString(),
          count: liveGames.length,
          games: liveGames
        };
      }
      return { games: [] };
    } catch (error) {
      console.error('Error fetching live games:', error);
      return { games: [] };
    }
  },

  // Get game details by ID
  async getGameDetails(gameId) {
    try {
      // Try BALLDONTLIE first
      const response = await fetch(`${BALLDONTLIE_API_BASE}/games/${gameId}`, {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching game details:', error);
      
      // Fallback to game summary
      return this.getGameSummary(gameId);
    }
  },

  // ========== STANDINGS & TEAMS ==========
  
  async getStandings(season = '2025', conference = null) {
    try {
      const response = await fetch(`${ESPN_API_BASE}/standings`);
      const data = await response.json();
      
      if (!data || !data.children) return data;
      
      if (conference) {
        const conf = data.children.find(c => 
          c.name && c.name.toLowerCase().includes(conference.toLowerCase())
        );
        return conf || { children: [] };
      }
      return data;
    } catch (error) {
      console.error('Error fetching standings:', error);
      return { children: [] };
    }
  },

  async getTeams() {
    try {
      const response = await fetch(`${BALLDONTLIE_API_BASE}/teams`, {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data || !data.data) return { teams: [] };
      
      return {
        source: 'BALLDONTLIE',
        count: data.data.length,
        teams: data.data
      };
    } catch (error) {
      console.error('Error fetching teams:', error);
      return { teams: [] };
    }
  },

  // ========== PLAYERS & STATS ==========
  
  async getPlayerStats(playerName, season = '2025') {
    try {
      console.log(`📊 Fetching stats for: ${playerName}`);
      
      // First search for player ID
      const searchParams = new URLSearchParams({ search: playerName });
      const searchResponse = await fetch(`${BALLDONTLIE_API_BASE}/players?${searchParams}`, {
        headers: { 'Authorization': BALLDONTLIE_API_KEY }
      });
      
      const searchData = await searchResponse.json();
      
      if (!searchData.data || searchData.data.length === 0) {
        throw new Error(`Player "${playerName}" not found`);
      }
      
      const playerId = searchData.data[0].id;
      
      // Get player stats using RapidAPI
      const statsResponse = await fetch(`${RAPIDAPI_BASE}/players?id=${playerId}&season=${season}&league=12`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY_PLAYER_PROPS,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      });
      
      const statsData = await statsResponse.json();
      
      return {
        playerInfo: searchData.data[0],
        seasonStats: statsData.response || []
      };
      
    } catch (error) {
      console.error('❌ Error fetching player stats:', error);
      
      // Fallback to basic player data
      try {
        const searchResponse = await fetch(`${BALLDONTLIE_API_BASE}/players?search=${playerName}`, {
          headers: { 'Authorization': BALLDONTLIE_API_KEY }
        });
        
        const searchData = await searchResponse.json();
        
        return {
          playerInfo: searchData.data ? searchData.data[0] : null,
          seasonStats: { message: 'Detailed stats not available' }
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw error;
      }
    }
  },

  async getPlayers(position = null, team_id = null) {
    try {
      const params = new URLSearchParams();
      if (position) params.append('position', position);
      if (team_id) params.append('team_ids[]', team_id);
      
      const response = await fetch(`${BALLDONTLIE_API_BASE}/players?${params}`, {
        headers: {
          'Authorization': BALLDONTLIE_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching players:', error);
      return { data: [] };
    }
  },

  // ========== ODDS & BETTING ==========
  
  async getBettingInsights() {
    try {
      const response = await fetch(`${ODDS_API_BASE}/sports/basketball_nba/odds?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${THE_ODDS_API_KEY}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching betting insights:', error);
      return [];
    }
  },

  // ========== PREDICTIONS ==========
  
  async getPredictions(gameId = null) {
    try {
      const params = gameId ? `fixture=${gameId}` : '';
      const response = await fetch(`${RAPIDAPI_BASE}/predictions?${params}`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY_PREDICTIONS,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  },

  // ========== NEWS & ANALYTICS ==========
  
  async getNews(limit = 10) {
    try {
      const response = await fetch(`${ESPN_API_BASE}/news?limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  },

  // ========== FANTASY ==========
  
  async getFantasyAdvice(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get today's games and enhance with fantasy insights
    const todayGames = await this.getTodaysGames();
    
    // Add fantasy projections (simplified)
    const gamesWithFantasy = {
      date: targetDate,
      games: (todayGames.games || []).map(game => ({
        ...game,
        fantasy_insights: {
          projected_high_scorer: 'To be calculated',
          value_plays: ['Check player props for value'],
          injury_impacts: 'Monitor injury reports'
        }
      }))
    };
    
    return gamesWithFantasy;
  },

  // ========== AUTHENTICATION ==========
  
  async registerUser(userData) {
    const API_BASE_URL = 'https://pleasing-determination-production.up.railway.app';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  },

  async loginUser(credentials) {
    const API_BASE_URL = 'https://pleasing-determination-production.up.railway.app';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  },

  // ========== MOCK DATA METHODS ==========
  
  getMockGames() {
    return [
      {
        id: "game_001",
        homeTeam: "Los Angeles Lakers",
        awayTeam: "Golden State Warriors",
        date: "2024-01-15",
        time: "7:30 PM ET",
        venue: "Crypto.com Arena",
        status: "scheduled"
      },
      {
        id: "game_002",
        homeTeam: "Boston Celtics",
        awayTeam: "Miami Heat",
        date: "2024-01-16",
        time: "8:00 PM ET",
        venue: "TD Garden",
        status: "scheduled"
      }
    ];
  },
  
  getMockStandings() {
    return [
      { team: "Boston Celtics", wins: 35, losses: 10, winPercentage: 0.778 },
      { team: "Milwaukee Bucks", wins: 32, losses: 14, winPercentage: 0.696 },
      { team: "Philadelphia 76ers", wins: 30, losses: 15, winPercentage: 0.667 },
      { team: "Denver Nuggets", wins: 33, losses: 12, winPercentage: 0.733 },
      { team: "Los Angeles Clippers", wins: 28, losses: 17, winPercentage: 0.622 }
    ];
  },

  getMockGameSummary(gameId) {
    return {
      gameId: gameId || 'mock_game_001',
      homeTeam: 'Home Team',
      awayTeam: 'Away Team',
      status: 'scheduled',
      startTime: new Date().toISOString(),
      venue: 'Stadium Name',
    };
  }
};

// Maintain compatibility with existing code
export const nbaService = NBAService;
export default NBAService;
