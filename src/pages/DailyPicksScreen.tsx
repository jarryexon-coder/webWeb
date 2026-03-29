// src/pages/DailyPicksScreen.tsx – Complete with Stripe subscription and generator credits integration
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
  SportsSoccer,
  Gamepad,
  Loop,
  ShowChart,
  CheckCircleOutline,
  FilterList,
  SmartToy,
  CloudSync,
  History,
  Event,
  CreditCard,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDailyPicks } from '../hooks/useunifiedAPI';
import { useAuth } from '../contexts/AuthContext';

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
  edge_percentage?: number;
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
  last_updated?: string;
  opponent?: string;
  stat_type?: string;
  description?: string;
  is_live?: boolean;
  is_boosted?: boolean;
  game_date?: string;
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
const POLLING_INTERVAL = 60000;
const RATE_LIMIT_BACKOFF = 30000;
const MAX_VISIBLE_CARDS_PER_SPORT = 3;

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

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
  'Game Pick': '#8b5cf6',
};

const CONFIDENCE_COLORS = {
  80: '#22c55e',
  70: '#eab308',
  60: '#f97316',
  default: '#6b7280',
};

// ============================================
// WINNER_PROMPTS
// ============================================
const WINNER_PROMPTS = [
  'Today\'s biggest favorites',
  'Upset predictions for tonight',
  'Best moneyline bets',
  'Teams on winning streaks',
  'Home underdogs to watch',
  'Highest implied win probability',
  'Teams with key injuries – fade',
  'Best value on the moneyline',
  'Parlay of the day (winners)',
  'Teams in bounce‑back spots',
  'Top scorers tonight',
  'Best rebounders',
  'Players with most assists',
  'High steals projections',
  'Block leaders',
];

