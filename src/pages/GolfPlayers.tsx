// src/pages/GolfPlayers.tsx - Analytics plan required
import React, { useMemo, useState, useEffect } from 'react';
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
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SportsGolf as GolfIcon,
  CalendarMonth as CalendarIcon,
  Public as CountryIcon,
  EmojiEvents as EmojiEventsIcon,
  MonetizationOn as EarningsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';
import golfApi from '../services/golf';
import ProtectedRoute from '../components/ProtectedRoute';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface GolfPlayer {
  id: string | number;
  name: string;
  country: string;
  country_code: string;
  world_ranking?: number | null;
  points_avg?: number | null;
  events_played?: number | null;
  wins?: number | null;
  top10s?: number | null;
  earnings_usd?: number | null;
  age?: number | null;
  turned_pro?: number | null;
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------
const CountryChip = ({ code, name }: { code?: string; name?: string }) => (
  <Chip icon={<CountryIcon />} label={`${code} – ${name || code}`} size="small" variant="outlined" sx={{ height: 24 }} />
);

const RankingBar = ({ rank }: { rank?: number | null }) => {
  if (rank == null) return <Typography variant="body2">—</Typography>;
  let color: 'success' | 'warning' | 'error' = 'success';
  if (rank > 50) color = 'error';
  else if (rank > 20) color = 'warning';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color="text.secondary">#{rank}</Typography>
      <LinearProgress variant="determinate" value={Math.max(0, 100 - rank)} sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} color={color} />
    </Box>
  );
};

// ----------------------------------------------------------------------
// Mock data fallback
// ----------------------------------------------------------------------
const getMockGolfPlayers = (): GolfPlayer[] => [
  { id: '1', name: 'Scottie Scheffler', country: 'USA', country_code: 'USA', world_ranking: 1, points_avg: 12.45, events_played: 18, wins: 6, top10s: 14, earnings_usd: 21000000, age: 27, turned_pro: 2018 },
  { id: '2', name: 'Rory McIlroy', country: 'Northern Ireland', country_code: 'NIR', world_ranking: 2, points_avg: 9.82, events_played: 20, wins: 4, top10s: 12, earnings_usd: 18500000, age: 34, turned_pro: 2007 },
  { id: '3', name: 'Jon Rahm', country: 'Spain', country_code: 'ESP', world_ranking: 3, points_avg: 8.91, events_played: 19, wins: 4, top10s: 11, earnings_usd: 16800000, age: 29, turned_pro: 2016 },
  { id: '4', name: 'Viktor Hovland', country: 'Norway', country_code: 'NOR', world_ranking: 4, points_avg: 7.34, events_played: 22, wins: 3, top10s: 10, earnings_usd: 14200000, age: 26, turned_pro: 2019 },
  { id: '5', name: 'Patrick Cantlay', country: 'USA', country_code: 'USA', world_ranking: 5, points_avg: 6.78, events_played: 21, wins: 2, top10s: 9, earnings_usd: 13100000, age: 32, turned_pro: 2012 },
];

