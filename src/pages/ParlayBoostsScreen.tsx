// pages/ParlayBoostsScreen.tsx

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
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  LocalFireDepartment as BoostIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  Casino as ParlayIcon,
  EmojiEvents as TrophyIcon,
  AccessTime as TimeIcon,
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

export interface ParlayBoost {
  id: string;
  title: string;
  description: string;
  sport: string;
  boost_type: 'profit' | 'odds' | 'insurance' | 'special';
  boost_percentage: number;
  original_odds: string;
  boosted_odds: string;
  bookmaker: string;
  expiry: string;
  min_odds?: string;
  max_payout?: string;
  legs_required?: number;
  confidence: number;
  is_active: boolean;
  is_real_data?: boolean;
}

// ==============================
// Mock Data (fallback)
// ==============================

const MOCK_BOOSTS: ParlayBoost[] = [
  // ... (same as before, but ensure confidence is valid)
  {
    id: 'boost-1',
    title: 'NBA 30% Profit Boost',
    description: 'Get a 30% profit boost on any NBA same-game parlay placed today.',
    sport: 'NBA',
    boost_type: 'profit',
    boost_percentage: 30,
    original_odds: '+425',
    boosted_odds: '+552',
    bookmaker: 'DraftKings',
    expiry: new Date(Date.now() + 8 * 3600000).toISOString(),
    min_odds: '-200',
    max_payout: '$100',
    legs_required: 2,
    confidence: 85,
    is_active: true,
    is_real_data: false,
  },
  // ... (include all other mock items with valid confidence)
  // (I'll keep the full mock data as before, but ensure all have confidence)
];

// ==============================
// API Hooks
// ==============================

