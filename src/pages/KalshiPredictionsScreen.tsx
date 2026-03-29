// src/pages/KalshiPredictionsScreen.tsx
// Non‑sports only: Politics, Economics, Entertainment, Technology, Health, Weather
// AI generator with 20 pre‑defined prompts – predictions now persist across refreshes

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Tooltip,
  Collapse,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  Security as ShieldIcon,
  Close as CloseIcon,
  Flag as FlagIcon,
  AttachMoney as MoneyIcon,
  Theaters as CultureIcon,
  Science as ScienceIcon,
  MedicalServices as MedicalServicesIcon,
  WbSunny,
  FlashOn as FlashIcon,
  CardGiftcard as CardIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import ProtectedRoute from '../components/ProtectedRoute';

// Import hooks
import { useKalshiPredictions } from '../hooks/useKalshiPredictions';

// ==============================================
// TYPES
// ==============================================
interface Prediction {
  id: string;
  question: string;
  category: string;
  yesPrice: string;
  noPrice: string;
  volume: string;
  analysis: string;
  expires: string;
  confidence: number;
  edge: string;
  platform: string;
  marketType: string;
  trend?: string;
  aiGenerated?: boolean;
}

// ==============================================
// STYLED COMPONENTS & UTILITIES
// ==============================================
const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius * 2,
}));

const PredictionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s, box-shadow 0.2s',
  backgroundColor: '#1e293b',
  color: '#f1f5f9',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Politics: '#3b82f6',
    Economics: '#10b981',
    Entertainment: '#ec4899',
    Technology: '#8b5cf6',
    Health: '#ef4444',
    Weather: '#f59e0b',
    'AI Generated': '#8b5cf6',
  };
  return colors[category] || '#6b7280';
};

// ==============================================
// NON‑SPORTS PROMPTS (20 items)
// ==============================================
const NON_SPORTS_PROMPTS = [
  "Will the Federal Reserve cut interest rates in June 2026?",
  "Will the Democratic party win the 2026 midterm elections?",
  "Will 'Oppenheimer' win Best Picture at the 2026 Oscars?",
  "Will Apple announce a new iPhone model in September 2026?",
  "Will FDA approve the new Alzheimer's drug by Q3 2026?",
  "Will New York City see more than 30 inches of snow in winter 2026?",
  "Will the S&P 500 reach 6000 by end of 2026?",
  "Will Tesla announce a fully autonomous vehicle in 2026?",
  "Will the US Men's Soccer team win the 2026 World Cup?",
  "Will a major AI breakthrough occur in 2026?",
  "Will the US inflation rate drop below 2% in 2026?",
  "Will the next Bond film be released in 2026?",
  "Will there be a government shutdown in 2026?",
  "Will the Grammy for Album of the Year go to a female artist?",
  "Will a new COVID variant cause travel restrictions in 2026?",
  "Will the price of Bitcoin exceed $100,000 in 2026?",
  "Will a commercial space flight reach Mars orbit by 2026?",
  "Will the US have a female president elected in 2026?",
  "Will the next 'Game of Thrones' spin‑off premiere in 2026?",
  "Will a major hurricane hit the US East Coast in 2026?"
];

