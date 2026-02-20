// pages/ParlayDetailsScreen.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
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
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  TextField,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  EmojiEvents as WinIcon,
  Close as LossIcon,
  Remove as PushIcon,
  AccessTime as PendingIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

// ==============================
// Configuration & Types
// ==============================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://python-api-fresh-production.up.railway.app';

export interface ParlayLegDetail {
  id: string;
  description: string;
  odds: string;
  odds_decimal?: number;
  confidence: number;
  sport: string;
  market: string;
  player_name?: string;
  stat_type?: string;
  line?: number;
  value_side?: string;
  teams?: { home: string; away: string };
  result?: 'win' | 'loss' | 'push' | 'pending';
  confidence_level: 'high' | 'medium' | 'low' | 'very-high' | 'very-low';
}

export interface ParlayDetail {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ParlayLegDetail[];
  total_odds: string;
  total_decimal_odds?: number;
  confidence: number;
  confidence_level: string;
  analysis: string;
  expected_value: string;
  risk_level: string;
  stake?: number;
  potential_payout?: number;
  created_at: string;
  expires_at?: string;
  is_real_data?: boolean;
  isSettled?: boolean;
  result?: 'win' | 'loss' | 'push' | 'pending';
  payout?: number;
}

// ==============================
// Mock Data (fallback)
// ==============================

const MOCK_DETAIL: ParlayDetail = {
  id: 'parlay-1',
  name: 'NBA Player Props Parlay',
  sport: 'NBA',
  type: 'player_props',
  market_type: 'player_props',
  legs: [
    {
      id: 'leg-1-1',
      description: 'LeBron James Points Over 25.5',
      odds: '-140',
      odds_decimal: 1.71,
      confidence: 82,
      sport: 'NBA',
      market: 'player_props',
      player_name: 'LeBron James',
      stat_type: 'Points',
      line: 25.5,
      value_side: 'over',
      confidence_level: 'high',
    },
    {
      id: 'leg-1-2',
      description: 'Stephen Curry Assists Over 6.5',
      odds: '-130',
      odds_decimal: 1.77,
      confidence: 78,
      sport: 'NBA',
      market: 'player_props',
      player_name: 'Stephen Curry',
      stat_type: 'Assists',
      line: 6.5,
      value_side: 'over',
      confidence_level: 'medium',
    },
    {
      id: 'leg-1-3',
      description: 'Giannis Antetokounmpo Rebounds Over 11.5',
      odds: '-120',
      odds_decimal: 1.83,
      confidence: 75,
      sport: 'NBA',
      market: 'player_props',
      player_name: 'Giannis Antetokounmpo',
      stat_type: 'Rebounds',
      line: 11.5,
      value_side: 'over',
      confidence_level: 'medium',
    },
  ],
  total_odds: '+425',
  total_decimal_odds: 5.25,
  confidence: 78,
  confidence_level: 'medium',
  analysis: 'Three-star players with favorable matchups tonight. All have cleared these lines in 4 of last 5 games.',
  expected_value: '+7.2%',
  risk_level: 'medium',
  stake: 10.0,
  potential_payout: 52.50,
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 3 * 3600000).toISOString(),
  is_real_data: false,
  isSettled: false,
  result: 'pending',
};

// ==============================
// API Hooks
// ==============================

