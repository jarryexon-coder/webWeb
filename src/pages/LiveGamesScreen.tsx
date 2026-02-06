// src/pages/LiveGamesScreen.tsx
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
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Badge,
  Avatar,
  Stack,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  SportsBasketball as SportsBasketballIcon,
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LiveTv as LiveTvIcon,
  EmojiEvents as EmojiEventsIcon,
  BarChart as BarChartIcon,
  FilterList as FilterListIcon,
  Info as InfoIcon,
  PlayCircle as PlayCircleIcon,
  Videocam as VideocamIcon,
  LocationOn as LocationOnIcon,
  Tv as TvIcon,
  Whatshot as WhatshotIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

// ADD THIS IMPORT
import { useOddsGames } from '../hooks/useBackendAPI';

interface Game {
  id: string;
  sport: string;
  awayTeam: string;
  homeTeam: string;
  awayScore: number;
  homeScore: number;
  period: string;
  timeRemaining: string;
  status: 'live' | 'final' | 'scheduled';
  quarter?: string;
  channel?: string;
  lastPlay?: string;
  awayColor?: string;
  homeColor?: string;
  awayRecord?: string;
  homeRecord?: string;
  arena?: string;
  attendance?: string;
  gameClock?: string;
  broadcast?: { network: string; stream: string };
  bettingLine?: { spread: string; total: string };
}

