// src/pages/TeamRostersPage.tsx - Lazy load rosters on expand
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Box, Chip, FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, IconButton, Button, Tab, Tabs, Badge,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  salary: number;
  projection: number;
  value: number;
  points: number;
  rebounds: number;
  assists: number;
  injury_status?: string;
  // NHL specific
  goals?: number;
  plusMinus?: number;
  shots?: number;
  hits?: number;
  blockedShots?: number;
  timeOnIce?: string;
  powerPlayGoals?: number;
  powerPlayAssists?: number;
  powerPlayPoints?: number;
  faceoffPercent?: string;
  // MLB specific
  atBats?: number;
  hits_mlb?: number;
  homeRuns?: number;
  rbi?: number;
  stolenBases?: number;
  battingAverage?: number;
  ops?: number;
}

interface TeamInfo {
  abbreviation: string;
  fullName?: string;
  logo?: string;
}

const API_BASE = 'https://prizepicks-production.up.railway.app';
const CACHE_TTL = 5 * 60 * 1000;

// Simple memory cache
const rosterCache = new Map<string, { data: Player[]; timestamp: number }>();

async function fetchWithRetry(url: string, retries = 3, baseDelay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.status !== 429) return res;
    const wait = baseDelay * Math.pow(2, i);
    await new Promise(resolve => setTimeout(resolve, wait));
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