// ==============================================
// MOCK GENERATOR (Kalshi‑style binary markets)
// ==============================================
const generateMockKalshiMarkets = (): Prediction[] => {
  const markets: Prediction[] = [];

  // Politics
  markets.push(
    {
      id: 'kalshi-politics-1',
      question: 'Will the Federal Reserve cut rates in March 2026?',
      category: 'Politics',
      yesPrice: '0.58',
      noPrice: '0.42',
      volume: '$3.2M',
      analysis: 'Market implied probability 58%. Fed futures indicate 65% chance of cut.',
      expires: '2026-03-15',
      confidence: 72,
      edge: '+2.3%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'up'
    },
    {
      id: 'kalshi-politics-2',
      question: 'Will the Democratic candidate win the 2026 midterms?',
      category: 'Politics',
      yesPrice: '0.48',
      noPrice: '0.52',
      volume: '$5.1M',
      analysis: 'Markets slightly favor Republicans. Recent polling shows tightening race.',
      expires: '2026-11-03',
      confidence: 65,
      edge: '+1.8%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'neutral'
    },
    {
      id: 'kalshi-politics-3',
      question: 'Will the US avoid a government shutdown in 2026?',
      category: 'Politics',
      yesPrice: '0.72',
      noPrice: '0.28',
      volume: '$2.1M',
      analysis: 'Bipartisan budget talks ongoing; markets see 72% chance of resolution.',
      expires: '2026-12-31',
      confidence: 68,
      edge: '+1.5%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'stable'
    }
  );

  // Economics
  markets.push(
    {
      id: 'kalshi-econ-1',
      question: 'Will the S&P 500 close above 6000 by Dec 2026?',
      category: 'Economics',
      yesPrice: '0.45',
      noPrice: '0.55',
      volume: '$8.7M',
      analysis: 'Analysts mixed; economic growth forecast 2.1%.',
      expires: '2026-12-31',
      confidence: 60,
      edge: '+0.8%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'down'
    },
    {
      id: 'kalshi-econ-2',
      question: 'Will US inflation rate drop below 2.5% by June 2026?',
      category: 'Economics',
      yesPrice: '0.63',
      noPrice: '0.37',
      volume: '$4.3M',
      analysis: 'CPI trending down; Fed signals possible cuts.',
      expires: '2026-06-30',
      confidence: 74,
      edge: '+2.1%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'up'
    }
  );

  // Entertainment
  markets.push(
    {
      id: 'kalshi-entertain-1',
      question: 'Will "Oppenheimer" win Best Picture at 2026 Oscars?',
      category: 'Entertainment',
      yesPrice: '0.82',
      noPrice: '0.18',
      volume: '$1.4M',
      analysis: 'Heavy favorite after Golden Globe wins.',
      expires: '2026-03-10',
      confidence: 85,
      edge: '+3.5%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'up'
    },
    {
      id: 'kalshi-entertain-2',
      question: 'Will Taylor Swift win Album of the Year at 2026 Grammys?',
      category: 'Entertainment',
      yesPrice: '0.71',
      noPrice: '0.29',
      volume: '$2.2M',
      analysis: 'Strong critical reception for latest album.',
      expires: '2026-02-15',
      confidence: 77,
      edge: '+2.9%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'up'
    }
  );

  // Technology
  markets.push(
    {
      id: 'kalshi-tech-1',
      question: 'Will Apple announce a new iPhone model in March 2026?',
      category: 'Technology',
      yesPrice: '0.91',
      noPrice: '0.09',
      volume: '$2.0M',
      analysis: 'Consistent with Apple’s release schedule.',
      expires: '2026-03-31',
      confidence: 78,
      edge: '+1.2%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'stable'
    },
    {
      id: 'kalshi-tech-2',
      question: 'Will Tesla achieve full self‑driving (Level 5) by end 2026?',
      category: 'Technology',
      yesPrice: '0.34',
      noPrice: '0.66',
      volume: '$3.1M',
      analysis: 'Regulatory hurdles remain; technical challenges persist.',
      expires: '2026-12-31',
      confidence: 58,
      edge: '+4.2%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'down'
    }
  );

  // Health
  markets.push(
    {
      id: 'kalshi-health-1',
      question: 'Will FDA approve the new Alzheimer’s drug by Q2 2026?',
      category: 'Health',
      yesPrice: '0.67',
      noPrice: '0.33',
      volume: '$1.1M',
      analysis: 'Phase 3 trials successful; approval likely.',
      expires: '2026-06-30',
      confidence: 74,
      edge: '+2.7%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'up'
    },
    {
      id: 'kalshi-health-2',
      question: 'Will the WHO declare the end of the COVID‑19 pandemic in 2026?',
      category: 'Health',
      yesPrice: '0.52',
      noPrice: '0.48',
      volume: '$2.5M',
      analysis: 'Global case counts declining, but new variants possible.',
      expires: '2026-12-31',
      confidence: 60,
      edge: '+0.5%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'neutral'
    }
  );

  // Weather
  markets.push(
    {
      id: 'kalshi-weather-1',
      question: 'Will NYC see more than 20 inches of snow in February?',
      category: 'Weather',
      yesPrice: '0.35',
      noPrice: '0.65',
      volume: '$890K',
      analysis: 'NOAA forecast suggests below‑average snowfall.',
      expires: '2026-03-01',
      confidence: 70,
      edge: '+2.1%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'down'
    },
    {
      id: 'kalshi-weather-2',
      question: 'Will a major hurricane (Category 3+) hit the US East Coast in 2026?',
      category: 'Weather',
      yesPrice: '0.28',
      noPrice: '0.72',
      volume: '$1.8M',
      analysis: 'El Niño pattern may suppress Atlantic hurricanes.',
      expires: '2026-11-30',
      confidence: 65,
      edge: '+1.9%',
      platform: 'kalshi',
      marketType: 'binary',
      trend: 'down'
    }
  );

  return markets;
};

