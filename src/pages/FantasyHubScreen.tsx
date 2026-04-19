// FantasyHubScreen.tsx – COMPLETE with API Retry Logic & Off-Season Mode

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Card, CardContent, Typography, Box, Chip, Button,
  TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Slider, Checkbox, FormGroup, FormControlLabel, Paper, IconButton,
  Tooltip, CircularProgress, Alert, AlertTitle, Collapse, Dialog,
  DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText,
  Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Autocomplete, LinearProgress, Tabs, Tab,
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
import CreditCardIcon from '@mui/icons-material/CreditCard';
import StarIcon from '@mui/icons-material/Star';
import { useTheme } from '@mui/material/styles';

// Services
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

// Auth & Checkout
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';
import PlanFeaturesDisplay from '../components/PlanFeaturesDisplay';

import { Player, Sport, FantasyLineup, LineupSlot } from '../types/fantasy.types';

// ============= STATIC PLAYER DATA (FALLBACK) =============
const NBA_STATIC_PLAYERS: Player2026[] = [
  { id: 'nba-jokic', name: 'Nikola Jokic', team: 'DEN', position: 'C', sport: 'NBA', salary: 11400, fantasy_points: 55.2, projection: 55.2, value: 4.84, points: 29.1, rebounds: 12.6, assists: 10.4, steals: 1.4, blocks: 0.9, injury_status: 'Healthy' },
  { id: 'nba-doncic', name: 'Luka Doncic', team: 'LAL', position: 'PG', sport: 'NBA', salary: 11200, fantasy_points: 52.1, projection: 52.1, value: 4.65, points: 32.5, rebounds: 8.5, assists: 8.5, steals: 1.5, blocks: 0.5, injury_status: 'Healthy' },
  { id: 'nba-sga', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'SG', sport: 'NBA', salary: 10800, fantasy_points: 49.3, projection: 49.3, value: 4.56, points: 31.2, rebounds: 5.5, assists: 6.4, steals: 2.1, blocks: 0.9, injury_status: 'Healthy' },
  { id: 'nba-giannis', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', sport: 'NBA', salary: 11500, fantasy_points: 54.8, projection: 54.8, value: 4.77, points: 31.0, rebounds: 11.8, assists: 6.2, steals: 1.2, blocks: 1.4, injury_status: 'Healthy' },
  { id: 'nba-tatum', name: 'Jayson Tatum', team: 'BOS', position: 'SF', sport: 'NBA', salary: 10500, fantasy_points: 46.0, projection: 46.0, value: 4.38, points: 27.5, rebounds: 8.5, assists: 5.0, steals: 1.1, blocks: 0.6, injury_status: 'Healthy' },
  { id: 'nba-curry', name: 'Stephen Curry', team: 'GSW', position: 'PG', sport: 'NBA', salary: 9300, fantasy_points: 41.0, projection: 41.0, value: 4.41, points: 26.0, rebounds: 4.5, assists: 5.0, steals: 1.0, blocks: 0.3, injury_status: 'Healthy' },
  { id: 'nba-lebron', name: 'LeBron James', team: 'LAL', position: 'SF', sport: 'NBA', salary: 10000, fantasy_points: 44.0, projection: 44.0, value: 4.40, points: 25.5, rebounds: 7.5, assists: 7.5, steals: 1.2, blocks: 0.6, injury_status: 'Healthy' },
  { id: 'nba-brown', name: 'Jaylen Brown', team: 'BOS', position: 'SG', sport: 'NBA', salary: 8800, fantasy_points: 37.5, projection: 37.5, value: 4.26, points: 23.5, rebounds: 5.5, assists: 3.5, steals: 1.1, blocks: 0.5, injury_status: 'Healthy' },
  { id: 'nba-brunson', name: 'Jalen Brunson', team: 'NYK', position: 'PG', sport: 'NBA', salary: 9000, fantasy_points: 40.0, projection: 40.0, value: 4.44, points: 24.5, rebounds: 3.5, assists: 6.5, steals: 0.9, blocks: 0.2, injury_status: 'Healthy' },
  { id: 'nba-embiid', name: 'Joel Embiid', team: 'PHI', position: 'C', sport: 'NBA', salary: 11000, fantasy_points: 51.0, projection: 51.0, value: 4.64, points: 33.0, rebounds: 10.5, assists: 4.0, steals: 1.0, blocks: 1.7, injury_status: 'Healthy' },
  { id: 'nba-durant', name: 'Kevin Durant', team: 'PHX', position: 'PF', sport: 'NBA', salary: 10200, fantasy_points: 46.5, projection: 46.5, value: 4.56, points: 28.5, rebounds: 6.5, assists: 5.0, steals: 0.8, blocks: 1.2, injury_status: 'Healthy' },
  { id: 'nba-booker', name: 'Devin Booker', team: 'PHX', position: 'SG', sport: 'NBA', salary: 9500, fantasy_points: 44.5, projection: 44.5, value: 4.68, points: 27.5, rebounds: 4.5, assists: 7.0, steals: 0.9, blocks: 0.4, injury_status: 'Healthy' },
  { id: 'nba-edwards', name: 'Anthony Edwards', team: 'MIN', position: 'SG', sport: 'NBA', salary: 9800, fantasy_points: 45.2, projection: 45.2, value: 4.61, points: 27.5, rebounds: 5.5, assists: 5.5, steals: 1.3, blocks: 0.5, injury_status: 'Healthy' },
  { id: 'nba-haliburton', name: 'Tyrese Haliburton', team: 'IND', position: 'PG', sport: 'NBA', salary: 9200, fantasy_points: 44.5, projection: 44.5, value: 4.84, points: 20.5, rebounds: 4.5, assists: 10.5, steals: 1.2, blocks: 0.7, injury_status: 'Healthy' },
  { id: 'nba-mitchell', name: 'Donovan Mitchell', team: 'CLE', position: 'SG', sport: 'NBA', salary: 9600, fantasy_points: 46.2, projection: 46.2, value: 4.81, points: 27.5, rebounds: 5.5, assists: 6.5, steals: 1.5, blocks: 0.5, injury_status: 'Healthy' },
  { id: 'nba-banchero', name: 'Paolo Banchero', team: 'ORL', position: 'PF', sport: 'NBA', salary: 9000, fantasy_points: 41.2, projection: 41.2, value: 4.58, points: 22.5, rebounds: 7.5, assists: 5.5, steals: 0.9, blocks: 0.6, injury_status: 'Healthy' },
  { id: 'nba-wembanyama', name: 'Victor Wembanyama', team: 'SAS', position: 'C', sport: 'NBA', salary: 10000, fantasy_points: 50.5, projection: 50.5, value: 5.05, points: 23.5, rebounds: 10.5, assists: 3.5, steals: 1.2, blocks: 3.5, injury_status: 'Healthy' },
  { id: 'nba-cunningham', name: 'Cade Cunningham', team: 'DET', position: 'PG', sport: 'NBA', salary: 9500, fantasy_points: 42.8, projection: 42.8, value: 4.51, points: 22.5, rebounds: 5.5, assists: 7.5, steals: 1.1, blocks: 0.4, injury_status: 'Healthy' },
  { id: 'nba-morant', name: 'Ja Morant', team: 'MEM', position: 'PG', sport: 'NBA', salary: 9800, fantasy_points: 47.5, projection: 47.5, value: 4.85, points: 25.5, rebounds: 5.5, assists: 8.5, steals: 1.1, blocks: 0.3, injury_status: 'Healthy' },
  { id: 'nba-young', name: 'Trae Young', team: 'ATL', position: 'PG', sport: 'NBA', salary: 9700, fantasy_points: 48.5, projection: 48.5, value: 5.00, points: 26.5, rebounds: 3.5, assists: 10.5, steals: 1.0, blocks: 0.2, injury_status: 'Healthy' },
  { id: 'nba-sabonis', name: 'Domantas Sabonis', team: 'SAC', position: 'C', sport: 'NBA', salary: 9900, fantasy_points: 47.0, projection: 47.0, value: 4.75, points: 19.5, rebounds: 12.5, assists: 8.5, steals: 0.9, blocks: 0.5, injury_status: 'Healthy' },
  { id: 'nba-adebayo', name: 'Bam Adebayo', team: 'MIA', position: 'C', sport: 'NBA', salary: 9200, fantasy_points: 41.0, projection: 41.0, value: 4.46, points: 20.0, rebounds: 10.0, assists: 3.5, steals: 1.2, blocks: 0.8, injury_status: 'Healthy' },
  { id: 'nba-butler', name: 'Jimmy Butler', team: 'MIA', position: 'SF', sport: 'NBA', salary: 9500, fantasy_points: 42.0, projection: 42.0, value: 4.42, points: 21.5, rebounds: 5.5, assists: 5.0, steals: 1.8, blocks: 0.4, injury_status: 'Healthy' },
  { id: 'nba-george', name: 'Paul George', team: 'LAC', position: 'SF', sport: 'NBA', salary: 9300, fantasy_points: 41.5, projection: 41.5, value: 4.46, points: 22.5, rebounds: 5.5, assists: 3.5, steals: 1.5, blocks: 0.5, injury_status: 'Healthy' },
  { id: 'nba-leonard', name: 'Kawhi Leonard', team: 'LAC', position: 'SF', sport: 'NBA', salary: 9400, fantasy_points: 43.0, projection: 43.0, value: 4.57, points: 23.5, rebounds: 6.5, assists: 4.0, steals: 1.6, blocks: 0.8, injury_status: 'Healthy' },
  { id: 'nba-harden', name: 'James Harden', team: 'LAC', position: 'PG', sport: 'NBA', salary: 9600, fantasy_points: 44.0, projection: 44.0, value: 4.58, points: 16.5, rebounds: 5.0, assists: 8.5, steals: 1.0, blocks: 0.8, injury_status: 'Healthy' },
];
const MLB_STATIC_PLAYERS: Player2026[] = [];
const NHL_STATIC_PLAYERS: Player2026[] = [];
const NFL_STATIC_PLAYERS: Player2026[] = [];

// ============= NEW TYPE: Prop Bet =============
interface PropBet {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  statType: string;
  line: number;
  betType: "Over" | "Under";
  odds: number;
  projection: number;
  edge: number;
  confidence: number;
  sport: string;
  game: string;
  source: string;
}

// ============= CONSTANTS =============
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';
const SALARY_CAP = 60000;
const MAX_PLAYERS = 9;
const CACHE_TTL = 5 * 60 * 1000;
const MAX_VISIBLE_CARDS = 3;

// ============= GAMES CACHE =============
const gamesCache = {
  data: null as any[] | null,
  timestamp: 0,
  ttl: 30 * 60 * 1000, // 30 minutes cache
};

// ============= UTILITY FUNCTIONS =============
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const fetchGamesWithRetry = async (sport: string, maxRetries = 2): Promise<any[]> => {
  const now = Date.now();
  if (gamesCache.data && (now - gamesCache.timestamp) < gamesCache.ttl) {
    console.log('Using cached games data');
    return gamesCache.data;
  }
  
  const today = getTodayString().replace(/-/g, '');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${NODE_API_BASE}/api/tank01/games?date=${today}&sport=${sport}`);
      
      if (response.status === 429) {
        const waitTime = (i + 1) * 2000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        gamesCache.data = data.data;
        gamesCache.timestamp = now;
        return data.data;
      }
      return [];
    } catch (error) {
      console.error(`Games fetch attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) return [];
      await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
    }
  }
  return [];
};

