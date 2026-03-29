// src/pages/GolfTournaments.tsx
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
import ProtectedRoute from '../components/ProtectedRoute';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface GolfTournament {
  id: string | number;
  name: string;
  location: string;          // e.g. "Kapalua, Maui, Hawaii"
  course: string;
  country: string;
  start_date: string;        // ISO date or display string
  end_date: string;          // may be ISO or display string like "Jan 2 - 5"
  purse_usd: number;
  format: 'Stroke Play' | 'Match Play' | 'Team' | 'Other';
  tour: 'PGA' | 'DP World' | 'LIV' | 'Champions' | 'Korn Ferry' | 'Other';
  status: 'upcoming' | 'ongoing' | 'completed';
  defending_champion?: string | null;
  winner?: string | null;
  winner_score?: string | null;
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

// Helper to parse purse string like "$20,000,000" -> 20000000
const parsePurse = (purseStr?: string): number => {
  if (!purseStr) return 0;
  const numeric = purseStr.replace(/[^0-9.]/g, '');
  return parseFloat(numeric) || 0;
};

// Map API status to our status strings
const mapStatus = (apiStatus: string): 'upcoming' | 'ongoing' | 'completed' => {
  const upper = apiStatus?.toUpperCase() || '';
  if (upper.includes('COMPLETE')) return 'completed';
  if (upper.includes('UPCOMING')) return 'upcoming';
  if (upper.includes('LIVE') || upper.includes('ONGOING')) return 'ongoing';
  return 'upcoming'; // default
};

// Map raw API tournament object to our GolfTournament interface
const mapApiTournament = (apiTournament: any): GolfTournament => {
  const locationParts = [apiTournament.city, apiTournament.state].filter(Boolean);
  const location = locationParts.join(', ') || apiTournament.city || '';

  // Extract winner info from champion object
  const champion = apiTournament.champion;
  const winnerName = champion ? `${champion.first_name} ${champion.last_name}` : null;

  return {
    id: apiTournament.id,
    name: apiTournament.name,
    location,
    course: apiTournament.course_name || '',
    country: apiTournament.country || '',
    start_date: apiTournament.start_date,
    end_date: apiTournament.end_date, // may be non‑ISO string
    purse_usd: parsePurse(apiTournament.purse),
    format: 'Stroke Play', // not provided by API
    tour: 'PGA', // all tournaments from this endpoint are PGA
    status: mapStatus(apiTournament.status),
    defending_champion: null, // not available
    winner: winnerName,
    winner_score: null, // not in tournaments endpoint
  };
};

// Required fields after mapping – allow nulls, only require existence
const requiredFields: (keyof GolfTournament)[] = [
  'id',
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

function isTournamentMinimallyComplete(t: any): t is GolfTournament {
  return requiredFields.every(field => t[field] !== undefined);
}

function areTournamentsComplete(tournaments: any[]): tournaments is GolfTournament[] {
  return tournaments.length > 0 && tournaments.every(isTournamentMinimallyComplete);
}

const fetchGolfTournaments = async (season?: number, tour?: string): Promise<GolfTournamentsData> => {
  try {
    const baseUrl = API_BASE_URL || window.location.origin;
    const url = new URL('/api/golf/tournaments', baseUrl);
    if (season) url.searchParams.append('season', String(season));
    if (tour && tour !== 'all') url.searchParams.append('tour', tour);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`API returned ${response.status}, using mock data`);
      return getMockTournamentsData();
    }
    const json: GolfTournamentsResponse = await response.json();

    // Debug logs (remove after fixing)
    console.log('Raw API response data:', json.data);
    console.log('First tournament item:', json.data?.tournaments?.[0]);

    if (!json.success || !json.data) {
      console.warn('API returned invalid response, using mock data');
      return getMockTournamentsData();
    }

    // ✅ If it's mock data from backend, just use our own mock (which is more complete)
    if (!json.data.is_real_data) {
      console.log('Backend mock is incomplete – using local mock');
      return getMockTournamentsData();
    }

    // For real data, proceed with mapping/validation as before
    let tournaments: GolfTournament[] = [];
    const rawTournaments = json.data.tournaments;

    if (Array.isArray(rawTournaments)) {
      // Case 1: Already in our GolfTournament format
      if (rawTournaments.length > 0 && rawTournaments.every(t => t.id !== undefined && t.name !== undefined)) {
        tournaments = rawTournaments.map(t => ({
          id: t.id ?? '',
          name: t.name ?? 'Unknown',
          location: t.location ?? '',
          course: t.course ?? '',
          country: t.country ?? '',
          start_date: t.start_date ?? '',
          end_date: t.end_date ?? '',
          purse_usd: t.purse_usd ?? 0,
          format: t.format ?? 'Stroke Play',
          tour: t.tour ?? 'PGA',
          status: t.status ?? 'upcoming',
          defending_champion: t.defending_champion ?? null,
          winner: t.winner ?? null,
          winner_score: t.winner_score ?? null,
        }));
      }
      // Case 2: Raw API data (has course_name, city, etc.)
      else if (rawTournaments.length > 0 && rawTournaments[0].course_name !== undefined) {
        tournaments = rawTournaments.map(mapApiTournament);
        tournaments = tournaments.map(t => ({
          ...t,
          location: t.location ?? '',
          course: t.course ?? '',
          country: t.country ?? '',
          start_date: t.start_date ?? '',
          end_date: t.end_date ?? '',
          purse_usd: t.purse_usd || 0,
          format: t.format || 'Stroke Play',
          tour: t.tour || 'PGA',
          status: t.status || 'upcoming',
        }));
      } else {
        console.warn('API returned unexpected data format, using mock');
        return getMockTournamentsData();
      }

      // Final sanity check
      if (!tournaments.every(t => t.id && t.name && t.start_date)) {
        console.warn('Mapped tournaments missing essential fields, using mock');
        return getMockTournamentsData();
      }
    } else {
      console.warn('API returned non-array tournaments, using mock');
      return getMockTournamentsData();
    }

    return {
      tournaments,
      last_updated: json.data.last_updated || new Date().toISOString(),
      is_real_data: json.data.is_real_data || false,
    };
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

// Helper to format date display safely
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'TBD';
  // If it's an ISO string, format it; otherwise return as is
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString();
  }
  return dateStr; // non-ISO string like "Jan 2 - 5"
};

