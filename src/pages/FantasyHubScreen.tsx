// src/pages/FantasyHubScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
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
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { logScreenView } from '../utils/analytics';

// ===== IMPORT UNIFIED HOOKS =====
import { useAPI } from '../hooks/useUnifiedAPI';

// ===== FIX: Define __DEV__ for web environment =====
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__DEV__ = process.env.NODE_ENV === 'development';
}

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

// ===== CREATE MOCK PLAYERS FOR FALLBACK =====
const createMockPlayers = (count: number = 50): Player[] => {
  const teams = ['LAL', 'GSW', 'BOS', 'MIA', 'PHI', 'MIL', 'DEN', 'PHX', 'DAL', 'LAC'];
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
  const firstNames = ['LeBron', 'Stephen', 'Kevin', 'Giannis', 'Luka', 'Jayson', 'Joel', 'Nikola', 'Ja', 'Damian'];
  const lastNames = ['James', 'Curry', 'Durant', 'Antetokounmpo', 'Doncic', 'Tatum', 'Embiid', 'Jokic', 'Morant', 'Lillard'];
  
  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const team = teams[i % teams.length];
    const position = positions[i % positions.length];
    const fantasyScore = Math.random() * 40 + 15;
    const projection = fantasyScore * (1 + (Math.random() * 0.2 - 0.1));
    const salary = Math.floor(Math.random() * 8000) + 3000;
    
    return {
      id: `mock-player-${i}`,
      name: `${firstName} ${lastName}`,
      team: team,
      position: position,
      fanDuelSalary: salary,
      draftKingsSalary: salary - 500,
      salary: salary,
      fantasyScore: fantasyScore,
      fantasy_points: fantasyScore,
      projected_points: projection,
      projection: projection,
      value: fantasyScore / (salary / 1000),
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.4 ? 'down' : 'stable',
      points: Math.floor(Math.random() * 30) + 10,
      rebounds: Math.floor(Math.random() * 15) + 3,
      assists: Math.floor(Math.random() * 10) + 3,
      steals: parseFloat((Math.random() * 2).toFixed(1)),
      blocks: parseFloat((Math.random() * 2).toFixed(1)),
      ownership: Math.random() * 100,
      threePointers: Math.floor(Math.random() * 6),
      valueScore: Math.random() * 2 + 0.5,
      projectedFantasyScore: projection,
      sport: 'NBA'
    };
  });
};

