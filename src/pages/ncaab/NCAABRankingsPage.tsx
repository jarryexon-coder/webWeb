import React, { useState } from 'react';
import {
  Container, Typography, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, Alert
} from '@mui/material';
import { useRankings } from '../../hooks/useNcaab';

const NCAABRankingsPage: React.FC = () => {
  const [poll, setPoll] = useState<'AP' | 'Coaches'>('AP');
  const { data: rankings, isLoading, error } = useRankings({ poll, season: 2025 });

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading rankings...</Typography>
      </Container>
    );
  }

  if (error) {
    // Check if it's a 404
    const is404 = (error as any)?.response?.status === 404;
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {is404 
            ? 'Rankings endpoint not available on the backend. Please add the /api/ncaab/rankings route.'
            : `Error loading rankings: ${error.message}`}
        </Alert>
      </Container>
    );
  }

  // Safely handle data – may be an array or a paginated response
  const rankingsList = Array.isArray(rankings) ? rankings : (rankings?.data ?? []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>NCAA Basketball Rankings</Typography>
      <FormControl sx={{ minWidth: 120, mb: 3 }}>
        <InputLabel>Poll</InputLabel>
        <Select value={poll} label="Poll" onChange={(e) => setPoll(e.target.value as any)}>
          <MenuItem value="AP">AP Poll</MenuItem>
          <MenuItem value="Coaches">Coaches Poll</MenuItem>
        </Select>
      </FormControl>
      {rankingsList.length === 0 && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          No rankings found for this poll/season.
        </Typography>
      )}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Record</TableCell>
              <TableCell>Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rankingsList.map((r) => (
              <TableRow key={`${r.team_id}-${r.week}`}>
                <TableCell>{r.rank}</TableCell>
                <TableCell>{r.team?.name || `Team ${r.team_id}`}</TableCell>
                <TableCell>{r.record || '-'}</TableCell>
                <TableCell>{r.points || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default NCAABRankingsPage;
