// src/pages/PlayerStatsScreen.tsx – Real Data with Correct Team Assignments
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
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon,
  Lock as LockIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

// ============= CONSTANTS =============
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';
const PYTHON_API_BASE = 'https://python-api-fresh-production.up.railway.app';

// Mock data – only used as ultimate fallback if API fails completely
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
      team: 'Los Angeles Lakers', // corrected team
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
  ],
  NHL: [],
  MLB: []
};

const sportsData = [
  { id: 'nba', name: 'NBA', icon: <BasketballIcon />, color: '#2563eb' },
  { id: 'nfl', name: 'NFL', icon: <FootballIcon />, color: '#dc2626' },
  { id: 'nhl', name: 'NHL', icon: <HockeyIcon />, color: '#0891b2' },
  { id: 'mlb', name: 'MLB', icon: <BaseballIcon />, color: '#ca8a04' },
];

const positionFilters = {
  nfl: ['All Positions', 'QB', 'RB', 'WR', 'TE', 'DEF'],
  nba: ['All Positions', 'PG', 'SG', 'SF', 'PF', 'C'],
  nhl: ['All Positions', 'LW', 'C', 'RW', 'D', 'G'],
  mlb: ['All Positions', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF']
};

// Premium-only content wrapper
const PremiumContent = ({ hasAccess, children, message }: { hasAccess: boolean; children: React.ReactNode; message?: string }) => {
  if (!hasAccess) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Premium Feature
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {message || 'Upgrade to premium to access advanced player analytics and insights.'}
        </Typography>
        <Button variant="contained" startIcon={<CreditCardIcon />}>
          Upgrade to Premium
        </Button>
      </Box>
    );
  }
  return <>{children}</>;
};

