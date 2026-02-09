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

// Generate fallback data - NOW ASYNC!
  return await generateFallbackData(endpoint, params);
  }
};

// ========== API PERFORMANCE & DEBUG FUNCTIONS ==========
export const getApiPerformance = () => {
  return {
    averageResponseTime: performanceTracker.getAverageDuration(),
    successRate: performanceTracker.getSuccessRate(),
    totalRequests: performanceTracker.metrics.length,
    cacheSize: apiCache.size
  };
};

export const clearApiCache = (): void => {
  apiCache.clear();
  console.log('🧹 API cache cleared');
};

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

// Get API logger stats
export const getApiLoggerStats = () => {
  return API_LOGGER.getStats();
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

// ========== FALLBACK DATA GENERATOR ==========
const generateFallbackData = async (endpoint: string, params?: any) => {
  const sport = params?.sport || 'nba';
  
  if (endpoint.includes('/api/picks')) {
    const { generateMockDailyPicks } = await import('./mockData');
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
    const { generateMockParlaySuggestions } = await import('./mockData');
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
    const { generateMockGames } = await import('./mockData');
    return {
      success: true,
      games: generateMockGames(sport),
      count: 5,
      timestamp: new Date().toISOString(),
      source: 'mock',
      message: 'Using mock data - API unavailable'
    };
  } else if (endpoint.includes('/api/prizepicks/selections')) {
    const { generateMockPrizepicksSelections } = await import('./mockData');
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
    const { generateMockPlayerTrends } = await import('./mockData');
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
        return await generateFallbackFantasyPlayers(sport);
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
        return await generateFallbackFantasyTeams(sport);
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
const generateFallbackFantasyPlayers = async (sport: string) => {
  const { generateFallbackFantasyPlayers } = await import('./mockData');
  return generateFallbackFantasyPlayers(sport);
};

const generateFallbackFantasyTeams = async (sport: string) => {
  const { generateFallbackFantasyTeams } = await import('./mockData');
  return generateFallbackFantasyTeams(sport);
};

// ========== SPORTS WIRE HOOK ==========
// Hook for fetching sports news
export const useSportsWire = (sport: 'nba' | 'nfl' | 'mlb' | string, options: any = {}) => {
  return useQuery({
    queryKey: ['sportsWire', sport],
    queryFn: async () => {
      console.log(`📰 Query function: Fetching sports wire news for ${sport}...`);
      
      try {
        // First try: Python backend news endpoint
        const result = await fetchFromUnifiedAPI('/api/news', { 
          sport 
        }, {
          useCache: true,
          cacheDuration: 60000 // 1 minute cache for news
        });
        
        // If successful, return the data
        if (result.success && result.news && Array.isArray(result.news)) {
          console.log(`✅ Got ${result.news.length} news items from ${result.source || 'API'}`);
          return {
            news: result.news,
            count: result.count || result.news.length,
            source: result.source || 'api',
            success: true,
            timestamp: result.timestamp || new Date().toISOString(),
            sport: sport,
            is_real_data: result.is_real_data || true
          };
        }
        
        // If no news array, try to parse data differently
        if (result.data && Array.isArray(result.data)) {
          console.log(`✅ Got ${result.data.length} news items from data array`);
          return {
            news: result.data,
            count: result.data.length,
            source: result.source || 'api',
            success: true,
            timestamp: result.timestamp || new Date().toISOString(),
            sport: sport,
            is_real_data: true
          };
        }
        
        // Fallback to mock data
        console.warn('⚠️ Invalid news response format, using mock data');
        return await generateMockSportsWireNews(sport);
        
      } catch (error: any) {
        console.error('❌ Sports wire API error:', error.message);
        // Return fallback data
        return await generateMockSportsWireNews(sport);
      }
    },
    ...options,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Generate mock sports wire news data
const generateMockSportsWireNews = async (sport: string) => {
  const { generateMockSportsWireNews } = await import('./mockData');
  return generateMockSportsWireNews(sport);
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
        const { generateMockDailyPicks } = await import('./mockData');
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
        const { generateMockAnalytics } = await import('./mockData');
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
