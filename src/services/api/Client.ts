// src/services/apiClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, ApiEndpoints } from '../config/apiConfig';

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  salary: number;
  fanduel_salary?: number;
  draftkings_salary?: number;
  fantasy_points: number;
  projected_points: number;
  projection: number;
  value: number;
  valueScore: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  minutes: number;
  stats: {
    field_goal_pct: number;
    three_point_pct: number;
    free_throw_pct: number;
    turnovers: number;
  };
  projections: PlayerProjections;
  injury_status: string;
  team_color?: string;
  player_image?: string;
  last_game_stats?: any;
  is_real_data: boolean;
  data_source: string;
  is_enhanced?: boolean;
  is_realtime?: boolean;
}

export interface PlayerProjections {
  fantasy_points: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  value: number;
  confidence: number;
}

export interface FantasyTeam {
  id: string;
  name: string;
  owner: string;
  sport: string;
  league: string;
  record: string;
  points: number;
  rank: number;
  players: string[];
  waiver_position: number;
  moves_this_week: number;
  last_updated: string;
  projected_points: number;
  win_probability: number;
  strength_of_schedule: number;
  is_real_data: boolean;
}

export interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  period?: string;
  time_remaining?: string;
  status: string;
  bookmakers?: Bookmaker[];
  confidence_score?: number;
  confidence_level?: string;
  venue?: string;
  broadcast?: { network: string };
  awayTeam?: { name: string; abbreviation: string; score: number };
  homeTeam?: { name: string; abbreviation: string; score: number };
  date?: string;
  week?: number;
  is_real_data?: boolean;
  data_source?: string;
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update?: string;
  markets: Market[];
}

export interface Market {
  key: string;
  last_update?: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
}

export interface PlayerProp {
  id: string;
  player: string;
  team: string;
  market: string;
  line: number;
  over_odds: number;
  under_odds: number;
  confidence: number;
  player_id?: string;
  position?: string;
  last_updated: string;
  sport: string;
  is_real_data: boolean;
  game?: string;
  game_time?: string;
}

export interface PrizePicksSelection {
  id: string;
  player: string;
  sport: string;
  stat_type: string;
  line: number;
  projection: number;
  projection_diff: number;
  projection_edge: number;
  edge: number;
  confidence: number;
  odds: string;
  odds_source: string;
  type: 'Over' | 'Under';
  team: string;
  team_full: string;
  position: string;
  bookmaker: string;
  over_price: number;
  under_price: number;
  last_updated: string;
  is_real_data: boolean;
  data_source: string;
  game: string;
  opponent: string;
  game_time: string;
  minutes_projected: number;
  usage_rate: number;
  injury_status: string;
  value_side: string;
  ai_insight?: string;
  ai_confidence?: string;
}

export interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ParlayLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: string;
  analysis: string;
  expected_value: string;
  risk_level: string;
  ai_metrics: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge: number;
  };
  timestamp: string;
  isToday: boolean;
  is_real_data: boolean;
  has_data: boolean;
}

export interface ParlayLeg {
  id: string;
  description: string;
  odds: string;
  confidence: number;
  sport: string;
  market: string;
  player_name?: string;
  stat_type?: string;
  line?: number;
  value_side?: string;
  teams?: { home: string; away: string };
  confidence_level: string;
}

export interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
  player_props?: PlayerProp[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  markets: OddsMarket[];
}

export interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  source: { name: string };
  publishedAt: string;
  url: string;
  urlToImage: string;
  category: string;
  sport: string;
  confidence?: number;
  player?: string;
  team?: string;
  is_real_data?: boolean;
}

export interface ScrapedGame {
  id: string;
  away_team: string;
  home_team: string;
  away_score: string;
  home_score: string;
  status: string;
  details?: string;
  source: string;
  scraped_at: string;
  league: string;
  sport?: string;
  is_mock?: boolean;
}

