import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Container, Grid, Card, CardContent, CardActions, Typography, Button,
  Paper, Box, Slider, FormControl, InputLabel, Select, MenuItem,
  Chip, LinearProgress, IconButton, Alert, CircularProgress,
  TextField, Tooltip, Switch, FormControlLabel, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Snackbar, AlertTitle, Divider, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  FilterList, ExpandMore, ExpandLess, TrendingUp, TrendingDown,
  Refresh, BugReport, ArrowUpward, ArrowDownward,
  SportsBasketball, SportsFootball, SportsBaseball, SportsHockey, Info as InfoIcon,
  ShowChart, AttachMoney, FlashOn as FlashOnIcon,
  AutoAwesome as AutoAwesomeIcon, Psychology as PsychologyIcon, Insights as InsightsIcon
} from '@mui/icons-material';
import { useDebounce } from '../utils/useDebounce';
import { usePhraseCache } from '../utils/usePhrasecache';
import { preprocessQuery, QueryIntent } from '../utils/queryProcessor';
import { logPromptPerformance } from '../utils/analytics';

// Define interfaces
interface PlayerProp {
  player_name: string;
  prop_type: string;
  line: number;
  over_price: number | null;
  under_price: number | null;
  bookmaker: string;
  game: string;
  sport: string;
  last_update: string;
  id?: string;
  player?: string;
  projection?: number | null;
  stat_type?: string;
  market?: string;
  source?: string;
  team?: string;
  position?: string;
  odds?: number;
  type?: string;
  confidence?: any;
  edge?: number;
  projection_edge?: number;
  data_source?: string;
  value_side?: 'over' | 'under' | 'none' | 'arbitrage-both';
  projectionEdge?: number;
  calculated_edge?: number;
  calculated_confidence?: string;
  projection_confidence?: string;
  market_implied?: number;
  estimated_true_prob?: number;
  projection_diff?: number;
  value_score?: number;
  recommendedSide?: 'over' | 'under' | 'none';
  kellyBetSize?: number;
  opponent?: string;
  is_real_data?: boolean;
  last_updated?: string;
  league?: string;
  prop_type?: string;
  projected_value?: number;
  projected_score?: number;
  proj?: number;
}

interface ConfidenceResult {
  level: string;
  edge: number;
  overValue?: number;
  underValue?: number;
  isArbitrage?: boolean;
  projectionEdge?: number;
  combinedEdge?: number;
  estimatedTrueProb?: number;
  projectionDirection?: 'over' | 'under';
  isComplementary?: boolean;
  totalImplied?: number;
}

interface ProjectionValueResult {
  edge: number;
  recommendedSide: 'over' | 'under' | 'none';
  confidence: string;
  marketImplied: number;
  estimatedTrueProb: number;
  projectionDiff: number;
}

const IS_DEV = process.env.NODE_ENV !== 'production';
const log = (...args: any[]) => {
  if (IS_DEV) console.log(...args);
};
const logDebug = (...args: any[]) => {
  if (IS_DEV) console.debug(...args);
};

// ===== PLACEHOLDER USER ID HOOK – REPLACE WITH YOUR AUTH LOGIC =====
const useUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    // Example: get from localStorage after login
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserId(user.id);
      } catch {
        setUserId('guest-user');
      }
    } else {
      // For testing without login
      setUserId('guest-user');
    }
  }, []);
  return userId;
};

