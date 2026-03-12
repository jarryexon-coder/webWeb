// src/pages/DailyPicksScreen.tsx – Final version with edge fix, winner prompts, daily usage limit, Firebase Auth, and visual enhancements
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  AlertTitle,
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Tooltip,
  Collapse,
  Tabs,
  Tab,
  Slider,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  CalendarToday,
  SportsBasketball,
  SportsFootball,
  SportsHockey,
  SportsBaseball,
  TrendingUp,
  AttachMoney,
  Analytics,
  BarChart,
  CheckCircle,
  Lock,
  BookmarkBorder,
  Bolt,
  Refresh,
  Close,
  AutoAwesome,
  Schedule,
  ExpandMore,
  BugReport,
  SportsSoccer,
  Gamepad,
  Loop,
  ShowChart,
  CheckCircleOutline,
  FilterList,
  SmartToy,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDailyPicks } from '../hooks/useunifiedAPI';
import { useAuth } from '../context/AuthContext';

// ============================================
// CUSTOM DEBOUNCE UTILITY
// ============================================
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ============================================
// TYPES
// ============================================
interface Pick {
  id: string;
  player: string;
  team: string;
  position?: string;
  sport: string;
  stat?: string;
  line?: number;
  projection?: number;
  confidence: number;
  odds?: number | string;
  edge?: string;
  edge_percentage?: number; // signed: positive = good side, negative = bad side
  analysis: string;
  timestamp: string;
  category: string;
  probability?: string;
  roi?: string;
  units?: string;
  requiresPremium: boolean;
  value?: string;
  bookmaker?: string;
  generatedFrom?: string;
  isToday?: boolean;
  type?: 'Over' | 'Under';
  data_source?: string;
  is_mock?: boolean;
}

interface ParlayLeg {
  player?: string;
  team?: string;
  market: string;
  line?: number;
  odds: number | string;
}

interface Parlay {
  id: string;
  type: 'same_game_parlay' | 'teaser' | 'round_robin';
  game?: string;
  legs: ParlayLeg[];
  total_odds: string | number;
  confidence: number;
  analysis?: string;
  correlation_score?: number;
}

interface SportOption {
  id: string;
  name: string;
  icon: keyof typeof SPORT_ICONS;
  leagues: string[];
}

interface MarketType {
  id: string;
  name: string;
  icon: keyof typeof MARKET_ICONS;
}

// ============================================
// CONSTANTS
// ============================================
const DAILY_LIMIT = 2;

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';      // Node backend (NBA, etc.)
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app'; // Python backend (MLB, NHL, user limits)

const SPORT_ICONS = {
  nba: SportsBasketball,
  nfl: SportsFootball,
  mlb: SportsBaseball,
  nhl: SportsHockey,
  ufc: Bolt,
  soccer: SportsSoccer,
};

const MARKET_ICONS = {
  standard: BarChart,
  same_game: Gamepad,
  teaser: ExpandMore,
  round_robin: Loop,
};

const SPORTS: SportOption[] = [
  { id: 'nba', name: 'NBA', icon: 'nba', leagues: ['nba'] },
  { id: 'nfl', name: 'NFL', icon: 'nfl', leagues: ['nfl'] },
  { id: 'mlb', name: 'MLB', icon: 'mlb', leagues: ['mlb'] },
  { id: 'nhl', name: 'NHL', icon: 'nhl', leagues: ['nhl'] },
  { id: 'ufc', name: 'UFC', icon: 'ufc', leagues: ['ufc'] },
  { id: 'soccer', name: 'Soccer', icon: 'soccer', leagues: ['uefa_champions', 'epl', 'laliga'] },
];

const MARKET_TYPES: MarketType[] = [
  { id: 'standard', name: 'Standard', icon: 'standard' },
  { id: 'same_game', name: 'Same Game Parlay', icon: 'same_game' },
  { id: 'teaser', name: 'Teaser', icon: 'teaser' },
  { id: 'round_robin', name: 'Round Robin', icon: 'round_robin' },
];

const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981',
  SOCCER: '#8b5cf6',
  UFC: '#dc2626',
};

const CATEGORY_COLORS = {
  'High Confidence': '#10b981',
  'Value Bet': '#3b82f6',
  'Lock Pick': '#f59e0b',
  'High Upside': '#8b5cf6',
  'AI Generated': '#ec4899',
  'Premium Pick': '#f59e0b',
};

const CONFIDENCE_COLORS = {
  80: '#22c55e',
  70: '#eab308',
  60: '#f97316',
  default: '#6b7280',
};

// ============================================
// USEFUL_PROMPTS (categorized for quick chips)
// ============================================
const USEFUL_PROMPTS = [
  {
    category: 'Player Props',
    prompts: [
      'Top scorers tonight',
      'Players with most assists',
      'Best rebounders',
      'High steals projections',
      'Block leaders',
    ],
  },
  {
    category: 'Over/Under Trends',
    prompts: [
      'Best over bets',
      'Value under props',
      'High line overs',
      'Low line unders',
      'Players exceeding projections',
    ],
  },
  {
    category: 'Matchup Based',
    prompts: [
      'Players vs weak defenses',
      'Guards vs poor perimeter D',
      'Big men vs small lineups',
      'Players in high pace games',
      'Stars in favorable matchups',
    ],
  },
  {
    category: 'Advanced Metrics',
    prompts: [
      'Highest usage rate players',
      'Best efficiency ratings',
      'Players with positive edge',
      'Correlated props',
      'Same game parlay ideas',
    ],
  },
  {
    category: 'Prediction Analysis',
    prompts: [
      'Predict next game outcomes',
      'AI betting recommendations',
      'Value picks for tonight',
      'Player prop predictions',
      'Over/under analysis',
    ],
  },
];

// ============================================
// UNIVERSAL_PROMPTS (flat list for dropdown)
// ============================================
const UNIVERSAL_PROMPTS = [
  'Top performers tonight',
  'Best over bets',
  'Value under props',
  'Players with highest projections',
  'Most consistent players',
  'High upside picks',
  'Safe plays with high confidence',
  'Players in favorable matchups',
  'Players vs weak defenses',
  'Recent hot streaks',
  'Players due for regression',
  'Best value based on odds',
  'Highest edge percentages',
  'Low-owned tournament plays',
  'Correlated props',
  'Same game parlay ideas',
  'Players with positive matchup history',
  'Rookies to watch',
  'Veterans in bounce-back spots',
  'Best per-dollar value',
];

// ============================================
// WINNER_PROMPTS (15 prompts for game winners)
// ============================================
const WINNER_PROMPTS = [
  'Today’s biggest favorites',
  'Upset predictions for tonight',
  'Best moneyline bets',
  'Teams on winning streaks',
  'Home underdogs to watch',
  'Highest implied win probability',
  'Teams with key injuries – fade',
  'Best value on the moneyline',
  'Parlay of the day (winners)',
  'Teams in bounce‑back spots',
  'Undervalued road teams',
  'Teams with rest advantage',
  'Weather impact (outdoor sports)',
  'Head‑to‑head dominance',
  'Lock of the day (winner)',
];

// ============================================
// HELPER FUNCTIONS
// ============================================
const getRecommendationColor = (confidence: number): string => {
  if (confidence >= 80) return CONFIDENCE_COLORS[80];
  if (confidence >= 70) return CONFIDENCE_COLORS[70];
  if (confidence >= 60) return CONFIDENCE_COLORS[60];
  return CONFIDENCE_COLORS.default;
};

// Team name mappings for better keyword matching
const TEAM_MAPPINGS: Record<string, string[]> = {
  lakers: ['lakers', 'la lakers', 'los angeles lakers', 'lal'],
  warriors: ['warriors', 'golden state', 'gsw'],
  celtics: ['celtics', 'boston', 'bos'],
  bucks: ['bucks', 'milwaukee', 'mil'],
  suns: ['suns', 'phoenix', 'phx'],
  nuggets: ['nuggets', 'denver', 'den'],
  mavericks: ['mavericks', 'dallas', 'dal'],
  heat: ['heat', 'miami', 'mia'],
  sixers: ['sixers', 'philadelphia', 'phi'],
  knicks: ['knicks', 'new york', 'nyk'],
};

