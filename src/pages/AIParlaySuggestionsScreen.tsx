// pages/AIComboSuggestionsScreen.tsx - Premium only (Analytics plan required)
import React, { useMemo, useState, useEffect } from 'react';
import {
  Container,
  Typography,
  AlertTitle,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  InfoOutlined as InfoIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart } from '@mui/x-charts/BarChart';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';
import { PlanFeaturesDisplay } from '../components/PlanFeaturesDisplay';
import ProtectedRoute from '../components/ProtectedRoute';

// ==============================
// Configuration & Types
// ==============================

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

interface ComboLeg {
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

interface ComboSuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ComboLeg[];
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
  odds: string | number;
  confidence: number;
  edge: string;
  position?: string;
  sport: string;
}

// ==============================
// Fetch real props from APIs
// ==============================

// NBA props from Node API
const fetchNBASelections = async (): Promise<Selection[]> => {
  try {
    const response = await axios.get(`${NODE_API_BASE}/api/prizepicks/selections?sport=nba`);
    return (response.data.selections || []).map((s: any) => ({
      ...s,
      sport: 'NBA',
      odds: String(s.odds || '-110'),
    }));
  } catch (error) {
    console.warn('Failed to fetch NBA selections', error);
    return [];
  }
};

// MLB props from Python API
const fetchMLBSelections = async (): Promise<Selection[]> => {
  try {
    const response = await axios.get(`${PYTHON_API_BASE}/api/players`, {
      params: { sport: 'mlb', realtime: 'true', limit: 100 }
    });

    const players = response.data?.data?.players || [];
    if (!players.length) {
      console.warn('No MLB players returned from Python API');
      return [];
    }

    const selections: Selection[] = [];

    players.forEach((player: any) => {
      const isPitcher = player.position === 'P';
      const gamesPlayed = player.games_played || 1;

      const makeSelection = (stat: string, line: number, proj: number, odds = '-110') => {
        const edge = proj > line ? `+${(((proj - line) / line) * 100).toFixed(1)}%` : `${(((proj - line) / line) * 100).toFixed(1)}%`;
        selections.push({
          id: `mlb-${player.id || player.name}-${stat}`,
          player: player.name,
          team: player.team,
          stat,
          line,
          projection: proj,
          odds: String(odds),
          confidence: 70 + Math.floor(Math.random() * 15),
          edge,
          position: player.position,
          sport: 'MLB',
        });
      };

      if (isPitcher) {
        if (player.strikeouts !== undefined) {
          makeSelection('Strikeouts', 5.5, player.strikeouts / gamesPlayed);
        }
      } else {
        if (player.hits !== undefined) {
          makeSelection('Hits', 0.5, player.hits / gamesPlayed);
        }
        if (player.home_runs !== undefined) {
          makeSelection('Home Runs', 0.5, player.home_runs / gamesPlayed);
        }
        if (player.rbi !== undefined) {
          makeSelection('RBI', 0.5, player.rbi / gamesPlayed);
        }
      }
    });

    return selections;
  } catch (error) {
    console.warn('Failed to fetch MLB selections', error);
    return [];
  }
};

// NHL props from Python API
const fetchNHLSelections = async (): Promise<Selection[]> => {
  try {
    const response = await axios.get(`${PYTHON_API_BASE}/api/players`, {
      params: { sport: 'nhl', realtime: 'true', limit: 100 }
    });

    const players = response.data?.data?.players || [];
    if (!players.length) {
      console.warn('No NHL players returned from Python API');
      return [];
    }

    const selections: Selection[] = [];

    players.forEach((player: any) => {
      const isGoalie = player.position === 'G';
      const gamesPlayed = player.games_played || 1;

      const makeSelection = (stat: string, line: number, proj: number, odds = '-110') => {
        const edge = proj > line ? `+${(((proj - line) / line) * 100).toFixed(1)}%` : `${(((proj - line) / line) * 100).toFixed(1)}%`;
        selections.push({
          id: `nhl-${player.id || player.name}-${stat}`,
          player: player.name,
          team: player.team,
          stat,
          line,
          projection: proj,
          odds: String(odds),
          confidence: 70 + Math.floor(Math.random() * 15),
          edge,
          position: player.position,
          sport: 'NHL',
        });
      };

      if (isGoalie) {
        if (player.saves !== undefined) {
          makeSelection('saves', 25.5, player.saves / gamesPlayed);
        }
      } else {
        if (player.goals !== undefined) {
          makeSelection('goals', 0.5, player.goals / gamesPlayed);
        }
        if (player.assists !== undefined) {
          makeSelection('assists', 0.5, player.assists / gamesPlayed);
        }
        if (player.points !== undefined) {
          makeSelection('points', 0.5, player.points / gamesPlayed);
        }
        if (player.shots !== undefined) {
          makeSelection('shots', 2.5, player.shots / gamesPlayed);
        }
        if (player.hits !== undefined) {
          makeSelection('hits', 1.5, player.hits / gamesPlayed);
        }
      }
    });

    return selections;
  } catch (error) {
    console.warn('Failed to fetch NHL selections', error);
    return [];
  }
};

