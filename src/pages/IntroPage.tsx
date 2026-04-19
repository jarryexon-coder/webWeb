// src/pages/IntroPage.tsx
import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  Divider,
  Chip,
  useTheme
} from '@mui/material';
import {
  SportsBasketball as BasketballIcon,
  SportsFootball as FootballIcon,
  SportsBaseball as BaseballIcon,
  SportsHockey as HockeyIcon,
  SportsTennis as TennisIcon,
  GolfCourse as GolfIcon,
  EmojiEvents as TrophyIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Psychology as AiIcon,
  MenuBook as NewsIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Sample data arrays (replace with your original content if needed)
const capabilities = [
  { icon: <AiIcon fontSize="large" />, title: 'AI Predictions', description: 'Machine learning models for player projections.' },
  { icon: <AnalyticsIcon fontSize="large" />, title: 'Advanced Analytics', description: 'Real-time stats and trends.' },
  { icon: <ShieldIcon fontSize="large" />, title: 'Responsible Tools', description: 'Simulated returns for entertainment.' },
];

const sports = [
  { name: 'NBA', icon: <BasketballIcon /> },
  { name: 'NFL', icon: <FootballIcon /> },
  { name: 'MLB', icon: <BaseballIcon /> },
  { name: 'NHL', icon: <HockeyIcon /> },
  { name: 'Tennis', icon: <TennisIcon /> },
  { name: 'Golf', icon: <GolfIcon /> },
];

const IntroPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleExploreNow = () => navigate('/login');
  const handleLaunchApp = () => navigate('/login');

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 4, md: 6 },
            mb: 6,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
            color: 'white',
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Sports Fantasy Analytics Platform
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Welcome to the Ultimate Sports Fantasy & Analytics Intelligence Hub
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleExploreNow}
            sx={{
              bgcolor: 'white',
              color: theme.palette.primary.main,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              px: 4,
              py: 1.5,
              fontSize: '1.2rem',
              mr: 2
            }}
          >
            Explore Now
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleLaunchApp}
            sx={{
              borderColor: 'white',
              color: 'white',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              px: 4,
              py: 1.5,
              fontSize: '1.2rem'
            }}
          >
            Launch App
          </Button>
        </Paper>

        {/* Capabilities Section */}
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
          What We Offer
        </Typography>
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {capabilities.map((item, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h6" gutterBottom>{item.title}</Typography>
                  <Typography color="text.secondary">{item.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Sports Covered */}
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
          Sports Covered
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mb: 6 }}>
          {sports.map((sport, idx) => (
            <Chip
              key={idx}
              icon={sport.icon}
              label={sport.name}
              variant="outlined"
              sx={{ px: 1, py: 2, fontSize: '1rem' }}
            />
          ))}
        </Box>

        {/* Disclaimer Footer */}
        <Box
          sx={{
            fontSize: '12px',
            textAlign: 'center',
            marginTop: '20px',
            padding: '16px',
            color: '#666',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
          }}
        >
          For entertainment and informational purposes only. No real‑money gambling is offered or facilitated.
          All statistics and projections are simulated.
        </Box>
      </Container>
    </Box>
  );
};

export default IntroPage;
