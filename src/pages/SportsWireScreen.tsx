// src/pages/SportsWireScreen.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Badge,
  Tabs,
  Tab,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Snackbar
} from '@mui/material';
import {
  ArrowBack,
  Search,
  Analytics,
  Person,
  AccessTime,
  Share,
  BookmarkBorder,
  Bookmark,
  Newspaper,
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  ShowChart,
  Close,
  Bolt,
  Update as UpdateIcon,
  LocalHospital,
  Healing,
  MonitorHeart,
  Twitter,
  Article,
  Stadium,
  Groups as TeamIcon,
  Search as SearchIcon,
  Timeline,
  Sports,
  MedicalServices,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// ============= INJURY STATUS STANDARDIZATION (Matches FantasyHub) =============
export const INJURY_STATUS_STANDARD = {
  OUT: 'Out',
  QUESTIONABLE: 'Questionable',
  DOUBTFUL: 'Doubtful',
  DAY_TO_DAY: 'Day-to-day',
  PROBABLE: 'Probable',
  HEALTHY: 'Healthy',
  INJURED: 'Injured'
} as const;

export const normalizeInjuryStatus = (status: string | undefined): string => {
  if (!status) return INJURY_STATUS_STANDARD.HEALTHY;
  
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('out')) return INJURY_STATUS_STANDARD.OUT;
  if (lowerStatus.includes('questionable')) return INJURY_STATUS_STANDARD.QUESTIONABLE;
  if (lowerStatus.includes('doubtful')) return INJURY_STATUS_STANDARD.DOUBTFUL;
  if (lowerStatus.includes('day-to-day') || lowerStatus.includes('day to day')) return INJURY_STATUS_STANDARD.DAY_TO_DAY;
  if (lowerStatus.includes('probable')) return INJURY_STATUS_STANDARD.PROBABLE;
  if (lowerStatus.includes('healthy')) return INJURY_STATUS_STANDARD.HEALTHY;
  if (lowerStatus.includes('injured') || lowerStatus.includes('injury')) return INJURY_STATUS_STANDARD.INJURED;
  
  return INJURY_STATUS_STANDARD.HEALTHY;
};

export const getInjuryStatusColor = (status: string): string => {
  const normalized = normalizeInjuryStatus(status);
  switch (normalized) {
    case INJURY_STATUS_STANDARD.OUT: return '#ef4444';
    case INJURY_STATUS_STANDARD.DOUBTFUL: return '#f97316';
    case INJURY_STATUS_STANDARD.QUESTIONABLE: return '#f59e0b';
    case INJURY_STATUS_STANDARD.DAY_TO_DAY: return '#3b82f6';
    case INJURY_STATUS_STANDARD.PROBABLE: return '#10b981';
    case INJURY_STATUS_STANDARD.HEALTHY: return '#6b7280';
    default: return '#ef4444';
  }
};

export const getInjuryStatusLabel = (status: string): string => {
  const normalized = normalizeInjuryStatus(status);
  switch (normalized) {
    case INJURY_STATUS_STANDARD.OUT: return '❌ OUT';
    case INJURY_STATUS_STANDARD.DOUBTFUL: return '⚠️ DOUBTFUL';
    case INJURY_STATUS_STANDARD.QUESTIONABLE: return '⚠️ QUESTIONABLE';
    case INJURY_STATUS_STANDARD.DAY_TO_DAY: return '📅 DAY-TO-DAY';
    case INJURY_STATUS_STANDARD.PROBABLE: return '✅ PROBABLE';
    case INJURY_STATUS_STANDARD.HEALTHY: return '💪 HEALTHY';
    default: return '🏥 INJURED';
  }
};

// ============= CONFIGURATION =============
const API_BASE_URL = 'https://python-api-fresh-production.up.railway.app';
const NODE_API_BASE = 'https://prizepicks-production.up.railway.app';

// ============= CONSTANTS =============
const SPORT_COLORS: Record<string, string> = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981'
};

const CATEGORY_COLORS: Record<string, string> = {
  'injury': '#ef4444',
  'injuries': '#ef4444',
  'performance': '#10b981',
  'trades': '#f59e0b',
  'value': '#8b5cf6',
  'preview': '#3b82f6',
  'beat-writers': '#8b5cf6',
  'team-news': '#3b82f6',
  'game-preview': '#f59e0b',
  'recap': '#6b7280',
  'interview': '#ec4899',
  'analysis': '#14b8a6',
  'news': '#6b7280',
  'game-recap': '#6b7280',
  'milestone': '#f59e0b',
  'trade': '#ef4444',
  'spring-training': '#10b981',
  'rehab': '#3b82f6'
};

const STATIC_TEAMS_BY_SPORT: Record<string, string[]> = {
  nba: ['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW', 'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK', 'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'],
  nfl: ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'],
  mlb: ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CWS', 'CIN', 'CLE', 'COL', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SF', 'SEA', 'STL', 'TB', 'TEX', 'TOR', 'WAS'],
  nhl: ['ANA', 'BOS', 'BUF', 'CAR', 'CBJ', 'CGY', 'CHI', 'COL', 'DAL', 'DET', 'EDM', 'FLA', 'LAK', 'MIN', 'MTL', 'NJD', 'NSH', 'NYI', 'NYR', 'OTT', 'PHI', 'PIT', 'SEA', 'SJS', 'STL', 'TBL', 'TOR', 'VAN', 'VGK', 'WPG']
};