// Player-to-team mapping (add more as needed)
const PLAYER_TEAM_MAP: Record<string, string> = {
  'james harden': 'LA Clippers',
  'jared mccain': 'Dallas Mavericks',
  'aaron wiggins': 'Oklahoma City Thunder',
  'isaiah joe': 'Oklahoma City Thunder',
  'cason wallace': 'Oklahoma City Thunder',
  'donovan mitchell': 'Cleveland Cavaliers',
  'evan mobley': 'Cleveland Cavaliers',
  'isaiah hartenstein': 'Oklahoma City Thunder',
  'chet holmgren': 'Oklahoma City Thunder',
  'luguentz dort': 'Oklahoma City Thunder',
  'dennis schroder': 'Brooklyn Nets',
  'jarrett allen': 'Cleveland Cavaliers',
  'jaylon tyson': 'Cleveland Cavaliers',
};

const getPlayerTeam = (playerName: string): string => {
  const lowerName = playerName.toLowerCase();
  return PLAYER_TEAM_MAP[lowerName] || playerName;
};

// ============================================
// MAP NODE API SELECTION TO PICK (with signed edge per side)
// ============================================
const mapNodeSelectionToPick = (sel: any, sport: string, prompt?: string): Pick => {
  let confidenceValue = 70;
  if (sel.confidence === 'high') confidenceValue = 85;
  else if (sel.confidence === 'medium') confidenceValue = 70;
  else if (sel.confidence === 'low') confidenceValue = 55;
  else if (typeof sel.confidence === 'number') confidenceValue = sel.confidence;

  // Safe number parsing
  const proj = typeof sel.projection === 'number' ? sel.projection : parseFloat(sel.projection);
  const lineVal = typeof sel.line === 'number' ? sel.line : parseFloat(sel.line);
  const hasValidNumbers = !isNaN(proj) && !isNaN(lineVal) && lineVal !== 0;

  let signedEdgePercent: number | undefined;
  if (hasValidNumbers && sel.type) {
    if (sel.type === 'Over') {
      signedEdgePercent = ((proj - lineVal) / lineVal) * 100;
    } else if (sel.type === 'Under') {
      signedEdgePercent = ((lineVal - proj) / lineVal) * 100;
    }
    signedEdgePercent = Math.round(signedEdgePercent * 10) / 10;
  }

  // Build display edge string
  let displayEdgeStr = sel.edge; // fallback from API
  if (signedEdgePercent !== undefined) {
    displayEdgeStr = signedEdgePercent > 0 ? `+${signedEdgePercent}%` : `${signedEdgePercent}%`;
  } else if (hasValidNumbers && !sel.type) {
    // no type but numbers exist – show absolute edge
    const absEdge = ((Math.abs(proj - lineVal)) / lineVal) * 100;
    displayEdgeStr = `${Math.round(absEdge * 10) / 10}% (no side)`;
  }

  const category =
    confidenceValue >= 85
      ? 'High Confidence'
      : confidenceValue >= 70
      ? 'Value Bet'
      : confidenceValue >= 60
      ? 'Lock Pick'
      : 'High Upside';

  // Round line and projection to 1 decimal for display
  const roundedLine = lineVal ? Math.round(lineVal * 10) / 10 : undefined;
  const roundedProjection = proj ? Math.round(proj * 10) / 10 : undefined;

  return {
    id: sel.id || `node-${Date.now()}-${Math.random()}`,
    player: sel.player || 'Unknown',
    team: sel.team || getPlayerTeam(sel.player || ''),
    sport: sport.toUpperCase(),
    stat: sel.stat ? (sel.type ? `${sel.stat} ${sel.type} ${roundedLine}` : sel.stat) : undefined,
    line: roundedLine,
    projection: roundedProjection,
    confidence: confidenceValue,
    odds: sel.odds,
    edge: displayEdgeStr,
    edge_percentage: signedEdgePercent,
    analysis: sel.analysis || 'AI‑generated pick based on matchup data.',
    timestamp: sel.timestamp ? new Date(sel.timestamp).toLocaleString() : 'Just now',
    category,
    probability: `${confidenceValue}%`,
    roi: sel.roi || `+${Math.floor(Math.random() * 20) + 10}%`,
    units: (Math.random() * 2 + 1).toFixed(1),
    requiresPremium: false,
    value: displayEdgeStr,
    bookmaker: sel.bookmaker,
    generatedFrom: prompt,
    isToday: true,
    type: sel.type,
    is_mock: sel.source === 'mock',
    data_source: sel.source || 'Node API',
  };
};

// ============================================
// MLB/NHL mapping functions (similar edge fixes applied)
// ============================================
const mapMLBPropToPick = (prop: any, side: 'Over' | 'Under', source: string): Pick => {
  const odds = side === 'Over' ? prop.over_odds : prop.under_odds;
  let confidenceValue = prop.confidence || 70;
  if (typeof confidenceValue === 'string') {
    if (confidenceValue === 'high') confidenceValue = 85;
    else if (confidenceValue === 'medium') confidenceValue = 70;
    else if (confidenceValue === 'low') confidenceValue = 55;
    else confidenceValue = 70;
  }

  const proj = typeof prop.projection === 'number' ? prop.projection : parseFloat(prop.projection);
  const lineVal = typeof prop.line === 'number' ? prop.line : parseFloat(prop.line);
  const hasValidNumbers = !isNaN(proj) && !isNaN(lineVal) && lineVal !== 0;

  let signedEdgePercent: number | undefined;
  if (hasValidNumbers) {
    if (side === 'Over') {
      signedEdgePercent = ((proj - lineVal) / lineVal) * 100;
    } else {
      signedEdgePercent = ((lineVal - proj) / lineVal) * 100;
    }
    signedEdgePercent = Math.round(signedEdgePercent * 10) / 10;
  }

  const displayEdgeStr = signedEdgePercent !== undefined
    ? (signedEdgePercent > 0 ? `+${signedEdgePercent}%` : `${signedEdgePercent}%`)
    : prop.edge || 'N/A';

  const category =
    confidenceValue >= 85
      ? 'High Confidence'
      : confidenceValue >= 70
      ? 'Value Bet'
      : confidenceValue >= 60
      ? 'Lock Pick'
      : 'High Upside';

  const roundedLine = lineVal ? Math.round(lineVal * 10) / 10 : undefined;
  const roundedProjection = proj ? Math.round(proj * 10) / 10 : undefined;

  return {
    id: prop.id || `mlb-${Date.now()}-${Math.random()}-${side}`,
    player: prop.player,
    team: prop.team,
    sport: 'MLB',
    stat: `${prop.stat} ${side} ${roundedLine}`,
    line: roundedLine,
    projection: roundedProjection,
    confidence: confidenceValue,
    odds: odds,
    edge: displayEdgeStr,
    edge_percentage: signedEdgePercent,
    analysis: prop.analysis || `MLB prop: ${prop.player} ${prop.stat} ${side} ${prop.line}. Projected: ${prop.projection}.`,
    timestamp: prop.game_date ? new Date(prop.game_date).toLocaleString() : 'Just now',
    category,
    probability: `${confidenceValue}%`,
    roi: `+${Math.floor(Math.random() * 20) + 10}%`,
    units: (Math.random() * 2 + 1).toFixed(1),
    requiresPremium: false,
    value: displayEdgeStr,
    bookmaker: prop.bookmaker || 'Tank01',
    generatedFrom: 'MLB API',
    isToday: true,
    type: side,
    is_mock: source === 'mock',
    data_source: source,
  };
};

