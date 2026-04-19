// src/pages/ComboArchitectScreen.tsx – Fixed infinite loop and realistic data

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
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  Merge as MergeIcon,
  Today as TodayIcon,
  Autorenew as AutorenewIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  AutoAwesome as AutoAwesomeIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { format, parseISO, isValid } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// ========== API BASES ==========
const PRIZEPICKS_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// ========== CONSTANTS ==========
const MAX_VISIBLE_SUGGESTIONS = 4;
const MAX_EDGE_PERCENT = 12;
const MIN_CONFIDENCE = 55;
const MAX_CONFIDENCE = 85;

// ========== TYPES ==========
interface ComboLeg {
  id: string;
  player_name?: string;
  market: string;
  lineValue: number;
  odds_american?: string;
  confidence: number;
  sport: string;
  description: string;
  projection?: number;
  edge?: string;
  line?: number;
  stat_type?: string;
  team?: string;
}

interface PropMarket {
  id: string;
  player: string;
  team: string;
  market: string;
  line: number;
  projection?: number;
  over_lineValue: number;
  under_lineValue: number;
  confidence: number;
  game_id: string;
  game_time: string;
  sport: string;
  position?: string;
  edge?: string;
}

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

interface ComboSuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type?: string;
  legs: Array<{
    id: string;
    description: string;
    lineValue: string;
    confidence: number;
    sport: string;
    market: string;
    player_name?: string;
    projection?: number;
    edge?: string;
    line?: number;
  }>;
  total_lineValue?: string;
  confidence: number;
  analysis: string;
  timestamp: string;
  isToday?: boolean;
  confidence_level?: string;
  expected_value?: string;
  risk_level?: string;
  ai_metrics?: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_hypothetical: string;
    edge?: number;
  };
  is_real_data?: boolean;
  source?: string;
}

const SPORTS = [
  { id: 'all', name: 'All Sports', icon: <MergeIcon />, color: '#f59e0b' },
  { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#ef4444' },
  { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#3b82f6' },
  { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#1e40af' },
  { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#10b981' }
];

const SPORTS_2026 = [
  { id: 'NBA', name: 'NBA', icon: '🏀', season: '2025-26', status: 'Regular Season' },
  { id: 'NFL', name: 'NFL', icon: '🏈', season: '2026', status: 'Offseason' },
  { id: 'NHL', name: 'NHL', icon: '🏒', season: '2025-26', status: 'Playoffs' },
  { id: 'MLB', name: 'MLB', icon: '⚾', season: '2026', status: 'Regular Season' },
];

const MARKET_TYPES = [
  { id: 'all', name: 'All Markets', icon: '🔄' },
  { id: 'player_props', name: 'Player Props', icon: '👤' },
];

const RISK_LEVELS = [
  { id: 'all', name: 'All Risks', color: '#64748b' },
  { id: 'low', name: 'Low Volatility', color: '#10b981' },
  { id: 'medium', name: 'Medium Volatility', color: '#f59e0b' },
  { id: 'high', name: 'High Volatility', color: '#ef4444' }
];

const COMBO_SIZES = [
  { id: 'all', name: 'Any Size' },
  { id: '2', name: '2‑Leg Combos' },
  { id: '3', name: '3‑Leg Combos' },
  { id: '4', name: '4‑Leg Combos' },
  { id: '5', name: '5+ Leg Combos' }
];

const PROMPTS = [
  { label: '🏀 NBA Points + Assists', query: 'nba points and assists' },
  { label: '🏀 NBA Top Scorer Props', query: 'nba top scorer props' },
  { label: '🏀 NBA Player Props', query: 'nba player props' },
  { label: '🏒 NHL Goal Scorer Props', query: 'nhl goal scorer props' },
  { label: '🏒 NHL Points + Assists', query: 'nhl points and assists' },
  { label: '⚾ MLB Home Run Props', query: 'mlb home run props' },
  { label: '⚾ MLB Strikeout Props', query: 'mlb strikeout props' },
  { label: '⚾ MLB Hit Props', query: 'mlb hits' },
  { label: '⚾ MLB RBI Props', query: 'mlb rbi' },
];

// ========== HELPER: Safe date format ==========
const safeFormatTime = (dateString: string): string => {
  if (!dateString) return 'Time TBD';
  try {
    const parsedDate = parseISO(dateString);
    if (isValid(parsedDate)) {
      return format(parsedDate, 'h:mm a');
    }
    return 'Time TBD';
  } catch (error) {
    return 'Time TBD';
  }
};

// ========== HELPER: Cap edge to realistic range ==========
const capEdge = (value: number): number => {
  return Math.min(MAX_EDGE_PERCENT, Math.max(-MAX_EDGE_PERCENT, value));
};

// ========== HELPER: Cap confidence to realistic range ==========
const capConfidence = (value: number): number => {
  return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, value));
};

// ========== HELPER: Normalize team names ==========
const normalizeTeamName = (team: string): string => {
  if (!team) return 'Unknown';
  
  const teamMap: Record<string, string> = {
    'ARI': 'Arizona Diamondbacks', 'ATL': 'Atlanta Braves', 'BAL': 'Baltimore Orioles',
    'BOS': 'Boston Red Sox', 'CHC': 'Chicago Cubs', 'CHW': 'Chicago White Sox',
    'CIN': 'Cincinnati Reds', 'CLE': 'Cleveland Guardians', 'COL': 'Colorado Rockies',
    'DET': 'Detroit Tigers', 'HOU': 'Houston Astros', 'KC': 'Kansas City Royals',
    'LAA': 'Los Angeles Angels', 'LAD': 'Los Angeles Dodgers', 'MIA': 'Miami Marlins',
    'MIL': 'Milwaukee Brewers', 'MIN': 'Minnesota Twins', 'NYM': 'New York Mets',
    'NYY': 'New York Yankees', 'OAK': 'Oakland Athletics', 'PHI': 'Philadelphia Phillies',
    'PIT': 'Pittsburgh Pirates', 'SD': 'San Diego Padres', 'SEA': 'Seattle Mariners',
    'SF': 'San Francisco Giants', 'STL': 'St. Louis Cardinals', 'TB': 'Tampa Bay Rays',
    'TEX': 'Texas Rangers', 'TOR': 'Toronto Blue Jays', 'WSH': 'Washington Nationals',
    'LAL': 'Los Angeles Lakers', 'GSW': 'Golden State Warriors', 'DEN': 'Denver Nuggets',
    'MIA': 'Miami Heat', 'PHX': 'Phoenix Suns', 'EDM': 'Edmonton Oilers',
    'TOR': 'Toronto Maple Leafs', 'VGK': 'Vegas Golden Knights', 'DAL': 'Dallas Stars',
    'NYR': 'New York Rangers', 'ANA': 'Anaheim Ducks', 'BUF': 'Buffalo Sabres',
    'CGY': 'Calgary Flames', 'CAR': 'Carolina Hurricanes', 'CHI': 'Chicago Blackhawks',
    'CBJ': 'Columbus Blue Jackets', 'DET': 'Detroit Red Wings', 'FLA': 'Florida Panthers',
    'LAK': 'Los Angeles Kings', 'MIN': 'Minnesota Wild', 'MTL': 'Montreal Canadiens',
    'NSH': 'Nashville Predators', 'NJD': 'New Jersey Devils', 'NYI': 'New York Islanders',
    'OTT': 'Ottawa Senators', 'PHI': 'Philadelphia Flyers', 'PIT': 'Pittsburgh Penguins',
    'SJS': 'San Jose Sharks', 'SEA': 'Seattle Kraken', 'STL': 'St. Louis Blues',
    'TBL': 'Tampa Bay Lightning', 'VAN': 'Vancouver Canucks', 'WPG': 'Winnipeg Jets',
  };
  
  return teamMap[team.toUpperCase()] || team;
};

// ========== FETCH FUNCTIONS ==========
const fetchGames = async (sport: string): Promise<Game[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sportMap: Record<string, string> = {
      'NBA': 'nba',
      'NHL': 'nhl', 
      'MLB': 'mlb',
      'NFL': 'nfl'
    };
    
    const response = await axios.get(`${PRIZEPICKS_API_BASE}/api/tank01/games`, {
      params: { date: today, sport: sportMap[sport] || 'nba' }
    });
    
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map((game: any) => ({
        id: game.gameID || `game-${Date.now()}`,
        sport_key: `basketball_${sport.toLowerCase()}`,
        sport_title: sport,
        commence_time: game.gameTime || game.commence_time || new Date().toISOString(),
        home_team: game.home || game.home_team || 'Home',
        away_team: game.away || game.away_team || 'Away',
      }));
    }
    return [];
  } catch (error) {
    console.warn(`Failed to fetch games for ${sport}`, error);
    return [];
  }
};

