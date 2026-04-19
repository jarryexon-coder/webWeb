// src/pages/TennisPlayers.tsx - Starter package required
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
import { useAuth } from '../contexts/AuthContext';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

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
  hand: 'left' | 'right' | 'ambidextrous';
  tour: 'ATP' | 'WTA';
  is_prospect?: boolean;
}

// ----------------------------------------------------------------------
// Mock data
// ----------------------------------------------------------------------
const getMockTennisPlayers = (): TennisPlayer[] => [
  { id: 'atp1', name: 'Novak Djokovic', country: 'Serbia', country_code: 'SRB', atp_rank: 1, points: 11245, age: 36, turned_pro: 2003, hand: 'right', tour: 'ATP', is_prospect: false },
  { id: 'atp2', name: 'Carlos Alcaraz', country: 'Spain', country_code: 'ESP', atp_rank: 2, points: 8875, age: 20, turned_pro: 2018, hand: 'right', tour: 'ATP', is_prospect: true },
  { id: 'atp3', name: 'Jannik Sinner', country: 'Italy', country_code: 'ITA', atp_rank: 4, points: 8270, age: 22, turned_pro: 2018, hand: 'right', tour: 'ATP', is_prospect: true },
  { id: 'atp4', name: 'Daniil Medvedev', country: 'Russia', country_code: 'RUS', atp_rank: 3, points: 8765, age: 28, turned_pro: 2014, hand: 'right', tour: 'ATP', is_prospect: false },
  { id: 'wta1', name: 'Iga Swiatek', country: 'Poland', country_code: 'POL', wta_rank: 1, points: 10755, age: 22, turned_pro: 2016, hand: 'right', tour: 'WTA', is_prospect: false },
  { id: 'wta2', name: 'Aryna Sabalenka', country: 'Belarus', country_code: 'BLR', wta_rank: 2, points: 8945, age: 25, turned_pro: 2015, hand: 'right', tour: 'WTA', is_prospect: false },
  { id: 'wta3', name: 'Coco Gauff', country: 'USA', country_code: 'USA', wta_rank: 3, points: 7455, age: 19, turned_pro: 2018, hand: 'right', tour: 'WTA', is_prospect: true },
];

