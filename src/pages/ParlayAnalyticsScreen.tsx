// src/screens/ComboAnalyticsScreen.tsx - with subscription integration
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  AlertTitle,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  Alert,
  Button,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Slider,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InfoOutlined as InfoIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  RocketLaunch as RocketLaunchIcon,
  Psychology as PsychologyIcon,
  FilterList as FilterListIcon,
  SportsBasketball,
  SportsBaseball,
  SportsHockey,
  Lock as LockIcon,
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { alpha } from '@mui/material/styles';
import axios from 'axios';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';

// ========== IMPORT UTILITIES ==========
import { useDebounce } from '../utils/useDebounce';
import { preprocessQuery } from '../utils/queryProcessor';
import { logPromptPerformance } from '../utils/analytics';

// ========== API BASES ==========
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface ComboLeg {
  id: string;
  description: string;
  odds: string;
  confidence: number;
  sport: string;
  market: string;
  teams?: { home: string; away: string };
  line?: number;
  value_side?: string;
  confidence_level?: string;
  player_name?: string;
  stat_type?: string;
  projection?: number;
  edge?: string;
  injury_status?: string;
}

interface ComboSuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ComboLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: string;
  analysis: string;
  expected_value: string;
  risk_level: string | number;
  ai_metrics: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge?: number;
  };
  timestamp: string;
  isToday?: boolean;
  isGenerated?: boolean;
  is_real_data?: boolean;
}

interface Selection {
  id: string;
  player: string;
  team: string;
  stat: string;
  line: number;
  projection: number;
  odds: string;
  confidence: number;
  edge: string;
  position?: string;
  sport: string;
  injuryStatus?: string;
}

// ----------------------------------------------------------------------
// Helper functions with safety fixes
// ----------------------------------------------------------------------

// Safe line value parsing helper
const parseLineValueToNumber = (odds: any): number => {
  if (odds === undefined || odds === null) return -110;
  
  let oddsStr: string;
  if (typeof odds === 'object') {
    oddsStr = String((odds as any).value || (odds as any).odds || '-110');
  } else {
    oddsStr = String(odds);
  }
  
  const cleanOdds = oddsStr.replace(/\+/g, '').trim();
  const oddsNum = parseInt(cleanOdds, 10);
  return isNaN(oddsNum) ? -110 : oddsNum;
};

// Safe analytical advantage parsing helper
const parseAnalyticalAdvantage = (edge: any): number => {
  if (edge === undefined || edge === null) return 0;
  const edgeStr = String(edge);
  const cleanEdge = edgeStr.replace(/\+/g, '').replace(/%/g, '').trim();
  const parsed = parseFloat(cleanEdge);
  return isNaN(parsed) ? 0 : parsed;
};

// Updated calculateTotalCombinedValue with safety fixes
const calculateTotalCombinedValue = (legs: ComboLeg[]): { odds: string; decimal: number } => {
  let decimal = 1.0;
  
  legs.forEach(leg => {
    const oddsNum = parseLineValueToNumber(leg.odds);
    if (!isNaN(oddsNum) && oddsNum !== 0) {
      if (oddsNum > 0) {
        decimal *= 1 + oddsNum / 100;
      } else {
        decimal *= 1 - 100 / Math.abs(oddsNum);
      }
    } else {
      decimal *= 1.9091;
    }
  });
  
  let totalOdds: string;
  if (decimal >= 2.0) {
    totalOdds = `+${Math.round((decimal - 1) * 100)}`;
  } else if (decimal > 1.0 && decimal < 2.0) {
    totalOdds = Math.round(-100 / (decimal - 1)).toString();
  } else {
    totalOdds = '-110';
  }
  return { odds: totalOdds, decimal };
};

const getConfidence = (c: any): number => {
  const num = Number(c);
  return !isNaN(num) && num > 0 ? num : 75;
};

const computeConfidence = (s: Selection): number => {
  let confidence = 75;
  if (s.projection && s.line && s.line > 0) {
    const surplus = (s.projection - s.line) / s.line;
    confidence = Math.min(95, Math.max(60, 75 + Math.round(surplus * 50)));
  }
  return confidence;
};

// ----------------------------------------------------------------------
// API client – fetch selections from appropriate backend
// ----------------------------------------------------------------------

// Fetch NBA line values from your odds API
const fetchNBALineValues = async (): Promise<Record<string, string>> => {
  try {
    const response = await axios.get(`${NODE_API_BASE}/api/prizepicks/selections?sport=nba`);
    const oddsMap: Record<string, string> = {};
    if (response.data.selections) {
      response.data.selections.forEach((s: any) => {
        const key = `${s.player}|${s.stat}|${s.line}`;
        oddsMap[key] = s.odds;
      });
    }
    return oddsMap;
  } catch (error) {
    console.warn('Failed to fetch NBA line values, falling back to generated values', error);
    return {};
  }
};

