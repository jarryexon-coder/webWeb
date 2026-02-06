// src/pages/PrizePicksScreen.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip as MuiChip,
  Button,
  AlertTitle,
  IconButton,
  Snackbar,
  LinearProgress,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Refresh as RefreshIcon, SportsBasketball, SportsFootball, SportsBaseball, Info as InfoIcon, FilterList as FilterIcon, TrendingUp, ShowChart, AttachMoney } from '@mui/icons-material';
import { usePrizePicksSelections, usePlayerProps, usePrizePicksAnalytics } from '../hooks/useBackendAPI';

// Fix for Chip size prop
const Chip = (props: any) => <MuiChip size="small" {...props} />;

// Define the PlayerProp interface - UPDATED based on API structure
interface PlayerProp {
  player_name: string;
  prop_type: string; // This might be "Over"/"Under" or actual stat type
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
  actual?: number;
  status?: string;
  confidence?: string | number;
  type?: string;
  team?: string;
  timestamp?: string;
  odds?: number;
  units?: number;
  // Additional fields from API
  stat_type?: string; // Actual stat type (points, rebounds, etc.)
  market?: string; // Over/Under market
  source?: string;
}

// Updated CombinedPlayerProp Interface from Subject 3
interface CombinedPlayerProp {
  player_name: string;
  stat_type: string;
  line: number;
  over_price: number | null;
  under_price: number | null;
  bookmaker: string;
  game: string;
  sport: string;
  last_update: string;
  id: string;
  calculated_confidence?: string;
  calculated_edge?: number;
  calculated_over_value?: number;
  calculated_under_value?: number;
  is_arbitrage?: boolean;
  value_side?: 'over' | 'under' | 'none' | 'arbitrage-both';
  projection?: number;
  validation_warnings?: string[];
  has_unrealistic_odds?: boolean;
  // ===== ADDED: New fields for projection analysis =====
  projectionEdge?: number;
  combinedEdge?: number;
  estimatedTrueProb?: number;
  projectionDirection?: 'over' | 'under';
  projectionValue?: number;
  recommendedSide?: 'over' | 'under' | 'none';
  kellyBetSize?: number; // Kelly criterion bet size as percentage
  // NEW: Projection-based value fields from File 2
  projection_confidence?: string;
  market_implied?: number;
  estimated_true_prob?: number;
  projection_diff?: number;
  value_score?: number;
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
}

// ===== ADDED: Projection Value Result Interface =====
interface ProjectionValueResult {
  edge: number;
  recommendedSide: 'over' | 'under' | 'none';
  confidence: string;
  marketImplied: number;
  estimatedTrueProb: number;
  projectionDiff: number;
}

