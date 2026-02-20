// src/pages/CorrelationExplorerScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Card,
  CardContent,
  useTheme,
  Button,
  Collapse,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface Player {
  id: string | number;
  name: string;
  team: string;
  position: string;
  sport: string;
  salary: number;
  fantasy_points: number;
  projected_points: number;
  points: number;
  rebounds: number;
  assists: number;
  usage_rate?: number;
  minutes?: number;
  value?: number;
}

interface CorrelationData {
  x: number;
  y: number;
  player: string;
  team: string;
  position: string;
  salary: number;
  fantasy_points: number;
}

type MetricOption = {
  value: keyof Player | 'salary' | 'fantasy_points' | 'projected_points' | 'points' | 'rebounds' | 'assists' | 'usage_rate' | 'minutes' | 'value';
  label: string;
  format?: (val: number) => string;
};

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const SPORTS = [
  { value: 'nba', label: 'NBA' },
  { value: 'nfl', label: 'NFL' },
  { value: 'mlb', label: 'MLB' },
  { value: 'nhl', label: 'NHL' },
];

const METRICS: MetricOption[] = [
  { value: 'salary', label: 'Salary ($)' },
  { value: 'fantasy_points', label: 'Fantasy Points' },
  { value: 'projected_points', label: 'Projected Fantasy' },
  { value: 'points', label: 'Points' },
  { value: 'rebounds', label: 'Rebounds' },
  { value: 'assists', label: 'Assists' },
  { value: 'usage_rate', label: 'Usage Rate %' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'value', label: 'Value (FP/$1K)' },
];

const POSITION_COLORS: Record<string, string> = {
  PG: '#4e79a7',
  SG: '#f28e2b',
  SF: '#e15759',
  PF: '#76b7b2',
  C: '#59a14f',
  QB: '#edc949',
  RB: '#af7aa1',
  WR: '#ff9da7',
  TE: '#9c755f',
  K: '#bab0ac',
  DEF: '#e377c2',
  Unknown: '#7f7f7f',
};

// Generate a consistent color for any string (team names)
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

// ----------------------------------------------------------------------
// Utility: Pearson correlation coefficient
// ----------------------------------------------------------------------
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
}

// ----------------------------------------------------------------------
// Helper: Safely parse a numeric value from a field (handles strings, null, undefined)
// ----------------------------------------------------------------------
function safeParseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