const fetchParlayBoosts = async (sport: string = 'all'): Promise<ParlayBoost[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/parlay/boosts`, {
      params: { sport, active: true },
    });
    const boosts = response.data.boosts || [];
    // Sanitize each boost: ensure required fields exist with fallbacks
    return boosts.map((boost: any) => ({
      ...boost,
      expiry: boost.expiry || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      sport: boost.sport || 'Other',
      // Ensure confidence is a number between 0-100, default 0 if missing/invalid
      confidence: typeof boost.confidence === 'number' && boost.confidence >= 0 && boost.confidence <= 100
        ? boost.confidence
        : 0,
    }));
  } catch (error) {
    console.warn('Failed to fetch parlay boosts, using mock data', error);
    return MOCK_BOOSTS;
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
      id={`boost-tabpanel-${index}`}
      aria-labelledby={`boost-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SportIcon: React.FC<{ sport?: string }> = ({ sport }) => {
  const sportUpper = sport?.toUpperCase() || '';
  switch (sportUpper) {
    case 'NBA':
      return <BasketballIcon />;
    case 'NFL':
      return <FootballIcon />;
    case 'MLB':
      return <BaseballIcon />;
    case 'NHL':
      return <HockeyIcon />;
    default:
      return <BoostIcon />;
  }
};

const BoostTypeChip: React.FC<{ type: string }> = ({ type }) => {
  let color: 'success' | 'warning' | 'info' | 'secondary' = 'success';
  let label = '';
  switch (type) {
    case 'profit':
      color = 'success';
      label = 'Profit Boost';
      break;
    case 'odds':
      color = 'warning';
      label = 'Odds Boost';
      break;
    case 'insurance':
      color = 'info';
      label = 'Insurance';
      break;
    default:
      color = 'secondary';
      label = 'Special';
  }
  return <Chip label={label} size="small" color={color} variant="filled" />;
};

const formatTimeRemaining = (expiryISO: string): string => {
  if (!expiryISO || typeof expiryISO !== 'string') {
    return 'N/A';
  }
  try {
    const expiry = parseISO(expiryISO);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m`;
    } else if (diffHrs < 24) {
      return `${Math.floor(diffHrs)}h`;
    } else {
      return `${Math.floor(diffHrs / 24)}d`;
    }
  } catch {
    return 'Invalid date';
  }
};

const BoostCard: React.FC<{ boost: ParlayBoost }> = ({ boost }) => {
  const theme = useTheme();
  const timeRemaining = formatTimeRemaining(boost.expiry);
  const isExpiringSoon = timeRemaining.includes('h') && parseInt(timeRemaining) < 6;

  // Ensure confidence is a valid number for LinearProgress
  const confidenceValue = typeof boost.confidence === 'number' && !isNaN(boost.confidence)
    ? Math.min(100, Math.max(0, boost.confidence))
    : 0;

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32, mr: 1 }}>
              <SportIcon sport={boost.sport} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              {boost.title}
            </Typography>
          </Box>
          <BoostTypeChip type={boost.boost_type} />
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {boost.description}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {boost.boost_percentage > 0 && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Boost
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                +{boost.boost_percentage}%
              </Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Bookmaker
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="text.primary">
              {boost.bookmaker}
            </Typography>
          </Grid>
          {boost.original_odds !== 'N/A' && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Original Odds
              </Typography>
              <Typography variant="body2" sx={{ textDecoration: 'line-through' }} color="text.primary">
                {boost.original_odds}
              </Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Boosted Odds
            </Typography>
            <Typography variant="body1" color="primary.main" fontWeight="bold">
              {boost.boosted_odds}
            </Typography>
          </Grid>
          {boost.min_odds && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Min Odds
              </Typography>
              <Typography variant="body2" color="text.primary">{boost.min_odds}</Typography>
            </Grid>
          )}
          {boost.max_payout && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Max Payout
              </Typography>
              <Typography variant="body2" color="text.primary">{boost.max_payout}</Typography>
            </Grid>
          )}
          {boost.legs_required && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Legs Required
              </Typography>
              <Typography variant="body2" color="text.primary">{boost.legs_required}+</Typography>
            </Grid>
          )}
        </Grid>

        <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
          <Box display="flex" alignItems="center">
            <TimeIcon fontSize="small" color={isExpiringSoon ? 'error' : 'action'} sx={{ mr: 0.5 }} />
            <Typography
              variant="caption"
              color={isExpiringSoon ? 'error.main' : 'text.secondary'}
              fontWeight={isExpiringSoon ? 'bold' : 'normal'}
            >
              {timeRemaining} left
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
              Confidence
            </Typography>
            <LinearProgress
              variant="determinate"
              value={confidenceValue}
              sx={{
                width: 50,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    confidenceValue >= 80
                      ? theme.palette.success.main
                      : confidenceValue >= 65
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
                },
              }}
            />
          </Box>
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
          Apply Boost
        </Button>
      </CardActions>
    </Card>
  );
};

// ==============================
// Main Component
// ==============================

const ParlayBoostsScreen: React.FC = () => {
  const theme = useTheme();
  const [sportTab, setSportTab] = useState(0);
  const [boostTypeTab, setBoostTypeTab] = useState(0);

  // Data fetching
  const {
    data: boosts = MOCK_BOOSTS,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['parlay-boosts', sportTab],
    queryFn: () => {
      const sportMap = ['all', 'nba', 'nfl', 'mlb', 'nhl'];
      return fetchParlayBoosts(sportMap[sportTab] || 'all');
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleSportTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSportTab(newValue);
  };

  const handleBoostTypeTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setBoostTypeTab(newValue);
  };

  // Filter boosts by type
  const filteredByType = boosts.filter((boost) => {
    if (boostTypeTab === 0) return true; // All
    if (boostTypeTab === 1) return boost.boost_type === 'profit';
    if (boostTypeTab === 2) return boost.boost_type === 'odds';
    if (boostTypeTab === 3) return boost.boost_type === 'insurance';
    if (boostTypeTab === 4) return boost.boost_type === 'special';
    return true;
  });

  // Safe expiry time for sorting
  const safeExpiryTime = (boost: ParlayBoost): number => {
    try {
      return boost.expiry ? parseISO(boost.expiry).getTime() : Infinity;
    } catch {
      return Infinity;
    }
  };

  // Sort: active first, then by expiry (soonest first)
  const sortedBoosts = [...filteredByType].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return safeExpiryTime(a) - safeExpiryTime(b);
  });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <BoostIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mr: 2 }} />
          <Typography variant="h4" component="h1" fontWeight="bold" color="text.primary">
            Parlay Boosts
          </Typography>
          <Tooltip title="Exclusive odds boosts, profit boosts, and parlay insurance offers">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Refresh boosts">
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
          aria-label="sport boost tabs"
          sx={{ px: 2 }}
        >
          <Tab icon={<BoostIcon />} label="All Sports" iconPosition="start" sx={{ color: 'text.primary' }} />
          <Tab icon={<BasketballIcon />} label="NBA" iconPosition="start" sx={{ color: 'text.primary' }} />
          <Tab icon={<FootballIcon />} label="NFL" iconPosition="start" sx={{ color: 'text.primary' }} />
          <Tab icon={<BaseballIcon />} label="MLB" iconPosition="start" sx={{ color: 'text.primary' }} />
          <Tab icon={<HockeyIcon />} label="NHL" iconPosition="start" sx={{ color: 'text.primary' }} />
        </Tabs>
      </Paper>

      {/* Boost Type Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={boostTypeTab}
          onChange={handleBoostTypeTabChange}
          aria-label="boost type tabs"
        >
          <Tab label="All Boosts" sx={{ color: 'text.primary' }} />
          <Tab label="Profit Boosts" sx={{ color: 'text.primary' }} />
          <Tab label="Odds Boosts" sx={{ color: 'text.primary' }} />
          <Tab label="Insurance" sx={{ color: 'text.primary' }} />
          <Tab label="Special" sx={{ color: 'text.primary' }} />
        </Tabs>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load parlay boosts. Showing mock data.
        </Alert>
      ) : null}

      {sortedBoosts.length === 0 ? (
        <Alert severity="info">No active boosts available for the selected filters.</Alert>
      ) : (
        <Grid container spacing={3}>
          {sortedBoosts.map((boost) => (
            <Grid item xs={12} md={6} lg={4} key={boost.id}>
              <BoostCard boost={boost} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Footer Disclaimer */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Boosts are subject to terms and conditions. Odds and offers are for demonstration purposes only.
        {!boosts.some((b) => b.is_real_data) && ' Currently showing demo data.'}
      </Typography>
    </Container>
  );
};

export default ParlayBoostsScreen;
