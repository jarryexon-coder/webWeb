// pages/SameGameParlayScreen.tsx

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
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Casino as ParlayIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

// ==============================
// Configuration & Types
// ==============================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://python-api-fresh-production.up.railway.app';

export interface ParlayLeg {
  id: string;
  description: string;
  odds: string;
  confidence: number;
  sport: string;
  market: string;
  player_name?: string;
  stat_type?: string;
  line?: number;
  value_side?: string;
  teams?: { home: string; away: string };
  confidence_level: 'high' | 'medium' | 'low' | 'very-high' | 'very-low';
}

export interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ParlayLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: string;
  analysis: string;
  expected_value: string;
  risk_level: string;
  ai_metrics?: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge?: number;
  };
  timestamp: string;
  isToday?: boolean;
  is_real_data?: boolean;
}

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sport_title: string;
}

// ==============================
// Mock Data (fallback)
// ==============================

const MOCK_PARLAY_SUGGESTIONS: ParlaySuggestion[] = [
  {
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
    confidence: 78,
    confidence_level: 'medium',
    analysis: 'Three-star players with favorable matchups tonight. All have cleared these lines in 4 of last 5 games.',
    expected_value: '+7.2%',
    risk_level: 'medium',
    ai_metrics: {
      leg_count: 3,
      avg_leg_confidence: 78,
      recommended_stake: '$5.50',
      edge: 0.072,
    },
    timestamp: new Date().toISOString(),
    isToday: true,
    is_real_data: false,
  },
  {
    id: 'parlay-2',
    name: 'NBA Game Totals Parlay',
    sport: 'NBA',
    type: 'game_totals',
    market_type: 'totals',
    legs: [
      {
        id: 'leg-2-1',
        description: 'Lakers vs Warriors Over 225.5',
        odds: '-110',
        confidence: 72,
        sport: 'NBA',
        market: 'totals',
        teams: { home: 'Warriors', away: 'Lakers' },
        line: 225.5,
        value_side: 'over',
        confidence_level: 'medium',
      },
      {
        id: 'leg-2-2',
        description: 'Celtics vs Heat Under 218.5',
        odds: '-115',
        confidence: 68,
        sport: 'NBA',
        market: 'totals',
        teams: { home: 'Heat', away: 'Celtics' },
        line: 218.5,
        value_side: 'under',
        confidence_level: 'medium',
      },
    ],
    total_odds: '+245',
    confidence: 70,
    confidence_level: 'medium',
    analysis: 'Both games feature fast-paced offenses. Historical trends support these totals.',
    expected_value: '+5.8%',
    risk_level: 'medium',
    ai_metrics: {
      leg_count: 2,
      avg_leg_confidence: 70,
      recommended_stake: '$6.00',
      edge: 0.058,
    },
    timestamp: new Date().toISOString(),
    isToday: true,
    is_real_data: false,
  },
  {
    id: 'parlay-3',
    name: 'NFL Moneyline Parlay',
    sport: 'NFL',
    type: 'moneyline',
    market_type: 'h2h',
    legs: [
      {
        id: 'leg-3-1',
        description: 'Kansas City Chiefs ML',
        odds: '-170',
        confidence: 85,
        sport: 'NFL',
        market: 'h2h',
        teams: { home: 'Chiefs', away: 'Ravens' },
        confidence_level: 'high',
      },
      {
        id: 'leg-3-2',
        description: 'San Francisco 49ers ML',
        odds: '-150',
        confidence: 82,
        sport: 'NFL',
        market: 'h2h',
        teams: { home: '49ers', away: 'Lions' },
        confidence_level: 'high',
      },
    ],
    total_odds: '+185',
    confidence: 83,
    confidence_level: 'high',
    analysis: 'Both favorites are at home and have dominated opponents in similar matchups.',
    expected_value: '+9.5%',
    risk_level: 'low',
    ai_metrics: {
      leg_count: 2,
      avg_leg_confidence: 83,
      recommended_stake: '$8.50',
      edge: 0.095,
    },
    timestamp: new Date().toISOString(),
    isToday: false,
    is_real_data: false,
  },
];

