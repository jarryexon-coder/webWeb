// src/pages/TennisTournaments.tsx - Starter package required
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
  MonetizationOn as MoneyIcon,
  Public as WorldIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';

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

// ----------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------
const getMockTennisTournaments = (): TennisTournament[] => [
  { id: '1', name: 'Australian Open', location: 'Melbourne', country: 'Australia', surface: 'Hard', category: 'Grand Slam', start_date: '2026-01-12', end_date: '2026-01-26', prize_money_usd: 76500000, draw_size: 128, defending_champion: 'Jannik Sinner' },
  { id: '2', name: 'Roland Garros', location: 'Paris', country: 'France', surface: 'Clay', category: 'Grand Slam', start_date: '2026-05-25', end_date: '2026-06-08', prize_money_usd: 49600000, draw_size: 128, defending_champion: 'Carlos Alcaraz' },
  { id: '3', name: 'Wimbledon', location: 'London', country: 'United Kingdom', surface: 'Grass', category: 'Grand Slam', start_date: '2026-06-29', end_date: '2026-07-12', prize_money_usd: 62000000, draw_size: 128, defending_champion: 'Carlos Alcaraz' },
  { id: '4', name: 'US Open', location: 'New York', country: 'USA', surface: 'Hard', category: 'Grand Slam', start_date: '2026-08-25', end_date: '2026-09-08', prize_money_usd: 65000000, draw_size: 128, defending_champion: 'Novak Djokovic' },
  { id: '5', name: 'Indian Wells', location: 'Indian Wells', country: 'USA', surface: 'Hard', category: 'ATP Masters 1000', start_date: '2026-03-04', end_date: '2026-03-17', prize_money_usd: 17700000, draw_size: 96, defending_champion: 'Carlos Alcaraz' },
];