// ============= TYPES =============
interface NewsArticle {
  id: string | number;
  title: string;
  description: string;
  content?: string;
  source: { name: string } | string;
  publishedAt: string;
  url?: string;
  urlToImage?: string;
  category: string;
  sport: string;
  confidence?: number;
  player?: string;
  team?: string;
  status?: string;
  injuryStatus?: string;
  expectedReturn?: string;
  author?: string;
  beatWriter?: boolean;
}

interface PlayerProp {
  id: string | number;
  playerName: string;
  team: string;
  sport: string;
  propType: string;
  line: string;
  odds: string;
  impliedProbability: number;
  matchup: string;
  time: string;
  confidence: number;
  isBookmarked: boolean;
  aiInsights?: string[];
  category: string;
  url?: string;
  image?: string;
  injuryStatus?: string;
  rawInjuryStatus?: string;
  expectedReturn?: string;
  isBeatWriter?: boolean;
  author?: string;
  outlet?: string;
  twitter?: string;
  originalArticle: NewsArticle;
}

interface BeatWriter {
  name: string;
  outlet: string;
  twitter: string;
  national?: boolean;
}

interface InjuryDashboard {
  total_injuries: number;
  severity_breakdown: {
    severe: number;
    moderate: number;
    mild: number;
  };
  status_breakdown: {
    out: number;
    questionable: number;
    doubtful: number;
    day_to_day: number;
    probable: number;
  };
  top_injured_teams: [string, number][];
  injuries: Array<{
    player: string;
    team: string;
    status: string;
    injury: string;
    expected_return: string;
  }>;
}

// ============= FALLBACK MOCK DATA (Only used if API fails) =============
const COMPLETE_NBA_INJURIES_FALLBACK = [
  // Atlanta Hawks
  { player: 'Jalen Johnson', team: 'ATL', status: 'Out', detail: 'Shoulder injury - season ending', expectedReturn: 'season' },
  { player: 'Larry Nance Jr.', team: 'ATL', status: 'Out', detail: 'Knee surgery', expectedReturn: '2-3 weeks' },
  // Boston Celtics
  { player: 'Kristaps Porzingis', team: 'BOS', status: 'Day-to-day', detail: 'Illness', expectedReturn: 'day-to-day' },
  // Add more fallback injuries as needed
];

const NBA_BEAT_WRITERS_FALLBACK: BeatWriter[] = [
  { name: 'Shams Charania', outlet: 'ESPN', twitter: '@ShamsCharania', national: true },
  { name: 'Adrian Wojnarowski', outlet: 'ESPN', twitter: '@wojespn', national: true },
  { name: 'Marc Stein', outlet: 'Substack', twitter: '@TheSteinLine', national: true },
  { name: 'Chris Haynes', outlet: 'TNT', twitter: '@ChrisBHaynes', national: true },
];

const generateInjuryNewsFallback = (): PlayerProp[] => {
  const now = new Date();
  return COMPLETE_NBA_INJURIES_FALLBACK.map((injury, index) => {
    const normalizedStatus = normalizeInjuryStatus(injury.status);
    const timeAgo = Math.floor(Math.random() * 240) + 30;
    const publishedAt = new Date(now.getTime() - timeAgo * 60000).toISOString();
    
    return {
      id: `injury-fallback-${index}-${Date.now()}`,
      playerName: injury.player,
      team: injury.team,
      sport: 'NBA',
      propType: 'Injury Update',
      line: `${injury.player} ${normalizedStatus} - ${injury.detail}`,
      odds: '+100',
      impliedProbability: 65,
      matchup: injury.detail,
      time: `${timeAgo} minutes ago`,
      confidence: normalizedStatus === INJURY_STATUS_STANDARD.OUT ? 95 : 85,
      isBookmarked: false,
      category: 'injury',
      url: `https://www.google.com/search?q=${encodeURIComponent(injury.player + ' injury update')}`,
      injuryStatus: normalizedStatus,
      rawInjuryStatus: injury.status,
      expectedReturn: injury.expectedReturn,
      originalArticle: {
        id: `injury-fallback-${index}`,
        title: `${injury.player} Injury Update`,
        description: injury.detail,
        source: { name: 'Injury Report' },
        publishedAt: publishedAt,
        category: 'injury',
        sport: 'NBA',
        player: injury.player,
        team: injury.team
      }
    };
  });
};

