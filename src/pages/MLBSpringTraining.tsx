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
  SportsBaseball as BaseballIcon,
  CalendarMonth as CalendarIcon,
  WbSunny as SunnyIcon,
  AcUnit as ColdIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// ----------------------------------------------------------------------
// Types – based on expected MLB Spring Training API response
// ----------------------------------------------------------------------

interface SpringGame {
  id: string;
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  venue: string;
  location: string;
  league: 'Grapefruit' | 'Cactus';
  date: string;
  broadcast?: string;
  weather?: {
    condition: string;
    temperature: number;
    wind?: string;
  };
}

interface SpringStanding {
  id: string;
  team: string;
  abbreviation: string;
  league: 'Grapefruit' | 'Cactus';
  wins: number;
  losses: number;
  ties: number;
  win_percentage: number;
  games_back: number;
  home_record: string;
  away_record: string;
  streak: string;
  last_10: string;
}

interface SpringPlayerStat {
  id: string;
  name: string;
  team: string;
  position: string;
  // Hitting
  avg?: number;
  hr?: number;
  rbi?: number;
  ops?: number;
  // Pitching
  era?: number;
  whip?: number;
  so?: number;
  ip?: number;
  is_prospect?: boolean;
}

interface SpringTrainingData {
  games: SpringGame[];
  standings: SpringStanding[];
  hitters: SpringPlayerStat[];
  pitchers: SpringPlayerStat[];
  prospects: SpringPlayerStat[];
  date_range: {
    start: string;
    end: string;
  };
  last_updated: string;
  is_real_data: boolean;
}

interface SpringTrainingResponse {
  success: boolean;
  data: SpringTrainingData;
  message?: string;
}

// ----------------------------------------------------------------------
// API client – with fallback base URL and rich mock data on failure
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Rich mock data to use when the API is unavailable
const getMockSpringTrainingData = (): SpringTrainingData => ({
  games: [
    {
      id: '1',
      home_team: 'BOS',
      away_team: 'NYY',
      home_score: undefined,
      away_score: undefined,
      status: 'scheduled',
      venue: 'JetBlue Park',
      location: 'Fort Myers, FL',
      league: 'Grapefruit',
      date: new Date().toISOString(),
      broadcast: 'MLB Network',
      weather: { condition: 'Sunny', temperature: 82, wind: '5 mph' }
    },
    {
      id: '2',
      home_team: 'CHC',
      away_team: 'SF',
      home_score: 5,
      away_score: 3,
      status: 'final',
      venue: 'Sloan Park',
      location: 'Mesa, AZ',
      league: 'Cactus',
      date: new Date().toISOString(),
      broadcast: 'Marquee',
      weather: { condition: 'Clear', temperature: 78, wind: '3 mph' }
    },
    {
      id: '3',
      home_team: 'LAD',
      away_team: 'MIL',
      home_score: 2,
      away_score: 2,
      status: 'final',
      venue: 'Camelback Ranch',
      location: 'Glendale, AZ',
      league: 'Cactus',
      date: new Date().toISOString(),
      weather: { condition: 'Sunny', temperature: 85, wind: '7 mph' }
    },
  ],
  standings: [
    { id: '1', team: 'Boston Red Sox', abbreviation: 'BOS', league: 'Grapefruit', wins: 12, losses: 5, ties: 1, win_percentage: 0.706, games_back: 0.0, home_record: '7-2-0', away_record: '5-3-1', streak: 'W3', last_10: '8-2-0' },
    { id: '2', team: 'New York Yankees', abbreviation: 'NYY', league: 'Grapefruit', wins: 10, losses: 7, ties: 1, win_percentage: 0.588, games_back: 2.0, home_record: '5-3-1', away_record: '5-4-0', streak: 'L1', last_10: '6-4-0' },
    { id: '3', team: 'Chicago Cubs', abbreviation: 'CHC', league: 'Cactus', wins: 11, losses: 6, ties: 0, win_percentage: 0.647, games_back: 0.0, home_record: '6-2-0', away_record: '5-4-0', streak: 'W2', last_10: '7-3-0' },
    { id: '4', team: 'Los Angeles Dodgers', abbreviation: 'LAD', league: 'Cactus', wins: 9, losses: 8, ties: 1, win_percentage: 0.529, games_back: 2.0, home_record: '5-3-1', away_record: '4-5-0', streak: 'L2', last_10: '4-5-1' },
  ],
  hitters: [
    { id: 'h1', name: 'Rafael Devers', team: 'BOS', position: '3B', avg: 0.385, hr: 4, rbi: 12, ops: 1.102, is_prospect: false },
    { id: 'h2', name: 'Aaron Judge', team: 'NYY', position: 'OF', avg: 0.350, hr: 5, rbi: 14, ops: 1.250, is_prospect: false },
    { id: 'h3', name: 'Michael Busch', team: 'CHC', position: '2B', avg: 0.420, hr: 3, rbi: 9, ops: 1.180, is_prospect: true },
    { id: 'h4', name: 'James Outman', team: 'LAD', position: 'OF', avg: 0.310, hr: 2, rbi: 7, ops: 0.980, is_prospect: true },
  ],
  pitchers: [
    { id: 'p1', name: 'Garrett Whitlock', team: 'BOS', position: 'P', era: 1.80, whip: 0.90, so: 18, ip: 15.0, is_prospect: false },
    { id: 'p2', name: 'Carlos Rodón', team: 'NYY', position: 'P', era: 3.00, whip: 1.10, so: 20, ip: 12.0, is_prospect: false },
    { id: 'p3', name: 'Cade Horton', team: 'CHC', position: 'P', era: 2.25, whip: 0.85, so: 22, ip: 16.0, is_prospect: true },
    { id: 'p4', name: 'Gavin Stone', team: 'LAD', position: 'P', era: 2.70, whip: 1.05, so: 19, ip: 13.1, is_prospect: true },
  ],
  prospects: [
    { id: 'ph1', name: 'Jackson Holliday', team: 'BAL', position: 'SS', avg: 0.400, hr: 2, rbi: 8, ops: 1.150, is_prospect: true },
    { id: 'pp1', name: 'Paul Skenes', team: 'PIT', position: 'P', era: 1.50, whip: 0.80, so: 25, ip: 18.0, is_prospect: true },
    { id: 'ph2', name: 'Wyatt Langford', team: 'TEX', position: 'OF', avg: 0.375, hr: 4, rbi: 11, ops: 1.200, is_prospect: true },
    { id: 'pp2', name: 'Rhett Lowder', team: 'CIN', position: 'P', era: 2.10, whip: 0.95, so: 20, ip: 15.2, is_prospect: true },
  ],
  date_range: {
    start: 'Feb 20',
    end: 'Mar 26',
  },
  last_updated: new Date().toISOString(),
  is_real_data: false,
});

