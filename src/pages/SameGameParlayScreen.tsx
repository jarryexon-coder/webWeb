// pages/SameGameParlayScreen.tsx - Fixed with proper market filtering
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
  Avatar,
  useTheme,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';
import {
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  Casino as ParlayIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  AutoAwesome as AutoAwesomeIcon,
  Clear as ClearIcon,
  Lock as LockIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { alpha } from '@mui/material/styles';

// ==============================
// Configuration & Types
// ==============================

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';
const API_TIMEOUT = 30000;

// ==============================
// 15 QUICK PROMPTS FOR GENERATOR
// ==============================

const QUICK_PROMPTS = [
  // NBA (5)
  { label: '🏀 NBA High Confidence Parlay', query: 'nba high confidence same game parlay', sport: 'NBA', market: 'player_props' },
  { label: '📊 NBA Points + Assists', query: 'nba points and assists same game', sport: 'NBA', market: 'player_props' },
  { label: '💪 NBA Triple-Double Threats', query: 'nba triple double same game', sport: 'NBA', market: 'player_props' },
  { label: '🎯 NBA Top Scorer Props', query: 'nba top scorer same game', sport: 'NBA', market: 'player_props' },
  { label: '💰 NBA Moneyline + Total', query: 'nba moneyline and total same game', sport: 'NBA', market: 'mixed' },  // This is correct - mixed
  
  // MLB (5)
  { label: '⚾ MLB Home Run Parlay', query: 'mlb home run same game', sport: 'MLB', market: 'player_props' },
  { label: '🥎 MLB Strikeout Props', query: 'mlb strikeouts same game', sport: 'MLB', market: 'player_props' },
  { label: '🔥 MLB Hits + RBI', query: 'mlb hits and rbi same game', sport: 'MLB', market: 'player_props' },
  { label: '🧢 MLB Pitcher Props', query: 'mlb pitcher props same game', sport: 'MLB', market: 'player_props' },
  { label: '📈 MLB Total + Moneyline', query: 'mlb total and moneyline same game', sport: 'MLB', market: 'mixed' },  // This is correct - mixed
  
  // NHL (5)
  { label: '🏒 NHL Goal Scorer Props', query: 'nhl goal scorer same game', sport: 'NHL', market: 'player_props' },
  { label: '🥅 NHL Goalie Saves', query: 'nhl goalie saves same game', sport: 'NHL', market: 'player_props' },
  { label: '📊 NHL Points + Assists', query: 'nhl points and assists same game', sport: 'NHL', market: 'player_props' },
  { label: '💥 NHL Hits + Shots', query: 'nhl hits and shots same game', sport: 'NHL', market: 'player_props' },
  { label: '🔥 NHL Moneyline + Total', query: 'nhl moneyline and total same game', sport: 'NHL', market: 'mixed' },  // This is correct - mixed
];

// ==============================
// Team Name Mappings
// ==============================

const NBA_TEAM_MAP: Record<string, string> = {
  'ATL': 'Atlanta Hawks', 'BOS': 'Boston Celtics', 'BKN': 'Brooklyn Nets',
  'CHA': 'Charlotte Hornets', 'CHI': 'Chicago Bulls', 'CLE': 'Cleveland Cavaliers',
  'DAL': 'Dallas Mavericks', 'DEN': 'Denver Nuggets', 'DET': 'Detroit Pistons',
  'GSW': 'Golden State Warriors', 'HOU': 'Houston Rockets', 'IND': 'Indiana Pacers',
  'LAC': 'LA Clippers', 'LAL': 'Los Angeles Lakers', 'MEM': 'Memphis Grizzlies',
  'MIA': 'Miami Heat', 'MIL': 'Milwaukee Bucks', 'MIN': 'Minnesota Timberwolves',
  'NOP': 'New Orleans Pelicans', 'NYK': 'New York Knicks', 'OKC': 'Oklahoma City Thunder',
  'ORL': 'Orlando Magic', 'PHI': 'Philadelphia 76ers', 'PHX': 'Phoenix Suns',
  'POR': 'Portland Trail Blazers', 'SAC': 'Sacramento Kings', 'SAS': 'San Antonio Spurs',
  'TOR': 'Toronto Raptors', 'UTA': 'Utah Jazz', 'WAS': 'Washington Wizards',
};

const NHL_TEAM_MAP: Record<string, string> = {
  'ANA': 'Anaheim Ducks', 'ARI': 'Arizona Coyotes', 'BOS': 'Boston Bruins',
  'BUF': 'Buffalo Sabres', 'CGY': 'Calgary Flames', 'CAR': 'Carolina Hurricanes',
  'CHI': 'Chicago Blackhawks', 'COL': 'Colorado Avalanche', 'CBJ': 'Columbus Blue Jackets',
  'DAL': 'Dallas Stars', 'DET': 'Detroit Red Wings', 'EDM': 'Edmonton Oilers',
  'FLA': 'Florida Panthers', 'LAK': 'Los Angeles Kings', 'MIN': 'Minnesota Wild',
  'MTL': 'Montréal Canadiens', 'NSH': 'Nashville Predators', 'NJD': 'New Jersey Devils',
  'NYI': 'New York Islanders', 'NYR': 'New York Rangers', 'OTT': 'Ottawa Senators',
  'PHI': 'Philadelphia Flyers', 'PIT': 'Pittsburgh Penguins', 'SJS': 'San Jose Sharks',
  'SEA': 'Seattle Kraken', 'STL': 'St. Louis Blues', 'TBL': 'Tampa Bay Lightning',
  'TOR': 'Toronto Maple Leafs', 'VAN': 'Vancouver Canucks', 'VGK': 'Vegas Golden Knights',
  'WSH': 'Washington Capitals', 'WPG': 'Winnipeg Jets',
};

const MLB_TEAM_MAP: Record<string, string> = {
  'ARI': 'Arizona Diamondbacks', 'ATL': 'Atlanta Braves', 'BAL': 'Baltimore Orioles',
  'BOS': 'Boston Red Sox', 'CHC': 'Chicago Cubs', 'CHW': 'Chicago White Sox',
  'CIN': 'Cincinnati Reds', 'CLE': 'Cleveland Guardians', 'COL': 'Colorado Rockies',
  'DET': 'Detroit Tigers', 'HOU': 'Houston Astros', 'KC': 'Kansas City Royals',
  'LAA': 'Los Angeles Angels', 'LAD': 'Los Angeles Dodgers', 'MIA': 'Miami Marlins',
  'MIL': 'Milwaukee Brewers', 'MIN': 'Minnesota Twins', 'NYM': 'New York Mets',
  'NYY': 'New York Yankees', 'OAK': 'Oakland Athletics', 'PHI': 'Philadelphia Phillies',
  'PIT': 'Pittsburgh Pirates', 'SD': 'San Diego Padres', 'SF': 'San Francisco Giants',
  'SEA': 'Seattle Mariners', 'STL': 'St. Louis Cardinals', 'TB': 'Tampa Bay Rays',
  'TEX': 'Texas Rangers', 'TOR': 'Toronto Blue Jays', 'WSH': 'Washington Nationals',
};

const normalizeTeamName = (team: string, sport: string): string => {
  if (!team) return team;
  if (team.includes(' ')) return team;
  if (sport === 'NBA') return NBA_TEAM_MAP[team.toUpperCase()] || team;
  if (sport === 'NHL') return NHL_TEAM_MAP[team.toUpperCase()] || team;
  if (sport === 'MLB') return MLB_TEAM_MAP[team.toUpperCase()] || team;
  return team;
};

// ==============================
// Types
// ==============================

export interface ParlayLeg {
  id: string;
  description: string;
  odds: string;
  confidence: number;
  sport: string;
  market: string;
  player_name?: string;
  stat_type?: string;
  line?: number;
  projection?: number;
  edge?: string;
  value_side?: string;
  teams?: { home: string; away: string };
  confidence_level: 'high' | 'medium' | 'low' | 'very-high' | 'very-low';
}

export interface ParlaySuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ParlayLeg[];
  total_odds: string;
  confidence: number;
  confidence_level: string;
  analysis: string;
  expected_value: string;
  risk_level: string;
  ai_metrics?: {
    leg_count: number;
    avg_leg_confidence: number;
    recommended_stake: string;
    edge?: number;
  };
  timestamp: string;
  isToday?: boolean;
  is_real_data?: boolean;
  is_simulated?: boolean;
  gameId?: string;
  home_team?: string;
  away_team?: string;
  generatedBy?: string;
}

