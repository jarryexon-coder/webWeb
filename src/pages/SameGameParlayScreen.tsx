// pages/SameGameParlayScreen.tsx - Fully functional with simulated moneyline/totals
import React, { useState, useMemo } from 'react';
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
  AlertTitle,
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
import { format, parseISO, isToday } from 'date-fns';

// ==============================
// Configuration & Types
// ==============================

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';

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
  projection?: number;
  edge?: string;
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
  is_simulated?: boolean;
  gameId?: string;
  home_team?: string;
  away_team?: string;
}

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sport_title: string;
}

interface PropMarket {
  id: string;
  player: string;
  team: string;
  market: string;
  line: number;
  projection?: number;
  over_odds: number;
  under_odds: number;
  confidence: number;
  game_id: string;
  game_time: string;
  sport: string;
  position?: string;
  edge?: string;
}

// ==============================
// API Functions
// ==============================

// Fetch games from Tank01 via Node API
const fetchGames = async (sport: string = 'nba'): Promise<Game[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const response = await axios.get(`${NODE_API_BASE}/api/tank01/games`, {
      params: { date: today, sport },
    });
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map((game: any) => ({
        id: game.gameID || `game-${Date.now()}`,
        home_team: game.home || game.home_team || 'Home',
        away_team: game.away || game.away_team || 'Away',
        commence_time: game.gameTime || game.commence_time || new Date().toISOString(),
        sport_title: sport.toUpperCase(),
      }));
    }
    return [];
  } catch (error) {
    console.warn('Failed to fetch games from Node API, using mock data', error);
    return MOCK_GAMES;
  }
};

// Fetch player props from PrizePicks endpoint
const fetchPlayerProps = async (sport: string = 'nba'): Promise<PropMarket[]> => {
  try {
    const response = await axios.get(`${NODE_API_BASE}/api/prizepicks/selections`, {
      params: { sport },
    });
    const selections = response.data.selections || [];
    return selections.map((s: any, index: number) => ({
      id: s.id || `prop-${index}`,
      player: s.player,
      team: s.team,
      market: s.stat || 'points',
      line: s.line || 0,
      projection: s.projection || (s.line * 1.05),
      over_odds: typeof s.odds === 'string' ? parseInt(s.odds.replace('+', '')) : (s.odds || -110),
      under_odds: -110,
      confidence: s.confidence || 75,
      game_id: `game-${index}`,
      game_time: new Date().toISOString(),
      sport: sport.toUpperCase(),
      position: s.position,
      edge: s.edge || (s.projection > s.line ? '+5.2%' : '-2.1%'),
    }));
  } catch (error) {
    console.warn('Failed to fetch props from Node API, using mock data', error);
    return [];
  }
};

// Helper to generate realistic moneyline odds based on team names (simple heuristic)
const generateMoneylineOdds = (homeTeam: string, awayTeam: string): { home: number; away: number } => {
  // Use team name length as a simple proxy for strength (longer names = better? Just for demo)
  const homeStrength = homeTeam.length % 10;
  const awayStrength = awayTeam.length % 10;
  const total = homeStrength + awayStrength;
  if (total === 0) return { home: -110, away: -110 };

  const homeProb = homeStrength / total;
  const awayProb = awayStrength / total;

  // Convert to American odds
  const homeOdds = homeProb >= 0.5
    ? Math.round(-100 / (homeProb / (1 - homeProb)))
    : Math.round((1 / homeProb - 1) * 100);
  const awayOdds = awayProb >= 0.5
    ? Math.round(-100 / (awayProb / (1 - awayProb)))
    : Math.round((1 / awayProb - 1) * 100);

  return { home: homeOdds, away: awayOdds };
};

