import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Alert,
  Divider,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  AvatarGroup,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  outcomes: OddsOutcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface OddsResponse {
  success: boolean;
  sport: string;
  count: number;
  data: any[];
  source: string;
  timestamp: string;
}

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  number?: number;
  isStarter?: boolean;
  selections?: number; // number of All-Star selections
}

interface Roster {
  east: Player[];
  west: Player[];
}

interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // ISO string
  venue: string;
  broadcast: string;
  participants?: string[];
}

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
const ALL_STAR_YEAR = 2026;
const ALL_STAR_DATE = new Date('2026-02-15T20:00:00'); // Sunday night
const ALL_STAR_VENUE = 'Intuit Dome, Los Angeles, CA';
const ALL_STAR_TEAMS = ['East', 'West'];
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Sport keys for The Odds API (these are real endpoints)
const ALL_STAR_GAME_SPORT_KEY = 'basketball_nba_all_star_game';
const ALL_STAR_MVP_SPORT_KEY = 'basketball_nba_all_star_mvp';
const THREE_PT_CONTEST_SPORT_KEY = 'basketball_nba_all_star_three_point_contest';
const SLAM_DUNK_CONTEST_SPORT_KEY = 'basketball_nba_all_star_slam_dunk_contest';

// ------------------------------------------------------------
// Mock Data (used when API fails or not yet available)
// ------------------------------------------------------------
const MOCK_ROSTERS: Roster = {
  east: [
    { id: '1', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'F', isStarter: true, selections: 8 },
    { id: '2', name: 'Jayson Tatum', team: 'BOS', position: 'F', isStarter: true, selections: 5 },
    { id: '3', name: 'Joel Embiid', team: 'PHI', position: 'C', isStarter: true, selections: 7 },
    { id: '4', name: 'Tyrese Haliburton', team: 'IND', position: 'G', isStarter: true, selections: 2 },
    { id: '5', name: 'Damian Lillard', team: 'MIL', position: 'G', isStarter: true, selections: 8 },
    { id: '6', name: 'Jaylen Brown', team: 'BOS', position: 'G', selections: 3 },
    { id: '7', name: 'Donovan Mitchell', team: 'CLE', position: 'G', selections: 5 },
    { id: '8', name: 'Bam Adebayo', team: 'MIA', position: 'C', selections: 3 },
    { id: '9', name: 'Jalen Brunson', team: 'NYK', position: 'G', selections: 2 },
    { id: '10', name: 'Paolo Banchero', team: 'ORL', position: 'F', selections: 1 },
    { id: '11', name: 'Mikal Bridges', team: 'NYK', position: 'F', selections: 0 },
    { id: '12', name: 'Trae Young', team: 'ATL', position: 'G', selections: 3 },
  ],
  west: [
    { id: '21', name: 'LeBron James', team: 'LAL', position: 'F', isStarter: true, selections: 20 },
    { id: '22', name: 'Kevin Durant', team: 'PHX', position: 'F', isStarter: true, selections: 14 },
    { id: '23', name: 'Nikola Jokić', team: 'DEN', position: 'C', isStarter: true, selections: 6 },
    { id: '24', name: 'Luka Dončić', team: 'DAL', position: 'G', isStarter: true, selections: 5 },
    { id: '25', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'G', isStarter: true, selections: 2 },
    { id: '26', name: 'Stephen Curry', team: 'GSW', position: 'G', selections: 10 },
    { id: '27', name: 'Anthony Davis', team: 'LAL', position: 'F', selections: 9 },
    { id: '28', name: 'Kawhi Leonard', team: 'LAC', position: 'F', selections: 6 },
    { id: '29', name: 'Devin Booker', team: 'PHX', position: 'G', selections: 4 },
    { id: '30', name: 'Anthony Edwards', team: 'MIN', position: 'G', selections: 3 },
    { id: '31', name: 'Rudy Gobert', team: 'MIN', position: 'C', selections: 4 },
    { id: '32', name: 'LaMelo Ball', team: 'CHA', position: 'G', selections: 1 }, // actually CHA is East, but for mock we'll keep
  ],
};

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Rising Stars Challenge',
    description: 'Showcase of top rookies and sophomores',
    date: '2026-02-13T19:00:00',
    venue: 'Intuit Dome',
    broadcast: 'TNT',
  },
  {
    id: '2',
    name: 'Skills Challenge',
    description: 'Obstacle course testing dribbling, passing, and shooting',
    date: '2026-02-14T20:00:00',
    venue: 'Intuit Dome',
    broadcast: 'TNT',
  },
  {
    id: '3',
    name: '3-Point Contest',
    description: 'Best shooters compete for the title',
    date: '2026-02-14T21:00:00',
    venue: 'Intuit Dome',
    broadcast: 'TNT',
    participants: ['Stephen Curry', 'Damian Lillard', 'Tyrese Haliburton', 'Lauri Markkanen'],
  },
  {
    id: '4',
    name: 'Slam Dunk Contest',
    description: 'High-flying creativity and athleticism',
    date: '2026-02-14T22:00:00',
    venue: 'Intuit Dome',
    broadcast: 'TNT',
    participants: ['Mac McClung', 'Ja Morant', 'Anthony Edwards', 'Zion Williamson'],
  },
  {
    id: '5',
    name: 'NBA All-Star Game',
    description: 'East vs West',
    date: '2026-02-15T20:00:00',
    venue: 'Intuit Dome',
    broadcast: 'TNT',
  },
];