export interface Analytics {
  id: string;
  title: string;
  metric: string;
  value: number | string;
  change: string;
  trend: string;
  sport: string;
  sample_size?: number;
  positive_edges?: number;
  total_analyzed?: number;
  injured_count?: number;
  total_players?: number;
  position_distribution?: Record<string, number>;
  timestamp: string;
}

export interface Prediction {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  analysis: string;
  expires: string;
  confidence: number;
  edge: string;
  platform: string;
  marketType: string;
  sport?: string;
  player?: string;
  team?: string;
}

export interface DailyPick {
  id: string;
  player: string;
  team: string;
  position: string;
  stat: string;
  line: number;
  projection: number;
  confidence: number;
  analysis: string;
  value: string;
  edge_percentage: number;
  sport: string;
  is_real_data: boolean;
}

export interface PlayerTrend {
  id: string;
  player: string;
  sport: string;
  metric: string;
  trend: 'up' | 'down' | 'stable';
  last_5_games: number[];
  average: number;
  last_5_average: number;
  change: string;
  analysis: string;
  confidence: number;
  timestamp: string;
  is_real_data: boolean;
  player_id?: string;
  team?: string;
  position?: string;
}

export interface PredictionOutcome {
  id: string;
  player?: string;
  game?: string;
  prediction: string;
  actual_result: string;
  accuracy: number;
  outcome: 'correct' | 'incorrect' | 'partially-correct';
  confidence_pre_game?: number;
  key_factors?: string[];
  timestamp: string;
  source: string;
  is_real_data?: boolean;
}

export interface BettingInsight {
  id: string;
  text: string;
  source: string;
  category: string;
  confidence: number;
  scraped_at: string;
  tags: string[];
}

export interface KalshiMarket extends Prediction {}

export interface NFLStandings {
  id: string;
  name: string;
  abbreviation?: string;
  wins: number;
  losses: number;
  ties: number;
  win_percentage: number;
  points_for: number;
  points_against: number;
  conference: string;
  division: string;
  streak: string;
  last_5: string;
  home_record?: string;
  away_record?: string;
  conference_record?: string;
  division_record?: string;
  is_real_data: boolean;
  data_source?: string;
}

export interface DeepSeekResponse {
  success: boolean;
  analysis: string;
  model?: string;
  timestamp: string;
  source: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  timestamp: string;
  [key: string]: any;
}

export interface PlayersResponse extends ApiResponse {
  players: Player[];
  count: number;
  total_available?: number;
  sport: string;
  limit_requested?: number;
  limit_applied?: number;
  message: string;
  enhancement_applied?: boolean;
  is_realtime?: boolean;
  data_source?: string;
}

export interface FantasyTeamsResponse extends ApiResponse {
  teams: FantasyTeam[];
  count: number;
  sport: string;
  is_real_data: boolean;
}

export interface GamesResponse extends ApiResponse {
  games: Game[];
  count: number;
  sport?: string;
  source?: string;
  has_real_data?: boolean;
  week?: string;
}

export interface PrizePicksResponse extends ApiResponse {
  selections: PrizePicksSelection[];
  count: number;
  sport: string;
  data_source: string;
  is_real_data: boolean;
  cache_key?: string;
  apis_used: {
    sportsdata_nba: boolean;
    odds_api: boolean;
    deepseek: boolean;
  };
}

export interface ParlaySuggestionsResponse extends ApiResponse {
  suggestions: ParlaySuggestion[];
  count: number;
  sport: string;
  is_real_data: boolean;
  has_data: boolean;
  version: string;
}

export interface OddsResponse extends ApiResponse {
  sport: string;
  count: number;
  data: OddsGame[];
  source: string;
  params_used?: Record<string, string>;
  key_used?: string;
}

export interface AvailableSportsResponse extends ApiResponse {
  sports: Array<{
    key: string;
    group: string;
    title: string;
    description: string;
    active: boolean;
    has_outrights: boolean;
  }>;
  count: number;
}

