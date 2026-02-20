import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';
import SportsFootballIcon from '@mui/icons-material/SportsFootball';
import SportsBaseballIcon from '@mui/icons-material/SportsBaseball';

interface SeasonInfo {
  league: string;
  phase: string;
  nextEvent: string;
  daysLeft: number;
  progress: number; // 0-100
  color: string;
  icon: React.ReactNode;
}

const SeasonStatusScreen: React.FC = () => {
  const [tabIndex, setTabIndex] = React.useState(0);

  const seasons: SeasonInfo[] = [
    {
      league: 'NBA',
      phase: 'Regular Season',
      nextEvent: 'Playoffs Start',
      daysLeft: 45,
      progress: 68,
      color: '#ff9800',
      icon: <SportsBasketballIcon />,
    },
    {
      league: 'NHL',
      phase: 'Regular Season',
      nextEvent: 'Trade Deadline',
      daysLeft: 24,
      progress: 72,
      color: '#2196f3',
      icon: <SportsHockeyIcon />,
    },
    {
      league: 'NFL',
      phase: 'Offseason',
      nextEvent: 'NFL Draft',
      daysLeft: 60,
      progress: 20,
      color: '#4caf50',
      icon: <SportsFootballIcon />,
    },
    {
      league: 'MLB',
      phase: 'Spring Training',
      nextEvent: 'Opening Day',
      daysLeft: 30,
      progress: 15,
      color: '#f44336',
      icon: <SportsBaseballIcon />,
    },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <TimelineIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          Season Status 2026
        </Typography>
      </Box>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }} centered>
        {seasons.map(s => (
          <Tab key={s.league} label={s.league} icon={s.icon} iconPosition="start" />
        ))}
      </Tabs>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {seasons[tabIndex].league} – {seasons[tabIndex].phase}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">Season Progress</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={seasons[tabIndex].progress}
                  sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2">{seasons[tabIndex].progress}%</Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                label={`${seasons[tabIndex].daysLeft} days until ${seasons[tabIndex].nextEvent}`}
                color="primary"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Key Dates</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">• {seasons[tabIndex].nextEvent}: in {seasons[tabIndex].daysLeft} days</Typography>
              <Typography variant="body2">• All‑Star Break: completed</Typography>
              <Typography variant="body2">• Playoffs: starts May 2026</Typography>
              <Typography variant="body2">• Draft: June 2026</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>League‑wide News</Typography>
            <Typography variant="body2" paragraph>
              • {seasons[tabIndex].league} standings are heating up as the {seasons[tabIndex].nextEvent.toLowerCase()} approaches.
            </Typography>
            <Typography variant="body2" paragraph>
              • Use the filters on the Fantasy Hub to target players from teams still in contention.
            </Typography>
            <Typography variant="body2">
              • Check back daily for updated playoff odds and draft projections.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SeasonStatusScreen;
