import React, { useState } from 'react';
import {
  Container, Typography, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Paper
} from '@mui/material';
import { useStandings } from '../../hooks/useNcaab';

const NCAABStandingsPage: React.FC = () => {
  const [season, setSeason] = useState(new Date().getFullYear());
  const { data: standings, isLoading } = useStandings({ season });

  if (isLoading) return <Container>Loading standings...</Container>;

  // Group by conference
  const grouped = standings?.reduce((acc, s) => {
    const confId = s.conference_id;
    if (!acc[confId]) acc[confId] = [];
    acc[confId].push(s);
    return acc;
  }, {} as Record<number, typeof standings>);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>NCAA Basketball Standings</Typography>
      <FormControl sx={{ minWidth: 120, mb: 3 }}>
        <InputLabel>Season</InputLabel>
        <Select value={season} label="Season" onChange={(e) => setSeason(Number(e.target.value))}>
          <MenuItem value={2025}>2025</MenuItem>
          <MenuItem value={2024}>2024</MenuItem>
          <MenuItem value={2023}>2023</MenuItem>
        </Select>
      </FormControl>

      {grouped && Object.entries(grouped).map(([confId, teams]) => (
        <Paper key={confId} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6">Conference {confId}</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell align="right">W</TableCell>
                <TableCell align="right">L</TableCell>
                <TableCell align="right">PCT</TableCell>
                <TableCell align="right">Conf</TableCell>
                <TableCell align="right">Home</TableCell>
                <TableCell align="right">Away</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((s) => (
                <TableRow key={s.team_id}>
                  <TableCell>{s.team?.name || `Team ${s.team_id}`}</TableCell>
                  <TableCell align="right">{s.wins}</TableCell>
                  <TableCell align="right">{s.losses}</TableCell>
                  <TableCell align="right">{(s.wins / (s.wins + s.losses)).toFixed(3)}</TableCell>
                  <TableCell align="right">{s.conference_wins}–{s.conference_losses}</TableCell>
                  <TableCell align="right">{s.home_wins}–{s.home_losses}</TableCell>
                  <TableCell align="right">{s.away_wins}–{s.away_losses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      ))}
    </Container>
  );
};

export default NCAABStandingsPage;
