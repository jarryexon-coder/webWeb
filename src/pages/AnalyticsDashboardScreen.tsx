// src/pages/AnalyticsDashboardScreen.tsx
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  SportsBasketball as BasketballIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const AnalyticsDashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<string | null>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  // Handle back navigation
  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // First check localStorage
        const cachedPlan = localStorage.getItem('userPlan');
        console.log('📦 Cached plan from localStorage:', cachedPlan);
        
        if (cachedPlan) {
          setPlan(cachedPlan);
        }
        
        // Get subscription end date from localStorage
        const cachedEndDate = localStorage.getItem('subscriptionEndDate');
        if (cachedEndDate) {
          setSubscriptionEndDate(cachedEndDate);
        }
        
        // Fetch fresh data from API
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching user profile from API...');
        const response = await fetch('https://python-api-fresh-production.up.railway.app/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Profile data:', data);
        setProfileData(data);
        
        if (data.plan) {
          const freshPlan = data.plan.toLowerCase();
          setPlan(freshPlan);
          localStorage.setItem('userPlan', freshPlan);
          
          if (data.current_period_end) {
            setSubscriptionEndDate(data.current_period_end);
            localStorage.setItem('subscriptionEndDate', data.current_period_end);
          }
        }
      } catch (err) {
        console.error('❌ Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your analytics dashboard...</Typography>
      </Box>
    );
  }

  const currentPlan = plan || 'free';
  const isPremium = currentPlan === 'analytics' || currentPlan === 'generator';

  console.log('🎯 Rendering dashboard - Plan:', currentPlan, 'isPremium:', isPremium);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header with Back Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
        >
          Back
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={() => window.location.reload()}
        >
          Refresh Dashboard
        </Button>
      </Box>

      {/* Hero Banner */}
      <Paper 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          mb: 4, 
          background: isPremium 
            ? 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)' 
            : 'linear-gradient(135deg, #ed6c02 0%, #c77700 100%)',
          color: 'white',
          borderRadius: 3,
          boxShadow: 4
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircleIcon sx={{ fontSize: { xs: 40, md: 64 } }} />
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ fontSize: { xs: '1.8rem', md: '3rem' } }}>
                {isPremium ? 'ANALYTICS PLAN ACTIVE!' : 'FREE PLAN'}
              </Typography>
              {isPremium && subscriptionEndDate && (
                <Typography variant="h6" sx={{ mt: 1, opacity: 0.9 }}>
                  Valid until {new Date(subscriptionEndDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip 
            label={`Plan: ${currentPlan.toUpperCase()}`}
            sx={{ 
              bgcolor: 'white', 
              color: isPremium ? '#2e7d32' : '#ed6c02',
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 2,
              px: 1
            }}
          />
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
            <Typography variant="h4">84%</Typography>
            <Typography color="text.secondary">Prediction Accuracy</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <AnalyticsIcon sx={{ fontSize: 40, color: '#1976d2' }} />
            <Typography variant="h4">1,247</Typography>
            <Typography color="text.secondary">Active Players</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <BasketballIcon sx={{ fontSize: 40, color: '#f57c00' }} />
            <Typography variant="h4">12</Typography>
            <Typography color="text.secondary">Today's Games</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <WarningIcon sx={{ fontSize: 40, color: '#d32f2f' }} />
            <Typography variant="h4">8</Typography>
            <Typography color="text.secondary">Active Injuries</Typography>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Analytics Dashboard
      </Typography>

      {isPremium ? (
        <>
          <Alert severity="success" sx={{ mb: 4 }}>
            <strong>✅ Analytics Plan Active!</strong> You have full access to all premium features including player analysis, injury reports, and edge analysis.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom color="primary">
                    Player Analysis
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Advanced player statistics, projections, and trends:
                  </Typography>
                  <ul>
                    <li>Real-time player stats</li>
                    <li>Performance projections</li>
                    <li>Historical trends</li>
                    <li>Matchup analysis</li>
                  </ul>
                  <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                    View Player Analysis
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom color="primary">
                    Injury Reports
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Real-time injury updates and player availability:
                  </Typography>
                  <ul>
                    <li>Daily injury reports</li>
                    <li>Return timelines</li>
                    <li>Impact analysis</li>
                    <li>Replacement recommendations</li>
                  </ul>
                  <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                    View Injury Reports
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom color="primary">
                    Edge Analysis
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Value betting insights and edge calculations:
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">+8.3%</Typography>
                        <Typography variant="caption">Average Edge</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">156</Typography>
                        <Typography variant="caption">Value Bets Found</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">73%</Typography>
                        <Typography variant="caption">Success Rate</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  <Button variant="contained" fullWidth sx={{ mt: 3 }}>
                    View Edge Analysis
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Free Plan</strong> - <a href="/subscription" style={{ fontWeight: 'bold' }}>Upgrade to Analytics</a> to unlock:
          <ul style={{ marginTop: 8, marginBottom: 0 }}>
            <li>Player Analysis & Advanced Statistics</li>
            <li>Real-time Injury Reports</li>
            <li>Value Betting & Edge Analysis</li>
            <li>AI-Powered Predictions</li>
          </ul>
        </Alert>
      )}
    </Container>
  );
};

const AnalyticsDashboardScreen: React.FC = () => {
  return (
    <ProtectedRoute screenName="AnalyticsDashboard">
      <AnalyticsDashboardContent />
    </ProtectedRoute>
  );
};

export default AnalyticsDashboardScreen;
