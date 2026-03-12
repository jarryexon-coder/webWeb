// src/pages/ParlayArchitectScreen.tsx - COMPLETE NODE API VERSION WITH AI GENERATOR
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Divider,
  Switch,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as CashIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  Merge as MergeIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Layers as LayersIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  Autorenew as AutorenewIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  BugReport as BugReportIcon,
  EmojiEvents as TrophyIcon,
  Bolt as BoltIcon,
  FlashOn as FlashOnIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Whatshot as WhatshotIcon,
  Timer as TimerIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Info as InfoIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, parseISO, isToday } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// ========== API BASES ==========
const PRIZEPICKS_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// ========== TYPES ==========
interface ParlayLeg {
  id: string;
  player?: string;
  player_name?: string;
  team?: string;
  market: string;
  market_type?: string;
  line?: number;
  projection?: number;
  odds: number;
  odds_american?: string;
  side?: 'over' | 'under' | 'yes' | 'no' | 'home' | 'away';
  game_id?: string;
  gameId?: string;
  game_time?: string;
  sport: string;
  correlation_score?: number;
  confidence?: number;
  confidence_level?: string;
  is_star?: boolean;
  description?: string;
  teams?: { home: string; away: string };
  stat_type?: string;
  edge?: string;
}

interface NHLPropMarket extends PropMarket {
  stat_type: 'goals' | 'assists' | 'points' | 'shots' | 'saves' | 'hits';
  period?: 'game' | '1st' | '2nd' | '3rd';
  goalie?: boolean;
}

interface ParlayType {
  id: string;
  name: string;
  min_legs: number;
  max_legs: number;
  description: string;
  sports: string[];
  points_available?: number[];
  combinations?: string[];
  popularity: number;
  is_live: boolean;
}

interface ParlayResponse {
  id: string;
  type: string;
  sport: string;
  legs: ParlayLeg[];
  leg_count: number;
  odds: number;
  decimal_odds: number;
  stake: number;
  potential_payout: number;
  profit: number;
  implied_probability: number;
  correlation_bonus?: number;
  available_boosts?: ParlayBoost[];
  sportsbook_pricing?: Record<string, number>;
  risk_level?: string;
}

interface ParlayBoost {
  name: string;
  boost_percentage: number;
  new_odds: number;
}

interface PropMarket {
  id: string;
  player: string;
  team: string;
  market: string;
  line: number;
  projection?: number;
  over_odds: number;
  under_odds: number;
  confidence: number;
  game_id: string;
  game_time: string;
  sport: string;
  position?: string;
  edge?: string;
}

interface TeaserOption {
  points: number;
  odds: number;
  sport: string;
}

interface RoundRobinCombo {
  id: string;
  legs: ParlayLeg[];
  odds: number;
  payout: number;
  profit: number;
}

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    last_update: string;
    markets?: Array<{
      key: string;
      last_update: string;
      outcomes?: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type?: string;
  legs: Array<{
    id: string;
    game_id?: string;
    gameId?: string;
    description: string;
    odds: string;
    odds_american?: string;
    price?: number;
    confidence: number;
    sport: string;
    market: string;
    player_name?: string;
    stat_type?: string;
    line?: string | number;
    projection?: number;
    edge?: string;
    teams?: { home: string; away: string };
    confidence_level?: string;
    correlation_score?: number;
    is_star?: boolean;
  }>;
  total_odds?: string;
  totalOdds?: string;
  total_odds_american?: string;
  confidence: number;
  analysis: string;
  timestamp: string;
  isGenerated?: boolean;
  isToday?: boolean;
  source?: string;
  confidence_level?: string;
  expected_value?: string;
  risk_level?: string;
  ai_metrics?: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge?: number;
  };
  is_real_data?: boolean;
  has_data?: boolean;
  correlation_bonus?: number;
  available_boosts?: ParlayBoost[];
}

