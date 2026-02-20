// pages/RoundRobinScreen.tsx

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
  Tabs,
  Tab,
  Slider,
  TextField,
  InputAdornment,
  Alert,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  Casino as ParlayIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// ==============================
// Configuration & Types
// ==============================

interface BetLeg {
  id: string;
  description: string;
  odds: string;
  oddsDecimal: number;
  sport: string;
  market: string;
  player_name?: string;
  team?: string;
  confidence?: number;
}

type RoundRobinSize = 2 | 3 | 4 | 5 | 6;

// ==============================
// Mock Data
// ==============================

const AVAILABLE_LEGS: BetLeg[] = [
  {
    id: 'leg-1',
    description: 'LeBron James Points Over 25.5',
    odds: '-140',
    oddsDecimal: 1.71,
    sport: 'NBA',
    market: 'player_props',
    player_name: 'LeBron James',
    team: 'LAL',
    confidence: 82,
  },
  {
    id: 'leg-2',
    description: 'Stephen Curry Assists Over 6.5',
    odds: '-130',
    oddsDecimal: 1.77,
    sport: 'NBA',
    market: 'player_props',
    player_name: 'Stephen Curry',
    team: 'GSW',
    confidence: 78,
  },
  {
    id: 'leg-3',
    description: 'Giannis Antetokounmpo Rebounds Over 11.5',
    odds: '-120',
    oddsDecimal: 1.83,
    sport: 'NBA',
    market: 'player_props',
    player_name: 'Giannis Antetokounmpo',
    team: 'MIL',
    confidence: 75,
  },
  {
    id: 'leg-4',
    description: 'Patrick Mahomes Passing Yards Over 275.5',
    odds: '-115',
    oddsDecimal: 1.87,
    sport: 'NFL',
    market: 'player_props',
    player_name: 'Patrick Mahomes',
    team: 'KC',
    confidence: 72,
  },
  {
    id: 'leg-5',
    description: 'Shohei Ohtani Strikeouts Over 7.5',
    odds: '-105',
    oddsDecimal: 1.95,
    sport: 'MLB',
    market: 'player_props',
    player_name: 'Shohei Ohtani',
    team: 'LAD',
    confidence: 68,
  },
  {
    id: 'leg-6',
    description: 'Auston Matthews Goals Over 0.5',
    odds: '+120',
    oddsDecimal: 2.20,
    sport: 'NHL',
    market: 'player_props',
    player_name: 'Auston Matthews',
    team: 'TOR',
    confidence: 65,
  },
];

// ==============================
// Helper Functions
// ==============================

const formatOdds = (odds: string): string => {
  return odds.startsWith('+') || odds.startsWith('-') ? odds : `+${odds}`;
};

const calculateParlayOddsDecimal = (legs: BetLeg[]): number => {
  return legs.reduce((product, leg) => product * leg.oddsDecimal, 1);
};

