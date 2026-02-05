// src/pages/AdvancedAnalyticsScreen.tsx - UPDATED WITH HOOK INTEGRATION
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
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// ✅ IMPORT THE CUSTOM HOOKS (File 2 integration)
import { useAdvancedAnalytics, usePlayerTrends } from '../hooks/useSportsData';

// Define types for better TypeScript support
interface AnalyticsItem {
  metrics?: Array<{
    length?: number;
    value?: number;
    percentile?: number;
    description?: string;
    player?: string;
    team?: string;
  }>;
  description?: string;
  title?: string;
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
  playerTrendsData: any[];
  rawAnalytics?: AnalyticsItem[];
}

const AnalyticsScreen = () => {
  const theme = useTheme();
  
  // ✅ USE CUSTOM HOOKS (File 2 pattern)
  const { data: apiAnalytics, loading: apiLoading, error: apiError, refetch: refetchAnalytics } = useAdvancedAnalytics();
  const { data: playerTrends, loading: trendsLoading, error: trendsError, refetch: refetchTrends } = usePlayerTrends();
  
  // ✅ STATE MANAGEMENT (File 1 pattern)
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
  
  // Search and filter states
  const [showSearch, setShowSearch] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  
  // Prediction states
  const [customQuery, setCustomQuery] = useState('');
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Team Performance');

  // ✅ TRANSFORM API DATA WHEN HOOK RETURNS IT (File 1 pattern)
  useEffect(() => {
    console.log('🔄 API data changed:', { 
      apiAnalytics, 
      apiLoading, 
      apiError,
      playerTrends,
      trendsLoading,
      trendsError
    });
    
    if (apiLoading || trendsLoading) {
      setLoading(true);
      return;
    }
    
    if (apiError || trendsError) {
      console.error('❌ API Errors:', { apiError, trendsError });
      const errorMessage = apiError || trendsError || 'Failed to load analytics data';
      setError(errorMessage);
      
      // ✅ File 1: Fallback to mock data when error occurs
      console.log('🔄 Falling back to mock data');
      setAnalyticsData(getCurrentSportData());
      setLoading(false);
      
      // ✅ Store for debugging
      window[`_advancedanalyticsscreenDebug`] = {
        apiError,
        trendsError,
        usingMockData: true,
        timestamp: new Date().toISOString()
      };
      return;
    }
    
    if (apiAnalytics && Array.isArray(apiAnalytics)) {
      console.log(`✅ Using REAL advanced analytics: ${apiAnalytics.length || 0} analytics`);
      
      // ✅ Transform API data to match our component structure
      const transformedData: AnalyticsData = {
        overview: {
          totalGames: (apiAnalytics[0]?.metrics?.length || 0) * 10 || 1230,
          avgPoints: apiAnalytics[0]?.metrics?.[0]?.value || 112.4,
          homeWinRate: `${(apiAnalytics[0]?.metrics?.[0]?.percentile || 58.2).toFixed(1)}%`,
          avgMargin: apiAnalytics[0]?.metrics?.[1]?.value || 11.8,
          overUnder: `${(apiAnalytics[0]?.metrics?.[0]?.percentile || 54).toFixed(0)}% Over`,
          keyTrend: apiAnalytics[0]?.description || 'Points up +3.2% from last season',
        },
        advancedStats: {
          pace: apiAnalytics[1]?.metrics?.[0]?.value || 99.3,
          offRating: apiAnalytics[1]?.metrics?.[1]?.value || 114.2,
          defRating: apiAnalytics[1]?.metrics?.[2]?.value || 111.8,
          netRating: apiAnalytics[0]?.metrics?.[0]?.percentile || 2.4,
          trueShooting: apiAnalytics[1]?.metrics?.[3]?.value || 58.1,
          assistRatio: apiAnalytics[1]?.metrics?.[4]?.value || 62.3,
        },
        trendingStats: {
          bestOffense: `${apiAnalytics[0]?.metrics?.[0]?.player || 'Dallas Mavericks'} (${apiAnalytics[0]?.metrics?.[0]?.value || 121.4} PPG)`,
          bestDefense: `${apiAnalytics[0]?.metrics?.[1]?.player || 'Boston Celtics'} (${apiAnalytics[0]?.metrics?.[1]?.value || 107.8} PPG)`,
          mostImproving: apiAnalytics[0]?.title || 'Orlando Magic (+12 wins)',
          surpriseTeam: apiAnalytics[0]?.metrics?.[2]?.team || 'Oklahoma City Thunder',
          playerToWatch: apiAnalytics[0]?.metrics?.[0]?.player || 'Shai Gilgeous-Alexander',
          fantasyDraftTip: "FanDuel Snake Draft Strategy: Prioritize Jokic, Doncic, Giannis in early rounds."
        },
        playerTrendsData: playerTrends || [],
        rawAnalytics: apiAnalytics // Store raw data for reference
      };
      
      console.log('📊 Transformed analytics data:', transformedData);
      setAnalyticsData(transformedData);
      setLoading(false);
      setError(null);
      
      // ✅ Store for debugging (File 1 pattern)
      window[`_advancedanalyticsscreenDebug`] = {
        rawApiResponse: apiAnalytics,
        playerTrendsData: playerTrends,
        transformedData,
        timestamp: new Date().toISOString(),
        source: 'useAdvancedAnalytics + usePlayerTrends hooks'
      };
    } else if (apiAnalytics && Array.isArray(apiAnalytics) && apiAnalytics.length === 0) {
      // ✅ API returns empty array - use mock data (File 1 pattern)
      console.log('⚠️ API returned empty array, using mock data');
      setAnalyticsData(getCurrentSportData());
      setLoading(false);
    } else {
      // No data yet, but loading is false
      setLoading(apiLoading || trendsLoading);
    }
  }, [apiAnalytics, apiLoading, apiError, playerTrends, trendsLoading, trendsError]);

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

  // ✅ Mock data functions - KEEP AS FALLBACK (File 1 pattern)
  const getCurrentSportData = (): AnalyticsData => {
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
            bestOffense: 'Dallas Mavericks (121.4 PPG)',
            bestDefense: 'Boston Celtics (107.8 PPG)',
            mostImproving: 'Orlando Magic (+12 wins)',
            surpriseTeam: 'Oklahoma City Thunder',
            playerToWatch: 'Shai Gilgeous-Alexander',
            fantasyDraftTip: "FanDuel Snake Draft Strategy: Prioritize Jokic, Doncic, Giannis in early rounds."
          },
          playerTrendsData: [] // Empty for mock data
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
            bestOffense: 'Miami Dolphins (31.2 PPG)',
            bestDefense: 'Baltimore Ravens (16.8 PPG)',
            mostImproving: 'Houston Texans (+7 wins)',
            surpriseTeam: 'Detroit Lions',
            playerToWatch: 'C.J. Stroud',
            fantasyDraftTip: "FanDuel Snake Draft Strategy: Target RBs early (McCaffrey, Bijan), then elite WRs."
          },
          playerTrendsData: []
        };
      case 'NHL':
        return {
          overview: {
            totalGames: 1312,
            avgPoints: 6.1, // Changed from avgGoals to avgPoints to match interface
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
            bestOffense: 'Colorado Avalanche (3.8 GPG)',
            bestDefense: 'Vancouver Canucks (2.3 GPG)',
            mostImproving: 'New York Rangers',
            surpriseTeam: 'Winnipeg Jets',
            playerToWatch: 'Connor Bedard',
            fantasyDraftTip: "FanDuel Snake Draft Strategy: Draft elite centers early (McDavid, MacKinnon)."
          },
          playerTrendsData: []
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
          playerTrendsData: []
        };
    }
  };

  // Use real data if available, otherwise use fallback
  const sportData = analyticsData || getCurrentSportData();

  // Event handlers
  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      // In real app, this would filter data
      setFilteredData([]); // Placeholder
    }
  };

  const handleGeneratePredictions = () => {
    setGeneratingPredictions(true);
    setShowSimulationModal(true);
    
    setTimeout(() => {
      setGeneratingPredictions(false);
      setShowSimulationModal(false);
    }, 2000);
  };

  // ✅ Updated refresh function to use hooks' refetch functions
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAnalytics(),
        refetchTrends()
      ]);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnalytics, refetchTrends]);

  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
  };

  const handleMetricChange = (event: any, newValue: string) => {
    setSelectedMetric(newValue);
  };

  // ✅ ADD LOADING STATE (File 1 pattern)
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading advanced analytics...</Typography>
        </Box>
      </Container>
    );
  }

  // ✅ ADD ERROR STATE (File 1 pattern)
  const displayError = error || apiError || trendsError;
  if (displayError) {
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
          playerTrends={sportData.playerTrendsData}
          analyticsData={analyticsData}
        />
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing fallback data • Error occurred: {displayError}
          </Typography>
        </Box>
      </Container>
    );
  }

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
      playerTrends={sportData.playerTrendsData}
      analyticsData={analyticsData}
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
  analyticsData
}: MainContentProps) => {
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
                🤖 AI Analytics & Predictions Hub
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9 }}>
                Advanced analytics, real-time insights & AI predictions
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

  const renderRefreshIndicator = () => (
    <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <RefreshIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="body2" color="text.secondary">
          Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
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

  const renderSportSelector = () => (
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

  const renderMetricTabs = () => (
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

  const renderPredictionGenerator = () => (
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
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<AutoAwesomeIcon />}
          onClick={handleGeneratePredictions}
          disabled={!customQuery.trim() || generatingPredictions}
        >
          {generatingPredictions ? 'Generating...' : 'Generate AI Prediction'}
        </Button>
      </Box>

      <Alert severity="info" icon={<PsychologyIcon />}>
        Uses neural networks, statistical modeling, and historical data for accurate predictions
      </Alert>
    </Paper>
  );

  const renderOverview = () => (
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
                <TimelineIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
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

  const renderTrendingStats = () => (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        🚀 Trending This Season
      </Typography>
      <Grid container spacing={3}>
        {Object.entries(sportData.trendingStats).map(([key, value], index) => (
          <Grid item xs={12} sm={6} key={key}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {key === 'fantasyDraftTip' ? (
                    <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main' }} />
                  ) : (
                    <TrendingUpIcon sx={{ mr: 1, color: index % 2 === 0 ? 'success.main' : 'info.main' }} />
                  )}
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {String(value)} {/* Fixed: Convert to string */}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  const renderAdvancedMetrics = () => (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ScienceIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5">
          🧠 Advanced Metrics
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {Object.entries(sportData.advancedStats).map(([key, value]) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {String(value)} {/* Fixed: Convert to string */}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, Number(value) * 2)} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  // ✅ ADD PlayerTrendsChart component (from File 2 pattern)
  const PlayerTrendsChart = ({ trends }: { trends: any[] }) => {
    if (!trends || trends.length === 0) {
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
                        trend.trend === 'Improving' ? 'success' : 
                        trend.trend === 'Declining' ? 'error' : 'default'
                      }
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {trend.metric || 'Performance Metric'}: {trend.value || 'N/A'}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={trend.change || 0} 
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {trend.change ? `Change: ${trend.change}%` : 'No change data'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // ✅ ADD MetricsDashboard component (from File 2 pattern)
  const MetricsDashboard = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <BarChartIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom>
            📊 Metrics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No metrics data available
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AnalyticsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">
            📊 Advanced Metrics Dashboard
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          {data.slice(0, 4).map((metric: any, index: number) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {metric.name || `Metric ${index + 1}`}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {metric.description || 'No description available'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h4">
                      {metric.value || 'N/A'}
                    </Typography>
                    <Chip 
                      label={metric.unit || ''} 
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderPrompts = () => (
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

  const renderContent = () => {
    switch(selectedMetric) {
      case 'overview':
        return (
          <>
            {renderOverview()}
            {renderTrendingStats()}
            {renderPredictionGenerator()}
            {/* ✅ Add MetricsDashboard (from File 2) */}
            {sportData.rawAnalytics && (
              <MetricsDashboard data={sportData.rawAnalytics[0]?.metrics || []} />
            )}
            {renderPrompts()}
          </>
        );
      case 'advanced':
        return (
          <>
            {renderAdvancedMetrics()}
            {/* ✅ Add PlayerTrendsChart (from File 2) */}
            {playerTrends && playerTrends.length > 0 && (
              <PlayerTrendsChart trends={playerTrends} />
            )}
          </>
        );
      case 'trends':
        return (
          <>
            {/* ✅ Add both components for trends view */}
            {sportData.rawAnalytics && (
              <MetricsDashboard data={sportData.rawAnalytics[0]?.metrics || []} />
            )}
            {playerTrends && playerTrends.length > 0 && (
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
            {playerTrends && playerTrends.length > 0 ? (
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

  const renderSimulationModal = () => (
    <Dialog open={showSimulationModal} onClose={() => !simulating && setShowSimulationModal(false)}>
      <DialogTitle>
        {simulating || generatingPredictions ? 'Processing...' : 'Success!'}
      </DialogTitle>
      <DialogContent>
        {simulating || generatingPredictions ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              {generatingPredictions ? 'Generating Predictions...' : 'Simulating Outcome...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {generatingPredictions 
                ? 'Analyzing data and generating AI predictions' 
                : 'Running simulation with advanced models'
              }
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              {[1, 2, 3].map((step) => (
                <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
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
            <Typography variant="body2" color="text.secondary">
              AI predictions created with 84.2% model confidence
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!(simulating || generatingPredictions) && (
          <Button onClick={() => setShowSimulationModal(false)} variant="contained" fullWidth>
            Continue
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  // Debug banner
  const debugInfo = import.meta.env.DEV && (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="caption">
        🔍 Debug: Using {analyticsData?.rawAnalytics ? 'REAL API DATA via hooks' : 'MOCK DATA'} • 
        Analytics: {sportData.rawAnalytics?.length || 0} • 
        Trends: {playerTrends?.length || 0}
      </Typography>
    </Alert>
  );

  return (
    <Container maxWidth="lg">
      {debugInfo}
      {renderHeader()}
      {renderRefreshIndicator()}
      {renderSportSelector()}
      {renderMetricTabs()}
      {renderContent()}
      
      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="body2" color="text.secondary">
            Tip: Use AI Prediction Generator for custom insights • Change sport for different analytics
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
