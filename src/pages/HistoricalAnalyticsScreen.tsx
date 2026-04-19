import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  Alert,
  Button,
  IconButton,
  Paper,
  Divider,
  useTheme,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { ArrowBack as ArrowBackIcon, TrendingUp, TrendingDown } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface SportPerformance {
  name: string;
  efficiency: number;     // formerly roi
  pickCount: number;      // formerly volume
}

interface HistoricalData {
  efficiency: number[];   // formerly roi
  accuracy: number[];     // formerly hitRate
  pickCount: number[];    // formerly volume
  labels: string[];
  topSports: SportPerformance[];
}

// ----------------------------------------------------------------------
// API client (mock)
// ----------------------------------------------------------------------

const fetchHistoricalData = async (period: string): Promise<HistoricalData> => {
  // Simulate API call – replace with real endpoint
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    efficiency: [12.3, 15.1, 8.4, 18.2, 14.5, 21.3, 17.8],
    accuracy: [62, 64, 58, 68, 65, 71, 67],
    pickCount: [145, 152, 138, 167, 158, 182, 175],
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
    topSports: [
      { name: 'NBA', efficiency: 18.4, pickCount: 342 },
      { name: 'NFL', efficiency: 12.7, pickCount: 289 },
      { name: 'NHL', efficiency: 8.3, pickCount: 156 },
      { name: 'MLB', efficiency: 6.2, pickCount: 98 },
    ],
  };
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const HistoricalAnalyticsScreen: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');

  const {
    data: historicalData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['historicalAnalytics', selectedPeriod],
    queryFn: () => fetchHistoricalData(selectedPeriod),
    staleTime: 1000 * 60 * 5,
  });

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setSelectedPeriod(event.target.value);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Historical Performance
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !historicalData) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Historical Performance
          </Typography>
        </Box>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load historical data.
        </Alert>
      </Container>
    );
  }

  // Derived summary stats – neutral terminology
  const totalSimulatedGain = 1847;    // formerly totalProfit
  const forecastAccuracy = 67.3;     // formerly winRate
  const avgAnalyticalAdvantage = 12.4; // formerly avgEdge
  const totalPicks = 847;            // formerly totalBets

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Historical Performance
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 120 }} size="small">
          <InputLabel id="period-select-label">Period</InputLabel>
          <Select
            labelId="period-select-label"
            value={selectedPeriod}
            label="Period"
            onChange={handlePeriodChange}
          >
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="90d">Last 90 days</MenuItem>
            <MenuItem value="season">2026 Season</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Stats Cards – Gambling-free metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Simulated Gain
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                +${totalSimulatedGain}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Forecast Accuracy
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {forecastAccuracy}%
              </Typography>
              <Typography variant="caption" color="success.main">
                +5.2% vs prev
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg Analytical Advantage
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                +{avgAnalyticalAdvantage}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per pick
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Picks
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalPicks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total selections
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Efficiency Chart (formerly ROI) */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Efficiency % Over Time
        </Typography>
        <Box sx={{ height: 300, width: '100%' }}>
          <LineChart
            dataset={historicalData.efficiency.map((value, index) => ({
              x: historicalData.labels[index],
              y: value,
            }))}
            xAxis={[{ dataKey: 'x', scaleType: 'band' }]}
            series={[
              {
                dataKey: 'y',
                label: 'Efficiency %',
                color: theme.palette.success.main,
                showMark: true,
              },
            ]}
            yAxis={[{ label: 'Efficiency %' }]}
            tooltip={{ trigger: 'item' }}
          />
        </Box>
      </Paper>

      {/* Selection Accuracy Chart (formerly Hit Rate) */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Selection Accuracy %
        </Typography>
        <Box sx={{ height: 300, width: '100%' }}>
          <LineChart
            dataset={historicalData.accuracy.map((value, index) => ({
              x: historicalData.labels[index],
              y: value,
            }))}
            xAxis={[{ dataKey: 'x', scaleType: 'band' }]}
            series={[
              {
                dataKey: 'y',
                label: 'Accuracy %',
                color: theme.palette.primary.main,
                showMark: true,
              },
            ]}
            yAxis={[{ label: 'Accuracy %' }]}
            tooltip={{ trigger: 'item' }}
          />
        </Box>
      </Paper>

      {/* Performance by Sport – neutral labels */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Performance by Sport
        </Typography>
        <Grid container spacing={2}>
          {historicalData.topSports.map((sport) => (
            <Grid item xs={12} key={sport.name}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.default',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body1" fontWeight="medium">
                    {sport.name}
                  </Typography>
                  <Chip label={`${sport.pickCount} picks`} size="small" variant="outlined" />
                </Box>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={sport.efficiency > 0 ? 'success.main' : 'error.main'}
                >
                  {sport.efficiency > 0 ? '+' : ''}{sport.efficiency}% Efficiency
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default HistoricalAnalyticsScreen;
