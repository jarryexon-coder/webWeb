// src/pages/NBADashboard.tsx
import React, { useMemo, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../services/apiClient';

interface Player {
  id: string | number;
  name: string;
  team: string;
  position: string;
  salary: number;
  fantasy_points: number;
  projected_points: number;
  points: number;
  rebounds: number;
  assists: number;
  value: number;
  injury_status?: string;
}

interface Game {
  id: string;
  away_team: string;
  home_team: string;
  away_score?: number;
  home_score?: number;
  status: string;
  commence_time?: string;
}

const NBADashboard: React.FC = () => {
  const theme = useTheme();

  const [playersData, setPlayersData] = useState<Player[]>([]);
  const [gamesData, setGamesData] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const playersResponse = await apiClient.getPlayers({ sport: 'nba', limit: 100 });
        if (playersResponse.success) {
          setPlayersData(playersResponse.players || []);
        } else {
          throw new Error(playersResponse.error || 'Failed to fetch players');
        }

        const gamesResponse = await apiClient.getOddsGames({ sport: 'nba' });
        if (gamesResponse.success) {
          setGamesData(gamesResponse.games || []);
        } else {
          console.warn('Games fetch failed, continuing without games');
          setGamesData([]);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const summary = useMemo(() => {
    if (!playersData || playersData.length === 0) {
      return {
        totalPlayers: 0,
        avgFantasy: 0,
        avgSalary: 0,
        topScorer: null as Player | null,
        topValue: null as Player | null,
      };
    }

    const total = playersData.length;
    const avgFantasy =
      playersData.reduce((acc, p) => acc + (p.fantasy_points || 0), 0) / total;
    const avgSalary =
      playersData.reduce((acc, p) => acc + (p.salary || 0), 0) / total;

    const topScorer = [...playersData].sort(
      (a, b) => (b.fantasy_points || 0) - (a.fantasy_points || 0)
    )[0];

    const topValue = [...playersData].sort(
      (a, b) => (b.value || 0) - (a.value || 0)
    )[0];

    return {
      totalPlayers: total,
      avgFantasy,
      avgSalary,
      topScorer,
      topValue,
    };
  }, [playersData]);

  const chartData = useMemo(() => {
    if (!playersData) return [];
    return playersData
      .filter((p) => p.fantasy_points != null)
      .sort((a, b) => b.fantasy_points - a.fantasy_points)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.split(' ').pop() || p.name,
        fantasy: Math.round(p.fantasy_points * 10) / 10,
        salary: p.salary,
      }));
  }, [playersData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading NBA dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🏀 NBA Fantasy Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Real-time player projections, top performers, and live game updates.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Players
              </Typography>
              <Typography variant="h3" color="primary">
                {summary.totalPlayers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Avg Fantasy Points
              </Typography>
              <Typography variant="h3" color="secondary">
                {summary.avgFantasy.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Avg Salary
              </Typography>
              <Typography variant="h4">${Math.round(summary.avgSalary).toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Top Scorer
              </Typography>
              <Typography variant="h6" noWrap>
                {summary.topScorer?.name || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary.topScorer?.fantasy_points?.toFixed(1)} FP
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Top 10 Players by Fantasy Points
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 50, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="fantasy" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              💰 Top Value Picks
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell align="right">Salary</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playersData
                    .filter((p) => p.value != null)
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 5)
                    .map((p) => (
                      <TableRow key={String(p.id)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {p.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.team} · {p.position}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`$${p.salary?.toLocaleString()}`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={p.value?.toFixed(2)}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              🏟️ Today's Games
            </Typography>
            {gamesData && gamesData.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Matchup</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gamesData.slice(0, 5).map((game) => (
                      <TableRow key={String(game.id)}>
                        <TableCell>
                          {game.away_team} @ {game.home_team}
                        </TableCell>
                        <TableCell>
                          {game.away_score ?? '–'} – {game.home_score ?? '–'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={game.status || 'Scheduled'}
                            size="small"
                            color={game.status?.toLowerCase().includes('live') ? 'error' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No games scheduled for today.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NBADashboard;
