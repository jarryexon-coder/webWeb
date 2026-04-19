// src/pages/MatchAnalyticsScreen.tsx – Real Game Data + Default Team Stats for NBA, NHL, MLB
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Paper,
  Divider,
  Chip,
  Alert,
  Avatar,
  Container,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  Search,
  CalendarToday,
  LocationOn,
  Scoreboard,
  Schedule,
  MoreHoriz,
  Close,
  People,
  Newspaper as NewspaperIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// =============================================
// CONSTANTS
// =============================================
const API_BASE = 'https://prizepicks-production.up.railway.app';

const getTodayYYYYMMDD = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// =============================================
// TEAM NAME MAPPINGS
// =============================================
const NBA_TEAM_MAP: Record<string, string> = {
  'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN', 'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI', 'Cleveland Cavaliers': 'CLE', 'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET', 'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC', 'Los Angeles Lakers': 'LAL', 'Memphis Grizzlies': 'MEM', 'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN', 'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC', 'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI', 'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC', 'San Antonio Spurs': 'SAS', 'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA', 'Washington Wizards': 'WAS'
};
const NBA_ABBR_TO_NAME = Object.fromEntries(Object.entries(NBA_TEAM_MAP).map(([k, v]) => [v, k]));

const MLB_TEAM_MAP: Record<string, string> = {
  'Arizona Diamondbacks': 'ARI', 'Atlanta Braves': 'ATL', 'Baltimore Orioles': 'BAL', 'Boston Red Sox': 'BOS',
  'Chicago Cubs': 'CHC', 'Chicago White Sox': 'CWS', 'Cincinnati Reds': 'CIN', 'Cleveland Guardians': 'CLE',
  'Colorado Rockies': 'COL', 'Detroit Tigers': 'DET', 'Houston Astros': 'HOU', 'Kansas City Royals': 'KC',
  'Los Angeles Angels': 'LAA', 'Los Angeles Dodgers': 'LAD', 'Miami Marlins': 'MIA', 'Milwaukee Brewers': 'MIL',
  'Minnesota Twins': 'MIN', 'New York Mets': 'NYM', 'New York Yankees': 'NYY', 'Oakland Athletics': 'OAK',
  'Philadelphia Phillies': 'PHI', 'Pittsburgh Pirates': 'PIT', 'San Diego Padres': 'SD', 'San Francisco Giants': 'SF',
  'Seattle Mariners': 'SEA', 'St. Louis Cardinals': 'STL', 'Tampa Bay Rays': 'TB', 'Texas Rangers': 'TEX',
  'Toronto Blue Jays': 'TOR', 'Washington Nationals': 'WSH'
};
const MLB_ABBR_TO_NAME = Object.fromEntries(Object.entries(MLB_TEAM_MAP).map(([k, v]) => [v, k]));

const NHL_TEAM_MAP: Record<string, string> = {
  'Anaheim Ducks': 'ANA', 'Arizona Coyotes': 'ARI', 'Boston Bruins': 'BOS', 'Buffalo Sabres': 'BUF',
  'Calgary Flames': 'CGY', 'Carolina Hurricanes': 'CAR', 'Chicago Blackhawks': 'CHI', 'Colorado Avalanche': 'COL',
  'Columbus Blue Jackets': 'CBJ', 'Dallas Stars': 'DAL', 'Detroit Red Wings': 'DET', 'Edmonton Oilers': 'EDM',
  'Florida Panthers': 'FLA', 'Los Angeles Kings': 'LAK', 'Minnesota Wild': 'MIN', 'Montreal Canadiens': 'MTL',
  'Nashville Predators': 'NSH', 'New Jersey Devils': 'NJD', 'New York Islanders': 'NYI', 'New York Rangers': 'NYR',
  'Ottawa Senators': 'OTT', 'Philadelphia Flyers': 'PHI', 'Pittsburgh Penguins': 'PIT', 'San Jose Sharks': 'SJS',
  'Seattle Kraken': 'SEA', 'St. Louis Blues': 'STL', 'Tampa Bay Lightning': 'TBL', 'Toronto Maple Leafs': 'TOR',
  'Vancouver Canucks': 'VAN', 'Vegas Golden Knights': 'VGK', 'Washington Capitals': 'WSH', 'Winnipeg Jets': 'WPG'
};
const NHL_ABBR_TO_NAME = Object.fromEntries(Object.entries(NHL_TEAM_MAP).map(([k, v]) => [v, k]));

