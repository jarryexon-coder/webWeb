// pages/TeaserCalculatorScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Button,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  SportsFootball as FootballIcon,
  SportsBasketball as BasketballIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// ==============================
// Configuration & Types
// ==============================

type SportType = 'football' | 'basketball';
type PointsValue = 6 | 6.5 | 7 | 10 | 4 | 4.5 | 5 | 5.5;

interface TeaserOdds {
  legs: number;
  american: string;
  decimal: number;
  implied: number;
}

// ==============================
// Mock Teaser Odds Data
// Based on typical sportsbook offerings
// ==============================

const FOOTBALL_TEASER_ODDS: Record<number, Record<PointsValue, TeaserOdds[]>> = {
  6: {
    6: [
      { legs: 2, american: '-110', decimal: 1.91, implied: 52.4 },
      { legs: 3, american: '+160', decimal: 2.60, implied: 38.5 },
      { legs: 4, american: '+260', decimal: 3.60, implied: 27.8 },
      { legs: 5, american: '+400', decimal: 5.00, implied: 20.0 },
      { legs: 6, american: '+550', decimal: 6.50, implied: 15.4 },
      { legs: 7, american: '+800', decimal: 9.00, implied: 11.1 },
      { legs: 8, american: '+1200', decimal: 13.00, implied: 7.7 },
    ],
    6.5: [
      { legs: 2, american: '-120', decimal: 1.83, implied: 54.5 },
      { legs: 3, american: '+150', decimal: 2.50, implied: 40.0 },
      { legs: 4, american: '+240', decimal: 3.40, implied: 29.4 },
      { legs: 5, american: '+370', decimal: 4.70, implied: 21.3 },
      { legs: 6, american: '+500', decimal: 6.00, implied: 16.7 },
      { legs: 7, american: '+700', decimal: 8.00, implied: 12.5 },
      { legs: 8, american: '+1000', decimal: 11.00, implied: 9.1 },
    ],
    7: [
      { legs: 2, american: '-130', decimal: 1.77, implied: 56.5 },
      { legs: 3, american: '+140', decimal: 2.40, implied: 41.7 },
      { legs: 4, american: '+220', decimal: 3.20, implied: 31.3 },
      { legs: 5, american: '+340', decimal: 4.40, implied: 22.7 },
      { legs: 6, american: '+450', decimal: 5.50, implied: 18.2 },
      { legs: 7, american: '+600', decimal: 7.00, implied: 14.3 },
      { legs: 8, american: '+800', decimal: 9.00, implied: 11.1 },
    ],
    10: [
      { legs: 2, american: '-150', decimal: 1.67, implied: 60.0 },
      { legs: 3, american: '+130', decimal: 2.30, implied: 43.5 },
      { legs: 4, american: '+200', decimal: 3.00, implied: 33.3 },
      { legs: 5, american: '+300', decimal: 4.00, implied: 25.0 },
      { legs: 6, american: '+400', decimal: 5.00, implied: 20.0 },
      { legs: 7, american: '+500', decimal: 6.00, implied: 16.7 },
      { legs: 8, american: '+700', decimal: 8.00, implied: 12.5 },
    ],
  },
};

