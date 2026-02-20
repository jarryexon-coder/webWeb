import React, { useMemo, useState } from 'react';
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

// ========== Type Definitions ==========
interface AnalyticsMetric {
  id: string;
  title: string;
  metric: string;
  value: number | string;
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

// New interfaces for tab data
interface PlayerStats {
  id: string;
  name: string;
  team: string;
  position: string;
  gamesPlayed: number;
  points: number;
  rebounds: number;
  assists: number;
  plusMinus: number;
  efficiency: number;
  trend: 'up' | 'down' | 'stable';
}

interface Injury {
  id: string;
  playerName: string;
  team: string;
  position: string;
  injury: string;
  status: 'Out' | 'Questionable' | 'Probable' | 'IR';
  date: string;
  returnDate: string | null;
  impact: 'High' | 'Medium' | 'Low';
}

interface ValueBet {
  id: string;
  game: string;
  betType: string;
  odds: string;
  edge: string;
  confidence: 'High' | 'Medium' | 'Low';
  sport: string;
  timestamp: string;
}

// ========== Mock Data (fallback) ==========
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

// ========== Sport Config ==========
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

// ========== API Base URL with fallback ==========
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

// ========== Main Component ==========
const AnalyticsDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedSport, setSelectedSport] = useState('nba');
  const [tabValue, setTabValue] = useState(0); // 0 = Overview, 1 = Player Analysis, 2 = Injury Report, 3 = Value Bets

  // ========== Fetch Analytics Data with fallback ==========
  const fetchAnalytics = async (sport: string): Promise<AnalyticsResponse> => {
    try {
      const url = new URL(`/api/analytics?sport=${sport}`, API_BASE_URL);
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.warn(`Analytics API returned ${response.status}. Using mock data.`);
        return getMockAnalyticsData(sport);
      }
      const data = await response.json();
      if (!data.success) {
        console.warn('Analytics API returned unsuccessful. Using mock data.');
        return getMockAnalyticsData(sport);
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return getMockAnalyticsData(sport);
    }
  };

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery<AnalyticsResponse>({
    queryKey: ['analytics', selectedSport],
    queryFn: () => fetchAnalytics(selectedSport),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ========== Tab-specific data fetching ==========
  const fetchPlayerAnalysis = async (sport: string): Promise<PlayerStats[]> => {
    const url = new URL(`/api/player-analysis?sport=${sport}`, API_BASE_URL);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch player analysis');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch player analysis');
    return json.data || [];
  };

  const fetchInjuryReport = async (sport: string): Promise<Injury[]> => {
    const url = new URL(`/api/injuries?sport=${sport}`, API_BASE_URL);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch injury report');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch injury report');
    return json.data || [];
  };

  const fetchValueBets = async (sport: string): Promise<ValueBet[]> => {
    const url = new URL(`/api/value-bets?sport=${sport}`, API_BASE_URL);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch value bets');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to fetch value bets');
    return json.data || [];
  };

  const {
    data: playerData,
    isLoading: playerLoading,
    error: playerError,
  } = useQuery({
    queryKey: ['playerAnalysis', selectedSport],
    queryFn: () => fetchPlayerAnalysis(selectedSport),
    enabled: tabValue === 1,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: injuryData,
    isLoading: injuryLoading,
    error: injuryError,
  } = useQuery({
    queryKey: ['injuryReport', selectedSport],
    queryFn: () => fetchInjuryReport(selectedSport),
    enabled: tabValue === 2,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: valueBetData,
    isLoading: valueBetLoading,
    error: valueBetError,
  } = useQuery({
    queryKey: ['valueBets', selectedSport],
    queryFn: () => fetchValueBets(selectedSport),
    enabled: tabValue === 3,
    staleTime: 2 * 60 * 1000,
  });

  // ========== Derived Data ==========
  const metrics = analyticsData?.analytics || [];
  const games = analyticsData?.games || [];

  // Process position distribution for chart
  const positionData = useMemo(() => {
    const posMetric = metrics.find((m) => m.title === 'Position Distribution');
    if (!posMetric?.position_distribution) return [];
    return Object.entries(posMetric.position_distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [metrics]);

  // Process edge analysis for chart
  const edgeData = useMemo(() => {
    const edgeMetric = metrics.find((m) => m.title === 'Value Analysis');
    if (!edgeMetric) return [];
    return [
      { name: 'Positive Edge', value: edgeMetric.positive_edges || 0 },
      { name: 'Negative Edge', value: (edgeMetric.total_analyzed || 0) - (edgeMetric.positive_edges || 0) },
    ];
  }, [metrics]);

  // ========== Loading / Error ==========
  if (isLoading) {
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
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load analytics data. Showing simulated data.
        </Alert>
      </Box>
    );
  }

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
                {metric.value}
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
    if (edgeData.length === 0) return null;
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

  // ========== Tab Content Render Functions ==========
  const renderPlayerAnalysis = () => {
    if (playerLoading) return <CircularProgress />;
    if (playerError) return <Alert severity="error">Failed to load player analysis</Alert>;
    if (!playerData || playerData.length === 0) return <Alert severity="info">No player data available for {selectedSport.toUpperCase()}</Alert>;

    return (
      <Grid container spacing={3}>
        {playerData.map((player) => (
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
    if (injuryLoading) return <CircularProgress />;
    if (injuryError) return <Alert severity="error">Failed to load injury report</Alert>;
    if (!injuryData || injuryData.length === 0) return <Alert severity="info">No injuries reported for {selectedSport.toUpperCase()}</Alert>;

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
    if (valueBetLoading) return <CircularProgress />;
    if (valueBetError) return <Alert severity="error">Failed to load value bets</Alert>;
    if (!valueBetData || valueBetData.length === 0) return <Alert severity="info">No value bets found for {selectedSport.toUpperCase()}</Alert>;

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
    // Apply the theme's default background to the main container
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

      {/* Tabs – now with a background that contrasts with the text */}
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