const getPlayingTeamsFromGames = (games: any[]): Set<string> => {
  const teams = new Set<string>();
  games.forEach(game => {
    if (game.awayTeam) teams.add(game.awayTeam);
    if (game.homeTeam) teams.add(game.homeTeam);
    if (game.away) teams.add(game.away);
    if (game.home) teams.add(game.home);
  });
  return teams;
};

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;

const throttleRequest = async () => {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLast));
  }
  lastRequestTime = Date.now();
};

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

const dataCache = new Map<string, { data: any; timestamp: number }>();
const getCachedData = async (key: string, fetchFn: () => Promise<any>) => {
  const cached = dataCache.get(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL) return cached.data;
  const data = await fetchFn();
  dataCache.set(key, { data, timestamp: now });
  return data;
};

const getSessionCached = (key: string) => {
  const cached = sessionStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 300000) return data;
  }
  return null;
};

const setSessionCached = (key: string, data: any) => {
  sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
};

const requestQueue: { [key: string]: number } = {};
let pendingRequests = new Set<string>();
const queueRequest = async (key: string, fn: () => Promise<any>, minDelay = 3000) => {
  const now = Date.now();
  const lastRequest = requestQueue[key] || 0;
  const timeSinceLastRequest = now - lastRequest;
  if (timeSinceLastRequest < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
  }
  if (pendingRequests.has(key)) {
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
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(60000, Math.pow(4, i) * 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') console.log(`⏳ Request timeout for ${endpoint}, retry ${i+1}/${maxRetries}`);
        else console.log(`⚠️ Request failed for ${endpoint}, retry ${i+1}/${maxRetries}:`, error.message);
        if (i === maxRetries - 1) return null;
        await new Promise(resolve => setTimeout(resolve, Math.min(30000, Math.pow(2, i) * 2000)));
      }
    }
    return null;
  });
};