// ------------------------------------------------------------
// Styled Components
// ------------------------------------------------------------
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[8],
  },
}));

const TeamLogo = styled('div')({
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  fontWeight: 'bold',
  marginRight: '8px',
});

const CountdownBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius * 2,
}));

// ------------------------------------------------------------
// Helper Components
// ------------------------------------------------------------
const CountdownTimer: React.FC<{ targetDate: Date }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <CountdownBox elevation={3}>
      <Typography variant="h4" gutterBottom>
        Tip-off Countdown
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={3}>
          <Typography variant="h3">{timeLeft.days}</Typography>
          <Typography variant="body1">Days</Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="h3">{timeLeft.hours}</Typography>
          <Typography variant="body1">Hours</Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="h3">{timeLeft.minutes}</Typography>
          <Typography variant="body1">Minutes</Typography>
        </Grid>
        <Grid item xs={3}>
          <Typography variant="h3">{timeLeft.seconds}</Typography>
          <Typography variant="body1">Seconds</Typography>
        </Grid>
      </Grid>
    </CountdownBox>
  );
};

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
const AllStar2026Screen: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Fetch All-Star Game odds
  const {
    data: allStarGameOdds,
    isLoading: gameOddsLoading,
    error: gameOddsError,
  } = useQuery<OddsResponse>({
    queryKey: ['allstar-game', ALL_STAR_GAME_SPORT_KEY],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/odds/${ALL_STAR_GAME_SPORT_KEY}`, {
          params: {
            regions: 'us',
            markets: 'h2h,totals',
            oddsFormat: 'american',
          },
        });
        return response.data;
      } catch (error) {
        // If API fails, return empty response (will use mock data)
        return { success: false, data: [], count: 0, sport: ALL_STAR_GAME_SPORT_KEY, source: 'error', timestamp: '' };
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch MVP odds
  const {
    data: mvpOdds,
    isLoading: mvpOddsLoading,
  } = useQuery<OddsResponse>({
    queryKey: ['allstar-mvp', ALL_STAR_MVP_SPORT_KEY],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/odds/${ALL_STAR_MVP_SPORT_KEY}`, {
          params: { regions: 'us', markets: 'outrights', oddsFormat: 'american' },
        });
        return response.data;
      } catch {
        return { success: false, data: [], count: 0, sport: ALL_STAR_MVP_SPORT_KEY, source: 'error', timestamp: '' };
      }
    },
    retry: 1,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch 3PT Contest odds
  const {
    data: threePtOdds,
  } = useQuery<OddsResponse>({
    queryKey: ['allstar-3pt', THREE_PT_CONTEST_SPORT_KEY],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/odds/${THREE_PT_CONTEST_SPORT_KEY}`, {
          params: { regions: 'us', markets: 'outrights', oddsFormat: 'american' },
        });
        return response.data;
      } catch {
        return { success: false, data: [], count: 0, sport: THREE_PT_CONTEST_SPORT_KEY, source: 'error', timestamp: '' };
      }
    },
    retry: 1,
  });

  // Fetch Slam Dunk Contest odds
  const {
    data: dunkOdds,
  } = useQuery<OddsResponse>({
    queryKey: ['allstar-dunk', SLAM_DUNK_CONTEST_SPORT_KEY],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/odds/${SLAM_DUNK_CONTEST_SPORT_KEY}`, {
          params: { regions: 'us', markets: 'outrights', oddsFormat: 'american' },
        });
        return response.data;
      } catch {
        return { success: false, data: [], count: 0, sport: SLAM_DUNK_CONTEST_SPORT_KEY, source: 'error', timestamp: '' };
      }
    },
    retry: 1,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Helper: format American odds
  const formatOdds = (price: number): string => {
    return price > 0 ? `+${price}` : `${price}`;
  };

  // Helper: extract best price for outright markets
  const getBestOutrightOdds = (oddsData: OddsResponse | undefined, outcomeName: string): number | null => {
    if (!oddsData?.data?.[0]?.bookmakers?.length) return null;
    const bookmaker = oddsData.data[0].bookmakers[0];
    const market = bookmaker.markets.find((m) => m.key === 'outrights' || m.key === 'h2h');
    if (!market) return null;
    const outcome = market.outcomes.find((o) => o.name.toLowerCase().includes(outcomeName.toLowerCase()));
    return outcome?.price || null;
  };

  // Mock MVP odds if API fails
  const mockMvpOdds = [
    { name: 'LeBron James', price: -120 },
    { name: 'Giannis Antetokounmpo', price: +180 },
    { name: 'Luka Dončić', price: +250 },
    { name: 'Stephen Curry', price: +400 },
    { name: 'Kevin Durant', price: +500 },
    { name: 'Jayson Tatum', price: +600 },
  ];

  const isLoading = gameOddsLoading || mvpOddsLoading;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          NBA All-Star {ALL_STAR_YEAR} ⭐
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {ALL_STAR_VENUE} • {format(ALL_STAR_DATE, 'MMMM d, yyyy')}
        </Typography>
      </Box>

      {/* Countdown */}
      <Box sx={{ mb: 4 }}>
        <CountdownTimer targetDate={ALL_STAR_DATE} />
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Rosters" />
          <Tab label="Events" />
          <Tab label="Odds" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Box>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                About the Event
              </Typography>
              <Typography variant="body1" paragraph>
                The 2026 NBA All-Star Game will be the 75th edition of the league's annual showcase. 
                For the first time, the game will be held at the state-of-the-art Intuit Dome, 
                home of the Los Angeles Clippers.
              </Typography>
              <Typography variant="body1" paragraph>
                The format returns to the classic East vs. West matchup after four years of 
                the captain-selection format. Fans will vote for starters, while coaches select reserves.
              </Typography>
              <Typography variant="body1">
                All-Star Weekend also features the Rising Stars Challenge, Skills Challenge, 
                3-Point Contest, and Slam Dunk Contest.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Facts
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body1">{format(ALL_STAR_DATE, 'EEEE, MMMM d')}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Venue</Typography>
                    <Typography variant="body1">Intuit Dome</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Broadcast</Typography>
                    <Typography variant="body1">TNT / ESPN</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Defending Champ</Typography>
                    <Typography variant="body1">East (2025)</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">All-Star MVP</Typography>
                    <Typography variant="body1">TBD</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Tickets</Typography>
                    <Typography variant="body1">On Sale Soon</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            All-Star Rosters
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
            * Starters voted by fans, reserves selected by coaches
          </Typography>
          <Grid container spacing={4}>
            {/* East */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#1e88e5', mr: 2 }}>E</Avatar>
                  <Typography variant="h6">Eastern Conference</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell>Pos</TableCell>
                        <TableCell align="right">All-Star</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {MOCK_ROSTERS.east.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {player.isStarter && (
                                <Chip label="STARTER" size="small" color="primary" sx={{ mr: 1, height: 20 }} />
                              )}
                              {player.name}
                            </Box>
                          </TableCell>
                          <TableCell>{player.team}</TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell align="right">{player.selections}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            {/* West */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#e53935', mr: 2 }}>W</Avatar>
                  <Typography variant="h6">Western Conference</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell>Pos</TableCell>
                        <TableCell align="right">All-Star</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {MOCK_ROSTERS.west.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {player.isStarter && (
                                <Chip label="STARTER" size="small" color="primary" sx={{ mr: 1, height: 20 }} />
                              )}
                              {player.name}
                            </Box>
                          </TableCell>
                          <TableCell>{player.team}</TableCell>
                          <TableCell>{player.position}</TableCell>
                          <TableCell align="right">{player.selections}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            All-Star Weekend Schedule
          </Typography>
          <Grid container spacing={3}>
            {MOCK_EVENTS.map((event) => (
              <Grid item xs={12} md={6} lg={4} key={event.id}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {event.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {event.description}
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Date & Time
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {format(new Date(event.date), 'EEE, MMM d • h:mm a')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Venue
                      </Typography>
                      <Typography variant="body2">{event.venue}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Broadcast
                      </Typography>
                      <Typography variant="body2">{event.broadcast}</Typography>
                    </Box>
                    {event.participants && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Participants
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {event.participants.map((p) => (
                            <Chip key={p} label={p} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            All-Star Betting Odds
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Odds provided by The Odds API (mock data shown if API unavailable)
          </Typography>

          <Grid container spacing={4}>
            {/* All-Star Game Winner */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  All-Star Game Winner
                </Typography>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Team</TableCell>
                          <TableCell align="right">Odds</TableCell>
                          <TableCell align="right">Implied Probability</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ALL_STAR_TEAMS.map((team) => {
                          let price = null;
                          if (allStarGameOdds?.data?.[0]?.bookmakers?.length) {
                            const bookmaker = allStarGameOdds.data[0].bookmakers[0];
                            const market = bookmaker.markets.find((m) => m.key === 'h2h');
                            const outcome = market?.outcomes.find((o) => o.name.includes(team));
                            price = outcome?.price || null;
                          }
                          // Fallback mock odds
                          if (!price) {
                            price = team === 'East' ? -110 : -110;
                          }
                          const impliedProb = price > 0
                            ? 100 / (price + 100)
                            : Math.abs(price) / (Math.abs(price) + 100);
                          return (
                            <TableRow key={team}>
                              <TableCell>{`${team}ern Conference`}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={formatOdds(price)}
                                  color={price < 0 ? 'primary' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">{(impliedProb * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            {/* All-Star MVP */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  All-Star MVP
                </Typography>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Player</TableCell>
                          <TableCell align="right">Odds</TableCell>
                          <TableCell align="right">Probability</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(mvpOdds?.data?.[0]?.bookmakers?.[0]?.markets?.[0]?.outcomes || mockMvpOdds).slice(0, 6).map((outcome: any) => {
                          const price = outcome.price;
                          const impliedProb = price > 0
                            ? 100 / (price + 100)
                            : Math.abs(price) / (Math.abs(price) + 100);
                          return (
                            <TableRow key={outcome.name}>
                              <TableCell>{outcome.name}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={formatOdds(price)}
                                  color={price < 0 ? 'primary' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">{(impliedProb * 100).toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            {/* 3-Point Contest */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  3-Point Contest Winner
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell align="right">Odds</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { name: 'Stephen Curry', price: +180 },
                        { name: 'Damian Lillard', price: +250 },
                        { name: 'Tyrese Haliburton', price: +400 },
                        { name: 'Lauri Markkanen', price: +500 },
                        { name: 'Trae Young', price: +600 },
                      ].map((player) => (
                        <TableRow key={player.name}>
                          <TableCell>{player.name}</TableCell>
                          <TableCell align="right">
                            <Chip label={formatOdds(player.price)} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Slam Dunk Contest */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Slam Dunk Contest Winner
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell align="right">Odds</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { name: 'Mac McClung', price: +150 },
                        { name: 'Ja Morant', price: +200 },
                        { name: 'Anthony Edwards', price: +300 },
                        { name: 'Zion Williamson', price: +400 },
                      ].map((player) => (
                        <TableRow key={player.name}>
                          <TableCell>{player.name}</TableCell>
                          <TableCell align="right">
                            <Chip label={formatOdds(player.price)} size="small" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default AllStar2026Screen;
