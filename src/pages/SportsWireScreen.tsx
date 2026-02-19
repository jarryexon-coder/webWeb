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
  ListItemAvatar
} from '@mui/material';
import {
  ArrowBack,
  Search,
  TrendingUp,
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
  Notifications,
  Close,
  AutoAwesome as SparklesIcon,
  Bolt,
  Update as UpdateIcon,
  Error as ErrorIcon,
  MedicalServices,
  LocalHospital,
  Healing,
  MonitorHeart,
  Twitter,
  Article,
  Instagram,
  Facebook,
  Videocam,
  Stadium,
  CalendarToday,
  Scoreboard,
  EmojiEvents,
  Groups as TeamIcon,
  Search as SearchIcon,
  Timeline,
  Insights,
  Sports,
  FitnessCenter,
  PersonAdd,
  TrendingFlat,
  Speed,
  Warning,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

// ============= CONFIGURATION =============
const API_BASE_URL = 'https://python-api-fresh-production.up.railway.app';
console.log('🎯 API Base URL:', API_BASE_URL);

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
  'beatwriter': '#8b5cf6',
  'team-news': '#3b82f6',
  'game-preview': '#f59e0b',
  'recap': '#6b7280',
  'interview': '#ec4899',
  'analysis': '#14b8a6',
  'news': '#6b7280'
};

const INJURY_STATUS_COLORS: Record<string, string> = {
  'out': '#ef4444',
  'questionable': '#f59e0b',
  'doubtful': '#f97316',
  'day-to-day': '#3b82f6',
  'probable': '#10b981',
  'healthy': '#6b7280'
};

const BEAT_WRITER_SOURCES = [
  'The Athletic',
  'ESPN',
  'Bleacher Report',
  'The Ringer',
  'Local Reporter',
  'Team Reporter',
  'Beat Writer',
  'Insider',
  'Shams Charania',
  'Adrian Wojnarowski',
  'Chris Haynes',
  'Marc Stein',
  'Brian Windhorst',
  'Zach Lowe',
  'Tim Bontemps',
  'Ramona Shelburne',
  'Dave McMenamin',
  'Mike Vorkunov',
  'James Edwards III',
  'Tony Jones',
  'Jake Fischer'
];

// Static team lists for fallback
const STATIC_TEAMS: Record<string, string[]> = {
  nba: ['Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Bucks', 'Suns', 'Nuggets', 'Mavericks', '76ers'],
  nfl: ['Chiefs', '49ers', 'Cowboys', 'Packers', 'Ravens', 'Bills', 'Eagles', 'Bengals'],
  mlb: ['Yankees', 'Dodgers', 'Red Sox', 'Astros', 'Braves', 'Mets', 'Cardinals'],
  nhl: ['Maple Leafs', 'Oilers', 'Avalanche', 'Bruins', 'Lightning', 'Golden Knights']
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
  gameInfo?: {
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    status: string;
    time: string;
    venue?: string;
  };
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
  expectedReturn?: string;
  isBeatWriter?: boolean;
  author?: string;
  gameInfo?: NewsArticle['gameInfo'];
  originalArticle: NewsArticle;
}