interface Game {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  sport_title: string;
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

interface FilterOptions {
  minConfidence: number;
  maxRisk: string;
  minLegs: number;
  maxLegs: number;
  marketTypes: string[];
  showOnlyRealData: boolean;
  sortBy: 'confidence' | 'odds' | 'risk';
}

const RISK_LEVELS = [
  { id: 'all', name: 'All Risks', color: '#64748b' },
  { id: 'low', name: 'Low Risk', color: '#10b981' },
  { id: 'medium', name: 'Medium Risk', color: '#f59e0b' },
  { id: 'high', name: 'High Risk', color: '#ef4444' }
];

const MARKET_TYPES = [
  { id: 'player_props', name: 'Player Props', icon: '👤' },
  { id: 'totals', name: 'Game Totals', icon: '📊' },
  { id: 'moneyline', name: 'Moneyline', icon: '💰' },
  { id: 'mixed', name: 'Mixed', icon: '🔄' }
];

// ==============================
// API Functions
// ==============================

const getSportFromTab = (tab: number): string => {
  switch (tab) {
    case 0: return 'NBA';
    case 1: return 'NFL';
    case 2: return 'MLB';
    case 3: return 'NHL';
    default: return 'NBA';
  }
};

const fetchGames = async (sport: string): Promise<Game[]> => {
  try {
    if (sport === 'NBA') {
      return [
        { 
          id: 'nba-featured-game', 
          home_team: 'Golden State Warriors', 
          away_team: 'Brooklyn Nets', 
          commence_time: new Date().toISOString(), 
          sport_title: 'NBA' 
        }
      ];
    }
    if (sport === 'MLB') {
      return [
        { id: 'mlb-featured-game', home_team: 'New York Yankees', away_team: 'Boston Red Sox', commence_time: new Date().toISOString(), sport_title: 'MLB' }
      ];
    }
    if (sport === 'NHL') {
      return [
        { id: 'nhl-featured-game', home_team: 'Toronto Maple Leafs', away_team: 'Montreal Canadiens', commence_time: new Date().toISOString(), sport_title: 'NHL' }
      ];
    }
    return [];
  } catch (error) {
    console.warn(`Failed to fetch games for ${sport}`, error);
    return getMockGames(sport);
  }
};

const getMockGames = (sport: string): Game[] => {
  const mockData: Record<string, Game[]> = {
    NBA: [
      { id: 'mock-nba-1', home_team: 'Los Angeles Lakers', away_team: 'Golden State Warriors', commence_time: new Date().toISOString(), sport_title: 'NBA' },
    ],
    MLB: [
      { id: 'mock-mlb-1', home_team: 'New York Yankees', away_team: 'Boston Red Sox', commence_time: new Date().toISOString(), sport_title: 'MLB' },
    ],
    NHL: [
      { id: 'mock-nhl-1', home_team: 'Toronto Maple Leafs', away_team: 'Montreal Canadiens', commence_time: new Date().toISOString(), sport_title: 'NHL' },
    ],
  };
  return mockData[sport] || [];
};

const fetchPlayerProps = async (sport: string): Promise<PropMarket[]> => {
  try {
    if (sport === 'NBA') {
      const response = await axios.get(`${NODE_API_BASE}/api/prizepicks/selections`, {
        params: { sport: 'nba' },
        timeout: 10000,
      });
      const selections = response.data.selections || [];
      console.log(`📊 Received ${selections.length} NBA props from API`);
      
      if (selections.length === 0) {
        console.warn('No props returned, using mock data');
        return generateMockNBASelections();
      }
      
      return selections.slice(0, 30).map((s: any, index: number) => {
        const normalizedTeam = normalizeTeamName(s.team || '', 'NBA');
        return {
          id: s.id || `prop-${index}`,
          player: s.player,
          team: normalizedTeam,
          market: s.stat || 'points',
          line: s.line || 0,
          projection: s.projection || (s.line * 1.05) || 10,
          over_odds: typeof s.odds === 'string' ? parseInt(s.odds.replace('+', '')) : (s.odds || -110),
          under_odds: -110,
          confidence: s.confidence || 70 + Math.floor(Math.random() * 20),
          game_id: `nba-featured-game`,
          game_time: new Date().toISOString(),
          sport: 'NBA',
          position: s.position,
          edge: s.edge || (s.projection > s.line ? '+5.2%' : '-2.1%'),
        };
      });
    }
    
    if (sport === 'MLB' || sport === 'NHL') {
      return generateMockProps(sport);
    }
    
    return [];
  } catch (error) {
    console.warn(`Failed to fetch props for ${sport}`, error);
    return generateMockProps(sport);
  }
};

const generateMockNBASelections = (): PropMarket[] => {
  const mockNBAProps = [
    { player: 'Stephen Curry', team: 'Golden State Warriors', market: 'points', line: 28.5, projection: 31.2, confidence: 85, over_odds: -110 },
    { player: 'Stephen Curry', team: 'Golden State Warriors', market: 'assists', line: 6.5, projection: 7.1, confidence: 78, over_odds: -115 },
    { player: 'Stephen Curry', team: 'Golden State Warriors', market: 'threes', line: 4.5, projection: 5.2, confidence: 82, over_odds: -110 },
    { player: 'Kevin Durant', team: 'Brooklyn Nets', market: 'points', line: 27.5, projection: 29.8, confidence: 83, over_odds: -110 },
    { player: 'Kevin Durant', team: 'Brooklyn Nets', market: 'rebounds', line: 7.5, projection: 8.2, confidence: 75, over_odds: -115 },
    { player: 'Kevin Durant', team: 'Brooklyn Nets', market: 'assists', line: 5.5, projection: 6.0, confidence: 72, over_odds: -110 },
    { player: 'Klay Thompson', team: 'Golden State Warriors', market: 'points', line: 22.5, projection: 24.1, confidence: 76, over_odds: -110 },
    { player: 'Klay Thompson', team: 'Golden State Warriors', market: 'threes', line: 3.5, projection: 4.1, confidence: 74, over_odds: -115 },
    { player: 'Draymond Green', team: 'Golden State Warriors', market: 'assists', line: 7.5, projection: 8.3, confidence: 80, over_odds: -110 },
    { player: 'Draymond Green', team: 'Golden State Warriors', market: 'rebounds', line: 6.5, projection: 7.2, confidence: 77, over_odds: -115 },
  ];
  
  return mockNBAProps.map((prop, idx) => ({
    id: `mock-${idx}`,
    player: prop.player,
    team: prop.team,
    market: prop.market,
    line: prop.line,
    projection: prop.projection,
    over_odds: prop.over_odds,
    under_odds: -110,
    confidence: prop.confidence,
    game_id: 'nba-featured-game',
    game_time: new Date().toISOString(),
    sport: 'NBA',
    position: 'G/F',
    edge: `+${(((prop.projection - prop.line) / prop.line) * 100).toFixed(1)}%`,
  }));
};

const generateMockProps = (sport: string): PropMarket[] => {
  const mockPlayers: Record<string, Array<{ name: string; team: string; pos: string }>> = {
    NHL: [
      { name: 'Connor McDavid', team: 'Edmonton Oilers', pos: 'C' },
      { name: 'Auston Matthews', team: 'Toronto Maple Leafs', pos: 'C' },
      { name: 'Nathan MacKinnon', team: 'Colorado Avalanche', pos: 'C' },
    ],
    MLB: [
      { name: 'Aaron Judge', team: 'New York Yankees', pos: 'RF' },
      { name: 'Shohei Ohtani', team: 'Los Angeles Dodgers', pos: 'DH' },
      { name: 'Mookie Betts', team: 'Los Angeles Dodgers', pos: 'RF' },
    ],
  };
  const players = mockPlayers[sport] || mockPlayers.NHL;
  const markets = sport === 'NHL' ? ['goals', 'assists', 'points', 'shots'] : ['home_runs', 'strikeouts', 'rbi'];
  const props: PropMarket[] = [];
  players.forEach((player, idx) => {
    markets.forEach((market, mIdx) => {
      let line = market === 'shots' ? 2.5 : market === 'strikeouts' ? 5.5 : 0.5;
      const projection = line + Math.random() * 0.8;
      const edgeVal = ((projection - line) / line) * 100;
      props.push({
        id: `mock-${sport}-${idx}-${mIdx}`,
        player: player.name,
        team: player.team,
        market: market,
        line: line,
        projection: projection,
        over_odds: -Math.floor(100 + Math.random() * 30),
        under_odds: -Math.floor(100 + Math.random() * 30),
        confidence: 65 + Math.floor(Math.random() * 25),
        game_id: `${sport.toLowerCase()}-featured-game`,
        game_time: new Date().toISOString(),
        sport: sport,
        position: player.pos,
        edge: `+${edgeVal.toFixed(1)}%`,
      });
    });
  });
  return props;
};

// Helper functions
const americanToImpliedProb = (odds: number): number => {
  if (odds > 0) return 100 / (odds + 100);
  return -odds / (-odds + 100);
};

const getTeamBasedVariation = (team: string, base: number): number => {
  const sum = team.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const variation = (sum % 7) - 3;
  return Math.min(100, Math.max(0, base + variation));
};

const generateMoneylineOdds = (homeTeam: string, awayTeam: string): { home: number; away: number } => {
  const homeStrength = homeTeam.length % 10;
  const awayStrength = awayTeam.length % 10;
  const total = homeStrength + awayStrength;
  if (total === 0) return { home: -110, away: -110 };
  const homeProb = homeStrength / total;
  const awayProb = awayStrength / total;
  const homeOdds = homeProb >= 0.5
    ? Math.round(-100 / (homeProb / (1 - homeProb)))
    : Math.round((1 / homeProb - 1) * 100);
  const awayOdds = awayProb >= 0.5
    ? Math.round(-100 / (awayProb / (1 - awayProb)))
    : Math.round((1 / awayProb - 1) * 100);
  return { home: Math.max(-1000, Math.min(1000, homeOdds)), away: Math.max(-1000, Math.min(1000, awayOdds)) };
};

const getDefaultTotalLine = (sport: string): number => {
  switch (sport) {
    case 'NBA': return 220.5;
    case 'MLB': return 8.5;
    case 'NHL': return 5.5;
    default: return 50.5;
  }
};

// Generate all same-game parlays for a specific game
const generateAllGameParlays = (game: Game, props: PropMarket[], promptLabel?: string): ParlaySuggestion[] => {
  const suggestions: ParlaySuggestion[] = [];
  
  const gameProps = props.filter(p => {
    const normalizedPropTeam = normalizeTeamName(p.team, game.sport_title);
    const normalizedHomeTeam = normalizeTeamName(game.home_team, game.sport_title);
    const normalizedAwayTeam = normalizeTeamName(game.away_team, game.sport_title);
    return normalizedPropTeam === normalizedHomeTeam || normalizedPropTeam === normalizedAwayTeam;
  });

  // Player Props Parlay (market_type: 'player_props')
  if (gameProps.length >= 2) {
    const topProps = gameProps.sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 3);
    const legs: ParlayLeg[] = topProps.map((prop, idx) => ({
      id: `leg-${game.id}-props-${idx}`,
      description: `${prop.player} ${prop.market} Over ${prop.line}`,
      odds: prop.over_odds > 0 ? `+${prop.over_odds}` : prop.over_odds.toString(),
      confidence: prop.confidence,
      sport: prop.sport,
      market: 'player_props',
      player_name: prop.player,
      stat_type: prop.market,
      line: prop.line,
      projection: prop.projection,
      edge: prop.edge,
      value_side: 'over',
      confidence_level: prop.confidence > 80 ? 'very-high' : prop.confidence > 70 ? 'high' : 'medium',
      teams: { home: game.home_team, away: game.away_team },
    }));
    
    let decimal = 1.0;
    legs.forEach(leg => {
      const odds = parseInt(leg.odds.replace('+', ''));
      if (odds > 0) decimal *= 1 + odds / 100;
      else decimal *= 1 - 100 / Math.abs(odds);
    });
    const totalOdds = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();
    const avgConfidence = Math.round(legs.reduce((sum, l) => sum + l.confidence, 0) / legs.length);
    
    suggestions.push({
      id: `sgp-props-${game.id}-${Date.now()}`,
      name: `${game.away_team} @ ${game.home_team}`,
      sport: game.sport_title,
      type: 'same_game',
      market_type: 'player_props',
      legs,
      total_odds: totalOdds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : avgConfidence > 70 ? 'high' : 'medium',
      analysis: `${game.away_team} vs ${game.home_team} - Top player props parlay with ${legs.length} legs.`,
      expected_value: '+6.5%',
      risk_level: 'medium',
      ai_metrics: { leg_count: legs.length, avg_leg_confidence: avgConfidence, recommended_stake: '$5.00', edge: 0.065 },
      timestamp: new Date().toISOString(),
      isToday: true,
      is_real_data: props.length > 0,
      gameId: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      generatedBy: promptLabel,
    });
  }