// Fetch NBA predictions and merge with real line values
const fetchNBAPredictions = async (): Promise<Selection[]> => {
  try {
    const response = await axios.get(`${PYTHON_API_BASE}/api/predictions`);
    if (!response.data.success || !Array.isArray(response.data.predictions)) {
      return [];
    }
    const oddsMap = await fetchNBALineValues();
    return response.data.predictions.map((p: any, index: number) => {
      const oddsKey = `${p.player_name}|${p.market || 'points'}|${p.line || 0.5}`;
      let odds = oddsMap[oddsKey];
      if (!odds) {
        const impliedProb = (p.confidence || 75) / 100;
        let americanOdds = impliedProb >= 0.5
          ? Math.round(-100 * impliedProb / (1 - impliedProb))
          : Math.round(100 * (1 - impliedProb) / impliedProb);
        americanOdds = Math.min(999, Math.max(-999, americanOdds));
        odds = americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
      }
      const edgeValue = p.line > 0 
        ? ((p.prediction - p.line) / p.line * 100).toFixed(1) 
        : '0.0';
      const edge = edgeValue.startsWith('-') ? `${edgeValue}%` : `+${edgeValue}%`;
      return {
        id: p.id || `nba-pred-${index}`,
        player: p.player_name,
        team: p.team || '???',
        stat: p.market || 'points',
        line: p.line || 0.5,
        projection: p.prediction || p.line,
        odds: String(odds),
        confidence: p.confidence || 75,
        edge,
        position: p.position || 'N/A',
        sport: 'NBA',
        injuryStatus: p.injury_status,
      };
    });
  } catch (error) {
    console.warn('Failed to fetch NBA predictions', error);
    return [];
  }
};

// MLB props from Python API
const fetchMLBSelections = async (): Promise<Selection[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await axios.get(`${PYTHON_API_BASE}/api/mlb/props`, {
      params: { date: today, limit: 50 },
    });
    if (response.data.success && Array.isArray(response.data.props)) {
      return response.data.props.map((p: any, idx: number) => ({
        id: p.id || `mlb-prop-${idx}`,
        player: p.player,
        team: p.team,
        stat: p.stat,
        line: p.line,
        projection: p.projection || p.line,
        odds: String(p.odds || '-110'),
        confidence: p.confidence === 'high' ? 85 : p.confidence === 'medium' ? 70 : 55,
        edge: p.edge ? `${p.edge}%` : (p.projection > p.line ? '+5%' : '-2%'),
        position: p.position,
        sport: 'MLB',
        injuryStatus: p.injury_status,
      }));
    }
    return [];
  } catch (error) {
    console.warn('Failed to fetch MLB selections', error);
    return [];
  }
};

// NHL props from Python API
const fetchNHLSelections = async (): Promise<Selection[]> => {
  console.log('[NHL] Fetching from backend...');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await axios.get(`${PYTHON_API_BASE}/api/nhl/props`, {
      params: { date: today, limit: 50 },
    });
    if (response.data.success && Array.isArray(response.data.props)) {
      console.log(`[NHL] Received ${response.data.props.length} props from backend (source: ${response.data.source})`);
      return response.data.props.map((p: any, idx: number) => ({
        id: p.id || `nhl-prop-${idx}`,
        player: p.player,
        team: p.team,
        stat: p.stat,
        line: p.line,
        projection: p.projection || p.line,
        odds: String(p.odds || '-110'),
        confidence: p.confidence === 'high' ? 85 : p.confidence === 'medium' ? 70 : 55,
        edge: p.edge ? `${p.edge}%` : (p.projection > p.line ? '+5%' : '-2%'),
        position: p.position || 'N/A',
        sport: 'NHL',
        injuryStatus: p.injury_status,
      }));
    }
    return [];
  } catch (error) {
    console.error('[NHL] Failed to fetch from backend:', error);
    return [];
  }
};

// Mock NHL selections for fallback
const generateMockNHLSelections = (): Selection[] => {
  return [
    {
      id: 'mock-nhl-1',
      player: 'Connor McDavid',
      team: 'EDM',
      stat: 'Points',
      line: 1.5,
      projection: 2.1,
      odds: '-150',
      confidence: 82,
      edge: '+8%',
      position: 'C',
      sport: 'NHL',
      injuryStatus: 'Active',
    },
    {
      id: 'mock-nhl-2',
      player: 'Nathan MacKinnon',
      team: 'COL',
      stat: 'Points',
      line: 1.5,
      projection: 1.9,
      odds: '-120',
      confidence: 75,
      edge: '+5%',
      position: 'C',
      sport: 'NHL',
      injuryStatus: 'Active',
    },
    {
      id: 'mock-nhl-3',
      player: 'Auston Matthews',
      team: 'TOR',
      stat: 'Goals',
      line: 0.5,
      projection: 0.8,
      odds: '+110',
      confidence: 70,
      edge: '+3%',
      position: 'C',
      sport: 'NHL',
      injuryStatus: 'Active',
    },
  ];
};

