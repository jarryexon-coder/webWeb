// src/pages/AdvancedAnalyticsScreen.tsx – FINAL with enhanced Team Analysis and Player Trends
// ADDED: playerTeamMap fetch and enrichment for missing team fields

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Popover,        // ✅ ADDED for enhanced PlayerTrendsChart
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Visibility as VisibilityIcon,   // ✅ already imported
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// ✅ USE THE CORRECT HOOKS BASED ON YOUR FILES
import { useOddsGames, usePlayerTrends, useAdvancedAnalytics } from '../hooks/useUnifiedAPI';
import { useParlaySuggestions } from '../hooks/useSportsData';

// ... (keep all existing constants and types as they are) ...
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

// 👇 10 CUSTOM PROMPT BOXES (first two from each category)
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

// ============================================
// INTEGRATED TYPES
// ============================================

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
  team?: string; // ADDED team field for enrichment
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
      // Handle different response structures
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
// ENHANCED PLAYER TRENDS COMPONENT (from File 1)
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

  // Get props for the selected player
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
// TEAM ANALYSIS COMPONENT (from File 1)
// ============================================
const TeamAnalysis = ({ rawAnalytics }: { rawAnalytics?: AnalyticsItem[] }) => {
  console.log('TeamAnalysis rawAnalytics[0]:', rawAnalytics?.[0]); // ADD THIS

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
// MAIN COMPONENT
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
  const [picksLimit, setPicksLimit] = useState(20); // default 20

  // ✅ NEW: Filter states for Value Picks tab
  const [edgeMin, setEdgeMin] = useState<number>(5);
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [sideFilter, setSideFilter] = useState<string>('all');
  
  // 👇 NEW: Real prizepicks selections hook
  const { data: prizepicksSelections, loading: prizepicksLoading, error: prizepicksError, refetch: refetchPrizepicks } = usePrizepicksSelections(selectedSport);
  
  // ============================================
  // NEW: Player Team Map State and Fetch
  // ============================================
  const [playerTeamMap, setPlayerTeamMap] = useState<Record<string, string>>({});
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerMap = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 
                        (import.meta.env.DEV ? 'https://python-api-fresh-production.up.railway.app' : '');
        const response = await fetch(`${baseUrl}/api/players/master?sport=nba&limit=500`);
        const data = await response.json();
        const players = data.data || data.players || data;
        const map: Record<string, string> = {};
        (Array.isArray(players) ? players : []).forEach((p: any) => {
          if (p.name && p.team) {
            map[p.name] = p.team;
          }
        });
        setPlayerTeamMap(map);
      } catch (err) {
        console.error('Failed to fetch player team map:', err);
      } finally {
        setMapLoading(false);
      }
    };
    fetchPlayerMap();
  }, []);
  
  // ============================================
  // MOCK DATA FUNCTIONS (unchanged)
  // ============================================
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
    // ... (rest omitted for brevity, keep as in original)
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
    // ...
  ];

  const getMockParlayAnalytics = (sport: string): ParlayAnalytics => {
    return {
      parlay_success_rates: {
        nba: { success_rate: sport === 'nba' ? 58 : 52, avg_odds: -110, trend: 'up' },
        nfl: { success_rate: sport === 'nfl' ? 49 : 45, avg_odds: -115, trend: 'stable' },
        nhl: { success_rate: sport === 'nhl' ? 53 : 48, avg_odds: -105, trend: 'down' },
        mlb: { success_rate: sport === 'mlb' ? 51 : 47, avg_odds: -108, trend: 'stable' }
      },
      prop_value_opportunities: getMockPropOpportunities(),
      live_betting_trends: [],
      correlated_parlay_opportunities: getMockCorrelatedParlays(),
      sport_specific_metrics: {},
      optimal_strategy: {
        recommended_legs: 3,
        value_threshold: '8%',
        best_parlay_type: selectedParlayType,
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

  const getCurrentSportData = (): AnalyticsData => {
    // Only log in development to reduce noise
    if (import.meta.env.DEV) {
      console.log(`🎯 [getCurrentSportData] Creating mock data for sport: ${selectedSport}`);
    }
    
    switch(selectedSport) {
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
            bestPick: 'Mikal Bridges - Assists: 3.5 Over (+80)',
            hotStat: 'Assists',
            risingPlayer: 'Mikal Bridges',
            valueBook: 'FanDuel',
            topMarket: 'Player Props',
            aiInsight: '💰 15 high-value picks detected with 68% confidence rate'
          },
          playerTrendsData: [],
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
          hasRealData: false
        };
    }
  };

  // ✅ Helper to convert errors to string
  const getErrorMessage = (err: any): string | null => {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    return String(err);
  };

  // ✅ Debug logging (only in development)
  if (import.meta.env.DEV) {
    console.log('🔍 [AnalyticsScreen] HOOKS DEBUG:', {
      oddsData: { type: typeof oddsData, gamesCount: oddsData?.games?.length || 0 },
      oddsLoading,
      oddsError,
      trendsData: { type: typeof trendsData, trendsCount: trendsData?.trends?.length || 0 },
      trendsLoading,
      trendsError,
      analyticsDataFromHook: { type: typeof analyticsDataFromHook, selectionsCount: analyticsDataFromHook?.selections?.length || 0 },
      analyticsLoading,
      analyticsError,
      parlayData: { type: typeof parlayData, suggestionsCount: parlayData?.suggestions?.length || 0 },
      parlayLoading,
      parlayError,
      prizepicksSelections: { length: prizepicksSelections.length },
      prizepicksLoading,
      prizepicksError,
      selectedParlayType,
      activeParlayTab
    });
  }

  // ✅ UPDATED: Transform API data with prizepicks selections as primary source
  useEffect(() => {
    // Wait for player map to load before processing data to ensure team enrichment
    if (mapLoading) {
      if (import.meta.env.DEV) {
        console.log('⏳ [AnalyticsScreen] Waiting for player team map...');
      }
      return;
    }
    
    if (import.meta.env.DEV) {
      console.log('🔄 [AnalyticsScreen useEffect] Processing data...');
    }
    
    const allLoading = oddsLoading || trendsLoading || analyticsLoading || parlayLoading || prizepicksLoading;
    if (allLoading) {
      setLoading(true);
      return;
    }
    
    const allError = oddsError || trendsError || analyticsError || parlayError || prizepicksError;
    if (allError) {
      if (import.meta.env.DEV) {
        console.error('❌ [AnalyticsScreen] API Errors:', { oddsError, trendsError, analyticsError, parlayError, prizepicksError });
      }
      
      const errorMessage = 
        getErrorMessage(oddsError) ||
        getErrorMessage(trendsError) ||
        getErrorMessage(analyticsError) ||
        getErrorMessage(parlayError) ||
        getErrorMessage(prizepicksError) ||
        'Failed to load analytics data';
      
      setError(errorMessage);
      
      const mockData = getCurrentSportData();
      mockData.hasRealData = false;
      mockData.parlayAnalytics = getMockParlayAnalytics(selectedSport.toLowerCase());
      mockData.data_source = 'mock-fallback';
      mockData.scraped = false;
      setAnalyticsData(mockData);
      setLoading(false);
      return;
    }
    
    const processApiData = () => {
      if (import.meta.env.DEV) {
        console.log('🔍 [AnalyticsScreen] Processing ALL API data...');
      }
      
      let allSelections: any[] = [];
      let allTrends: any[] = [];
      
      // 👇 PRIMARY SOURCE: real prizepicks selections (289+ items)
      if (prizepicksSelections && prizepicksSelections.length > 0) {
        // Inside processApiData, when mapping prizepicksSelections:
        const mapped = prizepicksSelections.map((sel: any) => ({
          ...sel,
          source: 'prizepicks-api',
          value_side: sel.type?.toLowerCase(),
          edge: sel.edge ? parseFloat(sel.edge) : (sel.confidence === 'high' ? 15 : sel.confidence === 'medium' ? 10 : 5),
          team: sel.team || sel.team_abbr || playerTeamMap[sel.player] || 'UNKNOWN', // enrich team from map
        }));        
        allSelections = [...allSelections, ...mapped];
      }
      
      // Fallback sources (odds, analytics, parlay) – only used if prizepicks data is empty
      if (allSelections.length === 0) {
        // Extract from odds data
        if (oddsData?.games) {
          oddsData.games.forEach((game: any) => {
            if (game.player_props) {
              allSelections = [...allSelections, ...game.player_props.map((prop: any) => ({
                ...prop,
                source: 'odds-api',
                game: game.matchup || `${game.home_team} vs ${game.away_team}`,
                team: prop.team || playerTeamMap[prop.player] || 'UNKNOWN',
              }))];
            }
          });
        }
        
        // Extract from analytics data (including static NBA from backend)
        if (analyticsDataFromHook?.selections && Array.isArray(analyticsDataFromHook.selections)) {
          const mappedSelections = analyticsDataFromHook.selections.map((sel: any) => ({
            id: sel.id || `adv-${sel.player}-${sel.stat}`,
            player: sel.player,
            stat: sel.stat,
            line: sel.line,
            type: sel.type,
            projection: sel.projection,
            confidence: sel.confidence,
            odds: sel.odds,
            bookmaker: sel.bookmaker,
            game: sel.game || 'NBA Game',
            source: sel.source || 'static-nba',
            timestamp: sel.timestamp,
            stat_type: sel.stat,
            value_side: sel.type?.toLowerCase(),
            edge: sel.edge || (sel.confidence === 'high' ? 15 : sel.confidence === 'medium' ? 10 : 5),
            team: sel.team || playerTeamMap[sel.player] || 'UNKNOWN',
          }));
          allSelections = [...allSelections, ...mappedSelections];
        }
        
        // Extract from parlay data
        if (parlayData?.suggestions) {
          allSelections = [...allSelections, ...parlayData.suggestions.map((s: any) => ({
            ...s,
            team: s.team || playerTeamMap[s.player] || 'UNKNOWN',
          }))];
        }
      }
      
      // Extract trends from API if available
      if (trendsData?.trends) {
        allTrends = trendsData.trends;
      } else if (trendsData?.players) {
        allTrends = trendsData.players;
      }
      
      if (import.meta.env.DEV) {
        console.log('📊 [AnalyticsScreen] Combined data:', {
          totalSelections: allSelections.length,
          totalTrends: allTrends.length
        });
      }
      
      const hasRealData = allSelections.length > 0 || allTrends.length > 0;
      
      if (hasRealData) {
        if (import.meta.env.DEV) {
          console.log('✅ [AnalyticsScreen] Using REAL API data');
        }
        
        // Build analytics items from all selections (no limit)
        const analyticsItems: AnalyticsItem[] = allSelections.map((sel: any, index: number) => ({
          id: sel.id || `sel_${index}_${sel.player?.replace(/\s+/g, '_')}`,
          title: `${sel.player || 'Unknown'} - ${sel.stat || sel.stat_type || 'Stat'}`,
          metric: sel.stat || sel.stat_type || 'Unknown',
          value: sel.projection || sel.line || 0,
          change: sel.edge ? `${sel.edge}%` : sel.confidence === 'high' ? '15%' : sel.confidence === 'medium' ? '10%' : '5%',
          trend: (sel.type || sel.value_side || '') === 'over' ? 'up' : (sel.type || sel.value_side || '') === 'under' ? 'down' : 'neutral',
          sport: sel.sport || selectedSport,
          sample_size: 1,
          timestamp: sel.timestamp || new Date().toISOString(),
          player: sel.player,
          line: sel.line,
          projection: sel.projection,
          projection_diff: sel.projection_diff,
          value_side: sel.type || sel.value_side,
          game: sel.game,
          edge: sel.edge ? parseFloat(sel.edge) : (sel.confidence === 'high' ? 15 : sel.confidence === 'medium' ? 10 : 5),
          type: sel.type,
          odds: sel.odds,
          bookmaker: sel.bookmaker,
          confidence: sel.confidence,
          stat: sel.stat || sel.stat_type,
          source: sel.source,
          team: sel.team || playerTeamMap[sel.player] || 'UNKNOWN', // ensure team is set
        }));
        
        // Build player trends from selections if no trends API data
        let playerTrendsData: PlayerTrendItem[] = [];
        if (allTrends.length > 0) {
          playerTrendsData = allTrends.slice(0, 50).map((trend: any, index: number) => ({
            id: trend.id || `trend_${index}`,
            player: trend.player || trend.name,
            trend: trend.trend || trend.direction || 'stable',
            metric: trend.metric || trend.stat || trend.position,
            value: trend.value || trend.average || trend.points || 0,
            change: trend.change || trend.improvement || '0%',
            analysis: trend.analysis || trend.reason || 'No analysis available',
            confidence: trend.confidence || (trend.accuracy ? parseFloat(trend.accuracy) : 0.5),
            timestamp: trend.timestamp || new Date().toISOString(),
            is_real_data: true,
            team: trend.team || playerTeamMap[trend.player] || 'UNKNOWN',
          }));
        } else {
          // Derive trends from selections
          const playerMap = new Map<string, { totalEdge: number; count: number; player: string; team?: string }>();
          allSelections.forEach((sel: any) => {
            if (sel.player) {
              const player = sel.player;
              const edge = sel.edge ? parseFloat(sel.edge) : (sel.confidence === 'high' ? 15 : sel.confidence === 'medium' ? 10 : 5);
              const current = playerMap.get(player) || { totalEdge: 0, count: 0, player, team: sel.team };
              current.totalEdge += edge;
              current.count += 1;
              playerMap.set(player, current);
            }
          });
          
          playerTrendsData = Array.from(playerMap.values())
            .map((p, idx) => ({
              id: `trend_${idx}`,
              player: p.player,
              trend: p.totalEdge / p.count > 10 ? 'up' : p.totalEdge / p.count > 5 ? 'stable' : 'down',
              metric: 'Average Edge',
              value: Math.round((p.totalEdge / p.count) * 10) / 10,
              change: `${Math.round((p.totalEdge / p.count) * 10) / 10}%`,
              analysis: `Based on ${p.count} props, average edge ${(p.totalEdge / p.count).toFixed(1)}%`,
              confidence: 0.7,
              timestamp: new Date().toISOString(),
              is_real_data: true,
              team: p.team,
              avg_edge: p.totalEdge / p.count,
              total_picks: p.count
            }))
            .sort((a, b) => (b.avg_edge || 0) - (a.avg_edge || 0))
            .slice(0, 20);
        }
        
        const highConfidenceCount = allSelections.filter((sel: any) => 
          sel.confidence === 'high' || (sel.edge && parseFloat(sel.edge) > 10)
        ).length;
        const highConfidencePct = allSelections.length > 0 
          ? Math.round((highConfidenceCount / allSelections.length) * 100) 
          : 0;
        
        let bestPick = '';
        let bestPickDetails = '';
        if (allSelections.length > 0) {
          const bestSelection = allSelections.sort((a, b) => (parseFloat(b.edge) || 0) - (parseFloat(a.edge) || 0))[0];
          if (bestSelection) {
            bestPick = bestSelection.player || 'Top Player';
            const oddsText = bestSelection.odds ? ` (${bestSelection.odds})` : '';
            bestPickDetails = `${bestSelection.stat || 'Stat'}: ${bestSelection.line || 'N/A'} ${bestSelection.type || ''}${oddsText}`;
          }
        }
        
        const transformedData: AnalyticsData = {
          overview: {
            totalGames: Math.max(allSelections.length / 3, 50),
            avgPoints: 112.4,
            homeWinRate: `${Math.min(100, Math.floor(allSelections.length / 15) + 50)}%`,
            avgMargin: 11.8,
            overUnder: `${50 + Math.floor(highConfidencePct / 2)}% Over`,
            keyTrend: allSelections.length > 0 ? 
              `${allSelections.length} player props • ${highConfidenceCount} high-confidence picks` : 
              'Real-time analytics enabled',
          },
          advancedStats: {
            totalProps: allSelections.length,
            highConfidence: `${highConfidencePct}%`,
            avgOdds: '+105',
            coverage: `${Math.min(100, Math.floor(allSelections.length / 10))}%`,
            accuracy: '72%',
            roi: '+8.5%'
          },
          trendingStats: {
            bestPick: bestPick ? `${bestPick} - ${bestPickDetails}` : 'Mikal Bridges - Assists: 3.5 Over (+80)',
            hotStat: allSelections.length > 0 ? 
              (() => {
                const stats = allSelections.map((s: any) => s.stat || s.stat_type);
                const mostCommon = stats.reduce((a: any, b: any) => 
                  (stats.filter((v: any) => v === a).length >= stats.filter((v: any) => v === b).length) ? a : b
                );
                return mostCommon || 'Points';
              })() : 'Assists',
            risingPlayer: playerTrendsData.length > 0 ? playerTrendsData[0].player || 'Trending Player' : 'Mikal Bridges',
            valueBook: allSelections.length > 0 ? 
              (() => {
                const bookmakers = allSelections.map((s: any) => s.bookmaker).filter(Boolean);
                return bookmakers[0] || 'FanDuel';
              })() : 'FanDuel',
            topMarket: 'Player Props',
            aiInsight: `💰 ${highConfidenceCount} high-value picks detected with ${highConfidencePct}% confidence rate`
          },
          playerTrendsData: playerTrendsData,
          rawAnalytics: analyticsItems,
          hasRealData: true,
          parlayAnalytics: generateParlayAnalyticsFromSelections(allSelections, selectedSport.toLowerCase()),
          data_source: prizepicksSelections.length > 0 ? 'prizepicks-api' : 'fallback',
          scraped: true
        };
        
        return transformedData;
      } else {
        if (import.meta.env.DEV) {
          console.log('⚠️ [AnalyticsScreen] No real API data found, using mock data');
        }
        const mockData = getCurrentSportData();
        mockData.hasRealData = false;
        mockData.parlayAnalytics = getMockParlayAnalytics(selectedSport.toLowerCase());
        mockData.data_source = 'mock-fallback';
        mockData.scraped = false;
        return mockData;
      }
    };
    
    try {
      const transformedData = processApiData();
      setAnalyticsData(transformedData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('❌ Error processing analytics data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error processing data');
      // Fallback to mock data
      const mockData = getCurrentSportData();
      mockData.hasRealData = false;
      mockData.parlayAnalytics = getMockParlayAnalytics(selectedSport.toLowerCase());
      setAnalyticsData(mockData);
      setLoading(false);
    }
    
    // Attach debug info to window only in development
    if (import.meta.env.DEV) {
      window[`_advancedanalyticsscreenDebug`] = {
        prizepicksSelections,
        oddsData,
        trendsData,
        analyticsDataFromHook,
        parlayData,
        analyticsData,
        timestamp: new Date().toISOString()
      };
    }
    
  }, [
    oddsData, oddsLoading, oddsError,
    trendsData, trendsLoading, trendsError,
    analyticsDataFromHook, analyticsLoading, analyticsError,
    parlayData, parlayLoading, parlayError,
    prizepicksSelections, prizepicksLoading, prizepicksError,
    selectedSport, selectedParlayType,
    mapLoading, // ADDED: wait for map
    playerTeamMap // ADDED: for enrichment
  ]);

  // ✅ Memoize sportData
  const sportData = useMemo(() => {
    return analyticsData || getCurrentSportData();
  }, [analyticsData, selectedSport]);

  // ✅ Filter data based on search query
  useEffect(() => {
    if (!searchQuery.trim() || !sportData?.rawAnalytics) {
      setFilteredData([]);
      return;
    }
      
    const query = searchQuery.toLowerCase();
    const filtered = sportData.rawAnalytics.filter(item => {
      const searchable = [
        item.player,
        item.stat,
        item.metric,
        item.game,
        item.team,
        item.type,
        item.value_side,
      ].filter(Boolean).map(s => String(s).toLowerCase());
        
      return searchable.some(field => field.includes(query));
    });
  
    setFilteredData(filtered);
    if (import.meta.env.DEV) {
      console.log(`🔍 Search for "${searchQuery}" found ${filtered.length} results`);
    }
  }, [searchQuery, sportData]);

  // ✅ NEW: Filtered value picks based on advanced filters
  const getFilteredValuePicks = useCallback(() => {
    if (!sportData.rawAnalytics) return [];
    
    return sportData.rawAnalytics.filter(item => {
      // Edge filter (percentage)
      const edge = item.edge || 0;
      if (edge < edgeMin) return false;

      // Confidence filter
      if (confidenceFilter !== 'all') {
        const conf = item.confidence?.toLowerCase() || '';
        if (conf !== confidenceFilter) return false;
      }

      // Side filter (over/under)
      if (sideFilter !== 'all') {
        const side = item.value_side?.toLowerCase() || item.type?.toLowerCase() || '';
        if (side !== sideFilter) return false;
      }

      return true;
    });
  }, [sportData.rawAnalytics, edgeMin, confidenceFilter, sideFilter]);

  // ✅ NEW: get top player picks from real data (sorted by edge)
  const getTopPlayerPicks = useCallback(() => {
    if (!sportData.rawAnalytics || !Array.isArray(sportData.rawAnalytics)) return [];
    return [...sportData.rawAnalytics]
      .sort((a, b) => (b.edge || 0) - (a.edge || 0))
      .slice(0, 20);
  }, [sportData.rawAnalytics]);

  // ✅ INTEGRATED: Generate parlay analytics from selections
  const generateParlayAnalyticsFromSelections = (selections: any[], sport: string): ParlayAnalytics => {
    const successRates: Record<string, any> = {};
    ['nba', 'nfl', 'nhl', 'mlb'].forEach(s => {
      successRates[s] = {
        standard: { success_rate: Math.floor(Math.random() * 30) + 45, avg_odds: -110, trend: 'stable' as const },
        same_game: { success_rate: Math.floor(Math.random() * 25) + 30, avg_odds: +150, trend: 'up' as const },
        teaser: { success_rate: Math.floor(Math.random() * 20) + 55, avg_odds: -130, trend: 'stable' as const },
        pleaser: { success_rate: Math.floor(Math.random() * 15) + 15, avg_odds: +250, trend: 'warning' as const }
      }[selectedParlayType] || { success_rate: 50, avg_odds: -110, trend: 'stable' };
    });

    const propOpportunities = selections
      .filter(sel => sel.confidence === 'high' || (sel.edge && parseFloat(sel.edge) > 10))
      .slice(0, 5)
      .map(sel => ({
        player: sel.player || 'LeBron James',
        prop: sel.stat || 'Points',
        line: sel.line || 25.5,
        market_odds: sel.odds || '-110',
        projected_value: sel.projection || 28.4,
        edge: `${sel.edge || 15}%`,
        confidence: sel.confidence || 'high' as const,
        recommendation: (sel.type === 'over' ? 'Over' : 'Under') as 'Over' | 'Under',
        game: sel.game || 'LAL vs BOS',
        tipoff: '7:30 PM ET'
      }));

    return {
      parlay_success_rates: successRates,
      prop_value_opportunities: propOpportunities.length > 0 ? propOpportunities : getMockPropOpportunities(),
      live_betting_trends: [],
      correlated_parlay_opportunities: getMockCorrelatedParlays(),
      sport_specific_metrics: {},
      optimal_strategy: {
        recommended_legs: 3,
        value_threshold: '5%',
        best_parlay_type: selectedParlayType,
        avoid_correlation: ['QB-WR', 'PG-C']
      },
      market_sentiment: {},
      sharp_money_movements: {
        line_moves: '3 significant moves detected',
        reverse_line_movement: '2 games with RLM',
        steam_moves: '1 active steam move',
        liability_alerts: 'Medium risk on 2 parlays'
      },
      data_sources: ['the-odds-api', 'prizepicks', 'sportsdata.io'],
      season_progress: '62% complete'
    };
  };

  // ✅ EXISTING team data (abbreviated for space)
  const teams = {
    NBA: [
      { id: 'lakers', name: 'Los Angeles Lakers' },
      // ... (keep as in original)
    ],
    // ...
  };

  // ✅ EXISTING sports data
  const sports = [
    { id: 'NBA', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6' },
    { id: 'NHL', name: 'NHL', icon: <SportsHockeyIcon />, color: '#1e40af' },
    { id: 'MLB', name: 'MLB', icon: <SportsBaseballIcon />, color: '#10b981' },
    { id: 'Soccer', name: 'Soccer', icon: <SportsSoccerIcon />, color: '#14b8a6' }
  ];

  // ✅ UPDATED metrics tabs – added 'top-picks' and 'smart-prompts'
  const metrics = [
    { id: 'overview', label: 'Overview', icon: <AnalyticsIcon /> },
    { id: 'trends', label: 'Trends', icon: <TrendingUpIcon /> },
    { id: 'teams', label: 'Teams', icon: <GroupIcon /> },
    { id: 'players', label: 'Players', icon: <PersonIcon /> },
    { id: 'advanced', label: 'Advanced', icon: <BarChartIcon /> },
    { id: 'value', label: 'Value Picks', icon: <LocalOfferIcon /> },
    { id: 'top-picks', label: 'Top Player Picks', icon: <EmojiEventsIcon /> },
    { id: 'smart-prompts', label: 'Smart Search Prompts', icon: <SearchIcon /> }
  ];

  // ✅ INTEGRATED: Parlay type selector data
  const parlayTypes = [
    { id: 'standard' as ParlayType, name: 'Standard', icon: <CasinoIcon /> },
    { id: 'same_game' as ParlayType, name: 'Same Game', icon: <CompareArrowsIcon /> },
    { id: 'teaser' as ParlayType, name: 'Teaser', icon: <ShieldIcon /> },
    { id: 'pleaser' as ParlayType, name: 'Pleaser', icon: <WhatshotIcon /> }
  ];

  // ✅ UPDATED: handleGeneratePredictions with improved search (from File 1)
const handleGeneratePredictions = async () => {
  if (!customQuery.trim()) {
    alert('Please enter a prediction query');
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
      // fallback to existing rawAnalytics
      selections = sportData.rawAnalytics || [];
    }

    // ==================== ENHANCED SEARCH ====================
    const query = customQuery.toLowerCase().trim();
    // Split query into meaningful keywords (ignore words <= 2 chars)
    const keywords = query.split(/\s+/).filter(k => k.length > 2);

    // Synonym mapping for common terms
    const synonymMap: Record<string, string[]> = {
      shooting: ['points', 'field goals', 'fg', 'fg%', 'field goal percentage', 'scoring'],
      percentage: ['%', 'pct', 'percent', 'average'],
      best: ['top', 'highest', 'leaders', 'elite'],
      stats: ['statistics', 'numbers', 'averages', 'per game'],
      player: ['players', 'athlete', 'athletes'],
      team: ['teams', 'franchise', 'squad'],
      // Add more as needed for your domain
    };

    // Expand keywords with synonyms
    const expandedKeywords = keywords.flatMap(k => [k, ...(synonymMap[k] || [])]);

    const filteredSelections = selections.filter((sel: any) => {
      // Build an array of searchable fields from the selection
      const searchable = [
        sel.player,
        sel.name,
        sel.stat,
        sel.stat_type,
        sel.metric,
        sel.game,
        sel.analysis,
        sel.description,
        sel.title,
        sel.team,
        sel.opponent,
        sel.bookmaker,
        sel.source,
        sel.sport,
        sel.league,
        sel.matchup,
      ].filter(Boolean).map(s => String(s).toLowerCase());

      // Also include full analysis/description text (already included, but ensure)
      if (sel.analysis) searchable.push(String(sel.analysis).toLowerCase());
      if (sel.description) searchable.push(String(sel.description).toLowerCase());

      // If no expanded keywords (e.g., query was very short), fall back to original query
      if (expandedKeywords.length === 0) {
        return searchable.some(field => field.includes(query));
      }

      // Require at least one expanded keyword to match any field
      return expandedKeywords.some(keyword =>
        searchable.some(field => field.includes(keyword))
      );
    });
    // ==========================================================

    const picksToAnalyze = filteredSelections.length > 0 ? filteredSelections : selections;
    const note = filteredSelections.length === 0 && selections.length > 0
      ? '⚠️ No picks directly matching your query – showing all available picks.'
      : '';

    // Classify confidence based on available fields
    const highConfidence = picksToAnalyze.filter((sel: any) => {
      const score = typeof sel.confidence === 'number' ? sel.confidence : parseFloat(sel.confidence);
      if (!isNaN(score)) return score >= 70;
      const confStr = String(sel.confidence || '').toLowerCase();
      if (confStr === 'high') return true;
      if (sel.edge && parseFloat(sel.edge) > 10) return true;
      return false;
    });

    const mediumConfidence = picksToAnalyze.filter((sel: any) => {
      if (highConfidence.includes(sel)) return false;
      const score = typeof sel.confidence === 'number' ? sel.confidence : parseFloat(sel.confidence);
      if (!isNaN(score)) return score >= 40 && score < 70;
      const confStr = String(sel.confidence || '').toLowerCase();
      if (confStr === 'medium') return true;
      if (sel.edge && parseFloat(sel.edge) > 5) return true;
      return false;
    });

    const unknownConfidence = picksToAnalyze.filter(sel => 
      !highConfidence.includes(sel) && !mediumConfidence.includes(sel)
    );

    if (import.meta.env.DEV) {
      console.log('🔍 picksToAnalyze length:', picksToAnalyze.length);
      console.log('🔍 highConfidence length:', highConfidence.length);
      console.log('🔍 mediumConfidence length:', mediumConfidence.length);
      console.log('🔍 unknownConfidence length:', unknownConfidence.length);
    }

    // Combine all picks and shuffle to show variety
    const allPicks = [...highConfidence, ...mediumConfidence, ...unknownConfidence];
    const shuffled = [...allPicks].sort(() => 0.5 - Math.random());
    const topPicks = shuffled.slice(0, 10);

    const formattedResults = {
      success: true,
      analysis: `🎯 **AI Prediction Results**\n\nBased on ${picksToAnalyze.length} player prop analyses for "${customQuery}":\n\n` +
        (note ? `${note}\n\n` : '') +
        `📊 **Confidence Breakdown:**\n` +
        `   • High Confidence: ${highConfidence.length} picks\n` +
        `   • Medium Confidence: ${mediumConfidence.length} picks\n` +
        `   • Unknown Confidence: ${unknownConfidence.length} picks\n\n` +
        `🔥 **Top 10 Picks for ${selectedSport} (randomized for variety):**\n\n` +
        (topPicks.length > 0 
          ? topPicks.map((pick: any, idx: number) => {
              const player = pick.player || pick.name || 'Unknown Player';
              const stat = pick.stat || pick.stat_type || pick.metric || 'Stat';
              const line = pick.line || 'N/A';
              const type = pick.type || pick.value_side || '';
              const projection = pick.projection || pick.projected_value || 'N/A';
              const confidence = pick.confidence || (pick.edge ? (parseFloat(pick.edge) > 10 ? 'high' : 'medium') : 'unknown');
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
    setTimeout(() => setGeneratingPredictions(false), 1500);

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Error generating predictions:', error);
    }
    // Fallback – use existing analytics data if available
    let fallbackSelections = sportData.rawAnalytics || [];
    const fallbackAnalysis = fallbackSelections.length > 0
      ? `Based on current ${selectedSport} analytics data (${fallbackSelections.length} props):\n\n` +
        fallbackSelections.slice(0, 5).map((sel: any, i: number) => 
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

  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
    }
  };

  const handleRefresh = useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('🔄 [handleRefresh] Manual refresh triggered');
    }
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
  }, [refetchOdds, refetchTrends, refetchAnalytics, refetchParlay, refetchPrizepicks]);

  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
    handleRefresh();
  };

  const handleMetricChange = (event: any, newValue: string) => {
    setSelectedMetric(newValue);
  };

  // ✅ INTEGRATED: Parlay handlers
  const handleParlayTypeChange = (type: ParlayType) => {
    setSelectedParlayType(type);
  };

  const handleParlayTabChange = (tab: 'overview' | 'props' | 'correlated' | 'sharp') => {
    setActiveParlayTab(tab);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  // Value Picks Panel with filters
  const ValuePicksPanel = () => {
    const filteredData = getFilteredValuePicks();
    if (!filteredData || filteredData.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h6">No value picks match your filters</Typography>
        </Paper>
      );
    }
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LocalOfferIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5">🔍 Advanced Value Filter</Typography>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Minimum Edge (%)</Typography>
            <Slider
              value={edgeMin}
              onChange={(_, val) => setEdgeMin(val as number)}
              min={0}
              max={30}
              step={1}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Confidence</InputLabel>
              <Select
                value={confidenceFilter}
                label="Confidence"
                onChange={(e) => setConfidenceFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Side</InputLabel>
              <Select
                value={sideFilter}
                label="Side"
                onChange={(e) => setSideFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="over">Over</MenuItem>
                <MenuItem value="under">Under</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredData.length} of {sportData.rawAnalytics?.length || 0} value picks
        </Typography>

        <MetricsDashboard data={filteredData} />
      </Paper>
    );
  };

  // render Smart Search Prompts tab with 10 custom prompt boxes
  const renderSmartPrompts = () => {
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SearchIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">
            🔍 10 Custom Smart Search Prompts
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {CUSTOM_PROMPTS.map((prompt, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => {
                  setCustomQuery(prompt);
                  setTimeout(() => handleGeneratePredictions(), 100);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SearchIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                    <Typography variant="body2">
                      {prompt}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Tap any prompt to instantly generate an AI prediction based on that query.
          </Typography>
        </Alert>
      </Paper>
    );
  };

  // render Top Player Picks tab (now using real data)
  const renderTopPlayerPicks = () => {
    const topPicks = getTopPlayerPicks();
    if (topPicks.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h5">No top picks available</Typography>
        </Paper>
      );
    }
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EmojiEventsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">
            🏆 Top 20 Player Picks by Edge (Real Data)
          </Typography>
        </Box>
        <MetricsDashboard data={topPicks} />
      </Paper>
    );
  };

  // Parlay render functions (unchanged, keep as in original)
  const renderParlayTypeSelector = () => {
    if (!sportData.parlayAnalytics) return null;
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CasinoIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">🎲 Parlay Type</Typography>
        </Box>
        <Grid container spacing={2}>
          {parlayTypes.map((type) => (
            <Grid item xs={12} sm={6} md={3} key={type.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: selectedParlayType === type.id ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleParlayTypeChange(type.id)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: 'primary.main', mb: 1, fontSize: 32 }}>
                    {type.icon}
                  </Box>
                  <Typography variant="body1" fontWeight="medium" gutterBottom>
                    {type.name}
                  </Typography>
                  {sportData.parlayAnalytics?.parlay_success_rates[selectedSport.toLowerCase()] && (
                    <Chip 
                      label={`${sportData.parlayAnalytics.parlay_success_rates[selectedSport.toLowerCase()]?.success_rate || 0}% SR`}
                      size="small"
                      color={selectedParlayType === type.id ? 'primary' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderOptimalStrategy = () => {
    if (!sportData.parlayAnalytics?.optimal_strategy) return null;
    const strategy = sportData.parlayAnalytics.optimal_strategy;
    return (
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h5" sx={{ color: 'white' }}>
            🎯 Optimal Strategy - Feb 2026
          </Typography>
        </Box>
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Recommended Legs
              </Typography>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                {strategy.recommended_legs}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Value Threshold
              </Typography>
              <Typography variant="h3" sx={{ color: '#4ade80', fontWeight: 'bold' }}>
                {strategy.value_threshold}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                Best Type
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {strategy.best_parlay_type.replace(/_/g, ' ')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ borderColor: '#334155', my: 2 }} />
        <Box>
          <Typography variant="body2" sx={{ color: '#f97316', fontWeight: 'bold', mb: 1 }}>
            ⚠️ Avoid:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {strategy.avoid_correlation.map((item, index) => (
              <Chip
                key={index}
                label={item}
                size="small"
                sx={{ 
                  bgcolor: '#334155',
                  color: 'white',
                  '& .MuiChip-label': { fontWeight: 500 }
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    );
  };

  const renderPropValueOpportunities = () => {
    const props = sportData.parlayAnalytics?.prop_value_opportunities;
    if (!props || props.length === 0) return null;
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LocalOfferIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h5">🔥 Top Prop Value Opportunities</Typography>
        </Box>
        <Grid container spacing={3}>
          {props.map((prop, index) => (
            <Grid item xs={12} key={index}>
              <Card sx={{ 
                borderLeft: `4px solid ${
                  prop.confidence === 'high' ? '#22c55e' : 
                  prop.confidence === 'medium' ? '#eab308' : '#94a3b8'
                }`
              }}>
                <CardContent>
                  {/* ... rest of card (keep as in original) */}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderCorrelatedParlays = () => {
    const parlays = sportData.parlayAnalytics?.correlated_parlay_opportunities;
    if (!parlays || parlays.length === 0) return null;
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CompareArrowsIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h5">🔄 Correlated Parlay Opportunities</Typography>
        </Box>
        <Grid container spacing={3}>
          {parlays.map((parlay, index) => (
            <Grid item xs={12} md={6} key={index}>
              {/* ... card (keep as in original) */}
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderSharpMoney = () => {
    if (!sportData.parlayAnalytics?.sharp_money_movements) return null;
    const sharp = sportData.parlayAnalytics.sharp_money_movements;
    return (
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#fffbeb', border: 1, borderColor: '#fcd34d' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ShieldIcon sx={{ mr: 1, color: '#92400e' }} />
          <Typography variant="h5" sx={{ color: '#78350f' }}>🦈 Sharp Money Indicators</Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'transparent', boxShadow: 'none', border: 'none' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#92400e', mb: 1 }}>
                  Line Movement
                </Typography>
                <Typography variant="h6" sx={{ color: '#78350f', fontWeight: 'bold' }}>
                  {sharp.line_moves}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'transparent', boxShadow: 'none', border: 'none' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#92400e', mb: 1 }}>
                  Steam Moves
                </Typography>
                <Typography variant="h6" sx={{ color: '#78350f', fontWeight: 'bold' }}>
                  {sharp.steam_moves}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'transparent', boxShadow: 'none', border: 'none' }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: '#92400e', mb: 1 }}>
                  Liability Alert
                </Typography>
                <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 'bold' }}>
                  {sharp.liability_alerts}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        {sharp.reverse_line_movement && (
          <Alert severity="warning" sx={{ mt: 2, bgcolor: '#fef3c7' }}>
            <Typography variant="body2" fontWeight="medium">
              Reverse Line Movement: {sharp.reverse_line_movement}
            </Typography>
          </Alert>
        )}
      </Paper>
    );
  };

  const renderParlayTabs = () => {
    if (!sportData.parlayAnalytics) return null;
    return (
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeParlayTab}
          onChange={(e, val) => handleParlayTabChange(val)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="overview" label="Overview" icon={<AnalyticsIcon />} iconPosition="start" />
          <Tab value="props" label="Props" icon={<LocalOfferIcon />} iconPosition="start" />
          <Tab value="correlated" label="Correlated" icon={<CompareArrowsIcon />} iconPosition="start" />
          <Tab value="sharp" label="Sharp" icon={<ShieldIcon />} iconPosition="start" />
        </Tabs>
      </Paper>
    );
  };

  const renderDataSources = () => {
    if (!sportData.parlayAnalytics?.data_sources) return null;
    return (
      <Paper sx={{ p: 2, mt: 2, mb: 2, bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            📡 Data sources: {sportData.parlayAnalytics.data_sources.map(s => 
              s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            ).join(', ')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 500 }}>
            🏆 Season progress: {sportData.parlayAnalytics.season_progress}
          </Typography>
        </Box>
      </Paper>
    );
  };

  const renderSuccessRateChart = () => {
    if (!sportData.parlayAnalytics?.parlay_success_rates) return null;
    const sports = ['nba', 'nfl', 'nhl', 'mlb'];
    const successRates = sports.map(s => 
      sportData.parlayAnalytics?.parlay_success_rates[s]?.success_rate || 0
    );
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
          {selectedParlayType.replace(/_/g, ' ')} Parlay Success Rates by Sport
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {sports.map((sport, index) => (
            <Grid item xs={6} sm={3} key={sport}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {sport.toUpperCase()}
                </Typography>
                <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 'bold' }}>
                  {successRates[index]}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={successRates[index]} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    mt: 1,
                    bgcolor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#3b82f6'
                    }
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // Main UI render functions
  const renderHeader = () => {
    return (
      <Box sx={{
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        py: 6,
        px: 4,
        borderRadius: 3,
        mb: 4,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)'
        }} />
        <Container maxWidth="lg">
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  🤖 AI Analytics & Predictions Hub
                </Typography>
                <Typography variant="h5" sx={{ opacity: 0.9 }}>
                  {sportData.hasRealData ? '✅ Using REAL API Data' : '⚠️ Using Demo Data'}
                </Typography>
              </Box>
              <IconButton 
                color="inherit" 
                onClick={() => setShowSearch(!showSearch)}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
              >
                <SearchIcon />
              </IconButton>
            </Box>

            {showSearch && (
              <Paper sx={{ mt: 3, p: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search analytics, predictions, or trends..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchInput && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchInput('')}>
                          <CloseIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Paper>
            )}
          </Box>
        </Container>
      </Box>
    );
  };

  const renderRefreshIndicator = () => {
    const hasStaticNba = sportData.rawAnalytics?.some(item => item.source === 'static-nba');
    const dataSource = sportData.data_source;
    const scraped = sportData.scraped;

    return (
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <RefreshIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          {sportData.hasRealData && (
            <Chip 
              label="Real Data" 
              size="small" 
              color="success" 
              sx={{ ml: 2 }}
              icon={<CheckCircleIcon />}
            />
          )}
          {dataSource && (
            <Chip 
              label={dataSource === 'prizepicks-api' ? 'PrizePicks API' : dataSource}
              size="small" 
              color={dataSource.includes('prizepicks') ? 'info' : (dataSource.includes('static') || dataSource.includes('mock') ? 'default' : 'info')}
              sx={{ ml: 1 }}
              icon={dataSource.includes('prizepicks') ? <CasinoIcon /> : (dataSource.includes('static') ? <SportsBasketballIcon /> : <AnalyticsIcon />)}
            />
          )}
          {scraped !== undefined && (
            <Chip 
              label={scraped ? 'Live' : 'Cached'} 
              size="small" 
              color={scraped ? 'success' : 'warning'}
              sx={{ ml: 1 }}
              icon={scraped ? <BoltIcon /> : <WarningIcon />}
            />
          )}
          {sportData.parlayAnalytics && (
            <Chip 
              label={`Parlay Mode`} 
              size="small" 
              color="info" 
              sx={{ ml: 1 }}
              icon={<CasinoIcon />}
            />
          )}
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outlined"
          size="small"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Paper>
    );
  };

  const renderSportSelector = () => {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Select Sport
        </Typography>
        <Grid container spacing={2}>
          {sports.map((sport: any) => (
            <Grid item key={sport.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: selectedSport === sport.id ? `2px solid ${sport.color}` : '2px solid transparent',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  }
                }}
                onClick={() => handleSportChange({ target: { value: sport.id } })}
              >
                <CardContent sx={{ textAlign: 'center', minWidth: 100 }}>
                  <Box sx={{ color: sport.color, mb: 1, fontSize: 32 }}>
                    {sport.icon}
                  </Box>
                  <Typography variant="body2" fontWeight="medium">
                    {sport.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderMetricTabs = () => {
    return (
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={selectedMetric}
          onChange={handleMetricChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {metrics.map((metric: any) => (
            <Tab
              key={metric.id}
              value={metric.id}
              label={metric.label}
              icon={metric.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>
    );
  };

  const renderPredictionGenerator = () => {
    return (
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            🚀 AI Prediction Generator
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate custom predictions using advanced AI models
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Prediction Queries
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
            {predictionQueries.map((query: string, index: number) => (
              <Chip
                key={index}
                label={query}
                onClick={() => setCustomQuery(query)}
                icon={<SparklesIcon />}
                sx={{ 
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.main'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Custom Prediction Query
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Enter custom prediction query..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleGeneratePredictions}
              disabled={!customQuery.trim() || generatingPredictions}
              sx={{ flex: 2 }}
            >
              {generatingPredictions ? 'Generating...' : 'Generate AI Prediction'}
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => {
                setCustomQuery("Get NBA player props for tonight");
                setTimeout(() => handleGeneratePredictions(), 100);
              }}
              sx={{ flex: 1 }}
            >
              Test API
            </Button>
          </Box>
        </Box>

        {predictionResults && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Latest Prediction Results
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {predictionResults.analysis || predictionResults.prediction}
            </Typography>
            {predictionResults.source && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Source: {predictionResults.source}
              </Typography>
            )}
          </Box>
        )}

        <Alert severity="info" icon={<PsychologyIcon />}>
          Uses neural networks, statistical modeling, and historical data for accurate predictions
        </Alert>
      </Paper>
    );
  };

  const renderOverview = () => {
    if (!sportData.overview) return null;
    return (
      <>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            📊 Season Overview - {selectedSport}
          </Typography>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <EmojiEventsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.totalGames}</Typography>
                  <Typography variant="body2" color="text.secondary">Games Tracked</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.homeWinRate}</Typography>
                  <Typography variant="body2" color="text.secondary">Home Win Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <BarChartIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.avgPoints}</Typography>
                  <Typography variant="body2" color="text.secondary">Avg Points/Game</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <MonetizationOnIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4">{sportData.overview.overUnder}</Typography>
                  <Typography variant="body2" color="text.secondary">Over Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" icon={<BoltIcon />}>
            <Typography variant="body1" fontWeight="medium">
              🔥 Current Trend: {sportData.overview.keyTrend}
            </Typography>
          </Alert>
        </Paper>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filter by Team
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="All Teams"
              onClick={() => setSelectedTeam('all')}
              color={selectedTeam === 'all' ? 'primary' : 'default'}
              variant={selectedTeam === 'all' ? 'filled' : 'outlined'}
            />
            {teams[selectedSport as keyof typeof teams]?.map((team: any) => (
              <Chip
                key={team.id}
                label={team.name.split(' ').pop()}
                onClick={() => setSelectedTeam(team.id)}
                color={selectedTeam === team.id ? 'primary' : 'default'}
                variant={selectedTeam === team.id ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Paper>
      </>
    );
  };

  const renderTrendingStats = () => {
    const trendingStatsObj = sportData?.trendingStats || {};
    const trendingStatsEntries = Object.entries(trendingStatsObj);

    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🚀 Trending This Season
        </Typography>
        <Grid container spacing={3}>
          {trendingStatsEntries.map(([key, value], index) => (
            <Grid item xs={12} sm={6} key={key}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {key === 'aiInsight' ? (
                      <SparklesIcon sx={{ mr: 1, color: 'primary.main' }} />
                    ) : key === 'bestPick' ? (
                      <EmojiEventsIcon sx={{ mr: 1, color: 'warning.main' }} />
                    ) : key === 'valueBook' ? (
                      <MonetizationOnIcon sx={{ mr: 1, color: 'success.main' }} />
                    ) : (
                      <TrendingUpIcon sx={{ mr: 1, color: index % 2 === 0 ? 'success.main' : 'info.main' }} />
                    )}
                    <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {String(value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderAdvancedMetrics = () => {
    const advancedStatsObj = sportData?.advancedStats || {};
    const advancedStatsEntries = Object.entries(advancedStatsObj);

    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScienceIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5">
            🧠 Advanced Metrics
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {advancedStatsEntries.map(([key, value]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {String(value)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, Number(value) * (key.includes('%') ? 1 : 2))} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  // Updated MetricsDashboard with "Load More" button (keep as in original)
  const MetricsDashboard = ({ data }: { data: any[] }) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <BarChartIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
          <Typography variant="h4" gutterBottom>
            📊 Player Prop Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            No player prop data available
          </Typography>
        </Paper>
      );
    }

    const formattedData = data.map((item: any) => {
      let confidence = 'medium';
      if (typeof item.confidence === 'string') {
        confidence = item.confidence.toLowerCase();
      } else if (typeof item.confidence === 'number') {
        if (item.confidence >= 0.7) confidence = 'high';
        else if (item.confidence >= 0.4) confidence = 'medium';
        else confidence = 'low';
      }

      const edge = item.edge || (confidence === 'high' ? 15 : confidence === 'medium' ? 10 : 5);
      const valueSide = item.type || item.value_side || '';
      const odds = item.odds || '+100';
      const bookmaker = item.bookmaker || 'Unknown';

      const game = typeof item.game === 'string' ? item.game : 
                   (item.game ? JSON.stringify(item.game) : 'Game info not available');

      return {
        ...item,
        title: `${item.player || 'Player'} - ${item.stat || item.metric || 'Stat'}`,
        description: `${game} • Line: ${item.line || 'N/A'}`,
        value: `${valueSide === 'over' ? '↑' : '↓'} ${edge}%`,
        formattedEdge: `${edge}%`,
        valueSide,
        odds,
        bookmaker,
        confidence,
        color: edge > 10 ? 'success' : edge > 5 ? 'warning' : 'default'
      };
    });

    // Determine how many items to show based on showAllPicks and picksLimit
    const itemsToShow = showAllPicks ? formattedData : formattedData.slice(0, picksLimit);

    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5">
              📊 Player Prop Picks
            </Typography>
          </Box>
          {formattedData.length > picksLimit && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setShowAllPicks(!showAllPicks)}
            >
              {showAllPicks ? 'Show Less' : `Show All (${formattedData.length})`}
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          {itemsToShow.map((item: any, index: number) => (
            <Grid item xs={12} sm={6} key={item.id || index}>
              <Card sx={{ 
                borderLeft: `4px solid ${
                  item.color === 'success' ? '#4caf50' : 
                  item.color === 'warning' ? '#ff9800' : '#757575'
                }`
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {item.player || `Player ${index + 1}`}
                    </Typography>
                    <Chip 
                      label={item.valueSide?.toUpperCase() || 'N/A'} 
                      size="small"
                      color={item.valueSide === 'over' ? 'success' : item.valueSide === 'under' ? 'error' : 'default'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {item.stat || item.metric || 'Stat'}: {item.line || 'N/A'} • Projected: {item.projection || 'N/A'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" paragraph sx={{ fontSize: '0.8rem' }}>
                    {item.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Confidence
                      </Typography>
                      <Chip 
                        label={item.confidence?.toUpperCase() || 'MEDIUM'} 
                        size="small"
                        color={item.confidence === 'high' ? 'success' : item.confidence === 'medium' ? 'warning' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Odds
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ color: item.odds?.startsWith('+') ? '#4caf50' : '#f44336' }}>
                        {item.odds}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Edge
                      </Typography>
                      <Typography variant="h5" sx={{ 
                        color: item.color === 'success' ? '#4caf50' : 
                               item.color === 'warning' ? '#ff9800' : '#757575',
                        fontWeight: 'bold'
                      }}>
                        {item.formattedEdge}
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Bookmaker
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {item.bookmaker}
                      </Typography>
                    </Box>
                  </Box>

                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, Math.abs(item.edge || 0) * 3)} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      mt: 2,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: item.color === 'success' ? '#4caf50' : 
                                         item.color === 'warning' ? '#ff9800' : '#757575'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {formattedData.length > picksLimit && !showAllPicks && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing top {picksLimit} of {formattedData.length} player props
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };

  const renderPrompts = () => {
    return (
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InsightsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5">
              Smart Search Prompts
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Prompt Categories
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            {USEFUL_PROMPTS.map((category: any) => (
              <Chip
                key={category.category}
                label={category.category}
                onClick={() => setSelectedPromptCategory(category.category)}
                color={selectedPromptCategory === category.category ? 'primary' : 'default'}
                variant={selectedPromptCategory === category.category ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>
          Quick Prompts
        </Typography>
        <Grid container spacing={2}>
          {USEFUL_PROMPTS.find((cat: any) => cat.category === selectedPromptCategory)?.prompts.map((prompt: string, index: number) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => {
                  setCustomQuery(prompt);
                  setTimeout(() => handleGeneratePredictions(), 100);
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SearchIcon sx={{ mr: 1, color: 'primary.main', fontSize: 16 }} />
                    <Typography variant="body2">
                      {prompt}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Tap any prompt to generate an AI prediction based on that query.
          </Typography>
        </Alert>
      </Paper>
    );
  };

  // ✅ UPDATED renderContent now handles the new tabs and uses enhanced components
  const renderContent = () => {
    if (!sportData) {
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h6">Loading analytics data...</Typography>
        </Paper>
      );
    }

    try {
      switch(selectedMetric) {
        case 'overview':
          return (
            <>
              {renderOverview()}
              {renderTrendingStats()}

              {searchQuery && filteredData.length > 0 && (
                <>
                  <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
                    <Typography variant="h6">
                      🔍 Search Results for "{searchQuery}" ({filteredData.length})
                    </Typography>
                  </Paper>
                  <MetricsDashboard data={filteredData} />
                </>
              )}
              {searchQuery && filteredData.length === 0 && (
                <Paper sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: '#fff3e0' }}>
                  <Typography variant="h6">No results found for "{searchQuery}"</Typography>
                </Paper>
              )}

              {sportData.parlayAnalytics && (
                <>
                  {renderParlayTypeSelector()}
                  {renderOptimalStrategy()}
                  {renderParlayTabs()}

                  {activeParlayTab === 'overview' && (
                    <>
                      {renderSuccessRateChart()}
                      {renderSharpMoney()}
                    </>
                  )}
                  {activeParlayTab === 'props' && renderPropValueOpportunities()}
                  {activeParlayTab === 'correlated' && renderCorrelatedParlays()}
                  {activeParlayTab === 'sharp' && renderSharpMoney()}

                  {renderDataSources()}
                </>
              )}

              {renderPredictionGenerator()}
              {sportData.rawAnalytics && Array.isArray(sportData.rawAnalytics) && (
                <MetricsDashboard data={sportData.rawAnalytics} />
              )}
              {renderPrompts()}
            </>
          );
        case 'value':
          return <ValuePicksPanel />;
        case 'top-picks':
          return renderTopPlayerPicks();
        case 'smart-prompts':
          return renderSmartPrompts();
        case 'advanced':
          return (
            <>
              {renderAdvancedMetrics()}
              {sportData.playerTrendsData && Array.isArray(sportData.playerTrendsData) && sportData.playerTrendsData.length > 0 && (
                <PlayerTrendsChart trends={sportData.playerTrendsData} rawAnalytics={sportData.rawAnalytics} />
              )}
            </>
          );
        case 'trends':
          return (
            <>
              {sportData.rawAnalytics && Array.isArray(sportData.rawAnalytics) && (
                <MetricsDashboard data={sportData.rawAnalytics} />
              )}
              {sportData.playerTrendsData && Array.isArray(sportData.playerTrendsData) && sportData.playerTrendsData.length > 0 && (
                <PlayerTrendsChart trends={sportData.playerTrendsData} rawAnalytics={sportData.rawAnalytics} />
              )}
              <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
                <TimelineIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
                <Typography variant="h4" gutterBottom>
                  📈 Trends Analysis
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Enhanced trends analysis with visualization charts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track team performance over time, identify patterns, and get predictive insights.
                </Typography>
              </Paper>
            </>
          );
        case 'players':
          return (
            <>
              {sportData.playerTrendsData && Array.isArray(sportData.playerTrendsData) && sportData.playerTrendsData.length > 0 ? (
                <PlayerTrendsChart trends={sportData.playerTrendsData} rawAnalytics={sportData.rawAnalytics} />
              ) : (
                <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h4" gutterBottom>
                    👤 Player Insights
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Player performance analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track player stats, shooting percentages, and performance trends.
                  </Typography>
                </Paper>
              )}
            </>
          );
case 'teams':
  return sportData.rawAnalytics ? <TeamAnalysis rawAnalytics={sportData.rawAnalytics} /> : null;       
        default:
          return (
            <>
              {renderOverview()}
              {renderTrendingStats()}
              {renderPredictionGenerator()}
              {renderPrompts()}
            </>
          );
      }
    } catch (err) {
      console.error('Error in renderContent:', err);
      return (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center', bgcolor: '#ffebee' }}>
          <Typography variant="h6" color="error">Error rendering content. Check console for details.</Typography>
        </Paper>
      );
    }
  };

  const renderSimulationModal = () => {
    return (
      <Dialog open={showSimulationModal} onClose={() => !simulating && !generatingPredictions && setShowSimulationModal(false)}>
        <DialogTitle>
          {generatingPredictions ? 'Generating AI Predictions...' : 'AI Predictions Generated!'}
        </DialogTitle>
        <DialogContent>
          {generatingPredictions ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Analyzing Data with AI...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processing your query and generating predictions using advanced models
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                {[1, 2, 3].map((step) => (
                  <Box key={step} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: step <= 2 ? 'primary.main' : 'grey.300',
                      mr: step < 3 ? 1 : 0
                    }} />
                    {step < 3 && <Box sx={{ width: 20, height: 2, bgcolor: 'grey.300', mr: 1 }} />}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}>
                <SparklesIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h6" gutterBottom>
                AI Predictions Generated!
              </Typography>
              {predictionResults && (
                <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default', textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {predictionResults.analysis || predictionResults.prediction}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Source: {predictionResults.source || 'AI Model'}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!generatingPredictions && (
            <Button onClick={() => setShowSimulationModal(false)} variant="contained" fullWidth>
              Continue
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

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
  // ERROR STATE
  // ============================================
  const displayError = error || oddsError || trendsError || analyticsError || parlayError || prizepicksError;
  if (displayError) {
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
  // MAIN RENDER
  // ============================================
  return (
    <Container maxWidth="lg">
      {renderHeader()}
      {renderRefreshIndicator()}
      {renderSportSelector()}
      {renderMetricTabs()}
      {renderContent()}

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