  // Moneyline Parlay (market_type: 'moneyline')
  const mlOdds = generateMoneylineOdds(game.home_team, game.away_team);
  const homeProb = americanToImpliedProb(mlOdds.home);
  const homeConf = Math.round(homeProb * 100);
  const selectedMlLeg = {
    id: `leg-${game.id}-ml`,
    description: `${game.home_team} Moneyline`,
    odds: mlOdds.home > 0 ? `+${mlOdds.home}` : mlOdds.home.toString(),
    confidence: getTeamBasedVariation(game.home_team, homeConf),
    sport: game.sport_title,
    market: 'moneyline',
    value_side: 'home',
    confidence_level: homeConf > 70 ? 'high' : homeConf > 50 ? 'medium' : 'low',
    teams: { home: game.home_team, away: game.away_team },
  };
  
  let decimal = 1.0;
  const oddsNum = parseInt(selectedMlLeg.odds.replace('+', ''));
  if (oddsNum > 0) decimal *= 1 + oddsNum / 100;
  else decimal *= 1 - 100 / Math.abs(oddsNum);
  const totalOddsMl = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();
  
  suggestions.push({
    id: `sgp-ml-${game.id}-${Date.now()}`,
    name: `${game.away_team} @ ${game.home_team}`,
    sport: game.sport_title,
    type: 'same_game',
    market_type: 'moneyline',
    legs: [selectedMlLeg],
    total_odds: totalOddsMl,
    confidence: selectedMlLeg.confidence,
    confidence_level: selectedMlLeg.confidence > 70 ? 'high' : selectedMlLeg.confidence > 50 ? 'medium' : 'low',
    analysis: `${game.home_team} moneyline bet.`,
    expected_value: '+4.2%',
    risk_level: 'low',
    ai_metrics: { leg_count: 1, avg_leg_confidence: selectedMlLeg.confidence, recommended_stake: '$10.00', edge: 0.042 },
    timestamp: new Date().toISOString(),
    isToday: true,
    is_simulated: true,
    gameId: game.id,
    home_team: game.home_team,
    away_team: game.away_team,
    generatedBy: promptLabel,
  });

