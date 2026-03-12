// src/pages/GolfPlayers.tsx
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
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SportsGolf as GolfIcon,
  CalendarMonth as CalendarIcon,
  Public as CountryIcon,
  EmojiEvents as RankIcon,
  MonetizationOn as EarningsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import golfApi from '../services/golf';

// ----------------------------------------------------------------------
// Types – make many fields optional to accommodate real API data
// ----------------------------------------------------------------------

interface GolfPlayer {
  id: string | number;
  name: string;
  country: string;
  country_code: string;
  world_ranking?: number | null;      // OWGR from API
  points_avg?: number | null;          // Not in API
  events_played?: number | null;       // Not in API
  wins?: number | null;                // Not in API
  top10s?: number | null;              // Not in API
  earnings_usd?: number | null;        // Not in API
  age?: number | null;                 // Can be computed from birth_date
  turned_pro?: number | null;          // Available in API
}

interface GolfApiResponse {
  success?: boolean;
  data?: {
    players: GolfPlayer[];
    last_updated: string;
    is_real_data: boolean;
  };
  message?: string;
  // direct array fallback
  [key: string]: any;
}

// ----------------------------------------------------------------------
// Helper Components (unchanged)
// ----------------------------------------------------------------------

const CountryChip = ({ code, name }: { code?: string; name?: string }) => {
  if (!code || !name) return <Chip label="—" size="small" variant="outlined" />;
  return (
    <Chip
      icon={<CountryIcon />}
      label={`${code} – ${name}`}
      size="small"
      variant="outlined"
      sx={{ height: 24 }}
    />
  );
};

const RankingBar = ({ rank }: { rank?: number | null }) => {
  if (rank == null) return <Typography variant="body2">—</Typography>;
  let color: 'success' | 'warning' | 'error' = 'success';
  if (rank > 50) color = 'error';
  else if (rank > 20) color = 'warning';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color="text.secondary">
        #{rank}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, 100 - rank)}
        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
        color={color}
      />
    </Box>
  );
};

// ----------------------------------------------------------------------
// Mock data fallback (full stats)
// ----------------------------------------------------------------------
const getMockGolfPlayers = (): GolfPlayer[] => [
  {
    id: '1',
    name: 'Scottie Scheffler',
    country: 'USA',
    country_code: 'USA',
    world_ranking: 1,
    points_avg: 12.45,
    events_played: 18,
    wins: 6,
    top10s: 14,
    earnings_usd: 21000000,
    age: 27,
    turned_pro: 2018,
  },
  {
    id: '2',
    name: 'Rory McIlroy',
    country: 'Northern Ireland',
    country_code: 'NIR',
    world_ranking: 2,
    points_avg: 9.82,
    events_played: 20,
    wins: 4,
    top10s: 12,
    earnings_usd: 18500000,
    age: 34,
    turned_pro: 2007,
  },
  {
    id: '3',
    name: 'Jon Rahm',
    country: 'Spain',
    country_code: 'ESP',
    world_ranking: 3,
    points_avg: 8.91,
    events_played: 19,
    wins: 4,
    top10s: 11,
    earnings_usd: 16800000,
    age: 29,
    turned_pro: 2016,
  },
  {
    id: '4',
    name: 'Viktor Hovland',
    country: 'Norway',
    country_code: 'NOR',
    world_ranking: 4,
    points_avg: 7.34,
    events_played: 22,
    wins: 3,
    top10s: 10,
    earnings_usd: 14200000,
    age: 26,
    turned_pro: 2019,
  },
  {
    id: '5',
    name: 'Patrick Cantlay',
    country: 'USA',
    country_code: 'USA',
    world_ranking: 5,
    points_avg: 6.78,
    events_played: 21,
    wins: 2,
    top10s: 9,
    earnings_usd: 13100000,
    age: 32,
    turned_pro: 2012,
  },
];

const getMockApiResponse = (): GolfApiResponse => ({
  success: true,
  data: {
    players: getMockGolfPlayers(),
    last_updated: new Date().toISOString(),
    is_real_data: false,
  },
});

// ----------------------------------------------------------------------
// Validation – only require that fields exist (allow null)
// ----------------------------------------------------------------------
const requiredFields: (keyof GolfPlayer)[] = [
  'id',
  'name',
  'country',
  'country_code',
  'world_ranking', // may be null – that's okay
];