const BASKETBALL_TEASER_ODDS: Record<number, Record<PointsValue, TeaserOdds[]>> = {
  4: {
    4: [
      { legs: 2, american: '-110', decimal: 1.91, implied: 52.4 },
      { legs: 3, american: '+160', decimal: 2.60, implied: 38.5 },
      { legs: 4, american: '+260', decimal: 3.60, implied: 27.8 },
      { legs: 5, american: '+400', decimal: 5.00, implied: 20.0 },
      { legs: 6, american: '+550', decimal: 6.50, implied: 15.4 },
      { legs: 7, american: '+800', decimal: 9.00, implied: 11.1 },
      { legs: 8, american: '+1200', decimal: 13.00, implied: 7.7 },
    ],
    4.5: [
      { legs: 2, american: '-120', decimal: 1.83, implied: 54.5 },
      { legs: 3, american: '+150', decimal: 2.50, implied: 40.0 },
      { legs: 4, american: '+240', decimal: 3.40, implied: 29.4 },
      { legs: 5, american: '+370', decimal: 4.70, implied: 21.3 },
      { legs: 6, american: '+500', decimal: 6.00, implied: 16.7 },
      { legs: 7, american: '+700', decimal: 8.00, implied: 12.5 },
      { legs: 8, american: '+1000', decimal: 11.00, implied: 9.1 },
    ],
    5: [
      { legs: 2, american: '-130', decimal: 1.77, implied: 56.5 },
      { legs: 3, american: '+140', decimal: 2.40, implied: 41.7 },
      { legs: 4, american: '+220', decimal: 3.20, implied: 31.3 },
      { legs: 5, american: '+340', decimal: 4.40, implied: 22.7 },
      { legs: 6, american: '+450', decimal: 5.50, implied: 18.2 },
      { legs: 7, american: '+600', decimal: 7.00, implied: 14.3 },
      { legs: 8, american: '+800', decimal: 9.00, implied: 11.1 },
    ],
    5.5: [
      { legs: 2, american: '-140', decimal: 1.71, implied: 58.5 },
      { legs: 3, american: '+130', decimal: 2.30, implied: 43.5 },
      { legs: 4, american: '+200', decimal: 3.00, implied: 33.3 },
      { legs: 5, american: '+300', decimal: 4.00, implied: 25.0 },
      { legs: 6, american: '+400', decimal: 5.00, implied: 20.0 },
      { legs: 7, american: '+500', decimal: 6.00, implied: 16.7 },
      { legs: 8, american: '+650', decimal: 7.50, implied: 13.3 },
    ],
  },
};

// ==============================
// Helper Functions
// ==============================

const formatOdds = (odds: string): string => {
  return odds.startsWith('+') || odds.startsWith('-') ? odds : `+${odds}`;
};

// ==============================
// Main Component
// ==============================

