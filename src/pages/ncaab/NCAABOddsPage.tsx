import React from 'react';
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { useOdds } from '../../hooks/useNcaab';

const NCAABOddsPage: React.FC = () => {
  const { data, isLoading } = useOdds();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Betting Odds</Typography>
      {isLoading && <Typography>Loading odds...</Typography>}
      <Grid container spacing={2}>
        {data?.data.map((odd) => (
          <Grid item xs={12} md={6} key={`${odd.game_id}-${odd.provider}`}>
            <Card>
              <CardContent>
                <Typography variant="h6">Game {odd.game_id}</Typography>
                <Typography variant="body2">Provider: {odd.provider}</Typography>
                <Typography>Spread: {odd.spread}</Typography>
                <Typography>Over/Under: {odd.over_under}</Typography>
                <Typography>Moneyline: {odd.home_moneyline} / {odd.away_moneyline}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default NCAABOddsPage;
