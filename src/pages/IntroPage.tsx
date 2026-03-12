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
import { useNavigate } from 'react-router-dom';   // ✅ ensure this import

const IntroPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Handlers for buttons
  const handleExploreNow = () => {
    navigate('/login');   // or navigate('/home') if you want to skip login; adjust as needed
  };

  const handleLaunchApp = () => {
    navigate('/login');   // could also check auth status, but for simplicity go to login
  };

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
            Welcome to the Ultimate Sports Fantasy & Betting Intelligence Hub
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleExploreNow}   // ✅ added onClick
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
            onClick={handleLaunchApp}    // ✅ added onClick
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

        {/* Rest of your intro content (unchanged) ... */}
      </Container>
    </Box>
  );
};

// Keep your data arrays (capabilities, sports) as before
const capabilities = [ /* ... */ ];
const sports = [ /* ... */ ];

export default IntroPage;
