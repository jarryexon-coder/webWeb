// src/screens/ParlayAnalyticsScreen.tsx - FINAL VERSION (live data only, no mock)
import React, { useState, useMemo, useCallback } from 'react';
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
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Slider,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InfoOutlined as InfoIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  RocketLaunch as RocketLaunchIcon,
  Psychology as PsychologyIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { alpha } from '@mui/material/styles';

// ========== IMPORT UTILITIES ==========
import { useDebounce } from '../utils/useDebounce';
import { preprocessQuery } from '../utils/queryProcessor';
import { logPromptPerformance } from '../utils/analytics';

// ----------------------------------------------------------------------
// Types
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

// ----------------------------------------------------------------------
// API client – no mock fallback
// ----------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const fetchParlaySuggestions = async (
  sport: string = 'all',
  limit: number = 50
): Promise<ParlaySuggestion[]> => {
  const url = new URL(`${API_BASE_URL}/api/parlay/suggestions`);
  url.searchParams.append('sport', sport);
  url.searchParams.append('limit', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch parlay suggestions: ${response.statusText}`);
  }
  const jsonResponse = await response.json();
  console.log('📦 Full API response:', jsonResponse);

  // Extract the suggestions array – your API returns it at root
  let rawSuggestions: any[] = [];
  if (jsonResponse.success && Array.isArray(jsonResponse.suggestions)) {
    rawSuggestions = jsonResponse.suggestions;
  } else if (Array.isArray(jsonResponse)) {
    rawSuggestions = jsonResponse;
  } else if (jsonResponse.data && Array.isArray(jsonResponse.data)) {
    rawSuggestions = jsonResponse.data;
  } else {
    console.warn('Unexpected API response structure:', jsonResponse);
    return [];
  }

  // Map each raw suggestion to the expected ParlaySuggestion shape
  return rawSuggestions.map((item: any): ParlaySuggestion => {
    // Compute total odds if not provided
    const totalOdds = item.total_odds || (() => {
      const multiplier = item.legs.reduce((acc: number, leg: any) => {
        const oddsNum = parseInt(leg.odds);
        const mult = oddsNum > 0 ? (oddsNum / 100) + 1 : (100 / Math.abs(oddsNum)) + 1;
        return acc * mult;
      }, 1);
      return multiplier.toFixed(2);
    })();

    const name = item.name || `${item.sport || item.legs[0]?.sport || 'NBA'} ${item.legs.length}-Leg Parlay`;

    let risk_level: string | number = item.risk_level || 'Medium';
    if (!item.risk_level) {
      if (item.confidence >= 80) risk_level = 'Low';
      else if (item.confidence <= 60) risk_level = 'High';
    }

    return {
      id: item.id,
      name,
      sport: item.sport || item.legs[0]?.sport || 'NBA',
      type: item.type || 'standard',
      market_type: item.market_type || 'standard',
      legs: item.legs.map((leg: any) => ({
        id: leg.id,
        description: leg.description,
        odds: leg.odds,
        confidence: leg.confidence,
        sport: leg.sport,
        market: leg.market,
        player_name: leg.player_name,
        stat_type: leg.stat_type,
        confidence_level: leg.confidence_level,
        line: leg.line,
        value_side: leg.value_side,
      })),
      total_odds: totalOdds,
      confidence: item.confidence,
      confidence_level: item.confidence_level,
      analysis: item.analysis,
      expected_value: item.expected_value || '+0%',
      risk_level: risk_level,
      ai_metrics: {
        leg_count: item.ai_metrics?.leg_count || item.legs.length,
        avg_leg_confidence: item.ai_metrics?.avg_leg_confidence ||
          Math.round(item.legs.reduce((acc: number, leg: any) => acc + leg.confidence, 0) / item.legs.length),
        recommended_stake: item.ai_metrics?.recommended_stake || '$5.0',
        edge: item.ai_metrics?.edge,
      },
      timestamp: item.timestamp || new Date().toISOString(),
      isToday: item.isToday,
      isGenerated: item.isGenerated,
    };
  });
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
      <Typography variant="body2" color="text.secondary">{value}%</Typography>
      <LinearProgress variant="determinate" value={value} sx={{ flexGrow: 1, height: 6, borderRadius: 3 }} color={color} />
    </Box>
  );
};

const getRiskChip = (risk: string | number) => {
  let label: string;
  let color: 'success' | 'warning' | 'error' | 'default';
  if (typeof risk === 'number') {
    if (risk <= 2) { label = 'Low'; color = 'success'; }
    else if (risk <= 3) { label = 'Medium'; color = 'warning'; }
    else { label = 'High'; color = 'error'; }
  } else {
    label = risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase();
    color = risk.toLowerCase() === 'low' ? 'success' : risk.toLowerCase() === 'medium' ? 'warning' : 'error';
  }
  return <Chip label={label} size="small" color={color} variant="filled" />;
};

const SportChip = ({ sport }: { sport: string }) => {
  let color: 'primary' | 'secondary' | 'success' | 'warning' = 'primary';
  if (sport === 'NBA') color = 'primary';
  else if (sport === 'NHL') color = 'warning';
  return <Chip label={sport} size="small" color={color} variant="filled" />;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
const ParlayAnalyticsScreen: React.FC = () => {
  const [selectedSports, setSelectedSports] = useState<string[]>(['NBA', 'NHL']);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [confidenceRange, setConfidenceRange] = useState<number[]>([0, 100]);
  const [legCountRange, setLegCountRange] = useState<number[]>([1, 8]);
  const [showFilters, setShowFilters] = useState(false);

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  const {
    data: apiParlays = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['parlaySuggestions', selectedSports.join(',')],
    queryFn: () => fetchParlaySuggestions('all', 50),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // No mock fallback – if API returns empty, we show empty
  const parlays = apiParlays;

  const handleSportChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedSports(typeof value === 'string' ? value.split(',') : value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const filteredParlays = useMemo(() => {
    let filtered = parlays;

    if (selectedSports.length > 0) {
      filtered = filtered.filter(p => selectedSports.includes(p.sport));
    }

    if (debouncedSearch.trim()) {
      const intent = preprocessQuery(debouncedSearch);
      const lowerQuery = debouncedSearch.toLowerCase();
      filtered = filtered.filter(parlay => {
        if (intent.sport && parlay.sport.toLowerCase() !== intent.sport) return false;
        const nameMatch = parlay.name.toLowerCase().includes(lowerQuery);
        const legMatch = parlay.legs.some(leg =>
          leg.description.toLowerCase().includes(lowerQuery) ||
          (leg.player_name && leg.player_name.toLowerCase().includes(lowerQuery)) ||
          (leg.market && leg.market.toLowerCase().includes(lowerQuery))
        );
        const analysisMatch = parlay.analysis.toLowerCase().includes(lowerQuery);
        return nameMatch || legMatch || analysisMatch;
      });
    }

    filtered = filtered.filter(p =>
      p.confidence >= confidenceRange[0] && p.confidence <= confidenceRange[1]
    );

    filtered = filtered.filter(p =>
      p.legs.length >= legCountRange[0] && p.legs.length <= legCountRange[1]
    );

    return filtered;
  }, [parlays, selectedSports, debouncedSearch, confidenceRange, legCountRange]);

  const analytics = useMemo(() => {
    if (!filteredParlays.length) return null;
    const totalParlays = filteredParlays.length;
    const avgConfidence = filteredParlays.reduce((acc, p) => acc + p.confidence, 0) / totalParlays;
    const totalLegs = filteredParlays.reduce((acc, p) => acc + p.legs.length, 0);
    const avgLegsPerParlay = totalLegs / totalParlays;
    const sportCounts: Record<string, number> = {};
    filteredParlays.forEach(p => { sportCounts[p.sport] = (sportCounts[p.sport] || 0) + 1; });
    const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const avgEdge = filteredParlays.reduce((acc, p) => acc + (p.ai_metrics?.edge || 0), 0) / totalParlays;

    return { totalParlays, avgConfidence, totalLegs, avgLegsPerParlay, sportCounts, topSport, avgEdge };
  }, [filteredParlays]);

  const handleGenerateParlay = async () => {
    if (!customQuery.trim()) { alert('Please enter a parlay query'); return; }
    setGenerating(true);
    setShowGeneratorModal(true);
    try {
      const endpoint = `${API_BASE_URL}/api/ai/query`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery, sport: selectedSports.length === 1 ? selectedSports[0] : undefined }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      let analysis = '';
      if (data.analysis) analysis = data.analysis;
      else if (Array.isArray(data)) {
        analysis = data.map((item: any, idx: number) =>
          `**${idx+1}. ${item.player || 'Pick'}**\n   📈 **Market:** ${item.market || 'N/A'}\n   🎯 **Line:** ${item.line || 'N/A'}\n   💎 **Confidence:** ${item.confidence || 'medium'}\n   💰 **Odds:** ${item.odds || 'N/A'}`
        ).join('\n\n');
      } else analysis = 'No structured data returned.';
      setGeneratedResult({ success: true, analysis: `🎯 **AI Parlay Generator**\n\nBased on your query:\n\n${analysis}`, model: 'ai-model', timestamp: new Date().toISOString(), source: 'AI Query Endpoint' });
      logPromptPerformance(customQuery, 1, 0, 'generator');
    } catch (err) {
      console.error('Generator error:', err);
      setGeneratedResult({ success: true, analysis: '❌ Failed to generate. Please try again later.', source: 'Fallback' });
      logPromptPerformance(customQuery, 0, 0, 'fallback');
    } finally {
      setGenerating(false);
    }
  };

  const handleCloseGenerator = () => {
    setShowGeneratorModal(false);
    setGeneratorOpen(false);
    setCustomQuery('');
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Typography variant="h4" gutterBottom>Parlay Analytics</Typography>
        <Grid container spacing={3}>
          {[1,2,3,4].map(i => <Grid item xs={12} md={6} key={i}><Skeleton variant="rounded" height={200} /></Grid>)}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default' }}>
        <Alert severity="error" sx={{ mb: 2 }}>Error loading parlay suggestions: {(error as Error).message}</Alert>
        <Button variant="outlined" onClick={() => refetch()}>Retry</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">Parlay Analytics</Typography>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search parlays..." value={searchQuery} onChange={handleSearchChange} size="small" sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              endAdornment: searchQuery && <InputAdornment position="end"><IconButton size="small" onClick={handleClearSearch}><CloseIcon /></IconButton></InputAdornment>
            }}
          />
          <Tooltip title="Filter options">
            <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters ? 'primary' : 'default'}><FilterListIcon /></IconButton>
          </Tooltip>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="sport-multi-filter-label">Sports</InputLabel>
            <Select labelId="sport-multi-filter-label" multiple value={selectedSports} label="Sports" onChange={handleSportChange} renderValue={(selected) => selected.join(', ')}>
              <MenuItem value="NBA">NBA</MenuItem>
              <MenuItem value="NHL">NHL</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Generate custom parlay"><IconButton onClick={() => setGeneratorOpen(true)} color="primary"><AutoAwesomeIcon /></IconButton></Tooltip>
          <Tooltip title="Refresh data"><IconButton onClick={() => refetch()} color="primary"><AssessmentIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Advanced Filters</Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Confidence Range</Typography>
              <Slider value={confidenceRange} onChange={(_, v) => setConfidenceRange(v as number[])} valueLabelDisplay="auto" min={0} max={100} step={5} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Number of Legs</Typography>
              <Slider value={legCountRange} onChange={(_, v) => setLegCountRange(v as number[])} valueLabelDisplay="auto" min={1} max={8} step={1} marks={[{value:1,label:'1'},{value:4,label:'4'},{value:8,label:'8'}]} />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Total Parlays</Typography><Typography variant="h4" fontWeight="bold">{analytics.totalParlays}</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Avg. Confidence</Typography><Box display="flex" alignItems="center"><Typography variant="h4" fontWeight="bold" sx={{ mr: 1 }}>{analytics.avgConfidence.toFixed(1)}%</Typography>{analytics.avgConfidence >= 75 ? <TrendingUpIcon color="success" /> : analytics.avgConfidence >= 60 ? <TrendingFlatIcon color="warning" /> : <TrendingDownIcon color="error" />}</Box></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Total Legs</Typography><Typography variant="h4" fontWeight="bold">{analytics.totalLegs}</Typography><Typography variant="caption" color="text.secondary">Avg {analytics.avgLegsPerParlay.toFixed(1)} legs/parlay</Typography></CardContent></Card></Grid>
          <Grid item xs={12} sm={6} md={3}><Card variant="outlined"><CardContent><Typography color="text.secondary" gutterBottom>Top Sport</Typography><Typography variant="h4" fontWeight="bold">{analytics.topSport}</Typography><Typography variant="caption" color="text.secondary">{analytics.sportCounts[analytics.topSport]} parlays</Typography></CardContent></Card></Grid>
        </Grid>
      )}

      {/* Confidence Chart */}
      {filteredParlays.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Confidence Distribution</Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <BarChart dataset={filteredParlays.map(p => ({ label: p.name.length > 20 ? p.name.substring(0,20)+'…' : p.name, confidence: p.confidence, id: p.id }))} xAxis={[{ scaleType: 'band', dataKey: 'label' }]} series={[{ dataKey: 'confidence', label: 'Confidence (%)', color: '#3b82f6' }]} yAxis={[{ max: 100 }]} tooltip={{ trigger: 'item' }} />
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}><Tabs value={selectedTab} onChange={handleTabChange}><Tab label="Parlay Suggestions" /><Tab label="Leg Analytics" /></Tabs></Box>

      {/* Tab Panel: Parlay Suggestions */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {filteredParlays.length === 0 ? (
            <Grid item xs={12}><Alert severity="info">No parlays match your filters.</Alert></Grid>
          ) : (
            filteredParlays.map((parlay) => (
              <Grid item xs={12} md={6} key={parlay.id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" fontWeight="bold">{parlay.name}</Typography>
                      <SportChip sport={parlay.sport} />
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      <Chip label={`Odds: ${parlay.total_odds}`} size="small" variant="outlined" />
                      {getRiskChip(parlay.risk_level)}
                      <Chip label={`EV: ${parlay.expected_value}`} size="small" variant="outlined" />
                    </Box>
                    <Box mb={2}><Typography variant="body2" color="text.secondary" gutterBottom>Confidence</Typography><ConfidenceIndicator value={parlay.confidence} /></Box>
                    <Accordion disableGutters elevation={0} square sx={{ border: 'none', '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}><Typography variant="body2" fontWeight="medium">{parlay.legs.length} Legs</Typography></AccordionSummary>
                      <AccordionDetails sx={{ px: 0 }}>
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead><TableRow><TableCell>Description</TableCell><TableCell align="right">Odds</TableCell><TableCell align="right">Confidence</TableCell></TableRow></TableHead>
                            <TableBody>
                              {parlay.legs.map(leg => (
                                <TableRow key={leg.id}>
                                  <TableCell><Typography variant="body2">{leg.description}</Typography><Typography variant="caption" color="text.secondary">{leg.sport} • {leg.market}</Typography></TableCell>
                                  <TableCell align="right"><OddsChip odds={leg.odds} /></TableCell>
                                  <TableCell align="right"><Box display="flex" alignItems="center" justifyContent="flex-end"><Typography variant="body2">{leg.confidence}%</Typography><Tooltip title={leg.confidence_level || 'N/A'}><InfoIcon fontSize="small" sx={{ ml: 0.5, color: 'text.secondary' }} /></Tooltip></Box></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                    <Box mt={2}><Typography variant="body2" color="text.secondary" gutterBottom>AI Analysis</Typography><Typography variant="body2">{parlay.analysis}</Typography></Box>
                    <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">Avg Leg Confidence: {parlay.ai_metrics.avg_leg_confidence?.toFixed(1)}%</Typography>
                      {parlay.ai_metrics.edge !== undefined && <Typography variant="caption" color="text.secondary">Edge: {(parlay.ai_metrics.edge * 100).toFixed(1)}%</Typography>}
                      <Typography variant="caption" color="text.secondary">Stake: {parlay.ai_metrics.recommended_stake}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Tab Panel: Leg Analytics (unchanged) */}
      {selectedTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Leg‑by‑Leg Performance Indicators</Typography>
          {filteredParlays.length === 0 ? <Alert severity="info">No data to display.</Alert> : (
            <>
              <Box sx={{ height: 300, width: '100%', mb: 4 }}>
                <PieChart series={[{
                  data: Object.entries(filteredParlays.flatMap(p => p.legs).reduce<Record<string, number>>((acc, leg) => { acc[leg.sport] = (acc[leg.sport] || 0) + 1; return acc; }, {})).map(([sport, count]) => ({ id: sport, value: count, label: sport })),
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' }
                }]} width={400} height={200} />
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead><TableRow><TableCell>Sport</TableCell><TableCell align="right">Total Legs</TableCell><TableCell align="right">Avg. Confidence</TableCell><TableCell align="right">Avg. Odds</TableCell></TableRow></TableHead>
                  <TableBody>
                    {Object.entries(filteredParlays.flatMap(p => p.legs).reduce<Record<string, { count: number; totalConfidence: number; totalOdds: number }>>((acc, leg) => {
                      const sport = leg.sport || 'Unknown';
                      if (!acc[sport]) acc[sport] = { count: 0, totalConfidence: 0, totalOdds: 0 };
                      acc[sport].count += 1;
                      acc[sport].totalConfidence += leg.confidence || 0;
                      const oddsNum = parseInt(leg.odds, 10);
                      acc[sport].totalOdds += isNaN(oddsNum) ? 0 : oddsNum;
                      return acc;
                    }, {})).map(([sport, stats]) => (
                      <TableRow key={sport}>
                        <TableCell component="th" scope="row"><SportChip sport={sport} /></TableCell>
                        <TableCell align="right">{stats.count}</TableCell>
                        <TableCell align="right">{stats.count ? (stats.totalConfidence / stats.count).toFixed(1) : '0'}%</TableCell>
                        <TableCell align="right">{stats.totalOdds !== 0 ? (stats.totalOdds / stats.count).toFixed(0) : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}

      {/* Generator Dialog */}
      <Dialog open={generatorOpen} onClose={() => setGeneratorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle><Box display="flex" alignItems="center" gap={1}><RocketLaunchIcon color="primary" /><Typography variant="h6">AI Parlay Generator</Typography></Box></DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>Describe the parlay you want (e.g., "3‑leg NBA parlay with Jokic points over and Murray assists").</Typography>
          <TextField fullWidth multiline rows={3} placeholder="Enter your parlay query..." value={customQuery} onChange={(e) => setCustomQuery(e.target.value)} variant="outlined" sx={{ mb: 2 }} />
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label="NBA: Jokic over 25.5, Murray over 8.5 assists" onClick={() => setCustomQuery("Jokic over 25.5 points, Murray over 8.5 assists")} icon={<PsychologyIcon />} variant="outlined" />
            <Chip label="NHL: McDavid points, Draisaitl goals" onClick={() => setCustomQuery("McDavid over 1.5 points, Draisaitl anytime goal")} icon={<PsychologyIcon />} variant="outlined" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratorOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { setGeneratorOpen(false); handleGenerateParlay(); }} disabled={!customQuery.trim()} startIcon={<AutoAwesomeIcon />}>Generate</Button>
        </DialogActions>
      </Dialog>

      {/* Generation Result Modal */}
      <Dialog open={showGeneratorModal} onClose={() => !generating && setShowGeneratorModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{generating ? 'Generating...' : 'AI Parlay Generated!'}</DialogTitle>
        <DialogContent>
          {generating ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>Building your parlay...</Typography>
              <Typography variant="body2" color="text.secondary">Analyzing data and constructing optimal legs</Typography>
            </Box>
          ) : generatedResult && (
            <Paper sx={{ p: 2, bgcolor: 'background.default', whiteSpace: 'pre-line' }}>
              <Typography variant="body1" component="div">{generatedResult.analysis}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">Source: {generatedResult.source}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>{!generating && <Button onClick={handleCloseGenerator} variant="contained" fullWidth>Close</Button>}</DialogActions>
      </Dialog>
    </Container>
  );
};

export default ParlayAnalyticsScreen;
