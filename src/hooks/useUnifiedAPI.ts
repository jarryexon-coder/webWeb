// src/hooks/useUnifiedAPI.ts - UPDATED TO USE PYTHON BACKEND
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosResponse, AxiosError } from 'axios';

// ... [keep your PerformanceTracker and API_LOGGER code] ...

// ========== BACKEND CONFIGURATION ==========
// Get backend URLs from environment variables
const NBA_BACKEND_URL = import.meta.env.VITE_API_BASE_NBA_BACKEND || 
  'https://pleasing-determination-production.up.railway.app';
const PYTHON_BACKEND_URL = import.meta.env.VITE_API_BASE_PYTHON || 
  'https://python-api-fresh-production.up.railway.app';

// Configuration from environment
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND || 'python'; // DEFAULT TO 'python'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
const ENABLE_CACHE = import.meta.env.VITE_ENABLE_CACHE !== 'false';

// ========== CACHE AND PERFORMANCE TRACKER ==========
const apiCache = new Map();
const performanceTracker = { 
  logFetch: () => {}, 
  getAverageDuration: () => 0, 
  getSuccessRate: () => 1, 
  metrics: {} 
};
const API_LOGGER = { 
  logCall: () => {}, 
  getStats: () => [] 
};

const getCacheKey = (endpoint: string, params: any) => 
  `${endpoint}:${JSON.stringify(params || {})}`;

const isCacheValid = (cached: any) => 
  cached && cached.expires && Date.now() < cached.expires;

// ========== BACKEND SELECTION LOGIC ==========
const getBackendForEndpoint = (endpoint: string): string => {
  const pythonBackendEndpoints = [
    '/api/players',
    '/api/fantasy/teams',
    '/api/fantasy/players',
    '/api/health',
    '/api/info',
    '/api/news',
    '/api/analytics',
    '/api/debug',
    '/api/odds/games',
    '/api/prizepicks/selections',
    '/api/daily-picks',
    '/api/player-trends',
    '/api/advanced-analytics',
    '/api/parlay-suggestions',
    '/api/sports-wire'
  ];
  
  const nbaBackendEndpoints = [
    '/api/nba/games',
    '/api/nba/stats'
  ];
  
  if (pythonBackendEndpoints.some(e => endpoint.includes(e))) {
    console.log(`🎯 Using Python backend for: ${endpoint}`);
    return PYTHON_BACKEND_URL;
  }
  
  if (nbaBackendEndpoints.some(e => endpoint.includes(e))) {
    console.log(`🏀 Using NBA backend for: ${endpoint}`);
    return NBA_BACKEND_URL;
  }
  
  console.log(`⚡ Defaulting to Python backend for: ${endpoint}`);
  return PYTHON_BACKEND_URL;
};

// ========== HEALTH CHECK FUNCTION ==========
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

