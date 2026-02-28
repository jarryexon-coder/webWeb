// src/pages/PropsDetailsScreen.tsx – Final version with redirect and state handling
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const params = useParams();
  const location = useLocation();
  const passedProp = location.state?.prop as any;

  // ----- DEBUG LOGS -----
  console.log('🔍 [PropsDetailsScreen] useParams returned:', params);
  console.log('🔍 [PropsDetailsScreen] passedProp from state:', passedProp);
  // -----

  // Robust propId extraction
  let propId = params.propId;
  if (propId === ':propId') {
    const pathParts = window.location.pathname.split('/');
    propId = pathParts[pathParts.length - 1];
    console.warn('⚠️ [PropsDetailsScreen] useParams returned placeholder, falling back to URL path:', propId);
  } else {
    console.log('✅ [PropsDetailsScreen] propId from useParams:', propId);
  }

  // REDIRECT if the ID is still the placeholder
  if (propId === ':propId') {
    console.warn('🚨 Redirecting to /player-props because ID is :propId');
    navigate('/player-props', { replace: true });
    return null;
  }

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
  // DATA FETCHING (additional mock data) – stable callbacks
  // =============================================

  const fetchGameLogs = useCallback(async (playerName: string, sport: string, line?: number) => {
    const defaultLine = line || 25.5;
    const logs = [];
    for (let i = 0; i < 10; i++) {
      logs.push({
        date: subDays(new Date(), i).toISOString(),
        opponent: ['LAL', 'GSW', 'BOS', 'PHX', 'MIL'][i % 5],
        isHome: i % 2 === 0,
        minutes: 32 + Math.floor(Math.random() * 10),
        statValue: parseFloat((20 + Math.random() * 10).toFixed(1)),
        line: defaultLine,
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
      avgLine: defaultLine,
      avgDiff: parseFloat((logs.reduce((sum, log) => sum + (log.statValue - defaultLine), 0) / logs.length).toFixed(1)),
    };
    setSeasonStats(stats);
  }, []);

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
  // FETCH PROP DATA (from API, fallback)
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

      let prop = props.find(p => p.id === propId);
      if (!prop && /^\d+$/.test(propId)) {
        const num = parseInt(propId, 10);
        prop = props.find(p => {
          const match = p.id.match(/_(\d+)$/);
          return match && parseInt(match[1], 10) === num;
        });
      }
      if (!prop && /^\d+$/.test(propId)) {
        const index = parseInt(propId, 10) - 1;
        if (index >= 0 && index < props.length) {
          prop = props[index];
        }
      }

      if (!prop) {
        console.error('❌ Prop not found with ID:', propId);
        setError(`Prop not found (ID: ${propId})`);
        setLoading(false);
        return;
      }

      const mapped: PlayerPropData = {
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

      setPropData(mapped);
      setCustomLine(mapped.line);

      fetchGameLogs(prop.player, prop.sport, prop.line);
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
  }, [propId, fetchGameLogs, fetchBookmakerComparisons, fetchSimilarPlayers, fetchVenueStats, fetchWeather, fetchAIAnalysis]);

  // =============================================
  // EFFECT – use passed prop if available, else fetch
  // =============================================

  useEffect(() => {
    if (passedProp && passedProp.id === propId) {
      console.log('✅ Using passed prop data for', passedProp.player);
      const mapped: PlayerPropData = {
        id: passedProp.id,
        playerId: passedProp.player_id || passedProp.player,
        playerName: passedProp.player,
        team: passedProp.team,
        opponent: passedProp.opponent || 'Unknown',
        gameId: passedProp.game || '',
        gameTime: passedProp.game_time || new Date().toISOString(),
        sport: passedProp.sport,
        position: passedProp.position || 'N/A',
        statType: passedProp.market || 'Points',
        line: passedProp.line,
        projection: passedProp.line * (1 + (passedProp.confidence - 50) / 100),
        projectionEdge: passedProp.confidence - 50,
        confidence: passedProp.confidence,
        overOdds: passedProp.over_odds,
        underOdds: passedProp.under_odds,
        overPrice: passedProp.over_odds,
        underPrice: passedProp.under_odds,
        bookmaker: 'Best Available',
        impliedProbability: 0,
        fairValue: 0,
        edge: passedProp.confidence - 50,
        isRecommended: passedProp.confidence > 70,
        isLive: false,
        isTrending: false,
        lastUpdate: passedProp.last_updated || new Date().toISOString(),
        usage_rate: 28.5,
        minutes_projected: 34.2,
        injury_status: 'healthy',
      };
      setPropData(mapped);
      setCustomLine(mapped.line);
      setLoading(false);

      fetchGameLogs(passedProp.player, passedProp.sport, passedProp.line);
      fetchBookmakerComparisons(passedProp);
      fetchSimilarPlayers(passedProp);
      fetchVenueStats(passedProp);
      fetchWeather(passedProp);
      fetchAIAnalysis(passedProp);
    } else {
      fetchPropData();
    }
  }, [passedProp, propId, fetchPropData, fetchGameLogs, fetchBookmakerComparisons, fetchSimilarPlayers, fetchVenueStats, fetchWeather, fetchAIAnalysis]);

  // =============================================
  // HANDLERS (unchanged)
  // =============================================

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setTabValue(newValue);
  const handleBack = () => navigate(-1);

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

  const handleAddToParlay = () => notifications.success('Added', 'Prop added to parlay builder');
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

  const handleBookmakerChange = (event: SelectChangeEvent) => setSelectedBookmaker(event.target.value);
  const handleCustomLineChange = (_event: Event, value: number | number[]) => setCustomLine(value as number);
  const handleStakeChange = (event: React.ChangeEvent<HTMLInputElement>) => setCustomStake(parseFloat(event.target.value) || 0);
  const handleTimeframeChange = (event: SelectChangeEvent) => setChartTimeframe(event.target.value as any);

  // =============================================
  // CHART DATA
  // =============================================

  const chartData = useMemo(() => {
    let data = [...gameLogs];
    if (chartTimeframe === 'last5') data = data.slice(0, 5);
    else if (chartTimeframe === 'last10') data = data.slice(0, 10);
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
      case 'nba': return <BasketballIcon />;
      case 'nfl': return <FootballIcon />;
      case 'mlb': return <BaseballIcon />;
      case 'nhl': return <HockeyIcon />;
      default: return <SportsBasketballIcon />;
    }
  };

  const renderConfidenceBadge = (confidence: number) => {
    let color: 'success' | 'warning' | 'error' | 'default' = 'default';
    let label = 'Low';
    if (confidence >= 80) { color = 'success'; label = 'High'; }
    else if (confidence >= 70) { color = 'success'; label = 'Good'; }
    else if (confidence >= 60) { color = 'warning'; label = 'Medium'; }
    else { color = 'error'; label = 'Low'; }
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
  // LOADING / ERROR STATES
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
          <Grid item xs={12} md={8}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, bgcolor: '#333' }} /></Grid>
          <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, bgcolor: '#333' }} /></Grid>
          <Grid item xs={12}><Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, bgcolor: '#333' }} /></Grid>
        </Grid>
      </Container>
    );
  }

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
          sx={{ bgcolor: '#d32f2f', color: '#fff', '& .MuiAlert-message': { color: '#fff', width: '100%' }, mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchPropData} sx={{ color: '#fff', borderColor: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          <AlertTitle sx={{ color: '#fff' }}>Error</AlertTitle>
          {error || 'Failed to load prop details'}
        </Alert>
        <Typography variant="body2" sx={{ color: '#aaa', mt: 2 }}>Prop ID: {propId}</Typography>
      </Container>
    );
  }

  // =============================================
  // MAIN RENDER (with safe accessors)
  // =============================================

  return (
    <Container maxWidth="lg" sx={{ py: 4, bgcolor: '#121212', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={handleBack} sx={{ mr: 2, color: '#fff' }}><ArrowBackIcon /></IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48, mr: 2 }}>
            {renderSportIcon(propData.sport)}
          </Avatar>
          <Box>
            <Typography variant="h5" component="h1" sx={{ color: '#fff' }}>{propData.playerName || 'Unknown Player'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip label={propData.team || '—'} size="small" variant="outlined" sx={{ color: '#fff', borderColor: '#555' }} />
              <Typography variant="body2" sx={{ color: '#aaa' }}>vs {propData.opponent || '—'}</Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>• {propData.gameTime ? format(new Date(propData.gameTime), 'h:mm a') : '—'}</Typography>
              {propData.isLive && <Chip label="LIVE" size="small" color="error" sx={{ animation: 'pulse 2s infinite' }} />}
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
          <Tooltip title="Share"><IconButton onClick={handleShare} sx={{ color: '#fff' }}><ShareIcon /></IconButton></Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e1e1e' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="overline" sx={{ color: '#aaa' }}>{propData.statType || 'Stat'} {propData.edge > 0 ? 'Over' : 'Under'}</Typography>
                  <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', my: 1, color: '#fff' }}>{propData.line?.toFixed(1) ?? '—'}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <Box><Typography variant="caption" sx={{ color: '#aaa' }}>Projection</Typography><Typography variant="h6" sx={{ color: theme.palette.primary.main }}>{propData.projection?.toFixed(1) ?? '—'}</Typography></Box>
                    <Box><Typography variant="caption" sx={{ color: '#aaa' }}>Edge</Typography><Typography variant="h6" sx={{ color: propData.edge > 0 ? '#4caf50' : '#f44336' }}>{propData.edge > 0 ? '+' : ''}{propData.edge?.toFixed(1)}%</Typography></Box>
                  </Box>
                  {renderConfidenceBadge(propData.confidence)}
                </Box>
              </Grid>
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
                  <FormControl size="small" sx={{ minWidth: 150, mt: 2 }}>
                    <Select value={selectedBookmaker} onChange={handleBookmakerChange} displayEmpty sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' } }}>
                      <MenuItem value="best">Best Available</MenuItem>
                      {bookmakerComparisons.map((b, i) => <MenuItem key={i} value={b.bookmaker}>{b.bookmaker}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 3, borderColor: '#333' }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color={propData.edge > 0 ? 'success' : 'primary'} startIcon={<CasinoIcon />} onClick={handleAddToParlay}>Add to Parlay</Button>
              <Button variant="outlined" startIcon={<StarIcon />} onClick={handleSaveTemplate} sx={{ color: '#fff', borderColor: '#555' }}>Save as Template</Button>
            </Box>
          </Paper>

          {/* Tabs (same as before – omitted for brevity) */}
          {/* ... include the full tab rendering from your earlier code ... */}
          {/* I'll assume you keep the full tab JSX here */}
        </Grid>

        {/* Right Column (sidebar) – same as before, omitted for brevity */}
      </Grid>
    </Container>
  );
};

export default PropsDetailsScreen;
