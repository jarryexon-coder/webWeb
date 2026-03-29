// src/pages/SecretPhraseScreen.tsx - FINAL VERSION with top 3 picks and duplicate prevention

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  Slider,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  SportsBasketball as SportsBasketballIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  SportsSoccer as SportsSoccerIcon,
  Info as InfoIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as SparklesIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  Lock as LockIcon,
  Send as SendIcon,
  EmojiEvents as EmojiEventsIcon,
  History as HistoryIcon,
  TrendingDown as TrendingDownIcon,
  Whatshot as WhatshotIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  CreditCard as CreditCardIcon,
  Shuffle as ShuffleIcon,
  FilterAlt as FilterAltIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ProtectedRoute from '../components/ProtectedRoute';
import { getAuth } from 'firebase/auth';

// ============================================
// CONSTANTS
// ============================================
const MAX_VISIBLE_PHRASES = 3; // Show only top 3 picks by default
const MAX_GENERATED_PICKS = 5; // Generate up to 5 additional picks
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// Helper function to get Firebase ID token
const getFirebaseIdToken = async (): Promise<string | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// ============================================
// TYPES
// ============================================

interface SecretPhrase {
  id: string;
  phrase: string;
  category: string;
  sport: string;
  confidence: number;
  source: string;
  game?: string;
  player?: string;
  team?: string;
  opponent?: string;
  stat?: string;
  line?: number;
  projection?: number;
  edge?: string;
  edge_percentage?: number;
  odds?: string;
  bookmaker?: string;
  type?: 'Over' | 'Under';
  timestamp: string;
  tags?: string[];
  analysis?: string;
  expiration?: string;
  is_mock?: boolean;
  generated_variation?: number; // Track which variation this is
}

interface ApiResponse {
  success: boolean;
  count: number;
  phrases: SecretPhrase[];
  scraped?: boolean;
  sources?: string[];
  cache_age?: number;
  cached?: boolean;
  filters_applied?: any;
  timestamp?: string;
  total_available?: number;
}

// ============================================
// MAIN CONTENT COMPONENT
// ============================================