const fetchParlayDetails = async (id: string): Promise<ParlayDetail> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/parlay/details/${id}`);
    return response.data.parlay;
  } catch (error) {
    console.warn('Failed to fetch parlay details, using mock data', error);
    // Return a copy of mock data with the requested ID for realism
    return { ...MOCK_DETAIL, id };
  }
};

// ==============================
// Helper Components
// ==============================

const SportIcon: React.FC<{ sport: string }> = ({ sport }) => {
  switch (sport.toUpperCase()) {
    case 'NBA':
      return <BasketballIcon />;
    case 'NFL':
      return <FootballIcon />;
    case 'MLB':
      return <BaseballIcon />;
    case 'NHL':
      return <HockeyIcon />;
    default:
      return <InfoIcon />;
  }
};

const ResultIcon: React.FC<{ result?: string }> = ({ result }) => {
  switch (result) {
    case 'win':
      return <WinIcon sx={{ color: 'success.main' }} />;
    case 'loss':
      return <LossIcon sx={{ color: 'error.main' }} />;
    case 'push':
      return <PushIcon sx={{ color: 'text.secondary' }} />;
    default:
      return <PendingIcon sx={{ color: 'warning.main' }} />;
  }
};

const formatOdds = (odds: string): string => {
  return odds.startsWith('+') || odds.startsWith('-') ? odds : `+${odds}`;
};

const calculatePayout = (stake: number, totalDecimalOdds: number): number => {
  return stake * totalDecimalOdds;
};

// ==============================
// Main Component
// ==============================

const ParlayDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [stake, setStake] = useState<number>(10.0);
  const [stakeError, setStakeError] = useState<string | null>(null);

  const {
    data: parlay = MOCK_DETAIL,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['parlay-details', id],
    queryFn: () => fetchParlayDetails(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  const handleStakeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (isNaN(value) || value < 0.5) {
      setStakeError('Minimum stake is $0.50');
    } else if (value > 1000) {
      setStakeError('Maximum stake is $1,000');
    } else {
      setStakeError(null);
      setStake(value);
    }
  };

  const payout = parlay.total_decimal_odds
    ? calculatePayout(stake, parlay.total_decimal_odds)
    : null;

  const handlePlaceBet = () => {
    if (!stakeError && stake >= 0.5) {
      // Place bet logic – could call an API or add to bet slip
      alert(`Bet placed! Stake: $${stake.toFixed(2)}`);
      // navigate to bet slip or confirmation
    }
  };

  if (!id) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">No parlay ID provided.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button and header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" fontWeight="bold">
          Parlay Details
        </Typography>
        {parlay.isSettled && (
          <Chip
            icon={<ResultIcon result={parlay.result} />}
            label={parlay.result?.toUpperCase()}
            color={parlay.result === 'win' ? 'success' : parlay.result === 'loss' ? 'error' : 'default'}
            variant="outlined"
            sx={{ ml: 2 }}
          />
        )}
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load parlay details. Showing mock data.
        </Alert>
      ) : null}

      <Grid container spacing={4}>
        {/* Left column: Parlay summary and legs */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40, mr: 2 }}>
                  <SportIcon sport={parlay.sport} />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {parlay.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {parlay.sport} • {parlay.market_type.replace('_', ' ')} • {parlay.legs.length} legs
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`Total Odds: ${formatOdds(parlay.total_odds)}`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Legs
            </Typography>
            <Stack spacing={2}>
              {parlay.legs.map((leg, index) => (
                <Card key={leg.id} variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="body1" fontWeight="medium">
                          {leg.description}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                          <Chip
                            label={`${leg.market}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          {leg.player_name && (
                            <Chip
                              label={leg.player_name}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {leg.line && (
                            <Chip
                              label={`Line: ${leg.line}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          {formatOdds(leg.odds)}
                        </Typography>
                        {leg.result && (
                          <Box display="flex" alignItems="center" justifyContent="flex-end" mt={0.5}>
                            <ResultIcon result={leg.result} />
                            <Typography variant="caption" sx={{ ml: 0.5, textTransform: 'capitalize' }}>
                              {leg.result}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    {!parlay.isSettled && (
                      <Box display="flex" alignItems="center" mt={1}>
                        <LinearProgress
                          variant="determinate"
                          value={leg.confidence}
                          sx={{
                            width: 80,
                            height: 6,
                            borderRadius: 3,
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
                          {leg.confidence}% confidence
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>

          {/* Analysis section */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              AI Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {parlay.analysis}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Confidence
                </Typography>
                <Typography variant="h6">
                  {parlay.confidence}%
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Expected Value
                </Typography>
                <Typography variant="h6" color="success.main">
                  {parlay.expected_value}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Risk Level
                </Typography>
                <Chip
                  label={parlay.risk_level}
                  size="small"
                  color={parlay.risk_level === 'low' ? 'success' : parlay.risk_level === 'medium' ? 'warning' : 'error'}
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created
                </Typography>
                <Typography variant="body2">
                  {format(parseISO(parlay.created_at), 'MMM dd, yyyy hh:mm a')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right column: Bet slip / stake */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Bet Slip
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Stake
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={stake}
                onChange={handleStakeChange}
                error={!!stakeError}
                helperText={stakeError}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0.5, max: 1000, step: 0.5 },
                }}
                disabled={parlay.isSettled}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Total Odds
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {formatOdds(parlay.total_odds)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Legs
              </Typography>
              <Typography variant="body1">{parlay.legs.length}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body1" fontWeight="bold">
                Potential Payout
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {payout ? `$${payout.toFixed(2)}` : '—'}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={parlay.isSettled || !!stakeError || stake < 0.5}
              onClick={handlePlaceBet}
              sx={{ borderRadius: 28, py: 1.5 }}
            >
              {parlay.isSettled ? 'Already Settled' : 'Place Bet'}
            </Button>

            {parlay.expires_at && !parlay.isSettled && (
              <Box display="flex" alignItems="center" justifyContent="center" mt={2}>
                <PendingIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  Expires {format(parseISO(parlay.expires_at), 'MMM dd, hh:mm a')}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ParlayDetailsScreen;