const decimalToAmerican = (decimal: number): string => {
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (decimal - 1))}`;
  }
};

// ==============================
// Main Component
// ==============================

const RoundRobinScreen: React.FC = () => {
  const theme = useTheme();

  // State
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [selectedLegs, setSelectedLegs] = useState<BetLeg[]>([]);
  const [rrSize, setRrSize] = useState<RoundRobinSize>(2);
  const [stakePerParlay, setStakePerParlay] = useState<number>(5.0);
  const [showCombinations, setShowCombinations] = useState<boolean>(false);

  // Derived state: available legs filtered by sport
  const filteredLegs = AVAILABLE_LEGS.filter(
    (leg) => sportFilter === 'all' || leg.sport.toLowerCase() === sportFilter
  );

  // Calculate number of parlays in round robin
  const numSelected = selectedLegs.length;
  const numParlays =
    numSelected >= rrSize
      ? Math.floor(
          factorial(numSelected) /
            (factorial(rrSize) * factorial(numSelected - rrSize))
        )
      : 0;

  // Calculate total stake
  const totalStake = stakePerParlay * numParlays;

  // Calculate payout if all legs win (max payout)
  const maxPayout = React.useMemo(() => {
    if (numSelected < rrSize) return 0;
    let total = 0;
    // Generate all combinations and sum their payouts
    const combinations = getCombinations(selectedLegs, rrSize);
    combinations.forEach((combo) => {
      const oddsDecimal = calculateParlayOddsDecimal(combo);
      total += stakePerParlay * oddsDecimal;
    });
    return total;
  }, [selectedLegs, rrSize, stakePerParlay]);

  // Generate combinations for display (optional)
  const combinationsPreview = React.useMemo(() => {
    if (!showCombinations || numSelected < rrSize) return [];
    return getCombinations(selectedLegs, rrSize).slice(0, 5); // show first 5
  }, [selectedLegs, rrSize, showCombinations]);

  // Handlers
  const handleAddLeg = (leg: BetLeg) => {
    if (!selectedLegs.find((l) => l.id === leg.id)) {
      setSelectedLegs([...selectedLegs, leg]);
    }
  };

  const handleRemoveLeg = (legId: string) => {
    setSelectedLegs(selectedLegs.filter((l) => l.id !== legId));
  };

  const handleClearAll = () => {
    setSelectedLegs([]);
  };

  const handleSportFilterChange = (_: React.SyntheticEvent, newValue: string) => {
    setSportFilter(newValue);
  };

  const handleRrSizeChange = (_: Event, newValue: number | number[]) => {
    setRrSize(newValue as RoundRobinSize);
  };

  const handleStakeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0.5) {
      setStakePerParlay(value);
    }
  };

  // Effect: auto-set showCombinations when legs change
  useEffect(() => {
    if (numSelected >= rrSize) {
      setShowCombinations(true);
    }
  }, [numSelected, rrSize]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <ParlayIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Round Robin Builder
          </Typography>
          <Tooltip title="Round robin creates multiple parlays from your selected legs (e.g., by 2's, by 3's).">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        {selectedLegs.length > 0 && (
          <Button variant="outlined" color="error" onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Available Legs */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Available Legs
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Sport Filter Tabs */}
            <Tabs
              value={sportFilter}
              onChange={handleSportFilterChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              <Tab label="All" value="all" />
              <Tab label="NBA" value="nba" />
              <Tab label="NFL" value="nfl" />
              <Tab label="MLB" value="mlb" />
              <Tab label="NHL" value="nhl" />
            </Tabs>

            {/* Leg List */}
            <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
              {filteredLegs.map((leg) => {
                const isSelected = selectedLegs.some((l) => l.id === leg.id);
                return (
                  <Card
                    key={leg.id}
                    variant="outlined"
                    sx={{
                      mb: 1.5,
                      cursor: isSelected ? 'default' : 'pointer',
                      opacity: isSelected ? 0.6 : 1,
                      borderColor: isSelected ? theme.palette.success.main : undefined,
                    }}
                    onClick={() => !isSelected && handleAddLeg(leg)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {leg.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {leg.sport} • {leg.market}
                            {leg.team && ` • ${leg.team}`}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <Chip
                            label={formatOdds(leg.odds)}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          {!isSelected ? (
                            <IconButton size="small" color="primary">
                              <AddIcon />
                            </IconButton>
                          ) : (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLeg(leg.id);
                              }}
                            >
                              <RemoveIcon />
                            </IconButton>
                          )}
                        </Box>
                      </Box>
                      {leg.confidence && (
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <LinearProgress
                            variant="determinate"
                            value={leg.confidence}
                            sx={{
                              width: 60,
                              height: 4,
                              borderRadius: 2,
                              mr: 1,
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor:
                                  leg.confidence >= 80
                                    ? theme.palette.success.main
                                    : leg.confidence >= 65
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main,
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {leg.confidence}% conf
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {filteredLegs.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" py={4}>
                  No legs available for this sport.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Middle Column: Selected Legs & RR Options */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Selected Legs ({selectedLegs.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {selectedLegs.length === 0 ? (
              <Alert severity="info">Select at least 2 legs to build a round robin.</Alert>
            ) : (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                {selectedLegs.map((leg) => (
                  <Box
                    key={leg.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                      {leg.description}
                    </Typography>
                    <Box>
                      <Chip
                        label={formatOdds(leg.odds)}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <IconButton size="small" onClick={() => handleRemoveLeg(leg.id)}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Round Robin By:
            </Typography>
            <Slider
              value={rrSize}
              onChange={handleRrSizeChange}
              step={1}
              marks={[
                { value: 2, label: '2s' },
                { value: 3, label: '3s' },
                { value: 4, label: '4s' },
                { value: 5, label: '5s' },
                { value: 6, label: '6s' },
              ]}
              min={2}
              max={6}
              valueLabelDisplay="auto"
              disabled={selectedLegs.length < 2}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>
              Stake per Parlay ($)
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={stakePerParlay}
              onChange={handleStakeChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0.5, step: 0.5 },
              }}
              disabled={selectedLegs.length < 2}
            />
          </Paper>

          {/* Calculations Summary */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Parlays
                </Typography>
                <Typography variant="h6">{numParlays}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Total Stake
                </Typography>
                <Typography variant="h6">${totalStake.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Max Payout (if all win)
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  ${maxPayout.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={selectedLegs.length < rrSize}
              sx={{ mt: 3, borderRadius: 28 }}
              startIcon={<CalculateIcon />}
            >
              Calculate & Add to Bet Slip
            </Button>
          </Paper>
        </Grid>

        {/* Right Column: Preview of Combinations */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Combinations Preview</Typography>
              <Tooltip title="Showing first 5 combinations">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {selectedLegs.length < rrSize ? (
              <Alert severity="info">
                Select at least {rrSize} legs to see {rrSize}-leg combinations.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {numParlays} total {rrSize}-leg parlays
                </Typography>
                <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                  {combinationsPreview.map((combo, idx) => {
                    const comboOddsDecimal = calculateParlayOddsDecimal(combo);
                    const comboOddsAmerican = decimalToAmerican(comboOddsDecimal);
                    const comboPayout = stakePerParlay * comboOddsDecimal;
                    return (
                      <Card key={idx} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="caption" fontWeight="bold" color="primary">
                            Parlay {idx + 1}
                          </Typography>
                          {combo.map((leg) => (
                            <Typography key={leg.id} variant="caption" display="block" noWrap>
                              {leg.description} ({formatOdds(leg.odds)})
                            </Typography>
                          ))}
                          <Box display="flex" justifyContent="space-between" mt={0.5}>
                            <Chip
                              label={comboOddsAmerican}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              ${comboPayout.toFixed(2)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {numParlays > 5 && (
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                      + {numParlays - 5} more combinations
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Footer Disclaimer */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Round robin calculations are based on the odds provided. Actual payouts may vary by sportsbook.
        This tool is for informational purposes only.
      </Typography>
    </Container>
  );
};

// ==============================
// Utility Functions
// ==============================

function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  if (size === 0) return [[]];
  if (size > array.length) return [];

  const recurse = (start: number, current: T[]) => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      recurse(i + 1, current);
      current.pop();
    }
  };

  recurse(0, []);
  return result;
}

export default RoundRobinScreen;
