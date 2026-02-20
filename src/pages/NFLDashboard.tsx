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
  EmojiEvents as TrophyIcon,
  SportsFootball as FootballIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Person as PersonIcon,
  Stadium as StadiumIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';

// ----------------------------------------------------------------------
// Types – matching backend responses
// ----------------------------------------------------------------------

interface NFLGame {
  id: string;
  awayTeam: { name: string; abbreviation: string; score: number };
  homeTeam: { name: string; abbreviation: string; score: number };
  awayScore: number;
  homeScore: number;
  status: 'scheduled' | 'live' | 'final';
  period?: string;
  timeRemaining?: string;
  venue: string;
  broadcast: string;
  date: string;
  week: number;
  is_real_data?: boolean;
}

interface NFLStanding {
  id: string;
  name: string;
  abbreviation: string;
  wins: number;
  losses: number;
  ties: number;
  win_percentage: number;
  points_for: number;
  points_against: number;
  conference: string;
  division: string;
  streak: string;
  last_5: string;
  home_record: string;
  away_record: string;
  conference_record: string;
  division_record: string;
  is_real_data?: boolean;
}

interface NFLPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  fantasy_points?: number;
  projected_points?: number;
  value?: number;
  points?: number;
  rebounds?: number;
  assists?: number;
  passing_yards?: number;
  rushing_yards?: number;
  receiving_yards?: number;
  touchdowns?: number;
  sport: string;
}

interface NFLGamesResponse {
  success: boolean;
  games: NFLGame[];
  count: number;
  week: string | number;
  source: string;
}

interface NFLStandingsResponse {
  success: boolean;
  standings: NFLStanding[];
  count: number;
  season: string;
  source: string;
}

interface NFLPlayersResponse {
  success: boolean;
  players: NFLPlayer[];
  count: number;
  sport: string;
}

// ----------------------------------------------------------------------
// API client
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const fetchNFLGames = async (week: string | number = 'current'): Promise<NFLGame[]> => {
  const url = new URL(`${API_BASE_URL}/api/nfl/games`);
  url.searchParams.append('week', String(week));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch NFL games');
  const data: NFLGamesResponse = await response.json();
  return data.games || [];
};

const fetchNFLStandings = async (season?: string): Promise<NFLStanding[]> => {
  const url = new URL(`${API_BASE_URL}/api/nfl/standings`);
  if (season) url.searchParams.append('season', season);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch NFL standings');
  const data: NFLStandingsResponse = await response.json();
  return data.standings || [];
};

const fetchNFLPlayers = async (limit: number = 20): Promise<NFLPlayer[]> => {
  const url = new URL(`${API_BASE_URL}/api/players`);
  url.searchParams.append('sport', 'nfl');
  url.searchParams.append('limit', String(limit));
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch NFL players');
  const data: NFLPlayersResponse = await response.json();
  return data.players || [];
};

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

const SportIcon = () => <FootballIcon fontSize="small" />;

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