const fetchSpringTrainingData = async (year?: number): Promise<SpringTrainingData> => {
  try {
    const baseUrl = API_BASE_URL || window.location.origin;
    const url = new URL('/api/mlb/spring-training', baseUrl);
    if (year) url.searchParams.append('year', String(year));

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`Spring Training API returned ${response.status}: ${response.statusText}. Using mock data.`);
      return getMockSpringTrainingData();
    }

    const json: SpringTrainingResponse = await response.json();
    if (!json.success || !json.data) {
      console.warn('Spring Training API returned invalid response. Using mock data.');
      return getMockSpringTrainingData();
    }

    // If the API returned empty arrays but we want to show something, we still return mock.
    // But we'll assume the API data is valid if present.
    return json.data;
  } catch (error) {
    console.error('Failed to fetch Spring Training data:', error);
    return getMockSpringTrainingData();
  }
};

// ----------------------------------------------------------------------
// Helper Components (with defensive props) – unchanged
// ----------------------------------------------------------------------

const GameStatusChip = ({ status }: { status?: string }) => {
  if (!status) return <Chip label="UNKNOWN" size="small" color="default" />;

  let color: 'success' | 'error' | 'warning' | 'default' | 'info' = 'default';
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
  } else if (status === 'postponed') {
    color = 'warning';
    label = 'PPD';
  }
  return <Chip label={label} size="small" color={color} />;
};

const LeagueChip = ({ league }: { league?: string }) => {
  if (!league) return <Chip label="N/A" size="small" variant="outlined" />;
  return (
    <Chip
      icon={league === 'Grapefruit' ? <SunnyIcon /> : <ColdIcon />}
      label={league}
      size="small"
      color={league === 'Grapefruit' ? 'success' : 'info'}
      variant="outlined"
    />
  );
};