// ----------------------------------------------------------------------
// Main Content Component
// ----------------------------------------------------------------------

const GolfTournamentsContent: React.FC = () => {
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
                        {tournament.location ? `${tournament.location}, ${tournament.country}` : tournament.country}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{tournament.course || '—'}</TableCell>
                    <TableCell align="center">
                      {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <PurseIcon fontSize="small" />
                        ${((tournament.purse_usd || 0) / 1e6).toFixed(1)}M
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
                        {tournament.course || '—'}, {tournament.location || '—'}, {tournament.country || '—'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Dates</Typography>
                        <Typography variant="body2">
                          {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Purse</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${((tournament.purse_usd || 0) / 1e6).toFixed(1)}M
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
                      <TableCell align="center">{tournament.location || '—'}</TableCell>
                      <TableCell align="center">{formatDate(tournament.start_date)}</TableCell>
                      <TableCell align="center">
                        ${((tournament.purse_usd || 0) / 1e6).toFixed(1)}M
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
                    return bDate - aDate;
                  })
                  .map((tournament) => (
                    <TableRow key={tournament.id} hover>
                      <TableCell>{tournament.name}</TableCell>
                      <TableCell align="center">
                        {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
                      </TableCell>
                      <TableCell align="center">
                        {tournament.winner ?? tournament.defending_champion ?? 'N/A'}
                      </TableCell>
                      <TableCell align="center">{tournament.winner_score ?? '-'}</TableCell>
                      <TableCell align="center">
                        ${((tournament.purse_usd || 0) / 1e6).toFixed(1)}M
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

// ----------------------------------------------------------------------
// Main exported component wrapped with ProtectedRoute
// ----------------------------------------------------------------------

const GolfTournaments: React.FC = () => {
  return (
    <ProtectedRoute screenName="GolfTournaments">
      <GolfTournamentsContent />
    </ProtectedRoute>
  );
};

export default GolfTournaments;