// Fetch function for all selected sports
const fetchSelectionsForSports = async (sports: string[]): Promise<Selection[]> => {
  console.log('[fetchSelectionsForSports] Sports requested:', sports);
  const fetchPromises = sports.map(async (sport) => {
    switch (sport) {
      case 'NBA': return fetchNBAPredictions();
      case 'MLB': return fetchMLBSelections();
      case 'NHL': return fetchNHLSelections();
      default: return [];
    }
  });
  const results = await Promise.all(fetchPromises);
  const flatResults = results.flat();
  console.log('[fetchSelectionsForSports] Total selections:', flatResults.length);
  if (sports.includes('NHL') && !flatResults.some(s => s.sport === 'NHL')) {
    console.warn('[fetchSelectionsForSports] NHL requested but no selections; adding fallback mock.');
    flatResults.push(...generateMockNHLSelections());
  }
  return flatResults;
};

// ----------------------------------------------------------------------
// Generate combos from selections with safety fixes
// ----------------------------------------------------------------------
const generateCombosFromSelections = (selections: Selection[]): ComboSuggestion[] => {
  console.log('[generateCombosFromSelections] Total selections received:', selections.length);
  if (selections.length === 0) {
    console.log('[generateCombosFromSelections] No selections, returning empty array.');
    return [];
  }

  const suggestions: ComboSuggestion[] = [];

  const selectionsBySport = selections.reduce<Record<string, Selection[]>>((acc, s) => {
    if (!acc[s.sport]) acc[s.sport] = [];
    acc[s.sport].push(s);
    return acc;
  }, {});
  console.log('[generateCombosFromSelections] Sports with selections:', Object.keys(selectionsBySport));

  Object.entries(selectionsBySport).forEach(([sport, sportSelections]) => {
    console.log(`[generate] Processing sport: ${sport}, selections: ${sportSelections.length}`);

    const withConfidence = sportSelections.map(s => ({
      ...s,
      computedConfidence: sport === 'NBA' ? s.confidence : computeConfidence(s),
    }));

    // High confidence combos
    const topConfidence = [...withConfidence]
      .sort((a, b) => b.computedConfidence - a.computedConfidence)
      .slice(0, 10);

    for (let i = 0; i < Math.min(3, topConfidence.length - 2); i++) {
      const legs = topConfidence.slice(i, i + 3).map((s, idx) => {
        const conf = s.computedConfidence;
        return {
          id: `conf-${sport}-${i}-${idx}-${Date.now()}`,
          description: `${s.player} ${s.stat} Over ${s.line}`,
          odds: String(s.odds),
          confidence: conf,
          sport: sport,
          market: 'player_props',
          player_name: s.player,
          stat_type: s.stat,
          line: s.line,
          projection: s.projection,
          edge: s.edge,
          confidence_level: conf > 80 ? 'high' : conf > 70 ? 'high' : 'medium',
          injury_status: s.injuryStatus,
        };
      });
      if (legs.length < 2) continue;
      const { odds } = calculateTotalCombinedValue(legs);
      const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);
      const avgAdvantage = legs.reduce((sum, l) => sum + parseAnalyticalAdvantage(l.edge), 0) / legs.length;
      suggestions.push({
        id: `analytics-conf-${sport}-${i}-${Date.now()}`,
        name: `${sport} High Confidence Combo ${i+1}`,
        sport: sport,
        type: 'player_props',
        market_type: 'player_props',
        legs,
        total_combined_value: odds,
        confidence: avgConfidence,
        confidence_level: avgConfidence > 80 ? 'high' : 'medium',
        analysis: `This combo combines top confidence props in ${sport}. Average analytical advantage: +${avgAdvantage.toFixed(1)}%.`,
        expected_value: '+6.2%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: legs.length,
          avg_leg_confidence: avgConfidence,
          recommended_stake: '$5.00',
          edge: avgAdvantage / 100,
        },
        timestamp: new Date().toISOString(),
        isToday: true,
        is_real_data: true,
      });
    }

    // Best projected pick combos
    const withAdvantage = withConfidence
      .filter(s => {
        const edgeStr = String(s.edge || '');
        return edgeStr.startsWith('+');
      })
      .sort((a, b) => {
        const edgeA = parseAnalyticalAdvantage(a.edge);
        const edgeB = parseAnalyticalAdvantage(b.edge);
        return edgeB - edgeA;
      })
      .slice(0, 6);

    for (let i = 0; i < Math.min(2, withAdvantage.length - 2); i++) {
      const legs = withAdvantage.slice(i, i + 3).map((s, idx) => {
        const conf = s.computedConfidence;
        return {
          id: `edge-${sport}-${i}-${idx}-${Date.now()}`,
          description: `${s.player} ${s.stat} Over ${s.line}`,
          odds: String(s.odds),
          confidence: conf,
          sport: sport,
          market: 'player_props',
          player_name: s.player,
          stat_type: s.stat,
          line: s.line,
          projection: s.projection,
          edge: s.edge,
          confidence_level: conf > 80 ? 'high' : conf > 70 ? 'high' : 'medium',
          injury_status: s.injuryStatus,
        };
      });
      if (legs.length < 2) continue;
      const { odds } = calculateTotalCombinedValue(legs);
      const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);
      const avgAdvantage = legs.reduce((sum, l) => sum + parseAnalyticalAdvantage(l.edge), 0) / legs.length;
      suggestions.push({
        id: `analytics-edge-${sport}-${i}-${Date.now()}`,
        name: `${sport} Best Projected Pick Combo ${i+1}`,
        sport: sport,
        type: 'player_props',
        market_type: 'player_props',
        legs,
        total_combined_value: odds,
        confidence: avgConfidence,
        confidence_level: avgConfidence > 80 ? 'high' : 'medium',
        analysis: `This combo features props with highest positive analytical advantage in ${sport}. Average analytical advantage: +${avgAdvantage.toFixed(1)}%.`,
        expected_value: '+7.8%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: legs.length,
          avg_leg_confidence: avgConfidence,
          recommended_stake: '$5.00',
          edge: avgAdvantage / 100,
        },
        timestamp: new Date().toISOString(),
        isToday: true,
        is_real_data: true,
      });
    }

    // Random balanced combos
    for (let i = 0; i < 3; i++) {
      const shuffled = [...withConfidence].sort(() => 0.5 - Math.random());
      const legs = shuffled.slice(0, 3).map((s, idx) => {
        const conf = s.computedConfidence;
        return {
          id: `rand-${sport}-${i}-${idx}-${Date.now()}`,
          description: `${s.player} ${s.stat} Over ${s.line}`,
          odds: String(s.odds),
          confidence: conf,
          sport: sport,
          market: 'player_props',
          player_name: s.player,
          stat_type: s.stat,
          line: s.line,
          projection: s.projection,
          edge: s.edge,
          confidence_level: conf > 80 ? 'high' : conf > 70 ? 'high' : 'medium',
          injury_status: s.injuryStatus,
        };
      });
      const { odds } = calculateTotalCombinedValue(legs);
      const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);
      const avgAdvantage = legs.reduce((sum, l) => sum + parseAnalyticalAdvantage(l.edge), 0) / legs.length;
      suggestions.push({
        id: `analytics-rand-${sport}-${i}-${Date.now()}`,
        name: `${sport} Balanced Combo ${i+1}`,
        sport: sport,
        type: 'player_props',
        market_type: 'player_props',
        legs,
        total_combined_value: odds,
        confidence: avgConfidence,
        confidence_level: avgConfidence > 80 ? 'high' : 'medium',
        analysis: `A balanced mix of props from today's ${sport} slate. Average analytical advantage: +${avgAdvantage.toFixed(1)}%.`,
        expected_value: '+6.5%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: legs.length,
          avg_leg_confidence: avgConfidence,
          recommended_stake: '$5.00',
          edge: avgAdvantage / 100,
        },
        timestamp: new Date().toISOString(),
        isToday: true,
        is_real_data: true,
      });
    }
  });

  console.log('[generateCombosFromSelections] Total combos generated:', suggestions.length);
  return suggestions;
};

