// FantasyHubScreen.tsx – Complete updated version with injury filtering, ADP estimation, and lineup variety
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SortIcon from '@mui/icons-material/Sort';
import ClearIcon from '@mui/icons-material/Clear';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import TuneIcon from '@mui/icons-material/Tune';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';
import LineupIcon from '@mui/icons-material/ViewCompact';
import PlayersIcon from '@mui/icons-material/People';
import DraftIcon from '@mui/icons-material/HowToVote';
import BugReportIcon from '@mui/icons-material/BugReport';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useTheme } from '@mui/material/styles';

// Import services
import { 
  fetchDraftRankings, 
  fetchDraftHistory,
  fetchPlayerProps,
  fetchTank01ADP,
  fetchTank01Injuries,
  fetchTank01News,
  fetchTank01GamesForDate
} from '../services/fantasyHubService';

// Utilities
import { useDebounce } from '../utils/useDebounce';
import { preprocessQuery, QueryIntent } from '../utils/queryProcessor';
import { logPromptPerformance } from '../utils/analytics';

// Components
import FantasyHubDashboard from '../components/FantasyHub/FantasyHubDashBoard';
import FantasyLineupBuilder from '../components/FantasyHub/FantasyLineupBuilder';
import PlayerTrends from '../components/FantasyHub/PlayerTrends';

import { Player, Sport, FantasyLineup, LineupSlot } from '../types/fantasy.types';

// ============= CONSTANTS =============
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';
const SALARY_CAP = 60000;
const MAX_PLAYERS = 9;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Global request throttle
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds minimum between requests

const throttleRequest = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLast));
  }
  lastRequestTime = Date.now();
};

