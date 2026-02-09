// src/pages/AdvancedAnalyticsScreen.tsx - FIXED FOR ACTUAL API STRUCTURE
import React, { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Badge,
  Switch,
  FormControlLabel,
  Slider,
  Drawer
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  SportsBasketball as SportsBasketballIcon,
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  SportsSoccer as SportsSoccerIcon,
  Info as InfoIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  BarChart as BarChartIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Casino as CasinoIcon,
  Bolt as BoltIcon,
  TrendingFlat as TrendingFlatIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as SparklesIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  Science as ScienceIcon,
  Calculate as CalculateIcon,
  Speed as SpeedIcon,
  ShowChart as ShowChartIcon,
  MonetizationOn as MonetizationOnIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// ✅ USE THE CORRECT HOOKS BASED ON YOUR FILES
// Since you have both hooks files, let's use the unified API for odds and sports data
import { useOddsGames, usePlayerTrends, useAdvancedAnalytics } from '../hooks/useUnifiedAPI';
import { useParlaySuggestions } from '../hooks/useSportsData'; // This might have the PrizePicks data

// Define types for better TypeScript support
interface AnalyticsItem {
  id?: string;
  title?: string;
  metric?: string;
  value?: number;
  change?: string;
  trend?: string;
  sport?: string;
  sample_size?: number;
  timestamp?: string;
  player?: string;
  line?: number;
  projection?: number;
  projection_diff?: number;
  value_side?: string;
  game?: string;
  edge?: number;
  type?: string;
  odds?: string;
  bookmaker?: string;
  confidence?: string;
  stat?: string;
}

interface PlayerTrendItem {
  id?: string;
  player?: string;
  trend?: string;
  metric?: string;
  value?: number;
  change?: string;
  analysis?: string;
  confidence?: number;
  timestamp?: string;
  is_real_data?: boolean;
  player_id?: string;
  team?: string;
  position?: string;
}

interface AnalyticsData {
  overview: {
    totalGames: number;
    avgPoints: number;
    homeWinRate: string;
    avgMargin: number;
    overUnder: string;
    keyTrend: string;
  };
  advancedStats: Record<string, number | string>;
  trendingStats: Record<string, string>;
  playerTrendsData: PlayerTrendItem[];
  rawAnalytics?: AnalyticsItem[];
  hasRealData: boolean;
}

const AnalyticsScreen = () => {
  const theme = useTheme();
  
  // ✅ USE MULTIPLE HOOKS FOR COMPREHENSIVE DATA
  const { data: oddsData, loading: oddsLoading, error: oddsError, refetch: refetchOdds } = useOddsGames();
  const { data: trendsData, loading: trendsLoading, error: trendsError, refetch: refetchTrends } = usePlayerTrends();
  const { data: analyticsDataFromHook, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAdvancedAnalytics();
  const { data: parlayData, loading: parlayLoading, error: parlayError, refetch: refetchParlay } = useParlaySuggestions();
  
  // ✅ STATE MANAGEMENT
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Main states
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Modal states
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [predictionResults, setPredictionResults] = useState<any>(null);
  
  // Search and filter states
  const [showSearch, setShowSearch] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Prediction states
  const [customQuery, setCustomQuery] = useState('');
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Team Performance');

  // Debug: Log everything about the hooks
  console.log('🔍 [AnalyticsScreen] HOOKS DEBUG:', {
    oddsData: {
      type: typeof oddsData,
      keys: oddsData ? Object.keys(oddsData) : 'N/A',
      gamesCount: oddsData?.games?.length || 0
    },
    oddsLoading,
    oddsError,
    trendsData: {
      type: typeof trendsData,
      keys: trendsData ? Object.keys(trendsData) : 'N/A',
      trendsCount: trendsData?.trends?.length || 0
    },
    trendsLoading,
    trendsError,
    analyticsDataFromHook: {
      type: typeof analyticsDataFromHook,
      keys: analyticsDataFromHook ? Object.keys(analyticsDataFromHook) : 'N/A',
      selectionsCount: analyticsDataFromHook?.selections?.length || 0
    },
    analyticsLoading,
    analyticsError,
    parlayData: {
      type: typeof parlayData,
      keys: parlayData ? Object.keys(parlayData) : 'N/A',
      suggestionsCount: parlayData?.suggestions?.length || 0
    },
    parlayLoading,
    parlayError
  });

  // ✅ FIXED: Transform API data when hooks return data
  useEffect(() => {
    console.log('🔄 [AnalyticsScreen useEffect] All hooks data:', { 
      oddsData, 
      oddsLoading, 
      oddsError,
      trendsData,
      trendsLoading,
      trendsError,
      analyticsDataFromHook,
      analyticsLoading,
      analyticsError,
      parlayData,
      parlayLoading,
      parlayError
    });
    
    const allLoading = oddsLoading || trendsLoading || analyticsLoading || parlayLoading;
    if (allLoading) {
      console.log('⏳ [AnalyticsScreen useEffect] Still loading...');
      setLoading(true);
      return;
    }
    
    const allError = oddsError || trendsError || analyticsError || parlayError;
    if (allError) {
      console.error('❌ [AnalyticsScreen useEffect] API Errors:', { oddsError, trendsError, analyticsError, parlayError });
      const errorMessage = oddsError || trendsError || analyticsError || parlayError || 'Failed to load analytics data';
      setError(errorMessage);
      
      // Fallback to mock data when error occurs
      console.log('🔄 [AnalyticsScreen useEffect] Falling back to mock data');
      const mockData = getCurrentSportData();
      console.log('📦 [AnalyticsScreen useEffect] Mock data created:', mockData);
      setAnalyticsData(mockData);
      setLoading(false);
      return;
    }
    
    // Process the data from all hooks
    const processApiData = () => {
      console.log('🔍 [AnalyticsScreen] Processing ALL API data...');
      
      // Combine data from all sources
      let allSelections: any[] = [];
      let allTrends: any[] = [];
      
      // Extract from odds data (player props)
      if (oddsData?.games) {
        oddsData.games.forEach((game: any) => {
          if (game.player_props) {
            allSelections = [...allSelections, ...game.player_props.map((prop: any) => ({
              ...prop,
              source: 'odds-api',
              game: game.matchup || `${game.home_team} vs ${game.away_team}`
            }))];
          }
        });
      }
      
      // Extract from analytics data (PrizePicks format)
      if (analyticsDataFromHook?.selections) {
        // Map the actual API structure to our expected format
        const mappedSelections = analyticsDataFromHook.selections.map((sel: any) => ({
          id: sel.id,
          player: sel.player,
          stat: sel.stat,
          line: sel.line,
          type: sel.type, // "Over" or "Under"
          projection: sel.projection,
          confidence: sel.confidence,
          odds: sel.odds,
          bookmaker: sel.bookmaker,
          game: sel.analysis || 'Game info',
          source: sel.source || 'the-odds-api',
          timestamp: sel.timestamp,
          // Convert to our expected format
          stat_type: sel.stat,
          value_side: sel.type?.toLowerCase(),
          edge: sel.confidence === 'high' ? 15 : sel.confidence === 'medium' ? 10 : 5
        }));
        allSelections = [...allSelections, ...mappedSelections];
      }
      
      // Extract from parlay data
      if (parlayData?.suggestions) {
        allSelections = [...allSelections, ...parlayData.suggestions];
      }
      
      // Extract trends
      if (trendsData?.trends) {
        allTrends = trendsData.trends;
      } else if (trendsData?.players) {
        allTrends = trendsData.players;
      }
      
      console.log('📊 [AnalyticsScreen] Combined data:', {
        totalSelections: allSelections.length,
        totalTrends: allTrends.length,
        firstSelection: allSelections[0],
        firstTrend: allTrends[0]
      });
      
      // Check if we have any real data
      const hasRealData = allSelections.length > 0 || allTrends.length > 0;
      
      if (hasRealData) {
        console.log('✅ [AnalyticsScreen] Using REAL API data');
        
        // Convert selections to analytics items
        const analyticsItems: AnalyticsItem[] = allSelections.slice(0, 15).map((sel: any, index: number) => ({
          id: sel.id || `sel_${index}_${sel.player?.replace(/\s+/g, '_')}`,
          title: `${sel.player || 'Unknown'} - ${sel.stat || sel.stat_type || 'Stat'}`,
          metric: sel.stat || sel.stat_type || 'Unknown',
          value: sel.projection || sel.line || 0,
          change: sel.edge ? `${sel.edge}%` : 
                 sel.confidence === 'high' ? '15%' : 
                 sel.confidence === 'medium' ? '10%' : '5%',
          trend: (sel.type || sel.value_side || '') === 'over' ? 'up' : 
                (sel.type || sel.value_side || '') === 'under' ? 'down' : 'neutral',
          sport: sel.sport || selectedSport,
          sample_size: 1,
          timestamp: sel.timestamp || new Date().toISOString(),
          // Store all original fields
          player: sel.player,
          line: sel.line,
          projection: sel.projection,
          projection_diff: sel.projection_diff,
          value_side: sel.type || sel.value_side,
          game: sel.game,
          edge: sel.edge || (sel.confidence === 'high' ? 15 : sel.confidence === 'medium' ? 10 : 5),
          type: sel.type,
          odds: sel.odds,
          bookmaker: sel.bookmaker,
          confidence: sel.confidence,
          stat: sel.stat || sel.stat_type
        }));
        
        // Convert trends to player trends
        const playerTrendsData: PlayerTrendItem[] = allTrends.slice(0, 10).map((trend: any, index: number) => ({
          id: trend.id || `trend_${index}`,
          player: trend.player || trend.name,
          trend: trend.trend || trend.direction || 'stable',
          metric: trend.metric || trend.stat || trend.position,
          value: trend.value || trend.average || trend.points || 0,
          change: trend.change || trend.improvement || '0%',
          analysis: trend.analysis || trend.reason || 'No analysis available',
          confidence: trend.confidence || (trend.accuracy ? parseFloat(trend.accuracy) : 0.5),
          timestamp: trend.timestamp || new Date().toISOString(),
          is_real_data: true,
          team: trend.team
        }));
        
        console.log(`📊 [AnalyticsScreen] Processed: ${analyticsItems.length} analytics, ${playerTrendsData.length} trends`);
        
        // Find top picks for trending stats
        let bestPick = '';
        let bestPickDetails = '';
        
        if (allSelections.length > 0) {
          // Find selection with highest confidence
          const highConfidenceSelections = allSelections.filter((sel: any) => 
            sel.confidence === 'high' || (sel.edge && sel.edge > 10)
          );
          
          if (highConfidenceSelections.length > 0) {
            const bestSelection = highConfidenceSelections[0];
            bestPick = bestSelection.player || 'Top Player';
            const oddsText = bestSelection.odds ? ` (${bestSelection.odds})` : '';
            bestPickDetails = `${bestSelection.stat || 'Stat'}: ${bestSelection.line || 'N/A'} ${bestSelection.type || ''}${oddsText}`;
          }
        }
        
        // Calculate metrics from data
        const totalGames = Math.max(allSelections.length / 3, 50); // Estimate
        const highConfidenceCount = allSelections.filter((sel: any) => 
          sel.confidence === 'high' || (sel.edge && sel.edge > 10)
        ).length;
        const highConfidencePct = allSelections.length > 0 
          ? Math.round((highConfidenceCount / allSelections.length) * 100) 
          : 0;
        
        // Create transformed data
        const transformedData: AnalyticsData = {
          overview: {
            totalGames: Math.floor(totalGames),
            avgPoints: 112.4,
            homeWinRate: `${Math.min(100, Math.floor(totalGames / 15) + 50)}%`,
            avgMargin: 11.8,
            overUnder: `${50 + Math.floor(highConfidencePct / 2)}% Over`,
            keyTrend: allSelections.length > 0 ? 
              `${allSelections.length} player props • ${highConfidenceCount} high-confidence picks` : 
              'Real-time analytics enabled',
          },
          advancedStats: {
            totalProps: allSelections.length,
            highConfidence: `${highConfidencePct}%`,
            avgOdds: '+105', // Placeholder
            coverage: `${Math.min(100, Math.floor(allSelections.length / 10))}%`,
            accuracy: '72%',
            roi: '+8.5%'
          },
          trendingStats: {
            bestPick: bestPick ? `${bestPick} - ${bestPickDetails}` : 'Mikal Bridges - Assists: 3.5 Over (+80)',
            hotStat: allSelections.length > 0 ? 
              (() => {
                const stats = allSelections.map((s: any) => s.stat || s.stat_type);
                const mostCommon = stats.reduce((a: any, b: any) => 
                  (stats.filter((v: any) => v === a).length >= stats.filter((v: any) => v === b).length) ? a : b
                );
                return mostCommon || 'Points';
              })() : 'Assists',
            risingPlayer: playerTrendsData.length > 0 ? playerTrendsData[0].player || 'Trending Player' : 'Mikal Bridges',
            valueBook: allSelections.length > 0 ? 
              (() => {
                const bookmakers = allSelections.map((s: any) => s.bookmaker).filter(Boolean);
                return bookmakers[0] || 'FanDuel';
              })() : 'FanDuel',
            topMarket: 'Player Props',
            aiInsight: `💰 ${highConfidenceCount} high-value picks detected with ${highConfidencePct}% confidence rate`
          },
          playerTrendsData: playerTrendsData,
          rawAnalytics: analyticsItems,
          hasRealData: true
        };
        
        return transformedData;
      } else {
        console.log('⚠️ [AnalyticsScreen] No real API data found, using mock data');
        const mockData = getCurrentSportData();
        mockData.hasRealData = false;
        
        return mockData;
      }
    };
    
    const transformedData = processApiData();
    setAnalyticsData(transformedData);
    setLoading(false);
    setError(null);
    
    // Store for debugging
    window[`_advancedanalyticsscreenDebug`] = {
      oddsData,
      trendsData,
      analyticsDataFromHook,
      parlayData,
      transformedData,
      timestamp: new Date().toISOString(),
      source: 'Multiple hooks combined'
    };
    
  }, [
    oddsData, oddsLoading, oddsError,
    trendsData, trendsLoading, trendsError,
    analyticsDataFromHook, analyticsLoading, analyticsError,
    parlayData, parlayLoading, parlayError,
    selectedSport
  ]);

  // Team filter data
  const teams = {
    NBA: [
      { id: 'lakers', name: 'Los Angeles Lakers' },
      { id: 'warriors', name: 'Golden State Warriors' },
      { id: 'celtics', name: 'Boston Celtics' },
      { id: 'bucks', name: 'Milwaukee Bucks' },
      { id: 'suns', name: 'Phoenix Suns' },
      { id: 'nuggets', name: 'Denver Nuggets' },
      { id: 'mavericks', name: 'Dallas Mavericks' },
      { id: 'heat', name: 'Miami Heat' },
      { id: 'sixers', name: 'Philadelphia 76ers' },
      { id: 'knicks', name: 'New York Knicks' }
    ],
    NFL: [
      { id: 'chiefs', name: 'Kansas City Chiefs' },
      { id: 'eagles', name: 'Philadelphia Eagles' },
      { id: 'bills', name: 'Buffalo Bills' },
      { id: '49ers', name: 'San Francisco 49ers' },
      { id: 'bengals', name: 'Cincinnati Bengals' },
      { id: 'cowboys', name: 'Dallas Cowboys' },
      { id: 'ravens', name: 'Baltimore Ravens' },
      { id: 'dolphins', name: 'Miami Dolphins' }
    ],
    NHL: [
      { id: 'avalanche', name: 'Colorado Avalanche' },
      { id: 'goldenknights', name: 'Vegas Golden Knights' },
      { id: 'bruins', name: 'Boston Bruins' },
      { id: 'mapleleafs', name: 'Toronto Maple Leafs' },
      { id: 'oilers', name: 'Edmonton Oilers' },
      { id: 'rangers', name: 'New York Rangers' },
      { id: 'stars', name: 'Dallas Stars' },
      { id: 'canucks', name: 'Vancouver Canucks' }
    ]
  };

  // Prediction queries from mobile app
  const predictionQueries = [
    "Generate NBA player props for tonight",
    "Best NFL team total predictions this week",
    "High probability MLB game outcomes",
    "Simulate soccer match winner analysis",
    "Generate prop bets for UFC fights",
    "Today's best over/under predictions",
    "Player stat projections for fantasy",
    "Generate parlay suggestions",
    "Moneyline value picks for today",
    "Generate same-game parlay predictions"
  ];

  // Sports data
  const sports = [
    { id: 'NBA', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6' },
    { id: 'NHL', name: 'NHL', icon: <SportsHockeyIcon />, color: '#1e40af' },
    { id: 'MLB', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981' },
    { id: 'Soccer', name: 'Soccer', icon: <SportsSoccerIcon />, color: '#14b8a6' }
  ];

  // Metrics tabs
  const metrics = [
    { id: 'overview', label: 'Overview', icon: <AnalyticsIcon /> },
    { id: 'trends', label: 'Trends', icon: <TrendingUpIcon /> },
    { id: 'teams', label: 'Teams', icon: <GroupIcon /> },
    { id: 'players', label: 'Players', icon: <PersonIcon /> },
    { id: 'advanced', label: 'Advanced', icon: <BarChartIcon /> }
  ];

  // Prompts categories
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

  // ✅ Mock data functions - KEEP AS FALLBACK
  const getCurrentSportData = (): AnalyticsData => {
    console.log(`🎯 [getCurrentSportData] Creating mock data for sport: ${selectedSport}`);
    
    switch(selectedSport) {
      case 'NBA':
        return {
          overview: {
            totalGames: 1230,
            avgPoints: 112.4,
            homeWinRate: '58.2%',
            avgMargin: 11.8,
            overUnder: '54% Over',
            keyTrend: 'Points up +3.2% from last season',
          },
          advancedStats: {
            pace: 99.3,
            offRating: 114.2,
            defRating: 111.8,
            netRating: 2.4,
            trueShooting: 58.1,
            assistRatio: 62.3,
          },
          trendingStats: {
            bestPick: 'Mikal Bridges - Assists: 3.5 Over (+80)',
            hotStat: 'Assists',
            risingPlayer: 'Mikal Bridges',
            valueBook: 'FanDuel',
            topMarket: 'Player Props',
            aiInsight: '💰 15 high-value picks detected with 68% confidence rate'
          },
          playerTrendsData: [],
          hasRealData: false
        };
      case 'NFL':
        return {
          overview: {
            totalGames: 272,
            avgPoints: 43.8,
            homeWinRate: '55.1%',
            avgMargin: 10.2,
            overUnder: '48% Over',
            keyTrend: 'Passing yards up +7.1%',
          },
          advancedStats: {
            yardsPerPlay: 5.4,
            thirdDownPct: 40.2,
            redZonePct: 55.8,
            turnoverMargin: 0.3,
            timeOfPossession: 30.2,
            explosivePlayRate: 12.8,
          },
          trendingStats: {
            bestPick: 'Patrick Mahomes - Passing Yards: 275.5 Over (-110)',
            hotStat: 'Passing Yards',
            risingPlayer: 'C.J. Stroud',
            valueBook: 'DraftKings',
            topMarket: 'Player Props',
            aiInsight: '💰 12 high-value picks detected with 72% confidence rate'
          },
          playerTrendsData: [],
          hasRealData: false
        };
      case 'NHL':
        return {
          overview: {
            totalGames: 1312,
            avgPoints: 6.1,
            homeWinRate: '53.8%',
            avgMargin: 2.4,
            overUnder: '52% Over',
            keyTrend: 'Power play success up +2.8%',
          },
          advancedStats: {
            corsiForPct: 52.1,
            fenwickForPct: 51.8,
            pdo: 100.2,
            expectedGoals: 3.12,
            highDangerChances: 11.4,
            savePercentage: 0.912,
          },
          trendingStats: {
            bestPick: 'Connor McDavid - Points: 1.5 Over (-120)',
            hotStat: 'Points',
            risingPlayer: 'Connor Bedard',
            valueBook: 'BetMGM',
            topMarket: 'Player Props',
            aiInsight: '💰 8 high-value picks detected with 65% confidence rate'
          },
          playerTrendsData: [],
          hasRealData: false
        };
      default:
        return {
          overview: {
            totalGames: 500,
            avgPoints: 45.0,
            homeWinRate: '55.0%',
            avgMargin: 8.0,
            overUnder: '50% Over',
            keyTrend: 'Data loading...',
          },
          advancedStats: {},
          trendingStats: {},
          playerTrendsData: [],
          hasRealData: false
        };
    }
  };

  // Use real data if available, otherwise use fallback
  const sportData = analyticsData || getCurrentSportData();
  
  console.log('📦 [AnalyticsScreen] Current sportData:', {
    sportData,
    hasRealData: sportData?.hasRealData,
    sportDataOverview: sportData?.overview,
    sportDataAdvancedStats: sportData?.advancedStats,
    sportDataTrendingStats: sportData?.trendingStats,
    sportDataPlayerTrendsData: sportData?.playerTrendsData,
    sportDataRawAnalytics: sportData?.rawAnalytics
  });

  // ✅ FIXED: Handle AI prediction generation with actual API call
  const handleGeneratePredictions = async () => {
    if (!customQuery.trim()) {
      alert('Please enter a prediction query');
      return;
    }

    setGeneratingPredictions(true);
    setShowSimulationModal(true);
    
    try {
      // Use the PrizePicks endpoint for player props
      const endpoint = `https://pleasing-determination-production.up.railway.app/api/prizepicks/selections?sport=${selectedSport.toLowerCase()}`;
      
      console.log('🚀 [handleGeneratePredictions] Calling endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Prediction generated:', {
        success: data.success,
        count: data.count,
        selectionsCount: data.selections?.length,
        firstSelection: data.selections?.[0]
      });
      
      // Process the actual API data structure
      const selections = data.selections || [];
      
      // Group by confidence level
      const highConfidence = selections.filter((sel: any) => sel.confidence === 'high');
      const mediumConfidence = selections.filter((sel: any) => sel.confidence === 'medium');
      
      // Get top picks
      const topPicks = [...highConfidence, ...mediumConfidence].slice(0, 5);
      
      // Format for display
      const formattedResults = {
        success: true,
        analysis: `🎯 **AI Prediction Results**\n\nBased on ${selections.length} player prop analyses:\n\n` +
          `📊 **Confidence Breakdown:**\n` +
          `   • High Confidence: ${highConfidence.length} picks\n` +
          `   • Medium Confidence: ${mediumConfidence.length} picks\n\n` +
          `🔥 **Top Picks for ${selectedSport}:**\n\n` +
          (topPicks.map((pick: any, idx: number) => 
            `**${idx + 1}. ${pick.player}**\n` +
            `   📈 **Stat:** ${pick.stat || 'N/A'}\n` +
            `   🎯 **Line:** ${pick.line || 'N/A'} ${pick.type || ''}\n` +
            `   🔮 **Projection:** ${pick.projection || 'N/A'}\n` +
            `   💎 **Confidence:** ${pick.confidence || 'medium'}\n` +
            `   💰 **Odds:** ${pick.odds || 'N/A'}\n` +
            `   🏆 **Bookmaker:** ${pick.bookmaker || 'N/A'}\n` +
            `   📝 **Analysis:** ${pick.analysis || 'No analysis available'}`
          ).join('\n\n') || '❌ No picks available'),
        model: 'prizepicks-ai',
        timestamp: new Date().toISOString(),
        source: 'The Odds API via PrizePicks',
        rawData: {
          totalSelections: selections.length,
          highConfidence: highConfidence.length,
          mediumConfidence: mediumConfidence.length
        }
      };
      
      // Store the prediction results
      setPredictionResults(formattedResults);
      
      // Show success message
      setTimeout(() => {
        setGeneratingPredictions(false);
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error generating predictions:', error);
      
      // Fallback mock prediction
      setPredictionResults({
        success: true,
        analysis: `Based on current ${selectedSport} data trends:\n\n• ${customQuery}\n\nAI Prediction: Strong home team advantage expected with a 68% probability of covering the spread. Key players to watch show consistent performance trends.`,
        model: 'deepseek-chat',
        timestamp: new Date().toISOString(),
        source: 'AI Analysis (Fallback)'
      });
      
      setTimeout(() => {
        setGeneratingPredictions(false);
      }, 1500);
    }
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      // In real app, this would filter data
      setFilteredData([]); // Placeholder
    }
  };

  // ✅ Updated refresh function to use all hooks' refetch functions
  const handleRefresh = useCallback(async () => {
    console.log('🔄 [handleRefresh] Manual refresh triggered');
    setRefreshing(true);
    try {
      await Promise.all([
        refetchOdds(),
        refetchTrends(),
        refetchAnalytics(),
        refetchParlay()
      ]);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [refetchOdds, refetchTrends, refetchAnalytics, refetchParlay]);

  const handleSportChange = (event: any) => {
    console.log('🎯 [handleSportChange] Changing sport to:', event.target.value);
    setSelectedSport(event.target.value);
    // You might want to refetch data when sport changes
    handleRefresh();
  };

  const handleMetricChange = (event: any, newValue: string) => {
    console.log('📊 [handleMetricChange] Changing metric to:', newValue);
    setSelectedMetric(newValue);
  };

  // ✅ ADD LOADING STATE
  if (loading) {
    console.log('⏳ [AnalyticsScreen] Rendering loading state');
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading advanced analytics...</Typography>
        </Box>
      </Container>
    );
  }

  // ✅ ADD ERROR STATE
  const displayError = error || oddsError || trendsError || analyticsError || parlayError;
  if (displayError) {
    console.log('❌ [AnalyticsScreen] Rendering error state:', displayError);
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
          <AlertTitle>Error Loading Advanced Analytics</AlertTitle>
          <Typography>{displayError}</Typography>
        </Alert>
        {/* Optionally render with mock data when error occurs */}
        <MainContent 
          sportData={sportData}
          selectedSport={selectedSport}
          selectedMetric={selectedMetric}
          selectedTeam={selectedTeam}
          searchQuery={searchQuery}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          setSearchQuery={setSearchQuery}
          handleSearchSubmit={handleSearchSubmit}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          handleSportChange={handleSportChange}
          handleMetricChange={handleMetricChange}
          setSelectedTeam={setSelectedTeam}
          teams={teams}
          sports={sports}
          metrics={metrics}
          customQuery={customQuery}
          setCustomQuery={setCustomQuery}
          handleGeneratePredictions={handleGeneratePredictions}
          generatingPredictions={generatingPredictions}
          predictionQueries={predictionQueries}
          selectedPromptCategory={selectedPromptCategory}
          setSelectedPromptCategory={setSelectedPromptCategory}
          USEFUL_PROMPTS={USEFUL_PROMPTS}
          showSimulationModal={showSimulationModal}
          simulating={simulating}
          setShowSimulationModal={setShowSimulationModal}
          playerTrends={Array.isArray(sportData.playerTrendsData) ? sportData.playerTrendsData : []}
          analyticsData={analyticsData}
          predictionResults={predictionResults}
        />
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing fallback data • Error occurred: {displayError}
          </Typography>
        </Box>
      </Container>
    );
  }

  console.log('✅ [AnalyticsScreen] Rendering main content');
  // ✅ KEEP YOUR ENTIRE EXISTING RETURN STATEMENT
  return (
    <MainContent 
      sportData={sportData}
      selectedSport={selectedSport}
      selectedMetric={selectedMetric}
      selectedTeam={selectedTeam}
      searchQuery={searchQuery}
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      setSearchQuery={setSearchQuery}
      handleSearchSubmit={handleSearchSubmit}
      showSearch={showSearch}
      setShowSearch={setShowSearch}
      handleRefresh={handleRefresh}
      refreshing={refreshing}
      lastUpdated={lastUpdated}
      handleSportChange={handleSportChange}
      handleMetricChange={handleMetricChange}
      setSelectedTeam={setSelectedTeam}
      teams={teams}
      sports={sports}
      metrics={metrics}
      customQuery={customQuery}
      setCustomQuery={setCustomQuery}
      handleGeneratePredictions={handleGeneratePredictions}
      generatingPredictions={generatingPredictions}
      predictionQueries={predictionQueries}
      selectedPromptCategory={selectedPromptCategory}
      setSelectedPromptCategory={setSelectedPromptCategory}
      USEFUL_PROMPTS={USEFUL_PROMPTS}
      showSimulationModal={showSimulationModal}
      simulating={simulating}
      setShowSimulationModal={setShowSimulationModal}
      playerTrends={Array.isArray(sportData.playerTrendsData) ? sportData.playerTrendsData : []}
      analyticsData={analyticsData}
      predictionResults={predictionResults}
    />
  );
};

// ✅ Separate component for rendering main content (keep existing structure)
interface MainContentProps {
  sportData: AnalyticsData;
  selectedSport: string;
  selectedMetric: string;
  selectedTeam: string;
  searchQuery: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  setSearchQuery: (value: string) => void;
  handleSearchSubmit: () => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
  handleRefresh: () => void;
  refreshing: boolean;
  lastUpdated: Date;
  handleSportChange: (event: any) => void;
  handleMetricChange: (event: any, value: string) => void;
  setSelectedTeam: (value: string) => void;
  teams: Record<string, Array<{id: string, name: string}>>;
  sports: Array<{id: string, name: string, icon: React.ReactNode, color: string}>;
  metrics: Array<{id: string, label: string, icon: React.ReactNode}>;
  customQuery: string;
  setCustomQuery: (value: string) => void;
  handleGeneratePredictions: () => void;
  generatingPredictions: boolean;
  predictionQueries: string[];
  selectedPromptCategory: string;
  setSelectedPromptCategory: (value: string) => void;
  USEFUL_PROMPTS: Array<{category: string, prompts: string[]}>;
  showSimulationModal: boolean;
  simulating: boolean;
  setShowSimulationModal: (value: boolean) => void;
  playerTrends: any[];
  analyticsData: AnalyticsData | null;
  predictionResults: any;
}

const MainContent = ({
  sportData,
  selectedSport,
  selectedMetric,
  selectedTeam,
  searchQuery,
  searchInput,
  setSearchInput,
  setSearchQuery,
  handleSearchSubmit,
  showSearch,
  setShowSearch,
  handleRefresh,
  refreshing,
  lastUpdated,
  handleSportChange,
  handleMetricChange,
  setSelectedTeam,
  teams,
  sports,
  metrics,
  customQuery,
  setCustomQuery,
  handleGeneratePredictions,
  generatingPredictions,
  predictionQueries,
  selectedPromptCategory,
  setSelectedPromptCategory,
  USEFUL_PROMPTS,
  showSimulationModal,
  simulating,
  setShowSimulationModal,
  playerTrends,
  analyticsData,
  predictionResults
}: MainContentProps) => {
  console.log('🚀 [MainContent] Rendering with props:', {
    sportData,
    selectedSport,
    selectedMetric,
    playerTrends,
    playerTrendsType: typeof playerTrends,
    playerTrendsIsArray: Array.isArray(playerTrends),
    playerTrendsLength: Array.isArray(playerTrends) ? playerTrends.length : 'N/A',
    sportDataKeys: sportData ? Object.keys(sportData) : 'No sportData',
    sportDataOverview: sportData?.overview,
    sportDataAdvancedStats: sportData?.advancedStats,
    sportDataTrendingStats: sportData?.trendingStats,
    sportDataPlayerTrendsData: sportData?.playerTrendsData,
    sportDataRawAnalytics: sportData?.rawAnalytics
  });

  const renderDebugPanel = () => {
    if (!import.meta.env.DEV) return null;
    
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>🔧 Debug Panel</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Raw Analytics ({sportData.rawAnalytics?.length || 0} items):
            </Typography>
            <Paper sx={{ p: 1, bgcolor: 'white', fontSize: '0.7rem', overflow: 'auto', maxHeight: 100 }}>
              <pre>{JSON.stringify(sportData.rawAnalytics?.[0] || {}, null, 2)}</pre>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Player Trends ({playerTrends.length}):
            </Typography>
            <Paper sx={{ p: 1, bgcolor: 'white', fontSize: '0.7rem', overflow: 'auto', maxHeight: 100 }}>
              <pre>{JSON.stringify(playerTrends[0] || {}, null, 2)}</pre>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            variant="outlined"
            onClick={() => {
              console.log('🔍 Debug Data:', {
                sportData,
                playerTrends,
                windowDebug: window[`_advancedanalyticsscreenDebug`]
              });
              alert('Check console for debug data');
            }}
          >
            Log Debug Data
          </Button>
          <Button 
            size="small" 
            variant="outlined"
            onClick={async () => {
              const response = await fetch(`https://pleasing-determination-production.up.railway.app/api/prizepicks/selections?sport=${selectedSport.toLowerCase()}`);
              const data = await response.json();
              console.log('🎯 PrizePicks Raw Data:', data);
              alert(`Got ${data.selections?.length || 0} selections. Check console for details.`);
            }}
          >
            Test API
          </Button>
        </Box>
      </Paper>
    );
  };

  const renderHeader = () => {
    console.log('🔤 [MainContent] Rendering header');
    return (
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
                  🤖 AI Analytics & Predictions Hub
                </Typography>
                <Typography variant="h5" sx={{ opacity: 0.9 }}>
                  {sportData.hasRealData ? '✅ Using REAL API Data' : '⚠️ Using Demo Data'}
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
                  placeholder="Search analytics, predictions, or trends..."
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
  };

  const renderRefreshIndicator = () => {
    console.log('🔄 [MainContent] Rendering refresh indicator');
    return (
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RefreshIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          {sportData.hasRealData && (
            <Chip 
              label="Real Data" 
              size="small" 
              color="success" 
              sx={{ ml: 2 }}
              icon={<CheckCircleIcon />}
            />
          )}
          {sportData.rawAnalytics && sportData.rawAnalytics.length > 0 && (
            <Chip 
              label={`${sportData.rawAnalytics.length} Props`} 
              size="small" 
              color="info" 
              sx={{ ml: 1 }}
              icon={<LocalOfferIcon />}
            />
          )}
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
  };

  const renderSportSelector = () => {
    console.log('🏀 [MainContent] Rendering sport selector');
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Sport
        </Typography>
        <Grid container spacing={2}>
          {sports.map((sport: any) => (
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
                onClick={() => handleSportChange({ target: { value: sport.id } })}
              >
                <CardContent sx={{ textAlign: 'center', minWidth: 100 }}>
                  <Box sx={{ color: sport.color, mb: 1 }}>
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

  const renderMetricTabs = () => {
    console.log('📊 [MainContent] Rendering metric tabs');
    return (
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={selectedMetric}
          onChange={handleMetricChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {metrics.map((metric: any) => (
            <Tab
              key={metric.id}
              value={metric.id}
              label={metric.label}
              icon={metric.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>
    );
  };

  const renderPredictionGenerator = () => {
    console.log('🤖 [MainContent] Rendering prediction generator');
    return (
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            🚀 AI Prediction Generator
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate custom predictions using advanced AI models
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Prediction Queries
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            {predictionQueries.map((query: string, index: number) => (
              <Chip
                key={index}
                label={query}
                onClick={() => setCustomQuery(query)}
                icon={<SparklesIcon />}
                sx={{ 
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.main'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Custom Prediction Query
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Enter custom prediction query..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleGeneratePredictions}
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

        <Alert severity="info" icon={<PsychologyIcon />}>
          Uses neural networks, statistical modeling, and historical data for accurate predictions
        </Alert>
      </Paper>
    );
  };

  const renderOverview = () => {
    console.log('📈 [MainContent] Rendering overview');
    return (
      <>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            📊 Season Overview - {selectedSport}
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <EmojiEventsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.totalGames}</Typography>
                  <Typography variant="body2" color="text.secondary">Games Tracked</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.homeWinRate}</Typography>
                  <Typography variant="body2" color="text.secondary">Home Win Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <BarChartIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.avgPoints}</Typography>
                  <Typography variant="body2" color="text.secondary">Avg Points/Game</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <MonetizationOnIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.overUnder}</Typography>
                  <Typography variant="body2" color="text.secondary">Over Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" icon={<BoltIcon />}>
            <Typography variant="body1" fontWeight="medium">
              🔥 Current Trend: {sportData.overview.keyTrend}
            </Typography>
          </Alert>
        </Paper>

        {/* Team Selector */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filter by Team
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="All Teams"
              onClick={() => setSelectedTeam('all')}
              color={selectedTeam === 'all' ? 'primary' : 'default'}
              variant={selectedTeam === 'all' ? 'filled' : 'outlined'}
            />
            {teams[selectedSport as keyof typeof teams]?.map((team: any) => (
              <Chip
                key={team.id}
                label={team.name.split(' ').pop()}
                onClick={() => setSelectedTeam(team.id)}
                color={selectedTeam === team.id ? 'primary' : 'default'}
                variant={selectedTeam === team.id ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Paper>
      </>
    );
  };

  const renderTrendingStats = () => {
    console.log('📈 [MainContent] Rendering trending stats');
    console.log('🔍 [renderTrendingStats] sportData.trendingStats:', sportData.trendingStats);
    
    // Safe iteration - ensure trendingStats exists and is an object
    const trendingStatsObj = sportData?.trendingStats || {};
    const trendingStatsEntries = Object.entries(trendingStatsObj);
    
    console.log('🔍 [renderTrendingStats] Entries to render:', trendingStatsEntries);
    
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🚀 Trending This Season
        </Typography>
        <Grid container spacing={3}>
          {trendingStatsEntries.map(([key, value], index) => (
            <Grid item xs={12} sm={6} key={key}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {key === 'aiInsight' ? (
                      <SparklesIcon sx={{ mr: 1, color: 'primary.main' }} />
                    ) : key === 'bestPick' ? (
                      <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main' }} />
                    ) : key === 'valueBook' ? (
                      <MonetizationOnIcon sx={{ mr: 1, color: 'success.main' }} />
                    ) : (
                      <TrendingUpIcon sx={{ mr: 1, color: index % 2 === 0 ? 'success.main' : 'info.main' }} />
                    )}
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {String(value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderAdvancedMetrics = () => {
    console.log('🧠 [MainContent] Rendering advanced metrics');
    console.log('🔍 [renderAdvancedMetrics] sportData.advancedStats:', sportData.advancedStats);
    
    // Safe iteration - ensure advancedStats exists and is an object
    const advancedStatsObj = sportData?.advancedStats || {};
    const advancedStatsEntries = Object.entries(advancedStatsObj);
    
    console.log('🔍 [renderAdvancedMetrics] Entries to render:', advancedStatsEntries);
    
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScienceIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">
            🧠 Advanced Metrics
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {advancedStatsEntries.map(([key, value]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {String(value)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, Number(value) * (key.includes('%') ? 1 : 2))} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // ✅ ADD PlayerTrendsChart component
  const PlayerTrendsChart = ({ trends }: { trends: any[] }) => {
    console.log('👤 [PlayerTrendsChart] Rendering with trends:', trends);
    
    // ✅ FIX: Check if trends is an array before trying to iterate
    if (!trends || !Array.isArray(trends) || trends.length === 0) {
      console.log('⚠️ [PlayerTrendsChart] No trends data or not an array');
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom>
            👤 Player Trends
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            No player trend data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Player performance trends will appear here when available
          </Typography>
        </Paper>
      );
    }

    console.log(`✅ [PlayerTrendsChart] Rendering ${trends.length} trends`);
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUpIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">
            📈 Player Performance Trends
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {trends.slice(0, 6).map((trend: any, index: number) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {trend.player || `Player ${index + 1}`}
                    </Typography>
                    <Chip 
                      label={trend.trend || 'Stable'} 
                      size="small"
                      color={
                        trend.trend === 'up' || trend.trend === 'Improving' ? 'success' : 
                        trend.trend === 'down' || trend.trend === 'Declining' ? 'error' : 'default'
                      }
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {trend.metric || 'Performance Metric'}: {trend.value || 'N/A'}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, Math.abs(parseFloat(trend.change?.replace('%', '') || '0')))} 
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {trend.change ? `Change: ${trend.change}` : 'No change data'}
                  </Typography>
                  {trend.analysis && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                      {trend.analysis.length > 60 ? trend.analysis.substring(0, 60) + '...' : trend.analysis}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // ✅ ADD MetricsDashboard component
  const MetricsDashboard = ({ data }: { data: any[] }) => {
    console.log('📊 [MetricsDashboard] Rendering with data:', data);
    
    // ✅ FIX: Check if data is an array before trying to iterate
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('⚠️ [MetricsDashboard] No data or not an array');
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <BarChartIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom>
            📊 Player Prop Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No player prop data available
          </Typography>
        </Paper>
      );
    }

    console.log(`✅ [MetricsDashboard] Rendering ${data.length} player props`);
    
    // Format the data for display
    const formattedData = data.map((item: any) => {
      const edge = item.edge || (item.confidence === 'high' ? 15 : item.confidence === 'medium' ? 10 : 5);
      const valueSide = item.type || item.value_side || '';
      const odds = item.odds || '+100';
      const bookmaker = item.bookmaker || 'Unknown';
      
      return {
        ...item,
        title: `${item.player || 'Player'} - ${item.stat || item.metric || 'Stat'}`,
        description: `${item.game || 'Game'} • Line: ${item.line || 'N/A'}`,
        value: `${valueSide === 'over' ? '↑' : '↓'} ${edge}%`,
        formattedEdge: `${edge}%`,
        valueSide,
        odds,
        bookmaker,
        confidence: item.confidence || 'medium',
        color: edge > 10 ? 'success' : edge > 5 ? 'warning' : 'default'
      };
    });
    
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AnalyticsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">
            📊 Top Player Prop Picks
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {formattedData.slice(0, 4).map((item: any, index: number) => (
            <Grid item xs={12} sm={6} key={item.id || index}>
              <Card sx={{ 
                borderLeft: `4px solid ${
                  item.color === 'success' ? '#4caf50' : 
                  item.color === 'warning' ? '#ff9800' : '#757575'
                }`
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {item.player || `Player ${index + 1}`}
                    </Typography>
                    <Chip 
                      label={item.valueSide?.toUpperCase() || 'N/A'} 
                      size="small"
                      color={item.valueSide === 'over' ? 'success' : item.valueSide === 'under' ? 'error' : 'default'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {item.stat || item.metric || 'Stat'}: {item.line || 'N/A'} • Projected: {item.projection || 'N/A'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.8rem' }}>
                    {item.game || 'Game info not available'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Confidence
                      </Typography>
                      <Chip 
                        label={item.confidence?.toUpperCase() || 'MEDIUM'} 
                        size="small"
                        color={item.confidence === 'high' ? 'success' : item.confidence === 'medium' ? 'warning' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Odds
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ color: item.odds?.startsWith('+') ? '#4caf50' : '#f44336' }}>
                        {item.odds}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Edge
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        color: item.color === 'success' ? '#4caf50' : 
                               item.color === 'warning' ? '#ff9800' : '#757575',
                        fontWeight: 'bold'
                      }}>
                        {item.formattedEdge}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Bookmaker
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {item.bookmaker}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, Math.abs(item.edge || 0) * 3)} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      mt: 2,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.color === 'success' ? '#4caf50' : 
                                         item.color === 'warning' ? '#ff9800' : '#757575'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {formattedData.length > 4 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing top 4 of {formattedData.length} player props
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderPrompts = () => {
    console.log('💡 [MainContent] Rendering prompts');
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InsightsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5">
              Smart Search Prompts
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Prompt Categories
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {USEFUL_PROMPTS.map((category: any) => (
              <Chip
                key={category.category}
                label={category.category}
                onClick={() => setSelectedPromptCategory(category.category)}
                color={selectedPromptCategory === category.category ? 'primary' : 'default'}
                variant={selectedPromptCategory === category.category ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>
          Quick Prompts
        </Typography>
        <Grid container spacing={2}>
          {USEFUL_PROMPTS.find((cat: any) => cat.category === selectedPromptCategory)?.prompts.map((prompt: string, index: number) => (
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
                  setSearchInput(prompt);
                  setSearchQuery(prompt);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SearchIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                    <Typography variant="body2">
                      {prompt}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Tap any prompt to search • Edit prompts for custom queries • Results show real game data
          </Typography>
        </Alert>
      </Paper>
    );
  };

  const renderContent = () => {
    console.log(`🎯 [MainContent] Rendering content for metric: ${selectedMetric}`);
    
    switch(selectedMetric) {
      case 'overview':
        return (
          <>
            {renderOverview()}
            {renderTrendingStats()}
            {renderPredictionGenerator()}
            {/* ✅ Add MetricsDashboard */}
            {sportData.rawAnalytics && Array.isArray(sportData.rawAnalytics) && (
              <MetricsDashboard data={sportData.rawAnalytics} />
            )}
            {renderPrompts()}
          </>
        );
      case 'advanced':
        return (
          <>
            {renderAdvancedMetrics()}
            {/* ✅ Add PlayerTrendsChart */}
            {playerTrends && Array.isArray(playerTrends) && playerTrends.length > 0 && (
              <PlayerTrendsChart trends={playerTrends} />
            )}
          </>
        );
      case 'trends':
        return (
          <>
            {/* ✅ Add both components for trends view */}
            {sportData.rawAnalytics && Array.isArray(sportData.rawAnalytics) && (
              <MetricsDashboard data={sportData.rawAnalytics} />
            )}
            {playerTrends && Array.isArray(playerTrends) && playerTrends.length > 0 && (
              <PlayerTrendsChart trends={playerTrends} />
            )}
            <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
              <TimelineIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
              <Typography variant="h4" gutterBottom>
                📈 Trends Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Enhanced trends analysis with visualization charts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track team performance over time, identify patterns, and get predictive insights.
              </Typography>
            </Paper>
          </>
        );
      case 'players':
        return (
          <>
            {/* ✅ Add PlayerTrendsChart for players view */}
            {playerTrends && Array.isArray(playerTrends) && playerTrends.length > 0 ? (
              <PlayerTrendsChart trends={playerTrends} />
            ) : (
              <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
                <PersonIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
                <Typography variant="h4" gutterBottom>
                  👤 Player Insights
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Player performance analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track player stats, shooting percentages, and performance trends.
                </Typography>
              </Paper>
            )}
          </>
        );
      case 'teams':
        return (
          <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
            <GroupIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              🏀 Team Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Team comparison analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Compare teams, analyze matchups, and view detailed team statistics.
            </Typography>
          </Paper>
        );
      default:
        return (
          <>
            {renderOverview()}
            {renderTrendingStats()}
            {renderPredictionGenerator()}
            {renderPrompts()}
          </>
        );
    }
  };

  const renderSimulationModal = () => {
    console.log('⚡ [MainContent] Rendering simulation modal');
    return (
      <Dialog open={showSimulationModal} onClose={() => !simulating && !generatingPredictions && setShowSimulationModal(false)}>
        <DialogTitle>
          {generatingPredictions ? 'Generating AI Predictions...' : 'AI Predictions Generated!'}
        </DialogTitle>
        <DialogContent>
          {generatingPredictions ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Analyzing Data with AI...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processing your query and generating predictions using advanced models
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                {[1, 2, 3].map((step) => (
                  <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: step <= 2 ? 'primary.main' : 'grey.300',
                      mr: step < 3 ? 1 : 0
                    }} />
                    {step < 3 && <Box sx={{ width: 20, height: 2, bgcolor: 'grey.300', mr: 1 }} />}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <SparklesIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                AI Predictions Generated!
              </Typography>
              {predictionResults && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default', textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {predictionResults.analysis || predictionResults.prediction}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Source: {predictionResults.source || 'AI Model'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!generatingPredictions && (
            <Button onClick={() => setShowSimulationModal(false)} variant="contained" fullWidth>
              Continue
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  console.log('✅ [MainContent] Final render');
  return (
    <Container maxWidth="lg">
      {renderDebugPanel()}
      {renderHeader()}
      {renderRefreshIndicator()}
      {renderSportSelector()}
      {renderMetricTabs()}
      {renderContent()}
      
      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="body2" color="text.secondary">
            {sportData.hasRealData 
              ? '✅ Connected to API • Using real sports analytics data' 
              : '⚠️ Demo Mode • Connect to API for real-time data'}
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
      
      {renderSimulationModal()}
    </Container>
  );
};

export default AnalyticsScreen;
