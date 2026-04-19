// src/pages/MLBSpringTraining.tsx – FINAL: mock props fallback, standings zeros fixed
import React, { useState } from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, Chip,
  FormControl, InputLabel, Select, MenuItem, Alert, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Tab, Tabs, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon, SportsBaseball as BaseballIcon, Search as SearchIcon,
  Person as PersonIcon, Lock as LockIcon, CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

console.log('🔧 Using Node API:', NODE_API_BASE);

// Types
interface MLBGame {
  id: string; home_team: string; away_team: string; home_full?: string; away_full?: string;
  home_score?: number; away_score?: number; status: 'scheduled' | 'live' | 'final';
  inning?: number; game_date: string; venue: string; tv?: string;
}
interface MLBStanding { team: string; wins: number; losses: number; pct: number | null; games_back: number; home_record: string; away_record: string; streak: string; last_10: string; }
interface MLBPlayerStat { name: string; team: string; position: string; avg?: number | null; hr?: number | null; rbi?: number | null; ops?: number | null; era?: number | null; whip?: number | null; so?: number | null; ip?: number | null; }
interface MLBProp { id: string; player: string; team: string; stat: string; line: number; odds: number; edge?: number; }
interface MLBPlayer { id: string; name: string; team: string; position: string; stats?: any; }

// ========== MOCK DATA (fallback) ==========
const getMockGames = (date: string): MLBGame[] => [
  { id: 'mock-1', home_team: 'NYY', away_team: 'BOS', home_full: 'New York Yankees', away_full: 'Boston Red Sox', home_score: 0, away_score: 0, status: 'scheduled', inning: 0, game_date: date, venue: 'Yankee Stadium', tv: 'ESPN' },
  { id: 'mock-2', home_team: 'LAD', away_team: 'SF', home_full: 'Los Angeles Dodgers', away_full: 'San Francisco Giants', home_score: 0, away_score: 0, status: 'scheduled', inning: 0, game_date: date, venue: 'Dodger Stadium', tv: 'MLB Network' },
  { id: 'mock-3', home_team: 'NYM', away_team: 'ATL', home_full: 'New York Mets', away_full: 'Atlanta Braves', home_score: 0, away_score: 0, status: 'scheduled', inning: 0, game_date: date, venue: 'Citi Field', tv: 'FOX' },
];

const getMockStandings = (): MLBStanding[] => [
  { team: 'NYY', wins: 95, losses: 67, pct: 0.586, games_back: 0, home_record: '48-33', away_record: '47-34', streak: 'W2', last_10: '7-3' },
  { team: 'BOS', wins: 92, losses: 70, pct: 0.568, games_back: 3, home_record: '46-35', away_record: '46-35', streak: 'L1', last_10: '6-4' },
  { team: 'LAD', wins: 100, losses: 62, pct: 0.617, games_back: 0, home_record: '53-28', away_record: '47-34', streak: 'W5', last_10: '8-2' },
  { team: 'ATL', wins: 104, losses: 58, pct: 0.642, games_back: 0, home_record: '55-26', away_record: '49-32', streak: 'W3', last_10: '7-3' },
];

const getMockHittingLeaders = (): MLBPlayerStat[] => [
  { name: 'Shohei Ohtani', team: 'LAD', position: 'DH', avg: 0.304, hr: 44, rbi: 95, ops: 1.010 },
  { name: 'Aaron Judge', team: 'NYY', position: 'RF', avg: 0.322, hr: 58, rbi: 144, ops: 1.159 },
  { name: 'Ronald Acuña Jr.', team: 'ATL', position: 'RF', avg: 0.337, hr: 41, rbi: 106, ops: 1.012 },
  { name: 'Mookie Betts', team: 'LAD', position: 'SS', avg: 0.307, hr: 39, rbi: 98, ops: 0.987 },
];

