import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Skeleton,
  Alert,
  Button,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InfoOutlined as InfoIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

// ----------------------------------------------------------------------
// Types (based on actual API response)
// ----------------------------------------------------------------------
interface ParlayLeg {
  id: string;
  description: string;
  odds: string;
  confidence: number;
  sport: string;
  market: string;
  teams?: { home: string; away: string };
  line?: number;
  value_side?: string;
  confidence_level?: string;
  player_name?: string;
  stat_type?: string;
}

interface ParlaySuggestion {
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
  risk_level: string | number;
  ai_metrics: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge?: number;
  };
  timestamp: string;
  isToday?: boolean;
  isGenerated?: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    suggestions: ParlaySuggestion[];
    is_real_data: boolean;
    is_realtime: boolean;
    last_updated: string;
  };
  last_updated: string;
  message: string;
}

// ----------------------------------------------------------------------
// API client
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const fetchParlaySuggestions = async (
  sport: string = 'all',
  limit: number = 10
): Promise<ParlaySuggestion[]> => {
  const url = new URL(`${API_BASE_URL}/api/parlay/suggestions`);
  url.searchParams.append('sport', sport);
  url.searchParams.append('limit', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch parlay suggestions: ${response.statusText}`);
  }
  const jsonResponse = await response.json();

  if (jsonResponse.success && jsonResponse.data && Array.isArray(jsonResponse.data.suggestions)) {
    return jsonResponse.data.suggestions;
  }
  console.warn('Unexpected API response structure:', jsonResponse);
  return [];
};

// ----------------------------------------------------------------------
// Helper components
// ----------------------------------------------------------------------
const OddsChip = ({ odds }: { odds: string }) => {
  const numericOdds = parseInt(odds, 10);
  const isFavorite = numericOdds < 0;
  const color = isFavorite ? 'success' : 'error';
  return <Chip label={odds} size="small" color={color} variant="outlined" />;
};

const ConfidenceIndicator = ({ value }: { value: number }) => {
  let color: 'success' | 'warning' | 'error' = 'success';
  if (value < 60) color = 'error';
  else if (value < 75) color = 'warning';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

const getRiskChip = (risk: string | number) => {
  let label: string;
  let color: 'success' | 'warning' | 'error' | 'default';
  if (typeof risk === 'number') {
    if (risk <= 2) {
      label = 'Low';
      color = 'success';
    } else if (risk <= 3) {
      label = 'Medium';
      color = 'warning';
    } else {
      label = 'High';
      color = 'error';
    }
  } else {
    label = risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
    color = risk.toLowerCase() === 'low' ? 'success' : risk.toLowerCase() === 'medium' ? 'warning' : 'error';
  }
  return <Chip label={label} size="small" color={color} variant="filled" />;
};

const SportChip = ({ sport }: { sport: string }) => {
  let color: 'primary' | 'secondary' | 'success' | 'warning' = 'primary';
  if (sport === 'NBA') color = 'primary';
  else if (sport === 'NFL') color = 'secondary';
  else if (sport === 'MLB') color = 'success';
  else if (sport === 'NHL') color = 'warning';
  return <Chip label={sport} size="small" color={color} variant="filled" />;
};

// ----------------------------------------------------------------------
// Main Screen Component
// ----------------------------------------------------------------------
const ParlayAnalyticsScreen: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<number>(0);

  const {
    data: parlays = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['parlaySuggestions', selectedSport],
    queryFn: () => fetchParlaySuggestions(selectedSport, 20),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const handleSportChange = (event: SelectChangeEvent) => {
    setSelectedSport(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const analytics = useMemo(() => {
    if (!parlays.length) return null;
    const totalParlays = parlays.length;
    const avgConfidence = parlays.reduce((acc, p) => acc + p.confidence, 0) / totalParlays;
    const totalLegs = parlays.reduce((acc, p) => acc + p.legs.length, 0);
    const avgLegsPerParlay = totalLegs / totalParlays;
    const sportCounts: Record<string, number> = {};
    parlays.forEach((p) => {
      sportCounts[p.sport] = (sportCounts[p.sport] || 0) + 1;
    });
    const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const avgEdge = parlays.reduce((acc, p) => acc + (p.ai_metrics?.edge || 0), 0) / totalParlays;

    return {
      totalParlays,
      avgConfidence,
      totalLegs,
      avgLegsPerParlay,
      sportCounts,
      topSport,
      avgEdge,
    };
  }, [parlays]);

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}>
        <Typography variant="h4" gutterBottom>
          Parlay Analytics
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading parlay suggestions: {(error as Error).message}
        </Alert>
        <Button variant="outlined" onClick={() => refetch()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Parlay Analytics
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel id="sport-filter-label">Sport</InputLabel>
            <Select
              labelId="sport-filter-label"
              value={selectedSport}
              label="Sport"
              onChange={handleSportChange}
            >
              <MenuItem value="all">All Sports</MenuItem>
              <MenuItem value="NBA">NBA</MenuItem>
              <MenuItem value="NFL">NFL</MenuItem>
              <MenuItem value="MLB">MLB</MenuItem>
              <MenuItem value="NHL">NHL</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()} color="primary">
              <AssessmentIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Analytics Summary Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Parlays
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {analytics.totalParlays}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg. Confidence
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                    {analytics.avgConfidence.toFixed(1)}%
                  </Typography>
                  {analytics.avgConfidence >= 75 ? (
                    <TrendingUpIcon color="success" />
                  ) : analytics.avgConfidence >= 60 ? (
                    <TrendingFlatIcon color="warning" />
                  ) : (
                    <TrendingDownIcon color="error" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Legs
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {analytics.totalLegs}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg {analytics.avgLegsPerParlay.toFixed(1)} legs/parlay
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Top Sport
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {analytics.topSport}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {analytics.sportCounts[analytics.topSport]} parlays
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Section */}
      {parlays.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Confidence Distribution
          </Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <BarChart
              dataset={parlays.map((p) => ({
                label: p.name.length > 20 ? p.name.substring(0, 20) + '…' : p.name,
                confidence: p.confidence,
                id: p.id,
              }))}
              xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
              series={[{ dataKey: 'confidence', label: 'Confidence (%)', color: '#3b82f6' }]}
              yAxis={[{ max: 100 }]}
              tooltip={{ trigger: 'item' }}
            />
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Parlay Suggestions" />
          <Tab label="Leg Analytics" />
        </Tabs>
      </Box>

      {/* Tab Panel: Parlay Suggestions */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {parlays.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">No parlay suggestions found for the selected sport.</Alert>
            </Grid>
          ) : (
            parlays.map((parlay) => (
              <Grid item xs={12} md={6} key={parlay.id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {parlay.name}
                      </Typography>
                      <SportChip sport={parlay.sport} />
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      <Chip label={`Odds: ${parlay.total_odds}`} size="small" variant="outlined" />
                      {getRiskChip(parlay.risk_level)}
                      <Chip label={`EV: ${parlay.expected_value}`} size="small" variant="outlined" />
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Confidence
                      </Typography>
                      <ConfidenceIndicator value={parlay.confidence} />
                    </Box>

                    <Accordion disableGutters elevation={0} square sx={{ border: 'none', '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {parlay.legs.length} Legs
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Odds</TableCell>
                                <TableCell align="right">Confidence</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {parlay.legs.map((leg) => (
                                <TableRow key={leg.id}>
                                  <TableCell>
                                    <Typography variant="body2">{leg.description}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {leg.sport} • {leg.market}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <OddsChip odds={leg.odds} />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Box display="flex" alignItems="center" justifyContent="flex-end">
                                      <Typography variant="body2">{leg.confidence}%</Typography>
                                      <Tooltip title={leg.confidence_level || 'N/A'}>
                                        <InfoIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} />
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>

                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        AI Analysis
                      </Typography>
                      <Typography variant="body2">{parlay.analysis}</Typography>
                    </Box>

                    <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">
                        Avg Leg Confidence: {parlay.ai_metrics.avg_leg_confidence?.toFixed(1)}%
                      </Typography>
                      {parlay.ai_metrics.edge !== undefined && (
                        <Typography variant="caption" color="text.secondary">
                          Edge: {(parlay.ai_metrics.edge * 100).toFixed(1)}%
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Stake: {parlay.ai_metrics.recommended_stake}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Tab Panel: Leg Analytics (with safeguards) */}
      {selectedTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Leg‑by‑Leg Performance Indicators
          </Typography>
          {parlays.length === 0 ? (
            <Alert severity="info">No data to display.</Alert>
          ) : (
            <>
              <Box sx={{ height: 300, width: '100%', mb: 4 }}>
                <PieChart
                  series={[
                    {
                      data: Object.entries(
                        parlays
                          .flatMap((p) => p.legs)
                          .reduce<Record<string, number>>((acc, leg) => {
                            const sport = leg.sport || 'Unknown';
                            acc[sport] = (acc[sport] || 0) + 1;
                            return acc;
                          }, {})
                      ).map(([sport, count]) => ({
                        id: sport,
                        value: count,
                        label: sport,
                      })),
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                    },
                  ]}
                  width={400}
                  height={200}
                />
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sport</TableCell>
                      <TableCell align="right">Total Legs</TableCell>
                      <TableCell align="right">Avg. Confidence</TableCell>
                      <TableCell align="right">Avg. Odds</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(
                      parlays
                        .flatMap((p) => p.legs)
                        .reduce<Record<string, { count: number; totalConfidence: number; totalOdds: number }>>(
                          (acc, leg) => {
                            const sport = leg.sport || 'Unknown';
                            if (!acc[sport]) {
                              acc[sport] = { count: 0, totalConfidence: 0, totalOdds: 0 };
                            }
                            acc[sport].count += 1;
                            acc[sport].totalConfidence += leg.confidence || 0;
                            const oddsNum = parseInt(leg.odds, 10);
                            acc[sport].totalOdds += isNaN(oddsNum) ? 0 : oddsNum;
                            return acc;
                          },
                          {}
                        )
                    ).map(([sport, stats]) => (
                      <TableRow key={sport}>
                        <TableCell component="th" scope="row">
                          <SportChip sport={sport} />
                        </TableCell>
                        <TableCell align="right">{stats.count}</TableCell>
                        <TableCell align="right">
                          {stats.count ? (stats.totalConfidence / stats.count).toFixed(1) : '0'}%
                        </TableCell>
                        <TableCell align="right">
                          {stats.totalOdds !== 0 ? (stats.totalOdds / stats.count).toFixed(0) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default ParlayAnalyticsScreen;