// ========== DIRECT FETCH FUNCTION ==========
const fetchDirectly = async <T>(
  endpoint: string, 
  options?: any
): Promise<T> => {
  const backendUrl = getBackendForEndpoint(endpoint);
  
  try {
    const response = await axios({
      url: `${backendUrl}${endpoint}`,
      method: options?.method || 'GET',
      params: options?.params,
      data: options?.data,
      timeout: options?.timeout || API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error(`❌ API Error (${endpoint}):`, error.message);
    throw error;
  }
};

// src/hooks/useUnifiedAPI.ts - UPDATED TO RETURN REACT QUERY RESULT SHAPE

// ... keep all the imports and utility functions (getBackendForEndpoint, checkBackendHealth, etc.) the same ...

// ========== ODDS GAMES HOOK ==========
export const useOddsGames = (sport?: string) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [backendHealth, setBackendHealth] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const checkBackends = async () => {
      console.log('🔍 Checking backend health...');
      
      const healthChecks = await Promise.allSettled([
        checkBackendHealth(PYTHON_BACKEND_URL),
        checkBackendHealth(NBA_BACKEND_URL)
      ]);
      
      const health = {
        python: healthChecks[0].status === 'fulfilled' && (healthChecks[0] as PromiseFulfilledResult<boolean>).value,
        nba: healthChecks[1].status === 'fulfilled' && (healthChecks[1] as PromiseFulfilledResult<boolean>).value
      };
      
      setBackendHealth(health);
      setIsInitialized(true);
      
      console.log('✅ Backend Health Status:', health);
    };
    
    checkBackends();
  }, []);
  
  const fetchAPI = useCallback(async <T>(
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      params?: any;
      data?: any;
      timeout?: number;
      useCache?: boolean;
    } = {}
  ): Promise<T> => {
    const cacheKey = getCacheKey(endpoint, options.params);
    const useCache = options.useCache ?? ENABLE_CACHE;
    
    if (useCache && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey)!;
      if (isCacheValid(cached)) {
        console.log(`💾 Cache hit for ${endpoint}`);
        return cached.data;
      } else {
        apiCache.delete(cacheKey);
      }
    }
    
    try {
      const backendUrl = getBackendForEndpoint(endpoint);
      
      console.log(`🌐 Fetching: ${backendUrl}${endpoint}`, options.params || '');
      
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (useCache && (!options.method || options.method === 'GET') && response.data) {
        apiCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
          expires: Date.now() + (5 * 60 * 1000)
        });
      }
      
      return response.data;
      
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw error;
    }
  }, []);

  const query = useQuery({
    queryKey: ['oddsGames', sport],
    queryFn: () => fetchAPI('/api/odds/games', {
      params: sport ? { sport } : undefined,
      useCache: true
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: isInitialized
  });

  // Return the React Query result plus extra info
  return {
    ...query,
    isInitialized,
    backendHealth
  };
};

// ========== PLAYER TRENDS HOOK ==========
export const usePlayerTrends = (sport?: string, playerId?: string) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  const fetchAPI = useCallback(async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    const backendUrl = getBackendForEndpoint(endpoint);
    
    try {
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, error.message);
      throw error;
    }
  }, []);

  const query = useQuery({
    queryKey: ['playerTrends', sport, playerId],
    queryFn: () => fetchAPI('/api/player-trends', {
      params: { 
        sport: sport || 'nba',
        playerId: playerId
      },
      useCache: true
    }),
    staleTime: 10 * 60 * 1000,
    enabled: isInitialized && !!playerId // only fetch if playerId provided
  });

  return {
    ...query,
    isInitialized
  };
};

// ========== ADVANCED ANALYTICS HOOK ==========
export const useAdvancedAnalytics = (sport?: string, metric?: string) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  const fetchAPI = useCallback(async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    const backendUrl = getBackendForEndpoint(endpoint);
    
    try {
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, error.message);
      throw error;
    }
  }, []);

  const query = useQuery({
    queryKey: ['advancedAnalytics', sport, metric],
    queryFn: () => fetchAPI('/api/advanced-analytics', {
      params: { 
        sport: sport || 'nba',
        metric: metric || 'all'
      },
      useCache: true
    }),
    staleTime: 10 * 60 * 1000,
    enabled: isInitialized
  });

  return {
    ...query,
    isInitialized
  };
};

// ========== PARLAY SUGGESTIONS HOOK ==========
// ========== PARLAY SUGGESTIONS HOOK ==========
export const useParlaySuggestions = (sport?: string, riskLevel?: string) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const fetchAPI = useCallback(async <T>(
    endpoint: string,
    options: any = {}
  ): Promise<T> => {
    const backendUrl = getBackendForEndpoint(endpoint);

    try {
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, error.message);
      throw error;
    }
  }, []);

  const query = useQuery({
    queryKey: ['parlaySuggestions', sport, riskLevel],
    queryFn: () => fetchAPI('/api/parlay-suggestions', {
      params: {
        sport: sport || 'nba',
        riskLevel: riskLevel || 'medium'
      },
      useCache: true
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: (failureCount, error: any) => {
      // For 429 (rate limit), retry up to 2 times with backoff
      if (error?.response?.status === 429) {
        return failureCount < 2;
      }
      // For other errors, retry once
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, ...
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
    enabled: isInitialized,
    // Optional: placeholder data to avoid loading states
    placeholderData: { suggestions: [], count: 0, success: true } as any,
  });

  return {
    ...query,
    isInitialized
  };
};

// ========== FANTASY PLAYERS HOOK ==========
export const useFantasyPlayers = (sport: string = 'nba', endpoint: string = 'players') => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // In a real app you might check backend health here; for simplicity we mark as ready
    setIsInitialized(true);
  }, []);

  const fetchAPI = useCallback(async <T>(
    urlEndpoint: string,
    options: any = {}
  ): Promise<T> => {
    const backendUrl = getBackendForEndpoint(urlEndpoint);

    try {
      const response = await axios({
        url: `${backendUrl}${urlEndpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${urlEndpoint}):`, error.message);
      throw error;
    }
  }, []);

  const apiPath = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  return useQuery({
    queryKey: ['fantasyPlayers', sport, endpoint],
    queryFn: () => fetchAPI(apiPath, { params: { sport } }),
    staleTime: 60 * 1000, // 1 minute
    enabled: isInitialized
  });
};

