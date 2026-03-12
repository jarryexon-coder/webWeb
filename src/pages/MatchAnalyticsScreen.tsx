// src/pages/MatchAnalyticsScreen.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Search,
  SportsBasketball,
  SportsFootball,
  SportsHockey,
  SportsBaseball,
  CalendarToday,
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
  Update as UpdateIcon,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';

// Import React Query hook
import { usePrizepicksSelections } from '../hooks/useunifiedAPI';

// ================= Environment variables =================
const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY;
const PRIZEPICKS_API_BASE = import.meta.env.VITE_API_BASE_URL;        // used by usePrizepicksSelections internally
const PYTHON_API_BASE = import.meta.env.VITE_PYTHON_API_URL || '';    // Python API for MLB/NHL

// ================= Team‑to‑sport mappings (fallback) =================
const NBA_TEAMS = new Set([
  'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
  'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
  'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'
]);

const NHL_TEAMS = new Set([
  'ANA', 'ARI', 'BOS', 'BUF', 'CAR', 'CBJ', 'CGY', 'CHI', 'COL', 'DAL',
  'DET', 'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NJD', 'NSH', 'NYI', 'NYR',
  'OTT', 'PHI', 'PIT', 'SEA', 'SJS', 'STL', 'TBL', 'TOR', 'UTA', 'VAN',
  'VGK', 'WPG', 'WSH'
]);

const MLB_TEAMS = new Set([
  'ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET',
  'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK',
  'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'
]);

const NFL_TEAMS = new Set([
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN',
  'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC', 'LAR', 'LV', 'MIA',
  'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB',
  'TEN', 'WAS'
]);

// ================= Sport aliases =================
const SPORT_ALIASES: Record<string, string[]> = {
  nba: ['nba', 'basketball'],
  nhl: ['nhl', 'hockey'],
  mlb: ['mlb', 'baseball'],
  nfl: ['nfl', 'football'],
};

// ================= Helper functions =================
const getTeamColor = (teamName: string): string => {
  if (!teamName) return '#3b82f6';
  const teamColors: Record<string, string> = {
    // NBA
    LAL: '#552583', GSW: '#1D428A', BOS: '#007A33', MIA: '#98002E',
    MIL: '#00471B', PHX: '#1D1160', DAL: '#00538C', UTA: '#002B5C',
    // NFL
    KC: '#E31837', BAL: '#241773', SF: '#AA0000', GB: '#203731',
    BUF: '#00338D', CIN: '#FB4F14',
    // NHL
    NYR: '#0038A8', BOS: '#000000', CHI: '#CF0A2C', LAK: '#111111',
    // MLB
    NYY: '#132448', BOS_MLB: '#BD3039', LAD: '#005A9C', CHC: '#0E3386',
  };
  const abbr = teamName.substring(0, 3).toUpperCase();
  const abbr2 = teamName.substring(0, 2).toUpperCase();
  return teamColors[abbr] || teamColors[abbr2] || '#3b82f6';
};

const getGameStatus = (status: string): string => {
  if (!status) return 'Scheduled';
  const s = status.toLowerCase();
  if (s.includes('live') || s.includes('in') || s === 'live') return 'Live';
  if (s.includes('final') || s.includes('complete') || s === 'final') return 'Final';
  return 'Scheduled';
};

const extractTeamName = (teamStr: string): string => {
  if (!teamStr) return 'Unknown';
  return teamStr.replace(/^[A-Z]{2,3}\s+/, '').replace(/\s+\([A-Z]{2,3}\)$/, '').trim() || teamStr;
};

const extractTeamAbbreviation = (teamStr: string): string => {
  const map: Record<string, string> = {
    // NBA full names
    'atlanta hawks': 'ATL',
    'boston celtics': 'BOS',
    'brooklyn nets': 'BKN',
    'charlotte hornets': 'CHA',
    'chicago bulls': 'CHI',
    'cleveland cavaliers': 'CLE',
    'dallas mavericks': 'DAL',
    'denver nuggets': 'DEN',
    'detroit pistons': 'DET',
    'golden state warriors': 'GSW',
    'houston rockets': 'HOU',
    'indiana pacers': 'IND',
    'los angeles clippers': 'LAC',
    'los angeles lakers': 'LAL',
    'memphis grizzlies': 'MEM',
    'miami heat': 'MIA',
    'milwaukee bucks': 'MIL',
    'minnesota timberwolves': 'MIN',
    'new orleans pelicans': 'NOP',
    'new york knicks': 'NYK',
    'oklahoma city thunder': 'OKC',
    'orlando magic': 'ORL',
    'philadelphia 76ers': 'PHI',
    'phoenix suns': 'PHX',
    'portland trail blazers': 'POR',
    'sacramento kings': 'SAC',
    'san antonio spurs': 'SAS',
    'toronto raptors': 'TOR',
    'utah jazz': 'UTA',
    'washington wizards': 'WAS',
    // Common nicknames
    lakers: 'LAL',
    warriors: 'GSW',
    celtics: 'BOS',
    heat: 'MIA',
    bucks: 'MIL',
    suns: 'PHX',
    mavericks: 'DAL',
    jazz: 'UTA',
    // NFL
    chiefs: 'KC',
    ravens: 'BAL',
    niners: 'SF',
    packers: 'GB',
    bills: 'BUF',
    bengals: 'CIN',
    // NHL
    rangers: 'NYR',
    bruins: 'BOS',
    blackhawks: 'CHI',
    kings: 'LAK',
    // MLB
    yankees: 'NYY',
    redsox: 'BOS_MLB',
    dodgers: 'LAD',
    cubs: 'CHC',
  };
  const lower = teamStr.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  // Fallback: take first three uppercase characters
  const match = teamStr.match(/[A-Z]{2,3}/);
  return match ? match[0] : teamStr.substring(0, 3).toUpperCase();
};

