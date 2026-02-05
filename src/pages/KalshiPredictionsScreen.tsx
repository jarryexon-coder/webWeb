// src/pages/KalshiPredictionsScreen.tsx - UPDATED WITH HOOK INTEGRATION
import React, { useState, useEffect } from 'react';
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
  Divider,
  Avatar,
  Tooltip,
  Badge,
  Fade,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardActions,
  Stack,
  CircularProgress,
  Alert,
  AlertTitle,
  alpha,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  Security as ShieldIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  NewReleases as NewspaperIcon,
  SportsBasketball as SportsBasketballIcon,
  Flag as FlagIcon,
  AttachMoney as MoneyIcon,
  Theaters as CultureIcon,
  Science as ScienceIcon,
  MedicalServices as HealthIcon,
  Hardware as TechnologyIcon,
  Info as InfoIcon,
  Bookmark as BookmarkIcon,
  RocketLaunch as RocketIcon,
  FlashOn as FlashIcon,
  CardGiftcard as CardIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Balance as BalanceIcon,
  PieChart as PieChartIcon,
  CheckCircle as CheckCircleIcon,
  OpenInNew as OpenInNewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// ✅ IMPORT THE CUSTOM HOOK (File 2 integration)
import { useKalshiPredictions } from '../hooks/useSportsData';

// Prediction interface
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
  aiGenerated?: boolean;
}

// Styled Components (keep existing)
const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius * 2,
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  borderRadius: 8,
  marginRight: theme.spacing(1),
}));

const PredictionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

// ✅ MOCK DATA FOR FALLBACK (File 1 pattern)
const MOCK_KALSHI_PREDICTIONS: Prediction[] = [
  { 
    id: '1', 
    question: 'Will Trump win the 2024 presidential election?', 
    category: 'Politics', 
    yesPrice: '0.52', 
    noPrice: '0.48', 
    volume: 'High', 
    analysis: 'Current polls show close race with slight edge to Trump', 
    expires: 'Nov 5, 2024', 
    confidence: 65, 
    edge: '+2.5%',
    aiGenerated: false 
  },
  { 
    id: '2', 
    question: 'Will US recession occur in 2024?', 
    category: 'Economics', 
    yesPrice: '0.38', 
    noPrice: '0.62', 
    volume: 'High', 
    analysis: 'Economic indicators mixed, but strong labor market reduces probability', 
    expires: 'Dec 31, 2024', 
    confidence: 68, 
    edge: '+2.9%',
    aiGenerated: false 
  },
  { 
    id: '3', 
    question: 'Will Chiefs win Super Bowl 2025?', 
    category: 'Sports', 
    yesPrice: '0.28', 
    noPrice: '0.72', 
    volume: 'High', 
    analysis: 'Strong team but competitive field reduces probability', 
    expires: 'Feb 9, 2025', 
    confidence: 62, 
    edge: '+1.5%',
    aiGenerated: false 
  },
  { 
    id: '4', 
    question: 'Will Taylor Swift win Album of the Year Grammy 2025?', 
    category: 'Culture', 
    yesPrice: '0.55', 
    noPrice: '0.45', 
    volume: 'High', 
    analysis: 'Critical acclaim and commercial success create strong candidacy', 
    expires: 'Feb 2, 2025', 
    confidence: 70, 
    edge: '+3.6%',
    aiGenerated: false 
  },
];

// ✅ Helper function to transform API data (File 1 pattern)
const transformApiData = (apiMarkets: any[]): Prediction[] => {
  return apiMarkets.map((market: any, index: number) => ({
    id: market.id || market.marketId || `kalshi-${index + 1}`,
    question: market.title || market.question || market.name || `Market ${index + 1}`,
    category: market.category || market.type || 'General',
    yesPrice: market.yesPrice?.toString() || market.price?.toString() || '0.50',
    noPrice: market.noPrice?.toString() || (1 - (market.price || 0.5)).toFixed(2),
    volume: market.volume || market.tradingVolume || 'Medium',
    analysis: market.analysis || market.description || market.summary || 'No analysis available',
    expires: market.expires || market.expirationDate || market.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    confidence: market.confidence || market.probability || Math.floor(Math.random() * 30) + 60,
    edge: market.edge || market.expectedValue || `+${(Math.random() * 5).toFixed(1)}%`,
    aiGenerated: market.aiGenerated || false
  }));
};

