// src/pages/TennisMatches.tsx - Starter package required
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
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface TennisMatch {
  id: string;
  tournament: string;
  round: string;
  player1: { name: string; seed?: number; rank?: number };
  player2: { name: string; seed?: number; rank?: number };
  score?: string;
  status: 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled';
  date: string;
  court?: string;
  surface: string;
  best_of: number;
  winner?: 1 | 2;
}

// ----------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------
const getMockTennisMatches = (): TennisMatch[] => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return [
    { id: '1', tournament: 'Australian Open', round: 'Final', player1: { name: 'Novak Djokovic', seed: 1, rank: 1 }, player2: { name: 'Jannik Sinner', seed: 4, rank: 4 }, status: 'scheduled', date: `${today}T14:30:00Z`, court: 'Rod Laver Arena', surface: 'Hard', best_of: 5 },
    { id: '2', tournament: 'Roland Garros', round: 'Quarterfinal', player1: { name: 'Carlos Alcaraz', seed: 3, rank: 3 }, player2: { name: 'Stefanos Tsitsipas', seed: 5, rank: 5 }, status: 'live', score: '6-4, 3-6, 2-1', date: today, court: 'Court Philippe Chatrier', surface: 'Clay', best_of: 5 },
    { id: '3', tournament: 'Wimbledon', round: 'Semifinal', player1: { name: 'Daniil Medvedev', seed: 2, rank: 2 }, player2: { name: 'Alexander Zverev', seed: 6, rank: 6 }, status: 'completed', score: '7-6, 6-4, 6-3', date: yesterday, court: 'Centre Court', surface: 'Grass', best_of: 5, winner: 1 },
    { id: '4', tournament: 'US Open', round: 'Round of 16', player1: { name: 'Coco Gauff', seed: 3, rank: 3 }, player2: { name: 'Iga Swiatek', seed: 1, rank: 1 }, status: 'scheduled', date: `${today}T18:00:00Z`, court: 'Arthur Ashe Stadium', surface: 'Hard', best_of: 3 },
    { id: '5', tournament: 'Indian Wells', round: 'Final', player1: { name: 'Carlos Alcaraz', seed: 1, rank: 2 }, player2: { name: 'Daniil Medvedev', seed: 2, rank: 3 }, status: 'completed', score: '7-6, 6-1', date: yesterday, court: 'Stadium 1', surface: 'Hard', best_of: 3, winner: 1 },
  ];
};

// ----------------------------------------------------------------------
// API function with fallback (unchanged, using /api/atp/matches)
// ----------------------------------------------------------------------
const fetchTennisMatches = async (date?: string, surface?: string): Promise<{ matches: TennisMatch[]; is_real_data: boolean }> => {
  try {
    const season = new Date().getFullYear();
    const baseUrl = import.meta.env.VITE_API_BASE_PYTHON || 'https://python-api-fresh-production.up.railway.app';
    const url = `${baseUrl}/api/atp/matches?season=${season}&per_page=100`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const json = await response.json();
    if (json.success && json.data && Array.isArray(json.data.data)) {
      const rawMatches = json.data.data;
      const transformed = rawMatches.map((match: any) => ({
        id: String(match.id),
        tournament: match.tournament?.name || 'Unknown Tournament',
        round: match.round || 'TBD',
        player1: { name: match.player1?.full_name || 'TBD' },
        player2: { name: match.player2?.full_name || 'TBD' },
        score: match.score || undefined,
        status: match.match_status === 'finished' ? 'completed' : (match.is_live ? 'live' : 'scheduled'),
        date: match.scheduled_time || new Date().toISOString(),
        court: match.not_before_text,
        surface: match.tournament?.surface || 'Hard',
        best_of: match.tournament?.category === 'Grand Slam' ? 5 : 3,
        winner: match.winner ? (match.winner.id === match.player1?.id ? 1 : 2) : undefined,
      }));
      let filtered = transformed;
      if (date) filtered = filtered.filter(m => m.date.split('T')[0] === date);
      if (surface && surface !== 'all') filtered = filtered.filter(m => m.surface.toLowerCase() === surface.toLowerCase());
      return { matches: filtered, is_real_data: true };
    }
    console.warn('Unexpected API response, using mock');
    return { matches: getMockTennisMatches(), is_real_data: false };
  } catch (error) {
    console.error('Error fetching ATP matches:', error);
    return { matches: getMockTennisMatches(), is_real_data: false };
  }
};

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------
const MatchStatusChip = ({ status }: { status?: string }) => {
  if (!status) return <Chip label="UNKNOWN" size="small" />;
  const map: Record<string, { label: string; color: any }> = {
    live: { label: 'LIVE', color: 'error' },
    completed: { label: 'FINAL', color: 'default' },
    scheduled: { label: 'SCHEDULED', color: 'primary' },
    postponed: { label: 'PPD', color: 'warning' },
    cancelled: { label: 'CANC', color: 'default' },
  };
  const { label, color } = map[status] || { label: status.toUpperCase(), color: 'default' };
  return <Chip label={label} size="small" color={color} />;
};