// ================= API Fetching Helpers =================
const fetchOddsGames = async (sportKey: string, apiKey: string) => {
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Odds API error: ${response.status}`);
  return response.json();
};

// NHL games from Python API (with enhanced logging)
const fetchNHLGames = async (date: string) => {
  if (!PYTHON_API_BASE) throw new Error('Python API URL not configured (VITE_PYTHON_API_URL)');
  console.log(`🏒 Fetching NHL games for date: ${date} from ${PYTHON_API_BASE}/api/nhl/games`);
  const response = await fetch(`${PYTHON_API_BASE}/api/nhl/games?date=${date}`);
  if (!response.ok) throw new Error(`NHL API error: ${response.status}`);
  const data = await response.json();
  console.log(`🏒 NHL games response:`, data);
  if (data.games && data.games.length > 0) {
    console.log('🏒 First NHL game:', data.games[0]);
  } else {
    console.warn('🏒 No NHL games returned for', date);
  }
  return data.games || [];
};

// MLB games from Python API (with logging)
const fetchMLBGames = async (date: string) => {
  if (!PYTHON_API_BASE) throw new Error('Python API URL not configured (VITE_PYTHON_API_URL)');
  console.log(`⚾ Fetching MLB games for date: ${date} from ${PYTHON_API_BASE}/api/mlb/games`);
  const response = await fetch(`${PYTHON_API_BASE}/api/mlb/games?date=${date}`);
  if (!response.ok) throw new Error(`MLB API error: ${response.status}`);
  const data = await response.json();
  console.log(`⚾ MLB games response:`, data);
  if (data.games && data.games.length > 0) {
    console.log('⚾ First MLB game:', data.games[0]);
  } else {
    console.warn('⚾ No MLB games returned for', date);
  }
  return data.games || [];
};

const mergeOddsWithGames = (games: any[], oddsGames: any[]) => {
  const oddsMap = new Map();
  oddsGames.forEach(og => {
    oddsMap.set(og.home_team, og);
    oddsMap.set(og.away_team, og);
  });
  games.forEach(game => {
    const homeTeam = game.homeTeam?.name || game.home_team?.name || game.home;
    const oddsGame = oddsMap.get(homeTeam);
    if (oddsGame) {
      game.odds = oddsGame;
    }
  });
};

const getUniqueDatesFromSelections = (selections: any[]): Set<string> => {
  const dates = new Set<string>();
  selections.forEach((sel: any) => {
    if (sel.game_time) {
      try {
        const parsed = parseISO(sel.game_time);
        if (isValid(parsed)) {
          dates.add(format(parsed, 'yyyy-MM-dd'));
        } else {
          // Try new Date() as fallback
          const fallback = new Date(sel.game_time);
          if (!isNaN(fallback.getTime())) {
            dates.add(format(fallback, 'yyyy-MM-dd'));
          }
        }
      } catch (e) {
        // ignore
      }
    }
  });
  // If no valid dates found, default to today
  if (dates.size === 0) {
    dates.add(format(new Date(), 'yyyy-MM-dd'));
  }
  return dates;
};

// ================= Main Component =================
const MatchAnalyticsScreen = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'nhl' | 'mlb'>('nba');

  const prizepicks = usePrizepicksSelections();
  const {
    data: prizePicksData,
    isLoading: selectionsLoading,
    error: selectionsError,
    refetch,
    isRefetching,
  } = prizepicks.usePrizepicksSelectionsQuery(selectedSport);

  const selectionsFromApi = prizePicksData?.selections || [];

  // ========== Log selections for debugging ==========
  useEffect(() => {
    if (selectionsFromApi.length > 0) {
      console.log(`📦 ${selectedSport.toUpperCase()} selections received:`, selectionsFromApi.slice(0, 3));
      const hasSportField = selectionsFromApi.some((s: any) => s.sport || s.league);
      console.log(`🔍 Selections contain sport/league field?`, hasSportField);
      console.log('Sample selection sport values:', selectionsFromApi.slice(0,5).map(s => ({
        player: s.player,
        sport: s.sport,
        league: s.league,
        team: s.team,
        teamAbbr: extractTeamAbbreviation(s.team || '')
      })));
    }
  }, [selectionsFromApi, selectedSport]);

  // ========== Sport‑specific game data states ==========
  const [nbaGamesData, setNbaGamesData] = useState<any[]>([]);
  const [nbaGamesLoading, setNbaGamesLoading] = useState(false);
  const [nbaGamesError, setNbaGamesError] = useState<string | null>(null);

  const [nhlGamesData, setNhlGamesData] = useState<any[]>([]);
  const [nhlGamesLoading, setNhlGamesLoading] = useState(false);
  const [nhlGamesError, setNhlGamesError] = useState<string | null>(null);

  const [mlbGamesData, setMlbGamesData] = useState<any[]>([]);
  const [mlbGamesLoading, setMlbGamesLoading] = useState(false);
  const [mlbGamesError, setMlbGamesError] = useState<string | null>(null);

  // Refs to prevent infinite loop
  const lastFetchedKeyRef = useRef<string>('');

  // Compute a stable key based on the set of dates from selections
  const datesKey = useMemo(() => {
    const dates = getUniqueDatesFromSelections(selectionsFromApi);
    return `${selectedSport}|${Array.from(dates).sort().join(',')}`;
  }, [selectionsFromApi, selectedSport]);

  // ========== Fetch games based on selected sport and datesKey ==========
  useEffect(() => {
    let isMounted = true;

    const fetchGames = async () => {
      if (lastFetchedKeyRef.current === datesKey) {
        return;
      }

      if (selectedSport === 'nba') {
        setNbaGamesData([]);
        setNbaGamesError(null);
      } else if (selectedSport === 'nhl') {
        setNhlGamesData([]);
        setNhlGamesError(null);
      } else if (selectedSport === 'mlb') {
        setMlbGamesData([]);
        setMlbGamesError(null);
      }

      try {
        if (!ODDS_API_KEY) throw new Error('Odds API key missing');

        if (selectedSport === 'nba') {
          setNbaGamesLoading(true);
          const games = await fetchOddsGames('basketball_nba', ODDS_API_KEY);
          if (isMounted) {
            setNbaGamesData(games);
            lastFetchedKeyRef.current = datesKey;
          }
        } else if (selectedSport === 'nhl') {
          setNhlGamesLoading(true);
          const [firstDate] = datesKey.split('|')[1].split(',');
          console.log(`📅 Fetching NHL games for date: ${firstDate}`);
          const nhlGames = await fetchNHLGames(firstDate);
          if (isMounted) {
            setNhlGamesData(nhlGames);
            lastFetchedKeyRef.current = datesKey;
          }
        } else if (selectedSport === 'mlb') {
          setMlbGamesLoading(true);
          const [firstDate] = datesKey.split('|')[1].split(',');
          console.log(`📅 Fetching MLB games for date: ${firstDate}`);
          const mlbGames = await fetchMLBGames(firstDate);
          if (isMounted) {
            setMlbGamesData(mlbGames);
            lastFetchedKeyRef.current = datesKey;
          }
        } else if (selectedSport === 'nfl') {
          // NFL may be added later – for now just set the key
          if (isMounted) {
            lastFetchedKeyRef.current = datesKey;
          }
        }
      } catch (err: any) {
        if (isMounted) {
          if (selectedSport === 'nba') setNbaGamesError(err.message);
          else if (selectedSport === 'nhl') setNhlGamesError(err.message);
          else if (selectedSport === 'mlb') setMlbGamesError(err.message);
          console.error(`Failed to fetch ${selectedSport} games:`, err);
        }
      } finally {
        if (isMounted) {
          if (selectedSport === 'nba') setNbaGamesLoading(false);
          else if (selectedSport === 'nhl') setNhlGamesLoading(false);
          else if (selectedSport === 'mlb') setMlbGamesLoading(false);
        }
      }
    };

    fetchGames();

    return () => {
      isMounted = false;
    };
  }, [datesKey, selectedSport]);

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showPrompts, setShowPrompts] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('conditions');
  const [filteredGames, setFilteredGames] = useState<any[]>([]);

  // ================= Transform selections into games, enriched with sport‑specific game data =================
  const games = useMemo(() => {
    if (!selectionsFromApi.length) {
      return [];
    }

    // Determine the correct team set for the selected sport
    let teamSet: Set<string> | null = null;
    if (selectedSport === 'nba') teamSet = NBA_TEAMS;
    else if (selectedSport === 'nhl') teamSet = NHL_TEAMS;
    else if (selectedSport === 'mlb') teamSet = MLB_TEAMS;
    else if (selectedSport === 'nfl') teamSet = NFL_TEAMS;

    // 🎯 FILTER selections using sport/league field with aliases, and double‑check team abbreviation
    const filteredSelections = selectionsFromApi.filter((sel: any) => {
      const selSportRaw = (sel.sport || sel.league || '').toLowerCase().trim();
      const teamAbbr = extractTeamAbbreviation(sel.team || '').toUpperCase();

      // If sport field exists
      if (selSportRaw) {
        const aliases = SPORT_ALIASES[selectedSport] || [selectedSport];
        if (aliases.includes(selSportRaw)) {
          // Sport matches, but verify team if we have a teamSet
          if (teamSet && !teamSet.has(teamAbbr)) {
            console.log(`🧪 Filter [${selectedSport}]: ${sel.player} | team: ${teamAbbr} | sport: "${selSportRaw}" matches alias BUT team not in ${selectedSport} set => DROP`);
            return false;
          }
          console.log(`🧪 Filter [${selectedSport}]: ${sel.player} | team: ${teamAbbr} | sport: "${selSportRaw}" matches alias and team valid => KEEP`);
          return true;
        }
        // Sport field exists but doesn't match any alias
        console.log(`🧪 Filter [${selectedSport}]: ${sel.player} | team: ${teamAbbr} | sport: "${selSportRaw}" does not match any alias for ${selectedSport} => DROP`);
        return false;
      }

      // No sport field: fallback to team abbreviation set
      if (teamSet && teamSet.has(teamAbbr)) {
        console.log(`🧪 Filter [${selectedSport}]: ${sel.player} | team: ${teamAbbr} | no sport field, team in set => KEEP`);
        return true;
      }
      console.log(`🧪 Filter [${selectedSport}]: ${sel.player} | team: ${teamAbbr} | no sport field, team not in set => DROP`);
      return false;
    });

    console.log(`🎯 Filtered selections for ${selectedSport}: ${filteredSelections.length} of ${selectionsFromApi.length}`);
    if (filteredSelections.length === 0) {
      console.warn(`⚠️ No selections left after filtering for ${selectedSport}`);
    }

    let gameData: any[] = [];
    if (selectedSport === 'nba') gameData = nbaGamesData;
    else if (selectedSport === 'nhl') gameData = nhlGamesData;
    else if (selectedSport === 'mlb') gameData = mlbGamesData;

    console.log(`🎮 ${selectedSport.toUpperCase()} gameData length:`, gameData.length);

    // Create a lookup map: key = team identifier + date -> game object
    const gameByTeamDate = new Map();

    gameData.forEach((game: any) => {
      let homeNames: string[] = [];
      let awayNames: string[] = [];
      let gameDate: string;

      if (selectedSport === 'nba') {
        const homeFull = game.home_team;
        const awayFull = game.away_team;
        const homeAbbr = extractTeamAbbreviation(homeFull);
        const awayAbbr = extractTeamAbbreviation(awayFull);
        homeNames = [homeFull, homeAbbr];
        awayNames = [awayFull, awayAbbr];
        gameDate = format(parseISO(game.commence_time), 'yyyy-MM-dd');
      } else if (selectedSport === 'nhl') {
        homeNames = [game.home_abbrev, game.home_team];
        awayNames = [game.away_abbrev, game.away_team];
        // 🛠️ FIX: Use 'date' field, with fallback to today if missing
        gameDate = game.date;
        if (!gameDate) {
          console.warn('⚠️ NHL game missing date, using fallback today:', game);
          gameDate = format(new Date(), 'yyyy-MM-dd');
        }
      } else if (selectedSport === 'mlb') {
        homeNames = [game.home_abbrev, game.home_full];
        awayNames = [game.away_abbrev, game.away_full];
        gameDate = game.game_date;
      }

      [...homeNames, ...awayNames].forEach(teamId => {
        if (teamId) {
          const key = `${teamId}|${gameDate}`;
          gameByTeamDate.set(key, game);
        }
      });
    });

    console.log(`🔍 ${selectedSport.toUpperCase()} game map keys:`, Array.from(gameByTeamDate.keys()));

    const gameMap = new Map(); // key -> our internal game object

    filteredSelections.forEach((selection: any) => {
      try {
        const playerTeamRaw = selection.team || selection.teamAbbrev || 'Unknown';
        const playerTeamAbbr = extractTeamAbbreviation(playerTeamRaw);
        const playerTeamName = extractTeamName(playerTeamRaw);

        // ========== IMPROVED DATE PARSING with fallback to today ==========
        let gameTime = null;
        if (selection.game_time) {
          try {
            // Try ISO first
            gameTime = parseISO(selection.game_time);
            if (!isValid(gameTime)) {
              // Fallback to Date constructor
              const fallback = new Date(selection.game_time);
              if (!isNaN(fallback.getTime())) {
                gameTime = fallback;
              } else {
                console.warn('❌ Invalid game_time format:', selection.game_time);
              }
            }
          } catch (e) {
            console.warn('❌ Error parsing game_time:', selection.game_time, e);
          }
        }

        // If no valid gameTime, default to today
        if (!gameTime) {
          gameTime = new Date();
          console.log(`📅 No game_time for ${selection.player} (${playerTeamAbbr}), using today`);
        }

        const dateStr = format(gameTime, 'yyyy-MM-dd');
        console.log(`📅 Selection: ${selection.player} (${playerTeamAbbr}) -> date: ${dateStr}`);

        // Try to find a game using the team abbreviation
        const lookupKey = `${playerTeamAbbr}|${dateStr}`;
        console.log(`🔍 Looking up ${lookupKey}`);
        let externalGame = gameByTeamDate.get(lookupKey);

        // If not found, try using the full team name
        if (!externalGame && playerTeamName !== 'Unknown') {
          const fullNameKey = `${playerTeamName}|${dateStr}`;
          console.log(`🔍 Also trying ${fullNameKey}`);
          externalGame = gameByTeamDate.get(fullNameKey);
        }

        let homeTeamObj, awayTeamObj;
        let homeScore = null, awayScore = null;
        let gameStatus = getGameStatus(selection.status);
        let quarter = gameStatus === 'Live' ? 'In Progress' : gameStatus === 'Final' ? 'Final' : 'Scheduled';
        let venue = `${playerTeamName} Arena`;
        let broadcast = 'TBD';
        let attendance = '–';
        let odds = { spread: '–', total: '–', moneyline: { home: '–', away: '–' } };

        if (externalGame) {
          console.log(`✅ Found external game for ${playerTeamName} on ${dateStr}`);
          if (selectedSport === 'nba') {
            const isHome = externalGame.home_team === playerTeamName || 
                           extractTeamAbbreviation(externalGame.home_team) === playerTeamAbbr;
            homeTeamObj = {
              name: externalGame.home_team,
              logo: extractTeamAbbreviation(externalGame.home_team),
              color: getTeamColor(externalGame.home_team),
            };
            awayTeamObj = {
              name: externalGame.away_team,
              logo: extractTeamAbbreviation(externalGame.away_team),
              color: getTeamColor(externalGame.away_team),
            };
            if (!isHome) [homeTeamObj, awayTeamObj] = [awayTeamObj, homeTeamObj];
            homeScore = externalGame.scores?.home || null;
            awayScore = externalGame.scores?.away || null;
            gameStatus = externalGame.completed ? 'Final' : externalGame.scores ? 'Live' : 'Scheduled';

            if (externalGame.bookmakers?.length > 0) {
              const bookmaker = externalGame.bookmakers[0];
              const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
              const spreadsMarket = bookmaker.markets.find((m: any) => m.key === 'spreads');
              const totalsMarket = bookmaker.markets.find((m: any) => m.key === 'totals');
              if (h2hMarket) {
                const homeOutcome = h2hMarket.outcomes.find((o: any) => o.name === homeTeamObj.name);
                const awayOutcome = h2hMarket.outcomes.find((o: any) => o.name === awayTeamObj.name);
                odds.moneyline = {
                  home: homeOutcome?.price ? (homeOutcome.price > 0 ? `+${homeOutcome.price}` : homeOutcome.price.toString()) : '–',
                  away: awayOutcome?.price ? (awayOutcome.price > 0 ? `+${awayOutcome.price}` : awayOutcome.price.toString()) : '–',
                };
              }
              if (spreadsMarket) {
                const homeSpread = spreadsMarket.outcomes.find((o: any) => o.name === homeTeamObj.name);
                if (homeSpread) odds.spread = `${homeSpread.point > 0 ? '+' : ''}${homeSpread.point}`;
              }
              if (totalsMarket) {
                const over = totalsMarket.outcomes.find((o: any) => o.name === 'Over');
                if (over) odds.total = over.point.toString();
              }
            }
            quarter = externalGame.period || '';
            venue = externalGame.venue || `${homeTeamObj.name} Arena`;
          } else if (selectedSport === 'nhl') {
            const isHome = (externalGame.home_abbrev || externalGame.home_team) === playerTeamAbbr;
            homeTeamObj = {
              name: externalGame.home_team || 'Home',
              logo: externalGame.home_abbrev || '???',
              color: getTeamColor(externalGame.home_abbrev || ''),
            };
            awayTeamObj = {
              name: externalGame.away_team || 'Away',
              logo: externalGame.away_abbrev || '???',
              color: getTeamColor(externalGame.away_abbrev || ''),
            };
            if (!isHome) [homeTeamObj, awayTeamObj] = [awayTeamObj, homeTeamObj];
            homeScore = externalGame.home_score;
            awayScore = externalGame.away_score;
            gameStatus = externalGame.status || 'Scheduled';
            quarter = externalGame.period ? `P${externalGame.period}` : '';
            venue = externalGame.venue || 'NHL Arena';
            if (externalGame.odds) {
              // similar odds extraction if needed
            }
          } else if (selectedSport === 'mlb') {
            const isHome = (externalGame.home_abbrev || externalGame.home_team) === playerTeamAbbr;
            homeTeamObj = {
              name: externalGame.home_full || externalGame.home_team,
              logo: externalGame.home_abbrev || externalGame.home_team,
              color: getTeamColor(externalGame.home_abbrev || externalGame.home_team),
            };
            awayTeamObj = {
              name: externalGame.away_full || externalGame.away_team,
              logo: externalGame.away_abbrev || externalGame.away_team,
              color: getTeamColor(externalGame.away_abbrev || externalGame.away_team),
            };
            if (!isHome) [homeTeamObj, awayTeamObj] = [awayTeamObj, homeTeamObj];
            homeScore = externalGame.home_score;
            awayScore = externalGame.away_score;
            gameStatus = externalGame.status || 'Scheduled';
            quarter = externalGame.inning ? `Top ${externalGame.inning}` : '';
            venue = externalGame.venue || 'MLB Stadium';
          }
        } else {
          // No external game – fallback to team‑only
          console.log(`⚠️ No external game found for ${playerTeamName} on ${dateStr}`);
          homeTeamObj = { name: playerTeamName, logo: playerTeamAbbr, color: getTeamColor(playerTeamAbbr) };
          awayTeamObj = { name: 'TBD', logo: 'TBD', color: '#757575' };
        }

        const gameKey = externalGame?.id ? `${selectedSport}-${externalGame.id}` : `${playerTeamAbbr}-${dateStr}`;

        if (!gameMap.has(gameKey)) {
          const gameDate = format(gameTime, 'MMM dd, yyyy');
          const gameTimeStr = format(gameTime, 'h:mm a');

          gameMap.set(gameKey, {
            id: gameKey,
            homeTeam: homeTeamObj,
            awayTeam: awayTeamObj,
            homeScore,
            awayScore,
            status: gameStatus,
            sport: selectedSport.toUpperCase(),
            date: gameDate,
            time: gameTimeStr,
            venue,
            weather: selectedSport === 'nba' ? 'Indoor' : 'Outdoor',
            odds,
            broadcast,
            attendance,
            quarter,
            players: [selection.player],
            selectionData: [selection],
            externalGameId: externalGame?.id,
          });
        } else {
          const existing = gameMap.get(gameKey);
          if (!existing.players.includes(selection.player)) {
            existing.players.push(selection.player);
            existing.selectionData.push(selection);
          }
          if (externalGame && !existing.externalGameId) {
            existing.homeTeam = homeTeamObj;
            existing.awayTeam = awayTeamObj;
            existing.homeScore = homeScore;
            existing.awayScore = awayScore;
            existing.status = gameStatus;
            existing.quarter = quarter;
            existing.venue = venue;
            existing.odds = odds;
            existing.externalGameId = externalGame.id;
          }
        }
      } catch (err) {
        console.warn('Error processing selection:', err, selection);
      }
    });

    const gamesArray = Array.from(gameMap.values());
    console.log(`🎮 Created ${gamesArray.length} games from selections (enriched with ${selectedSport} data)`);
    return gamesArray;
  }, [selectionsFromApi, selectedSport, nbaGamesData, nhlGamesData, mlbGamesData]);

  // ================= Set initial selected game =================
  useEffect(() => {
    if (games.length > 0 && !selectedGame) {
      setSelectedGame(games[0]);
    }
  }, [games, selectedGame]);

  // ================= Derived stats for selected game =================
  const playerTrends = useMemo(() => {
    if (!selectedGame?.selectionData) return [];
    const map = new Map();
    selectedGame.selectionData.forEach((sel: any) => {
      const player = sel.player;
      if (!player) return;
      const edge = sel.edge ? parseFloat(sel.edge) : sel.confidence === 'high' ? 15 : sel.confidence === 'medium' ? 10 : 5;
      const curr = map.get(player) || { totalEdge: 0, count: 0, player, team: sel.team };
      curr.totalEdge += edge;
      curr.count += 1;
      map.set(player, curr);
    });
    return Array.from(map.values())
      .map(p => ({ ...p, avgEdge: p.totalEdge / p.count }))
      .sort((a, b) => b.avgEdge - a.avgEdge);
  }, [selectedGame]);

  const teamStats = useMemo(() => {
    if (!selectedGame?.selectionData) return [];
    const stats: Record<string, { totalEdge: number; count: number; players: Set<string> }> = {};
    selectedGame.selectionData.forEach((sel: any) => {
      const team = sel.team;
      if (!team || team === 'UNKNOWN') return;
      if (!stats[team]) stats[team] = { totalEdge: 0, count: 0, players: new Set() };
      stats[team].totalEdge += parseFloat(sel.edge || 0);
      stats[team].count += 1;
      stats[team].players.add(sel.player);
    });
    return Object.entries(stats).map(([team, data]) => ({
      team,
      avgEdge: data.totalEdge / data.count,
      propCount: data.count,
      uniquePlayers: data.players.size,
    }));
  }, [selectedGame]);

  // ================= Handlers =================
  const handleSelectGame = (game: any) => {
    try {
      setSelectedGame(game);
      setSearchQuery('');
      setSearchInput('');
      setFilteredGames([]);
      const sport = game.sport.toLowerCase();
      if (sport === 'nba' || sport === 'nfl' || sport === 'nhl' || sport === 'mlb') {
        setSelectedSport(sport);
      }
    } catch (err) {
      console.error('Error selecting game:', err);
    }
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId as 'nba' | 'nfl' | 'nhl' | 'mlb');
    setSelectedGame(null);
    lastFetchedKeyRef.current = '';
  };

  const handleSearchSubmit = (query?: string) => {
    const text = query || searchInput.trim();
    if (text) {
      setSearchQuery(text);
      const results = games.filter(
        g =>
          g.homeTeam.name.toLowerCase().includes(text.toLowerCase()) ||
          g.awayTeam.name.toLowerCase().includes(text.toLowerCase()) ||
          g.sport.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredGames(results);
    }
  };

  const handleSearch = (q: string) => {
    setSearchInput(q);
    if (!q.trim()) {
      setSearchQuery('');
      setFilteredGames([]);
    }
  };

  const handleRefresh = () => refetch();

  const generateAIAnalysis = async (promptType: string) => {
    setLoadingAI(true);
    setShowAIModal(true);
    setTimeout(() => {
      let analysis = '';
      switch (promptType) {
        case 'playerMatchup':
          if (playerTrends.length) {
            analysis = playerTrends
              .slice(0, 3)
              .map(p => `**${p.player}** (${p.team || 'Unknown'}): Avg Edge ${p.avgEdge.toFixed(1)}% over ${p.count} props`)
              .join('\n\n');
          } else {
            analysis = 'No player data available.';
          }
          break;
        case 'recentForm':
          if (teamStats.length) {
            analysis = teamStats.map(ts => `**${ts.team}**: Avg Edge ${ts.avgEdge.toFixed(1)}% (${ts.propCount} props, ${ts.uniquePlayers} players)`).join('\n\n');
          } else {
            analysis = 'No team data available.';
          }
          break;
        default:
          analysis = `**${promptType} analysis**\n\nGame: ${selectedGame?.homeTeam?.name} vs ${selectedGame?.awayTeam?.name}`;
      }
      setAiResponse(analysis);
      setLoadingAI(false);
    }, 1500);
  };

  // ================= GameCard component =================
  const GameCard = ({ game, isSelected = false, onSelect }: { game: any; isSelected?: boolean; onSelect: (game: any) => void }) => {
    const homeTeam = game.homeTeam || { name: 'Home', logo: 'H', color: '#3b82f6' };
    const awayTeam = game.awayTeam || { name: 'Away', logo: 'A', color: '#ef4444' };
    return (
      <Card
        sx={{
          cursor: 'pointer',
          border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
          transition: 'all 0.2s',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
        }}
        onClick={() => onSelect(game)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: homeTeam.color, width: 32, height: 32, fontSize: 14, fontWeight: 'bold' }}>
                {homeTeam.logo}
              </Avatar>
              <Typography variant="body2" fontWeight="medium">
                {homeTeam.name}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              vs
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="medium">
                {awayTeam.name === 'TBD' ? 'TBD' : awayTeam.name}
              </Typography>
              <Avatar sx={{ bgcolor: awayTeam.color, width: 32, height: 32, fontSize: 14, fontWeight: 'bold' }}>
                {awayTeam.logo === 'TBD' ? '?' : awayTeam.logo}
              </Avatar>
            </Box>
          </Box>
          {game.players?.length > 0 && (
            <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
              <People sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.5 }} />
              {game.players.length} player{game.players.length !== 1 ? 's' : ''}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {game.date || 'Today'}
              </Typography>
            </Box>
            <Chip
              label={game.status}
              size="small"
              sx={{
                bgcolor:
                  game.status === 'Live' ? '#ef4444' : game.status === 'Final' ? '#10b981' : '#f59e0b',
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  // ================= Tab content renderer =================
  const renderTabContent = () => {
    if (!selectedGame) return null;
    switch (activeTab) {
      case 'teamstats':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Team Performance (from props)
              </Typography>
              {teamStats.length ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Team</TableCell>
                        <TableCell align="right">Props</TableCell>
                        <TableCell align="right">Avg Edge</TableCell>
                        <TableCell align="right">Unique Players</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teamStats.map(row => (
                        <TableRow key={row.team}>
                          <TableCell>{row.team}</TableCell>
                          <TableCell align="right">{row.propCount}</TableCell>
                          <TableCell align="right">{row.avgEdge.toFixed(1)}%</TableCell>
                          <TableCell align="right">{row.uniquePlayers}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No team data available.</Typography>
              )}
            </CardContent>
          </Card>
        );
      case 'player-trends':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Player Trends
              </Typography>
              {playerTrends.length ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell align="right">Props</TableCell>
                        <TableCell align="right">Avg Edge</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {playerTrends.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.player}</TableCell>
                          <TableCell>{row.team || 'Unknown'}</TableCell>
                          <TableCell align="right">{row.count}</TableCell>
                          <TableCell align="right">{row.avgEdge.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">No player trends available.</Typography>
              )}
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Analytics sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6">Detailed Analysis</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                In-depth {activeTab} analysis is available with premium access.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/subscription')}>
                View Premium Analysis
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  // ================= Combined loading / error states =================
  const isLoading = selectionsLoading || nbaGamesLoading || nhlGamesLoading || mlbGamesLoading;
  const error = selectionsError || nbaGamesError || nhlGamesError || mlbGamesError;

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
          <Typography variant="body1" color="text.secondary" component="span">
            Live scores, stats, and in-depth analysis
            {selectionsFromApi.length > 0 && (
              <Chip
                label={`${selectionsFromApi.length} real player selections`}
                size="small"
                color="success"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sport</InputLabel>
          <Select value={selectedSport} label="Sport" onChange={e => handleSportChange(e.target.value)}>
            <MenuItem value="nba">NBA</MenuItem>
            <MenuItem value="nfl">NFL</MenuItem>
            <MenuItem value="nhl">NHL</MenuItem>
            <MenuItem value="mlb">MLB</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={handleRefresh} disabled={isLoading || isRefetching}>
              <Refresh />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Failed to load data
          </Typography>
          <Typography variant="body2">{error}</Typography>
          <Button variant="outlined" size="small" onClick={handleRefresh} sx={{ mt: 1 }}>
            Try Again
          </Button>
        </Alert>
      )}

      {(isLoading || isRefetching) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search games, teams, or leagues..."
          value={searchInput}
          onChange={e => handleSearch(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearchSubmit()}
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
            ),
          }}
        />

        {filteredGames.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Found {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
            </Typography>
            <Grid container spacing={2}>
              {filteredGames.slice(0, 3).map(game => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <GameCard game={game} isSelected={selectedGame?.id === game.id} onSelect={handleSelectGame} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* If no games, show empty state */}
      {games.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NewspaperIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No games available for {selectedSport.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try refreshing or selecting a different sport
          </Typography>
          <Button variant="outlined" startIcon={<UpdateIcon />} onClick={handleRefresh} sx={{ mt: 2 }}>
            Refresh Games
          </Button>
        </Box>
      )}

      {/* Selected Game Detail View (if any) */}
      {selectedGame && !searchQuery && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: selectedGame.homeTeam?.color || '#3b82f6', width: 80, height: 80, fontSize: 32, fontWeight: 'bold', mb: 2 }}>
                      {selectedGame.homeTeam?.logo || 'H'}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedGame.homeTeam?.name || 'Home'}
                    </Typography>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {selectedGame.homeScore ?? '–'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={selectedGame.status}
                        sx={{
                          bgcolor:
                            selectedGame.status === 'Live' ? '#ef4444' : selectedGame.status === 'Final' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      />
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
                      <Chip icon={<LocationOn />} label={selectedGame.venue} size="small" variant="outlined" />
                      <Chip icon={<Tv />} label={selectedGame.broadcast} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {selectedGame.sport} • {selectedGame.attendance} attendance
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: selectedGame.awayTeam?.color || '#ef4444', width: 80, height: 80, fontSize: 32, fontWeight: 'bold', mb: 2 }}>
                      {selectedGame.awayTeam?.logo === 'TBD' ? '?' : selectedGame.awayTeam?.logo || 'A'}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedGame.awayTeam?.name === 'TBD' ? 'TBD' : selectedGame.awayTeam?.name || 'Away'}
                    </Typography>
                    <Typography variant="h3" color="secondary" fontWeight="bold">
                      {selectedGame.awayScore ?? '–'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Paper sx={{ mt: 3, p: 2, bgcolor: 'background.default', display: 'flex', justifyContent: 'space-around' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Spread</Typography>
                  <Typography variant="h6" fontWeight="bold">{selectedGame.odds?.spread || '–'}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <BarChart sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Total</Typography>
                  <Typography variant="h6" fontWeight="bold">{selectedGame.odds?.total || '–'}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">Moneyline</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {selectedGame.odds?.moneyline?.home || '–'} / {selectedGame.odds?.moneyline?.away || '–'}
                  </Typography>
                </Box>
              </Paper>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {[
                { id: 'conditions', label: 'Conditions', icon: <Cloud /> },
                { id: 'h2h', label: 'H2H Stats', icon: <CompareArrows /> },
                { id: 'matchup', label: 'Matchup', icon: <Analytics /> },
                { id: 'boxscore', label: 'Box Score', icon: <Scoreboard /> },
                { id: 'teamstats', label: 'Team Stats', icon: <BarChart /> },
                { id: 'player-trends', label: 'Player Trends', icon: <TrendingUpIcon /> },
              ].map(tab => (
                <Tab key={tab.id} value={tab.id} label={tab.label} icon={tab.icon} iconPosition="start" />
              ))}
            </Tabs>
            <Box sx={{ p: 3 }}>{renderTabContent()}</Box>
          </Paper>

          {/* AI Analysis Prompts */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb sx={{ color: '#fbbf24' }} /> AI Analysis Prompts
              </Typography>
              <IconButton onClick={() => setShowPrompts(!showPrompts)}>
                <ChevronRight
                  sx={{ transform: showPrompts ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                />
              </IconButton>
            </Box>
            {showPrompts && (
              <Grid container spacing={2}>
                {[
                  { id: 'weather', icon: <Cloud />, title: 'Weather Impact', color: '#3b82f6' },
                  { id: 'homeAway', icon: <LocationOn />, title: 'Home/Away Trends', color: '#10b981' },
                  { id: 'playerMatchup', icon: <Groups />, title: 'Player Matchup', color: '#ef4444' },
                  { id: 'recentForm', icon: <TrendingUpIcon />, title: 'Recent Form', color: '#f59e0b' },
                  { id: 'injury', icon: <EmojiEvents />, title: 'Injury Report', color: '#8b5cf6' },
                  { id: 'predictive', icon: <Psychology />, title: 'Predictive Stats', color: '#ec4899' },
                ].map(prompt => (
                  <Grid item xs={12} sm={6} md={4} key={prompt.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, borderLeft: `4px solid ${prompt.color}` },
                        borderLeft: `4px solid ${prompt.color}`,
                      }}
                      onClick={() => generateAIAnalysis(prompt.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: prompt.color, width: 40, height: 40, mr: 2 }}>
                            {prompt.icon}
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold">
                            {prompt.title}
                          </Typography>
                        </Box>
                        <Chip
                          label="Free AI Analysis"
                          size="small"
                          sx={{ bgcolor: `${prompt.color}10`, color: prompt.color, fontSize: '0.75rem' }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </>
      )}

      {/* Always show list of games (if any) */}
      {games.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoreHoriz /> {selectedGame ? 'More Games' : 'Select a Game'}
          </Typography>
          <Grid container spacing={2}>
            {games
              .filter(game => !selectedGame || game.id !== selectedGame.id)
              .slice(0, 6)
              .map(game => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <GameCard game={game} isSelected={false} onSelect={handleSelectGame} />
                </Grid>
              ))}
          </Grid>
        </Paper>
      )}

      {/* AI Modal */}
      <Dialog open={showAIModal} onClose={() => setShowAIModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb sx={{ color: '#fbbf24' }} />
          AI Analysis
          {selectedGame && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {selectedGame.homeTeam?.name} vs {selectedGame.awayTeam?.name}
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
            </Box>
          ) : (
            <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {aiResponse}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MatchAnalyticsScreen;
