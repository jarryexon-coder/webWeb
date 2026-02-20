import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  Timeline,
  Group,
  Person,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

// ========== Type Definitions ==========
interface Player {
  id: string | number;
  name: string;
  team: string;
  position: string;
  points: number;
  rebounds: number;
  assists: number;
  steals?: number;
  blocks?: number;
  fantasy_points?: number;
  games_played?: number;
  minutes?: number;
  field_goal_pct?: number;
  three_point_pct?: number;
  free_throw_pct?: number;
  sport: string;
}

interface TeamStats {
  name: string;
  wins: number;
  losses: number;
  points_per_game: number;
  rebounds_per_game: number;
  assists_per_game: number;
  field_goal_pct: number;
  three_point_pct: number;
  free_throw_pct: number;
  opponent_ppg: number;
}

// ========== Sport Config ==========
const SPORTS = [
  { value: 'nba', label: 'NBA', icon: <SportsBasketball />, color: '#1d428a' },
  { value: 'nfl', label: 'NFL', icon: <SportsFootball />, color: '#013369' },
  { value: 'mlb', label: 'MLB', icon: <SportsBaseball />, color: '#e31837' },
  { value: 'nhl', label: 'NHL', icon: <SportsHockey />, color: '#000' },
];

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

// ========== Mock Data Generators ==========
const generateMockPlayers = (sport: string, count = 50): Player[] => {
  const teams = ['Lakers', 'Celtics', 'Warriors', 'Bucks', 'Suns', 'Nuggets'];
  const positions = {
    nba: ['PG', 'SG', 'SF', 'PF', 'C'],
    nfl: ['QB', 'RB', 'WR', 'TE', 'K'],
    mlb: ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'],
    nhl: ['C', 'LW', 'RW', 'D', 'G'],
  }[sport] || ['Unknown'];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i}`,
    name: `Player ${i + 1}`,
    team: teams[Math.floor(Math.random() * teams.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    points: Math.round(Math.random() * 30 + 5),
    rebounds: Math.round(Math.random() * 12 + 2),
    assists: Math.round(Math.random() * 10 + 1),
    steals: Math.round(Math.random() * 3),
    blocks: Math.round(Math.random() * 2),
    fantasy_points: Math.round(Math.random() * 50 + 10),
    games_played: 72,
    minutes: Math.round(Math.random() * 20 + 20),
    field_goal_pct: 0.45 + Math.random() * 0.1,
    three_point_pct: 0.35 + Math.random() * 0.1,
    free_throw_pct: 0.75 + Math.random() * 0.15,
    sport: sport.toUpperCase(),
  }));
};

const generateMockTeamStats = (sport: string): TeamStats[] => {
  const teams = ['Lakers', 'Celtics', 'Warriors', 'Bucks', 'Suns', 'Nuggets', '76ers', 'Heat'];
  return teams.map((name) => ({
    name,
    wins: Math.floor(Math.random() * 50 + 20),
    losses: Math.floor(Math.random() * 30 + 10),
    points_per_game: Math.round((Math.random() * 15 + 105) * 10) / 10,
    rebounds_per_game: Math.round((Math.random() * 10 + 40) * 10) / 10,
    assists_per_game: Math.round((Math.random() * 8 + 22) * 10) / 10,
    field_goal_pct: 0.45 + Math.random() * 0.05,
    three_point_pct: 0.35 + Math.random() * 0.05,
    free_throw_pct: 0.75 + Math.random() * 0.05,
    opponent_ppg: Math.round((Math.random() * 10 + 100) * 10) / 10,
  }));
};

// ========== Main Component ==========
const SportsSpecificAnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedSport, setSelectedSport] = useState('nba');
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedStat, setSelectedStat] = useState('points');

  // ========== Fetch Players ==========
  const {
    data: players = [],
    isLoading: playersLoading,
    error: playersError,
    refetch: refetchPlayers,
  } = useQuery<Player[]>({
    queryKey: ['players', selectedSport],
    queryFn: async () => {
      console.log(`🔄 Fetching players for ${selectedSport}...`);
      try {
        const res = await api.get(`/api/players?sport=${selectedSport}&limit=200&realtime=false`);
        const response = res.data;
        console.log('📦 Players response:', response);
        if (response.success && response.data?.players) {
          return response.data.players;
        }
        if (Array.isArray(response)) return response;
        console.warn('Unexpected players response, using mock data');
        return generateMockPlayers(selectedSport);
      } catch (err) {
        console.error('Players API error, using mock data', err);
        return generateMockPlayers(selectedSport);
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // ========== Fetch Team Stats ==========
  const {
    data: teamStats = [],
    isLoading: teamStatsLoading,
    error: teamStatsError,
    refetch: refetchTeamStats,
  } = useQuery<any[]>({
    queryKey: ['team-stats', selectedSport],
    queryFn: async () => {
      console.log(`🔄 Fetching team stats for ${selectedSport}...`);
      try {
        const res = await api.get(`/api/stats/database?sport=${selectedSport}&category=team_stats`);
        const response = res.data;
        console.log('📦 Team stats response:', response);
        if (response.success) {
          const data = response.data || response.database;
          if (Array.isArray(data) && data.length > 0) return data;
          if (data && typeof data === 'object') {
            for (const key of ['teams', 'team_stats', 'data']) {
              if (Array.isArray(data[key]) && data[key].length > 0) return data[key];
            }
          }
        }
        if (Array.isArray(response) && response.length > 0) return response;
        console.warn('No team stats found, using mock data');
        return generateMockTeamStats(selectedSport);
      } catch (err) {
        console.error('Team stats API error, using mock data', err);
        return generateMockTeamStats(selectedSport);
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  // Determine if we're using simulated data
  const isSimulated = useMemo(() => {
    // If the players array contains mock IDs or team stats are mock, treat as simulated
    const hasMockPlayer = players.some(p => String(p.id).startsWith('mock-'));
    // Team stats might be mock if they don't have a real source indicator
    return hasMockPlayer || playersError !== null || teamStatsError !== null;
  }, [players, playersError, teamStatsError]);

  // ========== Process Data ==========
  const topPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => {
        const valA = a[selectedStat as keyof Player] as number || 0;
        const valB = b[selectedStat as keyof Player] as number || 0;
        return valB - valA;
      })
      .slice(0, 10);
  }, [players, selectedStat]);

  const positionData = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => {
      const pos = p.position || 'Unknown';
      counts[pos] = (counts[pos] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [players]);

  const scoringDistribution = useMemo(() => {
    if (selectedSport !== 'nba') return [];
    const buckets: Record<string, number> = {
      '0-10': 0,
      '10-20': 0,
      '20-30': 0,
      '30-40': 0,
      '40+': 0,
    };
    players.forEach((p) => {
      const pts = p.points || 0;
      if (pts < 10) buckets['0-10'] += 1;
      else if (pts < 20) buckets['10-20'] += 1;
      else if (pts < 30) buckets['20-30'] += 1;
      else if (pts < 40) buckets['30-40'] += 1;
      else buckets['40+'] += 1;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [players, selectedSport]);

  // ========== Loading State ==========
  if (playersLoading || teamStatsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // ========== Render Helpers ==========
  const renderStatSelector = () => (
    <FormControl sx={{ minWidth: 200 }} size="small">
      <InputLabel id="stat-select-label">Statistic</InputLabel>
      <Select
        labelId="stat-select-label"
        value={selectedStat}
        label="Statistic"
        onChange={(e) => setSelectedStat(e.target.value)}
      >
        <MenuItem value="points">Points</MenuItem>
        <MenuItem value="rebounds">Rebounds</MenuItem>
        <MenuItem value="assists">Assists</MenuItem>
        <MenuItem value="steals">Steals</MenuItem>
        <MenuItem value="blocks">Blocks</MenuItem>
        <MenuItem value="fantasy_points">Fantasy Points</MenuItem>
      </Select>
    </FormControl>
  );

  const renderOverviewCards = () => {
    const avgPoints = players.reduce((acc, p) => acc + (p.points || 0), 0) / (players.length || 1);
    const avgRebounds = players.reduce((acc, p) => acc + (p.rebounds || 0), 0) / (players.length || 1);
    const avgAssists = players.reduce((acc, p) => acc + (p.assists || 0), 0) / (players.length || 1);
    const totalPlayers = players.length;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Avg. Points</Typography>
              <Typography variant="h4">{avgPoints.toFixed(1)}</Typography>
              <Typography variant="caption">per game</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Avg. Rebounds</Typography>
              <Typography variant="h4">{avgRebounds.toFixed(1)}</Typography>
              <Typography variant="caption">per game</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Avg. Assists</Typography>
              <Typography variant="h4">{avgAssists.toFixed(1)}</Typography>
              <Typography variant="caption">per game</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">Active Players</Typography>
              <Typography variant="h4">{totalPlayers}</Typography>
              <Typography variant="caption">in database</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderPlayerLeaderboard = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Top 10 Players - {selectedStat.toUpperCase()}</Typography>
          {renderStatSelector()}
        </Box>
        {playersError && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => refetchPlayers()}>
                Retry
              </Button>
            }
            sx={{ mb: 2 }}
          >
            Using simulated player data. {playersError.message}
          </Alert>
        )}
        {players.length === 0 ? (
          <Alert severity="info">No player data available for {selectedSport.toUpperCase()}.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">{selectedStat.toUpperCase()}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topPlayers.map((player, idx) => (
                  <TableRow key={player.id}>
                    <TableCell>#{idx + 1}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: theme.palette.primary.main }}>
                          {player.name.charAt(0)}
                        </Avatar>
                        {player.name}
                      </Box>
                    </TableCell>
                    <TableCell>{player.team}</TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>
                        {typeof player[selectedStat as keyof Player] === 'number'
                          ? (player[selectedStat as keyof Player] as number).toFixed(1)
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderPositionChart = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Position Distribution</Typography>
        {positionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={positionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {positionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box py={4} textAlign="center">
            <Typography color="textSecondary">No position data available</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderScoringDistribution = () => {
    if (selectedSport !== 'nba') return null;
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Scoring Distribution</Typography>
          {scoringDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoringDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box py={4} textAlign="center">
              <Typography color="textSecondary">No scoring data available</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTeamStatsTable = () => {
    if (teamStatsError) {
      return (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => refetchTeamStats()}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          Using simulated team statistics. {teamStatsError.message}
        </Alert>
      );
    }
    if (teamStats.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          No team statistics available for {selectedSport.toUpperCase()}.
        </Alert>
      );
    }
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Team Statistics</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">W-L</TableCell>
                  <TableCell align="right">PPG</TableCell>
                  <TableCell align="right">RPG</TableCell>
                  <TableCell align="right">APG</TableCell>
                  <TableCell align="right">FG%</TableCell>
                  <TableCell align="right">3P%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamStats.slice(0, 10).map((team: any, idx) => (
                  <TableRow key={team.name || team.team || idx}>
                    <TableCell>{team.name || team.team || 'Unknown'}</TableCell>
                    <TableCell align="right">
                      {team.wins || 0}-{team.losses || 0}
                    </TableCell>
                    <TableCell align="right">{(team.points_per_game || 0).toFixed(1)}</TableCell>
                    <TableCell align="right">{(team.rebounds_per_game || 0).toFixed(1)}</TableCell>
                    <TableCell align="right">{(team.assists_per_game || 0).toFixed(1)}</TableCell>
                    <TableCell align="right">{((team.field_goal_pct || 0) * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{((team.three_point_pct || 0) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    // Apply the theme's background to the main container
    <Box p={3} sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          {SPORTS.find((s) => s.value === selectedSport)?.icon}
          <Typography variant="h4" fontWeight={600} sx={{ ml: 1 }}>
            {selectedSport.toUpperCase()} Analytics
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="sport-select-label">Sport</InputLabel>
          <Select
            labelId="sport-select-label"
            value={selectedSport}
            label="Sport"
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            {SPORTS.map((sport) => (
              <MenuItem key={sport.value} value={sport.value}>
                <Box display="flex" alignItems="center">
                  {sport.icon}
                  <Typography sx={{ ml: 1 }}>{sport.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Data Source Status */}
      <Box mb={3}>
        <Alert severity={isSimulated ? 'info' : 'success'}>
          {isSimulated
            ? '⚠️ Using simulated data (live API unavailable)'
            : '✅ Using real-time data from API'}
        </Alert>
      </Box>

      {/* Overview Cards */}
      <Box mb={4}>{renderOverviewCards()}</Box>

      {/* Tabs – with background that contrasts with the text */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: theme.palette.background.paper }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
          <Tab icon={<Person />} iconPosition="start" label="Players" />
          <Tab icon={<Group />} iconPosition="start" label="Teams" />
          <Tab icon={<Timeline />} iconPosition="start" label="Advanced" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box>
        {tabIndex === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {renderPlayerLeaderboard()}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderPositionChart()}
              {selectedSport === 'nba' && <Box mt={3}>{renderScoringDistribution()}</Box>}
            </Grid>
          </Grid>
        )}

        {tabIndex === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>{renderTeamStatsTable()}</Grid>
          </Grid>
        )}

        {tabIndex === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info">
                Advanced analytics coming soon: player efficiency ratings, usage rates, and more.
              </Alert>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default SportsSpecificAnalyticsScreen;
