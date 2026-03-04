// src/pages/AnalyticsDashboardScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
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
  Chip,
  Divider,
  useTheme,
  Tab,
  Tabs,
  Pagination,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  Assessment,
  Warning,
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
import { format, isValid } from 'date-fns';

const API_BASE = 'https://prizepicks-production.up.railway.app';

const safeFormat = (date: Date | null | undefined, formatStr: string, fallback: string = ''): string => {
  if (!date) return fallback;
  try {
    return format(date, formatStr);
  } catch {
    return fallback;
  }
};

const SPORTS = [
  { value: 'nba', label: 'NBA', icon: <SportsBasketball />, color: '#1d428a' },
  { value: 'nfl', label: 'NFL', icon: <SportsFootball />, color: '#013369' },
  { value: 'mlb', label: 'MLB', icon: <SportsBaseball />, color: '#e31837' },
  { value: 'nhl', label: 'NHL', icon: <SportsHockey />, color: '#000' },
];

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
const TREND_COLORS = {
  up: '#4caf50',
  down: '#f44336',
  stable: '#ff9800',
  warning: '#ff9800',
};

const parseTankDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  if (/^\d{8}$/.test(dateStr)) {
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    const dt = new Date(`${y}-${m}-${d}T12:00:00`);
    return isValid(dt) ? dt : null;
  }
  const dt = new Date(dateStr);
  return isValid(dt) ? dt : null;
};

const AnalyticsDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const [selectedSport, setSelectedSport] = useState('nba');
  const [tabValue, setTabValue] = useState(0);
  // Pagination state for Player Analysis tab
  const [playerPage, setPlayerPage] = useState(1);
  const playersPerPage = 12; // Adjust as needed

  // Reset to page 1 when sport changes
  useEffect(() => {
    setPlayerPage(1);
  }, [selectedSport]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // ========== Player data from /api/players/master ==========
  const { data: playersData, isLoading: playersLoading, error: playersError } = useQuery({
    queryKey: ['players_master', selectedSport],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/players/master?sport=${selectedSport}`);
      if (!res.ok) throw new Error('Failed to fetch players');
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    keepPreviousData: true,
  });

  // Injuries from Tank01
  const { data: injuriesRaw, isLoading: injLoading, error: injError } = useQuery({
    queryKey: ['tank01_injuries', selectedSport],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/tank01/injuries?sport=${selectedSport}`);
      if (!res.ok) throw new Error('Failed to fetch injuries');
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    keepPreviousData: true,
  });

  // Games from Tank01
  const { data: gamesData, isLoading: gamesLoading, error: gamesError } = useQuery({
    queryKey: ['tank01_games', selectedSport, todayStr],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/tank01/games?date=${todayStr}&sport=${selectedSport}`);
      if (!res.ok) throw new Error('Failed to fetch games');
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    keepPreviousData: true,
  });

  // PrizePicks selections (value bets)
  const { data: propsData, isLoading: propsLoading, error: propsError } = useQuery({
    queryKey: ['prizepicks_selections', selectedSport],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/prizepicks/selections?sport=${selectedSport}`);
      if (!res.ok) throw new Error('Failed to fetch props');
      const json = await res.json();
      return json.selections || [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    keepPreviousData: true,
  });

  const loading = playersLoading || injLoading || gamesLoading || propsLoading;
  const error = playersError || injError || gamesError || propsError;

  // ========== PROCESS DATA ==========

  // Build a map from player ID to player name for injury lookup
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(playersData)) {
      playersData.forEach((p: any) => {
        if (p.id && p.name) {
          map.set(p.id, p.name);
        }
      });
    }
    return map;
  }, [playersData]);

  // Player data – all players (no slice)
  const playerData = useMemo(() => {
    if (!Array.isArray(playersData)) return [];
    if (playersData.length > 0) {
      console.log('🧪 First player from master endpoint:', playersData[0]);
    }
    return playersData.map((p: any) => ({
      id: p.id,
      name: p.name || 'Unknown',
      team: p.team || 'FA',
      position: p.position || 'N/A',
      points: p.points || 0,
      rebounds: p.rebounds || 0,
      assists: p.assists || 0,
      fantasy_points: p.fantasy_points || p.projection || 0,
    }));
  }, [playersData]);

  // Injuries – attach player name from map
  const injuryData = useMemo(() => {
    if (!Array.isArray(injuriesRaw)) return [];
    const idCounts = new Map<string, number>();
    return injuriesRaw.map((inj: any, idx: number) => {
      const baseId = inj.playerID || `inj-${idx}`;
      const count = idCounts.get(baseId) || 0;
      idCounts.set(baseId, count + 1);
      const uniqueId = count === 0 ? baseId : `${baseId}-${count}`;
      const reported = parseTankDate(inj.injDate);
      const ret = parseTankDate(inj.injReturnDate);
      const playerName = playerNameMap.get(inj.playerID) || `Player ${inj.playerID?.slice(-4) || idx}`;
      return {
        id: uniqueId,
        playerName,
        team: 'N/A',
        position: 'N/A',
        injury: inj.description || 'No details',
        status: inj.designation || 'Unknown',
        reportedDate: reported,
        returnDate: ret,
        impact: 'Medium',
      };
    });
  }, [injuriesRaw, playerNameMap]);

  // Games
  const games = useMemo(() => {
    if (!Array.isArray(gamesData)) return [];
    return gamesData.map((game: any) => {
      const gameDateObj = parseTankDate(game.gameDate);
      const timeStr = safeFormat(gameDateObj, 'hh:mm a', 'TBD');
      return {
        id: game.gameID,
        homeTeam: { name: game.home || 'Home', logo: game.home?.slice(0, 2) || 'H', color: '#1976d2' },
        awayTeam: { name: game.away || 'Away', logo: game.away?.slice(0, 2) || 'A', color: '#dc004e' },
        homeScore: game.homeScore || 0,
        awayScore: game.awayScore || 0,
        status: game.gameStatus || 'Scheduled',
        sport: selectedSport,
        time: timeStr,
        venue: game.venue || 'TBD',
      };
    });
  }, [gamesData, selectedSport]);

