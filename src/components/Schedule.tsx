import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

interface ScheduleProps {
  sport?: string;          // optional filter by sport (e.g., 'NBA', 'NFL')
  date?: string;           // optional date (ISO string or similar)
  league?: string;         // optional league identifier
}

/**
 * Schedule component – displays a list of games/events.
 * TODO: Replace placeholder with actual API data when backend is ready.
 */
const Schedule: React.FC<ScheduleProps> = ({ sport = 'All', date, league }) => {
  // Mock data – replace with real data fetching later
  const mockEvents = [
    { id: 1, homeTeam: 'Lakers', awayTeam: 'Celtics', time: '7:30 PM ET', sport: 'NBA' },
    { id: 2, homeTeam: 'Yankees', awayTeam: 'Red Sox', time: '8:00 PM ET', sport: 'MLB' },
    { id: 3, homeTeam: 'Chiefs', awayTeam: 'Raiders', time: '4:25 PM ET', sport: 'NFL' },
  ];

  const filteredEvents = mockEvents.filter(event => 
    sport === 'All' || event.sport === sport
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Schedule {sport !== 'All' ? `– ${sport}` : ''}
      </Typography>
      <Grid container spacing={2}>
        {filteredEvents.map(event => (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">
                {event.awayTeam} @ {event.homeTeam}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event.time}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      {filteredEvents.length === 0 && (
        <Typography color="text.secondary">No events scheduled.</Typography>
      )}
    </Box>
  );
};

export default Schedule;