const WinPercentageBar = ({ percentage }: { percentage?: number }) => {
  if (percentage === undefined) return null;
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

const StreakChip = ({ streak }: { streak?: string }) => {
  if (!streak) return <Chip label="—" size="small" variant="outlined" />;
  let color: 'success' | 'error' | 'default' = 'default';
  if (streak.startsWith('W')) color = 'success';
  else if (streak.startsWith('L')) color = 'error';
  return <Chip label={streak} size="small" color={color} variant="outlined" />;
};

const ProspectChip = () => (
  <Chip label="Prospect" size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem' }} />
);

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const MLBSpringTraining: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<number>(0);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current, current + 1];
  }, []);

  const {
    data: springData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['springTraining', selectedYear],
    queryFn: () => fetchSpringTrainingData(selectedYear),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Filter games by league
  const filteredGames = useMemo(() => {
    if (!springData?.games?.length) return [];
    if (leagueFilter === 'all') return springData.games;
    return springData.games.filter((game) => game.league?.toLowerCase() === leagueFilter.toLowerCase());
  }, [springData, leagueFilter]);

  // Filter standings by league
  const filteredStandings = useMemo(() => {
    if (!springData?.standings?.length) return [];
    if (leagueFilter === 'all') return springData.standings;
    return springData.standings.filter((team) => team.league?.toLowerCase() === leagueFilter.toLowerCase());
  }, [springData, leagueFilter]);

  // Filter hitters by position
  const filteredHitters = useMemo(() => {
    if (!springData?.hitters?.length) return [];
    if (positionFilter === 'all') return springData.hitters;
    return springData.hitters.filter((p) => p.position === positionFilter);
  }, [springData, positionFilter]);

  const handleYearChange = (event: SelectChangeEvent) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLeagueChange = (event: SelectChangeEvent) => {
    setLeagueFilter(event.target.value);
  };

  const handlePositionChange = (event: SelectChangeEvent) => {
    setPositionFilter(event.target.value);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>
          MLB Spring Training
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

  // Even if error occurred, we have mock data (error is only for network/fetch issues)
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Error loading Spring Training data: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  // springData is guaranteed to exist because fetch returns mock data on failure,
  // but we add optional chaining everywhere to be extra safe.
  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <BaseballIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            MLB Spring Training
          </Typography>
          <Chip
            icon={<CalendarIcon />}
            label={`${springData?.date_range?.start ?? 'N/A'} – ${springData?.date_range?.end ?? 'N/A'}`}
            variant="outlined"
          />
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 100 }} size="small">
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={String(selectedYear)}
              label="Year"
              onChange={handleYearChange}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Data source notice */}
      {springData && !springData.is_real_data && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Displaying simulated Spring Training data. Live data will appear when available.
        </Alert>
      )}

      {/* League filter */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="league-filter-label">League</InputLabel>
          <Select
            labelId="league-filter-label"
            value={leagueFilter}
            label="League"
            onChange={handleLeagueChange}
          >
            <MenuItem value="all">All Leagues</MenuItem>
            <MenuItem value="grapefruit">Grapefruit League</MenuItem>
            <MenuItem value="cactus">Cactus League</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Games" />
          <Tab label="Standings" />
          <Tab label="Hitting Leaders" />
          <Tab label="Pitching Leaders" />
          <Tab label="Top Prospects" />
        </Tabs>
      </Box>

      {/* Tab: Games */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Spring Training Games
          </Typography>
          {filteredGames.length === 0 ? (
            <Alert severity="info">No games found for the selected filter.</Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredGames.map((game) => (
                <Grid item xs={12} md={6} key={game.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <GameStatusChip status={game.status} />
                        <LeagueChip league={game.league} />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {game.away_team}
                          </Typography>
                        </Box>
                        <Box textAlign="center" sx={{ px: 2 }}>
                          {game.status === 'scheduled' ? (
                            <Typography variant="body1">@</Typography>
                          ) : (
                            <Typography variant="h5" fontWeight="bold">
                              {game.away_score ?? 0} - {game.home_score ?? 0}
                            </Typography>
                          )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={2} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                          <Typography variant="h6" fontWeight="bold">
                            {game.home_team}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            {game.venue}, {game.location}
                          </Typography>
                        </Box>
                        {game.weather && (
                          <Box display="flex" alignItems="center" gap={1}>
                            {game.weather.temperature > 70 ? <SunnyIcon fontSize="small" /> : <ColdIcon fontSize="small" />}
                            <Typography variant="caption" color="text.secondary">
                              {game.weather.temperature}°F • {game.weather.condition}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="caption" color="text.secondary">
                          {game.date ? new Date(game.date).toLocaleString() : 'TBD'}
                        </Typography>
                        {game.broadcast && (
                          <Chip label={game.broadcast} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
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
          <Typography variant="h6" gutterBottom>
            {leagueFilter === 'all' ? 'Spring Training Standings' : `${leagueFilter} League Standings`}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell align="center">League</TableCell>
                  <TableCell align="center">W</TableCell>
                  <TableCell align="center">L</TableCell>
                  <TableCell align="center">T</TableCell>
                  <TableCell align="center">PCT</TableCell>
                  <TableCell align="center">GB</TableCell>
                  <TableCell align="center">HOME</TableCell>
                  <TableCell align="center">AWAY</TableCell>
                  <TableCell align="center">STRK</TableCell>
                  <TableCell align="center">L10</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStandings.map((team) => (
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
                      <LeagueChip league={team.league} />
                    </TableCell>
                    <TableCell align="center">{team.wins ?? 0}</TableCell>
                    <TableCell align="center">{team.losses ?? 0}</TableCell>
                    <TableCell align="center">{team.ties ?? 0}</TableCell>
                    <TableCell align="center">
                      <WinPercentageBar percentage={team.win_percentage} />
                    </TableCell>
                    <TableCell align="center">{team.games_back?.toFixed(1) ?? '—'}</TableCell>
                    <TableCell align="center">{team.home_record ?? '—'}</TableCell>
                    <TableCell align="center">{team.away_record ?? '—'}</TableCell>
                    <TableCell align="center">
                      <StreakChip streak={team.streak} />
                    </TableCell>
                    <TableCell align="center">{team.last_10 ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab: Hitting Leaders */}
      {tabValue === 2 && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Spring Training Hitting Leaders</Typography>
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel id="position-filter-label">Position</InputLabel>
              <Select
                labelId="position-filter-label"
                value={positionFilter}
                label="Position"
                onChange={handlePositionChange}
              >
                <MenuItem value="all">All Positions</MenuItem>
                <MenuItem value="C">Catcher</MenuItem>
                <MenuItem value="1B">First Base</MenuItem>
                <MenuItem value="2B">Second Base</MenuItem>
                <MenuItem value="3B">Third Base</MenuItem>
                <MenuItem value="SS">Shortstop</MenuItem>
                <MenuItem value="OF">Outfield</MenuItem>
                <MenuItem value="DH">DH</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">Team</TableCell>
                  <TableCell align="center">Pos</TableCell>
                  <TableCell align="center">AVG</TableCell>
                  <TableCell align="center">HR</TableCell>
                  <TableCell align="center">RBI</TableCell>
                  <TableCell align="center">OPS</TableCell>
                  <TableCell align="center">Prospect</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHitters.map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {player.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{player.team ?? '—'}</TableCell>
                    <TableCell align="center">{player.position ?? '—'}</TableCell>
                    <TableCell align="center">{player.avg?.toFixed(3) ?? '.000'}</TableCell>
                    <TableCell align="center">{player.hr ?? 0}</TableCell>
                    <TableCell align="center">{player.rbi ?? 0}</TableCell>
                    <TableCell align="center">{player.ops?.toFixed(3) ?? '.000'}</TableCell>
                    <TableCell align="center">
                      {player.is_prospect && <ProspectChip />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab: Pitching Leaders */}
      {tabValue === 3 && (
        <>
          <Typography variant="h6" gutterBottom>
            Spring Training Pitching Leaders
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">Team</TableCell>
                  <TableCell align="center">IP</TableCell>
                  <TableCell align="center">ERA</TableCell>
                  <TableCell align="center">WHIP</TableCell>
                  <TableCell align="center">SO</TableCell>
                  <TableCell align="center">Prospect</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(springData?.pitchers ?? []).map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {player.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{player.team ?? '—'}</TableCell>
                    <TableCell align="center">{player.ip?.toFixed(1) ?? '0.0'}</TableCell>
                    <TableCell align="center">{player.era?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell align="center">{player.whip?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell align="center">{player.so ?? 0}</TableCell>
                    <TableCell align="center">
                      {player.is_prospect && <ProspectChip />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

{/* Tab: Top Prospects */}
      {tabValue === 4 && (
        <>
          <Typography variant="h6" gutterBottom>
            Top Spring Training Prospects
          </Typography>
          <Grid container spacing={3}>
            {(springData?.prospects ?? []).map((prospect) => (
              <Grid item xs={12} md={6} lg={4} key={prospect.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{prospect.name}</Typography>
                      <ProspectChip />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {prospect.team ?? '—'} • {prospect.position ?? '—'}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {prospect.avg != null ? (
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2">AVG</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {prospect.avg.toFixed(3)}
                        </Typography>
                      </Box>
                    ) : prospect.era != null ? (
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2">ERA</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {prospect.era.toFixed(2)}
                        </Typography>
                      </Box>
                    ) : null}
                    {prospect.hr != null && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">HR</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {prospect.hr}
                        </Typography>
                      </Box>
                    )}
                    {prospect.rbi != null && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">RBI</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {prospect.rbi}
                        </Typography>
                      </Box>
                    )}
                    {prospect.so != null && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">SO</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {prospect.so}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default MLBSpringTraining;