const mapNHLPropToPick = (prop: any, side: 'Over' | 'Under', source: string): Pick => {
  const odds = side === 'Over' ? prop.over_odds : prop.under_odds;
  let confidenceValue = prop.confidence || 70;
  if (typeof confidenceValue === 'string') {
    if (confidenceValue === 'high') confidenceValue = 85;
    else if (confidenceValue === 'medium') confidenceValue = 70;
    else if (confidenceValue === 'low') confidenceValue = 55;
    else confidenceValue = 70;
  }

  const proj = typeof prop.projection === 'number' ? prop.projection : parseFloat(prop.projection);
  const lineVal = typeof prop.line === 'number' ? prop.line : parseFloat(prop.line);
  const hasValidNumbers = !isNaN(proj) && !isNaN(lineVal) && lineVal !== 0;

  let signedEdgePercent: number | undefined;
  if (hasValidNumbers) {
    if (side === 'Over') {
      signedEdgePercent = ((proj - lineVal) / lineVal) * 100;
    } else {
      signedEdgePercent = ((lineVal - proj) / lineVal) * 100;
    }
    signedEdgePercent = Math.round(signedEdgePercent * 10) / 10;
  }

  const displayEdgeStr = signedEdgePercent !== undefined
    ? (signedEdgePercent > 0 ? `+${signedEdgePercent}%` : `${signedEdgePercent}%`)
    : prop.edge || 'N/A';

  const category =
    confidenceValue >= 85
      ? 'High Confidence'
      : confidenceValue >= 70
      ? 'Value Bet'
      : confidenceValue >= 60
      ? 'Lock Pick'
      : 'High Upside';

  const roundedLine = lineVal ? Math.round(lineVal * 10) / 10 : undefined;
  const roundedProjection = proj ? Math.round(proj * 10) / 10 : undefined;

  return {
    id: prop.id || `nhl-${Date.now()}-${Math.random()}-${side}`,
    player: prop.player,
    team: prop.team,
    sport: 'NHL',
    stat: `${prop.stat} ${side} ${roundedLine}`,
    line: roundedLine,
    projection: roundedProjection,
    confidence: confidenceValue,
    odds: odds,
    edge: displayEdgeStr,
    edge_percentage: signedEdgePercent,
    analysis: prop.analysis || `NHL prop: ${prop.player} ${prop.stat} ${side} ${prop.line}. Projected: ${prop.projection}.`,
    timestamp: prop.game_date ? new Date(prop.game_date).toLocaleString() : 'Just now',
    category,
    probability: `${confidenceValue}%`,
    roi: `+${Math.floor(Math.random() * 20) + 10}%`,
    units: (Math.random() * 2 + 1).toFixed(1),
    requiresPremium: false,
    value: displayEdgeStr,
    bookmaker: prop.bookmaker || 'The Odds API',
    generatedFrom: 'NHL API',
    isToday: true,
    type: side,
    is_mock: source === 'mock',
    data_source: source,
  };
};