const getMockPitchingLeaders = (): MLBPlayerStat[] => [
  { name: 'Blake Snell', team: 'SF', position: 'P', era: 2.25, whip: 1.05, so: 234, ip: 180 },
  { name: 'Zack Wheeler', team: 'PHI', position: 'P', era: 2.78, whip: 1.08, so: 212, ip: 192 },
  { name: 'Corbin Burnes', team: 'MIL', position: 'P', era: 2.94, whip: 1.07, so: 200, ip: 193.2 },
  { name: 'Spencer Strider', team: 'ATL', position: 'P', era: 3.86, whip: 1.09, so: 281, ip: 186.2 },
];

const getMockProps = (): MLBProp[] => [
  { id: 'prop-1', player: 'Julio Rodriguez', team: 'SEA', stat: 'Home Runs', line: 0.5, odds: -110, edge: 0.05 },
  { id: 'prop-2', player: 'Josh Naylor', team: 'SEA', stat: 'Home Runs', line: 0.5, odds: -115, edge: 0.03 },
  { id: 'prop-3', player: 'Randy Arozarena', team: 'SEA', stat: 'Home Runs', line: 0.5, odds: +100, edge: 0.08 },
  { id: 'prop-4', player: 'Cal Raleigh', team: 'SEA', stat: 'Home Runs', line: 1.5, odds: +120, edge: 0.02 },
  { id: 'prop-5', player: 'Shohei Ohtani', team: 'LAD', stat: 'Home Runs', line: 0.5, odds: -130, edge: 0.04 },
];

// ========== API FUNCTIONS ==========
const toTank01Date = (dateStr: string) => dateStr.replace(/-/g, '');

const fetchGames = async (date: string): Promise<MLBGame[]> => {
  const tankDate = toTank01Date(date);
  try {
    const res = await fetch(`${NODE_API_BASE}/api/tank01/games?date=${tankDate}&sport=mlb`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length) {
      return data.data.map((game: any) => ({
        id: game.gameID || `${game.away}-${game.home}-${tankDate}`,
        home_team: game.home, away_team: game.away, home_full: game.homeFull, away_full: game.awayFull,
        home_score: game.homeScore, away_score: game.awayScore,
        status: game.status === 'Final' ? 'final' : game.status === 'InProgress' ? 'live' : 'scheduled',
        inning: game.inning, game_date: game.gameDate || date, venue: game.venue || 'TBD', tv: game.tv || '',
      }));
    }
    throw new Error('No games');
  } catch (err) { console.warn('Games mock fallback'); return getMockGames(date); }
};

const fetchStandings = async (season: number): Promise<MLBStanding[]> => {
  try {
    const res = await fetch(`${NODE_API_BASE}/api/tank01/currentinfo?sport=mlb`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.data?.teamStats) {
      return data.data.teamStats.map((t: any) => ({
        team: t.teamName || t.teamAbbrev, wins: t.wins ?? 0, losses: t.losses ?? 0,
        pct: t.winPct ? parseFloat(t.winPct) : (t.wins && t.losses ? t.wins / (t.wins + t.losses) : null),
        games_back: t.gamesBack ?? 0, home_record: `${t.homeWins ?? 0}-${t.homeLosses ?? 0}`,
        away_record: `${t.awayWins ?? 0}-${t.awayLosses ?? 0}`, streak: t.streak || '0', last_10: t.last10 || '0-0',
      }));
    }
    throw new Error('No Tank01 standings');
  } catch (err) {
    console.warn('Tank01 standings failed, trying Python...', err);
    try {
      const pyRes = await fetch(`${PYTHON_API_BASE}/api/mlb/stats?type=standings&season=${season}`);
      if (!pyRes.ok) throw new Error(`Python HTTP ${pyRes.status}`);
      const pyData = await pyRes.json();
      const rawStandings = pyData.data?.standings || pyData.standings || pyData;
      if (Array.isArray(rawStandings) && rawStandings.length) {
        console.log('📊 Python standings sample:', rawStandings[0]);
        return rawStandings.map((team: any) => ({
          team: team.team || 'Unknown',
          wins: team.wins ?? 0,
          losses: team.losses ?? 0,
          pct: team.pct ?? (team.wins && team.losses ? team.wins / (team.wins + team.losses) : null),
          games_back: team.games_back ?? 0,
          home_record: team.home_record || '0-0',
          away_record: team.away_record || '0-0',
          streak: team.streak || '0',
          last_10: team.last_10 || '0-0',
        }));
      }
      throw new Error('No Python standings');
    } catch (pyErr) { console.warn('Python standings failed, using mock'); return getMockStandings(); }
  }
};