// ========== PRIZEPICKS SELECTIONS HOOK ==========
export const usePrizepicksSelections = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  const fetchAPI = useCallback(async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    const backendUrl = getBackendForEndpoint(endpoint);
    
    try {
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, error.message);
      throw error;
    }
  }, []);
  
  const fetchPrizepicksSelections = useCallback(async (sport?: string, date?: string) => {
    try {
      return await fetchAPI('/api/prizepicks/selections', {
        params: { 
          sport: sport || 'nba',
          date: date || new Date().toISOString().split('T')[0]
        },
        useCache: true
      });
    } catch (error) {
      console.error('Error fetching PrizePicks selections:', error);
      return [];
    }
  }, [fetchAPI]);
  
  const usePrizepicksSelectionsQuery = (sport?: string, date?: string) => {
    return useQuery({
      queryKey: ['prizepicksSelections', sport, date],
      queryFn: () => fetchPrizepicksSelections(sport, date),
      staleTime: 15 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      enabled: isInitialized
    });
  };
  
  return {
    fetchPrizepicksSelections,
    usePrizepicksSelectionsQuery,
    isInitialized
  };
};

// ========== DAILY PICKS HOOK ==========
export const useDailyPicks = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  const fetchAPI = useCallback(async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    const backendUrl = getBackendForEndpoint(endpoint);
    
    try {
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, error.message);
      throw error;
    }
  }, []);
  
  const fetchDailyPicks = useCallback(async (sport?: string, date?: string) => {
    try {
      return await fetchAPI('/api/daily-picks', {
        params: { 
          sport: sport || 'nba',
          date: date || new Date().toISOString().split('T')[0]
        },
        useCache: true
      });
    } catch (error) {
      console.error('Error fetching daily picks:', error);
      return [];
    }
  }, [fetchAPI]);
  
  const useDailyPicksQuery = (sport?: string, date?: string) => {
    return useQuery({
      queryKey: ['dailyPicks', sport, date],
      queryFn: () => fetchDailyPicks(sport, date),
      staleTime: 30 * 60 * 1000,
      enabled: isInitialized
    });
  };
  
  return {
    fetchDailyPicks,
    useDailyPicksQuery,
    isInitialized
  };
};

// ========== SPORTS WIRE HOOK ==========
export const useSportsWire = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  const fetchAPI = useCallback(async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    const backendUrl = getBackendForEndpoint(endpoint);
    
    try {
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, error.message);
      throw error;
    }
  }, []);
  
  const fetchSportsWire = useCallback(async (sport?: string, limit?: number) => {
    try {
      return await fetchAPI('/api/sports-wire', {
        params: { 
          sport: sport || 'nba',
          limit: limit || 20
        },
        useCache: true
      });
    } catch (error) {
      console.error('Error fetching sports wire:', error);
      return [];
    }
  }, [fetchAPI]);
  
  const useSportsWireQuery = (sport?: string, limit?: number) => {
    return useQuery({
      queryKey: ['sportsWire', sport, limit],
      queryFn: () => fetchSportsWire(sport, limit),
      staleTime: 2 * 60 * 1000,
      enabled: isInitialized
    });
  };
  
  return {
    fetchSportsWire,
    useSportsWireQuery,
    isInitialized
  };
};

