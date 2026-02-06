// src/pages/MatchAnalyticsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Divider,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Avatar,
  Container,
  Badge,
  Tooltip,
  CircularProgress,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Search,
  SportsFootball,
  SportsBasketball,
  SportsHockey,
  CalendarToday,
  AccessTime,
  LocationOn,
  Tv,
  TrendingUp,
  BarChart,
  AttachMoney,
  Cloud,
  CompareArrows,
  Analytics,
  Scoreboard,
  Groups,
  EmojiEvents,
  Info,
  Lightbulb,
  ChevronRight,
  CheckCircle,
  RadioButtonChecked,
  Schedule,
  MoreHoriz,
  Close,
  Whatshot,
  Bolt,
  Psychology,
  TrendingUp as TrendingUpIcon,
  Newspaper as NewspaperIcon,
  Error as ErrorIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

// Import React Query hook
import { useAnalytics } from '../hooks/useBackendAPI';

// Mock Data
const MOCK_DATA = {
  nfl: {
    games: [
      {
        id: 1,
        homeTeam: { name: 'Chiefs', logo: 'KC', color: '#E31837' },
        awayTeam: { name: 'Ravens', logo: 'BAL', color: '#241773' },
        homeScore: 24,
        awayScore: 21,
        status: 'Final',
        sport: 'NFL',
        date: 'Jan 15, 2024',
        time: '3:00 PM EST',
        venue: 'Arrowhead Stadium',
        weather: 'Clear, 42°F',
        odds: { spread: '-3.5', total: '48.5' },
        broadcast: 'CBS',
        attendance: '78,000',
        quarter: 'Final'
      },
      {
        id: 2,
        homeTeam: { name: '49ers', logo: 'SF', color: '#AA0000' },
        awayTeam: { name: 'Packers', logo: 'GB', color: '#203731' },
        homeScore: 31,
        awayScore: 28,
        status: 'Final',
        sport: 'NFL',
        date: 'Jan 20, 2024',
        time: '6:30 PM EST',
        venue: 'Levi\'s Stadium',
        weather: 'Partly Cloudy, 48°F',
        odds: { spread: '-6.5', total: '51.5' },
        broadcast: 'FOX',
        attendance: '68,500',
        quarter: 'Final'
      },
      {
        id: 3,
        homeTeam: { name: 'Bills', logo: 'BUF', color: '#00338D' },
        awayTeam: { name: 'Bengals', logo: 'CIN', color: '#FB4F14' },
        homeScore: 27,
        awayScore: 24,
        status: 'Live',
        sport: 'NFL',
        date: 'Today',
        time: '4:25 PM EST',
        venue: 'Highmark Stadium',
        weather: 'Snow, 28°F',
        odds: { spread: '-2.5', total: '47.5' },
        broadcast: 'NBC',
        attendance: '71,000',
        quarter: 'Q3 8:45'
      }
    ]
  },
  nba: {
    games: [
      {
        id: 4,
        homeTeam: { name: 'Lakers', logo: 'LAL', color: '#552583' },
        awayTeam: { name: 'Warriors', logo: 'GSW', color: '#1D428A' },
        homeScore: 115,
        awayScore: 112,
        status: 'Final',
        sport: 'NBA',
        date: 'Jan 18, 2024',
        time: '10:00 PM EST',
        venue: 'Crypto.com Arena',
        weather: 'Indoor',
        odds: { spread: '+3.5', total: '228.5' },
        broadcast: 'TNT',
        attendance: '18,997',
        quarter: 'Final'
      }
    ]
  }
};

const PROMPT_SUGGESTIONS = [
  { text: "Live NFL games", icon: <Bolt />, color: '#ef4444' },
  { text: "NBA scores today", icon: <SportsBasketball />, color: '#f59e0b' },
  { text: "Upcoming matches", icon: <CalendarToday />, color: '#10b981' },
  { text: "Team stats comparison", icon: <BarChart />, color: '#3b82f6' },
];

const TABS = [
  { id: 'conditions', label: 'Conditions', icon: <Cloud /> },
  { id: 'h2h', label: 'H2H Stats', icon: <CompareArrows /> },
  { id: 'matchup', label: 'Matchup', icon: <Analytics /> },
  { id: 'boxscore', label: 'Box Score', icon: <Scoreboard /> },
  { id: 'teamstats', label: 'Team Stats', icon: <BarChart /> },
  { id: 'plays', label: 'Key Plays', icon: <Whatshot /> },
];

