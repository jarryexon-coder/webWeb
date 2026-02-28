import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Grid, Card, CardContent, CardActions, Typography, Button,
  Paper, Box, Slider, FormControl, InputLabel, Select, MenuItem,
  Chip, LinearProgress, IconButton, Alert, CircularProgress,
  TextField, Tooltip, Switch, FormControlLabel, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Snackbar, AlertTitle, Divider, Tabs, Tab
} from '@mui/material';
import {
  FilterList, ExpandMore, ExpandLess, TrendingUp, TrendingDown,
  Refresh, BugReport, ArrowUpward, ArrowDownward,
  SportsBasketball, SportsFootball, SportsBaseball, SportsHockey, Info as InfoIcon,
  ShowChart, AttachMoney, FlashOn as FlashOnIcon,
  AutoAwesome as AutoAwesomeIcon, Psychology as PsychologyIcon, Insights as InsightsIcon
} from '@mui/icons-material';
import { useDebounce } from '../utils/useDebounce';
import { usePhraseCache } from '../utils/usePhraseCache';
import { preprocessQuery, QueryIntent } from '../utils/queryProcessor';
import { logPromptPerformance } from '../utils/analytics';

// Define interfaces (unchanged)
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
  projection?: number;
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
}

// Confidence result interface (unchanged)
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

// Projection Value Result Interface (unchanged)
interface ProjectionValueResult {
  edge: number;
  recommendedSide: 'over' | 'under' | 'none';
  confidence: string;
  marketImplied: number;
  estimatedTrueProb: number;
  projectionDiff: number;
}

// Helper to conditionally log in development only
const IS_DEV = process.env.NODE_ENV !== 'production';
const log = (...args: any[]) => {
  if (IS_DEV) console.log(...args);
};
const logDebug = (...args: any[]) => {
  if (IS_DEV) console.debug(...args);
};