// ============================================
// KEYWORD MAP
// ============================================
const KEYWORD_MAP: Record<string, string[]> = {
  'scorers': ['points', 'scoring', 'score', 'pts', 'point', 'ppg'],
  'points': ['points', 'scoring', 'score', 'pts', 'point', 'ppg'],
  'scoring': ['points', 'scorers', 'score', 'pts', 'point'],
  'moneyline': ['moneyline', 'ml', 'win', 'winner', 'victory', 'favorite', 'underdog'],
  'over': ['over', 'overs', 'greater', 'higher', 'more than', 'above'],
  'under': ['under', 'unders', 'less', 'lower', 'fewer than', 'below'],
  'rebounds': ['rebounds', 'reb', 'boards', 'glass', 'rebounding'],
  'assists': ['assists', 'ast', 'dimes', 'passing', 'playmaker'],
  'threes': ['three', '3pt', '3-point', 'three pointers', 'threes', '3pm'],
  'blocks': ['blocks', 'blk', 'rejections', 'shot blocker'],
  'steals': ['steals', 'stl', 'thieves', 'steal', 'deflections'],
  'underdogs': ['underdog', 'dogs', 'unlikely', 'surprising', 'value'],
  'favorites': ['favorite', 'favs', 'expected', 'projected', 'chalk'],
  'best': ['best', 'top', 'elite', 'premium', 'highest', 'leading'],
  'value': ['value', 'edge', 'positive', 'good odds', 'plus edge'],
  'upset': ['upset', 'underdog', 'surprise', 'upset alert'],
  'lock': ['lock', 'sure thing', 'safe bet', 'high confidence'],
  'streak': ['streak', 'winning streak', 'hot streak', 'losing streak'],
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const getRecommendationColor = (confidence: number): string => {
  if (confidence >= 80) return CONFIDENCE_COLORS[80];
  if (confidence >= 70) return CONFIDENCE_COLORS[70];
  if (confidence >= 60) return CONFIDENCE_COLORS[60];
  return CONFIDENCE_COLORS.default;
};

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

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
// generateGamePicksFromPlayerProps
// ============================================
const generateGamePicksFromPlayerProps = (prompt: string, playerPicks: Pick[], sport: string): Pick[] => {
  const lowerPrompt = prompt.toLowerCase();
  const gamePicks: Pick[] = [];
  
  const generatedGames = new Set<string>();
  const gameMap = new Map<string, { 
    team: string, 
    opponent: string, 
    teamPicks: Pick[], 
    opponentPicks: Pick[],
    teamPlayers: Set<string>,
    opponentPlayers: Set<string>
  }>();
  
  playerPicks.forEach(pick => {
    if (pick.team && pick.opponent && pick.team !== pick.opponent && pick.team !== 'TBD' && pick.opponent !== 'TBD') {
      const teams = [pick.team, pick.opponent].sort();
      const gameKey = `${teams[0]}-vs-${teams[1]}`;
      
      if (!gameMap.has(gameKey)) {
        gameMap.set(gameKey, { 
          team: teams[0], 
          opponent: teams[1], 
          teamPicks: [], 
          opponentPicks: [],
          teamPlayers: new Set<string>(),
          opponentPlayers: new Set<string>()
        });
      }
      
      const game = gameMap.get(gameKey)!;
      if (pick.team === game.team) {
        game.teamPicks.push(pick);
        game.teamPlayers.add(pick.player);
      } else if (pick.team === game.opponent) {
        game.opponentPicks.push(pick);
        game.opponentPlayers.add(pick.player);
      }
    }
  });

  const allPicks = playerPicks.filter(p => p.projection && p.line && p.line > 0);
  const leagueAvgRatio = allPicks.length > 0 
    ? allPicks.reduce((sum, p) => sum + (p.projection! / p.line!), 0) / allPicks.length 
    : 1.0;
  
  const leagueAvgProjection = allPicks.length > 0
    ? allPicks.reduce((sum, p) => sum + p.projection!, 0) / allPicks.length
    : 10;
    
  const leagueAvgLine = allPicks.length > 0
    ? allPicks.reduce((sum, p) => sum + p.line!, 0) / allPicks.length
    : 10;

  gameMap.forEach((game, key) => {
    if (generatedGames.has(key)) return;
    generatedGames.add(key);
    
    const teamData = game.teamPicks;
    const opponentData = game.opponentPicks;
    
    let teamValidPicks = 0;
    let teamScore = 0;
    let teamTotalProjection = 0;
    let teamTotalLine = 0;
    let teamPlayersAboveLine = 0;
    let teamPlayersBelowLine = 0;
    
    teamData.forEach(pick => {
      if (pick.projection && pick.line && pick.line > 0) {
        const ratio = pick.projection / pick.line;
        teamScore += ratio;
        teamTotalProjection += pick.projection;
        teamTotalLine += pick.line;
        teamValidPicks++;
        
        if (ratio > 1.05) teamPlayersAboveLine++;
        if (ratio < 0.95) teamPlayersBelowLine++;
      }
    });

    let opponentValidPicks = 0;
    let opponentScore = 0;
    let opponentTotalProjection = 0;
    let opponentTotalLine = 0;
    let opponentPlayersAboveLine = 0;
    let opponentPlayersBelowLine = 0;
    
    if (opponentData.length >= 3) {
      opponentData.forEach(pick => {
        if (pick.projection && pick.line && pick.line > 0) {
          const ratio = pick.projection / pick.line;
          opponentScore += ratio;
          opponentTotalProjection += pick.projection;
          opponentTotalLine += pick.line;
          opponentValidPicks++;
          
          if (ratio > 1.05) opponentPlayersAboveLine++;
          if (ratio < 0.95) opponentPlayersBelowLine++;
        }
      });
    } else {
      const homeAdjustment = Math.random() > 0.5 ? 1.02 : 0.98;
      opponentValidPicks = Math.max(5, teamValidPicks);
      opponentScore = leagueAvgRatio * homeAdjustment * opponentValidPicks;
      opponentTotalProjection = leagueAvgProjection * homeAdjustment * opponentValidPicks;
      opponentTotalLine = leagueAvgLine * opponentValidPicks;
      opponentPlayersAboveLine = Math.round(opponentValidPicks * 0.4);
      opponentPlayersBelowLine = Math.round(opponentValidPicks * 0.3);
    }

    const MIN_PLAYER_PROPS = 3;
    if (teamValidPicks < MIN_PLAYER_PROPS || opponentValidPicks < MIN_PLAYER_PROPS) {
      return;
    }

    const teamAvgRatio = teamScore / teamValidPicks;
    const opponentAvgRatio = opponentScore / opponentValidPicks;
    const scoreDifference = Math.abs(teamAvgRatio - opponentAvgRatio);
    
    const teamInjuryImpact = teamValidPicks < 8 ? (8 - teamValidPicks) * 2 : 0;
    const opponentInjuryImpact = opponentValidPicks < 8 ? (8 - opponentValidPicks) * 2 : 0;
    
    const dataQualityBonus = Math.min(20, (teamValidPicks + opponentValidPicks) * 1.2);
    const projectionAdvantage = Math.abs(
      (teamTotalProjection / teamValidPicks) - (opponentTotalProjection / opponentValidPicks)
    ) / Math.max(teamTotalLine / teamValidPicks, opponentTotalLine / opponentValidPicks) * 25;
    
    let confidence = Math.min(88, Math.round(
      (scoreDifference * 40) + 48 + dataQualityBonus + projectionAdvantage -
      (teamInjuryImpact * 0.5) + (opponentInjuryImpact * 0.3)
    ));
    confidence = Math.max(58, Math.min(88, confidence));
    
    const teamIsFavorite = teamAvgRatio > opponentAvgRatio;
    const favorite = teamIsFavorite ? game.team : game.opponent;
    
    let odds = '';
    let edgePercentage = 0;
    if (teamIsFavorite) {
      const oddsValue = Math.round(160 - (scoreDifference * 60) - (confidence - 50) * 1.5);
      odds = `-${Math.max(115, Math.min(220, oddsValue))}`;
      edgePercentage = Math.round(scoreDifference * 50 + (confidence - 50) * 0.8);
    } else {
      const oddsValue = Math.round(140 + (scoreDifference * 80) + (85 - confidence) * 2);
      odds = `+${Math.max(130, Math.min(300, oddsValue))}`;
      edgePercentage = Math.round(scoreDifference * 45 + (85 - confidence) * 1.2);
    }

    const isMoneylinePrompt = lowerPrompt.includes('moneyline') || lowerPrompt.includes('winner');
    if (isMoneylinePrompt) {
      const analysis = `${favorite} has the advantage based on player projections. ` +
        `${game.team} at ${Math.round(teamAvgRatio * 100)}% efficiency ` +
        `(${teamPlayersAboveLine} players above line, ${teamPlayersBelowLine} below). ` +
        `${game.opponent} at ${Math.round(opponentAvgRatio * 100)}% efficiency ` +
        `(${opponentPlayersAboveLine} above, ${opponentPlayersBelowLine} below).`;
      
      const gamePick: Pick = {
        id: `game-${Date.now()}-${Math.random()}`,
        player: `${game.team} vs ${game.opponent}`,
        team: game.team,
        opponent: game.opponent,
        sport: sport.toUpperCase(),
        stat: `Moneyline - ${favorite}`,
        line: 1,
        projection: teamIsFavorite ? 1.25 : 0.85,
        confidence: confidence,
        odds: odds,
        edge: `${edgePercentage > 0 ? '+' : ''}${edgePercentage}%`,
        edge_percentage: teamIsFavorite ? edgePercentage : -edgePercentage,
        analysis: analysis,
        timestamp: new Date().toLocaleString(),
        category: 'Game Pick',
        probability: `${confidence}%`,
        roi: edgePercentage > 0 ? `+${Math.abs(edgePercentage)}%` : `${edgePercentage}%`,
        units: (Math.random() * 2 + 1).toFixed(1),
        requiresPremium: false,
        value: `${Math.abs(edgePercentage)}% edge`,
        bookmaker: 'AI Generated',
        generatedFrom: prompt,
        isToday: true,
        type: 'Over',
        is_mock: opponentData.length < 3,
        data_source: opponentData.length >= 3 ? 'Full Data' : 'Partial + League Averages',
        last_updated: new Date().toISOString(),
        game_date: getTodayString(),
      };
      gamePicks.push(gamePick);
    }
  });

  gamePicks.sort((a, b) => b.confidence - a.confidence);
  return gamePicks.slice(0, 4);
};

// ============================================
// MAP NODE API SELECTION TO PICK
// ============================================
const mapNodeSelectionToPick = (sel: any, sport: string, prompt?: string): Pick => {
  let confidenceValue = 70;
  if (typeof sel.confidence === 'number') {
    confidenceValue = sel.confidence;
  } else if (sel.confidence === 'high') {
    confidenceValue = 85;
  } else if (sel.confidence === 'medium') {
    confidenceValue = 70;
  } else if (sel.confidence === 'low') {
    confidenceValue = 55;
  }
  
  confidenceValue = Math.min(100, Math.max(0, confidenceValue));

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

  let displayEdgeStr = sel.edge;
  if (signedEdgePercent !== undefined && !displayEdgeStr) {
    displayEdgeStr = signedEdgePercent > 0 ? `+${signedEdgePercent}%` : `${signedEdgePercent}%`;
  } else if (displayEdgeStr && !displayEdgeStr.includes('%')) {
    displayEdgeStr = `${parseFloat(displayEdgeStr).toFixed(1)}%`;
  } else if (!displayEdgeStr && hasValidNumbers && !sel.type) {
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
      : 'High Upset';

  const roundedLine = lineVal ? Math.round(lineVal * 10) / 10 : undefined;
  const roundedProjection = proj ? Math.round(proj * 10) / 10 : undefined;

  const playerName = sel.player || sel.player_name || sel.name || 'Unknown';
  let statType = sel.stat || sel.stat_type || sel.market;
  const team = sel.team || getPlayerTeam(playerName);
  const opponent = sel.opponent || null;
  const odds = sel.odds || sel.price;
  const timestamp = sel.timestamp || new Date().toISOString();
  
  let gameDate = sel.game_date || timestamp.split('T')[0];
  if (gameDate) {
    gameDate = gameDate.split('T')[0];
  }
  
  const today = getTodayString();
  const isTodayGame = gameDate === today;

  let statDisplay = '';
  if (statType) {
    let formattedStat = String(statType).toLowerCase();
    if (formattedStat === 'pts' || formattedStat === 'points') formattedStat = 'Points';
    else if (formattedStat === 'reb' || formattedStat === 'rebounds') formattedStat = 'Rebounds';
    else if (formattedStat === 'ast' || formattedStat === 'assists') formattedStat = 'Assists';
    else if (formattedStat === 'stl' || formattedStat === 'steals') formattedStat = 'Steals';
    else if (formattedStat === 'blk' || formattedStat === 'blocks') formattedStat = 'Blocks';
    else if (formattedStat === '3pm' || formattedStat === 'threes') formattedStat = '3-Pointers Made';
    else {
      formattedStat = formattedStat.charAt(0).toUpperCase() + formattedStat.slice(1);
    }
    
    if (sel.type && roundedLine) {
      statDisplay = `${formattedStat} ${sel.type} ${roundedLine}`;
    } else if (sel.type) {
      statDisplay = `${formattedStat} ${sel.type}`;
    } else if (roundedLine) {
      statDisplay = `${formattedStat} to ${roundedLine}`;
    } else {
      statDisplay = formattedStat;
    }
  } else {
    statDisplay = sel.description || sel.stat_line || 'Performance';
  }

  let analysis = sel.analysis;
  if (!analysis) {
    if (signedEdgePercent !== undefined && Math.abs(signedEdgePercent) > 0) {
      const edgeText = signedEdgePercent > 0 ? 'positive' : 'negative';
      analysis = `${playerName} ${sel.type || 'is projected'} for ${roundedProjection} ${statType || 'points'} vs line of ${roundedLine}. This represents a ${Math.abs(signedEdgePercent).toFixed(1)}% ${edgeText} edge based on recent performance and matchup data.`;
    } else {
      analysis = `AI‑generated pick based on matchup data. ${playerName} is projected for ${roundedProjection} ${statType || 'performance'} vs line of ${roundedLine}.`;
    }
  }

  return {
    id: sel.id || `node-${Date.now()}-${Math.random()}`,
    player: playerName,
    team: team,
    sport: sport.toUpperCase(),
    stat: statDisplay,
    line: roundedLine,
    projection: roundedProjection,
    confidence: confidenceValue,
    odds: odds,
    edge: displayEdgeStr,
    edge_percentage: signedEdgePercent,
    analysis: analysis,
    timestamp: new Date(timestamp).toLocaleString(),
    category,
    probability: `${Math.round(confidenceValue)}%`,
    roi: sel.roi || (signedEdgePercent ? `${signedEdgePercent > 0 ? '+' : ''}${Math.abs(signedEdgePercent).toFixed(1)}%` : '+15%'),
    units: (Math.random() * 2 + 1).toFixed(1),
    requiresPremium: false,
    value: displayEdgeStr,
    bookmaker: sel.bookmaker || 'AI Generated',
    generatedFrom: prompt,
    isToday: isTodayGame,
    type: sel.type,
    is_mock: sel.source === 'mock' || sel.is_mock || sel.source === 'realistic-fallback',
    data_source: sel.source || 'Node API',
    last_updated: sel.last_updated || timestamp,
    opponent: opponent,
    stat_type: statType,
    description: sel.description,
    is_live: sel.is_live || false,
    is_boosted: sel.is_boosted || false,
    game_date: gameDate,
  };
};

// ============================================
// MLB/NHL mapping functions
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

  let gameDate = null;
  if (prop.game_date) {
    gameDate = new Date(prop.game_date).toISOString().split('T')[0];
  } else if (prop.commence_time) {
    gameDate = new Date(prop.commence_time).toISOString().split('T')[0];
  }

  const today = getTodayString();
  const isTodayGame = gameDate === today;

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
    isToday: isTodayGame,
    type: side,
    is_mock: source === 'mock',
    data_source: source,
    last_updated: prop.last_updated || prop.timestamp,
    game_date: gameDate,
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

  let gameDate = null;
  if (prop.game_date) {
    gameDate = new Date(prop.game_date).toISOString().split('T')[0];
  } else if (prop.commence_time) {
    gameDate = new Date(prop.commence_time).toISOString().split('T')[0];
  }

  const today = getTodayString();
  const isTodayGame = gameDate === today;

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
    isToday: isTodayGame,
    type: side,
    is_mock: source === 'mock',
    data_source: source,
    last_updated: prop.last_updated || prop.timestamp,
    game_date: gameDate,
  };
};

