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
  AlertTitle,
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
  AccountBalanceWallet as WalletIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon2,
  ShowChart as ShowChartIcon,
  FilterList as FilterListIcon,
  AttachMoney as AttachMoneyIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Mock data and hooks
import { useSearch } from '../providers/SearchProvider';
import { logEvent, logScreenView } from '../utils/analytics';

// ADD THESE IMPORTS
import { useFantasyPlayers, useFantasyTeams } from '../hooks/useBackendAPI';

// ===== ADD MISSING RENDERHEADER FUNCTION =====
const renderHeader = (navigate: Function) => (
  <Box sx={{ 
    backgroundColor: '#1e293b',
    color: 'white',
    py: 3,
    mb: 4,
    borderBottom: '3px solid #3b82f6'
  }}>
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
            <TrophyIcon sx={{ mr: 2, color: '#fbbf24' }} />
            Fantasy Hub
          </Typography>
          <Typography variant="body1" color="#cbd5e1" sx={{ mt: 1 }}>
            Manage your fantasy teams, analyze projections, and build winning lineups
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            sx={{ color: 'white', borderColor: 'white' }}
            onClick={() => navigate('/')}
            startIcon={<HomeIcon />}
          >
            Home
          </Button>
          <Button 
            variant="contained" 
            sx={{ bgcolor: '#3b82f6' }}
            onClick={() => navigate('/fantasy/create')}
            startIcon={<AddIcon />}
          >
            Create Team
          </Button>
        </Box>
      </Box>
    </Container>
  </Box>
);

// ===== INTERFACES =====
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
  projection?: number;
  projectionEdge?: number;
  projectionConfidence?: string;
  valueScore?: number;
  projectedFantasyScore?: number;
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
  projectionRank?: number;
  projectedPoints?: number;
  winProbability?: number;
  strengthOfSchedule?: number;
}

interface ProjectionValueResult {
  edge: number;
  recommendedSide: 'over' | 'under' | 'none';
  confidence: string;
  marketImplied: number;
  estimatedTrueProb: number;
  projectionDiff: number;
}

// ===== MINIMAL MOCK DATA (FALLBACK ONLY) =====
const MOCK_FANTASY_TEAMS: FantasyTeam[] = [
  {
    id: 'fallback-1',
    name: 'Sample Team',
    owner: 'Demo User',
    sport: 'NBA',
    league: 'Demo League',
    record: '0-0-0',
    points: 0,
    rank: 1,
    players: ['Player 1', 'Player 2', 'Player 3'],
    waiverPosition: 1,
    movesThisWeek: 0,
    lastUpdated: new Date().toISOString(),
  }
];

const MOCK_PLAYERS: Player[] = [
  {
    id: 'fallback-1',
    name: 'Sample Player',
    team: 'DEM',
    position: 'PG',
    fanDuelSalary: 5000,
    draftKingsSalary: 5000,
    salary: 5000,
    fantasyScore: 25.0,
    value: 1.0,
    trend: 'stable',
    points: 15.0,
    rebounds: 5.0,
    assists: 5.0,
    steals: 1.0,
    blocks: 0.5,
    ownership: 10.0,
    projection: 27.5,
  }
];

const FantasyHubScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  
  // ===== STATE MANAGEMENT =====
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // ===== REPLACE FETCH LOGIC WITH HOOKS =====
  const [selectedSport, setSelectedSport] = useState('nba');
  
  // Use React Query hooks instead of manual fetch
  const { 
    data: playersData, 
    isLoading: playersLoading, 
    error: playersError,
    refetch: refetchPlayers 
  } = useFantasyPlayers(selectedSport, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // 30 seconds polling
  });
  
  const { 
    data: teamsData, 
    isLoading: teamsLoading, 
    error: teamsError,
    refetch: refetchTeams 
  } = useFantasyTeams(selectedSport, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
  
  // Extract data from hooks
  const playerData = playersData?.players || [];
  const fantasyTeams = teamsData?.teams || [];
  
  // Set loading state based on both queries
  const loading = playersLoading || teamsLoading;
  
  // FANTASY TEAMS STATE (now managed by hook)
  const [teamsErrorState, setTeamsErrorState] = useState<string | null>(null);
  
  // PLAYER DATA STATE (now managed by hook)
  const [playersErrorState, setPlayersErrorState] = useState<string | null>(null);
  
  // PROJECTION FILTERING STATE
  const [enableProjectionFiltering, setEnableProjectionFiltering] = useState(false);
  const [projectionDifferenceThreshold, setProjectionDifferenceThreshold] = useState(1.0);
  const [onlyShowProjectionEdges, setOnlyShowProjectionEdges] = useState(true);
  const [sortByProjectionValue, setSortByProjectionValue] = useState(true);
  const [minEdgeThreshold, setMinEdgeThreshold] = useState(0);
  
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
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  
  // Filters
  const [selectedSportDisplay, setSelectedSportDisplay] = useState('NBA');
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
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });
  
  // ACTIVE ENDPOINT STATE (optional, can remove if not needed)
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');
  
  // Positions
  const positions = ['ALL', 'PG', 'SG', 'SF', 'PF', 'C'];
  
  // Platforms
  const platforms: Platform[] = [
    { name: 'FanDuel', budget: 60000, color: '#3b82f6' },
    { name: 'DraftKings', budget: 50000, color: '#8b5cf6' }
  ];
  
  // Sports mapping for display
  const sports = [
    { value: 'NBA', label: 'NBA', icon: <BasketballIcon />, apiValue: 'nba' },
    { value: 'NFL', label: 'NFL', icon: <FootballIcon />, apiValue: 'nfl' },
    { value: 'NHL', label: 'NHL', icon: <HockeyIcon />, apiValue: 'nhl' },
    { value: 'MLB', label: 'MLB', icon: <BaseballIcon />, apiValue: 'mlb' }
  ];

  // ===== UPDATED PROJECTION VALUE CALCULATION (Update 2) =====
  const calculateProjectionValue = useCallback((player: Player): ProjectionValueResult => {
    if (!player || typeof player !== 'object') {
      return { 
        edge: 0, 
        recommendedSide: 'none', 
        confidence: 'low',
        marketImplied: 0,
        estimatedTrueProb: 0.5,
        projectionDiff: 0 
      };
    }
    
    const fantasyScore = player.fantasyScore || 0;
    const projection = player.projection || 0;
    
    if (!projection || projection === 0) {
      return { 
        edge: 0, 
        recommendedSide: 'none', 
        confidence: 'low',
        marketImplied: 0,
        estimatedTrueProb: 0.5,
        projectionDiff: 0 
      };
    }
    
    const projectionDiff = projection - fantasyScore;
    const isOverProjection = projectionDiff > 0;
    
    // Convert to probability estimate
    const absDiff = Math.abs(projectionDiff);
    let estimatedTrueProb;
    
    if (absDiff > 15) {
      estimatedTrueProb = isOverProjection ? 0.75 : 0.25;
    } else if (absDiff > 10) {
      estimatedTrueProb = isOverProjection ? 0.65 : 0.35;
    } else if (absDiff > 5) {
      estimatedTrueProb = isOverProjection ? 0.60 : 0.40;
    } else {
      estimatedTrueProb = isOverProjection ? 0.55 : 0.45;
    }
    
    const marketImplied = 0.5;
    const edge = estimatedTrueProb - marketImplied;
    
    let confidence = 'low';
    if (edge > 0.05) confidence = 'very-high';
    else if (edge > 0.03) confidence = 'high';
    else if (edge > 0.01) confidence = 'medium';
    else if (edge > 0) confidence = 'low';
    else confidence = 'no-edge';
    
    return {
      edge,
      recommendedSide: edge > 0.02 ? (isOverProjection ? 'over' : 'under') : 'none',
      confidence,
      marketImplied,
      estimatedTrueProb,
      projectionDiff
    };
  }, []);

  // ===== UPDATED VALUE-BASED FILTERING =====
  const applyValueFiltering = useCallback((players: Player[]): Player[] => {
    console.log('🔍 [applyValueFiltering] Starting with', players.length, 'players');
    
    let filtered = [...players];
    
    // Log player data for debugging
    if (players.length > 0) {
      console.log('Sample player:', players[0]);
      console.log('Player has projection?', players[0].projection !== undefined);
      console.log('Player projection value:', players[0].projection);
      console.log('Player fantasyScore:', players[0].fantasyScore);
    }
    
    // Apply projection filter (if enabled)
    if (enableProjectionFiltering) {
      console.log('🔍 Projection filtering is ENABLED');
      const beforeCount = filtered.length;
      
      filtered = filtered.filter(p => {
        if (!p.projection) {
          console.log(`Player ${p.name} has no projection, filtering out`);
          return false;
        }
        const diff = Math.abs(p.projection - p.fantasyScore);
        const passes = diff >= projectionDifferenceThreshold;
        if (!passes) {
          console.log(`Player ${p.name} fails projection diff: ${diff} < ${projectionDifferenceThreshold}`);
        }
        return passes;
      });
      
      console.log(`🔍 After projection filter: ${beforeCount} -> ${filtered.length} players`);
    } else {
      console.log('🔍 Projection filtering is DISABLED');
    }
    
    // Apply edge threshold filter
    if (minEdgeThreshold > 0) {
      console.log('🔍 Applying edge threshold filter:', minEdgeThreshold);
      const beforeCount = filtered.length;
      
      filtered = filtered.filter(p => {
        const value = calculateProjectionValue(p);
        const passes = value.edge >= minEdgeThreshold;
        if (!passes) {
          console.log(`Player ${p.name} fails edge threshold: ${value.edge} < ${minEdgeThreshold}`);
        }
        return passes;
      });
      
      console.log(`🔍 After edge filter: ${beforeCount} -> ${filtered.length} players`);
    }
    
    // Apply "only show positive edges" filter
    if (onlyShowProjectionEdges) {
      console.log('🔍 Applying positive edges filter');
      const beforeCount = filtered.length;
      
      filtered = filtered.filter(p => {
        const value = calculateProjectionValue(p);
        const passes = value.edge > 0;
        if (!passes) {
          console.log(`Player ${p.name} has no positive edge: ${value.edge}`);
        }
        return passes;
      });
      
      console.log(`🔍 After positive edges filter: ${beforeCount} -> ${filtered.length} players`);
    }
    
    console.log('🔍 [applyValueFiltering] Returning', filtered.length, 'players');
    return filtered;
  }, [enableProjectionFiltering, projectionDifferenceThreshold, minEdgeThreshold, onlyShowProjectionEdges, calculateProjectionValue]);

  const sortByValueScore = useCallback((players: Player[]): Player[] => {
    return [...players].sort((a, b) => {
      const valueA = calculateProjectionValue(a);
      const valueB = calculateProjectionValue(b);
      
      if (sortByProjectionValue) {
        // Sort by projection edge (highest to lowest)
        return valueB.edge - valueA.edge;
      } else {
        // Sort by value score (highest to lowest)
        return (b.valueScore || b.value) - (a.valueScore || a.value);
      }
    });
  }, [calculateProjectionValue, sortByProjectionValue]);

  // ===== UPDATED INITIALIZE DATA =====
  const initializeData = useCallback(async () => {
    try {
      console.log('🔍 Initializing data with React Query hooks...');
      
      // Data is automatically fetched by hooks
      // Just process the data once it's loaded
      
      if (playerData.length > 0) {
        // Apply filtering and sorting
        const valueFiltered = applyValueFiltering(playerData);
        const sortedByValue = sortByValueScore(valueFiltered);
        
        setAvailablePlayers(playerData);
        setFilteredPlayers(valueFiltered);
        setSortedPlayers(sortedByValue);
        
        console.log('✅ Data processed:', {
          players: playerData.length,
          filtered: valueFiltered.length,
          sorted: sortedByValue.length
        });
      }
      
    } catch (error) {
      console.error('Error processing data:', error);
      setSnackbar({ open: true, message: 'Failed to process data', severity: 'error' });
    }
  }, [playerData, applyValueFiltering, sortByValueScore]);

  // ===== UPDATED FILTER EFFECT (Update 1) =====
  useEffect(() => {
    console.log('🔄 FantasyHub filter useEffect triggered');
    console.log('Available players count:', availablePlayers.length);
    
    if (!availablePlayers || availablePlayers.length === 0) {
      console.log('No players available for filtering');
      setFilteredPlayers([]);
      setSortedPlayers([]);
      return;
    }
    
    // Basic filters with safe property access
    let filtered = availablePlayers.filter(player => {
      if (!player || typeof player !== 'object') {
        console.log('Skipping invalid player object:', player);
        return false;
      }
      
      if (!player.name || typeof player.name !== 'string') {
        console.log('Skipping player without valid name:', player);
        return false;
      }
      
      const playerName = player.name || '';
      const playerTeam = player.team || '';
      const playerPosition = player.position || '';
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = playerName.toLowerCase().includes(query);
        const teamMatch = playerTeam.toLowerCase().includes(query);
        const positionMatch = playerPosition.toLowerCase().includes(query);
        
        if (!nameMatch && !teamMatch && !positionMatch) {
          return false;
        }
      }
      
      if (selectedPosition !== 'ALL' && playerPosition !== selectedPosition) {
        return false;
      }
      
      if (selectedTeam !== 'all' && playerTeam !== selectedTeam) {
        return false;
      }
      
      return true;
    });
    
    console.log(`Players after basic filters: ${filtered.length}`);
    
    // Apply value filtering
    const valueFiltered = applyValueFiltering(filtered);
    const sorted = sortByValueScore(valueFiltered);
    
    setFilteredPlayers(valueFiltered);
    setSortedPlayers(sorted);
    
    console.log(`✅ Filtered to ${valueFiltered.length} players, sorted: ${sorted.length}`);
    
  }, [availablePlayers, searchQuery, selectedPosition, selectedTeam, applyValueFiltering, sortByValueScore]);

  // ===== UPDATED LOAD DATA ON MOUNT =====
  useEffect(() => {
    logScreenView('FantasyHubScreen');
    console.log('🚀 FantasyHubScreen mounted, initializing...');
    
    // Initialize data when playerData is available
    if (playerData.length > 0) {
      initializeData();
    }
    
    // Check for initial search params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search');
    if (initialSearch) {
      setSearchInput(initialSearch);
      setSearchQuery(initialSearch);
    }
  }, [playerData, location]);

  // ===== REFRESH HANDLER =====
  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSearchInput('');
    
    try {
      // Refetch both queries
      await Promise.all([
        refetchPlayers(),
        refetchTeams()
      ]);
      
      setSnackbar({ 
        open: true, 
        message: 'Data refreshed successfully', 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to refresh data', 
        severity: 'error' 
      });
    } finally {
      setRefreshing(false);
    }
  };

  // ===== CALCULATE TEAM STATS =====
  const calculateTeamStats = useCallback((teamData: Player[]) => {
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
  }, []);

  // ===== SEARCH HANDLER =====
  const handleSearchSubmit = async () => {
    const command = searchInput.trim().toLowerCase();
    
    // Check for draft commands
    if (command.startsWith('snake ') || command.startsWith('turn ')) {
      const parts = command.split(' ');
      const type = parts[0];
      const position = parseInt(parts[1], 10);
      
      if (!isNaN(position)) {
        if (type === 'snake') {
          fetchSnakeDraft(position);
        } else {
          fetchTurnDraft(position);
        }
      }
      setSearchInput('');
      return;
    }
    
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      setSnackbar({
        open: true,
        message: `Searching for "${searchInput.trim()}"...`,
        severity: 'info'
      });
    } else {
      setSearchQuery('');
    }
  };

  // ===== PLAYER MANAGEMENT =====
  const addPlayer = useCallback((player: Player) => {
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    
    if (budget - playerSalary >= 0 && team.length < 9) {
      const newTeam = [...team, player];
      setTeam(newTeam);
      setBudget(budget - playerSalary);
      setAvailablePlayers(availablePlayers.filter(p => p.id !== player.id));
      calculateTeamStats(newTeam);
      
      setSnackbar({ open: true, message: `Added ${player.name} to your team`, severity: 'success' });
      
      // Log analytics
      logEvent('fantasy_add_player', {
        player_name: player.name,
        position: player.position,
        salary: playerSalary,
        remaining_budget: budget - playerSalary
      });
    } else if (team.length >= 9) {
      setSnackbar({ open: true, message: 'Team is full (max 9 players)', severity: 'error' });
    } else {
      setSnackbar({ open: true, message: `Not enough budget to add ${player.name}`, severity: 'error' });
    }
  }, [activePlatform.name, budget, team, availablePlayers, calculateTeamStats]);

  const removePlayer = useCallback((player: Player) => {
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    
    const newTeam = team.filter(p => p.id !== player.id);
    setTeam(newTeam);
    setBudget(budget + playerSalary);
    setAvailablePlayers([...availablePlayers, player]);
    calculateTeamStats(newTeam);
    
    setSnackbar({ open: true, message: `Removed ${player.name} from your team`, severity: 'success' });
  }, [activePlatform.name, budget, team, availablePlayers, calculateTeamStats]);

  // ===== DRAFT FUNCTIONS =====
  const fetchSnakeDraft = async (position: number) => {
    setIsGeneratingDraft(true);
    try {
      // Mock draft result
      const result: DraftResult = {
        success: true,
        draftPosition: position,
        sport: selectedSportDisplay,
        platform: activePlatform.name,
        results: {
          picks: ['Stephen Curry', 'Nikola Jokic', 'Luka Doncic', 'Jayson Tatum', 'Giannis Antetokounmpo'],
          strategy: 'Stars and Scrubs',
          projectedPoints: 312.5,
          budgetUsed: 45000,
          remainingBudget: 15000
        }
      };
      setDraftResults(result);
      setShowDraftResults(true);
      setSnackbar({ open: true, message: `Snake draft generated for position ${position}`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate draft', severity: 'error' });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const fetchTurnDraft = async (position: number) => {
    setIsGeneratingDraft(true);
    try {
      // Mock draft result
      const result: DraftResult = {
        success: true,
        draftPosition: position,
        sport: selectedSportDisplay,
        platform: activePlatform.name,
        results: {
          picks: ['Jayson Tatum', 'Donovan Mitchell', 'Bam Adebayo', 'Tyrese Haliburton', 'Anthony Davis'],
          strategy: 'Balanced Build',
          projectedPoints: 298.7,
          budgetUsed: 48000,
          remainingBudget: 12000
        }
      };
      setDraftResults(result);
      setShowDraftResults(true);
      setSnackbar({ open: true, message: `Turn draft generated for position ${position}`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate draft', severity: 'error' });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // ===== HELPER FUNCTIONS =====
  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      'PG': '#3b82f6',
      'SG': '#8b5cf6',
      'SF': '#10b981',
      'PF': '#f59e0b',
      'C': '#ef4444'
    };
    return colors[position] || '#64748b';
  };

  // ===== UPDATE SPORT CHANGE HANDLER =====
  const handleSportChange = (sportValue: string) => {
    // Find the sport object
    const sportObj = sports.find(s => s.value === sportValue);
    if (sportObj) {
      setSelectedSportDisplay(sportValue);
      setSelectedSport(sportObj.apiValue); // This will trigger the hooks to refetch
      
      setSnackbar({
        open: true,
        message: `Loading ${sportValue} data...`,
        severity: 'info'
      });
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderPlatformSelector = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select Platform
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {platforms.map((platform) => (
          <Button
            key={platform.name}
            variant={activePlatform.name === platform.name ? 'contained' : 'outlined'}
            sx={{ 
              bgcolor: activePlatform.name === platform.name ? platform.color : 'transparent',
              borderColor: platform.color,
              color: activePlatform.name === platform.name ? 'white' : platform.color,
              '&:hover': {
                bgcolor: `${platform.color}20`
              }
            }}
            onClick={() => {
              setActivePlatform(platform);
              setBudget(platform.budget);
            }}
          >
            {platform.name}
          </Button>
        ))}
      </Box>
    </Paper>
  );

  const renderBudgetDisplay = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Budget & Team
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WalletIcon sx={{ mr: 1, color: '#10b981' }} />
            <Typography variant="h5" color="#10b981" fontWeight="bold">
              ${budget.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              / ${activePlatform.budget.toLocaleString()} remaining
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(budget / activePlatform.budget) * 100} 
            sx={{ mt: 1, height: 8, borderRadius: 4 }}
            color={budget > activePlatform.budget * 0.3 ? "success" : budget > activePlatform.budget * 0.1 ? "warning" : "error"}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Chip 
              label={`${team.length}/9 players`} 
              color={team.length === 9 ? "success" : "default"}
            />
            <Chip 
              label={`${selectedSportDisplay}`} 
              sx={{ 
                bgcolor: selectedSportDisplay === 'NBA' ? '#ef444420' : 
                        selectedSportDisplay === 'NFL' ? '#3b82f620' : 
                        selectedSportDisplay === 'NHL' ? '#0ea5e920' : '#8b5cf620',
                color: selectedSportDisplay === 'NBA' ? '#ef4444' : 
                       selectedSportDisplay === 'NFL' ? '#3b82f6' : 
                       selectedSportDisplay === 'NHL' ? '#0ea5e9' : '#8b5cf6'
              }}
            />
            <Chip 
              label={`${activePlatform.name}`} 
              sx={{ 
                bgcolor: `${activePlatform.color}20`,
                color: activePlatform.color
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderSearchBar = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Search Players
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel>Sport</InputLabel>
          <Select
            value={selectedSportDisplay}
            onChange={(e) => handleSportChange(e.target.value)}
            label="Sport"
          >
            {sports.map((sport) => (
              <MenuItem key={sport.value} value={sport.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {sport.icon}
                  {sport.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel>Position</InputLabel>
          <Select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            label="Position"
          >
            {positions.map((position) => (
              <MenuItem key={position} value={position}>
                {position}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Search players (name, team, position) or use draft commands like 'snake 12' or 'turn 33'"
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
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Button variant="contained" onClick={handleSearchSubmit}>
          Search
        </Button>
      </Box>
    </Paper>
  );

  const renderAIPrompts = () => (
    <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f9ff' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#0369a1' }}>
        🤖 AI Draft Assistant
      </Typography>
      <Grid container spacing={1}>
        {[
          "Best value picks for turn 33",
          "Snake draft strategy for pick 12",
          "Sleepers under $5000",
          "Optimal lineup for $60k budget"
        ].map((prompt, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              sx={{ justifyContent: 'flex-start', textAlign: 'left', height: '100%', py: 1 }}
              onClick={() => {
                setSearchInput(prompt);
                setSearchQuery(prompt);
              }}
            >
              {prompt}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  const renderTeamStatsCard = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Team Statistics
      </Typography>
      <Grid container spacing={2}>
        {[
          { label: 'Avg Fantasy Score', value: teamStats.fantasyScore, icon: <ScoreIcon />, color: '#3b82f6' },
          { label: 'Avg Points', value: teamStats.avgPoints, icon: <BasketballIcon />, color: '#ef4444' },
          { label: 'Avg Rebounds', value: teamStats.avgRebounds, icon: <TrendingUpIcon />, color: '#10b981' },
          { label: 'Avg Assists', value: teamStats.avgAssists, icon: <GroupIcon />, color: '#8b5cf6' },
          { label: 'Total Salary', value: `$${teamStats.totalSalary.toLocaleString()}`, icon: <MoneyIcon />, color: '#f59e0b' },
          { label: 'Efficiency', value: `${teamStats.efficiency}`, icon: <ChartIcon />, color: '#ec4899' },
        ].map((stat, index) => (
          <Grid item xs={6} sm={4} md={2} key={index}>
            <Card sx={{ textAlign: 'center', p: 1, height: '100%' }}>
              <Box sx={{ color: stat.color, mb: 1 }}>
                {stat.icon}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="h6" fontWeight="bold" color={stat.color}>
                {stat.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  const renderYourTeamSection = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Your Team ({team.length}/9 players)
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={() => setShowAddPlayer(true)}
          disabled={team.length >= 9}
        >
          Add Player
        </Button>
      </Box>
      
      {team.length === 0 ? (
        <Alert severity="info">
          No players in your team. Add players from the available players list.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {team.map((player) => (
            <Grid item xs={12} sm={6} md={4} key={player.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="h6">{player.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {player.position} • {player.team}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => removePlayer(player)}
                      color="error"
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Salary</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${(activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Fantasy Score</Typography>
                      <Typography variant="body2" fontWeight="bold" color="#10b981">
                        {player.fantasyScore.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Value</Typography>
                      <Typography variant="body2" fontWeight="bold" color="#f59e0b">
                        {player.value.toFixed(2)}x
                      </Typography>
                    </Box>
                  </Box>
                  
                  {player.projection && (
                    <Box sx={{ 
                      mt: 1, 
                      p: 1, 
                      bgcolor: player.projection > player.fantasyScore ? '#f0fdf4' : '#fef2f2',
                      borderRadius: 1,
                      border: `1px solid ${player.projection > player.fantasyScore ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Projection: {player.projection.toFixed(1)} 
                        <Typography 
                          component="span" 
                          variant="caption" 
                          color={player.projection > player.fantasyScore ? '#059669' : '#ef4444'}
                          sx={{ ml: 1 }}
                        >
                          ({player.projection > player.fantasyScore ? '+' : ''}{(player.projection - player.fantasyScore).toFixed(1)})
                        </Typography>
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );

  // ===== UPDATED RENDER PROJECTION FILTERING CONTROLS =====
  const renderProjectionFilteringControls = () => (
    <Paper sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterIcon sx={{ mr: 1, color: '#3b82f6' }} />
        <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
          Projection-Based Analysis
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={enableProjectionFiltering}
              onChange={(e) => {
                console.log('🔍 Projection filtering changed to:', e.target.checked);
                setEnableProjectionFiltering(e.target.checked);
              }}
              color="primary"
            />
          }
          label="Enable Projection Filtering"
          sx={{ ml: 'auto' }}
        />
      </Box>

      {enableProjectionFiltering && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Projection Filtering Active</AlertTitle>
            Showing players with projections. If no players appear, they may not have projection data.
          </Alert>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Min Projection Diff</InputLabel>
                <Select
                  value={projectionDifferenceThreshold}
                  onChange={(e) => {
                    console.log('Projection diff threshold changed to:', e.target.value);
                    setProjectionDifferenceThreshold(parseFloat(e.target.value));
                  }}
                  label="Min Projection Diff"
                >
                  <MenuItem value={0.1}>0.1+ points</MenuItem>
                  <MenuItem value={0.5}>0.5+ points</MenuItem>
                  <MenuItem value={1.0}>1.0+ points (Default)</MenuItem>
                  <MenuItem value={1.5}>1.5+ points</MenuItem>
                  <MenuItem value={2.0}>2.0+ points</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyShowProjectionEdges}
                    onChange={(e) => {
                      console.log('Only positive edges changed to:', e.target.checked);
                      setOnlyShowProjectionEdges(e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Only Positive Edge"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={sortByProjectionValue}
                    onChange={(e) => {
                      console.log('Sort by projection value changed to:', e.target.checked);
                      setSortByProjectionValue(e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Sort by Projection Value"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Min Edge</InputLabel>
                <Select
                  value={minEdgeThreshold}
                  onChange={(e) => {
                    console.log('Min edge threshold changed to:', e.target.value);
                    setMinEdgeThreshold(parseFloat(e.target.value));
                  }}
                  label="Min Edge"
                >
                  <MenuItem value={0}>Any positive</MenuItem>
                  <MenuItem value={0.01}>1%+</MenuItem>
                  <MenuItem value={0.02}>2%+</MenuItem>
                  <MenuItem value={0.03}>3%+</MenuItem>
                  <MenuItem value={0.05}>5%+</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, p: 1, bgcolor: '#f0f9ff', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current filter settings may exclude players without projection data.
              {playerData.length > 0 && ` ${playerData.filter(p => p.projection && p.projection > 0).length} of ${playerData.length} players have projections.`}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );

  const renderFantasyTeamsSection = () => {
    if (!fantasyTeams || fantasyTeams.length === 0) {
      return (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Your Fantasy Teams
          </Typography>
          <Alert severity="info">
            No fantasy teams available. Check API connection or try refreshing.
          </Alert>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🏆 Your Fantasy Teams
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fantasyTeams.length} teams loaded from React Query hooks
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Data Source">
              <Chip 
                label={`Sport: ${selectedSportDisplay}`}
                size="small"
                color="primary"
              />
            </Tooltip>
            <IconButton onClick={onRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {fantasyTeams.map((team) => (
            <Grid item xs={12} md={6} key={team.id}>
              <Card sx={{ 
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }}>
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
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {team.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team.owner} • {team.league}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Rank #${team.rank}`}
                      color={team.rank <= 3 ? 'success' : team.rank <= 6 ? 'warning' : 'default'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Record
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {team.record}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Points
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {team.points.toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {team.projectedPoints && (
                    <Box sx={{ 
                      p: 1, 
                      mb: 2, 
                      bgcolor: '#f0f9ff', 
                      borderRadius: 1,
                      border: '1px solid #bae6fd'
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold" color="#0369a1">
                          Projected: {team.projectedPoints.toLocaleString()} points
                        </Typography>
                        {team.winProbability && (
                          <Chip 
                            label={`${(team.winProbability * 100).toFixed(0)}% win prob`}
                            size="small"
                            color={team.winProbability > 0.7 ? "success" : team.winProbability > 0.5 ? "warning" : "default"}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                  
                  {team.players && team.players.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Top Players:
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {team.players.slice(0, 5).map((player, index) => (
                          <Chip
                            key={index}
                            label={player}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Updated: {new Date(team.lastUpdated).toLocaleDateString()}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        // Navigate to team detail page or show more info
                        setSnackbar({ 
                          open: true, 
                          message: `Viewing ${team.name} details`, 
                          severity: 'info' 
                        });
                      }}
                    >
                      View Team
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // ===== UPDATED RENDER TOP VALUE PICKS (Update 4) =====
  const renderTopValuePicks = () => {
    if (!sortedPlayers || sortedPlayers.length === 0) return null;
    
    const topPicks = sortedPlayers
      .filter(p => {
        if (!p || typeof p !== 'object') return false;
        const value = calculateProjectionValue(p);
        return value.edge > 0;
      })
      .slice(0, 5);
    
    if (topPicks.length === 0) return null;
    
    return (
      <Paper sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <Typography variant="h6" sx={{ color: '#059669', fontWeight: 'bold', mb: 2 }}>
          🎯 Top Projection Value Picks
        </Typography>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Player</strong></TableCell>
                <TableCell><strong>Position</strong></TableCell>
                <TableCell><strong>Fantasy Score</strong></TableCell>
                <TableCell><strong>Projection</strong></TableCell>
                <TableCell><strong>Projection Edge</strong></TableCell>
                <TableCell><strong>Value</strong></TableCell>
                <TableCell><strong>Salary</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topPicks.map((player, index) => {
                if (!player || typeof player !== 'object') return null;
                
                const value = calculateProjectionValue(player);
                const playerSalary = activePlatform.name === 'FanDuel' ? 
                  (player.fanDuelSalary || 0) : 
                  (player.draftKingsSalary || 0);
                const canAdd = budget >= playerSalary && team.length < 9;
                
                return (
                  <TableRow key={player.id || `player-${index}`} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {player.name || 'Unknown Player'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.team || 'Unknown Team'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={player.position || 'N/A'}
                        size="small"
                        sx={{ 
                          bgcolor: `${getPositionColor(player.position || '')}20`,
                          color: getPositionColor(player.position || ''),
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {(player.fantasyScore || 0).toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold" 
                          color={player.projection && player.projection > (player.fantasyScore || 0) ? '#059669' : '#ef4444'}>
                          {(player.projection || 0).toFixed(1)}
                        </Typography>
                        {player.projection && (
                          <Chip 
                            label={`${((player.projection || 0) - (player.fantasyScore || 0)).toFixed(1)}`}
                            size="small"
                            sx={{ 
                              ml: 1,
                              bgcolor: (player.projection || 0) > (player.fantasyScore || 0) ? '#bbf7d0' : '#fecaca',
                              color: (player.projection || 0) > (player.fantasyScore || 0) ? '#059669' : '#ef4444',
                              fontSize: '0.6rem'
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color={value.edge > 0 ? '#059669' : '#ef4444'}>
                        {value.edge > 0 ? '+' : ''}{(value.edge * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color={(player.value || 0) > 1.3 ? '#10b981' : '#f59e0b'}>
                        {(player.value || 0).toFixed(2)}x
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ${playerSalary.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="contained" 
                        disabled={!canAdd}
                        onClick={() => addPlayer(player)}
                        sx={{ 
                          bgcolor: canAdd ? '#10b981' : '#9ca3af',
                          '&:hover': {
                            bgcolor: canAdd ? '#059669' : '#6b7280'
                          }
                        }}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  // ===== UPDATE DEBUG INFO =====
  const renderDebugInfo = () => (
    <Box sx={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px', borderRadius: '4px' }}>
      <Typography variant="subtitle2" fontWeight="bold">FantasyHub Debug:</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
        <Chip 
          label={teamsError ? '⚠️ Teams Error' : '✅ Teams Loaded'}
          color={teamsError ? 'warning' : 'success'}
        />
        <Chip 
          label={playersError ? '⚠️ Players Error' : '✅ Players Loaded'}
          color={playersError ? 'warning' : 'success'}
        />
        <Typography variant="caption">
          Teams: {fantasyTeams.length} | Players: {playerData.length}
        </Typography>
        <Button 
          variant="outlined" 
          size="small"
          onClick={onRefresh}
          disabled={refreshing}
          startIcon={<RefreshIcon />}
        >
          Refresh All
        </Button>
      </Box>
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" display="block">
          Current Sport: {selectedSport} | Display: {selectedSportDisplay}
        </Typography>
        <Typography variant="caption" display="block">
          Players with projections: {playerData.filter(p => p.projection && p.projection > 0).length} / {playerData.length}
        </Typography>
        <Typography variant="caption" display="block">
          Filtered players: {filteredPlayers.length} | Sorted players: {sortedPlayers.length}
        </Typography>
      </Box>
    </Box>
  );

  const renderAddPlayerModal = () => (
    <Dialog open={showAddPlayer} onClose={() => setShowAddPlayer(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Add Players to Your Team</span>
          <Chip 
            label={`Budget: $${budget.toLocaleString()}`} 
            color="primary" 
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        {sortedPlayers.length === 0 ? (
          <Alert severity="info">No players available</Alert>
        ) : (
          <List>
            {sortedPlayers.map((player) => {
              const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
              const canAdd = budget >= playerSalary && team.length < 9;
              const value = calculateProjectionValue(player);
              
              return (
                <ListItem 
                  key={player.id} 
                  secondaryAction={
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => {
                        addPlayer(player);
                        setShowAddPlayer(false);
                      }}
                      disabled={!canAdd}
                      sx={{ 
                        bgcolor: canAdd ? (value.edge > 0 ? '#10b981' : '#3b82f6') : '#9ca3af',
                        '&:hover': {
                          bgcolor: canAdd ? (value.edge > 0 ? '#059669' : '#2563eb') : '#6b7280'
                        }
                      }}
                    >
                      Add (${playerSalary.toLocaleString()})
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getPositionColor(player.position) }}>
                      {player.position.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {player.name}
                        </Typography>
                        {value.edge > 0 && (
                          <Chip 
                            label={`${(value.edge * 100).toFixed(0)}% edge`}
                            size="small"
                            sx={{ 
                              bgcolor: '#bbf7d0',
                              color: '#059669',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography component="span" variant="body2">
                          {player.position} • {player.team} • Value: {player.value.toFixed(2)}x
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          Fantasy: {player.fantasyScore.toFixed(1)} • Proj: {player.projection?.toFixed(1) || 'N/A'} • Salary: ${playerSalary.toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAddPlayer(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const renderDraftResultsModal = () => (
    <Dialog open={showDraftResults} onClose={() => setShowDraftResults(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Draft Results</DialogTitle>
      <DialogContent>
        {draftResults ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              {draftResults.draftType === 'snake' ? 'Snake' : 'Turn'} Draft - Position {draftResults.draftPosition}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Sport: {draftResults.sport} • Platform: {draftResults.platform}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Recommended Picks:
            </Typography>
            <List>
              {draftResults.results?.picks?.map((pick: string, index: number) => (
                <ListItem key={index} sx={{ py: 1 }}>
                  <ListItemText 
                    primary={`${index + 1}. ${pick}`}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" color="#0369a1">
                Strategy: {draftResults.results?.strategy}
              </Typography>
              <Typography variant="body2" color="#0369a1">
                Projected Points: {draftResults.results?.projectedPoints}
              </Typography>
              <Typography variant="body2" color="#0369a1">
                Budget Used: ${draftResults.results?.budgetUsed?.toLocaleString()} / ${activePlatform.budget.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Alert severity="info">No draft results available</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowDraftResults(false)}>Close</Button>
        <Button variant="contained" onClick={() => {
          setShowDraftResults(false);
          setSnackbar({ open: true, message: 'Draft strategy saved to your profile', severity: 'success' });
        }}>
          Save Strategy
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, mt: 2 }}>Loading Fantasy Hub...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading {selectedSportDisplay} data from API...
          </Typography>
        </Box>
      </Container>
    );
  }

  // ===== ERROR STATES =====
  if (teamsError || playersError) {
    return (
      <Container maxWidth="lg">
        <Alert 
          severity="error" 
          sx={{ mb: 3, mt: 4 }}
          action={
            <Button color="inherit" size="small" onClick={onRefresh}>
              RETRY
            </Button>
          }
        >
          <AlertTitle>API Error</AlertTitle>
          {teamsError && `Teams: ${teamsError.message || teamsError}`}
          {playersError && `Players: ${playersError.message || playersError}`}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      {renderHeader(navigate)}
      
      <Container maxWidth="lg">
        {/* Debug Info */}
        {renderDebugInfo()}

        {/* Fantasy Teams Section */}
        {renderFantasyTeamsSection()}
        
        {/* Show player data status */}
        {playerData.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>No Player Data Loaded</AlertTitle>
            No player data available for {selectedSportDisplay}.
          </Alert>
        )}
        
        {/* Projection Filtering Controls - Only show if we have player data */}
        {playerData.length > 0 && (
          <>
            {renderProjectionFilteringControls()}
            {renderTopValuePicks()}
            {renderPlatformSelector()}
            {renderBudgetDisplay()}
            {renderAIPrompts()}
            {renderSearchBar()}
            {renderTeamStatsCard()}
            {renderYourTeamSection()}
          </>
        )}
        
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
                disabled={isGeneratingDraft}
                startIcon={<RefreshIcon />}
              >
                Snake #12
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fetchTurnDraft(33)}
                disabled={isGeneratingDraft}
                startIcon={<RefreshIcon />}
              >
                Turn #33
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fetchSnakeDraft(1)}
                disabled={isGeneratingDraft}
                startIcon={<RefreshIcon />}
              >
                Snake #1
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => fetchTurnDraft(10)}
                disabled={isGeneratingDraft}
                startIcon={<RefreshIcon />}
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
            <Chip 
              label={`Sport: ${selectedSportDisplay}`}
              size="small"
              color="primary"
              sx={{ ml: 2 }}
            />
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
        disabled={team.length >= 9}
      >
        <AddIcon />
      </Fab>
      
      {/* Modals */}
      {renderAddPlayerModal()}
      {renderDraftResultsModal()}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