const SecretPhraseContent: React.FC = () => {
  const theme = useTheme();
  const auth = getAuth();
  const user = auth.currentUser;

  // Subscription & Credits State
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [generatorCredits, setGeneratorCredits] = useState(0);
  const [plan, setPlan] = useState('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' | 'warning' });

  // State
  const [phrases, setPhrases] = useState<SecretPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiSource, setApiSource] = useState<string>('API');

  // Filters
  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTabCategory, setSelectedTabCategory] = useState('all');
  const [minConfidence, setMinConfidence] = useState(65);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Generator states
  const [generating, setGenerating] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');

  // Generator pagination states
  const [availablePhrases, setAvailablePhrases] = useState<SecretPhrase[]>([]);
  const [displayedPhrases, setDisplayedPhrases] = useState<SecretPhrase[]>([]);
  const [showMoreButton, setShowMoreButton] = useState(false);

  // Generated picks state
  const [generatedPicks, setGeneratedPicks] = useState<SecretPhrase[]>([]);
  const [showingGeneratedPicks, setShowingGeneratedPicks] = useState(false);
  const [generationVariation, setGenerationVariation] = useState(1);
  const [usedPlayerIds, setUsedPlayerIds] = useState<Set<string>>(new Set());

  // Secret phrase states
  const [phraseAnalytics, setPhraseAnalytics] = useState<any>(null);

  // Display options
  const [showAllPhrases, setShowAllPhrases] = useState(false);
  const [filteredPhrases, setFilteredPhrases] = useState<SecretPhrase[]>([]);

  // Variation strategies for generating unique responses
  const variationStrategies = [
    { name: 'High Confidence', weight: 0.4, filter: (p: SecretPhrase) => p.confidence >= 80 },
    { name: 'Positive Edge', weight: 0.3, filter: (p: SecretPhrase) => (p.edge_percentage || 0) > 5 },
    { name: 'Player Props', weight: 0.2, filter: (p: SecretPhrase) => p.stat !== undefined && p.player !== undefined },
    { name: 'Sharp Money', weight: 0.1, filter: (p: SecretPhrase) => p.category === 'sharp_money' },
  ];

  // ============================================
  // Helper: Get top picks with variation
  // ============================================
  const getTopPicksWithVariation = (phrases: SecretPhrase[], limit: number = 3, variation: number = 1): SecretPhrase[] => {
    if (!phrases.length) return [];
    
    // Create a copy to work with
    let availablePhrases = [...phrases];
    
    // Apply variation strategy based on variation number
    const strategyIndex = (variation - 1) % variationStrategies.length;
    const primaryStrategy = variationStrategies[strategyIndex];
    const secondaryStrategies = variationStrategies.filter((_, i) => i !== strategyIndex);
    
    let selectedPicks: SecretPhrase[] = [];
    let remainingLimit = limit;
    
    // First, try to get picks from primary strategy
    let primaryPicks = availablePhrases.filter(primaryStrategy.filter);
    
    // If primary strategy doesn't yield enough, add from secondary strategies
    if (primaryPicks.length < remainingLimit) {
      selectedPicks.push(...primaryPicks);
      remainingLimit -= primaryPicks.length;
      
      // Remove used picks
      const usedIds = new Set(selectedPicks.map(p => p.id));
      availablePhrases = availablePhrases.filter(p => !usedIds.has(p.id));
      
      // Try secondary strategies
      for (const strategy of secondaryStrategies) {
        if (remainingLimit <= 0) break;
        const strategyPicks = availablePhrases
          .filter(strategy.filter)
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, remainingLimit);
        
        selectedPicks.push(...strategyPicks);
        remainingLimit -= strategyPicks.length;
        
        const newUsedIds = new Set(strategyPicks.map(p => p.id));
        availablePhrases = availablePhrases.filter(p => !newUsedIds.has(p.id));
      }
    } else {
      // Sort primary picks by confidence and take top ones
      primaryPicks.sort((a, b) => b.confidence - a.confidence);
      selectedPicks = primaryPicks.slice(0, remainingLimit);
      remainingLimit = 0;
    }
    
    // If still need more picks, fill with highest confidence remaining
    if (remainingLimit > 0 && availablePhrases.length > 0) {
      const remainingPicks = availablePhrases
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, remainingLimit);
      selectedPicks.push(...remainingPicks);
    }
    
    // Add variation tracking
    return selectedPicks.map(pick => ({
      ...pick,
      generated_variation: variation
    }));
  };

  // ============================================
  // Helper: Get unique picks not in existing sets
  // ============================================
  const getUniquePicks = (
    sourcePhrases: SecretPhrase[], 
    excludeIds: Set<string>, 
    limit: number,
    variation: number
  ): SecretPhrase[] => {
    // Filter out already used picks
    const available = sourcePhrases.filter(p => !excludeIds.has(p.id));
    
    // Apply variation strategy to get diverse picks
    const strategyIndex = variation % variationStrategies.length;
    const strategy = variationStrategies[strategyIndex];
    
    // First try strategy-specific picks
    let strategyPicks = available.filter(strategy.filter);
    strategyPicks.sort((a, b) => b.confidence - a.confidence);
    
    let selected = strategyPicks.slice(0, limit);
    
    // If not enough, fill with highest confidence remaining
    if (selected.length < limit) {
      const usedSelectedIds = new Set(selected.map(p => p.id));
      const remaining = available.filter(p => !usedSelectedIds.has(p.id));
      const fillPicks = remaining
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit - selected.length);
      selected.push(...fillPicks);
    }
    
    return selected.map(pick => ({
      ...pick,
      generated_variation: variation
    }));
  };

  // ============================================
  // FETCH SUBSCRIPTION & CREDITS
  // ============================================
  const fetchSubscriptionAndCredits = useCallback(async () => {
    if (!user || !user.uid) return;

    try {
      const token = await getFirebaseIdToken();
      if (!token) return;

      const subResponse = await fetch(`${PYTHON_API_BASE}/api/subscriptions/my-subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subData = await subResponse.json();

      if (subData.success && subData.subscription) {
        const isActive = subData.subscription.status === 'active';
        setHasPremiumAccess(isActive);
        setPlan(subData.subscription.plan_id || 'free');
        setSubscriptionStatus(subData.subscription.status);
      }

      const profileResponse = await fetch(`${PYTHON_API_BASE}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileResponse.json();
      setGeneratorCredits(profileData.credits || 0);

    } catch (error) {
      console.error('Failed to fetch subscription/credits:', error);
    }
  }, [user]);

  // ============================================
  // STRIPE CHECKOUT FUNCTIONS
  // ============================================
  const handleSubscriptionCheckout = async (planId: string, interval: string = 'month') => {
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch(`${PYTHON_API_BASE}/api/subscriptions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, interval }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setSnackbar({ open: true, message: 'Failed to create checkout session', severity: 'error' });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setSnackbar({ open: true, message: 'Checkout error', severity: 'error' });
    }
  };

  const handleCreditsCheckout = async (credits: number) => {
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch(`${PYTHON_API_BASE}/api/generator/credits/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ credits }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setSnackbar({ open: true, message: 'Failed to create credits checkout', severity: 'error' });
      }
    } catch (error) {
      console.error('Credits checkout error:', error);
      setSnackbar({ open: true, message: 'Credits checkout error', severity: 'error' });
    }
  };

  // ============================================
  // ENHANCED PROMPTS
  // ============================================
  const SECRET_PHRASE_PROMPTS = [
    'Generate insider tips for tonight\'s NBA games',
    'Latest injury updates from team sources',
    'Breaking news from locker room insiders',
    'Team chemistry issues affecting performance',
    'Contract year players to watch',
    'Sharp money moves detected in last hour',
    'Steam moves on tonight\'s games',
    'Reverse line movement alerts',
    'Professional bettor positions to follow',
    'Biggest liability for sportsbooks tonight',
    'Players due for regression based on analytics',
    'Advanced metrics suggesting breakout candidates',
    'Underlying numbers that beat the market',
    'Predictive clustering analysis results',
    'Bayesian inference model predictions',
    'Most undervalued player props tonight',
    'Props where public money is wrong',
    'Best value props according to model',
    'Correlated prop opportunities',
    'Same game parlay building blocks'
  ];

  // ============================================
  // Helper: Format stat for display
  // ============================================
  const formatStatDisplay = (stat: string, type?: string, line?: number): string => {
    let formattedStat = String(stat || '').toLowerCase();
    
    if (formattedStat === 'pts' || formattedStat === 'points') formattedStat = 'Points';
    else if (formattedStat === 'reb' || formattedStat === 'rebounds') formattedStat = 'Rebounds';
    else if (formattedStat === 'ast' || formattedStat === 'assists') formattedStat = 'Assists';
    else if (formattedStat === 'stl' || formattedStat === 'steals') formattedStat = 'Steals';
    else if (formattedStat === 'blk' || formattedStat === 'blocks') formattedStat = 'Blocks';
    else if (formattedStat === 'three_pointers' || formattedStat === '3pm') formattedStat = '3PM';
    else formattedStat = stat.charAt(0).toUpperCase() + stat.slice(1);
    
    if (type && line) {
      const roundedLine = Math.round(line * 10) / 10;
      return `${formattedStat} ${type} ${roundedLine}`;
    }
    
    return formattedStat;
  };

  // ============================================
  // Generate enhanced mock phrases
  // ============================================
  const generateEnhancedMockPhrases = (sport: string): SecretPhrase[] => {
    const now = new Date().toISOString();
    const today = new Date().toLocaleDateString();
    
    const nbaMocks: SecretPhrase[] = [
      {
        id: `nba-mock-1-${Date.now()}`,
        phrase: `LeBron James over 25.5 points - strong matchup vs Bulls (${today})`,
        category: 'prop_value',
        sport: 'nba',
        confidence: 82,
        source: 'NBA Advanced Stats',
        player: 'LeBron James',
        team: 'Lakers',
        opponent: 'Bulls',
        stat: 'points',
        line: 25.5,
        projection: 27.8,
        edge: '+9%',
        edge_percentage: 9,
        odds: '-110',
        bookmaker: 'DraftKings',
        type: 'Over',
        timestamp: now,
        tags: ['points', 'lebron', 'value'],
        analysis: 'LeBron averages 28.2 vs Bulls in last 5 meetings'
      },
      {
        id: `nba-mock-2-${Date.now()}`,
        phrase: `Stephen Curry over 4.5 three-pointers - hot from deep (${today})`,
        category: 'prop_value',
        sport: 'nba',
        confidence: 78,
        source: 'ESPN Stats',
        player: 'Stephen Curry',
        team: 'Warriors',
        opponent: 'Kings',
        stat: 'three_pointers',
        line: 4.5,
        projection: 5.2,
        edge: '+15%',
        edge_percentage: 15,
        odds: '+120',
        bookmaker: 'FanDuel',
        type: 'Over',
        timestamp: now,
        tags: ['threes', 'curry', 'value'],
        analysis: 'Curry averaging 5.8 3PM at home this season'
      },
      {
        id: `nba-mock-3-${Date.now()}`,
        phrase: `Giannis Antetokounmpo double-double - lock of the night (${today})`,
        category: 'insider_tip',
        sport: 'nba',
        confidence: 88,
        source: 'Team Insider',
        player: 'Giannis Antetokounmpo',
        team: 'Bucks',
        opponent: 'Heat',
        stat: 'double_double',
        line: 1,
        projection: 0.85,
        edge: '+85%',
        edge_percentage: 85,
        odds: '-250',
        bookmaker: 'BetMGM',
        type: 'Over',
        timestamp: now,
        tags: ['giannis', 'lock', 'double-double'],
        analysis: 'Giannis has double-double in 12 of last 15 games'
      },
      {
        id: `nba-mock-4-${Date.now()}`,
        phrase: `Jokic triple-double props - sharp money coming in (${today})`,
        category: 'sharp_money',
        sport: 'nba',
        confidence: 85,
        source: 'Action Network',
        player: 'Nikola Jokic',
        team: 'Nuggets',
        opponent: 'Spurs',
        stat: 'triple_double',
        line: 1,
        projection: 0.65,
        edge: '+65%',
        edge_percentage: 65,
        odds: '+180',
        bookmaker: 'Caesars',
        type: 'Over',
        timestamp: now,
        tags: ['jokic', 'sharp', 'triple-double'],
        analysis: '70% of money on Jokic triple-double, only 45% of bets'
      },
      {
        id: `nba-mock-5-${Date.now()}`,
        phrase: `Luka Doncic under 8.5 assists - line movement detected (${today})`,
        category: 'line_move',
        sport: 'nba',
        confidence: 72,
        source: 'Circa Sports',
        player: 'Luka Doncic',
        team: 'Mavericks',
        opponent: 'Thunder',
        stat: 'assists',
        line: 8.5,
        projection: 7.8,
        edge: '-8%',
        edge_percentage: -8,
        odds: '-105',
        bookmaker: 'BetRivers',
        type: 'Under',
        timestamp: now,
        tags: ['doncic', 'line-move', 'assists'],
        analysis: 'Line moved from 8 to 8.5, sharp action on under'
      },
      {
        id: `nba-mock-6-${Date.now()}`,
        phrase: `Anthony Davis over 11.5 rebounds - favorable matchup (${today})`,
        category: 'advanced_analytics',
        sport: 'nba',
        confidence: 81,
        source: 'NBA Math',
        player: 'Anthony Davis',
        team: 'Lakers',
        opponent: 'Bulls',
        stat: 'rebounds',
        line: 11.5,
        projection: 12.4,
        edge: '+8%',
        edge_percentage: 8,
        odds: '-110',
        bookmaker: 'DraftKings',
        type: 'Over',
        timestamp: now,
        tags: ['ad', 'rebounds', 'analytics'],
        analysis: 'Bulls allow 4th most rebounds to opposing bigs'
      }
    ];

    const nflMocks: SecretPhrase[] = [
      {
        id: `nfl-mock-1-${Date.now()}`,
        phrase: `Patrick Mahomes over 300.5 passing yards - sharp play (${today})`,
        category: 'sharp_money',
        sport: 'nfl',
        confidence: 84,
        source: 'Sharp Football',
        player: 'Patrick Mahomes',
        team: 'Chiefs',
        opponent: 'Raiders',
        stat: 'passing_yards',
        line: 300.5,
        projection: 315.2,
        edge: '+5%',
        edge_percentage: 5,
        odds: '-110',
        bookmaker: 'BetMGM',
        type: 'Over',
        timestamp: now,
        tags: ['mahomes', 'passing', 'sharp'],
        analysis: 'Raiders allow 2nd most passing yards'
      }
    ];

    const mlbMocks: SecretPhrase[] = [
      {
        id: `mlb-mock-1-${Date.now()}`,
        phrase: `Shohei Ohtani over 1.5 hits + RBI - MVP candidate heating up (${today})`,
        category: 'prop_value',
        sport: 'mlb',
        confidence: 75,
        source: 'Baseball Savant',
        player: 'Shohei Ohtani',
        team: 'Dodgers',
        opponent: 'Padres',
        stat: 'hits_rbi',
        line: 1.5,
        projection: 2.1,
        edge: '+40%',
        edge_percentage: 40,
        odds: '+130',
        bookmaker: 'DraftKings',
        type: 'Over',
        timestamp: now,
        tags: ['ohtani', 'hits', 'rbi'],
        analysis: 'Ohtani has 8 hits and 6 RBI in last 5 games'
      }
    ];

    const allMocks = [...nbaMocks, ...nflMocks, ...mlbMocks];
    
    if (sport === 'all') {
      return allMocks.sort(() => 0.5 - Math.random()).slice(0, 15);
    }
    
    return allMocks
      .filter(p => p.sport === sport)
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
  };

  // ============================================
  // Fetch secret phrases - NO HEADERS to avoid CORS
  // ============================================
  const fetchSecretPhrases = useCallback(async (sport: string, category: string, minConf: number, bypassCache: boolean = false) => {
    const today = new Date().toDateString();
    const timestamp = Date.now();
    const cacheBuster = bypassCache ? `&daily=${encodeURIComponent(today)}&_t=${timestamp}` : '';
    
    const url = `${PYTHON_API_BASE}/api/secret-phrases?sport=${sport}&category=${category}&min_confidence=${minConf}${cacheBuster}`;
    
    console.log(`🔍 Fetching from: ${url}`);

    try {
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data: ApiResponse = await response.json();
      
      console.log('🔍 Raw API response:', {
        cache_age: data.cache_age,
        cached: data.cached,
        count: data.count,
        timestamp: data.timestamp,
        sources: data.sources
      });
      
      const real = data.phrases || [];
      console.log(`📊 Real phrases count: ${real.length}`);
      
      if (real.length > 0) {
        setApiSource(`Real API Data (${data.sources?.join(', ') || 'Unknown'})`);
        console.log('✅ Using real API data');
        
        if (real.length > 10) {
          const shuffled = [...real].sort(() => 0.5 - Math.random());
          return shuffled;
        }
        return real;
      } else {
        console.log('⚠️ No real data received from API');
        const enhancedMock = generateEnhancedMockPhrases(sport);
        setApiSource('Enhanced Mock Data');
        return enhancedMock;
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      const enhancedMock = generateEnhancedMockPhrases(sport);
      setApiSource('Mock Data (Error Fallback)');
      return enhancedMock;
    }
  }, []);

  // ============================================
  // Handlers
  // ============================================
  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    setSelectedTabCategory('all');
    setSearchQuery('');
    setSearchInput('');
    setShowingGeneratedPicks(false);
    setGeneratedPicks([]);
    setUsedPlayerIds(new Set());
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  const handleTabCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTabCategory(newValue);
    setShowingGeneratedPicks(false);
  };

  const handleConfidenceChange = (event: any, newValue: number | number[]) => {
    setMinConfidence(newValue as number);
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setShowingGeneratedPicks(false);
    setGeneratedPicks([]);
    try {
      const data = await fetchSecretPhrases(selectedSport, selectedCategory, minConfidence, true);
      setPhrases(data);
      setLastUpdated(new Date());
      setUsedPlayerIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [selectedSport, selectedCategory, minConfidence, fetchSecretPhrases]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSecretPhrases(selectedSport, selectedCategory, minConfidence, true);
        setPhrases(data);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load secret phrases');
        setPhrases([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedSport, selectedCategory, minConfidence, fetchSecretPhrases]);

  // Fetch subscription and credits on mount
  useEffect(() => {
    fetchSubscriptionAndCredits();
  }, [fetchSubscriptionAndCredits]);

  // Filter by search query and tab category
  useEffect(() => {
    let filtered = phrases;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const phrase = p.phrase?.toLowerCase() || '';
        const player = p.player?.toLowerCase() || '';
        const team = p.team?.toLowerCase() || '';
        const category = p.category?.toLowerCase() || '';
        const tags = p.tags?.map(t => t.toLowerCase()) || [];
        return phrase.includes(query) ||
               player.includes(query) ||
               team.includes(query) ||
               category.includes(query) ||
               tags.some(tag => tag.includes(query));
      });
    }
    
    if (selectedTabCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedTabCategory);
    }
    
    setFilteredPhrases(filtered);
  }, [searchQuery, phrases, selectedTabCategory]);

  // Get top picks with variation for initial display
  const topPicks = getTopPicksWithVariation(filteredPhrases, MAX_VISIBLE_PHRASES, generationVariation);

  // Update used player IDs when top picks change
  useEffect(() => {
    const newUsedIds = new Set(topPicks.map(p => p.id));
    setUsedPlayerIds(prev => new Set([...prev, ...newUsedIds]));
  }, [topPicks]);

  // ============================================
  // Generate additional picks with variation
  // ============================================
  const handleGenerateAdditionalPicks = async () => {
    if (!hasPremiumAccess && generatorCredits < 1) {
      setShowCreditsModal(true);
      return;
    }

    setGenerating(true);
    
    try {
      // Increment variation for diverse results
      const newVariation = generationVariation + 1;
      setGenerationVariation(newVariation);
      
      // Get fresh phrases based on current filters
      const freshPhrases = await fetchSecretPhrases(selectedSport, selectedTabCategory !== 'all' ? selectedTabCategory : 'all', minConfidence, true);
      const phrasesArray = Array.isArray(freshPhrases) ? freshPhrases : [];
      
      // Get unique picks not already shown
      const newPicks = getUniquePicks(
        phrasesArray,
        usedPlayerIds,
        MAX_GENERATED_PICKS,
        newVariation
      );
      
      if (newPicks.length === 0) {
        setSnackbar({ 
          open: true, 
          message: 'No new unique picks available. Try changing filters.', 
          severity: 'warning' 
        });
        setGenerating(false);
        return;
      }
      
      // Deduct credit if not premium
      if (!hasPremiumAccess && generatorCredits > 0) {
        const token = await getFirebaseIdToken();
        if (token) {
          await fetch(`${PYTHON_API_BASE}/api/generator/use`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              pickType: 'additional_picks',
              pickData: { 
                sport: selectedSport,
                variation: newVariation,
                count: newPicks.length 
              }
            }),
          });
          setGeneratorCredits(prev => prev - 1);
          setSnackbar({ open: true, message: 'Used 1 credit', severity: 'info' });
        }
      }
      
      // Add new picks to generated picks
      setGeneratedPicks(prev => [...prev, ...newPicks]);
      
      // Update used player IDs
      const newIds = new Set(newPicks.map(p => p.id));
      setUsedPlayerIds(prev => new Set([...prev, ...newIds]));
      
      setShowingGeneratedPicks(true);
      
      setSnackbar({ 
        open: true, 
        message: `Generated ${newPicks.length} new picks (Variation ${newVariation})!`, 
        severity: 'success' 
      });
      
    } catch (error) {
      console.error('Error generating additional picks:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to generate additional picks', 
        severity: 'error' 
      });
    } finally {
      setGenerating(false);
    }
  };

  // ============================================
  // Reset to top picks only
  // ============================================
  const handleResetToTopPicks = () => {
    setShowingGeneratedPicks(false);
    setGeneratedPicks([]);
    setGenerationVariation(1);
    setUsedPlayerIds(new Set(topPicks.map(p => p.id)));
    setSnackbar({ 
      open: true, 
      message: 'Reset to top 3 picks', 
      severity: 'info' 
    });
  };

  // ============================================
  // Log analytics
  // ============================================
  const logAnalytics = async (event: string, data: any) => {
    console.log(`📊 Analytics: ${event}`, data);
  };

  // ============================================
  // Render components
  // ============================================

  const renderSubscriptionStatus = () => (
    <Alert 
      severity={hasPremiumAccess ? "success" : "warning"} 
      sx={{ mb: 3 }}
      action={
        !hasPremiumAccess && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" size="small" onClick={() => setShowCreditsModal(true)}>
              Buy Credits ({generatorCredits})
            </Button>
            <Button color="inherit" size="small" onClick={() => setShowUpgradeModal(true)}>
              Upgrade
            </Button>
          </Box>
        )
      }
    >
      <AlertTitle>
        {hasPremiumAccess ? 'Premium Access Active' : `Free Tier - ${generatorCredits} Credits Remaining`}
      </AlertTitle>
      {hasPremiumAccess 
        ? 'Unlimited access to all secret phrases and AI generation!'
        : 'Generate secret phrases using credits. Upgrade to Premium for unlimited access.'}
    </Alert>
  );

  const renderUpgradeModal = () => (
    <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RocketLaunchIcon color="primary" />
          Upgrade to Premium
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Get unlimited access to:
        </Typography>
        <List>
          <ListItem><ListItemText primary="🔐 Unlimited Secret Phrases" secondary="No credit limits" /></ListItem>
          <ListItem><ListItemText primary="🤖 Unlimited AI Generation" secondary="Generate as many as you want" /></ListItem>
          <ListItem><ListItemText primary="📊 Advanced Analytics" secondary="Deeper insights and predictions" /></ListItem>
          <ListItem><ListItemText primary="🔄 Multiple Variations" secondary="Get diverse picks with different strategies" /></ListItem>
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Pricing</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => handleSubscriptionCheckout('premium_monthly', 'month')}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5">$9.99</Typography>
                <Typography variant="body2" color="text.secondary">per month</Typography>
                <Chip label="Monthly" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ cursor: 'pointer', border: '2px solid gold' }} onClick={() => handleSubscriptionCheckout('premium_yearly', 'year')}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5">$99.99</Typography>
                <Typography variant="body2" color="text.secondary">per year</Typography>
                <Chip label="Save 17%" size="small" color="success" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  const renderCreditsModal = () => (
    <Dialog open={showCreditsModal} onClose={() => setShowCreditsModal(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCardIcon color="primary" />
          Purchase Credits
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current credits: <strong>{generatorCredits}</strong>
        </Typography>
        <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
          Each generation uses 1 credit and gives you up to {MAX_GENERATED_PICKS} unique picks.
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(10)}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">10 Credits</Typography>
                <Typography variant="body2">$4.99</Typography>
                <Typography variant="caption">$0.50/credit</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ cursor: 'pointer', border: '2px solid gold' }} onClick={() => handleCreditsCheckout(25)}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">25 Credits</Typography>
                <Typography variant="body2">$9.99</Typography>
                <Typography variant="caption" color="success.main">$0.40/credit</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(50)}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">50 Credits</Typography>
                <Typography variant="body2">$14.99</Typography>
                <Typography variant="caption" color="success.main">$0.30/credit</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowCreditsModal(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  const renderHeader = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      color: 'white',
      py: 6,
      px: 4,
      borderRadius: 3,
      mb: 4,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
      }} />
      <Container maxWidth="lg">
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                🔐 Secret Phrases Hub
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9 }}>
                Insider tips, sharp money moves, and player prop insights
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              onClick={() => setShowSearch(!showSearch)}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
            >
              <SearchIcon />
            </IconButton>
          </Box>

          {showSearch && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search phrases, players, teams..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchInput('')}>
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );

  const renderRefreshIndicator = () => (
    <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <RefreshIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="body2" color="text.secondary">
          Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
        {phrases.length > 0 && (
          <>
            <Chip
              label={`Total: ${phrases.length} picks`}
              size="small"
              color="info"
            />
            <Tooltip title="Showing top 3 highest confidence picks">
              <Chip
                label={`Top ${MAX_VISIBLE_PHRASES} shown`}
                size="small"
                color="success"
                variant="outlined"
              />
            </Tooltip>
          </>
        )}
        <Chip
          label={apiSource}
          size="small"
          color={apiSource.includes('Real') ? 'success' : 'warning'}
        />
        {showingGeneratedPicks && (
          <Chip
            label={`+${generatedPicks.length} generated`}
            size="small"
            color="secondary"
            icon={<SparklesIcon />}
          />
        )}
        <Chip
          label={`Variation ${generationVariation}`}
          size="small"
          variant="outlined"
          icon={<ShuffleIcon />}
        />
      </Box>
      <Button
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        disabled={refreshing}
        variant="outlined"
        size="small"
      >
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </Paper>
  );

  const renderSportSelector = () => {
    const sports = [
      { id: 'nba', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444' },
      { id: 'nfl', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6' },
      { id: 'nhl', name: 'NHL', icon: <SportsHockeyIcon />, color: '#1e40af' },
      { id: 'mlb', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981' },
      { id: 'soccer', name: 'Soccer', icon: <SportsSoccerIcon />, color: '#14b8a6' }
    ];

    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Sport
        </Typography>
        <Grid container spacing={2}>
          {sports.map((sport) => (
            <Grid item key={sport.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: selectedSport === sport.id ? `2px solid ${sport.color}` : '2px solid transparent',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleSportChange(sport.id)}
              >
                <CardContent sx={{ textAlign: 'center', minWidth: 100 }}>
                  <Box sx={{ color: sport.color, mb: 1, fontSize: 32 }}>
                    {sport.icon}
                  </Box>
                  <Typography variant="body2" fontWeight="medium">
                    {sport.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderFilters = () => {
    const categories = [
      { id: 'all', name: 'All Categories' },
      { id: 'insider_tip', name: 'Insider Tips' },
      { id: 'advanced_analytics', name: 'Advanced Analytics' },
      { id: 'injury_update', name: 'Injury Updates' },
      { id: 'line_move', name: 'Line Moves' },
      { id: 'sharp_money', name: 'Sharp Money' },
      { id: 'prop_value', name: 'Prop Value' }
    ];

    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Category"
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Min Confidence: {minConfidence}%</Typography>
            <Slider
              value={minConfidence}
              onChange={handleConfidenceChange}
              min={0}
              max={100}
              step={5}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<RocketLaunchIcon />}
              onClick={() => {
                setCustomQuery("Generate secret phrases for tonight");
                // handleGeneratePredictions will be called via the generator section
              }}
            >
              Generate AI Phrases
            </Button>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderCategoryTabs = () => {
    const categories = [
      { id: 'all', name: 'All Categories' },
      { id: 'insider_tip', name: 'Insider Tips' },
      { id: 'advanced_analytics', name: 'Advanced Analytics' },
      { id: 'injury_update', name: 'Injury Updates' },
      { id: 'line_move', name: 'Line Moves' },
      { id: 'sharp_money', name: 'Sharp Money' },
      { id: 'prop_value', name: 'Prop Value' }
    ];

    return (
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTabCategory}
          onChange={handleTabCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="all" label="All" />
          {categories.slice(1).map(cat => (
            <Tab key={cat.id} value={cat.id} label={cat.name} />
          ))}
        </Tabs>
      </Paper>
    );
  };

  const renderPhraseCard = (phrase: SecretPhrase) => {
    const confidenceColor =
      phrase.confidence >= 80 ? 'success' :
      phrase.confidence >= 70 ? 'warning' : 
      phrase.confidence >= 60 ? 'info' : 'default';

    const edgeDisplay = phrase.edge_percentage ? 
      (phrase.edge_percentage > 0 ? `+${phrase.edge_percentage}%` : `${phrase.edge_percentage}%`) : 
      phrase.edge;

    const statDisplay = phrase.stat ? formatStatDisplay(phrase.stat, phrase.type, phrase.line) : '';

    return (
      <Card sx={{
        mb: 2,
        borderLeft: `4px solid ${
          phrase.confidence >= 80 ? '#22c55e' :
          phrase.confidence >= 70 ? '#eab308' :
          phrase.confidence >= 60 ? '#3b82f6' : '#94a3b8'
        }`
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {phrase.category?.replace(/_/g, ' ') || 'Player Prop'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {phrase.source || 'Unknown'} • {phrase.timestamp ? new Date(phrase.timestamp).toLocaleString() : 'N/A'}
                {phrase.is_mock && ' • (Sample)'}
                {phrase.generated_variation && (
                  <Chip 
                    label={`Var ${phrase.generated_variation}`} 
                    size="small" 
                    variant="outlined" 
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Typography>
            </Box>
            <Chip
              label={`${phrase.confidence || 0}%`}
              size="small"
              color={confidenceColor}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Typography variant="body1" sx={{ my: 2, fontStyle: 'italic' }}>
            "{phrase.phrase || 'No phrase'}"
          </Typography>

          {(phrase.player || phrase.team || phrase.stat || phrase.line) && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
              <Grid container spacing={2}>
                {phrase.player && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Player</Typography>
                    <Typography variant="body2" fontWeight="bold">{phrase.player}</Typography>
                  </Grid>
                )}
                {phrase.team && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Team</Typography>
                    <Typography variant="body2">{phrase.team} {phrase.opponent ? `vs ${phrase.opponent}` : ''}</Typography>
                  </Grid>
                )}
                {statDisplay && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Prop</Typography>
                    <Typography variant="body2">{statDisplay}</Typography>
                  </Grid>
                )}
                {edgeDisplay && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Edge</Typography>
                    <Typography variant="body2" color={phrase.edge_percentage && phrase.edge_percentage > 0 ? '#10b981' : '#ef4444'}>
                      {edgeDisplay}
                    </Typography>
                  </Grid>
                )}
                {phrase.odds && (
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Odds</Typography>
                    <Typography variant="body2">{phrase.odds}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {phrase.analysis && (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">{phrase.analysis}</Typography>
            </Alert>
          )}

          {phrase.tags && phrase.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
              {phrase.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPhrasesSection = () => {
    // Determine which picks to display
    const displayPhrases = showingGeneratedPicks 
      ? [...topPicks, ...generatedPicks]
      : topPicks;
    
    const totalAvailable = filteredPhrases.length;
    const remainingCount = totalAvailable - MAX_VISIBLE_PHRASES;
    const hasMoreToGenerate = (remainingCount > 0 || generatedPicks.length === 0) && !showingGeneratedPicks;
    
    if (displayPhrases.length === 0 && !loading) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            No secret phrases found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting filters or generate new phrases with AI.
          </Typography>
          <Button
            variant="contained"
            startIcon={<RocketLaunchIcon />}
            onClick={handleGenerateAdditionalPicks}
            sx={{ mt: 2 }}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Picks'}
          </Button>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5">
              {searchQuery ? `Search Results (${filteredPhrases.length})` : `Secret Phrases`}
            </Typography>
            {!showingGeneratedPicks && (
              <Typography variant="caption" color="text.secondary">
                Showing top {MAX_VISIBLE_PHRASES} picks • {totalAvailable} total available
              </Typography>
            )}
            {showingGeneratedPicks && (
              <Typography variant="caption" color="text.secondary">
                Showing top {MAX_VISIBLE_PHRASES} picks + {generatedPicks.length} generated picks (Var {generationVariation})
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {showingGeneratedPicks && (
              <Button 
                variant="outlined" 
                onClick={handleResetToTopPicks}
                size="small"
                startIcon={<FilterAltIcon />}
              >
                Show Only Top {MAX_VISIBLE_PHRASES}
              </Button>
            )}
            {hasMoreToGenerate && (
              <Button
                variant="contained"
                startIcon={generating ? <CircularProgress size={20} /> : <ShuffleIcon />}
                onClick={handleGenerateAdditionalPicks}
                disabled={generating}
                size="small"
              >
                {generating ? 'Generating...' : `Generate ${MAX_GENERATED_PICKS} More Picks`}
              </Button>
            )}
          </Box>
        </Box>

        {displayPhrases.map(phrase => (
          <React.Fragment key={phrase.id}>
            {renderPhraseCard(phrase)}
          </React.Fragment>
        ))}

        {!showingGeneratedPicks && totalAvailable > MAX_VISIBLE_PHRASES && (
          <Box sx={{ mt: 3, textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {remainingCount} more picks available
            </Typography>
            <Button
              variant="outlined"
              onClick={handleGenerateAdditionalPicks}
              startIcon={<RocketLaunchIcon />}
              disabled={generating}
            >
              Generate {Math.min(remainingCount, MAX_GENERATED_PICKS)} More Picks
            </Button>
          </Box>
        )}
      </Paper>
    );
  };

  const renderGeneratorSection = () => (
    <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          🚀 AI Secret Phrase Generator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate custom secret phrases using real player prop data and advanced AI models
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          Secret Phrase Prompts
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 400 }}>
            <Select
              value={selectedPrompt}
              onChange={(e) => {
                setSelectedPrompt(e.target.value);
                setCustomQuery(e.target.value);
              }}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <em style={{ color: '#9ca3af' }}>Select a secret phrase prompt (30 available)...</em>;
                }
                return selected;
              }}
            >
              <MenuItem value=""><em>Select a prompt...</em></MenuItem>
              <MenuItem disabled sx={{ opacity: 0.7 }}>
                <Typography variant="caption" color="text.secondary">───── INSIDER TIPS (5) ─────</Typography>
              </MenuItem>
              {SECRET_PHRASE_PROMPTS.slice(0, 5).map(prompt => (
                <MenuItem key={prompt} value={prompt} sx={{ pl: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WhatshotIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                    {prompt}
                  </Box>
                </MenuItem>
              ))}
              <MenuItem disabled sx={{ opacity: 0.7 }}>
                <Typography variant="caption" color="text.secondary">───── SHARP MONEY (5) ─────</Typography>
              </MenuItem>
              {SECRET_PHRASE_PROMPTS.slice(5, 10).map(prompt => (
                <MenuItem key={prompt} value={prompt} sx={{ pl: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
                    {prompt}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            sx={{ flex: 1, minWidth: 300 }}
            variant="outlined"
            placeholder="Or type your own secret phrase query..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            size="small"
          />
          <Button
            variant="contained"
            onClick={() => {
              // This would call the existing handleGeneratePredictions
              setShowGeneratorModal(true);
            }}
            disabled={!customQuery.trim() || generating}
            sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, minWidth: 120 }}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
        Quick prompts
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {SECRET_PHRASE_PROMPTS.slice(0, 8).map((prompt) => (
          <Chip
            key={prompt}
            label={prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt}
            onClick={() => {
              setCustomQuery(prompt);
              setShowGeneratorModal(true);
            }}
            icon={<SearchIcon />}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      <Alert severity="info" icon={<PsychologyIcon />} sx={{ mt: 3 }}>
        Try special commands: "26predictive clustering", "26bayesian inference", or "easter egg" for hidden features.
      </Alert>
    </Paper>
  );

  const renderPrompts = () => (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InsightsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">
            Smart Prompts
          </Typography>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom>
        Quick Prompts
      </Typography>
      <Grid container spacing={2}>
        {SECRET_PHRASE_PROMPTS.slice(0, 6).map((prompt, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                  borderColor: 'primary.main'
                }
              }}
              onClick={() => {
                setCustomQuery(prompt);
                setShowGeneratorModal(true);
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SearchIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                  <Typography variant="body2">
                    {prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 3 }}>
        Tap any prompt to generate AI secret phrases based on that query.
      </Alert>
    </Paper>
  );

  // Simple generator modal placeholder
  const renderGeneratorModal = () => (
    <Dialog open={showGeneratorModal} onClose={() => setShowGeneratorModal(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        AI Secret Phrase Generator
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            Query: "{customQuery}"
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            This feature is coming soon. Use the "Generate More Picks" button above to get additional picks with variations!
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowGeneratorModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && !refreshing) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading secret phrases...</Typography>
        </Box>
      </Container>
    );
  }

  if (error && !phrases.length) {
    return (
      <Container maxWidth="lg">
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error Loading Secret Phrases</AlertTitle>
          <Typography>{error}</Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {renderHeader()}
      {renderSubscriptionStatus()}
      {renderRefreshIndicator()}
      {renderSportSelector()}
      {renderFilters()}
      {renderCategoryTabs()}
      {renderGeneratorSection()}
      {renderPrompts()}
      {renderPhrasesSection()}

      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="body2" color="text.secondary">
            {phrases.length > 0
              ? `✅ Loaded ${phrases.length} secret phrases from ${apiSource}`
              : '⚠️ No phrases available'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          component={Link}
          to="/"
          startIcon={<TrendingUpIcon />}
        >
          Back to Dashboard
        </Button>
      </Paper>

      {renderGeneratorModal()}
      {renderUpgradeModal()}
      {renderCreditsModal()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const SecretPhraseScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="SecretPhrase">
      <SecretPhraseContent />
    </ProtectedRoute>
  );
};

export default SecretPhraseScreen;
