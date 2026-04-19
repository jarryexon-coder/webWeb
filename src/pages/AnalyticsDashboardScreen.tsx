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
import { useAuth } from '../contexts/AuthContext';
import PlanFeaturesDisplay from '../components/PlanFeaturesDisplay';

const AnalyticsDashboardContent: React.FC = () => {
  const navigate = useNavigate();
  const { user, isInfluencer, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  const handleGoBack = () => navigate(-1);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const cachedPlan = localStorage.getItem('userPlan');
        if (cachedPlan) setPlan(cachedPlan);
        const cachedEndDate = localStorage.getItem('subscriptionEndDate');
        if (cachedEndDate) setSubscriptionEndDate(cachedEndDate);

        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('https://python-api-fresh-production.up.railway.app/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
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
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading || authLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your analytics dashboard...</Typography>
      </Box>
    );
  }

  // REMOVED: Plan-based access control - now showing premium content to everyone
  // const currentPlan = profileData?.plan || plan || 'free';
  // const isPremium = isInfluencer || (currentPlan === 'analytics' || currentPlan === 'generator');

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack}>Back</Button>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => window.location.reload()}>
          Refresh Dashboard
        </Button>
      </Box>

      {/* Hero Banner - Changed to show success for all users */}
      <Paper sx={{ p: { xs: 3, md: 5 }, mb: 4, background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: 'white', borderRadius: 3, boxShadow: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <CheckCircleIcon sx={{ fontSize: { xs: 40, md: 64 } }} />
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ fontSize: { xs: '1.8rem', md: '3rem' } }}>
                ANALYTICS DASHBOARD
              </Typography>
              <Typography variant="h6" sx={{ mt: 1, opacity: 0.9 }}>
                Full access for all users
              </Typography>
            </Box>
          </Box>
          <Chip label="FULL ACCESS" sx={{ bgcolor: 'white', color: '#2e7d32', fontWeight: 'bold', fontSize: '1rem', py: 2, px: 1 }} />
        </Box>
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>Available Features:</Typography>
          <PlanFeaturesDisplay currentPlan="generator" /> {/* Changed to show all features */}
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}><TrendingUpIcon sx={{ fontSize: 40, color: '#2e7d32' }} /><Typography variant="h4">84%</Typography><Typography color="text.secondary">Prediction Accuracy</Typography></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}><AnalyticsIcon sx={{ fontSize: 40, color: '#1976d2' }} /><Typography variant="h4">1,247</Typography><Typography color="text.secondary">Active Players</Typography></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}><BasketballIcon sx={{ fontSize: 40, color: '#f57c00' }} /><Typography variant="h4">12</Typography><Typography color="text.secondary">Today's Games</Typography></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', py: 2 }}><WarningIcon sx={{ fontSize: 40, color: '#d32f2f' }} /><Typography variant="h4">8</Typography><Typography color="text.secondary">Active Injuries</Typography></Card>
        </Grid>
      </Grid>

      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>Analytics Dashboard</Typography>

      {/* REMOVED: Premium check - now showing premium content to all users */}
      <>
        <Alert severity="success" sx={{ mb: 4 }}>
          <strong>✅ Full Access!</strong> You have complete access to all features including player analysis, injury reports, and advantage analysis.
        </Alert>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom color="primary">Player Analysis</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" paragraph>Advanced player statistics, projections, and trends:</Typography>
                <ul><li>Real-time player stats</li><li>Performance projections</li><li>Historical trends</li><li>Matchup analysis</li></ul>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>View Player Analysis</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom color="primary">Injury Reports</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" paragraph>Real-time injury updates and player availability:</Typography>
                <ul><li>Daily injury reports</li><li>Return timelines</li><li>Impact analysis</li><li>Replacement recommendations</li></ul>
                <Button variant="contained" fullWidth sx={{ mt: 2 }}>View Injury Reports</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom color="primary">Advantage Analysis</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" paragraph>Value analytics insights and advantage calculations:</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">+8.3%</Typography><Typography variant="caption">Average Advantage</Typography></Paper></Grid>
                  <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">156</Typography><Typography variant="caption">Value Bets Found</Typography></Paper></Grid>
                  <Grid item xs={12} md={4}><Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}><Typography variant="h6">73%</Typography><Typography variant="caption">Success Rate</Typography></Paper></Grid>
                </Grid>
                <Button variant="contained" fullWidth sx={{ mt: 3 }}>View Advantage Analysis</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    </Container>
  );
};

// REMOVED: ProtectedRoute wrapper - now accessible to everyone
const AnalyticsDashboardScreen: React.FC = () => {
  return <AnalyticsDashboardContent />;
};

export default AnalyticsDashboardScreen;
