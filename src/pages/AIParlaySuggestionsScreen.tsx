import React, { useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Slider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import { parlayApi } from '../services/parlay';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';

// ----------------------------------------------------------------------
// Types – based on backend response from /api/parlay/suggestions
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
  is_real_data?: boolean;
  has_data?: boolean;
}

// ----------------------------------------------------------------------
// Helper Components (unchanged)
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

const RiskChip = ({ risk }: { risk: string | number }) => {
  let label: string;
  let color: 'success' | 'warning' | 'error' = 'warning';
  if (typeof risk === 'number') {
    if (risk <= 2) { label = 'Low'; color = 'success'; }
    else if (risk <= 3) { label = 'Medium'; color = 'warning'; }
    else { label = 'High'; color = 'error'; }
  } else {
    label = risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
    if (risk.toLowerCase() === 'low') color = 'success';
    else if (risk.toLowerCase() === 'high') color = 'error';
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
// Main Component
// ----------------------------------------------------------------------

const AIParlaySuggestionsScreen: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('confidence');

  // 🔍 DIAGNOSTIC LOG: Component mounted
  console.log('📱 AIParlaySuggestionsScreen mounted');

  // Fetch data – rawData may be the full response object or an array
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['aiParlaySuggestions', selectedSport],
    queryFn: () => parlayApi.getSuggestions(selectedSport, 20),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // 🔍 DIAGNOSTIC LOGS: Raw data from API
  console.log('🔍 rawData from API:', rawData);
  console.log('⏳ isLoading:', isLoading);
  console.log('❌ error:', error);

  // Transform rawData into an array of ParlaySuggestion
const parlays = useMemo(() => {
  if (!rawData) {
    console.log('📦 rawData is falsy, returning []');
    return [];
  }
  console.log('🔄 Transforming rawData:', rawData);

  // ✅ NEW: Handle the nested structure from your API
  if (rawData?.data?.suggestions && Array.isArray(rawData.data.suggestions)) {
    console.log('✅ Found suggestions in data.suggestions, length:', rawData.data.suggestions.length);
    return rawData.data.suggestions as ParlaySuggestion[];
  }

  // Legacy checks (keep for compatibility)
  if (rawData && typeof rawData === 'object' && Array.isArray((rawData as any).suggestions)) {
    console.log('✅ Found suggestions array of length:', (rawData as any).suggestions.length);
    return (rawData as any).suggestions as ParlaySuggestion[];
  }
  if (Array.isArray(rawData)) {
    console.log('✅ rawData is array of length:', rawData.length);
    return rawData as ParlaySuggestion[];
  }

  console.warn('⚠️ rawData is not in expected format:', rawData);
  return [];
}, [rawData]);

  console.log('📦 parlays after transform:', parlays);

  // Filter and sort
  const filteredParlays = useMemo(() => {
    let filtered = [...parlays];
    console.log('🔢 Starting filter with', filtered.length, 'parlays');
    if (confidenceThreshold > 0) {
      filtered = filtered.filter((p) => p.confidence >= confidenceThreshold);
      console.log('🎯 After confidence filter:', filtered.length);
    }
    filtered.sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'edge') return (b.ai_metrics?.edge || 0) - (a.ai_metrics?.edge || 0);
      if (sortBy === 'legs') return b.legs.length - a.legs.length;
      return 0;
    });
    console.log('📊 After sorting, filteredParlays:', filtered);
    return filtered;
  }, [parlays, confidenceThreshold, sortBy]);

  // AI summary analytics
  const aiSummary = useMemo(() => {
    if (!parlays.length) return null;
    const total = parlays.length;
    const avgConfidence = parlays.reduce((acc, p) => acc + p.confidence, 0) / total;
    const avgEdge = parlays.reduce((acc, p) => acc + (p.ai_metrics?.edge || 0), 0) / total;
    const totalLegs = parlays.reduce((acc, p) => acc + p.legs.length, 0);
    const avgLegs = totalLegs / total;
    const avgStake = parlays.reduce((acc, p) => {
      const stake = parseFloat(p.ai_metrics?.recommended_stake?.replace('$', '') || '0');
      return acc + stake;
    }, 0) / total;
    return { total, avgConfidence, avgEdge, avgLegs, avgStake };
  }, [parlays]);

  const handleSportChange = (event: SelectChangeEvent) => {
    setSelectedSport(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const handleConfidenceChange = (_event: Event, value: number | number[]) => {
    setConfidenceThreshold(value as number);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Parlay Suggestions
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Error loading AI parlay suggestions: {(error as Error).message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            AI Parlay Suggestions
          </Typography>
          <Chip
            label={parlays.length ? `${parlays.length} active` : 'No active parlays'}
            size="small"
            color={parlays.length ? 'success' : 'default'}
          />
        </Box>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 120 }} size="small">
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
          <Tooltip title="Refresh AI picks">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* AI Summary Cards */}
      {aiSummary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  AI Confidence
                </Typography>
                <Box display="flex" alignItems="center">
                  <Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>
                    {aiSummary.avgConfidence.toFixed(1)}%
                  </Typography>
                  {aiSummary.avgConfidence >= 75 ? (
                    <TrendingUpIcon color="success" />
                  ) : aiSummary.avgConfidence >= 60 ? (
                    <TrendingFlatIcon color="warning" />
                  ) : (
                    <TrendingDownIcon color="error" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: 'success.50' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg. Edge
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  +{(aiSummary.avgEdge * 100).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: 'info.50' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Avg. Legs
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {aiSummary.avgLegs.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ bgcolor: 'warning.50' }}>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Recommended Stake
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  ${aiSummary.avgStake.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                Min Confidence:
              </Typography>
              <Slider
                value={confidenceThreshold}
                onChange={handleConfidenceChange}
                valueLabelDisplay="auto"
                step={5}
                marks={[{ value: 0, label: '0%' }, { value: 100, label: '100%' }]}
                min={0}
                max={100}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
              >
                <MenuItem value="confidence">Confidence (High to Low)</MenuItem>
                <MenuItem value="edge">Edge (High to Low)</MenuItem>
                <MenuItem value="legs">Legs (Most to Least)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              {filteredParlays.length} AI parlays available
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Confidence Distribution Chart */}
      {filteredParlays.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            AI Confidence Distribution
          </Typography>
          <Box sx={{ height: 250, width: '100%' }}>
            <BarChart
              dataset={filteredParlays.slice(0, 10).map((p) => ({
                label: p.name.length > 20 ? p.name.substring(0, 18) + '…' : p.name,
                confidence: p.confidence,
              }))}
              xAxis={[{ scaleType: 'band', dataKey: 'label' }]}
              series={[{ dataKey: 'confidence', label: 'AI Confidence (%)', color: '#8b5cf6' }]}
              yAxis={[{ max: 100 }]}
              tooltip={{ trigger: 'item' }}
            />
          </Box>
        </Paper>
      )}

      {/* Parlay Cards */}
      {filteredParlays.length === 0 ? (
        <Alert severity="info">No AI parlay suggestions match your filters.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredParlays.map((parlay) => (
            <Grid item xs={12} md={6} key={parlay.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {parlay.name}
                    </Typography>
                    <SportChip sport={parlay.sport} />
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Chip label={`Odds: ${parlay.total_odds}`} size="small" variant="outlined" />
                    <RiskChip risk={parlay.risk_level} />
                    <Chip label={`EV: ${parlay.expected_value}`} size="small" variant="outlined" />
                  </Box>

                  {/* AI Edge Badge */}
                  {parlay.ai_metrics?.edge !== undefined && (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        bgcolor: 'success.50',
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                        mb: 2,
                      }}
                    >
                      <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        AI Edge: +{(parlay.ai_metrics.edge * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  )}

                  {/* Confidence */}
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      AI Confidence
                    </Typography>
                    <ConfidenceIndicator value={parlay.confidence} />
                  </Box>

                  {/* Legs Accordion */}
                  <Accordion disableGutters elevation={0} square sx={{ border: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {parlay.legs.length} Legs (Avg. Confidence: {parlay.ai_metrics.avg_leg_confidence.toFixed(1)}%)
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

                  {/* AI Analysis */}
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      AI Analysis
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                      "{parlay.analysis}"
                    </Typography>
                  </Box>

                  {/* Footer: stake & timestamp */}
                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={`Recommended stake: ${parlay.ai_metrics.recommended_stake}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(parlay.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default AIParlaySuggestionsScreen;
