import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Typography, Grid, Card, CardContent, Box, Alert,
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Divider
} from '@mui/material';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://python-api-fresh-production.up.railway.app';
const BALLDONTLIE_API_KEY = import.meta.env.VITE_BALLDONTLIE_API_KEY;
const BALLDONTLIE_URL = 'https://api.balldontlie.io/ncaab/v1';

const NCAABGameDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const gameFromState = location.state?.game as any;

  const gameId = Number(id);
  const [game, setGame] = useState<any>(gameFromState || null);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(!gameFromState);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch game data (if not from state)
  useEffect(() => {
    if (gameFromState) {
      setGame(gameFromState);
      setLoading(false);
      return;
    }

    const fetchGame = async () => {
      try {
        setLoading(true);
        // Try your backend endpoint first (or use balldontlie directly if preferred)
        const response = await axios.get(`${API_BASE}/api/ncaab/games/${gameId}`);
        setGame(response.data);
      } catch (directErr) {
        // Fallback to balldontlie games endpoint (requires API key)
        try {
          const response = await axios.get(`${BALLDONTLIE_URL}/games/${gameId}`, {
            headers: { Authorization: BALLDONTLIE_API_KEY }
          });
          setGame(response.data);
        } catch (fallbackErr) {
          setError('Game not found or API error.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (gameId) fetchGame();
  }, [gameId, gameFromState]);

  // 2. Fetch team stats from balldontlie
  useEffect(() => {
    const fetchTeamStats = async () => {
      if (!gameId || !BALLDONTLIE_API_KEY) return;
      try {
        const response = await axios.get(`${BALLDONTLIE_URL}/team_stats`, {
          headers: { Authorization: BALLDONTLIE_API_KEY },
          params: { game_ids: [gameId] }
        });
        setTeamStats(response.data.data || []);
      } catch (err) {
        console.error('Failed to load team stats', err);
      }
    };
    if (gameId && game) fetchTeamStats();
  }, [gameId, game]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading game...</Typography>
      </Container>
    );
  }

  if (error || !game) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Game not found'}</Alert>
      </Container>
    );
  }

  const getTeamName = (team: any): string =>
    team?.full_name || team?.name || team?.school || 'Unknown';

  const homeTeam = game.home_team || game.homeTeam;
  const awayTeam = game.visitor_team || game.away_team || game.awayTeam;
  const homeName = getTeamName(homeTeam);
  const awayName = getTeamName(awayTeam);
  const homeScore = game.home_score ?? game.home_team_score ?? '-';
  const awayScore = game.away_score ?? game.away_team_score ?? '-';
  const gameDate = new Date(game.date).toLocaleString();

  // Separate stats for home and away
  const homeStats = teamStats.find(stat => stat.team.id === homeTeam?.id);
  const awayStats = teamStats.find(stat => stat.team.id === awayTeam?.id);

  // Function to format percentages
  const formatPct = (val: number | undefined) => val ? val.toFixed(1) + '%' : '-';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {awayName} @ {homeName}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {gameDate} • {game.status} • {game.period_detail || `Period ${game.period}`}
      </Typography>

      {/* Scorecard */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Final Score</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box textAlign="center">
              <Typography variant="h5">{awayName}</Typography>
              <Typography variant="h2">{awayScore}</Typography>
            </Box>
            <Typography variant="h3">–</Typography>
            <Box textAlign="center">
              <Typography variant="h5">{homeName}</Typography>
              <Typography variant="h2">{homeScore}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Team Stats Box Score */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Team Statistics</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Stat</TableCell>
                <TableCell align="right">{awayName}</TableCell>
                <TableCell align="right">{homeName}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Field Goals</TableCell>
                <TableCell align="right">
                  {awayStats ? `${awayStats.fgm}-${awayStats.fga} (${formatPct(awayStats.fg_pct)})` : '-'}
                </TableCell>
                <TableCell align="right">
                  {homeStats ? `${homeStats.fgm}-${homeStats.fga} (${formatPct(homeStats.fg_pct)})` : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>3-Pointers</TableCell>
                <TableCell align="right">
                  {awayStats ? `${awayStats.fg3m}-${awayStats.fg3a} (${formatPct(awayStats.fg3_pct)})` : '-'}
                </TableCell>
                <TableCell align="right">
                  {homeStats ? `${homeStats.fg3m}-${homeStats.fg3a} (${formatPct(homeStats.fg3_pct)})` : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Free Throws</TableCell>
                <TableCell align="right">
                  {awayStats ? `${awayStats.ftm}-${awayStats.fta} (${formatPct(awayStats.ft_pct)})` : '-'}
                </TableCell>
                <TableCell align="right">
                  {homeStats ? `${homeStats.ftm}-${homeStats.fta} (${formatPct(homeStats.ft_pct)})` : '-'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Rebounds</TableCell>
                <TableCell align="right">{awayStats?.reb ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.reb ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Offensive Rebounds</TableCell>
                <TableCell align="right">{awayStats?.oreb ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.oreb ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Defensive Rebounds</TableCell>
                <TableCell align="right">{awayStats?.dreb ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.dreb ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Assists</TableCell>
                <TableCell align="right">{awayStats?.ast ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.ast ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Steals</TableCell>
                <TableCell align="right">{awayStats?.stl ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.stl ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Blocks</TableCell>
                <TableCell align="right">{awayStats?.blk ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.blk ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Turnovers</TableCell>
                <TableCell align="right">{awayStats?.turnovers ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.turnovers ?? '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Fouls</TableCell>
                <TableCell align="right">{awayStats?.fouls ?? '-'}</TableCell>
                <TableCell align="right">{homeStats?.fouls ?? '-'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scoring by Period */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Scoring by Period</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Team</TableCell>
                <TableCell align="right">1st Half</TableCell>
                <TableCell align="right">2nd Half</TableCell>
                {Array.isArray(game.home_ot_scores) && game.home_ot_scores.map((_, idx) => (
                  <TableCell key={idx} align="right">OT{idx + 1}</TableCell>
                ))}
                <TableCell align="right">Final</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{awayName}</TableCell>
                <TableCell align="right">{game.away_score_h1 ?? '-'}</TableCell>
                <TableCell align="right">{game.away_score_h2 ?? '-'}</TableCell>
                {Array.isArray(game.away_ot_scores) && game.away_ot_scores.map((score, idx) => (
                  <TableCell key={idx} align="right">{score}</TableCell>
                ))}
                <TableCell align="right">{awayScore}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{homeName}</TableCell>
                <TableCell align="right">{game.home_score_h1 ?? '-'}</TableCell>
                <TableCell align="right">{game.home_score_h2 ?? '-'}</TableCell>
                {Array.isArray(game.home_ot_scores) && game.home_ot_scores.map((score, idx) => (
                  <TableCell key={idx} align="right">{score}</TableCell>
                ))}
                <TableCell align="right">{homeScore}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Container>
  );
};

export default NCAABGameDetailPage;
