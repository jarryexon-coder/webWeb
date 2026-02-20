import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';

const AllStarWeekendScreen: React.FC = () => {
  const events = [
    { name: 'Rising Stars Challenge', date: 'Feb 13', time: '7:00 PM ET', location: 'Crypto.com Arena' },
    { name: 'Skills Challenge', date: 'Feb 14', time: '8:00 PM ET', location: 'Crypto.com Arena' },
    { name: '3‑Point Contest', date: 'Feb 14', time: '8:45 PM ET', location: 'Crypto.com Arena' },
    { name: 'Slam Dunk Contest', date: 'Feb 14', time: '9:30 PM ET', location: 'Crypto.com Arena' },
    { name: 'All‑Star Game', date: 'Feb 15', time: '8:00 PM ET', location: 'Crypto.com Arena' },
  ];

  const participants = [
    { name: 'LeBron James', team: 'LAL', event: 'All‑Star Game' },
    { name: 'Stephen Curry', team: 'GSW', event: '3‑Point Contest' },
    { name: 'Zion Williamson', team: 'NOP', event: 'Slam Dunk Contest' },
    { name: 'Victor Wembanyama', team: 'SAS', event: 'Rising Stars' },
    { name: 'Luka Dončić', team: 'DAL', event: 'All‑Star Game' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <SportsBasketballIcon sx={{ fontSize: 48, color: 'primary.main' }} />
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            🏀 NBA All‑Star Weekend 2026
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            February 13–15 • Los Angeles, CA
          </Typography>
        </Box>
        <Chip label="LIVE" color="error" sx={{ ml: 'auto' }} />
      </Box>

      {/* Countdown / Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <EventIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">2 Days</Typography>
            <Typography variant="body2">until tip‑off</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
            <LocationOnIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">Crypto.com Arena</Typography>
            <Typography variant="body2">Los Angeles, CA</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
            <EmojiEventsIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4">5 Events</Typography>
            <Typography variant="body2">over 3 days</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Event Schedule */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        📅 Event Schedule
      </Typography>
      <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
        {events.map((event, index) => (
          <Box key={index}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StarIcon sx={{ color: 'warning.main' }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{event.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Typography variant="body2" color="text.secondary">{event.date} • {event.time}</Typography>
                <Typography variant="body2" color="text.secondary">{event.location}</Typography>
              </Box>
            </Box>
            {index < events.length - 1 && <Divider />}
          </Box>
        ))}
      </Paper>

      {/* Featured Participants */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        ⭐ Featured Participants
      </Typography>
      <Grid container spacing={2}>
        {participants.map((p, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{p.name[0]}</Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{p.team} • {p.event}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="contained" size="large" startIcon={<EventIcon />}>
          Set Reminder
        </Button>
        <Button variant="outlined" size="large" startIcon={<StarIcon />}>
          View All Participants
        </Button>
      </Box>
    </Container>
  );
};

export default AllStarWeekendScreen;
