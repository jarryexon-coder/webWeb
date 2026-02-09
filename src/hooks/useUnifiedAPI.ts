// src/hooks/useUnifiedAPI.ts - Unified API hook for dual backend support
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { rateLimit } from '@tanstack/pacer';

// ========== PERFORMANCE TRACKER ==========
interface PerformanceMetric {
  endpoint: string;
  duration: number;
  success: boolean;
  timestamp: number;
  cached: boolean;
}

class PerformanceTracker {
  metrics: PerformanceMetric[] = [];
  
  logFetch(endpoint: string, duration: number, success: boolean, cached: boolean = false) {
    this.metrics.push({
      endpoint,
      duration,
      success,
      timestamp: Date.now(),
      cached
    });
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }
  
  getAverageDuration(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / this.metrics.length;
  }
  
  getSuccessRate(): number {
    if (this.metrics.length === 0) return 0;
    const successful = this.metrics.filter(m => m.success).length;
    return successful / this.metrics.length;
  }
}

// Performance tracker instance
const performanceTracker = new PerformanceTracker();

// ========== API LOGGER FOR DEBUGGING ==========
const API_LOGGER = {
  calls: [] as Array<{time: string; endpoint: string; success: boolean}>,
  
  logCall: (endpoint: string, success: boolean) => {
    const log = {
      time: new Date().toLocaleTimeString(),
      endpoint,
      success
    };
    
    API_LOGGER.calls.push(log);
    
    // Keep only last 50 calls
    if (API_LOGGER.calls.length > 50) {
      API_LOGGER.calls.shift();
    }
    
    console.log(`🌐 [${log.time}] ${success ? '✅' : '❌'} ${endpoint}`);
    
    // Log summary every 10 calls
    if (API_LOGGER.calls.length % 10 === 0) {
      console.log('📈 API Call Summary:', {
        totalCalls: API_LOGGER.calls.length,
        successfulCalls: API_LOGGER.calls.filter(c => c.success).length,
        last5Calls: API_LOGGER.calls.slice(-5)
      });
    }
  },
  
  getStats: () => {
    const lastMinuteCalls = API_LOGGER.calls.filter(c => 
      Date.now() - new Date(c.time).getTime() < 60000
    );
    
    return {
      totalCalls: API_LOGGER.calls.length,
      lastMinuteCalls: lastMinuteCalls.length,
      successRate: API_LOGGER.calls.filter(c => c.success).length / API_LOGGER.calls.length * 100
    };
  }
};

// ========== RATE LIMITING VARIABLES ==========
let fantasyPlayersLastFetchTime = 0;
let fantasyPlayersFetchCount = 0;
const FANTASY_PLAYERS_RATE_LIMIT_MS = 5000; // 5 seconds between calls
const FANTASY_PLAYERS_MAX_CALLS_PER_MINUTE = 30;

