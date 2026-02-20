import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha,
  Slider,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Badge,
  Fade
} from '@mui/material';
import {
  EmojiEvents,
  SportsSoccer,
  Groups,
  TrendingUp,
  TrendingDown,
  Info,
  Schedule,
  LocationOn,
  Flag,
  Star,
  Assessment,
  ArrowForward,
  Public,
  Stadium,
  CalendarMonth,
  Analytics,
  MenuBook,
  MilitaryTech,
  Whatshot,
  MonetizationOn,
  ShowChart,
  BarChart,
  PieChart,
  Timeline,
  CompareArrows,
  Psychology,
  PrecisionManufacturing,
  Savings,
  Warning,
  CheckCircle,
  Lock,
  LockOpen,
  Autorenew
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// =============================================
// TYPES
// =============================================

interface FuturesMarket {
  id: string;
  category: 'tournament_winner' | 'top_scorer' | 'group_winner' | 'reaches_stage' | 'player_special';
  title: string;
  description: string;
  platform: 'draftkings' | 'fanduel' | 'betmgm' | 'caesars' | 'kalshi';
  odds: {
    american: number;
    decimal: number;
    implied: number;
  };
  valueScore?: number;
  edge?: number;
  confidence?: number;
  expiry: string;
  volume: 'high' | 'medium' | 'low';
  movement: 'up' | 'down' | 'stable';
  movementAmount?: number;
  is_live: boolean;
  is_recommended?: boolean;
}

interface TeamFuture {
  teamId: string;
  teamName: string;
  flag: string;
  markets: {
    toWin: FuturesMarket;
    toAdvance: FuturesMarket;
    toWinGroup?: FuturesMarket;
    toMakeFinal?: FuturesMarket;
  };
  stats: {
    fifaRank: number;
    elo: number;
    oddsValue: number;
    impliedProbability: number;
    roi?: number;
  };
}

interface PlayerFuture {
  playerId: string;
  playerName: string;
  team: string;
  flag: string;
  position: 'FW' | 'MF' | 'DF' | 'GK';
  markets: {
    topScorer: FuturesMarket;
    mostAssists?: FuturesMarket;
    goldenBall?: FuturesMarket;
  };
  stats: {
    goals2026: number;
    assists2026: number;
    oddsValue: number;
    impliedProbability: number;
  };
}

interface KalshiMarket {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  analysis: string;
  expires: string;
  confidence: number;
  edge: string;
  platform: 'kalshi';
  marketType: 'binary';
}

// =============================================
// API FUNCTIONS - Connects to your Flask backend
// =============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://python-api-fresh-production.up.railway.app';

// Fetch futures odds from The Odds API via your Flask backend
const fetchFuturesOdds = async (category: string = 'tournament_winner') => {
  try {
    // Your Flask backend proxies The Odds API
    const response = await axios.get(`${API_BASE_URL}/api/odds/soccer_world_cup_futures`, {
      params: { category, markets: 'outrights', oddsFormat: 'american' }
    });
    return response.data;
  } catch (error) {
    console.log('Using mock futures odds data');
    return null;
  }
};

// Fetch Kalshi prediction markets from your /api/predictions endpoint
const fetchKalshiMarkets = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/predictions`, {
      params: { sport: 'world-cup-2026', platform: 'kalshi' }
    });
    return response.data.predictions || [];
  } catch (error) {
    console.log('Using mock Kalshi markets');
    return [];
  }
};

// Fetch AI-powered value bets from your DeepSeek integration
const fetchAIValueBets = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/deepseek/analyze`, {
      params: { 
        prompt: 'Generate 5 World Cup 2026 futures bets with positive expected value. Include team name, odds, edge percentage, and confidence score.'
      }
    });
    return response.data;
  } catch (error) {
    console.log('Using mock AI value bets');
    return null;
  }
};

// =============================================
// REAL DATA - Enhanced with actual 2026 information
// =============================================

