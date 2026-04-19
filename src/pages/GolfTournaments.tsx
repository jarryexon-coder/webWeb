// src/pages/GolfTournaments.tsx - Analytics plan required
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
import { useAuth } from '../contexts/AuthContext';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface GolfTournament {
  id: string | number;
  name: string;
  location: string;
  course: string;
  country: string;
  start_date: string;
  end_date: string;
  purse_usd: number;
  format: string;
  tour: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  defending_champion?: string | null;
  winner?: string | null;
  winner_score?: string | null;
}

// ----------------------------------------------------------------------
// Mock data
// ----------------------------------------------------------------------
const getMockTournaments = (): GolfTournament[] => [
  { id: '1', name: 'The Masters', location: 'Augusta', course: 'Augusta National', country: 'USA', start_date: '2026-04-09', end_date: '2026-04-12', purse_usd: 18000000, format: 'Stroke Play', tour: 'PGA', status: 'upcoming', defending_champion: 'Scottie Scheffler' },
  { id: '2', name: 'PGA Championship', location: 'Louisville', course: 'Valhalla', country: 'USA', start_date: '2026-05-16', end_date: '2026-05-19', purse_usd: 17500000, format: 'Stroke Play', tour: 'PGA', status: 'upcoming', defending_champion: 'Brooks Koepka' },
  { id: '3', name: 'U.S. Open', location: 'Pinehurst', course: 'Pinehurst No. 2', country: 'USA', start_date: '2026-06-13', end_date: '2026-06-16', purse_usd: 20000000, format: 'Stroke Play', tour: 'PGA', status: 'upcoming', defending_champion: 'Wyndham Clark' },
  { id: '4', name: 'The Open Championship', location: 'Troon', course: 'Royal Troon', country: 'Scotland', start_date: '2026-07-18', end_date: '2026-07-21', purse_usd: 16500000, format: 'Stroke Play', tour: 'PGA', status: 'upcoming', defending_champion: 'Brian Harman' },
  { id: '5', name: 'THE PLAYERS Championship', location: 'Ponte Vedra Beach', course: 'TPC Sawgrass', country: 'USA', start_date: '2026-03-12', end_date: '2026-03-15', purse_usd: 25000000, format: 'Stroke Play', tour: 'PGA', status: 'completed', winner: 'Scottie Scheffler', winner_score: '-20' },
];

// ----------------------------------------------------------------------
// API function with fallback
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const fetchGolfTournaments = async (season?: number, tour?: string): Promise<GolfTournament[]> => {
  try {
    const url = new URL('/api/golf/tournaments', API_BASE_URL || window.location.origin);
    if (season) url.searchParams.append('season', String(season));
    if (tour && tour !== 'all') url.searchParams.append('tour', tour);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('API error');
    const json = await response.json();
    if (json.success && json.data?.tournaments && json.data.is_real_data) {
      return json.data.tournaments.map((t: any) => ({
        id: t.id, name: t.name, location: t.location, course: t.course, country: t.country,
        start_date: t.start_date, end_date: t.end_date, purse_usd: t.purse_usd ?? 0,
        format: t.format ?? 'Stroke Play', tour: t.tour ?? 'PGA', status: t.status ?? 'upcoming',
        defending_champion: t.defending_champion, winner: t.winner, winner_score: t.winner_score,
      }));
    }
    return getMockTournaments();
  } catch (error) {
    console.error('Error fetching golf tournaments:', error);
    return getMockTournaments();
  }
};

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------
const TournamentStatusChip = ({ status }: { status?: string }) => {
  if (!status) return <Chip label="UNKNOWN" size="small" />;
  let color: 'success' | 'error' | 'warning' | 'default' | 'primary' = 'default';
  let label = status.toUpperCase();
  if (status === 'ongoing') { color = 'error'; label = 'LIVE'; }
  else if (status === 'completed') { color = 'default'; label = 'FINAL'; }
  else if (status === 'upcoming') { color = 'primary'; label = 'UPCOMING'; }
  return <Chip label={label} size="small" color={color} />;
};