// ✅ Kalshi Analytics Box Component (keep existing)
const KalshiAnalyticsBox = ({ marketData }: { marketData: any }) => {
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(true);

  const marketHighlights = [
    { icon: <TrendingUpIcon />, label: 'Weekly Volume', value: marketData.weeklyVolume, color: '#8b5cf6' },
    { icon: <PieChartIcon />, label: 'Market Share', value: marketData.marketShare, color: '#10b981' },
    { icon: <SportsBasketballIcon />, label: 'Sports Volume', value: marketData.sportsPercentage, color: '#ef4444' },
    { icon: <TrendingUpIcon />, label: 'Record Day', value: marketData.recordDay, color: '#f59e0b' },
  ];

  if (!showAnalyticsBox) {
    return (
      <Tooltip title="Show Market Stats">
        <Button
          variant="contained"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            borderRadius: 25,
            backgroundColor: '#8b5cf6',
            '&:hover': {
              backgroundColor: '#7c3aed',
            },
            zIndex: 1000,
          }}
          onClick={() => setShowAnalyticsBox(true)}
        >
          <AnalyticsIcon sx={{ mr: 1 }} />
          Market Stats
        </Button>
      </Tooltip>
    );
  }

  return (
    <Fade in={showAnalyticsBox}>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 400,
          maxWidth: '90vw',
          height: 280,
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 1000,
          boxShadow: 24,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ShieldIcon sx={{ color: '#8b5cf6', mr: 1 }} />
              <Typography variant="h6" fontWeight="600">
                Kalshi Market Intelligence
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowAnalyticsBox(false)} sx={{ color: '#64748b' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Chip
            icon={<BalanceIcon />}
            label="CFTC-Regulated • Legal in 50 States"
            size="small"
            sx={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              borderColor: '#3b82f640',
              mb: 3,
            }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            {marketHighlights.map((item, index) => (
              <Grid item xs={6} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      bgcolor: `${item.color}20`,
                      color: item.color,
                      width: 40,
                      height: 40,
                      mb: 1,
                      mx: 'auto',
                    }}
                  >
                    {item.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    {item.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {item.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Alert
            icon={<InfoIcon fontSize="small" />}
            severity="info"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              '& .MuiAlert-icon': { color: '#64748b' },
            }}
          >
            <Typography variant="caption">
              Kalshi holds 66.4% of prediction market share as a CFTC-designated contract market
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Fade>
  );
};

// ✅ Kalshi Contract Explainer Component (keep existing)
const KalshiContractExplainer = () => {
  const [expanded, setExpanded] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'Binary Contracts',
      description: 'Buy "Yes" or "No" contracts on event outcomes. Prices range from $0.01 to $0.99',
    },
    {
      number: 2,
      title: 'Market Pricing',
      description: 'Contract price reflects market-implied probability. $0.75 = 75% chance of "Yes"',
    },
    {
      number: 3,
      title: 'Payout & Risk',
      description: 'Win = $1.00 per contract. Maximum loss = purchase price',
    },
    {
      number: 4,
      title: 'Trade Anytime',
      description: 'Sell contracts before event settlement. No house edge - peer-to-peer trading',
    },
  ];

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        borderRadius: 2,
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#8b5cf6' }} />}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SchoolIcon sx={{ color: '#8b5cf6', mr: 1 }} />
          <Typography fontWeight="600" sx={{ color: '#f1f5f9' }}>
            How Kalshi Contracts Work
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <List>
          {steps.map((step) => (
            <ListItem key={step.number} sx={{ px: 0, py: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar
                  sx={{
                    bgcolor: '#8b5cf6',
                    color: 'white',
                    width: 24,
                    height: 24,
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  {step.number}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography fontWeight="600" sx={{ color: '#f1f5f9' }}>
                    {step.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                    {step.description}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
        <Alert
          icon={<WarningIcon />}
          severity="warning"
          sx={{
            mt: 2,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: '#f59e0b',
            '& .MuiAlert-icon': { color: '#f59e0b' },
          }}
        >
          <Typography variant="caption">
            Regulated by CFTC as financial contracts, not sports betting. NCAA has raised concerns about college sports markets
          </Typography>
        </Alert>
      </AccordionDetails>
    </Accordion>
  );
};

// ✅ Kalshi News Feed Component (keep existing)
const KalshiNewsFeed = ({ newsItems }: { newsItems: any[] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { id: 'All', name: 'All News', icon: <NewspaperIcon /> },
    { id: 'Sports', name: 'Sports', icon: <SportsBasketballIcon /> },
    { id: 'Politics', name: 'Politics', icon: <FlagIcon /> },
    { id: 'Economics', name: 'Economics', icon: <MoneyIcon /> },
    { id: 'Legal', name: 'Legal', icon: <BalanceIcon /> },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sports': return '#ef444420';
      case 'Politics': return '#3b82f620';
      case 'Economics': return '#10b98120';
      case 'Legal': return '#f59e0b20';
      default: return '#6b728020';
    }
  };

  const filteredNews = selectedCategory === 'All'
    ? newsItems
    : newsItems.filter(item => item.category === selectedCategory);

  return (
    <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: '#1e293b', border: '1px solid #334155', mb: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ color: '#f1f5f9', mb: 0.5 }}>
          📰 Kalshi Market News
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          Regulatory updates & market insights
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1 }}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            icon={category.icon}
            label={category.name}
            onClick={() => setSelectedCategory(category.id)}
            sx={{
              backgroundColor: selectedCategory === category.id ? '#8b5cf620' : '#0f172a',
              color: selectedCategory === category.id ? '#8b5cf6' : '#94a3b8',
              borderColor: selectedCategory === category.id ? '#8b5cf640' : '#334155',
              '&:hover': {
                backgroundColor: selectedCategory === category.id ? '#8b5cf630' : '#1e293b',
              },
            }}
          />
        ))}
      </Box>

      <Stack spacing={2}>
        {filteredNews.map((item) => (
          <Card key={item.id} sx={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Chip
                  label={item.category}
                  size="small"
                  sx={{
                    backgroundColor: getCategoryColor(item.category),
                    color: getCategoryColor(item.category).replace('20', ''),
                  }}
                />
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {item.timestamp}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: '#f1f5f9', mb: 1 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2 }}>
                {item.summary}
              </Typography>
              <Button
                endIcon={<OpenInNewIcon />}
                onClick={() => window.open(item.url, '_blank')}
                sx={{ color: '#8b5cf6' }}
              >
                Read source
              </Button>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Paper>
  );
};

// ✅ Main Kalshi Predictions Screen (File 1 + File 2 integration)
const KalshiPredictionsScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // ✅ STATE MANAGEMENT (File 1 pattern)
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('All');
  const [loading, setLoading] = useState(true); // ✅ File 1: Start with loading true
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null); // ✅ File 1: Add error state
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(1);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [purchasedGenerations, setPurchasedGenerations] = useState(0);
  const [marketData, setMarketData] = useState({
    weeklyVolume: '$2.0B',
    marketShare: '66.4%',
    sportsPercentage: '91.1%',
    recordDay: '$466M',
  });

  // ✅ USE THE CUSTOM HOOK (File 2 pattern)
  const { 
    data: apiPredictions, 
    loading: apiLoading, 
    error: apiError, 
    refetch 
  } = useKalshiPredictions();

  // ✅ TRANSFORM API DATA WHEN HOOK RETURNS IT (File 1 pattern)
  useEffect(() => {
    console.log('🔄 Kalshi API data changed:', { apiPredictions, apiLoading, apiError });
    
    if (apiLoading) {
      setLoading(true);
      return;
    }
    
    if (apiError) {
      console.error('❌ API Error from hook:', apiError);
      setError(apiError);
      // ✅ File 1: Fallback to mock data when error occurs
      console.log('🔄 Falling back to mock data');
      setPredictions(MOCK_KALSHI_PREDICTIONS);
      setFilteredPredictions(MOCK_KALSHI_PREDICTIONS);
      setLoading(false);
      
      // ✅ Store for debugging (File 1 pattern)
      window[`_kalshipredictionsscreenDebug`] = {
        rawApiResponse: null,
        error: apiError,
        usingMockData: true,
        timestamp: new Date().toISOString()
      };
      return;
    }
    
    if (apiPredictions && apiPredictions.length > 0) {
      console.log(`✅ Using REAL kalshi predictions: ${apiPredictions.length} predictions`);
      
      // ✅ Transform API data to match our component structure (File 1 pattern)
      const transformedPredictions = transformApiData(apiPredictions);
      
      setPredictions(transformedPredictions);
      setFilteredPredictions(transformedPredictions);
      setLoading(false);
      setError(null);
      
      // ✅ Store for debugging (File 1 pattern)
      window[`_kalshipredictionsscreenDebug`] = {
        rawApiResponse: apiPredictions,
        transformedData: transformedPredictions,
        timestamp: new Date().toISOString()
      };
    } else if (apiPredictions && apiPredictions.length === 0) {
      // ✅ API returns empty array - use mock data (File 1 pattern)
      console.log('⚠️ API returned empty array, using mock data');
      setPredictions(MOCK_KALSHI_PREDICTIONS);
      setFilteredPredictions(MOCK_KALSHI_PREDICTIONS);
      setLoading(false);
    } else {
      // No data yet, but loading is false
      setLoading(apiLoading);
    }
  }, [apiPredictions, apiLoading, apiError]);

  // ✅ Handle sport filter
  useEffect(() => {
    if (selectedMarket === 'All') {
      setFilteredPredictions(predictions);
    } else {
      const filtered = predictions.filter(prediction => prediction.category === selectedMarket);
      setFilteredPredictions(filtered);
    }
  }, [selectedMarket, predictions]);

  // ✅ Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPredictions(predictions);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = predictions.filter(prediction =>
      (prediction.question || '').toLowerCase().includes(lowerQuery) ||
      (prediction.category || '').toLowerCase().includes(lowerQuery) ||
      (prediction.analysis || '').toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPredictions(filtered);
  }, [searchQuery, predictions]);

  // ✅ Updated refresh function to use hook's refetch
  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const generateKalshiPrediction = async (prompt: string) => {
    if (!prompt.trim()) return;

    if (remainingGenerations > 0 || hasPremiumAccess) {
      setGenerating(true);
      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newPrediction: Prediction = {
        id: `kalshi-${Date.now()}`,
        question: `AI-Generated: ${prompt}`,
        category: 'AI Generated',
        yesPrice: '0.65',
        noPrice: '0.35',
        volume: 'AI Analysis',
        confidence: 78,
        edge: '+4.5%',
        analysis: `AI analysis of "${prompt}". Based on current market trends and probability models.`,
        expires: 'Tomorrow',
        aiGenerated: true,
      };

      setPredictions([newPrediction, ...predictions]);
      if (!hasPremiumAccess) {
        setRemainingGenerations(remainingGenerations - 1);
      }
      setGenerating(false);
      setCustomPrompt('');
    } else {
      setShowPurchaseModal(true);
    }
  };

  const handlePlaceTrade = async (marketId: string, side: string, amount: number) => {
    console.log(`Placing ${side} trade for $${amount} on market ${marketId}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sports': return '#ef4444';
      case 'Politics': return '#3b82f6';
      case 'Economics': return '#10b981';
      case 'Culture': return '#f59e0b';
      case 'AI Generated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // ✅ ADD LOADING STATE (File 1 pattern)
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading Kalshi predictions...</Typography>
        </Box>
      </Container>
    );
  }

  // ✅ ADD ERROR STATE (File 1 pattern)
  const displayError = error || apiError;
  if (displayError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Error Loading Kalshi Predictions</AlertTitle>
          <Typography variant="body2">{displayError}</Typography>
        </Alert>
        {/* Optionally render with mock data when error occurs */}
        <RenderKalshiContent 
          predictions={predictions}
          filteredPredictions={filteredPredictions}
          marketData={marketData}
          selectedMarket={selectedMarket}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleRefresh={handleRefresh}
          refreshing={refreshing}
          generating={generating}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          generateKalshiPrediction={generateKalshiPrediction}
          handlePlaceTrade={handlePlaceTrade}
          remainingGenerations={remainingGenerations}
          hasPremiumAccess={hasPremiumAccess}
          showPurchaseModal={showPurchaseModal}
          setShowPurchaseModal={setShowPurchaseModal}
          setSelectedMarket={setSelectedMarket}
        />
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Showing fallback data • Error occurred: {displayError}
          </Typography>
        </Box>
      </Container>
    );
  }

  const markets = [
    { id: 'All', name: 'All Markets', icon: <FlagIcon />, color: '#8b5cf6' },
    { id: 'Politics', name: 'Politics', icon: <FlagIcon />, color: '#3b82f6' },
    { id: 'Economics', name: 'Economics', icon: <MoneyIcon />, color: '#10b981' },
    { id: 'Sports', name: 'Sports', icon: <SportsBasketballIcon />, color: '#ef4444' },
    { id: 'Culture', name: 'Culture', icon: <CultureIcon />, color: '#f59e0b' },
    { id: 'Technology', name: 'Tech', icon: <TechnologyIcon />, color: '#8b5cf6' },
    { id: 'Science', name: 'Science', icon: <ScienceIcon />, color: '#14b8a6' },
    { id: 'Health', name: 'Health', icon: <HealthIcon />, color: '#ec4899' },
  ];

  const kalshiPrompts = [
    'Will there be a government shutdown in 2024?',
    'Will Fed cut rates more than 100bps in 2024?',
    'Will AGI be achieved before 2035?',
    'Will Chiefs win Super Bowl 2025?',
    'Will Barbie win Best Picture Oscar?',
  ];

  const kalshiNews = [
    {
      id: '1',
      title: 'Kalshi Hits $2B Weekly Volume, Commands 66% Market Share',
      summary: 'Kalshi has become the dominant prediction market platform with $2 billion in weekly volume and 66.4% market share, surpassing competitors through CFTC regulation and Robinhood integration.',
      category: 'Economics',
      timestamp: 'Today',
      url: 'https://example.com/kalshi-growth'
    },
  ];

  // ✅ KEEP YOUR ENTIRE EXISTING RETURN STATEMENT
  return (
    <RenderKalshiContent 
      predictions={predictions}
      filteredPredictions={filteredPredictions}
      marketData={marketData}
      selectedMarket={selectedMarket}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      handleRefresh={handleRefresh}
      refreshing={refreshing}
      generating={generating}
      customPrompt={customPrompt}
      setCustomPrompt={setCustomPrompt}
      generateKalshiPrediction={generateKalshiPrediction}
      handlePlaceTrade={handlePlaceTrade}
      remainingGenerations={remainingGenerations}
      hasPremiumAccess={hasPremiumAccess}
      showPurchaseModal={showPurchaseModal}
      setShowPurchaseModal={setShowPurchaseModal}
      setSelectedMarket={setSelectedMarket}
      markets={markets}
      kalshiPrompts={kalshiPrompts}
      kalshiNews={kalshiNews}
    />
  );
};

// ✅ Separate component for rendering content (keep existing)
const RenderKalshiContent = ({
  predictions,
  filteredPredictions,
  marketData,
  selectedMarket,
  searchQuery,
  setSearchQuery,
  handleRefresh,
  refreshing,
  generating,
  customPrompt,
  setCustomPrompt,
  generateKalshiPrediction,
  handlePlaceTrade,
  remainingGenerations,
  hasPremiumAccess,
  showPurchaseModal,
  setShowPurchaseModal,
  setSelectedMarket,
  markets = [
    { id: 'All', name: 'All Markets', icon: <FlagIcon />, color: '#8b5cf6' },
    { id: 'Politics', name: 'Politics', icon: <FlagIcon />, color: '#3b82f6' },
    { id: 'Economics', name: 'Economics', icon: <MoneyIcon />, color: '#10b981' },
    { id: 'Sports', name: 'Sports', icon: <SportsBasketballIcon />, color: '#ef4444' },
    { id: 'Culture', name: 'Culture', icon: <CultureIcon />, color: '#f59e0b' },
    { id: 'Technology', name: 'Tech', icon: <TechnologyIcon />, color: '#8b5cf6' },
    { id: 'Science', name: 'Science', icon: <ScienceIcon />, color: '#14b8a6' },
    { id: 'Health', name: 'Health', icon: <HealthIcon />, color: '#ec4899' },
  ],
  kalshiPrompts = [
    'Will there be a government shutdown in 2024?',
    'Will Fed cut rates more than 100bps in 2024?',
    'Will AGI be achieved before 2035?',
    'Will Chiefs win Super Bowl 2025?',
    'Will Barbie win Best Picture Oscar?',
  ],
  kalshiNews = [
    {
      id: '1',
      title: 'Kalshi Hits $2B Weekly Volume, Commands 66% Market Share',
      summary: 'Kalshi has become the dominant prediction market platform with $2 billion in weekly volume and 66.4% market share, surpassing competitors through CFTC regulation and Robinhood integration.',
      category: 'Economics',
      timestamp: 'Today',
      url: 'https://example.com/kalshi-growth'
    },
  ]
}: any) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Sports': return '#ef4444';
      case 'Politics': return '#3b82f6';
      case 'Economics': return '#10b981';
      case 'Culture': return '#f59e0b';
      case 'AI Generated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <Container maxWidth="lg">
      {/* Debug Info Banner (only in development) */}
      {import.meta.env.DEV && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="caption">
            🔍 Debug: Showing {predictions.length} predictions ({predictions === MOCK_KALSHI_PREDICTIONS ? 'MOCK DATA' : 'REAL API DATA via hook'})
          </Typography>
          <Button 
            size="small" 
            onClick={() => console.log('Current predictions:', predictions)}
            sx={{ ml: 1 }}
          >
            Log Data
          </Button>
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
                label="Live API"
                sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white' }}>
                <SearchIcon />
              </IconButton>
              <Tooltip title="Refresh Predictions">
                <IconButton 
                  sx={{ color: 'white' }} 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
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
                CFTC-regulated prediction markets • 50-state legal
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </GradientCard>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Search Kalshi markets, politics, economics, sports..."
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
            <Alert
              icon={<CheckCircleIcon />}
              severity="success"
              sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
            >
              <Typography fontWeight="bold">Premium: Unlimited Kalshi Predictions</Typography>
            </Alert>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                  Free prediction today:
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
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#8b5cf6',
                  },
                  mb: 1,
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', textAlign: 'center' }}>
                Resets daily at midnight. Purchase additional predictions below.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* News Feed */}
      <KalshiNewsFeed newsItems={kalshiNews} />

      {/* Contract Explainer */}
      <KalshiContractExplainer />

      {/* Market Selector */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          {markets.map((market: any) => (
            <Chip
              key={market.id}
              icon={market.icon}
              label={market.name}
              onClick={() => setSelectedMarket(market.id)}
              sx={{
                backgroundColor: selectedMarket === market.id ? market.color : '#0f172a',
                color: selectedMarket === market.id ? 'white' : '#94a3b8',
                borderColor: '#334155',
                '&:hover': {
                  backgroundColor: selectedMarket === market.id ? market.color : '#1e293b',
                },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Generate Prediction Section */}
      <Card sx={{ mb: 4, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
              🤖 Generate Kalshi Prediction
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
              AI analyzes CFTC-regulated markets for opportunities
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3, overflowX: 'auto', pb: 1 }}>
            {kalshiPrompts.map((prompt: string, index: number) => (
              <Chip
                key={index}
                icon={<SparklesIcon />}
                label={prompt}
                onClick={() => generateKalshiPrediction(prompt)}
                disabled={generating}
                sx={{
                  backgroundColor: '#8b5cf620',
                  color: '#8b5cf6',
                  borderColor: '#8b5cf640',
                  '&:hover': {
                    backgroundColor: '#8b5cf630',
                  },
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Custom prompt for Kalshi market analysis..."
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
                  '&:hover': {
                    borderColor: '#8b5cf6',
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={() => generateKalshiPrediction(customPrompt)}
              disabled={!customPrompt.trim() || generating}
              sx={{
                backgroundColor: '#8b5cf6',
                '&:hover': { backgroundColor: '#7c3aed' },
                minWidth: 140,
                height: 56,
              }}
            >
              {generating ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <RocketIcon sx={{ mr: 1 }} />
                  Generate
                </>
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Live Kalshi Predictions */}
      <Box sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>
            📊 Live Kalshi Markets
          </Typography>
          <Chip
            label={`${filteredPredictions.length} contracts • ${remainingGenerations} free today`}
            sx={{ backgroundColor: '#1e293b', color: '#cbd5e1', borderColor: '#334155' }}
          />
        </Box>

        {filteredPredictions.length > 0 ? (
          <Grid container spacing={3}>
            {filteredPredictions.map((prediction: Prediction) => {
              const yesProbability = Math.round(parseFloat(prediction.yesPrice) * 100);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={prediction.id}>
                  <PredictionCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <StyledChip
                            label={prediction.category}
                            size="small"
                            sx={{
                              backgroundColor: `${getCategoryColor(prediction.category)}20`,
                              color: getCategoryColor(prediction.category),
                            }}
                          />
                          {prediction.aiGenerated && (
                            <StyledChip
                              icon={<SparklesIcon />}
                              label="AI Generated"
                              size="small"
                              sx={{
                                backgroundColor: '#8b5cf620',
                                color: '#8b5cf6',
                              }}
                            />
                          )}
                        </Box>
                        <Chip
                          icon={<TrendingUpIcon />}
                          label={prediction.volume}
                          size="small"
                          sx={{
                            backgroundColor: '#10b98120',
                            color: '#10b981',
                          }}
                        />
                      </Box>

                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, minHeight: 64 }}>
                        {prediction.question}
                      </Typography>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#10b981', display: 'block', mb: 1 }}>
                              YES Price
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', mb: 1 }}>
                              ${prediction.yesPrice}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                              {yesProbability}% probability
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => handlePlaceTrade(prediction.id, 'yes', 10)}
                              sx={{
                                backgroundColor: '#10b981',
                                '&:hover': { backgroundColor: '#059669' },
                              }}
                            >
                              Buy YES
                            </Button>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                            <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mb: 1 }}>
                              NO Price
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#ef4444', mb: 1 }}>
                              ${prediction.noPrice}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                              {100 - yesProbability}% probability
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              fullWidth
                              onClick={() => handlePlaceTrade(prediction.id, 'no', 10)}
                              sx={{
                                backgroundColor: '#ef4444',
                                '&:hover': { backgroundColor: '#dc2626' },
                              }}
                            >
                              Buy NO
                            </Button>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Paper sx={{ p: 2, backgroundColor: '#f8fafc', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <AnalyticsIcon sx={{ color: '#f59e0b', mr: 1, mt: 0.5 }} />
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            {prediction.analysis}
                          </Typography>
                        </Box>
                      </Paper>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Expires: {prediction.expires}
                          </Typography>
                          <Chip
                            label={prediction.edge}
                            size="small"
                            sx={{
                              backgroundColor: '#f59e0b20',
                              color: '#f59e0b',
                            }}
                          />
                        </Box>
                        <Button
                          startIcon={<BookmarkIcon />}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#8b5cf6',
                            color: '#8b5cf6',
                            '&:hover': {
                              borderColor: '#7c3aed',
                              backgroundColor: '#8b5cf610',
                            },
                          }}
                        >
                          Track
                        </Button>
                      </Box>
                    </CardContent>
                  </PredictionCard>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 48, color: '#8b5cf6', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No Kalshi predictions found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try a different market category or generate your first prediction!
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Purchase Modal */}
      <Dialog
        open={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#8b5cf6', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardIcon sx={{ mr: 1 }} />
            Purchase Kalshi Predictions
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>
            Daily free prediction limit reached. Purchase additional Kalshi market analyses:
          </Typography>

          <Grid container spacing={2}>
            {[
              { count: 3, price: '$2.99', perPrediction: '$0.99' },
              { count: 10, price: '$7.99', perPrediction: '$0.79', popular: true },
              { count: 25, price: '$14.99', perPrediction: '$0.59', bestValue: true },
            ].map((option, index) => (
              <Grid item xs={12} key={index}>
                <Card
                  sx={{
                    border: option.popular ? '2px solid #3b82f6' : option.bestValue ? '2px solid #10b981' : '1px solid #e5e7eb',
                    position: 'relative',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 3,
                    },
                  }}
                >
                  {option.popular && (
                    <Chip
                      label="POPULAR"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  {option.bestValue && (
                    <Chip
                      label="BEST VALUE"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  )}
                  <CardContent sx={{ textAlign: 'center', pt: option.popular || option.bestValue ? 4 : 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {option.count} Predictions
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>
                      {option.price}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.perPrediction} each
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setShowPurchaseModal(false)} sx={{ color: '#64748b' }}>
            Not Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Box */}
      <KalshiAnalyticsBox marketData={marketData} />
    </Container>
  );
};

export default KalshiPredictionsScreen;