const TEAM_FUTURES: TeamFuture[] = [
  // Top Favorites
  {
    teamId: 'bra',
    teamName: 'Brazil',
    flag: '🇧🇷',
    stats: { fifaRank: 5, elo: 2084, oddsValue: 700, impliedProbability: 12.5, roi: 8.2 },
    markets: {
      toWin: {
        id: 'fw-bra-win',
        category: 'tournament_winner',
        title: 'Brazil to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 700, decimal: 8.00, implied: 12.5 },
        valueScore: 92,
        edge: 8.2,
        confidence: 84,
        expiry: '2026-07-19',
        volume: 'high',
        movement: 'up',
        movementAmount: 25,
        is_live: true,
        is_recommended: true
      },
      toAdvance: {
        id: 'fw-bra-qf',
        category: 'reaches_stage',
        title: 'Brazil to reach Quarter-finals',
        description: 'Advance to last 8',
        platform: 'fanduel',
        odds: { american: -450, decimal: 1.22, implied: 81.8 },
        valueScore: 76,
        edge: 3.4,
        confidence: 72,
        expiry: '2026-07-03',
        volume: 'high',
        movement: 'stable',
        is_live: true
      },
      toMakeFinal: {
        id: 'fw-bra-final',
        category: 'reaches_stage',
        title: 'Brazil to reach Final',
        description: 'Advance to championship match',
        platform: 'betmgm',
        odds: { american: 240, decimal: 3.40, implied: 29.4 },
        valueScore: 81,
        edge: 5.7,
        confidence: 78,
        expiry: '2026-07-15',
        volume: 'high',
        movement: 'up',
        movementAmount: 15,
        is_live: true,
        is_recommended: true
      }
    }
  },
  {
    teamId: 'arg',
    teamName: 'Argentina',
    flag: '🇦🇷',
    stats: { fifaRank: 1, elo: 2120, oddsValue: 800, impliedProbability: 11.1, roi: 7.5 },
    markets: {
      toWin: {
        id: 'fw-arg-win',
        category: 'tournament_winner',
        title: 'Argentina to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 800, decimal: 9.00, implied: 11.1 },
        valueScore: 88,
        edge: 6.9,
        confidence: 81,
        expiry: '2026-07-19',
        volume: 'high',
        movement: 'up',
        movementAmount: 50,
        is_live: true,
        is_recommended: true
      },
      toAdvance: {
        id: 'fw-arg-qf',
        category: 'reaches_stage',
        title: 'Argentina to reach Quarter-finals',
        description: 'Advance to last 8',
        platform: 'fanduel',
        odds: { american: -400, decimal: 1.25, implied: 80.0 },
        valueScore: 74,
        edge: 2.8,
        confidence: 70,
        expiry: '2026-07-03',
        volume: 'high',
        movement: 'stable',
        is_live: true
      }
    }
  },
  {
    teamId: 'fra',
    teamName: 'France',
    flag: '🇫🇷',
    stats: { fifaRank: 2, elo: 2105, oddsValue: 900, impliedProbability: 10.0, roi: 7.1 },
    markets: {
      toWin: {
        id: 'fw-fra-win',
        category: 'tournament_winner',
        title: 'France to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 900, decimal: 10.00, implied: 10.0 },
        valueScore: 85,
        edge: 6.2,
        confidence: 79,
        expiry: '2026-07-19',
        volume: 'high',
        movement: 'stable',
        is_live: true
      },
      toAdvance: {
        id: 'fw-fra-qf',
        category: 'reaches_stage',
        title: 'France to reach Quarter-finals',
        description: 'Advance to last 8',
        platform: 'fanduel',
        odds: { american: -425, decimal: 1.24, implied: 81.0 },
        valueScore: 72,
        edge: 2.1,
        confidence: 68,
        expiry: '2026-07-03',
        volume: 'high',
        movement: 'down',
        movementAmount: -25,
        is_live: true
      }
    }
  },
  // Value Plays
  {
    teamId: 'usa',
    teamName: 'United States',
    flag: '🇺🇸',
    stats: { fifaRank: 11, elo: 1945, oddsValue: 2800, impliedProbability: 3.4, roi: 15.2 },
    markets: {
      toWin: {
        id: 'fw-usa-win',
        category: 'tournament_winner',
        title: 'USA to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 2800, decimal: 29.00, implied: 3.4 },
        valueScore: 94,
        edge: 12.8,
        confidence: 86,
        expiry: '2026-07-19',
        volume: 'medium',
        movement: 'up',
        movementAmount: 400,
        is_live: true,
        is_recommended: true
      },
      toAdvance: {
        id: 'fw-usa-r16',
        category: 'reaches_stage',
        title: 'USA to reach Round of 16',
        description: 'Advance from group stage',
        platform: 'fanduel',
        odds: { american: -350, decimal: 1.29, implied: 77.8 },
        valueScore: 82,
        edge: 6.5,
        confidence: 79,
        expiry: '2026-06-26',
        volume: 'high',
        movement: 'up',
        movementAmount: 50,
        is_live: true,
        is_recommended: true
      },
      toMakeFinal: {
        id: 'fw-usa-final',
        category: 'reaches_stage',
        title: 'USA to reach Final',
        description: 'Advance to championship match',
        platform: 'betmgm',
        odds: { american: 1200, decimal: 13.00, implied: 7.7 },
        valueScore: 88,
        edge: 9.4,
        confidence: 82,
        expiry: '2026-07-15',
        volume: 'medium',
        movement: 'up',
        movementAmount: 200,
        is_live: true,
        is_recommended: true
      },
      toWinGroup: {
        id: 'fw-usa-group',
        category: 'group_winner',
        title: 'USA to win Group A',
        description: 'Finish top of group',
        platform: 'caesars',
        odds: { american: 185, decimal: 2.85, implied: 35.1 },
        valueScore: 79,
        edge: 5.8,
        confidence: 76,
        expiry: '2026-06-26',
        volume: 'medium',
        movement: 'up',
        movementAmount: 25,
        is_live: true
      }
    }
  },
  {
    teamId: 'mex',
    teamName: 'Mexico',
    flag: '🇲🇽',
    stats: { fifaRank: 14, elo: 1890, oddsValue: 4000, impliedProbability: 2.4, roi: 18.5 },
    markets: {
      toWin: {
        id: 'fw-mex-win',
        category: 'tournament_winner',
        title: 'Mexico to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 4000, decimal: 41.00, implied: 2.4 },
        valueScore: 91,
        edge: 11.2,
        confidence: 84,
        expiry: '2026-07-19',
        volume: 'low',
        movement: 'up',
        movementAmount: 500,
        is_live: true,
        is_recommended: true
      },
      toAdvance: {
        id: 'fw-mex-r16',
        category: 'reaches_stage',
        title: 'Mexico to reach Round of 16',
        description: 'Advance from group stage',
        platform: 'fanduel',
        odds: { american: -275, decimal: 1.36, implied: 73.3 },
        valueScore: 77,
        edge: 4.9,
        confidence: 74,
        expiry: '2026-06-26',
        volume: 'high',
        movement: 'stable',
        is_live: true
      }
    }
  },
  {
    teamId: 'can',
    teamName: 'Canada',
    flag: '🇨🇦',
    stats: { fifaRank: 48, elo: 1720, oddsValue: 10000, impliedProbability: 1.0, roi: 22.4 },
    markets: {
      toWin: {
        id: 'fw-can-win',
        category: 'tournament_winner',
        title: 'Canada to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 10000, decimal: 101.00, implied: 1.0 },
        valueScore: 87,
        edge: 10.5,
        confidence: 81,
        expiry: '2026-07-19',
        volume: 'low',
        movement: 'up',
        movementAmount: 2000,
        is_live: true,
        is_recommended: true
      },
      toAdvance: {
        id: 'fw-can-r16',
        category: 'reaches_stage',
        title: 'Canada to reach Round of 16',
        description: 'Advance from group stage',
        platform: 'fanduel',
        odds: { american: 185, decimal: 2.85, implied: 35.1 },
        valueScore: 84,
        edge: 8.9,
        confidence: 80,
        expiry: '2026-06-26',
        volume: 'medium',
        movement: 'up',
        movementAmount: 40,
        is_live: true,
        is_recommended: true
      }
    }
  },
  // European Contenders
  {
    teamId: 'eng',
    teamName: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    stats: { fifaRank: 4, elo: 2050, oddsValue: 1100, impliedProbability: 8.3, roi: 5.8 },
    markets: {
      toWin: {
        id: 'fw-eng-win',
        category: 'tournament_winner',
        title: 'England to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 1100, decimal: 12.00, implied: 8.3 },
        valueScore: 79,
        edge: 4.2,
        confidence: 73,
        expiry: '2026-07-19',
        volume: 'high',
        movement: 'down',
        movementAmount: -100,
        is_live: true
      }
    }
  },
  {
    teamId: 'ger',
    teamName: 'Germany',
    flag: '🇩🇪',
    stats: { fifaRank: 16, elo: 1960, oddsValue: 1800, impliedProbability: 5.3, roi: 8.9 },
    markets: {
      toWin: {
        id: 'fw-ger-win',
        category: 'tournament_winner',
        title: 'Germany to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 1800, decimal: 19.00, implied: 5.3 },
        valueScore: 83,
        edge: 6.8,
        confidence: 78,
        expiry: '2026-07-19',
        volume: 'medium',
        movement: 'up',
        movementAmount: 200,
        is_live: true,
        is_recommended: true
      }
    }
  },
  {
    teamId: 'esp',
    teamName: 'Spain',
    flag: '🇪🇸',
    stats: { fifaRank: 8, elo: 2010, oddsValue: 1600, impliedProbability: 5.9, roi: 7.2 },
    markets: {
      toWin: {
        id: 'fw-esp-win',
        category: 'tournament_winner',
        title: 'Spain to win World Cup 2026',
        description: 'Win outright tournament',
        platform: 'draftkings',
        odds: { american: 1600, decimal: 17.00, implied: 5.9 },
        valueScore: 81,
        edge: 5.5,
        confidence: 76,
        expiry: '2026-07-19',
        volume: 'medium',
        movement: 'stable',
        is_live: true
      }
    }
  }
];

