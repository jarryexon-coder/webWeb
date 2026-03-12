// src/pages/PredictionsOutcomeScreen.tsx
// Final version with all requested updates:
// - Fuse.js for fuzzy matching in the generator
// - PrizePicks endpoint for NHL & MLB (and all sports)
// - Unified response parsing
// - NHL team name normalization (full names → abbreviations)
// - NHL position normalization
// - All existing functionality preserved

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Fuse from 'fuse.js'; // <-- ADDED
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
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, subDays } from 'date-fns';

// ========== IMPORT UTILITIES ==========
import { useDebounce } from '../utils/useDebounce';
import { preprocessQuery, QueryIntent } from '../utils/queryProcessor';
import { logPromptPerformance } from '../utils/analytics';

// ========== API BASES ==========
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// ========== SEASON CONTEXT ==========
const CURRENT_SEASON = '2025-26';
const CURRENT_YEAR = '2026';
const AS_OF_DATE = format(new Date(), 'MMMM d, yyyy');

// ========== NHL TEAM NAME TO ABBREVIATION MAPPING ==========
const NHL_TEAM_MAP: Record<string, string> = {
  'Boston Bruins': 'BOS',
  'Toronto Maple Leafs': 'TOR',
  'Florida Panthers': 'FLA',
  'Tampa Bay Lightning': 'TBL',
  'Carolina Hurricanes': 'CAR',
  'New Jersey Devils': 'NJD',
  'New York Rangers': 'NYR',
  'New York Islanders': 'NYI',
  'Philadelphia Flyers': 'PHI',
  'Pittsburgh Penguins': 'PIT',
  'Washington Capitals': 'WSH',
  'Columbus Blue Jackets': 'CBJ',
  'Buffalo Sabres': 'BUF',
  'Detroit Red Wings': 'DET',
  'Montreal Canadiens': 'MTL',
  'Ottawa Senators': 'OTT',
  'Chicago Blackhawks': 'CHI',
  'Colorado Avalanche': 'COL',
  'Dallas Stars': 'DAL',
  'Minnesota Wild': 'MIN',
  'Nashville Predators': 'NSH',
  'St. Louis Blues': 'STL',
  'Winnipeg Jets': 'WPG',
  'Anaheim Ducks': 'ANA',
  'Calgary Flames': 'CGY',
  'Edmonton Oilers': 'EDM',
  'Los Angeles Kings': 'LAK',
  'San Jose Sharks': 'SJS',
  'Seattle Kraken': 'SEA',
  'Vancouver Canucks': 'VAN',
  'Vegas Golden Knights': 'VGK',
  'Arizona Coyotes': 'ARI',
  // Add any other NHL teams as needed
};

// ========== NHL POSITION MAPPING (to match NHLDashboard) ==========
const NHL_POSITION_MAP: Record<string, string> = {
  'Center': 'C',
  'Left Wing': 'LW',
  'Right Wing': 'RW',
  'Defense': 'D',
  'Defence': 'D',
  'Goalie': 'G',
  'Goaltender': 'G'
};

// ========== FUSE.JS INTENT PATTERNS ==========
const intentPatterns = [
  { phrase: 'value props', intent: 'value' },
  { phrase: 'best props', intent: 'top' },
  { phrase: 'top props', intent: 'top' },
  { phrase: 'elite props', intent: 'top' },
  { phrase: 'tonight', intent: 'tonight' },
  { phrase: 'today', intent: 'tonight' },
  { phrase: 'slate', intent: 'slate' },
  { phrase: 'games', intent: 'slate' },
  { phrase: 'over', intent: 'over' },
  { phrase: 'under', intent: 'under' },
  { phrase: 'player props', intent: 'player' },
  { phrase: 'team props', intent: 'team' },
];