// Inside the useMemo for valueBetData (around line 200)
const valueBetData = useMemo(() => {
  if (!Array.isArray(propsData)) return [];

  // First, filter to current sport and map to a consistent format
  const allProps = propsData
    .filter((prop: any) => prop.sport?.toLowerCase() === selectedSport)
    .map((prop: any, idx: number) => {
      let timestamp = prop.timestamp;
      if (timestamp) {
        const d = new Date(timestamp);
        if (!isValid(d)) timestamp = new Date().toISOString();
      } else {
        timestamp = new Date().toISOString();
      }

      // Parse odds to number for comparison
      let oddsNumber = 0;
      if (prop.odds) {
        const oddsStr = prop.odds.toString().replace('+', '');
        oddsNumber = parseInt(oddsStr, 10) || 0;
      }

      return {
        id: prop.id || `prop-${idx}`,
        player: prop.player,
        stat: prop.stat,
        line: prop.line,
        game: prop.game || (prop.player ? `${prop.player} prop` : 'Game'),
        betType: prop.stat ? `${prop.stat} (line: ${prop.line})` : 'Parlay',
        odds: prop.odds || '-110',
        oddsNumber, // numeric for comparison
        edge: prop.edge ? `${prop.edge}%` : '5%',
        confidence: prop.confidence || 'Medium',
        projection: prop.projection, // <-- include projection
        sport: prop.sport,
        timestamp,
      };
    });

  // Deduplicate by player + stat + line, keeping the one with highest oddsNumber
  const uniqueMap = new Map();
  allProps.forEach(prop => {
    const key = `${prop.player}|${prop.stat}|${prop.line}`;
    const existing = uniqueMap.get(key);
    if (!existing || prop.oddsNumber > existing.oddsNumber) {
      uniqueMap.set(key, prop);
    }
  });

  return Array.from(uniqueMap.values());
}, [propsData, selectedSport]);

  // Metrics
  const metrics = useMemo(() => {
    const totalPlayers = playerData.length;
    const injuredCount = injuryData.length;
    const valueBetsCount = valueBetData.length;
    const positiveEdges = valueBetData.filter(b => parseFloat(b.edge) > 5).length;
    const posCounts: Record<string, number> = {};
    playerData.forEach(p => { posCounts[p.position] = (posCounts[p.position] || 0) + 1; });
    return [
      {
        id: '1', title: 'Total Players', metric: 'players', value: totalPlayers,
        change: totalPlayers > 300 ? '+5%' : '+2%', trend: totalPlayers > 300 ? 'up' : 'stable',
        sport: selectedSport.toUpperCase(), sample_size: totalPlayers,
      },
      {
        id: '2', title: 'Injuries', metric: 'injuries', value: injuredCount,
        change: injuredCount > 20 ? '-3%' : '+1%', trend: injuredCount > 20 ? 'down' : 'warning',
        sport: selectedSport.toUpperCase(), injured_count: injuredCount,
      },
      {
        id: '3', title: 'Value Bets Found', metric: 'value_bets', value: valueBetsCount,
        change: `+${positiveEdges}`, trend: positiveEdges > 3 ? 'up' : 'stable',
        sport: selectedSport.toUpperCase(), positive_edges: positiveEdges, total_analyzed: valueBetsCount,
      },
      {
        id: '4', title: 'Position Averages', metric: 'position_averages', value: Object.keys(posCounts).length,
        change: '+0.8%', trend: 'up', sport: selectedSport.toUpperCase(), position_distribution: posCounts,
      },
    ];
  }, [playerData, injuryData, valueBetData, selectedSport]);

  const positionData = useMemo(() => {
    const posMetric = metrics.find(m => m.metric === 'position_averages');
    if (!posMetric?.position_distribution) return [];
    return Object.entries(posMetric.position_distribution).map(([name, value]) => ({ name, value }));
  }, [metrics]);

  const edgeData = useMemo(() => {
    const pos = valueBetData.filter(b => parseFloat(b.edge) > 0).length;
    const neg = valueBetData.length - pos;
    return [
      { name: 'Positive Edge', value: pos },
      { name: 'Negative/No Edge', value: neg },
    ];
  }, [valueBetData]);

  // ========== RENDER HELPERS ==========
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp sx={{ color: TREND_COLORS.up }} />;
      case 'down': return <TrendingDown sx={{ color: TREND_COLORS.down }} />;
      case 'warning': return <Warning sx={{ color: TREND_COLORS.warning }} />;
      default: return <TrendingFlat sx={{ color: TREND_COLORS.stable }} />;
    }
  };

  const renderMetricCards = () => (
    <Grid container spacing={3}>
      {metrics.map((metric) => (
        <Grid item xs={12} sm={6} md={3} key={metric.id}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography color="textSecondary" gutterBottom variant="body2">{metric.title}</Typography>
                <Chip label={metric.sport} size="small" variant="outlined" />
              </Box>
              <Typography variant="h5" component="div" sx={{ fontWeight: 600, mt: 1 }}>{metric.value}</Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {renderTrendIcon(metric.trend)}
                <Typography variant="body2" sx={{ ml: 0.5, color: metric.trend === 'up' ? TREND_COLORS.up : metric.trend === 'down' ? TREND_COLORS.down : 'text.secondary' }}>
                  {metric.change}
                </Typography>
              </Box>
              {metric.sample_size !== undefined && (
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>Sample: {metric.sample_size} players</Typography>
              )}
              {metric.injured_count !== undefined && (
                <Typography variant="caption" color="textSecondary" display="block">Injured: {metric.injured_count}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderPositionChart = () => {
    if (positionData.length === 0) return null;
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Position Distribution</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={positionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                {positionData.map((_, i) => <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderEdgeChart = () => {
    if (edgeData[0].value === 0) return null;
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Edge Analysis</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={edgeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" radius={[4,4,0,0]}>
                {edgeData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.name === 'Positive Edge' ? '#4caf50' : '#f44336'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderGameCards = () => {
    if (games.length === 0) return <Alert severity="info">No games today for {selectedSport.toUpperCase()}.</Alert>;
    return (
      <Grid container spacing={3}>
        {games.slice(0,4).map((game) => (
          <Grid item xs={12} md={6} lg={3} key={game.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip label={game.status} size="small" color={game.status === 'Live' ? 'error' : 'default'} />
                  <Typography variant="caption" color="textSecondary">{game.time}</Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ width:32, height:32, borderRadius:'50%', bgcolor: game.awayTeam.color, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:14, mr:1 }}>{game.awayTeam.logo}</Box>
                    <Typography variant="body2">{game.awayTeam.name}</Typography>
                  </Box>
                  <Typography variant="h6">{game.awayScore}</Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ width:32, height:32, borderRadius:'50%', bgcolor: game.homeTeam.color, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:14, mr:1 }}>{game.homeTeam.logo}</Box>
                    <Typography variant="body2">{game.homeTeam.name}</Typography>
                  </Box>
                  <Typography variant="h6">{game.homeScore}</Typography>
                </Box>
                <Divider sx={{ my:2 }} />
                <Typography variant="caption" color="textSecondary" display="block">{game.venue}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderPlayerAnalysis = () => {
    if (playerData.length === 0) return <Alert severity="info">No player data available for {selectedSport.toUpperCase()}.</Alert>;

    // Pagination calculations
    const totalPages = Math.ceil(playerData.length / playersPerPage);
    const paginatedPlayers = playerData.slice(
      (playerPage - 1) * playersPerPage,
      playerPage * playersPerPage
    );

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
      setPlayerPage(value);
    };

    return (
      <>
        <Grid container spacing={3}>
          {paginatedPlayers.map((p) => (
            <Grid item xs={12} md={6} lg={4} key={p.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{p.name}</Typography>
                  <Typography color="textSecondary">{p.team} • {p.position}</Typography>
                  <Divider sx={{ my:1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}><Typography variant="body2">PPG: {p.points.toFixed(1)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2">RPG: {p.rebounds.toFixed(1)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2">APG: {p.assists.toFixed(1)}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2">FPG: {p.fantasy_points.toFixed(1)}</Typography></Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        {totalPages > 1 && (
          <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
            <Pagination
              count={totalPages}
              page={playerPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Stack>
        )}
      </>
    );
  };

  const renderInjuryReport = () => {
    if (injuryData.length === 0) return <Alert severity="info">No injuries reported for {selectedSport.toUpperCase()}.</Alert>;
    return (
      <Grid container spacing={3}>
        {injuryData.map((inj) => (
          <Grid item xs={12} md={6} lg={4} key={inj.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{inj.playerName}</Typography>
                <Chip label={inj.status} size="small" color={inj.status === 'Out' ? 'error' : inj.status === 'Questionable' ? 'warning' : 'success'} />
                <Typography variant="body2" mt={1}>Injury: {inj.injury}</Typography>
                <Box mt={1} display="flex" justifyContent="space-between">
                  <Typography variant="caption">Reported: {safeFormat(inj.reportedDate, 'MMM dd', 'Unknown')}</Typography>
                  <Typography variant="caption">Return: {safeFormat(inj.returnDate, 'MMM dd', 'Unknown')}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

// Replace the renderValueBets function (around line 360)
const renderValueBets = () => {
  if (valueBetData.length === 0) return <Alert severity="info">No value bets found for {selectedSport.toUpperCase()}.</Alert>;
  return (
    <Grid container spacing={3}>
      {valueBetData.map((bet) => {
        const betDate = new Date(bet.timestamp);
        const displayDate = safeFormat(betDate, 'MMM dd, HH:mm', 'Unknown');
        return (
          <Grid item xs={12} md={6} lg={4} key={bet.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{bet.game}</Typography>
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Chip label={bet.betType} size="small" />
                  <Chip label={`Edge: ${bet.edge}`} color="success" size="small" />
                </Box>
                {/* NEW: Show projection */}
                {bet.projection !== undefined && (
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                    Projection: {bet.projection.toFixed(1)}
                  </Typography>
                )}
                <Box mt={2} display="flex" justifyContent="space-between">
                  <Typography variant="body2">Odds: {bet.odds}</Typography>
                  <Chip
                    label={`Confidence: ${bet.confidence}`}
                    size="small"
                    color={bet.confidence === 'High' ? 'success' : bet.confidence === 'Medium' ? 'warning' : 'default'}
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" display="block" mt={2}>
                  Updated: {displayDate}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

  const renderTabContent = () => {
    switch (tabValue) {
      case 0: return (
        <>
          <Box mb={4}><Typography variant="h6" gutterBottom>Key Performance Indicators</Typography>{renderMetricCards()}</Box>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>{renderPositionChart()}</Grid>
            <Grid item xs={12} md={6}>{renderEdgeChart()}</Grid>
          </Grid>
          <Box mb={2}><Typography variant="h6" gutterBottom>Today's Games</Typography>{renderGameCards()}</Box>
        </>
      );
      case 1: return renderPlayerAnalysis();
      case 2: return renderInjuryReport();
      case 3: return renderValueBets();
      default: return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{(error as Error).message}</Alert>
      </Box>
    );
  }

  const lastUpdated = new Date();
  const lastUpdatedDisplay = safeFormat(lastUpdated, 'MMM dd, yyyy HH:mm', 'Unknown');

  return (
    <Box p={3} sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Assessment sx={{ fontSize: 32, mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h4" fontWeight={600}>Analytics Dashboard</Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel id="sport-select-label">Sport</InputLabel>
          <Select labelId="sport-select-label" value={selectedSport} label="Sport" onChange={(e) => setSelectedSport(e.target.value)}>
            {SPORTS.map((sport) => (
              <MenuItem key={sport.value} value={sport.value}>
                <Box display="flex" alignItems="center">{sport.icon}<Typography sx={{ ml: 1 }}>{sport.label}</Typography></Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box mb={3}>
        <Alert severity="success">✅ Using /api/players/master with real per‑game averages</Alert>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: theme.palette.background.paper }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Overview" />
          <Tab label="Player Analysis" />
          <Tab label="Injury Report" />
          <Tab label="Value Bets" />
        </Tabs>
      </Box>

      {renderTabContent()}

      <Box mt={4} display="flex" justifyContent="flex-end">
        <Typography variant="caption" color="textSecondary">
          Last updated: {lastUpdatedDisplay}
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboardScreen;
