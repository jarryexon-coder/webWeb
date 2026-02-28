// src/pages/TrendAnalysisScreen.tsx
import React, { useState, useMemo } from 'react';
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
  Tabs,
  Tab,
  Button,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  Timeline,
  ShowChart,
  Insights,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

// ========== Type Definitions ==========
interface TrendDataPoint {
  date: string;
  value: number;
}

interface TrendMetric {
  id: string;
  title: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  sport: string;
  data?: TrendDataPoint[];
}

interface ApiTrendResponse {
  success: boolean;
  data: {
    is_real_data?: boolean;
    trends?: any[];
  };
  last_updated?: string;
  message?: string;
}

interface GroupedTrends {
  playerTrends: TrendMetric[];
  teamTrends: TrendMetric[];
  marketTrends: TrendMetric[];
}

// ========== Sport Config ==========
const SPORTS = [
  { value: 'nba', label: 'NBA', icon: <SportsBasketball />, color: '#1d428a' },
  { value: 'nfl', label: 'NFL', icon: <SportsFootball />, color: '#013369' },
  { value: 'mlb', label: 'MLB', icon: <SportsBaseball />, color: '#e31837' },
  { value: 'nhl', label: 'NHL', icon: <SportsHockey />, color: '#000' },
];

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
const TREND_COLORS = {
  up: '#4caf50',
  down: '#f44336',
  stable: '#ff9800',
};

// ========== Mock Data Generator ==========
const generateMockTrends = (sport: string): GroupedTrends => {
  console.log(`🔄 Generating mock trends for ${sport}`);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const generateTimeSeries = (baseValue: number, volatility: number) => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: format(new Date(now - (29 - i) * day), 'MMM dd'),
      value: baseValue + (Math.random() - 0.5) * volatility,
    }));
  };

  return {
    playerTrends: [
      {
        id: '1',
        title: 'Points per Game',
        current: 112.5,
        previous: 110.2,
        change: 2.3,
        trend: 'up',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(110, 5),
      },
      {
        id: '2',
        title: 'Field Goal %',
        current: 47.2,
        previous: 46.8,
        change: 0.4,
        trend: 'up',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(46, 2),
      },
      {
        id: '3',
        title: 'Turnovers',
        current: 14.3,
        previous: 15.1,
        change: -0.8,
        trend: 'down',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(15, 1.5),
      },
    ],
    teamTrends: [
      {
        id: 't1',
        title: 'Offensive Rating',
        current: 115.3,
        previous: 113.8,
        change: 1.5,
        trend: 'up',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(114, 3),
      },
      {
        id: 't2',
        title: 'Defensive Rating',
        current: 108.7,
        previous: 109.2,
        change: -0.5,
        trend: 'down',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(109, 2.5),
      },
      {
        id: 't3',
        title: 'Pace',
        current: 99.8,
        previous: 100.5,
        change: -0.7,
        trend: 'down',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(100, 2),
      },
    ],
    marketTrends: [
      {
        id: 'm1',
        title: 'Average Spread',
        current: 5.2,
        previous: 5.5,
        change: -0.3,
        trend: 'down',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(5.3, 0.8),
      },
      {
        id: 'm2',
        title: 'Over %',
        current: 52.3,
        previous: 48.7,
        change: 3.6,
        trend: 'up',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(50, 5),
      },
      {
        id: 'm3',
        title: 'Public Betting %',
        current: 65.2,
        previous: 62.8,
        change: 2.4,
        trend: 'up',
        sport: sport.toUpperCase(),
        data: generateTimeSeries(63, 4),
      },
    ],
  };
};

// ========== API Base URL ==========
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