const WinPercentageBar = ({ percentage }: { percentage: number }) => {
  let color: 'success' | 'warning' | 'error' = 'success';
  if (percentage < 0.4) color = 'error';
  else if (percentage < 0.5) color = 'warning';
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

const NFLDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [selectedWeek, setSelectedWeek] = useState<string | number>('current');
  const [selectedConference, setSelectedConference] = useState<string>('all');

  // Fetch data
  const {
    data: games = [],
    isLoading: gamesLoading,
    error: gamesError,
    refetch: refetchGames,
  } = useQuery({
    queryKey: ['nflGames', selectedWeek],
    queryFn: () => fetchNFLGames(selectedWeek),
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: standings = [],
    isLoading: standingsLoading,
    error: standingsError,
    refetch: refetchStandings,
  } = useQuery({
    queryKey: ['nflStandings'],
    queryFn: () => fetchNFLStandings(),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: players = [],
    isLoading: playersLoading,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: ['nflPlayers'],
    queryFn: () => fetchNFLPlayers(20),
    staleTime: 1000 * 60 * 5,
  });

  // Filter standings by conference
  const filteredStandings = useMemo(() => {
    if (!standings.length) return [];
    if (selectedConference === 'all') return standings;
    return standings.filter((team) =>
      team.conference.toLowerCase() === selectedConference.toLowerCase()
    );
  }, [standings, selectedConference]);

  // Week options (1-18 for current season)
  const weekOptions = useMemo(() => {
    const weeks = ['current'];
    for (let i = 1; i <= 18; i++) weeks.push(i.toString());
    return weeks;
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleWeekChange = (event: SelectChangeEvent) => {
    setSelectedWeek(event.target.value);
  };

  const handleConferenceChange = (event: SelectChangeEvent) => {
    setSelectedConference(event.target.value);
  };

  const handleRefresh = () => {
    refetchGames();
    refetchStandings();
    refetchPlayers();
  };

  // Loading state
  if (gamesLoading || standingsLoading || playersLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          NFL Dashboard
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

  // Error state
  const error = gamesError || standingsError || playersError;
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Error loading NFL data: {(error as Error).message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <FootballIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            NFL Dashboard
          </Typography>
          <Chip
            icon={<CalendarIcon />}
            label={`Week ${selectedWeek === 'current' ? 'Current' : selectedWeek}`}
            variant="outlined"
          />
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="week-select-label">Week</InputLabel>
            <Select
              labelId="week-select-label"
              value={String(selectedWeek)}
              label="Week"
              onChange={handleWeekChange}
            >
              {weekOptions.map((week) => (
                <MenuItem key={week} value={week}>
                  {week === 'current' ? 'Current' : `Week ${week}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <Tab label="Top Players" />
        </Tabs>
      </Box>

      {/* Tab: Games */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Week {selectedWeek === 'current' ? 'Current' : selectedWeek} Games
          </Typography>
          {games.length === 0 ? (
            <Alert severity="info">No games scheduled for this week.</Alert>
          ) : (
            <Grid container spacing={3}>
              {games.map((game) => (
                <Grid item xs={12} md={6} key={game.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <GameStatusChip status={game.status} />
                        <Typography variant="caption" color="text.secondary">
                          {game.venue} • {game.broadcast}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        {/* Away team */}
                        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {game.awayTeam.abbreviation}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {game.awayTeam.name}
                          </Typography>
                        </Box>
                        {/* Score / vs */}
                        <Box textAlign="center" sx={{ px: 2 }}>
                          {game.status === 'scheduled' ? (
                            <Typography variant="body1">@</Typography>
                          ) : (
                            <Typography variant="h5" fontWeight="bold">
                              {game.awayScore} - {game.homeScore}
                            </Typography>
                          )}
                        </Box>
                        {/* Home team */}
                        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {game.homeTeam.name}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {game.homeTeam.abbreviation}
                          </Typography>
                        </Box>
                      </Box>
                      {game.status === 'live' && game.period && game.timeRemaining && (
                        <Box display="flex" justifyContent="center" mt={2}>
                          <Chip
                            label={`${game.period} • ${game.timeRemaining}`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </Box>
                      )}
                      <Box display="flex" justifyContent="space-between" mt={2}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(game.date).toLocaleString()}
                        </Typography>
                        {!game.is_real_data && (
                          <Chip label="Simulated" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        )}
                      </Box>
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
            <Typography variant="h6">NFL Standings</Typography>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="conference-filter-label">Conference</InputLabel>
              <Select
                labelId="conference-filter-label"
                value={selectedConference}
                label="Conference"
                onChange={handleConferenceChange}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="afc">AFC</MenuItem>
                <MenuItem value="nfc">NFC</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell align="center">W</TableCell>
                  <TableCell align="center">L</TableCell>
                  <TableCell align="center">T</TableCell>
                  <TableCell align="center">PCT</TableCell>
                  <TableCell align="center">PF</TableCell>
                  <TableCell align="center">PA</TableCell>
                  <TableCell align="center">DIFF</TableCell>
                  <TableCell align="center">STRK</TableCell>
                  <TableCell align="center">L5</TableCell>
                  <TableCell align="center">HOME</TableCell>
                  <TableCell align="center">AWAY</TableCell>
                  <TableCell align="center">DIV</TableCell>
                  <TableCell align="center">CONF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStandings.map((team) => {
                  const diff = (team.points_for || 0) - (team.points_against || 0);
                  return (
                    <TableRow key={team.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {team.name}
                          </Typography>
                          <Chip
                            label={team.abbreviation}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {team.conference} • {team.division}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{team.wins}</TableCell>
                      <TableCell align="center">{team.losses}</TableCell>
                      <TableCell align="center">{team.ties || 0}</TableCell>
                      <TableCell align="center">
                        <WinPercentageBar percentage={team.win_percentage} />
                      </TableCell>
                      <TableCell align="center">{team.points_for || 0}</TableCell>
                      <TableCell align="center">{team.points_against || 0}</TableCell>
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
                      <TableCell align="center">{team.last_5 || '—'}</TableCell>
                      <TableCell align="center">{team.home_record}</TableCell>
                      <TableCell align="center">{team.away_record}</TableCell>
                      <TableCell align="center">{team.division_record}</TableCell>
                      <TableCell align="center">{team.conference_record}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab: Top Players */}
      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>
            Top NFL Players (Fantasy)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">Team</TableCell>
                  <TableCell align="center">Position</TableCell>
                  <TableCell align="center">Fantasy Pts</TableCell>
                  <TableCell align="center">Projected</TableCell>
                  <TableCell align="center">Value</TableCell>
                  <TableCell align="center">Pass Yds</TableCell>
                  <TableCell align="center">Rush Yds</TableCell>
                  <TableCell align="center">Rec Yds</TableCell>
                  <TableCell align="center">TD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((player) => (
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
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {player.fantasy_points?.toFixed(1) || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {player.projected_points?.toFixed(1) || '—'}
                    </TableCell>
                    <TableCell align="center">
                      {player.value ? (
                        <Chip
                          label={player.value.toFixed(1)}
                          size="small"
                          color={player.value > 90 ? 'success' : player.value > 70 ? 'warning' : 'default'}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="center">{player.passing_yards || '—'}</TableCell>
                    <TableCell align="center">{player.rushing_yards || '—'}</TableCell>
                    <TableCell align="center">{player.receiving_yards || '—'}</TableCell>
                    <TableCell align="center">{player.touchdowns || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!players.length && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No player data available.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default NFLDashboard;
