// src/pages/SportsWireScreen.tsx
import React, { useState, useEffect } from 'react';
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
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
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
  SportsBasketball,
  SportsFootball,
  SportsBaseball,
  SportsHockey,
  ShowChart,
  Business,
  BarChart,
  Notifications,
  Close,
  AutoAwesome as SparklesIcon,
  Remove,
  TrendingDown,
  Timer,
  LocalFireDepartment,
  Bolt,
  Update as UpdateIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Import React Query hook - UPDATE THE PATH BASED ON YOUR STRUCTURE
import { news } from '../hooks/useBackendAPI';
import { useOddsGames, usePlayerTrends, useAdvancedAnalytics } from '../hooks/useUnifiedAPI';

// Fix for __DEV__ error - define it if not defined
declare global {
  var __DEV__: boolean;
}

// Initialize __DEV__ if it doesn't exist
if (typeof __DEV__ === 'undefined') {
  globalThis.__DEV__ = process.env.NODE_ENV === 'development';
}

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
  'beat-writers': '#3b82f6',
  'injury': '#ef4444',
  'performance': '#10b981',
  'value': '#8b5cf6',
  'preview': '#f59e0b',
  'news': '#3b82f6'
};

// MOCK_PLAYER_PROPS for fallback
const MOCK_PLAYER_PROPS: PlayerProp[] = Array.from({ length: 12 }, (_, i) => {
  const sports = ['NBA', 'NFL', 'MLB', 'NHL'];
  const statTypes = ['Points', 'Rebounds', 'Assists', 'Yards', 'Touchdowns', 'Home Runs'];
  const randomSport = sports[Math.floor(Math.random() * sports.length)];
  const randomStat = statTypes[Math.floor(Math.random() * statTypes.length)];
  
  return {
    id: i + 1,
    playerName: `Player ${i + 1}`,
    team: ['Lakers', 'Warriors', 'Chiefs', 'Yankees', 'Bruins'][Math.floor(Math.random() * 5)],
    sport: randomSport,
    propType: randomStat,
    line: Math.random() > 0.5 ? 'Over ' + (Math.floor(Math.random() * 30) + 10) : 'Under ' + (Math.floor(Math.random() * 30) + 10),
    odds: Math.random() > 0.5 ? '+150' : '-120',
    impliedProbability: Math.floor(Math.random() * 40) + 50,
    matchup: 'Home vs. Away',
    time: `${Math.floor(Math.random() * 24)}h ago`,
    confidence: Math.floor(Math.random() * 40) + 60,
    isBookmarked: Math.random() > 0.5,
    aiInsights: [
      'Trending in the right direction',
      'Matchup favors this prop',
      'Historical performance strong'
    ]
  };
});

const MOCK_TRENDING_PROPS: TrendingProp[] = [
  {
    id: 1,
    playerName: 'LeBron James',
    team: 'Lakers',
    sport: 'NBA',
    propType: 'Points',
    line: 'Over 25.5',
    odds: '+110',
    impliedProbability: 65,
    matchup: 'LAL @ GSW',
    time: '1h ago',
    confidence: 85,
    trending: true,
    emoji: '🏀',
    type: 'HOT'
  },
  {
    id: 2,
    playerName: 'Patrick Mahomes',
    team: 'Chiefs',
    sport: 'NFL',
    propType: 'Passing Yards',
    line: 'Over 285.5',
    odds: '-130',
    impliedProbability: 72,
    matchup: 'KC @ BUF',
    time: '2h ago',
    confidence: 78,
    trending: true,
    emoji: '🏈',
    type: 'VALUE'
  },
  {
    id: 3,
    playerName: 'Connor McDavid',
    team: 'Oilers',
    sport: 'NHL',
    propType: 'Points',
    line: 'Over 1.5',
    odds: '+150',
    impliedProbability: 58,
    matchup: 'EDM @ COL',
    time: '4h ago',
    confidence: 82,
    trending: true,
    emoji: '🏒',
    type: 'TRENDING'
  }
];

// Define types for better TypeScript support
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
  category?: string;
  url?: string;
  image?: string;
  originalArticle?: any;
}

interface TrendingProp {
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
  trending: boolean;
  emoji?: string;
  type?: string;
  aiInsights?: string[];
}