// ============= API CLIENT =============
const apiClient = {
  async get(endpoint: string) {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`🌐 Fetching: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  async searchAllTeams(query: string, sport: string) {
    return this.get(`/api/search/all-teams?q=${encodeURIComponent(query)}&sport=${sport.toLowerCase()}`);
  },
  
  async getTeamNews(team: string, sport: string) {
    return this.get(`/api/team/news?team=${encodeURIComponent(team)}&sport=${sport.toLowerCase()}`);
  },
  
  async getInjuryDashboard(sport: string) {
    return this.get(`/api/injuries/dashboard?sport=${sport.toLowerCase()}`);
  },
  
  async getBeatWriterNews(sport: string, team?: string) {
    let endpoint = `/api/beat-writer-news?sport=${sport.toLowerCase()}`;
    if (team) {
      endpoint += `&team=${encodeURIComponent(team)}`;
    }
    return this.get(endpoint);
  },
  
  async getEnhancedSportsWire(sport: string, includeBeatWriters = true, includeInjuries = true) {
    return this.get(`/api/sports-wire/enhanced?sport=${sport.toLowerCase()}&include_beat_writers=${includeBeatWriters}&include_injuries=${includeInjuries}`);
  }
};

// ============= MOCK DATA GENERATOR =============
const generateMockNews = (sport: string, count = 20): PlayerProp[] => {
  const sportUpper = sport.toUpperCase();
  const mockNews: PlayerProp[] = [];
  const now = new Date();
  
  const players = {
    nba: ['LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo', 'Kevin Durant', 'Luka Dončić', 'Jayson Tatum', 'Joel Embiid', 'Nikola Jokić'],
    nfl: ['Patrick Mahomes', 'Josh Allen', 'Justin Jefferson', 'Travis Kelce', 'Christian McCaffrey', 'Jalen Hurts', 'Tyreek Hill'],
    mlb: ['Shohei Ohtani', 'Aaron Judge', 'Mookie Betts', 'Ronald Acuña Jr.', 'Mike Trout', 'Bryce Harper'],
    nhl: ['Connor McDavid', 'Auston Matthews', 'Nathan MacKinnon', 'David Pastrňák', 'Leon Draisaitl', 'Cale Makar']
  };
  
  const categories = ['news', 'injury', 'beat-writers', 'game-preview', 'analysis', 'performance'];
  const injuries = ['out', 'questionable', 'day-to-day', 'probable'];
  const teamsBySport: Record<string, string[]> = {
    nba: ['LAL', 'GSW', 'MIL', 'PHX', 'DAL', 'BOS', 'PHI', 'DEN'],
    nfl: ['KC', 'BUF', 'SF', 'DAL', 'BAL', 'CIN'],
    mlb: ['NYY', 'LAD', 'HOU', 'ATL', 'BOS'],
    nhl: ['TOR', 'EDM', 'COL', 'BOS', 'TBL']
  };
  
  const sportPlayers = players[sport as keyof typeof players] || [`${sportUpper} Player`];
  const sportTeams = teamsBySport[sport as keyof typeof teamsBySport] || ['TEAM'];
  
  for (let i = 0; i < count; i++) {
    const player = sportPlayers[Math.floor(Math.random() * sportPlayers.length)];
    const team = sportTeams[Math.floor(Math.random() * sportTeams.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const isBeatWriter = category === 'beat-writers' || Math.random() > 0.7;
    const isInjury = category === 'injury' || (Math.random() > 0.8 && !isBeatWriter);
    
    let title = '';
    let description = '';
    let injuryStatus = undefined;
    let expectedReturn = undefined;
    
    if (isInjury) {
      const status = injuries[Math.floor(Math.random() * injuries.length)];
      injuryStatus = status;
      if (status === 'out') expectedReturn = '2-3 weeks';
      else if (status === 'day-to-day') expectedReturn = 'day-to-day';
      else if (status === 'questionable') expectedReturn = 'game-time decision';
      title = `${player} Injury Update: ${status.toUpperCase()}`;
      description = `${player} is ${status} with a minor injury. ${
        status === 'out' ? 'Expected to miss several games.' : 
        status === 'day-to-day' ? 'Will be evaluated before next game.' :
        'Game-time decision.'
      }`;
    } else if (isBeatWriter) {
      const sources = BEAT_WRITER_SOURCES;
      const source = sources[Math.floor(Math.random() * sources.length)];
      title = `${player} - Exclusive: ${source} reports on team dynamics`;
      description = `According to ${source}, ${player} is expected to have a breakout performance this week.`;
    } else {
      const verbs = ['shines', 'struggles', 'dominates', 'sits out', 'prepares for', 'talks about'];
      const verb = verbs[Math.floor(Math.random() * verbs.length)];
      title = `${player} ${verb} in latest ${sportUpper} action`;
      description = `${player} of the ${team} had a noteworthy performance. Fans are excited.`;
    }
    
    const timeAgo = Math.floor(Math.random() * 120); // minutes ago
    const publishedAt = new Date(now.getTime() - timeAgo * 60000).toISOString();
    let timeDisplay = '';
    try {
      timeDisplay = formatDistanceToNow(new Date(publishedAt), { addSuffix: true });
    } catch {
      timeDisplay = 'Recently';
    }
    
    mockNews.push({
      id: `mock-${sport}-${i}-${Date.now()}`,
      playerName: player,
      team,
      sport: sportUpper,
      propType: isInjury ? 'Injury Update' : isBeatWriter ? 'Beat Writer' : 'News',
      line: title,
      odds: '+100',
      impliedProbability: 65,
      matchup: description,
      time: timeDisplay,
      confidence: isInjury ? 85 : isBeatWriter ? 88 : 75,
      isBookmarked: false,
      category: isInjury ? 'injury' : isBeatWriter ? 'beat-writers' : 'news',
      url: '#',
      image: `https://picsum.photos/400/300?random=${i}&sport=${sport}`,
      injuryStatus,
      expectedReturn,
      isBeatWriter,
      author: isBeatWriter ? BEAT_WRITER_SOURCES[Math.floor(Math.random() * BEAT_WRITER_SOURCES.length)] : undefined,
      originalArticle: {
        id: `mock-article-${i}`,
        title,
        description,
        source: { name: isBeatWriter ? BEAT_WRITER_SOURCES[Math.floor(Math.random() * BEAT_WRITER_SOURCES.length)] : 'Sports Wire' },
        publishedAt,
        category: isInjury ? 'injury' : isBeatWriter ? 'beat-writers' : 'news',
        sport: sportUpper,
        player,
        team
      }
    });
  }
  
  return mockNews.sort((a, b) => new Date(b.originalArticle.publishedAt).getTime() - new Date(a.originalArticle.publishedAt).getTime());
};

