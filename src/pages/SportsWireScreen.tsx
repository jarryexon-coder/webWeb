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
  Bolt
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// At the top of the file, add:
import { useSportsWire } from '../hooks/useSportsData';

// Fix for __DEV__ error - define it if not defined
declare global {
  var __DEV__: boolean;
}

// Initialize __DEV__ if it doesn't exist
if (typeof __DEV__ === 'undefined') {
  // Set to true for development, false for production
  // You can also check the environment
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
  'beat-writers': '#3b82f6'
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
  
  const { data: playerProps, loading, error } = useSportsWire();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingFilter, setTrendingFilter] = useState('all');
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [filteredProps, setFilteredProps] = useState<PlayerProp[]>([]);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingProps, setTrendingProps] = useState<TrendingProp[]>(MOCK_TRENDING_PROPS);
  
  const categories = [
    { id: 'all', name: 'All Sports', icon: <LocalFireDepartment />, color: '#ef4444' },
    { id: 'NBA', name: 'NBA', icon: <SportsBasketball />, color: '#ef4444' },
    { id: 'NFL', name: 'NFL', icon: <SportsFootball />, color: '#3b82f6' },
    { id: 'MLB', name: 'MLB', icon: <SportsBaseball />, color: '#10b981' },
    { id: 'NHL', name: 'NHL', icon: <SportsHockey />, color: '#1e40af' },
    { id: 'value', name: 'Value Bets', icon: <ShowChart />, color: '#10b981' },
    { id: 'live', name: 'Live Now', icon: <Bolt />, color: '#f59e0b' }
  ];  

  const trendingFilters = [
    { id: 'all', name: 'All' },
    { id: 'NBA', name: 'NBA' },
    { id: 'NFL', name: 'NFL' },
    { id: 'MLB', name: 'MLB' },
    { id: 'NHL', name: 'NHL' },
    { id: 'high-confidence', name: 'High Confidence' },
  ];

  const [analyticsMetrics] = useState({
    totalProps: 128,
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

  // Filter props when category or search changes
  useEffect(() => {
    if (!playerProps || playerProps.length === 0) {
      setFilteredProps(MOCK_PLAYER_PROPS);
      return;
    }

    // Cast playerProps to PlayerProp[] to help TypeScript
    let filtered = [...playerProps] as PlayerProp[];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'value') {
        filtered = filtered.filter(prop => {
          const oddsValue = parseInt(prop.odds);
          return oddsValue > 0 || prop.impliedProbability > 60;
        });
      } else if (selectedCategory === 'high-confidence') {
        filtered = filtered.filter(prop => prop.confidence > 80);
      } else {
        filtered = filtered.filter(prop => prop.sport === selectedCategory);
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(prop => 
        prop.playerName.toLowerCase().includes(query) ||
        prop.team.toLowerCase().includes(query) ||
        prop.propType.toLowerCase().includes(query)
      );
    }
    
    setFilteredProps(filtered);
  }, [selectedCategory, searchQuery, playerProps]);

  const getOddsColor = (odds: string) => {
    if (odds.startsWith('+')) return '#10b981'; // Positive odds = green
    if (odds.startsWith('-')) return '#ef4444'; // Negative odds = red
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
    
    return emojiMap[sport] || '🎯';
  };

  const handleBookmark = (propId: string | number) => {
    // Convert to number for comparison
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
        title: `${prop.playerName} ${prop.propType} Prop`,
        text: `${prop.playerName} ${prop.line} ${prop.odds}`,
        url: window.location.href,
      }).catch((err) => {
        if (__DEV__) {
          console.error('Error sharing:', err);
        }
        navigator.clipboard.writeText(`${prop.playerName} ${prop.propType}: ${prop.line} ${prop.odds}`)
          .then(() => {
            alert('Prop copied to clipboard!');
          })
          .catch(() => {
            alert('Prop information available for sharing');
          });
      });
    } else {
      navigator.clipboard.writeText(`${prop.playerName} ${prop.propType}: ${prop.line} ${prop.odds}`)
        .then(() => {
          alert('Prop copied to clipboard!');
        })
        .catch(() => {
          alert('Prop information available for sharing');
        });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Force refresh by triggering a re-fetch
    setTimeout(() => setRefreshing(false), 1000);
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
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
              <AutoAwesomeIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />
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
    const oddsColor = getOddsColor(prop.odds);
    const confidenceColor = getConfidenceColor(prop.confidence);
    const sportColor = (SPORT_COLORS as Record<string, string>)[prop.sport] || theme.palette.primary.main;
    const isBookmarked = bookmarked.includes(typeof prop.id === 'string' ? parseInt(prop.id) : prop.id);
    
    return (
      <Card key={prop.id} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                label={prop.sport}
                size="small"
                sx={{ 
                  bgcolor: `${sportColor}20`,
                  color: sportColor,
                  fontWeight: 'bold'
                }}
              />
              <Chip 
                label={prop.propType}
                size="small"
                sx={{ 
                  bgcolor: '#f8fafc',
                  color: '#64748b'
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {prop.time}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: sportColor, mr: 2, width: 40, height: 40 }}>
              {prop.playerName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {prop.playerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {prop.team} • {prop.matchup}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Prop Line
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {prop.line}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Odds
                </Typography>
                <Typography variant="h5" fontWeight="bold" color={oddsColor}>
                  {prop.odds}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', width: 60, height: 60, mx: 'auto', mb: 1 }}>
                <CircularProgress 
                  variant="determinate" 
                  value={prop.confidence} 
                  size={60}
                  sx={{ color: confidenceColor }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  <Typography variant="caption" fontWeight="bold">
                    {prop.confidence}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">Confidence</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', width: 60, height: 60, mx: 'auto', mb: 1 }}>
                <CircularProgress 
                  variant="determinate" 
                  value={prop.impliedProbability} 
                  size={60}
                  sx={{ color: '#8b5cf6' }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  <Typography variant="caption" fontWeight="bold">
                    {prop.impliedProbability}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">Implied Prob</Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, mb: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: '50%', 
                  bgcolor: sportColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1
                }}>
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {getEmoji(prop.sport)}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {prop.sport}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">Sport</Typography>
            </Box>
          </Box>
          
          {prop.aiInsights && prop.aiInsights.length > 0 && (
            <Box sx={{ bgcolor: '#f0f9ff', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="#3b82f6" gutterBottom>
                AI Insights
              </Typography>
              {prop.aiInsights.map((insight, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 12, color: '#8b5cf6', mt: 0.5, mr: 1 }} />
                  <Typography variant="caption" color="#1e40af">
                    {insight}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                size="small"
                sx={{ 
                  bgcolor: oddsColor,
                  '&:hover': { bgcolor: oddsColor, opacity: 0.9 }
                }}
              >
                Track Prop
              </Button>
            </Box>
            
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
          📊 Prop Performance Metrics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {playerProps?.length || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total Props</Typography>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(playerProps?.length || 0, 100)} 
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold">
                {analyticsMetrics.hitRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Hit Rate</Typography>
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
          🔥 Hot Sports
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {analyticsMetrics.hotSports.map((sport, index) => {
            const sportColor = (SPORT_COLORS as Record<string, string>)[sport.sport] || theme.palette.primary.main;
            
            return (
              <Grid item xs={12} key={index}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: sportColor }} />
                      <Typography variant="body2" fontWeight="bold">
                        {sport.sport}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {sport.count} props
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(sport.count / analyticsMetrics.totalProps) * 100}
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      bgcolor: `${sportColor}20`,
                      '& .MuiLinearProgress-bar': { 
                        bgcolor: sportColor
                      }
                    }}
                  />
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowAnalyticsModal(false)}>Close Dashboard</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) return <div>Loading player props...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Use playerProps directly in your rendering
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
                SportsWire ({playerProps?.length || 0} props)
              </Typography>
              <Typography variant="body1">
                Player props, odds & analytics insights
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
                Prop Analytics
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                startIcon={<TrendingUp />}
                sx={{ 
                  justifyContent: 'flex-start',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Trending Props
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                fullWidth
                startIcon={<AutoAwesomeIcon />}
                sx={{ 
                  justifyContent: 'flex-start',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                AI Insights
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
            placeholder="Search players, teams, props..."
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
            {categories.find(c => c.id === selectedCategory)?.name} • {filteredProps.length} props
          </Typography>
          <Badge 
            badgeContent={playerProps?.length || 0} 
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
              📈 Trending Props
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Most discussed props with AI insights
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

      {/* Player Props */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              🎯 Player Props
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredProps.length} props • {analyticsMetrics.hitRate}% hit rate
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
            <Typography sx={{ ml: 2 }}>Loading player props...</Typography>
          </Box>
        ) : filteredProps.length > 0 ? (
          filteredProps.map(renderPropCard)
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Newspaper sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No props found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {searchQuery ? 'Try a different search term' : 'Check back soon for new props'}
            </Typography>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </Box>
        )}
        
        {!loading && filteredProps.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filteredProps.length} of {playerProps?.length || 0} props
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
