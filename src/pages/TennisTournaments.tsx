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
  EmojiEvents as TrophyIcon,
  Grass as GrassIcon,
  AcUnit as HardIcon,
  Spa as ClayIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import tennisApi from '../services/tennis';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface TennisTournament {
  id: string;
  name: string;
  location: string;
  country: string;
  surface: string;
  category: string;
  start_date: string;
  end_date: string;
  prize_money_usd: number;
  draw_size: number;
  defending_champion?: string;
}

interface TennisTournamentsData {
  tournaments: TennisTournament[];
  last_updated: string;
  is_real_data: boolean;
}

interface TennisApiResponse {
  success: boolean;
  data: TennisTournamentsData;
  message?: string;
}

// ----------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------
const getMockTennisTournaments = (): TennisTournament[] => [
  {
    id: '1',
    name: 'Australian Open',
    location: 'Melbourne',
    country: 'Australia',
    surface: 'Hard',
    category: 'Grand Slam',
    start_date: '2026-01-12',
    end_date: '2026-01-26',
    prize_money_usd: 76500000,
    draw_size: 128,
    defending_champion: 'Jannik Sinner',
  },
  {
    id: '2',
    name: 'Roland Garros',
    location: 'Paris',
    country: 'France',
    surface: 'Clay',
    category: 'Grand Slam',
    start_date: '2026-05-25',
    end_date: '2026-06-08',
    prize_money_usd: 49600000,
    draw_size: 128,
    defending_champion: 'Carlos Alcaraz',
  },
  {
    id: '3',
    name: 'Wimbledon',
    location: 'London',
    country: 'United Kingdom',
    surface: 'Grass',
    category: 'Grand Slam',
    start_date: '2026-06-29',
    end_date: '2026-07-12',
    prize_money_usd: 62000000,
    draw_size: 128,
    defending_champion: 'Carlos Alcaraz',
  },
  {
    id: '4',
    name: 'US Open',
    location: 'New York',
    country: 'USA',
    surface: 'Hard',
    category: 'Grand Slam',
    start_date: '2026-08-25',
    end_date: '2026-09-08',
    prize_money_usd: 65000000,
    draw_size: 128,
    defending_champion: 'Novak Djokovic',
  },
  {
    id: '5',
    name: 'Indian Wells',
    location: 'Indian Wells',
    country: 'USA',
    surface: 'Hard',
    category: 'ATP Masters 1000',
    start_date: '2026-03-04',
    end_date: '2026-03-17',
    prize_money_usd: 17700000,
    draw_size: 96,
    defending_champion: 'Carlos Alcaraz',
  },
  {
    id: '6',
    name: 'Miami Open',
    location: 'Miami',
    country: 'USA',
    surface: 'Hard',
    category: 'ATP Masters 1000',
    start_date: '2026-03-19',
    end_date: '2026-03-30',
    prize_money_usd: 16400000,
    draw_size: 96,
    defending_champion: 'Jannik Sinner',
  },
  {
    id: '7',
    name: 'Monte-Carlo Masters',
    location: 'Monte Carlo',
    country: 'Monaco',
    surface: 'Clay',
    category: 'ATP Masters 1000',
    start_date: '2026-04-07',
    end_date: '2026-04-13',
    prize_money_usd: 10800000,
    draw_size: 56,
    defending_champion: 'Stefanos Tsitsipas',
  },
  {
    id: '8',
    name: 'Madrid Open',
    location: 'Madrid',
    country: 'Spain',
    surface: 'Clay',
    category: 'ATP Masters 1000',
    start_date: '2026-04-22',
    end_date: '2026-05-04',
    prize_money_usd: 16500000,
    draw_size: 96,
    defending_champion: 'Andrey Rublev',
  },
  {
    id: '9',
    name: 'Italian Open',
    location: 'Rome',
    country: 'Italy',
    surface: 'Clay',
    category: 'ATP Masters 1000',
    start_date: '2026-05-06',
    end_date: '2026-05-18',
    prize_money_usd: 16200000,
    draw_size: 96,
    defending_champion: 'Alexander Zverev',
  },
  {
    id: '10',
    name: 'Canadian Open',
    location: 'Montreal/Toronto',
    country: 'Canada',
    surface: 'Hard',
    category: 'ATP Masters 1000',
    start_date: '2026-08-04',
    end_date: '2026-08-10',
    prize_money_usd: 16500000,
    draw_size: 56,
    defending_champion: 'Alexei Popyrin',
  },
  {
    id: '11',
    name: 'Cincinnati Masters',
    location: 'Cincinnati',
    country: 'USA',
    surface: 'Hard',
    category: 'ATP Masters 1000',
    start_date: '2026-08-11',
    end_date: '2026-08-17',
    prize_money_usd: 16500000,
    draw_size: 56,
    defending_champion: 'Jannik Sinner',
  },
  {
    id: '12',
    name: 'Shanghai Masters',
    location: 'Shanghai',
    country: 'China',
    surface: 'Hard',
    category: 'ATP Masters 1000',
    start_date: '2026-10-05',
    end_date: '2026-10-12',
    prize_money_usd: 16500000,
    draw_size: 96,
    defending_champion: 'Daniil Medvedev',
  },
  {
    id: '13',
    name: 'Paris Masters',
    location: 'Paris',
    country: 'France',
    surface: 'Hard (indoor)',
    category: 'ATP Masters 1000',
    start_date: '2026-10-27',
    end_date: '2026-11-02',
    prize_money_usd: 16500000,
    draw_size: 56,
    defending_champion: 'Ugo Humbert',
  },
  {
    id: '14',
    name: 'ATP Finals',
    location: 'Turin',
    country: 'Italy',
    surface: 'Hard (indoor)',
    category: 'Tour Finals',
    start_date: '2026-11-10',
    end_date: '2026-11-17',
    prize_money_usd: 15000000,
    draw_size: 8,
    defending_champion: 'Novak Djokovic',
  },
  // Add some 500/250 events
  {
    id: '15',
    name: 'Rotterdam Open',
    location: 'Rotterdam',
    country: 'Netherlands',
    surface: 'Hard (indoor)',
    category: 'ATP 500',
    start_date: '2026-02-10',
    end_date: '2026-02-16',
    prize_money_usd: 2210000,
    draw_size: 32,
    defending_champion: 'Jannik Sinner',
  },
  {
    id: '16',
    name: 'Rio Open',
    location: 'Rio de Janeiro',
    country: 'Brazil',
    surface: 'Clay',
    category: 'ATP 500',
    start_date: '2026-02-17',
    end_date: '2026-02-23',
    prize_money_usd: 2100000,
    draw_size: 32,
    defending_champion: 'Sebastian Baez',
  },
  {
    id: '17',
    name: 'Dubai Tennis Championships',
    location: 'Dubai',
    country: 'UAE',
    surface: 'Hard',
    category: 'ATP 500',
    start_date: '2026-02-24',
    end_date: '2026-03-01',
    prize_money_usd: 2940000,
    draw_size: 32,
    defending_champion: 'Ugo Humbert',
  },
  {
    id: '18',
    name: 'Barcelona Open',
    location: 'Barcelona',
    country: 'Spain',
    surface: 'Clay',
    category: 'ATP 500',
    start_date: '2026-04-15',
    end_date: '2026-04-21',
    prize_money_usd: 2730000,
    draw_size: 48,
    defending_champion: 'Casper Ruud',
  },
  {
    id: '19',
    name: 'Halle Open',
    location: 'Halle',
    country: 'Germany',
    surface: 'Grass',
    category: 'ATP 500',
    start_date: '2026-06-16',
    end_date: '2026-06-22',
    prize_money_usd: 2345000,
    draw_size: 32,
    defending_champion: 'Jannik Sinner',
  },
  {
    id: '20',
    name: 'Queen’s Club Championships',
    location: 'London',
    country: 'United Kingdom',
    surface: 'Grass',
    category: 'ATP 500',
    start_date: '2026-06-16',
    end_date: '2026-06-22',
    prize_money_usd: 2370000,
    draw_size: 32,
    defending_champion: 'Tommy Paul',
  },
  {
    id: '21',
    name: 'Vienna Open',
    location: 'Vienna',
    country: 'Austria',
    surface: 'Hard (indoor)',
    category: 'ATP 500',
    start_date: '2026-10-20',
    end_date: '2026-10-26',
    prize_money_usd: 2450000,
    draw_size: 32,
    defending_champion: 'Jannik Sinner',
  },
  {
    id: '22',
    name: 'Swiss Indoors',
    location: 'Basel',
    country: 'Switzerland',
    surface: 'Hard (indoor)',
    category: 'ATP 500',
    start_date: '2026-10-20',
    end_date: '2026-10-26',
    prize_money_usd: 2410000,
    draw_size: 32,
    defending_champion: 'Felix Auger-Aliassime',
  },
];

