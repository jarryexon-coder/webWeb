// services/apiClient.ts - February 2026
// Complete API client with real backend calls, caching, retry on 429, and request deduplication
// Fixed: Remove Content-Type from GET to avoid preflight OPTIONS requests

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://python-api-fresh-production.up.railway.app';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Simple in‑memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Pending requests map for deduplication
const pendingRequests = new Map<string, Promise<any>>();

function getRequestKey(method: string, endpoint: string, params?: any, data?: any): string {
  return `${method}:${endpoint}:${JSON.stringify(params || {})}:${JSON.stringify(data || {})}`;
}

// ========== API CLIENT CLASS ==========

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeout?: number;

  constructor(config?: ApiClientConfig) {
    this.baseURL = config?.baseURL || API_BASE_URL;
    this.defaultHeaders = {
      'Accept': 'application/json',
      ...config?.headers
    };
    this.timeout = config?.timeout;
  }

  // ========== PRIVATE REQUEST METHOD WITH RETRY ON 429 AND DEDUPLICATION ==========
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: {
      headers?: Record<string, string>;
      params?: Record<string, any>;
      timeout?: number;
    }
  ): Promise<T> {
    const key = getRequestKey(method, endpoint, options?.params, data);

    // If there's already a pending request for this exact key, return its promise
    if (pendingRequests.has(key)) {
      console.log(`🔄 Reusing pending request for ${key}`);
      return pendingRequests.get(key) as Promise<T>;
    }

    // Build URL with query params
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare headers: for GET requests, omit Content-Type to avoid preflight
    const headers: Record<string, string> = { ...this.defaultHeaders, ...options?.headers };
    if (method === 'GET') {
      delete headers['Content-Type']; // Remove Content-Type for simple GET requests
    } else {
      // For methods with body, ensure Content-Type is set (default to JSON)
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Create the request promise with retry logic
    const requestPromise = this.performRequestWithRetry<T>(url.toString(), fetchOptions, options?.timeout);
    
    // Store it in pending map
    pendingRequests.set(key, requestPromise);

    // Clean up after the request settles (success or failure)
    requestPromise.finally(() => {
      pendingRequests.delete(key);
    });

    return requestPromise;
  }

  private async performRequestWithRetry<T>(
    url: string,
    fetchOptions: RequestInit,
    timeout?: number
  ): Promise<T> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout || this.timeout || 10000);
      fetchOptions.signal = controller.signal;

      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (response.status === 429) {
          // Rate limited – wait and retry
          attempts++;
          const delay = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Rate limited (429), retrying in ${delay}ms (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Handle 404 gracefully – return empty structure instead of throwing
        if (response.status === 404) {
          console.warn(`⚠️ Endpoint not found (404): ${url}`);
          // Return a minimal valid response structure based on context
          // This will be handled by the calling method (e.g., getPlayerProps)
          return { data: [], success: false, error: 'Not found' } as T;
        }

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (attempts >= maxAttempts - 1) throw error;
        attempts++;
        const delay = Math.pow(2, attempts) * 500; // 1s, 2s, 4s
        console.log(`⚠️ Request failed, retrying in ${delay}ms (${attempts}/${maxAttempts})`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retry attempts reached');
  }

  // ========== PUBLIC HTTP METHODS ==========

  async get<T = any>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, { params, headers });
  }

  async post<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', endpoint, data, { headers });
  }

  async put<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', endpoint, data, { headers });
  }

  async patch<T = any>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, { headers });
  }

  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, { headers });
  }

  // ========== CRITICAL ENDPOINTS (REAL BACKEND CALLS) ==========

  async getPlayers(params?: { sport?: string; limit?: number; realtime?: boolean }) {
    const sport = params?.sport || 'nba';
    const limit = params?.limit || 100;
    const realtime = params?.realtime !== undefined ? params.realtime : true;

    try {
      const response = await this.get<any>('/api/fantasy/players', {
        sport,
        limit,
        realtime: realtime ? 'true' : 'false'
      });
      return response;
    } catch (error) {
      console.error('❌ getPlayers failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch players',
        players: [],
        count: 0
      };
    }
  }

  async getOddsGames(params?: { sport?: string }) {
    const sport = params?.sport || 'nba';
    const cacheKey = `oddsGames-${sport}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    try {
      const response = await this.get<any>(`/api/odds/basketball_${sport}`, {});
      const result = {
        success: true,
        games: response.data || response,
        has_real_data: true
      };
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      // fallback to scrape
      try {
        const scrapeResponse = await this.get<any>(`/api/scrape/espn/${sport}`, {});
        const result = {
          success: true,
          games: scrapeResponse.data?.games || [],
          has_real_data: false
        };
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      } catch (fallbackError) {
        console.error('❌ getOddsGames failed:', fallbackError);
        return {
          success: false,
          error: fallbackError instanceof Error ? fallbackError.message : 'Failed to fetch games',
          games: []
        };
      }
    }
  }

  async getOdds(params?: { sport?: string }) {
    const sport = params?.sport || 'nba';
    const cacheKey = `odds-${sport}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;

    try {
      const response = await this.get<any>(`/api/odds/${sport}`, {});
      const result = { success: true, data: response.data || response };
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('❌ getOdds failed:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch odds'
      };
    }
  }

  async getFantasyTeams(params?: { sport?: string }) {
    return {
      success: true,
      teams: [
        { id: 'team-1', name: 'Demo Team', abbreviation: 'DEM', sport: (params?.sport || 'nba').toUpperCase() }
      ],
      is_real_data: false
    };
  }

  async getPrizePicksSelections(params?: { sport?: string; cache?: boolean }) {
    try {
      const sport = params?.sport || 'nba';
      const cache = params?.cache !== false;
      const response = await this.get<any>('/api/fantasy/props', { sport, source: 'prizepicks', cache });
      return {
        success: true,
        selections: response.data?.props || [],
        is_real_data: response.is_real_data || false,
        timestamp: response.last_updated
      };
    } catch (error) {
      console.error('❌ getPrizePicksSelections failed:', error);
      return {
        success: false,
        selections: [],
        error: error instanceof Error ? error.message : 'Failed to fetch PrizePicks'
      };
    }
  }

  async getNews(params?: { sport?: string }) {
    return {
      success: true,
      news: [
        {
          id: 'news-1',
          title: `${(params?.sport || 'NBA').toUpperCase()} News`,
          summary: 'Stay tuned for updates.',
          source: 'Mock',
          published_at: new Date().toISOString()
        }
      ],
      source: 'mock'
    };
  }

  async getAnalytics(params?: { sport?: string }) {
    return {
      success: true,
      analytics: [],
      games: [],
      is_real_data: false
    };
  }

  async getPredictions(params?: { sport?: string }) {
    return {
      success: true,
      predictions: [],
      is_real_data: false
    };
  }

  async getDailyPicks(params?: { sport?: string }) {
    return {
      success: true,
      picks: [],
      is_real_data: false
    };
  }

  async getPlayerTrends(params?: { sport?: string; player?: string }) {
    return {
      success: true,
      trends: [],
      is_real_data: false
    };
  }

  async getSecretPhrases() {
    return {
      success: true,
      phrases: [{ id: '1', phrase: 'Mock Secret Phrase', hint: 'This is a hint' }],
      scraped: false
    };
  }

  async getPredictionOutcomes(params?: { sport?: string }) {
    return {
      success: true,
      outcomes: [],
      scraped: false
    };
  }

  async getPlayerProps(params?: { sport?: string }) {
    try {
      const sport = params?.sport || 'nba';
      const response = await this.get<any>('/api/fantasy/props', { sport });
      return {
        success: true,
        props: response.data?.props || [],
        is_real_data: response.is_real_data || false,
        timestamp: response.last_updated
      };
    } catch (error) {
      console.error('❌ getPlayerProps failed:', error);
      return {
        success: false,
        props: [],
        error: error instanceof Error ? error.message : 'Failed to fetch player props'
      };
    }
  }

  async getHealth() {
    try {
      const response = await this.get<any>('/api/health');
      return response;
    } catch (error) {
      return {
        success: false,
        error: 'Health check failed'
      };
    }
  }

  // ========== PARLAY ENDPOINTS (mock) – can be upgraded later ==========

  async getParlaySuggestions(sport: any = 'all', limit: number = 6) {
    const sportStr = typeof sport === 'string' ? sport : 'all';
    return {
      success: true,
      data: {
        suggestions: Array(limit).fill(0).map((_, i) => ({
          id: `parlay-${i}`,
          title: `${sportStr.toUpperCase()} Parlay ${i+1}`,
          legs: [],
          odds: +250,
          confidence: 75,
        })),
      },
    };
  }

  async getParlayTypes(sport: any = 'all') {
    const sportStr = typeof sport === 'string' ? sport : 'all';
    return {
      success: true,
      data: {
        types: ['standard', 'teaser', 'round robin'],
      },
    };
  }

  async buildParlay(legs: any[], type: string = 'standard', stake: number = 100, sport: any = 'nba') {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        id: `parlay-${Date.now()}`,
        legs,
        type,
        stake,
        sport: sportStr,
        potentialPayout: stake * 2.5,
      },
    };
  }

  async getSameGameParlays(sport: any = 'nba', gameId?: string) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        parlays: [
          {
            id: 'sgp-1',
            game: 'Team A vs Team B',
            legs: [],
            odds: +300,
          },
        ],
      },
    };
  }

  async getTeaserOdds(sport: any = 'nfl', points: number = 6, legs: number = 2) {
    const sportStr = typeof sport === 'string' ? sport : 'nfl';
    return {
      success: true,
      data: {
        odds: -110,
        legs,
        points,
        sport: sportStr,
      },
    };
  }

  async calculateRoundRobin(legs: any[], combinationSize: string = '2s', stakePerParlay: number = 10) {
    return {
      success: true,
      data: {
        combinations: 3,
        totalStake: stakePerParlay * 3,
        parlays: [],
      },
    };
  }

  async submitParlay(parlay: any) {
    return {
      success: true,
      data: {
        id: `submitted-${Date.now()}`,
        status: 'pending',
      },
    };
  }

  async getParlayHistory(sport?: any) {
    return {
      success: true,
      data: {
        history: [],
      },
    };
  }

  async getNHLParlays(limit: number = 3) {
    return {
      success: true,
      data: {
        parlays: Array(limit).fill(0).map((_, i) => ({
          id: `nhl-parlay-${i}`,
          title: `NHL Parlay ${i+1}`,
        })),
      },
    };
  }

  // ========== FANTASY HUB ENDPOINTS (mock) ==========

  async getFantasyHubDashboard() {
    return {
      success: true,
      data: {
        featured: [],
        contests: [],
      },
    };
  }

  async getFeaturedPlayers(sport: any = 'nba', limit: number = 20) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        players: Array(limit).fill(0).map((_, i) => ({
          id: i,
          name: `Player ${i+1}`,
          sport: sportStr.toUpperCase(),
        })),
      },
    };
  }

  async getContests(sport: any = 'nba', contestType: string = 'gpp') {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        contests: [],
      },
    };
  }

  async getNHLProps(date?: string) {
    return {
      success: true,
      data: {
        props: [],
      },
    };
  }

  // ========== SPORTS WIRE & BEAT WRITER ENDPOINTS (mock) ==========

  async getSportsWire(sport: any) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        articles: [],
      },
    };
  }

  async getEnhancedSportsWire(sport: any, includeBeatWriters = true, includeInjuries = true) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        articles: [],
        beatWriters: [],
        injuries: [],
      },
    };
  }

  async getBeatWriters(sport: any, team?: string) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        writers: [],
      },
    };
  }

  async getBeatWriterNews(sport: any, team?: string, hours = 24) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        news: [],
      },
    };
  }

  // ========== INJURY ENDPOINTS (mock) ==========

  async getInjuries(sport: any, team?: string, status?: string) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        injuries: [],
      },
    };
  }

  async getInjuryDashboard(sport: any) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        dashboard: {},
      },
    };
  }

  // ========== TEAM ENDPOINTS (mock) ==========

  async getTeamNews(team: string, sport: any) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        news: [],
      },
    };
  }

  // ========== SEARCH ENDPOINTS (mock) ==========

  async searchAllTeams(query: string, sport: any) {
    const sportStr = typeof sport === 'string' ? sport : 'nba';
    return {
      success: true,
      data: {
        teams: [],
      },
    };
  }

  // ========== SEASON STATUS ENDPOINTS (mock) ==========

  async getSeasonStatus2026() {
    return {
      success: true,
      data: {
        status: 'active',
      },
    };
  }

  async getApiInfo() {
    return {
      success: true,
      data: {
        version: '1.0',
      },
    };
  }

  async getDebugLoadStatus() {
    return {
      success: true,
      data: {
        status: 'ok',
      },
    };
  }
}

// ========== SINGLETON EXPORT ==========

export const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
});

export default apiClient;