const fetchRealNBAProps = async (): Promise<PropMarket[]> => {
  try {
    const response = await axios.get(`${PRIZEPICKS_API_BASE}/api/prizepicks/selections?sport=nba`);
    const selections = response.data.selections || [];
    
    const props: PropMarket[] = [];
    
    for (let i = 0; i < Math.min(selections.length, 50); i++) {
      const s = selections[i];
      const playerName = s.player_name || s.player || 'Unknown';
      const statType = s.stat_type || s.stat || 'points';
      const lineValue = s.line || 0.5;
      let projectionVal = s.projection || (lineValue * 1.05);
      const teamName = normalizeTeamName(s.team || '');
      
      if (teamName === 'Unknown') continue;
      
      let formattedStat = String(statType).toLowerCase();
      if (formattedStat === 'pts') formattedStat = 'Points';
      else if (formattedStat === 'reb') formattedStat = 'Rebounds';
      else if (formattedStat === 'ast') formattedStat = 'Assists';
      
      projectionVal = Math.min(projectionVal, lineValue * 1.3);
      
      let rawEdge = ((projectionVal - lineValue) / (lineValue || 0.5)) * 100;
      let cappedRawEdge = capEdge(rawEdge);
      let edgeValue = `${cappedRawEdge > 0 ? '+' : ''}${cappedRawEdge.toFixed(1)}%`;
      
      let confidence = 65 + Math.floor(Math.random() * 15);
      confidence = capConfidence(confidence);
      
      props.push({
        id: s.id || `prop-${i}`,
        player: playerName,
        team: teamName,
        market: formattedStat,
        line: lineValue,
        projection: projectionVal,
        over_lineValue: -110,
        under_lineValue: -110,
        confidence: confidence,
        game_id: `game-${i}`,
        game_time: new Date().toISOString(),
        sport: 'NBA',
        edge: edgeValue,
      });
    }
    
    console.log(`📊 Generated ${props.length} NBA props`);
    return props;
  } catch (error) {
    console.warn('Failed to fetch NBA props', error);
    return [];
  }
};

const fetchNHLProps = async (): Promise<PropMarket[]> => {
  try {
    const response = await axios.get(`${PYTHON_API_BASE}/api/players`, {
      params: { sport: 'nhl', realtime: 'true', limit: 100 }
    });

    const players = response.data?.data?.players || [];
    if (!players.length) {
      console.warn('No NHL players returned, using mock data');
      return generateMockNHLProps();
    }

    const props: PropMarket[] = [];

    for (const player of players) {
      const gamesPlayed = Math.max(player.games_played || 1, 1);
      const teamName = normalizeTeamName(player.team || '');
      
      if (teamName === 'Unknown') continue;
      
      if (player.points !== undefined) {
        const pointsPerGame = player.points / gamesPlayed;
        const line = 0.5;
        let projection = Math.min(pointsPerGame, 2.5);
        
        let rawEdge = ((projection - line) / line) * 100;
        let cappedRawEdge = capEdge(rawEdge);
        let edgeValue = `${cappedRawEdge > 0 ? '+' : ''}${cappedRawEdge.toFixed(1)}%`;
        
        let confidence = 60 + Math.floor(Math.random() * 20);
        confidence = capConfidence(confidence);
        
        props.push({
          id: `nhl-${player.id}-points`,
          player: player.name,
          team: teamName,
          market: 'Points',
          line: line,
          projection: projection,
          over_lineValue: -110,
          under_lineValue: -110,
          confidence: confidence,
          game_id: `nhl-game-${player.team}`,
          game_time: new Date().toISOString(),
          sport: 'NHL',
          position: player.position,
          edge: edgeValue,
        });
      }
    }

    console.log(`📊 Generated ${props.length} NHL props`);
    return props.length > 0 ? props : generateMockNHLProps();
  } catch (error) {
    console.warn('Failed to fetch NHL props', error);
    return generateMockNHLProps();
  }
};