const generateBeatWriterNewsFallback = (): PlayerProp[] => {
  const now = new Date();
  const players = ['LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo', 'Kevin Durant'];
  const teams = ['LAL', 'GSW', 'MIL', 'PHX'];
  
  return NBA_BEAT_WRITERS_FALLBACK.flatMap((writer, idx) => {
    const player = players[idx % players.length];
    const team = teams[idx % teams.length];
    const timeAgo = Math.floor(Math.random() * 180) + 10;
    const publishedAt = new Date(now.getTime() - timeAgo * 60000).toISOString();
    
    return {
      id: `beat-fallback-${idx}-${Date.now()}`,
      playerName: player,
      team: team,
      sport: 'NBA',
      propType: 'Beat Writer',
      line: `${writer.name}: ${player} provides update`,
      odds: '+100',
      impliedProbability: 65,
      matchup: `${writer.name} of ${writer.outlet} provides the latest on ${player} and the ${team}.`,
      time: `${timeAgo} minutes ago`,
      confidence: 88,
      isBookmarked: false,
      category: 'beat-writers',
      url: `https://www.google.com/search?q=${encodeURIComponent(player + ' news')}`,
      isBeatWriter: true,
      author: writer.name,
      outlet: writer.outlet,
      twitter: writer.twitter,
      originalArticle: {
        id: `beat-fallback-article-${idx}`,
        title: `${writer.name}: ${player} update`,
        description: `Latest on ${player}`,
        source: { name: writer.outlet },
        publishedAt: publishedAt,
        category: 'beat-writers',
        sport: 'NBA',
        player: player,
        team: team
      }
    };
  });
};