// ============================================
// DEDUPLICATE PICKS
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

    const lastUpdated = pick.last_updated 
      ? new Date(pick.last_updated).toLocaleTimeString() 
      : null;

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
          position: 'relative',
        }}
        onClick={() => onTrack(pick)}
      >
        {pick.is_live && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: '#ef4444',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
            }}
          >
            LIVE
          </Box>
        )}
        
        <CardContent>
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
                  {pick.team} {pick.opponent ? `vs ${pick.opponent}` : ''}
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
                {pick.is_boosted && (
                  <Chip
                    label="BOOSTED"
                    size="small"
                    sx={{ bgcolor: '#f59e0b20', color: '#f59e0b', fontWeight: 'bold' }}
                  />
                )}
                {pick.is_mock && (
                  <Chip
                    label="Mock"
                    size="small"
                    sx={{ bgcolor: '#ff980020', color: '#ff9800', fontWeight: 'bold' }}
                  />
                )}
                {pick.game_date && pick.game_date !== getTodayString() && (
                  <Chip
                    icon={<Event sx={{ fontSize: 14 }} />}
                    label={new Date(pick.game_date).toLocaleDateString()}
                    size="small"
                    sx={{ bgcolor: '#f59e0b20', color: '#f59e0b', fontWeight: 'bold' }}
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConfidenceBadge confidence={pick.confidence} />
              {isPremiumLocked && <Lock sx={{ color: 'text.secondary' }} />}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ 
                color: isPremiumLocked ? 'text.secondary' : '#f59e0b',
                fontSize: '1.1rem',
                fontFamily: 'monospace'
              }}
            >
              {pick.stat}
            </Typography>
          </Box>

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

          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Analytics sx={{ color: '#f59e0b', mr: 1, mt: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {isPremiumLocked ? '🔒 Premium analysis available with upgrade' : pick.analysis}
            </Typography>
          </Box>

          {pick.generatedFrom && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="caption">
                Generated from: "{pick.generatedFrom.substring(0, 50)}..."
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {pick.timestamp}
              </Typography>
              {lastUpdated && (
                <Tooltip title={`Last updated: ${lastUpdated}`}>
                  <History sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }} />
                </Tooltip>
              )}
            </Box>
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
      label={`${Math.round(confidence)}% Confidence`}
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
// MAIN CONTENT COMPONENT
// ============================================
const DailyPicksContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, getIdToken } = useAuth();

  const [tabIndex, setTabIndex] = useState(0);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [generatedPicks, setGeneratedPicks] = useState<Pick[]>([]);
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [rawSelections, setRawSelections] = useState<any[]>([]);

  const [selectedSport, setSelectedSport] = useState('nba');
  const [selectedMarket, setSelectedMarket] = useState('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFreshness, setDataFreshness] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);

  const [filterStat, setFilterStat] = useState<string>('all');
  const [filterConfidence, setFilterConfidence] = useState<string>('all');
  const [filterEdge, setFilterEdge] = useState<number>(0);

  const [displayCount, setDisplayCount] = useState(MAX_VISIBLE_CARDS_PER_SPORT);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedWinnerPrompt, setSelectedWinnerPrompt] = useState('');
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [generatorCredits, setGeneratorCredits] = useState(0);
  const [plan, setPlan] = useState('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedPick, setSelectedPick] = useState<Pick | null>(null);
  const [selectedParlay, setSelectedParlay] = useState<Parlay | null>(null);
  const [showPickDetail, setShowPickDetail] = useState(false);
  const [showParlayModal, setShowParlayModal] = useState(false);

  const pollingIntervalRef = React.useRef<NodeJS.Timeout>();

  const { error: apiError } = useDailyPicks();

  // ===== CHECK SUBSCRIPTION AND CREDITS STATUS =====
  useEffect(() => {
    const fetchSubscriptionAndCredits = async () => {
      if (!user || !user.uid) return;
      
      try {
        const token = await getIdToken();
        
        // Fetch subscription
        const subResponse = await fetch(`${PYTHON_API_BASE}/api/subscriptions/my-subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const subData = await subResponse.json();
        
        if (subData.success && subData.subscription) {
          setHasPremiumAccess(subData.subscription.status === 'active');
          setPlan(subData.subscription.plan_id || 'free');
          setSubscriptionStatus(subData.subscription.status);
        }
        
        // Fetch generator credits (from user profile)
        const profileResponse = await fetch(`${PYTHON_API_BASE}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const profileData = await profileResponse.json();
        
        if (profileData.credits !== undefined) {
          setGeneratorCredits(profileData.credits);
        }
        
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        setHasPremiumAccess(false);
        setGeneratorCredits(0);
      }
    };
    
    fetchSubscriptionAndCredits();
  }, [user, getIdToken]);

  // ===== SETUP REAL-TIME POLLING =====
  useEffect(() => {
    let mounted = true;
    let backoffTimeout: NodeJS.Timeout;

    const fetchRealTimeData = async () => {
      if (!selectedSport || !mounted || !pollingEnabled || rateLimited) return;

      try {
        const timestamp = Date.now();
        const today = getTodayString();
        
        let data;
        let selections;

        if (selectedSport === 'mlb') {
          const endpoint = `${PYTHON_API_BASE}/api/mlb/props?date=${today}&limit=200&_t=${timestamp}`;
          const response = await fetch(endpoint);
          if (!response.ok) throw new Error(`MLB API failed with status ${response.status}`);
          data = await response.json();
          selections = data.props || [];
          setDataSources([data.source || 'MLB API']);
        } else if (selectedSport === 'nhl') {
          const endpoint = `${PYTHON_API_BASE}/api/nhl/props?date=${today}&limit=200&_t=${timestamp}`;
          const response = await fetch(endpoint);
          if (!response.ok) throw new Error(`NHL API failed with status ${response.status}`);
          data = await response.json();
          selections = data.props || [];
          setDataSources([data.source || 'NHL API']);
        } else {
          const endpoint = `${NODE_API_BASE}/api/prizepicks/selections?sport=${selectedSport}&date=${today}&_t=${timestamp}`;
          const response = await fetch(endpoint);
          
          if (response.status === 429) {
            setRateLimited(true);
            setError('Rate limited by API. Waiting 30 seconds before retrying...');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            backoffTimeout = setTimeout(() => {
              setRateLimited(false);
              setError(null);
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              pollingIntervalRef.current = setInterval(fetchRealTimeData, POLLING_INTERVAL);
            }, RATE_LIMIT_BACKOFF);
            return;
          }
          
          if (!response.ok) throw new Error(`Node API failed with status ${response.status}`);
          data = await response.json();
          selections = data.selections || [];
          setDataSources([data.source || 'Node API', 'The Odds API', 'Tank01']);
        }

        setRawSelections(selections);

        let newPicks: Pick[] = [];
        if (selectedSport === 'mlb') {
          selections.forEach((prop: any) => {
            newPicks.push(mapMLBPropToPick(prop, 'Over', data.source || 'api'));
            newPicks.push(mapMLBPropToPick(prop, 'Under', data.source || 'api'));
          });
        } else if (selectedSport === 'nhl') {
          selections.forEach((prop: any) => {
            newPicks.push(mapNHLPropToPick(prop, 'Over', data.source || 'api'));
            newPicks.push(mapNHLPropToPick(prop, 'Under', data.source || 'api'));
          });
        } else {
          newPicks = selections.map((sel: any) => mapNodeSelectionToPick(sel, selectedSport));
        }

        const deduped = deduplicatePicks(newPicks);
        
        const todayPicks = deduped.filter(pick => {
          if (pick.isToday === true) return true;
          if (pick.game_date) {
            const pickDate = pick.game_date.split('T')[0];
            return pickDate === today;
          }
          return true;
        });
        
        const sortedPicks = [...todayPicks].sort((a, b) => b.confidence - a.confidence);
        const limitedPicks = sortedPicks.slice(0, MAX_VISIBLE_CARDS_PER_SPORT);
        
        if (mounted) {
          setPicks(limitedPicks);
          setDataFreshness(data.timestamp || new Date().toISOString());
          setError(null);
          setLastRefresh(new Date());
        }
      } catch (err) {
        console.error('Real-time fetch failed:', err);
        if (mounted) {
          setError('Failed to fetch real-time data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchRealTimeData();
    pollingIntervalRef.current = setInterval(fetchRealTimeData, POLLING_INTERVAL);

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (backoffTimeout) clearTimeout(backoffTimeout);
    };
  }, [selectedSport, pollingEnabled, rateLimited]);

  useEffect(() => {
    setDisplayCount(MAX_VISIBLE_CARDS_PER_SPORT);
  }, [selectedSport, searchQuery, filterStat, filterConfidence, filterEdge]);

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

  const handleLoadMore = () => {
    setTabIndex(1);
  };
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPollingEnabled(false);
    
    const timestamp = Date.now();
    const today = getTodayString();
    try {
      let endpoint;
      if (selectedSport === 'mlb') {
        endpoint = `${PYTHON_API_BASE}/api/mlb/props?date=${today}&limit=200&_t=${timestamp}`;
      } else if (selectedSport === 'nhl') {
        endpoint = `${PYTHON_API_BASE}/api/nhl/props?date=${today}&limit=200&_t=${timestamp}`;
      } else {
        endpoint = `${NODE_API_BASE}/api/prizepicks/selections?sport=${selectedSport}&date=${today}&_t=${timestamp}`;
      }
      
      const response = await fetch(endpoint);
      if (response.status === 429) {
        setError('Rate limited. Please wait a moment before refreshing.');
        setRefreshing(false);
        setPollingEnabled(true);
        return;
      }
      
      const data = await response.json();
      const selections = data.selections || data.props || [];
      setRawSelections(selections);
      
      let newPicks: Pick[] = [];
      if (selectedSport === 'mlb') {
        selections.forEach((prop: any) => {
          newPicks.push(mapMLBPropToPick(prop, 'Over', data.source || 'api'));
          newPicks.push(mapMLBPropToPick(prop, 'Under', data.source || 'api'));
        });
      } else if (selectedSport === 'nhl') {
        selections.forEach((prop: any) => {
          newPicks.push(mapNHLPropToPick(prop, 'Over', data.source || 'api'));
          newPicks.push(mapNHLPropToPick(prop, 'Under', data.source || 'api'));
        });
      } else {
        newPicks = selections.map((sel: any) => mapNodeSelectionToPick(sel, selectedSport));
      }
      
      const deduped = deduplicatePicks(newPicks);
      const todayPicks = deduped.filter(pick => {
        if (pick.isToday === true) return true;
        if (pick.game_date) {
          const pickDate = pick.game_date.split('T')[0];
          return pickDate === today;
        }
        return true;
      });
      
      const sortedPicks = [...todayPicks].sort((a, b) => b.confidence - a.confidence);
      const limitedPicks = sortedPicks.slice(0, MAX_VISIBLE_CARDS_PER_SPORT);
      
      setPicks(limitedPicks);
      setDataFreshness(data.timestamp || new Date().toISOString());
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
      setPollingEnabled(true);
    }
  }, [selectedSport]);

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

  // ===== STRIPE CHECKOUT FUNCTIONS =====
  const handleSubscriptionCheckout = async (planId: string, interval: string = 'month') => {
    try {
      const token = await getIdToken();
      const response = await fetch(`${PYTHON_API_BASE}/api/subscriptions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, interval }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to start checkout process');
    }
  };

  const handleCreditsCheckout = async (credits: number) => {
    try {
      const token = await getIdToken();
      const response = await fetch(`${PYTHON_API_BASE}/api/generator/credits/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ credits }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to create credits checkout session');
      }
    } catch (error) {
      console.error('Credits checkout error:', error);
      setError('Failed to start credits checkout');
    }
  };

  // ===== GENERATE CUSTOM PICKS WITH CREDITS =====
  const handleGenerateCustomPicks = async () => {
    if (!customPrompt.trim()) return;
    
    if (!hasPremiumAccess && generatorCredits < 1) {
      setShowCreditsModal(true);
      return;
    }

    setGenerating(true);
    setShowGeneratingModal(true);

    const MAX_RESULTS = 3;
    const lowerPrompt = customPrompt.toLowerCase();

    const gamePrompts = WINNER_PROMPTS.slice(0, 10);
    const isGamePrompt = gamePrompts.some(p => p.toLowerCase() === lowerPrompt) ||
                        lowerPrompt.includes('moneyline') || 
                        lowerPrompt.includes('winner') || 
                        lowerPrompt.includes('win') ||
                        lowerPrompt.includes('bounce') ||
                        lowerPrompt.includes('underdog') ||
                        lowerPrompt.includes('upset') ||
                        lowerPrompt.includes('team') ||
                        lowerPrompt.includes('game');

    try {
      // Use a credit if not premium
      if (!hasPremiumAccess && generatorCredits > 0) {
        const token = await getIdToken();
        await fetch(`${PYTHON_API_BASE}/api/generator/use`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickType: isGamePrompt ? 'game' : 'player_prop',
            pickData: { prompt: customPrompt, sport: selectedSport }
          }),
        });
        setGeneratorCredits(prev => prev - 1);
      }

      const timestamp = Date.now();
      const today = getTodayString();
      let rawItems: any[] = [];
      
      if (selectedSport === 'mlb') {
        const endpoint = `${PYTHON_API_BASE}/api/mlb/props?date=${today}&limit=200&_t=${timestamp}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        rawItems = data.props || [];
      } else if (selectedSport === 'nhl') {
        const endpoint = `${PYTHON_API_BASE}/api/nhl/props?date=${today}&limit=200&_t=${timestamp}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        rawItems = data.props || [];
      } else {
        const endpoint = `${NODE_API_BASE}/api/prizepicks/selections?sport=${selectedSport}&date=${today}&_t=${timestamp}`;
        const res = await fetch(endpoint);
        
        if (res.status === 429) {
          setError('Rate limited. Please wait a moment before generating.');
          setGenerating(false);
          setShowGeneratingModal(false);
          return;
        }
        
        const data = await res.json();
        rawItems = data.selections || [];
      }

      if (rawItems.length === 0) {
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
          last_updated: new Date().toISOString(),
          game_date: today,
        };
        setGeneratedPicks([mockPick]);
      } else {
        let playerPicks: Pick[] = [];
        if (selectedSport === 'mlb') {
          rawItems.forEach((prop: any) => {
            playerPicks.push(mapMLBPropToPick(prop, 'Over', prop.source || 'api'));
            playerPicks.push(mapMLBPropToPick(prop, 'Under', prop.source || 'api'));
          });
        } else if (selectedSport === 'nhl') {
          rawItems.forEach((prop: any) => {
            playerPicks.push(mapNHLPropToPick(prop, 'Over', prop.source || 'api'));
            playerPicks.push(mapNHLPropToPick(prop, 'Under', prop.source || 'api'));
          });
        } else {
          playerPicks = rawItems.map((sel: any) => mapNodeSelectionToPick(sel, selectedSport, customPrompt));
        }

        const todayPlayerPicks = playerPicks.filter(pick => {
          if (pick.game_date) {
            const pickDate = pick.game_date.split('T')[0];
            return pickDate === today;
          }
          if (pick.isToday) return true;
          return false;
        });

        let finalPicks: Pick[] = [];

        if (isGamePrompt) {
          const gamePicks = generateGamePicksFromPlayerProps(customPrompt, todayPlayerPicks, selectedSport);
          if (gamePicks.length > 0) {
            finalPicks = gamePicks;
          } else {
            finalPicks = todayPlayerPicks;
          }
        } else {
          const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
          let keywords = customPrompt
            .toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

          const expandedKeywords = new Set<string>();
          keywords.forEach(kw => {
            expandedKeywords.add(kw);
            if (KEYWORD_MAP[kw]) {
              KEYWORD_MAP[kw].forEach(syn => expandedKeywords.add(syn));
            }
          });
          keywords = Array.from(expandedKeywords);

          const scoredPicks = todayPlayerPicks.map(pick => {
            const searchable = [
              pick.player?.toLowerCase(),
              pick.stat?.toLowerCase(),
              pick.team?.toLowerCase(),
              pick.opponent?.toLowerCase(),
            ].filter(Boolean).join(' ');

            let score = 0;
            keywords.forEach(keyword => {
              if (searchable.includes(keyword)) score += 1;
            });

            if (pick.last_updated) {
              const minutesOld = (Date.now() - new Date(pick.last_updated).getTime()) / (1000 * 60);
              if (minutesOld < 5) score += 2;
            }

            return { pick, score };
          });

          scoredPicks.sort((a, b) => b.score - a.score);

          const topPicks = scoredPicks
            .filter(s => s.score > 0)
            .slice(0, 20)
            .map(s => s.pick);

          finalPicks = topPicks.length > 0 ? topPicks : todayPlayerPicks.slice(0, 20);
        }

        const deduped = deduplicatePicks(finalPicks);
        const limitedPicks = deduped.slice(0, MAX_RESULTS);
        
        setGeneratedPicks(limitedPicks);
      }

      setCustomPrompt('');
      setSelectedWinnerPrompt('');

    } catch (error) {
      console.error('Error generating picks:', error);
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
        last_updated: new Date().toISOString(),
        game_date: getTodayString(),
      };
      setGeneratedPicks([fallbackPick]);
    } finally {
      setCustomPrompt('');
      setSelectedWinnerPrompt('');
      setTimeout(() => {
        setGenerating(false);
        setShowGeneratingModal(false);
      }, 1500);
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
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {diffMinutes < 5 ? (
            <CheckCircleOutline sx={{ color: '#10b981', mr: 1 }} />
          ) : (
            <Schedule sx={{ color: '#f59e0b', mr: 1 }} />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
            Data updated {diffMinutes} minutes ago {diffMinutes < 1 ? '(live)' : ''}
          </Typography>
          <Chip label={`${picks.length} picks today`} size="small" sx={{ bgcolor: 'grey.200' }} />
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
                  {selectedPick.team} {selectedPick.opponent ? `vs ${selectedPick.opponent}` : ''} • {selectedPick.sport}{' '}
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
                    {selectedPick.last_updated && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Last updated: {new Date(selectedPick.last_updated).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
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
          {Math.round(score)}%
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
              <Tooltip title="Data updates every 60 seconds">
                <CloudSync sx={{ color: 'white', opacity: 0.7, ml: 1 }} />
              </Tooltip>
            </Box>
            {lastRefresh && (
              <Chip
                label={`Last updated: ${lastRefresh.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
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
                AI-curated selections with real-time updates every 60 seconds
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                Showing top {MAX_VISIBLE_CARDS_PER_SPORT} picks per sport.
                {hasPremiumAccess ? ' Premium active!' : generatorCredits > 0 ? ` You have ${generatorCredits} generator credits.` : ' Upgrade for unlimited picks!'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {renderSportSelector()}
        {renderMarketSelector()}
        {renderFreshnessIndicator()}

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

        <Paper sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
          <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} centered>
            <Tab label={`All Picks (${picks.length}/${MAX_VISIBLE_CARDS_PER_SPORT})`} icon={<BarChart />} iconPosition="start" />
            <Tab label="AI Generator" icon={<SmartToy />} iconPosition="start" />
          </Tabs>
        </Paper>

        {tabIndex === 0 && (
          <>
            {renderFilterBar()}

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
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <AlertTitle>Want more picks?</AlertTitle>
                    Switch to the <strong>AI Generator</strong> tab to generate additional picks. 
                    {!hasPremiumAccess && generatorCredits === 0 && ' Premium users get unlimited generations!'}
                    {!hasPremiumAccess && generatorCredits > 0 && ` You have ${generatorCredits} credits remaining.`}
                  </Alert>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={() => setTabIndex(1)}
                      startIcon={<SmartToy />}
                      sx={{ bgcolor: '#8b5cf6' }}
                    >
                      Generate More Picks
                    </Button>
                    {!hasPremiumAccess && (
                      <Button 
                        variant="outlined" 
                        onClick={() => setShowCreditsModal(true)}
                        startIcon={<CreditCard />}
                      >
                        Buy Credits
                      </Button>
                    )}
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  <AlertTitle>No Picks Found</AlertTitle>
                  No picks match the current filters. Try adjusting your filters or use the AI Generator to create custom picks.
                </Alert>
              )}
            </Box>
          </>
        )}

        {tabIndex === 1 && (
          <Box sx={{ mb: 4 }}>
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome color="primary" />
                Generate Custom Picks
              </Typography>

              {!hasPremiumAccess && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <AlertTitle>Free Tier - {generatorCredits} Credits Remaining</AlertTitle>
                  Each generation uses 1 credit. Premium users get unlimited generations!
                  <Box sx={{ mt: 1 }}>
                    <Button 
                      size="small" 
                      onClick={() => setShowCreditsModal(true)}
                      variant="outlined"
                      startIcon={<CreditCard />}
                    >
                      Buy More Credits
                    </Button>
                    <Button 
                      size="small" 
                      sx={{ ml: 1 }}
                      onClick={() => setShowUpgradeModal(true)}
                      variant="contained"
                    >
                      Upgrade to Premium
                    </Button>
                  </Box>
                </Alert>
              )}

              {hasPremiumAccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <AlertTitle>Premium Active</AlertTitle>
                  You have unlimited access to AI pick generation!
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 350 }}>
                  <Select
                    value={selectedWinnerPrompt}
                    onChange={(e) => {
                      setSelectedWinnerPrompt(e.target.value);
                      setCustomPrompt(e.target.value);
                    }}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <em style={{ color: '#9ca3af' }}>Select a prompt (10 game + 5 player props)...</em>;
                      }
                      return selected;
                    }}
                  >
                    <MenuItem value=""><em>Select a prompt...</em></MenuItem>
                    <MenuItem disabled sx={{ opacity: 0.7 }}>
                      <Typography variant="caption" color="text.secondary">───── GAME PROMPTS (10) ─────</Typography>
                    </MenuItem>
                    {WINNER_PROMPTS.slice(0, 10).map(prompt => (
                      <MenuItem key={prompt} value={prompt} sx={{ pl: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SportsBasketball sx={{ fontSize: 16, color: '#f59e0b' }} />
                          {prompt}
                        </Box>
                      </MenuItem>
                    ))}
                    <MenuItem disabled sx={{ opacity: 0.7 }}>
                      <Typography variant="caption" color="text.secondary">───── PLAYER PROPS (5) ─────</Typography>
                    </MenuItem>
                    {WINNER_PROMPTS.slice(10).map(prompt => (
                      <MenuItem key={prompt} value={prompt} sx={{ pl: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp sx={{ fontSize: 16, color: '#10b981' }} />
                          {prompt}
                        </Box>
                      </MenuItem>
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
                  disabled={!customPrompt.trim() || generating || (!hasPremiumAccess && generatorCredits === 0)}
                  sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, minWidth: 120 }}
                >
                  {generating ? 'Generating...' : (hasPremiumAccess ? 'Generate' : generatorCredits > 0 ? `Generate (${generatorCredits} left)` : 'No Credits')}
                </Button>
              </Box>
              
              {!hasPremiumAccess && generatorCredits === 0 && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
                  ⚠️ You have no generator credits remaining. Purchase credits or upgrade to premium to continue generating picks.
                </Typography>
              )}
            </Paper>

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
                {hasPremiumAccess 
                  ? 'Select a prompt above and click Generate to create AI-powered picks from real-time data.'
                  : generatorCredits > 0 
                    ? `You have ${generatorCredits} credits remaining. Select a prompt and click Generate to create AI-powered picks.`
                    : 'Purchase credits or upgrade to premium to unlock AI pick generation!'}
              </Alert>
            )}
          </Box>
        )}

        <ParlayDetailsModal />
        <PickDetailModal />
        
        {/* Upgrade Modal - Subscription Plans */}
        <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock sx={{ color: '#f59e0b' }} />
              <Typography variant="h6">Upgrade to Premium</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography paragraph>
              Get access to unlimited picks, advanced AI models, and premium features.
            </Typography>
            <Box sx={{ my: 3 }}>
              {[
                'Unlimited daily picks',
                'Unlimited AI generations',
                'Premium AI analysis',
                'Advanced betting insights',
                'Real-time data updates',
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
                <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleSubscriptionCheckout('starter', 'month')}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="#10b981" gutterBottom>
                      Starter
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      $5.99
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      /month
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#10b981' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubscriptionCheckout('starter', 'month');
                      }}
                    >
                      Choose Starter
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ borderColor: '#f59e0b', borderWidth: 2, cursor: 'pointer' }} onClick={() => handleSubscriptionCheckout('generator', 'month')}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="#f59e0b" gutterBottom>
                      Generator
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      $39.99
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      /month
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#f59e0b' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubscriptionCheckout('generator', 'month');
                      }}
                    >
                      Choose Generator
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

        {/* Credits Modal */}
        <Dialog open={showCreditsModal} onClose={() => setShowCreditsModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard sx={{ color: '#f59e0b' }} />
              <Typography variant="h6">Buy Generator Credits</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography paragraph>
              Generator credits allow you to create custom AI picks. Each generation uses 1 credit.
            </Typography>
            <Box sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current credits: <strong>{generatorCredits}</strong>
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(1)}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">
                      1 Credit
                    </Typography>
                    <Typography variant="h5" color="#f59e0b" fontWeight="bold">
                      $1.99
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreditsCheckout(1);
                      }}
                    >
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(10)}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">
                      10 Credits
                    </Typography>
                    <Typography variant="h5" color="#10b981" fontWeight="bold">
                      $14.90
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      $1.49/credit
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#10b981' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreditsCheckout(10);
                      }}
                    >
                      Best Value
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(20)}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">
                      20 Credits
                    </Typography>
                    <Typography variant="h5" color="#10b981" fontWeight="bold">
                      $25.80
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      $1.29/credit
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#10b981' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreditsCheckout(20);
                      }}
                    >
                      Buy Now
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleCreditsCheckout(50)}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold">
                      50 Credits
                    </Typography>
                    <Typography variant="h5" color="#10b981" fontWeight="bold">
                      $44.50
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      $0.89/credit
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2, bgcolor: '#10b981' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreditsCheckout(50);
                      }}
                    >
                      Best Deal
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreditsModal(false)}>Cancel</Button>
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
                  {customPrompt.includes('moneyline') || customPrompt.includes('winner') || customPrompt.includes('win')
                    ? 'Analyzing team matchups and player projections...'
                    : 'Fetching player props and filtering by your prompt...'}
                </Typography>
                {!hasPremiumAccess && generatorCredits > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Using 1 generator credit. Remaining: {generatorCredits - 1}
                  </Typography>
                )}
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

        {/* Rate Limit Warning */}
        {rateLimited && (
          <Alert
            severity="warning"
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1000,
              maxWidth: 400,
              boxShadow: 3
            }}
          >
            <AlertTitle>Rate Limited</AlertTitle>
            API rate limit reached. Automatic updates paused for 30 seconds.
            <Button
              size="small"
              onClick={() => setRateLimited(false)}
              sx={{ mt: 1 }}
            >
              Dismiss
            </Button>
          </Alert>
        )}

        {/* Footer */}
        <Box sx={{ mt: 6, textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
          <Typography variant="caption" color="text.secondary">
            AI‑powered daily picks · data updated in real‑time every 60 seconds · Showing top {MAX_VISIBLE_CARDS_PER_SPORT} picks per sport
          </Typography>
        </Box>
      </Container>
    </>
  );
};

// ============================================
// WRAPPED COMPONENT
// ============================================
const DailyPicksScreen: React.FC = () => {
  return <DailyPicksContent />;
};

export default DailyPicksScreen;