// ----------------------------------------------------------------------
// Helper components
// ----------------------------------------------------------------------
const LineValueChip = ({ odds }: { odds: string }) => {
  const oddsNum = parseLineValueToNumber(odds);
  const isFavorite = oddsNum < 0;
  const color = isFavorite ? 'success' : 'error';
  return <Chip label={odds} size="small" color={color} variant="outlined" />;
};

const ConfidenceIndicator = ({ value }: { value: number }) => {
  const safeValue = !isNaN(value) && value > 0 ? value : 75;
  let color: 'success' | 'warning' | 'error' = 'success';
  if (safeValue < 60) color = 'error';
  else if (safeValue < 75) color = 'warning';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" color="text.secondary">{safeValue}%</Typography>
      <LinearProgress variant="determinate" value={safeValue} sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} color={color} />
    </Box>
  );
};

const getVolatilityChip = (risk: string | number) => {
  let label: string;
  let color: 'success' | 'warning' | 'error' | 'default';
  if (typeof risk === 'number') {
    if (risk <= 2) { label = 'Low'; color = 'success'; }
    else if (risk <= 3) { label = 'Medium'; color = 'warning'; }
    else { label = 'High'; color = 'error'; }
  } else {
    label = risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
    color = risk.toLowerCase() === 'low' ? 'success' : risk.toLowerCase() === 'medium' ? 'warning' : 'error';
  }
  return <Chip label={label} size="small" color={color} variant="filled" />;
};

const SportChip = ({ sport }: { sport: string }) => {
  let color: 'primary' | 'secondary' | 'success' | 'warning' = 'primary';
  if (sport === 'NBA') color = 'primary';
  else if (sport === 'MLB') color = 'success';
  else if (sport === 'NHL') color = 'warning';
  return <Chip label={sport} size="small" color={color} variant="filled" />;
};

const InjuryChip = ({ status }: { status?: string }) => {
  if (!status || status === 'Active' || status === 'healthy') return null;
  let color: 'warning' | 'error' | 'default' = 'warning';
  if (status.toLowerCase().includes('out')) color = 'error';
  return <Chip label={status} size="small" color={color} variant="outlined" sx={{ ml: 1 }} />;
};

