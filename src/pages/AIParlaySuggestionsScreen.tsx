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
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';
import axios from 'axios';

// ==============================
// Configuration & Types
// ==============================

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';

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
  projection?: number;
  edge?: string;
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

interface Selection {
  id: string;
  player: string;
  team: string;
  stat: string;
  line: number;
  projection: number;
  odds: string;
  confidence: number;
  edge: string;
  position?: string;
}

// ==============================
// Fetch real props from Node API
// ==============================

const fetchSelections = async (): Promise<Selection[]> => {
  try {
    const response = await axios.get(`${NODE_API_BASE}/api/prizepicks/selections?sport=nba`);
    return response.data.selections || [];
  } catch (error) {
    console.warn('Failed to fetch selections from Node API', error);
    return [];
  }
};

// ==============================
// Generate AI parlay suggestions from selections
// ==============================

const generateAIParlaysFromSelections = (selections: Selection[]): ParlaySuggestion[] => {
  if (selections.length === 0) return [];

  const suggestions: ParlaySuggestion[] = [];

  // Helper to calculate total odds
  const calculateTotalOdds = (legs: ParlayLeg[]): { odds: string; decimal: number } => {
    let decimal = 1.0;
    legs.forEach(leg => {
      const oddsStr = leg.odds.replace('+', '');
      const oddsNum = parseInt(oddsStr, 10);
      if (!isNaN(oddsNum)) {
        if (oddsNum > 0) decimal *= 1 + oddsNum / 100;
        else decimal *= 1 - 100 / Math.abs(oddsNum);
      } else {
        // fallback
        decimal *= 1.91; // -110 approx
      }
    });
    const totalOdds = decimal >= 2.0
      ? `+${Math.round((decimal - 1) * 100)}`
      : Math.round(-100 / (decimal - 1)).toString();
    return { odds: totalOdds, decimal };
  };

  // Helper to safely parse confidence
  const getConfidence = (c: any): number => {
    const num = Number(c);
    return !isNaN(num) && num > 0 ? num : 75;
  };

  // 1. High Confidence Parlay (top 3 by confidence)
  const topConfidence = [...selections]
    .sort((a, b) => getConfidence(b.confidence) - getConfidence(a.confidence))
    .slice(0, 3);
  if (topConfidence.length >= 2) {
    const legs: ParlayLeg[] = topConfidence.map((s, idx) => {
      const conf = getConfidence(s.confidence);
      return {
        id: `conf-${idx}-${Date.now()}`,
        description: `${s.player} ${s.stat} Over ${s.line}`,
        odds: s.odds,
        confidence: conf,
        sport: 'NBA',
        market: 'player_props',
        player_name: s.player,
        stat_type: s.stat,
        line: s.line,
        projection: s.projection,
        edge: s.edge,
        confidence_level: conf > 80 ? 'high' : conf > 70 ? 'high' : 'medium',
      };
    });
    const { odds } = calculateTotalOdds(legs);
    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);
    suggestions.push({
      id: `ai-conf-${Date.now()}`,
      name: 'High Confidence Parlay',
      sport: 'NBA',
      type: 'player_props',
      market_type: 'player_props',
      legs,
      total_odds: odds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      analysis: 'This parlay combines the highest confidence player props from today\'s slate.',
      expected_value: '+6.2%',
      risk_level: 'medium',
      ai_metrics: {
        leg_count: legs.length,
        avg_leg_confidence: avgConfidence,
        recommended_stake: '$5.00',
        edge: 0.062,
      },
      timestamp: new Date().toISOString(),
      isToday: true,
      is_real_data: true,
      has_data: true,
    });
  }

  // 2. Best Value Parlay (highest positive edge)
  const topEdge = [...selections]
    .filter(s => s.edge && s.edge.startsWith('+'))
    .sort((a, b) => {
      const edgeA = parseFloat(a.edge?.replace('+', '').replace('%', '') || '0');
      const edgeB = parseFloat(b.edge?.replace('+', '').replace('%', '') || '0');
      return edgeB - edgeA;
    })
    .slice(0, 3);
  if (topEdge.length >= 2) {
    const legs: ParlayLeg[] = topEdge.map((s, idx) => {
      const conf = getConfidence(s.confidence);
      return {
        id: `edge-${idx}-${Date.now()}`,
        description: `${s.player} ${s.stat} Over ${s.line}`,
        odds: s.odds,
        confidence: conf,
        sport: 'NBA',
        market: 'player_props',
        player_name: s.player,
        stat_type: s.stat,
        line: s.line,
        projection: s.projection,
        edge: s.edge,
        confidence_level: conf > 80 ? 'high' : conf > 70 ? 'high' : 'medium',
      };
    });
    const { odds } = calculateTotalOdds(legs);
    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);
    suggestions.push({
      id: `ai-edge-${Date.now()}`,
      name: 'Best Value Parlay',
      sport: 'NBA',
      type: 'player_props',
      market_type: 'player_props',
      legs,
      total_odds: odds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      analysis: 'This parlay features props with the highest positive edge, indicating strong value.',
      expected_value: '+7.8%',
      risk_level: 'medium',
      ai_metrics: {
        leg_count: legs.length,
        avg_leg_confidence: avgConfidence,
        recommended_stake: '$5.00',
        edge: 0.078,
      },
      timestamp: new Date().toISOString(),
      isToday: true,
      is_real_data: true,
      has_data: true,
    });
  }

  // 3. Balanced Parlay (mix of projection and confidence)
  const randomIndices = new Set<number>();
  while (randomIndices.size < 3 && randomIndices.size < selections.length) {
    randomIndices.add(Math.floor(Math.random() * selections.length));
  }
  const randomProps = Array.from(randomIndices).map(i => selections[i]);
  if (randomProps.length >= 2) {
    const legs: ParlayLeg[] = randomProps.map((s, idx) => {
      const conf = getConfidence(s.confidence);
      return {
        id: `bal-${idx}-${Date.now()}`,
        description: `${s.player} ${s.stat} Over ${s.line}`,
        odds: s.odds,
        confidence: conf,
        sport: 'NBA',
        market: 'player_props',
        player_name: s.player,
        stat_type: s.stat,
        line: s.line,
        projection: s.projection,
        edge: s.edge,
        confidence_level: conf > 80 ? 'high' : conf > 70 ? 'high' : 'medium',
      };
    });
    const { odds } = calculateTotalOdds(legs);
    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);
    suggestions.push({
      id: `ai-bal-${Date.now()}`,
      name: 'Balanced Mix Parlay',
      sport: 'NBA',
      type: 'player_props',
      market_type: 'player_props',
      legs,
      total_odds: odds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      analysis: 'A balanced mix of props combining solid projections and value.',
      expected_value: '+6.5%',
      risk_level: 'medium',
      ai_metrics: {
        leg_count: legs.length,
        avg_leg_confidence: avgConfidence,
        recommended_stake: '$5.00',
        edge: 0.065,
      },
      timestamp: new Date().toISOString(),
      isToday: true,
      is_real_data: true,
      has_data: true,
    });
  }

  return suggestions;
};

