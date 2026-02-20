// pages/AltLinesScreen.tsx
import React, { useMemo, useState, useEffect } from 'react'; // include whatever hooks you need
import Schedule from '../components/Schedule';
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
  Fade,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  SportsSoccer,
  TrendingUp,
  TrendingDown,
  Info,
  Flag,
  Star,
  Assessment,
  ArrowForward,
  ArrowDropDown,
  ArrowDropUp,
  Whatshot,
  MonetizationOn,
  ShowChart,
  CompareArrows,
  Psychology,
  Savings,
  Warning,
  CheckCircle,
  Lock,
  LockOpen,
  Autorenew,
  SwapHoriz,
  Add,
  Remove,
  Casino,
  Timeline,
  BarChart,
  PriceCheck,
  LocalOffer
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// =============================================
// TYPES
// =============================================

interface AlternateLine {
  id: string;
  gameId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbrev: string;
  awayAbbrev: string;
  homeFlag?: string;
  awayFlag?: string;
  market: 'spread' | 'total' | 'moneyline';
  lineType: 'spread' | 'total' | 'moneyline';
  point: number;
  homeOdds: number;
  awayOdds: number;
  overOdds?: number;
  underOdds?: number;
  bookmaker: string;
  bookmakerKey: string;
  lastUpdate: string;
  confidence?: number;
  edge?: number;
  valueScore?: number;
  isBestOdds: boolean;
  isAltLine: boolean;
  altFrom?: number;
}

interface Game {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbrev: string;
  awayAbbrev: string;
  homeFlag?: string;
  awayFlag?: string;
  commenceTime: string;
  status: 'scheduled' | 'live' | 'final';
  homeScore?: number;
  awayScore?: number;
  period?: string;
  timeRemaining?: string;
  altLines: AlternateLine[];
  mainSpread: AlternateLine;
  mainTotal: AlternateLine;
  mainMoneyline: AlternateLine;
}

interface OddsMarket {
  key: string;
  last_update: string;
  outcomes: Array<{
    name: string;
    price: number;
    point?: number;
    description?: string;
  }>;
}

interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

// =============================================
// API FUNCTIONS - Connects to your Flask backend
// =============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://python-api-fresh-production.up.railway.app';

// Fetch live odds with alternate lines from The Odds API via Flask
const fetchAlternateLines = async (sport: string = 'basketball_nba') => {
  try {
    // Your Flask backend proxies The Odds API with alt lines
    const response = await axios.get(`${API_BASE_URL}/api/odds/${sport}`, {
      params: {
        regions: 'us',
        markets: 'spreads,totals,h2h,alternate_spreads,alternate_totals',
        oddsFormat: 'american',
        bookmakers: 'draftkings,fanduel,betmgm,caesars'
      }
    });
    
    if (response.data.success) {
      return processAlternateLines(response.data.data, sport);
    }
    return null;
  } catch (error) {
    console.log('Using mock alternate lines data');
    return null;
  }
};

