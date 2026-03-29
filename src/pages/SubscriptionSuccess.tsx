// src/pages/SubscriptionSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RocketLaunch as RocketIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import Confetti from 'react-confetti';
import { useWindowSize } from '../hooks/useWindowSize';

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const { width, height } = useWindowSize();

  const sessionId = searchParams.get('session_id');
  const purchaseType = searchParams.get('type'); // 'credits' or null

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please log in to verify your subscription');
          setLoading(false);
          return;
        }

        setActiveStep(1);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setActiveStep(2);
        
        const response = await fetch('https://python-api-fresh-production.up.railway.app/api/subscriptions/verify-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        });

        const data = await response.json();
        
        setActiveStep(3);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (data.success && data.subscription) {
          setSubscription(data.subscription);
          setActiveStep(4);
        } else {
          setError(data.message || 'Subscription verification failed');
        }
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError('Failed to verify subscription. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifySubscription();
  }, [sessionId]);

  const handleGoToSubscription = () => {
    navigate('/subscription');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Verifying your purchase...
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step><StepLabel>Processing</StepLabel></Step>
            <Step><StepLabel>Verifying</StepLabel></Step>
            <Step><StepLabel>Activating</StepLabel></Step>
            <Step><StepLabel>Complete!</StepLabel></Step>
          </Stepper>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant="body1" color="text.secondary" paragraph>
            Please contact support if you believe this is an error.
          </Typography>
          <Button
            variant="contained"
            onClick={handleGoToSubscription}
            sx={{ mt: 2 }}
          >
            Back to Subscription
          </Button>
        </Paper>
      </Container>
    );
  }

  const planName = subscription?.plan_id?.toUpperCase() || 'PREMIUM';
  const isCredits = purchaseType === 'credits';

  return (
    <>
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.2}
      />
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
            mb: 4,
          }}
        >
          <Box>
            <CheckCircleIcon sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h2" fontWeight="bold" gutterBottom>
              {isCredits ? 'Credits Added! 🎉' : 'Thank You! 🎉'}
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9 }}>
              {isCredits 
                ? 'Your generator credits have been added successfully!' 
                : `Your ${planName} Plan is now active!`}
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                What's Next?
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  1. {isCredits ? 'Use Your Credits' : 'Explore Your Dashboard'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCredits 
                    ? 'Head to the Generator section to use your new credits for AI predictions.' 
                    : 'Go to your analytics dashboard to access all your premium features.'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  2. Check Your Subscription Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View your active plan, billing history, and manage your subscription.
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="h6" gutterBottom color="primary">
                  3. Need Help?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Contact our support team at{' '}
                  <a href="mailto:support@sportsanalyticsgpt.com">support@sportsanalyticsgpt.com</a>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 4, bgcolor: '#f5f5f5' }}>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<DashboardIcon />}
                onClick={handleGoToDashboard}
                sx={{ mb: 2, py: 1.5 }}
              >
                Go to Dashboard
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={handleGoToSubscription}
                sx={{ mb: 2, py: 1.5 }}
              >
                Back to Subscription
              </Button>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="body2" color="text.secondary" align="center">
                {isCredits 
                  ? 'Your credits are available immediately.' 
                  : 'Your subscription is now active.'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default SubscriptionSuccess;
