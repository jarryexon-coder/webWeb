// src/pages/ParlayArchitectScreen.tsx - UPDATED WITH HOOKS
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Collapse
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
  BugReport as BugReportIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, parseISO, isToday } from 'date-fns';

// Import the new hooks
import { useParlaySuggestions, useOddsGames } from '../hooks/useBackendAPI';

// Types
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
  legs: Array<{
    id: string;
    gameId: string;
    description: string;
    odds: string;
    confidence: number;
    sport: string;
    market: string;
    outcome: string;
  }>;
  totalOdds: string;
  confidence: number;
  analysis: string;
  timestamp: string;
  isGenerated: boolean;
  isToday: boolean;
  source?: string;
  confidence_level?: string;
  expected_value?: string;
}

const API_BASE = 'https://pleasing-determination-production.up.railway.app';

const ParlayArchitectScreen = () => {
  const navigate = useNavigate();
  
  // State management
  const [filteredSuggestions, setFilteredSuggestions] = useState<ParlaySuggestion[]>([]);
  const [selectedParlay, setSelectedParlay] = useState<ParlaySuggestion | null>(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Filter states
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [minConfidence, setMinConfidence] = useState(60);
  const [maxLegs, setMaxLegs] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showTodaysGames, setShowTodaysGames] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  
  // Use custom hooks
  const { 
    data: parlayData, 
    isLoading, 
    error: parlayError, 
    refetch: refetchParlays 
  } = useParlaySuggestions(selectedSport, 4);
  
  const {
    data: oddsData,
    isLoading: oddsLoading,
    error: oddsError,
    refetch: refetchOdds
  } = useOddsGames(selectedSport === 'all' ? undefined : selectedSport, dateFilter);
  
  const suggestions = parlayData?.suggestions || [];
  const todaysGames = oddsData?.games || [];
  
  // Sport options based on available games
  const SPORTS = [
    { id: 'all', name: 'All Sports', icon: <MergeIcon />, color: '#f59e0b' },
    { id: 'basketball_nba', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
    { id: 'americanfootball_nfl', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
    { id: 'icehockey_nhl', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
    { id: 'baseball_mlb', name: 'MLB', icon: <BaseballIcon />, color: '#10b981' }
  ];

  // Log usage on mount
  useEffect(() => {
    console.log('🏗️ ParlayArchitectScreen mounted');
    return () => {
      console.log('🏗️ ParlayArchitectScreen unmounted');
    };
  }, []);
  
  // Generate parlay from today's games
  const generateParlayFromGames = useCallback(async (sport: string, numLegs: number) => {
    if (todaysGames.length === 0) {
      alert('No games available to generate parlays');
      return;
    }
    
    setGenerating(true);
    
    try {
      // Filter games by sport and today's date
      const sportKey = sport === 'all' ? undefined : sport;
      const filteredGames = todaysGames.filter((game: Game) => {
        if (sportKey && game.sport_key !== sportKey) return false;
        return isToday(parseISO(game.commence_time));
      });
      
      if (filteredGames.length === 0) {
        throw new Error(`No games found for ${sport}`);
      }
      
      // Select random games
      const selectedGames = [...filteredGames]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(numLegs, filteredGames.length));
      
      // Build legs from selected games
      const legs = selectedGames.map((game: Game, index: number) => {
        const bookmaker = game.bookmakers?.find(b => b.key === 'draftkings') || game.bookmakers?.[0];
        const market = bookmaker?.markets?.find(m => m.key === 'h2h') || bookmaker?.markets?.[0];
        const outcome = market?.outcomes?.[0];
        
        return {
          id: `leg-${Date.now()}-${index}`,
          gameId: game.id,
          description: `${game.away_team} @ ${game.home_team}`,
          odds: outcome?.price ? (outcome.price > 0 ? `+${outcome.price}` : outcome.price.toString()) : '+100',
          confidence: 65 + Math.floor(Math.random() * 20),
          sport: game.sport_title,
          market: market?.key || 'h2h',
          outcome: outcome?.name || ''
        };
      });
      
      const newParlay: ParlaySuggestion = {
        id: `generated-${Date.now()}`,
        name: `${sport.replace('_', ' ')} Parlay`,
        sport: legs.length > 1 ? 'Mixed' : sport,
        type: 'Moneyline',
        legs,
        totalOdds: '+450',
        confidence: Math.floor(legs.reduce((acc, leg) => acc + leg.confidence, 0) / legs.length),
        analysis: 'AI-generated parlay based on today\'s matchups from The Odds API.',
        timestamp: new Date().toISOString(),
        isGenerated: true,
        isToday: true
      };
      
      setSelectedParlay(newParlay);
      setShowBuildModal(true);
      
    } catch (error: any) {
      console.error('Error generating parlay:', error);
      alert(`Failed to generate parlay: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  }, [todaysGames]);

  // Apply filters
  useEffect(() => {
    let filtered = [...suggestions];
    
    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(p => p.isToday);
    }
    
    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(p => p.sport === selectedSport);
    }
    
    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }
    
    // Confidence filter
    filtered = filtered.filter(p => p.confidence >= minConfidence);
    
    // Max legs filter
    filtered = filtered.filter(p => p.legs.length <= maxLegs);
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.analysis.toLowerCase().includes(query) ||
        p.legs.some(leg => leg.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredSuggestions(filtered);
  }, [suggestions, selectedSport, selectedType, minConfidence, maxLegs, searchQuery, dateFilter]);

// Debug Panel Component
const DebugPanel = () => {
  const [componentStats, setComponentStats] = useState<any>({});
  
  useEffect(() => {
    const updateStats = () => {
      const stats = {
        'ParlayArchitectScreen': {
          mountTime: new Date().toISOString(),
          suggestionCount: suggestions.length,
          filteredCount: filteredSuggestions.length,
          todaysGamesCount: todaysGames?.length || 0,
          lastRefresh: lastRefresh ? format(lastRefresh, 'h:mm:ss a') : 'Never'
        }
      };
      setComponentStats(stats);
    };
    
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [suggestions, filteredSuggestions, todaysGames, lastRefresh]);
  
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
                • Suggestions: {suggestions.length}
              </Typography>
              <Typography variant="body2">
                • Filtered: {filteredSuggestions.length}
              </Typography>
              <Typography variant="body2">
                • Today's Games: {todaysGames?.length || 0}
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
              <Typography variant="body2">
                • Parlay API: {parlayError ? '❌ Error' : '✅ Connected'}
              </Typography>
              <Typography variant="body2">
                • Odds API: {oddsError ? '❌ Error' : '✅ Connected'}
              </Typography>
              <Typography variant="body2">
                • Last Check: {new Date().toLocaleTimeString()}
              </Typography>
            </Box>
            
            <Box mt={2}>
              <Button
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: '#64748b', mr: 1 }}
                onClick={() => {
                  console.log('🔄 Manual debug refresh triggered');
                  refetchParlays();
                  refetchOdds();
                }}
              >
                Force Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {parlayError && (
          <Alert severity="error" sx={{ mt: 2, bgcolor: '#7f1d1d' }}>
            <AlertTitle>API Error</AlertTitle>
            {String(parlayError)}
          </Alert>
        )}
      </Paper>
    </Collapse>
  );
};

// Add to your ParlayArchitectScreen.tsx render function
const ConfidenceMeter = ({ score, level }: { score: number; level: string }) => {
  const colors = {
    'very-high': '#10b981',
    'high': '#3b82f6',
    'medium': '#f59e0b',
    'low': '#ef4444',
    'very-low': '#dc2626'
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 80, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            width: `${Math.min(score, 100)}%`,
            height: 8,
            bgcolor: colors[level as keyof typeof colors] || '#64748b'
          }}
        />
      </Box>
      <Typography variant="caption" fontWeight="bold" color={colors[level as keyof typeof colors]}>
        {score}%
      </Typography>
    </Box>
  );
};

// Today's Games Component
const TodaysGamesPanel = () => (
  <Paper sx={{ mb: 4 }}>
    <Accordion expanded={showTodaysGames} onChange={() => setShowTodaysGames(!showTodaysGames)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={2}>
          <TodayIcon color="primary" />
          <Typography variant="h6">Today's Games (Live from The Odds API)</Typography>
          <Chip 
            label={`${todaysGames?.length || 0} games`} 
            size="small" 
            color={oddsLoading ? "default" : oddsError ? "error" : "success"}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {oddsLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>Loading live games...</Typography>
          </Box>
        ) : oddsError ? (
          <Alert severity="warning">
            <AlertTitle>Using Fallback Data</AlertTitle>
            {String(oddsError)}
          </Alert>
        ) : (!todaysGames || todaysGames.length === 0) ? (
          <Alert severity="info">
            <AlertTitle>No Games Today</AlertTitle>
            Check back later for today's matchups.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {todaysGames.map((game: Game) => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {format(parseISO(game.commence_time), 'h:mm a')}
                      </Typography>
                      <Chip 
                        label={game.sport_title} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                    
                    <Box textAlign="center" mb={2}>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {game.away_team}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">@</Typography>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {game.home_team}
                      </Typography>
                    </Box>
                    
                    {game.bookmakers?.[0]?.markets?.[0]?.outcomes && (
                      <Box display="flex" justifyContent="center" gap={1}>
                        {game.bookmakers[0].markets[0].outcomes.slice(0, 2).map((outcome, idx) => (
                          <Chip
                            key={idx}
                            label={`${outcome.name}: ${outcome.price > 0 ? '+' : ''}${outcome.price}`}
                            size="small"
                            sx={{
                              bgcolor: outcome.price > 0 ? '#10b98120' : '#ef444420',
                              color: outcome.price > 0 ? '#10b981' : '#ef4444'
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Button 
                      size="small" 
                      variant="outlined" 
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        // Quick pick from this game
                        const quickParlay: ParlaySuggestion = {
                          id: `quick-${Date.now()}`,
                          name: `${game.away_team} @ ${game.home_team}`,
                          sport: game.sport_title,
                          type: 'Moneyline',
                          legs: [{
                            id: `leg-${Date.now()}`,
                            gameId: game.id,
                            description: `${game.home_team} ML`,
                            odds: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.[1]?.price 
                              ? (game.bookmakers[0].markets[0].outcomes[1].price > 0 
                                ? `+${game.bookmakers[0].markets[0].outcomes[1].price}`
                                : game.bookmakers[0].markets[0].outcomes[1].price.toString())
                              : '-110',
                            confidence: 68,
                            sport: game.sport_title,
                            market: 'h2h',
                            outcome: game.home_team
                          }],
                          totalOdds: '-110',
                          confidence: 68,
                          analysis: 'Quick pick from today\'s live game',
                          timestamp: new Date().toISOString(),
                          isGenerated: true,
                          isToday: true
                        };
                        setSelectedParlay(quickParlay);
                        setShowBuildModal(true);
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

return (
  <Container maxWidth="lg">
    {/* Header */}
    <Paper sx={{ 
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
          
          {/* Debug toggle button */}
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
        
        {/* Last refresh indicator */}
        {lastRefresh && (
          <Chip 
            label={`Last updated: ${format(lastRefresh, 'h:mm:ss a')}`}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        )}
      </Box>

      <Box display="flex" alignItems="center" gap={3}>
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
          <MergeIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Parlay Architect
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Live odds from The Odds API + AI-generated suggestions
          </Typography>
        </Box>
      </Box>
    </Paper>

    {/* Debug Panel - Placed right after header */}
    <DebugPanel />

    {/* Action Bar */}
    <Paper sx={{ p: 2, mb: 4 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<AutorenewIcon />}
            onClick={() => generateParlayFromGames(selectedSport, 3)}
            disabled={generating || !todaysGames || todaysGames.length === 0}
          >
            {generating ? 'Generating...' : 'Generate Parlay'}
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Sport</InputLabel>
            <Select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              label="Sport"
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
            <IconButton 
              onClick={() => {
                refetchParlays();
                setLastRefresh(new Date());
              }} 
              disabled={isLoading}
              title="Refresh parlays"
            >
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <SearchIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Paper>

    {/* Today's Games Panel */}
    <TodaysGamesPanel />

    {/* Display suggestions */}
    {isLoading ? (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading parlay suggestions...</Typography>
      </Box>
    ) : parlayError ? (
      <Alert severity="error" sx={{ mb: 3 }}>
        <AlertTitle>Error Loading Parlays</AlertTitle>
        {String(parlayError)}
        <Button size="small" sx={{ ml: 2 }} onClick={() => refetchParlays()}>
          Retry
        </Button>
      </Alert>
    ) : filteredSuggestions.length > 0 ? (
      <Box>
        <Typography variant="h6" gutterBottom>
          Parlay Suggestions ({filteredSuggestions.length})
        </Typography>
        <Grid container spacing={3}>
          {filteredSuggestions.map((parlay) => (
            <Grid item xs={12} md={6} key={parlay.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{parlay.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {parlay.analysis}
                  </Typography>
                  
                  {/* Added: AI Confidence and EV Display */}
                  {parlay.confidence !== undefined && (
                    <Box sx={{ mb: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          AI Confidence: {parlay.confidence_level?.replace('-', ' ')}
                        </Typography>
                        <Chip 
                          label={`EV: ${parlay.expected_value || '+0%'}`}
                          size="small"
                          sx={{ 
                            bgcolor: parlay.expected_value?.startsWith('+') ? '#10b98120' : '#ef444420',
                            color: parlay.expected_value?.startsWith('+') ? '#10b981' : '#ef4444',
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                      <ConfidenceMeter score={parlay.confidence} level={parlay.confidence_level || 'medium'} />
                    </Box>
                  )}
                  
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setSelectedParlay(parlay);
                      setShowBuildModal(true);
                    }}
                  >
                    Build This Parlay
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    ) : (
      <Alert severity="info">
        <AlertTitle>No Parlay Suggestions</AlertTitle>
        Try changing your filters or generating a new parlay.
      </Alert>
    )}

    {/* Build Modal */}
    <Dialog open={showBuildModal} onClose={() => setShowBuildModal(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Build Parlay: {selectedParlay?.name}
      </DialogTitle>
      <DialogContent>
        {selectedParlay && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pick</TableCell>
                  <TableCell>Odds</TableCell>
                  <TableCell>Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedParlay.legs.map((leg, index) => (
                  <TableRow key={index}>
                    <TableCell>{leg.description}</TableCell>
                    <TableCell>{leg.odds}</TableCell>
                    <TableCell>
                      <LinearProgress 
                        variant="determinate" 
                        value={leg.confidence}
                        sx={{ width: 100 }}
                      />
                      <Typography variant="body2">{leg.confidence}%</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowBuildModal(false)}>Cancel</Button>
        <Button variant="contained">Add to Bet Slip</Button>
      </DialogActions>
    </Dialog>
  </Container>
);
};

export default ParlayArchitectScreen;