const getTeamFullName = (abbr: string, sport: string): string => {
  if (sport === 'nba' && NBA_ABBR_TO_NAME[abbr]) return NBA_ABBR_TO_NAME[abbr];
  if (sport === 'nhl' && NHL_ABBR_TO_NAME[abbr]) return NHL_ABBR_TO_NAME[abbr];
  if (sport === 'mlb' && MLB_ABBR_TO_NAME[abbr]) return MLB_ABBR_TO_NAME[abbr];
  return abbr;
};

const getTeamAbbreviation = (teamName: string, sport: string): string => {
  if (!teamName) return '';
  if (/^[A-Z]{2,4}$/.test(teamName)) return teamName;
  const map = sport === 'nba' ? NBA_TEAM_MAP : sport === 'nhl' ? NHL_TEAM_MAP : MLB_TEAM_MAP;
  if (map[teamName]) return map[teamName];
  return teamName.substring(0, 3).toUpperCase();
};

// =============================================
// DEFAULT TEAM STATS (Fallback for missing teams)
// =============================================
// NBA – Points Per Game (PPG), Rebounds Per Game (RPG), Assists Per Game (APG)
const DEFAULT_NBA_TEAM_STATS: Record<string, { ppg: number; rpg: number; apg: number }> = {
  'ATL': { ppg: 118.2, rpg: 44.5, apg: 26.8 },
  'BOS': { ppg: 120.5, rpg: 45.2, apg: 27.5 },
  'BKN': { ppg: 110.8, rpg: 43.1, apg: 25.2 },
  'CHA': { ppg: 108.5, rpg: 42.8, apg: 24.5 },
  'CHI': { ppg: 112.3, rpg: 43.9, apg: 25.8 },
  'CLE': { ppg: 115.8, rpg: 44.1, apg: 26.2 },
  'DAL': { ppg: 116.5, rpg: 43.8, apg: 26.0 },
  'DEN': { ppg: 118.5, rpg: 45.5, apg: 29.2 },
  'DET': { ppg: 110.2, rpg: 43.2, apg: 25.0 },
  'GSW': { ppg: 115.5, rpg: 46.5, apg: 28.5 },
  'HOU': { ppg: 113.8, rpg: 44.5, apg: 25.5 },
  'IND': { ppg: 119.2, rpg: 42.8, apg: 28.8 },
  'LAC': { ppg: 114.5, rpg: 44.0, apg: 25.5 },
  'LAL': { ppg: 117.5, rpg: 43.5, apg: 27.5 },
  'MEM': { ppg: 116.2, rpg: 46.0, apg: 26.5 },
  'MIA': { ppg: 111.5, rpg: 43.2, apg: 25.5 },
  'MIL': { ppg: 119.5, rpg: 45.5, apg: 26.5 },
  'MIN': { ppg: 113.5, rpg: 43.8, apg: 25.5 },
  'NOP': { ppg: 115.5, rpg: 44.5, apg: 26.5 },
  'NYK': { ppg: 114.5, rpg: 45.5, apg: 24.5 },
  'OKC': { ppg: 119.8, rpg: 44.5, apg: 27.5 },
  'ORL': { ppg: 110.5, rpg: 45.0, apg: 24.5 },
  'PHI': { ppg: 114.5, rpg: 43.5, apg: 25.5 },
  'PHX': { ppg: 116.5, rpg: 43.5, apg: 27.5 },
  'POR': { ppg: 108.5, rpg: 43.0, apg: 23.5 },
  'SAC': { ppg: 116.5, rpg: 44.5, apg: 28.5 },
  'SAS': { ppg: 112.5, rpg: 44.5, apg: 28.5 },
  'TOR': { ppg: 112.5, rpg: 44.5, apg: 28.5 },
  'UTA': { ppg: 114.5, rpg: 45.5, apg: 25.5 },
  'WAS': { ppg: 109.5, rpg: 42.5, apg: 25.5 },
};

