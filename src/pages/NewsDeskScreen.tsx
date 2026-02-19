// src/pages/NewsDeskScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Badge,
  Divider,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  NewReleases as NewspaperIcon,
  EmojiEvents as TrophyIcon,
  RocketLaunch as RocketIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  Campaign as AnnouncementIcon,
  Speed as PerformanceIcon,
  Lightbulb as TipIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as ChatIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  SportsFootball as FootballIcon,
  SportsBasketball as BasketballIcon,
  SportsHockey as HockeyIcon,
  SportsBaseball as BaseballIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingIcon,
  Update as UpdateIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Custom hooks
import { useSportsWire } from '../hooks/useUnifiedAPI'; // ✅ Fixed import
import { logEvent, logScreenView } from '../utils/analytics';

interface UpdateItem {
  id: string;
  title: string;
  description: string;
  date: string;
  category: 'feature' | 'update' | 'fix' | 'announcement' | 'performance' | 'tip';
}

interface WinPost {
  id: string;
  title: string;
  description: string;
  amount: string;
  sport: string;
  userName: string;
  likes: number;
  comments: number;
  date: string;
}

// MOCK_ARTICLES for fallback
const MOCK_ARTICLES: UpdateItem[] = [
  {
    id: '1',
    title: '🎉 New Community Features!',
    description: 'Share your winning results with the community and celebrate success together!',
    date: 'Just now',
    category: 'feature',
  },
  {
    id: '2',
    title: '📊 Enhanced Analytics Dashboard',
    description: 'New player tracking metrics and real-time performance insights available.',
    date: '2h ago',
    category: 'update',
  },
  {
    id: '3',
    title: '🏆 Weekly Leaderboard Added',
    description: 'Compete with other users and track your success on our new leaderboard.',
    date: '1d ago',
    category: 'feature',
  },
  {
    id: '4',
    title: '💡 Pro Betting Tips',
    description: 'New section with expert insights and statistical analysis for smarter betting.',
    date: '2d ago',
    category: 'tip',
  },
  {
    id: '5',
    title: '⚡ Performance Improvements',
    description: 'Faster loading times and smoother animations in the latest update.',
    date: '3d ago',
    category: 'performance',
  },
  {
    id: '6',
    title: '🐛 Bug Fixes',
    description: 'Fixed issues with notifications and data synchronization.',
    date: '4d ago',
    category: 'fix',
  },
];

const NewsDeskScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb' | 'nhl'>('nba');
  
  const { 
    data: newsData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useSportsWire(selectedSport, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 300000, // 5 minutes
    cacheTime: 600000, // 10 minutes
  });
  
  // ENHANCED: Extract news from hook response - handles multiple API formats
  const newsFromApi = useMemo(() => {
    console.log('🔍 Processing newsData:', newsData);
    
    if (!newsData) {
      console.log('No newsData yet');
      return [];
    }
    
    // Check if data is in different formats
    // Format 1: Direct news array
    if (newsData.news && Array.isArray(newsData.news)) {
      console.log(`✅ Found news array: ${newsData.news.length} items`);
      return newsData.news;
    }
    
    // Format 2: Data array from scraper
    if (newsData.data && Array.isArray(newsData.data)) {
      console.log(`✅ Found data array: ${newsData.data.length} items`);
      return newsData.data.map((item: any, index: number) => ({
        ...item,
        id: item.id || `data-${index}`,
        publishedAt: item.publishedAt || item.timestamp || item.date || new Date().toISOString(),
        source: item.source || { name: 'Sports Wire' },
        title: item.title || item.headline || `Update ${index + 1}`,
        description: item.description || item.summary || item.content || 'No description available'
      }));
    }
    
    // Format 3: Picks array
    if (newsData.picks && Array.isArray(newsData.picks)) {
      console.log(`✅ Found picks array: ${newsData.picks.length} items`);
      return newsData.picks.map((pick: any, index: number) => ({
        id: `pick-${index}`,
        title: `Pick: ${pick.player} ${pick.stat || pick.stat_type || 'Performance'}`,
        description: pick.analysis || `${pick.player} is projected for ${pick.projection} ${pick.stat || pick.stat_type || ''}`,
        publishedAt: pick.last_updated || new Date().toISOString(),
        source: { name: 'Daily Picks' },
        url: `#pick-${index}`,
        category: 'tip'
      }));
    }
    
    // Format 4: Selections array from prizepicks
    if (newsData.selections && Array.isArray(newsData.selections)) {
      console.log(`✅ Found selections array: ${newsData.selections.length} items`);
      return newsData.selections.map((selection: any, index: number) => ({
        id: `selection-${index}`,
        title: `${selection.player} - ${selection.stat_type || 'Prop'}`,
        description: `${selection.player} has a ${selection.confidence || 70}% chance of hitting ${selection.line} ${selection.stat_type || ''}`,
        publishedAt: selection.last_updated || new Date().toISOString(),
        source: { name: 'Player Props' },
        url: `#selection-${index}`,
        category: 'tip'
      }));
    }
    
    // Format 5: Analytics array
    if (newsData.analytics && Array.isArray(newsData.analytics)) {
      console.log(`✅ Found analytics array: ${newsData.analytics.length} items`);
      return newsData.analytics.map((analytic: any, index: number) => ({
        id: `analytic-${index}`,
        title: analytic.title || `Analytics: ${analytic.metric || 'Data'}`,
        description: analytic.analysis || `Trend: ${analytic.trend || 'neutral'} with ${analytic.change || 'no change'}`,
        publishedAt: analytic.timestamp || new Date().toISOString(),
        source: { name: 'Analytics' },
        url: `#analytic-${index}`,
        category: 'tip'
      }));
    }
    
    // Check if API returned success but no data structure we recognize
    if (newsData.success === true) {
      console.log('✅ API returned success but no recognized data format');
      // Try to extract any array from the response
      for (const key in newsData) {
        if (Array.isArray(newsData[key]) && key !== 'endpoints') {
          console.log(`Found unrecognized array in key "${key}": ${newsData[key].length} items`);
          return newsData[key].slice(0, 10).map((item: any, index: number) => ({
            id: item.id || `${key}-${index}`,
            title: item.name || item.title || item.player || `Update ${index + 1}`,
            description: item.description || item.analysis || JSON.stringify(item).substring(0, 100) + '...',
            publishedAt: item.publishedAt || item.timestamp || item.date || new Date().toISOString(),
            source: { name: key.charAt(0).toUpperCase() + key.slice(1) },
            url: `#${key}-${index}`,
            category: 'announcement'
          }));
        }
      }
    }
    
    // If we get here, generate mock data
    console.log('⚠️ No valid news format found, generating mock data');
    return generateMockNewsData(selectedSport);
  }, [newsData, selectedSport]);
  
  // Helper function to generate mock news data
  const generateMockNewsData = useCallback((sport: string) => {
    const sportsMap = {
      nba: {
        name: 'NBA',
        teams: ['Lakers', 'Warriors', 'Celtics', 'Bucks', 'Suns', 'Nuggets', 'Heat', 'Knicks'],
        events: ['Game', 'Trade', 'Injury Update', 'Draft News', 'Playoff Race', 'All-Star']
      },
      nfl: {
        name: 'NFL',
        teams: ['Chiefs', '49ers', 'Ravens', 'Bills', 'Cowboys', 'Eagles', 'Packers', 'Dolphins'],
        events: ['Game', 'Trade', 'Injury Report', 'Draft', 'Playoff Picture', 'Pro Bowl']
      },
      mlb: {
        name: 'MLB',
        teams: ['Dodgers', 'Yankees', 'Braves', 'Astros', 'Phillies', 'Rangers', 'Orioles', 'Mariners'],
        events: ['Game', 'Trade', 'Injury', 'Standings', 'All-Star', 'Playoff Push']
      },
      nhl: {
        name: 'NHL',
        teams: ['Maple Leafs', 'Rangers', 'Golden Knights', 'Bruins', 'Avalanche', 'Oilers', 'Stars', 'Hurricanes'],
        events: ['Game', 'Trade', 'Injury', 'Playoff Race', 'All-Star', 'Standings']
      }
    };
    
    const sportInfo = sportsMap[sport as keyof typeof sportsMap] || sportsMap.nba;
    const categories: UpdateItem['category'][] = ['announcement', 'tip', 'update', 'feature', 'performance'];
    
    return Array.from({ length: 8 }, (_, i) => {
      const team = sportInfo.teams[i % sportInfo.teams.length];
      const event = sportInfo.events[i % sportInfo.events.length];
      const hoursAgo = i * 2; // 0, 2, 4, 6... hours ago
      
      return {
        id: `mock-${sport}-${i}`,
        title: `${sportInfo.name}: ${team} ${event}`,
        description: `Latest update from the ${sportInfo.name}. ${team} news and ${event.toLowerCase()} coverage.`,
        publishedAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
        source: { name: `${sportInfo.name} News Network` },
        url: `https://example.com/${sport}/news/${i}`,
        urlToImage: `https://picsum.photos/400/300?random=${i}&sport=${sport}`,
        category: categories[i % categories.length]
      };
    });
  }, []);

  // State management
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('updates');
  const [updates, setUpdates] = useState<UpdateItem[]>(MOCK_ARTICLES);
  const [winningPosts, setWinningPosts] = useState<WinPost[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<UpdateItem[]>(MOCK_ARTICLES);
  const [filteredWinningPosts, setFilteredWinningPosts] = useState<WinPost[]>([]);
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postAmount, setPostAmount] = useState('');
  const [postSport, setPostSport] = useState('NBA');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const updateCategories = {
    feature: { icon: <RocketIcon />, color: '#3b82f6', label: 'Feature', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    update: { icon: <RefreshIcon />, color: '#10b981', label: 'Update', gradient: 'linear-gradient(135deg, #10b981, #047857)' },
    fix: { icon: <BugIcon />, color: '#ef4444', label: 'Fix', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    announcement: { icon: <AnnouncementIcon />, color: '#f59e0b', label: 'Announcement', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    performance: { icon: <PerformanceIcon />, color: '#8b5cf6', label: 'Performance', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    tip: { icon: <TipIcon />, color: '#ec4899', label: 'Tip', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  };

  const sportsOptions = [
    { value: 'NFL', label: 'NFL', icon: <FootballIcon fontSize="small" /> },
    { value: 'NBA', label: 'NBA', icon: <BasketballIcon fontSize="small" /> },
    { value: 'NHL', label: 'NHL', icon: <HockeyIcon fontSize="small" /> },
    { value: 'MLB', label: 'MLB', icon: <BaseballIcon fontSize="small" /> },
    { value: 'NCAAB', label: 'NCAAB', icon: <SchoolIcon fontSize="small" /> },
  ];

  // Memoize formatTimeAgo to avoid recreating it on every render
  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  }, []);

  // Transform API news to UpdateItem format
  const transformApiNewsToUpdates = useCallback((apiNews: any[]): UpdateItem[] => {
    if (!apiNews || apiNews.length === 0) {
      console.log('No API news found, using mock articles');
      return MOCK_ARTICLES;
    }
    
    console.log(`✅ Using REAL news: ${apiNews.length} articles`);
    
    return apiNews.map((article: any, index: number) => {
      const publishedAt = article.publishedAt ? new Date(article.publishedAt) : new Date();
      const timeAgo = formatTimeAgo(publishedAt);
      
      // Extract category from source or content
      let category: UpdateItem['category'] = 'announcement';
      if (article.source?.name?.includes('ESPN') || article.category === 'sports') {
        category = 'announcement';
      } else if (article.category === 'tip' || article.description?.includes('tip')) {
        category = 'tip';
      } else if (article.category === 'feature') {
        category = 'feature';
      } else if (article.category === 'update' || article.source?.name?.includes('Update')) {
        category = 'update';
      } else if (article.category === 'performance' || article.description?.includes('performance')) {
        category = 'performance';
      }
      
      return {
        id: article.id || `api-${index}`,
        title: article.title || 'Sports Update',
        description: article.description || article.content || 'No description available',
        date: timeAgo,
        category: category
      };
    });
  }, [formatTimeAgo]);

  // Fetch winning posts data
  const fetchWinningPosts = useCallback(() => {
    const winsData = getSampleWins();
    setWinningPosts(winsData);
    setFilteredWinningPosts(winsData);
  }, []);

  // Initial data fetch
  useEffect(() => {
    logScreenView('NewsDeskScreen');
    fetchWinningPosts();
    setLastRefresh(new Date());
    
    // Initialize read status
    const initialReadStatus: Record<string, boolean> = {};
    MOCK_ARTICLES.forEach(update => {
      initialReadStatus[update.id] = Math.random() > 0.5;
    });
    setReadStatus(initialReadStatus);
  }, [fetchWinningPosts]);

  // Update effect to transform API news when data arrives
  useEffect(() => {
    console.log('🔄 Processing newsFromApi:', newsFromApi.length, 'items');
    
    if (newsFromApi.length > 0) {
      const transformedUpdates = transformApiNewsToUpdates(newsFromApi);
      setUpdates(transformedUpdates);
      setFilteredUpdates(transformedUpdates);
      
      // Update read status for new updates (only once per new update)
      setReadStatus(prev => {
        const updated = { ...prev };
        transformedUpdates.forEach(update => {
          if (!(update.id in updated)) {
            updated[update.id] = false;
          }
        });
        return updated;
      });
    } else {
      // Keep using mock articles if no API data
      console.log('Using mock articles as fallback');
      setUpdates(MOCK_ARTICLES);
      setFilteredUpdates(MOCK_ARTICLES);
    }
  }, [newsFromApi, transformApiNewsToUpdates]); // ✅ Removed readStatus from deps to avoid loops

  // Filter updates based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUpdates(updates);
      return;
    }
    
    const searchLower = searchQuery.toLowerCase().trim();
    const filtered = updates.filter(update => 
      update.title.toLowerCase().includes(searchLower) ||
      update.description.toLowerCase().includes(searchLower) ||
      updateCategories[update.category]?.label.toLowerCase().includes(searchLower)
    );
    setFilteredUpdates(filtered);
  }, [searchQuery, updates, updateCategories]);

  // Filter winning posts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWinningPosts(winningPosts);
      return;
    }
    
    const searchLower = searchQuery.toLowerCase().trim();
    const filtered = winningPosts.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.description.toLowerCase().includes(searchLower) ||
      post.sport.toLowerCase().includes(searchLower) ||
      post.userName.toLowerCase().includes(searchLower)
    );
    setFilteredWinningPosts(filtered);
  }, [searchQuery, winningPosts]);

  const handleSearchSubmit = useCallback(() => {
    const query = searchInput.trim();
    
    if (query) {
      setSearchQuery(query);
      setShowSearchHistory(false);
    } else {
      setSearchQuery('');
      setShowSearchHistory(false);
    }
  }, [searchInput]);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setShowSearchHistory(false);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    refetch();
    setLastRefresh(new Date());
  }, [refetch]);

  const markAsRead = useCallback((id: string) => {
    setReadStatus(prev => ({ ...prev, [id]: true }));
  }, []);

  const likePost = useCallback((postId: string) => {
    setWinningPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, likes: (post.likes || 0) + 1 }
          : post
      )
    );
  }, []);

  const postWin = useCallback(async () => {
    if (!postTitle.trim() || !postDescription.trim()) {
      setSnackbar({ open: true, message: 'Please provide a title and description', severity: 'error' });
      return;
    }

    try {
      setPosting(true);
      
      const winData: WinPost = {
        id: `win-${Date.now()}`,
        title: postTitle.trim(),
        description: postDescription.trim(),
        amount: postAmount.trim() || 'Not specified',
        sport: postSport,
        userName: 'You',
        likes: 0,
        comments: 0,
        date: 'Just now'
      };

      const newWinningPosts = [winData, ...winningPosts];
      setWinningPosts(newWinningPosts);

      setSnackbar({ open: true, message: 'Your winning result has been posted!', severity: 'success' });
      
      setPostTitle('');
      setPostDescription('');
      setPostAmount('');
      setPostSport('NBA');
      setShowPostModal(false);
      
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to post your win', severity: 'error' });
    } finally {
      setPosting(false);
    }
  }, [postTitle, postDescription, postAmount, postSport, winningPosts]);

  const unreadCount = useMemo(() => 
    updates.filter(update => !readStatus[update.id]).length, 
    [updates, readStatus]
  );

  const getSportColor = useCallback((sport: string) => {
    const colors: Record<string, string> = {
      'NFL': '#3b82f6',
      'NBA': '#ef4444',
      'NHL': '#0ea5e9',
      'MLB': '#f59e0b',
      'NCAAB': '#10b981',
    };
    return colors[sport] || '#6b7280';
  }, []);

  const getSampleWins = useCallback((): WinPost[] => [
    {
      id: 'win-1',
      title: 'Perfect Parlay Hit!',
      description: '3-team NFL parlay with +450 odds. Chiefs, Packers, and Bills all covered!',
      amount: '1250',
      sport: 'NFL',
      userName: 'ProBetter99',
      likes: 42,
      comments: 8,
      date: '2h ago',
    },
    {
      id: 'win-2',
      title: 'NBA Player Prop Success',
      description: 'Steph Curry over 29.5 points hit easily. His shooting was on fire tonight!',
      amount: '500',
      sport: 'NBA',
      userName: 'BallisLife',
      likes: 28,
      comments: 5,
      date: '5h ago',
    },
    {
      id: 'win-3',
      title: 'Underdog ML Winner',
      description: 'Took the Panthers moneyline at +220 and they pulled off the upset!',
      amount: '880',
      sport: 'NHL',
      userName: 'IceCold',
      likes: 35,
      comments: 12,
      date: '1d ago',
    },
  ], []);

  const renderHeader = useMemo(() => (
    <Box sx={{
      background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
      color: 'white',
      py: { xs: 4, md: 5 },
      mb: 4,
      borderRadius: { xs: 0, sm: 2 },
    }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            component={Link} 
            to="/" 
            sx={{ color: 'white', mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Community Hub
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Updates & Winning Results
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            )}
            <IconButton onClick={handleRefresh} disabled={isLoading || isRefetching} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3, position: 'relative' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search updates, wins, or users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            onFocus={() => searchInput.length > 0 && setShowSearchHistory(true)}
            InputProps={{
              sx: {
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                }
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton onClick={handleClearSearch} size="small">
                    <ClearIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Tabs */}
        <Paper sx={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          p: 0.5,
        }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                minHeight: 48,
                borderRadius: 1,
              },
              '& .Mui-selected': {
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab 
              icon={<NewspaperIcon />} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Updates
                  <Chip 
                    label={searchQuery ? filteredUpdates.length : updates.length}
                    size="small"
                    sx={{ ml: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              } 
              value="updates" 
            />
            <Tab 
              icon={<TrophyIcon />} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Wins
                  <Chip 
                    label={searchQuery ? filteredWinningPosts.length : winningPosts.length}
                    size="small"
                    sx={{ ml: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              } 
              value="wins" 
            />
          </Tabs>
        </Paper>
      </Container>
    </Box>
  ), [unreadCount, handleRefresh, isLoading, isRefetching, searchInput, handleSearchSubmit, handleClearSearch, activeTab, searchQuery, filteredUpdates.length, updates.length, filteredWinningPosts.length, winningPosts.length]);

  const renderUpdateCard = useCallback((update: UpdateItem) => {
    const isRead = readStatus[update.id] || false;
    const category = updateCategories[update.category] || updateCategories.announcement;
    
    return (
      <Card 
        key={update.id} 
        sx={{ 
          mb: 2, 
          border: isRead ? 'none' : '1px solid rgba(59, 130, 246, 0.3)',
          position: 'relative',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 6,
          }
        }}
        onClick={() => markAsRead(update.id)}
      >
        <CardHeader
          sx={{
            background: category.gradient,
            color: 'white',
            py: 1.5,
          }}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {category.icon}
                <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                  {category.label}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {update.date}
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            {update.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {update.description}
          </Typography>
        </CardContent>
        
        {!isRead && (
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
          </Box>
        )}
      </Card>
    );
  }, [readStatus, updateCategories, markAsRead]);

  const renderWinningPost = useCallback((post: WinPost) => (
    <Card key={post.id} sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: '#7c3aed', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {post.userName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {post.date}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={post.sport}
            size="small"
            sx={{ 
              backgroundColor: getSportColor(post.sport),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {/* Content */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {post.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {post.description}
        </Typography>

        {/* Amount */}
        {post.amount !== 'Not specified' && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: '#f0fdf4',
            p: 2,
            borderRadius: 1,
            mb: 2,
          }}>
            <MoneyIcon sx={{ color: '#10b981', mr: 1 }} />
            <Typography variant="body1" fontWeight="bold" color="#10b981">
              Won: ${post.amount}
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => likePost(post.id)}>
            {post.likes > 0 ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon color="error" />}
          </IconButton>
          <Typography variant="body2" sx={{ ml: 0.5, mr: 2 }}>
            {post.likes}
          </Typography>
          
          <IconButton size="small">
            <ChatIcon />
          </IconButton>
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            {post.comments}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  ), [getSportColor, likePost]);

  if (isLoading && updates.length === MOCK_ARTICLES.length) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {renderHeader}
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading community updates...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {renderHeader}
      
      <Container maxWidth="lg">
        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              Failed to load news updates
            </Typography>
            <Typography variant="body2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleRefresh}
              sx={{ mt: 1 }}
              disabled={isRefetching}
            >
              {isRefetching ? 'Retrying...' : 'Try Again'}
            </Button>
          </Alert>
        )}

        {/* Loading/Refreshing Indicator */}
        {(isLoading || isRefetching) && <LinearProgress sx={{ mb: 2 }} />}
        
        {/* Search Results Info */}
        {searchQuery && (
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: '#1e293b',
            color: 'white'
          }}>
            <Typography variant="body2">
              Search results for "{searchQuery}" 
              {activeTab === 'updates' ? ` (${filteredUpdates.length} updates)` : ` (${filteredWinningPosts.length} wins)`}
            </Typography>
            <Button size="small" onClick={handleClearSearch}>
              Clear
            </Button>
          </Paper>
        )}

        {/* Post Win Button */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<TrophyIcon />}
            onClick={() => setShowPostModal(true)}
            sx={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 6,
              }
            }}
          >
            Post Your Win
          </Button>
        </Box>

        {/* Content */}
        {activeTab === 'updates' ? (
          <Box>
            {filteredUpdates.length > 0 ? (
              filteredUpdates.map(update => renderUpdateCard(update))
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <NewspaperIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {searchQuery ? 'No matching updates found' : 'No updates yet'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? 'Try a different search term' : 'Check back soon for announcements'}
                </Typography>
                {searchQuery && (
                  <Button sx={{ mt: 2 }} onClick={handleClearSearch}>
                    Clear Search
                  </Button>
                )}
              </Paper>
            )}
          </Box>
        ) : (
          <Box>
            {filteredWinningPosts.length > 0 ? (
              filteredWinningPosts.map(post => renderWinningPost(post))
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {searchQuery ? 'No matching wins found' : 'No winning posts yet'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? 'Try a different search term' : 'Be the first to share your success!'}
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<TrophyIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => searchQuery ? handleClearSearch() : setShowPostModal(true)}
                >
                  {searchQuery ? 'Clear Search' : 'Post Your First Win'}
                </Button>
              </Paper>
            )}
          </Box>
        )}

        {/* Community Guidelines */}
        {!searchQuery && (
          <Paper sx={{ mt: 4, p: 3 }}>
            <Typography variant="h5" gutterBottom align="center">
              Community Guidelines
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
                  <Typography>Share genuine winning results</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
                  <Typography>Respect other community members</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
                  <Typography>No spam or promotional content</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#10b981', mr: 2 }} />
                  <Typography>Celebrate each other's success</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ 
          mt: 4, 
          pt: 3, 
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
        }}>
          <Typography variant="body2" color="text.secondary">
            Community Hub • v1.3.0
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
          </Typography>
        </Box>
      </Container>

      {/* Post Win Modal */}
      <Dialog
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography variant="h6" fontWeight="bold">
            Share Your Win
          </Typography>
          <IconButton onClick={() => setShowPostModal(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Title *"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="e.g., Perfect Parlay Hit!"
              fullWidth
              required
            />
            
            <TextField
              label="Description *"
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              placeholder="Share the details of your win..."
              multiline
              rows={4}
              fullWidth
              required
            />
            
            <TextField
              label="Amount Won (Optional)"
              value={postAmount}
              onChange={(e) => setPostAmount(e.target.value)}
              placeholder="e.g., 500"
              fullWidth
              type="number"
            />
            
            <FormControl fullWidth>
              <InputLabel>Sport</InputLabel>
              <Select
                value={postSport}
                label="Sport"
                onChange={(e) => setPostSport(e.target.value)}
              >
                {sportsOptions.map((sport) => (
                  <MenuItem key={sport.value} value={sport.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {sport.icon}
                      <Typography sx={{ ml: 1 }}>{sport.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowPostModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={postWin}
            disabled={posting}
            startIcon={posting ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              color: 'white',
            }}
          >
            {posting ? 'Posting...' : 'Post to Community'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewsDeskScreen;