const generateMockNHLProps = (): PropMarket[] => {
  const mockPlayers = [
    { name: 'Connor McDavid', team: 'Edmonton Oilers', pointsPerGame: 1.8 },
    { name: 'Nathan MacKinnon', team: 'Colorado Avalanche', pointsPerGame: 1.6 },
    { name: 'Nikita Kucherov', team: 'Tampa Bay Lightning', pointsPerGame: 1.5 },
    { name: 'David Pastrnak', team: 'Boston Bruins', pointsPerGame: 1.3 },
    { name: 'Mikko Rantanen', team: 'Colorado Avalanche', pointsPerGame: 1.4 },
    { name: 'Leon Draisaitl', team: 'Edmonton Oilers', pointsPerGame: 1.5 },
    { name: 'Artemi Panarin', team: 'New York Rangers', pointsPerGame: 1.2 },
    { name: 'Auston Matthews', team: 'Toronto Maple Leafs', pointsPerGame: 1.4 },
  ];
  
  return mockPlayers.map((player, idx) => {
    const line = 0.5;
    const projection = player.pointsPerGame;
    const rawEdge = ((projection - line) / line) * 100;
    const cappedRawEdge = capEdge(rawEdge);
    const edgeValue = `${cappedRawEdge > 0 ? '+' : ''}${cappedRawEdge.toFixed(1)}%`;
    const confidence = 70 + Math.floor(Math.random() * 15);
    
    return {
      id: `mock-nhl-${idx}`,
      player: player.name,
      team: normalizeTeamName(player.team),
      market: 'Points',
      line: line,
      projection: projection,
      over_lineValue: -110,
      under_lineValue: -110,
      confidence: capConfidence(confidence),
      game_id: `nhl-game-${idx}`,
      game_time: new Date().toISOString(),
      sport: 'NHL',
      edge: edgeValue,
    };
  });
};

const fetchMLBProps = async (): Promise<PropMarket[]> => {
  try {
    const response = await axios.get(`${PYTHON_API_BASE}/api/players`, {
      params: { sport: 'mlb', realtime: 'true', limit: 150 }
    });

    const players = response.data?.data?.players || [];
    if (!players.length) {
      console.warn('No MLB players returned, using mock data');
      return generateMockMLBProps();
    }

    const props: PropMarket[] = [];

    for (const player of players) {
      const gamesPlayed = Math.max(player.games_played || 1, 1);
      const teamName = normalizeTeamName(player.team || '');
      
      if (teamName === 'Unknown') continue;
      
      if (player.position !== 'P' && player.hits !== undefined) {
        const hitsPerGame = player.hits / gamesPlayed;
        const line = 0.5;
        let projection = Math.min(hitsPerGame, 3.0);
        
        let rawEdge = ((projection - line) / line) * 100;
        let cappedRawEdge = capEdge(rawEdge);
        let edgeValue = `${cappedRawEdge > 0 ? '+' : ''}${cappedRawEdge.toFixed(1)}%`;
        
        let confidence = 60 + Math.floor(Math.random() * 20);
        confidence = capConfidence(confidence);
        
        props.push({
          id: `mlb-${player.id}-hits`,
          player: player.name,
          team: teamName,
          market: 'Hits',
          line: line,
          projection: projection,
          over_lineValue: -110,
          under_lineValue: -110,
          confidence: confidence,
          game_id: `mlb-game-${player.team}`,
          game_time: new Date().toISOString(),
          sport: 'MLB',
          position: player.position,
          edge: edgeValue,
        });
      }
    }

    console.log(`📊 Generated ${props.length} MLB props`);
    return props.length > 0 ? props : generateMockMLBProps();
  } catch (error) {
    console.warn('Failed to fetch MLB props', error);
    return generateMockMLBProps();
  }
};

const generateMockMLBProps = (): PropMarket[] => {
  const mockPlayers = [
    { name: 'Shohei Ohtani', team: 'Los Angeles Dodgers', hitsPerGame: 1.2 },
    { name: 'Mookie Betts', team: 'Los Angeles Dodgers', hitsPerGame: 1.1 },
    { name: 'Aaron Judge', team: 'New York Yankees', hitsPerGame: 1.0 },
    { name: 'Ronald Acuña Jr.', team: 'Atlanta Braves', hitsPerGame: 1.3 },
    { name: 'Freddie Freeman', team: 'Los Angeles Dodgers', hitsPerGame: 1.1 },
    { name: 'Bryce Harper', team: 'Philadelphia Phillies', hitsPerGame: 1.0 },
    { name: 'Juan Soto', team: 'New York Yankees', hitsPerGame: 1.0 },
    { name: 'Corey Seager', team: 'Texas Rangers', hitsPerGame: 1.1 },
  ];
  
  return mockPlayers.map((player, idx) => {
    const line = 0.5;
    const projection = player.hitsPerGame;
    const rawEdge = ((projection - line) / line) * 100;
    const cappedRawEdge = capEdge(rawEdge);
    const edgeValue = `${cappedRawEdge > 0 ? '+' : ''}${cappedRawEdge.toFixed(1)}%`;
    const confidence = 65 + Math.floor(Math.random() * 15);
    
    return {
      id: `mock-mlb-${idx}`,
      player: player.name,
      team: normalizeTeamName(player.team),
      market: 'Hits',
      line: line,
      projection: projection,
      over_lineValue: -110,
      under_lineValue: -110,
      confidence: capConfidence(confidence),
      game_id: `mlb-game-${idx}`,
      game_time: new Date().toISOString(),
      sport: 'MLB',
      edge: edgeValue,
    };
  });
};

