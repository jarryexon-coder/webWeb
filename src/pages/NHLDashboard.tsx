// src/pages/NHLDashboard.tsx – UPDATED with subscription integration
import React, { useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  Alert,
  Button,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SportsHockey as HockeyIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';
import ProtectedRoute from '../components/ProtectedRoute';
import PlanGuard from '../components/PlanGuard';
import GeneratorCredits from '../components/GeneratorCredits';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';
import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------
// Types (same as before)
// ----------------------------------------------------------------------

interface NHLGame {
  id: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'live' | 'final';
  period?: string;
  time_remaining?: string;
  venue: string;
  broadcast?: string;
  date: string;
  is_real_data?: boolean;
}

interface NHLStanding {
  id: string;
  team: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: 'Atlantic' | 'Metropolitan' | 'Central' | 'Pacific';
  games_played: number;
  wins: number;
  losses: number;
  ot_losses: number;
  points: number;
  win_percentage: number;
  goals_for: number;
  goals_against: number;
  goal_differential: number;
  streak: string;
  last_10: string;
  home_record: string;
  away_record: string;
  is_real_data?: boolean;
}

interface NHLPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  games_played?: number;
  goals?: number;
  assists?: number;
  points?: number;
  plus_minus?: number;
  penalty_minutes?: number;
  power_play_goals?: number;
  shorthanded_goals?: number;
  game_winning_goals?: number;
  shots?: number;
  shooting_pct?: number;
  time_on_ice_avg?: string;
  // Goalie specific
  wins?: number;
  losses?: number;
  otl?: number;
  goals_against_avg?: number;
  save_pct?: number;
  shutouts?: number;
  // Fantasy
  fantasy_points?: number;
  projected_points?: number;
  value?: number;
  sport: string;
}

interface NHLGamesResponse {
  success: boolean;
  games: NHLGame[];
  count: number;
  source: string;
}

interface NHLPlayersResponse {
  success: boolean;
  players: NHLPlayer[];
  count: number;
  sport: string;
}

// ----------------------------------------------------------------------
// API client – with fallback mock data (same as before)
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://python-api-fresh-production.up.railway.app';

// Mock Games (same as before, but we'll keep them)
const mockGames: NHLGame[] = [
  {
    id: '1',
    home_team: 'BOS',
    away_team: 'TOR',
    home_score: undefined,
    away_score: undefined,
    status: 'scheduled',
    venue: 'TD Garden',
    broadcast: 'ESPN+',
    date: new Date().toISOString(),
    is_real_data: false,
  },
  {
    id: '2',
    home_team: 'COL',
    away_team: 'DAL',
    home_score: undefined,
    away_score: undefined,
    status: 'scheduled',
    venue: 'Ball Arena',
    broadcast: 'TNT',
    date: new Date().toISOString(),
    is_real_data: false,
  },
  {
    id: '3',
    home_team: 'EDM',
    away_team: 'VGK',
    home_score: 3,
    away_score: 2,
    status: 'final',
    venue: 'Rogers Place',
    broadcast: 'SN',
    date: new Date().toISOString(),
    is_real_data: false,
  },
];

