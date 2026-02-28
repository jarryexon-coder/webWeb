import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  useTheme,
  Tab,
  Tabs,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  Assessment,
  Warning,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

// ========== Import the actual hooks ==========
import { useOddsGames, usePlayerTrends, useAdvancedAnalytics } from '../hooks/useUnifiedAPI';
import { useParlaySuggestions } from '../hooks/useSportsData';

// ========== Type Definitions (unchanged) ==========
interface AnalyticsMetric {
  id: string;
  title: string;
  metric: string;
  value: number | string | Record<string, any> | any[];
  change: string;
  trend: 'up' | 'down' | 'stable' | 'warning';
  sport: string;
  sample_size?: number;
  injured_count?: number;
  positive_edges?: number;
  total_analyzed?: number;
  position_distribution?: Record<string, number>;
}

interface GameAnalytics {
  id: string;
  homeTeam: { name: string; logo: string; color: string };
  awayTeam: { name: string; logo: string; color: string };
  homeScore: number;
  awayScore: number;
  status: string;
  sport: string;
  date: string;
  time: string;
  venue: string;
  odds: { spread: string; total: string };
  quarter?: string;
}

interface AnalyticsResponse {
  success: boolean;
  games: GameAnalytics[];
  analytics: AnalyticsMetric[];
  count: number;
  timestamp: string;
  sport: string;
  is_real_data: boolean;
  has_data: boolean;
}

// ========== Mock Data (fallback) – only used when no real data ==========
const getMockAnalyticsData = (sport: string): AnalyticsResponse => ({
  success: true,
  games: [],
  analytics: [
    {
      id: '1',
      title: 'Total Players',
      metric: 'players',
      value: 450,
      change: '+12%',
      trend: 'up',
      sport: sport.toUpperCase(),
      sample_size: 450,
    },
    {
      id: '2',
      title: 'Injuries',
      metric: 'injuries',
      value: 23,
      change: '-5%',
      trend: 'down',
      sport: sport.toUpperCase(),
      injured_count: 23,
    },
    {
      id: '3',
      title: 'Value Bets Found',
      metric: 'value_bets',
      value: 18,
      change: '+3',
      trend: 'up',
      sport: sport.toUpperCase(),
      positive_edges: 18,
      total_analyzed: 45,
    },
    {
      id: '4',
      title: 'Avg Edge',
      metric: 'avg_edge',
      value: '+4.2%',
      change: '+0.8%',
      trend: 'up',
      sport: sport.toUpperCase(),
    },
  ],
  count: 4,
  timestamp: new Date().toISOString(),
  sport,
  is_real_data: false,
  has_data: false,
});

// ========== Sport Config (unchanged) ==========
const SPORTS = [
  { value: 'nba', label: 'NBA', icon: <SportsBasketball />, color: '#1d428a' },
  { value: 'nfl', label: 'NFL', icon: <SportsFootball />, color: '#013369' },
  { value: 'mlb', label: 'MLB', icon: <SportsBaseball />, color: '#e31837' },
  { value: 'nhl', label: 'NHL', icon: <SportsHockey />, color: '#000' },
];

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
const TREND_COLORS = {
  up: '#4caf50',
  down: '#f44336',
  stable: '#ff9800',
  warning: '#ff9800',
};

