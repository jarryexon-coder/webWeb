// src/pages/GolfLeaderboard.tsx - Analytics plan required
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  AlertTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  Tooltip,
  IconButton,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import golfApi from '../services/golf';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Tournament {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface LeaderboardEntry {
  position: string;
  position_numeric?: number | null;
  player: string;
  player_id: number;
  country: string;
  to_par: string | null;
  total_score: number | null;
  earnings: number | null;
  tournament: string;
  round1?: string | null;
  round2?: string | null;
  round3?: string | null;
  round4?: string | null;
}

// ----------------------------------------------------------------------
// Mock data fallback
// ----------------------------------------------------------------------
const getMockLeaderboard = (): LeaderboardEntry[] => {
  const players = [
    { name: 'Scottie Scheffler', country: 'USA' },
    { name: 'Rory McIlroy', country: 'NIR' },
    { name: 'Jon Rahm', country: 'ESP' },
    { name: 'Viktor Hovland', country: 'NOR' },
    { name: 'Patrick Cantlay', country: 'USA' },
    { name: 'Xander Schauffele', country: 'USA' },
    { name: 'Max Homa', country: 'USA' },
    { name: 'Matt Fitzpatrick', country: 'ENG' },
    { name: 'Collin Morikawa', country: 'USA' },
    { name: 'Justin Thomas', country: 'USA' },
  ];
  return players.map((p, idx) => {
    const score = Math.floor(Math.random() * 15) - 8;
    const toPar = score <= 0 ? `${score}` : `+${score}`;
    const total = 280 + score;
    return {
      position: `${idx + 1}`,
      position_numeric: idx + 1,
      player: p.name,
      player_id: idx + 1,
      country: p.country,
      to_par: toPar,
      total_score: total,
      earnings: idx === 0 ? 3600000 : idx === 1 ? 2160000 : idx === 2 ? 1360000 : 100000,
      tournament: 'The Masters',
      round1: String(70 + Math.floor(Math.random() * 5) - 2),
      round2: String(70 + Math.floor(Math.random() * 5) - 2),
      round3: String(70 + Math.floor(Math.random() * 5) - 2),
      round4: idx < 5 ? String(70 + Math.floor(Math.random() * 5) - 2) : undefined,
    };
  }).sort((a, b) => (a.position_numeric || 0) - (b.position_numeric || 0));
};

const getMockTournaments = (): Tournament[] => [
  { id: 1, name: 'The Masters', start_date: '2026-04-09', end_date: '2026-04-12', status: 'upcoming' },
  { id: 2, name: 'PGA Championship', start_date: '2026-05-16', end_date: '2026-05-19', status: 'upcoming' },
  { id: 3, name: 'U.S. Open', start_date: '2026-06-13', end_date: '2026-06-16', status: 'upcoming' },
  { id: 4, name: 'The Open Championship', start_date: '2026-07-18', end_date: '2026-07-21', status: 'upcoming' },
  { id: 5, name: 'THE PLAYERS Championship', start_date: '2026-03-12', end_date: '2026-03-15', status: 'completed' },
];

// ----------------------------------------------------------------------
// API functions with fallback
// ----------------------------------------------------------------------
const fetchTournaments = async (): Promise<Tournament[]> => {
  try {
    const response = await golfApi.getTournaments('PGA', 2025);
    if (response.success && response.data?.tournaments) {
      return response.data.tournaments;
    }
    return getMockTournaments();
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return getMockTournaments();
  }
};

const fetchLeaderboard = async (tournamentId: number): Promise<LeaderboardEntry[]> => {
  try {
    const response = await golfApi.getLeaderboard(tournamentId);
    if (response.success && response.data?.leaderboard) {
      return response.data.leaderboard;
    }
    return getMockLeaderboard();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return getMockLeaderboard();
  }
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const GolfLeaderboardContent = () => {
  const { profile, planFeatures } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | ''>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournaments on mount
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const data = await fetchTournaments();
        setTournaments(data);
        const completed = data.filter(t => t.status === 'completed');
        if (completed.length > 0) {
          const sorted = completed.sort(
            (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
          setSelectedTournamentId(sorted[0].id);
        } else if (data.length > 0) {
          setSelectedTournamentId(data[0].id);
        }
      } catch (err) {
        setError('Failed to load tournaments');
      }
    };
    loadTournaments();
  }, []);

  // Fetch leaderboard when tournament changes
  useEffect(() => {
    if (!selectedTournamentId) return;
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await fetchLeaderboard(selectedTournamentId);
        setLeaderboard(data);
        setError(null);
      } catch (err) {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, [selectedTournamentId]);

  const handleTournamentChange = (event: SelectChangeEvent<number>) => {
    setSelectedTournamentId(event.target.value as number);
  };

  const handleRefresh = () => {
    if (selectedTournamentId) {
      setLoading(true);
      fetchLeaderboard(selectedTournamentId).then(data => {
        setLeaderboard(data);
        setLoading(false);
      });
    }
  };

  const isRealData = useMemo(() => {
    return leaderboard.some(entry => entry.earnings != null && entry.earnings > 0);
  }, [leaderboard]);

  const premiumStats = useMemo(() => {
    const totalEarnings = leaderboard.reduce((sum, entry) => sum + (entry.earnings || 0), 0);
    const averageScore = leaderboard.length > 0
      ? (leaderboard.reduce((sum, entry) => sum + (entry.total_score || 0), 0) / leaderboard.length).toFixed(1)
      : 'N/A';
    const underParPlayers = leaderboard.filter(entry => {
      const toPar = entry.to_par;
      return toPar && toPar.startsWith('-');
    }).length;
    const topEarner = [...leaderboard].sort((a, b) => (b.earnings || 0) - (a.earnings || 0))[0];
    return {
      totalEarnings: (totalEarnings / 1e6).toFixed(1),
      averageScore,
      underParPlayers,
      topEarner,
      totalPlayers: leaderboard.length,
    };
  }, [leaderboard]);

  if (loading && !leaderboard.length) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">⛳ PGA Leaderboard</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} color="primary" disabled={!selectedTournamentId}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tournament selector */}
      <FormControl sx={{ minWidth: 300, mb: 3 }}>
        <InputLabel id="tournament-select-label">Tournament</InputLabel>
        <Select
          labelId="tournament-select-label"
          value={selectedTournamentId}
          label="Tournament"
          onChange={handleTournamentChange}
          disabled={tournaments.length === 0}
        >
          {tournaments.map(t => (
            <MenuItem key={t.id} value={t.id}>
              {t.name} ({new Date(t.start_date).toLocaleDateString()} – {new Date(t.end_date).toLocaleDateString()})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Plan features display */}
      {profile && <PlanFeaturesDisplay currentPlan={profile.plan} compact />}

      {!isRealData && leaderboard.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Displaying simulated leaderboard data. Live data will appear when available.
        </Alert>
      )}

      {/* Premium Stats Dashboard */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <MoneyIcon color="success" />
                <Typography variant="body2" color="text.secondary">Total Purse</Typography>
              </Box>
              <Typography variant="h4">${premiumStats.totalEarnings}M</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Avg Score</Typography>
              </Box>
              <Typography variant="h4">{premiumStats.averageScore}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrophyIcon color="warning" />
                <Typography variant="body2" color="text.secondary">Under Par</Typography>
              </Box>
              <Typography variant="h4">{premiumStats.underParPlayers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon color="info" />
                <Typography variant="body2" color="text.secondary">Top Earner</Typography>
              </Box>
              <Typography variant="h6" noWrap>{premiumStats.topEarner?.player || 'N/A'}</Typography>
              <Typography variant="caption">${((premiumStats.topEarner?.earnings || 0) / 1e6).toFixed(1)}M</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Leaderboard Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Pos</TableCell>
              <TableCell>Player</TableCell>
              <TableCell>Country</TableCell>
              <TableCell align="center">To Par</TableCell>
              <TableCell align="center">R1</TableCell>
              <TableCell align="center">R2</TableCell>
              <TableCell align="center">R3</TableCell>
              <TableCell align="center">R4</TableCell>
              <TableCell align="center">Total</TableCell>
              <TableCell align="right">Earnings</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry) => (
              <TableRow key={`${entry.player_id}-${entry.position}`}>
                <TableCell>
                  <Chip label={entry.position} size="small" color={(entry.position_numeric ?? 100) <= 10 ? 'primary' : 'default'} />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="medium">{entry.player}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${(entry.earnings ? entry.earnings / 1000 : 0).toFixed(0)}K earned
                  </Typography>
                </TableCell>
                <TableCell>{entry.country}</TableCell>
                <TableCell align="center">
                  <Typography fontWeight="bold" color={entry.to_par?.startsWith('-') ? 'error.main' : 'text.primary'}>
                    {entry.to_par ?? '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">{entry.round1 ?? '-'}</TableCell>
                <TableCell align="center">{entry.round2 ?? '-'}</TableCell>
                <TableCell align="center">{entry.round3 ?? '-'}</TableCell>
                <TableCell align="center">{entry.round4 ?? '-'}</TableCell>
                <TableCell align="center">{entry.total_score ?? '-'}</TableCell>
                <TableCell align="right">{entry.earnings ? `$${entry.earnings.toLocaleString()}` : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {leaderboard.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">No leaderboard data available for this tournament</Typography>
        </Box>
      )}
    </Container>
  );
};

const GolfLeaderboard: React.FC = () => (
  <ProtectedRoute screenName="GolfLeaderboard">
    <GolfLeaderboardContent />
  </ProtectedRoute>
);

export default GolfLeaderboard;
