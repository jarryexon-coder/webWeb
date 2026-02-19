// src/pages/KalshiPredictionsScreen.tsx - COMPLETE INTEGRATION
// Integrated with multi-sport parlays, February 2026 Olympics/World Cup features, and 9+ platforms

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
  SportsFootball as SportsFootballIcon,
  SportsHockey as SportsHockeyIcon,
  SportsBaseball as SportsBaseballIcon,
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
  AutoAwesome as SparklesIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon,
  FitnessCenter as FitnessIcon,
  Person as PersonIcon,
  SwapHoriz as SwapHorizIcon,
  Apps as AppsIcon,
  Snowboarding as SnowboardingIcon,
  Timeline as TimelineIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// ✅ IMPORT HOOKS
import { useKalshiPredictions } from '../hooks/useKalshiPredictions';
import { useParlaySuggestions, useOddsGames } from '../hooks/useUnifiedAPI';

// ==============================================
// TYPES & INTERFACES (INTEGRATED FROM FILE 1)
// ==============================================

interface ParlayLeg {
  market: string;
  odds: number;
  probability: number;
  sport?: string;
  event?: string;
}

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
  sport?: string;
  game?: string;
  game_time?: string;
  parlay_type?: string;
  legs?: ParlayLeg[];
  combined_odds?: string;
  implied_probability?: number;
  model_probability?: number;
  tournament?: string;
  host_nations?: string[];
  trend?: string;
  aiGenerated?: boolean;
}

type ParlayType = 'all' | 'same_game' | 'multi_sport' | 'spread' | 'over_under' | 'player_props' | 'tournament';
type SportFilter = 'all' | 'nba' | 'nfl' | 'nhl' | 'mlb' | 'worldcup' | 'olympics';
type Platform = 'kalshi' | 'prizepicks' | 'draftkings' | 'fanduel' | 'betmgm' | 'underdog' | 'pointsbet' | 'caesars' | 'bet365';

// ==============================================
// STYLED COMPONENTS
// ==============================================

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

// ==============================================
// PLATFORM COLOR UTILITIES (INTEGRATED FROM FILE 1)
// ==============================================

const getPlatformColor = (platform: string): string => {
  const colors: Record<Platform, string> = {
    kalshi: '#6366F1',
    prizepicks: '#FF4B4B',
    draftkings: '#00B25D',
    fanduel: '#0E461E',
    betmgm: '#FFC500',
    underdog: '#00A3FF',
    pointsbet: '#E31B23',
    caesars: '#A67C4F',
    bet365: '#1E7A44'
  };
  return colors[platform.toLowerCase() as Platform] || '#6366F1';
};

const getParlayTypeIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    same_game: <SportsBasketballIcon />,
    multi_sport: <FitnessIcon />,
    spread: <TrendingUpIcon />,
    over_under: <SwapHorizIcon />,
    player_props: <PersonIcon />,
    tournament: <TrophyIcon />,
    binary: <AnalyticsIcon />
  };
  return icons[type] || <HelpIcon />;
};

const getSportIcon = (sport: string) => {
  const icons: Record<string, React.ReactNode> = {
    nba: <SportsBasketballIcon />,
    nfl: <SportsFootballIcon />,
    nhl: <SportsHockeyIcon />,
    mlb: <SportsBaseballIcon />,
    worldcup: <FlagIcon />,
    olympics: <SnowboardingIcon />
  };
  return icons[sport.toLowerCase()] || <SportsBasketballIcon />;
};

const formatOdds = (odds: string | number): string => {
  if (typeof odds === 'string') return odds;
  return odds > 0 ? `+${odds}` : `${odds}`;
};

// ==============================================
// MOCK DATA FOR FEBRUARY 2026 (INTEGRATED FROM FILE 1 - ENHANCED)
// ==============================================

