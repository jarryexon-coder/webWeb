// src/pages/PredictionsOutcomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  LinearProgress,
  CircularProgress,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Modal,
  Backdrop,
  Fade,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  SportsSoccer as SoccerIcon,
  SportsMartialArts as MartialArtsIcon,
  AutoAwesome as SparklesIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp,
  TrendingDown,
  Security as ShieldIcon,
  Info as InfoIcon,
  PlayArrow as PlayArrowIcon,
  Bookmark as BookmarkIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  RestartAlt as RestartAltIcon,
  Lightbulb as LightbulbIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Sports as SportsIcon,
  Star as StarIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { LocalStorageProvider } from '../providers/LocalStorageProvider';

// Mock data for predictions
const mockPredictions = [
  {
    id: '1',
    type: 'Game Outcome',
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Boston Celtics',
    league: 'NBA',
    predictedWinner: 'Golden State Warriors',
    predictedScore: 'GSW 112-108 BOS',
    spread: 'GSW -4.5',
    overUnder: 'Over 220.5',
    confidence: 85,
    moneyline: '-150',
    analysis: 'Warriors home advantage strong. Curry averaging 32.1 PPG last 5 games. Celtics 2-3 on road trips.',
    timestamp: 'Today, 8:30 PM ET',
    model: 'Neural Network',
    modelAccuracy: '82.4%',
    keyStats: 'GSW: 24-8 home, BOS: 18-14 away',
    trend: 'Warriors 7-3 last 10',
    requiresPremium: false,
  },
  {
    id: '2',
    type: 'Player Prop',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    league: 'NFL',
    predictedWinner: 'Patrick Mahomes Over 2.5 Passing TDs',
    predictedScore: 'KC 27-24 BUF',
    spread: 'Over 2.5 TDs',
    overUnder: 'N/A',
    confidence: 78,
    moneyline: '+120',
    analysis: 'Mahomes averaging 3.2 TD passes vs AFC East. Bills secondary allows 7.8 YPA.',
    timestamp: 'Tomorrow, 4:25 PM ET',
    model: 'Statistical Model',
    modelAccuracy: '75.2%',
    keyStats: 'Mahomes: 24 TD, 5 INT vs Bills',
    trend: 'Over 8-2 last 10 AFC matchups',
    requiresPremium: true,
  },
  {
    id: '3',
    type: 'Team Total',
    homeTeam: 'Tampa Bay Lightning',
    awayTeam: 'Toronto Maple Leafs',
    league: 'NHL',
    predictedWinner: 'Toronto Over 3.5 Goals',
    predictedScore: 'TOR 4-3 TB',
    spread: 'Over 3.5',
    overUnder: 'Over 6.5',
    confidence: 72,
    moneyline: '-110',
    analysis: 'Leafs power play clicking at 28.4%. Vasilevskiy struggling on road (3.12 GAA).',
    timestamp: 'Tonight, 7:00 PM ET',
    model: 'ML Model',
    modelAccuracy: '82.4%',
    keyStats: 'TOR: 3.8 GPG home, TB: 3.2 GAA away',
    trend: 'Over 8-2 in last 10 matchups',
    requiresPremium: false,
  },
  {
    id: '4',
    type: 'Player Prop',
    homeTeam: 'Los Angeles Dodgers',
    awayTeam: 'San Francisco Giants',
    league: 'MLB',
    predictedWinner: 'Mookie Betts Over 1.5 Hits',
    predictedScore: 'LAD 5-3 SF',
    spread: 'Over 1.5',
    overUnder: 'N/A',
    confidence: 68,
    moneyline: '+140',
    analysis: 'Betts batting .342 vs lefties. Webb allows .312 BAA to right-handed hitters.',
    timestamp: 'Tomorrow, 7:10 PM ET',
    model: 'Statistical Model',
    modelAccuracy: '72.1%',
    keyStats: 'Betts: .312 vs Giants this season',
    trend: 'Over hit 7 of last 10 games',
    requiresPremium: false,
  },
];

