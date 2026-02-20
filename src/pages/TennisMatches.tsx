import React, { useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
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
  SportsTennis as TennisIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import tennisApi from '../services/tennis';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface TennisMatch {
  id: string;
  tournament: string;
  round: string;
  player1: {
    name: string;
    seed?: number;
    rank?: number;
  };
  player2: {
    name: string;
    seed?: number;
    rank?: number;
  };
  score?: string;
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled';
  date: string;
  court?: string;
  surface: string;
  best_of: number;
  winner?: 1 | 2;
}

interface TennisMatchesData {
  matches: TennisMatch[];
  last_updated: string;
  is_real_data: boolean;
}

interface TennisApiResponse {
  success: boolean;
  data: TennisMatchesData;
  message?: string;
}

// ----------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------
const getMockTennisMatches = (): TennisMatch[] => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return [
    // Today's matches
    {
      id: '1',
      tournament: 'Australian Open',
      round: 'Final',
      player1: { name: 'Novak Djokovic', seed: 1, rank: 1 },
      player2: { name: 'Jannik Sinner', seed: 4, rank: 4 },
      status: 'scheduled',
      date: `${today}T14:30:00Z`,
      court: 'Rod Laver Arena',
      surface: 'Hard',
      best_of: 5,
    },
    {
      id: '2',
      tournament: 'Roland Garros',
      round: 'Quarterfinal',
      player1: { name: 'Carlos Alcaraz', seed: 3, rank: 3 },
      player2: { name: 'Stefanos Tsitsipas', seed: 5, rank: 5 },
      status: 'live',
      score: '6-4, 3-6, 2-1',
      date: today,
      court: 'Court Philippe Chatrier',
      surface: 'Clay',
      best_of: 5,
    },
    {
      id: '3',
      tournament: 'Wimbledon',
      round: 'Semifinal',
      player1: { name: 'Daniil Medvedev', seed: 2, rank: 2 },
      player2: { name: 'Alexander Zverev', seed: 6, rank: 6 },
      status: 'completed',
      score: '7-6, 6-4, 6-3',
      date: yesterday,
      court: 'Centre Court',
      surface: 'Grass',
      best_of: 5,
      winner: 1,
    },
    {
      id: '4',
      tournament: 'US Open',
      round: 'Round of 16',
      player1: { name: 'Coco Gauff', seed: 3, rank: 3 },
      player2: { name: 'Iga Swiatek', seed: 1, rank: 1 },
      status: 'scheduled',
      date: `${today}T18:00:00Z`,
      court: 'Arthur Ashe Stadium',
      surface: 'Hard',
      best_of: 3,
    },
    {
      id: '5',
      tournament: 'Indian Wells',
      round: 'Final',
      player1: { name: 'Carlos Alcaraz', seed: 1, rank: 2 },
      player2: { name: 'Daniil Medvedev', seed: 2, rank: 3 },
      status: 'completed',
      score: '7-6, 6-1',
      date: yesterday,
      court: 'Stadium 1',
      surface: 'Hard',
      best_of: 3,
      winner: 1,
    },
    {
      id: '6',
      tournament: 'Miami Open',
      round: 'Quarterfinal',
      player1: { name: 'Jannik Sinner', seed: 2, rank: 4 },
      player2: { name: 'Alexander Zverev', seed: 4, rank: 5 },
      status: 'postponed',
      date: tomorrow,
      court: 'Grandstand',
      surface: 'Hard',
      best_of: 3,
    },
    {
      id: '7',
      tournament: 'Monte-Carlo Masters',
      round: 'Semifinal',
      player1: { name: 'Stefanos Tsitsipas', seed: 5, rank: 6 },
      player2: { name: 'Casper Ruud', seed: 7, rank: 7 },
      status: 'cancelled',
      date: yesterday,
      court: 'Court Rainier III',
      surface: 'Clay',
      best_of: 3,
    },
    // Add more as needed
  ];
};

const getMockMatchesData = (): TennisMatchesData => ({
  matches: getMockTennisMatches(),
  last_updated: new Date().toISOString(),
  is_real_data: false,
});

// ----------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------
function isMatchComplete(match: any): match is TennisMatch {
  return (
    match.id != null &&
    match.tournament != null &&
    match.round != null &&
    match.player1?.name != null &&
    match.player2?.name != null &&
    match.status != null &&
    match.date != null &&
    match.surface != null &&
    match.best_of != null
  );
}

function areMatchesComplete(matches: any[]): matches is TennisMatch[] {
  return matches.length > 0 && matches.every(isMatchComplete);
}

