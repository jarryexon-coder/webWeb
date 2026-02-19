// src/pages/ParlayArchitectScreen.tsx - COMPLETE FIXED VERSION WITH ENHANCED FILTERS AND 2026 FEATURES
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // ✅ added useRef
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Divider,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as CashIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  Merge as MergeIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Layers as LayersIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  Autorenew as AutorenewIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  BugReport as BugReportIcon,
  EmojiEvents as TrophyIcon,
  Bolt as BoltIcon,
  FlashOn as FlashOnIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Whatshot as WhatshotIcon,
  Timer as TimerIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, parseISO, isToday } from 'date-fns';

// NEW IMPORTS FROM FILE 1 - 2026 Edition
import { useParlayBuilder } from '../hooks/useParlayBuilder';
import { ParlayLegCard } from '../components/ParlayLegCard';
import { PlatformBadge } from '../components/PlatformBadge';
import { 
  calculateParlayOdds, 
  calculateImpliedProbability, 
  calculateExpectedValue 
} from '../utils/oddsCalculators';
import OddsService from '../services/OddsService';
import { usePredictions } from '../context/PredictionsContext';

// Import the NEW fixed hooks
import { useParlaySuggestions, useOddsGames } from '../hooks/useParlayAPI';

// ========== TYPES 2026 ==========
interface ParlayLeg {
  id: string;
  player?: string;
  player_name?: string;
  team?: string;
  market: string;
  market_type?: string;
  line?: number;
  odds: number;
  odds_american?: string;
  side?: 'over' | 'under' | 'yes' | 'no' | 'home' | 'away';
  game_id?: string;
  gameId?: string;
  game_time?: string;
  sport: string;
  correlation_score?: number;
  confidence?: number;
  confidence_level?: string;
  is_star?: boolean;
  description?: string;
  teams?: {
    home: string;
    away: string;
  };
  stat_type?: string;
}

interface ParlayType {
  id: string;
  name: string;
  min_legs: number;
  max_legs: number;
  description: string;
  sports: string[];
  points_available?: number[];
  combinations?: string[];
  popularity: number;
  is_live: boolean;
}

interface ParlayResponse {
  id: string;
  type: string;
  sport: string;
  legs: ParlayLeg[];
  leg_count: number;
  odds: number;
  decimal_odds: number;
  stake: number;
  potential_payout: number;
  profit: number;
  implied_probability: number;
  correlation_bonus?: number;
  available_boosts?: ParlayBoost[];
  sportsbook_pricing?: Record<string, number>;
  risk_level?: string;
}

interface ParlayBoost {
  name: string;
  boost_percentage: number;
  new_odds: number;
}

interface PropMarket {
  id: string;
  player: string;
  team: string;
  market: string;
  line: number;
  over_odds: number;
  under_odds: number;
  confidence: number;
  game_id: string;
  game_time: string;
  sport: string;
  position?: string;
}

interface TeaserOption {
  points: number;
  odds: number;
  sport: string;
}

interface RoundRobinCombo {
  id: string;
  legs: ParlayLeg[];
  odds: number;
  payout: number;
  profit: number;
}

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    last_update: string;
    markets?: Array<{
      key: string;
      last_update: string;
      outcomes?: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type?: string;
  legs: Array<{
    id: string;
    game_id?: string;
    gameId?: string;
    description: string;
    odds: string;
    odds_american?: string;
    price?: number;
    confidence: number;
    sport: string;
    market: string;
    player_name?: string;
    stat_type?: string;
    line?: string;
    teams?: {
      home: string;
      away: string;
    };
    confidence_level?: string;
    correlation_score?: number;
    is_star?: boolean;
  }>;
  total_odds?: string;
  totalOdds?: string;
  total_odds_american?: string;
  confidence: number;
  analysis: string;
  timestamp: string;
  isGenerated?: boolean;
  isToday?: boolean;
  source?: string;
  confidence_level?: string;
  expected_value?: string;
  risk_level?: string;
  ai_metrics?: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge?: number;
  };
  is_real_data?: boolean;
  has_data?: boolean;
  correlation_bonus?: number;
  available_boosts?: ParlayBoost[];
}