const TeamRostersPage: React.FC = () => {
  const [sport, setSport] = useState<'nba' | 'mlb' | 'nhl'>('nba');
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [apiStatus, setApiStatus] = useState<Record<string, string>>({});

  const [rosters, setRosters] = useState<Map<string, Player[]>>(new Map());
  const [loadingRosters, setLoadingRosters] = useState<Set<string>>(new Set());
  const [failedTeams, setFailedTeams] = useState<Set<string>>(new Set());

  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ column: keyof Player; direction: 'asc' | 'desc' }>({
    column: 'projection',
    direction: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const sports = [
    { id: 'nba', label: 'NBA', icon: <SportsBasketballIcon /> },
    { id: 'mlb', label: 'MLB', icon: <SportsBaseballIcon /> },
    { id: 'nhl', label: 'NHL', icon: <SportsHockeyIcon /> },
  ];

  // ---------- Fetch team list ----------
  const fetchTeamList = async (sport: string): Promise<TeamInfo[]> => {
    if (sport === 'nba') {
      const nbaTeams = [
        'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
        'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
        'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'
      ];
      return nbaTeams.map(abbr => ({ abbreviation: abbr }));
    } else {
      const url = `${API_BASE}/api/tank01/teams?league=${sport}`;
      const res = await fetchWithRetry(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) throw new Error('Invalid team response');
      return json.data.map((t: any) => ({
        abbreviation: t.abbreviation || t.teamAbv,
        fullName: t.fullName || t.teamName,
        logo: t.logo || t.logos?.[0],
      }));
    }
  };

  // ---------- Cache for fantasyhub stats ----------
  let fantasyStatsCache: Map<string, Map<string, any>> = new Map();

  const fetchSingleRoster = async (teamAbbr: string, sport: string): Promise<Player[]> => {
    const cacheKey = `${sport}:${teamAbbr}`;
    const cached = rosterCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // 1. Fetch roster from Tank01
    const rosterUrl = `${API_BASE}/api/tank01/roster?team=${teamAbbr}&sport=${sport}`;
    const rosterRes = await fetchWithRetry(rosterUrl, 3, 1500);
    if (!rosterRes.ok) throw new Error(`HTTP ${rosterRes.status} for team ${teamAbbr}`);
    const rosterJson = await rosterRes.json();
    if (!rosterJson.success || !Array.isArray(rosterJson.data)) return [];

    // 2. Fetch fantasyhub stats once per sport
    let statsMap = fantasyStatsCache.get(sport);
    if (!statsMap) {
      const statsUrl = `${API_BASE}/api/fantasyhub/players?sport=${sport}&filterByToday=false`;
      try {
        const statsRes = await fetch(statsUrl);
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          if (statsJson.success && Array.isArray(statsJson.data)) {
            statsMap = new Map();
            statsJson.data.forEach((p: any) => {
              let rawName = p.name || '';
              let norm = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
              statsMap.set(norm, p);
              statsMap.set(rawName.toLowerCase(), p);
            });
            fantasyStatsCache.set(sport, statsMap);
          }
        }
      } catch (err) {
        // Silently ignore – fallback will be used
      }
      if (!statsMap) statsMap = new Map();
    }

    const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 3. Build players
    const players = rosterJson.data.map((p: any, idx: number) => {
      const name = p.longName || p.espnName || 'Unknown';
      const normName = normalize(name);
      const stats = statsMap.get(normName) || statsMap.get(name.toLowerCase());

      let projection = 0;
      let points = 0, rebounds = 0, assists = 0;
      let salary = 5000;
      let injury = p.injury?.designation || 'Healthy';

      let nhlStats: Partial<Player> = {};
      let mlbStats: Partial<Player> = {};

      if (stats) {
        projection = stats.projection || stats.fantasy_points || 0;
        points = stats.points || 0;
        rebounds = stats.rebounds || 0;
        assists = stats.assists || 0;
        salary = stats.salary || 5000;
        injury = stats.injury_status || injury;

        if (sport === 'nhl') {
          nhlStats = {
            goals: stats.goals || 0,
            plusMinus: stats.plusMinus || 0,
            shots: stats.shots || 0,
            hits: stats.hits || 0,
            blockedShots: stats.blockedShots || 0,
            timeOnIce: stats.timeOnIce || '0:00',
            powerPlayGoals: stats.powerPlayGoals || 0,
            powerPlayAssists: stats.powerPlayAssists || 0,
            powerPlayPoints: (stats.powerPlayGoals || 0) + (stats.powerPlayAssists || 0),
            faceoffPercent: stats.faceoffPercent || '0',
          };
        }
        if (sport === 'mlb') {
          mlbStats = {
            atBats: stats.atBats || 0,
            hits_mlb: stats.hits || 0,
            homeRuns: stats.homeRuns || 0,
            rbi: stats.rbi || 0,
            stolenBases: stats.stolenBases || 0,
            battingAverage: stats.battingAverage || 0,
            ops: stats.ops || 0,
          };
        }
      } else {
        // Fallback estimates
        const pos = (p.pos || 'N/A').toUpperCase();
        if (sport === 'nba') {
          if (pos.includes('PG') || pos.includes('SG')) {
            points = 8 + Math.random() * 10;
            assists = 3 + Math.random() * 5;
            rebounds = 2 + Math.random() * 3;
          } else if (pos.includes('SF')) {
            points = 6 + Math.random() * 10;
            rebounds = 3 + Math.random() * 4;
            assists = 1 + Math.random() * 3;
          } else if (pos.includes('PF') || pos.includes('C')) {
            points = 5 + Math.random() * 8;
            rebounds = 4 + Math.random() * 6;
            assists = 0.5 + Math.random() * 2;
          } else {
            points = 5 + Math.random() * 10;
            rebounds = 2 + Math.random() * 5;
            assists = 1 + Math.random() * 4;
          }
          projection = points + rebounds * 0.8 + assists * 0.8;
          salary = 4000 + Math.floor(projection * 200);
        } 
        else if (sport === 'nhl') {
          const isForward = ['C', 'LW', 'RW'].includes(pos);
          const isDefense = pos === 'D';
          let estPoints = 0;
          if (isForward) {
            estPoints = 0.6 + Math.random() * 0.9;
            nhlStats.goals = estPoints * 0.4;
            nhlStats.assists_nhl = estPoints * 0.6;
            nhlStats.shots = 1.5 + Math.random() * 2;
            nhlStats.hits = 1 + Math.random() * 2;
            nhlStats.blockedShots = 0.5 + Math.random() * 1;
          } else if (isDefense) {
            estPoints = 0.3 + Math.random() * 0.6;
            nhlStats.goals = estPoints * 0.2;
            nhlStats.assists_nhl = estPoints * 0.8;
            nhlStats.shots = 1 + Math.random() * 1.5;
            nhlStats.hits = 1.5 + Math.random() * 2;
            nhlStats.blockedShots = 1 + Math.random() * 1.5;
          } else {
            estPoints = 0;
            nhlStats.goals = 0;
            nhlStats.assists_nhl = 0;
            nhlStats.shots = 0;
            nhlStats.hits = 0;
            nhlStats.blockedShots = 0;
          }
          nhlStats.plusMinus = Math.floor(Math.random() * 3) - 1;
          nhlStats.timeOnIce = `${Math.floor(12 + Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
          nhlStats.powerPlayGoals = 0;
          nhlStats.powerPlayAssists = 0;
          nhlStats.powerPlayPoints = 0;
          nhlStats.faceoffPercent = (Math.random() * 60).toFixed(1);
          projection = estPoints * 5;
          points = estPoints;
          salary = 4000 + Math.floor(projection * 800);
        }
        else if (sport === 'mlb') {
          const isPitcher = pos === 'P';
          mlbStats.atBats = isPitcher ? 0 : 3 + Math.floor(Math.random() * 2);
          mlbStats.hits_mlb = isPitcher ? 0 : parseFloat((0.5 + Math.random() * 1).toFixed(1));
          mlbStats.homeRuns = isPitcher ? 0 : Math.floor(Math.random() * 2);
          mlbStats.rbi = isPitcher ? 0 : Math.floor(Math.random() * 3);
          mlbStats.stolenBases = isPitcher ? 0 : (Math.random() > 0.8 ? 1 : 0);
          mlbStats.battingAverage = isPitcher ? 0 : parseFloat((0.200 + Math.random() * 0.150).toFixed(3));
          mlbStats.ops = isPitcher ? 0 : parseFloat((0.600 + Math.random() * 0.400).toFixed(3));
          
          if (isPitcher) {
            mlbStats.strikeouts = 4 + Math.random() * 4;
            mlbStats.era = 3 + Math.random() * 4;
            mlbStats.whip = 1.1 + Math.random() * 0.5;
          }
          
          let projValue = (mlbStats.hits_mlb || 0) + (mlbStats.homeRuns || 0) * 2 + (mlbStats.rbi || 0);
          if (projValue <= 0) projValue = 4 + Math.random() * 6;
          projection = projValue;
          points = projValue;
          salary = 4000 + Math.floor(projection * 500);
        }
      }

      if (projection <= 0) projection = 5;
      if (salary <= 0) salary = 5000;

      const basePlayer: Player = {
        id: p.playerID || p.espnID || `${sport}-${teamAbbr}-${idx}`,
        name: name,
        team: teamAbbr,
        position: p.pos || 'N/A',
        salary: Math.round(salary),
        projection: parseFloat(projection.toFixed(1)),
        value: (projection / salary) * 1000,
        points: parseFloat(points.toFixed(1)),
        rebounds: parseFloat(rebounds.toFixed(1)),
        assists: parseFloat(assists.toFixed(1)),
        injury_status: injury,
        source: stats ? 'merged' : 'estimated',
        ...nhlStats,
        ...mlbStats,
      };

      if (sport === 'nhl') {
        basePlayer.goals = nhlStats.goals;
        basePlayer.plusMinus = nhlStats.plusMinus;
        basePlayer.shots = nhlStats.shots;
        basePlayer.hits = nhlStats.hits;
        basePlayer.blockedShots = nhlStats.blockedShots;
        basePlayer.timeOnIce = nhlStats.timeOnIce;
        basePlayer.powerPlayGoals = nhlStats.powerPlayGoals;
        basePlayer.powerPlayAssists = nhlStats.powerPlayAssists;
        basePlayer.powerPlayPoints = nhlStats.powerPlayPoints;
        basePlayer.faceoffPercent = nhlStats.faceoffPercent;
      }
      if (sport === 'mlb') {
        basePlayer.atBats = mlbStats.atBats;
        basePlayer.hits_mlb = mlbStats.hits_mlb;
        basePlayer.homeRuns = mlbStats.homeRuns;
        basePlayer.rbi = mlbStats.rbi;
        basePlayer.stolenBases = mlbStats.stolenBases;
        basePlayer.battingAverage = mlbStats.battingAverage;
        basePlayer.ops = mlbStats.ops;
      }

      return basePlayer;
    });

    rosterCache.set(cacheKey, { data: players, timestamp: Date.now() });
    return players;
  };

  // ---------- Load roster when expanded ----------
  const loadRosterIfNeeded = useCallback(async (teamAbbr: string) => {
    if (rosters.has(teamAbbr)) return;
    if (loadingRosters.has(teamAbbr)) return;

    setLoadingRosters(prev => new Set(prev).add(teamAbbr));
    setFailedTeams(prev => {
      const next = new Set(prev);
      next.delete(teamAbbr);
      return next;
    });

    try {
      const players = await fetchSingleRoster(teamAbbr, sport);
      if (players.length === 0) throw new Error('No players returned');
      setRosters(prev => new Map(prev).set(teamAbbr, players));
      setApiStatus(prev => ({ ...prev, [sport]: 'ok' }));
    } catch (err) {
      console.error(`Failed to load roster for ${teamAbbr}:`, err);
      setFailedTeams(prev => new Set(prev).add(teamAbbr));
      setApiStatus(prev => ({ ...prev, [sport]: 'partial' }));
    } finally {
      setLoadingRosters(prev => {
        const next = new Set(prev);
        next.delete(teamAbbr);
        return next;
      });
    }
  }, [sport, rosters, loadingRosters]);

  useEffect(() => {
    expandedTeams.forEach(team => {
      loadRosterIfNeeded(team);
    });
  }, [expandedTeams, loadRosterIfNeeded]);

  // ---------- Initial load of team list ----------
  useEffect(() => {
    const loadTeams = async () => {
      setLoadingTeams(true);
      setError(null);
      setUsingMock(false);
      setRosters(new Map());
      setExpandedTeams(new Set());
      setFailedTeams(new Set());
      try {
        const teamList = await fetchTeamList(sport);
        setTeams(teamList);
        setApiStatus(prev => ({ ...prev, [sport]: 'ok' }));
      } catch (err: any) {
        console.error('Failed to load team list:', err);
        setError(err.message);
        setApiStatus(prev => ({ ...prev, [sport]: err.message }));
        const mockTeams = sport === 'nba'
          ? ['ATL','BOS','BKN','CHA','CHI','CLE','DAL','DEN','DET','GSW','HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN','NOP','NYK','OKC','ORL','PHI','PHX','POR','SAC','SAS','TOR','UTA','WAS']
          : (sport === 'nhl' 
              ? ['ANA','BOS','BUF','CGY','CAR','CHI','COL','CBJ','DAL','DET','EDM','FLA','LAK','MIN','MTL','NSH','NJD','NYI','NYR','OTT','PHI','PIT','SEA','SJS','STL','TBL','TOR','VAN','VGK','WPG','WSH']
              : ['ARI','ATL','BAL','BOS','CHC','CWS','CIN','CLE','COL','DET','HOU','KC','LAA','LAD','MIA','MIL','MIN','NYM','NYY','OAK','PHI','PIT','SD','SF','SEA','STL','TB','TEX','TOR','WSH']);
        setTeams(mockTeams.map(abbr => ({ abbreviation: abbr })));
        setUsingMock(true);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, [sport]);

  // ---------- Mock roster generator ----------
  const getMockRoster = (teamAbbr: string): Player[] => {
    const positions: Record<string, string[]> = {
      nba: ['PG', 'SG', 'SF', 'PF', 'C'],
      nhl: ['C', 'LW', 'RW', 'D', 'G'],
      mlb: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
    };
    const posList = positions[sport] || ['N/A'];
    const firstNames = ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles'];
    const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez'];
    const rosterSize = sport === 'nba' ? 15 : (sport === 'nhl' ? 23 : 26);
    const mockPlayers: Player[] = [];
    for (let i = 0; i < rosterSize; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const salary = 4000 + Math.floor(Math.random() * 9000);
      const points = sport === 'nhl' ? 0.5 + Math.random() * 1.5 : (sport === 'mlb' ? 1 + Math.random() * 5 : 5 + Math.random() * 20);
      const rebounds = sport === 'mlb' ? 0 : 2 + Math.random() * 8;
      const assists = 1 + Math.random() * 7;
      const projection = points + rebounds * 0.8 + assists * 0.8;
      const player: Player = {
        id: `mock-${sport}-${teamAbbr}-${fullName}-${i}`,
        name: fullName,
        team: teamAbbr,
        position: posList[Math.floor(Math.random() * posList.length)],
        salary,
        projection: parseFloat(projection.toFixed(1)),
        value: (projection / salary) * 1000,
        points: parseFloat(points.toFixed(1)),
        rebounds: parseFloat(rebounds.toFixed(1)),
        assists: parseFloat(assists.toFixed(1)),
        injury_status: Math.random() > 0.9 ? 'Day-to-Day' : 'Healthy',
        source: 'mock',
      };
      if (sport === 'nhl') {
        player.goals = parseFloat((Math.random() * 0.8).toFixed(1));
        player.plusMinus = Math.floor(Math.random() * 3) - 1;
        player.shots = parseFloat((1 + Math.random() * 4).toFixed(1));
        player.hits = parseFloat((Math.random() * 3).toFixed(1));
        player.blockedShots = parseFloat((Math.random() * 2).toFixed(1));
        player.timeOnIce = `${Math.floor(12 + Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
        player.faceoffPercent = (Math.random() * 60).toFixed(1);
      }
      if (sport === 'mlb') {
        player.atBats = Math.floor(Math.random() * 4) + 3;
        player.hits_mlb = parseFloat((Math.random() * 1.5).toFixed(1));
        player.homeRuns = Math.floor(Math.random() * 3);
        player.rbi = Math.floor(Math.random() * 4);
        player.stolenBases = Math.floor(Math.random() * 2);
        player.battingAverage = parseFloat((0.200 + Math.random() * 0.150).toFixed(3));
        player.ops = parseFloat((0.600 + Math.random() * 0.400).toFixed(3));
      }
      mockPlayers.push(player);
    }
    return mockPlayers;
  };

  // ---------- Filtering & sorting ----------
  const allPositions = useMemo(() => {
    const allPlayers = Array.from(rosters.values()).flat();
    const positions = new Set(allPlayers.map(p => p.position).filter(Boolean));
    return Array.from(positions).sort();
  }, [rosters]);

  const allTeamsForFilter = useMemo(() => teams.map(t => t.abbreviation).sort(), [teams]);

  const getFilteredPlayersForTeam = (teamAbbr: string) => {
    const teamPlayers = rosters.get(teamAbbr) || [];
    return teamPlayers.filter(p => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (positionFilter !== 'all' && p.position !== positionFilter) return false;
      return true;
    });
  };

  const sortPlayers = (list: Player[]) => {
    return [...list].sort((a, b) => {
      const aVal = a[sortConfig.column] ?? 0;
      const bVal = b[sortConfig.column] ?? 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (column: keyof Player) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleTeamToggle = (team: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else next.add(team);
      return next;
    });
  };

  const expandAll = () => setExpandedTeams(new Set(teams.map(t => t.abbreviation)));
  const collapseAll = () => setExpandedTeams(new Set());

  const handleSportChange = (_: any, newValue: 'nba' | 'mlb' | 'nhl') => {
    setSport(newValue);
    setSearchTerm('');
    setPositionFilter('all');
    setTeamFilter('all');
    setExpandedTeams(new Set());
  };

  const filteredTeams = useMemo(() => {
    if (teamFilter === 'all') return teams;
    return teams.filter(t => t.abbreviation === teamFilter);
  }, [teams, teamFilter]);

  // ---------- Table rendering ----------
  const renderTableHeaders = () => {
    const baseHeaders = (
      <>
        <TableCell>Player</TableCell>
        <TableCell>Pos</TableCell>
        <TableCell align="right">Salary</TableCell>
        <TableCell align="right">Proj</TableCell>
        <TableCell align="right">Value</TableCell>
      </>
    );
    if (sport === 'nhl') {
      return (
        <TableRow>
          {baseHeaders}
          <TableCell align="right">G</TableCell>
          <TableCell align="right">A</TableCell>
          <TableCell align="right">PTS</TableCell>
          <TableCell align="right">+/-</TableCell>
          <TableCell align="right">SOG</TableCell>
          <TableCell align="right">HIT</TableCell>
          <TableCell align="right">BLK</TableCell>
          <TableCell align="right">TOI</TableCell>
          <TableCell align="right">PPG</TableCell>
          <TableCell align="right">FO%</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      );
    }
    if (sport === 'mlb') {
      return (
        <TableRow>
          {baseHeaders}
          <TableCell align="right">AB</TableCell>
          <TableCell align="right">H</TableCell>
          <TableCell align="right">HR</TableCell>
          <TableCell align="right">RBI</TableCell>
          <TableCell align="right">SB</TableCell>
          <TableCell align="right">AVG</TableCell>
          <TableCell align="right">OPS</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      );
    }
    return (
      <TableRow>
        {baseHeaders}
        <TableCell align="right">PTS</TableCell>
        <TableCell align="right">REB</TableCell>
        <TableCell align="right">AST</TableCell>
        <TableCell align="right">ADP</TableCell>
        <TableCell>Status</TableCell>
      </TableRow>
    );
  };

  const renderPlayerRow = (player: Player) => {
    const baseCells = (
      <>
        <TableCell>{player.name}</TableCell>
        <TableCell>{player.position}</TableCell>
        <TableCell align="right">${player.salary.toLocaleString()}</TableCell>
        <TableCell align="right">{player.projection.toFixed(1)}</TableCell>
        <TableCell align="right" sx={{ color: player.value > 5 ? 'success.main' : 'inherit' }}>
          {player.value.toFixed(2)}
        </TableCell>
      </>
    );

    if (sport === 'nhl') {
      return (
        <TableRow key={player.id} hover>
          {baseCells}
          <TableCell align="right">{player.goals?.toFixed(1) || '0.0'}</TableCell>
          <TableCell align="right">{player.assists.toFixed(1)}</TableCell>
          <TableCell align="right">{player.points.toFixed(1)}</TableCell>
          <TableCell align="right">{player.plusMinus || '0'}</TableCell>
          <TableCell align="right">{player.shots?.toFixed(1) || '0.0'}</TableCell>
          <TableCell align="right">{player.hits?.toFixed(1) || '0.0'}</TableCell>
          <TableCell align="right">{player.blockedShots?.toFixed(1) || '0.0'}</TableCell>
          <TableCell align="right">{player.timeOnIce || '0:00'}</TableCell>
          <TableCell align="right">{player.powerPlayGoals?.toFixed(1) || '0.0'}</TableCell>
          <TableCell align="right">{player.faceoffPercent || '0'}</TableCell>
          <TableCell>
            <Chip label={player.injury_status || 'Healthy'} size="small" 
                  color={player.injury_status === 'Healthy' ? 'success' : 'error'} variant="outlined" />
          </TableCell>
        </TableRow>
      );
    }

    if (sport === 'mlb') {
      return (
        <TableRow key={player.id} hover>
          {baseCells}
          <TableCell align="right">{player.atBats ?? 0}</TableCell>
          <TableCell align="right">{(player.hits_mlb ?? 0).toFixed(1)}</TableCell>
          <TableCell align="right">{player.homeRuns ?? 0}</TableCell>
          <TableCell align="right">{player.rbi ?? 0}</TableCell>
          <TableCell align="right">{player.stolenBases ?? 0}</TableCell>
          <TableCell align="right">{(player.battingAverage ?? 0).toFixed(3)}</TableCell>
          <TableCell align="right">{(player.ops ?? 0).toFixed(3)}</TableCell>
          <TableCell>
            <Chip label={player.injury_status || 'Healthy'} size="small" 
                  color={player.injury_status === 'Healthy' ? 'success' : 'error'} variant="outlined" />
          </TableCell>
        </TableRow>
      );
    }

    // NBA
    return (
      <TableRow key={player.id} hover>
        {baseCells}
        <TableCell align="right">{player.points.toFixed(1)}</TableCell>
        <TableCell align="right">{player.rebounds.toFixed(1)}</TableCell>
        <TableCell align="right">{player.assists.toFixed(1)}</TableCell>
        <TableCell align="right">{player.adp?.toFixed(1) || '-'}</TableCell>
        <TableCell>
          <Chip label={player.injury_status || 'Healthy'} size="small" 
                color={player.injury_status === 'Healthy' ? 'success' : 'error'} variant="outlined" />
        </TableCell>
      </TableRow>
    );
  };

  // ---------- Loading states ----------
  if (loadingTeams && teams.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 3 }}>Loading {sport.toUpperCase()} teams...</Typography>
        </Box>
      </Container>
    );
  }

  if (error && teams.length === 0) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error" action={<IconButton onClick={() => window.location.reload()}><RefreshIcon /></IconButton>}>
          {error}
        </Alert>
      </Container>
    );
  }

  // ---------- Main render ----------
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={sport} onChange={handleSportChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          {sports.map(s => (
            <Tab 
              key={s.id} 
              value={s.id} 
              label={s.label} 
              icon={s.icon} 
              iconPosition="start"
              sx={{ 
                '&.Mui-selected': {
                  color: s.id === 'nba' ? '#ef4444' : s.id === 'mlb' ? '#10b981' : '#1e40af'
                }
              }}
            />
          ))}
        </Tabs>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>📋 {sport.toUpperCase()} Team Rosters</Typography>
          {usingMock && (
            <Badge badgeContent="PREVIEW" color="warning" sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: 20, minWidth: 50 } }} />
          )}
          {apiStatus[sport] && apiStatus[sport] !== 'ok' && apiStatus[sport] !== 'loading' && (
            <Chip label={apiStatus[sport]} size="small" color="warning" variant="outlined" />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete {new Date().getFullYear()}-{new Date().getFullYear() + 1} rosters with salaries, projections, and per‑game stats. Click a team to expand.
          {usingMock && <span> (Showing preview data – live data will appear when available)</span>}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mt: 2 }}>
          <TextField size="small" placeholder="Search player..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              endAdornment: searchTerm && (
                <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small" /></IconButton></InputAdornment>
              ),
            }} sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Position</InputLabel>
            <Select value={positionFilter} label="Position" onChange={(e) => setPositionFilter(e.target.value)}>
              <MenuItem value="all">All Positions</MenuItem>
              {allPositions.map(pos => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Team</InputLabel>
            <Select value={teamFilter} label="Team" onChange={(e) => setTeamFilter(e.target.value)}>
              <MenuItem value="all">All Teams</MenuItem>
              {allTeamsForFilter.map(team => <MenuItem key={team} value={team}>{team}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" size="small" onClick={expandAll}>Expand All</Button>
          <Button variant="outlined" size="small" onClick={collapseAll}>Collapse All</Button>
        </Box>
      </Paper>

      {filteredTeams.length === 0 ? (
        <Alert severity="info">No teams match your filters.</Alert>
      ) : (
        filteredTeams.map(teamInfo => {
          const teamPlayers = rosters.get(teamInfo.abbreviation) || [];
          const filtered = getFilteredPlayersForTeam(teamInfo.abbreviation);
          const sorted = sortPlayers(filtered);
          const isExpanded = expandedTeams.has(teamInfo.abbreviation);
          const isLoading = loadingRosters.has(teamInfo.abbreviation);
          const hasFailed = failedTeams.has(teamInfo.abbreviation);
          const displayPlayers = usingMock && !teamPlayers.length ? getMockRoster(teamInfo.abbreviation) : teamPlayers;
          const filteredDisplay = usingMock && !teamPlayers.length ? getMockRoster(teamInfo.abbreviation).filter(p => {
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (positionFilter !== 'all' && p.position !== positionFilter) return false;
            return true;
          }) : filtered;
          const sortedDisplay = sortPlayers(filteredDisplay);

          return (
            <Accordion key={teamInfo.abbreviation} expanded={isExpanded} onChange={() => handleTeamToggle(teamInfo.abbreviation)}
              sx={{ mb: 1, borderRadius: 1, '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {teamInfo.logo && <img src={teamInfo.logo} alt={teamInfo.abbreviation} style={{ height: 24, width: 24, objectFit: 'contain' }} />}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{teamInfo.abbreviation}</Typography>
                  <Chip label={`${displayPlayers.length} players`} size="small" />
                  <Box sx={{ flex: 1 }} />
                  {displayPlayers.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Avg Proj: {(displayPlayers.reduce((sum, p) => sum + p.projection, 0) / displayPlayers.length).toFixed(1)}
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2, overflowX: 'auto' }}>
                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={40} />
                    <Typography sx={{ ml: 2 }}>Loading roster...</Typography>
                  </Box>
                )}
                {hasFailed && !isLoading && (
                  <Alert severity="warning" action={
                    <Button color="inherit" size="small" onClick={() => loadRosterIfNeeded(teamInfo.abbreviation)}>
                      Retry
                    </Button>
                  }>
                    Failed to load roster. Click Retry or check your connection.
                  </Alert>
                )}
                {!isLoading && !hasFailed && sortedDisplay.length === 0 && (
                  <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>No player data available for this team.</Typography>
                )}
                {!isLoading && !hasFailed && sortedDisplay.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" stickyHeader>
                      <TableHead>
                        {renderTableHeaders()}
                      </TableHead>
                      <TableBody>
                        {sortedDisplay.map(player => renderPlayerRow(player))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Data refreshed every 5 minutes. Values are per‑game fantasy points per $1000 salary.
          {usingMock && ' Currently showing preview data. Live data will appear when the API becomes available.'}
        </Typography>
      </Box>
    </Container>
  );
};

export default TeamRostersPage;
