// src/pages/NewsDeskScreen.tsx
import React, { useState, useEffect } from 'react';
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
  OutlinedInput,
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
  AddCircle as AddIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';

// Mock data and hooks
import { useSearch } from '../providers/SearchProvider';
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

const NewsDeskScreen = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  // State management
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearch();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('updates');
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [winningPosts, setWinningPosts] = useState<WinPost[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<UpdateItem[]>([]);
  const [filteredWinningPosts, setFilteredWinningPosts] = useState<WinPost[]>([]);
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [user] = useState(null); // Mock user state
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postAmount, setPostAmount] = useState('');
  const [postSport, setPostSport] = useState('NFL');
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
    { value: 'NCAAF', label: 'NCAAF', icon: <TrendingIcon fontSize="small" /> },
  ];

  useEffect(() => {
    logScreenView('NewsDeskScreen');
    fetchUpdates();
  }, []);

  const fetchUpdates = async (isRefresh = false) => {
    try {
      setLoading(true);
      
      // Mock data
      const updatesData = getSampleUpdates();
      const winsData = getSampleWins();

      setUpdates(updatesData);
      setFilteredUpdates(updatesData);
      setWinningPosts(winsData);
      setFilteredWinningPosts(winsData);
      setLastRefresh(new Date());

      // Mock read status
      const mockReadStatus: Record<string, boolean> = {};
      updatesData.forEach(update => {
        mockReadStatus[update.id] = Math.random() > 0.5;
      });
      setReadStatus(mockReadStatus);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = async () => {
    const query = searchInput.trim();
    
    if (query) {
      await addToSearchHistory(query);
      setSearchQuery(query);
      setShowSearchHistory(false);
      filterContent(query);
    } else {
      setSearchQuery('');
      setFilteredUpdates(updates);
      setFilteredWinningPosts(winningPosts);
    }
  };

  const filterContent = (query: string) => {
    const searchLower = query.toLowerCase().trim();
    
    if (activeTab === 'updates') {
      const filtered = updates.filter(update => 
        update.title.toLowerCase().includes(searchLower) ||
        update.description.toLowerCase().includes(searchLower) ||
        updateCategories[update.category]?.label.toLowerCase().includes(searchLower)
      );
      setFilteredUpdates(filtered);
    } else {
      const filtered = winningPosts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.description.toLowerCase().includes(searchLower) ||
        post.sport.toLowerCase().includes(searchLower) ||
        post.userName.toLowerCase().includes(searchLower)
      );
      setFilteredWinningPosts(filtered);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setFilteredUpdates(updates);
    setFilteredWinningPosts(winningPosts);
    setShowSearchHistory(false);
  };

  const markAsRead = (id: string) => {
    const updatedReadStatus = { ...readStatus, [id]: true };
    setReadStatus(updatedReadStatus);
  };

  const likePost = (postId: string) => {
    const updatedPosts = winningPosts.map(post => 
      post.id === postId 
        ? { ...post, likes: (post.likes || 0) + 1 }
        : post
    );
    setWinningPosts(updatedPosts);
    setFilteredWinningPosts(updatedPosts);
  };

  const postWin = async () => {
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
      setFilteredWinningPosts(newWinningPosts);

      setSnackbar({ open: true, message: 'Your winning result has been posted!', severity: 'success' });
      
      setPostTitle('');
      setPostDescription('');
      setPostAmount('');
      setPostSport('NFL');
      setShowPostModal(false);
      
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to post your win', severity: 'error' });
    } finally {
      setPosting(false);
    }
  };

  const unreadCount = updates.filter(update => !readStatus[update.id]).length;

  const getSportColor = (sport: string) => {
    const colors: Record<string, string> = {
      'NFL': '#3b82f6',
      'NBA': '#ef4444',
      'NHL': '#0ea5e9',
      'MLB': '#f59e0b',
      'NCAAB': '#10b981',
      'NCAAF': '#8b5cf6',
    };
    return colors[sport] || '#6b7280';
  };

  const getSampleUpdates = (): UpdateItem[] => [
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

  const getSampleWins = (): WinPost[] => [
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
  ];

  const renderHeader = () => (
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
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          )}
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

          {/* Search History Dropdown */}
          {showSearchHistory && searchHistory.length > 0 && (
            <Paper sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              zIndex: 10,
              maxHeight: 300,
              overflow: 'auto',
            }}>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Recent Searches
                </Typography>
                <Button size="small" color="error" onClick={clearSearchHistory}>
                  Clear All
                </Button>
              </Box>
              <List>
                {searchHistory.map((item, index) => (
                  <ListItemButton
                    key={index}
                    onClick={() => {
                      setSearchInput(item);
                      handleSearchSubmit();
                    }}
                  >
                    <TimeIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText primary={item} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
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
  );

  const renderUpdateCard = (update: UpdateItem) => {
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
  };

  const renderWinningPost = (post: WinPost) => (
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
  );

  if (loading && updates.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {renderHeader()}
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
      {renderHeader()}
      
      <Container maxWidth="lg">
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
            Last updated: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