const PrizePicksScreen = () => {
  const userId = useUserId();

  // ===== STATE =====
  const [picksData, setPicksData] = useState<any>(null);
  const [combinedData, setCombinedData] = useState<PlayerProp[]>([]);
  const [picksLoading, setPicksLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('nba');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' as 'info' | 'success' | 'warning' | 'error' 
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const REFRESH_INTERVAL = 180000; // 3 minutes (increased from 2)

  // ===== VALUE FILTERING STATE =====
  const [enableProjectionFiltering, setEnableProjectionFiltering] = useState(false);
  const [projectionDifferenceThreshold, setProjectionDifferenceThreshold] = useState(0.5);
  const [onlyShowProjectionEdges, setOnlyShowProjectionEdges] = useState(false);
  const [sortByProjectionValue, setSortByProjectionValue] = useState(true);
  const [minEdgeThreshold, setMinEdgeThreshold] = useState(0);
  const [projectionDiffSign, setProjectionDiffSign] = useState<'positive' | 'negative' | 'both'>('both');

  const [kellyFraction, setKellyFraction] = useState(0.25);
  const [showKellySizing, setShowKellySizing] = useState(true);
  const [bankrollAmount, setBankrollAmount] = useState(1000);

  const [filters, setFilters] = useState({
    minEdge: 0,
    maxEdge: 100,
    minProjection: 0,
    maxProjection: 50,
    statType: 'all',
    valueSide: 'all',
    sortBy: 'edge',
    sortOrder: 'desc'
  });

  const [visibleCount, setVisibleCount] = useState(50);
  const INCREMENT = 50;

  // ===== GENERATOR STATE =====
  const [genStrategy, setGenStrategy] = useState<'edge' | 'value' | 'projection'>('edge');
  const [genCount, setGenCount] = useState<number>(3);
  const [ignoreFilters, setIgnoreFilters] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProps, setGeneratedProps] = useState<PlayerProp[]>([]);
  const [generatedSets, setGeneratedSets] = useState<PlayerProp[][]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [genCustomQuery, setGenCustomQuery] = useState('');
  const debouncedGenQuery = useDebounce(genCustomQuery, 500);

  // ===== REQUEST LIMITING STATE =====
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(5);
  // Flag to indicate if we are using real backend or fallback
  const [usingBackend, setUsingBackend] = useState(true);

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState<'all' | 'top' | 'generator'>('all');

  const [showFilters, setShowFilters] = useState(true);

  const [sortCriteria, setSortCriteria] = useState<'projection' | 'edge' | 'position'>('edge');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const { getCached, setCached } = usePhraseCache();

  // ===== ALL-SPORTS PROMPTS =====
  const ALL_SPORTS_PROMPTS = [
    // NBA Prompts (5)
    { label: '🏀 NBA: Highest Edge Points', query: 'nba points high edge' },
    { label: '🏀 NBA: Best Value Assists', query: 'nba assists best value' },
    { label: '🏀 NBA: Top Projection Rebounds', query: 'nba rebounds top projection' },
    { label: '🏀 NBA: Highest Edge Steals+Blocks', query: 'nba stocks high edge' },
    { label: '🏀 NBA: Best Value 3-Pointers', query: 'nba threes best value' },
    
    // MLB Prompts (5)
    { label: '⚾ MLB: Highest Edge Strikeouts', query: 'mlb strikeouts high edge' },
    { label: '⚾ MLB: Best Value Home Runs', query: 'mlb home runs best value' },
    { label: '⚾ MLB: Top Projection Hits', query: 'mlb hits top projection' },
    { label: '⚾ MLB: Highest Edge RBIs', query: 'mlb rbis high edge' },
    { label: '⚾ MLB: Best Value Total Bases', query: 'mlb total bases best value' },
    
    // NHL Prompts (5)
    { label: '🏒 NHL: Highest Edge Goals', query: 'nhl goals high edge' },
    { label: '🏒 NHL: Best Value Assists', query: 'nhl assists best value' },
    { label: '🏒 NHL: Top Projection Shots on Goal', query: 'nhl shots top projection' },
    { label: '🏒 NHL: Highest Edge Saves', query: 'nhl saves high edge' },
    { label: '🏒 NHL: Best Value Points', query: 'nhl points best value' },
    
    // Mixed Prompts (5)
    { label: '🔥 HIGHEST EDGE: All Sports', query: 'highest edge' },
    { label: '🎯 BEST VALUE: Points+Assists', query: 'points+assists best value' },
    { label: '📊 TOP PROJECTION: Rebounds+Goals', query: 'rebounds goals top projection' },
    { label: '⚡ OVER Bets: Best Value', query: 'over best value' },
    { label: '⬇️ UNDER Bets: Best Value', query: 'under best value' },
  ];

  const generatorPrompts = [
    { label: '🔥 Highest Projection Points', query: 'points high projection' },
    { label: '⚡ Highest Edge Points', query: 'points best edge' },
    { label: '🎯 Best Value Assists', query: 'assists value' },
    { label: '📊 Best Value Rebounds', query: 'rebounds value' },
    { label: '🏀 Top Edge Overall', query: 'highest edge' },
    { label: '📈 Top Projection Overall', query: 'highest projection' },
    { label: '⬇️ Best Under Bets', query: 'under value' },
    { label: '⬆️ Best Over Bets', query: 'over value' },
    { label: '🧑‍🦱 Point Guards High Assists', query: 'pg assists' },
    { label: '🏋️ Centers High Rebounds', query: 'c rebounds' },
  ];

  // ===== REQUEST DEDUPLICATION REF =====
  const fetchingRef = useRef(false);

  // ===== FETCH REMAINING REQUESTS ON MOUNT =====
  useEffect(() => {
    if (!userId) return;
    const fetchRemaining = async () => {
      try {
        const res = await fetch(`/api/user/generations/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setRemainingRequests(data.remaining);
          setUsingBackend(true);
        } else {
          setRemainingRequests(null);
          setUsingBackend(false);
        }
      } catch (error) {
        setRemainingRequests(null);
        setUsingBackend(false);
      }
    };
    fetchRemaining();
  }, [userId]);

  // ===== PURCHASE HANDLER =====
  const handlePurchase = async () => {
    if (!userId) return;
    if (!usingBackend) {
      return;
    }
    try {
      const res = await fetch('/api/user/generations/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, quantity: purchaseAmount })
      });
      if (res.ok) {
        const data = await res.json();
        setRemainingRequests(data.remaining);
        setShowPurchaseDialog(false);
        setSnackbar({ open: true, message: `Added ${purchaseAmount} requests!`, severity: 'success' });
      } else {
        alert('Purchase failed');
      }
    } catch (error) {
      console.error(error);
      alert('Purchase error');
    }
  };

  // ===== FETCH FUNCTION WITH DEDUP AND 429 RETRY =====
  const fetchPrizepicksSelections = async (skipCache = false, retryCount = 0) => {
    // Deduplicate concurrent requests
    if (fetchingRef.current) {
      log('⏳ Fetch already in progress, skipping');
      return;
    }
    fetchingRef.current = true;

    try {
      setPicksLoading(true);
      setRefreshing(true);
      log(`📡 Fetching ${selectedSport.toUpperCase()} data...`);

      const cacheKey = `prizepicks-${selectedSport}`;
      if (!skipCache) {
        const cached = getCached(cacheKey);
        if (cached) {
          log('✅ Using cached data');
          setPicksData(cached);
          const propsArray = cached.selections || cached.props || [];
          const processed = processPrizePicksData({ ...cached, selections: propsArray });
          setCombinedData(processed);
          setPicksLoading(false);
          setRefreshing(false);
          return;
        }
      }

      let apiUrl: string;
      const baseNBA = 'https://prizepicks-production.up.railway.app';
      const basePython = 'https://python-api-fresh-production.up.railway.app';

      if (selectedSport === 'nba') {
        apiUrl = `${baseNBA}/api/prizepicks/selections?sport=${selectedSport}&nocache=${Date.now()}`;
      } else if (selectedSport === 'mlb') {
        apiUrl = `${basePython}/api/mlb/props?nocache=${Date.now()}`;
      } else if (selectedSport === 'nhl') {
        apiUrl = `${basePython}/api/nhl/props?nocache=${Date.now()}`;
      } else {
        apiUrl = `${baseNBA}/api/prizepicks/selections?sport=${selectedSport}&nocache=${Date.now()}`;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorText = await response.text();
        // Handle 429 specifically
        if (response.status === 429 && retryCount < 3) {
          setSnackbar({
            open: true,
            message: `Rate limit hit. Retrying in 5 seconds (${retryCount + 1}/3)...`,
            severity: 'warning',
          });
          await new Promise(resolve => setTimeout(resolve, 5000));
          fetchingRef.current = false;
          return fetchPrizepicksSelections(skipCache, retryCount + 1);
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      log('📊 API Response:', {
        success: data.success,
        count: data.count,
        source: data.data_source || data.source,
        isReal: data.is_real_data,
        selections: data.selections?.length,
        props: data.props?.length
      });

      setPicksData(data);
      setCached(cacheKey, data);
      setError(null);

      const propsArray = data.selections || data.props || [];
      if (propsArray.length > 0) {
        const processed = processPrizePicksData({ ...data, selections: propsArray });
        log(`✅ Processed ${processed.length} props`);
        setCombinedData(processed);
      } else {
        log('⚠️ No selections/props in response');
        setCombinedData([]);
      }

      setSnackbar({
        open: true,
        message: `Loaded ${propsArray.length} ${selectedSport.toUpperCase()} props`,
        severity: 'success'
      });

    } catch (error: any) {
      console.error('❌ Error fetching data:', error);
      setError(error.message);
      setCombinedData([]);

      setSnackbar({
        open: true,
        message: 'Failed to load data: ' + error.message,
        severity: 'error'
      });
    } finally {
      fetchingRef.current = false;
      setPicksLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and sport change
  useEffect(() => {
    fetchPrizepicksSelections();
  }, [selectedSport]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const intervalId = setInterval(() => fetchPrizepicksSelections(true), REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, selectedSport]);

  // ===== HELPER FUNCTIONS =====
  const calculateImpliedProbability = (americanOdds: number): number => {
    if (americanOdds > 0) return 100 / (americanOdds + 100);
    else return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  };

  const calculateKellyBetSize = (edge: number, odds: number, bankroll: number) => {
    if (edge <= 0 || odds === null || bankroll <= 0) {
      return { fraction: 0, amount: 0, percentOfBankroll: 0 };
    }
    let decimalOdds;
    if (odds > 0) decimalOdds = (odds / 100) + 1;
    else decimalOdds = (100 / Math.abs(odds)) + 1;
    const b = decimalOdds - 1;
    const p = 0.5 + edge;
    const q = 1 - p;
    const kellyFractionFull = (b * p - q) / b;
    const kellyFractionApplied = Math.max(0, Math.min(kellyFractionFull * kellyFraction, 0.2));
    const betAmount = bankroll * kellyFractionApplied;
    return {
      fraction: kellyFractionApplied,
      amount: betAmount,
      percentOfBankroll: kellyFractionApplied * 100
    };
  };

  const calculateProjectionValue = (projection?: number | null, line?: number, overPrice?: number | null, underPrice?: number | null): ProjectionValueResult => {
    if (projection === undefined || projection === null || line === undefined || line === null) {
      return { 
        edge: 0, 
        recommendedSide: 'none', 
        confidence: 'low', 
        marketImplied: 0, 
        estimatedTrueProb: 0.5, 
        projectionDiff: 0 
      };
    }
    
    const projectionDiff = projection - line;
    const recommendedSide = projectionDiff > 0 ? 'over' : projectionDiff < 0 ? 'under' : 'none';
    const relevantOdds = recommendedSide === 'over' ? overPrice : (recommendedSide === 'under' ? underPrice : null);
    
    if (relevantOdds === null || relevantOdds === undefined) {
      return { 
        edge: 0, 
        recommendedSide: 'none', 
        confidence: 'low', 
        marketImplied: 0, 
        estimatedTrueProb: 0.5, 
        projectionDiff 
      };
    }
    
    const marketImplied = relevantOdds > 0 
      ? 100 / (relevantOdds + 100) 
      : -relevantOdds / (-relevantOdds + 100);
    
    const absDiff = Math.abs(projectionDiff);
    let estimatedTrueProb;
    if (absDiff > 2.0) estimatedTrueProb = recommendedSide === 'over' ? 0.65 : 0.35;
    else if (absDiff > 1.0) estimatedTrueProb = recommendedSide === 'over' ? 0.60 : 0.40;
    else if (absDiff > 0.5) estimatedTrueProb = recommendedSide === 'over' ? 0.55 : 0.45;
    else estimatedTrueProb = recommendedSide === 'over' ? 0.52 : 0.48;
    
    const edge = estimatedTrueProb - marketImplied;
    
    let confidence = 'low';
    if (edge > 0.05) confidence = 'very-high';
    else if (edge > 0.03) confidence = 'high';
    else if (edge > 0.01) confidence = 'medium';
    else if (edge > 0) confidence = 'low';
    else confidence = 'no-edge';
    
    return { 
      edge, 
      recommendedSide, 
      confidence, 
      marketImplied, 
      estimatedTrueProb, 
      projectionDiff 
    };
  };

  const normalizeOdds = (odds: any, type = ''): number | null => {
    if (odds === null || odds === undefined || odds === 'null') return null;
    const oddsStr = String(odds).trim();
    if (oddsStr === '') return null;
    if (oddsStr.startsWith('+') || oddsStr.startsWith('-')) {
      const americanOdds = parseInt(oddsStr, 10);
      return isNaN(americanOdds) ? null : americanOdds;
    }
    if (oddsStr.includes('.') && !isNaN(parseFloat(oddsStr))) {
      const decimalOdds = parseFloat(oddsStr);
      if (isNaN(decimalOdds)) return null;
      if (decimalOdds >= 2.0) return Math.round((decimalOdds - 1) * 100);
      else return Math.round(-100 / (decimalOdds - 1));
    }
    const numericOdds = parseInt(oddsStr, 10);
    return isNaN(numericOdds) ? null : numericOdds;
  };

  // ===== STAT TYPE NORMALIZATION =====
  const normalizeStatType = (rawStat: string): string => {
    const stat = rawStat.toLowerCase();
    if (stat === 'pts' || stat === 'point' || stat.includes('point')) return 'points';
    if (stat === 'reb' || stat === 'rebounds' || stat.includes('rebound')) return 'rebounds';
    if (stat === 'ast' || stat === 'assist' || stat.includes('assist')) return 'assists';
    if (stat === 'stl' || stat === 'steal' || stat.includes('steal')) return 'steals';
    if (stat === 'blk' || stat === 'block' || stat.includes('block')) return 'blocks';
    if (stat === '3pm' || stat === 'threes' || stat === 'three' || stat.includes('3pt')) return 'threes';
    return stat;
  };

  // ===== PROCESS PRIZE PICKS DATA =====
  const processPrizePicksData = (data: any): PlayerProp[] => {
    log('🔄 Processing PrizePicks Data from API');
    const selections = data.selections || [];
    log(`📊 Processing ${selections.length} selections`);
    if (selections.length === 0) return [];

    const mapped = selections.map((item: any, index: number) => {
      const playerName = item.player || item.player_name || 'Unknown Player';
      
      const rawStat = item.stat_type || item.prop_type || item.stat || 'points';    
      const statType = normalizeStatType(rawStat);

      const line = item.line || 0;
      
      // Try to get projection from various possible API fields
      let projection = null;
      let projectionDiff = 0;

      if (item.projection !== undefined && item.projection !== null) {
        projection = parseFloat(item.projection);
      } else if (item.projected_value !== undefined && item.projected_value !== null) {
        projection = parseFloat(item.projected_value);
      } else if (item.projected_score !== undefined && item.projected_score !== null) {
        projection = parseFloat(item.projected_score);
      } else if (item.proj !== undefined && item.proj !== null) {
        projection = parseFloat(item.proj);
      } else if (item.projection_edge !== undefined && item.projection_edge !== null && line) {
        const projEdge = parseFloat(item.projection_edge) || 0;
        projection = line * (1 + projEdge);
      } else if (item.edge !== undefined && item.edge !== null && line) {
        const edge = parseFloat(item.edge) / 100 || 0;
        projection = line * (1 + edge);
      }

      if (projection === null) {
        projection = null;
        projectionDiff = 0;
      } else {
        projection = parseFloat(projection.toFixed(1));
        projectionDiff = projection - line;
      }

      let overPrice = item.over_price;
      let underPrice = item.under_price;
      if (item.odds && item.type) {
        if (item.type.toLowerCase() === 'over') overPrice = normalizeOdds(item.odds, 'over');
        else if (item.type.toLowerCase() === 'under') underPrice = normalizeOdds(item.odds, 'under');
      }
      overPrice = normalizeOdds(overPrice, 'over');
      underPrice = normalizeOdds(underPrice, 'under');

      const projectionValue = calculateProjectionValue(projection, line, overPrice, underPrice);
      
      let kellyBetSize = 0;
      if (projection && projectionValue.edge > 0 && projectionValue.recommendedSide !== 'none') {
        const odds = projectionValue.recommendedSide === 'over' ? overPrice : underPrice;
        if (odds !== null) {
          const kellyResult = calculateKellyBetSize(projectionValue.edge, odds, bankrollAmount);
          kellyBetSize = kellyResult.percentOfBankroll;
        }
      }

      const edgeFromAPI = parseFloat(item.edge);
      const projEdgeFromAPI = parseFloat(item.projection_edge);

      return {
        player_name: playerName,
        player: playerName,
        stat_type: statType,
        line: line,
        projection: projection,
        projection_diff: projectionDiff,
        edge: !isNaN(edgeFromAPI) ? edgeFromAPI : (projEdgeFromAPI ? projEdgeFromAPI * 100 : 0),
        projectionEdge: !isNaN(projEdgeFromAPI) ? projEdgeFromAPI : projectionValue.edge,
        odds: item.odds,
        over_price: overPrice,
        under_price: underPrice,
        bookmaker: item.bookmaker || 'PrizePicks',
        value_side: item.value_side || projectionValue.recommendedSide,
        game: item.game || `${item.team || ''} vs ${item.opponent || ''}`,
        team: item.team,
        opponent: item.opponent,
        position: item.position,
        confidence: item.confidence,
        data_source: item.data_source || data.data_source,
        is_real_data: item.is_real_data,
        sport: item.sport || selectedSport,
        league: item.league || selectedSport,
        last_update: item.last_updated || item.timestamp || new Date().toISOString(),
        id: item.id || `prop-${index}-${Date.now()}`,
        projection_confidence: projectionValue.confidence,
        market_implied: projectionValue.marketImplied,
        estimated_true_prob: projectionValue.estimatedTrueProb,
        recommendedSide: projectionValue.recommendedSide,
        kellyBetSize: kellyBetSize,
        value_score: projectionValue.edge > 0 ? projectionValue.edge * 100 : 0
      };
    });

    const groupOverUnder = (props: PlayerProp[]): PlayerProp[] => {
      const grouped = new Map<string, PlayerProp>();
      props.forEach(prop => {
        const key = `${prop.player}-${prop.stat_type}-${prop.line}`;
        if (grouped.has(key)) {
          const existing = grouped.get(key)!;
          if (prop.value_side === 'over') {   
            existing.over_price = prop.over_price;
          } else if (prop.value_side === 'under') {
            existing.under_price = prop.under_price;
          }
          if ((prop.projection || 0) > (existing.projection || 0)) {
            existing.projection = prop.projection;
            existing.projection_diff = prop.projection_diff;
            existing.projectionEdge = prop.projectionEdge;
          }
        } else {
          grouped.set(key, { ...prop });
        }
      });
      return Array.from(grouped.values());
    };

    const combined = groupOverUnder(mapped);
    log(`✅ Processed and grouped into ${combined.length} props`);
    return combined;
  };

  // ===== VALUE FILTERING LOGIC =====
  const applyValueFiltering = (props: PlayerProp[]): PlayerProp[] => {
    let filtered = [...props];
    if (enableProjectionFiltering) {
      filtered = filtered.filter(p => {
        if (p.projection === undefined || p.projection === null) return false;
        const diff = p.projection_diff || 0;
        const absDiff = Math.abs(diff);
        if (absDiff < projectionDifferenceThreshold) return false;
        if (projectionDiffSign === 'positive' && diff < 0) return false;
        if (projectionDiffSign === 'negative' && diff > 0) return false;
        return true;
      });
    }
    if (minEdgeThreshold > 0) {
      filtered = filtered.filter(p => (p.projectionEdge || 0) >= minEdgeThreshold);
    }
    if (onlyShowProjectionEdges) {
      filtered = filtered.filter(prop => {
        if (prop.projection === null) return false;
        const projectionDirection = (prop.projection || 0) > prop.line ? 'over' : 'under';
        return prop.value_side === projectionDirection || prop.value_side === 'arbitrage-both';
      });
    }
    return filtered;
  };

  const sortByValueScore = (props: PlayerProp[]): PlayerProp[] => {
    return [...props].sort((a, b) => {
      if ((a.projectionEdge || 0) > 0 && (b.projectionEdge || 0) <= 0) return -1;
      if ((b.projectionEdge || 0) > 0 && (a.projectionEdge || 0) <= 0) return 1;
      if (sortByProjectionValue) return (b.projectionEdge || 0) - (a.projectionEdge || 0);
      else return (b.edge || 0) - (a.edge || 0);
    });
  };

  const applySortAndFilter = (props: PlayerProp[]): PlayerProp[] => {
    let filtered = props;
    if (positionFilter !== 'all') {
      filtered = filtered.filter(p => p.position === positionFilter);
    }
    return filtered.sort((a, b) => {
      if (sortCriteria === 'projection') {
        return (b.projection || 0) - (a.projection || 0);
      } else if (sortCriteria === 'edge') {
        const edgeA = a.projectionEdge || a.edge || 0;
        const edgeB = b.projectionEdge || b.edge || 0;
        return edgeB - edgeA;
      } else if (sortCriteria === 'position') {
        return (a.position || '').localeCompare(b.position || '');
      }
      return 0;
    });
  };

  // ===== MEMOIZED DERIVED DATA =====
  const sortedProps = useMemo(() => {
    log('📊 useMemo: sortedProps');
    if (!combinedData.length) return [];

    let filtered = combinedData.filter(prop => {
      if (selectedLeague !== 'All' && prop.sport !== selectedLeague && prop.league !== selectedLeague) return false;
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const player = (prop.player_name || prop.player || '').toLowerCase();
        const stat = (prop.stat_type || '').toLowerCase();
        const team = (prop.team || '').toLowerCase();
        if (!player.includes(query) && !stat.includes(query) && !team.includes(query)) return false;
      }
      return true;
    });

    filtered = applyValueFiltering(filtered);
    return sortByValueScore(filtered);
  }, [
    combinedData,
    selectedLeague,
    debouncedSearch,
    enableProjectionFiltering,
    projectionDifferenceThreshold,
    projectionDiffSign,
    onlyShowProjectionEdges,
    sortByProjectionValue,
    minEdgeThreshold
  ]);

  const filteredData = useMemo(() => {
    log('📊 useMemo: filteredData');
    if (!sortedProps.length) return [];

    let result = [...sortedProps];

    result = result.filter(item => {
      const edge = item.edge || (item.projectionEdge ? item.projectionEdge * 100 : 0) || 0;
      return edge >= filters.minEdge && edge <= filters.maxEdge;
    });
    result = result.filter(item => {
      const projection = item.projection || 0;
      return projection >= filters.minProjection && projection <= filters.maxProjection;
    });
    if (filters.statType !== 'all') {
      result = result.filter(item => 
        item.stat_type?.toLowerCase() === filters.statType.toLowerCase()
      );
    }
    if (filters.valueSide !== 'all') {
      result = result.filter(item => 
        item.value_side === filters.valueSide
      );
    }

    result = applySortAndFilter(result);
    return result;
  }, [sortedProps, filters, sortCriteria, positionFilter]);

  const topValueProps = useMemo(() => {
    if (!sortedProps.length) return [];
    return applySortAndFilter(sortedProps)
      .filter(p => (p.projectionEdge || 0) > 0)
      .slice(0, 10);
  }, [sortedProps, sortCriteria, positionFilter]);

  // ===== GENERATOR =====
  const scorePropRelevance = (prop: PlayerProp, intent: QueryIntent): number => {
    let score = 0;
    const player = (prop.player_name || prop.player || '').toLowerCase();
    const team = (prop.team || '').toLowerCase();
    const stat = (prop.stat_type || '').toLowerCase();
    const game = (prop.game || '').toLowerCase();

    if (intent.player && player.includes(intent.player)) score += 20;
    if (intent.team && team.includes(intent.team)) score += 15;
    if (intent.keywords.length) {
      const keywordMatch = intent.keywords.some(k => 
        player.includes(k) || team.includes(k) || stat.includes(k) || game.includes(k)
      );
      if (keywordMatch) score += 10;
    }
    score += (prop.projectionEdge || 0) * 5;
    return score;
  };

  const generateProps = useCallback(async () => {
    if (!userId) {
      alert('User not identified');
      return;
    }

    setIsGenerating(true);

    try {
      log('[Generator] Starting generation...');
      const source = ignoreFilters ? combinedData : sortedProps;
      
      if (!source.length) {
        alert('No props available to generate from. Please refresh data.');
        setIsGenerating(false);
        return;
      }

      console.log(`[Generator] Source data: ${source.length} props`);
      if (source.length > 0) {
        console.log('[Generator] Sample source prop:', {
          player: source[0].player_name || source[0].player,
          stat: source[0].stat_type,
          line: source[0].line,
          projection: source[0].projection,
          edge: source[0].edge,
          projectionEdge: source[0].projectionEdge
        });
      }

      let workingSet = [...source];
      console.log(`[Generator] Working with ${workingSet.length} total props`);

      // Apply query-based filtering if custom query exists
      if (debouncedGenQuery.trim()) {
        log('[Generator] Custom query:', debouncedGenQuery);
        const queryLower = debouncedGenQuery.toLowerCase();
        
        // Sport detection
        const sportMap: Record<string, string[]> = {
          nba: ['nba', 'basketball'],
          mlb: ['mlb', 'baseball'],
          nhl: ['nhl', 'hockey']
        };
        
        let detectedSport: string | null = null;
        Object.entries(sportMap).forEach(([sport, keywords]) => {
          if (keywords.some(k => queryLower.includes(k))) {
            detectedSport = sport;
          }
        });

        // Filter by detected sport, or fallback to selectedSport
        if (detectedSport) {
          const beforeCount = workingSet.length;
          workingSet = workingSet.filter(p => 
            p.sport?.toLowerCase() === detectedSport || 
            p.league?.toLowerCase() === detectedSport
          );
          console.log(`[Generator] Filtered to ${workingSet.length} props for sport: ${detectedSport} (was ${beforeCount})`);
        } else {
          // Default to selected sport
          const beforeCount = workingSet.length;
          workingSet = workingSet.filter(p => 
            p.sport?.toLowerCase() === selectedSport || 
            p.league?.toLowerCase() === selectedSport
          );
          console.log(`[Generator] Defaulting to selected sport: ${selectedSport}, filtered to ${workingSet.length} props (was ${beforeCount})`);
        }

        // Stat type mapping: keywords -> canonical stat names
        const statTypeMap: Record<string, string[]> = {
          points: ['points', 'pts'],
          rebounds: ['rebounds', 'reb'],
          assists: ['assists', 'ast'],
          threes: ['threes', '3pm', '3pt', 'three'],
          steals: ['steals', 'stl'],
          blocks: ['blocks', 'blk'],
          stocks: ['steals', 'blocks'], // special case
        };

        // Detect all stat types mentioned in the query
        const detectedStatTypes = new Set<string>();
        for (const [stat, keywords] of Object.entries(statTypeMap)) {
          if (keywords.some(k => queryLower.includes(k))) {
            if (stat === 'stocks') {
              detectedStatTypes.add('steals');
              detectedStatTypes.add('blocks');
            } else {
              detectedStatTypes.add(stat);
            }
          }
        }

        if (detectedStatTypes.size > 0) {
          const statTypesArray = Array.from(detectedStatTypes);
          const beforeCount = workingSet.length;
          workingSet = workingSet.filter(p => {
            const stat = (p.stat_type || '').toLowerCase();
            return statTypesArray.some(s => stat.includes(s));
          });
          console.log(`[Generator] Filtered to ${workingSet.length} props for stats: ${statTypesArray.join(', ')} (was ${beforeCount})`);
        }

        // Apply value-based filtering based on query intent
        const isHighEdge = queryLower.includes('high edge') || queryLower.includes('best edge');
        const isBestValue = queryLower.includes('best value') || queryLower.includes('value');
        const isTopProjection = queryLower.includes('top projection') || queryLower.includes('highest projection');
        const isOver = queryLower.includes('over bet') || queryLower.includes('over best');
        const isUnder = queryLower.includes('under bet') || queryLower.includes('under best');

        if (isOver) {
          workingSet = workingSet.filter(p => p.value_side === 'over' || p.recommendedSide === 'over');
        } else if (isUnder) {
          workingSet = workingSet.filter(p => p.value_side === 'under' || p.recommendedSide === 'under');
        }

        // Sort based on intent
        if (isHighEdge) {
          workingSet.sort((a, b) => (b.edge || 0) - (a.edge || 0));
          console.log('[Generator] Sorting by edge');
        } else if (isBestValue) {
          workingSet.sort((a, b) => {
            const scoreA = (a.projectionEdge || 0) * 100 + (Math.abs(a.projection_diff || 0) * 10);
            const scoreB = (b.projectionEdge || 0) * 100 + (Math.abs(b.projection_diff || 0) * 10);
            return scoreB - scoreA;
          });
          console.log('[Generator] Sorting by value score');
        } else if (isTopProjection) {
          workingSet.sort((a, b) => (b.projection || 0) - (a.projection || 0));
          console.log('[Generator] Sorting by projection');
        } else {
          workingSet.sort((a, b) => (b.edge || 0) - (a.edge || 0));
        }

      } else {
        // No custom query - use selected strategy
        console.log(`[Generator] Using strategy: ${genStrategy}`);
        
        switch (genStrategy) {
          case 'edge':
            workingSet.sort((a, b) => (b.edge || 0) - (a.edge || 0));
            break;
          case 'value':
            workingSet.sort((a, b) => {
              const scoreA = (a.projectionEdge || 0) * 100 + (Math.abs(a.projection_diff || 0) * 10);
              const scoreB = (b.projectionEdge || 0) * 100 + (Math.abs(b.projection_diff || 0) * 10);
              return scoreB - scoreA;
            });
            break;
          case 'projection':
            workingSet.sort((a, b) => (b.projection || 0) - (a.projection || 0));
            break;
        }
      }

      // Ensure we have results after filtering
      if (workingSet.length === 0) {
        console.log('[Generator] No results after filtering, using unfiltered data with default sorting');
        workingSet = [...source];
        workingSet.sort((a, b) => (b.edge || 0) - (a.edge || 0));
      }

      // DEDUPLICATE by player + stat_type, keeping the best one
      const bestPropsMap = new Map();
      
      workingSet.forEach(prop => {
        const playerName = prop.player_name || prop.player;
        const statType = prop.stat_type || prop.prop_type;
        if (!playerName || !statType) return;
        
        const key = `${playerName}-${statType}`;
        
        let qualityScore = 0;
        
        if (genStrategy === 'edge' || debouncedGenQuery.toLowerCase().includes('edge')) {
          qualityScore = prop.edge || 0;
        } else if (genStrategy === 'projection' || debouncedGenQuery.toLowerCase().includes('projection')) {
          qualityScore = prop.projection || 0;
        } else {
          qualityScore = (prop.projectionEdge || 0) * 100 + (Math.abs(prop.projection_diff || 0) * 10);
        }
        
        const existing = bestPropsMap.get(key);
        if (!existing || qualityScore > existing.score) {
          bestPropsMap.set(key, {
            prop,
            score: qualityScore
          });
        }
      });

      let uniqueProps = Array.from(bestPropsMap.values())
        .map(item => item.prop)
        .sort((a, b) => {
          const scoreA = (a.projectionEdge || 0) * 100 + (Math.abs(a.projection_diff || 0) * 10);
          const scoreB = (b.projectionEdge || 0) * 100 + (Math.abs(b.projection_diff || 0) * 10);
          return scoreB - scoreA;
        });

      console.log(`[Generator] After deduplication: ${uniqueProps.length} unique player-stat combinations`);

      // Take top N results
      const newSet = uniqueProps.slice(0, Math.min(genCount, uniqueProps.length));
      console.log('[Generator] Final selected set length:', newSet.length);
      
      if (newSet.length > 0) {
        console.log('[Generator] First result:', {
          player: newSet[0].player_name || newSet[0].player,
          stat: newSet[0].stat_type || newSet[0].prop_type,
          line: newSet[0].line,
          projection: newSet[0].projection,
          edge: newSet[0].edge,
          projectionEdge: newSet[0].projectionEdge,
          diff: newSet[0].projection_diff,
          valueSide: newSet[0].value_side
        });
      }

      setGeneratedProps(newSet);
      setGeneratedSets(prev => {
        const newSets = [...prev, newSet];
        setCurrentSetIndex(newSets.length - 1);
        return newSets;
      });
      
      console.log('[Generator] State updated - generatedProps length:', newSet.length);
      console.log('[Generator] Total sets:', generatedSets.length + 1, 'Current index:', generatedSets.length);

      const avgEdge = newSet.length > 0 
        ? newSet.reduce((sum, p) => sum + (p.projectionEdge || 0) * 100, 0) / newSet.length 
        : 0;
      
      logPromptPerformance(
        debouncedGenQuery || genStrategy,
        newSet.length,
        avgEdge,
        'generator'
      );

      if (newSet.length > 0) {
        setSnackbar({
          open: true,
          message: `Generated ${newSet.length} props with avg edge ${avgEdge.toFixed(1)}%`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'No props matched your query criteria',
          severity: 'warning'
        });
      }

    } catch (error: any) {
      console.error('[Generator] Error:', error);
      setSnackbar({
        open: true,
        message: 'Generator error: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  }, [genStrategy, genCount, ignoreFilters, combinedData, sortedProps, debouncedGenQuery, userId, bankrollAmount, kellyFraction, selectedSport]);

  const handlePrevSet = () => {
    if (currentSetIndex > 0) {
      const prevIndex = currentSetIndex - 1;
      setCurrentSetIndex(prevIndex);
      if (generatedSets[prevIndex]) {
        setGeneratedProps(generatedSets[prevIndex]);
      }
    }
  };

  const handleNextSet = () => {
    if (currentSetIndex < generatedSets.length - 1) {
      const nextIndex = currentSetIndex + 1;
      setCurrentSetIndex(nextIndex);
      if (generatedSets[nextIndex]) {
        setGeneratedProps(generatedSets[nextIndex]);
      }
    }
  };

  const clearGenerated = () => {
    setGeneratedProps([]);
    setGeneratedSets([]);
    setCurrentSetIndex(0);
  };

  const handlePromptClick = (query: string) => {
    setGenCustomQuery(query);
    setTimeout(() => generateProps(), 100);
  };

  // ===== UI COMPONENTS =====

  const FilterPanel = () => (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filters & Sorting</Typography>
        <IconButton onClick={() => setShowFilters(!showFilters)} sx={{ ml: 'auto' }}>
          {showFilters ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      {showFilters && (
        <>
          <Paper sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#059669', fontWeight: 'bold' }}>
                🎯 Advanced Value Filtering
              </Typography>
              <FormControlLabel
                control={<Switch checked={enableProjectionFiltering} onChange={(e) => setEnableProjectionFiltering(e.target.checked)} color="success" />}
                label="Enable"
                sx={{ ml: 'auto' }}
              />
            </Box>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" gutterBottom>Min Projection Difference</Typography>
                <FormControl fullWidth size="small">
                  <Select value={projectionDifferenceThreshold} onChange={(e) => setProjectionDifferenceThreshold(parseFloat(e.target.value))}>
                    <MenuItem value={0.1}>0.1+</MenuItem>
                    <MenuItem value={0.5}>0.5+</MenuItem>
                    <MenuItem value={1.0}>1.0+</MenuItem>
                    <MenuItem value={1.5}>1.5+</MenuItem>
                    <MenuItem value={2.0}>2.0+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" gutterBottom>Min Edge Required</Typography>
                <FormControl fullWidth size="small">
                  <Select value={minEdgeThreshold} onChange={(e) => setMinEdgeThreshold(parseFloat(e.target.value))}>
                    <MenuItem value={0}>Any positive</MenuItem>
                    <MenuItem value={0.01}>1%+</MenuItem>
                    <MenuItem value={0.02}>2%+</MenuItem>
                    <MenuItem value={0.03}>3%+</MenuItem>
                    <MenuItem value={0.05}>5%+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={<Switch checked={onlyShowProjectionEdges} onChange={(e) => setOnlyShowProjectionEdges(e.target.checked)} color="primary" />}
                  label="Projection & Edge Agree"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={<Switch checked={sortByProjectionValue} onChange={(e) => setSortByProjectionValue(e.target.checked)} color="primary" />}
                  label="Sort by Projection Value"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="success" onClick={() => setEnableProjectionFiltering(true)}>Show Only +EV Bets</Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ mb: 3, p: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoney sx={{ mr: 1, color: '#059669' }} />
              <Typography variant="h6" sx={{ color: '#059669', fontWeight: 'bold' }}>
                Kelly Criterion
              </Typography>
              <FormControlLabel
                control={<Switch checked={showKellySizing} onChange={(e) => setShowKellySizing(e.target.checked)} color="success" />}
                label="Show Optimal Bets"
                sx={{ ml: 'auto' }}
              />
            </Box>
            {showKellySizing && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    type="number"
                    label="Bankroll"
                    value={bankrollAmount}
                    onChange={(e) => setBankrollAmount(parseFloat(e.target.value) || 1000)}
                    size="small"
                    fullWidth
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" gutterBottom>Kelly Fraction: {kellyFraction * 100}%</Typography>
                  <Slider
                    value={kellyFraction}
                    onChange={(e, v) => setKellyFraction(v as number)}
                    step={0.05}
                    marks={[
                      { value: 0.1, label: '10%' },
                      { value: 0.25, label: '25%' },
                      { value: 0.5, label: '50%' },
                      { value: 0.75, label: '75%' },
                      { value: 1, label: 'Full' }
                    ]}
                    min={0.1}
                    max={1}
                  />
                </Grid>
              </Grid>
            )}
          </Paper>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography>Min Edge: {filters.minEdge}%</Typography>
              <Slider value={filters.minEdge} onChange={(e, v) => setFilters({...filters, minEdge: v as number})} min={0} max={50} step={1} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography>Max Edge: {filters.maxEdge}%</Typography>
              <Slider value={filters.maxEdge} onChange={(e, v) => setFilters({...filters, maxEdge: v as number})} min={0} max={100} step={1} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography>Min Projection: {filters.minProjection}</Typography>
              <Slider value={filters.minProjection} onChange={(e, v) => setFilters({...filters, minProjection: v as number})} min={0} max={50} step={0.5} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography>Max Projection: {filters.maxProjection}</Typography>
              <Slider value={filters.maxProjection} onChange={(e, v) => setFilters({...filters, maxProjection: v as number})} min={0} max={50} step={0.5} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stat Type</InputLabel>
                <Select value={filters.statType} label="Stat Type" onChange={(e) => setFilters({...filters, statType: e.target.value})}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="points">Points</MenuItem>
                  <MenuItem value="rebounds">Rebounds</MenuItem>
                  <MenuItem value="assists">Assists</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Value Side</InputLabel>
                <Select value={filters.valueSide} label="Value Side" onChange={(e) => setFilters({...filters, valueSide: e.target.value})}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="over">Over</MenuItem>
                  <MenuItem value="under">Under</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select value={filters.sortBy} label="Sort By" onChange={(e) => setFilters({...filters, sortBy: e.target.value})}>
                  <MenuItem value="edge">Edge</MenuItem>
                  <MenuItem value="projection">Projection</MenuItem>
                  <MenuItem value="line">Line</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort Order</InputLabel>
                <Select value={filters.sortOrder} label="Sort Order" onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}>
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" size="small" onClick={() => setFilters({...filters, minEdge: 10, maxEdge: 100})}>High Edge (10%+)</Button>
                <Button variant="outlined" size="small" onClick={() => setFilters({...filters, statType: 'points'})}>Points Only</Button>
                <Button variant="outlined" size="small" onClick={() => setFilters({...filters, valueSide: 'over'})}>Over Only</Button>
                <Button variant="outlined" color="error" size="small" onClick={() => setFilters({ minEdge: 0, maxEdge: 100, minProjection: 0, maxProjection: 50, statType: 'all', valueSide: 'all', sortBy: 'edge', sortOrder: 'desc' })}>Reset</Button>
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );

const PlayerCard = React.memo(({ item }: { item: PlayerProp }) => {
    const edge = item && typeof item.edge === 'number' ? item.edge : (item?.edge ? Number(item.edge) : 0);
    const projectionEdge = item && typeof item.projectionEdge === 'number' ? item.projectionEdge : (item?.projectionEdge ? Number(item.projectionEdge) : 0);
    const projection = item?.projection || 0;
    const line = item?.line || 0;
    const isOver = projection > line;
    
    const playerName = item?.player_name || item?.player || 'Unknown Player';
    const statType = item?.stat_type || item?.prop_type || 'N/A';
    const team = item?.team || 'N/A';
    const position = item?.position || 'N/A';
    const projectionDiff = item?.projection_diff || 0;
    const projectionConfidence = item?.projection_confidence || '';
    const overPrice = item?.over_price;
    const underPrice = item?.under_price;
    const valueSide = item?.value_side || 'N/A';
    const game = item?.game || '';
    const kellyBetSize = item?.kellyBetSize || 0;
    const bookmaker = item?.bookmaker || 'Multiple';

    return (
      <Card sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
        border: projectionEdge > 0.03 ? '2px solid #059669' : projectionEdge > 0 ? '1px solid #10b981' : '1px solid #e5e7eb'
      }}>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 'bold' }}>
                {playerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {team} • {position}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Chip label={statType} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
              {projectionEdge > 0 && (
                <Chip
                  label={`+${(projectionEdge * 100).toFixed(1)}% Edge`}
                  size="small"
                  sx={{ bgcolor: projectionEdge > 0.05 ? '#059669' : projectionEdge > 0.03 ? '#10b981' : '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.6rem' }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Line</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{line || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Projection</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: isOver ? '#2e7d32' : '#d32f2f' }}>
                  {projection ? projection.toFixed(1) : 'N/A'}
                  {isOver ? <ArrowUpward sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownward sx={{ fontSize: 16, ml: 0.5 }} />}
                </Typography>
              </Grid>
            </Grid>
            <Typography variant="body2" component="div" sx={{ mt: 1, textAlign: 'center' }}>
              Difference: <strong>{projectionDiff.toFixed(1)}</strong>
              {projectionConfidence && (
                <> • <Chip label={projectionConfidence} size="small" sx={{ fontSize: '0.6rem', height: '18px' }} /></>
              )}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Edge</span>
              <span style={{ color: edge > 15 ? '#2e7d32' : edge > 8 ? '#ed6c02' : '#d32f2f', fontWeight: 'bold' }}>
                {edge.toFixed(1)}%
              </span>
            </Typography>
            <LinearProgress variant="determinate" value={Math.min(edge, 100)} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: edge > 15 ? '#4caf50' : edge > 8 ? '#ff9800' : '#f44336' } }} />
          </Box>

          {showKellySizing && kellyBetSize > 0 && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#ecfdf5', borderRadius: 1, border: '1px solid #bbf7d0' }}>
              <Typography variant="body2" fontWeight="bold" color="#059669">
                💰 Optimal Bet: ${((bankrollAmount * kellyBetSize) / 100).toFixed(2)} ({kellyBetSize.toFixed(1)}%)
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 2 }}>
            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: overPrice !== null ? '#10b981' : '#64748b', color: 'white', opacity: overPrice !== null ? 1 : 0.7 }}>
              <Typography variant="caption">Over</Typography>
              <Typography variant="body1" fontWeight="bold">{overPrice !== null ? (overPrice > 0 ? `+${overPrice}` : overPrice) : 'N/A'}</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: underPrice !== null ? '#ef4444' : '#64748b', color: 'white', opacity: underPrice !== null ? 1 : 0.7 }}>
              <Typography variant="caption">Under</Typography>
              <Typography variant="body1" fontWeight="bold">{underPrice !== null ? (underPrice > 0 ? `+${underPrice}` : underPrice) : 'N/A'}</Typography>
            </Box>
          </Box>

          <Grid container spacing={1} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Bookmaker</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{bookmaker}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Value Side</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: isOver ? '#2e7d32' : '#d32f2f' }}>
                {valueSide.toUpperCase()}
              </Typography>
            </Grid>
            {game && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Game</Typography>
                <Typography variant="body2" noWrap>{game}</Typography>
              </Grid>
            )}
          </Grid>

          {projectionEdge > 0 && (
            <Box sx={{ mt: 2, p: 1, bgcolor: projectionEdge > 0.05 ? '#f0fdf4' : '#f0f9ff', borderRadius: 1, border: `1px solid ${projectionEdge > 0.05 ? '#bbf7d0' : '#bae6fd'}` }}>
              <Typography variant="caption" fontWeight="bold" color={projectionEdge > 0.05 ? '#059669' : '#0369a1'}>
                {projectionEdge > 0.05 ? '🎯 HIGH VALUE BET' : '✅ VALUE BET'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#0c4a6e' }}>
                Edge: +{(projectionEdge * 100).toFixed(1)}% • Projection {isOver ? 'Over' : 'Under'} by {projectionDiff.toFixed(1)}
              </Typography>
            </Box>
          )}
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button fullWidth variant="contained" color={isOver ? 'success' : 'error'} startIcon={isOver ? <TrendingUp /> : <TrendingDown />} sx={{ fontWeight: 'bold' }}>
            {isOver ? 'BET OVER' : 'BET UNDER'}
          </Button>
        </CardActions>
      </Card>
    );
  });

  const PurchaseDialog = () => null;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #f8fafc 0%, #eef2f6 100%), url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      position: 'relative',
    }}>
      <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            🏀 Advanced Player Props Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time odds, projections & Kelly criterion betting
          </Typography>
        </Box>

        {/* Live Data Dashboard */}
        <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
          <Typography variant="subtitle1" fontWeight="bold" color="#0369a1" gutterBottom>
            🎯 Live Data Dashboard
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Data Source</Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                {picksData?.source === 'static-generator' ? 'STATIC (2026 NBA)' : picksData?.data_source === 'live_sports_api' ? 'LIVE API' : picksData?.source || picksData?.data_source || 'Loading...'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Last Update</Typography>
              <Typography variant="body2" fontWeight="bold">
                {picksData?.timestamp ? new Date(picksData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Selections</Typography>
              <Typography variant="body2" fontWeight="bold">{picksData?.count || 0}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Processed</Typography>
              <Typography variant="body2" fontWeight="bold">{combinedData?.length || 0}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={<Switch checked={autoRefreshEnabled} onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)} color="primary" />}
              label="Auto-refresh (3 min)"
            />
          </Box>
        </Box>

        {/* Sport Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Select Sport</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField placeholder="Search players..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ minWidth: 200 }} />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>League</InputLabel>
                <Select value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)} label="League">
                  <MenuItem value="All">All Leagues</MenuItem>
                  <MenuItem value="NBA">NBA</MenuItem>
                  <MenuItem value="NFL">NFL</MenuItem>
                  <MenuItem value="MLB">MLB</MenuItem>
                  <MenuItem value="NHL">NHL</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['nba', 'nfl', 'mlb', 'nhl'].map((sport) => (
              <Button
                key={sport}
                variant={selectedSport === sport ? 'contained' : 'outlined'}
                onClick={() => setSelectedSport(sport)}
                disabled={picksLoading}
                startIcon={sport === 'nba' ? <SportsBasketball /> : sport === 'nfl' ? <SportsFootball /> : sport === 'mlb' ? <SportsBaseball /> : <SportsHockey />}
                sx={{ bgcolor: selectedSport === sport ? getSportColor(sport) : 'transparent', borderColor: getSportColor(sport) }}
              >
                {sport.toUpperCase()}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
            <Tab label="All Props" value="all" />
            <Tab label="Top Value Picks" value="top" />
            <Tab label="Generator" value="generator" />
          </Tabs>
        </Paper>

        {/* Generator Tab */}
        {activeTab === 'generator' && (
          <>
            <Paper elevation={1} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <AutoAwesomeIcon sx={{ mr: 0.5, fontSize: 20 }} /> Prop Generator
              </Typography>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Quick Prompts (20 Prompts)</InputLabel>
                <Select
                  label="Quick Prompts (20 Prompts)"
                  value=""
                  onChange={(e) => {
                    const query = e.target.value;
                    if (query) {
                      setGenCustomQuery(query);
                      setTimeout(() => generateProps(), 100);
                    }
                  }}
                >
                  <MenuItem value="" disabled>Select a prompt</MenuItem>
                  {ALL_SPORTS_PROMPTS.map((p, idx) => (
                    <MenuItem key={idx} value={p.query}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                placeholder="Custom query (e.g., 'nba points')"
                value={genCustomQuery}
                onChange={(e) => setGenCustomQuery(e.target.value)}
                sx={{ minWidth: 250 }}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Strategy</InputLabel>
                <Select
                  value={genStrategy}
                  label="Strategy"
                  onChange={(e) => setGenStrategy(e.target.value as any)}
                >
                  <MenuItem value="edge">Highest Edge</MenuItem>
                  <MenuItem value="value">Best Value</MenuItem>
                  <MenuItem value="projection">Top Projection</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                type="number"
                label="Count"
                value={genCount}
                onChange={(e) => setGenCount(Math.min(3, Number(e.target.value)))}
                inputProps={{ min: 1, max: 3 }}
                sx={{ width: 100 }}
              />

              <FormControlLabel
                control={<Switch size="small" checked={ignoreFilters} onChange={(e) => setIgnoreFilters(e.target.checked)} />}
                label="Ignore filters"
              />

              <Button
                variant="contained"
                size="small"
                startIcon={<AutoAwesomeIcon />}
                onClick={generateProps}
                disabled={isGenerating || (ignoreFilters ? !combinedData.length : !sortedProps.length)}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>

              {generatedSets.length > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  <IconButton 
                    size="small" 
                    onClick={handlePrevSet} 
                    disabled={currentSetIndex === 0}
                  >
                    <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ mx: 1 }}>
                    {currentSetIndex + 1}/{generatedSets.length}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={handleNextSet} 
                    disabled={currentSetIndex === generatedSets.length - 1}
                  >
                    <ExpandMore sx={{ transform: 'rotate(-90deg)' }} />
                  </IconButton>
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>⚡ Quick Prompts</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {generatorPrompts.map((prompt, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant="outlined"
                    onClick={() => handlePromptClick(prompt.query)}
                    sx={{ textTransform: 'none' }}
                  >
                    {prompt.label}
                  </Button>
                ))}
              </Box>
            </Paper>

            {/* Generated Props Display */}
            {generatedProps && generatedProps.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon color="primary" />
                    ✨ Generated Props ({generatedProps.length})
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="error" 
                    onClick={clearGenerated}
                    startIcon={<ExpandMore />}
                  >
                    Clear
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {generatedProps.map((prop, idx) => {
                    const propKey = prop.id || `generated-${idx}-${prop.player_name || prop.player}-${prop.stat_type}`;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={propKey}>
                        <PlayerCard item={prop} />
                      </Grid>
                    );
                  })}
                </Grid>
                <Divider sx={{ my: 3 }} />
              </Box>
            ) : (
              !isGenerating && (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa', mb: 3 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Generated Props
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select a prompt or enter a custom query and click Generate
                  </Typography>
                </Paper>
              )
            )}
          </>
        )}

        {/* Top Value Picks Tab */}
        {activeTab === 'top' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>🏆 Top 10 Value Picks</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Prop</TableCell>
                    <TableCell>Line</TableCell>
                    <TableCell>Projection</TableCell>
                    <TableCell>Diff</TableCell>
                    <TableCell>Edge</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell>Kelly</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topValueProps.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.player_name || p.player}</TableCell>
                      <TableCell>{p.stat_type}</TableCell>
                      <TableCell>{p.line}</TableCell>
                      <TableCell>{p.projection?.toFixed(1)}</TableCell>
                      <TableCell>{(p.projection_diff || 0).toFixed(1)}</TableCell>
                      <TableCell>{(p.projectionEdge * 100).toFixed(1)}%</TableCell>
                      <TableCell>{p.recommendedSide?.toUpperCase()}</TableCell>
                      <TableCell>{showKellySizing && p.kellyBetSize ? `${p.kellyBetSize.toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Filter Panel */}
        <FilterPanel />

        {/* Value Distribution Summary */}
        {sortedProps.length > 0 && (
          <Paper sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>📊 Value Distribution</Typography>
              <Typography variant="body2" color="text.secondary">{sortedProps.length} total props</Typography>
            </Box>
            <Grid container spacing={2}>
              {(() => {
                const positiveCount = sortedProps.filter(p => (p.projectionEdge || 0) > 0).length;
                const strongCount = sortedProps.filter(p => (p.projectionEdge || 0) > 0.03).length;
                const veryStrongCount = sortedProps.filter(p => (p.projectionEdge || 0) > 0.05).length;
                const positiveRate = ((positiveCount / sortedProps.length) * 100).toFixed(1);
                return (
                  <>
                    <Grid item xs={3}><Typography variant="h4" color="#059669">{positiveCount}</Typography><Typography variant="body2">+EV Props</Typography></Grid>
                    <Grid item xs={3}><Typography variant="h4" color="#10b981">{strongCount}</Typography><Typography variant="body2">Strong Edge (&gt;3%)</Typography></Grid>
                    <Grid item xs={3}><Typography variant="h4" color="#8b5cf6">{veryStrongCount}</Typography><Typography variant="body2">Very Strong (&gt;5%)</Typography></Grid>
                    <Grid item xs={3}><Typography variant="h4">{positiveRate}%</Typography><Typography variant="body2">+EV Rate</Typography></Grid>
                  </>
                );
              })()}
            </Grid>
          </Paper>
        )}

        {/* Stats Header */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{filteredData.length} Player Props</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={`Avg Edge: ${filteredData.length ? (filteredData.reduce((sum, i) => sum + (i.edge || 0), 0) / filteredData.length).toFixed(1) : 0}%`} color="primary" variant="outlined" />
            <Chip label={`Over: ${filteredData.filter(i => i.value_side === 'over').length}`} color="success" variant="outlined" />
            <Chip label={`Under: ${filteredData.filter(i => i.value_side === 'under').length}`} color="error" variant="outlined" />
            {showKellySizing && <Chip icon={<AttachMoney />} label={`Bankroll: $${bankrollAmount}`} color="info" variant="outlined" />}
            <Chip label={`Loading: ${picksLoading ? 'Yes' : 'No'}`} color={picksLoading ? 'warning' : 'default'} variant="outlined" />
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 3 }}><AlertTitle>Error</AlertTitle>{error}</Alert>}

        {picksLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress size={60} /></Box>}

        {/* All Props Tab */}
        {activeTab === 'all' && !picksLoading && filteredData.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {filteredData.slice(0, visibleCount).map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id || `${item.player}-${item.stat_type}`}>
                  <PlayerCard item={item} />
                </Grid>
              ))}
            </Grid>
            {visibleCount < filteredData.length && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button variant="outlined" onClick={() => setVisibleCount(prev => prev + INCREMENT)}>
                  Load More ({filteredData.length - visibleCount} remaining)
                </Button>
              </Box>
            )}
          </>
        ) : activeTab === 'all' && !picksLoading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {combinedData.length > 0 ? 'No props match your filters' : 'No data available'}
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setFilters({ minEdge: 0, maxEdge: 100, minProjection: 0, maxProjection: 50, statType: 'all', valueSide: 'all', sortBy: 'edge', sortOrder: 'desc' })}>
              Reset All Filters
            </Button>
          </Paper>
        )}

        {/* Refresh Button */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" onClick={fetchPrizepicksSelections} disabled={picksLoading} startIcon={picksLoading ? <CircularProgress size={20} /> : <Refresh />} sx={{ minWidth: 200, py: 1.5 }}>
            {picksLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Last updated: {picksData?.timestamp ? new Date(picksData.timestamp).toLocaleTimeString() : 'Never'}
          </Typography>
        </Box>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

const getSportColor = (sport: string) => {
  switch(sport) {
    case 'nba': return '#ef4444';
    case 'nfl': return '#3b82f6';
    case 'mlb': return '#f59e0b';
    case 'nhl': return '#000000';
    default: return '#8b5cf6';
  }
};

export default PrizePicksScreen;