  // Totals Parlay (market_type: 'totals')
  const totalLine = getDefaultTotalLine(game.sport_title);
  const overOdds = -110;
  const baseTotalConf = Math.round(americanToImpliedProb(-110) * 100);
  const variedTotalConf = getTeamBasedVariation(game.home_team + game.away_team, baseTotalConf);
  const overLeg: ParlayLeg = {
    id: `leg-${game.id}-total-over`,
    description: `${game.away_team} @ ${game.home_team} Over ${totalLine}`,
    odds: overOdds.toString(),
    confidence: variedTotalConf,
    sport: game.sport_title,
    market: 'totals',
    line: totalLine,
    value_side: 'over',
    confidence_level: variedTotalConf > 70 ? 'high' : variedTotalConf > 50 ? 'medium' : 'low',
    teams: { home: game.home_team, away: game.away_team },
  };
  decimal = 1.0;
  const oddsNumTotal = parseInt(overLeg.odds);
  if (oddsNumTotal > 0) decimal *= 1 + oddsNumTotal / 100;
  else decimal *= 1 - 100 / Math.abs(oddsNumTotal);
  const totalOddsTotal = decimal >= 2.0 ? `+${Math.round((decimal - 1) * 100)}` : Math.round(-100 / (decimal - 1)).toString();
  