// ============================================
// DEDUPLICATE PICKS – KEEP ONLY THE BEST SIDE PER PLAYER+STAT+LINE
// ============================================
const deduplicatePicks = (picks: Pick[]): Pick[] => {
  const map = new Map<string, Pick>();
  picks.forEach((pick) => {
    const statKey = pick.stat?.toLowerCase().split(' ')[0] || '';
    const key = `${pick.player.toLowerCase()}|${statKey}|${pick.line}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, pick);
    } else {
      // Keep the one with higher signed edge (positive is better)
      const existingEdge = existing.edge_percentage ?? -Infinity;
      const newEdge = pick.edge_percentage ?? -Infinity;
      if (newEdge > existingEdge) {
        map.set(key, pick);
      }
    }
  });
  return Array.from(map.values());
};

// ============================================
// MEMOIZED PICK CARD COMPONENT
// ============================================
const PickCard = memo(
  ({
    pick,
    onTrack,
    onAddToBetSlip,
    hasPremiumAccess,
  }: {
    pick: Pick;
    onTrack: (pick: Pick) => void;
    onAddToBetSlip: (pick: Pick) => void;
    hasPremiumAccess: boolean;
  }) => {
    const isPremiumLocked = pick.requiresPremium && !hasPremiumAccess;
    const confidenceColor = getRecommendationColor(pick.confidence);
    const formatOdds = (odds: number | string | undefined): string => {
      if (!odds) return '';
      if (typeof odds === 'string') return odds;
      return odds > 0 ? `+${odds}` : `${odds}`;
    };

    const displayEdge =
      pick.edge_percentage !== undefined
        ? pick.edge_percentage > 0
          ? `+${pick.edge_percentage}%`
          : `${pick.edge_percentage}%`
        : pick.edge || 'N/A';

    return (
      <Card
        sx={{
          mb: 3,
          borderLeft: 4,
          borderColor: CATEGORY_COLORS[pick.category as keyof typeof CATEGORY_COLORS] || confidenceColor,
          cursor: 'pointer',
          opacity: isPremiumLocked ? 0.9 : 1,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(4px)',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s',
            bgcolor: 'white',
          },
        }}
        onClick={() => onTrack(pick)}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {pick.player}
                {pick.position && (
                  <Typography variant="caption" color="text.secondary">
                    {pick.position}
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  {pick.team}
                </Typography>
                <Chip
                  label={pick.sport}
                  size="small"
                  sx={{
                    bgcolor: `${SPORT_COLORS[pick.sport as keyof typeof SPORT_COLORS]}20`,
                    color: SPORT_COLORS[pick.sport as keyof typeof SPORT_COLORS],
                    fontWeight: 'bold',
                  }}
                />
                {pick.category && (
                  <Chip
                    label={pick.category}
                    size="small"
                    sx={{
                      bgcolor: `${CATEGORY_COLORS[pick.category as keyof typeof CATEGORY_COLORS]}20`,
                      color: CATEGORY_COLORS[pick.category as keyof typeof CATEGORY_COLORS],
                      fontWeight: 'bold',
                    }}
                  />
                )}
                {pick.type && (
                  <Chip
                    label={pick.type}
                    size="small"
                    sx={{
                      bgcolor: pick.type === 'Over' ? '#10b98120' : '#ef444420',
                      color: pick.type === 'Over' ? '#10b981' : '#ef4444',
                      fontWeight: 'bold',
                    }}
                  />
                )}
                {pick.is_mock && (
                  <Chip
                    label="Mock"
                    size="small"
                    sx={{ bgcolor: '#ff980020', color: '#ff9800', fontWeight: 'bold' }}
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConfidenceBadge confidence={pick.confidence} />
              {isPremiumLocked && <Lock sx={{ color: 'text.secondary' }} />}
            </Box>
          </Box>

          {/* Pick Details */}
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{ color: isPremiumLocked ? 'text.secondary' : '#f59e0b', mb: 2 }}
          >
            {pick.stat}
          </Typography>

          {/* Key Stats */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={2}>
              {pick.projection && (
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <BarChart sx={{ color: '#8b5cf6', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Projection
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {pick.projection.toFixed(1)}
                    </Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ color: '#10b981', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    Edge
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color={pick.edge_percentage && pick.edge_percentage > 0 ? '#10b981' : '#ef4444'}
                  >
                    {displayEdge}
                  </Typography>
                </Box>
              </Grid>
              {pick.odds && (
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AttachMoney sx={{ color: '#f59e0b', mb: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      Odds
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatOdds(pick.odds)}
                    </Typography>
                    {pick.bookmaker && (
                      <Typography variant="caption" color="text.secondary">
                        {pick.bookmaker}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Analysis */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Analytics sx={{ color: '#f59e0b', mr: 1, mt: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {isPremiumLocked ? '🔒 Premium analysis available with upgrade' : pick.analysis}
            </Typography>
          </Box>

          {/* Generated Info */}
          {pick.generatedFrom && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption">
                Generated from: "{pick.generatedFrom.substring(0, 50)}..."
              </Typography>
            </Alert>
          )}

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {pick.timestamp}
            </Typography>
            <Button
              variant="contained"
              startIcon={<BookmarkBorder />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAddToBetSlip(pick);
              }}
              sx={{
                bgcolor: '#f59e0b',
                '&:hover': { bgcolor: '#d97706' },
              }}
            >
              Track Pick
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
);

const ConfidenceBadge = ({ confidence }: { confidence: number }) => {
  const color = getRecommendationColor(confidence);
  return (
    <Chip
      label={`${confidence}% Confidence`}
      size="small"
      sx={{
        bgcolor: `${color}20`,
        color: color,
        fontWeight: 'bold',
        border: 'none',
      }}
    />
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DailyPicksScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user from Firebase

  // Tab state
  const [tabIndex, setTabIndex] = useState(0); // 0 = All Picks, 1 = AI Generator

  // Main picks state (all picks from API)
  const [picks, setPicks] = useState<Pick[]>([]);
  // Generated picks (separate)
  const [generatedPicks, setGeneratedPicks] = useState<Pick[]>([]);

  // Parlays (unchanged)
  const [parlays, setParlays] = useState<Parlay[]>([]);

  // UI states
  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedMarket, setSelectedMarket] = useState('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFreshness, setDataFreshness] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);

  // Filters
  const [filterStat, setFilterStat] = useState<string>('all');
  const [filterConfidence, setFilterConfidence] = useState<string>('all');
  const [filterEdge, setFilterEdge] = useState<number>(0);

  // Pagination
  const [displayCount, setDisplayCount] = useState(50);
  const PAGE_SIZE = 50;

  // Other UI
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [selectedWinnerPrompt, setSelectedWinnerPrompt] = useState('');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [selectedParlay, setSelectedParlay] = useState<Parlay | null>(null);
  const [showPickDetail, setShowPickDetail] = useState(false);
  const [showParlayModal, setShowParlayModal] = useState(false);
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Player Props');

  // ===== USAGE LIMIT STATE =====
  const [generationsRemaining, setGenerationsRemaining] = useState(DAILY_LIMIT); // daily limit
  const [lastGenerationDate, setLastGenerationDate] = useState<string | null>(null);

  const { error: apiError } = useDailyPicks();

  // ===== FETCH REMAINING GENERATIONS ON MOUNT =====
  useEffect(() => {
    if (user) {
      fetchRemainingGenerations();
    }
  }, [user]);

  const fetchRemainingGenerations = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${PYTHON_API_BASE}/api/user/generations/${user.uid}`);
      const data = await res.json();
      setGenerationsRemaining(data.remaining);
    } catch (err) {
      console.error('Failed to fetch generation limit', err);
    }
  };

  // Optional: daily reset check locally (if backend doesn't handle it)
  useEffect(() => {
    const checkDailyReset = () => {
      if (lastGenerationDate) {
        const last = new Date(lastGenerationDate);
        const now = new Date();
        const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
        if (diffHours >= 24) {
          setGenerationsRemaining(DAILY_LIMIT);
          setLastGenerationDate(null);
        }
      }
    };
    checkDailyReset();
  }, [lastGenerationDate]);

  // Fetch picks on mount/sport change
  useEffect(() => {
    fetchPicks();
  }, [selectedSport, selectedMarket]);

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [selectedSport, searchQuery, filterStat, filterConfidence, filterEdge]);

  // ============================================
  // MLB‑specific fetch and mapping
  // ============================================
  const fetchMLBPicks = async (): Promise<Pick[]> => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const endpoint = `${PYTHON_API_BASE}/api/mlb/props?date=${today}&limit=100`;
      console.log('⚾ Fetching MLB props from Python backend:', endpoint);
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`MLB API failed with status ${response.status}`);
      const data = await response.json();
      console.log('✅ MLB props response:', data);

      const props = data.props || [];
      const source = data.source || 'mock';
      if (props.length === 0) {
        console.log('⚠️ No MLB props returned');
        return [];
      }

      const picks: Pick[] = [];
      props.forEach((prop: any) => {
        picks.push(mapMLBPropToPick(prop, 'Over', source));
        picks.push(mapMLBPropToPick(prop, 'Under', source));
      });

      setDataFreshness(new Date().toISOString());
      setDataSources([source === 'mock' ? 'MLB Mock' : 'Tank01 (Python)']);
      return picks;
    } catch (err) {
      console.error('Error fetching MLB props:', err);
      return [];
    }
  };

  // ============================================
  // NHL‑specific fetch and mapping
  // ============================================
  const fetchNHLProps = async (): Promise<Pick[]> => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const endpoint = `${PYTHON_API_BASE}/api/nhl/props?date=${today}&limit=100`;
      console.log('🏒 Fetching NHL props from Python backend:', endpoint);
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`NHL API failed with status ${response.status}`);
      const data = await response.json();
      console.log('✅ NHL props response:', data);

      const props = data.props || [];
      const source = data.source || 'mock';
      if (props.length === 0) {
        console.log('⚠️ No NHL props returned');
        return [];
      }

      const picks: Pick[] = [];
      props.forEach((prop: any) => {
        picks.push(mapNHLPropToPick(prop, 'Over', source));
        picks.push(mapNHLPropToPick(prop, 'Under', source));
      });

      setDataFreshness(new Date().toISOString());
      setDataSources([source === 'mock' ? 'NHL Mock' : 'The Odds API (Python)']);
      return picks;
    } catch (err) {
      console.error('Error fetching NHL props:', err);
      return [];
    }
  };

  // ============================================
  // Main fetch function
  // ============================================
  const fetchPicks = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      let picksData: Pick[] = [];

      if (selectedSport === 'mlb') {
        picksData = await fetchMLBPicks();
      } else if (selectedSport === 'nhl') {
        picksData = await fetchNHLProps();
      } else {
        const timestamp = Date.now();
        const endpoint = `${NODE_API_BASE}/api/prizepicks/selections?sport=${selectedSport}&_t=${timestamp}`;
        console.log('📡 Fetching picks from Node API:', endpoint);
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`API failed with status ${response.status}`);
        const data = await response.json();
        console.log('✅ Node API response:', data);
        const selections = data?.selections || [];
        console.log(`📊 Received ${selections.length} selections from Node API`);
        if (selections.length > 0) {
          picksData = selections.map((sel: any) => mapNodeSelectionToPick(sel, selectedSport));
          setDataFreshness(new Date().toISOString());
          setDataSources([data.source || 'Node API', 'The Odds API', 'Tank01']);
        } else {
          setError('No picks received from API');
        }
      }

      if (picksData.length > 0) {
        const deduped = deduplicatePicks(picksData);
        console.log(`📊 After deduplication: ${deduped.length} unique picks`);
        setPicks(deduped);
      } else {
        setPicks([]);
      }

      setParlays(generateSampleParlays());
      setLastRefresh(new Date());
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching picks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateSampleParlays = (): Parlay[] => [
    {
      id: 'parlay-1',
      type: 'same_game_parlay',
      game: 'Lakers vs Warriors',
      legs: [
        { player: 'LeBron James', market: 'Points', line: 25.5, odds: -110 },
        { player: 'Stephen Curry', market: '3PT Made', line: 4.5, odds: -115 },
        { player: 'Anthony Davis', market: 'Rebounds', line: 11.5, odds: -105 },
      ],
      total_odds: '+450',
      confidence: 78,
      correlation_score: 85,
      analysis:
        'Strong correlation between LeBron points and Davis rebounds when playing together. Curry averages 4.8 3PT at home.',
    },
    {
      id: 'parlay-2',
      type: 'teaser',
      game: 'Bills vs Chiefs',
      legs: [
        { team: 'Bills', market: 'Spread', line: 7.5, odds: -110 },
        { team: 'Chiefs', market: 'Total', line: 54.5, odds: -110 },
      ],
      total_odds: '-120',
      confidence: 72,
      analysis: 'Teasing Bills through key numbers 3 and 7. Chiefs total adjusted for weather conditions.',
    },
  ];

  const debouncedSetSearch = useMemo(() => debounce((value: string) => setSearchQuery(value), 300), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearch(e.target.value);
  };

  // Filtered main picks
  const filteredPicks = useMemo(() => {
    let filtered = [...picks];
    if (selectedSport !== 'All') {
      filtered = filtered.filter((pick) => pick.sport.toLowerCase() === selectedSport.toLowerCase());
    }
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pick) =>
          (pick.player || '').toLowerCase().includes(lowerQuery) ||
          (pick.team || '').toLowerCase().includes(lowerQuery) ||
          (pick.sport || '').toLowerCase().includes(lowerQuery) ||
          (pick.stat || '').toLowerCase().includes(lowerQuery) ||
          (pick.type || '').toLowerCase().includes(lowerQuery)
      );
    }
    if (filterStat !== 'all') {
      filtered = filtered.filter((pick) => pick.stat?.toLowerCase().startsWith(filterStat.toLowerCase()));
    }
    if (filterConfidence !== 'all') {
      filtered = filtered.filter((pick) => {
        if (filterConfidence === 'high') return pick.confidence >= 80;
        if (filterConfidence === 'medium') return pick.confidence >= 60 && pick.confidence < 80;
        if (filterConfidence === 'low') return pick.confidence < 60;
        return true;
      });
    }
    if (filterEdge > 0) {
      filtered = filtered.filter((pick) => Math.abs(pick.edge_percentage ?? 0) >= filterEdge);
    }
    return filtered;
  }, [picks, selectedSport, searchQuery, filterStat, filterConfidence, filterEdge]);

  const filteredParlays = useMemo(() => {
    let filtered = [...parlays];
    if (selectedSport !== 'All') {
      filtered = filtered.filter((parlay) => parlay.game?.toLowerCase().includes(selectedSport.toLowerCase()));
    }
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (parlay) =>
          parlay.game?.toLowerCase().includes(lowerQuery) ||
          parlay.legs.some(
            (leg) =>
              leg.player?.toLowerCase().includes(lowerQuery) || leg.team?.toLowerCase().includes(lowerQuery)
          )
      );
    }
    return filtered;
  }, [parlays, selectedSport, searchQuery]);

  const displayedPicks = useMemo(() => filteredPicks.slice(0, displayCount), [filteredPicks, displayCount]);

  const handleLoadMore = () => setDisplayCount((prev) => prev + PAGE_SIZE);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPicks(true);
    setLastRefresh(new Date());
    setDisplayCount(PAGE_SIZE);
  }, []);

  const formatOdds = (odds: number | string | undefined): string => {
    if (!odds) return '';
    if (typeof odds === 'string') return odds;
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const calculateWinnings = (odds: string | number, betAmount = 100): number => {
    if (typeof odds === 'string') {
      const parsedOdds = parseInt(odds);
      if (parsedOdds > 0) return betAmount * (parsedOdds / 100);
      else return betAmount * (100 / Math.abs(parsedOdds));
    }
    return 0;
  };

  const handleTrackPick = (pick: Pick) => {
    if (pick.requiresPremium && !hasPremiumAccess) {
      setShowUpgradeModal(true);
      return;
    }
    setSelectedPick(pick);
    setShowPickDetail(true);
  };

  const handleParlaySelect = (parlay: Parlay) => {
    setSelectedParlay(parlay);
    setShowParlayModal(true);
  };

  const addToBetSlip = (item: Pick | Parlay) => {
    console.log('Added to bet slip:', item);
  };

  // ============================================
  // Helper to fetch raw selections for any sport
  // ============================================
  const fetchRawSelections = async (sport: string): Promise<any[]> => {
    if (sport === 'mlb') {
      const today = new Date().toISOString().split('T')[0];
      const endpoint = `${PYTHON_API_BASE}/api/mlb/props?date=${today}&limit=200`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`MLB API failed with status ${res.status}`);
      const data = await res.json();
      return data.props || [];
    } else if (sport === 'nhl') {
      const today = new Date().toISOString().split('T')[0];
      const endpoint = `${PYTHON_API_BASE}/api/nhl/props?date=${today}&limit=200`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`NHL API failed with status ${res.status}`);
      const data = await res.json();
      return data.props || [];
    } else {
      const timestamp = Date.now();
      const endpoint = `${NODE_API_BASE}/api/prizepicks/selections?sport=${sport}&_t=${timestamp}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Node API failed with status ${res.status}`);
      const data = await res.json();
      return data.selections || [];
    }
  };

  // ===== Sync remaining generations with backend after use =====
  const syncGenerationCountWithBackend = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${PYTHON_API_BASE}/api/user/generations/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid }),
      });
      const data = await res.json();
      setGenerationsRemaining(data.remaining);
    } catch (err) {
      console.error('Failed to sync generation count', err);
    }
  };

  // ===== Handle purchase of extra generations =====
  const handlePurchaseGenerations = async (quantity: number) => {
    if (!user) return;
    try {
      const res = await fetch(`${PYTHON_API_BASE}/api/user/generations/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, quantity }),
      });
      const data = await res.json();
      setGenerationsRemaining(data.remaining);
      setShowUpgradeModal(false);
    } catch (err) {
      console.error('Purchase failed', err);
    }
  };

  // ============================================
  // GENERATE CUSTOM PICKS – with usage limit
  // ============================================
  const handleGenerateCustomPicks = async () => {
    if (!customPrompt.trim()) return;

    // ----- Usage check -----
    if (generationsRemaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setGenerating(true);
    setShowGeneratingModal(true);
    console.log('🚀 Generating picks for prompt:', customPrompt);

    const MAX_RESULTS = 3; // Limit to 3 picks per generation

    // Detect side preference from prompt
    const lowerPrompt = customPrompt.toLowerCase();
    const preferOver = lowerPrompt.includes('over') || lowerPrompt.includes('high');
    const preferUnder = lowerPrompt.includes('under') || lowerPrompt.includes('low');

    try {
      // Fetch raw data for the current sport
      const rawItems = await fetchRawSelections(selectedSport);
      console.log(`📊 Received ${rawItems.length} raw items for ${selectedSport}`);

      if (rawItems.length === 0) {
        // Fallback mock pick (still returns 1)
        const mockPick: Pick = {
          id: `gen-${Date.now()}-mock`,
          player: 'Mock Player',
          team: 'Mock Team',
          sport: selectedSport.toUpperCase(),
          stat: 'Points',
          line: 20.5,
          projection: 22.3,
          confidence: 85,
          odds: '+150',
          edge: '+12%',
          edge_percentage: 12,
          analysis: 'This is a fallback pick generated because the API returned no data.',
          timestamp: 'Just now',
          category: 'High Confidence',
          probability: '85%',
          roi: '+18%',
          units: '2.0',
          requiresPremium: false,
          value: '12% edge',
          bookmaker: 'Mock API',
          generatedFrom: customPrompt,
          isToday: true,
          is_mock: true,
          data_source: 'mock',
        };
        setGeneratedPicks([mockPick]);
        setCustomPrompt('');
        setSelectedPrompt('');
        setSelectedWinnerPrompt('');
        // Decrement counter after generation (even if fallback)
        await syncGenerationCountWithBackend();
        setLastGenerationDate(new Date().toISOString());
        setTimeout(() => {
          setGenerating(false);
          setShowGeneratingModal(false);
        }, 1500);
        return;
      }

      // ---------- KEYWORD EXTRACTION ----------
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'with', 'by', 'about', 'as', 'of', 'from', 'top', 'this', 'that',
        'these', 'those', 'it', 'its', 'my', 'your', 'our', 'their', 'what',
        'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
        'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such',
        'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'month', 'day',
        'week', 'year', 'today', 'yesterday', 'tomorrow', 'predictions', 'prop',
        'props', 'player', 'players', 'game', 'games', 'stats', 'stat',
      ]);

      const SYNONYM_MAP: Record<string, string[]> = {
        scorers: ['points', 'scoring'],
        rebounders: ['rebounds', 'rebounding'],
        assists: ['assists', 'assist'],
        threes: ['three pointers', '3pt', 'three point'],
        blocks: ['blocks', 'blocked'],
        steals: ['steals', 'steal'],
        stats: ['points', 'rebounds', 'assists', 'steals', 'blocks'],
      };

      let keywords = customPrompt
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2 && !stopWords.has(word));

      const expandedKeywords = new Set<string>();
      keywords.forEach((kw) => {
        expandedKeywords.add(kw);
        if (TEAM_MAPPINGS[kw]) TEAM_MAPPINGS[kw].forEach((alias) => expandedKeywords.add(alias));
        if (SYNONYM_MAP[kw]) SYNONYM_MAP[kw].forEach((syn) => expandedKeywords.add(syn));
      });
      keywords = Array.from(expandedKeywords);
      console.log('🔍 Expanded keywords:', keywords);
      if (keywords.length === 0) keywords.push(selectedSport, 'player');

      // Score each raw item
      const scoredItems = rawItems.map((item: any) => {
        const searchable = [
          item.player,
          item.stat,
          item.stat_type,
          item.team,
          item.opponent,
          item.analysis,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase());

        let score = 0;
        keywords.forEach((keyword) => {
          searchable.forEach((field) => {
            if (field && field.includes(keyword)) score += 1;
          });
        });

        if (preferOver && item.type === 'Over') score += 10;
        if (preferUnder && item.type === 'Under') score += 10;

        return { item, score };
      });

      scoredItems.sort((a, b) => b.score - a.score);
      console.log('🔍 Top 5 scores:', scoredItems.slice(0, 5).map((s) => s.score));

      const highestScore = scoredItems[0]?.score || 0;
      let itemsToShow;
      let analysisNote;

      if (highestScore === 0) {
        let sortedByConfidence = [...rawItems];
        if (preferOver) {
          sortedByConfidence = sortedByConfidence.filter((s) => s.type === 'Over');
        } else if (preferUnder) {
          sortedByConfidence = sortedByConfidence.filter((s) => s.type === 'Under');
        }
        sortedByConfidence.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        itemsToShow = sortedByConfidence.slice(0, 20);
        analysisNote = `⚠️ No picks matched "${customPrompt}". Showing top value ${preferOver ? 'Over' : preferUnder ? 'Under' : ''} picks by confidence.`;
      } else {
        itemsToShow = scoredItems.slice(0, 20).map((item) => item.item);
        analysisNote = `✅ Showing top ${itemsToShow.length} picks most relevant to "${customPrompt}".`;
      }

      console.log(`🔍 Top selection score: ${highestScore}, showing ${itemsToShow.length} picks`);

      // Convert raw items to Pick objects
      let newPicks: Pick[] = [];
      if (selectedSport === 'mlb') {
        itemsToShow.forEach((prop: any) => {
          newPicks.push(mapMLBPropToPick(prop, 'Over', prop.source || 'api'));
          newPicks.push(mapMLBPropToPick(prop, 'Under', prop.source || 'api'));
        });
      } else if (selectedSport === 'nhl') {
        itemsToShow.forEach((prop: any) => {
          newPicks.push(mapNHLPropToPick(prop, 'Over', prop.source || 'api'));
          newPicks.push(mapNHLPropToPick(prop, 'Under', prop.source || 'api'));
        });
      } else {
        newPicks = itemsToShow.map((sel: any, index: number) => {
          const pick = mapNodeSelectionToPick(sel, selectedSport, customPrompt);
          if (index === 0 && analysisNote) pick.analysis = `${analysisNote}\n\n${pick.analysis}`;
          return pick;
        });
      }

      if ((selectedSport === 'mlb' || selectedSport === 'nhl') && newPicks.length > 0 && analysisNote) {
        newPicks[0].analysis = `${analysisNote}\n\n${newPicks[0].analysis}`;
      }

      console.log(`📦 Mapped ${newPicks.length} new picks`);

      const dedupedNewPicks = deduplicatePicks(newPicks);
      console.log(`📊 After dedup: ${dedupedNewPicks.length} unique picks`);

      const limitedPicks = dedupedNewPicks.slice(0, MAX_RESULTS);
      setGeneratedPicks(limitedPicks);
      setCustomPrompt('');
      setSelectedPrompt('');
      setSelectedWinnerPrompt('');

      // ----- Decrement usage after successful generation -----
      await syncGenerationCountWithBackend();
      setLastGenerationDate(new Date().toISOString());

      setTimeout(() => {
        setGenerating(false);
        setShowGeneratingModal(false);
      }, 1500);
    } catch (error) {
      console.error('❌ Error generating picks:', error);
      const fallbackPick: Pick = {
        id: `gen-${Date.now()}-fallback`,
        player: 'Fallback Player',
        team: 'Fallback Team',
        sport: selectedSport.toUpperCase(),
        stat: 'Points',
        line: 20.5,
        projection: 22.3,
        confidence: 80,
        odds: '+150',
        edge: '+10%',
        edge_percentage: 10,
        analysis: 'This is a fallback pick generated because the API request failed. Please try again later.',
        timestamp: 'Just now',
        category: 'Value Bet',
        probability: '80%',
        roi: '+15%',
        units: '1.5',
        requiresPremium: false,
        value: '10% edge',
        bookmaker: 'Fallback',
        generatedFrom: customPrompt,
        isToday: true,
        is_mock: true,
        data_source: 'mock',
      };
      setGeneratedPicks([fallbackPick]);
      setCustomPrompt('');
      setSelectedPrompt('');
      setSelectedWinnerPrompt('');
      setGenerating(false);
      setShowGeneratingModal(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderFreshnessIndicator = () => {
    if (!dataFreshness) return null;
    const freshnessDate = new Date(dataFreshness);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - freshnessDate.getTime()) / 60000);
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {diffMinutes < 5 ? (
            <CheckCircleOutline sx={{ color: '#10b981', mr: 1 }} />
          ) : (
            <Schedule sx={{ color: '#f59e0b', mr: 1 }} />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Data updated {diffMinutes} minutes ago
          </Typography>
          {dataSources.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {dataSources.map((source) => (
                <Tooltip key={source} title={source}>
                  <Chip
                    label={source
                      .split('-')
                      .map((s) => s[0])
                      .join('')
                      .toUpperCase()}
                    size="small"
                    sx={{ bgcolor: 'grey.200' }}
                  />
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  const DebugPanel = () => (
    <Collapse in={showDebugPanel}>
      <Paper sx={{ p: 2, mb: 4, bgcolor: '#1e293b', color: 'white', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <BugReport fontSize="small" />
            <Typography variant="h6">Debug Panel</Typography>
          </Box>
          <Chip label="Dev Mode" size="small" sx={{ bgcolor: '#ef4444', color: 'white' }} />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="#94a3b8" gutterBottom>
              Component Stats
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">• Standard Picks: {picks.length}</Typography>
              <Typography variant="body2">• Generated Picks: {generatedPicks.length}</Typography>
              <Typography variant="body2">• Parlays: {parlays.length}</Typography>
              <Typography variant="body2">• Selected Market: {selectedMarket}</Typography>
              <Typography variant="body2">• Selected Sport: {selectedSport}</Typography>
              <Typography variant="body2">
                • Last Refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}
              </Typography>
              <Typography variant="body2">• Loading: {loading ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">• Filter Stat: {filterStat}</Typography>
              <Typography variant="body2">• Filter Confidence: {filterConfidence}</Typography>
              <Typography variant="body2">• Filter Edge Min: {filterEdge}%</Typography>
              <Typography variant="body2">
                • Displayed Picks: {displayedPicks.length} / {filteredPicks.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="#94a3b8" gutterBottom>
              API Status
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2">
                • Daily Picks API: {apiError ? '❌ Error' : '✅ Connected'}
              </Typography>
              <Typography variant="body2">• Data Sources: {dataSources.join(', ') || 'unknown'}</Typography>
              <Typography variant="body2">
                • Freshness: {dataFreshness ? new Date(dataFreshness).toLocaleTimeString() : 'N/A'}
              </Typography>
              <Typography variant="body2">• Generations Remaining: {generationsRemaining}</Typography>
            </Box>
            <Box mt={2}>
              <Button
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: '#64748b', mr: 1 }}
                onClick={handleRefresh}
              >
                Force Refresh
              </Button>
              <Button
                size="small"
                variant="outlined"
                sx={{ color: 'white', borderColor: '#64748b' }}
                onClick={() =>
                  console.log('Debug state:', {
                    picks,
                    parlays,
                    selectedMarket,
                    selectedSport,
                    dataFreshness,
                    filterStat,
                    filterConfidence,
                    filterEdge,
                    generationsRemaining,
                  })
                }
              >
                Log State
              </Button>
            </Box>
          </Grid>
        </Grid>
        {apiError && (
          <Alert severity="error" sx={{ mt: 2, bgcolor: '#7f1d1d' }}>
            <AlertTitle>API Error</AlertTitle>
            {String(apiError)}
          </Alert>
        )}
      </Paper>
    </Collapse>
  );

  const renderSportSelector = () => (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Sport
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', py: 1 }}>
        <Chip
          label="All"
          onClick={() => setSelectedSport('All')}
          color={selectedSport === 'All' ? 'primary' : 'default'}
          variant={selectedSport === 'All' ? 'filled' : 'outlined'}
          sx={{ minWidth: 60 }}
        />
        {SPORTS.map((sport) => {
          const Icon = SPORT_ICONS[sport.icon];
          return (
            <Chip
              key={sport.id}
              icon={<Icon />}
              label={sport.name}
              onClick={() => setSelectedSport(sport.id)}
              color={selectedSport === sport.id ? 'primary' : 'default'}
              variant={selectedSport === sport.id ? 'filled' : 'outlined'}
              sx={{
                '& .MuiChip-icon': { color: selectedSport === sport.id ? 'white' : 'inherit' },
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );

  const renderMarketSelector = () => (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Market Type
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1 }}>
        {MARKET_TYPES.map((market) => {
          const Icon = MARKET_ICONS[market.icon];
          return (
            <Chip
              key={market.id}
              icon={<Icon />}
              label={market.name}
              onClick={() => setSelectedMarket(market.id)}
              color={selectedMarket === market.id ? 'primary' : 'default'}
              variant={selectedMarket === market.id ? 'filled' : 'outlined'}
              sx={{
                '& .MuiChip-icon': { color: selectedMarket === market.id ? 'white' : 'inherit' },
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );

  const renderFilterBar = () => (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="subtitle2" color="text.secondary">
          Filter Picks
        </Typography>
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <Select value={filterStat} onChange={(e) => setFilterStat(e.target.value)} displayEmpty>
              <MenuItem value="all">All Stats</MenuItem>
              <MenuItem value="points">Points</MenuItem>
              <MenuItem value="assists">Assists</MenuItem>
              <MenuItem value="rebounds">Rebounds</MenuItem>
              <MenuItem value="threes">3PM</MenuItem>
              <MenuItem value="blocks">Blocks</MenuItem>
              <MenuItem value="steals">Steals</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <Select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">All Confidence</MenuItem>
              <MenuItem value="high">High (80%+)</MenuItem>
              <MenuItem value="medium">Medium (60‑79%)</MenuItem>
              <MenuItem value="low">Low (&lt;60%)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              Edge ≥ {filterEdge}%
            </Typography>
            <Slider
              value={filterEdge}
              onChange={(_, val) => setFilterEdge(val as number)}
              step={1}
              marks
              min={0}
              max={20}
              valueLabelDisplay="auto"
              sx={{ flex: 1 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => {
              setFilterStat('all');
              setFilterConfidence('all');
              setFilterEdge(0);
            }}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderParlayCard = (parlay: Parlay) => {
    const ParlayIcon =
      MARKET_ICONS[parlay.type === 'same_game_parlay' ? 'same_game' : parlay.type === 'teaser' ? 'teaser' : 'round_robin'];
    return (
      <Card
        key={parlay.id}
        sx={{
          mb: 3,
          borderLeft: 4,
          borderColor: getRecommendationColor(parlay.confidence),
          cursor: 'pointer',
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(4px)',
          '&:hover': { boxShadow: 3, transform: 'translateY(-2px)', transition: 'all 0.2s', bgcolor: 'white' },
        }}
        onClick={() => handleParlaySelect(parlay)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ParlayIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                {parlay.type
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </Typography>
            </Box>
            <ConfidenceBadge confidence={parlay.confidence} />
          </Box>
          {parlay.game && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {parlay.game}
            </Typography>
          )}
          {parlay.correlation_score && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
              <ShowChart sx={{ color: '#10b981', fontSize: 16 }} />
              <Typography variant="caption" color="#10b981" fontWeight="bold">
                {parlay.correlation_score}% Correlation
              </Typography>
            </Box>
          )}
          <Paper sx={{ bgcolor: 'grey.50', p: 2, mb: 2 }}>
            {parlay.legs.slice(0, 3).map((leg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: index < parlay.legs.slice(0, 3).length - 1 ? 1 : 0,
                }}
              >
                <Typography variant="body2">
                  {leg.player || leg.team} - {leg.market}
                  {leg.line && ` O${leg.line}`}
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {formatOdds(leg.odds)}
                </Typography>
              </Box>
            ))}
            {parlay.legs.length > 3 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                +{parlay.legs.length - 3} more legs
              </Typography>
            )}
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Odds
              </Typography>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                {formatOdds(parlay.total_odds)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{ bgcolor: 'primary.main' }}
              onClick={(e) => {
                e.stopPropagation();
                addToBetSlip(parlay);
              }}
            >
              Add to Bet Slip
            </Button>
          </Box>
          {parlay.analysis && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {parlay.analysis}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const ParlayDetailsModal = () => (
    <Dialog open={showParlayModal} onClose={() => setShowParlayModal(false)} maxWidth="md" fullWidth>
      {selectedParlay && (
        <>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                {selectedParlay.type === 'same_game_parlay' && <Gamepad sx={{ color: 'primary.main' }} />}
                {selectedParlay.type === 'teaser' && <ExpandMore sx={{ color: 'primary.main' }} />}
                {selectedParlay.type === 'round_robin' && <Loop sx={{ color: 'primary.main' }} />}
                <Typography variant="h6">
                  {selectedParlay.type
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </Typography>
              </Box>
              <IconButton onClick={() => setShowParlayModal(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              {selectedParlay.game && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedParlay.game}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Legs ({selectedParlay.legs.length})
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {selectedParlay.legs.map((leg, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {leg.player || leg.team}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {leg.market} {leg.line && `O${leg.line}`}
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            {formatOdds(leg.odds)}
                          </Typography>
                        </Box>
                        {index < selectedParlay.legs.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payout Calculation
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="text.secondary">Total Odds</Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {formatOdds(selectedParlay.total_odds)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">$100 Wins</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        ${calculateWinnings(selectedParlay.total_odds).toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              {selectedParlay.analysis && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Analysis
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedParlay.analysis}
                      </Typography>
                      {selectedParlay.correlation_score && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                          <ShowChart sx={{ color: '#10b981', fontSize: 16 }} />
                          <Typography variant="caption" color="#10b981" fontWeight="bold">
                            {selectedParlay.correlation_score}% Correlation Score
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowParlayModal(false)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                addToBetSlip(selectedParlay);
                setShowParlayModal(false);
              }}
            >
              Add to Bet Slip
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const PickDetailModal = () => (
    <Dialog open={showPickDetail} onClose={() => setShowPickDetail(false)} maxWidth="md" fullWidth>
      {selectedPick && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  bgcolor: SPORT_COLORS[selectedPick.sport as keyof typeof SPORT_COLORS] || '#6b7280',
                }}
              >
                {selectedPick.player.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedPick.player}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPick.team} • {selectedPick.sport}{' '}
                  {selectedPick.position && `• ${selectedPick.position}`}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h5" color="#f59e0b" fontWeight="bold">
                      {selectedPick.stat}
                    </Typography>
                    <Box mt={2}>
                      <ConfidenceMeter
                        score={selectedPick.confidence}
                        level={
                          selectedPick.confidence >= 90
                            ? 'very-high'
                            : selectedPick.confidence >= 85
                            ? 'high'
                            : selectedPick.confidence >= 80
                            ? 'medium'
                            : 'low'
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Pick Details
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedPick.odds && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              Odds
                            </Typography>
                            <Typography variant="h6">{formatOdds(selectedPick.odds)}</Typography>
                            {selectedPick.bookmaker && (
                              <Typography variant="caption" color="text.secondary">
                                {selectedPick.bookmaker}
                              </Typography>
                            )}
                          </Grid>
                        </>
                      )}
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Edge
                        </Typography>
                        <Typography
                          variant="h6"
                          color={selectedPick.edge_percentage && selectedPick.edge_percentage > 0 ? '#10b981' : '#ef4444'}
                        >
                          {selectedPick.edge_percentage !== undefined
                            ? selectedPick.edge_percentage > 0
                              ? `+${selectedPick.edge_percentage}%`
                              : `${selectedPick.edge_percentage}%`
                            : selectedPick.edge || 'N/A'}
                        </Typography>
                      </Grid>
                      {selectedPick.projection && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Projection
                          </Typography>
                          <Typography variant="h6">{selectedPick.projection.toFixed(1)}</Typography>
                        </Grid>
                      )}
                      {selectedPick.value && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Value
                          </Typography>
                          <Typography variant="h6" color="#f59e0b">
                            {selectedPick.value}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Analysis
                    </Typography>
                    <Typography variant="body2">{selectedPick.analysis}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPickDetail(false)}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                addToBetSlip(selectedPick);
                setShowPickDetail(false);
              }}
            >
              Add to Bet Slip
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const ConfidenceMeter = ({ score, level }: { score: number; level: string }) => {
    const getLevelColor = (levelStr: string) => {
      const colors: Record<string, string> = {
        'very-high': '#10b981',
        high: '#3b82f6',
        medium: '#f59e0b',
        low: '#ef4444',
        'very-low': '#dc2626',
      };
      return colors[levelStr] || '#64748b';
    };
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 80, bgcolor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ width: `${Math.min(score, 100)}%`, height: 8, bgcolor: getLevelColor(level) }} />
        </Box>
        <Typography variant="caption" fontWeight="bold" color={getLevelColor(level)}>
          {score}%
        </Typography>
      </Box>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading && !refreshing && picks.length === 0) {
    return (
      <>
        {/* Background layer */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            background: 'radial-gradient(circle at 20% 30%, rgba(33,150,243,0.15) 0%, transparent 40%), linear-gradient(135deg, #0a1929 0%, #1a2f3f 100%)',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
              opacity: 0.4,
              pointerEvents: 'none',
            },
          }}
        />
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
            <CircularProgress size={40} />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading daily picks...
            </Typography>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* Background layer */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          background: 'radial-gradient(circle at 20% 30%, rgba(33,150,243,0.15) 0%, transparent 40%), linear-gradient(135deg, #0a1929 0%, #1a2f3f 100%)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            opacity: 0.4,
            pointerEvents: 'none',
          },
        }}
      />

      <Container maxWidth="lg">
        {/* Header with semi‑transparency */}
        <Paper
          sx={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(29,78,216,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            mb: 4,
            p: 3,
            color: 'white',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" gap={1}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                variant="outlined"
                size="small"
              >
                Back
              </Button>
              <Button
                startIcon={<BugReport />}
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  bgcolor: showDebugPanel ? 'rgba(0,0,0,0.3)' : 'transparent',
                }}
                variant="outlined"
                size="small"
              >
                {showDebugPanel ? 'Hide Debug' : 'Debug'}
              </Button>
            </Box>
            {lastRefresh && (
              <Chip
                label={`Last updated: ${lastRefresh.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={3}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
              <CalendarToday sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Daily Picks
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                AI-curated selections with highest probability of success
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Debug Panel */}
        <DebugPanel />

        {/* Sport Selector */}
        {renderSportSelector()}

        {/* Market Type Selector */}
        {renderMarketSelector()}

        {/* Freshness Indicator */}
        {renderFreshnessIndicator()}

        {/* Action Bar (only shown in All Picks tab) */}
        {tabIndex === 0 && (
          <Paper sx={{ p: 2, mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box display="flex" justifyContent="flex-start">
                  <TextField
                    placeholder="Search picks..."
                    size="small"
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 250 }}
                  />
                  <IconButton onClick={handleRefresh} disabled={loading} sx={{ ml: 1 }}>
                    <Refresh />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
          <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} centered>
            <Tab label="All Picks" icon={<BarChart />} iconPosition="start" />
            <Tab label="AI Generator" icon={<SmartToy />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab 0: All Picks */}
        {tabIndex === 0 && (
          <>
            {renderFilterBar()}

            {/* Parlays Section (if not standard market) */}
            {selectedMarket !== 'standard' && filteredParlays.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {selectedMarket === 'same_game' && '🎮 Same Game Parlays'}
                  {selectedMarket === 'teaser' && '📊 Teaser Recommendations'}
                  {selectedMarket === 'round_robin' && '🔄 Round Robin Combinations'}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedMarket === 'same_game' && 'Correlated plays from the same game maximize value'}
                  {selectedMarket === 'teaser' && 'Adjusted spreads with increased win probability'}
                  {selectedMarket === 'round_robin' && 'Multiple parlay combinations for reduced risk'}
                </Typography>
                {filteredParlays.map(renderParlayCard)}
              </Box>
            )}

            {/* Standard Picks */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                ⭐ Top Value Picks {filteredPicks.length > 0 && `(${filteredPicks.length})`}
              </Typography>
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : displayedPicks.length > 0 ? (
                <>
                  {displayedPicks.map((pick) => (
                    <PickCard
                      key={pick.id}
                      pick={pick}
                      onTrack={handleTrackPick}
                      onAddToBetSlip={addToBetSlip}
                      hasPremiumAccess={hasPremiumAccess}
                    />
                  ))}
                  {displayedPicks.length < filteredPicks.length && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button variant="outlined" onClick={handleLoadMore}>
                        Load More ({filteredPicks.length - displayedPicks.length} remaining)
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  <AlertTitle>No Picks Found</AlertTitle>
                  No picks match the current filters. Try adjusting your filters or sport selection.
                </Alert>
              )}
            </Box>
          </>
        )}

        {/* Tab 1: AI Generator */}
        {tabIndex === 1 && (
          <Box sx={{ mb: 4 }}>
            {/* Generator Input */}
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome color="primary" />
                Generate Custom Picks
              </Typography>

              {/* Remaining generations indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Generations left today: <strong>{generationsRemaining}</strong>
                </Typography>
                {generationsRemaining === 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowUpgradeModal(true)}
                    sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                  >
                    Buy more
                  </Button>
                )}
              </Box>

              {/* Dropdowns + input row */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Props Prompt Dropdown */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={selectedPrompt}
                    onChange={(e) => {
                      setSelectedPrompt(e.target.value);
                      setCustomPrompt(e.target.value);
                    }}
                    displayEmpty
                  >
                    <MenuItem value=""><em>Props prompts</em></MenuItem>
                    {UNIVERSAL_PROMPTS.map(prompt => (
                      <MenuItem key={prompt} value={prompt}>{prompt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Winner Prompts Dropdown */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={selectedWinnerPrompt}
                    onChange={(e) => {
                      setSelectedWinnerPrompt(e.target.value);
                      setCustomPrompt(e.target.value);
                    }}
                    displayEmpty
                  >
                    <MenuItem value=""><em>Winner prompts</em></MenuItem>
                    {WINNER_PROMPTS.map(prompt => (
                      <MenuItem key={prompt} value={prompt}>{prompt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Or type your own prompt..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleGenerateCustomPicks}
                  disabled={!customPrompt.trim() || generating || generationsRemaining <= 0}
                  sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                >
                  {generating ? 'Generating...' : 'Generate'}
                </Button>
              </Box>

              {/* Quick Prompts */}
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Quick prompts
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {USEFUL_PROMPTS.flatMap((cat) => cat.prompts)
                  .slice(0, 8)
                  .map((prompt) => (
                    <Chip
                      key={prompt}
                      label={prompt}
                      onClick={() => {
                        setCustomPrompt(prompt);
                        setTimeout(() => handleGenerateCustomPicks(), 100);
                      }}
                      icon={<Search />}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
              </Box>
            </Paper>

            {/* Generated Picks */}
            <Typography variant="h6" gutterBottom>
              Generated Picks {generatedPicks.length > 0 && `(${generatedPicks.length})`}
            </Typography>
            {generatedPicks.length > 0 ? (
              generatedPicks.map((pick) => (
                <PickCard
                  key={pick.id}
                  pick={pick}
                  onTrack={handleTrackPick}
                  onAddToBetSlip={addToBetSlip}
                  hasPremiumAccess={hasPremiumAccess}
                />
              ))
            ) : (
              <Alert severity="info">
                <AlertTitle>No generated picks yet</AlertTitle>
                Enter a prompt above and click Generate to create AI-powered picks.
              </Alert>
            )}
          </Box>
        )}

        {/* Modals */}
        <ParlayDetailsModal />
        <PickDetailModal />

        {/* Upgrade Modal – with purchase options */}
        <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock sx={{ color: '#f59e0b' }} />
              <Typography variant="h6">Need More Generations?</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography paragraph>
              You've used your {DAILY_LIMIT} daily generations. Upgrade or purchase extra to keep generating.
            </Typography>
            <Box sx={{ my: 3 }}>
              {[
                'Unlimited daily generations',
                'Premium picks & analysis',
                'Advanced AI models',
                'No daily limits',
                'Same game parlay recommendations',
                'Correlation scores & teaser analysis',
              ].map((feature) => (
                <Box key={feature} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="#10b981" gutterBottom>
                      Extra Generations
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      $3.99
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      +5 generations
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#10b981' }}
                      onClick={() => handlePurchaseGenerations(5)}
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ borderColor: '#f59e0b', borderWidth: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="#f59e0b" gutterBottom>
                      Full Access
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      $14.99/mo
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Unlimited everything
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#f59e0b' }}
                      onClick={() => {
                        // Handle subscription (e.g., redirect to subscription page)
                      }}
                    >
                      Subscribe
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUpgradeModal(false)}>Not Now</Button>
          </DialogActions>
        </Dialog>

        {/* Generating Modal */}
        <Dialog open={showGeneratingModal} onClose={() => !generating && setShowGeneratingModal(false)}>
          <DialogContent sx={{ textAlign: 'center', py: 4, px: 6 }}>
            {generating ? (
              <>
                <CircularProgress size={48} sx={{ color: '#f59e0b', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Generating AI Picks...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fetching player props and filtering by your prompt
                </Typography>
              </>
            ) : (
              <>
                <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Picks Generated!
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your custom AI picks have been added to the AI Generator tab.
                </Typography>
                <Button variant="contained" onClick={() => setShowGeneratingModal(false)} sx={{ bgcolor: '#f59e0b' }}>
                  View Results
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer watermark */}
        <Box sx={{ mt: 6, textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
          <Typography variant="caption" color="text.secondary">
            AI‑powered daily picks · data updated in real‑time
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default DailyPicksScreen;