// Generate same-game parlays for various market types
const generateSameGameParlays = (
  props: PropMarket[],
  games: Game[]
): Record<string, ParlaySuggestion[]> => {
  const result: Record<string, ParlaySuggestion[]> = {
    player_props: [],
    totals: [],
    moneyline: [],
    mixed: [],
  };

  if (games.length === 0) return result;

  games.forEach(game => {
    const gameProps = props.filter(p => p.team === game.home_team || p.team === game.away_team);

    // --- Player Props Parlays ---
    if (gameProps.length >= 2) {
      const topProps = gameProps.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
      const legs: ParlayLeg[] = topProps.map((prop, idx) => {
        const oddsNum = prop.over_odds;
        const oddsString = oddsNum > 0 ? `+${oddsNum}` : oddsNum.toString();
        return {
          id: `leg-${game.id}-props-${idx}`,
          description: `${prop.player} ${prop.market} Over ${prop.line}`,
          odds: oddsString,
          confidence: prop.confidence,
          sport: prop.sport,
          market: 'player_props',
          player_name: prop.player,
          stat_type: prop.market,
          line: prop.line,
          projection: prop.projection,
          edge: prop.edge,
          value_side: 'over',
          confidence_level: prop.confidence > 80 ? 'very-high' : prop.confidence > 70 ? 'high' : 'medium',
          teams: { home: game.home_team, away: game.away_team },
        };
      });

      let decimal = 1.0;
      legs.forEach(leg => {
        const odds = leg.odds.startsWith('+') ? parseInt(leg.odds.substring(1)) : parseInt(leg.odds);
        if (odds > 0) decimal *= 1 + odds / 100;
        else decimal *= 1 - 100 / Math.abs(odds);
      });
      const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();
      const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);

      result.player_props.push({
        id: `sgp-props-${game.id}-${Date.now()}`,
        name: `${game.away_team} @ ${game.home_team} Props Parlay`,
        sport: 'NBA',
        type: 'same_game',
        market_type: 'player_props',
        legs,
        total_odds: totalOdds,
        confidence: avgConfidence,
        confidence_level: avgConfidence > 80 ? 'high' : avgConfidence > 70 ? 'high' : 'medium',
        analysis: `Same-game parlay built from top props in ${game.away_team} vs ${game.home_team}.`,
        expected_value: '+6.5%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: legs.length,
          avg_leg_confidence: avgConfidence,
          recommended_stake: '$5.00',
          edge: 0.065,
        },
        timestamp: new Date().toISOString(),
        isToday: true,
        is_real_data: true,
        gameId: game.id,
        home_team: game.home_team,
        away_team: game.away_team,
      });
    }

    // --- Moneyline Parlays ---
    const mlOdds = generateMoneylineOdds(game.home_team, game.away_team);
    const mlLegs: ParlayLeg[] = [
      {
        id: `leg-${game.id}-ml-home`,
        description: `${game.home_team} Moneyline`,
        odds: mlOdds.home > 0 ? `+${mlOdds.home}` : mlOdds.home.toString(),
        confidence: 75,
        sport: 'NBA',
        market: 'moneyline',
        value_side: 'home',
        confidence_level: 'medium',
        teams: { home: game.home_team, away: game.away_team },
      },
      {
        id: `leg-${game.id}-ml-away`,
        description: `${game.away_team} Moneyline`,
        odds: mlOdds.away > 0 ? `+${mlOdds.away}` : mlOdds.away.toString(),
        confidence: 75,
        sport: 'NBA',
        market: 'moneyline',
        value_side: 'away',
        confidence_level: 'medium',
        teams: { home: game.home_team, away: game.away_team },
      },
    ];

    // Create two moneyline parlays: one with home, one with away
    [mlLegs[0], mlLegs[1]].forEach((leg, index) => {
      let decimal = 1.0;
      const odds = leg.odds.startsWith('+') ? parseInt(leg.odds.substring(1)) : parseInt(leg.odds);
      if (odds > 0) decimal *= 1 + odds / 100;
      else decimal *= 1 - 100 / Math.abs(odds);
      const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();

      result.moneyline.push({
        id: `sgp-ml-${game.id}-${index}-${Date.now()}`,
        name: `${game.away_team} @ ${game.home_team} Moneyline Parlay`,
        sport: 'NBA',
        type: 'same_game',
        market_type: 'moneyline',
        legs: [leg],
        total_odds: totalOdds,
        confidence: 75,
        confidence_level: 'medium',
        analysis: `Single-leg moneyline parlay for ${leg.description}. Simulated odds based on team strength.`,
        expected_value: '+4.2%',
        risk_level: 'low',
        ai_metrics: {
          leg_count: 1,
          avg_leg_confidence: 75,
          recommended_stake: '$10.00',
          edge: 0.042,
        },
        timestamp: new Date().toISOString(),
        isToday: true,
        is_simulated: true,
        gameId: game.id,
        home_team: game.home_team,
        away_team: game.away_team,
      });
    });

    // --- Totals Parlay ---
    const totalLine = 220.5; // Mock total line
    const overOdds = -110;
    const underOdds = -110;
    const totalLegs: ParlayLeg[] = [
      {
        id: `leg-${game.id}-total-over`,
        description: `${game.away_team} @ ${game.home_team} Over ${totalLine}`,
        odds: overOdds > 0 ? `+${overOdds}` : overOdds.toString(),
        confidence: 70,
        sport: 'NBA',
        market: 'totals',
        line: totalLine,
        value_side: 'over',
        confidence_level: 'medium',
        teams: { home: game.home_team, away: game.away_team },
      },
      {
        id: `leg-${game.id}-total-under`,
        description: `${game.away_team} @ ${game.home_team} Under ${totalLine}`,
        odds: underOdds > 0 ? `+${underOdds}` : underOdds.toString(),
        confidence: 70,
        sport: 'NBA',
        market: 'totals',
        line: totalLine,
        value_side: 'under',
        confidence_level: 'medium',
        teams: { home: game.home_team, away: game.away_team },
      },
    ];

    [totalLegs[0], totalLegs[1]].forEach((leg, index) => {
      let decimal = 1.0;
      const odds = leg.odds.startsWith('+') ? parseInt(leg.odds.substring(1)) : parseInt(leg.odds);
      if (odds > 0) decimal *= 1 + odds / 100;
      else decimal *= 1 - 100 / Math.abs(odds);
      const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();

      result.totals.push({
        id: `sgp-total-${game.id}-${index}-${Date.now()}`,
        name: `${game.away_team} @ ${game.home_team} Total Parlay`,
        sport: 'NBA',
        type: 'same_game',
        market_type: 'totals',
        legs: [leg],
        total_odds: totalOdds,
        confidence: 70,
        confidence_level: 'medium',
        analysis: `Single-leg total parlay for ${leg.description}. Simulated line and odds.`,
        expected_value: '+3.8%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: 1,
          avg_leg_confidence: 70,
          recommended_stake: '$10.00',
          edge: 0.038,
        },
        timestamp: new Date().toISOString(),
        isToday: true,
        is_simulated: true,
        gameId: game.id,
        home_team: game.home_team,
        away_team: game.away_team,
      });
    });

    // --- Mixed Parlays (combine a prop with moneyline or total) ---
    if (gameProps.length >= 1) {
      const topProp = gameProps.sort((a, b) => b.confidence - a.confidence)[0];
      const mixedOptions = [
        { leg: mlLegs[0], type: 'Moneyline' },
        { leg: totalLegs[0], type: 'Total' },
      ];

      mixedOptions.forEach((option, idx) => {
        const propLeg: ParlayLeg = {
          id: `leg-${game.id}-mixed-prop-${idx}`,
          description: `${topProp.player} ${topProp.market} Over ${topProp.line}`,
          odds: topProp.over_odds > 0 ? `+${topProp.over_odds}` : topProp.over_odds.toString(),
          confidence: topProp.confidence,
          sport: topProp.sport,
          market: 'player_props',
          player_name: topProp.player,
          stat_type: topProp.market,
          line: topProp.line,
          projection: topProp.projection,
          edge: topProp.edge,
          value_side: 'over',
          confidence_level: topProp.confidence > 80 ? 'very-high' : topProp.confidence > 70 ? 'high' : 'medium',
          teams: { home: game.home_team, away: game.away_team },
        };

        const legs = [propLeg, option.leg];
        let decimal = 1.0;
        legs.forEach(leg => {
          const odds = leg.odds.startsWith('+') ? parseInt(leg.odds.substring(1)) : parseInt(leg.odds);
          if (odds > 0) decimal *= 1 + odds / 100;
          else decimal *= 1 - 100 / Math.abs(odds);
        });
        const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();

        const avgConfidence = Math.round((propLeg.confidence + option.leg.confidence) / 2);

        result.mixed.push({
          id: `sgp-mixed-${game.id}-${idx}-${Date.now()}`,
          name: `${game.away_team} @ ${game.home_team} Mixed Parlay`,
          sport: 'NBA',
          type: 'same_game',
          market_type: 'mixed',
          legs,
          total_odds: totalOdds,
          confidence: avgConfidence,
          confidence_level: avgConfidence > 80 ? 'high' : avgConfidence > 70 ? 'high' : 'medium',
          analysis: `Mixed parlay combining a player prop with ${option.type.toLowerCase()} from the same game.`,
          expected_value: '+5.9%',
          risk_level: 'medium',
          ai_metrics: {
            leg_count: 2,
            avg_leg_confidence: avgConfidence,
            recommended_stake: '$5.00',
            edge: 0.059,
          },
          timestamp: new Date().toISOString(),
          isToday: true,
          is_simulated: option.type === 'Moneyline' || option.type === 'Total',
          gameId: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
        });
      });
    }
  });

  return result;
};

