// src/pages/PlayerStatsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper,
  LinearProgress,
  CircularProgress,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Modal,
  Backdrop,
  Fade,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Speed as SpeedIcon,
  MonitorHeart as PulseIcon,
  BarChart as BarChartIcon,
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Security as ShieldIcon,
  MonetizationOn as CashIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  SportsFootball as FootballIcon,
  SportsBasketball as BasketballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  SportsSoccer as SoccerIcon,
  SportsMartialArts as MartialArtsIcon,
  LocalFireDepartment as FireIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

// Mock data for players
const mockPlayers = {
  NFL: [
    {
      id: 1,
      name: 'Patrick Mahomes',
      team: 'Kansas City Chiefs',
      position: 'QB',
      number: 15,
      age: 28,
      height: "6'3\"",
      weight: '230 lbs',
      salary: '$45M/yr',
      contract: '10 years',
      trend: 'up',
      isPremium: true,
      stats: {
        passingYards: 4852,
        passingTDs: 38,
        interceptions: 12,
        rushingYards: 389,
        rushingTDs: 4,
        completionPct: 68.2,
        qbRating: 105.7,
        fumbles: 5
      },
      highlights: [
        '4x Pro Bowl selection',
        '2x Super Bowl MVP',
        '2022 NFL MVP',
        'NFL passing yards leader'
      ]
    },
    {
      id: 2,
      name: 'Justin Jefferson',
      team: 'Minnesota Vikings',
      position: 'WR',
      number: 18,
      age: 24,
      height: "6'1\"",
      weight: '195 lbs',
      salary: '$35M/yr',
      contract: '4 years',
      trend: 'up',
      isPremium: false,
      stats: {
        receptions: 128,
        receivingYards: 1809,
        receivingTDs: 8,
        targets: 184,
        yardsPerReception: 14.1,
        longestReception: 64,
        fumbles: 1
      },
      highlights: [
        '3x Pro Bowl selection',
        '2022 Offensive Player of the Year',
        'NFL receiving yards leader',
        'Single-season receiving yards record'
      ]
    },
    {
      id: 3,
      name: 'Nick Bosa',
      team: 'San Francisco 49ers',
      position: 'DE',
      number: 97,
      age: 26,
      height: "6'4\"",
      weight: '266 lbs',
      salary: '$34M/yr',
      contract: '5 years',
      trend: 'up',
      isPremium: true,
      stats: {
        tackles: 51,
        sacks: 18.5,
        tacklesForLoss: 19,
        qbHits: 48,
        forcedFumbles: 2,
        fumbleRecoveries: 1,
        passesDefended: 11
      },
      highlights: [
        '3x Pro Bowl selection',
        '2022 Defensive Player of the Year',
        'NFL sacks leader',
        'Defensive Rookie of the Year'
      ]
    },
    {
      id: 4,
      name: 'Josh Allen',
      team: 'Buffalo Bills',
      position: 'QB',
      number: 17,
      age: 27,
      height: "6'5\"",
      weight: '237 lbs',
      salary: '$43M/yr',
      contract: '6 years',
      trend: 'neutral',
      isPremium: false,
      stats: {
        passingYards: 4283,
        passingTDs: 35,
        interceptions: 14,
        rushingYards: 762,
        rushingTDs: 7,
        completionPct: 63.3,
        qbRating: 96.6,
        fumbles: 8
      },
      highlights: [
        '4x Pro Bowl selection',
        '2020 All-Pro',
        'Single-season TD record',
        'Playoff passing yards leader'
      ]
    }
  ],
  NBA: [
    {
      id: 5,
      name: 'LeBron James',
      team: 'Los Angeles Lakers',
      position: 'SF',
      number: 23,
      age: 39,
      height: "6'9\"",
      weight: '250 lbs',
      salary: '$47.6M/yr',
      contract: '2 years',
      trend: 'up',
      isPremium: true,
      stats: {
        points: 28.9,
        rebounds: 8.3,
        assists: 6.8,
        steals: 1.5,
        blocks: 0.9,
        fgPct: 50.0,
        threePtPct: 40.7,
        turnovers: 3.2
      },
      highlights: [
        '4x NBA Champion',
        '4x NBA MVP',
        '19x All-Star',
        'All-time scoring leader'
      ]
    },
    {
      id: 6,
      name: 'Stephen Curry',
      team: 'Golden State Warriors',
      position: 'PG',
      number: 30,
      age: 35,
      height: "6'2\"",
      weight: '185 lbs',
      salary: '$51.9M/yr',
      contract: '4 years',
      trend: 'up',
      isPremium: true,
      stats: {
        points: 29.4,
        rebounds: 6.1,
        assists: 6.3,
        steals: 0.9,
        blocks: 0.4,
        fgPct: 49.3,
        threePtPct: 42.7,
        turnovers: 2.8
      },
      highlights: [
        '4x NBA Champion',
        '2x NBA MVP',
        '9x All-Star',
        'All-time 3-point leader'
      ]
    },
    {
      id: 7,
      name: 'Giannis Antetokounmpo',
      team: 'Milwaukee Bucks',
      position: 'PF',
      number: 34,
      age: 29,
      height: "6'11\"",
      weight: '243 lbs',
      salary: '$45.6M/yr',
      contract: '5 years',
      trend: 'up',
      isPremium: false,
      stats: {
        points: 31.1,
        rebounds: 11.8,
        assists: 5.7,
        steals: 0.8,
        blocks: 0.8,
        fgPct: 55.3,
        threePtPct: 27.5,
        turnovers: 3.2
      },
      highlights: [
        'NBA Champion',
        '2x NBA MVP',
        '7x All-Star',
        'Defensive Player of the Year'
      ]
    },
    {
      id: 8,
      name: 'Luka Dončić',
      team: 'Dallas Mavericks',
      position: 'PG',
      number: 77,
      age: 24,
      height: "6'7\"",
      weight: '230 lbs',
      salary: '$40.1M/yr',
      contract: '5 years',
      trend: 'up',
      isPremium: true,
      stats: {
        points: 33.9,
        rebounds: 8.6,
        assists: 9.8,
        steals: 1.4,
        blocks: 0.5,
        fgPct: 49.6,
        threePtPct: 34.2,
        turnovers: 4.1
      },
      highlights: [
        '4x All-Star',
        'Rookie of the Year',
        '3x All-NBA First Team',
        'EuroLeague champion'
      ]
    }
  ]
};

