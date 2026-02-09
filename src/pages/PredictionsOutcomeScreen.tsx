// src/pages/PredictionsOutcomeScreen.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Paper,
  LinearProgress,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Modal,
  Fade,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  EmojiEvents as TrophyIcon,
  AutoAwesome as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  BarChart as BarChartIcon,
  Update as UpdateIcon,
  Assessment as AssessmentIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Cached as CachedIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, subDays } from 'date-fns';

// ========== CACHE IMPLEMENTATION ==========
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry {
  data: any;
  timestamp: number;
  sport: string;
}

const predictionCache = new Map<string, CacheEntry>();

const getCacheKey = (sport: string, endpoint: string): string => {
  return `${sport}:${endpoint}`;
};

const isCacheValid = (cacheKey: string): boolean => {
  const entry = predictionCache.get(cacheKey);
  if (!entry) return false;
  
  const cacheAge = Date.now() - entry.timestamp;
  return cacheAge < CACHE_DURATION;
};

const getFromCache = (sport: string, endpoint: string): any | null => {
  const cacheKey = getCacheKey(sport, endpoint);
  if (isCacheValid(cacheKey)) {
    return predictionCache.get(cacheKey)?.data;
  }
  return null;
};

const setToCache = (sport: string, endpoint: string, data: any): void => {
  const cacheKey = getCacheKey(sport, endpoint);
  predictionCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    sport
  });
};