// Mock Standings (abbreviated for brevity – same as original, but we can keep the full list)
const mockStandings: NHLStanding[] = [
  // Eastern Conference - Atlantic
  { id: 'nhl-bos', team: 'Boston Bruins', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic', games_played: 72, wins: 47, losses: 18, ot_losses: 7, points: 101, win_percentage: 0.701, goals_for: 245, goals_against: 189, goal_differential: 56, streak: 'W3', last_10: '7-2-1', home_record: '25-7-4', away_record: '22-11-3', is_real_data: false },
  { id: 'nhl-tor', team: 'Toronto Maple Leafs', abbreviation: 'TOR', conference: 'Eastern', division: 'Atlantic', games_played: 71, wins: 44, losses: 22, ot_losses: 5, points: 93, win_percentage: 0.655, goals_for: 238, goals_against: 212, goal_differential: 26, streak: 'W1', last_10: '6-3-1', home_record: '23-9-4', away_record: '21-13-1', is_real_data: false },
  // ... (keep all other teams as in original, but for brevity I'll include a few; you can keep your full list)
  // For the full file, keep the original mockStandings array exactly as you had it.
];

// Mock Players (same as original)
const mockPlayers: NHLPlayer[] = [
  { id: '1', name: 'Connor McDavid', team: 'EDM', position: 'C', games_played: 58, goals: 38, assists: 62, points: 100, plus_minus: 22, penalty_minutes: 20, power_play_goals: 12, shorthanded_goals: 1, game_winning_goals: 5, shots: 210, shooting_pct: 18.1, time_on_ice_avg: '21:34', fantasy_points: 850.5, value: 95, sport: 'nhl' },
  // ... keep all mockPlayers as in original
];

// API functions (unchanged, but using the correct base URL)
const fetchNHLGames = async (date?: string): Promise<NHLGame[]> => {
  try {
    const url = new URL(`${API_BASE_URL}/api/nhl/games`);
    if (date) url.searchParams.append('date', date);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch NHL games');
    const data: NHLGamesResponse = await response.json();
    return data.games && data.games.length > 0 ? data.games : mockGames;
  } catch (error) {
    console.error('Error fetching NHL games, using mock data:', error);
    return mockGames;
  }
};

const fetchNHLStandings = (): Promise<NHLStanding[]> => {
  // Always return mock standings (or you could try a real endpoint if available)
  return Promise.resolve(mockStandings);
};

const fetchNHLPlayers = async (limit: number = 30): Promise<NHLPlayer[]> => {
  try {
    const url = new URL(`${API_BASE_URL}/api/players`);
    url.searchParams.append('sport', 'nhl');
    url.searchParams.append('limit', String(limit));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Failed to fetch NHL players');
    const data: NHLPlayersResponse = await response.json();
    return data.players && data.players.length > 0 ? data.players : mockPlayers;
  } catch (error) {
    console.error('Error fetching NHL players, using mock data:', error);
    return mockPlayers;
  }
};

// ----------------------------------------------------------------------
// Helper Components (unchanged)
// ----------------------------------------------------------------------
const GameStatusChip = ({ status }: { status: string }) => {
  let color: 'success' | 'error' | 'warning' | 'default' = 'default';
  let label = status.toUpperCase();
  if (status === 'live') {
    color = 'error';
    label = 'LIVE';
  } else if (status === 'final') {
    color = 'default';
    label = 'FINAL';
  } else if (status === 'scheduled') {
    color = 'primary';
    label = 'SCHEDULED';
  }
  return <Chip label={label} size="small" color={color} />;
};

const ConferenceChip = ({ conference }: { conference: string }) => (
  <Chip label={conference} size="small" color={conference === 'Eastern' ? 'info' : 'warning'} variant="outlined" />
);

const DivisionChip = ({ division }: { division: string }) => (
  <Chip label={division} size="small" variant="outlined" />
);

const PointsBar = ({ percentage }: { percentage: number }) => {
  let color: 'success' | 'warning' | 'error' = 'success';
  if (percentage < 0.5) color = 'error';
  else if (percentage < 0.6) color = 'warning';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color="text.secondary">
        {(percentage * 100).toFixed(1)}%
      </Typography>
      <LinearProgress variant="determinate" value={percentage * 100} sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} color={color} />
    </Box>
  );
};

const StreakChip = ({ streak }: { streak: string }) => {
  let color: 'success' | 'error' | 'default' = 'default';
  if (streak.startsWith('W')) color = 'success';
  else if (streak.startsWith('L')) color = 'error';
  return <Chip label={streak} size="small" color={color} variant="outlined" />;
};

