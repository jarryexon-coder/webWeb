// FantasyHubScreen.tsx – with collapsible sections, generator settings, multi‑lineup generation,
// AI natural language lineup generator, player props filter bar, and new odds section
// FIXED: Uses real player data from Balldontlie / SportsData.io, odds from /api/odds/games

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
  Divider,
  CircularProgress,
  Alert,
  Collapse,
  RadioGroup,
  Radio,
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
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // for odds
import { useTheme } from '@mui/material/styles';

// Import your existing components (NBAProps/NHLProps are now replaced with custom component)
import FantasyHubDashboard from '../components/FantasyHub/FantasyHubDashBoard';
import FantasyLineupBuilder from '../components/FantasyHub/FantasyLineupBuilder';
import PlayerTrends from '../components/FantasyHub/PlayerTrends';

import { 
  Player, 
  Sport, 
  FantasyLineup, 
  LineupSlot 
} from '../types/fantasy.types';

// ============= ENVIRONMENT VARIABLE SAFE ACCESS ==========
const getApiBase = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  return 'https://python-api-fresh-production.up.railway.app';
};
const API_BASE = getApiBase();

// ============= ERROR BOUNDARY COMPONENT =============
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
// =====================================================

// ============= WRAPPERS FOR LOGGING =============
const PlayerTrendsWrapper = (props: any) => {
  console.log('[PlayerTrends] Rendering with props:', props);
  return <PlayerTrends {...props} />;
};
// =================================================

// ============= TEMPORARY MOCK API OBJECT =============
const api = {
  loadLineup: () => {
    console.warn('api.loadLineup() called - returning null');
    return null;
  },
  saveLineup: () => console.warn('api.saveLineup() called'),
  clearLineup: () => console.warn('api.clearLineup() called')
};
// ======================================================

// Types for 2026 data structures
export interface Player2026 {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: 'NBA' | 'NHL' | 'NFL' | 'MLB';
  salary: number;           // FanDuel salary (e.g., 3500 - 15000)
  fantasy_points: number;
  projection: number;       // projected fantasy points
  value: number;            // projection / salary * 1000
  points?: number;
  rebounds?: number;
  assists?: number;
  goals?: number;
  is_rookie?: boolean;
  note?: string;
  trend?: '🔥 Hot' | '📈 Rising' | '🎯 Value' | '❄️ Cold';
  injury_status?: string;
}

// Odds types
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

interface FantasyHubScreenProps {
  initialSport?: Sport;
}

const SALARY_CAP = 50000;   // FanDuel typical cap
const MAX_PLAYERS = 9;

// Helper to create an empty lineup for a given sport
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

