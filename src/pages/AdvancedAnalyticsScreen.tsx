// src/pages/AdvancedAnalyticsScreen.tsx – FINAL with generator limits & two‑menu bars
// (FIXED: getCurrentSportData now takes a sport parameter)

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  CircularProgress,
  Tooltip,
  Divider,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Badge,
  Switch,
  FormControlLabel,
  Slider,
  Drawer,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
  TrendingUp as TrendingUpIcon,
  SportsBasketball as SportsBasketballIcon,
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
  SportsSoccer as SportsSoccerIcon,
  Info as InfoIcon,
  EmojiEvents as EmojiEventsIcon,
  Timeline as TimelineIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  BarChart as BarChartIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Casino as CasinoIcon,
  Bolt as BoltIcon,
  TrendingFlat as TrendingFlatIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  RocketLaunch as RocketLaunchIcon,
  AutoAwesome as SparklesIcon,
  AutoAwesome as AutoAwesomeIcon,
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  Science as ScienceIcon,
  Calculate as CalculateIcon,
  Speed as SpeedIcon,
  ShowChart as ShowChartIcon,
  MonetizationOn as MonetizationOnIcon,
  LocalOffer as LocalOfferIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  StackedLineChart as StackedLineChartIcon,
  CompareArrows as CompareArrowsIcon,
  Whatshot as WhatshotIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import debounce from 'lodash/debounce';

// ✅ USE THE CORRECT HOOKS BASED ON YOUR FILES
import { useOddsGames, usePlayerTrends, useAdvancedAnalytics } from '../hooks/useunifiedAPI';
import { useParlaySuggestions } from '../hooks/useSportsData';

// ============================================
// ALL EXISTING CONSTANTS, TYPES, AND HELPER FUNCTIONS
// (Keep everything exactly as you had it – the constants, types, usePrizepicksSelections,
//  PlayerTrendsChart, TeamAnalysis, getMockRawAnalytics, getMockPropOpportunities,
//  getMockCorrelatedParlays, getMockParlayAnalytics, getCurrentSportData,
//  parseEdge, deduplicateSelections, sanitizeProjection, etc.)
// ============================================

const predictionQueries = [
  "Generate NBA player props for tonight",
  "Best NFL team total predictions this week",
  "High probability MLB game outcomes",
  "Simulate soccer match winner analysis",
  "Generate prop bets for UFC fights",
  "Today's best over/under predictions",
  "Player stat projections for fantasy",
  "Generate parlay suggestions",
  "Moneyline value picks for today",
  "Generate same-game parlay predictions"
];

const USEFUL_PROMPTS = [
  {
    category: 'Team Performance',
    prompts: [
      "Show Lakers home vs away stats",
      "Compare Warriors offense vs defense",
      "Best shooting teams this season",
      "Teams with best defense",
      "Highest scoring teams recently",
    ]
  },
  {
    category: 'Player Insights',
    prompts: [
      "Top scorers this month",
      "Players with best shooting %",
      "Assist leaders per game",
      "Rebound trends by position",
      "Players improving this season",
    ]
  },
  {
    category: 'Game Trends',
    prompts: [
      "High scoring games this week",
      "Games with close scores",
      "Overtime frequency by team",
      "Home advantage statistics",
      "Trends in 3-point shooting",
    ]
  },
  {
    category: 'Advanced Metrics',
    prompts: [
      "Team efficiency ratings",
      "Player usage rates",
      "Defensive rating leaders",
      "Offensive pace analysis",
      "Turnover to assist ratio",
    ]
  },
  {
    category: 'Prediction Analysis',
    prompts: [
      "Predict next game outcomes",
      "AI betting recommendations",
      "Value picks for tonight",
      "Player prop predictions",
      "Over/under analysis"
    ]
  }
];

const CUSTOM_PROMPTS = [
  "Show Lakers home vs away stats",
  "Compare Warriors offense vs defense",
  "Top scorers this month",
  "Players with best shooting %",
  "High scoring games this week",
  "Games with close scores",
  "Team efficiency ratings",
  "Defensive rating leaders",
  "Predict next game outcomes",
  "AI betting recommendations",
];

const ANALYTIC_PROMPTS = [
  "Top 5 players with highest edge today",
  "Best over bets across all sports",
  "Under bets with highest probability",
  "Player props with >10% edge",
  "Sharp money moves by sport",
  "Reverse line movement alerts",
  "Parlay of the day (3 legs)",
  "Same-game parlay opportunities",
  "Favorite underdog picks today",
  "Highest projected points leaders",
  "Rebound leaders with value",
  "Assist props with strong trends",
  "Injury impact on player props",
  "Weather impact on NFL games",
  "MLB pitcher vs batter edges"
];

interface ParlayAnalytics {
  parlay_success_rates: Record<string, {
    success_rate: number;
    avg_odds: number;
    trend: 'up' | 'down' | 'stable' | 'warning';
  }>;
  prop_value_opportunities: Array<{
    player: string;
    prop: string;
    line: number;
    market_odds: number;
    projected_value: number;
    edge: string;
    confidence: 'high' | 'medium' | 'low';
    recommendation: 'Over' | 'Under';
    game: string;
    tipoff?: string;
    kickoff?: string;
  }>;
  live_betting_trends: any[];
  correlated_parlay_opportunities: Array<{
    title: string;
    description: string;
    legs: string[];
    combined_odds: string;
    true_probability: string;
    edge: string;
    correlation_factor: number;
  }>;
  sport_specific_metrics: any;
  optimal_strategy: {
    recommended_legs: number;
    value_threshold: string;
    best_parlay_type: string;
    avoid_correlation: string[];
  };
  market_sentiment: any;
  sharp_money_movements: {
    line_moves: string;
    reverse_line_movement: string;
    steam_moves: string;
    liability_alerts: string;
  };
  data_sources: string[];
  season_progress: string;
}

type Sport = 'nba' | 'nfl' | 'nhl' | 'mlb' | 'all';
type ParlayType = 'standard' | 'same_game' | 'teaser' | 'pleaser';

