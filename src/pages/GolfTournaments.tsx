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
  SportsGolf as GolfIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon,
  MonetizationOn as PurseIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface GolfTournament {
  id: string;
  name: string;
  location: string;
  course: string;
  country: string;
  start_date: string;
  end_date: string;
  purse_usd: number;
  format: 'Stroke Play' | 'Match Play' | 'Team' | 'Other';
  tour: 'PGA' | 'DP World' | 'LIV' | 'Champions' | 'Korn Ferry' | 'Other';
  status: 'upcoming' | 'ongoing' | 'completed';
  defending_champion?: string;
  winner?: string;
  winner_score?: string;
}

interface GolfTournamentsData {
  tournaments: GolfTournament[];
  last_updated: string;
  is_real_data: boolean;
}

interface GolfTournamentsResponse {
  success: boolean;
  data: GolfTournamentsData;
  message?: string;
}

// ----------------------------------------------------------------------
// Mock data
// ----------------------------------------------------------------------
const getMockTournaments = (): GolfTournament[] => [
  {
    id: '1',
    name: 'The Masters',
    location: 'Augusta',
    course: 'Augusta National',
    country: 'USA',
    start_date: '2026-04-09',
    end_date: '2026-04-12',
    purse_usd: 18000000,
    format: 'Stroke Play',
    tour: 'PGA',
    status: 'upcoming',
    defending_champion: 'Scottie Scheffler',
  },
  {
    id: '2',
    name: 'PGA Championship',
    location: 'Louisville',
    course: 'Valhalla',
    country: 'USA',
    start_date: '2026-05-16',
    end_date: '2026-05-19',
    purse_usd: 17500000,
    format: 'Stroke Play',
    tour: 'PGA',
    status: 'upcoming',
    defending_champion: 'Brooks Koepka',
  },
  {
    id: '3',
    name: 'U.S. Open',
    location: 'Pinehurst',
    course: 'Pinehurst No. 2',
    country: 'USA',
    start_date: '2026-06-13',
    end_date: '2026-06-16',
    purse_usd: 20000000,
    format: 'Stroke Play',
    tour: 'PGA',
    status: 'upcoming',
    defending_champion: 'Wyndham Clark',
  },
  {
    id: '4',
    name: 'The Open Championship',
    location: 'Troon',
    course: 'Royal Troon',
    country: 'Scotland',
    start_date: '2026-07-18',
    end_date: '2026-07-21',
    purse_usd: 16500000,
    format: 'Stroke Play',
    tour: 'PGA',
    status: 'upcoming',
    defending_champion: 'Brian Harman',
  },
  {
    id: '5',
    name: 'THE PLAYERS Championship',
    location: 'Ponte Vedra Beach',
    course: 'TPC Sawgrass',
    country: 'USA',
    start_date: '2026-03-12',
    end_date: '2026-03-15',
    purse_usd: 25000000,
    format: 'Stroke Play',
    tour: 'PGA',
    status: 'completed',
    winner: 'Scottie Scheffler',
    winner_score: '-20',
  },
  {
    id: '6',
    name: 'LIV Golf Las Vegas',
    location: 'Las Vegas',
    course: 'Las Vegas CC',
    country: 'USA',
    start_date: '2026-02-08',
    end_date: '2026-02-10',
    purse_usd: 20000000,
    format: 'Stroke Play',
    tour: 'LIV',
    status: 'completed',
    winner: 'Jon Rahm',
    winner_score: '-15',
  },
];

const getMockTournamentsData = (): GolfTournamentsData => ({
  tournaments: getMockTournaments(),
  last_updated: new Date().toISOString(),
  is_real_data: false,
});

// ----------------------------------------------------------------------
// API client with fallback and validation
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const requiredFields: (keyof GolfTournament)[] = [
  'name',
  'location',
  'course',
  'country',
  'start_date',
  'end_date',
  'purse_usd',
  'format',
  'tour',
  'status',
];

function isTournamentComplete(t: any): t is GolfTournament {
  return requiredFields.every(field => t[field] != null);
}

function areTournamentsComplete(tournaments: any[]): tournaments is GolfTournament[] {
  return tournaments.length > 0 && tournaments.every(isTournamentComplete);
}

