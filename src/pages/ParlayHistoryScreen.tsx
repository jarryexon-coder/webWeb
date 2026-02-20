// pages/ParlayHistoryScreen.tsx

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  LinearProgress,
  useTheme,
  Stack,
} from '@mui/material';
import {
  History as HistoryIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  EmojiEvents as WinIcon,
  Close as LossIcon,
  Remove as PushIcon,
  TrendingUp as ProfitIcon,
  TrendingDown as LossIconAlt,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format, parseISO, subDays } from 'date-fns';

// ==============================
// Configuration & Types
// ==============================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://python-api-fresh-production.up.railway.app';

export interface ParlayLegHistory {
  id: string;
  description: string;
  odds: string;
  confidence: number;
  sport: string;
  market: string;
  result: 'win' | 'loss' | 'push' | 'pending';
}

export interface ParlayHistory {
  id: string;
  name: string;
  sport: string;
  legs: ParlayLegHistory[];
  total_odds: string;
  stake: number;
  payout: number | null;
  profit_loss: number | null;
  result: 'win' | 'loss' | 'push' | 'pending';
  confidence: number;
  created_at: string;
  settled_at: string | null;
  is_real_data?: boolean;
}

// ==============================
// Mock Data (fallback)
// ==============================

const MOCK_HISTORY: ParlayHistory[] = [
  {
    id: 'history-1',
    name: 'NBA Player Props Parlay',
    sport: 'NBA',
    legs: [
      {
        id: 'leg-1-1',
        description: 'LeBron James Points Over 25.5',
        odds: '-140',
        confidence: 82,
        sport: 'NBA',
        market: 'player_props',
        result: 'win',
      },
      {
        id: 'leg-1-2',
        description: 'Stephen Curry Assists Over 6.5',
        odds: '-130',
        confidence: 78,
        sport: 'NBA',
        market: 'player_props',
        result: 'win',
      },
      {
        id: 'leg-1-3',
        description: 'Giannis Antetokounmpo Rebounds Over 11.5',
        odds: '-120',
        confidence: 75,
        sport: 'NBA',
        market: 'player_props',
        result: 'win',
      },
    ],
    total_odds: '+425',
    stake: 10.0,
    payout: 52.50,
    profit_loss: 42.50,
    result: 'win',
    confidence: 78,
    created_at: subDays(new Date(), 1).toISOString(),
    settled_at: subDays(new Date(), 1).toISOString(),
    is_real_data: false,
  },
  {
    id: 'history-2',
    name: 'NFL Moneyline Parlay',
    sport: 'NFL',
    legs: [
      {
        id: 'leg-2-1',
        description: 'Kansas City Chiefs ML',
        odds: '-170',
        confidence: 85,
        sport: 'NFL',
        market: 'h2h',
        result: 'win',
      },
      {
        id: 'leg-2-2',
        description: 'San Francisco 49ers ML',
        odds: '-150',
        confidence: 82,
        sport: 'NFL',
        market: 'h2h',
        result: 'loss',
      },
    ],
    total_odds: '+185',
    stake: 15.0,
    payout: null,
    profit_loss: -15.0,
    result: 'loss',
    confidence: 83,
    created_at: subDays(new Date(), 3).toISOString(),
    settled_at: subDays(new Date(), 3).toISOString(),
    is_real_data: false,
  },
  {
    id: 'history-3',
    name: 'NBA Game Totals Parlay',
    sport: 'NBA',
    legs: [
      {
        id: 'leg-3-1',
        description: 'Lakers vs Warriors Over 225.5',
        odds: '-110',
        confidence: 72,
        sport: 'NBA',
        market: 'totals',
        result: 'push',
      },
      {
        id: 'leg-3-2',
        description: 'Celtics vs Heat Under 218.5',
        odds: '-115',
        confidence: 68,
        sport: 'NBA',
        market: 'totals',
        result: 'win',
      },
    ],
    total_odds: '+245',
    stake: 20.0,
    payout: 20.0, // push = stake returned
    profit_loss: 0.0,
    result: 'push',
    confidence: 70,
    created_at: subDays(new Date(), 5).toISOString(),
    settled_at: subDays(new Date(), 5).toISOString(),
    is_real_data: false,
  },
  {
    id: 'history-4',
    name: 'MLB Player Props Parlay',
    sport: 'MLB',
    legs: [
      {
        id: 'leg-4-1',
        description: 'Shohei Ohtani Strikeouts Over 6.5',
        odds: '-115',
        confidence: 74,
        sport: 'MLB',
        market: 'player_props',
        result: 'win',
      },
      {
        id: 'leg-4-2',
        description: 'Aaron Judge Home Runs Over 0.5',
        odds: '+190',
        confidence: 60,
        sport: 'MLB',
        market: 'player_props',
        result: 'loss',
      },
    ],
    total_odds: '+320',
    stake: 12.0,
    payout: null,
    profit_loss: -12.0,
    result: 'loss',
    confidence: 67,
    created_at: subDays(new Date(), 7).toISOString(),
    settled_at: subDays(new Date(), 7).toISOString(),
    is_real_data: false,
  },
];