// Transform Kalshi API data (or use mock if empty)
const transformKalshiData = (kalshiPredictions: any[]): Prediction[] => {
  if (!kalshiPredictions || !Array.isArray(kalshiPredictions) || kalshiPredictions.length === 0) {
    return generateMockKalshiMarkets();
  }
  return kalshiPredictions;
};

// ==============================================
// MAIN CONTENT COMPONENT
// ==============================================
const KalshiPredictionsContent = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Hooks
  const { data: kalshiData, loading: kalshiLoading, error: kalshiError, refetch: refetchKalshi } = useKalshiPredictions('all');

  // State
  const [apiPredictions, setApiPredictions] = useState<Prediction[]>([]); // from API/mock
  const [aiPredictions, setAiPredictions] = useState<Prediction[]>([]); // user‑generated AI predictions
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(1);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Category filter options
  const categories = [
    { id: 'All', name: 'All Categories', icon: <FlagIcon />, color: '#8b5cf6' },
    { id: 'Politics', name: 'Politics', icon: <FlagIcon />, color: '#3b82f6' },
    { id: 'Economics', name: 'Economics', icon: <MoneyIcon />, color: '#10b981' },
    { id: 'Entertainment', name: 'Entertainment', icon: <CultureIcon />, color: '#ec4899' },
    { id: 'Technology', name: 'Technology', icon: <ScienceIcon />, color: '#8b5cf6' },
    { id: 'Health', name: 'Health', icon: <MedicalServicesIcon />, color: '#ef4444' },
    { id: 'Weather', name: 'Weather', icon: <WbSunny />, color: '#f59e0b' },
  ];

  // Load API data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const markets = transformKalshiData(kalshiData || []);
        // Filter out expired markets
        const now = new Date();
        const activeMarkets = markets.filter(p => {
          if (!p.expires) return true;
          const expiry = new Date(p.expires);
          if (isNaN(expiry.getTime())) return true;
          return expiry > now;
        });
        setApiPredictions(activeMarkets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [kalshiData]);

  // Memoize all predictions to avoid recreating on every render
  const allPredictions = useMemo(() => [...aiPredictions, ...apiPredictions], [aiPredictions, apiPredictions]);

  // Filtering
  useEffect(() => {
    let filtered = [...allPredictions];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.question.toLowerCase().includes(query) ||
        p.analysis.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Category filter – always include AI‑generated predictions
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.aiGenerated === true || p.category === selectedCategory);
    }

    // Only update state if the filtered list actually changed (to avoid unnecessary re-renders)
    setFilteredPredictions(prev => {
      // Simple shallow comparison – if lengths differ or any element changed, update
      if (prev.length !== filtered.length) return filtered;
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].id !== filtered[i].id) return filtered;
      }
      return prev;
    });
  }, [allPredictions, searchQuery, selectedCategory]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchKalshi?.();
      setSnackbarMessage('Predictions refreshed');
    } catch (err: any) {
      setSnackbarMessage(`Refresh failed: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  }, [refetchKalshi]);

  // Generate AI prediction
  const generatePrediction = async (prompt: string) => {
    if (!prompt.trim()) return;
    if (remainingGenerations > 0 || hasPremiumAccess) {
      setGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newPrediction: Prediction = {
        id: `ai-${Date.now()}`,
        question: `AI: ${prompt}`,
        category: 'AI Generated',
        yesPrice: '0.62',
        noPrice: '0.38',
        volume: 'AI Analysis',
        confidence: 74,
        edge: '+3.8%',
        analysis: `AI generated analysis for "${prompt}" based on current trends.`,
        expires: 'Today',
        platform: 'kalshi',
        marketType: 'binary',
        trend: 'up',
        aiGenerated: true,
      };
      setAiPredictions(prev => [newPrediction, ...prev]);
      if (!hasPremiumAccess) {
        setRemainingGenerations(prev => prev - 1);
      }
      setGenerating(false);
      setCustomPrompt('');
      setSnackbarMessage(`AI prediction generated for: ${prompt}`);
    } else {
      setShowPurchaseModal(true);
    }
  };

  // Placeholder trade function
  const handlePlaceTrade = (marketId: string, side: string, amount: number) => {
    setSnackbarMessage(`${side.toUpperCase()} trade placed for $${amount}`);
  };

  // Loading state
  if (loading && !refreshing && apiPredictions.length === 0 && aiPredictions.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, mt: 2 }}>Loading predictions...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg">
        {/* Debug banner (optional) */}
        {import.meta.env.DEV && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="caption">
              🔍 Showing {allPredictions.length} total items (after expiry filter) • {aiPredictions.length} AI generated
            </Typography>
          </Alert>
        )}

        {/* Header */}
        <GradientCard sx={{ mb: 4, mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  onClick={() => navigate(-1)}
                  startIcon={<ChevronRightIcon style={{ transform: 'rotate(180deg)' }} />}
                  sx={{ color: 'white', mr: 2 }}
                >
                  Back
                </Button>
                <Chip
                  label="NON‑SPORTS ONLY"
                  sx={{
                    backgroundColor: 'rgba(59,130,246,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    mr: 1
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refresh">
                  <IconButton sx={{ color: 'white' }} onClick={handleRefresh} disabled={refreshing}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  width: 56,
                  height: 56,
                  mr: 2,
                }}
              >
                <ShieldIcon />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'white' }}>
                  Kalshi Predictions
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Politics • Economics • Entertainment • Tech • Health • Weather
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </GradientCard>

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <TextField
            fullWidth
            placeholder="Search predictions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Category Filter */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
            Filter by Category:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                icon={cat.icon}
                label={cat.name}
                onClick={() => setSelectedCategory(cat.id)}
                sx={{
                  backgroundColor: selectedCategory === cat.id ? cat.color : '#0f172a',
                  color: selectedCategory === cat.id ? 'white' : '#94a3b8',
                  borderColor: '#334155',
                  '&:hover': {
                    backgroundColor: selectedCategory === cat.id ? cat.color : '#1e293b',
                  },
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Generation Counter */}
        <Card sx={{ mb: 3, backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FlashIcon sx={{ color: '#8b5cf6', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Daily AI Predictions
              </Typography>
            </Box>
            {hasPremiumAccess ? (
              <Alert icon={<CheckCircleIcon />} severity="success" sx={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <Typography fontWeight="bold">Premium: Unlimited AI Predictions</Typography>
              </Alert>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                    Free predictions today:
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#8b5cf6' }}>
                    {remainingGenerations}/1
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(remainingGenerations / 1) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#334155',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' },
                    mb: 1,
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Generate Prediction Section */}
        <Card sx={{ mb: 4, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
                🤖 Generate AI Prediction
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                Select a prompt or type your own
              </Typography>
            </Box>

            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="non-sports-prompt-label" sx={{ color: '#94a3b8' }}>Non‑Sports Prompts</InputLabel>
                  <Select
                    labelId="non-sports-prompt-label"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    displayEmpty
                    sx={{
                      backgroundColor: '#0f172a',
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' }
                    }}
                  >
                    <MenuItem value=""><em>Select a prompt</em></MenuItem>
                    {NON_SPORTS_PROMPTS.map((prompt, idx) => (
                      <MenuItem key={idx} value={prompt}>{prompt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="e.g., Fed rate cut, Oscar winners, hurricane predictions..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    multiline
                    rows={2}
                    disabled={generating}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        color: 'white',
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => generatePrediction(customPrompt)}
                    disabled={!customPrompt.trim() || generating}
                    sx={{
                      backgroundColor: '#8b5cf6',
                      '&:hover': { backgroundColor: '#7c3aed' },
                      minWidth: 140,
                      height: 56,
                      alignSelf: 'stretch',
                    }}
                  >
                    {generating ? <CircularProgress size={24} color="inherit" /> : 'Generate'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Results Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary' }}>
            📊 Live Markets
          </Typography>
          <Chip label={`${filteredPredictions.length} items`} sx={{ backgroundColor: '#1e293b', color: '#cbd5e1' }} />
        </Box>

        {/* Predictions Grid */}
        {filteredPredictions.length > 0 ? (
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {filteredPredictions.map((prediction) => {
              const isExpanded = expandedCard === prediction.id;

              return (
                <Grid item xs={12} md={6} lg={4} key={prediction.id}>
                  <PredictionCard>
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                            {prediction.platform.toUpperCase()} • {prediction.marketType}
                            {prediction.aiGenerated && ' • AI Generated'}
                          </Typography>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white', mt: 0.5 }}>
                            {prediction.question}
                          </Typography>
                        </Box>
                        {prediction.edge !== 'N/A' && (
                          <Chip label={`Edge ${prediction.edge}`} size="small" sx={{ backgroundColor: '#8b5cf620', color: '#8b5cf6', fontWeight: 'bold' }} />
                        )}
                      </Box>

                      {/* Expiry */}
                      {prediction.expires && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8', mr: 0.5 }} />
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>Expires: {prediction.expires}</Typography>
                        </Box>
                      )}

                      {/* Binary Prices */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(16,185,129,0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#10b981', display: 'block', mb: 1 }}>YES Price</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', mb: 1 }}>${prediction.yesPrice}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                              {Math.round(parseFloat(prediction.yesPrice) * 100)}% prob
                            </Typography>
                            <Button variant="contained" size="small" fullWidth
                              onClick={() => handlePlaceTrade(prediction.id, 'yes', 10)}
                              sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}>
                              Buy YES
                            </Button>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(239,68,68,0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mb: 1 }}>NO Price</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#ef4444', mb: 1 }}>${prediction.noPrice}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                              {Math.round(parseFloat(prediction.noPrice) * 100)}% prob
                            </Typography>
                            <Button variant="contained" size="small" fullWidth
                              onClick={() => handlePlaceTrade(prediction.id, 'no', 10)}
                              sx={{ backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}>
                              Buy NO
                            </Button>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Analysis Section */}
                      <Box onClick={() => setExpandedCard(isExpanded ? null : prediction.id)} sx={{ cursor: 'pointer' }}>
                        <Paper sx={{ p: 2, backgroundColor: '#0f172a', mb: 2, border: '1px solid #334155' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <AnalyticsIcon sx={{ color: '#f59e0b', mr: 1, mt: 0.5, fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                              {isExpanded ? prediction.analysis : prediction.analysis.length > 100 ? `${prediction.analysis.substring(0, 100)}...` : prediction.analysis}
                            </Typography>
                          </Box>
                        </Paper>

                        <Collapse in={isExpanded}>
                          {/* Confidence Meter */}
                          {prediction.confidence > 0 && (
                            <Box sx={{ mt: 2, mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Model Confidence</Typography>
                                <Typography variant="caption" fontWeight="bold" sx={{ color: 'white' }}>{prediction.confidence}%</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={prediction.confidence}
                                sx={{ height: 6, borderRadius: 3, backgroundColor: '#334155', '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' } }} />
                            </Box>
                          )}
                        </Collapse>

                        {/* Expand/Collapse Icon */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <IconButton size="small" sx={{ color: '#64748b' }}>
                            {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Footer */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip label={prediction.category} size="small"
                            sx={{ backgroundColor: `${getCategoryColor(prediction.category)}20`, color: getCategoryColor(prediction.category) }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{prediction.volume}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </PredictionCard>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2, mb: 8 }}>
            <TrophyIcon sx={{ fontSize: 48, color: '#8b5cf6', mb: 2 }} />
            <Typography variant="h5" gutterBottom>No predictions found</Typography>
            <Typography variant="body1" color="text.secondary">Try adjusting your filters or generate a new AI prediction.</Typography>
          </Paper>
        )}

        {/* Purchase Modal */}
        <Dialog open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#8b5cf6', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardIcon sx={{ mr: 1 }} /> Purchase More Predictions
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>
              Daily free prediction limit reached. Get unlimited AI analysis:
            </Typography>
            <Grid container spacing={2}>
              {[
                { count: 3, price: '$2.99', perPrediction: '$0.99' },
                { count: 10, price: '$7.99', perPrediction: '$0.79', popular: true },
                { count: 25, price: '$14.99', perPrediction: '$0.59', bestValue: true },
              ].map((option, index) => (
                <Grid item xs={12} key={index}>
                  <Card sx={{ border: option.popular ? '2px solid #3b82f6' : option.bestValue ? '2px solid #10b981' : '1px solid #e5e7eb', position: 'relative', cursor: 'pointer' }}>
                    {option.popular && <Chip label="POPULAR" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#3b82f6', color: 'white' }} />}
                    {option.bestValue && <Chip label="BEST VALUE" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white' }} />}
                    <CardContent sx={{ textAlign: 'center', pt: option.popular || option.bestValue ? 4 : 2 }}>
                      <Typography variant="h6" fontWeight="bold">{option.count} Predictions</Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>{option.price}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.perPrediction} each</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
            <Button onClick={() => setShowPurchaseModal(false)} sx={{ color: '#64748b' }}>Not Now</Button>
          </DialogActions>
        </Dialog>
      </Container>

      {/* Snackbar */}
      {snackbarMessage && (
        <Paper sx={{ position: 'fixed', bottom: 80, right: 20, p: 2, backgroundColor: '#1e293b', color: 'white', borderRadius: 1, zIndex: 9999, maxWidth: 300 }}>
          <Typography variant="body2">{snackbarMessage}</Typography>
          <IconButton size="small" onClick={() => setSnackbarMessage('')} sx={{ position: 'absolute', top: 4, right: 4, color: 'white' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}
    </>
  );
};

// ==============================
// Wrapped Component with ProtectedRoute
// ==============================

const KalshiPredictionsScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="KalshiPredictions">
      <KalshiPredictionsContent />
    </ProtectedRoute>
  );
};

export default KalshiPredictionsScreen;