// Fetch player prop alternates from your /api/prizepicks/selections endpoint
const fetchPlayerPropAlternates = async (sport: string = 'nba') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/prizepicks/selections`, {
      params: { sport, limit: 50 }
    });
    return response.data.selections || [];
  } catch (error) {
    console.log('Using mock player prop data');
    return [];
  }
};

// Process The Odds API response into alternate line format
const processAlternateLines = (oddsData: any[], sport: string): Game[] => {
  if (!oddsData || oddsData.length === 0) return [];
  
  const games: Game[] = [];
  
  oddsData.forEach((game: any) => {
    const homeTeam = game.home_team || '';
    const awayTeam = game.away_team || '';
    const gameId = game.id || `game-${games.length}`;
    
    // Process bookmakers
    let mainSpread: AlternateLine | null = null;
    let mainTotal: AlternateLine | null = null;
    let mainMoneyline: AlternateLine | null = null;
    const altLines: AlternateLine[] = [];
    
    game.bookmakers?.forEach((bookmaker: Bookmaker) => {
      bookmaker.markets?.forEach((market: OddsMarket) => {
        // Main spreads (standard -110 lines)
        if (market.key === 'spreads' && market.outcomes && market.outcomes.length >= 2) {
          const homeOutcome = market.outcomes.find(o => o.name === homeTeam);
          const awayOutcome = market.outcomes.find(o => o.name === awayTeam);
          
          if (homeOutcome && awayOutcome) {
            mainSpread = {
              id: `spread-${gameId}-${bookmaker.key}`,
              gameId,
              sport,
              league: sport === 'basketball_nba' ? 'NBA' : sport === 'americanfootball_nfl' ? 'NFL' : sport,
              homeTeam,
              awayTeam,
              homeAbbrev: getTeamAbbrev(homeTeam),
              awayAbbrev: getTeamAbbrev(awayTeam),
              market: 'spread',
              lineType: 'spread',
              point: homeOutcome.point || 0,
              homeOdds: homeOutcome.price,
              awayOdds: awayOutcome.price,
              bookmaker: bookmaker.title,
              bookmakerKey: bookmaker.key,
              lastUpdate: bookmaker.last_update,
              isBestOdds: true,
              isAltLine: false
            };
          }
        }
        
        // Alternate spreads (different point values)
        if (market.key === 'alternate_spreads' && market.outcomes && market.outcomes.length >= 2) {
          // Group outcomes by point value
          const spreadGroups: Record<number, { home: any; away: any }> = {};
          
          market.outcomes.forEach((outcome: any) => {
            const point = outcome.point || 0;
            if (!spreadGroups[point]) {
              spreadGroups[point] = { home: null, away: null };
            }
            if (outcome.name === homeTeam) {
              spreadGroups[point].home = outcome;
            } else if (outcome.name === awayTeam) {
              spreadGroups[point].away = outcome;
            }
          });
          
          Object.entries(spreadGroups).forEach(([pointStr, outcomes]) => {
            const point = parseFloat(pointStr);
            if (outcomes.home && outcomes.away) {
              altLines.push({
                id: `alt-spread-${gameId}-${bookmaker.key}-${point}`,
                gameId,
                sport,
                league: sport === 'basketball_nba' ? 'NBA' : sport === 'americanfootball_nfl' ? 'NFL' : sport,
                homeTeam,
                awayTeam,
                homeAbbrev: getTeamAbbrev(homeTeam),
                awayAbbrev: getTeamAbbrev(awayTeam),
                market: 'spread',
                lineType: 'spread',
                point,
                homeOdds: outcomes.home.price,
                awayOdds: outcomes.away.price,
                bookmaker: bookmaker.title,
                bookmakerKey: bookmaker.key,
                lastUpdate: bookmaker.last_update,
                isBestOdds: false,
                isAltLine: true,
                altFrom: mainSpread?.point || 0,
                confidence: calculateAltLineConfidence(point, mainSpread?.point || 0, outcomes.home.price),
                edge: calculateAltLineEdge(outcomes.home.price, mainSpread?.homeOdds || -110)
              });
            }
          });
        }
        
        // Main totals (Over/Under standard lines)
        if (market.key === 'totals' && market.outcomes && market.outcomes.length >= 2) {
          const overOutcome = market.outcomes.find(o => o.name === 'Over');
          const underOutcome = market.outcomes.find(o => o.name === 'Under');
          
          if (overOutcome && underOutcome) {
            mainTotal = {
              id: `total-${gameId}-${bookmaker.key}`,
              gameId,
              sport,
              league: sport === 'basketball_nba' ? 'NBA' : sport === 'americanfootball_nfl' ? 'NFL' : sport,
              homeTeam,
              awayTeam,
              homeAbbrev: getTeamAbbrev(homeTeam),
              awayAbbrev: getTeamAbbrev(awayTeam),
              market: 'total',
              lineType: 'total',
              point: overOutcome.point || 0,
              overOdds: overOutcome.price,
              underOdds: underOutcome.price,
              homeOdds: 0,
              awayOdds: 0,
              bookmaker: bookmaker.title,
              bookmakerKey: bookmaker.key,
              lastUpdate: bookmaker.last_update,
              isBestOdds: true,
              isAltLine: false
            };
          }
        }
        
        // Alternate totals (different point values)
        if (market.key === 'alternate_totals' && market.outcomes && market.outcomes.length >= 2) {
          // Group outcomes by point value
          const totalGroups: Record<number, { over: any; under: any }> = {};
          
          market.outcomes.forEach((outcome: any) => {
            const point = outcome.point || 0;
            if (!totalGroups[point]) {
              totalGroups[point] = { over: null, under: null };
            }
            if (outcome.name === 'Over') {
              totalGroups[point].over = outcome;
            } else if (outcome.name === 'Under') {
              totalGroups[point].under = outcome;
            }
          });
          
          Object.entries(totalGroups).forEach(([pointStr, outcomes]) => {
            const point = parseFloat(pointStr);
            if (outcomes.over && outcomes.under) {
              altLines.push({
                id: `alt-total-${gameId}-${bookmaker.key}-${point}`,
                gameId,
                sport,
                league: sport === 'basketball_nba' ? 'NBA' : sport === 'americanfootball_nfl' ? 'NFL' : sport,
                homeTeam,
                awayTeam,
                homeAbbrev: getTeamAbbrev(homeTeam),
                awayAbbrev: getTeamAbbrev(awayTeam),
                market: 'total',
                lineType: 'total',
                point,
                overOdds: outcomes.over.price,
                underOdds: outcomes.under.price,
                homeOdds: 0,
                awayOdds: 0,
                bookmaker: bookmaker.title,
                bookmakerKey: bookmaker.key,
                lastUpdate: bookmaker.last_update,
                isBestOdds: false,
                isAltLine: true,
                altFrom: mainTotal?.point || 0,
                confidence: calculateAltTotalConfidence(point, mainTotal?.point || 0, outcomes.over.price),
                edge: calculateAltLineEdge(outcomes.over.price, mainTotal?.overOdds || -110)
              });
            }
          });
        }
        
        // Moneyline (already alternate by nature - different odds)
        if (market.key === 'h2h' && market.outcomes && market.outcomes.length >= 2) {
          const homeOutcome = market.outcomes.find(o => o.name === homeTeam);
          const awayOutcome = market.outcomes.find(o => o.name === awayTeam);
          
          if (homeOutcome && awayOutcome) {
            mainMoneyline = {
              id: `ml-${gameId}-${bookmaker.key}`,
              gameId,
              sport,
              league: sport === 'basketball_nba' ? 'NBA' : sport === 'americanfootball_nfl' ? 'NFL' : sport,
              homeTeam,
              awayTeam,
              homeAbbrev: getTeamAbbrev(homeTeam),
              awayAbbrev: getTeamAbbrev(awayTeam),
              market: 'moneyline',
              lineType: 'moneyline',
              point: 0,
              homeOdds: homeOutcome.price,
              awayOdds: awayOutcome.price,
              bookmaker: bookmaker.title,
              bookmakerKey: bookmaker.key,
              lastUpdate: bookmaker.last_update,
              isBestOdds: true,
              isAltLine: false
            };
          }
        }
      });
    });
    
    // Only add games that have alternate lines
    if (altLines.length > 0 && mainSpread && mainTotal && mainMoneyline) {
      games.push({
        id: gameId,
        sport,
        league: sport === 'basketball_nba' ? 'NBA' : sport === 'americanfootball_nfl' ? 'NFL' : sport,
        homeTeam,
        awayTeam,
        homeAbbrev: getTeamAbbrev(homeTeam),
        awayAbbrev: getTeamAbbrev(awayTeam),
        homeFlag: getTeamFlag(homeTeam),
        awayFlag: getTeamFlag(awayTeam),
        commenceTime: game.commence_time,
        status: 'scheduled',
        altLines,
        mainSpread,
        mainTotal,
        mainMoneyline
      });
    }
  });
  
  return games;
};

// Helper functions
const getTeamAbbrev = (teamName: string): string => {
  const abbrevs: Record<string, string> = {
    'Los Angeles Lakers': 'LAL',
    'Golden State Warriors': 'GSW',
    'Boston Celtics': 'BOS',
    'Milwaukee Bucks': 'MIL',
    'Phoenix Suns': 'PHX',
    'Denver Nuggets': 'DEN',
    'Dallas Mavericks': 'DAL',
    'Miami Heat': 'MIA',
    'Philadelphia 76ers': 'PHI',
    'New York Knicks': 'NYK',
    'Kansas City Chiefs': 'KC',
    'Buffalo Bills': 'BUF',
    'Philadelphia Eagles': 'PHI',
    'San Francisco 49ers': 'SF',
    'Cincinnati Bengals': 'CIN',
    'Dallas Cowboys': 'DAL'
  };
  return abbrevs[teamName] || teamName.substring(0, 3).toUpperCase();
};

const getTeamFlag = (teamName: string): string => {
  if (teamName.includes('Lakers') || teamName.includes('Warriors') || teamName.includes('Celtics')) return '🇺🇸';
  if (teamName.includes('Raptors')) return '🇨🇦';
  return '🇺🇸';
};

const calculateAltLineConfidence = (altPoint: number, mainPoint: number, odds: number): number => {
  const diff = Math.abs(altPoint - mainPoint);
  if (diff <= 1.5) return 85;
  if (diff <= 3) return 75;
  if (diff <= 5) return 65;
  if (diff <= 7) return 55;
  return 45;
};

const calculateAltTotalConfidence = (altPoint: number, mainPoint: number, odds: number): number => {
  const diff = Math.abs(altPoint - mainPoint);
  if (diff <= 3) return 80;
  if (diff <= 6) return 70;
  if (diff <= 9) return 60;
  if (diff <= 12) return 50;
  return 40;
};

const calculateAltLineEdge = (altOdds: number, mainOdds: number): number => {
  const altImplied = altOdds > 0 ? 100 / (altOdds + 100) : Math.abs(altOdds) / (Math.abs(altOdds) + 100);
  const mainImplied = mainOdds > 0 ? 100 / (mainOdds + 100) : Math.abs(mainOdds) / (Math.abs(mainOdds) + 100);
  return Number(((altImplied - mainImplied) * 100).toFixed(1));
};

// =============================================
// MOCK DATA - Enhanced with real teams and alt lines
// =============================================

const MOCK_ALT_LINES_GAMES: Game[] = [
  {
    id: 'game-1',
    sport: 'basketball_nba',
    league: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Golden State Warriors',
    homeAbbrev: 'LAL',
    awayAbbrev: 'GSW',
    homeFlag: '🇺🇸',
    awayFlag: '🇺🇸',
    commenceTime: new Date(Date.now() + 3600000 * 5).toISOString(),
    status: 'scheduled',
    mainSpread: {
      id: 'spread-1-main',
      gameId: 'game-1',
      sport: 'basketball_nba',
      league: 'NBA',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Golden State Warriors',
      homeAbbrev: 'LAL',
      awayAbbrev: 'GSW',
      market: 'spread',
      lineType: 'spread',
      point: -3.5,
      homeOdds: -110,
      awayOdds: -110,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    mainTotal: {
      id: 'total-1-main',
      gameId: 'game-1',
      sport: 'basketball_nba',
      league: 'NBA',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Golden State Warriors',
      homeAbbrev: 'LAL',
      awayAbbrev: 'GSW',
      market: 'total',
      lineType: 'total',
      point: 228.5,
      overOdds: -110,
      underOdds: -110,
      homeOdds: 0,
      awayOdds: 0,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    mainMoneyline: {
      id: 'ml-1-main',
      gameId: 'game-1',
      sport: 'basketball_nba',
      league: 'NBA',
      homeTeam: 'Los Angeles Lakers',
      awayTeam: 'Golden State Warriors',
      homeAbbrev: 'LAL',
      awayAbbrev: 'GSW',
      market: 'moneyline',
      lineType: 'moneyline',
      point: 0,
      homeOdds: -150,
      awayOdds: +130,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    altLines: [
      // Alternate spreads
      {
        id: 'alt-spread-1-1',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'spread',
        lineType: 'spread',
        point: -1.5,
        homeOdds: -165,
        awayOdds: +145,
        bookmaker: 'DraftKings',
        bookmakerKey: 'draftkings',
        lastUpdate: new Date().toISOString(),
        isBestOdds: false,
        isAltLine: true,
        altFrom: -3.5,
        confidence: 85,
        edge: 3.2,
        valueScore: 78
      },
      {
        id: 'alt-spread-1-2',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'spread',
        lineType: 'spread',
        point: -2.5,
        homeOdds: -140,
        awayOdds: +120,
        bookmaker: 'DraftKings',
        bookmakerKey: 'draftkings',
        lastUpdate: new Date().toISOString(),
        isBestOdds: false,
        isAltLine: true,
        altFrom: -3.5,
        confidence: 82,
        edge: 2.1,
        valueScore: 75
      },
      {
        id: 'alt-spread-1-3',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'spread',
        lineType: 'spread',
        point: -4.5,
        homeOdds: +105,
        awayOdds: -125,
        bookmaker: 'DraftKings',
        bookmakerKey: 'draftkings',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: -3.5,
        confidence: 79,
        edge: 4.5,
        valueScore: 82
      },
      {
        id: 'alt-spread-1-4',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'spread',
        lineType: 'spread',
        point: -5.5,
        homeOdds: +120,
        awayOdds: -140,
        bookmaker: 'FanDuel',
        bookmakerKey: 'fanduel',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: -3.5,
        confidence: 72,
        edge: 5.8,
        valueScore: 80
      },
      {
        id: 'alt-spread-1-5',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'spread',
        lineType: 'spread',
        point: -6.5,
        homeOdds: +145,
        awayOdds: -165,
        bookmaker: 'BetMGM',
        bookmakerKey: 'betmgm',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: -3.5,
        confidence: 65,
        edge: 6.9,
        valueScore: 76
      },
      // Alternate totals
      {
        id: 'alt-total-1-1',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'total',
        lineType: 'total',
        point: 225.5,
        overOdds: +105,
        underOdds: -125,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'DraftKings',
        bookmakerKey: 'draftkings',
        lastUpdate: new Date().toISOString(),
        isBestOdds: false,
        isAltLine: true,
        altFrom: 228.5,
        confidence: 80,
        edge: 2.8,
        valueScore: 77
      },
      {
        id: 'alt-total-1-2',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'total',
        lineType: 'total',
        point: 226.5,
        overOdds: +100,
        underOdds: -120,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'DraftKings',
        bookmakerKey: 'draftkings',
        lastUpdate: new Date().toISOString(),
        isBestOdds: false,
        isAltLine: true,
        altFrom: 228.5,
        confidence: 78,
        edge: 2.1,
        valueScore: 74
      },
      {
        id: 'alt-total-1-3',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'total',
        lineType: 'total',
        point: 230.5,
        overOdds: -115,
        underOdds: -105,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'FanDuel',
        bookmakerKey: 'fanduel',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: 228.5,
        confidence: 76,
        edge: 1.5,
        valueScore: 72
      },
      {
        id: 'alt-total-1-4',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'total',
        lineType: 'total',
        point: 231.5,
        overOdds: -105,
        underOdds: -115,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'BetMGM',
        bookmakerKey: 'betmgm',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: 228.5,
        confidence: 71,
        edge: 2.2,
        valueScore: 73
      },
      {
        id: 'alt-total-1-5',
        gameId: 'game-1',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeAbbrev: 'LAL',
        awayAbbrev: 'GSW',
        market: 'total',
        lineType: 'total',
        point: 232.5,
        overOdds: +115,
        underOdds: -135,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'Caesars',
        bookmakerKey: 'caesars',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: 228.5,
        confidence: 65,
        edge: 3.4,
        valueScore: 75
      }
    ]
  },
  {
    id: 'game-2',
    sport: 'basketball_nba',
    league: 'NBA',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Milwaukee Bucks',
    homeAbbrev: 'BOS',
    awayAbbrev: 'MIL',
    homeFlag: '🇺🇸',
    awayFlag: '🇺🇸',
    commenceTime: new Date(Date.now() + 7200000 * 5).toISOString(),
    status: 'scheduled',
    mainSpread: {
      id: 'spread-2-main',
      gameId: 'game-2',
      sport: 'basketball_nba',
      league: 'NBA',
      homeTeam: 'Boston Celtics',
      awayTeam: 'Milwaukee Bucks',
      homeAbbrev: 'BOS',
      awayAbbrev: 'MIL',
      market: 'spread',
      lineType: 'spread',
      point: -4.5,
      homeOdds: -115,
      awayOdds: -105,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    mainTotal: {
      id: 'total-2-main',
      gameId: 'game-2',
      sport: 'basketball_nba',
      league: 'NBA',
      homeTeam: 'Boston Celtics',
      awayTeam: 'Milwaukee Bucks',
      homeAbbrev: 'BOS',
      awayAbbrev: 'MIL',
      market: 'total',
      lineType: 'total',
      point: 224.5,
      overOdds: -110,
      underOdds: -110,
      homeOdds: 0,
      awayOdds: 0,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    mainMoneyline: {
      id: 'ml-2-main',
      gameId: 'game-2',
      sport: 'basketball_nba',
      league: 'NBA',
      homeTeam: 'Boston Celtics',
      awayTeam: 'Milwaukee Bucks',
      homeAbbrev: 'BOS',
      awayAbbrev: 'MIL',
      market: 'moneyline',
      lineType: 'moneyline',
      point: 0,
      homeOdds: -170,
      awayOdds: +150,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    altLines: [
      {
        id: 'alt-spread-2-1',
        gameId: 'game-2',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Milwaukee Bucks',
        homeAbbrev: 'BOS',
        awayAbbrev: 'MIL',
        market: 'spread',
        lineType: 'spread',
        point: -2.5,
        homeOdds: -145,
        awayOdds: +125,
        bookmaker: 'DraftKings',
        bookmakerKey: 'draftkings',
        lastUpdate: new Date().toISOString(),
        isBestOdds: false,
        isAltLine: true,
        altFrom: -4.5,
        confidence: 84,
        edge: 2.8,
        valueScore: 79
      },
      {
        id: 'alt-spread-2-2',
        gameId: 'game-2',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Milwaukee Bucks',
        homeAbbrev: 'BOS',
        awayAbbrev: 'MIL',
        market: 'spread',
        lineType: 'spread',
        point: -5.5,
        homeOdds: +110,
        awayOdds: -130,
        bookmaker: 'FanDuel',
        bookmakerKey: 'fanduel',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: -4.5,
        confidence: 77,
        edge: 4.2,
        valueScore: 81
      },
      {
        id: 'alt-total-2-1',
        gameId: 'game-2',
        sport: 'basketball_nba',
        league: 'NBA',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Milwaukee Bucks',
        homeAbbrev: 'BOS',
        awayAbbrev: 'MIL',
        market: 'total',
        lineType: 'total',
        point: 221.5,
        overOdds: +115,
        underOdds: -135,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'BetMGM',
        bookmakerKey: 'betmgm',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: 224.5,
        confidence: 73,
        edge: 3.1,
        valueScore: 76
      }
    ]
  },
  {
    id: 'game-3',
    sport: 'americanfootball_nfl',
    league: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    homeAbbrev: 'KC',
    awayAbbrev: 'BUF',
    homeFlag: '🇺🇸',
    awayFlag: '🇺🇸',
    commenceTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'scheduled',
    mainSpread: {
      id: 'spread-3-main',
      gameId: 'game-3',
      sport: 'americanfootball_nfl',
      league: 'NFL',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      homeAbbrev: 'KC',
      awayAbbrev: 'BUF',
      market: 'spread',
      lineType: 'spread',
      point: -2.5,
      homeOdds: -110,
      awayOdds: -110,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    mainTotal: {
      id: 'total-3-main',
      gameId: 'game-3',
      sport: 'americanfootball_nfl',
      league: 'NFL',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      homeAbbrev: 'KC',
      awayAbbrev: 'BUF',
      market: 'total',
      lineType: 'total',
      point: 48.5,
      overOdds: -110,
      underOdds: -110,
      homeOdds: 0,
      awayOdds: 0,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    mainMoneyline: {
      id: 'ml-3-main',
      gameId: 'game-3',
      sport: 'americanfootball_nfl',
      league: 'NFL',
      homeTeam: 'Kansas City Chiefs',
      awayTeam: 'Buffalo Bills',
      homeAbbrev: 'KC',
      awayAbbrev: 'BUF',
      market: 'moneyline',
      lineType: 'moneyline',
      point: 0,
      homeOdds: -140,
      awayOdds: +120,
      bookmaker: 'DraftKings',
      bookmakerKey: 'draftkings',
      lastUpdate: new Date().toISOString(),
      isBestOdds: true,
      isAltLine: false
    },
    altLines: [
      {
        id: 'alt-spread-3-1',
        gameId: 'game-3',
        sport: 'americanfootball_nfl',
        league: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        homeAbbrev: 'KC',
        awayAbbrev: 'BUF',
        market: 'spread',
        lineType: 'spread',
        point: -1.5,
        homeOdds: -130,
        awayOdds: +110,
        bookmaker: 'DraftKings',
        bookmakerKey: 'draftkings',
        lastUpdate: new Date().toISOString(),
        isBestOdds: false,
        isAltLine: true,
        altFrom: -2.5,
        confidence: 82,
        edge: 1.8,
        valueScore: 75
      },
      {
        id: 'alt-spread-3-2',
        gameId: 'game-3',
        sport: 'americanfootball_nfl',
        league: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        homeAbbrev: 'KC',
        awayAbbrev: 'BUF',
        market: 'spread',
        lineType: 'spread',
        point: -3.5,
        homeOdds: +105,
        awayOdds: -125,
        bookmaker: 'FanDuel',
        bookmakerKey: 'fanduel',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: -2.5,
        confidence: 79,
        edge: 3.5,
        valueScore: 80
      },
      {
        id: 'alt-total-3-1',
        gameId: 'game-3',
        sport: 'americanfootball_nfl',
        league: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        homeAbbrev: 'KC',
        awayAbbrev: 'BUF',
        market: 'total',
        lineType: 'total',
        point: 45.5,
        overOdds: +115,
        underOdds: -135,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'BetMGM',
        bookmakerKey: 'betmgm',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: 48.5,
        confidence: 71,
        edge: 2.9,
        valueScore: 74
      },
      {
        id: 'alt-total-3-2',
        gameId: 'game-3',
        sport: 'americanfootball_nfl',
        league: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        homeAbbrev: 'KC',
        awayAbbrev: 'BUF',
        market: 'total',
        lineType: 'total',
        point: 51.5,
        overOdds: -115,
        underOdds: -105,
        homeOdds: 0,
        awayOdds: 0,
        bookmaker: 'Caesars',
        bookmakerKey: 'caesars',
        lastUpdate: new Date().toISOString(),
        isBestOdds: true,
        isAltLine: true,
        altFrom: 48.5,
        confidence: 68,
        edge: 1.5,
        valueScore: 70
      }
    ]
  }
];

// =============================================
// MAIN COMPONENT
// =============================================

const AltLinesScreen: React.FC = () => {
  const theme = useTheme();
  const [sportTab, setSportTab] = useState<string>('nba');
  const [marketTab, setMarketTab] = useState<string>('spread');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showOnlyBest, setShowOnlyBest] = useState<boolean>(false);
  const [showOnlyValue, setShowOnlyValue] = useState<boolean>(true);
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('all');

  // Fetch data from your Flask backend
  const { data: altLinesData, isLoading: altLinesLoading } = useQuery({
    queryKey: ['altLines', sportTab],
    queryFn: () => fetchAlternateLines(getSportKey(sportTab)),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60000 // Refetch every minute for live odds
  });

  const { data: playerPropsData, isLoading: propsLoading } = useQuery({
    queryKey: ['playerProps', sportTab],
    queryFn: () => fetchPlayerPropAlternates(sportTab),
    staleTime: 3 * 60 * 1000
  });

  // Use mock data if real data isn't available yet
  const games = altLinesData?.length ? altLinesData : MOCK_ALT_LINES_GAMES.filter(g => {
    if (sportTab === 'nba') return g.league === 'NBA';
    if (sportTab === 'nfl') return g.league === 'NFL';
    return true;
  });

  const getSportKey = (sport: string): string => {
    if (sport === 'nba') return 'basketball_nba';
    if (sport === 'nfl') return 'americanfootball_nfl';
    if (sport === 'mlb') return 'baseball_mlb';
    if (sport === 'nhl') return 'icehockey_nhl';
    return 'basketball_nba';
  };

  // Get alternate lines filtered by market
  const getFilteredAltLines = (game: Game) => {
    let lines = game.altLines.filter(line => line.market === marketTab);
    
    if (showOnlyBest) {
      lines = lines.filter(line => line.isBestOdds);
    }
    
    if (showOnlyValue) {
      lines = lines.filter(line => (line.valueScore || 0) >= 75);
    }
    
    if (selectedBookmaker !== 'all') {
      lines = lines.filter(line => line.bookmakerKey === selectedBookmaker);
    }
    
    return lines.sort((a, b) => {
      if (marketTab === 'spread') {
        return Math.abs(a.point) - Math.abs(b.point);
      } else {
        return a.point - b.point;
      }
    });
  };

  // Calculate payout
  const calculatePayout = (odds: number) => {
    if (odds > 0) {
      return (stakeAmount * odds / 100) + stakeAmount;
    } else {
      return (stakeAmount * 100 / Math.abs(odds)) + stakeAmount;
    }
  };

  // Format odds display
  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  // Format date
  const formatGameTime = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleBookmakerMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleBookmakerMenuClose = (bookmaker?: string) => {
    if (bookmaker) {
      setSelectedBookmaker(bookmaker);
    }
    setAnchorEl(null);
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
          : 'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)',
        color: 'white',
        pt: { xs: 4, md: 6 },
        pb: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          <SwapHoriz sx={{ width: '100%', height: '100%' }} />
        </Box>
        
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, position: 'relative' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Chip 
                icon={<CompareArrows />} 
                label="Alternate Lines & Flex Markets" 
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
                Customize Your <br />Betting Lines
              </Typography>
              <Typography variant="h5" sx={{ 
                opacity: 0.9,
                maxWidth: 600,
                mb: 3
              }}>
                Move spreads, adjust totals, and find better odds across all major sportsbooks
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PriceCheck sx={{ fontSize: 20 }} />
                  <Typography>Better Odds Available</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalOffer sx={{ fontSize: 20 }} />
                  <Typography>+EV Line Moves</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Casino sx={{ fontSize: 20 }} />
                  <Typography>6 Sportsbooks Compared</Typography>
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
                <Typography variant="subtitle1" gutterBottom>
                  Current Best Alternate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="rgba(255,255,255,0.8)">Lakers -5.5</Typography>
                    <Typography variant="h5" fontWeight="bold" color="#4caf50">
                      +120
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="rgba(255,255,255,0.8)">vs Main -3.5</Typography>
                    <Typography variant="body2" sx={{ textDecoration: 'line-through', opacity: 0.7 }}>-110</Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={82} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' }
                  }} 
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.8)' }}>
                  Value Score: 82 · +4.5% Edge
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, mt: -4 }}>
        {/* Sport Selection */}
        <Paper sx={{ p: 1, mb: 3, borderRadius: 3, display: 'inline-block' }}>
          <ToggleButtonGroup
            value={sportTab}
            exclusive
            onChange={(_, value) => value && setSportTab(value)}
            sx={{
              '& .MuiToggleButton-root': {
                px: 3,
                py: 1,
                borderRadius: 2,
                border: 'none',
                '&.Mui-selected': {
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
                  }
                }
              }
            }}
          >
            <ToggleButton value="nba">
              <SportsBasketball sx={{ mr: 1 }} />
              NBA
            </ToggleButton>
            <ToggleButton value="nfl">
              <SportsFootball sx={{ mr: 1 }} />
              NFL
            </ToggleButton>
            <ToggleButton value="mlb">
              <SportsBaseball sx={{ mr: 1 }} />
              MLB
            </ToggleButton>
            <ToggleButton value="nhl">
              <SportsHockey sx={{ mr: 1 }} />
              NHL
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* Market Tabs */}
        <Paper sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
          <Tabs 
            value={marketTab} 
            onChange={(_, v) => setMarketTab(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': { minHeight: 64, fontWeight: 600 },
              '& .Mui-selected': { color: theme.palette.primary.main }
            }}
          >
            <Tab icon={<ShowChart />} iconPosition="start" label="Alternate Spreads" value="spread" />
            <Tab icon={<Timeline />} iconPosition="start" label="Alternate Totals" value="total" />
            <Tab icon={<BarChart />} iconPosition="start" label="Enhanced Moneylines" value="moneyline" />
          </Tabs>
        </Paper>

        {/* Filters Bar */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Filters:
            </Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showOnlyBest} 
                  onChange={(e) => setShowOnlyBest(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label="Best odds only"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={showOnlyValue} 
                  onChange={(e) => setShowOnlyValue(e.target.checked)}
                  color="success"
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Savings sx={{ fontSize: 18, color: theme.palette.success.main }} />
                  <Typography variant="body2">Value plays (75+ score)</Typography>
                </Box>
              }
            />
            
            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowDropDown />}
              onClick={handleBookmakerMenuOpen}
            >
              {selectedBookmaker === 'all' ? 'All Books' : selectedBookmaker}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => handleBookmakerMenuClose()}
            >
              <MenuItem onClick={() => handleBookmakerMenuClose('all')}>
                <ListItemText>All Sportsbooks</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleBookmakerMenuClose('draftkings')}>
                <ListItemIcon>
                  <CheckCircle fontSize="small" color={selectedBookmaker === 'draftkings' ? 'primary' : 'disabled'} />
                </ListItemIcon>
                <ListItemText>DraftKings</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleBookmakerMenuClose('fanduel')}>
                <ListItemIcon>
                  <CheckCircle fontSize="small" color={selectedBookmaker === 'fanduel' ? 'primary' : 'disabled'} />
                </ListItemIcon>
                <ListItemText>FanDuel</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleBookmakerMenuClose('betmgm')}>
                <ListItemIcon>
                  <CheckCircle fontSize="small" color={selectedBookmaker === 'betmgm' ? 'primary' : 'disabled'} />
                </ListItemIcon>
                <ListItemText>BetMGM</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleBookmakerMenuClose('caesars')}>
                <ListItemIcon>
                  <CheckCircle fontSize="small" color={selectedBookmaker === 'caesars' ? 'primary' : 'disabled'} />
                </ListItemIcon>
                <ListItemText>Caesars</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Stake:
            </Typography>
            <TextField
              size="small"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ width: 100 }}
            />
          </Box>
        </Paper>

        {/* Loading State */}
        {altLinesLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Games Grid */}
        {!altLinesLoading && games.map((game) => {
          const altLines = getFilteredAltLines(game);
          if (altLines.length === 0) return null;
          
          return (
            <Fade in key={game.id}>
              <Card sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
                {/* Game Header */}
                <Box sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h5">{game.awayFlag}</Typography>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Away</Typography>
                            <Typography variant="h6">{game.awayTeam}</Typography>
                            <Typography variant="caption" color="text.secondary">{game.awayAbbrev}</Typography>
                          </Box>
                        </Box>
                        <Typography variant="h5">@</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h5">{game.homeFlag}</Typography>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Home</Typography>
                            <Typography variant="h6">{game.homeTeam}</Typography>
                            <Typography variant="caption" color="text.secondary">{game.homeAbbrev}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary">Main Line</Typography>
                          {marketTab === 'spread' && game.mainSpread && (
                            <Typography variant="body1" fontWeight="bold">
                              {game.mainSpread.point > 0 ? '+' : ''}{game.mainSpread.point} ({formatOdds(game.mainSpread.homeOdds)})
                            </Typography>
                          )}
                          {marketTab === 'total' && game.mainTotal && (
                            <Typography variant="body1" fontWeight="bold">
                              O/U {game.mainTotal.point} ({formatOdds(game.mainTotal.overOdds || -110)})
                            </Typography>
                          )}
                          {marketTab === 'moneyline' && game.mainMoneyline && (
                            <Typography variant="body1" fontWeight="bold">
                              {game.homeAbbrev} {formatOdds(game.mainMoneyline.homeOdds)} · {game.awayAbbrev} {formatOdds(game.mainMoneyline.awayOdds)}
                            </Typography>
                          )}
                        </Box>
                        <Chip 
                          icon={<Schedule />} 
                          label={formatGameTime(game.commenceTime)} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Alternate Lines Table */}
                <CardContent sx={{ p: 0 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                          <TableCell>Line</TableCell>
                          <TableCell>From</TableCell>
                          <TableCell>Odds</TableCell>
                          <TableCell align="center">Bookmaker</TableCell>
                          <TableCell align="center">Confidence</TableCell>
                          <TableCell align="center">Value</TableCell>
                          <TableCell align="center">Edge</TableCell>
                          <TableCell align="center">Payout ($100)</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {altLines.map((line) => (
                          <TableRow 
                            key={line.id} 
                            hover
                            sx={{ 
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                              ...((line.valueScore || 0) >= 80 && {
                                bgcolor: alpha(theme.palette.success.main, 0.05),
                                '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) }
                              })
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight="bold">
                                  {marketTab === 'spread' && (
                                    <>
                                      {line.homeAbbrev} {line.point > 0 ? '+' : ''}{line.point}
                                    </>
                                  )}
                                  {marketTab === 'total' && (
                                    <>
                                      {line.point}
                                    </>
                                  )}
                                  {marketTab === 'moneyline' && (
                                    <>Moneyline</>
                                  )}
                                </Typography>
                                {line.isBestOdds && (
                                  <Chip 
                                    label="Best" 
                                    size="small" 
                                    color="primary" 
                                    sx={{ height: 20, fontSize: '0.6rem' }} 
                                  />
                                )}
                                {(line.valueScore || 0) >= 80 && (
                                  <Chip 
                                    icon={<Star sx={{ fontSize: 12 }} />}
                                    label="Value" 
                                    size="small" 
                                    color="success" 
                                    sx={{ height: 20, fontSize: '0.6rem' }} 
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {line.altFrom && (
                                <Typography variant="caption" color="text.secondary">
                                  {marketTab === 'spread' && `${line.altFrom > 0 ? '+' : ''}${line.altFrom}`}
                                  {marketTab === 'total' && line.altFrom}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box>
                                {marketTab === 'spread' && (
                                  <>
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      {line.homeAbbrev} {formatOdds(line.homeOdds)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {line.awayAbbrev} {formatOdds(line.awayOdds)}
                                    </Typography>
                                  </>
                                )}
                                {marketTab === 'total' && (
                                  <>
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      Over {formatOdds(line.overOdds || -110)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Under {formatOdds(line.underOdds || -110)}
                                    </Typography>
                                  </>
                                )}
                                {marketTab === 'moneyline' && (
                                  <Typography variant="body2" fontWeight="bold" color="success.main">
                                    {formatOdds(line.homeOdds)} / {formatOdds(line.awayOdds)}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={line.bookmaker} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {line.confidence || 70}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={line.confidence || 70} 
                                sx={{ 
                                  width: 60, 
                                  mx: 'auto', 
                                  mt: 0.5,
                                  height: 4, 
                                  borderRadius: 2,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: (line.confidence || 70) >= 80 
                                      ? theme.palette.success.main 
                                      : (line.confidence || 70) >= 70 
                                      ? theme.palette.primary.main 
                                      : theme.palette.warning.main
                                  }
                                }} 
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="bold">
                                {line.valueScore || 70}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">/100</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {line.edge ? (
                                <Chip 
                                  label={`+${line.edge.toFixed(1)}%`} 
                                  size="small" 
                                  color={line.edge > 5 ? 'success' : line.edge > 3 ? 'primary' : 'default'}
                                  sx={{ fontWeight: 'bold' }}
                                />
                              ) : (
                                <Typography variant="caption" color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="bold">
                                ${calculatePayout(marketTab === 'spread' ? line.homeOdds : line.overOdds || -110).toFixed(0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Button 
                                size="small" 
                                variant={(line.valueScore || 0) >= 80 ? 'contained' : 'outlined'}
                                color={(line.valueScore || 0) >= 80 ? 'success' : 'primary'}
                                sx={{ minWidth: 80 }}
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
            </Fade>
          );
        })}

        {/* No Results */}
        {!altLinesLoading && games.length === 0 && (
          <Paper sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
            <CompareArrows sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Alternate Lines Available
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              There are currently no {marketTab === 'spread' ? 'alternate spreads' : 'alternate totals'} available for {sportTab.toUpperCase()} games.
            </Typography>
            <Button variant="outlined" onClick={() => setMarketTab('spread')}>
              View Standard Lines
            </Button>
          </Paper>
        )}

        {/* Educational Footer */}
        <Paper sx={{ mt: 6, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Understanding Alternate Lines
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Alternate lines allow you to adjust the point spread or game total to get better odds. 
                Moving the line increases potential payout but decreases win probability. Our value score 
                identifies lines with positive expected value (+EV) based on the difference from market consensus.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip icon={<CheckCircle />} label="Live odds via The Odds API" size="small" variant="outlined" />
                <Chip icon={<Psychology />} label="AI-powered value detection" size="small" variant="outlined" />
                <Chip icon={<CompareArrows />} label="6 sportsbooks compared" size="small" variant="outlined" />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date().toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data sources: The Odds API, PrizePicks API
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default AltLinesScreen;