const MOCK_PREDICTIONS_2026: Prediction[] = [
  {
    id: '1',
    question: 'USA vs Canada - USA to win & Ovechkin over 0.5 goals',
    category: 'Olympics',
    yesPrice: '0.58',
    noPrice: '0.42',
    volume: '$2.4M',
    analysis: 'USA -120 favorites with Ovechkin goal prop at +150. Strong +EV parlay opportunity. Team USA has won 4 of last 5 Olympic hockey meetings.',
    expires: '2026-02-20',
    confidence: 74,
    edge: '+4.8%',
    platform: 'draftkings',
    marketType: 'parlay',
    sport: 'olympics',
    game: 'USA vs Canada - Hockey Gold Medal',
    game_time: 'Today, 8:00 PM ET',
    parlay_type: 'same_game',
    legs: [
      { market: 'USA to Win', odds: -120, probability: 0.545, sport: 'olympics' },
      { market: 'Ovechkin Over 0.5 Goals', odds: 150, probability: 0.4, sport: 'olympics' }
    ],
    combined_odds: '+275',
    implied_probability: 0.267,
    model_probability: 0.315,
    tournament: 'Winter Olympics 2026',
    host_nations: ['Italy']
  },
  {
    id: '2',
    question: 'France to win World Cup + Mbappe anytime scorer',
    category: 'World Cup',
    yesPrice: '0.45',
    noPrice: '0.55',
    volume: '$3.1M',
    analysis: 'France +400 to win tournament, Mbappe -150 to score. Strong correlation play. France has reached 2 of last 3 World Cup finals.',
    expires: '2026-07-15',
    confidence: 68,
    edge: '+3.2%',
    platform: 'fanduel',
    marketType: 'parlay',
    sport: 'worldcup',
    game: 'FIFA World Cup 2026',
    parlay_type: 'tournament',
    legs: [
      { market: 'France to Win World Cup', odds: 400, probability: 0.2, sport: 'worldcup' },
      { market: 'Mbappe Anytime Scorer', odds: -150, probability: 0.6, sport: 'worldcup' }
    ],
    combined_odds: '+850',
    implied_probability: 0.105,
    model_probability: 0.123,
    tournament: 'FIFA World Cup 2026',
    host_nations: ['USA', 'Canada', 'Mexico']
  },
  {
    id: '3',
    question: 'Luka Doncic 30+ pts + Anthony Davis 12+ reb + Kyrie 25+ pts',
    category: 'NBA',
    yesPrice: '0.32',
    noPrice: '0.68',
    volume: '$890K',
    analysis: 'Three-leg player prop parlay with strong individual probabilities. Luka averaging 33.4 PPG at home. Davis has 12+ rebounds in 7 of last 10.',
    expires: '2026-02-11',
    confidence: 62,
    edge: '+2.7%',
    platform: 'prizepicks',
    marketType: 'parlay',
    sport: 'nba',
    game: 'Mavericks vs Lakers',
    game_time: 'Tonight, 10:30 PM ET',
    parlay_type: 'player_props',
    legs: [
      { market: 'Luka Doncic Over 29.5 Points', odds: -115, probability: 0.535, sport: 'nba' },
      { market: 'Anthony Davis Over 11.5 Rebounds', odds: -105, probability: 0.512, sport: 'nba' },
      { market: 'Kyrie Irving Over 24.5 Points', odds: -110, probability: 0.524, sport: 'nba' }
    ],
    combined_odds: '+550',
    implied_probability: 0.154,
    model_probability: 0.181,
    tournament: 'NBA Regular Season'
  },
  {
    id: '4',
    question: 'NFL Conference Championships: Chiefs + Bills + Lions to win',
    category: 'NFL',
    yesPrice: '0.28',
    noPrice: '0.72',
    volume: '$4.2M',
    analysis: 'Multi-sport parlay combining NFL conference championship favorites. Chiefs seeking third straight Super Bowl appearance.',
    expires: '2026-01-25',
    confidence: 58,
    edge: '+1.9%',
    platform: 'betmgm',
    marketType: 'parlay',
    sport: 'nfl',
    parlay_type: 'multi_sport',
    legs: [
      { market: 'Chiefs to Win AFC Championship', odds: 180, probability: 0.357, sport: 'nfl' },
      { market: 'Bills to Win AFC Championship', odds: 220, probability: 0.313, sport: 'nfl' },
      { market: 'Lions to Win NFC Championship', odds: 250, probability: 0.286, sport: 'nfl' }
    ],
    combined_odds: '+2200',
    implied_probability: 0.043,
    model_probability: 0.052
  },
  {
    id: '5',
    question: 'Will Italy win most gold medals at 2026 Olympics?',
    category: 'Olympics',
    yesPrice: '0.71',
    noPrice: '0.29',
    volume: '$1.8M',
    analysis: 'Host nation advantage. Italy projected for 14-18 golds, Norway 12-16, USA 11-15. Home ice advantage in multiple disciplines.',
    expires: '2026-02-28',
    confidence: 71,
    edge: '+2.8%',
    platform: 'kalshi',
    marketType: 'binary',
    sport: 'olympics',
    parlay_type: 'tournament',
    tournament: 'Winter Olympics 2026',
    host_nations: ['Italy']
  },
  {
    id: '6',
    question: 'Canada vs USA Gold Medal Rematch + Over 5.5 Goals',
    category: 'Olympics',
    yesPrice: '0.48',
    noPrice: '0.52',
    volume: '$3.2M',
    analysis: 'Same-game parlay on Olympic hockey final. Both teams averaging 4.2 goals per game in tournament.',
    expires: '2026-02-20',
    confidence: 65,
    edge: '+3.5%',
    platform: 'pointsbet',
    marketType: 'parlay',
    sport: 'olympics',
    game: 'Olympic Hockey Gold Medal Game',
    game_time: 'Feb 20, 8:00 PM ET',
    parlay_type: 'same_game',
    legs: [
      { market: 'Canada vs USA - Gold Medal Match', odds: 150, probability: 0.4, sport: 'olympics' },
      { market: 'Over 5.5 Total Goals', odds: 125, probability: 0.444, sport: 'olympics' }
    ],
    combined_odds: '+450',
    implied_probability: 0.182,
    model_probability: 0.212,
    tournament: 'Winter Olympics 2026',
    host_nations: ['Italy']
  },
  {
    id: '7',
    question: 'Shohei Ohtani 2+ Hits + Dodgers Win Opening Day',
    category: 'MLB',
    yesPrice: '0.52',
    noPrice: '0.48',
    volume: '$1.1M',
    analysis: 'Opening Day 2026 parlay. Ohtani hit safely in 8 of last 10 openers.',
    expires: '2026-03-26',
    confidence: 59,
    edge: '+2.1%',
    platform: 'bet365',
    marketType: 'parlay',
    sport: 'mlb',
    game: 'Dodgers vs Padres',
    game_time: 'Mar 26, 4:10 PM ET',
    parlay_type: 'same_game',
    legs: [
      { market: 'Dodgers to Win', odds: -130, probability: 0.565, sport: 'mlb' },
      { market: 'Shohei Ohtani Over 1.5 Hits', odds: 140, probability: 0.417, sport: 'mlb' }
    ],
    combined_odds: '+320',
    implied_probability: 0.238,
    model_probability: 0.259,
    tournament: 'MLB Opening Day 2026'
  }
];

