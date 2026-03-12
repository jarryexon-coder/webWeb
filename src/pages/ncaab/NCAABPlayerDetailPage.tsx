import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent, Box, Chip, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import { usePlayer, usePlayerSeasonStats, usePlayerStats } from '../../hooks/useNcaab';

const NCAABPlayerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const playerId = Number(id);
  const { data: player, isLoading: playerLoading } = usePlayer(playerId);
  const { data: seasonStats } = usePlayerSeasonStats({ season: 2025, player_ids: [playerId] });
  const { data: gameLogs } = usePlayerStats({ player_ids: [playerId], per_page: 10 });

  if (playerLoading) return <Container>Loading player...</Container>;
  if (!player) return <Container>Player not found</Container>;

  const season = seasonStats?.data[0];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>{player.full_name}</Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {player.team?.name} • #{player.jersey_number} • {player.position} • {player.class}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Player Info</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>Height: {player.height}</Typography>
                <Typography>Weight: {player.weight}</Typography>
                <Typography>Hometown: {player.hometown}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {season && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Season Averages ({season.season})</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`${season.points_per_game} PPG`} />
                  <Chip label={`${season.rebounds_per_game} RPG`} />
                  <Chip label={`${season.assists_per_game} APG`} />
                  <Chip label={`${season.field_goal_pct}% FG`} />
                  <Chip label={`${season.three_point_pct}% 3P`} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Game Logs</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Opponent</TableCell>
                    <TableCell align="right">PTS</TableCell>
                    <TableCell align="right">REB</TableCell>
                    <TableCell align="right">AST</TableCell>
                    <TableCell align="right">STL</TableCell>
                    <TableCell align="right">BLK</TableCell>
                    <TableCell align="right">MIN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gameLogs?.data.map((stat) => (
                    <TableRow key={stat.game_id}>
                      <TableCell>{stat.game_id}</TableCell> {/* Replace with actual opponent name */}
                      <TableCell align="right">{stat.points || '-'}</TableCell>
                      <TableCell align="right">{stat.rebounds || '-'}</TableCell>
                      <TableCell align="right">{stat.assists || '-'}</TableCell>
                      <TableCell align="right">{stat.steals || '-'}</TableCell>
                      <TableCell align="right">{stat.blocks || '-'}</TableCell>
                      <TableCell align="right">{stat.minutes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NCAABPlayerDetailPage;
