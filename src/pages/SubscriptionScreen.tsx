// src/pages/SubscriptionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  CardActions,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as SparklesIcon,
  RocketLaunch as RocketIcon,
  Bolt as BoltIcon,
  ShoppingCart as ShoppingCartIcon,
  Discount as DiscountIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Subscription packages with correct prices
const subscriptionPackages = [
  {
    id: 'starter',
    name: 'Super Stats',
    price: { month: 5.99, year: 49.99 },
    priceId: { month: 'price_1TBpvaA3tlI8MNZjT4rmDzFm', year: 'price_1TBq2UA3tlI8MNZjD3ry0Ell' },
    features: [
      '5 supercharged AI stats screens',
      'Advanced handicapping tools',
      'Real-time betting insights',
      'Player performance analytics',
      'Game prediction models',
    ],
    icon: <AnalyticsIcon />,
    color: '#3b82f6',
  },
  {
    id: 'analytics',
    name: 'Analytics Package',
    price: { month: 19.99, year: 179.99 },
    priceId: { month: 'price_1TBq5hA3tlI8MNZjkExuKQJ2', year: 'price_1TBq6rA3tlI8MNZjabiqWjwq' },
    features: [
      'All Super Stats features',
      'Player Analysis & Advanced Stats',
      'Real-time Injury Reports',
      'Advantage Analysis & Top Projections',
      'AI-Powered Predictions',
    ],
    icon: <AnalyticsIcon />,
    color: '#8b5cf6',
    popular: true,
  },
  {
    id: 'generator',
    name: 'Generator Package',
    price: { month: 39.99, year: 359.99 },
    priceId: { month: 'price_1TBqTrA3tlI8MNZjn2kvGXI3', year: 'price_1TBqVUA3tlI8MNZjlDK9POuj' },
    features: [
      'All Analytics features',
      '8 daily AI-generated predictions',
      'Combo builder tools',
      'Expert pick analysis',
      'Game & prop predictions',
      'Randomized prediction engine',
      'Secret Phrases & Insider Insights',
      'Priority generator access',
    ],
    icon: <SparklesIcon />,
    color: '#ef4444',
  },
];

// Generator credit packages
const creditPackages = [
  { credits: 1, price: 1.99, priceDisplay: '$1.99', pricePerCredit: 1.99, popular: false },
  { credits: 10, price: 14.90, priceDisplay: '$14.90', pricePerCredit: 1.49, popular: true, discount: 'Save 25%' },
  { credits: 20, price: 25.80, priceDisplay: '$25.80', pricePerCredit: 1.29, discount: 'Save 35%' },
  { credits: 50, price: 44.50, priceDisplay: '$44.50', pricePerCredit: 0.89, discount: 'Save 55%' },
];

const SubscriptionScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // Get user to check eligibility
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');
  const [selectedCredits, setSelectedCredits] = useState<number>(10);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Promo code state
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [promoValid, setPromoValid] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);

  // Stripe redirect handling
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  // Check URL for tab parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'credits') setActiveTab(1);
  }, [searchParams]);

  // Handle Stripe success/cancel redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === 'true') {
      setShowSuccessAlert(true);
      fetchSubscription();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      setShowCancelAlert(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoadingSubscription(false);
        return;
      }
      const response = await fetch('https://python-api-fresh-production.up.railway.app/api/subscriptions/my-subscription', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.subscription) setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleGoBack = () => navigate(-1);

  // Promo code validation
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    setPromoLoading(true);
    setPromoError('');
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://python-api-fresh-production.up.railway.app/api/promo/validate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() })
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setAppliedPromo(promoCode.trim());
        setDiscountPercent(data.discount_percent || 0);
        setPromoValid(true);
        setPromoError(`✅ Promo applied! ${data.discount_percent}% off`);
      } else {
        setPromoValid(false);
        setPromoError(data.message || 'Invalid or expired promo code');
      }
    } catch (error) {
      setPromoError('Failed to validate promo code. Please try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleClearPromo = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoValid(false);
    setPromoError('');
  };

  const getDiscountedPrice = (originalPrice: number): number => {
    if (!promoValid || discountPercent === 0) return originalPrice;
    return Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;
  };

  // Subscription checkout (existing)
const handleSubscriptionPurchase = async (planId: string) => {
  setCheckoutLoading(true);
  try {
    const token = localStorage.getItem('authToken');
    const promoToSend = promoValid ? appliedPromo : null;
    
    // Use the dynamic pricing endpoint instead of price IDs
    const response = await fetch('https://python-api-fresh-production.up.railway.app/api/subscriptions/create-checkout', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ planId, interval: selectedInterval })
    });
    
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Failed to create checkout session');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    alert('Failed to process subscription. Please try again.');
  } finally {
    setCheckoutLoading(false);
  }
};

  // Credits purchase (existing)
  const handleCreditsPurchase = async () => {
    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://python-api-fresh-production.up.railway.app/api/generator/credits/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: selectedCredits })
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Failed to create checkout session');
    } catch (error) {
      console.error('Credits purchase error:', error);
      alert('Failed to process credits purchase. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Influencer checkout using the backend endpoint (planId: 'influencer')
  const handleInfluencerCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://python-api-fresh-production.up.railway.app/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: 'influencer',
          interval: 'month',
          promoCode: null
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Influencer checkout error:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const hasActiveSubscription = subscription?.status === 'active';
  const currentPlan = subscription?.plan_id;

  if (loadingSubscription) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Success/Cancel Snackbars */}
      <Snackbar open={showSuccessAlert} autoHideDuration={6000} onClose={() => setShowSuccessAlert(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setShowSuccessAlert(false)}>🎉 Subscription successful! Your plan is now active.</Alert>
      </Snackbar>
      <Snackbar open={showCancelAlert} autoHideDuration={6000} onClose={() => setShowCancelAlert(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="info" onClose={() => setShowCancelAlert(false)}>Subscription canceled. You can try again anytime.</Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack}>Back</Button>
        <Button startIcon={<RefreshIcon />} onClick={() => window.location.reload()} variant="outlined">Refresh</Button>
      </Box>

      {/* Active Subscription Banner */}
      {hasActiveSubscription && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <Box>
              <Typography variant="body1" fontWeight="bold">✅ Active {currentPlan?.toUpperCase()} Plan</Typography>
              {subscription.current_period_end && (
                <Typography variant="caption">Valid until {new Date(subscription.current_period_end).toLocaleDateString()}</Typography>
              )}
            </Box>
            <Button size="small" color="inherit" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </Box>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Subscription Plans" />
          <Tab label="Generator Credits" />
        </Tabs>

        {/* Subscription Plans Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>Choose Your Plan</Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>Select the perfect package for your betting success</Typography>

            {/* Billing Interval Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Paper sx={{ p: 0.5, display: 'inline-flex', gap: 1 }}>
                <Button variant={selectedInterval === 'month' ? 'contained' : 'outlined'} onClick={() => setSelectedInterval('month')}>Monthly</Button>
                <Button variant={selectedInterval === 'year' ? 'contained' : 'outlined'} onClick={() => setSelectedInterval('year')}>Yearly <Chip label="Save 20%" size="small" sx={{ ml: 1 }} /></Button>
              </Paper>
            </Box>

            {/* Packages Grid */}
            <Grid container spacing={3}>
              {subscriptionPackages.map((pkg) => {
                const originalPrice = pkg.price[selectedInterval];
                const finalPrice = getDiscountedPrice(originalPrice);
                const hasDiscount = promoValid && discountPercent > 0;
                const isCurrentPlan = currentPlan === pkg.id && hasActiveSubscription;
                return (
                  <Grid item xs={12} md={4} key={pkg.id}>
                    <Card sx={{ height: '100%', position: 'relative', border: pkg.popular ? '2px solid #ff9800' : 'none', opacity: isCurrentPlan ? 0.8 : 1 }}>
                      {pkg.popular && <Chip label="Most Popular" color="warning" size="small" sx={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }} />}
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar sx={{ bgcolor: `${pkg.color}20`, color: pkg.color, mr: 2 }}>{pkg.icon}</Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">{pkg.name}</Typography>
                            {isCurrentPlan && <Chip label="Current Plan" size="small" color="success" />}
                          </Box>
                        </Box>
                        <Typography variant="h3" fontWeight="bold" color="primary">
                          ${finalPrice}<Typography component="span" variant="body2" color="text.secondary">/{selectedInterval}</Typography>
                        </Typography>
                        {hasDiscount && <Typography variant="body2" color="success.main" sx={{ mt: 0.5 }}><s>${originalPrice}</s> • {discountPercent}% off</Typography>}
                        <Divider sx={{ my: 2 }} />
                        {pkg.features.map((feature, i) => (
                          <Box key={i} display="flex" alignItems="center" mb={1}>
                            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                            <Typography variant="body2">{feature}</Typography>
                          </Box>
                        ))}
                      </CardContent>
                      <CardActions sx={{ p: 2 }}>
                        <Button fullWidth variant={isCurrentPlan ? "outlined" : "contained"} color="primary" onClick={() => handleSubscriptionPurchase(pkg.id)} disabled={checkoutLoading || isCurrentPlan} startIcon={checkoutLoading ? <CircularProgress size={20} /> : <ShoppingCartIcon />}>
                          {isCurrentPlan ? 'CURRENT PLAN' : `SUBSCRIBE $${finalPrice}/${selectedInterval}`}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Promo Code Section */}
            <Paper sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5' }}>
              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <DiscountIcon color="primary" />
                <TextField
                  placeholder="Enter promo code"
                  size="small"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoValid}
                  sx={{ flex: 1, minWidth: 200 }}
                  InputProps={{ endAdornment: promoError && <InputAdornment position="end"><Typography variant="caption" color="error">{promoError}</Typography></InputAdornment> }}
                />
                {promoValid ? (
                  <Button variant="outlined" color="error" onClick={handleClearPromo}>Remove</Button>
                ) : (
                  <Button variant="outlined" onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}>
                    {promoLoading ? <CircularProgress size={24} /> : 'Apply'}
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Influencer Access Section - Only show if user is eligible */}
            {user?.isInfluencerEligible === true && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>🎁 Exclusive Influencer Access</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Claim your free lifetime access below.
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleInfluencerCheckout}
                  disabled={checkoutLoading}
                  startIcon={checkoutLoading ? <CircularProgress size={20} /> : <RocketIcon />}
                >
                  {checkoutLoading ? 'Processing...' : 'Claim Influencer Access (Free)'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Generator Credits Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>Generator Credits</Typography>
            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>Purchase credits to use the AI generator features</Typography>

            {subscription?.plan_id === 'generator' && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">You have <strong>{subscription.credits || 0}</strong> generator credits remaining.</Typography>
              </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 4 }}>
              {creditPackages.map((pkg) => (
                <Grid item xs={12} sm={6} md={3} key={pkg.credits}>
                  <Card sx={{ cursor: 'pointer', border: selectedCredits === pkg.credits ? '2px solid #1976d2' : '1px solid #e0e0e0', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }, height: '100%' }} onClick={() => setSelectedCredits(pkg.credits)}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      {pkg.popular && <Chip label="Best Value" color="warning" size="small" sx={{ mb: 1 }} />}
                      <Typography variant="h2" fontWeight="bold" color="primary">{pkg.credits}</Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Generator Credits</Typography>
                      <Typography variant="h4" fontWeight="bold">{pkg.priceDisplay}</Typography>
                      {pkg.discount && <Chip label={pkg.discount} size="small" color="success" sx={{ mt: 1 }} />}
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>${pkg.pricePerCredit.toFixed(2)} per credit</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Button fullWidth variant="contained" size="large" onClick={handleCreditsPurchase} disabled={checkoutLoading} startIcon={checkoutLoading ? <CircularProgress size={24} /> : <BoltIcon />} sx={{ py: 1.5, fontSize: '1.1rem' }}>
              Purchase {selectedCredits} Credits - {creditPackages.find(c => c.credits === selectedCredits)?.priceDisplay}
            </Button>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>Credits never expire and can be used for any AI generator feature</Typography>
          </Box>
        )}
      </Paper>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
          <Box display="flex" alignItems="center"><CheckCircleIcon sx={{ mr: 1 }} />Purchase Successful!</Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 80, height: 80, mx: 'auto', mb: 3 }}><RocketIcon fontSize="large" /></Avatar>
          <Typography variant="h5" fontWeight="bold" gutterBottom>Welcome to Premium!</Typography>
          <Typography variant="body1" color="text.secondary">Your purchase has been processed successfully.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSuccessModal(false)}>Continue Shopping</Button>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionScreen;
