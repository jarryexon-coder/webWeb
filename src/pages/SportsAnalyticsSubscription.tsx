// src/pages/SportsAnalyticsSubscription.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  SportsBasketball as BasketballIcon,
  Bolt as BoltIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SportsAnalyticsSubscription: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(tabParam === 'credits' ? 1 : 0);
  const [creditAmount, setCreditAmount] = useState(100);
  const [purchasing, setPurchasing] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please log in to view your subscription');
          setLoading(false);
          return;
        }

        console.log('Fetching subscription...');
        const response = await fetch('https://python-api-fresh-production.up.railway.app/api/subscriptions/my-subscription', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Subscription data:', data);
        
        if (data && data.subscription && typeof data.subscription === 'object') {
          setSubscription(data.subscription);
        } else {
          setSubscription(null);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handlePurchaseCredits = async () => {
    setPurchasing(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://python-api-fresh-production.up.railway.app/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: creditAmount })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Stripe checkout
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        }
      } else {
        throw new Error('Failed to initiate purchase');
      }
    } catch (err) {
      console.error('Error purchasing credits:', err);
      setError('Failed to purchase credits. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const hasSubscription = subscription && subscription.status === 'active';
  const planName = subscription?.plan_id ? subscription.plan_id.toUpperCase() : 'FREE';
  const isAnalytics = subscription?.plan_id === 'analytics';
  const isGenerator = subscription?.plan_id === 'generator';

  // Credit package options
  const creditPackages = [
    { amount: 50, price: 9.99, popular: false },
    { amount: 100, price: 14.99, popular: true },
    { amount: 250, price: 29.99, popular: false },
    { amount: 500, price: 49.99, popular: false },
    { amount: 1000, price: 89.99, popular: false },
  ];

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your subscription...</Typography>
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Subscription
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your plan, purchase credits, and view billing information
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Current Plan" />
          <Tab label="Buy Credits" icon={<BoltIcon />} iconPosition="start" />
          <Tab label="Billing History" />
        </Tabs>

        {/* Current Plan Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Current Plan Card */}
            <Paper 
              sx={{ 
                p: 4, 
                mb: 4, 
                bgcolor: hasSubscription ? '#c8e6c9' : '#f5f5f5',
                borderRadius: 3
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  {hasSubscription ? (
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#2e7d32' }} />
                  ) : (
                    <CancelIcon sx={{ fontSize: 48, color: '#9e9e9e' }} />
                  )}
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {hasSubscription ? 'Active Subscription' : 'No Active Subscription'}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
                      {planName} Plan
                    </Typography>
                    {hasSubscription && subscription?.current_period_end && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Valid until {new Date(subscription.current_period_end).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {!hasSubscription && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate('/pricing')}
                  >
                    Subscribe Now
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Plan Details */}
            {hasSubscription && subscription && (
              <>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  Plan Details
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Plan Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography color="text.secondary">Plan</Typography>
                          <Typography fontWeight="bold">{planName}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography color="text.secondary">Status</Typography>
                          <Chip 
                            label={subscription.status || 'active'} 
                            size="small" 
                            color={subscription.status === 'active' ? 'success' : 'default'}
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography color="text.secondary">Current Period</Typography>
                          <Typography>
                            {subscription.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString() : 'N/A'} - 
                            {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Features Included</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {isAnalytics && (
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <AnalyticsIcon color="primary" />
                              <Typography>Player Analysis & Advanced Stats</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <TrendingUpIcon color="primary" />
                              <Typography>Real-time Injury Reports</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <BasketballIcon color="primary" />
                              <Typography>Advantage Analysis & Value Analytics</Typography>
                            </Box>
                          </Box>
                        )}
                        {isGenerator && (
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <AnalyticsIcon color="warning" />
                              <Typography>All Analytics Features</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <TrendingUpIcon color="warning" />
                              <Typography>AI-Powered Daily Predictions</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <BasketballIcon color="warning" />
                              <Typography>Combo Builder & Generator</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <BasketballIcon color="warning" />
                              <Typography>Secret Phrases & Insider Insights</Typography>
                            </Box>
                          </Box>
                        )}
                        {!isAnalytics && !isGenerator && (
                          <Typography color="text.secondary">
                            Upgrade to Analytics or Generator plan to unlock features.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        )}

        {/* Buy Credits Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <BoltIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Purchase Generator Credits
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Credits are used for AI-powered generator features including Secret Phrases, Daily Picks, and Combo Builder.
            </Typography>

            <Grid container spacing={3}>
              {creditPackages.map((pkg) => (
                <Grid item xs={12} sm={6} md={4} key={pkg.amount}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: creditAmount === pkg.amount ? '2px solid #1976d2' : 'none',
                      bgcolor: creditAmount === pkg.amount ? 'action.hover' : 'background.paper',
                    }}
                    onClick={() => setCreditAmount(pkg.amount)}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      {pkg.popular && (
                        <Chip 
                          label="Popular" 
                          size="small" 
                          color="primary" 
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                      )}
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {pkg.amount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Credits
                      </Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        ${pkg.price}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${(pkg.price / pkg.amount).toFixed(2)} per credit
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handlePurchaseCredits}
                disabled={purchasing}
              >
                {purchasing ? 'Processing...' : `Purchase ${creditAmount} Credits`}
              </Button>
            </Box>
          </Box>
        )}

        {/* Billing History Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Billing History
            </Typography>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Your billing history will appear here after your first payment.
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default SportsAnalyticsSubscription;
