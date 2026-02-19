// src/pages/PredictionsOutcomeScreen.tsx - FINAL VERSION with live data, projections, and multi-sport support
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Paper,
  LinearProgress,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Modal,
  Fade,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Snackbar,
  Divider,
  Stack,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  EmojiEvents as TrophyIcon,
  AutoAwesome as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  BarChart as BarChartIcon,
  Update as UpdateIcon,
  Assessment as AssessmentIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Cached as CachedIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, subDays } from 'date-fns';

// ========== ENVIRONMENT VARIABLE SAFE ACCESS ==========
const getApiBase = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  return 'https://python-api-fresh-production.up.railway.app';
};
const API_BASE = getApiBase();

// ========== FEBRUARY 2026 SEASON CONTEXT ==========
const CURRENT_SEASON = '2025-26';
const CURRENT_YEAR = '2026';
const AS_OF_DATE = format(new Date(), 'MMMM d, yyyy'); // dynamic

// ========== CACHE IMPLEMENTATION ==========
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
  sport: string;
}

const predictionCache = new Map<string, CacheEntry>();

const getCacheKey = (sport: string, endpoint: string): string => `${sport}:${endpoint}`;

const isCacheValid = (cacheKey: string): boolean => {
  const entry = predictionCache.get(cacheKey);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

const getFromCache = (sport: string, endpoint: string): any | null => {
  const cacheKey = getCacheKey(sport, endpoint);
  if (isCacheValid(cacheKey)) {
    return predictionCache.get(cacheKey)?.data;
  }
  return null;
};

const setToCache = (sport: string, endpoint: string, data: any): void => {
  const cacheKey = getCacheKey(sport, endpoint);
  predictionCache.set(cacheKey, { data, timestamp: Date.now(), sport });
};

const clearCache = (sport?: string): void => {
  if (sport) {
    for (const [key, entry] of predictionCache.entries()) {
      if (entry.sport === sport) predictionCache.delete(key);
    }
  } else {
    predictionCache.clear();
  }
};

// ========== REALISTIC MOCK DATA GENERATOR (FALLBACK) ==========
const generateMockOutcomes = (sport: string, count: number = 20) => {
  const playersBySport: Record<string, string[]> = {
    nba: ['LeBron James', 'Stephen Curry', 'Jayson Tatum', 'Giannis Antetokounmpo', 'Luka Doncic', 'Nikola Jokic', 'Joel Embiid', 'Shai Gilgeous-Alexander'],
    nfl: ['Patrick Mahomes', 'Josh Allen', 'Justin Jefferson', 'Christian McCaffrey', 'Jalen Hurts', 'Lamar Jackson', 'Ja\'Marr Chase', 'Tyreek Hill'],
    mlb: ['Shohei Ohtani', 'Aaron Judge', 'Mookie Betts', 'Ronald Acuña Jr.', 'Bryce Harper', 'Vladimir Guerrero Jr.', 'Juan Soto', 'Yordan Alvarez'],
    nhl: ['Connor McDavid', 'Auston Matthews', 'Nathan MacKinnon', 'David Pastrnak', 'Leon Draisaitl', 'Cale Makar', 'Igor Shesterkin', 'Kirill Kaprizov']
  };
  
  const statRanges: Record<string, { stat: string, min: number, max: number }[]> = {
    nba: [
      { stat: 'points', min: 15, max: 45 },
      { stat: 'assists', min: 3, max: 15 },
      { stat: 'rebounds', min: 4, max: 18 },
      { stat: 'three-pointers', min: 1, max: 8 },
      { stat: 'steals', min: 0.5, max: 4 },
      { stat: 'blocks', min: 0.5, max: 4 }
    ],
    nfl: [
      { stat: 'passing yards', min: 200, max: 450 },
      { stat: 'rushing yards', min: 40, max: 150 },
      { stat: 'receiving yards', min: 40, max: 150 },
      { stat: 'touchdowns', min: 0, max: 4 },
      { stat: 'completions', min: 15, max: 35 }
    ],
    mlb: [
      { stat: 'hits', min: 0, max: 4 },
      { stat: 'home runs', min: 0, max: 2 },
      { stat: 'RBIs', min: 0, max: 5 },
      { stat: 'strikeouts', min: 0, max: 10 },
      { stat: 'walks', min: 0, max: 3 }
    ],
    nhl: [
      { stat: 'goals', min: 0, max: 3 },
      { stat: 'assists', min: 0, max: 3 },
      { stat: 'shots', min: 2, max: 8 },
      { stat: 'hits', min: 1, max: 6 },
      { stat: 'points', min: 0, max: 4 }
    ]
  };

  const players = playersBySport[sport] || playersBySport.nba;
  const ranges = statRanges[sport] || statRanges.nba;

  return Array.from({ length: count }, (_, i) => {
    const randomOutcome = ['correct', 'incorrect', 'pending'][Math.floor(Math.random() * 3)];
    const player = players[i % players.length];
    const { stat, min, max } = ranges[i % ranges.length];
    const line = Math.round((Math.random() * (max - min) + min) * 10) / 10;
    const actual = randomOutcome === 'pending' 
      ? line 
      : randomOutcome === 'correct' 
        ? Math.round((line + (Math.random() * 2 + 0.5)) * 10) / 10
        : Math.round((line - (Math.random() * 2 + 0.5)) * 10) / 10;
    
    return {
      id: `outcome-${sport}-${i + 1}-${Date.now()}`,
      game: `${['LAL', 'GSW', 'BOS', 'MIL', 'PHX'][i % 5]} vs ${['DEN', 'PHI', 'MIA', 'DAL', 'LAC'][i % 5]}`,
      player,
      prediction: `${player} ${randomOutcome === 'pending' ? 'over' : actual > line ? 'over' : 'under'} ${line} ${stat}`,
      prop: `${stat} ${randomOutcome === 'pending' ? 'over' : actual > line ? 'over' : 'under'} ${line}`,
      outcome: randomOutcome,
      actual_result: randomOutcome === 'pending' ? 'Pending' : (actual > line ? 'Over hit' : 'Under hit'),
      confidence_pre_game: Math.floor(Math.random() * 30) + 65,
      accuracy: randomOutcome === 'pending' ? null : Math.floor(Math.random() * 20) + 75,
      timestamp: subDays(new Date(), i % 7).toISOString(),
      sport,
      source: 'Sports Analytics AI',
      key_factors: [
        `${player} has averaged ${(line + 0.5).toFixed(1)} ${stat} in last 5 games`,
        `Opponent defense ranks ${i % 3 === 0 ? 'top 10' : 'middle'}`,
        `Historical trends favor ${i % 2 === 0 ? 'over' : 'under'}`
      ],
      stat_type: stat,
      line,
      actual_value: actual,
      projection: line + 0.2, // slight variation for projection
      edge: randomOutcome === 'correct' ? `+${(Math.random() * 15 + 5).toFixed(1)}` : randomOutcome === 'incorrect' ? `-${(Math.random() * 10 + 2).toFixed(1)}` : '0',
      units: randomOutcome === 'correct' ? `+${(Math.random() * 2 + 0.5).toFixed(1)}` : randomOutcome === 'incorrect' ? `-${(Math.random() + 0.5).toFixed(1)}` : '0',
      season: CURRENT_SEASON,
      year: 2026,
      asOf: AS_OF_DATE,
      team: ['LAL', 'GSW', 'BOS', 'MIL', 'PHX'][i % 5],
      date: format(subDays(new Date(), i % 14), 'MMM d, yyyy')
    };
  });
};

const leagueData = [
  { id: 'nba', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'nfl', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'mlb', name: 'MLB', icon: <BaseballIcon />, color: '#f59e0b' },
  { id: 'nhl', name: 'NHL', icon: <HockeyIcon />, color: '#0ea5e9' },
  { id: 'world cup', name: 'WORLD CUP', icon: <TrophyIcon />, color: '#8b5cf6' }
];

// ========== CUSTOM HOOK WITH IMPROVED RESPONSE HANDLING ==========
interface UsePredictionDataReturn {
  data: any;
  isLoading: boolean;
  error: string | null;
  refetch: (force?: boolean) => Promise<void>;
  isRefetching: boolean;
  dataSource: string;
  cacheInfo: { isCached: boolean; age: number };
  retryCount: number;
  lastRetryTime: Date | null;
  seasonStats: {
    totalPredictions: number;
    correctRate: number;
    avgEdge: number;
    profitIfBet100: number;
    topPerformer: string;
  };
}

const usePredictionData = (sport: string, seasonPhase: string, marketType: string): UsePredictionDataReturn => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');
  const [cacheInfo, setCacheInfo] = useState({ isCached: false, age: 0 });
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);
  const [seasonStats, setSeasonStats] = useState({
    totalPredictions: 0,
    correctRate: 0,
    avgEdge: 8.4,
    profitIfBet100: 1240,
    topPerformer: 'Wembanyama'
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to extract numbers from strings like "Accurate projection (783.2 vs 783.2)"
  const extractNumbers = (str: string): { actual: number; line: number } | null => {
    const match = str.match(/(\d+\.?\d*)\s*vs\s*(\d+\.?\d*)/);
    if (match) {
      return { actual: parseFloat(match[1]), line: parseFloat(match[2]) };
    }
    return null;
  };

  // Improved processResult to handle various response shapes
const processResult = (result: any, source: string, endpoint: string, isCached: boolean = false) => {
  let rawOutcomes = [];
  
  if (result.success) {
    if (result.outcomes) {
      rawOutcomes = result.outcomes;
      setDataSource('predictions/outcome');
    } else if (result.data && Array.isArray(result.data)) {
      rawOutcomes = result.data;
      setDataSource('predictions/outcome');
    } else if (result.predictions) {
      rawOutcomes = result.predictions;
      setDataSource('predictions');
    } else if (result.results) {
      rawOutcomes = result.results;
      setDataSource('predictions');
    } else if (Array.isArray(result)) {
      rawOutcomes = result;
      setDataSource('direct-array');
    }
  } else if (Array.isArray(result)) {
    rawOutcomes = result;
    setDataSource('direct-array');
  }
  
  if (rawOutcomes.length > 0) {
    const normalizedOutcomes = rawOutcomes.map((o: any) => {
      // Helper to extract numbers from strings like "Accurate projection (783.2 vs 783.2)"
      const extractNumbers = (str: string) => {
        const match = str.match(/(\d+\.?\d*)\s*vs\s*(\d+\.?\d*)/);
        return match ? { actual: parseFloat(match[1]), line: parseFloat(match[2]) } : null;
      };

      // Parse line and actual
      let line = o.line || o.value || o.projected_line || 0;
      const projected = o.projected_value || null;
      let actual = o.actual_value || o.actual || o.result_value || null;
      let outcome = o.outcome || o.result || 'pending';
      let actualResult = o.actual_result || 'Pending';

      // If we have actual_result string but no actual number, try to parse it
      if (!actual && actualResult && actualResult !== 'Pending') {
        const numbers = extractNumbers(actualResult);
        if (numbers) {
          actual = numbers.actual;
          line = numbers.line; // override line if it was missing
        }
      }

      // Infer outcome from actualResult if not provided
      if (outcome === 'pending' && actualResult && actualResult !== 'Pending') {
        if (actualResult.toLowerCase().includes('accurate')) {
          outcome = 'correct';
        } else if (actualResult.toLowerCase().includes('inaccurate')) {
          outcome = 'incorrect';
        }
      }

      // Extract stat type from prediction or prop if available
      let statType = o.stat_type || o.stat || 'Stat';
      if (statType === 'Stat' && o.prediction) {
        const lowerPred = o.prediction.toLowerCase();
        if (lowerPred.includes('points')) statType = 'Points';
        else if (lowerPred.includes('assists')) statType = 'Assists';
        else if (lowerPred.includes('rebounds')) statType = 'Rebounds';
        else if (lowerPred.includes('steals')) statType = 'Steals';
        else if (lowerPred.includes('blocks')) statType = 'Blocks';
        else if (lowerPred.includes('three') || lowerPred.includes('3-point')) statType = '3-Pointers';
        else if (lowerPred.includes('touchdowns')) statType = 'Touchdowns';
        else if (lowerPred.includes('yards')) statType = 'Yards';
        else if (lowerPred.includes('goals')) statType = 'Goals';
        else if (lowerPred.includes('assists')) statType = 'Assists';
        else if (lowerPred.includes('hits')) statType = 'Hits';
        else if (lowerPred.includes('strikeouts')) statType = 'Strikeouts';
        else if (lowerPred.includes('fantasy points')) statType = 'Fantasy Points';
      }

      return {
        id: o.id || `api-${Math.random()}`,
        game: o.game || `${o.away_team || ''} @ ${o.home_team || ''}`.trim() || 'Game TBD',
        player: o.player || o.name || 'Unknown',
        prediction: o.prediction || `${o.player || ''} ${statType} ${line}`.trim(),
        prop: o.prop || o.prediction || `${statType} ${line}`,
        outcome: outcome,
        actual_result: actualResult,
        confidence_pre_game: o.confidence_pre_game || o.confidence || 70,
        accuracy: o.accuracy !== undefined ? o.accuracy : null,
        timestamp: o.timestamp || o.date || new Date().toISOString(),
        sport: o.sport || sport,
        source: o.source || 'API',
        key_factors: o.key_factors || (o.analysis ? [o.analysis] : ['No analysis available']),
        stat_type: statType,
        line: line,
        actual_value: actual,
        projection: projected || line, // fallback to line if no separate projection
        edge: o.edge || (o.confidence ? `+${o.confidence}%` : '+8.4%'),
        units: o.units || '0',
        market_type: o.market_type || marketType,
        season_phase: o.season_phase || seasonPhase,
        season: o.season || CURRENT_SEASON,
        asOf: o.asOf || AS_OF_DATE,
        team: o.team || o.away_team || '',
        date: o.date || format(new Date(), 'MMM d, yyyy')
      };
    });
    
    const enhancedOutcomes = normalizedOutcomes.map((o: any) => ({ 
      ...o, 
      season: CURRENT_SEASON, 
      year: 2026, 
      asOf: AS_OF_DATE 
    }));
    
    const responseData = {
      success: true,
      outcomes: enhancedOutcomes,
      count: enhancedOutcomes.length,
      sport,
      timestamp: new Date().toISOString(),
      scraped: !isCached,
      source,
      message: isCached 
        ? `Loaded ${enhancedOutcomes.length} outcomes from cache (${endpoint.split('/').pop()})`
        : `Loaded ${enhancedOutcomes.length} outcomes from ${endpoint.split('/').pop()}`
    };
    setData(responseData);
    
    const correct = enhancedOutcomes.filter((o: any) => o.outcome === 'correct').length;
    const totalEdge = enhancedOutcomes.reduce((acc: number, o: any) => acc + (parseFloat(o.edge) || 0), 0);
    setSeasonStats({
      totalPredictions: enhancedOutcomes.length,
      correctRate: enhancedOutcomes.length > 0 ? Math.round((correct / enhancedOutcomes.length) * 100) : 0,
      avgEdge: enhancedOutcomes.length > 0 ? Math.round(Math.abs(totalEdge / enhancedOutcomes.length) * 10) / 10 : 0,
      profitIfBet100: enhancedOutcomes.length > 0 ? Math.round((correct - (enhancedOutcomes.length - correct)) * 100) : 0,
      topPerformer: sport === 'nba' ? 'Wembanyama' : sport === 'nfl' ? 'Mahomes' : 'Ohtani'
    });
    
    setCacheInfo({ isCached, age: isCached ? Date.now() - (getFromCache(sport, endpoint)?.timestamp || 0) : 0 });
    return true;
  }
  return false;
};

  const fetchData = useCallback(async (force: boolean = false, isRetry: boolean = false): Promise<void> => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (!force) setIsLoading(true); else setIsRefetching(true);
    if (isRetry) { setRetryCount(prev => prev + 1); setLastRetryTime(new Date()); }

    const baseUrl = API_BASE;
    const today = format(new Date(), 'yyyy-MM-dd'); // dynamic date
    const endpoints = [
      `${baseUrl}/api/predictions/outcome?sport=${sport}&season=${CURRENT_SEASON}&as_of=${today}&phase=${seasonPhase}&market_type=${marketType}`,
      `${baseUrl}/api/players/trends?sport=${sport}&season=${CURRENT_SEASON}`,
      `${baseUrl}/api/history?sport=${sport}&season=${CURRENT_SEASON}`,
      `${baseUrl}/api/predictions?sport=${sport}&season=${CURRENT_SEASON}`
    ];
    
    if (!force) {
      for (const endpoint of endpoints) {
        const cachedData = getFromCache(sport, endpoint);
        if (cachedData && processResult(cachedData, 'cache', endpoint, true)) {
          setIsLoading(false); setIsRefetching(false);
          return;
        }
      }
    }
    
    let rateLimited = false;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { signal: abortControllerRef.current?.signal, headers: { 'Cache-Control': 'no-cache' } });
        if (response.status === 429) {
          rateLimited = true;
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          setError(`Rate limited. Please wait ${Math.ceil(waitTime/1000)} seconds.`);
          continue;
        }
        if (!response.ok) continue;
        
        const result = await response.json();
        console.log(`📦 Raw response from ${endpoint}:`, result);
        setToCache(sport, endpoint, result);
        if (processResult(result, endpoint, endpoint, false)) {
          setError(null);
          setIsLoading(false); setIsRefetching(false);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.log(`Endpoint ${endpoint} failed:`, err);
      }
    }
    
    // Use realistic mock generator if all endpoints fail
    const mockOutcomes = generateMockOutcomes(sport, 20);
    const mockData = {
      success: true,
      outcomes: mockOutcomes,
      count: mockOutcomes.length,
      sport,
      timestamp: new Date().toISOString(),
      scraped: false,
      source: 'mock',
      message: rateLimited 
        ? `Showing February 2026 ${seasonPhase} data (API rate limit reached)`
        : `Showing February 2026 ${seasonPhase} predictions for demonstration`
    };
    setData(mockData);
    processResult(mockData, 'mock', endpoints[0], false);
    setDataSource('mock');
    setCacheInfo({ isCached: false, age: 0 });
    setError(rateLimited ? `Rate limited - showing February 2026 demo data. Try again later for live ${CURRENT_SEASON} data.` : null);
    setIsLoading(false); setIsRefetching(false);
  }, [sport, seasonPhase, marketType]);

  useEffect(() => {
    fetchData(false, false);
    return () => abortControllerRef.current?.abort();
  }, [fetchData]);

  const refetch = useCallback(async (force: boolean = true) => await fetchData(force, true), [fetchData]);

  return { data, isLoading, error, refetch, isRefetching, dataSource, cacheInfo, retryCount, lastRetryTime, seasonStats };
};

