// src/pages/ParlayArchitectScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
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
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
// import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'; // Removed duplicate
import { Link, useNavigate } from 'react-router-dom';
// import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'; // Removed duplicate
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Speed as SpeedometerIcon,
  MonitorHeart as PulseIcon,
  BarChart as BarChartIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  Merge as MergeIcon,
  SportsFootball as FootballIcon,
  SportsBasketball as BasketballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  SportsSoccer as SoccerIcon,
  SportsMartialArts as MartialArtsIcon,
  LocalFireDepartment as FireIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  Shuffle as ShuffleIcon,
  Security as ShieldIcon,
  Whatshot as FlameIcon,
  DarkMode as DarkModeIcon,
  Gamepad as GamepadIcon,
  Wallet as WalletIcon,
  Layers as LayersIcon,
  AttachMoney as CashIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  People as PeopleIcon
} from '@mui/icons-material';
// import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'; // Removed duplicate
import { alpha } from '@mui/material/styles';

// Mock data for players and picks
const mockPlayers = [
  { 
    id: '1', 
    name: 'Stephen Curry', 
    team: 'GSW', 
    sport: 'NBA', 
    position: 'Points', 
    line: 'Over 31.5', 
    confidence: 88, 
    edge: '+4.7%', 
    category: 'High Probability',
    aiPrediction: 'Shooting 45% from 3 last 10 games'
  },
  { 
    id: '2', 
    name: 'Patrick Mahomes', 
    team: 'KC', 
    sport: 'NFL', 
    position: 'Passing Yards', 
    line: 'Over 285.5', 
    confidence: 82, 
    edge: '+5.2%', 
    category: 'Value Bet',
    aiPrediction: 'Facing 28th ranked pass defense'
  },
  { 
    id: '3', 
    name: 'Connor McDavid', 
    team: 'EDM', 
    sport: 'NHL', 
    position: 'Points', 
    line: 'Over 1.5', 
    confidence: 79, 
    edge: '+6.8%', 
    category: 'Contrarian Play',
    aiPrediction: 'Averaging 1.8 points per game'
  },
  { 
    id: '4', 
    name: 'Shohei Ohtani', 
    team: 'LAA', 
    sport: 'MLB', 
    position: 'Total Bases', 
    line: 'Over 1.5', 
    confidence: 75, 
    edge: '+7.1%', 
    category: 'High Probability',
    aiPrediction: 'Batting .312 vs left-handed pitchers'
  },
  { 
    id: '5', 
    name: 'Nikola Jokic', 
    team: 'DEN', 
    sport: 'NBA', 
    position: 'Assists', 
    line: 'Over 9.5', 
    confidence: 85, 
    edge: '+3.9%', 
    category: 'High Probability',
    aiPrediction: 'Primary playmaker with 35% usage rate'
  },
  { 
    id: '6', 
    name: 'Josh Allen', 
    team: 'BUF', 
    sport: 'NFL', 
    position: 'Passing TDs', 
    line: 'Over 1.5', 
    confidence: 68, 
    edge: '+9.5%', 
    category: 'Value Bet',
    aiPrediction: 'Red zone efficiency at 68%'
  },
];

