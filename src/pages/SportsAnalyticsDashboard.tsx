// src/pages/SportsAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  ShoppingCart as ShoppingCartIcon,
  Bolt as BoltIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  status: string;
  plan: string;
  invoice_url?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface UserPreferences {
  favoriteSports: string[];
  favoriteTeams: string[];
  notifications: boolean;
  darkMode: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  paymentMethods: any[];
  billingHistory: BillingRecord[];
  credits?: number;
}

interface Subscription {
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  features?: string[];
  credits?: number;
}

interface Stats {
  totalPredictions: number;
  winRate: number;
  totalSimulatedGain: number;
  activeDays: number;
  promo_codes?: any[];
}

const SportsAnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle back navigation
  const handleGoBack = () => {
    navigate(-1);
  };

  const enhanceSubscriptionWithFeatures = (subData: any): Subscription | null => {
    if (!subData) return null;

    const features = {
      analytics: [
        'Player Analysis & Advanced Stats',
        'Real-time Injury Reports',
        'Advantage Analysis & Top Projections',
        'AI-Powered Predictions',
      ],
      generator: [
        'All Analytics features',
        '8 daily AI-generated predictions',
        'Combo builder tools',
        'Expert pick analysis',
        'Secret Phrases & Insider Insights',
        'Priority generator access',
      ],
      starter: [
        '5 supercharged AI stats screens',
        'Advanced handicapping tools',
        'Real-time analytics insights',
        'Player performance analytics',
        'Game prediction models',
      ],
    };

    return {
      ...subData,
      features: features[subData.plan_id as keyof typeof features] || [],
    };
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please log in to view your dashboard');
          setLoading(false);
          return;
        }

        // Fetch subscription data
        const subResponse = await fetch(
          'https://python-api-fresh-production.up.railway.app/api/subscriptions/my-subscription',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (subResponse.ok) {
          const subData = await subResponse.json();
          if (subData.subscription) {
            const enhancedSub = enhanceSubscriptionWithFeatures(subData.subscription);
            setSubscription(enhancedSub);
          }
        }

        // Fetch user profile
        const profileResponse = await fetch(
          'https://python-api-fresh-production.up.railway.app/api/user/profile',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const transformedUser: User = {
            id: profileData.id || '1',
            name: profileData.displayName || profileData.email || 'User',
            email: profileData.email || '',
            preferences: {
              favoriteSports: profileData.favoriteSports || ['NBA', 'NFL', 'NHL'],
              favoriteTeams: profileData.favoriteTeams || [],
              notifications: profileData.notifications ?? true,
              darkMode: profileData.darkMode ?? false,
            },
            paymentMethods: profileData.paymentMethods || [],
            billingHistory: profileData.billingHistory || [],
            credits: profileData.credits || 0,
          };
          setUser(transformedUser);
          setBillingHistory(transformedUser.billingHistory);
        }

        // Fetch stats
        try {
          const statsResponse = await fetch(
            'https://python-api-fresh-production.up.railway.app/api/user/stats',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          } else {
            setStats({
              totalPredictions: 0,
              winRate: 0,
              totalSimulatedGain: 0,
              activeDays: 0,
              promo_codes: [],
            });
          }
        } catch (err) {
          setStats({
            totalPredictions: 0,
            winRate: 0,
            totalSimulatedGain: 0,
            activeDays: 0,
            promo_codes: [],
          });
        }

        // Fetch activity
        try {
          const activityResponse = await fetch(
            'https://python-api-fresh-production.up.railway.app/api/user/activity',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            setActivity(Array.isArray(activityData) ? activityData : []);
          }
        } catch (err) {
          setActivity([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const hasActiveSubscription = subscription?.status === 'active';
  const planName = subscription?.plan_id?.toUpperCase() || 'FREE';
  const isAnalytics = subscription?.plan_id === 'analytics';
  const isGenerator = subscription?.plan_id === 'generator';
  const isStarter = subscription?.plan_id === 'starter';

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your dashboard...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with back button */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleGoBack}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold">
            Sports Analytics Dashboard
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/subscription')}
          >
            Subscription Plans
          </Button>
          <Button
            variant="outlined"
            startIcon={<BoltIcon />}
            onClick={() => navigate('/subscription?tab=credits')}
          >
            Buy Credits
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Active Subscription Banner */}
      {hasActiveSubscription && subscription && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#c8e6c9', borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Active {planName} Plan
                </Typography>
                {subscription.current_period_end && (
                  <Typography variant="body2">
                    Valid until {new Date(subscription.current_period_end).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box display="flex" gap={1}>
              {planName !== 'GENERATOR' && (
                <Button 
                  variant="contained" 
                  color="warning"
                  onClick={() => navigate('/subscription')}
                >
                  Upgrade Plan
                </Button>
              )}
              <Button 
                variant="outlined" 
                onClick={() => navigate('/subscription?tab=credits')}
                startIcon={<BoltIcon />}
              >
                Buy Credits
              </Button>
            </Box>
          </Box>

          {/* Features */}
          {subscription.features && subscription.features.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Features Included:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {subscription.features.map((feature, index) => (
                  <Chip key={index} label={feature} size="small" color="success" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* No Subscription Banner */}
      {!hasActiveSubscription && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff3e0', borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <CancelIcon sx={{ fontSize: 40, color: '#f57c00' }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  No Active Subscription
                </Typography>
                <Typography variant="body2">
                  Upgrade to access premium features and AI predictions
                </Typography>
              </Box>
            </Box>
            <Button variant="contained" color="primary" onClick={() => navigate('/subscription')}>
              View Plans
            </Button>
          </Box>
        </Paper>
      )}

      {/* Generator Credits Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            <BoltIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Generator Credits
          </Typography>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => navigate('/subscription?tab=credits')}
          >
            Buy More Credits
          </Button>
        </Box>
        <Typography variant="h3" fontWeight="bold">
          {user?.credits || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Credits remaining for AI generator features
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(100, ((user?.credits || 0) / 100) * 100)} 
          sx={{ mt: 2, height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Predictions
              </Typography>
              <Typography variant="h4">{stats?.totalPredictions || 0}</Typography>
              <TrendingUpIcon color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h4">{stats?.winRate || 0}%</Typography>
              <LinearProgress variant="determinate" value={stats?.winRate || 0} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Simulated Gain
              </Typography>
              <Typography variant="h4">${stats?.totalSimulatedGain || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Lifetime earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Days
              </Typography>
              <Typography variant="h4">{stats?.activeDays || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Days with activity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Recent Activity" />
          <Tab label="Billing History" />
          <Tab label="Preferences" />
          <Tab label="Promo Codes" />
        </Tabs>

        {/* Recent Activity Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <List>
              {activity && activity.length > 0 ? (
                activity
                  .filter(
                    (item) =>
                      searchTerm === '' ||
                      item.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemAvatar>
                        <Avatar>
                          {item.type === 'prediction' && <TrendingUpIcon />}
                          {item.type === 'subscription' && <ReceiptIcon />}
                          {item.type === 'payout' && <PaymentIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.description}
                        secondary={new Date(item.timestamp).toLocaleString()}
                      />
                    </ListItem>
                  ))
              ) : (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                  No recent activity. Start making predictions to see them here!
                </Typography>
              )}
            </List>
          </Box>
        )}

        {/* Billing History Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {billingHistory && billingHistory.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                        <TableCell>{record.plan}</TableCell>
                        <TableCell>${record.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={record.status}
                            size="small"
                            color={record.status === 'paid' ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                No billing history available
              </Typography>
            )}
          </Box>
        )}

        {/* Preferences Tab */}
        {activeTab === 2 && user && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Favorite Sports
            </Typography>
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {user.preferences.favoriteSports && user.preferences.favoriteSports.length > 0 ? (
                user.preferences.favoriteSports.map((sport) => (
                  <Chip key={sport} label={sport} color="primary" />
                ))
              ) : (
                <Typography color="text.secondary">No favorite sports selected</Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Favorite Teams
            </Typography>
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {user.preferences.favoriteTeams && user.preferences.favoriteTeams.length > 0 ? (
                user.preferences.favoriteTeams.map((team) => (
                  <Chip key={team} label={team} variant="outlined" />
                ))
              ) : (
                <Typography color="text.secondary">No favorite teams selected</Typography>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            <FormControlLabel
              control={<Switch checked={user.preferences.notifications} />}
              label="Enable Notifications"
            />
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={<Switch checked={user.preferences.darkMode} />}
                label="Dark Mode"
              />
            </Box>
          </Box>
        )}

        {/* Promo Codes Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Available Promo Codes
            </Typography>
            {stats?.promo_codes && stats.promo_codes.length > 0 ? (
              <Grid container spacing={2}>
                {stats.promo_codes.map((code, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {code}
                      </Typography>
                      <Button variant="outlined" size="small" startIcon={<ShareIcon />}>
                        Copy Code
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                No promo codes available at this time
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/nba-dashboard')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <BasketballIcon sx={{ fontSize: 48, color: '#f44336', mb: 2 }} />
              <Typography variant="h6">NBA Analytics</Typography>
              <Typography variant="body2" color="text.secondary">
                View player props, predictions, and stats
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/nfl')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <FootballIcon sx={{ fontSize: 48, color: '#4caf50', mb: 2 }} />
              <Typography variant="h6">NFL Analytics</Typography>
              <Typography variant="body2" color="text.secondary">
                NFL predictions and player analysis
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => navigate('/parlay-architect')}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AnalyticsIcon sx={{ fontSize: 48, color: '#2196f3', mb: 2 }} />
              <Typography variant="h6">Combo Builder</Typography>
              <Typography variant="body2" color="text.secondary">
                Build winning parlays with AI
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SportsAnalyticsDashboard;