const leagueData = [
  { id: 'All', name: 'All Leagues', icon: <SportsIcon />, color: '#059669' },
  { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
  { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#f59e0b' },
  { id: 'Soccer', name: 'Soccer', icon: <SoccerIcon />, color: '#10b981' },
  { id: 'UFC', name: 'UFC', icon: <MartialArtsIcon />, color: '#8b5cf6' },
];

const timeframeData = [
  { id: 'Today', name: 'Today' },
  { id: 'Tomorrow', name: 'Tomorrow' },
  { id: 'Week', name: 'Week' },
  { id: 'All Upcoming', name: 'All Upcoming' },
];

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

// Daily Prediction Generator Component
const DailyPredictionGenerator = ({ onGenerate, isGenerating }: { onGenerate: () => void, isGenerating: boolean }) => {
  const [generatedToday, setGeneratedToday] = useState(false);
  const [dailyPredictions, setDailyPredictions] = useState<any[]>([]);

  useEffect(() => {
    checkDailyGeneration();
    generateDailyPredictions();
  }, []);

  const checkDailyGeneration = async () => {
    try {
      const today = new Date().toDateString();
      const lastGenerated = localStorage.getItem('last_prediction_generation');
      setGeneratedToday(lastGenerated === today);
    } catch (error) {
      console.error('Error checking daily generation:', error);
    }
  };

  const generateDailyPredictions = () => {
    const predictions = [
      {
        id: 1,
        type: 'Player Prop',
        sport: 'NBA',
        title: 'LeBron James Over 28.5 Points',
        confidence: 92,
        analysis: 'Facing weak perimeter defense. Averaging 30.2 PPG last 5 games.',
        odds: '-120',
        probability: '82%',
        keyStat: '24.8% usage rate vs opponent',
        trend: 'Over hit 8 of last 10 games',
        timestamp: 'Today • 8:00 PM ET'
      },
      {
        id: 2,
        type: 'Team Total',
        sport: 'NFL',
        title: 'Kansas City Chiefs Over 27.5 Points',
        confidence: 88,
        analysis: 'Mahomes vs 24th ranked pass defense. Home game advantage.',
        odds: '-110',
        probability: '76%',
        keyStat: 'Chiefs 6-1 Over at home this season',
        trend: 'Over 9-3 in last 12 home games',
        timestamp: 'Tomorrow • 4:25 PM ET'
      }
    ];
    setDailyPredictions(predictions);
  };

  const handleGenerate = () => {
    const today = new Date().toDateString();
    localStorage.setItem('last_prediction_generation', today);
    setGeneratedToday(true);
    onGenerate?.();
    alert('Predictions Generated!\n2 high-probability predictions have been generated for today.');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Player Prop': return '#8b5cf6';
      case 'Team Total': return '#3b82f6';
      default: return '#059669';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#10b981';
    if (confidence >= 85) return '#3b82f6';
    return '#f59e0b';
  };

  return (
    <Card sx={{ 
      mb: 4, 
      borderRadius: 3,
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid',
      borderColor: 'divider',
      overflow: 'visible'
    }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#f59e0b20', color: '#f59e0b' }}>
              <SparklesIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="white">
                Daily Prediction Generator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2 high-probability picks generated daily
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={generatedToday ? <CheckCircleIcon /> : <SparklesIcon />}
            onClick={handleGenerate}
            disabled={generatedToday || isGenerating}
            sx={{
              background: generatedToday 
                ? 'linear-gradient(135deg, #334155 0%, #475569 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              '&:hover': {
                opacity: 0.9
              }
            }}
          >
            {isGenerating ? 'Generating...' : generatedToday ? 'Generated Today' : "Generate Today's Picks"}
          </Button>
        </Box>

        {/* Predictions Grid */}
        {dailyPredictions.length > 0 ? (
          <Grid container spacing={2}>
            {dailyPredictions.map((prediction) => (
              <Grid item xs={12} md={6} key={prediction.id}>
                <Card sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}>
                  <CardContent>
                    {/* Prediction Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip
                          label={prediction.type}
                          size="small"
                          sx={{ 
                            bgcolor: alpha(getTypeColor(prediction.type), 0.1),
                            color: getTypeColor(prediction.type),
                            borderColor: alpha(getTypeColor(prediction.type), 0.3)
                          }}
                        />
                        <Chip
                          label={prediction.sport}
                          size="small"
                          sx={{ bgcolor: '#475569', color: 'white' }}
                        />
                      </Box>
                      <Chip
                        label={`${prediction.confidence}%`}
                        size="small"
                        sx={{ 
                          bgcolor: getConfidenceColor(prediction.confidence),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>

                    {/* Prediction Title */}
                    <Typography variant="h6" fontWeight="bold" color="white" mb={2}>
                      {prediction.title}
                    </Typography>

                    {/* Stats Row */}
                    <Box display="flex" justifyContent="space-between" mb={2} p={2} bgcolor="rgba(30, 41, 59, 0.8)" borderRadius={1}>
                      {[
                        { label: 'Probability', value: prediction.probability },
                        { label: 'Odds', value: prediction.odds },
                        { label: 'Edge', value: `+${Math.floor(prediction.confidence / 10)}%` }
                      ].map((stat, idx) => (
                        <Box key={idx} textAlign="center">
                          <Typography variant="caption" color="text.secondary" display="block">
                            {stat.label}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="white">
                            {stat.value}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Analysis */}
                    <Typography variant="body2" color="text.secondary" mb={2} fontStyle="italic">
                      {prediction.analysis}
                    </Typography>

                    {/* Footer */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="#059669" fontWeight="medium">
                        {prediction.keyStat}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prediction.timestamp}
                      </Typography>
                    </Box>

                    {/* Trend */}
                    <Chip
                      icon={<TrendingUp />}
                      label={prediction.trend}
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#059669', 0.1),
                        color: '#059669',
                        fontWeight: 'medium'
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={4}>
            <AnalyticsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No predictions generated yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tap generate to create today's picks
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box display="flex" alignItems="center" mt={3} pt={2} borderTop="1px solid" borderColor="divider">
          <ShieldIcon sx={{ fontSize: 16, color: '#059669', mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            • Updated daily at 9 AM ET • AI-powered analysis • High-probability focus
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Game Analytics Box Component
const GameAnalyticsBox = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [predictionStats, setPredictionStats] = useState({
    accuracy: '76.8%',
    correctGames: '134',
    totalGames: '175',
    profitUnits: '+48.2',
    modelConfidence: 'High',
    propAccuracy: '71.2%',
    teamTotalAccuracy: '68.9%',
    playerPropAccuracy: '74.3%'
  });

  const loadAnalyticsEvents = async () => {
    try {
      const eventsString = localStorage.getItem('prediction_analytics');
      if (eventsString) {
        const events = JSON.parse(eventsString);
        setAnalyticsEvents(events.slice(-10).reverse());
      }
    } catch (error) {
      console.error('Failed to load analytics events', error);
    }
  };

  const clearAnalyticsEvents = async () => {
    try {
      localStorage.removeItem('prediction_analytics');
      setAnalyticsEvents([]);
      alert('Analytics Cleared\nAll prediction analytics cleared.');
    } catch (error) {
      console.error('Failed to clear analytics events', error);
    }
  };

  useEffect(() => {
    loadAnalyticsEvents();
  }, []);

  if (!showAnalytics) {
    return (
      <Button
        variant="contained"
        startIcon={<BarChartIcon />}
        onClick={() => setShowAnalytics(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: '#059669',
          '&:hover': {
            bgcolor: '#047857'
          },
          borderRadius: 8,
          zIndex: 1000
        }}
      >
        Prediction Stats
      </Button>
    );
  }

  return (
    <Modal
      open={showAnalytics}
      onClose={() => setShowAnalytics(false)}
      closeAfterTransition
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2 
      }}
    >
      <Fade in={showAnalytics}>
        <Paper sx={{ 
          width: { xs: '95%', md: 600 },
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 3,
          bgcolor: 'background.paper'
        }}>
          <CardContent>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <TrophyIcon color="primary" />
                <Typography variant="h5" fontWeight="bold">
                  Prediction Analytics
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton onClick={clearAnalyticsEvents} color="error" size="small">
                  <RestartAltIcon />
                </IconButton>
                <IconButton onClick={() => setShowAnalytics(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={2} mb={3}>
              {[
                { label: 'Overall Accuracy', value: predictionStats.accuracy, color: '#059669' },
                { label: 'Prop Accuracy', value: predictionStats.propAccuracy, color: '#8b5cf6' },
                { label: 'Team Total', value: predictionStats.teamTotalAccuracy, color: '#3b82f6' },
                { label: 'Player Props', value: predictionStats.playerPropAccuracy, color: '#f59e0b' }
              ].map((stat, idx) => (
                <Grid item xs={6} sm={3} key={idx}>
                  <Box textAlign="center">
                    <Avatar sx={{ 
                      bgcolor: alpha(stat.color, 0.1), 
                      color: stat.color,
                      width: 70,
                      height: 70,
                      mx: 'auto',
                      mb: 1,
                      border: `2px solid ${alpha(stat.color, 0.2)}`
                    }}>
                      <Typography variant="h6" fontWeight="bold">
                        {stat.value}
                      </Typography>
                    </Avatar>
                    <Typography variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Performance Metrics */}
            <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TrendingUpIcon color="success" />
                  <Typography variant="h6" fontWeight="medium">
                    Performance Metrics
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Correct Predictions
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {predictionStats.correctGames}/{predictionStats.totalGames}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Profit Units
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {predictionStats.profitUnits}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Predictions */}
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Recent Predictions
            </Typography>
            
            {analyticsEvents.length === 0 ? (
              <Box textAlign="center" py={4}>
                <TrophyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No prediction events recorded
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {analyticsEvents.map((event, index) => (
                  <ListItem key={index} sx={{ 
                    mb: 1, 
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: event.result === 'win' ? 'success.main' : 
                                 event.result === 'loss' ? 'error.main' : 'warning.main',
                        width: 32,
                        height: 32
                      }}>
                        {event.result === 'win' ? '✓' : event.result === 'loss' ? '✗' : '⏱'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={event.game}
                      secondary={event.prediction}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <ListItemSecondaryAction>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {/* Export Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify({
                  stats: predictionStats,
                  events: analyticsEvents
                }, null, 2));
                alert('Prediction data copied to clipboard.');
              }}
              sx={{ mt: 2 }}
            >
              Export Data
            </Button>
          </CardContent>
        </Paper>
      </Fade>
    </Modal>
  );
};

// Main Predictions Screen Component
const PredictionsOutcomeScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');
  const [customQuery, setCustomQuery] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [predictions, setPredictions] = useState(mockPredictions);
  const [filteredPredictions, setFilteredPredictions] = useState(mockPredictions);
  const [showSearch, setShowSearch] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPredictions(predictions);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = predictions.filter(pred => 
      pred.homeTeam.toLowerCase().includes(lowerQuery) ||
      pred.awayTeam.toLowerCase().includes(lowerQuery) ||
      pred.league.toLowerCase().includes(lowerQuery) ||
      pred.type.toLowerCase().includes(lowerQuery) ||
      pred.predictedWinner.toLowerCase().includes(lowerQuery)
    );

    setFilteredPredictions(filtered);
  };

  const handleGeneratePredictions = () => {
    setGeneratingPredictions(true);
    setTimeout(() => {
      setGeneratingPredictions(false);
      alert('Predictions Generated!\nDaily predictions have been successfully generated.');
    }, 2000);
  };

  const simulateOutcome = async (predictionId: string) => {
    setSimulating(true);
    setShowSimulationModal(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setSimulating(false);
    } catch (error) {
      console.error('Error simulating outcome:', error);
      setSimulating(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#059669';
    if (confidence >= 70) return '#3b82f6';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Game Outcome': return '#059669';
      case 'Player Prop': return '#8b5cf6';
      case 'Team Total': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const renderPredictionCard = (prediction: any) => {
    const confidenceColor = getConfidenceColor(prediction.confidence);
    const typeColor = getTypeColor(prediction.type);

    return (
      <Card key={prediction.id} sx={{ mb: 3 }}>
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Chip
              label={prediction.type}
              size="small"
              sx={{ 
                bgcolor: alpha(typeColor, 0.1),
                color: typeColor,
                borderColor: alpha(typeColor, 0.3)
              }}
            />
            <Chip
              label={`${prediction.confidence}%`}
              size="small"
              sx={{ 
                bgcolor: confidenceColor,
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* Game Info */}
          {prediction.type === 'Game Outcome' ? (
            <Box mb={3}>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoIcon sx={{ color: '#059669', mr: 1, fontSize: 16 }} />
                <Typography variant="body2" fontWeight="medium">
                  {prediction.homeTeam}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" textAlign="center" my={1}>
                vs
              </Typography>
              <Box display="flex" alignItems="center">
                <LaunchIcon sx={{ color: '#ef4444', mr: 1, fontSize: 16 }} />
                <Typography variant="body2" fontWeight="medium">
                  {prediction.awayTeam}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="h6" fontWeight="bold" mb={2}>
              {prediction.predictedWinner}
            </Typography>
          )}

          {/* Prediction Display */}
          <Box display="flex" alignItems="center" p={2} bgcolor={alpha('#f59e0b', 0.1)} borderRadius={2} mb={2}>
            <TrophyIcon sx={{ color: '#f59e0b', mr: 2 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#f59e0b">
                {prediction.type === 'Game Outcome' ? `🏆 ${prediction.predictedWinner}` : prediction.predictedWinner}
              </Typography>
              {prediction.predictedScore && (
                <Typography variant="body1" fontWeight="bold">
                  {prediction.predictedScore}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Betting Lines */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={4}>
              <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                <Typography variant="caption" color="text.secondary">
                  {prediction.type === 'Game Outcome' ? 'Spread' : 'Line'}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {prediction.spread}
                </Typography>
              </Box>
            </Grid>
            {prediction.overUnder !== 'N/A' && (
              <Grid item xs={4}>
                <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="caption" color="text.secondary">
                    Over/Under
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {prediction.overUnder}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item xs={4}>
              <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                <Typography variant="caption" color="text.secondary">
                  Odds
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {prediction.moneyline}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Model Info */}
          <Box mb={2}>
            <Chip
              icon={<AnalyticsIcon />}
              label={`${prediction.model} • ${prediction.modelAccuracy}`}
              size="small"
              sx={{ 
                bgcolor: alpha('#3b82f6', 0.1),
                color: '#3b82f6',
                mb: 1
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {prediction.keyStats}
            </Typography>
            <Typography variant="body2" color="#8b5cf6" fontStyle="italic">
              Trend: {prediction.trend}
            </Typography>
          </Box>

          {/* Analysis */}
          <Box display="flex" p={2} bgcolor={alpha('#8b5cf6', 0.1)} borderRadius={2} mb={2}>
            <LightbulbIcon sx={{ color: '#3b82f6', mr: 1 }} />
            <Typography variant="body2" color={prediction.requiresPremium ? 'text.disabled' : 'text.primary'}>
              {prediction.requiresPremium ? '🔒 Premium analysis available' : prediction.analysis}
            </Typography>
          </Box>

          {/* Footer */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Chip
                label={prediction.league}
                size="small"
                sx={{ bgcolor: '#334155', color: 'white' }}
              />
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {prediction.timestamp}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                size="small"
                onClick={() => simulateOutcome(prediction.id)}
                disabled={simulating}
                sx={{ 
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' }
                }}
              >
                Simulate
              </Button>
              <Button
                variant="contained"
                startIcon={<BookmarkIcon />}
                size="small"
                onClick={() => {
                  if (prediction.requiresPremium) {
                    alert('This prediction requires premium access.');
                    return;
                  }
                  alert('Prediction added to tracked predictions.');
                }}
                sx={{ 
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' }
                }}
              >
                Track
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Loading Predictions...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        borderRadius: 3,
        mb: 4,
        mt: 2,
        p: 3,
        color: 'white'
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            variant="outlined"
          >
            Back
          </Button>
          <IconButton onClick={() => setShowSearch(!showSearch)} sx={{ color: 'white' }}>
            <SearchIcon />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <AnalyticsIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              AI Predictions Hub
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Game outcomes, player props & team totals
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search Bar */}
      {showSearch && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              placeholder="Search predictions by type, league, or team..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchInput)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="contained" 
              onClick={() => handleSearch(searchInput)}
              sx={{ minWidth: 120 }}
            >
              Search
            </Button>
          </Box>
          
          {searchQuery && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredPredictions.length} of {predictions.length} predictions match "{searchQuery}"
              </Typography>
              <Button size="small" onClick={() => {
                setSearchQuery('');
                setSearchInput('');
                handleSearch('');
              }}>
                Clear
              </Button>
            </Box>
          )}
        </Paper>
      )}

      <DailyPredictionGenerator 
        onGenerate={handleGeneratePredictions}
        isGenerating={generatingPredictions}
      />

      {/* Timeframe Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Timeframe
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {timeframeData.map((timeframe) => (
            <Chip
              key={timeframe.id}
              label={timeframe.name}
              onClick={() => setSelectedTimeframe(timeframe.id)}
              color={selectedTimeframe === timeframe.id ? 'primary' : 'default'}
              variant={selectedTimeframe === timeframe.id ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </Paper>

      {/* League Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Leagues
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {leagueData.map((league) => (
            <Chip
              key={league.id}
              icon={league.icon}
              label={league.name}
              onClick={() => setSelectedLeague(league.id)}
              color={selectedLeague === league.id ? 'primary' : 'default'}
              variant={selectedLeague === league.id ? 'filled' : 'outlined'}
              sx={{
                ...(selectedLeague === league.id && {
                  bgcolor: league.color,
                  color: 'white',
                  '&:hover': { bgcolor: league.color }
                })
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* AI Prediction Generator */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              🤖 AI Prediction Generator
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate custom predictions using advanced AI models
            </Typography>
          </Box>

          {/* Query Chips */}
          <Box sx={{ mb: 3, overflow: 'auto' }}>
            <Box display="flex" gap={1} flexWrap="wrap">
              {predictionQueries.map((query, index) => (
                <Chip
                  key={index}
                  label={query}
                  onClick={() => setCustomQuery(query)}
                  icon={<SparklesIcon />}
                  sx={{ 
                    mb: 1,
                    bgcolor: alpha('#8b5cf6', 0.1),
                    color: '#8b5cf6',
                    '&:hover': { bgcolor: alpha('#8b5cf6', 0.2) }
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Custom Query Input */}
          <Box mb={3}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Enter custom prediction query (e.g., 'Generate NBA player props for tonight')"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TimelineIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Generate Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<SparklesIcon />}
            onClick={() => customQuery.trim() && simulateOutcome('custom')}
            disabled={!customQuery.trim() || simulating}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' },
              py: 1.5
            }}
          >
            {simulating ? 'Generating...' : 'Generate Prediction'}
          </Button>

          {/* Info Footer */}
          <Box display="flex" alignItems="center" mt={2} p={1} bgcolor="action.hover" borderRadius={1}>
            <InfoIcon sx={{ color: '#8b5cf6', mr: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Uses neural networks, statistical modeling, and historical data for accurate predictions
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Latest Predictions */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            📊 Latest Predictions
          </Typography>
          <Chip
            label={`${filteredPredictions.length} predictions • ${selectedTimeframe}`}
            sx={{ 
              bgcolor: alpha('#8b5cf6', 0.1),
              color: '#8b5cf6',
              fontWeight: 'bold'
            }}
          />
        </Box>

        {filteredPredictions.length > 0 ? (
          <Grid container spacing={3}>
            {filteredPredictions.map((prediction) => (
              <Grid item xs={12} key={prediction.id}>
                {renderPredictionCard(prediction)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AnalyticsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            {searchQuery ? (
              <>
                <Typography variant="h6" gutterBottom>
                  No predictions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try a different search or filter
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  No predictions available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back for new predictions
                </Typography>
              </>
            )}
          </Paper>
        )}
      </Box>

      {/* Simulation Modal */}
      <Modal
        open={showSimulationModal}
        onClose={() => !simulating && setShowSimulationModal(false)}
        closeAfterTransition
      >
        <Fade in={showSimulationModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 4
          }}>
            {simulating ? (
              <Box textAlign="center">
                <CircularProgress size={60} sx={{ color: '#8b5cf6', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Generating Prediction...
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Analyzing data and generating AI prediction
                </Typography>
                
                {/* Processing Steps */}
                <Box display="flex" justifyContent="center" mt={3} mb={2}>
                  {[1, 2, 3].map((step) => (
                    <Box key={step} display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: step <= 2 ? '#8b5cf6' : '#e2e8f0',
                          mr: step < 3 ? 1 : 0
                        }}
                      />
                      {step < 3 && (
                        <Box
                          sx={{
                            width: 25,
                            height: 3,
                            bgcolor: '#e2e8f0',
                            mr: 1
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box textAlign="center">
                <Avatar sx={{ 
                  bgcolor: '#8b5cf6', 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2 
                }}>
                  <SparklesIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Prediction Generated!
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  AI prediction created with 84.2% model confidence
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setShowSimulationModal(false)}
                  sx={{ mt: 3, bgcolor: '#8b5cf6' }}
                >
                  View Prediction
                </Button>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* Floating Search Button */}
      {!showSearch && (
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={() => setShowSearch(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            bgcolor: '#8b5cf6',
            '&:hover': { bgcolor: '#7c3aed' },
            borderRadius: 8,
            zIndex: 1000
          }}
        >
          Search
        </Button>
      )}

      <GameAnalyticsBox />
    </Container>
  );
};

export default PredictionsOutcomeScreen;