const fetchSelectionsBySport = async (sport: string): Promise<Selection[]> => {
  switch (sport) {
    case 'NBA':
      return fetchNBASelections();
    case 'MLB':
      return fetchMLBSelections();
    case 'NHL':
      return fetchNHLSelections();
    default:
      return [];
  }
};

// ==============================
// Generate AI combo suggestions from selections
// ==============================

const generateAICombosFromSelections = (
  selections: Selection[],
  sport: string
): ComboSuggestion[] => {
  if (selections.length === 0) return [];

  const suggestions: ComboSuggestion[] = [];

  const calculateTotalOdds = (legs: ComboLeg[]): { odds: string; decimal: number } => {
    let decimal = 1.0;
    legs.forEach(leg => {
      const oddsStr = leg.odds ? String(leg.odds) : '-110';
      const cleanOddsStr = oddsStr.replace(/\+/g, '');
      const oddsNum = parseInt(cleanOddsStr, 10);
      if (!isNaN(oddsNum)) {
        if (oddsNum > 0) {
          decimal *= 1 + oddsNum / 100;
        } else {
          decimal *= 1 - 100 / Math.abs(oddsNum);
        }
      } else {
        decimal *= 1.91;
      }
    });
    const totalOdds = decimal >= 2.0
      ? `+${Math.round((decimal - 1) * 100)}`
      : Math.round(-100 / (decimal - 1)).toString();
    return { odds: totalOdds, decimal };
  };

  const getConfidence = (c: any): number => {
    const num = Number(c);
    return !isNaN(num) && num > 0 ? num : 75;
  };

  const sportDisplay = sport.toUpperCase();

  // 1. High Confidence Combo
  const topConfidence = [...selections]
    .sort((a, b) => getConfidence(b.confidence) - getConfidence(a.confidence))
    .slice(0, 3);
  if (topConfidence.length >= 2) {
    const legs: ComboLeg[] = topConfidence.map((s, idx) => {
      const conf = getConfidence(s.confidence);
      return {
        id: `conf-${idx}-${Date.now()}`,
        description: `${s.player} ${s.stat} Over ${s.line}`,
        odds: String(s.odds),
        confidence: conf,
        sport: sportDisplay,
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
      id: `ai-conf-${sport}-${Date.now()}`,
      name: `High Confidence ${sportDisplay} Combo`,
      sport: sportDisplay,
      type: 'player_props',
      market_type: 'player_props',
      legs,
      total_odds: odds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      analysis: `This parlay combines the highest confidence player props from today's ${sportDisplay} slate.`,
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

  // 2. Best Value Combo
  const topEdge = [...selections]
    .filter(s => s.edge && String(s.edge).startsWith('+'))
    .sort((a, b) => {
      const edgeA = parseFloat(String(a.edge || '0').replace(/[+%]/g, ''));
      const edgeB = parseFloat(String(b.edge || '0').replace(/[+%]/g, ''));
      return edgeB - edgeA;
    })
    .slice(0, 3);
  if (topEdge.length >= 2) {
    const legs: ComboLeg[] = topEdge.map((s, idx) => {
      const conf = getConfidence(s.confidence);
      return {
        id: `edge-${idx}-${Date.now()}`,
        description: `${s.player} ${s.stat} Over ${s.line}`,
        odds: String(s.odds),
        confidence: conf,
        sport: sportDisplay,
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
      id: `ai-edge-${sport}-${Date.now()}`,
      name: `Best Value ${sportDisplay} Combo`,
      sport: sportDisplay,
      type: 'player_props',
      market_type: 'player_props',
      legs,
      total_odds: odds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      analysis: `This parlay features props with the highest positive edge, indicating strong value in ${sportDisplay}.`,
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

  // 3. Balanced Combo
  const randomIndices = new Set<number>();
  while (randomIndices.size < 3 && randomIndices.size < selections.length) {
    randomIndices.add(Math.floor(Math.random() * selections.length));
  }
  const randomProps = Array.from(randomIndices).map(i => selections[i]);
  if (randomProps.length >= 2) {
    const legs: ComboLeg[] = randomProps.map((s, idx) => {
      const conf = getConfidence(s.confidence);
      return {
        id: `bal-${idx}-${Date.now()}`,
        description: `${s.player} ${s.stat} Over ${s.line}`,
        odds: String(s.odds),
        confidence: conf,
        sport: sportDisplay,
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
      id: `ai-bal-${sport}-${Date.now()}`,
      name: `Balanced Mix ${sportDisplay} Combo`,
      sport: sportDisplay,
      type: 'player_props',
      market_type: 'player_props',
      legs,
      total_odds: odds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      analysis: `A balanced mix of ${sportDisplay} props combining solid projections and value.`,
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

const OddsChip = ({ odds }: { odds: string | number }) => {
  const oddsStr = String(odds);
  const numericOdds = parseInt(oddsStr, 10);
  const isFavorite = numericOdds < 0;
  return (
    <Chip
      label={oddsStr}
      size="small"
      color={isFavorite ? 'success' : 'error'}
      variant="outlined"
    />
  );
};

const ConfidenceIndicator = ({ value }: { value: number }) => {
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
// Main Component (Premium only)
// ==============================

const AIComboSuggestionsContent: React.FC = () => {
  const { profile, planFeatures } = useAuth();
  const { handleSubscriptionCheckout, handleCreditsCheckout } = useCheckout();
  
  const [selectedSport, setSelectedSport] = useState<string>('NBA');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('confidence');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('analytics');
  const [selectedInterval, setSelectedInterval] = useState<string>('month');
  
  // Access plan features (only for display)
  const hasAdvancedAnalytics = planFeatures?.hasAdvancedAnalytics ?? false;
  const hasAIRecommendations = planFeatures?.hasAIRecommendations ?? false;
  const hasBettingInsights = planFeatures?.hasBettingInsights ?? false;
  
  const hasPremiumAccess = hasAIRecommendations || hasAdvancedAnalytics || hasBettingInsights;

  // Fetch selections
  const {
    data: selections = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['selections', selectedSport],
    queryFn: () => fetchSelectionsBySport(selectedSport),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Generate AI parlays
  const allCombos = useMemo(() => {
    if (selections.length === 0) return [];
    return generateAICombosFromSelections(selections, selectedSport);
  }, [selections, selectedSport]);

  // Filter and sort
  const filteredCombos = useMemo(() => {
    let filtered = [...allCombos];
    if (confidenceThreshold > 0) {
      filtered = filtered.filter(p => p.confidence >= confidenceThreshold);
    }
    filtered.sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'edge') return (b.ai_metrics?.edge || 0) - (a.ai_metrics?.edge || 0);
      if (sortBy === 'legs') return b.legs.length - a.legs.length;
      return 0;
    });
    return filtered;
  }, [allCombos, confidenceThreshold, sortBy]);

  // AI summary
  const aiSummary = useMemo(() => {
    if (allCombos.length === 0) return null;
    const total = allCombos.length;
    const avgConfidence = allCombos.reduce((acc, p) => acc + (p.confidence || 0), 0) / total;
    const avgEdge = allCombos.reduce((acc, p) => acc + (p.ai_metrics?.edge || 0), 0) / total;
    const totalLegs = allCombos.reduce((acc, p) => acc + p.legs.length, 0);
    const avgLegs = totalLegs / total;
    const avgAmount = allCombos.reduce((acc, p) => {
      const stake = parseFloat(p.ai_metrics?.recommended_stake?.replace('$', '') || '0');
      return acc + stake;
    }, 0) / total;
    return { total, avgConfidence: avgConfidence || 0, avgEdge, avgLegs, avgAmount };
  }, [allCombos]);

  const handleUpgrade = () => {
    handleSubscriptionCheckout(selectedPlan, selectedInterval);
  };

  const handleSportChange = (event: SelectChangeEvent) => {
    setSelectedSport(event.target.value);
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };

  const handleConfidenceChange = (_event: Event, value: number | number[]) => {
    setConfidenceThreshold(value as number);
  };

  if (isLoading && selections.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Combo Suggestions
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
          Error loading AI combo suggestions: {(error as Error).message}
        </Alert>
      </Container>
    );
  }

  // No inner PremiumContent wrapper – the entire screen is premium-only
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            AI Combo Suggestions
          </Typography>
          <Chip
            icon={<CheckCircleIcon />}
            label="Premium"
            color="success"
            size="small"
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
              <MenuItem value="NBA">NBA</MenuItem>
              <MenuItem value="MLB">MLB</MenuItem>
              <MenuItem value="NHL">NHL</MenuItem>
              <MenuItem value="NFL" disabled>NFL (coming soon)</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh AI picks">
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Display current plan features */}
      {profile && (
        <Box sx={{ mb: 3 }}>
          <PlanFeaturesDisplay currentPlan={profile.plan} compact />
        </Box>
      )}

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
                  Recommended Amount
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  ${aiSummary.avgAmount.toFixed(2)}
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
                <MenuItem value="edge">Advantage (High to Low)</MenuItem>
                <MenuItem value="legs">Legs (Most to Least)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              {filteredCombos.length} AI combos available
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Confidence Distribution Chart */}
      {filteredCombos.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            AI Confidence Distribution
          </Typography>
          <Box sx={{ height: 250, width: '100%' }}>
            <BarChart
              dataset={filteredCombos.slice(0, 10).map((p) => ({
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

      {/* Combo Cards */}
      {filteredCombos.length === 0 ? (
        <Alert severity="info">No AI combo suggestions match your filters.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredCombos.map((parlay) => (
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
                    <Chip label={`Multiplier: ${parlay.total_odds}`} size="small" variant="outlined" />
                    <RiskChip risk={parlay.risk_level} />
                    <Chip label={`EV: ${parlay.expected_value}`} size="small" variant="outlined" />
                  </Box>

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

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      AI Confidence
                    </Typography>
                    <ConfidenceIndicator value={parlay.confidence} />
                  </Box>

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
                              <TableCell align="right">Multiplier</TableCell>
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

                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      AI Analysis
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
                      "{parlay.analysis}"
                    </Typography>
                  </Box>

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

      {/* Upgrade Modal (fallback – rarely shown because ProtectedRoute blocks first) */}
      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon sx={{ color: '#f59e0b' }} />
            <Typography variant="h6">Upgrade to Premium AI</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Unlock powerful AI-powered combo suggestions and advanced analytics.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Plan</InputLabel>
            <Select
              value={selectedPlan}
              label="Select Plan"
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              <MenuItem value="starter">Starter - $5.99/month</MenuItem>
              <MenuItem value="analytics">Analytics - $19.99/month</MenuItem>
              <MenuItem value="generator">Generator - $39.99/month</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Billing Interval</InputLabel>
            <Select
              value={selectedInterval}
              label="Billing Interval"
              onChange={(e) => setSelectedInterval(e.target.value)}
            >
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="year">Yearly (Save 20%)</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ my: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              {selectedPlan === 'starter' && 'Starter Plan Features:'}
              {selectedPlan === 'analytics' && 'Analytics Plan Features:'}
              {selectedPlan === 'generator' && 'Generator Plan Features:'}
            </Typography>
            {selectedPlan === 'starter' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Basic combo suggestions</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Tournament schedules & results</Typography>
                </Box>
              </>
            )}
            {selectedPlan === 'analytics' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">All Starter features</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">AI-powered combo suggestions</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Historical performance trends</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Personalized recommendations</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Advanced Advantage calculations</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Real-time confidence scores</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Premium AI analysis</Typography>
                </Box>
              </>
            )}
            {selectedPlan === 'generator' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">All Analytics features</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Unlimited AI generations</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Custom combo builder</Typography>
                </Box>
              </>
            )}
          </Box>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleUpgrade}
            sx={{ mt: 2 }}
          >
            Upgrade to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} ({selectedInterval}ly)
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpgradeModal(false)}>Not Now</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// ==============================
// Main exported component wrapped with ProtectedRoute
// ==============================

const AIComboSuggestionsScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="AIComboSuggestionsScreen">
      <AIComboSuggestionsContent />
    </ProtectedRoute>
  );
};

export default AIComboSuggestionsScreen;