const TourChip = ({ tour }: { tour?: string }) => {
  let color: 'primary' | 'secondary' | 'success' | 'warning' | 'default' = 'default';
  if (tour === 'PGA') color = 'primary';
  else if (tour === 'DP World') color = 'secondary';
  else if (tour === 'LIV') color = 'success';
  else if (tour === 'Champions') color = 'warning';
  return <Chip label={tour || 'N/A'} size="small" color={color} variant="outlined" />;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'TBD';
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date.toLocaleDateString() : dateStr;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const GolfTournamentsContent: React.FC = () => {
  const { profile } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<number>(0);
  const [tourFilter, setTourFilter] = useState<string>('all');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  const { data: tournaments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['golfTournaments', selectedYear, tourFilter],
    queryFn: () => fetchGolfTournaments(selectedYear, tourFilter),
    staleTime: 1000 * 60 * 10,
  });

  const handleYearChange = (event: SelectChangeEvent) => setSelectedYear(parseInt(event.target.value, 10));
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);
  const handleTourChange = (event: SelectChangeEvent) => setTourFilter(event.target.value);

  if (isLoading && tournaments.length === 0) return <SkeletonLoader />;
  if (error && tournaments.length === 0) return <ErrorView onRetry={refetch} />;

  const isRealData = tournaments.some(t => t.id && t.name && !t.name.includes('Mock'));
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <GolfIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">Golf Tournaments</Typography>
          <Chip icon={<CalendarIcon />} label={`Updated: ${lastUpdated}`} variant="outlined" />
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 100 }} size="small">
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select labelId="year-select-label" value={String(selectedYear)} label="Year" onChange={handleYearChange}>
              {yearOptions.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Refresh"><IconButton onClick={() => refetch()} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {profile && <PlanFeaturesDisplay currentPlan={profile.plan} compact />}

      {!isRealData && <Alert severity="info" sx={{ mb: 3 }}>Displaying simulated tournament data. Live data will appear when available.</Alert>}

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel id="tour-filter-label">Tour</InputLabel>
          <Select labelId="tour-filter-label" value={tourFilter} label="Tour" onChange={handleTourChange}>
            <MenuItem value="all">All Tours</MenuItem>
            <MenuItem value="PGA">PGA Tour</MenuItem>
            <MenuItem value="DP World">DP World Tour</MenuItem>
            <MenuItem value="LIV">LIV Golf</MenuItem>
            <MenuItem value="Champions">Champions Tour</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Tournaments" />
          <Tab label="Majors" />
          <Tab label="Upcoming" />
          <Tab label="Completed" />
        </Tabs>
      </Box>

      {/* All Tournaments */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>{tourFilter === 'all' ? 'All Tournaments' : `${tourFilter} Tournaments`} – {selectedYear}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tournament</TableCell><TableCell align="center">Location</TableCell><TableCell align="center">Course</TableCell>
                  <TableCell align="center">Dates</TableCell><TableCell align="center">Purse</TableCell><TableCell align="center">Tour</TableCell>
                  <TableCell align="center">Status</TableCell><TableCell align="center">Winner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tournaments.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell><Typography variant="body2" fontWeight="medium">{t.name}</Typography></TableCell>
                    <TableCell align="center"><Box display="flex" alignItems="center" gap={0.5}><LocationIcon fontSize="small" />{t.location ? `${t.location}, ${t.country}` : t.country}</Box></TableCell>
                    <TableCell align="center">{t.course || '—'}</TableCell>
                    <TableCell align="center">{formatDate(t.start_date)} – {formatDate(t.end_date)}</TableCell>
                    <TableCell align="center"><Box display="flex" alignItems="center" gap={0.5}><PurseIcon fontSize="small" />${((t.purse_usd || 0) / 1e6).toFixed(1)}M</Box></TableCell>
                    <TableCell align="center"><TourChip tour={t.tour} /></TableCell>
                    <TableCell align="center"><TournamentStatusChip status={t.status} /></TableCell>
                    <TableCell align="center">{t.winner ?? t.defending_champion ?? 'TBD'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Majors */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {tournaments.filter(t => ['Masters', 'PGA Championship', 'U.S. Open', 'The Open'].some(major => t.name.includes(major))).map(t => (
            <Grid item xs={12} md={6} key={t.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="h6">{t.name}</Typography><TrophyIcon color="primary" /></Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>{t.course}, {t.location}, {t.country}</Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">Dates</Typography><Typography variant="body2">{formatDate(t.start_date)} – {formatDate(t.end_date)}</Typography></Box>
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">Purse</Typography><Typography variant="body2" fontWeight="bold">${((t.purse_usd || 0) / 1e6).toFixed(1)}M</Typography></Box>
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">Defending Champion</Typography><Typography variant="body2">{t.defending_champion ?? 'N/A'}</Typography></Box>
                  {t.status === 'completed' && t.winner && <Box display="flex" justifyContent="space-between"><Typography variant="body2">Winner</Typography><Typography variant="body2" fontWeight="bold">{t.winner} {t.winner_score && `(${t.winner_score})`}</Typography></Box>}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upcoming */}
      {tabValue === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Tournament</TableCell><TableCell align="center">Tour</TableCell><TableCell align="center">Location</TableCell><TableCell align="center">Start Date</TableCell><TableCell align="center">Purse</TableCell></TableRow></TableHead>
            <TableBody>
              {tournaments.filter(t => t.status === 'upcoming').sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(t => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.name}</TableCell><TableCell align="center"><TourChip tour={t.tour} /></TableCell>
                  <TableCell align="center">{t.location || '—'}</TableCell><TableCell align="center">{formatDate(t.start_date)}</TableCell>
                  <TableCell align="center">${((t.purse_usd || 0) / 1e6).toFixed(1)}M</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Completed */}
      {tabValue === 3 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Tournament</TableCell><TableCell align="center">Dates</TableCell><TableCell align="center">Winner</TableCell><TableCell align="center">Score</TableCell><TableCell align="center">Purse</TableCell></TableRow></TableHead>
            <TableBody>
              {tournaments.filter(t => t.status === 'completed').sort((a,b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()).map(t => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.name}</TableCell><TableCell align="center">{formatDate(t.start_date)} – {formatDate(t.end_date)}</TableCell>
                  <TableCell align="center">{t.winner ?? t.defending_champion ?? 'N/A'}</TableCell>
                  <TableCell align="center">{t.winner_score ?? '-'}</TableCell>
                  <TableCell align="center">${((t.purse_usd || 0) / 1e6).toFixed(1)}M</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

const SkeletonLoader = () => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Typography variant="h4" gutterBottom>Golf Tournaments</Typography><Grid container spacing={3}><Grid item xs={12}><Skeleton variant="rounded" height={80} /></Grid><Grid item xs={12}><Skeleton variant="rounded" height={400} /></Grid></Grid></Container>
);

const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>Error loading golf tournaments.</Alert></Container>
);

const GolfTournaments: React.FC = () => (
  <ProtectedRoute screenName="GolfTournaments">
    <GolfTournamentsContent />
  </ProtectedRoute>
);

export default GolfTournaments;
