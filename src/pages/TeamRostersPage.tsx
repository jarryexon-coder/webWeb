// src/pages/TeamRostersPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Paper, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  CircularProgress, Alert, Box, Chip, FormControl, InputLabel, Select, MenuItem,
  TextField, InputAdornment, IconButton, Button, Tab, Tabs, Badge, Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';

// Extended Player interface with all possible stats
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
  adp?: number;
  source?: string;
  
  // NHL-specific stats
  goals?: number;
  plusMinus?: number;
  shots?: number;
  hits?: number;
  blockedShots?: number;
  timeOnIce?: string;
  powerPlayGoals?: number;
  powerPlayAssists?: number;
  powerPlayPoints?: number;
  faceoffsWon?: number;
  faceoffsLost?: number;
  faceoffs?: number;
  faceoffPercent?: number;
  penalties?: number;
  penaltiesInMinutes?: number;
  shifts?: number;
  takeaways?: number;
  giveaways?: number;
  shotsMissedNet?: number;
  
  // MLB-specific stats
  atBats?: number;
  hits?: number;
  homeRuns?: number;
  rbi?: number;
  stolenBases?: number;
  battingAverage?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  ops?: number;
  inningsPitched?: number;
  era?: number;
  whip?: number;
  strikeouts?: number;
  wins?: number;
  losses?: number;
  saves?: number;
}

interface TeamInfo {
  abbreviation: string;
  fullName?: string;
  logo?: string;
}