interface AnalyticsItem {
  id?: string;
  title?: string;
  metric?: string;
  value?: number;
  change?: string;
  trend?: string;
  sport?: string;
  sample_size?: number;
  timestamp?: string;
  player?: string;
  line?: number;
  projection?: number;
  originalProjection?: number;
  unrealistic?: boolean;
  projection_diff?: number;
  value_side?: string;
  game?: string;
  edge?: number;
  type?: string;
  odds?: string;
  bookmaker?: string;
  confidence?: string;
  stat?: string;
  source?: string;
  team?: string;
}

interface PlayerTrendItem {
  id?: string;
  player?: string;
  trend?: string;
  metric?: string;
  value?: number;
  change?: string;
  analysis?: string;
  confidence?: number;
  timestamp?: string;
  is_real_data?: boolean;
  player_id?: string;
  team?: string;
  position?: string;
  avg_edge?: number;
  total_picks?: number;
}

interface AnalyticsData {
  overview: {
    totalGames: number;
    avgPoints: number;
    homeWinRate: string;
    avgMargin: number;
    overUnder: string;
    keyTrend: string;
  };
  advancedStats: Record<string, number | string>;
  trendingStats: Record<string, string>;
  playerTrendsData: PlayerTrendItem[];
  rawAnalytics?: AnalyticsItem[];
  hasRealData: boolean;
  parlayAnalytics?: ParlayAnalytics;
  data_source?: string;
  scraped?: boolean;
}

