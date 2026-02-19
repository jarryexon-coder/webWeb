// src/pages/DailyPicksScreen.tsx - FULLY INTEGRATED WITH PARLAY FEATURES AND AI GENERATOR
// Updated: Added filters for top value picks and improved prompt relevance
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Badge,
  Tooltip,
  alpha,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Select,
  MenuItem,
  Modal,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider
} from '@mui/material';
import {
  Shield as ShieldIcon,
  ArrowBack,
  Search,
  CalendarToday,
  SportsBasketball,
  SportsFootball,
  SportsHockey,
  SportsBaseball,
  TrendingUp,
  AttachMoney,
  Analytics,
  BarChart,
  CheckCircle,
  Lock,
  BookmarkBorder,
  Info,
  Bolt,
  Refresh,
  Close,
  AutoAwesome,
  EmojiEvents,
  Schedule,
  ExpandMore,
  BugReport,
  Today,
  SportsSoccer,
  Gamepad,
  Loop,
  ShowChart,
  CheckCircleOutline,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDailyPicks } from '../hooks/useUnifiedAPI';

// ============================================
// TYPES
// ============================================
interface Pick {
  id: string;
  player: string;
  team: string;
  position?: string;
  sport: string;
  stat?: string;
  line?: number;
  projection?: number;
  confidence: number;
  odds?: number | string;
  edge?: string;
  edge_percentage?: number;
  analysis: string;
  timestamp: string;
  category: string;
  probability?: string;
  roi?: string;
  units?: string;
  requiresPremium: boolean;
  value?: string;
  bookmaker?: string;
  generatedFrom?: string;
  isToday?: boolean;
}

interface ParlayLeg {
  player?: string;
  team?: string;
  market: string;
  line?: number;
  odds: number | string;
}

interface Parlay {
  id: string;
  type: 'same_game_parlay' | 'teaser' | 'round_robin';
  game?: string;
  legs: ParlayLeg[];
  total_odds: string | number;
  confidence: number;
  analysis?: string;
  correlation_score?: number;
}

interface SportOption {
  id: string;
  name: string;
  icon: keyof typeof SPORT_ICONS;
  leagues: string[];
}

interface MarketType {
  id: string;
  name: string;
  icon: keyof typeof MARKET_ICONS;
}

// ============================================
// CONSTANTS
// ============================================
const SPORT_ICONS = {
  nba: SportsBasketball,
  nfl: SportsFootball,
  mlb: SportsBaseball,
  nhl: SportsHockey,
  ufc: Bolt,
  soccer: SportsSoccer
};

const MARKET_ICONS = {
  standard: BarChart,
  same_game: Gamepad,
  teaser: ExpandMore,
  round_robin: Loop
};

const SPORTS: SportOption[] = [
  { id: 'nba', name: 'NBA', icon: 'nba', leagues: ['nba'] },
  { id: 'nfl', name: 'NFL', icon: 'nfl', leagues: ['nfl'] },
  { id: 'mlb', name: 'MLB', icon: 'mlb', leagues: ['mlb'] },
  { id: 'nhl', name: 'NHL', icon: 'nhl', leagues: ['nhl'] },
  { id: 'ufc', name: 'UFC', icon: 'ufc', leagues: ['ufc'] },
  { id: 'soccer', name: 'Soccer', icon: 'soccer', leagues: ['uefa_champions', 'epl', 'laliga'] },
];

const MARKET_TYPES: MarketType[] = [
  { id: 'standard', name: 'Standard', icon: 'standard' },
  { id: 'same_game', name: 'Same Game Parlay', icon: 'same_game' },
  { id: 'teaser', name: 'Teaser', icon: 'teaser' },
  { id: 'round_robin', name: 'Round Robin', icon: 'round_robin' },
];

const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981',
  SOCCER: '#8b5cf6',
  UFC: '#dc2626'
};

const CATEGORY_COLORS = {
  'High Confidence': '#10b981',
  'Value Bet': '#3b82f6',
  'Lock Pick': '#f59e0b',
  'High Upside': '#8b5cf6',
  'AI Generated': '#ec4899',
  'Premium Pick': '#f59e0b'
};

const CONFIDENCE_COLORS = {
  80: '#22c55e',
  70: '#eab308',
  60: '#f97316',
  default: '#6b7280'
};

const USEFUL_PROMPTS = [
  {
    category: 'Team Performance',
    prompts: [
      "Show Lakers home vs away stats",
      "Compare Warriors offense vs defense",
      "Best shooting teams this season",
      "Teams with best defense",
      "Highest scoring teams recently",
    ]
  },
  {
    category: 'Player Insights',
    prompts: [
      "Top scorers this month",
      "Players with best shooting %",
      "Assist leaders per game",
      "Rebound trends by position",
      "Players improving this season",
    ]
  },
  {
    category: 'Game Trends',
    prompts: [
      "High scoring games this week",
      "Games with close scores",
      "Overtime frequency by team",
      "Home advantage statistics",
      "Trends in 3-point shooting",
    ]
  },
  {
    category: 'Advanced Metrics',
    prompts: [
      "Team efficiency ratings",
      "Player usage rates",
      "Defensive rating leaders",
      "Offensive pace analysis",
      "Turnover to assist ratio",
    ]
  },
  {
    category: 'Prediction Analysis',
    prompts: [
      "Predict next game outcomes",
      "AI betting recommendations",
      "Value picks for tonight",
      "Player prop predictions",
      "Over/under analysis"
    ]
  }
];