const sportsData = [
  { id: 'All', name: 'All Sports', icon: <TimelineIcon />, color: '#f59e0b' },
  { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
  { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#10b981' },
];

const parlayPrompts = [
  "Build 3-leg NBA parlay with high probability",
  "Generate mixed sports parlay (NBA + NFL)",
  "Create 2-leg moneyline parlay for tonight",
  "Build value parlay with +500 odds target",
  "Generate correlated parlay for primetime games",
  "Create 3-leg player props parlay",
  "Build underdog parlay with good value",
  "Generate same-game parlay for featured matchup",
  "Create over/under parlay across multiple sports",
  "Build balanced parlay with 70%+ win probability"
];

// Three-Leg Parlay Generator Component
const ThreeLegParlayGenerator = ({ 
  onGenerate, 
  isGenerating, 
  selectedSport = 'All',
  parlayLegs = 3,
  autoBalanceEnabled = true 
}: { 
  onGenerate: (parlays: any[]) => void, 
  isGenerating: boolean, 
  selectedSport: string, 
  parlayLegs: number, 
  autoBalanceEnabled: boolean 
}) => {
  const [generatedParlays, setGeneratedParlays] = useState<any[]>([]);
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'mixed',
    riskLevel: 'moderate',
    timeframe: 'tonight'
  });

  const generateSmartParlays = (filters = {}) => {
    const sportsList = selectedSport === 'All' 
      ? ['NBA', 'NFL', 'NHL', 'MLB'] 
      : [selectedSport];
    
    const parlays = [];

    // Generate 3 different parlay options
    for (let i = 0; i < 3; i++) {
      const legs = [];
      for (let j = 0; j < parlayLegs; j++) {
        const sport = sportsList[Math.floor(Math.random() * sportsList.length)];
        legs.push({
          id: `${i}-${j}`,
          sport,
          pick: `Over ${Math.floor(Math.random() * 10) + 25}.5 Points`,
          odds: ['-150', '-110', '+120', '+180'][Math.floor(Math.random() * 4)],
          confidence: Math.floor(Math.random() * 20) + 70,
          edge: `+${(8 + Math.random() * 12).toFixed(1)}%`,
          analysis: 'Strong value play with positive expected value',
          type: ['Points', 'Assists', 'Rebounds', 'Yards'][Math.floor(Math.random() * 4)],
          keyStat: 'Player averaging 28.4 PPG vs opponent',
          matchup: 'Featured matchup tonight'
        });
      }

      parlays.push({
        id: `parlay-${Date.now()}-${i}`,
        type: ['Cross-Sport Value', 'Multi-Sport Smash', 'Spread Mix'][i],
        legs,
        totalOdds: '+425',
        winProbability: `${Math.floor(Math.random() * 20) + 65}%`,
        expectedValue: `+${(5 + Math.random() * 15).toFixed(1)}%`,
        maxPayout: '$525 on $100',
        riskLevel: selectedFilters.riskLevel,
        strategy: 'Diversify risk across multiple sports and markets',
        correlation: 'Low (Diversified)',
        bestUsed: 'Weekly Play',
        timestamp: 'Live Tonight',
        confidenceScore: Math.floor(Math.random() * 30) + 70,
        recommendedStake: '2.5% of bankroll'
      });
    }

    return parlays;
  };

  const handleGenerate = async () => {
    const newParlays = generateSmartParlays(selectedFilters);
    setGeneratedParlays(newParlays);
    onGenerate?.(newParlays);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'conservative': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'aggressive': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getFilterIcon = (filterType: string, value: string) => {
    switch (filterType) {
      case 'type':
        return value === 'mixed' ? <ShuffleIcon /> : <GamepadIcon />;
      case 'riskLevel':
        return value === 'conservative' ? <ShieldIcon /> : <FlameIcon />;
      case 'timeframe':
        return <DarkModeIcon />;
      default:
        return <FilterListIcon />;
    }
  };

  const getFilterColor = (filterType: string, value: string) => {
    switch (filterType) {
      case 'type':
        return value === 'mixed' ? '#f59e0b' : '#f59e0b';
      case 'riskLevel':
        return value === 'conservative' ? '#10b981' : '#ef4444';
      case 'timeframe':
        return '#8b5cf6';
      default:
        return '#94a3b8';
    }
  };

  return (
    <Card sx={{ 
      mb: 4, 
      borderRadius: 3,
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      border: '1px solid',
      borderColor: 'divider'
    }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#f59e0b20', color: '#f59e0b' }}>
              <MergeIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="white">
                3-Leg Parlay Architect
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Smart parlay builder with risk management
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <BuildIcon />}
            onClick={handleGenerate}
            disabled={isGenerating}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              '&:hover': {
                opacity: 0.9
              }
            }}
          >
            {isGenerating ? 'Building...' : 'Build Smart Parlays'}
          </Button>
        </Box>

        {/* Filters */}
        <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
          {Object.entries(selectedFilters).map(([key, value]) => (
            <Chip
              key={key}
              icon={getFilterIcon(key, value)}
              label={
                key === 'type' ? (value === 'mixed' ? 'Mixed Sports' : 'Same Game') :
                key === 'riskLevel' ? (value === 'conservative' ? 'Conservative' : value === 'moderate' ? 'Moderate' : 'Aggressive') :
                'Tonight'
              }
              onClick={() => {
                const options = {
                  type: ['mixed', 'same_game'],
                  riskLevel: ['conservative', 'moderate', 'aggressive'],
                  timeframe: ['tonight', 'tomorrow', 'weekend']
                };
                const currentIndex = options[key as keyof typeof options].indexOf(value);
                const nextIndex = (currentIndex + 1) % options[key as keyof typeof options].length;
                setSelectedFilters(prev => ({ ...prev, [key]: options[key as keyof typeof options][nextIndex] }));
              }}
              sx={{
                bgcolor: alpha(getFilterColor(key, value), 0.1),
                color: getFilterColor(key, value),
                borderColor: alpha(getFilterColor(key, value), 0.3),
                '&:hover': {
                  bgcolor: alpha(getFilterColor(key, value), 0.2)
                }
              }}
            />
          ))}
        </Box>

        {/* Generated Parlays */}
        {generatedParlays.length > 0 ? (
          <Grid container spacing={2}>
            {generatedParlays.map((parlay) => (
              <Grid item xs={12} key={parlay.id}>
                <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                  <CardContent>
                    {/* Parlay Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip
                        icon={<MergeIcon />}
                        label={parlay.type}
                        sx={{ 
                          bgcolor: alpha('#f59e0b', 0.1),
                          color: '#f59e0b',
                          fontWeight: 'bold'
                        }}
                      />
                      <Chip
                        label={parlay.riskLevel.toUpperCase()}
                        sx={{ 
                          bgcolor: getRiskColor(parlay.riskLevel),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" color="white" mb={2}>
                      {parlayLegs}-Leg Parlay
                    </Typography>

                    {/* Legs */}
                    <Grid container spacing={1} mb={2}>
                      {parlay.legs.map((leg: any, index: number) => (
                        <Grid item xs={12} key={index}>
                          <Paper sx={{ p: 1, bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ color: '#3b82f6' }}>
                                  {leg.sport === 'NBA' ? <BasketballIcon fontSize="small" /> :
                                   leg.sport === 'NFL' ? <FootballIcon fontSize="small" /> :
                                   leg.sport === 'NHL' ? <HockeyIcon fontSize="small" /> :
                                   <BaseballIcon fontSize="small" />}
                                </Box>
                                <Typography variant="caption" color="#3b82f6" fontWeight="medium">
                                  {leg.sport}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {leg.type}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {leg.pick}
                            </Typography>
                            <Box display="flex" justifyContent="space-between" mt={0.5}>
                              <Typography variant="caption" color="success.main" fontWeight="bold">
                                {leg.odds}
                              </Typography>
                              <Typography variant="caption" color="warning.main" fontWeight="medium">
                                {leg.confidence}%
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>

                    {/* Parlay Metrics */}
                    <Grid container spacing={1} mb={2}>
                      <Grid item xs={3}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Total Odds
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {parlay.totalOdds}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Win Prob
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {parlay.winProbability}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Expected Value
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {parlay.expectedValue}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Max Payout
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {parlay.maxPayout}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Strategy Info */}
                    <Paper sx={{ p: 2, mb: 2, bgcolor: alpha('#8b5cf6', 0.1) }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Typography variant="caption" color="#8b5cf6" fontWeight="medium">
                            Strategy:
                          </Typography>
                          <Typography variant="caption" color="text.secondary" ml={1}>
                            {parlay.strategy}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="#8b5cf6" fontWeight="medium">
                            Correlation:
                          </Typography>
                          <Typography variant="caption" color="text.secondary" ml={1}>
                            {parlay.correlation}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="#8b5cf6" fontWeight="medium">
                            Best Used For:
                          </Typography>
                          <Typography variant="caption" color="text.secondary" ml={1}>
                            {parlay.bestUsed}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Bankroll Management */}
                    <Box display="flex" alignItems="center" gap={1} p={1} bgcolor={alpha('#8b5cf6', 0.1)} borderRadius={1} mb={2}>
                      <WalletIcon sx={{ fontSize: 14, color: '#8b5cf6' }} />
                      <Typography variant="caption" color="#c4b5fd">
                        Confidence Score: {parlay.confidenceScore}/100 • 
                        Recommended Stake: {parlay.recommendedStake}
                      </Typography>
                    </Box>

                    {/* Footer */}
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {parlay.timestamp}
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        sx={{ 
                          bgcolor: '#f59e0b',
                          '&:hover': { bgcolor: '#d97706' }
                        }}
                      >
                        Build This Parlay
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box textAlign="center" py={4}>
            <MergeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No parlays generated yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select filters and tap "Build Smart Parlays" to create {parlayLegs}-leg parlays
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box display="flex" alignItems="center" mt={3} pt={2} borderTop="1px solid" borderColor="divider">
          <BarChartIcon sx={{ fontSize: 16, color: '#059669', mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            • 3-leg parlays optimized for {selectedFilters.riskLevel} risk • Auto-balanced • Different from daily picks
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Parlay Analytics Box Component
const ParlayAnalyticsBox = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [parlayStats, setParlayStats] = useState({
    winRate: '68.4%',
    avgLegs: '2.7',
    avgOdds: '+425',
    bestParlay: '+1250',
    multiSport: '42%'
  });

  if (!showAnalytics) {
    return (
      <Button
        variant="contained"
        startIcon={<AnalyticsIcon />}
        onClick={() => setShowAnalytics(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: '#f59e0b',
          '&:hover': { bgcolor: '#d97706' },
          borderRadius: 8,
          zIndex: 1000
        }}
      >
        Parlay Stats
      </Button>
    );
  }

  return (
    <Modal
      open={showAnalytics}
      onClose={() => setShowAnalytics(false)}
      closeAfterTransition
    >
      <Fade in={showAnalytics}>
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', md: 500 },
          maxHeight: '80vh',
          overflow: 'auto',
          borderRadius: 3,
          bgcolor: 'background.paper'
        }}>
          <CardContent>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <MergeIcon color="primary" />
                <Typography variant="h5" fontWeight="bold">
                  Parlay Performance
                </Typography>
              </Box>
              <IconButton onClick={() => setShowAnalytics(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ 
                    bgcolor: alpha('#10b981', 0.1), 
                    color: '#10b981',
                    width: 70,
                    height: 70,
                    mx: 'auto',
                    mb: 1
                  }}>
                    <TrophyIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {parlayStats.winRate}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Win Rate
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ 
                    bgcolor: alpha('#3b82f6', 0.1), 
                    color: '#3b82f6',
                    width: 70,
                    height: 70,
                    mx: 'auto',
                    mb: 1
                  }}>
                    <LayersIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {parlayStats.avgLegs}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Legs
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ 
                    bgcolor: alpha('#8b5cf6', 0.1), 
                    color: '#8b5cf6',
                    width: 70,
                    height: 70,
                    mx: 'auto',
                    mb: 1
                  }}>
                    <CashIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {parlayStats.avgOdds}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Odds
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Avatar sx={{ 
                    bgcolor: alpha('#f59e0b', 0.1), 
                    color: '#f59e0b',
                    width: 70,
                    height: 70,
                    mx: 'auto',
                    mb: 1
                  }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {parlayStats.bestParlay}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Best Parlay
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Multi-Sport Info */}
            <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <BasketballIcon sx={{ color: '#ef4444' }} />
                  <FootballIcon sx={{ color: '#3b82f6', ml: -1 }} />
                  <Typography variant="h6" fontWeight="medium">
                    Multi-Sport Parlays
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#f59e0b" textAlign="center">
                  {parlayStats.multiSport}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  of all winning parlays
                </Typography>
              </CardContent>
            </Card>

            {/* Tips */}
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Parlay Tips
            </Typography>
            <List>
              <ListItem>
                <CheckCircleIcon sx={{ color: '#10b981', mr: 2, fontSize: 16 }} />
                <ListItemText primary="2-3 legs have highest success rate" />
              </ListItem>
              <ListItem>
                <CheckCircleIcon sx={{ color: '#10b981', mr: 2, fontSize: 16 }} />
                <ListItemText primary="Combine sports for better value" />
              </ListItem>
              <ListItem>
                <CheckCircleIcon sx={{ color: '#10b981', mr: 2, fontSize: 16 }} />
                <ListItemText primary="Balance high-probability with value picks" />
              </ListItem>
            </List>
          </CardContent>
        </Paper>
      </Fade>
    </Modal>
  );
};

const ParlayArchitectScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedPicks, setSelectedPicks] = useState<any[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState(mockPlayers);
  const [filteredPlayers, setFilteredPlayers] = useState(mockPlayers);
  const [loading, setLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('All');
  const [parlayLegs, setParlayLegs] = useState(3);
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  
  const [parlayConfidence, setParlayConfidence] = useState(0);
  const [parlayOdds, setParlayOdds] = useState('+100');
  const [expectedPayout, setExpectedPayout] = useState(0);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const calculateParlay = (picks: any[]) => {
    if (!picks || picks.length === 0) {
      setParlayConfidence(0);
      setParlayOdds('+100');
      setExpectedPayout(0);
      return;
    }

    let combinedProbability = 1;
    picks.forEach(pick => {
      const probability = (pick.confidence || 75) / 100;
      combinedProbability *= probability;
    });

    const decimalOdds = 1 / combinedProbability;
    const americanOdds = decimalOdds >= 2 ? 
      `+${Math.round((decimalOdds - 1) * 100)}` : 
      `-${Math.round(100 / (decimalOdds - 1))}`;

    const payout = Math.round((decimalOdds - 1) * 100);

    setParlayConfidence(Math.round(combinedProbability * 100));
    setParlayOdds(americanOdds);
    setExpectedPayout(payout);
  };

  useEffect(() => {
    calculateParlay(selectedPicks);
  }, [selectedPicks]);

  const addToParlay = (player: any) => {
    if (selectedPicks.length >= 3) {
      alert('Maximum 3 legs per parlay. Remove some picks to add new ones.');
      return;
    }

    const newPick = {
      id: `pick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'parlay_leg',
      name: player.name || 'Unknown Player',
      sport: player.sport || 'NBA',
      category: player.category || 'Standard',
      pick: `${player.position || 'Stat'} ${player.line || 'Line'}`,
      confidence: player.confidence || 75,
      odds: ['-150', '-110', '+120'][Math.floor(Math.random() * 3)],
      edge: player.edge || '+3.5%',
      analysis: player.aiPrediction || 'Strong parlay candidate',
      timestamp: 'Just added',
      probability: `${player.confidence || 75}%`,
      units: '1.5'
    };

    setSelectedPicks([...selectedPicks, newPick]);
  };

  const removeFromParlay = (id: string) => {
    setSelectedPicks(selectedPicks.filter(pick => pick.id !== id));
  };

  const clearParlay = () => {
    if (selectedPicks.length === 0) return;
    if (confirm('Are you sure you want to clear all picks from your parlay?')) {
      setSelectedPicks([]);
    }
  };

  const optimizeParlay = () => {
    if (selectedPicks.length < 2) {
      alert('Add at least 2 picks to optimize your parlay.');
      return;
    }

    const optimizedPicks = [...selectedPicks]
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 3);

    if (autoBalanceEnabled && optimizedPicks.length > 1) {
      const sportsSet = new Set(optimizedPicks.map(p => p.sport));
      if (sportsSet.size < 2 && selectedPicks.length > 3) {
        const availableSports = sportsData.filter(s => s.id !== 'All');
        const differentSport = availableSports.find(s => !sportsSet.has(s.id));
        if (differentSport) {
          const differentSportPick = selectedPicks.find(p => p.sport === differentSport.id);
          if (differentSportPick) {
            optimizedPicks.pop();
            optimizedPicks.push(differentSportPick);
          }
        }
      }
    }

    setSelectedPicks(optimizedPicks);
  };

  const handleGenerateThreeLegParlay = (parlays: any[]) => {
    setGenerating(true);
    setShowGeneratingModal(true);
    
    if (parlays && parlays.length > 0) {
      const parlay = parlays[0];
      const newPicks = parlay.legs.map((leg: any, index: number) => ({
        id: `parlay-leg-${Date.now()}-${index}`,
        type: 'parlay_leg',
        name: `Leg ${index + 1}`,
        sport: leg.sport,
        category: 'Smart Parlay',
        pick: leg.pick,
        confidence: leg.confidence,
        odds: leg.odds,
        edge: leg.edge,
        analysis: leg.analysis,
        timestamp: 'Just generated',
        probability: `${leg.confidence}%`,
        units: '2.0'
      }));
      
      const picksToAdd = newPicks.slice(0, Math.min(3 - selectedPicks.length, newPicks.length));
      if (picksToAdd.length > 0) {
        setSelectedPicks([...selectedPicks, ...picksToAdd]);
      }
      
      setTimeout(() => {
        setShowGeneratingModal(false);
        setGenerating(false);
        alert(`${picksToAdd.length}-leg smart parlay added with ${parlay.winProbability} win probability`);
      }, 1500);
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) {
      setFilteredPlayers(availablePlayers);
      return;
    }
    
    const lowerQuery = searchInput.toLowerCase().trim();
    const filtered = availablePlayers.filter(player => 
      player.name.toLowerCase().includes(lowerQuery) ||
      player.team.toLowerCase().includes(lowerQuery) ||
      player.sport.toLowerCase().includes(lowerQuery) ||
      player.category.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPlayers(filtered);
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    const filtered = sportId === 'All' 
      ? availablePlayers 
      : availablePlayers.filter(p => p.sport === sportId);
    setFilteredPlayers(filtered);
  };

  const renderParlayLeg = (pick: any, index: number) => {
    const getSportIcon = (sport: string) => {
      switch(sport) {
        case 'NBA': return <BasketballIcon />;
        case 'NFL': return <FootballIcon />;
        case 'NHL': return <HockeyIcon />;
        case 'MLB': return <BaseballIcon />;
//         default: return <SportsSoccerIcon />; // Removed duplicate
      }
    };

    const getSportColor = (sport: string) => {
      switch(sport) {
        case 'NBA': return '#ef4444';
        case 'NFL': return '#3b82f6';
        case 'NHL': return '#1e40af';
        case 'MLB': return '#10b981';
        default: return '#6b7280';
      }
    };

    return (
      <Card key={pick.id} sx={{ mb: 2, width: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={`Leg ${index + 1}`}
                size="small"
                sx={{ bgcolor: '#f59e0b20', color: '#f59e0b', fontWeight: 'bold' }}
              />
              <Box display="flex" alignItems="center" gap={0.5}>
                {getSportIcon(pick.sport)}
                <Typography variant="caption" color={getSportColor(pick.sport)} fontWeight="medium">
                  {pick.sport}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => removeFromParlay(pick.id)}>
              <CloseIcon sx={{ color: '#ef4444' }} />
            </IconButton>
          </Box>

          <Typography variant="h6" fontWeight="bold" mb={0.5}>
            {pick.name}
          </Typography>
          <Typography variant="body1" color="primary.main" fontWeight="medium" mb={2}>
            {pick.pick}
          </Typography>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Confidence
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={pick.confidence} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: '#334155',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: pick.confidence >= 80 ? '#10b981' : 
                              pick.confidence >= 70 ? '#f59e0b' : '#ef4444'
                    }
                  }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {pick.confidence}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Odds
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {pick.odds}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Edge
                </Typography>
                <Chip
                  icon={<TrendingUpIcon />}
                  label={pick.edge}
                  size="small"
                  sx={{ 
                    bgcolor: alpha('#10b981', 0.1),
                    color: '#10b981',
                    mt: 0.5
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            {pick.analysis}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const renderPlayerCard = (player: any) => {
    const getCategoryColor = (category: string) => {
      switch(category) {
        case 'High Probability': return '#10b981';
        case 'Value Bet': return '#3b82f6';
        default: return '#f59e0b';
      }
    };

    return (
      <Card key={player.id} sx={{ width: 250, mr: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {player.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {player.team} • {player.sport}
              </Typography>
            </Box>
            <Chip
              label={player.category}
              size="small"
              sx={{ 
                bgcolor: alpha(getCategoryColor(player.category), 0.1),
                color: getCategoryColor(player.category),
                fontWeight: 'medium'
              }}
            />
          </Box>

          <Typography variant="body1" color="primary.main" fontWeight="medium" mb={2}>
            {player.position} {player.line}
          </Typography>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Chip
              label={`${player.confidence}%`}
              size="small"
              sx={{ bgcolor: '#3b82f620', color: '#3b82f6', fontWeight: 'bold' }}
            />
            <Chip
              icon={<TrendingUpIcon />}
              label={player.edge}
              size="small"
              sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}
            />
            <Button
              size="small"
              startIcon={<AddCircleIcon />}
              onClick={() => addToParlay(player)}
              sx={{ color: '#f59e0b' }}
            >
              Add
            </Button>
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
          Loading Parlay Builder...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              size="small"
              placeholder="Search players or picks..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                  </InputAdornment>
                ),
                sx: { 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '& input': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)'
                  }
                }
              }}
            />
            <IconButton onClick={handleSearch} sx={{ color: 'white' }}>
              <SearchIcon />
            </IconButton>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
            <MergeIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              3-Leg Parlay Architect
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Build smart multi-sport parlays with risk management
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Enhanced: New 3-Leg Parlay Generator */}
      <ThreeLegParlayGenerator 
        onGenerate={handleGenerateThreeLegParlay}
        isGenerating={generating}
        selectedSport={selectedSport}
        parlayLegs={parlayLegs}
        autoBalanceEnabled={autoBalanceEnabled}
      />

      {/* Current Parlay Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                🎯 Your Parlay ({selectedPicks.length}/3 legs)
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Build up to 3 legs for optimal success
              </Typography>
            </Box>
            {selectedPicks.length > 0 && (
              <Button
                startIcon={<DeleteIcon />}
                onClick={clearParlay}
                sx={{ color: 'error.main' }}
              >
                Clear
              </Button>
            )}
          </Box>

          {selectedPicks.length === 0 ? (
            <Box textAlign="center" py={6}>
              <MergeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No picks in your parlay
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add picks below or generate a smart parlay above
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={2} mb={3}>
                {selectedPicks.map((pick, index) => (
                  <Grid item xs={12} md={6} lg={4} key={pick.id}>
                    {renderParlayLeg(pick, index)}
                  </Grid>
                ))}
              </Grid>

              {/* Parlay Summary */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>
                  Parlay Summary
                </Typography>
                
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="#f59e0b">
                        {parlayConfidence}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Win Probability
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {parlayOdds}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Parlay Odds
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="info.main">
                        ${expectedPayout}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Payout on $100
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={optimizeParlay}
                    sx={{ bgcolor: '#3b82f6' }}
                  >
                    Optimize Parlay
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => {
                      alert(`Parlay Analysis:\n\nWin Probability: ${parlayConfidence}%\nParlay Odds: ${parlayOdds}\nExpected Payout: $${expectedPayout} on $100\n\n${parlayConfidence >= 60 ? '✅ Good value parlay' : '⚠️ Consider optimizing'}`);
                    }}
                    sx={{ bgcolor: '#10b981' }}
                  >
                    Analyze
                  </Button>
                </Box>
              </Paper>
            </>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Parlay Legs
                </Typography>
                <Box display="flex" gap={1}>
                  {[2, 3, 4, 5].map(legs => (
                    <Chip
                      key={legs}
                      label={`${legs} Legs`}
                      onClick={() => setParlayLegs(legs)}
                      color={parlayLegs === legs ? 'primary' : 'default'}
                      variant={parlayLegs === legs ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Auto-Balance
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoBalanceEnabled}
                      onChange={(e) => setAutoBalanceEnabled(e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Balance sports diversity"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sport Selector */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          Filter by Sport
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {sportsData.map((sport) => (
            <Chip
              key={sport.id}
              icon={sport.icon}
              label={sport.name}
              onClick={() => handleSportChange(sport.id)}
              color={selectedSport === sport.id ? 'primary' : 'default'}
              variant={selectedSport === sport.id ? 'filled' : 'outlined'}
              sx={{
                ...(selectedSport === sport.id && {
                  bgcolor: sport.color,
                  color: 'white',
                  '&:hover': { bgcolor: sport.color }
                })
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Available Picks */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box mb={3}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              📊 Available Picks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add to your parlay (max 3 legs)
            </Typography>
          </Box>

          {filteredPlayers.length > 0 ? (
            <Box sx={{ overflow: 'auto' }}>
              <Box display="flex" gap={2} pb={2}>
                {filteredPlayers.map(renderPlayerCard)}
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" py={6}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              {searchInput ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    No picks found for "{searchInput}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try a different search term or select "All Sports"
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    No picks found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try selecting a different sport
                  </Typography>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Parlay Tips */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            💡 Smart Parlay Building Tips
          </Typography>
          <List>
            <ListItem>
              <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
              <ListItemText primary="3-leg parlays offer the best balance of risk and reward" />
            </ListItem>
            <ListItem>
              <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
              <ListItemText primary="Combine different sports to eliminate correlation risk" />
            </ListItem>
            <ListItem>
              <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
              <ListItemText primary="Mix high-probability picks (70%+) with value bets for optimal EV" />
            </ListItem>
            <ListItem>
              <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
              <ListItemText primary="Target parlays with +200 to +500 odds for bankroll growth" />
            </ListItem>
            <ListItem>
              <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
              <ListItemText primary="Use the Smart Parlay Generator for data-driven combinations" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Generating Modal */}
      <Modal
        open={showGeneratingModal}
        onClose={() => setShowGeneratingModal(false)}
        closeAfterTransition
      >
        <Fade in={showGeneratingModal}>
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
            {generating ? (
              <Box textAlign="center">
                <CircularProgress size={60} sx={{ color: '#f59e0b', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Building Smart Parlay...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analyzing {parlayLegs}-leg combinations with optimal risk/reward
                </Typography>
              </Box>
            ) : (
              <Box textAlign="center">
                <CheckCircleIcon sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Smart Parlay Built!
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedPicks.length}-leg parlay optimized for maximum value
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setShowGeneratingModal(false)}
                  sx={{ mt: 3, bgcolor: '#f59e0b' }}
                >
                  View Parlay
                </Button>
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* Analytics Box */}
      <ParlayAnalyticsBox />
    </Container>
  );
};

export default ParlayArchitectScreen;