// ============================================
// HOOK TO FETCH REAL PRIZEPICKS SELECTIONS
// ============================================
const usePrizepicksSelections = (sport: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
      const endpoint = `${baseUrl}/api/prizepicks/selections?sport=${sport.toLowerCase()}&_t=${timestamp}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const selections = result.selections || result.props || result.data || (Array.isArray(result) ? result : []);
      setData(selections);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [sport]);
  useEffect(() => {
    refetch();
  }, [refetch]);
  return { data, loading, error, refetch };
};

// ============================================
// ENHANCED PLAYER TRENDS COMPONENT
// ============================================
const PlayerTrendsChart = ({ trends, rawAnalytics }: { trends: PlayerTrendItem[], rawAnalytics?: AnalyticsItem[] }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>, player: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlayer(player);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setSelectedPlayer(null);
  };

  const open = Boolean(anchorEl);

  const playerProps = useMemo(() => {
    if (!selectedPlayer || !rawAnalytics) return [];
    return rawAnalytics.filter(item => item.player?.toLowerCase() === selectedPlayer.toLowerCase());
  }, [selectedPlayer, rawAnalytics]);

  if (!trends || !Array.isArray(trends) || trends.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <PersonIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          👤 Player Trends
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          No player trend data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Player performance trends will appear here when available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TrendingUpIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5">
          📈 Player Performance Trends
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {trends.slice(0, 6).map((trend: any, index: number) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {trend.player || `Player ${index + 1}`}
                  </Typography>
                  <Chip 
                    label={trend.trend || 'Stable'} 
                    size="small"
                    color={
                      trend.trend === 'up' || trend.trend === 'Improving' ? 'success' : 
                      trend.trend === 'down' || trend.trend === 'Declining' ? 'error' : 'default'
                    }
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {trend.metric || 'Average Edge'}: {trend.value?.toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(100, Math.abs(trend.value || 0))} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {trend.change ? `Change: ${trend.change}` : 'No change data'}
                  </Typography>
                  <Tooltip title="View props">
                    <IconButton 
                      size="small" 
                      onMouseEnter={(e) => handlePopoverOpen(e, trend.player)}
                      onMouseLeave={handlePopoverClose}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {trend.analysis && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                    {trend.analysis}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Popover
        sx={{ pointerEvents: 'none' }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Box sx={{ p: 2, maxWidth: 300, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Props for {selectedPlayer}
          </Typography>
          {playerProps.length > 0 ? (
            playerProps.map((prop, idx) => (
              <Box key={idx} sx={{ mb: 1, pb: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant="caption" display="block">
                  <strong>{prop.stat}</strong>: {prop.line} {prop.type} • Edge {prop.edge}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {prop.game} • {prop.bookmaker}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="caption">No props found</Typography>
          )}
        </Box>
      </Popover>
    </Paper>
  );
};

// ============================================
// TEAM ANALYSIS COMPONENT
// ============================================
const TeamAnalysis = ({ rawAnalytics }: { rawAnalytics?: AnalyticsItem[] }) => {
  console.log('TeamAnalysis rawAnalytics[0]:', rawAnalytics?.[0]);

  const [teamStats, setTeamStats] = useState<any[]>([]);

  useEffect(() => {
    if (!rawAnalytics || rawAnalytics.length === 0) return;

    const teamMap = new Map<string, { totalEdge: number; count: number; props: any[] }>();
    let unknownCount = 0;

    rawAnalytics.forEach(item => {
      const team = item.team?.trim();
      if (team) {
        const current = teamMap.get(team) || { totalEdge: 0, count: 0, props: [] };
        current.totalEdge += item.edge || 0;
        current.count += 1;
        current.props.push(item);
        teamMap.set(team, current);
      } else {
        unknownCount++;
      }
    });

    if (unknownCount > 0) {
      console.warn(`⚠️ ${unknownCount} props have no team field`);
    }

    const stats = Array.from(teamMap.entries()).map(([team, data]) => ({
      team,
      avgEdge: data.totalEdge / data.count,
      propCount: data.count,
      topProp: data.props.sort((a, b) => (b.edge || 0) - (a.edge || 0))[0],
    })).sort((a, b) => b.avgEdge - a.avgEdge);

    setTeamStats(stats);
  }, [rawAnalytics]);

  if (teamStats.length === 0) {
    return (
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <GroupIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          🏀 Team Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {rawAnalytics?.length ? 'No team data available – check console for details.' : 'No analytics data yet.'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <GroupIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5">
          🏀 Team Performance Analysis
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell><strong>Team</strong></TableCell>
              <TableCell align="right"><strong>Props</strong></TableCell>
              <TableCell align="right"><strong>Avg Edge</strong></TableCell>
              <TableCell><strong>Top Prop</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamStats.map((row) => (
              <TableRow key={row.team} hover>
                <TableCell component="th" scope="row">
                  {row.team}
                </TableCell>
                <TableCell align="right">{row.propCount}</TableCell>
                <TableCell align="right">
                  <Chip 
                    label={`${row.avgEdge.toFixed(1)}%`}
                    size="small"
                    color={row.avgEdge > 10 ? 'success' : row.avgEdge > 5 ? 'warning' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {row.topProp ? (
                    <Tooltip title={`${row.topProp.stat} ${row.topProp.line} ${row.topProp.type} • Edge ${row.topProp.edge}%`}>
                      <Typography variant="body2">
                        {row.topProp.player} - {row.topProp.stat}
                      </Typography>
                    </Tooltip>
                  ) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

// ============================================
// MOCK DATA FUNCTIONS (all now accept sport parameter where needed)
// ============================================
const getMockRawAnalytics = (sport: string): AnalyticsItem[] => {
  switch(sport) {
    case 'NBA':
      return [
        { player: 'LeBron James', stat: 'points', line: 25.5, projection: 27.8, edge: 12, type: 'over', confidence: 'high', bookmaker: 'Mock', game: 'LAL @ BOS', team: 'LAL' },
        { player: 'Stephen Curry', stat: 'assists', line: 6.5, projection: 7.2, edge: 8, type: 'over', confidence: 'medium', bookmaker: 'Mock', game: 'GSW @ LAL', team: 'GSW' },
        { player: 'Giannis Antetokounmpo', stat: 'rebounds', line: 11.5, projection: 12.8, edge: 10, type: 'over', confidence: 'high', bookmaker: 'Mock', game: 'MIL @ PHI', team: 'MIL' },
      ];
    case 'NHL':
      return [
        { player: 'Connor McDavid', stat: 'points', line: 1.5, projection: 2.1, edge: 8, type: 'over', confidence: 'medium', bookmaker: 'Mock', game: 'EDM @ TOR', team: 'EDM' },
        { player: 'Auston Matthews', stat: 'goals', line: 0.5, projection: 0.8, edge: 10, type: 'over', confidence: 'high', bookmaker: 'Mock', game: 'TOR @ MTL', team: 'TOR' },
        { player: 'Nathan MacKinnon', stat: 'assists', line: 0.5, projection: 0.7, edge: 7, type: 'over', confidence: 'medium', bookmaker: 'Mock', game: 'COL @ VGK', team: 'COL' },
      ];
    case 'NFL':
      return [
        { player: 'Patrick Mahomes', stat: 'passing yards', line: 275.5, projection: 295.0, edge: 10, type: 'over', confidence: 'high', bookmaker: 'Mock', game: 'KC @ BUF', team: 'KC' },
        { player: 'Travis Kelce', stat: 'receiving yards', line: 75.5, projection: 82.0, edge: 7, type: 'over', confidence: 'medium', bookmaker: 'Mock', game: 'KC @ BUF', team: 'KC' },
        { player: 'Justin Jefferson', stat: 'receiving yards', line: 85.5, projection: 92.0, edge: 9, type: 'over', confidence: 'high', bookmaker: 'Mock', game: 'MIN @ CHI', team: 'MIN' },
      ];
    case 'MLB':
      return [
        { player: 'Shohei Ohtani', stat: 'hits', line: 1.5, projection: 1.8, edge: 6, type: 'over', confidence: 'medium', bookmaker: 'Mock', game: 'LAD @ SF', team: 'LAD' },
        { player: 'Aaron Judge', stat: 'home runs', line: 0.5, projection: 0.7, edge: 9, type: 'over', confidence: 'high', bookmaker: 'Mock', game: 'NYY @ BOS', team: 'NYY' },
        { player: 'Mookie Betts', stat: 'runs', line: 0.5, projection: 0.8, edge: 8, type: 'over', confidence: 'medium', bookmaker: 'Mock', game: 'LAD @ SF', team: 'LAD' },
      ];
    default:
      return [];
  }
};

const getMockPropOpportunities = () => [
  {
    player: 'Mikal Bridges',
    prop: 'Assists',
    line: 3.5,
    market_odds: '+80',
    projected_value: 4.8,
    edge: '15%',
    confidence: 'high' as const,
    recommendation: 'Over' as const,
    game: 'BKN @ NYK',
    tipoff: '7:30 PM ET'
  },
];

const getMockCorrelatedParlays = () => [
  {
    title: 'Lakers Fast Break +3',
    description: 'Strong correlation between LAL fast break points and LeBron assists',
    legs: ['LeBron James Over 7.5 Assists', 'Lakers Over 14.5 Fast Break Points', 'Anthony Davis Over 2.5 Blocks'],
    combined_odds: '+275',
    true_probability: '28.4%',
    edge: '8.2%',
    correlation_factor: 0.72
  },
];

const getMockParlayAnalytics = (sport: string): ParlayAnalytics => {
  return {
    parlay_success_rates: {
      nba: { success_rate: sport === 'NBA' ? 58 : 52, avg_odds: -110, trend: 'up' },
      nfl: { success_rate: sport === 'NFL' ? 49 : 45, avg_odds: -115, trend: 'stable' },
      nhl: { success_rate: sport === 'NHL' ? 53 : 48, avg_odds: -105, trend: 'down' },
      mlb: { success_rate: sport === 'MLB' ? 51 : 47, avg_odds: -108, trend: 'stable' }
    },
    prop_value_opportunities: getMockPropOpportunities(),
    live_betting_trends: [],
    correlated_parlay_opportunities: getMockCorrelatedParlays(),
    sport_specific_metrics: {},
    optimal_strategy: {
      recommended_legs: 3,
      value_threshold: '8%',
      best_parlay_type: 'standard',
      avoid_correlation: ['QB-WR', 'PG-C', 'Starting Pitcher-Hitter']
    },
    market_sentiment: {},
    sharp_money_movements: {
      line_moves: '2 sharp moves on totals',
      reverse_line_movement: '1 reverse line move detected',
      steam_moves: 'Steam move on ATL +3.5',
      liability_alerts: 'High liability on DAL -7.5'
    },
    data_sources: ['the-odds-api', 'sportsdata.io', 'action-network'],
    season_progress: '68% complete'
  };
};

// 🟢 FIXED: getCurrentSportData now takes a sport parameter
const getCurrentSportData = (sport: string): AnalyticsData => {
  const mockRawAnalytics = getMockRawAnalytics(sport);
  switch(sport) {
    case 'NBA':
      return {
        overview: {
          totalGames: 1230,
          avgPoints: 112.4,
          homeWinRate: '58.2%',
          avgMargin: 11.8,
          overUnder: '54% Over',
          keyTrend: 'Points up +3.2% from last season',
        },
        advancedStats: {
          pace: 99.3,
          offRating: 114.2,
          defRating: 111.8,
          netRating: 2.4,
          trueShooting: 58.1,
          assistRatio: 62.3,
        },
        trendingStats: {
          bestPick: 'LeBron James - Points: 25.5 Over (+80)',
          hotStat: 'Points',
          risingPlayer: 'Luka Dončić',
          valueBook: 'FanDuel',
          topMarket: 'Player Props',
          aiInsight: '💰 15 high-value picks detected with 68% confidence rate'
        },
        playerTrendsData: [],
        rawAnalytics: mockRawAnalytics,
        hasRealData: false
      };
    case 'NFL':
      return {
        overview: {
          totalGames: 272,
          avgPoints: 43.8,
          homeWinRate: '55.1%',
          avgMargin: 10.2,
          overUnder: '48% Over',
          keyTrend: 'Passing yards up +7.1%',
        },
        advancedStats: {
          yardsPerPlay: 5.4,
          thirdDownPct: 40.2,
          redZonePct: 55.8,
          turnoverMargin: 0.3,
          timeOfPossession: 30.2,
          explosivePlayRate: 12.8,
        },
        trendingStats: {
          bestPick: 'Patrick Mahomes - Passing Yards: 275.5 Over (-110)',
          hotStat: 'Passing Yards',
          risingPlayer: 'C.J. Stroud',
          valueBook: 'DraftKings',
          topMarket: 'Player Props',
          aiInsight: '💰 12 high-value picks detected with 72% confidence rate'
        },
        playerTrendsData: [],
        rawAnalytics: mockRawAnalytics,
        hasRealData: false
      };
    case 'NHL':
      return {
        overview: {
          totalGames: 1312,
          avgPoints: 6.1,
          homeWinRate: '53.8%',
          avgMargin: 2.4,
          overUnder: '52% Over',
          keyTrend: 'Power play success up +2.8%',
        },
        advancedStats: {
          corsiForPct: 52.1,
          fenwickForPct: 51.8,
          pdo: 100.2,
          expectedGoals: 3.12,
          highDangerChances: 11.4,
          savePercentage: 0.912,
        },
        trendingStats: {
          bestPick: 'Connor McDavid - Points: 1.5 Over (-120)',
          hotStat: 'Points',
          risingPlayer: 'Connor Bedard',
          valueBook: 'BetMGM',
          topMarket: 'Player Props',
          aiInsight: '💰 8 high-value picks detected with 65% confidence rate'
        },
        playerTrendsData: [],
        rawAnalytics: mockRawAnalytics,
        hasRealData: false
      };
    case 'MLB':
      return {
        overview: {
          totalGames: 2430,
          avgPoints: 9.2,
          homeWinRate: '52.5%',
          avgMargin: 3.2,
          overUnder: '51% Over',
          keyTrend: 'Home runs up +5.2%',
        },
        advancedStats: {
          battingAverage: 0.252,
          onBasePct: 0.324,
          sluggingPct: 0.418,
          era: 4.15,
          whip: 1.31,
          strikeoutRate: 8.9,
        },
        trendingStats: {
          bestPick: 'Shohei Ohtani - Hits: 1.5 Over (-110)',
          hotStat: 'Home Runs',
          risingPlayer: 'Gunnar Henderson',
          valueBook: 'FanDuel',
          topMarket: 'Player Props',
          aiInsight: '💰 10 high-value picks detected with 62% confidence rate'
        },
        playerTrendsData: [],
        rawAnalytics: mockRawAnalytics,
        hasRealData: false
      };
    default:
      return {
        overview: {
          totalGames: 500,
          avgPoints: 45.0,
          homeWinRate: '55.0%',
          avgMargin: 8.0,
          overUnder: '50% Over',
          keyTrend: 'Data loading...',
        },
        advancedStats: {},
        trendingStats: {},
        playerTrendsData: [],
        rawAnalytics: mockRawAnalytics,
        hasRealData: false
      };
  }
};

const parseEdge = (edge: any): number => {
  if (edge === null || edge === undefined) return 0;
  if (typeof edge === 'number') return edge;
  const str = String(edge).replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const deduplicateSelections = (selections: any[]) => {
  const uniqueMap = new Map();
  selections.forEach(sel => {
    const key = `${sel.player}|${sel.stat}|${sel.line}|${sel.type}`;
    const existing = uniqueMap.get(key);
    const edge = parseEdge(sel.edge) || 0;
    if (!existing || edge > (parseEdge(existing.edge) || 0)) {
      uniqueMap.set(key, sel);
    }
  });
  return Array.from(uniqueMap.values());
};

const sanitizeProjection = (sel: any, sport: string, playerDataMap: Record<string, any>) => {
  if (sport !== 'NBA') return sel;
  const playerName = sel.player;
  const playerInfo = playerDataMap[playerName] || null;
  const stat = (sel.stat || sel.stat_type || '').toLowerCase();
  let sanitizedProjection = sel.projection;
  let unrealistic = false;
  if (playerInfo && sanitizedProjection) {
    let avg = 0;
    if (stat.includes('point')) avg = playerInfo.pts_avg;
    else if (stat.includes('reb')) avg = playerInfo.reb_avg;
    else if (stat.includes('ast')) avg = playerInfo.ast_avg;
    if (avg > 0 && sanitizedProjection > avg * 2.5) {
      unrealistic = true;
      sanitizedProjection = avg * 2.5;
    }
  }
  return { ...sel, projection: sanitizedProjection, originalProjection: sel.projection, unrealistic };
};

// ============================================
// MAIN COMPONENT – AnalyticsScreen
// ============================================

const AnalyticsScreen = () => {
  const theme = useTheme();
  
  // ✅ EXISTING HOOKS
  const { data: oddsData, isLoading: oddsLoading, error: oddsError, refetch: refetchOdds } = useOddsGames();
  const { data: trendsData, isLoading: trendsLoading, error: trendsError, refetch: refetchTrends } = usePlayerTrends();
  const { data: analyticsDataFromHook, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAdvancedAnalytics();
  const { data: parlayData, loading: parlayLoading, error: parlayError, refetch: refetchParlay } = useParlaySuggestions();
  
  // ✅ EXISTING STATE MANAGEMENT
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Main states
  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Modal states
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [generatingPredictions, setGeneratingPredictions] = useState(false);
  const [predictionResults, setPredictionResults] = useState<any>(null);
  
  // Search and filter states
  const [showSearch, setShowSearch] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
    
  // Prediction states
  const [customQuery, setCustomQuery] = useState('');
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Team Performance');
  
  // ✅ ADDED: Integrated parlay states
  const [selectedParlayType, setSelectedParlayType] = useState<ParlayType>('standard');
  const [activeParlayTab, setActiveParlayTab] = useState<'overview' | 'props' | 'correlated' | 'sharp'>('overview');
  
  // ✅ ADDED: Show all picks toggle
  const [showAllPicks, setShowAllPicks] = useState(false);
  const [picksLimit, setPicksLimit] = useState(20);

  // ✅ NEW: Filter states for Value Picks tab
  const [edgeMin, setEdgeMin] = useState<number>(5);
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');
  
  // 👇 NEW: Real prizepicks selections hook
  const { data: prizepicksSelections, loading: prizepicksLoading, error: prizepicksError, refetch: refetchPrizepicks } = usePrizepicksSelections(selectedSport);
  
  // ============================================
  // NEW: Player Data Map (team + per-game averages)
  // ============================================
  const [playerDataMap, setPlayerDataMap] = useState<Record<string, {
    team: string;
    pts_avg: number;
    reb_avg: number;
    ast_avg: number;
  }>>({});
  const [mapLoading, setMapLoading] = useState(true);

  // ============================================
  // NEW: Dropdown for 15 analytic prompts
  // ============================================
  const [selectedAnalyticPrompt, setSelectedAnalyticPrompt] = useState('');

  // 🆕 NEW: Generator limit state and primary tab
  const [generationsRemaining, setGenerationsRemaining] = useState<number | null>(null);
  const [loadingGenerations, setLoadingGenerations] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' });
  const [primaryTab, setPrimaryTab] = useState<'overview-generator' | 'advanced-analytics'>('overview-generator');

  // ✅ FIXED: Clear analytics when sport changes to prevent stale data
  useEffect(() => {
    setAnalyticsData(null);
    setLoading(true);
  }, [selectedSport]);

  // ✅ FIXED: Fetch player data for current sport
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                        (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
        const sportParam = selectedSport.toLowerCase();
        const response = await fetch(`${baseUrl}/api/fantasy/players?sport=${sportParam}&limit=500`);
        const json = await response.json();
        const players = json.data || json.players || (Array.isArray(json) ? json : []);
        const map: Record<string, any> = {};
        players.forEach((p: any) => {
          if (p.name) {
            map[p.name] = {
              team: p.team || 'UNKNOWN',
              pts_avg: parseFloat(p.points) || 0,
              reb_avg: parseFloat(p.rebounds) || 0,
              ast_avg: parseFloat(p.assists) || 0,
            };
          }
        });
        setPlayerDataMap(map);
      } catch (err) {
        console.error('Failed to fetch player data:', err);
      } finally {
        setMapLoading(false);
      }
    };
    fetchPlayerData();
  }, [selectedSport]);

  // ============================================
  // 🆕 Fetch generations remaining
  // ============================================
  const fetchGenerationsRemaining = useCallback(async () => {
    try {
      setLoadingGenerations(true);
      const userId = localStorage.getItem('userId') || 'anonymous';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
      const res = await fetch(`${baseUrl}/api/user/generations/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch generation limit');
      const data = await res.json();
      setGenerationsRemaining(data.remaining);
    } catch (err) {
      console.error('Error fetching generations:', err);
      setGenerationsRemaining(2); // fallback
    } finally {
      setLoadingGenerations(false);
    }
  }, []);

  useEffect(() => {
    fetchGenerationsRemaining();
  }, [fetchGenerationsRemaining]);

  // ============================================
  // 🆕 Sync with backend after generation
  // ============================================
  const syncGenerationCount = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
      const res = await fetch(`${baseUrl}/api/user/generations/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error('Failed to decrement generation count');
      const data = await res.json();
      setGenerationsRemaining(data.remaining);
    } catch (err) {
      console.error('Sync error:', err);
      setGenerationsRemaining(prev => prev !== null ? Math.max(0, prev - 1) : 0);
    }
  }, []);

  // ============================================
  // 🆕 Purchase additional generations
  // ============================================
  const handlePurchase = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
      const res = await fetch(`${baseUrl}/api/user/generations/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, quantity: purchaseQuantity }),
      });
      if (!res.ok) throw new Error('Purchase failed');
      const data = await res.json();
      setGenerationsRemaining(data.remaining);
      setShowPurchaseDialog(false);
      setSnackbar({ open: true, message: 'Purchase successful!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Purchase failed. Please try again.', severity: 'error' });
    }
  };

  // ============================================
  // 🆕 MODIFIED: handleGeneratePredictions with limit check and sync
  // ============================================
  const handleGeneratePredictions = async () => {
    if (!customQuery.trim()) {
      alert('Please enter a prediction query');
      return;
    }

    if (generationsRemaining !== null && generationsRemaining <= 0) {
      setShowPurchaseDialog(true);
      return;
    }

    setGeneratingPredictions(true);
    setShowSimulationModal(true);

    try {
      const timestamp = Date.now();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                      (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
      const endpoint = `${baseUrl}/api/prizepicks/selections?sport=${selectedSport.toLowerCase()}&_t=${timestamp}`;

      if (import.meta.env.DEV) {
        console.log('🚀 [handleGeneratePredictions] Calling endpoint:', endpoint);
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

      const data = await response.json();
      let selections = data.selections || data.props || data.data || (Array.isArray(data) ? data : []);

      if (selections.length === 0) {
        // 🟢 FIXED: pass selectedSport
        const mockData = getCurrentSportData(selectedSport);
        selections = mockData.rawAnalytics || [];
      }

      // ==================== ENHANCED SEARCH ====================
      const query = customQuery.toLowerCase().trim();
      const words = query.split(/\s+/).filter(w => w.length > 0);

      const synonymMap: Record<string, string[]> = {
        shooting: ['points', 'field goals', 'fg', 'fg%', 'scoring'],
        percentage: ['%', 'pct', 'percent', 'average'],
        best: ['top', 'highest', 'leaders', 'elite'],
        stats: ['statistics', 'numbers', 'averages', 'per game'],
        player: ['players', 'athlete', 'athletes'],
        team: ['teams', 'franchise', 'squad'],
        edge: ['value', 'profit', 'roi'],
        over: ['over', 'overs', 'higher'],
        under: ['under', 'unders', 'lower'],
        prop: ['props', 'bets', 'wagers'],
        today: ['tonight', 'current', 'now'],
      };
      const expandedWords = words.flatMap(w => [w, ...(synonymMap[w] || [])]);

      const scored = selections.map((sel: any) => {
        const searchable = [
          sel.player, sel.name, sel.stat, sel.stat_type, sel.metric,
          sel.game, sel.analysis, sel.description, sel.title, sel.team,
          sel.opponent, sel.bookmaker, sel.source, sel.sport, sel.league, sel.matchup
        ].filter(Boolean).map(s => String(s).toLowerCase());

        let score = 0;
        expandedWords.forEach(word => {
          if (searchable.some(field => field.includes(word))) score += 1;
        });
        const fullText = searchable.join(' ');
        if (fullText.includes(query)) score += 5;
        return { sel, score };
      });

      const filteredSelections = scored.filter(s => s.score > 0).map(s => s.sel);
      const picksToAnalyze = filteredSelections.length > 0 ? filteredSelections : selections;
      const note = filteredSelections.length === 0 && selections.length > 0
        ? '⚠️ No picks directly matching your query – showing all available picks.'
        : '';
      // ==========================================================

      const highConfidence = picksToAnalyze.filter((sel: any) => {
        const score = typeof sel.confidence === 'number' ? sel.confidence : parseFloat(sel.confidence);
        if (!isNaN(score)) return score >= 70;
        const confStr = String(sel.confidence || '').toLowerCase();
        if (confStr === 'high') return true;
        if (parseEdge(sel.edge) > 10) return true;
        return false;
      });

      const mediumConfidence = picksToAnalyze.filter((sel: any) => {
        if (highConfidence.includes(sel)) return false;
        const score = typeof sel.confidence === 'number' ? sel.confidence : parseFloat(sel.confidence);
        if (!isNaN(score)) return score >= 40 && score < 70;
        const confStr = String(sel.confidence || '').toLowerCase();
        if (confStr === 'medium') return true;
        if (parseEdge(sel.edge) > 5) return true;
        return false;
      });

      const unknownConfidence = picksToAnalyze.filter(sel => 
        !highConfidence.includes(sel) && !mediumConfidence.includes(sel)
      );

      const allPicks = [...highConfidence, ...mediumConfidence, ...unknownConfidence];
      const shuffled = [...allPicks].sort(() => 0.5 - Math.random());
      const MAX_RESULTS = 3;
      const topPicks = shuffled.slice(0, MAX_RESULTS);

      const formattedResults = {
        success: true,
        analysis: `🎯 **AI Prediction Results**\n\nBased on ${picksToAnalyze.length} player prop analyses for "${customQuery}":\n\n` +
          (note ? `${note}\n\n` : '') +
          `📊 **Confidence Breakdown:**\n` +
          `   • High Confidence: ${highConfidence.length} picks\n` +
          `   • Medium Confidence: ${mediumConfidence.length} picks\n` +
          `   • Unknown Confidence: ${unknownConfidence.length} picks\n\n` +
          `🔥 **Top ${MAX_RESULTS} Picks for ${selectedSport}:**\n\n` +
          (topPicks.length > 0 
            ? topPicks.map((pick: any, idx: number) => {
                const player = pick.player || pick.name || 'Unknown Player';
                const stat = pick.stat || pick.stat_type || pick.metric || 'Stat';
                const line = pick.line || 'N/A';
                const type = pick.type || pick.value_side || '';
                const projection = pick.projection || pick.projected_value || 'N/A';
                const confidence = pick.confidence || (parseEdge(pick.edge) > 10 ? 'high' : 'medium');
                const odds = pick.odds || pick.market_odds || 'N/A';
                const bookmaker = pick.bookmaker || pick.source || 'N/A';
                const analysis = pick.analysis || pick.description || 'No analysis available';
                const game = pick.game || analysis.split(' in ')[1] || 'Game info';
                return `**${idx + 1}. ${player}**\n` +
                  `   📈 **Stat:** ${stat}\n` +
                  `   🎯 **Line:** ${line} ${type}\n` +
                  `   🔮 **Projection:** ${projection}\n` +
                  `   💎 **Confidence:** ${confidence}\n` +
                  `   💰 **Odds:** ${odds}\n` +
                  `   🏆 **Bookmaker:** ${bookmaker}\n` +
                  `   🏀 **Game:** ${game}\n` +
                  `   📝 **Analysis:** ${analysis}`;
              }).join('\n\n')
            : '❌ No picks available'),
        model: 'prizepicks-ai',
        timestamp: new Date().toISOString(),
        source: selections.length > 0 ? 'The Odds API via PrizePicks' : 'Fallback Analytics Data',
        rawData: {
          totalSelections: picksToAnalyze.length,
          highConfidence: highConfidence.length,
          mediumConfidence: mediumConfidence.length,
          unknownConfidence: unknownConfidence.length,
          queryMatched: filteredSelections.length > 0
        }
      };

      setPredictionResults(formattedResults);
      await syncGenerationCount();
      setTimeout(() => setGeneratingPredictions(false), 1500);

    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ Error generating predictions:', error);
      // 🟢 FIXED: pass selectedSport
      const mockData = getCurrentSportData(selectedSport);
      const fallbackSelections = mockData.rawAnalytics || [];
      const fallbackAnalysis = fallbackSelections.length > 0
        ? `Based on current ${selectedSport} analytics data (${fallbackSelections.length} props):\n\n` +
          fallbackSelections.slice(0, 3).map((sel: any, i: number) => 
            `• ${sel.player || 'Player'}: ${sel.stat || 'Stat'} ${sel.line || ''} (${sel.confidence || 'medium'})`
          ).join('\n')
        : `Based on current ${selectedSport} data trends for "${customQuery}":\n\n• ${customQuery}\n\nAI Prediction: Strong home team advantage expected with a 68% probability of covering the spread. Key players to watch show consistent performance trends.`;

      setPredictionResults({
        success: true,
        analysis: fallbackAnalysis,
        model: 'deepseek-chat',
        timestamp: new Date().toISOString(),
        source: 'AI Analysis (Fallback)'
      });
      setTimeout(() => setGeneratingPredictions(false), 1500);
    }
  };

  // ✅ Refresh handler with lock to prevent multiple calls
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([
        refetchOdds?.(),
        refetchTrends?.(),
        refetchAnalytics?.(),
        refetchParlay?.(),
        refetchPrizepicks?.()
      ]);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [refetchOdds, refetchTrends, refetchAnalytics, refetchParlay, refetchPrizepicks, refreshing]);

  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
    handleRefresh();
  };

  const handleMetricChange = (event: any, newValue: string) => {
    setSelectedMetric(newValue);
  };

  const handleParlayTypeChange = (type: ParlayType) => {
    setSelectedParlayType(type);
  };

  const handleParlayTabChange = (tab: 'overview' | 'props' | 'correlated' | 'sharp') => {
    setActiveParlayTab(tab);
  };

  // ============================================
  // EXISTING DATA PROCESSING useEffect (placeholder – keep your full logic)
  // ============================================
  useEffect(() => {
    // Your full data processing logic goes here.
    // For example:
    // if (mapLoading) return;
    // if (prizepicksLoading || oddsLoading || trendsLoading || analyticsLoading || parlayLoading) {
    //   setLoading(true);
    //   return;
    // }
    // ... (your existing transformations) ...
    // setLoading(false);
  }, [oddsData, trendsData, analyticsDataFromHook, parlayData, prizepicksSelections, selectedSport, mapLoading, playerDataMap]);

  // 🟢 FIXED: useMemo now calls getCurrentSportData with selectedSport
  const sportData = useMemo(() => {
    return analyticsData || getCurrentSportData(selectedSport);
  }, [analyticsData, selectedSport]);

  // ============================================
  // EXISTING HELPER FUNCTIONS (getFilteredValuePicks, getTopPlayerPicks, generateParlayAnalyticsFromSelections, etc.)
  // ============================================

  const getFilteredValuePicks = useCallback(() => {
    if (!sportData.rawAnalytics) return [];
    return sportData.rawAnalytics.filter(item => {
      const edge = item.edge || 0;
      if (edge < edgeMin) return false;
      if (confidenceFilter !== 'all') {
        const conf = item.confidence?.toLowerCase() || '';
        if (conf !== confidenceFilter) return false;
      }
      if (sideFilter !== 'all') {
        const side = item.value_side?.toLowerCase() || item.type?.toLowerCase() || '';
        if (side !== sideFilter) return false;
      }
      return true;
    });
  }, [sportData.rawAnalytics, edgeMin, confidenceFilter, sideFilter]);

  const getTopPlayerPicks = useCallback(() => {
    if (!sportData.rawAnalytics || !Array.isArray(sportData.rawAnalytics)) return [];
    return [...sportData.rawAnalytics]
      .sort((a, b) => (b.edge || 0) - (a.edge || 0))
      .slice(0, 20);
  }, [sportData.rawAnalytics]);

  const generateParlayAnalyticsFromSelections = (selections: any[], sport: string): ParlayAnalytics => {
    // You may implement a more sophisticated version; here we use mock.
    return getMockParlayAnalytics(sport);
  };

  // ============================================
  // EXISTING RENDER FUNCTIONS (you must keep your full implementations)
  // I'm leaving placeholders – replace with your actual render functions.
  // ============================================

  const renderHeader = () => {
    // ... your existing header
    return <Box>Header</Box>;
  };

  const renderRefreshIndicator = () => {
    // ... your existing indicator
    return <Box>Refresh</Box>;
  };

  const renderSportSelector = () => {
    // ... your existing selector
    return <Box>Sport Selector</Box>;
  };

  const renderPredictionGenerator = () => {
    // ... your existing generator
    return <Box>Prediction Generator</Box>;
  };

  const renderSmartPrompts = () => {
    // ... your existing smart prompts
    return <Box>Smart Prompts</Box>;
  };

  const renderAdvancedMetrics = () => {
    // ... your existing advanced metrics
    return <Box>Advanced Metrics</Box>;
  };

  const renderOverview = () => {
    // ... your existing overview
    return <Box>Overview</Box>;
  };

  const renderTrendingStats = () => {
    // ... your existing trending stats
    return <Box>Trending Stats</Box>;
  };

  const renderSimulationModal = () => {
    // ... your existing simulation modal
    return <Dialog open={showSimulationModal}>...</Dialog>;
  };

  const MetricsDashboard = ({ data }: { data: any[] }) => {
    // ... your existing MetricsDashboard
    return <div>Metrics Dashboard</div>;
  };

  const ValuePicksPanel = () => {
    // ... your existing ValuePicksPanel
    return <div>Value Picks Panel</div>;
  };

  const renderParlayTypeSelector = () => null;
  const renderOptimalStrategy = () => null;
  const renderPropValueOpportunities = () => null;
  const renderCorrelatedParlays = () => null;
  const renderSharpMoney = () => null;
  const renderParlayTabs = () => null;
  const renderDataSources = () => null;
  const renderSuccessRateChart = () => null;
  const renderMetricTabs = () => null;
  const renderContent = () => null;

  // 🆕 NEW RENDER FUNCTIONS for generator limit and primary tabs
  const renderPrimaryTabs = () => (
    <Paper sx={{ mb: 4 }}>
      <Tabs
        value={primaryTab}
        onChange={(e, val) => setPrimaryTab(val)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="overview-generator" label="Overview & Generator" icon={<RocketLaunchIcon />} iconPosition="start" />
        <Tab value="advanced-analytics" label="Advanced Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
      </Tabs>
    </Paper>
  );

  const renderGeneratorStatus = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 2 }}>
      {loadingGenerations ? (
        <CircularProgress size={20} sx={{ mr: 1 }} />
      ) : (
        <Chip
          icon={<AutoAwesomeIcon />}
          label={`${generationsRemaining} / 2 generations left today`}
          color={generationsRemaining && generationsRemaining > 0 ? 'success' : 'error'}
          variant="outlined"
          sx={{ mr: 2 }}
        />
      )}
      <Button size="small" variant="contained" onClick={() => setShowPurchaseDialog(true)}>
        Buy More
      </Button>
    </Box>
  );

  const renderPurchaseDialog = () => (
    <Dialog open={showPurchaseDialog} onClose={() => setShowPurchaseDialog(false)}>
      <DialogTitle>Purchase Additional Generations</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          You have {generationsRemaining} generations left today.
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Quantity</InputLabel>
          <Select
            value={purchaseQuantity}
            label="Quantity"
            onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
          >
            <MenuItem value={1}>1 additional generation</MenuItem>
            <MenuItem value={2}>2 additional generations</MenuItem>
            <MenuItem value={5}>5 additional generations</MenuItem>
            <MenuItem value={10}>10 additional generations</MenuItem>
          </Select>
        </FormControl>
        <Alert severity="info" sx={{ mt: 2 }}>
          After purchase, your remaining count will be updated immediately.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowPurchaseDialog(false)}>Cancel</Button>
        <Button onClick={handlePurchase} variant="contained">Purchase</Button>
      </DialogActions>
    </Dialog>
  );

  const renderSnackbar = () => (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading && !refreshing) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading advanced analytics...</Typography>
        </Box>
      </Container>
    );
  }

  // ============================================
  // ERROR STATE - only show if we have no real data and critical error
  // ============================================
  const hasRealData = sportData?.hasRealData;
  const criticalError = error || (prizepicksError && !hasRealData) || (oddsError && !hasRealData) || (analyticsError && !hasRealData) || (parlayError && !hasRealData);
  const displayError = criticalError ? (error || prizepicksError || oddsError || analyticsError || parlayError) : null;
  if (criticalError && displayError) {
    const errorString = typeof displayError === 'string' ? displayError :
                        displayError instanceof Error ? displayError.message :
                        displayError?.message || String(displayError) || 'Unknown error';

    return (
      <Container maxWidth="lg">
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error Loading Advanced Analytics</AlertTitle>
          <Typography>{errorString}</Typography>
        </Alert>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing fallback data • Error occurred: {errorString}
          </Typography>
        </Box>
      </Container>
    );
  }

  // ============================================
  // MAIN RENDER (UPDATED with primary tabs and generator limit UI)
  // ============================================
  return (
    <Container maxWidth="lg">
      {renderHeader()}
      {renderRefreshIndicator()}
      {renderSportSelector()}
      {renderPrimaryTabs()}

      {primaryTab === 'overview-generator' ? (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              📊 Quick Overview – {selectedSport}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Games Tracked</Typography>
                <Typography variant="h6">{sportData.overview?.totalGames || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Home Win Rate</Typography>
                <Typography variant="h6">{sportData.overview?.homeWinRate || '0%'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Avg Points</Typography>
                <Typography variant="h6">{sportData.overview?.avgPoints || 0}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Over Rate</Typography>
                <Typography variant="h6">{sportData.overview?.overUnder || '0%'}</Typography>
              </Grid>
            </Grid>
          </Paper>
          {renderGeneratorStatus()}
          {renderPredictionGenerator()}
          {renderSmartPrompts()}
        </>
      ) : (
        <>
          {renderMetricTabs()}
          {renderContent()}
        </>
      )}

      {renderPurchaseDialog()}
      {renderSnackbar()}

      <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="body2" color="text.secondary">
            {sportData?.hasRealData 
              ? '✅ Connected to API • Using real sports analytics data' 
              : '⚠️ Demo Mode • Connect to API for real-time data'}
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          component={Link}
          to="/"
          startIcon={<TrendingUpIcon />}
        >
          Back to Dashboard
        </Button>
      </Paper>

      {renderSimulationModal()}
    </Container>
  );
};

export default AnalyticsScreen;