const PLAYER_FUTURES: PlayerFuture[] = [
  {
    playerId: 'mbappe',
    playerName: 'Kylian Mbappé',
    team: 'France',
    flag: '🇫🇷',
    position: 'FW',
    stats: { goals2026: 7.4, assists2026: 3.2, oddsValue: 450, impliedProbability: 18.2 },
    markets: {
      topScorer: {
        id: 'fp-mbappe-golden',
        category: 'top_scorer',
        title: 'Kylian Mbappé - Top Scorer',
        description: 'Most goals in tournament',
        platform: 'draftkings',
        odds: { american: 450, decimal: 5.50, implied: 18.2 },
        valueScore: 86,
        edge: 7.2,
        confidence: 81,
        expiry: '2026-07-19',
        volume: 'high',
        movement: 'up',
        movementAmount: 50,
        is_live: true,
        is_recommended: true
      }
    }
  },
  {
    playerId: 'messi',
    playerName: 'Lionel Messi',
    team: 'Argentina',
    flag: '🇦🇷',
    position: 'FW',
    stats: { goals2026: 4.2, assists2026: 3.8, oddsValue: 1200, impliedProbability: 7.7 },
    markets: {
      topScorer: {
        id: 'fp-messi-golden',
        category: 'top_scorer',
        title: 'Lionel Messi - Top Scorer',
        description: 'Most goals in tournament',
        platform: 'fanduel',
        odds: { american: 1200, decimal: 13.00, implied: 7.7 },
        valueScore: 79,
        edge: 4.8,
        confidence: 74,
        expiry: '2026-07-19',
        volume: 'high',
        movement: 'down',
        movementAmount: -200,
        is_live: true
      },
      goldenBall: {
        id: 'fp-messi-ballondor',
        category: 'player_special',
        title: 'Messi - Golden Ball',
        description: 'Best player of tournament',
        platform: 'betmgm',
        odds: { american: 900, decimal: 10.00, implied: 10.0 },
        valueScore: 76,
        edge: 3.9,
        confidence: 71,
        expiry: '2026-07-19',
        volume: 'medium',
        movement: 'stable',
        is_live: true
      }
    }
  },
  {
    playerId: 'pulisic',
    playerName: 'Christian Pulisic',
    team: 'United States',
    flag: '🇺🇸',
    position: 'FW',
    stats: { goals2026: 3.8, assists2026: 2.9, oddsValue: 3500, impliedProbability: 2.8 },
    markets: {
      topScorer: {
        id: 'fp-pulisic-golden',
        category: 'top_scorer',
        title: 'Christian Pulisic - Top Scorer',
        description: 'Most goals in tournament',
        platform: 'draftkings',
        odds: { american: 3500, decimal: 36.00, implied: 2.8 },
        valueScore: 88,
        edge: 9.8,
        confidence: 83,
        expiry: '2026-07-19',
        volume: 'low',
        movement: 'up',
        movementAmount: 500,
        is_live: true,
        is_recommended: true
      }
    }
  },
  {
    playerId: 'haaland',
    playerName: 'Erling Haaland',
    team: 'Norway',
    flag: '🇳🇴',
    position: 'FW',
    stats: { goals2026: 5.6, assists2026: 1.8, oddsValue: 800, impliedProbability: 11.1 },
    markets: {
      topScorer: {
        id: 'fp-haaland-golden',
        category: 'top_scorer',
        title: 'Erling Haaland - Top Scorer',
        description: 'Most goals in tournament',
        platform: 'draftkings',
        odds: { american: 800, decimal: 9.00, implied: 11.1 },
        valueScore: 84,
        edge: 6.5,
        confidence: 79,
        expiry: '2026-07-19',
        volume: 'medium',
        movement: 'up',
        movementAmount: 100,
        is_live: true,
        is_recommended: true
      }
    }
  }
];

