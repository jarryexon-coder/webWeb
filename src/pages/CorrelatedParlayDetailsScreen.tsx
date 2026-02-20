import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Alert,
  Button,
  Tooltip,
  IconButton,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InfoOutlined as InfoIcon,
  ScatterPlot as CorrelationIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { PieChart } from '@mui/x-charts/PieChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';

// ----------------------------------------------------------------------
// Types (based on expected backend response)
// ----------------------------------------------------------------------

interface CorrelatedLeg {
  id: string;
  description: string;
  sport: string;
  market: string;
  odds: string;
  confidence: number;
  player_name?: string;
  stat_type?: string;
  line?: number;
  implied_probability: number;
}

interface CorrelationPair {
  leg_a_id: string;
  leg_b_id: string;
  correlation_coefficient: number; // -1 to 1
  strength: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface CorrelatedParlayDetails {
  id: string;
  name: string;
  sport: string;
  legs: CorrelatedLeg[];
  correlations: CorrelationPair[];
  total_odds: string;
  combined_probability: number;
  expected_value: number;
  edge_percentage: number;
  confidence_score: number;
  risk_level: string;
  analysis: string;
  timestamp: string;
  is_real_data: boolean;
}

interface CorrelatedParlayResponse {
  success: boolean;
  data: CorrelatedParlayDetails;
  message?: string;
}

// ----------------------------------------------------------------------
// API client
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const fetchCorrelatedParlayDetails = async (id: string): Promise<CorrelatedParlayDetails> => {
  const url = `${API_BASE_URL}/api/parlay/correlated/${id}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch correlated parlay: ${response.statusText}`);
  }
  const json: CorrelatedParlayResponse = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Invalid response');
  }
  return json.data;
};

// ----------------------------------------------------------------------
// Helper components
// ----------------------------------------------------------------------

const OddsChip = ({ odds }: { odds: string }) => {
  const numericOdds = parseInt(odds, 10);
  const isFavorite = numericOdds < 0;
  return (
    <Chip
      label={odds}
      size="small"
      color={isFavorite ? 'success' : 'error'}
      variant="outlined"
    />
  );
};

const ConfidenceIndicator = ({ value }: { value: number }) => {
  let color: 'success' | 'warning' | 'error' = 'success';
  if (value < 60) color = 'error';
  else if (value < 75) color = 'warning';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color="text.secondary">
        {value}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
        color={color}
      />
    </Box>
  );
};

const RiskChip = ({ risk }: { risk: string }) => {
  let color: 'success' | 'warning' | 'error' = 'warning';
  const lower = risk.toLowerCase();
  if (lower.includes('low')) color = 'success';
  else if (lower.includes('high')) color = 'error';
  return <Chip label={risk} size="small" color={color} variant="filled" />;
};