// ========== Main Component ==========
const TrendAnalysisScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedSport, setSelectedSport] = useState('nba');
  const [tabValue, setTabValue] = useState(0);

  // ========== Fetch Trends Data ==========
  const fetchTrends = async (sport: string): Promise<ApiTrendResponse> => {
    try {
      const url = new URL(`/api/trends?sport=${sport}`, API_BASE_URL);
      const response = await fetch(url.toString());
      if (!response.ok) {
        console.warn(`Trends API returned ${response.status}. Using mock data.`);
        throw new Error('API not available');
      }
      const data = await response.json();
      console.log('Raw API response:', data);
      if (!data.success) {
        console.warn('Trends API returned unsuccessful. Using mock.');
        throw new Error('API unsuccessful');
      }
      if (!data.data) {
        console.warn('Trends API returned no data. Using mock.');
        throw new Error('No data');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      throw error;
    }
  };

  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useQuery<ApiTrendResponse>({
    queryKey: ['trends', selectedSport],
    queryFn: () => fetchTrends(selectedSport),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // ========== Process Data ==========
  const isRealData = apiResponse?.data?.is_real_data || false;

  const trends = useMemo<GroupedTrends>(() => {
    const apiTrends = apiResponse?.data?.trends;
    if (apiTrends && Array.isArray(apiTrends) && apiTrends.length > 0) {
      console.log('API trends array:', apiTrends);
      console.log('First trend item:', apiTrends[0]);
      console.log('Keys of first item:', Object.keys(apiTrends[0]));

      // Map each trend item to our internal format with safe fallbacks
      const allTrends: TrendMetric[] = apiTrends.map((item: any) => {
        // Extract numeric values safely
        const current = typeof item.average === 'number' ? item.average : parseFloat(item.average) || 0;
        const previous = typeof item.last_5_average === 'number' ? item.last_5_average : parseFloat(item.last_5_average) || current;
        let change = 0;
        if (item.change) {
          const changeStr = String(item.change).replace('%', '');
          change = parseFloat(changeStr) || 0;
        } else {
          change = current - previous;
        }
        const trend = item.trend || (change > 0 ? 'up' : change < 0 ? 'down' : 'stable');

        // Create simple time series from last_5_games if available
        let data: TrendDataPoint[] | undefined;
        if (item.last_5_games && Array.isArray(item.last_5_games)) {
          data = item.last_5_games
            .filter((val: any) => typeof val === 'number') // ensure numbers
            .map((val: number, idx: number) => ({
              date: `Game ${idx + 1}`,
              value: val,
            }));
        }

        return {
          id: item.id || String(Math.random()),
          title: item.metric || 'Unknown Metric',
          current,
          previous,
          change,
          trend,
          sport: item.sport?.toUpperCase() || selectedSport.toUpperCase(),
          data: data && data.length > 0 ? data : undefined, // only include if non-empty
        };
      });

      // Since all items are player-level, put them in playerTrends
      const grouped: GroupedTrends = {
        playerTrends: allTrends,
        teamTrends: [],
        marketTrends: [],
      };

      console.log('Grouped trends:', grouped);
      return grouped;
    }

    // Fallback to mock data
    console.log('Using mock trends');
    return generateMockTrends(selectedSport);
  }, [apiResponse, selectedSport]);

  // ========== Render Helpers ==========
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ color: TREND_COLORS.up }} />;
      case 'down':
        return <TrendingDown sx={{ color: TREND_COLORS.down }} />;
      default:
        return <TrendingFlat sx={{ color: TREND_COLORS.stable }} />;
    }
  };

  const renderMetricCard = (metric: TrendMetric) => (
    <Card key={metric.id} sx={{ height: '100%' }}>
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
          {metric.current?.toFixed(1) ?? 'N/A'}
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
            {metric.change > 0 ? '+' : ''}{metric.change?.toFixed(1) ?? '0'} ({metric.previous?.toFixed(1) ?? '0'})
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const renderTimeSeriesChart = (metrics: TrendMetric[], title: string) => {
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return null;
    }

    const firstWithData = metrics.find(m => m.data && Array.isArray(m.data) && m.data.length > 0);
    if (!firstWithData) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Box py={4} textAlign="center">
              <Typography color="textSecondary">No time series data available</Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    const dataLength = firstWithData.data.length;
    // Build combined dataset ensuring each point exists
    const combinedData = Array.from({ length: dataLength }, (_, index) => {
      const point: any = {
        date: firstWithData.data[index]?.date || `Game ${index + 1}`
      };
      metrics.forEach(m => {
        if (m.data && Array.isArray(m.data) && m.data[index] && typeof m.data[index].value === 'number') {
          point[m.title] = m.data[index].value;
        } else {
          // Use a safe default to keep chart from breaking
          point[m.title] = 0;
        }
      });
      return point;
    });

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title} - Last {dataLength} Games
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {metrics.map((m, idx) => (
                <Line
                  key={m.id}
                  type="monotone"
                  dataKey={m.title}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

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
          Failed to load trend data. Showing simulated data.
        </Alert>
      </Box>
    );
  }

  // ========== Tab Content ==========
  const renderTabContent = () => {
    const renderMetricGrid = (metrics: TrendMetric[] | undefined, title: string) => {
      if (!metrics || metrics.length === 0) {
        return (
          <Alert severity="info" sx={{ mb: 3 }}>
            No {title.toLowerCase()} available for {selectedSport.toUpperCase()}.
          </Alert>
        );
      }
      return (
        <Grid container spacing={3}>
          {metrics.map(metric => (
            <Grid item xs={12} sm={6} md={4} key={metric.id}>
              {renderMetricCard(metric)}
            </Grid>
          ))}
        </Grid>
      );
    };

    switch (tabValue) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Key Player Metrics
              </Typography>
              {renderMetricGrid(trends.playerTrends, 'player metrics')}
            </Grid>
            <Grid item xs={12}>
              {renderTimeSeriesChart(trends.playerTrends || [], 'Player Performance Trends')}
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Key Team Metrics
              </Typography>
              {renderMetricGrid(trends.teamTrends, 'team metrics')}
            </Grid>
            <Grid item xs={12}>
              {renderTimeSeriesChart(trends.teamTrends || [], 'Team Performance Trends')}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Key Market Metrics
              </Typography>
              {renderMetricGrid(trends.marketTrends, 'market metrics')}
            </Grid>
            <Grid item xs={12}>
              {renderTimeSeriesChart(trends.marketTrends || [], 'Market Trends')}
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box p={3} sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Timeline sx={{ fontSize: 32, mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h4" fontWeight={600}>
            Trend Analysis
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
        <Alert severity={isRealData ? 'success' : 'info'}>
          {isRealData
            ? '✅ Using real-time trend data'
            : '⚠️ Using simulated data (live API unavailable)'}
        </Alert>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: theme.palette.background.paper }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<ShowChart />} iconPosition="start" label="Player Trends" />
          <Tab icon={<Insights />} iconPosition="start" label="Team Trends" />
          <Tab icon={<TrendingUp />} iconPosition="start" label="Market Trends" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Timestamp */}
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Typography variant="caption" color="textSecondary">
          Last updated:{' '}
          {apiResponse?.last_updated
            ? format(new Date(apiResponse.last_updated), 'MMM dd, yyyy HH:mm')
            : 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
};

export default TrendAnalysisScreen;
