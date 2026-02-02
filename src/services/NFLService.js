// src/services/NFLService.js - NFL-specific API calls with real API integration

// API Configuration
const NFL_API_KEY = '2I2qnUQq7kcNAuhaCo3ElrgoVfHcdSBNoKXGTiqj';
const THE_ODDS_API_KEY = '14befba45463dc61bb71eb3da6428e9e';
const RAPIDAPI_KEY_PLAYER_PROPS = 'a0e5e0f406mshe0e4ba9f4f4daeap19859djsnfd92d0da5884';
const RAPIDAPI_KEY_PREDICTIONS = 'cdd1cfc95bmsh3dea79dcd1be496p167ea1jsnb355ed1075ec';

// Base URLs
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
const NFL_API_BASE = 'https://api.sportradar.us/nfl';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const RAPIDAPI_BASE = 'https://api-football-v1.p.rapidapi.com/v3';

export const NFLService = {
  // ========== PRIMARY BACKEND API METHODS ==========
  
  async fetchGames(season = '2024') {
    try {
      console.log('📡 Fetching NFL games from backend...');
      
      // Use fetchFromBackend if available, otherwise use mock data
      try {
        // Dynamic import to avoid issues if fetchFromBackend doesn't exist
        const { fetchFromBackend } = await import('../config/api');
        const response = await fetchFromBackend('NFL', 'games');
        
        if (response && response.success) {
          console.log(`✅ NFL: ${response.games?.length || 0} games loaded`);
          return response.games || [];
        }
      } catch (backendError) {
        console.warn('Backend API not available, using mock data:', backendError.message);
      }
      
      return this.getMockGames();
      
    } catch (error) {
      console.error('❌ NFL Service Error:', error.message);
      return this.getMockGames();
    }
  },
  
  async fetchStandings() {
    try {
      console.log('📡 Fetching NFL standings from backend...');
      
      try {
        const { fetchFromBackend } = await import('../config/api');
        const response = await fetchFromBackend('NFL', 'standings');
        
        if (response && response.success) {
          console.log(`✅ NFL: Standings loaded from backend`);
          return response.standings || [];
        }
      } catch (backendError) {
        console.warn('Backend standings not available:', backendError.message);
      }
      
    } catch (error) {
      console.error('❌ NFL Standings Error:', error.message);
    }
    
    // Fallback to mock data
    return this.getMockStandings();
  },

  async fetchTeams() {
    try {
      console.log('📡 Fetching NFL teams from backend...');
      
      try {
        const { fetchFromBackend } = await import('../config/api');
        const response = await fetchFromBackend('NFL', 'teams');
        
        if (response && response.success) {
          console.log(`✅ NFL: Teams loaded from backend`);
          return response.teams || [];
        }
      } catch (backendError) {
        console.warn('Backend teams not available:', backendError.message);
      }
      
    } catch (error) {
      console.error('❌ NFL Teams Error:', error.message);
    }
    
    return this.getMockTeams();
  },

  // ========== GAME SUMMARY METHOD ==========
  
  async getGameSummary(gameId) {
    try {
      try {
        const { fetchFromBackend } = await import('../config/api');
        const response = await fetchFromBackend('NFL', 'gameSummary', { gameId });
        
        if (response && response.message && response.message.includes('Stub')) {
          console.log('⚠️ Using stub game summary - backend not fully implemented');
        }
        
        return response?.summary || {};
        
      } catch (backendError) {
        console.warn('Backend game summary not available:', backendError.message);
      }
      
    } catch (error) {
      console.error('Game summary error:', error);
    }
    
    return this.getMockGameSummary(gameId);
  },

  // ========== EXTERNAL API METHODS ==========
  
  // Get all games (Sportradar NFL API)
  async getGames(week = null, season = '2024') {
    const params = {
      api_key: NFL_API_KEY,
      format: 'json'
    };
    
    let endpoint = `${NFL_API_BASE}/games/${season}/REG/schedule.json`;
    if (week) {
      endpoint = `${NFL_API_BASE}/games/${season}/REG/${week}/schedule.json`;
    }
    
    try {
      const url = new URL(endpoint);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching NFL games:', error);
      return { weeks: [] };
    }
  },

  // Get today's games
  async getTodaysGames() {
    const today = new Date().toISOString().split('T')[0];
    
    // Try backend first
    try {
      const games = await this.fetchGames();
      if (games && games.length > 0) {
        console.log(`✅ Found ${games.length} games for today from backend`);
        return {
          source: 'BACKEND',
          count: games.length,
          games: games
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend API failed, trying Sportradar as fallback');
    }
    
    // Fallback to Sportradar
    try {
      const games = await this.getGames();
      if (games && games.weeks) {
        // Find today's games across all weeks
        const allGames = games.weeks.flatMap(week => week.games || []);
        const todaysGames = allGames.filter(game => {
          const gameDate = new Date(game.scheduled).toISOString().split('T')[0];
          return gameDate === today;
        });
        
        if (todaysGames.length > 0) {
          console.log(`✅ Found ${todaysGames.length} games for today from Sportradar`);
          return {
            source: 'SPORTRADAR',
            count: todaysGames.length,
            games: todaysGames
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Sportradar API failed, trying ESPN as fallback');
    }
    
    // Final fallback to ESPN
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
    // First try backend
    try {
      const games = await this.fetchGames();
      const liveGames = games.filter(game => 
        game.status && 
        (game.status === 'inprogress' || 
         game.status === 'halftime' ||
         game.status === 'in')
      );
      
      if (liveGames.length > 0) {
        return {
          source: 'BACKEND',
          timestamp: new Date().toISOString(),
          count: liveGames.length,
          games: liveGames
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend live games failed, trying ESPN as fallback');
    }
    
    // Fallback to ESPN for quick live scores
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

  // Get detailed game info by ID
  async getGameDetails(gameId) {
    try {
      const response = await fetch(`${NFL_API_BASE}/games/${gameId}/summary.json?api_key=${NFL_API_KEY}&format=json`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching game details:', error);
      
      // Fallback to game summary
      return this.getGameSummary(gameId);
    }
  },

  // ========== STANDINGS ==========
  
  async getStandings(conference = null, season = '2024') {
    // Try backend first
    try {
      const standings = await this.fetchStandings();
      if (standings && standings.length > 0) {
        return {
          source: 'BACKEND',
          standings: standings
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend standings failed, using Sportradar as fallback');
    }
    
    // Using Sportradar for official standings
    try {
      const response = await fetch(`${NFL_API_BASE}/seasons/${season}/REG/standings.json?api_key=${NFL_API_KEY}&format=json`);
      const data = await response.json();
      
      if (!data || !data.conferences) return data;
      
      if (conference) {
        const conf = data.conferences.find(c => 
          c.name && c.name.toLowerCase().includes(conference.toLowerCase())
        );
        return conf || { divisions: [] };
      }
      return data;
    } catch (error) {
      console.error('Error fetching standings:', error);
      return { conferences: [] };
    }
  },

  // ========== TEAMS ==========
  
  async getTeams() {
    // Try backend first
    try {
      const teams = await this.fetchTeams();
      if (teams && teams.length > 0) {
        return {
          source: 'BACKEND',
          count: teams.length,
          teams: teams
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend teams failed, using Sportradar as fallback');
    }
    
    // Sportradar teams endpoint
    try {
      const response = await fetch(`${NFL_API_BASE}/league/hierarchy.json?api_key=${NFL_API_KEY}&format=json`);
      const data = await response.json();
      
      // Flatten teams from conferences and divisions
      const teams = [];
      if (data && data.conferences) {
        data.conferences.forEach(conf => {
          conf.divisions.forEach(div => {
            teams.push(...div.teams);
          });
        });
      }
      return teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  },

  // ========== ODDS & BETTING ==========
  
  async getOdds(region = 'us', market = 'h2h', oddsFormat = 'american') {
    try {
      const response = await fetch(`${ODDS_API_BASE}/sports/americanfootball_nfl/odds?regions=${region}&markets=${market}&oddsFormat=${oddsFormat}&apiKey=${THE_ODDS_API_KEY}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching odds:', error);
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

  // ========== NEWS ==========
  
  async getNews(limit = 20) {
    try {
      const response = await fetch(`${ESPN_API_BASE}/news?limit=${limit}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  },

  // ========== MOCK DATA METHODS ==========
  
  getMockGames() {
    return [
      {
        id: 'mock-1',
        status: 'scheduled',
        scheduled: '2024-09-05T20:20:00Z',
        home: { name: 'Kansas City Chiefs', alias: 'KC' },
        away: { name: 'Detroit Lions', alias: 'DET' },
        venue: { name: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City', state: 'MO' }
      },
      {
        id: 'mock-2',
        status: 'scheduled',
        scheduled: '2024-09-08T13:00:00Z',
        home: { name: 'New York Jets', alias: 'NYJ' },
        away: { name: 'San Francisco 49ers', alias: 'SF' },
        venue: { name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ' }
      }
    ];
  },

  getMockStandings() {
    return [
      {
        id: 'KC',
        name: 'Kansas City Chiefs',
        wins: 12,
        losses: 5,
        ties: 0,
        winPercentage: 0.706,
        conference: 'AFC',
        division: 'West'
      },
      {
        id: 'BUF',
        name: 'Buffalo Bills',
        wins: 11,
        losses: 6,
        ties: 0,
        winPercentage: 0.647,
        conference: 'AFC',
        division: 'East'
      },
      {
        id: 'SF',
        name: 'San Francisco 49ers',
        wins: 13,
        losses: 4,
        ties: 0,
        winPercentage: 0.765,
        conference: 'NFC',
        division: 'West'
      }
    ];
  },

  getMockTeams() {
    return [
      {
        id: 'KC',
        name: 'Kansas City Chiefs',
        market: 'Kansas City',
        alias: 'KC',
        conference: 'AFC',
        division: 'West'
      },
      {
        id: 'SF',
        name: 'San Francisco 49ers',
        market: 'San Francisco',
        alias: 'SF',
        conference: 'NFC',
        division: 'West'
      },
      {
        id: 'BUF',
        name: 'Buffalo Bills',
        market: 'Buffalo',
        alias: 'BUF',
        conference: 'AFC',
        division: 'East'
      }
    ];
  },

  getMockGameSummary(gameId) {
    return {
      gameId: gameId || 'mock_nfl_game_001',
      homeTeam: 'NFL Home Team',
      awayTeam: 'NFL Away Team',
      status: 'scheduled',
    };
  },

  // ========== API HEALTH CHECK ==========
  
  async checkApiHealth() {
    const endpoints = [
      { 
        name: 'Backend API', 
        test: async () => {
          try {
            const games = await this.fetchGames();
            return games && games.length > 0;
          } catch (error) {
            return false;
          }
        }
      },
      { 
        name: 'Sportradar NFL', 
        url: `${NFL_API_BASE}/games/2024/REG/1/schedule.json`
      },
      { 
        name: 'ESPN', 
        url: `${ESPN_API_BASE}/scoreboard` 
      }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        
        if (endpoint.test) {
          // Test backend API
          const isHealthy = await endpoint.test();
          const latency = Date.now() - startTime;
          
          results.push({
            name: endpoint.name,
            status: isHealthy ? '✅ Healthy' : '⚠️ Issues',
            latency: `${latency}ms`
          });
        } else {
          // Test external APIs
          const params = endpoint.name.includes('Sportradar') ? { api_key: NFL_API_KEY, format: 'json' } : {};
          const url = new URL(endpoint.url);
          Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
          
          const response = await fetch(url.toString(), { timeout: 5000 });
          const latency = Date.now() - startTime;
          
          results.push({
            name: endpoint.name,
            status: response.status === 200 ? '✅ Healthy' : '⚠️ Issues',
            statusCode: response.status,
            latency: `${latency}ms`
          });
        }
      } catch (error) {
        results.push({
          name: endpoint.name,
          status: '❌ Unavailable',
          error: error.message
        });
      }
    }
    
    return results;
  }
};

export default NFLService;