// ==============================================
// TRANSFORM FUNCTIONS (INTEGRATED WITH 2026 DATA)
// ==============================================

const transformKalshiData = (kalshiPredictions: any[]): Prediction[] => {
  if (!kalshiPredictions || !Array.isArray(kalshiPredictions) || kalshiPredictions.length === 0) {
    console.log('No valid Kalshi predictions array to transform, using 2026 mock data');
    return MOCK_PREDICTIONS_2026;
  }

  console.log(`🔄 Transforming ${kalshiPredictions.length} Kalshi predictions`);
  
  const transformed = kalshiPredictions.map((pred: any, index: number) => {
    const question = pred.market || `Kalshi Market ${index + 1}`;
    const yesPriceNum = typeof pred.yesPrice === 'number' ? pred.yesPrice : 50;
    const noPriceNum = typeof pred.noPrice === 'number' ? pred.noPrice : 50;
    
    const yesPrice = (yesPriceNum / 100).toFixed(2);
    const noPrice = (noPriceNum / 100).toFixed(2);
    
    let confidence = pred.confidence || Math.min(95, Math.max(50, yesPriceNum + 10)) || 65;
    const category = pred.category || 'General';
    const volume = pred.volume || 'Medium';
    const trend = pred.trend || 'neutral';
    
    const analysis = pred.analysis || 
      `${category} market showing ${trend} trend. Current market pricing suggests a ${yesPriceNum}% probability for "Yes".`;
    
    const expires = pred.closeDate || pred.expires || 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    let edge = pred.edge || '+2.5%';
    if (trend === 'up' && confidence > 70) edge = '+4.2%';
    if (trend === 'down' && confidence < 60) edge = '+1.8%';
    
    return {
      id: pred.id || `kalshi-${index + 1}-${Date.now()}`,
      question: question,
      category: category,
      yesPrice: yesPrice,
      noPrice: noPrice,
      volume: volume.toString(),
      analysis: analysis,
      expires: expires,
      confidence: Math.min(95, Math.max(50, confidence)),
      edge: edge,
      platform: 'kalshi',
      marketType: 'binary',
      trend: trend,
      aiGenerated: false
    };
  });

  console.log(`✅ Successfully transformed ${transformed.length} Kalshi predictions`);
  return transformed.length > 0 ? transformed : MOCK_PREDICTIONS_2026;
};

// ==============================================
// PARLAY LEGS COMPONENT (INTEGRATED FROM FILE 1 - ENHANCED)
// ==============================================

const ParlayLegsComponent = ({ legs }: { legs: ParlayLeg[] }) => (
  <Box sx={{ mt: 2, mb: 2 }}>
    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', display: 'block', mb: 1 }}>
      PARLAY LEGS
    </Typography>
    <Paper sx={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 2, p: 1.5 }}>
      {legs.map((leg, index) => (
        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 500 }}>
              {leg.market || leg.event}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {leg.sport && `${leg.sport.toUpperCase()} • `}Probability: {(leg.probability * 100).toFixed(0)}%
            </Typography>
          </Box>
          <Chip
            label={formatOdds(leg.odds)}
            size="small"
            sx={{
              backgroundColor: '#8b5cf620',
              color: '#8b5cf6',
              fontWeight: 'bold'
            }}
          />
        </Box>
      ))}
    </Paper>
  </Box>
);

// ==============================================
// FEATURED BANNER FOR FEBRUARY 2026 (INTEGRATED FROM FILE 1 - ENHANCED)
// ==============================================