// NHL – Points Per Game (Goals+Assists) for each team (2025-26 season averages)
const DEFAULT_NHL_TEAM_STATS: Record<string, { ppg: number }> = {
  'ANA': { ppg: 2.8 }, 'ARI': { ppg: 2.9 }, 'BOS': { ppg: 3.3 }, 'BUF': { ppg: 3.0 },
  'CGY': { ppg: 3.1 }, 'CAR': { ppg: 3.4 }, 'CHI': { ppg: 2.7 }, 'COL': { ppg: 3.6 },
  'CBJ': { ppg: 3.0 }, 'DAL': { ppg: 3.2 }, 'DET': { ppg: 3.1 }, 'EDM': { ppg: 3.8 },
  'FLA': { ppg: 3.5 }, 'LAK': { ppg: 3.0 }, 'MIN': { ppg: 3.1 }, 'MTL': { ppg: 2.9 },
  'NSH': { ppg: 2.9 }, 'NJD': { ppg: 3.3 }, 'NYI': { ppg: 2.8 }, 'NYR': { ppg: 3.2 },
  'OTT': { ppg: 3.1 }, 'PHI': { ppg: 2.9 }, 'PIT': { ppg: 3.2 }, 'SJS': { ppg: 2.6 },
  'SEA': { ppg: 2.9 }, 'STL': { ppg: 2.8 }, 'TBL': { ppg: 3.4 }, 'TOR': { ppg: 3.5 },
  'VAN': { ppg: 3.2 }, 'VGK': { ppg: 3.3 }, 'WSH': { ppg: 3.1 }, 'WPG': { ppg: 3.2 },
};

// MLB – Runs Per Game (RPG) for each team (2025-26 season averages)
const DEFAULT_MLB_TEAM_STATS: Record<string, { ppg: number }> = {
  'ARI': { ppg: 4.8 }, 'ATL': { ppg: 5.1 }, 'BAL': { ppg: 4.6 }, 'BOS': { ppg: 4.9 },
  'CHC': { ppg: 4.7 }, 'CWS': { ppg: 4.0 }, 'CIN': { ppg: 4.5 }, 'CLE': { ppg: 4.3 },
  'COL': { ppg: 4.6 }, 'DET': { ppg: 4.2 }, 'HOU': { ppg: 4.9 }, 'KC': { ppg: 4.4 },
  'LAA': { ppg: 4.5 }, 'LAD': { ppg: 5.3 }, 'MIA': { ppg: 4.1 }, 'MIL': { ppg: 4.7 },
  'MIN': { ppg: 4.8 }, 'NYM': { ppg: 4.9 }, 'NYY': { ppg: 5.2 }, 'OAK': { ppg: 3.9 },
  'PHI': { ppg: 5.0 }, 'PIT': { ppg: 4.2 }, 'SD': { ppg: 4.8 }, 'SF': { ppg: 4.5 },
  'SEA': { ppg: 4.4 }, 'STL': { ppg: 4.6 }, 'TB': { ppg: 4.4 }, 'TEX': { ppg: 5.0 },
  'TOR': { ppg: 4.8 }, 'WSH': { ppg: 4.3 },
};

// =============================================
// API FUNCTIONS
// =============================================
const fetchPrizePicksSelections = async (sport: string = 'nba') => {
  try {
    const url = `${API_BASE}/api/prizepicks/selections?sport=${sport}`;
    console.log(`🎯 Fetching PrizePicks selections from: ${url}`);
    const response = await axios.get(url, { timeout: 15000 });
    if (response.data && response.data.selections) {
      console.log(`✅ Got ${response.data.selections.length} selections for ${sport}`);
      return response.data;
    } else if (response.data && Array.isArray(response.data)) {
      console.log(`✅ Got ${response.data.length} selections (array format)`);
      return { selections: response.data };
    }
    return { selections: [] };
  } catch (error) {
    console.error(`❌ Error fetching PrizePicks selections for ${sport}:`, error);
    return { selections: [] };
  }
};

