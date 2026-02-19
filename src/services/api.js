// Update API base URL and add 2026 endpoints
const API_BASE = 'https://your-api.com'; // Your production URL

class FantasySportsAPI {
  constructor() {
    this.baseURL = API_BASE;
    this.season = '2025-26';
    this.asOfDate = 'February 11, 2026';
  }

  // Helper method for fetch requests
  async fetchJSON(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    return response.json();
  }

  // UPDATED: Players endpoint with 2026 roster filtering
  async getPlayers(sport = 'nba', realtime = true, limit = 200) {
    // Sport-specific filters for 2026
    const retiredPlayers = {
      nba: ['LeBron James', 'Stephen Curry', 'Kevin Durant', 'Chris Paul', 
            'Russell Westbrook', 'Klay Thompson', 'James Harden', 'Damian Lillard',
            'Jimmy Butler', 'Kyrie Irving']
    };

    const response = await fetch(
      `${this.baseURL}/api/players?sport=${sport}&realtime=${realtime}&limit=${limit}`
    );
    const data = await response.json();
    
    // Filter out retired players client-side
    if (sport === 'nba' && data.players) {
      data.players = data.players.filter(p => 
        !retiredPlayers.nba.includes(p.name)
      );
    }
    
    return data;
  }

  // UPDATED: Get NHL games with props for FantasyHub
  async getNHLGames(date, includeProps = true) {
    const dateParam = date ? `&date=${date}` : '';
    return this.fetchJSON(`/api/nhl/games?props=${includeProps}${dateParam}`);
  }

  // UPDATED: Get NHL player props for FantasyHub
  async getNHLPlayerProps(date) {
    const dateParam = date ? `?date=${date}` : '';
    return this.fetchJSON(`/api/fantasyhub/nhl/props${dateParam}`);
  }

  // UPDATED: Parlay suggestions with NHL support
  async getParlaySuggestions(sport = 'all', limit = 6) {
    return this.fetchJSON(`/api/parlay/suggestions?sport=${sport}&limit=${limit}`);
  }

  // NEW: Get NHL-specific parlays
  async getNHLParlays(limit = 3) {
    return this.fetchJSON(`/api/parlay/nhl?limit=${limit}`);
  }

  // NEW: Submit a parlay
  async submitParlay(parlay) {
    return this.fetchJSON('/api/parlay/submit', {
      method: 'POST',
      body: JSON.stringify(parlay)
    });
  }

  // NEW: Get parlay history with stats
  async getParlayHistory(sport) {
    const sportParam = sport ? `?sport=${sport}` : '';
    return this.fetchJSON(`/api/parlay/history${sportParam}`);
  }

  // NEW: Get All-Star 2026 specific data
  async getAllStar2026() {
    return this.fetchJSON('/api/nba/all-star-2026');
  }

  // NEW: Get 2026 season status
  async getSeasonStatus2026() {
    return this.fetchJSON('/api/2026/season-status');
  }

  // NEW: Get real-time sports news (February 2026)
  async getSportsNews(sport = 'all', limit = 10) {
    return this.fetchJSON(`/api/scraper/news?sport=${sport}&limit=${limit}`);
  }

  // UPDATED: Get daily picks with 2026 data
  async getDailyPicks(sport = 'nba', date = null) {
    const dateParam = date ? `&date=${date}` : '';
    return this.fetchJSON(`/api/picks?sport=${sport}${dateParam}`);
  }

  // UPDATED: Get player trends with 2026 performance
  async getPlayerTrends(player, sport = 'nba') {
    return this.fetchJSON(`/api/trends?player=${encodeURIComponent(player)}&sport=${sport}`);
  }

  // NEW: Get live scores (NBA + NHL)
  async getLiveScores(sport = 'nba', date = null) {
    const dateParam = date ? `&date=${date}` : '';
    return this.fetchJSON(`/api/scraper/scores?sport=${sport}${dateParam}`);
  }
}

export default new FantasySportsAPI();
