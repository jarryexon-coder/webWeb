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
  LinearProgress,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Badge,
  Avatar,
  Stack,
  Switch,
  FormControlLabel,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  SportsBasketball as SportsBasketballIcon,
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  SportsSoccer as SportsSoccerIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LiveTv as LiveTvIcon,
  EmojiEvents as EmojiEventsIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Tv as TvIcon,
  PlayCircle as PlayCircleIcon,
  Videocam as VideocamIcon,
  BarChart as BarChartIcon,
  FilterList as FilterListIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingFlat as TrendingFlatIcon,
  Whatshot as WhatshotIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const LiveGamesScreen = () => {
  const theme = useTheme();
  
  // Main states
  const [selectedSport, setSelectedSport] = useState('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filteredGames, setFilteredGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Game stats
  const [gameStats, setGameStats] = useState({
    liveCount: 0,
    finalCount: 0,
    totalGames: 0,
    totalPoints: 0,
    averageScore: 0
  });

  // Live updates
  const [liveUpdates, setLiveUpdates] = useState<any[]>([
    { id: 1, sport: 'all', time: 'Just now', text: '🔥 Exciting action in sports right now! Check out the live scores.' },
    { id: 2, sport: 'all', time: '2 min ago', text: '⚡ Big play just happened in one of the games!' },
    { id: 3, sport: 'all', time: '5 min ago', text: '🏆 Close game alert in multiple sports! Scores are tight.' },
  ]);

  // Sports data
  const sports = [
    { id: 'all', name: 'All Sports', icon: <WhatshotIcon />, color: '#8b5cf6', count: 7 },
    { id: 'NBA', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444', count: 3 },
    { id: 'NFL', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6', count: 2 },
    { id: 'NHL', name: 'NHL', icon: <SportsHockeyIcon />, color: '#1e40af', count: 1 },
    { id: 'MLB', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981', count: 1 }
  ];

  // Mock games data
  const mockGamesData = {
    all: [
      {
        id: 1,
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
      },
      {
        id: 2,
        sport: 'NBA',
        awayTeam: 'Boston Celtics',
        homeTeam: 'Miami Heat',
        awayScore: 112,
        homeScore: 98,
        period: 'Final',
        timeRemaining: '0:00',
        status: 'final',
        quarter: '4th',
        channel: 'ESPN',
        lastPlay: 'Game ended',
        awayColor: '#007a33',
        homeColor: '#98002e',
        awayRecord: '57-25',
        homeRecord: '44-38',
        arena: 'FTX Arena',
        attendance: '19,600',
        gameClock: '0:00',
        broadcast: { network: 'ESPN', stream: 'NBA League Pass' },
        bettingLine: { spread: 'BOS -4.5', total: '218.5' }
      },
      {
        id: 3,
        sport: 'NBA',
        awayTeam: 'Phoenix Suns',
        homeTeam: 'Denver Nuggets',
        awayScore: 95,
        homeScore: 97,
        period: '3rd',
        timeRemaining: '3:45',
        status: 'live',
        quarter: '3rd',
        channel: 'ABC',
        lastPlay: 'Nikola Jokić makes layup',
        awayColor: '#e56020',
        homeColor: '#0e2240',
        awayRecord: '45-37',
        homeRecord: '53-29',
        arena: 'Ball Arena',
        attendance: '19,520',
        gameClock: '3:45',
        broadcast: { network: 'ABC', stream: 'NBA League Pass' },
        bettingLine: { spread: 'DEN -3.5', total: '230.5' }
      },
      {
        id: 4,
        sport: 'NFL',
        awayTeam: 'Kansas City Chiefs',
        homeTeam: 'Baltimore Ravens',
        awayScore: 24,
        homeScore: 17,
        period: '4th',
        timeRemaining: '2:34',
        status: 'live',
        quarter: '4th',
        channel: 'CBS',
        lastPlay: 'Patrick Mahomes 15-yard pass',
        awayColor: '#e31837',
        homeColor: '#241773',
        awayRecord: '14-3',
        homeRecord: '13-4',
        stadium: 'M&T Bank Stadium',
        attendance: '71,008',
        gameClock: '2:34',
        broadcast: { network: 'CBS', stream: 'Paramount+' },
        bettingLine: { spread: 'KC -2.5', total: '48.5' }
      }
    ],
    NBA: [
      {
        id: 1,
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
      },
      {
        id: 2,
        sport: 'NBA',
        awayTeam: 'Boston Celtics',
        homeTeam: 'Miami Heat',
        awayScore: 112,
        homeScore: 98,
        period: 'Final',
        timeRemaining: '0:00',
        status: 'final',
        quarter: '4th',
        channel: 'ESPN',
        lastPlay: 'Game ended',
        awayColor: '#007a33',
        homeColor: '#98002e',
        awayRecord: '57-25',
        homeRecord: '44-38',
        arena: 'FTX Arena',
        attendance: '19,600',
        gameClock: '0:00',
        broadcast: { network: 'ESPN', stream: 'NBA League Pass' },
        bettingLine: { spread: 'BOS -4.5', total: '218.5' }
      }
    ]
  };

  // Load games data
  const loadLiveGames = useCallback(async (isRefresh = false, searchText = '') => {
    if (!isRefresh) setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let games = mockGamesData[selectedSport as keyof typeof mockGamesData] || [];
      
      // Apply search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        games = games.filter(game => 
          game.awayTeam.toLowerCase().includes(searchLower) ||
          game.homeTeam.toLowerCase().includes(searchLower) ||
          (game.arena || '').toLowerCase().includes(searchLower) ||
          game.channel.toLowerCase().includes(searchLower)
        );
      }
      
      setFilteredGames(games);
      
      // Calculate stats
      const liveGamesCount = games.filter(game => game.status === 'live').length;
      const finalGamesCount = games.filter(game => game.status === 'final').length;
      const totalPoints = games.reduce((sum, game) => sum + game.awayScore + game.homeScore, 0);
      const averageScore = games.length > 0 ? Math.round(totalPoints / games.length) : 0;

      setGameStats({
        liveCount: liveGamesCount,
        finalCount: finalGamesCount,
        totalGames: games.length,
        totalPoints,
        averageScore
      });
      
    } catch (error) {
      console.error('Error loading live games:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSport]);

  useEffect(() => {
    loadLiveGames(false, searchQuery);
    
    // Auto-refresh setup
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLiveGames(true, searchQuery);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [loadLiveGames, searchQuery, autoRefresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLiveGames(true, searchQuery);
  };

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    }
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    setSearchQuery('');
    setSearchInput('');
  };

  const handleGameSelect = (game: any) => {
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
                disabled={refreshing}
                variant="contained"
                size="small"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
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
        {sports.map((sport) => (
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
                  badgeContent={sport.count}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
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
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderGameCard = (game: any) => {
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
                <Avatar sx={{ bgcolor: game.awayColor, width: 40, height: 40 }}>
                  {game.awayTeam.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="medium">
                    {game.awayTeam.split(' ').pop()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {game.awayRecord}
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
                    {game.homeRecord}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: game.homeColor, width: 40, height: 40 }}>
                  {game.homeTeam.charAt(0)}
                </Avatar>
              </Box>
            </Grid>
          </Grid>
          
          {/* Game Info */}
          <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOnIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {game.arena || game.stadium}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TvIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {game.broadcast?.network || game.channel}
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
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<BarChartIcon />}
              onClick={() => handleGameSelect(game)}
              fullWidth
            >
              View Stats
            </Button>
            <Button
              variant="outlined"
              startIcon={<PlayCircleIcon />}
              onClick={() => alert(`Watch ${game.awayTeam} vs ${game.homeTeam} live on ${game.broadcast?.network || game.channel}`)}
              fullWidth
            >
              Watch
            </Button>
            <Button
              variant="outlined"
              startIcon={<VideocamIcon />}
              onClick={() => alert(`View highlights for ${game.awayTeam} vs ${game.homeTeam}`)}
              fullWidth
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
          disabled={refreshing}
          variant="outlined"
          size="small"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
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
              <Avatar sx={{ bgcolor: selectedGame.awayColor }}>
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
                      Record: {selectedGame.awayRecord}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Color: 
                      <Box sx={{ 
                        display: 'inline-block',
                        width: 20, 
                        height: 20, 
                        backgroundColor: selectedGame.awayColor,
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
                      Record: {selectedGame.homeRecord}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Color: 
                      <Box sx={{ 
                        display: 'inline-block',
                        width: 20, 
                        height: 20, 
                        backgroundColor: selectedGame.homeColor,
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
                          <strong>Arena:</strong> {selectedGame.arena || selectedGame.stadium}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TvIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Channel:</strong> {selectedGame.broadcast?.network || selectedGame.channel}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEventsIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Attendance:</strong> {selectedGame.attendance || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          <strong>Period:</strong> {selectedGame.period || selectedGame.quarter} • {selectedGame.timeRemaining || '0:00'}
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
              to={`/analytics?team=${selectedGame.awayTeam}&sport=${selectedGame.sport}`}
            >
              View Advanced Analytics
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {renderHeader()}
      {renderSportSelector()}
      {renderLiveStats()}
      
      {/* Games Section */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {selectedSport === 'all' ? 'All Sports' : selectedSport} Games
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
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Games'}
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
          🔄 Auto-refreshing every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
        </Typography>
        {searchQuery && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Tip: Try searching by team names like "Warriors Lakers" or arena names
          </Typography>
        )}
      </Paper>
      
      {renderGameDialog()}
    </Container>
  );
};

export default LiveGamesScreen;