// ===== CREATE MOCK TEAMS FOR FALLBACK =====
const createMockTeams = (count: number = 5): FantasyTeam[] => {
  const teams = ['Lakers Legends', 'Warriors Dynasty', 'Celtics Pride', 'Heat Culture', '76ers Process'];
  const owners = ['John', 'Mike', 'Sarah', 'David', 'Emma'];
  const leagues = ['Premium League', 'Expert League', 'Pro League', 'Champions League', 'Elite League'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-team-${i}`,
    name: teams[i],
    owner: owners[i],
    sport: 'NBA',
    league: leagues[i],
    record: `${Math.floor(Math.random() * 50) + 30}-${Math.floor(Math.random() * 30) + 10}`,
    points: Math.floor(Math.random() * 5000) + 3000,
    rank: i + 1,
    players: ['LeBron James', 'Stephen Curry', 'Kevin Durant', 'Giannis Antetokounmpo', 'Luka Doncic'].slice(0, 3),
    waiverPosition: Math.floor(Math.random() * 10) + 1,
    movesThisWeek: Math.floor(Math.random() * 5),
    lastUpdated: new Date().toISOString(),
    projectedPoints: Math.floor(Math.random() * 5000) + 3000,
    winProbability: Math.random() * 0.5 + 0.3,
    strengthOfSchedule: Math.random() * 0.3 + 0.5
  }));
};

// ===== API DATA TRANSFORMER =====
const transformAPIPlayerData = (player: any): Player => {
  if (!player) {
    return {
      id: `player-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Unknown Player',
      team: 'Unknown Team',
      position: 'N/A',
      fanDuelSalary: 0,
      draftKingsSalary: 0,
      salary: 0,
      fantasyScore: 0,
      fantasy_points: 0,
      projected_points: 0,
      value: 0,
      trend: 'stable',
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      ownership: 0,
      threePointers: 0,
      projection: 0,
      valueScore: 0,
      projectedFantasyScore: 0
    };
  }
  
  const fantasyScore = player.fantasyScore || player.fantasy_points || 
                       player.avg_fantasy_points || player.fppg || 
                       player.points || Math.random() * 30 + 10;
  
  const baseProjection = player.projection || player.projected_points || 
                        player.proj_fantasy_points || player.projected_fantasy;
  
  let projection;
  if (baseProjection && baseProjection > 0) {
    projection = baseProjection;
  } else if (fantasyScore > 0) {
    const variation = (Math.random() * 0.25) - 0.1;
    projection = fantasyScore * (1 + variation);
  } else {
    projection = Math.random() * 30 + 10;
  }
  
  const playerName = player.name || player.player_name || 'Unknown Player';
  const playerTeam = player.team || player.team_name || 'Unknown Team';
  const playerPosition = player.position || player.pos || 'N/A';
  
  return {
    id: player.id || player._id || `player-${Math.random().toString(36).substr(2, 9)}`,
    name: playerName,
    team: playerTeam,
    position: playerPosition,
    fanDuelSalary: player.fanDuelSalary || player.fanduel_salary || player.salary || Math.floor(Math.random() * 5000) + 3000,
    draftKingsSalary: player.draftKingsSalary || player.draftkings_salary || player.salary || Math.floor(Math.random() * 5000) + 3000,
    salary: player.salary || player.fanduel_salary || player.draftkings_salary || Math.floor(Math.random() * 5000) + 3000,
    fantasyScore: fantasyScore,
    fantasy_points: fantasyScore,
    projected_points: projection,
    projection: projection,
    value: player.value || player.value_score || 
           (player.salary && fantasyScore ? fantasyScore / (player.salary / 1000) : 0),
    points: player.points || player.stats?.points || Math.floor(Math.random() * 30) + 5,
    rebounds: player.rebounds || player.stats?.rebounds || Math.floor(Math.random() * 15) + 2,
    assists: player.assists || player.stats?.assists || Math.floor(Math.random() * 10) + 2,
    steals: player.steals || player.stats?.steals || parseFloat((Math.random() * 2).toFixed(1)),
    blocks: player.blocks || player.stats?.blocks || parseFloat((Math.random() * 2).toFixed(1)),
    sport: player.sport || 'NBA',
    ownership: player.ownership || player.ownership_percentage || 0,
    projections: player.projections || {
      fantasy_points: projection,
      points: player.projected_stats?.points || Math.floor(Math.random() * 30) + 5,
      rebounds: player.projected_stats?.rebounds || Math.floor(Math.random() * 15) + 2,
      assists: player.projected_stats?.assists || Math.floor(Math.random() * 10) + 2,
      value: player.projected_value || 0,
      confidence: player.projection_confidence || 0.5 + (Math.random() * 0.5)
    },
    trend: player.trend || (Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable'),
    threePointers: player.threePointers || player.stats?.three_pointers_made || Math.floor(Math.random() * 5),
    valueScore: player.valueScore || player.value || 0,
    projectedFantasyScore: player.projectedFantasyScore || projection
  };
};

// ===== INTERFACE DEFINITIONS =====
interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  fanDuelSalary?: number;
  draftKingsSalary?: number;
  salary?: number;
  fantasyScore?: number;
  fantasy_points?: number;
  projected_points?: number;
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  ownership?: number;
  threePointers?: number;
  projection?: number;
  projectionEdge?: number;
  projectionConfidence?: string;
  valueScore?: number;
  projectedFantasyScore?: number;
  sport?: string;
  stats?: {
    points?: number;
    rebounds?: number;
    assists?: number;
    steals?: number;
    blocks?: number;
    three_pointers_made?: number;
    minutes?: number;
  };
  projections?: {
    fantasy_points?: number;
    points?: number;
    rebounds?: number;
    assists?: number;
    value?: number;
    confidence?: number;
  };
}