// Inside your component, replace fetch logic with:
const SportsWireScreen = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State for sport selection
  const [selectedSport, setSelectedSport] = useState<'nba' | 'nfl' | 'mlb'>('nba');
  
  // Use React Query hook
  const { 
    data: hookData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useSportsWire(selectedSport);
  
  // Extract news data from hook response
  const newsData = hookData?.news || [];
  const newsCount = Array.isArray(newsData) ? newsData.length : 0;
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingFilter, setTrendingFilter] = useState('all');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingProps, setTrendingProps] = useState<TrendingProp[]>(MOCK_TRENDING_PROPS);
  const [processedPlayerProps, setProcessedPlayerProps] = useState<PlayerProp[]>([]);
  
  // Transform news data to player props format for compatibility with existing UI
  useEffect(() => {
    if (newsData && Array.isArray(newsData) && newsData.length > 0) {
      const transformedProps = newsData.map((article: any, index: number) => {
        // Extract data from the actual news article structure
        const title = article.title || 'Sports News';
        const description = article.description || article.summary || '';
        const source = article.source?.name || article.source || 'Sports Wire';
        const publishedAt = article.publishedAt || article.timestamp || new Date().toISOString();
        const category = article.category || 'news';
        const url = article.url || `#${index}`;
        const image = article.urlToImage || article.image || `https://picsum.photos/400/300?random=${index}&sport=${selectedSport}`;
        const playerName = article.player || source;
        const team = article.team || source;
        
        // Create confidence based on article data
        let confidence = 75;
        if (article.confidence) confidence = article.confidence;
        if (article.category === 'injury') confidence = 85;
        if (article.valueScore > 90) confidence = 90;
        
        return {
          id: article.id || `news-${index}`,
          playerName: playerName,
          team: team,
          sport: article.sport || selectedSport.toUpperCase(),
          propType: 'News',
          line: title.substring(0, 60) + (title.length > 60 ? '...' : ''),
          odds: '+100',
          impliedProbability: 65,
          matchup: description.substring(0, 80) + (description.length > 80 ? '...' : ''),
          time: publishedAt ? format(new Date(publishedAt), 'MMM d, h:mm a') : 'Just now',
          confidence: confidence,
          isBookmarked: false,
          aiInsights: [description.substring(0, 120) + (description.length > 120 ? '...' : '')],
          category: category,
          url: url,
          image: image,
          originalArticle: article // Keep original data
        };
      });
      
      setProcessedPlayerProps(transformedProps);
    } else {
      // Fallback to mock data only if there's no real data
      console.log('No news data available, using mock data');
      setProcessedPlayerProps(MOCK_PLAYER_PROPS);
    }
  }, [newsData, selectedSport]);
  
  // Filter props based on category and search
  const filteredProps = React.useMemo(() => {
    if (!processedPlayerProps || processedPlayerProps.length === 0) {
      return [];
    }

    let filtered = [...processedPlayerProps];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'value') {
        filtered = filtered.filter(prop => prop.confidence > 75);
      } else if (selectedCategory === 'high-confidence') {
        filtered = filtered.filter(prop => prop.confidence > 80);
      } else if (selectedCategory === 'live') {
        // For live news, filter by recent time
        filtered = filtered.filter(prop => 
          prop.time.includes('min') || prop.time.includes('Just now') || prop.time.includes('1h')
        );
      } else {
        filtered = filtered.filter(prop => prop.sport === selectedCategory);
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const searchQueryLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(prop => 
        prop.playerName.toLowerCase().includes(searchQueryLower) ||
        prop.team.toLowerCase().includes(searchQueryLower) ||
        prop.line.toLowerCase().includes(searchQueryLower) ||
        (prop.originalArticle?.description?.toLowerCase() || '').includes(searchQueryLower)
      );
    }
    
    return filtered;
  }, [processedPlayerProps, selectedCategory, searchQuery]);

  const categories = [
    { id: 'all', name: 'All Sports', icon: <LocalFireDepartment />, color: '#ef4444' },
    { id: 'NBA', name: 'NBA', icon: <SportsBasketball />, color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: <SportsFootball />, color: '#3b82f6' },
    { id: 'MLB', name: 'MLB', icon: <SportsBaseball />, color: '#10b981' },
    { id: 'value', name: 'High Value', icon: <ShowChart />, color: '#10b981' },
    { id: 'high-confidence', name: 'High Confidence', icon: <SparklesIcon />, color: '#8b5cf6' },
    { id: 'live', name: 'Recent', icon: <Bolt />, color: '#f59e0b' }
  ];  
  
  const trendingFilters = [
    { id: 'all', name: 'All' },
    { id: 'NBA', name: 'NBA' },
    { id: 'NFL', name: 'NFL' },
    { id: 'MLB', name: 'MLB' },
    { id: 'high-confidence', name: 'High Confidence' },
  ];

  const [analyticsMetrics] = useState({
    totalProps: newsCount || 0,
    trendingScore: 78,
    hitRate: 65,
    avgConfidence: 68,
    valueScore: 72,
    hotSports: [
      { sport: 'NBA', count: 42 },
      { sport: 'NFL', count: 28 },
      { sport: 'MLB', count: 19 }
    ]
  });

  const handleSportChange = (event: any) => {
    setSelectedSport(event.target.value);
  };

  const handleRefresh = () => {
    refetch();
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getOddsColor = (odds: string) => {
    if (!odds || typeof odds !== 'string') {
      return '#6b7280';
    }
    
    if (odds.startsWith('+')) return '#10b981';
    if (odds.startsWith('-')) return '#ef4444';
    return '#6b7280';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981';
    if (confidence >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getEmoji = (sport: string): string => {
    const emojiMap: Record<string, string> = {
      'NBA': '🏀',
      'NFL': '🏈',
      'MLB': '⚾',
      'NHL': '🏒',
      'SOCCER': '⚽',
      'TENNIS': '🎾'
    };
    
    return emojiMap[sport] || '📰';
  };

  const handleBookmark = (propId: string | number) => {
    const numId = typeof propId === 'string' ? parseInt(propId) : propId;
    
    if (bookmarked.includes(numId)) {
      setBookmarked(bookmarked.filter(id => id !== numId));
    } else {
      setBookmarked([...bookmarked, numId]);
    }
  };

  const handleShare = (prop: PlayerProp) => {
    if (navigator.share) {
      navigator.share({
        title: `${prop.playerName} - ${prop.line}`,
        text: `${prop.playerName}: ${prop.line} - ${prop.matchup}`,
        url: prop.url || window.location.href,
      }).catch((err) => {
        navigator.clipboard.writeText(`${prop.playerName}: ${prop.line} - ${prop.matchup}`)
          .then(() => {
            alert('News copied to clipboard!');
          })
          .catch(() => {
            alert('News information available for sharing');
          });
      });
    } else {
      navigator.clipboard.writeText(`${prop.playerName}: ${prop.line} - ${prop.matchup}`)
        .then(() => {
          alert('News copied to clipboard!');
        })
        .catch(() => {
          alert('News information available for sharing');
        });
    }
  };

  const renderTrendingCard = (prop: TrendingProp) => {
    const oddsColor = getOddsColor(prop.odds);
    const confidenceColor = getConfidenceColor(prop.confidence);
    const sportColor = (SPORT_COLORS as Record<string, string>)[prop.sport] || theme.palette.primary.main;
    
    return (
      <Card key={prop.id} sx={{ 
        width: 300, 
        mr: 2, 
        mb: 2,
        display: 'inline-flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ 
          position: 'relative',
          height: 120,
          bgcolor: sportColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h2" sx={{ fontSize: 48 }}>
            {prop.emoji || getEmoji(prop.sport)}
          </Typography>
          {prop.type && (
            <Chip 
              label={prop.type}
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
          )}
          <Chip 
              label={`${prop.confidence}%`}
              size="small"
              sx={{ 
                position: 'absolute',
                top: 10,
                left: 10,
                bgcolor: confidenceColor,
                color: 'white',
                fontSize: '0.6rem'
              }}
            />
        </Box>
        
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Person sx={{ fontSize: 12, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {prop.playerName}
            </Typography>
            <Chip 
              label={prop.sport}
              size="small"
              sx={{ 
                height: 20,
                fontSize: '0.6rem',
                bgcolor: `${sportColor}20`,
                color: sportColor
              }}
            />
          </Box>
          
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {prop.propType}: {prop.line}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {prop.team}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" fontWeight="bold" color={oddsColor}>
                {prop.odds}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            {prop.matchup}
          </Typography>
          
          <Box sx={{ display: '-flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {prop.time}
            </Typography>
            <Chip 
              label={`${prop.impliedProbability}%`}
              size="small"
              sx={{ 
                bgcolor: '#f0f9ff',
                color: '#3b82f6',
                fontSize: '0.7rem'
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around', borderTop: 1, borderColor: 'divider', pt: 1 }}>
            <IconButton size="small" onClick={() => handleShare(prop as any)}>
              <Share sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => alert(prop.aiInsights?.join('\n') || 'No AI insights available')}>
              <SparklesIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
            </IconButton>
            <IconButton size="small">
              <BookmarkBorder sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderPropCard = (prop: PlayerProp) => {
    const confidenceColor = getConfidenceColor(prop.confidence);
    const sportColor = (SPORT_COLORS as Record<string, string>)[prop.sport] || theme.palette.primary.main;
    const isBookmarked = bookmarked.includes(typeof prop.id === 'string' ? parseInt(prop.id) : prop.id);
    const categoryColor = (CATEGORY_COLORS as Record<string, string>)[prop.category || 'news'] || '#3b82f6';
    
    return (
      <Card key={prop.id} sx={{ mb: 3 }}>
        <CardContent>
          {/* Header with category */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={prop.category || 'News'}
                size="small"
                sx={{ 
                  bgcolor: categoryColor,
                  color: 'white',
                  fontWeight: 'bold'
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
          
          {/* News content */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, gap: 2 }}>
            {prop.image && (
              <CardMedia
                component="img"
                image={prop.image}
                alt={prop.playerName}
                sx={{ width: 80, height: 80, borderRadius: 1, objectFit: 'cover' }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {prop.playerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {prop.team} • {prop.sport}
              </Typography>
              <Typography variant="body1" paragraph>
                {prop.line}
              </Typography>
            </Box>
          </Box>
          
          {/* Full description if available */}
          {prop.originalArticle?.description && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {prop.originalArticle.description}
              </Typography>
            </Box>
          )}
          
          {/* Confidence indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                News Confidence
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={prop.confidence} 
                  sx={{ 
                    flex: 1, 
                    height: 8,
                    borderRadius: 4,
                    bgcolor: `${confidenceColor}20`,
                    '& .MuiLinearProgress-bar': { bgcolor: confidenceColor }
                  }}
                />
                <Typography variant="body2" fontWeight="bold" color={confidenceColor}>
                  {prop.confidence}%
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* AI Insights if available */}
          {prop.aiInsights && prop.aiInsights.length > 0 && prop.aiInsights[0] && (
            <Box sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="#3b82f6" gutterBottom>
                📝 Summary
              </Typography>
              <Typography variant="caption" color="#1e40af">
                {prop.aiInsights[0]}
              </Typography>
            </Box>
          )}
          
          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              variant="contained" 
              size="small"
              onClick={() => prop.url && window.open(prop.url, '_blank')}
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

  const AnalyticsDashboard = () => (
    <Dialog 
      open={showAnalyticsModal} 
      onClose={() => setShowAnalyticsModal(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        SportsWire Analytics Dashboard
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 News Performance Metrics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {newsCount || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total News</Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(newsCount || 0, 100)} 
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.hitRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Relevance Score</Typography>
              <LinearProgress 
                variant="determinate" 
                value={analyticsMetrics.hitRate} 
                sx={{ mt: 1, bgcolor: '#10b98120', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.avgConfidence}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Avg Confidence</Typography>
              <LinearProgress 
                variant="determinate" 
                value={analyticsMetrics.avgConfidence} 
                sx={{ mt: 1, bgcolor: '#8b5cf620', '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6' } }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.valueScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Value Score</Typography>
              <LinearProgress 
                variant="determinate" 
                value={analyticsMetrics.valueScore} 
                sx={{ mt: 1, bgcolor: '#f59e0b20', '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' } }}
              />
            </Paper>
          </Grid>
        </Grid>
        
        <Typography variant="h6" gutterBottom>
          🔥 News by Category
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {processedPlayerProps.reduce((acc: any[], prop) => {
            const category = prop.category || 'news';
            const existing = acc.find(c => c.name === category);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ name: category, count: 1, color: (CATEGORY_COLORS as Record<string, string>)[category] || '#3b82f6' });
            }
            return acc;
          }, []).map((category, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: category.color }} />
                    <Typography variant="body2" fontWeight="bold" textTransform="capitalize">
                      {category.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {category.count} items
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(category.count / newsCount) * 100}
                  sx={{ 
                    height: 8,
                    borderRadius: 4,
                    bgcolor: `${category.color}20`,
                    '& .MuiLinearProgress-bar': { 
                      bgcolor: category.color
                    }
                  }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAnalyticsModal(false)}>Close Dashboard</Button>
      </DialogActions>
    </Dialog>
  );

  if (isLoading) return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading sports news...</Typography>
      </Box>
    </Container>
  );
  
  if (error) return (
    <Container maxWidth="lg">
      <Alert severity="error" sx={{ mb: 3, mt: 3 }}>
        <Typography variant="body1" fontWeight="bold">
          Failed to load news
        </Typography>
        <Typography variant="body2">
          {error instanceof Error ? error.message : 'Unknown error'}
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => refetch()}
          sx={{ mt: 1 }}
        >
          Try Again
        </Button>
      </Alert>
    </Container>
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
                SportsWire ({newsCount || 0} news)
              </Typography>
              <Typography variant="body1">
                Latest sports news and updates
              </Typography>
            </Box>
            <IconButton onClick={handleRefresh} disabled={isLoading || isRefetching} sx={{ color: 'white' }}>
              <UpdateIcon />
            </IconButton>
          </Box>
          
          {/* Sport Selector */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <InputLabel sx={{ color: 'white' }}>Sport</InputLabel>
                <Select
                  value={selectedSport}
                  label="Sport"
                  onChange={handleSportChange}
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="nba">NBA</MenuItem>
                  <MenuItem value="nfl">NFL</MenuItem>
                  <MenuItem value="mlb">MLB</MenuItem>
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
                    justifyContent: 'center',
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
                  startIcon={<TrendingUp />}
                  sx={{ 
                    justifyContent: 'center',
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  variant="outlined"
                >
                  Trending
                </Button>
                <Button 
                  fullWidth
                  startIcon={<SparklesIcon />}
                  sx={{ 
                    justifyContent: 'center',
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                  variant="outlined"
                >
                  AI Insights
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Loading/Refreshing Indicator */}
      {(isLoading || isRefetching || refreshing) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Failed to load news
          </Typography>
          <Typography variant="body2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => refetch()}
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search players, teams, or news..."
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
            {categories.find(c => c.id === selectedCategory)?.name} • {filteredProps.length} items
          </Typography>
          <Badge 
            badgeContent={newsCount || 0} 
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
              📈 Trending News
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Most discussed sports news
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
          {trendingProps.map(renderTrendingCard)}
        </Box>
      </Paper>

      {/* Sports News */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              📰 Sports News & Updates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredProps.length} items • Latest from {selectedSport.toUpperCase()}
            </Typography>
          </Box>
          <Chip 
            icon={<Analytics />}
            label="Analytics"
            onClick={() => setShowAnalyticsModal(true)}
            sx={{ bgcolor: '#3b82f6', color: 'white' }}
          />
        </Box>
        
        {isLoading || isRefetching || refreshing ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading {selectedSport.toUpperCase()} news...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Fetching the latest sports updates
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ErrorIcon sx={{ fontSize: 60, color: '#ef4444', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Failed to load news
            </Typography>
            <Typography variant="body2" color="text-secondary" sx={{ mb: 3 }}>
              {error instanceof Error ? error.message : 'Unable to fetch sports news'}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => refetch()}
              startIcon={<UpdateIcon />}
            >
              Retry
            </Button>
          </Box>
        ) : filteredProps.length > 0 ? (
          filteredProps.map(renderPropCard)
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Newspaper sx={{ fontSize: 60, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No news available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery 
                ? `No results found for "${searchQuery}"` 
                : `No ${selectedSport.toUpperCase()} news available at the moment`}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleRefresh}
              startIcon={<UpdateIcon />}
            >
              Refresh News
            </Button>
          </Box>
        )}
        
        {!isLoading && !isRefetching && !refreshing && filteredProps.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredProps.length} of {newsCount || 0} news items
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
