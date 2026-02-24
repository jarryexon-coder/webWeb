// src/pages/PropsDetailsScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Alert,
  AlertTitle,
  Skeleton,
  Tooltip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  InputAdornment,
  Slider,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon,
  EmojiEvents as TrophyIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  CompareArrows as CompareIcon,
  Casino as CasinoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { format, formatDistance, subDays } from 'date-fns';
import { useBookmarks } from '../context/BookmarkContext';
import { useNotifications } from '../context/NotificationContext';
import { playerPropsApi } from '../services/playerProps';
import { loadParlayTemplates, saveParlayTemplate } from '../services/storageService';

// =============================================
// TYPES & INTERFACES
// =============================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface PlayerPropData {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  gameId: string;
  gameTime: string;
  sport: string;
  position: string;
  statType: string;
  line: number;
  projection: number;
  projectionEdge: number;
  confidence: number;
  overOdds: number;
  underOdds: number;
  overPrice: number;
  underPrice: number;
  bookmaker: string;
  impliedProbability: number;
  fairValue: number;
  edge: number;
  isRecommended: boolean;
  isLive: boolean;
  isTrending: boolean;
  lastUpdate: string;
  usage_rate?: number;
  minutes_projected?: number;
  injury_status?: string;
}

// =============================================
// TAB PANEL COMPONENT
// =============================================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`props-tabpanel-${index}`}
    aria-labelledby={`props-tab-${index}`}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

// =============================================
// MAIN COMPONENT
// =============================================

const PropsDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
const { propId } = useParams();
// then fetch prop by ID 

  // Contexts
  const bookmarks = useBookmarks();
  const notifications = useNotifications();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [propData, setPropData] = useState<PlayerPropData | null>(null);
  const [gameLogs, setGameLogs] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<any | null>(null);
  const [bookmakerComparisons, setBookmakerComparisons] = useState<any[]>([]);
  const [similarPlayers, setSimilarPlayers] = useState<any[]>([]);
  const [venueStats, setVenueStats] = useState<any | null>(null);
  const [weather, setWeather] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookmaker, setSelectedBookmaker] = useState('best');
  const [customLine, setCustomLine] = useState<number>(0);
  const [customStake, setCustomStake] = useState<number>(10);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Chart data
  const [chartTimeframe, setChartTimeframe] = useState<'last5' | 'last10' | 'season'>('last10');

  // =============================================
  // COMPUTED VALUES
  // =============================================

  const isBookmarked = useMemo(() => {
    return propData ? bookmarks.isBookmarked('prop', propData.id) : false;
  }, [propData, bookmarks]);

  const bookmark = useMemo(() => {
    return propData ? bookmarks.getBookmarkByItemId('prop', propData.id) : undefined;
  }, [propData, bookmarks]);

  const recommendedAction = useMemo(() => {
    if (!propData) return null;

    if (propData.edge > 10) {
      return {
        action: 'Strong Over',
        color: 'success',
        icon: <TrendingUpIcon />,
        description: 'Significant positive edge - recommended play',
      };
    } else if (propData.edge > 5) {
      return {
        action: 'Over',
        color: 'info',
        icon: <TrendingUpIcon />,
        description: 'Positive edge - consider playing',
      };
    } else if (propData.edge > 0) {
      return {
        action: 'Lean Over',
        color: 'warning',
        icon: <TrendingFlatIcon />,
        description: 'Slight edge - monitor',
      };
    } else {
      return {
        action: 'Avoid',
        color: 'error',
        icon: <TrendingDownIcon />,
        description: 'No edge - consider other props',
      };
    }
  }, [propData]);

  const potentialPayout = useMemo(() => {
    if (!propData) return 0;

    const odds = propData.edge > 0 ? propData.overPrice : propData.underPrice;
    if (odds > 0) {
      return customStake * (odds / 100);
    } else {
      return customStake * (100 / Math.abs(odds));
    }
  }, [propData, customStake]);

  const impliedProbability = useMemo(() => {
    if (!propData) return 0;

    const odds = propData.edge > 0 ? propData.overPrice : propData.underPrice;
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }, [propData]);

  const fairOdds = useMemo(() => {
    if (!propData || !propData.fairValue) return null;

    const probability = propData.fairValue;
    if (probability >= 0.5) {
      return -((probability / (1 - probability)) * 100);
    } else {
      return ((1 - probability) / probability) * 100;
    }
  }, [propData]);

  // =============================================
  // DATA FETCHING
  // =============================================

  const fetchPropData = useCallback(async () => {
    if (!propId) {
      setError('No prop ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching props for sport=nba (propId=${propId})...`);
      const props = await playerPropsApi.getProps('nba');
      console.log(`✅ Received ${props.length} props from API`);

      if (!props || props.length === 0) {
        setError('No props available from API');
        setLoading(false);
        return;
      }

      // Try exact match first
      let prop = props.find(p => p.id === propId);

      // If not found and propId is numeric, try matching by suffix (e.g., "_1")
      if (!prop && /^\d+$/.test(propId)) {
        const num = parseInt(propId, 10);
        prop = props.find(p => {
          const match = p.id.match(/_(\d+)$/);
          return match && parseInt(match[1], 10) === num;
        });
        if (prop) console.log(`✅ Found by numeric suffix: ${prop.id}`);
      }

      // Fallback: if still not found, try index (1‑based)
      if (!prop && /^\d+$/.test(propId)) {
        const index = parseInt(propId, 10) - 1;
        if (index >= 0 && index < props.length) {
          prop = props[index];
          console.log(`✅ Found by index ${index}: ${prop.id}`);
        }
      }

      if (!prop) {
        console.error('❌ Prop not found with ID:', propId);
        setError(`Prop not found (ID: ${propId})`);
        setLoading(false);
        return;
      }

      if (!propId) return <div>No prop ID provided</div>;

      // Map to PlayerPropData
      const propData: PlayerPropData = {
        id: prop.id,
        playerId: prop.player_id || prop.player,
        playerName: prop.player,
        team: prop.team,
        opponent: prop.opponent || 'Unknown',
        gameId: prop.game || '',
        gameTime: prop.game_time || new Date().toISOString(),
        sport: prop.sport,
        position: prop.position || 'N/A',
        statType: prop.market || 'Points',
        line: prop.line,
        projection: prop.line * (1 + (prop.confidence - 50) / 100),
        projectionEdge: prop.confidence - 50,
        confidence: prop.confidence,
        overOdds: prop.over_odds,
        underOdds: prop.under_odds,
        overPrice: prop.over_odds,
        underPrice: prop.under_odds,
        bookmaker: 'Best Available',
        impliedProbability: 0,
        fairValue: 0,
        edge: prop.confidence - 50,
        isRecommended: prop.confidence > 70,
        isLive: false,
        isTrending: false,
        lastUpdate: prop.last_updated || new Date().toISOString(),
        usage_rate: 28.5,
        minutes_projected: 34.2,
        injury_status: 'healthy',
      };

      setPropData(propData);
      setCustomLine(propData.line);

      // Fetch additional mock data
      fetchGameLogs(prop.player, prop.sport);
      fetchBookmakerComparisons(prop);
      fetchSimilarPlayers(prop);
      fetchVenueStats(prop);
      fetchWeather(prop);
      fetchAIAnalysis(prop);
    } catch (err) {
      console.error('❌ Error in fetchPropData:', err);
      setError('Failed to load prop details');
    } finally {
      setLoading(false);
    }
  }, [propId]);

  // Mock functions for additional data
  const fetchGameLogs = useCallback(async (playerName: string, sport: string) => {
    const logs = [];
    for (let i = 0; i < 10; i++) {
      logs.push({
        date: subDays(new Date(), i).toISOString(),
        opponent: ['LAL', 'GSW', 'BOS', 'PHX', 'MIL'][i % 5],
        isHome: i % 2 === 0,
        minutes: 32 + Math.floor(Math.random() * 10),
        statValue: parseFloat((20 + Math.random() * 10).toFixed(1)),
        line: propData?.line || 25.5,
        result: Math.random() > 0.5 ? 'over' : 'under',
        fantasyPoints: parseFloat((Math.random() * 40 + 10).toFixed(1)),
      });
    }
    setGameLogs(logs);

    const stats = {
      gamesPlayed: logs.length,
      avgStat: parseFloat((logs.reduce((sum, log) => sum + log.statValue, 0) / logs.length).toFixed(1)),
      minStat: Math.min(...logs.map(l => l.statValue)),
      maxStat: Math.max(...logs.map(l => l.statValue)),
      medianStat: parseFloat(logs.map(l => l.statValue).sort((a, b) => a - b)[Math.floor(logs.length / 2)].toFixed(1)),
      stdDev: parseFloat(Math.sqrt(logs.reduce((sum, log) => sum + Math.pow(log.statValue - (logs.reduce((s, l) => s + l.statValue, 0) / logs.length), 2), 0) / logs.length).toFixed(1)),
      overRate: parseFloat((logs.filter(l => l.result === 'over').length / logs.length * 100).toFixed(1)),
      underRate: parseFloat((logs.filter(l => l.result === 'under').length / logs.length * 100).toFixed(1)),
      pushRate: 0,
      avgLine: propData?.line || 25.5,
      avgDiff: parseFloat((logs.reduce((sum, log) => sum + (log.statValue - (propData?.line || 25.5)), 0) / logs.length).toFixed(1)),
    };
    setSeasonStats(stats);
  }, [propData]);

  const fetchBookmakerComparisons = useCallback(async (prop: any) => {
    const comparisons = [];
    for (let i = 0; i < 5; i++) {
      comparisons.push({
        bookmaker: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet'][i],
        overPrice: prop.over_odds + (Math.random() * 20 - 10),
        underPrice: prop.under_odds + (Math.random() * 20 - 10),
        overImplied: 0.5 + (Math.random() * 0.1 - 0.05),
        underImplied: 0.5 + (Math.random() * 0.1 - 0.05),
        lastUpdate: new Date().toISOString(),
      });
    }
    setBookmakerComparisons(comparisons);
  }, []);

  const fetchSimilarPlayers = useCallback(async (prop: any) => {
    const similar = [];
    for (let i = 0; i < 5; i++) {
      similar.push({
        id: `sim-${i}`,
        name: `Player ${i}`,
        team: ['LAL', 'GSW', 'BOS'][i % 3],
        position: prop.position,
        avgStat: 20 + Math.random() * 10,
        overRate: 40 + Math.floor(Math.random() * 30),
      });
    }
    setSimilarPlayers(similar);
  }, []);

  const fetchVenueStats = useCallback(async (prop: any) => {
    setVenueStats({
      venue: `${prop.team} Arena`,
      gamesPlayed: 41,
      avgStat: 22.5 + Math.random() * 5,
      overRate: 48 + Math.floor(Math.random() * 20),
      underRate: 52 - Math.floor(Math.random() * 20),
    });
  }, []);

  const fetchWeather = useCallback(async (prop: any) => {
    setWeather({
      condition: 'Indoor',
      temperature: 68,
      windSpeed: 0,
      precipitation: 0,
      isIndoor: true,
    });
  }, []);

  const fetchAIAnalysis = useCallback(async (prop: any) => {
    setAiLoading(true);
    setTimeout(() => {
      setAiAnalysis(`${prop.player} has been consistent recently, averaging ${(prop.line * 1.05).toFixed(1)} over the last 5 games. The matchup against a weak defense favors the over.`);
      setAiLoading(false);
    }, 1000);
  }, []);

  // =============================================
  // EFFECTS
  // =============================================

  useEffect(() => {
    fetchPropData();
  }, [fetchPropData]);

  // =============================================
  // HANDLERS
  // =============================================

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleBookmark = async () => {
    if (!propData) return;

    if (isBookmarked && bookmark) {
      await bookmarks.removeBookmark(bookmark.id);
      notifications.success('Removed', 'Prop removed from bookmarks');
    } else {
      await bookmarks.addBookmark(
        'prop',
        propData.id,
        propData,
        {
          sport: propData.sport,
          team: propData.team,
          opponent: propData.opponent,
          gameTime: propData.gameTime,
          line: propData.line,
          projection: propData.projection,
          odds: propData.edge > 0 ? propData.overPrice.toString() : propData.underPrice.toString(),
          confidence: propData.confidence,
          tags: [propData.statType, propData.position],
        },
        propData.edge > 10 ? 'high' : propData.edge > 5 ? 'medium' : 'low'
      );
      notifications.success('Saved', 'Prop added to bookmarks');
    }
  };

  const handleToggleNotification = () => {
    setNotificationEnabled(!notificationEnabled);
    if (!notificationEnabled) {
      notifications.success(
        'Alert Set',
        `You'll be notified when ${propData?.playerName} ${propData?.statType} line changes significantly`
      );
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${propData?.playerName} ${propData?.statType} Prop`,
        text: `${propData?.playerName} ${propData?.statType}: Over/Under ${propData?.line} (${propData?.edge > 0 ? '+' : ''}${propData?.edge}% edge)`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      notifications.info('Copied', 'Link copied to clipboard');
    }
  };

  const handleAddToParlay = () => {
    notifications.success('Added', 'Prop added to parlay builder');
  };

  const handleSaveTemplate = () => {
    if (!propData) return;

    const template = {
      id: `template-${Date.now()}`,
      name: `${propData.playerName} ${propData.statType} Prop`,
      description: `${propData.statType} Over/Under ${propData.line} - ${propData.edge}% edge`,
      sport: propData.sport,
      type: 'player_props',
      legs: [{
        id: `leg-${Date.now()}`,
        description: `${propData.playerName} ${propData.statType} ${propData.edge > 0 ? 'Over' : 'Under'} ${propData.line}`,
        odds: propData.edge > 0 ? propData.overPrice.toString() : propData.underPrice.toString(),
        confidence: propData.confidence,
        sport: propData.sport,
        market: 'player_props',
        player_name: propData.playerName,
        stat_type: propData.statType,
        line: propData.line,
        value_side: propData.edge > 0 ? 'over' : 'under',
        confidence_level: propData.confidence > 80 ? 'very-high' : propData.confidence > 70 ? 'high' : 'medium',
      }],
      total_odds: propData.edge > 0 ? `+${((propData.overPrice / 100 + 1) * 100 - 100).toFixed(0)}` : `-${Math.abs(propData.underPrice)}`,
      confidence: propData.confidence,
      confidence_level: propData.confidence > 80 ? 'very-high' : propData.confidence > 70 ? 'high' : 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      tags: [propData.sport, propData.statType.toLowerCase(), propData.position.toLowerCase()],
      isFavorite: false,
      isCustom: true,
    };

    saveParlayTemplate(template);
    notifications.success('Template Saved', 'Parlay template saved successfully');
  };

  const handleBookmakerChange = (event: SelectChangeEvent) => {
    setSelectedBookmaker(event.target.value);
  };

  const handleCustomLineChange = (_event: Event, value: number | number[]) => {
    setCustomLine(value as number);
  };

  const handleStakeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStake(parseFloat(event.target.value) || 0);
  };

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setChartTimeframe(event.target.value as any);
  };

  // =============================================
  // CHART DATA
  // =============================================

  const chartData = useMemo(() => {
    let data = [...gameLogs];

    if (chartTimeframe === 'last5') {
      data = data.slice(0, 5);
    } else if (chartTimeframe === 'last10') {
      data = data.slice(0, 10);
    }

    return data.map(log => ({
      date: format(new Date(log.date), 'MM/dd'),
      value: log.statValue,
      line: log.line,
      result: log.result,
    })).reverse();
  }, [gameLogs, chartTimeframe]);

  const radarData = useMemo(() => {
    if (!propData || !seasonStats) return [];

    return [
      { subject: 'Volume', A: propData.projection / 30 * 100, fullMark: 100 },
      { subject: 'Efficiency', A: (propData.projectionEdge > 0 ? 70 + propData.edge : 50) * 0.8, fullMark: 100 },
      { subject: 'Consistency', A: 100 - (seasonStats.stdDev / seasonStats.avgStat * 50), fullMark: 100 },
      { subject: 'Matchup', A: propData.edge > 0 ? 65 + propData.edge : 45, fullMark: 100 },
      { subject: 'Home/Away', A: venueStats?.overRate || 50, fullMark: 100 },
      { subject: 'Recent Form', A: 60 + (propData.projection / propData.line - 1) * 100, fullMark: 100 },
    ];
  }, [propData, seasonStats, venueStats]);

  // =============================================
  // RENDER HELPERS
  // =============================================

  const renderSportIcon = (sport: string) => {
    switch (sport?.toLowerCase()) {
      case 'nba':
        return <BasketballIcon />;
      case 'nfl':
        return <FootballIcon />;
      case 'mlb':
        return <BaseballIcon />;
      case 'nhl':
        return <HockeyIcon />;
      default:
        return <SportsBasketballIcon />;
    }
  };

  const renderConfidenceBadge = (confidence: number) => {
    let color: 'success' | 'warning' | 'error' | 'default' = 'default';
    let label = 'Low';

    if (confidence >= 80) {
      color = 'success';
      label = 'High';
    } else if (confidence >= 70) {
      color = 'success';
      label = 'Good';
    } else if (confidence >= 60) {
      color = 'warning';
      label = 'Medium';
    } else {
      color = 'error';
      label = 'Low';
    }

    return (
      <Chip
        label={`${label} (${confidence}%)`}
        color={color}
        size="small"
        variant="outlined"
        sx={{ color: '#fff', borderColor: theme.palette[color].main }}
      />
    );
  };

  const renderOddsFormat = (odds: number) => {
    const formatted = odds > 0 ? `+${odds}` : `${odds}`;
    return (
      <Typography
        variant="body2"
        sx={{ color: odds > 0 ? '#4caf50' : odds < 0 ? '#f44336' : '#fff', fontWeight: 'bold' }}
      >
        {formatted}
      </Typography>
    );
  };

  // =============================================
  // LOADING STATE
  // =============================================

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2, color: '#fff' }}>
            <ArrowBackIcon />
          </IconButton>
          <Skeleton variant="text" width={300} height={40} sx={{ bgcolor: '#333' }} />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, bgcolor: '#333' }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, bgcolor: '#333' }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, bgcolor: '#333' }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // =============================================
  // ERROR STATE
  // =============================================

  if (error || !propData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2, color: '#fff' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ color: '#fff' }}>Prop Details</Typography>
        </Box>

        <Alert
          severity="error"
          sx={{
            bgcolor: '#d32f2f',
            color: '#fff',
            '& .MuiAlert-message': { color: '#fff', width: '100%' },
            mb: 2
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchPropData}
              sx={{ color: '#fff', borderColor: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          <AlertTitle sx={{ color: '#fff' }}>Error</AlertTitle>
          {error || 'Failed to load prop details'}
        </Alert>

        <Typography variant="body2" sx={{ color: '#aaa', mt: 2 }}>
          Prop ID: {propId}
        </Typography>
      </Container>
    );
  }

  // =============================================
  // MAIN RENDER
  // =============================================

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={handleBack} sx={{ mr: 2, color: '#fff' }}>
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48, mr: 2 }}>
            {renderSportIcon(propData.sport)}
          </Avatar>

          <Box>
            <Typography variant="h5" component="h1" sx={{ color: '#fff' }}>
              {propData.playerName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip label={propData.team} size="small" variant="outlined" sx={{ color: '#fff', borderColor: '#555' }} />
              <Typography variant="body2" sx={{ color: '#aaa' }}>vs {propData.opponent}</Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>• {format(new Date(propData.gameTime), 'h:mm a')}</Typography>
              {propData.isLive && (
                <Chip label="LIVE" size="small" color="error" sx={{ animation: 'pulse 2s infinite' }} />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}>
            <IconButton onClick={handleToggleBookmark} sx={{ color: isBookmarked ? theme.palette.primary.main : '#fff' }}>
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={notificationEnabled ? 'Disable Alerts' : 'Enable Alerts'}>
            <IconButton onClick={handleToggleNotification} sx={{ color: notificationEnabled ? theme.palette.primary.main : '#fff' }}>
              {notificationEnabled ? <NotificationsActiveIcon /> : <NotificationsIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton onClick={handleShare} sx={{ color: '#fff' }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Main Prop Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e1e1e' }}>
            <Grid container spacing={3}>
              {/* Prop Card */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" sx={{ color: '#aaa' }}>
                    {propData.statType} {propData.edge > 0 ? 'Over' : 'Under'}
                  </Typography>
                  <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', my: 1, color: '#fff' }}>
                    {propData.line.toFixed(1)}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>Projection</Typography>
                      <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                        {propData.projection.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>Edge</Typography>
                      <Typography variant="h6" sx={{ color: propData.edge > 0 ? '#4caf50' : '#f44336' }}>
                        {propData.edge > 0 ? '+' : ''}{propData.edge.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  {renderConfidenceBadge(propData.confidence)}
                </Box>
              </Grid>

              {/* Odds Card */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" sx={{ color: '#aaa' }}>Best Available Odds</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, my: 2 }}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: propData.edge > 0 ? alpha(theme.palette.success.main, 0.1) : 'transparent', border: 1, borderColor: propData.edge > 0 ? 'success.main' : '#333', minWidth: 120 }}>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>Over {propData.line}</Typography>
                      {renderOddsFormat(propData.overPrice)}
                      <Typography variant="caption" sx={{ color: '#aaa' }} display="block">{propData.bookmaker}</Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: propData.edge < 0 ? alpha(theme.palette.success.main, 0.1) : 'transparent', border: 1, borderColor: propData.edge < 0 ? 'success.main' : '#333', minWidth: 120 }}>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>Under {propData.line}</Typography>
                      {renderOddsFormat(propData.underPrice)}
                      <Typography variant="caption" sx={{ color: '#aaa' }} display="block">{propData.bookmaker}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={selectedBookmaker}
                        onChange={handleBookmakerChange}
                        displayEmpty
                        sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}
                      >
                        <MenuItem value="best">Best Available</MenuItem>
                        {bookmakerComparisons.map((b, i) => (
                          <MenuItem key={i} value={b.bookmaker}>{b.bookmaker}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3, borderColor: '#333' }} />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" color={propData.edge > 0 ? 'success' : 'primary'} startIcon={<CasinoIcon />} onClick={handleAddToParlay}>
                  Add to Parlay
                </Button>
                <Button variant="outlined" startIcon={<StarIcon />} onClick={handleSaveTemplate} sx={{ color: '#fff', borderColor: '#555' }}>
                  Save as Template
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: '#333' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant={isMobile ? 'fullWidth' : 'standard'} textColor="inherit" sx={{ '& .MuiTab-root': { color: '#aaa' }, '& .Mui-selected': { color: '#fff' } }}>
              <Tab label="Analysis" icon={<TimelineIcon />} iconPosition="start" />
              <Tab label="Game Logs" icon={<HistoryIcon />} iconPosition="start" />
              <Tab label="Comparisons" icon={<CompareIcon />} iconPosition="start" />
              <Tab label="Advanced" icon={<BarChartIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Analysis Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* AI Analysis */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#fff', flex: 1 }}>AI Analysis</Typography>
                      {aiLoading && <LinearProgress sx={{ width: 100, bgcolor: '#333' }} />}
                    </Box>
                    <Typography variant="body1" paragraph sx={{ color: '#fff' }}>
                      {aiAnalysis || 'Loading AI analysis...'}
                    </Typography>
                    {recommendedAction && (
                      <Alert severity={recommendedAction.color as any} icon={recommendedAction.icon} sx={{ mt: 2, bgcolor: '#2d2d2d', color: '#fff' }}>
                        <AlertTitle sx={{ color: '#fff' }}>{recommendedAction.action}</AlertTitle>
                        <Typography sx={{ color: '#fff' }}>{recommendedAction.description}</Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Key Factors */}
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Key Factors</Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>Recent Form</Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {propData.projection > propData.line ? 'Above Line' : 'Below Line'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>vs {propData.opponent}</Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {seasonStats?.overRate || 50}% Over Rate
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>Home/Away</Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {venueStats?.overRate || 50}% Over at Home
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#aaa' }}>Rest Days</Typography>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {Math.floor(Math.random() * 3) + 1} days
                        </Typography>
                      </Box>
                      {weather && !weather.isIndoor && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: '#aaa' }}>Weather</Typography>
                          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                            {weather.condition}, {weather.temperature}°F
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Radar Chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Performance Radar</Typography>
                    <Box sx={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#333" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#aaa' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#aaa' }} />
                          <Radar name={propData.playerName} dataKey="A" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.6} />
                          <Legend wrapperStyle={{ color: '#fff' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Value Calculator */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Value Calculator</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>Custom Line</Typography>
                        <Slider
                          value={customLine}
                          onChange={handleCustomLineChange}
                          min={propData.line - 5}
                          max={propData.line + 5}
                          step={0.5}
                          marks={[
                            { value: propData.line - 5, label: `${propData.line - 5}` },
                            { value: propData.line, label: `${propData.line}` },
                            { value: propData.line + 5, label: `${propData.line + 5}` },
                          ]}
                          valueLabelDisplay="auto"
                          sx={{ color: theme.palette.primary.main }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>Stake Amount ($)</Typography>
                        <TextField
                          fullWidth
                          type="number"
                          value={customStake}
                          onChange={handleStakeChange}
                          InputProps={{
                            startAdornment: <InputAdornment position="start" sx={{ color: '#fff' }}>$</InputAdornment>,
                            sx: { color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }
                          }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: '#aaa' }} gutterBottom>Potential Payout</Typography>
                          <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>${potentialPayout.toFixed(2)}</Typography>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>Profit: ${(potentialPayout - customStake).toFixed(2)}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2, borderColor: '#333' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Implied Probability</Typography>
                        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold' }}>{(impliedProbability * 100).toFixed(1)}%</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Fair Value</Typography>
                        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {propData.fairValue ? (propData.fairValue * 100).toFixed(1) : '--'}%
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Fair Odds</Typography>
                        <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                          {fairOdds ? (fairOdds > 0 ? `+${fairOdds.toFixed(0)}` : fairOdds.toFixed(0)) : '--'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Game Logs Tab */}
          <TabPanel value={tabValue} index={1}>
            <Card sx={{ bgcolor: '#1e1e1e' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#fff' }}>Recent Performance</Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select value={chartTimeframe} onChange={handleTimeframeChange} sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}>
                      <MenuItem value="last5">Last 5 Games</MenuItem>
                      <MenuItem value="last10">Last 10 Games</MenuItem>
                      <MenuItem value="season">Season</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Chart */}
                <Box sx={{ height: 300, width: '100%', mb: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" tick={{ fill: '#aaa' }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: '#aaa' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#2d2d2d', borderColor: '#333', color: '#fff' }} />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 4, fill: theme.palette.primary.main }} activeDot={{ r: 6 }} name={propData.statType} />
                      <Line type="monotone" dataKey="line" stroke="#f44336" strokeWidth={2} strokeDasharray="5 5" name="Line" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>

                {/* Stats Summary */}
                {seasonStats && (
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Games Played</Typography>
                        <Typography variant="h6" sx={{ color: '#fff' }}>{seasonStats.gamesPlayed}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Season Avg</Typography>
                        <Typography variant="h6" sx={{ color: '#fff' }}>{seasonStats.avgStat.toFixed(1)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Over Rate</Typography>
                        <Typography variant="h6" sx={{ color: '#4caf50' }}>{seasonStats.overRate}%</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Avg Diff</Typography>
                        <Typography variant="h6" sx={{ color: seasonStats.avgDiff > 0 ? '#4caf50' : '#f44336' }}>
                          {seasonStats.avgDiff > 0 ? '+' : ''}{seasonStats.avgDiff.toFixed(1)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}

                {/* Game Log Table */}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { color: '#fff', borderBottom: '1px solid #333' } }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Opponent</TableCell>
                        <TableCell align="center">MIN</TableCell>
                        <TableCell align="center">{propData.statType}</TableCell>
                        <TableCell align="center">Line</TableCell>
                        <TableCell align="center">Result</TableCell>
                        <TableCell align="center">FPTS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gameLogs.slice(0, 10).map((log, index) => (
                        <TableRow key={index} sx={{ '& td': { color: '#fff', borderBottom: '1px solid #333' } }}>
                          <TableCell>{format(new Date(log.date), 'MMM d')}</TableCell>
                          <TableCell>{log.isHome ? 'vs' : '@'} {log.opponent}</TableCell>
                          <TableCell align="center">{log.minutes}</TableCell>
                          <TableCell align="center"><Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{log.statValue.toFixed(1)}</Typography></TableCell>
                          <TableCell align="center">{log.line.toFixed(1)}</TableCell>
                          <TableCell align="center">
                            <Chip label={log.result.toUpperCase()} size="small" color={log.result === 'over' ? 'success' : log.result === 'under' ? 'error' : 'warning'} variant="outlined" sx={{ color: '#fff' }} />
                          </TableCell>
                          <TableCell align="center">{log.fantasyPoints.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Comparisons Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* Bookmaker Comparison */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Bookmaker Comparison</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { color: '#fff', borderBottom: '1px solid #333' } }}>
                            <TableCell>Bookmaker</TableCell>
                            <TableCell align="center">Over Odds</TableCell>
                            <TableCell align="center">Under Odds</TableCell>
                            <TableCell align="center">Over Implied</TableCell>
                            <TableCell align="center">Under Implied</TableCell>
                            <TableCell align="center">Last Update</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bookmakerComparisons.map((comp, index) => (
                            <TableRow key={index} sx={{ '& td': { color: '#fff', borderBottom: '1px solid #333' } }}>
                              <TableCell><Typography sx={{ color: '#fff', fontWeight: 'medium' }}>{comp.bookmaker}</Typography></TableCell>
                              <TableCell align="center">{renderOddsFormat(comp.overPrice)}</TableCell>
                              <TableCell align="center">{renderOddsFormat(comp.underPrice)}</TableCell>
                              <TableCell align="center">{(comp.overImplied * 100).toFixed(1)}%</TableCell>
                              <TableCell align="center">{(comp.underImplied * 100).toFixed(1)}%</TableCell>
                              <TableCell align="center">{formatDistance(new Date(comp.lastUpdate), new Date(), { addSuffix: true })}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Similar Players */}
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Similar Players ({propData.position})</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { color: '#fff', borderBottom: '1px solid #333' } }}>
                            <TableCell>Player</TableCell>
                            <TableCell>Team</TableCell>
                            <TableCell align="center">Avg</TableCell>
                            <TableCell align="center">Over Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {similarPlayers.map((player) => (
                            <TableRow key={player.id} sx={{ '& td': { color: '#fff', borderBottom: '1px solid #333' } }}>
                              <TableCell><Typography sx={{ color: '#fff', fontWeight: 'medium' }}>{player.name}</Typography></TableCell>
                              <TableCell>{player.team}</TableCell>
                              <TableCell align="center">{player.avgStat.toFixed(1)}</TableCell>
                              <TableCell align="center">
                                <Chip label={`${player.overRate}%`} size="small" color={player.overRate > 50 ? 'success' : 'error'} variant="outlined" sx={{ color: '#fff' }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Venue Stats */}
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Venue Analysis</Typography>
                    {venueStats && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56, mr: 2 }}>{propData.team.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ color: '#fff' }}>{venueStats.venue}</Typography>
                            <Typography variant="body2" sx={{ color: '#aaa' }}>{venueStats.gamesPlayed} games this season</Typography>
                          </Box>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                              <Typography variant="caption" sx={{ color: '#aaa' }}>Avg {propData.statType}</Typography>
                              <Typography variant="h6" sx={{ color: '#fff' }}>{venueStats.avgStat.toFixed(1)}</Typography>
                              <Typography variant="caption" sx={{ color: '#aaa' }}>vs {seasonStats?.avgStat.toFixed(1)} season</Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                              <Typography variant="caption" sx={{ color: '#aaa' }}>Over Rate</Typography>
                              <Typography variant="h6" sx={{ color: '#4caf50' }}>{venueStats.overRate}%</Typography>
                              <Typography variant="caption" sx={{ color: '#aaa' }}>vs {seasonStats?.overRate.toFixed(1)}% overall</Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Advanced Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              {/* Advanced Metrics */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Advanced Metrics</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>Usage Rate</Typography>
                          <Typography variant="h6" sx={{ color: '#fff' }}>{propData.usage_rate || 28.5}%</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>Minutes Proj</Typography>
                          <Typography variant="h6" sx={{ color: '#fff' }}>{propData.minutes_projected || 34.2}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>Pace Impact</Typography>
                          <Typography variant="h6" sx={{ color: '#fff' }}>+3.2</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#2d2d2d', borderColor: '#333' }}>
                          <Typography variant="caption" sx={{ color: '#aaa' }}>Defensive Rating</Typography>
                          <Typography variant="h6" sx={{ color: '#fff' }}>112.4</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Injury Report */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Injury Status</Typography>
                    <Alert severity={propData.injury_status === 'healthy' ? 'success' : 'warning'} icon={propData.injury_status === 'healthy' ? <CheckCircleIcon /> : <WarningIcon />} sx={{ bgcolor: '#2d2d2d', color: '#fff' }}>
                      <AlertTitle sx={{ color: '#fff' }}>{propData.injury_status === 'healthy' ? 'Active' : propData.injury_status}</AlertTitle>
                      {propData.injury_status === 'healthy' ? 'No injury concerns - expected to play' : 'Questionable - monitor pre-game warmups'}
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>

              {/* Historical Trends */}
              <Grid item xs={12}>
                <Card sx={{ bgcolor: '#1e1e1e' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Historical Trends</Typography>
                    <Box sx={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" tick={{ fill: '#aaa' }} />
                          <YAxis tick={{ fill: '#aaa' }} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#2d2d2d', borderColor: '#333', color: '#fff' }} />
                          <Area type="monotone" dataKey="value" stroke={theme.palette.primary.main} fill={theme.palette.primary.main} fillOpacity={0.3} name={propData.statType} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Grid>

        {/* Right Column - Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Player Info Card */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e1e1e' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: theme.palette.primary.main }}>{propData.playerName.charAt(0)}</Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#fff' }}>{propData.playerName}</Typography>
                <Typography variant="body2" sx={{ color: '#aaa' }}>{propData.position} | #{propData.team}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2, borderColor: '#333' }} />
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Season Stats</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>{seasonStats?.avgStat.toFixed(1)} {propData.statType}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Last 5 Avg</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  {gameLogs.slice(0, 5).reduce((sum, log) => sum + log.statValue, 0) / 5}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>vs {propData.opponent}</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>{seasonStats?.overRate || 50}% Over</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Projection Accuracy</Typography>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>78%</Typography>
              </Box>
            </Stack>
            <Button fullWidth variant="outlined" startIcon={<HistoryIcon />} sx={{ mt: 2, color: '#fff', borderColor: '#555' }} onClick={() => setTabValue(1)}>
              View Full Game Log
            </Button>
          </Paper>

          {/* Market Movement */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e1e1e' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>Market Movement</Typography>
            <Box sx={{ height: 200, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { time: '1h', over: propData.overPrice + 10, under: propData.underPrice - 5 },
                  { time: '45m', over: propData.overPrice + 5, under: propData.underPrice - 2 },
                  { time: '30m', over: propData.overPrice - 5, under: propData.underPrice + 5 },
                  { time: '15m', over: propData.overPrice + 2, under: propData.underPrice - 2 },
                  { time: 'Now', over: propData.overPrice, under: propData.underPrice },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" tick={{ fill: '#aaa' }} />
                  <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fill: '#aaa' }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#2d2d2d', borderColor: '#333', color: '#fff' }} />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="over" stroke="#4caf50" name="Over" />
                  <Line type="monotone" dataKey="under" stroke="#f44336" name="Under" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Typography variant="caption" sx={{ color: '#aaa', mt: 1, display: 'block' }}>
              Line movement from open: {propData.line.toFixed(1)} → {propData.line.toFixed(1)}
            </Typography>
          </Paper>

          {/* Public Betting */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e1e1e' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>Public Betting</Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Over {propData.line}</Typography>
                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>68%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={68} sx={{ height: 8, borderRadius: 4, bgcolor: alpha('#f44336', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>Under {propData.line}</Typography>
                <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 'bold' }}>32%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={32} sx={{ height: 8, borderRadius: 4, bgcolor: alpha('#4caf50', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#f44336' } }} />
            </Box>
            <Typography variant="caption" sx={{ color: '#aaa', mt: 2, display: 'block' }}>Based on 2,341 bets tracked</Typography>
          </Paper>

          {/* Sharp Money */}
          <Paper sx={{ p: 3, bgcolor: '#1e1e1e' }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>Sharp Money</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}><TrophyIcon /></Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>Over {propData.line}</Typography>
                <Typography variant="caption" sx={{ color: '#aaa' }}>Heavy sharp action detected</Typography>
              </Box>
            </Box>
            <Alert severity="info" icon={<InfoIcon />} sx={{ bgcolor: '#2d2d2d', color: '#fff' }}>
              <AlertTitle sx={{ color: '#fff' }}>Smart Money Indicator</AlertTitle>
              <Typography sx={{ color: '#fff' }}>Professional bettors are backing the Over</Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PropsDetailsScreen;