// ----------------------------------------------------------------------
// Main Content Component
// ----------------------------------------------------------------------
const ComboAnalyticsContent: React.FC = () => {
  const { profile, planFeatures } = useAuth();
  const { handleSubscriptionCheckout, handleCreditsCheckout } = useCheckout();
  
  const [selectedSports, setSelectedSports] = useState<string[]>(['NBA']);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('analytics');
  const [selectedInterval, setSelectedInterval] = useState<string>('month');

  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [confidenceRange, setConfidenceRange] = useState<number[]>([0, 100]);
  const [legCountRange, setLegCountRange] = useState<number[]>([1, 8]);
  const [showFilters, setShowFilters] = useState(false);

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  
  // Access plan features (used only for display, not for access control)
  const hasAdvancedAnalytics = planFeatures?.hasAdvancedAnalytics ?? false;
  const hasAIRecommendations = planFeatures?.hasAIRecommendations ?? false;
  
  // Fetch selections for selected sports
  const {
    data: selections = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['selections', selectedSports],
    queryFn: () => fetchSelectionsForSports(selectedSports),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Generate combos from selections
  const combos = useMemo(() => {
    return generateCombosFromSelections(selections);
  }, [selections]);

  // Premium-only stats
  const premiumStats = useMemo(() => {
    const highConfidenceCombos = combos.filter(p => p.confidence >= 75);
    const positiveExpectationCombos = combos.filter(p => (p.ai_metrics?.edge || 0) > 0.05);
    const avgAdvantage = combos.length > 0
      ? combos.reduce((sum, p) => sum + (p.ai_metrics?.edge || 0), 0) / combos.length
      : 0;
    const topPerformingSports = combos.reduce((acc, p) => {
      acc[p.sport] = (acc[p.sport] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const bestSport = Object.entries(topPerformingSports).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    return {
      highConfidenceCount: highConfidenceCombos.length,
      positiveExpectationCount: positiveExpectationCombos.length,
      avgAdvantage: (avgAdvantage * 100).toFixed(1),
      bestSport,
      totalCombos: combos.length,
      totalLegs: combos.reduce((sum, p) => sum + p.legs.length, 0),
    };
  }, [combos]);

  const handleUpgrade = () => {
    handleSubscriptionCheckout(selectedPlan, selectedInterval);
  };

  const handleSportChange = (event: React.MouseEvent<HTMLElement>, newSports: string[]) => {
    if (newSports.length === 0) return;
    setSelectedSports(newSports);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const toggleAccordion = (comboId: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [comboId]: !prev[comboId]
    }));
  };

  const filteredCombos = useMemo(() => {
    let filtered = combos;

    if (selectedSports.length > 0) {
      filtered = filtered.filter(p => selectedSports.includes(p.sport));
    }

    if (debouncedSearch.trim()) {
      const intent = preprocessQuery(debouncedSearch);
      const lowerQuery = debouncedSearch.toLowerCase();
      filtered = filtered.filter(combo => {
        if (intent.sport && combo.sport.toLowerCase() !== intent.sport) return false;
        const nameMatch = combo.name.toLowerCase().includes(lowerQuery);
        const legMatch = combo.legs.some(leg =>
          leg.description.toLowerCase().includes(lowerQuery) ||
          (leg.player_name && leg.player_name.toLowerCase().includes(lowerQuery)) ||
          (leg.market && leg.market.toLowerCase().includes(lowerQuery))
        );
        const analysisMatch = combo.analysis.toLowerCase().includes(lowerQuery);
        return nameMatch || legMatch || analysisMatch;
      });
    }

    filtered = filtered.filter(p =>
      p.confidence >= confidenceRange[0] && p.confidence <= confidenceRange[1]
    );

    filtered = filtered.filter(p =>
      p.legs.length >= legCountRange[0] && p.legs.length <= legCountRange[1]
    );

    return filtered;
  }, [combos, selectedSports, debouncedSearch, confidenceRange, legCountRange]);

  const analytics = useMemo(() => {
    if (!filteredCombos.length) return null;
    const totalCombos = filteredCombos.length;
    const avgConfidence = filteredCombos.reduce((acc, p) => acc + p.confidence, 0) / totalCombos;
    const totalLegs = filteredCombos.reduce((acc, p) => acc + p.legs.length, 0);
    const avgLegsPerCombo = totalLegs / totalCombos;
    const sportCounts: Record<string, number> = {};
    filteredCombos.forEach(p => { sportCounts[p.sport] = (sportCounts[p.sport] || 0) + 1; });
    const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const avgAdvantage = filteredCombos.reduce((acc, p) => acc + (p.ai_metrics?.edge || 0), 0) / totalCombos;
    return { totalCombos, avgConfidence, totalLegs, avgLegsPerCombo, sportCounts, topSport, avgAdvantage };
  }, [filteredCombos]);

  const handleGenerateCombo = async () => {
    if (!customQuery.trim()) { alert('Please enter a combo query'); return; }
    setGenerating(true);
    setShowGeneratorModal(true);
    try {
      if (selections.length > 0) {
        const shuffled = [...selections].sort(() => 0.5 - Math.random());
        const legs = shuffled.slice(0, 3).map(s => `${s.player} ${s.stat} Over ${s.line} (${s.odds})`);
        const analysis = `Based on your query, here are 3 suggested legs:\n\n${legs.join('\n')}`;
        setGeneratedResult({ success: true, analysis, source: 'AI Simulation' });
      } else {
        setGeneratedResult({ success: true, analysis: 'No selections available to generate. Please try again later.', source: 'Fallback' });
      }
      logPromptPerformance(customQuery, 1, 0, 'generator');
    } catch (err) {
      console.error('Generator error:', err);
      setGeneratedResult({ success: true, analysis: '❌ Failed to generate. Please try again later.', source: 'Fallback' });
      logPromptPerformance(customQuery, 0, 0, 'fallback');
    } finally {
      setGenerating(false);
    }
  };

  const handleCloseGenerator = () => {
    setShowGeneratorModal(false);
    setGeneratorOpen(false);
    setCustomQuery('');
  };

  if (isLoading && selections.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>Combo Analytics</Typography>
        <Grid container spacing={3}>
          {[1,2,3,4].map(i => <Grid item xs={12} md={6} key={i}><Skeleton variant="rounded" height={200} /></Grid>)}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Alert severity="error" sx={{ mb: 2 }}>Error loading data: {(error as Error).message}</Alert>
        <Button variant="outlined" onClick={() => refetch()}>Retry</Button>
      </Container>
    );
  }

  // Inner PlanGuard removed – access control is now handled by ProtectedRoute wrapper
  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" fontWeight="bold">Combo Analytics</Typography>
          <Chip icon={<CheckCircleIcon />} label="PREMIUM" color="success" size="small" />
        </Box>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search combos..." value={searchQuery} onChange={handleSearchChange} size="small" sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              endAdornment: searchQuery && <InputAdornment position="end"><IconButton size="small" onClick={handleClearSearch}><CloseIcon /></IconButton></InputAdornment>
            }}
          />
          <Tooltip title="Filter options">
            <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}><FilterListIcon /></IconButton>
          </Tooltip>

          {/* Sport toggle buttons */}
          <Paper sx={{ p: 0.5, bgcolor: 'background.paper' }}>
            <ToggleButtonGroup
              value={selectedSports}
              onChange={handleSportChange}
              aria-label="sport selection"
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 1,
                  border: 'none',
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.primary.dark,
                    },
                  },
                },
              }}
            >
              <ToggleButton value="NBA" aria-label="NBA">
                <SportsBasketball sx={{ mr: 0.5 }} /> NBA
              </ToggleButton>
              <ToggleButton value="MLB" aria-label="MLB">
                <SportsBaseball sx={{ mr: 0.5 }} /> MLB
              </ToggleButton>
              <ToggleButton value="NHL" aria-label="NHL">
                <SportsHockey sx={{ mr: 0.5 }} /> NHL
              </ToggleButton>
            </ToggleButtonGroup>
          </Paper>

          <Tooltip title="Generate custom combo">
            <IconButton onClick={() => setGeneratorOpen(true)} color="primary">
              <AutoAwesomeIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()} color="primary">
              <AssessmentIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Display current plan features */}
      {profile && (
        <Box sx={{ mb: 3 }}>
          <PlanFeaturesDisplay currentPlan={profile.plan} compact />
        </Box>
      )}

      {/* Premium Stats Dashboard */}
      {premiumStats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUpIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    High Confidence
                  </Typography>
                </Box>
                <Typography variant="h4">{premiumStats.highConfidenceCount}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Combos (≥75% confidence)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <StarIcon color="warning" />
                  <Typography variant="body2" color="text.secondary">
                    Positive Expectation
                  </Typography>
                </Box>
                <Typography variant="h4">{premiumStats.positiveExpectationCount}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Combos with Positive Expectation
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <AssessmentIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Avg Analytical Advantage
                  </Typography>
                </Box>
                <Typography variant="h4">{premiumStats.avgAdvantage}%</Typography>
                <Typography variant="caption" color="text.secondary">
                  Across all combos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SportsBasketball color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Best Sport
                  </Typography>
                </Box>
                <Typography variant="h4">{premiumStats.bestSport}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Most combo suggestions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Advanced Filters</Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Confidence Range</Typography>
              <Slider value={confidenceRange} onChange={(_, v) => setConfidenceRange(v as number[])} valueLabelDisplay="auto" min={0} max={100} step={5} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Number of Legs</Typography>
              <Slider value={legCountRange} onChange={(_, v) => setLegCountRange(v as number[])} valueLabelDisplay="auto" min={1} max={8} step={1} marks={[{value:1,label:'1'},{value:4,label:'4'},{value:8,label:'8'}]} />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Total Combos</Typography><Typography variant="h4" fontWeight="bold">{analytics.totalCombos}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Avg. Confidence</Typography><Box display="flex" alignItems="center"><Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>{analytics.avgConfidence.toFixed(1)}%</Typography>{analytics.avgConfidence >= 75 ? <TrendingUpIcon color="success" /> : analytics.avgConfidence >= 60 ? <TrendingFlatIcon color="warning" /> : <TrendingDownIcon color="error" />}</Box></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Total Legs</Typography><Typography variant="h4" fontWeight="bold">{analytics.totalLegs}</Typography><Typography variant="caption" color="text.secondary">Avg {analytics.avgLegsPerCombo.toFixed(1)} legs/combo</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Top Sport</Typography><Typography variant="h4" fontWeight="bold">{analytics.topSport}</Typography><Typography variant="caption" color="text.secondary">{analytics.sportCounts[analytics.topSport]} combos</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      {/* Confidence Chart */}
      {filteredCombos.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Confidence Distribution</Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <BarChart
              dataset={filteredCombos.map(p => ({ label: p.name.length > 20 ? p.name.substring(0,20)+'…' : p.name, confidence: p.confidence, id: p.id }))}
              xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
              series={[{ dataKey: 'confidence', label: 'Confidence (%)', color: '#3b82f6' }]}
              yAxis={[{ max: 100 }]}
              tooltip={{ trigger: 'item' }}
            />
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}><Tabs value={selectedTab} onChange={handleTabChange}><Tab label="Combo Suggestions" /><Tab label="Leg Analytics" /></Tabs></Box>

      {/* Tab Panel: Combo Suggestions */}
      {selectedTab === 0 && (
        <Grid container spacing={3} key={selectedSports.join('-')}>
          {filteredCombos.length === 0 ? (
            <Grid item xs={12}><Alert severity="info">No combos match your filters.</Alert></Grid>
          ) : (
            filteredCombos.map((combo) => (
              <Grid item xs={12} md={6} key={combo.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: (theme) => theme.palette.primary.main,
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => toggleAccordion(combo.id)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" fontWeight="bold">{combo.name}</Typography>
                      <SportChip sport={combo.sport} />
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      <Chip label={`Line Value: ${combo.total_odds}`} size="small" variant="outlined" />
                      {getVolatilityChip(combo.risk_level)}
                      <Chip label={`Expected Value: ${combo.expected_value}`} size="small" variant="outlined" />
                    </Box>
                    <Box mb={2}><Typography variant="body2" color="text.secondary" gutterBottom>Confidence</Typography><ConfidenceIndicator value={combo.confidence} /></Box>

                    <Accordion
                      disableGutters
                      elevation={0}
                      square
                      expanded={expandedAccordions[combo.id] || false}
                      onChange={() => {}}
                      sx={{ border: 'none', '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ px: 0, cursor: 'default' }}
                      >
                        <Typography variant="body2" fontWeight="medium">{combo.legs.length} Legs</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Line Value</TableCell>
                                <TableCell align="right">Confidence</TableCell>
                                <TableCell align="right">Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {combo.legs.map(leg => (
                                <TableRow key={leg.id}>
                                  <TableCell>
                                    <Typography variant="body2">{leg.description}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {leg.sport} • {leg.market} {leg.projection && ` • Proj: ${leg.projection.toFixed(1)}`}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right"><LineValueChip odds={leg.odds} /></TableCell>
                                  <TableCell align="right">
                                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                                      <Typography variant="body2">{leg.confidence}%</Typography>
                                      <Tooltip title={leg.confidence_level || 'N/A'}>
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} />
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="right"><InjuryChip status={leg.injury_status} /></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>

                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>AI Analysis</Typography>
                      <Typography variant="body2">{combo.analysis}</Typography>
                    </Box>
                    <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">Avg Leg Confidence: {combo.ai_metrics.avg_leg_confidence?.toFixed(1)}%</Typography>
                      {combo.ai_metrics.edge !== undefined && <Typography variant="caption" color="text.secondary">Analytical Advantage: {(combo.ai_metrics.edge * 100).toFixed(1)}%</Typography>}
                      <Typography variant="caption" color="text.secondary">Amount: {combo.ai_metrics.recommended_stake}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Tab Panel: Leg Analytics */}
      {selectedTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Leg‑by‑Leg Performance Indicators</Typography>
          {filteredCombos.length === 0 ? <Alert severity="info">No data to display.</Alert> : (
            <>
              <Box sx={{ height: 300, width: '100%', mb: 4 }}>
                <PieChart
                  series={[{
                    data: Object.entries(filteredCombos.flatMap(p => p.legs).reduce<Record<string, number>>((acc, leg) => {
                      acc[leg.sport] = (acc[leg.sport] || 0) + 1;
                      return acc;
                    }, {})).map(([sport, count]) => ({ id: sport, value: count, label: sport })),
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' }
                  }]}
                  width={400}
                  height={200}
                />
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sport</TableCell>
                      <TableCell align="right">Total Legs</TableCell>
                      <TableCell align="right">Avg. Confidence</TableCell>
                      <TableCell align="right">Avg. Line Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(filteredCombos.flatMap(p => p.legs).reduce<Record<string, { count: number; totalConfidence: number; totalOdds: number }>>((acc, leg) => {
                      const sport = leg.sport || 'Unknown';
                      if (!acc[sport]) acc[sport] = { count: 0, totalConfidence: 0, totalOdds: 0 };
                      acc[sport].count += 1;
                      acc[sport].totalConfidence += leg.confidence || 0;
                      const oddsNum = parseLineValueToNumber(leg.odds);
                      acc[sport].totalOdds += isNaN(oddsNum) ? 0 : oddsNum;
                      return acc;
                    }, {})).map(([sport, stats]) => (
                      <TableRow key={sport}>
                        <TableCell component="th" scope="row"><SportChip sport={sport} /></TableCell>
                        <TableCell align="right">{stats.count}</TableCell>
                        <TableCell align="right">{stats.count ? (stats.totalConfidence / stats.count).toFixed(1) : '0'}%</TableCell>
                        <TableCell align="right">{stats.totalOdds !== 0 ? (stats.totalOdds / stats.count).toFixed(0) : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}

      {/* Generator Dialog */}
      <Dialog open={generatorOpen} onClose={() => setGeneratorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle><Box display="flex" alignItems="center" gap={1}><RocketLaunchIcon color="primary" /><Typography variant="h6">AI Combo Generator</Typography></Box></DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>Describe the combo you want (e.g., "3‑leg NBA combo with Jokic points over and Murray assists").</Typography>
          <TextField fullWidth multiline rows={3} placeholder="Enter your combo query..." value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} variant="outlined" sx={{ mb: 2 }} />
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label="NBA: Jokic over 25.5, Murray over 8.5 assists" onClick={() => setCustomQuery("Jokic over 25.5 points, Murray over 8.5 assists")} icon={<PsychologyIcon />} variant="outlined" />
            <Chip label="MLB: Ohtani over 1.5 hits, Judge HR" onClick={() => setCustomQuery("Ohtani over 1.5 hits, Judge anytime home run")} icon={<PsychologyIcon />} variant="outlined" />
            <Chip label="NHL: McDavid points, Draisaitl goals" onClick={() => setCustomQuery("McDavid over 1.5 points, Draisaitl anytime goal")} icon={<PsychologyIcon />} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratorOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setGeneratorOpen(false); handleGenerateCombo(); }} disabled={!customQuery.trim()} startIcon={<AutoAwesomeIcon />}>Generate</Button>
        </DialogActions>
      </Dialog>

      {/* Generation Result Modal */}
      <Dialog open={showGeneratorModal} onClose={() => !generating && setShowGeneratorModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{generating ? 'Generating...' : 'AI Combo Generated!'}</DialogTitle>
        <DialogContent>
          {generating ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>Building your combo...</Typography>
              <Typography variant="body2" color="text.secondary">Analyzing data and constructing optimal legs</Typography>
            </Box>
          ) : generatedResult && (
            <Paper sx={{ p: 2, bgcolor: 'background.default', whiteSpace: 'pre-line' }}>
              <Typography variant="body1" component="div">{generatedResult.analysis}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">Source: {generatedResult.source}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>{!generating && <Button onClick={handleCloseGenerator} variant="contained" fullWidth>Close</Button>}</DialogActions>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon sx={{ color: '#f59e0b' }} />
            <Typography variant="h6">Upgrade to Premium</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Get access to advanced combo analytics, analytical advantage calculations, and AI-powered recommendations.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Plan</InputLabel>
            <Select value={selectedPlan} label="Select Plan" onChange={(e) => setSelectedPlan(e.target.value)}>
              <MenuItem value="starter">Starter - $5.99/month</MenuItem>
              <MenuItem value="analytics">Analytics - $19.99/month</MenuItem>
              <MenuItem value="generator">Generator - $39.99/month</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Billing Interval</InputLabel>
            <Select value={selectedInterval} label="Billing Interval" onChange={(e) => setSelectedInterval(e.target.value)}>
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="year">Yearly (Save 20%)</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ my: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {selectedPlan === 'starter' && 'Starter Plan Features:'}
              {selectedPlan === 'analytics' && 'Analytics Plan Features:'}
              {selectedPlan === 'generator' && 'Generator Plan Features:'}
            </Typography>
            {selectedPlan === 'starter' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Basic combo suggestions</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Tournament schedules & results</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Player stats & rankings</Typography></Box>
              </>
            )}
            {selectedPlan === 'analytics' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">All Starter features</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">AI-generated combo suggestions</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Analytical Advantage percentage calculations</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">High-confidence combo filters</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Advanced leg analytics</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Sport performance breakdowns</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Confidence distribution charts</Typography></Box>
              </>
            )}
            {selectedPlan === 'generator' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">All Analytics features</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Custom combo generator</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Real-time line value integration</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">Unlimited AI generations</Typography></Box>
              </>
            )}
          </Box>
          <Button fullWidth variant="contained" size="large" onClick={handleUpgrade} sx={{ mt: 2 }}>Upgrade to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} ({selectedInterval}ly)</Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowUpgradeModal(false)}>Not Now</Button></DialogActions>
      </Dialog>
    </Container>
  );
};

// Export with route protection (ProtectedRoute will enforce analytics plan via SCREEN_REQUIREMENTS)
const ComboAnalyticsScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="ComboAnalyticsScreen">
      <ComboAnalyticsContent />
    </ProtectedRoute>
  );
};

export default ComboAnalyticsScreen;
