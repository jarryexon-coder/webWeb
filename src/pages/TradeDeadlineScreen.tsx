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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimerIcon from '@mui/icons-material/Timer';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import SportsHockeyIcon from '@mui/icons-material/SportsHockey';

const TradeDeadlineScreen: React.FC = () => {
  const daysLeft = 24; // from FantasyHubScreen
  const rumors = [
    { player: 'Connor McDavid', team: 'EDM', rumor: 'Linked to multiple Eastern contenders', confidence: 'High' },
    { player: 'Cale Makar', team: 'COL', rumor: 'Avalanche listening to offers', confidence: 'Medium' },
    { player: 'Auston Matthews', team: 'TOR', rumor: 'Extension talks stall, trade possible?', confidence: 'Low' },
    { player: 'Igor Shesterkin', team: 'NYR', rumor: 'Goaltending market heating up', confidence: 'High' },
  ];

const playersOnBlock = [
  { name: 'John Tavares', team: 'TOR', pos: 'C', salary: '11M' },
  { name: 'Erik Karlsson', team: 'SJS', pos: 'D', salary: '11.5M' },
  { name: 'Patrick Kane', team: 'DET', pos: 'RW', salary: '10.5M' },
  { name: 'Jacob Markstrom', team: 'CGY', pos: 'G', salary: '6M' },
];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <CompareArrowsIcon sx={{ fontSize: 48, color: 'warning.main' }} />
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            NHL Trade Deadline 2026
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            March 7, 2026 • {daysLeft} days remaining
          </Typography>
        </Box>
        <Chip label="HOT RUMORS" color="warning" sx={{ ml: 'auto' }} />
      </Box>

      <Alert severity="info" sx={{ mb: 4 }}>
        The trade deadline is approaching fast. Player values in fantasy may change dramatically – stay ahead!
      </Alert>

      <Grid container spacing={3}>
        {/* Countdown */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light' }}>
            <TimerIcon sx={{ fontSize: 48, color: 'warning.dark', mb: 1 }} />
            <Typography variant="h2" sx={{ fontWeight: 700, color: 'warning.dark' }}>
              {daysLeft}
            </Typography>
            <Typography variant="h6">Days Left</Typography>
          </Paper>
        </Grid>

        {/* Rumors Feed */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NewReleasesIcon color="error" /> Latest Rumors
            </Typography>
            <List>
              {rumors.map((r, idx) => (
                <React.Fragment key={idx}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{r.player[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {r.player} ({r.team})
                          </Typography>
                          <Chip label={r.confidence} size="small" color={r.confidence === 'High' ? 'error' : 'default'} />
                        </Box>
                      }
                      secondary={r.rumor}
                    />
                  </ListItem>
                  {idx < rumors.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Players on the Block */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🏒 Players Most Likely to Be Moved
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {playersOnBlock.map((p, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{p.team} • {p.pos}</Typography>
                      <Chip label={`$${p.salary}`} size="small" sx={{ mt: 1 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Impact on Fantasy */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>📊 Fantasy Impact</Typography>
            <Typography variant="body2" paragraph>
              • Players traded to contenders often see increased ice time and scoring opportunities.
            </Typography>
            <Typography variant="body2" paragraph>
              • Monitor line combinations – a new teammate can boost (or hurt) production.
            </Typography>
            <Typography variant="body2">
              • Use the “Trending” panel on the Fantasy Hub to catch rising values post‑deadline.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sx={{ textAlign: 'center' }}>
          <Button variant="contained" color="warning" size="large" startIcon={<SportsHockeyIcon />}>
            Track All Deadline Moves
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TradeDeadlineScreen;