const TeaserCalculatorScreen: React.FC = () => {
  const theme = useTheme();

  // State
  const [sport, setSport] = useState<SportType>('football');
  const [points, setPoints] = useState<PointsValue>(6);
  const [maxLegs, setMaxLegs] = useState<number>(8);
  const [stake, setStake] = useState<number>(10);
  const [selectedLegs, setSelectedLegs] = useState<number>(2);

  // Available points based on sport
  const footballPoints: PointsValue[] = [6, 6.5, 7, 10];
  const basketballPoints: PointsValue[] = [4, 4.5, 5, 5.5];

  // Current odds data
  const [oddsData, setOddsData] = useState<TeaserOdds[]>([]);

  useEffect(() => {
    if (sport === 'football') {
      const data = FOOTBALL_TEASER_ODDS[6]?.[points] || [];
      setOddsData(data);
    } else {
      const data = BASKETBALL_TEASER_ODDS[4]?.[points] || [];
      setOddsData(data);
    }
  }, [sport, points]);

  const handleSportChange = (
    _: React.MouseEvent<HTMLElement>,
    newSport: SportType | null
  ) => {
    if (newSport) {
      setSport(newSport);
      // Reset points to default for that sport
      setPoints(newSport === 'football' ? 6 : 4);
    }
  };

  const handlePointsChange = (event: Event, newValue: number | number[]) => {
    setPoints(newValue as PointsValue);
  };

  const handleMaxLegsChange = (event: Event, newValue: number | number[]) => {
    setMaxLegs(newValue as number);
  };

  const handleStakeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setStake(value);
    }
  };

  // Get selected odds for the chosen leg count
  const selectedOdds = oddsData.find((o) => o.legs === selectedLegs);
  const potentialPayout = selectedOdds ? stake * selectedOdds.decimal : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <CalculateIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Teaser Calculator
          </Typography>
          <Tooltip title="Calculate odds and payouts for teaser bets. Teasing adjusts point spreads/totals in your favor for reduced odds.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Controls Column */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Teaser Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Sport Selection */}
            <Typography variant="subtitle2" gutterBottom>
              Sport
            </Typography>
            <ToggleButtonGroup
              value={sport}
              exclusive
              onChange={handleSportChange}
              aria-label="sport selection"
              sx={{ mb: 3 }}
            >
              <ToggleButton value="football" aria-label="football">
                <FootballIcon sx={{ mr: 1 }} />
                NFL/CFB
              </ToggleButton>
              <ToggleButton value="basketball" aria-label="basketball">
                <BasketballIcon sx={{ mr: 1 }} />
                NBA/CBB
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Points Teased */}
            <Typography variant="subtitle2" gutterBottom>
              Points Teased: <strong>{points}</strong>
            </Typography>
            <Slider
              value={points}
              onChange={handlePointsChange}
              step={sport === 'football' ? 0.5 : 0.5}
              marks={sport === 'football' 
                ? footballPoints.map((p) => ({ value: p, label: p.toString() }))
                : basketballPoints.map((p) => ({ value: p, label: p.toString() }))
              }
              min={sport === 'football' ? 6 : 4}
              max={sport === 'football' ? 10 : 5.5}
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            {/* Max Legs to Display */}
            <Typography variant="subtitle2" gutterBottom>
              Max Legs: {maxLegs}
            </Typography>
            <Slider
              value={maxLegs}
              onChange={handleMaxLegsChange}
              step={1}
              marks={[
                { value: 2, label: '2' },
                { value: 4, label: '4' },
                { value: 6, label: '6' },
                { value: 8, label: '8' },
              ]}
              min={2}
              max={8}
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            {/* Stake Input */}
            <Typography variant="subtitle2" gutterBottom>
              Stake ($)
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={stake}
              onChange={handleStakeChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: 0.5 },
              }}
              sx={{ mb: 3 }}
            />

            {/* Quick Info */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Teaser rules:</strong> {sport === 'football' ? 'NFL/CFB' : 'NBA/CBB'} - {points} points teased.
                Odds are standard across major sportsbooks.
              </Typography>
            </Alert>
          </Paper>
        </Grid>

        {/* Odds Table Column */}
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Teaser Odds
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Legs</TableCell>
                    <TableCell align="center">Odds (American)</TableCell>
                    <TableCell align="center">Decimal</TableCell>
                    <TableCell align="center">Implied Probability</TableCell>
                    <TableCell align="center">Payout (${stake.toFixed(2)} stake)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {oddsData
                    .filter((odds) => odds.legs <= maxLegs)
                    .map((odds) => {
                      const isSelected = odds.legs === selectedLegs;
                      return (
                        <TableRow
                          key={odds.legs}
                          hover
                          onClick={() => setSelectedLegs(odds.legs)}
                          sx={{
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? theme.palette.action.selected
                              : 'inherit',
                          }}
                        >
                          <TableCell component="th" scope="row">
                            <Typography fontWeight={isSelected ? 'bold' : 'regular'}>
                              {odds.legs} Leg{odds.legs > 1 ? 's' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={formatOdds(odds.american)}
                              size="small"
                              color={isSelected ? 'primary' : 'default'}
                              variant={isSelected ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell align="center">{odds.decimal.toFixed(2)}</TableCell>
                          <TableCell align="center">{odds.implied.toFixed(1)}%</TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color="success.main"
                            >
                              ${(stake * odds.decimal).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Selected Teaser Summary */}
            {selectedOdds && (
              <Box mt={3} p={2} bgcolor={theme.palette.grey[50]} borderRadius={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Teaser
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Legs
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedOdds.legs}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Odds
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">
                      {formatOdds(selectedOdds.american)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Stake
                    </Typography>
                    <Typography variant="body1">${stake.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Payout
                    </Typography>
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                      ${potentialPayout.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 2 }}
                  startIcon={<CalculateIcon />}
                  fullWidth
                >
                  Add to Bet Slip
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Line Movement Preview (optional) */}
      <Paper variant="outlined" sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          How Teasing Affects the Spread / Total
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Example: NFL Spread
            </Typography>
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Original Spread</TableCell>
                    <TableCell>Teased +{points}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>-3.5</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      +{points - 3.5} (was -3.5)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>-7</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      +{points - 7 > 0 ? points - 7 : (points - 7) * -1} (was -7)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>+2.5</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      +{points + 2.5} (was +2.5)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Example: NBA Spread
            </Typography>
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Original Spread</TableCell>
                    <TableCell>Teased +{sport === 'football' ? points : points}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>-4.5</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      +{points - 4.5} (was -4.5)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>-7</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      +{points - 7 > 0 ? points - 7 : (points - 7) * -1} (was -7)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>+3</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      +{points + 3} (was +3)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer Disclaimer */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Teaser odds are estimates and may vary by sportsbook. Always check the current odds before placing a bet.
        This tool is for informational purposes only.
      </Typography>
    </Container>
  );
};

export default TeaserCalculatorScreen;
