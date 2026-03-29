import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Grid, Card, CardContent, Button } from '@mui/material';
import { useGames } from '../../hooks/useNcaab';
import { Link } from 'react-router-dom';

const NCAABGamesPage: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { data, isLoading, error } = useGames({ 
    dates: [date], 
    per_page: 25 
  });

  const games = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    return data?.data ?? [];
  }, [data]);

  // Debug: log first game to see its structure
  useEffect(() => {
    if (games.length > 0) {
      console.log('🎮 First game full:', JSON.stringify(games[0], null, 2));
      console.log('away_team_id:', games[0].away_team_id, 'home_team_id:', games[0].home_team_id);
    }
  }, [games]);

  // Helper to extract team name from possible team object
  const getTeamName = (team: any): string => {
    if (!team) return '';
    return team.full_name || team.name || team.school || team.market || team.nickname || team.abbreviation || '';
  };

  // Helper to get display name for a team (home/away) from a game object
  const getTeamDisplay = (game: any, side: 'home' | 'away'): string => {
    // Try different possible keys for the team object
    const teamObj = game[`${side}_team`] || game[`${side}Team`] || (side === 'home' ? game.home_team : game.visitor_team);
    const teamId = game[`${side}_team_id`] || game[`${side}TeamId`] || game[`${side}Team`]?.id;
    
    const name = getTeamName(teamObj);
    if (name) return name;
    if (teamId) return `Team ${teamId}`;
    return 'TBD';
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading games...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">Error loading games: {error.message}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        NCAA Basketball Games
      </Typography>
      <TextField
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3 }}
      />
      {games.length === 0 && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          No games found for this date. Try another date.
        </Typography>
      )}
      <Grid container spacing={3}>
        {games.map((game) => {
          const awayName = getTeamDisplay(game, 'away');
          const homeName = getTeamDisplay(game, 'home');
          return (
            <Grid item xs={12} md={6} key={game.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {awayName} @ {homeName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(game.date).toLocaleTimeString()} • {game.status}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Score: {game.away_score ?? game.away_team_score ?? '-'} – {game.home_score ?? game.home_team_score ?? '-'}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/ncaab/games/${game.id}`}
                    state={{ game }} // 👈 pass the full game object
                    sx={{ mt: 2 }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      {!Array.isArray(data) && data?.meta?.next_cursor && (
        <Button variant="outlined" sx={{ mt: 2 }}>
          Load More
        </Button>
      )}
    </Container>
  );
};

export default NCAABGamesPage;