let cachedAllPlayers: any[] | null = null;
const fetchAllPlayers = async (): Promise<any[]> => {
  if (cachedAllPlayers) return cachedAllPlayers;
  try {
    const url = `${NODE_API_BASE}/api/fantasyhub/players?sport=mlb&filterByToday=false&force=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.data && data.data.length) {
      cachedAllPlayers = data.data;
      console.log(`✅ Loaded ${cachedAllPlayers.length} real players`);
      return cachedAllPlayers;
    }
    throw new Error('No players');
  } catch (err) { console.warn('Failed to fetch players, using empty'); return []; }
};

const fetchHittingLeaders = async (limit: number): Promise<MLBPlayerStat[]> => {
  const players = await fetchAllPlayers();
  if (!players.length) return getMockHittingLeaders();
  const hitters = players.filter(p => p.position !== 'P' && (p.batting_average !== undefined || p.avg !== undefined));
  if (!hitters.length) return getMockHittingLeaders();
  const stats = hitters.map(p => ({
    name: p.name, team: p.team, position: p.position || 'Unknown',
    avg: p.batting_average ?? p.avg ?? null, hr: p.home_runs ?? p.hr ?? null,
    rbi: p.rbi ?? null, ops: p.ops ?? null,
  }));
  const valid = stats.filter(h => h.hr !== null || h.avg !== null);
  if (!valid.length) return getMockHittingLeaders();
  valid.sort((a, b) => (b.hr ?? 0) - (a.hr ?? 0));
  return valid.slice(0, limit);
};

const fetchPitchingLeaders = async (limit: number): Promise<MLBPlayerStat[]> => {
  const players = await fetchAllPlayers();
  if (!players.length) return getMockPitchingLeaders();
  const pitchers = players.filter(p => p.position === 'P' || p.era !== undefined || p.whip !== undefined);
  if (!pitchers.length) return getMockPitchingLeaders();
  const stats = pitchers.map(p => ({
    name: p.name, team: p.team, position: 'P',
    era: p.era ?? null, whip: p.whip ?? null, so: p.strikeouts ?? p.so ?? null, ip: p.innings_pitched ?? p.ip ?? null,
  }));
  const valid = stats.filter(p => p.era !== null || p.so !== null);
  if (!valid.length) return getMockPitchingLeaders();
  valid.sort((a, b) => (a.era ?? 99) - (b.era ?? 99));
  return valid.slice(0, limit);
};

// Props: try Node PrizePicks, then Python, then mock
const fetchProps = async (date: string, limit: number): Promise<MLBProp[]> => {
  // 1) Try Node PrizePicks endpoint
  try {
    const res = await fetch(`${NODE_API_BASE}/api/prizepicks/selections?sport=mlb&force=true&_t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.selections) && data.selections.length) {
        console.log(`✅ Got ${data.selections.length} props from Node PrizePicks`);
        return data.selections.slice(0, limit).map((p: any) => ({
          id: p.id || `pp-${Date.now()}-${Math.random()}`,
          player: p.player, team: p.team || 'MLB', stat: p.stat, line: p.line, odds: p.odds ?? -110, edge: p.edge ? parseFloat(p.edge) : undefined,
        }));
      }
    }
    throw new Error('No PrizePicks props');
  } catch (err) {
    console.warn('PrizePicks props failed, trying Python API...', err);
    // 2) Fallback to Python API
    try {
      const pyRes = await fetch(`${PYTHON_API_BASE}/api/mlb/props?date=${date}&limit=${limit}`);
      if (!pyRes.ok) throw new Error(`Python HTTP ${pyRes.status}`);
      const pyData = await pyRes.json();
      console.log('📦 Python props response:', pyData);
      const propsArray = pyData.props || pyData.data?.props || pyData;
      if (Array.isArray(propsArray) && propsArray.length) {
        console.log(`✅ Got ${propsArray.length} props from Python API`);
        return propsArray.slice(0, limit).map((p: any, idx: number) => ({
          id: p.id || `py-${idx}`,
          player: p.player_name || p.player,
          team: p.team || 'MLB',
          stat: p.stat_type || p.stat,
          line: p.line ?? 0.5,
          odds: p.odds ?? -110,
          edge: p.edge ?? p.projection_edge,
        }));
      }
      throw new Error('No Python props');
    } catch (pyErr) {
      console.warn('Python props also failed, using mock data', pyErr);
      // 3) Final fallback: mock props
      return getMockProps();
    }
  }
};