const createEmptyLineup = (sport: Sport): FantasyLineup => {
  const positions = sport === 'nba'
    ? ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL', 'UTIL']
    : ['C', 'LW', 'RW', 'D', 'D', 'G', 'UTIL', 'UTIL', 'UTIL'];
  const slots: LineupSlot[] = positions.map(pos => ({ position: pos, player: null }));
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

const fetchWithRateLimitRetry = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 2000): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); } catch (error: any) {
      if (error?.response?.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
};

// ============= TYPES =============
export interface Player2026 {
  id: string; name: string; team: string; position: string; sport: 'NBA' | 'NHL' | 'NFL' | 'MLB';
  salary: number; fantasy_points: number; projection: number; value: number;
  points?: number; rebounds?: number; assists?: number; goals?: number;
  is_rookie?: boolean; note?: string; trend?: string; injury_status?: string;
  adp?: number; expertRank?: number; ceiling?: number; floor?: number; source?: string; tier?: number;
}
interface DraftPlayer { player: Player2026; rank: number; valueScore: number; reasoning: string; salaryFD: number; salaryDK: number; keyFactors: string[]; adp?: number; expertRank?: number; tier?: number; }
interface DraftResult { type: 'snake' | 'turn'; pickNumber: number; players: DraftPlayer[]; analysis?: string; }
interface DepthChartEntry { position: string; players: Array<{ name: string; jersey: string; depth: number }>; }
interface FantasyHubScreenProps { initialSport?: Sport; }

// ============= NBA PROPS FILTER BAR =============
const NBAPropsFilterBar = ({ onFilterChange }: { onFilterChange: (filters: any) => void }) => {
  const [search, setSearch] = useState('');
  const [statType, setStatType] = useState<string>('all');
  const [minEdge, setMinEdge] = useState<number>(-100);
  const [maxEdge, setMaxEdge] = useState<number>(100);
  const [bookmaker, setBookmaker] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const prevFiltersRef = useRef({ search, statType, minEdge, maxEdge, bookmaker });
  const statTypes = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'three-pointers'];
  const bookmakers = ['FanDuel', 'DraftKings', 'BetOnline.ag', 'Bovada'];
  useEffect(() => {
    const currentFilters = { search, statType, minEdge, maxEdge, bookmaker };
    if (JSON.stringify(currentFilters) !== JSON.stringify(prevFiltersRef.current)) {
      prevFiltersRef.current = currentFilters;
      onFilterChange(currentFilters);
    }
  }, [search, statType, minEdge, maxEdge, bookmaker, onFilterChange]);
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Filter NBA Props</Typography>
        <IconButton onClick={() => setShowFilters(!showFilters)}>{showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
      </Box>
      <Collapse in={showFilters}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" placeholder="Search player..." value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Stat Type</InputLabel>
              <Select value={statType} onChange={(e) => setStatType(e.target.value)} label="Stat Type">
                <MenuItem value="all">All</MenuItem>
                {statTypes.map(stat => <MenuItem key={stat} value={stat}>{stat}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Bookmaker</InputLabel>
              <Select value={bookmaker} onChange={(e) => setBookmaker(e.target.value)} label="Bookmaker">
                <MenuItem value="all">All</MenuItem>
                {bookmakers.map(bm => <MenuItem key={bm} value={bm}>{bm}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom variant="caption">Advantage % Range</Typography>
            <Slider value={[minEdge, maxEdge]} onChange={(e, val) => { setMinEdge((val as number[])[0]); setMaxEdge((val as number[])[1]); }}
              valueLabelDisplay="auto" min={-100} max={100} step={1} />
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

// ============= MAIN COMPONENT =============
const FantasyHubScreen: React.FC<FantasyHubScreenProps> = ({ initialSport = 'nba' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, token, profile, planFeatures, fetchProfile } = useAuth();
  const { handleCreditsCheckout, handleSubscriptionCheckout } = useCheckout();

  // Credits
  const [generatorCredits, setGeneratorCredits] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  
  useEffect(() => { 
    if (profile?.credits !== undefined) {
      setGeneratorCredits(profile.credits);
    } else if (user && token) {
      const fetchCredits = async () => {
        try {
          const creditsResponse = await fetch(`${PYTHON_API_BASE}/api/user/generations/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            setGeneratorCredits(creditsData.remaining);
          }
        } catch (error) {
          console.error('Failed to fetch credits:', error);
          setGeneratorCredits(0);
        }
      };
      fetchCredits();
    }
  }, [profile, user, token]);

  // Core state
  const [activeSport, setActiveSport] = useState<Sport>(initialSport);
  const [lineupPropBets, setLineupPropBets] = useState<(PropBet | null)[]>(new Array(MAX_PLAYERS).fill(null));
  const [totalProjection, setTotalProjection] = useState(0);
  const [totalOddsValue, setTotalOddsValue] = useState(0);
  const [lineup, setLineup] = useState<FantasyLineup>(() => createEmptyLineup(initialSport));
  const [loading, setLoading] = useState(true);
  const [savedLineups, setSavedLineups] = useState<Record<string, any>>({});
  const [showLineupHistory, setShowLineupHistory] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [teamsPlayingToday, setTeamsPlayingToday] = useState<Set<string>>(new Set());

  // UI expansions
  const [propsExpanded, setPropsExpanded] = useState(true);
  const [trendsExpanded, setTrendsExpanded] = useState(true);
  const [lineupExpanded, setLineupExpanded] = useState(true);
  const [playerGridExpanded, setPlayerGridExpanded] = useState(true);
  const [propsFiltersExpanded, setPropsFiltersExpanded] = useState(false);

  // Generator settings
  const [genStrategy, setGenStrategy] = useState<'value' | 'projection' | 'balanced'>('value');
  const [genCount, setGenCount] = useState(5);
  const [ignoreFilters, setIgnoreFilters] = useState(false);
  const [generatedLineups, setGeneratedLineups] = useState<any[]>([]);
  const [currentLineupIndex, setCurrentLineupIndex] = useState(0);

  // Players (static fallback)
  const [players, setPlayers] = useState<Player2026[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player2026[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for static players
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minSalary, setMinSalary] = useState(0);
  const [maxSalary, setMaxSalary] = useState(20000);
  const [minProjection, setMinProjection] = useState(0);
  const [maxProjection, setMaxProjection] = useState(100);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Player props (real data)
  const [playerProps, setPlayerProps] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);
  const [propsError, setPropsError] = useState<string | null>(null);
  const [propBets, setPropBets] = useState<PropBet[]>([]);
  const [filteredPropBets, setFilteredPropBets] = useState<PropBet[]>([]);

  // Sport tabs
  const [selectedSportTab, setSelectedSportTab] = useState('nba');
  const sports = [
    { id: 'nba', name: 'NBA', icon: '🏀', iconComponent: SportsBasketballIcon, status: 'Playoffs' },
    { id: 'nhl', name: 'NHL', icon: '🏒', iconComponent: SportsHockeyIcon, status: 'Playoffs' },
    { id: 'nfl', name: 'NFL', icon: '🏈', iconComponent: SportsFootballIcon, status: 'Offseason' },
    { id: 'mlb', name: 'MLB', icon: '⚾', iconComponent: SportsBaseballIcon, status: 'Regular Season' },
  ];

  // NBA Props tab state
  const [nbaPropsTab, setNbaPropsTab] = useState(0);
  const [nbaPropsFilters, setNbaPropsFilters] = useState<any>({});

  // AI Generator
  const [customQuery, setCustomQuery] = useState('');
  const [generatingLineup, setGeneratingLineup] = useState(false);
  const [lineupResult, setLineupResult] = useState<any>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  // Draft
  const [draftRecommendations, setDraftRecommendations] = useState<any[]>([]);
  const [draftMode, setDraftMode] = useState<'snake' | 'turn'>('snake');
  const [draftPick, setDraftPick] = useState(1);
  const [draftStrategy, setDraftStrategy] = useState('balanced');
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
  const [selectedTeamForDepth, setSelectedTeamForDepth] = useState('');

  // Tank01 Data
  const [injuryList, setInjuryList] = useState<any[]>([]);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [depthCharts, setDepthCharts] = useState<any[]>([]);
  const [todaysGames, setTodaysGames] = useState<any[]>([]);
  const [loadingInjuries, setLoadingInjuries] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [slatePlayers, setSlatePlayers] = useState<Player2026[]>([]);

  // Main tab
  const [mainTab, setMainTab] = useState(0);

  // Filters for prop bets
  const [propsSearch, setPropsSearch] = useState('');
  const [propsTeams, setPropsTeams] = useState<string[]>([]);
  const [propsStatFilter, setPropsStatFilter] = useState('all');
  const [propsMinEdge, setPropsMinEdge] = useState(-100);
  const [propsMaxEdge, setPropsMaxEdge] = useState(100);
  const [showPropsFilters, setShowPropsFilters] = useState(false);

  // Transform playerProps to PropBet[]
  const transformToPropBets = useCallback((rawProps: any[]): PropBet[] => {
    if (!rawProps.length) return [];
    const unique = new Map<string, PropBet>();
    rawProps.forEach(prop => {
      const key = `${prop.player}|${prop.stat_type || prop.stat}|${prop.line}`;
      if (!unique.has(key)) {
        const edge = prop.edge !== undefined ? parseFloat(prop.edge) : (prop.projection && prop.line) ? ((prop.projection - prop.line) / prop.line) * 100 : 0;
        const betType = prop.type === 'Over' || prop.type === 'over' ? 'Over' : prop.type === 'Under' || prop.type === 'under' ? 'Under' : (prop.projection > prop.line ? 'Over' : 'Under');
        unique.set(key, {
          id: prop.id || `prop-${Date.now()}-${Math.random()}`,
          playerName: prop.player,
          team: prop.team || prop.away_team_abbr || prop.home_team_abbr || '??',
          opponent: prop.opponent || (prop.away_team_abbr ? prop.home_team_abbr : prop.away_team_abbr) || 'TBD',
          statType: prop.stat_type || prop.stat || 'points',
          line: parseFloat(prop.line),
          betType,
          odds: prop.odds || -110,
          projection: parseFloat(prop.projection) || prop.line,
          edge,
          confidence: prop.confidence || 70,
          sport: prop.sport || activeSport.toUpperCase(),
          game: prop.game || `${prop.away_team_full || '?'} @ ${prop.home_team_full || '?'}`,
          source: prop.source || 'the-odds-api',
        });
      }
    });
    return Array.from(unique.values());
  }, [activeSport]);

  // Fetch player props with fallback
  const fetchPlayerPropsData = useCallback(async () => {
    setLoadingProps(true);
    setPropsError(null);
    try {
      const today = getTodayString();
      const endpoint = `${NODE_API_BASE}/api/prizepicks/selections?sport=nba&date=${today}&limit=20`;
      const response = await fetch(endpoint);
      
      if (response.status === 429) {
        throw new Error('Rate limited');
      }
      if (!response.ok) throw new Error(`API failed: ${response.status}`);
      
      const result = await response.json();
      const selections = result.selections || [];
      
      if (selections.length > 0) {
        const props = selections.map((sel: any) => ({
          player: sel.player || sel.player_name,
          stat_type: sel.stat || sel.market,
          line: sel.line,
          projection: sel.projection,
          edge: sel.edge_percentage,
          bookmaker: sel.bookmaker || 'Multiple',
          type: sel.type || 'Over'
        }));
        setPlayerProps(props);
        const bets = transformToPropBets(props);
        setPropBets(bets);
        setFilteredPropBets(bets);
      } else {
        useStaticPlayerDataForToday();
      }
    } catch (err) { 
      console.error('Props fetch error:', err);
      setPropsError('API rate limited. Using demo data.');
      useStaticPlayerDataForToday();
    }
    finally { setLoadingProps(false); }
  }, [transformToPropBets]);

  // Helper function to use static data for today's games
  const useStaticPlayerDataForToday = useCallback(() => {
    const playingTeams = teamsPlayingToday;
    let todaysPlayers = NBA_STATIC_PLAYERS.filter(p => playingTeams.has(p.team));
    
    if (todaysPlayers.length === 0 && playingTeams.size > 0) {
      // Create basic player objects for today's teams
      const teamPlayers: Record<string, Array<{name: string, points: number}>> = {
        'ORL': [{name: 'Paolo Banchero', points: 22.5}, {name: 'Franz Wagner', points: 19.5}, {name: 'Jalen Suggs', points: 15.5}],
        'PHI': [{name: 'Joel Embiid', points: 33.0}, {name: 'Tyrese Maxey', points: 25.5}, {name: 'Tobias Harris', points: 17.5}],
        'GSW': [{name: 'Stephen Curry', points: 26.0}, {name: 'Klay Thompson', points: 18.5}, {name: 'Draymond Green', points: 8.5}],
        'LAC': [{name: 'Kawhi Leonard', points: 23.5}, {name: 'Paul George', points: 22.5}, {name: 'James Harden', points: 16.5}],
      };
      
      const mockPlayers: any[] = [];
      playingTeams.forEach(team => {
        const players = teamPlayers[team] || [];
        players.forEach(p => {
          mockPlayers.push({
            player: p.name,
            stat_type: 'points',
            line: p.points - 2,
            projection: p.points,
            edge: 8 + Math.random() * 10,
            bookmaker: 'Playoff Props',
            type: 'Over'
          });
        });
      });
      
      if (mockPlayers.length > 0) {
        setPlayerProps(mockPlayers);
        const bets = transformToPropBets(mockPlayers);
        setPropBets(bets);
        setFilteredPropBets(bets);
        return;
      }
    }
    
    const staticProps = todaysPlayers.map(p => ({
      player: p.name,
      stat_type: 'points',
      line: (p.points || 20) - 2,
      projection: p.points || 20,
      edge: 5 + Math.random() * 15,
      bookmaker: 'Demo Data',
      type: 'Over'
    }));
    setPlayerProps(staticProps);
    const bets = transformToPropBets(staticProps);
    setPropBets(bets);
    setFilteredPropBets(bets);
  }, [teamsPlayingToday, transformToPropBets]);

  // Filter prop bets
  useEffect(() => {
    let filtered = [...propBets];
    if (propsSearch.trim()) {
      const lower = propsSearch.toLowerCase();
      filtered = filtered.filter(pb => pb.playerName.toLowerCase().includes(lower) || pb.team.toLowerCase().includes(lower));
    }
    if (propsTeams.length) filtered = filtered.filter(pb => propsTeams.includes(pb.team));
    if (propsStatFilter !== 'all') filtered = filtered.filter(pb => pb.statType === propsStatFilter);
    filtered = filtered.filter(pb => pb.edge >= propsMinEdge && pb.edge <= propsMaxEdge);
    setFilteredPropBets(filtered);
  }, [propBets, propsSearch, propsTeams, propsStatFilter, propsMinEdge, propsMaxEdge]);

  // Fetch players with today's slate filtering
  const fetchPlayers = useCallback(async () => {
    setIsLoadingPlayers(true);
    setError(null);
    try {
      let data: Player2026[] = [];
      
      if (activeSport === 'nba') {
        data = [...NBA_STATIC_PLAYERS];
      } else if (activeSport === 'mlb') {
        data = [...MLB_STATIC_PLAYERS];
      } else if (activeSport === 'nhl') {
        data = [...NHL_STATIC_PLAYERS];
      } else {
        data = [...NFL_STATIC_PLAYERS];
      }
      
      // Filter to only players whose teams are playing today
      if (teamsPlayingToday.size > 0) {
        const filteredData = data.filter(player => teamsPlayingToday.has(player.team));
        if (filteredData.length > 0) {
          data = filteredData;
        }
      }
      
      if (data.length === 0 && teamsPlayingToday.size > 0) {
        setOfflineMode(true);
      } else {
        setOfflineMode(teamsPlayingToday.size === 0);
      }
      
      setPlayers(data);
      setFilteredPlayers(data);
      setSlatePlayers(data.slice(0, 50));
      
    } catch (err: any) { 
      console.error('Error fetching players:', err);
      setError(err.message); 
    } finally { 
      setIsLoadingPlayers(false); 
    }
  }, [activeSport, teamsPlayingToday]);

  // Initial data load - fetch games first
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setDataReady(false);
      setOfflineMode(false);
      
      // Load static players as baseline
      let allPlayers: Player2026[] = [];
      if (activeSport === 'nba') {
        allPlayers = [...NBA_STATIC_PLAYERS];
      } else if (activeSport === 'mlb') {
        allPlayers = [...MLB_STATIC_PLAYERS];
      } else if (activeSport === 'nhl') {
        allPlayers = [...NHL_STATIC_PLAYERS];
      } else {
        allPlayers = [...NFL_STATIC_PLAYERS];
      }
      
      // Try to fetch today's games
      let games: any[] = [];
      let playingTeams = new Set<string>();
      let hasGamesToday = false;
      
      try {
        games = await fetchGamesWithRetry(activeSport);
        if (games.length > 0) {
          playingTeams = getPlayingTeamsFromGames(games);
          hasGamesToday = true;
          setTodaysGames(games);
          console.log(`Found ${games.length} games today with teams:`, Array.from(playingTeams));
        } else {
          console.log('No games scheduled for today');
          setOfflineMode(true);
        }
      } catch (error) {
        console.error('Failed to fetch games:', error);
        setOfflineMode(true);
      }
      
      setTeamsPlayingToday(playingTeams);
      
      // Filter players based on whether there are games today
      let filteredPlayers = [...allPlayers];
      if (hasGamesToday && playingTeams.size > 0) {
        filteredPlayers = allPlayers.filter(p => playingTeams.has(p.team));
        if (filteredPlayers.length === 0) {
          console.warn('No player data found for today\'s teams, showing all players');
          setOfflineMode(true);
          filteredPlayers = allPlayers;
        }
      } else {
        console.log('No games today - showing all players (off-season mode)');
      }
      
      setPlayers(filteredPlayers);
      setFilteredPlayers(filteredPlayers);
      setSlatePlayers(filteredPlayers.slice(0, 50));
      
      // Try to fetch props data in background
      fetchPlayerPropsData().catch(err => {
        console.error('Props fetch error (non-blocking):', err);
      });
      
      setDataReady(true);
      setLoading(false);
    };
    
    loadData();
  }, [fetchPlayerPropsData, activeSport]);

  // Load saved prop lineups
  useEffect(() => {
    const storageKey = `fantasyHubLineups_${activeSport}_2026_props`;
    const saved = localStorage.getItem(storageKey);
    if (saved) try { setSavedLineups(JSON.parse(saved)); } catch(e) {}
  }, [activeSport]);

  // Handlers for prop lineup
  const handleAddPropBet = (propBet: PropBet) => {
    if (lineupPropBets.filter(b => b !== null).length >= MAX_PLAYERS) { alert('Maximum 9 prop bets'); return; }
    const idx = lineupPropBets.findIndex(b => b === null);
    if (idx === -1) return;
    const newLineup = [...lineupPropBets];
    newLineup[idx] = propBet;
    setLineupPropBets(newLineup);
    let totalProj = 0, totalOdds = 0;
    newLineup.forEach(b => { if (b) { totalProj += b.projection; totalOdds += b.odds; } });
    setTotalProjection(totalProj);
    setTotalOddsValue(totalOdds);
  };
  const handleRemovePropBet = (index: number) => {
    const newLineup = [...lineupPropBets];
    newLineup[index] = null;
    setLineupPropBets(newLineup);
    let totalProj = 0, totalOdds = 0;
    newLineup.forEach(b => { if (b) { totalProj += b.projection; totalOdds += b.odds; } });
    setTotalProjection(totalProj);
    setTotalOddsValue(totalOdds);
  };
  const handleSavePropLineup = () => {
    const saved = { id: `lineup-${Date.now()}`, date: new Date().toISOString(), propBets: lineupPropBets.filter(b => b !== null), totalProjection, totalOddsValue };
    const updated = { ...savedLineups, [saved.id]: saved };
    localStorage.setItem(`fantasyHubLineups_${activeSport}_2026_props`, JSON.stringify(updated));
    setSavedLineups(updated);
    alert('Lineup saved!');
  };
  const handleClearPropLineup = () => {
    if (window.confirm('Clear entire lineup?')) { setLineupPropBets(new Array(MAX_PLAYERS).fill(null)); setTotalProjection(0); setTotalOddsValue(0); }
  };
  const handleLoadPropLineup = (id: string) => {
    const loaded = savedLineups[id];
    if (loaded && loaded.propBets) {
      const newLineup = new Array(MAX_PLAYERS).fill(null);
      loaded.propBets.forEach((bet: PropBet, i: number) => { if (i < MAX_PLAYERS) newLineup[i] = bet; });
      setLineupPropBets(newLineup);
      setTotalProjection(loaded.totalProjection);
      setTotalOddsValue(loaded.totalOddsValue);
      setShowLineupHistory(false);
    }
  };

  // Helper functions for lineup generation
  const getPositionSlot = (index: number, sport: Sport): string => {
    const positions = sport === 'nba'
      ? ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL', 'UTIL']
      : ['C', 'LW', 'RW', 'D', 'D', 'G', 'UTIL', 'UTIL', 'UTIL'];
    return positions[index] || `Slot ${index + 1}`;
  };

  const generateLineupFromPrompt = useCallback(async (
    prompt: string, 
    availablePlayers: Player2026[], 
    sport: Sport, 
    strategy: string
  ): Promise<(Player2026 | null)[]> => {
    const lineup: (Player2026 | null)[] = new Array(MAX_PLAYERS).fill(null);
    const lowerPrompt = prompt.toLowerCase();
    
    let filtered = [...availablePlayers];
    
    // Only filter by today's teams if there are games today
    if (teamsPlayingToday.size > 0) {
      const beforeCount = filtered.length;
      filtered = filtered.filter(player => teamsPlayingToday.has(player.team));
      console.log(`Filtered from ${beforeCount} to ${filtered.length} players based on today's slate`);
    }
    
    if (filtered.length === 0) {
      console.log('No players from today\'s slate, using all players (off-season mode)');
      filtered = [...availablePlayers];
    }
    
    const wantsBestValue = lowerPrompt.includes('value') || lowerPrompt.includes('best value');
    const wantsHighestProjection = lowerPrompt.includes('highest') || lowerPrompt.includes('top') || lowerPrompt.includes('best');
    const wantsBalanced = lowerPrompt.includes('balanced') || (!wantsBestValue && !wantsHighestProjection);
    const wantsSpecificTeam = (() => {
      const teams = ['lakers', 'warriors', 'celtics', 'bucks', 'nuggets', 'suns', 'clippers', 'heat', 'knicks', 'sixers', 'magic', '76ers'];
      return teams.find(team => lowerPrompt.includes(team)) || null;
    })();
    const wantsRookies = lowerPrompt.includes('rookie') || lowerPrompt.includes('young');
    const wantsVeterans = lowerPrompt.includes('veteran') || lowerPrompt.includes('experienced');
    
    if (wantsSpecificTeam) {
      const teamMap: Record<string, string> = {
        'lakers': 'LAL', 'warriors': 'GSW', 'celtics': 'BOS', 'bucks': 'MIL',
        'nuggets': 'DEN', 'suns': 'PHX', 'clippers': 'LAC', 'heat': 'MIA',
        'knicks': 'NYK', 'sixers': 'PHI', '76ers': 'PHI', 'magic': 'ORL'
      };
      const teamAbbr = teamMap[wantsSpecificTeam];
      if (teamAbbr) {
        filtered = filtered.filter(p => p.team === teamAbbr);
      }
    }
    
    if (wantsRookies) {
      filtered = filtered.filter(p => p.is_rookie === true);
    }
    if (wantsVeterans) {
      filtered = filtered.filter(p => p.is_rookie !== true);
    }
    
    if (wantsBestValue || strategy === 'value') {
      filtered.sort((a, b) => b.value - a.value);
    } else if (wantsHighestProjection || strategy === 'projection') {
      filtered.sort((a, b) => b.projection - a.projection);
    } else {
      filtered.sort((a, b) => (b.projection + b.value * 1000) - (a.projection + a.value * 1000));
    }
    
    const positionsNeeded = sport === 'nba' 
      ? ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'UTIL', 'UTIL']
      : ['C', 'LW', 'RW', 'D', 'D', 'G', 'UTIL', 'UTIL', 'UTIL'];
    
    let playerIndex = 0;
    for (let i = 0; i < positionsNeeded.length && playerIndex < filtered.length; i++) {
      lineup[i] = filtered[playerIndex];
      playerIndex++;
    }
    
    return lineup;
  }, [MAX_PLAYERS, teamsPlayingToday]);

  // AI Generator with proper lineup generation
  const handleGenerateFantasyLineup = useCallback(async () => {
    if (!customQuery.trim()) { 
      alert('Please enter a prompt'); 
      return; 
    }
    
    if (generatorCredits <= 0) {
      setShowCreditsModal(true);
      return;
    }
    
    setGeneratingLineup(true);
    setShowGeneratorModal(true);
    
    try {
      if (!user || !token) throw new Error('User not logged in');
      
      const useResponse = await fetch(`${PYTHON_API_BASE}/api/user/generations/decrement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          pickType: 'fantasy_lineup',
          pickData: { 
            prompt: customQuery, 
            sport: activeSport,
            screen: 'FantasyHubScreen',
            strategy: genStrategy
          }
        }),
      });
      
      if (!useResponse.ok) {
        const errorData = await useResponse.json();
        throw new Error(errorData.error || 'Failed to use credit');
      }
      
      const data = await useResponse.json();
      setGeneratorCredits(data.remaining);
      
      const generatedLineup = await generateLineupFromPrompt(customQuery, players, activeSport, genStrategy);
      
      const modeText = teamsPlayingToday.size > 0 ? `from today's slate` : `(off-season mode - showing all players)`;
      setLineupResult({
        success: true,
        analysis: `Generated lineup based on: "${customQuery}". Using ${genStrategy} strategy. Found ${generatedLineup.filter(p => p !== null).length} players ${modeText}.`,
        source: 'AI Generator',
        lineup: {
          slots: generatedLineup.map((player, idx) => {
            if (player) {
              return {
                player: {
                  name: player.name,
                  salary: player.salary,
                  fantasy_projection: player.projection,
                  team: player.team,
                  position: player.position
                },
                position: getPositionSlot(idx, activeSport)
              };
            }
            return null;
          }).filter(Boolean)
        }
      });
      
    } catch (error) {
      console.error('Error generating lineup:', error);
      setLineupResult({ 
        success: false, 
        analysis: error instanceof Error ? error.message : 'Failed to generate lineup. Please try again.' 
      });
    } finally {
      setGeneratingLineup(false);
    }
  }, [customQuery, generatorCredits, user, token, activeSport, genStrategy, players, generateLineupFromPrompt, teamsPlayingToday]);

  // Draft handlers
  const handleSnakeDraft = useCallback(async (pickNumber: number, strategy: string = 'balanced') => {
    setShowDraftModal(true);
    setGeneratingLineup(true);
    
    try {
      let availablePlayers = [...players];
      availablePlayers = availablePlayers.filter(p => p.injury_status === 'Healthy');
      
      if (strategy === 'value') {
        availablePlayers.sort((a, b) => b.value - a.value);
      } else if (strategy === 'projection') {
        availablePlayers.sort((a, b) => b.projection - a.projection);
      } else if (strategy === 'ceiling') {
        availablePlayers.sort((a, b) => (b.ceiling || b.projection) - (a.ceiling || a.projection));
      } else {
        availablePlayers.sort((a, b) => (b.projection + b.value * 1000) - (a.projection + a.value * 1000));
      }
      
      const topPlayers = availablePlayers.slice(0, 3);
      
      const formatted = topPlayers.map((player, idx) => ({
        player: player,
        rank: idx + 1,
        valueScore: player.value,
        reasoning: `Top ${strategy} pick at position ${pickNumber} - ${player.name} has ${strategy === 'value' ? 'excellent' : 'strong'} projections`,
        salaryFD: player.salary,
        salaryDK: player.salary,
        keyFactors: [`${player.projection.toFixed(1)} FP projection`, `${(player.value * 1000).toFixed(0)} value per $1k`, player.injury_status === 'Healthy' ? 'Healthy' : 'Injury risk']
      }));
      
      setDraftResult({ 
        type: 'snake', 
        pickNumber, 
        players: formatted, 
        analysis: `Top ${formatted.length} ${strategy} picks for round ${Math.ceil(pickNumber / 12)} at pick #${pickNumber}` 
      });
      setDraftRecommendations(formatted.map(r => r.player));
      setDraftPick(pickNumber);
      setDraftStrategy(strategy);
      
    } catch (err) {
      console.error('Draft generation error:', err);
      setDraftResult({ 
        type: 'snake', 
        pickNumber, 
        players: [], 
        analysis: `Error generating draft picks. Please try again.` 
      });
    } finally {
      setGeneratingLineup(false);
    }
  }, [players]);

  const handleTurnDraft = useCallback(async (pickNumber: number, strategy: string = 'balanced') => {
    setShowDraftModal(true);
    setGeneratingLineup(true);
    
    try {
      let availablePlayers = [...players];
      availablePlayers = availablePlayers.filter(p => p.injury_status === 'Healthy');
      
      if (strategy === 'value') {
        availablePlayers.sort((a, b) => b.value - a.value);
      } else if (strategy === 'projection') {
        availablePlayers.sort((a, b) => b.projection - a.projection);
      } else if (strategy === 'ceiling') {
        availablePlayers.sort((a, b) => (b.ceiling || b.projection) - (a.ceiling || a.projection));
      } else {
        availablePlayers.sort((a, b) => (b.projection + b.value * 1000) - (a.projection + a.value * 1000));
      }
      
      const topPlayers = availablePlayers.slice(0, 10);
      
      const formatted = topPlayers.map((player, idx) => ({
        player: player,
        rank: idx + 1,
        valueScore: player.value,
        adp: player.adp || 50 + idx * 5,
        expertRank: idx + 1,
        tier: Math.floor(idx / 3) + 1,
        reasoning: `Turn ${pickNumber} pick #${pickNumber + idx} - ${player.name} is a strong ${strategy} selection`,
        salaryFD: player.salary,
        salaryDK: player.salary,
        keyFactors: [`${player.projection.toFixed(1)} FP projection`, `${(player.value * 1000).toFixed(0)} value per $1k`, player.injury_status === 'Healthy' ? 'Healthy' : 'Injury risk']
      }));
      
      setDraftResult({ 
        type: 'turn', 
        pickNumber, 
        players: formatted, 
        analysis: `Top ${formatted.length} ${strategy} players for turn ${Math.ceil(pickNumber / 2)} (picks ${pickNumber}-${pickNumber + 9})` 
      });
      setDraftRecommendations(formatted.map(r => r.player));
      setDraftPick(pickNumber);
      setDraftStrategy(strategy);
      setDraftMode('turn');
      
    } catch (err) {
      console.error('Draft generation error:', err);
      setDraftResult({ 
        type: 'turn', 
        pickNumber, 
        players: [], 
        analysis: `Error generating draft picks. Please try again.` 
      });
    } finally {
      setGeneratingLineup(false);
    }
  }, [players]);

  const handleDraftCommand = useCallback(async (commandString: string) => {
    const parts = commandString.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const num = parts.length > 1 ? parseInt(parts[1], 10) : undefined;
    
    if (cmd === 'snake') { 
      setDraftMode('snake'); 
      await handleSnakeDraft(num || 1, draftStrategy); 
    } else if (cmd === 'turn') { 
      setDraftMode('turn'); 
      await handleTurnDraft(num || 1, draftStrategy); 
    } else if (cmd === 'next' || cmd === 'skip') { 
      const next = (draftPick || 1) + 1; 
      setDraftPick(next); 
      if (draftMode === 'snake') {
        await handleSnakeDraft(next, draftStrategy);
      } else {
        await handleTurnDraft(next, draftStrategy);
      }
    } else if (cmd === 'previous' || cmd === 'back') { 
      const prev = Math.max((draftPick || 1) - 1, 1); 
      setDraftPick(prev); 
      if (draftMode === 'snake') {
        await handleSnakeDraft(prev, draftStrategy);
      } else {
        await handleTurnDraft(prev, draftStrategy);
      }
    } else {
      const snakeMatch = commandString.match(/snake\s+(\d+)/i);
      const turnMatch = commandString.match(/turn\s+(\d+)/i);
      if (snakeMatch) {
        await handleSnakeDraft(parseInt(snakeMatch[1]), draftStrategy);
      } else if (turnMatch) {
        await handleTurnDraft(parseInt(turnMatch[1]), draftStrategy);
      } else {
        alert(`Unknown command: ${commandString}. Try "Snake 12", "Turn 12", "next", or "previous"`);
      }
    }
  }, [draftPick, draftMode, draftStrategy, handleSnakeDraft, handleTurnDraft]);

  // Render components
  const PropBetCard = ({ propBet, onAdd }: { propBet: PropBet; onAdd: () => void }) => {
    const edgeColor = propBet.edge > 5 ? 'success' : propBet.edge < -5 ? 'error' : 'default';
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{propBet.playerName}</Typography>
            <Chip label={propBet.team} size="small" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>vs {propBet.opponent}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={propBet.statType.toUpperCase()} color="primary" size="small" />
            <Chip label={`${propBet.betType} ${propBet.line}`} size="small" variant="outlined" />
            <Chip label={`Multiplier: ${propBet.odds > 0 ? `+${propBet.odds}` : propBet.odds}`} size="small" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption">Projection: {propBet.projection.toFixed(1)}</Typography>
            <Chip label={`Edge: ${propBet.edge.toFixed(1)}%`} size="small" color={edgeColor} />
          </Box>
          <Button variant="contained" fullWidth onClick={onAdd} disabled={lineupPropBets.filter(b => b !== null).length >= MAX_PLAYERS}>Add to Lineup</Button>
        </CardContent>
      </Card>
    );
  };

  const renderPropFilters = () => {
    const allTeams = [...new Set(propBets.map(pb => pb.team))];
    const allStats = [...new Set(propBets.map(pb => pb.statType))];
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">Filter Player Prop</Typography>
          <IconButton onClick={() => setShowPropsFilters(!showPropsFilters)}>{showPropsFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Box>
        <Collapse in={showPropsFilters}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" placeholder="Search player or team" value={propsSearch} onChange={(e) => setPropsSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Team</InputLabel>
                <Select multiple value={propsTeams} onChange={(e) => setPropsTeams(e.target.value as string[])} label="Team" renderValue={(selected) => (selected as string[]).join(', ')}>
                  {allTeams.map(team => <MenuItem key={team} value={team}><Checkbox checked={propsTeams.indexOf(team) > -1} size="small" /><ListItemText primary={team} /></MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Stat Type</InputLabel>
                <Select value={propsStatFilter} onChange={(e) => setPropsStatFilter(e.target.value)} label="Stat Type">
                  <MenuItem value="all">All</MenuItem>
                  {allStats.map(stat => <MenuItem key={stat} value={stat}>{stat}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom variant="caption">Advantage % Range</Typography>
              <Slider value={[propsMinEdge, propsMaxEdge]} onChange={(e, val) => { setPropsMinEdge((val as number[])[0]); setPropsMaxEdge((val as number[])[1]); }} valueLabelDisplay="auto" min={-100} max={100} step={1} />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
    );
  };

  const renderLineupSlots = () => (
    <Grid container spacing={2}>
      {lineupPropBets.map((bet, idx) => (
        <Grid item xs={12} sm={6} md={4} key={idx}>
          <Card variant="outlined" sx={{ bgcolor: bet ? 'success.light' : 'grey.50', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip label={`Slot ${idx+1}`} size="small" color="primary" />
                {bet && <IconButton size="small" onClick={() => handleRemovePropBet(idx)}><ClearIcon fontSize="small" /></IconButton>}
              </Box>
              {bet ? (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>{bet.playerName}</Typography>
                  <Typography variant="caption" color="text.secondary">{bet.team} vs {bet.opponent}</Typography>
                  <Box sx={{ mt: 1 }}><Chip label={`${bet.statType} ${bet.betType} ${bet.line}`} size="small" /><Chip label={`Multiplier: ${bet.odds}`} size="small" sx={{ ml: 1 }} /></Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>Proj: {bet.projection.toFixed(1)} | Advantage: {bet.edge.toFixed(1)}%</Typography>
                </>
              ) : <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>Empty</Typography>}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderLineupSummary = () => (
    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={6}><Typography variant="caption">Total Projection</Typography><Typography variant="h6" color="primary.main">{totalProjection.toFixed(1)}</Typography></Grid>
        <Grid item xs={6}><Typography variant="caption">Avg Multiplier</Typography><Typography variant="h6">{(totalOddsValue / lineupPropBets.filter(b => b !== null).length || 0).toFixed(0)}</Typography></Grid>
      </Grid>
    </Box>
  );

  const renderPropBetsList = () => {
    if (loadingProps) return <CircularProgress />;
    if (propsError) return <Alert severity="error">{propsError}</Alert>;
    
    // Filter prop bets to only players whose teams are playing today
    const todaysPropBets = filteredPropBets.filter(pb => 
      teamsPlayingToday.size === 0 || teamsPlayingToday.has(pb.team)
    );
    
    if (todaysPropBets.length === 0 && teamsPlayingToday.size > 0) {
      return (
        <Alert severity="info">
          No player props available for today's {activeSport.toUpperCase()} slate. Using demo data.
        </Alert>
      );
    }
    
    const displayed = (todaysPropBets.length > 0 ? todaysPropBets : filteredPropBets).slice(0, MAX_VISIBLE_CARDS);
    return (
      <Grid container spacing={3}>
        {displayed.map(pb => <Grid item xs={12} md={4} key={pb.id}><PropBetCard propBet={pb} onAdd={() => handleAddPropBet(pb)} /></Grid>)}
        {(todaysPropBets.length > MAX_VISIBLE_CARDS || filteredPropBets.length > MAX_VISIBLE_CARDS) && (
          <Grid item xs={12}><Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 2 }}>
            +{Math.max(todaysPropBets.length, filteredPropBets.length) - MAX_VISIBLE_CARDS} more props available.
          </Typography></Grid>
        )}
      </Grid>
    );
  };

  const renderSportSelector = () => (
    <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Fantasy Hub '26</Typography>
        <Chip label="Apr 2026" size="small" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600 }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
        {sports.map((s) => {
          const Icon = s.iconComponent;
          return (
            <Button key={s.id} variant={selectedSportTab === s.id ? 'contained' : 'outlined'} onClick={() => { setActiveSport(s.id as Sport); setSelectedSportTab(s.id); setLineupPropBets(new Array(MAX_PLAYERS).fill(null)); setTotalProjection(0); setTotalOddsValue(0); fetchPlayerPropsData(); }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100, py: 1.5 }}>
              <Icon sx={{ fontSize: 24, mb: 0.5 }} /><Typography variant="subtitle2">{s.name}</Typography><Typography variant="caption" sx={{ opacity: 0.8 }}>{s.status}</Typography>
            </Button>
          );
        })}
      </Box>
    </Paper>
  );

  const renderNewsTicker = () => (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'white', borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>📰 Latest News</Typography>
      {loadingNews ? <CircularProgress size={20} sx={{ color: 'white' }} /> : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 1 }}>
          {newsItems.length ? newsItems.map((item, idx) => <Chip key={idx} label={item.title} onClick={() => window.open(item.link, '_blank')} sx={{ bgcolor: 'white', color: 'info.main', cursor: 'pointer' }} />) : <Typography variant="body2">No recent news</Typography>}
        </Box>
      )}
    </Paper>
  );

  const renderLineupGenerator = () => (
    <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}><RocketLaunchIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} /><Typography variant="h4">🚀 AI Lineup Generator</Typography></Box>
      <Typography variant="body1" color="text.secondary" paragraph>Describe the lineup you want – e.g., “best value Lakers + Celtics”, “stack Warriors”, “rookie heavy team”</Typography>
      <Box sx={{ mb: 3 }}><Typography variant="h6" gutterBottom>Quick Prompts</Typography><Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>{["Best value lineup","Highest projection lineup","Balanced team","Stack Lakers players","Rookies only"].map((p,i) => <Chip key={i} label={p} onClick={() => setCustomQuery(p)} icon={<SparklesIcon />} sx={{ backgroundColor: 'primary.light', color: 'white', '&:hover': { backgroundColor: 'primary.main' } }} />)}</Box></Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Draft Commands</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Strategy</InputLabel><Select value={draftStrategy} label="Strategy" onChange={(e) => setDraftStrategy(e.target.value)}><MenuItem value="balanced">Balanced</MenuItem><MenuItem value="value">Value</MenuItem><MenuItem value="projection">Projection</MenuItem><MenuItem value="ceiling">Ceiling</MenuItem></Select></FormControl>
          <Chip label="Snake 12" onClick={() => handleDraftCommand('Snake 12')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
          <Chip label="Snake 33" onClick={() => handleDraftCommand('Snake 33')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
          <Chip label="Turn 12" onClick={() => handleDraftCommand('Turn 12')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
          <Chip label="Turn 33" onClick={() => handleDraftCommand('Turn 33')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
          <Chip label="Next Pick" onClick={() => handleDraftCommand('next')} icon={<SportsBasketballIcon />} color="primary" variant="outlined" />
          <Chip label="Previous Pick" onClick={() => handleDraftCommand('previous')} icon={<SportsBasketballIcon />} color="primary" variant="outlined" />
          <Autocomplete freeSolo size="small" options={['Snake 1','Snake 12','Snake 33','Turn 1','Turn 12','Turn 33','next','previous']} sx={{ width: 200 }} renderInput={(params) => <TextField {...params} label="Draft command" variant="outlined" onKeyDown={(e) => { if (e.key === 'Enter') { handleDraftCommand((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />} />
        </Box>
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Custom Prompt</Typography>
        <TextField fullWidth multiline rows={2} placeholder="e.g., Build a lineup with Suns and Bucks players, prioritize value. You can also type 'Snake 33' here." value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} variant="outlined" sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Strategy</InputLabel>
            <Select value={genStrategy} onChange={(e) => setGenStrategy(e.target.value as any)} label="Strategy">
              <MenuItem value="value">Value Focus</MenuItem>
              <MenuItem value="projection">Projection Focus</MenuItem>
              <MenuItem value="balanced">Balanced</MenuItem>
            </Select>
          </FormControl>
          <Button fullWidth variant="contained" size="large" startIcon={<AutoAwesomeIcon />} onClick={handleGenerateFantasyLineup} disabled={!customQuery.trim() || generatingLineup || generatorCredits <= 0}>
            {generatingLineup ? 'Generating...' : `Generate AI Lineup (${generatorCredits} credits left)`}
          </Button>
        </Box>
        {generatorCredits === 0 && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            ⚠️ You have no generator credits remaining. Purchase credits to generate lineups.
          </Typography>
        )}
      </Box>
      <Alert severity="info" icon={<PsychologyIcon />} sx={{ mt: 2 }}>Uses natural language understanding to create lineups based on your description. Draft commands work here and in the search bar.</Alert>
    </Paper>
  );

  const renderTodaysGames = () => (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        📅 {todaysGames.length > 0 ? `Today's Games (${getTodayString()})` : 'Game Schedule'}
      </Typography>
      {todaysGames.length > 0 ? (
        <Grid container spacing={2}>
          {todaysGames.map((game, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {game.awayTeam || game.away} @ {game.homeTeam || game.home}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {game.gameTime || game.time || 'Time TBD'} ET
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip label={game.awayTeam || game.away} size="small" variant="outlined" />
                    <Chip label="vs" size="small" />
                    <Chip label={game.homeTeam || game.home} size="small" variant="outlined" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          {offlineMode ? (
            <Box>
              <Typography variant="body1">No NBA games scheduled for today.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Showing all players (off-season mode). Check back on game days for slate-specific projections.
              </Typography>
            </Box>
          ) : (
            <Typography>No games scheduled for today. Check back on game days!</Typography>
          )}
        </Alert>
      )}
    </Paper>
  );

  // Render Player Props Table with today's slate filtering
  const renderPlayerPropsTable = () => {
    if (loadingProps) return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress size={40} />
        <Typography sx={{ mt: 2 }}>Loading player props...</Typography>
      </Box>
    );
    
    const todaysPlayers = players.filter(player => teamsPlayingToday.size === 0 || teamsPlayingToday.has(player.team));
    
    if (todaysPlayers.length === 0 && teamsPlayingToday.size > 0) {
      return (
        <Alert severity="warning">
          No player data available for today's teams. Showing all players as fallback.
        </Alert>
      );
    }
    
    const displayPlayers = todaysPlayers.length > 0 ? todaysPlayers : players;
    
    if (displayPlayers.length === 0) {
      return (
        <Alert severity="info">
          No player data available. Please check back later.
        </Alert>
      );
    }
    
    if (propsError || !playerProps.length) {
      return (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            {propsError || `Showing projected stats for ${teamsPlayingToday.size > 0 ? 'today\'s slate' : 'all players'} (${displayPlayers.length} players).`}
            <Button size="small" onClick={fetchPlayerPropsData} sx={{ ml: 2 }}>Refresh</Button>
          </Alert>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Player</strong></TableCell>
                  <TableCell><strong>Team</strong></TableCell>
                  <TableCell><strong>Position</strong></TableCell>
                  <TableCell align="right"><strong>Points</strong></TableCell>
                  <TableCell align="right"><strong>Rebounds</strong></TableCell>
                  <TableCell align="right"><strong>Assists</strong></TableCell>
                  <TableCell align="right"><strong>Fantasy Pts</strong></TableCell>
                  <TableCell align="right"><strong>Salary</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayPlayers.slice(0, 50).map((player, idx) => (
                  <TableRow key={player.id || idx} hover>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.team}</TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell align="right">{player.points?.toFixed(1) || '-'}</TableCell>
                    <TableCell align="right">{player.rebounds?.toFixed(1) || '-'}</TableCell>
                    <TableCell align="right">{player.assists?.toFixed(1) || '-'}</TableCell>
                    <TableCell align="right">
                      <strong>{player.fantasy_points?.toFixed(1) || player.projection?.toFixed(1) || '-'}</strong>
                    </TableCell>
                    <TableCell align="right">${(player.salary || 8000).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      {player.value ? player.value.toFixed(2) : ((player.projection / player.salary) * 1000).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {displayPlayers.length > 50 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              Showing top 50 of {displayPlayers.length} players
            </Typography>
          )}
        </Box>
      );
    }
    
    const uniqueProps = new Map();
    playerProps.forEach(prop => {
      const key = `${prop.player}-${prop.stat_type || prop.stat}-${prop.line}`;
      if (!uniqueProps.has(key)) uniqueProps.set(key, prop);
    });
    const deduped = Array.from(uniqueProps.values());
    const getTeam = (name: string) => players.find(p => p.name?.toLowerCase().includes(name?.toLowerCase() || ''))?.team || '??';
    const [bookFilter, setBookFilter] = useState('all');
    const bookmakers = [...new Set(deduped.map(p => p.bookmaker).filter(Boolean))];
    
    const filtered = deduped.filter(p => {
      const playerTeam = getTeam(p.player);
      if (teamsPlayingToday.size > 0 && !teamsPlayingToday.has(playerTeam)) return false;
      if (propsStatFilter !== 'all' && (p.prop_type || p.stat) !== propsStatFilter) return false;
      const edge = p.edge !== undefined ? parseFloat(p.edge) : (p.projection && p.line) ? ((p.projection - p.line)/p.line)*100 : 0;
      if (edge < propsMinEdge || edge > propsMaxEdge) return false;
      if (bookFilter !== 'all' && p.bookmaker !== bookFilter) return false;
      return true;
    });
    
    return (
      <Box>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">Filter Props</Typography>
            <IconButton onClick={() => setShowPropsFilters(!showPropsFilters)}>
              {showPropsFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showPropsFilters}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stat Type</InputLabel>
                  <Select value={propsStatFilter} onChange={(e) => setPropsStatFilter(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    {[...new Set(deduped.map(p => p.prop_type || p.stat))].map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bookmaker</InputLabel>
                  <Select value={bookFilter} onChange={(e) => setBookFilter(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    {bookmakers.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption">Advantage %</Typography>
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
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="caption">Projection</Typography>
                <Slider 
                  value={[minProjection, maxProjection]} 
                  onChange={(e, val) => { 
                    setMinProjection((val as number[])[0]); 
                    setMaxProjection((val as number[])[1]); 
                  }} 
                  valueLabelDisplay="auto" 
                  min={0} 
                  max={100} 
                  step={0.5} 
                />
              </Grid>
            </Grid>
          </Collapse>
        </Paper>
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Player</strong></TableCell>
                <TableCell><strong>Team</strong></TableCell>
                <TableCell><strong>Stat Type</strong></TableCell>
                <TableCell align="right"><strong>Line</strong></TableCell>
                <TableCell align="right"><strong>Projection</strong></TableCell>
                <TableCell align="right"><strong>Advantage %</strong></TableCell>
                <TableCell><strong>Bookmaker</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.slice(0, 100).map((prop, i) => {
                const edge = prop.edge !== undefined ? parseFloat(prop.edge) : (prop.projection && prop.line) ? ((prop.projection - prop.line)/prop.line)*100 : 0;
                return (
                  <TableRow key={i} hover>
                    <TableCell>{prop.player}</TableCell>
                    <TableCell>{getTeam(prop.player)}</TableCell>
                    <TableCell>{prop.prop_type || prop.stat}</TableCell>
                    <TableCell align="right">{prop.line}</TableCell>
                    <TableCell align="right">{prop.projection?.toFixed(1)}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={`${edge.toFixed(1)}%`} 
                        size="small" 
                        color={edge > 5 ? 'success' : edge < -5 ? 'error' : 'default'} 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell>{prop.bookmaker || 'N/A'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>No props match your filters. Try adjusting them.</Alert>
        )}
      </Box>
    );
  };

  // Loading state
  if (loading && players.length === 0 && todaysGames.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>Loading Fantasy Hub...</Typography>
          <Typography variant="body2" color="text.secondary">Fetching today's games and player data</Typography>
        </Box>
      </Container>
    );
  }

  if (error && players.length === 0 && todaysGames.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          action={<Button color="inherit" size="small" onClick={() => window.location.reload()}>Retry</Button>}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {offlineMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Off-Season / No Games Today</AlertTitle>
          Showing all NBA players. When games are scheduled, the lineup builder will automatically filter to only players playing that day.
        </Alert>
      )}
      
      <Alert severity={generatorCredits > 0 ? "info" : "warning"} sx={{ mb: 3 }}>
        <AlertTitle>{generatorCredits > 0 ? `✨ You have ${generatorCredits} generator credits remaining` : "⚠️ No generator credits left"}</AlertTitle>
        Generating a new lineup uses 1 credit. Viewing player props is free.
        {generatorCredits === 0 && " Purchase credits to generate lineups."}
        <Box sx={{ mt: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setShowCreditsModal(true)} startIcon={<CreditCardIcon />}>Buy Credits</Button>
          <Button size="small" variant="contained" sx={{ ml: 1 }} onClick={() => setShowUpgradeModal(true)}>Upgrade to Premium</Button>
        </Box>
      </Alert>
      
      {renderSportSelector()}
      {renderNewsTicker()}
      {renderTodaysGames()}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab icon={<LineupIcon />} label="Lineup Builder" />
          <Tab icon={<PlayersIcon />} label="Player Props" />
          <Tab icon={<DraftIcon />} label="Draft Center" />
          <Tab icon={<SportsBasketballIcon />} label="NBA Props" />
          <Tab icon={<AssessmentIcon />} label="Projections" />
        </Tabs>
      </Paper>

      {mainTab === 0 && (
        <>
          {renderLineupGenerator()}
          <Paper sx={{ p: 3, mb: 4 }}><Typography variant="h5" gutterBottom>🏀 Player Props</Typography>{renderPropFilters()}{renderPropBetsList()}</Paper>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">📋 Your Player Prop Lineup</Typography>
                  <Box>
                    <IconButton onClick={() => setLineupExpanded(!lineupExpanded)}>
                      {lineupExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Button variant="outlined" size="small" onClick={() => setShowLineupHistory(!showLineupHistory)}>History</Button>
                    <Button variant="contained" size="small" onClick={handleSavePropLineup}>Save</Button>
                    <Button variant="outlined" size="small" onClick={handleClearPropLineup} sx={{ ml: 1 }}>Clear</Button>
                  </Box>
                </Box>
                <Collapse in={lineupExpanded}>
                  {renderLineupSlots()}
                  {renderLineupSummary()}
                </Collapse>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              {showLineupHistory && (
                <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6">Saved Lineups</Typography>
                  {Object.entries(savedLineups).map(([id, saved]) => (
                    <Paper key={id} elevation={0} sx={{ p: 2, mb: 1, cursor: 'pointer' }} onClick={() => handleLoadPropLineup(id)}>
                      <Typography variant="body2">{new Date(saved.date).toLocaleString()}</Typography>
                      <Typography variant="caption">{saved.propBets?.length || 0} props | Proj: {saved.totalProjection?.toFixed(1)}</Typography>
                    </Paper>
                  ))}
                </Paper>
              )}
            </Grid>
          </Grid>
        </>
      )}

      {mainTab === 1 && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>🏀 Player Props</Typography>
            {renderPlayerPropsTable()}
          </Paper>
        </>
      )}
      
      {mainTab === 2 && (
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Draft Center</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Snake 12" onClick={() => handleDraftCommand('Snake 12')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
            <Chip label="Snake 33" onClick={() => handleDraftCommand('Snake 33')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
            <Chip label="Turn 12" onClick={() => handleDraftCommand('Turn 12')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
            <Chip label="Turn 33" onClick={() => handleDraftCommand('Turn 33')} icon={<SportsBasketballIcon />} color="secondary" variant="outlined" />
            <Chip label="Next Pick" onClick={() => handleDraftCommand('next')} icon={<SportsBasketballIcon />} color="primary" variant="outlined" />
            <Chip label="Previous Pick" onClick={() => handleDraftCommand('previous')} icon={<SportsBasketballIcon />} color="primary" variant="outlined" />
          </Box>
          <FormControl size="small" sx={{ minWidth: 200, mb: 3 }}>
            <InputLabel>Strategy</InputLabel>
            <Select value={draftStrategy} onChange={(e) => setDraftStrategy(e.target.value)}>
              <MenuItem value="balanced">Balanced</MenuItem>
              <MenuItem value="value">Value</MenuItem>
              <MenuItem value="projection">Projection</MenuItem>
              <MenuItem value="ceiling">Ceiling</MenuItem>
            </Select>
          </FormControl>
          {draftResult && (
            <Box>
              <Typography variant="h6">{draftResult.type} draft at pick {draftResult.pickNumber}</Typography>
              <Typography variant="body2">{draftResult.analysis}</Typography>
              <Button onClick={() => setShowDraftModal(true)}>View Details</Button>
            </Box>
          )}
        </Paper>
      )}
      
      {mainTab === 3 && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>🏀 NBA Player Props (Card View)</Typography>
            <NBAPropsFilterBar onFilterChange={setNbaPropsFilters} />
            <NBAProps onAddToLineup={()=>{}} allPlayers={players} teamsPlayingToday={teamsPlayingToday} isPlayerInjured={()=>false} sport="nba" />
          </Paper>
        </>
      )}
      
      {mainTab === 4 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>📊 Top Player Projections {teamsPlayingToday.size > 0 ? '(Today\'s Slate)' : '(All Players)'}</Typography>
          {loading || isLoadingPlayers ? <CircularProgress /> : slatePlayers.length === 0 ? <Alert severity="info">No player data available.</Alert> : (
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
                  {slatePlayers.slice(0, 100).map((p,i) => (
                    <TableRow key={p.id}>
                      <TableCell>{i+1}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.team}</TableCell>
                      <TableCell align="right">{p.points?.toFixed(1)}</TableCell>
                      <TableCell align="right">{p.rebounds?.toFixed(1)}</TableCell>
                      <TableCell align="right">{p.assists?.toFixed(1)}</TableCell>
                      <TableCell align="right">{p.projection?.toFixed(1)}</TableCell>
                      <TableCell align="right">${p.salary?.toLocaleString()}</TableCell>
                      <TableCell align="right">{p.value?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Modals */}
      <Dialog open={showCreditsModal} onClose={() => setShowCreditsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#6C5CE7', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCardIcon sx={{ mr: 1 }} /> Purchase Credits
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>Generate lineups with credits. Each generation uses 1 credit.</Typography>
          <Grid container spacing={2}>
            {[{ credits:1, price:'$1.99', perPrediction:'$1.99', desc:'1 Credit' },{ credits:10, price:'$14.90', perPrediction:'$1.49', popular:true, desc:'10 Credits' },{ credits:20, price:'$25.80', perPrediction:'$1.29', desc:'20 Credits' },{ credits:50, price:'$44.50', perPrediction:'$0.89', bestValue:true, desc:'50 Credits' }].map((opt,i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Card sx={{ border: opt.popular ? '2px solid #6C5CE7' : opt.bestValue ? '2px solid #10b981' : '1px solid #e5e7eb', position: 'relative', cursor: 'pointer' }} onClick={() => handleCreditsCheckout(opt.credits)}>
                  {opt.popular && <Chip label="POPULAR" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', bgcolor: '#6C5CE7', color: 'white' }} />}
                  {opt.bestValue && <Chip label="BEST VALUE" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', bgcolor: '#10b981', color: 'white' }} />}
                  <CardContent sx={{ textAlign: 'center', pt: opt.popular || opt.bestValue ? 4 : 2 }}>
                    <Typography variant="h6" fontWeight="bold">{opt.desc}</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>{opt.price}</Typography>
                    <Typography variant="caption" color="text.secondary">{opt.perPrediction} per credit</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={() => setShowCreditsModal(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#6C5CE7', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StarIcon sx={{ mr: 1 }} /> Upgrade to Premium
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>Get unlimited lineup generation and premium features!</Typography>
          <Grid container spacing={2}>
            {[{ planId:'starter', name:'Starter Plan', price:'$5.99/month', features:['Unlimited Lineup Generation','Priority Support'], popular:false },{ planId:'generator', name:'Generator Plan', price:'$39.99/month', features:['Unlimited Lineup Generation','Priority Support','Early Access','8 Daily AI Picks'], popular:true }].map((opt,i) => (
              <Grid item xs={12} key={i}>
                <Card sx={{ border: opt.popular ? '2px solid #6C5CE7' : '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => { navigate('/subscription'); setShowUpgradeModal(false); }}>
                  {opt.popular && <Chip label="POPULAR" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', bgcolor: '#6C5CE7', color: 'white' }} />}
                  <CardContent sx={{ textAlign: 'center', pt: opt.popular ? 4 : 2 }}>
                    <Typography variant="h6" fontWeight="bold">{opt.name}</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>{opt.price}</Typography>
                    <Box sx={{ mt: 2 }}>
                      {opt.features.map((f,idx) => <Typography key={idx} variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>✓ {f}</Typography>)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button onClick={() => setShowUpgradeModal(false)}>Maybe Later</Button>
        </DialogActions>
      </Dialog>

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
                    {draftResult.players.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.rank}</TableCell>
                        <TableCell>{item.player.name}</TableCell>
                        <TableCell>{item.player.team} • {item.player.position}</TableCell>
                        <TableCell align="right">${item.salaryFD}</TableCell>
                        <TableCell align="right">${item.salaryDK}</TableCell>
                        <TableCell align="right">{item.valueScore.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.player.adp?.toFixed(1) || '-'}</TableCell>
                        <TableCell align="right">{item.player.expertRank || '-'}</TableCell>
                        <TableCell align="right">{item.player.ceiling?.toFixed(1)}/{item.player.floor?.toFixed(1)}</TableCell>
                        <TableCell><Chip label={item.reasoning} size="small" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {draftResult.players[0]?.keyFactors.map((f,i) => <Chip key={i} label={f} size="small" variant="outlined" />)}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDraftModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showGeneratorModal} onClose={() => !generatingLineup && setShowGeneratorModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{generatingLineup ? 'Generating AI Lineup...' : 'AI Lineup Generated'}</DialogTitle>
        <DialogContent>
          {generatingLineup ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>Analyzing your request...</Typography>
              <Typography variant="body2" color="text.secondary">Building the optimal lineup from {teamsPlayingToday.size > 0 ? 'today\'s slate' : 'all players'}</Typography>
            </Box>
          ) : (lineupResult && (
            <Box>
              {lineupResult.success ? (
                <>
                  <Typography variant="body1" sx={{ mb: 2 }}>{lineupResult.analysis}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 2 }}>Generated Lineup:</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2, mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Position</TableCell>
                          <TableCell>Player</TableCell>
                          <TableCell>Team</TableCell>
                          <TableCell align="right">Projection</TableCell>
                          <TableCell align="right">Salary</TableCell>
                          <TableCell align="right">Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lineupResult.lineup?.slots.map((slot: any, idx: number) => (
                          <TableRow key={idx} sx={{ bgcolor: slot.player ? 'action.hover' : 'inherit' }}>
                            <TableCell>{slot.position}</TableCell>
                            <TableCell>{slot.player?.name || 'Empty'}</TableCell>
                            <TableCell>{slot.player?.team || '-'}</TableCell>
                            <TableCell align="right">{slot.player?.fantasy_projection?.toFixed(1) || '-'}</TableCell>
                            <TableCell align="right">${slot.player?.salary?.toLocaleString() || '-'}</TableCell>
                            <TableCell align="right">{slot.player ? ((slot.player.fantasy_projection / slot.player.salary) * 1000).toFixed(2) : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="caption" color="text.secondary">Source: {lineupResult.source}</Typography>
                </>
              ) : (
                <Alert severity="warning">{lineupResult.analysis}</Alert>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          {!generatingLineup && lineupResult?.success && (
            <Button 
              onClick={() => { 
                if (lineupResult?.lineup) {
                  const newLineup = new Array(MAX_PLAYERS).fill(null);
                  lineupResult.lineup.slots.forEach((slot: any, idx: number) => {
                    if (slot.player && idx < MAX_PLAYERS) {
                      const propBet: PropBet = {
                        id: `gen-${Date.now()}-${idx}`,
                        playerName: slot.player.name,
                        team: slot.player.team,
                        opponent: 'TBD',
                        statType: 'fantasy_points',
                        line: slot.player.fantasy_projection,
                        betType: 'Over',
                        odds: -110,
                        projection: slot.player.fantasy_projection,
                        edge: 0,
                        confidence: 70,
                        sport: activeSport.toUpperCase(),
                        game: `${slot.player.team} vs TBD`,
                        source: 'AI Generator'
                      };
                      newLineup[idx] = propBet;
                    }
                  });
                  setLineupPropBets(newLineup);
                  let totalProj = 0, totalOdds = 0;
                  newLineup.forEach(b => { if (b) { totalProj += b.projection; totalOdds += b.odds; } });
                  setTotalProjection(totalProj);
                  setTotalOddsValue(totalOdds);
                }
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

// NBA Props Component
const NBAProps = ({ onAddToLineup, allPlayers, teamsPlayingToday, isPlayerInjured, sport }: any) => {
  const [loading, setLoading] = useState(false);
  const eligiblePlayers = useMemo(() => {
    let players = [...allPlayers];
    if (teamsPlayingToday.size > 0) {
      players = players.filter(p => teamsPlayingToday.has(p.team));
    }
    players = players.filter(p => !isPlayerInjured(p));
    players = players.filter(p => p.projection > 0 && p.salary > 0);
    players.sort((a, b) => b.projection - a.projection);
    return players.slice(0, MAX_VISIBLE_CARDS);
  }, [allPlayers, teamsPlayingToday, isPlayerInjured]);
  
  if (loading) return <CircularProgress />;
  if (eligiblePlayers.length === 0) {
    return (
      <Alert severity="info">
        {teamsPlayingToday.size > 0 ? 'No players from today\'s slate available.' : 'No player props available.'}
      </Alert>
    );
  }
  
  const renderStatGrid = (player: Player2026) => {
    if (sport === 'nba') return (
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}><Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}><Typography variant="caption">Points</Typography><Typography variant="h6">{player.points?.toFixed(1) || '-'}</Typography></Paper></Grid>
        <Grid item xs={4}><Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}><Typography variant="caption">Rebounds</Typography><Typography variant="h6">{player.rebounds?.toFixed(1) || '-'}</Typography></Paper></Grid>
        <Grid item xs={4}><Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.100' }}><Typography variant="caption">Assists</Typography><Typography variant="h6">{player.assists?.toFixed(1) || '-'}</Typography></Paper></Grid>
      </Grid>
    );
    return null;
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>🏀 Top {eligiblePlayers.length} Players by Projection</Typography>
      <Grid container spacing={3}>
        {eligiblePlayers.map((player) => {
          const valuePer1k = ((player.projection / player.salary) * 1000).toFixed(2);
          return (
            <Grid item xs={12} md={4} key={player.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box><Typography variant="h6" sx={{ fontWeight: 700 }}>{player.name}</Typography><Typography variant="body2" color="text.secondary">{player.team} • {player.position}</Typography></Box>
                    <Chip label={`$${player.salary?.toLocaleString()}`} size="small" color="primary" />
                  </Box>
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'white', textAlign: 'center' }}>
                    <Typography variant="caption">Projected Fantasy Points</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>{player.projection?.toFixed(1)}</Typography>
                    <Typography variant="caption">Value: {valuePer1k}/1K salary</Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Projected Stats</Typography>
                  {renderStatGrid(player)}
                  {player.injury_status && player.injury_status !== 'Healthy' && <Chip label={`Status: ${player.injury_status}`} size="small" color="error" variant="outlined" sx={{ mb: 2, width: '100%' }} />}
                  <Button variant="contained" size="medium" fullWidth onClick={() => onAddToLineup({ id: player.id, name: player.name, team: player.team, position: player.position, salary: player.salary, fantasy_projection: player.projection, points: player.points, assists: player.assists, rebounds: player.rebounds, goals: (player as any).goals })} disabled={player.injury_status !== 'Healthy'}>
                    + Add to Lineup
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

// Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode; componentName?: string }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: any) { console.error(`[ErrorBoundary:${this.props.componentName || 'unknown'}]`, error, errorInfo); }
  render() {
    if (this.state.hasError) return this.props.fallback || (<Alert severity="error" sx={{ m: 2 }}><Typography variant="h6">Component Error: {this.props.componentName}</Typography><Typography variant="body2">{this.state.error?.message}</Typography></Alert>);
    return this.props.children;
  }
}

export default FantasyHubScreen;