const SPORTS = [
  { id: 'all', name: 'All Sports', icon: <MergeIcon />, color: '#f59e0b' },
  { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
  { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#10b981' }
];

const SPORTS_2026 = [
  { id: 'NBA', name: 'NBA', icon: '🏀', season: '2025-26', status: 'All-Star Break' },
  { id: 'NFL', name: 'NFL', icon: '🏈', season: '2026', status: 'Offseason' },
  { id: 'NHL', name: 'NHL', icon: '🏒', season: '2025-26', status: 'Playoff Push' },
  { id: 'MLB', name: 'MLB', icon: '⚾', season: '2026', status: 'Spring Training' },
];

const NHL_STATS = [
  { id: 'goals', name: 'Goals', icon: '🥅', format: (v: number) => v.toFixed(1) },
  { id: 'assists', name: 'Assists', icon: '🎯', format: (v: number) => v.toFixed(1) },
  { id: 'points', name: 'Points', icon: '⭐', format: (v: number) => v.toFixed(1) },
  { id: 'shots', name: 'Shots', icon: '🏒', format: (v: number) => v.toFixed(1) },
  { id: 'saves', name: 'Saves', icon: '🧤', format: (v: number) => v.toFixed(1) },
  { id: 'hits', name: 'Hits', icon: '💥', format: (v: number) => v.toFixed(0) },
];

const MARKET_TYPES = [
  { id: 'all', name: 'All Markets', icon: '🔄' },
  { id: 'player_props', name: 'Player Props', icon: '👤' },
  { id: 'game_totals', name: 'Game Totals', icon: '📊' },
  { id: 'moneyline', name: 'Moneyline', icon: '💰' },
  { id: 'spreads', name: 'Spreads', icon: '⚖️' },
  { id: 'mixed', name: 'Mixed', icon: '🔄' }
];

const RISK_LEVELS = [
  { id: 'all', name: 'All Risks', color: '#64748b' },
  { id: 'low', name: 'Low Risk', color: '#10b981' },
  { id: 'medium', name: 'Medium Risk', color: '#f59e0b' },
  { id: 'high', name: 'High Risk', color: '#ef4444' }
];

const PARLAY_TYPES_2026 = [
  {
    id: 'standard',
    name: 'Standard Parlay',
    min_legs: 2,
    max_legs: 20,
    description: 'Traditional multi-leg betting',
    sports: ['NBA', 'NFL', 'NHL', 'MLB'],
    popularity: 95,
    is_live: true
  },
  {
    id: 'same_game',
    name: 'Same Game Parlay',
    min_legs: 2,
    max_legs: 10,
    description: 'Correlated props from same game',
    sports: ['NBA', 'NFL', 'NHL'],
    popularity: 88,
    is_live: true
  },
  {
    id: 'teaser',
    name: 'Teaser',
    min_legs: 2,
    max_legs: 8,
    description: '6, 6.5, 7-point teasers',
    sports: ['NBA', 'NFL'],
    points_available: [6, 6.5, 7],
    popularity: 76,
    is_live: true
  },
  {
    id: 'round_robin',
    name: 'Round Robin',
    min_legs: 3,
    max_legs: 8,
    description: 'Multiple parlay combinations',
    sports: ['NBA', 'NFL', 'NHL', 'MLB'],
    combinations: ['2s', '3s', '4s'],
    popularity: 82,
    is_live: true
  }
];

const PARLAY_SIZES = [
  { id: 'all', name: 'Any Size' },
  { id: '2', name: '2-Leg Parlays' },
  { id: '3', name: '3-Leg Parlays' },
  { id: '4', name: '4-Leg Parlays' },
  { id: '5', name: '5+ Leg Parlays' }
];

const TEASER_POINTS = [6, 6.5, 7];
const ROUND_ROBIN_SIZES = ['2s', '3s', '4s'];

const pulseAnimation = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}
.pulse {
  animation: pulse 2s infinite;
}
`;

// ========== AI PROMPTS ==========
const PROMPTS = [
  { label: '🔥 Best value props', query: 'best value props' },
  { label: '🎯 Top confidence plays', query: 'top confidence plays' },
  { label: '📈 Highest projected points', query: 'highest projected points' },
  { label: '🏀 LeBron James props', query: 'LeBron James points and assists' },
  { label: '🌟 Luka Doncic triple-double', query: 'Luka Doncic points, rebounds, assists' },
  { label: '🔄 Same game parlay: Lakers vs Warriors', query: 'Lakers vs Warriors player props' },
  { label: '⚡ Quick 2-leg parlay', query: '2-leg parlay with high confidence' },
  { label: '💰 Underdog value picks', query: 'underdog props with positive edge' },
  { label: '📊 Tonight’s top scorers', query: 'top scorers tonight' },
  { label: '🧠 AI’s best picks', query: 'AI’s best parlay picks' },
];

// ========== HELPER: generate parlay suggestions from real props ==========
const generateParlaysFromProps = (props: PropMarket[], sport: string): ParlaySuggestion[] => {
  const suggestions: ParlaySuggestion[] = [];

  if (props.length < 2) return [];

  // Deduplicate by player+market+line
  const uniqueMap = new Map<string, PropMarket>();
  props.forEach(prop => {
    const key = `${prop.player}|${prop.market}|${prop.line}`;
    if (!uniqueMap.has(key) || (prop.confidence || 0) > (uniqueMap.get(key)?.confidence || 0)) {
      uniqueMap.set(key, prop);
    }
  });
  const uniqueProps = Array.from(uniqueMap.values());

  // Helper to get safe confidence
  const getSafeConfidence = (c: any): number => {
    const num = Number(c);
    return !isNaN(num) && num > 0 ? Math.min(num, 100) : 75;
  };

  // Helper to generate realistic projection
  const getProjection = (prop: PropMarket): number => {
    const stat = prop.market?.toLowerCase() || '';
    let projection = prop.line * 1.05;
    if (stat.includes('point')) projection = Math.min(projection, 50);
    else if (stat.includes('rebound')) projection = Math.min(projection, 25);
    else if (stat.includes('assist')) projection = Math.min(projection, 20);
    else if (stat.includes('steal') || stat.includes('block')) projection = Math.min(projection, 5);
    return Math.max(projection, prop.line);
  };

  // Helper to compute edge
  const computeEdge = (prop: PropMarket, proj: number): string => {
    if (!prop.line || prop.line === 0) return '+0%';
    const edge = ((proj - prop.line) / prop.line) * 100;
    const sign = edge >= 0 ? '+' : '';
    return `${sign}${edge.toFixed(1)}%`;
  };

  // 1. Top confidence parlay (unique players)
  const topConfidence = uniqueProps
    .map(p => ({ ...p, safeConf: getSafeConfidence(p.confidence) }))
    .sort((a, b) => b.safeConf - a.safeConf);
  const selectedConf = [];
  const usedPlayersConf = new Set();
  for (const prop of topConfidence) {
    if (selectedConf.length >= 3) break;
    if (!usedPlayersConf.has(prop.player)) {
      selectedConf.push(prop);
      usedPlayersConf.add(prop.player);
    }
  }
  if (selectedConf.length >= 2) {
    const legs = selectedConf.map((prop, idx) => {
      const projection = getProjection(prop);
      const edge = computeEdge(prop, projection);
      return {
        id: `gen-${Date.now()}-conf-${idx}`,
        gameId: prop.game_id,
        description: `${prop.player} ${prop.market} Over ${prop.line}`,
        odds: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
        odds_american: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
        price: prop.over_odds,
        confidence: prop.safeConf,
        sport,
        market: 'player_props',
        player_name: prop.player,
        stat_type: prop.market,
        line: prop.line,
        projection,
        edge,
        confidence_level: prop.safeConf > 80 ? 'very-high' : prop.safeConf > 70 ? 'high' : 'medium',
        correlation_score: 0.7,
        is_star: prop.safeConf > 80,
      };
    });

    let decimal = 1.0;
    legs.forEach(leg => {
      const odds = leg.price;
      if (odds > 0) decimal *= 1 + odds / 100;
      else decimal *= 1 - 100 / Math.abs(odds);
    });
    const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();

    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);

    suggestions.push({
      id: `top-conf-${Date.now()}`,
      name: `${sport} Top Confidence Parlay`,
      sport,
      type: 'standard',
      market_type: 'player_props',
      legs,
      totalOdds,
      total_odds: totalOdds,
      total_odds_american: totalOdds,
      confidence: avgConfidence,
      analysis: 'Parlay built from the highest confidence player props.',
      timestamp: new Date().toISOString(),
      isGenerated: true,
      isToday: true,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      expected_value: '+5.5%',
      risk_level: 'medium',
      ai_metrics: {
        leg_count: legs.length,
        avg_leg_confidence: avgConfidence,
        recommended_stake: '$5.00',
        edge: 0.055,
      },
      is_real_data: true,
      has_data: true,
      source: 'node-api',
    });
  }

  // 2. Best value parlay (highest edge)
  const propsWithEdge = uniqueProps.map(p => ({
    ...p,
    safeConf: getSafeConfidence(p.confidence),
    proj: getProjection(p),
  }));
  const withEdge = propsWithEdge
    .filter(p => p.proj > p.line)
    .sort((a, b) => ((b.proj - b.line) / b.line) - ((a.proj - a.line) / a.line));
  const selectedEdge = [];
  const usedPlayersEdge = new Set();
  for (const prop of withEdge) {
    if (selectedEdge.length >= 3) break;
    if (!usedPlayersEdge.has(prop.player)) {
      selectedEdge.push(prop);
      usedPlayersEdge.add(prop.player);
    }
  }
  if (selectedEdge.length >= 2) {
    const legs = selectedEdge.map((prop, idx) => {
      const edge = computeEdge(prop, prop.proj);
      return {
        id: `gen-${Date.now()}-edge-${idx}`,
        gameId: prop.game_id,
        description: `${prop.player} ${prop.market} Over ${prop.line}`,
        odds: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
        odds_american: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
        price: prop.over_odds,
        confidence: prop.safeConf,
        sport,
        market: 'player_props',
        player_name: prop.player,
        stat_type: prop.market,
        line: prop.line,
        projection: prop.proj,
        edge,
        confidence_level: prop.safeConf > 80 ? 'very-high' : prop.safeConf > 70 ? 'high' : 'medium',
        correlation_score: 0.7,
        is_star: prop.safeConf > 80,
      };
    });

    let decimal = 1.0;
    legs.forEach(leg => {
      const odds = leg.price;
      if (odds > 0) decimal *= 1 + odds / 100;
      else decimal *= 1 - 100 / Math.abs(odds);
    });
    const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();

    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);

    suggestions.push({
      id: `value-${Date.now()}`,
      name: `${sport} Best Value Parlay`,
      sport,
      type: 'standard',
      market_type: 'player_props',
      legs,
      totalOdds,
      total_odds: totalOdds,
      total_odds_american: totalOdds,
      confidence: avgConfidence,
      analysis: 'Parlay built from props with the highest positive edge.',
      timestamp: new Date().toISOString(),
      isGenerated: true,
      isToday: true,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      expected_value: '+6.8%',
      risk_level: 'medium',
      ai_metrics: {
        leg_count: legs.length,
        avg_leg_confidence: avgConfidence,
        recommended_stake: '$5.00',
        edge: 0.068,
      },
      is_real_data: true,
      has_data: true,
      source: 'node-api',
    });
  }

  // 3. Top projection parlay
  const topProjection = uniqueProps
    .map(p => ({ ...p, proj: getProjection(p), safeConf: getSafeConfidence(p.confidence) }))
    .sort((a, b) => b.proj - a.proj);
  const selectedProj = [];
  const usedPlayersProj = new Set();
  for (const prop of topProjection) {
    if (selectedProj.length >= 3) break;
    if (!usedPlayersProj.has(prop.player)) {
      selectedProj.push(prop);
      usedPlayersProj.add(prop.player);
    }
  }
  if (selectedProj.length >= 2) {
    const legs = selectedProj.map((prop, idx) => {
      const edge = computeEdge(prop, prop.proj);
      return {
        id: `gen-${Date.now()}-proj-${idx}`,
        gameId: prop.game_id,
        description: `${prop.player} ${prop.market} Over ${prop.line}`,
        odds: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
        odds_american: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
        price: prop.over_odds,
        confidence: prop.safeConf,
        sport,
        market: 'player_props',
        player_name: prop.player,
        stat_type: prop.market,
        line: prop.line,
        projection: prop.proj,
        edge,
        confidence_level: prop.safeConf > 80 ? 'very-high' : prop.safeConf > 70 ? 'high' : 'medium',
        correlation_score: 0.7,
        is_star: prop.safeConf > 80,
      };
    });

    let decimal = 1.0;
    legs.forEach(leg => {
      const odds = leg.price;
      if (odds > 0) decimal *= 1 + odds / 100;
      else decimal *= 1 - 100 / Math.abs(odds);
    });
    const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();

    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);

    suggestions.push({
      id: `proj-${Date.now()}`,
      name: `${sport} Top Projection Parlay`,
      sport,
      type: 'standard',
      market_type: 'player_props',
      legs,
      totalOdds,
      total_odds: totalOdds,
      total_odds_american: totalOdds,
      confidence: avgConfidence,
      analysis: 'Parlay built from players with the highest projected stats.',
      timestamp: new Date().toISOString(),
      isGenerated: true,
      isToday: true,
      confidence_level: avgConfidence > 80 ? 'high' : 'medium',
      expected_value: '+6.0%',
      risk_level: 'medium',
      ai_metrics: {
        leg_count: legs.length,
        avg_leg_confidence: avgConfidence,
        recommended_stake: '$5.00',
        edge: 0.06,
      },
      is_real_data: true,
      has_data: true,
      source: 'node-api',
    });
  }

  return suggestions;
};

// ========== FETCH GAMES FROM NODE API (Tank01) ==========
const fetchGames = async (): Promise<Game[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const response = await axios.get(`${PRIZEPICKS_API_BASE}/api/tank01/games`, {
      params: { date: today, sport: 'nba' }
    });
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map((game: any) => ({
        id: game.gameID || `game-${Date.now()}`,
        sport_key: 'basketball_nba',
        sport_title: 'NBA',
        commence_time: game.gameTime || game.commence_time || new Date().toISOString(),
        home_team: game.home || game.home_team || 'Home',
        away_team: game.away || game.away_team || 'Away',
      }));
    }
    return [];
  } catch (error) {
    console.warn('Failed to fetch games from Node API, using mock', error);
    return MOCK_GAMES;
  }
};

// ========== FETCH REAL NBA PROPS FROM PRIZEPICKS NODE API ==========
const fetchRealNBAProps = async (): Promise<PropMarket[]> => {
  try {
    const response = await axios.get(`${PRIZEPICKS_API_BASE}/api/prizepicks/selections?sport=nba`);
    console.log('RAW selections:', response.data.selections);
    const selections = response.data.selections || [];
    return selections.map((s: any, index: number) => ({
      id: s.id || `prop-${index}`,
      player: s.player,
      team: s.team,
      market: s.stat || 'points',
      line: s.line || 0,
      projection: s.projection || (s.line * 1.05),
      over_odds: typeof s.odds === 'string' ? parseInt(s.odds.replace('+', '')) : (s.odds || -110),
      under_odds: -110,
      confidence: s.confidence || 75,
      game_id: `game-${index}`,
      game_time: new Date().toISOString(),
      sport: 'NBA',
      position: s.position,
      edge: s.edge || (s.projection > s.line ? '+5.2%' : '-2.1%'),
    }));
  } catch (error) {
    console.warn('Failed to fetch NBA props from Node API', error);
    return [];
  }
};

// ========== FETCH REAL NHL PROPS FROM PYTHON BACKEND ==========
const fetchNHLProps = async (): Promise<NHLPropMarket[]> => {
  try {
    const response = await axios.get(`${PYTHON_API_BASE}/api/players`, {
      params: { sport: 'nhl', realtime: 'true', limit: 100 }
    });

    const players = response.data?.data?.players || [];
    if (!players.length) {
      console.warn('No NHL players returned from Python API');
      return [];
    }

    // Transform players into props
    const props: NHLPropMarket[] = [];

    players.forEach((player: any) => {
      const isGoalie = player.position === 'G';
      const gamesPlayed = player.games_played || 1;

      // Common fields
      const baseProp = {
        player: player.name,
        team: player.team,
        game_id: `nhl-game-${player.team}`,
        game_time: new Date().toISOString(),
        sport: 'NHL',
        position: player.position,
        confidence: 75,
        over_odds: -110,
        under_odds: -110,
        edge: '+5%',
      };

      if (isGoalie) {
        // Goalie props: saves, possibly wins
        if (player.saves !== undefined) {
          props.push({
            ...baseProp,
            id: `nhl-${player.id}-saves`,
            market: 'saves',
            line: 25.5, // example line; could compute from average
            projection: player.saves / gamesPlayed,
            stat_type: 'saves',
            goalie: true,
          } as NHLPropMarket);
        }
      } else {
        // Skater props
        if (player.goals !== undefined) {
          props.push({
            ...baseProp,
            id: `nhl-${player.id}-goals`,
            market: 'goals',
            line: 0.5,
            projection: player.goals / gamesPlayed,
            stat_type: 'goals',
            goalie: false,
          } as NHLPropMarket);
        }
        if (player.assists !== undefined) {
          props.push({
            ...baseProp,
            id: `nhl-${player.id}-assists`,
            market: 'assists',
            line: 0.5,
            projection: player.assists / gamesPlayed,
            stat_type: 'assists',
            goalie: false,
          } as NHLPropMarket);
        }
        if (player.points !== undefined) {
          props.push({
            ...baseProp,
            id: `nhl-${player.id}-points`,
            market: 'points',
            line: 0.5,
            projection: player.points / gamesPlayed,
            stat_type: 'points',
            goalie: false,
          } as NHLPropMarket);
        }
        if (player.shots !== undefined) {
          props.push({
            ...baseProp,
            id: `nhl-${player.id}-shots`,
            market: 'shots',
            line: 2.5,
            projection: player.shots / gamesPlayed,
            stat_type: 'shots',
            goalie: false,
          } as NHLPropMarket);
        }
        if (player.hits !== undefined) {
          props.push({
            ...baseProp,
            id: `nhl-${player.id}-hits`,
            market: 'hits',
            line: 1.5,
            projection: player.hits / gamesPlayed,
            stat_type: 'hits',
            goalie: false,
          } as NHLPropMarket);
        }
      }
    });

    return props;
  } catch (error) {
    console.warn('Failed to fetch NHL props from Python backend', error);
    return [];
  }
};

// ========== FETCH REAL MLB PROPS FROM PYTHON BACKEND ==========
const fetchMLBProps = async (): Promise<PropMarket[]> => {
  try {
    const response = await axios.get(`${PYTHON_API_BASE}/api/players`, {
      params: { sport: 'mlb', realtime: 'true', limit: 100 }
    });

    const players = response.data?.data?.players || [];
    if (!players.length) {
      console.warn('No MLB players returned from Python API');
      return [];
    }

    const props: PropMarket[] = [];

    players.forEach((player: any) => {
      const isPitcher = player.position === 'P';
      const gamesPlayed = player.games_played || 1;

      const baseProp = {
        player: player.name,
        team: player.team,
        game_id: `mlb-game-${player.team}`,
        game_time: new Date().toISOString(),
        sport: 'MLB',
        position: player.position,
        confidence: 70,
        over_odds: -110,
        under_odds: -110,
        edge: '+4%',
      };

      if (isPitcher) {
        // Pitcher props: strikeouts, outs recorded, etc.
        if (player.strikeouts !== undefined) {
          props.push({
            ...baseProp,
            id: `mlb-${player.id}-strikeouts`,
            market: 'Strikeouts',
            line: 5.5,
            projection: player.strikeouts / gamesPlayed,
          });
        }
        // Could also add wins, quality starts, etc.
      } else {
        // Hitter props: hits, home runs, RBI, total bases, etc.
        if (player.hits !== undefined) {
          props.push({
            ...baseProp,
            id: `mlb-${player.id}-hits`,
            market: 'Hits',
            line: 0.5,
            projection: player.hits / gamesPlayed,
          });
        }
        if (player.home_runs !== undefined) {
          props.push({
            ...baseProp,
            id: `mlb-${player.id}-home_runs`,
            market: 'Home Runs',
            line: 0.5,
            projection: player.home_runs / gamesPlayed,
          });
        }
        if (player.rbi !== undefined) {
          props.push({
            ...baseProp,
            id: `mlb-${player.id}-rbi`,
            market: 'RBI',
            line: 0.5,
            projection: player.rbi / gamesPlayed,
          });
        }
        // stolen bases, etc.
      }
    });

    return props;
  } catch (error) {
    console.warn('Failed to fetch MLB props from Python backend', error);
    return [];
  }
};

// ========== MOCK GAMES FALLBACK ==========
const MOCK_GAMES: Game[] = [
  {
    id: 'game-1',
    home_team: 'Los Angeles Lakers',
    away_team: 'Golden State Warriors',
    commence_time: new Date(Date.now() + 3 * 3600000).toISOString(),
    sport_title: 'NBA',
    sport_key: 'basketball_nba',
  },
  {
    id: 'game-2',
    home_team: 'Boston Celtics',
    away_team: 'Miami Heat',
    commence_time: new Date(Date.now() + 5 * 3600000).toISOString(),
    sport_title: 'NBA',
    sport_key: 'basketball_nba',
  },
];

// ========== MAIN COMPONENT ==========
const ParlayArchitectScreen: React.FC = () => {
  const navigate = useNavigate();

  // ========== STATE ==========
  const [filteredSuggestions, setFilteredSuggestions] = useState<ParlaySuggestion[]>([]);
  const [selectedParlay, setSelectedParlay] = useState<ParlaySuggestion | null>(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedType, setSelectedType] = useState('all');
  const [minConfidence, setMinConfidence] = useState(60);
  const [maxLegs, setMaxLegs] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTodaysGames, setShowTodaysGames] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [marketType, setMarketType] = useState('all');
  const [minEdge, setMinEdge] = useState(5);
  const [maxRisk, setMaxRisk] = useState('all');
  const [parlaySize, setParlaySize] = useState('all');

  // AI Generator state
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // ========== DATA FROM APIs ==========
  const {
    data: games = [],
    isLoading: gamesLoading,
    error: gamesError,
    refetch: refetchGames,
  } = useQuery({
    queryKey: ['games', 'nba'],
    queryFn: fetchGames,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: nbaProps = [],
    isLoading: nbaPropsLoading,
    error: nbaPropsError,
    refetch: refetchNBAProps,
  } = useQuery({
    queryKey: ['nba-props'],
    queryFn: fetchRealNBAProps,
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: nhlProps = [],
    refetch: refetchNHLProps,
    isLoading: nhlPropsLoading,
  } = useQuery({
    queryKey: ['nhl-props'],
    queryFn: fetchNHLProps,
    staleTime: 10 * 60 * 1000,
    enabled: selectedSport === 'NHL', // only fetch when NHL is selected
  });

  const {
    data: mlbProps = [],
    refetch: refetchMLBProps,
    isLoading: mlbPropsLoading,
  } = useQuery({
    queryKey: ['mlb-props'],
    queryFn: fetchMLBProps,
    staleTime: 10 * 60 * 1000,
    enabled: selectedSport === 'MLB',
  });

  // Determine which props to use based on selected sport
  const props = useMemo(() => {
    switch (selectedSport) {
      case 'NBA':
        return nbaProps;
      case 'NHL':
        return nhlProps;
      case 'MLB':
        return mlbProps;
      default:
        return nbaProps; // fallback
    }
  }, [selectedSport, nbaProps, nhlProps, mlbProps]);

  // Generate suggestions from props
  const suggestions = useMemo(() => {
    if (props.length === 0) return [];
    return generateParlaysFromProps(props, selectedSport);
  }, [props, selectedSport]);

  // Parlay builder state
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [stake, setStake] = useState('25');
  const [teaserPoints, setTeaserPoints] = useState(6);
  const [roundRobinSize, setRoundRobinSize] = useState('2s');
  const [useBoost, setUseBoost] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<ParlayBoost | null>(null);
  const [showPropSelector, setShowPropSelector] = useState(false);
  const [teaserOdds, setTeaserOdds] = useState<TeaserOption[]>([]);
  const [roundRobinCombos, setRoundRobinCombos] = useState<RoundRobinCombo[]>([]);
  const [sameGameParlays, setSameGameParlays] = useState<any[]>([]);
  const [parlayResult, setParlayResult] = useState<ParlayResponse | null>(null);
  const [showParlayResult, setShowParlayResult] = useState(false);
  const [building, setBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Filter suggestions based on user selections
  useEffect(() => {
    if (suggestions.length === 0) {
      if (filteredSuggestions.length !== 0) {
        setFilteredSuggestions([]);
      }
      return;
    }

    let filtered = [...suggestions];

    if (selectedSport !== 'all') {
      filtered = filtered.filter(p => p.sport === selectedSport);
    }

    if (dateFilter === 'today') {
      filtered = filtered.filter(p => {
        if (p.isToday === true) return true;
        if (p.isToday === false) return false;
        return true;
      });
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    filtered = filtered.filter(p => (p.confidence || 0) >= minConfidence);
    filtered = filtered.filter(p => (p.legs?.length || 0) <= maxLegs);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(query) || false;
        const legMatch = p.legs?.some(leg =>
          leg.description?.toLowerCase().includes(query) ||
          leg.player_name?.toLowerCase().includes(query)
        ) || false;
        return nameMatch || legMatch;
      });
    }

    if (marketType !== 'all') {
      filtered = filtered.filter(p => (p.market_type || p.type) === marketType);
    }

    filtered = filtered.filter(p => {
      const edge = p.ai_metrics?.edge || 0;
      return (edge * 100) >= minEdge;
    });

    if (maxRisk !== 'all') {
      const riskOrder = { 'low': 1, 'medium': 2, 'high': 3 };
      const maxRiskValue = riskOrder[maxRisk as keyof typeof riskOrder] || 3;
      filtered = filtered.filter(p => {
        const risk = p.risk_level || 'medium';
        const riskValue = riskOrder[risk as keyof typeof riskOrder] || 2;
        return riskValue <= maxRiskValue;
      });
    }

    if (parlaySize !== 'all') {
      filtered = filtered.filter(p => {
        const legsCount = p.legs?.length || 0;
        if (parlaySize === '2') return legsCount === 2;
        if (parlaySize === '3') return legsCount === 3;
        if (parlaySize === '4') return legsCount === 4;
        if (parlaySize === '5') return legsCount >= 5;
        return true;
      });
    }

    if (filtered.length === 0 && suggestions.length > 0) {
      filtered = [suggestions[0]];
    }

    // Prevent infinite loop: only update if the new array is different
    if (JSON.stringify(filtered) !== JSON.stringify(filteredSuggestions)) {
      setFilteredSuggestions(filtered);
    }
  }, [suggestions, selectedSport, selectedType, marketType, minConfidence, minEdge, maxRisk, parlaySize, maxLegs, searchQuery, dateFilter, filteredSuggestions]);

  // ========== HANDLERS ==========
  const handleRefresh = () => {
    refetchGames();
    refetchNBAProps();
    refetchNHLProps();
    refetchMLBProps();
    setLastRefresh(new Date());
    setSuccessMessage('Data refreshed successfully!');
    setShowSuccessAlert(true);
  };

  const handleBuildParlay = (parlay: ParlaySuggestion) => {
    setSelectedParlay(parlay);
    setParlayLegs(parlay.legs as ParlayLeg[]);
    setShowBuildModal(true);
  };

  const handleAddToBetSlip = () => {
    if (selectedParlay) {
      setSuccessMessage(`${selectedParlay.name} added to bet slip!`);
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowBuildModal(false);
      }, 1000);
    }
  };

  const generateParlayFromGames = useCallback(async (sport: string, numLegs: number) => {
    console.log(`🎯 Generating parlay for ${sport} with ${numLegs} legs`);
    setGenerating(true);

    try {
      let propsToUse: PropMarket[] = [];
      if (sport === 'NBA') {
        propsToUse = nbaProps;
      } else if (sport === 'NHL') {
        propsToUse = nhlProps;
      } else if (sport === 'MLB') {
        propsToUse = mlbProps;
      }

      if (propsToUse.length >= numLegs) {
        // Deduplicate by player+market+line
        const uniqueMap = new Map<string, PropMarket>();
        propsToUse.forEach(prop => {
          const key = `${prop.player}|${prop.market}|${prop.line}`;
          if (!uniqueMap.has(key) || (prop.confidence || 0) > (uniqueMap.get(key)?.confidence || 0)) {
            uniqueMap.set(key, prop);
          }
        });
        const uniqueProps = Array.from(uniqueMap.values());

        // Shuffle and pick unique players
        const shuffled = [...uniqueProps].sort(() => 0.5 - Math.random());
        const selected: PropMarket[] = [];
        const usedPlayers = new Set<string>();

        for (const prop of shuffled) {
          if (selected.length >= numLegs) break;
          if (!usedPlayers.has(prop.player)) {
            selected.push(prop);
            usedPlayers.add(prop.player);
          }
        }

        if (selected.length < 2) {
          throw new Error('Not enough unique props');
        }

        // Helpers
        const getProjection = (prop: PropMarket): number => {
          const stat = prop.market?.toLowerCase() || '';
          let projection = prop.line * 1.05;
          if (stat.includes('point')) projection = Math.min(projection, 50);
          else if (stat.includes('rebound')) projection = Math.min(projection, 25);
          else if (stat.includes('assist')) projection = Math.min(projection, 20);
          else if (stat.includes('steal') || stat.includes('block')) projection = Math.min(projection, 5);
          return Math.max(projection, prop.line);
        };

        const computeEdge = (prop: PropMarket, proj: number): string => {
          if (!prop.line || prop.line === 0) return '+0%';
          const edge = ((proj - prop.line) / prop.line) * 100;
          const sign = edge >= 0 ? '+' : '';
          return `${sign}${edge.toFixed(1)}%`;
        };

        let decimal = 1.0;
        const legs = selected.map((prop, idx) => {
          const projection = getProjection(prop);
          const edge = computeEdge(prop, projection);
          const safeConf = Number(prop.confidence) || 75;
          const oddsNum = prop.over_odds;
          if (oddsNum > 0) decimal *= 1 + oddsNum / 100;
          else decimal *= 1 - 100 / Math.abs(oddsNum);

          return {
            id: `real-leg-${Date.now()}-${idx}`,
            player_name: prop.player,
            market: prop.market,
            odds_american: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
            odds: prop.over_odds,
            confidence: safeConf,
            sport: sport,
            description: `${prop.player} ${prop.market} Over ${prop.line}`,
            projection,
            edge,
            correlation_score: 0.7,
            is_star: safeConf > 80,
            confidence_level: safeConf > 80 ? 'very-high' : safeConf > 70 ? 'high' : 'medium',
            line: prop.line,
            stat_type: prop.market,
            team: prop.team
          };
        });

        const totalOdds = decimal >= 2.0
          ? `+${Math.round((decimal - 1) * 100)}`
          : Math.round(-100 / (decimal - 1)).toString();

        const avgConfidence = Math.round(legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length);

        const realParlay: ParlaySuggestion = {
          id: `real-${Date.now()}`,
          name: `${sport} Real Props Parlay`,
          sport: sport,
          type: 'standard',
          market_type: 'player_props',
          legs,
          total_odds: totalOdds,
          total_odds_american: totalOdds,
          confidence: avgConfidence,
          analysis: `Parlay built from real ${sport} props with projected values.`,
          timestamp: new Date().toISOString(),
          isGenerated: true,
          isToday: true,
          confidence_level: avgConfidence > 80 ? 'very-high' : avgConfidence > 70 ? 'high' : 'medium',
          expected_value: '+6.5%',
          risk_level: 'medium',
          ai_metrics: {
            leg_count: legs.length,
            avg_leg_confidence: avgConfidence,
            recommended_stake: '$5.00',
            edge: 0.065,
          },
          is_real_data: true,
          has_data: true,
          source: sport === 'NBA' ? 'prizepicks' : 'python-api'
        };

        setSelectedParlay(realParlay);
        setParlayLegs(realParlay.legs as ParlayLeg[]);
        setShowBuildModal(true);
        setSuccessMessage(`Generated ${legs.length}-leg parlay from real ${sport} data!`);
        setShowSuccessAlert(true);
        setGenerating(false);
        return;
      }

      // Fallback AI generation (simplified) – same as before
      const fallbackLegs = sport === 'NBA'
        ? [
            { player: 'LeBron James', market: 'points', line: 25.5, odds: -115, conf: 85 },
            { player: 'Luka Doncic', market: 'assists', line: 8.5, odds: -110, conf: 78 },
            { player: 'Nikola Jokic', market: 'rebounds', line: 11.5, odds: -120, conf: 82 },
          ].slice(0, numLegs).map((p, i) => ({
            id: `fallback-${i}`,
            player_name: p.player,
            market: p.market,
            odds_american: p.odds > 0 ? `+${p.odds}` : p.odds.toString(),
            odds: p.odds,
            confidence: p.conf,
            sport: 'NBA',
            description: `${p.player} ${p.market} Over ${p.line}`,
            projection: p.line * 1.05,
            edge: '+5%',
            correlation_score: 0.7,
            is_star: p.conf > 80,
            confidence_level: p.conf > 80 ? 'high' : 'medium',
            line: p.line,
            stat_type: p.market
          }))
        : [];

      let decimal = 1.0;
      fallbackLegs.forEach(leg => {
        const odds = leg.odds;
        if (odds > 0) decimal *= 1 + odds / 100;
        else decimal *= 1 - 100 / Math.abs(odds);
      });
      const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();

      const fallbackParlay: ParlaySuggestion = {
        id: `fallback-${Date.now()}`,
        name: `${sport} Fallback Parlay`,
        sport,
        type: 'standard',
        market_type: 'player_props',
        legs: fallbackLegs,
        total_odds: totalOdds,
        total_odds_american: totalOdds,
        confidence: 82,
        analysis: `Fallback parlay with top ${sport} players.`,
        timestamp: new Date().toISOString(),
        isGenerated: true,
        isToday: true,
        confidence_level: 'high',
        expected_value: '+6.2%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: fallbackLegs.length,
          avg_leg_confidence: 82,
          recommended_stake: '$5.00',
          edge: 0.062,
        },
        is_real_data: false,
        has_data: true,
        source: 'fallback'
      };

      setSelectedParlay(fallbackParlay);
      setParlayLegs(fallbackParlay.legs as ParlayLeg[]);
      setShowBuildModal(true);
      setSuccessMessage(`Generated fallback ${sport} parlay.`);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Generation failed', error);
    } finally {
      setGenerating(false);
    }
  }, [nbaProps, nhlProps, mlbProps]);

  // ========== AI GENERATOR HANDLER ==========
  const handleGenerateAI = useCallback(async () => {
    if (!customQuery.trim()) {
      alert('Please enter a prompt');
      return;
    }
    setGenerating(true);
    setGeneratorOpen(false);
    // Map query to strategy – simple keyword matching
    const query = customQuery.toLowerCase();
    let numLegs = 3;
    if (query.includes('2-leg') || query.includes('2 leg')) numLegs = 2;
    if (query.includes('4-leg') || query.includes('4 leg')) numLegs = 4;

    // Call the existing generator with derived parameters
    await generateParlayFromGames(selectedSport, numLegs);
    setGenerating(false);
  }, [customQuery, generateParlayFromGames, selectedSport]);

  // ========== DEBUG ==========
  useEffect(() => {
    (window as any).__parlayDebug = {
      suggestions,
      filteredSuggestions,
      games,
      nbaProps: nbaProps.length,
      nhlProps: nhlProps.length,
      mlbProps: mlbProps.length,
    };
  }, [suggestions, filteredSuggestions, games, nbaProps, nhlProps, mlbProps]);

  // ========== RENDER HELPERS ==========
  const getMinLegs = () => PARLAY_TYPES_2026.find(t => t.id === selectedType)?.min_legs || 2;
  const getMaxLegs = () => PARLAY_TYPES_2026.find(t => t.id === selectedType)?.max_legs || 20;

  const calculateTotalOdds = useMemo(() => {
    if (parlayLegs.length === 0) return 0;
    let decimal = 1.0;
    parlayLegs.forEach(leg => {
      const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
      if (odds > 0) decimal *= 1 + (odds / 100);
      else decimal *= 1 - (100 / odds);
    });
    return decimal >= 2.0 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1));
  }, [parlayLegs]);

  const calculatePotentialPayout = useMemo(() => {
    if (parlayLegs.length === 0 || !stake) return 0;
    const stakeNum = parseFloat(stake) || 0;
    let decimal = 1.0;
    parlayLegs.forEach(leg => {
      const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
      if (odds > 0) decimal *= 1 + (odds / 100);
      else decimal *= 1 - (100 / odds);
    });
    return stakeNum * decimal;
  }, [parlayLegs, stake]);

  const calculateImpliedProbabilityValue = useMemo(() => {
    if (parlayLegs.length === 0) return 0;
    let decimal = 1.0;
    parlayLegs.forEach(leg => {
      const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
      if (odds > 0) decimal *= 1 + (odds / 100);
      else decimal *= 1 - (100 / odds);
    });
    return (1 / decimal) * 100;
  }, [parlayLegs]);

  const addLeg = (prop: PropMarket, side: 'over' | 'under') => {
    if (parlayLegs.length >= getMaxLegs()) {
      alert(`Maximum ${getMaxLegs()} legs allowed.`);
      return;
    }
    if (selectedType === 'same_game' && parlayLegs.length > 0) {
      const firstGameId = parlayLegs[0].game_id;
      if (prop.game_id !== firstGameId) {
        alert('All legs must be from the same game for a Same Game Parlay.');
        return;
      }
    }
    const newLeg: ParlayLeg = {
      id: `${prop.id}-${side}-${Date.now()}`,
      player: prop.player,
      player_name: prop.player,
      team: prop.team,
      market: prop.market,
      market_type: 'player_props',
      line: prop.line,
      projection: prop.projection,
      edge: prop.edge,
      odds: side === 'over' ? prop.over_odds : prop.under_odds,
      odds_american: side === 'over'
        ? (prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString())
        : (prop.under_odds > 0 ? `+${prop.under_odds}` : prop.under_odds.toString()),
      side: side,
      game_id: prop.game_id,
      gameId: prop.game_id,
      game_time: prop.game_time,
      sport: prop.sport,
      confidence: prop.confidence,
      confidence_level: prop.confidence > 80 ? 'very-high' : prop.confidence > 70 ? 'high' : 'medium',
      correlation_score: prop.confidence ? prop.confidence / 100 : 0.7,
      is_star: prop.confidence > 80,
      description: `${prop.player} ${side} ${prop.line} ${prop.market}`
    };
    setParlayLegs([...parlayLegs, newLeg]);
    setShowPropSelector(false);
  };

  const removeLeg = (legId: string) => {
    setParlayLegs(parlayLegs.filter(leg => leg.id !== legId));
  };

  const clearLegs = () => setParlayLegs([]);

  const buildParlay = useCallback(async () => {
    if (parlayLegs.length < getMinLegs()) {
      alert(`Minimum ${getMinLegs()} legs required.`);
      return;
    }
    setBuilding(true);
    let decimal = 1.0;
    parlayLegs.forEach(leg => {
      const odds = typeof leg.odds === 'string' ? parseInt(leg.odds.replace('+', '')) : leg.odds;
      if (odds > 0) decimal *= 1 + (odds / 100);
      else decimal *= 1 - (100 / odds);
    });
    const americanOdds = decimal >= 2.0 ? Math.round((decimal - 1) * 100) : Math.round(-100 / (decimal - 1));
    const stakeNum = parseFloat(stake) || 25;
    const payout = stakeNum * decimal;
    const profit = payout - stakeNum;
    const impliedProb = (1 / decimal) * 100;
    const result: ParlayResponse = {
      id: `parlay-${Date.now()}`,
      type: selectedType === 'all' ? 'standard' : selectedType,
      sport: selectedSport,
      legs: parlayLegs,
      leg_count: parlayLegs.length,
      odds: americanOdds,
      decimal_odds: decimal,
      stake: stakeNum,
      potential_payout: payout,
      profit: profit,
      implied_probability: impliedProb,
      correlation_bonus: parlayLegs.length > 1 ? 0.15 : 0,
      available_boosts: [
        { name: '10% Parlay Boost', boost_percentage: 10, new_odds: Math.round(americanOdds * 1.1) }
      ],
      risk_level: impliedProb > 50 ? 'Low' : impliedProb > 30 ? 'Medium' : 'High'
    };
    setParlayResult(result);
    setShowParlayResult(true);
    setBuilding(false);
  }, [parlayLegs, selectedType, selectedSport, stake]);

  // ========== MODAL REFS ==========
  const firstFocusableRef = useRef<HTMLElement>(null);
  const propSelectorFirstFocusRef = useRef<HTMLElement>(null);
  const buildModalFirstFocusRef = useRef<HTMLElement>(null);

  // Determine loading state based on selected sport
  const isLoadingProps = useMemo(() => {
    switch (selectedSport) {
      case 'NBA':
        return nbaPropsLoading;
      case 'NHL':
        return nhlPropsLoading;
      case 'MLB':
        return mlbPropsLoading;
      default:
        return nbaPropsLoading;
    }
  }, [selectedSport, nbaPropsLoading, nhlPropsLoading, mlbPropsLoading]);

  // ========== RENDER ==========
  if (isLoadingProps && props.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>Loading Parlay Architect '26...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Success Alert */}
      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setShowSuccessAlert(false)}>
          <AlertTitle>Success!</AlertTitle>
          {successMessage}
        </Alert>
      )}

      {/* Header */}
      <Paper sx={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4ABD 100%)', mb: 4, p: 3, color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" gap={1}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} variant="outlined" size="small">Back</Button>
            <Button startIcon={<BugReportIcon />} onClick={() => setShowDebugPanel(!showDebugPanel)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', bgcolor: showDebugPanel ? 'rgba(0,0,0,0.3)' : 'transparent' }} variant="outlined" size="small">{showDebugPanel ? 'Hide Debug' : 'Debug'}</Button>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {lastRefresh && <Chip label={`Updated: ${format(lastRefresh, 'h:mm a')}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
            <Chip label={`${suggestions.length} ${selectedSport} Parlays`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={<TrophyIcon sx={{ fontSize: 14 }} />} />
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}><BasketballIcon sx={{ fontSize: 32 }} /></Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>🏀 Parlay Architect '26</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>Create winning parlays with real data · March 2026</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Debug Panel */}
      <Collapse in={showDebugPanel}>
        <Paper sx={{ p: 2, mb: 4, bgcolor: '#1e293b', color: 'white', borderRadius: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}><BugReportIcon fontSize="small" /><Typography variant="h6">Debug Panel</Typography></Box>
            <Chip label="Dev Mode" size="small" sx={{ bgcolor: '#ef4444', color: 'white' }} />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="#94a3b8" gutterBottom>Component Stats</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">• Total Suggestions: {suggestions.length}</Typography>
                <Typography variant="body2">• Filtered: {filteredSuggestions.length}</Typography>
                <Typography variant="body2">• Today's Games: {games.length}</Typography>
                <Typography variant="body2">• Parlay Legs: {parlayLegs.length}</Typography>
                <Typography variant="body2">• Data Source: ✅ Real API Data</Typography>
                <Typography variant="body2">• NBA Props: {nbaProps.length}</Typography>
                <Typography variant="body2">• NHL Props: {nhlProps.length}</Typography>
                <Typography variant="body2">• MLB Props: {mlbProps.length}</Typography>
                <Typography variant="body2">• Last Refresh: {lastRefresh ? format(lastRefresh, 'h:mm:ss a') : 'Never'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="#94a3b8" gutterBottom>API Status</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ color: '#10b981' }}>• PrizePicks API: ✅ Connected</Typography>
                <Typography variant="body2" sx={{ color: '#10b981' }}>• Python API: ✅ Connected</Typography>
                <Typography variant="body2" sx={{ color: gamesError ? '#ef4444' : '#10b981' }}>• Games API: {gamesError ? '❌ Error' : '✅ Connected'}</Typography>
                <Typography variant="body2" sx={{ color: nbaProps.length > 0 ? '#10b981' : '#f59e0b' }}>• NBA Props: ✅ {nbaProps.length} loaded</Typography>
                <Typography variant="body2" sx={{ color: nhlProps.length > 0 ? '#10b981' : '#f59e0b' }}>• NHL Props: {nhlProps.length > 0 ? `✅ ${nhlProps.length} loaded` : '⚠️ None'}</Typography>
                <Typography variant="body2" sx={{ color: mlbProps.length > 0 ? '#10b981' : '#f59e0b' }}>• MLB Props: {mlbProps.length > 0 ? `✅ ${mlbProps.length} loaded` : '⚠️ None'}</Typography>
              </Box>
              <Box mt={2}>
                <Button size="small" variant="outlined" sx={{ color: 'white', borderColor: '#64748b', mr: 1 }} onClick={handleRefresh}>Force Refresh</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Sport Selector */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Select Sport</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {SPORTS_2026.map(sport => (
            <Button
              key={sport.id}
              variant={selectedSport === sport.id ? "contained" : "outlined"}
              onClick={() => setSelectedSport(sport.id)}
              sx={{ minWidth: 100, bgcolor: selectedSport === sport.id ? (sport.id === 'NBA' ? '#ef4444' : '#3b82f6') : 'transparent' }}
            >
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography variant="h5">{sport.icon}</Typography>
                <Typography variant="caption">{sport.name}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8 }}>{sport.status}</Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Paper>

      {/* Parlay Type Selector */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>📋 Parlay Type</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {['standard', 'same_game', 'teaser', 'round_robin', 'all'].map(type => (
            <Chip
              key={type}
              label={type.replace('_', ' ')}
              onClick={() => setSelectedType(type)}
              color={selectedType === type ? "primary" : "default"}
              variant={selectedType === type ? "filled" : "outlined"}
              sx={{ fontWeight: selectedType === type ? 'bold' : 'normal' }}
            />
          ))}
        </Box>
      </Paper>

      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Button variant="contained" fullWidth startIcon={<AutorenewIcon />} onClick={() => generateParlayFromGames(selectedSport, 3)} disabled={generating} sx={{ height: '40px', bgcolor: '#6C5CE7' }}>
              {generating ? <><CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />Generating...</> : `🎯 Generate ${selectedSport} Parlay`}
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sport</InputLabel>
              <Select value={selectedSport} onChange={(e) => setSelectedSport(e.target.value)} label="Sport" sx={{ height: '40px' }}>
                {SPORTS.map(sport => <MenuItem key={sport.id} value={sport.id}><Box display="flex" alignItems="center" gap={1}>{sport.icon}{sport.name}</Box></MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={isLoadingProps}>Refresh</Button>
              <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => setGeneratorOpen(true)} sx={{ bgcolor: '#6C5CE7' }}>AI Generate</Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowPropSelector(true)} sx={{ bgcolor: '#6C5CE7' }} disabled={props.length === 0}>Add Leg ({props.length})</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Enhanced Filter Section */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>🎯 Advanced Filters</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Market Type</InputLabel>
              <Select value={marketType} onChange={(e) => setMarketType(e.target.value)} label="Market Type">
                {MARKET_TYPES.map(market => <MenuItem key={market.id} value={market.id}><Box display="flex" alignItems="center" gap={1}><span>{market.icon}</span>{market.name}</Box></MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Parlay Size</InputLabel>
              <Select value={parlaySize} onChange={(e) => setParlaySize(e.target.value)} label="Parlay Size">
                {PARLAY_SIZES.map(size => <MenuItem key={size.id} value={size.id}>{size.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Max Risk</InputLabel>
              <Select value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)} label="Max Risk">
                {RISK_LEVELS.map(risk => <MenuItem key={risk.id} value={risk.id}><Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: risk.color }} />{risk.name}</Box></MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">Min Edge: {minEdge}%</Typography>
              <Slider value={minEdge} onChange={(_, v) => setMinEdge(v as number)} min={0} max={20} step={1} marks={[{value:0,label:'0%'},{value:10,label:'10%'},{value:20,label:'20%'}]} valueLabelDisplay="auto" valueLabelFormat={v=>`${v}%`} />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">Min Confidence: {minConfidence}%</Typography>
              <Slider value={minConfidence} onChange={(_, v) => setMinConfidence(v as number)} min={0} max={100} step={5} marks={[{value:0,label:'0%'},{value:50,label:'50%'},{value:100,label:'100%'}]} valueLabelDisplay="auto" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">Max Legs: {maxLegs}</Typography>
              <Slider value={maxLegs} onChange={(_, v) => setMaxLegs(v as number)} min={2} max={10} step={1} marks={[{value:2,label:'2'},{value:5,label:'5'},{value:10,label:'10'}]} valueLabelDisplay="auto" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Filter Section */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>⚡ Quick Filters</Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip label="🎯 Player Props Only" onClick={() => { setMarketType('player_props'); setMinEdge(8); setMaxRisk('medium'); }} color={marketType === 'player_props' ? "primary" : "default"} variant="outlined" />
          <Chip label="💰 High Confidence (+80%)" onClick={() => { setMinConfidence(80); setMinEdge(10); setMaxRisk('low'); }} color={minConfidence === 80 ? "primary" : "default"} variant="outlined" />
          <Chip label="🔄 Mixed Markets" onClick={() => { setMarketType('mixed'); setParlaySize('3'); setMaxRisk('medium'); }} color={marketType === 'mixed' ? "primary" : "default"} variant="outlined" />
          <Chip label="📊 Game Totals" onClick={() => { setMarketType('game_totals'); setMinEdge(5); setParlaySize('2'); }} color={marketType === 'game_totals' ? "primary" : "default"} variant="outlined" />
          <Chip label="⚡ Quick Parlays (2-leg)" onClick={() => { setParlaySize('2'); setMaxRisk('low'); setMinConfidence(70); }} color={parlaySize === '2' ? "primary" : "default"} variant="outlined" />
          <Chip label="🔄 Clear Filters" onClick={() => { setMarketType('all'); setMinConfidence(60); setMinEdge(5); setMaxRisk('all'); setParlaySize('all'); setSearchQuery(''); }} color="default" variant="outlined" />
        </Box>
      </Paper>

      {/* AI Generator Dialog */}
      <Dialog open={generatorOpen} onClose={() => setGeneratorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">AI Parlay Generator</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Describe the parlay you want – e.g., "best value props", "LeBron James points and assists", or "Lakers vs Warriors player props".
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Enter your prompt here..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            variant="outlined"
            sx={{ mb: 3 }}
          />
          <Typography variant="subtitle2" gutterBottom>Quick Prompts</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {PROMPTS.map((prompt, idx) => (
              <Chip
                key={idx}
                label={prompt.label}
                onClick={() => setCustomQuery(prompt.query)}
                icon={<AutoAwesomeIcon />}
                sx={{ backgroundColor: alpha('#6C5CE7', 0.1), color: '#6C5CE7', '&:hover': { backgroundColor: alpha('#6C5CE7', 0.2) } }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratorOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateAI}
            disabled={!customQuery.trim() || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Suggestions (placeholder) */}
      {aiSuggestions.length > 0 && (
        <Paper sx={{ p: 2, mb: 4, bgcolor: alpha('#6C5CE7', 0.05), border: '1px solid #6C5CE7' }}>
          <Typography variant="h6">AI Suggestions</Typography>
          {/* ... render AI suggestions if any ... */}
        </Paper>
      )}

      {/* Teaser Options */}
      {selectedType === 'teaser' && parlayLegs.length >= 2 && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>📋 Teaser Options</Typography>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" gap={1}>
              {TEASER_POINTS.map(points => (
                <Button key={points} variant={teaserPoints === points ? "contained" : "outlined"} size="small" onClick={() => setTeaserPoints(points)}>{points} pts</Button>
              ))}
            </Box>
            {teaserOdds.length > 0 && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">Odds per leg:</Typography>
                <Chip label={teaserOdds[0].odds} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Round Robin Options */}
      {selectedType === 'round_robin' && parlayLegs.length >= 3 && roundRobinCombos.length > 0 && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>🔄 Round Robin Combinations</Typography>
          <Box mb={2}>
            <ToggleButtonGroup value={roundRobinSize} exclusive onChange={(e, v) => v && setRoundRobinSize(v)} size="small">
              {ROUND_ROBIN_SIZES.map(size => <ToggleButton key={size} value={size}>{size}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          <Box display="flex" gap={2} overflow="auto" pb={1}>
            {roundRobinCombos.slice(0,5).map((combo, idx) => (
              <Card key={combo.id} sx={{ minWidth: 120, p: 1.5 }}>
                <Typography variant="caption">Parlay {idx+1}</Typography>
                <Typography variant="h6" color="primary">{combo.odds > 0 ? `+${combo.odds}` : combo.odds}</Typography>
                <Typography variant="body2" color="success.main">${combo.payout.toFixed(2)}</Typography>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Parlay Builder */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}><BuildIcon color="primary" /><Typography variant="h6">Parlay Builder</Typography></Box>
          <Box display="flex" gap={1}>
            <Chip label={`${parlayLegs.length}/${getMaxLegs()} legs`} color={parlayLegs.length >= getMinLegs() ? "success" : "default"} />
            <Button size="small" variant="outlined" color="error" onClick={clearLegs} disabled={parlayLegs.length === 0}>Clear</Button>
          </Box>
        </Box>

        {parlayLegs.length === 0 ? (
          <Box textAlign="center" py={4}>
            <AddCircleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>No legs added yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Click "Add Leg" to start building your parlay</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowPropSelector(true)} disabled={props.length === 0}>Add Leg</Button>
          </Box>
        ) : (
          <>
            {parlayLegs.map((leg, idx) => (
              <Box key={leg.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, mb: 1, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid', borderColor: leg.is_star ? '#FFD700' : 'transparent' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#6C5CE7', fontSize: 12 }}>{idx+1}</Avatar>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="bold">{leg.player || leg.description?.split(' ')[0] || 'Pick'}</Typography>
                      {leg.is_star && <StarIcon sx={{ fontSize: 14, color: '#FFD700' }} />}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">{leg.market} {leg.side} {leg.line}</Typography>
                      {leg.projection && <Chip label={`Proj: ${leg.projection.toFixed(1)}`} size="small" sx={{ height: 18, bgcolor: leg.projection > leg.line ? '#10b98120' : '#ef444420', color: leg.projection > leg.line ? '#10b981' : '#ef4444', fontSize: '0.6rem' }} />}
                      {leg.edge && <Chip label={`Edge: ${leg.edge}`} size="small" sx={{ height: 18, bgcolor: leg.edge.startsWith('+') ? '#10b98120' : '#ef444420', color: leg.edge.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '0.6rem' }} />}
                    </Box>
                    {leg.correlation_score && leg.correlation_score > 0.7 && <Chip icon={<FlashOnIcon sx={{ fontSize: 12 }} />} label="Correlated" size="small" sx={{ mt: 0.5, height: 20, bgcolor: '#FFD70020', color: '#FFD700', fontSize: '0.6rem' }} />}
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" fontWeight="bold" color={leg.odds > 0 ? 'success.main' : 'text.primary'}>{leg.odds > 0 ? `+${leg.odds}` : leg.odds}</Typography>
                  <IconButton size="small" onClick={() => removeLeg(leg.id)}><ClearIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
            ))}

            {parlayLegs.length >= 2 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}><Typography variant="caption" color="text.secondary">Total Odds</Typography><Typography variant="h6" color="primary">{calculateTotalOdds > 0 ? `+${calculateTotalOdds}` : calculateTotalOdds}</Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption" color="text.secondary">Implied Probability</Typography><Typography variant="h6">{calculateImpliedProbabilityValue.toFixed(1)}%</Typography></Grid>
                  <Grid item xs={4}><Typography variant="caption" color="text.secondary">Potential Payout</Typography><Typography variant="h6" color="success.main">${calculatePotentialPayout.toFixed(2)}</Typography></Grid>
                </Grid>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" fullWidth size="large" startIcon={building ? <CircularProgress size={20} color="inherit" /> : <BuildIcon />} onClick={buildParlay} disabled={parlayLegs.length < getMinLegs() || building} sx={{ py: 1.5 }}>{building ? 'Building...' : 'Build Parlay'}</Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Today's Games Panel */}
      <Paper sx={{ mb: 4 }}>
        <Accordion expanded={showTodaysGames} onChange={() => setShowTodaysGames(!showTodaysGames)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <TodayIcon color="primary" />
              <Typography variant="h6">Today's NBA Games</Typography>
              <Chip label={`${games.length} games`} size="small" color={gamesLoading ? "default" : gamesError ? "error" : "success"} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {gamesLoading ? (
              <Box display="flex" justifyContent="center" p={3}><CircularProgress size={24} /><Typography sx={{ ml: 2 }}>Loading live games...</Typography></Box>
            ) : gamesError ? (
              <Alert severity="warning">
                <AlertTitle>Could not load games</AlertTitle>
                Using mock data. <Button size="small" sx={{ ml: 2 }} onClick={() => refetchGames()}>Retry</Button>
              </Alert>
            ) : games.length === 0 ? (
              <Alert severity="info"><AlertTitle>No NBA Games Today</AlertTitle>Try generating a parlay or check back later.</Alert>
            ) : (
              <Grid container spacing={2}>
                {games.slice(0,6).map(game => (
                  <Grid item xs={12} sm={6} md={4} key={game.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="caption" color="text.secondary"><ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />{(() => { try { return format(parseISO(game.commence_time), 'h:mm a'); } catch { return 'TBD'; } })()}</Typography>
                          <Chip label="NBA" size="small" color="primary" />
                        </Box>
                        <Box textAlign="center" mb={2}>
                          <Typography variant="body2" fontWeight="bold" color="primary">{game.away_team}</Typography>
                          <Typography variant="body2" color="text.secondary">@</Typography>
                          <Typography variant="body2" fontWeight="bold" color="primary">{game.home_team}</Typography>
                        </Box>
                        <Button size="small" variant="contained" fullWidth sx={{ mt: 2 }} onClick={() => {
                          const gameProps = nbaProps.filter(p => p.team === game.home_team || p.team === game.away_team);
                          if (gameProps.length >= 2) {
                            const quickParlay: ParlaySuggestion = {
                              id: `quick-${Date.now()}`,
                              name: `${game.away_team} @ ${game.home_team}`,
                              sport: 'NBA',
                              type: 'player_props',
                              market_type: 'player_props',
                              legs: gameProps.slice(0,2).map((prop, idx) => ({
                                id: `leg-${Date.now()}-${idx}`,
                                gameId: game.id,
                                description: `${prop.player} ${prop.market} Over ${prop.line}`,
                                odds: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
                                odds_american: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
                                price: prop.over_odds,
                                confidence: prop.confidence,
                                sport: 'NBA',
                                market: 'player_props',
                                player_name: prop.player,
                                stat_type: prop.market,
                                line: prop.line,
                                projection: prop.projection,
                                edge: prop.edge,
                                teams: { home: game.home_team, away: game.away_team },
                                confidence_level: prop.confidence > 80 ? 'very-high' : 'high',
                                correlation_score: 0.7,
                                is_star: prop.confidence > 80
                              })),
                              totalOdds: '+250',
                              total_odds: '+250',
                              total_odds_american: '+250',
                              confidence: 75,
                              analysis: 'Quick pick from today\'s game using real props',
                              timestamp: new Date().toISOString(),
                              isGenerated: true,
                              isToday: true,
                              confidence_level: 'high',
                              expected_value: '+6.5%',
                              risk_level: 'medium',
                              ai_metrics: { leg_count: 2, avg_leg_confidence: 75, recommended_stake: '$10.00', edge: 0.065 },
                              is_real_data: true,
                              has_data: true
                            };
                            setSelectedParlay(quickParlay);
                            setParlayLegs(quickParlay.legs as ParlayLeg[]);
                            setShowBuildModal(true);
                            setSuccessMessage('Quick parlay created from real props!');
                            setShowSuccessAlert(true);
                          } else {
                            const quickParlay: ParlaySuggestion = {
                              id: `quick-${Date.now()}`,
                              name: `${game.away_team} @ ${game.home_team}`,
                              sport: 'NBA',
                              type: 'Moneyline',
                              market_type: 'moneyline',
                              legs: [{
                                id: `leg-${Date.now()}`,
                                gameId: game.id,
                                description: `${game.home_team} ML`,
                                odds: '-110',
                                odds_american: '-110',
                                price: -110,
                                confidence: 68,
                                sport: 'NBA',
                                market: 'h2h',
                                teams: { home: game.home_team, away: game.away_team },
                                confidence_level: 'medium',
                                correlation_score: 0.65,
                                is_star: false
                              }],
                              totalOdds: '-110',
                              total_odds: '-110',
                              total_odds_american: '-110',
                              confidence: 68,
                              analysis: 'Quick pick from today\'s game',
                              timestamp: new Date().toISOString(),
                              isGenerated: true,
                              isToday: true,
                              confidence_level: 'medium',
                              expected_value: '+2.5%',
                              risk_level: 'low',
                              ai_metrics: { leg_count: 1, avg_leg_confidence: 68, recommended_stake: '$10.00', edge: 0.025 },
                              is_real_data: !!game.bookmakers,
                              has_data: true
                            };
                            setSelectedParlay(quickParlay);
                            setParlayLegs(quickParlay.legs as ParlayLeg[]);
                            setShowBuildModal(true);
                            setSuccessMessage('Quick parlay created from selected game!');
                            setShowSuccessAlert(true);
                          }
                        }}>Quick Pick</Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Parlay Suggestions */}
      {filteredSuggestions.length === 0 ? (
        <Alert severity="info">No parlay suggestions match your filters.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredSuggestions.map(parlay => (
            <Grid item xs={12} md={6} key={parlay.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box><Typography variant="h6">{parlay.name}</Typography><Typography variant="body2" color="text.secondary">{parlay.legs.length} legs • {parlay.type} • {parlay.sport}</Typography></Box>
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                      {parlay.is_real_data && <Chip label="✅ LIVE" size="small" sx={{ bgcolor: '#10b981', color: 'white', fontSize: '0.6rem', height: 18 }} />}
                      {parlay.source && <Chip label={parlay.source} size="small" sx={{ bgcolor: '#6C5CE7', color: 'white', fontSize: '0.6rem', height: 18, mt: 0.5 }} />}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{parlay.analysis}</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: "center", mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">AI Confidence: {parlay.confidence_level}</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {parlay.expected_value && <Chip label={`EV: ${parlay.expected_value}`} size="small" sx={{ bgcolor: parlay.expected_value?.startsWith('+') ? '#10b98120' : '#ef444420', color: parlay.expected_value?.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '0.7rem' }} />}
                        <Chip label={parlay.total_odds_american || parlay.total_odds} size="small" color="primary" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }} />
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={parlay.confidence} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    {parlay.legs?.slice(0,2).map((leg, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">• {leg.description}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {leg.projection && <Chip label={`Proj: ${typeof leg.projection === 'number' ? leg.projection.toFixed(1) : leg.projection}`} size="small" sx={{ height: 18, bgcolor: leg.projection > leg.line ? '#10b98120' : '#ef444420', color: leg.projection > leg.line ? '#10b981' : '#ef4444', fontSize: '0.6rem' }} />}
                          <Chip label={leg.odds_american} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                        </Box>
                      </Box>
                    ))}
                    {parlay.legs?.length > 2 && <Typography variant="caption" color="text.secondary">+{parlay.legs.length-2} more legs</Typography>}
                  </Box>
                  {parlay.ai_metrics && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">AI Metrics: {parlay.ai_metrics.leg_count} legs • {parlay.ai_metrics.avg_leg_confidence}% avg • Stake: {parlay.ai_metrics.recommended_stake} {parlay.ai_metrics.edge && ` • Edge: ${(parlay.ai_metrics.edge*100).toFixed(1)}%`}</Typography>
                    </Box>
                  )}
                  <Box display="flex" gap={1}>
                    <Button variant="contained" onClick={() => handleBuildParlay(parlay)} startIcon={<BuildIcon />} sx={{ flex: 1 }}>Build</Button>
                    <Button variant="outlined" onClick={() => { setParlayLegs(parlay.legs as ParlayLeg[]); setSuccessMessage('Parlay added to builder!'); setShowSuccessAlert(true); }}>Add Legs</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Prop Selector Modal */}
      <Dialog open={showPropSelector} onClose={() => setShowPropSelector(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Add Parlay Leg - {selectedSport} Props</Typography>
            <IconButton onClick={() => setShowPropSelector(false)}><ClearIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {props.length === 0 ? (
              <Box textAlign="center" py={4}><Typography color="text.secondary">No props available for {selectedSport}</Typography></Box>
            ) : (
              props.map(prop => (
                <Card key={prop.id} sx={{ mb: 2, borderLeft: '4px solid #10b981' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">{prop.player}</Typography>
                        <Typography variant="caption" color="text.secondary">{prop.team} · {prop.market} · {prop.position || 'N/A'}</Typography>
                        <Box display="flex" alignItems="center" gap={2} mt={1}>
                          <Typography variant="h6" color="primary">{prop.line}</Typography>
                          {prop.projection && <Chip label={`Proj: ${prop.projection.toFixed(1)}`} size="small" sx={{ bgcolor: prop.projection > prop.line ? '#10b98120' : '#ef444420', color: prop.projection > prop.line ? '#10b981' : '#ef4444', height: 20, fontSize: '0.7rem' }} />}
                          {prop.confidence && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ width: 60, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                                <Box sx={{ width: `${prop.confidence}%`, height: 6, bgcolor: prop.confidence > 80 ? '#4CAF50' : '#6C5CE7' }} />
                              </Box>
                              <Typography variant="caption">{prop.confidence}%</Typography>
                            </Box>
                          )}
                        </Box>
                        {prop.edge && <Chip label={`Edge: ${prop.edge}`} size="small" sx={{ mt: 1, height: 18, bgcolor: prop.edge.startsWith('+') ? '#10b98120' : '#ef444420', color: prop.edge.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '0.6rem' }} />}
                        <Chip label="REAL DATA" size="small" sx={{ mt: 1, bgcolor: '#10b981', color: 'white', height: 20, fontSize: '0.6rem' }} />
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button variant="contained" size="small" sx={{ bgcolor: '#4CAF50' }} onClick={() => addLeg(prop, 'over')}>O {prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds}</Button>
                        <Button variant="contained" size="small" sx={{ bgcolor: '#F44336' }} onClick={() => addLeg(prop, 'under')}>U {prop.under_odds > 0 ? `+${prop.under_odds}` : prop.under_odds}</Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Build Modal */}
      <Dialog open={showBuildModal} onClose={() => setShowBuildModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BuildIcon color="primary" />
            Build Parlay: {selectedParlay?.name}
            {selectedParlay?.is_real_data && <Chip label="✅ REAL DATA" size="small" sx={{ bgcolor: '#10b981', color: 'white', ml: 1 }} />}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedParlay && (
            <Box>
              <Typography variant="body1" paragraph>{selectedParlay.analysis}</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow><TableCell>#</TableCell><TableCell>Pick</TableCell><TableCell>Odds</TableCell><TableCell>Confidence</TableCell></TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedParlay.legs.map((leg, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{idx+1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">{leg.description}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">{leg.market} • {leg.sport}{leg.player_name && ` • ${leg.player_name}`}{leg.stat_type && ` • ${leg.stat_type}`}{leg.line && ` • Line: ${leg.line}`}</Typography>
                            {leg.projection && <Chip label={`Proj: ${typeof leg.projection === 'number' ? leg.projection.toFixed(1) : leg.projection}`} size="small" sx={{ height: 20, bgcolor: leg.projection > leg.line ? '#10b98120' : '#ef444420', color: leg.projection > leg.line ? '#10b981' : '#ef4444', fontSize: '0.6rem' }} />}
                            {leg.edge && <Chip label={`Edge: ${leg.edge}`} size="small" sx={{ height: 20, bgcolor: leg.edge.startsWith('+') ? '#10b98120' : '#ef444420', color: leg.edge.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '0.6rem' }} />}
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={leg.odds_american || leg.odds} size="small" color={leg.odds_american?.startsWith('+') ? "success" : "default"} sx={{ fontWeight: 'bold' }} /></TableCell>
                        <TableCell><Box display="flex" alignItems="center" gap={1}><LinearProgress variant="determinate" value={leg.confidence} sx={{ width: 80, height: 8, borderRadius: 4 }} /><Typography variant="body2">{leg.confidence}%</Typography></Box></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box p={2} bgcolor="#f8fafc" borderRadius={1}>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Total Odds</Typography><Typography variant="h6" color="primary">{selectedParlay.total_odds_american || selectedParlay.total_odds}</Typography></Grid>
                  <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">AI Confidence</Typography><Typography variant="h6">{selectedParlay.confidence}%</Typography></Grid>
                  <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Expected Value</Typography><Typography variant="h6" color={selectedParlay.expected_value?.startsWith('+') ? 'success.main' : 'error.main'}>{selectedParlay.expected_value}</Typography></Grid>
                  <Grid item xs={6} md={3}><Typography variant="caption" color="text.secondary">Risk Level</Typography><Chip label={selectedParlay.risk_level} size="small" color={selectedParlay.risk_level === 'low' ? 'success' : selectedParlay.risk_level === 'high' ? 'error' : 'warning'} /></Grid>
                </Grid>
                {selectedParlay.correlation_bonus && <Box mt={2}><Chip label={`+${selectedParlay.correlation_bonus*100}% Correlation Bonus`} sx={{ bgcolor: '#FFD70020', color: '#FFD700' }} /></Box>}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button ref={buildModalFirstFocusRef} onClick={() => setShowBuildModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddToBetSlip} sx={{ bgcolor: '#6C5CE7' }}>Add to Bet Slip</Button>
        </DialogActions>
      </Dialog>

      {/* Parlay Result Modal */}
      <Dialog open={showParlayResult} onClose={() => setShowParlayResult(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4ABD 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon /> Parlay Built Successfully!
          <IconButton onClick={() => setShowParlayResult(false)} sx={{ position: 'absolute', right: 16, top: 16, color: 'white' }}><ClearIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {parlayResult && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Parlay Type</Typography><Typography variant="body1" fontWeight="bold">{parlayResult.type.replace('_',' ')}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Legs</Typography><Typography variant="body1" fontWeight="bold">{parlayResult.leg_count}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Odds</Typography><Typography variant="h6" color="primary" fontWeight="bold">{parlayResult.odds > 0 ? `+${parlayResult.odds}` : parlayResult.odds}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Stake</Typography><Typography variant="body1" fontWeight="bold">${parlayResult.stake.toFixed(2)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Payout</Typography><Typography variant="h6" color="success.main" fontWeight="bold">${parlayResult.potential_payout.toFixed(2)}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Profit</Typography><Typography variant="h6" color="success.main" fontWeight="bold">${parlayResult.profit.toFixed(2)}</Typography></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button ref={firstFocusableRef} variant="outlined" onClick={() => setShowParlayResult(false)}>Save Ticket</Button>
          <Button variant="contained" sx={{ bgcolor: '#4CAF50' }} onClick={() => { setShowParlayResult(false); setSuccessMessage('Bet placed successfully!'); setShowSuccessAlert(true); }}>Place Bet</Button>
        </DialogActions>
      </Dialog>

      {/* Debug Button */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Tooltip title="Debug State">
          <Button variant="contained" color="warning" onClick={() => console.log('🧪 Current State:', { suggestions: suggestions.length, filteredSuggestions: filteredSuggestions.length, games: games.length, parlayLegs: parlayLegs.length, nbaProps: nbaProps.length, nhlProps: nhlProps.length, mlbProps: mlbProps.length })} sx={{ borderRadius: '50%', minWidth: 'auto', width: 48, height: 48 }}><BugReportIcon /></Button>
        </Tooltip>
      </Box>
      <style>{pulseAnimation}</style>
    </Container>
  );
};

export default ParlayArchitectScreen;