// Analytics Component (unchanged)
const AnalyticsBox = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);

  const loadAnalyticsEvents = () => {
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
    <Modal open={showAnalytics} onClose={() => setShowAnalytics(false)} closeAfterTransition>
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <AnalyticsIcon color="primary" />
                <Typography variant="h5" fontWeight="bold">Player Stats Analytics</Typography>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton onClick={() => { setAnalyticsEvents([]); alert('Analytics cleared'); }} color="error" size="small"><CloseIcon /></IconButton>
                <IconButton onClick={() => setShowAnalytics(false)} size="small"><CloseIcon /></IconButton>
              </Box>
            </Box>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={4}><Box textAlign="center" p={1}><Typography variant="h4" fontWeight="bold">{analyticsEvents.length}</Typography><Typography variant="caption" color="text.secondary">Total Events</Typography></Box></Grid>
              <Grid item xs={4}><Box textAlign="center" p={1}><Typography variant="h4" fontWeight="bold">{analyticsEvents.filter(e => e.event.includes('view')).length}</Typography><Typography variant="caption" color="text.secondary">Views</Typography></Box></Grid>
              <Grid item xs={4}><Box textAlign="center" p={1}><Typography variant="h4" fontWeight="bold">{analyticsEvents.filter(e => e.event.includes('select')).length}</Typography><Typography variant="caption" color="text.secondary">Selections</Typography></Box></Grid>
            </Grid>
            <Typography variant="subtitle1" fontWeight="bold" mb={2}>Recent Player Stats Events</Typography>
            {analyticsEvents.length === 0 ? (
              <Box textAlign="center" py={4}><BarChartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} /><Typography color="text.secondary">No player stats analytics recorded</Typography><Typography variant="caption" color="text.secondary">Interact with players to see events</Typography></Box>
            ) : (
              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {analyticsEvents.map((event, index) => (
                  <ListItem key={index} sx={{ mb: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <ListItemAvatar><Avatar sx={{ bgcolor: event.event.includes('error') ? 'error.main' : 'info.main', width: 32, height: 32 }}>{event.event.includes('error') ? '!' : '📊'}</Avatar></ListItemAvatar>
                    <ListItemText primary={event.event.split('_').slice(1).join(' ')} secondary={Object.keys(event.params).length > 0 ? JSON.stringify(event.params) : new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }} secondaryTypographyProps={{ variant: 'caption' }} />
                  </ListItem>
                ))}
              </List>
            )}
            <Button fullWidth variant="contained" startIcon={<RefreshIcon />} onClick={loadAnalyticsEvents} sx={{ mt: 2 }}>Refresh Analytics</Button>
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
        <DialogContentText sx={{ mb: 3 }}>These advanced metrics provide deeper insights into player performance beyond traditional statistics.</DialogContentText>
        <Grid container spacing={2}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} key={index}>
              <Card sx={{ borderLeft: `4px solid ${metric.color}` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Box sx={{ width: 12, height: 12, bgcolor: metric.color, borderRadius: '50%', mr: 2 }} />
                    <Typography variant="h6" fontWeight="medium">{metric.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">{metric.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
};

const PlayerStatsContent: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, getIdToken } = useAuth();
  
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb' | 'nhl'>('nba');
  const [showApiDebug, setShowApiDebug] = useState(false);
  
  const [selectedPosition, setSelectedPosition] = useState('All Positions');
  const [selectedTeam, setSelectedTeam] = useState('All Teams');
  const [searchInput, setSearchInput] = useState('');
  const [showAdvancedMetricsGuide, setShowAdvancedMetricsGuide] = useState(false);
  const [showSearchPrompts, setShowSearchPrompts] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [plan, setPlan] = useState('free');
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  
  const [searchHistory, setSearchHistory] = useState<string[]>(['Patrick Mahomes', 'Quarterbacks', 'Top receivers']);

  // ===== CHECK SUBSCRIPTION STATUS =====
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user || !user.uid) return;
      
      try {
        const token = await getIdToken();
        
        // Fetch subscription
        const response = await fetch(`${PYTHON_API_BASE}/api/subscriptions/my-subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.subscription) {
          const isActive = data.subscription.status === 'active';
          setHasPremiumAccess(isActive);
          setPlan(data.subscription.plan_id || 'free');
          setSubscriptionStatus(data.subscription.status);
        } else {
          setHasPremiumAccess(false);
          setPlan('free');
          setSubscriptionStatus('inactive');
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        setHasPremiumAccess(false);
      }
    };
    
    fetchSubscriptionStatus();
  }, [user, getIdToken]);

  // Helper to normalize API response
  const normalizeResponse = (data: any): { success: boolean; data: any[] } => {
    if (Array.isArray(data)) {
      return { success: true, data };
    }
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      return { success: true, data: data.data };
    }
    return { success: false, data: [] };
  };

  // ============= NEW: Fetch Tank01 players for current team mapping =============
  const {
    data: tank01PlayersData,
    isLoading: tank01Loading
  } = useQuery({
    queryKey: ['tank01Players', selectedSport],
    queryFn: async () => {
      try {
        const url = `${NODE_API_BASE}/api/tank01/players?sport=${selectedSport}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          // Build a map from player name (normalized) to team abbreviation
          const teamMap = new Map<string, string>();
          json.data.forEach((player: any) => {
            const name = player.longName || player.name;
            if (name && player.team) {
              // Normalize name for matching
              const normalized = name.toLowerCase().replace(/[^a-z]/g, '');
              teamMap.set(normalized, player.team);
            }
          });
          console.log(`✅ Tank01 team map built with ${teamMap.size} players`);
          return teamMap;
        }
        return new Map();
      } catch (err) {
        console.error('Failed to fetch Tank01 players:', err);
        return new Map();
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });

  // ============= Fetch fantasyhub players =============
  const {
    data: playersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['players', selectedSport],
    queryFn: async () => {
      const url = `${NODE_API_BASE}/api/fantasyhub/players?sport=${selectedSport}&filterByToday=false`;
      console.log(`📡 Fetching players for ${selectedSport} from:`, url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      console.log(`✅ Raw response for ${selectedSport}:`, json);
      const normalized = normalizeResponse(json);
      if (normalized.success && normalized.data.length > 0) {
        return { players: normalized.data, is_real_data: true };
      }
      return { players: [], is_real_data: false };
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const playersFromApi = playersData?.players || [];
  const tank01TeamMap = tank01PlayersData || new Map();

  // ============= TRANSFORM API DATA with corrected team names =============
  const players = React.useMemo(() => {
    console.log('🔄 Processing player data:', {
      fromAPI: playersFromApi.length,
      sport: selectedSport,
      hasRealData: playersData?.is_real_data || false,
      tank01MapSize: tank01TeamMap.size,
    });

    if (playersFromApi.length > 0 && playersData?.is_real_data) {
      console.log(`✅ Using real API data for ${selectedSport} (${playersFromApi.length} players)`);
      return playersFromApi.map((player: any, index: number) => {
        // Build stats object as before
        const stats: any = {};
        if (selectedSport === 'nba') {
          stats.points = player.points ?? 0;
          stats.rebounds = player.rebounds ?? 0;
          stats.assists = player.assists ?? 0;
          stats.steals = player.steals ?? 0;
          stats.blocks = player.blocks ?? 0;
          stats.fgPct = player.fgPct ?? player.fg_pct ?? 0;
          stats.threePtPct = player.threePtPct ?? player.three_pct ?? 0;
          stats.turnovers = player.turnovers ?? 0;
        } else if (selectedSport === 'nhl') {
          stats.goals = player.goals ?? 0;
          stats.assists = player.assists ?? 0;
          stats.points = player.points ?? 0;
          stats.shots = player.shots ?? 0;
          stats.plusMinus = player.plusMinus ?? 0;
          stats.hits = player.hits ?? 0;
          stats.blockedShots = player.blockedShots ?? 0;
          stats.pim = player.penaltiesInMinutes ?? 0;
        } else if (selectedSport === 'mlb') {
          stats.avg = player.battingAverage ?? player.avg ?? 0;
          stats.hr = player.homeRuns ?? player.hr ?? 0;
          stats.rbi = player.rbi ?? 0;
          stats.runs = player.runs ?? 0;
          stats.sb = player.stolenBases ?? player.steals ?? 0;
          stats.ops = player.ops ?? 0;
          stats.era = player.era ?? 0;
          stats.whip = player.whip ?? 0;
          stats.k = player.strikeouts ?? 0;
        } else if (selectedSport === 'nfl') {
          stats.passingYards = player.passingYards ?? 0;
          stats.passingTDs = player.passingTDs ?? 0;
          stats.interceptions = player.interceptions ?? 0;
          stats.rushingYards = player.rushingYards ?? 0;
          stats.rushingTDs = player.rushingTDs ?? 0;
          stats.receptions = player.receptions ?? 0;
          stats.receivingYards = player.receivingYards ?? 0;
          stats.receivingTDs = player.receivingTDs ?? 0;
          stats.sacks = player.sacks ?? 0;
        }

        // Get correct team from Tank01 mapping
        let correctTeam = player.team;
        if (player.name) {
          const normalizedName = player.name.toLowerCase().replace(/[^a-z]/g, '');
          const tankTeam = tank01TeamMap.get(normalizedName);
          if (tankTeam) {
            correctTeam = tankTeam;
            console.log(`🔁 Corrected team for ${player.name}: ${player.team} -> ${correctTeam}`);
          }
        }

        return {
          id: player.player_id || player.id || `player-${index}`,
          name: player.name || `Player ${index + 1}`,
          team: correctTeam,
          position: player.position || 'N/A',
          number: player.number || (index + 1),
          age: player.age || 25 + index,
          height: player.height || "6'0\"",
          weight: player.weight || "200 lbs",
          salary: player.salary ? `$${player.salary.toLocaleString()}/yr` : 'N/A',
          contract: player.contract || "1 year",
          trend: player.trend || 'neutral',
          isPremium: player.isPremium || player.is_premium || false,
          stats: stats,
          highlights: player.highlights || [],
        };
      });
    } else {
      // Fallback to mock data
      console.log(`⚠️ No real data for ${selectedSport}, falling back to mock`);
      const sportUpper = selectedSport.toUpperCase();
      const mockSportData = mockPlayers[sportUpper as keyof typeof mockPlayers];
      return mockSportData || mockPlayers.NBA;
    }
  }, [playersFromApi, selectedSport, playersData, tank01TeamMap]);

  // Dynamically generate unique team list from corrected teams
  const uniqueTeams = React.useMemo(() => {
    const teams = players.map(p => p.team).filter(Boolean);
    return ['All Teams', ...new Set(teams)].sort();
  }, [players]);

  // Filter players based on filters and search
  const filteredPlayers = React.useMemo(() => {
    return players.filter(player => {
      if (selectedPosition !== 'All Positions' && player.position !== selectedPosition) return false;
      if (selectedTeam !== 'All Teams' && player.team !== selectedTeam) return false;
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
  }, [players, selectedPosition, selectedTeam, searchInput]);

  // Calculate advanced metrics (same as before)
  const calculateAdvancedMetrics = (player: any) => {
    const stats = player.stats || {};
    
    let per = 0;
    let tsPercentage = 0;
    let usageRate = 0;
    let winShares = 0;
    let vorp = 0;
    let efficiency = 0;

    const sportUpper = selectedSport.toUpperCase();
    
    if (sportUpper === 'NBA') {
      per = ((stats.points || 0) * 1.0 +
             (stats.rebounds || 0) * 0.8 +
             (stats.assists || 0) * 1.2 +
             (stats.steals || 0) * 1.5 +
             (stats.blocks || 0) * 2.0 -
             (stats.turnovers || 0) * 1.0) / 10;
      per = Math.max(0, Math.min(per, 40));
      
      efficiency = ((stats.points || 0) + (stats.rebounds || 0) + (stats.assists || 0) +
                    (stats.steals || 0) + (stats.blocks || 0) -
                    (stats.turnovers || 0));
      winShares = per * 0.2;
      vorp = (per - 15) * 0.5;
      usageRate = 25 + (per - 15) * 2;
    } else if (sportUpper === 'NFL') {
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
    } else {
      efficiency = Object.values(stats).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
      per = efficiency / 10;
      winShares = per * 0.1;
      vorp = (per - 5) * 0.2;
      usageRate = 50;
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

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchHistory([searchInput.trim(), ...searchHistory.slice(0, 4)]);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId as 'nba' | 'nfl' | 'mlb' | 'nhl');
    setSelectedPosition('All Positions');
    setSelectedTeam('All Teams');
  };

  const handlePlayerClick = (player: any) => {
    navigate(`/player/${player.id}?sport=${selectedSport}`);
  };

  const handleStripeCheckout = async (planId: string, interval: string = 'month') => {
    try {
      const token = await getIdToken();
      const response = await fetch(`${PYTHON_API_BASE}/api/subscriptions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, interval }),
      });
      
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  // Premium-only stats
  const advancedStats = React.useMemo(() => {
    if (!hasPremiumAccess) return null;
    
    const playersWithStats = players.filter(p => p.stats);
    
    const avgPER = playersWithStats.length > 0
      ? (playersWithStats.reduce((sum, p) => {
          const metrics = calculateAdvancedMetrics(p);
          return sum + (parseFloat(metrics.per) || 0);
        }, 0) / playersWithStats.length).toFixed(1)
      : 'N/A';
    
    const topPerformers = playersWithStats
      .sort((a, b) => {
        const metricsA = calculateAdvancedMetrics(a);
        const metricsB = calculateAdvancedMetrics(b);
        return parseFloat(metricsB.per) - parseFloat(metricsA.per);
      })
      .slice(0, 5);
    
    const totalEfficiency = playersWithStats.reduce((sum, p) => {
      const metrics = calculateAdvancedMetrics(p);
      return sum + (parseFloat(metrics.efficiency) || 0);
    }, 0);
    
    return {
      avgPER,
      topPerformers,
      totalEfficiency,
      playerCount: playersWithStats.length
    };
  }, [players, hasPremiumAccess]);

  // Render player card
  const renderPlayerCard = (player: any) => {
    const stats = player.stats;
    let displayStats: { label: string; value: number }[] = [];

    if (selectedSport === 'nba') {
      displayStats = [
        { label: 'PTS', value: stats.points },
        { label: 'REB', value: stats.rebounds },
        { label: 'AST', value: stats.assists },
        { label: 'STL', value: stats.steals },
      ];
    } else if (selectedSport === 'nhl') {
      displayStats = [
        { label: 'G', value: stats.goals },
        { label: 'A', value: stats.assists },
        { label: 'PTS', value: stats.points },
        { label: 'SOG', value: stats.shots },
        { label: '+/-', value: stats.plusMinus },
      ];
    } else if (selectedSport === 'mlb') {
      displayStats = [
        { label: 'AVG', value: stats.avg },
        { label: 'HR', value: stats.hr },
        { label: 'RBI', value: stats.rbi },
        { label: 'SB', value: stats.sb },
      ];
    } else if (selectedSport === 'nfl') {
      if (player.position === 'QB') {
        displayStats = [
          { label: 'YDS', value: stats.passingYards },
          { label: 'TD', value: stats.passingTDs },
          { label: 'INT', value: stats.interceptions },
          { label: 'RUSH', value: stats.rushingYards },
        ];
      } else if (player.position === 'WR' || player.position === 'TE') {
        displayStats = [
          { label: 'REC', value: stats.receptions },
          { label: 'YDS', value: stats.receivingYards },
          { label: 'TD', value: stats.receivingTDs },
        ];
      } else if (player.position === 'RB') {
        displayStats = [
          { label: 'RUSH', value: stats.rushingYards },
          { label: 'RUSH TD', value: stats.rushingTDs },
          { label: 'REC', value: stats.receptions },
          { label: 'REC YDS', value: stats.receivingYards },
        ];
      } else if (player.position === 'DEF') {
        displayStats = [
          { label: 'SACK', value: stats.sacks },
          { label: 'INT', value: stats.interceptions },
          { label: 'FF', value: stats.forcedFumbles || 0 },
          { label: 'TD', value: stats.defensiveTDs || 0 },
        ];
      }
    }

    const statsToShow = displayStats.slice(0, 4);
    const metrics = calculateAdvancedMetrics(player);

    return (
      <Card 
        key={player.id} 
        sx={{ 
          mb: 2, 
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8]
          }
        }}
        onClick={() => handlePlayerClick(player)}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{player.name.charAt(0)}</Avatar>
            <Box flex={1}>
              <Typography variant="h6" fontWeight="bold">{player.name}</Typography>
              <Typography variant="body2" color="text.secondary">{player.team} • {player.position} #{player.number}</Typography>
            </Box>
            {player.isPremium && !hasPremiumAccess && (
              <Tooltip title="Premium Player">
                <LockIcon sx={{ color: 'warning.main', fontSize: 20 }} />
              </Tooltip>
            )}
          </Box>
          <Grid container spacing={1} mb={2}>
            {statsToShow.map((stat, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <Box textAlign="center" p={1} bgcolor="action.hover" borderRadius={1}>
                  <Typography variant="h6" fontWeight="bold">
                    {typeof stat.value === 'number' ? stat.value.toFixed(1) : stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Box display="flex" gap={1}>
            <Chip icon={<SpeedIcon />} label={`PER: ${metrics.per}`} size="small" sx={{ bgcolor: alpha('#7c3aed', 0.1), color: '#7c3aed' }} />
            <Chip icon={<PulseIcon />} label={`EFF: ${metrics.efficiency}`} size="small" sx={{ bgcolor: alpha('#ec4899', 0.1), color: '#ec4899' }} />
            {hasPremiumAccess && (
              <Chip icon={<StarIcon />} label={`VORP: ${metrics.vorp}`} size="small" sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }} />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || tank01Loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography variant="h6" ml={2}>Loading Player Analytics...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, pt: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ color: 'text.primary' }}>Back</Button>
          <Box display="flex" gap={1}>
            {hasPremiumAccess ? (
              <Chip icon={<CheckCircleIcon />} label="PREMIUM" color="success" />
            ) : (
              <Chip icon={<LockIcon />} label="FREE TIER" color="default" />
            )}
            <Chip icon={<DiamondIcon />} label="PRO" sx={{ bgcolor: 'warning.main', color: 'white' }} />
          </Box>
        </Box>
        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>Player Analytics</Typography>
          <Typography variant="h6" color="text.secondary">
            Advanced stats, metrics, and player insights
            {playersData?.is_real_data && <Chip label="LIVE DATA" size="small" color="success" sx={{ ml: 2, verticalAlign: 'middle' }} />}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">Failed to load player data</Typography>
          <Typography variant="body2">{error instanceof Error ? error.message : 'Unknown error'}</Typography>
          <Box sx={{ mt: 2 }}><Button variant="contained" size="small" onClick={handleRefresh}>Retry Loading</Button></Box>
        </Alert>
      )}

      {/* Upgrade Banner for Free Users */}
      {!hasPremiumAccess && players.length > 0 && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setShowUpgradeModal(true)}>
              Upgrade Now
            </Button>
          }
        >
          <AlertTitle>Unlock Premium Analytics</AlertTitle>
          Get access to advanced metrics, VORP scores, top performer analysis, and detailed player comparisons.
        </Alert>
      )}

      {/* Premium Stats Dashboard */}
      {hasPremiumAccess && advancedStats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <SpeedIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Avg Player Efficiency
                  </Typography>
                </Box>
                <Typography variant="h4">{advancedStats.avgPER}</Typography>
                <Typography variant="caption" color="text.secondary">
                  League average is 15.0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <EmojiEventsIcon color="warning" />
                  <Typography variant="body2" color="text.secondary">
                    Total Players
                  </Typography>
                </Box>
                <Typography variant="h4">{advancedStats.playerCount}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Analyzed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <BarChartIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Total Efficiency
                  </Typography>
                </Box>
                <Typography variant="h4">{advancedStats.totalEfficiency.toFixed(0)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Combined score
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ cursor: 'pointer' }} onClick={() => setShowAdvancedMetricsGuide(true)}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <InfoIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Advanced Metrics
                  </Typography>
                </Box>
                <Typography variant="h4">Guide</Typography>
                <Typography variant="caption" color="text.secondary">
                  Click to learn more
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Top Performers (Premium Only) */}
      {hasPremiumAccess && advancedStats?.topPerformers && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top 5 Performers by PER
          </Typography>
          <Grid container spacing={2}>
            {advancedStats.topPerformers.map((player, idx) => {
              const metrics = calculateAdvancedMetrics(player);
              return (
                <Grid item xs={12} sm={6} md={4} key={player.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          #{idx + 1}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {player.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {player.team} • {player.position}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">PER</Typography>
                          <Typography variant="h6">{metrics.per}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">EFF</Typography>
                          <Typography variant="h6">{metrics.efficiency}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">VORP</Typography>
                          <Typography variant="h6">{metrics.vorp}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">USG%</Typography>
                          <Typography variant="h6">{metrics.usageRate}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>Select Sport</Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {sportsData.map((sport) => (
            <Chip
              key={sport.id}
              icon={sport.icon}
              label={sport.name}
              onClick={() => handleSportChange(sport.id)}
              color={selectedSport === sport.id ? 'primary' : 'default'}
              variant={selectedSport === sport.id ? 'filled' : 'outlined'}
              sx={{ ...(selectedSport === sport.id && { bgcolor: sport.color, color: 'white', '&:hover': { bgcolor: sport.color } }) }}
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, bgcolor: playersData?.is_real_data ? '#dcfce7' : '#fef3c7' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {playersData?.is_real_data ? '✅ REAL DATA CONNECTED' : '⚠️ USING MOCK DATA'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Endpoint: Node API • Players: {playersFromApi.length} • Sport: {selectedSport.toUpperCase()}
            </Typography>
          </Box>
          <Button size="small" variant="outlined" onClick={() => setShowApiDebug(!showApiDebug)} startIcon={<BugReportIcon />}>Debug</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder={`Search ${selectedSport.toUpperCase()} players, teams, stats...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
              endAdornment: searchInput && (<InputAdornment position="end"><IconButton size="small" onClick={() => setSearchInput('')}><CloseIcon /></IconButton></InputAdornment>),
            }}
          />
          <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 120 }}>Search</Button>
        </Box>
        {searchHistory.length > 0 && !searchInput && (
          <Box mt={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary">Recent Searches</Typography>
              <Button size="small" onClick={clearSearchHistory}>Clear</Button>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {searchHistory.map((search, index) => (
                <Chip key={index} label={search} size="small" icon={<TimelineIcon />} onClick={() => setSearchInput(search)} onDelete={() => setSearchHistory(searchHistory.filter((_, i) => i !== index))} />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setShowSearchPrompts(!showSearchPrompts)}>
            <Box display="flex" alignItems="center" gap={1}><SearchIcon sx={{ color: '#ef4444' }} /><Typography variant="h6" fontWeight="bold">Search Tips & Examples</Typography></Box>
            {showSearchPrompts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
          {showSearchPrompts && (
            <>
              <Box mt={2}>
                <Typography variant="subtitle2" fontWeight="bold" mb={1}>Best Search Examples:</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}><Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}><PersonIcon sx={{ fontSize: 14, color: '#ef4444' }} /><Typography variant="caption">"Patrick Mahomes stats"</Typography></Box></Grid>
                  <Grid item xs={12} sm={6}><Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}><PeopleIcon sx={{ fontSize: 14, color: '#3b82f6' }} /><Typography variant="caption">"Kansas City Chiefs players"</Typography></Box></Grid>
                  <Grid item xs={12} sm={6}><Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}><ShieldIcon sx={{ fontSize: 14, color: '#10b981' }} /><Typography variant="caption">"Top 10 quarterbacks"</Typography></Box></Grid>
                  <Grid item xs={12} sm={6}><Box display="flex" alignItems="center" gap={1} p={1} bgcolor="action.hover" borderRadius={1}><TrendingUpIcon sx={{ fontSize: 14, color: '#f59e0b' }} /><Typography variant="caption">"Players with 10+ touchdowns"</Typography></Box></Grid>
                </Grid>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}><AlertTitle>Pro Tip</AlertTitle>Be specific! Try "LeBron James points per game" or "Mahomes vs Allen comparison"</Alert>
              <Box display="flex" alignItems="center" gap={1} mt={2} p={1} bgcolor="success.light" borderRadius={1}><BarChartIcon sx={{ fontSize: 14, color: 'success.main' }} /><Typography variant="caption" color="success.dark">Tap any player for detailed stats. Advanced metrics available for all players.</Typography></Box>
            </>
          )}
        </CardContent>
      </Card>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Team</InputLabel>
              <Select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} label="Filter by Team">
                {uniqueTeams.map((team) => <MenuItem key={team} value={team}>{team}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Position</InputLabel>
              <Select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} label="Filter by Position">
                {positionFilters[selectedSport as keyof typeof positionFilters]?.map((position) => (
                  <MenuItem key={position} value={position}>{position}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {(isLoading || isRefetching) && <LinearProgress sx={{ mb: 2 }} />}

      {showApiDebug && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f3f4f6' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>API Debug Information</Typography>
          <Box sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <div><strong>Endpoint:</strong> Node API</div>
            <div><strong>Sport:</strong> {selectedSport}</div>
            <div><strong>API Players:</strong> {playersFromApi.length}</div>
            <div><strong>Processed Players:</strong> {players.length}</div>
            <div><strong>Filtered Players:</strong> {filteredPlayers.length}</div>
            <div><strong>Using Real Data:</strong> {playersData?.is_real_data ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Has Premium Access:</strong> {hasPremiumAccess ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Subscription Plan:</strong> {plan}</div>
            <div><strong>Subscription Status:</strong> {subscriptionStatus}</div>
            <div><strong>Tank01 Team Map Size:</strong> {tank01TeamMap.size}</div>
            <div><strong>API Response:</strong></div>
            <pre style={{ background: '#1e293b', color: '#f8fafc', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px', marginTop: '8px' }}>{JSON.stringify(playersData || {}, null, 2)}</pre>
            {playersFromApi[0] && (
              <>
                <div><strong>First Player Sample:</strong></div>
                <pre style={{ background: '#1e293b', color: '#f8fafc', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px', marginTop: '8px' }}>{JSON.stringify(playersFromApi[0], null, 2)}</pre>
              </>
            )}
          </Box>
        </Paper>
      )}

      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold">Top Performers</Typography>
            <Typography variant="caption" color="text.secondary">{playersData?.is_real_data ? 'Live data from API' : 'Using mock data'}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={`${filteredPlayers.length} players`} color="primary" size="small" />
            <IconButton onClick={handleRefresh} disabled={isLoading || isRefetching}><RefreshIcon /></IconButton>
          </Box>
        </Box>

        {filteredPlayers.length > 0 ? (
          <>
            {filteredPlayers.map((player) => renderPlayerCard(player))}
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No players found</Typography>
            <Typography variant="body2" color="text.secondary">Try adjusting your search or filters</Typography>
            <Box mt={2}><Button onClick={handleRefresh} sx={{ mr: 1 }} variant="outlined">Retry Loading</Button></Box>
          </Paper>
        )}

        <Box textAlign="center" mt={4}>
          <Typography variant="caption" color="text.secondary">
            {playersData?.is_real_data ? '✅ Stats from real API data. Updates automatically.' : '⚠️ Using mock data. Check API connection.'}
          </Typography>
          {!playersData?.is_real_data && (
            <Typography variant="caption" display="block" color="warning.main">
              Please ensure the backend is running and the API endpoint is available.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon sx={{ color: '#f59e0b' }} />
            <Typography variant="h6">Upgrade to Premium</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Get access to advanced player analytics, VORP scores, top performer analysis, and detailed comparisons.
          </Typography>
          <Box sx={{ my: 3 }}>
            {[
              'Advanced metrics (PER, VORP, USG%)',
              'Top 5 performers analysis',
              'Player comparison tools',
              'Historical performance trends',
              'Efficiency ratings',
              'Detailed scouting reports',
            ].map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#10b981', mr: 1, fontSize: 18 }} />
                <Typography variant="body2">{feature}</Typography>
              </Box>
            ))}
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => handleStripeCheckout('starter', 'month')}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#10b981" gutterBottom>
                    Starter
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    $5.99
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    /month
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, bgcolor: '#10b981' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStripeCheckout('starter', 'month');
                    }}
                  >
                    Choose Starter
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card variant="outlined" sx={{ borderColor: '#f59e0b', borderWidth: 2, cursor: 'pointer' }} onClick={() => handleStripeCheckout('analytics', 'month')}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#f59e0b" gutterBottom>
                    Analytics
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    $19.99
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    /month
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ mt: 2, bgcolor: '#f59e0b' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStripeCheckout('analytics', 'month');
                    }}
                  >
                    Choose Analytics
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpgradeModal(false)}>Not Now</Button>
        </DialogActions>
      </Dialog>

      <AnalyticsBox />
      <AdvancedMetricsGuide open={showAdvancedMetricsGuide} onClose={() => setShowAdvancedMetricsGuide(false)} />
    </Container>
  );
};

const PlayerStatsScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="PlayerStats">
      <PlayerStatsContent />
    </ProtectedRoute>
  );
};

export default PlayerStatsScreen;