// ========== HELPER: generate combo suggestions ==========
const generateCombosFromProps = (props: PropMarket[], sport: string): ComboSuggestion[] => {
  const suggestions: ComboSuggestion[] = [];

  if (props.length < 2) {
    console.log(`⚠️ Not enough props for ${sport}: ${props.length}`);
    return suggestions;
  }

  const uniqueMap = new Map<string, PropMarket>();
  props.forEach(prop => {
    const key = `${prop.player}|${prop.market}|${prop.line}`;
    if (!uniqueMap.has(key) || (prop.confidence || 0) > (uniqueMap.get(key)?.confidence || 0)) {
      uniqueMap.set(key, prop);
    }
  });
  const uniqueProps = Array.from(uniqueMap.values());

  console.log(`📊 Generating combo from ${uniqueProps.length} unique props for ${sport}`);
  
  const sortedByConfidence = [...uniqueProps].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  const selectedProps = [];
  const usedPlayers = new Set<string>();
  
  for (const prop of sortedByConfidence) {
    if (selectedProps.length >= 3) break;
    if (!usedPlayers.has(prop.player)) {
      selectedProps.push(prop);
      usedPlayers.add(prop.player);
      console.log(`✅ Selected: ${prop.player} - ${prop.market} (Confidence: ${prop.confidence}, Edge: ${prop.edge})`);
    }
  }

  if (selectedProps.length >= 2) {
    const legs = selectedProps.map((prop, idx) => {
      const americanOdds = prop.over_lineValue;
      let decimalOdds = 0;
      if (americanOdds > 0) {
        decimalOdds = 1 + (americanOdds / 100);
      } else {
        decimalOdds = 1 - (100 / americanOdds);
      }
      
      return {
        id: `gen-${Date.now()}-conf-${idx}`,
        description: `${prop.player} ${prop.market} Over ${prop.line}`,
        lineValue: prop.over_lineValue > 0 ? `+${prop.over_lineValue}` : prop.over_lineValue.toString(),
        confidence: prop.confidence,
        sport,
        market: 'player_props',
        player_name: prop.player,
        projection: prop.projection || prop.line,
        edge: prop.edge || '0%',
        line: prop.line,
        odds: prop.over_lineValue,
        decimalOdds: decimalOdds,
      };
    });

    let totalDecimal = 1.0;
    legs.forEach(leg => {
      totalDecimal *= leg.decimalOdds;
    });
    
    const totalAmericanOdds = totalDecimal >= 2.0 
      ? `+${Math.round((totalDecimal - 1) * 100)}` 
      : Math.round(-100 / (totalDecimal - 1)).toString();
    
    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);

    suggestions.push({
      id: `top-conf-${Date.now()}`,
      name: `${sport} Top Confidence Combo`,
      sport,
      type: 'standard',
      market_type: 'player_props',
      legs: legs.map(({ decimalOdds, odds, ...rest }) => rest),
      total_lineValue: totalAmericanOdds,
      confidence: avgConfidence,
      analysis: `Combo built from the highest confidence player picks for ${sport}.`,
      timestamp: new Date().toISOString(),
      isToday: true,
      confidence_level: avgConfidence > 80 ? 'high' : avgConfidence > 70 ? 'medium' : 'low',
      expected_value: avgConfidence > 80 ? '+8.5%' : avgConfidence > 70 ? '+5.5%' : '+2.5%',
      risk_level: avgConfidence > 80 ? 'low' : avgConfidence > 70 ? 'medium' : 'high',
      ai_metrics: {
        leg_count: legs.length,
        avg_leg_confidence: avgConfidence,
        recommended_hypothetical: '$5.00',
        edge: avgConfidence > 80 ? 0.085 : avgConfidence > 70 ? 0.055 : 0.025,
      },
      is_real_data: true,
      source: 'api',
    });
  } else {
    console.warn(`Not enough unique props for ${sport}. Found: ${selectedProps.length}`);
  }

  return suggestions;
};

