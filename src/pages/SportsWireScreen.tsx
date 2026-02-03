// src/pages/SportsWireScreen.tsx
import React, { useState, useEffect } from 'react';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
  Avatar,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Badge,
  Tabs,
  Tab,
  alpha,
  useTheme
} from '@mui/material';
import {
  ArrowBack,
  Search,
  TrendingUp,
  Analytics,
  Person,
  AccessTime,
  Visibility,
  Share,
  BookmarkBorder,
  Bookmark,
  ChatBubble,
  Newspaper,
  MedicalServices,
  People,
  SwapHoriz,
  School,
  Business,
  BarChart,
  Notifications,
  Close,
  AutoAwesome as SparklesIcon,
  Remove,
  TrendingDown,
  Timer
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SPORT_COLORS = {
  NBA: '#ef4444',
  NFL: '#3b82f6',
  NHL: '#1e40af',
  MLB: '#10b981'
};

const CATEGORY_COLORS = {
  'analytics': '#10b981',
  'injuries': '#ef4444',
  'trades': '#f59e0b',
  'rosters': '#8b5cf6',
  'draft': '#ec4899',
  'free-agency': '#6366f1',
  'advanced-stats': '#14b8a6',
  'beat-writers': '#3b82f6'
};

// MOCK_ARTICLES for fallback
const MOCK_ARTICLES = Array.from({ length: 12 }, (_, i) => {
  const categories = ['analytics', 'injuries', 'trades', 'rosters', 'draft'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    id: i + 1,
    title: `Sports News Article ${i + 1}: Breaking Update on Major Event`,
    category: randomCategory,
    excerpt: 'This is a detailed excerpt about the latest developments in sports analytics and insights from beat writers...',
    time: `${Math.floor(Math.random() * 24)}h ago`,
    views: `${Math.floor(Math.random() * 20) + 5}K`,
    writer: ['Sarah Johnson', 'Mike Smith', 'Alex Rodriguez'][Math.floor(Math.random() * 3)],
    isBookmarked: Math.random() > 0.5,
    sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
    engagement: Math.floor(Math.random() * 30) + 70,
    readingTime: `${Math.floor(Math.random() * 8) + 2} min`,
    aiScore: Math.floor(Math.random() * 40) + 60,
    metrics: {
      socialShares: Math.floor(Math.random() * 1000),
      comments: Math.floor(Math.random() * 500),
      saves: Math.floor(Math.random() * 200)
    }
  };
});

const MOCK_TRENDING_STORIES = [
  {
    id: 1,
    title: 'Advanced Metrics: Which Teams Are Over/Underperforming?',
    category: 'analytics',
    time: '1h ago',
    views: '18.2K',
    trending: true,
    emoji: '📊',
    type: 'ANALYSIS',
    writer: 'Sarah Johnson',
    sport: 'NBA',
    sentiment: 'positive',
    engagement: 92,
    readingTime: '4 min',
    aiInsights: ['High statistical significance', '95% confidence interval', '5 key metrics analyzed']
  },
  {
    id: 2,
    title: 'Injury Report: Key Players Sidelined This Week',
    category: 'injuries',
    time: '2h ago',
    views: '24.5K',
    trending: true,
    emoji: '🏥',
    type: 'BREAKING',
    writer: 'Team Doctors',
    sport: 'NFL',
    sentiment: 'negative',
    engagement: 88,
    readingTime: '3 min',
    aiInsights: ['Affects 3 team lineups', 'Average recovery: 14 days', 'Injury correlation: 0.87']
  },
  {
    id: 3,
    title: 'Trade Rumors: Latest from League Insiders',
    category: 'trades',
    time: '4h ago',
    views: '15.7K',
    trending: true,
    emoji: '📝',
    type: 'RUMOR',
    writer: 'Multiple Sources',
    sport: 'NBA',
    sentiment: 'neutral',
    engagement: 76,
    readingTime: '5 min',
    aiInsights: ['Trade probability: 65%', 'Salary cap impact: $12M', 'Team value change: +8%']
  }
];

const SportsWireScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState('beat-writers');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingFilter, setTrendingFilter] = useState('all');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [filteredArticles, setFilteredArticles] = useState(MOCK_ARTICLES);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingStories, setTrendingStories] = useState(MOCK_TRENDING_STORIES);
  
  const categories = [
    { id: 'beat-writers', name: 'Beat Writers', icon: <NewReleasesIcon />, color: '#3b82f6' },
    { id: 'injuries', name: 'Injury News', icon: <MedicalServices />, color: '#ef4444' },
    { id: 'rosters', name: 'Rosters', icon: <People />, color: '#8b5cf6' },
    { id: 'analytics', name: 'Analytics', icon: <Analytics />, color: '#10b981' },
    { id: 'trades', name: 'Trades', icon: <SwapHoriz />, color: '#f59e0b' },
    { id: 'draft', name: 'Draft', icon: <School />, color: '#ec4899' },
    { id: 'free-agency', name: 'Free Agency', icon: <Business />, color: '#6366f1' },
    { id: 'advanced-stats', name: 'Advanced Stats', icon: <BarChart />, color: '#14b8a6' },
  ];

  const trendingFilters = [
    { id: 'all', name: 'All' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'injuries', name: 'Injuries' },
    { id: 'trades', name: 'Trades' },
    { id: 'breaking', name: 'Breaking' },
    { id: 'high-engagement', name: 'High Engagement' },
  ];

  const [analyticsMetrics] = useState({
    totalArticles: 128,
    trendingScore: 78,
    engagementRate: 65,
    avgReadingTime: 4,
    sentimentScore: 68,
    hotTopics: [
      { category: 'analytics', count: 42 },
      { category: 'injuries', count: 28 },
      { category: 'trades', count: 19 }
    ]
  });

  // NEW: Fetch news from API
  const fetchNews = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE || 'https://pleasing-determination-production.up.railway.app';
      console.log(`🎯 Fetching sports wire news from: ${apiBaseUrl}/api/news`);
      
      const response = await fetch(`${apiBaseUrl}/api/news`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      console.log('✅ Sports wire news received:', result);
      
      if (result && result.success && Array.isArray(result.news)) {
        console.log(`✅ Using REAL sports wire news: ${result.news.length} articles`);
        
        // Convert API news to our article format
        const apiArticles = result.news.map((article: any, index: number) => ({
          id: article.id || `api-${index}`,
          title: article.title || 'Sports News Update',
          category: article?.category || 'analytics',
          excerpt: article.description || article.content || 'Latest sports news and analysis...',
          time: `${Math.floor(Math.random() * 24)}h ago`,
          views: `${Math.floor(Math.random() * 20) + 5}K`,
          writer: article.author || article.writer || 'Sports Reporter',
          isBookmarked: false,
          sentiment: undefined,
          engagement: Math.floor(Math.random() * 30) + 70,
          readingTime: `${Math.floor(Math.random() * 8) + 2} min`,
          aiScore: Math.floor(Math.random() * 40) + 60,
          metrics: {
            socialShares: Math.floor(Math.random() * 1000),
            comments: Math.floor(Math.random() * 500),
            saves: Math.floor(Math.random() * 200)
          }
        }));
        
        setArticles(apiArticles);
        setFilteredArticles(apiArticles);
        
        // Update trending stories if API provides them
        if (result.trending && Array.isArray(result.trending)) {
          const apiTrendingStories = result.trending.map((story: any, index: number) => ({
            id: story.id || `trending-${index}`,
            title: story.title || 'Trending Story',
            category: story?.category || 'analytics',
            time: '1h ago',
            views: `${Math.floor(Math.random() * 20) + 5}K`,
            trending: true,
            emoji: undefined,
            type: undefined,
            writer: story.author || 'Sports Analyst',
            sport: story.sport || 'NBA',
            sentiment: undefined,
            engagement: Math.floor(Math.random() * 30) + 70,
            readingTime: `${Math.floor(Math.random() * 8) + 2} min`,
            aiInsights: story.insights || ['AI analysis available', 'Data-driven insights']
          }));
          setTrendingStories(apiTrendingStories);
        }
        
      } else {
        throw new Error('Invalid sports wire data structure');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch sports wire news, using mock data:', error);
      // Fallback to mock
      setArticles(MOCK_ARTICLES);
      setFilteredArticles(MOCK_ARTICLES);
      setTrendingStories(MOCK_TRENDING_STORIES);
    }
  };

  // Helper function to map API categories to our categories
  const mapCategory = (category: string): string => {
    if (!category) return 'analytics';
    
    const categoryMap: Record<string, string> = {
      'analytics': 'analytics',
      'injury': 'injuries',
      'injuries': 'injuries',
      'trade': 'trades',
      'trades': 'trades',
      'roster': 'rosters',
      'rosters': 'rosters',
      'draft': 'draft',
      'free agency': 'free-agency',
      'free-agency': 'free-agency',
      'stats': 'advanced-stats',
      'advanced-stats': 'advanced-stats',
      'news': 'beat-writers',
      'beat-writers': 'beat-writers'
    };
    
    return categoryMap[category.toLowerCase()] || 'analytics';
  };

  // Helper function to format time
  const formatTime = (dateString?: string): string => {
    if (!dateString) return `${Math.floor(Math.random() * 24)}h ago`;
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return `${Math.floor(Math.random() * 24)}h ago`;
    }
  };

  // Helper function to get sentiment
  const getSentiment = (sentiment?: string): string => {
    if (!sentiment) return ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)];
    
    const sentimentMap: Record<string, string> = {
      'positive': 'positive',
      'negative': 'negative',
      'neutral': 'neutral',
      'up': 'positive',
      'down': 'negative'
    };
    
    return sentimentMap[sentiment.toLowerCase()] || 'neutral';
  };

  // Helper function to get emoji for category
  const getEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
      'analytics': '📊',
      'injuries': '🏥',
      'trades': '📝',
      'rosters': '👥',
      'draft': '🎓',
      'free-agency': '💰',
      'advanced-stats': '📈',
      'beat-writers': '📰'
    };
    
    return emojiMap[category] || '📰';
  };

  // Helper function to get type for trending stories
  const getType = (category: string): string => {
    const typeMap: Record<string, string> = {
      'analytics': 'ANALYSIS',
      'injuries': 'BREAKING',
      'trades': 'RUMOR',
      'rosters': 'UPDATE',
      'draft': 'INSIGHT',
      'free-agency': 'REPORT',
      'advanced-stats': 'ANALYSIS',
      'beat-writers': 'NEWS'
    };
    
    return typeMap[category] || 'NEWS';
  };

  // Fetch all data including news from API
  const fetchAllData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      await fetchNews();
      
    } catch (error) {
      console.error('Error fetching sports wire data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialize data fetching
  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter articles when category or search changes
  useEffect(() => {
    let filtered = articles;
    
    // Filter by category
    if (selectedCategory !== 'beat-writers') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.writer.toLowerCase().includes(query)
      );
    }
    
    // Filter trending stories if needed
    if (trendingFilter !== 'all') {
      // For trending filter, we could add additional filtering logic
      // This is a placeholder for future implementation
    }
    
    setFilteredArticles(filtered);
  }, [selectedCategory, searchQuery, trendingFilter, articles]);

  const getSentimentIcon = (sentiment: string) => {
    switch(sentiment) {
      case 'positive': return <TrendingUp sx={{ fontSize: 12 }} />;
      case 'negative': return <TrendingDown sx={{ fontSize: 12 }} />;
      default: return <Remove sx={{ fontSize: 12 }} />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch(sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleBookmark = (articleId: number) => {
    if (bookmarked.includes(articleId)) {
      setBookmarked(bookmarked.filter(id => id !== articleId));
    } else {
      setBookmarked([...bookmarked, articleId]);
    }
  };

  const handleShare = (article: any) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${article.title}\n\n${article.excerpt}`);
      alert('Article link copied to clipboard!');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData(true);
  };

  const renderTrendingCard = (story: any) => (
    <Card sx={{ 
      width: 300, 
      mr: 2, 
      mb: 2,
      display: 'inline-flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ 
        position: 'relative',
        height: 120,
        bgcolor: (CATEGORY_COLORS as any)[story.category] || theme.palette.primary.main,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h2" sx={{ fontSize: 48 }}>
          {story.emoji}
        </Typography>
        <Chip 
          label={story.type}
          size="small"
          sx={{ 
            position: 'absolute',
            top: 10,
            right: 10,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '0.7rem'
          }}
        />
        <Chip 
          icon={getSentimentIcon(story.sentiment)}
          label={story.sentiment.toUpperCase()}
          size="small"
          sx={{ 
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: getSentimentColor(story.sentiment),
            color: 'white',
            fontSize: '0.6rem'
          }}
        />
      </Box>
      
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          <Person sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {story.writer}
          </Typography>
          <Chip 
            label={story.sport}
            size="small"
            sx={{ 
              height: 20,
              fontSize: '0.6rem',
              bgcolor: `${(SPORT_COLORS as any)[story.sport]}20`,
              color: (SPORT_COLORS as any)[story.sport]
            }}
          />
        </Box>
        
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ height: 40 }}>
          {story.title}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Visibility sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {story.views}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Timer sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {story.readingTime}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 12, color: '#10b981' }} />
            <Typography variant="caption" color="#10b981">
              {story.engagement}%
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={categories.find(c => c.id === story.category)?.name}
            size="small"
            sx={{ 
              bgcolor: `${(CATEGORY_COLORS as any)[story.category]}20`,
              color: (CATEGORY_COLORS as any)[story.category]
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {story.time}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', borderTop: 1, borderColor: 'divider', pt: 1 }}>
          <IconButton size="small" onClick={() => handleShare(story)}>
            <Share sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" onClick={() => alert(story.aiInsights?.join('\n') || 'No AI insights available')}>
            <AutoAwesomeIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
          </IconButton>
          <IconButton size="small">
            <BookmarkBorder sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  const renderArticleCard = (article: any) => (
    <Card key={article.id} sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip 
            label={categories.find(c => c.id === article.category)?.name}
            size="small"
            sx={{ 
              bgcolor: `${(CATEGORY_COLORS as any)[article.category]}20`,
              color: (CATEGORY_COLORS as any)[article.category],
              fontWeight: 'bold'
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: getSentimentColor(article.sentiment) 
            }} />
            <Typography variant="caption" color="text.secondary">
              {article.time}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {article.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
          {article.excerpt}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              By {article.writer}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Visibility sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {article.views}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', width: 60, height: 60, mx: 'auto', mb: 1 }}>
              <CircularProgress 
                variant="determinate" 
                value={article.engagement} 
                size={60}
                sx={{ color: '#3b82f6' }}
              />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                <Typography variant="caption" fontWeight="bold">
                  {article.engagement}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">Engagement</Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', width: 60, height: 60, mx: 'auto', mb: 1 }}>
              <CircularProgress 
                variant="determinate" 
                value={article.aiScore} 
                size={60}
                sx={{ color: '#10b981' }}
              />
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}>
                <Typography variant="caption" fontWeight="bold">
                  {article.aiScore}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">AI Score</Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, mb: 1 }}>
              <Timer sx={{ color: '#8b5cf6', mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">
                {article.readingTime}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">Read Time</Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Share sx={{ fontSize: 14, color: '#3b82f6' }} />
              <Typography variant="caption" color="text.secondary">
                {article.metrics.socialShares}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ChatBubble sx={{ fontSize: 14, color: '#10b981' }} />
              <Typography variant="caption" color="text.secondary">
                {article.metrics.comments}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BookmarkBorder sx={{ fontSize: 14, color: '#f59e0b' }} />
              <Typography variant="caption" color="text.secondary">
                {article.metrics.saves}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={() => handleShare(article)}>
              <Share sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" onClick={() => handleBookmark(article.id)}>
              {bookmarked.includes(article.id) ? (
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

  const AnalyticsDashboard = () => (
    <Dialog 
      open={showAnalyticsModal} 
      onClose={() => setShowAnalyticsModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        SportsHub Analytics Dashboard
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Performance Metrics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {articles.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total Articles</Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(articles.length, 100)} 
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.trendingScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Trending Score</Typography>
              <LinearProgress 
                variant="determinate" 
                value={analyticsMetrics.trendingScore} 
                sx={{ mt: 1, bgcolor: '#10b98120', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.engagementRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Engagement Rate</Typography>
              <LinearProgress 
                variant="determinate" 
                value={analyticsMetrics.engagementRate} 
                sx={{ mt: 1, bgcolor: '#8b5cf620', '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6' } }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.sentimentScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Positive Sentiment</Typography>
              <LinearProgress 
                variant="determinate" 
                value={analyticsMetrics.sentimentScore} 
                sx={{ mt: 1, bgcolor: '#f59e0b20', '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' } }}
              />
            </Paper>
          </Grid>
        </Grid>
        
        <Typography variant="h6" gutterBottom>
          🔥 Hot Topics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {analyticsMetrics.hotTopics.map((topic, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {categories.find(c => c.id === topic.category)?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {topic.count} articles
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(topic.count / analyticsMetrics.totalArticles) * 100}
                  sx={{ 
                    height: 8,
                    borderRadius: 4,
                    bgcolor: `${(CATEGORY_COLORS as any)[topic.category]}20`,
                    '& .MuiLinearProgress-bar': { 
                      bgcolor: (CATEGORY_COLORS as any)[topic.category] || theme.palette.primary.main 
                    }
                  }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        <Typography variant="h6" gutterBottom>
          🎯 Sentiment Analysis
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ position: 'relative', height: 20, bgcolor: 'grey.100', borderRadius: 10, mb: 1 }}>
            <Box sx={{ 
              position: 'absolute',
              left: 0,
              height: '100%',
              width: `${analyticsMetrics.sentimentScore}%`,
              bgcolor: '#10b981',
              borderRadius: 10
            }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">Negative</Typography>
            <Typography variant="caption" color="text.secondary">Neutral</Typography>
            <Typography variant="caption" color="text.secondary">Positive</Typography>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAnalyticsModal(false)}>Close Dashboard</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Paper sx={{ 
        mb: 3, 
        mt: 3,
        background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
        color: 'white'
      }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold">
                SportsHub
              </Typography>
              <Typography variant="body1">
                Beat writers, analytics & roster insights
              </Typography>
            </Box>
            <IconButton onClick={handleRefresh} disabled={refreshing} sx={{ color: 'white' }}>
              <AccessTime />
            </IconButton>
          </Box>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                startIcon={<Analytics />}
                onClick={() => setShowAnalyticsModal(true)}
                sx={{ 
                  justifyContent: 'flex-start',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Advanced Analytics
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                startIcon={<Person />}
                sx={{ 
                  justifyContent: 'flex-start',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Beat Writer Reports
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                startIcon={<AccessTime />}
                sx={{ 
                  justifyContent: 'flex-start',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Real-time Updates
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Loading/Refreshing Indicator */}
      {(loading || refreshing) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search articles, teams, players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')} size="small">
                    <Close />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <IconButton 
            onClick={() => setShowAnalyticsModal(true)}
            sx={{ bgcolor: '#3b82f6', color: 'white', '&:hover': { bgcolor: '#2563eb' } }}
          >
            <Analytics />
          </IconButton>
        </Box>
      </Paper>

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={(e, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {categories.map((category) => (
            <Tab
              key={category.id}
              value={category.id}
              label={category.name}
              icon={category.icon}
              iconPosition="start"
              sx={{ 
                color: selectedCategory === category.id ? category.color : 'text.secondary',
                '&.Mui-selected': { color: category.color }
              }}
            />
          ))}
        </Tabs>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight="bold">
            {categories.find(c => c.id === selectedCategory)?.name} • {filteredArticles.length} articles
          </Typography>
          <Badge 
            badgeContent={articles.length} 
            color="error"
            sx={{ cursor: 'pointer' }}
          >
            <Notifications sx={{ color: '#3b82f6' }} />
          </Badge>
        </Box>
      </Paper>

      {/* Trending Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              📈 Trending Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Most discussed stories with AI insights
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            onClick={() => setShowAnalyticsModal(true)}
            size="small"
          >
            View Analytics
          </Button>
        </Box>
        
        {/* Quick Filters */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, overflow: 'auto' }}>
          {trendingFilters.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.name}
              onClick={() => setTrendingFilter(filter.id)}
              color={trendingFilter === filter.id ? 'primary' : 'default'}
              variant={trendingFilter === filter.id ? 'filled' : 'outlined'}
              size="small"
            />
          ))}
        </Box>
        
        {/* Trending Cards */}
        <Box sx={{ overflow: 'auto', whiteSpace: 'nowrap', pb: 1 }}>
          {trendingStories.map(renderTrendingCard)}
        </Box>
      </Paper>

      {/* Latest Articles */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              📰 Latest {categories.find(c => c.id === selectedCategory)?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {articles.length} articles • {analyticsMetrics.engagementRate}% avg engagement
            </Typography>
          </Box>
          <Chip 
            icon={<Analytics />}
            label="Analytics"
            onClick={() => setShowAnalyticsModal(true)}
            sx={{ bgcolor: '#3b82f6', color: 'white' }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading sports wire articles...</Typography>
          </Box>
        ) : filteredArticles.length > 0 ? (
          filteredArticles.map(renderArticleCard)
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Newspaper sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No articles found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {searchQuery ? 'Try a different search term' : 'Check back soon for new articles'}
            </Typography>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </Box>
        )}
        
        {!loading && filteredArticles.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredArticles.length} of {articles.length} articles
            </Typography>
            <Button 
              startIcon={<Analytics />}
              onClick={() => setShowAnalyticsModal(true)}
              variant="outlined"
            >
              View Analytics Dashboard
            </Button>
          </Box>
        )}
      </Paper>

      <AnalyticsDashboard />
    </Container>
  );
};

export default SportsWireScreen;
