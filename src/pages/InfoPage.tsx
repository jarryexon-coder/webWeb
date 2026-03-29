// src/pages/InfoPage.tsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  alpha,
  useTheme,
  Breadcrumbs,
  Link,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Info as InfoIcon,
  School as SchoolIcon,
  TrendingUp as TrendingIcon,
  Timeline as TimelineIcon,
  Psychology as PsychologyIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Verified as VerifiedIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  SportsBasketball as BasketballIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AIIcon,
  WorkspacePremium as PremiumIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const InfoPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 32 }} />,
      title: 'AI-Powered Predictions',
      description: 'Our machine learning models analyze millions of data points to generate accurate prop projections and betting recommendations.',
      color: '#8b5cf6'
    },
    {
      icon: <TimelineIcon sx={{ fontSize: 32 }} />,
      title: 'Real-Time Analytics',
      description: 'Live game tracking with minute-by-minute updates, player performance metrics, and dynamic odds analysis.',
      color: '#3b82f6'
    },
    {
      icon: <TrendingIcon sx={{ fontSize: 32 }} />,
      title: 'Historical Data',
      description: 'Access full season historical data, trend analysis, and performance patterns for informed decision-making.',
      color: '#10b981'
    },
    {
      icon: <PsychologyIcon sx={{ fontSize: 32 }} />,
      title: 'Parlay Architect',
      description: 'Build optimized parlays with correlated outcomes analysis and expected value calculations.',
      color: '#f59e0b'
    }
  ];

  const howItWorks = [
    {
      title: 'Sign Up & Choose Your Plan',
      description: 'Create your account and select the subscription tier that matches your needs. Start with a 7-day free trial.',
      icon: <SchoolIcon />
    },
    {
      title: 'Explore Analytics Dashboard',
      description: 'Access real-time player stats, team matchups, and AI-generated predictions for your favorite sports.',
      icon: <AnalyticsIcon />
    },
    {
      title: 'Generate Winning Picks',
      description: 'Use our generators to get AI-powered prop predictions, parlay recommendations, and betting insights.',
      icon: <AIIcon />
    },
    {
      title: 'Track & Optimize',
      description: 'Monitor your results, adjust strategies, and leverage advanced analytics to improve your edge.',
      icon: <TrendingIcon />
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Users', icon: <VerifiedIcon /> },
    { value: '85%', label: 'Prediction Accuracy', icon: <CheckIcon /> },
    { value: '24/7', label: 'Support', icon: <SpeedIcon /> },
    { value: '100%', label: 'Data Security', icon: <SecurityIcon /> }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: theme.palette.mode === 'dark' ? '#0a0f1c' : '#f8fafc',
      pb: 8
    }}>
      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)',
        color: 'white',
        pt: { xs: 6, md: 8 },
        pb: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<InfoIcon />}
                label="ABOUT OUR PLATFORM"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  mb: 3,
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)'
                }}
              />
              <Typography variant="h2" sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 2
              }}>
                Your Ultimate Sports<br />Analytics Platform
              </Typography>
              <Typography variant="h6" sx={{
                opacity: 0.9,
                maxWidth: 600,
                mb: 4
              }}>
                Empowering bettors with AI-driven insights, real-time data, and professional-grade analytics.
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: '#1E3C72',
                  px: 4,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/pricing')}
              >
                Get Started Free
              </Button>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper sx={{
                p: 3,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <Typography variant="h6" gutterBottom>
                  🏆 Trusted by Thousands
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {stats.map((stat, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: '#f59e0b' }}>{stat.icon}</Box>
                      <Box>
                        <Typography fontWeight="bold">{stat.value}</Typography>
                        <Typography variant="caption">{stat.label}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" onClick={() => navigate('/home')} sx={{ cursor: 'pointer' }}>
            Home
          </Link>
          <Typography color="text.primary">Info</Typography>
        </Breadcrumbs>

        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight="bold">{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Features Section */}
        <Typography variant="h3" fontWeight="bold" textAlign="center" sx={{ mb: 2 }}>
          Powerful Features
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 5, maxWidth: 700, mx: 'auto' }}>
          Everything you need to gain a competitive edge in sports betting
        </Typography>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(feature.color, 0.1),
                    color: feature.color,
                    mb: 2
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* How It Works Section */}
        <Paper sx={{ p: 4, mb: 8, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Typography variant="h3" fontWeight="bold" textAlign="center" sx={{ mb: 2 }}>
            How It Works
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 5 }}>
            Get started in 4 simple steps
          </Typography>

          <Stepper orientation="vertical" sx={{ maxWidth: 600, mx: 'auto' }}>
            {howItWorks.map((step, index) => (
              <Step key={index} active={true}>
                <StepLabel StepIconComponent={() => (
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    {index + 1}
                  </Avatar>
                )}>
                  <Typography variant="h6" fontWeight="bold">{step.title}</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Why Choose Us Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Why Choose Sports Analytics Pro?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We combine cutting-edge AI technology with deep sports knowledge to deliver unparalleled insights.
            </Typography>
            <List>
              {[
                'Industry-leading prediction accuracy (85%+)',
                'Real-time data from 10+ sports leagues',
                'Proprietary AI models trained on millions of games',
                'Comprehensive analytics dashboard',
                '24/7 customer support',
                '7-day free trial, cancel anytime'
              ].map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckIcon sx={{ color: '#10b981' }} />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{
              p: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 3,
              height: '100%'
            }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                🚀 Ready to Level Up?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Join thousands of bettors who've already discovered the power of AI-driven sports analytics.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate('/pricing')}
                sx={{ mt: 2 }}
              >
                Start Your 7-Day Free Trial
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                No credit card required • Cancel anytime
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default InfoPage;