// ========== MAIN COMPONENT ==========
const PredictionsOutcomeScreen = () => {
  const navigate = useNavigate();
  
  const [selectedSport, setSelectedSport] = useState('nba');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'correct' | 'incorrect' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Generator state
  const [customQuery, setCustomQuery] = useState('');
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [predictionResults, setPredictionResults] = useState<any>(null);
  const [showSimulationModal, setShowSimulationModal] = useState(false);

  // UI control
  const [showResults, setShowResults] = useState(true);

  const [seasonPhase, setSeasonPhase] = useState<'regular' | 'playoffs' | 'all-star' | 'futures'>('regular');
  const [marketType, setMarketType] = useState<'standard' | 'alt_line' | 'special' | 'futures'>('standard');
  
  const {
    data: outcomesData,
    isLoading,
    error,
    refetch,
    isRefetching,
    dataSource,
    cacheInfo,
    retryCount,
    lastRetryTime,
    seasonStats
  } = usePredictionData(selectedSport, seasonPhase, marketType);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleForceRefresh = async () => {
    showSnackbar(`Force refreshing ${CURRENT_SEASON} season data...`, 'info');
    clearCache(selectedSport);
    await refetch(true);
    showSnackbar(`Data refreshed successfully!`, 'success');
  };

  const handleClearAllCache = () => {
    clearCache();
    showSnackbar('All cache cleared!', 'success');
    refetch(true);
  };

  const handleRetryWithBackoff = async () => {
    const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000);
    showSnackbar(`Retrying in ${backoffTime/1000} seconds...`, 'info');
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    await refetch(true);
  };

  // Generator function
  const handleGeneratePredictions = async () => {
    if (!customQuery.trim()) {
      alert('Please enter a prediction query');
      return;
    }

    setGeneratingPredictions(true);
    setShowSimulationModal(true);

    try {
      const endpoint = `${API_BASE}/api/ai/query`;
      console.log('📡 Sending request to:', endpoint, 'with query:', customQuery);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery, sport: selectedSport }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
// Inside handleGeneratePredictions, after const data = await response.json();
console.log('✅ API response:', data);

// ---- NEW: Outdated player info detection ----
const outdatedPhrases = [
    'James Harden of the Brooklyn Nets',
    'James Harden of the Philadelphia 76ers',
    // Add more as you discover them (e.g., 'Trae Young of the Atlanta Hawks')
];
if (data.analysis && outdatedPhrases.some(phrase => data.analysis.includes(phrase))) {
    throw new Error('Outdated player info detected, using demo data');
}
// ----------------------------------------------

      if (data.analysis) {
        setPredictionResults({
          success: true,
          analysis: data.analysis,
          model: 'ai-model',
          timestamp: new Date().toISOString(),
          source: 'AI Query Endpoint',
          rawData: data
        });
      } else {
        let selections = [];
        if (data.success && data.data) {
          selections = data.data;
        } else if (Array.isArray(data)) {
          selections = data;
        } else if (data.selections) {
          selections = data.selections;
        } else if (data.results) {
          selections = data.results;
        }

        if (selections.length > 0) {
          const formattedAnalysis = selections.map((item: any, idx: number) => {
            return `**${idx + 1}. ${item.player || 'Player'}**\n` +
              `   📈 **Stat:** ${item.stat || 'N/A'}\n` +
              `   🎯 **Line:** ${item.line || 'N/A'}\n` +
              `   🔮 **Projection:** ${item.projection || 'N/A'}\n` +
              `   💎 **Confidence:** ${item.confidence || 'medium'}\n` +
              `   💰 **Odds:** ${item.odds || 'N/A'}\n` +
              `   📝 **Analysis:** ${item.analysis || 'No analysis'}`;
          }).join('\n\n');

          setPredictionResults({
            success: true,
            analysis: `🎯 **AI Prediction Results**\n\nBased on your query:\n\n${formattedAnalysis}`,
            model: 'ai-model',
            timestamp: new Date().toISOString(),
            source: 'AI Query Endpoint',
            rawData: data
          });
        } else {
          throw new Error('No analysis or picks in response');
        }
      }
    } catch (error) {
      console.error('❌ Error generating predictions:', error);
      const mockSelections = generateMockOutcomes(selectedSport.toLowerCase(), 5);
      const mockAnalysis = mockSelections.map((item: any, idx: number) => {
        return `**${idx + 1}. ${item.player}**\n` +
          `   📈 **Stat:** ${item.stat_type}\n` +
          `   🎯 **Line:** ${item.line}\n` +
          `   🔮 **Projection:** ${item.projection}\n` +
          `   💎 **Confidence:** ${item.confidence_pre_game}%\n` +
          `   💰 **Odds:** -110\n` +
          `   📝 **Analysis:** ${item.key_factors?.join(' ')}`;
      }).join('\n\n');

      setPredictionResults({
        success: true,
        analysis: `🎯 **AI Prediction Results (Demo)**\n\nBased on your query:\n\n${mockAnalysis}`,
        model: 'demo-model',
        timestamp: new Date().toISOString(),
        source: 'Demo Data (API unavailable)'
      });
    } finally {
      setTimeout(() => setGeneratingPredictions(false), 1500);
    }
  };

  const outcomes = outcomesData?.outcomes || [];

  const filteredByOutcome = filterOutcome === 'all'
    ? outcomes
    : outcomes.filter((item: any) => item.outcome === filterOutcome);

  const filteredOutcomes = searchQuery
    ? filteredByOutcome.filter((item: any) =>
        (item.game?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.prediction?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.player?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.sport?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.team?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    : filteredByOutcome;

  const totalPredictions = filteredOutcomes.length;
  const correctPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'correct').length;
  const incorrectPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'incorrect').length;
  const pendingPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'pending').length;
  
  const winRate = correctPredictions + incorrectPredictions > 0 
    ? Math.round((correctPredictions / (correctPredictions + incorrectPredictions)) * 100)
    : 0;

  const getSportIcon = (sport: string) => {
    switch (sport?.toLowerCase()) {
      case 'nba': return <BasketballIcon />;
      case 'nfl': return <FootballIcon />;
      case 'mlb': return <BaseballIcon />;
      case 'nhl': return <HockeyIcon />;
      case 'world cup': return <TrophyIcon />;
      default: return <BasketballIcon />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch(outcome) {
      case 'correct': return '#10b981';
      case 'incorrect': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch(outcome) {
      case 'correct': return <CheckCircleIcon />;
      case 'incorrect': return <CancelIcon />;
      case 'pending': return <TimelineIcon />;
      default: return <TimelineIcon />;
    }
  };

  // Render card
  const renderOutcomeCard = (outcome: any, index: number) => {
    const outcomeColor = getOutcomeColor(outcome.outcome);
    const isExpanded = expandedCard === outcome.id;
    const isAllStar = outcome.prediction?.includes('All-Star') || outcome.prop?.includes('All-Star') || outcome.season_phase === 'all-star' || outcome.market_type === 'special';
    const isFutures = outcome.prediction?.includes('ROTY') || outcome.prediction?.includes('MVP') || outcome.prediction?.includes('Cy Young') || outcome.market_type === 'futures' || outcome.season_phase === 'futures';
    const isPlayoff = outcome.season_phase === 'playoffs';
    const isWorldCup = outcome.prediction?.includes('World Cup') || outcome.tournament === 'World Cup 2026' || outcome.sport === 'world cup';
    
    return (
      <Grid item xs={12} md={6} lg={4} key={outcome.id || `outcome-${index}-${Date.now()}`}>
        <Card sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'all 0.3s',
          border: `1px solid ${alpha(outcomeColor, 0.2)}`,
          ...(isAllStar && { borderLeftWidth: 4, borderLeftColor: '#FFD700', background: 'linear-gradient(to right, rgba(255,215,0,0.05), transparent)' }),
          ...(isFutures && { borderTopWidth: 2, borderTopColor: '#4CAF50', background: 'linear-gradient(to bottom, rgba(76,175,80,0.05), transparent)' }),
          ...(isPlayoff && { borderLeftWidth: 4, borderLeftColor: '#0066CC', background: 'linear-gradient(to right, rgba(0,102,204,0.05), transparent)' }),
          ...(isWorldCup && { borderLeftWidth: 4, borderLeftColor: '#00BCD4', background: 'linear-gradient(to right, rgba(0,188,212,0.05), transparent)' }),
          '&:hover': { borderColor: outcomeColor, boxShadow: `0 4px 20px ${alpha(outcomeColor, 0.15)}` }
        }}>
          <CardContent sx={{ flexGrow: 1, p: 3 }}>
            {isFutures && (
              <Box sx={{ bgcolor: '#1a2a1a', px: 2, py: 0.75, borderRadius: 1, display: 'inline-block', mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 700 }}>🏆 2026 FUTURES</Typography>
              </Box>
            )}
            {isAllStar && !isFutures && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#2a2a1a', px: 2, py: 0.75, borderRadius: 1, mb: 2 }}>
                <StarIcon sx={{ fontSize: 16, color: '#FFD700' }} />
                <Typography variant="caption" sx={{ color: '#FFD700', fontWeight: 600 }}>2026 ALL-STAR</Typography>
              </Box>
            )}
            
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {outcome.game || `${outcome.player || 'Player'} Prediction`}
                </Typography>
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                  <Chip label={outcome.sport?.toUpperCase() || 'NBA'} size="small" icon={getSportIcon(outcome.sport || 'nba')} sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }} />
                  {outcome.player && <Chip label={outcome.player} size="small" variant="outlined" />}
                  {outcome.season && <Chip label={outcome.season} size="small" sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', fontSize: '0.65rem' }} />}
                </Box>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                <Chip label={outcome.outcome?.toUpperCase() || 'PENDING'} size="small" sx={{ bgcolor: outcomeColor, color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }} />
                {outcome.units && outcome.units !== '0' && <Typography variant="caption" fontWeight="bold" color={outcomeColor}>{outcome.units} units</Typography>}
              </Box>
            </Box>
            
            <Typography variant="body1" fontWeight="medium" color="primary" mb={2}>
              {outcome.prediction || outcome.prop || 'No prediction details available'}
            </Typography>
            
            <Grid container spacing={2} mb={2}>
              <Grid item xs={6}>
                <Box textAlign="center" p={1.5} bgcolor="action.hover" borderRadius={2}>
                  <Typography variant="caption" color="text.secondary">Confidence</Typography>
                  <LinearProgress variant="determinate" value={outcome.confidence_pre_game || outcome.confidence || 70} sx={{ height: 8, borderRadius: 4, mt: 1, mb: 1, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: (outcome.confidence_pre_game || outcome.confidence) >= 80 ? '#10b981' : (outcome.confidence_pre_game || outcome.confidence) >= 70 ? '#f59e0b' : '#ef4444' } }} />
                  <Typography variant="body2" fontWeight="bold">{outcome.confidence_pre_game || outcome.confidence || 70}%</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center" p={1.5} bgcolor="action.hover" borderRadius={2}>
                  <Typography variant="caption" color="text.secondary">Result</Typography>
                  <Typography variant="body1" fontWeight="bold" color={outcomeColor} sx={{ mt: 0.5 }}>{outcome.actual_result || outcome.outcome?.charAt(0).toUpperCase() + outcome.outcome?.slice(1) || 'Pending'}</Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha('#4CAF50', 0.1), p: 1.5, borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Edge:</Typography>
              <Typography variant="body2" fontWeight="bold" color={outcome.edge?.startsWith('+') ? '#4CAF50' : '#FF4444'}>{outcome.edge || '+8.4%'}</Typography>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Accuracy:</Typography>
              <Typography variant="body2" fontWeight="bold" color="#4CAF50">{outcome.accuracy || 75}%</Typography>
            </Box>
            
            {/* Accordion - controlled locally */}
            <Accordion 
              expanded={isExpanded}
              onChange={() => setExpandedCard(isExpanded ? null : outcome.id)}
              sx={{ mb: 2, '&:before': { display: 'none' }, boxShadow: 'none', bgcolor: 'transparent' }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 'auto', p: 0, '& .MuiAccordionSummary-content': { my: 1 } }}>
                <Typography variant="body2" color="primary" fontWeight="medium">
                  {isExpanded ? 'Show Less' : 'View Details'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {outcome.key_factors && outcome.key_factors.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Key Factors</Typography>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {outcome.key_factors.map((factor: string, i: number) => (
                        <li key={i}><Typography variant="body2" color="text.secondary">{factor}</Typography></li>
                      ))}
                    </ul>
                  </Box>
                )}
                {/* Prediction Details including projection */}
                {(outcome.line || outcome.stat_type || outcome.actual_value || outcome.projection) && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prediction Details</Typography>
                    <Grid container spacing={1}>
                      {outcome.line && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Line</Typography><Typography variant="body2">{outcome.line}</Typography></Grid>}
                      {outcome.stat_type && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Stat Type</Typography><Typography variant="body2">{outcome.stat_type}</Typography></Grid>}
                      {outcome.projection && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Projection</Typography><Typography variant="body2">{outcome.projection}</Typography></Grid>}
                      {outcome.actual_value && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Actual</Typography><Typography variant="body2" fontWeight="bold">{outcome.actual_value}</Typography></Grid>}
                    </Grid>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
            
            <Box sx={{ mt: 'auto' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {outcome.timestamp ? format(new Date(outcome.timestamp), 'MMM d, yyyy') : outcome.date || AS_OF_DATE}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {outcome.source && `Source: ${outcome.source}`}
                </Typography>
              </Box>
              {outcome.asOf && <Typography variant="caption" color="#4CAF50" sx={{ display: 'block', mt: 0.5 }}>📅 Data as of {outcome.asOf}</Typography>}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  // Render generator
  const renderGenerator = () => (
    <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <RocketLaunchIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Typography variant="h4">🚀 AI Prediction Generator</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Generate custom predictions using advanced AI models
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Prediction Queries</Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {[
            "Generate NBA player props for tonight",
            "Best NFL team total predictions this week",
            "High probability MLB game outcomes",
            "Today's best over/under predictions",
            "Generate same-game parlay predictions"
          ].map((query, index) => (
            <Chip
              key={index}
              label={query}
              onClick={() => setCustomQuery(query)}
              icon={<SparklesIcon />}
              sx={{ 
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.main' }
              }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Custom Prediction Query</Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Enter custom prediction query..."
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleGeneratePredictions}
            disabled={!customQuery.trim() || generatingPredictions}
            sx={{ flex: 2 }}
          >
            {generatingPredictions ? 'Generating...' : 'Generate AI Prediction'}
          </Button>
          <Button
            variant="outlined"
            size="medium"
            onClick={() => {
              setCustomQuery("Get NBA player props for tonight");
              setTimeout(() => handleGeneratePredictions(), 100);
            }}
            sx={{ flex: 1 }}
          >
            Test API
          </Button>
        </Box>
      </Box>

      {predictionResults && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Latest Prediction Results
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {predictionResults.analysis || predictionResults.prediction}
          </Typography>
          {predictionResults.source && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Source: {predictionResults.source}
            </Typography>
          )}
        </Box>
      )}

      <Alert severity="info" icon={<PsychologyIcon />} sx={{ mt: 2 }}>
        Uses neural networks, statistical modeling, and historical data for accurate predictions
      </Alert>
    </Paper>
  );

  const AnalyticsDashboard = () => {
    return (
      <Modal open={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} closeAfterTransition sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Fade in={showAnalyticsModal}>
          <Paper sx={{ width: { xs: '95%', md: 600 }, maxHeight: '90vh', overflow: 'auto', borderRadius: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}><TrophyIcon color="primary" /><Typography variant="h5" fontWeight="bold">{CURRENT_SEASON} Season Analytics</Typography></Box>
                <IconButton onClick={() => setShowAnalyticsModal(false)} size="small"><CloseIcon /></IconButton>
              </Box>
              <Alert severity="info" sx={{ mb: 3 }}><AlertTitle>February 2026 Update</AlertTitle>Season stats current as of {AS_OF_DATE}</Alert>
              <Grid container spacing={2} mb={3}>
                {[
                  { label: 'Total Predictions', value: seasonStats.totalPredictions || totalPredictions, color: '#059669' },
                  { label: 'Hit Rate', value: `${seasonStats.correctRate || winRate}%`, color: '#10b981' },
                  { label: 'Avg Edge', value: `+${seasonStats.avgEdge}%`, color: '#4CAF50' },
                  { label: 'Profit (100u)', value: `$${seasonStats.profitIfBet100}`, color: seasonStats.profitIfBet100 >= 0 ? '#10b981' : '#ef4444' },
                  { label: 'Data Source', value: dataSource, color: '#3b82f6' },
                  { label: 'Cache Status', value: cacheInfo.isCached ? 'Cached' : 'Live', color: cacheInfo.isCached ? '#f59e0b' : '#10b981' }
                ].map((stat, idx) => (
                  <Grid item xs={6} sm={4} key={idx}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: alpha(stat.color, 0.1), borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight="bold" color={stat.color}>{stat.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="medium" mb={2}>{CURRENT_SEASON} Outcome Breakdown</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}><Box textAlign="center"><Avatar sx={{ bgcolor: '#10b981', color: 'white', width: 50, height: 50, mx: 'auto', mb: 1 }}>{correctPredictions}</Avatar><Typography variant="caption" color="text.secondary">Correct</Typography></Box></Grid>
                    <Grid item xs={4}><Box textAlign="center"><Avatar sx={{ bgcolor: '#ef4444', color: 'white', width: 50, height: 50, mx: 'auto', mb: 1 }}>{incorrectPredictions}</Avatar><Typography variant="caption" color="text.secondary">Incorrect</Typography></Box></Grid>
                    <Grid item xs={4}><Box textAlign="center"><Avatar sx={{ bgcolor: '#f59e0b', color: 'white', width: 50, height: 50, mx: 'auto', mb: 1 }}>{pendingPredictions}</Avatar><Typography variant="caption" color="text.secondary">Pending</Typography></Box></Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>Top Performer: {seasonStats.topPerformer}</Typography>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>Recent {CURRENT_SEASON} Predictions</Typography>
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {filteredOutcomes.slice(0, 5).map((prediction: any, index: number) => (
                  <ListItem key={index} sx={{ mb: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <ListItemAvatar><Avatar sx={{ bgcolor: getOutcomeColor(prediction.outcome), width: 32, height: 32 }}>{getOutcomeIcon(prediction.outcome)}</Avatar></ListItemAvatar>
                    <ListItemText primary={prediction.game || prediction.player || 'Prediction'} secondary={`${prediction.sport?.toUpperCase() || 'NBA'} • ${prediction.timestamp ? format(new Date(prediction.timestamp), 'MMM d') : AS_OF_DATE}`} primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'caption' }} />
                    <ListItemSecondaryAction><Chip label={prediction.outcome?.charAt(0).toUpperCase() + prediction.outcome?.slice(1) || 'Pending'} size="small" sx={{ bgcolor: getOutcomeColor(prediction.outcome), color: 'white', fontSize: '0.7rem' }} /></ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Paper>
        </Fade>
      </Modal>
    );
  };

  if (isLoading && !isRefetching) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>Loading {CURRENT_SEASON} prediction outcomes...</Typography>
          <Typography variant="caption" sx={{ mt: 1, color: '#4CAF50' }}>Data as of {AS_OF_DATE}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: 3, mb: 4, mt: 2, p: 3, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%' }} />
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' } }} variant="outlined">Back</Button>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={CURRENT_SEASON} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.3)' }} />
            <Badge badgeContent={dataSource === 'mock' ? "Demo" : dataSource === 'cache' ? "Cached" : "Live"} color={dataSource === 'mock' ? "warning" : dataSource === 'cache' ? "info" : "success"}>
              <Button startIcon={<BarChartIcon />} onClick={() => setShowAnalyticsModal(true)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' } }} variant="outlined">Season Analytics</Button>
            </Badge>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRetryWithBackoff} disabled={isLoading || isRefetching} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' }, minWidth: '120px' }}>{isRefetching ? 'Retrying...' : `Retry (${retryCount})`}</Button>
            <Button variant="outlined" startIcon={<CachedIcon />} onClick={handleForceRefresh} disabled={isRefetching} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' }, bgcolor: alpha('#ef4444', 0.2) }}>Force Refresh</Button>
            <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClearAllCache} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' }, bgcolor: alpha('#f59e0b', 0.2) }}>Clear Cache</Button>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 72, height: 72 }}><AssessmentIcon sx={{ fontSize: 36 }} /></Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>{CURRENT_SEASON} Prediction Outcomes</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}>Track and analyze {selectedSport.toUpperCase()} prediction performance for the {CURRENT_SEASON} season</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>📅 Data current as of {AS_OF_DATE} • {CURRENT_YEAR} Season</Typography>
          </Box>
        </Box>
      </Box>

      {/* Data Freshness Banner */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#1a2a1a', border: '1px solid #2a3a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}><UpdateIcon sx={{ color: '#4CAF50', fontSize: 20 }} /><Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 500 }}>Data current as of {AS_OF_DATE} • {CURRENT_SEASON} Season</Typography></Box>
        <Chip label="FEB 2026" size="small" sx={{ bgcolor: '#2a3a2a', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }} />
      </Paper>

      {/* Status Alerts */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} action={<Box sx={{ display: 'flex', gap: 1 }}><Button color="inherit" size="small" onClick={handleRetryWithBackoff}>RETRY</Button><Button color="inherit" size="small" onClick={() => showSnackbar(`Showing ${CURRENT_SEASON} demo data`, 'info')}>USE DEMO</Button></Box>}>
          <AlertTitle>{CURRENT_SEASON} Season Data</AlertTitle>
          {error || `Showing demo data`}{lastRetryTime && ` • Last retry: ${format(lastRetryTime, 'HH:mm:ss')}`}
        </Alert>
      )}

      {outcomesData?.message && !error && (
        <Alert severity={outcomesData.scraped ? "success" : "info"} sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => refetch(true)}>REFRESH</Button>}>
          <AlertTitle>{outcomesData.scraped ? 'Live Data' : cacheInfo.isCached ? 'Cached Data' : 'Demo Data'}</AlertTitle>
          {outcomesData.message}{outcomesData.timestamp && ` • Updated ${format(new Date(outcomesData.timestamp), 'MMM d, h:mm a')}`}
        </Alert>
      )}

      {isRefetching && (
        <Box sx={{ mb: 3 }}><LinearProgress /><Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#4CAF50' }}>Fetching updated {CURRENT_SEASON} season data...{retryCount > 0 && ` (Retry attempt: ${retryCount})`}</Typography></Box>
      )}

      {/* Season Stats Overview */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TrophyIcon sx={{ color: '#4CAF50' }} />{CURRENT_SEASON} Season Performance</Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}><Box textAlign="center"><Typography variant="h4" fontWeight="bold" color="#fff">{seasonStats.totalPredictions || totalPredictions}</Typography><Typography variant="body2" color="text.secondary">2026 Predictions</Typography></Box></Grid>
          <Grid item xs={6} sm={3}><Box textAlign="center"><Typography variant="h4" fontWeight="bold" color="#10b981">{seasonStats.correctRate || winRate}%</Typography><Typography variant="body2" color="text.secondary">Hit Rate</Typography></Box></Grid>
          <Grid item xs={6} sm={3}><Box textAlign="center"><Typography variant="h4" fontWeight="bold" color="#4CAF50">+{seasonStats.avgEdge}%</Typography><Typography variant="body2" color="text.secondary">Avg Edge</Typography></Box></Grid>
          <Grid item xs={6} sm={3}><Box textAlign="center"><Typography variant="h4" fontWeight="bold" color={seasonStats.profitIfBet100 >= 0 ? '#10b981' : '#ef4444'}>${seasonStats.profitIfBet100}</Typography><Typography variant="body2" color="text.secondary">Profit (100u)</Typography></Box></Grid>
        </Grid>
      </Paper>

      {/* GENERATOR - placed right after Season Performance */}
      {renderGenerator()}

      {/* Search and Filter Section – with Show/Hide Results button */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth placeholder={`Search ${CURRENT_SEASON} predictions...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.default' } }} />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Select value={selectedSport} label="Sport" onChange={(e) => { setSelectedSport(e.target.value); showSnackbar(`Switched to ${e.target.value.toUpperCase()} ${CURRENT_SEASON}`, 'info'); }} startAdornment={getSportIcon(selectedSport)} sx={{ borderRadius: 2 }}>
                {leagueData.map((league) => (
                  <MenuItem key={league.id} value={league.id}><Box display="flex" alignItems="center" gap={1}>{league.icon}{league.name}{league.id === 'world cup' && ' 2026'}</Box></MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter Outcome</InputLabel>
              <Select value={filterOutcome} label="Filter Outcome" onChange={(e) => setFilterOutcome(e.target.value as any)} sx={{ borderRadius: 2 }}>
                <MenuItem value="all">All Outcomes</MenuItem>
                <MenuItem value="correct"><Box display="flex" alignItems="center" gap={1}><CheckCircleIcon sx={{ color: '#10b981', fontSize: 16 }} />Correct Only</Box></MenuItem>
                <MenuItem value="incorrect"><Box display="flex" alignItems="center" gap={1}><CancelIcon sx={{ color: '#ef4444', fontSize: 16 }} />Incorrect Only</Box></MenuItem>
                <MenuItem value="pending"><Box display="flex" alignItems="center" gap={1}><TimelineIcon sx={{ color: '#f59e0b', fontSize: 16 }} />Pending Only</Box></MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {/* Show/Hide Results Button */}
            <Tooltip title={showResults ? "Hide Results" : "Show Results"}>
              <IconButton onClick={() => setShowResults(!showResults)} color="primary">
                {showResults ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
            <ToggleButtonGroup value={viewMode} exclusive onChange={(e, newMode) => newMode && setViewMode(newMode)} size="small">
              <ToggleButton value="table"><FilterListIcon /></ToggleButton>
              <ToggleButton value="cards"><BarChartIcon /></ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Season Phase Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, fontWeight: 600, letterSpacing: 0.5 }}>SEASON PHASE</Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
          <Chip label="🏀 2025-26 Regular" onClick={() => setSeasonPhase('regular')} color={seasonPhase === 'regular' ? 'primary' : 'default'} sx={{ bgcolor: seasonPhase === 'regular' ? '#0066CC' : '#2a2a2a', color: seasonPhase === 'regular' ? 'white' : '#888', '&:hover': { bgcolor: seasonPhase === 'regular' ? '#0052a3' : '#333' } }} />
          <Chip label="⭐ All-Star 2026" onClick={() => setSeasonPhase('all-star')} color={seasonPhase === 'all-star' ? 'warning' : 'default'} sx={{ bgcolor: seasonPhase === 'all-star' ? '#FFD700' : '#2a2a2a', color: seasonPhase === 'all-star' ? '#000' : '#888', '&:hover': { bgcolor: seasonPhase === 'all-star' ? '#e6c200' : '#333' } }} />
          <Chip label="🏆 Playoff Push" onClick={() => setSeasonPhase('playoffs')} color={seasonPhase === 'playoffs' ? 'success' : 'default'} sx={{ bgcolor: seasonPhase === 'playoffs' ? '#4CAF50' : '#2a2a2a', color: 'white', '&:hover': { bgcolor: seasonPhase === 'playoffs' ? '#3d8c40' : '#333' } }} />
          <Chip label="📊 Futures 2026" onClick={() => setSeasonPhase('futures')} color={seasonPhase === 'futures' ? 'secondary' : 'default'} sx={{ bgcolor: seasonPhase === 'futures' ? '#9c27b0' : '#2a2a2a', color: 'white', '&:hover': { bgcolor: seasonPhase === 'futures' ? '#7b1fa2' : '#333' } }} />
        </Stack>
      </Paper>

      {/* Market Type Filter */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, fontWeight: 600, letterSpacing: 0.5 }}>BET TYPE</Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
          {['standard', 'alt_line', 'special', 'futures'].map(type => (
            <Chip key={type} label={type === 'alt_line' ? 'Alt Lines' : type === 'standard' ? 'Standard Props' : type === 'special' ? 'Specials' : 'Futures'} onClick={() => setMarketType(type as any)} sx={{ bgcolor: marketType === type ? '#4CAF50' : '#2a2a2a', color: marketType === type ? 'white' : '#888', '&:hover': { bgcolor: marketType === type ? '#3d8c40' : '#333' } }} />
          ))}
        </Stack>
      </Paper>

      {/* Collapsible Results Section */}
      <Collapse in={showResults}>
        {filteredOutcomes.length > 0 ? (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {filteredOutcomes.map((outcome: any, index: number) => renderOutcomeCard(outcome, index))}
          </Grid>
        ) : (
          <Paper sx={{ p: 8, textAlign: 'center', mb: 4, borderRadius: 3 }}>
            <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: alpha('#3b82f6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <AssessmentIcon sx={{ fontSize: 60, color: '#3b82f6' }} />
            </Box>
            {searchQuery || filterOutcome !== 'all' ? (
              <>
                <Typography variant="h5" gutterBottom fontWeight="bold">No {CURRENT_SEASON} predictions found</Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto' }}>Try adjusting your search or filter settings. No predictions match your current criteria.</Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" gutterBottom fontWeight="bold">No February 2026 Data Yet</Typography>
                <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto' }}>
                  {selectedSport === 'nba' ? "Tonight's NBA games (LAL @ BOS, OKC @ DEN) will update outcomes" : `Check back after tonight's ${selectedSport.toUpperCase()} games for ${CURRENT_SEASON} updates`}
                </Typography>
              </>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={handleRetryWithBackoff} startIcon={<RefreshIcon />} sx={{ borderRadius: 2 }}>Retry for 2026 Data</Button>
              <Button variant="outlined" onClick={handleForceRefresh} startIcon={<CachedIcon />} sx={{ borderRadius: 2 }}>Force Refresh</Button>
              <Button variant="outlined" onClick={() => { setSearchQuery(''); setFilterOutcome('all'); }} sx={{ borderRadius: 2 }}>Clear Filters</Button>
            </Box>
          </Paper>
        )}
      </Collapse>

      {/* Tips Section */}
      {filteredOutcomes.length > 0 && (
        <Card sx={{ mt: 4, mb: 4, borderRadius: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}><SparklesIcon sx={{ color: '#f59e0b', fontSize: 28 }} /><Typography variant="h6" fontWeight="bold">📈 February 2026 Season Tips</Typography></Box>
            <Grid container spacing={3}>
              {[
                { title: 'All-Star 2026 Markets', description: 'Special All-Star markets now available. Track Three-Point Contest, Slam Dunk, and All-Star Game MVP predictions.', icon: <StarIcon sx={{ color: '#FFD700' }} /> },
                { title: 'Futures 2026', description: 'ROTY, MVP, and Championship futures now available for the 2026 season. Track long-term predictions here.', icon: <TrophyIcon sx={{ color: '#4CAF50' }} /> },
                { title: 'Playoff Push', description: 'February marks the start of playoff pushes. Watch for increased prediction volume and higher confidence plays.', icon: <TrendingUpIcon sx={{ color: '#0066CC' }} /> }
              ].map((tip, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box sx={{ p: 2 }}><Box display="flex" alignItems="center" gap={2} mb={2}>{tip.icon}<Typography variant="subtitle1" fontWeight="bold">{tip.title}</Typography></Box><Typography variant="body2" color="text.secondary">{tip.description}</Typography></Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <AnalyticsDashboard />
      
      {/* Simulation Modal */}
      <Dialog open={showSimulationModal} onClose={() => !generatingPredictions && setShowSimulationModal(false)}>
        <DialogTitle>{generatingPredictions ? 'Generating AI Predictions...' : 'AI Predictions Generated!'}</DialogTitle>
        <DialogContent>
          {generatingPredictions ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>Analyzing Data with AI...</Typography>
              <Typography variant="body2" color="text.secondary">Processing your query and generating predictions</Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <SparklesIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h6" gutterBottom>AI Predictions Generated!</Typography>
              {predictionResults && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default', textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{predictionResults.analysis}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Source: {predictionResults.source}</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!generatingPredictions && (
            <Button onClick={() => setShowSimulationModal(false)} variant="contained" fullWidth>Continue</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)} message={snackbarMessage} action={<IconButton size="small" aria-label="close" color="inherit" onClick={() => setSnackbarOpen(false)}><CloseIcon fontSize="small" /></IconButton>} />
    </Container>
  );
};

// Simple ClearIcon component for the Clear Cache button
const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default PredictionsOutcomeScreen;