// ========== TANSTACK PACER RATE LIMITING ==========
// Create rate-limited fetch functions using @tanstack/pacer
const rateLimitedFetchPlayers = rateLimit(
  async (sport: string) => {
    console.log(`🏀 Rate-limited fetch for ${sport} players`);
    try {
      const backendUrl = await getBackendForEndpoint('/api/fantasy/players');
      const response = await fetch(`${backendUrl}/api/fantasy/players?sport=${sport}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Rate-limited fetch failed:', error);
      throw error;
    }
  },
  {
    limit: 15, // 15 requests per window
    window: 60 * 1000, // 1 minute window
    windowType: 'sliding', // More consistent than fixed
    onReject: (limiter) => {
      console.warn(`🚫 Rate limit hit. Next window in ${limiter.getMsUntilNextWindow()}ms`);
      // Return fallback data when rate limited
      return generateFallbackFantasyPlayers('nba');
    }
  }
);

const rateLimitedFetchTeams = rateLimit(
  async (sport: string) => {
    console.log(`🏆 Rate-limited fetch for ${sport} teams`);
    try {
      const backendUrl = await getBackendForEndpoint('/api/fantasy/teams');
      const response = await fetch(`${backendUrl}/api/fantasy/teams?sport=${sport}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Rate-limited fetch failed:', error);
      throw error;
    }
  },
  {
    limit: 10, // 10 requests per window
    window: 60 * 1000, // 1 minute window
    windowType: 'sliding',
    onReject: (limiter) => {
      console.warn(`🚫 Rate limit hit. Next window in ${limiter.getMsUntilNextWindow()}ms`);
      return generateFallbackFantasyTeams('nba');
    }
  }
);

// ========== BACKEND CONFIGURATION ==========
// Get backend URLs from environment variables
const NBA_BACKEND_URL = import.meta.env.VITE_API_BASE_NBA_BACKEND || 
  'https://pleasing-determination-production.up.railway.app';
const PYTHON_BACKEND_URL = import.meta.env.VITE_API_BASE_PYTHON || 
  'https://python-api-fresh-production.up.railway.app';

// Configuration from environment
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND || 'python'; // 'python', 'nba', or 'auto'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
const ENABLE_CACHE = import.meta.env.VITE_ENABLE_CACHE !== 'false';

// Determine which backend to use (compatibility)
const USE_SINGLE_BACKEND = import.meta.env.VITE_USE_SINGLE_BACKEND === 'true' || 
                          import.meta.env.REACT_APP_USE_SINGLE_BACKEND === 'true';

console.log('🔧 Backend Configuration:', {
  USE_SINGLE_BACKEND,
  NBA_BACKEND_URL,
  PYTHON_BACKEND_URL,
  USE_BACKEND,
  API_TIMEOUT,
  ENABLE_CACHE
});

// ========== CACHE IMPLEMENTATION ==========
interface CacheEntry {
  data: any;
  timestamp: number;
  expires: number;
}

const apiCache = new Map<string, CacheEntry>();

const getCacheKey = (endpoint: string, params?: any): string => {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${endpoint}:${paramsStr}`;
};

const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() < entry.expires;
};

// ========== BACKEND HEALTH CHECK ==========
const checkBackendHealth = async (backendUrl: string): Promise<boolean> => {
  try {
    const startTime = performance.now();
    const response = await axios.get(`${backendUrl}/api/health`, {
      timeout: 3000
    });
    const duration = performance.now() - startTime;
    
    console.log(`🏥 ${backendUrl}: ${response.status} (${duration.toFixed(0)}ms)`);
    return response.status === 200 && response.data?.status === 'healthy';
  } catch (error) {
    console.log(`❌ ${backendUrl}: Unavailable`);
    return false;
  }
};

// ========== BACKEND SELECTION LOGIC ==========
export const getBackendForEndpoint = async (endpoint: string): Promise<string> => {
  // Manual override
  if (USE_BACKEND === 'python') {
    console.log(`🎯 Using Python backend (manual): ${endpoint}`);
    return PYTHON_BACKEND_URL;
  }
  
  if (USE_BACKEND === 'nba') {
    console.log(`🎯 Using NBA backend (manual): ${endpoint}`);
    return NBA_BACKEND_URL;
  }
  
  // Auto-detection (check health)
  if (USE_BACKEND === 'auto') {
    try {
      const [pythonHealthy, nbaHealthy] = await Promise.all([
        checkBackendHealth(PYTHON_BACKEND_URL),
        checkBackendHealth(NBA_BACKEND_URL)
      ]);
      
      if (pythonHealthy) {
        console.log('✅ Python backend selected (health check passed)');
        return PYTHON_BACKEND_URL;
      }
      
      if (nbaHealthy) {
        console.log('⚠️ NBA backend selected (Python unavailable)');
        return NBA_BACKEND_URL;
      }
      
      console.log('❌ Both backends unavailable, defaulting to Python');
    } catch (error) {
      console.error('Error checking backend health:', error);
    }
  }
  
  // Default to Python
  return PYTHON_BACKEND_URL;
};

// ========== ENDPOINT MAPPING (for compatibility) ==========
const ENDPOINT_MAPPING: Record<string, string> = {
  // NBA Backend endpoints
  '/api/parlay/suggestions': NBA_BACKEND_URL,
  '/api/odds/games': NBA_BACKEND_URL,
  '/api/prizepicks/selections': NBA_BACKEND_URL,
  '/api/analytics': NBA_BACKEND_URL,
  '/api/players/trends': NBA_BACKEND_URL,
  '/api/predictions': NBA_BACKEND_URL,
  '/api/players': NBA_BACKEND_URL,
  
  // Send fantasy endpoints to Python backend
  '/api/fantasy/players': PYTHON_BACKEND_URL,
  '/api/fantasy/teams': PYTHON_BACKEND_URL,
  
  '/api/stats/database': NBA_BACKEND_URL,
  '/api/health': NBA_BACKEND_URL,
  
  // Python Backend endpoints
  '/api/picks': PYTHON_BACKEND_URL,
  '/api/scrape': PYTHON_BACKEND_URL,
  '/api/scraper': PYTHON_BACKEND_URL,
  '/api/deepseek/analyze': PYTHON_BACKEND_URL,
};

// Legacy function for compatibility
const getBackendForEndpointLegacy = (endpoint: string): string => {
  // If using single backend mode, always use NBA backend
  if (USE_SINGLE_BACKEND) {
    return NBA_BACKEND_URL;
  }
  
  // Check if endpoint has a specific mapping
  for (const [pattern, backend] of Object.entries(ENDPOINT_MAPPING)) {
    if (endpoint.startsWith(pattern)) {
      return backend;
    }
  }
  
  // Default to NBA backend
  return NBA_BACKEND_URL;
};

// ========== RATE LIMITING FUNCTION ==========
const checkRateLimit = (endpoint: string): boolean => {
  const now = Date.now();
  
  // Check time-based rate limiting
  if (now - fantasyPlayersLastFetchTime < FANTASY_PLAYERS_RATE_LIMIT_MS) {
    console.warn(`⏰ Rate limit hit for ${endpoint}. Too soon since last call.`);
    return false;
  }
  
  // Check call count limiting (reset every minute)
  if (fantasyPlayersFetchCount >= FANTASY_PLAYERS_MAX_CALLS_PER_MINUTE) {
    console.warn(`🚫 Rate limit hit for ${endpoint}. Max ${FANTASY_PLAYERS_MAX_CALLS_PER_MINUTE} calls per minute.`);
    return false;
  }
  
  fantasyPlayersLastFetchTime = now;
  fantasyPlayersFetchCount++;
  
  // Reset counter every minute
  setTimeout(() => {
    fantasyPlayersFetchCount = Math.max(0, fantasyPlayersFetchCount - 1);
  }, 60000);
  
  return true;
};

// ========== MAIN FETCH FUNCTION WITH PERFORMANCE TRACKING ==========
export const fetchFromUnifiedAPI = async (
  endpoint: string, 
  params?: any, 
  options?: {
    useCache?: boolean;
    cacheDuration?: number; // milliseconds
    forceRefresh?: boolean;
  }
): Promise<any> => {
  const startTime = performance.now();
  
  // Default options
  const opts = {
    useCache: ENABLE_CACHE && (options?.useCache ?? true),
    cacheDuration: options?.cacheDuration || 300000, // 5 minutes default
    forceRefresh: options?.forceRefresh || false
  };
  
  // Check cache first
  const cacheKey = getCacheKey(endpoint, params);
  
  if (opts.useCache && !opts.forceRefresh) {
    const cached = apiCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      const duration = performance.now() - startTime;
      performanceTracker.logFetch(endpoint, duration, true, true);
      console.log(`💾 Cache hit: ${endpoint} (${duration.toFixed(0)}ms)`);
      return cached.data;
    }
  }
  
  try {
    // Get backend URL using new logic
    const backendUrl = await getBackendForEndpoint(endpoint);
    const fullUrl = `${backendUrl}${endpoint}`;
    
    console.log(`🔍 [${new Date().toLocaleTimeString()}] Fetching from: ${fullUrl}`, params);
    
    // Make request
    const response: AxiosResponse = await axios.get(fullUrl, {
      params,
      timeout: API_TIMEOUT,
      headers: {
        'Cache-Control': 'no-cache',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const duration = performance.now() - startTime;
    const success = response.status >= 200 && response.status < 300;
    
    // Log performance
    performanceTracker.logFetch(endpoint, duration, success, false);
    API_LOGGER.logCall(endpoint, true);
    
    // Cache successful responses
    if (opts.useCache && success) {
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        expires: Date.now() + opts.cacheDuration
      });
    }
    
    if (success) {
      console.log(`✅ [${new Date().toLocaleTimeString()}] API Success for ${endpoint}:`, {
        success: response.data.success,
        count: response.data.count,
        source: backendUrl.includes('python') ? 'Python' : 'NBA',
        duration: `${duration.toFixed(0)}ms`
      });
      return response.data;
    } else {
      console.warn(`⚠️ [${new Date().toLocaleTimeString()}] ${endpoint}: ${response.status} (${duration.toFixed(0)}ms)`);
      return response.data;
    }
    
  } catch (error: any) {
    const duration = performance.now() - startTime;
    performanceTracker.logFetch(endpoint, duration, false, false);
    API_LOGGER.logCall(endpoint, false);
    
    console.error(`❌ [${new Date().toLocaleTimeString()}] API Error for ${endpoint}:`, error.message, `(${duration.toFixed(0)}ms)`);
    
    // Try to return cached data if available
    if (opts.useCache) {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        console.log(`🔄 Using cached data for ${endpoint}`);
        return cached.data;
      }
    }
    
    // Generate fallback data
    return generateFallbackData(endpoint, params);
  }
};

// Helper to clear cache
export const clearApiCache = (): void => {
  apiCache.clear();
  console.log('🧹 API cache cleared');
};

// Get performance statistics
export const getApiPerformance = () => {
  return {
    averageResponseTime: performanceTracker.getAverageDuration(),
    successRate: performanceTracker.getSuccessRate(),
    totalRequests: performanceTracker.metrics.length,
    cacheSize: apiCache.size
  };
};

// Get API logger stats
export const getApiLoggerStats = () => {
  return API_LOGGER.getStats();
};

// Optional: Export for debugging
export const debugApiState = () => {
  console.log('🔍 API State Debug:');
  console.log('- Backend URLs:', {
    python: PYTHON_BACKEND_URL,
    nba: NBA_BACKEND_URL,
    selected: USE_BACKEND
  });
  console.log('- Cache entries:', apiCache.size);
  console.log('- Performance:', getApiPerformance());
  console.log('- API Logger:', getApiLoggerStats());
  console.log('- Recent calls:', API_LOGGER.calls.slice(-5));
};

// ========== RATE-LIMITED FETCH FUNCTIONS ==========
// Export for direct use if needed
export const fetchFantasyPlayers = async (sport: string) => {
  console.log(`🎮 Fetching fantasy players for ${sport} (rate-limited)`);
  return rateLimitedFetchPlayers(sport);
};

export const fetchFantasyTeams = async (sport: string) => {
  console.log(`🏆 Fetching fantasy teams for ${sport} (rate-limited)`);
  return rateLimitedFetchTeams(sport);
};

export const fetchOdds = async (sport: string) => {
  console.log(`🎲 Fetching odds for ${sport}`);
  return fetchFromUnifiedAPI('/api/odds/games', { sport }, {
    useCache: true,
    cacheDuration: 120000 // 2 minute cache for odds
  });
};

export const fetchParlays = async () => {
  console.log(`🎯 Fetching parlay suggestions`);
  return fetchFromUnifiedAPI('/api/parlay/suggestions', {}, {
    useCache: true,
    cacheDuration: 180000 // 3 minute cache
  });
};

// ========== FALLBACK DATA GENERATORS ==========
const generateFallbackData = (endpoint: string, params?: any) => {
  const sport = params?.sport || 'nba';
  
  if (endpoint.includes('/api/picks')) {
    return {
      success: true,
      picks: generateMockDailyPicks(sport),
      count: 3,
      is_real_data: false,
      has_data: true,
      timestamp: new Date().toISOString(),
      message: 'Using mock data - API unavailable',
      source: 'mock_fallback'
    };
  } else if (endpoint.includes('/api/parlay/suggestions')) {
    return {
      success: true,
      suggestions: generateMockParlaySuggestions(sport, params?.limit || 4),
      count: 3,
      is_real_data: false,
      has_data: true,
      timestamp: new Date().toISOString(),
      message: 'Using mock data - API unavailable',
      source: 'mock_fallback'
    };
  } else if (endpoint.includes('/api/odds/games')) {
    return {
      success: true,
      games: generateMockGames(sport),
      count: 5,
      timestamp: new Date().toISOString(),
      source: 'mock',
      message: 'Using mock data - API unavailable'
    };
  } else if (endpoint.includes('/api/prizepicks/selections')) {
    return {
      success: true,
      selections: generateMockPrizepicksSelections(sport),
      count: 5,
      timestamp: new Date().toISOString(),
      source: 'mock',
      is_real_data: false,
      message: 'Using mock data - API unavailable'
    };
  } else if (endpoint.includes('/api/players/trends') || endpoint.includes('/api/player/stats/trends')) {
    return {
      success: true,
      trends: generateMockPlayerTrends(sport),
      count: 5,
      timestamp: new Date().toISOString(),
      source: 'mock',
      is_real_data: false,
      message: 'Using mock data - API unavailable'
    };
  } else if (endpoint.includes('/api/fantasy/players')) {
    return generateFallbackFantasyPlayers(sport);
  } else if (endpoint.includes('/api/fantasy/teams')) {
    return generateFallbackFantasyTeams(sport);
  }
  
  return {
    success: false,
    error: 'API unavailable',
    message: 'Endpoint not available',
    timestamp: new Date().toISOString()
  };
};

// ========== FANTASY PLAYERS HOOK WITH RATE LIMITING ==========
export const useFantasyPlayers = (sport: string, options: any = {}) => {
  return useQuery({
    queryKey: ['fantasyPlayers', sport],
    queryFn: async () => {
      console.log(`🎮 Query function: Fetching fantasy players for ${sport}...`);
      
      try {
        // Use the rate-limited fetch function
        const result = await fetchFantasyPlayers(sport);
        
        // Validate response has players
        if (!result.success || !result.players || !Array.isArray(result.players)) {
          console.warn('Invalid fantasy players response, using fallback');
          return generateFallbackFantasyPlayers(sport);
        }
        
        console.log(`✅ Got ${result.players.length} fantasy players`);
        return result;
        
      } catch (error: any) {
        console.error('❌ Fantasy players API error:', error.message);
        return generateFallbackFantasyPlayers(sport);
      }
    },
    ...options,
    // Add conservative defaults
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute (cacheTime is gcTime in v5)
    retry: 1,
    retryDelay: 5000, // 5 seconds between retries
  });
};

// ========== FANTASY TEAMS HOOK WITH RATE LIMITING ==========
export const useFantasyTeams = (sport: string, options: any = {}) => {
  return useQuery({
    queryKey: ['fantasyTeams', sport],
    queryFn: async () => {
      console.log(`🏆 Query function: Fetching fantasy teams for ${sport}...`);
      
      try {
        // Use the rate-limited fetch function
        const result = await fetchFantasyTeams(sport);
        
        if (!result.success || !result.teams || !Array.isArray(result.teams)) {
          console.warn('Invalid fantasy teams response, using fallback');
          return generateFallbackFantasyTeams(sport);
        }
        
        console.log(`✅ Got ${result.teams.length} fantasy teams`);
        return result;
        
      } catch (error: any) {
        console.error('❌ Fantasy teams API error:', error.message);
        return generateFallbackFantasyTeams(sport);
      }
    },
    ...options,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
};

// ========== FANTASY FALLBACK DATA GENERATORS ==========
const generateFallbackFantasyPlayers = (sport: string) => {
  console.log('🔄 Generating fallback fantasy players data');
  
  const players = [
    {
      id: '1',
      name: 'LeBron James',
      team: 'Los Angeles Lakers',
      position: 'SF',
      points: 25.3,
      rebounds: 7.9,
      assists: 7.5,
      steals: 1.2,
      blocks: 0.9,
      three_pointers: 2.1,
      fantasy_points: 45.2,
      fantasyScore: 45.2,
      projected_points: 48.5,
      projection: 48.5,
      salary: 10500,
      fanDuelSalary: 10500,
      draftKingsSalary: 9500,
      value: 4.31,
      valueScore: 4.31,
      ownership: 22.5,
      trend: 'up',
      projectedFantasyScore: 48.5,
      projections: {
        fantasy_points: 48.5,
        points: 28.5,
        rebounds: 8.2,
        assists: 8.5,
        value: 4.62,
        confidence: 0.75
      },
      stats: {
        points: 25.3,
        rebounds: 7.9,
        assists: 7.5,
        steals: 1.2,
        blocks: 0.9,
        three_pointers_made: 2.1,
        minutes: 35.5
      }
    },
    {
      id: '2',
      name: 'Stephen Curry',
      team: 'Golden State Warriors',
      position: 'PG',
      points: 29.4,
      rebounds: 5.5,
      assists: 6.3,
      steals: 1.2,
      blocks: 0.4,
      three_pointers: 5.1,
      fantasy_points: 52.8,
      fantasyScore: 52.8,
      projected_points: 55.2,
      projection: 55.2,
      salary: 11500,
      fanDuelSalary: 11500,
      draftKingsSalary: 10500,
      value: 4.59,
      valueScore: 4.59,
      ownership: 28.7,
      trend: 'stable',
      projectedFantasyScore: 55.2,
      projections: {
        fantasy_points: 55.2,
        points: 31.2,
        rebounds: 5.8,
        assists: 6.8,
        value: 4.80,
        confidence: 0.82
      },
      stats: {
        points: 29.4,
        rebounds: 5.5,
        assists: 6.3,
        steals: 1.2,
        blocks: 0.4,
        three_pointers_made: 5.1,
        minutes: 34.2
      }
    }
  ];
  
  return {
    success: true,
    count: players.length,
    playersCount: players.length,
    is_real_data: false,
    players: players,
    source: 'fallback_mock',
    timestamp: new Date().toISOString(),
    message: 'Using fallback fantasy players data'
  };
};

const generateFallbackFantasyTeams = (sport: string) => {
  console.log('🔄 Generating fallback fantasy teams data');
  
  const teams = [
    {
      id: '1',
      name: 'The Dynasty',
      owner: 'Mike Smith',
      sport: 'NBA',
      league: 'Premier League',
      record: '12-3-0',
      points: 1850,
      rank: 1,
      players: ['LeBron James', 'Stephen Curry', 'Nikola Jokic'],
      waiverPosition: 3,
      movesThisWeek: 2,
      lastUpdated: new Date().toISOString(),
      projectedPoints: 1920,
      winProbability: 0.78,
      strengthOfSchedule: 0.65
    }
  ];
  
  return {
    success: true,
    count: teams.length,
    teams: teams,
    is_real_data: false,
    source: 'fallback_mock',
    timestamp: new Date().toISOString(),
    message: 'Using fallback fantasy teams data'
  };
};

// ========== EXISTING HOOKS ==========
// Daily Picks hook using React Query
export const useDailyPicks = (sport = 'nba') => {
  return useQuery({
    queryKey: ['dailyPicks', sport],
    queryFn: async () => {
      console.log(`🎯 Query function: Fetching daily picks for ${sport}...`);
      
      try {
        const result = await fetchFromUnifiedAPI('/api/picks', { 
          sport 
        }, {
          useCache: true,
          cacheDuration: 300000 // 5 minute cache for picks
        });
        
        // Check if we got the documentation response instead of real data
        if (result.message && result.message.includes('API endpoint available')) {
          throw new Error('Received documentation response instead of picks data');
        }
        
        if (result.success && result.picks && Array.isArray(result.picks)) {
          return {
            picks: result.picks,
            count: result.count || 0,
            source: result.source || 'python-api-fresh',
            success: result.success,
            timestamp: result.timestamp || new Date().toISOString(),
            sport: result.sport || sport,
            is_real_data: result.is_real_data || false
          };
        }
        
        throw new Error('Invalid API response format');
      } catch (error: any) {
        console.error('Failed to fetch daily picks, using fallback:', error.message);
        // Return fallback data
        return {
          picks: generateMockDailyPicks(sport),
          count: 3,
          source: 'mock_fallback',
          success: true,
          timestamp: new Date().toISOString(),
          sport: sport,
          is_real_data: false,
          message: 'Using mock data - API unavailable'
        };
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: 2
  });
};

// Hook for parlay suggestions
export const useParlaySuggestions = (sport: string = 'all', limit: number = 4) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFromUnifiedAPI('/api/parlay/suggestions', { 
        sport: sport === 'all' ? 'all' : sport, 
        limit 
      }, {
        useCache: true,
        cacheDuration: 180000 // 3 minute cache
      });
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sport, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// Hook for odds games
export const useOddsGames = (sport: string = 'basketball_nba', region: string = 'us') => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFromUnifiedAPI('/api/odds/games', { 
        sport,
        region 
      }, {
        useCache: true,
        cacheDuration: 120000 // 2 minute cache for odds
      });
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sport, region]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// Hook for prizepicks selections
export const usePrizepicksSelections = (sport: string = 'nba') => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFromUnifiedAPI('/api/prizepicks/selections', { 
        sport 
      }, {
        useCache: true,
        cacheDuration: 180000 // 3 minute cache
      });
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// Hook for player trends - Added to fix import error
export const usePlayerTrends = (sport: string = 'nba') => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFromUnifiedAPI('/api/players/trends', { 
        sport 
      }, {
        useCache: true,
        cacheDuration: 240000 // 4 minute cache for trends
      });
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// Hook for advanced analytics
export const useAdvancedAnalytics = (sport: string = 'nba') => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try multiple analytics endpoints
      const endpoints = [
        `/api/analytics?sport=${sport}`,
        `/api/advanced/analytics?sport=${sport}`,
        `/api/match/analytics?sport=${sport}`
      ];
      
      let responseData = null;
      
      for (const endpoint of endpoints) {
        try {
          const result = await fetchFromUnifiedAPI(endpoint, {}, {
            useCache: true,
            cacheDuration: 300000 // 5 minute cache for analytics
          });
          if (result.success && (result.analytics || result.selections || result.data)) {
            responseData = result;
            break;
          }
        } catch (err) {
          console.log(`⚠️ Analytics endpoint ${endpoint} failed, trying next`);
        }
      }
      
      if (!responseData) {
        responseData = {
          success: true,
          is_real_data: false,
          analytics: generateMockAnalytics(sport),
          message: 'Using fallback analytics data'
        };
      }
      
      setData(responseData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
};

// ========== MOCK DATA GENERATORS ==========
const generateMockDailyPicks = (sport: string) => {
  const sportName = sport.toUpperCase();
  return [
    {
      id: 'pick-mock-1',
      sport: sportName,
      player: 'LeBron James',
      market: 'Points',
      line: 27.5,
      side: 'over',
      confidence: 85,
      odds: -140,
      edge: 9.3,
      projection: 29.8,
      game: 'Lakers vs Warriors',
      timestamp: new Date().toISOString(),
      analysis: 'Strong offensive matchup with high pace. LeBron averaging 30.2 PPG in last 5 games.',
      confidence_level: 'high',
      value_rating: 'A+',
      bookmaker: 'DraftKings',
      is_live: false,
      start_time: new Date(Date.now() + 7200000).toISOString()
    },
    {
      id: 'pick-mock-2',
      sport: sportName,
      player: 'Stephen Curry',
      market: 'Three Pointers Made',
      line: 4.5,
      side: 'over',
      confidence: 78,
      odds: -110,
      edge: 6.2,
      projection: 5.2,
      game: 'Warriors vs Lakers',
      timestamp: new Date().toISOString(),
      analysis: 'High volume 3PT shooter in favorable matchup. Averaging 5.3 threes last 3 games.',
      confidence_level: 'medium',
      value_rating: 'B+',
      bookmaker: 'FanDuel',
      is_live: false,
      start_time: new Date(Date.now() + 7200000).toISOString()
    },
    {
      id: 'pick-mock-3',
      sport: sportName,
      player: 'Nikola Jokic',
      market: 'Rebounds',
      line: 12.5,
      side: 'over',
      confidence: 82,
      odds: -120,
      edge: 7.8,
      projection: 14.2,
      game: 'Nuggets vs Celtics',
      timestamp: new Date().toISOString(),
      analysis: 'Dominant rebounder against smaller Celtics frontcourt. Averaging 13.8 rebounds last 5.',
      confidence_level: 'high',
      value_rating: 'A-',
      bookmaker: 'BetMGM',
      is_live: false,
      start_time: new Date(Date.now() + 10800000).toISOString()
    }
  ];
};

const generateMockParlaySuggestions = (sport: string, limit: number) => {
  const sports = sport === 'all' ? ['NBA', 'NFL', 'NHL'] : [sport.toUpperCase()];
  
  return sports.slice(0, limit).map((sportName, index) => ({
    id: `parlay-mock-${sport}-${index}`,
    name: `${sportName} Expert Parlay`,
    sport: sportName,
    type: 'moneyline',
    legs: [
      {
        id: `leg-mock-${index}-1`,
        game_id: `game-mock-${index}-1`,
        description: `${sportName} Leg 1 - Home Team ML`,
        odds: '-150',
        confidence: 78,
        sport: sportName,
        market: 'h2h',
        teams: { home: 'Home Team', away: 'Away Team' },
        confidence_level: 'high'
      },
      {
        id: `leg-mock-${index}-2`,
        game_id: `game-mock-${index}-2`,
        description: `${sportName} Leg 2 - Away Team +3.5`,
        odds: '-110',
        confidence: 72,
        sport: sportName,
        market: 'spreads',
        teams: { home: 'Home Team', away: 'Away Team' },
        confidence_level: 'medium'
      }
    ],
    total_odds: '+265',
    confidence: 75,
    confidence_level: 'high',
    analysis: `AI-generated ${sportName} parlay with strong value picks.`,
    expected_value: '+7.5%',
    risk_level: 'medium',
    timestamp: new Date().toISOString(),
    isToday: true,
    is_real_data: false,
    ai_metrics: {
      leg_count: 2,
      avg_leg_confidence: 75,
      recommended_stake: '$5.00'
    }
  }));
};

const generateMockGames = (sport: string = 'basketball_nba') => {
  if (sport.includes('basketball') || sport === 'nba') {
    return [
      {
        id: 'mock-nba-1',
        sport_key: 'basketball_nba',
        sport_title: 'NBA',
        commence_time: new Date(Date.now() + 7200000).toISOString(),
        home_team: 'Los Angeles Lakers',
        away_team: 'Golden State Warriors',
        bookmakers: [
          {
            key: 'draftkings',
            title: 'DraftKings',
            last_update: new Date().toISOString(),
            markets: [
              {
                key: 'h2h',
                last_update: new Date().toISOString(),
                outcomes: [
                  { name: 'Los Angeles Lakers', price: -150 },
                  { name: 'Golden State Warriors', price: +130 }
                ]
              }
            ]
          }
        ]
      }
    ];
  }
  
  return [
    {
      id: 'mock-game-1',
      sport_key: sport,
      sport_title: sport.toUpperCase(),
      commence_time: new Date(Date.now() + 7200000).toISOString(),
      home_team: 'Home Team',
      away_team: 'Away Team',
      bookmakers: [
        {
          key: 'draftkings',
          title: 'DraftKings',
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: 'Home Team', price: -150 },
                { name: 'Away Team', price: +130 }
              ]
            }
          ]
        }
      ]
    }
  ];
};

const generateMockPrizepicksSelections = (sport: string) => {
  return [
    {
      id: 'pp-mock-1',
      player: 'LeBron James',
      sport: sport.toUpperCase(),
      stat_type: 'Points',
      line: 27.5,
      projection: 29.8,
      projection_diff: 2.3,
      projection_edge: 0.093,
      value_side: 'over',
      over_price: -140,
      under_price: +120,
      game: 'Lakers vs Warriors',
      edge: 9.3,
      confidence: 85,
      timestamp: new Date().toISOString()
    }
  ];
};

const generateMockPlayerTrends = (sport: string) => {
  const sportName = sport.toUpperCase();
  
  if (sport === 'nba') {
    return [
      {
        id: 'trend-mock-1',
        player: 'LeBron James',
        team: 'Lakers',
        sport: sportName,
        trend: 'up',
        metric: 'Points',
        value: 28.5,
        change: '+2.1%',
        analysis: 'Scoring average increased over last 5 games due to higher usage rate',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
        games_analyzed: 5,
        last_5_avg: 30.2,
        season_avg: 25.8
      },
      {
        id: 'trend-mock-2',
        player: 'Stephen Curry',
        team: 'Warriors',
        sport: sportName,
        trend: 'up',
        metric: 'Three Pointers',
        value: 5.2,
        change: '+3.5%',
        analysis: 'Shooting efficiency improved with return of key teammates',
        confidence: 0.78,
        timestamp: new Date().toISOString(),
        games_analyzed: 5,
        last_5_avg: 5.8,
        season_avg: 4.9
      },
      {
        id: 'trend-mock-3',
        player: 'Nikola Jokic',
        team: 'Nuggets',
        sport: sportName,
        trend: 'up',
        metric: 'Assists',
        value: 9.8,
        change: '+1.8%',
        analysis: 'Playmaking role expanded with team injuries',
        confidence: 0.82,
        timestamp: new Date().toISOString(),
        games_analyzed: 5,
        last_5_avg: 11.2,
        season_avg: 9.1
      }
    ];
  }
  
  return [
    {
      id: 'trend-mock-1',
      player: 'Top Player',
      team: 'Team A',
      sport: sportName,
      trend: 'up',
      metric: 'Performance',
      value: 25.3,
      change: '+2.1%',
      analysis: 'Performance trending upward',
      confidence: 0.75,
      timestamp: new Date().toISOString()
    }
  ];
};

const generateMockAnalytics = (sport: string) => {
  return [
    {
      id: 'analytics-mock-1',
      title: 'Player Efficiency Analysis',
      sport: sport.toUpperCase(),
      metric: 'Player Efficiency Rating',
      value: 28.5,
      trend: 'up',
      insights: ['Top players showing increased efficiency', 'Defensive ratings declining'],
      timestamp: new Date().toISOString()
    },
    {
      id: 'analytics-mock-2',
      title: 'Team Performance Trends',
      sport: sport.toUpperCase(),
      metric: 'Win Probability',
      value: 0.68,
      trend: 'stable',
      insights: ['Home teams performing above expectations', 'Underdogs covering spreads'],
      timestamp: new Date().toISOString()
    }
  ];
};