export interface NewsResponse extends ApiResponse {
  news: NewsItem[];
  count: number;
  source: string;
  sport: string;
}

export interface ScraperResponse extends ApiResponse {
  games?: ScrapedGame[];
  data?: any[];
  count: number;
  source?: string;
  url?: string;
  has_real_data?: boolean;
}

export interface AnalyticsResponse extends ApiResponse {
  analytics: Analytics[];
  games?: Game[];
  count: number;
  sport: string;
  is_real_data: boolean;
  has_data: boolean;
}

export interface PredictionsResponse extends ApiResponse {
  predictions: Prediction[];
  count: number;
  is_real_data: boolean;
  has_data: boolean;
  data_source?: string;
  platform?: string;
}

export interface PicksResponse extends ApiResponse {
  picks: DailyPick[];
  count: number;
  sport: string;
  is_real_data: boolean;
}

export interface PlayerTrendsResponse extends ApiResponse {
  trends: PlayerTrend[];
  count: number;
  sport: string;
  is_real_data: boolean;
  has_data: boolean;
}

export interface PredictionOutcomesResponse extends ApiResponse {
  outcomes: PredictionOutcome[];
  count: number;
  sport: string;
  scraped?: boolean;
}

export interface BettingInsightsResponse extends ApiResponse {
  phrases: BettingInsight[];
  count: number;
  sources: string[];
  scraped: boolean;
}

export interface NFLStandingsResponse extends ApiResponse {
  standings: NFLStandings[];
  count: number;
  season: string;
  source: string;
}

export interface DeepSeekAnalyzeResponse extends ApiResponse {
  analysis: string;
  model?: string;
  source: string;
}

export interface StatsDatabaseResponse extends ApiResponse {
  database: any;
  count: number | string;
  metadata?: any;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  port: string;
  databases: {
    nba_players: number;
    nfl_players: number;
    mlb_players: number;
    nhl_players: number;
    fantasy_teams: number;
    stats_database: boolean;
  };
  apis_configured: {
    odds_api: boolean;
    sportsdata_api: boolean;
    deepseek_ai: boolean;
    news_api: boolean;
  };
  endpoints: string[];
  message: string;
}

export interface InfoResponse {
  success: boolean;
  name: string;
  version: string;
  endpoints: Record<string, string>;
  supported_sports: string[];
  features: {
    realtime_data: boolean;
    sportsdata_api: string;
    json_fallback: string;
  };
}

// =============================================
// API CLIENT CLASS
// =============================================

class ApiClient {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private requestCount: number = 0;
  private readonly requestLimit: number = 100;
  private requestWindow: number = 60000; // 1 minute
  private requestTimestamps: number[] = [];