const getMockTournamentsData = (): TennisTournamentsData => ({
  tournaments: getMockTennisTournaments(),
  last_updated: new Date().toISOString(),
  is_real_data: false,
});

// ----------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------
const requiredFields: (keyof TennisTournament)[] = [
  'name',
  'location',
  'country',
  'surface',
  'category',
  'start_date',
  'end_date',
  'prize_money_usd',
  'draw_size',
];

function isTournamentComplete(t: any): t is TennisTournament {
  return requiredFields.every(field => t[field] != null);
}

function areTournamentsComplete(tournaments: any[]): tournaments is TennisTournament[] {
  return tournaments.length > 0 && tournaments.every(isTournamentComplete);
}

// ----------------------------------------------------------------------
// API function with fallback
// ----------------------------------------------------------------------
const fetchTennisTournaments = async (year?: number, surface?: string): Promise<TennisApiResponse> => {
  try {
    // Call the real API
    const response = await tennisApi.getTournaments(surface as any);

    // Handle different response shapes
    if (Array.isArray(response)) {
      if (areTournamentsComplete(response)) {
        return {
          success: true,
          data: {
            tournaments: response,
            last_updated: new Date().toISOString(),
            is_real_data: true,
          },
        };
      }
    } else if (response?.data && Array.isArray(response.data.tournaments)) {
      if (areTournamentsComplete(response.data.tournaments)) {
        return response as TennisApiResponse;
      }
    } else if (response?.tournaments && Array.isArray(response.tournaments)) {
      if (areTournamentsComplete(response.tournaments)) {
        return {
          success: true,
          data: {
            tournaments: response.tournaments,
            last_updated: response.last_updated || new Date().toISOString(),
            is_real_data: response.is_real_data ?? true,
          },
        };
      }
    }

    // Fallback to mock data
    console.warn('Tennis tournaments API returned incomplete/unexpected data, using mock');
    return {
      success: true,
      data: getMockTournamentsData(),
    };
  } catch (error) {
    console.error('Error fetching tennis tournaments:', error);
    return {
      success: true,
      data: getMockTournamentsData(),
    };
  }
};