const FeaturedBanner2026 = () => (
  <Paper
    sx={{
      mb: 4,
      borderRadius: 2,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    }}
  >
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Chip
          label="FEATURED • FEB 2026"
          size="small"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 'bold',
            mb: 1,
            fontSize: '0.7rem'
          }}
        />
        <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
          Winter Olympics Live Now
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1.5 }}>
          Milan-Cortina 2026 • USA chasing 25+ golds • 97d until World Cup
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label="🇺🇸 USA Gold Medal Futures"
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          <Chip
            label="🏒 Canada vs USA - Gold Medal Match"
            size="small"
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
      </Box>
      <Avatar
        sx={{
          bgcolor: 'rgba(255,255,255,0.2)',
          color: 'white',
          width: 60,
          height: 60
        }}
      >
        <TrophyIcon sx={{ fontSize: 32 }} />
      </Avatar>
    </Box>
  </Paper>
);

// ==============================================
// COMPONENTS (KalshiAnalyticsBox, KalshiContractExplainer, KalshiNewsFeed)
// ==============================================

const KalshiAnalyticsBox = ({ marketData }: { marketData: any }) => {
  const [showAnalyticsBox, setShowAnalyticsBox] = useState(true);

  const marketHighlights = [
    { icon: <TrendingUpIcon />, label: 'Weekly Volume', value: marketData.weeklyVolume, color: '#8b5cf6' },
    { icon: <PieChartIcon />, label: 'Market Share', value: marketData.marketShare, color: '#10b981' },
    { icon: <SportsBasketballIcon />, label: 'Sports Volume', value: marketData.sportsPercentage, color: '#ef4444' },
    { icon: <TrophyIcon />, label: 'Olympics Volume', value: marketData.olympicsVolume || '$412M', color: '#f59e0b' },
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
            '&:hover': { backgroundColor: '#7c3aed' },
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
            label="CFTC-Regulated • Feb 2026 Olympic Markets"
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
              Winter Olympics Milan-Cortina 2026 • USA chasing 25+ golds • 97d until World Cup • Multi-sport parlays now live
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Fade>
  );
};

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
        mb: 3
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
            Regulated by CFTC as financial contracts, not sports betting. Olympic and World Cup markets available now for February 2026.
          </Typography>
        </Alert>
      </AccordionDetails>
    </Accordion>
  );
};

