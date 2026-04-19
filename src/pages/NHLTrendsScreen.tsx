// src/pages/NHLTrendsScreen.tsx - UPDATED WITH CORRECT PLAN ACCESS (Starter Package)
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
  AlertTitle,
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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';
import ProtectedRoute from '../components/ProtectedRoute';
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
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';

// API Configuration
const API_BASE_URL = 'https://python-api-fresh-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// ========== INTERFACES ==========
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
  game_type: 'Regular Season';
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
    };
  };
  
  player_props?: any[];
  fantasy_projections?: any[];
  parlay_recommendations?: any[];
  
  confidence_score: number;
  confidence_level: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  
  team_stats: {
    home: TeamStats;
    away: TeamStats;
  };
  
  status: 'Scheduled' | 'Live' | 'Final' | 'Upcoming';
  trade_deadline_impact: boolean;
  playoff_implications: boolean;
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
  NYR: { name: 'Rangers', color: '#0033A0' },
  CAR: { name: 'Hurricanes', color: '#CC0000' },
  NJD: { name: 'Devils', color: '#CE1126' },
  WPG: { name: 'Jets', color: '#041E42' },
  MIN: { name: 'Wild', color: '#154734' },
  LAK: { name: 'Kings', color: '#111111' },
  SEA: { name: 'Kraken', color: '#99D9D9' },
};

const getTeamColor = (teamCode: string): string => {
  return NHLTeams[teamCode]?.color || '#64748b';
};