// ----------------------------------------------------------------------
// API function with fallback (using /api/atp/rankings)
// ----------------------------------------------------------------------
const fetchTennisPlayers = async (tour?: string): Promise<{ players: TennisPlayer[]; is_real_data: boolean }> => {
  try {
    let atpPlayers: TennisPlayer[] = [];
    let wtaPlayers: TennisPlayer[] = [];

    if (!tour || tour === 'ATP' || tour === 'all') {
      const baseUrl = import.meta.env.VITE_API_BASE_PYTHON || 'https://python-api-fresh-production.up.railway.app';
      const atpUrl = `${baseUrl}/api/atp/rankings?per_page=100`;
      const response = await fetch(atpUrl);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && Array.isArray(json.data.data)) {
          atpPlayers = json.data.data.map((entry: any) => {
            const player = entry.player;
            let hand: 'left' | 'right' | 'ambidextrous' = 'right';
            if (player.plays?.toLowerCase().includes('left')) hand = 'left';
            else if (player.plays?.toLowerCase().includes('ambidextrous')) hand = 'ambidextrous';
            return {
              id: String(player.id),
              name: player.full_name || `${player.first_name} ${player.last_name}`,
              country: player.country || 'Unknown',
              country_code: player.country_code || '???',
              atp_rank: entry.rank,
              points: entry.points,
              age: player.age || 0,
              turned_pro: player.turned_pro || 0,
              hand,
              tour: 'ATP',
              is_prospect: entry.rank <= 100 && player.age <= 21,
            };
          });
        }
      } else console.warn('ATP API error, using mock ATP');
    }

    if (!tour || tour === 'WTA' || tour === 'all') {
      const mockAll = getMockTennisPlayers();
      wtaPlayers = mockAll.filter(p => p.tour === 'WTA');
    }

    let combined: TennisPlayer[] = [];
    if (tour === 'ATP') combined = atpPlayers;
    else if (tour === 'WTA') combined = wtaPlayers;
    else combined = [...atpPlayers, ...wtaPlayers];

    if (combined.length === 0) {
      console.warn('No players retrieved, using full mock');
      return { players: getMockTennisPlayers(), is_real_data: false };
    }
    return { players: combined, is_real_data: atpPlayers.length > 0 };
  } catch (error) {
    console.error('Error fetching tennis players:', error);
    return { players: getMockTennisPlayers(), is_real_data: false };
  }
};

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------
const CountryChip = ({ code, name }: { code?: string; name?: string }) => (
  <Chip icon={<CountryIcon />} label={`${code || '?'} – ${name || '?'}`} size="small" variant="outlined" sx={{ height: 24 }} />
);
const RankChip = ({ rank, tour }: { rank?: number; tour?: string }) => {
  if (!rank) return <Chip label="NR" size="small" variant="outlined" />;
  const color = rank <= 10 ? 'success' : rank <= 50 ? 'primary' : 'default';
  return <Chip icon={<RankIcon />} label={`#${rank} (${tour})`} size="small" color={color} />;
};
const ProspectChip = () => <Chip icon={<ProspectIcon />} label="Prospect" size="small" color="secondary" />;

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const TennisPlayersContent: React.FC = () => {
  const { profile } = useAuth();
  const [tabValue, setTabValue] = useState<number>(0);
  const [tourFilter, setTourFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tennisPlayers', tourFilter],
    queryFn: () => fetchTennisPlayers(tourFilter !== 'all' ? tourFilter : undefined),
    staleTime: 1000 * 60 * 10,
  });

  const players = data?.players || [];
  const isRealData = data?.is_real_data ?? false;

  const filteredPlayers = useMemo(() => {
    if (tourFilter === 'all') return players;
    return players.filter(p => p.tour === tourFilter);
  }, [players, tourFilter]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue);
  const handleTourChange = (event: SelectChangeEvent) => setTourFilter(event.target.value);

  if (isLoading && !players.length) return <SkeletonLoader />;
  if (error && !players.length) return <ErrorView onRetry={refetch} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <TennisIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">Tennis Players</Typography>
          <Chip icon={<CalendarIcon />} label={`Updated: ${new Date().toLocaleDateString()}`} variant="outlined" />
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh"><IconButton onClick={() => refetch()} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {profile && <PlanFeaturesDisplay currentPlan={profile.plan} compact />}

      {!isRealData && <Alert severity="info" sx={{ mb: 3 }}>Displaying simulated player data. Live data will appear when available.</Alert>}

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControl sx={{ minWidth: 150 }} size="small">
          <InputLabel>Tour</InputLabel>
          <Select value={tourFilter} label="Tour" onChange={handleTourChange}>
            <MenuItem value="all">All Tours</MenuItem>
            <MenuItem value="ATP">ATP</MenuItem>
            <MenuItem value="WTA">WTA</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Players" />
          <Tab label="Top 10" />
          <Tab label="Rising Stars" />
          <Tab label="By Country" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <>
          <Typography variant="h6" gutterBottom>{tourFilter === 'all' ? 'All Tennis Players' : `${tourFilter} Players`}</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead><TableRow><TableCell>Player</TableCell><TableCell align="center">Country</TableCell><TableCell align="center">Rank</TableCell><TableCell align="center">Points</TableCell><TableCell align="center">Age</TableCell><TableCell align="center">Turned Pro</TableCell><TableCell align="center">Hand</TableCell><TableCell align="center">Prospect</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredPlayers.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography variant="body2" fontWeight="medium">{p.name}</Typography></TableCell>
                    <TableCell align="center"><CountryChip code={p.country_code} name={p.country} /></TableCell>
                    <TableCell align="center"><RankChip rank={p.tour === 'ATP' ? p.atp_rank : p.wta_rank} tour={p.tour} /></TableCell>
                    <TableCell align="center">{p.points}</TableCell><TableCell align="center">{p.age}</TableCell>
                    <TableCell align="center">{p.turned_pro}</TableCell><TableCell align="center"><Chip label={p.hand} size="small" variant="outlined" /></TableCell>
                    <TableCell align="center">{p.is_prospect && <ProspectChip />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tabValue === 1 && (
        <>
          <Typography variant="h6" gutterBottom>Top 10 Players</Typography>
          <Grid container spacing={3}>
            {filteredPlayers.filter(p => (p.atp_rank && p.atp_rank <= 10) || (p.wta_rank && p.wta_rank <= 10)).map(p => (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{p.name.charAt(0)}</Avatar>
                      <Box><Typography variant="h6">{p.name}</Typography><Typography variant="body2" color="text.secondary">{p.country} • {p.tour}</Typography></Box>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Rank</Typography><Typography variant="body2" fontWeight="bold">#{p.atp_rank || p.wta_rank}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Points</Typography><Typography variant="body2" fontWeight="bold">{p.points}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Age</Typography><Typography variant="body2" fontWeight="bold">{p.age}</Typography></Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tabValue === 2 && (
        <>
          <Typography variant="h6" gutterBottom>Rising Stars</Typography>
          <Grid container spacing={3}>
            {filteredPlayers.filter(p => p.is_prospect).map(p => (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between"><Typography variant="h6">{p.name}</Typography><ProspectChip /></Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{p.country} • {p.tour}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Rank</Typography><Typography variant="body2" fontWeight="bold">#{p.atp_rank || p.wta_rank || 'NR'}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Points</Typography><Typography variant="body2" fontWeight="bold">{p.points}</Typography></Box>
                    <Box display="flex" justifyContent="space-between"><Typography variant="body2">Age</Typography><Typography variant="body2" fontWeight="bold">{p.age}</Typography></Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {tabValue === 3 && <Alert severity="info">Country breakdown coming soon.</Alert>}
    </Container>
  );
};

const SkeletonLoader = () => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Typography variant="h4">Tennis Players</Typography><Grid container spacing={3}><Grid item xs={12}><Skeleton variant="rounded" height={80} /></Grid><Grid item xs={12}><Skeleton variant="rounded" height={400} /></Grid></Grid></Container>
);
const ErrorView = ({ onRetry }: { onRetry: () => void }) => (
  <Container maxWidth="xl" sx={{ py: 4 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>Error loading tennis players.</Alert></Container>
);

const TennisPlayers: React.FC = () => (
  <ProtectedRoute screenName="TennisPlayers">
    <TennisPlayersContent />
  </ProtectedRoute>
);

export default TennisPlayers;