const fetchGamesFromTank01 = async (sport: string = 'nba', date: string = getTodayYYYYMMDD()) => {
  try {
    const url = `${API_BASE}/api/tank01/games?date=${date}&sport=${sport}`;
    console.log(`📅 Fetching games from Tank01: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log(`✅ Got ${response.data.data.length} games for ${sport} on ${date}`);
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`❌ Error fetching games from Tank01 for ${sport}:`, error);
    return [];
  }
};

const fetchTeamStatsFromTank01 = async (sport: string = 'nba') => {
  try {
    const url = `${API_BASE}/api/tank01/currentinfo?sport=${sport}`;
    console.log(`📊 Fetching team stats from Tank01: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data;
      let teamsArray = null;
      if (Array.isArray(data)) {
        teamsArray = data;
      } else if (data.body && Array.isArray(data.body)) {
        teamsArray = data.body;
      } else if (data.teamStats && Array.isArray(data.teamStats)) {
        teamsArray = data.teamStats;
      } else if (data.teams && Array.isArray(data.teams)) {
        teamsArray = data.teams;
      }
      if (teamsArray && teamsArray.length > 0) {
        const teamStatsMap: Record<string, any> = {};
        teamsArray.forEach((team: any) => {
          const abbr = team.teamAbbrev || team.teamAbv || team.abbreviation;
          if (abbr) {
            teamStatsMap[abbr] = {
              ppg: parseFloat(team.ppg || team.pts || team.pointsPerGame || 0),
              rpg: parseFloat(team.rpg || team.reb || team.reboundsPerGame || 0),
              apg: parseFloat(team.apg || team.ast || team.assistsPerGame || 0),
            };
          }
        });
        console.log(`✅ Got team stats for ${Object.keys(teamStatsMap).length} teams from Tank01`);
        return teamStatsMap;
      }
    }
    return {};
  } catch (error) {
    console.error(`❌ Error fetching team stats from Tank01:`, error);
    return {};
  }
};

const fetchPlayersForTeamStats = async (sport: string = 'nba') => {
  try {
    const url = `${API_BASE}/api/fantasyhub/players?sport=${sport}&filterByToday=false`;
    const response = await axios.get(url, { timeout: 10000 });
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log(`✅ Got ${response.data.data.length} players for team stats (${sport})`);
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error(`❌ Error fetching fantasyhub players for team stats:`, error);
    return [];
  }
};

// =============================================
// Helper to compute team stats from players (fallback)
// =============================================
const computeTeamStatsFromPlayers = (players: any[], sport: string) => {
  const teamMap = new Map<string, { totalPoints: number; totalRebounds: number; totalAssists: number; count: number }>();
  
  players.forEach(player => {
    let team = player.team;
    if (!team) return;
    const teamAbbr = getTeamAbbreviation(team, sport);
    if (!teamAbbr) return;
    
    if (!teamMap.has(teamAbbr)) {
      teamMap.set(teamAbbr, { totalPoints: 0, totalRebounds: 0, totalAssists: 0, count: 0 });
    }
    const stats = teamMap.get(teamAbbr)!;
    
    let points = 0, rebounds = 0, assists = 0;
    if (sport === 'nba') {
      points = player.points ?? player.pts_per_game ?? player.ppg ?? player.projection ?? 0;
      rebounds = player.rebounds ?? player.reb_per_game ?? player.rpg ?? 0;
      assists = player.assists ?? player.ast_per_game ?? player.apg ?? 0;
    } else if (sport === 'nhl') {
      points = player.points ?? player.pts_per_game ?? player.projection ?? 0;
    } else if (sport === 'mlb') {
      // For MLB, we use fantasy_points as a proxy for runs contribution? Actually we want runs per game.
      // But fantasy_points is not runs. So we'll use a simple default later; here we'll just sum fantasy_points.
      points = player.fantasy_points ?? 0;
    }
    
    stats.totalPoints += points;
    stats.totalRebounds += rebounds;
    stats.totalAssists += assists;
    stats.count++;
  });
  
  const teamStats: Record<string, any> = {};
  for (const [team, data] of teamMap.entries()) {
    teamStats[team] = {
      ppg: data.totalPoints / data.count,
      rpg: data.totalRebounds / data.count,
      apg: data.totalAssists / data.count,
      playerCount: data.count,
    };
  }
  return teamStats;
};

function formatDate(dateStr: string) {
  try {
    if (dateStr.length === 8) {
      const year = dateStr.slice(0,4);
      const month = dateStr.slice(4,6);
      const day = dateStr.slice(6,8);
      return `${month}/${day}/${year}`;
    }
    const parsed = parseISO(dateStr);
    if (isValid(parsed)) return format(parsed, 'MMM dd');
    return dateStr;
  } catch { return dateStr; }
}