// ----------------------------------------------------------------------
// API function with fallback
// ----------------------------------------------------------------------
const fetchGolfPlayers = async (): Promise<GolfPlayer[]> => {
  try {
    const response = await golfApi.getPlayers();
    if (Array.isArray(response) && response.length > 0) return response;
    if (response?.data?.players && Array.isArray(response.data.players)) return response.data.players;
    return getMockGolfPlayers();
  } catch (error) {
    console.error('Error fetching golf players:', error);
    return getMockGolfPlayers();
  }
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const GolfPlayersContent: React.FC = () => {
  const { profile } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<number>(0);
  const [countryFilter, setCountryFilter] = useState<string>('all');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  const { data: players = [], isLoading, error, refetch } = useQuery({
    queryKey: ['golfPlayers', selectedYear],
    queryFn: fetchGolfPlayers,
    staleTime: 1000 * 60 * 10,
  });

  const filteredPlayers = useMemo(() => {
    if (countryFilter === 'all') return players;
    return players.filter(p => p.country_code === countryFilter);
  }, [players, countryFilter]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set(players.map(p => p.country_code).filter(Boolean));
    return Array.from(countries).map(code => ({ code, name: players.find(p => p.country_code === code)?.country || code }));
  }, [players]);

  const advancedStats = useMemo(() => ({
    averageRank: players.length ? (players.reduce((sum, p) => sum + (p.world_ranking || 100), 0) / players.length).toFixed(1) : 'N/A',
    topPlayers: players.filter(p => (p.world_ranking || 100) <= 10).length,
    totalEarnings: players.reduce((sum, p) => sum + (p.earnings_usd || 0), 0),
    averageWins: players.length ? (players.reduce((sum, p) => sum + (p.wins || 0), 0) / players.length).toFixed(1) : 'N/A',
  }), [players]);

  const handleYearChange = (event: SelectChangeEvent) => setSelectedYear(parseInt(event.target.value, 10));
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);
  const handleCountryChange = (event: SelectChangeEvent) => setCountryFilter(event.target.value);

  if (isLoading) return <SkeletonLoader />;
  if (error && players.length === 0) return <ErrorView onRetry={refetch} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <GolfIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">Golf Players</Typography>
          <Chip icon={<CalendarIcon />} label={`Updated: ${new Date().toLocaleDateString()}`} variant="outlined" />
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

      {/* Premium Stats Dashboard */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Box display="flex" alignItems="center" gap={1} mb={1}><EmojiEventsIcon color="primary" /><Typography variant="body2" color="text.secondary">Avg World Ranking</Typography></Box><Typography variant="h4">#{advancedStats.averageRank}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Box display="flex" alignItems="center" gap={1} mb={1}><EmojiEventsIcon color="warning" /><Typography variant="body2" color="text.secondary">Top 10 Players</Typography></Box><Typography variant="h4">{advancedStats.topPlayers}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Box display="flex" alignItems="center" gap={1} mb={1}><EarningsIcon color="success" /><Typography variant="body2" color="text.secondary">Total Earnings</Typography></Box><Typography variant="h4">${(advancedStats.totalEarnings / 1e6).toFixed(1)}M</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Box display="flex" alignItems="center" gap={1} mb={1}><TrendingUpIcon color="info" /><Typography variant="body2" color="text.secondary">Avg Wins</Typography></Box><Typography variant="h4">{advancedStats.averageWins}</Typography></CardContent></Card>
        </Grid>
      </Grid>

      {/* Country filter */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="country-filter-label">Country</InputLabel>
          <Select labelId="country-filter-label" value={countryFilter} label="Country" onChange={handleCountryChange}>
            <MenuItem value="all">All Countries</MenuItem>
            {uniqueCountries.map(c => <MenuItem key={c.code} value={c.code}>{c.name} ({c.code})</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Players" />
          <Tab label="Top 10" />
          <Tab label="Winners" />
          <Tab label="Earnings Leaders" />
          <Tab label="Advanced Analytics" />
          <Tab label="Betting Insights" />
        </Tabs>
      </Box>

      {/* All Players */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>{countryFilter === 'all' ? 'All Golf Players' : `Players from ${countryFilter}`}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow><TableCell>Rank</TableCell><TableCell>Player</TableCell><TableCell align="center">Country</TableCell><TableCell align="center">Points Avg</TableCell><TableCell align="center">Events</TableCell><TableCell align="center">Wins</TableCell><TableCell align="center">Top 10s</TableCell><TableCell align="center">Earnings</TableCell><TableCell align="center">Age</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredPlayers.map(player => (
                  <TableRow key={player.id} hover>
                    <TableCell><RankingBar rank={player.world_ranking} /></TableCell>
                    <TableCell><Typography variant="body2" fontWeight="medium">{player.name}</Typography></TableCell>
                    <TableCell align="center"><CountryChip code={player.country_code} name={player.country} /></TableCell>
                    <TableCell align="center">{player.points_avg?.toFixed(2) ?? '—'}</TableCell>
                    <TableCell align="center">{player.events_played ?? '—'}</TableCell>
                    <TableCell align="center">{player.wins ? <Chip label={player.wins} size="small" color={player.wins > 0 ? 'success' : 'default'} /> : '—'}</TableCell>
                    <TableCell align="center">{player.top10s ?? '—'}</TableCell>
                    <TableCell align="center">{player.earnings_usd ? `$${(player.earnings_usd / 1e6).toFixed(1)}M` : '—'}</TableCell>
                    <TableCell align="center">{player.age ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Top 10 */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {filteredPlayers.filter(p => (p.world_ranking ?? 100) <= 10).map(player => (
            <Grid item xs={12} md={6} lg={4} key={player.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>#{player.world_ranking ?? '?'}</Avatar>
                    <Box><Typography variant="h6">{player.name}</Typography><Typography variant="body2" color="text.secondary">{player.country}</Typography></Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">Points Avg</Typography><Typography variant="body2" fontWeight="bold">{player.points_avg?.toFixed(2) ?? '—'}</Typography></Box>
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">Wins</Typography><Typography variant="body2" fontWeight="bold">{player.wins ?? '—'}</Typography></Box>
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">Earnings</Typography><Typography variant="body2" fontWeight="bold">{player.earnings_usd ? `$${(player.earnings_usd / 1e6).toFixed(1)}M` : '—'}</Typography></Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Winners */}
      {tabValue === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Rank</TableCell><TableCell>Player</TableCell><TableCell align="center">Country</TableCell><TableCell align="center">Wins</TableCell><TableCell align="center">Top 10s</TableCell><TableCell align="center">Events</TableCell><TableCell align="center">Win %</TableCell></TableRow></TableHead>
            <TableBody>
              {filteredPlayers.filter(p => (p.wins ?? 0) > 0).sort((a,b) => (b.wins ?? 0) - (a.wins ?? 0)).map(player => (
                <TableRow key={player.id} hover>
                  <TableCell>#{player.world_ranking ?? '—'}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell align="center"><CountryChip code={player.country_code} name={player.country} /></TableCell>
                  <TableCell align="center">{player.wins ?? '—'}</TableCell>
                  <TableCell align="center">{player.top10s ?? '—'}</TableCell>
                  <TableCell align="center">{player.events_played ?? '—'}</TableCell>
                  <TableCell align="center">{player.wins && player.events_played && player.events_played > 0 ? ((player.wins / player.events_played) * 100).toFixed(1) : '—'}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Earnings Leaders */}
      {tabValue === 3 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Rank</TableCell><TableCell>Player</TableCell><TableCell align="center">Country</TableCell><TableCell align="center">Earnings</TableCell><TableCell align="center">Wins</TableCell><TableCell align="center">Events</TableCell></TableRow></TableHead>
            <TableBody>
              {filteredPlayers.sort((a,b) => (b.earnings_usd ?? 0) - (a.earnings_usd ?? 0)).map(player => (
                <TableRow key={player.id} hover>
                  <TableCell>#{player.world_ranking ?? '—'}</TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell align="center"><CountryChip code={player.country_code} name={player.country} /></TableCell>
                  <TableCell align="center">{player.earnings_usd ? `$${(player.earnings_usd / 1e6).toFixed(1)}M` : '—'}</TableCell>
                  <TableCell align="center">{player.wins ?? '—'}</TableCell>
                  <TableCell align="center">{player.events_played ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Advanced Analytics (placeholder) */}
      {tabValue === 4 && (
        <Card><CardContent><Typography variant="h6" gutterBottom>Performance Trends</Typography><Typography variant="body2" color="text.secondary" paragraph>Historical performance analysis and predictive insights will appear here.</Typography><Alert severity="info">Advanced analytics coming soon! Track player performance trends, head-to-head comparisons, and analytics recommendations.</Alert></CardContent></Card>
      )}

      {/* Betting Insights (placeholder) */}
      {tabValue === 5 && (
        <Card><CardContent><Typography variant="h6" gutterBottom>Analytics Insights & Advantage Analysis</Typography><Typography variant="body2" color="text.secondary" paragraph>Get AI-powered analytics recommendations and advantage analysis for upcoming tournaments.</Typography><Alert severity="info">Betting insights coming soon! Access real-time multipliers, top projections, and expert analysis.</Alert></CardContent></Card>
      )}
    </Container>
  );
};

const SkeletonLoader = () => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Typography variant="h4" gutterBottom>Golf Players</Typography><Grid container spacing={3}><Grid item xs={12}><Skeleton variant="rounded" height={80} /></Grid><Grid item xs={12}><Skeleton variant="rounded" height={400} /></Grid></Grid></Container>
);

const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>Error loading golf players.</Alert></Container>
);

const GolfPlayers: React.FC = () => (
  <ProtectedRoute screenName="GolfPlayers">
    <GolfPlayersContent />
  </ProtectedRoute>
);

export default GolfPlayers;
