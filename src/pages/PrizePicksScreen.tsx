import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Grid, Card, CardContent, CardActions, Typography, Button,
  Paper, Box, Slider, FormControl, InputLabel, Select, MenuItem,
  Chip, LinearProgress, IconButton, Alert, CircularProgress,
  TextField, Tooltip, Switch, FormControlLabel, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stack, Snackbar, AlertTitle, Divider
} from '@mui/material';
import {
  FilterList, ExpandMore, ExpandLess, TrendingUp, TrendingDown,
  Refresh, BugReport, ArrowUpward, ArrowDownward,
  SportsBasketball, SportsFootball, SportsBaseball, SportsHockey, Info as InfoIcon,
  ShowChart, AttachMoney, FlashOn as FlashOnIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

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

// Confidence result interface
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

// Projection Value Result Interface
interface ProjectionValueResult {
  edge: number;
  recommendedSide: 'over' | 'under' | 'none';
  confidence: string;
  marketImplied: number;
  estimatedTrueProb: number;
  projectionDiff: number;
}

const PrizePicksScreen = () => {
  // State for data
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
  
  // ===== AUTO-REFRESH STATE =====
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const REFRESH_INTERVAL = 120000; // 2 minutes

  // ===== ADDED: Projection Filtering State =====
  const [enableProjectionFiltering, setEnableProjectionFiltering] = useState(false);
  const [projectionDifferenceThreshold, setProjectionDifferenceThreshold] = useState(0.5);
  const [onlyShowProjectionEdges, setOnlyShowProjectionEdges] = useState(false);
  const [sortByProjectionValue, setSortByProjectionValue] = useState(true);

  // ===== ADDED: Kelly Criterion State =====
  const [kellyFraction, setKellyFraction] = useState(0.25);
  const [showKellySizing, setShowKellySizing] = useState(true);
  const [bankrollAmount, setBankrollAmount] = useState(1000);

  // ===== ADDED: Value Filtering State =====
  const [minEdgeThreshold, setMinEdgeThreshold] = useState(0);
  
  // State for filtering
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
  
  const [filteredData, setFilteredData] = useState<PlayerProp[]>([]);
  const [sortedProps, setSortedProps] = useState<PlayerProp[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  // ============= NEW GENERATOR STATE =============
  const [genStrategy, setGenStrategy] = useState<'edge' | 'value' | 'projection'>('edge');
  const [genCount, setGenCount] = useState<number>(10);
  const [ignoreFilters, setIgnoreFilters] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProps, setGeneratedProps] = useState<PlayerProp[]>([]);
  const [generatedSets, setGeneratedSets] = useState<PlayerProp[][]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  // ===== UPDATED FETCH FUNCTION WITH NEW ENDPOINT =====
  const fetchPrizepicksSelections = async () => {
    try {
      setPicksLoading(true);
      setRefreshing(true);
      console.log(`📡 Fetching ${selectedSport.toUpperCase()} data...`);
      
      const response = await fetch(
        `https://python-api-fresh-production.up.railway.app/api/fantasy/props?sport=${selectedSport}&nocache=${Date.now()}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log('📊 API Response:', {
        success: data.success,
        count: data.count,
        source: data.data_source || data.source,
        isReal: data.is_real_data,
        selections: data.selections?.length,
        props: data.props?.length
      });
      
      setPicksData(data);
      setError(null);
      
      // Process the data for display
      // The backend may return either "selections" (Node service) or "props" (static generator)
      const propsArray = data.selections || data.props || [];
      if (propsArray.length > 0) {
        const processed = processPrizePicksData({ ...data, selections: propsArray });
        console.log(`✅ Processed ${processed.length} props`);
        setCombinedData(processed);
      } else {
        console.log('⚠️ No selections/props in response');
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
      setPicksLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on initial load and sport change
  useEffect(() => {
    fetchPrizepicksSelections();
  }, [selectedSport]);

  // ===== ADDED: Debug logging =====
  useEffect(() => {
    console.log('🧪 DEBUG: Checking picksData structure...');
    console.log('Picks Data:', picksData);
    console.log('Combined Data:', combinedData);
    
    if (picksData?.selections) {
      console.log('✅ API returned data:', picksData.selections.length, 'players');
      console.log('Sample players:', picksData.selections.slice(0, 5).map((p: any) => p.player));
    } else if (picksData?.props) {
      console.log('✅ API returned static props:', picksData.props.length, 'players');
    } else {
      console.log('❌ No selections or props found in picksData');
    }
  }, [picksData]);

  // ===== ADDED: UI debug check =====
  useEffect(() => {
    console.log('🔍 UI DEBUG - Checking component structure');
    
    // Check if combinedData exists and has content
    console.log('combinedData:', combinedData);
    console.log('combinedData length:', combinedData?.length);
    
    // Check what props are available for rendering
    if (combinedData && combinedData.length > 0) {
      const samplePlayer = combinedData[0];
      console.log('Sample player props:', Object.keys(samplePlayer));
      console.log('Sample player:', {
        id: samplePlayer.id,
        player: samplePlayer.player_name || samplePlayer.player,
        stat_type: samplePlayer.stat_type,
        line: samplePlayer.line,
        projection: samplePlayer.projection,
        edge: samplePlayer.edge
      });
    }
  }, [combinedData]);

  // ===== UPDATED AUTO-REFRESH EFFECT WITH NEW ENDPOINT =====
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const intervalId = setInterval(async () => {
      console.log('🔄 Auto-refreshing prize picks data...');
      
      try {
        const response = await fetch(
          `https://python-api-fresh-production.up.railway.app/api/fantasy/props?sport=${selectedSport}&nocache=${Date.now()}`
        );
        const data = await response.json();
        
        const propsArray = data.selections || data.props || [];
        if (propsArray.length > 0) {
          setPicksData(data);
          const processed = processPrizePicksData({ ...data, selections: propsArray });
          setCombinedData(processed);
          console.log('✅ Auto-refresh successful');
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, selectedSport]);

  // ===== HELPER FUNCTIONS =====
  const calculateImpliedProbability = (americanOdds: number): number => {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  };

  // ===== UPDATED: Kelly Criterion with validation =====
  function calculateKellyBetSize(edge: number, odds: number, bankroll: number) {
    // Add validation
    if (edge <= 0 || odds === null || bankroll <= 0) {
      console.log('❌ Kelly calc invalid:', { edge, odds, bankroll });
      return { fraction: 0, amount: 0, percentOfBankroll: 0 };
    }
    
    // Make sure odds are valid
    if (odds === 0 || Math.abs(odds) < 100) {
      console.log('⚠️ Suspicious odds for Kelly:', odds);
    }
    
    // Convert to decimal odds
    let decimalOdds;
    if (odds > 0) {
      decimalOdds = (odds / 100) + 1;
    } else {
      decimalOdds = (100 / Math.abs(odds)) + 1;
    }
    
    // Kelly formula
    const b = decimalOdds - 1;
    const p = 0.5 + edge; // True probability estimate
    const q = 1 - p;
    
    const kellyFractionFull = (b * p - q) / b;
    
    // Apply fraction and cap
    const kellyFractionApplied = Math.max(0, Math.min(kellyFractionFull * kellyFraction, 0.2));
    
    const betAmount = bankroll * kellyFractionApplied;
    
    console.log('✅ Kelly calculated:', {
      edge,
      odds,
      decimalOdds,
      kellyFull: kellyFractionFull,
      kellyApplied: kellyFractionApplied,
      betAmount
    });
    
    return {
      fraction: kellyFractionApplied,
      amount: betAmount,
      percentOfBankroll: kellyFractionApplied * 100
    };
  }

  // ===== ADDED: Enhanced Value Calculation with Projection Analysis =====
  function calculateProjectionValue(projection?: number, line?: number, overPrice?: number | null, underPrice?: number | null): ProjectionValueResult {
    if (projection === undefined || line === undefined) {
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
    const isOverProjection = projectionDiff > 0;
    const recommendedSide = isOverProjection ? 'over' : 'under';
    
    // Get odds for the recommended side
    const relevantOdds = isOverProjection ? overPrice : underPrice;
    
    if (relevantOdds === null || relevantOdds === undefined) {
      return { 
        edge: 0, 
        recommendedSide: 'none', 
        confidence: 'low',
        marketImplied: 0,
        estimatedTrueProb: 0.5,
        projectionDiff: projectionDiff 
      };
    }
    
    // Calculate market implied probability
    const marketImplied = relevantOdds > 0 
      ? 100 / (relevantOdds + 100)
      : -relevantOdds / (-relevantOdds + 100);
    
    // Convert projection difference to probability estimate
    const absDiff = Math.abs(projectionDiff);
    let estimatedTrueProb;
    
    // Different approaches based on projection confidence
    if (absDiff > 2.0) {
      estimatedTrueProb = isOverProjection ? 0.65 : 0.35;
    } else if (absDiff > 1.0) {
      estimatedTrueProb = isOverProjection ? 0.60 : 0.40;
    } else if (absDiff > 0.5) {
      estimatedTrueProb = isOverProjection ? 0.55 : 0.45;
    } else {
      estimatedTrueProb = isOverProjection ? 0.52 : 0.48;
    }
    
    // Calculate edge: Your estimated probability vs market implied probability
    const edge = estimatedTrueProb - marketImplied;
    
    // Determine confidence level
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
  }

  // ===== UPDATED: normalizeOdds function =====
  const normalizeOdds = (odds: any, type = ''): number | null => {
    if (odds === null || odds === undefined || odds === 'null') {
      return null;
    }
    
    const oddsStr = String(odds).trim();
    
    if (oddsStr === '') {
      return null;
    }
    
    // Handle American odds with + or - sign
    if (oddsStr.startsWith('+') || oddsStr.startsWith('-')) {
      const americanOdds = parseInt(oddsStr, 10);
      if (isNaN(americanOdds)) {
        return null;
      }
      return americanOdds;
    }
    
    // Handle decimal odds
    if (oddsStr.includes('.') && !isNaN(parseFloat(oddsStr))) {
      const decimalOdds = parseFloat(oddsStr);
      if (isNaN(decimalOdds)) {
        return null;
      }
      
      // Convert decimal to American
      if (decimalOdds >= 2.0) {
        return Math.round((decimalOdds - 1) * 100);
      } else {
        return Math.round(-100 / (decimalOdds - 1));
      }
    }
    
    // Handle numeric odds (assume American format)
    const numericOdds = parseInt(oddsStr, 10);
    if (!isNaN(numericOdds)) {
      return numericOdds;
    }
    
    return null;
  };

  // ===== UPDATED: processPrizePicksData function with random projections =====
  const processPrizePicksData = (data: any): PlayerProp[] => {
    console.log('🔄 Processing PrizePicks Data from API');
    
    const selections = data.selections || [];
    console.log(`📊 Processing ${selections.length} selections`);
    
    if (selections.length === 0) {
      return [];
    }
    
    // Create combined data
    const combined = selections.map((item: any, index: number) => {
      const playerName = item.player || item.player_name || 'Unknown Player';
      const statType = item.stat_type || 'points';
      const line = item.line || 0;
      
   // Always generate a random projection for testing (remove when backend fixed)
   const offset = (Math.random() * 4) - 2;
   let projection = parseFloat((line + offset).toFixed(1));
      
      const projectionDiff = projection - line;
      
      // Get over/under prices
      let overPrice = item.over_price;
      let underPrice = item.under_price;
      
      // If we have odds with type, use that
      if (item.odds && item.type) {
        if (item.type.toLowerCase() === 'over') {
          overPrice = normalizeOdds(item.odds, 'over');
        } else if (item.type.toLowerCase() === 'under') {
          underPrice = normalizeOdds(item.odds, 'under');
        }
      }
      
      // Normalize the prices
      overPrice = normalizeOdds(overPrice, 'over');
      underPrice = normalizeOdds(underPrice, 'under');
      
      // Calculate projection value
      const projectionValue = calculateProjectionValue(
        projection,
        line,
        overPrice,
        underPrice
      );
      
      // Calculate Kelly bet size
      let kellyBetSize = 0;
      if (projectionValue.edge > 0 && projectionValue.recommendedSide !== 'none') {
        const odds = projectionValue.recommendedSide === 'over' ? overPrice : underPrice;
        if (odds !== null) {
          const kellyResult = calculateKellyBetSize(projectionValue.edge, odds, bankrollAmount);
          kellyBetSize = kellyResult.percentOfBankroll;
        }
      }
      
      return {
        player_name: playerName,
        player: playerName,
        stat_type: statType,
        line: line,
        projection: projection,
        projection_diff: projectionDiff,
        edge: item.edge || (item.projection_edge ? item.projection_edge * 100 : 0),
        projectionEdge: item.projection_edge || projectionValue.edge,
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
        
        // Additional calculated fields
        projection_confidence: projectionValue.confidence,
        market_implied: projectionValue.marketImplied,
        estimated_true_prob: projectionValue.estimatedTrueProb,
        recommendedSide: projectionValue.recommendedSide,
        kellyBetSize: kellyBetSize,
        value_score: projectionValue.edge > 0 ? projectionValue.edge * 100 : 0
      };
    });
    
    console.log(`✅ Processed ${combined.length} props`);
    return combined;
  };

  // ===== ADDED: Enhanced Value-Based Filtering and Sorting =====
  const applyValueFiltering = (props: PlayerProp[]): PlayerProp[] => {
    let filtered = [...props];
    
    // Apply projection filter (if enabled)
    if (enableProjectionFiltering) {
      filtered = filtered.filter(p => {
        if (p.projection === undefined) return false;
        const diff = Math.abs(p.projection_diff || 0);
        return diff >= projectionDifferenceThreshold;
      });
    }
    
    // Apply edge threshold filter
    if (minEdgeThreshold > 0) {
      filtered = filtered.filter(p => {
        return (p.projectionEdge || 0) >= minEdgeThreshold;
      });
    }
    
    // Apply projection-edge agreement filter (if enabled)
    if (onlyShowProjectionEdges) {
      filtered = filtered.filter(prop => {
        const projectionDirection = (prop.projection || 0) > prop.line ? 'over' : 'under';
        return prop.value_side === projectionDirection || prop.value_side === 'arbitrage-both';
      });
    }
    
    return filtered;
  };

  // ===== ADDED: Enhanced Sorting by Value Score =====
  const sortByValueScore = (props: PlayerProp[]): PlayerProp[] => {
    return [...props].sort((a, b) => {
      // Prioritize props with positive projection edge
      if ((a.projectionEdge || 0) > 0 && (b.projectionEdge || 0) <= 0) return -1;
      if ((b.projectionEdge || 0) > 0 && (a.projectionEdge || 0) <= 0) return 1;
      
      // Both have positive or both have negative edges
      if (sortByProjectionValue) {
        // Sort by projection edge (highest to lowest)
        return (b.projectionEdge || 0) - (a.projectionEdge || 0);
      } else {
        // Sort by market edge (highest to lowest)
        return (b.edge || 0) - (a.edge || 0);
      }
    });
  };

  // ===== ADDED: Calculate Value Distribution Stats =====
  const calculateValueStats = (props: PlayerProp[]) => {
    const total = props.length;
    const withPositiveEdge = props.filter(p => (p.projectionEdge || 0) > 0).length;
    const withStrongEdge = props.filter(p => (p.projectionEdge || 0) > 0.03).length;
    const withVeryStrongEdge = props.filter(p => (p.projectionEdge || 0) > 0.05).length;
    
    return {
      total,
      withPositiveEdge,
      withStrongEdge,
      withVeryStrongEdge,
      positiveEdgePercentage: total > 0 ? (withPositiveEdge / total * 100).toFixed(1) : '0.0'
    };
  };

  // ===== Enhanced Filter useEffect with Value Analysis =====
  useEffect(() => {
    console.log('🔄 Enhanced Filter useEffect triggered');
    
    // Check if combinedData exists
    if (!combinedData || combinedData.length === 0) {
      console.log('⏳ combinedData is empty or not loaded yet');
      setSortedProps([]);
      return;
    }
    
    console.log(`📊 Enhanced filtering ${combinedData.length} props`);
    
    // Basic filters first
    const filtered = (combinedData || []).filter(prop => {
      // Basic filters
      if (!prop.player_name && !prop.player) {
        return false;
      }
      
      // League filter
      if (selectedLeague !== 'All' && prop.sport !== selectedLeague) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const playerName = (prop.player_name || prop.player || '').toLowerCase();
        const statType = (prop.stat_type || '').toLowerCase();
        const team = (prop.team || '').toLowerCase();
        
        if (!playerName.includes(query) &&
            !statType.includes(query) &&
            !team.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Apply value-based filtering
    const valueFiltered = applyValueFiltering(filtered);
    
    // Calculate value for all props
    const propsWithValue = valueFiltered.map(prop => {
      // Ensure all projection value fields are calculated
      if (prop.projectionValue === undefined && prop.projection !== undefined) {
        const projectionValue = calculateProjectionValue(
          prop.projection, 
          prop.line, 
          prop.over_price, 
          prop.under_price
        );
        
        // Calculate Kelly bet size
        let kellyBetSize = 0;
        if (projectionValue.edge > 0 && projectionValue.recommendedSide !== 'none') {
          const odds = projectionValue.recommendedSide === 'over' ? prop.over_price : prop.under_price;
          if (odds !== null) {
            const kellyResult = calculateKellyBetSize(projectionValue.edge, odds, bankrollAmount);
            kellyBetSize = kellyResult.percentOfBankroll;
          }
        }
        
        return {
          ...prop,
          projectionEdge: projectionValue.edge,
          recommendedSide: projectionValue.recommendedSide,
          kellyBetSize,
          projection_confidence: projectionValue.confidence,
          market_implied: projectionValue.marketImplied,
          estimated_true_prob: projectionValue.estimatedTrueProb,
          projection_diff: projectionValue.projectionDiff,
          value_score: projectionValue.edge > 0 ? projectionValue.edge * 100 : 0
        };
      }
      return prop;
    });
    
    // Sort by value score
    const sorted = sortByValueScore(propsWithValue);
    setSortedProps(sorted);
    
    // Display value analysis in console
    const valueStats = calculateValueStats(sorted);
    console.log('🎯 VALUE ANALYSIS:');
    console.log(`Total props analyzed: ${valueStats.total}`);
    console.log(`Props with positive edge: ${valueStats.withPositiveEdge} (${valueStats.positiveEdgePercentage}%)`);
    
  }, [
    combinedData,
    selectedLeague,
    searchQuery,
    enableProjectionFiltering,
    projectionDifferenceThreshold,
    onlyShowProjectionEdges,
    sortByProjectionValue,
    kellyFraction,
    bankrollAmount,
    minEdgeThreshold
  ]);

  // ===== Apply filters whenever sortedProps or filters change =====
  useEffect(() => {
    console.log('🔄 Applying filters...');
    
    if (!sortedProps || !Array.isArray(sortedProps)) {
      console.log('❌ No data to filter');
      setFilteredData([]);
      return;
    }
    
    console.log('📊 Starting with:', sortedProps.length, 'items');
    
    let result = [...sortedProps];
    
    // Filter by edge (convert projectionEdge to percentage if needed)
    result = result.filter(item => {
      const edge = item.edge || (item.projectionEdge ? item.projectionEdge * 100 : 0) || 0;
      return edge >= filters.minEdge && edge <= filters.maxEdge;
    });
    
    // Filter by projection
    result = result.filter(item => {
      const projection = item.projection || 0;
      return projection >= filters.minProjection && projection <= filters.maxProjection;
    });
    
    // Filter by stat type
    if (filters.statType !== 'all') {
      result = result.filter(item => 
        item.stat_type?.toLowerCase() === filters.statType.toLowerCase()
      );
    }
    
    // Filter by value side (over/under)
    if (filters.valueSide !== 'all') {
      result = result.filter(item => 
        item.value_side === filters.valueSide
      );
    }
    
    // Sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'edge':
          aValue = a.edge || (a.projectionEdge ? a.projectionEdge * 100 : 0) || 0;
          bValue = b.edge || (b.projectionEdge ? b.projectionEdge * 100 : 0) || 0;
          break;
        case 'projection':
          aValue = a.projection || 0;
          bValue = b.projection || 0;
          break;
        case 'line':
          aValue = a.line || 0;
          bValue = b.line || 0;
          break;
        case 'player':
          aValue = (a.player_name || a.player || '').toLowerCase();
          bValue = (b.player_name || b.player || '').toLowerCase();
          break;
        default:
          aValue = a.edge || 0;
          bValue = b.edge || 0;
      }
      
      if (filters.sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
    
    console.log('✅ Filtered to:', result.length, 'items');
    setFilteredData(result);
    
  }, [sortedProps, filters]);

  // ===== ADDED: Helper functions =====
  const formatPropType = (type: string | undefined): string => {
    if (!type) return 'Points';
    
    const typeMap: Record<string, string> = {
      'player_points': 'Points',
      'player_rebounds': 'Rebounds',
      'player_assists': 'Assists',
      'player_threes': '3-Pointers',
      'points': 'Points',
      'rebounds': 'Rebounds',
      'assists': 'Assists',
      'passing_yards': 'Passing Yards',
      'rushing_yards': 'Rushing Yards',
      'receiving_yards': 'Receiving Yards',
      'strikeouts': 'Strikeouts',
      'hits': 'Hits',
      'home_runs': 'Home Runs'
    };
    
    if (typeMap[type.toLowerCase()]) {
      return typeMap[type.toLowerCase()];
    }
    
    return type
      .replace('player_', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const getSportColor = (sportType: string | undefined) => {
    if (!sportType) return '#8b5cf6';
    
    switch(sportType.toLowerCase()) {
      case 'nba': return '#ef4444';
      case 'nfl': return '#3b82f6';
      case 'mlb': return '#f59e0b';
      case 'nhl': return '#000000';
      default: return '#8b5cf6';
    }
  };

  const getBookmakerColor = (bookmaker: string | undefined) => {
    if (!bookmaker) return '#64748b';
    
    const bookmakerColors: Record<string, string> = {
      'draftkings': '#8b5cf6',
      'fanduel': '#3b82f6',
      'betmgm': '#ef4444',
      'pointsbet': '#10b981',
      'caesars': '#f59e0b',
      'barstool': '#ec4899',
      'bet365': '#059669',
      'prizepicks': '#8b5cf6',
    };
    
    return bookmakerColors[bookmaker.toLowerCase()] || '#64748b';
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'N/A';
    
    // American odds format
    if (price > 0) {
      return `+${price}`;
    } else if (price < 0) {
      return price.toString();
    } else {
      return 'EV';
    }
  };

  // ===== ADDED: Format Kelly Bet Size =====
  const formatKellyBetSize = (kellyPercent: number | undefined): string => {
    if (!kellyPercent || kellyPercent <= 0) return 'No bet';
    const betAmount = (bankrollAmount * kellyPercent) / 100;
    return `$${betAmount.toFixed(2)} (${kellyPercent.toFixed(1)}%)`;
  };

  // ===== ADDED: Format Projection Confidence =====
  const formatProjectionConfidence = (confidence: string | undefined): string => {
    if (!confidence) return 'Unknown';
    
    const confidenceMap: Record<string, string> = {
      'very-high': '🎯 Very High',
      'high': '✅ High',
      'medium': '⚠️ Medium',
      'low': '🔍 Low',
      'no-edge': '❌ No Edge'
    };
    
    return confidenceMap[confidence] || confidence;
  };

  // ===== ADDED: Handle Show Only +EV Bets =====
  const handleShowPositiveEdgeBets = () => {
    const positiveEdgeProps = (combinedData || []).filter(p => (p.projectionEdge || 0) > 0);
    setSortedProps(positiveEdgeProps);
    
    setSnackbar({
      open: true,
      message: `Showing ${positiveEdgeProps.length} props with positive edge`,
      severity: 'info'
    });
  };

  // ===== ADDED: Quick Test Commands =====
  const handleForceFreshData = async () => {
    // Clear all state
    setPicksData(null);
    setCombinedData([]);
    setSortedProps([]);
    setFilteredData([]);
    
    // Fresh fetch
    fetchPrizepicksSelections();
  };

  // ============= NEW GENERATOR FUNCTIONS =============
  const generateProps = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      console.log('[Generator] Generating props...');
      const source = ignoreFilters ? combinedData : sortedProps;  // use sortedProps (already filtered and sorted by value)
      if (!source.length) {
        alert('No props available to generate from.');
        setIsGenerating(false);
        return;
      }

      const sorted = [...source];
      switch (genStrategy) {
        case 'edge':
          sorted.sort((a, b) => (b.edge || 0) - (a.edge || 0));
          break;
        case 'value':
          sorted.sort((a, b) => (b.value_score || 0) - (a.value_score || 0));
          break;
        case 'projection':
          sorted.sort((a, b) => (b.projection || 0) - (a.projection || 0));
          break;
      }

      const newSet = sorted.slice(0, genCount);
      setGeneratedProps(newSet);
      setGeneratedSets(prev => [...prev, newSet]);
      setCurrentSetIndex(prev => prev + 1);
      setIsGenerating(false);
    }, 50);
  }, [genStrategy, genCount, ignoreFilters, combinedData, sortedProps]);

  const handlePrevSet = () => {
    const newIndex = currentSetIndex - 1;
    setCurrentSetIndex(newIndex);
    setGeneratedProps(generatedSets[newIndex]);
  };

  const handleNextSet = () => {
    const newIndex = currentSetIndex + 1;
    setCurrentSetIndex(newIndex);
    setGeneratedProps(generatedSets[newIndex]);
  };

  const clearGenerated = () => {
    setGeneratedProps([]);
    setGeneratedSets([]);
    setCurrentSetIndex(0);
  };

  // Debug Info Component
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
      
      {combinedData && combinedData.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Sample Data (First 3):
          </Typography>
          {combinedData.slice(0, 3).map((item, index) => (
            <Paper key={index} sx={{ p: 1.5, mb: 1, bgcolor: 'white' }}>
              <Typography variant="body2">
                <strong>{item.player_name || item.player}</strong>: {item.stat_type} {item.line} → {item.projection} 
                ({item.edge}% edge) | {item.over_price}/{item.under_price} | {item.value_side === 'over' ? '📈 OVER' : '📉 UNDER'}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );

  // ===== ADDED: Enhanced Filter Panel Component =====
  const FilterPanel = () => (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filters & Sorting</Typography>
        <IconButton 
          onClick={() => setShowFilters(!showFilters)}
          sx={{ ml: 'auto' }}
        >
          {showFilters ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      {showFilters && (
        <>
          {/* ===== ADDED: Value Filtering Controls ===== */}
          <Paper sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#059669', fontWeight: 'bold' }}>
                🎯 Advanced Value Filtering
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableProjectionFiltering}
                    onChange={(e) => setEnableProjectionFiltering(e.target.checked)}
                    color="success"
                  />
                }
                label="Enable Projection Filtering"
                sx={{ ml: 'auto' }}
              />
            </Box>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" gutterBottom>
                  Min Projection Difference
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={projectionDifferenceThreshold}
                    onChange={(e) => setProjectionDifferenceThreshold(parseFloat(e.target.value))}
                  >
                    <MenuItem value={0.1}>0.1+ points</MenuItem>
                    <MenuItem value={0.5}>0.5+ points (Default)</MenuItem>
                    <MenuItem value={1.0}>1.0+ points</MenuItem>
                    <MenuItem value={1.5}>1.5+ points</MenuItem>
                    <MenuItem value={2.0}>2.0+ points</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" gutterBottom>
                  Min Edge Required
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={minEdgeThreshold}
                    onChange={(e) => setMinEdgeThreshold(parseFloat(e.target.value))}
                  >
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
                  control={
                    <Switch
                      checked={onlyShowProjectionEdges}
                      onChange={(e) => setOnlyShowProjectionEdges(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Projection & Edge Agree"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    color="success"
                    onClick={handleShowPositiveEdgeBets}
                    size="small"
                  >
                    Show Only +EV Bets
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sortByProjectionValue}
                        onChange={(e) => setSortByProjectionValue(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Sort by Projection Value"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* ===== ADDED: Kelly Criterion Controls ===== */}
          <Paper sx={{ mb: 3, p: 2, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AttachMoney sx={{ mr: 1, color: '#059669' }} />
              <Typography variant="h6" sx={{ color: '#059669', fontWeight: 'bold' }}>
                Kelly Criterion Bet Sizing
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showKellySizing}
                    onChange={(e) => setShowKellySizing(e.target.checked)}
                    color="success"
                  />
                }
                label="Show Optimal Bet Sizes"
                sx={{ ml: 'auto' }}
              />
            </Box>

            {showKellySizing && (
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" gutterBottom>
                    Bankroll Amount
                  </Typography>
                  <TextField
                    type="number"
                    value={bankrollAmount}
                    onChange={(e) => setBankrollAmount(parseFloat(e.target.value) || 1000)}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" gutterBottom>
                    Kelly Fraction: {kellyFraction * 100}% (Quarter Kelly)
                  </Typography>
                  <Slider
                    value={kellyFraction}
                    onChange={(e, value) => setKellyFraction(value as number)}
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
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                </Grid>

                <Grid item xs={12} sm={12} md={5}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#ecfdf5', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Bet Sizing Strategy
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="#059669">
                      ${bankrollAmount.toFixed(2)} Bankroll
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Using {kellyFraction * 100}% Kelly (${(bankrollAmount * kellyFraction).toFixed(2)} max per bet)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* Original Filter Controls */}
          <Grid container spacing={2}>
            {/* Edge Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" gutterBottom>
                Min Edge: {filters.minEdge}%
              </Typography>
              <Slider
                value={filters.minEdge}
                onChange={(e, value) => setFilters({...filters, minEdge: value as number})}
                min={0}
                max={50}
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" gutterBottom>
                Max Edge: {filters.maxEdge}%
              </Typography>
              <Slider
                value={filters.maxEdge}
                onChange={(e, value) => setFilters({...filters, maxEdge: value as number})}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            {/* Projection Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" gutterBottom>
                Min Projection: {filters.minProjection}
              </Typography>
              <Slider
                value={filters.minProjection}
                onChange={(e, value) => setFilters({...filters, minProjection: value as number})}
                min={0}
                max={50}
                step={0.5}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" gutterBottom>
                Max Projection: {filters.maxProjection}
              </Typography>
              <Slider
                value={filters.maxProjection}
                onChange={(e, value) => setFilters({...filters, maxProjection: value as number})}
                min={0}
                max={50}
                step={0.5}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            {/* Stat Type Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stat Type</InputLabel>
                <Select
                  value={filters.statType}
                  label="Stat Type"
                  onChange={(e) => setFilters({...filters, statType: e.target.value})}
                >
                  <MenuItem value="all">All Stats</MenuItem>
                  <MenuItem value="Points">Points</MenuItem>
                  <MenuItem value="Rebounds">Rebounds</MenuItem>
                  <MenuItem value="Assists">Assists</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Value Side Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Value Side</InputLabel>
                <Select
                  value={filters.valueSide}
                  label="Value Side"
                  onChange={(e) => setFilters({...filters, valueSide: e.target.value})}
                >
                  <MenuItem value="all">Over & Under</MenuItem>
                  <MenuItem value="over">Over Only</MenuItem>
                  <MenuItem value="under">Under Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Sort By */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                >
                  <MenuItem value="edge">Edge %</MenuItem>
                  <MenuItem value="projection">Projection</MenuItem>
                  <MenuItem value="line">Line</MenuItem>
                  <MenuItem value="player">Player Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Sort Order */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={filters.sortOrder}
                  label="Sort Order"
                  onChange={(e) => setFilters({...filters, sortOrder: e.target.value})}
                >
                  <MenuItem value="desc">Descending</MenuItem>
                  <MenuItem value="asc">Ascending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Quick Filter Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setFilters({
                    ...filters,
                    minEdge: 10,
                    maxEdge: 100
                  })}
                >
                  High Edge (10%+)
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setFilters({
                    ...filters,
                    minEdge: 5,
                    maxEdge: 10
                  })}
                >
                  Medium Edge (5-10%)
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setFilters({
                    ...filters,
                    statType: 'Points'
                  })}
                >
                  Points Only
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setFilters({
                    ...filters,
                    valueSide: 'over'
                  })}
                >
                  Over Only
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  size="small"
                  onClick={() => setFilters({
                    minEdge: 0,
                    maxEdge: 100,
                    minProjection: 0,
                    maxProjection: 50,
                    statType: 'all',
                    valueSide: 'all',
                    sortBy: 'edge',
                    sortOrder: 'desc'
                  })}
                >
                  Reset Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </>
      )}
      
      {/* Stats Summary */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2">
          Showing {filteredData.length} of {combinedData?.length || 0} props | 
          Avg Edge: {filteredData.length > 0 ? 
            (filteredData.reduce((sum, item) => sum + (item.edge || 0), 0) / filteredData.length).toFixed(1) : 0}% |
          Over/Under: {filteredData.filter(item => item.value_side === 'over').length}/
          {filteredData.filter(item => item.value_side === 'under').length} |
          +EV Props: {filteredData.filter(p => (p.projectionEdge || 0) > 0).length}
        </Typography>
      </Box>
    </Paper>
  );

  // ===== ENHANCED: Player Card Component =====
  const PlayerCard = ({ item }: { item: PlayerProp }) => {
    const edge = item.edge || (item.projectionEdge ? item.projectionEdge * 100 : 0) || 0;
    const isOver = item.value_side === 'over';
    const projectionEdge = item.projectionEdge || 0;
    
    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6
          },
          border: projectionEdge > 0.03 ? '2px solid #059669' : 
                  projectionEdge > 0 ? '1px solid #10b981' : '1px solid #e5e7eb'
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          {/* Player Header */}
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
              <Chip 
                label={formatPropType(item.stat_type) || 'N/A'}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
              {projectionEdge > 0 && (
                <Chip 
                  label={`+${(projectionEdge * 100).toFixed(1)}% Edge`}
                  size="small"
                  sx={{ 
                    bgcolor: projectionEdge > 0.05 ? '#059669' : 
                            projectionEdge > 0.03 ? '#10b981' : '#3b82f6',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.6rem'
                  }}
                />
              )}
            </Box>
          </Box>
          
          {/* Line vs Projection */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Line
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {item.line || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Projection
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold',
                  color: isOver ? '#2e7d32' : '#d32f2f'
                }}>
                  {item.projection || 'N/A'}
                  {isOver ? <ArrowUpward sx={{ fontSize: 16, ml: 0.5 }} /> : <ArrowDownward sx={{ fontSize: 16, ml: 0.5 }} />}
                </Typography>
              </Grid>
            </Grid>
            {/* FIXED HYDRATION ERROR: changed component to "div" */}
            <Typography variant="body2" component="div" sx={{ mt: 1, textAlign: 'center' }}>
              Difference: <strong>{(item.projection_diff || 0).toFixed(1)}</strong>
              {item.projection_confidence && (
                <>
                  {' • '}
                  <Chip 
                    label={formatProjectionConfidence(item.projection_confidence)}
                    size="small"
                    sx={{ 
                      ml: 1,
                      fontSize: '0.6rem',
                      height: '18px'
                    }}
                  />
                </>
              )}
            </Typography>
          </Box>
          
          {/* Edge Display */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Edge</span>
              <span style={{ 
                color: edge > 15 ? '#2e7d32' : edge > 8 ? '#ed6c02' : '#d32f2f',
                fontWeight: 'bold'
              }}>
                {edge.toFixed(1)}%
              </span>
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(edge, 100)} 
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: edge > 15 ? '#4caf50' : 
                                  edge > 8 ? '#ff9800' : '#f44336',
                  borderRadius: 4
                }
              }}
            />
          </Box>
          
          {/* ===== ADDED: Kelly Bet Sizing ===== */}
          {showKellySizing && item.kellyBetSize && item.kellyBetSize > 0 && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#ecfdf5', borderRadius: 1, border: '1px solid #bbf7d0' }}>
              <Typography variant="body2" fontWeight="bold" color="#059669">
                💰 Optimal Bet: {formatKellyBetSize(item.kellyBetSize)}
              </Typography>
            </Box>
          )}
          
          {/* Odds Display */}
          <Box sx={{ 
            display: 'flex',
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            mb: 2
          }}>
            <Box sx={{ 
              flex: 1, 
              textAlign: 'center', 
              p: 1,
              bgcolor: item.over_price !== null ? '#10b981' : '#64748b',
              color: 'white',
              opacity: item.over_price !== null ? 1 : 0.7
            }}>
              <Typography variant="caption" display="block">
                Over
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatPrice(item.over_price)}
              </Typography>
            </Box>
            <Box sx={{ 
              flex: 1, 
              textAlign: 'center', 
              p: 1,
              bgcolor: item.under_price !== null ? '#ef4444' : '#64748b',
              color: 'white',
              opacity: item.under_price !== null ? 1 : 0.7
            }}>
              <Typography variant="caption" display="block">
                Under
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatPrice(item.under_price)}
              </Typography>
            </Box>
          </Box>
          
          {/* Additional Details */}
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Bookmaker
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {item.bookmaker || 'Multiple'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Value Side
              </Typography>
              <Typography variant="body1" sx={{ 
                fontWeight: 'bold',
                color: isOver ? '#2e7d32' : '#d32f2f'
              }}>
                {item.value_side?.toUpperCase() || 'N/A'}
              </Typography>
            </Grid>
            {item.game && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Game
                </Typography>
                <Typography variant="body2" noWrap>
                  {item.game}
                </Typography>
              </Grid>
            )}
          </Grid>
          
          {/* ===== ADDED: Value Bet Indicator ===== */}
          {projectionEdge > 0 && (
            <Box sx={{ 
              mt: 2, 
              p: 1, 
              bgcolor: projectionEdge > 0.05 ? '#f0fdf4' : '#f0f9ff', 
              borderRadius: 1,
              border: `1px solid ${projectionEdge > 0.05 ? '#bbf7d0' : '#bae6fd'}`
            }}>
              <Typography variant="caption" fontWeight="bold" color={projectionEdge > 0.05 ? '#059669' : '#0369a1'}>
                {projectionEdge > 0.05 ? '🎯 HIGH VALUE BET' : '✅ VALUE BET'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color: '#0c4a6e' }}>
                Edge: +{(projectionEdge * 100).toFixed(1)}% • Projection {isOver ? 'Over' : 'Under'} by {(item.projection_diff || 0).toFixed(1)}
              </Typography>
            </Box>
          )}
        </CardContent>
        
        {/* Card Footer */}
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button 
            fullWidth 
            variant="contained"
            color={isOver ? 'success' : 'error'}
            startIcon={isOver ? <TrendingUp /> : <TrendingDown />}
            sx={{ fontWeight: 'bold' }}
          >
            {isOver ? 'BET OVER' : 'BET UNDER'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, minHeight: '100vh' }}>
      {/* ===== UPDATED: Header with more info ===== */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🏀 Advanced Player Props Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time odds, projections & Kelly criterion betting with advanced filtering
        </Typography>
      </Box>
      
      {/* ===== ADDED: Live Data Dashboard ===== */}
      <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
        <Typography variant="subtitle1" fontWeight="bold" color="#0369a1" gutterBottom>
          🎯 Live Data Dashboard
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Data Source</Typography>
              <Typography variant="body2" fontWeight="bold" color="success.main">
                {picksData?.source === 'static-generator' ? 'STATIC (2026 NBA)' :
                 picksData?.data_source === 'live_sports_api' ? 'LIVE API' :
                 picksData?.source || picksData?.data_source || 'Loading...'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Last Update</Typography>
              <Typography variant="body2" fontWeight="bold">
                {picksData?.timestamp ? 
                  new Date(picksData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                  '--:--'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Selections</Typography>
              <Typography variant="body2" fontWeight="bold">
                {picksData?.count || 0}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Processed</Typography>
              <Typography variant="body2" fontWeight="bold">
                {combinedData?.length || 0}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Auto-refresh toggle */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefreshEnabled}
                onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Refresh fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">Auto-refresh (2 minutes)</Typography>
              </Box>
            }
          />
        </Box>
      </Box>
      
      {/* ===== ADDED: Debug Tools ===== */}
      <Box sx={{ mb: 2, p: 2, bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #f59e0b' }}>
        <Typography variant="subtitle2" fontWeight="bold" color="#92400e" gutterBottom>
          🐛 Debug & Tools
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => console.log('🧪 STATE DUMP:', { picksData, combinedData, filteredData, picksLoading })}
              sx={{ width: '100%' }}
            >
              Dump State
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleForceFreshData}
              sx={{ width: '100%' }}
            >
              Force Fresh Data
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* ===== UPDATED: Sport Selector with NHL added ===== */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Select Sport
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>League</InputLabel>
              <Select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                label="League"
              >
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
              startIcon={
                sport === 'nba' ? <SportsBasketball /> :
                sport === 'nfl' ? <SportsFootball /> :
                sport === 'mlb' ? <SportsBaseball /> :
                <SportsHockey />
              }
              sx={{
                bgcolor: selectedSport === sport ? getSportColor(sport) : 'transparent',
                borderColor: getSportColor(sport),
                '&:hover': {
                  bgcolor: selectedSport === sport ? getSportColor(sport) : `${getSportColor(sport)}20`,
                }
              }}
            >
              {sport.toUpperCase()}
            </Button>
          ))}
        </Box>
      </Paper>

      {/* ============= NEW GENERATOR TOOLBAR ============= */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AutoAwesomeIcon sx={{ mr: 0.5, fontSize: 20 }} /> Prop Generator
        </Typography>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Strategy</InputLabel>
          <Select value={genStrategy} label="Strategy" onChange={(e) => setGenStrategy(e.target.value as any)}>
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
          onChange={(e) => setGenCount(Number(e.target.value))}
          inputProps={{ min: 1, max: 50 }}
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
            <IconButton size="small" onClick={handlePrevSet} disabled={currentSetIndex === 0}>
              <ExpandMore sx={{ transform: 'rotate(90deg)' }} />
            </IconButton>
            <Typography variant="caption" sx={{ mx: 1 }}>
              {currentSetIndex + 1}/{generatedSets.length}
            </Typography>
            <IconButton size="small" onClick={handleNextSet} disabled={currentSetIndex === generatedSets.length - 1}>
              <ExpandMore sx={{ transform: 'rotate(-90deg)' }} />
            </IconButton>
          </Box>
        )}
      </Paper>

      {/* ============= GENERATED PROPS SECTION ============= */}
      {generatedProps.length > 0 && (
        <Box sx={{ mb: 3 }}>
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

      {/* Debug Info - Remove in production */}
      <DebugInfo />
      
      {/* Enhanced Filter Panel */}
      <FilterPanel />
      
      {/* ===== ADDED: Value Stats Summary ===== */}
      {sortedProps.length > 0 && (
        <Paper sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
              📊 Value Distribution Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sortedProps.length} total props analyzed
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="#059669">
                  {calculateValueStats(sortedProps).withPositiveEdge}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  +EV Props
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="#10b981">
                  {calculateValueStats(sortedProps).withStrongEdge}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Strong Edge (greater than 3%)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="#8b5cf6">
                  {calculateValueStats(sortedProps).withVeryStrongEdge}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Very Strong (greater than 5%)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {calculateValueStats(sortedProps).positiveEdgePercentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Positive Edge Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Stats Bar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {filteredData.length} Player Props
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip 
            label={`Avg Edge: ${filteredData.length > 0 ? 
              (filteredData.reduce((sum, item) => sum + (item.edge || 0), 0) / filteredData.length).toFixed(1) : 0}%`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={`Over: ${filteredData.filter(item => item.value_side === 'over').length}`}
            color="success"
            variant="outlined"
          />
          <Chip 
            label={`Under: ${filteredData.filter(item => item.value_side === 'under').length}`}
            color="error"
            variant="outlined"
          />
          {showKellySizing && (
            <Chip 
              icon={<AttachMoney />}
              label={`Bankroll: $${bankrollAmount}`}
              color="info"
              variant="outlined"
            />
          )}
          <Chip 
            label={`Loading: ${picksLoading ? 'Yes' : 'No'}`}
            color={picksLoading ? 'warning' : 'default'}
            variant="outlined"
          />
        </Box>
      </Paper>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Data</AlertTitle>
          {error}
        </Alert>
      )}
      
      {/* ===== ENHANCED: Top Value Picks Table ===== */}
      {!picksLoading && filteredData.length > 0 && filteredData.filter(p => (p.projectionEdge || 0) > 0).length > 0 && (
        <Paper sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#059669', fontWeight: 'bold' }}>
              🎯 Top Value Picks (Projection-Based)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sorted by {sortByProjectionValue ? 'projection value' : 'market edge'}
            </Typography>
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Player</strong></TableCell>
                  <TableCell><strong>Stat/Line</strong></TableCell>
                  <TableCell><strong>Projection</strong></TableCell>
                  <TableCell><strong>Projection Edge</strong></TableCell>
                  <TableCell><strong>Confidence</strong></TableCell>
                  <TableCell><strong>Recommended</strong></TableCell>
                  {showKellySizing && <TableCell><strong>Kelly Bet</strong></TableCell>}
                  <TableCell><strong>Odds</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData
                  .filter(p => (p.projectionEdge || 0) > 0)
                  .slice(0, 8)
                  .map((prop, index) => (
                    <TableRow key={prop.id || index} sx={{ 
                      '&:hover': { 
                        backgroundColor: '#f0fdf4',
                        '& td': { fontWeight: 'bold' }
                      } 
                    }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {prop.player_name || prop.player}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prop.bookmaker}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {prop.stat_type} {prop.line}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold" color={prop.projection && prop.projection > prop.line ? '#059669' : '#ef4444'}>
                            {prop.projection?.toFixed(1)}
                          </Typography>
                          {prop.projection_diff && (
                            <Chip 
                              label={`${prop.projection_diff > 0 ? '+' : ''}${prop.projection_diff.toFixed(1)}`}
                              size="small"
                              sx={{ 
                                ml: 1,
                                bgcolor: prop.projection && prop.projection > prop.line ? '#bbf7d0' : '#fecaca',
                                color: prop.projection && prop.projection > prop.line ? '#059669' : '#ef4444',
                                fontSize: '0.6rem',
                                height: '18px'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color={(prop.projectionEdge || 0) > 0 ? '#059669' : '#ef4444'}>
                          {((prop.projectionEdge || 0) * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={formatProjectionConfidence(prop.projection_confidence)}
                          size="small"
                          sx={{ 
                            bgcolor: prop.projection_confidence === 'very-high' ? '#059669' : 
                                   prop.projection_confidence === 'high' ? '#10b981' :
                                   prop.projection_confidence === 'medium' ? '#f59e0b' :
                                   prop.projection_confidence === 'low' ? '#3b82f6' : '#64748b',
                            color: 'white',
                            fontSize: '0.6rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={prop.recommendedSide?.toUpperCase() || prop.value_side?.toUpperCase() || 'N/A'}
                          size="small"
                          sx={{ 
                            bgcolor: prop.recommendedSide === 'over' || prop.value_side === 'over' ? '#10b981' : 
                                   prop.recommendedSide === 'under' || prop.value_side === 'under' ? '#ef4444' : '#64748b',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      {showKellySizing && (
                        <TableCell>
                          <Typography variant="body2" color="#059669" fontWeight="bold">
                            {formatKellyBetSize(prop.kellyBetSize)}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2">
                          {formatPrice(prop.over_price)}/{formatPrice(prop.under_price)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Loading State */}
      {picksLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      )}
      
      {/* Player Cards Grid */}
      {!picksLoading && filteredData.length > 0 ? (
        <Grid container spacing={3}>
          {filteredData.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id || `${item.player}-${item.stat_type}`}>
              <PlayerCard item={item} />
            </Grid>
          ))}
        </Grid>
      ) : !picksLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {combinedData.length > 0 ? 'No props match your filters' : 'No data available'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {combinedData.length > 0 
              ? `Try adjusting your filter settings or reset to see all ${combinedData.length} props`
              : 'Try refreshing or check your API connection'}
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => setFilters({
              minEdge: 0,
              maxEdge: 100,
              minProjection: 0,
              maxProjection: 50,
              statType: 'all',
              valueSide: 'all',
              sortBy: 'edge',
              sortOrder: 'desc'
            })}
          >
            Reset All Filters
          </Button>
        </Paper>
      )}
      
      {/* ===== ENHANCED: Refresh Button ===== */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          onClick={fetchPrizepicksSelections}
          disabled={picksLoading}
          startIcon={picksLoading ? <CircularProgress size={20} /> : <Refresh />}
          sx={{ minWidth: 200, py: 1.5 }}
        >
          {picksLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Last updated: {picksData?.timestamp ? new Date(picksData.timestamp).toLocaleTimeString() : 'Never'}
        </Typography>
      </Box>
      
      {/* ===== ADDED: Enhanced Footer Info ===== */}
      <Paper sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Stack direction="row" spacing={3} justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Box>
            <Typography variant="body2" color="text.secondary">
              Current Sport
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: getSportColor(selectedSport),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px'
              }}>
                {selectedSport === 'nba' ? '🏀' : selectedSport === 'nfl' ? '🏈' : selectedSport === 'mlb' ? '⚾' : '🏒'}
              </Box>
              <Typography variant="body1" fontWeight="bold">
                {selectedSport.toUpperCase()}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Value Props
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="#059669">
              {calculateValueStats(filteredData).withPositiveEdge}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {calculateValueStats(filteredData).positiveEdgePercentage}% +EV Rate
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Strong Value
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="#10b981">
              {calculateValueStats(filteredData).withStrongEdge}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {'>'}3% Edge
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Typography>
          </Box>
        </Stack>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Data Sources:</strong> The Odds API, SportsData.io, DeepSeek AI | 
            <strong> Real Odds:</strong> {picksData?.selections?.filter((s: any) => s.is_real_odds).length || 0}/{picksData?.selections?.length || 0} | 
            <strong> API Status:</strong> {picksData?.apis_used ? Object.entries(picksData.apis_used).filter(([_, v]) => v).length : 0}/3 working
          </Typography>
        </Box>
        
        {/* Feature status */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {enableProjectionFiltering && (
            <Chip 
              label="🔍 Projection Filter Active"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
          {showKellySizing && (
            <Chip 
              label="💰 Kelly Bet Sizing"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {autoRefreshEnabled && (
            <Chip 
              label="⚡ Auto-refresh ON"
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PrizePicksScreen;