const PrizePicksScreen = () => {
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

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Auto‑refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const REFRESH_INTERVAL = 120000; // 2 minutes

  // ===== VALUE FILTERING STATE =====
  const [enableProjectionFiltering, setEnableProjectionFiltering] = useState(false);
  const [projectionDifferenceThreshold, setProjectionDifferenceThreshold] = useState(0.5);
  const [onlyShowProjectionEdges, setOnlyShowProjectionEdges] = useState(false);
  const [sortByProjectionValue, setSortByProjectionValue] = useState(true);
  const [minEdgeThreshold, setMinEdgeThreshold] = useState(0);
  const [projectionDiffSign, setProjectionDiffSign] = useState<'positive' | 'negative' | 'both'>('both');

  // Kelly Criterion
  const [kellyFraction, setKellyFraction] = useState(0.25);
  const [showKellySizing, setShowKellySizing] = useState(true);
  const [bankrollAmount, setBankrollAmount] = useState(1000);

  // Filters
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

  // ===== PAGINATION STATE =====
  const [visibleCount, setVisibleCount] = useState(50);
  const INCREMENT = 50;

  // ===== GENERATOR STATE =====
  const [genStrategy, setGenStrategy] = useState<'edge' | 'value' | 'projection'>('edge');
  const [genCount, setGenCount] = useState<number>(10);
  const [ignoreFilters, setIgnoreFilters] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProps, setGeneratedProps] = useState<PlayerProp[]>([]);
  const [generatedSets, setGeneratedSets] = useState<PlayerProp[][]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [genCustomQuery, setGenCustomQuery] = useState('');
  const debouncedGenQuery = useDebounce(genCustomQuery, 500);

  // ===== TAB STATE =====
  const [activeTab, setActiveTab] = useState<'all' | 'top'>('all');

  // Toggle for filter panel
  const [showFilters, setShowFilters] = useState(true);

  // Caching
  const { getCached, setCached } = usePhraseCache();

  // ===== FETCH FUNCTION (unchanged, but logs wrapped) =====
  const fetchPrizepicksSelections = async (skipCache = false) => {
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

const response = await fetch(
  `https://prizepicks-production.up.railway.app/api/prizepicks/selections?sport=${selectedSport}&nocache=${Date.now()}`
);
// Remove the headers object entirely
      
      if (!response.ok) {
        const errorText = await response.text();
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
      console.error('❌ Error fetching data:', error); // Keep error logs always
      setError(error.message);
      setCombinedData([]);
      
      setSnackbar({
        open: true,
        message: 'Failed to load data: ' + error.message,
        severity: 'error'
      });
    } finally {
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

  // ===== HELPER FUNCTIONS (with production log suppression) =====
  const calculateImpliedProbability = (americanOdds: number): number => {
    if (americanOdds > 0) return 100 / (americanOdds + 100);
    else return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  };

  const calculateKellyBetSize = (edge: number, odds: number, bankroll: number) => {
    if (edge <= 0 || odds === null || bankroll <= 0) {
      log('❌ Kelly calc invalid:', { edge, odds, bankroll });
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
    log('✅ Kelly calculated:', { edge, odds, decimalOdds, kellyFull: kellyFractionFull, kellyApplied: kellyFractionApplied, betAmount });
    return {
      fraction: kellyFractionApplied,
      amount: betAmount,
      percentOfBankroll: kellyFractionApplied * 100
    };
  };

  const calculateProjectionValue = (projection?: number, line?: number, overPrice?: number | null, underPrice?: number | null): ProjectionValueResult => {
    if (projection === undefined || line === undefined) {
      return { edge: 0, recommendedSide: 'none', confidence: 'low', marketImplied: 0, estimatedTrueProb: 0.5, projectionDiff: 0 };
    }
    const projectionDiff = projection - line;
    const isOverProjection = projectionDiff > 0;
    const recommendedSide = isOverProjection ? 'over' : 'under';
    const relevantOdds = isOverProjection ? overPrice : underPrice;
    if (relevantOdds === null || relevantOdds === undefined) {
      return { edge: 0, recommendedSide: 'none', confidence: 'low', marketImplied: 0, estimatedTrueProb: 0.5, projectionDiff };
    }
    const marketImplied = relevantOdds > 0 ? 100 / (relevantOdds + 100) : -relevantOdds / (-relevantOdds + 100);
    const absDiff = Math.abs(projectionDiff);
    let estimatedTrueProb;
    if (absDiff > 2.0) estimatedTrueProb = isOverProjection ? 0.65 : 0.35;
    else if (absDiff > 1.0) estimatedTrueProb = isOverProjection ? 0.60 : 0.40;
    else if (absDiff > 0.5) estimatedTrueProb = isOverProjection ? 0.55 : 0.45;
    else estimatedTrueProb = isOverProjection ? 0.52 : 0.48;
    const edge = estimatedTrueProb - marketImplied;
    let confidence = 'low';
    if (edge > 0.05) confidence = 'very-high';
    else if (edge > 0.03) confidence = 'high';
    else if (edge > 0.01) confidence = 'medium';
    else if (edge > 0) confidence = 'low';
    else confidence = 'no-edge';
    return { edge, recommendedSide, confidence, marketImplied, estimatedTrueProb, projectionDiff };
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

  // ===== PROCESS PRIZE PICKS DATA (with stat_type cleaning and diagnostics) =====
const processPrizePicksData = (data: any): PlayerProp[] => {
  log('🔄 Processing PrizePicks Data from API');
  const selections = data.selections || [];
  log(`📊 Processing ${selections.length} selections`);
  if (selections.length === 0) return [];

  // First, map each selection to a PlayerProp (same as before)
  const mapped = selections.map((item: any, index: number) => {
    const playerName = item.player || item.player_name || 'Unknown Player';
    
    // Clean stat_type: remove 'player_' prefix and lowercase
    const rawStat = item.stat_type || item.prop_type || item.stat || 'points';    
    const statType = rawStat.replace(/^player_/, '').toLowerCase();
    const statTypes = new Set(selections.map(s => s.stat_type || s.prop_type));
console.log('Raw stat types from API:', Array.from(statTypes));

    const line = item.line || 0;
    const offset = (Math.random() * 4) - 2; // replace with actual projection logic later
    let projection = parseFloat((line + offset).toFixed(1));
    const projectionDiff = projection - line;

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
    if (projectionValue.edge > 0 && projectionValue.recommendedSide !== 'none') {
      const odds = projectionValue.recommendedSide === 'over' ? overPrice : underPrice;
      if (odds !== null) {
        const kellyResult = calculateKellyBetSize(projectionValue.edge, odds, bankrollAmount);
        kellyBetSize = kellyResult.percentOfBankroll;
      }
    }

    // Parse numeric fields from API if they exist
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

  // DIAGNOSTIC: log stat values after mapping
  console.log('First item stat after mapping:', mapped[0]?.stat_type);
  console.log('All stat values after mapping:', [...new Set(mapped.map(s => s.stat_type))]);

  // Then group over/under pairs for the same player/stat/line
  const groupOverUnder = (props: PlayerProp[]): PlayerProp[] => {
    const grouped = new Map<string, PlayerProp>();
      
    props.forEach(prop => {
      const key = `${prop.player}-${prop.stat_type}-${prop.line}`;
      if (grouped.has(key)) {
        // Merge over/under info
        const existing = grouped.get(key)!;
        if (prop.value_side === 'over') {   
          existing.over_price = prop.over_price;
        } else if (prop.value_side === 'under') {
          existing.under_price = prop.under_price;
        }
        // Keep the higher projection (or whichever you prefer)
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
  // DIAGNOSTIC: stat types after grouping
  console.log('Stat types after grouping:', [...new Set(combined.map(p => p.stat_type))]);
  log(`✅ Processed and grouped into ${combined.length} props`);
  return combined;
};

  // ===== VALUE FILTERING LOGIC =====
  const applyValueFiltering = (props: PlayerProp[]): PlayerProp[] => {
    let filtered = [...props];
    if (enableProjectionFiltering) {
      filtered = filtered.filter(p => {
        if (p.projection === undefined) return false;
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

  // ===== MEMOIZED DERIVED DATA =====
  const sortedProps = useMemo(() => {
    log('📊 useMemo: sortedProps');
    if (!combinedData.length) return [];

    // Basic filtering (sport, search)
    let filtered = combinedData.filter(prop => {
      if (selectedLeague !== 'All' && prop.sport !== selectedLeague) return false;
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const player = (prop.player_name || prop.player || '').toLowerCase();
        const stat = (prop.stat_type || '').toLowerCase();
        const team = (prop.team || '').toLowerCase();
        if (!player.includes(query) && !stat.includes(query) && !team.includes(query)) return false;
      }
      return true;
    });

    // Value filtering
    filtered = applyValueFiltering(filtered);

    // Sort
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

    // Numeric filters
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

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (filters.sortBy) {
        case 'edge':
          aVal = a.edge || (a.projectionEdge ? a.projectionEdge * 100 : 0) || 0;
          bVal = b.edge || (b.projectionEdge ? b.projectionEdge * 100 : 0) || 0;
          break;
        case 'projection':
          aVal = a.projection || 0;
          bVal = b.projection || 0;
          break;
        case 'line':
          aVal = a.line || 0;
          bVal = b.line || 0;
          break;
        default:
          aVal = a.edge || 0;
          bVal = b.edge || 0;
      }
      return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return result;
  }, [sortedProps, filters]);

  // Top value picks (for the tab)
  const topValueProps = useMemo(() => {
    if (!sortedProps.length) return [];
    return [...sortedProps]
      .filter(p => (p.projectionEdge || 0) > 0)
      .sort((a, b) => (b.projectionEdge || 0) - (a.projectionEdge || 0))
      .slice(0, 10);
  }, [sortedProps]);

  // ===== GENERATOR (enhanced with keyword detection and diagnostic logging) =====
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
    score += (prop.projectionEdge || 0) * 5; // small bonus
    return score;
  };

const generateProps = useCallback(() => {
  setIsGenerating(true);
  setTimeout(() => {
    try {
      log('[Generator] Starting generation...');
      const source = ignoreFilters ? combinedData : sortedProps;
      if (!source.length) {
        alert('No props available to generate from.');
        setIsGenerating(false);
        return;
      }

      let workingSet = [...source];

      if (debouncedGenQuery.trim()) {
        log('[Generator] Custom query:', debouncedGenQuery);
        const intent = preprocessQuery(debouncedGenQuery);
        log('[Generator] Query intent:', intent);

        // ---- Enhanced keyword extraction ----
        const statMapping: Record<string, string[]> = {
          points: ['points', 'point', 'pts', 'scoring'],
          rebounds: ['rebounds', 'rebound', 'rebs', 'boards'],
          assists: ['assists', 'assist', 'asts', 'dimes'],
          steals: ['steals', 'steal', 'stls'],
          blocks: ['blocks', 'block', 'blks'],
          threes: ['threes', 'three', '3pt', '3-pointers', '3pm'],
        };

        const detectedStats: string[] = [];
        const queryLower = debouncedGenQuery.toLowerCase();
        Object.entries(statMapping).forEach(([stat, aliases]) => {
          if (aliases.some(alias => queryLower.includes(alias))) {
            detectedStats.push(stat);
            detectedStats.push(stat.replace(/s$/, '')); // singular
          }
        });

        const keywords = [
          intent.player,
          intent.team,
          ...intent.keywords,
          intent.statType,
          ...detectedStats,
        ].filter(Boolean).map(k => k.toLowerCase());

        log('[Generator] Keywords for filtering:', keywords);

        // ---- Filter by keywords (any match) ----
        if (keywords.length > 0) {
          workingSet = workingSet.filter(p => {
            const player = (p.player_name || p.player || '').toLowerCase();
            const team = (p.team || '').toLowerCase();
            const stat = (p.stat_type || '').toLowerCase();
            const game = (p.game || '').toLowerCase();

            // Optional: debug log for Norman Powell (uncomment if needed)
            // if (player.includes('norman powell')) {
            //   console.log('Checking Norman Powell prop:', { player, team, stat, game, keywords });
            //   keywords.forEach(k => {
            //     console.log(`  keyword "${k}": playerInc=${player.includes(k)}, teamInc=${team.includes(k)}, statInc=${stat.includes(k)}, gameInc=${game.includes(k)}`);
            //   });
            // }

            // Keep if ANY keyword matches
            return keywords.some(k =>
              player.includes(k) || team.includes(k) || stat.includes(k) || game.includes(k)
            );
          });
          console.log('[Generator] After keyword filter:', workingSet.length);
        }

        // ---- Score and sort by relevance ----
        workingSet = workingSet
          .map(p => ({ ...p, relevanceScore: scorePropRelevance(p, intent) }))
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        log('[Generator] After relevance scoring, top score:', workingSet[0]?.relevanceScore);
      } else {
        // No query: use strategy
        switch (genStrategy) {
          case 'edge':
            workingSet.sort((a, b) => (b.edge || 0) - (a.edge || 0));
            break;
          case 'value':
            workingSet.sort((a, b) => (b.value_score || 0) - (a.value_score || 0));
            break;
          case 'projection':
            workingSet.sort((a, b) => (b.projection || 0) - (a.projection || 0));
            break;
        }
      }

      const newSet = workingSet.slice(0, genCount);
      log('[Generator] New set length:', newSet.length);

      setGeneratedProps(newSet);
      setGeneratedSets(prev => [...prev, newSet]);
      setCurrentSetIndex(prev => prev + 1);

      logPromptPerformance(
        debouncedGenQuery || genStrategy,
        newSet.length,
        newSet.reduce((sum, p) => sum + (p.projectionEdge || 0) * 100, 0) / newSet.length,
        'generator'
      );
    } catch (error) {
      console.error('[Generator] Error:', error);
      alert('Generator error: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  }, 50);
}, [genStrategy, genCount, ignoreFilters, combinedData, sortedProps, debouncedGenQuery]);

  const handlePrevSet = () => {
    setCurrentSetIndex(prev => prev - 1);
    setGeneratedProps(generatedSets[currentSetIndex - 1]);
  };
  const handleNextSet = () => {
    setCurrentSetIndex(prev => prev + 1);
    setGeneratedProps(generatedSets[currentSetIndex + 1]);
  };
  const clearGenerated = () => {
    setGeneratedProps([]);
    setGeneratedSets([]);
    setCurrentSetIndex(0);
  };

  // ===== UI COMPONENTS =====
  const DebugInfo = () => (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f0f7ff', border: '2px solid #1976d2' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <BugReport sx={{ mr: 1, color: '#1976d2' }} />
        <Typography variant="subtitle1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          DEBUG INFO - API STATUS
        </Typography>
      </Box>
      <Grid container spacing={1}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2">
            <strong>Data Source:</strong> {picksData?.data_source || picksData?.source || 'Unknown'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2">
            <strong>Total Props:</strong> {combinedData?.length || 0}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2">
            <strong>Filtered Props:</strong> {filteredData.length}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="body2">
            <strong>Avg Edge:</strong> {filteredData.length > 0 ? 
              (filteredData.reduce((sum, item) => sum + (item.edge || 0), 0) / filteredData.length).toFixed(1) : 0}%
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );

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
          {/* Advanced Value Filtering */}
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

          {/* Kelly Criterion */}
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

          {/* Original Filters */}
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

  // PlayerCard with React.memo (unchanged)
  const PlayerCard = React.memo(({ item }: { item: PlayerProp }) => {
    const edge = typeof item.edge === 'number' ? item.edge : Number(item.edge) || 0;
    const projectionEdge = typeof item.projectionEdge === 'number' ? item.projectionEdge : Number(item.projectionEdge) || 0;
    const isOver = item.value_side === 'over';

    return (
      <Card sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
        border: projectionEdge > 0.03 ? '2px solid #059669' : projectionEdge > 0 ? '1px solid #10b981' : '1px solid #e5e7eb'
      }}>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 'bold' }}>
                {item.player_name || item.player}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.team || 'N/A'} • {item.position || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Chip label={item.stat_type || 'N/A'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
              {projectionEdge > 0 && (
                <Chip
                  label={`+${(projectionEdge * 100).toFixed(1)}% Edge`}
                  size="small"
                  sx={{ bgcolor: projectionEdge > 0.05 ? '#059669' : projectionEdge > 0.03 ? '#10b981' : '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.6rem' }}
                />
              )}
            </Box>
          </Box>

          {/* Line vs Projection */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Line</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{item.line || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Projection</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: isOver ? '#2e7d32' : '#d32f2f' }}>
                  {item.projection || 'N/A'}
                  {isOver ? <ArrowUpward sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownward sx={{ fontSize: 16, ml: 0.5 }} />}
                </Typography>
              </Grid>
            </Grid>
            <Typography variant="body2" component="div" sx={{ mt: 1, textAlign: 'center' }}>
              Difference: <strong>{(item.projection_diff || 0).toFixed(1)}</strong>
              {item.projection_confidence && (
                <> • <Chip label={item.projection_confidence} size="small" sx={{ fontSize: '0.6rem', height: '18px' }} /></>
              )}
            </Typography>
          </Box>

          {/* Edge Bar */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Edge</span>
              <span style={{ color: edge > 15 ? '#2e7d32' : edge > 8 ? '#ed6c02' : '#d32f2f', fontWeight: 'bold' }}>
                {edge.toFixed(1)}%
              </span>
            </Typography>
            <LinearProgress variant="determinate" value={Math.min(edge, 100)} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: edge > 15 ? '#4caf50' : edge > 8 ? '#ff9800' : '#f44336' } }} />
          </Box>

          {/* Kelly Bet Sizing */}
          {showKellySizing && item.kellyBetSize && item.kellyBetSize > 0 && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#ecfdf5', borderRadius: 1, border: '1px solid #bbf7d0' }}>
              <Typography variant="body2" fontWeight="bold" color="#059669">
                💰 Optimal Bet: ${((bankrollAmount * item.kellyBetSize) / 100).toFixed(2)} ({item.kellyBetSize.toFixed(1)}%)
              </Typography>
            </Box>
          )}

          {/* Odds Display */}
          <Box sx={{ display: 'flex', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 2 }}>
            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: item.over_price !== null ? '#10b981' : '#64748b', color: 'white', opacity: item.over_price !== null ? 1 : 0.7 }}>
              <Typography variant="caption">Over</Typography>
              <Typography variant="body1" fontWeight="bold">{item.over_price !== null ? (item.over_price > 0 ? `+${item.over_price}` : item.over_price) : 'N/A'}</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: item.under_price !== null ? '#ef4444' : '#64748b', color: 'white', opacity: item.under_price !== null ? 1 : 0.7 }}>
              <Typography variant="caption">Under</Typography>
              <Typography variant="body1" fontWeight="bold">{item.under_price !== null ? (item.under_price > 0 ? `+${item.under_price}` : item.under_price) : 'N/A'}</Typography>
            </Box>
          </Box>

          {/* Additional Details */}
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Bookmaker</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{item.bookmaker || 'Multiple'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Value Side</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: isOver ? '#2e7d32' : '#d32f2f' }}>
                {item.value_side?.toUpperCase() || 'N/A'}
              </Typography>
            </Grid>
            {item.game && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Game</Typography>
                <Typography variant="body2" noWrap>{item.game}</Typography>
              </Grid>
            )}
          </Grid>

          {/* Value Bet Indicator */}
          {projectionEdge > 0 && (
            <Box sx={{ mt: 2, p: 1, bgcolor: projectionEdge > 0.05 ? '#f0fdf4' : '#f0f9ff', borderRadius: 1, border: `1px solid ${projectionEdge > 0.05 ? '#bbf7d0' : '#bae6fd'}` }}>
              <Typography variant="caption" fontWeight="bold" color={projectionEdge > 0.05 ? '#059669' : '#0369a1'}>
                {projectionEdge > 0.05 ? '🎯 HIGH VALUE BET' : '✅ VALUE BET'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#0c4a6e' }}>
                Edge: +{(projectionEdge * 100).toFixed(1)}% • Projection {isOver ? 'Over' : 'Under'} by {(item.projection_diff || 0).toFixed(1)}
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

  return (
    <Container maxWidth="xl" sx={{ py: 3, minHeight: '100vh' }}>
      {/* Header */}
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
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <FormControlLabel control={<Switch checked={autoRefreshEnabled} onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)} color="primary" />} label="Auto-refresh (2 min)" />
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

      {/* Generator Toolbar */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ mr: 0.5, fontSize: 20 }} /> Prop Generator
        </Typography>
        <TextField size="small" placeholder="Custom query (e.g., 'Jokic points')" value={genCustomQuery} onChange={(e) => setGenCustomQuery(e.target.value)} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Strategy</InputLabel>
          <Select value={genStrategy} label="Strategy" onChange={(e) => setGenStrategy(e.target.value as any)}>
            <MenuItem value="edge">Highest Edge</MenuItem>
            <MenuItem value="value">Best Value</MenuItem>
            <MenuItem value="projection">Top Projection</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" type="number" label="Count" value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} inputProps={{ min: 1, max: 50 }} sx={{ width: 100 }} />
        <FormControlLabel control={<Switch size="small" checked={ignoreFilters} onChange={(e) => setIgnoreFilters(e.target.checked)} />} label="Ignore filters" />
        <Button variant="contained" size="small" startIcon={<AutoAwesomeIcon />} onClick={generateProps} disabled={isGenerating || (ignoreFilters ? !combinedData.length : !sortedProps.length)}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </Button>
        {generatedSets.length > 1 && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <IconButton size="small" onClick={handlePrevSet} disabled={currentSetIndex === 0}><ExpandMore sx={{ transform: 'rotate(90deg)' }} /></IconButton>
            <Typography variant="caption" sx={{ mx: 1 }}>{currentSetIndex + 1}/{generatedSets.length}</Typography>
            <IconButton size="small" onClick={handleNextSet} disabled={currentSetIndex === generatedSets.length - 1}><ExpandMore sx={{ transform: 'rotate(-90deg)' }} /></IconButton>
          </Box>
        )}
      </Paper>

      {/* Generated Props Section */}
      {generatedProps.length > 0 && (
        <Box sx={{ mb: 3, minHeight: generatedProps.length ? 'auto' : 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">✨ Generated Props ({generatedProps.length})</Typography>
            <Button size="small" onClick={clearGenerated}>Clear</Button>
          </Box>
          <Grid container spacing={2}>
            {generatedProps.map((prop, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={prop.id || idx}>
                <PlayerCard item={prop} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
        </Box>
      )}

      {/* Tabs for All Props / Top Value */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label="All Props" value="all" />
          <Tab label="Top Value Picks" value="top" />
        </Tabs>
      </Paper>

      {/* Conditional Rendering Based on Tab */}
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

      {/* Debug Info (can be removed in production) */}
      <DebugInfo />

      {/* Filter Panel */}
      <FilterPanel />

      {/* Value Stats Summary */}
      {sortedProps.length > 0 && (
        <Paper sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>📊 Value Distribution</Typography>
            <Typography variant="body2" color="text.secondary">{sortedProps.length} total props</Typography>
          </Box>
          <Grid container spacing={2}>
            {/* Compute counts outside JSX to avoid parser confusion */}
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

      {/* Stats Bar */}
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

      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 3 }}><AlertTitle>Error</AlertTitle>{error}</Alert>}

      {/* Loading State */}
      {picksLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress size={60} /></Box>}

      {/* Player Cards Grid with Pagination (only show if tab is 'all') */}
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

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

// Helper for sport color
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
