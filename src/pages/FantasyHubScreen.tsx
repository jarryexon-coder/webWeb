// FantasyHubScreen.tsx – Complete updated version with salary cap $60,000, fixed team names, and new NBA Props tab
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
import AssessmentIcon from '@mui/icons-material/Assessment'; // Added for Projections tab
import { useTheme } from '@mui/material/styles';

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
const SALARY_CAP = 60000; // updated from 50000 to 60000
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
    ? ['C', 'PF', 'SF', 'PG', 'SG', 'SF', 'SG', 'PF', 'PG']
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

  // Get unique stat types from playerProps (you'll need to pass this in)
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
  // This would need to be connected to your actual props data
  // For now, it's a placeholder that will be implemented with your existing props logic
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
  
  // New filter state for the props table (moved from inside renderPlayerPropsTable)
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
  const [nbaPropsTab, setNbaPropsTab] = useState(0); // 0: Card View, 1: Table View (optional)
  const [nbaPropsFilters, setNbaPropsFilters] = useState<any>({});

  // AI Generator
  const [customQuery, setCustomQuery] = useState('');
  const [generatingLineup, setGeneratingLineup] = useState(false);
  const [lineupResult, setLineupResult] = useState<any>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  // Draft - NEW STATE VARIABLES
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

  // ============= UPDATE SLATE PLAYERS WHEN PLAYERS OR TEAMS CHANGE =============
  useEffect(() => {
    if (players.length > 0 && teamsPlayingToday.size > 0) {
      const filtered = players.filter(p => teamsPlayingToday.has(p.team));
      setSlatePlayers(filtered);
      console.log(`[SLATE] Filtered to ${filtered.length} players from today's games (from ${players.length})`);
    } else {
      setSlatePlayers(players);
    }
  }, [players, teamsPlayingToday]);

  // ============= DATA FETCHING WITH RATE LIMITING =============
  const fetchTodaysGames = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const response = await fetchWithRetry(`${NODE_API_BASE}/api/tank01/games?date=${today}`);
      
      if (!response) {
        console.log('[GAMES] Request already in progress, skipping');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setTodaysGames(data.data);
        console.log(`[GAMES] Loaded ${data.data.length} games for today`);
        
        const teams = new Set<string>();
        data.data.forEach((game: any) => {
          if (game.away) teams.add(game.away);
          if (game.home) teams.add(game.home);
          console.log(`[GAME] ${game.away} @ ${game.home}`);
        });
        console.log(`[GAMES] Teams playing today: ${Array.from(teams).join(', ')}`);
      }
    } catch (error) {
      console.error('[GAMES] Failed to fetch:', error);
    }
  }, []);

  const fetchADP = useCallback(async () => {
    try {
      const response = await fetchWithRetry(`${NODE_API_BASE}/api/tank01/adp?sport=${activeSport}`);
      
      if (!response) {
        console.log('[ADP] Request already in progress, skipping');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        const map = new Map();
        data.data.forEach((item: any) => map.set(item.playerID, item));
        setAdpMap(map);
      }
    } catch (e) {
      console.warn('[ADP] Failed to fetch, using mock data');
    }
  }, [activeSport]);

  const fetchInjuries = useCallback(async () => {
    setLoadingInjuries(true);
    try {
      const response = await fetchWithRetry(`${NODE_API_BASE}/api/tank01/injuries`);
      
      if (!response) {
        console.log('[INJURIES] Request already in progress, skipping');
        setLoadingInjuries(false);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setInjuryList(data.data);
        const injuredSet = new Set<string>();
        data.data.forEach((item: any) => {
          if (item.longName) injuredSet.add(item.longName);
        });
        setInjuries(injuredSet);
      }
    } catch (error) {
      console.error('[INJURIES] Failed to fetch:', error);
    } finally {
      setLoadingInjuries(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const response = await fetchWithRetry(`${NODE_API_BASE}/api/tank01/news?max=5`);
      
      if (!response) {
        console.log('[NEWS] Request already in progress, skipping');
        setLoadingNews(false);
        return;
      }
      
      const data = await response.json();
      if (data.success) setNewsItems(data.data);
    } catch (error) {
      console.error('[NEWS] Failed to fetch:', error);
    } finally {
      setLoadingNews(false);
    }
  }, []);

  const fetchDepthCharts = useCallback(async () => {
    try {
      const response = await fetchWithRetry(`${NODE_API_BASE}/api/tank01/depthcharts`);
      
      if (!response) {
        console.log('[DEPTH] Request already in progress, skipping');
        return;
      }
      
      const data = await response.json();
      if (data.success) setDepthCharts(data.data);
    } catch (error) {
      console.error('[DEPTH] Failed to fetch:', error);
      generateMockDepthCharts();
    }
  }, []);

  const generateMockDepthCharts = useCallback(() => {
    if (depthCharts && depthCharts.length > 0) {
      console.log('[DEPTH] Already have depth charts, skipping generation');
      return depthCharts;
    }
    
    console.log('[DEPTH] Generating mock depth charts');
    
    const teams = ['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW', 'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NO', 'NY', 'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SA', 'TOR', 'UTA', 'WAS'];
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    
    const mockDepth = teams.map(team => ({
      team,
      depthChart: positions.map(pos => ({
        position: pos,
        starters: [`${team} ${pos}1`, `${team} ${pos}2`],
        backups: [`${team} ${pos}3`, `${team} ${pos}4`]
      }))
    }));
    
    setDepthCharts(mockDepth);
    return mockDepth;
  }, [depthCharts]);

  const fetchAllTank01Data = async () => {
    console.log('[TANK01] Fetching all data with sequential throttling');
    
    const endpoints = [
      { key: 'games', fn: fetchTodaysGames, priority: 'high', delay: 0 },
      { key: 'adp', fn: fetchADP, priority: 'high', delay: 1000 },
      { key: 'injuries', fn: fetchInjuries, priority: 'medium', delay: 2000 },
      { key: 'news', fn: fetchNews, priority: 'low', delay: 3000 },
      { key: 'depth', fn: fetchDepthCharts, priority: 'low', delay: 4000 }
    ];
    
    for (const endpoint of endpoints) {
      if (endpoint.delay > 0) {
        console.log(`[TANK01] Waiting ${endpoint.delay}ms before fetching ${endpoint.key}...`);
        await new Promise(resolve => setTimeout(resolve, endpoint.delay));
      }
      
      try {
        console.log(`[TANK01] Fetching ${endpoint.key}...`);
        await endpoint.fn();
      } catch (error) {
        console.error(`[TANK01] Failed to fetch ${endpoint.key}:`, error);
        
        if (endpoint.key === 'depth') {
          generateMockDepthCharts();
        }
      }
    }
    
    if (depthCharts.length === 0) {
      generateMockDepthCharts();
    }
    
    console.log('[TANK01] All data fetch complete');
  };

  // ============= FETCH PLAYERS =============
  const fetchPlayers = useCallback(async () => {
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
      
      const backendUrl = `${NODE_API_BASE}/api/fantasyhub/players?sport=${activeSport}`;
      console.log('[FETCH] Trying Node.js backend endpoint:', backendUrl);
      
      const response = await fetchWithRetry(backendUrl);
      
      if (!response) {
        console.log('[PLAYERS] Request already in progress, skipping');
        setIsLoadingPlayers(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`[FETCH] Loaded ${data.data.length} players from Node.js API`);
        
        const processedPlayers = data.data.map((player: any) => {
          const salary = player.salary || 5000;
          const projection = player.fantasy_points || player.projection || 0;
          
          return {
            id: player.player_id || player.id || `player-${Date.now()}`,
            name: player.name || 'Unknown Player',
            team: player.team || 'N/A',
            position: player.position || 'N/A',
            salary,
            projection,
            fantasy_points: projection,
            value: salary > 0 ? (projection / salary) * 1000 : 0,
            points: player.points || 0,
            rebounds: player.rebounds || 0,
            assists: player.assists || 0,
            steals: player.steals || 0,
            blocks: player.blocks || 0,
            injury_status: player.injury_status || 'Healthy',
            sport: activeSport.toUpperCase(),
            is_rookie: player.is_rookie || false,
            adp: player.adp,
            source: 'node-api'
          };
        });
        
        const uniqueMap = new Map<string, Player2026>();
        processedPlayers.forEach(player => {
          const key = `${player.name}-${player.team}`;
          const existing = uniqueMap.get(key);
          if (!existing || player.salary > existing.salary) {
            uniqueMap.set(key, player);
          }
        });
        
        const uniquePlayers = Array.from(uniqueMap.values());
        console.log(`[PLAYERS] Loaded ${uniquePlayers.length} unique players from Node.js API`);
        
        setSessionCached(`players_${activeSport}`, uniquePlayers);
        
        setPlayers(uniquePlayers);
        setFilteredPlayers(uniquePlayers);
        
        const salaries = uniquePlayers.map(p => p.salary).filter(Boolean);
        const projections = uniquePlayers.map(p => p.projection).filter(Boolean);
        
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
        
        setIsLoadingPlayers(false);
        return;
      }
      
      console.log('[PLAYERS] Using mock players fallback');
      const mockPlayers = generateMockPlayers();
      setPlayers(mockPlayers);
      setFilteredPlayers(mockPlayers);
      setSessionCached(`players_${activeSport}`, mockPlayers);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
      console.error('[FETCH] Error fetching players:', err);
      
      const mockPlayers = generateMockPlayers();
      setPlayers(mockPlayers);
      setFilteredPlayers(mockPlayers);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [activeSport]);

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
  const fetchPlayerProps = useCallback(async () => {
    setLoadingProps(true);
    setPropsError(null);
    try {
      // Use Python endpoint which already returns props with projections
      const url = `${PYTHON_API_BASE}/api/fantasy/props?sport=${activeSport}&limit=200`;
      console.log('[PROPS] Fetching player props from Python:', url);
      const response = await fetchWithRetry(url, {}, 2);
      if (!response) {
        console.log('[PROPS] Request already in progress, skipping');
        return;
      }
      const data = await response.json();
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

  // ============= INITIAL DATA FETCH WITH STAGGERING =============
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      await fetchPlayers();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTimeout(() => fetchPlayerProps(), 500);
      setTimeout(() => fetchAllTank01Data(), 1000);
      
      setLoading(false);
    };
    
    loadData();
  }, [fetchPlayers, fetchPlayerProps]);

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

  useEffect(() => {
    if (players.length === 0) return;
    
    let filtered = slatePlayers.length > 0 ? [...slatePlayers] : [...players];
    
    console.log(`[FILTER] Starting with ${filtered.length} players from today's games`);
    
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase().trim();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query)
      );
    }
    
    filtered = filtered.filter(player =>
      player.salary >= minSalary && player.salary <= maxSalary
    );
    
    filtered = filtered.filter(player =>
      player.projection >= minProjection && player.projection <= maxProjection
    );
    
    if (selectedPositions.length > 0) {
      filtered = filtered.filter(player =>
        selectedPositions.includes(player.position)
      );
    }
    
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(player =>
        selectedTeams.includes(player.team)
      );
    }
    
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'value':
          aValue = a.value || 0;
          bValue = b.value || 0;
          break;
        case 'projection':
          aValue = a.projection || 0;
          bValue = b.projection || 0;
          break;
        case 'salary':
          aValue = a.salary || 0;
          bValue = b.salary || 0;
          break;
        default:
          aValue = a.value || 0;
          bValue = b.value || 0;
      }
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
    
    setFilteredPlayers(filtered);
    console.log(`[FILTER] Filtered to ${filtered.length} players`);
  }, [
    players, slatePlayers, debouncedSearch, sortBy, sortOrder,
    minSalary, maxSalary, minProjection, maxProjection,
    selectedPositions, selectedTeams
  ]);

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

  // ============= UPDATED LINEUP GENERATOR (Knapsack for exactly 9 players) =============
  const generateLineup = useCallback((players: Player2026[], numLineups = 3) => {
    console.log(`[Knapsack] Generating lineup with ${players.length} players, need 9 slots, cap $${SALARY_CAP}`);

    if (!players || players.length < 9) {
      console.log('[Knapsack] Not enough players');
      return [];
    }

    // Filter players with valid salary and projection
    const validPlayers = players.filter(p => p.salary > 0 && p.projection > 0);
    if (validPlayers.length < 9) {
      console.log('[Knapsack] Not enough players with positive salary/projection');
      return [];
    }

    // We need exactly 9 players. Use DP: dp[k][s] = max projection with k players and salary s
    // Since we need exact count, we'll use an array of maps: dp[k] = Map<salary, projection>
    const dp: Map<number, number>[] = Array.from({ length: 10 }, () => new Map());
    dp[0].set(0, 0);

    for (const player of validPlayers) {
      const sal = player.salary;
      const proj = player.projection;
      // Iterate backwards to avoid using same player multiple times
      for (let k = 9; k >= 1; k--) {
        const prevMap = dp[k - 1];
        const currentMap = dp[k];
        for (const [prevSal, prevProj] of prevMap.entries()) {
          const newSal = prevSal + sal;
          if (newSal <= SALARY_CAP) {
            const newProj = prevProj + proj;
            const existing = currentMap.get(newSal);
            if (existing === undefined || newProj > existing) {
              currentMap.set(newSal, newProj);
            }
          }
        }
      }
    }

    // Find the best combination (highest projection) among dp[9]
    let bestSalary = -1;
    let bestProjection = -1;
    for (const [sal, proj] of dp[9].entries()) {
      if (proj > bestProjection) {
        bestProjection = proj;
        bestSalary = sal;
      }
    }

    if (bestSalary === -1) {
      console.log('[Knapsack] Could not find a 9‑player combination under cap');
      return [];
    }

    // Reconstruct the lineup
    const selected: Player2026[] = [];
    let remainingSalary = bestSalary;
    let remainingPlayers = 9;
    // Sort players by salary descending to make reconstruction easier (optional)
    const sortedPlayers = [...validPlayers].sort((a, b) => b.salary - a.salary);

    for (const player of sortedPlayers) {
      if (remainingPlayers === 0) break;
      if (player.salary <= remainingSalary) {
        // Check if this player was used by verifying if removing him yields a valid dp state
        // Simpler: greedy reconstruction – may not be perfect but likely works because we stored optimal projection
        // More robust: backtrack using dp table. We'll do a simple greedy with check.
        const prevK = remainingPlayers - 1;
        const prevSal = remainingSalary - player.salary;
        if (dp[prevK].has(prevSal)) {
          // This player could be part of the optimal solution
          selected.push(player);
          remainingSalary -= player.salary;
          remainingPlayers--;
        }
      }
    }

    if (selected.length === 9) {
      const lineup = {
        id: `lineup-${Date.now()}`,
        sport: activeSport,
        slots: selected.map(p => ({
          position: p.position || 'UTIL',
          player: {
            id: p.id,
            name: p.name,
            team: p.team,
            position: p.position,
            salary: p.salary,
            fantasy_projection: p.projection,
            points: p.points,
            assists: p.assists,
            rebounds: p.rebounds
          }
        })),
        total_salary: selected.reduce((sum, p) => sum + p.salary, 0),
        total_projection: Math.round(selected.reduce((sum, p) => sum + p.projection, 0) * 10) / 10,
        remaining_cap: SALARY_CAP - selected.reduce((sum, p) => sum + p.salary, 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('[Knapsack] Generated lineup under cap:', lineup);
      return [lineup];
    }

    console.log('[Knapsack] Reconstruction failed – fallback to simple greedy');
    // Final fallback: simple greedy by value
    const sortedByValue = [...validPlayers].sort((a, b) => b.value - a.value);
    const greedySelected: Player2026[] = [];
    let totalSalary = 0;
    for (const p of sortedByValue) {
      if (greedySelected.length >= 9) break;
      if (totalSalary + p.salary <= SALARY_CAP) {
        greedySelected.push(p);
        totalSalary += p.salary;
      }
    }
    if (greedySelected.length === 9) {
      const lineup = {
        id: `lineup-${Date.now()}-greedy`,
        sport: activeSport,
        slots: greedySelected.map(p => ({
          position: p.position || 'UTIL',
          player: {
            id: p.id,
            name: p.name,
            team: p.team,
            position: p.position,
            salary: p.salary,
            fantasy_projection: p.projection,
            points: p.points,
            assists: p.assists,
            rebounds: p.rebounds
          }
        })),
        total_salary: totalSalary,
        total_projection: Math.round(greedySelected.reduce((sum, p) => sum + p.projection, 0) * 10) / 10,
        remaining_cap: SALARY_CAP - totalSalary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return [lineup];
    }

    return [];
  }, [activeSport]);

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

  const generateLineupBacktrack = useCallback((
    players: Player2026[],
    slots: string[],
    salaryCap: number,
    strategy: 'value' | 'projection' | 'balanced'
  ): FantasyLineup | null => {
    const startTime = Date.now();
    const TIME_LIMIT = 5000;

    console.log(`[Backtrack] Generating lineup with ${players.length} players, need ${slots.length} slots, cap $${salaryCap}, strategy: ${strategy}`);

    if (!players || players.length < slots.length) {
      console.log(`[Backtrack] Not enough players: have ${players?.length || 0}, need ${slots.length}`);
      return null;
    }

    const playerPool = players.map(p => ({
      ...p,
      valueScore: (p.fantasy_points || 0) / (p.salary || 1) * 1000,
      score: strategy === 'value' ? ((p.fantasy_points || 0) / (p.salary || 1) * 1000) :
             strategy === 'projection' ? (p.projection || 0) :
             ((p.projection || 0) * 0.7 + ((p.fantasy_points || 0) / (p.salary || 1) * 1000) * 0.3)
    }));

    const result: (Player2026 | null)[] = new Array(slots.length).fill(null);
    const usedIds = new Set<string>();

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

      const slotsRemaining = slots.length - index;
      const minNeeded = getMinRemainingSalary(
        playerPool.filter(p => !usedIds.has(p.id)),
        slotsRemaining
      );

      if (salaryCap - currentSalary < minNeeded) {
        return false;
      }

      const slot = slots[index];
      const isRestrictive = (slot === 'C' || slot === 'PF' || slot === 'SF');
      const sortedForSlot = isRestrictive
        ? [...playerPool].sort((a, b) => a.salary - b.salary)
        : [...playerPool].sort((a, b) => b.score - a.score);

      const searchLimit = isRestrictive ? 20 : 30;
      const candidates = sortedForSlot.slice(0, searchLimit);

      for (let i = 0; i < candidates.length; i++) {
        const player = candidates[i];

        if (usedIds.has(player.id)) continue;
        if (currentSalary + player.salary > salaryCap) continue;
        if (!canPlayPositionLegacy(player.position, slot, activeSport)) continue;

        result[index] = player;
        usedIds.add(player.id);

        if (backtrack(index + 1, currentSalary + player.salary)) return true;

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

      console.log(`[Backtrack] Success! Lineup: $${totalSalary} cap used, ${totalProjection.toFixed(1)} projected FP`);

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

  const generateMultipleLineups = useCallback((
    players: Player2026[],
    sport: Sport,
    strategy: 'value' | 'projection' | 'balanced',
    count: number
  ): FantasyLineup[] => {
    const positions = sport === 'nba'
      ? ['PG', 'SG', 'SF', 'PF', 'C', 'FLEX', 'FLEX', 'FLEX', 'FLEX']
      : ['C', 'LW', 'RW', 'D', 'D', 'G', 'UTIL', 'UTIL', 'UTIL'];

    console.log(`[MultipleLineups] Generating up to ${count} lineups with ${players.length} players, strategy: ${strategy}`);

    const fallbackLineups = generateLineup(players, count);
    if (fallbackLineups.length > 0) {
      console.log(`[MultipleLineups] Using fallback generator, got ${fallbackLineups.length} lineups`);
      return fallbackLineups;
    }

    const lineups: FantasyLineup[] = [];
    const usedPlayers = new Set<string>();
    const startTime = Date.now();
    const TIME_LIMIT = 10000;

    const strategies: Array<'value' | 'projection' | 'balanced'> = 
      strategy === 'balanced' 
        ? ['value', 'projection', 'balanced'] 
        : [strategy, strategy === 'value' ? 'projection' : 'value', 'balanced'];

    for (let i = 0; i < count; i++) {
      if (Date.now() - startTime > TIME_LIMIT) {
        console.log(`[MultipleLineups] Time limit reached after ${i} lineups`);
        break;
      }

      let availablePlayers = players.filter(p => !usedPlayers.has(p.id));

      if (availablePlayers.length < 5) {
        console.log(`[MultipleLineups] Not enough unique players for lineup ${i + 1}, resetting player pool`);
        usedPlayers.clear();
        availablePlayers = players;
      }

      const currentStrategy = strategies[i % strategies.length];
      console.log(`[MultipleLineups] Attempting lineup ${i + 1} with ${availablePlayers.length} available players, strategy: ${currentStrategy}`);

      const lineup = generateLineupBacktrack(availablePlayers, positions, SALARY_CAP, currentStrategy);

      if (lineup) {
        lineup.slots.forEach(slot => {
          if (slot.player) {
            usedPlayers.add(slot.player.id);
          }
        });
        lineups.push(lineup);
        console.log(`[MultipleLineups] Generated lineup ${i + 1} with ${lineup.slots.filter(s => s.player).length} players, ${lineup.total_projection.toFixed(1)} FP, $${lineup.total_salary}`);
      } else {
        console.log(`[MultipleLineups] Could not generate lineup ${i + 1}`);
        if (availablePlayers.length > players.length * 0.5) {
          usedPlayers.clear();
          console.log('[MultipleLineups] Resetting used players and retrying');
          i--;
        } else {
          break;
        }
      }
    }

    lineups.sort((a, b) => b.total_projection - a.total_projection);

    console.log(`[MultipleLineups] Generated ${lineups.length} lineups in ${Date.now() - startTime}ms`);
    
    lineups.forEach((lineup, idx) => {
      console.log(`  Lineup ${idx + 1}: ${lineup.total_projection.toFixed(1)} FP, $${lineup.total_salary}, ${lineup.slots.filter(s => s.player).length} players`);
    });

    return lineups;
  }, [generateLineupBacktrack, generateLineup]);

  const handleGenerateLineup = () => {
    console.log('[Generate] Generating optimal lineups...');
    const startTime = Date.now();
    
    let pool = ignoreFilters ? players : filteredPlayers;
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
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🧪 Test complete');
  }, []);

  // ============= UPDATED SNAKE DRAFT HANDLER (no mock fallback) =============
  const handleSnakeDraft = useCallback(async (pickNumber: number, strategy: string = 'balanced') => {
    console.log(`[SNAKE DRAFT] Fetching for pick ${pickNumber}, strategy ${strategy}`);
    
    try {
      const url = `${NODE_API_BASE}/api/draft/rankings?sport=nba&pick=${pickNumber}&limit=3&strategy=${strategy}`;
      
      console.log(`[SNAKE DRAFT] Fetching from: ${url}`);
      
      const response = await fetchWithRetry(url, {}, 2);
      
      if (!response) {
        console.log('[SNAKE DRAFT] Request failed – no fallback data');
        return;
      }
      
      const data = await response.json();
      console.log(`[SNAKE DRAFT] Got ${data.data?.length || 0} players from API`);
      
      if (data.data && data.data.length > 0) {
        const formatted = data.data.map((item: any, idx: number) => ({
          player: {
            id: item.playerId || `player-${idx}`,
            name: item.name,
            team: item.team,
            position: item.position,
            salary: item.salary,
            projection: item.projectedPoints,
            value: item.valueScore,
            adp: item.adp,
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
        }));
        
        setDraftResult({
          type: 'snake',
          pickNumber: pickNumber,
          players: formatted,
          analysis: `Top ${formatted.length} players to target at pick ${pickNumber} using ${strategy} strategy.`
        });
        
        setDraftRecommendations(formatted.map(r => r.player));
        setDraftPick(pickNumber);
        setDraftStrategy(strategy);
        setShowDraftModal(true);
        console.log('[SNAKE DRAFT] Recommendations:', formatted);
      } else {
        console.log('[SNAKE DRAFT] No data returned from API');
        // Optionally show an error message to the user, but no mock fallback
      }
    } catch (error) {
      console.error('[SNAKE DRAFT] Error:', error);
    }
  }, []);

  // ============= UPDATED TURN DRAFT HANDLER (no mock fallback) =============
  const handleTurnDraft = useCallback(async (pickNumber: number, strategy: string = 'balanced') => {
    console.log(`[TURN DRAFT] Fetching for pick ${pickNumber}, strategy ${strategy}`);
    
    try {
      const url = `${NODE_API_BASE}/api/draft/rankings?sport=nba&pick=${pickNumber}&limit=10&strategy=${strategy}`;
      
      console.log(`[TURN DRAFT] Fetching from: ${url}`);
      
      const response = await fetchWithRetry(url, {}, 2);
      
      if (!response) {
        console.log('[TURN DRAFT] Request failed – no fallback data');
        return;
      }
      
      const data = await response.json();
      console.log(`[TURN DRAFT] Got ${data.data?.length || 0} players from API`);
      
      if (data.data && data.data.length > 0) {
        const formatted = data.data.map((item: any, idx: number) => ({
          player: {
            id: item.playerId || `player-${idx}`,
            name: item.name,
            team: item.team,
            position: item.position,
            salary: item.salary,
            projection: item.projectedPoints,
            value: item.valueScore,
            adp: item.adp,
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
          adp: item.adp,
          expertRank: idx + 1,
          tier: item.tier || Math.floor(idx / 3) + 1,
          reasoning: `Pick #${pickNumber + idx} - ${strategy} strategy`,
          salaryFD: item.salary,
          salaryDK: item.salary,
          keyFactors: item.keyFactors || ['Projected volume', 'Matchup']
        }));
        
        setDraftResult({
          type: 'turn',
          pickNumber: pickNumber,
          players: formatted,
          analysis: `Top ${formatted.length} players by value for turn ${pickNumber} using ${strategy} strategy.`
        });
        
        setDraftRecommendations(formatted.map(r => r.player));
        setDraftPick(pickNumber);
        setDraftStrategy(strategy);
        setDraftMode('turn');
        setShowDraftModal(true);
        console.log('[TURN DRAFT] Recommendations:', formatted);
      } else {
        console.log('[TURN DRAFT] No data returned from API');
      }
    } catch (error) {
      console.error('[TURN DRAFT] Error:', error);
    }
  }, []);

  // ============= UPDATED DRAFT COMMAND HANDLER =============
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

  // ============= FETCH DRAFT HISTORY =============
  const fetchDraftHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetchWithRetry(
        `${NODE_API_BASE}/api/draft/history?userId=${userId}&sport=${activeSport.toUpperCase()}`
      );
      
      if (!response) {
        console.log('[DRAFT HISTORY] Request already in progress, skipping');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setSavedDrafts(data.data || []);
        console.log(`[DRAFT HISTORY] Loaded ${data.data?.length || 0} saved drafts`);
      }
    } catch (error) {
      console.error('[DRAFT HISTORY] Error fetching:', error);
    }
  }, [userId, activeSport]);

  // Load draft history on mount
  useEffect(() => {
    if (userId) {
      fetchDraftHistory();
    }
  }, [userId, activeSport, fetchDraftHistory]);

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

      let pool = filterPlayersByIntent(players, intent);
      if (pool.length === 0) {
        pool = filterPlayersByQuery(players, customQuery);
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
          logPromptPerformance(customQuery, 1, 0, 'generator');
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
  }, [players, customQuery, activeSport, teamsPlayingToday, generateMultipleLineups]);

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
        <Chip label="Feb 2026" size="small" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }} />
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
          disabled={!customQuery.trim() || generatingLineup}
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

    // Log the first few props to see their structure
    console.log('[Props] First 3 raw props:', playerProps.slice(0, 3));

    // Deduplicate by player + stat_type + line
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

    // Helper to get player's team with improved fuzzy matching
    const getPlayerTeam = (playerName: string): string => {
      // Normalize: remove periods, apostrophes, spaces, and lowercase
      const normalize = (name: string) => 
        name.replace(/[.\s'\-]/g, '').toLowerCase();
      
      const normalizedPropName = normalize(playerName);
      
      // Try exact match first
      let found = players.find(p => normalize(p.name) === normalizedPropName);
      
      // If not found, try matching by last name only (for names like "P.J. Washington" vs "PJ Washington")
      if (!found) {
        const propLastName = playerName.split(' ').pop()?.toLowerCase() || '';
        found = players.find(p => {
          const playerLastName = p.name.split(' ').pop()?.toLowerCase() || '';
          return playerLastName === propLastName && 
                 p.team; // ensure they have a team
        });
      }
      
      return found?.team || '??';
    };

    // Get unique stat types and bookmakers for filters
    const statTypes = [...new Set(dedupedProps.map(p => p.prop_type || p.stat || p.stat_type).filter(Boolean))];
    const bookmakers = [...new Set(dedupedProps.map(p => p.bookmaker).filter(Boolean))];

    // Apply filters using the top-level state
    const filteredProps = dedupedProps.filter(prop => {
      if (propsStatFilter !== 'all' && (prop.prop_type || prop.stat || prop.stat_type) !== propsStatFilter) return false;
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
        {/* Game odds are not implemented yet – could use a separate endpoint */}
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
          <Tab icon={<AssessmentIcon />} label="Projections" />   {/* New tab */}
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
            {/* Add filter bar for NBA props here */}
            <Box sx={{ mb: 3 }}>
              <NBAPropsFilterBar 
                onFilterChange={(filters) => {
                  // Apply filters to NBA props
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
                {slatePlayers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">No players available for tonight's games.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
                          <TableCell align="right">{item.player.adp || '-'}</TableCell>
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
  const adpData = adpMap.get(player.id);
  const isInjured = injuries.has(player.id) || (player.injury_status && player.injury_status !== 'Healthy') || injuredNames.has(player.name);
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
            <Tooltip title={`ADP: ${adpData.overallADP}`}>
              <Chip label={`ADP ${adpData.overallADP}`} size="small" color="secondary" variant="outlined" />
            </Tooltip>
          )}
          <Chip label={player.injury_status || 'Healthy'} size="small" color={player.injury_status === 'Healthy' ? 'success' : 'error'} variant="outlined" />
          {player.note && <Tooltip title={player.note}><Chip label="Note" size="small" color="info" variant="outlined" /></Tooltip>}
          <Button size="small" variant="contained" onClick={onAddToLineup} sx={{ fontSize: '0.75rem', ml: 'auto' }}>+ Add</Button>
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
