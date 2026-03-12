import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tab,
  Tabs,
  Chip,
  Paper,
  LinearProgress,
  CircularProgress,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Alert,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  SportsHockey as SportsHockeyIcon,
  People as PeopleIcon,
  EmojiEvents as EmojiEventsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

// API Configuration
const API_BASE_URL = 'https://python-api-fresh-production.up.railway.app';

// ========== UPDATED INTERFACES FOR FEBRUARY 2026 ==========
interface NHLGame {
  id: string;
  home_team: string;
  home_full: string;
  away_team: string;
  away_full: string;
  date: string;
  time: string;
  venue: string;
  tv: string;
  note: string;
  division: string;
  sport: 'NHL';
  season: '2025-26';
  game_type: 'Regular Season' | '4 Nations Face-Off';
  tournament?: boolean;
  
  odds: {
    moneyline: {
      home: number;
      away: number;
      home_decimal: number;
      away_decimal: number;
      home_implied_probability: number;
      away_implied_probability: number;
    };
    spread: {
      home: number;
      home_odds: number;
      away: number;
      away_odds: number;
    };
    total: {
      line: number;
      over: number;
      under: number;
      alternate_lines?: Array<{
        line: number;
        over_odds: number;
        under_odds: number;
      }>;
    };
    team_totals?: {
      home: Array<{ line: number; over_odds: number; under_odds: number }>;
      away: Array<{ line: number; over_odds: number; under_odds: number }>;
    };
  };
  
  player_props?: NHLPlayerProp[];
  fantasy_projections?: FantasyProjection[];
  parlay_recommendations?: NHLParlayRecommendation[];
  
  confidence_score: number;
  confidence_level: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  consensus_pick?: {
    team: string;
    percentage: number;
    confidence: string;
  };
  sharp_money?: number;
  
  team_stats: {
    home: TeamStats;
    away: TeamStats;
  };
  
  status: 'Scheduled' | 'Live' | 'Final' | 'Upcoming';
  trade_deadline_impact: boolean;
  playoff_implications: boolean;
}

interface NHLPlayerProp {
  player: string;
  team: string;
  position: string;
  jersey?: string;
  props: Array<{
    stat: string;
    line: number;
    over_odds: number;
    under_odds: number;
    season_avg?: number;
    last_10_avg?: number;
    confidence?: number;
  }>;
  analysis?: string;
  confidence?: number;
}

interface FantasyProjection {
  player: string;
  team: string;
  position: string;
  fantasy_points_projected: number;
  salary_dk: number;
  salary_fd: number;
  value_rating: number;
  recommendation: string;
}

interface NHLParlayRecommendation {
  name: string;
  legs: Array<{
    type: string;
    player?: string;
    team?: string;
    stat?: string;
    line?: number;
    bet: string;
    odds: number;
  }>;
  combined_odds: string;
  combined_decimal: number;
  confidence: number;
  analysis: string;
}

interface TeamStats {
  record: string;
  win_pct: number;
  gpg: number;
  gapg: number;
  pp_pct: number;
  pk_pct: number;
  faceoff_pct: number;
  corsi_pct: number;
  pdo: number;
  home_record: string;
  away_record: string;
  last_10: string;
  streak: string;
}

interface LeagueLeaders {
  scoring: Array<{ player: string; team: string; gp: number; goals: number; assists: number; points: number }>;
  goals: Array<{ player: string; team: string; goals: number; gp: number }>;
  assists: Array<{ player: string; team: string; assists: number; gp: number }>;
  goaltending: Array<{ player: string; team: string; wins: number; gaa: number; sv_pct: number; so: number }>;
}

interface TradeDeadline {
  date: string;
  days_remaining: number;
  rumors: Array<{
    player: string;
    team: string;
    rumor: string;
    likelihood: string;
    reported_by: string;
  }>;
  impact_players: string[];
}

// Team colors mapping
const NHLTeams: Record<string, { name: string; color: string }> = {
  BOS: { name: 'Bruins', color: '#FFB81C' },
  TOR: { name: 'Maple Leafs', color: '#003E7E' },
  TB: { name: 'Lightning', color: '#002868' },
  FLA: { name: 'Panthers', color: '#C8102E' },
  DET: { name: 'Red Wings', color: '#CE1126' },
  COL: { name: 'Avalanche', color: '#6F263D' },
  DAL: { name: 'Stars', color: '#006847' },
  EDM: { name: 'Oilers', color: '#041E42' },
  VGK: { name: 'Golden Knights', color: '#B4975A' },
  PIT: { name: 'Penguins', color: '#FCB514' },
  // Add more as needed
};

const getTeamColor = (teamCode: string): string => {
  return NHLTeams[teamCode]?.color || '#64748b';
};

// Team strength ratings (approximate, based on 2025-26 performance)
const teamStrength: Record<string, number> = {
  BOS: 85,
  TOR: 82,
  TB: 80,
  FLA: 78,
  DET: 70,
  COL: 88,
  DAL: 84,
  EDM: 86,
  VGK: 83,
  PIT: 75,
  NYR: 82,
  CAR: 84,
  NJD: 79,
  PHI: 68,
  WSH: 72,
  OTT: 65,
  BUF: 67,
  MTL: 62,
  CBJ: 60,
  NYI: 73,
  MIN: 76,
  WPG: 77,
  STL: 71,
  NSH: 69,
  CHI: 58,
  ARI: 55,
  SEA: 70,
  LAK: 74,
  ANA: 59,
  SJS: 54,
  VAN: 66,
  CGY: 64,
};

// ========== FULL MOCK DATA FOR FEBRUARY 2026 (FALLBACK) ==========
const mockTradeDeadline: TradeDeadline = {
  date: '2026-03-07',
  days_remaining: 22,
  rumors: [
    { player: 'Mikko Rantanen', team: 'COL', rumor: 'Linked to several contenders', likelihood: 'Medium', reported_by: 'TSN' },
    { player: 'John Gibson', team: 'ANA', rumor: 'Goalie market heating up', likelihood: 'High', reported_by: 'Sportsnet' }
  ],
  impact_players: ['Rantanen', 'Gibson', 'Hanifin']
};