const MOCK_GAMES: Game[] = [
  {
    id: 'game-1',
    home_team: 'Los Angeles Lakers',
    away_team: 'Golden State Warriors',
    commence_time: new Date(Date.now() + 3 * 3600000).toISOString(),
    sport_title: 'NBA',
  },
  {
    id: 'game-2',
    home_team: 'Boston Celtics',
    away_team: 'Miami Heat',
    commence_time: new Date(Date.now() + 5 * 3600000).toISOString(),
    sport_title: 'NBA',
  },
];

// ==============================
// API Hooks
// ==============================

const fetchParlaySuggestions = async (sport: string = 'all'): Promise<ParlaySuggestion[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/parlay/suggestions`, {
      params: { sport, limit: 6 },
    });
    return response.data.suggestions || [];
  } catch (error) {
    console.warn('Failed to fetch parlay suggestions, using mock data', error);
    return MOCK_PARLAY_SUGGESTIONS;
  }
};

const fetchGames = async (sport: string = 'basketball_nba'): Promise<Game[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/odds/games`, {
      params: { sport, regions: 'us' },
    });
    return response.data.games || [];
  } catch (error) {
    console.warn('Failed to fetch games, using mock data', error);
    return MOCK_GAMES;
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
      id={`parlay-tabpanel-${index}`}
      aria-labelledby={`parlay-tab-${index}`}
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
      return <ParlayIcon />;
  }
};

const getConfidenceColor = (level: string): 'success' | 'warning' | 'error' | 'info' => {
  switch (level) {
    case 'very-high':
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
    case 'very-low':
      return 'error';
    default:
      return 'info';
  }
};

const ParlayCard: React.FC<{ parlay: ParlaySuggestion }> = ({ parlay }) => {
  const theme = useTheme();
  const confidenceColor = getConfidenceColor(parlay.confidence_level);

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32, mr: 1 }}>
              <SportIcon sport={parlay.sport} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight="bold">
              {parlay.name}
            </Typography>
          </Box>
          <Chip
            label={`${parlay.total_odds}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {parlay.legs.slice(0, 3).map((leg, idx) => (
            <Box key={leg.id}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight="medium">
                  {leg.description}
                </Typography>
                <Chip label={leg.odds} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </Box>
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
              {idx < parlay.legs.length - 1 && idx < 2 && (
                <Divider sx={{ my: 1 }} />
              )}
            </Box>
          ))}
          {parlay.legs.length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{parlay.legs.length - 3} more leg{parlay.legs.length - 3 > 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>

        <Typography variant="body2" color="text.secondary" paragraph>
          {parlay.analysis}
        </Typography>

        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
          <Chip
            label={`EV: ${parlay.expected_value}`}
            size="small"
            variant="outlined"
            color="info"
          />
          <Chip
            label={`Risk: ${parlay.risk_level}`}
            size="small"
            variant="outlined"
            color={parlay.risk_level === 'low' ? 'success' : parlay.risk_level === 'medium' ? 'warning' : 'error'}
          />
          {parlay.ai_metrics?.recommended_stake && (
            <Chip
              label={`Stake: ${parlay.ai_metrics.recommended_stake}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 28 }}
        >
          Add to Slip
        </Button>
      </CardActions>
    </Card>
  );
};

// ==============================
// Main Component
// ==============================

