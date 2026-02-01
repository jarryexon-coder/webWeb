// src/pages/NFLAnalyticsScreen.tsx
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
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  LinearProgress,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Stack,
  Badge,
  Alert,
  Divider,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  SportsFootball as FootballIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  BarChart as StatsIcon,
  ChatBubbleOutline as ChatIcon,
  TrendingUp as TrendingIcon,
  NotificationsActive as LiveIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  SportsScore as ScoreIcon,
  Groups as TeamIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  WhereToVote as VenueIcon,
  East as VsIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Mock data and services
import { useSearch } from '../providers/SearchProvider';
import { useSportsData } from '../hooks/useSportsData';
import { logEvent, logScreenView } from '../utils/analytics';
import { playerApi } from '../services/api';
import { samplePlayers } from '../data/players';
import { teams } from '../data/teams';
import { statCategories } from '../data/stats';

interface Game {
  id: string;
  awayTeam: { name: string; abbreviation: string };
  homeTeam: { name: string; abbreviation: string };
  awayScore: number;
  homeScore: number;
  status: 'scheduled' | 'live' | 'final';
  venue: string;
  broadcast: string;
  period?: string;
  timeRemaining?: string;
}

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: {
    yards?: number;
    touchdowns?: number;
    completions?: number;
    attempts?: number;
    receptions?: number;
    rushingYards?: number;
  };
}

interface Standing {
  id: string;
  name: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  conference: string;
  division: string;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  time: string;
}

const NFLAnalyticsScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState('games');
  const [analytics, setAnalytics] = useState({
    totalGames: 0,
    avgPoints: 0,
    passingYards: '265',
    rushingYards: '112',
    playoffRace: '12 teams',
    injuryReports: 8,
  });
  const [depthChartData, setDepthChartData] = useState<any>(null);
  const [fantasyData, setFantasyData] = useState<any[]>([]);
  const [socialComments, setSocialComments] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('Kansas City Chiefs');
  const [liveScores, setLiveScores] = useState<any[]>([]);
  const [statsLeaders, setStatsLeaders] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchResults, setSearchResults] = useState({
    games: [] as Game[],
    standings: [] as Standing[],
    players: [] as Player[],
    news: [] as NewsItem[],
  });
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [realPlayers, setRealPlayers] = useState<Player[]>([]);
  const [useBackend, setUseBackend] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  // Use sports data hook
  const { 
    data: { nfl },
    isLoading: isSportsDataLoading,
    refreshAllData
  } = useSportsData({
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (process.env.REACT_APP_USE_BACKEND === 'true') {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/health`);
          if (response.ok) {
            setUseBackend(true);
          } else {
            setUseBackend(false);
            console.log('Backend not available, using sample data');
          }
        } else {
          setUseBackend(false);
        }
      } catch (error: any) {
        console.log('Backend check failed, using sample data:', error.message);
        setUseBackend(false);
      }
      
      loadData();
      logScreenView('NFLAnalyticsScreen');
    };
    
    initializeData();
  }, []);

  // Extract data from hook
  useEffect(() => {
    if (nfl) {
      const gamesData = nfl?.games || [];
      const standingsData = nfl?.standings || [];
      const newsData = nfl?.news || [];
      const playersData = nfl?.players || [];

      setGames(gamesData);
      setStandings(standingsData);
      setNews(newsData);

      // Calculate analytics
      const avgPoints = gamesData.length > 0 ? 
        parseFloat((gamesData.reduce((sum, game) => {
          const awayScore = game.awayScore || 0;
          const homeScore = game.homeScore || 0;
          return sum + awayScore + homeScore;
        }, 0) / gamesData.length).toFixed(1)) : 0;

      setAnalytics(prev => ({
        ...prev,
        totalGames: gamesData.length,
        avgPoints,
      }));

      loadDepthChartData();
      loadFantasyData();
      loadSocialComments();

      // Create live scores
      const liveScoresData = gamesData
        .filter(game => game.status === 'live')
        .map(game => ({
          id: game.id,
          teams: `${game.awayTeam?.name || 'Away'} vs ${game.homeTeam?.name || 'Home'}`,
          score: `${game.awayScore || 0}-${game.homeScore || 0}`,
          time: game.period || 'Live',
          status: 'LIVE'
        }));
      setLiveScores(liveScoresData);

      // Create stats leaders
      const statsLeadersData = playersData.slice(0, 5).map((player: any, index) => ({
        id: player.id || index.toString(),
        name: player.name,
        stat: player.stats?.yards ? `${player.stats.yards}` : `${player.stats?.touchdowns || 0}`,
        label: player.stats?.yards ? 'Passing Yards' : 'Touchdowns',
        team: player.team,
        rank: index + 1
      }));
      setStatsLeaders(statsLeadersData);
    }
  }, [nfl]);

  const handleSearchSubmit = async () => {
    if (searchInput.trim()) {
      await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      handleNFTSearch(searchInput.trim());
    }
  };

  const handleNFTSearch = useCallback((query: string) => {
    setSearchInput(query);
    setSearchQuery(query);
    
    if (query.trim()) {
      addToSearchHistory(query);
    }
    
    if (!query.trim()) {
      setSearchResults({ games: [], standings: [], players: [], news: [] });
      setFilteredData([]);
      setSelectedItem(null);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const searchKeywords = lowerQuery.split(/\s+/).filter(keyword => keyword.length > 0);
    
    // Implement search logic similar to mobile version
    // ... (search implementation from mobile)
    
    // For now, use simple filter
    const filteredGames = games.filter(game => 
      game.awayTeam.name.toLowerCase().includes(lowerQuery) ||
      game.homeTeam.name.toLowerCase().includes(lowerQuery)
    );
    
    setSearchResults({
      games: filteredGames,
      standings: [],
      players: [],
      news: []
    });
    
    setFilteredData(filteredGames.map(item => ({ ...item, type: 'game' })));
  }, [games, addToSearchHistory]);

  const loadData = async () => {
    try {
      setLoading(true);
      await logEvent('nfl_screen_view', {
        screen_name: 'NFL Screen',
        view_type: selectedView,
        refresh_type: 'manual'
      });
      
      await refreshAllData();
      setLoading(false);
      setRefreshing(false);
      setLastUpdated(new Date());
      
    } catch (error: any) {
      console.log('Error loading NFL data:', error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await logEvent('nfl_screen_refresh', {
      screen_name: 'NFL Screen',
      view_type: selectedView
    });
    
    await loadData();
    setRefreshing(false);
  };

  const handleViewChange = async (view: string) => {
    await logEvent('nfl_view_changed', {
      from_view: selectedView,
      to_view: view,
      screen_name: 'NFL Screen'
    });
    setSelectedView(view);
    setSelectedItem(null);
    setSearchQuery('');
    setSearchInput('');
    setFilteredData([]);
  };

  const handleTeamSelect = async (team: string) => {
    await logEvent('nfl_team_selected', {
      team_name: team,
      screen_name: 'NFL Screen',
      view_type: selectedView
    });
    setSelectedTeam(team);
    setSelectedItem(null);
  };

  const handleFilterChange = async (newFilter: string) => {
    await logEvent('player_stats_filter_change', {
      from_filter: filter,
      to_filter: newFilter,
      sport: 'NFL',
    });
    setFilter(newFilter);
    setSearchQuery('');
    setSearchInput('');
  };

  // Load mock data functions
  const loadDepthChartData = () => {
    const depthChart = {
      team: 'Kansas City Chiefs',
      offense: {
        QB: ['Patrick Mahomes', 'Blaine Gabbert', 'Shane Buechele'],
        RB: ['Isiah Pacheco', 'Clyde Edwards-Helaire', 'Jerick McKinnon'],
        WR: ['Travis Kelce (TE)', 'Rashee Rice', 'Skyy Moore', 'Kadarius Toney', 'Marquez Valdes-Scantling'],
        OL: ['Donovan Smith (LT)', 'Joe Thuney (LG)', 'Creed Humphrey (C)', 'Trey Smith (RG)', 'Jawaan Taylor (RT)'],
      },
      defense: {
        DL: ['Chris Jones', 'George Karlaftis', 'Mike Danna', 'Charles Omenihu'],
        LB: ['Nick Bolton', 'Willie Gay Jr.', 'Leo Chenal', 'Drue Tranquill'],
        DB: ["L'Jarius Sneed", "Trent McDuffie", "Justin Reid", "Bryan Cook", "Mike Edwards"],
      },
      specialTeams: {
        K: 'Harrison Butker',
        P: 'Tommy Townsend',
        KR: 'Richie James',
        PR: 'Kadarius Toney',
        LS: 'James Winchester',
      },
      injuries: ['Creed Humphrey (Questionable)', 'L\'Jarius Sneed (Probable)'],
    };
    setDepthChartData(depthChart);
  };

  const loadFantasyData = () => {
    const fantasyPlayers = [
      {
        id: 1,
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        fantasyPoints: 24.8,
        rank: 1,
        matchup: 'vs LV',
        projected: 25.2,
        status: 'Must Start',
        trend: 'up',
        value: 95,
      },
      {
        id: 2,
        name: 'Christian McCaffrey',
        position: 'RB',
        team: 'SF',
        fantasyPoints: 22.4,
        rank: 1,
        matchup: '@ SEA',
        projected: 21.8,
        status: 'Elite',
        trend: 'stable',
        value: 98,
      },
      {
        id: 3,
        name: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        fantasyPoints: 20.7,
        rank: 1,
        matchup: 'vs NE',
        projected: 19.5,
        status: 'Must Start',
        trend: 'up',
        value: 97,
      },
      {
        id: 4,
        name: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        fantasyPoints: 18.9,
        rank: 1,
        matchup: 'vs LV',
        projected: 17.8,
        status: 'Elite',
        trend: 'stable',
        value: 96,
      },
    ];
    setFantasyData(fantasyPlayers);
  };

  const loadSocialComments = () => {
    const comments = [
      {
        id: 1,
        user: 'NFLFan42',
        text: 'Chiefs defense looking strong this season! Chris Jones is a monster.',
        likes: 24,
        time: '2h ago',
        replies: 3,
        verified: true,
      },
      {
        id: 2,
        user: 'FootballExpert',
        text: 'Mahomes MVP season incoming with these weapons. That connection with Kelce is unstoppable.',
        likes: 18,
        time: '4h ago',
        replies: 2,
        verified: true,
      },
    ];
    setSocialComments(comments);
  };

  // Render functions
  const renderHeader = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #0c4a6e, #0369a1)',
      color: 'white',
      py: 4,
      mb: 4,
      borderRadius: 2,
    }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
              🏈 NFL Gridiron Analytics
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Real-time stats, scores & team analysis
            </Typography>
          </Box>
          <Chip 
            icon={<LiveIcon />} 
            label="LIVE" 
            color="error"
            size="small"
            sx={{ backgroundColor: '#ef4444' }}
          />
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search teams, players, games..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            InputProps={{
              sx: {
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                }
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchInput('')} size="small">
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>×</Typography>
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* View Tabs */}
        <Tabs 
          value={selectedView} 
          onChange={(_, value) => handleViewChange(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              minHeight: 48,
            },
            '& .Mui-selected': {
              color: 'white',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'white',
            },
          }}
        >
          <Tab 
            icon={<FootballIcon />} 
            iconPosition="start" 
            label="Games" 
            value="games" 
          />
          <Tab 
            icon={<TrophyIcon />} 
            iconPosition="start" 
            label="Standings" 
            value="standings" 
          />
          <Tab 
            icon={<PeopleIcon />} 
            iconPosition="start" 
            label="Depth Chart" 
            value="depth" 
          />
          <Tab 
            icon={<StatsIcon />} 
            iconPosition="start" 
            label="Fantasy" 
            value="fantasy" 
          />
          <Tab 
            icon={<ChatIcon />} 
            iconPosition="start" 
            label="Social" 
            value="social" 
          />
          <Tab 
            icon={<TrendingIcon />} 
            iconPosition="start" 
            label="Stats" 
            value="stats" 
          />
        </Tabs>
      </Container>
    </Box>
  );

  const renderAnalytics = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
        League Metrics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <FootballIcon sx={{ color: '#f59e0b', fontSize: 40, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {analytics.totalGames}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Games Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <TrendingIcon sx={{ color: '#3b82f6', fontSize: 40, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {analytics.avgPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Points
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <ScoreIcon sx={{ color: '#10b981', fontSize: 40, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {analytics.passingYards}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pass Yds/G
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ height: '100%', textAlign: 'center' }}>
            <CardContent>
              <WarningIcon sx={{ color: '#ef4444', fontSize: 40, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {analytics.injuryReports}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Injuries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderGames = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'text.primary' }}>
          Today's Games
        </Typography>
        <Button variant="outlined" size="small">
          View All
        </Button>
      </Box>
      
      {liveScores.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#fef2f2' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LiveIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ color: 'error.main' }}>
              Live Scores
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {liveScores.map((score) => (
              <Grid item xs={12} sm={6} md={4} key={score.id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {score.teams}
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      {score.score}
                    </Typography>
                    <Chip label={score.status} color="error" size="small" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {games.map((game) => (
          <Grid item xs={12} md={6} key={game.id}>
            <Card sx={{
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6
              }
            }}>
              <CardContent>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={5} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{game.awayTeam.abbreviation}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Away
                    </Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ textAlign: 'center' }}>
                    <VsIcon />
                  </Grid>
                  <Grid item xs={5} sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{game.homeTeam.abbreviation}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Home
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Typography variant="h3">
                    {game.awayScore} - {game.homeScore}
                  </Typography>
                  <Chip 
                    label={game.status.toUpperCase()} 
                    size="small"
                    color={game.status === 'live' ? 'error' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      <VenueIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      {game.venue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {game.broadcast}
                    </Typography>
                  </Box>
                  <Button variant="contained" size="small">
                    Stats
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderStandings = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
        NFL Standings
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align="right">W</TableCell>
              <TableCell align="right">L</TableCell>
              <TableCell align="right">PCT</TableCell>
              <TableCell align="right">PF</TableCell>
              <TableCell align="right">PA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standings.slice(0, 10).map((team, index) => (
              <TableRow key={team.id} hover>
                <TableCell>
                  <Chip 
                    label={index + 1} 
                    size="small"
                    color={index < 3 ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                      {team.name.charAt(0)}
                    </Avatar>
                    <Typography>{team.name}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {team.division}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color="success.main" fontWeight="bold">
                    {team.wins}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color="error.main" fontWeight="bold">
                    {team.losses}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color="primary.main" fontWeight="bold">
                    {((team.wins / (team.wins + team.losses)) || 0).toFixed(3)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color="success.main" fontWeight="bold">
                    {team.pointsFor}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color="text.secondary">
                    {team.pointsAgainst}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderDepthChart = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
        Depth Chart - {depthChartData?.team}
      </Typography>
      
      {depthChartData && (
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom color="primary">
                  Offense
                </Typography>
                {Object.entries(depthChartData.offense).map(([position, players]) => (
                  <Box key={position} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {position}
                    </Typography>
                    {(players as string[]).map((player, idx) => (
                      <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                        {idx + 1}. {player}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom color="primary">
                  Defense
                </Typography>
                {Object.entries(depthChartData.defense).map(([position, players]) => (
                  <Box key={position} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {position}
                    </Typography>
                    {(players as string[]).map((player, idx) => (
                      <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                        {idx + 1}. {player}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom color="primary">
                  Special Teams
                </Typography>
                {Object.entries(depthChartData.specialTeams).map(([position, player]) => (
                  <Box key={position} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {position}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {player as string}
                    </Typography>
                  </Box>
                ))}
                
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#fef3c7', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    Injury Report
                  </Typography>
                  {depthChartData.injuries.map((injury: string, idx: number) => (
                    <Typography key={idx} variant="body2" sx={{ ml: 1 }}>
                      • {injury}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderFantasyIntegration = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
        Fantasy Leaders
      </Typography>
      
      <Grid container spacing={3}>
        {fantasyData.map((player) => (
          <Grid item xs={12} sm={6} md={4} key={player.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{player.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {player.position} • {player.team}
                    </Typography>
                  </Box>
                  <Chip label={`#${player.rank}`} size="small" color="primary" />
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Points
                    </Typography>
                    <Typography variant="h5">
                      {player.fantasyPoints}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Projected
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {player.projected}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={player.status}
                    size="small"
                    color={player.status.includes('Must') ? 'success' : 'warning'}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {player.matchup}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderSocialFeatures = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
        Community Buzz
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {socialComments.map((comment) => (
            <Card key={comment.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2 }}>
                      {comment.user.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        {comment.user}
                        {comment.verified && (
                          <CheckCircleIcon fontSize="small" color="primary" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {comment.time}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      {comment.likes}
                    </Typography>
                    <Typography color="error">♥</Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" paragraph>
                  {comment.text}
                </Typography>
                
                <Button size="small" startIcon={<ChatIcon />}>
                  {comment.replies} replies
                </Button>
              </CardContent>
            </Card>
          ))}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trending Topics
              </Typography>
              <Stack spacing={1}>
                <Chip label="#NFLPlayoffs" clickable />
                <Chip label="#FantasyFootball" clickable />
                <Chip label="#InjuryReport" clickable />
                <Chip label="#TradeDeadline" clickable />
                <Chip label="#RookieWatch" clickable />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderStatsLeaders = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
        Statistical Leaders
      </Typography>
      
      <Grid container spacing={3}>
        {statsLeaders.map((leader) => (
          <Grid item xs={12} sm={6} md={4} key={leader.id}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Chip 
                  label={`#${leader.rank}`} 
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Typography variant="h5" gutterBottom>
                  {leader.name}
                </Typography>
                <Typography variant="h3" color="primary" gutterBottom>
                  {leader.stat}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {leader.label}
                </Typography>
                <Chip 
                  label={leader.team}
                  size="small"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderSelectedView = () => {
    if (searchQuery.trim() && filteredData.length > 0) {
      return (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
            Search Results ({filteredData.length})
          </Typography>
          <Grid container spacing={3}>
            {filteredData.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {item.type === 'game' ? `${item.awayTeam?.name} @ ${item.homeTeam?.name}` : item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.type?.charAt(0).toUpperCase() + item.type?.slice(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      );
    }

    switch(selectedView) {
      case 'games':
        return renderGames();
      case 'standings':
        return renderStandings();
      case 'depth':
        return renderDepthChart();
      case 'fantasy':
        return renderFantasyIntegration();
      case 'social':
        return renderSocialFeatures();
      case 'stats':
        return renderStatsLeaders();
      default:
        return renderGames();
    }
  };

  const renderRefreshIndicator = () => (
    <Paper sx={{ 
      p: 2, 
      mb: 3, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
      <Button 
        variant="outlined" 
        size="small" 
        startIcon={<RefreshIcon />}
        onClick={onRefresh}
        disabled={refreshing}
      >
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </Button>
    </Paper>
  );

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading NFL Analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {renderHeader()}
      
      <Container maxWidth="lg">
        {backendError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Backend Error: {backendError}. Using sample data.
          </Alert>
        )}
        
        {renderRefreshIndicator()}
        
        {!searchQuery.trim() && renderAnalytics()}
        
        {renderSelectedView()}
        
        {/* Latest News Section */}
        {!searchQuery.trim() && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'text.primary' }}>
              Latest News
            </Typography>
            <Grid container spacing={3}>
              {news.slice(0, 3).map((item) => (
                <Grid item xs={12} md={4} key={item.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {item.description}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="primary">
                          {item.source}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.time}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        {/* Footer Info */}
        <Paper sx={{ 
          p: 3, 
          mt: 4, 
          backgroundColor: 'primary.main', 
          color: 'white',
          textAlign: 'center'
        }}>
          <InfoIcon sx={{ fontSize: 40, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            NFL Data Updates in Real-time
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}>
            All scores, stats, and analytics update automatically. Refresh for the latest information.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default NFLAnalyticsScreen;
