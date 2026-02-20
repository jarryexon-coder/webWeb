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
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  SportsTennis as TennisIcon,
  CalendarMonth as CalendarIcon,
  Public as CountryIcon,
  EmojiEvents as RankIcon,
  Star as ProspectIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import tennisApi from '../services/tennis';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface TennisPlayer {
  id: string;
  name: string;
  country: string;
  country_code: string;
  atp_rank?: number;
  wta_rank?: number;
  points: number;
  age: number;
  turned_pro: number;
  height_cm?: number;
  hand: 'left' | 'right' | 'ambidextrous';
  tour: 'ATP' | 'WTA';
  is_prospect?: boolean;
}

interface TennisPlayersData {
  players: TennisPlayer[];
  last_updated: string;
  is_real_data: boolean;
}

interface TennisApiResponse {
  success: boolean;
  data: TennisPlayersData;
  message?: string;
}

// ----------------------------------------------------------------------
// Mock data
// ----------------------------------------------------------------------
const getMockTennisPlayers = (): TennisPlayer[] => [
  // ATP
  {
    id: 'atp1',
    name: 'Novak Djokovic',
    country: 'Serbia',
    country_code: 'SRB',
    atp_rank: 1,
    points: 11245,
    age: 36,
    turned_pro: 2003,
    height_cm: 188,
    hand: 'right',
    tour: 'ATP',
    is_prospect: false,
  },
  {
    id: 'atp2',
    name: 'Carlos Alcaraz',
    country: 'Spain',
    country_code: 'ESP',
    atp_rank: 2,
    points: 8875,
    age: 20,
    turned_pro: 2018,
    height_cm: 183,
    hand: 'right',
    tour: 'ATP',
    is_prospect: true,
  },
  {
    id: 'atp3',
    name: 'Jannik Sinner',
    country: 'Italy',
    country_code: 'ITA',
    atp_rank: 4,
    points: 8270,
    age: 22,
    turned_pro: 2018,
    height_cm: 185,
    hand: 'right',
    tour: 'ATP',
    is_prospect: true,
  },
  {
    id: 'atp4',
    name: 'Daniil Medvedev',
    country: 'Russia',
    country_code: 'RUS',
    atp_rank: 3,
    points: 8765,
    age: 28,
    turned_pro: 2014,
    height_cm: 198,
    hand: 'right',
    tour: 'ATP',
    is_prospect: false,
  },
  // WTA
  {
    id: 'wta1',
    name: 'Iga Swiatek',
    country: 'Poland',
    country_code: 'POL',
    wta_rank: 1,
    points: 10755,
    age: 22,
    turned_pro: 2016,
    height_cm: 176,
    hand: 'right',
    tour: 'WTA',
    is_prospect: false,
  },
  {
    id: 'wta2',
    name: 'Aryna Sabalenka',
    country: 'Belarus',
    country_code: 'BLR',
    wta_rank: 2,
    points: 8945,
    age: 25,
    turned_pro: 2015,
    height_cm: 182,
    hand: 'right',
    tour: 'WTA',
    is_prospect: false,
  },
  {
    id: 'wta3',
    name: 'Coco Gauff',
    country: 'USA',
    country_code: 'USA',
    wta_rank: 3,
    points: 7455,
    age: 19,
    turned_pro: 2018,
    height_cm: 175,
    hand: 'right',
    tour: 'WTA',
    is_prospect: true,
  },
  {
    id: 'wta4',
    name: 'Elena Rybakina',
    country: 'Kazakhstan',
    country_code: 'KAZ',
    wta_rank: 4,
    points: 6880,
    age: 24,
    turned_pro: 2016,
    height_cm: 184,
    hand: 'right',
    tour: 'WTA',
    is_prospect: false,
  },
];

const getMockTennisData = (): TennisPlayersData => ({
  players: getMockTennisPlayers(),
  last_updated: new Date().toISOString(),
  is_real_data: false,
});

// ----------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------
const requiredFields: (keyof TennisPlayer)[] = [
  'name',
  'country',
  'country_code',
  'points',
  'age',
  'turned_pro',
  'hand',
  'tour',
];

function isPlayerComplete(player: any): player is TennisPlayer {
  return requiredFields.every(field => player[field] != null);
}

function arePlayersComplete(players: any[]): players is TennisPlayer[] {
  return players.length > 0 && players.every(isPlayerComplete);
}

// ----------------------------------------------------------------------
// API function with fallback
// ----------------------------------------------------------------------
const fetchTennisPlayers = async (tour?: string): Promise<TennisApiResponse> => {
  try {
    const response = await tennisApi.getPlayers(tour as 'ATP' | 'WTA' | undefined);

    // Handle different response shapes
    if (Array.isArray(response)) {
      // Response is array of players
      if (arePlayersComplete(response)) {
        return {
          success: true,
          data: {
            players: response,
            last_updated: new Date().toISOString(),
            is_real_data: true,
          },
        };
      }
    } else if (response?.data && Array.isArray(response.data.players)) {
      // Response has data.players
      if (arePlayersComplete(response.data.players)) {
        return response as TennisApiResponse;
      }
    } else if (response?.players && Array.isArray(response.players)) {
      // Response has players directly
      if (arePlayersComplete(response.players)) {
        return {
          success: true,
          data: {
            players: response.players,
            last_updated: response.last_updated || new Date().toISOString(),
            is_real_data: response.is_real_data ?? true,
          },
        };
      }
    }

    // If we reach here, data is incomplete or unexpected
    console.warn('Tennis API returned incomplete/unexpected data, using mock');
    return {
      success: true,
      data: getMockTennisData(),
    };
  } catch (error) {
    console.error('Error fetching tennis players:', error);
    return {
      success: true,
      data: getMockTennisData(),
    };
  }
};

