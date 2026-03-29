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
  Divider,
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
  useTheme,
  alpha,
  Badge
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
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

// ============= CONSTANTS =============
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';

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

const PlayerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  // Get player data from navigation state if available
  const { player: initialPlayer, sport: initialSport, isRealData } = location.state || {};
  
  const [tabValue, setTabValue] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sport, setSport] = useState(initialSport || 'nba');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch player details from API - using the correct endpoint from logs
  const {
    data: playerData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['player', id, sport],
    queryFn: async () => {
      console.log(`🔍 Fetching player ${id} for sport ${sport}`);
      
      // Use the fantasyhub players endpoint which actually returns player data
      const url = `${NODE_API_BASE}/api/fantasyhub/players?sport=${sport}&limit=500`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Received response:`, data);
        
        // The API returns an object with success, data properties
        if (data.success && Array.isArray(data.data)) {
          console.log(`✅ Received ${data.data.length} players from API`);
          
          // Find the specific player by ID
          const foundPlayer = data.data.find((p: any) => {
            // Try different ID formats
            const playerId = p.player_id || p.id;
            return playerId === id || 
                   playerId?.toString() === id?.toString() ||
                   // Handle the static ID format like "nba-static-Nikola-Jokic-DEN"
                   (typeof id === 'string' && id.includes('static') && 
                    p.name && id.includes(p.name.replace(/\s+/g, '-')));
          });
          
          if (foundPlayer) {
            console.log(`✅ Found player: ${foundPlayer.name}`);
            return foundPlayer;
          }
          
          // If player not found by ID, try to find by name if we have initial player
          if (initialPlayer?.name) {
            const playerByName = data.data.find((p: any) => 
              p.name?.toLowerCase() === initialPlayer.name.toLowerCase()
            );
            if (playerByName) {
              console.log(`✅ Found player by name: ${playerByName.name}`);
              return playerByName;
            }
          }
          
          console.log(`❌ Player with ID ${id} not found in response`);
          return null;
        } else {
          console.log(`❌ Unexpected response format:`, data);
          return null;
        }
      } catch (err) {
        console.error(`❌ Error fetching players:`, err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !initialPlayer, // Only fetch if we don't have initial player data
  });

  // Extract stats from top-level fields if they exist
  useEffect(() => {
    if (playerData && !playerData.stats) {
      // The API returns stats at the top level, so we need to collect them
      const statFields = [
        'points', 'assists', 'rebounds', 'steals', 'blocks', 'turnovers',
        'pts_per_game', 'ast_per_game', 'reb_per_game', 'stl_per_game', 
        'blk_per_game', 'to_per_game', 'fg_pct', 'three_pct', 'ft_pct',
        'minutes', 'games_played', 'fantasy_points', 'salary', 'value',
        'field_goal_pct', 'three_point_pct', 'free_throw_pct'
      ];
      
      const extractedStats: any = {};
      statFields.forEach(field => {
        if (playerData[field] !== undefined) {
          extractedStats[field] = playerData[field];
        }
      });
      
      // If we found stats, attach them to the player object
      if (Object.keys(extractedStats).length > 0) {
        playerData.stats = extractedStats;
        console.log('✅ Extracted stats:', extractedStats);
      }
    }
  }, [playerData]);

  // Use initial player data if available, otherwise use fetched data
  const player = initialPlayer || playerData;

  // Log what data we have
  useEffect(() => {
    if (player) {
      console.log('✅ Displaying player data:', {
        name: player.name,
        id: player.player_id || player.id,
        team: player.team,
        stats: player.stats ? Object.keys(player.stats).length : 'No stats',
        source: initialPlayer ? 'navigation state' : 'API fetch'
      });
    }
  }, [player, initialPlayer]);

  const calculateAdvancedMetrics = () => {
    if (!player || !player.stats) {
      return {
        per: '0.0',
        efficiency: '0.0',
        usageRate: '0%',
        winShares: '0.0',
        vorp: '0.0',
      };
    }

    const stats = player.stats;
    
    let per = 0;
    let efficiency = 0;
    let usageRate = 0;
    let winShares = 0;
    let vorp = 0;

    if (sport === 'nba') {
      per = ((stats.points || stats.pts_per_game || 0) * 1.0 +
             (stats.rebounds || stats.reb_per_game || 0) * 0.8 +
             (stats.assists || stats.ast_per_game || 0) * 1.2 +
             (stats.steals || stats.stl_per_game || 0) * 1.5 +
             (stats.blocks || stats.blk_per_game || 0) * 2.0 -
             (stats.turnovers || stats.to_per_game || 0) * 1.0) / 10;
      per = Math.max(0, Math.min(per, 40));
      
      efficiency = ((stats.points || stats.pts_per_game || 0) + 
                    (stats.rebounds || stats.reb_per_game || 0) + 
                    (stats.assists || stats.ast_per_game || 0) +
                    (stats.steals || stats.stl_per_game || 0) + 
                    (stats.blocks || stats.blk_per_game || 0) -
                    (stats.turnovers || stats.to_per_game || 0));
      winShares = per * 0.2;
      vorp = (per - 15) * 0.5;
      usageRate = 25 + (per - 15) * 2;
    }

    return {
      per: per.toFixed(1),
      efficiency: efficiency.toFixed(1),
      usageRate: Math.min(usageRate, 100).toFixed(1) + '%',
      winShares: winShares.toFixed(1),
      vorp: vorp.toFixed(1),
    };
  };

  const metrics = calculateAdvancedMetrics();

  const getSportIcon = () => {
    switch(sport) {
      case 'nba': return <BasketballIcon sx={{ fontSize: 40 }} />;
      case 'nfl': return <FootballIcon sx={{ fontSize: 40 }} />;
      case 'nhl': return <HockeyIcon sx={{ fontSize: 40 }} />;
      case 'mlb': return <BaseballIcon sx={{ fontSize: 40 }} />;
      default: return <PersonIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getSportColor = () => {
    switch(sport) {
      case 'nba': return '#2563eb';
      case 'nfl': return '#dc2626';
      case 'nhl': return '#0891b2';
      case 'mlb': return '#ca8a04';
      default: return '#6b7280';
    }
  };

  if (isLoading && !player) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" ml={2}>Loading Player Details...</Typography>
      </Box>
    );
  }

  if (error && !player) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load player data. Please try again.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!player) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          No player data found.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back to Players
        </Button>
        <Box display="flex" alignItems="center" gap={1}>
          {isRealData && (
            <Chip label="LIVE DATA" size="small" color="success" />
          )}
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
                  fontWeight: 'bold'
                }}
              >
                {player.name?.charAt(0) || 'P'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h3" fontWeight="bold" color="white">
                {player.name || 'Unknown Player'}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mt={1}>
                <Chip
                  icon={getSportIcon()}
                  label={sport.toUpperCase()}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Typography variant="h6" color="white">
                  {player.team || 'Free Agent'} • #{player.number || player.jersey_number || '--'} • {player.position || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Age</Typography>
              <Typography variant="h6">{player.age || player.age_display || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Height / Weight</Typography>
              <Typography variant="h6">{player.height || 'N/A'} • {player.weight || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Salary</Typography>
              <Typography variant="h6" color="success.main">{player.salary ? `$${player.salary.toLocaleString()}` : 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">Experience</Typography>
              <Typography variant="h6">{player.experience || `${player.age || 25} years`}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Source Indicator */}
      {!initialPlayer && playerData && (
        <Paper sx={{ p: 1, mb: 2, bgcolor: '#dcfce7' }}>
          <Typography variant="caption" color="success.dark">
            ✅ Loaded from API • {player.name}
          </Typography>
        </Paper>
      )}

      {/* Tabs - Only showing working tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Stats" />
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
                  Season Stats
                </Typography>
                <Grid container spacing={2}>
                  {player.stats && Object.entries(player.stats).map(([key, value], index) => {
                    if (index > 7) return null; // Limit to first 8 stats
                    const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0;
                    const formatted = numValue.toFixed(1);
                    const displayKey = key
                      .replace(/_/g, ' ')
                      .replace(/pct/g, '%')
                      .replace(/per game/g, '')
                      .trim();
                    return (
                      <Grid item xs={6} sm={4} key={index}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: alpha(getSportColor(), 0.1),
                            borderRadius: 2,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="h5" fontWeight="bold" color={getSportColor()}>
                            {formatted}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {displayKey.toUpperCase()}
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
                      primary="PER"
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

      {/* Stats Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Full Statistics
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
                  {player.stats && Object.entries(player.stats).map(([key, value], index) => {
                    const displayKey = key
                      .replace(/_/g, ' ')
                      .replace(/pct/g, '%')
                      .replace(/per game/g, '')
                      .trim();
                    return (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {displayKey.toUpperCase()}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="medium">
                            {typeof value === 'number' ? value.toFixed(1) : value}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                  {metrics.usageRate}
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
                  <Typography variant="h6">Value Over Replacement (VORP)</Typography>
                </Box>
                <Typography variant="h3" fontWeight="bold" color="#8b5cf6">
                  {metrics.vorp}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Player's value compared to replacement level.
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
