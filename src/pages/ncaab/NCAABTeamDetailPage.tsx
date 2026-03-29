import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Typography, Grid, Card, CardContent, Box,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableHead, TableRow, Paper, Chip
} from '@mui/material';

// Use your environment variable for the API key
const BALLDONTLIE_API_KEY = import.meta.env.VITE_BALLDONTLIE_API_KEY;
const BALLDONTLIE_URL = 'https://api.balldontlie.io/ncaab/v1';

// Helper to format percentages
const formatPct = (val: number | undefined) => 
  val !== undefined ? val.toFixed(1) + '%' : '-';

const NCAABTeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const teamId = Number(id);

  const [team, setTeam] = useState<any>(null);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId || !BALLDONTLIE_API_KEY) {
        setError('Missing team ID or API key');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Fetch team basic info (from teams endpoint)
        const teamResponse = await axios.get(`${BALLDONTLIE_URL}/teams/${teamId}`, {
          headers: { Authorization: BALLDONTLIE_API_KEY }
        });
        setTeam(teamResponse.data);

        // 2. Fetch team game statistics
        // You may want to limit to recent games, e.g., last 10
        const statsResponse = await axios.get(`${BALLDONTLIE_URL}/team_stats`, {
          headers: { Authorization: BALLDONTLIE_API_KEY },
          params: { 
            team_ids: [teamId],
            per_page: 10,
            // Optional: add date range if needed
          }
        });
        setTeamStats(statsResponse.data.data || []);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please check your API key and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading team details...</Typography>
      </Container>
    );
  }

  if (error || !team) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Team not found'}</Alert>
      </Container>
    );
  }

  // Calculate averages from the stats
  const avgStats = teamStats.length > 0 ? {
    fgm: (teamStats.reduce((sum, s) => sum + s.fgm, 0) / teamStats.length).toFixed(1),
    fga: (teamStats.reduce((sum, s) => sum + s.fga, 0) / teamStats.length).toFixed(1),
    fg_pct: (teamStats.reduce((sum, s) => sum + s.fg_pct, 0) / teamStats.length),
    fg3m: (teamStats.reduce((sum, s) => sum + s.fg3m, 0) / teamStats.length).toFixed(1),
    fg3a: (teamStats.reduce((sum, s) => sum + s.fg3a, 0) / teamStats.length).toFixed(1),
    fg3_pct: (teamStats.reduce((sum, s) => sum + s.fg3_pct, 0) / teamStats.length),
    ftm: (teamStats.reduce((sum, s) => sum + s.ftm, 0) / teamStats.length).toFixed(1),
    fta: (teamStats.reduce((sum, s) => sum + s.fta, 0) / teamStats.length).toFixed(1),
    ft_pct: (teamStats.reduce((sum, s) => sum + s.ft_pct, 0) / teamStats.length),
    reb: (teamStats.reduce((sum, s) => sum + s.reb, 0) / teamStats.length).toFixed(1),
    oreb: (teamStats.reduce((sum, s) => sum + s.oreb, 0) / teamStats.length).toFixed(1),
    dreb: (teamStats.reduce((sum, s) => sum + s.dreb, 0) / teamStats.length).toFixed(1),
    ast: (teamStats.reduce((sum, s) => sum + s.ast, 0) / teamStats.length).toFixed(1),
    stl: (teamStats.reduce((sum, s) => sum + s.stl, 0) / teamStats.length).toFixed(1),
    blk: (teamStats.reduce((sum, s) => sum + s.blk, 0) / teamStats.length).toFixed(1),
    turnovers: (teamStats.reduce((sum, s) => sum + s.turnovers, 0) / teamStats.length).toFixed(1),
    fouls: (teamStats.reduce((sum, s) => sum + s.fouls, 0) / teamStats.length).toFixed(1),
  } : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Team Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {team.full_name || team.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`College: ${team.college || 'N/A'}`} />
          <Chip label={`Abbreviation: ${team.abbreviation || 'N/A'}`} />
          <Chip label={`Conference ID: ${team.conference_id || 'N/A'}`} />
        </Box>
      </Paper>

      {/* Averages Card */}
      {avgStats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Season Averages (Last {teamStats.length} Games)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Points</Typography>
                <Typography variant="body1">
                  {((Number(avgStats.fgm) * 2 + Number(avgStats.fg3m)) / teamStats.length).toFixed(1)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">FG%</Typography>
                <Typography variant="body1">{formatPct(avgStats.fg_pct)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">3P%</Typography>
                <Typography variant="body1">{formatPct(avgStats.fg3_pct)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">FT%</Typography>
                <Typography variant="body1">{formatPct(avgStats.ft_pct)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Rebounds</Typography>
                <Typography variant="body1">{avgStats.reb}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Assists</Typography>
                <Typography variant="body1">{avgStats.ast}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Steals</Typography>
                <Typography variant="body1">{avgStats.stl}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Blocks</Typography>
                <Typography variant="body1">{avgStats.blk}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Game Logs Table */}
      {teamStats.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Game Statistics</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">FGM-FGA</TableCell>
                  <TableCell align="right">FG%</TableCell>
                  <TableCell align="right">3PM-3PA</TableCell>
                  <TableCell align="right">3P%</TableCell>
                  <TableCell align="right">FTM-FTA</TableCell>
                  <TableCell align="right">FT%</TableCell>
                  <TableCell align="right">REB</TableCell>
                  <TableCell align="right">AST</TableCell>
                  <TableCell align="right">STL</TableCell>
                  <TableCell align="right">BLK</TableCell>
                  <TableCell align="right">TO</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamStats.map((stat, idx) => (
                  <TableRow key={stat.game?.id || idx}>
                    <TableCell>
                      {stat.game?.date ? new Date(stat.game.date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell align="right">{stat.fgm}-{stat.fga}</TableCell>
                    <TableCell align="right">{formatPct(stat.fg_pct)}</TableCell>
                    <TableCell align="right">{stat.fg3m}-{stat.fg3a}</TableCell>
                    <TableCell align="right">{formatPct(stat.fg3_pct)}</TableCell>
                    <TableCell align="right">{stat.ftm}-{stat.fta}</TableCell>
                    <TableCell align="right">{formatPct(stat.ft_pct)}</TableCell>
                    <TableCell align="right">{stat.reb}</TableCell>
                    <TableCell align="right">{stat.ast}</TableCell>
                    <TableCell align="right">{stat.stl}</TableCell>
                    <TableCell align="right">{stat.blk}</TableCell>
                    <TableCell align="right">{stat.turnovers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">No game statistics available for this team.</Alert>
      )}
    </Container>
  );
};

export default NCAABTeamDetailPage;