const clearCache = (sport?: string): void => {
  if (sport) {
    // Clear only entries for specific sport
    for (const [key, entry] of predictionCache.entries()) {
      if (entry.sport === sport) {
        predictionCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    predictionCache.clear();
  }
};

// ========== MOCK DATA GENERATOR ==========
const generateMockOutcomes = (sport: string, count: number = 15) => {
  const sports = {
    nba: {
      teams: ['Lakers', 'Warriors', 'Celtics', 'Bucks', 'Suns', 'Nuggets', 'Heat', '76ers'],
      players: ['LeBron James', 'Stephen Curry', 'Jayson Tatum', 'Giannis Antetokounmpo', 'Kevin Durant', 'Nikola Jokic', 'Jimmy Butler', 'Joel Embiid'],
      stats: ['points', 'rebounds', 'assists', '3-pointers', 'steals', 'blocks']
    },
    nfl: {
      teams: ['Chiefs', '49ers', 'Eagles', 'Bills', 'Bengals', 'Cowboys', 'Ravens', 'Dolphins'],
      players: ['Patrick Mahomes', 'Christian McCaffrey', 'Jalen Hurts', 'Josh Allen', 'Joe Burrow', 'Dak Prescott', 'Lamar Jackson', 'Tyreek Hill'],
      stats: ['passing yards', 'rushing yards', 'receiving yards', 'touchdowns', 'interceptions']
    },
    mlb: {
      teams: ['Dodgers', 'Yankees', 'Braves', 'Astros', 'Mets', 'Cardinals', 'Blue Jays', 'Padres'],
      players: ['Shohei Ohtani', 'Aaron Judge', 'Ronald Acuña Jr.', 'Yordan Alvarez', 'Pete Alonso', 'Paul Goldschmidt', 'Vladimir Guerrero Jr.', 'Manny Machado'],
      stats: ['hits', 'home runs', 'RBIs', 'strikeouts', 'walks']
    },
    nhl: {
      teams: ['Avalanche', 'Lightning', 'Maple Leafs', 'Oilers', 'Rangers', 'Bruins', 'Golden Knights', 'Stars'],
      players: ['Nathan MacKinnon', 'Nikita Kucherov', 'Auston Matthews', 'Connor McDavid', 'Artemi Panarin', 'David Pastrnak', 'Jack Eichel', 'Jason Robertson'],
      stats: ['goals', 'assists', 'points', 'shots', 'plus/minus']
    }
  };

  const sportData = sports[sport as keyof typeof sports] || sports.nba;
  const outcomes = ['correct', 'incorrect', 'pending'];
  
  return Array.from({ length: count }, (_, i) => {
    const randomOutcome = outcomes[i % outcomes.length];
    const team1 = sportData.teams[i % sportData.teams.length];
    const team2 = sportData.teams[(i + 1) % sportData.teams.length];
    const player = sportData.players[i % sportData.players.length];
    const stat = sportData.stats[i % sportData.stats.length];
    const line = (Math.random() * 10 + 5).toFixed(1);
    const actual = (parseFloat(line) + (Math.random() * 3 - 1.5)).toFixed(1);
    
    return {
      id: `outcome-${sport}-${i + 1}`,
      game: `${team1} vs ${team2}`,
      prediction: randomOutcome === 'pending' 
        ? `${player} over ${line} ${stat}`
        : `${player} ${parseFloat(actual) > parseFloat(line) ? 'over' : 'under'} ${line} ${stat}`,
      outcome: randomOutcome,
      actual_result: randomOutcome === 'pending' 
        ? 'Pending' 
        : parseFloat(actual) > parseFloat(line) ? 'Over hit' : 'Under hit',
      confidence_pre_game: Math.floor(Math.random() * 30) + 65,
      accuracy: randomOutcome === 'pending' ? null : Math.floor(Math.random() * 30) + 65,
      timestamp: subDays(new Date(), i % 7).toISOString(),
      sport: sport,
      source: 'Sports Analytics AI',
      key_factors: [
        `${player} has averaged ${(parseFloat(line) + 0.5).toFixed(1)} ${stat} in last 5 games`,
        `${team1} defense ranks ${i % 3 === 0 ? 'top 10' : 'middle'}`,
        `Historical trends favor ${i % 2 === 0 ? 'over' : 'under'}`
      ],
      player: player,
      stat_type: stat,
      line: parseFloat(line),
      actual_value: randomOutcome === 'pending' ? null : parseFloat(actual),
      units: randomOutcome === 'correct' ? `+${(Math.random() * 2 + 0.5).toFixed(1)}` : 
              randomOutcome === 'incorrect' ? `-${(Math.random() + 0.5).toFixed(1)}` : '0'
    };
  });
};

const leagueData = [
  { id: 'nba', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'nfl', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'mlb', name: 'MLB', icon: <BaseballIcon />, color: '#f59e0b' },
  { id: 'nhl', name: 'NHL', icon: <HockeyIcon />, color: '#0ea5e9' }
];

// ========== ENHANCED CUSTOM HOOK WITH CACHING & RETRY ==========
interface UsePredictionDataReturn {
  data: any;
  isLoading: boolean;
  error: string | null;
  refetch: (force?: boolean) => Promise<void>;
  isRefetching: boolean;
  dataSource: string;
  cacheInfo: {
    isCached: boolean;
    age: number;
  };
  retryCount: number;
  lastRetryTime: Date | null;
}

const usePredictionData = (sport: string): UsePredictionDataReturn => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');
  const [cacheInfo, setCacheInfo] = useState({ isCached: false, age: 0 });
  const [retryCount, setRetryCount] = useState(0);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const processResult = (result: any, source: string, endpoint: string, isCached: boolean = false) => {
    let outcomes = [];
    
    if (result.success) {
      if (endpoint.includes('/predictions/outcome') && result.outcomes) {
        outcomes = result.outcomes;
        setDataSource('predictions/outcome');
      } else if (endpoint.includes('/players/trends') && result.trends) {
        outcomes = result.trends.map((trend: any) => ({
          ...trend,
          game: `${trend.player} trend`,
          prediction: `${trend.player} ${trend.trend} trend in ${trend.metric}`,
          outcome: trend.trend === 'up' ? 'correct' : trend.trend === 'down' ? 'incorrect' : 'pending',
          actual_result: trend.change
        }));
        setDataSource('players/trends');
      } else if (endpoint.includes('/history') && result.history) {
        outcomes = result.history;
        setDataSource('history');
      } else if (endpoint.includes('/predictions') && result.predictions) {
        outcomes = result.predictions;
        setDataSource('predictions');
      }
      
      if (outcomes.length > 0) {
        const responseData = {
          success: true,
          outcomes: outcomes,
          count: outcomes.length,
          sport: sport,
          timestamp: new Date().toISOString(),
          scraped: !isCached,
          source: source,
          message: isCached 
            ? `Loaded ${outcomes.length} outcomes from cache (${endpoint.split('/').pop()})`
            : `Loaded ${outcomes.length} outcomes from ${endpoint.split('/').pop()}`
        };
        
        setData(responseData);
        setCacheInfo({ isCached, age: isCached ? Date.now() - getFromCache(sport, endpoint)?.timestamp : 0 });
        return true;
      }
    }
    return false;
  };

  const fetchData = useCallback(async (force: boolean = false, isRetry: boolean = false): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    if (!force) {
      setIsLoading(true);
    } else {
      setIsRefetching(true);
    }
    
    if (isRetry) {
      setRetryCount(prev => prev + 1);
      setLastRetryTime(new Date());
    }
    
    const API_BASE = process.env.REACT_APP_API_BASE || 'https://pleasing-determination-production.up.railway.app';
    
    const endpoints = [
      `${API_BASE}/api/predictions/outcome?sport=${sport}`,
      `${API_BASE}/api/players/trends?sport=${sport}`,
      `${API_BASE}/api/history?sport=${sport}`,
      `${API_BASE}/api/predictions?sport=${sport}`
    ];
    
    // Check cache first (unless forcing refresh)
    if (!force) {
      for (const endpoint of endpoints) {
        const cachedData = getFromCache(sport, endpoint);
        if (cachedData) {
          console.log(`Using cached data for ${endpoint}`);
          if (processResult(cachedData, 'cache', endpoint, true)) {
            setIsLoading(false);
            setIsRefetching(false);
            return;
          }
        }
      }
    }
    
    let rateLimited = false;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          signal: abortControllerRef.current?.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        // Check specifically for rate limiting
        if (response.status === 429) {
          console.warn(`Rate limited on ${endpoint}.`);
          rateLimited = true;
          
          // Try to get retry-after header
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 1 minute
          
          setError(`Rate limited. Please wait ${Math.ceil(waitTime/1000)} seconds before retrying.`);
          continue; // Try next endpoint even if rate limited
        }
        
        if (!response.ok) {
          continue; // Try next endpoint for other errors (404, 500, etc.)
        }
        
        const result = await response.json();
        
        // Cache the successful response
        setToCache(sport, endpoint, result);
        
        if (processResult(result, endpoint, endpoint, false)) {
          setError(null);
          setIsLoading(false);
          setIsRefetching(false);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Request aborted');
          return;
        }
        console.log(`Endpoint ${endpoint} failed:`, err);
        // Continue to next endpoint
      }
    }
    
    // If all endpoints fail or rate limited, use mock data
    const mockOutcomes = generateMockOutcomes(sport, 15);
    const mockData = {
      success: true,
      outcomes: mockOutcomes,
      count: mockOutcomes.length,
      sport: sport,
      timestamp: new Date().toISOString(),
      scraped: false,
      source: 'mock',
      message: rateLimited 
        ? 'Using realistic mock data (API rate limit reached)' 
        : 'Using realistic mock data for demonstration'
    };
    
    setData(mockData);
    setDataSource('mock');
    setCacheInfo({ isCached: false, age: 0 });
    
    if (rateLimited) {
      setError('Rate limited - showing demo data. Try again later for live data.');
    } else {
      setError(null);
    }
    
    setIsLoading(false);
    setIsRefetching(false);
  }, [sport]);

  useEffect(() => {
    fetchData(false, false);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refetch = useCallback(async (force: boolean = true) => {
    await fetchData(force, true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    dataSource,
    cacheInfo,
    retryCount,
    lastRetryTime
  };
};

// ========== MAIN COMPONENT ==========
const PredictionsOutcomeScreen = () => {
  const navigate = useNavigate();
  
  const [selectedSport, setSelectedSport] = useState('nba');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'correct' | 'incorrect' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  const {
    data: outcomesData,
    isLoading,
    error,
    refetch,
    isRefetching,
    dataSource,
    cacheInfo,
    retryCount,
    lastRetryTime
  } = usePredictionData(selectedSport);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleForceRefresh = async () => {
    showSnackbar('Force refreshing data...', 'info');
    clearCache(selectedSport);
    await refetch(true);
    showSnackbar('Data refreshed successfully!', 'success');
  };

  const handleClearAllCache = () => {
    clearCache();
    showSnackbar('All cache cleared!', 'success');
    refetch(true);
  };

  const handleRetryWithBackoff = async () => {
    // Simple exponential backoff: 1s, 2s, 4s, 8s, etc.
    const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
    showSnackbar(`Retrying in ${backoffTime/1000} seconds...`, 'info');
    
    await new Promise(resolve => setTimeout(resolve, backoffTime));
    await refetch(true);
  };

  const outcomes = outcomesData?.outcomes || [];

  // Filter outcomes
  const filteredByOutcome = filterOutcome === 'all'
    ? outcomes
    : outcomes.filter((item: any) => item.outcome === filterOutcome);

  // Filter by search
  const filteredOutcomes = searchQuery
    ? filteredByOutcome.filter((item: any) =>
        (item.game?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.prediction?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.player?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (item.sport?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )
    : filteredByOutcome;

  // Calculate stats
  const totalPredictions = filteredOutcomes.length;
  const correctPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'correct').length;
  const incorrectPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'incorrect').length;
  const pendingPredictions = filteredOutcomes.filter((item: any) => item.outcome === 'pending').length;
  
  const winRate = correctPredictions + incorrectPredictions > 0 
    ? Math.round((correctPredictions / (correctPredictions + incorrectPredictions)) * 100)
    : 0;
  
  const avgConfidence = filteredOutcomes.length > 0
    ? Math.round(filteredOutcomes.reduce((acc: number, item: any) => acc + (item.confidence_pre_game || item.confidence || 70), 0) / filteredOutcomes.length)
    : 0;

  const totalUnits = filteredOutcomes.reduce((sum: number, pred: any) => {
    if (pred.outcome === 'correct') {
      return sum + (parseFloat(pred.units?.replace('+', '') || '1.0') || 1.0);
    } else if (pred.outcome === 'incorrect') {
      return sum - (parseFloat(pred.units?.replace('-', '') || '1.0') || 1.0);
    }
    return sum;
  }, 0);

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'nba': return <BasketballIcon />;
      case 'nfl': return <FootballIcon />;
      case 'mlb': return <BaseballIcon />;
      case 'nhl': return <HockeyIcon />;
      default: return <BasketballIcon />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch(outcome) {
      case 'correct': return '#10b981';
      case 'incorrect': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch(outcome) {
      case 'correct': return <CheckCircleIcon />;
      case 'incorrect': return <CancelIcon />;
      case 'pending': return <TimelineIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <TrendingUpIcon sx={{ color: '#10b981' }} />;
      case 'down': return <TrendingDownIcon sx={{ color: '#ef4444' }} />;
      default: return <TimelineIcon sx={{ color: '#f59e0b' }} />;
    }
  };

  const AnalyticsDashboard = () => {
    return (
      <Modal
        open={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        closeAfterTransition
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2 
        }}
      >
        <Fade in={showAnalyticsModal}>
          <Paper sx={{ 
            width: { xs: '95%', md: 500 },
            maxHeight: '90vh',
            overflow: 'auto',
            borderRadius: 3,
            bgcolor: 'background.paper'
          }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrophyIcon color="primary" />
                  <Typography variant="h5" fontWeight="bold">
                    Prediction Analytics
                  </Typography>
                </Box>
                <IconButton onClick={() => setShowAnalyticsModal(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2} mb={3}>
                {[
                  { label: 'Total Predictions', value: totalPredictions, color: '#059669' },
                  { label: 'Win Rate', value: `${winRate}%`, color: '#10b981' },
                  { label: 'Total Units', value: totalUnits > 0 ? `+${totalUnits.toFixed(1)}` : totalUnits.toFixed(1), color: totalUnits >= 0 ? '#10b981' : '#ef4444' },
                  { label: 'Data Source', value: dataSource, color: '#3b82f6' },
                  { label: 'Cache Status', value: cacheInfo.isCached ? 'Cached' : 'Live', color: cacheInfo.isCached ? '#f59e0b' : '#10b981' },
                  { label: 'Retry Count', value: retryCount, color: retryCount > 0 ? '#ef4444' : '#10b981' }
                ].map((stat, idx) => (
                  <Grid item xs={6} key={idx}>
                    <Box textAlign="center" p={2} sx={{ bgcolor: alpha(stat.color, 0.1), borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight="bold" color={stat.color}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="medium" mb={2}>
                    Outcome Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Avatar sx={{ 
                          bgcolor: '#10b981', 
                          color: 'white',
                          width: 50,
                          height: 50,
                          mx: 'auto',
                          mb: 1
                        }}>
                          {correctPredictions}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Correct
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Avatar sx={{ 
                          bgcolor: '#ef4444', 
                          color: 'white',
                          width: 50,
                          height: 50,
                          mx: 'auto',
                          mb: 1
                        }}>
                          {incorrectPredictions}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Incorrect
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Avatar sx={{ 
                          bgcolor: '#f59e0b', 
                          color: 'white',
                          width: 50,
                          height: 50,
                          mx: 'auto',
                          mb: 1
                        }}>
                          {pendingPredictions}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          Pending
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                Recent Predictions
              </Typography>
              
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {filteredOutcomes.slice(0, 5).map((prediction: any, index: number) => (
                  <ListItem key={index} sx={{ 
                    mb: 1, 
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: getOutcomeColor(prediction.outcome),
                        width: 32,
                        height: 32
                      }}>
                        {getOutcomeIcon(prediction.outcome)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={prediction.game || 'Prediction'}
                      secondary={`${prediction.sport?.toUpperCase() || 'NBA'} • ${prediction.timestamp ? format(new Date(prediction.timestamp), 'MMM d') : 'Unknown date'}`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={prediction.outcome?.charAt(0).toUpperCase() + prediction.outcome?.slice(1) || 'Pending'}
                        size="small"
                        sx={{ 
                          bgcolor: getOutcomeColor(prediction.outcome),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Paper>
        </Fade>
      </Modal>
    );
  };

  if (isLoading && !isRefetching) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Loading prediction outcomes...
          </Typography>
          <Typography variant="caption" sx={{ mt: 1 }}>
            Trying multiple data sources
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        borderRadius: 3,
        mb: 4,
        mt: 2,
        p: 3,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%'
        }} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' } }}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Badge 
              badgeContent={dataSource === 'mock' ? "Demo" : dataSource === 'cache' ? "Cached" : "Live"} 
              color={dataSource === 'mock' ? "warning" : dataSource === 'cache' ? "info" : "success"}
            >
              <Button
                startIcon={<BarChartIcon />}
                onClick={() => setShowAnalyticsModal(true)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white' } }}
                variant="outlined"
              >
                Analytics
              </Button>
            </Badge>
            
            {/* Retry Button with Exponential Backoff */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRetryWithBackoff}
              disabled={isLoading || isRefetching}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)', 
                '&:hover': { borderColor: 'white' },
                minWidth: '120px'
              }}
            >
              {isRefetching ? 'Retrying...' : `Retry (${retryCount})`}
            </Button>
            
            {/* Force Refresh Button */}
            <Button
              variant="outlined"
              startIcon={<CachedIcon />}
              onClick={handleForceRefresh}
              disabled={isRefetching}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)', 
                '&:hover': { borderColor: 'white' },
                bgcolor: alpha('#ef4444', 0.2)
              }}
            >
              Force Refresh
            </Button>
            
            {/* Clear Cache Button */}
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearAllCache}
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)', 
                '&:hover': { borderColor: 'white' },
                bgcolor: alpha('#f59e0b', 0.2)
              }}
            >
              Clear Cache
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 72, height: 72 }}>
            <AssessmentIcon sx={{ fontSize: 36 }} />
          </Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
              Prediction Outcomes
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Track and analyze {selectedSport.toUpperCase()} prediction performance
              {dataSource && ` • Source: ${dataSource}`}
              {cacheInfo.isCached && ` • Cached: ${Math.floor(cacheInfo.age/1000)}s ago`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Status Alert */}
      {error && (
        <Alert 
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" size="small" onClick={handleRetryWithBackoff}>
                RETRY
              </Button>
              <Button color="inherit" size="small" onClick={() => showSnackbar('Using demo data', 'info')}>
                USE DEMO
              </Button>
            </Box>
          }
        >
          <AlertTitle>
            API Rate Limited
          </AlertTitle>
          {error}
          {lastRetryTime && ` • Last retry: ${format(lastRetryTime, 'HH:mm:ss')}`}
        </Alert>
      )}

      {outcomesData?.message && !error && (
        <Alert 
          severity={outcomesData.scraped ? "success" : "info"}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch(true)}>
              REFRESH
            </Button>
          }
        >
          <AlertTitle>
            {outcomesData.scraped ? 'Live Data' : cacheInfo.isCached ? 'Cached Data' : 'Demo Mode'}
          </AlertTitle>
          {outcomesData.message}
          {outcomesData.timestamp && ` • Updated ${format(new Date(outcomesData.timestamp), 'PPpp')}`}
        </Alert>
      )}

      {/* Progress for Refetching */}
      {isRefetching && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Fetching updated data from multiple sources...
            {retryCount > 0 && ` (Retry attempt: ${retryCount})`}
          </Typography>
        </Box>
      )}

      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search predictions, players, or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 2,
                  bgcolor: 'background.default'
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Select
                value={selectedSport}
                label="Sport"
                onChange={(e) => {
                  setSelectedSport(e.target.value);
                  showSnackbar(`Switched to ${e.target.value.toUpperCase()}`, 'info');
                }}
                startAdornment={getSportIcon(selectedSport)}
                sx={{ borderRadius: 2 }}
              >
                {leagueData.map((league) => (
                  <MenuItem key={league.id} value={league.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {league.icon}
                      {league.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter Outcome</InputLabel>
              <Select
                value={filterOutcome}
                label="Filter Outcome"
                onChange={(e) => setFilterOutcome(e.target.value as any)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Outcomes</MenuItem>
                <MenuItem value="correct">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 16 }} />
                    Correct Only
                  </Box>
                </MenuItem>
                <MenuItem value="incorrect">
                  <Box display="flex" alignItems="center" gap={1}>
                    <CancelIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                    Incorrect Only
                  </Box>
                </MenuItem>
                <MenuItem value="pending">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimelineIcon sx={{ color: '#f59e0b', fontSize: 16 }} />
                    Pending Only
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{ width: '100%', justifyContent: 'center' }}
            >
              <ToggleButton value="table">
                <FilterListIcon />
              </ToggleButton>
              <ToggleButton value="cards">
                <BarChartIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Predictions', 
            value: totalPredictions, 
            color: '#059669',
            icon: <AssessmentIcon />,
            trend: totalPredictions > 0 ? 'up' : 'neutral'
          },
          { 
            label: 'Correct', 
            value: correctPredictions, 
            color: '#10b981',
            icon: <CheckCircleIcon />,
            trend: 'up'
          },
          { 
            label: 'Incorrect', 
            value: incorrectPredictions, 
            color: '#ef4444',
            icon: <CancelIcon />,
            trend: 'down'
          },
          { 
            label: 'Win Rate', 
            value: `${winRate}%`, 
            color: winRate >= 60 ? '#10b981' : winRate >= 50 ? '#f59e0b' : '#ef4444',
            icon: <TrophyIcon />,
            trend: winRate >= 60 ? 'up' : winRate >= 50 ? 'neutral' : 'down'
          },
          { 
            label: 'Avg Confidence', 
            value: `${avgConfidence}%`, 
            color: avgConfidence >= 75 ? '#10b981' : avgConfidence >= 65 ? '#f59e0b' : '#ef4444',
            icon: <SparklesIcon />,
            trend: avgConfidence >= 75 ? 'up' : avgConfidence >= 65 ? 'neutral' : 'down'
          },
          { 
            label: 'Cache Status', 
            value: cacheInfo.isCached ? 'Cached' : 'Live', 
            color: cacheInfo.isCached ? '#f59e0b' : '#10b981',
            icon: cacheInfo.isCached ? <CachedIcon /> : <UpdateIcon />,
            trend: 'neutral'
          }
        ].map((stat, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <Card sx={{ 
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ 
                  display: 'inline-flex',
                  p: 1,
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: alpha(stat.color, 0.1)
                }}>
                  {React.cloneElement(stat.icon, { sx: { color: stat.color, fontSize: 20 } })}
                </Box>
                <Typography variant="h4" fontWeight="bold" color={stat.color} gutterBottom>
                  {stat.value}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                  {stat.trend !== 'neutral' && getTrendIcon(stat.trend)}
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Content - Card View */}
      {filteredOutcomes.length > 0 ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {filteredOutcomes.map((outcome: any, index: number) => {
            const outcomeColor = getOutcomeColor(outcome.outcome);
            const isExpanded = expandedCard === outcome.id;
            
            return (
              <Grid item xs={12} md={6} lg={4} key={outcome.id || `outcome-${index}`}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s',
                  border: `1px solid ${alpha(outcomeColor, 0.2)}`,
                  '&:hover': { 
                    borderColor: outcomeColor,
                    boxShadow: `0 4px 20px ${alpha(outcomeColor, 0.15)}`
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {outcome.game || `${outcome.player || 'Player'} Prediction`}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            label={outcome.sport?.toUpperCase() || 'NBA'}
                            size="small"
                            icon={getSportIcon(outcome.sport || 'nba')}
                            sx={{ 
                              bgcolor: alpha('#3b82f6', 0.1),
                              color: '#3b82f6'
                            }}
                          />
                          {outcome.player && (
                            <Chip
                              label={outcome.player}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                      <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
                        <Chip
                          label={outcome.outcome?.toUpperCase() || 'PENDING'}
                          size="small"
                          sx={{ 
                            bgcolor: outcomeColor,
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                        {outcome.units && outcome.units !== '0' && (
                          <Typography variant="caption" fontWeight="bold" color={outcomeColor}>
                            {outcome.units} units
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {/* Prediction */}
                    <Typography variant="body1" fontWeight="medium" color="primary" mb={2}>
                      {outcome.prediction || 'No prediction details available'}
                    </Typography>
                    
                    {/* Stats */}
                    <Grid container spacing={2} mb={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={1.5} bgcolor="action.hover" borderRadius={2}>
                          <Typography variant="caption" color="text.secondary">
                            Confidence
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={outcome.confidence_pre_game || outcome.confidence || 70} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              mt: 1,
                              mb: 1,
                              bgcolor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: (outcome.confidence_pre_game || outcome.confidence) >= 80 ? '#10b981' : 
                                        (outcome.confidence_pre_game || outcome.confidence) >= 70 ? '#f59e0b' : '#ef4444'
                              }
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {outcome.confidence_pre_game || outcome.confidence || 70}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={1.5} bgcolor="action.hover" borderRadius={2}>
                          <Typography variant="caption" color="text.secondary">
                            Result
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color={outcomeColor} sx={{ mt: 0.5 }}>
                            {outcome.actual_result || outcome.outcome?.charAt(0).toUpperCase() + outcome.outcome?.slice(1) || 'Pending'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Expandable Section */}
                    <Accordion 
                      expanded={isExpanded}
                      onChange={() => setExpandedCard(isExpanded ? null : outcome.id)}
                      sx={{ 
                        mb: 2,
                        '&:before': { display: 'none' },
                        boxShadow: 'none',
                        bgcolor: 'transparent'
                      }}
                    >
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ 
                          minHeight: 'auto',
                          p: 0,
                          '& .MuiAccordionSummary-content': { my: 1 }
                        }}
                      >
                        <Typography variant="body2" color="primary" fontWeight="medium">
                          {isExpanded ? 'Show Less' : 'View Details'}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        {/* Key Factors */}
                        {outcome.key_factors && outcome.key_factors.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Key Factors
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: 16 }}>
                              {outcome.key_factors.map((factor: string, i: number) => (
                                <li key={i}>
                                  <Typography variant="body2" color="text.secondary">
                                    {factor}
                                  </Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}
                        
                        {/* Stats Details */}
                        {(outcome.line || outcome.stat_type) && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                              Prediction Details
                            </Typography>
                            <Grid container spacing={1}>
                              {outcome.line && (
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Line
                                  </Typography>
                                  <Typography variant="body2">
                                    {outcome.line}
                                  </Typography>
                                </Grid>
                              )}
                              {outcome.stat_type && (
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Stat Type
                                  </Typography>
                                  <Typography variant="body2">
                                    {outcome.stat_type}
                                  </Typography>
                                </Grid>
                              )}
                              {outcome.actual_value && (
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Actual
                                  </Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {outcome.actual_value}
                                  </Typography>
                                </Grid>
                              )}
                              {outcome.accuracy && (
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">
                                    Accuracy
                                  </Typography>
                                  <Typography variant="body2">
                                    {outcome.accuracy}%
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                    
                    {/* Footer */}
                    <Box sx={{ mt: 'auto' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {outcome.timestamp ? format(new Date(outcome.timestamp), 'MMM d, yyyy') : 'Unknown date'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {outcome.source && `Source: ${outcome.source}`}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* Empty State */
        <Paper sx={{ p: 8, textAlign: 'center', mb: 4, borderRadius: 3 }}>
          <Box sx={{ 
            width: 120,
            height: 120,
            borderRadius: '50%',
            bgcolor: alpha('#3b82f6', 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}>
            <AssessmentIcon sx={{ fontSize: 60, color: '#3b82f6' }} />
          </Box>
          
          {searchQuery || filterOutcome !== 'all' ? (
            <>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                No predictions found
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto' }}>
                Try adjusting your search or filter settings. No predictions match your current criteria.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                No predictions available
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 400, mx: 'auto' }}>
                {selectedSport.toUpperCase()} predictions are currently unavailable. Try selecting a different sport or check back later.
              </Typography>
            </>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={handleRetryWithBackoff}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 2 }}
            >
              Retry with Backoff
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleForceRefresh}
              startIcon={<CachedIcon />}
              sx={{ borderRadius: 2 }}
            >
              Force Refresh
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                setSearchQuery('');
                setFilterOutcome('all');
              }}
              sx={{ borderRadius: 2 }}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>
      )}

      {/* Tips Section */}
      {filteredOutcomes.length > 0 && (
        <Card sx={{ mt: 4, mb: 4, borderRadius: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <SparklesIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">
                📈 Prediction Analysis Tips
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {[
                {
                  title: 'Track Performance',
                  description: 'Monitor win rates and accuracy across different sports and prediction types to identify patterns.',
                  icon: <TimelineIcon sx={{ color: '#10b981' }} />
                },
                {
                  title: 'Cache Management',
                  description: 'Use Force Refresh for live data, or rely on cached data for faster loading during rate limits.',
                  icon: <CachedIcon sx={{ color: '#3b82f6' }} />
                },
                {
                  title: 'Retry Strategy',
                  description: 'The retry button uses exponential backoff to avoid hitting rate limits repeatedly.',
                  icon: <RefreshIcon sx={{ color: '#8b5cf6' }} />
                }
              ].map((tip, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      {tip.icon}
                      <Typography variant="subtitle1" fontWeight="bold">
                        {tip.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {tip.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      <AnalyticsDashboard />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

// Add missing ClearIcon component
const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default PredictionsOutcomeScreen;
