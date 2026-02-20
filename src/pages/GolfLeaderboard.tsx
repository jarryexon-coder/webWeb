// src/pages/GolfLeaderboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
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
  Box
} from '@mui/material';
import tennisApi from '../services/tennis';

interface LeaderboardEntry {
  rank: number;
  player: string;
  country: string;
  toPar: string;
  round1: string;
  round2: string;
  round3: string;
  round4: string;
  total: string;
  strokes: number;
}

const GolfLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // ✅ Use the correct method from the default export
        const response = await API.getGolfLeaderboard('PGA');
        if (response.success && response.data?.leaderboard) {
          setLeaderboard(response.data.leaderboard);
        } else {
          setError('Failed to load leaderboard data');
        }
      } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        ⛳ PGA Leaderboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        February 2026 – Current tournament standings
      </Typography>

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
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry) => (
              <TableRow key={entry.player}>
                <TableCell>
                  <Chip
                    label={entry.rank}
                    size="small"
                    color={entry.rank <= 10 ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight="medium">{entry.player}</Typography>
                </TableCell>
                <TableCell>{entry.country}</TableCell>
                <TableCell align="center">
                  <Typography
                    fontWeight="bold"
                    color={entry.toPar.startsWith('-') ? 'error.main' : 'text.primary'}
                  >
                    {entry.toPar}
                  </Typography>
                </TableCell>
                <TableCell align="center">{entry.round1}</TableCell>
                <TableCell align="center">{entry.round2}</TableCell>
                <TableCell align="center">{entry.round3}</TableCell>
                <TableCell align="center">{entry.round4}</TableCell>
                <TableCell align="center">{entry.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {leaderboard.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">No leaderboard data available</Typography>
        </Box>
      )}
    </Container>
  );
};

export default GolfLeaderboard;