// ============= UTILITY FUNCTIONS =============
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const throttle = (fn: Function, limit: number) => {
  let inThrottle: boolean;
  return (...args: any[]) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Simple cache implementation
const dataCache = new Map<string, { data: any; timestamp: number }>();

const getCachedData = async (key: string, fetchFn: () => Promise<any>) => {
  const cached = dataCache.get(key);
  const now = Date.now();
  
  if (cached && now - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Using cached data for ${key}`);
    return cached.data;
  }
  
  console.log(`🔄 Fetching fresh data for ${key}`);
  const data = await fetchFn();
  dataCache.set(key, { data, timestamp: now });
  return data;
};

const getSessionCached = (key: string) => {
  const cached = sessionStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 300000) { // 5 minutes
      return data;
    }
  }
  return null;
};

const setSessionCached = (key: string, data: any) => {
  sessionStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};

// Request queue with better rate limit handling
const requestQueue: { [key: string]: number } = {};
let pendingRequests = new Set<string>();

const queueRequest = async (key: string, fn: () => Promise<any>, minDelay = 3000) => {
  const now = Date.now();
  const lastRequest = requestQueue[key] || 0;
  const timeSinceLastRequest = now - lastRequest;
  
  if (timeSinceLastRequest < minDelay) {
    const waitTime = minDelay - timeSinceLastRequest;
    console.log(`⏳ Rate limiting ${key}, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  if (pendingRequests.has(key)) {
    console.log(`⏳ Request already in progress for ${key}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    return null;
  }
  
  pendingRequests.add(key);
  
  try {
    const result = await fn();
    requestQueue[key] = Date.now();
    return result;
  } catch (error) {
    requestQueue[key] = Date.now();
    throw error;
  } finally {
    pendingRequests.delete(key);
  }
};

const fetchWithRetry = async (url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response | null> => {
  const urlObj = new URL(url);
  const endpoint = urlObj.pathname.split('/').pop() || 'unknown';
  
  return queueRequest(endpoint, async () => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : Math.min(60000, Math.pow(4, i) * 5000);
          
          console.log(`⏳ Rate limited (429) on ${endpoint}, waiting ${waitTime}ms before retry ${i+1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log(`⏳ Request timeout for ${endpoint}, retry ${i + 1}/${maxRetries}`);
        } else {
          console.log(`⚠️ Request failed for ${endpoint}, retry ${i + 1}/${maxRetries}:`, error.message);
        }
        
        if (i === maxRetries - 1) {
          console.log(`❌ All retries failed for ${endpoint}, returning null`);
          return null;
        }
        
        const waitTime = Math.min(30000, Math.pow(2, i) * 2000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    return null;
  });
};

const createEmptyLineup = (sport: Sport): FantasyLineup => {
  const positions = sport === 'nba'
    ? ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL', 'UTIL']
    : ['C', 'LW', 'RW', 'D', 'D', 'G', 'UTIL', 'UTIL', 'UTIL'];
  
  const slots: LineupSlot[] = positions.map(pos => ({
    position: pos,
    player: null
  }));
  
  return {
    id: `lineup-${Date.now()}`,
    sport,
    slots,
    total_salary: 0,
    total_projection: 0,
    remaining_cap: SALARY_CAP,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// ============= TYPES =============
export interface Player2026 {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: 'NBA' | 'NHL' | 'NFL' | 'MLB';
  salary: number;
  fantasy_points: number;
  projection: number;
  value: number;
  points?: number;
  rebounds?: number;
  assists?: number;
  goals?: number;
  is_rookie?: boolean;
  note?: string;
  trend?: '🔥 Hot' | '📈 Rising' | '🎯 Value' | '❄️ Cold';
  injury_status?: string;
  adp?: number;
  expertRank?: number;
  ceiling?: number;
  floor?: number;
  source?: string;
  tier?: number;
}

interface OddsGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

interface DraftPlayer {
  player: Player2026;
  rank: number;
  valueScore: number;
  reasoning: string;
  salaryFD: number;
  salaryDK: number;
  keyFactors: string[];
  adp?: number;
  expertRank?: number;
  tier?: number;
}

interface DraftResult {
  type: 'snake' | 'turn';
  pickNumber: number;
  players: DraftPlayer[];
  analysis?: string;
}

interface DepthChartEntry {
  position: string;
  players: Array<{ name: string; jersey: string; depth: number }>;
}

interface FantasyHubScreenProps {
  initialSport?: Sport;
}

// ============= NBA PROPS FILTER BAR COMPONENT =============
const NBAPropsFilterBar = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [search, setSearch] = useState('');
  const [statType, setStatType] = useState<string>('all');
  const [minEdge, setMinEdge] = useState<number>(-100);
  const [maxEdge, setMaxEdge] = useState<number>(100);
  const [bookmaker, setBookmaker] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const statTypes = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'three-pointers'];
  const bookmakers = ['FanDuel', 'DraftKings', 'BetOnline.ag', 'Bovada'];

  useEffect(() => {
    onFilterChange({ search, statType, minEdge, maxEdge, bookmaker });
  }, [search, statType, minEdge, maxEdge, bookmaker, onFilterChange]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Filter NBA Props
        </Typography>
        <IconButton onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={showFilters}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Stat Type</InputLabel>
              <Select value={statType} onChange={(e) => setStatType(e.target.value)} label="Stat Type">
                <MenuItem value="all">All</MenuItem>
                {statTypes.map(stat => (
                  <MenuItem key={stat} value={stat}>{stat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Bookmaker</InputLabel>
              <Select value={bookmaker} onChange={(e) => setBookmaker(e.target.value)} label="Bookmaker">
                <MenuItem value="all">All</MenuItem>
                {bookmakers.map(bm => (
                  <MenuItem key={bm} value={bm}>{bm}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom variant="caption">Edge % Range</Typography>
            <Slider
              value={[minEdge, maxEdge]}
              onChange={(e, val) => {
                setMinEdge((val as number[])[0]);
                setMaxEdge((val as number[])[1]);
              }}
              valueLabelDisplay="auto"
              min={-100}
              max={100}
              step={1}
            />
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

// ============= NBA PROPS COMPONENT =============
const NBAProps = ({ onAddToLineup, allPlayers }: { onAddToLineup: (player: Player) => void; allPlayers: Player2026[] }) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>NBA Player Props - Card View</Typography>
      <Alert severity="info">
        This tab will display NBA props in a card-based format. 
        The actual props data will be integrated here.
      </Alert>
    </Paper>
  );
};

// ============= MAIN COMPONENT =============
const FantasyHubScreen: React.FC<FantasyHubScreenProps> = ({ initialSport = 'nba' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // ============= STATE =============
  const [activeSport, setActiveSport] = useState<Sport>(initialSport);
  const [lineup, setLineup] = useState<FantasyLineup>(() => createEmptyLineup(initialSport));
  const [loading, setLoading] = useState<boolean>(true);
  const [savedLineups, setSavedLineups] = useState<Record<string, FantasyLineup>>({});
  const [showLineupHistory, setShowLineupHistory] = useState<boolean>(false);
  const [dataReady, setDataReady] = useState<boolean>(false); // NEW: flag for data loading completion

  // Collapsible sections
  const [propsExpanded, setPropsExpanded] = useState(true);
  const [trendsExpanded, setTrendsExpanded] = useState(true);
  const [lineupExpanded, setLineupExpanded] = useState(true);
  const [playerGridExpanded, setPlayerGridExpanded] = useState(true);
  const [oddsExpanded, setOddsExpanded] = useState(true);
  const [propsFiltersExpanded, setPropsFiltersExpanded] = useState(false);

  // Generator settings
  const [genStrategy, setGenStrategy] = useState<'value' | 'projection' | 'balanced'>('value');
  const [genCount, setGenCount] = useState<number>(5);
  const [ignoreFilters, setIgnoreFilters] = useState<boolean>(false);
  const [generatedLineups, setGeneratedLineups] = useState<FantasyLineup[]>([]);
  const [currentLineupIndex, setCurrentLineupIndex] = useState<number>(0);

  // Players
  const [players, setPlayers] = useState<Player2026[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player2026[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minSalary, setMinSalary] = useState(0);
  const [maxSalary, setMaxSalary] = useState(20000);
  const [minProjection, setMinProjection] = useState(0);
  const [maxProjection, setMaxProjection] = useState(100);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  
  // Stat filters
  const [minPoints, setMinPoints] = useState(0);
  const [maxPoints, setMaxPoints] = useState(50);
  const [minRebounds, setMinRebounds] = useState(0);
  const [maxRebounds, setMaxRebounds] = useState(20);
  const [minAssists, setMinAssists] = useState(0);
  const [maxAssists, setMaxAssists] = useState(15);

  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Props filters
  const [propsSearch, setPropsSearch] = useState('');
  const [propsTeams, setPropsTeams] = useState<string[]>([]);
  const [propsPositions, setPropsPositions] = useState<string[]>([]);
  const [propsMinSalary, setPropsMinSalary] = useState(3000);
  const [propsMaxSalary, setPropsMaxSalary] = useState(15000);
  const [propsMinProjection, setPropsMinProjection] = useState(0);
  const [propsMaxProjection, setPropsMaxProjection] = useState(60);
  
  // New filter state for the props table
  const [propsStatFilter, setPropsStatFilter] = useState<string>('all');
  const [propsMinEdge, setPropsMinEdge] = useState<number>(-100);
  const [propsMaxEdge, setPropsMaxEdge] = useState<number>(100);
  const [propsBookmakerFilter, setPropsBookmakerFilter] = useState<string>('all');
  const [showPropsFilters, setShowPropsFilters] = useState<boolean>(false);

  // Odds / Player Props
  const [playerProps, setPlayerProps] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [propsError, setPropsError] = useState<string | null>(null);

  // Sport tabs
  const [selectedSportTab, setSelectedSportTab] = useState('nba');
  const sports = [
    { id: 'nba', name: 'NBA', icon: '🏀', iconComponent: SportsBasketballIcon, status: 'All-Star Break' },
    { id: 'nhl', name: 'NHL', icon: '🏒', iconComponent: SportsHockeyIcon, status: 'Trade Deadline T-24d' },
    { id: 'nfl', name: 'NFL', icon: '🏈', iconComponent: SportsFootballIcon, status: 'Offseason' },
    { id: 'mlb', name: 'MLB', icon: '⚾', iconComponent: SportsBaseballIcon, status: 'Spring Training' },
  ];

  // NBA Props tab state
  const [nbaPropsTab, setNbaPropsTab] = useState(0);
  const [nbaPropsFilters, setNbaPropsFilters] = useState<any>({});

  // AI Generator
  const [customQuery, setCustomQuery] = useState('');
  const [generatingLineup, setGeneratingLineup] = useState(false);
  const [lineupResult, setLineupResult] = useState<any>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  // Draft - STATE VARIABLES
  const [draftRecommendations, setDraftRecommendations] = useState<any[]>([]);
  const [draftMode, setDraftMode] = useState<'snake' | 'turn'>('snake');
  const [draftPick, setDraftPick] = useState<number>(1);
  const [draftStrategy, setDraftStrategy] = useState<string>('balanced');
  const [draftResult, setDraftResult] = useState<DraftResult | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<DraftResult[]>([]);
  const [userId, setUserId] = useState<string | null>('demo-user-123');

  // ADP & Injuries
  const [adpMap, setAdpMap] = useState<Map<string, any>>(new Map());
  const [injuries, setInjuries] = useState<Set<string>>(new Set());

  // Depth Chart
  const [depthChartOpen, setDepthChartOpen] = useState(false);
  const [depthChartData, setDepthChartData] = useState<DepthChartEntry[]>([]);
  const [selectedTeamForDepth, setSelectedTeamForDepth] = useState<string>('');

  // Tank01 Data
  const [injuryList, setInjuryList] = useState<any[]>([]);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [depthCharts, setDepthCharts] = useState<any[]>([]);
  const [todaysGames, setTodaysGames] = useState<any[]>([]);
  const [loadingInjuries, setLoadingInjuries] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [slatePlayers, setSlatePlayers] = useState<Player2026[]>([]);

  // Main tab
  const [mainTab, setMainTab] = useState(0); // 0: Lineup Builder, 1: Player Props, 2: Draft Center, 3: Odds, 4: NBA Props, 5: Projections

  // ============= COMPUTED VALUES =============
  const teamsPlayingToday = useMemo(() => {
    const teams = new Set<string>();
    todaysGames.forEach(game => {
      if (game.away) teams.add(game.away);
      if (game.home) teams.add(game.home);
    });
    return teams;
  }, [todaysGames]);

  const allPositions = useMemo(() => 
    [...new Set(players.map(p => p.position).filter(Boolean))].sort(), [players]);
  
  const allTeams = useMemo(() => 
    [...new Set(players.map(p => p.team).filter(Boolean))].sort(), [players]);

  const salaryRange = useMemo(() => {
    if (players.length === 0) return [0, 20000];
    const salaries = players.map(p => p.salary).filter(Boolean);
    return salaries.length ? [Math.min(...salaries), Math.max(...salaries)] : [0, 20000];
  }, [players]);

  const projectionRange = useMemo(() => {
    if (players.length === 0) return [0, 100];
    const projections = players.map(p => p.projection).filter(Boolean);
    return projections.length ? [Math.min(...projections), Math.max(...projections)] : [0, 100];
  }, [players]);

  const pointsRange = useMemo(() => {
    if (players.length === 0) return [0, 50];
    const points = players.map(p => p.points || 0).filter(Boolean);
    return points.length ? [Math.min(...points), Math.max(...points)] : [0, 50];
  }, [players]);

  const reboundsRange = useMemo(() => {
    if (players.length === 0) return [0, 20];
    const rebounds = players.map(p => p.rebounds || 0).filter(Boolean);
    return rebounds.length ? [Math.min(...rebounds), Math.max(...rebounds)] : [0, 20];
  }, [players]);

  const assistsRange = useMemo(() => {
    if (players.length === 0) return [0, 15];
    const assists = players.map(p => p.assists || 0).filter(Boolean);
    return assists.length ? [Math.min(...assists), Math.max(...assists)] : [0, 15];
  }, [players]);

  const injuredNames = useMemo(() => 
    new Set(injuryList.map(i => i.longName)), [injuryList]);

  // ============= INJURY HELPER (Improved with ID matching) =============
  const isPlayerInjured = useCallback((player: Player2026): boolean => {
    // 1. Check by player ID if available (most reliable)
    if (player.id && injuryList.some(i => i.playerId === player.id)) {
      console.log(`[INJURY] ${player.name} injured by player ID match`);
      return true;
    }
    
    // 2. Check injury list (Tank01) by name
    if (injuries.size > 0) {
      if (injuries.has(player.name)) {
        console.log(`[INJURY] ${player.name} found in injury list (exact match)`);
        return true;
      }
      const normalized = player.name.replace(/[.\s'\-]/g, '').toLowerCase();
      if (injuries.has(`norm:${normalized}`)) {
        console.log(`[INJURY] ${player.name} found in injury list (normalized match)`);
        return true;
      }
    }
    
    // 3. Fallback to player's injury_status from player object
    if (player.injury_status && player.injury_status !== 'Healthy') {
      console.log(`[INJURY] ${player.name} has injury_status: ${player.injury_status}`);
      return true;
    }
    
    return false;
  }, [injuries, injuryList]);  

  // ============= UPDATE SLATE PLAYERS =============
  useEffect(() => {
    if (players.length > 0 && teamsPlayingToday.size > 0) {
      let filtered = players.filter(p => teamsPlayingToday.has(p.team));
      if (injuries.size > 0 || players.some(p => p.injury_status && p.injury_status !== 'Healthy')) {
        filtered = filtered.filter(p => !isPlayerInjured(p));
      }
      setSlatePlayers(filtered);
      console.log(`[SLATE] Filtered to ${filtered.length} players from today's games (from ${players.length})`);
    } else {
      setSlatePlayers([]);
      console.log('[SLATE] No games today, showing empty slate');
    }
  }, [players, teamsPlayingToday, injuries, isPlayerInjured]);

  // ============= DATA FETCHING WITH SERVICE FUNCTIONS =============
  const fetchTodaysGames = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
      
      if (activeSport === 'mlb') {
        const response = await fetch(`${PYTHON_API_BASE}/api/mlb/games?date=${today}`);
        const data = await response.json();
        if (data.games) {
          setTodaysGames(data.games);
          console.log(`[GAMES] Loaded ${data.games.length} MLB games`);
        }
      } else if (activeSport === 'nhl') {
        const response = await fetch(`${PYTHON_API_BASE}/api/nhl/games?date=${today}`);
        const data = await response.json();
        if (data.games) {
          setTodaysGames(data.games);
          console.log(`[GAMES] Loaded ${data.games.length} NHL games`);
        }
      } else {
        // Use service function for NBA
        const result = await fetchTank01GamesForDate(today, activeSport);
        if (result.success) {
          setTodaysGames(result.data);
          console.log(`[GAMES] Loaded ${result.data.length} games for today from service`);
        } else {
          // Fallback to API
          const tank01Date = today.replace(/-/g, '');
          const response = await fetch(`${NODE_API_BASE}/api/tank01/games?date=${tank01Date}`);
          const data = await response.json();
          if (data.success) {
            setTodaysGames(data.data);
            console.log(`[GAMES] Loaded ${data.data.length} games for today from API`);
          }
        }
      }
    } catch (error) {
      console.error('[GAMES] Failed to fetch:', error);
    }
  }, [activeSport]);

  const fetchInjuries = useCallback(async () => {
    setLoadingInjuries(true);
    try {
      const result = await fetchTank01Injuries(activeSport);
      
      if (result.success && Array.isArray(result.data)) {
        setInjuryList(result.data);
        
        // Build Set of injured player names
        const injuredSet = new Set<string>();
        result.data.forEach((item: any) => {
          if (item.longName) {
            injuredSet.add(item.longName);
            const normalized = item.longName.replace(/[.\s'\-]/g, '').toLowerCase();
            injuredSet.add(`norm:${normalized}`);
          }
        });
        
        setInjuries(injuredSet);
        console.log(`[INJURIES] Loaded ${result.data.length} injured players from service`);
      } else {
        // Fallback to API
        const response = await fetch(`${NODE_API_BASE}/api/tank01/injuries`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setInjuryList(data.data);
          const injuredSet = new Set<string>();
          data.data.forEach((item: any) => {
            if (item.longName) {
              injuredSet.add(item.longName);
              const normalized = item.longName.replace(/[.\s'\-]/g, '').toLowerCase();
              injuredSet.add(`norm:${normalized}`);
            }
          });
          setInjuries(injuredSet);
          console.log(`[INJURIES] Loaded ${data.data.length} injured players from API`);
        }
      }
    } catch (error) {
      console.error('[INJURIES] Failed to fetch:', error);
    } finally {
      setLoadingInjuries(false);
    }
  }, [activeSport]);

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      // Use queueRequest to avoid 429
      const result = await queueRequest('news', () => fetchTank01News(5, activeSport), 3000);
      
      if (result && result.success) {
        setNewsItems(result.data);
        console.log(`[NEWS] Loaded ${result.data.length} news items from service`);
      } else {
        // Fallback to API
        const response = await fetch(`${NODE_API_BASE}/api/tank01/news?max=5`);
        const data = await response.json();
        if (data.success) {
          setNewsItems(data.data);
          console.log(`[NEWS] Loaded ${data.data.length} news items from API`);
        }
      }
    } catch (error) {
      console.error('[NEWS] Failed to fetch:', error);
    } finally {
      setLoadingNews(false);
    }
  }, [activeSport]);

  const fetchADP = useCallback(async () => {
    try {
      // Use queueRequest to avoid 429
      const result = await queueRequest('adp', () => fetchTank01ADP(activeSport), 3000);
      
      if (result && result.success && Array.isArray(result.data)) {
        const adpMapData = new Map();
        
        // First, calculate average ADP for players with valid ADP
        const validADPs = result.data
          .filter((item: any) => item.overallADP && parseFloat(item.overallADP) < 500)
          .map((item: any) => parseFloat(item.overallADP));
        
        const avgValidADP = validADPs.length > 0 
          ? validADPs.reduce((a, b) => a + b, 0) / validADPs.length 
          : 150; // Fallback average
        
        result.data.forEach((item: any) => {
          const normalizedName = item.longName?.replace(/[.\s'\-]/g, '').toLowerCase() || '';
          if (normalizedName) {
            let adpValue = parseFloat(item.overallADP) || 999;
            
            // Convert 999 to a reasonable estimate
            if (adpValue === 999 || adpValue > 500) {
              // If it's a rookie, give them a late-round ADP
              if (item.isRookie) {
                adpValue = avgValidADP + 60; // Rookies go later
              } else {
                // For veterans with missing ADP, use average + random offset
                adpValue = avgValidADP + (Math.random() * 40 - 20);
              }
              adpValue = Math.round(adpValue * 10) / 10; // Round to 1 decimal
            }
            
            adpMapData.set(normalizedName, {
              overallADP: adpValue,
              posADP: item.posADP || '',
              isEstimated: item.overallADP === 999 || item.overallADP > 500
            });
          }
        });
        
        setAdpMap(adpMapData);
        console.log(`[ADP] Loaded ${adpMapData.size} ADP entries with estimates for missing values`);
      } else {
        // Fallback to API
        const response = await fetch(`${NODE_API_BASE}/api/tank01/adp?sport=${activeSport}`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const adpMapData = new Map();
          const validADPs = data.data
            .filter((item: any) => item.overallADP && parseFloat(item.overallADP) < 500)
            .map((item: any) => parseFloat(item.overallADP));
          
          const avgValidADP = validADPs.length > 0 
            ? validADPs.reduce((a, b) => a + b, 0) / validADPs.length 
            : 150;
          
          data.data.forEach((item: any) => {
            const normalizedName = item.longName?.replace(/[.\s'\-]/g, '').toLowerCase() || '';
            if (normalizedName) {
              let adpValue = parseFloat(item.overallADP) || 999;
              
              if (adpValue === 999 || adpValue > 500) {
                if (item.isRookie) {
                  adpValue = avgValidADP + 60;
                } else {
                  adpValue = avgValidADP + (Math.random() * 40 - 20);
                }
                adpValue = Math.round(adpValue * 10) / 10;
              }
              
              adpMapData.set(normalizedName, {
                overallADP: adpValue,
                posADP: item.posADP || '',
                isEstimated: item.overallADP === 999 || item.overallADP > 500
              });
            }
          });
          setAdpMap(adpMapData);
          console.log(`[ADP] Loaded ${adpMapData.size} ADP entries from API with estimates`);
        }
      }
    } catch (error) {
      console.error('[ADP] Failed to fetch:', error);
    }
  }, [activeSport]);

  // ============= FETCH PLAYERS =============
  const fetchPlayers = useCallback(async () => {
    if (players.length > 0 && !ignoreFilters) {
      console.log('[PLAYERS] Already have players, skipping fetch');
      return;
    }

    setIsLoadingPlayers(true);
    setError(null);
    
    try {
      const cachedPlayers = getSessionCached(`players_${activeSport}`);
      if (cachedPlayers) {
        console.log('[PLAYERS] Using cached players');
        setPlayers(cachedPlayers);
        setFilteredPlayers(cachedPlayers);
        setIsLoadingPlayers(false);
        return;
      }
      
      let backendUrl: string;
      if (activeSport === 'mlb' || activeSport === 'nhl') {
        backendUrl = `${PYTHON_API_BASE}/api/players?sport=${activeSport}&realtime=true&limit=500`;
      } else {
        backendUrl = `${NODE_API_BASE}/api/fantasyhub/players?sport=${activeSport}`;
      }
      
      console.log('[FETCH] Fetching players from:', backendUrl);
      
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(backendUrl, { signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      let playersData: any[] = [];
      if (activeSport === 'mlb' || activeSport === 'nhl') {
        if (data.success && Array.isArray(data.data?.players)) {
          playersData = data.data.players;
        }
      } else {
        if (data.success && Array.isArray(data.data)) {
          playersData = data.data;
        }
      }
      
      const transformed = playersData.map((player: any) => ({
        id: player.id || player.player_id || `player-${Math.random()}`,
        name: player.name,
        team: player.team,
        position: player.position,
        salary: player.salary || 5000,
        projection: player.fantasy_points || player.projection || 0,
        fantasy_points: player.fantasy_points || player.projection || 0,
        value: player.value || 0,
        points: player.points || 0,
        rebounds: player.rebounds || 0,
        assists: player.assists || 0,
        steals: player.steals || 0,
        blocks: player.blocks || 0,
        injury_status: player.injury_status || 'Healthy',
        sport: activeSport.toUpperCase(),
        is_rookie: player.is_rookie || false,
        adp: player.adp,
        source: player.source || 'api'
      }));
      
      const uniqueMap = new Map();
      transformed.forEach(p => {
        const key = `${p.name}-${p.team}`;
        const existing = uniqueMap.get(key);
        if (!existing || p.salary > existing.salary) {
          uniqueMap.set(key, p);
        }
      });
      const uniquePlayers = Array.from(uniqueMap.values());
      
      setPlayers(uniquePlayers);
      setFilteredPlayers(uniquePlayers);
      setSessionCached(`players_${activeSport}`, uniquePlayers);
      
      updateFilterRanges(uniquePlayers);
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[PLAYERS] Request aborted (timeout or unmount)');
      } else {
        console.error('[FETCH] Error fetching players:', err);
        setError(err.message);
        
        if (players.length === 0) {
          console.log('[PLAYERS] No players, using mock fallback');
          const mockPlayers = generateMockPlayers();
          setPlayers(mockPlayers);
          setFilteredPlayers(mockPlayers);
          setSessionCached(`players_${activeSport}`, mockPlayers);
        }
      }
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [activeSport, players.length, ignoreFilters]);

  const updateFilterRanges = (players: Player2026[]) => {
    const salaries = players.map(p => p.salary).filter(Boolean);
    const projections = players.map(p => p.projection).filter(Boolean);
    if (salaries.length) {
      setMinSalary(Math.min(...salaries));
      setMaxSalary(Math.max(...salaries));
      setPropsMinSalary(Math.min(...salaries));
      setPropsMaxSalary(Math.max(...salaries));
    }
    if (projections.length) {
      setMinProjection(Math.min(...projections));
      setMaxProjection(Math.max(...projections));
      setPropsMinProjection(Math.min(...projections));
      setPropsMaxProjection(Math.max(...projections));
    }
  };

  const generateMockPlayers = (): Player2026[] => {
    const teams = ['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW', 'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NO', 'NY', 'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SA', 'TOR', 'UTA', 'WAS'];
    const positions = ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F'];
    const players: Player2026[] = [];
    
    for (let i = 0; i < 150; i++) {
      const salary = 3000 + Math.floor(Math.random() * 10000);
      const projection = 15 + Math.random() * 30;
      const positionIndex = i % positions.length;
      players.push({
        id: `mock-${i}`,
        name: `Player ${i + 1}`,
        team: teams[Math.floor(Math.random() * teams.length)],
        position: positions[positionIndex],
        sport: 'NBA',
        salary,
        fantasy_points: projection,
        projection,
        value: (projection / salary) * 1000,
        points: 10 + Math.random() * 20,
        rebounds: 3 + Math.random() * 10,
        assists: 2 + Math.random() * 8,
        injury_status: 'healthy',
        source: 'mock'
      });
    }
    return players;
  };

  // ============= FETCH PLAYER PROPS =============
  const fetchPlayerPropsData = useCallback(async () => {
    setLoadingProps(true);
    setPropsError(null);
    try {
      const data = await fetchPlayerProps(activeSport, 200);
      if (data.success && Array.isArray(data.props)) {
        console.log(`[PROPS] Loaded ${data.props.length} player props from Python`);
        setPlayerProps(data.props);
      } else {
        setPropsError('Invalid props data');
      }
    } catch (err) {
      setPropsError(err instanceof Error ? err.message : 'Failed to load props');
      console.error('[PROPS] Error:', err);
    } finally {
      setLoadingProps(false);
    }
  }, [activeSport]);

  // ============= INITIAL DATA FETCH (with dataReady flag) =============
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setDataReady(false);
      
      await fetchPlayers();
      
      // Stagger the API calls to respect rate limits, but use Promise.all to await all
      // Use queueRequest inside each fetch to handle 429s
      await Promise.all([
        fetchPlayerPropsData(),
        fetchTodaysGames(),
        fetchInjuries(),
        fetchNews(),
        fetchADP()
      ]);
      
      setDataReady(true);
      setLoading(false);
    };
    
    loadData();
  }, [fetchPlayers, fetchPlayerPropsData, fetchTodaysGames, fetchInjuries, fetchNews, fetchADP]);

  // ============= LOAD SAVED LINEUPS =============
  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      try {
        const storageKey = `fantasyHubLineups_${activeSport}_2026`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const lineups: Record<string, FantasyLineup> = JSON.parse(saved);
          setSavedLineups(lineups);
          const lineupArray = Object.values(lineups);
          if (lineupArray.length > 0) {
            setLineup(lineupArray[0]);
          } else {
            setLineup(createEmptyLineup(activeSport));
          }
        } else {
          setLineup(createEmptyLineup(activeSport));
          setSavedLineups({});
        }
      } catch (error) {
        console.error('Failed to load lineup data:', error);
        setLineup(createEmptyLineup(activeSport));
      }
    };

    loadInitialData();
  }, [activeSport]);

  // ============= FILTER PLAYERS =============
  useEffect(() => {
    if (players.length === 0) return;
    
    let filtered = slatePlayers.length > 0 ? [...slatePlayers] : [...players];
    
    // Injury filter
    if (injuries.size > 0 || players.some(p => p.injury_status && p.injury_status !== 'Healthy')) {
      filtered = filtered.filter(player => !isPlayerInjured(player));
    }
    
    // Search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase().trim();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query)
      );
    }
    
    // Salary filter
    filtered = filtered.filter(player =>
      player.salary >= minSalary && player.salary <= maxSalary
    );
    
    // Projection filter
    filtered = filtered.filter(player =>
      player.projection >= minProjection && player.projection <= maxProjection
    );
    
    // Position filter
    if (selectedPositions.length > 0) {
      filtered = filtered.filter(player => selectedPositions.includes(player.position));
    }
    
    // Team filter
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(player => selectedTeams.includes(player.team));
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'value': aVal = a.value || 0; bVal = b.value || 0; break;
        case 'projection': aVal = a.projection || 0; bVal = b.projection || 0; break;
        case 'salary': aVal = a.salary || 0; bVal = b.salary || 0; break;
        default: aVal = a.value || 0; bVal = b.value || 0;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    setFilteredPlayers(filtered);
  }, [
    players, slatePlayers, debouncedSearch, sortBy, sortOrder,
    minSalary, maxSalary, minProjection, maxProjection,
    selectedPositions, selectedTeams, injuries, isPlayerInjured
  ]);

  // ============= LOAD DRAFT HISTORY =============
  useEffect(() => {
    if (userId) {
      const loadDraftHistory = async () => {
        try {
          const data = await fetchDraftHistory(userId, activeSport);
          
          if (data && data.success) {
            setSavedDrafts(data.data || []);
            console.log(`[DRAFT HISTORY] Loaded ${data.data?.length || 0} saved drafts`);
          } else if (data && Array.isArray(data)) {
            setSavedDrafts(data);
            console.log(`[DRAFT HISTORY] Loaded ${data.length} saved drafts`);
          }
        } catch (error) {
          console.error('[DRAFT HISTORY] Error fetching:', error);
        }
      };
      
      loadDraftHistory();
    }
  }, [userId, activeSport]);
    
  // ============= HANDLERS =============
  const checkLineupSalary = (lineupToCheck: FantasyLineup) => {
    const total = lineupToCheck.slots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
    console.log('[SALARY CHECK]', {
      total,
      cap: SALARY_CAP,
      remaining: SALARY_CAP - total,
      players: lineupToCheck.slots.filter(s => s.player).map(s => 
        `${s.player?.name}: $${s.player?.salary}`
      )
    });
    return total <= SALARY_CAP;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSportChange = (sportId: Sport) => {
    console.log('[SPORT] Changing sport to:', sportId);
    logPromptPerformance('sport_change', sportId, 0, 'filter');
    setActiveSport(sportId);
    setSelectedSportTab(sportId);
    setLineup(createEmptyLineup(sportId));
  };

  const handleAddPlayer = (player: Player): void => {
    if (!player.id || !player.salary) {
      console.warn('[handleAddPlayer] Invalid player data');
      return;
    }

    const filledSlots = lineup.slots.filter(slot => slot.player !== null).length;
    if (filledSlots >= MAX_PLAYERS) {
      alert('Maximum 9 players per lineup');
      return;
    }

    if (player.salary > lineup.remaining_cap) {
      alert(`Insufficient salary cap. Need $${(player.salary - lineup.remaining_cap).toLocaleString()} more.`);
      return;
    }

    const emptySlotIndex = lineup.slots.findIndex(slot => slot.player === null);
    if (emptySlotIndex === -1) {
      console.warn('[handleAddPlayer] No empty slot found');
      return;
    }

    const newSlots = [...lineup.slots];
    newSlots[emptySlotIndex] = { ...newSlots[emptySlotIndex], player };

    const totalSalary = newSlots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
    const totalProjection = newSlots.reduce((sum, slot) => sum + (slot.player?.fantasy_projection || 0), 0);

    setLineup({
      ...lineup,
      slots: newSlots,
      total_salary: totalSalary,
      total_projection: totalProjection,
      remaining_cap: SALARY_CAP - totalSalary,
      updated_at: new Date().toISOString()
    });
  };

  const handleRemovePlayer = (playerId: string): void => {
    const newSlots = lineup.slots.map(slot => 
      slot.player?.id === playerId ? { ...slot, player: null } : slot
    );

    const totalSalary = newSlots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
    const totalProjection = newSlots.reduce((sum, slot) => sum + (slot.player?.fantasy_projection || 0), 0);

    setLineup({
      ...lineup,
      slots: newSlots,
      total_salary: totalSalary,
      total_projection: totalProjection,
      remaining_cap: SALARY_CAP - totalSalary,
      updated_at: new Date().toISOString()
    });
  };

  const handleSaveLineup = (): void => {
    const updatedHistory = {
      ...savedLineups,
      [lineup.id || `lineup-${Date.now()}`]: lineup
    };
    localStorage.setItem(`fantasyHubLineups_${activeSport}_2026`, JSON.stringify(updatedHistory));
    setSavedLineups(updatedHistory);
    alert('Lineup saved successfully!');
  };

  const handleClearLineup = (): void => {
    if (window.confirm('Clear your entire lineup?')) {
      setLineup(createEmptyLineup(activeSport));
    }
  };

  const handleLoadLineup = (lineupId: string): void => {
    const lineupToLoad = savedLineups[lineupId];
    if (lineupToLoad) {
      setLineup(lineupToLoad);
      setShowLineupHistory(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('value');
    setSortOrder('desc');
    setMinSalary(salaryRange[0]);
    setMaxSalary(salaryRange[1]);
    setMinProjection(projectionRange[0]);
    setMaxProjection(projectionRange[1]);
    setMinPoints(pointsRange[0]);
    setMaxPoints(pointsRange[1]);
    setMinRebounds(reboundsRange[0]);
    setMaxRebounds(reboundsRange[1]);
    setMinAssists(assistsRange[0]);
    setMaxAssists(assistsRange[1]);
    setSelectedPositions([]);
    setSelectedTeams([]);
  };

  const buildLineupFromPlayers = useCallback((playerArray, sport) => {
    const slots = createEmptyLineup(sport).slots;
    for (let i = 0; i < Math.min(playerArray.length, slots.length); i++) {
      slots[i].player = {
        id: playerArray[i].id,
        name: playerArray[i].name,
        team: playerArray[i].team,
        position: playerArray[i].position,
        salary: playerArray[i].salary,
        fantasy_projection: playerArray[i].projection,
        points: playerArray[i].points,
        assists: playerArray[i].assists,
        rebounds: playerArray[i].rebounds,
        goals: playerArray[i].goals
      };
    }
    const totalSalary = slots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
    const totalProjection = slots.reduce((sum, slot) => sum + (slot.player?.fantasy_projection || 0), 0);
    return {
      id: `lineup-${Date.now()}-${Math.random()}`,
      sport,
      slots,
      total_salary: totalSalary,
      total_projection: totalProjection,
      remaining_cap: SALARY_CAP - totalSalary,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, []);

  // ============= UPDATED MUTATE LINEUP WITH VARIETY =============
  const mutateLineup = useCallback((currentPlayers, allPlayers, cap, sport) => {
    const newPlayers = [...currentPlayers];
    const usedIds = new Set(newPlayers.map(p => p.id));

    // Calculate current salary distribution
    const salaries = newPlayers.map(p => p.salary);
    const hasHighSalary = salaries.some(s => s > 10000);
    const hasLowSalary = salaries.some(s => s < 5000);
    const avgSalary = salaries.reduce((a, b) => a + b, 0) / salaries.length;

    // Try multiple mutation strategies
    const strategies = [
      'similar',      // Replace with similar player
      'upsell',       // Replace with higher salary player
      'downsell',     // Replace with lower salary player
      'position',     // Replace with different position
      'random'        // Complete random
    ];
    
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    console.log(`[Mutate] Using strategy: ${strategy}`);

    for (let attempt = 0; attempt < 30; attempt++) {
      const idxToReplace = Math.floor(Math.random() * newPlayers.length);
      const oldPlayer = newPlayers[idxToReplace];

      // Set salary range based on strategy
      let minSalary = 3400;
      let maxSalary = 13500;
      
      switch(strategy) {
        case 'similar':
          minSalary = Math.max(3400, oldPlayer.salary - 1000);
          maxSalary = Math.min(13500, oldPlayer.salary + 1000);
          break;
        case 'upsell':
          minSalary = oldPlayer.salary + 500;
          maxSalary = Math.min(13500, oldPlayer.salary + 3000);
          break;
        case 'downsell':
          minSalary = Math.max(3400, oldPlayer.salary - 3000);
          maxSalary = oldPlayer.salary - 500;
          break;
        case 'position':
          // Same salary range but force position change
          minSalary = Math.max(3400, oldPlayer.salary - 1500);
          maxSalary = Math.min(13500, oldPlayer.salary + 1500);
          break;
        case 'random':
          // Full range
          minSalary = 3400;
          maxSalary = 13500;
          break;
      }

      // Force variety based on team needs
      if (!hasHighSalary && strategy !== 'downsell') {
        maxSalary = Math.min(13500, maxSalary + 2000);
      }
      if (!hasLowSalary && strategy !== 'upsell') {
        minSalary = Math.max(3400, minSalary - 2000);
      }

      // Position targeting based on strategy
      let targetPosition = null;
      if (strategy === 'position') {
        const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
        const currentPos = oldPlayer.position;
        const otherPositions = positions.filter(p => p !== currentPos);
        targetPosition = otherPositions[Math.floor(Math.random() * otherPositions.length)];
      }

      const candidates = allPlayers.filter(p =>
        !usedIds.has(p.id) &&
        p.salary >= minSalary &&
        p.salary <= maxSalary &&
        // Projection tolerance based on strategy
        (strategy === 'similar' ? 
          Math.abs(p.projection - oldPlayer.projection) / oldPlayer.projection < 0.2 :
          Math.abs(p.projection - oldPlayer.projection) / oldPlayer.projection < 0.4) &&
        // Position filter
        (targetPosition ? p.position.includes(targetPosition) : true)
      );

      if (candidates.length === 0) continue;

      // Weight candidates by desired outcome
      const weightedCandidates = candidates.map(p => {
        let weight = 1;
        
        // Higher weight for players that help achieve variety
        if (!hasHighSalary && p.salary > 10000) weight *= 3;
        if (!hasLowSalary && p.salary < 5000) weight *= 3;
        
        // Higher weight for different position if that's the goal
        if (strategy === 'position' && !p.position.includes(oldPlayer.position)) weight *= 2;
        
        return { player: p, weight };
      });

      // Select based on weights
      const totalWeight = weightedCandidates.reduce((sum, wc) => sum + wc.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedPlayer = weightedCandidates[0].player;
      
      for (const wc of weightedCandidates) {
        random -= wc.weight;
        if (random <= 0) {
          selectedPlayer = wc.player;
          break;
        }
      }

      const newTotalSalary = newPlayers.reduce((sum, p, i) =>
        sum + (i === idxToReplace ? selectedPlayer.salary : p.salary), 0
      );

      if (newTotalSalary <= cap) {
        newPlayers[idxToReplace] = selectedPlayer;
        console.log(`[Mutate] Replaced ${oldPlayer.name} ($${oldPlayer.salary}) with ${selectedPlayer.name} ($${selectedPlayer.salary}) using ${strategy} strategy`);
        return buildLineupFromPlayers(newPlayers, sport);
      }
    }
    
    console.log('[Mutate] No valid mutation found');
    return null;
  }, [buildLineupFromPlayers]);

  // ============= HELPER FUNCTIONS FOR LINEUP GENERATION =============
  const getMinRemainingSalary = (availablePlayers: Player2026[], slotsRemaining: number): number => {
    const sortedBySalary = [...availablePlayers].sort((a, b) => a.salary - b.salary);
    let total = 0;
    for (let i = 0; i < Math.min(slotsRemaining, sortedBySalary.length); i++) {
      total += sortedBySalary[i].salary;
    }
    return total;
  };

  const canPlayPositionLegacy = (playerPos: string, slotPos: string, sport: Sport): boolean => {
    const positions = playerPos.split('/').map(p => p.trim());
    
    if (sport === 'nba') {
      switch (slotPos) {
        case 'PG': return positions.includes('PG') || positions.includes('G');
        case 'SG': return positions.includes('SG') || positions.includes('G');
        case 'SF': return positions.includes('SF') || positions.includes('F');
        case 'PF': return positions.includes('PF') || positions.includes('F');
        case 'C': return positions.includes('C');
        case 'G': return positions.includes('PG') || positions.includes('SG') || positions.includes('G');
        case 'F': return positions.includes('SF') || positions.includes('PF') || positions.includes('F');
        case 'UTIL': return true;
        default: return positions.includes(slotPos);
      }
    } else {
      switch (slotPos) {
        case 'C':   return positions.includes('C');
        case 'LW':  return positions.includes('LW');
        case 'RW':  return positions.includes('RW');
        case 'D':   return positions.includes('D');
        case 'G':   return positions.includes('G');
        case 'UTIL': return !positions.includes('G');
        default:    return positions.includes(slotPos);
      }
    }
  };

  // ============= ADD RANDOM LINEUP GENERATOR HELPER =============
  const generateRandomLineup = useCallback((players: Player2026[], positions: string[], cap: number): FantasyLineup | null => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const selected: Player2026[] = [];
    let totalSalary = 0;
    
    for (const player of shuffled) {
      if (selected.length >= 9) break;
      if (totalSalary + player.salary <= cap) {
        selected.push(player);
        totalSalary += player.salary;
      }
    }
    
    if (selected.length === 9) {
      return buildLineupFromPlayers(selected, activeSport);
    }
    
    return null;
  }, [activeSport, buildLineupFromPlayers]);

  // ============= UPDATED BACKTRACK WITH BETTER PERFORMANCE =============
  const generateLineupBacktrack = useCallback((
    players: Player2026[],
    slots: string[],
    salaryCap: number,
    strategy: 'value' | 'projection' | 'balanced'
  ): FantasyLineup | null => {
    const startTime = Date.now();
    const TIME_LIMIT = 3000; // Reduced from 5000ms to 3000ms

    console.log(`[Backtrack] Generating lineup with ${players.length} players, need ${slots.length} slots, cap $${salaryCap}, strategy: ${strategy}`);

    if (!players || players.length < slots.length) {
      console.log(`[Backtrack] Not enough players: have ${players?.length || 0}, need ${slots.length}`);
      return null;
    }

    // Pre-filter players - only those who can actually be used
    let eligiblePlayers = players.filter(p => p.salary > 0 && p.projection > 0);
    
    // If we have too many players, take a random sample for performance
    if (eligiblePlayers.length > 100) {
      // Shuffle and take top 100 by value/projection
      eligiblePlayers = eligiblePlayers
        .map(p => ({ ...p, score: (p.projection || 0) / (p.salary || 1) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 100)
        .map(p => {
          const { score, ...rest } = p;
          return rest;
        });
      console.log(`[Backtrack] Sampled to ${eligiblePlayers.length} top-value players for performance`);
    }

    const playerPool = eligiblePlayers.map(p => ({
      ...p,
      valueScore: (p.fantasy_points || 0) / (p.salary || 1) * 1000,
      score: strategy === 'value' ? ((p.fantasy_points || 0) / (p.salary || 1) * 1000) :
             strategy === 'projection' ? (p.projection || 0) :
             ((p.projection || 0) * 0.7 + ((p.fantasy_points || 0) / (p.salary || 1) * 1000) * 0.3)
    }));

    const result: (Player2026 | null)[] = new Array(slots.length).fill(null);
    const usedIds = new Set<string>();

    // Create position-based lookup for faster filtering
    const playersByPosition = new Map<string, typeof playerPool>();
    playerPool.forEach(player => {
      const pos = player.position;
      if (!playersByPosition.has(pos)) {
        playersByPosition.set(pos, []);
      }
      playersByPosition.get(pos)!.push(player);
    });

    function backtrack(index: number, currentSalary: number): boolean {
      if (Date.now() - startTime > TIME_LIMIT) {
        console.warn('[Backtrack] Time limit reached, aborting');
        return false;
      }

      if (index === slots.length) {
        const totalProjection = result.reduce((sum, p) => sum + (p?.projection || 0), 0);
        console.log(`[Backtrack] Found valid lineup in ${Date.now() - startTime}ms with ${totalProjection.toFixed(1)} FP`);
        return true;
      }

      const slot = slots[index];
      const slotsRemaining = slots.length - index;
      
      // Quick feasibility check
      const minRemainingSalary = getMinRemainingSalary(
        playerPool.filter(p => !usedIds.has(p.id)),
        slotsRemaining
      );
      if (salaryCap - currentSalary < minRemainingSalary) {
        return false;
      }

      // Get candidates for this position
      let candidates: typeof playerPool = [];
      
      if (slot === 'UTIL') {
        // UTIL can be anyone
        candidates = playerPool
          .filter(p => !usedIds.has(p.id) && p.salary <= salaryCap - currentSalary)
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);
      } else {
        // For specific positions, get players that can play this position
        const possiblePositions = slot === 'G' ? ['PG', 'SG', 'G'] :
                                 slot === 'F' ? ['SF', 'PF', 'F'] :
                                 [slot];
        
        candidates = playerPool
          .filter(p => !usedIds.has(p.id) && 
                  possiblePositions.some(pos => p.position.includes(pos)) &&
                  p.salary <= salaryCap - currentSalary)
          .sort((a, b) => b.score - a.score)
          .slice(0, 15);
      }

      // Try each candidate
      for (const player of candidates) {
        result[index] = player;
        usedIds.add(player.id);

        if (backtrack(index + 1, currentSalary + player.salary)) {
          return true;
        }

        result[index] = null;
        usedIds.delete(player.id);
      }

      return false;
    }

    if (backtrack(0, 0)) {
      const newSlots = createEmptyLineup(activeSport).slots;
      for (let i = 0; i < slots.length; i++) {
        if (result[i]) {
          newSlots[i].player = {
            id: result[i]!.id,
            name: result[i]!.name,
            team: result[i]!.team,
            position: result[i]!.position,
            salary: result[i]!.salary,
            fantasy_projection: result[i]!.projection,
            points: result[i]!.points,
            assists: result[i]!.assists,
            rebounds: result[i]!.rebounds,
            goals: result[i]!.goals
          };
        }
      }

      const totalSalary = newSlots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
      const totalProjection = newSlots.reduce((sum, slot) => sum + (slot.player?.fantasy_projection || 0), 0);

      return {
        id: `lineup-${Date.now()}-${Math.random()}`,
        sport: activeSport,
        slots: newSlots,
        total_salary: totalSalary,
        total_projection: totalProjection,
        remaining_cap: salaryCap - totalSalary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    console.warn('[Backtrack] No lineup found within time limit');
    return null;
  }, [activeSport]);

  // ============= FALLBACK GENERATOR THAT ALWAYS WORKS =============
  const generateSimpleLineup = useCallback((
    players: Player2026[],
    slots: string[],
    salaryCap: number
  ): FantasyLineup | null => {
    console.log('[Simple] Using fallback generator');
    
    // Sort by value (projection/salary)
    const sorted = [...players]
      .filter(p => p.salary > 0 && p.projection > 0)
      .sort((a, b) => (b.projection / b.salary) - (a.projection / a.salary));
    
    const selected: Player2026[] = [];
    let totalSalary = 0;
    const usedIds = new Set<string>();
    
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      let found = false;
      
      for (const player of sorted) {
        if (usedIds.has(player.id)) continue;
        if (totalSalary + player.salary > salaryCap) continue;
        
        // Check position eligibility
        if (slot === 'UTIL') {
          // UTIL can be anyone
          selected.push(player);
          usedIds.add(player.id);
          totalSalary += player.salary;
          found = true;
          break;
        } else if (slot === 'G' && (player.position.includes('PG') || player.position.includes('SG') || player.position.includes('G'))) {
          selected.push(player);
          usedIds.add(player.id);
          totalSalary += player.salary;
          found = true;
          break;
        } else if (slot === 'F' && (player.position.includes('SF') || player.position.includes('PF') || player.position.includes('F'))) {
          selected.push(player);
          usedIds.add(player.id);
          totalSalary += player.salary;
          found = true;
          break;
        } else if (player.position.includes(slot)) {
          selected.push(player);
          usedIds.add(player.id);
          totalSalary += player.salary;
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log('[Simple] Could not fill slot:', slot);
        return null;
      }
    }
    
    return buildLineupFromPlayers(selected, activeSport);
  }, [activeSport, buildLineupFromPlayers]);

  // ============= UPDATED GENERATE LINEUP WITH VARIETY =============
  const generateLineup = useCallback((players, numLineups = 3) => {
    console.log(`[Knapsack] Generating lineup with ${players.length} players, need 9 slots, cap $${SALARY_CAP}`);

    if (!players || players.length < 9) {
      console.log('[Knapsack] Not enough players');
      return [];
    }

    let validPlayers = players.filter(p => p.salary > 0 && p.projection > 0);
    if (validPlayers.length < 9) {
      console.log('[Knapsack] Not enough players with positive salary/projection');
      return [];
    }

    // Add more noise for variety (increased from 2% to 5%)
    const playersWithNoise = validPlayers.map(p => ({
      ...p,
      noisyProjection: p.projection * (1 + (Math.random() * 0.1 - 0.05)) // ±5% noise
    }));

    const dp = Array.from({ length: 10 }, () => new Map());
    dp[0].set(0, 0);

    for (const player of playersWithNoise) {
      const sal = player.salary;
      const proj = player.noisyProjection;
      for (let k = 9; k >= 1; k--) {
        const prevMap = dp[k - 1];
        const currentMap = dp[k];
        for (const [prevSal, prevProj] of prevMap.entries()) {
          const newSal = prevSal + sal;
          if (newSal <= SALARY_CAP) {
            const newProj = prevProj + proj;
            const existing = currentMap.get(newSal);
            
            // Increased randomness in tie-breaking
            if (existing === undefined || newProj > existing * 1.02) { // 2% threshold instead of exact
              currentMap.set(newSal, newProj);
            } else if (Math.random() < 0.3) { // 30% chance to replace even if slightly worse
              currentMap.set(newSal, newProj);
            }
          }
        }
      }
    }

    // Find multiple good lineups, not just the best
    const topSalaries = Array.from(dp[9].entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Take top 5 by projection
      .map(entry => entry[0]);
    
    if (topSalaries.length === 0) {
      console.log('[Knapsack] Could not find a 9‑player combination under cap');
      return [];
    }

    // Randomly pick one of the top salaries
    const selectedSalary = topSalaries[Math.floor(Math.random() * topSalaries.length)];
    
    // Reconstruct the lineup
    const selectedIds = new Set();
    let remainingSalary = selectedSalary;
    let remainingPlayers = 9;
    
    // Shuffle players for more variety
    const shuffledPlayers = [...playersWithNoise]
      .sort(() => Math.random() - 0.5);
    
    for (const player of shuffledPlayers) {
      if (remainingPlayers === 0) break;
      if (selectedIds.has(player.id)) continue;
      if (player.salary <= remainingSalary) {
        const prevK = remainingPlayers - 1;
        const prevSal = remainingSalary - player.salary;
        if (dp[prevK].has(prevSal)) {
          selectedIds.add(player.id);
          remainingSalary -= player.salary;
          remainingPlayers--;
        }
      }
    }

    const selectedPlayers = validPlayers.filter(p => selectedIds.has(p.id));
    const optimalLineup = buildLineupFromPlayers(selectedPlayers, activeSport);

    // 60% chance to mutate, 40% chance to return optimal (increased mutation rate)
    if (Math.random() < 0.6) {
      console.log('[Knapsack] Attempting mutation');
      const mutated = mutateLineup(selectedPlayers, validPlayers, SALARY_CAP, activeSport);
      if (mutated) {
        console.log('[Knapsack] Returning mutated lineup');
        return [mutated];
      }
    }
    
    console.log('[Knapsack] Returning optimal lineup');
    return [optimalLineup];
    
  }, [activeSport, buildLineupFromPlayers, mutateLineup]);

  // ============= UPDATED GENERATE MULTIPLE LINEUPS WITH BETTER FALLBACKS AND SAFETY FILTER =============
  const generateMultipleLineups = useCallback((
    players: Player2026[],
    sport: Sport,
    strategy: 'value' | 'projection' | 'balanced',
    count: number
  ): FantasyLineup[] => {
    const positions = sport === 'nba'
      ? ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL', 'UTIL']
      : ['C', 'LW', 'RW', 'D', 'D', 'G', 'UTIL', 'UTIL', 'UTIL'];

    // --- SAFETY FILTER: Only players on today's slate and not injured ---
    let safePlayers = players.filter(p => {
      // Must be playing today
      if (teamsPlayingToday.size > 0 && !teamsPlayingToday.has(p.team)) return false;
      // Must not be injured
      if (isPlayerInjured(p)) return false;
      return true;
    });
    
    if (safePlayers.length < 9) {
      console.warn('[MultipleLineups] Not enough safe players after final filter');
      return [];
    }
    
    console.log(`[MultipleLineups] Generating up to ${count} lineups with ${safePlayers.length} players, strategy: ${strategy}`);

    const lineups: FantasyLineup[] = [];
    const usedPlayerCombos = new Set<string>();
    
    // Always include the knapsack result as first lineup
    const knapsackResult = generateLineup(safePlayers, 1);
    if (knapsackResult.length > 0) {
      const lineup = knapsackResult[0];
      const playerIds = lineup.slots
        .filter(s => s.player)
        .map(s => s.player!.id)
        .sort()
        .join(',');
      usedPlayerCombos.add(playerIds);
      lineups.push(lineup);
      console.log(`[MultipleLineups] Generated lineup 1 using knapsack with ${lineup.total_projection.toFixed(1)} FP`);
    }
    
    // Try to generate additional lineups
    for (let i = lineups.length; i < count; i++) {
      if (i > 10) break; // Safety limit
      
      // Shuffle players for variety
      const shuffledPlayers = [...safePlayers].sort(() => Math.random() - 0.5);
      
      // Try different methods in order of preference
      let lineup: FantasyLineup | null = null;
      
      // Method 1: Backtrack (if we have time)
      if (i < 3) { // Only try backtrack for first few lineups
        lineup = generateLineupBacktrack(shuffledPlayers, positions, SALARY_CAP, strategy);
      }
      
      // Method 2: Simple fallback
      if (!lineup) {
        lineup = generateSimpleLineup(shuffledPlayers, positions, SALARY_CAP);
      }
      
      // Method 3: Mutate an existing lineup
      if (!lineup && lineups.length > 0) {
        const baseLineup = lineups[Math.floor(Math.random() * lineups.length)];
        const basePlayers = baseLineup.slots
          .filter(s => s.player)
          .map(s => s.player as Player2026);
        
        const mutated = mutateLineup(basePlayers, safePlayers, SALARY_CAP, sport);
        if (mutated) {
          lineup = mutated;
        }
      }
      
      if (lineup) {
        const playerIds = lineup.slots
          .filter(s => s.player)
          .map(s => s.player!.id)
          .sort()
          .join(',');
        
        if (!usedPlayerCombos.has(playerIds)) {
          usedPlayerCombos.add(playerIds);
          lineups.push(lineup);
          console.log(`[MultipleLineups] Generated lineup ${lineups.length} with ${lineup.total_projection.toFixed(1)} FP`);
        }
      } else {
        console.log(`[MultipleLineups] Could not generate lineup ${i + 1}`);
      }
    }

    return lineups;
  }, [generateLineup, generateLineupBacktrack, generateSimpleLineup, mutateLineup, teamsPlayingToday, isPlayerInjured]);

  const handleGenerateLineup = () => {
    // Check if data is ready and games exist
    if (!dataReady) {
      alert("Data is still loading. Please wait a moment and try again.");
      return;
    }
    if (teamsPlayingToday.size === 0) {
      alert("No games scheduled for today. Please check back later.");
      return;
    }
    
    console.log('[Generate] Generating optimal lineups...');
    const startTime = Date.now();
    
    let pool = ignoreFilters ? players : filteredPlayers;
    if (injuries.size > 0) {
      const beforeCount = pool.length;
      pool = pool.filter(p => !isPlayerInjured(p));
      console.log(`[Generate] After injury filter: ${pool.length} players (removed ${beforeCount - pool.length})`);
    }  
    
    if (pool.length === 0) {
      alert('No players available to generate lineups.');
      return;
    }

    if (teamsPlayingToday.size > 0) {
      const beforeCount = pool.length;
      pool = pool.filter(p => teamsPlayingToday.has(p.team));
      console.log(`[Generate] Filtered from ${beforeCount} to ${pool.length} players from today's games`);
      
      if (pool.length === 0) {
        alert('No players from today\'s games available. Please check back later.');
        return;
      }
    }

    console.log(`[Generate] Using ${pool.length} players with strategy: ${genStrategy}, target: ${genCount} lineups`);

    const lineups = generateMultipleLineups(pool, activeSport, genStrategy, genCount);
      
    if (lineups.length > 0) {
      setGeneratedLineups(lineups);
      setCurrentLineupIndex(0);
      setLineup(lineups[0]);
      logPromptPerformance('generate_lineup', lineups.length, Date.now() - startTime, 'generator');
      console.log(`[Generate] Success! Generated ${lineups.length} lineups in ${Date.now() - startTime}ms`);
    } else {
      alert('Could not generate any valid lineups with the current player pool.');
      console.log(`[Generate] Failed to generate any lineups in ${Date.now() - startTime}ms`);
    }
  };

  const handlePrevLineup = () => {
    if (currentLineupIndex > 0) {
      const newIndex = currentLineupIndex - 1;
      setCurrentLineupIndex(newIndex);
      setLineup(generatedLineups[newIndex]);
      console.log(`[LineupNav] Showing lineup ${newIndex + 1} of ${generatedLineups.length}`);
    }
  };

  const handleNextLineup = () => {
    if (currentLineupIndex < generatedLineups.length - 1) {
      const newIndex = currentLineupIndex + 1;
      setCurrentLineupIndex(newIndex);
      setLineup(generatedLineups[newIndex]);
      console.log(`[LineupNav] Showing lineup ${newIndex + 1} of ${generatedLineups.length}`);
    }
  };

  // ============= TEST DRAFT ENDPOINTS FUNCTION =============
  const testDraftEndpoint = useCallback(async () => {
    console.log('🧪 Testing draft endpoints...');
    const testPicks = [1, 12, 33, 50];
    
    for (const pick of testPicks) {
      const url = `${NODE_API_BASE}/api/draft/rankings?sport=nba&pick=${pick}&limit=3&strategy=balanced`;
      console.log(`Testing pick ${pick}:`, url);
      
      try {
        const response = await fetch(url);
        const text = await response.text();
        console.log(`Raw response for pick ${pick} (first 200 chars):`, text.substring(0, 200));
        
        try {
          const data = JSON.parse(text);
          console.log(`Result for pick ${pick}:`, {
            success: data.success,
            count: data.data?.length,
            firstPlayer: data.data?.[0]?.name,
            source: data.source
          });
        } catch (e) {
          console.error(`Failed to parse JSON for pick ${pick}:`, e);
        }
      } catch (error) {
        console.error(`Error for pick ${pick}:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🧪 Test complete');
  }, []);

  // ============= UPDATED SNAKE DRAFT HANDLER WITH INJURY FILTERING AND ADP ESTIMATION =============
  const handleSnakeDraft = useCallback(async (pickNumber: number, strategy: string = 'balanced') => {
    console.log(`[SNAKE DRAFT] Fetching for pick ${pickNumber}, strategy ${strategy}`);
    
    try {
      console.log(`[SNAKE DRAFT] Calling service for pick ${pickNumber}`);
      
      const data = await fetchDraftRankings('nba', pickNumber, strategy, 3);
      
      console.log(`[SNAKE DRAFT] Got ${data.data?.length || 0} players from service`);
      
      if (data.data && data.data.length > 0) {
        // Filter out injured players
        const filteredData = data.data.filter((item: any) => {
          // Check if player is injured based on injuryRisk or injury_status
          const isInjured = item.injuryRisk === 'Injured' || 
                            item.injuryRisk === 'Out' || 
                            item.injuryRisk === 'Questionable' ||
                            (item.injury_status && item.injury_status !== 'Healthy');
          
          // Also check against our injuries set
          const playerName = item.name;
          const isInInjuryList = injuries.has(playerName) || 
                                 injuries.has(`norm:${playerName?.replace(/[.\s'\-]/g, '').toLowerCase()}`);
          
          return !isInjured && !isInInjuryList;
        });
        
        console.log(`[SNAKE DRAFT] After injury filter: ${filteredData.length} of ${data.data.length} players remain`);
        
        if (filteredData.length === 0) {
          // If all are injured, get next available non-injured players
          console.log('[SNAKE DRAFT] All top players injured, fetching more...');
          const moreData = await fetchDraftRankings('nba', pickNumber, strategy, 10);
          if (moreData.data) {
            const moreFiltered = moreData.data.filter((item: any) => {
              const isInjured = item.injuryRisk === 'Injured' || item.injuryRisk === 'Out';
              const playerName = item.name;
              const isInInjuryList = injuries.has(playerName) || 
                                     injuries.has(`norm:${playerName?.replace(/[.\s'\-]/g, '').toLowerCase()}`);
              return !isInjured && !isInInjuryList;
            }).slice(0, 3);
            
            if (moreFiltered.length > 0) {
              filteredData.push(...moreFiltered);
            }
          }
        }
        
        if (filteredData.length > 0) {
          const formatted = filteredData.slice(0, 3).map((item: any, idx: number) => {
            // Calculate a reasonable ADP if it's 999
            let adpValue = item.adp;
            if (adpValue === 999 || adpValue > 500) {
              // Base ADP on pick number and value score
              // Higher value score = better player = lower ADP
              const baseADP = Math.max(1, Math.round(200 - (item.valueScore * 20)));
              // Add some randomness
              adpValue = Math.max(1, baseADP + Math.floor(Math.random() * 30 - 15));
            }
            
            return {
              player: {
                id: item.playerId || `player-${idx}`,
                name: item.name,
                team: item.team,
                position: item.position,
                salary: item.salary,
                projection: item.projectedPoints,
                value: item.valueScore,
                adp: adpValue,
                ceiling: item.ceiling,
                floor: item.floor,
                fantasy_points: item.projectedPoints,
                sport: 'NBA' as const,
                injury_status: item.injuryRisk || 'Healthy'
              },
              rank: idx + 1,
              valueScore: item.valueScore,
              reasoning: `Top ${strategy} player available at pick #${pickNumber}`,
              salaryFD: item.salary,
              salaryDK: item.salary,
              keyFactors: item.keyFactors || ['Projected volume', 'Matchup']
            };
          });
          
          setDraftResult({
            type: 'snake',
            pickNumber: pickNumber,
            players: formatted,
            analysis: `Top ${formatted.length} healthy players to target at pick ${pickNumber} using ${strategy} strategy.`
          });
          
          setDraftRecommendations(formatted.map(r => r.player));
          setDraftPick(pickNumber);
          setDraftStrategy(strategy);
          setShowDraftModal(true);
          console.log('[SNAKE DRAFT] Recommendations:', formatted);
        } else {
          console.log('[SNAKE DRAFT] No healthy players found');
        }
      } else {
        console.log('[SNAKE DRAFT] No data returned from service');
      }
    } catch (error) {
      console.error('[SNAKE DRAFT] Error:', error);
    }
  }, [injuries]);

  // ============= UPDATED TURN DRAFT HANDLER WITH INJURY FILTERING AND ADP ESTIMATION =============
  const handleTurnDraft = useCallback(async (pickNumber: number, strategy: string = 'balanced') => {
    console.log(`[TURN DRAFT] Fetching for pick ${pickNumber}, strategy ${strategy}`);
    
    try {
      console.log(`[TURN DRAFT] Calling service for pick ${pickNumber}`);
      
      const data = await fetchDraftRankings('nba', pickNumber, strategy, 10);
      
      console.log(`[TURN DRAFT] Got ${data.data?.length || 0} players from service`);
      
      if (data.data && data.data.length > 0) {
        // Filter out injured players
        const filteredData = data.data.filter((item: any) => {
          const isInjured = item.injuryRisk === 'Injured' || 
                            item.injuryRisk === 'Out' || 
                            item.injuryRisk === 'Questionable' ||
                            (item.injury_status && item.injury_status !== 'Healthy');
          
          const playerName = item.name;
          const isInInjuryList = injuries.has(playerName) || 
                                 injuries.has(`norm:${playerName?.replace(/[.\s'\-]/g, '').toLowerCase()}`);
          
          return !isInjured && !isInInjuryList;
        });
        
        console.log(`[TURN DRAFT] After injury filter: ${filteredData.length} of ${data.data.length} players remain`);
        
        if (filteredData.length > 0) {
          const formatted = filteredData.slice(0, 10).map((item: any, idx: number) => {
            // Calculate a reasonable ADP if it's 999
            let adpValue = item.adp;
            if (adpValue === 999 || adpValue > 500) {
              const baseADP = Math.max(1, Math.round(200 - (item.valueScore * 20)));
              adpValue = Math.max(1, baseADP + Math.floor(Math.random() * 30 - 15));
            }
            
            return {
              player: {
                id: item.playerId || `player-${idx}`,
                name: item.name,
                team: item.team,
                position: item.position,
                salary: item.salary,
                projection: item.projectedPoints,
                value: item.valueScore,
                adp: adpValue,
                expertRank: idx + 1,
                ceiling: item.ceiling,
                floor: item.floor,
                tier: item.tier || Math.floor(idx / 3) + 1,
                fantasy_points: item.projectedPoints,
                sport: 'NBA' as const,
                injury_status: item.injuryRisk || 'Healthy'
              },
              rank: idx + 1,
              valueScore: item.valueScore,
              adp: adpValue,
              expertRank: idx + 1,
              tier: item.tier || Math.floor(idx / 3) + 1,
              reasoning: `Pick #${pickNumber + idx} - ${strategy} strategy`,
              salaryFD: item.salary,
              salaryDK: item.salary,
              keyFactors: item.keyFactors || ['Projected volume', 'Matchup']
            };
          });
          
          setDraftResult({
            type: 'turn',
            pickNumber: pickNumber,
            players: formatted,
            analysis: `Top ${formatted.length} healthy players by value for turn ${pickNumber} using ${strategy} strategy.`
          });
          
          setDraftRecommendations(formatted.map(r => r.player));
          setDraftPick(pickNumber);
          setDraftStrategy(strategy);
          setDraftMode('turn');
          setShowDraftModal(true);
          console.log('[TURN DRAFT] Recommendations:', formatted);
        } else {
          console.log('[TURN DRAFT] No healthy players found');
        }
      } else {
        console.log('[TURN DRAFT] No data returned from service');
      }
    } catch (error) {
      console.error('[TURN DRAFT] Error:', error);
    }
  }, [injuries]);

  // ============= DRAFT COMMAND HANDLER =============
  const handleDraftCommand = useCallback(async (commandString: string) => {
    console.log(`[DRAFT] Command: ${commandString}`);
    
    const parts = commandString.trim().split(' ');
    const command = parts[0].toLowerCase();
    const pickNumber = parts.length > 1 ? parseInt(parts[1], 10) : undefined;
    
    console.log(`[DRAFT] Parsed - command: ${command}, pick: ${pickNumber}`);
    
    if (command === 'snake') {
      setDraftMode('snake');
      const validPick = pickNumber || 1;
      console.log(`[DRAFT] Calling snake draft with pick ${validPick}`);
      await handleSnakeDraft(validPick, draftStrategy);
    } 
    else if (command === 'turn') {
      setDraftMode('turn');
      const validPick = pickNumber || 1;
      console.log(`[DRAFT] Calling turn draft with pick ${validPick}`);
      await handleTurnDraft(validPick, draftStrategy);
    }
    else if (command === 'next' || command === 'skip') {
      const nextPick = (draftPick || 1) + 1;
      setDraftPick(nextPick);
      
      if (draftMode === 'snake') {
        await handleSnakeDraft(nextPick, draftStrategy);
      } else {
        await handleTurnDraft(nextPick, draftStrategy);
      }
    } 
    else if (command === 'previous' || command === 'back') {
      const prevPick = Math.max((draftPick || 1) - 1, 1);
      setDraftPick(prevPick);
      
      if (draftMode === 'snake') {
        await handleSnakeDraft(prevPick, draftStrategy);
      } else {
        await handleTurnDraft(prevPick, draftStrategy);
      }
    }
    else {
      console.log(`[DRAFT] Unknown command: ${command}`);
    }
  }, [draftPick, draftMode, draftStrategy, handleSnakeDraft, handleTurnDraft]);

  // ============= AI NATURAL LANGUAGE LINEUP GENERATOR =============
  const filterPlayersByIntent = (pool: Player2026[], intent: QueryIntent): Player2026[] => {
    let filtered = [...pool];

    if (intent.team) {
      const teamLower = intent.team.toLowerCase();
      filtered = filtered.filter(p => p.team.toLowerCase().includes(teamLower));
      console.log(`[AI] Filtered by team "${intent.team}": ${filtered.length} players`);
    }

    if (intent.player) {
      const playerLower = intent.player.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(playerLower));
      console.log(`[AI] Filtered by player "${intent.player}": ${filtered.length} players`);
    }

    if (intent.keywords.includes('rookie')) {
      filtered = filtered.filter(p => p.is_rookie);
      console.log(`[AI] Filtered by rookie status: ${filtered.length} players`);
    }

    return filtered;
  };

  const determineStrategyFromQuery = (query: string): 'value' | 'projection' | 'balanced' => {
    const lower = query.toLowerCase();
    if (lower.includes('value') || lower.includes('bargain') || lower.includes('cheap')) return 'value';
    if (lower.includes('projection') || lower.includes('high score') || lower.includes('best') || lower.includes('top')) return 'projection';
    return 'balanced';
  };

  const filterPlayersByQuery = (pool: Player2026[], query: string): Player2026[] => {
    const lower = query.toLowerCase();
    let filtered = pool;

    const teamMap: Record<string, string[]> = {
      lakers: ['LAL'],
      warriors: ['GSW'],
      celtics: ['BOS'],
      bucks: ['MIL'],
      suns: ['PHX'],
      nuggets: ['DEN'],
      sixers: ['PHI'],
      '76ers': ['PHI'],
      mavericks: ['DAL'],
      mavs: ['DAL'],
      clippers: ['LAC'],
      heat: ['MIA'],
      bulls: ['CHI'],
      hawks: ['ATL'],
    };
    for (const [key, codes] of Object.entries(teamMap)) {
      if (lower.includes(key)) {
        filtered = filtered.filter(p => codes.includes(p.team));
      }
    }

    if (lower.includes('point guard') || lower.includes('pg')) {
      filtered = filtered.filter(p => p.position === 'PG');
    }
    if (lower.includes('shooting guard') || lower.includes('sg')) {
      filtered = filtered.filter(p => p.position === 'SG');
    }
    if (lower.includes('small forward') || lower.includes('sf')) {
      filtered = filtered.filter(p => p.position === 'SF');
    }
    if (lower.includes('power forward') || lower.includes('pf')) {
      filtered = filtered.filter(p => p.position === 'PF');
    }
    if (lower.includes('center') || lower.includes('c')) {
      filtered = filtered.filter(p => p.position === 'C');
    }

    if (lower.includes('rookie') || lower.includes('rookies')) {
      filtered = filtered.filter(p => p.is_rookie === true);
    }

    return filtered;
  };

  const handleGenerateFantasyLineup = useCallback(async () => {
    if (!customQuery.trim()) {
      alert('Please enter a lineup prompt');
      return;
    }
    setGeneratingLineup(true);
    setShowGeneratorModal(true);

    try {
      const intent = preprocessQuery(customQuery);
      console.log('[AI Generator] Intent:', intent);

      // Use filteredPlayers as the base (already filtered by slate and injury)
      let pool = filterPlayersByIntent(filteredPlayers, intent) || filterPlayersByQuery(filteredPlayers, customQuery);
      if (injuries.size > 0 || pool.some(p => p.injury_status && p.injury_status !== 'Healthy')) {
        const beforeCount = pool.length;
        pool = pool.filter(p => !isPlayerInjured(p));
        console.log(`[AI Generator] After injury filter: ${pool.length} players (removed ${beforeCount - pool.length})`);
      }

      if (pool.length === 0) {
        setLineupResult({
          success: false,
          analysis: `No players match your query: "${customQuery}". Try different keywords.`,
        });
      } else {
        if (teamsPlayingToday.size > 0) {
          const beforeCount = pool.length;
          pool = pool.filter(p => teamsPlayingToday.has(p.team));
          if (pool.length === 0) {
            setLineupResult({
              success: false,
              analysis: `Your query matched players, but none are playing today. Try a different prompt.`,
            });
            setGeneratingLineup(false);
            return;
          }
          console.log(`[AI Generator] Filtered to ${pool.length} players from today's games (from ${beforeCount})`);
        }

        const strategy = determineStrategyFromQuery(customQuery);
        const lineups = generateMultipleLineups(pool, activeSport, strategy, 1);
        if (lineups.length > 0) {
          const newLineup = lineups[0]; 
          setLineup(newLineup);
          setLineupResult({
            success: true, 
            analysis: `🎯 Lineup generated based on your query using ${strategy} strategy.`,
            lineup: newLineup,
            source: 'AI Generator',
          });
          logPromptPerformance(customQuery, 1, 1.0, 'generator');
        } else {
          setLineupResult({
            success: false,
            analysis: 'Could not generate a valid lineup with the current player pool.',
          });
        }
      }
    } catch (error) {
      console.error('[AI Generator] Error:', error);
      setLineupResult({  
        success: false,
        analysis: 'An error occurred while generating. Please try again.',
      });
    } finally {
      setGeneratingLineup(false);
    }
  }, [filteredPlayers, customQuery, activeSport, teamsPlayingToday, generateMultipleLineups, injuries, isPlayerInjured]);

  // ============= SHARE DRAFT HANDLER =============
  const handleShareDraft = () => {
    if (!draftResult) {
      alert('No draft result to share');
      return;
    }
    
    const shareText = `${draftResult.type === 'snake' ? '🐍 Snake' : '🔄 Turn'} Draft at Pick ${draftResult.pickNumber}\n\n` +
      `Top Picks:\n` +
      draftResult.players.slice(0, 3).map((p, i) => 
        `${i+1}. ${p.player.name} (${p.player.team} - ${p.player.position}) - Value: ${p.valueScore.toFixed(2)}`
      ).join('\n') +
      `\n\nShared from FantasyHub '26`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Fantasy Draft Results',
        text: shareText,
      }).catch(() => {
        copyToClipboard(shareText);
      });
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Draft results copied to clipboard!');
    }).catch(() => {
      alert('Could not copy to clipboard. Here are your results:\n\n' + text);
    });
  };

  const togglePosition = (position: string) => {
    setSelectedPositions(prev =>
      prev.includes(position) ? prev.filter(p => p !== position) : [...prev, position]
    );
  };
  
  const toggleTeam = (team: string) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const fetchDepthChart = async (teamAbv: string) => {
    try {
      const res = await fetch(`${NODE_API_BASE}/api/tank01/depthchart?team=${teamAbv}&sport=${activeSport}`);
      const data = await res.json();
      if (data.success) {
        setDepthChartData(data.data || []);
        setSelectedTeamForDepth(teamAbv);
        setDepthChartOpen(true);
      } else {
        alert('No depth chart available for this team');
      }
    } catch (e) {
      console.error('Depth chart error', e);
      alert('Failed to load depth chart');
    }
  };

  // ============= FILTER FUNCTIONS FOR PROPS SECTION =============
  const getFilteredPropsPlayers = (): Player2026[] => {
    const basePlayers = slatePlayers.length > 0 ? slatePlayers : players;
    
    return basePlayers.filter(p => {
      if (teamsPlayingToday.size > 0 && !teamsPlayingToday.has(p.team)) {
        return false;
      }
      
      if (propsSearch && !p.name.toLowerCase().includes(propsSearch.toLowerCase()) &&
          !p.team.toLowerCase().includes(propsSearch.toLowerCase())) {
        return false;
      }
      if (propsTeams.length > 0 && !propsTeams.includes(p.team)) return false;
      if (propsPositions.length > 0 && !propsPositions.includes(p.position)) return false;
      if (p.salary < propsMinSalary || p.salary > propsMaxSalary) return false;
      if (p.projection < propsMinProjection || p.projection > propsMaxProjection) return false;
      return true;
    });
  };

  const resetPropsFilters = () => {
    setPropsSearch('');
    setPropsTeams([]);
    setPropsPositions([]);
    
    const sourcePlayers = slatePlayers.length > 0 ? slatePlayers : players;
    const salaries = sourcePlayers.map(p => p.salary).filter(Boolean);
    const projections = sourcePlayers.map(p => p.projection).filter(Boolean);
    
    setPropsMinSalary(salaries.length ? Math.min(...salaries) : 3000);
    setPropsMaxSalary(salaries.length ? Math.max(...salaries) : 15000);
    setPropsMinProjection(projections.length ? Math.min(...projections) : 0);
    setPropsMaxProjection(projections.length ? Math.max(...projections) : 60);
  };

  // ============= RENDER FUNCTIONS =============
  const renderSportSelector = () => (
    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Fantasy Hub '26</Typography>
        <Chip label="Mar 2026" size="small" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
        {sports.map((sport) => {
          const IconComponent = sport.iconComponent;
          return (
            <Button
              key={sport.id}
              variant={selectedSportTab === sport.id ? 'contained' : 'outlined'}
              onClick={() => handleSportChange(sport.id as Sport)}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100, py: 1.5 }}
            >
              <IconComponent sx={{ fontSize: 24, mb: 0.5 }} />
              <Typography variant="subtitle2">{sport.name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{sport.status}</Typography>
            </Button>
          );
        })}
      </Box>
    </Paper>
  );

  const renderNewsTicker = () => (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'white', borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <span>📰 Latest NBA News</span>
      </Typography>
      {loadingNews ? (
        <CircularProgress size={20} sx={{ color: 'white' }} />
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 1 }}>
          {newsItems.length > 0 ? newsItems.map((item, idx) => (
            <Chip
              key={idx}
              label={item.title}
              onClick={() => window.open(item.link, '_blank')}
              sx={{ bgcolor: 'white', color: 'info.main', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
            />
          )) : (
            <Typography variant="body2" sx={{ color: 'white' }}>No recent news</Typography>
          )}
        </Box>
      )}
    </Paper>
  );

  const renderLineupGenerator = () => (
    <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <RocketLaunchIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
        <Typography variant="h4">🚀 AI Lineup Generator</Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" paragraph>
        Describe the lineup you want – e.g., “best value Lakers + Celtics”, “stack Warriors”, “rookie heavy team”
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quick Prompts</Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {[
            "Best value lineup",
            "Highest projection lineup",
            "Balanced team",
            "Stack Lakers players",
            "Rookies only"
          ].map((prompt, index) => (
            <Chip
              key={index}
              label={prompt}
              onClick={() => setCustomQuery(prompt)}
              icon={<SparklesIcon />}
              sx={{ 
                backgroundColor: 'primary.light',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.main' }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Draft Command Chips with Strategy Dropdown */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Draft Commands</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Strategy</InputLabel>
            <Select
              value={draftStrategy}
              label="Strategy"
              onChange={(e) => setDraftStrategy(e.target.value)}
            >
              <MenuItem value="balanced">Balanced</MenuItem>
              <MenuItem value="value">Value</MenuItem>
              <MenuItem value="projection">Projection</MenuItem>
              <MenuItem value="ceiling">Ceiling</MenuItem>
            </Select>
          </FormControl>

          <Chip
            label="Snake 12"
            onClick={() => handleDraftCommand('Snake 12')}
            icon={<SportsBasketballIcon />}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label="Snake 33"
            onClick={() => handleDraftCommand('Snake 33')}
            icon={<SportsBasketballIcon />}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label="Turn 12"
            onClick={() => handleDraftCommand('Turn 12')}
            icon={<SportsBasketballIcon />}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label="Turn 33"
            onClick={() => handleDraftCommand('Turn 33')}
            icon={<SportsBasketballIcon />}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label="Next Pick"
            onClick={() => handleDraftCommand('next')}
            icon={<SportsBasketballIcon />}
            color="primary"
            variant="outlined"
          />
          <Chip
            label="Previous Pick"
            onClick={() => handleDraftCommand('previous')}
            icon={<SportsBasketballIcon />}
            color="primary"
            variant="outlined"
          />

          <Autocomplete
            freeSolo
            size="small"
            options={['Snake 1', 'Snake 12', 'Snake 33', 'Turn 1', 'Turn 12', 'Turn 33', 'next', 'previous']}
            sx={{ width: 200 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Draft command"
                variant="outlined"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    handleDraftCommand(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            )}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Custom Prompt</Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="e.g., Build a lineup with Suns and Bucks players, prioritize value. You can also type 'Snake 33' here."
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<AutoAwesomeIcon />}
          onClick={handleGenerateFantasyLineup}
          disabled={!customQuery.trim() || generatingLineup || !dataReady}
        >
          {generatingLineup ? 'Generating...' : 'Generate AI Lineup'}
        </Button>
      </Box>

      <Alert severity="info" icon={<PsychologyIcon />} sx={{ mt: 2 }}>
        Uses natural language understanding to create lineups based on your description. Draft commands work here and in the search bar.
      </Alert>
    </Paper>
  );

  const renderTodaysGames = () => (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>📅 Today's Games</Typography>
      {todaysGames.length > 0 ? (
        <Grid container spacing={2}>
          {todaysGames.map((game, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{game.away} @ {game.home}</Typography>
                  <Typography variant="caption" color="text.secondary">{game.gameTime} ET</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary">No games scheduled for today.</Typography>
      )}
    </Paper>
  );

  const renderPropsFilterBar = () => {
    const allTeamsList = allTeams;
    const allPositionsList = allPositions;
    const propsFilteredCount = getFilteredPropsPlayers().length;
    const totalSlateCount = slatePlayers.length || players.length;

    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon fontSize="small" /> Filter Player Props
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={`${propsFilteredCount} of ${totalSlateCount} players on slate`} 
              color="primary" 
              variant="outlined" 
              size="small"
            />
            <IconButton onClick={() => setPropsFiltersExpanded(!propsFiltersExpanded)} size="small">
              {propsFiltersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        <Collapse in={propsFiltersExpanded}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or team"
                value={propsSearch}
                onChange={(e) => setPropsSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  endAdornment: propsSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setPropsSearch('')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Teams</InputLabel>
                <Select
                  multiple
                  value={propsTeams}
                  onChange={(e) => setPropsTeams(e.target.value as string[])}
                  label="Teams"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {allTeamsList.map(team => (
                    <MenuItem key={team} value={team}>
                      <Checkbox checked={propsTeams.indexOf(team) > -1} size="small" />
                      <ListItemText primary={team} />
                      <IconButton size="small" onClick={() => fetchDepthChart(team)} sx={{ ml: 1 }}>
                        <SportsBasketballIcon fontSize="small" />
                      </IconButton>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Positions</InputLabel>
                <Select
                  multiple
                  value={propsPositions}
                  onChange={(e) => setPropsPositions(e.target.value as string[])}
                  label="Positions"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {allPositionsList.map(pos => (
                    <MenuItem key={pos} value={pos}>
                      <Checkbox checked={propsPositions.indexOf(pos) > -1} size="small" />
                      <ListItemText primary={pos} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom variant="caption">Salary Range</Typography>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={[propsMinSalary, propsMaxSalary]}
                  onChange={(e, val) => {
                    setPropsMinSalary((val as number[])[0]);
                    setPropsMaxSalary((val as number[])[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={salaryRange[0]}
                  max={salaryRange[1]}
                  step={100}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">${propsMinSalary}</Typography>
                  <Typography variant="caption">${propsMaxSalary}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom variant="caption">Projection Range</Typography>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={[propsMinProjection, propsMaxProjection]}
                  onChange={(e, val) => {
                    setPropsMinProjection((val as number[])[0]);
                    setPropsMaxProjection((val as number[])[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={projectionRange[0]}
                  max={projectionRange[1]}
                  step={0.5}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">{propsMinProjection.toFixed(1)}</Typography>
                  <Typography variant="caption">{propsMaxProjection.toFixed(1)}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button size="small" onClick={resetPropsFilters}>Reset</Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
    );
  };

  const FilteredPlayerProps = ({ 
    players, 
    onAddToLineup 
  }: { 
    players: Player2026[]; 
    onAddToLineup: (player: Player) => void;
  }) => {
    if (players.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">No players match the current filters</Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {players.slice(0, 6).map((player) => (
          <Grid item xs={12} sm={6} md={4} key={player.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{player.name}</Typography>
                  <Chip label={`$${player.salary}`} size="small" color="primary" />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {player.team} • {player.position}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 1 }}>
                  <Typography variant="caption">Proj: {player.projection.toFixed(1)} FP</Typography>
                  <Typography variant="caption">Value: {player.value.toFixed(2)}</Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  fullWidth 
                  onClick={() => onAddToLineup({
                    id: player.id,
                    name: player.name,
                    team: player.team,
                    position: player.position,
                    salary: player.salary,
                    fantasy_projection: player.projection,
                    points: player.points,
                    assists: player.assists,
                    rebounds: player.rebounds,
                    goals: player.goals
                  })}
                >
                  Add to Lineup
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // ============= RENDER PLAYER PROPS TABLE =============
  const renderPlayerPropsTable = () => {
    if (loadingProps) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (propsError) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>{propsError}</Alert>
      );
    }
    if (!playerProps || playerProps.length === 0) {
      return (
        <Alert severity="info">No player props available at this time.</Alert>
      );
    }

    console.log('[Props] First 3 raw props:', playerProps.slice(0, 3));

    const uniqueProps = new Map();
    playerProps.forEach(prop => {
      const key = `${prop.player}-${prop.prop_type || prop.stat || prop.stat_type}-${prop.line}`;
      const existing = uniqueProps.get(key);
      const edge = prop.edge !== undefined ? parseFloat(prop.edge) :
                   (prop.projection && prop.line) ? ((prop.projection - prop.line) / prop.line) * 100 : 0;
      if (!existing || edge > (existing._edge || 0)) {
        prop._edge = edge;
        uniqueProps.set(key, prop);
      }
    });
    const dedupedProps = Array.from(uniqueProps.values());
    console.log(`[Props] Deduplicated from ${playerProps.length} to ${dedupedProps.length} unique props`);

    const getPlayerTeam = (playerName: string): string => {
      const normalize = (name: string) => 
        name.replace(/[.\s'\-]/g, '').toLowerCase();
      
      const normalizedPropName = normalize(playerName);
      
      let found = players.find(p => normalize(p.name) === normalizedPropName);
      
      if (!found) {
        const propLastName = playerName.split(' ').pop()?.toLowerCase() || '';
        found = players.find(p => {
          const playerLastName = p.name.split(' ').pop()?.toLowerCase() || '';
          return playerLastName === propLastName && p.team;
        });
      }
      
      return found?.team || '??';
    };

    const statTypes = [...new Set(dedupedProps.map(p => p.prop_type || p.stat || p.stat_type).filter(Boolean))];
    const bookmakers = [...new Set(dedupedProps.map(p => p.bookmaker).filter(Boolean))];

    const filteredProps = dedupedProps.filter(prop => {
      if (propsStatFilter !== 'all' && (prop.prop_type || p.stat || p.stat_type) !== propsStatFilter) return false;
      const edge = prop.edge !== undefined ? parseFloat(prop.edge) :
                   (prop.projection && prop.line) ? ((prop.projection - prop.line) / prop.line) * 100 : 0;
      if (edge < propsMinEdge || edge > propsMaxEdge) return false;
      if (prop.projection < propsMinProjection || prop.projection > propsMaxProjection) return false;
      if (propsBookmakerFilter !== 'all' && prop.bookmaker !== propsBookmakerFilter) return false;
      return true;
    });

    return (
      <Box>
        {/* Filter Bar Toggle */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon fontSize="small" /> Filter Props
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`${filteredProps.length} of ${dedupedProps.length} props`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <IconButton onClick={() => setShowPropsFilters(!showPropsFilters)} size="small">
                {showPropsFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>
          <Collapse in={showPropsFilters}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Stat Type Filter */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stat Type</InputLabel>
                  <Select
                    value={propsStatFilter}
                    label="Stat Type"
                    onChange={(e) => setPropsStatFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {statTypes.map(stat => (
                      <MenuItem key={stat} value={stat}>{stat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* Bookmaker Filter */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bookmaker</InputLabel>
                  <Select
                    value={propsBookmakerFilter}
                    label="Bookmaker"
                    onChange={(e) => setPropsBookmakerFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {bookmakers.map(bm => (
                      <MenuItem key={bm} value={bm}>{bm}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* Edge Range */}
              <Grid item xs={12} md={3}>
                <Typography gutterBottom variant="caption">Edge %</Typography>
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={[propsMinEdge, propsMaxEdge]}
                    onChange={(e, val) => {
                      setPropsMinEdge((val as number[])[0]);
                      setPropsMaxEdge((val as number[])[1]);
                    }}
                    valueLabelDisplay="auto"
                    min={-100}
                    max={100}
                    step={1}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">{propsMinEdge}%</Typography>
                    <Typography variant="caption">{propsMaxEdge}%</Typography>
                  </Box>
                </Box>
              </Grid>
              {/* Projection Range */}
              <Grid item xs={12} md={3}>
                <Typography gutterBottom variant="caption">Projection</Typography>
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={[propsMinProjection, propsMaxProjection]}
                    onChange={(e, val) => {
                      setPropsMinProjection((val as number[])[0]);
                      setPropsMaxProjection((val as number[])[1]);
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">{propsMinProjection.toFixed(1)}</Typography>
                    <Typography variant="caption">{propsMaxProjection.toFixed(1)}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Props Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Stat Type</TableCell>
                <TableCell align="right">Line</TableCell>
                <TableCell align="right">Projection</TableCell>
                <TableCell align="right">Edge %</TableCell>
                <TableCell>Bookmaker</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProps.slice(0, 100).map((prop, idx) => {
                const edgeValue = prop.edge !== undefined ? parseFloat(prop.edge) :
                                  (prop.projection && prop.line) ? ((prop.projection - prop.line) / prop.line) * 100 : 0;
                const edgeDisplay = edgeValue.toFixed(1);
                let color: 'success' | 'error' | 'default' = 'default';
                if (edgeValue > 5) color = 'success';
                else if (edgeValue < -5) color = 'error';

                return (
                  <TableRow key={idx} hover>
                    <TableCell>{prop.player}</TableCell>
                    <TableCell>{getPlayerTeam(prop.player)}</TableCell>
                    <TableCell>{prop.prop_type || prop.stat || prop.stat_type || 'N/A'}</TableCell>
                    <TableCell align="right">{prop.line}</TableCell>
                    <TableCell align="right">{prop.projection?.toFixed(1)}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${edgeDisplay}%`}
                        size="small"
                        color={color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{prop.bookmaker}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderOddsSection = () => (
    <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MonetizationOnIcon /> Game Odds
        </Typography>
        <IconButton onClick={() => setOddsExpanded(!oddsExpanded)}>
          {oddsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={oddsExpanded}>
        <Alert severity="info">Game odds coming soon.</Alert>
      </Collapse>
    </Paper>
  );

  // ============= EARLY RETURNS =============
  if (loading || (isLoadingPlayers && players.length === 0)) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
            Loading 2026 season data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error && players.length === 0) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={() => fetchPlayers()}>Retry</Button>
        }>
          Error loading players: {error}
        </Alert>
      </Container>
    );
  }

  // ============= MAIN RENDER =============
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {renderSportSelector()}
      {renderNewsTicker()}
      
      {/* Main Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={mainTab}
          onChange={(_, newValue) => setMainTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<LineupIcon />} label="Lineup Builder" />
          <Tab icon={<PlayersIcon />} label="Player Props" />
          <Tab icon={<DraftIcon />} label="Draft Center" />
          <Tab icon={<MonetizationOnIcon />} label="Odds" />
          <Tab icon={<SportsBasketballIcon />} label="NBA Props" />
          <Tab icon={<AssessmentIcon />} label="Projections" />
        </Tabs>
      </Paper>

      {/* Tab 0: Lineup Builder */}
      {mainTab === 0 && (
        <>
          {renderLineupGenerator()}
          <ErrorBoundary componentName="FantasyHubDashboard">
            <Box sx={{ mb: 4 }}>
              <FantasyHubDashboard 
                sport={activeSport} 
                lineup={lineup} 
                onAddPlayer={handleAddPlayer}
                onRemovePlayer={handleRemovePlayer}
                onClearLineup={handleClearLineup}
                allPlayers={players}
              />
            </Box>
          </ErrorBoundary>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      📋 Your {activeSport === 'nba' ? 'NBA' : 'NHL'} Lineup
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      9-player lineup · ${SALARY_CAP.toLocaleString()} cap
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => setLineupExpanded(!lineupExpanded)}>
                      {lineupExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Button variant="outlined" size="small" onClick={() => setShowLineupHistory(!showLineupHistory)}>
                      History
                    </Button>
                    <Button variant="contained" size="small" onClick={handleSaveLineup}>
                      Save
                    </Button>
                  </Box>
                </Box>
                <Collapse in={lineupExpanded}>
                  <Box sx={{ mt: 2 }}>
                    <ErrorBoundary componentName="FantasyLineupBuilder">
                      <FantasyLineupBuilder 
                        lineup={lineup}
                        onRemovePlayer={handleRemovePlayer}
                        onClearLineup={handleClearLineup}
                        allPlayers={players}
                      />
                    </ErrorBoundary>
                  </Box>
                </Collapse>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              {showLineupHistory && (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Saved Lineups</Typography>
                    <IconButton size="small" onClick={() => setShowLineupHistory(false)}><ClearIcon /></IconButton>
                  </Box>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {Object.entries(savedLineups).length > 0 ? (
                      Object.entries(savedLineups).map(([id, saved]) => (
                        <Paper
                          key={id}
                          elevation={0}
                          sx={{ p: 2, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                          onClick={() => handleLoadLineup(id)}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(saved.updated_at).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Chip label={`$${saved.total_salary.toLocaleString()}`} size="small" variant="outlined" />
                            <Chip label={`${saved.total_projection.toFixed(1)} FP`} size="small" color="primary" />
                          </Box>
                        </Paper>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No saved lineups yet
                      </Typography>
                    )}
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        </>
      )}

      {/* Tab 1: Player Props */}
      {mainTab === 1 && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>🏀 Player Props</Typography>
            {renderPlayerPropsTable()}
          </Paper>
          {renderTodaysGames()}
        </>
      )}

      {/* Tab 2: Draft Center */}
      {mainTab === 2 && (
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Draft Center</Typography>
          
          {/* Test Button */}
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={testDraftEndpoint}
              startIcon={<BugReportIcon />}
              sx={{ mr: 2 }}
            >
              🧪 Test Draft Endpoints
            </Button>
          </Box>
          
          <Typography variant="body1" paragraph>
            Use the draft commands above or enter a command in the search bar (e.g., "Snake 12", "Turn 33").
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Chip
              label="Snake 12"
              onClick={() => handleDraftCommand('Snake 12')}
              icon={<SportsBasketballIcon />}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label="Snake 33"
              onClick={() => handleDraftCommand('Snake 33')}
              icon={<SportsBasketballIcon />}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label="Turn 12"
              onClick={() => handleDraftCommand('Turn 12')}
              icon={<SportsBasketballIcon />}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label="Turn 33"
              onClick={() => handleDraftCommand('Turn 33')}
              icon={<SportsBasketballIcon />}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label="Next Pick"
              onClick={() => handleDraftCommand('next')}
              icon={<SportsBasketballIcon />}
              color="primary"
              variant="outlined"
            />
            <Chip
              label="Previous Pick"
              onClick={() => handleDraftCommand('previous')}
              icon={<SportsBasketballIcon />}
              color="primary"
              variant="outlined"
            />
          </Box>
          <FormControl size="small" sx={{ minWidth: 200, mb: 3 }}>
            <InputLabel>Strategy</InputLabel>
            <Select
              value={draftStrategy}
              label="Strategy"
              onChange={(e) => setDraftStrategy(e.target.value)}
            >
              <MenuItem value="balanced">Balanced</MenuItem>
              <MenuItem value="value">Value</MenuItem>
              <MenuItem value="projection">Projection</MenuItem>
              <MenuItem value="ceiling">Ceiling</MenuItem>
            </Select>
          </FormControl>
          {savedDrafts.length > 0 && (
            <Box>
              <Typography variant="h6">Past Drafts</Typography>
              <List>
                {savedDrafts.map((draft, idx) => (
                  <ListItem key={idx}>
                    <ListItemText
                      primary={`${draft.type} draft at pick ${draft.pickNumber}`}
                      secondary={draft.analysis}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      )}

      {/* Tab 3: Odds */}
      {mainTab === 3 && renderOddsSection()}

      {/* Tab 4: NBA Props (Card View) */}
      {mainTab === 4 && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>🏀 NBA Player Props (Card View)</Typography>
            <Box sx={{ mb: 3 }}>
              <NBAPropsFilterBar 
                onFilterChange={(filters) => {
                  setNbaPropsFilters(filters);
                  console.log('NBA props filters:', filters);
                }}
              />
            </Box>
            <NBAProps onAddToLineup={handleAddPlayer} allPlayers={players} />
          </Paper>
          {renderTodaysGames()}
        </>
      )}

      {/* Tab 5: Projections */}
      {mainTab === 5 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>📊 Top 100 Player Projections (Tonight)</Typography>
          {slatePlayers.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No games scheduled for today. Check back later!
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Player</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell align="right">Points</TableCell>
                    <TableCell align="right">Rebounds</TableCell>
                    <TableCell align="right">Assists</TableCell>
                    <TableCell align="right">Fantasy Pts</TableCell>
                    <TableCell align="right">Salary</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {slatePlayers
                    .sort((a, b) => (b.projection || 0) - (a.projection || 0))
                    .slice(0, 100)
                    .map((player, idx) => (
                      <TableRow key={player.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{player.name}</TableCell>
                        <TableCell>{player.team}</TableCell>
                        <TableCell align="right">{player.points?.toFixed(1) || '-'}</TableCell>
                        <TableCell align="right">{player.rebounds?.toFixed(1) || '-'}</TableCell>
                        <TableCell align="right">{player.assists?.toFixed(1) || '-'}</TableCell>
                        <TableCell align="right">{player.projection?.toFixed(1)}</TableCell>
                        <TableCell align="right">${player.salary?.toLocaleString()}</TableCell>
                        <TableCell align="right">{player.value?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Draft Results Modal */}
      <Dialog open={showDraftModal} onClose={() => setShowDraftModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', color: 'white' }}>
          {draftResult?.type === 'snake' ? '🐍 Snake Draft' : '🔄 Turn Draft'} - Pick {draftResult?.pickNumber}
          {draftResult && <Chip label={`Strategy: ${draftStrategy}`} size="small" sx={{ ml: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {draftResult && (
            <>
              <Typography variant="body1" paragraph>{draftResult.analysis}</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Player</TableCell>
                      <TableCell>Team/Pos</TableCell>
                      <TableCell align="right">FD Salary</TableCell>
                      <TableCell align="right">DK Salary</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">ADP</TableCell>
                      <TableCell align="right">Expert Rank</TableCell>
                      <TableCell align="right">Ceil/Floor</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {draftResult.players.map((item, idx) => {
                      return (
                        <TableRow key={idx}>
                          <TableCell>{item.rank}</TableCell>
                          <TableCell>{item.player.name}</TableCell>
                          <TableCell>{item.player.team} • {item.player.position}</TableCell>
                          <TableCell align="right">${item.salaryFD}</TableCell>
                          <TableCell align="right">${item.salaryDK}</TableCell>
                          <TableCell align="right">{item.valueScore.toFixed(2)}</TableCell>
                          <TableCell align="right">{item.player.adp ? item.player.adp.toFixed(1) : '-'}</TableCell>
                          <TableCell align="right">{item.player.expertRank || '-'}</TableCell>
                          <TableCell align="right">{item.player.ceiling?.toFixed(1)}/{item.player.floor?.toFixed(1)}</TableCell>
                          <TableCell>
                            <Chip label={item.reasoning} size="small" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {draftResult.players[0]?.keyFactors.map((factor, i) => (
                  <Chip key={i} label={factor} size="small" variant="outlined" />
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShareDraft} startIcon={<ShareIcon />}>Share</Button>
          <Button onClick={() => setShowDraftModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={depthChartOpen} onClose={() => setDepthChartOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Depth Chart - {selectedTeamForDepth}</DialogTitle>
        <DialogContent>
          {depthChartData.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Position</TableCell>
                    <TableCell>Player</TableCell>
                    <TableCell>Depth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {depthChartData.map((entry, idx) => (
                    entry.players.map((player, pidx) => (
                      <TableRow key={`${idx}-${pidx}`}>
                        {pidx === 0 && <TableCell rowSpan={entry.players.length}>{entry.position}</TableCell>}
                        <TableCell>{player.name}</TableCell>
                        <TableCell>{player.depth}</TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No depth chart data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepthChartOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showGeneratorModal} onClose={() => !generatingLineup && setShowGeneratorModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{generatingLineup ? 'Generating AI Lineup...' : 'AI Lineup Generated'}</DialogTitle>
        <DialogContent>
          {generatingLineup ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>Analyzing your request...</Typography>
              <Typography variant="body2" color="text.secondary">Building the optimal lineup based on your description</Typography>
            </Box>
          ) : (
            lineupResult && (
              <Box>
                {lineupResult.success ? (
                  <>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{lineupResult.analysis}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>Generated Lineup:</Typography>
                    <List>
                      {lineupResult.lineup?.slots.filter((slot: LineupSlot) => slot.player).map((slot: LineupSlot, idx: number) => (
                        <ListItem key={idx} sx={{ bgcolor: 'action.hover', mb: 1, borderRadius: 1 }}>
                          <ListItemText
                            primary={`${slot.player?.name} (${slot.position})`}
                            secondary={`$${slot.player?.salary?.toLocaleString()} · ${slot.player?.fantasy_projection?.toFixed(1)} FP`}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Typography variant="caption" color="text.secondary">Source: {lineupResult.source}</Typography>
                  </>
                ) : (
                  <Alert severity="warning">{lineupResult.analysis}</Alert>
                )}
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions>
          {!generatingLineup && lineupResult?.success && (
            <Button 
              onClick={() => {
                if (lineupResult?.lineup) setLineup(lineupResult.lineup);
                setShowGeneratorModal(false);
              }} 
              variant="contained" 
              color="primary"
            >
              Use This Lineup
            </Button>
          )}
          <Button onClick={() => setShowGeneratorModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Enhanced PlayerCard with ADP, injury chip, and projection heat map
const PlayerCard = ({ 
  player, 
  adpMap,
  injuries,
  injuredNames,
  onAddToLineup 
}: { 
  player: Player2026; 
  adpMap: Map<string, any>;
  injuries: Set<string>;
  injuredNames: Set<string>;
  onAddToLineup: () => void;
}) => {
  const normalizedName = player.name?.replace(/[.\s'\-]/g, '').toLowerCase() || '';
  const adpData = adpMap.get(normalizedName);
  const isInjured = injuries.has(player.id) || 
                   (player.injury_status && player.injury_status !== 'Healthy') || 
                   injuredNames.has(player.name) ||
                   injuries.has(normalizedName) ||
                   injuries.has(`norm:${normalizedName}`);
  
  const maxProjection = 60;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }, position: 'relative' }}>
      {player.is_rookie && (
        <Chip label="2026 ROOKIE" size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#FFD700', color: 'black', fontWeight: 700, zIndex: 1 }} />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>{player.name}</Typography>
              {player.trend && <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>{player.trend}</Typography>}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{player.team} • {player.position}</Typography>
          </Box>
          <Chip label={`$${player.salary?.toLocaleString()}`} color="primary" size="small" />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Projection</Typography>
            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>{player.projection?.toFixed(1)}</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Value</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: player.value && player.value > 5 ? 'success.main' : 'text.primary' }}>{player.value?.toFixed(2)}</Typography>
          </Box>
        </Box>

        {/* Projection heat map */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={(player.projection / maxProjection) * 100}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={4}><Typography variant="caption" color="text.secondary">Points</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{player.points?.toFixed(1) || '0.0'}</Typography></Grid>
          <Grid item xs={4}><Typography variant="caption" color="text.secondary">Rebounds</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{player.rebounds?.toFixed(1) || '0.0'}</Typography></Grid>
          <Grid item xs={4}><Typography variant="caption" color="text.secondary">Assists</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{player.assists?.toFixed(1) || '0.0'}</Typography></Grid>
        </Grid>

        <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {isInjured && (
            <Chip label="INJ" size="small" color="error" />
          )}
          {adpData && (
            <Tooltip title={adpData.isEstimated ? 'Estimated ADP' : 'Average Draft Position'}>
              <Chip 
                label={`ADP ${adpData.overallADP.toFixed(1)}${adpData.isEstimated ? '†' : ''}`} 
                size="small" 
                color={adpData.isEstimated ? 'default' : 'secondary'} 
                variant={adpData.isEstimated ? 'outlined' : 'filled'}
              />
            </Tooltip>
          )}
          <Chip label={player.injury_status || 'Healthy'} size="small" color={player.injury_status === 'Healthy' ? 'success' : 'error'} variant="outlined" />
          {player.note && <Tooltip title={player.note}><Chip label="Note" size="small" color="info" variant="outlined" /></Tooltip>}
          <Button size="small" variant="contained" onClick={onAddToLineup} sx={{ fontSize: '0.75rem', ml: 'auto' }} disabled={isInjured}>+ Add</Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; componentName?: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`[ErrorBoundary:${this.props.componentName || 'unknown'}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="h6">Component Error: {this.props.componentName}</Typography>
          <Typography variant="body2">{this.state.error?.message}</Typography>
        </Alert>
      );
    }
    return this.props.children;
  }
}

export default FantasyHubScreen;