const mockLeagueLeaders: LeagueLeaders = {
  scoring: [
    { player: 'Connor McDavid', team: 'EDM', gp: 58, goals: 38, assists: 62, points: 100 },
    { player: 'Nikita Kucherov', team: 'TB', gp: 57, goals: 32, assists: 55, points: 87 },
    { player: 'Nathan MacKinnon', team: 'COL', gp: 58, goals: 30, assists: 54, points: 84 },
    { player: 'David Pastrnak', team: 'BOS', gp: 58, goals: 42, assists: 38, points: 80 },
    { player: 'Auston Matthews', team: 'TOR', gp: 56, goals: 45, assists: 33, points: 78 }
  ],
  goals: [
    { player: 'Auston Matthews', team: 'TOR', goals: 45, gp: 56 },
    { player: 'David Pastrnak', team: 'BOS', goals: 42, gp: 58 },
    { player: 'Connor McDavid', team: 'EDM', goals: 38, gp: 58 },
    { player: 'Alex Ovechkin', team: 'WSH', goals: 35, gp: 57 },
    { player: 'Brady Tkachuk', team: 'OTT', goals: 33, gp: 58 }
  ],
  assists: [
    { player: 'Connor McDavid', team: 'EDM', assists: 62, gp: 58 },
    { player: 'Nikita Kucherov', team: 'TB', assists: 55, gp: 57 },
    { player: 'Nathan MacKinnon', team: 'COL', assists: 54, gp: 58 },
    { player: 'Leon Draisaitl', team: 'EDM', assists: 48, gp: 58 },
    { player: 'Erik Karlsson', team: 'PIT', assists: 45, gp: 56 }
  ],
  goaltending: [
    { player: 'Connor Hellebuyck', team: 'WPG', wins: 32, gaa: 2.21, sv_pct: 0.924, so: 4 },
    { player: 'Ilya Sorokin', team: 'NYI', wins: 28, gaa: 2.35, sv_pct: 0.918, so: 3 },
    { player: 'Jacob Markstrom', team: 'CGY', wins: 27, gaa: 2.45, sv_pct: 0.912, so: 2 },
    { player: 'Linus Ullmark', team: 'BOS', wins: 26, gaa: 2.28, sv_pct: 0.921, so: 3 },
    { player: 'Igor Shesterkin', team: 'NYR', wins: 29, gaa: 2.42, sv_pct: 0.916, so: 2 }
  ]
};

const mockStandings = {
  eastern: {
    atlantic: [
      { team: 'BOS', wins: 34, losses: 15, otl: 4, points: 72 },
      { team: 'TOR', wins: 32, losses: 17, otl: 3, points: 67 },
      { team: 'TB', wins: 30, losses: 19, otl: 4, points: 64 },
      { team: 'FLA', wins: 29, losses: 20, otl: 4, points: 62 },
      { team: 'DET', wins: 27, losses: 22, otl: 4, points: 58 }
    ],
    metropolitan: [
      { team: 'NYR', wins: 33, losses: 16, otl: 3, points: 69 },
      { team: 'CAR', wins: 32, losses: 17, otl: 3, points: 67 },
      { team: 'NJD', wins: 30, losses: 19, otl: 4, points: 64 },
      { team: 'PHI', wins: 28, losses: 21, otl: 4, points: 60 },
      { team: 'PIT', wins: 27, losses: 22, otl: 4, points: 58 }
    ]
  },
  western: {
    central: [
      { team: 'COL', wins: 35, losses: 14, otl: 3, points: 73 },
      { team: 'DAL', wins: 33, losses: 16, otl: 3, points: 69 },
      { team: 'WPG', wins: 31, losses: 18, otl: 4, points: 66 },
      { team: 'MIN', wins: 28, losses: 21, otl: 4, points: 60 }
    ],
    pacific: [
      { team: 'EDM', wins: 34, losses: 15, otl: 3, points: 71 },
      { team: 'LAK', wins: 31, losses: 18, otl: 4, points: 66 },
      { team: 'VGK', wins: 30, losses: 19, otl: 4, points: 64 },
      { team: 'SEA', wins: 28, losses: 21, otl: 4, points: 60 }
    ]
  }
};

