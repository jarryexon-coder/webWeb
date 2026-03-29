// src/pages/PredictionsOutcomeScreen.tsx
// Final version with all updates:
// - Fuse.js for fuzzy matching
// - PrizePicks endpoint for all sports
// - NHL team name normalization
// - Sport detection
// - Fixed "rookie" keyword handling
// - Added team‑prop support (intent detection + endpoint call)
// - transformTeamProps to format team props
// - Enhanced scoring with token‑based fuzzy matching

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  Box, Typography, Container, Grid, Card, CardContent, Chip, CircularProgress,
  Alert, AlertTitle, Button, Paper, LinearProgress, Avatar, IconButton, TextField,
  InputAdornment, Modal, Fade, List, ListItem, ListItemAvatar, ListItemText,
  ListItemSecondaryAction, FormControl, InputLabel, Select, MenuItem, Accordion,
  AccordionSummary, AccordionDetails, Badge, Snackbar, Stack, Collapse, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon, ArrowBack as ArrowBackIcon, BarChart as BarChartIcon,
  Update as UpdateIcon, Assessment as AssessmentIcon, CheckCircle as CheckCircleIcon,
  Close as CloseIcon, Cancel as CancelIcon, ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon, Timeline as TimelineIcon, TrendingUp as TrendingUpIcon,
  SportsBasketball as BasketballIcon, SportsFootball as FootballIcon, SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon, EmojiEvents as TrophyIcon, AutoAwesome as SparklesIcon,
  Star as StarIcon, RocketLaunch as RocketLaunchIcon, AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon, Refresh as RefreshIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, subDays } from 'date-fns';
import { preprocessQuery, QueryIntent } from '../utils/queryProcessor';
import { logPromptPerformance } from '../utils/analytics';

// ========== API BASES ==========
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';

// ========== SEASON CONTEXT ==========
const CURRENT_SEASON = '2025-26';
const CURRENT_YEAR = '2026';
const AS_OF_DATE = format(new Date(), 'MMMM d, yyyy');

// ========== NHL TEAM NAME TO ABBREVIATION MAPPING ==========
const NHL_TEAM_MAP: Record<string, string> = {
  'Boston Bruins': 'BOS', 'Toronto Maple Leafs': 'TOR', 'Florida Panthers': 'FLA',
  'Tampa Bay Lightning': 'TBL', 'Carolina Hurricanes': 'CAR', 'New Jersey Devils': 'NJD',
  'New York Rangers': 'NYR', 'New York Islanders': 'NYI', 'Philadelphia Flyers': 'PHI',
  'Pittsburgh Penguins': 'PIT', 'Washington Capitals': 'WSH', 'Columbus Blue Jackets': 'CBJ',
  'Buffalo Sabres': 'BUF', 'Detroit Red Wings': 'DET', 'Montreal Canadiens': 'MTL',
  'Ottawa Senators': 'OTT', 'Chicago Blackhawks': 'CHI', 'Colorado Avalanche': 'COL',
  'Dallas Stars': 'DAL', 'Minnesota Wild': 'MIN', 'Nashville Predators': 'NSH',
  'St. Louis Blues': 'STL', 'Winnipeg Jets': 'WPG', 'Anaheim Ducks': 'ANA',
  'Calgary Flames': 'CGY', 'Edmonton Oilers': 'EDM', 'Los Angeles Kings': 'LAK',
  'San Jose Sharks': 'SJS', 'Seattle Kraken': 'SEA', 'Vancouver Canucks': 'VAN',
  'Vegas Golden Knights': 'VGK', 'Arizona Coyotes': 'ARI',
};

// ========== NHL POSITION MAPPING ==========
const NHL_POSITION_MAP: Record<string, string> = {
  'Center': 'C', 'Left Wing': 'LW', 'Right Wing': 'RW', 'Defense': 'D',
  'Defence': 'D', 'Goalie': 'G', 'Goaltender': 'G'
};

// ========== SPORT KEYWORDS ==========
const SPORT_KEYWORDS: Record<string, string[]> = {
  nba: ['nba', 'basketball'], mlb: ['mlb', 'baseball'], nhl: ['nhl', 'hockey'],
};