// ==============================
// API Hooks
// ==============================

const fetchParlayHistory = async (sport: string = 'all'): Promise<ParlayHistory[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/parlay/history`, {
      params: { sport, limit: 50 },
    });
    return response.data.history || [];
  } catch (error) {
    console.warn('Failed to fetch parlay history, using mock data', error);
    return MOCK_HISTORY;
  }
};

// ==============================
// Helper Components
// ==============================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`history-tabpanel-${index}`}
      aria-labelledby={`history-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

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
      return <HistoryIcon />;
  }
};

const ResultChip: React.FC<{ result: string }> = ({ result }) => {
  switch (result) {
    case 'win':
      return <Chip icon={<WinIcon />} label="Win" size="small" color="success" variant="outlined" />;
    case 'loss':
      return <Chip icon={<LossIcon />} label="Loss" size="small" color="error" variant="outlined" />;
    case 'push':
      return <Chip icon={<PushIcon />} label="Push" size="small" color="default" variant="outlined" />;
    case 'pending':
      return <Chip label="Pending" size="small" color="warning" variant="outlined" />;
    default:
      return null;
  }
};

const formatCurrency = (value: number | null): string => {
  if (value === null) return '—';
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const formatOdds = (odds: string): string => {
  return odds.startsWith('+') || odds.startsWith('-') ? odds : `+${odds}`;
};

// ==============================
// Main Component
// ==============================

const ParlayHistoryScreen: React.FC = () => {
  const theme = useTheme();
  const [sportTab, setSportTab] = useState(0);
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'push'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Data fetching
  const {
    data: history = MOCK_HISTORY,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['parlay-history', sportTab],
    queryFn: () => {
      const sportMap = ['all', 'nba', 'nfl', 'mlb', 'nhl'];
      return fetchParlayHistory(sportMap[sportTab] || 'all');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSportTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSportTab(newValue);
  };

  // Filter history based on selected filters
  const filteredHistory = history.filter((parlay) => {
    // Sport filter already applied via API, but we can double-check
    // Result filter
    if (resultFilter !== 'all' && parlay.result !== resultFilter) return false;
    // Date filter
    if (dateRange !== 'all') {
      const createdDate = parseISO(parlay.created_at);
      const now = new Date();
      let cutoff: Date;
      if (dateRange === '7d') cutoff = subDays(now, 7);
      else cutoff = subDays(now, 30); // 30d
      if (createdDate < cutoff) return false;
    }
    return true;
  });

  // Sort by most recent first
  const sortedHistory = [...filteredHistory].sort(
    (a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );

  // Calculate summary statistics
  const totalBets = sortedHistory.length;
  const totalStake = sortedHistory.reduce((sum, p) => sum + p.stake, 0);
  const totalProfitLoss = sortedHistory.reduce((sum, p) => sum + (p.profit_loss || 0), 0);
  const wins = sortedHistory.filter((p) => p.result === 'win').length;
  const losses = sortedHistory.filter((p) => p.result === 'loss').length;
  const pushes = sortedHistory.filter((p) => p.result === 'push').length;
  const winRate = totalBets - pushes > 0 ? (wins / (totalBets - pushes)) * 100 : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <HistoryIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Parlay History
          </Typography>
          <Tooltip title="View your past parlay bets and performance">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Refresh history">
          <IconButton onClick={() => refetch()} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Sport Selection Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={sportTab}
          onChange={handleSportTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="sport history tabs"
          sx={{ px: 2 }}
        >
          <Tab icon={<HistoryIcon />} label="All Sports" iconPosition="start" />
          <Tab icon={<BasketballIcon />} label="NBA" iconPosition="start" />
          <Tab icon={<FootballIcon />} label="NFL" iconPosition="start" />
          <Tab icon={<BaseballIcon />} label="MLB" iconPosition="start" />
          <Tab icon={<HockeyIcon />} label="NHL" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Filter and Stats Bar */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label="All Results"
              onClick={() => setResultFilter('all')}
              color={resultFilter === 'all' ? 'primary' : 'default'}
              variant={resultFilter === 'all' ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<WinIcon />}
              label="Wins"
              onClick={() => setResultFilter('win')}
              color={resultFilter === 'win' ? 'success' : 'default'}
              variant={resultFilter === 'win' ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<LossIcon />}
              label="Losses"
              onClick={() => setResultFilter('loss')}
              color={resultFilter === 'loss' ? 'error' : 'default'}
              variant={resultFilter === 'loss' ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<PushIcon />}
              label="Pushes"
              onClick={() => setResultFilter('push')}
              color={resultFilter === 'push' ? 'info' : 'default'}
              variant={resultFilter === 'push' ? 'filled' : 'outlined'}
            />
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Chip
              label="Last 7 days"
              onClick={() => setDateRange('7d')}
              color={dateRange === '7d' ? 'primary' : 'default'}
              variant={dateRange === '7d' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Last 30 days"
              onClick={() => setDateRange('30d')}
              color={dateRange === '30d' ? 'primary' : 'default'}
              variant={dateRange === '30d' ? 'filled' : 'outlined'}
            />
            <Chip
              label="All time"
              onClick={() => setDateRange('all')}
              color={dateRange === 'all' ? 'primary' : 'default'}
              variant={dateRange === 'all' ? 'filled' : 'outlined'}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Total Profit/Loss
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: totalProfitLoss >= 0 ? theme.palette.success.main : theme.palette.error.main }}
                >
                  {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Win Rate
                </Typography>
                <Typography variant="h6">
                  {winRate.toFixed(1)}% ({wins}-{losses}-{pushes})
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* History Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load parlay history. Showing mock data.
        </Alert>
      ) : null}

      {sortedHistory.length === 0 ? (
        <Alert severity="info">No parlay history found for the selected filters.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Parlay</TableCell>
                <TableCell>Sport</TableCell>
                <TableCell>Legs</TableCell>
                <TableCell align="right">Odds</TableCell>
                <TableCell align="right">Stake</TableCell>
                <TableCell align="right">Payout</TableCell>
                <TableCell align="right">Profit/Loss</TableCell>
                <TableCell align="center">Result</TableCell>
                <TableCell align="center">Confidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedHistory.map((parlay) => (
                <TableRow key={parlay.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {format(parseISO(parlay.created_at), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(parseISO(parlay.created_at), 'hh:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {parlay.name}
                    </Typography>
                    <Box sx={{ maxWidth: 250 }}>
                      {parlay.legs.slice(0, 2).map((leg) => (
                        <Typography key={leg.id} variant="caption" display="block" color="text.secondary" noWrap>
                          {leg.description} ({formatOdds(leg.odds)})
                          {leg.result === 'win' && (
                            <WinIcon fontSize="inherit" sx={{ ml: 0.5, color: theme.palette.success.main }} />
                          )}
                          {leg.result === 'loss' && (
                            <LossIcon fontSize="inherit" sx={{ ml: 0.5, color: theme.palette.error.main }} />
                          )}
                        </Typography>
                      ))}
                      {parlay.legs.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{parlay.legs.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.grey[200], mr: 1 }}>
                        <SportIcon sport={parlay.sport} />
                      </Avatar>
                      {parlay.sport}
                    </Box>
                  </TableCell>
                  <TableCell align="center">{parlay.legs.length}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={formatOdds(parlay.total_odds)}
                      size="small"
                      variant="outlined"
                      color={parlay.result === 'win' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(parlay.stake)}</TableCell>
                  <TableCell align="right">{formatCurrency(parlay.payout)}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          parlay.profit_loss && parlay.profit_loss > 0
                            ? theme.palette.success.main
                            : parlay.profit_loss && parlay.profit_loss < 0
                            ? theme.palette.error.main
                            : 'text.primary',
                        fontWeight: 'medium',
                      }}
                    >
                      {parlay.profit_loss && parlay.profit_loss > 0 ? '+' : ''}
                      {formatCurrency(parlay.profit_loss)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <ResultChip result={parlay.result} />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" alignItems="center" justifyContent="center">
                      <LinearProgress
                        variant="determinate"
                        value={parlay.confidence}
                        sx={{
                          width: 50,
                          height: 6,
                          borderRadius: 3,
                          mr: 1,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor:
                              parlay.confidence >= 80
                                ? theme.palette.success.main
                                : parlay.confidence >= 65
                                ? theme.palette.warning.main
                                : theme.palette.error.main,
                          },
                        }}
                      />
                      <Typography variant="caption">{parlay.confidence}%</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Footer Disclaimer */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Historical performance does not guarantee future results. All data is for informational purposes only.
        {!history.some((p) => p.is_real_data) && ' Currently showing demo data.'}
      </Typography>
    </Container>
  );
};

export default ParlayHistoryScreen;