// ----------------------------------------------------------------------
// Helper: Extract a numeric value from a player object using multiple possible keys
// ----------------------------------------------------------------------
function extractNumeric(player: any, possibleKeys: string[]): number {
  for (const key of possibleKeys) {
    if (player[key] !== undefined) {
      const val = safeParseNumber(player[key]);
      if (val !== null) return val;
    }
  }
  return 0;
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export const CorrelationExplorerScreen: React.FC = () => {
  const theme = useTheme();

  // State
  const [sport, setSport] = useState<string>('nba');
  const [xMetric, setXMetric] = useState<keyof Player>('salary');
  const [yMetric, setYMetric] = useState<keyof Player>('fantasy_points');
  const [colorBy, setColorBy] = useState<'position' | 'team'>('position');
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // Fetch players data with improved error handling and data parsing
  const {
    data: players,
    isLoading,
    isError,
    error,
  } = useQuery<Player[]>({
    queryKey: ['players', sport, 'realtime'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/api/players`, {
        params: {
          sport,
          realtime: true,
          limit: 300,
        },
      });

      const responseData = response.data;

      if (responseData.success === false) {
        throw new Error(responseData.message || 'Failed to load player data');
      }

      let playersArray: any[] = [];

      if (responseData.success && responseData.data?.players && Array.isArray(responseData.data.players)) {
        playersArray = responseData.data.players;
      } else if (Array.isArray(responseData)) {
        playersArray = responseData;
      } else if (responseData.players && Array.isArray(responseData.players)) {
        playersArray = responseData.players;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        playersArray = responseData.data;
      } else {
        console.warn('Unexpected API response structure in /api/players:', responseData);
        return [];
      }

      console.log('Sample player data (first 3):', playersArray.slice(0, 3));

      return playersArray.map((p: any) => ({
        id: p.id || '',
        name: p.name || p.full_name || p.player_name || 'Unknown',
        team: p.team || p.team_abbrev || p.teamAbbrev || 'Unknown',
        position: p.position || p.pos || 'Unknown',
        sport: p.sport || sport,
        salary: extractNumeric(p, ['salary', 'Salary', 'sal', 'price', 'draftkings_salary', 'dk_salary']),
        fantasy_points: extractNumeric(p, ['fantasy_points', 'fantasyPoints', 'fpts', 'points', 'dk_points', 'draftkings_points']),
        projected_points: extractNumeric(p, ['projected_points', 'projectedPoints', 'proj_pts', 'projected_fantasy_points']),
        points: extractNumeric(p, ['points', 'pts', 'PTS']),
        rebounds: extractNumeric(p, ['rebounds', 'reb', 'REB']),
        assists: extractNumeric(p, ['assists', 'ast', 'AST']),
        usage_rate: extractNumeric(p, ['usage_rate', 'usageRate', 'usg', 'USG%']),
        minutes: extractNumeric(p, ['minutes', 'min', 'MIN', 'mp']),
        value: extractNumeric(p, ['value', 'val', 'dk_value']),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Prepare data for scatter plot (filter out missing values)
  const chartData = useMemo<CorrelationData[]>(() => {
    if (!players) return [];
    return players
      .filter((p) => {
        const x = p[xMetric];
        const y = p[yMetric];
        return x != null && y != null && !isNaN(Number(x)) && !isNaN(Number(y));
      })
      .map((p) => ({
        x: Number(p[xMetric]),
        y: Number(p[yMetric]),
        player: p.name,
        team: p.team || 'Unknown',
        position: p.position || 'Unknown',
        salary: p.salary,
        fantasy_points: p.fantasy_points,
      }));
  }, [players, xMetric, yMetric]);

  // Calculate correlation coefficient
  const correlation = useMemo(() => {
    if (chartData.length < 2) return 0;
    const xVals = chartData.map((d) => d.x);
    const yVals = chartData.map((d) => d.y);
    return pearsonCorrelation(xVals, yVals);
  }, [chartData]);

  // Check if all x or y values are zero
  const allXZero = useMemo(() => {
    if (chartData.length === 0) return false;
    return chartData.every(d => d.x === 0);
  }, [chartData]);

  const allYZero = useMemo(() => {
    if (chartData.length === 0) return false;
    return chartData.every(d => d.y === 0);
  }, [chartData]);

  const allValuesZero = allXZero && allYZero;
  const showZeroWarning = allXZero || allYZero;

  // Group data for color encoding
  const colorDomain = useMemo(() => {
    if (!chartData.length) return [];
    if (colorBy === 'position') {
      return Array.from(new Set(chartData.map((d) => d.position)));
    }
    return Array.from(new Set(chartData.map((d) => d.team)));
  }, [chartData, colorBy]);

  const handleSportChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSport(event.target.value as string);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', color: 'text.primary', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading player data...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3, bgcolor: 'background.default', color: 'text.primary' }}>
        <Alert severity="error" variant="filled">
          Failed to load player data: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', color: 'text.primary' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Correlation Explorer
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Explore relationships between player statistics, salaries, and fantasy performance.
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Select value={sport} label="Sport" onChange={handleSportChange}>
                {SPORTS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>X‑Axis</InputLabel>
              <Select value={xMetric} label="X‑Axis" onChange={(e) => setXMetric(e.target.value as keyof Player)}>
                {METRICS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Y‑Axis</InputLabel>
              <Select value={yMetric} label="Y‑Axis" onChange={(e) => setYMetric(e.target.value as keyof Player)}>
                {METRICS.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Color By</InputLabel>
              <Select value={colorBy} label="Color By" onChange={(e) => setColorBy(e.target.value as 'position' | 'team')}>
                <MenuItem value="position">Position</MenuItem>
                <MenuItem value="team">Team</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Correlation Coefficient</Typography>
              <Box display="flex" alignItems="baseline">
                <Typography variant="h2" component="span" color="primary" fontWeight="medium">
                  {correlation.toFixed(3)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>(r)</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {Math.abs(correlation) > 0.7 ? 'Strong correlation' : Math.abs(correlation) > 0.4 ? 'Moderate correlation' : 'Weak or no correlation'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sample Size</Typography>
              <Typography variant="h3" color="secondary">{chartData.length}</Typography>
              <Typography variant="body2" color="text.secondary">players with valid data</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Zero data warnings */}
      {showZeroWarning && chartData.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {allValuesZero
            ? '⚠️ All selected metric values are zero. The API is returning placeholder data – no real statistics available for this sport.'
            : 'Some selected data points are zero. This may indicate missing data from the API.'}
        </Alert>
      )}

      {/* Debug toggle */}
      <Button variant="outlined" onClick={() => setShowDebug(!showDebug)} sx={{ mb: 2 }}>
        {showDebug ? 'Hide' : 'Show'} Raw Data Sample
      </Button>
      <Collapse in={showDebug}>
        <Paper sx={{ p: 2, mb: 2, maxHeight: 300, overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>First 5 players (raw):</Typography>
          <pre style={{ fontSize: '0.8rem' }}>{JSON.stringify(players?.slice(0, 5), null, 2)}</pre>
        </Paper>
      </Collapse>

      {/* Scatter Plot */}
      <Paper sx={{ p: 2, mb: 4 }} elevation={2}>
        <Typography variant="h6" gutterBottom>
          Scatter Plot: {METRICS.find((m) => m.value === xMetric)?.label} vs{' '}
          {METRICS.find((m) => m.value === yMetric)?.label}
        </Typography>
        {chartData.length === 0 ? (
          <Alert severity="info">No valid data points to display.</Alert>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            {/* Increased left/right margins to prevent label overlap */}
            <ScatterChart margin={{ top: 20, right: 50, bottom: 40, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name={METRICS.find((m) => m.value === xMetric)?.label || 'X'}
                unit={xMetric === 'value' ? '' : xMetric === 'usage_rate' ? '%' : ''}
                label={{ value: METRICS.find((m) => m.value === xMetric)?.label || 'X', position: 'bottom', offset: 10 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={METRICS.find((m) => m.value === yMetric)?.label || 'Y'}
                unit={yMetric === 'value' ? '' : yMetric === 'usage_rate' ? '%' : ''}
                label={{ value: METRICS.find((m) => m.value === yMetric)?.label || 'Y', angle: -90, position: 'left', offset: 15 }}
              />
              <ZAxis type="number" range={[60, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as CorrelationData;
                    return (
                      <Paper sx={{ p: 1.5, backgroundColor: theme.palette.background.paper }}>
                        <Typography variant="subtitle2">{data.player}</Typography>
                        <Typography variant="body2">{data.team} · {data.position}</Typography>
                        <Typography variant="body2" color="primary">{METRICS.find((m) => m.value === xMetric)?.label}: {data.x.toLocaleString()}</Typography>
                        <Typography variant="body2" color="secondary">{METRICS.find((m) => m.value === yMetric)?.label}: {data.y.toLocaleString()}</Typography>
                      </Paper>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingLeft: '20px' }} />
              {colorDomain.map((category) => {
                const color = colorBy === 'position' ? POSITION_COLORS[category] || stringToColor(category) : stringToColor(category);
                return (
                  <Scatter
                    key={category}
                    name={category}
                    data={chartData.filter((d) => (colorBy === 'position' ? d.position : d.team) === category)}
                    fill={color}
                    line={false}
                    shape="circle"
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Quick insights */}
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography variant="h6" gutterBottom>Insights</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Chip label={`${chartData.length} players analyzed`} variant="outlined" color="default" />
          <Chip label={`Correlation: ${correlation.toFixed(3)}`} variant="outlined" color={Math.abs(correlation) > 0.5 ? 'success' : 'default'} />
          <Chip label={`X: ${METRICS.find((m) => m.value === xMetric)?.label}`} variant="outlined" />
          <Chip label={`Y: ${METRICS.find((m) => m.value === yMetric)?.label}`} variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {Math.abs(correlation) > 0.8
            ? 'Very strong linear relationship. Consider using this metric for lineup optimization.'
            : Math.abs(correlation) > 0.6
            ? 'Strong correlation — good predictive potential.'
            : Math.abs(correlation) > 0.4
            ? 'Moderate correlation. May be useful in combination with other factors.'
            : 'Weak correlation. These two metrics move independently.'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default CorrelationExplorerScreen;