const KalshiNewsFeed = ({ newsItems }: { newsItems: any[] }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { id: 'All', name: 'All News', icon: <NewspaperIcon /> },
    { id: 'Sports', name: 'Sports', icon: <SportsBasketballIcon /> },
    { id: 'Olympics', name: 'Olympics', icon: <TrophyIcon /> },
    { id: 'WorldCup', name: 'World Cup', icon: <FlagIcon /> },
    { id: 'Economics', name: 'Economics', icon: <MoneyIcon /> },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Olympics': return '#3b82f620';
      case 'WorldCup': return '#10b98120';
      case 'Sports': return '#ef444420';
      case 'Economics': return '#8b5cf620';
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
          📰 Kalshi Market News • Feb 2026
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
          Winter Olympics, World Cup 2026, and multi-sport parlay markets
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

// ==============================================
// MAIN SCREEN COMPONENT (FULLY INTEGRATED WITH ALL FILE 1 ENHANCEMENTS)
// ==============================================

const KalshiPredictionsScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // ✅ USE KALSHI-SPECIFIC HOOK
  const { 
    data: kalshiData, 
    loading: kalshiLoading, 
    error: kalshiError, 
    refetch: refetchKalshi 
  } = useKalshiPredictions();
  
  // ✅ STATE MANAGEMENT (ENHANCED WITH FILE 1 FEATURES)
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [filteredPredictions, setFilteredPredictions] = useState<Prediction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('All');
  const [selectedParlayType, setSelectedParlayType] = useState<ParlayType>('all');
  const [selectedSport, setSelectedSport] = useState<SportFilter>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(1);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  const [marketData, setMarketData] = useState({
    weeklyVolume: '$2.8B',
    marketShare: '66.4%',
    sportsPercentage: '91.1%',
    olympicsVolume: '$412M',
    recordDay: '$466M',
  });

  // ✅ FILTER CONFIGURATIONS (INTEGRATED FROM FILE 1)
  const sportFilters = [
    { id: 'all', label: 'All Sports', icon: <FlagIcon /> },
    { id: 'nba', label: 'NBA', icon: <SportsBasketballIcon /> },
    { id: 'nfl', label: 'NFL', icon: <SportsFootballIcon /> },
    { id: 'nhl', label: 'NHL', icon: <SportsHockeyIcon /> },
    { id: 'mlb', label: 'MLB', icon: <SportsBaseballIcon /> },
    { id: 'worldcup', label: 'World Cup \'26', icon: <FlagIcon /> },
    { id: 'olympics', label: 'Olympics', icon: <TrophyIcon /> }
  ];

  const parlayTypeFilters = [
    { id: 'all', label: 'All', icon: <AppsIcon /> },
    { id: 'same_game', label: 'Same Game', icon: <SportsBasketballIcon /> },
    { id: 'multi_sport', label: 'Multi-Sport', icon: <FitnessIcon /> },
    { id: 'spread', label: 'Spreads', icon: <TrendingUpIcon /> },
    { id: 'over_under', label: 'Totals', icon: <SwapHorizIcon /> },
    { id: 'player_props', label: 'Player Props', icon: <PersonIcon /> },
    { id: 'tournament', label: 'Tournament', icon: <TrophyIcon /> }
  ];

  const markets = [
    { id: 'All', name: 'All Markets', icon: <FlagIcon />, color: '#8b5cf6' },
    { id: 'NBA', name: 'NBA', icon: <SportsBasketballIcon />, color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: <SportsFootballIcon />, color: '#3b82f6' },
    { id: 'NHL', name: 'NHL', icon: <SportsHockeyIcon />, color: '#10b981' },
    { id: 'MLB', name: 'MLB', icon: <SportsBaseballIcon />, color: '#f59e0b' },
    { id: 'Olympics', name: 'Olympics', icon: <TrophyIcon />, color: '#8b5cf6' },
    { id: 'World Cup', name: 'World Cup', icon: <FlagIcon />, color: '#14b8a6' },
    { id: 'Politics', name: 'Politics', icon: <FlagIcon />, color: '#3b82f6' },
    { id: 'Economics', name: 'Economics', icon: <MoneyIcon />, color: '#10b981' },
  ];

  const kalshiNews2026 = [
    {
      id: '1',
      title: 'Winter Olympics 2026: USA Gold Medal Futures Surge',
      summary: 'Team USA projected for 22-26 gold medals in Milan-Cortina. Shaun White comeback speculation driving interest in snowboarding markets.',
      category: 'Olympics',
      timestamp: 'Today',
      url: '#'
    },
    {
      id: '2',
      title: 'World Cup 2026 Host Cities: 97 Days to Kickoff',
      summary: 'Kalshi launches group stage winner markets for 2026 FIFA World Cup across USA, Canada, and Mexico host venues.',
      category: 'WorldCup',
      timestamp: '2 days ago',
      url: '#'
    },
    {
      id: '3',
      title: 'Multi-Sport Parlays: NBA + NHL + MLB Combined Odds',
      summary: 'Kalshi expands to support cross-sport parlay trading with improved +EV calculation tools for February 2026.',
      category: 'Sports',
      timestamp: '1 week ago',
      url: '#'
    },
    {
      id: '4',
      title: 'Italy Olympic Committee Approves Kalshi Partnership',
      summary: 'Official event contract market designation for 2026 Winter Games, first CFTC-regulated Olympic partnership.',
      category: 'Olympics',
      timestamp: '2 weeks ago',
      url: '#'
    },
  ];

  const kalshiPrompts2026 = [
    'Will USA win most gold medals at 2026 Olympics?',
    'Will Canada vs USA hockey final happen?',
    'Will Mbappe be World Cup 2026 top scorer?',
    'Will Italy advance from World Cup group stage?',
    'Will Ovechkin score in gold medal game?',
  ];

  // ✅ FILTER FUNCTION (INTEGRATED FROM FILE 1 - ENHANCED)
  const filterPredictions = (preds: Prediction[], parlayType: ParlayType, sport: SportFilter, category: string) => {
    let filtered = [...preds];
    
    // Filter by category/market
    if (category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }
    
    // Filter by parlay type
    if (parlayType !== 'all') {
      filtered = filtered.filter(p => 
        p.parlay_type === parlayType || 
        (p.marketType === 'binary' && parlayType === 'tournament' && p.tournament)
      );
    }
    
    // Filter by sport
    if (sport !== 'all') {
      filtered = filtered.filter(p => {
        if (p.sport) return p.sport.toLowerCase() === sport;
        if (p.category) {
          const categoryLower = p.category.toLowerCase();
          if (sport === 'worldcup') return categoryLower.includes('world cup') || categoryLower.includes('worldcup');
          if (sport === 'olympics') return categoryLower.includes('olympics') || categoryLower.includes('winter');
          return categoryLower.includes(sport);
        }
        return false;
      });
    }
    
    setFilteredPredictions(filtered);
  };

  // ✅ TRANSFORM KALSHI API DATA
  useEffect(() => {
    console.log('🔄 Kalshi hook data:', { data: kalshiData, loading: kalshiLoading, error: kalshiError });
    
    if (kalshiLoading) {
      setLoading(true);
      return;
    }
    
    if (kalshiData && Array.isArray(kalshiData) && kalshiData.length > 0) {
      console.log(`✅ Kalshi API returned ${kalshiData.length} predictions`);
      const predictionsToUse = transformKalshiData(kalshiData);
      setPredictions(predictionsToUse);
      filterPredictions(predictionsToUse, selectedParlayType, selectedSport, selectedMarket);
      setError(null);
    } else {
      console.warn('⚠️ No Kalshi data received, using February 2026 mock data');
      const predictionsToUse = MOCK_PREDICTIONS_2026;
      setPredictions(predictionsToUse);
      filterPredictions(predictionsToUse, selectedParlayType, selectedSport, selectedMarket);
    }
    
    setLoading(false);
  }, [kalshiData, kalshiLoading, kalshiError]);

  // ✅ HANDLE FILTER CHANGES
  useEffect(() => {
    filterPredictions(predictions, selectedParlayType, selectedSport, selectedMarket);
  }, [selectedMarket, selectedParlayType, selectedSport, predictions]);

  // ✅ HANDLE SEARCH
  useEffect(() => {
    if (!searchQuery.trim()) {
      filterPredictions(predictions, selectedParlayType, selectedSport, selectedMarket);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = predictions.filter(prediction =>
      (prediction.question || '').toLowerCase().includes(lowerQuery) ||
      (prediction.category || '').toLowerCase().includes(lowerQuery) ||
      (prediction.analysis || '').toLowerCase().includes(lowerQuery) ||
      (prediction.game || '').toLowerCase().includes(lowerQuery) ||
      (prediction.tournament || '').toLowerCase().includes(lowerQuery)
    );
    
    setFilteredPredictions(filtered);
  }, [searchQuery, predictions]);

  // ✅ REFRESH FUNCTION
  const handleRefresh = async () => {
    console.log('🔄 Manual Kalshi refresh triggered');
    setRefreshing(true);
    try {
      await refetchKalshi();
      setSnackbarMessage('Kalshi predictions refreshed successfully');
    } catch (err: any) {
      console.error('Kalshi refresh failed:', err);
      setSnackbarMessage(`Refresh failed: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ GENERATE PREDICTION
  const generateKalshiPrediction = async (prompt: string) => {
    if (!prompt.trim()) return;

    if (remainingGenerations > 0 || hasPremiumAccess) {
      setGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newPrediction: Prediction = {
        id: `kalshi-${Date.now()}`,
        question: `AI: ${prompt}`,
        category: prompt.includes('Olympic') || prompt.includes('gold') ? 'Olympics' : 
                  prompt.includes('World Cup') || prompt.includes('Mbappe') ? 'World Cup' : 'AI Generated',
        yesPrice: '0.65',
        noPrice: '0.35',
        volume: 'AI Analysis',
        confidence: 78,
        edge: '+4.5%',
        analysis: `AI analysis of "${prompt}". Based on current market trends and probability models for February 2026.`,
        expires: 'Tomorrow',
        platform: 'kalshi',
        marketType: 'binary',
        trend: 'up',
        aiGenerated: true,
      };

      setPredictions([newPrediction, ...predictions]);
      if (!hasPremiumAccess) {
        setRemainingGenerations(remainingGenerations - 1);
      }
      setGenerating(false);
      setCustomPrompt('');
      setSnackbarMessage(`AI prediction generated for: ${prompt}`);
    } else {
      setShowPurchaseModal(true);
    }
  };

  const handlePlaceTrade = async (marketId: string, side: string, amount: number) => {
    console.log(`Placing ${side} trade for $${amount} on market ${marketId}`);
    setSnackbarMessage(`${side.toUpperCase()} trade placed for $${amount} on market ${marketId}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'NBA': return '#ef4444';
      case 'NFL': return '#3b82f6';
      case 'NHL': return '#10b981';
      case 'MLB': return '#f59e0b';
      case 'Olympics': return '#8b5cf6';
      case 'World Cup': return '#14b8a6';
      case 'Sports': return '#ef4444';
      case 'Politics': return '#3b82f6';
      case 'Economics': return '#10b981';
      case 'AI Generated': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, mt: 2 }}>Loading February 2026 predictions...</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Fetching Winter Olympics & multi-sport parlay markets...
          </Typography>
        </Box>
      </Container>
    );
  }

  const displayError = error || kalshiError;

  return (
    <>
      <Container maxWidth="lg">
        {/* Debug Banner */}
        {import.meta.env.DEV && (
          <Alert
            severity={displayError ? "warning" : "info"}
            sx={{ mb: 2 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => console.log('Current predictions:', predictions)}>
                  Log Data
                </Button>
                <Button size="small" onClick={handleRefresh} disabled={refreshing}>
                  Refresh
                </Button>
              </Box>
            }
          >
            <Typography variant="caption">
              🔍 Kalshi Debug: Showing {predictions.length} predictions • 
              Source: {kalshiData?.length ? 'KALSHI API' : 'MOCK 2026 DATA'} • 
              Parlays: {predictions.filter(p => p.legs).length} • 
              Olympics: {predictions.filter(p => p.category === 'Olympics').length} • 
              Multi-Sport: {predictions.filter(p => p.parlay_type === 'multi_sport').length}
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
                  label="FEBRUARY 2026"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    mr: 1
                  }}
                />
                <Chip
                  label={kalshiData?.length > 0 ? "Live API" : "Olympics Mode"}
                  sx={{ 
                    backgroundColor: kalshiData?.length > 0 ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)',
                    color: 'white'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton sx={{ color: 'white' }}>
                  <SearchIcon />
                </IconButton>
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
                  Kalshi Predictions • 2026
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Multi-sport parlays • Winter Olympics • World Cup '26 • 9+ platforms
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </GradientCard>

        {/* FEATURED BANNER - FEBRUARY 2026 OLYMPICS */}
        <FeaturedBanner2026 />

        {/* Search Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <TextField
            fullWidth
            placeholder="Search parlays, sports, Olympics, World Cup 2026..."
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

        {/* SPORT FILTERS - INTEGRATED FROM FILE 1 */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1, display: 'flex', alignItems: 'center' }}>
            <SportsBasketballIcon sx={{ mr: 1, fontSize: 18 }} /> Filter by Sport:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {sportFilters.map((sport) => (
              <Chip
                key={sport.id}
                icon={sport.icon}
                label={sport.label}
                onClick={() => setSelectedSport(sport.id as SportFilter)}
                sx={{
                  backgroundColor: selectedSport === sport.id ? '#8b5cf6' : '#0f172a',
                  color: selectedSport === sport.id ? 'white' : '#94a3b8',
                  borderColor: '#334155',
                  '&:hover': {
                    backgroundColor: selectedSport === sport.id ? '#7c3aed' : '#1e293b',
                  },
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* PARLAY TYPE FILTERS - INTEGRATED FROM FILE 1 */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1, display: 'flex', alignItems: 'center' }}>
            <FitnessIcon sx={{ mr: 1, fontSize: 18 }} /> Parlay Type:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {parlayTypeFilters.map((type) => (
              <Chip
                key={type.id}
                icon={type.icon}
                label={type.label}
                onClick={() => setSelectedParlayType(type.id as ParlayType)}
                sx={{
                  backgroundColor: selectedParlayType === type.id ? '#8b5cf6' : '#0f172a',
                  color: selectedParlayType === type.id ? 'white' : '#94a3b8',
                  borderColor: '#334155',
                  '&:hover': {
                    backgroundColor: selectedParlayType === type.id ? '#7c3aed' : '#1e293b',
                  },
                }}
              />
            ))}
          </Box>
        </Paper>

        {/* Market Category Filter */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
            Filter by Market:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {markets.map((market) => (
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

        {/* News Feed - 2026 Olympic/World Cup Focused */}
        <KalshiNewsFeed newsItems={kalshiNews2026} />

        {/* Contract Explainer */}
        <KalshiContractExplainer />

        {/* Generation Counter */}
        <Card sx={{ mb: 3, backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FlashIcon sx={{ color: '#8b5cf6', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                Daily AI Predictions • Feb 2026
              </Typography>
            </Box>

            {hasPremiumAccess ? (
              <Alert
                icon={<CheckCircleIcon />}
                severity="success"
                sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
              >
                <Typography fontWeight="bold">Premium: Unlimited Olympic & Parlay Predictions</Typography>
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
                  Generate Olympics, World Cup, and multi-sport parlay predictions
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Generate Prediction Section */}
        <Card sx={{ mb: 4, backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 1 }}>
                🤖 Generate 2026 Parlay Prediction
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                AI analyzes Olympics, World Cup, and multi-sport markets
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, overflowX: 'auto', pb: 1 }}>
              {kalshiPrompts2026.map((prompt: string, index: number) => (
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
                placeholder="Custom prompt: 'USA vs Canada gold medal game parlay...'"
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

        {/* Results Count */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ color: 'text.primary' }}>
            📊 Live Parlay Markets • 2026
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${filteredPredictions.length} predictions`}
              sx={{ backgroundColor: '#1e293b', color: '#cbd5e1' }}
            />
            <Chip
              icon={<FlashIcon />}
              label="Avg Edge +3.4%"
              size="small"
              sx={{ backgroundColor: '#10b98120', color: '#10b981' }}
            />
          </Box>
        </Box>

        {/* PREDICTIONS GRID - FULLY INTEGRATED FROM FILE 1 */}
        {filteredPredictions.length > 0 ? (
          <Grid container spacing={3} sx={{ mb: 8 }}>
            {filteredPredictions.map((prediction: Prediction) => {
              const yesProbability = Math.round(parseFloat(prediction.yesPrice) * 100);
              const platformColor = getPlatformColor(prediction.platform);
              const isExpanded = expandedCard === prediction.id;
              
              return (
                <Grid item xs={12} md={6} lg={4} key={prediction.id}>
                  <PredictionCard>
                    <CardContent>
                      {/* Header with Platform and Type */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              bgcolor: `${platformColor}20`,
                              color: platformColor,
                              width: 32,
                              height: 32,
                            }}
                          >
                            {getParlayTypeIcon(prediction.parlay_type || prediction.marketType)}
                          </Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                              {prediction.platform.toUpperCase()} • {prediction.parlay_type?.replace('_', ' ') || prediction.marketType}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'white', mt: 0.5 }}>
                              {prediction.question || prediction.game}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={`Edge ${prediction.edge}`}
                          size="small"
                          sx={{
                            backgroundColor: '#8b5cf620',
                            color: '#8b5cf6',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>

                      {/* Game Time */}
                      {prediction.game_time && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8', mr: 0.5 }} />
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {prediction.game_time}
                          </Typography>
                        </Box>
                      )}

                      {/* Combined Odds for Parlays - INTEGRATED FROM FILE 1 */}
                      {prediction.combined_odds && prediction.model_probability && prediction.implied_probability && (
                        <Paper sx={{ 
                          p: 2, 
                          mb: 2, 
                          backgroundColor: '#8b5cf610', 
                          border: '1px solid #8b5cf640',
                          borderRadius: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 600 }}>
                            Combined Odds
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                              {prediction.combined_odds}
                            </Typography>
                            <Chip
                              label={`+${((prediction.model_probability - prediction.implied_probability) * 100).toFixed(1)}% EV`}
                              size="small"
                              sx={{ backgroundColor: '#10b98120', color: '#10b981' }}
                            />
                          </Box>
                        </Paper>
                      )}

                      {/* Binary Market Prices - Only for Kalshi */}
                      {prediction.yesPrice !== undefined && prediction.platform === 'kalshi' && (
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
                                sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
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
                                sx={{ backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}
                              >
                                Buy NO
                              </Button>
                            </Paper>
                          </Grid>
                        </Grid>
                      )}

                      {/* Parlay Legs - INTEGRATED FROM FILE 1 */}
                      {prediction.legs && prediction.legs.length > 0 && (
                        <ParlayLegsComponent legs={prediction.legs} />
                      )}

                      {/* Analysis Section - Expandable */}
                      <Box 
                        onClick={() => setExpandedCard(isExpanded ? null : prediction.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <Paper sx={{ p: 2, backgroundColor: '#0f172a', mb: 2, border: '1px solid #334155' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <AnalyticsIcon sx={{ color: '#f59e0b', mr: 1, mt: 0.5, fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                              {isExpanded 
                                ? prediction.analysis 
                                : prediction.analysis.length > 100 
                                  ? `${prediction.analysis.substring(0, 100)}...` 
                                  : prediction.analysis
                              }
                            </Typography>
                          </Box>
                        </Paper>

                        {/* Expanded Content */}
                        <Collapse in={isExpanded}>
                          {/* Tournament Info - INTEGRATED FROM FILE 1 */}
                          {prediction.tournament && (
                            <Box sx={{ mt: 1, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon sx={{ fontSize: 14, color: '#94a3b8', mr: 0.5 }} />
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                  Expires: {prediction.expires}
                                </Typography>
                              </Box>
                              {prediction.host_nations && prediction.host_nations.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <LocationIcon sx={{ fontSize: 14, color: '#94a3b8', mr: 0.5 }} />
                                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    Hosts: {prediction.host_nations.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Confidence Meter - INTEGRATED FROM FILE 1 */}
                          <Box sx={{ mt: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Model Confidence
                              </Typography>
                              <Typography variant="caption" fontWeight="bold" sx={{ color: 'white' }}>
                                {prediction.confidence}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={prediction.confidence}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#334155',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#8b5cf6',
                                },
                              }}
                            />
                          </Box>
                        </Collapse>

                        {/* Expand/Collapse Indicator */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <IconButton size="small" sx={{ color: '#64748b' }}>
                            {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Footer */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={prediction.category}
                            size="small"
                            sx={{
                              backgroundColor: `${getCategoryColor(prediction.category)}20`,
                              color: getCategoryColor(prediction.category),
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {prediction.expires}
                          </Typography>
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
          <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 2, mb: 8 }}>
            <TrophyIcon sx={{ fontSize: 48, color: '#8b5cf6', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No 2026 predictions found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try adjusting your sport or parlay type filters, or generate a new Olympic prediction!
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 2, backgroundColor: '#8b5cf6' }}
              onClick={() => generateKalshiPrediction('Will USA win most gold medals at 2026 Olympics?')}
            >
              Generate Olympic Prediction
            </Button>
          </Paper>
        )}

        {/* Data Source Info */}
        {displayError && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>Using February 2026 Olympic Data</AlertTitle>
            <Typography variant="body2">
              Showing sample Winter Olympics and World Cup 2026 parlays. Real Kalshi API data will appear when available.
            </Typography>
          </Alert>
        )}

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
              Purchase 2026 Predictions
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>
              Daily free prediction limit reached. Get unlimited Olympic & parlay analysis:
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
      
      {/* Snackbar */}
      {snackbarMessage && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            p: 2,
            backgroundColor: '#1e293b',
            color: 'white',
            borderRadius: 1,
            zIndex: 9999,
            maxWidth: 300,
          }}
        >
          <Typography variant="body2">{snackbarMessage}</Typography>
          <IconButton
            size="small"
            onClick={() => setSnackbarMessage('')}
            sx={{ position: 'absolute', top: 4, right: 4, color: 'white' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}
    </>
  );
};

export default KalshiPredictionsScreen;
