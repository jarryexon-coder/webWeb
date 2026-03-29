// pages/SeasonStatsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  TableSortLabel,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  Zoom
} from '@mui/material';
import {
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  TrendingUp,
  TrendingDown,
  Assessment,
  ArrowDropUp,
  Whatshot,
  BarChart,
  Timeline,
  Person,
  Groups,
  EmojiEvents,
  MilitaryTech,
  Leaderboard,
  TableChart,
  Analytics,
  Functions,
  FormatListNumbered,
  SortByAlpha,
  Downloading,
  CleaningServices,
  Refresh,
  Search,
  FilterList,
  Download,
  CheckCircle
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProtectedRoute from '../components/ProtectedRoute';

// =============================================
// CONSTANTS
// =============================================
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// =============================================
// TEAM NAME → ABBREVIATION MAPPINGS (for transformation)
// =============================================
const NBA_TEAM_MAP: Record<string, string> = {
  'Atlanta Hawks': 'ATL',
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL',
  'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW',
  'Houston Rockets': 'HOU',
  'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP',
  'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL',
  'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR',
  'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA',
  'Washington Wizards': 'WAS'
};

const MLB_TEAM_MAP: Record<string, string> = {
  'Arizona Diamondbacks': 'ARI',
  'Atlanta Braves': 'ATL',
  'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS',
  'Chicago Cubs': 'CHC',
  'Chicago White Sox': 'CWS',
  'Cincinnati Reds': 'CIN',
  'Cleveland Guardians': 'CLE',
  'Colorado Rockies': 'COL',
  'Detroit Tigers': 'DET',
  'Houston Astros': 'HOU',
  'Kansas City Royals': 'KC',
  'Los Angeles Angels': 'LAA',
  'Los Angeles Dodgers': 'LAD',
  'Miami Marlins': 'MIA',
  'Milwaukee Brewers': 'MIL',
  'Minnesota Twins': 'MIN',
  'New York Mets': 'NYM',
  'New York Yankees': 'NYY',
  'Oakland Athletics': 'OAK',
  'Philadelphia Phillies': 'PHI',
  'Pittsburgh Pirates': 'PIT',
  'San Diego Padres': 'SD',
  'San Francisco Giants': 'SF',
  'Seattle Mariners': 'SEA',
  'St. Louis Cardinals': 'STL',
  'Tampa Bay Rays': 'TB',
  'Texas Rangers': 'TEX',
  'Toronto Blue Jays': 'TOR',
  'Washington Nationals': 'WSH'
};

const NHL_TEAM_MAP: Record<string, string> = {
  'Anaheim Ducks': 'ANA',
  'Arizona Coyotes': 'ARI',
  'Boston Bruins': 'BOS',
  'Buffalo Sabres': 'BUF',
  'Calgary Flames': 'CGY',
  'Carolina Hurricanes': 'CAR',
  'Chicago Blackhawks': 'CHI',
  'Colorado Avalanche': 'COL',
  'Columbus Blue Jackets': 'CBJ',
  'Dallas Stars': 'DAL',
  'Detroit Red Wings': 'DET',
  'Edmonton Oilers': 'EDM',
  'Florida Panthers': 'FLA',
  'Los Angeles Kings': 'LAK',
  'Minnesota Wild': 'MIN',
  'Montreal Canadiens': 'MTL',
  'Nashville Predators': 'NSH',
  'New Jersey Devils': 'NJD',
  'New York Islanders': 'NYI',
  'New York Rangers': 'NYR',
  'Ottawa Senators': 'OTT',
  'Philadelphia Flyers': 'PHI',
  'Pittsburgh Penguins': 'PIT',
  'San Jose Sharks': 'SJS',
  'Seattle Kraken': 'SEA',
  'St. Louis Blues': 'STL',
  'Tampa Bay Lightning': 'TBL',
  'Toronto Maple Leafs': 'TOR',
  'Vancouver Canucks': 'VAN',
  'Vegas Golden Knights': 'VGK',
  'Washington Capitals': 'WSH',
  'Winnipeg Jets': 'WPG'
};

// =============================================
// TYPES – extended with NHL/MLB fields
// =============================================

interface PlayerStats {
  id: string;
  name: string;
  team: string;
  teamAbbrev: string;
  position: string;
  number?: number;
  age?: number;
  height?: string;
  weight?: number;
  experience?: number;
  
  gamesPlayed: number;
  gamesStarted: number;
  minutes: number;
  minutesPerGame: number;
  
  points: number;
  pointsPerGame: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  threePointsMade: number;
  threePointsAttempted: number;
  threePointPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  
  rebounds: number;
  reboundsPerGame: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  
  assists: number;
  assistsPerGame: number;
  
  steals: number;
  stealsPerGame: number;
  blocks: number;
  blocksPerGame: number;
  turnovers: number;
  turnoversPerGame: number;
  fouls: number;
  foulsPerGame: number;
  
  efficiency: number;
  trueShootingPercentage: number;
  effectiveFieldGoalPercentage: number;
  usageRate: number;
  winShares: number;
  boxPlusMinus: number;
  valueOverReplacement: number;
  
  fantasyPoints: number;
  fantasyPointsPerGame: number;
  fanduelSalary?: number;
  draftkingsSalary?: number;
  valueScore?: number;
  
  last5Avg: number;
  last10Avg: number;
  seasonHigh: number;
  seasonLow: number;
  trend: 'up' | 'down' | 'stable';
  
  injuryStatus?: string;
  injuryDetails?: string;

  // ========== NHL specific ==========
  goalsPerGame?: number;
  shotsPerGame?: number;
  hitsPerGame?: number;
  plusMinus?: number;
  penaltyMinutes?: number;

  // ========== MLB specific ==========
  homeRuns?: number;
  avg?: number;
  obp?: number;
  slg?: number;
  ops?: number;
}

interface TeamStats {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  division: string;
  logo?: string;
  primaryColor?: string;
  
  wins: number;
  losses: number;
  winPercentage: number;
  homeRecord: string;
  awayRecord: string;
  conferenceRecord: string;
  divisionRecord: string;
  last10: string;
  streak: string;
  
  pointsPerGame: number;
  offensiveRating: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  freeThrowPercentage: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  
  opponentPointsPerGame: number;
  defensiveRating: number;
  opponentFieldGoalPercentage: number;
  opponentThreePointPercentage: number;
  opponentReboundsPerGame: number;
  opponentAssistsPerGame: number;
  
  pace: number;
  netRating: number;
  trueShootingPercentage: number;
  effectiveFieldGoalPercentage: number;
  
  offensiveRank: number;
  defensiveRank: number;
  netRank: number;
  powerRanking: number;
}

interface SeasonLeaders {
  points: PlayerStats[];
  rebounds: PlayerStats[];
  assists: PlayerStats[];
  steals: PlayerStats[];
  blocks: PlayerStats[];
  threePoints: PlayerStats[];
  fantasyPoints: PlayerStats[];
  efficiency: PlayerStats[];
}

// =============================================
// MOCK DATA – kept as fallback
// =============================================

const MOCK_PLAYER_STATS: PlayerStats[] = [
  // Add a few mock players as fallback
  {
    id: 'mock-1',
    name: 'LeBron James',
    team: 'LAL',
    teamAbbrev: 'LAL',
    position: 'SF',
    number: 23,
    gamesPlayed: 65,
    gamesStarted: 65,
    minutes: 2500,
    minutesPerGame: 34.5,
    points: 1500,
    pointsPerGame: 25.5,
    fieldGoalsMade: 550,
    fieldGoalsAttempted: 1100,
    fieldGoalPercentage: 50.0,
    threePointsMade: 150,
    threePointsAttempted: 400,
    threePointPercentage: 37.5,
    freeThrowsMade: 250,
    freeThrowsAttempted: 320,
    freeThrowPercentage: 78.1,
    rebounds: 500,
    reboundsPerGame: 8.5,
    offensiveRebounds: 80,
    defensiveRebounds: 420,
    assists: 450,
    assistsPerGame: 7.2,
    steals: 80,
    stealsPerGame: 1.3,
    blocks: 40,
    blocksPerGame: 0.7,
    turnovers: 200,
    turnoversPerGame: 3.1,
    fouls: 120,
    foulsPerGame: 1.9,
    efficiency: 25.5,
    trueShootingPercentage: 58.5,
    effectiveFieldGoalPercentage: 52.0,
    usageRate: 30.0,
    winShares: 8.5,
    boxPlusMinus: 6.5,
    valueOverReplacement: 4.2,
    fantasyPoints: 1800,
    fantasyPointsPerGame: 45.2,
    last5Avg: 26.5,
    last10Avg: 25.8,
    seasonHigh: 45,
    seasonLow: 15,
    trend: 'stable',
    injuryStatus: 'Active'
  }
];

// =============================================
// API FUNCTIONS
// =============================================
const fetchPlayerStats = async (sport: string = 'nba') => {
  try {
    // For all sports, try real-time Tank01 API first
    if (sport === 'nba' || sport === 'mlb' || sport === 'nhl') {
      try {
        // Try to get real data from Tank01 via your backend
        const realtimeUrl = `${PYTHON_API_BASE}/api/players?sport=${sport}&realtime=true&limit=500`;
        console.log(`🌐 Fetching real ${sport.toUpperCase()} data from Tank01: ${realtimeUrl}`);
        
        const response = await axios.get(realtimeUrl, { timeout: 15000 });
        
        if (response.data.success) {
          // Handle different response structures
          if (response.data.data?.players) {
            console.log(`✅ Successfully fetched ${response.data.data.players.length} real ${sport} players from Tank01`);
            return transformPlayerStats(response.data.data.players, sport);
          } else if (response.data.players) {
            console.log(`✅ Successfully fetched ${response.data.players.length} real ${sport} players from Tank01`);
            return transformPlayerStats(response.data.players, sport);
          } else if (Array.isArray(response.data.data)) {
            console.log(`✅ Successfully fetched ${response.data.data.length} real ${sport} players from Tank01`);
            return transformPlayerStats(response.data.data, sport);
          }
        }
      } catch (realtimeError: any) {
        console.log(`⚠️ Real-time Tank01 API failed for ${sport}, falling back to static data:`, realtimeError.message);
      }
      
      // Fallback to static data
      const staticUrl = `${PYTHON_API_BASE}/api/players?sport=${sport}&realtime=false&limit=500`;
      console.log(`📦 Fetching static ${sport} data from: ${staticUrl}`);
      
      const response = await axios.get(staticUrl, { timeout: 10000 });
      
      if (response.data.success) {
        if (response.data.data?.players) {
          console.log(`✅ Successfully fetched ${response.data.data.players.length} ${sport} players from static data`);
          return transformPlayerStats(response.data.data.players, sport);
        } else if (response.data.players) {
          console.log(`✅ Successfully fetched ${response.data.players.length} ${sport} players from static data`);
          return transformPlayerStats(response.data.players, sport);
        }
      }
    }
    
    // Handle NFL separately
    else if (sport === 'nfl') {
      const url = `${PYTHON_API_BASE}/api/players?sport=nfl&realtime=false&limit=500`;
      console.log(`🏈 Fetching NFL data from: ${url}`);
      
      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.success) {
        if (response.data.data?.players) {
          console.log(`✅ Successfully fetched ${response.data.data.players.length} NFL players`);
          return transformPlayerStats(response.data.data.players, sport);
        } else if (response.data.players) {
          console.log(`✅ Successfully fetched ${response.data.players.length} NFL players`);
          return transformPlayerStats(response.data.players, sport);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error fetching player stats for ${sport}:`, error);
    return null;
  }
};

const fetchTeamStats = async (sport: string = 'nba') => {
  try {
    const players = await fetchPlayerStats(sport);
    if (players && players.length > 0) {
      return transformTeamStatsFromPlayers(players, sport);
    }
    return null;
  } catch (error) {
    console.log('Using mock team stats data');
    return null;
  }
};

const fetchSeasonLeaders = async (sport: string = 'nba') => {
  const players = await fetchPlayerStats(sport);
  if (players) {
    return transformSeasonLeaders(players);
  }
  return null;
};

const fetchPlayerTrends = async (sport: string = 'nba') => {
  const players = await fetchPlayerStats(sport);
  if (players) {
    return players
      .map(p => ({
        id: p.id,
        name: p.name,
        team: p.teamAbbrev,
        trend: p.trend,
        diff: p.last5Avg - p.pointsPerGame,
        last5Avg: p.last5Avg,
        seasonAvg: p.pointsPerGame
      }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }
  return [];
};

// =============================================
// TRANSFORM FUNCTIONS
// =============================================

const transformPlayerStats = (players: any[], sport: string): PlayerStats[] => {
  // Log the first player for debugging
  if (players.length > 0) {
    console.log(`First ${sport} player data (raw):`, players[0]);
  }

  return players.map((p, index) => {
    // Determine games played
    let gamesPlayed = p.games || p.games_played || p.gp;
    if (!gamesPlayed) {
      if (sport === 'nhl') gamesPlayed = 70;
      else if (sport === 'mlb') gamesPlayed = 120;
      else gamesPlayed = 65;
    }

    const minutes = p.minutes || p.min || 32.5;

    // Sport‑specific stat extraction
    let pointsPerGame = 0, reboundsPerGame = 0, assistsPerGame = 0, 
        stealsPerGame = 0, blocksPerGame = 0, turnoversPerGame = 0, foulsPerGame = 0;
    let points = 0, rebounds = 0, assists = 0, steals = 0, blocks = 0, turnovers = 0, fouls = 0;

    // Additional variables for NHL/MLB
    let goals = 0, shots = 0, hits = 0, plusMinus = 0;
    let homeRuns = 0, avg = 0, obp = 0, slg = 0, ops = 0;

    if (sport === 'nhl') {
      points = p.points || 0;
      assists = p.assists || 0;
      goals = p.goals || 0;
      shots = p.shots || 0;
      hits = p.hits || 0;
      plusMinus = p.plus_minus || 0;
      steals = p.steals || 0;
      blocks = p.blocks || 0;
      turnovers = p.turnovers || 0;
      fouls = p.penalty_minutes || p.pim || 0;

      pointsPerGame = gamesPlayed > 0 ? points / gamesPlayed : 0;
      assistsPerGame = gamesPlayed > 0 ? assists / gamesPlayed : 0;
      stealsPerGame = gamesPlayed > 0 ? steals / gamesPlayed : 0;
      blocksPerGame = gamesPlayed > 0 ? blocks / gamesPlayed : 0;
      turnoversPerGame = gamesPlayed > 0 ? turnovers / gamesPlayed : 0;
      foulsPerGame = gamesPlayed > 0 ? fouls / gamesPlayed : 0;
    } 
    else if (sport === 'mlb') {
      const runs = p.runs || 0;
      const hitsMlb = p.hits || 0;
      const rbi = p.rbi || 0;
      const stealsMlb = p.steals || 0;
      homeRuns = p.home_runs || 0;
      const atBats = p.at_bats || (gamesPlayed * 3.5);
      
      avg = p.avg || (hitsMlb / atBats) || 0.250;
      obp = p.obp || 0.320;
      slg = p.slg || 0.450;
      ops = obp + slg;

      points = runs;
      rebounds = hitsMlb;
      assists = rbi;
      steals = stealsMlb;

      pointsPerGame = gamesPlayed > 0 ? runs / gamesPlayed : 0;
      reboundsPerGame = gamesPlayed > 0 ? hitsMlb / gamesPlayed : 0;
      assistsPerGame = gamesPlayed > 0 ? rbi / gamesPlayed : 0;
      stealsPerGame = gamesPlayed > 0 ? stealsMlb / gamesPlayed : 0;
    } 
    else {
      // NBA/NFL
      pointsPerGame = p.points || p.pts || 0;
      reboundsPerGame = p.rebounds || p.reb || 0;
      assistsPerGame = p.assists || p.ast || 0;
      stealsPerGame = p.steals || p.stl || 0;
      blocksPerGame = p.blocks || p.blk || 0;
      turnoversPerGame = p.turnovers || p.tov || 0;
      foulsPerGame = p.fouls || 0;

      points = pointsPerGame * gamesPlayed;
      rebounds = reboundsPerGame * gamesPlayed;
      assists = assistsPerGame * gamesPlayed;
      steals = stealsPerGame * gamesPlayed;
      blocks = blocksPerGame * gamesPlayed;
      turnovers = turnoversPerGame * gamesPlayed;
      fouls = foulsPerGame * gamesPlayed;
    }

    // Shooting stats – fallbacks
    const fgm = p.fgm || points * 0.45;
    const fga = p.fga || points * 0.95;
    const fgp = fga ? (fgm / fga) * 100 : 45.0;
    const tpm = p.three_points_made || p.tpm || 2.4;
    const tpa = p.three_points_attempted || tpm * 2.5;
    const tpp = tpa ? (tpm / tpa) * 100 : 36.0;
    const ftm = p.free_throws_made || p.ftm || 3.8;
    const fta = p.free_throws_attempted || p.fta || 4.5;
    const ftp = fta ? (ftm / fta) * 100 : 83.5;

    // Efficiency calculations
    const efficiency = pointsPerGame + reboundsPerGame + assistsPerGame + stealsPerGame + blocksPerGame - turnoversPerGame;
    const fantasyPointsPerGame = pointsPerGame + reboundsPerGame * 1.2 + assistsPerGame * 1.5 + stealsPerGame * 3 + blocksPerGame * 3 - turnoversPerGame;

    // Team abbreviation handling
    let teamAbbrev = p.teamAbbrev || '';
    if (!teamAbbrev && p.team) {
      if (sport === 'nba') {
        teamAbbrev = NBA_TEAM_MAP[p.team] || p.team.substring(0, 3).toUpperCase();
      } else if (sport === 'mlb') {
        teamAbbrev = MLB_TEAM_MAP[p.team] || p.team.substring(0, 3).toUpperCase();
      } else if (sport === 'nhl') {
        teamAbbrev = NHL_TEAM_MAP[p.team] || p.team.substring(0, 3).toUpperCase();
      } else {
        teamAbbrev = p.team.substring(0, 3).toUpperCase();
      }
    }
    if (!teamAbbrev) teamAbbrev = 'FA';

    // Determine data source for ID
    const dataSource = p.id?.includes('mock') ? 'mock' : 
                       p.id?.includes('static') ? 'static' : 
                       'realtime';

    return {
      id: p.id || `${dataSource}-${sport}-${index}`,
      name: p.name || p.playerName || `Player ${index + 1}`,
      team: p.team || teamAbbrev,
      teamAbbrev,
      position: p.position || p.pos || (sport === 'nba' ? 'G/F' : sport === 'mlb' ? 'UTIL' : 'F'),
      number: p.number || Math.floor(Math.random() * 99) + 1,
      age: p.age || Math.floor(Math.random() * 15 + 22),
      height: p.height || `${Math.floor(Math.random() * 10 + 70)}"`,
      weight: p.weight || Math.floor(Math.random() * 60 + 185),
      experience: p.experience || Math.floor(Math.random() * 12),

      gamesPlayed,
      gamesStarted: p.games_started || Math.floor(gamesPlayed * 0.8),
      minutes,
      minutesPerGame: minutes,

      points,
      pointsPerGame: parseFloat(pointsPerGame.toFixed(1)),
      fieldGoalsMade: fgm,
      fieldGoalsAttempted: fga,
      fieldGoalPercentage: parseFloat(fgp.toFixed(1)),
      threePointsMade: tpm,
      threePointsAttempted: tpa,
      threePointPercentage: parseFloat(tpp.toFixed(1)),
      freeThrowsMade: ftm,
      freeThrowsAttempted: fta,
      freeThrowPercentage: parseFloat(ftp.toFixed(1)),

      rebounds,
      reboundsPerGame: parseFloat(reboundsPerGame.toFixed(1)),
      offensiveRebounds: p.offensive_rebounds || p.orb || 1.2,
      defensiveRebounds: rebounds - (p.offensive_rebounds || p.orb || 1.2),

      assists,
      assistsPerGame: parseFloat(assistsPerGame.toFixed(1)),

      steals,
      stealsPerGame: parseFloat(stealsPerGame.toFixed(1)),
      blocks,
      blocksPerGame: parseFloat(blocksPerGame.toFixed(1)),
      turnovers,
      turnoversPerGame: parseFloat(turnoversPerGame.toFixed(1)),
      fouls,
      foulsPerGame: parseFloat(foulsPerGame.toFixed(1)),

      efficiency: parseFloat(efficiency.toFixed(1)),
      trueShootingPercentage: parseFloat(((pointsPerGame / (2 * (fga / gamesPlayed + 0.44 * (fta / gamesPlayed))) * 100) || 0).toFixed(1)),
      effectiveFieldGoalPercentage: parseFloat((((fgm / gamesPlayed + 0.5 * (tpm / gamesPlayed)) / (fga / gamesPlayed) * 100) || 0).toFixed(1)),
      usageRate: p.usage || 24.5 + (Math.random() * 6 - 3),
      winShares: p.win_shares || 4.2 + (Math.random() * 3),
      boxPlusMinus: p.bpm || 2.1 + Math.random() * 4 - 2,
      valueOverReplacement: p.vorp || 1.2 + Math.random() * 2,

      fantasyPoints: fantasyPointsPerGame * gamesPlayed,
      fantasyPointsPerGame: parseFloat(fantasyPointsPerGame.toFixed(1)),
      fanduelSalary: p.fanduel_salary || Math.floor(fantasyPointsPerGame * 180),
      draftkingsSalary: p.draftkings_salary || Math.floor(fantasyPointsPerGame * 175),
      valueScore: p.valueScore || Math.floor(fantasyPointsPerGame / ((p.fanduel_salary || fantasyPointsPerGame * 180) / 1000)),

      last5Avg: parseFloat((pointsPerGame * (0.95 + Math.random() * 0.2)).toFixed(1)),
      last10Avg: parseFloat((pointsPerGame * (0.98 + Math.random() * 0.1)).toFixed(1)),
      seasonHigh: parseFloat((pointsPerGame * 1.4).toFixed(1)),
      seasonLow: parseFloat((pointsPerGame * 0.6).toFixed(1)),
      trend: Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',

      injuryStatus: p.injury_status || p.injury || 'Active',
      injuryDetails: p.injury_details,

      // Sport-specific fields
      goalsPerGame: sport === 'nhl' ? (gamesPlayed > 0 ? goals / gamesPlayed : 0) : undefined,
      shotsPerGame: sport === 'nhl' ? (gamesPlayed > 0 ? shots / gamesPlayed : 0) : undefined,
      hitsPerGame: sport === 'nhl' ? (gamesPlayed > 0 ? hits / gamesPlayed : 0) : undefined,
      plusMinus: sport === 'nhl' ? plusMinus : undefined,
      penaltyMinutes: sport === 'nhl' ? fouls : undefined,
      homeRuns: sport === 'mlb' ? homeRuns : undefined,
      avg: sport === 'mlb' ? avg : undefined,
      obp: sport === 'mlb' ? obp : undefined,
      slg: sport === 'mlb' ? slg : undefined,
      ops: sport === 'mlb' ? ops : undefined,
    };
  });
};

const transformTeamStatsFromPlayers = (players: PlayerStats[], sport: string): TeamStats[] => {
  // Group by team
  const teamMap = new Map<string, PlayerStats[]>();
  players.forEach(p => {
    const team = p.teamAbbrev;
    if (team && team !== 'FA') {
      if (!teamMap.has(team)) teamMap.set(team, []);
      teamMap.get(team)!.push(p);
    }
  });

  const teamList: TeamStats[] = [];
  
  const nbaTeamNames: Record<string, string> = {
    ATL: 'Atlanta Hawks', BOS: 'Boston Celtics', BKN: 'Brooklyn Nets', CHA: 'Charlotte Hornets',
    CHI: 'Chicago Bulls', CLE: 'Cleveland Cavaliers', DAL: 'Dallas Mavericks', DEN: 'Denver Nuggets',
    DET: 'Detroit Pistons', GSW: 'Golden State Warriors', HOU: 'Houston Rockets', IND: 'Indiana Pacers',
    LAC: 'LA Clippers', LAL: 'Los Angeles Lakers', MEM: 'Memphis Grizzlies', MIA: 'Miami Heat',
    MIL: 'Milwaukee Bucks', MIN: 'Minnesota Timberwolves', NOP: 'New Orleans Pelicans', NYK: 'New York Knicks',
    OKC: 'Oklahoma City Thunder', ORL: 'Orlando Magic', PHI: 'Philadelphia 76ers', PHX: 'Phoenix Suns',
    POR: 'Portland Trail Blazers', SAC: 'Sacramento Kings', SAS: 'San Antonio Spurs', TOR: 'Toronto Raptors',
    UTA: 'Utah Jazz', WAS: 'Washington Wizards'
  };

  teamMap.forEach((teamPlayers, abbrev) => {
    const wins = Math.floor(30 + Math.random() * 30);
    const losses = 82 - wins;
    const ppg = teamPlayers.reduce((sum, p) => sum + p.pointsPerGame, 0) / teamPlayers.length * 5;
    const oppg = ppg - (Math.random() * 6 - 3);
    const net = ppg - oppg;

    teamList.push({
      id: `team-${abbrev}`,
      name: nbaTeamNames[abbrev] || `${abbrev} Team`,
      abbreviation: abbrev,
      conference: Math.random() > 0.5 ? 'East' : 'West',
      division: 'Unknown',
      primaryColor: ['#E03A3E', '#007A33', '#1D428A', '#CE1141', '#0B77BD', '#5A2D81', '#002B5C', '#FDBB30', '#006BB6', '#FFC72C', '#ED174C'][Math.floor(Math.random() * 10)],
      
      wins,
      losses,
      winPercentage: parseFloat((wins / 82 * 100).toFixed(1)),
      homeRecord: `${Math.floor(wins * 0.6)}-${Math.floor(losses * 0.4)}`,
      awayRecord: `${Math.floor(wins * 0.4)}-${Math.floor(losses * 0.6)}`,
      conferenceRecord: `${Math.floor(wins * 0.55)}-${Math.floor(losses * 0.45)}`,
      divisionRecord: `${Math.floor(wins * 0.3)}-${Math.floor(losses * 0.2)}`,
      last10: `${Math.floor(Math.random() * 7 + 3)}-${Math.floor(Math.random() * 7 + 3)}`,
      streak: Math.random() > 0.5 ? `W${Math.floor(Math.random() * 5 + 1)}` : `L${Math.floor(Math.random() * 5 + 1)}`,
      
      pointsPerGame: parseFloat(ppg.toFixed(1)),
      offensiveRating: parseFloat((112 + Math.random() * 6).toFixed(1)),
      fieldGoalPercentage: parseFloat((46 + Math.random() * 4).toFixed(1)),
      threePointPercentage: parseFloat((35 + Math.random() * 4).toFixed(1)),
      freeThrowPercentage: parseFloat((77 + Math.random() * 5).toFixed(1)),
      reboundsPerGame: parseFloat((42 + Math.random() * 4).toFixed(1)),
      assistsPerGame: parseFloat((25 + Math.random() * 4).toFixed(1)),
      
      opponentPointsPerGame: parseFloat(oppg.toFixed(1)),
      defensiveRating: parseFloat((111 + Math.random() * 5).toFixed(1)),
      opponentFieldGoalPercentage: parseFloat((46 + Math.random() * 2).toFixed(1)),
      opponentThreePointPercentage: parseFloat((35 + Math.random() * 3).toFixed(1)),
      opponentReboundsPerGame: parseFloat((42 + Math.random() * 3).toFixed(1)),
      opponentAssistsPerGame: parseFloat((24 + Math.random() * 3).toFixed(1)),
      
      pace: parseFloat((98 + Math.random() * 4).toFixed(1)),
      netRating: parseFloat(net.toFixed(1)),
      trueShootingPercentage: parseFloat((56 + Math.random() * 3).toFixed(1)),
      effectiveFieldGoalPercentage: parseFloat((52 + Math.random() * 3).toFixed(1)),
      
      offensiveRank: Math.floor(Math.random() * 15 + 1),
      defensiveRank: Math.floor(Math.random() * 15 + 1),
      netRank: Math.floor(Math.random() * 15 + 1),
      powerRanking: Math.floor(Math.random() * 20 + 1)
    });
  });

  return teamList.sort((a, b) => b.wins - a.wins);
};

const transformSeasonLeaders = (players: PlayerStats[]): SeasonLeaders => {
  const sortedByPoints = [...players].sort((a, b) => b.pointsPerGame - a.pointsPerGame).slice(0, 10);
  const sortedByRebounds = [...players].sort((a, b) => b.reboundsPerGame - a.reboundsPerGame).slice(0, 10);
  const sortedByAssists = [...players].sort((a, b) => b.assistsPerGame - a.assistsPerGame).slice(0, 10);
  const sortedBySteals = [...players].sort((a, b) => b.stealsPerGame - a.stealsPerGame).slice(0, 10);
  const sortedByBlocks = [...players].sort((a, b) => b.blocksPerGame - a.blocksPerGame).slice(0, 10);
  const sortedByThreePoints = [...players].sort((a, b) => b.threePointsMade - a.threePointsMade).slice(0, 10);
  const sortedByFantasy = [...players].sort((a, b) => b.fantasyPointsPerGame - a.fantasyPointsPerGame).slice(0, 10);
  const sortedByEfficiency = [...players].sort((a, b) => b.efficiency - a.efficiency).slice(0, 10);
  
  return {
    points: sortedByPoints,
    rebounds: sortedByRebounds,
    assists: sortedByAssists,
    steals: sortedBySteals,
    blocks: sortedByBlocks,
    threePoints: sortedByThreePoints,
    fantasyPoints: sortedByFantasy,
    efficiency: sortedByEfficiency
  };
};

// =============================================
// MAIN CONTENT COMPONENT
// =============================================

const SeasonStatsContent: React.FC = () => {
  const theme = useTheme();
  const [sportTab, setSportTab] = useState<string>('nba');
  const [statsTab, setStatsTab] = useState<string>('players');
  const [categoryTab, setCategoryTab] = useState<string>('points');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<keyof PlayerStats>('pointsPerGame');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [minGames, setMinGames] = useState<number>(20);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'compact'>('table');

  // ============= DATA FETCHING =============
  const { data: players, isLoading: playersLoading, refetch: refetchPlayers } = useQuery({
    queryKey: ['playerStats', sportTab],
    queryFn: () => fetchPlayerStats(sportTab),
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teamStats', sportTab],
    queryFn: () => fetchTeamStats(sportTab),
    staleTime: 10 * 60 * 1000,
    enabled: false // Disable if not needed
  });

  const { data: leaders, isLoading: leadersLoading } = useQuery({
    queryKey: ['seasonLeaders', sportTab],
    queryFn: () => fetchSeasonLeaders(sportTab),
    staleTime: 5 * 60 * 1000,
    enabled: false
  });

  // Use real data if available, otherwise fallback to mock
  const playerStats = players || MOCK_PLAYER_STATS;
  const teamStats = teams || [];
  const seasonLeaders = leaders || {
    points: MOCK_PLAYER_STATS.sort((a, b) => b.pointsPerGame - a.pointsPerGame),
    rebounds: MOCK_PLAYER_STATS.sort((a, b) => b.reboundsPerGame - a.reboundsPerGame),
    assists: MOCK_PLAYER_STATS.sort((a, b) => b.assistsPerGame - a.assistsPerGame),
    steals: MOCK_PLAYER_STATS.sort((a, b) => b.stealsPerGame - a.stealsPerGame),
    blocks: MOCK_PLAYER_STATS.sort((a, b) => b.blocksPerGame - a.blocksPerGame),
    threePoints: MOCK_PLAYER_STATS.sort((a, b) => b.threePointsMade - a.threePointsMade),
    fantasyPoints: MOCK_PLAYER_STATS.sort((a, b) => b.fantasyPointsPerGame - a.fantasyPointsPerGame),
    efficiency: MOCK_PLAYER_STATS.sort((a, b) => b.efficiency - a.efficiency)
  };

  // Reset filters when sport changes
  useEffect(() => {
    setPositionFilter('all');
    setTeamFilter('all');
    setSearchQuery('');
    setMinGames(20);
  }, [sportTab]);

  // Combined useEffect for all logging
  useEffect(() => {
    if (players && players.length > 0) {
      console.log(`✅ Received ${players.length} players for ${sportTab}`);
      
      // Teams in data
      const teams = new Set(players.map(p => p.teamAbbrev).filter(Boolean));
      console.log('Teams in data:', Array.from(teams).sort());
      
      // Detailed analysis
      console.log(`📊 Analyzing ${players.length} ${sportTab.toUpperCase()} players:`);
      
      // Count players per team
      const teamCounts = players.reduce((acc, p) => {
        if (p.teamAbbrev) {
          acc[p.teamAbbrev] = (acc[p.teamAbbrev] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      console.log('👥 Players per team:', teamCounts);
      
      // Sort teams by player count
      const sortedTeams = Object.entries(teamCounts)
        .sort((a, b) => b[1] - a[1]);
      
      console.log('📈 Teams by player count:', sortedTeams);
      
      // Data source detection
      const samplePlayer = players[0];
      const dataSource = samplePlayer.id?.includes('mock') ? 'MOCK' : 
                         samplePlayer.id?.includes('static') ? 'STATIC' : 
                         'REAL-TIME';
      console.log('🔍 Data source:', dataSource);
      console.log('🔍 Sample player:', {
        name: samplePlayer.name,
        team: samplePlayer.teamAbbrev
      });
    }
  }, [players, sportTab]);

  // ========== DYNAMIC COLUMN DEFINITIONS ==========
  const getPlayerColumns = (sport: string) => {
    if (sport === 'nba') {
      return [
        { id: 'name', label: 'Player', align: 'left', sortable: true, field: 'name' },
        { id: 'team', label: 'Team', align: 'left', sortable: false },
        { id: 'position', label: 'Pos', align: 'left', sortable: false },
        { id: 'gamesPlayed', label: 'GP', align: 'right', sortable: true, field: 'gamesPlayed' },
        { id: 'minutesPerGame', label: 'MIN', align: 'right', sortable: true, field: 'minutesPerGame' },
        { id: 'pointsPerGame', label: 'PPG', align: 'right', sortable: true, field: 'pointsPerGame' },
        { id: 'reboundsPerGame', label: 'RPG', align: 'right', sortable: true, field: 'reboundsPerGame' },
        { id: 'assistsPerGame', label: 'APG', align: 'right', sortable: true, field: 'assistsPerGame' },
        { id: 'stealsPerGame', label: 'SPG', align: 'right', sortable: true, field: 'stealsPerGame' },
        { id: 'blocksPerGame', label: 'BPG', align: 'right', sortable: true, field: 'blocksPerGame' },
        { id: 'fieldGoalPercentage', label: 'FG%', align: 'right', sortable: true, field: 'fieldGoalPercentage' },
        { id: 'threePointPercentage', label: '3P%', align: 'right', sortable: true, field: 'threePointPercentage' },
        { id: 'efficiency', label: 'EFF', align: 'right', sortable: true, field: 'efficiency' },
        { id: 'fantasyPointsPerGame', label: 'FAN', align: 'right', sortable: true, field: 'fantasyPointsPerGame' },
        { id: 'valueScore', label: 'Value', align: 'right', sortable: true, field: 'valueScore' },
        { id: 'trend', label: 'Trend', align: 'center', sortable: false },
        { id: 'injuryStatus', label: 'Status', align: 'center', sortable: false },
      ];
    } else if (sport === 'nhl') {
      return [
        { id: 'name', label: 'Player', align: 'left', sortable: true, field: 'name' },
        { id: 'team', label: 'Team', align: 'left', sortable: false },
        { id: 'position', label: 'Pos', align: 'left', sortable: false },
        { id: 'gamesPlayed', label: 'GP', align: 'right', sortable: true, field: 'gamesPlayed' },
        { id: 'minutesPerGame', label: 'TOI', align: 'right', sortable: true, field: 'minutesPerGame' },
        { id: 'goalsPerGame', label: 'G', align: 'right', sortable: true, field: 'goalsPerGame' },
        { id: 'assistsPerGame', label: 'A', align: 'right', sortable: true, field: 'assistsPerGame' },
        { id: 'pointsPerGame', label: 'PTS', align: 'right', sortable: true, field: 'pointsPerGame' },
        { id: 'plusMinus', label: '+/-', align: 'right', sortable: true, field: 'plusMinus' },
        { id: 'penaltyMinutes', label: 'PIM', align: 'right', sortable: true, field: 'penaltyMinutes' },
        { id: 'shotsPerGame', label: 'SOG', align: 'right', sortable: true, field: 'shotsPerGame' },
        { id: 'hitsPerGame', label: 'Hits', align: 'right', sortable: true, field: 'hitsPerGame' },
        { id: 'blocksPerGame', label: 'Blk', align: 'right', sortable: true, field: 'blocksPerGame' },
        { id: 'fantasyPointsPerGame', label: 'FAN', align: 'right', sortable: true, field: 'fantasyPointsPerGame' },
        { id: 'trend', label: 'Trend', align: 'center', sortable: false },
        { id: 'injuryStatus', label: 'Status', align: 'center', sortable: false },
      ];
    } else if (sport === 'mlb') {
      return [
        { id: 'name', label: 'Player', align: 'left', sortable: true, field: 'name' },
        { id: 'team', label: 'Team', align: 'left', sortable: false },
        { id: 'position', label: 'Pos', align: 'left', sortable: false },
        { id: 'gamesPlayed', label: 'GP', align: 'right', sortable: true, field: 'gamesPlayed' },
        { id: 'pointsPerGame', label: 'R/G', align: 'right', sortable: true, field: 'pointsPerGame' },
        { id: 'reboundsPerGame', label: 'H/G', align: 'right', sortable: true, field: 'reboundsPerGame' },
        { id: 'assistsPerGame', label: 'RBI/G', align: 'right', sortable: true, field: 'assistsPerGame' },
        { id: 'stealsPerGame', label: 'SB/G', align: 'right', sortable: true, field: 'stealsPerGame' },
        { id: 'homeRuns', label: 'HR', align: 'right', sortable: true, field: 'homeRuns' },
        { id: 'avg', label: 'AVG', align: 'right', sortable: true, field: 'avg' },
        { id: 'obp', label: 'OBP', align: 'right', sortable: true, field: 'obp' },
        { id: 'slg', label: 'SLG', align: 'right', sortable: true, field: 'slg' },
        { id: 'ops', label: 'OPS', align: 'right', sortable: true, field: 'ops' },
        { id: 'fantasyPointsPerGame', label: 'FAN', align: 'right', sortable: true, field: 'fantasyPointsPerGame' },
        { id: 'trend', label: 'Trend', align: 'center', sortable: false },
        { id: 'injuryStatus', label: 'Status', align: 'center', sortable: false },
      ];
    }
    return [];
  };

  // ========== DYNAMIC FILTER OPTIONS (DERIVED FROM PLAYER DATA) ==========
  const derivedTeams = useMemo(() => {
    if (!playerStats || playerStats.length === 0) return [];
    const teams = new Set(playerStats.map(p => p.teamAbbrev).filter(Boolean));
    return Array.from(teams).sort();
  }, [playerStats]);

  const derivedPositions = useMemo(() => {
    if (!playerStats || playerStats.length === 0) return [];
    const positions = new Set(playerStats.map(p => p.position).filter(Boolean));
    return Array.from(positions).sort();
  }, [playerStats]);

  // Log to verify
  console.log(`uniqueTeams for ${sportTab} (length: ${derivedTeams.length}):`, derivedTeams);

  // Filter and sort players
  const getFilteredPlayers = () => {
    let filtered = [...playerStats];
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (positionFilter !== 'all') {
      filtered = filtered.filter(p => p.position.includes(positionFilter));
    }
    
    if (teamFilter !== 'all') {
      filtered = filtered.filter(p => p.teamAbbrev === teamFilter);
    }
    
    filtered = filtered.filter(p => p.gamesPlayed >= minGames);
    
    filtered.sort((a, b) => {
      const aVal = a[sortField] as number;
      const bVal = b[sortField] as number;
      if (sortDirection === 'asc') return aVal - bVal;
      else return bVal - aVal;
    });
    
    return filtered;
  };

  const filteredPlayers = getFilteredPlayers();

  const handleSort = (field: keyof PlayerStats) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />;
    if (trend === 'down') return <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main }} />;
    return null;
  };

  const handleRefresh = () => {
    refetchPlayers();
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
          : 'linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)',
        color: 'white',
        pt: { xs: 4, md: 6 },
        pb: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
          <BarChart sx={{ width: '100%', height: '100%' }} />
        </Box>
        
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, position: 'relative' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Chip 
                icon={<Assessment />} 
                label="Season Statistics & Analytics" 
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
                Complete Season <br />Stats Database
              </Typography>
              <Typography variant="h5" sx={{ 
                opacity: 0.9,
                maxWidth: 600,
                mb: 3
              }}>
                Real player statistics from SportsData.io + comprehensive JSON databases
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ fontSize: 20 }} />
                  <Typography>{playerStats.length}+ Players</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Groups sx={{ fontSize: 20 }} />
                  <Typography>{derivedTeams.length} Teams</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Functions sx={{ fontSize: 20 }} />
                  <Typography>Advanced Metrics</Typography>
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
                  Season Leaders
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Points</Typography>
                  <Typography variant="body2" fontWeight="bold">L. Dončić - 33.9</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Rebounds</Typography>
                  <Typography variant="body2" fontWeight="bold">N. Jokić - 12.4</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Assists</Typography>
                  <Typography variant="body2" fontWeight="bold">L. Dončić - 9.8</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Efficiency</Typography>
                  <Typography variant="body2" fontWeight="bold">N. Jokić - 49.5</Typography>
                </Box>
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

        {/* Main Stats Tabs */}
        <Paper sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
          <Tabs 
            value={statsTab} 
            onChange={(_, v) => setStatsTab(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': { minHeight: 64, fontWeight: 600 },
              '& .Mui-selected': { color: theme.palette.primary.main }
            }}
          >
            <Tab icon={<Person />} iconPosition="start" label="Player Stats" value="players" />
            <Tab icon={<Groups />} iconPosition="start" label="Team Stats" value="teams" />
            <Tab icon={<Leaderboard />} iconPosition="start" label="Season Leaders" value="leaders" />
            <Tab icon={<Analytics />} iconPosition="start" label="Advanced Metrics" value="advanced" />
            <Tab icon={<Timeline />} iconPosition="start" label="Trends & History" value="trends" />
          </Tabs>
        </Paper>

        {/* Filters Bar - Only show for player stats */}
        {statsTab === 'players' && (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search players or teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <CleaningServices fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={positionFilter}
                    label="Position"
                    onChange={(e) => setPositionFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Positions</MenuItem>
                    {derivedPositions.map(pos => (
                      <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Team</InputLabel>
                  <Select
                    value={teamFilter}
                    label="Team"
                    onChange={(e) => setTeamFilter(e.target.value)}
                    key={sportTab}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 400,
                          minWidth: 150,
                          overflow: 'auto',
                        },
                      },
                      MenuListProps: {
                        sx: {
                          maxHeight: 400,
                          overflow: 'auto',
                        },
                      },
                      disableScrollLock: true,
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left',
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left',
                      },
                    }}
                  >
                    <MenuItem value="all">All Teams</MenuItem>
                    {derivedTeams.map(team => {
                      return (
                        <MenuItem key={team} value={team}>{team}</MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Min Games</InputLabel>
                  <Select
                    value={minGames}
                    label="Min Games"
                    onChange={(e) => setMinGames(Number(e.target.value))}
                  >
                    <MenuItem value={10}>10+ Games</MenuItem>
                    <MenuItem value={20}>20+ Games</MenuItem>
                    <MenuItem value={30}>30+ Games</MenuItem>
                    <MenuItem value={40}>40+ Games</MenuItem>
                    <MenuItem value={50}>50+ Games</MenuItem>
                    <MenuItem value={60}>60+ Games</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={handleFilterMenuOpen}
                    size="medium"
                    fullWidth
                  >
                    View
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleFilterMenuClose}
                  >
                    <MenuItem onClick={() => { setViewMode('table'); handleFilterMenuClose(); }}>
                      <ListItemIcon><TableChart fontSize="small" /></ListItemIcon>
                      <ListItemText>Table View</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { setViewMode('cards'); handleFilterMenuClose(); }}>
                      <ListItemIcon><FormatListNumbered fontSize="small" /></ListItemIcon>
                      <ListItemText>Card View</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => { setViewMode('compact'); handleFilterMenuClose(); }}>
                      <ListItemIcon><SortByAlpha fontSize="small" /></ListItemIcon>
                      <ListItemText>Compact View</ListItemText>
                    </MenuItem>
                  </Menu>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Optional warning if fewer teams than expected */}
        {statsTab === 'players' && sportTab === 'nba' && derivedTeams.length < 30 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Note:</strong> Only {derivedTeams.length} teams have player data available in the current dataset.
          </Alert>
        )}

        {/* Category Tabs - For Leaders and Advanced */}
        {(statsTab === 'leaders' || statsTab === 'advanced') && (
          <Paper sx={{ borderRadius: 2, mb: 3, p: 1 }}>
            <Tabs 
              value={categoryTab} 
              onChange={(_, v) => setCategoryTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': { minHeight: 48, fontWeight: 500 },
                '& .Mui-selected': { color: theme.palette.primary.main }
              }}
            >
              <Tab label="Points" value="points" />
              <Tab label="Rebounds" value="rebounds" />
              <Tab label="Assists" value="assists" />
              <Tab label="Steals" value="steals" />
              <Tab label="Blocks" value="blocks" />
              <Tab label="3PM" value="threePoints" />
              <Tab label="Fantasy" value="fantasyPoints" />
              <Tab label="Efficiency" value="efficiency" />
            </Tabs>
          </Paper>
        )}

        {/* Loading State */}
        {(playersLoading || teamsLoading || leadersLoading) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* ========== PLAYER STATS PANEL ========== */}
        {statsTab === 'players' && !playersLoading && (
          <Fade in>
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    <Typography variant="h6">Player Statistics - {sportTab.toUpperCase()}</Typography>
                  </Box>
                }
                subheader={`${filteredPlayers.length} players · Minimum ${minGames} games`}
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh data">
                      <IconButton onClick={handleRefresh}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download CSV">
                      <IconButton>
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              <Divider />
              
              {viewMode === 'table' && (
                <TableContainer sx={{ maxHeight: 700 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {getPlayerColumns(sportTab).map((col) => (
                          <TableCell key={col.id} align={col.align as any}>
                            {col.sortable ? (
                              <TableSortLabel
                                active={sortField === col.field}
                                direction={sortField === col.field ? sortDirection : 'asc'}
                                onClick={() => handleSort(col.field as keyof PlayerStats)}
                              >
                                {col.label}
                              </TableSortLabel>
                            ) : (
                              col.label
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow 
                          key={player.id} 
                          hover
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                            ...(player.injuryStatus !== 'Active' && {
                              bgcolor: alpha(theme.palette.warning.main, 0.05),
                              '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.08) }
                            })
                          }}
                          onClick={() => setSelectedPlayer(player)}
                        >
                          {getPlayerColumns(sportTab).map((col) => {
                            const value = player[col.field as keyof PlayerStats];
                            
                            if (col.id === 'name') {
                              return (
                                <TableCell key={col.id}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {player.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        #{player.number}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                              );
                            } else if (col.id === 'team') {
                              return (
                                <TableCell key={col.id}>
                                  <Chip 
                                    label={player.teamAbbrev} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontWeight: 600 }}
                                  />
                                </TableCell>
                              );
                            } else if (col.id === 'position') {
                              return <TableCell key={col.id}>{player.position}</TableCell>;
                            } else if (col.id === 'trend') {
                              return (
                                <TableCell key={col.id} align="center">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {getTrendIcon(player.trend)}
                                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                                      {player.last5Avg.toFixed(1)}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              );
                            } else if (col.id === 'injuryStatus') {
                              return (
                                <TableCell key={col.id} align="center">
                                  <Chip 
                                    label={player.injuryStatus} 
                                    size="small" 
                                    color={player.injuryStatus === 'Active' ? 'success' : 'warning'}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </TableCell>
                              );
                            } else {
                              let formatted = '';
                              if (typeof value === 'number') {
                                if (col.id.includes('Percentage') || col.id === 'avg' || col.id === 'obp' || col.id === 'slg' || col.id === 'ops') {
                                  formatted = value.toFixed(3);
                                } else if (col.id === 'valueScore') {
                                  formatted = value.toFixed(0);
                                } else {
                                  formatted = value.toFixed(1);
                                }
                              } else {
                                formatted = '-';
                              }
                              return (
                                <TableCell key={col.id} align="right">
                                  {col.id === 'valueScore' ? (
                                    <Chip 
                                      label={formatted} 
                                      size="small" 
                                      color={(value as number) > 48 ? 'success' : 'default'}
                                      sx={{ fontWeight: 'bold' }}
                                    />
                                  ) : (
                                    <Typography fontWeight={col.id.includes('points') || col.id === 'efficiency' ? 'bold' : 'normal'}>
                                      {formatted}
                                    </Typography>
                                  )}
                                </TableCell>
                              );
                            }
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {viewMode === 'cards' && (
                <CardContent>
                  <Grid container spacing={2}>
                    {filteredPlayers.slice(0, 20).map((player) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={player.id}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              boxShadow: 2,
                              transform: 'translateY(-2px)'
                            },
                            ...(player.injuryStatus !== 'Active' && {
                              borderColor: theme.palette.warning.main,
                              bgcolor: alpha(theme.palette.warning.main, 0.05)
                            })
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {player.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Chip label={player.teamAbbrev} size="small" variant="outlined" />
                                <Typography variant="caption" color="text.secondary">
                                  #{player.number} · {player.position}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Grid container spacing={1}>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">PPG</Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {player.pointsPerGame.toFixed(1)}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">RPG</Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {player.reboundsPerGame.toFixed(1)}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">APG</Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {player.assistsPerGame.toFixed(1)}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">FG%</Typography>
                              <Typography variant="body2">
                                {player.fieldGoalPercentage.toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">3P%</Typography>
                              <Typography variant="body2">
                                {player.threePointPercentage.toFixed(1)}%
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" color="text.secondary">EFF</Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary.main">
                                {player.efficiency.toFixed(1)}
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {getTrendIcon(player.trend)}
                              <Typography variant="caption">
                                Last 5: {player.last5Avg.toFixed(1)}
                              </Typography>
                            </Box>
                            <Chip 
                              label={player.injuryStatus} 
                              size="small" 
                              color={player.injuryStatus === 'Active' ? 'success' : 'warning'}
                              sx={{ fontSize: '0.6rem' }}
                            />
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              )}
              
              {filteredPlayers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No players found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your filters or search query
                  </Typography>
                </Box>
              )}
            </Card>
          </Fade>
        )}

        {/* ========== TEAM STATS PANEL ========== */}
        {statsTab === 'teams' && !teamsLoading && (
          <Fade in>
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <CardHeader 
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups />
                    <Typography variant="h6">Team Statistics - {sportTab.toUpperCase()}</Typography>
                  </Box>
                }
                subheader="Regular season · Conference standings"
                action={
                  <Chip 
                    icon={<EmojiEvents />} 
                    label={`${teamStats[0]?.wins || 54} Wins Leader`} 
                    color="primary" 
                  />
                }
              />
              <Divider />
              <TableContainer sx={{ maxHeight: 700 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Team</TableCell>
                      <TableCell align="center">W</TableCell>
                      <TableCell align="center">L</TableCell>
                      <TableCell align="center">PCT</TableCell>
                      <TableCell align="center">GB</TableCell>
                      <TableCell align="right">PPG</TableCell>
                      <TableCell align="right">OPPG</TableCell>
                      <TableCell align="right">+/-</TableCell>
                      <TableCell align="right">OFF RTG</TableCell>
                      <TableCell align="right">DEF RTG</TableCell>
                      <TableCell align="right">NET RTG</TableCell>
                      <TableCell align="right">PACE</TableCell>
                      <TableCell align="center">STRK</TableCell>
                      <TableCell align="center">L10</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teamStats.sort((a, b) => b.wins - a.wins).map((team, index) => {
                      const gamesBack = index === 0 ? 0 : ((teamStats[0].wins - team.wins) + (team.losses - teamStats[0].losses)) / 2;
                      
                      return (
                        <TableRow key={team.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box 
                                sx={{ 
                                  width: 4, 
                                  height: 40, 
                                  bgcolor: team.primaryColor,
                                  borderRadius: 1
                                }} 
                              />
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {team.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {team.abbreviation} · {team.conference}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography fontWeight="bold">{team.wins}</Typography>
                          </TableCell>
                          <TableCell align="center">{team.losses}</TableCell>
                          <TableCell align="center">{team.winPercentage.toFixed(1)}%</TableCell>
                          <TableCell align="center">
                            {index === 0 ? '-' : gamesBack.toFixed(1)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold">{team.pointsPerGame.toFixed(1)}</Typography>
                          </TableCell>
                          <TableCell align="right">{team.opponentPointsPerGame.toFixed(1)}</TableCell>
                          <TableCell align="right">
                            <Typography 
                              fontWeight="bold" 
                              color={team.netRating > 0 ? 'success.main' : 'error.main'}
                            >
                              {team.netRating > 0 ? '+' : ''}{team.netRating.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{team.offensiveRating.toFixed(1)}</TableCell>
                          <TableCell align="right">{team.defensiveRating.toFixed(1)}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${team.netRating > 0 ? '+' : ''}${team.netRating.toFixed(1)}`} 
                              size="small" 
                              color={team.netRating > 3 ? 'success' : team.netRating > 0 ? 'primary' : 'default'}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="right">{team.pace.toFixed(1)}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={team.streak} 
                              size="small" 
                              color={team.streak.startsWith('W') ? 'success' : 'error'}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="center">{team.last10}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Fade>
        )}

        {/* Educational Footer */}
        <Paper sx={{ mt: 6, p: 3, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                About This Data
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                All statistics are sourced from comprehensive JSON databases via the Flask backend. 
                Advanced metrics are calculated using real sports formulas.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip icon={<CheckCircle />} label="Tank01 API integration" size="small" variant="outlined" />
                <Chip icon={<Downloading />} label="Updated daily" size="small" variant="outlined" />
                <Chip icon={<Functions />} label="Advanced metrics included" size="small" variant="outlined" />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Last updated: {new Date().toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data sources: Tank01 API, JSON databases
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <Zoom in={!!selectedPlayer}>
          <Paper 
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16, 
              width: 360, 
              p: 2, 
              borderRadius: 2,
              boxShadow: 4,
              zIndex: 1300,
              border: `1px solid ${theme.palette.primary.main}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedPlayer.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label={selectedPlayer.teamAbbrev} size="small" />
                  <Typography variant="caption" color="text.secondary">
                    #{selectedPlayer.number} · {selectedPlayer.position}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setSelectedPlayer(null)}>
                <ArrowDropUp />
              </IconButton>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">PPG</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedPlayer.pointsPerGame.toFixed(1)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">RPG</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedPlayer.reboundsPerGame.toFixed(1)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">APG</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedPlayer.assistsPerGame.toFixed(1)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">FG%</Typography>
                <Typography variant="body2">{selectedPlayer.fieldGoalPercentage.toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">3P%</Typography>
                <Typography variant="body2">{selectedPlayer.threePointPercentage.toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">EFF</Typography>
                <Typography variant="body2" fontWeight="bold" color="primary.main">{selectedPlayer.efficiency.toFixed(1)}</Typography>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button size="small" variant="outlined" fullWidth>
                View Full Profile
              </Button>
            </Box>
          </Paper>
        </Zoom>
      )}
    </Box>
  );
};

// =============================================
// Main exported component wrapped with ProtectedRoute
// =============================================

const SeasonStatsScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="SeasonStats">
      <SeasonStatsContent />
    </ProtectedRoute>
  );
};

export default SeasonStatsScreen;