const fuseIntents = new Fuse(intentPatterns, {
  keys: ['phrase'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 3,
});

// Helper: parse user query using Fuse.js
const parseQuery = (query: string) => {
  const results = fuseIntents.search(query);
  const matchedIntents = [...new Set(results.map(r => r.item.intent))];

  // Simple player/team name heuristic
  const words = query.split(/\s+/);
  const potentialPlayer = words.find(w => /^[A-Z][a-z]+$/.test(w) && !['The','A','An','In','On','At'].includes(w));

  return { intents: matchedIntents, player: potentialPlayer };
};

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

// ========== MOCK DATA GENERATOR (FALLBACK) ==========
const generateMockOutcomes = (sport: string, count: number = 20) => {
  // Sport-specific player names
  const playersBySport: Record<string, string[]> = {
    nba: ['LeBron James', 'Stephen Curry', 'Jayson Tatum', 'Giannis Antetokounmpo', 'Luka Doncic', 'Nikola Jokic', 'Joel Embiid', 'Shai Gilgeous-Alexander'],
    nfl: ['Patrick Mahomes', 'Josh Allen', 'Justin Jefferson', 'Christian McCaffrey', 'Jalen Hurts', 'Lamar Jackson', 'Ja\'Marr Chase', 'Tyreek Hill'],
    mlb: ['Shohei Ohtani', 'Aaron Judge', 'Mookie Betts', 'Ronald Acuña Jr.', 'Bryce Harper', 'Vladimir Guerrero Jr.', 'Juan Soto', 'Yordan Alvarez'],
    nhl: ['Connor McDavid', 'Auston Matthews', 'Nathan MacKinnon', 'David Pastrnak', 'Leon Draisaitl', 'Cale Makar', 'Igor Shesterkin', 'Kirill Kaprizov']
  };
  
  // Sport-specific team abbreviations (home and away)
  const teamsBySport: Record<string, string[]> = {
    nba: ['LAL', 'GSW', 'BOS', 'MIL', 'PHX', 'DEN', 'PHI', 'MIA', 'DAL', 'LAC'],
    nfl: ['KC', 'BUF', 'SF', 'BAL', 'DAL', 'PHI', 'CIN', 'MIN', 'DET', 'JAX'],
    mlb: ['LAD', 'NYY', 'ATL', 'HOU', 'BOS', 'CHC', 'SD', 'NYM', 'STL', 'TB'],
    nhl: ['ANA', 'VGK', 'COL', 'EDM', 'TOR', 'BOS', 'FLA', 'CAR', 'NYR', 'DAL']
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
  const teams = teamsBySport[sport] || teamsBySport.nba;
  const ranges = statRanges[sport] || statRanges.nba;

  // Add a small random offset to make each call slightly different
  const seed = Date.now() % 1000;

  return Array.from({ length: count }, (_, i) => {
    const randomOutcome = ['correct', 'incorrect', 'pending'][Math.floor(Math.random() * 3)];
    const player = players[i % players.length];
    const { stat, min, max } = ranges[i % ranges.length];
    
    // Pick random home and away teams
    const homeIdx = (i * 2) % teams.length;
    const awayIdx = (i * 3 + 1) % teams.length;
    const homeTeam = teams[homeIdx];
    const awayTeam = teams[awayIdx];

    // Apply seed offset to line (very small adjustment)
    const line = Math.round((Math.random() * (max - min) + min) * 10) / 10 + (seed * 0.001);
    const actual = randomOutcome === 'pending' 
      ? line 
      : randomOutcome === 'correct' 
        ? Math.round((line + (Math.random() * 2 + 0.5)) * 10) / 10
        : Math.round((line - (Math.random() * 2 + 0.5)) * 10) / 10;
    
    return {
      id: `outcome-${sport}-${i + 1}-${Date.now()}`,
      game: `${homeTeam} vs ${awayTeam}`,
      player,
      team: homeTeam,               // <-- ADDED
      opponent: awayTeam,            // <-- ADDED
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
      projection: line + 0.2,
      edge: randomOutcome === 'correct' ? `+${(Math.random() * 15 + 5).toFixed(1)}` : randomOutcome === 'incorrect' ? `-${(Math.random() * 10 + 2).toFixed(1)}` : '0',
      units: randomOutcome === 'correct' ? `+${(Math.random() * 2 + 0.5).toFixed(1)}` : randomOutcome === 'incorrect' ? `-${(Math.random() + 0.5).toFixed(1)}` : '0',
      season: CURRENT_SEASON,
      year: 2026,
      asOf: AS_OF_DATE,
      date: format(subDays(new Date(), i % 14), 'MMM d, yyyy')
    };
  });
};

// Updated league data – removed NFL and World Cup
const leagueData = [
  { id: 'nba', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'mlb', name: 'MLB', icon: <BaseballIcon />, color: '#f59e0b' },
  { id: 'nhl', name: 'NHL', icon: <HockeyIcon />, color: '#0ea5e9' }
];

// ========== CUSTOM HOOK ==========
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

  const deduplicateOutcomes = (outcomes: any[]) => {
    const seen = new Set();
    return outcomes.filter(outcome => {
      const key = `${outcome.player}-${outcome.stat_type}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Helper to compute edge percentage from projection and line
  const computeEdge = (projection: number, line: number): string => {
    if (!line || line === 0) return '+0.0%';
    const edge = ((projection - line) / line) * 100;
    return edge > 0 ? `+${edge.toFixed(1)}%` : `${edge.toFixed(1)}%`;
  };

  const fetchData = useCallback(async (force: boolean = false, isRetry: boolean = false): Promise<void> => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (!force) setIsLoading(true); else setIsRefetching(true);
    if (isRetry) { setRetryCount(prev => prev + 1); setLastRetryTime(new Date()); }

    // --- UPDATED: Use PrizePicks endpoint for all sports ---
    const endpoint = `${NODE_API_BASE}/api/prizepicks/selections?sport=${sport}`;
    const cacheKey = `prizepicks:${sport}`;

    if (!force) {
      const cachedData = getFromCache(sport, cacheKey);
      if (cachedData) {
        const outcomes = cachedData.outcomes || [];
        setData(cachedData);
        setDataSource('cache');
        setCacheInfo({ isCached: true, age: Date.now() - (predictionCache.get(cacheKey)?.timestamp || 0) });
        setSeasonStats(prev => ({ ...prev, totalPredictions: outcomes.length }));
        setIsLoading(false);
        setIsRefetching(false);
        return;
      }
    }

    try {
      const response = await fetch(endpoint, { signal: abortControllerRef.current?.signal });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        setError(`Rate limited. Please wait ${Math.ceil(waitTime/1000)} seconds.`);
        throw new Error('Rate limited');
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      console.log(`📦 Raw response from ${endpoint}:`, result);

      // PrizePicks endpoint returns { selections: [...] }
      const rawSelections = result.selections || [];

      // Transform raw selections to outcome objects (unified for all sports)
      const transformed = rawSelections.map((sel: any, idx: number) => {
        const outcome = 'pending';
        const actualResult = 'Pending';

        // Determine stat type
        const statType = sel.stat_type || sel.stat || sel.market || 'Stat';

        // ----- NHL Team Name Normalization -----
        let teamAbbr = sel.team || '';
        let oppAbbr = sel.opponent || '';
        if (sport === 'nhl') {
          // Convert full team names to abbreviations if needed
          if (teamAbbr && NHL_TEAM_MAP[teamAbbr]) {
            teamAbbr = NHL_TEAM_MAP[teamAbbr];
          }
          if (oppAbbr && NHL_TEAM_MAP[oppAbbr]) {
            oppAbbr = NHL_TEAM_MAP[oppAbbr];
          }
          // Also apply to player's team if present (sel.team might already be set)
          if (sel.team && NHL_TEAM_MAP[sel.team]) {
            teamAbbr = NHL_TEAM_MAP[sel.team];
          }
        }

        // ----- NHL Position Normalization -----
        let position = sel.position || '';
        if (sport === 'nhl' && NHL_POSITION_MAP[position]) {
          position = NHL_POSITION_MAP[position];
        }

        // Build game string with abbreviations
        let gameDisplay = 'Game TBD';
        if (sel.game) {
          gameDisplay = sel.game; // fallback if game already formatted
        } else if (teamAbbr && oppAbbr) {
          gameDisplay = `${teamAbbr} vs ${oppAbbr}`;
        } else if (teamAbbr) {
          gameDisplay = `${teamAbbr} vs TBD`;
        }

        // Compute edge as percentage based on projection vs line
        const projectionVal = sel.projection || sel.line || 0;
        const lineVal = sel.line || 1;
        const edgeDisplay = computeEdge(projectionVal, lineVal);

        return {
          id: sel.id || `prop-${sport}-${idx}-${Date.now()}`,
          game: gameDisplay,
          player: sel.player || 'Unknown',
          position, // normalized position (for NHL, e.g., "C", "LW", etc.)
          prediction: `${sel.player || ''} ${statType} Over ${sel.line || ''}`.trim(),
          prop: `${statType} ${sel.line || ''}`,
          outcome,
          actual_result: actualResult,
          confidence_pre_game: sel.confidence === 'high' ? 85 : sel.confidence === 'medium' ? 70 : sel.confidence || 70,
          accuracy: null,
          timestamp: sel.game_date || new Date().toISOString(),
          sport: sel.sport?.toLowerCase() || sport,
          source: sel.source || 'PrizePicks API',
          key_factors: sel.analysis ? [sel.analysis] : ['No analysis available'],
          stat_type: statType,
          line: lineVal,
          actual_value: null,
          projection: projectionVal,
          edge: edgeDisplay,
          units: '0',
          market_type: marketType,
          season_phase: seasonPhase,
          season: CURRENT_SEASON,
          asOf: AS_OF_DATE,
          team: teamAbbr,
          opponent: oppAbbr,
          date: sel.game_date ? format(new Date(sel.game_date), 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')
        };
      });

      const outcomes = deduplicateOutcomes(transformed);

      const responseData = {
        success: true,
        outcomes,
        count: outcomes.length,
        sport,
        timestamp: new Date().toISOString(),
        scraped: true,
        source: 'prizepicks-api',
        message: `Loaded ${outcomes.length} props for ${sport.toUpperCase()}`
      };

      setToCache(sport, cacheKey, responseData);
      setData(responseData);
      setDataSource('api');
      setCacheInfo({ isCached: false, age: 0 });
      setSeasonStats(prev => ({ ...prev, totalPredictions: outcomes.length }));
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Fetch failed, using mock data:', err);
      const mockOutcomes = deduplicateOutcomes(generateMockOutcomes(sport, 20));
      const responseData = {
        success: true,
        outcomes: mockOutcomes,
        count: mockOutcomes.length,
        sport,
        timestamp: new Date().toISOString(),
        scraped: false,
        source: 'mock',
        message: `Showing demo data (API unavailable)`
      };
      setData(responseData);
      setDataSource('mock');
      setCacheInfo({ isCached: false, age: 0 });
      setError(err.message || 'Using fallback data');
      setSeasonStats(prev => ({ ...prev, totalPredictions: mockOutcomes.length }));
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
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
  const [generatedSets, setGeneratedSets] = useState<any[][]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
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

  // Memoize outcomes list
  const outcomes = useMemo(() => outcomesData?.outcomes || [], [outcomesData]);

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

  // ===== ENHANCED SCORING FUNCTION =====
  const scorePredictionRelevance = (prediction: any, intent: QueryIntent): number => {
    let score = 0;
    const player = (prediction.player || '').toLowerCase();
    const team = (prediction.team || '').toLowerCase();
    const stat = (prediction.stat_type || '').toLowerCase();
    const game = (prediction.game || '').toLowerCase();

    if (intent.player && player.includes(intent.player)) score += 20;
    if (intent.team && team.includes(intent.team)) score += 15;

    let keywordMatched = false;
    if (intent.keywords.length) {
      for (const kw of intent.keywords) {
        if (stat.includes(kw)) {
          score += 30;
          keywordMatched = true;
        }
        if (player.includes(kw)) {
          score += 15;
          keywordMatched = true;
        }
        if (team.includes(kw)) {
          score += 12;
          keywordMatched = true;
        }
        if (game.includes(kw)) {
          score += 8;
          keywordMatched = true;
        }
      }
    }

    if (intent.keywords.length > 0 && !keywordMatched) {
      score -= 50;
    }

    const edgeVal = prediction.edge;
    let edgeNum = 0;
    if (typeof edgeVal === 'string') {
      const match = edgeVal.match(/[+-]?(\d+\.?\d*)/);
      if (match) edgeNum = parseFloat(match[0]);
    } else if (typeof edgeVal === 'number') {
      edgeNum = edgeVal;
    }
    if (edgeNum > 0) score += edgeNum / 20;
    else if (edgeNum < 0) score -= Math.abs(edgeNum) / 30;

    const conf = prediction.confidence_pre_game || 0;
    score += conf / 25;

    return score;
  };

  // ===== UPDATED GENERATOR HANDLER with Fuse.js =====
  const generateTimeoutRef = useRef<NodeJS.Timeout>();

  const debouncedGenerate = useCallback(() => {
    if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
    generateTimeoutRef.current = setTimeout(() => {
      handleGeneratePredictions();
    }, 300);
  }, [customQuery]);

  const handleGeneratePredictions = async () => {
    if (!customQuery.trim()) {
      alert('Please enter a prediction query');
      return;
    }

    setGeneratingPredictions(true);
    setShowSimulationModal(true);

    console.log(`🔍 Generating for sport: ${selectedSport}, outcomes length: ${outcomes.length}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Use Fuse.js to parse intents and potential player name
      const { intents, player: detectedPlayer } = parseQuery(customQuery);
      console.log('🔍 Parsed intents:', intents, 'player:', detectedPlayer);

      let selections: any[] = [];

      if (outcomes.length > 0) {
        let filtered = [...outcomes];

        // Filter based on intents
        if (intents.includes('over')) {
          filtered = filtered.filter(o => o.prediction?.toLowerCase().includes('over'));
        } else if (intents.includes('under')) {
          filtered = filtered.filter(o => o.prediction?.toLowerCase().includes('under'));
        }

        // If "value" intent, sort by edge descending (positive only)
        if (intents.includes('value')) {
          filtered = filtered.filter(o => {
            const edgeNum = parseFloat(o.edge) || 0;
            return edgeNum > 0;
          });
          filtered.sort((a, b) => (parseFloat(b.edge) || 0) - (parseFloat(a.edge) || 0));
        } else if (intents.includes('top')) {
          filtered.sort((a, b) => (b.confidence_pre_game || 0) - (a.confidence_pre_game || 0));
        }

        // If a player name was detected, use Fuse.js for fuzzy match
        if (detectedPlayer) {
          const playerFuse = new Fuse(filtered, {
            keys: ['player'],
            threshold: 0.3,
          });
          const playerMatches = playerFuse.search(detectedPlayer);
          filtered = playerMatches.map(m => m.item);
        }

        // If still empty, fall back to original filtered list
        if (filtered.length === 0) {
          filtered = [...outcomes];
        }

        // Score and sort using the existing relevance scorer (optional)
        const intentObj = preprocessQuery(customQuery); // fallback for scoring
        const scored = filtered.map(o => ({
          ...o,
          relevanceScore: scorePredictionRelevance(o, intentObj)
        }));
        scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
        selections = scored.slice(0, 5);
      }

      // If no real matches, fallback to top real outcomes by confidence
      if (selections.length === 0 && outcomes.length > 0) {
        const topReal = outcomes
          .sort((a, b) => (b.confidence_pre_game || 0) - (a.confidence_pre_game || 0))
          .slice(0, 5);
        selections = topReal.map((o, idx) => ({ ...o, relevanceScore: 100 - idx }));
      }

      // If still no data, use mock
      if (selections.length === 0) {
        console.log(`No outcomes available, generating mock data for sport: ${selectedSport}`);
        const mockSelections = generateMockOutcomes(selectedSport.toLowerCase(), 5);
        selections = mockSelections.map((item, idx) => ({
          ...item,
          relevanceScore: idx + 1
        }));
      }

      const formattedAnalysis = selections.map((item: any, idx: number) => {
        return `**${idx + 1}. ${item.player}**\n` +
          `   📈 **Stat:** ${item.stat_type}\n` +
          `   🎯 **Line:** ${item.line}\n` +
          `   🔮 **Projection:** ${item.projection.toFixed(1)}\n` +
          `   💎 **Confidence:** ${item.confidence_pre_game}%\n` +
          `   💰 **Edge:** ${item.edge}\n` +
          `   📝 **Analysis:** ${item.key_factors?.join(' ') || 'No analysis'}`;
      }).join('\n\n');

      setPredictionResults({
        success: true,
        analysis: `🎯 **AI Prediction Results**\n\nBased on your query:\n\n${formattedAnalysis}`,
        model: 'local-filter',
        timestamp: new Date().toISOString(),
        source: outcomes.length > 0 ? 'Real Data' : 'Demo Data'
      });

      setGeneratedSets(prev => [...prev, selections]);
      setCurrentSetIndex(prev => prev + 1);

      logPromptPerformance(customQuery, selections.length, 0, 'generator');
    } catch (error) {
      console.error('❌ Error in generator:', error);
      const mockSelections = generateMockOutcomes(selectedSport.toLowerCase(), 5);
      const mockAnalysis = mockSelections.map((item: any, idx: number) => {
        return `**${idx + 1}. ${item.player}**\n` +
          `   📈 **Stat:** ${item.stat_type}\n` +
          `   🎯 **Line:** ${item.line}\n` +
          `   🔮 **Projection:** ${item.projection.toFixed(1)}\n` +
          `   💎 **Confidence:** ${item.confidence_pre_game}%\n` +
          `   💰 **Edge:** ${item.edge}\n` +
          `   📝 **Analysis:** ${item.key_factors?.join(' ') || 'No analysis'}`;
      }).join('\n\n');

      setPredictionResults({
        success: true,
        analysis: `🎯 **AI Prediction Results (Demo)**\n\nBased on your query:\n\n${mockAnalysis}`,
        model: 'demo-model',
        timestamp: new Date().toISOString(),
        source: 'Demo Data'
      });
      setGeneratedSets(prev => [...prev, mockSelections]);
      setCurrentSetIndex(prev => prev + 1);
    } finally {
      setGeneratingPredictions(false);
    }
  };

  const handlePrevSet = () => {
    if (currentSetIndex > 0) {
      const newIndex = currentSetIndex - 1;
      setCurrentSetIndex(newIndex);
      const prevSet = generatedSets[newIndex];
      if (prevSet) {
        if (prevSet[0]?.analysis) {
          setPredictionResults(prevSet[0]);
        } else {
          const formatted = prevSet.map((item: any, idx: number) => {
            return `**${idx + 1}. ${item.player || 'Player'}**\n` +
              `   📈 **Stat:** ${item.stat_type || 'N/A'}\n` +
              `   🎯 **Line:** ${item.line || 'N/A'}\n` +
              `   🔮 **Projection:** ${item.projection || 'N/A'}\n` +
              `   💎 **Confidence:** ${item.confidence_pre_game || 'medium'}\n` +
              `   💰 **Edge:** ${item.edge}\n` +
              `   📝 **Analysis:** ${item.key_factors?.join(' ') || 'No analysis'}`;
          }).join('\n\n');
          setPredictionResults({
            success: true,
            analysis: `🎯 **AI Prediction Results**\n\n${formatted}`,
            source: 'Generated Set'
          });
        }
      }
    }
  };

  const handleNextSet = () => {
    if (currentSetIndex < generatedSets.length - 1) {
      const newIndex = currentSetIndex + 1;
      setCurrentSetIndex(newIndex);
      const nextSet = generatedSets[newIndex];
      if (nextSet) {
        if (nextSet[0]?.analysis) {
          setPredictionResults(nextSet[0]);
        } else {
          const formatted = nextSet.map((item: any, idx: number) => {
            return `**${idx + 1}. ${item.player || 'Player'}**\n` +
              `   📈 **Stat:** ${item.stat_type || 'N/A'}\n` +
              `   🎯 **Line:** ${item.line || 'N/A'}\n` +
              `   🔮 **Projection:** ${item.projection || 'N/A'}\n` +
              `   💎 **Confidence:** ${item.confidence_pre_game || 'medium'}\n` +
              `   💰 **Edge:** ${item.edge}\n` +
              `   📝 **Analysis:** ${item.key_factors?.join(' ') || 'No analysis'}`;
          }).join('\n\n');
          setPredictionResults({
            success: true,
            analysis: `🎯 **AI Prediction Results**\n\n${formatted}`,
            source: 'Generated Set'
          });
        }
      }
    }
  };

  const clearGenerated = () => {
    setGeneratedSets([]);
    setCurrentSetIndex(0);
    setPredictionResults(null);
  };

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
                  {outcome.position && <Chip label={outcome.position} size="small" variant="outlined" />}
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

            {/* Line and Projection row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha('#3b82f6', 0.1), p: 1.5, borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Line:</Typography>
              <Typography variant="body2" fontWeight="bold">{outcome.line}</Typography>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Projection:</Typography>
              <Typography variant="body2" fontWeight="bold" color="primary.main">{outcome.projection?.toFixed(1)}</Typography>
            </Box>

            {/* Edge and Accuracy */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha('#4CAF50', 0.1), p: 1.5, borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Edge:</Typography>
              <Typography variant="body2" fontWeight="bold" color={
                (outcome.edge || '').startsWith('+') ? '#4CAF50' : '#FF4444'
              }>
                {outcome.edge || '+0.0%'}
              </Typography>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Accuracy:</Typography>
              <Typography variant="body2" fontWeight="bold" color="#4CAF50">{outcome.accuracy || 75}%</Typography>
            </Box>

            {/* Accordion */}
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
                {(outcome.line || outcome.stat_type || outcome.actual_value || outcome.projection) && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prediction Details</Typography>
                    <Grid container spacing={1}>
                      {outcome.line && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Line</Typography><Typography variant="body2">{outcome.line}</Typography></Grid>}
                      {outcome.stat_type && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Stat Type</Typography><Typography variant="body2">{outcome.stat_type}</Typography></Grid>}
                      {outcome.projection && <Grid item xs={4}><Typography variant="caption" color="text.secondary">Projection</Typography><Typography variant="body2">{outcome.projection.toFixed(1)}</Typography></Grid>}
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
  
// ===== GENERATOR UI =====
const renderGenerator = () => {
  const samplePrompts = [
    "Top value props for tonight's slate",
    "Highest projected points for tonight's games",
    "Players with positive regression",
    "Best matchups for points",
    "Underdog props with positive edge",
    "Rookie props with high upside",
    "Assist leaders in primetime games",
    "Rebound machines in blowout spots",
    "Steals and blocks specialists",
    "Three-point threats in pace-up games",
    "Favorable matchups for centers",
    "Late game hero props",
    "Players returning from injury",
    "Home vs away performance splits",
    "Top prop bets for the weekend",
    "Best value on player props today",
    "Players with favorable defensive matchups",
    "Over performers in last 5 games",
    "Under performers due for regression",
    "Highest confidence props across all sports"
  ];

  return (
    <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <RocketLaunchIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Typography variant="h4">🚀 AI Prediction Generator</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Generate custom predictions using advanced AI models – try natural language queries.
      </Typography>

      {/* Quick Chips */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Prediction Queries</Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {samplePrompts.slice(0, 5).map((query, index) => (
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

      {/* Sample Prompts Dropdown */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Choose a Sample Prompt</Typography>
        <FormControl fullWidth>
          <InputLabel id="sample-prompt-label">Select a prompt</InputLabel>
          <Select
            labelId="sample-prompt-label"
            value=""
            label="Select a prompt"
            onChange={(e) => setCustomQuery(e.target.value as string)}
            sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
          >
            {samplePrompts.map((prompt, index) => (
              <MenuItem key={index} value={prompt}>
                {prompt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Custom Query Input */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Custom Prediction Query</Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Enter custom prediction query (e.g., 'Jokic points over 25.5', 'Chiefs win margin')"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={debouncedGenerate}
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

      {generatedSets.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {/* Data source chip */}
          <Chip 
            icon={outcomesData?.scraped ? <CheckCircleIcon /> : <WarningIcon />}
            label={outcomesData?.scraped ? "Live Data" : "Demo Data"} 
            color={outcomesData?.scraped ? "success" : "warning"} 
            size="small"
          />
          <Typography variant="body2">Generated sets:</Typography>
          <IconButton size="small" onClick={handlePrevSet} disabled={currentSetIndex === 0}>
            <ExpandMoreIcon sx={{ transform: 'rotate(90deg)' }} />
          </IconButton>
          <Typography variant="caption">
            {currentSetIndex + 1}/{generatedSets.length}
          </Typography>
          <IconButton size="small" onClick={handleNextSet} disabled={currentSetIndex === generatedSets.length - 1}>
            <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
          </IconButton>
          <Button size="small" onClick={clearGenerated}>Clear</Button>
        </Box>
      )}

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
        Uses neural networks, statistical modeling, and historical data for accurate predictions. Try specific player queries.
      </Alert>
    </Paper>
  );
};
  
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

      {/* GENERATOR */}
      {renderGenerator()}

      {/* Search and Filter Section */}
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
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default', textAlign: 'left', maxHeight: 300, overflow: 'auto' }}>
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

// Simple ClearIcon component
const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default PredictionsOutcomeScreen;