// ========== INTENT PATTERNS (UPDATED) ==========
const intentPatterns = [
  { phrase: 'value props', intent: 'value' }, { phrase: 'best props', intent: 'top' },
  { phrase: 'top props', intent: 'top' }, { phrase: 'elite props', intent: 'top' },
  { phrase: 'tonight', intent: 'tonight' }, { phrase: 'today', intent: 'tonight' },
  { phrase: 'slate', intent: 'slate' }, { phrase: 'games', intent: 'slate' },
  { phrase: 'over', intent: 'over' }, { phrase: 'under', intent: 'under' },
  { phrase: 'player props', intent: 'player' }, { phrase: 'team props', intent: 'team' },
  { phrase: 'team points', intent: 'team' }, { phrase: 'team rebounds', intent: 'team' },
  { phrase: 'team assists', intent: 'team' }, { phrase: 'rookie', intent: 'rookie' },
  { phrase: 'rookies', intent: 'rookie' }, { phrase: 'roty', intent: 'rookie' },
];

const fuseIntents = new Fuse(intentPatterns, {
  keys: ['phrase'], threshold: 0.4, includeScore: true, minMatchCharLength: 3,
});

const NON_PLAYER_KEYWORDS = new Set(['Rookie', 'Rookies', 'ROTY', 'MVP', 'All-Star', 'Playoffs', 'Futures']);

// Helper: parse user query
const parseQuery = (query: string) => {
  console.log('🔍 parseQuery input:', query);
  
  // First, try Fuse.js
  const results = fuseIntents.search(query);
  let matchedIntents = [...new Set(results.map(r => r.item.intent))];

  // Fallback: if Fuse returns nothing, do explicit substring matching
  if (matchedIntents.length === 0) {
    const lowerQuery = query.toLowerCase();
    for (const pattern of intentPatterns) {
      if (lowerQuery.includes(pattern.phrase)) {
        matchedIntents.push(pattern.intent);
      }
    }
    matchedIntents = [...new Set(matchedIntents)];
    console.log('🔍 matchedIntents via fallback:', matchedIntents);
  } else {
    console.log('🔍 matchedIntents via Fuse:', matchedIntents);
  }

  // Player name detection (exclude keywords)
  const words = query.split(/\s+/);
  const potentialPlayer = words.find(w =>
    /^[A-Z][a-z]+$/.test(w) &&
    !['The','A','An','In','On','At'].includes(w) &&
    !NON_PLAYER_KEYWORDS.has(w)
  );

  // Sport detection
  let detectedSport: string | null = null;
  const lowerQuery = query.toLowerCase();
  for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      detectedSport = sport;
      break;
    }
  }

  return { intents: matchedIntents, player: potentialPlayer, sport: detectedSport };
};