// ----------------------------------------------------------------------
// Main Content Component with Plan Guards
// ----------------------------------------------------------------------
const NHLDashboardContent: React.FC = () => {
  const { profile, planFeatures } = useAuth();
  const { handleSubscriptionCheckout } = useCheckout();

  // Plan-based access control
  const hasAnalyticsAccess = planFeatures?.hasAdvancedAnalytics || profile?.plan === 'analytics' || profile?.plan === 'generator';
  const hasGeneratorAccess = planFeatures?.hasAIRecommendations || profile?.plan === 'generator';

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('analytics');
  const [selectedInterval, setSelectedInterval] = useState<string>('month');

  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [playerType, setPlayerType] = useState<'skaters' | 'goalies'>('skaters');

  const handleUpgrade = () => handleSubscriptionCheckout(selectedPlan, selectedInterval);

  // Queries
  const {
    data: games = [],
    isLoading: gamesLoading,
    error: gamesError,
    refetch: refetchGames,
  } = useQuery({
    queryKey: ['nhlGames', selectedDate],
    queryFn: () => fetchNHLGames(selectedDate || undefined),
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: standings = [],
    isLoading: standingsLoading,
    error: standingsError,
    refetch: refetchStandings,
  } = useQuery({
    queryKey: ['nhlStandings'],
    queryFn: fetchNHLStandings,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: players = [],
    isLoading: playersLoading,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: ['nhlPlayers', playerType],
    queryFn: () => fetchNHLPlayers(30),
    staleTime: 1000 * 60 * 5,
  });

  // Filters
  const filteredStandings = useMemo(() => {
    if (!standings.length) return [];
    if (selectedConference === 'all') return standings;
    return standings.filter((team) => team.conference.toLowerCase() === selectedConference.toLowerCase());
  }, [standings, selectedConference]);

  const filteredPlayers = useMemo(() => {
    if (!players.length) return [];
    let filtered = players;
    if (selectedPosition !== 'all') {
      filtered = filtered.filter((p) => p.position === selectedPosition);
    }
    if (playerType === 'skaters') {
      filtered = filtered.filter((p) => !['G'].includes(p.position));
    } else {
      filtered = filtered.filter((p) => ['G'].includes(p.position));
    }
    return filtered.sort((a, b) => (b.fantasy_points || b.points || 0) - (a.fantasy_points || a.points || 0));
  }, [players, selectedPosition, playerType]);

  const handleRefresh = () => {
    refetchGames();
    refetchStandings();
    refetchPlayers();
  };

  // Loading state
  if (gamesLoading || standingsLoading || playersLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>NHL Dashboard</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}><Skeleton variant="rounded" height={80} /></Grid>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      </Container>
    );
  }

  const error = gamesError || standingsError || playersError;
  if (error && !games.length && !standings.length && !players.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={handleRefresh}>Retry</Button>}>
          Error loading NHL data: {(error as Error).message}
        </Alert>
      </Container>
    );
  }

  // Render functions with PlanGuard
  const renderGamesTab = () => (
    <>
      <Typography variant="h6" gutterBottom>NHL Games</Typography>
      {!games.length ? (
        <Alert severity="info">No games scheduled for today.</Alert>
      ) : (
        <Grid container spacing={3}>
          {games.map((game) => (
            <Grid item xs={12} md={6} key={game.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <GameStatusChip status={game.status} />
                    {game.broadcast && <Chip label={game.broadcast} size="small" variant="outlined" />}
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">{game.away_team}</Typography>
                    </Box>
                    <Box textAlign="center" sx={{ px: 2 }}>
                      {game.status === 'scheduled' ? (
                        <Typography variant="body1">@</Typography>
                      ) : (
                        <Typography variant="h5" fontWeight="bold">{game.away_score ?? 0} - {game.home_score ?? 0}</Typography>
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                      <Typography variant="h6" fontWeight="bold">{game.home_team}</Typography>
                    </Box>
                  </Box>
                  {game.status === 'live' && game.period && game.time_remaining && (
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Chip label={`${game.period} • ${game.time_remaining}`} size="small" color="error" variant="outlined" />
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">{game.venue}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{new Date(game.date).toLocaleString()}</Typography>
                  </Box>
                  {!game.is_real_data && <Chip label="Simulated" size="small" variant="outlined" sx={{ mt: 1, height: 20, fontSize: '0.7rem' }} />}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );

  const renderStandingsTab = () => (
    <PlanGuard requiredPlan="analytics" currentPlan={profile?.plan || 'free'} fallback={
      <Alert severity="info" sx={{ mt: 2 }} action={<Button color="inherit" size="small" onClick={() => setShowUpgradeModal(true)}>Upgrade</Button>}>
        <strong>Analytics Package required</strong> – Upgrade to access NHL standings.
      </Alert>
    }>
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">NHL Standings</Typography>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="conference-filter-label">Conference</InputLabel>
            <Select labelId="conference-filter-label" value={selectedConference} label="Conference" onChange={(e) => setSelectedConference(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="eastern">Eastern</MenuItem>
              <MenuItem value="western">Western</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {!filteredStandings.length ? (
          <Alert severity="info">No standings data available.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell><TableCell align="center">Conf</TableCell><TableCell align="center">Div</TableCell>
                  <TableCell align="center">GP</TableCell><TableCell align="center">W</TableCell><TableCell align="center">L</TableCell>
                  <TableCell align="center">OTL</TableCell><TableCell align="center">PTS</TableCell><TableCell align="center">P%</TableCell>
                  <TableCell align="center">GF</TableCell><TableCell align="center">GA</TableCell><TableCell align="center">DIFF</TableCell>
                  <TableCell align="center">STRK</TableCell><TableCell align="center">L10</TableCell><TableCell align="center">HOME</TableCell><TableCell align="center">AWAY</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStandings.map((team) => {
                  const diff = team.goals_for - team.goals_against;
                  return (
                    <TableRow key={team.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">{team.team}</Typography>
                          <Chip label={team.abbreviation} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </Box>
                      </TableCell>
                      <TableCell align="center"><ConferenceChip conference={team.conference} /></TableCell>
                      <TableCell align="center"><DivisionChip division={team.division} /></TableCell>
                      <TableCell align="center">{team.games_played}</TableCell>
                      <TableCell align="center">{team.wins}</TableCell>
                      <TableCell align="center">{team.losses}</TableCell>
                      <TableCell align="center">{team.ot_losses}</TableCell>
                      <TableCell align="center"><Typography variant="body2" fontWeight="bold">{team.points}</Typography></TableCell>
                      <TableCell align="center"><PointsBar percentage={team.win_percentage} /></TableCell>
                      <TableCell align="center">{team.goals_for}</TableCell>
                      <TableCell align="center">{team.goals_against}</TableCell>
                      <TableCell align="center"><Typography variant="body2" color={diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary'}>{diff > 0 ? '+' : ''}{diff}</Typography></TableCell>
                      <TableCell align="center"><StreakChip streak={team.streak} /></TableCell>
                      <TableCell align="center">{team.last_10}</TableCell>
                      <TableCell align="center">{team.home_record}</TableCell>
                      <TableCell align="center">{team.away_record}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </>
    </PlanGuard>
  );

  const renderPlayersTab = () => (
    <PlanGuard requiredPlan="generator" currentPlan={profile?.plan || 'free'} fallback={
      <Alert severity="info" sx={{ mt: 2 }} action={<Button color="inherit" size="small" onClick={() => setShowUpgradeModal(true)}>Upgrade</Button>}>
        <strong>Generator Package required</strong> – Upgrade to access detailed NHL player stats.
      </Alert>
    }>
      <>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">NHL Player Stats</Typography>
          <Box display="flex" gap={2}>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel id="player-type-label">Type</InputLabel>
              <Select labelId="player-type-label" value={playerType} label="Type" onChange={(e) => setPlayerType(e.target.value as 'skaters' | 'goalies')}>
                <MenuItem value="skaters">Skaters</MenuItem>
                <MenuItem value="goalies">Goalies</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel id="position-filter-label">Position</InputLabel>
              <Select labelId="position-filter-label" value={selectedPosition} label="Position" onChange={(e) => setSelectedPosition(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {playerType === 'skaters' ? (
                  [<MenuItem key="C" value="C">Center</MenuItem>, <MenuItem key="LW" value="LW">Left Wing</MenuItem>, <MenuItem key="RW" value="RW">Right Wing</MenuItem>, <MenuItem key="D" value="D">Defense</MenuItem>]
                ) : (
                  <MenuItem value="G">Goalie</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        </Box>
        {!filteredPlayers.length ? (
          <Alert severity="info">No player data available.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell><TableCell align="center">Team</TableCell><TableCell align="center">Pos</TableCell>
                  {playerType === 'skaters' ? (
                    <><TableCell align="center">GP</TableCell><TableCell align="center">G</TableCell><TableCell align="center">A</TableCell><TableCell align="center">PTS</TableCell><TableCell align="center">+/-</TableCell><TableCell align="center">PIM</TableCell><TableCell align="center">PPG</TableCell><TableCell align="center">SHG</TableCell><TableCell align="center">GWG</TableCell><TableCell align="center">SOG</TableCell><TableCell align="center">TOI/G</TableCell></>
                  ) : (
                    <><TableCell align="center">GP</TableCell><TableCell align="center">W</TableCell><TableCell align="center">L</TableCell><TableCell align="center">OTL</TableCell><TableCell align="center">GAA</TableCell><TableCell align="center">SV%</TableCell><TableCell align="center">SO</TableCell></>
                  )}
                  <TableCell align="center">Fantasy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell><Box display="flex" alignItems="center" gap={1}><PersonIcon fontSize="small" color="action" /><Typography variant="body2" fontWeight="medium">{player.name}</Typography></Box></TableCell>
                    <TableCell align="center">{player.team}</TableCell>
                    <TableCell align="center"><Chip label={player.position} size="small" variant="outlined" /></TableCell>
                    {playerType === 'skaters' ? (
                      <>
                        <TableCell align="center">{player.games_played || '—'}</TableCell>
                        <TableCell align="center">{player.goals || 0}</TableCell>
                        <TableCell align="center">{player.assists || 0}</TableCell>
                        <TableCell align="center"><Typography variant="body2" fontWeight="bold">{player.points || 0}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" color={(player.plus_minus || 0) > 0 ? 'success.main' : (player.plus_minus || 0) < 0 ? 'error.main' : 'text.secondary'}>{player.plus_minus || 0}</Typography></TableCell>
                        <TableCell align="center">{player.penalty_minutes || 0}</TableCell>
                        <TableCell align="center">{player.power_play_goals || 0}</TableCell>
                        <TableCell align="center">{player.shorthanded_goals || 0}</TableCell>
                        <TableCell align="center">{player.game_winning_goals || 0}</TableCell>
                        <TableCell align="center">{player.shots || 0}</TableCell>
                        <TableCell align="center">{player.time_on_ice_avg || '—'}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="center">{player.games_played || '—'}</TableCell>
                        <TableCell align="center">{player.wins || 0}</TableCell>
                        <TableCell align="center">{player.losses || 0}</TableCell>
                        <TableCell align="center">{player.otl || 0}</TableCell>
                        <TableCell align="center">{player.goals_against_avg?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="center">{player.save_pct?.toFixed(3) || '.000'}</TableCell>
                        <TableCell align="center">{player.shutouts || 0}</TableCell>
                      </>
                    )}
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">{player.fantasy_points?.toFixed(1) || '—'}</Typography>
                        {player.value && <Chip label={player.value.toFixed(1)} size="small" color={player.value > 90 ? 'success' : player.value > 70 ? 'warning' : 'default'} sx={{ height: 20, fontSize: '0.7rem' }} />}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </>
    </PlanGuard>
  );

  const renderGeneratorCredits = () => {
    if (!hasGeneratorAccess) return null;
    return (
      <Box sx={{ mb: 3 }}>
        <GeneratorCredits />
      </Box>
    );
  };

  const renderUpgradeModal = () => (
    <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon sx={{ color: '#f59e0b' }} />
          <Typography variant="h6">Upgrade Your Plan</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography paragraph>Unlock advanced NHL analytics, standings, and player stats.</Typography>
        <Box sx={{ my: 3 }}>
          <Typography variant="subtitle2" gutterBottom>Select Plan</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card variant={selectedPlan === 'starter' ? 'elevation' : 'outlined'} sx={{ cursor: 'pointer', border: selectedPlan === 'starter' ? '2px solid #10b981' : 'none', bgcolor: selectedPlan === 'starter' ? alpha('#10b981', 0.05) : undefined }} onClick={() => setSelectedPlan('starter')}>
                <CardContent><Typography variant="h6" color="#10b981">Starter – $5.99/month</Typography><Typography variant="body2" color="text.secondary">Basic player stats and insights</Typography></CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card variant={selectedPlan === 'analytics' ? 'elevation' : 'outlined'} sx={{ cursor: 'pointer', border: selectedPlan === 'analytics' ? '2px solid #f59e0b' : 'none', bgcolor: selectedPlan === 'analytics' ? alpha('#f59e0b', 0.05) : undefined }} onClick={() => setSelectedPlan('analytics')}>
                <CardContent><Typography variant="h6" color="#f59e0b">Analytics+ – $19.99/month</Typography><Typography variant="body2" color="text.secondary">Standings, advanced metrics, team stats</Typography></CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card variant={selectedPlan === 'generator' ? 'elevation' : 'outlined'} sx={{ cursor: 'pointer', border: selectedPlan === 'generator' ? '2px solid #8b5cf6' : 'none', bgcolor: selectedPlan === 'generator' ? alpha('#8b5cf6', 0.05) : undefined }} onClick={() => setSelectedPlan('generator')}>
                <CardContent><Typography variant="h6" color="#8b5cf6">Generator – $39.99/month</Typography><Typography variant="body2" color="text.secondary">Player search, detailed stats, AI insights, credits</Typography></CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Billing Interval</Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}><Button fullWidth variant={selectedInterval === 'month' ? 'contained' : 'outlined'} onClick={() => setSelectedInterval('month')}>Monthly</Button></Grid>
              <Grid item xs={6}><Button fullWidth variant={selectedInterval === 'year' ? 'contained' : 'outlined'} onClick={() => setSelectedInterval('year')}>Yearly (Save 20%)</Button></Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          {selectedPlan === 'starter' && (
            <Box> {['NHL game schedules', 'Basic player stats', 'Team rosters'].map(f => <Box key={f} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} /><Typography variant="body2">{f}</Typography></Box>)} </Box>
          )}
          {selectedPlan === 'analytics' && (
            <Box> {['Everything in Starter', 'Full standings with advanced metrics', 'Division/conference filters', 'Goal differential & streak tracking'].map(f => <Box key={f} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#f59e0b', mr: 1, fontSize: 18 }} /><Typography variant="body2">{f}</Typography></Box>)} </Box>
          )}
          {selectedPlan === 'generator' && (
            <Box> {['Everything in Analytics+', 'Detailed player stats (skaters & goalies)', 'Fantasy points & value ratings', 'Generator credits for AI insights'].map(f => <Box key={f} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><CheckCircleIcon sx={{ color: '#8b5cf6', mr: 1, fontSize: 18 }} /><Typography variant="body2">{f}</Typography></Box>)} </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleUpgrade} sx={{ bgcolor: selectedPlan === 'starter' ? '#10b981' : selectedPlan === 'analytics' ? '#f59e0b' : '#8b5cf6' }}>
          Upgrade to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} ({selectedInterval}ly)
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Upgrade banner for free/starter users */}
      {!hasAnalyticsAccess && !hasGeneratorAccess && (
        <Alert severity="info" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => setShowUpgradeModal(true)}>Upgrade</Button>}>
          <strong>Unlock advanced NHL analytics</strong> – Get standings, advanced stats, and player insights.
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <HockeyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">NHL Dashboard</Typography>
          <Chip icon={<CalendarIcon />} label={selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Today'} variant="outlined" />
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh all data"><IconButton onClick={handleRefresh} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {renderGeneratorCredits()}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Games" />
          <Tab label="Standings" />
          <Tab label="Players" />
        </Tabs>
      </Box>

      {tabValue === 0 && renderGamesTab()}
      {tabValue === 1 && renderStandingsTab()}
      {tabValue === 2 && renderPlayersTab()}

      {renderUpgradeModal()}
    </Container>
  );
};

const NHLDashboard: React.FC = () => (
  <ProtectedRoute screenName="NHLDashboard">
    <NHLDashboardContent />
  </ProtectedRoute>
);

export default NHLDashboard;
