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

// Determine which backend to use (compatibility)
// Force single backend to use Python
const USE_SINGLE_BACKEND = true; // Force single backend

console.log('🔧 Backend Configuration:', {
  USE_SINGLE_BACKEND,
  NBA_BACKEND_URL,
  PYTHON_BACKEND_URL,
  USE_BACKEND,
  API_TIMEOUT,
  ENABLE_CACHE
});

// ========== BACKEND SELECTION LOGIC ==========
// Helper function to determine which backend to use for each endpoint
const getBackendForEndpoint = (endpoint: string): string => {
  // ALWAYS use Python backend for FantasyHub endpoints
  const pythonBackendEndpoints = [
    '/api/players',
    '/api/fantasy/teams',
    '/api/fantasy/players',
    '/api/health',
    '/api/info',
    '/api/news',
    '/api/analytics',
    '/api/debug'
  ];
  
  const nbaBackendEndpoints = [
    // Only keep NBA-specific endpoints if needed
    '/api/nba/games',
    '/api/nba/stats'
  ];
  
  // Check if endpoint matches Python backend
  if (pythonBackendEndpoints.some(e => endpoint.includes(e))) {
    console.log(`🎯 Using Python backend for: ${endpoint}`);
    return PYTHON_BACKEND_URL;
  }
  
  // Check if endpoint matches NBA backend
  if (nbaBackendEndpoints.some(e => endpoint.includes(e))) {
    console.log(`🏀 Using NBA backend for: ${endpoint}`);
    return NBA_BACKEND_URL;
  }
  
  // DEFAULT: Use Python backend for everything else
  console.log(`⚡ Defaulting to Python backend for: ${endpoint}`);
  return PYTHON_BACKEND_URL;
};

// ========== MAIN API FUNCTION ==========
export const useAPI = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [backendHealth, setBackendHealth] = useState<Record<string, boolean>>({});
  
  // Check backend health on initialization
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
  
  // Enhanced fetch function
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
    const startTime = performance.now();
    const cacheKey = getCacheKey(endpoint, options.params);
    const useCache = options.useCache ?? ENABLE_CACHE;
    
    // Check cache first
    if (useCache && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey)!;
      if (isCacheValid(cached)) {
        const duration = performance.now() - startTime;
        performanceTracker.logFetch(endpoint, duration, true, true);
        API_LOGGER.logCall(endpoint, true);
        console.log(`💾 Cache hit for ${endpoint}`);
        return cached.data;
      } else {
        apiCache.delete(cacheKey);
      }
    }
    
    try {
      // Determine which backend to use
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
      
      const duration = performance.now() - startTime;
      performanceTracker.logFetch(endpoint, duration, true, false);
      API_LOGGER.logCall(endpoint, true);
      
      // Cache successful responses (GET only)
      if (useCache && (!options.method || options.method === 'GET') && response.data) {
        apiCache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
          expires: Date.now() + (5 * 60 * 1000) // 5 minutes cache
        });
      }
      
      return response.data;
      
    } catch (error: any) {
      const duration = performance.now() - startTime;
      performanceTracker.logFetch(endpoint, duration, false, false);
      API_LOGGER.logCall(endpoint, false);
      
      console.error(`❌ API Error (${endpoint}):`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw error;
    }
  }, []);
  
  // ========== SPECIFIC API HOOKS ==========
  // Fantasy Players
  const useFantasyPlayers = (sport: string = 'nba', limit: number = 50) => {
    return useQuery({
      queryKey: ['fantasyPlayers', sport, limit],
      queryFn: () => fetchAPI('/api/players', {
        params: { sport, limit },
        useCache: true
      }),
      staleTime: 60 * 1000, // 1 minute
      enabled: isInitialized
    });
  };
  
  // Fantasy Teams
  const useFantasyTeams = (sport: string = 'nba') => {
    return useQuery({
      queryKey: ['fantasyTeams', sport],
      queryFn: () => fetchAPI('/api/fantasy/teams', {
        params: { sport },
        useCache: true
      }),
      staleTime: 60 * 1000, // 1 minute
      enabled: isInitialized
    });
  };
  
  // Health check
  const useAPIHealth = () => {
    return useQuery({
      queryKey: ['apiHealth'],
      queryFn: () => fetchAPI('/api/health'),
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Check every minute
      enabled: isInitialized
    });
  };
  
  // News
  const useSportsNews = (sport: string = 'nba', limit: number = 10) => {
    return useQuery({
      queryKey: ['sportsNews', sport, limit],
      queryFn: () => fetchAPI('/api/news', {
        params: { sport, limit },
        useCache: true
      }),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: isInitialized
    });
  };
  
  return {
    // Core function
    fetchAPI,
    
    // State
    isInitialized,
    backendHealth,
    
    // Performance stats
    performanceStats: {
      averageDuration: performanceTracker.getAverageDuration(),
      successRate: performanceTracker.getSuccessRate(),
      recentCalls: API_LOGGER.getStats()
    },
    
    // Specific hooks
    useFantasyPlayers,
    useFantasyTeams,
    useAPIHealth,
    useSportsNews,
    
    // Utility functions
    clearCache: () => apiCache.clear(),
    getCacheSize: () => apiCache.size,
    getPerformanceMetrics: () => performanceTracker.metrics
  };
};

// Export singleton instance for direct use
export const api = {
  fetch: async <T>(endpoint: string, options?: any): Promise<T> => {
    const { fetchAPI } = useAPI();
    return fetchAPI(endpoint, options);
  }
};

// Keep existing checkBackendHealth function
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