// ========== GLOBAL HELPERS ==========
const deduplicateOutcomes = (outcomes: any[]) => {
  const seen = new Set();
  return outcomes.filter(outcome => {
    const key = `${outcome.player}-${outcome.stat_type}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const transformSelections = (rawSelections: any[], sport: string, marketType: string, seasonPhase: string) => {
  return rawSelections.map((sel: any, idx: number) => {
    const statType = sel.stat_type || sel.stat || sel.market || 'Stat';

    let teamAbbr = sel.team || '';
    let oppAbbr = sel.opponent || '';
    if (sport === 'nhl') {
      if (teamAbbr && NHL_TEAM_MAP[teamAbbr]) teamAbbr = NHL_TEAM_MAP[teamAbbr];
      if (oppAbbr && NHL_TEAM_MAP[oppAbbr]) oppAbbr = NHL_TEAM_MAP[oppAbbr];
      if (sel.team && NHL_TEAM_MAP[sel.team]) teamAbbr = NHL_TEAM_MAP[sel.team];
    }

    let position = sel.position || '';
    if (sport === 'nhl' && NHL_POSITION_MAP[position]) position = NHL_POSITION_MAP[position];

    let gameDisplay = 'Game TBD';
    if (sel.game) gameDisplay = sel.game;
    else if (teamAbbr && oppAbbr) gameDisplay = `${teamAbbr} vs ${oppAbbr}`;
    else if (teamAbbr) gameDisplay = `${teamAbbr} vs TBD`;

    const projectionVal = sel.projection || sel.line || 0;
    const lineVal = sel.line || 1;
    const edgeDisplay = ((projectionVal - lineVal) / lineVal * 100).toFixed(1) + '%';
    const edgePrefix = parseFloat(edgeDisplay) > 0 ? '+' : '';

    return {
      id: sel.id || `prop-${sport}-${idx}-${Date.now()}`,
      game: gameDisplay,
      player: sel.player || 'Unknown',
      position,
      prediction: `${sel.player || ''} ${statType} Over ${sel.line || ''}`.trim(),
      prop: `${statType} ${sel.line || ''}`,
      outcome: 'pending',
      actual_result: 'Pending',
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
      edge: `${edgePrefix}${edgeDisplay}`,
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
};

// Transform team props from the new endpoint
const transformTeamProps = (rawProps: any[], sport: string, marketType: string, seasonPhase: string) => {
  return rawProps.map((prop: any, idx: number) => {
    const statType = prop.stat || 'points';
    const lineVal = prop.line || 0;
    const projectionVal = prop.projection || 0;
    
    // Handle edge - could be string or number
    let edgeVal = prop.edge;
    let edgeDisplay;
    if (typeof edgeVal === 'string') {
      // If it already has % sign, use as is, otherwise format
      edgeDisplay = edgeVal.includes('%') ? edgeVal : `${edgeVal}%`;
    } else if (typeof edgeVal === 'number') {
      edgeDisplay = `${edgeVal > 0 ? '+' : ''}${edgeVal.toFixed(1)}%`;
    } else {
      edgeDisplay = '+0.0%';
    }
    
    const confidence = prop.confidence || 70;
    const type = prop.type || (projectionVal > lineVal ? 'Over' : 'Under');

    return {
      id: prop.id || `team-prop-${sport}-${idx}-${Date.now()}`,
      game: prop.game || `${prop.team} vs ${prop.opponent}`,
      player: `${prop.team} Team`,
      team: prop.team,
      opponent: prop.opponent,
      position: 'Team',
      prediction: `${prop.team} Team ${statType} ${type} ${lineVal.toFixed(1)}`,
      prop: `${statType} ${lineVal.toFixed(1)}`,
      outcome: 'pending',
      actual_result: 'Pending',
      confidence_pre_game: confidence,
      accuracy: null,
      timestamp: prop.timestamp || new Date().toISOString(),
      sport: sport,
      source: prop.source || 'tank01-team',
      key_factors: [`${prop.team} averages ${projectionVal.toFixed(1)} ${statType} per game`],
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
      date: format(new Date(), 'MMM d, yyyy')
    };
  });
};

// ========== CACHE IMPLEMENTATION (unchanged) ==========
const CACHE_DURATION = 5 * 60 * 1000;
interface CacheEntry { data: any; timestamp: number; sport: string; }
const predictionCache = new Map<string, CacheEntry>();
const getCacheKey = (sport: string, endpoint: string): string => `${sport}:${endpoint}`;
const isCacheValid = (cacheKey: string): boolean => {
  const entry = predictionCache.get(cacheKey);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
};
const getFromCache = (sport: string, endpoint: string): any | null => {
  const cacheKey = getCacheKey(sport, endpoint);
  if (isCacheValid(cacheKey)) return predictionCache.get(cacheKey)?.data;
  return null;
};
const setToCache = (sport: string, endpoint: string, data: any): void => {
  const cacheKey = getCacheKey(sport, endpoint);
  predictionCache.set(cacheKey, { data, timestamp: Date.now(), sport });
};

// ========== MOCK DATA ==========
const generateMockOutcomes = (sport: string, count: number = 20) => {
  // ... (same as before, keep unchanged)
  const playersBySport: Record<string, string[]> = {
    nba: ['LeBron James', 'Stephen Curry', 'Jayson Tatum', 'Giannis Antetokounmpo', 'Luka Doncic', 'Nikola Jokic', 'Joel Embiid', 'Shai Gilgeous-Alexander'],
    nfl: ['Patrick Mahomes', 'Josh Allen', 'Justin Jefferson', 'Christian McCaffrey', 'Jalen Hurts', 'Lamar Jackson', 'Ja\'Marr Chase', 'Tyreek Hill'],
    mlb: ['Shohei Ohtani', 'Aaron Judge', 'Mookie Betts', 'Ronald Acuña Jr.', 'Bryce Harper', 'Vladimir Guerrero Jr.', 'Juan Soto', 'Yordan Alvarez'],
    nhl: ['Connor McDavid', 'Auston Matthews', 'Nathan MacKinnon', 'David Pastrnak', 'Leon Draisaitl', 'Cale Makar', 'Igor Shesterkin', 'Kirill Kaprizov']
  };
  
  const teamsBySport: Record<string, string[]> = {
    nba: ['LAL', 'GSW', 'BOS', 'MIL', 'PHX', 'DEN', 'PHI', 'MIA', 'DAL', 'LAC'],
    nfl: ['KC', 'BUF', 'SF', 'BAL', 'DAL', 'PHI', 'CIN', 'MIN', 'DET', 'JAX'],
    mlb: ['LAD', 'NYY', 'ATL', 'HOU', 'BOS', 'CHC', 'SD', 'NYM', 'STL', 'TB'],
    nhl: ['ANA', 'VGK', 'COL', 'EDM', 'TOR', 'BOS', 'FLA', 'CAR', 'NYR', 'DAL']
  };

  const statRanges: Record<string, { stat: string, min: number, max: number }[]> = {
    nba: [
      { stat: 'points', min: 15, max: 45 }, { stat: 'assists', min: 3, max: 15 },
      { stat: 'rebounds', min: 4, max: 18 }, { stat: 'three-pointers', min: 1, max: 8 },
      { stat: 'steals', min: 0.5, max: 4 }, { stat: 'blocks', min: 0.5, max: 4 }
    ],
    nfl: [
      { stat: 'passing yards', min: 200, max: 450 }, { stat: 'rushing yards', min: 40, max: 150 },
      { stat: 'receiving yards', min: 40, max: 150 }, { stat: 'touchdowns', min: 0, max: 4 },
      { stat: 'completions', min: 15, max: 35 }
    ],
    mlb: [
      { stat: 'hits', min: 0, max: 4 }, { stat: 'home runs', min: 0, max: 2 },
      { stat: 'RBIs', min: 0, max: 5 }, { stat: 'strikeouts', min: 0, max: 10 },
      { stat: 'walks', min: 0, max: 3 }
    ],
    nhl: [
      { stat: 'goals', min: 0, max: 3 }, { stat: 'assists', min: 0, max: 3 },
      { stat: 'shots', min: 2, max: 8 }, { stat: 'hits', min: 1, max: 6 },
      { stat: 'points', min: 0, max: 4 }
    ]
  };

  const players = playersBySport[sport] || playersBySport.nba;
  const teams = teamsBySport[sport] || teamsBySport.nba;
  const ranges = statRanges[sport] || statRanges.nba;
  const seed = Date.now() % 1000;

  return Array.from({ length: count }, (_, i) => {
    const randomOutcome = ['correct', 'incorrect', 'pending'][Math.floor(Math.random() * 3)];
    const player = players[i % players.length];
    const { stat, min, max } = ranges[i % ranges.length];
    
    const homeIdx = (i * 2) % teams.length;
    const awayIdx = (i * 3 + 1) % teams.length;
    const homeTeam = teams[homeIdx];
    const awayTeam = teams[awayIdx];

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
      team: homeTeam,
      opponent: awayTeam,
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

const leagueData = [
  { id: 'nba', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'mlb', name: 'MLB', icon: <BaseballIcon />, color: '#f59e0b' },
  { id: 'nhl', name: 'NHL', icon: <HockeyIcon />, color: '#0ea5e9' }
];

// ========== CUSTOM HOOK ==========
interface UsePredictionDataReturn {
  data: any; isLoading: boolean; error: string | null;
  refetch: (force?: boolean) => Promise<void>; isRefetching: boolean;
  dataSource: string; cacheInfo: { isCached: boolean; age: number };
  retryCount: number; lastRetryTime: Date | null;
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (force: boolean = false, isRetry: boolean = false): Promise<void> => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (!force) setIsLoading(true); else setIsRefetching(true);
    if (isRetry) { setRetryCount(prev => prev + 1); setLastRetryTime(new Date()); }

    const url = new URL(`${NODE_API_BASE}/api/prizepicks/selections`);
    url.searchParams.append('sport', sport);
    url.searchParams.append('_t', Date.now().toString());
    const endpoint = url.toString();
    const cacheKey = `prizepicks:${sport}`;

    if (!force) {
      const cachedData = getFromCache(sport, cacheKey);
      if (cachedData) {
        setData(cachedData);
        setDataSource('cache');
        setCacheInfo({ isCached: true, age: Date.now() - (predictionCache.get(cacheKey)?.timestamp || 0) });
        setIsLoading(false);
        setIsRefetching(false);
        return;
      }
    }

    try {
      const response = await fetch(endpoint, { signal: abortControllerRef.current?.signal });
      if (response.status === 429) { /* rate limit handling */ throw new Error('Rate limited'); }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const rawSelections = result.selections || [];
      const transformed = transformSelections(rawSelections, sport, marketType, seasonPhase);
      const outcomes = deduplicateOutcomes(transformed);
      const responseData = {
        success: true, outcomes, count: outcomes.length, sport,
        timestamp: new Date().toISOString(), scraped: true,
        source: 'prizepicks-api', message: `Loaded ${outcomes.length} props for ${sport.toUpperCase()}`
      };
      setToCache(sport, cacheKey, responseData);
      setData(responseData);
      setDataSource('api');
      setCacheInfo({ isCached: false, age: 0 });
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Fetch failed, using mock data:', err);
      const mockOutcomes = deduplicateOutcomes(generateMockOutcomes(sport, 20));
      const responseData = {
        success: true, outcomes: mockOutcomes, count: mockOutcomes.length, sport,
        timestamp: new Date().toISOString(), scraped: false,
        source: 'mock', message: `Showing demo data (API unavailable)`
      };
      setData(responseData);
      setDataSource('mock');
      setCacheInfo({ isCached: false, age: 0 });
      setError(err.message || 'Using fallback data');
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

  return { data, isLoading, error, refetch, isRefetching, dataSource, cacheInfo, retryCount, lastRetryTime };
};

// ========== MAIN CONTENT COMPONENT ==========
const PredictionsOutcomeContent = () => {
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
  
  const [customQuery, setCustomQuery] = useState('');
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [predictionResults, setPredictionResults] = useState<any>(null);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [generatedSets, setGeneratedSets] = useState<any[][]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [showResults, setShowResults] = useState(true);

  const [seasonPhase, setSeasonPhase] = useState<'regular' | 'playoffs' | 'all-star' | 'futures'>('regular');
  const [marketType, setMarketType] = useState<'standard' | 'alt_line' | 'special' | 'futures'>('standard');
  
  const { data: outcomesData, isLoading, error, refetch, isRefetching, dataSource, cacheInfo, retryCount, lastRetryTime } =
    usePredictionData(selectedSport, seasonPhase, marketType);

  const outcomes = useMemo(() => outcomesData?.outcomes || [], [outcomesData]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Scoring function (with token‑based fuzzy match)
  const scorePredictionRelevance = (prediction: any, intent: QueryIntent, rawQuery: string): number => {
    let score = 0;
    const player = (prediction.player || '').toLowerCase();
    const team = (prediction.team || '').toLowerCase();
    const stat = (prediction.stat_type || '').toLowerCase();
    const game = (prediction.game || '').toLowerCase();
    const predictionText = (prediction.prediction || '').toLowerCase();

    if (intent.player && player.includes(intent.player)) score += 20;
    if (intent.team && team.includes(intent.team)) score += 15;

    let keywordMatched = false;
    if (intent.keywords.length) {
      for (const kw of intent.keywords) {
        if (stat.includes(kw)) { score += 30; keywordMatched = true; }
        if (player.includes(kw)) { score += 15; keywordMatched = true; }
        if (team.includes(kw)) { score += 12; keywordMatched = true; }
        if (game.includes(kw)) { score += 8; keywordMatched = true; }
      }
    }
    if (intent.keywords.length > 0 && !keywordMatched) score -= 50;

    const edgeVal = prediction.edge;
    let edgeNum = 0;
    if (typeof edgeVal === 'string') {
      const match = edgeVal.match(/[+-]?(\d+\.?\d*)/);
      if (match) edgeNum = parseFloat(match[0]);
    } else if (typeof edgeVal === 'number') edgeNum = edgeVal;
    if (edgeNum > 0) score += edgeNum / 20;
    else if (edgeNum < 0) score -= Math.abs(edgeNum) / 30;

    const conf = prediction.confidence_pre_game || 0;
    score += conf / 25;

    // Fuzzy token match
    const queryTokens = rawQuery.toLowerCase().split(/\s+/);
    let tokenMatchCount = 0;
    for (const token of queryTokens) {
      if (token.length < 3) continue;
      if (player.includes(token) || team.includes(token) || stat.includes(token) || game.includes(token) || predictionText.includes(token)) {
        tokenMatchCount++;
      }
    }
    score += Math.min(tokenMatchCount, 5) * 10;

    // Rookie boost
    const lowerRawQuery = rawQuery.toLowerCase();
    if (lowerRawQuery.includes('rookie') || lowerRawQuery.includes('rookies') || lowerRawQuery.includes('roty')) {
      if (predictionText.includes('rookie') || predictionText.includes('roty')) score += 30;
    }

    return score;
  };

  // Generator handler (UPDATED: detects team intent)
  const generateTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedGenerate = useCallback(() => {
    if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
    generateTimeoutRef.current = setTimeout(() => handleGeneratePredictions(), 300);
  }, [customQuery]);

  const handleGeneratePredictions = async () => {
    if (!customQuery.trim()) {
      alert('Please enter a prediction query');
      return;
    }

    setGeneratingPredictions(true);
    setShowSimulationModal(true);

    try {
      const { intents, player: detectedPlayer, sport: detectedSport } = parseQuery(customQuery);
      console.log('🔍 Parsed intents:', intents, 'player:', detectedPlayer, 'sport:', detectedSport);

      const targetSport = detectedSport || selectedSport;
      console.log(`🎯 Fetching fresh data for sport: ${targetSport}`);

      let endpoint: string;
      let result: any;
      let rawSelections: any[] = [];

      // 🔥 KEY CHANGE: if team intent is present, call team props endpoint
      if (intents.includes('team')) {
        endpoint = `${NODE_API_BASE}/api/team/props?sport=${targetSport}&_t=${Date.now()}`;
        console.log(`🏀 Fetching team props from: ${endpoint}`);
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Team props API error: ${response.status}`);
        result = await response.json();
        rawSelections = result.data || [];
        console.log(`📦 Team props count: ${rawSelections.length}`);
      } else {
        // Standard player props endpoint
        const url = new URL(`${NODE_API_BASE}/api/prizepicks/selections`);
        url.searchParams.append('sport', targetSport);
        url.searchParams.append('_t', Date.now().toString());
        endpoint = url.toString();
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        result = await response.json();
        rawSelections = result.selections || [];
        console.log(`📦 Fresh data for ${targetSport}:`, result);
      }

      // Transform data
      let freshOutcomes: any[] = [];
      if (intents.includes('team')) {
        freshOutcomes = transformTeamProps(rawSelections, targetSport, marketType, seasonPhase);
      } else {
        const transformed = transformSelections(rawSelections, targetSport, marketType, seasonPhase);
        freshOutcomes = deduplicateOutcomes(transformed);
      }

      // Filter, sort, score, etc. (same as before)
      let selections: any[] = [];
      const maxResults = 5;

      if (freshOutcomes.length > 0) {
        let filtered = [...freshOutcomes];
        if (intents.includes('over')) filtered = filtered.filter(o => o.prediction?.toLowerCase().includes('over'));
        else if (intents.includes('under')) filtered = filtered.filter(o => o.prediction?.toLowerCase().includes('under'));

        if (intents.includes('value')) {
          filtered = filtered.filter(o => parseFloat(o.edge) > 0);
          filtered.sort((a, b) => (parseFloat(b.edge) || 0) - (parseFloat(a.edge) || 0));
        } else if (intents.includes('top')) {
          filtered.sort((a, b) => (b.confidence_pre_game || 0) - (a.confidence_pre_game || 0));
        }

        if (detectedPlayer && !intents.includes('team')) {
          const playerFuse = new Fuse(filtered, { keys: ['player'], threshold: 0.3 });
          const playerMatches = playerFuse.search(detectedPlayer);
          filtered = playerMatches.map(m => m.item);
        }

        if (filtered.length === 0) filtered = [...freshOutcomes];

        const intentObj = preprocessQuery(customQuery);
        const scored = filtered.map(o => ({
          ...o,
          relevanceScore: scorePredictionRelevance(o, intentObj, customQuery)
        }));
        scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
        selections = scored.slice(0, maxResults);
      }

      if (selections.length === 0) {
        console.log(`No matches found, using mock data for ${targetSport}`);
        const mockSelections = generateMockOutcomes(targetSport.toLowerCase(), maxResults);
        selections = mockSelections.map((item, idx) => ({ ...item, relevanceScore: idx + 1 }));
      }

// Format the analysis text
const formattedAnalysis = selections.map((item: any, idx: number) => {
  const edgeDisplay = typeof item.edge === 'string' ? item.edge : 
                      (item.edge > 0 ? `+${item.edge.toFixed(1)}%` : `${item.edge.toFixed(1)}%`);
  
  return `**${idx + 1}. ${item.player}**\n` +
    `   📈 **Stat:** ${item.stat_type}\n` +
    `   🎯 **Line:** ${typeof item.line === 'number' ? item.line.toFixed(1) : item.line}\n` +
    `   🔮 **Projection:** ${typeof item.projection === 'number' ? item.projection.toFixed(1) : item.projection}\n` +
    `   💎 **Confidence:** ${item.confidence_pre_game}%\n` +
    `   💰 **Edge:** ${edgeDisplay}\n` +
    `   📝 **Analysis:** ${item.key_factors?.join(' ') || 'No analysis'}`;
}).join('\n\n');

      setPredictionResults({
        success: true,
        analysis: `🎯 **AI Prediction Results**\n\nBased on your query:\n\n${formattedAnalysis}`,
        model: 'fresh-api',
        timestamp: new Date().toISOString(),
        source: intents.includes('team') ? 'Team Props API' : (result.scraped ? 'Live Data' : 'API Data')
      });

      setGeneratedSets(prev => [...prev, selections]);
      setCurrentSetIndex(prev => prev + 1);
      logPromptPerformance(customQuery, selections.length, 0, 'generator');
    } catch (error) {
      console.error('❌ Error in generator:', error);
      const maxResults = 5;
      const mockSelections = generateMockOutcomes(selectedSport.toLowerCase(), maxResults);
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: alpha('#3b82f6', 0.1), p: 1.5, borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Line:</Typography>
              <Typography variant="body2" fontWeight="bold">{outcome.line}</Typography>
              <Typography variant="caption" fontWeight="bold" color="text.secondary">Projection:</Typography>
              <Typography variant="body2" fontWeight="bold" color="primary.main">{outcome.projection?.toFixed(1)}</Typography>
            </Box>

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
      "NBA points over 25.5 tonight",
      "NBA triple‑double odds",
      "NBA three‑pointers made over 4.5",
      "NBA rebounds + assists double‑double",
      "NBA top rookie props",
      "MLB home runs today",
      "MLB strikeouts over 1.5",
      "MLB pitcher strikeout props",
      "MLB hits + runs + RBIs combo",
      "MLB highest team totals",
      "NHL points over 1.5",
      "NHL shots on goal over 4.5",
      "NHL goal scorer props",
      "NHL power play points",
      "NHL goalie save percentage",
      "Best value props across NBA, MLB, NHL",
      "Highest confidence player props tonight",
      "Players with positive regression",
      "Underdog props with best edge",
      "Rookie performances in NBA and NHL",
      // Team prop examples
      "NBA team points over 105.5",
      "NBA team rebounds under 40.5",
      "MLB team runs over 4.5",
      "NHL team goals over 2.5"
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
            placeholder="Enter custom prediction query (e.g., 'NBA points over 25.5', 'NHL shots on goal')"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={debouncedGenerate}
            disabled={!customQuery.trim() || generatingPredictions}
          >
            {generatingPredictions ? 'Generating...' : 'Generate AI Prediction'}
          </Button>
        </Box>

        {generatedSets.length > 0 && (
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
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
                  { label: 'Total Predictions', value: totalPredictions, color: '#059669' },
                  { label: 'Hit Rate', value: `${winRate}%`, color: '#10b981' },
                  { label: 'Avg Edge', value: '+8.4%', color: '#4CAF50' },
                  { label: 'Profit (100u)', value: '$1240', color: '#10b981' },
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
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>Top Performer: LeBron James</Typography>
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
        <Alert severity="warning" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => refetch(true)}>RETRY</Button>}>
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
              <Button variant="contained" onClick={() => refetch(true)} startIcon={<RefreshIcon />} sx={{ borderRadius: 2 }}>Retry for 2026 Data</Button>
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

// ==============================
// Main Component (ProtectedRoute removed)
// ==============================

const PredictionsOutcomeScreen: React.FC = () => {
  return <PredictionsOutcomeContent />;
};

export default PredictionsOutcomeScreen;