interface TeamStats {
  avgPoints: string;
  avgRebounds: string;
  avgAssists: string;
  totalSalary: 0;
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
  players: any[];
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

const FantasyHubScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initializedRef = useRef(false);
  
  // ===== USE UNIFIED API HOOKS =====
  const { useFantasyPlayers, useFantasyTeams } = useAPI();
  
  // ===== STATE MANAGEMENT =====
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // ===== SPORT STATE =====
  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedSportDisplay, setSelectedSportDisplay] = useState('NBA');
  
  // ===== USE UNIFIED HOOKS =====
  const { 
    data: playersData, 
    isLoading: playersLoading, 
    error: playersError,
    refetch: refetchPlayers 
  } = useFantasyPlayers(selectedSport, 50);
  
  const { 
    data: teamsData, 
    isLoading: teamsLoading, 
    error: teamsError,
    refetch: refetchTeams 
  } = useFantasyTeams(selectedSport);

  // ===== FIXED: PLAYERS DATA PROCESSING =====
  const transformedPlayerData = useMemo(() => {
    console.log('🎯 Processing players data:', {
      hasData: !!playersData,
      hasPlayers: playersData?.players?.length > 0,
      playerCount: playersData?.players?.length || 0,
      error: playersError,
      isLoading: playersLoading,
      isRealData: playersData?.is_real_data || false
    });

    // If we have valid API data with players, use it
    if (playersData?.success && playersData?.players?.length > 0) {
      console.log(`✅ Using ${playersData.players.length} real players from API`);
      console.log(`📊 Data source: ${playersData.is_real_data ? 'Real API Data' : 'Mock/Generated Data'}`);
      return playersData.players.map(transformAPIPlayerData);
    }
    
    // If loading, return empty array (don't use fallback yet)
    if (playersLoading) {
      console.log('⏳ Players data loading...');
      return [];
    }
    
    // Only use fallback if API truly failed
    console.log('⚠️ Using fallback fantasy players - API data missing or empty');
    return createMockPlayers(50);
  }, [playersData, playersError, playersLoading]);

  // ===== FIXED: TEAMS DATA PROCESSING =====
  const transformedFantasyTeams = useMemo(() => {
    console.log('🎯 Processing teams data:', {
      hasData: !!teamsData,
      hasTeams: teamsData?.teams?.length > 0,
      teamCount: teamsData?.teams?.length || 0,
      error: teamsError,
      isLoading: teamsLoading,
      isRealData: teamsData?.is_real_data || false
    });

    // If we have valid API data with teams, use it
    if (teamsData?.success && teamsData?.teams?.length > 0) {
      console.log(`✅ Using ${teamsData.teams.length} real teams from API`);
      console.log(`📊 Data source: ${teamsData.is_real_data ? 'Real API Data' : 'Mock/Generated Data'}`);
      return teamsData.teams.map((team: any) => ({
        ...team,
        players: Array.isArray(team.players) 
          ? team.players.map((p: any) => typeof p === 'string' ? p : p.name || p.id || 'Unknown Player')
          : []
      }));
    }
    
    // If loading, return empty array (don't use fallback yet)
    if (teamsLoading) {
      console.log('⏳ Teams data loading...');
      return [];
    }
    
    // Only use fallback if API truly failed
    console.log('⚠️ Using fallback fantasy teams - API data missing or empty');
    return createMockTeams(5);
  }, [teamsData, teamsError, teamsLoading]);

  const loading = playersLoading || teamsLoading;

  // PROJECTION FILTERING STATE
  const [enableProjectionFiltering, setEnableProjectionFiltering] = useState(false);
  const [projectionDifferenceThreshold, setProjectionDifferenceThreshold] = useState(1.0);
  const [onlyShowProjectionEdges, setOnlyShowProjectionEdges] = useState(false);
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
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  
  // Modals
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showDraftResults, setShowDraftResults] = useState(false);
  
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

  // ===== PROJECTION VALUE CALCULATION =====
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
    
    const fantasyScore = player.fantasyScore || player.fantasy_points || 0;
    const projection = player.projection || player.projected_points || 0;
    
    const projectionDiff = projection - fantasyScore;
    const isOverProjection = projectionDiff > 0;
    
    const absDiff = Math.abs(projectionDiff);
    let edge;
    let estimatedTrueProb;
    
    if (absDiff > 10) {
      edge = isOverProjection ? 0.12 : -0.12;
      estimatedTrueProb = isOverProjection ? 0.62 : 0.38;
    } else if (absDiff > 5) {
      edge = isOverProjection ? 0.08 : -0.08;
      estimatedTrueProb = isOverProjection ? 0.58 : 0.42;
    } else if (absDiff > 2) {
      edge = isOverProjection ? 0.04 : -0.04;
      estimatedTrueProb = isOverProjection ? 0.54 : 0.46;
    } else {
      edge = isOverProjection ? 0.02 : -0.02;
      estimatedTrueProb = isOverProjection ? 0.52 : 0.48;
    }
    
    const marketImplied = 0.5;
    
    let confidence = 'low';
    if (Math.abs(edge) > 0.08) confidence = 'very-high';
    else if (Math.abs(edge) > 0.05) confidence = 'high';
    else if (Math.abs(edge) > 0.03) confidence = 'medium';
    else if (Math.abs(edge) > 0.01) confidence = 'low';
    else confidence = 'no-edge';
    
    return {
      edge,
      recommendedSide: edge > 0.02 ? 'over' : edge < -0.02 ? 'under' : 'none',
      confidence,
      marketImplied,
      estimatedTrueProb,
      projectionDiff
    };
  }, []);

  // ===== VALUE-BASED FILTERING =====
  const applyValueFiltering = useCallback((players: Player[]): Player[] => {
    if (!players || players.length === 0) {
      return [];
    }
    
    let filtered = [...players];
    
    if (enableProjectionFiltering) {
      filtered = filtered.filter(p => {
        const projectionValue = p.projection || p.projected_points || 0;
        const fantasyValue = p.fantasyScore || p.fantasy_points || 0;
        
        if (!projectionValue || projectionValue === 0) {
          return true;
        }
        
        const diff = Math.abs(projectionValue - fantasyValue);
        return diff >= projectionDifferenceThreshold;
      });
    }
    
    if (minEdgeThreshold > 0 && onlyShowProjectionEdges) {
      filtered = filtered.filter(p => {
        const value = calculateProjectionValue(p);
        return Math.abs(value.edge) >= minEdgeThreshold;
      });
    }
    
    if (onlyShowProjectionEdges) {
      filtered = filtered.filter(p => {
        const value = calculateProjectionValue(p);
        return value.edge > 0;
      });
    }
    
    return filtered;
  }, [enableProjectionFiltering, projectionDifferenceThreshold, minEdgeThreshold, onlyShowProjectionEdges, calculateProjectionValue]);

  const sortByValueScore = useCallback((players: Player[]): Player[] => {
    if (!players || players.length === 0) {
      return [];
    }
    
    return [...players].sort((a, b) => {
      if (sortByProjectionValue) {
        const valueA = calculateProjectionValue(a);
        const valueB = calculateProjectionValue(b);
        return valueB.edge - valueA.edge;
      } else {
        const scoreA = a.valueScore || a.value || a.fantasyScore || a.fantasy_points || 0;
        const scoreB = b.valueScore || b.value || b.fantasyScore || b.fantasy_points || 0;
        return scoreB - scoreA;
      }
    });
  }, [calculateProjectionValue, sortByProjectionValue]);

  // ===== ADD DEBOUNCED INITIALIZATION =====
  const initializeDataDebounced = useCallback((forceRefresh = false) => {
    // Prevent multiple initializations
    if (initializedRef.current && !forceRefresh) {
      return;
    }
    
    // Only initialize if we have data
    if (transformedPlayerData.length > 0) {
      console.log(`🔍 Initializing data with ${transformedPlayerData.length} players...`);
      console.log(`🔗 Using unified hooks from useAPI`);
      initializedRef.current = true;
      
      // Apply filtering and sorting
      const valueFiltered = applyValueFiltering(transformedPlayerData);
      const sortedByValue = sortByValueScore(valueFiltered);
      
      setAvailablePlayers(transformedPlayerData);
      setFilteredPlayers(valueFiltered);
      setSortedPlayers(sortedByValue);
    }
  }, [transformedPlayerData, applyValueFiltering, sortByValueScore]);

  // ===== USE THIS EFFECT FOR DATA INIT =====
  useEffect(() => {
    // Use setTimeout to debounce initialization
    const timer = setTimeout(() => {
      initializeDataDebounced();
    }, 500); // Wait 500ms after mount
    
    return () => clearTimeout(timer);
  }, [initializeDataDebounced]); // Only depends on the debounced function

  // ===== UPDATE LOAD DATA ON MOUNT =====
  useEffect(() => {
    console.log('🎯 FantasyHubScreen mounted with unified hooks');
    console.log('🔗 Using unified hooks from useAPI');
    logScreenView('FantasyHubScreen');
    
    // Check for initial search params
    const params = new URLSearchParams(location.search);
    const initialSearch = params.get('search');
    if (initialSearch) {
      setSearchInput(initialSearch);
      setSearchQuery(initialSearch);
    }
    
    // Cleanup function
    return () => {
      console.log('🧹 FantasyHubScreen unmounting');
      initializedRef.current = false;
    };
  }, [location]); // ONLY location as dependency - remove others!

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
      points: acc.points + (player.points || 0),
      rebounds: acc.rebounds + (player.rebounds || 0),
      assists: acc.assists + (player.assists || 0),
      salary: acc.salary + (player.salary || 0),
      fantasyScore: acc.fantasyScore + (player.fantasyScore || player.fantasy_points || 0),
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

  // ===== FILTER EFFECT =====
  useEffect(() => {
    if (!availablePlayers || availablePlayers.length === 0) {
      setFilteredPlayers([]);
      setSortedPlayers([]);
      return;
    }
    
    let filtered = availablePlayers.filter(player => {
      if (!player || typeof player !== 'object') {
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
    
    const valueFiltered = applyValueFiltering(filtered);
    const sorted = sortByValueScore(valueFiltered);
    
    setFilteredPlayers(valueFiltered);
    setSortedPlayers(sorted);
    
  }, [availablePlayers, searchQuery, selectedPosition, selectedTeam, applyValueFiltering, sortByValueScore]);

  // ===== SPORT DATA FETCHING =====
  const fetchSportData = async (sport: string) => {
    try {
      setSnackbar({
        open: true,
        message: `Loading ${sport} data from unified API...`,
        severity: 'info'
      });
      
      await refetchPlayers();
      await refetchTeams();
      
      // Reset initialization to force re-initialization
      initializedRef.current = false;
      initializeDataDebounced(true);
      
      setSnackbar({
        open: true,
        message: `${sport} data loaded from unified API`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error(`Failed to load ${sport} data:`, error);
      setSnackbar({
        open: true,
        message: `Failed to load ${sport} data, using fallback data`,
        severity: 'warning'
      });
    }
  };

  // ===== UPDATE SPORT CHANGE HANDLER =====
  const handleSportChange = (sportValue: string) => {
    const sportObj = sports.find(s => s.value === sportValue);
    if (sportObj) {
      setSelectedSportDisplay(sportValue);
      setSelectedSport(sportObj.apiValue);
      
      setSelectedPosition('ALL');
      setSelectedTeam('all');
      setSearchQuery('');
      setSearchInput('');
      
      fetchSportData(sportObj.apiValue);
    }
  };

  // ===== REFRESH HANDLER =====
  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSearchInput('');
    
    try {
      await refetchPlayers();
      await refetchTeams();
      
      // Reset initialization to force re-initialization
      initializedRef.current = false;
      initializeDataDebounced(true);
      
      setSnackbar({ 
        open: true, 
        message: 'Data refreshed from unified API', 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Refresh error:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to refresh, using available data', 
        severity: 'warning' 
      });
    } finally {
      setRefreshing(false);
    }
  };

  // ===== RENDER PLAYER CARD (simplified for brevity) =====
  const renderPlayerCard = (player: Player) => (
    <Box key={player.id} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white' }}>
      <Typography variant="subtitle1" fontWeight="bold">{player.name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {player.position} • {player.team}
      </Typography>
      <Typography variant="body2">
        Salary: ${player.salary?.toLocaleString()}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Source: {playersData?.is_real_data ? 'Python API' : 'Fallback Data'}
      </Typography>
    </Box>
  );

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, mt: 2 }}>Loading Fantasy Hub from unified API...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Using unified hooks system
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      {renderHeader(navigate)}
      
      <Container maxWidth="lg">
        {/* Debug Info */}
        <Box sx={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px', borderRadius: '4px' }}>
          <Typography variant="subtitle2" fontWeight="bold">FantasyHub Debug (Unified Hooks):</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
            <Chip 
              label={teamsError ? '⚠️ Teams Error' : '✅ Teams Loaded'}
              color={teamsError ? 'warning' : 'success'}
            />
            <Chip 
              label={playersError ? '⚠️ Players Error' : '✅ Players Loaded'}
              color={playersError ? 'warning' : 'success'}
            />
            <Chip 
              label={transformedPlayerData[0]?.id?.includes('mock') ? '📊 Mock Data' : '📊 Python API'}
              color={transformedPlayerData[0]?.id?.includes('mock') ? 'info' : 'success'}
            />
            <Chip 
              label="🔗 Unified Hooks"
              color="primary"
              variant="outlined"
            />
            <Typography variant="caption">
              Teams: {transformedFantasyTeams.length} | Players: {transformedPlayerData.length}
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={onRefresh}
              disabled={refreshing}
              startIcon={<RefreshIcon />}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" display="block">
              Hook Type: useAPI (unified) | Current Sport: {selectedSport} | Display: {selectedSportDisplay}
            </Typography>
            <Typography variant="caption" display="block">
              Players Data: {playersData?.is_real_data ? 'Real API' : 'Generated/Fallback'}
            </Typography>
            <Typography variant="caption" display="block">
              Teams Data: {teamsData?.is_real_data ? 'Real API' : 'Generated/Fallback'}
            </Typography>
            <Typography variant="caption" display="block">
              Initialized: {initializedRef.current ? '✅ Yes' : '❌ No'}
            </Typography>
          </Box>
        </Box>

        {/* Sport Selector */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Select Sport:</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {sports.map((sport) => (
              <Button
                key={sport.value}
                variant={selectedSportDisplay === sport.value ? "contained" : "outlined"}
                onClick={() => handleSportChange(sport.value)}
                startIcon={sport.icon}
              >
                {sport.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Simplified UI for demonstration */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Fantasy Players ({filteredPlayers.length})
            <Typography variant="caption" sx={{ ml: 2 }}>
              {playersData?.is_real_data ? '(Real API Data)' : '(Generated/Fallback Data)'}
            </Typography>
          </Typography>
          
          {filteredPlayers.slice(0, 5).map(renderPlayerCard)}
          
          {filteredPlayers.length > 5 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ... and {filteredPlayers.length - 5} more players
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Fantasy Teams ({transformedFantasyTeams.length})
            <Typography variant="caption" sx={{ ml: 2 }}>
              {teamsData?.is_real_data ? '(Real API Data)' : '(Generated/Fallback Data)'}
            </Typography>
          </Typography>
          
          {transformedFantasyTeams.slice(0, 3).map((team: FantasyTeam) => (
            <Box key={team.id} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: 'white' }}>
              <Typography variant="subtitle1" fontWeight="bold">{team.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Owner: {team.owner} • Record: {team.record}
              </Typography>
              <Typography variant="body2">
                Rank: #{team.rank} • Points: {team.points}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data Source: {teamsData?.is_real_data ? 'Python API' : 'Fallback'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default FantasyHubScreen;