// Base mock game with full details – used as fallback and for fields not yet provided by API
const mockGames: NHLGame[] = [
  {
    id: '1',
    home_team: 'BOS',
    home_full: 'Boston Bruins',
    away_team: 'TOR',
    away_full: 'Toronto Maple Leafs',
    date: '2026-02-13',
    time: '7:00 PM',
    venue: 'TD Garden',
    tv: 'ESPN+',
    note: 'Original Six rivalry',
    division: 'Atlantic',
    sport: 'NHL',
    season: '2025-26',
    game_type: 'Regular Season',
    tournament: false,
    odds: {
      moneyline: {
        home: -150,
        away: +130,
        home_decimal: 1.67,
        away_decimal: 2.30,
        home_implied_probability: 0.60,
        away_implied_probability: 0.43
      },
      spread: {
        home: -1.5,
        home_odds: +180,
        away: 1.5,
        away_odds: -220
      },
      total: {
        line: 6.5,
        over: -110,
        under: -110
      }
    },
    player_props: [
      {
        player: 'David Pastrnak',
        team: 'BOS',
        position: 'RW',
        jersey: '88',
        props: [
          { stat: 'Goals', line: 0.5, over_odds: +150, under_odds: -190, season_avg: 0.72, last_10_avg: 0.8, confidence: 85 },
          { stat: 'Points', line: 1.5, over_odds: +130, under_odds: -160, season_avg: 1.4, last_10_avg: 1.5 }
        ],
        analysis: 'Pastrnak has 8 points in last 5 games against Toronto.',
        confidence: 85
      }
    ],
    fantasy_projections: [
      { player: 'David Pastrnak', team: 'BOS', position: 'RW', fantasy_points_projected: 15.2, salary_dk: 8200, salary_fd: 8900, value_rating: 2.8, recommendation: 'Top value on DraftKings' }
    ],
    parlay_recommendations: [
      {
        name: 'Bruins ML + Over 5.5',
        legs: [
          { type: 'moneyline', team: 'BOS', bet: 'Moneyline', odds: -150 },
          { type: 'total', stat: 'Total', line: 5.5, bet: 'Over', odds: -120 }
        ],
        combined_odds: '+275',
        combined_decimal: 3.75,
        confidence: 75,
        analysis: 'Bruins dominate at home and both teams average 6+ goals in last 5 meetings.'
      }
    ],
    confidence_score: 85,
    confidence_level: 'High',
    team_stats: {
      home: {
        record: '34-15-4',
        win_pct: 0.679,
        gpg: 3.42,
        gapg: 2.81,
        pp_pct: 24.5,
        pk_pct: 82.1,
        faceoff_pct: 52.3,
        corsi_pct: 53.1,
        pdo: 101.2,
        home_record: '19-6-2',
        away_record: '15-9-2',
        last_10: '7-2-1',
        streak: 'W3'
      },
      away: {
        record: '32-17-4',
        win_pct: 0.642,
        gpg: 3.55,
        gapg: 2.98,
        pp_pct: 26.2,
        pk_pct: 80.5,
        faceoff_pct: 51.8,
        corsi_pct: 52.4,
        pdo: 100.8,
        home_record: '18-7-2',
        away_record: '14-10-2',
        last_10: '6-3-1',
        streak: 'L1'
      }
    },
    status: 'Scheduled',
    trade_deadline_impact: false,
    playoff_implications: true
  },
  {
    id: '2',
    home_team: 'COL',
    home_full: 'Colorado Avalanche',
    away_team: 'DAL',
    away_full: 'Dallas Stars',
    date: '2026-02-13',
    time: '9:00 PM',
    venue: 'Ball Arena',
    tv: 'TNT',
    note: 'Western Conference showdown',
    division: 'Central',
    sport: 'NHL',
    season: '2025-26',
    game_type: 'Regular Season',
    tournament: false,
    odds: {
      moneyline: {
        home: -140,
        away: +120,
        home_decimal: 1.71,
        away_decimal: 2.20,
        home_implied_probability: 0.58,
        away_implied_probability: 0.45
      },
      spread: {
        home: -1.5,
        home_odds: +200,
        away: 1.5,
        away_odds: -240
      },
      total: {
        line: 6.0,
        over: -115,
        under: -105
      }
    },
    player_props: [],
    fantasy_projections: [],
    parlay_recommendations: [],
    confidence_score: 75,
    confidence_level: 'Medium',
    team_stats: {
      home: {
        record: '35-14-3',
        win_pct: 0.698,
        gpg: 3.72,
        gapg: 2.65,
        pp_pct: 27.8,
        pk_pct: 83.5,
        faceoff_pct: 51.2,
        corsi_pct: 55.3,
        pdo: 102.1,
        home_record: '20-5-2',
        away_record: '15-9-1',
        last_10: '8-1-1',
        streak: 'W4'
      },
      away: {
        record: '33-16-4',
        win_pct: 0.660,
        gpg: 3.41,
        gapg: 2.82,
        pp_pct: 24.9,
        pk_pct: 81.2,
        faceoff_pct: 49.8,
        corsi_pct: 51.7,
        pdo: 100.2,
        home_record: '18-7-2',
        away_record: '15-9-2',
        last_10: '6-3-1',
        streak: 'W1'
      }
    },
    status: 'Scheduled',
    trade_deadline_impact: true,
    playoff_implications: true
  }
];

// Mock players for original players tab
const mockPlayers = [
  { id: 1, name: 'Connor McDavid', team: 'EDM', goals: 38, assists: 62, points: 100, position: 'C', teamColor: '#041E42' },
  { id: 2, name: 'Nathan MacKinnon', team: 'COL', goals: 30, assists: 54, points: 84, position: 'C', teamColor: '#6F263D' },
  { id: 3, name: 'Nikita Kucherov', team: 'TB', goals: 32, assists: 55, points: 87, position: 'RW', teamColor: '#002868' },
  { id: 4, name: 'David Pastrnak', team: 'BOS', goals: 42, assists: 38, points: 80, position: 'RW', teamColor: '#FFB81C' },
  { id: 5, name: 'Auston Matthews', team: 'TOR', goals: 45, assists: 33, points: 78, position: 'C', teamColor: '#003E7E' },
  { id: 6, name: 'Leon Draisaitl', team: 'EDM', goals: 35, assists: 48, points: 83, position: 'C', teamColor: '#041E42' },
];

// ===== HELPER: Generate default odds and stats for any game =====
const generateDefaultGameDetails = (game: NHLGame): Partial<NHLGame> => {
  // Default odds: home slight favorite, typical spread, total around 6
  const defaultOdds = {
    moneyline: {
      home: -120,
      away: +100,
      home_decimal: 1.83,
      away_decimal: 2.00,
      home_implied_probability: 0.545,
      away_implied_probability: 0.5
    },
    spread: {
      home: -1.5,
      home_odds: +150,
      away: 1.5,
      away_odds: -180
    },
    total: {
      line: 6.0,
      over: -110,
      under: -110
    }
  };

  // Default team stats: .500 records, league average percentages
  const defaultTeamStats = {
    record: '20-20-5',
    win_pct: 0.500,
    gpg: 3.2,
    gapg: 3.2,
    pp_pct: 20.0,
    pk_pct: 80.0,
    faceoff_pct: 50.0,
    corsi_pct: 50.0,
    pdo: 100.0,
    home_record: '12-8-2',
    away_record: '8-12-3',
    last_10: '5-5-0',
    streak: 'W1'
  };

  // Compute confidence score based on team strengths
  const homeStrength = teamStrength[game.home_team] || 50;
  const awayStrength = teamStrength[game.away_team] || 50;
  const strengthDiff = Math.abs(homeStrength - awayStrength);
  // Map diff (0 to ~40) to confidence (90 down to 40)
  let confidence = Math.max(40, Math.min(90, 90 - strengthDiff));
  // Add small randomness (±5)
  confidence += Math.floor(Math.random() * 10) - 5;
  confidence = Math.max(40, Math.min(90, confidence));

  // Determine confidence level based on score
  let confidenceLevel: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low' = 'Medium';
  if (confidence >= 80) confidenceLevel = 'Very High';
  else if (confidence >= 70) confidenceLevel = 'High';
  else if (confidence >= 50) confidenceLevel = 'Medium';
  else if (confidence >= 40) confidenceLevel = 'Low';
  else confidenceLevel = 'Very Low';

  return {
    odds: defaultOdds,
    team_stats: {
      home: defaultTeamStats,
      away: defaultTeamStats
    },
    player_props: [],
    fantasy_projections: [],
    parlay_recommendations: [],
    confidence_score: Math.round(confidence),
    confidence_level: confidenceLevel
  };
};