const SurfaceChip = ({ surface }: { surface?: string }) => {
  if (!surface) return <Chip label="N/A" size="small" variant="outlined" />;
  let color: 'success' | 'warning' | 'primary' | 'default' = 'default';
  if (surface === 'Grass') color = 'success';
  else if (surface === 'Clay') color = 'warning';
  else if (surface === 'Hard') color = 'primary';
  return <Chip label={surface} size="small" color={color} variant="outlined" />;
};

// ----------------------------------------------------------------------
// Main Content Component
// ----------------------------------------------------------------------
const TennisMatchesContent: React.FC = () => {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tabValue, setTabValue] = useState<number>(0);
  const [surfaceFilter, setSurfaceFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tennisMatches', selectedDate, surfaceFilter],
    queryFn: () => fetchTennisMatches(selectedDate, surfaceFilter !== 'all' ? surfaceFilter : undefined),
    staleTime: 1000 * 60 * 5,
  });

  const matches = data?.matches || [];
  const isRealData = data?.is_real_data ?? false;

  const filteredMatches = useMemo(() => {
    if (surfaceFilter === 'all') return matches;
    return matches.filter(m => m.surface === surfaceFilter);
  }, [matches, surfaceFilter]);

  const handleDateChange = (event: SelectChangeEvent) => setSelectedDate(event.target.value);
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);
  const handleSurfaceChange = (event: SelectChangeEvent) => setSurfaceFilter(event.target.value);

  if (isLoading && !matches.length) return <SkeletonLoader />;
  if (error && !matches.length) return <ErrorView onRetry={refetch} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <TennisIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">Tennis Matches</Typography>
          <Chip icon={<CalendarIcon />} label={`Updated: ${new Date().toLocaleDateString()}`} variant="outlined" />
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Date</InputLabel>
            <Select value={selectedDate} label="Date" onChange={handleDateChange}>
              <MenuItem value={new Date().toISOString().split('T')[0]}>Today</MenuItem>
              <MenuItem value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>Tomorrow</MenuItem>
              <MenuItem value={new Date(Date.now() - 86400000).toISOString().split('T')[0]}>Yesterday</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh"><IconButton onClick={() => refetch()} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {profile && <PlanFeaturesDisplay currentPlan={profile.plan} compact />}

      {!isRealData && <Alert severity="info" sx={{ mb: 3 }}>Displaying simulated match data. Live data will appear when available.</Alert>}

      {/* Surface filter */}
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Matches" />
          <Tab label="Live / Today" />
          <Tab label="Completed" />
          <Tab label="Scheduled" />
        </Tabs>
      </Box>

      {/* All Matches */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>Matches on {new Date(selectedDate).toLocaleDateString()}</Typography>
          {filteredMatches.length === 0 ? <Alert severity="info">No matches found.</Alert> : (
            <Grid container spacing={3}>
              {filteredMatches.map(match => (
                <Grid item xs={12} md={6} key={match.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <MatchStatusChip status={match.status} />
                        <SurfaceChip surface={match.surface} />
                      </Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {match.tournament} • {match.round}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" my={2}>
                        <Box textAlign="center" sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold">{match.player1.name}</Typography>
                        </Box>
                        <Box textAlign="center" sx={{ px: 2 }}>
                          {match.status === 'scheduled' ? <Typography variant="body1">vs</Typography> : <Typography variant="h5">{match.score || '?'}</Typography>}
                        </Box>
                        <Box textAlign="center" sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold">{match.player2.name}</Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">{match.court ? `Court ${match.court}` : 'TBD'} • Best of {match.best_of}</Typography>
                        <Typography variant="caption" color="text.secondary">{match.date ? new Date(match.date).toLocaleTimeString() : 'TBD'}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Live / Today */}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>Live & Today's Matches</Typography>
          {filteredMatches.filter(m => m.status === 'live' || m.status === 'scheduled').length === 0 ? <Alert severity="info">No live or scheduled matches.</Alert> : (
            <Grid container spacing={3}>
              {filteredMatches.filter(m => m.status === 'live' || m.status === 'scheduled').map(match => (
                <Grid item xs={12} md={6} key={match.id}>
                  <Card variant="outlined" sx={{ borderLeft: match.status === 'live' ? 4 : 0, borderColor: 'error.main' }}>
                    <CardContent>
                      <MatchStatusChip status={match.status} />
                      <Typography variant="subtitle2" color="text.secondary">{match.tournament} • {match.round}</Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="body1" fontWeight="bold">{match.player1.name}</Typography>
                        {match.status === 'live' && match.score && <Typography variant="body2">{match.score}</Typography>}
                        <Typography variant="body1" fontWeight="bold">{match.player2.name}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Completed */}
      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>Completed Matches</Typography>
          {filteredMatches.filter(m => m.status === 'completed').length === 0 ? <Alert severity="info">No completed matches.</Alert> : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow><TableCell>Tournament</TableCell><TableCell>Round</TableCell><TableCell>Player 1</TableCell><TableCell align="center">Score</TableCell><TableCell>Player 2</TableCell><TableCell align="center">Surface</TableCell></TableRow></TableHead>
                <TableBody>
                  {filteredMatches.filter(m => m.status === 'completed').map(match => (
                    <TableRow key={match.id} hover>
                      <TableCell>{match.tournament}</TableCell><TableCell>{match.round}</TableCell>
                      <TableCell>{match.player1.name}</TableCell><TableCell align="center">{match.score || 'N/A'}</TableCell>
                      <TableCell>{match.player2.name}</TableCell><TableCell align="center"><SurfaceChip surface={match.surface} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Scheduled */}
      {tabValue === 3 && (
        <>
          <Typography variant="h6" gutterBottom>Scheduled Matches</Typography>
          {filteredMatches.filter(m => m.status === 'scheduled').length === 0 ? <Alert severity="info">No scheduled matches.</Alert> : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow><TableCell>Tournament</TableCell><TableCell>Round</TableCell><TableCell>Player 1</TableCell><TableCell>Player 2</TableCell><TableCell align="center">Date/Time</TableCell><TableCell align="center">Surface</TableCell></TableRow></TableHead>
                <TableBody>
                  {filteredMatches.filter(m => m.status === 'scheduled').map(match => (
                    <TableRow key={match.id} hover>
                      <TableCell>{match.tournament}</TableCell><TableCell>{match.round}</TableCell>
                      <TableCell>{match.player1.name}</TableCell><TableCell>{match.player2.name}</TableCell>
                      <TableCell align="center">{match.date ? new Date(match.date).toLocaleString() : 'TBD'}</TableCell>
                      <TableCell align="center"><SurfaceChip surface={match.surface} /></TableCell>
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

const SkeletonLoader = () => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Typography variant="h4">Tennis Matches</Typography><Grid container spacing={3}><Grid item xs={12}><Skeleton variant="rounded" height={80} /></Grid><Grid item xs={12}><Skeleton variant="rounded" height={400} /></Grid></Grid></Container>
);
const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>Error loading tennis matches.</Alert></Container>
);

const TennisMatches: React.FC = () => (
  <ProtectedRoute screenName="TennisMatches">
    <TennisMatchesContent />
  </ProtectedRoute>
);

export default TennisMatches;