// ----------------------------------------------------------------------
// API function with fallback
// ----------------------------------------------------------------------
const fetchTennisMatches = async (date?: string, surface?: string): Promise<TennisApiResponse> => {
  try {
    // Call the real API
    const response = await tennisApi.getMatches(undefined, date);

    // Handle different response shapes
    if (Array.isArray(response)) {
      if (areMatchesComplete(response)) {
        return {
          success: true,
          data: {
            matches: response,
            last_updated: new Date().toISOString(),
            is_real_data: true,
          },
        };
      }
    } else if (response?.data && Array.isArray(response.data.matches)) {
      if (areMatchesComplete(response.data.matches)) {
        return response as TennisApiResponse;
      }
    } else if (response?.matches && Array.isArray(response.matches)) {
      if (areMatchesComplete(response.matches)) {
        return {
          success: true,
          data: {
            matches: response.matches,
            last_updated: response.last_updated || new Date().toISOString(),
            is_real_data: response.is_real_data ?? true,
          },
        };
      }
    }

    // Fallback to mock data
    console.warn('Tennis matches API returned incomplete/unexpected data, using mock');
    return {
      success: true,
      data: getMockMatchesData(),
    };
  } catch (error) {
    console.error('Error fetching tennis matches:', error);
    return {
      success: true,
      data: getMockMatchesData(),
    };
  }
};

// ----------------------------------------------------------------------
// Helper Components (defensive)
// ----------------------------------------------------------------------

const MatchStatusChip = ({ status }: { status?: string }) => {
  if (!status) return <Chip label="UNKNOWN" size="small" color="default" />;

  let color: 'success' | 'error' | 'warning' | 'default' | 'info' = 'default';
  let label = status.toUpperCase();
  if (status === 'live') {
    color = 'error';
    label = 'LIVE';
  } else if (status === 'completed') {
    color = 'default';
    label = 'FINAL';
  } else if (status === 'scheduled') {
    color = 'primary';
    label = 'SCHEDULED';
  } else if (status === 'postponed') {
    color = 'warning';
    label = 'PPD';
  } else if (status === 'cancelled') {
    color = 'default';
    label = 'CANC';
  }
  return <Chip label={label} size="small" color={color} />;
};