const PROMPTS = [
  { id: 'weather', icon: <Cloud />, title: 'Weather Impact', color: '#3b82f6', description: 'How weather affects gameplay' },
  { id: 'homeAway', icon: <LocationOn />, title: 'Home/Away Trends', color: '#10b981', description: 'Venue performance analysis' },
  { id: 'playerMatchup', icon: <Groups />, title: 'Player Matchup', color: '#ef4444', description: 'Key player comparisons' },
  { id: 'recentForm', icon: <TrendingUpIcon />, title: 'Recent Form', color: '#f59e0b', description: 'Team performance trends' },
  { id: 'injury', icon: <EmojiEvents />, title: 'Injury Report', color: '#8b5cf6', description: 'Injury impact assessment' },
  { id: 'predictive', icon: <Psychology />, title: 'Predictive Stats', color: '#ec4899', description: 'Win probability & projections' },
];

const STATS_DATA = [
  { label: 'Total Yards', home: 385, away: 320, icon: <CompareArrows /> },
  { label: 'Passing Yards', home: 265, away: 210, icon: <TrendingUp /> },
  { label: 'Rushing Yards', home: 120, away: 110, icon: <TrendingUp /> },
  { label: 'Turnovers', home: 1, away: 2, icon: <BarChart /> },
  { label: 'Time of Possession', home: '32:15', away: '27:45', icon: <AccessTime /> },
  { label: 'First Downs', home: 22, away: 18, icon: <BarChart /> },
  { label: 'Third Down %', home: '45%', away: '38%', icon: <TrendingUp /> },
  { label: 'Red Zone %', home: '75%', away: '60%', icon: <LocationOn /> },
];

const MatchAnalyticsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use React Query hook
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb'>('nfl');
  
  const { 
    data: analyticsData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useAnalytics(selectedSport);
  
  // Extract games from hook response
  const gamesFromApi = analyticsData?.games || [];
  
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('conditions');
  const [filteredGames, setFilteredGames] = useState<any[]>([]);
  
  // Transform API data to match expected format or use fallback
  const games = React.useMemo(() => {
    if (gamesFromApi && gamesFromApi.length > 0) {
      console.log(`✅ Using REAL analytics data: ${gamesFromApi.length} games`);
      // Transform API data to match our component's expected format
      return gamesFromApi.map((game: any, index: number) => {
        const sportUpper = selectedSport.toUpperCase();
        const mockSportData = MOCK_DATA[selectedSport as keyof typeof MOCK_DATA]?.games || [];
        const mockGame = mockSportData[index] || mockSportData[0] || MOCK_DATA.nfl.games[0];
        
        // Merge API data with mock structure for missing fields
        return {
          id: game.id || game.game_id || index,
          homeTeam: game.homeTeam || mockGame.homeTeam,
          awayTeam: game.awayTeam || mockGame.awayTeam,
          homeScore: game.homeScore || mockGame.homeScore,
          awayScore: game.awayScore || mockGame.awayScore,
          status: game.status || mockGame.status,
          sport: game.sport || sportUpper,
          date: game.date || mockGame.date,
          time: game.time || mockGame.time,
          venue: game.venue || mockGame.venue,
          weather: game.weather || mockGame.weather,
          odds: game.odds || mockGame.odds,
          broadcast: game.broadcast || mockGame.broadcast,
          attendance: game.attendance || mockGame.attendance,
          quarter: game.quarter || mockGame.quarter
        };
      });
    } else {
      console.log('⚠️ Using mock analytics data');
      return MOCK_DATA[selectedSport as keyof typeof MOCK_DATA]?.games || MOCK_DATA.nfl.games;
    }
  }, [gamesFromApi, selectedSport]);

  // Set initial selected game
  useEffect(() => {
    if (games.length > 0 && !selectedGame) {
      setSelectedGame(games[0]);
    }
  }, [games]);

  // Filter games based on search
  useEffect(() => {
    if (searchInput.trim()) {
      const results = games.filter(game => 
        game.homeTeam.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        game.sport.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredGames(results);
    } else {
      setFilteredGames([]);
    }
  }, [searchInput, games]);

  const handleSearchSubmit = (query: string | null = null) => {
    const searchText = query || searchInput.trim();
    if (searchText) {
      setSearchQuery(searchText);
      const results = games.filter(game => 
        game.homeTeam.name.toLowerCase().includes(searchText.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchText.toLowerCase()) ||
        game.sport.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredGames(results);
    }
  };

  const handleSearch = (query: string) => {
    setSearchInput(query);
    if (!query.trim()) {
      setSearchQuery('');
      setFilteredGames([]);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setSearchQuery('');
    setSearchInput('');
    setFilteredGames([]);
    // Update selected sport based on the selected game
    const sport = game.sport.toLowerCase();
    if (sport === 'nba' || sport === 'nfl' || sport === 'mlb') {
      setSelectedSport(sport);
    }
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId as 'nba' | 'nfl' | 'mlb');
    // Reset selected game when sport changes
    setSelectedGame(null);
  };

  const generateAIAnalysis = async (promptType: string) => {
    setLoadingAI(true);
    setShowAIModal(true);
    
    setTimeout(() => {
      const responses = {
        weather: `**Weather Impact Analysis**\n\n**Game:** ${selectedGame?.homeTeam?.name || 'Home'} vs ${selectedGame?.awayTeam?.name || 'Away'}\n**Weather:** ${selectedGame?.weather || 'Clear'}\n\n**Impact Analysis:**\n• Temperature: 42°F - Optimal for defensive play\n• Wind: 12 mph NW - Slight impact on passing\n• Field: Natural grass - Home team advantage`,
        homeAway: `**Home vs Away Trends**\n\n**Home Team at Home:**\n• Win Rate: 75%\n• Points/Game: 28.4\n• Defensive Rank: 1st`,
        playerMatchup: `**Key Player Matchup**\n\n**Quarterback Comparison:**\n• Home QB: 92.3 rating, 68% completion\n• Away QB: 88.7 rating, 65% completion`,
        recentForm: `**Recent Form Analysis**\n\n**Home Team (Last 5):**\n• Record: 4-1\n• Avg Margin: +7.2 points`,
        injury: `**Injury Impact Assessment**\n\n**Home Team Injuries:**\n• Starting CB (questionable)\n• Overall: Minor impact`,
        predictive: `**Predictive Statistics**\n\n**Win Probability:**\n• Home: 62%\n• Away: 38%\n\n**Expected Score:**\n• Home: 27.3 points\n• Away: 24.1 points`
      };
      
      setAiResponse(responses[promptType as keyof typeof responses] || 'Analysis generated successfully.');
      setLoadingAI(false);
    }, 1500);
  };

  const renderTabContent = () => {
    if (!selectedGame) return null;
    
    switch(activeTab) {
      case 'conditions':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Cloud sx={{ color: '#3b82f6', mr: 1 }} />
                    <Typography variant="h6">Weather Conditions</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedGame.weather}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      Optimal playing conditions expected
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOn sx={{ color: '#10b981', mr: 1 }} />
                    <Typography variant="h6">Venue Details</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedGame.venue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Capacity: {selectedGame.attendance}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Surface: Natural Grass
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      case 'h2h':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Head-to-Head Stats</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">3</Typography>
                  <Typography variant="body2" color="text.secondary">Home Wins</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="text.secondary">VS</Typography>
                  <Typography variant="body2" color="text.secondary">Last 5 meetings</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary">2</Typography>
                  <Typography variant="body2" color="text.secondary">Away Wins</Typography>
                </Box>
              </Box>
              <Alert severity="info">
                Home team has won 4 of the last 5 meetings
              </Alert>
            </CardContent>
          </Card>
        );
      case 'matchup':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Key Matchup Analysis</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedGame.homeTeam?.name || 'Home'} Advantages
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      <li><Typography variant="body2">Pass rush efficiency</Typography></li>
                      <li><Typography variant="body2">Red zone conversion</Typography></li>
                      <li><Typography variant="body2">Turnover differential</Typography></li>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedGame.awayTeam?.name || 'Away'} Advantages
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      <li><Typography variant="body2">Run defense</Typography></li>
                      <li><Typography variant="body2">Time of possession</Typography></li>
                      <li><Typography variant="body2">Third down conversion</Typography></li>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Analytics sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Detailed Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  In-depth {activeTab} analysis is available with premium access
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/subscription')}
                >
                  View Premium Analysis
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'Live':
        return (
          <Chip
            icon={<RadioButtonChecked />}
            label="LIVE"
            size="small"
            sx={{ 
              bgcolor: '#ef4444', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        );
      case 'Final':
        return (
          <Chip
            icon={<CheckCircle />}
            label="FINAL"
            size="small"
            sx={{ 
              bgcolor: '#10b981', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        );
      default:
        return (
          <Chip
            icon={<Schedule />}
            label={status}
            size="small"
            sx={{ 
              bgcolor: '#f59e0b', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        );
    }
  };

  const GameCard = ({ game, isSelected = false, onSelect }: { game: any; isSelected?: boolean; onSelect: (game: any) => void }) => (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
      onClick={() => onSelect(game)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ 
              bgcolor: game.homeTeam?.color || '#3b82f6',
              width: 32,
              height: 32,
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              {game.homeTeam?.logo || 'H'}
            </Avatar>
            <Typography variant="body2" fontWeight="medium">
              {game.homeTeam?.name || 'Home'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">vs</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {game.awayTeam?.name || 'Away'}
            </Typography>
            <Avatar sx={{ 
              bgcolor: game.awayTeam?.color || '#ef4444',
              width: 32,
              height: 32,
              fontSize: 14,
              fontWeight: 'bold'
            }}>
              {game.awayTeam?.logo || 'A'}
            </Avatar>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {game.date}
            </Typography>
          </Box>
          {renderStatusBadge(game.status)}
        </Box>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading game analytics...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, pt: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            Game Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Live scores, stats, and in-depth analysis
          </Typography>
        </Box>
        
        {/* Sport Selector */}
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sport</InputLabel>
          <Select
            value={selectedSport}
            label="Sport"
            onChange={(e) => handleSportChange(e.target.value)}
          >
            <MenuItem value="nfl">NFL</MenuItem>
            <MenuItem value="nba">NBA</MenuItem>
            <MenuItem value="mlb">MLB</MenuItem>
          </Select>
        </FormControl>
        
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={isLoading || isRefetching}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Failed to load game analytics
          </Typography>
          <Typography variant="body2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleRefresh}
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {/* Loading/Refreshing Indicator */}
      {(isLoading || isRefetching) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search games, teams, or leagues..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSearch('')}>
                  <Close />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {searchInput && !searchQuery && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Try searching for:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <Chip
                  key={index}
                  icon={suggestion.icon}
                  label={suggestion.text}
                  onClick={() => handleSearchSubmit(suggestion.text)}
                  sx={{ 
                    bgcolor: `${suggestion.color}10`,
                    borderColor: suggestion.color,
                    color: suggestion.color,
                    '&:hover': {
                      bgcolor: `${suggestion.color}20`
                    }
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {filteredGames.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Found {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
            </Typography>
            {filteredGames.slice(0, 3).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isSelected={selectedGame?.id === game.id}
                onSelect={() => handleSelectGame(game)}
              />
            ))}
          </Box>
        )}
      </Paper>

      {!searchQuery && selectedGame && (
        <>
          {/* Selected Game Header */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      bgcolor: selectedGame.homeTeam?.color || '#3b82f6',
                      width: 80,
                      height: 80,
                      fontSize: 32,
                      fontWeight: 'bold',
                      mb: 2
                    }}>
                      {selectedGame.homeTeam?.logo || 'H'}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedGame.homeTeam?.name || 'Home'}
                    </Typography>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {selectedGame.homeScore}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      {renderStatusBadge(selectedGame.status)}
                      {selectedGame.quarter && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {selectedGame.quarter}
                        </Typography>
                      )}
                    </Box>
                    
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {selectedGame.date} • {selectedGame.time}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        icon={<LocationOn />}
                        label={selectedGame.venue}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<Tv />}
                        label={selectedGame.broadcast}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {selectedGame.sport} • {selectedGame.attendance} attendance
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ 
                      bgcolor: selectedGame.awayTeam?.color || '#ef4444',
                      width: 80,
                      height: 80,
                      fontSize: 32,
                      fontWeight: 'bold',
                      mb: 2
                    }}>
                      {selectedGame.awayTeam?.logo || 'A'}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedGame.awayTeam?.name || 'Away'}
                    </Typography>
                    <Typography variant="h3" color="secondary" fontWeight="bold">
                      {selectedGame.awayScore}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Odds Bar */}
              <Paper sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'background.default',
                display: 'flex',
                justifyContent: 'space-around'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Spread</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedGame.odds?.spread || '-3.5'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <BarChart sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedGame.odds?.total || '48.5'}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Moneyline</Typography>
                  <Typography variant="h6" fontWeight="bold">-150/+130</Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {TABS.map((tab) => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>
            <Box sx={{ p: 3 }}>
              {renderTabContent()}
            </Box>
          </Paper>

          {/* Stats Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart /> Game Statistics
            </Typography>
            <Grid container spacing={2}>
              {STATS_DATA.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {stat.icon}
                        <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                          {stat.label}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" color="primary">
                          {stat.home}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          vs
                        </Typography>
                        <Typography variant="h6" color="secondary">
                          {stat.away}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* AI Analysis Prompts */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb sx={{ color: '#fbbf24' }} /> AI Analysis Prompts
              </Typography>
              <IconButton onClick={() => setShowPrompts(!showPrompts)}>
                <ChevronRight sx={{ 
                  transform: showPrompts ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }} />
              </IconButton>
            </Box>
            
            {showPrompts && (
              <Grid container spacing={2}>
                {PROMPTS.map((prompt) => (
                  <Grid item xs={12} sm={6} md={4} key={prompt.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                          borderLeft: `4px solid ${prompt.color}`
                        },
                        borderLeft: `4px solid ${prompt.color}`
                      }}
                      onClick={() => generateAIAnalysis(prompt.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: prompt.color,
                            width: 40,
                            height: 40,
                            mr: 2
                          }}>
                            {prompt.icon}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold">
                            {prompt.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {prompt.description}
                        </Typography>
                        <Chip
                          label="Free AI Analysis"
                          size="small"
                          sx={{ 
                            bgcolor: `${prompt.color}10`,
                            color: prompt.color,
                            fontSize: '0.75rem'
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* More Games */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoreHoriz /> More Games
            </Typography>
            <Grid container spacing={2}>
              {games
                .filter(game => game.id !== selectedGame?.id)
                .slice(0, 3)
                .map((game) => (
                  <Grid item xs={12} sm={6} md={4} key={game.id}>
                    <GameCard
                      game={game}
                      onSelect={() => handleSelectGame(game)}
                    />
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </>
      )}

      {/* Empty State */}
      {!searchQuery && games.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NewspaperIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No games available for {selectedSport.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try refreshing or selecting a different sport
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<UpdateIcon />}
            onClick={handleRefresh}
            sx={{ mt: 2 }}
          >
            Refresh Games
          </Button>
        </Box>
      )}

      {/* AI Analysis Modal */}
      <Dialog 
        open={showAIModal} 
        onClose={() => setShowAIModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb sx={{ color: '#fbbf24' }} />
          AI Analysis
          {selectedGame && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {selectedGame.homeTeam?.name || 'Home'} vs {selectedGame.awayTeam?.name || 'Away'}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingAI ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Generating AI analysis...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analyzing game data and trends
              </Typography>
            </Box>
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {aiResponse}
                </Typography>
              </Paper>
              
              <Typography variant="h6" gutterBottom>
                Try another analysis:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {PROMPTS
                  .filter(p => p.id !== activeTab)
                  .slice(0, 3)
                  .map((prompt) => (
                    <Chip
                      key={prompt.id}
                      icon={prompt.icon}
                      label={prompt.title}
                      onClick={() => {
                        setShowAIModal(false);
                        setTimeout(() => generateAIAnalysis(prompt.id), 300);
                      }}
                      sx={{ 
                        bgcolor: `${prompt.color}10`,
                        borderColor: prompt.color,
                        color: prompt.color,
                        '&:hover': {
                          bgcolor: `${prompt.color}20`
                        }
                      }}
                      variant="outlined"
                    />
                  ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MatchAnalyticsScreen;