// ========== MAIN API FUNCTION ==========
export const useAPI = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [backendHealth, setBackendHealth] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const checkBackends = async () => {
      console.log('🔍 Checking backend health...');
      
      const healthChecks = await Promise.allSettled([
        checkBackendHealth(PYTHON_BACKEND_URL),
        checkBackendHealth(NBA_BACKEND_URL)
      ]);
      
      const health = {
        python: healthChecks[0].status === 'fulfilled' && (healthChecks[0] as PromiseFulfilledResult<boolean>).value,
        nba: healthChecks[1].status === 'fulfilled' && (healthChecks[1] as PromiseFulfilledResult<boolean>).value
      };
      
      setBackendHealth(health);
      setIsInitialized(true);
      
      console.log('✅ Backend Health Status:', health);
    };
    
    checkBackends();
  }, []);
  
  const fetchAPI = useCallback(async <T>(
    endpoint: string, 
    options: any = {}
  ): Promise<T> => {
    const cacheKey = getCacheKey(endpoint, options.params);
    const useCache = options.useCache ?? ENABLE_CACHE;
    
    if (useCache && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey)!;
      if (isCacheValid(cached)) {
        console.log(`💾 Cache hit for ${endpoint}`);
        return cached.data;
      } else {
        apiCache.delete(cacheKey);
      }
    }
    
    try {
      const backendUrl = getBackendForEndpoint(endpoint);
      
      console.log(`🌐 Fetching: ${backendUrl}${endpoint}`, options.params || '');
      
      const response = await axios({
        url: `${backendUrl}${endpoint}`,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        timeout: options.timeout || API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (useCache && (!options.method || options.method === 'GET') && response.data) {
        apiCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
          expires: Date.now() + (5 * 60 * 1000)
        });
      }
      
      return response.data;
      
    } catch (error: any) {
      console.error(`❌ API Error (${endpoint}):`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw error;
    }
  }, []);
  
  const useFantasyPlayers = (sport: string = 'nba', limit: number = 50) => {
    return useQuery({
      queryKey: ['fantasyPlayers', sport, limit],
      queryFn: () => fetchAPI('/api/players', {
        params: { sport, limit },
        useCache: true
      }),
      staleTime: 60 * 1000,
      enabled: isInitialized
    });
  };
  
  const useFantasyTeams = (sport: string = 'nba') => {
    return useQuery({
      queryKey: ['fantasyTeams', sport],
      queryFn: () => fetchAPI('/api/fantasy/teams', {
        params: { sport },
        useCache: true
      }),
      staleTime: 60 * 1000,
      enabled: isInitialized
    });
  };
  
  const useAPIHealth = () => {
    return useQuery({
      queryKey: ['apiHealth'],
      queryFn: () => fetchAPI('/api/health'),
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
      enabled: isInitialized
    });
  };
  
  const useSportsNews = (sport: string = 'nba', limit: number = 10) => {
    return useQuery({
      queryKey: ['sportsNews', sport, limit],
      queryFn: () => fetchAPI('/api/news', {
        params: { sport, limit },
        useCache: true
      }),
      staleTime: 5 * 60 * 1000,
      enabled: isInitialized
    });
  };
  
  return {
    fetchAPI,
    isInitialized,
    backendHealth,
    performanceStats: {
      averageDuration: performanceTracker.getAverageDuration(),
      successRate: performanceTracker.getSuccessRate(),
      recentCalls: API_LOGGER.getStats()
    },
    useFantasyPlayers,
    useFantasyTeams,
    useAPIHealth,
    useSportsNews,
    clearCache: () => apiCache.clear(),
    getCacheSize: () => apiCache.size,
    getPerformanceMetrics: () => performanceTracker.metrics
  };
};

// Export singleton instance for direct use
export const api = {
  fetch: async <T>(endpoint: string, options?: any): Promise<T> => {
    return fetchDirectly<T>(endpoint, options);
  }
};

// Re-export specific hooks with alternative names for compatibility
export const usePlayerProps = usePlayerTrends;
export const useAnalytics = useAdvancedAnalytics;
