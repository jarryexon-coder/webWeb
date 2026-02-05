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
  // ADD THESE FOR CONSISTENCY WITH PRIZEPICKS SCREEN
  Snackbar as MuiSnackbar,
  TablePagination,
  Rating,
  Input,
  CardActions,
  CardActionArea
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
  // ADD THESE ICONS
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon2,
  ShowChart as ShowChartIcon,
  FilterList as FilterListIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// Mock data and hooks
import { useSearch } from '../providers/SearchProvider';
import { logEvent, logScreenView } from '../utils/analytics';

// ===== ADD DIAGNOSTIC FUNCTION =====
async function testFantasyAPI() {
  console.log('🔍 Testing Fantasy Hub API endpoints...');
  
  const apiBase = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';
  const urls = [
    `${apiBase}/api/fantasy/teams`,
    `${apiBase}/api/fantasyhub`,
    `${apiBase}/api/fantasy`,
    `${apiBase}/api/fantasy-players`,
    `${apiBase}/api/fantasy/players`,
    '/api/fantasy/teams',
    '/api/fantasyhub',
    '/api/fantasy'
  ];
  
  for (const url of urls) {
    console.log(`Testing: ${url}`);
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ ${url}: HTTP ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`✅ ${url}: Success!`);
      console.log('Response keys:', Object.keys(data));
      console.log('Teams length:', data.teams?.length || data.players?.length || data.data?.length || 'N/A');
      
      if (data.teams && data.teams.length > 0) {
        console.log('Sample team:', data.teams[0]);
      }
      
    } catch (error: any) {
      console.log(`❌ ${url}: ${error.message}`);
    }
    console.log('---');
  }
}

// Check environment
console.log('🌐 FantasyHub Environment check:');
console.log('VITE_API_BASE:', import.meta.env.VITE_API_BASE);
console.log('API_BASE:', import.meta.env.API_BASE);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);

// ===== ADD INTERFACES (Similar to PrizePicksScreen) =====
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
  // ADD PROJECTION FIELDS LIKE PRIZEPICKS
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

// ENHANCED INTERFACE FOR FANTASY TEAM FROM API
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
  // ADD NEW FIELDS FOR PROJECTION ANALYSIS
  projectionRank?: number;
  projectedPoints?: number;
  winProbability?: number;
  strengthOfSchedule?: number;
}

// ADD INTERFACE FOR PROJECTION VALUE RESULT
interface ProjectionValueResult {
  edge: number;
  recommendedSide: 'over' | 'under' | 'none';
  confidence: string;
  marketImplied: number;
  estimatedTrueProb: number;
  projectionDiff: number;
}

const FantasyHubScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  
  // ===== STATE MANAGEMENT (SIMILAR TO PRIZEPICKS SCREEN) =====
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // FANTASY TEAMS STATE
  const [fantasyTeams, setFantasyTeams] = useState<FantasyTeam[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  
  // ADD PROJECTION FILTERING STATE (LIKE PRIZEPICKS)
  const [enableProjectionFiltering, setEnableProjectionFiltering] = useState(false);
  const [projectionDifferenceThreshold, setProjectionDifferenceThreshold] = useState(1.0);
  const [onlyShowProjectionEdges, setOnlyShowProjectionEdges] = useState(true);
  const [sortByProjectionValue, setSortByProjectionValue] = useState(true);
  
  // ADD VALUE FILTERING STATE
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
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]); // LIKE PRIZEPICKS
  
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
  
  // Notifications (SIMILAR TO PRIZEPICKS)
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });
  
  // ADD ACTIVE ENDPOINT STATE (LIKE PRIZEPICKS)
  const [activeEndpoint, setActiveEndpoint] = useState<string>('');
  
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

  // ===== ADD API BASE CONFIG (LIKE PRIZEPICKS) =====
  const API_BASE_URL = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';

  // ===== ADD DIAGNOSTIC CODE ON MOUNT =====
  useEffect(() => {
    console.log('🎯 FantasyHubScreen State Check:');
    console.log('  fantasyTeams loaded:', !!fantasyTeams);
    console.log('  fantasyTeams length:', fantasyTeams?.length || 0);
    console.log('  availablePlayers length:', availablePlayers?.length || 0);
    console.log('  filteredPlayers length:', filteredPlayers?.length || 0);
    console.log('  loading:', loading);
    
    // Run API diagnostic
    testFantasyAPI();
  }, [fantasyTeams, availablePlayers]);

  // ===== ENHANCED FETCH FUNCTION (LIKE PRIZEPICKS) =====
  const fetchFantasyTeams = async () => {
    console.log('🔍 [fetchFantasyTeams] Fetching fantasy teams...');
    setLoading(true);
    setTeamsError(null);
    setRefreshing(true);
    
    try {
      const endpoints = [
        '/api/fantasy/teams',
        '/api/fantasyhub',
        '/api/fantasy',
        '/api/fantasy/players',
        '/api/fantasy-players'
      ];
      
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🎯 Trying endpoint: ${endpoint}`);
          const response = await fetch(`${API_BASE_URL}${endpoint}`);
          
          if (!response.ok) {
            console.log(`❌ ${endpoint}: HTTP ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log(`✅ ${endpoint}: Response received`, {
            success: data.success,
            count: data.count || data.teams?.length || 0,
            keys: Object.keys(data)
          });
          
          if (data.success && (data.teams || data.players || data.data)) {
            // Transform API data
            const transformedTeams = (data.teams || data.players || data.data || []).map((team: any) => ({
              id: team.id || team._id || `team-${Date.now()}`,
              name: team.name || team.teamName || 'Unknown Team',
              owner: team.owner || team.user || 'Unknown Owner',
              sport: team.sport || selectedSport,
              league: team.league || team.leagueName || 'Unknown League',
              record: team.record || `${team.wins || 0}-${team.losses || 0}-${team.ties || 0}`,
              points: team.points || team.totalPoints || 0,
              rank: team.rank || team.position || 1,
              players: team.players || team.roster || [],
              waiverPosition: team.waiverPosition || team.waiver || 1,
              movesThisWeek: team.movesThisWeek || team.transactions || 0,
              lastUpdated: team.lastUpdated || team.updatedAt || new Date().toISOString(),
              // Add projection fields
              projectionRank: team.projectionRank,
              projectedPoints: team.projectedPoints,
              winProbability: team.winProbability,
              strengthOfSchedule: team.strengthOfSchedule
            }));
            
            setFantasyTeams(transformedTeams);
            setActiveEndpoint(endpoint);
            setTeamsError(null);
            
            console.log(`✅ Successfully loaded ${transformedTeams.length} fantasy teams from ${endpoint}`);
            
            setSnackbar({
              open: true,
              message: `Successfully loaded ${transformedTeams.length} fantasy teams`,
              severity: 'success'
            });
            
            success = true;
            break;
          }
        } catch (error) {
          console.log(`❌ ${endpoint} failed:`, error);
        }
      }
      
      if (!success) {
        // Fallback to mock data if all endpoints fail
        console.log('⚠️ All endpoints failed, using mock data');
        const mockTeams: FantasyTeam[] = [
          {
            id: '1',
            name: 'Dynasty Warriors',
            owner: 'Alex Johnson',
            sport: 'NBA',
            league: 'Premium League',
            record: '12-4-0',
            points: 1842,
            rank: 1,
            players: ['Stephen Curry', 'LeBron James', 'Nikola Jokic'],
            waiverPosition: 5,
            movesThisWeek: 3,
            lastUpdated: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Gridiron Gladiators',
            owner: 'Sarah Miller',
            sport: 'NFL',
            league: 'Sunday Funday',
            record: '10-6-0',
            points: 1620,
            rank: 2,
            players: ['Patrick Mahomes', 'Christian McCaffrey', 'Justin Jefferson'],
            waiverPosition: 3,
            movesThisWeek: 2,
            lastUpdated: new Date().toISOString()
          }
        ];
        
        setFantasyTeams(mockTeams);
        setActiveEndpoint('mock');
        
        setSnackbar({
          open: true,
          message: 'Using sample fantasy teams - API endpoints unavailable',
          severity: 'warning'
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching fantasy teams:', error);
      setTeamsError(error.message);
      setFantasyTeams([]);
      
      setSnackbar({
        open: true,
        message: `Failed to load fantasy teams: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===== ADD PROJECTION VALUE CALCULATION (LIKE PRIZEPICKS) =====
  function calculateProjectionValue(player: Player): ProjectionValueResult {
    if (!player.projection || player.projection === 0) {
      return { 
        edge: 0, 
        recommendedSide: 'none', 
        confidence: 'low',
        marketImplied: 0,
        estimatedTrueProb: 0.5,
        projectionDiff: 0 
      };
    }
    
    const projectionDiff = player.projection - player.fantasyScore;
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
    
    // For fantasy, we don't have odds, so use value as proxy
    const marketImplied = 0.5; // Assume 50% baseline
    
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
  }

  // ===== ADD VALUE-BASED FILTERING AND SORTING =====
  const applyValueFiltering = (players: Player[]): Player[] => {
    let filtered = [...players];
    
    // Apply projection filter (if enabled)
    if (enableProjectionFiltering) {
      filtered = filtered.filter(p => {
        if (!p.projection) return false;
        const diff = Math.abs(p.projection - p.fantasyScore);
        return diff >= projectionDifferenceThreshold;
      });
    }
    
    // Apply edge threshold filter
    if (minEdgeThreshold > 0) {
      filtered = filtered.filter(p => {
        const value = calculateProjectionValue(p);
        return value.edge >= minEdgeThreshold;
      });
    }
    
    return filtered;
  };

  const sortByValueScore = (players: Player[]): Player[] => {
    return [...players].sort((a, b) => {
      const valueA = calculateProjectionValue(a);
      const valueB = calculateProjectionValue(b);
      
      // Prioritize players with positive projection edge
      if (valueA.edge > 0 && valueB.edge <= 0) return -1;
      if (valueB.edge > 0 && valueA.edge <= 0) return 1;
      
      if (sortByProjectionValue) {
        // Sort by projection edge (highest to lowest)
        return valueB.edge - valueA.edge;
      } else {
        // Sort by value score (highest to lowest)
        return (b.valueScore || b.value) - (a.valueScore || a.value);
      }
    });
  };

  // ===== ENHANCED INITIALIZE DATA =====
  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Fetch fantasy teams
      await fetchFantasyTeams();
      
      // Mock players with projections (similar to PrizePicks)
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
          threePointers: 4.8,
          // ADD PROJECTION FIELDS
          projection: 58.5,
          projectionEdge: 0.12,
          projectionConfidence: 'high',
          valueScore: 85,
          projectedFantasyScore: 58.5
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
          threePointers: 2.1,
          projection: 52.0,
          projectionEdge: 0.08,
          projectionConfidence: 'medium',
          valueScore: 72,
          projectedFantasyScore: 52.0
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
          threePointers: 1.1,
          projection: 61.5,
          projectionEdge: 0.15,
          projectionConfidence: 'very-high',
          valueScore: 92,
          projectedFantasyScore: 61.5
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
          threePointers: 3.1,
          projection: 49.8,
          projectionEdge: 0.10,
          projectionConfidence: 'high',
          valueScore: 78,
          projectedFantasyScore: 49.8
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
          threePointers: 3.2,
          projection: 42.0,
          projectionEdge: -0.06,
          projectionConfidence: 'low',
          valueScore: 45,
          projectedFantasyScore: 42.0
        }
      ];
      
      setAvailablePlayers(mockPlayers);
      
      // Apply filtering and sorting
      const valueFiltered = applyValueFiltering(mockPlayers);
      const sortedByValue = sortByValueScore(valueFiltered);
      
      setFilteredPlayers(valueFiltered);
      setSortedPlayers(sortedByValue);
      
      calculateTeamStats([]);
      
      console.log('✅ Data initialized:', {
        players: mockPlayers.length,
        filtered: valueFiltered.length,
        sorted: sortedByValue.length
      });
      
    } catch (error) {
      console.error('Error initializing data:', error);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ===== ENHANCED FILTER EFFECT (LIKE PRIZEPICKS) =====
  useEffect(() => {
    console.log('🔄 FantasyHub filter useEffect triggered');
    
    if (!availablePlayers || availablePlayers.length === 0) {
      setFilteredPlayers([]);
      setSortedPlayers([]);
      return;
    }
    
    // Basic filters
    let filtered = availablePlayers.filter(player => {
      if (!player.name) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!player.name.toLowerCase().includes(query) &&
            !player.team.toLowerCase().includes(query) &&
            !player.position.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      if (selectedPosition !== 'ALL' && player.position !== selectedPosition) {
        return false;
      }
      
      if (selectedTeam !== 'all' && player.team !== selectedTeam) {
        return false;
      }
      
      return true;
    });
    
    // Apply value filtering
    const valueFiltered = applyValueFiltering(filtered);
    const sorted = sortByValueScore(valueFiltered);
    
    setFilteredPlayers(valueFiltered);
    setSortedPlayers(sorted);
    
    console.log(`✅ Filtered to ${valueFiltered.length} players, sorted: ${sorted.length}`);
    
  }, [availablePlayers, searchQuery, selectedPosition, selectedTeam, 
      enableProjectionFiltering, projectionDifferenceThreshold, 
      minEdgeThreshold, sortByProjectionValue]);

  // ===== LOAD DATA ON MOUNT =====
  useEffect(() => {
    logScreenView('FantasyHubScreen');
    console.log('🚀 FantasyHubScreen mounted, initializing...');
    
    initializeData();
    
    // Check for initial search params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search');
    if (initialSearch) {
      setSearchInput(initialSearch);
      setSearchQuery(initialSearch);
    }
  }, [location]);

  // ===== ENHANCED CALCULATE TEAM STATS =====
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

  // ===== ENHANCED SEARCH HANDLER =====
  const handleSearchSubmit = async () => {
    const command = searchInput.trim().toLowerCase();
    
    // Check for draft commands
    if (command.startsWith('snake ') || command.startsWith('turn ')) {
      await handleDraftCommand(command);
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
      setFilteredPlayers(availablePlayers);
    }
  };

  // ===== ENHANCED PLAYER MANAGEMENT =====
  const addPlayer = (player: Player) => {
    const playerSalary = activePlatform.name === 'FanDuel' ? player.fanDuelSalary : player.draftKingsSalary;
    
    if (budget - playerSalary >= 0) {
      const newTeam = [...team, { ...player, status: 'active' }];
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
    calculateTeamStats(newTeam);
    
    setSnackbar({ open: true, message: `Removed ${player.name} from your team`, severity: 'success' });
  };

  // ===== ENHANCED REFRESH HANDLER =====
  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSearchInput('');
    
    try {
      await initializeData();
      await fetchFantasyTeams();
      
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

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, mt: 2 }}>Loading Fantasy Hub...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading fantasy teams and player data...
          </Typography>
        </Box>
      </Container>
    );
  }

  // ===== ERROR STATE =====
  if (teamsError) {
    return (
      <Container maxWidth="lg">
        <Alert 
          severity="error" 
          sx={{ mb: 3, mt: 4 }}
          action={
            <Button color="inherit" size="small" onClick={fetchFantasyTeams}>
              RETRY
            </Button>
          }
        >
          <AlertTitle>Error Loading Fantasy Teams</AlertTitle>
          {teamsError}
          <Typography variant="body2" sx={{ mt: 1 }}>
            API Endpoint: {activeEndpoint || 'Not configured'}
          </Typography>
        </Alert>
      </Container>
    );
  }

  // ===== ADD PROJECTION FILTERING CONTROLS (LIKE PRIZEPICKS) =====
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
              onChange={(e) => setEnableProjectionFiltering(e.target.checked)}
              color="primary"
            />
          }
          label="Enable Projection Filtering"
          sx={{ ml: 'auto' }}
        />
      </Box>

      {enableProjectionFiltering && (
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Min Projection Diff</InputLabel>
              <Select
                value={projectionDifferenceThreshold}
                onChange={(e) => setProjectionDifferenceThreshold(parseFloat(e.target.value))}
                label="Min Projection Diff"
              >
                <MenuItem value={0.5}>0.5+ points</MenuItem>
                <MenuItem value={1.0}>1.0+ points (Default)</MenuItem>
                <MenuItem value={1.5}>1.5+ points</MenuItem>
                <MenuItem value={2.0}>2.0+ points</MenuItem>
                <MenuItem value={3.0}>3.0+ points</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={onlyShowProjectionEdges}
                  onChange={(e) => setOnlyShowProjectionEdges(e.target.checked)}
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
                  onChange={(e) => setSortByProjectionValue(e.target.checked)}
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
                onChange={(e) => setMinEdgeThreshold(parseFloat(e.target.value))}
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
      )}
    </Paper>
  );

  // ===== ENHANCED FANTASY TEAMS SECTION =====
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
              {fantasyTeams.length} teams loaded from {activeEndpoint === 'mock' ? 'sample data' : 'API'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Data Source">
              <Chip 
                label={`Source: ${activeEndpoint === 'mock' ? 'Sample Data' : activeEndpoint}`}
                size="small"
                color={activeEndpoint === 'mock' ? 'warning' : 'success'}
              />
            </Tooltip>
            <IconButton onClick={fetchFantasyTeams} disabled={refreshing}>
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
                      color={team.rank <= 3 ? 'success' : 'default'}
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
                          {team.points}
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
                          Projected: {team.projectedPoints} points
                        </Typography>
                        {team.winProbability && (
                          <Chip 
                            label={`${(team.winProbability * 100).toFixed(0)}% win prob`}
                            size="small"
                            color="success"
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
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
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
                      Last updated: {new Date(team.lastUpdated).toLocaleDateString()}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => navigate(`/team/${team.id}`)}
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

  // ===== ENHANCED TOP VALUE PICKS TABLE =====
  const renderTopValuePicks = () => {
    const topPicks = sortedPlayers
      .filter(p => {
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
              </TableRow>
            </TableHead>
            <TableBody>
              {topPicks.map((player, index) => {
                const value = calculateProjectionValue(player);
                return (
                  <TableRow key={player.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {player.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {player.team}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={player.position}
                        size="small"
                        sx={{ 
                          bgcolor: `${getPositionColor(player.position)}20`,
                          color: getPositionColor(player.position),
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {player.fantasyScore.toFixed(1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="bold" 
                          color={player.projection && player.projection > player.fantasyScore ? '#059669' : '#ef4444'}>
                          {player.projection?.toFixed(1)}
                        </Typography>
                        {player.projection && (
                          <Chip 
                            label={`${(player.projection - player.fantasyScore).toFixed(1)}`}
                            size="small"
                            sx={{ 
                              ml: 1,
                              bgcolor: player.projection > player.fantasyScore ? '#bbf7d0' : '#fecaca',
                              color: player.projection > player.fantasyScore ? '#059669' : '#ef4444',
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
                      <Typography variant="body2" color={player.value > 1.3 ? '#10b981' : '#f59e0b'}>
                        {player.value.toFixed(2)}x
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ${player.salary.toLocaleString()}
                      </Typography>
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

  // ===== RENDER FUNCTION (Keep your existing render functions, but update them) =====
  // I'll keep your existing render functions but you need to update them to use sortedPlayers instead of filteredPlayers
  // and add projection analysis displays similar to PrizePicksScreen

  // ... [Rest of your existing render functions with updates] ...

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header (keep your existing) */}
      {renderHeader()}
      
      <Container maxWidth="lg">
        {/* ===== DEBUG INFO (LIKE PRIZEPICKS) ===== */}
        <Box sx={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px', borderRadius: '4px' }}>
          <Typography variant="subtitle2" fontWeight="bold">FantasyHub Debug Info:</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <Typography variant="caption">fantasyTeams loaded: {fantasyTeams ? 'YES' : 'NO'}</Typography>
            <Typography variant="caption">fantasyTeams length: {fantasyTeams?.length || 0}</Typography>
            <Typography variant="caption">sortedPlayers length: {sortedPlayers?.length || 0}</Typography>
            <Typography variant="caption">activeEndpoint: {activeEndpoint || 'N/A'}</Typography>
            <Typography variant="caption">sortByProjectionValue: {sortByProjectionValue ? 'YES' : 'NO'}</Typography>
          </Box>
        </Box>

        {/* Fantasy Teams Section (enhanced) */}
        {renderFantasyTeamsSection()}
        
        {/* Projection Filtering Controls (new) */}
        {renderProjectionFilteringControls()}
        
        {/* Top Value Picks (new) */}
        {renderTopValuePicks()}
        
        {/* Your existing sections - update to use sortedPlayers */}
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
            {activeEndpoint && (
              <Chip 
                label={`Data from: ${activeEndpoint === 'mock' ? 'Sample' : activeEndpoint}`}
                size="small"
                color={activeEndpoint === 'mock' ? 'warning' : 'success'}
                sx={{ ml: 2 }}
              />
            )}
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