// ----------------------------------------------------------------------
// Helper Components (defensive)
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

const RankChip = ({ rank, tour }: { rank?: number; tour?: string }) => {
  if (!rank) return <Chip label="NR" size="small" variant="outlined" />;
  const color = rank <= 10 ? 'success' : rank <= 50 ? 'primary' : 'default';
  return (
    <Chip
      icon={<RankIcon />}
      label={`#${rank} (${tour ?? '?'})`}
      size="small"
      color={color}
    />
  );
};

const ProspectChip = () => (
  <Chip
    icon={<ProspectIcon />}
    label="Prospect"
    size="small"
    color="secondary"
    sx={{ height: 20, fontSize: '0.7rem' }}
  />
);

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const TennisPlayers: React.FC = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [tourFilter, setTourFilter] = useState<string>('all');

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tennisPlayers', tourFilter],
    queryFn: () => fetchTennisPlayers(tourFilter !== 'all' ? tourFilter : undefined),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  // Safely extract players
  const players = useMemo(() => {
    if (!apiResponse) return [];
    if (apiResponse.data && Array.isArray(apiResponse.data.players)) {
      return apiResponse.data.players;
    }
    if (Array.isArray(apiResponse)) return apiResponse;
    return [];
  }, [apiResponse]);

  const lastUpdated = apiResponse?.data?.last_updated || new Date().toISOString();
  const isRealData = apiResponse?.data?.is_real_data ?? false;

  const filteredPlayers = useMemo(() => {
    if (!Array.isArray(players)) return [];
    if (tourFilter === 'all') return players;
    return players.filter(p => p.tour === tourFilter);
  }, [players, tourFilter]);

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
          Tennis Players
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

  // Only show error if we have no players and there's an error
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
          Error loading tennis players: {(error as Error)?.message || apiResponse?.message || 'Unknown error'}
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
            Tennis Players
          </Typography>
          <Chip
            icon={<CalendarIcon />}
            label={`Updated: ${new Date(lastUpdated).toLocaleDateString()}`}
            variant="outlined"
          />
        </Box>
        <Box display="flex" gap={2}>
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
            <MenuItem value="ATP">ATP</MenuItem>
            <MenuItem value="WTA">WTA</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Players" />
          <Tab label="Top 10" />
          <Tab label="Rising Stars" />
          <Tab label="By Country" />
        </Tabs>
      </Box>

      {/* All Players Tab */}
      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            {tourFilter === 'all' ? 'All Tennis Players' : `${tourFilter} Players`}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">Country</TableCell>
                  <TableCell align="center">Rank</TableCell>
                  <TableCell align="center">Points</TableCell>
                  <TableCell align="center">Age</TableCell>
                  <TableCell align="center">Turned Pro</TableCell>
                  <TableCell align="center">Hand</TableCell>
                  <TableCell align="center">Prospect</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {player.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <CountryChip code={player.country_code} name={player.country} />
                    </TableCell>
                    <TableCell align="center">
                      <RankChip
                        rank={player.tour === 'ATP' ? player.atp_rank : player.wta_rank}
                        tour={player.tour}
                      />
                    </TableCell>
                    <TableCell align="center">{player.points ?? 0}</TableCell>
                    <TableCell align="center">{player.age ?? '—'}</TableCell>
                    <TableCell align="center">{player.turned_pro ?? '—'}</TableCell>
                    <TableCell align="center">
                      <Chip label={player.hand ?? '?'} size="small" variant="outlined" />
                    </TableCell>
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

      {/* Top 10 Tab */}
      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>
            Top 10 Players
          </Typography>
          {filteredPlayers.filter(p => (p.atp_rank && p.atp_rank <= 10) || (p.wta_rank && p.wta_rank <= 10)).length === 0 ? (
            <Alert severity="info">No top 10 players found for the current filter.</Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredPlayers
                .filter(p => (p.atp_rank && p.atp_rank <= 10) || (p.wta_rank && p.wta_rank <= 10))
                .map((player) => (
                  <Grid item xs={12} md={6} lg={4} key={player.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {player.name?.charAt(0) ?? '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{player.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {player.country ?? '—'} • {player.tour ?? '—'}
                            </Typography>
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Rank</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            #{player.atp_rank || player.wta_rank || '?'}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Points</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {player.points ?? 0}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Age</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {player.age ?? '—'}
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

      {/* Rising Stars Tab */}
      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>
            Rising Stars
          </Typography>
          {filteredPlayers.filter(p => p.is_prospect).length === 0 ? (
            <Alert severity="info">No rising stars found for the current filter.</Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredPlayers.filter(p => p.is_prospect).map((player) => (
                <Grid item xs={12} md={6} lg={4} key={player.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">{player.name}</Typography>
                        <ProspectChip />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {player.country ?? '—'} • {player.tour ?? '—'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Rank</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          #{player.atp_rank || player.wta_rank || 'NR'}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Points</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {player.points ?? 0}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Age</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {player.age ?? '—'}
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

      {/* By Country Tab – placeholder */}
      {tabValue === 3 && (
        <Alert severity="info">Country breakdown coming soon.</Alert>
      )}
    </Container>
  );
};

export default TennisPlayers;