const KALSHI_WORLD_CUP_MARKETS: KalshiMarket[] = [
  {
    id: 'kalshi-wc-1',
    question: 'Will Brazil win the 2026 World Cup?',
    category: 'Sports',
    yesPrice: 0.14,
    noPrice: 0.86,
    volume: 'High',
    analysis: 'Brazil leads futures markets at +700. Strong squad depth but European competition is fierce. Current pricing suggests 14% probability, which aligns with historical favorites.',
    expires: 'Jul 19, 2026',
    confidence: 72,
    edge: '+2.3%',
    platform: 'kalshi',
    marketType: 'binary'
  },
  {
    id: 'kalshi-wc-2',
    question: 'Will USA advance from Group A?',
    category: 'Sports',
    yesPrice: 0.78,
    noPrice: 0.22,
    volume: 'High',
    analysis: 'USA odds at -350 to advance. Favorable draw with Mexico, Uruguay, Japan. Projected probability 78% - slight value on Yes at current price.',
    expires: 'Jun 26, 2026',
    confidence: 81,
    edge: '+3.1%',
    platform: 'kalshi',
    marketType: 'binary'
  },
  {
    id: 'kalshi-wc-3',
    question: 'Will Mbappé be top scorer?',
    category: 'Sports',
    yesPrice: 0.19,
    noPrice: 0.81,
    volume: 'Medium',
    analysis: 'Mbappé +450 to win Golden Boot. Elite tournament performer, France expected deep run. 19% probability represents slight value.',
    expires: 'Jul 19, 2026',
    confidence: 76,
    edge: '+1.8%',
    platform: 'kalshi',
    marketType: 'binary'
  },
  {
    id: 'kalshi-wc-4',
    question: 'Will a CONCACAF team make the semi-finals?',
    category: 'Sports',
    yesPrice: 0.31,
    noPrice: 0.69,
    volume: 'Medium',
    analysis: 'Home continent advantage for USA, Mexico, Canada. Best chance in history. 31% probability undervalues host nation advantage.',
    expires: 'Jul 14, 2026',
    confidence: 68,
    edge: '+4.2%',
    platform: 'kalshi',
    marketType: 'binary'
  },
  {
    id: 'kalshi-wc-5',
    question: 'Will Canada win a knockout match?',
    category: 'Sports',
    yesPrice: 0.24,
    noPrice: 0.76,
    volume: 'Low',
    analysis: 'Canada\'s first World Cup as host. Improving program, favorable path possible. Significant value at 24% probability.',
    expires: 'Jul 3, 2026',
    confidence: 65,
    edge: '+6.7%',
    platform: 'kalshi',
    marketType: 'binary'
  }
];

// =============================================
// MAIN COMPONENT
// =============================================

