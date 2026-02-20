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
  Divider,
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
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';

// ----------------------------------------------------------------------
// Types
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
// API client – with fallback mock data
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Mock Games
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

// Mock Standings (already defined, but keep as is)
const mockStandings: NHLStanding[] = [
  // Eastern Conference - Atlantic
  { id: 'nhl-bos', team: 'Boston Bruins', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic', games_played: 72, wins: 47, losses: 18, ot_losses: 7, points: 101, win_percentage: 0.701, goals_for: 245, goals_against: 189, goal_differential: 56, streak: 'W3', last_10: '7-2-1', home_record: '25-7-4', away_record: '22-11-3', is_real_data: false },
  { id: 'nhl-tor', team: 'Toronto Maple Leafs', abbreviation: 'TOR', conference: 'Eastern', division: 'Atlantic', games_played: 71, wins: 44, losses: 22, ot_losses: 5, points: 93, win_percentage: 0.655, goals_for: 238, goals_against: 212, goal_differential: 26, streak: 'W1', last_10: '6-3-1', home_record: '23-9-4', away_record: '21-13-1', is_real_data: false },
  { id: 'nhl-fla', team: 'Florida Panthers', abbreviation: 'FLA', conference: 'Eastern', division: 'Atlantic', games_played: 72, wins: 43, losses: 24, ot_losses: 5, points: 91, win_percentage: 0.632, goals_for: 232, goals_against: 208, goal_differential: 24, streak: 'L1', last_10: '5-4-1', home_record: '24-9-3', away_record: '19-15-2', is_real_data: false },
  { id: 'nhl-tbl', team: 'Tampa Bay Lightning', abbreviation: 'TBL', conference: 'Eastern', division: 'Atlantic', games_played: 71, wins: 42, losses: 25, ot_losses: 4, points: 88, win_percentage: 0.620, goals_for: 241, goals_against: 222, goal_differential: 19, streak: 'W2', last_10: '6-4-0', home_record: '23-10-2', away_record: '19-15-2', is_real_data: false },
  // Eastern - Metropolitan
  { id: 'nhl-car', team: 'Carolina Hurricanes', abbreviation: 'CAR', conference: 'Eastern', division: 'Metropolitan', games_played: 71, wins: 46, losses: 19, ot_losses: 6, points: 98, win_percentage: 0.690, goals_for: 233, goals_against: 186, goal_differential: 47, streak: 'W5', last_10: '8-2-0', home_record: '26-6-3', away_record: '20-13-3', is_real_data: false },
  { id: 'nhl-njd', team: 'New Jersey Devils', abbreviation: 'NJD', conference: 'Eastern', division: 'Metropolitan', games_played: 71, wins: 44, losses: 22, ot_losses: 5, points: 93, win_percentage: 0.655, goals_for: 236, goals_against: 207, goal_differential: 29, streak: 'L2', last_10: '6-3-1', home_record: '23-10-2', away_record: '21-12-3', is_real_data: false },
  { id: 'nhl-nyr', team: 'New York Rangers', abbreviation: 'NYR', conference: 'Eastern', division: 'Metropolitan', games_played: 72, wins: 43, losses: 24, ot_losses: 5, points: 91, win_percentage: 0.632, goals_for: 214, goals_against: 202, goal_differential: 12, streak: 'W1', last_10: '5-4-1', home_record: '24-10-2', away_record: '19-14-3', is_real_data: false },
  // Western Conference - Central
  { id: 'nhl-col', team: 'Colorado Avalanche', abbreviation: 'COL', conference: 'Western', division: 'Central', games_played: 71, wins: 48, losses: 19, ot_losses: 4, points: 100, win_percentage: 0.704, goals_for: 262, goals_against: 195, goal_differential: 67, streak: 'W4', last_10: '8-1-1', home_record: '27-6-2', away_record: '21-13-2', is_real_data: false },
  { id: 'nhl-dal', team: 'Dallas Stars', abbreviation: 'DAL', conference: 'Western', division: 'Central', games_played: 72, wins: 45, losses: 21, ot_losses: 6, points: 96, win_percentage: 0.667, goals_for: 238, goals_against: 201, goal_differential: 37, streak: 'W2', last_10: '7-2-1', home_record: '25-9-2', away_record: '20-12-4', is_real_data: false },
  { id: 'nhl-min', team: 'Minnesota Wild', abbreviation: 'MIN', conference: 'Western', division: 'Central', games_played: 72, wins: 42, losses: 25, ot_losses: 5, points: 89, win_percentage: 0.618, goals_for: 216, goals_against: 213, goal_differential: 3, streak: 'L1', last_10: '5-4-1', home_record: '23-10-3', away_record: '19-15-2', is_real_data: false },
  // Western - Pacific
  { id: 'nhl-vgk', team: 'Vegas Golden Knights', abbreviation: 'VGK', conference: 'Western', division: 'Pacific', games_played: 71, wins: 46, losses: 20, ot_losses: 5, points: 97, win_percentage: 0.683, goals_for: 241, goals_against: 203, goal_differential: 38, streak: 'W3', last_10: '7-3-0', home_record: '26-8-2', away_record: '20-12-3', is_real_data: false },
  { id: 'nhl-edm', team: 'Edmonton Oilers', abbreviation: 'EDM', conference: 'Western', division: 'Pacific', games_played: 71, wins: 44, losses: 23, ot_losses: 4, points: 92, win_percentage: 0.648, goals_for: 256, goals_against: 221, goal_differential: 35, streak: 'W2', last_10: '6-3-1', home_record: '25-9-2', away_record: '19-14-2', is_real_data: false },
  { id: 'nhl-la', team: 'Los Angeles Kings', abbreviation: 'LAK', conference: 'Western', division: 'Pacific', games_played: 72, wins: 41, losses: 24, ot_losses: 7, points: 89, win_percentage: 0.618, goals_for: 215, goals_against: 206, goal_differential: 9, streak: 'L1', last_10: '5-5-0', home_record: '22-12-2', away_record: '19-12-5', is_real_data: false },
];

// Mock Players (skaters + goalies)
const mockPlayers: NHLPlayer[] = [
  // Skaters
  { id: '1', name: 'Connor McDavid', team: 'EDM', position: 'C', games_played: 58, goals: 38, assists: 62, points: 100, plus_minus: 22, penalty_minutes: 20, power_play_goals: 12, shorthanded_goals: 1, game_winning_goals: 5, shots: 210, shooting_pct: 18.1, time_on_ice_avg: '21:34', fantasy_points: 850.5, value: 95, sport: 'nhl' },
  { id: '2', name: 'Nathan MacKinnon', team: 'COL', position: 'C', games_played: 58, goals: 30, assists: 54, points: 84, plus_minus: 18, penalty_minutes: 26, power_play_goals: 8, shorthanded_goals: 0, game_winning_goals: 4, shots: 195, shooting_pct: 15.4, time_on_ice_avg: '22:10', fantasy_points: 720.3, value: 88, sport: 'nhl' },
  { id: '3', name: 'Nikita Kucherov', team: 'TB', position: 'RW', games_played: 57, goals: 32, assists: 55, points: 87, plus_minus: 15, penalty_minutes: 30, power_play_goals: 10, shorthanded_goals: 0, game_winning_goals: 3, shots: 180, shooting_pct: 17.8, time_on_ice_avg: '20:45', fantasy_points: 750.2, value: 90, sport: 'nhl' },
  { id: '4', name: 'David Pastrnak', team: 'BOS', position: 'RW', games_played: 58, goals: 42, assists: 38, points: 80, plus_minus: 20, penalty_minutes: 32, power_play_goals: 15, shorthanded_goals: 1, game_winning_goals: 6, shots: 230, shooting_pct: 18.3, time_on_ice_avg: '19:58', fantasy_points: 780.0, value: 92, sport: 'nhl' },
  { id: '5', name: 'Auston Matthews', team: 'TOR', position: 'C', games_played: 56, goals: 45, assists: 33, points: 78, plus_minus: 17, penalty_minutes: 12, power_play_goals: 14, shorthanded_goals: 0, game_winning_goals: 7, shots: 215, shooting_pct: 20.9, time_on_ice_avg: '20:22', fantasy_points: 765.8, value: 91, sport: 'nhl' },
  // Goalies
  { id: '6', name: 'Connor Hellebuyck', team: 'WPG', position: 'G', games_played: 48, wins: 32, losses: 12, otl: 4, goals_against_avg: 2.21, save_pct: 0.924, shutouts: 4, fantasy_points: 620.4, value: 94, sport: 'nhl' },
  { id: '7', name: 'Ilya Sorokin', team: 'NYI', position: 'G', games_played: 45, wins: 28, losses: 13, otl: 4, goals_against_avg: 2.35, save_pct: 0.918, shutouts: 3, fantasy_points: 580.2, value: 87, sport: 'nhl' },
  { id: '8', name: 'Jacob Markstrom', team: 'CGY', position: 'G', games_played: 44, wins: 27, losses: 14, otl: 3, goals_against_avg: 2.45, save_pct: 0.912, shutouts: 2, fantasy_points: 540.1, value: 82, sport: 'nhl' },
];

// API functions with fallback mock data
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

const SportIcon = () => <HockeyIcon fontSize="small" />;

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

const ConferenceChip = ({ conference }: { conference: string }) => {
  return (
    <Chip
      label={conference}
      size="small"
      color={conference === 'Eastern' ? 'info' : 'warning'}
      variant="outlined"
    />
  );
};

const DivisionChip = ({ division }: { division: string }) => {
  return <Chip label={division} size="small" variant="outlined" />;
};

const PointsBar = ({ percentage }: { percentage: number }) => {
  let color: 'success' | 'warning' | 'error' = 'success';
  if (percentage < 0.5) color = 'error';
  else if (percentage < 0.6) color = 'warning';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color="text.secondary">
        {(percentage * 100).toFixed(1)}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={percentage * 100}
        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
        color={color}
      />
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
// Main Component
// ----------------------------------------------------------------------

const NHLDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty = today
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [playerType, setPlayerType] = useState<'skaters' | 'goalies'>('skaters');

  // Fetch data – with fallback to mock data via the API functions
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

  // Filter standings by conference – with safety checks
  const filteredStandings = useMemo(() => {
    if (!standings || standings.length === 0) return [];
    if (selectedConference === 'all') return standings;
    return standings.filter((team) =>
      team.conference.toLowerCase() === selectedConference.toLowerCase()
    );
  }, [standings, selectedConference]);

  // Filter players by position and type – with safety checks
  const filteredPlayers = useMemo(() => {
    if (!players || players.length === 0) return [];
    let filtered = players;
    if (selectedPosition !== 'all') {
      filtered = filtered.filter((p) => p.position === selectedPosition);
    }
    // Rough separation of skaters vs goalies based on position
    if (playerType === 'skaters') {
      filtered = filtered.filter((p) => !['G'].includes(p.position));
    } else {
      filtered = filtered.filter((p) => ['G'].includes(p.position));
    }
    // Sort by fantasy points or points (desc)
    return filtered.sort((a, b) => (b.fantasy_points || b.points || 0) - (a.fantasy_points || a.points || 0));
  }, [players, selectedPosition, playerType]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleConferenceChange = (event: SelectChangeEvent) => {
    setSelectedConference(event.target.value);
  };

  const handlePositionChange = (event: SelectChangeEvent) => {
    setSelectedPosition(event.target.value);
  };

  const handlePlayerTypeChange = (event: SelectChangeEvent) => {
    setPlayerType(event.target.value as 'skaters' | 'goalies');
  };

  const handleRefresh = () => {
    refetchGames();
    refetchStandings();
    refetchPlayers();
  };

  // Loading state
  if (gamesLoading || standingsLoading || playersLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>
          NHL Dashboard
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={80} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Error state (but we have fallback data, so this should rarely appear)
  const error = gamesError || standingsError || playersError;
  if (error && games.length === 0 && standings.length === 0 && players.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Error loading NHL data: {(error as Error).message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <HockeyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            NHL Dashboard
          </Typography>
          <Chip
            icon={<CalendarIcon />}
            label={selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Today'}
            variant="outlined"
          />
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh all data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Games" />
          <Tab label="Standings" />
          <Tab label="Players" />
        </Tabs>
      </Box>

      {/* Tab: Games */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            NHL Games
          </Typography>
          {!games || games.length === 0 ? (
            <Alert severity="info">No games scheduled for today.</Alert>
          ) : (
            <Grid container spacing={3}>
              {games.map((game) => (
                <Grid item xs={12} md={6} key={game.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <GameStatusChip status={game.status} />
                        {game.broadcast && (
                          <Chip label={game.broadcast} size="small" variant="outlined" />
                        )}
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        {/* Away team */}
                        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {game.away_team}
                          </Typography>
                        </Box>
                        {/* Score / vs */}
                        <Box textAlign="center" sx={{ px: 2 }}>
                          {game.status === 'scheduled' ? (
                            <Typography variant="body1">@</Typography>
                          ) : (
                            <Typography variant="h5" fontWeight="bold">
                              {game.away_score ?? 0} - {game.home_score ?? 0}
                            </Typography>
                          )}
                        </Box>
                        {/* Home team */}
                        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                          <Typography variant="h6" fontWeight="bold">
                            {game.home_team}
                          </Typography>
                        </Box>
                      </Box>
                      {game.status === 'live' && game.period && game.time_remaining && (
                        <Box display="flex" justifyContent="center" mt={2}>
                          <Chip
                            label={`${game.period} • ${game.time_remaining}`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </Box>
                      )}
                      <Box display="flex" justifyContent="space-between" mt={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {game.venue}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(game.date).toLocaleString()}
                        </Typography>
                      </Box>
                      {!game.is_real_data && (
                        <Box display="flex" justifyContent="flex-end" mt={1}>
                          <Chip label="Simulated" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Tab: Standings */}
      {tabValue === 1 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">NHL Standings</Typography>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="conference-filter-label">Conference</InputLabel>
              <Select
                labelId="conference-filter-label"
                value={selectedConference}
                label="Conference"
                onChange={handleConferenceChange}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="eastern">Eastern</MenuItem>
                <MenuItem value="western">Western</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {!filteredStandings || filteredStandings.length === 0 ? (
            <Alert severity="info">No standings data available.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Team</TableCell>
                    <TableCell align="center">Conf</TableCell>
                    <TableCell align="center">Div</TableCell>
                    <TableCell align="center">GP</TableCell>
                    <TableCell align="center">W</TableCell>
                    <TableCell align="center">L</TableCell>
                    <TableCell align="center">OTL</TableCell>
                    <TableCell align="center">PTS</TableCell>
                    <TableCell align="center">P%</TableCell>
                    <TableCell align="center">GF</TableCell>
                    <TableCell align="center">GA</TableCell>
                    <TableCell align="center">DIFF</TableCell>
                    <TableCell align="center">STRK</TableCell>
                    <TableCell align="center">L10</TableCell>
                    <TableCell align="center">HOME</TableCell>
                    <TableCell align="center">AWAY</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStandings.map((team) => {
                    const diff = team.goals_for - team.goals_against;
                    return (
                      <TableRow key={team.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {team.team}
                            </Typography>
                            <Chip
                              label={team.abbreviation}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <ConferenceChip conference={team.conference} />
                        </TableCell>
                        <TableCell align="center">
                          <DivisionChip division={team.division} />
                        </TableCell>
                        <TableCell align="center">{team.games_played}</TableCell>
                        <TableCell align="center">{team.wins}</TableCell>
                        <TableCell align="center">{team.losses}</TableCell>
                        <TableCell align="center">{team.ot_losses}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold">
                            {team.points}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <PointsBar percentage={team.win_percentage} />
                        </TableCell>
                        <TableCell align="center">{team.goals_for}</TableCell>
                        <TableCell align="center">{team.goals_against}</TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            color={diff > 0 ? 'success.main' : diff < 0 ? 'error.main' : 'text.secondary'}
                          >
                            {diff > 0 ? '+' : ''}{diff}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <StreakChip streak={team.streak} />
                        </TableCell>
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
      )}

      {/* Tab: Players */}
      {tabValue === 2 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">NHL Player Stats</Typography>
            <Box display="flex" gap={2}>
              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel id="player-type-label">Type</InputLabel>
                <Select
                  labelId="player-type-label"
                  value={playerType}
                  label="Type"
                  onChange={handlePlayerTypeChange}
                >
                  <MenuItem value="skaters">Skaters</MenuItem>
                  <MenuItem value="goalies">Goalies</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel id="position-filter-label">Position</InputLabel>
                <Select
                  labelId="position-filter-label"
                  value={selectedPosition}
                  label="Position"
                  onChange={handlePositionChange}
                >
                  <MenuItem value="all">All</MenuItem>
                  {playerType === 'skaters' ? (
                    [
                      <MenuItem key="C" value="C">Center</MenuItem>,
                      <MenuItem key="LW" value="LW">Left Wing</MenuItem>,
                      <MenuItem key="RW" value="RW">Right Wing</MenuItem>,
                      <MenuItem key="D" value="D">Defense</MenuItem>
                    ]
                  ) : (
                    <MenuItem value="G">Goalie</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {!filteredPlayers || filteredPlayers.length === 0 ? (
            <Alert severity="info">No player data available.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell align="center">Team</TableCell>
                    <TableCell align="center">Pos</TableCell>
                    {playerType === 'skaters' ? (
                      <>
                        <TableCell align="center">GP</TableCell>
                        <TableCell align="center">G</TableCell>
                        <TableCell align="center">A</TableCell>
                        <TableCell align="center">PTS</TableCell>
                        <TableCell align="center">+/-</TableCell>
                        <TableCell align="center">PIM</TableCell>
                        <TableCell align="center">PPG</TableCell>
                        <TableCell align="center">SHG</TableCell>
                        <TableCell align="center">GWG</TableCell>
                        <TableCell align="center">SOG</TableCell>
                        <TableCell align="center">TOI/G</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="center">GP</TableCell>
                        <TableCell align="center">W</TableCell>
                        <TableCell align="center">L</TableCell>
                        <TableCell align="center">OTL</TableCell>
                        <TableCell align="center">GAA</TableCell>
                        <TableCell align="center">SV%</TableCell>
                        <TableCell align="center">SO</TableCell>
                      </>
                    )}
                    <TableCell align="center">Fantasy</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight="medium">
                            {player.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{player.team}</TableCell>
                      <TableCell align="center">
                        <Chip label={player.position} size="small" variant="outlined" />
                      </TableCell>
                      {playerType === 'skaters' ? (
                        <>
                          <TableCell align="center">{player.games_played || '—'}</TableCell>
                          <TableCell align="center">{player.goals || 0}</TableCell>
                          <TableCell align="center">{player.assists || 0}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {player.points || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              color={(player.plus_minus || 0) > 0 ? 'success.main' : (player.plus_minus || 0) < 0 ? 'error.main' : 'text.secondary'}
                            >
                              {player.plus_minus || 0}
                            </Typography>
                          </TableCell>
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
                          <Typography variant="body2" fontWeight="bold">
                            {player.fantasy_points?.toFixed(1) || '—'}
                          </Typography>
                          {player.value && (
                            <Chip
                              label={player.value.toFixed(1)}
                              size="small"
                              color={player.value > 90 ? 'success' : player.value > 70 ? 'warning' : 'default'}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Container>
  );
};

export default NHLDashboard;
