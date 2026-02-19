import { 
  Player, 
  NHLProp, 
  ParlaySuggestion, 
  NewsItem, 
  AllStar2026, 
  SeasonStatus2026,
  ApiResponse,
  Sport,
  TennisPlayer,
  TennisTournament,
  TennisMatch,
  GolfPlayer,
  GolfTournament,
  LeaderboardEntry
} from '../types/fantasy.types';

// Use VITE_ prefix for Vite
const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';

class FantasySportsAPI {
  private baseURL: string;
  public season: string = '2025-26';
  public asOfDate: string = 'February 11, 2026';

  constructor() {
    this.baseURL = API_BASE;
    console.log('API baseURL set to:', this.baseURL);
  }

  private async fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  private retiredNBAPlayers: string[] = [
    'LeBron James', 'Stephen Curry', 'Kevin Durant', 'Chris Paul',
    'Russell Westbrook', 'Klay Thompson', 'James Harden', 'Damian Lillard',
    'Jimmy Butler', 'Kyrie Irving', 'Anthony Davis'
  ];

  async getPlayers(sport: Sport = 'nba', realtime: boolean = true, limit: number = 200): Promise<ApiResponse<{ players: Player[] }>> {
    const data = await this.fetchJSON<ApiResponse<{ players: Player[] }>>(
      `/api/players?sport=${sport}&realtime=${realtime}&limit=${limit}`
    );
    if (sport === 'nba' && data.data?.players) {
      data.data.players = data.data.players.filter(p => !this.retiredNBAPlayers.includes(p.name));
    }
    return data;
  }

  async getNHLGames(date?: string, includeProps: boolean = true): Promise<ApiResponse<{ games: any[]; league_leaders: any; days_to_deadline: number; }>> {
    const dateParam = date ? `&date=${date}` : '';
    return this.fetchJSON(`/api/nhl/games?props=${includeProps}${dateParam}`);
  }

  async getNHLPlayerProps(date?: string): Promise<ApiResponse<{ props: NHLProp[] }>> {
    const dateParam = date ? `?date=${date}` : '';
    return this.fetchJSON(`/api/fantasyhub/nhl/props${dateParam}`);
  }

  async getParlaySuggestions(sport: string = 'all', limit: number = 6): Promise<ApiResponse<{ suggestions: ParlaySuggestion[] }>> {
    return this.fetchJSON(`/api/parlay/suggestions?sport=${sport}&limit=${limit}`);
  }

  async getAllStar2026(): Promise<ApiResponse<AllStar2026>> {
    return this.fetchJSON('/api/nba/all-star-2026');
  }

  async getSeasonStatus2026(): Promise<ApiResponse<SeasonStatus2026>> {
    return this.fetchJSON('/api/2026/season-status');
  }

  async getSportsNews(sport: string = 'all', limit: number = 10): Promise<ApiResponse<{ news: NewsItem[] }>> {
    return this.fetchJSON(`/api/scraper/news?sport=${sport}&limit=${limit}`);
  }

  async getDailyPicks(sport: Sport = 'nba', date?: string): Promise<ApiResponse<{ picks: any[] }>> {
    const dateParam = date ? `&date=${date}` : '';
    return this.fetchJSON(`/api/picks?sport=${sport}${dateParam}`);
  }

  async getPlayerTrends(player: string, sport: Sport = 'nba'): Promise<ApiResponse<{ trends: any[] }>> {
    return this.fetchJSON(`/api/trends?player=${encodeURIComponent(player)}&sport=${sport}`);
  }

  async getLiveScores(sport: Sport = 'nba', date?: string): Promise<ApiResponse<{ games: any[] }>> {
    const dateParam = date ? `&date=${date}` : '';
    return this.fetchJSON(`/api/scraper/scores?sport=${sport}${dateParam}`);
  }

  // ========== TENNIS ENDPOINTS ==========
  async getTennisPlayers(tour?: 'ATP' | 'WTA'): Promise<ApiResponse<{ players: TennisPlayer[] }>> {
    const params = tour ? `?tour=${tour}` : '';
    return this.fetchJSON(`/api/tennis/players${params}`);
  }

  async getTennisTournaments(tour?: 'ATP' | 'WTA'): Promise<ApiResponse<{ tournaments: TennisTournament[] }>> {
    const params = tour ? `?tour=${tour}` : '';
    return this.fetchJSON(`/api/tennis/tournaments${params}`);
  }

  async getTennisMatches(tour?: 'ATP' | 'WTA', date?: string): Promise<ApiResponse<{ matches: TennisMatch[] }>> {
    const params = new URLSearchParams();
    if (tour) params.append('tour', tour);
    if (date) params.append('date', date);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJSON(`/api/tennis/matches${queryString}`);
  }

  // ========== GOLF ENDPOINTS ==========
  async getGolfPlayers(tour?: 'PGA' | 'LPGA'): Promise<ApiResponse<{ players: GolfPlayer[] }>> {
    const params = tour ? `?tour=${tour}` : '';
    return this.fetchJSON(`/api/golf/players${params}`);
  }

  async getGolfTournaments(tour?: 'PGA' | 'LPGA'): Promise<ApiResponse<{ tournaments: GolfTournament[] }>> {
    const params = tour ? `?tour=${tour}` : '';
    return this.fetchJSON(`/api/golf/tournaments${params}`);
  }

  async getGolfLeaderboard(tour?: 'PGA' | 'LPGA', tournament?: string): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    const params = new URLSearchParams();
    if (tour) params.append('tour', tour);
    if (tournament) params.append('tournament', tournament);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJSON(`/api/golf/leaderboard${queryString}`);
  }

  // ========== LOCAL STORAGE METHODS ==========
  saveLineup(sport: Sport, lineup: any): void {
    localStorage.setItem(`fantasyHubLineup_${sport}_2026`, JSON.stringify(lineup));
  }

  loadLineup(sport: Sport): any {
    const saved = localStorage.getItem(`fantasyHubLineup_${sport}_2026`);
    return saved ? JSON.parse(saved) : null;
  }

  clearLineup(sport: Sport): void {
    localStorage.removeItem(`fantasyHubLineup_${sport}_2026`);
  }
}

const api = new FantasySportsAPI();
export default api;