// ===== NEW: Enrich a basic game with details (API, mock, or default) =====
const enrichGameWithDetails = async (basicGame: NHLGame): Promise<NHLGame> => {
  try {
    // Try to fetch real details
    const response = await fetch(`${API_BASE_URL}/api/nhl/game/${basicGame.id}/details`);
    const data = await response.json();
    if (data.success && data.game) {
      return {
        ...basicGame,
        team_stats: data.game.team_stats,
        odds: data.game.odds,
        player_props: data.game.player_props,
        fantasy_projections: data.game.fantasy_projections,
        parlay_recommendations: data.game.parlay_recommendations,
        confidence_score: data.game.confidence_score,
        confidence_level: data.game.confidence_level,
      };
    }
  } catch (error) {
    console.error('Error fetching game details:', error);
  }

  // Try mock data by ID
  const mockGame = mockGames.find(g => g.id === basicGame.id);
  if (mockGame) {
    return {
      ...basicGame,
      team_stats: mockGame.team_stats,
      odds: mockGame.odds,
      player_props: mockGame.player_props,
      fantasy_projections: mockGame.fantasy_projections,
      parlay_recommendations: mockGame.parlay_recommendations,
      confidence_score: mockGame.confidence_score,
      confidence_level: mockGame.confidence_level,
    };
  }

  // Fallback to default data
  const defaultDetails = generateDefaultGameDetails(basicGame);
  return {
    ...basicGame,
    ...defaultDetails,
  };
};

const NHLTrendsScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // State from original
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: Standings, 1: Games, 2: Players
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // NEW STATE from enhanced NHL screen
  const [games, setGames] = useState<NHLGame[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGame, setSelectedGame] = useState<NHLGame | null>(null);
  const [viewMode, setViewMode] = useState<'games' | 'props' | 'parlays' | 'fantasy' | 'standings'>('games');
  const [leagueLeaders, setLeagueLeaders] = useState<LeagueLeaders | null>(null);
  const [standings, setStandings] = useState<any>(null);
  const [tradeDeadline, setTradeDeadline] = useState<TradeDeadline | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFourNations, setShowFourNations] = useState(true);
  const [players, setPlayers] = useState<any[]>([]); // real players for tab 2

  // timestamp ref for back button guard
  const lastSelectedTime = useRef(0);

  // Add a ref to track if the component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      console.log('🔴 NHLTrendsScreen unmounting');
    };
  }, []);

  // Monitor selectedGame changes
  useEffect(() => {
    console.log('selectedGame changed:', selectedGame?.id);
  }, [selectedGame]);

  // Monitor viewMode changes
  useEffect(() => {
    console.log('viewMode changed:', viewMode);
  }, [viewMode]);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nhl_favorite_games');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = (gameId: string) => {
    const newFavorites = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    setFavorites(newFavorites);
    localStorage.setItem('nhl_favorite_games', JSON.stringify(newFavorites));
  };

  // Date navigation
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Transform API standings to the format expected by the screen
  const transformStandings = (apiStandings: any[]) => {
    const eastern = { atlantic: [] as any[], metropolitan: [] as any[] };
    const western = { central: [] as any[], pacific: [] as any[] };

    apiStandings.forEach((team) => {
      const entry = {
        team: team.abbreviation,
        wins: team.wins,
        losses: team.losses,
        otl: team.ot_losses,
        points: team.points
      };
      if (team.conference === 'Eastern') {
        if (team.division === 'Atlantic') eastern.atlantic.push(entry);
        else if (team.division === 'Metropolitan') eastern.metropolitan.push(entry);
      } else if (team.conference === 'Western') {
        if (team.division === 'Central') western.central.push(entry);
        else if (team.division === 'Pacific') western.pacific.push(entry);
      }
    });

    // Sort by points descending
    eastern.atlantic.sort((a, b) => b.points - a.points);
    eastern.metropolitan.sort((a, b) => b.points - a.points);
    western.central.sort((a, b) => b.points - a.points);
    western.pacific.sort((a, b) => b.points - a.points);

    return { eastern, western };
  };

  // Fetch NHL data (games and standings) from real endpoints
  const fetchNHLGames = async (date: string, showTournament: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch games
      const gamesUrl = `${API_BASE_URL}/api/nhl/games?date=${date}`;
      const gamesRes = await fetch(gamesUrl);
      const gamesData = await gamesRes.json();

      let basicGames: NHLGame[] = [];

      if (gamesData.games && Array.isArray(gamesData.games)) {
        // Helper to derive abbreviation from full name if missing
        const deriveAbbrev = (fullName: string) =>
          fullName ? fullName.split(' ').map(w => w[0]).join('').toUpperCase() : '???';

        const emptyStats = {
          record: '', win_pct: 0, gpg: 0, gapg: 0, pp_pct: 0, pk_pct: 0,
          faceoff_pct: 0, corsi_pct: 0, pdo: 0, home_record: '', away_record: '',
          last_10: '', streak: ''
        };

        basicGames = gamesData.games.map((g: any) => {
          const homeAbbrev = g.home_abbrev || deriveAbbrev(g.home_team);
          const awayAbbrev = g.away_abbrev || deriveAbbrev(g.away_team);
          const status = g.status
            ? g.status.charAt(0).toUpperCase() + g.status.slice(1)
            : 'Scheduled';

          return {
            id: g.id,
            home_team: homeAbbrev,
            home_full: g.home_team || homeAbbrev,
            away_team: awayAbbrev,
            away_full: g.away_team || awayAbbrev,
            date: g.date,
            time: g.time || '7:00 PM',
            venue: g.venue || 'NHL Arena',
            tv: g.tv || 'NHL Network',
            note: '',
            division: '',
            sport: 'NHL' as const,
            season: '2025-26' as const,
            game_type: 'Regular Season' as const,
            tournament: false,
            odds: {
              moneyline: { home: 0, away: 0, home_decimal: 0, away_decimal: 0, home_implied_probability: 0, away_implied_probability: 0 },
              spread: { home: 0, home_odds: 0, away: 0, away_odds: 0 },
              total: { line: 0, over: 0, under: 0 }
            },
            player_props: [],
            fantasy_projections: [],
            parlay_recommendations: [],
            confidence_score: 0,
            confidence_level: 'Medium' as const,
            team_stats: { home: emptyStats, away: emptyStats },
            status: status as 'Scheduled' | 'Live' | 'Final' | 'Upcoming',
            trade_deadline_impact: false,
            playoff_implications: false
          };
        });
      } else {
        throw new Error('Invalid games response');
      }

      // Enrich each game with details (odds, team stats, etc.)
      const enrichedGames = await Promise.all(basicGames.map(enrichGameWithDetails));

      let filteredGames = enrichedGames;
      if (!showTournament) {
        filteredGames = filteredGames.filter((game: NHLGame) => !game.tournament);
      }
      setGames(filteredGames);

      // Fetch standings
      const standingsUrl = `${API_BASE_URL}/api/nhl/standings`;
      const standingsRes = await fetch(standingsUrl);
      const standingsData = await standingsRes.json();

      if (standingsData.success && standingsData.standings) {
        const transformed = transformStandings(standingsData.standings);
        setStandings(transformed);
      } else {
        setStandings(mockStandings);
      }

      // For now, keep league leaders and trade deadline as mock (could be fetched later)
      setLeagueLeaders(mockLeagueLeaders);
      setTradeDeadline(mockTradeDeadline);

      setSuccessMessage('NHL data updated');
    } catch (err) {
      console.error('Error fetching NHL data:', err);
      setError('Failed to load real data. Using mock data.');
      setGames(mockGames);
      setStandings(mockStandings);
      setLeagueLeaders(mockLeagueLeaders);
      setTradeDeadline(mockTradeDeadline);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and when date/showFourNations changes
  useEffect(() => {
    fetchNHLGames(selectedDate, showFourNations);
  }, [selectedDate, showFourNations]);

  // Fetch real players when Players tab is active
  useEffect(() => {
    if (activeTab === 2) {
      const fetchPlayers = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/players?sport=nhl&realtime=true&limit=100`);
          const data = await res.json();
          if (data.success && data.data?.players) {
            const transformed = data.data.players.map((p: any, idx: number) => ({
              id: idx + 1,
              name: p.name,
              team: p.team,
              goals: p.goals || 0,
              assists: p.assists || 0,
              points: (p.goals || 0) + (p.assists || 0),
              position: p.position || 'N/A',
              teamColor: getTeamColor(p.team)
            }));
            setPlayers(transformed);
          } else {
            setPlayers(mockPlayers);
          }
        } catch {
          setPlayers(mockPlayers);
        }
      };
      fetchPlayers();
    }
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNHLGames(selectedDate, showFourNations);
  };

  // Search handlers (preserved from original)
  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      const query = searchInput.trim();
      setSearchQuery(query);

      if (!searchHistory.includes(query)) {
        setSearchHistory([query, ...searchHistory.slice(0, 4)]);
      }

      // Perform search - you can expand this later
      // For now, just set query
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // ========== MEMOIZED HANDLERS FOR BUTTONS ==========
  const setSelectedGameCallback = useCallback((game: NHLGame | null) => {
    if (!isMounted.current) return;
    console.log('setSelectedGame', game?.id);
    if (game === null) {
      console.trace('setSelectedGame to undefined');
      setSelectedGame(null);
    } else {
      // Record the selection time (for back‑button guard)
      lastSelectedTime.current = Date.now();
      setSelectedGame(game);
    }
  }, []);

  const setViewModeCallback = useCallback((mode: typeof viewMode) => {
    if (!isMounted.current) return;
    console.log('setViewMode', mode);
    setViewMode(mode);
  }, []);

  // Updated handlers with event stopping to prevent navigation
  const handleDetailsClick = useCallback((e: React.MouseEvent, game: NHLGame) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Details clicked', game.id);
    setSelectedGameCallback(game);
    setViewModeCallback('games');
  }, [setSelectedGameCallback, setViewModeCallback]);

  const handleParlayClick = useCallback((e: React.MouseEvent, game: NHLGame) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Parlay clicked', game.id);
    setSelectedGameCallback(game);
    setViewModeCallback('parlays');
  }, [setSelectedGameCallback, setViewModeCallback]);

  const handleFantasyClick = useCallback((e: React.MouseEvent, game: NHLGame) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Fantasy clicked', game.id);
    setSelectedGameCallback(game);
    setViewModeCallback('fantasy');
  }, [setSelectedGameCallback, setViewModeCallback]);

  // ========== RENDER COMPONENTS ==========

  // Date Navigation Bar
  const renderDateNavigation = () => (
    <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <IconButton onClick={() => changeDate(-1)}>
        <ChevronLeftIcon />
      </IconButton>
      <Box textAlign="center">
        <Typography variant="h6">
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : ''}
        </Typography>
      </Box>
      <IconButton onClick={() => changeDate(1)}>
        <ChevronRightIcon />
      </IconButton>
    </Paper>
  );

  // 4 Nations Toggle
  const renderFourNationsToggle = () => (
    <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box display="flex" alignItems="center" gap={1}>
        <EmojiEventsIcon color="primary" />
        <Typography variant="body1" fontWeight="medium">🏆 4 Nations Face-Off</Typography>
      </Box>
      <Button
        variant={showFourNations ? 'contained' : 'outlined'}
        size="small"
        onClick={() => setShowFourNations(!showFourNations)}
        color={showFourNations ? 'primary' : 'inherit'}
      >
        {showFourNations ? 'Showing' : 'Hidden'}
      </Button>
    </Paper>
  );

  // Trade Deadline Banner
  const renderTradeDeadlineBanner = () => {
    if (!tradeDeadline || tradeDeadline.days_remaining > 30) return null;
    return (
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha(theme.palette.warning.main, 0.1),
          borderLeft: `4px solid ${theme.palette.warning.main}`,
          cursor: 'pointer'
        }}
        onClick={() => {
          alert(`Trade Deadline: ${tradeDeadline.days_remaining} days remaining\nImpact players: ${tradeDeadline.impact_players.join(', ')}`);
        }}
      >
        <Typography variant="body1" fontWeight="bold" color="warning.main">
          ⏰ Trade Deadline: {tradeDeadline.days_remaining} days remaining
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Impact players: {tradeDeadline.impact_players.join(', ')}
        </Typography>
      </Paper>
    );
  };

  // View Mode Selector
  const renderViewModeSelector = () => (
    <Paper sx={{ p: 1, mb: 3, display: 'flex', gap: 1, overflowX: 'auto' }}>
      {(['games', 'props', 'parlays', 'fantasy', 'standings'] as const).map((mode) => (
        <Chip
          key={mode}
          label={mode.charAt(0).toUpperCase() + mode.slice(1)}
          onClick={() => setViewModeCallback(mode)}
          color={viewMode === mode ? 'primary' : 'default'}
          variant={viewMode === mode ? 'filled' : 'outlined'}
          icon={
            mode === 'games' ? <SportsHockeyIcon /> :
            mode === 'props' ? <PeopleIcon /> :
            mode === 'parlays' ? <TrendingUpIcon /> :
            mode === 'fantasy' ? <EmojiEventsIcon /> :
            <FilterListIcon />
          }
        />
      ))}
    </Paper>
  );

  // Enhanced Game Card with memoized handlers
  const renderGameCard = (game: NHLGame) => (
    <Card
      key={game.id}
      sx={{
        mb: 3,
        position: 'relative',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
      }}
    >
      {game.tournament && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: 16,
            bgcolor: 'secondary.main',
            color: 'white',
            px: 2,
            py: 0.5,
            borderRadius: '16px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 1
          }}
        >
          🏆 4 NATIONS
        </Box>
      )}
      <CardContent>
        {/* Header with TV and favorite */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="caption" color="primary.main" fontWeight="bold">
              {game.tv} • {game.time} ET
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {game.venue}
            </Typography>
          </Box>
          <IconButton onClick={() => toggleFavorite(game.id)} size="small">
            {favorites.includes(game.id) ? <StarIcon color="warning" /> : <StarBorderIcon />}
          </IconButton>
        </Box>

        {/* Teams */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box textAlign="center" flex={1}>
            <Typography variant="h4" fontWeight="bold">
              {game.home_team}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {game.team_stats?.home?.record || 'N/A'}
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary" px={2}>VS</Typography>
          <Box textAlign="center" flex={1}>
            <Typography variant="h4" fontWeight="bold">
              {game.away_team}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {game.team_stats?.away?.record || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Odds Grid with fallbacks */}
        <Grid container spacing={2} sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, mb: 2 }}>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">Moneyline</Typography>
            <Typography variant="body2" fontWeight="bold">
              {game.home_team} {game.odds?.moneyline?.home > 0 ? '+' : ''}{game.odds?.moneyline?.home ?? 'N/A'}
            </Typography>
            <Typography variant="caption">
              {game.away_team} {game.odds?.moneyline?.away > 0 ? '+' : ''}{game.odds?.moneyline?.away ?? 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">Spread</Typography>
            <Typography variant="body2" fontWeight="bold">
              {game.home_team} {game.odds?.spread?.home > 0 ? '+' : ''}{game.odds?.spread?.home ?? 'N/A'} ({game.odds?.spread?.home_odds > 0 ? '+' : ''}{game.odds?.spread?.home_odds ?? 'N/A'})
            </Typography>
            <Typography variant="caption">
              {game.away_team} +{game.odds?.spread?.away ?? 'N/A'} ({game.odds?.spread?.away_odds > 0 ? '+' : ''}{game.odds?.spread?.away_odds ?? 'N/A'})
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="body2" fontWeight="bold">O/U {game.odds?.total?.line ?? 'N/A'}</Typography>
            <Typography variant="caption">
              O {game.odds?.total?.over > 0 ? '+' : ''}{game.odds?.total?.over ?? 'N/A'} • U {game.odds?.total?.under > 0 ? '+' : ''}{game.odds?.total?.under ?? 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        {/* Game Notes & Confidence */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontStyle="italic">
              {game.note || 'No additional notes'}
            </Typography>
            {game.playoff_implications && (
              <Chip
                label="🏆 Playoff Implications"
                size="small"
                color="success"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Confidence</Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {game.confidence_score ?? 0}% <Typography variant="caption" component="span">{game.confidence_level ?? 'N/A'}</Typography>
            </Typography>
          </Box>
        </Box>

        {/* Quick Action Buttons – using memoized handlers with event */}
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-around">
          <Button size="small" startIcon={<InfoIcon />} onClick={(e) => handleDetailsClick(e, game)}>
            Details
          </Button>
          <Button size="small" startIcon={<TrendingUpIcon />} onClick={(e) => handleParlayClick(e, game)}>
            Parlay
          </Button>
          <Button size="small" startIcon={<EmojiEventsIcon />} onClick={(e) => handleFantasyClick(e, game)}>
            Fantasy
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Player Props View
  const renderPlayerProps = (game: NHLGame) => (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">🎯 Player Props</Typography>
      {game.player_props && game.player_props.length > 0 ? (
        game.player_props.map((propGroup, idx) => (
          <Card key={idx} sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight="bold">{propGroup.player}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {propGroup.team} • #{propGroup.jersey} • {propGroup.position}
                  </Typography>
                </Box>
                {propGroup.confidence && (
                  <Chip label={`${propGroup.confidence}% Conf`} color="primary" size="small" />
                )}
              </Box>
              {propGroup.props.map((prop, i) => (
                <Box key={i} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom={i < propGroup.props.length-1 ? 1 : 0} borderColor="divider">
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {prop.stat} O/U {prop.line}
                    </Typography>
                    <Box display="flex" gap={2}>
                      {prop.season_avg && <Typography variant="caption">Season: {prop.season_avg.toFixed(1)}</Typography>}
                      {prop.last_10_avg && <Typography variant="caption" color="success.main">Last 10: {prop.last_10_avg.toFixed(1)}</Typography>}
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" fontWeight="bold">O {prop.over_odds > 0 ? '+' : ''}{prop.over_odds}</Typography>
                    <Typography variant="caption">U {prop.under_odds > 0 ? '+' : ''}{prop.under_odds}</Typography>
                  </Box>
                </Box>
              ))}
              {propGroup.analysis && (
                <Alert severity="info" sx={{ mt: 2 }}>{propGroup.analysis}</Alert>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <Alert severity="info">No player props available for this game.</Alert>
      )}
    </Box>
  );

  // Parlay Recommendations View
  const renderParlayRecommendations = (game: NHLGame) => (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">🎲 Parlay Recommendations</Typography>
      {game.parlay_recommendations && game.parlay_recommendations.length > 0 ? (
        game.parlay_recommendations.map((parlay, idx) => (
          <Card key={idx} sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">{parlay.name}</Typography>
                <Chip label={parlay.combined_odds} color="success" />
              </Box>
              {parlay.legs.map((leg, i) => (
                <Box key={i} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{leg.player || leg.team} • {leg.bet} {leg.stat} {leg.line && ` ${leg.line}+`}</Typography>
                  <Typography variant="body2" fontWeight="medium">{leg.odds > 0 ? '+' : ''}{leg.odds}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                {parlay.analysis}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Typography variant="caption">Confidence: {parlay.confidence}%</Typography>
                <Button variant="contained" size="small">Build This Parlay</Button>
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        <Alert severity="info">No parlay recommendations available for this game.</Alert>
      )}
    </Box>
  );

  // Fantasy Projections View
  const renderFantasyProjections = (game: NHLGame) => (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">📊 Fantasy Projections</Typography>
      {game.fantasy_projections && game.fantasy_projections.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell align="right">DK Pts</TableCell>
                <TableCell align="right">Salary</TableCell>
                <TableCell align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {game.fantasy_projections.map((proj, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">{proj.player}</Typography>
                    <Typography variant="caption">{proj.team} • {proj.position}</Typography>
                  </TableCell>
                  <TableCell align="right">{proj.fantasy_points_projected}</TableCell>
                  <TableCell align="right">${proj.salary_dk.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={proj.value_rating.toFixed(2)}
                      size="small"
                      color={proj.value_rating > 2.5 ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">No fantasy projections available for this game.</Alert>
      )}
    </Box>
  );

  // League Leaders Section
  const renderLeagueLeaders = () => {
    if (!leagueLeaders) return null;
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>📈 League Leaders - February 2026</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">Scoring Leaders</Typography>
              {leagueLeaders.scoring.slice(0, 5).map((p, i) => (
                <Box key={p.player} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{i+1}. {p.player} ({p.team})</Typography>
                  <Typography variant="body2" fontWeight="bold">{p.points}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="error.main">Goal Leaders</Typography>
              {leagueLeaders.goals.slice(0, 5).map((p, i) => (
                <Box key={p.player} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{i+1}. {p.player} ({p.team})</Typography>
                  <Typography variant="body2" fontWeight="bold">{p.goals}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="success.main">Goaltending Leaders</Typography>
              {leagueLeaders.goaltending.slice(0, 5).map((p, i) => (
                <Box key={p.player} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{i+1}. {p.player} ({p.team})</Typography>
                  <Typography variant="body2" fontWeight="bold">{p.wins}W • {p.sv_pct.toFixed(3)}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Enhanced Standings View
  const renderEnhancedStandings = () => {
    if (!standings) return null;
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>🏒 NHL Standings - February 2026</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">Atlantic Division</Typography>
              {standings.eastern?.atlantic?.map((team: any, i: number) => (
                <Box key={team.team} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{i+1}. {team.team}</Typography>
                  <Typography variant="body2" fontWeight="bold">{team.wins}-{team.losses}-{team.otl} ({team.points})</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">Metropolitan Division</Typography>
              {standings.eastern?.metropolitan?.map((team: any, i: number) => (
                <Box key={team.team} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{i+1}. {team.team}</Typography>
                  <Typography variant="body2" fontWeight="bold">{team.wins}-{team.losses}-{team.otl} ({team.points})</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Original standings table (from file 2) – uses real data if available
  const renderStandingsTable = () => {
    const data = standings || mockStandings;
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight="bold">
              NHL Standings
            </Typography>
            <Chip 
              label={games.some(g => g.venue !== 'NHL Arena') ? "Real Data" : "Mock Data"} 
              color={games.some(g => g.venue !== 'NHL Arena') ? "success" : "warning"} 
              size="small" 
              icon={games.some(g => g.venue !== 'NHL Arena') ? <InfoIcon /> : <WarningIcon />}
            />
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell><Typography variant="subtitle2" fontWeight="bold">#</Typography></TableCell>
                  <TableCell><Typography variant="subtitle2" fontWeight="bold">Team</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">W</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">L</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">PTS</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">Conf</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.eastern?.atlantic?.map((team: any, index: number) => (
                  <TableRow key={team.team}>
                    <TableCell><Typography fontWeight="bold">{index + 1}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: getTeamColor(team.team) }} />
                        <Typography fontWeight="medium">{team.team}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center"><Typography color="success.main" fontWeight="bold">{team.wins}</Typography></TableCell>
                    <TableCell align="center"><Typography color="error.main" fontWeight="bold">{team.losses}</Typography></TableCell>
                    <TableCell align="center"><Typography color="primary.main" fontWeight="bold">{team.points}</Typography></TableCell>
                    <TableCell align="center"><Chip label="Eastern" size="small" sx={{ backgroundColor: alpha('#1976d2', 0.1), color: 'primary.main', fontWeight: 'medium' }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Original games list (for activeTab=1) – uses real games if available
  const renderGamesList = () => {
    const data = games.length > 0 ? games : mockGames;
    if (data.length === 0) {
      return <Alert severity="info">No games available.</Alert>;
    }
    return (
      <Grid container spacing={2}>
        {data.map((game) => (
          <Grid item xs={12} key={game.id}>
            <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6, cursor: 'pointer' } }} onClick={(e) => handleDetailsClick(e, game)}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(game.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Typography>
                  <Badge color={game.status === 'Final' ? 'error' : game.status === 'Live' ? 'secondary' : 'primary'} badgeContent={game.status} sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" flex={1}>
                    <Box sx={{ width: 8, height: 32, backgroundColor: getTeamColor(game.away_team), borderRadius: '4px 0 0 4px', mr: 1 }} />
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold">{game.away_team}</Typography>
                      <Typography variant="caption" color="text.secondary">Away</Typography>
                    </Box>
                  </Box>
                  <Box textAlign="center" mx={2}>
                    <Typography variant="caption" color="text.secondary">@</Typography>
                    <Typography variant="h5" color="error.main" fontWeight="bold">-</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" flex={1} flexDirection="row-reverse">
                    <Box sx={{ width: 8, height: 32, backgroundColor: getTeamColor(game.home_team), borderRadius: '0 4px 4px 0', ml: 1 }} />
                    <Box textAlign="right" flex={1}>
                      <Typography variant="h6" fontWeight="bold">{game.home_team}</Typography>
                      <Typography variant="caption" color="text.secondary">Home</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Original players list (for activeTab=2) – uses real players if fetched
  const renderPlayersList = () => {
    const data = players.length > 0 ? players : mockPlayers;
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">Top Scorers - 2025-2026 Season</Typography>
            <Chip label={players.length > 0 ? "Real Data" : "Mock Data"} color={players.length > 0 ? "success" : "warning"} size="small" icon={players.length > 0 ? <InfoIcon /> : <WarningIcon />} />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="center">G</TableCell>
                  <TableCell align="center">A</TableCell>
                  <TableCell align="center">PTS</TableCell>
                  <TableCell align="center">Position</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((player, index) => (
                  <TableRow key={player.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/player-stats', { state: { player: player.name, sport: 'nhl' } })}>
                    <TableCell><Typography fontWeight="bold" color="text.secondary">{index + 1}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: player.teamColor, width: 36, height: 36 }}>{player.name.charAt(0)}</Avatar>
                        <Box>
                          <Typography fontWeight="bold">{player.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{player.team}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center"><Typography fontWeight="bold">{player.goals}</Typography></TableCell>
                    <TableCell align="center"><Typography fontWeight="bold">{player.assists}</Typography></TableCell>
                    <TableCell align="center"><Typography fontWeight="bold" color="error.main">{player.points}</Typography></TableCell>
                    <TableCell align="center"><Chip label={player.position} size="small" variant="outlined" sx={{ fontWeight: 'medium' }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  // Detailed Game View – now includes a summary for 'games' mode
  const renderDetailedGameView = () => {
    if (!selectedGame) return null;

    const renderGameSummary = () => (
      <Box>
        <Typography variant="h5" gutterBottom>Game Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="h6">{selectedGame.home_full}</Typography>
            <Typography>Record: {selectedGame.team_stats?.home?.record || 'N/A'}</Typography>
            <Typography>Goals/Game: {selectedGame.team_stats?.home?.gpg || 'N/A'}</Typography>
            <Typography>PP%: {selectedGame.team_stats?.home?.pp_pct || 'N/A'}</Typography>
            <Typography>PK%: {selectedGame.team_stats?.home?.pk_pct || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">{selectedGame.away_full}</Typography>
            <Typography>Record: {selectedGame.team_stats?.away?.record || 'N/A'}</Typography>
            <Typography>Goals/Game: {selectedGame.team_stats?.away?.gpg || 'N/A'}</Typography>
            <Typography>PP%: {selectedGame.team_stats?.away?.pp_pct || 'N/A'}</Typography>
            <Typography>PK%: {selectedGame.team_stats?.away?.pk_pct || 'N/A'}</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1">Odds</Typography>
        <Box display="flex" justifyContent="space-around" sx={{ mt: 1 }}>
          <Box>ML: {selectedGame.home_team} {selectedGame.odds?.moneyline?.home}</Box>
          <Box>Spread: {selectedGame.home_team} {selectedGame.odds?.spread?.home}</Box>
          <Box>Total: {selectedGame.odds?.total?.line}</Box>
        </Box>
      </Box>
    );

    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton 
            onClick={() => {
              const timeSinceLastSelect = Date.now() - lastSelectedTime.current;
              if (timeSinceLastSelect < 300) {
                console.log(`Ignoring back button click (${timeSinceLastSelect}ms since last selection)`);
                return;
              }
              setSelectedGameCallback(null);
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight="bold" sx={{ ml: 1 }}>
            {selectedGame.home_team} vs {selectedGame.away_team}
          </Typography>
        </Box>
        <Paper sx={{ p: 3 }}>
          {viewMode === 'games' && renderGameSummary()}
          {viewMode === 'props' && renderPlayerProps(selectedGame)}
          {viewMode === 'parlays' && renderParlayRecommendations(selectedGame)}
          {viewMode === 'fantasy' && renderFantasyProjections(selectedGame)}
        </Paper>
      </Box>
    );
  };

  // ========== MAIN RENDER ==========
  if (selectedGame) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {renderDetailedGameView()}
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>NHL Center • February 2026</Typography>
            <Typography variant="h6" color="text.secondary">Season 2025-26 • 4 Nations Face-Off</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {loading && <CircularProgress size={24} />}
            <IconButton color="primary" size="large"><TrendingUpIcon /></IconButton>
          </Box>
        </Box>
      </Box>

      {/* Search Bar (original) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search teams, players, games..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchInput('')}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearchSubmit} sx={{ minWidth: 120 }}>
            Search
          </Button>
        </Box>
        {searchHistory.length > 0 && !searchQuery && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>Recent Searches:</Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {searchHistory.map((term, index) => (
                <Chip key={index} label={term} size="small" onClick={() => { setSearchInput(term); handleSearchSubmit(); }} onDelete={() => setSearchHistory(searchHistory.filter((_, i) => i !== index))} />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Team Filter (original) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Filter by Team</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {Object.entries(NHLTeams).map(([id, team]) => (
            <Chip
              key={id}
              label={team.name}
              onClick={() => setSelectedTeam(id)}
              color={selectedTeam === id ? 'primary' : 'default'}
              variant={selectedTeam === id ? 'filled' : 'outlined'}
              sx={{ borderColor: team.color, ...(selectedTeam === id && { bgcolor: alpha(team.color, 0.1), color: team.color }) }}
            />
          ))}
        </Box>
      </Paper>

      {/* NEW: Date Navigation */}
      {renderDateNavigation()}

      {/* NEW: 4 Nations Toggle */}
      {renderFourNationsToggle()}

      {/* NEW: Trade Deadline Banner */}
      {renderTradeDeadlineBanner()}

      {/* NEW: View Mode Selector */}
      {renderViewModeSelector()}

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Main Content based on viewMode */}
      {viewMode === 'games' && (
        <>
          {(!games || games.length === 0) ? (
            <Alert severity="info">No NHL games scheduled for this date.</Alert>
          ) : (
            games.map(renderGameCard)
          )}
          {leagueLeaders && renderLeagueLeaders()}
        </>
      )}

      {viewMode === 'standings' && renderEnhancedStandings()}

      {(viewMode === 'props' || viewMode === 'parlays' || viewMode === 'fantasy') && (
        <Alert severity="info" sx={{ mt: 3 }}>
          Select a game to view {viewMode} details.
        </Alert>
      )}

      {/* Original Tabs */}
      <Paper sx={{ mb: 3, mt: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth" sx={{ '& .MuiTab-root': { py: 2, fontWeight: 'medium' } }}>
          <Tab icon={<EmojiEventsIcon />} iconPosition="start" label="Standings" />
          <Tab icon={<SportsHockeyIcon />} iconPosition="start" label="Games" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Players" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderStandingsTable()}
          {activeTab === 1 && renderGamesList()}
          {activeTab === 2 && renderPlayersList()}
        </Box>
      </Paper>

      {/* Refresh Button */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Button startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={refreshing || loading} variant="outlined">
          {refreshing ? 'Refreshing...' : 'Refresh Real Data'}
        </Button>
      </Box>
    </Container>
  );
};

export default NHLTrendsScreen;