const searchPlayers = async (query: string): Promise<MLBPlayer[]> => {
  const players = await fetchAllPlayers();
  if (!players.length) {
    const mockPlayers = [
      { name: 'Shohei Ohtani', team: 'LAD', position: 'DH', player_id: 'ohtani' },
      { name: 'Aaron Judge', team: 'NYY', position: 'RF', player_id: 'judge' },
      { name: 'Ronald Acuña Jr.', team: 'ATL', position: 'RF', player_id: 'acuna' },
      { name: 'Julio Rodriguez', team: 'SEA', position: 'CF', player_id: 'jrod' },
    ];
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return mockPlayers.filter(p => p.name.toLowerCase().includes(lower) || p.team.toLowerCase().includes(lower))
      .map(p => ({ id: p.player_id, name: p.name, team: p.team, position: p.position, stats: {} }));
  }
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  const filtered = players.filter(p => p.name.toLowerCase().includes(lower) || p.team.toLowerCase().includes(lower));
  return filtered.map(p => ({
    id: p.player_id || p.name.replace(/\s/g, '-').toLowerCase(),
    name: p.name, team: p.team, position: p.position || 'Player',
    stats: { avg: p.batting_average ?? p.avg, home_runs: p.home_runs ?? p.hr, rbi: p.rbi, ops: p.ops, era: p.era, whip: p.whip, strikeouts: p.strikeouts, ip: p.innings_pitched },
  }));
};

