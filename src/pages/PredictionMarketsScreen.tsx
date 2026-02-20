import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';

// Kalshi-style prediction markets dashboard
const PredictionMarketsScreen: React.FC = () => {
  // Mock data – replace with real API calls later
  const markets = [
    {
      id: '1',
      question: 'Will the Chiefs win the Super Bowl?',
      category: 'NFL',
      yesPrice: 0.28,
      noPrice: 0.72,
      volume: '$1.2M',
      expiry: 'Feb 9, 2025',
    },
    {
      id: '2',
      question: 'Will LeBron James score 25+ points tonight?',
      category: 'NBA',
      yesPrice: 0.62,
      noPrice: 0.38,
      volume: '$450K',
      expiry: 'Today 10:00 PM',
    },
    {
      id: '3',
      question: 'Will the Fed cut rates in March?',
      category: 'Economics',
      yesPrice: 0.41,
      noPrice: 0.59,
      volume: '$3.4M',
      expiry: 'Mar 20, 2026',
    },
    {
      id: '4',
      question: 'Will Taylor Swift win Album of the Year?',
      category: 'Culture',
      yesPrice: 0.55,
      noPrice: 0.45,
      volume: '$890K',
      expiry: 'Feb 2, 2026',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Kalshi Prediction Markets
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Real‑time implied probabilities and arbitrage opportunities.
      </Typography>

      <Grid container spacing={3}>
        {markets.map((market) => (
          <Grid item xs={12} md={6} key={market.id}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Chip label={market.category} size="small" color="primary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    Vol: {market.volume}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem' }}>
                  {market.question}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="success.main">
                      YES: {(market.yesPrice * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      NO: {(market.noPrice * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Expires
                    </Typography>
                    <Typography variant="body2">{market.expiry}</Typography>
                  </Box>
                </Box>
                <Box mt={2}>
                  <Button variant="outlined" size="small" fullWidth>
                    View Market
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sportsbook Arbitrage Opportunities
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Comparing Kalshi odds with traditional sportsbooks…
        </Alert>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell align="center">Kalshi YES</TableCell>
                <TableCell align="center">Sportsbook</TableCell>
                <TableCell align="center">Arbitrage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Lakers to win championship</TableCell>
                <TableCell align="center">32%</TableCell>
                <TableCell align="center">+250 (28.6%)</TableCell>
                <TableCell align="center" sx={{ color: 'success.main' }}>
                  +3.4%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Ohtani 30+ HR</TableCell>
                <TableCell align="center">58%</TableCell>
                <TableCell align="center">-150 (60%)</TableCell>
                <TableCell align="center" sx={{ color: 'error.main' }}>
                  -2.0%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default PredictionMarketsScreen;