// Team name mappings for better keyword matching
const TEAM_MAPPINGS: Record<string, string[]> = {
  'lakers': ['lakers', 'la lakers', 'los angeles lakers'],
  'warriors': ['warriors', 'golden state', 'gsw'],
  'celtics': ['celtics', 'boston', 'bos'],
  'bucks': ['bucks', 'milwaukee', 'mil'],
  'suns': ['suns', 'phoenix', 'phx'],
  'nuggets': ['nuggets', 'denver', 'den'],
  'mavericks': ['mavericks', 'dallas', 'dal'],
  'heat': ['heat', 'miami', 'mia'],
  'sixers': ['sixers', 'philadelphia', 'phi'],
  'knicks': ['knicks', 'new york', 'nyk'],
  // add more as needed
};

// ============================================
// MAIN COMPONENT
// ============================================
const DailyPicksScreen = () => {
  const navigate = useNavigate();
  
  // State management
  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedMarket, setSelectedMarket] = useState('standard');
  const [picks, setPicks] = useState<Pick[]>([]);
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [filteredPicks, setFilteredPicks] = useState<Pick[]>([]);
  const [filteredParlays, setFilteredParlays] = useState<Parlay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFreshness, setDataFreshness] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);
  
  // Filter state for top value picks
  const [filterStat, setFilterStat] = useState<string>('all');
  const [filterConfidence, setFilterConfidence] = useState<string>('all');
  const [filterEdge, setFilterEdge] = useState<number>(0); // minimum edge percentage
  
  // UI State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [selectedParlay, setSelectedParlay] = useState<Parlay | null>(null);
  const [showPickDetail, setShowPickDetail] = useState(false);
  const [showParlayModal, setShowParlayModal] = useState(false);
  
  // Prompt category
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Team Performance');

  // Use the custom hook for data fetching
  const { 
    data: picksData, 
    isLoading: hookLoading, 
    error: apiError, 
    refetch 
  } = useDailyPicks();

  // Fetch picks when filters change
  useEffect(() => {
    fetchPicks();
  }, [selectedSport, selectedMarket]);

  const fetchPicks = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call – replace with real endpoint
      const response = await new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            picks: picksData?.picks || [],
            parlays: generateSampleParlays(),
            timestamp: new Date().toISOString(),
            data_sources: ['The Odds API', 'SportsData', 'Balldontlie']
          });
        }, 500);
      });

      if (response.success) {
        transformAndSetData(response);
        setDataFreshness(response.timestamp);
        setDataSources(response.data_sources || []);
      } else {
        setError('Failed to load picks');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching picks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSampleParlays = (): Parlay[] => {
    return [
      {
        id: 'parlay-1',
        type: 'same_game_parlay',
        game: 'Lakers vs Warriors',
        legs: [
          { player: 'LeBron James', market: 'Points', line: 25.5, odds: -110 },
          { player: 'Stephen Curry', market: '3PT Made', line: 4.5, odds: -115 },
          { player: 'Anthony Davis', market: 'Rebounds', line: 11.5, odds: -105 }
        ],
        total_odds: '+450',
        confidence: 78,
        correlation_score: 85,
        analysis: 'Strong correlation between LeBron points and Davis rebounds when playing together. Curry averages 4.8 3PT at home.'
      },
      {
        id: 'parlay-2',
        type: 'teaser',
        game: 'Bills vs Chiefs',
        legs: [
          { team: 'Bills', market: 'Spread', line: 7.5, odds: -110 },
          { team: 'Chiefs', market: 'Total', line: 54.5, odds: -110 }
        ],
        total_odds: '-120',
        confidence: 72,
        analysis: 'Teasing Bills through key numbers 3 and 7. Chiefs total adjusted for weather conditions.'
      }
    ];
  };

  const transformAndSetData = (responseData: any) => {
    const transformedPicks = (responseData.picks || []).map((apiPick: any, index: number) => ({
      id: apiPick.id || `pick-${Date.now()}-${index}`,
      player: apiPick.player || apiPick.name || `Player ${index + 1}`,
      team: apiPick.team || 'TBD',
      position: apiPick.position,
      sport: apiPick.sport || selectedSport.toUpperCase(),
      stat: apiPick.stat,
      line: apiPick.line,
      projection: apiPick.projection,
      confidence: apiPick.confidence || Math.floor(Math.random() * 30) + 70,
      odds: apiPick.odds || '+150',
      edge: apiPick.edge || apiPick.expectedValue || `+${Math.floor(Math.random() * 15) + 5}%`,
      edge_percentage: apiPick.edge_percentage,
      analysis: apiPick.analysis || apiPick.reason || 'Based on advanced analytics and matchup data.',
      timestamp: apiPick.timestamp || new Date().toLocaleString(),
      category: apiPick.category || getCategoryFromConfidence(apiPick.confidence),
      probability: apiPick.probability || `${Math.floor(Math.random() * 30) + 70}%`,
      roi: apiPick.roi || `+${Math.floor(Math.random() * 40) + 10}%`,
      units: apiPick.units || (Math.random() * 2 + 1).toFixed(1),
      requiresPremium: apiPick.requiresPremium || false,
      value: apiPick.value,
      bookmaker: apiPick.bookmaker,
      isToday: true
    }));

    setPicks(transformedPicks);
    setParlays(responseData.parlays || []);
    setLastRefresh(new Date());
  };

  const getCategoryFromConfidence = (confidence: number): string => {
    if (confidence >= 90) return 'High Confidence';
    if (confidence >= 85) return 'Value Bet';
    if (confidence >= 80) return 'Lock Pick';
    return 'High Upside';
  };

  // Combined filtering for picks: sport, search, stat, confidence, edge
  useEffect(() => {
    let filtered = [...picks];
    
    // Sport filter
    if (selectedSport !== 'All') {
      filtered = filtered.filter(pick => 
        pick.sport.toLowerCase() === selectedSport.toLowerCase()
      );
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(pick =>
        (pick.player || '').toLowerCase().includes(lowerQuery) ||
        (pick.team || '').toLowerCase().includes(lowerQuery) ||
        (pick.sport || '').toLowerCase().includes(lowerQuery) ||
        (pick.stat || '').toLowerCase().includes(lowerQuery)
      );
    }
    
    // Stat filter
    if (filterStat !== 'all') {
      filtered = filtered.filter(pick => 
        pick.stat?.toLowerCase() === filterStat.toLowerCase()
      );
    }
    
    // Confidence filter
    if (filterConfidence !== 'all') {
      filtered = filtered.filter(pick => {
        if (filterConfidence === 'high') return pick.confidence >= 80;
        if (filterConfidence === 'medium') return pick.confidence >= 60 && pick.confidence < 80;
        if (filterConfidence === 'low') return pick.confidence < 60;
        return true;
      });
    }
    
    // Edge filter
    if (filterEdge > 0) {
      filtered = filtered.filter(pick => {
        const edgeVal = pick.edge_percentage || parseFloat(pick.edge?.replace('%', '').replace('+', '')) || 0;
        return edgeVal >= filterEdge;
      });
    }
    
    setFilteredPicks(filtered);
  }, [picks, selectedSport, searchQuery, filterStat, filterConfidence, filterEdge]);

  // Filter parlays separately (unchanged)
  useEffect(() => {
    let filtered = [...parlays];
    
    if (selectedSport !== 'All') {
      filtered = filtered.filter(parlay => 
        parlay.game?.toLowerCase().includes(selectedSport.toLowerCase())
      );
    }
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(parlay =>
        parlay.game?.toLowerCase().includes(lowerQuery) ||
        parlay.legs.some(leg => 
          leg.player?.toLowerCase().includes(lowerQuery) ||
          leg.team?.toLowerCase().includes(lowerQuery)
        )
      );
    }
    
    setFilteredParlays(filtered);
  }, [parlays, selectedSport, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPicks(true);
    setLastRefresh(new Date());
  }, []);

  // Utility functions
  const formatOdds = (odds: number | string | undefined): string => {
    if (!odds) return '';
    if (typeof odds === 'string') return odds;
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getRecommendationColor = (confidence: number): string => {
    if (confidence >= 80) return CONFIDENCE_COLORS[80];
    if (confidence >= 70) return CONFIDENCE_COLORS[70];
    if (confidence >= 60) return CONFIDENCE_COLORS[60];
    return CONFIDENCE_COLORS.default;
  };

  const getImpliedProbability = (odds: number): number => {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  };

  const calculateWinnings = (odds: string | number, betAmount: number = 100): number => {
    if (typeof odds === 'string') {
      const parsedOdds = parseInt(odds);
      if (parsedOdds > 0) {
        return betAmount * (parsedOdds / 100);
      } else {
        return betAmount * (100 / Math.abs(parsedOdds));
      }
    }
    return 0;
  };

  // Handlers
  const handleTrackPick = (pick: Pick) => {
    if (pick.requiresPremium && !hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedPick(pick);
    setShowPickDetail(true);
  };

  const handleParlaySelect = (parlay: Parlay) => {
    setSelectedParlay(parlay);
    setShowParlayModal(true);
  };

  const addToBetSlip = (item: Pick | Parlay) => {
    console.log('Added to bet slip:', item);
  };

// ============================================
// IMPROVED GENERATE HANDLER (with synonym mapping & game parsing)
// ============================================
const handleGenerateCustomPicks = async () => {
  if (!customPrompt.trim()) return;

  setGenerating(true);
  setShowGeneratingModal(true);
  console.log('🚀 Generating picks for prompt:', customPrompt);

  try {
    const timestamp = Date.now();
    const endpoint = `https://pleasing-determination-production.up.railway.app/api/prizepicks/selections?sport=${selectedSport}&_t=${timestamp}`;
    console.log('📡 Calling endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API response:', data);

    const selections = data.selections || [];
    if (selections.length === 0) {
      // Fallback mock pick (keep your existing mock)
      const mockPick: Pick = { /* ... your existing mock pick ... */ };
      setPicks(prev => [mockPick, ...prev]);
      setCustomPrompt('');
      setTimeout(() => {
        setGenerating(false);
        setShowGeneratingModal(false);
      }, 1500);
      return;
    }

    // ---------- 1. TEAM MAPPINGS (full NBA + abbreviations) ----------
    const TEAM_MAPPINGS: Record<string, string[]> = {
      // Full names → aliases & abbreviations
      lakers: ['la lakers', 'los angeles lakers', 'lal'],
      warriors: ['golden state warriors', 'gs', 'gsw'],
      celtics: ['boston celtics', 'bos'],
      bucks: ['milwaukee bucks', 'mil'],
      bulls: ['chicago bulls', 'chi'],
      cavaliers: ['cleveland cavaliers', 'cle'],
      clippers: ['la clippers', 'los angeles clippers', 'lac'],
      grizzlies: ['memphis grizzlies', 'mem'],
      hawks: ['atlanta hawks', 'atl'],
      heat: ['miami heat', 'mia'],
      hornets: ['charlotte hornets', 'cha'],
      jazz: ['utah jazz', 'uta'],
      kings: ['sacramento kings', 'sac'],
      knicks: ['new york knicks', 'nyk'],
      magic: ['orlando magic', 'orl'],
      mavericks: ['dallas mavericks', 'dal'],
      nets: ['brooklyn nets', 'bkn'],
      nuggets: ['denver nuggets', 'den'],
      pacers: ['indiana pacers', 'ind'],
      pelicans: ['new orleans pelicans', 'no', 'nop'],
      pistons: ['detroit pistons', 'det'],
      raptors: ['toronto raptors', 'tor'],
      rockets: ['houston rockets', 'hou'],
      sixers: ['philadelphia 76ers', 'phi'],
      spurs: ['san antonio spurs', 'sas'],
      suns: ['phoenix suns', 'phx'],
      thunder: ['oklahoma city thunder', 'okc'],
      timberwolves: ['minnesota timberwolves', 'min'],
      trailblazers: ['portland trail blazers', 'por'],
      wizards: ['washington wizards', 'was'],
    };

    // ---------- 2. SYNONYM MAPPING (for generic stat terms) ----------
    const SYNONYM_MAP: Record<string, string[]> = {
      scorers: ['points', 'scoring'],
      rebounders: ['rebounds', 'rebounding'],
      assists: ['assists', 'assist'],
      threes: ['three pointers', '3pt', 'three point'],
      blocks: ['blocks', 'blocked'],
      steals: ['steals', 'steal'],
      stats: ['points', 'rebounds', 'assists', 'steals', 'blocks'], // generic fallback
      // add more as needed
    };

    // ---------- 3. STOP WORDS (expanded) ----------
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'with', 'by', 'about', 'as', 'of', 'from', 'top', 'this', 'that',
      'these', 'those', 'it', 'its', 'my', 'your', 'our', 'their', 'what',
      'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
      'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'month', 'day',
      'week', 'year', 'today', 'yesterday', 'tomorrow', 'predictions', 'prop',
      'props', 'player', 'players', 'game', 'games', 'stats', 'stat' // added generic sports words
    ]);

    // ---------- 4. KEYWORD EXTRACTION & EXPANSION ----------
    let keywords = customPrompt.toLowerCase()
      .split(/\W+/)                     // split on non-word characters
      .filter(word => word.length > 2 && !stopWords.has(word));

    const expandedKeywords = new Set<string>();
    keywords.forEach(kw => {
      expandedKeywords.add(kw);
      // Team mappings
      if (TEAM_MAPPINGS[kw]) {
        TEAM_MAPPINGS[kw].forEach(alias => expandedKeywords.add(alias));
      }
      // Synonym mappings
      if (SYNONYM_MAP[kw]) {
        SYNONYM_MAP[kw].forEach(syn => expandedKeywords.add(syn));
      }
    });
    keywords = Array.from(expandedKeywords);
    console.log('🔍 Expanded keywords:', keywords);

    // If no keywords remain, fallback
    if (keywords.length === 0) keywords.push('nba', 'player');

// ---- Score each selection by keyword matches (whole‑word aware) ----
const scoredSelections = selections.map((sel: any) => {
  const searchable = [
    sel.player,
    sel.stat,
    sel.stat_type,
    sel.game,
    sel.analysis,
    sel.team,
  ].filter(Boolean).map((s) => String(s).toLowerCase());

  // Add individual words from game (e.g., "Lakers", "Warriors")
  if (sel.game) {
    const gameWords = sel.game.toLowerCase().split(/\W+/);
    searchable.push(...gameWords);
  }

  // Helper: does a field contain the keyword as a whole word?
  const fieldMatches = (field: string, keyword: string): boolean => {
    if (keyword.includes(' ')) {
      // Multi‑word keyword: check for exact phrase
      return field.includes(keyword);
    } else {
      // Single word: must appear as a separate word
      // Split field into words on non‑word characters
      const words = field.split(/\W+/);
      return words.includes(keyword);
    }
  };

  let score = 0;
  keywords.forEach(keyword => {
    searchable.forEach(field => {
      if (fieldMatches(field, keyword)) {
        score += 1;
      }
    });
  });
  return { sel, score };
});

    // Sort by score descending
    scoredSelections.sort((a, b) => b.score - a.score);

    const highestScore = scoredSelections[0]?.score || 0;
    let picksToShow;
    let analysisNote;

    if (highestScore === 0) {
      // No matches – fall back to highest confidence
      scoredSelections.sort((a, b) => {
        const confA = a.sel.confidence || 0;
        const confB = b.sel.confidence || 0;
        return confB - confA;
      });
      picksToShow = scoredSelections.slice(0, 20).map(item => item.sel);
      analysisNote = `⚠️ No picks matched "${customPrompt}". Showing top value picks by confidence.`;
    } else {
      picksToShow = scoredSelections.slice(0, 20).map(item => item.sel);
      analysisNote = `✅ Showing top ${picksToShow.length} picks most relevant to "${customPrompt}".`;
    }

    console.log(`🔍 Top selection score: ${highestScore}, showing ${picksToShow.length} picks`);

    // ---------- 6. TRANSFORM TO PICK OBJECTS (unchanged) ----------
    const newPicks: Pick[] = picksToShow.map((sel: any, index: number) => {
      let confidenceValue = 70;
      if (typeof sel.confidence === 'number') {
        confidenceValue = Math.min(100, Math.max(0, sel.confidence));
      } else if (typeof sel.confidence === 'string') {
        const lower = sel.confidence.toLowerCase();
        if (lower === 'high') confidenceValue = 85;
        else if (lower === 'medium') confidenceValue = 70;
        else if (lower === 'low') confidenceValue = 55;
      }

      const category =
        confidenceValue >= 85 ? 'High Confidence' :
        confidenceValue >= 70 ? 'Value Bet' :
        confidenceValue >= 60 ? 'Lock Pick' : 'High Upside';

      const baseAnalysis = sel.analysis || `AI‑generated pick based on: "${customPrompt}"`;
      const finalAnalysis = index === 0 && analysisNote
        ? `${analysisNote}\n\n${baseAnalysis}`
        : baseAnalysis;

      return {
        id: `gen-${Date.now()}-${index}`,
        player: sel.player || 'Unknown Player',
        team: sel.team || (sel.game ? sel.game.split(' ')[0] : 'TBD'),
        sport: selectedSport.toUpperCase(),
        stat: sel.stat || sel.stat_type,
        line: sel.line,
        projection: sel.projection,
        confidence: confidenceValue,
        odds: sel.odds || '+100',
        edge: sel.edge ? `+${sel.edge}%` : sel.edge_percentage ? `+${sel.edge_percentage}%` : '+5%',
        edge_percentage: sel.edge || sel.edge_percentage || 5,
        analysis: finalAnalysis,
        timestamp: 'Just now',
        category,
        probability: sel.probability || `${Math.floor(confidenceValue)}%`,
        roi: sel.roi || `+${Math.floor(Math.random() * 20) + 10}%`,
        units: (Math.random() * 2 + 1).toFixed(1),
        requiresPremium: false,
        value: sel.value || `${sel.edge || 5}% edge`,
        bookmaker: sel.bookmaker || 'The Odds API',
        generatedFrom: customPrompt,
        isToday: true,
      };
    });

    setPicks((prev) => [...newPicks, ...prev]);
    setCustomPrompt('');

    setTimeout(() => {
      setGenerating(false);
      setShowGeneratingModal(false);
    }, 1500);

  } catch (error) {
    console.error('❌ Error generating picks:', error);
    // Fallback mock pick (keep your existing fallback)
    const fallbackPick: Pick = { /* ... your existing fallback ... */ };
    setPicks(prev => [fallbackPick, ...prev]);
    setCustomPrompt('');
    setGenerating(false);
    setShowGeneratingModal(false);
  }
};
          
  // Confidence Badge Component
  const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
    const color = getRecommendationColor(confidence);
          
    return (
      <Chip
        label={`${confidence}% Confidence`}
        size="small"
        sx={{
          bgcolor: `${color}20`,
          color: color,
          fontWeight: 'bold',
          border: 'none'
        }}
      />
    );
  };
      
  // Freshness Indicator Component
  const renderFreshnessIndicator = () => {
    if (!dataFreshness) return null;
        
    const freshnessDate = new Date(dataFreshness);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - freshnessDate.getTime()) / 60000);
    
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', display: 'flex', alignItems: 'center' }}>
        {diffMinutes < 5 ? (
          <CheckCircleOutline sx={{ color: '#10b981', mr: 1 }} />
        ) : (
          <Schedule sx={{ color: '#f59e0b', mr: 1 }} />
        )}
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          Data updated {diffMinutes} minutes ago
        </Typography>
        {dataSources.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {dataSources.map((source, index) => (
              <Tooltip key={source} title={source}>
                <Chip
                  label={source.split('-').map(s => s[0]).join('').toUpperCase()}
                  size="small"
                  sx={{ bgcolor: 'grey.200' }}
                />
              </Tooltip>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  // Debug Panel Component
  const DebugPanel = () => {
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
              <BugReport fontSize="small" />
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
                  • Standard Picks: {picks.length}
                </Typography>
                <Typography variant="body2">
                  • Parlays: {parlays.length}
                </Typography>
                <Typography variant="body2">
                  • Selected Market: {selectedMarket}
                </Typography>
                <Typography variant="body2">
                  • Selected Sport: {selectedSport}
                </Typography>
                <Typography variant="body2">
                  • Last Refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}
                </Typography>
                <Typography variant="body2">
                  • Loading: {loading ? 'Yes' : 'No'}
                </Typography>
                <Typography variant="body2">
                  • Filter Stat: {filterStat}
                </Typography>
                <Typography variant="body2">
                  • Filter Confidence: {filterConfidence}
                </Typography>
                <Typography variant="body2">
                  • Filter Edge Min: {filterEdge}%
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="#94a3b8" gutterBottom>
                API Status
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">
                  • Daily Picks API: {apiError ? '❌ Error' : '✅ Connected'}
                </Typography>
                <Typography variant="body2">
                  • Data Sources: {dataSources.join(', ') || 'unknown'}
                </Typography>
                <Typography variant="body2">
                  • Freshness: {dataFreshness ? new Date(dataFreshness).toLocaleTimeString() : 'N/A'}
                </Typography>
              </Box>
              
              <Box mt={2}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: '#64748b', mr: 1 }}
                  onClick={handleRefresh}
                >
                  Force Refresh
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: '#64748b' }}
                  onClick={() => console.log('Debug state:', { 
                    picks, 
                    parlays, 
                    selectedMarket, 
                    selectedSport,
                    dataFreshness,
                    filterStat,
                    filterConfidence,
                    filterEdge
                  })}
                >
                  Log State
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {apiError && (
            <Alert severity="error" sx={{ mt: 2, bgcolor: '#7f1d1d' }}>
              <AlertTitle>API Error</AlertTitle>
              {String(apiError)}
            </Alert>
          )}
        </Paper>
      </Collapse>
    );
  };

  // Confidence Meter Component
  const ConfidenceMeter = ({ score, level }: { score: number; level: string }) => {
    const getLevelColor = (levelStr: string) => {
      const colors: Record<string, string> = {
        'very-high': '#10b981',
        'high': '#3b82f6',
        'medium': '#f59e0b',
        'low': '#ef4444',
        'very-low': '#dc2626'
      };
      return colors[levelStr] || '#64748b';
    };
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 80, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box 
            sx={{ 
              width: `${Math.min(score, 100)}%`,
              height: 8,
              bgcolor: getLevelColor(level)
            }}
          />
        </Box>
        <Typography variant="caption" fontWeight="bold" color={getLevelColor(level)}>
          {score}%
        </Typography>
      </Box>
    );
  };

  // Market Type Selector Component
  const renderMarketSelector = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Market Type
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
        {MARKET_TYPES.map((market) => {
          const Icon = MARKET_ICONS[market.icon];
          return (
            <Chip
              key={market.id}
              icon={<Icon />}
              label={market.name}
              onClick={() => setSelectedMarket(market.id)}
              color={selectedMarket === market.id ? 'primary' : 'default'}
              variant={selectedMarket === market.id ? 'filled' : 'outlined'}
              sx={{
                '& .MuiChip-icon': {
                  color: selectedMarket === market.id ? 'white' : 'inherit'
                }
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );

  // Sport Selector Component
  const renderSportSelector = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Sport
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 1 }}>
        <Chip
          label="All"
          onClick={() => setSelectedSport('All')}
          color={selectedSport === 'All' ? 'primary' : 'default'}
          variant={selectedSport === 'All' ? 'filled' : 'outlined'}
          sx={{ minWidth: 60 }}
        />
        {SPORTS.map((sport) => {
          const Icon = SPORT_ICONS[sport.icon];
          return (
            <Chip
              key={sport.id}
              icon={<Icon />}
              label={sport.name}
              onClick={() => setSelectedSport(sport.id)}
              color={selectedSport === sport.id ? 'primary' : 'default'}
              variant={selectedSport === sport.id ? 'filled' : 'outlined'}
              sx={{
                '& .MuiChip-icon': {
                  color: selectedSport === sport.id ? 'white' : 'inherit'
                }
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );

  // Filter Bar Component
  const renderFilterBar = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="subtitle2" color="text.secondary">
          Filter Picks
        </Typography>
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <Select
              value={filterStat}
              onChange={(e) => setFilterStat(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">All Stats</MenuItem>
              <MenuItem value="points">Points</MenuItem>
              <MenuItem value="assists">Assists</MenuItem>
              <MenuItem value="rebounds">Rebounds</MenuItem>
              <MenuItem value="threes">3PM</MenuItem>
              <MenuItem value="blocks">Blocks</MenuItem>
              <MenuItem value="steals">Steals</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <Select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">All Confidence</MenuItem>
              <MenuItem value="high">High (80%+)</MenuItem>
              <MenuItem value="medium">Medium (60‑79%)</MenuItem>
              <MenuItem value="low">Low (&lt;60%)</MenuItem>              
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              Edge ≥ {filterEdge}%
            </Typography>
            <Slider
              value={filterEdge}
              onChange={(_, val) => setFilterEdge(val as number)}
              step={1}
              marks
              min={0}
              max={20}
              valueLabelDisplay="auto"
              sx={{ flex: 1 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => {
              setFilterStat('all');
              setFilterConfidence('all');
              setFilterEdge(0);
            }}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  // Parlay Card Component
  const renderParlayCard = (parlay: Parlay) => {
    const ParlayIcon = MARKET_ICONS[parlay.type === 'same_game_parlay' ? 'same_game' : 
                                 parlay.type === 'teaser' ? 'teaser' : 'round_robin'];
    
    return (
      <Card 
        key={parlay.id} 
        sx={{ 
          mb: 3,
          borderLeft: 4,
          borderColor: getRecommendationColor(parlay.confidence),
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s'
          }
        }}
        onClick={() => handleParlaySelect(parlay)}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ParlayIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                {parlay.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Typography>
            </Box>
            <ConfidenceBadge confidence={parlay.confidence} />
          </Box>

          {/* Game Info */}
          {parlay.game && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {parlay.game}
            </Typography>
          )}

          {/* Correlation Score */}
          {parlay.correlation_score && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
              <ShowChart sx={{ color: '#10b981', fontSize: 16 }} />
              <Typography variant="caption" color="#10b981" fontWeight="bold">
                {parlay.correlation_score}% Correlation
              </Typography>
            </Box>
          )}

          {/* Legs Preview */}
          <Paper sx={{ bgcolor: 'grey.50', p: 2, mb: 2 }}>
            {parlay.legs.slice(0, 3).map((leg, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: index < parlay.legs.slice(0, 3).length - 1 ? 1 : 0
                }}
              >
                <Typography variant="body2">
                  {leg.player || leg.team} - {leg.market}
                  {leg.line && ` O${leg.line}`}
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {formatOdds(leg.odds)}
                </Typography>
              </Box>
            ))}
            {parlay.legs.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                +{parlay.legs.length - 3} more legs
              </Typography>
            )}
          </Paper>

          {/* Odds and Analysis */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Odds</Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {formatOdds(parlay.total_odds)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{ bgcolor: 'primary.main' }}
              onClick={(e) => {
                e.stopPropagation();
                addToBetSlip(parlay);
              }}
            >
              Add to Bet Slip
            </Button>
          </Box>

          {parlay.analysis && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {parlay.analysis}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  // Standard Pick Card Component
  const renderPickCard = (pick: Pick) => {
    const isPremiumLocked = pick.requiresPremium && !hasPremiumAccess;
    const confidenceColor = getRecommendationColor(pick.confidence);
    
    return (
      <Card 
        key={pick.id} 
        sx={{ 
          mb: 3,
          borderLeft: 4,
          borderColor: CATEGORY_COLORS[pick.category as keyof typeof CATEGORY_COLORS] || confidenceColor,
          cursor: 'pointer',
          opacity: isPremiumLocked ? 0.9 : 1,
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s'
          }
        }}
      >
        <CardContent onClick={() => handleTrackPick(pick)}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {pick.player}
                {pick.position && (
                  <Typography variant="caption" color="text.secondary">
                    {pick.position}
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {pick.team}
                </Typography>
                <Chip 
                  label={pick.sport}
                  size="small"
                  sx={{ 
                    bgcolor: `${SPORT_COLORS[pick.sport as keyof typeof SPORT_COLORS]}20`,
                    color: SPORT_COLORS[pick.sport as keyof typeof SPORT_COLORS],
                    fontWeight: 'bold'
                  }}
                />
                {pick.category && (
                  <Chip 
                    label={pick.category}
                    size="small"
                    sx={{ 
                      bgcolor: `${CATEGORY_COLORS[pick.category as keyof typeof CATEGORY_COLORS]}20`,
                      color: CATEGORY_COLORS[pick.category as keyof typeof CATEGORY_COLORS],
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConfidenceBadge confidence={pick.confidence} />
              {isPremiumLocked && (
                <Lock sx={{ color: 'text.secondary' }} />
              )}
            </Box>
          </Box>
          
          {/* Pick Details */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: isPremiumLocked ? 'text.secondary' : '#f59e0b', mb: 2 }}>
            {pick.stat ? `${pick.stat} ${pick.line ? `O${pick.line}` : ''}` : pick.pick}
          </Typography>
          
          {/* Key Stats */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              {pick.projection && (
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <BarChart sx={{ color: '#8b5cf6', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">Projection</Typography>
                    <Typography variant="body1" fontWeight="bold">{pick.projection}</Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ color: '#10b981', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">Edge</Typography>
                  <Typography variant="body1" fontWeight="bold" color="#10b981">
                    {pick.edge || (pick.edge_percentage ? `+${pick.edge_percentage}%` : 'N/A')}
                  </Typography>
                </Box>
              </Grid>
              {pick.odds && (
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AttachMoney sx={{ color: '#f59e0b', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">Odds</Typography>
                    <Typography variant="body1" fontWeight="bold">{formatOdds(pick.odds)}</Typography>
                    {pick.bookmaker && (
                      <Typography variant="caption" color="text.secondary">
                        {pick.bookmaker}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
          
          {/* Analysis */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Analytics sx={{ color: '#f59e0b', mr: 1, mt: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {isPremiumLocked ? '🔒 Premium analysis available with upgrade' : pick.analysis}
            </Typography>
          </Box>
          
          {/* Generated Info */}
          {pick.generatedFrom && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption">
                Generated from: "{pick.generatedFrom.substring(0, 50)}..."
              </Typography>
            </Alert>
          )}
          
          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {pick.timestamp}
            </Typography>
            <Button
              variant="contained"
              startIcon={<BookmarkBorder />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                addToBetSlip(pick);
              }}
              sx={{
                bgcolor: '#f59e0b',
                '&:hover': {
                  bgcolor: '#d97706'
                }
              }}
            >
              Track Pick
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Parlay Details Modal
  const ParlayDetailsModal = () => (
    <Dialog 
      open={showParlayModal} 
      onClose={() => setShowParlayModal(false)} 
      maxWidth="md" 
      fullWidth
    >
      {selectedParlay && (
        <>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                {selectedParlay.type === 'same_game_parlay' && <Gamepad sx={{ color: 'primary.main' }} />}
                {selectedParlay.type === 'teaser' && <ExpandMore sx={{ color: 'primary.main' }} />}
                {selectedParlay.type === 'round_robin' && <Loop sx={{ color: 'primary.main' }} />}
                <Typography variant="h6">
                  {selectedParlay.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Typography>
              </Box>
              <IconButton onClick={() => setShowParlayModal(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Game Info */}
              {selectedParlay.game && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedParlay.game}
                  </Typography>
                </Grid>
              )}

              {/* All Legs */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Legs ({selectedParlay.legs.length})
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {selectedParlay.legs.map((leg, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {leg.player || leg.team}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {leg.market} {leg.line && `O${leg.line}`}
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {formatOdds(leg.odds)}
                          </Typography>
                        </Box>
                        {index < selectedParlay.legs.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Payout Calculation */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payout Calculation
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Total Odds</Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {formatOdds(selectedParlay.total_odds)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">$100 Wins</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        ${calculateWinnings(selectedParlay.total_odds).toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Analysis */}
              {selectedParlay.analysis && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Analysis
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedParlay.analysis}
                      </Typography>
                      {selectedParlay.correlation_score && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                          <ShowChart sx={{ color: '#10b981', fontSize: 16 }} />
                          <Typography variant="caption" color="#10b981" fontWeight="bold">
                            {selectedParlay.correlation_score}% Correlation Score
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowParlayModal(false)}>Close</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                addToBetSlip(selectedParlay);
                setShowParlayModal(false);
              }}
            >
              Add to Bet Slip
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  // Pick Detail Modal
  const PickDetailModal = () => (
    <Dialog open={showPickDetail} onClose={() => setShowPickDetail(false)} maxWidth="md" fullWidth>
      {selectedPick && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: SPORT_COLORS[selectedPick.sport as keyof typeof SPORT_COLORS] || '#6b7280' }}>
                {selectedPick.player.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedPick.player}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPick.team} • {selectedPick.sport} {selectedPick.position && `• ${selectedPick.position}`}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h5" color="#f59e0b" fontWeight="bold">
                      {selectedPick.stat ? `${selectedPick.stat} ${selectedPick.line ? `O${selectedPick.line}` : ''}` : selectedPick.pick}
                    </Typography>
                    <Box mt={2}>
                      <ConfidenceMeter 
                        score={selectedPick.confidence} 
                        level={
                          selectedPick.confidence >= 90 ? 'very-high' :
                          selectedPick.confidence >= 85 ? 'high' :
                          selectedPick.confidence >= 80 ? 'medium' : 'low'
                        } 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Pick Details</Typography>
                    <Grid container spacing={2}>
                      {selectedPick.odds && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Odds</Typography>
                            <Typography variant="h6">{formatOdds(selectedPick.odds)}</Typography>
                            {selectedPick.bookmaker && (
                              <Typography variant="caption" color="text.secondary">
                                {selectedPick.bookmaker}
                              </Typography>
                            )}
                          </Grid>
                        </>
                      )}
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Edge</Typography>
                        <Typography variant="h6" color="#10b981">
                          {selectedPick.edge || (selectedPick.edge_percentage ? `+${selectedPick.edge_percentage}%` : 'N/A')}
                        </Typography>
                      </Grid>
                      {selectedPick.projection && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Projection</Typography>
                          <Typography variant="h6">{selectedPick.projection}</Typography>
                        </Grid>
                      )}
                      {selectedPick.value && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Value</Typography>
                          <Typography variant="h6" color="#f59e0b">{selectedPick.value}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Analysis</Typography>
                    <Typography variant="body2">
                      {selectedPick.analysis}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPickDetail(false)}>Close</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                addToBetSlip(selectedPick);
                setShowPickDetail(false);
              }}
            >
              Add to Bet Slip
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  // Loading State
  if (loading && !refreshing && picks.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
          <CircularProgress size={40} />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Loading daily picks...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Paper sx={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        mb: 4,
        p: 3,
        color: 'white'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            
            <Button
              startIcon={<BugReport />}
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
          
          {lastRefresh && (
            <Chip 
              label={`Last updated: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <CalendarToday sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Daily Picks
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              AI-curated selections with highest probability of success
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Debug Panel */}
      <DebugPanel />

      {/* Sport Selector */}
      {renderSportSelector()}

      {/* Market Type Selector */}
      {renderMarketSelector()}

      {/* Freshness Indicator */}
      {renderFreshnessIndicator()}

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AutoAwesome />}
              onClick={handleGenerateCustomPicks}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Custom Picks'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <TextField
                placeholder="Search picks..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 250 }}
              />
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Prompts Section */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            <AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />
            Quick Prompts
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Categories
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {USEFUL_PROMPTS.map((cat) => (
              <Chip
                key={cat.category}
                label={cat.category}
                onClick={() => setSelectedPromptCategory(cat.category)}
                color={selectedPromptCategory === cat.category ? 'primary' : 'default'}
                variant={selectedPromptCategory === cat.category ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Try one of these
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {USEFUL_PROMPTS.find(c => c.category === selectedPromptCategory)?.prompts.map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              onClick={() => {
                setCustomPrompt(prompt);
                setTimeout(() => handleGenerateCustomPicks(), 100);
              }}
              icon={<Search />}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Paper>

      {/* Filter Bar for Top Value Picks */}
      {renderFilterBar()}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
          <Button size="small" sx={{ ml: 2 }} onClick={handleRefresh}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Parlays Section */}
      {selectedMarket !== 'standard' && filteredParlays.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {selectedMarket === 'same_game' && '🎮 Same Game Parlays'}
            {selectedMarket === 'teaser' && '📊 Teaser Recommendations'}
            {selectedMarket === 'round_robin' && '🔄 Round Robin Combinations'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedMarket === 'same_game' && 'Correlated plays from the same game maximize value'}
            {selectedMarket === 'teaser' && 'Adjusted spreads with increased win probability'}
            {selectedMarket === 'round_robin' && 'Multiple parlay combinations for reduced risk'}
          </Typography>
          {filteredParlays.map(renderParlayCard)}
        </Box>
      )}

      {/* Standard Picks Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          ⭐ Top Value Picks {filteredPicks.length > 0 && `(${filteredPicks.length})`}
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : filteredPicks.length > 0 ? (
          filteredPicks.map(renderPickCard)
        ) : (
          <Alert severity="info">
            <AlertTitle>No Picks Found</AlertTitle>
            No picks match the current filters. Try adjusting your filters or sport selection.
          </Alert>
        )}
      </Box>

      {/* Custom Prompt Generator */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Generate Custom Picks
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Enter a prompt to generate custom picks (e.g., 'Best over bets tonight')..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleGenerateCustomPicks}
            disabled={!customPrompt.trim() || generating}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': {
                bgcolor: '#7c3aed'
              }
            }}
          >
            Generate
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Unlimited generations • Prompt keywords are expanded with team aliases for better matching.
        </Typography>
      </Paper>

      {/* Kalshi Prediction Markets Integration */}
      {selectedSport === 'nfl' && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 4, 
            bgcolor: 'grey.50',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'grey.100'
            }
          }}
          onClick={() => navigate('/prediction-markets')}
        >
          <ShowChart sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Prediction Markets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View real-time probabilities from Kalshi
            </Typography>
          </Box>
          <Button color="primary">View Markets</Button>
        </Paper>
      )}

      {/* Modals */}
      <ParlayDetailsModal />
      <PickDetailModal />

      {/* Upgrade Modal (for premium picks) */}
      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock sx={{ color: '#f59e0b' }} />
            <Typography variant="h6">Premium Pick</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This pick requires a premium subscription. Upgrade to access all premium content.
          </Typography>
          
          <Box sx={{ my: 3 }}>
            {[
              'Unlimited daily generations',
              'Premium picks & analysis',
              'Advanced AI models',
              'No daily limits',
              'Same game parlay recommendations',
              'Correlation scores & teaser analysis'
            ].map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="#10b981" gutterBottom>Generation Pack</Typography>
                  <Typography variant="h4" fontWeight="bold">$3.99</Typography>
                  <Typography variant="caption" color="text.secondary">10 extra generations</Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    sx={{ mt: 2, bgcolor: '#10b981' }}
                  >
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ borderColor: '#f59e0b', borderWidth: 2 }}>
                <CardContent>
                  <Typography variant="h6" color="#f59e0b" gutterBottom>Full Access</Typography>
                  <Typography variant="h4" fontWeight="bold">$14.99/mo</Typography>
                  <Typography variant="caption" color="text.secondary">Unlimited everything</Typography>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    sx={{ mt: 2, bgcolor: '#f59e0b' }}
                  >
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpgradeModal(false)}>Not Now</Button>
        </DialogActions>
      </Dialog>

      {/* Generating Modal */}
      <Dialog open={showGeneratingModal} onClose={() => !generating && setShowGeneratingModal(false)}>
        <DialogContent sx={{ textAlign: 'center', py: 4, px: 6 }}>
          {generating ? (
            <>
              <CircularProgress size={48} sx={{ color: '#f59e0b', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Generating AI Picks...</Typography>
              <Typography variant="body2" color="text.secondary">
                Fetching player props and filtering by your prompt
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Check the console for filtering details
              </Typography>
            </>
          ) : (
            <>
              <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" gutterBottom>Picks Generated!</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your custom AI picks have been added to the list.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setShowGeneratingModal(false)}
                sx={{ bgcolor: '#f59e0b' }}
              >
                View Results
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DailyPicksScreen;