const sportsData = [
  { id: 'NFL', name: 'NFL', icon: <FootballIcon />, color: '#dc2626' },
  { id: 'NBA', name: 'NBA', icon: <BasketballIcon />, color: '#2563eb' },
  { id: 'NHL', name: 'NHL', icon: <HockeyIcon />, color: '#0891b2' },
  { id: 'MLB', name: 'MLB', icon: <BaseballIcon />, color: '#ca8a04' },
];

const positionFilters = {
  NFL: ['All Positions', 'QB', 'RB', 'WR', 'TE', 'DEF'],
  NBA: ['All Positions', 'PG', 'SG', 'SF', 'PF', 'C'],
  NHL: ['All Positions', 'LW', 'C', 'RW', 'D', 'G'],
  MLB: ['All Positions', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']
};

const teamFilters = {
  NFL: ['All Teams', 'Chiefs', '49ers', 'Bills', 'Vikings', 'Eagles', 'Cowboys', 'Dolphins', 'Ravens'],
  NBA: ['All Teams', 'Lakers', 'Warriors', 'Bucks', 'Mavericks', 'Celtics', 'Nuggets', 'Suns', 'Heat']
};

// Analytics Component
const AnalyticsBox = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);

  const loadAnalyticsEvents = () => {
    // Mock analytics events
    const events = [
      { event: 'player_stats_view', params: { sport: 'NFL', player: 'Mahomes' }, timestamp: new Date().toISOString() },
      { event: 'player_stats_search', params: { query: 'quarterbacks' }, timestamp: new Date(Date.now() - 300000).toISOString() },
      { event: 'player_profile_select', params: { player: 'Jefferson' }, timestamp: new Date(Date.now() - 600000).toISOString() },
      { event: 'player_stats_filter', params: { filter: 'QB' }, timestamp: new Date(Date.now() - 900000).toISOString() },
      { event: 'player_stats_refresh', params: {}, timestamp: new Date(Date.now() - 1200000).toISOString() },
    ];
    setAnalyticsEvents(events);
  };

  useEffect(() => {
    loadAnalyticsEvents();
    const interval = setInterval(loadAnalyticsEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!showAnalytics) {
    return (
      <Button
        variant="contained"
        startIcon={<AnalyticsIcon />}
        onClick={() => setShowAnalytics(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          bgcolor: '#3b82f6',
          '&:hover': { bgcolor: '#2563eb' },
          borderRadius: 8,
          zIndex: 1000
        }}
      >
        Analytics
      </Button>
    );
  }

  return (
    <Modal
      open={showAnalytics}
      onClose={() => setShowAnalytics(false)}
      closeAfterTransition
    >
      <Fade in={showAnalytics}>
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', md: 500 },
          maxHeight: '80vh',
          overflow: 'auto',
          borderRadius: 3,
          bgcolor: 'background.paper'
        }}>
          <CardContent>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <AnalyticsIcon color="primary" />
                <Typography variant="h5" fontWeight="bold">
                  Player Stats Analytics
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton onClick={() => {
                  setAnalyticsEvents([]);
                  alert('Analytics cleared');
                }} color="error" size="small">
                  <CloseIcon />
                </IconButton>
                <IconButton onClick={() => setShowAnalytics(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={4}>
                <Box textAlign="center" p={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {analyticsEvents.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Events
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" p={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {analyticsEvents.filter(e => e.event.includes('view')).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Views
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center" p={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {analyticsEvents.filter(e => e.event.includes('select')).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Selections
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Recent Events */}
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>
              Recent Player Stats Events
            </Typography>
            
            {analyticsEvents.length === 0 ? (
              <Box textAlign="center" py={4}>
                <BarChartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No player stats analytics recorded
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Interact with players to see events
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {analyticsEvents.map((event, index) => (
                  <ListItem key={index} sx={{ 
                    mb: 1, 
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: event.event.includes('error') ? 'error.main' : 'info.main',
                        width: 32,
                        height: 32
                      }}>
                        {event.event.includes('error') ? '!' : '📊'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={event.event.split('_').slice(1).join(' ')}
                      secondary={
                        Object.keys(event.params).length > 0 
                          ? JSON.stringify(event.params)
                          : new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {/* Refresh Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadAnalyticsEvents}
              sx={{ mt: 2 }}
            >
              Refresh Analytics
            </Button>
          </CardContent>
        </Paper>
      </Fade>
    </Modal>
  );
};

// Advanced Metrics Modal
const AdvancedMetricsGuide = ({ open, onClose }: { open: boolean, onClose: () => void }) => {
  const metrics = [
    { name: 'Player Efficiency Rating (PER)', description: 'Overall player performance metric. League average is 15. Higher values indicate better performance.', color: '#7c3aed' },
    { name: 'True Shooting Percentage (TS%)', description: 'Shooting efficiency accounting for 2pt, 3pt, and free throws. Measures scoring efficiency.', color: '#3b82f6' },
    { name: 'Usage Rate (USG%)', description: 'Percentage of team plays used by player. Higher usage indicates more responsibility in offense.', color: '#f59e0b' },
    { name: 'Win Shares (WS)', description: "Player's contribution to team wins. Estimates how many wins a player contributes to their team.", color: '#10b981' },
    { name: 'Value Over Replacement (VORP)', description: "Player's value compared to replacement-level. Higher values indicate more valuable players.", color: '#8b5cf6' },
    { name: 'Efficiency Score (EFF)', description: 'Simplified efficiency calculation based on multiple statistical categories.', color: '#ec4899' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle>Advanced Metrics Guide</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          These advanced metrics provide deeper insights into player performance beyond traditional statistics.
        </DialogContentText>
        
        <Grid container spacing={2}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} key={index}>
              <Card sx={{ borderLeft: `4px solid ${metric.color}` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      bgcolor: metric.color,
                      borderRadius: '50%',
                      mr: 2 
                    }} />
                    <Typography variant="h6" fontWeight="medium">
                      {metric.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {metric.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const PlayerStatsScreen = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState('NFL');
  const [selectedPosition, setSelectedPosition] = useState('All Positions');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showAdvancedMetricsGuide, setShowAdvancedMetricsGuide] = useState(false);
  const [showSearchPrompts, setShowSearchPrompts] = useState(true);
  const [advancedMetrics, setAdvancedMetrics] = useState<any>({});
  
  const [searchHistory, setSearchHistory] = useState<string[]>(['Patrick Mahomes', 'Quarterbacks', 'Top receivers']);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);

  const players = mockPlayers[selectedSport as keyof typeof mockPlayers] || [];
  
  const filteredPlayers = players.filter(player => {
    // Filter by position
    if (selectedPosition !== 'All Positions' && player.position !== selectedPosition) {
      return false;
    }
    
    // Filter by team
    if (selectedTeam !== 'All Teams' && !player.team.includes(selectedTeam)) {
      return false;
    }
    
    // Filter by search
    if (searchInput) {
      const searchLower = searchInput.toLowerCase();
      return (
        player.name.toLowerCase().includes(searchLower) ||
        player.team.toLowerCase().includes(searchLower) ||
        player.position.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 1000);
  }, [selectedSport]);

  const calculateAdvancedMetrics = (player: any) => {
    if (!player || !player.stats) return {};
    
    const stats = player.stats;
    
    // Calculate metrics based on sport
    let per = 0;
    let tsPercentage = 0;
    let usageRate = 0;
    let winShares = 0;
    let vorp = 0;
    let efficiency = 0;

    if (selectedSport === 'NBA') {
      // Player Efficiency Rating (PER)
      per = ((stats.points || 0) * 1.0 +
             (stats.rebounds || 0) * 0.8 +
             (stats.assists || 0) * 1.2 +
             (stats.steals || 0) * 1.5 +
             (stats.blocks || 0) * 2.0 -
             (stats.turnovers || 0) * 1.0) / 10;
      per = Math.max(0, Math.min(per, 40));
      
      // Efficiency
      efficiency = ((stats.points || 0) + (stats.rebounds || 0) + (stats.assists || 0) +
                    (stats.steals || 0) + (stats.blocks || 0) -
                    (stats.turnovers || 0));
      winShares = per * 0.2;
      vorp = (per - 15) * 0.5;
      usageRate = 25 + (per - 15) * 2;
    } else if (selectedSport === 'NFL') {
      // NFL metrics
      if (player.position === 'QB') {
        per = ((stats.passingYards || 0) * 0.04 +
               (stats.passingTDs || 0) * 4 -
               (stats.interceptions || 0) * 2 +
               (stats.rushingYards || 0) * 0.1 +
               (stats.rushingTDs || 0) * 6) / 10;
        per = Math.max(0, Math.min(per, 158.3));
        
        efficiency = ((stats.passingYards || 0) / 25 +
                      (stats.passingTDs || 0) * 4 -
                      (stats.interceptions || 0) * 2 +
                      (stats.rushingYards || 0) / 10 +
                      (stats.rushingTDs || 0) * 6);
        winShares = per * 0.3;
        vorp = (per - 90) * 0.2;
        usageRate = 60 + (per - 90) * 0.5;
      } else if (player.position === 'WR') {
        efficiency = ((stats.receivingYards || 0) / 10 +
                      (stats.receivingTDs || 0) * 6 +
                      (stats.receptions || 0) * 0.5);
        per = efficiency / 2;
        winShares = per * 0.25;
        vorp = (per - 10) * 0.3;
        usageRate = ((stats.targets || stats.receptions || 0) / 5) * 100;
      }
    }

    return {
      per: per.toFixed(1),
      tsPercentage: tsPercentage > 0 ? tsPercentage.toFixed(1) + '%' : 'N/A',
      usageRate: Math.min(usageRate, 100).toFixed(1) + '%',
      winShares: winShares.toFixed(1),
      vorp: vorp.toFixed(1),
      efficiency: efficiency.toFixed(1),
    };
  };

  const handlePlayerSelect = (player: any) => {
    setSelectedPlayer(player);
    const metrics = calculateAdvancedMetrics(player);
    setAdvancedMetrics(metrics);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchHistory([searchInput.trim(), ...searchHistory.slice(0, 4)]);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const renderPlayerCard = (player: any) => {
    const metrics = calculateAdvancedMetrics(player);
    const TrendIcon = player.trend === 'up' ? TrendingUpIcon : 
                     player.trend === 'down' ? TrendingDownIcon : RemoveIcon;
    const trendColor = player.trend === 'up' ? 'success.main' : 
                      player.trend === 'down' ? 'error.main' : 'text.secondary';

    return (
      <Card key={player.id} sx={{ mb: 2 }}>
        <CardContent>
          {/* Player Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {player.name.charAt(0)}
              </Avatar>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {player.name}
                  </Typography>
                  {player.isPremium && (
                    <DiamondIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {player.team} • {player.position} #{player.number}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendIcon sx={{ color: trendColor }} />
              <Typography variant="caption" color={trendColor} fontWeight="medium">
                {player.trend === 'up' ? '+2.3' : player.trend === 'down' ? '-1.5' : '0.0'}
              </Typography>
            </Box>
          </Box>

          {/* Stats Grid */}
          <Grid container spacing={1} mb={2}>
            {Object.entries(player.stats).slice(0, 4).map(([key, value], index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="h6" fontWeight="bold">
                    '0'
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Advanced Metrics */}
          <Box display="flex" gap={1} mb={2}>
            <Chip
              icon={<SpeedIcon />}
              label={`PER: ${metrics.per}`}
              size="small"
              sx={{ bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed' }}
            />
            <Chip
              icon={<PulseIcon />}
              label={`EFF: ${metrics.efficiency}`}
              size="small"
              sx={{ bgcolor: alpha('#ec4899', 0.1), color: '#ec4899' }}
            />
          </Box>

          {/* Footer */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" color="success.main" fontWeight="medium">
                {player.salary}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {player.contract}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant="contained"
                startIcon={<BarChartIcon />}
                onClick={() => handlePlayerSelect(player)}
                sx={{ bgcolor: '#2563eb' }}
              >
                Stats
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={() => navigate('/player-profile')}
                sx={{ bgcolor: '#059669' }}
              >
                Profile
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderPlayerDetail = () => {
    if (!selectedPlayer) return null;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {/* Detail Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                {selectedPlayer.name.charAt(0)}
              </Avatar>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedPlayer.name}
                  </Typography>
                  {selectedPlayer.isPremium && (
                    <Badge badgeContent="PREMIUM" color="warning" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {selectedPlayer.team} • {selectedPlayer.position} #{selectedPlayer.number}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setSelectedPlayer(null)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Basic Info */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Age
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {selectedPlayer.age}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Height / Weight
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {selectedPlayer.height} • {selectedPlayer.weight}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Salary
              </Typography>
              <Typography variant="body1" fontWeight="medium" color="success.main">
                {selectedPlayer.salary}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Contract
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {selectedPlayer.contract}
              </Typography>
            </Grid>
          </Grid>

          {/* Season Stats */}
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Season Stats
          </Typography>
          <Grid container spacing={1} mb={3}>
            {Object.entries(selectedPlayer.stats).map(([key, value], index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="h6" fontWeight="bold">
                    '0'
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Advanced Metrics */}
          <Box mb={3}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Advanced Metrics
              </Typography>
              <IconButton size="small" onClick={() => setShowAdvancedMetricsGuide(true)}>
                <InfoIcon />
              </IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} md={4}>
                <Card sx={{ borderLeft: '4px solid #7c3aed' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <SpeedIcon sx={{ color: '#7c3aed', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {advancedMetrics.per}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PER
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Player Efficiency
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={4}>
                <Card sx={{ borderLeft: '4px solid #3b82f6' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <BarChartIcon sx={{ color: '#3b82f6', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {advancedMetrics.usageRate}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      USG%
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Usage Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={4}>
                <Card sx={{ borderLeft: '4px solid #10b981' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <EmojiEventsIcon sx={{ color: '#10b981', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {advancedMetrics.winShares}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      WS
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Win Shares
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={4}>
                <Card sx={{ borderLeft: '4px solid #8b5cf6' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <StarIcon sx={{ color: '#8b5cf6', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {advancedMetrics.vorp}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      VORP
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Value Added
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={4}>
                <Card sx={{ borderLeft: '4px solid #ec4899' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PulseIcon sx={{ color: '#ec4899', mb: 1 }} />
                    <Typography variant="h5" fontWeight="bold">
                      {advancedMetrics.efficiency}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      EFF
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Efficiency
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Highlights */}
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Highlights
          </Typography>
          <List>
            {selectedPlayer.highlights?.map((highlight: string, index: number) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <CheckCircleIcon sx={{ color: 'success.main', mr: 2, fontSize: 16 }} />
                <ListItemText primary={highlight} />
              </ListItem>
            ))}
          </List>

          {/* Full Profile Button */}
          <Button
            fullWidth
            variant="contained"
            startIcon={<PersonIcon />}
            onClick={() => navigate('/player-profile')}
            sx={{ mt: 2, bgcolor: '#059669' }}
          >
            View Full Player Profile
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" ml={2}>
          Loading Player Analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, pt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ color: 'text.primary' }}
          >
            Back
          </Button>
          <Chip
            icon={<DiamondIcon />}
            label="PRO"
            sx={{ bgcolor: 'warning.main', color: 'white' }}
          />
        </Box>

        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Player Analytics
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Advanced stats, metrics, and player insights
          </Typography>
        </Box>
      </Box>

      {/* Sport Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          Select Sport
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {sportsData.map((sport) => (
            <Chip
              key={sport.id}
              icon={sport.icon}
              label={sport.name}
              onClick={() => setSelectedSport(sport.id)}
              color={selectedSport === sport.id ? 'primary' : 'default'}
              variant={selectedSport === sport.id ? 'filled' : 'outlined'}
              sx={{
                ...(selectedSport === sport.id && {
                  bgcolor: sport.color,
                  color: 'white',
                  '&:hover': { bgcolor: sport.color }
                })
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder={`Search ${selectedSport} players, teams, stats...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchInput('')}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{ minWidth: 120 }}
          >
            Search
          </Button>
        </Box>

        {/* Recent Searches */}
        {searchHistory.length > 0 && !searchInput && (
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary">
                Recent Searches
              </Typography>
              <Button size="small" onClick={clearSearchHistory}>
                Clear
              </Button>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {searchHistory.map((search, index) => (
                <Chip
                  key={index}
                  label={search}
                  size="small"
                  icon={<TimelineIcon />}
                  onClick={() => setSearchInput(search)}
                  onDelete={() => {
                    setSearchHistory(searchHistory.filter((_, i) => i !== index));
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Search Prompts */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowSearchPrompts(!showSearchPrompts)}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <SearchIcon sx={{ color: '#ef4444' }} />
              <Typography variant="h6" fontWeight="bold">
                Search Tips & Examples
              </Typography>
            </Box>
            {showSearchPrompts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>

          {showSearchPrompts && (
            <>
              <Box mt={2}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                  Best Search Examples:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}>
                      <PersonIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                      <Typography variant="caption">"Patrick Mahomes stats"</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}>
                      <PeopleIcon sx={{ fontSize: 14, color: '#3b82f6' }} />
                      <Typography variant="caption">"Kansas City Chiefs players"</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}>
                      <ShieldIcon sx={{ fontSize: 14, color: '#10b981' }} />
                      <Typography variant="caption">"Top 10 quarterbacks"</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}>
                      <TrendingUpIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                      <Typography variant="caption">"Players with 10+ touchdowns"</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Pro Tip</AlertTitle>
                Be specific! Try "LeBron James points per game" or "Mahomes vs Allen comparison"
              </Alert>

              <Box display="flex" alignItems="center" gap={1} mt={2} p={1} bgcolor="success.light" borderRadius={1}>
                <BarChartIcon sx={{ fontSize: 14, color: 'success.main' }} />
                <Typography variant="caption" color="success.dark">
                  Tap any player for detailed stats. Advanced metrics available for all players.
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Team</InputLabel>
              <Select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                label="Filter by Team"
              >
                {teamFilters[selectedSport as keyof typeof teamFilters]?.map((team) => (
                  <MenuItem key={team} value={team}>{team}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Position</InputLabel>
              <Select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                label="Filter by Position"
              >
                {positionFilters[selectedSport as keyof typeof positionFilters]?.map((position) => (
                  <MenuItem key={position} value={position}>{position}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading/Refreshing Indicator */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Players Section */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Top Performers
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={`${filteredPlayers.length} players`}
              color="primary"
              size="small"
            />
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {filteredPlayers.length > 0 ? (
          <>
            {filteredPlayers.map((player) => renderPlayerCard(player))}
            {renderPlayerDetail()}
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No players found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Paper>
        )}

        {/* Footer Info */}
        <Box textAlign="center" mt={4}>
          <Typography variant="caption" color="text.secondary">
            Stats update in real-time. Pull down to refresh. All advanced metrics available.
          </Typography>
        </Box>
      </Box>

      {/* Analytics Box */}
      <AnalyticsBox />

      {/* Advanced Metrics Guide Modal */}
      <AdvancedMetricsGuide
        open={showAdvancedMetricsGuide}
        onClose={() => setShowAdvancedMetricsGuide(false)}
      />
    </Container>
  );
};

export default PlayerStatsScreen;
