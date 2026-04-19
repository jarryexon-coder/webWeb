// src/pages/PlayerDetailPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  Speed as SpeedIcon,
  MonitorHeart as PulseIcon,
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
} from '@mui/icons-material';

const API_BASE = 'https://prizepicks-production.up.railway.app';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`player-tabpanel-${index}`}
      aria-labelledby={`player-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const PlayerDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Extract prop data from navigation state (if coming from PlayerPropsScreen)
  const propFromState = location.state?.prop;

  // 2. Determine player name and sport
  const playerNameFromProp = propFromState?.player || null;
  const sportFromProp = propFromState?.sport?.toLowerCase() || 'nba';
  const fallbackPlayerName = id ? decodeURIComponent(id) : null;

  const effectivePlayerName = playerNameFromProp || fallbackPlayerName;
  const effectiveSport = sportFromProp;

  // 3. State for fetched player stats
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!effectivePlayerName);
  const [error, setError] = useState<string | null>(null);

  // 4. Fetch full player stats from /api/fantasyhub/players
  useEffect(() => {
    if (!effectivePlayerName) {
      setLoading(false);
      return;
    }

    const fetchPlayerStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all players for the sport (no filter by today to get full list)
        const url = `${API_BASE}/api/fantasyhub/players?sport=${effectiveSport}&filterByToday=false`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // Find player by name (case‑insensitive)
          const found = data.data.find(
            (p: any) => p.name?.toLowerCase() === effectivePlayerName?.toLowerCase()
          );
          if (found) {
            console.log(`✅ Found stats for ${found.name}`);
            setPlayerStats(found);
          } else {
            console.warn(`⚠️ Player "${effectivePlayerName}" not found in ${effectiveSport} data`);
            setError(`Player "${effectivePlayerName}" not found.`);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        console.error('❌ Failed to fetch player stats:', err);
        setError(err.message || 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, [effectivePlayerName, effectiveSport]);

  // 5. UI state
  const [tabValue, setTabValue] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Helper: get sport icon and color
  const getSportIcon = () => {
    switch (effectiveSport) {
      case 'nba':
        return <BasketballIcon sx={{ fontSize: 40 }} />;
      case 'nfl':
        return <FootballIcon sx={{ fontSize: 40 }} />;
      case 'nhl':
        return <HockeyIcon sx={{ fontSize: 40 }} />;
      case 'mlb':
        return <BaseballIcon sx={{ fontSize: 40 }} />;
      default:
        return <PersonIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getSportColor = () => {
    switch (effectiveSport) {
      case 'nba':
        return '#2563eb';
      case 'nfl':
        return '#dc2626';
      case 'nhl':
        return '#0891b2';
      case 'mlb':
        return '#ca8a04';
      default:
        return '#6b7280';
    }
  };

  // Format stat keys for display
  const formatStatKey = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/pct/g, '%')
      .replace(/per game/g, '')
      .trim()
      .toUpperCase();
  };

  // Determine which stats to show based on sport
  const getRelevantStats = () => {
    if (!playerStats) return {};
    const stats: Record<string, number> = {};
    if (effectiveSport === 'nba') {
      if (playerStats.points !== undefined) stats.Points = playerStats.points;
      if (playerStats.rebounds !== undefined) stats.Rebounds = playerStats.rebounds;
      if (playerStats.assists !== undefined) stats.Assists = playerStats.assists;
      if (playerStats.steals !== undefined) stats.Steals = playerStats.steals;
      if (playerStats.blocks !== undefined) stats.Blocks = playerStats.blocks;
      if (playerStats.fantasy_points !== undefined) stats['Fantasy Pts'] = playerStats.fantasy_points;
    } else if (effectiveSport === 'nhl') {
      if (playerStats.goals !== undefined) stats.Goals = playerStats.goals;
      if (playerStats.assists !== undefined) stats.Assists = playerStats.assists;
      if (playerStats.points !== undefined) stats.Points = playerStats.points;
      if (playerStats.shots !== undefined) stats.Shots = playerStats.shots;
      if (playerStats.hits !== undefined) stats.Hits = playerStats.hits;
      if (playerStats.blockedShots !== undefined) stats['Blocked Shots'] = playerStats.blockedShots;
      if (playerStats.plusMinus !== undefined) stats['+/-'] = playerStats.plusMinus;
    } else if (effectiveSport === 'mlb') {
      if (playerStats.hits !== undefined) stats.Hits = playerStats.hits;
      if (playerStats.home_runs !== undefined) stats['Home Runs'] = playerStats.home_runs;
      if (playerStats.rbi !== undefined) stats.RBI = playerStats.rbi;
      if (playerStats.batting_average !== undefined) stats['AVG'] = playerStats.batting_average;
      if (playerStats.ops !== undefined) stats.OPS = playerStats.ops;
    }
    return stats;
  };

  const displayStats = getRelevantStats();

  // Simple advanced metrics based on fantasy points
  const calculateMetrics = () => {
    if (!playerStats) {
      return { per: '0.0', efficiency: '0.0', usage: '0%', winShares: '0.0' };
    }
    const fp = playerStats.fantasy_points || 0;
    const per = (fp / 10).toFixed(1);
    const efficiency = (fp * 1.2).toFixed(1);
    const usage = `${Math.min(100, Math.floor(fp * 2))}%`;
    const winShares = (fp / 15).toFixed(1);
    return { per, efficiency, usage, winShares };
  };

  const metrics = calculateMetrics();

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Loading player details...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error || (!playerStats && !propFromState)) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'No player data found.'}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  // No data but no error (should not happen, but handle gracefully)
  if (!playerStats && !propFromState) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">No player information available.</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  // Player name from either prop or fetched stats
  const displayName = playerStats?.name || propFromState?.player || 'Unknown Player';
  const displayTeam = playerStats?.team || propFromState?.team || 'N/A';
  const displayPosition = playerStats?.position || 'N/A';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with back button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back to Props
        </Button>
        <Box display="flex" alignItems="center" gap={1}>
          {playerStats?.is_real_data && <Chip label="LIVE DATA" size="small" color="success" />}
          <IconButton onClick={() => setIsBookmarked(!isBookmarked)}>
            {isBookmarked ? <BookmarkIcon color="primary" /> : <BookmarkBorderIcon />}
          </IconButton>
          <IconButton>
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Player Header Card */}
      <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: getSportColor(), p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'white',
                  color: getSportColor(),
                  fontSize: 40,
                  fontWeight: 'bold',
                }}
              >
                {displayName.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h3" fontWeight="bold" color="white">
                {displayName}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mt={1}>
                <Chip
                  icon={getSportIcon()}
                  label={effectiveSport.toUpperCase()}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Typography variant="h6" color="white">
                  {displayTeam} • {displayPosition}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Quick Stats Row (from prop, if available) */}
        {propFromState && (
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Market
                </Typography>
                <Typography variant="h6">{propFromState.market || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Line
                </Typography>
                <Typography variant="h6" color="#ff9800">
                  {propFromState.line?.toFixed(1) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Projection
                </Typography>
                <Typography variant="h6" color="#8b5cf6">
                  {propFromState.projection?.toFixed(1) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Over Multiplier
                </Typography>
                <Typography
                  variant="h6"
                  color={propFromState.over_odds < 0 ? '#4caf50' : '#f44336'}
                >
                  {propFromState.over_odds
                    ? propFromState.over_odds > 0
                      ? `+${propFromState.over_odds}`
                      : propFromState.over_odds
                    : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Season Stats" />
          <Tab label="Advanced Metrics" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Key Season Averages
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(displayStats).map(([key, value], idx) => {
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
                    return (
                      <Grid item xs={6} sm={4} key={idx}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: alpha(getSportColor(), 0.1),
                            borderRadius: 2,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h5" fontWeight="bold" color={getSportColor()}>
                            {numValue.toFixed(1)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {key}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Quick Metrics
                </Typography>
                <List>
                  <ListItem>
                    <SpeedIcon sx={{ color: '#7c3aed', mr: 2 }} />
                    <ListItemText
                      primary="PER (Est.)"
                      secondary={metrics.per}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                  <ListItem>
                    <PulseIcon sx={{ color: '#ec4899', mr: 2 }} />
                    <ListItemText
                      primary="Efficiency"
                      secondary={metrics.efficiency}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                  <ListItem>
                    <TrendingUpIcon sx={{ color: '#10b981', mr: 2 }} />
                    <ListItemText
                      primary="Win Shares"
                      secondary={metrics.winShares}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Season Stats Tab - Full table */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Complete Season Statistics
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(displayStats).map(([key, value], idx) => (
                    <TableRow key={idx}>
                      <TableCell component="th" scope="row">
                        {key}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="medium">
                          {typeof value === 'number' ? value.toFixed(2) : value}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Additional prop-specific info if available */}
                  {propFromState && (
                    <>
                      <TableRow>
                        <TableCell>Prop Market</TableCell>
                        <TableCell align="right">{propFromState.market}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Prop Line</TableCell>
                        <TableCell align="right">{propFromState.line?.toFixed(1)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Prop Projection</TableCell>
                        <TableCell align="right">{propFromState.projection?.toFixed(1)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Over Multiplier</TableCell>
                        <TableCell align="right">
                          {propFromState.over_odds
                            ? propFromState.over_odds > 0
                              ? `+${propFromState.over_odds}`
                              : propFromState.over_odds
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Advanced Metrics Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderLeft: '4px solid #7c3aed' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SpeedIcon sx={{ color: '#7c3aed', mr: 1 }} />
                  <Typography variant="h6">Player Efficiency Rating (PER)</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#7c3aed">
                  {metrics.per}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  League average is 15. Higher values indicate better performance.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderLeft: '4px solid #10b981' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <EmojiEventsIcon sx={{ color: '#10b981', mr: 1 }} />
                  <Typography variant="h6">Win Shares (WS)</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#10b981">
                  {metrics.winShares}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Estimated wins contributed by the player.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderLeft: '4px solid #f59e0b' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon sx={{ color: '#f59e0b', mr: 1 }} />
                  <Typography variant="h6">Usage Rate (USG%)</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#f59e0b">
                  {metrics.usage}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Percentage of team plays used by player.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderLeft: '4px solid #8b5cf6' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StarIcon sx={{ color: '#8b5cf6', mr: 1 }} />
                  <Typography variant="h6">Fantasy Points / Game</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#8b5cf6">
                  {playerStats?.fantasy_points?.toFixed(1) || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Average fantasy points per game.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default PlayerDetailPage;