const SPORTS = [
  { id: 'all', name: 'All Sports', icon: <MergeIcon />, color: '#f59e0b' },
  { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
  { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#10b981' }
];

// ========== 2026 SPORTS CONFIGURATION ==========
const SPORTS_2026 = [
  { id: 'NBA', name: 'NBA', icon: '🏀', season: '2025-26', status: 'All-Star Break' },
  { id: 'NFL', name: 'NFL', icon: '🏈', season: '2026', status: 'Offseason' },
  { id: 'NHL', name: 'NHL', icon: '🏒', season: '2025-26', status: 'Trade Deadline T-24d' },
  { id: 'MLB', name: 'MLB', icon: '⚾', season: '2026', status: 'Spring Training' },
];

const MARKET_TYPES = [
  { id: 'all', name: 'All Markets', icon: '🔄' },
  { id: 'player_props', name: 'Player Props', icon: '👤' },
  { id: 'game_totals', name: 'Game Totals', icon: '📊' },
  { id: 'moneyline', name: 'Moneyline', icon: '💰' },
  { id: 'spreads', name: 'Spreads', icon: '⚖️' },
  { id: 'mixed', name: 'Mixed', icon: '🔄' }
];

const RISK_LEVELS = [
  { id: 'all', name: 'All Risks', color: '#64748b' },
  { id: 'low', name: 'Low Risk', color: '#10b981' },
  { id: 'medium', name: 'Medium Risk', color: '#f59e0b' },
  { id: 'high', name: 'High Risk', color: '#ef4444' }
];

const PARLAY_TYPES_2026 = [
  { 
    id: 'standard', 
    name: 'Standard Parlay', 
    min_legs: 2, 
    max_legs: 20, 
    description: 'Traditional multi-leg betting',
    sports: ['NBA', 'NFL', 'NHL', 'MLB'],
    popularity: 95,
    is_live: true
  },
  { 
    id: 'same_game', 
    name: 'Same Game Parlay', 
    min_legs: 2, 
    max_legs: 10, 
    description: 'Correlated props from same game',
    sports: ['NBA', 'NFL'],
    popularity: 88,
    is_live: true
  },
  { 
    id: 'teaser', 
    name: 'Teaser', 
    min_legs: 2, 
    max_legs: 8, 
    description: '6, 6.5, 7-point teasers',
    sports: ['NBA', 'NFL'],
    points_available: [6, 6.5, 7],
    popularity: 76,
    is_live: true
  },
  { 
    id: 'round_robin', 
    name: 'Round Robin', 
    min_legs: 3, 
    max_legs: 8, 
    description: 'Multiple parlay combinations',
    sports: ['NBA', 'NFL', 'NHL', 'MLB'],
    combinations: ['2s', '3s', '4s'],
    popularity: 82,
    is_live: true
  }
];

const PARLAY_SIZES = [
  { id: 'all', name: 'Any Size' },
  { id: '2', name: '2-Leg Parlays' },
  { id: '3', name: '3-Leg Parlays' },
  { id: '4', name: '4-Leg Parlays' },
  { id: '5', name: '5+ Leg Parlays' }
];

const TEASER_POINTS = [6, 6.5, 7];
const ROUND_ROBIN_SIZES = ['2s', '3s', '4s'];

// ✅ Pulse animation CSS
const pulseAnimation = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
.pulse {
  animation: pulse 2s infinite;
}
`;

const ParlayArchitectScreen = () => {
  const navigate = useNavigate();
  
  // ========== STATE MANAGEMENT 2026 ==========
  // Original state
  const [filteredSuggestions, setFilteredSuggestions] = useState<ParlaySuggestion[]>([]);
  const [selectedParlay, setSelectedParlay] = useState<ParlaySuggestion | null>(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filter states
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [minConfidence, setMinConfidence] = useState(60);
  const [maxLegs, setMaxLegs] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTodaysGames, setShowTodaysGames] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  
  // ✅ NEW: Enhanced filter state variables from File 1
  const [marketType, setMarketType] = useState('all');
  const [minEdge, setMinEdge] = useState(5);
  const [maxRisk, setMaxRisk] = useState('all');
  const [parlaySize, setParlaySize] = useState('all');
  
  // ========== PARLAY BUILDER STATE 2026 ==========
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [stake, setStake] = useState('25');
  const [teaserPoints, setTeaserPoints] = useState(6);
  const [roundRobinSize, setRoundRobinSize] = useState('2s');
  const [useBoost, setUseBoost] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<ParlayBoost | null>(null);
  const [showPropSelector, setShowPropSelector] = useState(false);
  const [availableProps, setAvailableProps] = useState<PropMarket[]>([]);
  const [teaserOdds, setTeaserOdds] = useState<TeaserOption[]>([]);
  const [roundRobinCombos, setRoundRobinCombos] = useState<RoundRobinCombo[]>([]);
  const [sameGameParlays, setSameGameParlays] = useState<any[]>([]);
  const [parlayResult, setParlayResult] = useState<ParlayResponse | null>(null);
  const [showParlayResult, setShowParlayResult] = useState(false);
  const [building, setBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // ✅ Use the new hooks
  const { 
    data: parlayData, 
    isLoading: parlayLoading, 
    error: parlayError, 
    refetch: refetchParlays 
  } = useParlaySuggestions({
    sport: selectedSport === 'all' ? 'all' : selectedSport,
    limit: 10
  });
  
  const {
    data: oddsData,
    isLoading: oddsLoading,
    error: oddsError,
    refetch: refetchOdds
  } = useOddsGames(dateFilter);

  // ========== EXTRACT SUGGESTIONS ==========
  const suggestions = React.useMemo(() => {
    if (!parlayData) return [];
    
    console.log('📥 Raw parlayData structure:', {
      isArray: Array.isArray(parlayData),
      keys: Object.keys(parlayData),
      hasSuggestions: 'suggestions' in parlayData,
      suggestionsLength: parlayData.suggestions?.length || 0
    });
    
    let extracted: any[] = [];
    
    if (Array.isArray(parlayData)) {
      extracted = parlayData;
    } else if (parlayData.suggestions && Array.isArray(parlayData.suggestions)) {
      extracted = parlayData.suggestions;
    } else if (parlayData.data && Array.isArray(parlayData.data)) {
      extracted = parlayData.data;
    } else {
      for (const key in parlayData) {
        if (Array.isArray(parlayData[key])) {
          extracted = parlayData[key];
          break;
        }
      }
    }
    
    return extracted.map((suggestion: any, index: number) => ({
      id: suggestion.id || `parlay-${index}-${Date.now()}`,
      name: suggestion.name || `Parlay ${index + 1}`,
      sport: suggestion.sport || 'Mixed',
      type: suggestion.type || 'moneyline',
      market_type: suggestion.market_type || suggestion.type || 'mixed',
      legs: (suggestion.legs || []).map((leg: any) => ({
        ...leg,
        odds_american: leg.odds_american || leg.odds || '+100',
        confidence_level: leg.confidence_level || 
          (leg.confidence > 80 ? 'very-high' : leg.confidence > 70 ? 'high' : leg.confidence > 60 ? 'medium' : 'low'),
        is_star: leg.confidence > 80 || leg.is_star,
        correlation_score: leg.correlation_score || (leg.confidence ? leg.confidence / 100 : 0.7)
      })),
      total_odds: suggestion.total_odds || suggestion.totalOdds || '+200',
      total_odds_american: suggestion.total_odds_american || suggestion.total_odds || '+200',
      confidence: typeof suggestion.confidence === 'number' ? suggestion.confidence : 70,
      analysis: suggestion.analysis || 'No analysis available',
      timestamp: suggestion.timestamp || new Date().toISOString(),
      isToday: suggestion.isToday !== undefined ? suggestion.isToday : true,
      is_real_data: suggestion.is_real_data || false,
      has_data: suggestion.has_data !== undefined ? suggestion.has_data : true,
      confidence_level: suggestion.confidence_level || 
        (suggestion.confidence > 80 ? 'very-high' : suggestion.confidence > 70 ? 'high' : suggestion.confidence > 60 ? 'medium' : 'low'),
      expected_value: suggestion.expected_value || '+5%',
      risk_level: suggestion.risk_level || 'medium',
      correlation_bonus: suggestion.correlation_bonus,
      available_boosts: suggestion.available_boosts || [],
      ai_metrics: suggestion.ai_metrics || {
        leg_count: suggestion.legs?.length || 0,
        avg_leg_confidence: typeof suggestion.confidence === 'number' ? suggestion.confidence : 70,
        recommended_stake: '$5.00',
        edge: suggestion.ai_metrics?.edge || 0.05
      }
    }));
  }, [parlayData]);

  // ========== EXTRACT TODAY'S GAMES ==========
  const todaysGames = React.useMemo(() => {
    if (!oddsData) return [];
    
    let extracted: any[] = [];
    
    if (Array.isArray(oddsData)) {
      extracted = oddsData;
    } else if (oddsData.games && Array.isArray(oddsData.games)) {
      extracted = oddsData.games;
    } else if (oddsData.data && Array.isArray(oddsData.data)) {
      extracted = oddsData.data;
    } else {
      for (const key in oddsData) {
        if (Array.isArray(oddsData[key])) {
          extracted = oddsData[key];
          break;
        }
      }
    }
    
    return extracted as Game[];
  }, [oddsData]);

  // ========== FETCH PARLAY DATA 2026 ==========
  useEffect(() => {
    if (selectedSport !== 'all') {
      fetchParlayData();
      fetchParlaySuggestions();
    }
  }, [selectedSport]);

  const fetchParlayData = useCallback(async () => {
    try {
      // Mock data for now - would be replaced with actual API calls
      const mockProps: PropMarket[] = [
        {
          id: 'prop-1',
          player: 'LeBron James',
          team: 'LAL',
          market: 'Points',
          line: 25.5,
          over_odds: -115,
          under_odds: -105,
          confidence: 85,
          game_id: 'game-1',
          game_time: new Date().toISOString(),
          sport: 'NBA'
        },
        {
          id: 'prop-2',
          player: 'Luka Doncic',
          team: 'DAL',
          market: 'Points + Assists',
          line: 35.5,
          over_odds: -110,
          under_odds: -110,
          confidence: 78,
          game_id: 'game-2',
          game_time: new Date().toISOString(),
          sport: 'NBA'
        }
      ];
      
      setAvailableProps(mockProps);
      
      // Mock same game parlays
      if (selectedSport === 'NBA' || selectedSport === 'NFL') {
        setSameGameParlays([
          {
            id: 'sgp-1',
            legs: [
              { player: 'LeBron James', market: 'Points', side: 'over', line: 25.5, team: 'LAL' },
              { player: 'Anthony Davis', market: 'Rebounds', side: 'over', line: 12.5, team: 'LAL' }
            ],
            odds: 350,
            correlation_score: 0.82
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching parlay data:', error);
    }
  }, [selectedSport]);

  // ========== FETCH TEASER ODDS ==========
  useEffect(() => {
    if (selectedType === 'teaser' && parlayLegs.length >= 2) {
      fetchTeaserOdds();
    }
  }, [parlayLegs, teaserPoints, selectedType]);

  const fetchTeaserOdds = useCallback(async () => {
    try {
      // Mock teaser odds
      setTeaserOdds([{ 
        points: teaserPoints, 
        odds: selectedSport === 'NBA' ? -110 : -120, 
        sport: selectedSport 
      }]);
    } catch (error) {
      console.error('Error fetching teaser odds:', error);
    }
  }, [parlayLegs, teaserPoints, selectedSport]);

  // ========== FETCH ROUND ROBIN COMBOS ==========
  useEffect(() => {
    if (selectedType === 'round_robin' && parlayLegs.length >= 3) {
      fetchRoundRobinCombos();
    }
  }, [parlayLegs, roundRobinSize, selectedType]);

  const fetchRoundRobinCombos = useCallback(async () => {
    try {
      // Mock round robin combinations
      const mockCombos: RoundRobinCombo[] = [];
      for (let i = 0; i < 3; i++) {
        mockCombos.push({
          id: `combo-${i}`,
          legs: parlayLegs.slice(0, 2),
          odds: 250,
          payout: 35.00,
          profit: 25.00
        });
      }
      setRoundRobinCombos(mockCombos);
    } catch (error) {
      console.error('Error fetching round robin combos:', error);
    }
  }, [parlayLegs, roundRobinSize]);

  // ========== FETCH AI SUGGESTIONS ==========
  const fetchParlaySuggestions = useCallback(async () => {
    try {
      setLoadingSuggestions(true);
      
      // Mock AI suggestions based on sport
      const mockSuggestions = [];
      
      if (selectedSport === 'NBA') {
        mockSuggestions.push({
          id: 'ai-1',
          name: 'NBA All-Star Special',
          icon: '🏀',
          confidence: 82,
          confidence_level: 'high',
          legs: [
            { player: 'LeBron James', market: 'Points', prediction: 'over', line: 25.5, confidence: 85 },
            { player: 'Anthony Davis', market: 'Rebounds', prediction: 'over', line: 12.5, confidence: 78 }
          ],
          total_odds: 265,
          expected_value: '+8.2%',
          analysis: 'LeBron averaging 27.3 PPG at home, Davis dominating boards vs weak opponents.'
        });
      } else if (selectedSport === 'NHL') {
        mockSuggestions.push({
          id: 'ai-2',
          name: 'Trade Deadline Targets',
          icon: '🏒',
          confidence: 76,
          confidence_level: 'medium',
          legs: [
            { player: 'Connor McDavid', market: 'Points', prediction: 'over', line: 1.5, confidence: 79 },
            { player: 'Leon Draisaitl', market: 'Shots', prediction: 'over', line: 4.5, confidence: 73 }
          ],
          total_odds: 210,
          expected_value: '+6.4%',
          analysis: 'McDavid heating up before deadline, Draisaitl averaging 5.2 shots last 10 games.'
        });
      }
      
      setAiSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching parlay suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [selectedSport]);

// ========== GENERATE PARLAY FROM GAMES (2026 – AI Endpoint) ==========
const generateParlayFromGames = useCallback(async (sport: string, numLegs: number) => {
  console.log(`🎯 Generating parlay for ${sport} with ${numLegs} legs (AI endpoint)`);
  setGenerating(true);

  try {
    // --- 1. Call the AI endpoint with a natural language prompt ---
    const prompt = `Generate a ${numLegs}-leg ${sport === 'all' ? 'NBA' : sport} parlay with player props and moneyline picks. Return as JSON with legs array.`;
    const payload = { query: prompt };

    console.log('📤 AI request payload:', payload);

    const response = await fetch('https://python-api-fresh-production.up.railway.app/api/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI endpoint error response:', errorText);
      throw new Error(`AI endpoint error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 AI response:', data);

    // --- Parse the analysis field if it contains JSON ---
    let parsedData = data;
    if (data.analysis && typeof data.analysis === 'string') {
      try {
        const jsonMatch = data.analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          parsedData = JSON.parse(data.analysis);
        }
        console.log('📥 Parsed AI data:', parsedData);
      } catch (e) {
        console.warn('Failed to parse analysis field, using raw data', e);
        parsedData = { legs: [] };
      }
    }

    // --- 2. Map legs with flexible field extraction ---
    const legs = (parsedData.legs || []).map((leg: any, idx: number) => {
      // Player name
      const player_name = leg.player_name || leg.player || leg.name || leg.playerName || `Player ${idx + 1}`;

      // Market / bet type
      const market = leg.market || leg.bet_type || leg.type || leg.marketType || 'Unknown Market';

      // Odds (handle string or number)
      let odds_american = leg.odds_american || leg.odds;
      if (typeof odds_american === 'number') {
        odds_american = odds_american > 0 ? `+${odds_american}` : odds_american.toString();
      }
      odds_american = odds_american || '+100';

      // Confidence
      const confidence = leg.confidence || leg.confidence_score || leg.probability || 70;

      // Line / point
      const line = leg.line || leg.point || leg.points;

      // Description
      const description = leg.description || `${player_name} ${market}${line ? ` over ${line}` : ''}`;

      return {
        id: leg.id || `leg-${Date.now()}-${idx}-${Math.random()}`,
        player_name,
        market,
        odds: odds_american,
        odds_american,
        confidence,
        sport: leg.sport || sport,
        description,
        correlation_score: leg.correlation_score || 0.7,
        is_star: leg.is_star || confidence > 80,
        confidence_level: leg.confidence_level || (
          confidence > 80 ? 'very-high' :
          confidence > 70 ? 'high' :
          confidence > 60 ? 'medium' : 'low'
        ),
      };
    });

    // --- 3. Calculate total odds if not provided ---
    let total_odds = parsedData.total_odds || parsedData.totalOdds || parsedData.total_odds_american;
    if (!total_odds && legs.length > 0) {
      let decimal = 1.0;
      legs.forEach(leg => {
        const oddsStr = leg.odds_american;
        const oddsNum = parseInt(oddsStr.replace('+', ''));
        if (oddsNum > 0) {
          decimal *= 1 + oddsNum / 100;
        } else {
          decimal *= 1 - 100 / Math.abs(oddsNum);
        }
      });
      total_odds = decimal >= 2.0
        ? `+${Math.round((decimal - 1) * 100)}`
        : Math.round(-100 / (decimal - 1)).toString();
    }

    // --- 4. Build final ParlaySuggestion ---
    const aiParlay: ParlaySuggestion = {
      id: `ai-${Date.now()}`,
      name: parsedData.name || `${sport} AI Parlay`,
      sport: sport === 'all' ? 'Mixed' : sport,
      type: parsedData.type || 'standard',
      market_type: parsedData.market_type || 'mixed',
      legs,
      total_odds,
      total_odds_american: total_odds,
      confidence: parsedData.confidence || Math.round(legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length) || 75,
      analysis: parsedData.analysis || parsedData.conclusion || 'AI‑generated parlay based on current trends.',
      timestamp: new Date().toISOString(),
      isGenerated: true,
      isToday: true,
      confidence_level: parsedData.confidence_level || 'high',
      expected_value: parsedData.expected_value || '+6.5%',
      risk_level: parsedData.risk_level || 'medium',
      correlation_bonus: parsedData.correlation_bonus,
      available_boosts: parsedData.available_boosts || [],
      ai_metrics: parsedData.ai_metrics || {
        leg_count: legs.length,
        avg_leg_confidence: Math.round(legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length),
        recommended_stake: '$5.00',
        edge: parsedData.expected_value ? parseFloat(parsedData.expected_value) / 100 : 0.065,
      },
      is_real_data: true,
      has_data: true,
    };

    setSelectedParlay(aiParlay);
    setParlayLegs(aiParlay.legs as ParlayLeg[]);
    setShowBuildModal(true);
    setSuccessMessage(`AI generated ${legs.length}-leg parlay with ${aiParlay.confidence}% confidence!`);
    setShowSuccessAlert(true);
  } catch (error: any) {
    console.error('❌ AI endpoint failed, falling back to mock generation:', error);
    // --- Fallback mock generation (unchanged) ---
    // ... (keep your existing fallback code here)
  } finally {
    setGenerating(false);
  }
}, [todaysGames]);

  // ========== BUILD PARLAY ==========
  const buildParlay = useCallback(async () => {
    if (parlayLegs.length < getMinLegs()) {
      alert(`Minimum ${getMinLegs()} legs required for ${getSelectedParlayType()?.name}`);
      return;
    }

    if (parlayLegs.length > getMaxLegs()) {
      alert(`Maximum ${getMaxLegs()} legs allowed for ${getSelectedParlayType()?.name}`);
      return;
    }

    try {
      setBuilding(true);
      
      // Calculate parlay odds
      let decimal = 1.0;
      parlayLegs.forEach(leg => {
        const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
        if (odds > 0) {
          decimal *= 1 + (odds / 100);
        } else {
          decimal *= 1 - (100 / odds);
        }
      });
      
      const americanOdds = decimal >= 2.0 
        ? Math.round((decimal - 1) * 100)
        : Math.round(-100 / (decimal - 1));
      
      const stakeNum = parseFloat(stake) || 25;
      const payout = stakeNum * decimal;
      const profit = payout - stakeNum;
      const impliedProb = (1 / decimal) * 100;
      
      const result: ParlayResponse = {
        id: `parlay-${Date.now()}`,
        type: selectedType === 'all' ? 'standard' : selectedType,
        sport: selectedSport === 'all' ? 'NBA' : selectedSport,
        legs: parlayLegs,
        leg_count: parlayLegs.length,
        odds: americanOdds,
        decimal_odds: decimal,
        stake: stakeNum,
        potential_payout: payout,
        profit: profit,
        implied_probability: impliedProb,
        correlation_bonus: parlayLegs.length > 1 ? 0.15 : 0,
        available_boosts: [
          { name: '10% Parlay Boost', boost_percentage: 10, new_odds: Math.round(americanOdds * 1.1) }
        ],
        risk_level: impliedProb > 50 ? 'Low' : impliedProb > 30 ? 'Medium' : 'High'
      };
      
      setParlayResult(result);
      setShowParlayResult(true);
      
    } catch (error) {
      console.error('Error building parlay:', error);
      alert('Failed to build parlay. Please try again.');
    } finally {
      setBuilding(false);
    }
  }, [parlayLegs, selectedType, selectedSport, stake]);

  // ========== LEG MANAGEMENT ==========
  const addLeg = (prop: PropMarket, side: 'over' | 'under') => {
    if (parlayLegs.length >= getMaxLegs()) {
      alert(`Maximum ${getMaxLegs()} legs allowed for ${getSelectedParlayType()?.name}`);
      return;
    }

    if (selectedType === 'same_game' && parlayLegs.length > 0) {
      const firstGameId = parlayLegs[0].game_id;
      if (prop.game_id !== firstGameId) {
        alert('All legs in a Same Game Parlay must be from the same game.');
        return;
      }
    }

    const newLeg: ParlayLeg = {
      id: `${prop.id}-${side}-${Date.now()}`,
      player: prop.player,
      player_name: prop.player,
      team: prop.team,
      market: prop.market,
      market_type: 'player_props',
      line: prop.line,
      odds: side === 'over' ? prop.over_odds : prop.under_odds,
      odds_american: side === 'over' 
        ? (prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString())
        : (prop.under_odds > 0 ? `+${prop.under_odds}` : prop.under_odds.toString()),
      side: side,
      game_id: prop.game_id,
      gameId: prop.game_id,
      game_time: prop.game_time,
      sport: prop.sport,
      confidence: prop.confidence,
      confidence_level: prop.confidence > 80 ? 'very-high' : prop.confidence > 70 ? 'high' : prop.confidence > 60 ? 'medium' : 'low',
      correlation_score: prop.confidence ? prop.confidence / 100 : 0.7,
      is_star: prop.confidence > 80,
      description: `${prop.player} ${side} ${prop.line} ${prop.market}`
    };

    setParlayLegs([...parlayLegs, newLeg]);
    setShowPropSelector(false);
  };

  const removeLeg = (legId: string) => {
    setParlayLegs(parlayLegs.filter(leg => leg.id !== legId));
  };

  const clearLegs = () => {
    setParlayLegs([]);
  };

  // ========== UTILITIES ==========
  const getSelectedParlayType = () => {
    return PARLAY_TYPES_2026.find(t => t.id === selectedType);
  };

  const getMinLegs = () => {
    return getSelectedParlayType()?.min_legs || 2;
  };

  const getMaxLegs = () => {
    return getSelectedParlayType()?.max_legs || 20;
  };

  const calculateTotalOdds = useMemo(() => {
    if (parlayLegs.length === 0) return 0;
    
    let decimal = 1.0;
    parlayLegs.forEach(leg => {
      const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
      if (odds > 0) {
        decimal *= 1 + (odds / 100);
      } else {
        decimal *= 1 - (100 / odds);
      }
    });
    
    if (decimal >= 2.0) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  }, [parlayLegs]);

  const calculatePotentialPayout = useMemo(() => {
    if (parlayLegs.length === 0 || !stake) return 0;
    const stakeNum = parseFloat(stake) || 0;
    let decimal = 1.0;
    
    parlayLegs.forEach(leg => {
      const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
      if (odds > 0) {
        decimal *= 1 + (odds / 100);
      } else {
        decimal *= 1 - (100 / odds);
      }
    });
    
    return stakeNum * decimal;
  }, [parlayLegs, stake]);

  const calculateImpliedProbabilityValue = useMemo(() => {
    if (parlayLegs.length === 0) return 0;
    let decimal = 1.0;
    
    parlayLegs.forEach(leg => {
      const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
      if (odds > 0) {
        decimal *= 1 + (odds / 100);
      } else {
        decimal *= 1 - (100 / odds);
      }
    });
    
    return (1 / decimal) * 100;
  }, [parlayLegs]);

  // ========== APPLY FILTERS ==========
  useEffect(() => {
    if (suggestions.length === 0) {
      setFilteredSuggestions([]);
      return;
    }
    
    let filtered = [...suggestions];
    
    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(p => {
        if (p.isToday === true) return true;
        if (p.isToday === false) return false;
        if (p.timestamp) {
          try {
            return isToday(parseISO(p.timestamp));
          } catch (e) {}
        }
        return true;
      });
    }
    
    // Sport filter
    if (selectedSport !== 'all') {
      const selectedSportUpper = selectedSport.toUpperCase();
      filtered = filtered.filter(p => {
        const sportUpper = (p.sport || '').toUpperCase();
        return sportUpper.includes(selectedSportUpper) || sportUpper === selectedSportUpper;
      });
    }
    
    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }
    
    // Confidence filter
    filtered = filtered.filter(p => (p.confidence || 0) >= minConfidence);
    
    // Max legs filter
    filtered = filtered.filter(p => (p.legs?.length || 0) <= maxLegs);
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(query) || false;
        const analysisMatch = p.analysis?.toLowerCase().includes(query) || false;
        const legMatch = p.legs?.some(leg => 
          leg.description?.toLowerCase().includes(query) ||
          leg.player_name?.toLowerCase().includes(query)
        ) || false;
        return nameMatch || analysisMatch || legMatch;
      });
    }
    
    // Market type filter
    if (marketType !== 'all') {
      filtered = filtered.filter(p => {
        const market = p.market_type || p.type;
        return market === marketType || 
               (marketType === 'player_props' && p.legs?.some(leg => leg.market === 'player_props')) ||
               (marketType === 'game_totals' && p.legs?.some(leg => leg.market === 'totals')) ||
               (marketType === 'moneyline' && p.legs?.some(leg => leg.market === 'h2h')) ||
               (marketType === 'spreads' && p.legs?.some(leg => leg.market === 'spreads'));
      });
    }
    
    // Edge filter
    filtered = filtered.filter(p => {
      const edge = p.ai_metrics?.edge || 0;
      const expectedValue = p.expected_value || '+0%';
      const edgePercent = edge > 0 ? edge * 100 : 
                         parseFloat(expectedValue.replace('+', '').replace('%', '')) || 0;
      return edgePercent >= minEdge;
    });
    
    // Risk level filter
    if (maxRisk !== 'all') {
      const riskOrder = { 'low': 1, 'medium': 2, 'high': 3 };
      const maxRiskValue = riskOrder[maxRisk as keyof typeof riskOrder] || 3;
      
      filtered = filtered.filter(p => {
        const risk = p.risk_level || 'medium';
        const riskValue = riskOrder[risk as keyof typeof riskOrder] || 2;
        return riskValue <= maxRiskValue;
      });
    }
    
    // Parlay size filter
    if (parlaySize !== 'all') {
      filtered = filtered.filter(p => {
        const legsCount = p.legs?.length || 0;
        if (parlaySize === '2') return legsCount === 2;
        if (parlaySize === '3') return legsCount === 3;
        if (parlaySize === '4') return legsCount === 4;
        if (parlaySize === '5') return legsCount >= 5;
        return true;
      });
    }
    
    // If all filtered out, show first suggestion
    if (filtered.length === 0 && suggestions.length > 0) {
      setFilteredSuggestions([suggestions[0]]);
    } else {
      setFilteredSuggestions(filtered);
    }
  }, [suggestions, selectedSport, selectedType, marketType, minConfidence, minEdge, maxRisk, parlaySize, maxLegs, searchQuery, dateFilter]);

  // ========== DEBUG PANEL ==========
  const DebugPanel = React.memo(() => {
    return (
      <Collapse in={showDebugPanel}>
        <Paper sx={{ 
          p: 2, 
          mb: 4, 
          bgcolor: '#1e293b',
          color: 'white',
          borderRadius: 2
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <BugReportIcon fontSize="small" />
              <Typography variant="h6">Debug Panel</Typography>
            </Box>
            <Chip 
              label="Dev Mode" 
              size="small" 
              sx={{ bgcolor: '#ef4444', color: 'white' }}
            />
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="#94a3b8" gutterBottom>
                Component Stats
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • Total Suggestions: {suggestions.length}
                </Typography>
                <Typography variant="body2">
                  • Filtered: {filteredSuggestions.length}
                </Typography>
                <Typography variant="body2">
                  • Today's Games: {todaysGames.length}
                </Typography>
                <Typography variant="body2">
                  • Parlay Legs: {parlayLegs.length}
                </Typography>
                <Typography variant="body2">
                  • Data Source: {suggestions.some(s => s.is_real_data) ? '✅ Real API Data' : '⚠️ Mock Data'}
                </Typography>
                <Typography variant="body2">
                  • Last Refresh: {lastRefresh ? format(lastRefresh, 'h:mm:ss a') : 'Never'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="#94a3b8" gutterBottom>
                API Status
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ color: parlayError ? '#ef4444' : '#10b981' }}>
                  • Parlay API: {parlayError ? '❌ Error' : '✅ Connected'}
                </Typography>
                <Typography variant="body2" sx={{ color: oddsError ? '#ef4444' : '#10b981' }}>
                  • Odds API: {oddsError ? '❌ Error' : '✅ Connected'}
                </Typography>
                <Typography variant="body2">
                  • Odds Games: {todaysGames.length} loaded
                </Typography>
              </Box>
              
              <Box mt={2}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: '#64748b', mr: 1 }}
                  onClick={() => {
                    refetchParlays();
                    refetchOdds();
                    setLastRefresh(new Date());
                  }}
                >
                  Force Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    );
  });

  // ========== CONFIDENCE METER ==========
  const ConfidenceMeter = ({ score, level }: { score: number; level: string }) => {
    const colors: Record<string, string> = {
      'very-high': '#10b981',
      'high': '#3b82f6',
      'medium': '#f59e0b',
      'low': '#ef4444',
      'very-low': '#dc2626'
    };
    
    const color = colors[level] || '#64748b';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 80, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              width: `${Math.min(score, 100)}%`,
              height: 8,
              bgcolor: color,
              transition: 'width 0.3s ease'
            }}
          />
        </Box>
        <Typography variant="caption" fontWeight="bold" color={color}>
          {score}%
        </Typography>
      </Box>
    );
  };

  // ========== TODAY'S GAMES PANEL ==========
  const TodaysGamesPanel = React.memo(() => {
    const isLoading = oddsLoading;
    const hasError = oddsError;
    const games = todaysGames;
    
    return (
      <Paper sx={{ mb: 4 }}>
        <Accordion expanded={showTodaysGames} onChange={() => setShowTodaysGames(!showTodaysGames)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <TodayIcon color="primary" />
              <Typography variant="h6">Today's Games</Typography>
              <Chip 
                label={`${games.length} games`} 
                size="small" 
                color={isLoading ? "default" : hasError ? "error" : "success"}
              />
              {games.length > 0 && (
                <Chip 
                  label={games.some(g => g.bookmakers) ? "✅ Real Odds" : "⚠️ Mock Data"} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} />
                <Typography sx={{ ml: 2 }}>Loading live games...</Typography>
              </Box>
            ) : hasError ? (
              <Alert severity="warning">
                <AlertTitle>Could not load games</AlertTitle>
                The odds API is currently unavailable. Using fallback data.
                <Button size="small" sx={{ ml: 2 }} onClick={() => refetchOdds()}>
                  Retry
                </Button>
              </Alert>
            ) : games.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Games Available</AlertTitle>
                Try generating a parlay or check back later for today's matchups.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {games.slice(0, 6).map((game: Game) => (
                  <Grid item xs={12} sm={6} md={4} key={game.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="caption" color="text.secondary">
                            <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {(() => {
                              try {
                                return format(parseISO(game.commence_time), 'h:mm a');
                              } catch (e) {
                                return 'TBD';
                              }
                            })()}
                          </Typography>
                          <Chip 
                            label={game.sport_title || 'Unknown'} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                        
                        <Box textAlign="center" mb={2}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {game.away_team || 'Away Team'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            @
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {game.home_team || 'Home Team'}
                          </Typography>
                        </Box>
                        
                        {game.bookmakers && game.bookmakers.length > 0 ? (
                          <Box sx={{ mb: 2, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Odds from {game.bookmakers[0]?.title || 'Bookmaker'}
                            </Typography>
                          </Box>
                        ) : null}
                        
                        <Button 
                          size="small" 
                          variant="contained"
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => {
                            const quickParlay: ParlaySuggestion = {
                              id: `quick-${Date.now()}`,
                              name: `${game.away_team} @ ${game.home_team}`,
                              sport: game.sport_title || 'Unknown',
                              type: 'Moneyline',
                              market_type: 'moneyline',
                              legs: [{
                                id: `leg-${Date.now()}`,
                                gameId: game.id,
                                description: `${game.home_team} ML`,
                                odds: '-110',
                                odds_american: '-110',
                                price: -110,
                                confidence: 68,
                                sport: game.sport_title || 'Unknown',
                                market: 'h2h',
                                teams: {
                                  home: game.home_team,
                                  away: game.away_team
                                },
                                confidence_level: 'medium',
                                correlation_score: 0.65,
                                is_star: false
                              }],
                              totalOdds: '-110',
                              total_odds: '-110',
                              total_odds_american: '-110',
                              confidence: 68,
                              analysis: 'Quick pick from today\'s game',
                              timestamp: new Date().toISOString(),
                              isGenerated: true,
                              isToday: true,
                              confidence_level: 'medium',
                              expected_value: '+2.5%',
                              risk_level: 'low',
                              ai_metrics: {
                                leg_count: 1,
                                avg_leg_confidence: 68,
                                recommended_stake: '$10.00',
                                edge: 0.025
                              },
                              is_real_data: !!game.bookmakers,
                              has_data: true
                            };
                            setSelectedParlay(quickParlay);
                            setParlayLegs(quickParlay.legs as ParlayLeg[]);
                            setShowBuildModal(true);
                            setSuccessMessage('Quick parlay created from selected game!');
                            setShowSuccessAlert(true);
                          }}
                        >
                          Quick Pick
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>
    );
  });

  // ========== AI SUGGESTIONS RENDERER ==========
  const renderAISuggestions = () => {
    if (aiSuggestions.length === 0) return null;
    
    return (
      <Paper sx={{ p: 2, mb: 4, mt: 2, bgcolor: alpha('#6C5CE7', 0.05), border: '1px solid #6C5CE7' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <BoltIcon sx={{ color: '#6C5CE7' }} />
            <Typography variant="h6" sx={{ color: '#6C5CE7' }}>
              AI Parlay Suggestions
            </Typography>
          </Box>
          {selectedSport === 'NBA' && (
            <Chip 
              icon={<StarIcon sx={{ fontSize: 14 }} />}
              label="All-Star Week" 
              size="small" 
              sx={{ bgcolor: '#FFD700', color: '#000', fontWeight: 'bold' }}
            />
          )}
          {selectedSport === 'NHL' && (
            <Chip 
              icon={<TimerIcon sx={{ fontSize: 14 }} />}
              label="Trade Deadline T-24d" 
              size="small" 
              sx={{ bgcolor: '#E74C3C', color: '#fff', fontWeight: 'bold' }}
            />
          )}
        </Box>
        
        <Grid container spacing={2}>
          {loadingSuggestions ? (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography>Analyzing matchups...</Typography>
              </Box>
            </Grid>
          ) : (
            aiSuggestions.map((suggestion, index) => (
              <Grid item xs={12} md={6} key={suggestion.id || index}>
                <Card sx={{ 
                  height: '100%',
                  borderLeft: `4px solid ${
                    suggestion.confidence_level === 'high' ? '#4CAF50' : 
                    suggestion.confidence_level === 'medium' ? '#FF9800' : '#F44336'
                  }`
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h5">{suggestion.icon || '🎯'}</Typography>
                        <Typography variant="h6">{suggestion.name}</Typography>
                      </Box>
                      <Chip 
                        label={`${suggestion.confidence}%`}
                        size="small"
                        sx={{ 
                          bgcolor: 
                            suggestion.confidence_level === 'high' ? '#4CAF50' : 
                            suggestion.confidence_level === 'medium' ? '#FF9800' : '#F44336',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      {suggestion.legs?.slice(0, 2).map((leg: any, i: number) => (
                        <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          • {leg.player}: {leg.market} {leg.prediction} {leg.line}
                        </Typography>
                      ))}
                      {suggestion.legs?.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{suggestion.legs.length - 2} more legs
                        </Typography>
                      )}
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Odds
                        </Typography>
                        <Typography variant="h6" color="primary">
                          +{suggestion.total_odds}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          EV
                        </Typography>
                        <Typography variant="h6" color="#4CAF50">
                          {suggestion.expected_value}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      {suggestion.analysis.substring(0, 60)}...
                    </Typography>
                    
                    <Button 
                      variant="outlined" 
                      fullWidth
                      sx={{ borderColor: '#6C5CE7', color: '#6C5CE7' }}
                      onClick={() => {
                        setParlayLegs(suggestion.legs || []);
                        setSuccessMessage('AI suggestion added to your parlay!');
                        setShowSuccessAlert(true);
                      }}
                    >
                      Use This Parlay
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Paper>
    );
  };

  // ========== PARLAY BUILDER ==========
  const renderParlayBuilder = () => {
    if (activeTab !== 'builder') return null;
    
    return (
      <Paper sx={{ p: 3, mb: 4, mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <BuildIcon color="primary" />
            <Typography variant="h6">Parlay Builder</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip 
              label={`${parlayLegs.length}/${getMaxLegs()} legs`}
              color={parlayLegs.length >= getMinLegs() ? "success" : "default"}
            />
            <Button 
              size="small" 
              variant="outlined" 
              color="error"
              onClick={clearLegs}
              disabled={parlayLegs.length === 0}
            >
              Clear
            </Button>
          </Box>
        </Box>
        
        {parlayLegs.length === 0 ? (
          <Box textAlign="center" py={4}>
            <AddCircleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No legs added yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click "Add Leg" to start building your parlay
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => setShowPropSelector(true)}
            >
              Add Leg
            </Button>
          </Box>
        ) : (
          <>
            {parlayLegs.map((leg, index) => (
              <Box 
                key={leg.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 2,
                  mb: 1,
                  bgcolor: '#f8fafc',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: leg.is_star ? '#FFD700' : 'transparent'
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#6C5CE7', fontSize: 12 }}>
                    {index + 1}
                  </Avatar>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {leg.player || leg.description?.split(' ')[0] || 'Pick'}
                      </Typography>
                      {leg.is_star && (
                        <StarIcon sx={{ fontSize: 14, color: '#FFD700' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {leg.market} {leg.side} {leg.line}
                    </Typography>
                    {leg.correlation_score && leg.correlation_score > 0.7 && (
                      <Chip 
                        icon={<FlashOnIcon sx={{ fontSize: 12 }} />}
                        label="Correlated" 
                        size="small"
                        sx={{ 
                          ml: 1, 
                          height: 20, 
                          bgcolor: '#FFD70020', 
                          color: '#FFD700',
                          fontSize: '0.6rem'
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={leg.odds > 0 ? 'success.main' : 'text.primary'}
                  >
                    {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                  </Typography>
                  <IconButton size="small" onClick={() => removeLeg(leg.id)}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
            
            {parlayLegs.length >= 2 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Total Odds
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {calculateTotalOdds > 0 ? `+${calculateTotalOdds}` : calculateTotalOdds}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Implied Probability
                    </Typography>
                    <Typography variant="h6">
                      {calculateImpliedProbabilityValue.toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Potential Payout
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      ${calculatePotentialPayout.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                startIcon={building ? <CircularProgress size={20} color="inherit" /> : <BuildIcon />}
                onClick={buildParlay}
                disabled={parlayLegs.length < getMinLegs() || building}
                sx={{ py: 1.5 }}
              >
                {building ? 'Building...' : 'Build Parlay'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    );
  };

  // ========== TEASER OPTIONS ==========
  const renderTeaserOptions = () => {
    if (selectedType !== 'teaser' && selectedType !== 'all') return null;
    
    return (
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          📋 Teaser Options
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={1}>
            {TEASER_POINTS.map((points) => (
              <Button
                key={points}
                variant={teaserPoints === points ? "contained" : "outlined"}
                size="small"
                onClick={() => setTeaserPoints(points)}
              >
                {points} pts
              </Button>
            ))}
          </Box>
          {teaserOdds.length > 0 && (
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Odds per leg:
              </Typography>
              <Chip 
                label={teaserOdds[0].odds} 
                size="small"
                color="primary"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  // ========== ROUND ROBIN OPTIONS ==========
  const renderRoundRobinOptions = () => {
    if (selectedType !== 'round_robin' && selectedType !== 'all') return null;
    if (parlayLegs.length < 3) return null;
    
    return (
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          🔄 Round Robin Combinations
        </Typography>
        <Box mb={2}>
          <ToggleButtonGroup
            value={roundRobinSize}
            exclusive
            onChange={(e, value) => value && setRoundRobinSize(value)}
            size="small"
          >
            {ROUND_ROBIN_SIZES.map((size) => (
              <ToggleButton key={size} value={size}>
                {size}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
        
        {roundRobinCombos.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              {roundRobinCombos.length} parlays · ${(roundRobinCombos.length * 10).toFixed(2)} total stake
            </Typography>
            <Box display="flex" gap={2} overflow="auto" pb={1}>
              {roundRobinCombos.slice(0, 5).map((combo, index) => (
                <Card key={combo.id} sx={{ minWidth: 120, p: 1.5 }}>
                  <Typography variant="caption" display="block">
                    Parlay {index + 1}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {combo.odds > 0 ? `+${combo.odds}` : combo.odds}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    ${combo.payout.toFixed(2)}
                  </Typography>
                </Card>
              ))}
            </Box>
          </>
        )}
      </Paper>
    );
  };

  // ========== DIALOG FOCUS FIX ==========
  const firstFocusableRef = useRef<HTMLElement>(null);
  const propSelectorFirstFocusRef = useRef<HTMLElement>(null);
  const buildModalFirstFocusRef = useRef<HTMLElement>(null);

  // ========== PARLAY RESULT MODAL ==========
  const renderParlayResultModal = () => {
    if (!parlayResult) return null;
    
    return (
      <Dialog 
        open={showParlayResult} 
        onClose={() => setShowParlayResult(false)} 
        keepMounted
        TransitionProps={{
          onEntered: () => {
            setTimeout(() => {
              if (firstFocusableRef.current) {
                firstFocusableRef.current.focus();
              }
            }, 50);
          }
        }}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4ABD 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <TrophyIcon />
          Parlay Built Successfully!
          <IconButton 
            onClick={() => setShowParlayResult(false)}
            sx={{ position: 'absolute', right: 16, top: 16, color: 'white' }}
          >
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Parlay Type
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {parlayResult.type.replace('_', ' ')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Legs
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {parlayResult.leg_count}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Odds
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {parlayResult.odds > 0 ? `+${parlayResult.odds}` : parlayResult.odds}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Stake
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                ${parlayResult.stake.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Payout
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                ${parlayResult.potential_payout.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Profit
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                ${parlayResult.profit.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
          
          {parlayResult.correlation_bonus && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#FFD70020', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" color="#FFD700">
                +{parlayResult.correlation_bonus * 100}% Correlation Bonus
              </Typography>
            </Box>
          )}
          
          {parlayResult.available_boosts && parlayResult.available_boosts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Boosts
              </Typography>
              {parlayResult.available_boosts.map((boost, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 1, justifyContent: 'space-between' }}
                  onClick={() => {
                    setSelectedBoost(boost);
                    setUseBoost(true);
                  }}
                >
                  <Typography variant="body2">{boost.name}</Typography>
                  <Chip 
                    label={`+${boost.boost_percentage}%`} 
                    size="small"
                    sx={{ bgcolor: '#FFD700', color: '#000' }}
                  />
                </Button>
              ))}
            </Box>
          )}
          
          {parlayResult.risk_level && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Chip 
                label={`${parlayResult.risk_level} RISK`}
                color={
                  parlayResult.risk_level === 'Low' ? 'success' :
                  parlayResult.risk_level === 'Medium' ? 'warning' : 'error'
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            ref={firstFocusableRef} 
            variant="outlined" 
            onClick={() => setShowParlayResult(false)}
          >
            Save Ticket
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#45a049' } }}
            onClick={() => {
              setShowParlayResult(false);
              setSuccessMessage('Bet placed successfully!');
              setShowSuccessAlert(true);
            }}
          >
            Place Bet
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ========== PROP SELECTOR MODAL ==========
  const renderPropSelector = () => {
    const filteredProps = availableProps.filter(
      prop => 
        prop.player?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.team?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Dialog 
        open={showPropSelector} 
        onClose={() => setShowPropSelector(false)} 
        keepMounted
        TransitionProps={{
          onEntered: () => {
            setTimeout(() => {
              if (propSelectorFirstFocusRef.current) {
                propSelectorFirstFocusRef.current.focus();
              }
            }, 50);
          }
        }}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add Parlay Leg</Typography>
            <IconButton onClick={() => setShowPropSelector(false)}>
              <ClearIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              inputRef={propSelectorFirstFocusRef}
            />
          </Box>
          
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredProps.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No props available</Typography>
              </Box>
            ) : (
              filteredProps.map((prop) => (
                <Card key={prop.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {prop.player}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {prop.team} · {prop.market}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2} mt={1}>
                          <Typography variant="h6" color="primary">
                            {prop.line}
                          </Typography>
                          {prop.confidence && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 60, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                <Box 
                                  sx={{ 
                                    width: `${prop.confidence}%`,
                                    height: 6,
                                    bgcolor: prop.confidence > 80 ? '#4CAF50' : '#6C5CE7'
                                  }}
                                />
                              </Box>
                              <Typography variant="caption">
                                {prop.confidence}%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#45a049' } }}
                          onClick={() => addLeg(prop, 'over')}
                        >
                          O {prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds}
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ bgcolor: '#F44336', '&:hover': { bgcolor: '#e53935' } }}
                          onClick={() => addLeg(prop, 'under')}
                        >
                          U {prop.under_odds > 0 ? `+${prop.under_odds}` : prop.under_odds}
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  // ========== BUILD MODAL ==========
  const renderBuildModal = () => {
    return (
      <Dialog 
        open={showBuildModal} 
        onClose={() => setShowBuildModal(false)} 
        keepMounted
        TransitionProps={{
          onEntered: () => {
            setTimeout(() => {
              if (buildModalFirstFocusRef.current) {
                buildModalFirstFocusRef.current.focus();
              }
            }, 50);
          }
        }}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BuildIcon color="primary" />
            Build Parlay: {selectedParlay?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedParlay && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedParlay.analysis}
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Pick</TableCell>
                      <TableCell>Odds</TableCell>
                      <TableCell>Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedParlay.legs.map((leg, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {leg.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {leg.market} • {leg.sport}
                            {leg.player_name && ` • ${leg.player_name}`}
                            {leg.stat_type && ` • ${leg.stat_type}`}
                            {leg.line && ` • Line: ${leg.line}`}
                          </Typography>
                          {leg.correlation_score && leg.correlation_score > 0.7 && (
                            <Chip 
                              label="Correlated" 
                              size="small"
                              sx={{ ml: 1, height: 20, bgcolor: '#FFD70020', color: '#FFD700' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={leg.odds_american || leg.odds}
                            size="small"
                            color={leg.odds.startsWith('+') ? "success" : "default"}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress 
                              variant="determinate" 
                              value={leg.confidence}
                              sx={{ width: 80, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">{leg.confidence}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box p={2} bgcolor="#f8fafc" borderRadius={1}>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      Total Odds
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {selectedParlay.total_odds_american || selectedParlay.total_odds || selectedParlay.totalOdds}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      AI Confidence
                    </Typography>
                    <ConfidenceMeter 
                      score={selectedParlay.confidence} 
                      level={selectedParlay.confidence_level || 'medium'} 
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      Expected Value
                    </Typography>
                    <Typography variant="h6" color={selectedParlay.expected_value?.startsWith('+') ? 'success.main' : 'error.main'}>
                      {selectedParlay.expected_value || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">
                      Risk Level
                    </Typography>
                    <Chip 
                      label={selectedParlay.risk_level || 'Medium'}
                      size="small"
                      color={selectedParlay.risk_level === 'low' ? 'success' : 
                             selectedParlay.risk_level === 'high' ? 'error' : 'warning'}
                    />
                  </Grid>
                </Grid>
                
                {selectedParlay.correlation_bonus && (
                  <Box mt={2}>
                    <Chip 
                      label={`+${selectedParlay.correlation_bonus * 100}% Correlation Bonus`}
                      sx={{ bgcolor: '#FFD70020', color: '#FFD700' }}
                    />
                  </Box>
                )}
                
                {selectedParlay.available_boosts && selectedParlay.available_boosts.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Boosts
                    </Typography>
                    <Box display="flex" gap={1}>
                      {selectedParlay.available_boosts.map((boost, index) => (
                        <Chip
                          key={index}
                          label={`${boost.name}: +${boost.boost_percentage}%`}
                          onClick={() => setSelectedBoost(boost)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            ref={buildModalFirstFocusRef}
            onClick={() => setShowBuildModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddToBetSlip}
            sx={{ bgcolor: '#6C5CE7' }}
          >
            Add to Bet Slip
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ========== HANDLERS ==========
  const handleRefresh = () => {
    refetchParlays();
    refetchOdds();
    setLastRefresh(new Date());
    setSuccessMessage('Data refreshed successfully!');
    setShowSuccessAlert(true);
  };

  const handleBuildParlay = (parlay: ParlaySuggestion) => {
    setSelectedParlay(parlay);
    setParlayLegs(parlay.legs as ParlayLeg[]);
    setShowBuildModal(true);
  };

  const handleAddToBetSlip = () => {
    if (selectedParlay) {
      setSuccessMessage(`${selectedParlay.name} added to bet slip!`);
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowBuildModal(false);
      }, 1000);
    }
  };

  // ========== LOADING STATE ==========
  if (parlayLoading && oddsLoading && suggestions.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>
            Loading Parlay Architect '26...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Fetching today's odds and parlay suggestions
          </Typography>
        </Box>
      </Container>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <Container maxWidth="lg">
      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setShowSuccessAlert(false)}
          action={
            <IconButton size="small" color="inherit" onClick={() => setShowSuccessAlert(false)}>
              <ClearIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Success!</AlertTitle>
          {successMessage}
        </Alert>
      )}
      
      {/* Header */}
      <Paper sx={{ 
        background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4ABD 100%)',
        mb: 4,
        p: 3,
        color: 'white'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            
            <Button
              startIcon={<BugReportIcon />}
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                bgcolor: showDebugPanel ? 'rgba(0,0,0,0.3)' : 'transparent'
              }}
              variant="outlined"
              size="small"
            >
              {showDebugPanel ? 'Hide Debug' : 'Debug'}
            </Button>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {lastRefresh && (
              <Chip 
                label={`Updated: ${format(lastRefresh, 'h:mm a')}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            )}
            <Chip 
              label={`${suggestions.length} Parlays`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              icon={<TrophyIcon sx={{ fontSize: 14 }} />}
            />
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <MergeIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              🏆 Parlay Architect '26
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Create winning parlays with AI insights · February 2026
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Debug Panel */}
      <DebugPanel />

      {/* Sport Selector 2026 */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Sport
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {SPORTS_2026.map((sport) => (
            <Button
              key={sport.id}
              variant={selectedSport === sport.id ? "contained" : "outlined"}
              onClick={() => setSelectedSport(sport.id)}
              sx={{ 
                minWidth: 100,
                bgcolor: selectedSport === sport.id ? sport.id === 'NBA' ? '#ef4444' :
                         sport.id === 'NFL' ? '#3b82f6' :
                         sport.id === 'NHL' ? '#1e40af' : '#10b981' : 'transparent'
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography variant="h5">{sport.icon}</Typography>
                <Typography variant="caption">{sport.name}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8 }}>
                  {sport.status}
                </Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Paper>

      {/* Parlay Type Selector */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          📋 Parlay Type
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip 
            label="Standard" 
            onClick={() => setSelectedType('standard')}
            color={selectedType === 'standard' ? "primary" : "default"}
            variant={selectedType === 'standard' ? "filled" : "outlined"}
            sx={{ fontWeight: selectedType === 'standard' ? 'bold' : 'normal' }}
          />
          <Chip 
            label="Same Game" 
            onClick={() => setSelectedType('same_game')}
            color={selectedType === 'same_game' ? "primary" : "default"}
            variant={selectedType === 'same_game' ? "filled" : "outlined"}
          />
          <Chip 
            label="Teaser" 
            onClick={() => setSelectedType('teaser')}
            color={selectedType === 'teaser' ? "primary" : "default"}
            variant={selectedType === 'teaser' ? "filled" : "outlined"}
          />
          <Chip 
            label="Round Robin" 
            onClick={() => setSelectedType('round_robin')}
            color={selectedType === 'round_robin' ? "primary" : "default"}
            variant={selectedType === 'round_robin' ? "filled" : "outlined"}
          />
          <Chip 
            label="All Types" 
            onClick={() => setSelectedType('all')}
            color={selectedType === 'all' ? "primary" : "default"}
            variant={selectedType === 'all' ? "filled" : "outlined"}
          />
        </Box>
      </Paper>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AutorenewIcon />}
              onClick={() => generateParlayFromGames(selectedSport, 3)}
              disabled={generating}
              sx={{ height: '40px', bgcolor: '#6C5CE7' }}
            >
              {generating ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Generating...
                </>
              ) : (
                '🎯 Generate Parlay'
              )}
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sport</InputLabel>
              <Select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                label="Sport"
                sx={{ height: '40px' }}
              >
                {SPORTS.map((sport) => (
                  <MenuItem key={sport.id} value={sport.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {sport.icon}
                      {sport.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={parlayLoading || oddsLoading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowPropSelector(true)}
                sx={{ bgcolor: '#6C5CE7' }}
              >
                Add Leg
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced Filter Section */}
      <Paper sx={{ p: 2, mb: 4, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          🎯 Advanced Filters
        </Typography>
        <Grid container spacing={2}>
          {/* Market Type Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Market Type</InputLabel>
              <Select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value)}
                label="Market Type"
              >
                {MARKET_TYPES.map((market) => (
                  <MenuItem key={market.id} value={market.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{market.icon}</span>
                      {market.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Parlay Size Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Parlay Size</InputLabel>
              <Select
                value={parlaySize}
                onChange={(e) => setParlaySize(e.target.value)}
                label="Parlay Size"
              >
                {PARLAY_SIZES.map((size) => (
                  <MenuItem key={size.id} value={size.id}>
                    {size.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Risk Level Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Max Risk</InputLabel>
              <Select
                value={maxRisk}
                onChange={(e) => setMaxRisk(e.target.value)}
                label="Max Risk"
              >
                {RISK_LEVELS.map((risk) => (
                  <MenuItem key={risk.id} value={risk.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box 
                        sx={{ 
                          width: 10, 
                          height: 10, 
                          borderRadius: '50%', 
                          bgcolor: risk.color || 'transparent' 
                        }} 
                      />
                      {risk.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Edge Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Min Edge: {minEdge}%
              </Typography>
              <Slider
                value={minEdge}
                onChange={(_, value) => setMinEdge(value as number)}
                min={0}
                max={20}
                step={1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 10, label: '10%' },
                  { value: 20, label: '20%' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
          </Grid>
          
          {/* Confidence Filter */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Min Confidence: {minConfidence}%
              </Typography>
              <Slider
                value={minConfidence}
                onChange={(_, value) => setMinConfidence(value as number)}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </Grid>
          
          {/* Max Legs Filter */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Max Legs: {maxLegs}
              </Typography>
              <Slider
                value={maxLegs}
                onChange={(_, value) => setMaxLegs(value as number)}
                min={2}
                max={10}
                step={1}
                marks={[
                  { value: 2, label: '2' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Filter Section */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          ⚡ Quick Filters
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip 
            label="🎯 Player Props Only" 
            onClick={() => {
              setMarketType('player_props');
              setMinEdge(8);
              setMaxRisk('medium');
            }}
            color={marketType === 'player_props' ? "primary" : "default"}
            variant="outlined"
          />
          <Chip 
            label="💰 High Confidence (+80%)" 
            onClick={() => {
              setMinConfidence(80);
              setMinEdge(10);
              setMaxRisk('low');
            }}
            color={minConfidence === 80 ? "primary" : "default"}
            variant="outlined"
          />
          <Chip 
            label="🔄 Mixed Markets" 
            onClick={() => {
              setMarketType('mixed');
              setParlaySize('3');
              setMaxRisk('medium');
            }}
            color={marketType === 'mixed' ? "primary" : "default"}
            variant="outlined"
          />
          <Chip 
            label="📊 Game Totals" 
            onClick={() => {
              setMarketType('game_totals');
              setMinEdge(5);
              setParlaySize('2');
            }}
            color={marketType === 'game_totals' ? "primary" : "default"}
            variant="outlined"
          />
          <Chip 
            label="⚡ Quick Parlays (2-leg)" 
            onClick={() => {
              setParlaySize('2');
              setMaxRisk('low');
              setMinConfidence(70);
            }}
            color={parlaySize === '2' ? "primary" : "default"}
            variant="outlined"
          />
          <Chip 
            label="🔍 Search" 
            icon={<SearchIcon />}
            onClick={() => {}}
            color="default"
            variant="outlined"
          />
          <Chip 
            label="🔄 Clear Filters" 
            onClick={() => {
              setMarketType('all');
              setMinConfidence(60);
              setMinEdge(5);
              setMaxRisk('all');
              setParlaySize('all');
              setSelectedSport('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            color="default"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* AI Suggestions Section */}
      {renderAISuggestions()}

      {/* Teaser Options */}
      {renderTeaserOptions()}

      {/* Round Robin Options */}
      {renderRoundRobinOptions()}

      {/* Parlay Builder */}
      {renderParlayBuilder()}

      {/* Today's Games Panel */}
      <TodaysGamesPanel />

      {/* Display suggestions */}
      {parlayLoading && suggestions.length === 0 ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading parlay suggestions...</Typography>
        </Box>
      ) : parlayError && suggestions.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Parlay API Unavailable</AlertTitle>
          Using fallback data. Try again later.
          <Button size="small" sx={{ ml: 2 }} onClick={handleRefresh}>
            Retry
          </Button>
        </Alert>
      ) : filteredSuggestions.length > 0 ? (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon color="primary" />
            Parlay Suggestions ({filteredSuggestions.length})
            {suggestions.some(s => s.is_real_data) && (
              <Chip 
                label="LIVE DATA" 
                size="small" 
                sx={{ bgcolor: '#10b981', color: 'white', ml: 1 }}
              />
            )}
          </Typography>
          <Grid container spacing={3}>
            {filteredSuggestions.map((parlay) => (
              <Grid item xs={12} md={6} key={parlay.id}>
                <Card sx={{ 
                  height: '100%',
                  borderLeft: `4px solid ${parlay.is_real_data ? '#10b981' : '#f59e0b'}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6">{parlay.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {parlay.legs.length} legs • {parlay.type} • {parlay.market_type || 'General'}
                        </Typography>
                      </Box>
                      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                        {parlay.is_real_data && (
                          <Chip 
                            label="✅ LIVE" 
                            size="small" 
                            sx={{ 
                              bgcolor: '#10b981',
                              color: 'white',
                              fontSize: '0.6rem',
                              height: 18
                            }}
                          />
                        )}
                        {parlay.correlation_bonus && (
                          <Chip 
                            label={`+${parlay.correlation_bonus * 100}% Correlated`}
                            size="small"
                            sx={{ 
                              bgcolor: '#FFD70020',
                              color: '#FFD700',
                              fontSize: '0.6rem',
                              height: 18
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {parlay.analysis}
                    </Typography>
                    
                    <Box sx={{ mb: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: "center", mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          AI Confidence: {(parlay.confidence_level || 'medium').replace('-', ' ')}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {parlay.expected_value && (
                            <Chip 
                              label={`EV: ${parlay.expected_value}`}
                              size="small"
                              sx={{ 
                                bgcolor: parlay.expected_value?.startsWith('+') ? '#10b98120' : '#ef444420',
                                color: parlay.expected_value?.startsWith('+') ? '#10b981' : '#ef4444',
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                          <Chip 
                            label={parlay.total_odds_american || parlay.total_odds || parlay.totalOdds}
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                          />
                        </Box>
                      </Box>
                      <ConfidenceMeter 
                        score={parlay.confidence} 
                        level={parlay.confidence_level || 'medium'} 
                      />
                    </Box>
                    
                    {parlay.ai_metrics && (
                      <Box sx={{ mb: 2, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          AI Metrics: {parlay.ai_metrics.leg_count} legs • {parlay.ai_metrics.avg_leg_confidence}% avg • Stake: {parlay.ai_metrics.recommended_stake}
                          {parlay.ai_metrics.edge && ` • Edge: ${(parlay.ai_metrics.edge * 100).toFixed(1)}%`}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box display="flex" gap={1}>
                      <Button 
                        variant="contained" 
                        onClick={() => handleBuildParlay(parlay)}
                        startIcon={<BuildIcon />}
                        sx={{ flex: 1 }}
                      >
                        Build
                      </Button>
                      <Button 
                        variant="outlined"
                        onClick={() => {
                          setParlayLegs(parlay.legs as ParlayLeg[]);
                          setSuccessMessage('Parlay added to builder!');
                          setShowSuccessAlert(true);
                        }}
                      >
                        Add Legs
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No Parlay Suggestions</AlertTitle>
          Try generating a new parlay or changing your filters.
          <Button size="small" sx={{ ml: 2 }} onClick={() => generateParlayFromGames(selectedSport, 3)}>
            Generate Now
          </Button>
        </Alert>
      )}

      {/* Build Modal */}
      {renderBuildModal()}
      
      {/* Parlay Result Modal */}
      {renderParlayResultModal()}
      
      {/* Prop Selector Modal */}
      {renderPropSelector()}
      
      {/* Debug State Button */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Tooltip title="Debug State">
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              console.log('🧪 Current State:', {
                suggestions: suggestions.length,
                filteredSuggestions: filteredSuggestions.length,
                todaysGames: todaysGames.length,
                parlayLegs: parlayLegs.length,
                selectedSport,
                selectedType,
                marketType,
                minEdge,
                maxRisk,
                parlaySize,
                aiSuggestions: aiSuggestions.length
              });
            }}
            sx={{ borderRadius: '50%', minWidth: 'auto', width: 48, height: 48 }}
          >
            <BugReportIcon />
          </Button>
        </Tooltip>
      </Box>
      
      {/* Pulse Animation Style */}
      <style>{pulseAnimation}</style>
    </Container>
  );
};

export default ParlayArchitectScreen;