const SameGameParlayScreen: React.FC = () => {
  const theme = useTheme();
  const [sportTab, setSportTab] = useState(0);
  const [strategyTab, setStrategyTab] = useState(0);

  // Data fetching
  const {
    data: suggestions = MOCK_PARLAY_SUGGESTIONS,
    isLoading: suggestionsLoading,
    error: suggestionsError,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ['parlay-suggestions', sportTab],
    queryFn: () => {
      const sportMap = ['all', 'nba', 'nfl', 'mlb', 'nhl'];
      return fetchParlaySuggestions(sportMap[sportTab] || 'all');
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const {
    data: games = MOCK_GAMES,
    isLoading: gamesLoading,
  } = useQuery({
    queryKey: ['games', 'nba'],
    queryFn: () => fetchGames('basketball_nba'),
    staleTime: 5 * 60 * 1000,
  });

  const handleSportTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSportTab(newValue);
  };

  const handleStrategyTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStrategyTab(newValue);
  };

  // Filter suggestions by strategy type based on strategyTab
  const filteredByStrategy = suggestions.filter((s) => {
    if (strategyTab === 0) return true; // All
    if (strategyTab === 1) return s.type === 'player_props';
    if (strategyTab === 2) return s.type === 'game_totals';
    if (strategyTab === 3) return s.type === 'moneyline';
    if (strategyTab === 4) return s.type === 'mixed';
    return true;
  });

  // Separate "Today" vs "Upcoming"
  const todaySuggestions = filteredByStrategy.filter((s) => s.isToday);
  const upcomingSuggestions = filteredByStrategy.filter((s) => !s.isToday);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <ParlayIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Same-Game Parlays
          </Typography>
          <Tooltip title="Combine multiple bets from the same game for higher payouts">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Refresh suggestions">
          <IconButton onClick={() => refetchSuggestions()} color="primary">
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
          aria-label="sport selection tabs"
          sx={{ px: 2 }}
        >
          <Tab icon={<ParlayIcon />} label="All Sports" iconPosition="start" />
          <Tab icon={<BasketballIcon />} label="NBA" iconPosition="start" />
          <Tab icon={<FootballIcon />} label="NFL" iconPosition="start" />
          <Tab icon={<BaseballIcon />} label="MLB" iconPosition="start" />
          <Tab icon={<HockeyIcon />} label="NHL" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Strategy Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={strategyTab}
          onChange={handleStrategyTabChange}
          aria-label="parlay strategy tabs"
        >
          <Tab label="All Strategies" />
          <Tab label="Player Props" />
          <Tab label="Game Totals" />
          <Tab label="Moneyline" />
          <Tab label="Mixed" />
        </Tabs>
      </Box>

      {/* Content */}
      {suggestionsLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : suggestionsError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load parlay suggestions. Showing mock data.
        </Alert>
      ) : null}

      {/* Today's Top Parlays */}
      <Box mb={5}>
        <Typography variant="h6" gutterBottom>
          🔥 Today's Top Same-Game Parlays
        </Typography>
        {todaySuggestions.length === 0 ? (
          <Alert severity="info">No parlays available for today.</Alert>
        ) : (
          <Grid container spacing={3}>
            {todaySuggestions.map((parlay) => (
              <Grid item xs={12} md={6} lg={4} key={parlay.id}>
                <ParlayCard parlay={parlay} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Upcoming Parlays */}
      <Box mb={5}>
        <Typography variant="h6" gutterBottom>
          📅 Upcoming Parlays
        </Typography>
        {upcomingSuggestions.length === 0 ? (
          <Alert severity="info">No upcoming parlays found.</Alert>
        ) : (
          <Grid container spacing={3}>
            {upcomingSuggestions.map((parlay) => (
              <Grid item xs={12} md={6} lg={4} key={parlay.id}>
                <ParlayCard parlay={parlay} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Featured Games Section (for building custom same-game parlays) */}
      <Divider sx={{ my: 4 }} />
      <Box>
        <Typography variant="h6" gutterBottom>
          ⚡ Featured Games – Build Your Own
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select a game below to start building a custom same-game parlay with props, spreads, and totals.
        </Typography>
        {gamesLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Grid container spacing={2}>
            {games.slice(0, 4).map((game) => (
              <Grid item xs={12} sm={6} md={3} key={game.id}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {game.away_team} @ {game.home_team}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                    {format(parseISO(game.commence_time), 'MMM dd, hh:mm a')}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ mt: 1 }}
                    startIcon={<AddIcon />}
                  >
                    Build Parlay
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Footer Disclaimer */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Same-game parlay odds are calculated based on the individual legs. All selections must win for the parlay to payout.
        Data is provided for informational purposes only. Please gamble responsibly.
      </Typography>
    </Container>
  );
};

export default SameGameParlayScreen;