// ----------------------------------------------------------------------
// API function with fallback (using /api/atp/tournaments)
// ----------------------------------------------------------------------
const fetchTennisTournaments = async (year?: number, surface?: string): Promise<{ tournaments: TennisTournament[]; is_real_data: boolean }> => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_PYTHON || 'https://python-api-fresh-production.up.railway.app';
    const params = new URLSearchParams();
    if (year) params.append('season', year.toString());
    if (surface && surface !== 'all') params.append('surface', surface);
    params.append('per_page', '100');
    const url = `${baseUrl}/api/atp/tournaments?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const json = await response.json();
    if (json.success && json.data && Array.isArray(json.data.data)) {
      const raw = json.data.data;
      const transformed = raw.map((t: any) => ({
        id: String(t.id),
        name: t.name || 'Unknown',
        location: t.location || 'Unknown',
        country: t.location?.split(',')[1]?.trim() || 'Unknown',
        surface: t.surface || 'Hard',
        category: t.category || 'Other',
        start_date: t.start_date || '',
        end_date: t.end_date || '',
        prize_money_usd: t.prize_money ? parseFloat(String(t.prize_money).replace(/[^0-9.]/g, '')) : 0,
        draw_size: t.draw_size || 0,
        defending_champion: undefined,
      }));
      return { tournaments: transformed, is_real_data: true };
    }
    console.warn('Unexpected API response, using mock');
    return { tournaments: getMockTennisTournaments(), is_real_data: false };
  } catch (error) {
    console.error('Error fetching tennis tournaments:', error);
    return { tournaments: getMockTennisTournaments(), is_real_data: false };
  }
};

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------
const SurfaceIcon = ({ surface }: { surface?: string }) => {
  if (surface === 'Grass') return <GrassIcon fontSize="small" />;
  if (surface === 'Clay') return <ClayIcon fontSize="small" />;
  if (surface === 'Hard') return <HardIcon fontSize="small" />;
  return <TennisIcon fontSize="small" />;
};
const SurfaceChip = ({ surface }: { surface?: string }) => {
  if (!surface) return <Chip label="—" size="small" variant="outlined" />;
  let color: 'success' | 'warning' | 'primary' | 'default' = 'default';
  if (surface === 'Grass') color = 'success';
  else if (surface === 'Clay') color = 'warning';
  else if (surface === 'Hard') color = 'primary';
  return <Chip icon={<SurfaceIcon surface={surface} />} label={surface} size="small" color={color} variant="outlined" />;
};
const CategoryChip = ({ category }: { category?: string }) => {
  if (!category) return <Chip label="N/A" size="small" />;
  let color: 'primary' | 'secondary' | 'success' | 'default' = 'default';
  if (category.includes('Grand Slam')) color = 'primary';
  else if (category.includes('Masters')) color = 'secondary';
  else if (category.includes('500')) color = 'success';
  return <Chip label={category} size="small" color={color} />;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const TennisTournamentsContent: React.FC = () => {
  const { profile } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<number>(0);
  const [surfaceFilter, setSurfaceFilter] = useState<string>('all');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tennisTournaments', selectedYear, surfaceFilter],
    queryFn: () => fetchTennisTournaments(selectedYear, surfaceFilter !== 'all' ? surfaceFilter : undefined),
    staleTime: 1000 * 60 * 10,
  });

  const tournaments = data?.tournaments || [];
  const isRealData = data?.is_real_data ?? false;

  const filteredTournaments = useMemo(() => {
    if (surfaceFilter === 'all') return tournaments;
    return tournaments.filter(t => t.surface === surfaceFilter);
  }, [tournaments, surfaceFilter]);

  const handleYearChange = (event: SelectChangeEvent) => setSelectedYear(parseInt(event.target.value, 10));
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);
  const handleSurfaceChange = (event: SelectChangeEvent) => setSurfaceFilter(event.target.value);

  if (isLoading && !tournaments.length) return <SkeletonLoader />;
  if (error && !tournaments.length) return <ErrorView onRetry={refetch} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <TennisIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">Tennis Tournaments</Typography>
          <Chip icon={<CalendarIcon />} label={`Updated: ${new Date().toLocaleDateString()}`} variant="outlined" />
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 100 }} size="small">
            <InputLabel>Year</InputLabel>
            <Select value={String(selectedYear)} label="Year" onChange={handleYearChange}>
              {yearOptions.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Refresh"><IconButton onClick={() => refetch()} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {profile && <PlanFeaturesDisplay currentPlan={profile.plan} compact />}

      {!isRealData && <Alert severity="info" sx={{ mb: 3 }}>Displaying simulated tournament data. Live data will appear when available.</Alert>}

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Surface</InputLabel>
          <Select value={surfaceFilter} label="Surface" onChange={handleSurfaceChange}>
            <MenuItem value="all">All Surfaces</MenuItem>
            <MenuItem value="Hard">Hard</MenuItem>
            <MenuItem value="Clay">Clay</MenuItem>
            <MenuItem value="Grass">Grass</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Tournaments" />
          <Tab label="Grand Slams" />
          <Tab label="Masters / 1000" />
          <Tab label="500 / 250" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>{surfaceFilter === 'all' ? 'All Tournaments' : `${surfaceFilter} Court Tournaments`}</Typography>
          {filteredTournaments.length === 0 ? <Alert severity="info">No tournaments found.</Alert> : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow><TableCell>Tournament</TableCell><TableCell align="center">Location</TableCell><TableCell align="center">Surface</TableCell><TableCell align="center">Category</TableCell><TableCell align="center">Dates</TableCell><TableCell align="center">Prize Money</TableCell><TableCell align="center">Draw</TableCell></TableRow></TableHead>
                <TableBody>
                  {filteredTournaments.map(t => (
                    <TableRow key={t.id} hover>
                      <TableCell><Typography variant="body2" fontWeight="medium">{t.name}</Typography></TableCell>
                      <TableCell align="center"><Box display="flex" alignItems="center" gap={0.5}><LocationIcon fontSize="small" />{t.location}, {t.country}</Box></TableCell>
                      <TableCell align="center"><SurfaceChip surface={t.surface} /></TableCell>
                      <TableCell align="center"><CategoryChip category={t.category} /></TableCell>
                      <TableCell align="center">{t.start_date && t.end_date ? `${new Date(t.start_date).toLocaleDateString()} – ${new Date(t.end_date).toLocaleDateString()}` : 'TBD'}</TableCell>
                      <TableCell align="center">${(t.prize_money_usd / 1e6).toFixed(1)}M</TableCell>
                      <TableCell align="center">{t.draw_size || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>Grand Slam Tournaments</Typography>
          <Grid container spacing={3}>
            {filteredTournaments.filter(t => t.category?.includes('Grand Slam')).map(t => (
              <Grid item xs={12} md={6} key={t.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography variant="h6">{t.name}</Typography><TrophyIcon color="primary" /></Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{t.location}, {t.country}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Surface</Typography><SurfaceChip surface={t.surface} /></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Dates</Typography><Typography variant="body2">{t.start_date && t.end_date ? `${new Date(t.start_date).toLocaleDateString()} – ${new Date(t.end_date).toLocaleDateString()}` : 'TBD'}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Prize Money</Typography><Typography variant="body2" fontWeight="bold">${(t.prize_money_usd / 1e6).toFixed(1)}M</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Defending Champion</Typography><Typography variant="body2">{t.defending_champion || 'N/A'}</Typography></Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>ATP Masters 1000 Tournaments</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow><TableCell>Tournament</TableCell><TableCell align="center">Location</TableCell><TableCell align="center">Surface</TableCell><TableCell align="center">Dates</TableCell><TableCell align="center">Prize Money</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredTournaments.filter(t => t.category?.includes('Masters')).map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.name}</TableCell><TableCell align="center">{t.location}</TableCell>
                    <TableCell align="center"><SurfaceChip surface={t.surface} /></TableCell>
                    <TableCell align="center">{t.start_date && t.end_date ? `${new Date(t.start_date).toLocaleDateString()} – ${new Date(t.end_date).toLocaleDateString()}` : 'TBD'}</TableCell>
                    <TableCell align="center">${(t.prize_money_usd / 1e6).toFixed(1)}M</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tabValue === 3 && (
        <>
          <Typography variant="h6" gutterBottom>ATP 500 & 250 Tournaments</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow><TableCell>Tournament</TableCell><TableCell align="center">Location</TableCell><TableCell align="center">Category</TableCell><TableCell align="center">Surface</TableCell><TableCell align="center">Dates</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredTournaments.filter(t => t.category?.includes('500') || t.category?.includes('250')).map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.name}</TableCell><TableCell align="center">{t.location}</TableCell>
                    <TableCell align="center"><CategoryChip category={t.category} /></TableCell>
                    <TableCell align="center"><SurfaceChip surface={t.surface} /></TableCell>
                    <TableCell align="center">{t.start_date && t.end_date ? `${new Date(t.start_date).toLocaleDateString()} – ${new Date(t.end_date).toLocaleDateString()}` : 'TBD'}</TableCell>
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

const SkeletonLoader = () => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Typography variant="h4">Tennis Tournaments</Typography><Grid container spacing={3}><Grid item xs={12}><Skeleton variant="rounded" height={80} /></Grid><Grid item xs={12}><Skeleton variant="rounded" height={400} /></Grid></Grid></Container>
);
const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>Error loading tennis tournaments.</Alert></Container>
);

const TennisTournaments: React.FC = () => (
  <ProtectedRoute screenName="TennisTournaments">
    <TennisTournamentsContent />
  </ProtectedRoute>
);

export default TennisTournaments;