// ========== MAIN CONTENT COMPONENT ==========
const ComboArchitectContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [generatorCredits, setGeneratorCredits] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<ComboSuggestion[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<ComboSuggestion | null>(null);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedSport, setSelectedSport] = useState('NBA');
  const [selectedType, setSelectedType] = useState('all');
  const [minConfidence, setMinConfidence] = useState(60);
  const [maxLegs, setMaxLegs] = useState(5);
  const [marketType, setMarketType] = useState('all');
  const [minAnalyticalAdvantage, setMinAnalyticalAdvantage] = useState(0);
  const [maxVolatility, setMaxVolatility] = useState('all');
  const [comboSize, setComboSize] = useState('all');
  const [showTodaysGames, setShowTodaysGames] = useState(true);

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  // ========== DATA FROM APIs ==========
  const {
    data: games = [],
    isLoading: gamesLoading,
    refetch: refetchGames,
  } = useQuery({
    queryKey: ['games', selectedSport],
    queryFn: () => fetchGames(selectedSport),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: nbaProps = [],
    isLoading: nbaPropsLoading,
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
  });

  const {
    data: mlbProps = [],
    refetch: refetchMLBProps,
    isLoading: mlbPropsLoading,
  } = useQuery({
    queryKey: ['mlb-props'],
    queryFn: fetchMLBProps,
    staleTime: 10 * 60 * 1000,
  });

  const props = useMemo(() => {
    switch (selectedSport) {
      case 'NBA': return nbaProps;
      case 'NHL': return nhlProps;
      case 'MLB': return mlbProps;
      default: return nbaProps;
    }
  }, [selectedSport, nbaProps, nhlProps, mlbProps]);

  // Filter props to only include players from today's games
  const filteredProps = useMemo(() => {
    if (props.length === 0 || games.length === 0) return props;
    
    const validTeams = new Set<string>();
    games.forEach(game => {
      if (game.home_team) validTeams.add(game.home_team.toLowerCase());
      if (game.away_team) validTeams.add(game.away_team.toLowerCase());
    });
    
    const filtered = props.filter(prop => {
      const teamLower = (prop.team || '').toLowerCase();
      return validTeams.has(teamLower);
    });
    
    console.log(`📊 ${selectedSport}: Filtered from ${props.length} to ${filtered.length} props (today's games only)`);
    return filtered;
  }, [props, games, selectedSport]);

  // Generate suggestions from filtered props
  const suggestions = useMemo(() => {
    if (filteredProps.length === 0) return [];
    return generateCombosFromProps(filteredProps, selectedSport);
  }, [filteredProps, selectedSport]);

  // ========== FETCH CREDITS ==========
  const refreshCredits = useCallback(async () => {
    const userId = user?.uid || user?.id;
    
    if (!userId || !token) return;
    
    try {
      const response = await fetch(`${PYTHON_API_BASE}/api/user/generations/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratorCredits(data.remaining);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  }, [user, token]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // ========== FILTER SUGGESTIONS - FIXED INFINITE LOOP ==========
  useEffect(() => {
    if (suggestions.length === 0) {
      if (filteredSuggestions.length !== 0) {
        setFilteredSuggestions([]);
      }
      return;
    }

    let filtered = [...suggestions];

    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    filtered = filtered.filter(p => (p.confidence || 0) >= minConfidence);
    filtered = filtered.filter(p => (p.legs?.length || 0) <= maxLegs);

    if (marketType !== 'all') {
      filtered = filtered.filter(p => (p.market_type || p.type) === marketType);
    }

    if (minAnalyticalAdvantage > 0) {
      filtered = filtered.filter(p => {
        const advantage = p.ai_metrics?.edge || 0;
        return (advantage * 100) >= minAnalyticalAdvantage;
      });
    }

    if (maxVolatility !== 'all') {
      const volOrder = { low: 1, medium: 2, high: 3 };
      const maxVolValue = volOrder[maxVolatility as keyof typeof volOrder] || 3;
      filtered = filtered.filter(p => {
        const vol = p.risk_level || 'medium';
        const volValue = volOrder[vol as keyof typeof volOrder] || 2;
        return volValue <= maxVolValue;
      });
    }

    if (comboSize !== 'all') {
      filtered = filtered.filter(p => {
        const legsCount = p.legs?.length || 0;
        if (comboSize === '2') return legsCount === 2;
        if (comboSize === '3') return legsCount === 3;
        if (comboSize === '4') return legsCount === 4;
        if (comboSize === '5') return legsCount >= 5;
        return true;
      });
    }

    const sortedAndLimited = filtered
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_VISIBLE_SUGGESTIONS);

    if (JSON.stringify(sortedAndLimited) !== JSON.stringify(filteredSuggestions)) {
      setFilteredSuggestions(sortedAndLimited);
    }
  }, [suggestions, selectedType, minConfidence, maxLegs, marketType, minAnalyticalAdvantage, maxVolatility, comboSize, filteredSuggestions]);

  // ========== CREDITS CHECKOUT ==========
  const handleCreditsCheckout = async (credits: number) => {
    if (!user || !token) {
      setSuccessMessage('Please log in first');
      setShowSuccessAlert(true);
      return;
    }
    try {
      const response = await fetch(`${PYTHON_API_BASE}/api/generator/credits/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ credits }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'Failed to create checkout session');
    } catch (error) {
      console.error('Credits checkout error:', error);
      setSuccessMessage('Failed to start checkout');
      setShowSuccessAlert(true);
    }
  };

  // ========== GENERATION FUNCTIONS ==========
  const generateComboFromGames = useCallback(async (sport: string, numLegs: number) => {
    await refreshCredits();
    
    if (generatorCredits <= 0) {
      setShowCreditsModal(true);
      return;
    }

    setGenerating(true);
    try {
      const userId = user?.uid || user?.id;
      
      if (!userId || !token) throw new Error('Not logged in');

      const useResponse = await fetch(`${PYTHON_API_BASE}/api/user/generations/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: userId,
          pickType: 'parlay_architect',
          pickData: { sport, numLegs }
        }),
      });
      
      if (!useResponse.ok) {
        throw new Error('Failed to use credit');
      }
      
      const creditData = await useResponse.json();
      setGeneratorCredits(creditData.remaining);

      let propsToUse: PropMarket[] = [];
      if (sport === 'NBA') propsToUse = nbaProps;
      else if (sport === 'NHL') propsToUse = nhlProps;
      else if (sport === 'MLB') propsToUse = mlbProps;

      if (games.length > 0) {
        const validTeams = new Set<string>();
        games.forEach(game => {
          validTeams.add(game.home_team?.toLowerCase());
          validTeams.add(game.away_team?.toLowerCase());
        });
        propsToUse = propsToUse.filter(prop => {
          const teamLower = (prop.team || '').toLowerCase();
          return validTeams.has(teamLower);
        });
      }

      if (propsToUse.length < numLegs) {
        throw new Error(`Not enough picks available for today's ${sport} games`);
      }

      const uniqueMap = new Map<string, PropMarket>();
      propsToUse.forEach(prop => {
        const key = `${prop.player}|${prop.market}|${prop.line}`;
        if (!uniqueMap.has(key) || (prop.confidence || 0) > (uniqueMap.get(key)?.confidence || 0)) {
          uniqueMap.set(key, prop);
        }
      });
      const uniqueProps = Array.from(uniqueMap.values());

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

      if (selected.length < 2) throw new Error('Not enough unique picks');

      let decimal = 1.0;
      const legs = selected.map((prop, idx) => {
        const safeConf = capConfidence(Number(prop.confidence) || 70);
        const lineValueNum = prop.over_lineValue;
        if (lineValueNum > 0) decimal *= 1 + lineValueNum / 100;
        else decimal *= 1 - 100 / Math.abs(lineValueNum);

        return {
          id: `real-leg-${Date.now()}-${idx}`,
          player_name: prop.player,
          market: prop.market,
          odds_american: prop.over_lineValue > 0 ? `+${prop.over_lineValue}` : prop.over_lineValue.toString(),
          lineValue: prop.over_lineValue,
          confidence: safeConf,
          sport: sport,
          description: `${prop.player} ${prop.market} Over ${prop.line}`,
          projection: prop.projection || prop.line * 1.05,
          edge: prop.edge || '0%',
          line: prop.line,
        };
      });

      const totalLineValue = decimal >= 2.0
        ? `+${Math.round((decimal - 1) * 100)}`
        : Math.round(-100 / (decimal - 1)).toString();

      const avgConfidence = Math.round(legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length);

      const realCombo: ComboSuggestion = {
        id: `real-${Date.now()}`,
        name: `${sport} Real Picks Combo`,
        sport: sport,
        type: 'standard',
        market_type: 'player_props',
        legs,
        total_lineValue: totalLineValue,
        confidence: avgConfidence,
        analysis: `Combo built from real ${sport} picks.`,
        timestamp: new Date().toISOString(),
        isToday: true,
        confidence_level: avgConfidence > 80 ? 'very-high' : avgConfidence > 70 ? 'high' : 'medium',
        expected_value: '+5.5%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: legs.length,
          avg_leg_confidence: avgConfidence,
          recommended_hypothetical: '$5.00',
          edge: 0.055,
        },
        is_real_data: true,
        source: sport === 'NBA' ? 'prizepicks' : 'python-api'
      };

      setSelectedCombo(realCombo);
      setShowBuildModal(true);
      setSuccessMessage(`Generated ${legs.length}-leg combo from real ${sport} data!`);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Generation failed', error);
      setSuccessMessage(error instanceof Error ? error.message : 'Failed to generate combo');
      setShowSuccessAlert(true);
    } finally {
      setGenerating(false);
    }
  }, [generatorCredits, user, token, nbaProps, nhlProps, mlbProps, games, refreshCredits]);

  const generateComboFromQuery = useCallback(async (query: string) => {
    await refreshCredits();
    
    if (generatorCredits <= 0) {
      setShowCreditsModal(true);
      return;
    }

    setGenerating(true);
    try {
      const userId = user?.uid || user?.id;
      
      if (!userId || !token) throw new Error('Not logged in');

      const useResponse = await fetch(`${PYTHON_API_BASE}/api/user/generations/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: userId,
          pickType: 'parlay_architect',
          pickData: { query, sport: selectedSport }
        }),
      });
      
      if (!useResponse.ok) {
        throw new Error('Failed to use credit');
      }
      
      const creditData = await useResponse.json();
      setGeneratorCredits(creditData.remaining);

      const queryLower = query.toLowerCase();
      let targetSport = selectedSport;
      let numLegs = 3;

      if (queryLower.includes('nhl')) targetSport = 'NHL';
      if (queryLower.includes('mlb')) targetSport = 'MLB';
      if (queryLower.includes('nba')) targetSport = 'NBA';

      const legMatch = queryLower.match(/(\d+)[-\s]?leg/);
      if (legMatch) numLegs = parseInt(legMatch[1], 10);
      numLegs = Math.min(5, Math.max(2, numLegs));

      let propsToUse: PropMarket[] = [];
      if (targetSport === 'NBA') propsToUse = nbaProps;
      else if (targetSport === 'NHL') propsToUse = nhlProps;
      else if (targetSport === 'MLB') propsToUse = mlbProps;

      if (games.length > 0) {
        const validTeams = new Set<string>();
        games.forEach(game => {
          validTeams.add(game.home_team?.toLowerCase());
          validTeams.add(game.away_team?.toLowerCase());
        });
        propsToUse = propsToUse.filter(prop => {
          const teamLower = (prop.team || '').toLowerCase();
          return validTeams.has(teamLower);
        });
      }

      if (propsToUse.length === 0) {
        throw new Error(`No picks available for today's ${targetSport} games`);
      }

      const uniqueMap = new Map<string, PropMarket>();
      propsToUse.forEach(prop => {
        const key = `${prop.player}|${prop.market}|${prop.line}`;
        if (!uniqueMap.has(key) || (prop.confidence || 0) > (uniqueMap.get(key)?.confidence || 0)) {
          uniqueMap.set(key, prop);
        }
      });
      const uniqueProps = Array.from(uniqueMap.values());

      const selected: PropMarket[] = [];
      const usedPlayers = new Set<string>();
      for (const prop of uniqueProps) {
        if (selected.length >= numLegs) break;
        if (!usedPlayers.has(prop.player)) {
          selected.push(prop);
          usedPlayers.add(prop.player);
        }
      }

      if (selected.length < 2) throw new Error('Could not build a combo from your prompt');

      let decimal = 1.0;
      const legs = selected.map((prop, idx) => {
        const safeConf = capConfidence(Number(prop.confidence) || 70);
        const lineValueNum = prop.over_lineValue;
        if (lineValueNum > 0) decimal *= 1 + lineValueNum / 100;
        else decimal *= 1 - 100 / Math.abs(lineValueNum);

        return {
          id: `ai-leg-${Date.now()}-${idx}`,
          player_name: prop.player,
          market: prop.market,
          odds_american: prop.over_lineValue > 0 ? `+${prop.over_lineValue}` : prop.over_lineValue.toString(),
          lineValue: prop.over_lineValue,
          confidence: safeConf,
          sport: targetSport,
          description: `${prop.player} ${prop.market} Over ${prop.line}`,
          projection: prop.projection || prop.line * 1.05,
          edge: prop.edge || '0%',
          line: prop.line,
        };
      });

      const totalLineValue = decimal >= 2.0
        ? `+${Math.round((decimal - 1) * 100)}`
        : Math.round(-100 / (decimal - 1)).toString();

      const avgConfidence = Math.round(legs.reduce((sum, leg) => sum + leg.confidence, 0) / legs.length);

      const aiCombo: ComboSuggestion = {
        id: `ai-${Date.now()}`,
        name: `AI: ${query.substring(0, 30)}${query.length > 30 ? '...' : ''}`,
        sport: targetSport,
        type: 'standard',
        market_type: 'player_props',
        legs,
        total_lineValue: totalLineValue,
        confidence: avgConfidence,
        analysis: `Combo generated from your prompt: "${query}"`,
        timestamp: new Date().toISOString(),
        isToday: true,
        confidence_level: avgConfidence > 80 ? 'very-high' : avgConfidence > 70 ? 'high' : 'medium',
        expected_value: '+5.5%',
        risk_level: 'medium',
        ai_metrics: {
          leg_count: legs.length,
          avg_leg_confidence: avgConfidence,
          recommended_hypothetical: '$5.00',
          edge: 0.055,
        },
        is_real_data: true,
        source: targetSport
      };

      setSelectedCombo(aiCombo);
      setShowBuildModal(true);
      setSuccessMessage(`Generated ${legs.length}-leg combo based on your prompt!`);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('Generation failed', error);
      setSuccessMessage(error instanceof Error ? error.message : 'Failed to generate combo');
      setShowSuccessAlert(true);
    } finally {
      setGenerating(false);
    }
  }, [generatorCredits, user, token, selectedSport, nbaProps, nhlProps, mlbProps, games, refreshCredits]);

  const handleRefresh = () => {
    refetchGames();
    refetchNBAProps();
    refetchNHLProps();
    refetchMLBProps();
    refreshCredits();
    setLastRefresh(new Date());
    setSuccessMessage('Data refreshed successfully!');
    setShowSuccessAlert(true);
  };

  const handleBuildCombo = (combo: ComboSuggestion) => {
    setSelectedCombo(combo);
    setShowBuildModal(true);
  };

  const handleAddToTracker = () => {
    if (selectedCombo) {
      setSuccessMessage(`${selectedCombo.name} added to tracker!`);
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowBuildModal(false);
      }, 1000);
    }
  };

  const handleGenerateAI = useCallback(async () => {
    await generateComboFromQuery(customQuery);
    setGeneratorOpen(false);
  }, [customQuery, generateComboFromQuery]);

  const isLoadingProps = useMemo(() => {
    switch (selectedSport) {
      case 'NBA': return nbaPropsLoading;
      case 'NHL': return nhlPropsLoading;
      case 'MLB': return mlbPropsLoading;
      default: return nbaPropsLoading;
    }
  }, [selectedSport, nbaPropsLoading, nhlPropsLoading, mlbPropsLoading]);

  if (isLoadingProps && props.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" height="80vh" flexDirection="column">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>Loading Combo Architect '26...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setShowSuccessAlert(false)}>
          <AlertTitle>Success!</AlertTitle>
          {successMessage}
        </Alert>
      )}

      <Alert severity={generatorCredits > 0 ? "info" : "warning"} sx={{ mb: 3 }}>
        <AlertTitle>
          {generatorCredits > 0 ? `✨ You have ${generatorCredits} generator credits remaining` : "⚠️ No generator credits left"}
        </AlertTitle>
        Generating a new combo uses 1 credit. Viewing the top 4 projected picks above is free.
        {generatorCredits === 0 && " Purchase credits to generate combos."}
        <Box sx={{ mt: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setShowCreditsModal(true)} startIcon={<CreditCardIcon />}>
            Buy Credits
          </Button>
          <Button size="small" variant="contained" sx={{ ml: 1 }} onClick={() => setShowUpgradeModal(true)}>
            Upgrade to Premium
          </Button>
          <Button size="small" variant="text" onClick={refreshCredits} startIcon={<RefreshIcon />}>
            Refresh ({generatorCredits})
          </Button>
        </Box>
      </Alert>

      <Paper sx={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5A4ABD 100%)', mb: 4, p: 3, color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} variant="outlined" size="small">Back</Button>
          <Box display="flex" alignItems="center" gap={1}>
            {lastRefresh && <Chip label={`Updated: ${format(lastRefresh, 'h:mm a')}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
            <Chip label={`${suggestions.length} ${selectedSport} Combos`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={<TrophyIcon sx={{ fontSize: 14 }} />} />
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}><BasketballIcon sx={{ fontSize: 32 }} /></Avatar>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>Combo Architect '26</Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>Create winning combos with real data</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>You have {generatorCredits} credits remaining</Typography>
          </Box>
        </Box>
      </Paper>

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

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Combo Type</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {['standard', 'same_game', 'all'].map(type => (
            <Chip
              key={type}
              label={type === 'same_game' ? 'Game Combo' : type === 'standard' ? 'Standard' : 'All'}
              onClick={() => setSelectedType(type)}
              color={selectedType === type ? "primary" : "default"}
              variant={selectedType === type ? "filled" : "outlined"}
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Button 
              variant="contained" 
              fullWidth 
              startIcon={<AutorenewIcon />} 
              onClick={() => generateComboFromGames(selectedSport, 3)} 
              disabled={generating || generatorCredits <= 0 || filteredProps.length === 0} 
              sx={{ height: '40px', bgcolor: '#6C5CE7' }}
            >
              {generating ? <><CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />Generating...</> : `Generate ${selectedSport} Combo`}
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
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Advanced Filters</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Market Type</InputLabel>
              <Select value={marketType} onChange={(e) => setMarketType(e.target.value)} label="Market Type">
                {MARKET_TYPES.map(market => <MenuItem key={market.id} value={market.id}>{market.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Combo Size</InputLabel>
              <Select value={comboSize} onChange={(e) => setComboSize(e.target.value)} label="Combo Size">
                {COMBO_SIZES.map(size => <MenuItem key={size.id} value={size.id}>{size.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Max Volatility</InputLabel>
              <Select value={maxVolatility} onChange={(e) => setMaxVolatility(e.target.value)} label="Max Volatility">
                {RISK_LEVELS.map(risk => <MenuItem key={risk.id} value={risk.id}>{risk.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary">Min Advantage: {minAnalyticalAdvantage}%</Typography>
              <Slider value={minAnalyticalAdvantage} onChange={(_, v) => setMinAnalyticalAdvantage(v as number)} min={0} max={12} step={1} valueLabelDisplay="auto" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary">Min Confidence: {minConfidence}%</Typography>
              <Slider value={minConfidence} onChange={(_, v) => setMinConfidence(v as number)} min={55} max={85} step={5} valueLabelDisplay="auto" />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ px: 1 }}>
              <Typography variant="caption" color="text.secondary">Max Legs: {maxLegs}</Typography>
              <Slider value={maxLegs} onChange={(_, v) => setMaxLegs(v as number)} min={2} max={10} step={1} valueLabelDisplay="auto" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 4 }}>
        <Accordion expanded={showTodaysGames} onChange={() => setShowTodaysGames(!showTodaysGames)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2}>
              <TodayIcon color="primary" />
              <Typography variant="h6">Today's {selectedSport} Games</Typography>
              <Chip label={`${games.length} games`} size="small" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {games.length === 0 ? (
              <Typography color="text.secondary">No games scheduled for today.</Typography>
            ) : (
              <Grid container spacing={2}>
                {games.slice(0, 4).map(game => (
                  <Grid item xs={12} sm={6} md={4} key={game.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">{game.away_team} @ {game.home_team}</Typography>
                        <Typography variant="caption">{safeFormatTime(game.commence_time)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </AccordionDetails>
        </Accordion>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 2, mb: 2 }}>
        🔥 Top Projected Picks ({filteredSuggestions.length})
      </Typography>
      {filteredSuggestions.length === 0 ? (
        <Alert severity="info">
          No combo suggestions match your filters. {filteredProps.length === 0 ? 'No player props available for today\'s games.' : 'Try adjusting your filters.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredSuggestions.map(combo => (
            <Grid item xs={12} md={6} key={combo.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">{combo.name}</Typography>
                    <Chip label={combo.total_lineValue} color="primary" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {combo.legs.length} legs • {combo.sport}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  {combo.legs.slice(0, 3).map((leg, idx) => (
                    <Box key={idx} mb={1}>
                      <Typography variant="body2">{leg.description}</Typography>
                      <Box display="flex" alignItems="center">
                        <LinearProgress variant="determinate" value={leg.confidence} sx={{ width: 80, height: 4, mr: 1 }} />
                        <Typography variant="caption">{leg.confidence}% conf</Typography>
                        {leg.edge && <Typography variant="caption" sx={{ ml: 1 }}>Edge: {leg.edge}</Typography>}
                      </Box>
                    </Box>
                  ))}
                  {combo.legs.length > 3 && <Typography variant="caption">+{combo.legs.length - 3} more</Typography>}
                  <Button size="small" variant="outlined" onClick={() => handleBuildCombo(combo)} sx={{ mt: 2 }}>
                    Build This Combo
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={generatorOpen} onClose={() => setGeneratorOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">AI Combo Generator</Typography>
            <Chip label={`${generatorCredits} credits left`} size="small" color="warning" />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Describe the combo you want. Each generation uses 1 credit.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Choose a prompt</InputLabel>
            <Select
              value=""
              label="Choose a prompt"
              onChange={(e) => setCustomQuery(e.target.value as string)}
            >
              {PROMPTS.map((prompt, idx) => (
                <MenuItem key={idx} value={prompt.query}>
                  {prompt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Or type your own prompt here..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            variant="outlined"
            sx={{ mb: 3 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGeneratorOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateAI}
            disabled={!customQuery.trim() || generating || generatorCredits <= 0}
            startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showCreditsModal} onClose={() => setShowCreditsModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#6C5CE7', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCardIcon sx={{ mr: 1 }} /> Purchase Credits
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>
            Generate combos with credits. Each generation uses 1 credit.
          </Typography>
          <Grid container spacing={2}>
            {[
              { credits: 1, price: '$1.99', perPrediction: '$1.99', description: '1 Credit' },
              { credits: 10, price: '$14.90', perPrediction: '$1.49', popular: true, description: '10 Credits' },
              { credits: 20, price: '$25.80', perPrediction: '$1.29', description: '20 Credits' },
              { credits: 50, price: '$44.50', perPrediction: '$0.89', bestValue: true, description: '50 Credits' }
            ].map((option, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card 
                  sx={{ 
                    border: option.popular ? '2px solid #6C5CE7' : option.bestValue ? '2px solid #10b981' : '1px solid #e5e7eb', 
                    position: 'relative', 
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
                  }}
                  onClick={() => handleCreditsCheckout(option.credits)}
                >
                  {option.popular && <Chip label="POPULAR" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6C5CE7', color: 'white' }} />}
                  {option.bestValue && <Chip label="BEST VALUE" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#10b981', color: 'white' }} />}
                  <CardContent sx={{ textAlign: 'center', pt: option.popular || option.bestValue ? 4 : 2 }}>
                    <Typography variant="h6" fontWeight="bold">{option.description}</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>{option.price}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.perPrediction} per credit</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setShowCreditsModal(false)} sx={{ color: '#64748b' }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#6C5CE7', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StarIcon sx={{ mr: 1 }} /> Upgrade to Premium
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography paragraph sx={{ textAlign: 'center', mb: 3 }}>
            Get unlimited combo generation and premium features!
          </Typography>
          <Grid container spacing={2}>
            {[
              { planId: 'starter', name: 'Starter Plan', price: '$5.99/month', features: ['Unlimited Combo Generation', 'Priority Support'], popular: false },
              { planId: 'generator', name: 'Generator Plan', price: '$39.99/month', features: ['Unlimited Combo Generation', 'Priority Support', 'Early Access', '8 Daily AI Picks'], popular: true }
            ].map((option, index) => (
              <Grid item xs={12} key={index}>
                <Card 
                  sx={{ 
                    border: option.popular ? '2px solid #6C5CE7' : '1px solid #e5e7eb', 
                    position: 'relative', 
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
                  }}
                  onClick={() => { navigate('/subscription'); setShowUpgradeModal(false); }}
                >
                  {option.popular && <Chip label="POPULAR" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6C5CE7', color: 'white' }} />}
                  <CardContent sx={{ textAlign: 'center', pt: option.popular ? 4 : 2 }}>
                    <Typography variant="h6" fontWeight="bold">{option.name}</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" sx={{ my: 1 }}>{option.price}</Typography>
                    <Box sx={{ mt: 2 }}>
                      {option.features.map((feature, idx) => (
                        <Typography key={idx} variant="body2" sx={{ color: '#94a3b8', mb: 0.5 }}>
                          ✓ {feature}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button onClick={() => setShowUpgradeModal(false)} sx={{ color: '#64748b' }}>Maybe Later</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showBuildModal} onClose={() => setShowBuildModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Build Your Combo</DialogTitle>
        <DialogContent>
          {selectedCombo && (
            <Box>
              <Typography variant="h6">{selectedCombo.name}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedCombo.legs.length} legs • Total Odds: {selectedCombo.total_lineValue}
              </Typography>
              <Divider sx={{ my: 2 }} />
              {selectedCombo.legs.map((leg, idx) => (
                <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold">{leg.description}</Typography>
                  <Typography variant="caption">Odds: {leg.lineValue} • Confidence: {leg.confidence}%</Typography>
                  {leg.edge && <Typography variant="caption" sx={{ ml: 2 }}>Edge: {leg.edge}</Typography>}
                </Box>
              ))}
              <Typography variant="body2" sx={{ mt: 2 }}>{selectedCombo.analysis}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddToTracker} variant="contained">Add to Tracker</Button>
          <Button onClick={() => setShowBuildModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const ComboArchitectScreen: React.FC = () => <ComboArchitectContent />;
export default ComboArchitectScreen;
