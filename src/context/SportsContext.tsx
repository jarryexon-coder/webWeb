// src/context/SportsContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { apiClient } from '../services/apiClient';
import {
  Player,
  Game,
  FantasyTeam,
  PrizePicksSelection,
  ParlaySuggestion,
  NewsItem,
  Analytics,
  Prediction,
  DailyPick,
  PlayerTrend,
  PredictionOutcome,
  BettingInsight,
  OddsGame,
  PlayerProp,
} from '../services/apiClient';
import { loadUserPreferences, saveUserPreferences, UserPreferences } from '../services/storageService';

// =============================================
// TYPES & INTERFACES
// =============================================

export type Sport = 'nba' | 'nfl' | 'mlb' | 'nhl' | 'all';
export type TimeRange = 'today' | 'week' | 'month' | 'season';
export type DataSource = 'realtime' | 'cached' | 'fallback' | 'mock';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SportsState {
  // Current selections
  currentSport: Sport;
  currentTimeRange: TimeRange;
  useRealtimeData: boolean;
  
  // Data states
  players: {
    data: Player[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  games: {
    data: Game[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  fantasyTeams: {
    data: FantasyTeam[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  prizePicks: {
    data: PrizePicksSelection[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  parlays: {
    data: ParlaySuggestion[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  news: {
    data: NewsItem[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  analytics: {
    data: Analytics[];
    games?: Game[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  predictions: {
    data: Prediction[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  dailyPicks: {
    data: DailyPick[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  playerTrends: {
    data: PlayerTrend[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  predictionOutcomes: {
    data: PredictionOutcome[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  bettingInsights: {
    data: BettingInsight[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  odds: {
    data: OddsGame[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  playerProps: {
    data: PlayerProp[];
    loading: LoadingState;
    error: string | null;
    lastUpdated: string | null;
    source: DataSource;
  };
  
  // Cache timestamps
  cacheTimestamps: Record<string, number>;
}

export interface SportsContextValue extends SportsState {
  // Sport management
  setCurrentSport: (sport: Sport) => void;
  setTimeRange: (range: TimeRange) => void;
  setUseRealtimeData: (useRealtime: boolean) => void;
  
  // Data fetching methods
  fetchPlayers: (params?: { limit?: number }) => Promise<void>;
  fetchGames: (params?: { sport?: string }) => Promise<void>;
  fetchFantasyTeams: (params?: { sport?: string }) => Promise<void>;
  fetchPrizePicks: (params?: { sport?: string; cache?: boolean }) => Promise<void>;
  fetchParlaySuggestions: (params?: { sport?: string; limit?: number }) => Promise<void>;
  fetchNews: (params?: { sport?: string }) => Promise<void>;
  fetchAnalytics: (params?: { sport?: string }) => Promise<void>;
  fetchPredictions: (params?: { sport?: string }) => Promise<void>;
  fetchDailyPicks: (params?: { sport?: string }) => Promise<void>;
  fetchPlayerTrends: (params?: { sport?: string; player?: string }) => Promise<void>;
  fetchPredictionOutcomes: (params?: { sport?: string }) => Promise<void>;
  fetchBettingInsights: () => Promise<void>;
  fetchOdds: (params?: { sport?: string }) => Promise<void>;
  fetchPlayerProps: (params?: { sport?: string }) => Promise<void>;
  
  // Batch operations
  refreshAllData: (sport?: Sport) => Promise<void>;
  refreshSportData: (sport: Sport) => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  invalidateCache: (key: string) => void;
  
  // Utility
  getPlayerById: (id: string) => Player | undefined;
  getGameById: (id: string) => Game | undefined;
  getFantasyTeamById: (id: string) => FantasyTeam | undefined;
  
  // Preferences
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  
  // System
  isInitialized: boolean;
  apiStatus: 'connected' | 'disconnected' | 'degraded';
  errorCount: number;
}

// =============================================
// INITIAL STATE
// =============================================

const createInitialState = (): SportsState => ({
  currentSport: 'nba',
  currentTimeRange: 'today',
  useRealtimeData: true,
  
  players: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  games: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  fantasyTeams: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  prizePicks: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  parlays: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  news: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  analytics: {
    data: [],
    games: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  predictions: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  dailyPicks: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  playerTrends: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  predictionOutcomes: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  bettingInsights: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  odds: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  playerProps: {
    data: [],
    loading: 'idle',
    error: null,
    lastUpdated: null,
    source: 'cached',
  },
  
  cacheTimestamps: {},
});

// =============================================
// CONTEXT CREATION
// =============================================

const SportsContext = createContext<SportsContextValue | undefined>(undefined);

// =============================================
// PROVIDER COMPONENT
// =============================================

interface SportsProviderProps {
  children: ReactNode;
  initialSport?: Sport;
  initialRealtime?: boolean;
}

export const SportsProvider: React.FC<SportsProviderProps> = ({
  children,
  initialSport = 'nba',
  initialRealtime = true,
}) => {
  const [state, setState] = useState<SportsState>(() => ({
    ...createInitialState(),
    currentSport: initialSport,
    useRealtimeData: initialRealtime,
  }));
  
  const [preferences, setPreferences] = useState<UserPreferences>(loadUserPreferences);
  const [isInitialized, setIsInitialized] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'degraded'>('connected');
  const [errorCount, setErrorCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use a ref for the refresh queue to avoid re-renders
  const refreshQueueRef = useRef<Set<string>>(new Set());

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  const updateState = useCallback(<K extends keyof SportsState>(
    key: K,
    updates: Partial<SportsState[K]>
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates,
      },
    }));
  }, []);

  const handleError = useCallback((
    error: unknown,
    defaultMessage: string,
    dataKey: keyof SportsState
  ) => {
    const errorMessage = error instanceof Error ? error.message : defaultMessage;
    console.error(`❌ ${defaultMessage}:`, error);
    
    setErrorCount((prev) => prev + 1);
    updateState(dataKey, {
      loading: 'error',
      error: errorMessage,
    });
    
    // Update API status if too many errors
    if (errorCount > 5) {
      setApiStatus('degraded');
    }
  }, [errorCount, updateState]);

  const updateCacheTimestamp = useCallback((key: string) => {
    setState((prev) => ({
      ...prev,
      cacheTimestamps: {
        ...prev.cacheTimestamps,
        [key]: Date.now(),
      },
    }));
  }, []);

  // =============================================
  // DATA FETCHING METHODS
  // =============================================

  const fetchPlayers = useCallback(async (params?: { limit?: number }) => {
    updateState('players', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getPlayers({
        sport: state.currentSport,
        limit: params?.limit || 200,
        realtime: state.useRealtimeData,
      });
      
      if (response.success) {
        updateState('players', {
          data: response.players || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.is_realtime ? 'realtime' : response.data_source?.includes('Fallback') ? 'fallback' : 'cached',
        });
        updateCacheTimestamp('players');
      } else {
        throw new Error(response.error || 'Failed to fetch players');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch players', 'players');
    }
  }, [state.currentSport, state.useRealtimeData, updateState, handleError, updateCacheTimestamp]);

  const fetchGames = useCallback(async (params?: { sport?: string }) => {
    updateState('games', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getOddsGames({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('games', {
          data: response.games || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.has_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('games');
      } else {
        throw new Error(response.error || 'Failed to fetch games');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch games', 'games');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchFantasyTeams = useCallback(async (params?: { sport?: string }) => {
    updateState('fantasyTeams', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getFantasyTeams({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('fantasyTeams', {
          data: response.teams || [],
          loading: 'success',
          lastUpdated: response.last_updated || new Date().toISOString(),
          source: response.is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('fantasyTeams');
      } else {
        throw new Error(response.error || 'Failed to fetch fantasy teams');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch fantasy teams', 'fantasyTeams');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchPrizePicks = useCallback(async (params?: { sport?: string; cache?: boolean }) => {
    updateState('prizePicks', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getPrizePicksSelections({
        sport: params?.sport || state.currentSport,
        cache: params?.cache !== undefined ? params.cache : true,
      });
      
      if (response.success) {
        updateState('prizePicks', {
          data: response.selections || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('prizePicks');
      } else {
        throw new Error(response.error || 'Failed to fetch PrizePicks');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch PrizePicks', 'prizePicks');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchParlaySuggestions = useCallback(async (params?: { sport?: string; limit?: number }) => {
    updateState('parlays', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getParlaySuggestions({
        sport: params?.sport || state.currentSport,
        limit: params?.limit || 4,
      });
      
      if (response.success) {
        updateState('parlays', {
          data: response.suggestions || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('parlays');
      } else {
        throw new Error(response.error || 'Failed to fetch parlay suggestions');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch parlay suggestions', 'parlays');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchNews = useCallback(async (params?: { sport?: string }) => {
    updateState('news', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getNews({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('news', {
          data: response.news || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.source === 'newsapi' ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('news');
      } else {
        throw new Error(response.error || 'Failed to fetch news');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch news', 'news');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchAnalytics = useCallback(async (params?: { sport?: string }) => {
    updateState('analytics', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getAnalytics({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('analytics', {
          data: response.analytics || [],
          games: response.games || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('analytics');
      } else {
        throw new Error(response.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch analytics', 'analytics');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchPredictions = useCallback(async (params?: { sport?: string }) => {
    updateState('predictions', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getPredictions({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('predictions', {
          data: (response as any).predictions || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: (response as any).is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('predictions');
      } else {
        throw new Error(response.error || 'Failed to fetch predictions');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch predictions', 'predictions');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchDailyPicks = useCallback(async (params?: { sport?: string }) => {
    updateState('dailyPicks', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getDailyPicks({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('dailyPicks', {
          data: response.picks || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('dailyPicks');
      } else {
        throw new Error(response.error || 'Failed to fetch daily picks');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch daily picks', 'dailyPicks');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchPlayerTrends = useCallback(async (params?: { sport?: string; player?: string }) => {
    updateState('playerTrends', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getPlayerTrends({
        sport: params?.sport || state.currentSport,
        player: params?.player,
      });
      
      if (response.success) {
        updateState('playerTrends', {
          data: response.trends || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('playerTrends');
      } else {
        throw new Error(response.error || 'Failed to fetch player trends');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch player trends', 'playerTrends');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchPredictionOutcomes = useCallback(async (params?: { sport?: string }) => {
    updateState('predictionOutcomes', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getPredictionOutcomes({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('predictionOutcomes', {
          data: response.outcomes || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.scraped ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('predictionOutcomes');
      } else {
        throw new Error(response.error || 'Failed to fetch prediction outcomes');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch prediction outcomes', 'predictionOutcomes');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchBettingInsights = useCallback(async () => {
    updateState('bettingInsights', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getSecretPhrases();
      
      if (response.success) {
        updateState('bettingInsights', {
          data: response.phrases || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.scraped ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('bettingInsights');
      } else {
        throw new Error(response.error || 'Failed to fetch betting insights');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch betting insights', 'bettingInsights');
    }
  }, [updateState, handleError, updateCacheTimestamp]);

  const fetchOdds = useCallback(async (params?: { sport?: string }) => {
    updateState('odds', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getOdds({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('odds', {
          data: response.data || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: 'realtime',
        });
        updateCacheTimestamp('odds');
      } else {
        throw new Error(response.error || 'Failed to fetch odds');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch odds', 'odds');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  const fetchPlayerProps = useCallback(async (params?: { sport?: string }) => {
    updateState('playerProps', { loading: 'loading', error: null });
    
    try {
      const response = await apiClient.getPlayerProps({
        sport: params?.sport || state.currentSport,
      });
      
      if (response.success) {
        updateState('playerProps', {
          data: response.props || [],
          loading: 'success',
          lastUpdated: response.timestamp || new Date().toISOString(),
          source: response.is_real_data ? 'realtime' : 'cached',
        });
        updateCacheTimestamp('playerProps');
      } else {
        throw new Error(response.error || 'Failed to fetch player props');
      }
    } catch (error) {
      handleError(error, 'Failed to fetch player props', 'playerProps');
    }
  }, [state.currentSport, updateState, handleError, updateCacheTimestamp]);

  // =============================================
  // BATCH OPERATIONS
  // =============================================

  const refreshSportData = useCallback(async (sport: Sport) => {
    const refreshKey = `refresh-${sport}`;
    
    if (refreshQueueRef.current.has(refreshKey)) {
      console.log(`⏳ Refresh already in progress for ${sport}`);
      return;
    }
    
    refreshQueueRef.current.add(refreshKey);
    
    try {
      console.log(`🔄 Refreshing all data for ${sport}...`);
      
      // Update current sport if different
      if (sport !== state.currentSport) {
        setState(prev => ({ ...prev, currentSport: sport }));
      }
      
      // Fetch all data in parallel
      await Promise.allSettled([
        fetchPlayers({ limit: 200 }),
        fetchGames({ sport }),
        fetchFantasyTeams({ sport }),
        fetchPrizePicks({ sport, cache: false }),
        fetchParlaySuggestions({ sport }),
        fetchNews({ sport }),
        fetchAnalytics({ sport }),
        fetchPredictions({ sport }),
        fetchDailyPicks({ sport }),
        fetchPlayerTrends({ sport }),
        fetchPredictionOutcomes({ sport }),
        fetchOdds({ sport }),
        fetchPlayerProps({ sport }),
      ]);
      
      // Fetch betting insights once
      await fetchBettingInsights();
      
      console.log(`✅ Successfully refreshed all data for ${sport}`);
      setErrorCount(0);
      setApiStatus('connected');
    } catch (error) {
      console.error(`❌ Failed to refresh data for ${sport}:`, error);
      setApiStatus('degraded');
    } finally {
      refreshQueueRef.current.delete(refreshKey);
    }
  }, [
    state.currentSport,
    fetchPlayers,
    fetchGames,
    fetchFantasyTeams,
    fetchPrizePicks,
    fetchParlaySuggestions,
    fetchNews,
    fetchAnalytics,
    fetchPredictions,
    fetchDailyPicks,
    fetchPlayerTrends,
    fetchPredictionOutcomes,
    fetchOdds,
    fetchPlayerProps,
    fetchBettingInsights,
  ]);

  const refreshAllData = useCallback(async (sport?: Sport) => {
    if (isRefreshing) {
      console.log('⏳ Refresh already in progress');
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      await refreshSportData(sport || state.currentSport);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, state.currentSport, refreshSportData]);

  // =============================================
  // SETTERS
  // =============================================

  const setCurrentSport = useCallback((sport: Sport) => {
    setState(prev => ({ ...prev, currentSport: sport }));
  }, []);

  const setTimeRange = useCallback((range: TimeRange) => {
    setState(prev => ({ ...prev, currentTimeRange: range }));
  }, []);

  const setUseRealtimeData = useCallback((useRealtime: boolean) => {
    setState(prev => ({ ...prev, useRealtimeData: useRealtime }));
  }, []);

  // =============================================
  // CACHE MANAGEMENT
  // =============================================

  const clearCache = useCallback(() => {
    apiClient.clearCache();
    setState(prev => ({
      ...prev,
      cacheTimestamps: {},
    }));
    console.log('🧹 Cache cleared');
  }, []);

  const invalidateCache = useCallback((key: string) => {
    setState(prev => {
      const newTimestamps = { ...prev.cacheTimestamps };
      delete newTimestamps[key];
      return {
        ...prev,
        cacheTimestamps: newTimestamps,
      };
    });
  }, []);

  // =============================================
  // UTILITY METHODS
  // =============================================

  const getPlayerById = useCallback((id: string): Player | undefined => {
    return state.players.data.find(p => p.id === id);
  }, [state.players.data]);

  const getGameById = useCallback((id: string): Game | undefined => {
    return state.games.data.find(g => g.id === id);
  }, [state.games.data]);

  const getFantasyTeamById = useCallback((id: string): FantasyTeam | undefined => {
    return state.fantasyTeams.data.find(t => t.id === id);
  }, [state.fantasyTeams.data]);

  // =============================================
  // PREFERENCES
  // =============================================

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      saveUserPreferences(updated);
      return updated;
    });
  }, []);

  // =============================================
  // INITIALIZATION & EFFECTS
  // =============================================

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 SportsContext initializing...');
      
      try {
        // Check API health
        const health = await apiClient.getHealth();
        console.log('✅ API Health check passed:', health);
        
        // Initial data fetch for current sport
        await refreshSportData(state.currentSport);
        
        setIsInitialized(true);
        console.log('✅ SportsContext initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize SportsContext:', error);
        setApiStatus('disconnected');
        setIsInitialized(true); // Still mark as initialized to show UI
      }
    };
    
    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh when sport or realtime setting changes
  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => {
        refreshSportData(state.currentSport);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [state.currentSport, state.useRealtimeData, isInitialized, refreshSportData]);

  // Periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Performing periodic data refresh...');
      refreshSportData(state.currentSport);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [isInitialized, state.currentSport, refreshSportData]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue: SportsContextValue = {
    ...state,
    
    // Setters
    setCurrentSport,
    setTimeRange,
    setUseRealtimeData,
    
    // Data fetching
    fetchPlayers,
    fetchGames,
    fetchFantasyTeams,
    fetchPrizePicks,
    fetchParlaySuggestions,
    fetchNews,
    fetchAnalytics,
    fetchPredictions,
    fetchDailyPicks,
    fetchPlayerTrends,
    fetchPredictionOutcomes,
    fetchBettingInsights,
    fetchOdds,
    fetchPlayerProps,
    
    // Batch operations
    refreshAllData,
    refreshSportData,
    
    // Cache
    clearCache,
    invalidateCache,
    
    // Utility
    getPlayerById,
    getGameById,
    getFantasyTeamById,
    
    // Preferences
    preferences,
    updatePreferences,
    
    // System
    isInitialized,
    apiStatus,
    errorCount,
  };

  return (
    <SportsContext.Provider value={contextValue}>
      {children}
    </SportsContext.Provider>
  );
};

// =============================================
// HOOKS
// =============================================

export const useSports = (): SportsContextValue => {
  const context = useContext(SportsContext);
  
  if (context === undefined) {
    throw new Error('useSports must be used within a SportsProvider');
  }
  
  return context;
};

export const useSport = (sport?: Sport): {
  sportData: SportsState;
  setSport: (sport: Sport) => void;
  refresh: () => Promise<void>;
} => {
  const context = useSports();
  
  const setSport = useCallback((newSport: Sport) => {
    context.setCurrentSport(newSport);
  }, [context]);
  
  const refresh = useCallback(async () => {
    await context.refreshSportData(sport || context.currentSport);
  }, [context, sport]);
  
  return {
    sportData: context,
    setSport,
    refresh,
  };
};

export const usePlayers = (sport?: Sport) => {
  const context = useSports();
  const targetSport = sport || context.currentSport;
  
  const players = context.players.data.filter(p => 
    p.sport?.toLowerCase() === targetSport.toLowerCase()
  );
  
  return {
    players,
    loading: context.players.loading,
    error: context.players.error,
    lastUpdated: context.players.lastUpdated,
    source: context.players.source,
    refresh: () => context.fetchPlayers({ limit: 200 }),
  };
};

export const usePrizePicks = (sport?: Sport) => {
  const context = useSports();
  const targetSport = sport || context.currentSport;
  
  const selections = context.prizePicks.data.filter(s => 
    s.sport?.toLowerCase() === targetSport.toLowerCase()
  );
  
  return {
    selections,
    loading: context.prizePicks.loading,
    error: context.prizePicks.error,
    lastUpdated: context.prizePicks.lastUpdated,
    source: context.prizePicks.source,
    refresh: () => context.fetchPrizePicks({ sport: targetSport, cache: false }),
  };
};

export const useParlays = (sport?: Sport) => {
  const context = useSports();
  const targetSport = sport || context.currentSport;
  
  const parlays = context.parlays.data.filter(p => 
    p.sport?.toLowerCase() === targetSport.toLowerCase() || p.sport === 'Mixed'
  );
  
  return {
    parlays,
    loading: context.parlays.loading,
    error: context.parlays.error,
    lastUpdated: context.parlays.lastUpdated,
    source: context.parlays.source,
    refresh: () => context.fetchParlaySuggestions({ sport: targetSport }),
  };
};

export const useGames = (sport?: Sport) => {
  const context = useSports();
  const targetSport = sport || context.currentSport;
  
  const games = context.games.data.filter(g => 
    g.sport_title?.toLowerCase() === targetSport.toLowerCase() ||
    g.sport_key?.includes(targetSport.toLowerCase())
  );
  
  return {
    games,
    loading: context.games.loading,
    error: context.games.error,
    lastUpdated: context.games.lastUpdated,
    source: context.games.source,
    refresh: () => context.fetchGames({ sport: targetSport }),
  };
};

export const useNews = (sport?: Sport) => {
  const context = useSports();
  const targetSport = sport || context.currentSport;
  
  const news = context.news.data.filter(n => 
    n.sport?.toLowerCase() === targetSport.toLowerCase()
  );
  
  return {
    news,
    loading: context.news.loading,
    error: context.news.error,
    lastUpdated: context.news.lastUpdated,
    source: context.news.source,
    refresh: () => context.fetchNews({ sport: targetSport }),
  };
};

export const useAnalytics = (sport?: Sport) => {
  const context = useSports();
  const targetSport = sport || context.currentSport;
  
  const analytics = context.analytics.data.filter(a => 
    a.sport?.toLowerCase() === targetSport.toLowerCase()
  );
  
  return {
    analytics,
    games: context.analytics.games || [],
    loading: context.analytics.loading,
    error: context.analytics.error,
    lastUpdated: context.analytics.lastUpdated,
    source: context.analytics.source,
    refresh: () => context.fetchAnalytics({ sport: targetSport }),
  };
};

export const useBettingInsights = () => {
  const context = useSports();
  
  return {
    insights: context.bettingInsights.data,
    loading: context.bettingInsights.loading,
    error: context.bettingInsights.error,
    lastUpdated: context.bettingInsights.lastUpdated,
    source: context.bettingInsights.source,
    refresh: context.fetchBettingInsights,
  };
};

export const useOdds = (sport?: Sport) => {
  const context = useSports();
  const targetSport = sport || context.currentSport;
  
  const odds = context.odds.data.filter(o => 
    o.sport_title?.toLowerCase() === targetSport.toLowerCase() ||
    o.sport_key?.includes(targetSport.toLowerCase())
  );
  
  return {
    odds,
    loading: context.odds.loading,
    error: context.odds.error,
    lastUpdated: context.odds.lastUpdated,
    source: context.odds.source,
    refresh: () => context.fetchOdds({ sport: targetSport }),
  };
};

export const usePlayer = (playerId: string) => {
  const context = useSports();
  
  return {
    player: context.getPlayerById(playerId),
    loading: context.players.loading,
    error: context.players.error,
  };
};

// =============================================
// DEFAULT EXPORT
// =============================================

export default SportsProvider;