  suggestions.push({
    id: `sgp-total-${game.id}-${Date.now()}`,
    name: `${game.away_team} @ ${game.home_team}`,
    sport: game.sport_title,
    type: 'same_game',
    market_type: 'totals',
    legs: [overLeg],
    total_odds: totalOddsTotal,
    confidence: overLeg.confidence,
    confidence_level: overLeg.confidence > 70 ? 'high' : overLeg.confidence > 50 ? 'medium' : 'low',
    analysis: `Total over ${totalLine} points.`,
    expected_value: '+3.8%',
    risk_level: 'medium',
    ai_metrics: { leg_count: 1, avg_leg_confidence: overLeg.confidence, recommended_stake: '$10.00', edge: 0.038 },
    timestamp: new Date().toISOString(),
    isToday: true,
    is_simulated: true,
    gameId: game.id,
    home_team: game.home_team,
    away_team: game.away_team,
    generatedBy: promptLabel,
  });

  // Mixed Parlay (market_type: 'mixed')
  if (gameProps.length >= 1) {
    const topProp = gameProps.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const propLeg: ParlayLeg = {
      id: `leg-${game.id}-mixed-prop`,
      description: `${topProp.player} ${topProp.market} Over ${topProp.line}`,
      odds: topProp.over_odds > 0 ? `+${topProp.over_odds}` : topProp.over_odds.toString(),
      confidence: topProp.confidence,
      sport: topProp.sport,
      market: 'player_props',
      player_name: topProp.player,
      stat_type: topProp.market,
      line: topProp.line,
      projection: topProp.projection,
      edge: topProp.edge,
      value_side: 'over',
      confidence_level: topProp.confidence > 80 ? 'very-high' : topProp.confidence > 70 ? 'high' : 'medium',
      teams: { home: game.home_team, away: game.away_team },
    };
    
    const mixedOption1 = { leg: selectedMlLeg, type: 'Moneyline', combinedConf: Math.round((topProp.confidence + selectedMlLeg.confidence) / 2) };
    const mixedOption2 = { leg: overLeg, type: 'Total', combinedConf: Math.round((topProp.confidence + overLeg.confidence) / 2) };
    const bestMixed = mixedOption1.combinedConf >= mixedOption2.combinedConf ? mixedOption1 : mixedOption2;
    const legs = [propLeg, bestMixed.leg];
    
    let decimalMixed = 1.0;
    legs.forEach(leg => {
      const odds = parseInt(leg.odds.replace('+', ''));
      if (odds > 0) decimalMixed *= 1 + odds / 100;
      else decimalMixed *= 1 - 100 / Math.abs(odds);
    });
    const totalOddsMixed = decimalMixed >= 2.0 ? `+${Math.round((decimalMixed - 1) * 100)}` : Math.round(-100 / (decimalMixed - 1)).toString();
    
    suggestions.push({
      id: `sgp-mixed-${game.id}-${Date.now()}`,
      name: `${game.away_team} @ ${game.home_team}`,
      sport: game.sport_title,
      type: 'same_game',
      market_type: 'mixed',
      legs,
      total_odds: totalOddsMixed,
      confidence: bestMixed.combinedConf,
      confidence_level: bestMixed.combinedConf > 80 ? 'high' : bestMixed.combinedConf > 70 ? 'high' : 'medium',
      analysis: `Mixed parlay combining ${topProp.player} with ${bestMixed.type.toLowerCase()} from the same game.`,
      expected_value: '+5.9%',
      risk_level: 'medium',
      ai_metrics: { leg_count: 2, avg_leg_confidence: bestMixed.combinedConf, recommended_stake: '$5.00', edge: 0.059 },
      timestamp: new Date().toISOString(),
      isToday: true,
      is_real_data: props.length > 0,
      is_simulated: bestMixed.type === 'Moneyline' || bestMixed.type === 'Total',
      gameId: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      generatedBy: promptLabel,
    });
  }
  
  return suggestions;
};

// Get the best parlay for a game (highest confidence)
const getBestParlayForGame = (game: Game, props: PropMarket[]): ParlaySuggestion | null => {
  const gameParlays = generateAllGameParlays(game, props);
  if (gameParlays.length === 0) return null;
  return gameParlays.reduce((best, current) => current.confidence > best.confidence ? current : best);
};

// ==============================
// UI Components
// ==============================

const SportIcon: React.FC<{ sport: string }> = ({ sport }) => {
  switch (sport) {
    case 'NBA': return <BasketballIcon />;
    case 'MLB': return <BaseballIcon />;
    case 'NHL': return <HockeyIcon />;
    default: return <ParlayIcon />;
  }
};

