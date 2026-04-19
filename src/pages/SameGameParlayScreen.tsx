// pages/SameGameComboScreen.tsx - Fixed with Real API Integration

import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
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
  Casino as ComboIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  AutoAwesome as AutoAwesomeIcon,
  Clear as ClearIcon,
  Lock as LockIcon,
  Star as StarIcon,
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useCheckout } from '../utils/checkout';
import { useNavigate } from 'react-router-dom';

// ==============================
// Configuration & Types
// ==============================

const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';
const API_TIMEOUT = 30000;

// ==============================
// Constants
// ==============================
const MAX_VISIBLE_CARDS = 4;
const GENERATOR_RESULTS_COUNT = 3;

// ==============================
// 15 QUICK PROMPTS FOR GENERATOR
// ==============================

const QUICK_PROMPTS = [
  { label: '🏀 NBA High Confidence Combo', query: 'nba high confidence same game parlay', sport: 'NBA', market: 'player_props' },
  { label: '📊 NBA Points + Assists', query: 'nba points and assists same game', sport: 'NBA', market: 'player_props' },
  { label: '💪 NBA Triple-Double Threats', query: 'nba triple double same game', sport: 'NBA', market: 'player_props' },
  { label: '🎯 NBA Top Scorer Props', query: 'nba top scorer same game', sport: 'NBA', market: 'player_props' },
  { label: '💰 NBA Match Winner + Total', query: 'nba moneyline and total same game', sport: 'NBA', market: 'mixed' },
  { label: '⚾ MLB Home Run Combo', query: 'mlb home run same game', sport: 'MLB', market: 'player_props' },
  { label: '🥎 MLB Strikeout Props', query: 'mlb strikeouts same game', sport: 'MLB', market: 'player_props' },
  { label: '🔥 MLB Hits + RBI', query: 'mlb hits and rbi same game', sport: 'MLB', market: 'player_props' },
  { label: '🧢 MLB Pitcher Props', query: 'mlb pitcher props same game', sport: 'MLB', market: 'player_props' },
  { label: '📈 MLB Total + Match Winner', query: 'mlb total and moneyline same game', sport: 'MLB', market: 'mixed' },
  { label: '🏒 NHL Goal Scorer Props', query: 'nhl goal scorer same game', sport: 'NHL', market: 'player_props' },
  { label: '🥅 NHL Goalie Saves', query: 'nhl goalie saves same game', sport: 'NHL', market: 'player_props' },
  { label: '📊 NHL Points + Assists', query: 'nhl points and assists same game', sport: 'NHL', market: 'player_props' },
  { label: '💥 NHL Hits + Shots', query: 'nhl hits and shots same game', sport: 'NHL', market: 'player_props' },
  { label: '🔥 NHL Match Winner + Total', query: 'nhl moneyline and total same game', sport: 'NHL', market: 'mixed' },
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

export interface ComboLeg {
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

export interface ComboSuggestion {
  id: string;
  name: string;
  sport: string;
  type: string;
  market_type: string;
  legs: ComboLeg[];
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
  { id: 'all', name: 'All Volatility', color: '#64748b' },
  { id: 'low', name: 'Low Volatility', color: '#10b981' },
  { id: 'medium', name: 'Medium Volatility', color: '#f59e0b' },
  { id: 'high', name: 'High Volatility', color: '#ef4444' }
];

const MARKET_TYPES = [
  { id: 'player_props', name: 'Player Props', icon: '👤' },
  { id: 'totals', name: 'Game Totals', icon: '📊' },
  { id: 'moneyline', name: 'Match Winner', icon: '💰' },
  { id: 'mixed', name: 'Mixed', icon: '🔄' }
];

// ==============================
// Helper: Unique ID Generator
// ==============================
const generateUniqueId = (prefix: string, gameId: string): string => {
  return `${prefix}-${gameId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

// ==============================
// API Functions with Real Data
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

// Updated fetchGames with real API integration
const fetchGames = async (sport: string): Promise<Game[]> => {
  // Your API keys from environment variables
  const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
  const BALLLONTLIE_KEY = import.meta.env.VITE_BALLLONTLIE_KEY || '';
  const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY || '';
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Strategy 1: Use BallDontLie API for NBA (best for NBA data)
    if (sport === 'NBA' && BALLLONTLIE_KEY) {
      try {
        const response = await axios.get('https://api.balldontlie.io/v1/games', {
          params: {
            dates: [today],
            per_page: 25
          },
          headers: {
            'Authorization': BALLLONTLIE_KEY
          },
          timeout: 10000
        });
        
        if (response.data && response.data.data && response.data.data.length > 0) {
          console.log(`🏀 Retrieved ${response.data.data.length} real NBA games from BallDontLie`);
          return response.data.data.map((game: any) => ({
            id: game.id.toString(),
            home_team: game.home_team.full_name,
            away_team: game.visitor_team.full_name,
            commence_time: game.date,
            sport_title: 'NBA'
          }));
        }
      } catch (ballError) {
        console.warn('BallDontLie API failed:', ballError);
      }
    }
    
    // Strategy 2: Use The Odds API for all sports
    const sportMap: Record<string, string> = {
      'NBA': 'basketball_nba',
      'NFL': 'americanfootball_nfl',
      'MLB': 'baseball_mlb',
      'NHL': 'icehockey_nhl'
    };
    
    if (ODDS_API_KEY) {
      try {
        const oddsResponse = await axios.get(`https://api.the-odds-api.com/v4/sports/${sportMap[sport]}/events`, {
          params: {
            apiKey: ODDS_API_KEY,
            dateFormat: 'iso'
          },
          timeout: 10000
        });
        
        if (oddsResponse.data && oddsResponse.data.length > 0) {
          console.log(`🏀 Retrieved ${oddsResponse.data.length} real ${sport} games from Odds API`);
          return oddsResponse.data.map((event: any) => ({
            id: event.id,
            home_team: event.home_team,
            away_team: event.away_team,
            commence_time: event.commence_time,
            sport_title: sport
          }));
        }
      } catch (oddsError) {
        console.warn('Odds API failed:', oddsError);
      }
    }
    
    // Strategy 3: Use RapidAPI as fallback
    if (RAPIDAPI_KEY) {
      try {
        const rapidResponse = await axios.get(`https://odds.p.rapidapi.com/v4/sports/${sportMap[sport]}/events`, {
          params: {
            date: today
          },
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': 'odds.p.rapidapi.com'
          },
          timeout: 10000
        });
        
        if (rapidResponse.data && rapidResponse.data.length > 0) {
          console.log(`🏀 Retrieved ${rapidResponse.data.length} real ${sport} games from RapidAPI`);
          return rapidResponse.data.map((event: any) => ({
            id: event.id,
            home_team: event.home_team,
            away_team: event.away_team,
            commence_time: event.commence_time,
            sport_title: sport
          }));
        }
      } catch (rapidError) {
        console.warn('RapidAPI failed:', rapidError);
      }
    }
    
    throw new Error('No games found from any API');
    
  } catch (error) {
    console.error(`Failed to fetch games for ${sport} from all APIs:`, error);
    
    // Strategy 4: Extract games from PrizePicks props as final fallback
    try {
      const ppResponse = await axios.get(`${NODE_API_BASE}/api/prizepicks/selections`, {
        params: { sport: sport.toLowerCase() },
        timeout: 8000
      });
      
      const selections = ppResponse.data.selections || [];
      const gameMap = new Map();
      
      selections.forEach((selection: any) => {
        if (selection.game_id && !gameMap.has(selection.game_id)) {
          gameMap.set(selection.game_id, {
            id: selection.game_id,
            home_team: selection.home_team || `${selection.team} Home`,
            away_team: selection.away_team || `${selection.team} Away`,
            commence_time: selection.start_time || new Date().toISOString(),
            sport_title: sport
          });
        }
      });
      
      if (gameMap.size > 0) {
        console.log(`🏀 Extracted ${gameMap.size} games from PrizePicks data`);
        return Array.from(gameMap.values());
      }
    } catch (ppError) {
      console.warn('PrizePicks fallback also failed', ppError);
    }
    
    // Last resort: Return empty array
    return [];
  }
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
        const playerName = s.player || s.player_name || s.name || 'Unknown';
        const statType = s.stat || s.stat_type || s.market || 'points';
        const lineValue = s.line || s.projection_line || 0;
        const projectionVal = s.projection || (lineValue * 1.05) || 10;
        const oddsVal = s.over_odds || s.odds || -110;
        
        let formattedStat = String(statType).toLowerCase();
        if (formattedStat === 'pts' || formattedStat === 'points') formattedStat = 'Points';
        else if (formattedStat === 'reb' || formattedStat === 'rebounds') formattedStat = 'Rebounds';
        else if (formattedStat === 'ast' || formattedStat === 'assists') formattedStat = 'Assists';
        else if (formattedStat === 'stl' || formattedStat === 'steals') formattedStat = 'Steals';
        else if (formattedStat === 'blk' || formattedStat === 'blocks') formattedStat = 'Blocks';
        else if (formattedStat === 'threes' || formattedStat === '3pm') formattedStat = '3PM';
        
        return {
          id: s.id || `prop-${index}`,
          player: playerName,
          team: normalizedTeam,
          market: formattedStat,
          line: lineValue,
          projection: projectionVal,
          over_odds: typeof oddsVal === 'string' ? parseInt(oddsVal.replace('+', '')) : oddsVal,
          under_odds: -110,
          confidence: s.confidence || 70 + Math.floor(Math.random() * 20),
          game_id: s.game_id || `nba-featured-game`,
          game_time: s.start_time || new Date().toISOString(),
          sport: 'NBA',
          position: s.position,
          edge: s.edge || (projectionVal > lineValue ? '+5.2%' : '-2.1%'),
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
  // Dynamic mock based on current date
  const today = new Date();
  const isApril15 = today.getMonth() === 3 && today.getDate() === 15;
  
  let mockNBAProps;
  
  if (isApril15) {
    // April 15, 2025 matchups
    mockNBAProps = [
      { player: 'Stephen Curry', team: 'Golden State Warriors', market: 'points', line: 28.5, projection: 31.2, confidence: 85, over_odds: -110 },
      { player: 'Stephen Curry', team: 'Golden State Warriors', market: 'assists', line: 6.5, projection: 7.1, confidence: 78, over_odds: -115 },
      { player: 'Stephen Curry', team: 'Golden State Warriors', market: 'threes', line: 4.5, projection: 5.2, confidence: 82, over_odds: -110 },
      { player: 'James Harden', team: 'LA Clippers', market: 'points', line: 22.5, projection: 24.1, confidence: 76, over_odds: -110 },
      { player: 'James Harden', team: 'LA Clippers', market: 'assists', line: 8.5, projection: 9.2, confidence: 80, over_odds: -115 },
      { player: 'Kawhi Leonard', team: 'LA Clippers', market: 'points', line: 24.5, projection: 26.8, confidence: 79, over_odds: -110 },
      { player: 'LeBron James', team: 'Los Angeles Lakers', market: 'points', line: 25.5, projection: 27.3, confidence: 81, over_odds: -110 },
      { player: 'LeBron James', team: 'Los Angeles Lakers', market: 'assists', line: 7.5, projection: 8.4, confidence: 77, over_odds: -115 },
      { player: 'Kevin Durant', team: 'Phoenix Suns', market: 'points', line: 27.5, projection: 29.8, confidence: 83, over_odds: -110 },
    ];
  } else {
    // Generic mock for other days
    mockNBAProps = [
      { player: 'Stephen Curry', team: 'Golden State Warriors', market: 'points', line: 28.5, projection: 31.2, confidence: 85, over_odds: -110 },
      { player: 'LeBron James', team: 'Los Angeles Lakers', market: 'points', line: 25.5, projection: 27.3, confidence: 81, over_odds: -110 },
      { player: 'Kevin Durant', team: 'Phoenix Suns', market: 'points', line: 27.5, projection: 29.8, confidence: 83, over_odds: -110 },
      { player: 'Giannis Antetokounmpo', team: 'Milwaukee Bucks', market: 'points', line: 30.5, projection: 32.1, confidence: 86, over_odds: -110 },
      { player: 'Luka Doncic', team: 'Dallas Mavericks', market: 'points', line: 29.5, projection: 31.4, confidence: 84, over_odds: -110 },
    ];
  }
  
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
    game_id: `nba-game-${today.toISOString().split('T')[0]}`,
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
      
      let formattedMarket = market;
      if (market === 'home_runs') formattedMarket = 'Home Runs';
      else if (market === 'strikeouts') formattedMarket = 'Strikeouts';
      else if (market === 'goals') formattedMarket = 'Goals';
      else if (market === 'assists') formattedMarket = 'Assists';
      else if (market === 'points') formattedMarket = 'Points';
      else if (market === 'shots') formattedMarket = 'Shots';
      
      props.push({
        id: `mock-${sport}-${idx}-${mIdx}`,
        player: player.name,
        team: player.team,
        market: formattedMarket,
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

const americanToImpliedProb = (odds: number): number => {
  if (odds > 0) return 100 / (odds + 100);
  return -odds / (-odds + 100);
};

const getTeamBasedVariation = (team: string, base: number): number => {
  const sum = team.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const variation = (sum % 7) - 3;
  return Math.min(100, Math.max(0, base + variation));
};

const generateMatchWinnerOdds = (homeTeam: string, awayTeam: string): { home: number; away: number } => {
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

// Generate all same-game combos for a specific game
const generateAllGameCombos = (game: Game, props: PropMarket[], promptLabel?: string): ComboSuggestion[] => {
  const suggestions: ComboSuggestion[] = [];
  
  const gameProps = props.filter(p => {
    const normalizedPropTeam = normalizeTeamName(p.team, game.sport_title);
    const normalizedHomeTeam = normalizeTeamName(game.home_team, game.sport_title);
    const normalizedAwayTeam = normalizeTeamName(game.away_team, game.sport_title);
    return normalizedPropTeam === normalizedHomeTeam || normalizedPropTeam === normalizedAwayTeam;
  });

  // Player Props Combo
  if (gameProps.length >= 2) {
    const topProps = gameProps.sort((a, b) => (b.confidence || 0) - (a.confidence || 0)).slice(0, 3);
    const legs: ComboLeg[] = topProps.map((prop, idx) => ({
      id: `leg-${game.id}-props-${idx}-${Math.random().toString(36).substring(2, 5)}`,
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
      id: generateUniqueId('sgp-props', game.id),
      name: `${game.away_team} @ ${game.home_team}`,
      sport: game.sport_title,
      type: 'same_game',
      market_type: 'player_props',
      legs,
      total_odds: totalOdds,
      confidence: avgConfidence,
      confidence_level: avgConfidence > 80 ? 'high' : avgConfidence > 70 ? 'high' : 'medium',
      analysis: `${game.away_team} vs ${game.home_team} - Top player props combo with ${legs.length} legs.`,
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

  // Match Winner Combo
  const mlOdds = generateMatchWinnerOdds(game.home_team, game.away_team);
  const homeProb = americanToImpliedProb(mlOdds.home);
  const homeConf = Math.round(homeProb * 100);
  const selectedMlLeg = {
    id: `leg-${game.id}-ml-${Math.random().toString(36).substring(2, 5)}`,
    description: `${game.home_team} Match Winner`,
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
    id: generateUniqueId('sgp-ml', game.id),
    name: `${game.away_team} @ ${game.home_team}`,
    sport: game.sport_title,
    type: 'same_game',
    market_type: 'moneyline',
    legs: [selectedMlLeg],
    total_odds: totalOddsMl,
    confidence: selectedMlLeg.confidence,
    confidence_level: selectedMlLeg.confidence > 70 ? 'high' : selectedMlLeg.confidence > 50 ? 'medium' : 'low',
    analysis: `${game.home_team} match winner.`,
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

  // Totals Combo
  const totalLine = getDefaultTotalLine(game.sport_title);
  const overOdds = -110;
  const baseTotalConf = Math.round(americanToImpliedProb(-110) * 100);
  const variedTotalConf = getTeamBasedVariation(game.home_team + game.away_team, baseTotalConf);
  const overLeg: ComboLeg = {
    id: `leg-${game.id}-total-over-${Math.random().toString(36).substring(2, 5)}`,
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
    id: generateUniqueId('sgp-total', game.id),
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

  // Mixed Combo
  if (gameProps.length >= 1) {
    const topProp = gameProps.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const propLeg: ComboLeg = {
      id: `leg-${game.id}-mixed-prop-${Math.random().toString(36).substring(2, 5)}`,
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
    
    const mixedOption1 = { leg: selectedMlLeg, type: 'Match Winner', combinedConf: Math.round((topProp.confidence + selectedMlLeg.confidence) / 2) };
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
      id: generateUniqueId('sgp-mixed', game.id),
      name: `${game.away_team} @ ${game.home_team}`,
      sport: game.sport_title,
      type: 'same_game',
      market_type: 'mixed',
      legs,
      total_odds: totalOddsMixed,
      confidence: bestMixed.combinedConf,
      confidence_level: bestMixed.combinedConf > 80 ? 'high' : bestMixed.combinedConf > 70 ? 'high' : 'medium',
      analysis: `Mixed combo combining ${topProp.player} with ${bestMixed.type.toLowerCase()} from the same game.`,
      expected_value: '+5.9%',
      risk_level: 'medium',
      ai_metrics: { leg_count: 2, avg_leg_confidence: bestMixed.combinedConf, recommended_stake: '$5.00', edge: 0.059 },
      timestamp: new Date().toISOString(),
      isToday: true,
      is_real_data: props.length > 0,
      is_simulated: bestMixed.type === 'Match Winner' || bestMixed.type === 'Total',
      gameId: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      generatedBy: promptLabel,
    });
  }
  
  return suggestions;
};

// Get the best combo for a sport
const getBestComboForSport = async (sport: string): Promise<ComboSuggestion | null> => {
  const games = await fetchGames(sport);
  const props = await fetchPlayerProps(sport);
  if (games.length === 0 || props.length === 0) return null;
  let bestCombo: ComboSuggestion | null = null;
  for (const game of games) {
    const gameCombos = generateAllGameCombos(game, props);
    if (gameCombos.length > 0) {
      const bestGameCombo = gameCombos.reduce((best, current) => current.confidence > best.confidence ? current : best);
      if (!bestCombo || bestGameCombo.confidence > bestCombo.confidence) {
        bestCombo = bestGameCombo;
      }
    }
  }
  return bestCombo;
};

// ==============================
// UI Components (optimized with React.memo)
// ==============================

const SportIcon: React.FC<{ sport: string }> = ({ sport }) => {
  switch (sport) {
    case 'NBA': return <BasketballIcon />;
    case 'MLB': return <BaseballIcon />;
    case 'NHL': return <HockeyIcon />;
    default: return <ComboIcon />;
  }
};

// Memoized ComboCard to prevent unnecessary re-renders
const ComboCard = memo<{ parlay: ComboSuggestion; showGenerateButton?: boolean; onGenerate?: () => void }>(
  ({ parlay, showGenerateButton, onGenerate }) => {
    const theme = useTheme();
    
    // Map market_type for display
    const getMarketDisplay = (marketType: string): string => {
      switch (marketType) {
        case 'moneyline': return 'Match Winner';
        case 'player_props': return 'Player Props';
        case 'totals': return 'Totals';
        case 'mixed': return 'Mixed';
        default: return marketType.replace('_', ' ');
      }
    };
    
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
                  {getMarketDisplay(parlay.market_type)} • {parlay.legs.length} legs
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
            <Chip label={`Expected Value: ${parlay.expected_value}`} size="small" variant="outlined" />
            <Chip label={`Volatility: ${parlay.risk_level}`} size="small" variant="outlined" color={parlay.risk_level === 'low' ? 'success' : parlay.risk_level === 'medium' ? 'warning' : 'error'} />
            {parlay.is_real_data && <Chip label="LIVE" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />}
            {parlay.is_simulated && <Chip label="SIM" size="small" sx={{ bgcolor: '#f59e0b', color: 'white' }} />}
          </Box>
        </CardContent>
        <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button fullWidth variant="contained" size="small" startIcon={<AddIcon />} sx={{ borderRadius: 28 }}>Add to Tracker</Button>
          {showGenerateButton && onGenerate && (
            <Button variant="outlined" size="small" startIcon={<AutoAwesomeIcon />} onClick={onGenerate} sx={{ borderRadius: 28 }}>
              Generate More
            </Button>
          )}
        </CardActions>
      </Card>
    );
  }
);

// ==============================
// Main Component
// ==============================

const SameGameComboContent: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, token, profile, planFeatures } = useAuth();
  const { handleSubscriptionCheckout, handleCreditsCheckout } = useCheckout();

  // ========== CREDITS STATE ==========
  const [generatorCredits, setGeneratorCredits] = useState(0);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [selectedInterval, setSelectedInterval] = useState<string>('month');
  
  // Fixed refreshCredits function
  const refreshCredits = useCallback(async () => {
    const userId = user?.uid || user?.id;
    
    if (!userId) {
      console.log('❌ No user ID available, cannot fetch credits');
      return;
    }
    
    console.log(`🔄 Fetching credits for user: ${userId}`);
    
    try {
      const response = await fetch(`${PYTHON_API_BASE}/api/user/generations/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log(`📡 Credits API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`💰 Credits from API:`, data);
        console.log(`💰 Remaining credits: ${data.remaining}`);
        setGeneratorCredits(data.remaining);
      } else {
        console.error('❌ Failed to fetch credits:', response.status, await response.text());
        setGeneratorCredits(profile?.credits ?? 0);
      }
    } catch (error) {
      console.error('❌ Error fetching credits:', error);
      setGeneratorCredits(profile?.credits ?? 0);
    }
  }, [user, token, profile?.credits]);

  // Fetch credits on mount and when user changes
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);
  
  // Also refresh when window gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Tab became visible, refreshing credits...');
        refreshCredits();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshCredits]);

  // ========== OTHER STATE ==========
  const [sportTab, setSportTab] = useState(0);
  const [strategyTab, setStrategyTab] = useState(0);
  const [viewTab, setViewTab] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedCombos, setGeneratedCombos] = useState<ComboSuggestion[]>([]);
  
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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: props = [], isLoading: propsLoading, refetch: refetchProps } = useQuery({
    queryKey: ['props', currentSport],
    queryFn: () => fetchPlayerProps(currentSport),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  // Debug games
  useEffect(() => {
    if (games.length > 0) {
      console.log(`🎮 Current ${currentSport} games:`, games.map(g => `${g.away_team} @ ${g.home_team}`));
    } else {
      console.warn(`⚠️ No ${currentSport} games found, check API keys`);
    }
  }, [games, currentSport]);

  // Featured picks across sports
  const featuredSportResults = useQueries({
    queries: [
      { queryKey: ['featured-nba'], queryFn: () => getBestComboForSport('NBA'), staleTime: 5 * 60 * 1000 },
      { queryKey: ['featured-mlb'], queryFn: () => getBestComboForSport('MLB'), staleTime: 5 * 60 * 1000 },
      { queryKey: ['featured-nhl'], queryFn: () => getBestComboForSport('NHL'), staleTime: 5 * 60 * 1000 },
    ],
  });

  const featuredCombos = useMemo(() => {
    const nbaCombo = featuredSportResults[0].data;
    const mlbCombo = featuredSportResults[1].data;
    const nhlCombo = featuredSportResults[2].data;
    const featured: ComboSuggestion[] = [];
    if (nbaCombo) featured.push(nbaCombo);
    if (mlbCombo) featured.push(mlbCombo);
    if (nhlCombo) featured.push(nhlCombo);
    return featured.slice(0, MAX_VISIBLE_CARDS);
  }, [featuredSportResults]);

  const filterCombos = useCallback((parlays: ComboSuggestion[]): ComboSuggestion[] => {
    let filtered = parlays.filter(parlay => {
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
    });
    
    const sorted = filtered.sort((a, b) => {
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
    
    return sorted.slice(0, MAX_VISIBLE_CARDS);
  }, [filters]);

  const filteredFeaturedCombos = useMemo(() => filterCombos(featuredCombos), [featuredCombos, filterCombos]);
  const filteredGeneratedCombos = useMemo(() => filterCombos(generatedCombos), [generatedCombos, filterCombos]);

  // ========== CREDIT CHECK AND DEDUCTION ==========
  const checkCredits = useCallback((): boolean => {
    console.log(`🔍 Checking credits - Premium: ${planFeatures?.hasGeneratorCredits}, Credits: ${generatorCredits}`);
    if (planFeatures?.hasGeneratorCredits) return true;
    if (generatorCredits > 0) return true;
    console.log('❌ No credits available, showing modal');
    setShowCreditsModal(true);
    return false;
  }, [planFeatures?.hasGeneratorCredits, generatorCredits]);

  // Fixed useCredit function
  const useCredit = useCallback(async (): Promise<boolean> => {
    console.log(`💳 useCredit called - hasGeneratorCredits: ${planFeatures?.hasGeneratorCredits}, generatorCredits: ${generatorCredits}`);
    
    if (planFeatures?.hasGeneratorCredits) {
      console.log('✅ Premium user - unlimited credits, no deduction needed');
      return true;
    }
    
    if (generatorCredits <= 0) {
      console.log('❌ No credits left, cannot use credit');
      setShowCreditsModal(true);
      return false;
    }
    
    const userId = user?.uid || user?.id;
    console.log(`💳 Attempting to use 1 credit. Current credits: ${generatorCredits}, User ID: ${userId}`);
    
    try {
      const response = await fetch(`${PYTHON_API_BASE}/api/user/generations/decrement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          pickType: 'same_game_parlay',
          pickData: { prompt: selectedPrompt || customPrompt || 'auto', screen: 'SameGameParlay' }
        }),
      });
      
      console.log(`📡 Decrement API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Credit used successfully! Remaining: ${data.remaining}`);
        setGeneratorCredits(data.remaining);
        await refreshCredits();
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to use credit:', response.status, errorText);
        setShowCreditsModal(true);
        return false;
      }
    } catch (error) {
      console.error('❌ Error using credit:', error);
      setShowCreditsModal(true);
      return false;
    }
  }, [planFeatures?.hasGeneratorCredits, generatorCredits, token, user, selectedPrompt, customPrompt, refreshCredits]);

  const generateFromPrompt = useCallback(async (prompt: string, isCustom: boolean = false) => {
    console.log(`🚀 Starting generation from prompt: "${prompt.substring(0, 50)}..."`);
    
    await refreshCredits();
    
    console.log(`🔍 Current credits after refresh: ${generatorCredits}`);
    
    if (!checkCredits()) {
      console.log('❌ Credit check failed, aborting generation');
      return;
    }
    
    setGenerating(true);
    
    try {
      const creditSuccess = await useCredit();
      console.log(`Credit usage result: ${creditSuccess}`);
      
      if (!creditSuccess && !planFeatures?.hasGeneratorCredits) {
        console.log('❌ Credit usage failed and not premium, aborting');
        setGenerating(false);
        return;
      }
      
      const promptLower = prompt.toLowerCase();
      let targetSport = currentSport;
      
      if (promptLower.includes('nba') || promptLower.includes('basketball')) targetSport = 'NBA';
      else if (promptLower.includes('mlb') || promptLower.includes('baseball')) targetSport = 'MLB';
      else if (promptLower.includes('nhl') || promptLower.includes('hockey')) targetSport = 'NHL';
      
      let targetMarket: string = 'player_props';
      
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
      
      const newCombos: ComboSuggestion[] = [];
      
      for (const game of sportGames) {
        console.log(`🎲 Generating combos for game: ${game.home_team} vs ${game.away_team}`);
        
        const allGameCombos = generateAllGameCombos(game, sportProps, isCustom ? 'Custom Prompt' : promptInfo?.label);
        console.log(`📊 Generated ${allGameCombos.length} total combos, markets: ${allGameCombos.map(p => p.market_type).join(', ')}`);
        
        let filteredGameCombos: ComboSuggestion[] = [];
        
        if (targetMarket === 'mixed') {
          filteredGameCombos = allGameCombos.filter(p => p.market_type === 'mixed');
        } else if (targetMarket === 'player_props') {
          filteredGameCombos = allGameCombos.filter(p => p.market_type === 'player_props');
        } else if (targetMarket === 'moneyline') {
          filteredGameCombos = allGameCombos.filter(p => p.market_type === 'moneyline');
        } else if (targetMarket === 'totals') {
          filteredGameCombos = allGameCombos.filter(p => p.market_type === 'totals');
        }
        
        if (filteredGameCombos.length === 0 && allGameCombos.length > 0) {
          console.log(`⚠️ No ${targetMarket} combos found, using first available: ${allGameCombos[0].market_type}`);
          filteredGameCombos = [allGameCombos[0]];
        }
        
        newCombos.push(...filteredGameCombos);
      }
      
      if (newCombos.length === 0) {
        setSuccessMessage(`No combos found for ${targetSport} with market type: ${targetMarket}`);
        setShowSuccessAlert(true);
        setGenerating(false);
        return;
      }
      
      const limitedNewCombos = newCombos.sort((a,b) => b.confidence - a.confidence).slice(0, GENERATOR_RESULTS_COUNT);
      console.log(`✅ Adding ${limitedNewCombos.length} new combos to generated list`);
      
      setGeneratedCombos(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = limitedNewCombos.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      
      setSuccessMessage(`Generated ${limitedNewCombos.length} ${targetMarket} combos for ${targetSport} from "${isCustom ? prompt.substring(0, 50) : promptInfo?.label}"`);
      setShowSuccessAlert(true);
      setViewTab(1);
    } catch (error) {
      console.error('Generation error:', error);
      setSuccessMessage('Failed to generate combos');
      setShowSuccessAlert(true);
    } finally {
      setGenerating(false);
      setSelectedPrompt('');
      setCustomPrompt('');
    }
  }, [games, props, currentSport, planFeatures, generatorCredits, checkCredits, useCredit, refreshCredits]);

  const generateMoreForGame = useCallback(async (game: Game) => {
    if (!checkCredits()) return;
    
    setGenerating(true);
    
    try {
      const creditSuccess = await useCredit();
      if (!creditSuccess && !planFeatures?.hasGeneratorCredits) {
        setGenerating(false);
        return;
      }
      
      const allGameCombos = generateAllGameCombos(game, props, 'Quick Generate');
      const limitedNewCombos = allGameCombos.sort((a,b) => b.confidence - a.confidence).slice(0, GENERATOR_RESULTS_COUNT);
      
      setGeneratedCombos(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = limitedNewCombos.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      
      setSuccessMessage(`Generated ${limitedNewCombos.length} additional combos for ${game.away_team} @ ${game.home_team}`);
      setShowSuccessAlert(true);
      setViewTab(1);
    } catch (error) {
      console.error('Generate more error:', error);
      setSuccessMessage('Failed to generate more combos');
      setShowSuccessAlert(true);
    } finally {
      setGenerating(false);
    }
  }, [props, planFeatures, checkCredits, useCredit]);

  const clearGenerated = useCallback(() => {
    setGeneratedCombos([]);
    setSuccessMessage('All generated combos cleared');
    setShowSuccessAlert(true);
    setViewTab(0);
  }, []);

  const isLoading = propsLoading || gamesLoading;
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRefresh = useCallback(() => {
    refetchGames();
    refetchProps();
    refreshCredits();
  }, [refetchGames, refetchProps, refreshCredits]);

  const getCurrentCombos = useCallback((): ComboSuggestion[] => {
    let parlays = viewTab === 0 ? filteredFeaturedCombos : filteredGeneratedCombos;
    if (strategyTab > 0) {
      const marketTypeMap: Record<number, string> = { 1: 'player_props', 2: 'totals', 3: 'moneyline', 4: 'mixed' };
      const targetMarket = marketTypeMap[strategyTab];
      if (targetMarket) parlays = parlays.filter(p => p.market_type === targetMarket);
    }
    return parlays.slice(0, MAX_VISIBLE_CARDS);
  }, [viewTab, filteredFeaturedCombos, filteredGeneratedCombos, strategyTab]);

  const currentCombos = getCurrentCombos();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setShowSuccessAlert(false)}>
          <AlertTitle>Success!</AlertTitle>
          {successMessage}
        </Alert>
      )}

      {/* Credit Balance Alert */}
      <Alert severity={generatorCredits > 0 ? "info" : "warning"} sx={{ mb: 3 }}>
        <AlertTitle>
          {generatorCredits > 0 ? `✨ You have ${generatorCredits} generator credits remaining` : "⚠️ No generator credits left"}
        </AlertTitle>
        Generating a new set of combos uses 1 credit. Viewing the top 4 featured combos above is free.
        {generatorCredits === 0 && " Purchase credits to generate combos."}
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
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

      {planFeatures?.hasGeneratorCredits && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Premium Active</AlertTitle>
          Unlimited combo generation! Generate as many as you want.
        </Alert>
      )}

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box display="flex" alignItems="center">
          <ComboIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">Game Combos</Typography>
          <Tooltip title="Combine multiple picks from the same game for higher estimated returns">
            <IconButton size="small" sx={{ ml: 1 }}><InfoIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Filter combos"><IconButton onClick={() => setFiltersOpen(true)} color="primary"><FilterIcon /></IconButton></Tooltip>
          {generatedCombos.length > 0 && (
            <Tooltip title="Clear generated combos"><IconButton onClick={clearGenerated} color="error"><ClearIcon /></IconButton></Tooltip>
          )}
          <Tooltip title="Refresh data"><IconButton onClick={handleRefresh} color="primary"><RefreshIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* AI Generator Section */}
      <Paper sx={{ p: 2, mb: 4, bgcolor: alpha('#6C5CE7', 0.05), border: '1px solid', borderColor: '#6C5CE7' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          AI Game Combo Generator
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {planFeatures?.hasGeneratorCredits 
            ? 'Unlimited generations available! Each generation produces 3 combos.' 
            : generatorCredits > 0
              ? `Each generation uses 1 credit and produces 3 combos. You have ${generatorCredits} credits remaining.`
              : 'Upgrade to start generating combos (3 per generation)!'}
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
              disabled={!selectedPrompt || generating || (!planFeatures?.hasGeneratorCredits && generatorCredits === 0)} 
              sx={{ bgcolor: '#6C5CE7', mt: 1, width: '100%' }}
            >
              {generating ? 'Generating...' : 'Generate 3 Combos from Preset'}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Or enter your own prompt... e.g., 'Lakers vs Warriors player props combo', 'NHL goals and assists same game', 'MLB home run and strikeout combo'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              variant="outlined"
            />
            <Button 
              variant="outlined" 
              startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />} 
              onClick={() => customPrompt.trim() && generateFromPrompt(customPrompt, true)} 
              disabled={!customPrompt.trim() || generating || (!planFeatures?.hasGeneratorCredits && generatorCredits === 0)} 
              sx={{ mt: 1, width: '100%', borderColor: '#6C5CE7', color: '#6C5CE7' }}
            >
              {generating ? 'Generating...' : 'Generate 3 Combos from Custom Prompt'}
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          ✨ 15 curated prompts + custom prompt support. Each generation creates up to 3 top combos (sorted by confidence).
          {!planFeatures?.hasGeneratorCredits && ` You have ${generatorCredits} credits remaining.`}
        </Typography>
      </Paper>

      {/* View Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} variant="fullWidth">
          <Tab icon={<StarIcon />} label={`Featured Combos (${filteredFeaturedCombos.length})`} iconPosition="start" />
          <Tab icon={<AutoAwesomeIcon />} label={`Generated Combos (${filteredGeneratedCombos.length})`} iconPosition="start" />
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
          <Tab label="All" /><Tab label="Player Props" /><Tab label="Game Totals" /><Tab label="Match Winner" /><Tab label="Mixed" />
        </Tabs>
      </Box>

      {/* Stats Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="body2" color="text.secondary">
          Showing {currentCombos.length} combos • {viewTab === 0 ? `${filteredFeaturedCombos.length} featured combos` : `${generatedCombos.length} total combos generated`}
        </Typography>
        {viewTab === 0 && filteredFeaturedCombos.length > 0 && (
          <Chip icon={<LockIcon />} label="Top combos across NBA, MLB, NHL" size="small" variant="outlined" sx={{ bgcolor: alpha('#f59e0b', 0.1) }} />
        )}
        {viewTab === 1 && generatedCombos.length > 0 && (
          <Chip label={`${generatedCombos.length} generated`} size="small" variant="outlined" sx={{ bgcolor: alpha('#6C5CE7', 0.1) }} />
        )}
      </Box>

      {/* Content */}
      {isLoading && viewTab === 0 ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /><Typography sx={{ ml: 2 }}>Loading featured combos...</Typography></Box>
      ) : currentCombos.length === 0 ? (
        <Alert severity="info">
          <AlertTitle>No {viewTab === 0 ? 'Featured' : 'Generated'} Combos Available</AlertTitle>
          {viewTab === 0 ? (
            <Box>
              <Typography>No featured combos available at the moment.</Typography>
              <Box mt={2}>
                <Typography variant="body2">💡 Tip: Use the AI Generator above to create combos!</Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography>No generated combos yet.</Typography>
              <Box mt={2}>
                <Typography variant="body2">💡 Tip: Select a prompt from the AI Generator above or enter your own custom prompt to create same-game combos!</Typography>
              </Box>
            </Box>
          )}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {currentCombos.map(parlay => (
            <Grid item xs={12} md={6} lg={4} key={parlay.id}>
              <ComboCard 
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
        <DialogTitle><Box display="flex" alignItems="center" gap={1}><FilterIcon /><Typography variant="h6">Filter Combos</Typography></Box></DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Minimum Confidence: {filters.minConfidence}%</Typography>
            <Slider value={filters.minConfidence} onChange={(_, v) => setFilters({ ...filters, minConfidence: v as number })} min={0} max={100} step={5} marks={[{value:0, label:'0%'}, {value:50, label:'50%'}, {value:100, label:'100%'}]} valueLabelDisplay="auto" />
            <Typography gutterBottom sx={{ mt: 2 }}>Maximum Volatility Level</Typography>
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
            <FormControl fullWidth size="small"><Select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}><MenuItem value="confidence">Confidence (Highest first)</MenuItem><MenuItem value="odds">Multiplier (Highest first)</MenuItem><MenuItem value="risk">Volatility (Lowest first)</MenuItem></Select></FormControl>
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setFiltersOpen(false)}>Cancel</Button><Button variant="contained" onClick={() => { setFiltersOpen(false); setSuccessMessage('Filters applied'); setShowSuccessAlert(true); }}>Apply Filters</Button></DialogActions>
      </Dialog>

      {/* Credits Purchase Modal */}
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

      {/* Upgrade Modal */}
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

      <Divider sx={{ my: 4 }} />
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        * The main display shows up to 4 top projected combos across NBA, MLB, and NHL. Each generation produces 3 combos.
        {!planFeatures?.hasGeneratorCredits && ` You have ${generatorCredits} credits remaining.`}
      </Typography>
    </Container>
  );
};

const SameGameComboScreen: React.FC = () => {
  return <SameGameComboContent />;
};

export default SameGameComboScreen;