// ============= MAIN COMPONENT =============
const SportsWireScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb' | 'nhl'>('nba');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [showInjuryDashboardModal, setShowInjuryDashboardModal] = useState(false);
  const [showBeatWritersModal, setShowBeatWritersModal] = useState(false);
  const [showTeamNewsModal, setShowTeamNewsModal] = useState(false);
  const [showSearchResultsModal, setShowSearchResultsModal] = useState(false);
  const [bookmarked, setBookmarked] = useState<(string | number)[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [processedNews, setProcessedNews] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [injuryNews, setInjuryNews] = useState<PlayerProp[]>([]);
  const [beatWriterNews, setBeatWriterNews] = useState<PlayerProp[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamNews, setTeamNews] = useState<PlayerProp[]>([]);
  const [injuryDashboard, setInjuryDashboard] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // ============= FETCH TEAMS =============
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Use lowercase sport for API call
        const response = await apiClient.get(`/api/beat-writers?sport=${selectedSport.toLowerCase()}`);
        if (response.success) {
          setTeams(Object.keys(response.beat_writers || {}));
        } else {
          // If API returns success false, fallback to static teams
          setTeams(STATIC_TEAMS[selectedSport] || []);
        }
      } catch (error) {
        console.error('Failed to fetch teams, using static list:', error);
        // Fallback to static teams
        setTeams(STATIC_TEAMS[selectedSport] || []);
      }
    };
    
    fetchTeams();
  }, [selectedSport]);

  // ============= FETCH NEWS =============
  const fetchNews = useCallback(async (sport: string = selectedSport) => {
    setLoading(true);
    setError(null);
    
    try {
      // First try enhanced endpoint
      const data = await apiClient.getEnhancedSportsWire(sport, true, true);
      console.log(`📥 Received ${data.news?.length || 0} enhanced news items`);
      console.log('📊 Breakdown:', data.breakdown);
      
      if (data.success && data.news) {
        const transformed = transformNewsToProps(data.news, sport);
        setProcessedNews(transformed);
        
        const injuries = transformed.filter(item => 
          (item.category?.toLowerCase().includes('injury') || 
           item.category?.toLowerCase() === 'injuries' ||
           item.injuryStatus) && 
          !item.isBeatWriter
        );
        setInjuryNews(injuries);
        
        const beatWriters = transformed.filter(item => 
          item.isBeatWriter || 
          item.category?.toLowerCase().includes('beat')
        );
        setBeatWriterNews(beatWriters);
        
        console.log(`🏥 Found ${injuries.length} injury updates`);
        console.log(`✍️ Found ${beatWriters.length} beat writer updates`);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    } catch (err) {
      console.error('❌ Failed to fetch enhanced news, trying fallback:', err);
    }
    
    // Fallback to basic sports-wire
    try {
      const fallbackData = await apiClient.get(`/api/sports-wire?sport=${sport.toLowerCase()}`);
      if (fallbackData.success && fallbackData.news) {
        const transformed = transformNewsToProps(fallbackData.news, sport);
        setProcessedNews(transformed);
        
        const injuries = transformed.filter(item => 
          (item.category?.toLowerCase().includes('injury') || 
           item.category?.toLowerCase() === 'injuries' ||
           item.injuryStatus) && 
          !item.isBeatWriter
        );
        setInjuryNews(injuries);
        
        const beatWriters = transformed.filter(item => 
          item.isBeatWriter || 
          item.category?.toLowerCase().includes('beat')
        );
        setBeatWriterNews(beatWriters);
        
        console.log(`🏥 Found ${injuries.length} injury updates (fallback)`);
        console.log(`✍️ Found ${beatWriters.length} beat writer updates (fallback)`);
        setLoading(false);
        setRefreshing(false);
        return;
      }
    } catch (fallbackErr) {
      console.error('❌ Fallback also failed, using mock data:', fallbackErr);
    }
    
    // Ultimate fallback: generate mock news
    console.log('⚠️ Using mock news data');
    const mockNews = generateMockNews(sport, 25);
    setProcessedNews(mockNews);
    
    const injuries = mockNews.filter(item => 
      item.category === 'injury' || item.injuryStatus
    );
    setInjuryNews(injuries);
    
    const beatWriters = mockNews.filter(item => 
      item.isBeatWriter || item.category === 'beat-writers'
    );
    setBeatWriterNews(beatWriters);
    
    setLoading(false);
    setRefreshing(false);
  }, [selectedSport]);

  // Initial fetch
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // ============= FETCH TEAM NEWS =============
  const fetchTeamNews = async (team: string) => {
    try {
      const data = await apiClient.getTeamNews(team, selectedSport);
      if (data.success && data.news) {
        const transformed = transformNewsToProps(data.news, selectedSport);
        setTeamNews(transformed);
      } else {
        // Fallback: filter mock news by team
        const filtered = processedNews.filter(item => 
          item.team?.toLowerCase() === team.toLowerCase()
        );
        setTeamNews(filtered.length ? filtered : generateMockNews(selectedSport, 5).map(n => ({...n, team})));
      }
      setShowTeamNewsModal(true);
    } catch (error) {
      console.error('Failed to fetch team news, using filtered mock:', error);
      // Fallback: filter mock news by team
      const filtered = processedNews.filter(item => 
        item.team?.toLowerCase() === team.toLowerCase()
      );
      setTeamNews(filtered.length ? filtered : generateMockNews(selectedSport, 5).map(n => ({...n, team})));
      setShowTeamNewsModal(true);
    }
  };

  // ============= FETCH INJURY DASHBOARD =============
  const fetchInjuryDashboard = async () => {
    try {
      const data = await apiClient.getInjuryDashboard(selectedSport);
      if (data.success) {
        setInjuryDashboard(data);
      } else {
        // Create mock dashboard
        const mockInjuries = injuryNews.map(item => ({
          player: item.playerName,
          team: item.team,
          status: item.injuryStatus || 'unknown',
          injury: item.line,
          expected_return: item.expectedReturn || 'TBD'
        }));
        setInjuryDashboard({
          total_injuries: mockInjuries.length,
          severity_breakdown: {
            severe: mockInjuries.filter(i => i.status === 'out').length,
            moderate: mockInjuries.filter(i => i.status === 'questionable' || i.status === 'doubtful').length,
            mild: mockInjuries.filter(i => i.status === 'day-to-day' || i.status === 'probable').length
          },
          status_breakdown: {
            out: mockInjuries.filter(i => i.status === 'out').length,
            questionable: mockInjuries.filter(i => i.status === 'questionable').length,
            doubtful: mockInjuries.filter(i => i.status === 'doubtful').length,
            day_to_day: mockInjuries.filter(i => i.status === 'day-to-day').length,
            probable: mockInjuries.filter(i => i.status === 'probable').length
          },
          top_injured_teams: Object.entries(
            mockInjuries.reduce((acc: Record<string, number>, i) => {
              acc[i.team] = (acc[i.team] || 0) + 1;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1]).slice(0, 5),
          injury_type_breakdown: {
            'Knee': 3,
            'Ankle': 2,
            'Hamstring': 2,
            'Back': 1,
            'Shoulder': 1
          },
          injuries: mockInjuries.slice(0, 10)
        });
      }
      setShowInjuryDashboardModal(true);
    } catch (error) {
      console.error('Failed to fetch injury dashboard, using mock:', error);
      // Create mock dashboard from injuryNews
      const mockInjuries = injuryNews.map(item => ({
        player: item.playerName,
        team: item.team,
        status: item.injuryStatus || 'unknown',
        injury: item.line,
        expected_return: item.expectedReturn || 'TBD'
      }));
      setInjuryDashboard({
        total_injuries: mockInjuries.length,
        severity_breakdown: {
          severe: mockInjuries.filter(i => i.status === 'out').length,
          moderate: mockInjuries.filter(i => i.status === 'questionable' || i.status === 'doubtful').length,
          mild: mockInjuries.filter(i => i.status === 'day-to-day' || i.status === 'probable').length
        },
        status_breakdown: {
          out: mockInjuries.filter(i => i.status === 'out').length,
          questionable: mockInjuries.filter(i => i.status === 'questionable').length,
          doubtful: mockInjuries.filter(i => i.status === 'doubtful').length,
          day_to_day: mockInjuries.filter(i => i.status === 'day-to-day').length,
          probable: mockInjuries.filter(i => i.status === 'probable').length
        },
        top_injured_teams: Object.entries(
          mockInjuries.reduce((acc: Record<string, number>, i) => {
            acc[i.team] = (acc[i.team] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1]).slice(0, 5),
        injury_type_breakdown: {
          'Knee': 3,
          'Ankle': 2,
          'Hamstring': 2,
          'Back': 1,
          'Shoulder': 1
        },
        injuries: mockInjuries.slice(0, 10)
      });
      setShowInjuryDashboardModal(true);
    }
  };

  // ============= TRANSFORM NEWS =============
  const transformNewsToProps = (news: NewsArticle[], sport: string): PlayerProp[] => {
    return news.map((article, index) => {
      const title = article.title || 'Sports News';
      const description = article.description || article.content || '';
      const sourceName = typeof article.source === 'string' ? article.source : article.source?.name || 'Sports Wire';
      const publishedAt = article.publishedAt || new Date().toISOString();
      let category = article.category || 'news';
      const url = article.url || '#';
      const image = article.urlToImage || `https://picsum.photos/400/300?random=${index}&sport=${sport}`;
      
      const isBeatWriter = 
        article.beatWriter === true ||
        BEAT_WRITER_SOURCES.some(source => 
          sourceName.includes(source) || 
          title.includes(source) ||
          description.includes(source)
        ) ||
        title.toLowerCase().includes('beat writer') ||
        title.toLowerCase().includes('insider') ||
        title.toLowerCase().includes('sources say') ||
        title.toLowerCase().includes('report:') ||
        category === 'beat-writers' ||
        category === 'beatwriter';
      
      let playerName = article.player || '';
      let injuryStatus = article.injuryStatus || article.status || '';
      let expectedReturn = article.expectedReturn || '';
      
      if (!playerName && (category === 'injury' || title.toLowerCase().includes('injury'))) {
        const nameMatch = title.match(/([A-Z][a-z]+ [A-Z][a-z]+) (injured|out|questionable|update)/);
        if (nameMatch) playerName = nameMatch[1];
      }
      
      if (!injuryStatus && (category === 'injury' || title.toLowerCase().includes('injury'))) {
        const statusMatch = (title + ' ' + description).match(/\b(out|questionable|doubtful|day-to-day|probable|healthy)\b/i);
        if (statusMatch) {
          injuryStatus = statusMatch[1].toLowerCase();
        }
      }
      
      if (isBeatWriter && category === 'news') {
        category = 'beat-writers';
      }
      
      let confidence = article.confidence || 75;
      if (category === 'injury' || category === 'injuries') confidence = 85;
      if (injuryStatus === 'out') confidence = 90;
      if (injuryStatus === 'questionable') confidence = 80;
      if (isBeatWriter) confidence = 88;
      
      let timeDisplay = '';
      try {
        timeDisplay = formatDistanceToNow(new Date(publishedAt), { addSuffix: true });
      } catch {
        timeDisplay = 'Recently';
      }
      
      return {
        id: article.id || `news-${index}-${Date.now()}`,
        playerName: playerName || (isBeatWriter ? sourceName : extractDefaultName(title, index)),
        team: article.team || extractTeam(title) || '',
        sport: article.sport || sport.toUpperCase(),
        propType: category === 'injury' ? 'Injury Update' : 
                 isBeatWriter ? 'Beat Writer' : 
                 category === 'game-preview' ? 'Game Preview' : 'News',
        line: title,
        odds: '+100',
        impliedProbability: 65,
        matchup: description,
        time: timeDisplay,
        confidence,
        isBookmarked: false,
        aiInsights: description ? [description.substring(0, 200)] : undefined,
        category,
        url,
        image,
        injuryStatus: category === 'injury' ? injuryStatus : undefined,
        expectedReturn,
        isBeatWriter,
        author: article.author || (isBeatWriter ? sourceName : undefined),
        gameInfo: article.gameInfo,
        originalArticle: article
      };
    });
  };

  // Helper functions
  const extractDefaultName = (title: string, index: number): string => {
    const nameMatch = title.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    return nameMatch ? nameMatch[1] : `News Update ${index + 1}`;
  };

  const extractTeam = (title: string): string | null => {
    const teams = ['Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Bucks', 'Suns', 'Nuggets', 
                   'Chiefs', '49ers', 'Cowboys', 'Packers', 'Yankees', 'Dodgers', 'Red Sox'];
    for (const team of teams) {
      if (title.includes(team)) return team;
    }
    return null;
  };

  // ============= SEARCH HANDLER =============
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await apiClient.searchAllTeams(value, selectedSport);
          setSearchResults(results.results || []);
          
          if (results.count > 0) {
            setShowSearchResultsModal(true);
          }
          
          console.log(`🔍 Found ${results.count} results for "${value}"`);
        } catch (error) {
          console.error('Search failed, using filtered news:', error);
          // Fallback: filter processedNews
          const filtered = processedNews.filter(item => 
            item.playerName.toLowerCase().includes(value.toLowerCase()) ||
            item.team?.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 10);
          setSearchResults(filtered.map(item => ({
            type: 'player',
            player: item.playerName,
            team: item.team,
            sport: item.sport
          })));
          if (filtered.length > 0) {
            setShowSearchResultsModal(true);
          }
        } finally {
          setIsSearching(false);
        }
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
  };

  // ============= FILTERED NEWS =============
  const filteredNews = useMemo(() => {
    if (!processedNews.length) return [];

    let filtered = [...processedNews];
    
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'injuries' || selectedCategory === 'injury') {
        filtered = filtered.filter(item => 
          (item.category?.toLowerCase().includes('injury') || 
           item.category === 'injuries' ||
           item.injuryStatus) &&
          !item.isBeatWriter
        );
      } else if (selectedCategory === 'beat-writers' || selectedCategory === 'beatwriter') {
        filtered = filtered.filter(item => item.isBeatWriter === true);
      } else if (selectedCategory === 'value') {
        filtered = filtered.filter(item => item.confidence > 75);
      } else if (selectedCategory === 'high-confidence') {
        filtered = filtered.filter(item => item.confidence > 80);
      } else if (selectedCategory === 'live') {
        filtered = filtered.filter(item => 
          item.time.includes('minute') || 
          item.time.includes('hour') ||
          item.time.includes('Just now')
        );
      } else {
        // Filter by sport (NBA, NFL, etc.)
        filtered = filtered.filter(item => item.sport === selectedCategory);
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.playerName.toLowerCase().includes(query) ||
        item.team.toLowerCase().includes(query) ||
        item.line.toLowerCase().includes(query) ||
        item.matchup.toLowerCase().includes(query) ||
        item.author?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [processedNews, selectedCategory, searchQuery]);

  // ============= EVENT HANDLERS =============
  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
    setSearchQuery('');
    setSelectedTeam('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    fetchNews(event.target.value);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews();
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
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  // ============= UI HELPER FUNCTIONS =============
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getInjuryStatusColor = (status: string = '') => {
    status = status.toLowerCase();
    return INJURY_STATUS_COLORS[status] || '#ef4444';
  };

  const getInjuryStatusLabel = (status: string = '') => {
    status = status.toLowerCase();
    const labels: Record<string, string> = {
      'out': '❌ OUT',
      'questionable': '⚠️ QUESTIONABLE',
      'doubtful': '⚠️ DOUBTFUL',
      'day-to-day': '📅 DAY-TO-DAY',
      'probable': '✅ PROBABLE',
      'healthy': '💪 HEALTHY'
    };
    return labels[status] || '🏥 INJURY';
  };

  // ============= RENDER FUNCTIONS =============
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                icon={<Twitter />}
                label={prop.author || 'Beat Writer'}
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
              {prop.category === 'game-preview' && (
                <Chip 
                  icon={<Stadium />}
                  label="Game Preview"
                  size="small"
                  sx={{ bgcolor: '#f59e0b', color: 'white' }}
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
              {prop.author?.charAt(0) || 'BW'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {prop.playerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {prop.team} • {prop.author || 'Beat Writer'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                {prop.line}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {prop.matchup}
              </Typography>
              
              {prop.gameInfo && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🏟️ Game Information
                  </Typography>
                  <Typography variant="body2">
                    {prop.gameInfo.awayTeam} @ {prop.gameInfo.homeTeam}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {prop.gameInfo.status} • {prop.gameInfo.time}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => prop.url && prop.url !== '#' && window.open(prop.url, '_blank')}
              sx={{ 
                bgcolor: '#8b5cf6',
                '&:hover': { bgcolor: '#7c3aed' }
              }}
              startIcon={<Article />}
            >
              Read Full Article
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
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

  const renderInjuryCard = (prop: PlayerProp) => {
    const statusColor = getInjuryStatusColor(prop.injuryStatus);
    const statusLabel = getInjuryStatusLabel(prop.injuryStatus);
    
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  <Healing sx={{ fontSize: 16, color: '#3b82f6' }} />
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
              onClick={() => prop.url && prop.url !== '#' && window.open(prop.url, '_blank')}
              sx={{ 
                bgcolor: statusColor,
                '&:hover': { bgcolor: statusColor, filter: 'brightness(0.9)' }
              }}
            >
              View Injury Details
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
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

  const renderNewsCard = (prop: PlayerProp) => {
    if (prop.isBeatWriter) {
      return renderBeatWriterCard(prop);
    }
    
    if (prop.category?.toLowerCase().includes('injury') || 
        prop.category === 'injuries' || 
        prop.injuryStatus) {
      return renderInjuryCard(prop);
    }
    
    const confidenceColor = getConfidenceColor(prop.confidence);
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
            <Button 
              variant="contained" 
              size="small"
              onClick={() => prop.url && prop.url !== '#' && window.open(prop.url, '_blank')}
              sx={{ 
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' }
              }}
            >
              Read Full Story
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
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

  // ============= TEAM NEWS MODAL =============
  const TeamNewsModal = () => (
    <Dialog 
      open={showTeamNewsModal} 
      onClose={() => setShowTeamNewsModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <TeamIcon />
        {selectedTeam} News
        <IconButton 
          onClick={() => setShowTeamNewsModal(false)}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
        >
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

  // ============= INJURY DASHBOARD MODAL =============
  const InjuryDashboardModal = () => (
    <Dialog 
      open={showInjuryDashboardModal} 
      onClose={() => setShowInjuryDashboardModal(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timeline />
        Injury Dashboard - {selectedSport.toUpperCase()}
        <IconButton 
          onClick={() => setShowInjuryDashboardModal(false)}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {injuryDashboard ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: '#f8fafc' }}>
                <Typography variant="h6" gutterBottom>
                  📊 Injury Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="#ef4444" fontWeight="bold">
                        {injuryDashboard.total_injuries}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Injuries
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="#f59e0b" fontWeight="bold">
                        {injuryDashboard.severity_breakdown?.severe || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Severe Injuries
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" color="#10b981" fontWeight="bold">
                        {injuryDashboard.status_breakdown?.day_to_day || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Day-to-Day
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🏥 By Status
                </Typography>
                {Object.entries(injuryDashboard.status_breakdown || {}).map(([status, count]) => (
                  <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%',
                        bgcolor: getInjuryStatusColor(status)
                      }} />
                      <Typography variant="body2" textTransform="capitalize">
                        {status.replace('_', ' ')}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      {count as number}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  ⚠️ Most Impacted Teams
                </Typography>
                {injuryDashboard.top_injured_teams?.map(([team, count]: [string, number]) => (
                  <Box key={team} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">{team}</Typography>
                    <Chip 
                      label={`${count} injury${count !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ bgcolor: '#ef4444', color: 'white' }}
                    />
                  </Box>
                ))}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🩺 Common Injuries
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(injuryDashboard.injury_type_breakdown || {})
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([type, count]) => (
                      <Grid item xs={6} sm={3} key={type}>
                        <Box sx={{ 
                          p: 1.5, 
                          bgcolor: '#f1f5f9', 
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <Typography variant="caption" textTransform="capitalize">
                            {type}
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            {count as number}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  🔴 Recent Injuries
                </Typography>
                <List>
                  {injuryDashboard.injuries?.slice(0, 5).map((injury: any) => (
                    <ListItem key={injury.player} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getInjuryStatusColor(injury.status) }}>
                          <Healing />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight="bold">
                              {injury.player}
                            </Typography>
                            <Chip 
                              label={injury.status}
                              size="small"
                              sx={{ 
                                bgcolor: getInjuryStatusColor(injury.status),
                                color: 'white',
                                height: 20,
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {injury.team} • {injury.injury}
                            </Typography>
                            <Typography variant="caption" color="#3b82f6">
                              Expected return: {injury.expected_return || 'TBD'}
                            </Typography>
                          </>
                        }
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
        <Button onClick={() => {
          setShowInjuryDashboardModal(false);
          setSelectedCategory('injuries');
        }} sx={{ color: '#ef4444' }}>
          View All Injuries
        </Button>
        <Button onClick={() => setShowInjuryDashboardModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // ============= SEARCH RESULTS MODAL =============
  const SearchResultsModal = () => (
    <Dialog 
      open={showSearchResultsModal} 
      onClose={() => setShowSearchResultsModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchIcon />
        Search Results: "{searchQuery}"
        <IconButton 
          onClick={() => setShowSearchResultsModal(false)}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
        >
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
                secondaryAction={
                  result.type === 'beat_writer' && (
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        setSelectedTeam(result.team);
                        fetchTeamNews(result.team);
                        setShowSearchResultsModal(false);
                      }}
                    >
                      View Team
                    </Button>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: result.type === 'beat_writer' ? '#8b5cf6' : 
                            result.type === 'injury' ? '#ef4444' : '#3b82f6'
                  }}>
                    {result.type === 'beat_writer' && <Twitter />}
                    {result.type === 'injury' && <LocalHospital />}
                    {result.type === 'player' && <Person />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight="bold">
                      {result.type === 'beat_writer' && result.name}
                      {result.type === 'player' && result.player}
                      {result.type === 'injury' && result.player}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {result.type === 'beat_writer' && `${result.outlet} • ${result.team}`}
                        {result.type === 'player' && `${result.team} • ${result.sport}`}
                        {result.type === 'injury' && `${result.team} • ${result.status} - ${result.injury}`}
                      </Typography>
                      {result.type === 'beat_writer' && (
                        <Typography variant="caption" color="#8b5cf6">
                          {result.twitter}
                        </Typography>
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
            <Typography variant="h6" gutterBottom>
              No results found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try searching for a player, team, or beat writer
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  // ============= BEAT WRITERS MODAL =============
  const BeatWritersModal = () => (
    <Dialog 
      open={showBeatWritersModal} 
      onClose={() => setShowBeatWritersModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Twitter />
        Beat Writers & Insiders
        <Box sx={{ flex: 1 }} />
        <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
          <Select
            value={selectedTeam}
            displayEmpty
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              if (e.target.value) {
                fetchTeamNews(e.target.value);
              }
            }}
            sx={{ color: 'white' }}
          >
            <MenuItem value="">All Teams</MenuItem>
            {teams.map(team => (
              <MenuItem key={team} value={team}>{team}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton 
          onClick={() => setShowBeatWritersModal(false)}
          sx={{ color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {beatWriterNews.length > 0 ? (
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {beatWriterNews.length} Updates from Beat Writers
              {selectedTeam && ` • ${selectedTeam}`}
            </Typography>
            <Divider sx={{ my: 2 }} />
            {beatWriterNews
              .filter(item => !selectedTeam || item.team === selectedTeam)
              .map(writer => renderBeatWriterCard(writer))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Twitter sx={{ fontSize: 60, color: '#8b5cf6', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Beat Writer Updates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTeam ? `No recent updates from ${selectedTeam} beat writers` : 'Check back later for the latest insider news'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setShowBeatWritersModal(false);
          setSelectedCategory('beat-writers');
        }} sx={{ color: '#8b5cf6' }}>
          View All Beat News
        </Button>
        <Button onClick={() => setShowBeatWritersModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // ============= ANALYTICS DASHBOARD =============
  const AnalyticsDashboardModal = () => (
    <Dialog 
      open={showAnalyticsModal} 
      onClose={() => setShowAnalyticsModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Analytics />
        SportsWire Analytics Dashboard
        <IconButton 
          onClick={() => setShowAnalyticsModal(false)}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {processedNews.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total News</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff1f0' }}>
              <Typography variant="h4" fontWeight="bold" color="#ef4444">
                {injuryNews.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Injuries</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f3ff' }}>
              <Typography variant="h4" fontWeight="bold" color="#8b5cf6">
                {beatWriterNews.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Beat Writers</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {bookmarked.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Bookmarks</Typography>
            </Paper>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Category Breakdown
        </Typography>
        <Grid container spacing={1}>
          {Object.entries(
            processedNews.reduce((acc: Record<string, number>, item) => {
              const cat = item.category || 'other';
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {})
          ).map(([category, count]) => (
            <Grid item xs={6} sm={4} md={3} key={category}>
              <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                <Typography variant="caption" display="block" fontWeight="bold">
                  {category.toUpperCase()}
                </Typography>
                <Typography variant="h6" sx={{ color: CATEGORY_COLORS[category] || '#6b7280' }}>
                  {count}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAnalyticsModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // ============= INJURY MODAL (Legacy) =============
  const InjuryModal = () => (
    <Dialog 
      open={showInjuryModal} 
      onClose={() => setShowInjuryModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalHospital />
        Injury Report
        <IconButton 
          onClick={() => setShowInjuryModal(false)}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
        >
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
            <Typography variant="h6" gutterBottom>
              No Current Injuries
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All {selectedSport.toUpperCase()} players are healthy
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setShowInjuryModal(false);
          fetchInjuryDashboard();
        }} sx={{ color: '#ef4444' }}>
          View Dashboard
        </Button>
        <Button onClick={() => setShowInjuryModal(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // ============= LOADING STATE =============
  if (loading && processedNews.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 3 }} variant="h6">
            Loading {selectedSport.toUpperCase()} news...
          </Typography>
        </Box>
      </Container>
    );
  }

  // ============= ERROR STATE =============
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert 
          severity="error" 
          sx={{ mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          <Typography variant="body1" fontWeight="bold">
            Failed to load news
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Container>
    );
  }

  // ============= MAIN RENDER =============
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ 
        mb: 3, 
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                SportsWire
              </Typography>
              <Typography variant="body1">
                Latest {selectedSport.toUpperCase()} news and updates
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Team Selector Dropdown */}
              {teams.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200, mr: 1 }}>
                  <Select
                    value={selectedTeam}
                    displayEmpty
                    onChange={(e) => {
                      setSelectedTeam(e.target.value);
                      if (e.target.value) {
                        fetchTeamNews(e.target.value);
                      }
                    }}
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                  >
                    <MenuItem value="">Select Team</MenuItem>
                    {teams.map(team => (
                      <MenuItem key={team} value={team}>{team}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {/* Injury Dashboard Button */}
              <IconButton 
                onClick={fetchInjuryDashboard}
                sx={{ color: 'white', bgcolor: 'rgba(239,68,68,0.3)' }}
              >
                <Timeline />
              </IconButton>
              
              <Badge badgeContent={beatWriterNews.length} color="secondary">
                <IconButton 
                  onClick={() => setShowBeatWritersModal(true)}
                  sx={{ color: 'white', bgcolor: 'rgba(139,92,246,0.3)' }}
                >
                  <Twitter />
                </IconButton>
              </Badge>
              
              <Badge badgeContent={injuryNews.length} color="error">
                <IconButton 
                  onClick={() => setShowInjuryModal(true)}
                  sx={{ color: 'white', bgcolor: 'rgba(239,68,68,0.3)' }}
                >
                  <LocalHospital />
                </IconButton>
              </Badge>
              
              <IconButton 
                onClick={handleRefresh} 
                disabled={refreshing}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
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
                <Button 
                  fullWidth
                  startIcon={<Analytics />}
                  onClick={() => setShowAnalyticsModal(true)}
                  sx={{ 
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  variant="outlined"
                >
                  Analytics
                </Button>
                <Button 
                  fullWidth
                  startIcon={<Twitter />}
                  onClick={() => setShowBeatWritersModal(true)}
                  sx={{ 
                    color: 'white',
                    borderColor: '#8b5cf6',
                    bgcolor: 'rgba(139,92,246,0.2)',
                    '&:hover': { bgcolor: 'rgba(139,92,246,0.3)' }
                  }}
                  variant="outlined"
                >
                  Beat Writers ({beatWriterNews.length})
                </Button>
                <Button 
                  fullWidth
                  startIcon={<LocalHospital />}
                  onClick={() => setShowInjuryModal(true)}
                  sx={{ 
                    color: 'white',
                    borderColor: '#ef4444',
                    bgcolor: 'rgba(239,68,68,0.2)',
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.3)' }
                  }}
                  variant="outlined"
                >
                  Injuries ({injuryNews.length})
                </Button>
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
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isSearching && <CircularProgress size={20} sx={{ mr: 1 }} />}
                {searchQuery && (
                  <IconButton onClick={handleClearSearch} size="small">
                    <Close />
                  </IconButton>
                )}
              </InputAdornment>
            )
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
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Tab value="all" label="All Sports" icon={<Bolt />} iconPosition="start" />
          <Tab value="NBA" label="NBA" icon={<SportsBasketball />} iconPosition="start" />
          <Tab value="NFL" label="NFL" icon={<SportsFootball />} iconPosition="start" />
          <Tab value="MLB" label="MLB" icon={<SportsBaseball />} iconPosition="start" />
          <Tab value="NHL" label="NHL" icon={<SportsHockey />} iconPosition="start" />
          <Tab 
            value="beat-writers" 
            label="Beat Writers" 
            icon={<Twitter />} 
            iconPosition="start" 
            sx={{ color: '#8b5cf6' }}
          />
          <Tab 
            value="injuries" 
            label="Injuries" 
            icon={<LocalHospital />} 
            iconPosition="start" 
            sx={{ color: '#ef4444' }}
          />
          <Tab value="value" label="High Value" icon={<ShowChart />} iconPosition="start" />
        </Tabs>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight="bold">
            {filteredNews.length} {filteredNews.length === 1 ? 'item' : 'items'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Badge badgeContent={beatWriterNews.length} color="secondary">
              <Twitter sx={{ color: '#8b5cf6', cursor: 'pointer' }} onClick={() => setShowBeatWritersModal(true)} />
            </Badge>
            <Badge badgeContent={injuryNews.length} color="error">
              <LocalHospital sx={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => setShowInjuryModal(true)} />
            </Badge>
            <Badge badgeContent={teams.length} color="info">
              <TeamIcon sx={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => teams.length > 0 && fetchTeamNews(teams[0])} />
            </Badge>
          </Box>
        </Box>
      </Paper>

      {/* Beat Writers Alert Banner */}
      {beatWriterNews.length > 0 && selectedCategory !== 'beat-writers' && (
        <Alert 
          severity="info" 
          sx={{ mb: 3, bgcolor: '#f5f3ff', color: '#8b5cf6' }}
          icon={<Twitter />}
          action={
            <Button color="inherit" size="small" onClick={() => setSelectedCategory('beat-writers')}>
              View {beatWriterNews.length} Beat Writer {beatWriterNews.length === 1 ? 'Update' : 'Updates'}
            </Button>
          }
        >
          <Typography variant="body2" fontWeight="bold">
            ✍️ {beatWriterNews.length} {beatWriterNews.length === 1 ? 'Update' : 'Updates'} from Beat Writers & Insiders
          </Typography>
        </Alert>
      )}

      {/* Injury Alert Banner */}
      {injuryNews.length > 0 && selectedCategory !== 'injuries' && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setSelectedCategory('injuries')}>
              View {injuryNews.length} Injury {injuryNews.length === 1 ? 'Update' : 'Updates'}
            </Button>
          }
        >
          <Typography variant="body2" fontWeight="bold">
            🏥 {injuryNews.length} Active {injuryNews.length === 1 ? 'Injury' : 'Injuries'} Reported
          </Typography>
        </Alert>
      )}

      {/* News Feed */}
      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {filteredNews.length > 0 ? (
        filteredNews.map(renderNewsCard)
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Newspaper sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No news found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? `No results for "${searchQuery}"` : `No ${selectedCategory === 'all' ? '' : selectedCategory} news available`}
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