const SurfaceChip = ({ surface }: { surface?: string }) => {
  if (!surface) return <Chip label="N/A" size="small" variant="outlined" />;

  let color: 'success' | 'warning' | 'default' | 'primary' = 'default';
  if (surface === 'Grass') color = 'success';
  else if (surface === 'Clay') color = 'warning';
  else if (surface === 'Hard') color = 'primary';
  return <Chip label={surface} size="small" color={color} variant="outlined" />;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const TennisMatches: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tabValue, setTabValue] = useState<number>(0);
  const [surfaceFilter, setSurfaceFilter] = useState<string>('all');

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tennisMatches', selectedDate, surfaceFilter],
    queryFn: () => fetchTennisMatches(selectedDate, surfaceFilter !== 'all' ? surfaceFilter : undefined),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Safely extract matches
  const matches = useMemo(() => {
    if (!apiResponse) return [];
    if (apiResponse.data && Array.isArray(apiResponse.data.matches)) {
      return apiResponse.data.matches;
    }
    if (Array.isArray(apiResponse)) return apiResponse;
    return [];
  }, [apiResponse]);

  const lastUpdated = apiResponse?.data?.last_updated || new Date().toISOString();
  const isRealData = apiResponse?.data?.is_real_data ?? false;

  // Filter by surface and date (if needed, but API already filters by date)
  const filteredMatches = useMemo(() => {
    if (!Array.isArray(matches)) return [];
    let filtered = matches;
    if (surfaceFilter !== 'all') {
      filtered = filtered.filter((m) => m.surface?.toLowerCase() === surfaceFilter.toLowerCase());
    }
    // Optionally filter by selectedDate if API doesn't respect it
    // We'll assume API returns matches for the requested date.
    return filtered;
  }, [matches, surfaceFilter]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSurfaceChange = (event: SelectChangeEvent) => {
    setSurfaceFilter(event.target.value);
  };

  const handleDateChange = (event: SelectChangeEvent) => {
    setSelectedDate(event.target.value);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>
          Tennis Matches
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={80} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Only show error if we have no matches and there's an error
  if ((error || apiResponse?.success === false) && matches.length === 0) {
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
          Error loading tennis matches: {(error as Error)?.message || apiResponse?.message || 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <TennisIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Tennis Matches
          </Typography>
          <Chip
            icon={<CalendarIcon />}
            label={`Updated: ${new Date(lastUpdated).toLocaleDateString()}`}
            variant="outlined"
          />
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="date-select-label">Date</InputLabel>
            <Select
              labelId="date-select-label"
              value={selectedDate}
              label="Date"
              onChange={handleDateChange}
            >
              <MenuItem value={new Date().toISOString().split('T')[0]}>Today</MenuItem>
              <MenuItem
                value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              >
                Tomorrow
              </MenuItem>
              <MenuItem
                value={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
              >
                Yesterday
              </MenuItem>
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
      {!isRealData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Displaying simulated match data. Live data will appear when available.
        </Alert>
      )}

      {/* Surface filter */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="surface-filter-label">Surface</InputLabel>
          <Select
            labelId="surface-filter-label"
            value={surfaceFilter}
            label="Surface"
            onChange={handleSurfaceChange}
          >
            <MenuItem value="all">All Surfaces</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
            <MenuItem value="clay">Clay</MenuItem>
            <MenuItem value="grass">Grass</MenuItem>
            <MenuItem value="carpet">Carpet</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Matches" />
          <Tab label="Live / Today" />
          <Tab label="Completed" />
          <Tab label="Scheduled" />
        </Tabs>
      </Box>

      {/* Tab: All Matches (Grid) */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Matches on {new Date(selectedDate).toLocaleDateString()}
          </Typography>
          {filteredMatches.length === 0 ? (
            <Alert severity="info">No matches found for the selected filters.</Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredMatches.map((match) => (
                <Grid item xs={12} md={6} key={match.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <MatchStatusChip status={match.status} />
                        <SurfaceChip surface={match.surface} />
                      </Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {match.tournament ?? '—'} • {match.round ?? '—'}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
                        <Box textAlign="center" sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {match.player1?.name ?? 'TBD'}
                          </Typography>
                          {match.player1?.rank && (
                            <Typography variant="caption" color="text.secondary">
                              Rank #{match.player1.rank}
                            </Typography>
                          )}
                        </Box>
                        <Box textAlign="center" sx={{ px: 2 }}>
                          {match.status === 'scheduled' ? (
                            <Typography variant="body1">vs</Typography>
                          ) : (
                            <Typography variant="h5" fontWeight="bold">
                              {match.score || '?'}
                            </Typography>
                          )}
                        </Box>
                        <Box textAlign="center" sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold">
                            {match.player2?.name ?? 'TBD'}
                          </Typography>
                          {match.player2?.rank && (
                            <Typography variant="caption" color="text.secondary">
                              Rank #{match.player2.rank}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          {match.court ? `Court ${match.court}` : 'TBD'} • Best of {match.best_of ?? 3}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {match.date ? new Date(match.date).toLocaleTimeString() : 'TBD'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Tab: Live / Today */}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>
            Live & Today's Matches
          </Typography>
          {filteredMatches.filter((m) => m.status === 'live' || m.status === 'scheduled').length === 0 ? (
            <Alert severity="info">No live or scheduled matches found.</Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredMatches
                .filter((m) => m.status === 'live' || m.status === 'scheduled')
                .map((match) => (
                  <Grid item xs={12} md={6} key={match.id}>
                    <Card
                      variant="outlined"
                      sx={{ borderLeft: match.status === 'live' ? 4 : 0, borderColor: 'error.main' }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <MatchStatusChip status={match.status} />
                          <SurfaceChip surface={match.surface} />
                        </Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {match.tournament ?? '—'} • {match.round ?? '—'}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body1" fontWeight="bold">
                            {match.player1?.name ?? 'TBD'}
                          </Typography>
                          {match.status === 'live' && match.score && (
                            <Typography variant="body2">{match.score}</Typography>
                          )}
                          <Typography variant="body1" fontWeight="bold">
                            {match.player2?.name ?? 'TBD'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </>
      )}

      {/* Tab: Completed */}
      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>
            Completed Matches
          </Typography>
          {filteredMatches.filter((m) => m.status === 'completed').length === 0 ? (
            <Alert severity="info">No completed matches found.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tournament</TableCell>
                    <TableCell>Round</TableCell>
                    <TableCell>Player 1</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell>Player 2</TableCell>
                    <TableCell align="center">Surface</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMatches
                    .filter((m) => m.status === 'completed')
                    .map((match) => (
                      <TableRow key={match.id} hover>
                        <TableCell>{match.tournament ?? '—'}</TableCell>
                        <TableCell>{match.round ?? '—'}</TableCell>
                        <TableCell>{match.player1?.name ?? '—'}</TableCell>
                        <TableCell align="center">{match.score || 'N/A'}</TableCell>
                        <TableCell>{match.player2?.name ?? '—'}</TableCell>
                        <TableCell align="center">
                          <SurfaceChip surface={match.surface} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Tab: Scheduled */}
      {tabValue === 3 && (
        <>
          <Typography variant="h6" gutterBottom>
            Scheduled Matches
          </Typography>
          {filteredMatches.filter((m) => m.status === 'scheduled').length === 0 ? (
            <Alert severity="info">No scheduled matches found.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tournament</TableCell>
                    <TableCell>Round</TableCell>
                    <TableCell>Player 1</TableCell>
                    <TableCell>Player 2</TableCell>
                    <TableCell align="center">Date/Time</TableCell>
                    <TableCell align="center">Surface</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMatches
                    .filter((m) => m.status === 'scheduled')
                    .map((match) => (
                      <TableRow key={match.id} hover>
                        <TableCell>{match.tournament ?? '—'}</TableCell>
                        <TableCell>{match.round ?? '—'}</TableCell>
                        <TableCell>{match.player1?.name ?? '—'}</TableCell>
                        <TableCell>{match.player2?.name ?? '—'}</TableCell>
                        <TableCell align="center">
                          {match.date ? new Date(match.date).toLocaleString() : 'TBD'}
                        </TableCell>
                        <TableCell align="center">
                          <SurfaceChip surface={match.surface} />
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

export default TennisMatches;