const fetchGolfTournaments = async (year?: number, tour?: string): Promise<GolfTournamentsData> => {
  try {
    const baseUrl = API_BASE_URL || window.location.origin;
    const url = new URL('/api/golf/tournaments', baseUrl);

    if (year) url.searchParams.append('year', String(year));
    if (tour && tour !== 'all') url.searchParams.append('tour', tour);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`API returned ${response.status}, using mock data`);
      return getMockTournamentsData();
    }
    const json: GolfTournamentsResponse = await response.json();
    if (!json.success || !json.data) {
      console.warn('API returned invalid response, using mock data');
      return getMockTournamentsData();
    }

    // Validate that the tournaments array is complete
    if (areTournamentsComplete(json.data.tournaments)) {
      return json.data;
    } else {
      console.warn('API returned incomplete tournament data, using mock');
      return getMockTournamentsData();
    }
  } catch (error) {
    console.error('Error fetching golf tournaments:', error);
    return getMockTournamentsData();
  }
};

// ----------------------------------------------------------------------
// Helper Components (defensive)
// ----------------------------------------------------------------------

const TournamentStatusChip = ({ status }: { status?: string }) => {
  if (!status) return <Chip label="UNKNOWN" size="small" color="default" />;

  let color: 'success' | 'error' | 'warning' | 'default' | 'info' = 'default';
  let label = status.toUpperCase();
  if (status === 'ongoing') {
    color = 'error';
    label = 'LIVE';
  } else if (status === 'completed') {
    color = 'default';
    label = 'FINAL';
  } else if (status === 'upcoming') {
    color = 'primary';
    label = 'UPCOMING';
  }
  return <Chip label={label} size="small" color={color} />;
};