const API_BASE = 'https://prizepicks-production.up.railway.app';
const CACHE_TTL = 5 * 60 * 1000;
const dataCache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = dataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[TeamRosters] ✅ Using cached data for ${key}`);
    return cached.data;
  }
  console.log(`[TeamRosters] 🔄 Fetching fresh data for ${key}`);
  const data = await fetcher();
  dataCache.set(key, { data, timestamp: Date.now() });
  return data;
}

const TeamRostersPage: React.FC = () => {
  const [sport, setSport] = useState<'nba' | 'mlb' | 'nhl'>('nba');
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

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

  const fetchTeams = async (sport: string): Promise<TeamInfo[]> => {
    const url = `${API_BASE}/api/tank01/teams?league=${sport}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (!json.success || !Array.isArray(json.data)) throw new Error('Invalid response');
      return json.data;
    } catch (err) {
      console.warn(`[TeamRosters] Failed to fetch teams, using fallback:`, err);
      if (sport === 'mlb') {
        return [
          'ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CWS', 'CIN', 'CLE', 'COL', 'DET',
          'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK',
          'PHI', 'PIT', 'SD', 'SF', 'SEA', 'STL', 'TB', 'TEX', 'TOR', 'WSH'
        ].map(abbr => ({ abbreviation: abbr }));
      }
      if (sport === 'nhl') {
        return [
          'ANA', 'ARI', 'BOS', 'BUF', 'CAR', 'CBJ', 'CGY', 'CHI', 'COL', 'DAL',
          'DET', 'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NJD', 'NSH', 'NYI', 'NYR',
          'OTT', 'PHI', 'PIT', 'SEA', 'SJS', 'STL', 'TBL', 'TOR', 'VAN', 'VGK',
          'WPG', 'WSH'
        ].map(abbr => ({ abbreviation: abbr }));
      }
      return [];
    }
  };

  useEffect(() => {
    console.log(`[TeamRosters] 🏁 Sport changed to ${sport}, fetching...`);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setUsingMock(false);

      try {
        const playersUrl = `${API_BASE}/api/fantasyhub/players?sport=${sport}&filterByToday=false`;
        const playersData = await fetchWithCache(`team-rosters-${sport}`, async () => {
          const response = await fetch(playersUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const json = await response.json();
          if (!json.success || !Array.isArray(json.data)) throw new Error('Invalid API response');
          return json.data;
        });

        let teamList: TeamInfo[] = [];
        if (sport === 'nba') {
          const uniqueTeams = [...new Set(playersData.map((p: any) => p.team).filter(Boolean))];
          teamList = uniqueTeams.map(abbr => ({ abbreviation: abbr }));
        } else {
          teamList = await fetchTeams(sport);
        }

        // Transform players - preserve all stats from backend
        const transformed = playersData.map((p: any, idx: number) => {
          // Base player object with all possible fields
          const player: any = {
            id: p.player_id || p.id || `api-${sport}-${idx}`,
            name: p.name,
            team: p.team || 'FA',
            position: p.position || 'N/A',
            salary: parseFloat(p.salary) || 5000,
            projection: parseFloat(p.fantasy_points || p.projection) || 0,
            value: parseFloat(p.value) || 0,
            points: parseFloat(p.points) || 0,
            rebounds: parseFloat(p.rebounds) || 0,
            assists: parseFloat(p.assists) || 0,
            injury_status: p.injury_status || 'Healthy',
            adp: parseFloat(p.adp) || undefined,
            source: p.source || 'api',
          };

          // NHL-specific stats
          if (sport === 'nhl') {
            player.goals = parseFloat(p.goals) || 0;
            player.plusMinus = parseInt(p.plusMinus) || 0;
            player.shots = parseFloat(p.shots) || 0;
            player.hits = parseFloat(p.hits) || 0;
            player.blockedShots = parseFloat(p.blockedShots) || 0;
            player.timeOnIce = p.timeOnIce || '0:00';
            player.powerPlayGoals = parseFloat(p.powerPlayGoals) || 0;
            player.powerPlayAssists = parseFloat(p.powerPlayAssists) || 0;
            player.powerPlayPoints = parseFloat(p.powerPlayPoints) || 0;
            player.faceoffsWon = parseFloat(p.faceoffsWon) || 0;
            player.faceoffsLost = parseFloat(p.faceoffsLost) || 0;
            player.faceoffs = parseFloat(p.faceoffs) || 0;
            player.faceoffPercent = p.faceoffs ? ((parseFloat(p.faceoffsWon) || 0) / (parseFloat(p.faceoffs) || 1) * 100).toFixed(1) : '0';
            player.penalties = parseFloat(p.penalties) || 0;
            player.penaltiesInMinutes = parseFloat(p.penaltiesInMinutes) || 0;
            player.shifts = parseInt(p.shifts) || 0;
            player.takeaways = parseFloat(p.takeaways) || 0;
            player.giveaways = parseFloat(p.giveaways) || 0;
            player.shotsMissedNet = parseFloat(p.shotsMissedNet) || 0;
          }

          // MLB-specific stats
          if (sport === 'mlb') {
            player.atBats = parseInt(p.atBats) || 0;
            player.hits = parseFloat(p.hits) || 0;
            player.homeRuns = parseInt(p.homeRuns) || 0;
            player.rbi = parseInt(p.rbi) || 0;
            player.stolenBases = parseInt(p.stolenBases) || 0;
            player.battingAverage = parseFloat(p.battingAverage) || 0;
            player.onBasePercentage = parseFloat(p.onBasePercentage) || 0;
            player.sluggingPercentage = parseFloat(p.sluggingPercentage) || 0;
            player.ops = parseFloat(p.ops) || 0;
            player.inningsPitched = parseFloat(p.inningsPitched) || 0;
            player.era = parseFloat(p.era) || 0;
            player.whip = parseFloat(p.whip) || 0;
            player.strikeouts = parseInt(p.strikeouts) || 0;
            player.wins = parseInt(p.wins) || 0;
            player.losses = parseInt(p.losses) || 0;
            player.saves = parseInt(p.saves) || 0;
          }

          return player;
        });

        const validPlayers = transformed.filter((p: Player) =>
          teamList.some(t => t.abbreviation === p.team)
        );
        if (validPlayers.length < transformed.length) {
          console.warn(`[TeamRosters] Filtered out ${transformed.length - validPlayers.length} players with invalid teams for ${sport}`);
        }

        if (validPlayers.length === 0 && sport !== 'nba') {
          console.log(`[TeamRosters] ⚠️ No valid real data for ${sport}, using mock fallback`);
          const mockPlayers = generateMockPlayers(sport, teamList);
          setPlayers(mockPlayers);
          setUsingMock(true);
        } else {
          setPlayers(validPlayers);
          setUsingMock(false);
        }

        setTeams(teamList);
      } catch (err: any) {
        console.error(`[TeamRosters] ❌ Fetch error:`, err);
        setError(err.message);
        if (sport !== 'nba') {
          const fallbackTeams = await fetchTeams(sport);
          const mockPlayers = generateMockPlayers(sport, fallbackTeams);
          setPlayers(mockPlayers);
          setTeams(fallbackTeams);
          setUsingMock(true);
          setError(null);
        }
      } finally {
        setLoading(false);
        console.log(`[TeamRosters] ✅ Fetch complete for ${sport}`);
      }
    };

    fetchData();
  }, [sport]);

  const generateMockPlayers = (sport: string, teamList: TeamInfo[]): Player[] => {
    const positions: Record<string, string[]> = {
      mlb: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
      nhl: ['C', 'LW', 'RW', 'D', 'G'],
    };
    const posList = positions[sport] || ['N/A'];
    const mockPlayers: Player[] = [];

    teamList.forEach((team, teamIdx) => {
      const numPlayers = 15 + Math.floor(Math.random() * 10);
      for (let i = 0; i < numPlayers; i++) {
        const salary = 4000 + Math.floor(Math.random() * 9000);
        const points = sport === 'nhl' ? 0.5 + Math.random() * 1.5 : 5 + Math.random() * 20;
        const rebounds = sport === 'mlb' ? 0 : (2 + Math.random() * 8);
        const assists = 1 + Math.random() * 7;
        const projection = points + rebounds * 0.8 + assists * 0.8;
        const value = (projection / salary) * 1000;

        const player: Player = {
          id: `mock-${sport}-${team.abbreviation}-${i}`,
          name: `${sport.toUpperCase()} Player ${teamIdx * 100 + i}`,
          team: team.abbreviation,
          position: posList[i % posList.length],
          salary,
          projection: parseFloat(projection.toFixed(1)),
          value: parseFloat(value.toFixed(2)),
          points: parseFloat(points.toFixed(1)),
          rebounds: parseFloat(rebounds.toFixed(1)),
          assists: parseFloat(assists.toFixed(1)),
          injury_status: Math.random() > 0.9 ? 'Day-to-Day' : 'Healthy',
          source: 'mock',
        };

        // Add sport-specific mock stats
        if (sport === 'nhl') {
          player.goals = parseFloat((Math.random() * 0.8).toFixed(1));
          player.plusMinus = Math.floor(Math.random() * 3) - 1;
          player.shots = parseFloat((1 + Math.random() * 4).toFixed(1));
          player.hits = parseFloat((Math.random() * 3).toFixed(1));
          player.blockedShots = parseFloat((Math.random() * 2).toFixed(1));
          player.timeOnIce = `${Math.floor(12 + Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
          player.powerPlayGoals = parseFloat((Math.random() * 0.3).toFixed(1));
        }

        if (sport === 'mlb') {
          player.hits = parseFloat((Math.random() * 1.5).toFixed(1));
          player.homeRuns = Math.floor(Math.random() * 3);
          player.rbi = Math.floor(Math.random() * 4);
          player.battingAverage = parseFloat((0.200 + Math.random() * 0.150).toFixed(3));
        }

        mockPlayers.push(player);
      }
    });
    return mockPlayers;
  };

  const playersByTeam = useMemo(() => {
    const map = new Map<string, Player[]>();
    players.forEach(p => {
      if (!map.has(p.team)) map.set(p.team, []);
      map.get(p.team)!.push(p);
    });
    return map;
  }, [players]);

  const allPositions = useMemo(() => {
    const positions = new Set(players.map(p => p.position).filter(Boolean));
    return Array.from(positions).sort();
  }, [players]);

  const allTeamsForFilter = useMemo(() => teams.map(t => t.abbreviation).sort(), [teams]);

  const getFilteredPlayersForTeam = (teamAbbr: string) => {
    const teamPlayers = playersByTeam.get(teamAbbr) || [];
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

  if (loading && players.length === 0) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <Box textAlign="center"><CircularProgress size={60} /><Typography variant="h6" sx={{ mt: 3 }}>Loading {sport.toUpperCase()} rosters...</Typography></Box>
      </Container>
    );
  }

  if (error && players.length === 0 && teams.length === 0) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error" action={<IconButton onClick={() => window.location.reload()}><RefreshIcon /></IconButton>}>{error}</Alert>
      </Container>
    );
  }

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

    // NBA
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
          <TableCell align="right">{player.atBats || '0'}</TableCell>
          <TableCell align="right">{player.hits?.toFixed(1) || '0.0'}</TableCell>
          <TableCell align="right">{player.homeRuns || '0'}</TableCell>
          <TableCell align="right">{player.rbi || '0'}</TableCell>
          <TableCell align="right">{player.stolenBases || '0'}</TableCell>
          <TableCell align="right">{player.battingAverage?.toFixed(3) || '.000'}</TableCell>
          <TableCell align="right">{player.ops?.toFixed(3) || '.000'}</TableCell>
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={sport} onChange={handleSportChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          {sports.map(s => <Tab key={s.id} value={s.id} label={s.label} icon={s.icon} iconPosition="start" />)}
        </Tabs>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>📋 {sport.toUpperCase()} Team Rosters</Typography>
          {usingMock && <Badge badgeContent="MOCK" color="warning" sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem', height: 20, minWidth: 50 } }} />}
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete 2025‑26 rosters with salaries, projections, and per‑game stats. Click a team to expand.
          {usingMock && <span> (Showing preview data – API unavailable)</span>}
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
          const teamPlayers = getFilteredPlayersForTeam(teamInfo.abbreviation);
          const sorted = sortPlayers(teamPlayers);
          const isExpanded = expandedTeams.has(teamInfo.abbreviation);

          return (
            <Accordion key={teamInfo.abbreviation} expanded={isExpanded} onChange={() => handleTeamToggle(teamInfo.abbreviation)}
              sx={{ mb: 1, borderRadius: 1, '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {teamInfo.logo && <img src={teamInfo.logo} alt={teamInfo.abbreviation} style={{ height: 24, width: 24, objectFit: 'contain' }} />}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{teamInfo.abbreviation}</Typography>
                  <Chip label={`${teamPlayers.length} players`} size="small" />
                  <Box sx={{ flex: 1 }} />
                  {teamPlayers.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Avg Proj: {(teamPlayers.reduce((sum, p) => sum + p.projection, 0) / teamPlayers.length).toFixed(1)}
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2, overflowX: 'auto' }}>
                {teamPlayers.length === 0 ? (
                  <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>No player data available for this team.</Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" stickyHeader>
                      <TableHead>
                        {renderTableHeaders()}
                      </TableHead>
                      <TableBody>
                        {sorted.map(player => renderPlayerRow(player))}
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
          {usingMock && ' Currently showing preview data.'}
        </Typography>
      </Box>
    </Container>
  );
};

export default TeamRostersPage;