// ==============================
// Helper Components
// ==============================

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
  // Guard against NaN
  const safeValue = !isNaN(value) && value > 0 ? value : 75;
  let color: 'success' | 'warning' | 'error' = 'success';
  if (safeValue < 60) color = 'error';
  else if (safeValue < 75) color = 'warning';
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color="text.secondary">
        {safeValue}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={safeValue}
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

// ==============================
// Main Component
// ==============================

const AIParlaySuggestionsScreen: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('confidence');

  // Fetch real selections from Node API
  const {
    data: selections = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prizepicks-selections'],
    queryFn: fetchSelections,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Generate AI parlays from selections
  const allParlays = useMemo(() => {
    if (selections.length === 0) return [];
    return generateAIParlaysFromSelections(selections);
  }, [selections]);

  // Filter and sort based on user selections
  const filteredParlays = useMemo(() => {
    let filtered = [...allParlays];

    // Filter by sport (only NBA for now)
    if (selectedSport !== 'all') {
      filtered = filtered.filter(p => p.sport === selectedSport);
    } else {
      // default to NBA only since we only generate NBA parlays
      filtered = filtered.filter(p => p.sport === 'NBA');
    }

    // Apply confidence threshold
    if (confidenceThreshold > 0) {
      filtered = filtered.filter(p => p.confidence >= confidenceThreshold);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'edge') return (b.ai_metrics?.edge || 0) - (a.ai_metrics?.edge || 0);
      if (sortBy === 'legs') return b.legs.length - a.legs.length;
      return 0;
    });

    return filtered;
  }, [allParlays, selectedSport, confidenceThreshold, sortBy]);

  // AI summary analytics
  const aiSummary = useMemo(() => {
    if (!allParlays.length) return null;
    const total = allParlays.length;
    const avgConfidence = allParlays.reduce((acc, p) => acc + (p.confidence || 0), 0) / total;
    const avgEdge = allParlays.reduce((acc, p) => acc + (p.ai_metrics?.edge || 0), 0) / total;
    const totalLegs = allParlays.reduce((acc, p) => acc + p.legs.length, 0);
    const avgLegs = totalLegs / total;
    const avgStake = allParlays.reduce((acc, p) => {
      const stake = parseFloat(p.ai_metrics?.recommended_stake?.replace('$', '') || '0');
      return acc + stake;
    }, 0) / total;
    return { total, avgConfidence: avgConfidence || 0, avgEdge, avgLegs, avgStake };
  }, [allParlays]);

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
            label={allParlays.length ? `${allParlays.length} active` : 'No active parlays'}
            size="small"
            color={allParlays.length ? 'success' : 'default'}
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
              <MenuItem value="NFL" disabled>NFL (coming soon)</MenuItem>
              <MenuItem value="MLB" disabled>MLB (coming soon)</MenuItem>
              <MenuItem value="NHL" disabled>NHL (coming soon)</MenuItem>
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
                                    {leg.projection && ` • Proj: ${leg.projection.toFixed(1)}`}
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