// ============= MAIN COMPONENT =============
const SportsWireScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb' | 'nhl'>('nba');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [showInjuryDashboardModal, setShowInjuryDashboardModal] = useState(false);
  const [showBeatWritersModal, setShowBeatWritersModal] = useState(false);
  const [showTeamNewsModal, setShowTeamNewsModal] = useState(false);
  const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [bookmarked, setBookmarked] = useState<(string | number)[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [processedNews, setProcessedNews] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [injuryNews, setInjuryNews] = useState<PlayerProp[]>([]);
  const [beatWriterNews, setBeatWriterNews] = useState<PlayerProp[]>([]);
  const [teams, setTeams] = useState<string[]>(STATIC_TEAMS_BY_SPORT.nba);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamNews, setTeamNews] = useState<PlayerProp[]>([]);
  const [injuryDashboard, setInjuryDashboard] = useState<InjuryDashboard | null>(null);
  const [searchResults, setSearchResults] = useState<PlayerProp[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Update teams when sport changes
  useEffect(() => {
    setTeams(STATIC_TEAMS_BY_SPORT[selectedSport] || []);
    setSelectedTeam('');
  }, [selectedSport]);

  // ============= LOAD DATA FROM BACKEND =============
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);
    
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/api/sports-wire/frontend-format?sport=${selectedSport}`;
      
      console.log(`📡 Fetching data from: ${url}`);
      
      const response = await fetch(url, {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📦 Backend response:', result);
      
      if (result.success) {
        // Set the transformed data directly
        const news = result.processedNews || [];
        const injuries = result.injuryNews || [];
        const beatWriters = result.beatWriterNews || [];
        
        setProcessedNews(news);
        setInjuryNews(injuries);
        setBeatWriterNews(beatWriters);
        
        // Set injury dashboard if available
        if (result.injuryDashboard) {
          setInjuryDashboard(result.injuryDashboard);
        } else if (injuries.length > 0) {
          // Create dashboard from injury data if not provided
          const severityBreakdown = {
            severe: injuries.filter(i => i.injuryStatus === 'Out').length,
            moderate: injuries.filter(i => i.injuryStatus === 'Questionable').length,
            mild: injuries.filter(i => i.injuryStatus === 'Day-to-day').length
          };
          
          const statusBreakdown = {
            out: injuries.filter(i => i.injuryStatus === 'Out').length,
            questionable: injuries.filter(i => i.injuryStatus === 'Questionable').length,
            doubtful: injuries.filter(i => i.injuryStatus === 'Doubtful').length,
            day_to_day: injuries.filter(i => i.injuryStatus === 'Day-to-day').length,
            probable: injuries.filter(i => i.injuryStatus === 'Probable').length
          };
          
          const teamInjuries: Record<string, number> = {};
          injuries.forEach(i => {
            teamInjuries[i.team] = (teamInjuries[i.team] || 0) + 1;
          });
          
          setInjuryDashboard({
            total_injuries: injuries.length,
            severity_breakdown: severityBreakdown,
            status_breakdown: statusBreakdown,
            top_injured_teams: Object.entries(teamInjuries).sort((a, b) => b[1] - a[1]).slice(0, 5),
            injuries: injuries.slice(0, 15).map(i => ({
              player: i.playerName,
              team: i.team,
              status: i.injuryStatus || 'Unknown',
              injury: i.line,
              expected_return: i.expectedReturn || 'TBD'
            }))
          });
        }
        
        console.log(`✅ Loaded ${news.length} total items (${injuries.length} injuries, ${beatWriters.length} beat writers)`);
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setShowErrorSnackbar(true);
      setErrorMessage(`Failed to load data: ${errorMsg}. Using mock data.`);
      
      // Fallback to mock data
      console.log('🔄 Falling back to mock data');
      setUsingMockData(true);
      
      const injuries = generateInjuryNewsFallback();
      const beatWriters = generateBeatWriterNewsFallback();
      
      setInjuryNews(injuries);
      setBeatWriterNews(beatWriters);
      setProcessedNews([...injuries, ...beatWriters]);
      
      // Create mock injury dashboard
      const severityBreakdown = {
        severe: injuries.filter(i => i.injuryStatus === 'Out').length,
        moderate: injuries.filter(i => i.injuryStatus === 'Questionable').length,
        mild: injuries.filter(i => i.injuryStatus === 'Day-to-day').length
      };
      
      const statusBreakdown = {
        out: injuries.filter(i => i.injuryStatus === 'Out').length,
        questionable: injuries.filter(i => i.injuryStatus === 'Questionable').length,
        doubtful: injuries.filter(i => i.injuryStatus === 'Doubtful').length,
        day_to_day: injuries.filter(i => i.injuryStatus === 'Day-to-day').length,
        probable: injuries.filter(i => i.injuryStatus === 'Probable').length
      };
      
      const teamInjuries: Record<string, number> = {};
      injuries.forEach(i => {
        teamInjuries[i.team] = (teamInjuries[i.team] || 0) + 1;
      });
      
      setInjuryDashboard({
        total_injuries: injuries.length,
        severity_breakdown: severityBreakdown,
        status_breakdown: statusBreakdown,
        top_injured_teams: Object.entries(teamInjuries).sort((a, b) => b[1] - a[1]).slice(0, 5),
        injuries: injuries.slice(0, 15).map(i => ({
          player: i.playerName,
          team: i.team,
          status: i.injuryStatus || 'Unknown',
          injury: i.line,
          expected_return: i.expectedReturn || 'TBD'
        }))
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============= SEARCH HANDLER =============
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        const filtered = processedNews.filter(item => 
          item.playerName.toLowerCase().includes(value.toLowerCase()) ||
          item.team?.toLowerCase().includes(value.toLowerCase()) ||
          item.author?.toLowerCase().includes(value.toLowerCase()) ||
          item.line?.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 10);
        setSearchResults(filtered);
        if (filtered.length > 0) {
          setShowSearchResultsModal(true);
        }
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setSearchResults([]);
    setShowSearchResultsModal(false);
  };

  // ============= FILTERED NEWS =============
  const filteredNews = useMemo(() => {
    if (!processedNews.length) return [];

    let filtered = [...processedNews];
    
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'injuries' || selectedCategory === 'injury') {
        filtered = filtered.filter(item => item.category === 'injury');
      } else if (selectedCategory === 'beat-writers' || selectedCategory === 'beatwriter') {
        filtered = filtered.filter(item => item.isBeatWriter === true);
      } else if (selectedCategory === 'NBA' || selectedCategory === 'NFL' || selectedCategory === 'MLB' || selectedCategory === 'NHL') {
        filtered = filtered.filter(item => item.sport === selectedCategory);
      } else if (selectedCategory === 'value') {
        filtered = filtered.filter(item => item.confidence > 80);
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.playerName.toLowerCase().includes(query) ||
        item.team.toLowerCase().includes(query) ||
        item.line.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [processedNews, selectedCategory, searchQuery]);

  // ============= EVENT HANDLERS =============
  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
    setSearchQuery('');
    setSelectedTeam('');
    setSelectedCategory('all');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData().finally(() => {
      setRefreshing(false);
    });
  };

  const handleBookmark = (id: string | number) => {
    setBookmarked(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleShare = (prop: PlayerProp) => {
    const shareText = `${prop.playerName}: ${prop.line}`;
    if (navigator.share) {
      navigator.share({
        title: prop.playerName,
        text: shareText,
        url: prop.url || window.location.href,
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        setErrorMessage('Link copied to clipboard');
        setShowErrorSnackbar(true);
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setErrorMessage('Link copied to clipboard');
      setShowErrorSnackbar(true);
    }
  };

  const fetchTeamNews = (team: string) => {
    const filtered = processedNews.filter(item => 
      item.team?.toLowerCase() === team.toLowerCase()
    );
    setTeamNews(filtered.length ? filtered : []);
    setShowTeamNewsModal(true);
  };

  const fetchInjuryDashboard = () => {
    setShowInjuryDashboardModal(true);
  };

  // ============= RENDER FUNCTIONS =============
  const renderInjuryCard = (prop: PlayerProp) => {
    const status = prop.injuryStatus || normalizeInjuryStatus(prop.rawInjuryStatus);
    const statusColor = getInjuryStatusColor(status);
    const statusLabel = getInjuryStatusLabel(status);
    
    const searchUrl = prop.playerName 
      ? `https://www.google.com/search?q=${encodeURIComponent(prop.playerName + ' ' + (prop.team || '') + ' injury update')}`
      : '#';
    
    return (
      <Card 
        key={prop.id} 
        sx={{ 
          mb: 2,
          borderLeft: `6px solid ${statusColor}`,
          bgcolor: '#fff1f0',
          '&:hover': { bgcolor: '#ffe4e2' }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<LocalHospital />}
                label={statusLabel}
                size="small"
                sx={{ 
                  bgcolor: statusColor,
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Chip 
                label={prop.sport}
                size="small"
                sx={{ 
                  bgcolor: `${SPORT_COLORS[prop.sport] || '#3b82f6'}20`,
                  color: SPORT_COLORS[prop.sport] || '#3b82f6',
                  fontWeight: 'bold'
                }}
              />
              {prop.team && (
                <Chip 
                  label={prop.team}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: statusColor, color: statusColor }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {prop.time}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{ bgcolor: statusColor, width: 48, height: 48 }}>
              <Healing />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {prop.playerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {prop.team} • {prop.sport}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                {prop.line}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {prop.matchup}
              </Typography>
              
              {prop.expectedReturn && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MedicalServices sx={{ fontSize: 16, color: '#3b82f6' }} />
                  <Typography variant="body2" color="#3b82f6">
                    Expected return: {prop.expectedReturn}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => window.open(searchUrl, '_blank')}
              sx={{ 
                bgcolor: statusColor,
                '&:hover': { bgcolor: statusColor, filter: 'brightness(0.9)' }
              }}
              startIcon={<Search />}
            >
              View Injury Details
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <IconButton size="small" onClick={() => handleShare(prop)}>
                <Share sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" onClick={() => handleBookmark(prop.id)}>
                {bookmarked.includes(prop.id) ? (
                  <Bookmark sx={{ fontSize: 18, color: statusColor }} />
                ) : (
                  <BookmarkBorder sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderBeatWriterCard = (prop: PlayerProp) => {
    return (
      <Card 
        key={prop.id} 
        sx={{ 
          mb: 2,
          borderLeft: '6px solid #8b5cf6',
          bgcolor: '#f5f3ff',
          '&:hover': { bgcolor: '#ede9fe' }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Twitter />}
                label={prop.author || prop.outlet || 'Beat Writer'}
                size="small"
                sx={{ 
                  bgcolor: '#8b5cf6',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Chip 
                label={prop.sport}
                size="small"
                sx={{ 
                  bgcolor: `${SPORT_COLORS[prop.sport] || '#3b82f6'}20`,
                  color: SPORT_COLORS[prop.sport] || '#3b82f6',
                  fontWeight: 'bold'
                }}
              />
              {prop.twitter && (
                <Chip 
                  icon={<Twitter />}
                  label={prop.twitter}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {prop.time}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#8b5cf6', width: 48, height: 48 }}>
              {prop.author?.charAt(0) || prop.outlet?.charAt(0) || 'BW'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {prop.playerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {prop.team} • {prop.author || prop.outlet || 'Beat Writer'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                {prop.line}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {prop.matchup}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => window.open(prop.url || `https://www.google.com/search?q=${encodeURIComponent(prop.playerName + ' ' + prop.team + ' news')}`, '_blank')}
              sx={{ 
                bgcolor: '#8b5cf6',
                '&:hover': { bgcolor: '#7c3aed' }
              }}
              startIcon={<Article />}
            >
              Read Full Article
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <IconButton size="small" onClick={() => handleShare(prop)}>
                <Share sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" onClick={() => handleBookmark(prop.id)}>
                {bookmarked.includes(prop.id) ? (
                  <Bookmark sx={{ fontSize: 18, color: '#8b5cf6' }} />
                ) : (
                  <BookmarkBorder sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderNewsCard = (prop: PlayerProp) => {
    if (prop.isBeatWriter) return renderBeatWriterCard(prop);
    if (prop.category === 'injury') return renderInjuryCard(prop);
    
    const sportColor = SPORT_COLORS[prop.sport] || theme.palette.primary.main;
    const isBookmarked = bookmarked.includes(prop.id);
    const categoryColor = CATEGORY_COLORS[prop.category || 'news'] || '#6b7280';
    
    return (
      <Card key={prop.id} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={prop.category || 'News'}
                size="small"
                sx={{ 
                  bgcolor: categoryColor,
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}
              />
              <Chip 
                label={prop.sport}
                size="small"
                sx={{ 
                  bgcolor: `${sportColor}20`,
                  color: sportColor,
                  fontWeight: 'bold'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {prop.time}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 2 }}>
            {prop.image && (
              <CardMedia
                component="img"
                image={prop.image}
                alt={prop.playerName}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: 2, 
                  objectFit: 'cover',
                  display: { xs: 'none', sm: 'block' }
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {prop.playerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {prop.team} • {prop.sport}
              </Typography>
              <Typography variant="body1" paragraph sx={{ fontWeight: 500 }}>
                {prop.line}
              </Typography>
            </Box>
          </Box>
          
          {prop.matchup && (
            <Box sx={{ mb: 2, bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {prop.matchup}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {prop.url && prop.url !== '#' && (
              <Button 
                variant="contained" 
                size="small"
                onClick={() => window.open(prop.url, '_blank')}
                sx={{ 
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' }
                }}
              >
                Read Full Story
              </Button>
            )}
            
            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
              <IconButton size="small" onClick={() => handleShare(prop)}>
                <Share sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton size="small" onClick={() => handleBookmark(prop.id)}>
                {isBookmarked ? (
                  <Bookmark sx={{ fontSize: 18, color: '#3b82f6' }} />
                ) : (
                  <BookmarkBorder sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // ============= MODAL COMPONENTS =============
  const TeamNewsModal = () => (
    <Dialog open={showTeamNewsModal} onClose={() => setShowTeamNewsModal(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TeamIcon />
        {selectedTeam} News
        <IconButton onClick={() => setShowTeamNewsModal(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {teamNews.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Latest updates from {selectedTeam}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {teamNews.map(news => renderNewsCard(news))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Sports sx={{ fontSize: 60, color: '#3b82f6', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No news for {selectedTeam}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for updates
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  const InjuryDashboardModal = () => (
    <Dialog open={showInjuryDashboardModal} onClose={() => setShowInjuryDashboardModal(false)} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ bgcolor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timeline />
        Injury Dashboard - {selectedSport.toUpperCase()}
        <IconButton onClick={() => setShowInjuryDashboardModal(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {injuryDashboard ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: '#f8fafc' }}>
                <Typography variant="h6" gutterBottom>📊 Injury Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="#ef4444" fontWeight="bold">{injuryDashboard.total_injuries}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Injuries</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="#f59e0b" fontWeight="bold">{injuryDashboard.severity_breakdown?.severe || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Severe Injuries</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="#10b981" fontWeight="bold">{injuryDashboard.status_breakdown?.day_to_day || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Day-to-Day</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Top Injured Teams</Typography>
                <List>
                  {injuryDashboard.top_injured_teams?.map(([team, count]: [string, number]) => (
                    <ListItem key={team}>
                      <ListItemText primary={team} secondary={`${count} injured player${count !== 1 ? 's' : ''}`} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>All Injuries</Typography>
                <List dense>
                  {injuryDashboard.injuries?.map((injury: any, idx: number) => (
                    <ListItem key={idx} divider>
                      <ListItemText 
                        primary={injury.player}
                        secondary={`${injury.team} - ${getInjuryStatusLabel(injury.status)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading injury dashboard...</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setShowInjuryDashboardModal(false); setSelectedCategory('injuries'); }} sx={{ color: '#ef4444' }}>View All Injuries</Button>
        <Button onClick={() => setShowInjuryDashboardModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const InjuryModal = () => (
    <Dialog open={showInjuryModal} onClose={() => setShowInjuryModal(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalHospital />
        Injury Report - {selectedSport.toUpperCase()}
        <IconButton onClick={() => setShowInjuryModal(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {injuryNews.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {injuryNews.length} Active Injury {injuryNews.length === 1 ? 'Update' : 'Updates'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {injuryNews.map(injury => renderInjuryCard(injury))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <MonitorHeart sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No Current Injuries</Typography>
            <Typography variant="body2" color="text.secondary">
              All {selectedSport.toUpperCase()} players are healthy
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setShowInjuryModal(false); fetchInjuryDashboard(); }} sx={{ color: '#ef4444' }}>
          View Dashboard
        </Button>
        <Button onClick={() => setShowInjuryModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const BeatWritersModal = () => (
    <Dialog open={showBeatWritersModal} onClose={() => setShowBeatWritersModal(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Twitter />
        Beat Writers & Insiders
        <Box sx={{ flex: 1 }} />
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
          <Select value={selectedTeam} displayEmpty onChange={(e) => { setSelectedTeam(e.target.value); if (e.target.value) fetchTeamNews(e.target.value); }} sx={{ color: 'white' }}>
            <MenuItem value="">All Teams</MenuItem>
            {teams.map(team => <MenuItem key={team} value={team}>{team}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton onClick={() => setShowBeatWritersModal(false)} sx={{ color: 'white' }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {beatWriterNews.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {beatWriterNews.length} Updates from Beat Writers {selectedTeam && ` • ${selectedTeam}`}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {beatWriterNews.filter(item => !selectedTeam || item.team === selectedTeam).map(writer => renderBeatWriterCard(writer))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Twitter sx={{ fontSize: 60, color: '#8b5cf6', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No Beat Writer Updates</Typography>
            <Typography variant="body2" color="text.secondary">Check back later for the latest insider news</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setShowBeatWritersModal(false); setSelectedCategory('beat-writers'); }} sx={{ color: '#8b5cf6' }}>View All Beat News</Button>
        <Button onClick={() => setShowBeatWritersModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const SearchResultsModal = () => (
    <Dialog open={showSearchResultsModal} onClose={() => setShowSearchResultsModal(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon />
        Search Results: "{searchQuery}"
        <IconButton onClick={() => setShowSearchResultsModal(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {searchResults.length > 0 ? (
          <List>
            {searchResults.map((result, index) => (
              <ListItem 
                key={index} 
                divider 
                button
                onClick={() => {
                  setShowSearchResultsModal(false);
                  // Scroll to or highlight the selected item
                  const element = document.getElementById(`news-${result.id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: result.isBeatWriter ? '#8b5cf6' : result.category === 'injury' ? '#ef4444' : '#3b82f6' }}>
                    {result.isBeatWriter ? <Twitter /> : result.category === 'injury' ? <LocalHospital /> : <Person />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={result.playerName}
                  secondary={
                    <>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {result.team} • {result.sport}
                      </Typography>
                      {result.injuryStatus && (
                        <Chip 
                          label={getInjuryStatusLabel(result.injuryStatus)} 
                          size="small" 
                          sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} 
                        />
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SearchIcon sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No results found</Typography>
            <Typography variant="body2" color="text.secondary">Try searching for a player, team, or beat writer</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  const AnalyticsDashboardModal = () => (
    <Dialog open={showAnalyticsModal} onClose={() => setShowAnalyticsModal(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Analytics />
        SportsWire Analytics Dashboard
        <IconButton onClick={() => setShowAnalyticsModal(false)} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h4" fontWeight="bold">{processedNews.length}</Typography><Typography variant="caption">Total News</Typography></Paper></Grid>
          <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff1f0' }}><Typography variant="h4" fontWeight="bold" color="#ef4444">{injuryNews.length}</Typography><Typography variant="caption">Injuries</Typography></Paper></Grid>
          <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f3ff' }}><Typography variant="h4" fontWeight="bold" color="#8b5cf6">{beatWriterNews.length}</Typography><Typography variant="caption">Beat Writers</Typography></Paper></Grid>
          <Grid item xs={6} sm={3}><Paper sx={{ p: 2, textAlign: 'center' }}><Typography variant="h4" fontWeight="bold">{bookmarked.length}</Typography><Typography variant="caption">Bookmarks</Typography></Paper></Grid>
        </Grid>
        
        {usingMockData && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Using mock data - API connection failed
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Category Breakdown</Typography>
        <Grid container spacing={1}>
          {Object.entries(processedNews.reduce((acc: Record<string, number>, item) => { const cat = item.category || 'other'; acc[cat] = (acc[cat] || 0) + 1; return acc; }, {})).map(([category, count]) => (
            <Grid item xs={6} sm={4} md={3} key={category}>
              <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="caption" display="block" fontWeight="bold">{category.toUpperCase()}</Typography>
                <Typography variant="h6" sx={{ color: CATEGORY_COLORS[category] || '#6b7280' }}>{count}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions><Button onClick={() => setShowAnalyticsModal(false)}>Close</Button></DialogActions>
    </Dialog>
  );

  // ============= LOADING STATE =============
  if (loading && processedNews.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 3 }} variant="h6">Loading {selectedSport.toUpperCase()} news...</Typography>
          <Typography sx={{ mt: 1 }} variant="body2" color="text.secondary">
            Fetching latest updates from {API_BASE_URL}
          </Typography>
        </Box>
      </Container>
    );
  }

  // ============= MAIN RENDER =============
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Error Snackbar */}
      <Snackbar
        open={showErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowErrorSnackbar(false)} severity={usingMockData ? "warning" : "info"} sx={{ width: '100%' }}>
          {errorMessage || (usingMockData ? "Using mock data - API connection issue" : "Ready")}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Paper sx={{ mb: 3, background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}><ArrowBack /></IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">SportsWire</Typography>
              <Typography variant="body1">Latest {selectedSport.toUpperCase()} news and updates</Typography>
              {usingMockData && (
                <Chip 
                  icon={<ErrorIcon />}
                  label="Using Mock Data" 
                  size="small" 
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {teams.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200, mr: 1 }}>
                  <Select 
                    value={selectedTeam} 
                    displayEmpty 
                    onChange={(e) => { 
                      setSelectedTeam(e.target.value); 
                      if (e.target.value) fetchTeamNews(e.target.value); 
                    }} 
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    <MenuItem value="">Select Team</MenuItem>
                    {teams.map(team => <MenuItem key={team} value={team}>{team}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
              <IconButton onClick={fetchInjuryDashboard} sx={{ color: 'white', bgcolor: 'rgba(239,68,68,0.3)' }}><Timeline /></IconButton>
              <Badge badgeContent={beatWriterNews.length} color="secondary">
                <IconButton onClick={() => setShowBeatWritersModal(true)} sx={{ color: 'white', bgcolor: 'rgba(139,92,246,0.3)' }}><Twitter /></IconButton>
              </Badge>
              <Badge badgeContent={injuryNews.length} color="error">
                <IconButton onClick={() => setShowInjuryModal(true)} sx={{ color: 'white', bgcolor: 'rgba(239,68,68,0.3)' }}><LocalHospital /></IconButton>
              </Badge>
              <IconButton onClick={handleRefresh} disabled={refreshing} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                <UpdateIcon />
              </IconButton>
            </Box>
          </Box>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <InputLabel sx={{ color: 'white' }}>Sport</InputLabel>
                <Select 
                  value={selectedSport} 
                  label="Sport" 
                  onChange={handleSportChange} 
                  sx={{ 
                    color: 'white', 
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }, 
                    '& .MuiSvgIcon-root': { color: 'white' } 
                  }}
                >
                  <MenuItem value="nba">NBA</MenuItem>
                  <MenuItem value="nfl">NFL</MenuItem>
                  <MenuItem value="mlb">MLB</MenuItem>
                  <MenuItem value="nhl">NHL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button fullWidth startIcon={<Analytics />} onClick={() => setShowAnalyticsModal(true)} sx={{ color: 'white', borderColor: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }} variant="outlined">Analytics</Button>
                <Button fullWidth startIcon={<Twitter />} onClick={() => setShowBeatWritersModal(true)} sx={{ color: 'white', borderColor: '#8b5cf6', bgcolor: 'rgba(139,92,246,0.2)', '&:hover': { bgcolor: 'rgba(139,92,246,0.3)' } }} variant="outlined">Beat Writers ({beatWriterNews.length})</Button>
                <Button fullWidth startIcon={<LocalHospital />} onClick={() => setShowInjuryModal(true)} sx={{ color: 'white', borderColor: '#ef4444', bgcolor: 'rgba(239,68,68,0.2)', '&:hover': { bgcolor: 'rgba(239,68,68,0.3)' } }} variant="outlined">Injuries ({injuryNews.length})</Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField 
          fullWidth 
          variant="outlined" 
          placeholder="Search players, teams, beat writers, or news..." 
          defaultValue={searchQuery} 
          onChange={handleSearchChange} 
          inputRef={searchInputRef} 
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            endAdornment: <InputAdornment position="end">
              {isSearching && <CircularProgress size={20} sx={{ mr: 1 }} />}
              {searchQuery && <IconButton onClick={handleClearSearch} size="small"><Close /></IconButton>}
            </InputAdornment>
          }} 
        />
      </Paper>

      {/* Category Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={selectedCategory} 
          onChange={(e, newValue) => setSelectedCategory(newValue)} 
          variant="scrollable" 
          scrollButtons="auto" 
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Tab value="all" label="All Sports" icon={<Bolt />} iconPosition="start" />
          <Tab value="NBA" label="NBA" icon={<SportsBasketball />} iconPosition="start" />
          <Tab value="NFL" label="NFL" icon={<SportsFootball />} iconPosition="start" />
          <Tab value="MLB" label="MLB" icon={<SportsBaseball />} iconPosition="start" />
          <Tab value="NHL" label="NHL" icon={<SportsHockey />} iconPosition="start" />
          <Tab value="beat-writers" label="Beat Writers" icon={<Twitter />} iconPosition="start" sx={{ color: '#8b5cf6' }} />
          <Tab value="injuries" label="Injuries" icon={<LocalHospital />} iconPosition="start" sx={{ color: '#ef4444' }} />
          <Tab value="value" label="High Value" icon={<ShowChart />} iconPosition="start" />
        </Tabs>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight="bold">{filteredNews.length} {filteredNews.length === 1 ? 'item' : 'items'}</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Badge badgeContent={beatWriterNews.length} color="secondary"><Twitter sx={{ color: '#8b5cf6', cursor: 'pointer' }} onClick={() => setShowBeatWritersModal(true)} /></Badge>
            <Badge badgeContent={injuryNews.length} color="error"><LocalHospital sx={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => setShowInjuryModal(true)} /></Badge>
            <Badge badgeContent={teams.length} color="info"><TeamIcon sx={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => teams.length > 0 && fetchTeamNews(teams[0])} /></Badge>
          </Box>
        </Box>
      </Paper>

      {/* Alert Banners */}
      {beatWriterNews.length > 0 && selectedCategory !== 'beat-writers' && (
        <Alert severity="info" sx={{ mb: 3, bgcolor: '#f5f3ff', color: '#8b5cf6' }} icon={<Twitter />} action={<Button color="inherit" size="small" onClick={() => setSelectedCategory('beat-writers')}>View {beatWriterNews.length} Beat Writer {beatWriterNews.length === 1 ? 'Update' : 'Updates'}</Button>}>
          <Typography variant="body2" fontWeight="bold">✍️ {beatWriterNews.length} {beatWriterNews.length === 1 ? 'Update' : 'Updates'} from Beat Writers & Insiders</Typography>
        </Alert>
      )}
      {injuryNews.length > 0 && selectedCategory !== 'injuries' && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => setSelectedCategory('injuries')}>View {injuryNews.length} Injury {injuryNews.length === 1 ? 'Update' : 'Updates'}</Button>}>
          <Typography variant="body2" fontWeight="bold">🏥 {injuryNews.length} Active {injuryNews.length === 1 ? 'Injury' : 'Injuries'} Reported</Typography>
        </Alert>
      )}

      {/* News Feed */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}
      {filteredNews.length > 0 ? (
        filteredNews.map(item => (
          <div key={item.id} id={`news-${item.id}`}>
            {renderNewsCard(item)}
          </div>
        ))
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Newspaper sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No news found</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? `No results for "${searchQuery}"` : `No ${selectedCategory === 'all' ? 'news' : selectedCategory} available`}
          </Typography>
          <Button variant="contained" onClick={handleRefresh} startIcon={<UpdateIcon />}>
            Refresh
          </Button>
        </Paper>
      )}

      {/* Modals */}
      <BeatWritersModal />
      <InjuryDashboardModal />
      <InjuryModal />
      <TeamNewsModal />
      <SearchResultsModal />
      <AnalyticsDashboardModal />
    </Container>
  );
};

export default SportsWireScreen;
