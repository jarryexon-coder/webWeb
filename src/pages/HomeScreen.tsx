// src/pages/HomeScreen.tsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Container,
  Paper
} from '@mui/material';
import { Link } from 'react-router-dom';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SecurityIcon from '@mui/icons-material/Security';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import RocketOutlinedIcon from '@mui/icons-material/RocketOutlined';

const HomeScreen = () => {
  const mainCategories = [
    {
      title: 'All Access',
      description: 'Free tools for everyone',
      icon: <SportsBasketballIcon fontSize="large" />,
      path: '/all-access',
      color: '#1976d2'
    },
    {
      title: 'Super Stats',
      description: 'Advanced statistical analysis',
      icon: <TrendingUpIcon fontSize="large" />,
      path: '/super-stats',
      color: '#d32f2f'
    },
    {
      title: 'AI Tools',
      description: 'AI-powered insights & predictions',
      icon: <AutoAwesomeIcon fontSize="large" />,
      path: '/ai-generators',
      color: '#388e3c'
    },
    {
      title: 'Elite Tools',
      description: 'Premium features & utilities',
      icon: <SecurityIcon fontSize="large" />,
      path: '/elite-tools',
      color: '#7b1fa2'
    }
  ];

  const features = [
    {
      title: '94.7% Success Rate',
      description: 'Industry-leading prediction accuracy powered by proprietary AI models',
      icon: <EmojiEventsOutlinedIcon fontSize="large" />,
      color: '#10b981'
    },
    {
      title: 'PrizePicks Generator',
      description: 'Generate optimal PrizePicks selections with our advanced AI algorithms',
      icon: <CasinoOutlinedIcon fontSize="large" />,
      color: '#8b5cf6'
    },
    {
      title: 'Kalshi Market Intelligence',
      description: 'Real-time CFTC-regulated prediction market analytics with AI insights',
      icon: <TrendingUpIcon fontSize="large" />,
      color: '#ec4899'
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 6, 
        pt: 4,
        color: 'text.primary'
      }}>
        <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          🏀 Sports Analytics GPT
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Humanistic Approach to Analytics At Its Finest
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 800, mx: 'auto' }}>
          Experience the future of sports analytics with our cutting-edge platform
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          component={Link}
          to="/all-access"
          sx={{ mt: 2 }}
        >
          Get Started
        </Button>
      </Box>

      {/* Feature Highlights */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        Dashboard Overview
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature) => (
          <Grid item xs={12} md={4} key={feature.title}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ color: feature.color, mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
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

      {/* Main Categories */}
      <Typography variant="h4" gutterBottom sx={{ mt: 6, mb: 3, color: 'text.primary' }}>
        Quick Access
      </Typography>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {mainCategories.map((category) => (
          <Grid item xs={12} sm={6} md={3} key={category.title}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: category.color, mb: 2 }}>
                  {category.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {category.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {category.description}
                </Typography>
                <Button
                  component={Link}
                  to={category.path}
                  variant="outlined"
                  sx={{ borderColor: category.color, color: category.color }}
                >
                  Explore
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Stats Section */}
      <Paper sx={{ 
        p: 4, 
        mb: 6, 
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white'
      }}>
        <Typography variant="h4" gutterBottom>
          Platform Performance
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">94.7%</Typography>
              <Typography variant="body2">Prediction Accuracy</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">10K+</Typography>
              <Typography variant="body2">Daily Analysis</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">50+</Typography>
              <Typography variant="body2">AI Models</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">24/7</Typography>
              <Typography variant="body2">Live Updates</Typography>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="caption" sx={{ opacity: 0.8, fontStyle: 'italic', mt: 2, display: 'block' }}>
          Updated in real-time
        </Typography>
      </Paper>

      {/* Call to Action */}
      <Paper sx={{ 
        p: 4, 
        mb: 6, 
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        textAlign: 'center'
      }}>
        <RocketOutlinedIcon sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Ready to Elevate Your Game?
        </Typography>
        <Typography variant="body1" paragraph sx={{ maxWidth: 600, mx: 'auto', opacity: 0.9 }}>
          Join thousands of users making smarter decisions with our analytics platform
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          component={Link}
          to="/subscription"
          sx={{ 
            mt: 2,
            backgroundColor: 'white',
            color: '#10b981',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.9)'
            }
          }}
        >
          Start Free Trial
        </Button>
      </Paper>
    </Container>
  );
};

export default HomeScreen;