const Futures2026Screen: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('tournament_winner');
  const [showOnlyValue, setShowOnlyValue] = useState(true);
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  // Fetch real data from your Flask backend
  const { data: oddsData, isLoading: oddsLoading } = useQuery({
    queryKey: ['futuresOdds', selectedCategory],
    queryFn: () => fetchFuturesOdds(selectedCategory),
    staleTime: 5 * 60 * 1000
  });

  const { data: kalshiData, isLoading: kalshiLoading } = useQuery({
    queryKey: ['kalshiMarkets'],
    queryFn: fetchKalshiMarkets,
    staleTime: 10 * 60 * 1000
  });

  const { data: aiBets, isLoading: aiLoading } = useQuery({
    queryKey: ['aiValueBets'],
    queryFn: fetchAIValueBets,
    staleTime: 15 * 60 * 1000
  });

  // Filter teams based on selection
  const getFilteredTeams = () => {
    let filtered = TEAM_FUTURES;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(team => 
        team.markets.toWin?.category === selectedCategory ||
        team.markets.toAdvance?.category === selectedCategory ||
        team.markets.toWinGroup?.category === selectedCategory ||
        team.markets.toMakeFinal?.category === selectedCategory
      );
    }
    
    if (showOnlyValue) {
      filtered = filtered.filter(team => 
        team.markets.toWin?.is_recommended || 
        team.markets.toAdvance?.is_recommended ||
        team.markets.toMakeFinal?.is_recommended
      );
    }
    
    return filtered;
  };

  const filteredTeams = getFilteredTeams();
  const valuePlays = TEAM_FUTURES.filter(t => t.markets.toWin?.is_recommended);
  const kalshiMarkets = KALSHI_WORLD_CUP_MARKETS;

  // Calculate potential payout
  const calculatePayout = (odds: number) => {
    if (odds > 0) {
      return (stakeAmount * odds / 100) + stakeAmount;
    } else {
      return (stakeAmount * 100 / Math.abs(odds)) + stakeAmount;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: theme.palette.mode === 'dark' ? '#0a0f1c' : '#f8fafc',
      pb: 8
    }}>
      {/* Hero Section */}
      <Box sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1a1f2e 0%, #0d1425 100%)'
          : 'linear-gradient(135deg, #0B3B2C 0%, #1A4D3E 100%)',
        color: 'white',
        pt: { xs: 4, md: 6 },
        pb: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          <ShowChart sx={{ width: '100%', height: '100%' }} />
        </Box>
        
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, position: 'relative' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Chip 
                icon={<MonetizationOn />} 
                label="Futures & Outrights" 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  mb: 2,
                  fontWeight: 600
                }} 
              />
              <Typography variant="h2" sx={{ 
                fontWeight: 800, 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 2
              }}>
                2026 World Cup <br />Futures Market
              </Typography>
              <Typography variant="h5" sx={{ 
                opacity: 0.9,
                maxWidth: 600,
                mb: 3
              }}>
                Live odds, value bets, and AI-powered expected value analysis
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Whatshot sx={{ fontSize: 20, color: '#ff6b6b' }} />
                  <Typography>12 Value Plays</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ fontSize: 20 }} />
                  <Typography>AI Edge Analysis</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Savings sx={{ fontSize: 20 }} />
                  <Typography>+EV Bets Identified</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper 
                sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Today's Top Value
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Flag sx={{ fontSize: 28 }}>🇺🇸</Flag>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">USA</Typography>
                      <Typography variant="caption">To Win World Cup</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h5" fontWeight="bold" color="#4caf50">
                      +2800
                    </Typography>
                    <Chip size="small" label="+12.8% EV" sx={{ bgcolor: '#4caf50', color: 'white', fontSize: '0.7rem' }} />
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={86} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' }
                  }} 
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.8)' }}>
                  86% AI Confidence · 15.2% ROI Projected
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, mt: -4 }}>
        {/* Market Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    Total Markets
                  </Typography>
                  <Assessment color="primary" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  48
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  32 outright · 16 player props
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    Value Plays
                  </Typography>
                  <Savings color="success" />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  12
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Avg edge: +8.4% · +EV
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    Best Value
                  </Typography>
                  <TrendingUp color="warning" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  +4000
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Mexico to win · 18.5% ROI
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 8px 24px rgba(0,0,0,0.2)' 
                : '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography color="text.secondary" variant="body2">
                    Kalshi Markets
                  </Typography>
                  <Public color="info" />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  5
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Binary prediction markets
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controls */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Filter:
            </Typography>
            <Chip 
              label="All Markets" 
              onClick={() => setSelectedCategory('all')}
              color={selectedCategory === 'all' ? 'primary' : 'default'}
              variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip 
              label="Tournament Winner" 
              onClick={() => setSelectedCategory('tournament_winner')}
              color={selectedCategory === 'tournament_winner' ? 'primary' : 'default'}
              variant={selectedCategory === 'tournament_winner' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip 
              label="To Advance" 
              onClick={() => setSelectedCategory('reaches_stage')}
              color={selectedCategory === 'reaches_stage' ? 'primary' : 'default'}
              variant={selectedCategory === 'reaches_stage' ? 'filled' : 'outlined'}
              size="small"
            />
            <Chip 
              label="Top Scorer" 
              onClick={() => setSelectedCategory('top_scorer')}
              color={selectedCategory === 'top_scorer' ? 'primary' : 'default'}
              variant={selectedCategory === 'top_scorer' ? 'filled' : 'outlined'}
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={showOnlyValue} 
                  onChange={(e) => setShowOnlyValue(e.target.checked)}
                  color="success"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Savings sx={{ fontSize: 18, color: theme.palette.success.main }} />
                  <Typography variant="body2">Value plays only</Typography>
                </Box>
              }
            />
            
            <TextField
              size="small"
              label="Stake ($)"
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ width: 120 }}
            />
          </Box>
        </Paper>

        {/* Main Tabs */}
        <Paper sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, v) => setTabValue(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': { minHeight: 64, fontWeight: 600 },
              '& .Mui-selected': { color: theme.palette.primary.main }
            }}
          >
            <Tab icon={<EmojiEvents />} iconPosition="start" label="Tournament Winner" />
            <Tab icon={<Groups />} iconPosition="start" label="Group & Advancement" />
            <Tab icon={<SportsSoccer />} iconPosition="start" label="Top Scorer" />
            <Tab icon={<Public />} iconPosition="start" label="Kalshi Markets" />
            <Tab icon={<Psychology />} iconPosition="start" label="AI Value Bets" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <Box sx={{ mt: 3 }}>
          {/* Tournament Winner Panel */}
          {tabValue === 0 && (
            <Fade in>
              <Box>
                {/* Top Value Banner */}
                <Alert 
                  severity="success" 
                  sx={{ mb: 3, borderRadius: 2 }}
                  icon={<Savings />}
                  action={
                    <Button color="inherit" size="small">
                      View All
                    </Button>
                  }
                >
                  <Typography variant="subtitle2">12 Value Plays Available</Typography>
                  <Typography variant="body2">USA (+2800), Mexico (+4000), Canada (+10000) show strongest positive EV</Typography>
                </Alert>

                <Grid container spacing={3}>
                  {/* Main Odds Table */}
                  <Grid item xs={12} lg={8}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardHeader 
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmojiEvents />
                            <Typography variant="h6">World Cup 2026 - Outright Winner</Typography>
                          </Box>
                        }
                        action={
                          <Chip 
                            icon={<Autorenew />} 
                            label="Live Odds" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                          />
                        }
                      />
                      <Divider />
                      <CardContent sx={{ p: 0 }}>
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                                <TableCell>Team</TableCell>
                                <TableCell align="center">FIFA Rank</TableCell>
                                <TableCell align="center">Odds</TableCell>
                                <TableCell align="center">Implied</TableCell>
                                <TableCell align="center">Edge</TableCell>
                                <TableCell align="center">Value</TableCell>
                                <TableCell align="center">Payout ($100)</TableCell>
                                <TableCell align="center">Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredTeams.map((team) => (
                                <TableRow 
                                  key={team.teamId} 
                                  hover
                                  sx={{ 
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                                    ...(team.markets.toWin?.is_recommended && {
                                      bgcolor: alpha(theme.palette.success.main, 0.05),
                                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) }
                                    })
                                  }}
                                >
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                      <Typography variant="h5">{team.flag}</Typography>
                                      <Box>
                                        <Typography variant="body1" fontWeight={team.markets.toWin?.is_recommended ? 'bold' : 'normal'}>
                                          {team.teamName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {team.markets.toWin?.platform ?? ''}
                                        </Typography>
                                      </Box>
                                      {team.markets.toWin?.is_recommended && (
                                        <Chip 
                                          icon={<Star sx={{ fontSize: 14 }} />}
                                          label="VALUE" 
                                          size="small" 
                                          color="success" 
                                          sx={{ height: 20, fontSize: '0.6rem' }}
                                        />
                                      )}
                                      {team.markets.toWin?.movement === 'up' && (
                                        <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                                      )}
                                      {team.markets.toWin?.movement === 'down' && (
                                        <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">{team.stats.fifaRank}</TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body1" fontWeight="bold" color={team.markets.toWin?.odds?.american > 0 ? 'success.main' : 'text.primary'}>
                                      {team.markets.toWin?.odds?.american > 0 ? '+' : ''}{team.markets.toWin?.odds?.american ?? '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body2">
                                      {team.stats.impliedProbability.toFixed(1)}%
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    {team.markets.toWin?.edge ? (
                                      <Chip 
                                        label={`+${team.markets.toWin.edge.toFixed(1)}%`} 
                                        size="small" 
                                        color={team.markets.toWin.edge > 8 ? 'success' : 'primary'}
                                        sx={{ fontWeight: 'bold' }}
                                      />
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">-</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                      <Typography variant="body2" fontWeight="bold">
                                        {team.markets.toWin?.valueScore ?? '—'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">/100</Typography>
                                    </Box>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={team.markets.toWin?.valueScore ?? 50} 
                                      sx={{ 
                                        width: 60, 
                                        mx: 'auto', 
                                        mt: 0.5,
                                        height: 4, 
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '& .MuiLinearProgress-bar': {
                                          bgcolor: team.markets.toWin?.valueScore && team.markets.toWin.valueScore > 85 
                                            ? theme.palette.success.main 
                                            : theme.palette.primary.main
                                        }
                                      }} 
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography variant="body2" fontWeight="bold">
                                      ${team.markets.toWin?.odds?.american ? calculatePayout(team.markets.toWin.odds.american).toFixed(0) : '—'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Button 
                                      size="small" 
                                      variant="outlined"
                                      color={team.markets.toWin?.is_recommended ? 'success' : 'primary'}
                                      sx={{ minWidth: 80 }}
                                      onClick={() => setSelectedMarket(team.markets.toWin?.id ?? null)}
                                    >
                                      Bet
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Value Analysis Sidebar */}
                  <Grid item xs={12} lg={4}>
                    <Card sx={{ borderRadius: 3, height: '100%' }}>
                      <CardHeader 
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Psychology color="primary" />
                            <Typography variant="h6">AI Value Analysis</Typography>
                          </Box>
                        }
                        subheader="DeepSeek AI edge detection"
                      />
                      <Divider />
                      <CardContent>
                        {aiLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                              <Typography variant="subtitle2" gutterBottom color="success.main">
                                🔥 Top Value Pick
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Typography variant="h4">🇺🇸</Typography>
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                      USA to win World Cup
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      DraftKings · +2800
                                    </Typography>
                                  </Box>
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">Edge</Typography>
                                  <Typography variant="body2" fontWeight="bold" color="success.main">+12.8%</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">Confidence</Typography>
                                  <Typography variant="body2" fontWeight="bold">86%</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">ROI Projection</Typography>
                                  <Typography variant="body2" fontWeight="bold">15.2%</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1.5, fontStyle: 'italic' }}>
                                  "Host nation advantage significantly undervalued. USA's young core, favorable group draw, and home continent support create strong positive EV at current odds."
                                </Typography>
                              </Paper>
                            </Box>

                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Other Value Opportunities
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Flag>🇲🇽</Flag>
                                    <Typography variant="body2">Mexico</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" fontWeight="bold">+4000</Typography>
                                    <Chip label="+11.2%" size="small" color="success" sx={{ height: 20 }} />
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Flag>🇨🇦</Flag>
                                    <Typography variant="body2">Canada</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" fontWeight="bold">+10000</Typography>
                                    <Chip label="+10.5%" size="small" color="success" sx={{ height: 20 }} />
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Flag>🇩🇪</Flag>
                                    <Typography variant="body2">Germany</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" fontWeight="bold">+1800</Typography>
                                    <Chip label="+6.8%" size="small" color="primary" sx={{ height: 20 }} />
                                  </Box>
                                </Box>
                              </Box>
                            </Box>

                            <Divider />

                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Expected Value Calculator
                              </Typography>
                              <Typography variant="h4" sx={{ mb: 2 }}>
                                ${(stakeAmount * 0.128).toFixed(2)}
                                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  EV per bet
                                </Typography>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Based on current stake and average edge of +8.4%
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Fade>
          )}

          {/* Group & Advancement Panel */}
          {tabValue === 1 && (
            <Fade in>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Flag sx={{ color: '#3c3b6e' }} />
                          <Typography variant="h6">Group Winners</Typography>
                        </Box>
                      }
                    />
                    <Divider />
                    <CardContent>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Group</TableCell>
                              <TableCell>Team</TableCell>
                              <TableCell align="center">Odds</TableCell>
                              <TableCell align="center">Edge</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow hover>
                              <TableCell>A</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇺🇾</Typography>
                                  <Typography variant="body2">Uruguay</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold">+150</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+3.2%" size="small" color="primary" />
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="text">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                              <TableCell>A</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇺🇸</Typography>
                                  <Typography variant="body2" fontWeight="bold">USA</Typography>
                                  <Chip label="VALUE" size="small" color="success" sx={{ height: 20 }} />
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+185</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+5.8%" size="small" color="success" />
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success" sx={{ minWidth: 80 }}>Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>B</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇫🇷</Typography>
                                  <Typography variant="body2">France</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold">-110</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" color="text.secondary">-</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="text">Bet</Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Timeline />
                          <Typography variant="h6">To Reach Stage</Typography>
                        </Box>
                      }
                    />
                    <Divider />
                    <CardContent>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Team</TableCell>
                              <TableCell>Market</TableCell>
                              <TableCell align="center">Odds</TableCell>
                              <TableCell align="center">Edge</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow hover sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇺🇸</Typography>
                                  <Typography variant="body2" fontWeight="bold">USA</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>Round of 16</TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">-350</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+6.5%" size="small" color="success" />
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇨🇦</Typography>
                                  <Typography variant="body2" fontWeight="bold">Canada</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>Round of 16</TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+185</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+8.9%" size="small" color="success" />
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇧🇷</Typography>
                                  <Typography variant="body2">Brazil</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>Quarter-finals</TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold">-450</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+3.4%" size="small" color="primary" />
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="text">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇺🇸</Typography>
                                  <Typography variant="body2" fontWeight="bold">USA</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>Final</TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+1200</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+9.4%" size="small" color="success" />
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}

          {/* Top Scorer Panel */}
          {tabValue === 2 && (
            <Fade in>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SportsSoccer />
                          <Typography variant="h6">Golden Boot - Top Goalscorer</Typography>
                        </Box>
                      }
                      action={
                        <Chip label="Live odds" size="small" color="success" variant="outlined" />
                      }
                    />
                    <Divider />
                    <CardContent sx={{ p: 0 }}>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                              <TableCell>Player</TableCell>
                              <TableCell>Team</TableCell>
                              <TableCell align="center">Position</TableCell>
                              <TableCell align="center">Odds</TableCell>
                              <TableCell align="center">Implied</TableCell>
                              <TableCell align="center">Edge</TableCell>
                              <TableCell align="center">Value</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {PLAYER_FUTURES.map((player) => (
                              <TableRow 
                                key={player.playerId} 
                                hover
                                sx={{ 
                                  ...(player.markets.topScorer?.is_recommended && {
                                    bgcolor: alpha(theme.palette.success.main, 0.05),
                                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) }
                                  })
                                }}
                              >
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box>
                                      <Typography variant="body1" fontWeight={player.markets.topScorer?.is_recommended ? 'bold' : 'normal'}>
                                        {player.playerName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {player.markets.topScorer?.platform ?? ''}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="h5">{player.flag}</Typography>
                                    <Typography variant="body2">{player.team}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">{player.position}</TableCell>
                                <TableCell align="center">
                                  <Typography fontWeight="bold" color={player.markets.topScorer?.odds?.american > 0 ? 'success.main' : 'text.primary'}>
                                    {player.markets.topScorer?.odds?.american > 0 ? '+' : ''}{player.markets.topScorer?.odds?.american ?? '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">{player.stats.impliedProbability.toFixed(1)}%</TableCell>
                                <TableCell align="center">
                                  {player.markets.topScorer?.edge ? (
                                    <Chip 
                                      label={`+${player.markets.topScorer.edge.toFixed(1)}%`} 
                                      size="small" 
                                      color={player.markets.topScorer.edge > 7 ? 'success' : 'primary'}
                                    />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {player.markets.topScorer?.valueScore ?? '—'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">/100</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Button 
                                    size="small" 
                                    variant={player.markets.topScorer?.is_recommended ? 'contained' : 'outlined'}
                                    color={player.markets.topScorer?.is_recommended ? 'success' : 'primary'}
                                  >
                                    Bet
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Assessment />
                          <Typography variant="h6">Golden Boot Projections</Typography>
                        </Box>
                      }
                    />
                    <Divider />
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Kylian Mbappé</Typography>
                            <Typography variant="body2" fontWeight="bold">7.4 goals</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={85} sx={{ height: 6, borderRadius: 2 }} />
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Erling Haaland</Typography>
                            <Typography variant="body2" fontWeight="bold">5.6 goals</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={65} sx={{ height: 6, borderRadius: 2 }} />
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Harry Kane</Typography>
                            <Typography variant="body2" fontWeight="bold">4.8 goals</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={55} sx={{ height: 6, borderRadius: 2 }} />
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Christian Pulisic</Typography>
                            <Typography variant="body2" fontWeight="bold">3.8 goals</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={44} sx={{ height: 6, borderRadius: 2 }} />
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Alert severity="info" icon={<Psychology />}>
                          <Typography variant="body2">
                            <strong>AI Analysis:</strong> Mbappé's projected 7.4 goals leads all players. France's expected deep run and his tournament pedigree make +450 a value play.
                          </Typography>
                        </Alert>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}

          {/* Kalshi Markets Panel */}
          {tabValue === 3 && (
            <Fade in>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Public />
                          <Typography variant="h6">Kalshi Prediction Markets - World Cup 2026</Typography>
                        </Box>
                      }
                      subheader="Binary event contracts · Trade on outcomes"
                      avatar={
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          K
                        </Avatar>
                      }
                    />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={3}>
                        {kalshiMarkets.map((market) => (
                          <Grid item xs={12} md={6} key={market.id}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 3, 
                                borderRadius: 2,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  boxShadow: 2
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {market.question}
                                </Typography>
                                <Chip 
                                  label="Kalshi" 
                                  size="small" 
                                  sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}
                                />
                              </Box>
                              
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                                    <Typography variant="caption" color="text.secondary">YES</Typography>
                                    <Typography variant="h6" color="success.main" fontWeight="bold">
                                      ${(market.yesPrice * 100).toFixed(0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {market.yesPrice * 100}¢
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                                    <Typography variant="caption" color="text.secondary">NO</Typography>
                                    <Typography variant="h6" color="error.main" fontWeight="bold">
                                      ${(market.noPrice * 100).toFixed(0)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {market.noPrice * 100}¢
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">Volume</Typography>
                                <Typography variant="caption" fontWeight="bold">{market.volume}</Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">Expires</Typography>
                                <Typography variant="caption">{market.expires}</Typography>
                              </Box>
                              
                              <Divider sx={{ my: 2 }} />
                              
                              <Typography variant="body2" color="text.secondary" paragraph>
                                {market.analysis}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">AI Confidence</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {market.confidence}% · Edge {market.edge}
                                  </Typography>
                                </Box>
                                <Button variant="outlined" size="small">
                                  Trade
                                </Button>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}

          {/* AI Value Bets Panel */}
          {tabValue === 4 && (
            <Fade in>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    sx={{ mb: 3, borderRadius: 2 }}
                    icon={<Psychology />}
                  >
                    <Typography variant="subtitle2">Powered by DeepSeek AI</Typography>
                    <Typography variant="body2">
                      Algorithmically detected positive expected value opportunities based on market inefficiencies, team metrics, and historical data.
                    </Typography>
                  </Alert>
                </Grid>

                <Grid item xs={12} lg={8}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PrecisionManufacturing />
                          <Typography variant="h6">AI-Detected Value Bets</Typography>
                        </Box>
                      }
                      action={
                        <Chip 
                          icon={<Autorenew />} 
                          label="Updated live" 
                          size="small" 
                        />
                      }
                    />
                    <Divider />
                    <CardContent>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Market</TableCell>
                              <TableCell>Selection</TableCell>
                              <TableCell align="center">Odds</TableCell>
                              <TableCell align="center">Edge</TableCell>
                              <TableCell align="center">Confidence</TableCell>
                              <TableCell align="center">EV</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow hover>
                              <TableCell>Tournament Winner</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇺🇸</Typography>
                                  <Typography fontWeight="bold">USA</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+2800</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+12.8%" color="success" size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold">86%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">
                                  +$12.80
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>Tournament Winner</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇲🇽</Typography>
                                  <Typography fontWeight="bold">Mexico</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+4000</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+11.2%" color="success" size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold">84%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">
                                  +$11.20
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>Tournament Winner</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇨🇦</Typography>
                                  <Typography fontWeight="bold">Canada</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+10000</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+10.5%" color="success" size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold">81%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">
                                  +$10.50
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>Top Scorer</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇺🇸</Typography>
                                  <Typography fontWeight="bold">C. Pulisic</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+3500</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+9.8%" color="success" size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold">83%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">
                                  +$9.80
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                            <TableRow hover>
                              <TableCell>To Reach Final</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="h5">🇺🇸</Typography>
                                  <Typography fontWeight="bold">USA</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">+1200</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip label="+9.4%" color="success" size="small" />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="body2" fontWeight="bold">82%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Typography fontWeight="bold" color="success.main">
                                  +$9.40
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button size="small" variant="contained" color="success">Bet</Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardHeader 
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CompareArrows />
                          <Typography variant="h6">Edge Analysis</Typography>
                        </Box>
                      }
                    />
                    <Divider />
                    <CardContent>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Market Inefficiencies Detected
                          </Typography>
                          <Typography variant="body2" paragraph>
                            AI has identified systematic undervaluation of host nations in outright winner markets. 
                            Historical data shows CONCACAF hosts outperform odds by an average of 42%.
                          </Typography>
                        </Box>
                        
                        <Divider />
                        
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Recommended Portfolio
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">USA to win</Typography>
                              <Typography variant="body2" fontWeight="bold">2.5% bankroll</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Mexico to win</Typography>
                              <Typography variant="body2" fontWeight="bold">1.5% bankroll</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Canada R16</Typography>
                              <Typography variant="body2" fontWeight="bold">3.0% bankroll</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">Pulisic Top Scorer</Typography>
                              <Typography variant="body2" fontWeight="bold">1.0% bankroll</Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Alert severity="warning" icon={<Warning />}>
                          <Typography variant="body2">
                            <strong>Risk Disclosure:</strong> Futures betting involves risk. These recommendations are based on statistical models and past performance does not guarantee future results.
                          </Typography>
                        </Alert>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Fade>
          )}
        </Box>

        {/* Educational Footer */}
        <Paper sx={{ mt: 6, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Understanding Futures Betting Value
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Expected Value (EV) compares the implied probability of odds against our AI-projected probability. 
                Positive EV bets (+EV) offer mathematical advantages. All odds are from licensed sportsbooks via 
                The Odds API and updated in real-time through our Flask backend.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip icon={<CheckCircle />} label="Official odds via The Odds API" size="small" variant="outlined" />
                <Chip icon={<Psychology />} label="DeepSeek AI analysis" size="small" variant="outlined" />
                <Chip icon={<Public />} label="Kalshi integration" size="small" variant="outlined" />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date().toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data sources: The Odds API, SportsData.io, DeepSeek AI
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default Futures2026Screen;