  constructor() {
    // Determine base URL based on environment
    if (import.meta.env.VITE_API_URL) {
      this.baseURL = import.meta.env.VITE_API_URL;
    } else if (import.meta.env.DEV) {
      this.baseURL = 'http://localhost:8000';
    } else {
      this.baseURL = 'https://python-api-fresh-production.up.railway.app';
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    this.logApiConfig();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        config.params = {
          ...config.params,
          _t: Date.now(),
        };

        // Check rate limit
        if (!this.checkRateLimit()) {
          return Promise.reject(new Error('Rate limit exceeded. Please wait.'));
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log success in development
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            dataSize: JSON.stringify(response.data).length,
          });
        }
        return response;
      },
      (error: AxiosError) => {
        // Handle errors
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data as any;

          console.error(`❌ API Error ${status}: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            status,
            data,
            message: error.message,
          });

          // Handle specific status codes
          if (status === 429) {
            console.warn('⚠️ Rate limit hit, slowing down requests...');
          } else if (status === 404) {
            console.warn('⚠️ Endpoint not found:', error.config?.url);
          } else if (status >= 500) {
            console.error('🔥 Server error:', status);
          }
        } else if (error.request) {
          // Request made but no response
          console.error('❌ No response from server:', {
            url: error.config?.url,
            method: error.config?.method,
            message: error.message,
          });
        } else {
          // Request setup error
          console.error('❌ Request setup error:', error.message);
        }

        return Promise.reject(error);
      }
    );
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < this.requestWindow
    );

    if (this.requestTimestamps.length >= this.requestLimit) {
      return false;
    }

    this.requestTimestamps.push(now);
    return true;
  }

  private logApiConfig(): void {
    console.log('🔌 API Client initialized:', {
      baseURL: this.baseURL,
      environment: import.meta.env.MODE,
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    });
  }

  // =============================================
  // PLAYER ENDPOINTS
  // =============================================

  async getPlayers(params: {
    sport?: string;
    limit?: number;
    realtime?: boolean;
  } = {}): Promise<PlayersResponse> {
    try {
      const response = await this.client.get<PlayersResponse>('/api/players', {
        params: {
          sport: params.sport || 'nba',
          limit: params.limit || 200,
          realtime: params.realtime !== undefined ? params.realtime : true,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch players');
    }
  }

  async getFantasyPlayers(params: {
    sport?: string;
    limit?: number;
    realtime?: boolean;
  } = {}): Promise<PlayersResponse> {
    try {
      const response = await this.client.get<PlayersResponse>('/api/fantasy/players', {
        params: {
          sport: params.sport || 'nba',
          limit: params.limit || 100,
          realtime: params.realtime !== undefined ? params.realtime : true,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch fantasy players');
    }
  }

  // =============================================
  // TEAM ENDPOINTS
  // =============================================

  async getFantasyTeams(params: {
    sport?: string;
  } = {}): Promise<FantasyTeamsResponse> {
    try {
      const response = await this.client.get<FantasyTeamsResponse>('/api/fantasy/teams', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch fantasy teams');
    }
  }

  // =============================================
  // PRIZEPICKS / PLAYER PROPS ENDPOINTS
  // =============================================

  async getPrizePicksSelections(params: {
    sport?: string;
    cache?: boolean;
  } = {}): Promise<PrizePicksResponse> {
    try {
      const response = await this.client.get<PrizePicksResponse>('/api/prizepicks/selections', {
        params: {
          sport: params.sport || 'nba',
          cache: params.cache !== undefined ? params.cache : true,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch PrizePicks selections');
    }
  }

  async getPlayerProps(params: {
    sport?: string;
  } = {}): Promise<{ success: boolean; props: PlayerProp[]; count: number; sport: string; is_real_data: boolean; timestamp: string; }> {
    try {
      const response = await this.client.get('/api/player-props', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching player props:', error);
      return {
        success: false,
        props: [],
        count: 0,
        sport: params.sport || 'nba',
        is_real_data: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // =============================================
  // PARLAY ENDPOINTS
  // =============================================

  async getParlaySuggestions(params: {
    sport?: string;
    limit?: number;
  } = {}): Promise<ParlaySuggestionsResponse> {
    try {
      const response = await this.client.get<ParlaySuggestionsResponse>('/api/parlay/suggestions', {
        params: {
          sport: params.sport || 'all',
          limit: params.limit || 4,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch parlay suggestions');
    }
  }

  // =============================================
  // ODDS ENDPOINTS
  // =============================================

  async getOdds(params: {
    sport?: string;
    regions?: string;
    markets?: string;
    oddsFormat?: string;
    bookmakers?: string;
  } = {}): Promise<OddsResponse> {
    try {
      const sportParam = params.sport || 'basketball_nba';
      const response = await this.client.get<OddsResponse>(`/api/odds/${sportParam}`, {
        params: {
          regions: params.regions || 'us',
          markets: params.markets || 'h2h,spreads,totals',
          oddsFormat: params.oddsFormat || 'american',
          bookmakers: params.bookmakers || '',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch odds');
    }
  }

  async getOddsGames(params: {
    sport?: string;
    region?: string;
    markets?: string;
  } = {}): Promise<GamesResponse> {
    try {
      const response = await this.client.get<GamesResponse>('/api/odds/games', {
        params: {
          sport: params.sport || 'basketball_nba',
          region: params.region || 'us',
          markets: params.markets || 'h2h,spreads,totals',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch odds games');
    }
  }

  async getAvailableSports(): Promise<AvailableSportsResponse> {
    try {
      const response = await this.client.get<AvailableSportsResponse>('/api/odds/sports');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch available sports');
    }
  }

  // =============================================
  // NEWS & SPORTS WIRE ENDPOINTS
  // =============================================

  async getNews(params: {
    sport?: string;
  } = {}): Promise<NewsResponse> {
    try {
      const response = await this.client.get<NewsResponse>('/api/news', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch news');
    }
  }

  async getSportsWire(params: {
    sport?: string;
  } = {}): Promise<NewsResponse> {
    try {
      const response = await this.client.get<NewsResponse>('/api/sports-wire', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch sports wire');
    }
  }

  // =============================================
  // SCRAPER ENDPOINTS
  // =============================================

  async scrapeEspnNba(): Promise<ScraperResponse> {
    try {
      const response = await this.client.get<ScraperResponse>('/api/scrape/espn/nba');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to scrape ESPN NBA');
    }
  }

  async scrapeUniversalSports(params: {
    source?: string;
    sport?: string;
    league?: string;
  } = {}): Promise<ScraperResponse> {
    try {
      const response = await this.client.get<ScraperResponse>('/api/scrape/sports', {
        params: {
          source: params.source || 'espn',
          sport: params.sport || 'nba',
          league: params.league || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to scrape sports data');
    }
  }

  async getScrapedScores(params: {
    sport?: string;
  } = {}): Promise<ScraperResponse> {
    try {
      const response = await this.client.get<ScraperResponse>('/api/scraper/scores', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to get scraped scores');
    }
  }

  async getScrapedNews(): Promise<ScraperResponse> {
    try {
      const response = await this.client.get<ScraperResponse>('/api/scraper/news');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to get scraped news');
    }
  }

  async getSecretPhrases(): Promise<BettingInsightsResponse> {
    try {
      const response = await this.client.get<BettingInsightsResponse>('/api/secret-phrases');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch secret phrases');
    }
  }

  // =============================================
  // ANALYTICS & PREDICTIONS ENDPOINTS
  // =============================================

  async getAnalytics(params: {
    sport?: string;
  } = {}): Promise<AnalyticsResponse> {
    try {
      const response = await this.client.get<AnalyticsResponse>('/api/analytics', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch analytics');
    }
  }

  async getPredictions(params: {
    sport?: string;
    analyze?: boolean;
    prompt?: string;
  } = {}): Promise<PredictionsResponse | DeepSeekAnalyzeResponse> {
    try {
      const response = await this.client.get('/api/predictions', {
        params: {
          sport: params.sport || 'nba',
          analyze: params.analyze || false,
          prompt: params.prompt,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch predictions');
    }
  }

  async getDailyPicks(params: {
    sport?: string;
  } = {}): Promise<PicksResponse> {
    try {
      const response = await this.client.get<PicksResponse>('/api/picks', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch daily picks');
    }
  }

  async getPlayerTrends(params: {
    sport?: string;
    player?: string;
  } = {}): Promise<PlayerTrendsResponse> {
    try {
      const response = await this.client.get<PlayerTrendsResponse>('/api/trends', {
        params: {
          sport: params.sport || 'nba',
          player: params.player,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch player trends');
    }
  }

  async getPredictionOutcomes(params: {
    sport?: string;
  } = {}): Promise<PredictionOutcomesResponse> {
    try {
      const response = await this.client.get<PredictionOutcomesResponse>('/api/predictions/outcome', {
        params: {
          sport: params.sport || 'nba',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch prediction outcomes');
    }
  }

  // =============================================
  // LEAGUE-SPECIFIC ENDPOINTS
  // =============================================

  async getNFLGames(params: {
    week?: string;
    date?: string;
  } = {}): Promise<GamesResponse> {
    try {
      const response = await this.client.get<GamesResponse>('/api/nfl/games', {
        params: {
          week: params.week || 'current',
          date: params.date,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch NFL games');
    }
  }

  async getNFLStandings(params: {
    season?: string;
  } = {}): Promise<NFLStandingsResponse> {
    try {
      const response = await this.client.get<NFLStandingsResponse>('/api/nfl/standings', {
        params: {
          season: params.season || '2023',
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch NFL standings');
    }
  }

  async getNHLGames(params: {
    date?: string;
  } = {}): Promise<GamesResponse> {
    try {
      const response = await this.client.get<GamesResponse>('/api/nhl/games', {
        params: {
          date: params.date,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch NHL games');
    }
  }

  // =============================================
  // DEEPSEEK AI ENDPOINTS
  // =============================================

  async analyzeWithDeepSeek(prompt: string): Promise<DeepSeekAnalyzeResponse> {
    try {
      const response = await this.client.get<DeepSeekAnalyzeResponse>('/api/deepseek/analyze', {
        params: {
          prompt,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to analyze with DeepSeek');
    }
  }

  // =============================================
  // STATS DATABASE ENDPOINTS
  // =============================================

  async getStatsDatabase(params: {
    category?: string;
    sport?: string;
  } = {}): Promise<StatsDatabaseResponse> {
    try {
      const response = await this.client.get<StatsDatabaseResponse>('/api/stats/database', {
        params: {
          category: params.category,
          sport: params.sport,
        },
      });
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to fetch stats database');
    }
  }

  // =============================================
  // SYSTEM ENDPOINTS
  // =============================================

  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/api/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  async getInfo(): Promise<InfoResponse> {
    try {
      const response = await this.client.get<InfoResponse>('/api/info');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch API info:', error);
      throw error;
    }
  }

  // =============================================
  // DEBUG ENDPOINTS
  // =============================================

  async debugOddsConfig(): Promise<any> {
    try {
      const response = await this.client.get('/api/debug/odds-config');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to debug odds config');
    }
  }

  async debugDataStructure(): Promise<any> {
    try {
      const response = await this.client.get('/api/debug/data-structure');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to debug data structure');
    }
  }

  async debugFantasyTeams(): Promise<any> {
    try {
      const response = await this.client.get('/api/debug/fantasy-teams');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to debug fantasy teams');
    }
  }

  async debugFantasyStructure(): Promise<any> {
    try {
      const response = await this.client.get('/api/debug/fantasy-structure');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to debug fantasy structure');
    }
  }

  async debugTeamsRaw(): Promise<any> {
    try {
      const response = await this.client.get('/api/debug/teams-raw');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to debug teams raw');
    }
  }

  async debugPlayerSample(sport: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/debug/player-sample/${sport}`);
      return response.data;
    } catch (error) {
      return this.handleError(error, `Failed to debug player sample for ${sport}`);
    }
  }

  async debugLoadStatus(): Promise<any> {
    try {
      const response = await this.client.get('/api/debug/load-status');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to debug load status');
    }
  }

  async testOddsDirect(): Promise<any> {
    try {
      const response = await this.client.get('/api/test/odds-direct');
      return response.data;
    } catch (error) {
      return this.handleError(error, 'Failed to test odds direct');
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private handleError<T>(error: any, defaultMessage: string): T {
    console.error(`❌ ${defaultMessage}:`, error);
    
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data as T;
    }
    
    return {
      success: false,
      error: error.message || defaultMessage,
      message: defaultMessage,
      timestamp: new Date().toISOString(),
    } as T;
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config);
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  clearCache(): void {
    // Implementation would depend on your caching strategy
    console.log('🧹 Clearing API cache');
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

export const apiClient = new ApiClient();
export default apiClient;
