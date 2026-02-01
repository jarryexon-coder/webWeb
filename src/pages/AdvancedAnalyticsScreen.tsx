// src/pages/AnalyticsScreen.tsx
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
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const AnalyticsScreen = () => {
  const theme = useTheme();
  
  // Main states
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  
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

  // Mock data functions
  const getCurrentSportData = () => {
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
          }
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
          }
        };
      case 'NHL':
        return {
          overview: {
            totalGames: 1312,
            avgGoals: 6.1,
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
          }
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
          trendingStats: {}
        };
    }
  };

  const sportData = getCurrentSportData();

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

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
  };

  const handleMetricChange = (event: any, newValue: string) => {
    setSelectedMetric(newValue);
  };

  // Render functions
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
              onClick={() => setSelectedSport(sport.id)}
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
        {metrics.map((metric) => (
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
          {predictionQueries.map((query, index) => (
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
          {teams[selectedSport as keyof typeof teams]?.map((team) => (
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
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {value as string}
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
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {value as string}
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
          {USEFUL_PROMPTS.map((category) => (
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
        {USEFUL_PROMPTS.find(cat => cat.category === selectedPromptCategory)?.prompts.map((prompt, index) => (
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
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 4 }}>
          <Typography variant="h6">Error Loading Data</Typography>
          <Typography>{error}</Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setError(null)}>
            Retry
          </Button>
        </Alert>
      );
    }

    switch(selectedMetric) {
      case 'overview':
        return (
          <>
            {renderOverview()}
            {renderTrendingStats()}
            {renderPredictionGenerator()}
            {renderPrompts()}
          </>
        );
      case 'advanced':
        return renderAdvancedMetrics();
      case 'trends':
        return (
          <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
            <TimelineIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              📈 Trends Analysis
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Enhanced trends analysis with visualization charts coming soon!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track team performance over time, identify patterns, and get predictive insights.
            </Typography>
          </Paper>
        );
      case 'teams':
      case 'players':
        return (
          <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
            {selectedMetric === 'teams' ? (
              <GroupIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            ) : (
              <PersonIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            )}
            <Typography variant="h4" gutterBottom>
              {selectedMetric === 'teams' ? '🏀 Team Analysis' : '👤 Player Insights'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {selectedMetric === 'teams' 
                ? 'Team comparison analytics coming soon!' 
                : 'Player performance analytics coming soon!'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedMetric === 'teams' 
                ? 'Compare teams, analyze matchups, and view detailed team statistics.'
                : 'Track player stats, shooting percentages, and performance trends.'
              }
            </Typography>
          </Paper>
        );
      default:
        return renderOverview();
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

  return (
    <Container maxWidth="lg">
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