const fetchPlayerDetail = async (playerId: string, season: number): Promise<MLBPlayer> => {
  const players = await fetchAllPlayers();
  const player = players.find(p => p.player_id === playerId || p.name.replace(/\s/g, '-').toLowerCase() === playerId);
  if (player) return { id: player.player_id, name: player.name, team: player.team, position: player.position || 'Player', stats: player };
  return { id: playerId, name: 'MLB Player', team: 'MLB', position: 'UTL', stats: {} };
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

// ========== MAIN COMPONENT ==========
const MLBSpringTrainingContent: React.FC = () => {
  const { profile, planFeatures } = useAuth();
  const { handleSubscriptionCheckout } = useCheckout();
  const hasAnalyticsAccess = planFeatures?.hasAdvancedAnalytics || profile?.plan === 'analytics' || profile?.plan === 'generator';
  const hasGeneratorAccess = planFeatures?.hasAIRecommendations || profile?.plan === 'generator';
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('analytics');
  const [selectedInterval, setSelectedInterval] = useState('month');
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<MLBPlayer | null>(null);
  
  const handleUpgrade = () => handleSubscriptionCheckout(selectedPlan, selectedInterval);
  
  const gamesQuery = useQuery({ queryKey: ['mlbGames', selectedDate], queryFn: () => fetchGames(selectedDate), staleTime: 5 * 60 * 1000 });
  const standingsQuery = useQuery({ queryKey: ['mlbStandings', selectedSeason], queryFn: () => fetchStandings(selectedSeason), enabled: tabValue === 1, staleTime: 10 * 60 * 1000 });
  const hittingQuery = useQuery({ queryKey: ['mlbHitting', 50], queryFn: () => fetchHittingLeaders(50), enabled: tabValue === 2, staleTime: 10 * 60 * 1000 });
  const pitchingQuery = useQuery({ queryKey: ['mlbPitching', 20], queryFn: () => fetchPitchingLeaders(20), enabled: tabValue === 3, staleTime: 10 * 60 * 1000 });
  const propsQuery = useQuery({ queryKey: ['mlbProps', selectedDate, 30], queryFn: () => fetchProps(selectedDate, 30), enabled: tabValue === 4 && hasAnalyticsAccess, staleTime: 5 * 60 * 1000 });
  const searchMutation = useMutation({ mutationFn: (query: string) => searchPlayers(query) });
  
  const renderAnalyticsLock = () => (
    <Box textAlign="center" py={8}>
      <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom>Analytics Feature Locked</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Upgrade to Analytics or Generator plan.</Typography>
      <Button variant="contained" color="primary" onClick={() => setShowUpgradeModal(true)}>Upgrade Now</Button>
    </Box>
  );
  
  const renderGamesTab = () => {
    if (gamesQuery.isLoading) return <CircularProgress />;
    if (gamesQuery.isError) return <Alert severity="error">Failed to load games.</Alert>;
    const games = gamesQuery.data || [];
    if (!games.length) return <Alert severity="info">No games scheduled.</Alert>;
    return (
      <Grid container spacing={2}>
        {games.map((game) => (
          <Grid item xs={12} md={6} lg={4} key={game.id}>
            <Card><CardContent>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Chip label={game.status.toUpperCase()} size="small" color={game.status === 'live' ? 'error' : game.status === 'final' ? 'default' : 'primary'} />
                <Typography variant="caption">{game.venue}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
                <Typography variant="h6" fontWeight="bold">{game.away_team}</Typography>
                <Typography variant="h6">{game.away_score ?? '-'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
                <Typography variant="h6" fontWeight="bold">{game.home_team}</Typography>
                <Typography variant="h6">{game.home_score ?? '-'}</Typography>
              </Box>
              {game.inning && <Typography variant="body2" color="text.secondary" align="center">Inning: {game.inning}</Typography>}
              {game.tv && <Typography variant="caption" display="block" align="center">TV: {game.tv}</Typography>}
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  const renderStandingsTab = () => {
    if (!hasAnalyticsAccess) return renderAnalyticsLock();
    if (standingsQuery.isLoading) return <CircularProgress />;
    if (standingsQuery.isError) return <Alert severity="error">Failed to load standings.</Alert>;
    const standings = standingsQuery.data || [];
    if (!standings.length) return <Alert severity="info">No standings data.</Alert>;
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Team</TableCell><TableCell align="right">W</TableCell><TableCell align="right">L</TableCell><TableCell align="right">PCT</TableCell><TableCell align="right">GB</TableCell><TableCell>Home</TableCell><TableCell>Away</TableCell><TableCell>Streak</TableCell><TableCell>Last 10</TableCell></TableRow></TableHead>
          <TableBody>
            {standings.map((team) => (
              <TableRow key={team.team}>
                <TableCell>{team.team}</TableCell>
                <TableCell align="right">{team.wins}</TableCell>
                <TableCell align="right">{team.losses}</TableCell>
                <TableCell align="right">{team.pct?.toFixed(3) ?? '---'}</TableCell>
                <TableCell align="right">{team.games_back}</TableCell>
                <TableCell>{team.home_record}</TableCell><TableCell>{team.away_record}</TableCell>
                <TableCell>{team.streak}</TableCell><TableCell>{team.last_10}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const renderHittingTab = () => {
    if (!hasAnalyticsAccess) return renderAnalyticsLock();
    if (hittingQuery.isLoading) return <CircularProgress />;
    if (hittingQuery.isError) return <Alert severity="error">Failed to load hitting leaders.</Alert>;
    const hitters = hittingQuery.data || [];
    if (!hitters.length) return <Alert severity="info">No hitting data.</Alert>;
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Player</TableCell><TableCell>Team</TableCell><TableCell>Pos</TableCell><TableCell align="right">AVG</TableCell><TableCell align="right">HR</TableCell><TableCell align="right">RBI</TableCell><TableCell align="right">OPS</TableCell></TableRow></TableHead>
          <TableBody>
            {hitters.map((p, idx) => (
              <TableRow key={idx}><TableCell>{p.name}</TableCell><TableCell>{p.team}</TableCell><TableCell>{p.position}</TableCell>
              <TableCell align="right">{p.avg?.toFixed(3) ?? '---'}</TableCell><TableCell align="right">{p.hr ?? '---'}</TableCell>
              <TableCell align="right">{p.rbi ?? '---'}</TableCell><TableCell align="right">{p.ops?.toFixed(3) ?? '---'}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const renderPitchingTab = () => {
    if (!hasAnalyticsAccess) return renderAnalyticsLock();
    if (pitchingQuery.isLoading) return <CircularProgress />;
    if (pitchingQuery.isError) return <Alert severity="error">Failed to load pitching leaders.</Alert>;
    const pitchers = pitchingQuery.data || [];
    if (!pitchers.length) return <Alert severity="info">No pitching data.</Alert>;
    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Player</TableCell><TableCell>Team</TableCell><TableCell align="right">ERA</TableCell><TableCell align="right">WHIP</TableCell><TableCell align="right">SO</TableCell><TableCell align="right">IP</TableCell></TableRow></TableHead>
          <TableBody>
            {pitchers.map((p, idx) => (
              <TableRow key={idx}><TableCell>{p.name}</TableCell><TableCell>{p.team}</TableCell>
              <TableCell align="right">{p.era?.toFixed(2) ?? '---'}</TableCell><TableCell align="right">{p.whip?.toFixed(2) ?? '---'}</TableCell>
              <TableCell align="right">{p.so ?? '---'}</TableCell><TableCell align="right">{p.ip?.toFixed(1) ?? '---'}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  const renderPropsTab = () => {
    if (!hasAnalyticsAccess) return renderAnalyticsLock();
    if (propsQuery.isLoading) return <CircularProgress />;
    if (propsQuery.isError) return <Alert severity="error">Failed to load props.</Alert>;
    const props = propsQuery.data || [];
    if (!props.length) return <Alert severity="info">No props available (showing mock data) – check Python API.</Alert>;
    return (
      <Grid container spacing={2}>
        {props.map((prop) => (
          <Grid item xs={12} sm={6} md={4} key={prop.id}>
            <Card><CardContent>
              <Typography variant="h6">{prop.player}</Typography>
              <Typography variant="body2" color="text.secondary">{prop.team} • {prop.stat}</Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <Chip label={`Line: ${prop.line}`} size="small" />
                <Typography variant="body2" fontWeight="bold">
                  Multiplier: {prop.odds ? (prop.odds > 0 ? `+${prop.odds}` : prop.odds) : 'N/A'}
                </Typography>
              </Box>
              {prop.edge !== undefined && (
                <Box mt={1}><Chip label={`📈 Edge: ${(prop.edge * 100).toFixed(1)}%`} size="small" color={prop.edge > 0.05 ? "success" : "primary"} /></Box>
              )}
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  const renderSearchTab = () => (
    <Box>
      <TextField fullWidth placeholder="Search MLB players..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchMutation.mutate(e.target.value); }} sx={{ mb: 3 }} />
      {searchMutation.isLoading && <CircularProgress />}
      {searchMutation.data && (
        <Grid container spacing={2}>
          {searchMutation.data.map((player) => (
            <Grid item xs={12} sm={6} md={4} key={player.id}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => setSelectedPlayer(player)}>
                <CardContent><Typography variant="h6">{player.name}</Typography><Typography variant="body2" color="text.secondary">{player.team} - {player.position}</Typography></CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </Box>
  );
  
  const PlayerDetailModal = ({ player, onClose }: { player: MLBPlayer | null; onClose: () => void }) => {
    if (!player) return null;
    return (
      <Dialog open={!!player} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{player.name} ({player.team})</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>Position: {player.position}</Typography>
          <Typography variant="subtitle1">Stats</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                {player.stats?.avg && <TableRow><TableCell>AVG</TableCell><TableCell>{player.stats.avg.toFixed(3)}</TableCell></TableRow>}
                {player.stats?.home_runs && <TableRow><TableCell>HR</TableCell><TableCell>{player.stats.home_runs}</TableCell></TableRow>}
                {player.stats?.rbi && <TableRow><TableCell>RBI</TableCell><TableCell>{player.stats.rbi}</TableCell></TableRow>}
                {player.stats?.ops && <TableRow><TableCell>OPS</TableCell><TableCell>{player.stats.ops.toFixed(3)}</TableCell></TableRow>}
                {player.stats?.era && <TableRow><TableCell>ERA</TableCell><TableCell>{player.stats.era.toFixed(2)}</TableCell></TableRow>}
                {player.stats?.whip && <TableRow><TableCell>WHIP</TableCell><TableCell>{player.stats.whip.toFixed(2)}</TableCell></TableRow>}
                {player.stats?.strikeouts && <TableRow><TableCell>SO</TableCell><TableCell>{player.stats.strikeouts}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
      </Dialog>
    );
  };
  
  const renderUpgradeModal = () => (
    <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Upgrade Your Plan</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>Choose a plan to unlock MLB Props and advanced analytics:</Typography>
        <FormControl fullWidth margin="normal"><InputLabel>Plan</InputLabel><Select value={selectedPlan} label="Plan" onChange={(e) => setSelectedPlan(e.target.value)}><MenuItem value="analytics">Analytics ($9.99/mo)</MenuItem><MenuItem value="generator">Generator ($19.99/mo)</MenuItem></Select></FormControl>
        <FormControl fullWidth margin="normal"><InputLabel>Billing</InputLabel><Select value={selectedInterval} label="Billing" onChange={(e) => setSelectedInterval(e.target.value)}><MenuItem value="month">Monthly</MenuItem><MenuItem value="year">Yearly (2 months free)</MenuItem></Select></FormControl>
      </DialogContent>
      <DialogActions><Button onClick={() => setShowUpgradeModal(false)}>Cancel</Button><Button variant="contained" startIcon={<CreditCardIcon />} onClick={handleUpgrade}>Upgrade Now</Button></DialogActions>
    </Dialog>
  );
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}><BaseballIcon sx={{ fontSize: 40, color: 'primary.main' }} /><Typography variant="h4" fontWeight="bold">MLB Spring Training & Analytics</Typography><Chip icon={<CheckCircleIcon />} label={`${profile?.plan?.charAt(0).toUpperCase() + profile?.plan?.slice(1) || 'Free'} Plan`} color={profile?.plan === 'generator' ? 'warning' : profile?.plan === 'analytics' ? 'secondary' : 'default'} size="small" /></Box>
        <Box display="flex" gap={2}>
          {tabValue === 0 && <TextField type="date" size="small" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} sx={{ width: 150 }} />}
          {(tabValue === 1 || tabValue === 4) && (<FormControl size="small" sx={{ minWidth: 100 }}><InputLabel>Season</InputLabel><Select value={selectedSeason} label="Season" onChange={(e) => setSelectedSeason(Number(e.target.value))}><MenuItem value={new Date().getFullYear()}>{new Date().getFullYear()}</MenuItem><MenuItem value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</MenuItem></Select></FormControl>)}
          <IconButton onClick={() => { if (tabValue === 0) gamesQuery.refetch(); else if (tabValue === 1) standingsQuery.refetch(); else if (tabValue === 2) hittingQuery.refetch(); else if (tabValue === 3) pitchingQuery.refetch(); else if (tabValue === 4) propsQuery.refetch(); }}><RefreshIcon /></IconButton>
        </Box>
      </Box>
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}><Tab label="Games" /><Tab label="Standings" /><Tab label="Hitting" /><Tab label="Pitching" /><Tab label="Props" /><Tab label="Search" /></Tabs>
      {tabValue === 0 && renderGamesTab()}
      {tabValue === 1 && renderStandingsTab()}
      {tabValue === 2 && renderHittingTab()}
      {tabValue === 3 && renderPitchingTab()}
      {tabValue === 4 && renderPropsTab()}
      {tabValue === 5 && renderSearchTab()}
      {renderUpgradeModal()}
    </Container>
  );
};

const MLBSpringTraining: React.FC = () => (
  <ProtectedRoute screenName="MLBSpringTraining">
    <MLBSpringTrainingContent />
  </ProtectedRoute>
);

export default MLBSpringTraining;