const LiveGamesScreen = () => {
  // Debug logging
  useEffect(() => {
    console.log('=== LiveGamesScreen Debug ===');
    console.log('API Base URL:', import.meta.env.VITE_API_BASE);
    console.log('Backend URL:', 'https://pleasing-determination-production.up.railway.app');
    console.log('==========================');
  }, []);

  // Main states
  const [selectedSport, setSelectedSport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Game stats
  const [gameStats, setGameStats] = useState({
    liveCount: 0,
    finalCount: 0,
    totalGames: 0,
    totalPoints: 0,
    averageScore: 0
  });

  // Live updates
  const [liveUpdates, setLiveUpdates] = useState([
    { id: 1, sport: 'all', time: 'Just now', text: 'Loading live games...' },
  ]);

  // Sports data - Map frontend sport IDs to API sport keys
  const sports = [
    { id: 'all', name: 'All Sports', icon: <WhatshotIcon />, color: '#8b5cf6', apiKey: '' },
    { id: 'NBA', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444', apiKey: 'basketball_nba' },
    { id: 'NFL', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6', apiKey: 'americanfootball_nfl' },
    { id: 'NHL', name: 'NHL', icon: <SportsHockeyIcon />, color: '#1e40af', apiKey: 'icehockey_nhl' },
    { id: 'MLB', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981', apiKey: 'baseball_mlb' }
  ];

  // Get API sport key for selected sport
  const getApiSportKey = () => {
    const sportObj = sports.find(s => s.id === selectedSport);
    return sportObj?.apiKey || 'basketball_nba'; // Default to NBA
  };

  // Mock games data as fallback
  const mockGamesData: Game[] = [
    {
      id: '1',
      sport: 'NBA',
      awayTeam: 'Golden State Warriors',
      homeTeam: 'Los Angeles Lakers',
      awayScore: 105,
      homeScore: 108,
      period: '4th',
      timeRemaining: '2:15',
      status: 'live',
      quarter: '4th',
      channel: 'TNT',
      lastPlay: 'LeBron James makes 3-pointer',
      awayColor: '#1d428a',
      homeColor: '#552583',
      awayRecord: '42-38',
      homeRecord: '43-37',
      arena: 'Crypto.com Arena',
      attendance: '18,997',
      gameClock: '2:15',
      broadcast: { network: 'TNT', stream: 'NBA League Pass' },
      bettingLine: { spread: 'LAL -2.5', total: '225.5' }
    }
  ];

  // ===== USE ODDS GAMES HOOK =====
  const {
    data: gamesData,
    isLoading,
    error: hookError,
    refetch,
    isRefetching
  } = useOddsGames(
    getApiSportKey(),
    'us',
    'h2h,spreads,totals',
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchInterval: autoRefresh ? 30 * 1000 : false, // 30 seconds if autoRefresh enabled
      retry: 2,
      retryDelay: 1000
    }
  );

  // Transform API data to our format
  const transformApiData = useCallback((apiData: any): Game[] => {
    console.log('🔄 Transforming API data:', apiData);
    
    if (!apiData || !apiData.games) {
      return mockGamesData; // Fallback to mock data
    }

    try {
      return apiData.games.map((game: any, index: number) => ({
        id: game.id || game.game_id || `game-${Date.now()}-${index}`,
        sport: game.sport || 'NBA',
        awayTeam: game.away_team || game.awayTeam || 'Away Team',
        homeTeam: game.home_team || game.homeTeam || 'Home Team',
        awayScore: game.away_score || game.awayScore || 0,
        homeScore: game.home_score || game.homeScore || 0,
        period: game.period || game.quarter || '1st',
        timeRemaining: game.time_remaining || game.timeRemaining || '12:00',
        status: game.status || 'scheduled',
        quarter: game.quarter || game.period || '1st',
        channel: game.channel || game.broadcast?.network || 'TBD',
        lastPlay: game.last_play || game.lastPlay || 'Game starting soon',
        awayColor: game.away_color || game.awayColor || '#1d428a',
        homeColor: game.home_color || game.homeColor || '#552583',
        awayRecord: game.away_record || game.awayRecord || '0-0',
        homeRecord: game.home_record || game.homeRecord || '0-0',
        arena: game.arena || game.venue || game.location || 'Unknown Arena',
        attendance: game.attendance || '0',
        gameClock: game.game_clock || game.gameClock || game.time_remaining,
        broadcast: game.broadcast || { network: game.channel || 'TBD', stream: 'League Pass' },
        bettingLine: game.betting_line || game.bettingLine || { spread: 'EVEN', total: '200.5' }
      }));
    } catch (error) {
      console.error('Error transforming API data:', error);
      return mockGamesData;
    }
  }, []);

  // Process and filter games
  const processGames = useCallback((games: Game[]) => {
    console.log('🔍 Processing games:', games.length);
    
    let filtered = [...games];
    
    // Apply sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(game => game.sport === selectedSport);
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(game => 
        game.awayTeam.toLowerCase().includes(searchLower) ||
        game.homeTeam.toLowerCase().includes(searchLower) ||
        (game.arena || '').toLowerCase().includes(searchLower) ||
        (game.channel || '').toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredGames(filtered);
    
    // Calculate stats
    const liveGamesCount = filtered.filter(game => game.status === 'live').length;
    const finalGamesCount = filtered.filter(game => game.status === 'final').length;
    const totalPoints = filtered.reduce((sum, game) => sum + game.awayScore + game.homeScore, 0);
    const averageScore = filtered.length > 0 ? 
      Math.round(totalPoints / filtered.length) : 0;
    
    setGameStats({
      liveCount: liveGamesCount,
      finalCount: finalGamesCount,
      totalGames: filtered.length,
      totalPoints,
      averageScore
    });

    // Update live updates
    if (filtered.length > 0) {
      const newUpdates = [
        { 
          id: 1, 
          sport: 'all', 
          time: 'Just now', 
          text: `Loaded ${filtered.length} ${selectedSport === 'all' ? 'games' : selectedSport + ' games'} from ${gamesData?.source || 'API'}`
        },
        { 
          id: 2, 
          sport: 'all', 
          time: '1 min ago', 
          text: `${liveGamesCount} games currently live` 
        },
        { 
          id: 3, 
          sport: 'all', 
          time: '2 min ago', 
          text: 'Real-time updates enabled' 
        }
      ];
      setLiveUpdates(newUpdates);
    }
  }, [selectedSport, searchQuery, gamesData?.source]);

  // Process data when API data changes
  useEffect(() => {
    if (gamesData) {
      console.log('📊 Games data received:', gamesData);
      
      // Show success message
      setSuccess(`✅ Loaded ${gamesData.games?.length || 0} games from ${gamesData.source || 'API'}`);
      setError(null);
      
      // Transform and process data
      const transformedGames = transformApiData(gamesData);
      processGames(transformedGames);
      
    } else if (hookError) {
      console.error('❌ Hook error:', hookError);
      setError(`Failed to load games: ${hookError.message || 'Unknown error'}`);
      setSuccess(null);
      
      // Use mock data on error
      processGames(mockGamesData);
    }
  }, [gamesData, hookError, transformApiData, processGames]);

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
    setLiveUpdates(prev => [
      { id: Date.now(), sport: 'all', time: 'Just now', text: 'Manually refreshing games...' },
      ...prev.slice(0, 2)
    ]);
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    } else {
      setSearchQuery('');
    }
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    setSearchQuery('');
    setSearchInput('');
    
    // Update live updates
    const sportName = sports.find(s => s.id === sportId)?.name || sportId;
    setLiveUpdates(prev => [
      { id: Date.now(), sport: 'all', time: 'Just now', text: `Filtered to ${sportName} games` },
      ...prev.slice(0, 2)
    ]);
  };

  const handleGameSelect = (game: Game) => {
    setSelectedGame(game);
    setGameDialogOpen(true);
  };

  const renderHeader = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #0f172a, #1e293b)',
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
        background: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
      }} />
      <Container maxWidth="lg">
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                🏀 Live Games
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9 }}>
                Real-time sports action and scores
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                Source: {gamesData?.source ? `${gamesData.source} API` : 'Demo Data'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto Refresh"
                sx={{ color: 'white' }}
              />
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={isLoading || isRefetching}
                variant="contained"
                size="small"
              >
                {isRefetching ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          </Box>
          
          {/* Search Bar */}
          <Paper sx={{ mt: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search teams, arenas, sports..."
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
                    <IconButton onClick={() => setSearchInput('')} size="small">
                      <CancelIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Paper>
        </Box>
      </Container>
    </Box>
  );

  const renderSportSelector = () => (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterListIcon />
        Filter by Sport
      </Typography>
      <Grid container spacing={2}>
        {sports.map((sport) => {
          // Calculate count based on transformed games
          const gamesFromApi = gamesData ? transformApiData(gamesData) : mockGamesData;
          const count = sport.id === 'all' 
            ? gamesFromApi.length 
            : gamesFromApi.filter(g => g.sport === sport.id).length;
            
          return (
            <Grid item key={sport.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: selectedSport === sport.id ? `3px solid ${sport.color}` : '2px solid #e5e7eb',
                  minWidth: 120,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleSportChange(sport.id)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: sport.color, mb: 1 }}>
                    {sport.icon}
                  </Box>
                  <Typography variant="body2" fontWeight="medium">
                    {sport.name}
                  </Typography>
                  <Badge
                    badgeContent={count}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );

  const renderLiveStats = () => (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUpIcon />
        📈 Live Stats Summary
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ color: '#ef4444', mb: 1 }}>
                <LiveTvIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4">{gameStats.liveCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Games Live
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ color: '#10b981', mb: 1 }}>
                <EmojiEventsIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4">{gameStats.totalPoints}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ color: '#3b82f6', mb: 1 }}>
                <BarChartIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4">{gameStats.averageScore}</Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ color: '#8b5cf6', mb: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4">{gameStats.finalCount}</Typography>
              <Typography variant="body2" color="text-secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderGameCard = (game: Game) => {
    const isLive = game.status === 'live';
    const isFinal = game.status === 'final';
    
    return (
      <Card
        key={game.id}
        sx={{
          mb: 3,
          transition: 'all 0.2s',
          borderLeft: `4px solid ${isLive ? '#ef4444' : isFinal ? '#10b981' : '#3b82f6'}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 6
          }
        }}
      >
        <CardContent>
          {/* Game Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip
              label={game.sport}
              color="primary"
              size="small"
              icon={<SportsBasketballIcon />}
            />
            <Chip
              label={isLive ? 'LIVE' : isFinal ? 'FINAL' : 'UPCOMING'}
              color={isLive ? 'error' : isFinal ? 'success' : 'info'}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          {/* Teams and Scores */}
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: game.awayColor || '#1d428a', width: 40, height: 40 }}>
                  {game.awayTeam.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="medium">
                    {game.awayTeam.split(' ').pop()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {game.awayRecord || '0-0'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={2} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {game.awayScore} - {game.homeScore}
              </Typography>
              {isLive && (
                <Typography variant="caption" color="error.main" fontWeight="medium">
                  {game.timeRemaining} {game.period}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="medium">
                    {game.homeTeam.split(' ').pop()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {game.homeRecord || '0-0'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: game.homeColor || '#552583', width: 40, height: 40 }}>
                  {game.homeTeam.charAt(0)}
                </Avatar>
              </Box>
            </Grid>
          </Grid>
          
          {/* Game Info */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOnIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {game.arena || 'Unknown Arena'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TvIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {game.broadcast?.network || game.channel || 'TBD'}
              </Typography>
            </Box>
            {game.attendance && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmojiEventsIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {game.attendance}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Last Play */}
          {isLive && game.lastPlay && (
            <Alert severity="info" icon={<PlayCircleIcon />} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Last Play:</strong> {game.lastPlay}
              </Typography>
            </Alert>
          )}
          
          {/* Betting Line */}
          {game.bettingLine && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Betting:</strong> {game.bettingLine.spread} • O/U {game.bettingLine.total}
              </Typography>
            </Box>
          )}
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<BarChartIcon />}
              onClick={() => handleGameSelect(game)}
              sx={{ flex: 1, minWidth: '120px' }}
            >
              View Stats
            </Button>
            <Button
              variant="outlined"
              startIcon={<PlayCircleIcon />}
              onClick={() => alert(`Watch ${game.awayTeam} vs ${game.homeTeam} live on ${game.broadcast?.network || game.channel || 'available channels'}`)}
              sx={{ flex: 1, minWidth: '120px' }}
            >
              Watch
            </Button>
            <Button
              variant="outlined"
              startIcon={<VideocamIcon />}
              onClick={() => alert(`View highlights for ${game.awayTeam} vs ${game.homeTeam}`)}
              sx={{ flex: 1, minWidth: '120px' }}
            >
              Highlights
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderLiveUpdates = () => (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RefreshIcon />
          🔄 Live Updates
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLoading || isRefetching}
          variant="outlined"
          size="small"
        >
          {isRefetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      
      <Stack spacing={2}>
        {liveUpdates.map((update) => (
          <Card key={update.id} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Chip
                  label={update.sport === 'all' ? 'ALL' : update.sport}
                  size="small"
                  color="primary"
                />
                <Typography variant="caption" color="text.secondary">
                  {update.time}
                </Typography>
              </Box>
              <Typography variant="body2">
                {update.text}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Paper>
  );

  const renderGameDialog = () => (
    <Dialog 
      open={gameDialogOpen} 
      onClose={() => setGameDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      {selectedGame && (
        <>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: selectedGame.awayColor || '#1d428a' }}>
                {selectedGame.awayTeam.charAt(0)}
              </Avatar>
              <Typography variant="h6">
                {selectedGame.awayTeam} vs {selectedGame.homeTeam}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h4" align="center" color="primary.main" gutterBottom>
                  {selectedGame.awayScore} - {selectedGame.homeScore}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedGame.awayTeam}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Record: {selectedGame.awayRecord || '0-0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Color: 
                      <Box sx={{ 
                        display: 'inline-block',
                        width: 20, 
                        height: 20, 
                        backgroundColor: selectedGame.awayColor || '#1d428a',
                        ml: 1,
                        verticalAlign: 'middle',
                        borderRadius: '50%'
                      }} />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedGame.homeTeam}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Record: {selectedGame.homeRecord || '0-0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Color: 
                      <Box sx={{ 
                        display: 'inline-block',
                        width: 20, 
                        height: 20, 
                        backgroundColor: selectedGame.homeColor || '#552583',
                        ml: 1,
                        verticalAlign: 'middle',
                        borderRadius: '50%'
                      }} />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Game Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Arena:</strong> {selectedGame.arena || 'Unknown Arena'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TvIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Channel:</strong> {selectedGame.broadcast?.network || selectedGame.channel || 'TBD'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEventsIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Attendance:</strong> {selectedGame.attendance || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Period:</strong> {selectedGame.period} • {selectedGame.timeRemaining}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {selectedGame.lastPlay && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<PlayCircleIcon />}>
                    <Typography variant="body2">
                      <strong>Last Play:</strong> {selectedGame.lastPlay}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              
              {selectedGame.bettingLine && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Betting Information
                      </Typography>
                      <Typography variant="body2">
                        <strong>Spread:</strong> {selectedGame.bettingLine.spread}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total:</strong> {selectedGame.bettingLine.total}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGameDialogOpen(false)}>Close</Button>
            <Button 
              variant="contained" 
              component={Link}
              to={`/advanced-analytics?team=${selectedGame.awayTeam}&sport=${selectedGame.sport}`}
            >
              View Advanced Analytics
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  if (isLoading && !isRefetching) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 3 }}>
          <CircularProgress size={60} />
          <Typography variant="h6">
            Loading live games...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Using: {getApiSportKey()}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Error/Success Snackbars */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {renderHeader()}
      {renderSportSelector()}
      {renderLiveStats()}
      
      {/* Games Section */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {selectedSport === 'all' ? 'All Sports' : selectedSport} Games
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              Source: {gamesData?.source ? `${gamesData.source} API` : 'Demo Data'}
            </Typography>
          </Typography>
          <Chip
            label={`${gameStats.liveCount} LIVE`}
            color="error"
            icon={<LiveTvIcon />}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        {searchQuery && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Showing results for: "{searchQuery}"
          </Alert>
        )}
        
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => renderGameCard(game))
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              No Games Found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : `There are no ${selectedSport === 'all' ? '' : selectedSport + ' '}games happening right now.`
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isLoading || isRefetching}
            >
              {isRefetching ? 'Refreshing...' : 'Refresh Games'}
            </Button>
          </Box>
        )}
      </Paper>
      
      {renderLiveUpdates()}
      
      {/* Info Section */}
      <Paper sx={{ p: 4, mb: 4, backgroundColor: 'info.light' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <InfoIcon color="info" />
          <Typography variant="h6">
            Live Games Information
          </Typography>
        </Box>
        <Typography variant="body2">
          {autoRefresh ? '🔄 Auto-refreshing every 30 seconds' : '⏸️ Auto-refresh disabled'} • Last updated: {new Date().toLocaleTimeString()}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Backend URL: {import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app'}
        </Typography>
        <Typography variant="body2">
          Current Sport API Key: {getApiSportKey()}
        </Typography>
        <Typography variant="body2">
          Data Source: {gamesData?.source || 'Demo Data'}
        </Typography>
      </Paper>
      
      {renderGameDialog()}
    </Container>
  );
};

export default LiveGamesScreen;