const TourChip = ({ tour }: { tour?: string }) => {
  if (!tour) return <Chip label="N/A" size="small" variant="outlined" />;

  let color: 'primary' | 'secondary' | 'success' | 'warning' | 'default' = 'default';
  if (tour === 'PGA') color = 'primary';
  else if (tour === 'DP World') color = 'secondary';
  else if (tour === 'LIV') color = 'success';
  else if (tour === 'Champions') color = 'warning';
  return <Chip label={tour} size="small" color={color} variant="outlined" />;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const GolfTournaments: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<number>(0);
  const [tourFilter, setTourFilter] = useState<string>('all');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  const {
    data: tournamentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['golfTournaments', selectedYear, tourFilter],
    queryFn: () => fetchGolfTournaments(selectedYear, tourFilter),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Ensure we have an array
  const tournaments = useMemo(() => tournamentsData?.tournaments ?? [], [tournamentsData]);

  const handleYearChange = (event: SelectChangeEvent) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTourChange = (event: SelectChangeEvent) => {
    setTourFilter(event.target.value);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>
          Golf Tournaments
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

  // Show error only if we have no data at all (shouldn't happen due to mock)
  if (error && tournaments.length === 0) {
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
          Error loading golf tournaments: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  // Use the data, which might be mock
  const isRealData = tournamentsData?.is_real_data ?? false;
  const lastUpdated = tournamentsData?.last_updated ?? new Date().toISOString();

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <GolfIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Golf Tournaments
          </Typography>
          <Chip
            icon={<CalendarIcon />}
            label={`Updated: ${new Date(lastUpdated).toLocaleDateString()}`}
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
      {!isRealData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Displaying simulated tournament data. Live data will appear when available.
        </Alert>
      )}

      {/* Tour filter */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="tour-filter-label">Tour</InputLabel>
          <Select
            labelId="tour-filter-label"
            value={tourFilter}
            label="Tour"
            onChange={handleTourChange}
          >
            <MenuItem value="all">All Tours</MenuItem>
            <MenuItem value="PGA">PGA Tour</MenuItem>
            <MenuItem value="DP World">DP World Tour</MenuItem>
            <MenuItem value="LIV">LIV Golf</MenuItem>
            <MenuItem value="Champions">Champions Tour</MenuItem>
            <MenuItem value="Korn Ferry">Korn Ferry Tour</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Tournaments" />
          <Tab label="Majors" />
          <Tab label="Upcoming" />
          <Tab label="Completed" />
        </Tabs>
      </Box>

      {/* Tab: All Tournaments (Table) */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            {tourFilter === 'all' ? 'All Tournaments' : `${tourFilter} Tournaments`} – {selectedYear}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tournament</TableCell>
                  <TableCell align="center">Location</TableCell>
                  <TableCell align="center">Course</TableCell>
                  <TableCell align="center">Dates</TableCell>
                  <TableCell align="center">Purse</TableCell>
                  <TableCell align="center">Tour</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Winner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tournaments.map((tournament) => (
                  <TableRow key={tournament.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {tournament.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <LocationIcon fontSize="small" />
                        {tournament.location ?? '—'}, {tournament.country ?? '—'}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{tournament.course ?? '—'}</TableCell>
                    <TableCell align="center">
                      {tournament.start_date && tournament.end_date
                        ? `${new Date(tournament.start_date).toLocaleDateString()} – ${new Date(tournament.end_date).toLocaleDateString()}`
                        : 'TBD'}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PurseIcon fontSize="small" />
                        ${((tournament.purse_usd ?? 0) / 1e6).toFixed(1)}M
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <TourChip tour={tournament.tour} />
                    </TableCell>
                    <TableCell align="center">
                      <TournamentStatusChip status={tournament.status} />
                    </TableCell>
                    <TableCell align="center">
                      {tournament.winner ?? tournament.defending_champion ?? 'TBD'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab: Majors */}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>
            Major Championships
          </Typography>
          <Grid container spacing={3}>
            {tournaments
              .filter(t => {
                const name = t.name ?? '';
                return ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'].some(major => name.includes(major));
              })
              .map((tournament) => (
                <Grid item xs={12} md={6} key={tournament.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">{tournament.name}</Typography>
                        <TrophyIcon color="primary" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {tournament.course ?? '—'}, {tournament.location ?? '—'}, {tournament.country ?? '—'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Dates</Typography>
                        <Typography variant="body2">
                          {tournament.start_date && tournament.end_date
                            ? `${new Date(tournament.start_date).toLocaleDateString()} – ${new Date(tournament.end_date).toLocaleDateString()}`
                            : 'TBD'}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Purse</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${((tournament.purse_usd ?? 0) / 1e6).toFixed(1)}M
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Defending Champion</Typography>
                        <Typography variant="body2">{tournament.defending_champion ?? 'N/A'}</Typography>
                      </Box>
                      {tournament.status === 'completed' && tournament.winner && (
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Winner</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {tournament.winner} {tournament.winner_score && `(${tournament.winner_score})`}
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

      {/* Tab: Upcoming */}
      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>
            Upcoming Tournaments
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tournament</TableCell>
                  <TableCell align="center">Tour</TableCell>
                  <TableCell align="center">Location</TableCell>
                  <TableCell align="center">Start Date</TableCell>
                  <TableCell align="center">Purse</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tournaments
                  .filter(t => t.status === 'upcoming')
                  .sort((a, b) => {
                    const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
                    const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
                    return aDate - bDate;
                  })
                  .map((tournament) => (
                    <TableRow key={tournament.id} hover>
                      <TableCell>{tournament.name}</TableCell>
                      <TableCell align="center">
                        <TourChip tour={tournament.tour} />
                      </TableCell>
                      <TableCell align="center">{tournament.location ?? '—'}</TableCell>
                      <TableCell align="center">
                        {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'TBD'}
                      </TableCell>
                      <TableCell align="center">
                        ${((tournament.purse_usd ?? 0) / 1e6).toFixed(1)}M
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab: Completed */}
      {tabValue === 3 && (
        <>
          <Typography variant="h6" gutterBottom>
            Completed Tournaments
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tournament</TableCell>
                  <TableCell align="center">Dates</TableCell>
                  <TableCell align="center">Winner</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Purse</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tournaments
                  .filter(t => t.status === 'completed')
                  .sort((a, b) => {
                    const aDate = a.end_date ? new Date(a.end_date).getTime() : 0;
                    const bDate = b.end_date ? new Date(b.end_date).getTime() : 0;
                    return bDate - aDate; // most recent first
                  })
                  .map((tournament) => (
                    <TableRow key={tournament.id} hover>
                      <TableCell>{tournament.name}</TableCell>
                      <TableCell align="center">
                        {tournament.start_date && tournament.end_date
                          ? `${new Date(tournament.start_date).toLocaleDateString()} – ${new Date(tournament.end_date).toLocaleDateString()}`
                          : 'TBD'}
                      </TableCell>
                      <TableCell align="center">
                        {tournament.winner ?? tournament.defending_champion ?? 'N/A'}
                      </TableCell>
                      <TableCell align="center">{tournament.winner_score ?? '-'}</TableCell>
                      <TableCell align="center">
                        ${((tournament.purse_usd ?? 0) / 1e6).toFixed(1)}M
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Container>
  );
};

export default GolfTournaments;