const CorrelationStrengthChip = ({ coefficient }: { coefficient: number }) => {
  let label: string;
  let color: 'success' | 'warning' | 'error' | 'default';
  if (coefficient > 0.5) {
    label = 'Strong Positive';
    color = 'success';
  } else if (coefficient > 0.2) {
    label = 'Moderate Positive';
    color = 'success';
  } else if (coefficient < -0.5) {
    label = 'Strong Negative';
    color = 'error';
  } else if (coefficient < -0.2) {
    label = 'Moderate Negative';
    color = 'error';
  } else {
    label = 'Weak / Neutral';
    color = 'default';
  }
  return <Chip label={label} size="small" color={color} variant="outlined" />;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

const CorrelatedParlayDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: parlay,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['correlatedParlay', id],
    queryFn: () => fetchCorrelatedParlayDetails(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Process correlation data for scatter plot
  const scatterData = useMemo(() => {
    if (!parlay) return [];
    return parlay.correlations.map((pair, index) => {
      const legA = parlay.legs.find(l => l.id === pair.leg_a_id);
      const legB = parlay.legs.find(l => l.id === pair.leg_b_id);
      return {
        id: index,
        x: legA?.implied_probability || 0,
        y: legB?.implied_probability || 0,
        correlation: pair.correlation_coefficient,
        label: `${legA?.description.substring(0, 10)}… / ${legB?.description.substring(0, 10)}…`,
      };
    });
  }, [parlay]);

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Skeleton width={300} height={40} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !parlay) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">Correlated Parlay Details</Typography>
        </Box>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load correlated parlay: {(error as Error)?.message || 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with back button */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          {parlay.name}
        </Typography>
        <Chip
          label={parlay.sport}
          size="small"
          color="primary"
          sx={{ ml: 2 }}
        />
        {parlay.is_real_data ? (
          <Chip label="Live Data" size="small" color="success" sx={{ ml: 2 }} />
        ) : (
          <Chip label="Simulated" size="small" variant="outlined" sx={{ ml: 2 }} />
        )}
      </Box>

      {/* Key metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Odds
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {parlay.total_odds}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Combined Probability
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {(parlay.combined_probability * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Expected Value
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={parlay.expected_value > 0 ? 'success.main' : 'error.main'}
              >
                {parlay.expected_value > 0 ? '+' : ''}
                {parlay.expected_value.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Risk Level
              </Typography>
              <RiskChip risk={parlay.risk_level} />
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Edge: {parlay.edge_percentage > 0 ? '+' : ''}
                {parlay.edge_percentage.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main content: Legs and Correlations */}
      <Grid container spacing={3}>
        {/* Left column: Legs */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Parlay Legs
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Sport</TableCell>
                    <TableCell align="center">Market</TableCell>
                    <TableCell align="center">Odds</TableCell>
                    <TableCell align="center">Impl. Prob.</TableCell>
                    <TableCell align="right">Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parlay.legs.map((leg) => (
                    <TableRow key={leg.id}>
                      <TableCell>
                        <Typography variant="body2">{leg.description}</Typography>
                        {leg.player_name && (
                          <Typography variant="caption" color="text.secondary">
                            {leg.player_name} – {leg.stat_type} {leg.line}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={leg.sport} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={leg.market} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <OddsChip odds={leg.odds} />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {(leg.implied_probability * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ minWidth: 120 }}>
                          <ConfidenceIndicator value={leg.confidence} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Correlation pairs table */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <CorrelationIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Correlation Matrix</Typography>
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Leg A</TableCell>
                    <TableCell>Leg B</TableCell>
                    <TableCell align="center">Coefficient</TableCell>
                    <TableCell align="center">Strength</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parlay.correlations.map((pair, idx) => {
                    const legA = parlay.legs.find(l => l.id === pair.leg_a_id);
                    const legB = parlay.legs.find(l => l.id === pair.leg_b_id);
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2">{legA?.description || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{legB?.description || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={
                              pair.correlation_coefficient > 0
                                ? 'success.main'
                                : pair.correlation_coefficient < 0
                                ? 'error.main'
                                : 'text.secondary'
                            }
                          >
                            {pair.correlation_coefficient.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <CorrelationStrengthChip coefficient={pair.correlation_coefficient} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {pair.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right column: Analysis & Visualizations */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Analysis
            </Typography>
            <Typography variant="body1" paragraph>
              {parlay.analysis}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Confidence Score
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight="bold">
                  {parlay.confidence_score}%
                </Typography>
                {parlay.confidence_score >= 75 ? (
                  <TrendingUpIcon color="success" />
                ) : parlay.confidence_score >= 60 ? (
                  <TrendingFlatIcon color="warning" />
                ) : (
                  <TrendingDownIcon color="error" />
                )}
              </Box>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="body2" color="text.secondary">
                Edge
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color={parlay.edge_percentage > 0 ? 'success.main' : 'error.main'}
              >
                {parlay.edge_percentage > 0 ? '+' : ''}
                {parlay.edge_percentage.toFixed(1)}%
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Typography variant="body2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2">
                {new Date(parlay.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Paper>

          {/* Correlation Scatter Plot */}
          {scatterData.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Implied Probability Correlation
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ScatterChart
                  dataset={scatterData}
                  xAxis={[{ label: 'Leg A Implied Probability (%)' }]}
                  yAxis={[{ label: 'Leg B Implied Probability (%)' }]}
                  series={[
                    {
                      label: 'Correlation',
                      data: scatterData.map(d => ({
                        x: d.x * 100,
                        y: d.y * 100,
                        id: d.id,
                      })),
                      valueFormatter: ({ x, y }) => `${x.toFixed(1)}%, ${y.toFixed(1)}%`,
                    },
                  ]}
                  tooltip={{ trigger: 'item' }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Each point represents a pair of legs; proximity indicates correlation strength.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default CorrelatedParlayDetailsScreen;