const ParlayCard: React.FC<{ parlay: ParlaySuggestion; showGenerateButton?: boolean; onGenerate?: () => void }> = ({ parlay, showGenerateButton, onGenerate }) => {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32, mr: 1 }}>
              <SportIcon sport={parlay.sport} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight="bold" noWrap>{parlay.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {parlay.market_type.replace('_', ' ')} • {parlay.legs.length} legs
                {parlay.generatedBy && <Chip label={parlay.generatedBy} size="small" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />}
              </Typography>
            </Box>
          </Box>
          <Chip label={parlay.total_odds} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold', ml: 1 }} />
        </Box>
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {parlay.legs.slice(0, 3).map((leg, idx) => (
            <Box key={leg.id}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight="medium" noWrap sx={{ flex: 1, mr: 1 }}>{leg.description}</Typography>
                <Chip label={leg.odds} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </Box>
              <Box display="flex" alignItems="center" mt={0.5}>
                <LinearProgress variant="determinate" value={leg.confidence} sx={{ width: 60, height: 4, borderRadius: 2, mr: 1 }} />
                <Typography variant="caption" color="text.secondary">{leg.confidence}% conf</Typography>
                {leg.projection && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Proj: {leg.projection.toFixed(1)}</Typography>}
              </Box>
              {idx < parlay.legs.length - 1 && idx < 2 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
          {parlay.legs.length > 3 && <Typography variant="caption" color="text.secondary">+{parlay.legs.length - 3} more</Typography>}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{parlay.analysis}</Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip label={`EV: ${parlay.expected_value}`} size="small" variant="outlined" />
          <Chip label={`Risk: ${parlay.risk_level}`} size="small" variant="outlined" color={parlay.risk_level === 'low' ? 'success' : parlay.risk_level === 'medium' ? 'warning' : 'error'} />
          {parlay.is_real_data && <Chip label="LIVE" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />}
          {parlay.is_simulated && <Chip label="SIM" size="small" sx={{ bgcolor: '#f59e0b', color: 'white' }} />}
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
        <Button fullWidth variant="contained" size="small" startIcon={<AddIcon />} sx={{ borderRadius: 28 }}>Add to Slip</Button>
        {showGenerateButton && onGenerate && (
          <Button variant="outlined" size="small" startIcon={<AutoAwesomeIcon />} onClick={onGenerate} sx={{ borderRadius: 28 }}>
            Generate More
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// ==============================
// Main Component
// ==============================

const SameGameParlayContent: React.FC = () => {
  const theme = useTheme();
  const [sportTab, setSportTab] = useState(0);
  const [strategyTab, setStrategyTab] = useState(0);
  const [viewTab, setViewTab] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedParlays, setGeneratedParlays] = useState<ParlaySuggestion[]>([]);
  
  const currentSport = getSportFromTab(sportTab);
  
  const [filters, setFilters] = useState<FilterOptions>({
    minConfidence: 60,
    maxRisk: 'all',
    minLegs: 1,
    maxLegs: 5,
    marketTypes: ['player_props', 'totals', 'moneyline', 'mixed'],
    showOnlyRealData: false,
    sortBy: 'confidence',
  });

  const { data: games = [], isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ['games', currentSport],
    queryFn: () => fetchGames(currentSport),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: props = [], isLoading: propsLoading, refetch: refetchProps } = useQuery({
    queryKey: ['props', currentSport],
    queryFn: () => fetchPlayerProps(currentSport),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const currentFeaturedParlay = useMemo(() => {
    if (games.length === 0 || props.length === 0) return null;
    const featuredGame = games[0];
    if (!featuredGame) return null;
    return getBestParlayForGame(featuredGame, props);
  }, [games, props]);

  const filterParlays = useCallback((parlays: ParlaySuggestion[]): ParlaySuggestion[] => {
    return parlays.filter(parlay => {
      if (parlay.confidence < filters.minConfidence) return false;
      if (filters.maxRisk !== 'all') {
        const riskOrder = { 'low': 1, 'medium': 2, 'high': 3 };
        const maxRiskValue = riskOrder[filters.maxRisk as keyof typeof riskOrder];
        if (riskOrder[parlay.risk_level as keyof typeof riskOrder] > maxRiskValue) return false;
      }
      if (parlay.legs.length < filters.minLegs || parlay.legs.length > filters.maxLegs) return false;
      if (!filters.marketTypes.includes(parlay.market_type)) return false;
      if (filters.showOnlyRealData && !parlay.is_real_data) return false;
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'confidence': return b.confidence - a.confidence;
        case 'odds':
          const aOdds = parseInt(a.total_odds.replace('+', ''));
          const bOdds = parseInt(b.total_odds.replace('+', ''));
          return bOdds - aOdds;
        case 'risk':
          const riskOrder = { 'low': 1, 'medium': 2, 'high': 3 };
          return riskOrder[a.risk_level as keyof typeof riskOrder] - riskOrder[b.risk_level as keyof typeof riskOrder];
        default: return 0;
      }
    });
  }, [filters]);

  const filteredFeaturedParlay = useMemo(() => {
    if (!currentFeaturedParlay) return [];
    return filterParlays([currentFeaturedParlay]);
  }, [currentFeaturedParlay, filterParlays]);

  const filteredGeneratedParlays = useMemo(() => filterParlays(generatedParlays), [generatedParlays, filterParlays]);

const generateFromPrompt = useCallback(async (prompt: string, isCustom: boolean = false) => {
  setGenerating(true);
  
  const promptLower = prompt.toLowerCase();
  let targetSport = currentSport;
  
  if (promptLower.includes('nba') || promptLower.includes('basketball')) targetSport = 'NBA';
  else if (promptLower.includes('mlb') || promptLower.includes('baseball')) targetSport = 'MLB';
  else if (promptLower.includes('nhl') || promptLower.includes('hockey')) targetSport = 'NHL';
  
  // Determine market type based on prompt - IMPROVED DETECTION
  let targetMarket: string = 'player_props'; // Default to player props
  
  // Check for specific market keywords in order of specificity
  if (promptLower.includes('mixed') || promptLower.includes('combo') || 
      (promptLower.includes('moneyline') && promptLower.includes('total'))) {
    targetMarket = 'mixed';
  } else if (promptLower.includes('moneyline') || promptLower.includes('ml')) {
    targetMarket = 'moneyline';
  } else if (promptLower.includes('total') || promptLower.includes('over') || promptLower.includes('under')) {
    targetMarket = 'totals';
  } else if (promptLower.includes('player') || promptLower.includes('props') || 
             promptLower.includes('points') || promptLower.includes('assists') || 
             promptLower.includes('rebounds') || promptLower.includes('goals') ||
             promptLower.includes('scorer') || promptLower.includes('triple-double') ||
             promptLower.includes('strikeouts') || promptLower.includes('home run')) {
    targetMarket = 'player_props';
  }
  
  // Check if it's a preset prompt and override
  const promptInfo = QUICK_PROMPTS.find(p => p.query === prompt);
  if (promptInfo && promptInfo.market) {
    targetMarket = promptInfo.market;
    console.log(`🎯 Using preset market: ${targetMarket} for ${promptInfo.label}`);
  }
  
  console.log(`🎯 Generating for sport: ${targetSport}, market: ${targetMarket}, prompt: ${prompt}`);
  
  let sportGames: Game[] = [];
  let sportProps: PropMarket[] = [];
  
  if (targetSport === currentSport) {
    sportGames = games;
    sportProps = props;
  } else {
    try {
      const fetchedGames = await fetchGames(targetSport);
      sportGames = fetchedGames;
      const fetchedProps = await fetchPlayerProps(targetSport);
      sportProps = fetchedProps;
    } catch (error) {
      console.error(`Failed to fetch data for ${targetSport}:`, error);
      setSuccessMessage(`Failed to fetch data for ${targetSport}`);
      setShowSuccessAlert(true);
      setGenerating(false);
      return;
    }
  }
  
  if (sportGames.length === 0 || sportProps.length === 0) {
    setSuccessMessage(`No data available for ${targetSport}`);
    setShowSuccessAlert(true);
    setGenerating(false);
    return;
  }
  
  const newParlays: ParlaySuggestion[] = [];
  
  for (const game of sportGames) {
    console.log(`🎲 Generating parlays for game: ${game.home_team} vs ${game.away_team}`);
    
    // Generate ALL possible parlays for this game
    const allGameParlays = generateAllGameParlays(game, sportProps, isCustom ? 'Custom Prompt' : promptInfo?.label);
    console.log(`📊 Generated ${allGameParlays.length} total parlays, markets: ${allGameParlays.map(p => p.market_type).join(', ')}`);
    
    // Filter by the target market
    let filteredGameParlays: ParlaySuggestion[] = [];
    
    if (targetMarket === 'mixed') {
      filteredGameParlays = allGameParlays.filter(p => p.market_type === 'mixed');
      console.log(`🔍 Filtered to ${filteredGameParlays.length} mixed parlays`);
    } else if (targetMarket === 'player_props') {
      filteredGameParlays = allGameParlays.filter(p => p.market_type === 'player_props');
      console.log(`🔍 Filtered to ${filteredGameParlays.length} player props parlays`);
    } else if (targetMarket === 'moneyline') {
      filteredGameParlays = allGameParlays.filter(p => p.market_type === 'moneyline');
      console.log(`🔍 Filtered to ${filteredGameParlays.length} moneyline parlays`);
    } else if (targetMarket === 'totals') {
      filteredGameParlays = allGameParlays.filter(p => p.market_type === 'totals');
      console.log(`🔍 Filtered to ${filteredGameParlays.length} totals parlays`);
    }
    
    // If no matches found, use the first available parlay as fallback
    if (filteredGameParlays.length === 0 && allGameParlays.length > 0) {
      console.log(`⚠️ No ${targetMarket} parlays found, using first available: ${allGameParlays[0].market_type}`);
      filteredGameParlays = [allGameParlays[0]];
    }
    
    newParlays.push(...filteredGameParlays);
  }
  
  if (newParlays.length === 0) {
    setSuccessMessage(`No parlays found for ${targetSport} with market type: ${targetMarket}`);
    setShowSuccessAlert(true);
    setGenerating(false);
    return;
  }
  
  console.log(`✅ Adding ${newParlays.length} new parlays to generated list`);
  setGeneratedParlays(prev => [...prev, ...newParlays]);
  setSuccessMessage(`Generated ${newParlays.length} ${targetMarket} parlays for ${targetSport} from "${isCustom ? prompt.substring(0, 50) : promptInfo?.label}"`);
  setShowSuccessAlert(true);
  setViewTab(1);
  setGenerating(false);
  setSelectedPrompt('');
  setCustomPrompt('');
}, [games, props, currentSport]);

  const generateMoreForGame = useCallback(async (game: Game) => {
    setGenerating(true);
    const allGameParlays = generateAllGameParlays(game, props, 'Quick Generate');
    setGeneratedParlays(prev => [...prev, ...allGameParlays]);
    setSuccessMessage(`Generated ${allGameParlays.length} additional parlays for ${game.away_team} @ ${game.home_team}`);
    setShowSuccessAlert(true);
    setViewTab(1);
    setGenerating(false);
  }, [props]);

  const clearGenerated = useCallback(() => {
    setGeneratedParlays([]);
    setSuccessMessage('All generated parlays cleared');
    setShowSuccessAlert(true);
    setViewTab(0);
  }, []);

  const isLoading = propsLoading || gamesLoading;
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRefresh = () => {
    refetchGames();
    refetchProps();
  };

  const getCurrentParlays = (): ParlaySuggestion[] => {
    let parlays = viewTab === 0 ? filteredFeaturedParlay : filteredGeneratedParlays;
    if (strategyTab > 0) {
      const marketTypeMap: Record<number, string> = { 1: 'player_props', 2: 'totals', 3: 'moneyline', 4: 'mixed' };
      const targetMarket = marketTypeMap[strategyTab];
      if (targetMarket) parlays = parlays.filter(p => p.market_type === targetMarket);
    }
    return parlays;
  };

  const currentParlays = getCurrentParlays();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setShowSuccessAlert(false)}>
          <AlertTitle>Success!</AlertTitle>
          {successMessage}
        </Alert>
      )}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <ParlayIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">Same-Game Parlays</Typography>
          <Tooltip title="Combine multiple bets from the same game for higher payouts">
            <IconButton size="small" sx={{ ml: 1 }}><InfoIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Filter parlays"><IconButton onClick={() => setFiltersOpen(true)} color="primary"><FilterIcon /></IconButton></Tooltip>
          {generatedParlays.length > 0 && (
            <Tooltip title="Clear generated parlays"><IconButton onClick={clearGenerated} color="error"><ClearIcon /></IconButton></Tooltip>
          )}
          <Tooltip title="Refresh data"><IconButton onClick={handleRefresh} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* AI Generator Section */}
      <Paper sx={{ p: 2, mb: 4, bgcolor: alpha('#6C5CE7', 0.05), border: '1px solid', borderColor: '#6C5CE7' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          AI Same-Game Parlay Generator
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select a prompt or enter your own to instantly generate same-game parlays. Results will appear in the "Generated" tab.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="medium">
              <InputLabel>Choose a preset prompt</InputLabel>
              <Select value={selectedPrompt} onChange={(e) => setSelectedPrompt(e.target.value)} label="Choose a preset prompt">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <MenuItem key={idx} value={prompt.query}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{prompt.label}</span>
                      <Chip label={prompt.sport} size="small" sx={{ bgcolor: prompt.sport === 'NBA' ? '#ef4444' : prompt.sport === 'MLB' ? '#10b981' : '#1e40af', color: 'white', fontSize: '0.6rem', height: 20 }} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />} 
              onClick={() => selectedPrompt && generateFromPrompt(selectedPrompt)} 
              disabled={!selectedPrompt || generating} 
              sx={{ bgcolor: '#6C5CE7', mt: 1, width: '100%' }}
            >
              {generating ? 'Generating...' : 'Generate from Preset'}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Or enter your own prompt... e.g., 'Lakers vs Warriors player props parlay', 'NHL goals and assists same game', 'MLB home run and strikeout parlay'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              variant="outlined"
            />
            <Button 
              variant="outlined" 
              startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />} 
              onClick={() => customPrompt.trim() && generateFromPrompt(customPrompt, true)} 
              disabled={!customPrompt.trim() || generating} 
              sx={{ mt: 1, width: '100%', borderColor: '#6C5CE7', color: '#6C5CE7' }}
            >
              {generating ? 'Generating...' : 'Generate from Custom Prompt'}
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          ✨ 15 curated prompts + custom prompt support. Each generation creates up to 4 parlays (Player Props, Moneyline, Totals, Mixed).
        </Typography>
      </Paper>

      {/* View Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} variant="fullWidth">
          <Tab icon={<StarIcon />} label={`Featured Parlay (${filteredFeaturedParlay.length})`} iconPosition="start" />
          <Tab icon={<AutoAwesomeIcon />} label={`Generated Parlays (${filteredGeneratedParlays.length})`} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Sport Selection Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={sportTab} onChange={(_, v) => setSportTab(v)} variant="scrollable">
          <Tab icon={<BasketballIcon />} label="NBA" iconPosition="start" />
          <Tab icon={<FootballIcon />} label="NFL" iconPosition="start" disabled />
          <Tab icon={<BaseballIcon />} label="MLB" iconPosition="start" />
          <Tab icon={<HockeyIcon />} label="NHL" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Strategy Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={strategyTab} onChange={(_, v) => setStrategyTab(v)}>
          <Tab label="All" /><Tab label="Player Props" /><Tab label="Game Totals" /><Tab label="Moneyline" /><Tab label="Mixed" />
        </Tabs>
      </Box>

      {/* Stats Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body2" color="text.secondary">
          Showing {currentParlays.length} parlays • {viewTab === 0 ? '1 featured parlay' : `${generatedParlays.length} total generated`}
        </Typography>
        {viewTab === 0 && filteredFeaturedParlay.length > 0 && (
          <Chip icon={<LockIcon />} label="One featured parlay" size="small" variant="outlined" sx={{ bgcolor: alpha('#f59e0b', 0.1) }} />
        )}
        {viewTab === 1 && generatedParlays.length > 0 && (
          <Chip label={`${generatedParlays.length} generated`} size="small" variant="outlined" sx={{ bgcolor: alpha('#6C5CE7', 0.1) }} />
        )}
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /><Typography sx={{ ml: 2 }}>Loading {currentSport} data...</Typography></Box>
      ) : currentParlays.length === 0 ? (
        <Alert severity="info">
          <AlertTitle>No {viewTab === 0 ? 'Featured' : 'Generated'} Parlays Available</AlertTitle>
          {viewTab === 0 ? (
            <Box>
              <Typography>No featured parlay available for {currentSport}.</Typography>
              <Box mt={2}>
                <Typography variant="body2">💡 Tip: Use the AI Generator above to create parlays!</Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography>No generated parlays yet.</Typography>
              <Box mt={2}>
                <Typography variant="body2">💡 Tip: Select a prompt from the AI Generator above or enter your own custom prompt to create same-game parlays!</Typography>
              </Box>
            </Box>
          )}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {currentParlays.map(parlay => (
            <Grid item xs={12} md={6} lg={4} key={parlay.id}>
              <ParlayCard 
                parlay={parlay} 
                showGenerateButton={viewTab === 0}
                onGenerate={() => {
                  const game = games.find(g => g.id === parlay.gameId);
                  if (game) generateMoreForGame(game);
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filter Dialog */}
      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle><Box display="flex" alignItems="center" gap={1}><FilterIcon /><Typography variant="h6">Filter Parlays</Typography></Box></DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Minimum Confidence: {filters.minConfidence}%</Typography>
            <Slider value={filters.minConfidence} onChange={(_, v) => setFilters({ ...filters, minConfidence: v as number })} min={0} max={100} step={5} marks={[{value:0, label:'0%'}, {value:50, label:'50%'}, {value:100, label:'100%'}]} valueLabelDisplay="auto" />
            <Typography gutterBottom sx={{ mt: 2 }}>Maximum Risk Level</Typography>
            <FormControl fullWidth size="small"><Select value={filters.maxRisk} onChange={(e) => setFilters({ ...filters, maxRisk: e.target.value })}>{RISK_LEVELS.map(risk => (<MenuItem key={risk.id} value={risk.id}><Box display="flex" alignItems="center" gap={1}><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: risk.color }} />{risk.name}</Box></MenuItem>))}</Select></FormControl>
            <Typography gutterBottom sx={{ mt: 2 }}>Leg Count Range</Typography>
            <Box display="flex" gap={2}>
              <FormControl fullWidth size="small"><InputLabel>Min Legs</InputLabel><Select value={filters.minLegs} onChange={(e) => setFilters({ ...filters, minLegs: e.target.value as number })} label="Min Legs">{[1,2,3,4,5].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</Select></FormControl>
              <FormControl fullWidth size="small"><InputLabel>Max Legs</InputLabel><Select value={filters.maxLegs} onChange={(e) => setFilters({ ...filters, maxLegs: e.target.value as number })} label="Max Legs">{[1,2,3,4,5,6,7,8].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}</Select></FormControl>
            </Box>
            <Typography gutterBottom sx={{ mt: 2 }}>Market Types</Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>{MARKET_TYPES.map(market => (<Chip key={market.id} label={market.name} icon={<span>{market.icon}</span>} onClick={() => { const newTypes = filters.marketTypes.includes(market.id) ? filters.marketTypes.filter(t => t !== market.id) : [...filters.marketTypes, market.id]; setFilters({ ...filters, marketTypes: newTypes }); }} color={filters.marketTypes.includes(market.id) ? "primary" : "default"} variant={filters.marketTypes.includes(market.id) ? "filled" : "outlined"} />))}</Box>
            <FormControlLabel control={<Switch checked={filters.showOnlyRealData} onChange={(e) => setFilters({ ...filters, showOnlyRealData: e.target.checked })} />} label="Show only real data (no simulated)" sx={{ mt: 2 }} />
            <Typography gutterBottom sx={{ mt: 2 }}>Sort By</Typography>
            <FormControl fullWidth size="small"><Select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}><MenuItem value="confidence">Confidence (Highest first)</MenuItem><MenuItem value="odds">Odds (Highest first)</MenuItem><MenuItem value="risk">Risk (Lowest first)</MenuItem></Select></FormControl>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setFiltersOpen(false)}>Cancel</Button><Button variant="contained" onClick={() => { setFiltersOpen(false); setSuccessMessage('Filters applied'); setShowSuccessAlert(true); }}>Apply Filters</Button></DialogActions>
      </Dialog>

      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * Each sport shows ONE featured parlay. Generate additional parlays using the AI generator above with preset prompts or custom text.
        Each generation creates up to 4 parlays. Click "Generate More" on the featured parlay to see all options for that game.
      </Typography>
    </Container>
  );
};

const SameGameParlayScreen: React.FC = () => {
  return <SameGameParlayContent />;
};

export default SameGameParlayScreen;