const PrizePicksScreen: React.FC = () => {
  // ===== STATE DECLARATIONS =====
  const [combinedData, setCombinedData] = useState<CombinedPlayerProp[]>([]);
  const [filteredProps, setFilteredProps] = useState<CombinedPlayerProp[]>([]);
  const [sortedProps, setSortedProps] = useState<CombinedPlayerProp[]>([]);
  
  // Use React Query hooks
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb'>('nba');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'warning' | 'error' });
  
  // Use React Query hooks for data fetching
  const { 
    data: picksData, 
    isLoading: picksLoading, 
    error: picksError,
    refetch: refetchPicks 
  } = usePrizePicksSelections(selectedSport);
  
  const { 
    data: propsData, 
    isLoading: propsLoading 
  } = usePlayerProps(selectedSport);
  
  const {
    data: analyticsData,
    isLoading: analyticsLoading
  } = usePrizePicksAnalytics();

  // Original states from File 2 (keep for compatibility)
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');

  // ===== ADDED: Projection Filtering State =====
  const [enableProjectionFiltering, setEnableProjectionFiltering] = useState(false);
  const [projectionDifferenceThreshold, setProjectionDifferenceThreshold] = useState(1.0);
  const [onlyShowProjectionEdges, setOnlyShowProjectionEdges] = useState(true);
  const [sortByProjectionValue, setSortByProjectionValue] = useState(true);

  // ===== ADDED: Kelly Criterion State =====
  const [kellyFraction, setKellyFraction] = useState(0.25);
  const [showKellySizing, setShowKellySizing] = useState(true);
  const [bankrollAmount, setBankrollAmount] = useState(1000);

  // ===== ADDED: Value Filtering State =====
  const [minEdgeThreshold, setMinEdgeThreshold] = useState(0);

  // Extract data from API responses
  const selections = picksData?.selections || [];
  const props = propsData?.props || [];
  const analyticsFromAPI = analyticsData?.analytics || [];

  // Update loading state
  const loading = picksLoading || propsLoading;
  const apiError = picksError;

  // ===== Diagnostic Code =====
  console.log('🎯 Component State Check:');
  console.log('  combinedData exists:', !!combinedData);
  console.log('  combinedData type:', typeof combinedData);
  console.log('  combinedData is array:', Array.isArray(combinedData));
  console.log('  combinedData length:', combinedData?.length || 0);
  console.log('  filteredProps length:', filteredProps?.length || 0);
  console.log('  selections length:', selections?.length || 0);
  console.log('  props length:', props?.length || 0);
  console.log('  loading:', loading);

  // Helper function to calculate complementary odds
  const calculateComplementaryOdds = (odds: number): string => {
    if (odds > 0) {
      const implied = 100 / (odds + 100);
      const complementaryImplied = 1 - implied;
      // Convert back to American odds
      if (complementaryImplied > 0.5) {
        return Math.round(-100 * complementaryImplied / (1 - complementaryImplied)).toString();
      } else {
        return `+${Math.round((1 - complementaryImplied) * 100 / complementaryImplied)}`;
      }
    }
    return 'N/A';
  };

  // Calculate implied probability from American odds
  const calculateImpliedProbability = (americanOdds: number): number => {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  };

  // Calculate fair probability (no vig)
  const calculateFairProbabilities = (overOdds: number, underOdds: number) => {
    const overProb = calculateImpliedProbability(overOdds);
    const underProb = calculateImpliedProbability(underOdds);
    const totalProb = overProb + underProb;
    const vig = totalProb - 1;
    
    // Remove vig to get fair probabilities
    const fairOverProb = overProb / totalProb;
    const fairUnderProb = underProb / totalProb;
    
    return { fairOverProb, fairUnderProb, vig };
  };

  // ===== SUBJECT 1: Updated calculateConfidence with projection analysis =====
  function calculateConfidence(overPrice: number | null, underPrice: number | null) {
    console.log(`🔄 calculateConfidence called with: over=${overPrice}, under=${underPrice}`);
    
    if (overPrice === null || underPrice === null) {
      return { level: 'invalid', edge: 0, overValue: 0, underValue: 0, isComplementary: false };
    }
    
    try {
      // Calculate implied probabilities
      const overImplied = overPrice > 0 ? 100 / (overPrice + 100) : -overPrice / (-overPrice + 100);
      const underImplied = underPrice > 0 ? 100 / (underPrice + 100) : -underPrice / (-underPrice + 100);
      const totalImplied = overImplied + underImplied;
      
      console.log(`  Implied: Over=${(overImplied*100).toFixed(1)}%, Under=${(underImplied*100).toFixed(1)}%`);
      console.log(`  Total: ${(totalImplied*100).toFixed(1)}%`);
      
      // Check if these are complementary odds
      const isComplementary = totalImplied >= 0.95 && totalImplied <= 1.15;
      
      let level, edge, overValue, underValue;
      
      if (isComplementary) {
        // Traditional complementary odds
        const bookmakerEdge = totalImplied - 1;
        const fairOverProb = overImplied / totalImplied;
        const fairUnderProb = underImplied / totalImplied;
        
        overValue = fairOverProb - overImplied;
        underValue = fairUnderProb - underImplied;
        
        const bestValue = Math.max(overValue, underValue);
        
        // Determine confidence based on best value
        if (bestValue > 0.02) {
          level = 'good-value';
          edge = bestValue;
        } else if (bestValue > 0) {
          level = 'fair';
          edge = bestValue;
        } else if (bookmakerEdge < 0.07) {
          level = 'slight-juice';
          edge = bestValue;
        } else {
          level = 'bad-value';
          edge = bestValue;
        }
        
      } else {
        // Non-complementary odds - treat independently
        // Use a benchmark probability (e.g., 50% for a coin flip)
        const benchmarkProb = 0.5;
        
        overValue = benchmarkProb - overImplied;
        underValue = benchmarkProb - underImplied;
        
        const bestValue = Math.max(overValue, underValue);
        const worstValue = Math.min(overValue, underValue);
        
        // Determine if either side has value vs benchmark
        if (bestValue > 0.05) {
          level = 'good-independent';
          edge = bestValue;
        } else if (bestValue > 0.02) {
          level = 'fair-independent';
          edge = bestValue;
        } else if (worstValue > -0.05) {
          level = 'neutral-independent';
          edge = bestValue;
        } else {
          level = 'bad-independent';
          edge = bestValue;
        }
      }
      
      console.log(`  Value: Over=${(overValue*100).toFixed(1)}%, Under=${(underValue*100).toFixed(1)}%`);
      console.log(`  Confidence: ${level} (edge: ${(edge*100).toFixed(1)}%)`);
      
      return { 
        level, 
        edge, 
        overValue, 
        underValue, 
        isComplementary,
        totalImplied 
      };
      
    } catch (error) {
      console.error(`🔥 Error in calculateConfidence:`, error);
      return { 
        level: 'error', 
        edge: 0, 
        overValue: 0, 
        underValue: 0, 
        isComplementary: false 
      };
    }
  }

  // ===== SUBJECT 1: Add projection analysis to your confidence calculation =====
  function calculateConfidenceWithProjection(overPrice: number | null, underPrice: number | null, projection?: number, line?: number) {
    const baseResult = calculateConfidence(overPrice, underPrice);
    
    if (projection !== undefined && line !== undefined) {
      const projectionDiff = projection - line;
      const isOverProjection = projectionDiff > 0;
      
      // Get the odds for the projection side
      const projectionOdds = isOverProjection ? overPrice : underPrice;
      
      if (projectionOdds !== null) {
        // Calculate market implied probability
        const marketImplied = projectionOdds > 0 
          ? 100 / (projectionOdds + 100)
          : -projectionOdds / (-projectionOdds + 100);
        
        // Convert projection difference to probability estimate
        // This is the key logic - adjust based on your projection model
        const projectionStrength = Math.abs(projectionDiff) / 3; // Adjust divisor based on stat volatility
        let estimatedTrueProb = 0.5 + (projectionStrength * 0.3); // 0-30% adjustment
        estimatedTrueProb = Math.max(0.3, Math.min(0.7, estimatedTrueProb));
        
        // Adjust for direction
        if (!isOverProjection) estimatedTrueProb = 1 - estimatedTrueProb;
        
        // Calculate projection edge
        const projectionEdge = estimatedTrueProb - marketImplied;
        
        // Combine with market edge
        const combinedEdge = (projectionEdge * 0.7) + (baseResult.edge * 0.3);
        
        return {
          ...baseResult,
          projectionEdge,
          combinedEdge,
          estimatedTrueProb,
          projectionDirection: isOverProjection ? 'over' : 'under'
        };
      }
    }
    
    return baseResult;
  }

  // ===== ADDED: Enhanced Value Calculation with Projection Analysis (FROM FILE 2) =====
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
    // KEY LOGIC: How much do you trust your projection?
    const absDiff = Math.abs(projectionDiff);
    let estimatedTrueProb;
    
    // Different approaches based on projection confidence
    if (absDiff > 2.0) {
      // Strong projection difference
      estimatedTrueProb = isOverProjection ? 0.65 : 0.35;
    } else if (absDiff > 1.0) {
      // Moderate projection difference
      estimatedTrueProb = isOverProjection ? 0.60 : 0.40;
    } else if (absDiff > 0.5) {
      // Small projection difference
      estimatedTrueProb = isOverProjection ? 0.55 : 0.45;
    } else {
      // Very close to line
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

  // ===== SUBJECT 5: Add Kelly Criterion =====
  function calculateKellyBetSize(edge: number, odds: number, bankroll: number) {
    if (edge <= 0 || odds === null) return { fraction: 0, amount: 0, percentOfBankroll: 0 };
    
    // Convert to decimal odds for Kelly calculation
    const decimalOdds = odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1;
    
    // Kelly Criterion formula: f* = (bp - q) / b
    // where b = decimal odds - 1, p = true probability, q = 1 - p
    const b = decimalOdds - 1;
    const p = 0.5 + edge; // Our estimated true probability
    const q = 1 - p;
    
    const kellyFractionFull = (b * p - q) / b;
    
    // Apply fraction (default quarter Kelly) and cap at reasonable amounts
    const kellyFractionApplied = Math.max(0, Math.min(kellyFractionFull * kellyFraction, 0.2)); // Cap at 20% of bankroll
    
    // Calculate actual bet amount
    const betAmount = bankroll * kellyFractionApplied;
    
    return {
      fraction: kellyFractionApplied,
      amount: betAmount,
      percentOfBankroll: kellyFractionApplied * 100
    };
  }

  // Update getValueSide
  function getValueSide(overPrice: number | null, underPrice: number | null, confidenceInfo: ConfidenceResult) {
    if (!confidenceInfo) return 'none';
    
    if (confidenceInfo.level.includes('error') || confidenceInfo.level.includes('invalid')) {
      return 'none';
    }
    
    // For complementary odds, pick the side with better value
    if (confidenceInfo.isComplementary) {
      if (confidenceInfo.overValue && confidenceInfo.overValue > 0.005 && 
          confidenceInfo.underValue && confidenceInfo.overValue > confidenceInfo.underValue) {
        return 'over';
      } else if (confidenceInfo.underValue && confidenceInfo.underValue > 0.005 && 
                confidenceInfo.underValue > (confidenceInfo.overValue || 0)) {
        return 'under';
      }
    } else {
      // For independent odds, pick any side with positive value
      if (confidenceInfo.overValue && confidenceInfo.overValue > 0.02) {
        return 'over';
      } else if (confidenceInfo.underValue && confidenceInfo.underValue > 0.02) {
        return 'under';
      }
    }
    
    return 'none';
  }

  // Updated normalizeOdds function from Subject 2
  const normalizeOdds = (odds: any, type = ''): number | null => {
    if (!odds && odds !== 0) {
      console.log(`normalizeOdds: No odds provided`, { odds, type });
      return null;
    }
    
    // Convert to string for parsing
    const oddsStr = String(odds);
    
    console.log(`normalizeOdds: Processing "${oddsStr}" for type "${type}"`);
    
    // Handle decimal odds (European format)
    if (oddsStr.includes('.') && !oddsStr.startsWith('+') && !oddsStr.startsWith('-')) {
      const decimalOdds = parseFloat(oddsStr);
      if (isNaN(decimalOdds)) {
        console.log(`normalizeOdds: Invalid decimal odds "${oddsStr}"`);
        return null;
      }
      
      // Convert decimal to American
      if (decimalOdds >= 2.0) {
        // Positive American odds
        const americanOdds = Math.round((decimalOdds - 1) * 100);
        console.log(`normalizeOdds: Converted decimal ${decimalOdds} to +${americanOdds}`);
        return americanOdds;
      } else {
        // Negative American odds
        const americanOdds = Math.round(-100 / (decimalOdds - 1));
        console.log(`normalizeOdds: Converted decimal ${decimalOdds} to ${americanOdds}`);
        return americanOdds;
      }
    }
    
    // Handle American odds with + or - sign
    if (oddsStr.startsWith('+') || oddsStr.startsWith('-')) {
      const americanOdds = parseInt(oddsStr, 10);
      if (isNaN(americanOdds)) {
        console.log(`normalizeOdds: Invalid American odds "${oddsStr}"`);
        return null;
      }
      
      console.log(`normalizeOdds: American odds "${oddsStr}" parsed as ${americanOdds}`);
      
      // IMPORTANT: For PrizePicks data, keep the sign as provided
      // Don't convert positive to negative based on type
      return americanOdds;
    }
    
    // Handle numeric odds (assume American format)
    const numericOdds = parseInt(oddsStr, 10);
    if (!isNaN(numericOdds)) {
      console.log(`normalizeOdds: Numeric odds "${oddsStr}" parsed as ${numericOdds}`);
      return numericOdds;
    }
    
    console.log(`normalizeOdds: Could not parse odds "${oddsStr}"`);
    return null;
  };

  // Helper function to extract array from response
  const extractArrayFromResponse = (data: any): any[] => {
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      // Try to find an array in the object
      for (const key in data) {
        if (Array.isArray(data[key])) {
          return data[key];
        }
      }
      // If no array found, return object values
      return Object.values(data);
    }
    return [];
  };

  // ===== ADDED: Enhanced Value-Based Filtering and Sorting (FROM FILE 2) =====
  const applyValueFiltering = (props: CombinedPlayerProp[]): CombinedPlayerProp[] => {
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
      filtered = filtered.filter(p => (p.projectionEdge || 0) >= minEdgeThreshold);
    }
    
    // Apply projection-edge agreement filter (if enabled)
    if (onlyShowProjectionEdges) {
      filtered = filtered.filter(prop => {
        const projectionDirection = (prop.projection || 0) > prop.line ? 'over' : 'under';
        
        // Check if edge analysis agrees with projection
        if (prop.value_side === projectionDirection) {
          return true;
        } else if (prop.value_side === 'arbitrage-both') {
          return true;
        } else {
          return false;
        }
      });
    }
    
    return filtered;
  };

  // ===== ADDED: Enhanced Sorting by Value Score =====
  const sortByValueScore = (props: CombinedPlayerProp[]): CombinedPlayerProp[] => {
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
        return (b.calculated_edge || 0) - (a.calculated_edge || 0);
      }
    });
  };

  // ===== ADDED: Calculate Value Distribution Stats =====
  const calculateValueStats = (props: CombinedPlayerProp[]) => {
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

  // Processing function
  const processPrizePicksData = (data: any): CombinedPlayerProp[] => {
    // Group items by player + stat + line to combine over/under
    const groupedItems: { [key: string]: any[] } = {};
    
    data.selections.forEach((item: any) => {
      const key = `${item.player}-${item.stat}-${item.line}-${item.bookmaker || 'default'}`;
      if (!groupedItems[key]) {
        groupedItems[key] = [];
      }
      groupedItems[key].push(item);
    });
    
    console.log(`📊 Grouped ${data.selections.length} items into ${Object.keys(groupedItems).length} groups`);
    
    // Create combined data
    const combined = Object.entries(groupedItems).map(([key, items]) => {
      const firstItem = items[0];
      
      // Try different strategies to determine Over/Under
      let overPrice: number | null = null;
      let underPrice: number | null = null;
      let hasUnrealisticOdds = false;
      let validationWarnings: string[] = [];
      
      // Strategy 1: Look for type field
      const overItem = items.find((item: any) => item.type?.toLowerCase() === 'over');
      const underItem = items.find((item: any) => item.type?.toLowerCase() === 'under');
      
      if (overItem && underItem) {
        // Use normalizeOdds
        overPrice = normalizeOdds(overItem.odds, 'over');
        underPrice = normalizeOdds(underItem.odds, 'under');
        
        // Validate odds
        if (overPrice === null || underPrice === null) {
          validationWarnings.push(`Invalid odds: Over=${overItem?.odds}, Under=${underItem?.odds}`);
        }
        
        // Enhanced validation logic
        if (overPrice !== null && underPrice !== null) {
          // Check if both are positive (PrizePicks format)
          if (overPrice > 0 && underPrice > 0) {
            const overImplied = 100 / (overPrice + 100);
            const underImplied = 100 / (underPrice + 100);
            const totalImplied = overImplied + underImplied;
            
            // If total implied is far from 100%, these aren't complementary odds
            if (totalImplied < 0.95 || totalImplied > 1.15) {
              hasUnrealisticOdds = true;
              validationWarnings.push(`Non-complementary odds (${(totalImplied*100).toFixed(1)}% total)`);
            } else if (totalImplied > 1.07) {
              // More than 7% bookmaker edge is suspicious
              validationWarnings.push(`High bookmaker edge (${((totalImplied-1)*100).toFixed(1)}%)`);
            }
          }
        }
      } else if (items.length === 2) {
        // We have 2 items but no type field - use odds sign
        const item1 = items[0];
        const item2 = items[1];
        
        // Use normalizeOdds
        const odds1 = normalizeOdds(item1.odds, item1.type || '');
        const odds2 = normalizeOdds(item2.odds, item2.type || '');
        
        if (odds1 !== null && odds2 !== null) {
          // American odds: positive for underdog, negative for favorite
          // For player props: Usually Over has positive odds, Under has negative
          if (odds1 > 0 && odds2 < 0) {
            overPrice = odds1;
            underPrice = odds2;
          } else if (odds1 < 0 && odds2 > 0) {
            overPrice = odds2;
            underPrice = odds1;
          }
          
          if (overPrice !== null && underPrice !== null) {
            // Enhanced validation for this format too
            const overImplied = overPrice > 0 ? 100 / (overPrice + 100) : -overPrice / (-overPrice + 100);
            const underImplied = underPrice > 0 ? 100 / (underPrice + 100) : -underPrice / (-underPrice + 100);
            const totalImplied = overImplied + underImplied;
            
            // Check if total implied is reasonable
            if (totalImplied < 0.95 || totalImplied > 1.15) {
              hasUnrealisticOdds = true;
              validationWarnings.push(`Non-complementary odds (${(totalImplied*100).toFixed(1)}% total)`);
            } else if (totalImplied > 1.07) {
              validationWarnings.push(`High bookmaker edge (${((totalImplied-1)*100).toFixed(1)}%)`);
            }
            
            // Check for suspicious odds (both positive or both negative with small difference)
            if ((overPrice > 0 && underPrice > 0) || (overPrice < 0 && underPrice < 0)) {
              validationWarnings.push(`Both ${overPrice > 0 ? 'positive' : 'negative'} odds`);
            }
          }
        }
      } else if (items.length === 1 && items[0].odds !== undefined) {
        // Single item - check if it's an Over or Under pick
        const item = items[0];
        // Check projection vs line to determine if it's Over or Under
        if (item.projection !== undefined && item.line !== undefined) {
          const normalizedOdds = normalizeOdds(item.odds, item.type || '');
          if (item.projection > item.line) {
            overPrice = normalizedOdds;
          } else {
            underPrice = normalizedOdds;
          }
        }
      }
      
      // Calculate confidence WITH projection analysis
      let confidenceInfo: ConfidenceResult = { level: 'bad-value', edge: 0 };
      let valueSide: 'over' | 'under' | 'none' | 'arbitrage-both' = 'none';

      try {
        // Use the new projection-aware confidence calculation
        confidenceInfo = calculateConfidenceWithProjection(
          overPrice, 
          underPrice, 
          firstItem.projection, 
          firstItem.line
        );
        
        // Get value side from confidence info
        valueSide = getValueSide(overPrice, underPrice, confidenceInfo);
        
        // Override with projection direction if projection edge is strong
        if (confidenceInfo.projectionEdge && confidenceInfo.projectionEdge > 0.02) {
          valueSide = confidenceInfo.projectionDirection || valueSide;
        }
      } catch (error) {
        console.error(`  ❌ Error calculating confidence for ${firstItem.player}:`, error);
        confidenceInfo = { level: 'error', edge: 0 };
        valueSide = 'none';
      }
      
      // ===== ADDED: Calculate projection value (FROM FILE 2) =====
      const projectionValue = calculateProjectionValue(
        firstItem.projection,
        firstItem.line,
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
      
      // ===== ENHANCED: Return object with projection-based value fields =====
      return {
        player_name: firstItem.player || 'Unknown Player',
        stat_type: firstItem.stat || 'points',
        line: firstItem.line || 0,
        over_price: overPrice,
        under_price: underPrice,
        bookmaker: firstItem.bookmaker || 'PrizePicks',
        game: `${firstItem.team || ''}`,
        sport: firstItem.sport || selectedSport,
        last_update: firstItem.timestamp || new Date().toISOString(),
        id: key,
        // Use calculated confidence
        calculated_confidence: confidenceInfo.level,
        calculated_edge: confidenceInfo.edge,
        calculated_over_value: confidenceInfo.overValue,
        calculated_under_value: confidenceInfo.underValue,
        is_arbitrage: confidenceInfo.isArbitrage,
        value_side: valueSide,
        projection: firstItem.projection,
        // ===== ADDED: New projection analysis fields =====
        projectionEdge: projectionValue.edge,
        combinedEdge: confidenceInfo.combinedEdge,
        estimatedTrueProb: confidenceInfo.estimatedTrueProb,
        projectionDirection: confidenceInfo.projectionDirection,
        projectionValue: projectionValue.edge,
        recommendedSide: projectionValue.recommendedSide,
        kellyBetSize: kellyBetSize,
        // ===== ADDED: NEW Projection-based value fields from File 2 =====
        projection_confidence: projectionValue.confidence,
        market_implied: projectionValue.marketImplied,
        estimated_true_prob: projectionValue.estimatedTrueProb,
        projection_diff: projectionValue.projectionDiff,
        value_score: projectionValue.edge > 0 ? projectionValue.edge * 100 : 0,
        // Add validation warnings for debugging
        validation_warnings: validationWarnings.length > 0 ? validationWarnings : undefined,
        has_unrealistic_odds: hasUnrealisticOdds
      };
    });

    // Combined Data Analysis
    console.log(`🔍 Combined Data Analysis:`);
    console.log(`   Total props: ${combined.length}`);
    console.log(`   Props with projections: ${combined.filter(p => p.projection !== undefined).length}`);
    console.log(`   Props without projections: ${combined.filter(p => p.projection === undefined).length}`);

    // Show first few props with and without projections
    console.log(`📋 Sample props WITH projections:`);
    combined
      .filter(p => p.projection !== undefined)
      .slice(0, 5)
      .forEach((p, i) => {
        console.log(`   ${i+1}. ${p.player_name} ${p.stat_type} ${p.line}`);
        console.log(`      Projection: ${p.projection}, Over: ${p.over_price}, Under: ${p.under_price}`);
        console.log(`      Projection Edge: ${(p.projectionEdge || 0) * 100}%`);
        console.log(`      Value Score: ${p.value_score?.toFixed(1)}`);
      });

    console.log(`📋 Sample props WITHOUT projections:`);
    combined
      .filter(p => p.projection === undefined)
      .slice(0, 5)
      .forEach((p, i) => {
        console.log(`   ${i+1}. ${p.player_name} ${p.stat_type} ${p.line}`);
        console.log(`      Over: ${p.over_price}, Under: ${p.under_price}`);
      });

    return combined;
  };

  // Combine player props function (helper)
  const combinePlayerProps = (props: PlayerProp[]): CombinedPlayerProp[] => {
    const grouped: { [key: string]: CombinedPlayerProp } = {};
    
    props.forEach(prop => {
      const key = `${prop.player_name}-${prop.stat_type}-${prop.line}-${prop.bookmaker}`;
      if (!grouped[key]) {
        grouped[key] = {
          player_name: prop.player_name,
          stat_type: prop.stat_type || 'points',
          line: prop.line,
          over_price: null,
          under_price: null,
          bookmaker: prop.bookmaker,
          game: prop.game,
          sport: prop.sport,
          last_update: prop.last_update,
          id: key
        };
      }
      
      // Update over/under prices based on prop type
      if (prop.prop_type?.toLowerCase().includes('over') || prop.type?.toLowerCase() === 'over') {
        grouped[key].over_price = prop.over_price;
      } else if (prop.prop_type?.toLowerCase().includes('under') || prop.type?.toLowerCase() === 'under') {
        grouped[key].under_price = prop.under_price;
      }
    });
    
    return Object.values(grouped);
  };

  // ===== Enhanced Filter useEffect with Value Analysis =====
  useEffect(() => {
    console.log('🔄 Filter useEffect triggered');
    
    // Check if we have selections from API
    if (selections && selections.length > 0) {
      console.log(`📊 Processing ${selections.length} selections from API`);
      const processedData = processPrizePicksData({ success: true, selections });
      setCombinedData(processedData);
      setActiveEndpoint(`/api/prizepicks/selections?sport=${selectedSport}`);
      setError(null);
    } else if (props && props.length > 0) {
      console.log(`📊 Processing ${props.length} player props from API`);
      // Process player props data if available
      const processedData = processPlayerPropsData(props);
      setCombinedData(processedData);
      setActiveEndpoint(`/api/playerprops?sport=${selectedSport}`);
    }
    
    // Update analytics from API
    if (analyticsFromAPI && analyticsFromAPI.length > 0) {
      setAnalytics(analyticsFromAPI);
    }
    
    // Set error if API failed
    if (apiError) {
      setError(apiError.message);
    }
  }, [selections, props, analyticsFromAPI, apiError, selectedSport]);

  useEffect(() => {
    console.log('🔄 Filter useEffect triggered');
    
    // Check if combinedData exists
    if (!combinedData || combinedData.length === 0) {
      console.log('⏳ combinedData is empty or not loaded yet');
      setFilteredProps([]);
      setSortedProps([]);
      return;
    }
    
    console.log(`📊 Filtering ${combinedData.length} props`);
    
    // ===== ENHANCED FILTERING: Basic filters first =====
    const filtered = (combinedData || []).filter(prop => {
      // Basic filters
      if (!prop.player_name || prop.player_name === 'Unknown Player') {
        return false;
      }
      
      // League filter
      if (selectedLeague !== 'All' && prop.sport !== selectedLeague) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!prop.player_name.toLowerCase().includes(query) &&
            !prop.stat_type.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      return true;
    });
    
    // ===== ENHANCED: Apply value-based filtering =====
    const valueFiltered = applyValueFiltering(filtered);
    
    console.log(`✅ Filtered to ${valueFiltered.length} props`);
    setFilteredProps(valueFiltered);
    
    // ===== ENHANCED: Calculate value for all props =====
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
          projectionValue: projectionValue.edge,
          projectionEdge: projectionValue.edge,
          recommendedSide: projectionValue.recommendedSide,
          kellyBetSize,
          // New fields from File 2
          projection_confidence: projectionValue.confidence,
          market_implied: projectionValue.marketImplied,
          estimated_true_prob: projectionValue.estimatedTrueProb,
          projection_diff: projectionValue.projectionDiff,
          value_score: projectionValue.edge > 0 ? projectionValue.edge * 100 : 0
        };
      }
      return prop;
    });
    
    // ===== ENHANCED: Sort by value score =====
    const sorted = sortByValueScore(propsWithValue);
    
    setSortedProps(sorted);
    
    // ===== ENHANCED: Display value analysis =====
    const valueStats = calculateValueStats(sorted);
    
    console.log('🎯 VALUE-BASED BET RECOMMENDATIONS:');
    console.log(`Total props analyzed: ${valueStats.total}`);
    console.log(`Props with positive edge: ${valueStats.withPositiveEdge} (${valueStats.positiveEdgePercentage}%)`);
    console.log(`Props with strong edge (greater than 3%): ${valueStats.withStrongEdge}`);
    console.log(`Props with very strong edge (greater than 5%): ${valueStats.withVeryStrongEdge}`);
    
    // Show top 10 value picks
    const topValuePicks = sorted
      .filter(p => (p.projectionEdge || 0) > 0)
      .slice(0, 10);
    
    if (topValuePicks.length > 0) {
      console.log('\n🎯 TOP 10 VALUE PICKS:');
      topValuePicks.forEach((prop, i) => {
        console.log(`\n${i+1}. ${prop.player_name} - ${prop.stat_type} ${prop.line}`);
        console.log(`   Projection: ${prop.projection} (${prop.recommendedSide?.toUpperCase()} by ${(prop.projection_diff || 0).toFixed(1)})`);
        console.log(`   Edge: ${((prop.projectionEdge || 0) * 100).toFixed(2)}%`);
        console.log(`   Market Odds: ${prop.recommendedSide === 'over' ? formatPrice(prop.over_price) : formatPrice(prop.under_price)}`);
        console.log(`   Confidence: ${prop.projection_confidence}`);
        console.log(`   Kelly Bet: ${(prop.kellyBetSize || 0).toFixed(1)}% of bankroll ($${((bankrollAmount * (prop.kellyBetSize || 0)) / 100).toFixed(2)})`);
      });
    } else {
      console.log('\n⚠️ No props with positive edge found. Showing closest to positive:');
      const closestToPositive = [...sorted]
        .sort((a, b) => (b.projectionEdge || 0) - (a.projectionEdge || 0))
        .slice(0, 5);
      
      closestToPositive.forEach((prop, i) => {
        console.log(`${i+1}. ${prop.player_name} - Edge: ${((prop.projectionEdge || 0) * 100).toFixed(2)}%`);
      });
    }
    
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

  // Helper function to process player props data
  const processPlayerPropsData = (propsArray: any[]): CombinedPlayerProp[] => {
    const groupedItems: { [key: string]: any[] } = {};
    
    propsArray.forEach((item: any) => {
      const key = `${item.player_name || item.player}-${item.stat_type || 'points'}-${item.line || 0}-${item.bookmaker || 'default'}`;
      if (!groupedItems[key]) {
        groupedItems[key] = [];
      }
      groupedItems[key].push(item);
    });
    
    return Object.entries(groupedItems).map(([key, items]) => {
      const firstItem = items[0];
      const confidenceInfo = calculateConfidenceWithProjection(
        firstItem.over_price,
        firstItem.under_price,
        firstItem.projection,
        firstItem.line
      );
      
      const projectionValue = calculateProjectionValue(
        firstItem.projection,
        firstItem.line,
        firstItem.over_price,
        firstItem.under_price
      );
      
      // Calculate Kelly bet size
      let kellyBetSize = 0;
      if (projectionValue.edge > 0 && projectionValue.recommendedSide !== 'none') {
        const odds = projectionValue.recommendedSide === 'over' ? firstItem.over_price : firstItem.under_price;
        if (odds !== null) {
          const kellyResult = calculateKellyBetSize(projectionValue.edge, odds, bankrollAmount);
          kellyBetSize = kellyResult.percentOfBankroll;
        }
      }
      
      return {
        player_name: firstItem.player_name || firstItem.player || 'Unknown Player',
        stat_type: firstItem.stat_type || 'points',
        line: firstItem.line || 0,
        over_price: firstItem.over_price,
        under_price: firstItem.under_price,
        bookmaker: firstItem.bookmaker || 'Unknown',
        game: firstItem.game || '',
        sport: firstItem.sport || selectedSport,
        last_update: firstItem.last_update || new Date().toISOString(),
        id: key,
        calculated_confidence: confidenceInfo.level,
        calculated_edge: confidenceInfo.edge,
        projection: firstItem.projection,
        value_side: getValueSide(firstItem.over_price, firstItem.under_price, confidenceInfo),
        projectionEdge: projectionValue.edge,
        recommendedSide: projectionValue.recommendedSide,
        kellyBetSize,
        projection_confidence: projectionValue.confidence,
        market_implied: projectionValue.marketImplied,
        estimated_true_prob: projectionValue.estimatedTrueProb,
        projection_diff: projectionValue.projectionDiff,
        value_score: projectionValue.edge > 0 ? projectionValue.edge * 100 : 0
      };
    });
  };

  // Handle sport change
  const handleSportChange = (newSport: 'nba' | 'nfl' | 'mlb') => {
    setSelectedSport(newSport);
    setSnackbar({
      open: true,
      message: `Loading ${newSport.toUpperCase()} player props...`,
      severity: 'info'
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    setSnackbar({
      open: true,
      message: 'Refreshing data...',
      severity: 'info'
    });
    
    await refetchPicks();
    
    setRefreshing(false);
    setSnackbar({
      open: true,
      message: 'Data refreshed successfully',
      severity: 'success'
    });
  };

  // Helper functions from File 1 - UPDATED WITH SAFETY CHECKS
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
      'home_runs': 'Home Runs',
      'over': 'Over',
      'under': 'Under'
    };
    
    if (typeMap[type.toLowerCase()]) {
      return typeMap[type.toLowerCase()];
    }
    
    try {
      return type
        .replace('player_', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
    } catch (error) {
      console.warn('❌ Error formatting prop type:', { type, error });
      return type;
    }
  };

  const getSportColor = (sportType: string | undefined) => {
    if (!sportType) return '#8b5cf6';
    
    switch(sportType.toLowerCase()) {
      case 'nba': return '#ef4444';
      case 'nfl': return '#3b82f6';
      case 'mlb': return '#f59e0b';
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
      'sugarhouse': '#8b5cf6',
      'twinspires': '#3b82f6',
      'wynnbet': '#ef4444',
      'prizepicks': '#8b5cf6',
    };
    
    return bookmakerColors[bookmaker.toLowerCase()] || '#64748b';
  };

  // Updated formatPrice function
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

  // Get confidence color for chip display
  const getConfidenceColor = (confidence: string | undefined) => {
    switch(confidence) {
      case 'arbitrage': return '#7c3aed';
      case 'good-value': return '#059669';
      case 'fair': return '#3b82f6';
      case 'slight-juice': return '#f59e0b';
      case 'bad-value': return '#ef4444';
      case 'invalid': return '#6b7280';
      case 'error': return '#6b7280';
      default: return '#64748b';
    }
  };

  // Format confidence level for display
  const formatConfidence = (confidence: string | undefined): string => {
    if (!confidence) return 'Unknown';
    
    const confidenceMap: Record<string, string> = {
      'arbitrage': '💰 Arbitrage',
      'good-value': '✅ Good Value',
      'fair': '⚖️ Fair',
      'slight-juice': '⚠️ Slight Juice',
      'bad-value': '❌ Bad Value',
      'invalid': '❓ Invalid',
      'error': '🚨 Error'
    };
    
    return confidenceMap[confidence] || confidence.replace('-', ' ');
  };

  // Get edge sign for display
  const getEdgeSign = (edge: number | undefined): string => {
    if (edge === undefined) return '';
    return edge > 0 ? '+' : '';
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
    setFilteredProps(positiveEdgeProps);
    
    setSnackbar({
      open: true,
      message: `Showing ${positiveEdgeProps.length} props with positive edge`,
      severity: 'info'
    });
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, mt: 2 }}>Loading prize picks...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading {selectedSport.toUpperCase()} player props...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* ===== Debug Info Display ===== */}
      <Box sx={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px', borderRadius: '4px' }}>
        <Typography variant="subtitle2" fontWeight="bold">Debug Info:</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <Typography variant="caption">combinedData loaded: {combinedData ? 'YES' : 'NO'}</Typography>
          <Typography variant="caption">combinedData length: {combinedData?.length || 0}</Typography>
          <Typography variant="caption">sortedProps length: {sortedProps?.length || 0}</Typography>
          <Typography variant="caption">selections length: {selections?.length || 0}</Typography>
          <Typography variant="caption">props length: {props?.length || 0}</Typography>
          <Typography variant="caption">sortByProjectionValue: {sortByProjectionValue ? 'YES' : 'NO'}</Typography>
          <Typography variant="caption">minEdgeThreshold: {(minEdgeThreshold * 100).toFixed(1)}%</Typography>
        </Box>
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            PrizePicks Player Props
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Live player props from various bookmakers
            {activeEndpoint && (
              <Chip 
                label={`Source: ${activeEndpoint}`}
                size="small"
                color="success"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleRefresh} 
          disabled={refreshing || picksLoading}
          startIcon={<RefreshIcon />}
        >
          {refreshing || picksLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

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

      {/* ===== ADDED: Value Filtering Controls (FROM FILE 2) ===== */}
      <Paper sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#059669', fontWeight: 'bold' }}>
            🎯 Value Filtering
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
                <MenuItem value={0.5}>0.5+ points</MenuItem>
                <MenuItem value={1.0}>1.0+ points (Default)</MenuItem>
                <MenuItem value={1.5}>1.5+ points</MenuItem>
                <MenuItem value={2.0}>2.0+ points</MenuItem>
                <MenuItem value={3.0}>3.0+ points</MenuItem>
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

        {/* Value Stats */}
        {sortedProps.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" color="#059669">
                    {calculateValueStats(sortedProps).withPositiveEdge}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    +EV Props
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" color="#3b82f6">
                    {calculateValueStats(sortedProps).withStrongEdge}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Strong Edge (greater than 3%)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" color="#8b5cf6">
                    {calculateValueStats(sortedProps).withVeryStrongEdge}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Very Strong (greater than 5%)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">
                    {calculateValueStats(sortedProps).positiveEdgePercentage}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Positive Edge Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Sport selector */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant={selectedSport === 'nba' ? 'contained' : 'outlined'}
          onClick={() => handleSportChange('nba')}
          startIcon={<SportsBasketball />}
          sx={{
            bgcolor: selectedSport === 'nba' ? getSportColor('nba') : 'transparent',
            borderColor: getSportColor('nba'),
            '&:hover': {
              bgcolor: selectedSport === 'nba' ? getSportColor('nba') : `${getSportColor('nba')}20`,
            }
          }}
        >
          NBA
        </Button>
        <Button
          variant={selectedSport === 'nfl' ? 'contained' : 'outlined'}
          onClick={() => handleSportChange('nfl')}
          startIcon={<SportsFootball />}
          sx={{
            bgcolor: selectedSport === 'nfl' ? getSportColor('nfl') : 'transparent',
            borderColor: getSportColor('nfl'),
            '&:hover': {
              bgcolor: selectedSport === 'nfl' ? getSportColor('nfl') : `${getSportColor('nfl')}20`,
            }
          }}
        >
          NFL
        </Button>
        <Button
          variant={selectedSport === 'mlb' ? 'contained' : 'outlined'}
          onClick={() => handleSportChange('mlb')}
          startIcon={<SportsBaseball />}
          sx={{
            bgcolor: selectedSport === 'mlb' ? getSportColor('mlb') : 'transparent',
            borderColor: getSportColor('mlb'),
            '&:hover': {
              bgcolor: selectedSport === 'mlb' ? getSportColor('mlb') : `${getSportColor('mlb')}20`,
            }
          }}
        >
          MLB
        </Button>
      </Box>

      {/* Search and Filter Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search players, games, or stats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
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
          </Select>
        </FormControl>

        <Tooltip title="Props are now combined - Over and Under odds shown together">
          <Chip 
            icon={<InfoIcon />}
            label={`${(combinedData || []).length} Combined Props`}
            color="primary"
            variant="outlined"
          />
        </Tooltip>

        <Tooltip title={sortByProjectionValue ? "Sorted by projection value (highest first)" : "Sorted by market edge (highest first)"}>
          <Chip 
            icon={sortByProjectionValue ? <TrendingUp /> : <ShowChart />}
            label={sortByProjectionValue ? "Sort: Projection Value" : "Sort: Market Edge"}
            size="small"
            color="info"
            variant="outlined"
          />
        </Tooltip>

        {/* ===== ADDED: Projection Filter Status Chip ===== */}
        {enableProjectionFiltering && (
          <Tooltip title={`Filtering props where projection differs from line by ${projectionDifferenceThreshold}+ points${onlyShowProjectionEdges ? ' and projection agrees with edge analysis' : ''}`}>
            <Chip 
              icon={<FilterIcon />}
              label="Projection Filter Active"
              size="small"
              color="warning"
              variant="outlined"
            />
          </Tooltip>
        )}

        {/* ===== ADDED: Edge Threshold Chip ===== */}
        {minEdgeThreshold > 0 && (
          <Tooltip title={`Only showing props with at least ${(minEdgeThreshold * 100).toFixed(1)}% edge`}>
            <Chip 
              label={`Min Edge: ${(minEdgeThreshold * 100).toFixed(1)}%`}
              size="small"
              color="success"
              variant="outlined"
            />
          </Tooltip>
        )}
      </Box>

      {/* ===== ENHANCED: Top Value Picks Table ===== */}
      {sortedProps.length > 0 && sortedProps.filter(p => (p.projectionEdge || 0) > 0).length > 0 && (
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
                {sortedProps
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
                          {prop.player_name}
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
                          {prop.projection && prop.projection_diff && (
                            <Chip 
                              label={`${prop.projection_diff > 0 ? '+' : ''}${prop.projection_diff.toFixed(1)}`}
                              size="small"
                              sx={{ 
                                ml: 1,
                                bgcolor: prop.projection > prop.line ? '#bbf7d0' : '#fecaca',
                                color: prop.projection > prop.line ? '#059669' : '#ef4444',
                                fontSize: '0.6rem',
                                height: '18px'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color={(prop.projectionEdge || 0) > 0 ? '#059669' : '#ef4444'}>
                          {getEdgeSign(prop.projectionEdge)}{((prop.projectionEdge || 0) * 100).toFixed(1)}%
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
                          label={prop.recommendedSide?.toUpperCase() || 'N/A'}
                          size="small"
                          sx={{ 
                            bgcolor: prop.recommendedSide === 'over' ? '#10b981' : 
                                   prop.recommendedSide === 'under' ? '#ef4444' : '#64748b',
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

      {/* Edge Distribution Stats */}
      {sortedProps.length > 0 && (
        <Paper sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
              📊 Value Distribution Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sortedProps.length} total props
              {enableProjectionFiltering && (
                <Chip 
                  label={`Projection Filter: ${projectionDifferenceThreshold}+ points`}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="#059669">
                  {sortedProps.filter(p => (p.projectionEdge || 0) > 0.05).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Very Strong Edge (+5%+)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="#10b981">
                  {sortedProps.filter(p => (p.projectionEdge || 0) > 0.03 && (p.projectionEdge || 0) <= 0.05).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Strong Edge (+3-5%)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="#3b82f6">
                  {sortedProps.filter(p => (p.projectionEdge || 0) > 0 && (p.projectionEdge || 0) <= 0.03).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fair Edge (0-3%)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="h4" fontWeight="bold" color="#ef4444">
                  {sortedProps.filter(p => (p.projectionEdge || 0) <= 0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Negative Edge
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Edge Threshold Indicator */}
          {minEdgeThreshold > 0 && (
            <Box sx={{ mt: 2, p: 1, bgcolor: '#fef3c7', borderRadius: 1, border: '1px solid #f59e0b' }}>
              <Typography variant="body2" color="#92400e" align="center">
                ⚠️ Showing only props with at least {(minEdgeThreshold * 100).toFixed(1)}% edge
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error Loading Data</AlertTitle>
          {error}
        </Alert>
      )}

      {/* Player Props Grid - Using sorted props */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#3a0ca3', mb: 3 }}>
          🎯 Player Props ({sortedProps.length})
          {sortedProps.length > 0 && (
            <Chip 
              label={`${sortedProps.filter(p => p.projection !== undefined).length} with projections`}
              size="small"
              color="success"
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        
        {sortedProps.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body1">
              {searchQuery.trim() 
                ? `No props found matching "${searchQuery}"`
                : enableProjectionFiltering
                ? `No props found with projections ${projectionDifferenceThreshold}+ points from line${onlyShowProjectionEdges ? ' where projection agrees with edge' : ''}. Try adjusting filters.`
                : `No player props available for ${selectedSport.toUpperCase()} right now. Try refreshing or check back closer to game time.`
              }
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {sortedProps.slice(0, 50).map((prop, index) => {              
              return (
                <Grid item xs={12} sm={6} md={4} key={prop.id || index}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                    border: (prop.projectionEdge || 0) > 0.03 ? '2px solid #059669' : 
                            (prop.projectionEdge || 0) > 0 ? '1px solid #10b981' : '1px solid #e5e7eb'
                  }}>
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', flex: 1 }}>
                          {prop.player_name || 'Unknown Player'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Chip 
                            label={prop.bookmaker || 'Unknown'}
                            size="small"
                            sx={{ 
                              bgcolor: getBookmakerColor(prop.bookmaker),
                              color: 'white',
                              fontWeight: 'bold',
                              mb: 0.5
                            }}
                          />
                          {(prop.projectionEdge || 0) > 0 && (
                            <Chip 
                              label={`+${((prop.projectionEdge || 0) * 100).toFixed(1)}% Edge`}
                              size="small"
                              sx={{ 
                                bgcolor: (prop.projectionEdge || 0) > 0.05 ? '#059669' : 
                                        (prop.projectionEdge || 0) > 0.03 ? '#10b981' : '#3b82f6',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.6rem'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {prop.game || 'Unknown Game'}
                      </Typography>
                      
                      {/* Stat Type and Line */}
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip 
                          label={formatPropType(prop.stat_type)}
                          size="small"
                          sx={{ 
                            bgcolor: `${getSportColor(prop.sport)}20`,
                            color: getSportColor(prop.sport),
                            fontWeight: 'bold'
                          }}
                        />
                        <Typography variant="h6" sx={{ color: getSportColor(prop.sport), fontWeight: 'bold' }}>
                          Line: {prop.line || 0}
                        </Typography>
                      </Box>
                      
                      {/* ===== ENHANCED: Projection Display with Edge and Confidence ===== */}
                      {prop.projection !== undefined && prop.projection !== null && (
                        <Box sx={{ 
                          mb: 2, 
                          p: 1, 
                          bgcolor: '#f8fafc', 
                          borderRadius: 1,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                Projection: {prop.projection.toFixed(1)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Diff: {prop.projection_diff ? (prop.projection_diff > 0 ? '+' : '') + prop.projection_diff.toFixed(1) : 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip 
                                label={`${prop.projection > prop.line ? 'Over' : 'Under'} by ${Math.abs(prop.projection - prop.line).toFixed(1)}`}
                                size="small"
                                sx={{ 
                                  bgcolor: prop.projection > prop.line ? '#10b981' : '#ef4444',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  mb: 0.5
                                }}
                              />
                              <Typography variant="caption" fontWeight="bold" color={(prop.projectionEdge || 0) > 0 ? '#059669' : '#ef4444'}>
                                Edge: {getEdgeSign(prop.projectionEdge)}{((prop.projectionEdge || 0) * 100).toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Projection Confidence */}
                          {prop.projection_confidence && (
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                Confidence:
                              </Typography>
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
                            </Box>
                          )}
                          
                          {/* Kelly Bet Sizing */}
                          {showKellySizing && prop.kellyBetSize && prop.kellyBetSize > 0 && (
                            <Box sx={{ mt: 1, p: 0.5, bgcolor: '#ecfdf5', borderRadius: 0.5 }}>
                              <Typography variant="caption" fontWeight="bold" color="#059669">
                                💰 Kelly Bet: {formatKellyBetSize(prop.kellyBetSize)}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                      
                      {/* Updated Odds Display */}
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
                          bgcolor: prop.over_price !== null ? '#10b981' : '#64748b',
                          color: 'white',
                          opacity: prop.over_price !== null ? 1 : 0.7
                        }}>
                          <Typography variant="caption" display="block">
                            Over
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatPrice(prop.over_price)}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          flex: 1, 
                          textAlign: 'center', 
                          p: 1,
                          bgcolor: prop.under_price !== null ? '#ef4444' : '#64748b',
                          color: 'white',
                          opacity: prop.under_price !== null ? 1 : 0.7
                        }}>
                          <Typography variant="caption" display="block">
                            Under
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {formatPrice(prop.under_price)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Updated Confidence Display with new confidence levels */}
                      {(prop.calculated_confidence) && (
                        <Box sx={{ mt: 1, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Market Analysis: 
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip 
                              label={`${formatConfidence(prop.calculated_confidence)} (${getEdgeSign(prop.calculated_edge)}${((prop.calculated_edge || 0) * 100).toFixed(1)}%)`}
                              size="small"
                              sx={{ 
                                bgcolor: getConfidenceColor(prop.calculated_confidence),
                                color: 'white',
                                fontSize: '0.7rem',
                                height: '20px',
                                fontWeight: 'bold'
                              }}
                            />
                            
                            {prop.recommendedSide && prop.recommendedSide !== 'none' && (
                              <Chip 
                                label={`${prop.recommendedSide.toUpperCase()} (${getEdgeSign(prop.projectionEdge)}${((prop.projectionEdge || 0) * 100).toFixed(1)}%)`}
                                size="small"
                                sx={{ 
                                  bgcolor: prop.recommendedSide === 'over' ? '#10b981' : '#ef4444',
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  height: '18px'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}

                      {/* ENHANCED VALUE BET SECTION with projection confidence */}
                      {((prop.calculated_edge !== undefined && prop.calculated_edge > 0) || (prop.projectionEdge !== undefined && prop.projectionEdge > 0)) && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1, 
                          bgcolor: prop.projection_confidence === 'very-high' ? '#f0fdf4' : 
                                  prop.projection_confidence === 'high' ? '#f0f9ff' : 
                                  prop.calculated_confidence === 'arbitrage' ? '#faf5ff' : '#fefce8', 
                          borderRadius: 1,
                          border: `1px solid ${
                            prop.projection_confidence === 'very-high' ? '#bbf7d0' : 
                            prop.projection_confidence === 'high' ? '#bae6fd' : 
                            prop.calculated_confidence === 'arbitrage' ? '#ddd6fe' : '#fef08a'
                          }`
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" fontWeight="bold" color={
                              prop.projection_confidence === 'very-high' ? '#059669' :
                              prop.projection_confidence === 'high' ? '#0369a1' :
                              prop.calculated_confidence === 'arbitrage' ? '#7c3aed' : '#92400e'
                            }>
                              {prop.projection_confidence === 'very-high' ? '🎯 VERY HIGH VALUE' :
                               prop.projection_confidence === 'high' ? '✅ HIGH VALUE' :
                               prop.calculated_confidence === 'arbitrage' ? '💰 ARBITRAGE OPPORTUNITY' : '🔥 VALUE BET'}
                            </Typography>
                            <Typography variant="caption" fontWeight="bold" color="#059669">
                              Edge: {getEdgeSign(prop.projectionEdge)}{(((prop.projectionEdge || prop.calculated_edge || 0)) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          
                          {prop.recommendedSide && prop.recommendedSide !== 'none' && (
                            <Typography variant="body2" sx={{ mt: 0.5, color: '#0c4a6e' }}>
                              <strong>Bet:</strong> {prop.recommendedSide.toUpperCase()} {prop.stat_type} {prop.line}
                            </Typography>
                          )}
                          
                          {prop.projection && (
                            <Typography variant="body2" sx={{ color: '#0c4a6e' }}>
                              <strong>Projection:</strong> {prop.projection.toFixed(1)} ({prop.projection > prop.line ? 'Over' : 'Under'} by {Math.abs(prop.projection - prop.line).toFixed(1)})
                            </Typography>
                          )}
                          
                          {prop.estimated_true_prob !== undefined && prop.market_implied !== undefined && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#0c4a6e' }}>
                              True Prob: {(prop.estimated_true_prob * 100).toFixed(1)}% vs Market: {(prop.market_implied * 100).toFixed(1)}%
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* Footer */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        {prop.sport && (
                          <Chip 
                            label={(prop.sport || '').toUpperCase()}
                            size="small"
                            sx={{ 
                              bgcolor: `${getSportColor(prop.sport)}20`,
                              color: getSportColor(prop.sport),
                            }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Updated: {prop.last_update ? new Date(prop.last_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Analytics Section - SAFELY mapped */}
      {analytics.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#3a0ca3', mb: 3 }}>
            📊 Analytics ({analytics.length} items)
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            {/* SAFE MAPPING: We know analytics is always an array now */}
            {(Array.isArray(analytics) ? analytics : []).slice(0, 6).map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {item.sport || item.player || item.type || 'Analytics Item'}
                    </Typography>
                    
                    {item.winRate && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Win Rate
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={parseFloat(item.winRate) || 0} 
                            sx={{ flex: 1, mr: 1, height: 6 }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {item.winRate}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {item.accuracy && (
                      <Typography variant="body2" color="text.secondary">
                        Accuracy: <strong>{(item.accuracy * 100).toFixed(1)}%</strong>
                      </Typography>
                    )}
                    
                    {item.picks && (
                      <Typography variant="body2" color="text.secondary">
                        Total Picks: <strong>{item.picks}</strong>
                      </Typography>
                    )}
                    
                    {item.roi && (
                      <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                        ROI: <strong>{item.roi}</strong>
                      </Typography>
                    )}
                    
                    {item.category && (
                      <Chip 
                        label={item.category}
                        size="small"
                        sx={{ mt: 2 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Enhanced Stats Footer with Value Analysis */}
      {sortedProps.length > 0 && (
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
                  {selectedSport === 'nba' ? '🏀' : selectedSport === 'nfl' ? '🏈' : '⚾'}
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
                {calculateValueStats(sortedProps).withPositiveEdge}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {calculateValueStats(sortedProps).positiveEdgePercentage}% +EV Rate
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Strong Value
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="#10b981">
                {calculateValueStats(sortedProps).withStrongEdge}
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
          
          {/* ===== ADDED: Enhanced Projection Filtering Summary ===== */}
          {enableProjectionFiltering && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" color="#0369a1">
                🔍 Projection Value Analysis Active
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Showing props {projectionDifferenceThreshold}+ points from line
                {minEdgeThreshold > 0 && ` with at least ${(minEdgeThreshold * 100).toFixed(1)}% edge`}
                {onlyShowProjectionEdges && ' where projection agrees with edge'}
                {sortByProjectionValue ? ', sorted by projection value' : ', sorted by market edge'}
              </Typography>
            </Box>
          )}
          
          {showKellySizing && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#ecfdf5', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" color="#059669">
                💰 Kelly Bet Sizing Active
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Using ${bankrollAmount.toFixed(2)} bankroll with {kellyFraction * 100}% Kelly fraction
              </Typography>
            </Box>
          )}
          
          {/* Value Analysis Summary */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" color="#3b82f6">
              📈 Value Analysis Summary
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {sortedProps.filter(p => (p.projectionEdge || 0) > 0.05).length} very strong bets ({'>'}5% edge) | 
              {sortedProps.filter(p => (p.projectionEdge || 0) > 0.03 && (p.projectionEdge || 0) <= 0.05).length} strong bets (3-5% edge) | 
              {sortedProps.filter(p => (p.projectionEdge || 0) > 0 && (p.projectionEdge || 0) <= 0.03).length} fair bets (0-3% edge)
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {activeEndpoint 
                ? `Data loaded from ${activeEndpoint}. Auto-refreshes every 2 minutes.`
                : 'Loading data from API...'}
            </Typography>
          </Box>
        </Paper>
      )}

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