// ----------------------------------------------------------------------
// Helper Components (defensive)
// ----------------------------------------------------------------------

const SurfaceIcon = ({ surface }: { surface?: string }) => {
  if (!surface) return <TennisIcon fontSize="small" />;
  switch (surface) {
    case 'Grass':
      return <GrassIcon fontSize="small" />;
    case 'Clay':
      return <ClayIcon fontSize="small" />;
    case 'Hard':
      return <HardIcon fontSize="small" />;
    default:
      return <TennisIcon fontSize="small" />;
  }
};

const SurfaceChip = ({ surface }: { surface?: string }) => {
  if (!surface) return <Chip label="—" size="small" variant="outlined" />;
  let color: 'success' | 'warning' | 'default' | 'primary' = 'default';
  if (surface === 'Grass') color = 'success';
  else if (surface === 'Clay') color = 'warning';
  else if (surface === 'Hard') color = 'primary';
  return (
    <Chip
      icon={<SurfaceIcon surface={surface} />}
      label={surface}
      size="small"
      color={color}
      variant="outlined"
    />
  );
};

const CategoryChip = ({ category }: { category?: string }) => {
  if (!category) return <Chip label="N/A" size="small" color="default" />;

  let color: 'primary' | 'secondary' | 'success' | 'default' = 'default';
  if (category.includes('Grand Slam')) color = 'primary';
  else if (category.includes('Masters') || category.includes('Finals')) color = 'secondary';
  else if (category.includes('500')) color = 'success';

  return <Chip label={category} size="small" color={color} />;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const TennisTournaments: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<number>(0);
  const [surfaceFilter, setSurfaceFilter] = useState<string>('all');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tennisTournaments', selectedYear, surfaceFilter],
    queryFn: () => fetchTennisTournaments(selectedYear, surfaceFilter !== 'all' ? surfaceFilter : undefined),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Safely extract tournaments
  const tournaments = useMemo(() => {
    if (!apiResponse) return [];
    if (apiResponse.data && Array.isArray(apiResponse.data.tournaments)) {
      return apiResponse.data.tournaments;
    }
    if (Array.isArray(apiResponse)) return apiResponse;
    return [];
  }, [apiResponse]);

  const lastUpdated = apiResponse?.data?.last_updated || new Date().toISOString();
  const isRealData = apiResponse?.data?.is_real_data ?? false;

  // Filter by surface (if not "all")
  const filteredTournaments = useMemo(() => {
    if (!Array.isArray(tournaments)) return [];
    if (surfaceFilter === 'all') return tournaments;
    return tournaments.filter(t => t.surface === surfaceFilter);
  }, [tournaments, surfaceFilter]);

  const handleYearChange = (event: SelectChangeEvent) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSurfaceChange = (event: SelectChangeEvent) => {
    setSurfaceFilter(event.target.value);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>
          Tennis Tournaments
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

  // Only show error if we have no tournaments and there's an error
  if ((error || apiResponse?.success === false) && tournaments.length === 0) {
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
          Error loading tennis tournaments: {(error as Error)?.message || apiResponse?.message || 'Unknown error'}
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
            Tennis Tournaments
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
            <MenuItem value="Hard">Hard</MenuItem>
            <MenuItem value="Clay">Clay</MenuItem>
            <MenuItem value="Grass">Grass</MenuItem>
            <MenuItem value="Carpet">Carpet</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Tournaments" />
          <Tab label="Grand Slams" />
          <Tab label="Masters / 1000" />
          <Tab label="500 / 250" />
        </Tabs>
      </Box>

      {/* Tab: All Tournaments (Table) */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            {surfaceFilter === 'all' ? 'All Tournaments' : `${surfaceFilter} Court Tournaments`}
          </Typography>
          {filteredTournaments.length === 0 ? (
            <Alert severity="info">No tournaments found for the selected filter.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tournament</TableCell>
                    <TableCell align="center">Location</TableCell>
                    <TableCell align="center">Surface</TableCell>
                    <TableCell align="center">Category</TableCell>
                    <TableCell align="center">Dates</TableCell>
                    <TableCell align="center">Prize Money</TableCell>
                    <TableCell align="center">Draw</TableCell>
                    <TableCell align="center">Defending Champ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTournaments.map((tournament) => (
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
                      <TableCell align="center">
                        <SurfaceChip surface={tournament.surface} />
                      </TableCell>
                      <TableCell align="center">
                        <CategoryChip category={tournament.category} />
                      </TableCell>
                      <TableCell align="center">
                        {tournament.start_date && tournament.end_date
                          ? `${new Date(tournament.start_date).toLocaleDateString()} – ${new Date(tournament.end_date).toLocaleDateString()}`
                          : 'TBD'}
                      </TableCell>
                      <TableCell align="center">
                        ${((tournament.prize_money_usd ?? 0) / 1e6).toFixed(1)}M
                      </TableCell>
                      <TableCell align="center">{tournament.draw_size ?? '—'}</TableCell>
                      <TableCell align="center">{tournament.defending_champion ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Tab: Grand Slams */}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>
            Grand Slam Tournaments
          </Typography>
          {filteredTournaments.filter(t => t.category?.includes('Grand Slam')).length === 0 ? (
            <Alert severity="info">No Grand Slam tournaments found for the selected filter.</Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredTournaments
                .filter((t) => t.category?.includes('Grand Slam'))
                .map((tournament) => (
                  <Grid item xs={12} md={6} key={tournament.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{tournament.name}</Typography>
                          <TrophyIcon color="primary" />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {tournament.location ?? '—'}, {tournament.country ?? '—'}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Surface</Typography>
                          <SurfaceChip surface={tournament.surface} />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Dates</Typography>
                          <Typography variant="body2">
                            {tournament.start_date && tournament.end_date
                              ? `${new Date(tournament.start_date).toLocaleDateString()} – ${new Date(tournament.end_date).toLocaleDateString()}`
                              : 'TBD'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Prize Money</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            ${((tournament.prize_money_usd ?? 0) / 1e6).toFixed(1)}M
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Defending Champion</Typography>
                          <Typography variant="body2">{tournament.defending_champion || 'N/A'}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </>
      )}

      {/* Tab: Masters / 1000 */}
      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>
            ATP Masters 1000 Tournaments
          </Typography>
          {filteredTournaments.filter(t => t.category?.includes('Masters') || t.category?.includes('1000')).length === 0 ? (
            <Alert severity="info">No Masters 1000 tournaments found for the selected filter.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tournament</TableCell>
                    <TableCell align="center">Location</TableCell>
                    <TableCell align="center">Surface</TableCell>
                    <TableCell align="center">Dates</TableCell>
                    <TableCell align="center">Prize Money</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTournaments
                    .filter((t) => t.category?.includes('Masters') || t.category?.includes('1000'))
                    .map((tournament) => (
                      <TableRow key={tournament.id} hover>
                        <TableCell>{tournament.name}</TableCell>
                        <TableCell align="center">{tournament.location ?? '—'}</TableCell>
                        <TableCell align="center">
                          <SurfaceChip surface={tournament.surface} />
                        </TableCell>
                        <TableCell align="center">
                          {tournament.start_date && tournament.end_date
                            ? `${new Date(tournament.start_date).toLocaleDateString()} – ${new Date(tournament.end_date).toLocaleDateString()}`
                            : 'TBD'}
                        </TableCell>
                        <TableCell align="center">
                          ${((tournament.prize_money_usd ?? 0) / 1e6).toFixed(1)}M
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Tab: 500 / 250 */}
      {tabValue === 3 && (
        <>
          <Typography variant="h6" gutterBottom>
            ATP 500 & 250 Tournaments
          </Typography>
          {filteredTournaments.filter(t => t.category?.includes('500') || t.category?.includes('250')).length === 0 ? (
            <Alert severity="info">No 500/250 tournaments found for the selected filter.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tournament</TableCell>
                    <TableCell align="center">Location</TableCell>
                    <TableCell align="center">Category</TableCell>
                    <TableCell align="center">Surface</TableCell>
                    <TableCell align="center">Dates</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTournaments
                    .filter((t) => t.category?.includes('500') || t.category?.includes('250'))
                    .map((tournament) => (
                      <TableRow key={tournament.id} hover>
                        <TableCell>{tournament.name}</TableCell>
                        <TableCell align="center">{tournament.location ?? '—'}</TableCell>
                        <TableCell align="center">
                          <CategoryChip category={tournament.category} />
                        </TableCell>
                        <TableCell align="center">
                          <SurfaceChip surface={tournament.surface} />
                        </TableCell>
                        <TableCell align="center">
                          {tournament.start_date && tournament.end_date
                            ? `${new Date(tournament.start_date).toLocaleDateString()} – ${new Date(tournament.end_date).toLocaleDateString()}`
                            : 'TBD'}
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

export default TennisTournaments;
