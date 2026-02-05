// src/pages/FantasyHubScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Badge,
  Divider,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  SelectChangeEvent,
  Tooltip,
  Fab,
  Radio,
  RadioGroup,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AlertTitle
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  SportsBasketball as BasketballIcon,
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  ShowChart as ChartIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  Share as ShareIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  School as SchoolIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Leaderboard as LeaderboardIcon,
  Score as ScoreIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Mock data and hooks
import { useSearch } from '../providers/SearchProvider';
import { logEvent, logScreenView } from '../utils/analytics';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  fanDuelSalary: number;
  draftKingsSalary: number;
  salary: number;
  fantasyScore: number;
  value: number;
  trend: 'up' | 'down' | 'stable';
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  ownership: number;
  threePointers?: number;
}

interface TeamStats {
  avgPoints: string;
  avgRebounds: string;
  avgAssists: string;
  totalSalary: number;
  fantasyScore: string;
  efficiency: string;
}

interface Platform {
  name: 'FanDuel' | 'DraftKings';
  budget: number;
  color: string;
}

interface DraftResult {
  success: boolean;
  draftPosition: number;
  sport: string;
  platform: string;
  results: any;
}

// ADD INTERFACE FOR FANTASY TEAM FROM API
interface FantasyTeam {
  id: string;
  name: string;
  owner: string;
  sport: string;
  league: string;
  record: string;
  points: number;
  rank: number;
  players: string[];
  waiverPosition: number;
  movesThisWeek: number;
  lastUpdated: string;
}

const FantasyHubScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  // const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // ADD STATE FOR FANTASY TEAMS FROM API (from File 2)
  const [fantasyTeams, setFantasyTeams] = useState<FantasyTeam[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  
  // Platform and budget
  const [activePlatform, setActivePlatform] = useState<Platform>({
    name: 'FanDuel',
    budget: 60000,
    color: '#3b82f6'
  });
  const [budget, setBudget] = useState(60000);
  
  // Teams and players
  const [team, setTeam] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  
  // Filters
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  
  // Modals
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [showDraftResults, setShowDraftResults] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // Draft
  const [draftResults, setDraftResults] = useState<DraftResult | null>(null);
  const [draftType, setDraftType] = useState<'snake' | 'turn'>('snake');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  
  // Stats
  const [teamStats, setTeamStats] = useState<TeamStats>({
    avgPoints: '0',
    avgRebounds: '0',
    avgAssists: '0',
    totalSalary: 0,
    fantasyScore: '0',
    efficiency: '0'
  });
  
  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Positions
  const positions = ['ALL', 'PG', 'SG', 'SF', 'PF', 'C'];
  
  // Platforms
  const platforms: Platform[] = [
    { name: 'FanDuel', budget: 60000, color: '#3b82f6' },
    { name: 'DraftKings', budget: 50000, color: '#8b5cf6' }
  ];
  
  // Sports
  const sports = [
    { value: 'NBA', label: 'NBA', icon: <BasketballIcon /> },
    { value: 'NFL', label: 'NFL', icon: <FootballIcon /> },
    { value: 'NHL', label: 'NHL', icon: <HockeyIcon /> },
    { value: 'MLB', label: 'MLB', icon: <BaseballIcon /> }
  ];

  // ADD FETCH FUNCTION FOR FANTASY TEAMS (from File 2)
  const fetchFantasyTeams = async () => {
    console.log('🔍 Fetching fantasy teams...');
    setLoading(true);
    setTeamsError(null);
    
    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';
      const response = await fetch(`${apiBase}/api/fantasy/teams`);
      const data = await response.json();
      
      console.log('✅ Fantasy teams response:', data);
      
      if (data.success && data.teams) {
        console.log(`✅ Using REAL fantasy teams: ${data.teams.length} teams`);
        
        // Transform API data (from File 2)
        const transformedTeams = data.teams.map((team: any) => ({
          id: team.id,
          name: team.name,
          owner: team.owner,
          sport: team.sport || 'NBA',
          league: team.league,
          record: team.record,
          points: team.points,
          rank: team.rank,
          players: team.players || [],
          waiverPosition: team.waiverPosition,
          movesThisWeek: team.movesThisWeek,
          lastUpdated: team.lastUpdated || new Date().toISOString()
        }));
        
        setFantasyTeams(transformedTeams);
        
        // Store for debugging (from File 2)
        window._fantasyHubDebug = {
          rawApiResponse: data,
          transformedTeams,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(data.message || 'Failed to load fantasy teams');
      }
    } catch (error: any) {
      console.error('❌ Fantasy teams error:', error);
      setTeamsError(error.message);
      // Fallback to empty array if API fails
      setFantasyTeams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    logScreenView('FantasyHubScreen');
    initializeData();
    
    // ADD FETCH FOR FANTASY TEAMS (from File 2)
    fetchFantasyTeams();
    
    // Check for initial search params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search');
    if (initialSearch) {
      setSearchInput(initialSearch);
      setSearchQuery(initialSearch);
    }
  }, [location]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Mock data
      const mockPlayers: Player[] = [
        {
          id: '1',
          name: 'Stephen Curry',
          team: 'GSW',
          position: 'PG',
          fanDuelSalary: 9500,
          draftKingsSalary: 9200,
          salary: 9500,
          fantasyScore: 52.3,
          value: 1.42,
          trend: 'up',
          points: 28.5,
          rebounds: 4.2,
          assists: 6.7,
          steals: 1.2,
          blocks: 0.2,
          ownership: 35.4,
          threePointers: 4.8
        },
        {
          id: '2',
          name: 'LeBron James',
          team: 'LAL',
          position: 'SF',
          fanDuelSalary: 9800,
          draftKingsSalary: 9500,
          salary: 9800,
          fantasyScore: 48.7,
          value: 1.35,
          trend: 'stable',
          points: 25.8,
          rebounds: 7.8,
          assists: 7.3,
          steals: 1.2,
          blocks: 0.6,
          ownership: 42.1,
          threePointers: 2.1
        },
        {
          id: '3',
          name: 'Nikola Jokic',
          team: 'DEN',
          position: 'C',
          fanDuelSalary: 10500,
          draftKingsSalary: 10200,
          salary: 10500,
          fantasyScore: 56.1,
          value: 1.48,
          trend: 'up',
          points: 26.4,
          rebounds: 12.4,
          assists: 9.0,
          steals: 1.3,
          blocks: 0.9,
          ownership: 28.7,
          threePointers: 1.1
        },
        {
          id: '4',
          name: 'Tyrese Haliburton',
          team: 'IND',
          position: 'PG',
          fanDuelSalary: 8500,
          draftKingsSalary: 8000,
          salary: 8500,
          fantasyScore: 45.2,
          value: 1.32,
          trend: 'up',
          points: 22.8,
          rebounds: 3.9,
          assists: 11.7,
          steals: 1.2,
          blocks: 0.5,
          ownership: 28.9,
          threePointers: 3.1
        },
        {
          id: '5',
          name: 'Jayson Tatum',
          team: 'BOS',
          position: 'SF',
          fanDuelSalary: 9200,
          draftKingsSalary: 8900,
          salary: 9200,
          fantasyScore: 44.8,
          value: 1.25,
          trend: 'down',
          points: 27.2,
          rebounds: 8.1,
          assists: 4.9,
          steals: 1.0,
          blocks: 0.5,
          ownership: 31.5,
          threePointers: 3.2
        }
      ];
      
      setAvailablePlayers(mockPlayers);
      setFilteredPlayers(mockPlayers);
      
      calculateTeamStats([]);
      
    } catch (error) {
      console.error('Error initializing data:', error);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamStats = (teamData: Player[]) => {
    if (!teamData || teamData.length === 0) {
      setTeamStats({
        avgPoints: '0',
        avgRebounds: '0',
        avgAssists: '0',
        totalSalary: 0,
        fantasyScore: '0',
        efficiency: '0'
      });
      return;
    }

    const totals = teamData.reduce((acc, player) => ({
      points: acc.points + player.points,
      rebounds: acc.rebounds + player.rebounds,
      assists: acc.assists + player.assists,
      salary: acc.salary + player.salary,
      fantasyScore: acc.fantasyScore + player.fantasyScore,
    }), { points: 0, rebounds: 0, assists: 0, salary: 0, fantasyScore: 0 });
    
    const avgPoints = totals.points / teamData.length;
    const avgRebounds = totals.rebounds / teamData.length;
    const avgAssists = totals.assists / teamData.length;
    const avgFantasyScore = totals.fantasyScore / teamData.length;
    
    const efficiency = totals.salary > 0 ? (totals.fantasyScore / totals.salary) * 1000 : 0;
    
    setTeamStats({
      avgPoints: avgPoints.toFixed(1),
      avgRebounds: avgRebounds.toFixed(1),
      avgAssists: avgAssists.toFixed(1),
      totalSalary: totals.salary,
      fantasyScore: avgFantasyScore.toFixed(1),
      efficiency: efficiency.toFixed(2)
    });
  };

  const handleSearchSubmit = async () => {
    const command = searchInput.trim().toLowerCase();
    
    // Check for draft commands
    if (command.startsWith('snake ') || command.startsWith('turn ')) {
      await handleDraftCommand(command);
      setSearchInput('');
      return;
    }
    
    if (searchInput.trim()) {
      // await addToSearchHistory(searchInput.trim());
      setSearchQuery(searchInput.trim());
      filterPlayers(searchInput.trim());
    } else {
      setSearchQuery('');
      setFilteredPlayers(availablePlayers);
    }
  };

  const filterPlayers = (query: string) => {
    const searchLower = query.toLowerCase().trim();
    
    const filtered = availablePlayers.filter(player =>
      player.name.toLowerCase().includes(searchLower) ||
      player.team.toLowerCase().includes(searchLower) ||
      player.position.toLowerCase().includes(searchLower)
    );
    
    setFilteredPlayers(filtered);
  };

  const handlePlatformChange = (platform: Platform) => {
    setActivePlatform(platform);
    
    // Recalculate budget based on current team salaries for the new platform
    let newBudget = platform.budget;
    const totalSpent = team.reduce((total, player) => {
      const playerSalary = platform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
      return total + (playerSalary || 0);
    }, 0);
    
    newBudget = platform.budget - totalSpent;
    setBudget(newBudget);
  };

  const addPlayer = (player: Player) => {
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    
    if (budget - playerSalary >= 0) {
      const newTeam = [...team, { ...player, status: 'active' }];
      setTeam(newTeam);
      setBudget(budget - playerSalary);
      setAvailablePlayers(availablePlayers.filter(p => p.id !== player.id));
      setFilteredPlayers(filteredPlayers.filter(p => p.id !== player.id));
      calculateTeamStats(newTeam);
      
      setSnackbar({ open: true, message: `Added ${player.name} to your team`, severity: 'success' });
    } else {
      setSnackbar({ open: true, message: `Not enough budget to add ${player.name}`, severity: 'error' });
    }
  };

  const removePlayer = (player: Player) => {
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    
    const newTeam = team.filter(p => p.id !== player.id);
    setTeam(newTeam);
    setBudget(budget + playerSalary);
    setAvailablePlayers([...availablePlayers, player]);
    setFilteredPlayers([...filteredPlayers, player]);
    calculateTeamStats(newTeam);
    
    setSnackbar({ open: true, message: `Removed ${player.name} from your team`, severity: 'success' });
  };

  const handleDraftCommand = async (command: string) => {
    const parts = command.trim().toLowerCase().split(' ');
    
    if (parts[0] === 'snake' && parts[1]) {
      const position = parseInt(parts[1]);
      if (isNaN(position) || position < 1) {
        setSnackbar({ open: true, message: 'Invalid draft position', severity: 'error' });
        return;
      }
      
      await fetchSnakeDraft(position);
    } else if (parts[0] === 'turn' && parts[1]) {
      const position = parseInt(parts[1]);
      if (isNaN(position) || position < 1) {
        setSnackbar({ open: true, message: 'Invalid draft position', severity: 'error' });
        return;
      }
      
      await fetchTurnDraft(position);
    }
  };

  const fetchSnakeDraft = async (position: number) => {
    setIsGeneratingDraft(true);
    try {
      // Mock draft results
      const mockResults: DraftResult = {
        success: true,
        draftPosition: position,
        sport: selectedSport,
        platform: activePlatform.name,
        results: [
          {
            player: {
              id: '1',
              name: 'Stephen Curry',
              position: 'PG',
              team: 'GSW',
              value: 1.42,
              fantasyScore: 52.3,
              fanDuelSalary: 9500,
              draftKingsSalary: 9200,
            },
            reason: `Excellent value at pick ${position} - Elite shooting and high floor`
          },
          {
            player: {
              id: '2',
              name: 'LeBron James',
              position: 'SF',
              team: 'LAL',
              value: 1.35,
              fantasyScore: 48.7,
              fanDuelSalary: 9800,
              draftKingsSalary: 9500,
            },
            reason: `Consistent production at pick ${position} - All-around contributor`
          },
          {
            player: {
              id: '3',
              name: 'Nikola Jokic',
              position: 'C',
              team: 'DEN',
              value: 1.48,
              fantasyScore: 56.1,
              fanDuelSalary: 10500,
              draftKingsSalary: 10200,
            },
            reason: `Best available at pick ${position} - Triple-double machine`
          }
        ]
      };
      
      setDraftResults(mockResults);
      setDraftType('snake');
      setShowDraftResults(true);
      
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate draft results', severity: 'error' });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const fetchTurnDraft = async (position: number) => {
    setIsGeneratingDraft(true);
    try {
      // Mock turn draft results
      const mockResults: DraftResult = {
        success: true,
        draftPosition: position,
        sport: selectedSport,
        platform: activePlatform.name,
        results: {
          PG: Array.from({ length: 5 }, (_, i) => ({
            player: {
              id: `pg-${i}`,
              name: `PG Player ${i + 1}`,
              position: 'PG',
              team: ['GSW', 'LAL', 'DEN', 'BOS', 'MIL'][i],
              salary: activePlatform.name === 'FanDuel' ? [8500, 7200, 6500, 5800, 5000][i] : [8000, 6800, 6200, 5500, 4800][i],
              value: [1.4, 1.3, 1.25, 1.2, 1.15][i],
              fantasyScore: [45, 38, 35, 32, 28][i],
              injuryStatus: i === 2 ? 'GTD' : 'ACTIVE',
              opponent: ['SAS', 'DET', 'HOU', 'CHA', 'ORL'][i]
            },
            selectionScore: [85.5, 78.2, 72.4, 68.1, 62.3][i],
            reasons: i === 0 ? 
              ['Excellent value', 'Favorable matchup', 'No injury concerns'] :
              ['Good value', 'Solid matchup', 'Safe pick']
          }))
        }
      };
      
      setDraftResults(mockResults);
      setDraftType('turn');
      setShowDraftResults(true);
      
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate draft results', severity: 'error' });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSearchInput('');
    try {
      await initializeData();
      // ADD REFRESH FOR FANTASY TEAMS (from File 2)
      await fetchFantasyTeams();
      setSnackbar({ open: true, message: 'Data refreshed successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to refresh data', severity: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  // ADD LOADING STATE (from File 2 pattern)
  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading fantasy teams...</Typography>
        </Box>
      </Container>
    );
  }

  // ADD ERROR STATE (from File 2 pattern)
  if (teamsError) {
    return (
      <Container>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={fetchFantasyTeams}>
              RETRY
            </Button>
          }
        >
          <AlertTitle>Error Loading Fantasy Teams</AlertTitle>
          {teamsError}
        </Alert>
      </Container>
    );
  }

  // ADD RENDER FUNCTION FOR FANTASY TEAMS SECTION (from File 2)
  const renderFantasyTeamsSection = () => (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Your Fantasy Teams
        </Typography>
        <IconButton onClick={fetchFantasyTeams} disabled={refreshing}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {fantasyTeams.length === 0 ? (
        <Typography color="text.secondary" align="center" py={4}>
          No fantasy teams available
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {fantasyTeams.map((team) => (
            <Grid item xs={12} md={6} key={team.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: team.sport === 'NBA' ? '#ef4444' : 
                               team.sport === 'NFL' ? '#3b82f6' : 
                               team.sport === 'NHL' ? '#0ea5e9' : '#8b5cf6', 
                      mr: 2 
                    }}>
                      {team.sport === 'NBA' && <BasketballIcon />}
                      {team.sport === 'NFL' && <FootballIcon />}
                      {team.sport === 'NHL' && <HockeyIcon />}
                      {team.sport === 'MLB' && <BaseballIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{team.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team.owner} • {team.league}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip label={`Rank #${team.rank}`} color="primary" />
                    <Chip label={`${team.points} pts`} variant="outlined" />
                  </Box>
                  
                  <Typography variant="body2" gutterBottom>
                    Record: {team.record}
                  </Typography>
                  
                  {team.players && team.players.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Top Players: {team.players.slice(0, 3).join(', ')}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {new Date(team.lastUpdated).toLocaleDateString()}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => navigate(`/team/${team.id}`)}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );

  const renderHeader = () => (
    <Box sx={{
      background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
      color: 'white',
      py: { xs: 4, md: 5 },
      mb: 4,
      borderRadius: { xs: 0, sm: 2 },
    }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            component={Link} 
            to="/" 
            sx={{ color: 'white', mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              🏀 Fantasy Team PRO
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Build & manage your dream team • AI-powered analytics
            </Typography>
          </Box>
          <Fab
            color="primary"
            onClick={onRefresh}
            disabled={refreshing}
            size="small"
          >
            {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </Fab>
        </Box>
      </Container>
    </Box>
  );

  const renderPlatformSelector = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select Platform:
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {platforms.map((platform) => (
          <Card
            key={platform.name}
            sx={{
              flex: 1,
              cursor: 'pointer',
              border: activePlatform.name === platform.name ? `2px solid ${platform.color}` : '2px solid transparent',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              }
            }}
            onClick={() => handlePlatformChange(platform)}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                bgcolor: activePlatform.name === platform.name ? platform.color : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                border: `2px solid ${platform.color}`
              }}>
                <WalletIcon sx={{ 
                  color: activePlatform.name === platform.name ? 'white' : platform.color,
                  fontSize: 24 
                }} />
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {platform.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Budget: ${platform.budget.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Paper>
  );

  const renderBudgetDisplay = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WalletIcon sx={{ color: '#10b981', mr: 1, fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Salary Cap Budget
            </Typography>
            <Typography variant="h4" color="primary" fontWeight="bold">
              ${budget.toLocaleString()} remaining
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Spent: ${(activePlatform.budget - budget).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: ${activePlatform.budget.toLocaleString()}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={((activePlatform.budget - budget) / activePlatform.budget) * 100}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Remaining
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ${budget.toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Spent
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                ${(activePlatform.budget - budget).toLocaleString()}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Platform
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {activePlatform.name}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderTeamStatsCard = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LeaderboardIcon sx={{ color: '#3b82f6', mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            Team Performance Metrics
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0f9ff' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {teamStats.avgPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Points
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f0fdf4' }}>
              <Typography variant="h4" color="#10b981" fontWeight="bold">
                {teamStats.avgRebounds}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Rebounds
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef3c7' }}>
              <Typography variant="h4" color="#f59e0b" fontWeight="bold">
                {teamStats.avgAssists}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Assists
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fef2f2' }}>
              <Typography variant="h4" color="#ef4444" fontWeight="bold">
                {teamStats.fantasyScore}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fantasy Score
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" fontWeight="medium">
              Team Efficiency: {teamStats.efficiency} FPTS/$1K
            </Typography>
            <Chip 
              label={parseFloat(teamStats.efficiency) > 1 ? 'Excellent' : parseFloat(teamStats.efficiency) > 0.8 ? 'Good' : 'Poor'}
              size="small"
              color={parseFloat(teamStats.efficiency) > 1 ? 'success' : parseFloat(teamStats.efficiency) > 0.8 ? 'warning' : 'error'}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(parseFloat(teamStats.efficiency) * 50, 100)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  const renderPlayerCard = (player: Player, isTeamMember: boolean) => {
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    const canAdd = budget >= playerSalary;
    
    const TrendIcon = player.trend === 'up' ? TrendingUpIcon : 
                     player.trend === 'down' ? TrendingDownIcon : TrendingFlatIcon;
    const trendColor = player.trend === 'up' ? '#10b981' : 
                      player.trend === 'down' ? '#ef4444' : '#6b7280';
    
    return (
      <Card key={player.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {player.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {player.position} • {player.team}
              </Typography>
            </Box>
            <Chip 
              label={`$${playerSalary.toLocaleString()}`}
              size="small"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  PTS
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {player.points}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  REB
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {player.rebounds}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  AST
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {player.assists}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  FPTS
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="#8b5cf6">
                  {player.fantasyScore}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendIcon sx={{ color: trendColor, mr: 0.5 }} />
              <Typography variant="body2" sx={{ color: trendColor, fontWeight: 'bold' }}>
                Value: {player.value.toFixed(2)}x
              </Typography>
            </Box>
            <Chip 
              label={`${player.ownership}% owned`}
              size="small"
              variant="outlined"
            />
          </Box>
          
          {isTeamMember ? (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<RemoveIcon />}
              onClick={() => removePlayer(player)}
            >
              Remove from Team
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<AddIcon />}
              onClick={() => canAdd ? addPlayer(player) : null}
              disabled={!canAdd}
            >
              {canAdd ? 'Add to Team' : 'Insufficient Budget'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSearchBar = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        🔍 Search Players
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Search players or enter draft command (Snake 33, Turn 33)..."
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
                <IconButton onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearchSubmit}
          sx={{ minWidth: 120 }}
        >
          Search
        </Button>
      </Box>
      {searchQuery && (
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredPlayers.length} of {availablePlayers.length} players match "{searchQuery}"
          </Typography>
          <Button size="small" onClick={() => { setSearchQuery(''); setSearchInput(''); }}>
            Clear
          </Button>
        </Box>
      )}
    </Paper>
  );

  const renderAIPrompts = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <LightbulbIcon sx={{ mr: 1 }} /> AI Assistant Prompts
      </Typography>
      
      <Grid container spacing={1}>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setSnackbar({ open: true, message: 'Showing best value picks...', severity: 'success' })}
            sx={{ justifyContent: 'flex-start' }}
          >
            🎯 Best Value Picks
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setSnackbar({ open: true, message: 'Analyzing matchups...', severity: 'success' })}
            sx={{ justifyContent: 'flex-start' }}
          >
            📊 Favorable Matchups
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => fetchSnakeDraft(12)}
            sx={{ justifyContent: 'flex-start' }}
          >
            🐍 Snake Draft #12
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => fetchTurnDraft(33)}
            sx={{ justifyContent: 'flex-start' }}
          >
            🔄 Turn Draft #33
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderYourTeamSection = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          📋 Your Team ({team.length}/8 Players)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddPlayer(true)}
        >
          Add Player
        </Button>
      </Box>
      
      {team.length > 0 ? (
        team.map(player => renderPlayerCard(player, true))
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your team is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Add players from the available pool to build your fantasy team
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddPlayer(true)}
          >
            Add First Player
          </Button>
        </Box>
      )}
    </Paper>
  );

  const renderAddPlayerModal = () => (
    <Dialog
      open={showAddPlayer}
      onClose={() => setShowAddPlayer(false)}
      maxWidth="lg"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Add Players to Team
          </Typography>
          <IconButton onClick={() => setShowAddPlayer(false)}>
            <ClearIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search available players..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by Position:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {positions.map((position) => (
              <Chip
                key={position}
                label={position}
                onClick={() => setSelectedPosition(position)}
                color={selectedPosition === position ? 'primary' : 'default'}
                variant={selectedPosition === position ? 'filled' : 'outlined'}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by Sport:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {sports.map((sport) => (
              <Chip
                key={sport.value}
                label={sport.label}
                icon={sport.icon}
                onClick={() => setSelectedSport(sport.value)}
                color={selectedSport === sport.value ? 'primary' : 'default'}
                variant={selectedSport === sport.value ? 'filled' : 'outlined'}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Available Players ({filteredPlayers.length})
        </Typography>
        
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map(player => renderPlayerCard(player, false))
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No players found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setShowAddPlayer(false)}>
          Close
        </Button>
        <Button 
          variant="contained" 
          onClick={() => {
            // Add some logic for auto-pick
            const bestValuePlayer = filteredPlayers.sort((a, b) => b.value - a.value)[0];
            if (bestValuePlayer) {
              addPlayer(bestValuePlayer);
            }
          }}
        >
          Auto Pick Best Value
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDraftResultsModal = () => (
    <Dialog
      open={showDraftResults}
      onClose={() => setShowDraftResults(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {draftType === 'snake' ? '🐍 Snake Draft Results' : '🔄 Turn Draft Results'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pick #{draftResults?.draftPosition} • {draftResults?.sport} • {draftResults?.platform}
            </Typography>
          </Box>
          <IconButton onClick={() => setShowDraftResults(false)}>
            <ClearIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {isGeneratingDraft ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>
              Generating {draftType === 'snake' ? 'Snake' : 'Turn'} Draft Results...
            </Typography>
          </Box>
        ) : draftType === 'snake' ? (
          <Box>
            <Typography variant="h6" gutterBottom align="center">
              Top 3 Available Players at Pick #{draftResults?.draftPosition}
            </Typography>
            {draftResults?.results.map((item: any, index: number) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {index + 1}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">
                        {item.player.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.player.position} • {item.player.team}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Value: ${item.player.value.toFixed(2)}x`}
                      color="success"
                      size="small"
                    />
                  </Box>
                  
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        FanDuel
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        ${item.player.fanDuelSalary.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        DraftKings
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        ${item.player.draftKingsSalary.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Why this pick?
                    </Typography>
                    <Typography variant="body2">
                      {item.reason}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom align="center">
              Top Players by Position at Pick #{draftResults?.draftPosition}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" paragraph>
              Ranked by: Cost → Injuries → Opponents → Advanced Stats → Trends → Statistics
            </Typography>
            
            {draftResults?.results && Object.entries(draftResults.results).map(([position, players]: [string, any]) => (
              <Accordion key={position}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {position} ({players.length} options)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {players.map((item: any, index: number) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e5e7eb', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            #{index + 1}. {item.player.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.player.team} vs {item.player.opponent}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body1" fontWeight="bold">
                            ${item.player.salary.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="success.main">
                            Score: {item.selectionScore}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {item.reasons?.map((reason: string, reasonIndex: number) => (
                          <Chip
                            key={reasonIndex}
                            label={reason}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        
        {!isGeneratingDraft && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: '#fefce8' }}>
            <Typography variant="subtitle2" color="#92400e" gutterBottom>
              💡 Draft Tips:
            </Typography>
            <Typography variant="body2" color="#92400e">
              • {draftType === 'snake' 
                ? 'Consider positional scarcity when making your pick'
                : 'Compare options across positions for maximum value'
              }
            </Typography>
            <Typography variant="body2" color="#92400e">
              • Check latest injury updates before finalizing
            </Typography>
            <Typography variant="body2" color="#92400e">
              • Consider stacking with teammates for correlation
            </Typography>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button startIcon={<SaveIcon />}>
          Save Results
        </Button>
        <Button startIcon={<ShareIcon />} variant="contained">
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {renderHeader()}
      
      <Container maxWidth="lg">
        {/* ADD FANTASY TEAMS SECTION AT THE TOP */}
        {renderFantasyTeamsSection()}
        
        {renderPlatformSelector()}
        {renderBudgetDisplay()}
        {renderAIPrompts()}
        {renderSearchBar()}
        {renderTeamStatsCard()}
        {renderYourTeamSection()}
        
        {/* Quick Draft Actions */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⚡ Quick Draft Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fetchSnakeDraft(12)}
              >
                Snake #12
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fetchTurnDraft(33)}
              >
                Turn #33
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fetchSnakeDraft(1)}
              >
                Snake #1
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fetchTurnDraft(10)}
              >
                Turn #10
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
          <Typography variant="body2">
            Salaries based on FanDuel & DraftKings pricing • {activePlatform.name} budget: ${activePlatform.budget.toLocaleString()}
          </Typography>
          <Typography variant="caption">
            Data updates manually • Last refreshed: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Typography>
        </Box>
      </Container>
      
      {/* FAB for quick actions */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowAddPlayer(true)}
      >
        <AddIcon />
      </Fab>
      
      {renderAddPlayerModal()}
      {renderDraftResultsModal()}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FantasyHubScreen;