// Get current date for mock data
const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getFormattedDate = (daysFromNow: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// ========== MOCK DATA (UPDATED TO CURRENT DATE) ==========
const currentDate = getCurrentDate();
const tomorrowDate = getFormattedDate(1);
const dayAfterTomorrow = getFormattedDate(2);

const mockGames: NHLGame[] = [
  {
    id: '1',
    home_team: 'BOS',
    home_full: 'Boston Bruins',
    away_team: 'TOR',
    away_full: 'Toronto Maple Leafs',
    date: currentDate,
    time: '7:00 PM',
    venue: 'TD Garden',
    tv: 'ESPN+',
    note: 'Atlantic Division showdown - Playoff positioning at stake',
    division: 'Atlantic',
    sport: 'NHL',
    season: '2025-26',
    game_type: 'Regular Season',
    tournament: false,
    odds: {
      moneyline: { home: -150, away: +130, home_decimal: 1.67, away_decimal: 2.30, home_implied_probability: 0.60, away_implied_probability: 0.43 },
      spread: { home: -1.5, home_odds: +180, away: 1.5, away_odds: -220 },
      total: { line: 6.5, over: -110, under: -110 }
    },
    player_props: [],
    fantasy_projections: [],
    parlay_recommendations: [],
    confidence_score: 85,
    confidence_level: 'High',
    team_stats: {
      home: { record: '34-15-4', win_pct: 0.679, gpg: 3.42, gapg: 2.81, pp_pct: 24.5, pk_pct: 82.1, faceoff_pct: 52.3, corsi_pct: 53.1, pdo: 101.2, home_record: '19-6-2', away_record: '15-9-2', last_10: '7-2-1', streak: 'W3' },
      away: { record: '32-17-4', win_pct: 0.642, gpg: 3.55, gapg: 2.98, pp_pct: 26.2, pk_pct: 80.5, faceoff_pct: 51.8, corsi_pct: 52.4, pdo: 100.8, home_record: '18-7-2', away_record: '14-10-2', last_10: '6-3-1', streak: 'L1' }
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
    date: currentDate,
    time: '9:00 PM',
    venue: 'Ball Arena',
    tv: 'TNT',
    note: 'Western Conference battle for first place',
    division: 'Central',
    sport: 'NHL',
    season: '2025-26',
    game_type: 'Regular Season',
    tournament: false,
    odds: {
      moneyline: { home: -140, away: +120, home_decimal: 1.71, away_decimal: 2.20, home_implied_probability: 0.58, away_implied_probability: 0.45 },
      spread: { home: -1.5, home_odds: +200, away: 1.5, away_odds: -240 },
      total: { line: 6.0, over: -115, under: -105 }
    },
    player_props: [],
    fantasy_projections: [],
    parlay_recommendations: [],
    confidence_score: 75,
    confidence_level: 'Medium',
    team_stats: {
      home: { record: '35-14-3', win_pct: 0.698, gpg: 3.72, gapg: 2.65, pp_pct: 27.8, pk_pct: 83.5, faceoff_pct: 51.2, corsi_pct: 55.3, pdo: 102.1, home_record: '20-5-2', away_record: '15-9-1', last_10: '8-1-1', streak: 'W4' },
      away: { record: '33-16-4', win_pct: 0.660, gpg: 3.41, gapg: 2.82, pp_pct: 24.9, pk_pct: 81.2, faceoff_pct: 49.8, corsi_pct: 51.7, pdo: 100.2, home_record: '18-7-2', away_record: '15-9-2', last_10: '6-3-1', streak: 'W1' }
    },
    status: 'Scheduled',
    trade_deadline_impact: true,
    playoff_implications: true
  },
  {
    id: '3',
    home_team: 'EDM',
    home_full: 'Edmonton Oilers',
    away_team: 'VGK',
    away_full: 'Vegas Golden Knights',
    date: tomorrowDate,
    time: '10:00 PM',
    venue: 'Rogers Place',
    tv: 'SN',
    note: 'Pacific Division battle - McDavid vs Eichel',
    division: 'Pacific',
    sport: 'NHL',
    season: '2025-26',
    game_type: 'Regular Season',
    tournament: false,
    odds: {
      moneyline: { home: -120, away: +100, home_decimal: 1.83, away_decimal: 2.00, home_implied_probability: 0.55, away_implied_probability: 0.50 },
      spread: { home: -1.5, home_odds: +150, away: 1.5, away_odds: -180 },
      total: { line: 6.5, over: -110, under: -110 }
    },
    player_props: [],
    fantasy_projections: [],
    parlay_recommendations: [],
    confidence_score: 82,
    confidence_level: 'High',
    team_stats: {
      home: { record: '34-15-4', win_pct: 0.679, gpg: 3.68, gapg: 2.92, pp_pct: 26.5, pk_pct: 81.8, faceoff_pct: 53.2, corsi_pct: 54.1, pdo: 101.5, home_record: '19-5-3', away_record: '15-10-1', last_10: '7-2-1', streak: 'W2' },
      away: { record: '30-19-4', win_pct: 0.604, gpg: 3.35, gapg: 2.95, pp_pct: 23.2, pk_pct: 79.5, faceoff_pct: 50.2, corsi_pct: 51.5, pdo: 99.8, home_record: '16-9-2', away_record: '14-10-2', last_10: '5-4-1', streak: 'L1' }
    },
    status: 'Scheduled',
    trade_deadline_impact: false,
    playoff_implications: true
  },
  {
    id: '4',
    home_team: 'NYR',
    home_full: 'New York Rangers',
    away_team: 'CAR',
    away_full: 'Carolina Hurricanes',
    date: dayAfterTomorrow,
    time: '7:30 PM',
    venue: 'Madison Square Garden',
    tv: 'ESPN',
    note: 'Metropolitan Division clash - Playoff preview?',
    division: 'Metropolitan',
    sport: 'NHL',
    season: '2025-26',
    game_type: 'Regular Season',
    tournament: false,
    odds: {
      moneyline: { home: -110, away: -110, home_decimal: 1.91, away_decimal: 1.91, home_implied_probability: 0.52, away_implied_probability: 0.52 },
      spread: { home: -1.5, home_odds: +220, away: 1.5, away_odds: -260 },
      total: { line: 6.0, over: -110, under: -110 }
    },
    player_props: [],
    fantasy_projections: [],
    parlay_recommendations: [],
    confidence_score: 70,
    confidence_level: 'Medium',
    team_stats: {
      home: { record: '33-16-4', win_pct: 0.660, gpg: 3.45, gapg: 2.78, pp_pct: 25.2, pk_pct: 83.1, faceoff_pct: 51.5, corsi_pct: 52.8, pdo: 101.0, home_record: '18-7-2', away_record: '15-9-2', last_10: '6-3-1', streak: 'W1' },
      away: { record: '32-17-4', win_pct: 0.642, gpg: 3.38, gapg: 2.85, pp_pct: 24.8, pk_pct: 82.5, faceoff_pct: 52.1, corsi_pct: 53.2, pdo: 100.5, home_record: '17-8-2', away_record: '15-9-2', last_10: '5-4-1', streak: 'L2' }
    },
    status: 'Scheduled',
    trade_deadline_impact: false,
    playoff_implications: true
  }
];

const mockStandings = {
  eastern: {
    atlantic: [
      { team: 'BOS', wins: 34, losses: 15, otl: 4, points: 72 },
      { team: 'TOR', wins: 32, losses: 17, otl: 3, points: 67 },
      { team: 'TB', wins: 30, losses: 19, otl: 4, points: 64 },
      { team: 'FLA', wins: 29, losses: 20, otl: 4, points: 62 }
    ],
    metropolitan: [
      { team: 'NYR', wins: 33, losses: 16, otl: 3, points: 69 },
      { team: 'CAR', wins: 32, losses: 17, otl: 3, points: 67 },
      { team: 'NJD', wins: 30, losses: 19, otl: 4, points: 64 }
    ]
  },
  western: {
    central: [
      { team: 'COL', wins: 35, losses: 14, otl: 3, points: 73 },
      { team: 'DAL', wins: 33, losses: 16, otl: 3, points: 69 },
      { team: 'WPG', wins: 31, losses: 18, otl: 4, points: 66 }
    ],
    pacific: [
      { team: 'EDM', wins: 34, losses: 15, otl: 3, points: 71 },
      { team: 'LAK', wins: 31, losses: 18, otl: 4, points: 66 },
      { team: 'VGK', wins: 30, losses: 19, otl: 4, points: 64 }
    ]
  }
};

const mockLeagueLeaders: LeagueLeaders = {
  scoring: [
    { player: 'Connor McDavid', team: 'EDM', gp: 68, goals: 45, assists: 72, points: 117 },
    { player: 'Nathan MacKinnon', team: 'COL', gp: 68, goals: 38, assists: 64, points: 102 },
    { player: 'Nikita Kucherov', team: 'TB', gp: 67, goals: 40, assists: 62, points: 102 },
    { player: 'David Pastrnak', team: 'BOS', gp: 68, goals: 49, assists: 45, points: 94 },
    { player: 'Auston Matthews', team: 'TOR', gp: 66, goals: 52, assists: 40, points: 92 }
  ],
  goals: [
    { player: 'Auston Matthews', team: 'TOR', goals: 52, gp: 66 },
    { player: 'David Pastrnak', team: 'BOS', goals: 49, gp: 68 },
    { player: 'Connor McDavid', team: 'EDM', goals: 45, gp: 68 },
    { player: 'Alex Ovechkin', team: 'WSH', goals: 41, gp: 67 },
    { player: 'Brady Tkachuk', team: 'OTT', goals: 38, gp: 68 }
  ],
  assists: [
    { player: 'Connor McDavid', team: 'EDM', assists: 72, gp: 68 },
    { player: 'Nathan MacKinnon', team: 'COL', assists: 64, gp: 68 },
    { player: 'Nikita Kucherov', team: 'TB', assists: 62, gp: 67 },
    { player: 'Leon Draisaitl', team: 'EDM', assists: 55, gp: 68 },
    { player: 'Erik Karlsson', team: 'PIT', assists: 52, gp: 66 }
  ],
  goaltending: [
    { player: 'Connor Hellebuyck', team: 'WPG', wins: 38, gaa: 2.18, sv_pct: 0.926, so: 5 },
    { player: 'Ilya Sorokin', team: 'NYI', wins: 34, gaa: 2.28, sv_pct: 0.920, so: 4 },
    { player: 'Jacob Markstrom', team: 'CGY', wins: 32, gaa: 2.35, sv_pct: 0.915, so: 3 },
    { player: 'Linus Ullmark', team: 'BOS', wins: 31, gaa: 2.25, sv_pct: 0.922, so: 4 },
    { player: 'Igor Shesterkin', team: 'NYR', wins: 35, gaa: 2.32, sv_pct: 0.918, so: 3 }
  ]
};

const mockTradeDeadline: TradeDeadline = {
  date: '2026-03-07',
  days_remaining: 0,
  rumors: [
    { player: 'Mikko Rantanen', team: 'COL', rumor: 'Signed extension with Avalanche', likelihood: 'Confirmed', reported_by: 'TSN' },
    { player: 'John Gibson', team: 'ANA', rumor: 'Remains with Ducks through deadline', likelihood: 'High', reported_by: 'Sportsnet' }
  ],
  impact_players: ['Rantanen (Extended)', 'Gibson (Staying)', 'Hanifin (Extended)']
};

const mockPlayers = [
  { id: 1, name: 'Connor McDavid', team: 'EDM', goals: 45, assists: 72, points: 117, position: 'C', teamColor: '#041E42' },
  { id: 2, name: 'Nathan MacKinnon', team: 'COL', goals: 38, assists: 64, points: 102, position: 'C', teamColor: '#6F263D' },
  { id: 3, name: 'Nikita Kucherov', team: 'TB', goals: 40, assists: 62, points: 102, position: 'RW', teamColor: '#002868' },
  { id: 4, name: 'David Pastrnak', team: 'BOS', goals: 49, assists: 45, points: 94, position: 'RW', teamColor: '#FFB81C' },
  { id: 5, name: 'Auston Matthews', team: 'TOR', goals: 52, assists: 40, points: 92, position: 'C', teamColor: '#003E7E' },
  { id: 6, name: 'Leon Draisaitl', team: 'EDM', goals: 42, assists: 55, points: 97, position: 'C', teamColor: '#041E42' },
  { id: 7, name: 'Mikko Rantanen', team: 'COL', goals: 36, assists: 48, points: 84, position: 'RW', teamColor: '#6F263D' },
  { id: 8, name: 'Artemi Panarin', team: 'NYR', goals: 32, assists: 58, points: 90, position: 'LW', teamColor: '#0033A0' },
];

// ========== API FUNCTIONS WITH FALLBACK ==========
const fetchNHLGames = async (date: string): Promise<NHLGame[]> => {
  try {
    const url = `${API_BASE_URL}/api/nhl/games?date=${date}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`API returned ${response.status}, using mock data`);
      return mockGames;
    }
    
    const data = await response.json();
    
    if (data.games && Array.isArray(data.games) && data.games.length > 0) {
      // Transform API response to match our interface
      const transformedGames = data.games.map((game: any) => ({
        id: game.id || `game-${Math.random()}`,
        home_team: game.home_abbrev || game.home_team || 'N/A',
        home_full: game.home_team || 'N/A',
        away_team: game.away_abbrev || game.away_team || 'N/A',
        away_full: game.away_team || 'N/A',
        date: game.date || date,
        time: game.time || '7:00 PM',
        venue: game.venue || 'NHL Arena',
        tv: game.tv || 'NHL Network',
        note: game.note || '',
        division: game.division || '',
        sport: 'NHL' as const,
        season: '2025-26' as const,
        game_type: 'Regular Season' as const,
        tournament: false,
        odds: game.odds || mockGames[0].odds,
        player_props: game.player_props || [],
        fantasy_projections: game.fantasy_projections || [],
        parlay_recommendations: game.parlay_recommendations || [],
        confidence_score: game.confidence_score || 75,
        confidence_level: game.confidence_level || 'Medium',
        team_stats: game.team_stats || mockGames[0].team_stats,
        status: game.status || 'Scheduled',
        trade_deadline_impact: game.trade_deadline_impact || false,
        playoff_implications: game.playoff_implications || false
      }));
      
      return transformedGames.length > 0 ? transformedGames : mockGames;
    }
    
    return mockGames;
  } catch (error) {
    console.error('Error fetching NHL games:', error);
    return mockGames;
  }
};

const fetchNHLStandings = async (): Promise<any> => {
  try {
    const url = `${API_BASE_URL}/api/nhl/standings`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Standings API returned ${response.status}, using mock data`);
      return mockStandings;
    }
    
    const data = await response.json();
    
    if (data.success && data.standings && Array.isArray(data.standings) && data.standings.length > 0) {
      const eastern = { atlantic: [], metropolitan: [] };
      const western = { central: [], pacific: [] };
      
      data.standings.forEach((team: any) => {
        const entry = {
          team: team.abbreviation || team.team,
          wins: team.wins || 0,
          losses: team.losses || 0,
          otl: team.ot_losses || 0,
          points: team.points || 0
        };
        
        if (team.conference === 'Eastern') {
          if (team.division === 'Atlantic') eastern.atlantic.push(entry);
          else if (team.division === 'Metropolitan') eastern.metropolitan.push(entry);
        } else if (team.conference === 'Western') {
          if (team.division === 'Central') western.central.push(entry);
          else if (team.division === 'Pacific') western.pacific.push(entry);
        }
      });
      
      eastern.atlantic.sort((a: any, b: any) => b.points - a.points);
      eastern.metropolitan.sort((a: any, b: any) => b.points - a.points);
      western.central.sort((a: any, b: any) => b.points - a.points);
      western.pacific.sort((a: any, b: any) => b.points - a.points);
      
      return { eastern, western };
    }
    
    return mockStandings;
  } catch (error) {
    console.error('Error fetching NHL standings:', error);
    return mockStandings;
  }
};

