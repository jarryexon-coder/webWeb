// src/services/NHLService.js - NHL-specific API calls with real API integration
import { apiService } from './ApiService';
import { fetchFromBackend } from '../config/api';

// API Configuration from your provided keys
const NHL_API_KEY = '2I2qnUQq7kcNAuhaCo3ElrgoVfHcdSBNoKXGTiqj';
const THE_ODDS_API_KEY = '14befba45463dc61bb71eb3da6428e9e';
const RAPIDAPI_KEY_PLAYER_PROPS = 'a0e5e0f406mshe0e4ba9f4f4daeap19859djsnfd92d0da5884';
const RAPIDAPI_KEY_PREDICTIONS = 'cdd1cfc95bmsh3dea79dcd1be496p167ea1jsnb355ed1075ec';

// Base URLs
const ESPN_NHL_BASE = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl';
const SPORTRADAR_NHL_BASE = 'https://api.sportradar.us/nhl';
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const RAPIDAPI_BASE = 'https://api-nhl-v1.p.rapidapi.com';

export const NHLService = {
  // ========== PRIMARY BACKEND API METHODS ==========
  
  async fetchGames(season = '2024') {
    try {
      console.log('📡 Fetching NHL games from backend...');
      const response = await fetchFromBackend('NHL', 'games');
      
      if (response && response.success) {
        console.log(`✅ NHL: ${response.games?.length || 0} games loaded`);
        return response.games || [];
      }
      
      return this.getMockGames();
      
    } catch (error) {
      console.error('❌ NHL Service Error:', error.message);
      return this.getMockGames();
    }
  },

  async fetchStandings() {
    try {
      console.log('📡 Fetching NHL standings from backend...');
      const response = await fetchFromBackend('NHL', 'standings');
      if (response && response.success) {
        console.log(`✅ NHL: Standings loaded from backend`);
        return response.standings || [];
      }
    } catch (error) {
      console.error('❌ NHL Standings Error:', error.message);
    }
    
    // Fallback to mock data
    return this.getMockStandings();
  },

  async fetchTeams() {
    try {
      console.log('📡 Fetching NHL teams from backend...');
      const response = await fetchFromBackend('NHL', 'teams');
      if (response && response.success) {
        console.log(`✅ NHL: Teams loaded from backend`);
        return response.teams || [];
      }
    } catch (error) {
      console.error('❌ NHL Teams Error:', error.message);
    }
    return this.getMockTeams();
  },

  // ========== GAME SUMMARY METHOD ==========
  
  async getGameSummary(gameId) {
    try {
      const response = await fetchFromBackend('NHL', 'gameSummary', { gameId });
      
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
  
  // Get latest NHL games and scores
  async getLatest(limit = 10) {
    try {
      const games = await this.fetchGames();
      if (games && games.length > 0) {
        const latestGames = games.slice(0, limit);
        return {
          source: 'BACKEND',
          timestamp: new Date().toISOString(),
          count: latestGames.length,
          games: latestGames
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend API failed, using ESPN as fallback');
    }
    
    // Fallback to ESPN
    try {
      const response = await fetch(`${ESPN_NHL_BASE}/scoreboard`);
      const data = await response.json();
      
      if (!data || !data.events) return { games: [], source: 'ESPN' };
      
      const games = data.events
        .slice(0, limit)
        .map(event => ({
          id: event.id,
          name: event.name,
          shortName: event.shortName,
          status: event.status,
          date: event.date,
          competitions: event.competitions,
          links: event.links
        }));
      
      return {
        source: 'ESPN NHL',
        timestamp: new Date().toISOString(),
        count: games.length,
        games
      };
    } catch (error) {
      console.error('Error fetching latest games:', error);
      return { games: [], source: 'ERROR' };
    }
  },

  // Get all games with filtering
  async getGames(season = '2024', gameType = 'R', date = null) {
    if (!date) {
      try {
        const games = await this.fetchGames(season);
        if (games && games.length > 0) {
          return {
            source: 'BACKEND',
            season: season,
            gameType: gameType,
            count: games.length,
            games: games
          };
        }
      } catch (error) {
        console.warn('⚠️ Backend API failed, using Sportradar as fallback');
      }
    }
    
    // Fallback to Sportradar
    try {
      let endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/games/${season}/${gameType}/schedule.json`;
      
      if (date) {
        endpoint = `${SPORTRADAR_NHL_BASE}/trial/v8/en/games/${date}/schedule.json`;
      }
      
      const response = await fetch(`${endpoint}?api_key=${NHL_API_KEY}`);
      const data = await response.json();
      
      if (!data || !data.games) return { games: [] };
      
      return {
        source: 'Sportradar NHL',
        season: data.season?.year || season,
        gameType: data.gameType || gameType,
        count: data.games.length,
        games: data.games.map(game => ({
          id: game.id,
          status: game.status,
          scheduled: game.scheduled,
          venue: game.venue,
          home: game.home,
          away: game.away,
          broadcast: game.broadcast,
          odds: game.odds || null
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
    
    // Try backend first
    try {
      const games = await this.fetchGames();
      if (games && games.length > 0) {
        const todaysGames = games.filter(game => {
          const gameDate = new Date(game.scheduled).toISOString().split('T')[0];
          return gameDate === today;
        });
        
        if (todaysGames.length > 0) {
          console.log(`✅ Found ${todaysGames.length} games for today from backend`);
          return {
            source: 'BACKEND',
            count: todaysGames.length,
            games: todaysGames
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Backend API failed, trying Sportradar as fallback');
    }
    
    // Fallback to Sportradar for today's games
    try {
      const data = await this.getGames('2024', 'R', today);
      if (data.games && data.games.length > 0) {
        console.log(`✅ Found ${data.games.length} games for today from Sportradar`);
        return {
          source: data.source,
          count: data.games.length,
          games: data.games
        };
      }
    } catch (error) {
      console.warn('⚠️ Sportradar API failed, trying ESPN as fallback');
    }
    
    // Final fallback to ESPN
    try {
      const response = await fetch(`${ESPN_NHL_BASE}/scoreboard`);
      const data = await response.json();
      
      if (!data || !data.events) return { games: [], source: 'ESPN' };
      
      return {
        source: 'ESPN NHL',
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

  // Get live games with real-time updates
  async getLiveGames() {
    // Try backend first
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
    
    // Fallback to ESPN for live games
    try {
      const response = await fetch(`${ESPN_NHL_BASE}/scoreboard`);
      const data = await response.json();
      
      if (!data || !data.events) return { games: [] };
      
      const liveGames = data.events.filter(event => 
        event.status && event.status.type && 
        (event.status.type.state === 'in' || 
         event.status.type.state === 'inprogress' ||
         event.status.type.state === 'halftime')
      );
      
      return {
        source: 'ESPN NHL Live',
        timestamp: new Date().toISOString(),
        count: liveGames.length,
        games: liveGames.map(game => ({
          id: game.id,
          name: game.name,
          status: game.status,
          clock: game.status.type.detail,
          homeTeam: game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home'),
          awayTeam: game.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away'),
          period: game.status.period,
          broadcast: game.competitions?.[0]?.broadcasts?.[0]?.names?.[0]
        }))
      };
    } catch (error) {
      console.error('Error fetching live games:', error);
      return { games: [] };
    }
  },

  // Get game details by ID
  async getGameDetails(gameId) {
    // Try backend first if it's a backend game ID
    if (gameId && gameId.startsWith('mock-')) {
      const mockGames = this.getMockGames();
      const game = mockGames.find(g => g.id === gameId);
      if (game) {
        return {
          source: 'MOCK',
          ...game
        };
      }
    }
    
    // Fallback to Sportradar
    try {
      const response = await fetch(`${SPORTRADAR_NHL_BASE}/trial/v8/en/games/${gameId}/summary.json?api_key=${NHL_API_KEY}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching game details:', error);
      
      // Fallback to ESPN
      try {
        const response = await fetch(`${ESPN_NHL_BASE}/summary?event=${gameId}`);
        const data = await response.json();
        return {
          source: 'ESPN',
          ...data
        };
      } catch (espnError) {
        throw new Error(`Failed to fetch game details: ${error.message}`);
      }
    }
  },

  // ========== STANDINGS & TEAMS ==========
  
  async getStandings(season = '2024', conference = null) {
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
    
    // Fallback to Sportradar
    try {
      const response = await fetch(`${SPORTRADAR_NHL_BASE}/trial/v8/en/seasons/${season}/REG/standings.json?api_key=${NHL_API_KEY}`);
      const data = await response.json();
      
      if (!data || !data.conferences) return { conferences: [] };
      
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
    
    // Fallback to Sportradar
    try {
      const response = await fetch(`${SPORTRADAR_NHL_BASE}/trial/v8/en/league/hierarchy.json?api_key=${NHL_API_KEY}`);
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
      return {
        source: 'Sportradar',
        count: teams.length,
        teams
      };
    } catch (error) {
      console.error('Error fetching teams:', error);
      return { teams: [] };
    }
  },

  // ========== ODDS & BETTING ==========
  
  async getOdds(region = 'us', market = 'h2h') {
    try {
      const response = await fetch(`${ODDS_API_BASE}/sports/icehockey_nhl/odds?regions=${region}&markets=${market}&oddsFormat=american&apiKey=${THE_ODDS_API_KEY}`);
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
      const params = gameId ? `gameId=${gameId}` : '';
      const response = await fetch(`${RAPIDAPI_BASE}/predictions?${params}`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY_PREDICTIONS,
          'X-RapidAPI-Host': 'api-nhl-v1.p.rapidapi.com'
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
  
  async getNews(limit = 10) {
    try {
      const response = await fetch(`${ESPN_NHL_BASE}/news?limit=${limit}`);
      const data = await response.json();
      
      if (!data || !data.articles) return { articles: [] };
      
      return {
        source: 'ESPN NHL',
        count: data.articles.length,
        articles: data.articles.map(article => ({
          id: article.id,
          headline: article.headline,
          description: article.description,
          published: article.published,
          images: article.images,
          links: article.links,
          byline: article.byline
        }))
      };
    } catch (error) {
      console.error('Error fetching news:', error);
      return { articles: [] };
    }
  },

  // ========== MOCK DATA METHODS ==========
  
  getMockGames() {
    return [
      {
        id: 'mock-1',
        status: 'scheduled',
        scheduled: '2024-10-10T23:00:00Z',
        home: { name: 'Toronto Maple Leafs', alias: 'TOR' },
        away: { name: 'Montreal Canadiens', alias: 'MTL' },
        venue: { name: 'Scotiabank Arena', city: 'Toronto', state: 'ON' }
      },
      {
        id: 'mock-2',
        status: 'scheduled',
        scheduled: '2024-10-11T23:00:00Z',
        home: { name: 'New York Rangers', alias: 'NYR' },
        away: { name: 'Boston Bruins', alias: 'BOS' },
        venue: { name: 'Madison Square Garden', city: 'New York', state: 'NY' }
      },
      {
        id: 'mock-3',
        status: 'scheduled',
        scheduled: '2024-10-12T23:00:00Z',
        home: { name: 'Chicago Blackhawks', alias: 'CHI' },
        away: { name: 'Detroit Red Wings', alias: 'DET' },
        venue: { name: 'United Center', city: 'Chicago', state: 'IL' }
      }
    ];
  },

  getMockStandings() {
    return [
      {
        id: 'BOS',
        name: 'Boston Bruins',
        wins: 52,
        losses: 18,
        ot: 12,
        points: 116,
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'TOR',
        name: 'Toronto Maple Leafs',
        wins: 48,
        losses: 24,
        ot: 10,
        points: 106,
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'COL',
        name: 'Colorado Avalanche',
        wins: 50,
        losses: 22,
        ot: 10,
        points: 110,
        conference: 'West',
        division: 'Central'
      }
    ];
  },

  getMockTeams() {
    return [
      {
        id: 'BOS',
        name: 'Boston Bruins',
        market: 'Boston',
        alias: 'BOS',
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'TOR',
        name: 'Toronto Maple Leafs',
        market: 'Toronto',
        alias: 'TOR',
        conference: 'East',
        division: 'Atlantic'
      },
      {
        id: 'COL',
        name: 'Colorado Avalanche',
        market: 'Colorado',
        alias: 'COL',
        conference: 'West',
        division: 'Central'
      }
    ];
  },

  getMockGameSummary(gameId) {
    return {
      gameId: gameId || 'mock_nhl_game_001',
      homeTeam: 'NHL Home Team',
      awayTeam: 'NHL Away Team',
      status: 'scheduled',
    };
  }
};

export default NHLService;