function isPlayerMinimallyComplete(player: any): player is GolfPlayer {
  return requiredFields.every(field => player[field] !== undefined);
}

// ----------------------------------------------------------------------
// API function with fallback and mapping
// ----------------------------------------------------------------------
const fetchGolfPlayers = async (): Promise<GolfApiResponse> => {
  try {
    const response = await golfApi.getPlayers();

    // CASE: API returns an array directly
    if (Array.isArray(response)) {
      if (response.every(isPlayerMinimallyComplete)) {
        return {
          success: true,
          data: {
            players: response,
            last_updated: new Date().toISOString(),
            is_real_data: true,
          },
        };
      } else {
        console.warn('API returned incomplete player array – using mock');
        return getMockApiResponse();
      }
    }

    // CASE: Standard response with data.players
    if (response?.data && Array.isArray(response.data.players)) {
      const players = response.data.players;
      const isReal = response.data.is_real_data ?? false;

      if (isReal) {
        // Real data may be missing stats – that's fine, we'll display placeholders
        return {
          success: true,
          data: {
            players: players.map(p => ({
              ...p,
              // Ensure missing numeric stats are null to avoid 0 confusion
              points_avg: p.points_avg ?? null,
              events_played: p.events_played ?? null,
              wins: p.wins ?? null,
              top10s: p.top10s ?? null,
              earnings_usd: p.earnings_usd ?? null,
              age: p.age ?? null,
              turned_pro: p.turned_pro ?? null,
            })),
            last_updated: response.data.last_updated || new Date().toISOString(),
            is_real_data: true,
          },
        };
      } else {
        // Mock data from backend should be complete, but validate minimally
        if (players.every(isPlayerMinimallyComplete)) {
          return {
            success: true,
            data: {
              players,
              last_updated: response.data.last_updated || new Date().toISOString(),
              is_real_data: false,
            },
          };
        } else {
          console.warn('Backend mock data incomplete – using local mock');
          return getMockApiResponse();
        }
      }
    }

    // Unexpected format – use local mock
    console.warn('Unexpected API response format – using mock data');
    return getMockApiResponse();
  } catch (error) {
    console.error('Error fetching golf players:', error);
    return getMockApiResponse();
  }
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const GolfPlayers: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [tabValue, setTabValue] = useState<number>(0);
  const [countryFilter, setCountryFilter] = useState<string>('all');

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
    queryKey: ['golfPlayers', selectedYear],
    queryFn: fetchGolfPlayers,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Safely extract players array
  const players = useMemo(() => {
    if (!apiResponse) return [];
    if (Array.isArray(apiResponse)) return apiResponse;
    if (apiResponse.data && Array.isArray(apiResponse.data.players)) {
      return apiResponse.data.players;
    }
    if (Array.isArray(apiResponse.players)) return apiResponse.players;
    return [];
  }, [apiResponse]);

  const lastUpdated = apiResponse?.data?.last_updated || new Date().toISOString();
  const isRealData = apiResponse?.data?.is_real_data ?? false;

  const filteredPlayers = useMemo(() => {
    if (!Array.isArray(players) || players.length === 0) return [];
    if (countryFilter === 'all') return players;
    return players.filter((p) => p.country_code === countryFilter);
  }, [players, countryFilter]);

  const uniqueCountries = useMemo(() => {
    if (!Array.isArray(players) || players.length === 0) return [];
    const countries = new Set(players.map((p) => p.country_code).filter(Boolean));
    return Array.from(countries).map((code) => ({
      code,
      name: players.find((p) => p.country_code === code)?.country || code,
    }));
  }, [players]);

  const handleYearChange = (event: SelectChangeEvent) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCountryChange = (event: SelectChangeEvent) => {
    setCountryFilter(event.target.value);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>
          Golf Players
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

  if ((error || apiResponse?.success === false) && players.length === 0) {
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
          Error loading golf players: {(error as Error)?.message || apiResponse?.message || 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <GolfIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            Golf Players
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
          Displaying simulated player data. Live data will appear when available.
        </Alert>
      )}

      {/* Country filter */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="country-filter-label">Country</InputLabel>
          <Select
            labelId="country-filter-label"
            value={countryFilter}
            label="Country"
            onChange={handleCountryChange}
          >
            <MenuItem value="all">All Countries</MenuItem>
            {uniqueCountries.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                {c.name} ({c.code})
              </MenuItem>
            ))}
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
        </Tabs>
      </Box>

      {/* Tab: All Players (Table) */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            {countryFilter === 'all' ? 'All Golf Players' : `Players from ${countryFilter}`}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">Country</TableCell>
                  <TableCell align="center">Points Avg</TableCell>
                  <TableCell align="center">Events</TableCell>
                  <TableCell align="center">Wins</TableCell>
                  <TableCell align="center">Top 10s</TableCell>
                  <TableCell align="center">Earnings</TableCell>
                  <TableCell align="center">Age</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell>
                      <RankingBar rank={player.world_ranking} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {player.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <CountryChip code={player.country_code} name={player.country} />
                    </TableCell>
                    <TableCell align="center">
                      {player.points_avg != null ? player.points_avg.toFixed(2) : '—'}
                    </TableCell>
                    <TableCell align="center">
                      {player.events_played ?? '—'}
                    </TableCell>
                    <TableCell align="center">
                      {player.wins != null ? (
                        <Chip
                          label={player.wins}
                          size="small"
                          color={player.wins > 0 ? 'success' : 'default'}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell align="center">
                      {player.top10s ?? '—'}
                    </TableCell>
                    <TableCell align="center">
                      {player.earnings_usd != null ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <EarningsIcon fontSize="small" />
                          ${(player.earnings_usd / 1e6).toFixed(1)}M
                        </Box>
                      ) : '—'}
                    </TableCell>
                    <TableCell align="center">
                      {player.age ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Tab: Top 10 */}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>
            Top 10 Golfers
          </Typography>
          <Grid container spacing={3}>
            {filteredPlayers
              .filter((p) => (p.world_ranking ?? 100) <= 10)
              .map((player) => (
                <Grid item xs={12} md={6} lg={4} key={player.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                          #{player.world_ranking ?? '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{player.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {player.country ?? '—'}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Points Avg</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {player.points_avg != null ? player.points_avg.toFixed(2) : '—'}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Wins</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {player.wins ?? '—'}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Earnings</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {player.earnings_usd != null
                            ? `$${(player.earnings_usd / 1e6).toFixed(1)}M`
                            : '—'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </>
      )}

      {/* Tab: Winners */}
      {tabValue === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="center">Country</TableCell>
                <TableCell align="center">Wins</TableCell>
                <TableCell align="center">Top 10s</TableCell>
                <TableCell align="center">Events</TableCell>
                <TableCell align="center">Win %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlayers
                .filter((p) => (p.wins ?? 0) > 0)
                .sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0))
                .map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell>#{player.world_ranking ?? '—'}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell align="center">
                      <CountryChip code={player.country_code} name={player.country} />
                    </TableCell>
                    <TableCell align="center">{player.wins ?? '—'}</TableCell>
                    <TableCell align="center">{player.top10s ?? '—'}</TableCell>
                    <TableCell align="center">{player.events_played ?? '—'}</TableCell>
                    <TableCell align="center">
                      {player.wins && player.events_played && player.events_played > 0
                        ? ((player.wins / player.events_played) * 100).toFixed(1)
                        : '—'}%
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab: Earnings Leaders */}
      {tabValue === 3 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="center">Country</TableCell>
                <TableCell align="center">Earnings</TableCell>
                <TableCell align="center">Wins</TableCell>
                <TableCell align="center">Events</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlayers
                .sort((a, b) => (b.earnings_usd ?? 0) - (a.earnings_usd ?? 0))
                .map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell>#{player.world_ranking ?? '—'}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell align="center">
                      <CountryChip code={player.country_code} name={player.country} />
                    </TableCell>
                    <TableCell align="center">
                      {player.earnings_usd != null ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <EarningsIcon fontSize="small" />
                          ${(player.earnings_usd / 1e6).toFixed(1)}M
                        </Box>
                      ) : '—'}
                    </TableCell>
                    <TableCell align="center">{player.wins ?? '—'}</TableCell>
                    <TableCell align="center">{player.events_played ?? '—'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default GolfPlayers;