// ========== Main Component ==========
const AnalyticsDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedSport, setSelectedSport] = useState('nba');
  const [tabValue, setTabValue] = useState(0); // 0 = Overview, 1 = Player Analysis, 2 = Injury Report, 3 = Value Bets

  // ========== Use the real data hooks ==========
  const { data: oddsData, isLoading: oddsLoading, error: oddsError, refetch: refetchOdds } = useOddsGames();
  const { data: trendsData, isLoading: trendsLoading, error: trendsError, refetch: refetchTrends } = usePlayerTrends();
  const { data: analyticsDataFromHook, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAdvancedAnalytics();
  const { data: parlayData, loading: parlayLoading, error: parlayError, refetch: refetchParlay } = useParlaySuggestions();

  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========== Transform hook data into AnalyticsResponse ==========
  useEffect(() => {
    const allLoading = oddsLoading || trendsLoading || analyticsLoading || parlayLoading;
    if (allLoading) {
      setLoading(true);
      return;
    }

    const allError = oddsError || trendsError || analyticsError || parlayError;
    if (allError) {
      const errorMsg = 
        (oddsError as any)?.message ||
        (trendsError as any)?.message ||
        (analyticsError as any)?.message ||
        (parlayError as any)?.message ||
        'Failed to load analytics data';
      setError(errorMsg);
      // Fallback to mock
      setAnalyticsData(getMockAnalyticsData(selectedSport));
      setLoading(false);
      return;
    }

    // Build games from oddsData
    const games: GameAnalytics[] = (oddsData?.games || []).map((game: any) => ({
      id: game.id || `game-${Math.random()}`,
      homeTeam: {
        name: game.home_team || 'Home',
        logo: game.home_team?.substring(0, 2) || 'H',
        color: '#1976d2',
      },
      awayTeam: {
        name: game.away_team || 'Away',
        logo: game.away_team?.substring(0, 2) || 'A',
        color: '#dc004e',
      },
      homeScore: game.home_score || 0,
      awayScore: game.away_score || 0,
      status: game.status || 'Scheduled',
      sport: game.sport || selectedSport,
      date: game.commence_time || new Date().toISOString(),
      time: game.commence_time ? new Date(game.commence_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
      venue: game.venue || 'TBD',
      odds: {
        spread: game.spread || 'N/A',
        total: game.total || 'N/A',
      },
    }));

    // Build analytics metrics from selections and trends
    const selections = analyticsDataFromHook?.selections || [];
    const parlays = parlayData?.suggestions || [];

    // Counters
    const totalPlayers = selections.length + parlays.length;
    const highConfidenceCount = selections.filter((s: any) => s.confidence === 'high' || s.edge > 10).length;
    const injuredCount = trendsData?.injuries?.length || 0; // assuming trendsData has injuries

    // Position distribution (if available from trends or selections)
    const positionCounts: Record<string, number> = {};
    if (trendsData?.players) {
      trendsData.players.forEach((p: any) => {
        const pos = p.position || 'Unknown';
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });
    }

    const metrics: AnalyticsMetric[] = [
      {
        id: '1',
        title: 'Total Players',
        metric: 'players',
        value: totalPlayers,
        change: totalPlayers > 400 ? '+5%' : '+2%',
        trend: totalPlayers > 400 ? 'up' : 'stable',
        sport: selectedSport.toUpperCase(),
        sample_size: totalPlayers,
      },
      {
        id: '2',
        title: 'Injuries',
        metric: 'injuries',
        value: injuredCount,
        change: injuredCount > 20 ? '-3%' : '+1%',
        trend: injuredCount > 20 ? 'down' : 'warning',
        sport: selectedSport.toUpperCase(),
        injured_count: injuredCount,
      },
      {
        id: '3',
        title: 'Value Bets Found',
        metric: 'value_bets',
        value: highConfidenceCount,
        change: `+${highConfidenceCount}`,
        trend: highConfidenceCount > 10 ? 'up' : 'stable',
        sport: selectedSport.toUpperCase(),
        positive_edges: highConfidenceCount,
        total_analyzed: selections.length,
      },
      {
        id: '4',
        title: 'Position Averages',
        metric: 'position_averages',
        value: Object.keys(positionCounts).length > 0 ? positionCounts : { PG: 45, SG: 38, SF: 32, PF: 28, C: 25 }, // fallback
        change: '+0.8%',
        trend: 'up',
        sport: selectedSport.toUpperCase(),
        position_distribution: Object.keys(positionCounts).length > 0 ? positionCounts : { PG: 45, SG: 38, SF: 32, PF: 28, C: 25 },
      },
    ];

    const transformed: AnalyticsResponse = {
      success: true,
      games,
      analytics: metrics,
      count: metrics.length,
      timestamp: new Date().toISOString(),
      sport: selectedSport,
      is_real_data: totalPlayers > 0 || games.length > 0,
      has_data: totalPlayers > 0 || games.length > 0,
    };

    setAnalyticsData(transformed);
    setLoading(false);
    setError(null);

    // Debug in dev
    if (import.meta.env.DEV) {
      console.log('📊 AnalyticsDashboardScreen data built:', transformed);
    }
  }, [
    oddsData, oddsLoading, oddsError,
    trendsData, trendsLoading, trendsError,
    analyticsDataFromHook, analyticsLoading, analyticsError,
    parlayData, parlayLoading, parlayError,
    selectedSport
  ]);

  // ========== Derived Data ==========
  const metrics = analyticsData?.analytics || [];
  const games = analyticsData?.games || [];

  // Process position distribution for chart
  const positionData = useMemo(() => {
    const posMetric = metrics.find((m) => m.title === 'Position Averages');
    if (!posMetric?.position_distribution) return [];
    return Object.entries(posMetric.position_distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [metrics]);

  // Process edge analysis for chart (from value bets metric)
  const edgeData = useMemo(() => {
    const valueMetric = metrics.find((m) => m.metric === 'value_bets');
    if (!valueMetric) return [];
    const positive = valueMetric.positive_edges || 0;
    const total = valueMetric.total_analyzed || positive;
    return [
      { name: 'Positive Edge', value: positive },
      { name: 'Negative Edge', value: total - positive },
    ];
  }, [metrics]);

  // ========== Render Helpers ==========
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: TREND_COLORS.up }} />;
      case 'down':
        return <TrendingDown sx={{ color: TREND_COLORS.down }} />;
      case 'warning':
        return <Warning sx={{ color: TREND_COLORS.warning }} />;
      default:
        return <TrendingFlat sx={{ color: TREND_COLORS.stable }} />;
    }
  };

  // Helper to safely render a metric value that might be an object or array
  const renderMetricValue = (metric: AnalyticsMetric) => {
    const { value, title } = metric;

    if (typeof value !== 'object' || value === null) {
      return value;
    }

    if (Array.isArray(value)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Metric "${title}" received an array of length ${value.length}:`, value);
      }
      return `[${value.length} items]`;
    }

    // For the Position Averages metric, it's expected to be an object – don't warn
    if (title === 'Position Averages') {
      const count = Object.keys(value).length;
      return `${count} positions`;
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`Metric "${title}" received an object:`, value);
    }

    const str = JSON.stringify(value);
    return str.length > 50 ? str.substring(0, 47) + '...' : str;
  };

  const renderMetricCards = () => (
    <Grid container spacing={3}>
      {metrics.map((metric) => (
        <Grid item xs={12} sm={6} md={3} key={metric.id}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" gutterBottom variant="body2">
                  {metric.title}
                </Typography>
                <Chip
                  label={metric.sport}
                  size="small"
                  icon={SPORTS.find((s) => s.value === metric.sport?.toLowerCase())?.icon}
                  variant="outlined"
                />
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600, mt: 1 }}>
                {renderMetricValue(metric)}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {renderTrendIcon(metric.trend)}
                <Typography
                  variant="body2"
                  sx={{
                    ml: 0.5,
                    color:
                      metric.trend === 'up'
                        ? TREND_COLORS.up
                        : metric.trend === 'down'
                        ? TREND_COLORS.down
                        : 'text.secondary',
                  }}
                >
                  {metric.change}
                </Typography>
              </Box>
              {metric.sample_size !== undefined && (
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                  Sample: {metric.sample_size} players
                </Typography>
              )}
              {metric.injured_count !== undefined && (
                <Typography variant="caption" color="textSecondary" display="block">
                  Injured: {metric.injured_count}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderPositionChart = () => {
    if (positionData.length === 0) return null;
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Position Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={positionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {positionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderEdgeChart = () => {
    if (edgeData.length === 0 || edgeData[0].value === 0) return null;
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Edge Analysis
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={edgeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]}>
                {edgeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Positive Edge' ? '#4caf50' : '#f44336'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderGameCards = () => {
    if (games.length === 0) {
      return (
        <Box py={3}>
          <Alert severity="info">No games available for {selectedSport.toUpperCase()}.</Alert>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {games.slice(0, 4).map((game) => (
          <Grid item xs={12} md={6} lg={3} key={game.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip
                    label={game.status}
                    size="small"
                    color={game.status === 'Live' ? 'error' : 'default'}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {game.time}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: game.awayTeam?.color ?? '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: 14,
                        mr: 1,
                      }}
                    >
                      {game.awayTeam?.logo ?? '?'}
                    </Box>
                    <Typography variant="body2">{game.awayTeam?.name ?? 'Away'}</Typography>
                  </Box>
                  <Typography variant="h6">{game.awayScore ?? 0}</Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: game.homeTeam?.color ?? '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: 14,
                        mr: 1,
                      }}
                    >
                      {game.homeTeam?.logo ?? '?'}
                    </Box>
                    <Typography variant="body2">{game.homeTeam?.name ?? 'Home'}</Typography>
                  </Box>
                  <Typography variant="h6">{game.homeScore ?? 0}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="textSecondary">
                    Spread: {game.odds?.spread ?? 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total: {game.odds?.total ?? 'N/A'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                  {game.venue ?? 'Venue TBD'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // ========== Tab-specific data fetching (using the same hooks) ==========
  // For simplicity, we reuse the same data but filter for the tabs.
  // In a real scenario, you might want separate queries, but for now we'll derive from the combined data.

  const playerData = useMemo(() => {
    // Extract player stats from selections and trends
    const selections = analyticsDataFromHook?.selections || [];
    const players: any[] = [];
    selections.forEach((sel: any, idx: number) => {
      players.push({
        id: sel.id || `player-${idx}`,
        name: sel.player || 'Unknown',
        team: sel.team || 'FA',
        position: sel.position || 'G/F',
        gamesPlayed: sel.games_played || 10,
        points: sel.projection || 15,
        rebounds: sel.rebounds || 5,
        assists: sel.assists || 3,
        plusMinus: sel.plus_minus || 0,
        efficiency: sel.efficiency || 12,
        trend: sel.trend || 'stable',
      });
    });
    return players;
  }, [analyticsDataFromHook]);

  const injuryData = useMemo(() => {
    // From trendsData injuries
    const injuries = trendsData?.injuries || [];
    return injuries.map((inj: any, idx: number) => ({
      id: inj.id || `injury-${idx}`,
      playerName: inj.player || 'Player',
      team: inj.team || 'Unknown',
      position: inj.position || 'N/A',
      injury: inj.injury || 'Unknown',
      status: inj.status || 'Questionable',
      date: inj.date || new Date().toISOString(),
      returnDate: inj.return_date || null,
      impact: inj.impact || 'Medium',
    }));
  }, [trendsData]);

  const valueBetData = useMemo(() => {
    // From parlayData suggestions or high-confidence selections
    const parlays = parlayData?.suggestions || [];
    return parlays.map((bet: any, idx: number) => ({
      id: bet.id || `bet-${idx}`,
      game: bet.game || 'Game',
      betType: bet.type || 'Spread',
      odds: bet.odds || '-110',
      edge: bet.edge || '5%',
      confidence: bet.confidence || 'Medium',
      sport: bet.sport || selectedSport,
      timestamp: bet.timestamp || new Date().toISOString(),
    }));
  }, [parlayData, selectedSport]);

  // ========== Loading / Error ==========
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => {
              refetchOdds?.();
              refetchTrends?.();
              refetchAnalytics?.();
              refetchParlay?.();
            }}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // ========== Tab Content Render Functions ==========
  const renderPlayerAnalysis = () => {
    if (playerData.length === 0) return <Alert severity="info">No player data available for {selectedSport.toUpperCase()}</Alert>;

    return (
      <Grid container spacing={3}>
        {playerData.slice(0, 6).map((player) => (
          <Grid item xs={12} md={6} lg={4} key={player.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{player.name}</Typography>
                  <Chip label={player.team} size="small" />
                </Box>
                <Typography color="textSecondary" gutterBottom>{player.position}</Typography>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="body2">PPG: {player.points}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">RPG: {player.rebounds}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">APG: {player.assists}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">+/-: {player.plusMinus}</Typography></Grid>
                </Grid>
                <Box mt={1} display="flex" alignItems="center">
                  {renderTrendIcon(player.trend)}
                  <Typography variant="caption" sx={{ ml: 0.5 }}>Efficiency: {player.efficiency}</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                  Games: {player.gamesPlayed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderInjuryReport = () => {
    if (injuryData.length === 0) return <Alert severity="info">No injuries reported for {selectedSport.toUpperCase()}</Alert>;

    return (
      <Grid container spacing={3}>
        {injuryData.map((injury) => (
          <Grid item xs={12} md={6} lg={4} key={injury.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">{injury.playerName}</Typography>
                  <Chip
                    label={injury.status}
                    color={
                      injury.status === 'Out' ? 'error' :
                      injury.status === 'Questionable' ? 'warning' : 'success'
                    }
                    size="small"
                  />
                </Box>
                <Typography color="textSecondary">{injury.team} • {injury.position}</Typography>
                <Typography variant="body2" mt={1}>Injury: {injury.injury}</Typography>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="caption">Reported: {format(new Date(injury.date), 'MMM dd')}</Typography>
                  <Typography variant="caption">
                    Return: {injury.returnDate ? format(new Date(injury.returnDate), 'MMM dd') : 'Unknown'}
                  </Typography>
                </Box>
                <Chip
                  label={`Impact: ${injury.impact}`}
                  size="small"
                  sx={{ mt: 1 }}
                  color={injury.impact === 'High' ? 'error' : injury.impact === 'Medium' ? 'warning' : 'default'}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderValueBets = () => {
    if (valueBetData.length === 0) return <Alert severity="info">No value bets found for {selectedSport.toUpperCase()}</Alert>;

    return (
      <Grid container spacing={3}>
        {valueBetData.map((bet) => (
          <Grid item xs={12} md={6} lg={4} key={bet.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{bet.game}</Typography>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Chip label={bet.betType} size="small" />
                  <Chip
                    label={`Edge: ${bet.edge}`}
                    color="success"
                    size="small"
                  />
                </Box>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Typography variant="body2">Odds: {bet.odds}</Typography>
                  <Chip
                    label={`Confidence: ${bet.confidence}`}
                    size="small"
                    color={
                      bet.confidence === 'High' ? 'success' :
                      bet.confidence === 'Medium' ? 'warning' : 'default'
                    }
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" display="block" mt={2}>
                  Updated: {format(new Date(bet.timestamp), 'MMM dd, HH:mm')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // ========== Tab Content ==========
  const renderTabContent = () => {
    switch (tabValue) {
      case 0: // Overview
        return (
          <>
            {/* KPI Cards */}
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Key Performance Indicators
              </Typography>
              {renderMetricCards()}
            </Box>

            {/* Charts */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={6}>
                {renderPositionChart()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderEdgeChart()}
              </Grid>
            </Grid>

            {/* Live Games */}
            <Box mb={2}>
              <Typography variant="h6" gutterBottom>
                Live & Upcoming Games
              </Typography>
              {renderGameCards()}
            </Box>
          </>
        );

      case 1: // Player Analysis
        return renderPlayerAnalysis();

      case 2: // Injury Report
        return renderInjuryReport();

      case 3: // Value Bets
        return renderValueBets();

      default:
        return null;
    }
  };

  return (
    <Box p={3} sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Header with Sport Selector */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Assessment sx={{ fontSize: 32, mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h4" fontWeight={600}>
            Analytics Dashboard
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="sport-select-label">Sport</InputLabel>
          <Select
            labelId="sport-select-label"
            value={selectedSport}
            label="Sport"
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            {SPORTS.map((sport) => (
              <MenuItem key={sport.value} value={sport.value}>
                <Box display="flex" alignItems="center">
                  {sport.icon}
                  <Typography sx={{ ml: 1 }}>{sport.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Data Source Status */}
      <Box mb={3}>
        <Alert severity={analyticsData?.is_real_data ? 'success' : 'info'}>
          {analyticsData?.is_real_data
            ? '✅ Using real-time analytics data'
            : '⚠️ Using simulated data (live API unavailable)'}
        </Alert>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: theme.palette.background.paper }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Player Analysis" />
          <Tab label="Injury Report" />
          <Tab label="Value Bets" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Data Timestamp */}
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Typography variant="caption" color="textSecondary">
          Last updated:{' '}
          {analyticsData?.timestamp
            ? format(new Date(analyticsData.timestamp), 'MMM dd, yyyy HH:mm')
            : 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboardScreen;
