import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Grid, Card, CardContent, Box, Chip, Table,
  TableBody, TableCell, TableHead, TableRow, Alert, CircularProgress
} from '@mui/material';
import { usePlayer, usePlayerSeasonStats, usePlayerStats } from '../../hooks/useNcaab';

const NCAABPlayerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const playerId = Number(id);

  const { data: player, isLoading: playerLoading, error: playerError } = usePlayer(playerId);
  const { data: seasonStats, isLoading: seasonLoading, error: seasonError } = usePlayerSeasonStats({ 
    season: 2025, 
    player_ids: [playerId] 
  });
  const { data: gameLogs, isLoading: logsLoading, error: logsError } = usePlayerStats({ 
    player_ids: [playerId], 
    per_page: 10 
  });

  // Log the actual data to see structure
  useEffect(() => {
    console.log('📊 Player:', player);
    console.log('📊 Season stats response:', seasonStats);
    console.log('📊 Game logs response:', gameLogs);
  }, [player, seasonStats, gameLogs]);

  if (playerLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading player...</Typography>
      </Container>
    );
  }

  if (playerError || !player) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {playerError ? `Error loading player: ${playerError.message}` : 'Player not found'}
        </Alert>
      </Container>
    );
  }

  const fullName = player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || `Player ${player.id}`;
  const team = player.team;
  const teamName = team?.full_name || team?.name || team?.school || team?.market || team?.nickname || 'Unknown';

  // Handle both array and paginated responses for seasonStats
  const season = Array.isArray(seasonStats) ? seasonStats[0] : seasonStats?.data?.[0];

  // Handle both array and paginated responses for gameLogs
  const logs = Array.isArray(gameLogs) ? gameLogs : (gameLogs?.data ?? []);

  const seasonUnauthorized = seasonError && (seasonError as any)?.response?.status === 401;
  const logsUnauthorized = logsError && (logsError as any)?.response?.status === 401;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>{fullName}</Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {teamName} • #{player.jersey_number || '?'} • {player.position || 'N/A'} • {player.class || ''}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Player Info</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>Height: {player.height || 'Not available'}</Typography>
                <Typography>Weight: {player.weight || 'Not available'}</Typography>
                <Typography>Hometown: {player.hometown || 'Not available'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Season Averages {season ? `(${season.season})` : ''}</Typography>
              {seasonLoading && <CircularProgress size={24} sx={{ mt: 2 }} />}
              {seasonUnauthorized && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Season stats unavailable – API key required on backend.
                </Alert>
              )}
              {season && !seasonLoading && !seasonUnauthorized && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`${season.points_per_game?.toFixed(1) || '0.0'} PPG`} />
                  <Chip label={`${season.rebounds_per_game?.toFixed(1) || '0.0'} RPG`} />
                  <Chip label={`${season.assists_per_game?.toFixed(1) || '0.0'} APG`} />
                  <Chip label={`${(season.field_goal_pct * 100)?.toFixed(1) || '0.0'}% FG`} />
                  <Chip label={`${(season.three_point_pct * 100)?.toFixed(1) || '0.0'}% 3P`} />
                </Box>
              )}
              {!season && !seasonLoading && !seasonUnauthorized && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No season stats available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Game Logs</Typography>
              {logsLoading && <CircularProgress size={24} />}
              {logsUnauthorized && (
                <Alert severity="warning">
                  Game logs unavailable – API key required on backend.
                </Alert>
              )}
              {logs.length > 0 && !logsLoading && !logsUnauthorized && (
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
                    {logs.map((stat, index) => (
                      <TableRow key={stat.game_id || index}>
                        <TableCell>{stat.opponent || stat.team?.name || `Game ${stat.game_id}`}</TableCell>
                        <TableCell align="right">{stat.points ?? '-'}</TableCell>
                        <TableCell align="right">{stat.rebounds ?? '-'}</TableCell>
                        <TableCell align="right">{stat.assists ?? '-'}</TableCell>
                        <TableCell align="right">{stat.steals ?? '-'}</TableCell>
                        <TableCell align="right">{stat.blocks ?? '-'}</TableCell>
                        <TableCell align="right">{stat.minutes ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {logs.length === 0 && !logsLoading && !logsUnauthorized && (
                <Typography variant="body2" color="text.secondary">
                  No recent game logs.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NCAABPlayerDetailPage;