const fetchNHLPlayers = async (): Promise<any[]> => {
  try {
    const url = `${API_BASE_URL}/api/players?sport=nhl&realtime=true&limit=50`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Players API returned ${response.status}, using mock data`);
      return mockPlayers;
    }
    
    const data = await response.json();
    
    if (data.success && data.data?.players && data.data.players.length > 0) {
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
      return transformed;
    }
    
    return mockPlayers;
  } catch (error) {
    console.error('Error fetching NHL players:', error);
    return mockPlayers;
  }
};

const fetchLeagueLeaders = async (): Promise<LeagueLeaders> => {
  try {
    const url = `${API_BASE_URL}/api/nhl/leaders`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Leaders API returned ${response.status}, using mock data`);
      return mockLeagueLeaders;
    }
    
    const data = await response.json();
    
    if (data.success && data.leaders) {
      return data.leaders;
    }
    
    return mockLeagueLeaders;
  } catch (error) {
    console.error('Error fetching league leaders:', error);
    return mockLeagueLeaders;
  }
};

const fetchTradeDeadline = async (): Promise<TradeDeadline> => {
  try {
    const url = `${API_BASE_URL}/api/nhl/trade-deadline`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Trade deadline API returned ${response.status}, using mock data`);
      return mockTradeDeadline;
    }
    
    const data = await response.json();
    
    if (data.success && data.trade_deadline) {
      return data.trade_deadline;
    }
    
    return mockTradeDeadline;
  } catch (error) {
    console.error('Error fetching trade deadline:', error);
    return mockTradeDeadline;
  }
};

const NHLTrendsScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, getIdToken, profile, planFeatures } = useAuth();
  const { handleSubscriptionCheckout } = useCheckout();

  // Plan-based access control - NHL Trends is part of Starter package (hasPlayerStats)
  const hasNHLTrendsAccess = planFeatures?.hasPlayerStats || false;
  
  // State for upgrade modal and plan selection
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [selectedInterval, setSelectedInterval] = useState<string>('month');

  // State
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isRealData, setIsRealData] = useState(false);

  // NHL-specific state
  const [games, setGames] = useState<NHLGame[]>([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedGame, setSelectedGame] = useState<NHLGame | null>(null);
  const [viewMode, setViewMode] = useState<'games' | 'props' | 'parlays' | 'fantasy' | 'standings'>('games');
  const [leagueLeaders, setLeagueLeaders] = useState<LeagueLeaders | null>(null);
  const [standings, setStandings] = useState<any>(null);
  const [tradeDeadline, setTradeDeadline] = useState<TradeDeadline | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  const lastSelectedTime = useRef(0);
  const isMounted = useRef(true);

  const handleUpgrade = () => {
    handleSubscriptionCheckout(selectedPlan, selectedInterval);
  };

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

  // Fetch all NHL data with fallback to mock
  const fetchAllNHLData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch games (will return mock if API fails)
      const gamesData = await fetchNHLGames(selectedDate);
      setGames(gamesData);
      
      // Fetch standings (will return mock if API fails)
      const standingsData = await fetchNHLStandings();
      setStandings(standingsData);
      
      // Fetch players (only if not already loaded or when refreshing)
      if (activeTab === 2 || refreshing) {
        const playersData = await fetchNHLPlayers();
        setPlayers(playersData);
      }
      
      // Fetch league leaders (will return mock if API fails)
      const leadersData = await fetchLeagueLeaders();
      setLeagueLeaders(leadersData);
      
      // Fetch trade deadline (will return mock if API fails)
      const deadlineData = await fetchTradeDeadline();
      setTradeDeadline(deadlineData);
      
      // Check if we're using real data or mock
      const hasRealData = gamesData.length > 0 && gamesData[0].venue !== 'NHL Arena';
      setIsRealData(hasRealData);
      
      setSuccessMessage('NHL data updated');
    } catch (err) {
      console.error('Error fetching NHL data:', err);
      setError('Using mock data. Real API may be unavailable.');
      // Set mock data as fallback
      setGames(mockGames);
      setStandings(mockStandings);
      setLeagueLeaders(mockLeagueLeaders);
      setTradeDeadline(mockTradeDeadline);
      if (activeTab === 2) {
        setPlayers(mockPlayers);
      }
      setIsRealData(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and when date changes (only if user has access)
  useEffect(() => {
    if (hasNHLTrendsAccess) {
      fetchAllNHLData();
    }
  }, [selectedDate, hasNHLTrendsAccess]);

  // Fetch players when Players tab is active
  useEffect(() => {
    if (activeTab === 2 && players.length === 0 && hasNHLTrendsAccess) {
      fetchNHLPlayers().then(setPlayers);
    }
  }, [activeTab, hasNHLTrendsAccess]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllNHLData();
  };

  // Search handlers
  const handleSearchSubmit = () => {
    if (searchInput.trim()) {
      const query = searchInput.trim();
      setSearchQuery(query);
      
      if (!searchHistory.includes(query)) {
        setSearchHistory([query, ...searchHistory.slice(0, 4)]);
      }
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const setSelectedGameCallback = useCallback((game: NHLGame | null) => {
    if (!isMounted.current) return;
    if (game === null) {
      setSelectedGame(null);
    } else {
      lastSelectedTime.current = Date.now();
      setSelectedGame(game);
    }
  }, []);

  const setViewModeCallback = useCallback((mode: typeof viewMode) => {
    if (!isMounted.current) return;
    setViewMode(mode);
  }, []);

  const handleDetailsClick = useCallback((e: React.MouseEvent, game: NHLGame) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedGameCallback(game);
    setViewModeCallback('games');
  }, [setSelectedGameCallback, setViewModeCallback]);

  const handleComboClick = useCallback((e: React.MouseEvent, game: NHLGame) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedGameCallback(game);
    setViewModeCallback('parlays');
  }, [setSelectedGameCallback, setViewModeCallback]);

  const handleFantasyClick = useCallback((e: React.MouseEvent, game: NHLGame) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedGameCallback(game);
    setViewModeCallback('fantasy');
  }, [setSelectedGameCallback, setViewModeCallback]);

  // No access state - show dynamic upgrade prompt based on current plan
  if (!hasNHLTrendsAccess) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <SportsHockeyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold">
            NHL Center
          </Typography>
          <Chip
            icon={<LockIcon />}
            label="Requires Access"
            color="warning"
            size="small"
          />
        </Box>

        <Card sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <LockIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            {profile?.plan === 'free' 
              ? 'Upgrade to Access NHL Data'
              : 'Your current plan does not include NHL data'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            {profile?.plan === 'free'
              ? 'The Starter plan includes NHL games, standings, player stats, and betting insights. Upgrade now to get full access.'
              : 'NHL data is included in Starter, Analytics, and Generator plans. Please upgrade your plan.'}
          </Typography>
          
          {/* Dynamic plan selection */}
          <Box sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Plan</InputLabel>
                  <Select
                    value={selectedPlan}
                    label="Plan"
                    onChange={(e: SelectChangeEvent) => setSelectedPlan(e.target.value)}
                  >
                    <MenuItem value="starter">Starter - $5.99/month</MenuItem>
                    <MenuItem value="analytics">Analytics - $19.99/month</MenuItem>
                    <MenuItem value="generator">Generator - $39.99/month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Billing</InputLabel>
                  <Select
                    value={selectedInterval}
                    label="Billing"
                    onChange={(e: SelectChangeEvent) => setSelectedInterval(e.target.value)}
                  >
                    <MenuItem value="month">Monthly</MenuItem>
                    <MenuItem value="year">Yearly (Save 20%)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          
          <Button 
            variant="contained" 
            size="large"
            startIcon={<CreditCardIcon />}
            onClick={handleUpgrade}
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
          >
            Upgrade to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} ({selectedInterval}ly)
          </Button>
        </Card>

        {/* Upgrade Modal */}
        <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon sx={{ color: '#f59e0b' }} />
              <Typography variant="h6">Upgrade Your Plan</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography paragraph>
              Get access to NHL games, standings, player stats, and betting insights.
            </Typography>
            
            {/* Plan Selection */}
            <Box sx={{ my: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Select Plan:</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select
                  value={selectedPlan}
                  onChange={(e: SelectChangeEvent) => setSelectedPlan(e.target.value)}
                >
                  <MenuItem value="starter">Starter - $5.99/month</MenuItem>
                  <MenuItem value="analytics">Analytics - $19.99/month</MenuItem>
                  <MenuItem value="generator">Generator - $39.99/month</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <Select
                  value={selectedInterval}
                  onChange={(e: SelectChangeEvent) => setSelectedInterval(e.target.value)}
                >
                  <MenuItem value="month">Monthly</MenuItem>
                  <MenuItem value="year">Yearly (Save 20%)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ my: 3 }}>
              {[
                'Complete NHL game schedules',
                'Live standings and division rankings',
                'Player statistics and scoring leaders',
                'Game multiplier and betting insights',
                'Combo recommendations',
                'Fantasy hockey projections',
                'Trade deadline analysis',
                'Playoff implications tracking',
              ].map((feature) => (
                <Box key={feature} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleUpgrade}
              sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
            >
              Subscribe Now - {selectedPlan === 'starter' ? '$5.99' : selectedPlan === 'analytics' ? '$19.99' : '$39.99'}/{selectedInterval === 'month' ? 'mo' : 'yr'}
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUpgradeModal(false)}>Not Now</Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  // ========== RENDER COMPONENTS (Only shown if hasNHLTrendsAccess is true) ==========
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
          {selectedDate === getCurrentDate() ? 'Today' : ''}
        </Typography>
      </Box>
      <IconButton onClick={() => changeDate(1)}>
        <ChevronRightIcon />
      </IconButton>
    </Paper>
  );

  const renderTradeDeadlineBanner = () => {
    if (!tradeDeadline) return null;
    return (
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha(theme.palette.info.main, 0.1),
          borderLeft: `4px solid ${theme.palette.info.main}`,
          cursor: 'pointer'
        }}
        onClick={() => {
          alert(`Trade Deadline: ${tradeDeadline.date}\n\nImpact players: ${tradeDeadline.impact_players.join(', ')}`);
        }}
      >
        <Typography variant="body1" fontWeight="bold" color="info.main">
          📋 Trade Deadline Recap - {tradeDeadline.date}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Key moves: {tradeDeadline.impact_players.join(', ')}
        </Typography>
      </Paper>
    );
  };

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
      <CardContent>
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

        <Grid container spacing={2} sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2, mb: 2 }}>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">Match Winner</Typography>
            <Typography variant="body2" fontWeight="bold">
              {game.home_team} {game.odds?.moneyline?.home > 0 ? '+' : ''}{game.odds?.moneyline?.home ?? 'N/A'}
            </Typography>
            <Typography variant="caption">
              {game.away_team} {game.odds?.moneyline?.away > 0 ? '+' : ''}{game.odds?.moneyline?.away ?? 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">Point Adjustment</Typography>
            <Typography variant="body2" fontWeight="bold">
              {game.home_team} {game.odds?.spread?.home > 0 ? '+' : ''}{game.odds?.spread?.home ?? 'N/A'} ({game.odds?.spread?.home_odds > 0 ? '+' : ''}{game.odds?.spread?.home_odds ?? 'N/A'})
            </Typography>
            <Typography variant="caption">
              {game.away_team} +{game.odds?.spread?.away ?? 'N/A'} ({game.odds?.spread?.away_odds > 0 ? '+' : ''}{game.odds?.spread?.away_odds ?? 'N/A'})
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">Total</Typography>
            <Typography variant="body2" fontWeight="bold">Total Range {game.odds?.total?.line ?? 'N/A'}</Typography>
            <Typography variant="caption">
              O {game.odds?.total?.over > 0 ? '+' : ''}{game.odds?.total?.over ?? 'N/A'} • U {game.odds?.total?.under > 0 ? '+' : ''}{game.odds?.total?.under ?? 'N/A'}
            </Typography>
          </Grid>
        </Grid>

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

        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-around">
          <Button size="small" startIcon={<InfoIcon />} onClick={(e) => handleDetailsClick(e, game)}>
            Details
          </Button>
          <Button size="small" startIcon={<TrendingUpIcon />} onClick={(e) => handleComboClick(e, game)}>
            Combo
          </Button>
          <Button size="small" startIcon={<EmojiEventsIcon />} onClick={(e) => handleFantasyClick(e, game)}>
            Fantasy
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const renderPlayerProps = (game: NHLGame) => (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">🎯 Player Props</Typography>
      {game.player_props && game.player_props.length > 0 ? (
        game.player_props.map((propGroup, idx) => (
          <Card key={idx} sx={{ mb: 3 }}>
            <CardContent>
              <Typography>Player props coming soon...</Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Alert severity="info">No player props available for this game.</Alert>
      )}
    </Box>
  );

  const renderComboRecommendations = (game: NHLGame) => (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">🎲 Combo Recommendations</Typography>
      {game.parlay_recommendations && game.parlay_recommendations.length > 0 ? (
        game.parlay_recommendations.map((parlay, idx) => (
          <Card key={idx} sx={{ mb: 3 }}>
            <CardContent>
              <Typography>Combo recommendations coming soon...</Typography>
            </CardContent>
          </Card>
        ))
      ) : (
        <Alert severity="info">No combo recommendations available for this game.</Alert>
      )}
    </Box>
  );

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
                  <TableCell align="right">${proj.salary_dk?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={proj.value_rating?.toFixed(2) || 'N/A'}
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

  const renderLeagueLeaders = () => {
    if (!leagueLeaders || (leagueLeaders.scoring.length === 0 && leagueLeaders.goals.length === 0)) return null;
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>📈 League Leaders - March 2026</Typography>
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

  const renderEnhancedStandings = () => {
    if (!standings) return null;
    return (
      <Box>
        <Typography variant="h5" fontWeight="bold" gutterBottom>🏒 NHL Standings - March 2026</Typography>
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

  const renderStandingsTable = () => {
    if (!standings) return <Alert severity="info">No standings data available.</Alert>;
    
    const allTeams = [
      ...(standings.eastern?.atlantic || []),
      ...(standings.eastern?.metropolitan || []),
      ...(standings.western?.central || []),
      ...(standings.western?.pacific || [])
    ];
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight="bold">
              NHL Standings
            </Typography>
            <Chip 
              label={isRealData ? "Real Data" : "Mock Data"} 
              color={isRealData ? "success" : "warning"} 
              size="small" 
              icon={isRealData ? <InfoIcon /> : <WarningIcon />}
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
                {allTeams.slice(0, 10).map((team: any, index: number) => (
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
                    <TableCell align="center">
                      <Chip 
                        label={standings.eastern?.atlantic?.includes(team) || standings.eastern?.metropolitan?.includes(team) ? "Eastern" : "Western"} 
                        size="small" 
                        sx={{ backgroundColor: alpha('#1976d2', 0.1), color: 'primary.main', fontWeight: 'medium' }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  const renderGamesList = () => {
    const data = games.length > 0 ? games : mockGames;
    if (data.length === 0) {
      return <Alert severity="info">No games available for this date.</Alert>;
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

  const renderPlayersList = () => {
    const displayPlayers = players.length > 0 ? players : mockPlayers;
    if (displayPlayers.length === 0) {
      return <Alert severity="info">No player data available.</Alert>;
    }
    
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
                {displayPlayers.slice(0, 10).map((player, index) => (
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
        <Typography variant="subtitle1">Multiplier</Typography>
        <Box display="flex" justifyContent="space-around" sx={{ mt: 1 }}>
          <Box>Winner: {selectedGame.home_team} {selectedGame.odds?.moneyline?.home}</Box>
          <Box>spread: {selectedGame.home_team} {selectedGame.odds?.spread?.home}</Box>
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
          {viewMode === 'parlays' && renderComboRecommendations(selectedGame)}
          {viewMode === 'fantasy' && renderFantasyProjections(selectedGame)}
        </Paper>
      </Box>
    );
  };

  // ========== MAIN RENDER (Access Granted) ==========
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
            <Typography variant="h3" fontWeight="bold" gutterBottom>NHL Center • March 2026</Typography>
            <Typography variant="h6" color="text.secondary">Season 2025-26 • Playoff Push</Typography>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${profile?.plan?.charAt(0).toUpperCase() + profile?.plan?.slice(1) || 'Active'} Plan`}
              color="success"
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {loading && <CircularProgress size={24} />}
            <IconButton color="primary" size="large" onClick={handleRefresh}><RefreshIcon /></IconButton>
          </Box>
        </Box>
      </Box>

      {/* Search Bar */}
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

      {/* Team Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Filter by Team</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {Object.entries(NHLTeams).slice(0, 15).map(([id, team]) => (
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

      {/* Date Navigation */}
      {renderDateNavigation()}

      {/* Trade Deadline Banner */}
      {renderTradeDeadlineBanner()}

      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Main Content based on viewMode */}
      {viewMode === 'games' && (
        <>
          {games.length === 0 ? (
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
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>
    </Container>
  );
};

export default NHLTrendsScreen;