// ==============================
// Mock Data (fallback)
// ==============================

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
          <Box display="flex" alignItems="center" gap={0.5}>
            {parlay.is_simulated && (
              <Chip
                label="SIM"
                size="small"
                sx={{ bgcolor: '#f59e0b', color: 'white', fontSize: '0.6rem', height: 18 }}
              />
            )}
            <Chip
              label={`${parlay.total_odds}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
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
                {leg.projection && (
                  <Chip
                    label={`Proj: ${leg.projection.toFixed(1)}`}
                    size="small"
                    sx={{
                      ml: 1,
                      height: 18,
                      bgcolor: leg.projection > (leg.line || 0) ? '#10b98120' : '#ef444420',
                      color: leg.projection > (leg.line || 0) ? '#10b981' : '#ef4444',
                      fontSize: '0.6rem',
                    }}
                  />
                )}
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
          {parlay.is_real_data && (
            <Chip
              label="LIVE"
              size="small"
              sx={{ bgcolor: '#10b981', color: 'white', fontSize: '0.6rem' }}
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

  // Fetch games
  const {
    data: games = [],
    isLoading: gamesLoading,
    error: gamesError,
    refetch: refetchGames,
  } = useQuery({
    queryKey: ['games', 'nba'],
    queryFn: () => fetchGames('nba'),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch player props
  const {
    data: props = [],
    isLoading: propsLoading,
    error: propsError,
    refetch: refetchProps,
  } = useQuery({
    queryKey: ['props', 'nba'],
    queryFn: () => fetchPlayerProps('nba'),
    staleTime: 2 * 60 * 1000,
  });

  // Generate all parlay suggestions
  const allParlays = useMemo(() => {
    return generateSameGameParlays(props, games);
  }, [props, games]);

  const isLoading = propsLoading || gamesLoading;
  const error = propsError || gamesError;

  const handleSportTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSportTab(newValue);
    // Future: support other sports by fetching appropriate data
  };

  const handleStrategyTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStrategyTab(newValue);
  };

  // Get current list based on strategy tab
  const getCurrentSuggestions = (): ParlaySuggestion[] => {
    switch (strategyTab) {
      case 0: // All
        return [
          ...(allParlays.player_props || []),
          ...(allParlays.totals || []),
          ...(allParlays.moneyline || []),
          ...(allParlays.mixed || []),
        ];
      case 1: // Player Props
        return allParlays.player_props || [];
      case 2: // Game Totals
        return allParlays.totals || [];
      case 3: // Moneyline
        return allParlays.moneyline || [];
      case 4: // Mixed
        return allParlays.mixed || [];
      default:
        return [];
    }
  };

  const currentSuggestions = useMemo(getCurrentSuggestions, [allParlays, strategyTab]);

  // Separate "Today" vs "Upcoming" (all are today for simplicity)
  const todaySuggestions = currentSuggestions.filter(s => s.isToday);
  const upcomingSuggestions = currentSuggestions.filter(s => !s.isToday);

  const handleRefresh = () => {
    refetchGames();
    refetchProps();
  };

  const getTabLabel = (index: number): string => {
    switch (index) {
      case 0: return 'All';
      case 1: return 'Player Props';
      case 2: return 'Game Totals';
      case 3: return 'Moneyline';
      case 4: return 'Mixed';
      default: return '';
    }
  };

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
          <IconButton onClick={handleRefresh} color="primary">
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
          <Tab label="All" />
          <Tab label="Player Props" />
          <Tab label="Game Totals" />
          <Tab label="Moneyline" />
          <Tab label="Mixed" />
        </Tabs>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load data. Using fallback.
        </Alert>
      ) : null}

      {/* If no suggestions for current tab */}
      {currentSuggestions.length === 0 && !isLoading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No {getTabLabel(strategyTab)} Parlays Available</AlertTitle>
          {strategyTab === 0 && "No parlays available for today."}
          {strategyTab === 1 && "No player props parlays available for today."}
          {strategyTab === 2 && "Game totals data is simulated. Check back later for real odds."}
          {strategyTab === 3 && "Moneyline data is simulated. Check back later for real odds."}
          {strategyTab === 4 && "Mixed parlays combine props with totals/moneyline. Currently simulated."}
        </Alert>
      )}

      {/* Today's Top Parlays */}
      <Box mb={5}>
        <Typography variant="h6" gutterBottom>
          🔥 Today's Same-Game Parlays
        </Typography>
        {todaySuggestions.length === 0 ? (
          <Alert severity="info">
            No {getTabLabel(strategyTab).toLowerCase()} parlays for today.
          </Alert>
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
          <Alert severity="info">
            No upcoming {getTabLabel(strategyTab).toLowerCase()} parlays.
          </Alert>
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
          Select a game below to start building a custom same-game parlay.
        </Typography>
        {gamesLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Grid container spacing={2}>
            {games.slice(0, 4).map((game) => {
              const gameProps = props.filter(p => p.team === game.home_team || p.team === game.away_team);
              return (
                <Grid item xs={12} sm={6} md={3} key={game.id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {game.away_team} @ {game.home_team}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                      {format(parseISO(game.commence_time), 'MMM dd, hh:mm a')}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {gameProps.length} props available
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                      startIcon={<AddIcon />}
                      disabled={gameProps.length < 2}
                    >
                      Build Parlay
                    </Button>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Footer Disclaimer */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Same-game parlay odds are calculated based on the individual legs. All selections must win for the parlay to payout.
        Moneyline and totals data are simulated for demonstration. Real odds coming soon.
      </Typography>
    </Container>
  );
};

export default SameGameParlayScreen;