const FantasyHubScreen: React.FC<FantasyHubScreenProps> = ({ initialSport = 'nba' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // ============= SUBJECT 1 STATE =============
  const [activeSport, setActiveSport] = useState<Sport>(initialSport);
  const [lineup, setLineup] = useState<FantasyLineup>(() => createEmptyLineup(initialSport));
  const [loading, setLoading] = useState<boolean>(true);
  const [savedLineups, setSavedLineups] = useState<Record<string, FantasyLineup>>({});
  const [showLineupHistory, setShowLineupHistory] = useState<boolean>(false);

  // ============= COLLAPSIBLE SECTIONS =============
  const [propsExpanded, setPropsExpanded] = useState(true);
  const [trendsExpanded, setTrendsExpanded] = useState(true);
  const [lineupExpanded, setLineupExpanded] = useState(true);
  const [playerGridExpanded, setPlayerGridExpanded] = useState(true);
  const [oddsExpanded, setOddsExpanded] = useState(true); // new odds section
  const [propsFiltersExpanded, setPropsFiltersExpanded] = useState(false);

  // ============= GENERATOR SETTINGS =============
  const [genStrategy, setGenStrategy] = useState<'value' | 'projection' | 'balanced'>('value');
  const [genCount, setGenCount] = useState<number>(5);
  const [ignoreFilters, setIgnoreFilters] = useState<boolean>(false);
  const [generatedLineups, setGeneratedLineups] = useState<FantasyLineup[]>([]);
  const [currentLineupIndex, setCurrentLineupIndex] = useState<number>(0);

  // ============= SUBJECT 2 STATE - ORIGINAL FILTERING SYSTEM =============
  const [players, setPlayers] = useState<Player2026[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player2026[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states (for player grid)
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
  
  // ============= NEW FILTERS FOR PLAYER PROPS SECTION =============
  const [propsSearch, setPropsSearch] = useState('');
  const [propsTeams, setPropsTeams] = useState<string[]>([]);
  const [propsPositions, setPropsPositions] = useState<string[]>([]);
  const [propsMinSalary, setPropsMinSalary] = useState(3000);
  const [propsMaxSalary, setPropsMaxSalary] = useState(15000);
  const [propsMinProjection, setPropsMinProjection] = useState(0);
  const [propsMaxProjection, setPropsMaxProjection] = useState(60);
  
  // ============= ODDS STATE =============
  const [oddsGames, setOddsGames] = useState<OddsGame[]>([]);
  const [loadingOdds, setLoadingOdds] = useState(false);
  const [oddsError, setOddsError] = useState<string | null>(null);

  // ============= FEBRUARY 2026 ENHANCEMENTS =============
  const [selectedSportTab, setSelectedSportTab] = useState('nba');

  // Sports tabs configuration
  const sports = [
    { id: 'nba', name: 'NBA', icon: '🏀', iconComponent: SportsBasketballIcon, status: 'All-Star Break' },
    { id: 'nhl', name: 'NHL', icon: '🏒', iconComponent: SportsHockeyIcon, status: 'Trade Deadline T-24d' },
    { id: 'nfl', name: 'NFL', icon: '🏈', iconComponent: SportsFootballIcon, status: 'Offseason' },
    { id: 'mlb', name: 'MLB', icon: '⚾', iconComponent: SportsBaseballIcon, status: 'Spring Training' },
  ];

  // ============= AI LINEUP GENERATOR STATE =============
  const [customQuery, setCustomQuery] = useState('');
  const [generatingLineup, setGeneratingLineup] = useState(false);
  const [lineupResult, setLineupResult] = useState<any>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  // ============= FETCH PLAYERS FROM BACKEND =============
  const fetchPlayers = useCallback(async () => {
    setIsLoadingPlayers(true);
    setError(null);

    try {
      // Updated URL to include realtime=true as per File 1 example
      const url = `${API_BASE}/api/fantasy/players?sport=${activeSport}&realtime=true&limit=100`;
      console.log('[FETCH] Fetching players from:', url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('[FETCH] Received data:', data);

      let playersArray = [];
      if (Array.isArray(data)) {
        playersArray = data;
      } else if (data.success && Array.isArray(data.players)) {
        playersArray = data.players;
      } else if (Array.isArray(data.data)) {
        playersArray = data.data;
      } else {
        console.warn('[FETCH] Unexpected API response format:', data);
        playersArray = [];
      }

      const enhancedPlayers = playersArray.map((player: any, index: number) => {
        // Map FanDuel salary: try fanduel_salary first, then salary, default 5000
        const salary = player.fanduel_salary || player.salary || 5000;
        // Map projection: use fantasy_points (from API) or projection or projected_points
        const projection = player.fantasy_points || player.projection || player.projected_points || 0;
        // Calculate value (points per $1000)
        const value = salary > 0 ? (projection / salary) * 1000 : 0;

        const enhanced = {
          ...player,
          id: player.id || `player-${Date.now()}-${index}`,
          name: player.name || 'Unknown Player',
          team: player.team || 'N/A',
          position: player.position || 'N/A',
          salary,
          projection,
          value,
          points: player.points || 0,
          rebounds: player.rebounds || 0,
          assists: player.assists || 0,
          injury_status: player.injury_status || 'Healthy',
          sport: activeSport.toUpperCase(),
          is_rookie: player.is_rookie || false,
        };
        if (index === 0) console.log('[FETCH] First enhanced player:', enhanced);
        return enhanced;
      });

// Deduplicate players by name + team, keep the one with highest salary
const uniqueMap = new Map<string, Player2026>();
enhancedPlayers.forEach(player => {
  const key = `${player.name}-${player.team}`;
  const existing = uniqueMap.get(key);
  if (!existing || player.salary > existing.salary) {
    uniqueMap.set(key, player);
  }
});
const uniquePlayers = Array.from(uniqueMap.values());
setPlayers(uniquePlayers);
setFilteredPlayers(uniquePlayers);

      // Update filter ranges
      const salaries = enhancedPlayers.map((p: Player2026) => p.salary).filter(Boolean);
      const projections = enhancedPlayers.map((p: Player2026) => p.projection).filter(Boolean);
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

      const uniqueTeams = [...new Set(enhancedPlayers.map((p: Player2026) => p.team).filter(Boolean))];
      setSelectedTeams([]);
      setPropsTeams([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players');
      console.error('[FETCH] Error fetching players:', err);
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [activeSport]);

  // ============= FETCH ODDS =============
  const fetchOdds = useCallback(async () => {
    setLoadingOdds(true);
    setOddsError(null);
    try {
      // Map sport to format expected by odds endpoint (basketball_nba, etc.)
      const sportMap: Record<string, string> = {
        nba: 'basketball_nba',
        nfl: 'americanfootball_nfl',
        mlb: 'baseball_mlb',
        nhl: 'icehockey_nhl'
      };
      const oddsSport = sportMap[activeSport] || activeSport;
      const url = `${API_BASE}/api/odds/games?sport=${oddsSport}&limit=10`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.games)) {
        setOddsGames(data.games);
      } else {
        setOddsGames([]);
      }
    } catch (err) {
      setOddsError(err instanceof Error ? err.message : 'Failed to load odds');
      console.error('[ODDS] Error:', err);
    } finally {
      setLoadingOdds(false);
    }
  }, [activeSport]);

  useEffect(() => {
    fetchPlayers();
    fetchOdds(); // fetch odds when sport changes
  }, [fetchPlayers, fetchOdds]);

  // ============= SUBJECT 1 EFFECTS =============
  useEffect(() => {
    loadInitialData();
  }, [activeSport]);

  const loadInitialData = async (): Promise<void> => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[LINEUP] Current lineup state:', lineup);
  }, [lineup]);

  // ============= SUBJECT 1 HANDLERS =============
  const handleAddPlayer = (player: Player): void => {
    console.log('[handleAddPlayer] Called with player:', player);
    
    if (!player.id) console.warn('[handleAddPlayer] Player missing id');
    if (!player.salary) console.warn('[handleAddPlayer] Player missing salary');
    if (!player.fantasy_projection && player.fantasy_projection !== 0) 
      console.warn('[handleAddPlayer] Player missing fantasy_projection');

    const playerSalary = player.salary || 0;

    const filledSlots = lineup.slots.filter(slot => slot.player !== null).length;
    console.log('[handleAddPlayer] Filled slots:', filledSlots, 'Remaining cap:', lineup.remaining_cap);

    if (filledSlots >= MAX_PLAYERS) {
      alert('Maximum 9 players per lineup');
      return;
    }

    if (playerSalary > lineup.remaining_cap) {
      alert(`Insufficient salary cap. Need $${(playerSalary - lineup.remaining_cap).toLocaleString()} more.`);
      return;
    }

    const emptySlotIndex = lineup.slots.findIndex(slot => slot.player === null);
    if (emptySlotIndex === -1) {
      console.warn('[handleAddPlayer] No empty slot found');
      return;
    }

    const newSlots = [...lineup.slots];
    newSlots[emptySlotIndex] = {
      ...newSlots[emptySlotIndex],
      player
    };

    const totalSalary = newSlots.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
    const totalProjection = newSlots.reduce((sum, slot) => sum + (slot.player?.fantasy_projection || 0), 0);

    const updatedLineup = {
      ...lineup,
      slots: newSlots,
      total_salary: totalSalary,
      total_projection: totalProjection,
      remaining_cap: SALARY_CAP - totalSalary,
      updated_at: new Date().toISOString()
    };

    console.log('[handleAddPlayer] Setting new lineup:', updatedLineup);
    setLineup(updatedLineup);
  };

  const handleRemovePlayer = (playerId: string): void => {
    console.log('[handleRemovePlayer] Removing player with id:', playerId);
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
    console.log('[handleSaveLineup] Saving lineup');
    const updatedHistory = {
      ...savedLineups,
      [lineup.id || `lineup-${Date.now()}`]: lineup
    };
    localStorage.setItem(`fantasyHubLineups_${activeSport}_2026`, JSON.stringify(updatedHistory));
    setSavedLineups(updatedHistory);
    alert('Lineup saved successfully!');
  };

  const handleClearLineup = (): void => {
    console.log('[handleClearLineup] Clearing lineup');
    if (window.confirm('Clear your entire lineup?')) {
      setLineup(createEmptyLineup(activeSport));
    }
  };

  const handleLoadLineup = (lineupId: string): void => {
    console.log('[handleLoadLineup] Loading lineup id:', lineupId);
    const lineupToLoad = savedLineups[lineupId];
    if (lineupToLoad) {
      setLineup(lineupToLoad);
      setShowLineupHistory(false);
    }
  };

  const handleEnterContest = (): void => {
    const filledSlots = lineup.slots.filter(slot => slot.player !== null).length;
    console.log('[handleEnterContest] Filled slots:', filledSlots);
    if (filledSlots < MAX_PLAYERS) {
      alert(`Please fill all ${MAX_PLAYERS} positions before entering a contest`);
      return;
    }
    navigate('/contests', { state: { lineup, sport: activeSport } });
  };

  // ============= ENHANCED LINEUP GENERATOR =============
  const handleGenerateLineup = () => {
    console.log('[Generate] Generating optimal lineups...');
    const pool = ignoreFilters ? players : filteredPlayers;
    if (pool.length === 0) {
      alert('No players available to generate lineups.');
      return;
    }
    const lineups = generateMultipleLineups(pool, activeSport, genStrategy, genCount);
    if (lineups.length > 0) {
      setGeneratedLineups(lineups);
      setCurrentLineupIndex(0);
      setLineup(lineups[0]); // show first
    } else {
      alert('Could not generate any valid lineups with the current player pool.');
    }
  };

  const canPlayPosition = (playerPos: string, slotPos: string, sport: Sport): boolean => {
    if (sport === 'nba') {
      switch (slotPos) {
        case 'PG': return playerPos === 'PG';
        case 'SG': return playerPos === 'SG';
        case 'SF': return playerPos === 'SF';
        case 'PF': return playerPos === 'PF';
        case 'C': return playerPos === 'C';
        case 'G': return playerPos === 'PG' || playerPos === 'SG';
        case 'F': return playerPos === 'SF' || playerPos === 'PF';
        case 'UTIL': return true;
        default: return playerPos === slotPos;
      }
    } else {
      switch (slotPos) {
        case 'C': return playerPos === 'C';
        case 'LW': return playerPos === 'LW';
        case 'RW': return playerPos === 'RW';
        case 'D': return playerPos === 'D';
        case 'G': return playerPos === 'G';
        case 'UTIL': return playerPos !== 'G';
        default: return playerPos === slotPos;
      }
    }
  };

const generateSingleLineup = (playerPool: Player2026[], sport: Sport, strategy: string): FantasyLineup | null => {
  // Create a mutable copy of the full player pool
  let availablePlayers = [...playerPool];

  // Sort according to strategy using actual player stats
  if (strategy === 'value') {
    availablePlayers.sort((a, b) => (b.value || 0) - (a.value || 0));
  } else if (strategy === 'projection') {
    availablePlayers.sort((a, b) => (b.projection || 0) - (a.projection || 0));
  } else if (strategy === 'balanced') {
    // Weighted combination
    availablePlayers.sort((a, b) => {
      const scoreA = (a.value || 0) * 0.5 + (a.projection || 0) * 0.5;
      const scoreB = (b.value || 0) * 0.5 + (b.projection || 0) * 0.5;
      return scoreB - scoreA;
    });
  }

  const newSlots = createEmptyLineup(sport).slots;
  let remainingCap = SALARY_CAP;
  const usedIds = new Set<string>();

  for (let i = 0; i < newSlots.length; i++) {
    const slot = newSlots[i];

    // Find the first eligible player from the sorted, full list
    const playerIndex = availablePlayers.findIndex(p =>
      !usedIds.has(p.id) &&
      p.salary <= remainingCap &&
      canPlayPosition(p.position, slot.position, sport)
    );

    if (playerIndex === -1) {
      console.warn(`[Generate] No eligible player found for slot ${slot.position} under cap $${remainingCap}`);
      continue; // skip this slot but try to fill others
    }

    const selectedPlayer = availablePlayers[playerIndex];
    usedIds.add(selectedPlayer.id);
    availablePlayers.splice(playerIndex, 1); // remove from pool

    // Assign the FULL player object to the slot
    // Spread all fields and ensure fantasy_projection is set (if needed by your Player type)
    slot.player = {
      ...selectedPlayer,
      fantasy_projection: selectedPlayer.projection, // map projection to fantasy_projection if required
    };
    remainingCap -= selectedPlayer.salary;
  }

  const totalSalary = SALARY_CAP - remainingCap;
  const totalProjection = newSlots.reduce(
    (sum, slot) => sum + (slot.player?.fantasy_projection || 0),
    0
  );

  // If no players were added, return null
  if (usedIds.size === 0) return null;

  return {
    id: `lineup-${Date.now()}-${Math.random()}`,
    sport,
    slots: newSlots,
    total_salary: totalSalary,
    total_projection: totalProjection,
    remaining_cap: remainingCap,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

  const generateMultipleLineups = (
    playerPool: Player2026[],
    sport: Sport,
    strategy: string,
    count: number
  ): FantasyLineup[] => {
    const lineups: FantasyLineup[] = [];
    // Copy pool to manipulate
    let poolCopy = [...playerPool];

    for (let n = 0; n < count; n++) {
      const lineup = generateSingleLineup(poolCopy, sport, strategy);
      if (lineup) {
        lineups.push(lineup);
        // Remove selected players from pool to get diversity
        const usedIds = new Set(lineup.slots.map(s => s.player?.id).filter(Boolean));
        poolCopy = poolCopy.filter(p => !usedIds.has(p.id));
      } else {
        break; // no more lineups possible
      }
    }
    return lineups;
  };

  // Navigation through generated lineups
  const handlePrevLineup = () => {
    if (currentLineupIndex > 0) {
      const newIndex = currentLineupIndex - 1;
      setCurrentLineupIndex(newIndex);
      setLineup(generatedLineups[newIndex]);
    }
  };

  const handleNextLineup = () => {
    if (currentLineupIndex < generatedLineups.length - 1) {
      const newIndex = currentLineupIndex + 1;
      setCurrentLineupIndex(newIndex);
      setLineup(generatedLineups[newIndex]);
    }
  };

  // ============= AI NATURAL LANGUAGE LINEUP GENERATOR =============
const filterPlayersByQuery = (pool: Player2026[], query: string): Player2026[] => {
  const lower = query.toLowerCase();
  let filtered = pool; // start with full player objects

  // Team filters (common abbreviations)
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
    // add more as needed
  };
  for (const [key, codes] of Object.entries(teamMap)) {
    if (lower.includes(key)) {
      filtered = filtered.filter(p => codes.includes(p.team));
    }
  }

  // Position filters
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

  // Rookie filter
  if (lower.includes('rookie') || lower.includes('rookies')) {
    filtered = filtered.filter(p => p.is_rookie === true);
  }

  return filtered;
};

  const determineStrategyFromQuery = (query: string): 'value' | 'projection' | 'balanced' => {
    const lower = query.toLowerCase();
    if (lower.includes('value') || lower.includes('bargain') || lower.includes('cheap')) return 'value';
    if (lower.includes('projection') || lower.includes('high score') || lower.includes('best') || lower.includes('top')) return 'projection';
    return 'balanced';
  };

const handleGenerateFantasyLineup = async () => {
  if (!customQuery.trim()) {
    alert('Please enter a lineup prompt');
    return;
  }
  setGeneratingLineup(true);
  setShowGeneratorModal(true);
  try {
    // Skip API and go straight to local fallback
    const pool = filterPlayersByQuery(players, customQuery);
    if (pool.length === 0) {
      setLineupResult({
        success: false,
        analysis: `No players match your query: "${customQuery}". Try different keywords.`,
      });
    } else {
      const strategy = determineStrategyFromQuery(customQuery);
      const lineups = generateMultipleLineups(pool, activeSport, strategy, 1);
      if (lineups.length > 0) {
        const newLineup = lineups[0];
        setLineup(newLineup);
        setLineupResult({
          success: true,
          analysis: `🎯 Lineup generated based on your query using ${strategy} strategy.`,
          lineup: newLineup,
          source: 'Local Generator',
        });
      } else {
        setLineupResult({
          success: false,
          analysis: 'Could not generate a valid lineup with the current player pool.',
        });
      }
    }
  } finally {
    setGeneratingLineup(false);
  }
};

  // ============= FILTERING LOGIC FOR PLAYER GRID =============
  // Derived ranges for sliders
  const allPositions = useMemo(() => [...new Set(players.map(p => p.position).filter(Boolean))].sort(), [players]);
  const allTeams = useMemo(() => [...new Set(players.map(p => p.team).filter(Boolean))].sort(), [players]);
  const salaryRange = useMemo(() => {
    if (players.length === 0) return [0, 20000];
    const salaries = players.map(p => p.salary).filter(Boolean);
    return [Math.min(...salaries), Math.max(...salaries)];
  }, [players]);
  const projectionRange = useMemo(() => {
    if (players.length === 0) return [0, 100];
    const projections = players.map(p => p.projection).filter(Boolean);
    return [Math.min(...projections), Math.max(...projections)];
  }, [players]);
  const pointsRange = useMemo(() => {
    if (players.length === 0) return [0, 50];
    const points = players.map(p => p.points || 0).filter(Boolean);
    return [Math.min(...points), Math.max(...points)];
  }, [players]);
  const reboundsRange = useMemo(() => {
    if (players.length === 0) return [0, 20];
    const rebounds = players.map(p => p.rebounds || 0).filter(Boolean);
    return [Math.min(...rebounds), Math.max(...rebounds)];
  }, [players]);
  const assistsRange = useMemo(() => {
    if (players.length === 0) return [0, 15];
    const assists = players.map(p => p.assists || 0).filter(Boolean);
    return [Math.min(...assists), Math.max(...assists)];
  }, [players]);

  const resetFilters = () => {
    console.log('[FILTER] Resetting filters');
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

  useEffect(() => {
    if (players.length === 0) return;
    
    let filtered = [...players];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
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
    
    filtered = filtered.filter(player =>
      (player.points || 0) >= minPoints && (player.points || 0) <= maxPoints
    );
    filtered = filtered.filter(player =>
      (player.rebounds || 0) >= minRebounds && (player.rebounds || 0) <= maxRebounds
    );
    filtered = filtered.filter(player =>
      (player.assists || 0) >= minAssists && (player.assists || 0) <= maxAssists
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
        case 'points':
          aValue = a.points || 0;
          bValue = b.points || 0;
          break;
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          return sortOrder === 'desc' 
            ? (bValue as string).localeCompare(aValue as string)
            : (aValue as string).localeCompare(bValue as string);
        default:
          aValue = a.value || 0;
          bValue = b.value || 0;
      }
      if (sortOrder === 'desc') {
        return (bValue as number) - (aValue as number);
      } else {
        return (aValue as number) - (bValue as number);
      }
    });
    
    setFilteredPlayers(filtered);
    console.log('[FILTER] Filtered players count:', filtered.length);
  }, [
    players,
    searchQuery,
    sortBy,
    sortOrder,
    minSalary,
    maxSalary,
    minProjection,
    maxProjection,
    minPoints,
    maxPoints,
    minRebounds,
    maxRebounds,
    minAssists,
    maxAssists,
    selectedPositions,
    selectedTeams
  ]);

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

  const handleSportChange = (sportId: Sport) => {
    console.log('[SPORT] Changing sport to:', sportId);
    setActiveSport(sportId);
    setSelectedSportTab(sportId);
    setLineup(createEmptyLineup(sportId));
  };

  // ============= FILTER FUNCTIONS FOR PROPS SECTION =============
  const getFilteredPropsPlayers = (): Player2026[] => {
    return players.filter(p => {
      // Search
      if (propsSearch && !p.name.toLowerCase().includes(propsSearch.toLowerCase()) &&
          !p.team.toLowerCase().includes(propsSearch.toLowerCase())) {
        return false;
      }
      // Teams
      if (propsTeams.length > 0 && !propsTeams.includes(p.team)) return false;
      // Positions
      if (propsPositions.length > 0 && !propsPositions.includes(p.position)) return false;
      // Salary
      if (p.salary < propsMinSalary || p.salary > propsMaxSalary) return false;
      // Projection
      if (p.projection < propsMinProjection || p.projection > propsMaxProjection) return false;
      return true;
    });
  };

  const resetPropsFilters = () => {
    setPropsSearch('');
    setPropsTeams([]);
    setPropsPositions([]);
    setPropsMinSalary(salaryRange[0]);
    setPropsMaxSalary(salaryRange[1]);
    setPropsMinProjection(projectionRange[0]);
    setPropsMaxProjection(projectionRange[1]);
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

  // ============= AI LINEUP GENERATOR UI =============
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

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Custom Prompt</Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="e.g., Build a lineup with Suns and Bucks players, prioritize value"
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
        Uses natural language understanding to create lineups based on your description.
      </Alert>
    </Paper>
  );

  // ============= PROPS FILTER BAR =============
  const renderPropsFilterBar = () => {
    const allTeamsList = allTeams;
    const allPositionsList = allPositions;

    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon fontSize="small" /> Filter Player Props
          </Typography>
          <IconButton onClick={() => setPropsFiltersExpanded(!propsFiltersExpanded)} size="small">
            {propsFiltersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
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
                <Badge badgeContent={getFilteredPropsPlayers().length} color="primary">
                  <Typography variant="body2">Players: {getFilteredPropsPlayers().length}</Typography>
                </Badge>
              </Box>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>
    );
  };

  // ============= NEW COMPONENT: Filtered Player Props =============
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
        {players.slice(0, 6).map((player) => ( // Show top 6 for brevity, can adjust
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

  // ============= NEW: ODDS SECTION =============
  const renderOddsSection = () => {
    const hasOdds = oddsGames.length > 0;
    return (
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
          {loadingOdds ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : oddsError ? (
            <Alert severity="error">{oddsError}</Alert>
          ) : !hasOdds ? (
            <Alert severity="info">No odds available for today's games.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Matchup</TableCell>
                    <TableCell align="center">Moneyline</TableCell>
                    <TableCell align="center">Spread</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell align="center">Book</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {oddsGames.slice(0, 5).map((game) => {
                    // Pick the first bookmaker (e.g., FanDuel) for simplicity
                    const book = game.bookmakers[0];
                    if (!book) return null;
                    const h2h = book.markets.find(m => m.key === 'h2h');
                    const spreads = book.markets.find(m => m.key === 'spreads');
                    const totals = book.markets.find(m => m.key === 'totals');
                    return (
                      <TableRow key={game.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {game.away_team} @ {game.home_team}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(game.commence_time).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {h2h ? (
                            <>
                              <div>{h2h.outcomes[0].name}: {h2h.outcomes[0].price}</div>
                              <div>{h2h.outcomes[1].name}: {h2h.outcomes[1].price}</div>
                            </>
                          ) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          {spreads ? (
                            <>
                              <div>{spreads.outcomes[0].point} ({spreads.outcomes[0].price})</div>
                              <div>{spreads.outcomes[1].point} ({spreads.outcomes[1].price})</div>
                            </>
                          ) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          {totals ? (
                            <>
                              <div>O {totals.outcomes[0].point} ({totals.outcomes[0].price})</div>
                              <div>U {totals.outcomes[1].point} ({totals.outcomes[1].price})</div>
                            </>
                          ) : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={book.title} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Collapse>
      </Paper>
    );
  };

  // ============= LOADING & ERROR STATES =============
  if (loading || (isLoadingPlayers && players.length === 0)) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>Loading 2026 season data...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={fetchPlayers}>Retry</Button>}>
          Error loading players: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {renderSportSelector()}
      
      {/* AI Lineup Generator */}
      {renderLineupGenerator()}
      
<ErrorBoundary componentName="FantasyHubDashboard">
  <Box sx={{ mb: 4 }}>
    <FantasyHubDashboard 
      sport={activeSport} 
      lineup={lineup} 
      onAddPlayer={handleAddPlayer}
      onRemovePlayer={handleRemovePlayer}
      onClearLineup={handleClearLineup}
      allPlayers={players}   // ← critical: pass the deduplicated player list
    />
  </Box>
</ErrorBoundary>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Props Section with Filter Bar */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {activeSport === 'nba' ? '🏀 NBA Player Props' : '🏒 NHL Player Props'}
              </Typography>
              <IconButton onClick={() => setPropsExpanded(!propsExpanded)}>
                {propsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            {/* Filter bar for props */}
            {renderPropsFilterBar()}
            <Collapse in={propsExpanded}>
              <Box sx={{ mt: 2 }}>
                <ErrorBoundary componentName="FilteredPlayerProps">
                  <FilteredPlayerProps 
                    players={getFilteredPropsPlayers()} 
                    onAddToLineup={handleAddPlayer} 
                  />
                </ErrorBoundary>
              </Box>
            </Collapse>
          </Paper>
        </Grid>
        
        {/* Trending Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>📈 Trending Players</Typography>
              <IconButton onClick={() => setTrendsExpanded(!trendsExpanded)}>
                {trendsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={trendsExpanded}>
              <Box sx={{ mt: 2 }}>
                <ErrorBoundary componentName="PlayerTrends">
                  <PlayerTrendsWrapper sport={activeSport} onSelectPlayer={handleAddPlayer} />
                </ErrorBoundary>
              </Box>
            </Collapse>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Lineup Builder Section */}
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
                <Button variant="outlined" size="small" onClick={() => setShowLineupHistory(!showLineupHistory)} startIcon={<FilterListIcon />}>
                  History
                </Button>
                {/* Generator Settings Panel (compact) */}
                <Paper variant="outlined" sx={{ p: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={genStrategy}
                      onChange={(e) => setGenStrategy(e.target.value as any)}
                      displayEmpty
                    >
                      <MenuItem value="value">Value</MenuItem>
                      <MenuItem value="projection">Projection</MenuItem>
                      <MenuItem value="balanced">Balanced</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    type="number"
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    inputProps={{ min: 1, max: 10 }}
                    sx={{ width: 70 }}
                  />
                  <FormControlLabel
                    control={<Checkbox size="small" checked={ignoreFilters} onChange={(e) => setIgnoreFilters(e.target.checked)} />}
                    label="All"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleGenerateLineup}
                    startIcon={<AutoAwesomeIcon />}
                    disabled={(ignoreFilters ? players : filteredPlayers).length === 0}
                  >
                    Generate
                  </Button>
                </Paper>
                {/* Navigation between generated lineups */}
                {generatedLineups.length > 1 && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton size="small" onClick={handlePrevLineup} disabled={currentLineupIndex === 0}>
                      <ExpandMoreIcon sx={{ transform: 'rotate(90deg)' }} />
                    </IconButton>
                    <Typography variant="caption">
                      {currentLineupIndex + 1}/{generatedLineups.length}
                    </Typography>
                    <IconButton size="small" onClick={handleNextLineup} disabled={currentLineupIndex === generatedLineups.length - 1}>
                      <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)' }} />
                    </IconButton>
                  </Box>
                )}
                <Button variant="contained" size="small" onClick={handleSaveLineup} disabled={lineup.slots.filter(s => s.player !== null).length === 0}>
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
      
      {/* Header and Filters */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <SportsBasketballIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              🏀 {selectedSportTab === 'nba' ? 'NBA' : selectedSportTab === 'nhl' ? 'NHL' : selectedSportTab === 'nfl' ? 'NFL' : 'MLB'} Fantasy Players
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {players.length} players • Advanced filtering • Real-time data
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
          <Chip label={`${filteredPlayers.length} of ${players.length} players`} color={filteredPlayers.length < players.length ? "warning" : "success"} variant="outlined" />
          <Chip label="Python API Connected" color="primary" variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => { fetchPlayers(); loadInitialData(); }}>Refresh</Button>
          <Button variant={showFilters ? "contained" : "outlined"} startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)} color="secondary">
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {/* Quick Reset Filters button */}
          <Button variant="outlined" startIcon={<ClearIcon />} onClick={resetFilters} size="small">
            Reset Filters
          </Button>
        </Box>
      </Box>
      
      {/* Filter Panel */}
      {showFilters && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TuneIcon /> Advanced Filters</Typography>
            <Button startIcon={<ClearIcon />} onClick={resetFilters} size="small">Reset All</Button>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Search Players" placeholder="Search by name, team, or position..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                  endAdornment: searchQuery && (<InputAdornment position="end"><IconButton onClick={() => setSearchQuery('')} size="small"><ClearIcon /></IconButton></InputAdornment>),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                    <MenuItem value="value">Value Score</MenuItem>
                    <MenuItem value="projection">Projection</MenuItem>
                    <MenuItem value="salary">Salary</MenuItem>
                    <MenuItem value="points">Points</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<SortIcon />} onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} sx={{ whiteSpace: 'nowrap' }}>
                  {sortOrder === 'asc' ? 'Asc ↑' : 'Desc ↓'}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Salary Range: ${minSalary.toLocaleString()} - ${maxSalary.toLocaleString()}</Typography>
              <Slider value={[minSalary, maxSalary]} onChange={(e, newValue) => { setMinSalary((newValue as number[])[0]); setMaxSalary((newValue as number[])[1]); }} valueLabelDisplay="auto" min={salaryRange[0]} max={salaryRange[1]} step={100} sx={{ mt: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Projection Range: {minProjection.toFixed(1)} - {maxProjection.toFixed(1)}</Typography>
              <Slider value={[minProjection, maxProjection]} onChange={(e, newValue) => { setMinProjection((newValue as number[])[0]); setMaxProjection((newValue as number[])[1]); }} valueLabelDisplay="auto" min={projectionRange[0]} max={projectionRange[1]} step={1} sx={{ mt: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Points: {minPoints.toFixed(1)} - {maxPoints.toFixed(1)}</Typography>
              <Slider value={[minPoints, maxPoints]} onChange={(e, newValue) => { setMinPoints((newValue as number[])[0]); setMaxPoints((newValue as number[])[1]); }} valueLabelDisplay="auto" min={pointsRange[0]} max={pointsRange[1]} step={0.5} sx={{ mt: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Rebounds: {minRebounds.toFixed(1)} - {maxRebounds.toFixed(1)}</Typography>
              <Slider value={[minRebounds, maxRebounds]} onChange={(e, newValue) => { setMinRebounds((newValue as number[])[0]); setMaxRebounds((newValue as number[])[1]); }} valueLabelDisplay="auto" min={reboundsRange[0]} max={reboundsRange[1]} step={0.5} sx={{ mt: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Assists: {minAssists.toFixed(1)} - {maxAssists.toFixed(1)}</Typography>
              <Slider value={[minAssists, maxAssists]} onChange={(e, newValue) => { setMinAssists((newValue as number[])[0]); setMaxAssists((newValue as number[])[1]); }} valueLabelDisplay="auto" min={assistsRange[0]} max={assistsRange[1]} step={0.5} sx={{ mt: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Positions</Typography>
              <FormGroup row>
                {allPositions.map((position) => (
                  <FormControlLabel key={position} control={<Checkbox checked={selectedPositions.includes(position)} onChange={() => togglePosition(position)} size="small" />} label={position} />
                ))}
              </FormGroup>
              {selectedPositions.length === 0 && <Typography variant="caption" color="text.secondary">All positions selected</Typography>}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Teams</Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto', p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                <FormGroup>
                  {allTeams.map((team) => (
                    <FormControlLabel key={team} control={<Checkbox checked={selectedTeams.includes(team)} onChange={() => toggleTeam(team)} size="small" />} label={team} />
                  ))}
                </FormGroup>
              </Box>
              {selectedTeams.length === 0 && <Typography variant="caption" color="text.secondary">All teams selected</Typography>}
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Player Grid with Collapsible */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Player List</Typography>
          <IconButton onClick={() => setPlayerGridExpanded(!playerGridExpanded)}>
            {playerGridExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={playerGridExpanded}>
          {filteredPlayers.length > 0 ? (
            <Grid container spacing={3}>
              {filteredPlayers.map((player) => (
                <Grid item key={player.id} xs={12} sm={6} md={4} lg={3}>
                  <PlayerCard 
                    player={player} 
                    onAddToLineup={() => {
                      console.log('[PlayerCard] Add button clicked for:', player.name);
                      handleAddPlayer({
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
                      });
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No players found matching your filters. Try adjusting your criteria or 
              <Button size="small" onClick={resetFilters} sx={{ ml: 1 }}>reset filters</Button>.
            </Alert>
          )}
        </Collapse>
      </Paper>

      {/* Generator Result Modal */}
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

// PlayerCard Component (unchanged)
const PlayerCard = ({ player, onAddToLineup }: { player: Player2026; onAddToLineup: () => void }) => (
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
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={4}><Typography variant="caption" color="text.secondary">Points</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{player.points?.toFixed(1) || '0.0'}</Typography></Grid>
        <Grid item xs={4}><Typography variant="caption" color="text.secondary">Rebounds</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{player.rebounds?.toFixed(1) || '0.0'}</Typography></Grid>
        <Grid item xs={4}><Typography variant="caption" color="text.secondary">Assists</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{player.assists?.toFixed(1) || '0.0'}</Typography></Grid>
      </Grid>
      <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label={player.injury_status || 'Healthy'} size="small" color={player.injury_status === 'Healthy' ? 'success' : 'error'} variant="outlined" />
        {player.note && <Tooltip title={player.note}><Chip label="Note" size="small" color="info" variant="outlined" /></Tooltip>}
        <Button size="small" variant="contained" onClick={onAddToLineup} sx={{ fontSize: '0.75rem' }}>+ Add</Button>
      </Box>
    </CardContent>
  </Card>
);

export default FantasyHubScreen;