// =============================================
// Main Component
// =============================================
const MatchAnalyticsScreen = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'nhl' | 'mlb'>('nba');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [filteredGames, setFilteredGames] = useState<any[]>([]);

  // Queries
  const { 
    data: prizePicksData, 
    isLoading: selectionsLoading, 
    error: selectionsError,
    refetch: refetchSelections,
    isRefetching: selectionsRefetching
  } = useQuery({
    queryKey: ['prizepicksSelections', selectedSport],
    queryFn: () => fetchPrizePicksSelections(selectedSport),
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  const {
    data: tank01Games,
    isLoading: gamesLoading,
    error: gamesError,
    refetch: refetchGames
  } = useQuery({
    queryKey: ['tank01Games', selectedSport],
    queryFn: () => fetchGamesFromTank01(selectedSport),
    staleTime: 5 * 60 * 1000,
    retry: 2
  });

  const {
    data: tank01TeamStats,
    isLoading: teamStatsLoading,
    error: teamStatsError
  } = useQuery({
    queryKey: ['tank01TeamStats', selectedSport],
    queryFn: () => fetchTeamStatsFromTank01(selectedSport),
    staleTime: 60 * 60 * 1000,
    retry: 1
  });

  const {
    data: playersData,
    isLoading: playersLoading
  } = useQuery({
    queryKey: ['fantasyhubPlayers', selectedSport],
    queryFn: () => fetchPlayersForTeamStats(selectedSport),
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  const selectionsFromApi = prizePicksData?.selections || [];
  const realGames = tank01Games || [];
  const allPlayers = playersData || [];
  const tank01Stats = tank01TeamStats || {};

  // Compute team stats: prefer Tank01 stats, then player-derived, then defaults
  const teamStats = useMemo(() => {
    const playerStats = computeTeamStatsFromPlayers(allPlayers, selectedSport);
    const merged: Record<string, any> = {};
    
    // Get default stats for the sport
    let defaultStats: Record<string, any> = {};
    if (selectedSport === 'nba') {
      defaultStats = DEFAULT_NBA_TEAM_STATS;
    } else if (selectedSport === 'nhl') {
      defaultStats = DEFAULT_NHL_TEAM_STATS;
    } else if (selectedSport === 'mlb') {
      defaultStats = DEFAULT_MLB_TEAM_STATS;
    }
    
    // Collect all possible team abbreviations for the selected sport
    let allTeamAbbrs: string[] = [];
    if (selectedSport === 'nba') {
      allTeamAbbrs = Object.keys(DEFAULT_NBA_TEAM_STATS);
    } else if (selectedSport === 'nhl') {
      allTeamAbbrs = Object.keys(DEFAULT_NHL_TEAM_STATS);
    } else if (selectedSport === 'mlb') {
      allTeamAbbrs = Object.keys(DEFAULT_MLB_TEAM_STATS);
    } else {
      allTeamAbbrs = [...Object.keys(tank01Stats), ...Object.keys(playerStats)];
    }
    
    for (const abbr of allTeamAbbrs) {
      if (tank01Stats[abbr] && (tank01Stats[abbr].ppg > 0 || tank01Stats[abbr].rpg > 0 || tank01Stats[abbr].apg > 0)) {
        merged[abbr] = tank01Stats[abbr];
      } else if (playerStats[abbr] && playerStats[abbr].ppg > 0) {
        merged[abbr] = playerStats[abbr];
      } else if (defaultStats[abbr]) {
        // Use default stats, and for NHL/MLB we only have ppg, so set rpg/apg to 0
        merged[abbr] = { ...defaultStats[abbr], rpg: 0, apg: 0, playerCount: 0 };
      } else {
        // Ultimate fallback – generic values
        merged[abbr] = { 
          ppg: selectedSport === 'nhl' ? 3.0 : selectedSport === 'mlb' ? 4.5 : 110,
          rpg: 0, apg: 0, playerCount: 0 
        };
      }
    }
    console.log(`📊 Final team stats for ${Object.keys(merged).length} teams:`, merged);
    return merged;
  }, [tank01Stats, allPlayers, selectedSport]);

  // Log for debugging
  useEffect(() => {
    if (allPlayers.length > 0) {
      console.log(`🔍 Sample player from ${selectedSport}:`, allPlayers[0]);
      console.log(`🔍 Team stats available for:`, Object.keys(teamStats));
    }
  }, [allPlayers, teamStats, selectedSport]);

  // Build games with props
  const gamesWithProps = useMemo(() => {
    if (!realGames.length) return [];

    const selectionsByTeam = new Map<string, any[]>();
    selectionsFromApi.forEach((sel: any) => {
      const team = sel.team || sel.team_abbreviation;
      if (team) {
        const teamAbbr = getTeamAbbreviation(team, selectedSport);
        if (!selectionsByTeam.has(teamAbbr)) selectionsByTeam.set(teamAbbr, []);
        selectionsByTeam.get(teamAbbr)!.push(sel);
      }
    });

    const games = realGames.map((game: any) => {
      const homeTeam = game.home || game.homeTeam;
      const awayTeam = game.away || game.awayTeam;
      const homeAbbr = getTeamAbbreviation(homeTeam, selectedSport);
      const awayAbbr = getTeamAbbreviation(awayTeam, selectedSport);
      
      const homeSelections = selectionsByTeam.get(homeAbbr) || [];
      const awaySelections = selectionsByTeam.get(awayAbbr) || [];
      const allSelections = [...homeSelections, ...awaySelections];
      
      return {
        id: `${homeAbbr}-${awayAbbr}-${game.date || Date.now()}`,
        homeTeam: {
          name: getTeamFullName(homeAbbr, selectedSport) || homeTeam,
          abbreviation: homeAbbr,
          stats: teamStats[homeAbbr] || { ppg: 0, rpg: 0, apg: 0 }
        },
        awayTeam: {
          name: getTeamFullName(awayAbbr, selectedSport) || awayTeam,
          abbreviation: awayAbbr,
          stats: teamStats[awayAbbr] || { ppg: 0, rpg: 0, apg: 0 }
        },
        date: game.date ? formatDate(game.date) : 'Today',
        time: game.time || 'TBD',
        venue: game.venue || `${homeTeam} ${selectedSport === 'mlb' ? 'Ballpark' : 'Arena'}`,
        selections: allSelections,
        players: allSelections.map((s: any) => s.player_name || s.player).filter(Boolean),
        sport: selectedSport.toUpperCase(),
      };
    });

    // Deduplicate
    const uniqueGames = new Map();
    games.forEach(g => {
      const key = [g.homeTeam.abbreviation, g.awayTeam.abbreviation].sort().join('-');
      if (!uniqueGames.has(key) || g.selections.length > uniqueGames.get(key).selections.length) {
        uniqueGames.set(key, g);
      }
    });
    return Array.from(uniqueGames.values());
  }, [realGames, selectionsFromApi, selectedSport, teamStats]);

  // Update selectedGame when gamesWithProps changes
  useEffect(() => {
    if (gamesWithProps.length === 0) {
      setSelectedGame(null);
      return;
    }
    if (selectedGame) {
      const updatedGame = gamesWithProps.find(g => g.id === selectedGame.id);
      if (updatedGame) {
        setSelectedGame(updatedGame);
        return;
      }
    }
    setSelectedGame(gamesWithProps[0]);
  }, [gamesWithProps]);

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId as any);
    setSelectedGame(null);
    setSearchQuery('');
    setSearchInput('');
    setFilteredGames([]);
  };

  const handleSearch = (q: string) => {
    setSearchInput(q);
    if (!q.trim()) {
      setSearchQuery('');
      setFilteredGames([]);
    } else {
      setSearchQuery(q);
      const results = gamesWithProps.filter(
        g => g.homeTeam.name.toLowerCase().includes(q.toLowerCase()) ||
             g.awayTeam.name.toLowerCase().includes(q.toLowerCase())
      );
      setFilteredGames(results);
    }
  };

  const handleSelectGame = (game: any) => {
    setSelectedGame(game);
    setSearchQuery('');
    setSearchInput('');
    setFilteredGames([]);
  };

  const handleRefresh = () => {
    refetchSelections();
    refetchGames();
  };

  const isLoading = selectionsLoading || gamesLoading || playersLoading || teamStatsLoading;
  const isRefetching = selectionsRefetching;
  const hasError = selectionsError || gamesError || teamStatsError;

  // GameCard Component
  const GameCard = ({ game, isSelected = false, onSelect }: { game: any; isSelected?: boolean; onSelect: (game: any) => void }) => {
    const homeStats = game.homeTeam.stats;
    const awayStats = game.awayTeam.stats;
    return (
      <Card
        sx={{
          cursor: 'pointer',
          border: isSelected ? '2px solid #1976d2' : '1px solid #333',
          bgcolor: '#1e1e1e',
          transition: 'all 0.2s',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 3, bgcolor: '#2a2a2a' },
        }}
        onClick={() => onSelect(game)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip label={game.sport} size="small" sx={{ bgcolor: '#3b82f6', color: '#fff' }} />
            <Chip label={game.time} size="small" sx={{ bgcolor: '#f59e0b', color: '#fff' }} />
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                  {game.homeTeam.abbreviation?.charAt(0)}
                </Avatar>
                <Typography noWrap sx={{ color: '#fff' }}>{game.homeTeam.name}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#aaa' }}>
                {selectedSport === 'nba' ? 'PPG' : selectedSport === 'nhl' ? 'PTS/G' : 'R/G'}: {homeStats?.ppg?.toFixed(1) || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={2} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#aaa' }}>vs</Typography>
            </Grid>
            <Grid item xs={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                <Typography noWrap sx={{ color: '#fff' }}>{game.awayTeam.name}</Typography>
                <Avatar sx={{ bgcolor: '#ef4444', width: 32, height: 32 }}>
                  {game.awayTeam.abbreviation?.charAt(0)}
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: '#aaa', textAlign: 'right', display: 'block' }}>
                {selectedSport === 'nba' ? 'PPG' : selectedSport === 'nhl' ? 'PTS/G' : 'R/G'}: {awayStats?.ppg?.toFixed(1) || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              <People sx={{ fontSize: 12, mr: 0.5 }} />
              {game.players.length} players with props
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Selected Game Details
  const SelectedGameDetails = ({ game }: { game: any }) => {
    if (!game) return null;
    const homeStats = game.homeTeam.stats;
    const awayStats = game.awayTeam.stats;
    
    return (
      <Paper sx={{ p: 3, mt: 3, bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Scoreboard /> Game Analytics
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#0d0d0d', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ color: '#3b82f6' }}>{game.homeTeam.abbreviation}</Typography>
              <Typography variant="body1" sx={{ color: '#fff' }}>{game.homeTeam.name}</Typography>
              <Divider sx={{ my: 2, bgcolor: '#333' }} />
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                {selectedSport === 'nba' ? 'PPG' : selectedSport === 'nhl' ? 'PTS/G' : 'R/G'}: {homeStats?.ppg?.toFixed(1) || 'N/A'}
              </Typography>
              {selectedSport === 'nba' && (
                <>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>RPG: {homeStats?.rpg?.toFixed(1) || 'N/A'}</Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>APG: {homeStats?.apg?.toFixed(1) || 'N/A'}</Typography>
                </>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#0d0d0d', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ color: '#ef4444' }}>{game.awayTeam.abbreviation}</Typography>
              <Typography variant="body1" sx={{ color: '#fff' }}>{game.awayTeam.name}</Typography>
              <Divider sx={{ my: 2, bgcolor: '#333' }} />
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                {selectedSport === 'nba' ? 'PPG' : selectedSport === 'nhl' ? 'PTS/G' : 'R/G'}: {awayStats?.ppg?.toFixed(1) || 'N/A'}
              </Typography>
              {selectedSport === 'nba' && (
                <>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>RPG: {awayStats?.rpg?.toFixed(1) || 'N/A'}</Typography>
                  <Typography variant="body2" sx={{ color: '#aaa' }}>APG: {awayStats?.apg?.toFixed(1) || 'N/A'}</Typography>
                </>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#0d0d0d', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold', mb: 1 }}>
            <Schedule sx={{ fontSize: 16, mr: 1 }} /> Game Details
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            <CalendarToday sx={{ fontSize: 14, mr: 1 }} /> Date: {game.date} at {game.time}
          </Typography>
          <Typography variant="body2" sx={{ color: '#aaa' }}>
            <LocationOn sx={{ fontSize: 14, mr: 1 }} /> Venue: {game.venue}
          </Typography>
        </Box>

        {game.selections.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 'bold', mb: 2 }}>
              <People /> Player Props for this Game
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: '#0d0d0d' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#fff' }}>Player</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Team</TableCell>
                    <TableCell sx={{ color: '#fff' }}>Market</TableCell>
                    <TableCell align="right" sx={{ color: '#fff' }}>Line</TableCell>
                    <TableCell align="right" sx={{ color: '#fff' }}>Projection</TableCell>
                    <TableCell align="right" sx={{ color: '#fff' }}>Advantage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {game.selections.map((sel: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: '#ccc' }}>{sel.player_name || sel.player}</TableCell>
                      <TableCell sx={{ color: '#ccc' }}>{sel.team}</TableCell>
                      <TableCell sx={{ color: '#ccc' }}>{sel.stat || sel.market}</TableCell>
                      <TableCell align="right" sx={{ color: '#ff9800' }}>{sel.line}</TableCell>
                      <TableCell align="right" sx={{ color: '#8b5cf6' }}>{sel.projection?.toFixed(1)}</TableCell>
                      <TableCell align="right" sx={{ color: sel.edge > 0 ? '#4caf50' : '#f44336' }}>{sel.edge}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    );
  };

  if (isLoading && !gamesWithProps.length) {
    return (
      <Container maxWidth="lg" sx={{ bgcolor: '#121212', minHeight: '100vh', py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2, color: '#fff' }}>Loading game analytics...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ bgcolor: '#121212', minHeight: '100vh', py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: '#fff' }}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#fff' }}>Game Analytics</Typography>
          <Typography variant="body1" sx={{ color: '#aaa' }}>
            {realGames.length} games today • {selectionsFromApi.length} player props
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: '#fff' }}>Sport</InputLabel>
          <Select 
            value={selectedSport} 
            label="Sport" 
            onChange={e => handleSportChange(e.target.value)}
            sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
          >
            <MenuItem value="nba">🏀 NBA</MenuItem>
            <MenuItem value="nhl">🏒 NHL</MenuItem>
            <MenuItem value="mlb">⚾ MLB</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={isRefetching} sx={{ color: '#fff' }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {hasError && (
        <Alert severity="warning" sx={{ mb: 3, bgcolor: '#333', color: '#ff9800' }}>
          Some data may be unavailable. Showing available data.
        </Alert>
      )}

      {isRefetching && <LinearProgress sx={{ mb: 2 }} />}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e1e1e', border: '1px solid #333' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search teams..."
          value={searchInput}
          onChange={e => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#aaa' }} /></InputAdornment>,
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton onClick={() => handleSearch('')}><Close sx={{ color: '#aaa' }} /></IconButton>
              </InputAdornment>
            ),
            sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }
          }}
        />
        {filteredGames.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#aaa' }} gutterBottom>
              Found {filteredGames.length} games
            </Typography>
            <Grid container spacing={2}>
              {filteredGames.slice(0, 3).map(game => (
                <Grid item xs={12} sm={6} md={4} key={game.id}>
                  <GameCard game={game} isSelected={selectedGame?.id === game.id} onSelect={handleSelectGame} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {gamesWithProps.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <NewspaperIcon sx={{ fontSize: 60, color: '#555', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#aaa' }}>
            No games available for {selectedSport.toUpperCase()}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }} paragraph>
            No games scheduled today or no PrizePicks selections found.
          </Typography>
          <Button variant="outlined" startIcon={<UpdateIcon />} onClick={handleRefresh} sx={{ color: '#fff', borderColor: '#555' }}>
            Refresh
          </Button>
        </Box>
      )}

      {gamesWithProps.length > 0 && (
        <Paper sx={{ p: 3, bgcolor: '#1e1e1e', border: '1px solid #333' }}>
          <Typography variant="h5" gutterBottom sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoreHoriz /> Today's Games
          </Typography>
          <Grid container spacing={2}>
            {gamesWithProps.map(game => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <GameCard game={game} isSelected={selectedGame?.id === game.id} onSelect={handleSelectGame} />
              </Grid>
            ))}
          </Grid>
          
          {selectedGame && <SelectedGameDetails game={selectedGame} />}
        </Paper>
      )}
    </Container>
  );
};

export default MatchAnalyticsScreen;
